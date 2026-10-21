// Fixtures only belong to the disposable API-test database, never the app database.
export function assertTestFixtureDatabase(environment?: string, filename?: string) {
  const normalized = (filename ?? '').replace(/\\/g, '/');
  if (environment === 'production' || !/^\.tmp\/api-test-[0-9a-f-]+\/data\.db$/.test(normalized)) {
    throw new Error('Données fictives interdites dans la base applicative. Utilisez backend:test:api pour les tests isolés.');
  }
}
