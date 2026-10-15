import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { retainPersonalMoods, type PersonalMood } from './personalHistoryLogic';
const memory = new Map<string, PersonalMood[]>();
const keyFor = (profile: string) => `eclaircie.history.${profile}`;
const read = (key: string) => Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key);
const write = (key: string, value: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, value);
const remove = (key: string) => Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key);
export async function readPersonalHistory(profile: string, today: string): Promise<PersonalMood[]> {
  const key = keyFor(profile);
  let index = await read(key);
  let dates: unknown = [];
  if (index) { try { dates = JSON.parse(index); } catch {} }
  const days = Array.isArray(dates) ? dates.filter(day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) : [];
  const entries: PersonalMood[] = [...(memory.get(key) ?? [])];
  for (const day of days) {
    const stored = await read(`${key}.${day}`);
    if (stored) { try { const entry = JSON.parse(stored); if (entry && typeof entry === 'object' && entry.day === day) entries.push(entry); } catch {} }
  }
  const retained = retainPersonalMoods(entries, today);
  const keep = new Set(retained.map(entry => entry.day));
  for (const day of days) if (!keep.has(day)) await remove(`${key}.${day}`);
  await write(key, JSON.stringify([...keep]));
  memory.set(key, retained);
  return retained;
}
export async function savePersonalMood(profile: string, entry: PersonalMood, today: string) {
  const previous = await readPersonalHistory(profile, today);
  const entries = retainPersonalMoods([...previous, entry], today);
  const key = keyFor(profile);
  const normalized = entries.find(value => value.day === entry.day);
  if (!normalized) throw new Error('Météo personnelle invalide');
  await write(`${key}.${entry.day}`, JSON.stringify(normalized));
  await write(key, JSON.stringify(entries.map(value => value.day)));
  memory.set(key, entries);
  return entries;
}
export async function clearPersonalHistory(profile: string, today: string) {
  const entries = await readPersonalHistory(profile, today);
  const key = keyFor(profile);
  for (const entry of entries) await remove(`${key}.${entry.day}`);
  await write(key, '[]'); memory.delete(key);
}
export function clearPersonalMemory() { memory.clear(); }
