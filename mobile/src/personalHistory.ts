import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { advanceGrowth, retainPersonalMoods, type DemoPersonalProfile, type Growth, type PersonalMood } from './personalHistoryLogic';
import { isTreeSpecies, type TreeSpecies } from './treeGeometry';
const speciesMemory = new Map<string, TreeSpecies>();
const growthMemory = new Map<string, Growth>();
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
  const previousGrowth = await readGrowth(profile);
  const growth = advanceGrowth(previousGrowth, entry.day);
  await write(`${key}.growth`, JSON.stringify(growth));
  growthMemory.set(key, growth);
  memory.set(key, entries);
  return entries;
}
export async function clearPersonalHistory(profile: string, today: string) {
  const entries = await readPersonalHistory(profile, today);
  const key = keyFor(profile);
  for (const entry of entries) await remove(`${key}.${entry.day}`);
  await write(key, '[]'); memory.delete(key);
  await remove(`${key}.growth`); growthMemory.delete(key);
  await remove(`${key}.species`); speciesMemory.delete(key);
}
export function clearPersonalMemory() { memory.clear(); growthMemory.clear(); speciesMemory.clear(); }
export async function readGrowth(profile: string): Promise<Growth> {
  const key = keyFor(profile);
  const stored = await read(`${key}.growth`);
  if (stored) { try { const parsed = JSON.parse(stored); if (Number.isSafeInteger(parsed.count) && parsed.count >= 0 && (parsed.lastDay === null || /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastDay))) return parsed; } catch {} }
  return growthMemory.get(key) ?? { count: 0, lastDay: null };
}

export async function readTreeSpecies(profile: string): Promise<TreeSpecies> {
  const key = keyFor(profile), stored = await read(`${key}.species`);
  return isTreeSpecies(stored) ? stored : speciesMemory.get(key) ?? 'oak';
}
export async function saveTreeSpecies(profile: string, species: TreeSpecies) {
  if (!isTreeSpecies(species)) throw new Error('Essence inconnue');
  const key = keyFor(profile);
  await write(`${key}.species`, species); speciesMemory.set(key, species);
}

// Called only for a fictitious profile explicitly supplied by the demo backend.
export async function initializeDemoPersonalHistory(profile: string, fixture: DemoPersonalProfile, today: string) {
  if (fixture.version !== 1 || !Number.isSafeInteger(fixture.growth?.count) || fixture.growth.count < 0 || fixture.growth.count > 110 ||
      !Array.isArray(fixture.entries) || fixture.entries.length > 29 || typeof fixture.growth.lastDay !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fixture.growth.lastDay) || fixture.growth.lastDay >= today) return;
  const entries = retainPersonalMoods(fixture.entries, today).filter(entry => entry.day <= fixture.growth.lastDay!);
  if (entries.length !== fixture.entries.length || entries.length > fixture.growth.count) return;
  const existing = await readPersonalHistory(profile, today);
  const previous = await readGrowth(profile);
  // Existing local entries take precedence, including a weather submitted during the demo.
  const merged = retainPersonalMoods([...entries, ...existing], today);
  const key = keyFor(profile);
  for (const entry of merged) await write(`${key}.${entry.day}`, JSON.stringify(entry));
  await write(key, JSON.stringify(merged.map(entry => entry.day)));
  memory.set(key, merged);
  const addedDays = existing.filter(entry => entry.day > fixture.growth.lastDay!);
  const count = Math.max(previous.count, fixture.growth.count + addedDays.length);
  const lastDay = [previous.lastDay, fixture.growth.lastDay, ...addedDays.map(entry => entry.day)].filter((day): day is string => day !== null).sort().pop()!;
  const growth = { count, lastDay };
  await write(`${key}.growth`, JSON.stringify(growth));
  growthMemory.set(key, growth);
}
