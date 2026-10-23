const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/components/tour/tourSteps.ts'), 'utf8');
const moduleCopy = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleCopy, moduleCopy.exports);
const { tourSteps, tourLayout } = moduleCopy.exports;
test('Les scènes restent cadrées sur petit mobile, téléphone et bureau avec zones système', () => {
  for (const [w,h,top,bottom] of [[320,568,0,0],[390,844,47,34],[768,1024,24,20],[1280,800,0,0],[844,390,0,21]]) {
    const layout = tourLayout(w,h,top,bottom);
    assert.ok(layout.stageHeight >= 152 && layout.stageHeight <= 440);
    assert.ok(layout.gutter * 2 < w);
    assert.equal(layout.wide, w >= 900 && h >= 620);
  }
});
test('Le manager découvre le collectif et sa météo privée, le salarié son geste', () => {
  const employee = tourSteps(false), manager = tourSteps(true);
  assert.ok(employee.some(step => step.id === 'mood'));
  assert.ok(!employee.some(step => ['team', 'act', 'self'].includes(step.id)));
  assert.ok(manager.some(step => step.id === 'self' && step.body.includes('privé')));
  assert.ok(manager.some(step => step.id === 'team' && step.body.includes('cinq')));
  for (const steps of [employee, manager]) {
    assert.equal(steps[0].id, 'welcome');
    assert.equal(steps.at(-1).id, 'finish');
    assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
    assert.ok(steps.every(step => step.chapter && step.hint));
    assert.ok(steps.find(s => s.id === 'support').body.includes('aucune alerte automatique'));
  }
});
