const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib', relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('module', 'exports', 'require', code)(module, module.exports, id => {
    if (id.startsWith('./')) return load(id.slice(2) + '.ts');
    return require(id);
  });
  return module.exports;
}
const { assertDemoTarget } = load('demoGuard.ts');
const target = { vercelProjectId: 'prj_demo', neonProjectId: 'neon_demo', databaseHost: 'ep-demo.eu-central-1.aws.neon.tech', databaseName: 'neondb' };
const valid = {
  MOODLY_ENVIRONMENT: 'demo', DATABASE_CLIENT: 'postgres', MOODLY_DEPLOYMENT_PROJECT_ID: 'prj_demo', NEON_PROJECT_ID: 'neon_demo',
  DATABASE_URL: 'postgresql://user:password@ep-demo-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  DATABASE_URL_UNPOOLED: 'postgresql://user:password@ep-demo.eu-central-1.aws.neon.tech/neondb?sslmode=require',
};

test('La démo accepte uniquement ses projets Vercel et Neon ainsi que ses deux connexions PostgreSQL', () => {
  assert.doesNotThrow(() => assertDemoTarget(valid, target));
  assert.doesNotThrow(() => assertDemoTarget({ ...valid, VERCEL_PROJECT_ID: 'prj_demo' }, target));
  for (const invalid of [
    { MOODLY_ENVIRONMENT: 'production' }, { MOODLY_ENVIRONMENT: undefined }, { DATABASE_CLIENT: 'sqlite' },
    { MOODLY_DEPLOYMENT_PROJECT_ID: 'prj_real' }, { VERCEL_PROJECT_ID: 'prj_real' }, { NEON_PROJECT_ID: 'neon_real' },
    { DATABASE_URL: undefined }, { DATABASE_URL_UNPOOLED: undefined },
    { DATABASE_URL: valid.DATABASE_URL.replace('ep-demo-', 'ep-real-') },
    { DATABASE_URL_UNPOOLED: valid.DATABASE_URL_UNPOOLED.replace('/neondb', '/realdb') },
    { DATABASE_URL: 'https://ep-demo.eu-central-1.aws.neon.tech/neondb' },
    { DATABASE_URL: valid.DATABASE_URL.replace('neon.tech/', 'neon.tech:5544/') },
  ]) assert.throws(() => assertDemoTarget({ ...valid, ...invalid }, target), /Opération démo refusée/);
});

test('Le scénario de démo comprend des équipes contrastées, 45 comptes et des journées masquées ou visibles', () => {
  const { demoTeams, demoDay } = load('demoData.ts');
  assert.equal(demoTeams.length, 4);
  assert.equal(demoTeams.reduce((sum, team) => sum + team.size + team.managers, 0), 45);
  let visible = 0, masked = 0, missing = 0;
  for (const [teamIndex, team] of demoTeams.entries()) {
    for (let index = 0; index < 45; index++) {
      const day = demoDay(team, index, teamIndex);
      assert.equal(day.scores.length, day.count);
      assert.ok(day.count <= team.size);
      assert.ok(day.scores.every(score => Number.isInteger(score) && score >= 1 && score <= 5));
      if (!day.count) missing++;
      else if (day.count < 5) masked++;
      else visible++;
      if (team.key === 'plume') assert.ok(day.count < 5);
    }
  }
  assert.ok(visible > 0 && masked > 0 && missing > 0);
});
