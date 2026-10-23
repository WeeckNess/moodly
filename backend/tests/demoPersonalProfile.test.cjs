const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file) {
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  new Function('module', 'exports', 'require', js)(module, module.exports, id => id.startsWith('.') ? load(path.resolve(path.dirname(file), id.endsWith('.json') ? id : `${id}.ts`)) : require(id));
  return module.exports;
}
const { demoProfileCount, makeDemoPersonalProfile } = load(path.join(__dirname, '../src/lib/demoPersonalProfile.ts'));
const target = require('../demo-target.json');
const env = { MOODLY_ENVIRONMENT: 'demo', MOODLY_DEPLOYMENT_PROJECT_ID: target.vercelProjectId };
const user = { email: 'collaborateur1.horizon@demo.eclaircie.test', role: { type: 'collaborateur' } };
test('Seuls les comptes fictifs attendus sur le projet de démo reçoivent un historique personnel', () => {
  assert.equal(demoProfileCount(user, env), 35);
  for (const values of [{}, { ...env, MOODLY_ENVIRONMENT: 'production' }, { ...env, MOODLY_DEPLOYMENT_PROJECT_ID: 'real' }, { ...env, VERCEL_PROJECT_ID: 'real' }]) assert.equal(demoProfileCount(user, values), null);
  for (const account of [{ ...user, email: 'noah@example.com' }, { ...user, email: 'collaborateur99.horizon@demo.eclaircie.test' }, { ...user, role: { type: 'manager' } }, { ...user, email: 'manager2.horizon@demo.eclaircie.test', role: { type: 'manager' } }]) assert.equal(demoProfileCount(account, env), null);
});
test('La démo couvre les sept stades, limite le calendrier à 29 jours passés et laisse aujourd’hui libre', () => {
  const counts = new Set(Array.from({ length: 16 }, (_, i) => demoProfileCount({ ...user, email: `collaborateur${i + 1}.atlas@demo.eclaircie.test` }, env)));
  assert.equal(counts.size, 7);
  for (const count of counts) {
    const fixture = makeDemoPersonalProfile(count, '2026-10-23', ['Ambiance', 'Charge']);
    assert.equal(fixture.growth.count, count);
    assert.equal(fixture.growth.lastDay, '2026-10-22');
    assert.equal(fixture.entries.length, Math.min(count, 29));
    assert.ok(fixture.entries.every(row => row.day >= '2026-09-24' && row.day < '2026-10-23' && row.score >= 1 && row.score <= 5));
    assert.equal(new Set(fixture.entries.map(row => row.day)).size, fixture.entries.length);
  }
});
