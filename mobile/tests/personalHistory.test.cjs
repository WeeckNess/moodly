const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name, modules = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'require', js)(module.exports, module, key => { if (!(key in modules)) throw new Error('Unexpected import: ' + key); return modules[key]; });
  return module.exports;
}
const logic = load('personalHistoryLogic');
const trees = load('treeGeometry');
function harness(os) {
  const secure = new Map(), plain = new Map();
  const store = data => ({ getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async key => { data.delete(key); } });
  const secureAdapter = store(secure);
  const api = load('personalHistory', { 'react-native': { Platform: { OS: os } }, 'expo-secure-store': { getItemAsync: secureAdapter.getItem, setItemAsync: secureAdapter.setItem, deleteItemAsync: secureAdapter.removeItem }, '@react-native-async-storage/async-storage': { __esModule: true, default: store(plain) }, './personalHistoryLogic': logic, './treeGeometry': trees });
  return { api, secure, plain };
}
test('Un seul souvenir par jour, trente jours maximum, sans commentaire libre', () => {
  const entries = [{ day: '2026-09-01', score: 1, tags: [] }, { day: '2026-10-14', score: 3, tags: [], comment: 'privé' }, { day: '2026-10-14', score: 5, tags: ['Ambiance'] }, { day: '2026-10-16', score: 4, tags: [] }, { day: '2026-10-13', score: 9, tags: [] }, { day: '2026-10-00', score: 4, tags: [] }];
  assert.deepEqual(logic.retainPersonalMoods(entries, '2026-10-15'), [{ day: '2026-10-14', score: 5, tags: ['Ambiance'] }]);
  const clean = logic.retainPersonalMoods([{ day: '2026-10-14', score: 3, tags: [], comment: 'privé', name: 'Quelqu’un' }], '2026-10-15');
  assert.deepEqual(Object.keys(clean[0]), ['day', 'score', 'tags']);
  assert.deepEqual(logic.personalTrend([{ day: '2026-10-01', score: 1, tags: [] }, { day: '2026-10-14', score: 4, tags: [] }, { day: '2026-10-15', score: 2, tags: [] }], '2026-10-15'), { count: 2, average: 3 });
});
test('Le calendrier commence le lundi et couvre correctement le mois', () => {
  const cells = logic.monthCells('2026-10');
  assert.deepEqual(cells.slice(0, 4), [null, null, null, '2026-10-01']);
  assert.equal(cells.filter(Boolean).length, 31);
  assert.equal(cells.length % 7, 0);
  assert.equal(logic.monthCells('2028-02').filter(Boolean).length, 29);
});
test('L’adaptateur mobile utilise le stockage sécurisé et isole les comptes', async () => {
  const { api, secure, plain } = harness('ios');
  await api.savePersonalMood('account-a', { day: '2026-10-14', score: 4, tags: ['Charge'], comment: 'Brouillon à exclure' }, '2026-10-15');
  assert.equal((await api.readPersonalHistory('account-a', '2026-10-15')).length, 1);
  assert.deepEqual(await api.readPersonalHistory('account-b', '2026-10-15'), []);
  assert.equal(plain.size, 0);
  assert.deepEqual(Object.keys(JSON.parse(secure.get('eclaircie.history.account-a.2026-10-14'))), ['day', 'score', 'tags']);
  assert.ok([...secure.values()].every(value => Buffer.byteLength(value) < 2048));
  api.clearPersonalMemory();
  assert.equal((await api.readPersonalHistory('account-a', '2026-10-15'))[0].score, 4);
  await api.readPersonalHistory('account-a', '2026-12-01');
  assert.ok(!secure.has('eclaircie.history.account-a.2026-10-14'));
});
test('Sur le web réel aucun souvenir de santé n’est persisté', async () => {
  const { api, secure, plain } = harness('web');
  await api.savePersonalMood('account-a', { day: '2026-10-15', score: 2, tags: [] }, '2026-10-15');
  assert.equal((await api.readPersonalHistory('account-a', '2026-10-15')).length, 1);
  assert.equal(plain.size, 0); assert.equal(secure.size, 0);
  api.clearPersonalMemory();
  assert.deepEqual(await api.readPersonalHistory('account-a', '2026-10-15'), []);
});
test('Un nouveau profil reste vide et l’effacement ne recrée aucune donnée', async () => {
  const { api } = harness('ios');
  assert.deepEqual(await api.readPersonalHistory('account-a', '2026-10-15'), []);
  await api.savePersonalMood('account-a', { day: '2026-10-15', score: 4, tags: [] }, '2026-10-15');
  await api.clearPersonalHistory('account-a', '2026-10-15');
  api.clearPersonalMemory();
  assert.deepEqual(await api.readPersonalHistory('account-a', '2026-10-15'), []);
});
test('Les rapports ignorent les jours vides et comptent une raison une fois par journée', () => {
  const entries = [{ day: '2026-10-15', score: 2, tags: ['Charge', 'Charge'] }, { day: '2026-10-14', score: 4, tags: ['Charge', 'Ambiance'] }, { day: '2026-10-01', score: 5, tags: ['Ambiance'] }];
  assert.deepEqual(logic.personalReport(entries, '2026-10-15', 7), { count: 2, average: 3, tags: [['Charge', 2], ['Ambiance', 1]] });
  assert.equal(logic.personalReport(entries, '2026-10-15', 30).count, 3);
  assert.equal(logic.personalReport([], '2026-10-15', 7).average, null);
});
test('L’arbre grandit une fois par jour, sans régresser après une pause ou une purge', async () => {
  const { api } = harness('ios');
  await api.savePersonalMood('garden', { day: '2026-10-01', score: 1, tags: [] }, '2026-10-01');
  await api.savePersonalMood('garden', { day: '2026-10-01', score: 5, tags: [] }, '2026-10-01');
  assert.equal((await api.readGrowth('garden')).count, 1);
  await api.savePersonalMood('garden', { day: '2026-10-15', score: 1, tags: [] }, '2026-10-15');
  api.clearPersonalMemory();
  await api.readPersonalHistory('garden', '2026-12-01');
  assert.equal((await api.readGrowth('garden')).count, 2);
  assert.deepEqual(await api.readGrowth('other'), { count: 0, lastDay: null });
  await api.clearPersonalHistory('garden', '2026-12-01');
  assert.equal((await api.readGrowth('garden')).count, 0);
  assert.deepEqual([0, 1, 5, 12, 24, 100].map(logic.growthStage), [0, 1, 2, 3, 4, 4]);
});
test('Les contours des arbres gardent une topologie stable et une croissance continue', () => {
  const numbers = path => path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
  for (let species = 0; species <= 2; species += .25) for (const day of [0, .5, 1, 4.9, 5, 12, 24, 60]) for (let leaf = 0; leaf < 7; leaf++) {
    const path = trees.canopyPath(day, species, leaf);
    assert.equal((path.match(/Q/g) ?? []).length, 48);
    assert.ok(numbers(path).every(Number.isFinite));
    const before = numbers(trees.canopyPath(Math.max(0, day - .0001), species, leaf));
    const after = numbers(trees.canopyPath(day + .0001, species, leaf));
    assert.ok(before.every((value, i) => Math.abs(value - after[i]) < .1));
  }
  assert.notEqual(trees.canopyPath(24, 0, 0), trees.canopyPath(24, 1, 0));
  assert.notEqual(trees.canopyPath(24, 1, 0), trees.canopyPath(24, 2, 0));
  assert.ok(trees.trunkHeight(1, 0) > 30);
});
test('Le choix d’essence est privé, conservé sur mobile et supprimé avec le jardin', async () => {
  const { api } = harness('ios');
  assert.equal(await api.readTreeSpecies('a'), 'oak');
  await api.saveTreeSpecies('a', 'willow');
  api.clearPersonalMemory();
  assert.equal(await api.readTreeSpecies('a'), 'willow');
  assert.equal(await api.readTreeSpecies('b'), 'oak');
  await assert.rejects(() => api.saveTreeSpecies('a', 'invalid'));
  await api.clearPersonalHistory('a', '2026-10-15');
  assert.equal(await api.readTreeSpecies('a'), 'oak');
});
test('Le jardin enrichit progressivement le sol, la floraison puis les fruits', () => {
  assert.deepEqual(trees.gardenLife(0), { grass: 0, flowers: 0, blossom: 0, fruit: 0, abundance: 0 });
  assert.ok(trees.gardenLife(12).grass > 0);
  assert.equal(trees.gardenLife(24).fruit, 0);
  assert.ok(trees.gardenLife(35).blossom > .5);
  assert.equal(trees.gardenLife(60).blossom, 0);
  assert.equal(trees.gardenLife(60).fruit, 1);
  assert.equal(trees.gardenLife(100).abundance, 1);
  assert.equal(trees.nextGardenMilestone(24), 35);
  assert.equal(trees.nextGardenMilestone(35), 50);
  assert.equal(trees.nextGardenMilestone(100), null);
  for (let species = 0; species <= 2; species += .2) {
    const path = trees.fruitPath(species, .5);
    assert.equal((path.match(/L/g) ?? []).length, 24);
    assert.ok(!path.includes('NaN'));
  }
});
