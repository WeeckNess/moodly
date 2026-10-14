const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const destination = path.join(__dirname, '..', '.env');
if (!fs.existsSync(destination)) {
  const secret = () => randomBytes(32).toString('hex');
  fs.writeFileSync(destination, [
    'HOST=0.0.0.0', 'PORT=1337', `APP_KEYS=${secret()},${secret()}`,
    `API_TOKEN_SALT=${secret()}`, `ADMIN_JWT_SECRET=${secret()}`, `TRANSFER_TOKEN_SALT=${secret()}`,
    `JWT_SECRET=${secret()}`, `ENCRYPTION_KEY=${secret()}`, 'DATABASE_CLIENT=sqlite', 'DATABASE_FILENAME=.tmp/data.db',
    'STRAPI_TELEMETRY_DISABLED=true', 'MOODLY_RETENTION_DAYS=45',
    'CORS_ORIGINS=http://localhost:8081,http://localhost:8082,http://127.0.0.1:8081', '',
  ].join('\n'), { flag: 'wx', mode: 0o600 });
  console.log('Configuration locale créée avec des secrets aléatoires. Le fichier .env est exclu de Git.');
}
