const { spawn } = require('node:child_process');
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'develop'], { stdio: 'inherit', env: { ...process.env, MOODLY_DEMO_SEED: 'true', BROWSER: 'false' } });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
