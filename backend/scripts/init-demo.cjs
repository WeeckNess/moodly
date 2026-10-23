const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');

async function main() {
  process.chdir(path.join(__dirname, '..'));
  // Ce fichier contient exclusivement les accès de la démo, jamais ceux de la production.
  const values = parseEnv(fs.readFileSync('.env.demo.local', 'utf8'));
  const target = require('../demo-target.json');
  const { assertDemoTarget } = require('../dist/src/lib/demoGuard');
  assertDemoTarget(values, target); // avant toute connexion ou synchronisation Strapi
  if (!values.MOODLY_DEMO_PASSWORD || values.MOODLY_DEMO_PASSWORD.length < 16) throw new Error('Mot de passe démo absent ou trop court.');
  Object.assign(process.env, values, { NODE_ENV: 'production', MOODLY_DEMO_SEED: 'false' });
  require('./setup.cjs');
  const { Client } = require('pg');
  const lock = new Client({ connectionString: values.DATABASE_URL_UNPOOLED, connectionTimeoutMillis: 60000 });
  let app;
  await lock.connect();
  try {
    await lock.query('SELECT pg_advisory_lock(20261022)');
    const { createStrapi } = require('@strapi/strapi');
    app = createStrapi({ appDir: process.cwd(), distDir: path.join(process.cwd(), 'dist') });
    await app.load();
    const { seedDemo } = require('../dist/src/lib/demoData');
    const result = await seedDemo(app, target);
    fs.writeFileSync('.env.demo-accounts.local', [
      '# Comptes fictifs de démonstration uniquement',
      `DEMO_PASSWORD=${JSON.stringify(values.MOODLY_DEMO_PASSWORD)}`,
      ...result.credentials.map((account, index) => `DEMO_ACCOUNT_${index + 1}=${JSON.stringify(`${account.email} | ${account.role} | ${account.team}`)}`), '',
    ].join('\n'), { mode: 0o600 });
    console.log(`Démo initialisée : ${result.credentials.length} comptes, ${result.createdMoods} nouvelles réponses et ${result.createdActions} nouvelles actions. Identifiants dans .env.demo-accounts.local.`);
  } finally {
    if (app) await app.destroy();
    await lock.end();
  }
}

main().catch(error => { console.error('Initialisation démo impossible :', error.message); process.exit(1); });
