const test = require('node:test');
const assert = require('node:assert/strict');
const { loadStrapiClient } = require('./loadStrapiClient.cjs');
const { resolveApiUrl } = loadStrapiClient();

test('L’API suit le PC qui sert le front en développement web et Expo Go', () => {
  assert.equal(resolveApiUrl({ development: true, webOrigin: 'http://192.168.1.20:8081' }), 'http://192.168.1.20:1337');
  assert.equal(resolveApiUrl({ development: true, bundleUrl: 'http://192.168.1.42:8081/index.bundle?platform=ios' }), 'http://192.168.1.42:1337');
  assert.equal(resolveApiUrl({ development: true, bundleUrl: 'http://10.0.2.2:8081/index.bundle' }), 'http://10.0.2.2:1337');
  assert.equal(resolveApiUrl({ development: true, webOrigin: 'http://[::1]:8081' }), 'http://[::1]:1337');
});

test('L’URL explicite est prioritaire et la production exige une configuration', () => {
  assert.equal(resolveApiUrl({ development: false, configuredUrl: ' https://api.example.test/strapi/ ' }), 'https://api.example.test/strapi');
  assert.throws(() => resolveApiUrl({ development: false }), /production/);
  for (const configuredUrl of ['file:///tmp/data', 'http://user:secret@example.test', 'https://example.test?token=secret']) {
    assert.throws(() => resolveApiUrl({ development: true, configuredUrl }));
  }
});

test('Le client envoie le JWT et uniquement les données métier prévues', async () => {
  const calls = [];
  const { strapiApi } = loadStrapiClient({ baseUrl: 'http://localhost:1337/', fetch: async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ data: { submitted: true, day: '2026-10-20' } }), { status: 201 });
  } });
  await strapiApi.submitMood('test-token', 4, ['Charge']);
  assert.equal(calls[0].url, 'http://localhost:1337/api/mood-entries');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(calls[0].init.body), { data: { score: 4, tags: ['Charge'] } });
});

test('Une erreur HTTP sans JSON conserve son statut pour gérer la session', async () => {
  const { strapiApi, ApiError } = loadStrapiClient({ fetch: async () => new Response('Unauthorized', { status: 401 }) });
  await assert.rejects(strapiApi.session('expired'), error => error instanceof ApiError && error.status === 401);
});

test('Une réponse serveur invalide et une panne réseau sont distinguées', async () => {
  const invalid = loadStrapiClient({ fetch: async () => new Response('<html>Unavailable</html>', { status: 200 }) });
  await assert.rejects(invalid.strapiApi.teamStats('test'), error => error instanceof invalid.ApiError && error.status === 502);
  const offline = loadStrapiClient({ fetch: async () => { throw new TypeError('fetch failed'); } });
  await assert.rejects(offline.strapiApi.teamStats('test'), /Impossible de joindre le serveur/);
});

test('La création salarié transmet le JWT manager et seulement le nom et l’e-mail', async () => {
  const calls = [];
  const result = { name: 'Léa Martin', email: 'lea@example.test', team: 'Studio', initialPassword: 'secret-initial' };
  const { strapiApi } = loadStrapiClient({ fetch: async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ data: result }), { status: 201 }); } });
  assert.deepEqual(await strapiApi.createEmployee('manager-token', { name: result.name, email: result.email }), result);
  assert.ok(calls[0].url.endsWith('/api/team-members'));
  assert.equal(calls[0].init.headers.Authorization, 'Bearer manager-token');
  assert.deepEqual(JSON.parse(calls[0].init.body), { data: { name: result.name, email: result.email } });
});

test('Le changement de mot de passe utilise la session du salarié et confirme le nouveau secret', async () => {
  const calls = [];
  const { strapiApi } = loadStrapiClient({ fetch: async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ jwt: 'new-token' }), { status: 200 }); } });
  assert.deepEqual(await strapiApi.changePassword('initial-token', 'initial', 'UnePhraseLongue2026', 'UnePhraseLongue2026'), { jwt: 'new-token' });
  assert.ok(calls[0].url.endsWith('/api/auth/change-password'));
  assert.equal(calls[0].init.headers.Authorization, 'Bearer initial-token');
  assert.deepEqual(JSON.parse(calls[0].init.body), { currentPassword: 'initial', password: 'UnePhraseLongue2026', passwordConfirmation: 'UnePhraseLongue2026' });
});

test('Le front Vercel utilise le relais API de son propre domaine, sans modifier Expo Go', () => {
  assert.equal(resolveApiUrl({ development: false, configuredUrl: '/', webOrigin: 'https://moodly.example.test' }), 'https://moodly.example.test');
  assert.throws(() => resolveApiUrl({ development: false, configuredUrl: '/' }), /origine web/);
  assert.equal(resolveApiUrl({ development: false, configuredUrl: 'https://api.example.test', bundleUrl: 'https://example.test/bundle' }), 'https://api.example.test');
});
