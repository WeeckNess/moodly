const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/lib/teamMembers.ts'), 'utf8');
const mod = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(require, mod, mod.exports);
const { memberInput } = mod.exports;
test('Le salarié garde son nom complet, l’adresse est normalisée et les champs de privilèges sont refusés', () => {
  assert.deepEqual(memberInput({ name: '  Léa Martin  ', email: ' Lea.Martin@example.fr ' }), { name: 'Léa Martin', email: 'lea.martin@example.fr' });
  for (const input of [null, [], {}, { name: 'L', email: 'lea@example.fr' }, { name: 'Léa\nMartin', email: 'lea@example.fr' }, { name: 'Léa', email: 'no-mail' }, { name: 'Léa', email: 'lea@example.fr', role: 'manager' }, { name: 'Léa', email: 'lea@example.fr', team: 8 }, { name: 'Léa', email: 'lea@example.fr', blocked: false }]) assert.equal(memberInput(input), null);
});
