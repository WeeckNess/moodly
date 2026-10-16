import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoHaptics from 'expo-haptics';
const key = 'eclaircie.preferences.haptics';
let enabled = true, ready = false, initialization: Promise<void> | null = null;
let lastTick = -Infinity, lastNavigation = -Infinity, protectedUntil = 0;
const timers = new Set<ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
export const getHapticsEnabled = () => enabled;
export function subscribeHaptics(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function cancelHaptics() { for (const timer of timers) clearTimeout(timer); timers.clear(); protectedUntil = 0; }
export function initializeHaptics() {
  if (!initialization) initialization = AsyncStorage.getItem(key).then(value => { enabled = value !== 'off'; ready = true; listeners.forEach(listener => listener()); }).catch(() => { enabled = false; ready = true; listeners.forEach(listener => listener()); });
  return initialization;
}
export async function setHapticsEnabled(next: boolean) {
  await initializeHaptics();
  const previous = enabled;
  if (!next) { enabled = false; cancelHaptics(); listeners.forEach(listener => listener()); }
  try { await AsyncStorage.setItem(key, next ? 'on' : 'off'); enabled = next; }
  catch (error) { enabled = previous; listeners.forEach(listener => listener()); throw error; }
  listeners.forEach(listener => listener());
}
export function activateHaptics() {
  void initializeHaptics();
  const listener = AppState.addEventListener('change', state => { if (state !== 'active') cancelHaptics(); });
  return () => { listener.remove(); cancelHaptics(); };
}
const canPlay = () => ready && enabled && Platform.OS !== 'web' && AppState.currentState === 'active';
type Pulse = 'tick' | 'settle' | 'add' | 'remove' | 'soft' | 'light' | 'navigation';
function pulse(kind: Pulse) {
  if (!canPlay()) return;
  const android = { tick: ExpoHaptics.AndroidHaptics.Segment_Tick, settle: ExpoHaptics.AndroidHaptics.Confirm, add: ExpoHaptics.AndroidHaptics.Virtual_Key, remove: ExpoHaptics.AndroidHaptics.Toggle_Off, soft: ExpoHaptics.AndroidHaptics.Context_Click, light: ExpoHaptics.AndroidHaptics.Confirm, navigation: ExpoHaptics.AndroidHaptics.Long_Press };
  const ios = { tick: ExpoHaptics.ImpactFeedbackStyle.Medium, settle: ExpoHaptics.ImpactFeedbackStyle.Heavy, add: ExpoHaptics.ImpactFeedbackStyle.Rigid, remove: ExpoHaptics.ImpactFeedbackStyle.Light, soft: ExpoHaptics.ImpactFeedbackStyle.Medium, light: ExpoHaptics.ImpactFeedbackStyle.Heavy, navigation: ExpoHaptics.ImpactFeedbackStyle.Heavy };
  const operation = Platform.OS === 'android' ? ExpoHaptics.performAndroidHapticsAsync(android[kind]) : ExpoHaptics.impactAsync(ios[kind]);
  void operation.catch(() => {});
}
function sequence(steps: [number, Pulse][]) {
  if (!canPlay()) return;
  cancelHaptics(); protectedUntil = Date.now() + steps[steps.length - 1][0] + 100;
  for (const [delay, kind] of steps) {
    if (!delay) pulse(kind);
    else { const timer = setTimeout(() => { timers.delete(timer); pulse(kind); }, delay); timers.add(timer); }
  }
}
export const haptics = {
  navigate() {
    if (!canPlay() || Date.now() < protectedUntil || Date.now() - lastNavigation < 180) return;
    lastNavigation = Date.now(); pulse('navigation');
  },
  detent(arrival = false) { if (Date.now() - lastTick < 42 || Date.now() < protectedUntil || !canPlay()) return; lastTick = Date.now(); pulse(arrival ? 'settle' : 'tick'); },
  reason(selected: boolean) { if (Date.now() >= protectedUntil) pulse(selected ? 'add' : 'remove'); },
  confirm(celebrate = false) { sequence(celebrate ? [[0, 'soft'], [95, 'light'], [420, 'soft'], [530, 'light']] : [[0, 'soft'], [95, 'light']]); },
  grow() { if (Date.now() >= protectedUntil) sequence([[0, 'soft'], [110, 'light']]); },
  test() { sequence([[0, 'tick'], [100, 'soft'], [210, 'light']]); },
};
