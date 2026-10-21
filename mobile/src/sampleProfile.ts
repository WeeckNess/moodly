import AsyncStorage from '@react-native-async-storage/async-storage';
import { readPersonalHistory, savePersonalMood } from './personalHistory';
import { retainPersonalMoods, type PersonalMood } from './personalHistoryLogic';

// Local development fixtures only. Never configure this with a real person's history.
export function sampleEntries(raw: string | undefined, profile: string, today: string): PersonalMood[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (value?.profile !== profile || !Array.isArray(value.entries) || value.entries.length > 30) return [];
    if (value.entries.some((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return true;
      const row = entry as PersonalMood;
      return typeof row.day !== 'string' || !Number.isInteger(row.score) || row.score < 1 || row.score > 5 || !Array.isArray(row.tags) || row.tags.length > 20 || row.tags.some(tag => typeof tag !== 'string' || tag.length > 80);
    })) return [];
    return retainPersonalMoods(value.entries, today).sort((a, b) => a.day.localeCompare(b.day));
  } catch { return []; }
}
const jobs = new Map<string, Promise<void>>();
const disabledKey = (profile: string) => `eclaircie.sample-profile.disabled.${profile}`;
export async function hydrateSampleProfile(profile: string, today: string) {
  if (!__DEV__) return;
  const entries = sampleEntries(process.env.EXPO_PUBLIC_SAMPLE_PROFILE, profile, today);
  if (!entries.length) return;
  const running = jobs.get(profile);
  if (running) return running;
  const job = (async () => {
    if (await AsyncStorage.getItem(disabledKey(profile)) === 'yes') return;
    const existing = new Set((await readPersonalHistory(profile, today)).map(entry => entry.day));
    for (const entry of entries) if (!existing.has(entry.day)) await savePersonalMood(profile, entry, today);
  })();
  jobs.set(profile, job);
  try { await job; } finally { jobs.delete(profile); }
}
export async function disableSampleProfile(profile: string, today: string) {
  if (__DEV__ && sampleEntries(process.env.EXPO_PUBLIC_SAMPLE_PROFILE, profile, today).length) {
    await jobs.get(profile);
    // Preference only: clearing the recap must not recreate sample data on reload.
    await AsyncStorage.setItem(disabledKey(profile), 'yes');
  }
}
