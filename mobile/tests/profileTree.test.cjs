const test = require('node:test'), assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), path = require('node:path');
function load(name, imports = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', code)(mod, mod.exports, key => imports[key]);
  return mod.exports;
}
const growth = load('gardenAnimation'), tree = load('profileTree', { './gardenAnimation': growth });
const snapshot = day => [tree.profileTreeState(day), ...Array.from({ length: 10 }, (_, i) => tree.profileRoot(day, i)), ...tree.profileBranches.map((_, i) => tree.profileBranch(day, i)), ...tree.profileCanopy.map((_, i) => tree.profileLeaf(day, i)), ...tree.profileFlowers.map((_, i) => tree.profileFlower(day, i)), ...tree.profileFruits.map((_, i) => tree.profileFruit(day, i)), ...tree.profileSprigs.map((_, i) => tree.profileDetail(day, i)), ...tree.profileBranches.map((_, i) => tree.profileBud(day, i)), ...Array.from({length: 6}, (_, i) => tree.profileGrass(day, i))];
test('Le nouvel arbre évolue chaque jour sur les 100 jours, pas seulement aux stades', () => {
  for (let day = 1; day <= 100; day++) assert.notDeepEqual(snapshot(day), snapshot(day - 1), `jour ${day}`);
  assert.deepEqual(snapshot(-5), snapshot(0));
  assert.deepEqual(snapshot(150), snapshot(100));
  assert.deepEqual(snapshot(NaN), snapshot(0));
});
test('Les racines, branches, masses et fleurs grandissent continûment sans régresser', () => {
  for (const [fn, count] of [[tree.profileRoot, 10], [tree.profileBranch, tree.profileBranches.length], [tree.profileLeaf, tree.profileCanopy.length], [tree.profileFlower, tree.profileFlowers.length], [tree.profileFruit, tree.profileFruits.length], [tree.profileDetail, tree.profileSprigs.length], [tree.profileGrass, 6]]) {
    for (let i = 0; i < count; i++) {
      let previous = 0;
      for (let day = 0; day <= 100; day += .25) {
        const amount = fn(day, i);
        assert.ok(Number.isFinite(amount) && amount >= previous && amount <= 1);
        previous = amount;
      }
      assert.equal(previous, 1);
    }
  }
  assert.equal(tree.profileTreeState(0).trunk, 0);
  assert.equal(tree.profileTreeState(100).trunk, 1);
  assert.equal(tree.profileFlower(65, 0), 0);
  assert.ok(tree.profileFlower(76, 0) > 0);
  assert.ok(tree.profileRoot(7, 0) > 0);
  assert.ok(tree.profileTreeState(19).shoot > 0);
  assert.ok(tree.profileBranch(28, 0) > 0);
  assert.ok(tree.profileLeaf(48, 0) > 0);
});

test('Onze repères distincts et une couronne dense restent dans le cadre du dessin', () => {
  assert.equal(tree.profileMilestones.length, 11);
  assert.equal(new Set(tree.profileMilestones.map(s => s.day)).size, 11);
  assert.equal(tree.profileStage(38).label, 'Bourgeons');
  assert.equal(tree.profileStage(62).label, 'Couronne généreuse');
  assert.equal(tree.profileStage(86).label, 'Premiers fruits');
  assert.equal(tree.profileStage(94).label, 'Jardin vivant');
  assert.equal(tree.profileStage(100).label, 'Épanoui');
  assert.ok(tree.profileCanopy.length >= 18);
  for (const [x,y,r] of tree.profileCanopy) {
    assert.ok(x-r >= 0 && x+r <= 360 && y-r >= 0 && y+r <= 310);
  }
  assert.equal(tree.profileFruit(76,0),0);
  assert.ok(tree.profileBud(38,0)>0);
  assert.equal(tree.profileBud(100,0),0);
});
