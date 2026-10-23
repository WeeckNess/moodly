import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoHaptics from 'expo-haptics';
const key = 'eclaircie.preferences.haptics';
let enabled = true, ready = false, initialization: Promise<void> | null = null;
let webActivated = false, webBlocked = false, webPlayingUntil = 0;
export type HapticsStatus = 'loading' | 'native' | 'unsupported' | 'inactive' | 'needs-interaction' | 'blocked' | 'off' | 'available';
const webNavigator = () => typeof navigator !== 'undefined' ? navigator : null;
const webVisible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';
const webHasInteraction = () => webNavigator()?.userActivation?.hasBeenActive ?? webActivated;
export function getHapticsStatus(): HapticsStatus {
  if (Platform.OS === 'web' && typeof webNavigator()?.vibrate !== 'function') return 'unsupported';
  if (!ready) return 'loading';
  if (!enabled) return 'off';
  if (AppState.currentState !== 'active' || Platform.OS === 'web' && !webVisible()) return 'inactive';
  if (Platform.OS !== 'web') return 'native';
  if (!webHasInteraction()) return 'needs-interaction';
  return webBlocked ? 'blocked' : 'available';
}
let lastTick = -Infinity, lastNavigation = -Infinity, protectedUntil = 0;
const timers = new Set<ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
export const getHapticsEnabled = () => enabled;
export function subscribeHaptics(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function cancelHaptics() {
  for (const timer of timers) clearTimeout(timer); timers.clear(); protectedUntil = 0;
  if (Platform.OS === 'web' && webPlayingUntil > Date.now()) { try { webNavigator()?.vibrate?.(0); } catch {} }
  webPlayingUntil = 0;
}
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
  const notify = () => listeners.forEach(listener => listener());
  const listener = AppState.addEventListener('change', state => { if (state !== 'active') cancelHaptics(); notify(); });
  const interaction = (event: Event) => { if (!event.isTrusted) return; const changed = !webActivated; webActivated = true; if (changed) notify(); };
  const visibility = () => { if (!webVisible()) cancelHaptics(); notify(); };
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.addEventListener('pointerup', interaction, true);
    document.addEventListener('touchend', interaction, true);
    document.addEventListener('keydown', interaction, true);
    document.addEventListener('visibilitychange', visibility);
  }
  return () => {
    listener.remove(); cancelHaptics();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.removeEventListener('pointerup', interaction, true);
      document.removeEventListener('touchend', interaction, true);
      document.removeEventListener('keydown', interaction, true);
      document.removeEventListener('visibilitychange', visibility);
    }
  };
}
const canPlay = () => ready && enabled && AppState.currentState === 'active' && (Platform.OS !== 'web' || webVisible() && typeof webNavigator()?.vibrate === 'function' && webHasInteraction());
function vibrateWeb(pattern: number | number[]): boolean {
  if (!canPlay()) return false;
  let accepted = false;
  try { accepted = webNavigator()!.vibrate(pattern); } catch {}
  if (webBlocked !== !accepted) { webBlocked = !accepted; listeners.forEach(listener => listener()); }
  webPlayingUntil = accepted ? Date.now() + (Array.isArray(pattern) ? pattern.reduce((sum, duration) => sum + duration, 0) : pattern) : 0;
  return accepted;
}
type Pulse = 'tick' | 'settle' | 'add' | 'remove' | 'soft' | 'light' | 'navigation';
const webDurations: Record<Pulse, number> = { tick: 14, settle: 28, add: 20, remove: 12, soft: 24, light: 40, navigation: 28 };
function pulse(kind: Pulse) {
  if (!canPlay()) return false;
  if (Platform.OS === 'web') return vibrateWeb(webDurations[kind]);
  const android = { tick: ExpoHaptics.AndroidHaptics.Segment_Tick, settle: ExpoHaptics.AndroidHaptics.Confirm, add: ExpoHaptics.AndroidHaptics.Virtual_Key, remove: ExpoHaptics.AndroidHaptics.Toggle_Off, soft: ExpoHaptics.AndroidHaptics.Context_Click, light: ExpoHaptics.AndroidHaptics.Confirm, navigation: ExpoHaptics.AndroidHaptics.Long_Press };
  const ios = { tick: ExpoHaptics.ImpactFeedbackStyle.Medium, settle: ExpoHaptics.ImpactFeedbackStyle.Heavy, add: ExpoHaptics.ImpactFeedbackStyle.Rigid, remove: ExpoHaptics.ImpactFeedbackStyle.Light, soft: ExpoHaptics.ImpactFeedbackStyle.Medium, light: ExpoHaptics.ImpactFeedbackStyle.Heavy, navigation: ExpoHaptics.ImpactFeedbackStyle.Heavy };
  const operation = Platform.OS === 'android' ? ExpoHaptics.performAndroidHapticsAsync(android[kind]) : ExpoHaptics.impactAsync(ios[kind]);
  void operation.catch(() => {});
  return true;
}
function sequence(steps: [number, Pulse][]): boolean {
  if (!canPlay()) return false;
  cancelHaptics(); protectedUntil = Date.now() + steps[steps.length - 1][0] + 100;
  if (Platform.OS === 'web') {
    const pattern: number[] = [];
    let end = 0;
    for (const [delay, kind] of steps) {
      if (pattern.length) pattern.push(Math.max(0, delay - end));
      pattern.push(webDurations[kind]); end = delay + webDurations[kind];
    }
    const accepted = vibrateWeb(pattern);
    if (!accepted) protectedUntil = 0;
    return accepted;
  }
  for (const [delay, kind] of steps) {
    if (!delay) pulse(kind);
    else { const timer = setTimeout(() => { timers.delete(timer); pulse(kind); }, delay); timers.add(timer); }
  }
  return true;
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
  test() { return sequence([[0, 'tick'], [100, 'soft'], [210, 'light']]); },
};
