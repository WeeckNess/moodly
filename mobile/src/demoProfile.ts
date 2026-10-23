import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDemoPersonalHistory } from './personalHistory';
import type { DemoPersonalProfile } from './personalHistoryLogic';

const jobs = new Map<string, Promise<void>>();
const disabledKey = (profile: string) => `eclaircie.demo-profile.disabled.${profile}`;

export async function hydrateDemoProfile(profile: string, fixture: DemoPersonalProfile | undefined, today: string) {
  if (!fixture) return;
  const running = jobs.get(profile);
  if (running) return running;
  const job = (async () => {
    if (await AsyncStorage.getItem(disabledKey(profile)) === 'yes') return;
    await initializeDemoPersonalHistory(profile, fixture, today);
  })();
  jobs.set(profile, job);
  try { await job; } finally { jobs.delete(profile); }
}

export async function disableDemoProfile(profile: string) {
  await jobs.get(profile);
  // Only an opt-out preference is persisted in plain storage, never personal weather data.
  await AsyncStorage.setItem(disabledKey(profile), 'yes');
}
