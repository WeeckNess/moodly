const test = require('node:test'), assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), path = require('node:path');
function harness() {
  const preferences = new Map(), saved = [];
  const module = { exports: {} };
  const imports = {
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => preferences.get(key), setItem: async (key,value) => preferences.set(key,value) } },
    './personalHistory': { initializeDemoPersonalHistory: async (...args) => saved.push(args) },
  };
  const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/demoProfile.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module','exports','require',js)(module,module.exports,id => imports[id]);
  return { api: module.exports, saved };
}
test('Un compte réel sans fixture n’est jamais peuplé, même dans le même front', async () => {
  const { api, saved } = harness();
  await api.hydrateDemoProfile('real', undefined, '2026-10-23');
  assert.equal(saved.length, 0);
});
test('Les imports concurrents sont regroupés et l’effacement empêche tout réimport pour ce compte', async () => {
  const { api, saved } = harness();
  const fixture = { version: 1, entries: [], growth: { count: 35, lastDay: '2026-10-22' } };
  await Promise.all([api.hydrateDemoProfile('demo', fixture, '2026-10-23'), api.hydrateDemoProfile('demo', fixture, '2026-10-23')]);
  assert.equal(saved.length, 1);
  await api.disableDemoProfile('demo');
  await api.hydrateDemoProfile('demo', fixture, '2026-10-23');
  assert.equal(saved.length, 1);
  await api.hydrateDemoProfile('other-demo', fixture, '2026-10-23');
  assert.equal(saved.length, 2);
});
