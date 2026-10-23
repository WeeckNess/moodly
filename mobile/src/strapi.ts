import { NativeModules, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { resolveApiUrl } from './apiConfig';
import type { DemoPersonalProfile } from './personalHistoryLogic';
export type TeamAction = { id: string; title: string; description: string; dueDay: string; status: 'planned' | 'active' | 'completed'; reviewUntil: string | null; reviewClosed: boolean; hasResponded: boolean; feedback: { count: number; average: number } | null; threshold: number };
export type Role = 'collaborateur' | 'manager';
export type MoodTag = { id: string; label: string; icon: string };
export type SupportContact = { name: string; kind: 'psychologue' | 'prevention' | 'manager' | 'autre'; qualification?: string; details?: string; email?: string; phone?: string; bookingUrl?: string };
export type Session = { demoProfile?: DemoPersonalProfile; mustChangePassword?: boolean; name: string; role: Role; team: { name: string; supportContacts?: SupportContact[] }; submitted: boolean; day: string; privateSupportKey?: string };
export type DailyStat = { day: string; average: number | null };
export type TeamStats = { data: DailyStat[]; meta: { team: string; threshold: number; participation: number | null; maskedDays: number } };
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
function apiUrl() {
  return resolveApiUrl({
    configuredUrl: process.env.EXPO_PUBLIC_API_URL,
    development: __DEV__,
    webOrigin: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined,
    bundleUrl: __DEV__ && Platform.OS !== 'web' ? NativeModules.SourceCode?.scriptURL : undefined,
  });
}
async function request(path: string, init: RequestInit = {}) {
  const baseUrl = apiUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...init.headers } });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(body?.error?.message ?? 'Le service est momentanément indisponible.', response.status);
    if (!body) throw new ApiError('La réponse du serveur est illisible. Réessaie dans un instant.', 502);
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion et l’adresse de l’API.');
  } finally { clearTimeout(timer); }
}
const auth = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });
export const tokenStore = {
  // Sur le web, le jeton reste en mémoire uniquement. Sur mobile, stockage sécurisé système.
  read: () => Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync('eclaircie.jwt'),
  write: (jwt: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync('eclaircie.jwt', jwt),
  clear: () => Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync('eclaircie.jwt'),
};
export type CreatedEmployee = { name: string; email: string; team: string; initialPassword: string };
export const strapiApi = {
  changePassword: (jwt: string, currentPassword: string, password: string, passwordConfirmation: string): Promise<{ jwt: string }> => request('/api/auth/change-password', { method: 'POST', headers: auth(jwt), body: JSON.stringify({ currentPassword, password, passwordConfirmation }) }),
  createEmployee: async (jwt: string, data: { name: string; email: string }): Promise<CreatedEmployee> => (await request('/api/team-members', { method: 'POST', headers: auth(jwt), body: JSON.stringify({ data }) })).data,
  tags: async (jwt: string): Promise<MoodTag[]> => (await request('/api/mood-tags', { headers: auth(jwt) })).data,
  actions: async (jwt: string): Promise<TeamAction[]> => (await request('/api/team-actions', { headers: auth(jwt) })).data,
  createAction: (jwt: string, data: { title: string; description: string; dueDay: string }) => request('/api/team-actions', { method: 'POST', headers: auth(jwt), body: JSON.stringify({ data }) }),
  updateAction: (jwt: string, id: string, status: 'active' | 'completed') => request(`/api/team-actions/${id}`, { method: 'PATCH', headers: auth(jwt), body: JSON.stringify({ data: { status } }) }),
  actionFeedback: (jwt: string, id: string, score: number) => request(`/api/team-actions/${id}/feedback`, { method: 'POST', headers: auth(jwt), body: JSON.stringify({ data: { score } }) }),
  login: (identifier: string, password: string): Promise<{ jwt: string }> => request('/api/auth/local', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  session: async (jwt: string): Promise<Session> => (await request('/api/session', { headers: auth(jwt) })).data,
  submitMood: (jwt: string, score: number, tags: string[]) => request('/api/mood-entries', { method: 'POST', headers: auth(jwt), body: JSON.stringify({ data: { score, tags } }) }),
  teamStats: (jwt: string): Promise<TeamStats> => request('/api/team-stats?days=30', { headers: auth(jwt) }),
};
