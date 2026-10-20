const test = require('node:test'), assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), path = require('node:path');
function origins(env) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../config/middlewares.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', 'process', code)(module, module.exports, name => {
    assert.equal(name, 'node:os');
    return { networkInterfaces: () => ({ en0: [{ address: '10.1.2.3', family: 'IPv4', internal: false }], lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] }) };
  }, { env });
  return module.exports.default.find(item => item.name === 'strapi::cors').config.origin;
}
test('Expo sur le réseau local est autorisé en développement, sans origine arbitraire', () => {
  const allowed = origins({ NODE_ENV: 'development' });
  assert.ok(allowed.includes('http://10.1.2.3:8081'));
  assert.ok(allowed.includes('http://10.1.2.3:8082'));
  assert.ok(allowed.includes('http://localhost:8081'));
  assert.ok(!allowed.includes('http://10.1.2.4:8081'));
  assert.ok(!allowed.includes('*'));
});
test('En production seules les origines configurées sont utilisées et nettoyées', () => {
  assert.deepEqual(origins({ NODE_ENV: 'production', CORS_ORIGINS: ' https://moodly.example , ' }), ['https://moodly.example']);
  assert.ok(!origins({ NODE_ENV: 'production' }).includes('http://10.1.2.3:8081'));
});
