import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nextSupportState, type SupportState } from './supportLogic';
const memory = new Map<string, SupportState>();
export async function recordPrivateMood(profileKey: string, day: string, score: number, demo: boolean) {
  const key = `eclaircie.support.${profileKey}`;
  let stored: string | null = null;
  if (demo) stored = await AsyncStorage.getItem(key).catch(() => null);
  else if (Platform.OS !== 'web') stored = await SecureStore.getItemAsync(key).catch(() => null);
  let previous: SupportState = memory.get(key) ?? { lowDays: [], promptedOn: null };
  if (stored) { try { const parsed = JSON.parse(stored); if (Array.isArray(parsed.lowDays) && parsed.lowDays.every((d: unknown) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))) previous = { lowDays: parsed.lowDays, promptedOn: typeof parsed.promptedOn === 'string' ? parsed.promptedOn : null }; } catch {} }
  const result = nextSupportState(previous, day, score);
  if (demo) await AsyncStorage.setItem(key, JSON.stringify(result.state)).catch(() => {});
  else if (Platform.OS !== 'web') await SecureStore.setItemAsync(key, JSON.stringify(result.state)).catch(() => {});
  memory.set(key, result.state);
  return result.shouldPrompt;
}
export function clearSupportMemory() { memory.clear(); }
