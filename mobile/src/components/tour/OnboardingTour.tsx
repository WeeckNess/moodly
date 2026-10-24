import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, CheckIcon, ShieldCheckIcon, XIcon } from '../../icons';
import { colors as c, mono } from '../../theme';
import { useReducedMotion } from '../../motionPreferences';
import { haptics } from '../../haptics';
import { BrandMark } from '../BrandMark';
import { TourScene } from './TourScene';
import { tourLayout, tourSteps, type TourRoute } from './tourSteps';

const Context = createContext<{ replay: () => void } | null>(null);
// Preserve normal-page anchors and support scrolling; the tour itself uses isolated scenes.
export function TourTarget({ children, style, scroll, revealOnMount = false }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle>; scroll?: RefObject<ScrollView | null>; revealOnMount?: boolean }) {
  return <View onLayout={event => { if (revealOnMount) scroll?.current?.scrollTo({ y: Math.max(0, event.nativeEvent.layout.y - 20), animated: false }); }} style={style}>{children}</View>;
}
export function TourReplayButton() {
  const tour = useContext(Context);
  return <Pressable accessibilityRole="button" onPress={tour?.replay} style={s.replay}><BookOpenIcon size={20} color={c.link} /><Text style={s.replayText}>Revoir la visite guidée</Text><ArrowRightIcon size={18} color={c.link} /></Pressable>;
}

export function OnboardingTour({ account, name, manager, onNavigate, children }: { account: string; name: string; manager: boolean; onNavigate: (route: TourRoute) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false), [index, setIndex] = useState(0);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const steps = tourSteps(manager), step = steps[index], reduced = useReducedMotion();
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets();
  const layout = tourLayout(width, height, insets.top, insets.bottom);
  // Keep completion from previous versions: a visual refresh must not force another visit.
  const storageKey = `eclaircie:tour:v1:${manager ? 'manager' : 'employee'}:${account}`;
  const heading = useRef<Text>(null), scroll = useRef<ScrollView>(null), replayTrigger = useRef<Element | null>(null);
  const progress = useSharedValue(0), opacity = useSharedValue(1), opened = useRef(false);
  const transitionLocked = useRef(false);
  const [transitioning, setTransitioning] = useState(false);
  const unlockTransition = useCallback(() => { transitionLocked.current = false; setTransitioning(false); }, []);
  const showStep = useCallback((next: number) => setIndex(next), []);
  const replay = useCallback(() => {
    opened.current = true;
    if (Platform.OS === 'web') replayTrigger.current = document.activeElement;
    cancelAnimation(opacity); opacity.value = 1;
    transitionLocked.current = false; setTransitioning(false);
    setIndex(0); setOpen(true);
  }, [opacity]);
  useEffect(() => () => { cancelAnimation(opacity); }, [opacity]);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => { void AsyncStorage.getItem(storageKey).then(done => { if (!cancelled && !done && !opened.current) replay(); }).catch(() => {}); }, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [storageKey, replay]);
  useEffect(() => { const listener = AppState.addEventListener('change', value => setActive(value === 'active')); return () => listener.remove(); }, []);
  useLayoutEffect(() => {
    if (!open) return;
    // Replace and lay out the whole step while hidden, then reveal it together.
    scroll.current?.scrollTo({ y: 0, animated: false });
    opacity.value = withTiming(1, { duration: reduced ? 0 : 240 }, finished => {
      if (finished) runOnJS(unlockTransition)();
    });
  }, [open, index, reduced, opacity, unlockTransition]);
  useEffect(() => {
    if (!open) return;
    progress.value = withTiming((index + 1) / steps.length, { duration: reduced ? 0 : 420 });
    AccessibilityInfo.announceForAccessibility(`${index + 1} sur ${steps.length}. ${step.title.replace('\n', ' ')}. ${step.body}`);
    if (Platform.OS === 'web') (heading.current as unknown as HTMLElement | null)?.focus?.({ preventScroll: true });
  }, [open, index, reduced, progress, steps.length, step.title, step.body]);
  function close(finished = false) {
    cancelAnimation(opacity);
    setOpen(false); void AsyncStorage.setItem(storageKey, 'done').catch(() => {});
    if (finished) { haptics.navigate(); onNavigate('home'); }
  }
  function restoreFocus() {
    if (Platform.OS === 'web' && replayTrigger.current?.isConnected) (replayTrigger.current as HTMLElement).focus?.({ preventScroll: true });
  }
  function move(next: number) {
    if (!open || transitionLocked.current) return;
    if (next >= steps.length) { close(true); return; }
    if (next < 0 || next === index) return;
    haptics.navigate();
    if (reduced) { setIndex(next); return; }
    transitionLocked.current = true; setTransitioning(true);
    opacity.value = withTiming(0, { duration: 140 }, finished => {
      if (finished) runOnJS(showStep)(next);
    });
  }
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      // Leave arrows to the interactive weather preview when it owns keyboard focus.
      if (['ArrowRight', 'ArrowLeft'].includes(event.key) && (event.target as HTMLElement)?.getAttribute('role') !== 'slider') { event.preventDefault(); move(index + (event.key === 'ArrowRight' ? 1 : -1)); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open, index, storageKey, reduced]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const last = index === steps.length - 1;
  return <Context.Provider value={{ replay }}>
    <View style={{ flex: 1 }} accessibilityElementsHidden={open} importantForAccessibility={open ? 'no-hide-descendants' : 'auto'} aria-hidden={open}>{children}</View>
    <Modal visible={open} animationType={reduced ? 'none' : 'fade'} onRequestClose={() => close()} onDismiss={restoreFocus} statusBarTranslucent presentationStyle="fullScreen">
      <GestureHandlerRootView style={s.root}>
        <View style={[s.shell, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, paddingHorizontal: layout.gutter }]} accessibilityViewIsModal role="dialog" aria-modal accessibilityLabel="Visite guidée Éclaircie">
          <View style={s.top}><BrandMark size={21} /><Pressable accessibilityRole="button" accessibilityLabel="Passer la visite guidée" onPress={() => close()} style={s.skip}><Text style={s.skipText}>Passer</Text><XIcon size={17} color={c.muted} /></Pressable></View>
          <View style={s.tracking}><View accessible accessibilityRole="progressbar" accessibilityLabel="Progression de la visite" accessibilityValue={{ min: 1, max: steps.length, now: index + 1, text: `Étape ${index + 1} sur ${steps.length}` }} style={s.track}><Animated.View style={[s.trackFill, progressStyle]} /></View><Text style={s.count}>{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</Text></View>
          <ScrollView ref={scroll} style={s.scroll} contentContainerStyle={s.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
            <Animated.View style={[s.content, layout.wide && s.wideContent, contentStyle]}>
              <View style={[s.sceneSlot, { height: layout.stageHeight }, layout.wide && s.wideScene]}>
                {/* Keep the scene alive until the modal's closing fade finishes. */}
                <TourScene key={step.id} scene={step.id} reduced={reduced} active={active} />
              </View>
              <View style={[s.copy, layout.wide && s.wideCopy]}>
                <Text style={s.chapter}>{step.chapter}</Text>
                <Text ref={heading} accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex: -1 as const } : {})} style={[s.title, layout.compact && s.compactTitle, layout.wide && s.wideTitle]}>{step.title}</Text>
                <Text style={[s.body, layout.compact && s.compactBody]}>{index === 0 ? `Bienvenue ${name.split(' ')[0]}. ` : ''}{step.body}</Text>
                <View style={s.hint}><View style={s.hintDot} /><Text style={s.hintText}>{step.hint}</Text></View>
              </View>
            </Animated.View>
          </ScrollView>
          <View style={s.footer}><View style={s.actions}><Pressable accessibilityRole="button" accessibilityLabel="Étape précédente" disabled={index === 0 || transitioning} onPress={() => move(index - 1)} style={({ pressed }) => [s.previous, index === 0 && { opacity: .28 }, pressed && { backgroundColor: c.elevated }]}><ArrowLeftIcon size={21} color={c.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={last ? 'Terminer la visite' : index === 0 ? 'Commencer la visite' : 'Étape suivante'} disabled={transitioning} onPress={() => move(index + 1)} style={({ pressed }) => [s.primary, pressed && { opacity: .8 }]}><Text style={s.primaryText}>{last ? 'C’est à toi' : index === 0 ? 'On découvre ?' : 'Continuer'}</Text>{last ? <CheckIcon size={21} color={c.ink} /> : <ArrowRightIcon size={21} color={c.ink} />}</Pressable></View>{!manager && <View style={s.assurance}><ShieldCheckIcon size={14} color={c.muted} /><Text style={s.assuranceText}>Visite guidée · aucune réponse envoyée</Text></View>}</View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  </Context.Provider>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background }, shell: { flex: 1, width: '100%', maxWidth: 1180, alignSelf: 'center' }, top: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, skip: { minHeight: 44, paddingLeft: 14, flexDirection: 'row', gap: 8, alignItems: 'center' }, skipText: { color: c.muted, fontSize: 12 },
  tracking: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingTop: 11, paddingBottom: 8 }, track: { flex: 1, height: 3, borderRadius: 3, backgroundColor: c.line, overflow: 'hidden' }, trackFill: { height: 3, borderRadius: 3, backgroundColor: c.link }, count: { fontFamily: mono, color: c.muted, fontSize: 10, letterSpacing: 1 },
  scroll: { flex: 1 }, scrollContent: { flexGrow: 1 }, content: { flexGrow: 1, justifyContent: 'center', paddingVertical: 12, gap: 20 }, wideContent: { flexDirection: 'row', alignItems: 'center', gap: 54, paddingVertical: 32 }, sceneSlot: { width: '100%', maxWidth: 410, alignSelf: 'center' }, wideScene: { flex: 1, maxWidth: 520 }, copy: { gap: 13, maxWidth: 440, width: '100%', alignSelf: 'center' }, wideCopy: { flex: 1, maxWidth: 410 },
  chapter: { color: c.link, fontFamily: mono, fontSize: 10, letterSpacing: 1.5, lineHeight: 16 }, title: { fontSize: 36, lineHeight: 40, letterSpacing: -1.5, fontWeight: '600', color: c.text }, compactTitle: { fontSize: 29, lineHeight: 33, letterSpacing: -1 }, wideTitle: { fontSize: 46, lineHeight: 50, letterSpacing: -1.8 }, body: { color: c.muted, fontSize: 15, lineHeight: 23 }, compactBody: { fontSize: 14, lineHeight: 21 }, hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 2 }, hintDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6, backgroundColor: c.link }, hintText: { flex: 1, color: c.link, fontSize: 11, lineHeight: 17 },
  footer: { paddingTop: 12, gap: 12, width: '100%', maxWidth: 440, alignSelf: 'center' }, actions: { flexDirection: 'row', gap: 12 }, previous: { width: 54, minHeight: 54, borderRadius: 20, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, primary: { flex: 1, minHeight: 54, borderRadius: 20, backgroundColor: c.yellow, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, primaryText: { color: c.ink, fontSize: 15, fontWeight: '600' }, assurance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, assuranceText: { color: c.muted, fontSize: 10, lineHeight: 16 },
  replay: { borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 }, replayText: { flex: 1, color: c.link, fontSize: 13, fontWeight: '600' },
});
