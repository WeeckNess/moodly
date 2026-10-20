const path = require('node:path');

async function main() {
  process.chdir(path.join(__dirname, '..'));
  // Initialiser la structure et les référentiels sans ajouter de données fictives.
  process.env.MOODLY_DEMO_SEED = 'false';
  require('./setup.cjs');
  const { compileStrapi, createStrapi } = require('@strapi/strapi');
  let app;
  try {
    const context = await compileStrapi();
    app = createStrapi(context);
    await app.load();
    console.log('Base initialisée : schémas synchronisés, rôles Collaborateur/Manager et six tags prêts.');
  } finally {
    if (app) await app.destroy();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
