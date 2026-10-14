const { spawn } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const root = path.join(__dirname, '..');
const testFolder = `.tmp/api-test-${randomUUID()}`;
const folder = path.join(root, testFolder);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(command, args, env = process.env) {
  return new Promise(resolve => { const child = spawn(command, args, { cwd: root, stdio: 'inherit', env }); child.on('exit', code => resolve(code ?? 1)); child.on('error', () => resolve(1)); });
}
(async () => {
  let server;
  let logs = '';
  try {
    if (await run(npm, ['run', 'build'])) { process.exitCode = 1; return; }
    const port = await new Promise(resolve => { const socket = net.createServer(); socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolve(port)); }); });
    fs.mkdirSync(folder, { recursive: true });
    const base = `http://127.0.0.1:${port}`;
    server = spawn(npm, ['start'], { cwd: root, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'development', HOST: '127.0.0.1', PORT: String(port), DATABASE_CLIENT: 'sqlite', DATABASE_FILENAME: `${testFolder}/data.db`, MOODLY_DEMO_SEED: 'true', MOODLY_DEMO_PASSWORD: 'EclaircieDemo2026!', BROWSER: 'false' } });
    for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      try { if ((await fetch(`${base}/_health`)).status === 204) { ready = true; break; } } catch {}
      if (server.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error(`Serveur de test indisponible.\n${logs}`);
    process.exitCode = await run(process.execPath, ['--test', 'tests/api.integration.cjs'], { ...process.env, TEST_API_URL: base });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally {
    if (server && server.exitCode === null) {
      if (process.platform === 'win32') server.kill(); else { try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
      await new Promise(resolve => { server.once('exit', resolve); setTimeout(resolve, 3000); });
    }
    fs.rmSync(folder, { recursive: true, force: true });
  }
})();
