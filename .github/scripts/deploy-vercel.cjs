const { execFileSync } = require('node:child_process');
const { appendFileSync, existsSync } = require('node:fs');

const teamId = 'team_SLEbao2P3yLYY21T8Uc87kCz';
const teamSlug = 'teo-s-team1';
// These are the only permitted targets. The real Strapi project is deliberately absent.
const projects = [
  { name: 'moodly-backend-demo', id: 'prj_0Xa34GsZrkOrvEqLr6lLsSh4lV9h', directory: 'backend', path: '/_health', status: 204, publicUrl: 'https://moodly-backend-demo.vercel.app' },
  { name: 'moodly-front', id: 'prj_gmWpfloa5d6w0S6hsfUC9F7goX7P', directory: 'mobile', path: '/', status: 200, publicUrl: 'https://moodly-front.vercel.app' },
];

function assertGithubRun(env, commit) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY?.toLowerCase() !== 'weeckness/moodly' ||
      env.GITHUB_REF !== 'refs/heads/main' || env.MOODLY_REF_PROTECTED !== 'true' ||
      !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? '') || env.GITHUB_SHA !== commit.trim()) {
    throw new Error('Deployment refused: use the reviewed commit on protected main in WeeckNess/moodly.');
  }
  if (!env.VERCEL_TOKEN) throw new Error('Missing production secret VERCEL_TOKEN. Add it in the GitHub production environment; never put it in source code.');
}

function deploymentUrl(output, project) {
  const result = JSON.parse(output);
  if (result.status === 'error') throw new Error(`Vercel refused ${project.name}.`);
  const deployment = result.deployment ?? result;
  const value = deployment.url;
  if (typeof value !== 'string') throw new Error(`No deployment URL returned for ${project.name}.`);
  const url = new URL(value.startsWith('https://') ? value : `https://${value}`);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      !url.hostname.startsWith(`${project.name}-`) || !url.hostname.endsWith('.vercel.app') ||
      deployment.readyState !== 'READY') throw new Error(`Unexpected or unfinished deployment for ${project.name}.`);
  return url.origin;
}

async function deployProjects(env = process.env, execute = execFileSync, request = fetch) {
  const commit = execute('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  assertGithubRun(env, commit);
  for (const project of projects) {
    if (!existsSync(`${project.directory}/vercel.json`)) throw new Error(`Missing ${project.directory}/vercel.json: run from the repository root.`);
    const options = {
      encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 30 * 60 * 1000,
      stdio: ['ignore', 'pipe', 'inherit'],
      env: { ...env, VERCEL_ORG_ID: teamId, VERCEL_PROJECT_ID: project.id },
    };
    console.log(`Building ${project.name} from ${commit.trim()} (domains remain on the previous deployment).`);
    const output = execute('vercel', ['deploy', '--prod', '--skip-domain', '--json', '--yes', '--scope', teamSlug, '--project', project.id], options);
    const url = deploymentUrl(output, project);
    const status = execute('vercel', ['curl', `${url}${project.path}`, '--scope', teamSlug, '--', '--silent', '--show-error', '--fail', '--retry', '5', '--retry-all-errors', '--retry-delay', '5', '--max-time', '60', '--output', '/dev/null', '--write-out', '%{http_code}'], options).trim();
    if (status !== String(project.status)) throw new Error(`${project.name}: staging HTTP ${status}, expected ${project.status}. Domains were not promoted.`);
    execute('vercel', ['promote', url, '--scope', teamSlug, '--yes'], options);
    const response = await request(`${project.publicUrl}${project.path}`, { redirect: 'error', signal: AbortSignal.timeout(60000) });
    await response.body?.cancel();
    if (response.status !== project.status) throw new Error(`${project.name}: public HTTP ${response.status} after promotion; inspect the deployment before retrying.`);
    console.log(`Verified ${project.name}: ${project.publicUrl} (HTTP ${response.status}).`);
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `- **${project.name}**: [deployment](${url}), public HTTP ${response.status}, commit \`${commit.trim()}\`.\n`);
  }
}

module.exports = { assertGithubRun, deploymentUrl, deployProjects, projects };
if (require.main === module) deployProjects().catch(error => { console.error(error.message); process.exitCode = 1; });
