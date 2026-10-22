const path = require('node:path');

async function main() {
  process.chdir(path.join(__dirname, '..'));
  process.env.NODE_ENV = 'production';
  require('./setup.cjs');
  if (process.env.DATABASE_CLIENT !== 'postgres' || !process.env.DATABASE_URL || !process.env.DATABASE_URL_UNPOOLED) {
    throw new Error('Le déploiement requiert PostgreSQL, DATABASE_URL et DATABASE_URL_UNPOOLED.');
  }
  // Une connexion directe maintient le verrou de session pendant les migrations
  // et le bootstrap, même lorsque plusieurs instances démarrent simultanément.
  const { Client } = require('pg');
  const lock = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED, connectionTimeoutMillis: 60000 });
  await lock.connect();
  try {
    await lock.query('SELECT pg_advisory_lock(20261022)');
    const { createStrapi } = require('@strapi/strapi');
    await createStrapi({ appDir: process.cwd(), distDir: path.join(process.cwd(), 'dist') }).start();
  } finally {
    await lock.end();
  }
}

main().catch(error => {
  console.error('Démarrage Strapi impossible :', error.message);
  process.exit(1);
});
