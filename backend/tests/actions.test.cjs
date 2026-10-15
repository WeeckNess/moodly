const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), path = require('node:path');
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib', file + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }; new Function('module', 'exports', 'require', code)(module, module.exports, key => imports[key] ?? require(key)); return module.exports;
}
const api = load('teamActions', { './mood': load('mood') });
test('Le résultat d’une action n’est visible qu’après clôture et avec cinq retours', () => {
  const action = { documentId: 'a', title: 'Une action', dueDay: '2026-10-20', status: 'completed', reviewUntil: '2026-10-22', feedbackCount: 5, feedbackSum: 13 };
  assert.equal(api.actionSummary(action, '2026-10-22').feedback, null);
  assert.deepEqual(api.actionSummary(action, '2026-10-23').feedback, { count: 5, average: 2.6 });
  assert.equal(api.actionSummary({ ...action, feedbackCount: 4 }, '2026-10-23').feedback, null);
  assert.ok(!('feedbackSum' in api.actionSummary(action, '2026-10-23')));
});
test('Une action ne permet pas de forger l’équipe, le statut ou une échéance invalide', () => {
  const action = { title: 'Une action', dueDay: '2026-10-20' };
  assert.equal(api.validAction(action, '2026-10-15'), true);
  for (const value of [{ ...action, team: 1 }, { ...action, status: 'completed' }, { ...action, dueDay: '2026-10-00' }, { ...action, dueDay: '2026-02-30' }, { ...action, dueDay: '2027-10-20' }]) assert.equal(api.validAction(value, '2026-10-15'), false);
});
