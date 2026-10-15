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
function harness(os) {
  const secure = new Map(), plain = new Map();
  const store = data => ({ getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async key => { data.delete(key); } });
  const secureAdapter = store(secure);
  const api = load('personalHistory', { 'react-native': { Platform: { OS: os } }, 'expo-secure-store': { getItemAsync: secureAdapter.getItem, setItemAsync: secureAdapter.setItem, deleteItemAsync: secureAdapter.removeItem }, '@react-native-async-storage/async-storage': { __esModule: true, default: store(plain) }, './personalHistoryLogic': logic });
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
