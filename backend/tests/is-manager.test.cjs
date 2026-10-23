const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {} }; vm.runInNewContext(code, sandbox); return sandbox.exports.default;
}
const policy = load('policies/is-manager.ts');
const manager = { id: 5, blocked: false, role: { type: 'manager' }, team: { id: 20 } };
function context(user, teamId = 20) {
  return { strapi: { db: { query: uid => ({ findOne: async ({ where }) => {
    if (uid === 'plugin::users-permissions.user') return user && where.id === user.id ? user : null;
    assert.equal(where.manager, undefined);
    return where.id === teamId ? { id: teamId } : null;
  } }) } } };
}
test('La policy accepte uniquement le manager actif de son équipe de rattachement', async () => {
  assert.equal(await policy({ state: { user: { id: 5 } } }, {}, context(manager)), true);
  for (const user of [null, { ...manager, blocked: true }, { ...manager, role: { type: 'collaborateur' } }, { ...manager, team: null }]) {
    assert.equal(await policy({ state: { user: { id: 5 } } }, {}, context(user)), false);
  }
  assert.equal(await policy({ state: { user: { id: 5 } }, query: { team: 9 } }, {}, context(manager, 9)), false);
});
test('Plusieurs managers partagent leur équipe sans référent unique et sans choisir une autre équipe dans la requête', async () => {
  for (const id of [5, 9]) {
    assert.equal(await policy({ state: { user: { id } }, query: { team: 999 } }, {}, context({ ...manager, id })), true);
  }
});
test('La policy refuse une session absente et relit le rôle actuel au lieu de celui du jeton', async () => {
  assert.equal(await policy({ state: {} }, {}, context(manager)), false);
  assert.equal(await policy({ state: { user: { id: 5, role: { type: 'manager' } } } }, {}, context({ ...manager, role: { type: 'collaborateur' } })), false);
});
test('La policy est attachée aux statistiques et aux écritures manager, la lecture des actions reste partagée', () => {
  const { routes } = load('api/mood-entry/routes/mood-entry.ts');
  for (const route of routes.filter(route => ['stats', 'createAction', 'updateAction', 'createMember'].some(action => route.handler === `mood-entry.${action}`))) {
    assert.ok(route.config.policies.includes('global::is-manager'));
  }
  assert.equal(routes.find(route => route.method === 'GET' && route.path === '/team-actions').config.policies, undefined);
});
