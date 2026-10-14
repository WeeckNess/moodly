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
const { continuousValueFromPoint } = load('dialMath');
test('L’ouverture de l’arc ne fait pas sauter le curseur à l’extrémité opposée', () => {
  assert.equal(continuousValueFromPoint(80, 300, 160, 146, 4.8), 5);
  assert.equal(continuousValueFromPoint(240, 300, 160, 146, 1.2), 1);
});
const { crossedStops } = load('dialMath');
test('Le retour haptique coïncide avec les points, pas les demi-paliers', () => {
  assert.deepEqual(crossedStops(1.49, 1.51), []);
  assert.deepEqual(crossedStops(1.99, 2.01), [2]);
  assert.deepEqual(crossedStops(2.01, 1.99), [2]);
  assert.deepEqual(crossedStops(1, 5), [2, 3, 4, 5]);
  assert.deepEqual(crossedStops(5, 1), [4, 3, 2, 1]);
  assert.deepEqual(crossedStops(2, 2.1), []);
  assert.deepEqual(crossedStops(2, 2), []);
});

const { weatherMorphPath } = load('weatherMorphGeometry');
const { weatherContours } = load('weatherContours');
test('Les vrais contours Phosphor se déforment continûment avec une topologie stable', () => {
  for (const layer of ['fill', 'ink']) {
    const count = weatherContours[0][layer].length;
    for (const frame of weatherContours) {
      assert.equal(frame[layer].length, count);
      assert.ok(frame[layer].every(ring => ring.length === 96));
    }
    for (let value = 1; value <= 5; value += 0.125) {
      const d = weatherMorphPath(value, weatherContours, layer);
      assert.equal((d.match(/M/g) || []).length, count);
      assert.ok(!d.includes('NaN')); assert.ok(!d.includes('Infinity'));
    }
    assert.notEqual(weatherMorphPath(4.5, weatherContours, layer), weatherMorphPath(4, weatherContours, layer));
    assert.notEqual(weatherMorphPath(4.5, weatherContours, layer), weatherMorphPath(5, weatherContours, layer));
    assert.equal(weatherMorphPath(0, weatherContours, layer), weatherMorphPath(1, weatherContours, layer));
    assert.equal(weatherMorphPath(6, weatherContours, layer), weatherMorphPath(5, weatherContours, layer));
  }
});
