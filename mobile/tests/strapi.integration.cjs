// Lancé par backend:test:api après les tests backend, sur leur base fictive isolée.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadStrapiClient } = require('./loadStrapiClient.cjs');

test('Le client du front utilise réellement Strapi pour les deux rôles', async () => {
  assert.ok(process.env.TEST_API_URL, 'Une API de test dédiée est requise.');
  const { strapiApi, ApiError } = loadStrapiClient({ baseUrl: process.env.TEST_API_URL, platform: 'ios' });
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

test('La session web survit à la fermeture du client et la déconnexion efface le cookie', async () => {
  const baseUrl = process.env.TEST_API_URL;
  assert.ok(baseUrl);
  let cookie = '';
  const responses = [];
  const transport = async (url, init) => {
    const response = await fetch(url, { ...init, headers: { ...init.headers, 'Sec-Fetch-Site': 'same-origin', ...(cookie ? { Cookie: cookie } : {}) } });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      assert.match(setCookie, /httponly/i);
      assert.match(setCookie, /samesite=strict/i);
      cookie = setCookie.split(';')[0];
    }
    responses.push(response.clone());
    return response;
  };
  const client = () => loadStrapiClient({ baseUrl, fetch: transport });
  const first = client();
  const login = await first.strapiApi.login('collaborateur8@eclaircie.test', 'EclaircieDemo2026!');
  assert.equal(login.jwt, 'web-cookie-session');
  assert.match(cookie, /^eclaircie\.session=.+/);
  const beforeClose = await first.strapiApi.session(login.jwt);
  const cookieBeforeClose = cookie;
  // A fresh JS client has no local token: only the browser cookie remains.
  const reopened = client();
  const restored = await reopened.strapiApi.session(await reopened.tokenStore.read());
  assert.equal(restored.role, 'collaborateur');
  assert.equal(restored.submitted, beforeClose.submitted);
  await reopened.tokenStore.clear();
  assert.equal(cookie, 'eclaircie.session=');
  await assert.rejects(client().strapiApi.session('web-cookie-session'), error => [401,403].includes(error.status));
  cookie = cookieBeforeClose;
  const denied = await fetch(baseUrl + '/api/session', { headers: { Cookie: cookie, 'X-Eclaircie-Web-Session': '1', 'Sec-Fetch-Site': 'cross-site', Origin: 'https://untrusted.example' } });
  assert.equal(denied.status, 403);
  assert.match(responses[0].headers.get('cache-control'), /no-store/);
});
