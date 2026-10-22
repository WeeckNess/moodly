import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { cancelAnimation, Easing, FadeInDown, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, CheckIcon, ChatsCircleIcon, SunIcon, UserCircleIcon, XIcon } from '../../icons';
import { colors as c, mono } from '../../theme';
import { useReducedMotion } from '../../motionPreferences';
import { haptics } from '../../haptics';
import { fitTourRect, tourCardTop, tourSteps, type TourRect, type TourRoute } from './tourSteps';

const AnimatedPath = Animated.createAnimatedComponent(Path);
type Target = { node: RefObject<View | null>; reveal: () => void };
type TourContext = { target?: string; register: (id: string, target: Target) => () => void; replay: () => void };
const Context = createContext<TourContext | null>(null);
export function TourTarget({ id, children, style, scroll, revealOnMount = false }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle>; scroll?: RefObject<ScrollView | null>; revealOnMount?: boolean }) {
  const tour = useContext(Context), node = useRef<View>(null), y = useRef(0);
  useEffect(() => tour?.register(id, { node, reveal: () => scroll?.current?.scrollTo({ y: Math.max(0, y.current - 20), animated: false }) }), [tour?.register, id, scroll]);
  useEffect(() => { if (tour?.target === id) scroll?.current?.scrollTo({ y: Math.max(0, y.current - 20), animated: false }); }, [tour?.target, id, scroll]);
  return <View ref={node} collapsable={false} onLayout={event => { y.current = event.nativeEvent.layout.y; if (revealOnMount) scroll?.current?.scrollTo({ y: Math.max(0, y.current - 20), animated: false }); }} style={style}>{children}</View>;
}
export function TourReplayButton() {
  const tour = useContext(Context);
  return <Pressable accessibilityRole="button" onPress={tour?.replay} style={s.replay}><BookOpenIcon size={20} color={c.link} /><Text style={s.replayText}>Revoir la visite guidée</Text><ArrowRightIcon size={18} color={c.link} /></Pressable>;
}

export function OnboardingTour({ account, name, manager, onNavigate, children }: { account: string; name: string; manager: boolean; onNavigate: (route: TourRoute) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false), [index, setIndex] = useState(0), [rect, setRect] = useState<TourRect | null>(null), [cardHeight, setCardHeight] = useState(300), [celebrate, setCelebrate] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const targets = useRef(new Map<string, Target>()), navigation = useRef(onNavigate);
  navigation.current = onNavigate;
  const steps = tourSteps(manager), step = steps[index], reduced = useReducedMotion();
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets();
  const storageKey = `eclaircie:tour:v1:${manager ? 'manager' : 'employee'}:${account}`;
  const register = useCallback((id: string, target: Target) => { targets.current.set(id, target); return () => { if (targets.current.get(id) === target) targets.current.delete(id); }; }, []);
  const replay = useCallback(() => { setIndex(0); setRect(null); setOpen(true); }, []);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => { void AsyncStorage.getItem(storageKey).then(done => { if (!cancelled && !done) replay(); }).catch(() => {}); }, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [storageKey, replay]);
  useEffect(() => { const listener = AppState.addEventListener('change', value => setActive(value === 'active')); return () => listener.remove(); }, []);
  useEffect(() => {
    if (!open) return;
    if (!step.target) setRect(null);
    navigation.current(step.route);
    AccessibilityInfo.announceForAccessibility(`${index + 1} sur ${steps.length}. ${step.title}. ${step.body}`);
    let cancelled = false, found = false;
    const fallback = setTimeout(() => { if (!found && !cancelled) setRect(null); }, 500);
    const reveal = setTimeout(() => targets.current.get(step.target ?? '')?.reveal(), 100);
    function measure() {
      const target = targets.current.get(step.target ?? '');
      if (!target) return;
      target.node.current?.measureInWindow((x, y, w, h) => {
        if (cancelled) return;
        found = true;
        const next = fitTourRect({ x, y, w, h }, width, height);
        setRect(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
      });
    }
    const timer = active ? setInterval(measure, 180) : undefined;
    return () => { cancelled = true; clearTimeout(reveal); clearTimeout(fallback); clearInterval(timer); };
  }, [open, index, width, height, active, manager]);
  useEffect(() => { if (!celebrate) return; const timer = setTimeout(() => setCelebrate(false), 1200); return () => clearTimeout(timer); }, [celebrate]);
  function close(finished = false) {
    setOpen(false); void AsyncStorage.setItem(storageKey, 'done').catch(() => {});
    if (finished) { if (!reduced) setCelebrate(true); navigation.current('home'); }
  }
  function move(next: number) { if (next >= steps.length) { close(true); return; } haptics.navigate(); setIndex(Math.max(0, next)); }
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const key = (event: KeyboardEvent) => { if (['Escape', 'ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); if (event.key === 'Escape') close(); else move(index + (event.key === 'ArrowRight' ? 1 : -1)); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open, index, storageKey]);
  const box = useSharedValue({ x: width / 2, y: height / 2, w: 0, h: 0 });
  const cardY = useSharedValue(0), entrance = useSharedValue(0), gesture = useSharedValue(0), shake = useSharedValue(0);
  const top = tourCardTop(index === 0 ? null : rect, height, cardHeight, Math.max(insets.top, insets.bottom));
  useEffect(() => {
    const duration = reduced ? 0 : 550;
    box.value = withTiming(rect ?? { x: width / 2, y: height / 2, w: 0, h: 0 }, { duration, easing: Easing.out(Easing.cubic) });
    cardY.value = withTiming(top, { duration, easing: Easing.out(Easing.cubic) });
  }, [rect, top, reduced, width, height]);
  useEffect(() => { entrance.value = 0; entrance.value = withTiming(1, { duration: reduced ? 0 : 350 }); }, [index, open, reduced]);
  useEffect(() => {
    gesture.value = 0;
    if (open && active && step.gesture && rect && !reduced) gesture.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.cubic) }), -1, false);
    return () => cancelAnimation(gesture);
  }, [index, open, active, !!rect, reduced]);
  const shade = useAnimatedProps(() => {
    const { x, y, w, h } = box.value, r = Math.min(20, w / 2, h / 2);
    return { d: `M0 0H${width}V${height}H0Z M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z` };
  });
  const ring = useAnimatedStyle(() => ({ left: box.value.x, top: box.value.y, width: box.value.w, height: box.value.h, opacity: rect ? 1 : 0 }));
  const cardStyle = useAnimatedStyle(() => ({ top: cardY.value, opacity: entrance.value, transform: [{ translateY: reduced ? 0 : (1 - entrance.value) * 12 }, { translateX: shake.value }] }));
  const cursorStyle = useAnimatedStyle(() => {
    const p = gesture.value, b = box.value;
    return { left: b.x + b.w * (step.gesture === 'swipe' ? .25 + .5 * Math.min(1, p / .75) : .5 + .2 * (1 - Math.min(1, p / .45))), top: b.y + b.h * .5 + (step.gesture === 'swipe' ? -Math.sin(Math.min(1, p / .75) * Math.PI) * b.h * .28 : 40 * (1 - Math.min(1, p / .45))), opacity: reduced ? 0 : p < .08 ? p / .08 : p > .86 ? (1 - p) / .14 : 1, transform: [{ scale: p > .45 && p < .6 ? .8 : 1 }] };
  });
  const rippleStyle = useAnimatedStyle(() => {
    const p = gesture.value, b = box.value;
    return { left: b.x + b.w / 2 - 18, top: b.y + b.h / 2 - 18, opacity: reduced || p < .5 || p > .82 ? 0 : (1 - (p - .5) / .32) * .8, transform: [{ scale: .3 + Math.max(0, p - .5) * 5 }] };
  });
  const last = index === steps.length - 1;
  return <Context.Provider value={{ target: open ? step.target : undefined, register, replay }}>
    <View style={{ flex: 1 }} accessibilityElementsHidden={open} importantForAccessibility={open ? 'no-hide-descendants' : 'auto'} aria-hidden={open}>{children}</View>
    <Modal visible={open} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => close()} statusBarTranslucent>
      <View style={{ flex: 1 }} accessibilityViewIsModal role="dialog" aria-modal accessibilityLabel="Visite guidée Éclaircie">
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => { if (!reduced) shake.value = withSequence(withTiming(-6, { duration: 70 }), withTiming(5, { duration: 70 }), withTiming(0, { duration: 100 })); }}>
          <Svg width={width} height={height}><AnimatedPath animatedProps={shade} fill="#172c23cf" fillRule="evenodd" /></Svg>
        </Pressable>
        <Animated.View pointerEvents="none" style={[s.ring, ring]} />
        {!!rect && step.gesture === 'tap' && <Animated.View pointerEvents="none" accessible={false} style={[s.ripple, rippleStyle]} />}
        {!!rect && !!step.gesture && <Animated.View pointerEvents="none" accessible={false} style={[s.cursor, cursorStyle]}><Svg width={26} height={30} viewBox="0 0 26 30"><Path d="M2 2V24L8 18L12 28L17 26L13 17H22Z" fill={c.cream} stroke={c.ink} strokeWidth={1.8} strokeLinejoin="round" /></Svg></Animated.View>}
        <Animated.View style={[s.cardPosition, { width: Math.min(width - 24, 390), left: (width - Math.min(width - 24, 390)) / 2, maxHeight: height - insets.top - insets.bottom - 24 }, cardStyle]}>
          <ScrollView bounces={false} contentContainerStyle={s.card} onContentSizeChange={(_, h) => setCardHeight(Math.min(h, height - insets.top - insets.bottom - 24))}>
            <View style={s.heading}><View style={s.badge}><SunIcon size={26} color={c.ink} weight="duotone" /></View><Text style={s.eyebrow}>{index === 0 ? 'BIENVENUE CHEZ ÉCLAIRCIE' : 'ON DÉCOUVRE ENSEMBLE'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fermer la visite guidée" onPress={() => close()} style={s.icon}><XIcon size={21} color={c.text} /></Pressable></View>
            <Text accessibilityRole="header" style={s.title}>{index === 0 ? `Salut ${name.split(' ')[0]}.` : step.title}</Text>
            <Text style={s.body}>{step.body}</Text>
            {index === 0 && <View style={s.stops}>{[SunIcon, UserCircleIcon, ChatsCircleIcon].map((Icon, i) => <Animated.View key={i} entering={reduced ? undefined : FadeInDown.duration(400).delay(180 + i * 120)} style={s.stop}><Icon size={24} color={c.link} /><Text style={s.caption}>{[manager ? 'Mon équipe' : 'Ma météo', 'Mon espace', 'Du soutien'][i]}</Text></Animated.View>)}</View>}
            <View style={s.progress}>{steps.map((item, i) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Aller à l’étape ${i + 1} : ${item.title}`} onPress={() => move(i)} style={s.segmentTouch}><View style={[s.segment, { backgroundColor: i <= index ? c.link : c.line }]} /></Pressable>)}</View>
            <View style={s.actions}><Text style={s.caption}>{index + 1} / {steps.length}</Text><View style={s.buttons}>{index > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Étape précédente" onPress={() => move(index - 1)} style={s.previous}><ArrowLeftIcon size={20} color={c.text} /></Pressable>}<Pressable accessibilityRole="button" onPress={() => move(index + 1)} style={s.primary}><Text style={s.primaryText}>{index === 0 ? 'C’est parti' : last ? 'Terminer' : 'Suivant'}</Text>{last ? <CheckIcon size={18} color={c.ink} /> : <ArrowRightIcon size={18} color={c.ink} />}</Pressable></View></View>
            {index === 0 && <Pressable accessibilityRole="button" style={s.skip} onPress={() => close()}><Text style={s.caption}>Plus tard, je découvre à mon rythme</Text></Pressable>}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
    {celebrate && <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>{Array.from({ length: 28 }, (_, i) => <TourConfetti key={i} index={i} width={width} height={height} />)}</View>}
  </Context.Provider>;
}
function TourConfetti({ index, width, height }: { index: number; width: number; height: number }) {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }); return () => cancelAnimation(progress); }, []);
  const style = useAnimatedStyle(() => {
    const p = progress.value, angle = (index / 28) * Math.PI * 2;
    return { opacity: Math.max(0, 1 - p * p), transform: [{ translateX: Math.cos(angle) * p * width * .55 }, { translateY: -Math.abs(Math.sin(angle)) * p * height * .5 + p * p * height * .6 }, { rotate: `${index * 23 + p * 220}deg` }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: width / 2, top: height * .45, width: 7, height: index % 2 ? 12 : 7, borderRadius: 3, backgroundColor: [c.yellow, c.sage, c.coral, c.lavender][index % 4] }, style]} />;
}
const s = StyleSheet.create({
  ripple: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: c.yellow, backgroundColor: '#f8d36b33' },
  ring: { position: 'absolute', borderWidth: 2, borderColor: c.yellow, borderRadius: 20 }, cursor: { position: 'absolute' },
  cardPosition: { position: 'absolute', borderRadius: 26, backgroundColor: c.panel, boxShadow: '0 16px 60px #10251a30', overflow: 'hidden' },
  card: { padding: 22, gap: 16 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, badge: { width: 42, height: 42, borderRadius: 15, backgroundColor: c.yellow, justifyContent: 'center', alignItems: 'center' },
  eyebrow: { flex: 1, fontFamily: mono, fontSize: 9, letterSpacing: 1, color: c.muted, lineHeight: 15 }, icon: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 27, lineHeight: 32, letterSpacing: -.8, color: c.text, fontWeight: '600' }, body: { fontSize: 14, lineHeight: 22, color: c.muted }, caption: { color: c.muted, fontSize: 11, lineHeight: 17 },
  stops: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' }, stop: { flex: 1, borderRadius: 16, padding: 12, backgroundColor: c.background, alignItems: 'center', gap: 8 },
  progress: { flexDirection: 'row', gap: 4 }, segmentTouch: { flex: 1, minHeight: 24, justifyContent: 'center' }, segment: { height: 4, borderRadius: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, buttons: { flexDirection: 'row', gap: 8 }, previous: { width: 46, height: 46, borderRadius: 16, borderColor: c.line, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  primary: { minHeight: 46, borderRadius: 16, backgroundColor: c.yellow, paddingHorizontal: 18, flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: c.ink, fontSize: 14, fontWeight: '600' }, skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  replay: { borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 }, replayText: { flex: 1, color: c.link, fontSize: 13, fontWeight: '600' },
});
