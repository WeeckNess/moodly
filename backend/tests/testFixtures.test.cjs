const test = require('node:test'), assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), path = require('node:path');
const moduleForTest = {exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/testFixtures.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(moduleForTest,moduleForTest.exports);
const {assertTestFixtureDatabase} = moduleForTest.exports;
test('Les fixtures ne peuvent pas remplir la base applicative, même en développement',()=>{
 for(const file of [undefined,'.tmp/data.db','data.db','/tmp/data.db','.tmp/api-test-abc/../../data.db']) assert.throws(()=>assertTestFixtureDatabase('development',file));
 assert.throws(()=>assertTestFixtureDatabase('production','.tmp/api-test-ab12-34cd/data.db'));
 assert.doesNotThrow(()=>assertTestFixtureDatabase('development','.tmp/api-test-ab12-34cd/data.db'));
});
