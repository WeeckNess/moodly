// Exécuter uniquement contre une base de test dédiée, alimentée par le seed fictif.
const test = require('node:test');
const assert = require('node:assert/strict');
const base = process.env.TEST_API_URL || 'http://localhost:1338';
async function call(path, token, data, method) {
  const response = await fetch(base + path, { method: method || (data ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const body = await response.json().catch(() => ({})); return { status: response.status, body };
}
async function login(email) {
  const result = await call('/api/auth/local', null, { identifier: email, password: 'EclaircieDemo2026!' });
  assert.equal(result.status, 200); assert.ok(result.body.jwt); return result.body.jwt;
}
test('Parcours API et isolation des rôles sur des comptes fictifs', async t => {
  const manager = await login('manager@eclaircie.test');
  const tokens = await Promise.all(Array.from({ length: 6 }, (_, i) => login(`collaborateur${i + 1}@eclaircie.test`)));
  await t.test('Accès non authentifié refusé', async () => {
    for (const path of ['/api/session', '/api/team-stats']) assert.ok([401, 403].includes((await call(path)).status));
    assert.ok([401, 403].includes((await call('/api/session', 'invalid-token')).status));
  });
  await t.test('Permissions collaborateur et manager distinctes', async () => {
    assert.equal((await call('/api/team-stats', tokens[0])).status, 403);
    assert.equal((await call('/api/mood-entries', manager, { data: { score: 4 } })).status, 403);
    for (const path of ['/api/mood-entries', '/api/mood-entrys', '/api/submission-logs', '/api/daily-aggregates']) assert.ok([403, 404, 405].includes((await call(path, manager)).status));
  });
  await t.test('Champs forgés et saisies invalides refusés', async () => {
    for (const data of [{ score: 8 }, { score: 4, team: 999 }, { score: 4, comment: 'hello' }, { score: 4, tags: ['unknown'] }]) assert.equal((await call('/api/mood-entries', tokens[0], { data })).status, 400);
  });
  await t.test('Deux saisies concurrentes produisent une réponse unique', async () => {
    const responses = await Promise.all([call('/api/mood-entries', tokens[0], { data: { score: 4, tags: ['Charge'] } }), call('/api/mood-entries', tokens[0], { data: { score: 4, tags: ['Charge'] } })]);
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    const info = await call('/api/session', tokens[0]); assert.equal(info.body.data.submitted, true); assert.match(info.body.data.privateSupportKey, /^[a-f0-9]{64}$/);
    assert.equal((await call('/api/mood-entries', tokens[0], { data: { score: 5 } })).status, 409);
  });
  await t.test('Le seuil est appliqué côté serveur, les agrégats ne contiennent aucun auteur', async () => {
    for (let i = 1; i <= 3; i++) assert.equal((await call('/api/mood-entries', tokens[i], { data: { score: 3 } })).status, 201);
    let result = await call('/api/team-stats?days=30', manager); assert.equal(result.status, 200); assert.equal(result.body.data.length, 30); assert.equal(result.body.data.at(-1).average, null);
    assert.equal((await call('/api/mood-entries', tokens[4], { data: { score: 2 } })).status, 201);
    result = await call('/api/team-stats?days=30&team=999', manager);
    assert.equal(result.body.data.at(-1).average, 3); // (4 + 3 + 3 + 3 + 2) / 5
    assert.equal(Object.keys(result.body.data.at(-1)).join(','), 'day,average');
    assert.equal(result.body.meta.team, 'Studio · Démonstration');
    assert.ok(!JSON.stringify(result.body).includes('privateSupportKey')); assert.ok(!JSON.stringify(result.body).includes('createdAt')); assert.ok(!JSON.stringify(result.body).includes('@eclaircie.test'));
  });
});
