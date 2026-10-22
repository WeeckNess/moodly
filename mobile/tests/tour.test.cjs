const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/components/tour/tourSteps.ts'), 'utf8');
const moduleCopy = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleCopy, moduleCopy.exports);
const { tourSteps, fitTourRect, tourCardTop } = moduleCopy.exports;
test('Une cible rognée reste dans l’écran et une cible hors champ disparaît', () => {
  assert.deepEqual(fitTourRect({ x: -12, y: -4, w: 390, h: 130 }, 375, 667), { x: 8, y: 8, w: 359, h: 124 });
  assert.equal(fitTourRect({ x: 20, y: 900, w: 200, h: 200 }, 375, 667), null);
  assert.equal(fitTourRect({ x: 20, y: -300, w: 200, h: 100 }, 375, 667), null);
});
test('La carte évite la cible lorsqu’il reste de la place et reste lisible en petit écran', () => {
  const high = { x: 20, y: 70, w: 300, h: 60 };
  const low = { x: 20, y: 540, w: 300, h: 60 };
  assert.ok(tourCardTop(high, 667, 300, 20) > high.y + high.h);
  assert.ok(tourCardTop(low, 667, 300, 20) + 300 < low.y);
  for (const h of [568, 667, 844]) for (const rect of [null, high, low, { x: 0, y: 50, w: 375, h: 700 }]) {
    const y = tourCardTop(rect, h, 300, 20);
    assert.ok(y >= 32 && y + 300 <= h - 32);
  }
});
test('Le manager découvre le collectif et sa météo privée, le salarié son arc', () => {
  const employee = tourSteps(false), manager = tourSteps(true);
  assert.ok(employee.some(step => step.id === 'mood' && step.gesture === 'swipe'));
  assert.ok(!employee.some(step => ['team', 'act', 'self'].includes(step.id)));
  assert.ok(manager.some(step => step.id === 'self' && step.body.includes('privée')));
  assert.ok(manager.some(step => step.id === 'team' && step.body.includes('cinq')));
  for (const steps of [employee, manager]) {
    assert.equal(steps[0].id, 'welcome');
    assert.equal(steps.at(-1).target, 'guide');
    assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
  }
});
