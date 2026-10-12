// Non branché aux écrans de démo. Contrat des futures routes dans docs/api.md.
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:1337';
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? 'Service indisponible');
  return body;
}
export const strapiApi = {
  login: (identifier: string, password: string) => request('/api/auth/local', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  submitMood: (jwt: string, score: number, tags: string[]) => request('/api/mood-entries', { method: 'POST', headers: { Authorization: `Bearer ${jwt}` }, body: JSON.stringify({ data: { score, tags } }) }),
  teamStats: (jwt: string) => request('/api/team-stats?days=30', { headers: { Authorization: `Bearer ${jwt}` } }),
};
