// Lancé par backend:test:api après les tests backend, sur leur base fictive isolée.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadStrapiClient } = require('./loadStrapiClient.cjs');

test('Le client du front utilise réellement Strapi pour les deux rôles', async () => {
  assert.ok(process.env.TEST_API_URL, 'Une API de test dédiée est requise.');
  const { strapiApi, ApiError } = loadStrapiClient({ baseUrl: process.env.TEST_API_URL });
  const password = 'EclaircieDemo2026!';
  const employee = await strapiApi.login('collaborateur7@eclaircie.test', password);
  const session = await strapiApi.session(employee.jwt);
  assert.equal(session.role, 'collaborateur');
  assert.equal(session.submitted, false);
  const tags = await strapiApi.tags(employee.jwt);
  assert.ok(tags.some(tag => tag.label === 'Charge'));
  const submitted = await strapiApi.submitMood(employee.jwt, 4, tags.slice(0, 2).map(tag => tag.label));
  assert.equal(submitted.data.day, session.day);
  assert.equal((await strapiApi.session(employee.jwt)).submitted, true);
  await assert.rejects(strapiApi.submitMood(employee.jwt, 5, []), error => error instanceof ApiError && error.status === 409);
  await assert.rejects(strapiApi.teamStats(employee.jwt), error => error instanceof ApiError && error.status === 403);

  const manager = await strapiApi.login('manager@eclaircie.test', password);
  assert.equal((await strapiApi.session(manager.jwt)).role, 'manager');
  assert.ok((await strapiApi.tags(manager.jwt)).some(tag => tag.label === 'Arbitrages'));
  const stats = await strapiApi.teamStats(manager.jwt);
  assert.equal(stats.data.length, 30);
  assert.equal(stats.meta.threshold, 5);
  assert.equal(stats.meta.team, session.team.name);
  assert.equal(stats.data.at(-1).day, submitted.data.day);
  assert.equal(typeof stats.data.at(-1).average, 'number');
  assert.deepEqual(Object.keys(stats.data.at(-1)).sort(), ['average', 'day']);
  assert.ok(Array.isArray(await strapiApi.actions(employee.jwt)));
  assert.ok(Array.isArray(await strapiApi.actions(manager.jwt)));
});
