const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadStrapiClient({ baseUrl, platform = 'web', webOrigin = 'http://localhost:8081', bundleUrl, fetch: transport = fetch } = {}) {
  const modules = {};
  function load(name) {
    if (modules[name]) return modules[name];
    const source = fs.readFileSync(path.join(__dirname, '../src', `${name}.ts`), 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const module = { exports: {} };
    function requireMock(id) {
      if (id === './apiConfig') return load('apiConfig');
      if (id === 'react-native') return { Platform: { OS: platform }, NativeModules: { SourceCode: { scriptURL: bundleUrl } } };
      if (id === 'expo-secure-store') return {};
      throw new Error(`Unexpected module: ${id}`);
    }
    new Function('exports', 'module', 'require', 'process', '__DEV__', 'window', 'fetch', js)(
      module.exports, module, requireMock, { env: { EXPO_PUBLIC_API_URL: baseUrl } }, true,
      { location: { origin: webOrigin } }, transport
    );
    modules[name] = module.exports;
    return module.exports;
  }
  return { ...load('apiConfig'), ...load('strapi') };
}

module.exports = { loadStrapiClient };
