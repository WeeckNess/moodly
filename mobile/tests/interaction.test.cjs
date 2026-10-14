const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} }; new Function('exports', 'module', js)(module.exports, module); return module.exports;
}
const { pointForValue, valueFromPoint } = load('dialMath');
const { nextSupportState } = load('supportLogic');
test('Le geste suit les cinq positions de l’arc, y compris ses extrémités', () => {
  for (const value of [1, 1.5, 2, 2.5, 3, 4, 4.7, 5]) {
    const point = pointForValue(value, 130, 160, 146);
    assert.ok(Math.abs(valueFromPoint(point.x, point.y, 160, 146) - value) < 1e-8);
  }
  assert.equal(valueFromPoint(240, 300, 160, 146), 5);
  assert.equal(valueFromPoint(80, 300, 160, 146), 1);
});
test('Trois Très mal sur des jours distincts déclenchent une seule invitation privée', () => {
  let state = { lowDays: [], promptedOn: null };
  for (const day of ['2026-10-10', '2026-10-11']) {
    const result = nextSupportState(state, day, 1); assert.equal(result.shouldPrompt, false); state = result.state;
  }
  const duplicate = nextSupportState(state, '2026-10-11', 1); assert.equal(duplicate.state.lowDays.length, 2); assert.equal(duplicate.shouldPrompt, false);
  const third = nextSupportState(state, '2026-10-12', 1); assert.equal(third.shouldPrompt, true);
  assert.equal(nextSupportState(third.state, '2026-10-12', 1).shouldPrompt, false);
  assert.equal(nextSupportState(third.state, '2026-10-13', 1).shouldPrompt, false);
});
test('Le compteur respecte les trente jours et ne compte pas les autres météos', () => {
  const old = { lowDays: ['2026-09-01', '2026-09-02'], promptedOn: null };
  const result = nextSupportState(old, '2026-10-14', 1); assert.deepEqual(result.state.lowDays, ['2026-10-14']); assert.equal(result.shouldPrompt, false);
  assert.deepEqual(nextSupportState(result.state, '2026-10-15', 4).state.lowDays, ['2026-10-14']);
});
