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
  await t.test('Catalogue protégé et filtré par le rôle, sans métadonnées internes', async () => {
    assert.ok([401, 403].includes((await call('/api/mood-tags')).status));
    const employeeTags = await call('/api/mood-tags?audience=manager', tokens[0]);
    const managerTags = await call('/api/mood-tags?audience=collaborateur', manager);
    assert.equal(employeeTags.status, 200); assert.equal(managerTags.status, 200);
    assert.deepEqual(employeeTags.body.data.map(tag => tag.label), ['Charge', 'Ambiance', 'Sens', 'Équilibre', 'Reconnaissance', 'Outils']);
    assert.ok(managerTags.body.data.some(tag => tag.label === 'Arbitrages'));
    assert.ok(!employeeTags.body.data.some(tag => tag.label === 'Arbitrages'));
    for (const tag of employeeTags.body.data) assert.deepEqual(Object.keys(tag).sort(), ['icon', 'id', 'label']);
    assert.ok([403, 404, 405].includes((await call('/api/mood-tags', manager, { data: { label: 'Forgé' } })).status));
  });
  await t.test('Le listing serveur Lucide fonctionne sous Node 24, sans ouvrir de nouveaux droits applicatifs', async () => {
    const route = '/api/strapi-lucide-icons/icons';
    assert.ok([401, 403].includes((await call(route)).status));
    assert.equal((await call(route, manager)).status, 403);
    assert.ok(process.env.TEST_DATABASE_FILENAME);
    // Permission éphémère exclusivement dans la base isolée, pour exercer le vrai service étendu.
    const Database = require('better-sqlite3');
    const db = new Database(process.env.TEST_DATABASE_FILENAME);
    let permission;
    try {
      const role = db.prepare('SELECT id FROM up_roles WHERE type = ?').get('manager');
      permission = db.prepare('INSERT INTO up_permissions (action) VALUES (?)').run('plugin::strapi-lucide-icons.icons.list').lastInsertRowid;
      db.prepare('INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES (?, ?)').run(permission, role.id);
      const result = await call(route, manager);
      assert.equal(result.status, 200);
      assert.ok(result.body.icons.includes('alarm-clock'));
      assert.ok(result.body.icons.includes('message-circle'));
      assert.equal(new Set(result.body.icons).size, result.body.icons.length);
    } finally {
      if (permission) {
        db.prepare('DELETE FROM up_permissions_role_lnk WHERE permission_id = ?').run(permission);
        db.prepare('DELETE FROM up_permissions WHERE id = ?').run(permission);
      }
      db.close();
    }
    assert.equal((await call(route, manager)).status, 403);
  });
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
    for (const data of [{ score: 8 }, { score: 4, team: 999 }, { score: 4, comment: 'hello' }, { score: 4, tags: ['unknown'] }, { score: 4, tags: ['Arbitrages'] }]) assert.equal((await call('/api/mood-entries', tokens[0], { data })).status, 400);
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
  await t.test('Actions collectives : rôles, transitions, retours anonymes et dédoublonnage', async () => {
    const data = { title: 'Clarifier les priorités', description: 'Un point collectif court.', dueDay: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) };
    assert.ok([401, 403].includes((await call('/api/team-actions')).status));
    assert.equal((await call('/api/team-actions', tokens[0], { data })).status, 403);
    assert.equal((await call('/api/team-actions', manager, { data: { ...data, team: 999 } })).status, 400);
    const created = await call('/api/team-actions', manager, { data }); assert.equal(created.status, 201);
    const id = created.body.data.id;
    assert.equal((await call(`/api/team-actions/${id}`, tokens[0], { data: { status: 'active' } }, 'PATCH')).status, 403);
    assert.equal((await call(`/api/team-actions/${id}`, manager, { data: { status: 'completed' } }, 'PATCH')).status, 400);
    assert.equal((await call(`/api/team-actions/${id}`, manager, { data: { status: 'active' } }, 'PATCH')).status, 200);
    assert.equal((await call(`/api/team-actions/${id}/feedback`, tokens[0], { data: { score: 3 } })).status, 400);
    assert.equal((await call(`/api/team-actions/${id}`, manager, { data: { status: 'completed' } }, 'PATCH')).status, 200);
    assert.equal((await call(`/api/team-actions/${id}/feedback`, manager, { data: { score: 3 } })).status, 403);
    assert.equal((await call(`/api/team-actions/${id}/feedback`, tokens[0], { data: { score: 3, user: 999 } })).status, 400);
    const pair = await Promise.all([call(`/api/team-actions/${id}/feedback`, tokens[0], { data: { score: 3 } }), call(`/api/team-actions/${id}/feedback`, tokens[0], { data: { score: 1 } })]);
    assert.deepEqual(pair.map(r => r.status).sort(), [201, 409]);
    for (let i = 1; i < 5; i++) assert.equal((await call(`/api/team-actions/${id}/feedback`, tokens[i], { data: { score: 2 } })).status, 201);
    const own = (await call('/api/team-actions', tokens[0])).body.data.find(a => a.id === id);
    assert.equal(own.hasResponded, true); assert.equal(own.feedback, null);
    const result = (await call('/api/team-actions?team=999', manager)).body.data.find(a => a.id === id);
    assert.equal(result.feedback, null); assert.equal(result.reviewClosed, false);
    assert.ok(!JSON.stringify(result).includes('feedbackSum'));
    for (const path of ['/api/action-response-logs', '/api/team-action']) assert.ok([403, 404, 405].includes((await call(path, manager)).status));
  });
  await t.test('Les changements du catalogue en base sont immédiatement lus et validés par l’API', async () => {
    // Fixtures SQL uniquement dans la base temporaire du runner, jamais dans la base utilisateur.
    assert.ok(process.env.TEST_DATABASE_FILENAME);
    const Database = require('better-sqlite3');
    const db = new Database(process.env.TEST_DATABASE_FILENAME);
    const { randomUUID } = require('node:crypto');
    try {
      const id = db.prepare('INSERT INTO tags (document_id, label, audience, icon, enabled, position) VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), 'Télétravail test', 'collaborateur', 'wrench', 1, -1).lastInsertRowid;
      let catalogue = (await call('/api/mood-tags', tokens[5])).body.data;
      assert.equal(catalogue[0].label, 'Télétravail test'); assert.equal(catalogue[0].icon, 'wrench');
      db.prepare('UPDATE tags SET label = ?, icon = ? WHERE id = ?').run('Organisation test', 'alarm-clock', id);
      catalogue = (await call('/api/mood-tags', tokens[5])).body.data;
      assert.equal(catalogue[0].label, 'Organisation test'); assert.equal(catalogue[0].icon, 'alarm-clock');
      assert.equal((await call('/api/mood-entries', tokens[5], { data: { score: 3, tags: ['Télétravail test'] } })).status, 400);
      const other = await login('collaborateur8@eclaircie.test');
      assert.equal((await call('/api/mood-entries', other, { data: { score: 3, tags: ['Organisation test'] } })).status, 201);
      db.prepare('UPDATE tags SET enabled = 0 WHERE id = ?').run(id);
      assert.ok(!(await call('/api/mood-tags', tokens[5])).body.data.some(tag => tag.label === 'Organisation test'));
      assert.equal((await call('/api/mood-entries', tokens[5], { data: { score: 3, tags: ['Organisation test'] } })).status, 400);
      const enabledIds = db.prepare('SELECT id FROM tags WHERE enabled = 1').all();
      try {
        db.prepare('UPDATE tags SET enabled = 0').run();
        assert.deepEqual((await call('/api/mood-tags', tokens[5])).body.data, []);
        assert.equal((await call('/api/mood-entries', tokens[5], { data: { score: 3, tags: [] } })).status, 201);
      } finally {
        for (const tag of enabledIds) db.prepare('UPDATE tags SET enabled = 1 WHERE id = ?').run(tag.id);
      }
    } finally { db.close(); }
  });
  await t.test('Un manager crée un salarié dans sa propre équipe, sans élévation de droits', async () => {
    const route = '/api/team-members';
    const data = { name: 'Léa Martin', email: ' Lea.Martin@example.test ' };
    assert.ok([401, 403].includes((await call(route, null, { data })).status));
    assert.equal((await call(route, tokens[0], { data })).status, 403);
    for (const forged of [{ ...data, role: 'manager' }, { ...data, team: 999 }, { ...data, password: 'injected' }, { name: 'L', email: data.email }, { name: 'Léa', email: 'invalid' }]) assert.equal((await call(route, manager, { data: forged })).status, 400);
    const created = await call(route, manager, { data });
    assert.equal(created.status, 201);
    const employee = created.body.data;
    assert.deepEqual(Object.keys(employee).sort(), ['email', 'initialPassword', 'name', 'team']);
    assert.equal(employee.email, 'lea.martin@example.test');
    assert.equal(employee.team, 'Studio · Démonstration');
    assert.ok(employee.initialPassword.length >= 24);
    const auth = await call('/api/auth/local', null, { identifier: employee.email, password: employee.initialPassword });
    assert.equal(auth.status, 200);
    const info = await call('/api/session', auth.body.jwt);
    assert.equal(info.body.data.name, 'Léa Martin');
    assert.equal(info.body.data.role, 'collaborateur');
    assert.equal(info.body.data.team.name, employee.team);
    assert.equal(info.body.data.submitted, false);
    assert.equal((await call('/api/team-stats', auth.body.jwt)).status, 403);
    assert.equal((await call(route, auth.body.jwt, { data: { name: 'Autre', email: 'other@example.test' } })).status, 403);
    assert.equal((await call(route, manager, { data })).status, 409);
    const Database = require('better-sqlite3');
    const db = new Database(process.env.TEST_DATABASE_FILENAME);
    try {
      const record = db.prepare('SELECT password FROM up_users WHERE email = ?').get(employee.email);
      assert.notEqual(record.password, employee.initialPassword);
      assert.match(record.password, /^\$2/);
    } finally { db.close(); }
    const pair = await Promise.all([1, 2].map(() => call(route, manager, { data: { name: 'Léa Martin', email: 'lea.homonyme@example.test' } })));
    assert.deepEqual(pair.map(result => result.status).sort(), [201, 409]);
    assert.notEqual(pair.find(result => result.status === 201).body.data.initialPassword, employee.initialPassword);
  });

});
