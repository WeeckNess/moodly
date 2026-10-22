const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, env) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox = { exports: {}, require, Buffer, process: { env } };
  vm.runInNewContext(code, sandbox);
  return sandbox.exports.default;
}

test('La purge externe refuse les appels sans secret, avec un mauvais secret ou un en-tête absent', () => {
  const policy = load('src/policies/is-cron.ts', { CRON_SECRET: 'cron-test-secret' });
  const context = authorization => ({ request: { header: { authorization } } });
  assert.equal(policy(context('Bearer cron-test-secret')), true);
  for (const header of [undefined, '', 'Bearer wrong', 'Bearer cron-test-secreX']) {
    assert.equal(policy(context(header)), false);
  }
  assert.equal(load('src/policies/is-cron.ts', {})(context('Bearer undefined')), false);
  const route = load('src/api/maintenance/routes/maintenance.ts', {}).routes[0];
  assert.ok(route.config.policies.includes('global::is-cron'));
});

test('Les ajouts de médias sont interdits sur Vercel, sans bloquer les routes métier ou le mode local', async () => {
  const middleware = load('src/middlewares/media-uploads.ts', { MOODLY_MEDIA_UPLOADS_ENABLED: 'false' })();
  for (const path of ['/upload', '/upload/files', '/api/upload', '/api/upload/files/1']) {
    const ctx = { path, method: 'POST' };
    await middleware(ctx, async () => assert.fail('Le téléversement doit être arrêté avant le traitement du corps'));
    assert.equal(ctx.status, 403);
  }
  for (const [path, method] of [['/upload/files', 'GET'], ['/api/mood-entries', 'POST'], ['/api/upload/files/1', 'DELETE']]) {
    let called = false;
    await middleware({ path, method }, async () => { called = true; });
    assert.equal(called, true);
  }
  let local = false;
  await load('src/middlewares/media-uploads.ts', {})()({ path: '/upload', method: 'POST' }, async () => { local = true; });
  assert.equal(local, true);
});
