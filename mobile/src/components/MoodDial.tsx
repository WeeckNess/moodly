import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { haptics } from '../haptics';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { weathers } from '../weather';
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedReaction, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolateColor, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { WeatherMorph } from './WeatherMorph';
import { colors as c, mono, moodPalette } from '../theme';
import { continuousValueFromPoint, crossedStops, dialGeometry, pointForValue, sweepDuration, valueFromPoint } from '../dialMath';

export const moodBackgrounds = moodPalette.backgrounds;
export const moodAccents = moodPalette.accents;
const INPUT = [1, 2, 3, 4, 5];
const ACircle = Animated.createAnimatedComponent(Circle);
const FOLLOW = { damping: 40, stiffness: 600, mass: 0.65, overshootClamping: true };
const SWEEP = { easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.Never };
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; listener.remove(); };
  }, []);
  return reduced;
}
export { WeatherMorph } from './WeatherMorph';
export function MoodDial({ score, onChange, motion, compact = false }: { score: number; onChange: (value: number) => void; motion: SharedValue<number>; compact?: boolean }) {
  const [width, setWidth] = useState(320);
  const raw = useSharedValue(score);
  const reduced = useReducedMotion();
  const { radius, cx, cy, orbSize, height } = dialGeometry(width, compact);
  const settleTarget = useSharedValue(-1);
  const lastTick = useSharedValue(0);
  const reportStep = useCallback((value: number) => {
    onChange(value);
  }, [onChange]);
  const tick = useCallback((arrival: boolean) => haptics.detent(arrival), []);
  // Haptics follow integer marker crossings, independently from the nearest-label threshold.
  useAnimatedReaction(() => motion.value, (next, previous) => {
    if (previous === null) return;
    if (lastTick.value && Math.abs(next - lastTick.value) > 0.12) lastTick.value = 0;
    for (const stop of crossedStops(previous, next)) {
      if (lastTick.value !== stop) { lastTick.value = stop; runOnJS(tick)(stop === settleTarget.value); }
    }
  }, [tick]);
  useAnimatedReaction(() => Math.round(motion.value), (next, previous) => {
    if (previous !== null && next !== previous) runOnJS(reportStep)(next);
  }, [reportStep]);
  const orbStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(motion.value, INPUT, moodAccents) }));
  const thumbProps = useAnimatedProps(() => {
    const point = pointForValue(motion.value, radius, cx, cy);
    return { cx: point.x, cy: point.y };
  });
  const gesture = useMemo(() => {
    function follow(x: number, y: number, begin: boolean) {
      'worklet';
      if (Math.hypot(x - cx, y - cy) < radius * 0.35) return;
      const value = begin ? valueFromPoint(x, y, cx, cy) : continuousValueFromPoint(x, y, cx, cy, raw.value);
      raw.value = value;
      motion.value = begin
        ? withTiming(value, { ...SWEEP, duration: sweepDuration(motion.value, value, reduced) })
        : reduced ? withTiming(value, { ...SWEEP, duration: 60 }) : withSpring(value, { ...FOLLOW, reduceMotion: ReduceMotion.Never });
    }
    return Gesture.Pan().minDistance(0)
      .onBegin(event => { settleTarget.value = -1; raw.value = motion.value; follow(event.x, event.y, true); })
      .onUpdate(event => follow(event.x, event.y, false))
      .onFinalize(event => {
        const next = Math.round(raw.value);
        settleTarget.value = Math.hypot(event.velocityX, event.velocityY) > 550 ? next : -1;
        if (next === Math.round(motion.value)) runOnJS(onChange)(next);
        motion.value = withTiming(next, { ...SWEEP, duration: sweepDuration(motion.value, next, reduced) });
      });
  }, [cx, cy, radius, reduced, motion, raw, onChange]);
  const start = pointForValue(1, radius, cx, cy), end = pointForValue(5, radius, cx, cy);
  const path = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;
  const weather = weathers[score - 1];
  function change(value: number) { settleTarget.value = Math.abs(value - motion.value) >= 1.5 ? value : -1; if (value === Math.round(motion.value)) onChange(value); raw.value = value; motion.value = withTiming(value, { ...SWEEP, duration: sweepDuration(motion.value, value, reduced) }); }
  const keyboardProps = Platform.OS === 'web' ? {
    tabIndex: 0 as const,
    onKeyDown: (event: { nativeEvent: { key: string }; preventDefault: () => void }) => {
      const key = event.nativeEvent.key;
      if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      change(key === 'Home' ? 1 : key === 'End' ? 5 : Math.max(1, Math.min(5, Math.round(raw.value) + (['ArrowRight', 'ArrowUp'].includes(key) ? 1 : -1))));
    },
  } : {};
  return <View style={styles.wrapper}>
    <GestureDetector gesture={gesture}><View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[styles.touchArea, { height }, Platform.OS === 'web' && ({ touchAction: 'none', userSelect: 'none' } as any)]}
      {...keyboardProps}
      accessible accessibilityRole="adjustable" aria-valuemin={1} aria-valuemax={5} aria-valuenow={score} aria-valuetext={`${weather.label}, ${weather.title}`} accessibilityLabel="Ta météo, glisse sur l’arc" accessibilityValue={{ min: 1, max: 5, now: score, text: `${weather.label}, ${weather.title}` }}
      accessibilityActions={[{ name: 'increment', label: 'Aller vers très bien' }, { name: 'decrement', label: 'Aller vers très mal' }]}
      onAccessibilityAction={event => change(Math.max(1, Math.min(5, score + (event.nativeEvent.actionName === 'increment' ? 1 : -1))))}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} pointerEvents="none">
        <Defs><LinearGradient id="moodTrack" x1="0%" x2="100%" y1="0%" y2="0%"><Stop offset="0%" stopColor="#a78acd" /><Stop offset="45%" stopColor="#92b37e" /><Stop offset="100%" stopColor="#e8a16c" /></LinearGradient></Defs>
        <Path d={path} fill="none" stroke={c.ink} strokeOpacity={0.08} strokeWidth={26} strokeLinecap="round" />
        <Path d={path} fill="none" stroke="url(#moodTrack)" strokeOpacity={0.75} strokeWidth={10} strokeLinecap="round" />
        {weathers.map(w => { const p = pointForValue(w.score, radius, cx, cy); return <Circle key={w.score} cx={p.x} cy={p.y} r={3} fill={c.ink} opacity={0.55} />; })}
        <ACircle animatedProps={thumbProps} r={17} fill={c.text} fillOpacity={0.12} />
        <ACircle animatedProps={thumbProps} r={11} fill={c.text} />
        <ACircle animatedProps={thumbProps} r={3} fill={c.cream} />
      </Svg>
      <View pointerEvents="none" style={[styles.center, { top: cy - orbSize / 2, left: cx - orbSize / 2, width: orbSize }]}>
        <Animated.View style={[styles.orb, { width: orbSize, height: orbSize, borderRadius: orbSize / 2 }, orbStyle]}><WeatherMorph value={motion} size={(compact ? 65 : 78) * 1.25} /></Animated.View>
      </View>
      <View pointerEvents="none" style={[styles.value, { top: cy + orbSize / 2 + 6, width }]}><Text style={styles.valueTitle}>{weather.label}</Text><Text style={styles.weatherName}>{weather.title.toUpperCase()} · {score}/5</Text></View>
    </View></GestureDetector>
    <View style={styles.ends}><Pressable accessibilityRole="button" accessibilityLabel="Choisir Très mal" onPress={() => change(1)} style={styles.endButton}><Text style={styles.endLabel}>Très mal</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Choisir Très bien" onPress={() => change(5)} style={styles.endButton}><Text style={styles.endLabel}>Très bien</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 360, alignSelf: 'center' }, touchArea: { width: '100%' },
  center: { position: 'absolute', width: 130, alignItems: 'center' }, orb: { alignItems: 'center', justifyContent: 'center' },
  value: { position: 'absolute', left: 0, alignItems: 'center', gap: 7 }, valueTitle: { color: c.text, fontSize: 28, lineHeight: 34, fontWeight: '500', letterSpacing: -0.8 }, weatherName: { fontFamily: mono, color: c.muted, fontSize: 10, letterSpacing: 1.5 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4, paddingHorizontal: 8 }, endButton: { minHeight: 44, minWidth: 72, justifyContent: 'center' }, endLabel: { color: c.text, fontSize: 12 },
});
