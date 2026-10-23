const test = require('node:test');
const assert = require('node:assert/strict');
const { assertGithubRun, deploymentUrl, deployProjects, projects } = require('../scripts/deploy-vercel.cjs');
const sha = 'a'.repeat(40);
const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'WeeckNess/moodly', GITHUB_REF: 'refs/heads/main', MOODLY_REF_PROTECTED: 'true', GITHUB_SHA: sha, VERCEL_TOKEN: 'fake-test-credential' };
const result = project => JSON.stringify({ status: 'ok', deployment: { url: `https://${project.name}-build-teo-s-team1.vercel.app`, readyState: 'READY' } });

test('Only the exact commit on protected main may use the deployment credential', () => {
  assert.doesNotThrow(() => assertGithubRun(env, sha));
  for (const change of [{ GITHUB_ACTIONS: 'false' }, { GITHUB_REPOSITORY: 'other/repo' }, { GITHUB_REF: 'refs/pull/1/merge' }, { MOODLY_REF_PROTECTED: 'false' }, { GITHUB_SHA: 'b'.repeat(40) }, { VERCEL_TOKEN: '' }]) assert.throws(() => assertGithubRun({ ...env, ...change }, sha));
});
test('A failed, unfinished or foreign deployment cannot be promoted', () => {
  const project = projects[0];
  assert.match(deploymentUrl(result(project), project), /^https:\/\//);
  for (const response of [{ status: 'error' }, { url: 'https://other.example', readyState: 'READY' }, { url: `https://${project.name}-build.vercel.app`, readyState: 'BUILDING' }, { url: `https://${project.name}-build.vercel.app.evil.test`, readyState: 'READY' }]) assert.throws(() => deploymentUrl(JSON.stringify(response), project));
});
test('An unhealthy staged backend stops the release before any promotion or frontend deploy', async () => {
  const calls = [];
  function execute(command, args) {
    calls.push({ command, args });
    if (command === 'git') return sha;
    if (args[0] === 'deploy') return result(projects[0]);
    if (args[0] === 'curl') return '500';
    throw new Error('Unexpected command');
  }
  await assert.rejects(() => deployProjects(env, execute), /staging HTTP 500/);
  assert.equal(calls.filter(call => call.args[0] === 'deploy').length, 1);
  assert.ok(calls.every(call => call.args[0] !== 'promote'));
});
test('Both projects use their fixed IDs, verified backend first, and never the real backend', async () => {
  const calls = [];
  let current;
  function execute(command, args, options) {
    if (command === 'git') return sha;
    calls.push({ args, env: options.env });
    if (args[0] === 'deploy') { current = projects.find(project => project.id === options.env.VERCEL_PROJECT_ID); return result(current); }
    if (args[0] === 'curl') return String(current.status);
    return '';
  }
  const requests = [];
  await deployProjects(env, execute, async url => { requests.push(url); return { status: current.status }; });
  assert.deepEqual(calls.filter(call => call.args[0] === 'deploy').map(call => call.env.VERCEL_PROJECT_ID), projects.map(project => project.id));
  assert.deepEqual(calls.map(call => call.args[0]), ['deploy', 'curl', 'promote', 'deploy', 'curl', 'promote']);
  assert.equal(requests.length, 2);
  assert.ok(calls.every(call => call.env.VERCEL_ORG_ID === 'team_SLEbao2P3yLYY21T8Uc87kCz'));
  assert.ok(!JSON.stringify(calls).includes('prj_OknZ5oCDy8go8G2u20navzXMYAd2'));
});
