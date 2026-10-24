const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/middlewares/web-session.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function factory(env = { NODE_ENV: 'production' }) {
  const mod = { exports: {} };
  new Function('module', 'exports', 'process', source)(mod, mod.exports, { env });
  return mod.exports.default({ origins: ['http://localhost:8081'] });
}
function context(path = '/api/session', headers = {}) {
  const writes = [];
  const ctx = { path, method: 'GET', status: 200, request: { headers: { 'x-eclaircie-web-session': '1', 'sec-fetch-site': 'same-origin', ...headers } }, cookies: { get: () => 'private-token', set: (...args) => writes.push(args) }, set: () => {}, get: key => ctx.request.headers[key.toLowerCase()] || '' };
  return { ctx, writes };
}
test('Le cookie persistant est HttpOnly, Secure, Strict et limité aux API ; le JWT est retiré du JSON web', async () => {
  for (const route of ['/api/auth/local', '/api/auth/change-password']) {
    const { ctx, writes } = context(route); ctx.method = 'POST';
    await factory()(ctx, async () => { ctx.body = { jwt: 'new-private-token', user: { id: 1 } }; });
    assert.equal(ctx.request.headers.authorization, 'Bearer private-token');
    assert.equal(ctx.body.jwt, 'web-cookie-session');
    assert.deepEqual(writes[0], ['eclaircie.session', 'new-private-token', { httpOnly: true, secure: true, sameSite: 'strict', signed: false, overwrite: true, path: '/api', maxAge: 8 * 60 * 60 * 1000 }]);
  }
});
test('Un appel natif garde son bearer ; un site tiers ne peut pas utiliser le cookie', async () => {
  const { ctx } = context('/api/session', { 'x-eclaircie-web-session': '', authorization: 'Bearer native-token' });
  await factory()(ctx, async () => {});
  assert.equal(ctx.request.headers.authorization, 'Bearer native-token');
  for (const site of ['cross-site', 'same-site', 'none', '']) {
    const { ctx } = context('/api/session', { 'sec-fetch-site': site });
    await factory()(ctx, async () => assert.fail('Aucun accès à la route depuis une origine interdite'));
    assert.equal(ctx.status, 403);
    assert.equal(ctx.request.headers.authorization, undefined);
  }
});
test('La déconnexion expire le cookie ; un échec de connexion ne crée aucune session', async () => {
  const { ctx, writes } = context('/api/auth/web-logout'); ctx.method = 'POST';
  await factory()(ctx, async () => assert.fail('Logout traité avant les routes'));
  assert.equal(writes[0][1], null); assert.equal(writes[0][2].maxAge, 0);
  const failed = context('/api/auth/local'); failed.ctx.method = 'POST';
  await factory()(failed.ctx, async () => { failed.ctx.status = 400; failed.ctx.body = { error: 'Invalid login' }; });
  assert.equal(failed.writes.length, 0);
});
test('En développement HTTP, seule une origine configurée peut utiliser la session', async () => {
  const allowed = context('/api/session', { 'sec-fetch-site': 'same-site', origin: 'http://localhost:8081' });
  await factory({ NODE_ENV: 'development' })(allowed.ctx, async () => {});
  assert.equal(allowed.ctx.request.headers.authorization, 'Bearer private-token');
  const denied = context('/api/session', { 'sec-fetch-site': 'cross-site', origin: 'http://untrusted.example' });
  await factory({ NODE_ENV: 'development' })(denied.ctx, async () => assert.fail());
  assert.equal(denied.ctx.status, 403);
});
