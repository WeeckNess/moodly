const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/mood.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const sandbox = { exports: {}, Intl, Date }; vm.runInNewContext(compiled, sandbox);
const { safePoints, validateMood, dateRange } = sandbox.exports;
test('Un jour sous cinq réponses ne révèle aucune moyenne ; cinq réponses rendent le point visible', () => {
  const result = safePoints(['2026-10-10', '2026-10-11', '2026-10-12'], [
    { day: '2026-10-10', responseCount: 4, scoreSum: 20 }, { day: '2026-10-11', responseCount: 5, scoreSum: 17 },
  ]);
  assert.equal(result[0].average, null); assert.equal(result[1].average, 3.4); assert.equal(result[2].average, null);
  assert.equal(Object.keys(result[1]).join(','), 'day,average');
});
test('Refus des scores invalides, texte libre et champs permettant de forger une équipe ou une date', () => {
  for (const data of [null, { score: 0 }, { score: 6 }, { score: 2.5 }, { score: '4' }, { score: 4, tags: [42] }, { score: 4, tags: [''] }, { score: 4, tags: [' '.repeat(4)] }, { score: 4, tags: ['a'.repeat(81)] }, { score: 4, tags: Array(21).fill('Tag') }, { score: 4, team: 12 }, { score: 4, day: '2020-01-01' }, { score: 4, comment: 'hello' }]) assert.equal(validateMood(data), null);
  assert.equal(validateMood({ score: 4, tags: ['Charge', 'Charge'] }).tags.length, 1);
  assert.equal(validateMood({ score: 4, tags: ['Nouveau tag administrable'] }).tags[0], 'Nouveau tag administrable');
});
test('La fenêtre contient exactement 30 dates consécutives, y compris au changement d’heure', () => {
  const days = dateRange('2026-10-30'); assert.equal(days.length, 30); assert.equal(days[0], '2026-10-01'); assert.equal(days[29], '2026-10-30'); assert.equal(new Set(days).size, 30);
});
