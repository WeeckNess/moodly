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
test('Trois météos Orage sur des jours distincts déclenchent une seule invitation privée', () => {
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

const { chartSegments, visibleMean } = load('chartGeometry');
test('Le graphe manager ne relie jamais les jours masqués et ne les assimile pas à zéro', () => {
  const data = [{ day: '2026-10-10', average: 4 }, { day: '2026-10-11', average: null }, { day: '2026-10-12', average: 2 }, { day: '2026-10-13', average: 3 }];
  const segments = chartSegments(data, 300, 216);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].from, 2);
  assert.equal(segments[0].to, 3);
  assert.ok(segments[0].y1 > segments[0].y2);
  assert.equal(visibleMean(data), 3);
  assert.equal(visibleMean([{ day: '2026-10-10', average: null }]), null);
  assert.deepEqual(chartSegments([{ day: '2026-10-10', average: null }], 240, 216), []);
  assert.equal(visibleMean([]), null);
});

const { dialGeometry } = load('dialMath');
test('La boule entière reste dans le SVG, notamment au sommet sur petit écran', () => {
  for (const width of [180, 230, 280, 320, 342, 360]) {
    for (const compact of [true, false]) {
      const { radius, cx, cy, height } = dialGeometry(width, compact);
      for (let step = 0; step <= 80; step++) {
        const point = pointForValue(1 + step / 20, radius, cx, cy);
        assert.ok(point.x - 17 >= 1.99 && point.x + 17 <= width - 1.99);
        assert.ok(point.y - 17 >= 1.99 && point.y + 17 <= height - 1.99);
      }
    }
  }
});

test('Les micro-mouvements météo bouclent sans rupture et restent dans leur cadre', () => {
  for (const layer of ['fill', 'ink']) {
    for (let value = 1; value <= 5; value += .25) {
      const first = weatherMorphPath(value, weatherContours, layer, 0);
      assert.equal(weatherMorphPath(value, weatherContours, layer, Math.PI * 2), first);
      for (const phase of [Math.PI / 4, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const path = weatherMorphPath(value, weatherContours, layer, phase);
        assert.equal((path.match(/M/g) || []).length, weatherContours[0][layer].length);
        for (const coordinate of path.match(/-?\d+(?:\.\d+)?/g).map(Number)) assert.ok(coordinate >= 0 && coordinate <= 256);
      }
    }
  }
  assert.notEqual(weatherMorphPath(3, weatherContours, 'ink', Math.PI / 2), weatherMorphPath(3, weatherContours, 'ink', 0));
});
test('Le nuage respire autour de son centre sans inclinaison et le détail de pluie reste local', () => {
  const { contourLife, detailDrift } = load('weatherMorphGeometry');
  for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const outer = contourLife(2, 0, phase), inner = contourLife(2, 1, phase);
    assert.deepEqual(outer, inner);
    assert.ok(Math.abs(outer.x - 1) <= .0081 && Math.abs(outer.y - 1) <= .0061);
    assert.equal(detailDrift(1, 128, phase), 0);
    assert.equal(detailDrift(2, 220, phase), 0);
  }
});
