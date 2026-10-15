import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { retainPersonalMoods, type PersonalMood } from './personalHistoryLogic';
const memory = new Map<string, PersonalMood[]>();
const keyFor = (profile: string) => `eclaircie.history.${profile}`;
const read = (key: string, demo: boolean) => demo ? AsyncStorage.getItem(key) : Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(key);
const write = (key: string, value: string, demo: boolean) => demo ? AsyncStorage.setItem(key, value) : Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(key, value);
const remove = (key: string, demo: boolean) => demo ? AsyncStorage.removeItem(key) : Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(key);
export async function readPersonalHistory(profile: string, today: string, demo: boolean): Promise<PersonalMood[]> {
  const key = keyFor(profile);
  let index = await read(key, demo);
  if (demo && index === null) {
    const examples = demoPersonalHistory(today);
    for (const entry of examples) await write(`${key}.${entry.day}`, JSON.stringify(entry), demo);
    index = JSON.stringify(examples.map(entry => entry.day));
    await write(key, index, demo);
  }
  let dates: unknown = [];
  if (index) { try { dates = JSON.parse(index); } catch {} }
  const days = Array.isArray(dates) ? dates.filter(day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) : [];
  const entries: PersonalMood[] = [...(memory.get(key) ?? [])];
  for (const day of days) {
    const stored = await read(`${key}.${day}`, demo);
    if (stored) { try { const entry = JSON.parse(stored); if (entry && typeof entry === 'object' && entry.day === day) entries.push(entry); } catch {} }
  }
  const retained = retainPersonalMoods(entries, today);
  const keep = new Set(retained.map(entry => entry.day));
  for (const day of days) if (!keep.has(day)) await remove(`${key}.${day}`, demo);
  await write(key, JSON.stringify([...keep]), demo);
  memory.set(key, retained);
  return retained;
}
export async function savePersonalMood(profile: string, entry: PersonalMood, today: string, demo: boolean) {
  const previous = await readPersonalHistory(profile, today, demo);
  const entries = retainPersonalMoods([...previous, entry], today);
  const key = keyFor(profile);
  const normalized = entries.find(value => value.day === entry.day);
  if (!normalized) throw new Error('Météo personnelle invalide');
  await write(`${key}.${entry.day}`, JSON.stringify(normalized), demo);
  await write(key, JSON.stringify(entries.map(value => value.day)), demo);
  memory.set(key, entries);
  return entries;
}
export async function clearPersonalHistory(profile: string, today: string, demo: boolean) {
  const entries = await readPersonalHistory(profile, today, demo);
  const key = keyFor(profile);
  for (const entry of entries) await remove(`${key}.${entry.day}`, demo);
  await write(key, '[]', demo); memory.delete(key);
}
export function clearPersonalMemory() { memory.clear(); }
export function demoPersonalHistory(today: string): PersonalMood[] {
  return Array.from({ length: 22 }, (_, index) => {
    const date = new Date(today + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() - index - 1);
    return { day: date.toISOString().slice(0, 10), score: [4, 3, 5, 4, 2, 3, 4][index % 7], tags: index % 3 ? ['Ambiance'] : ['Équilibre'] };
  }).filter((_, index) => index % 5 !== 3);
}
