import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { weathers } from '../weather';
import { mono } from '../theme';
import { pointForValue, valueFromPoint } from '../dialMath';

export const moodBackgrounds = ['#251e32', '#1c2b3b', '#202e29', '#363022', '#3c2b23'];
export const moodAccents = ['#d4c5f0', '#b7d4ed', '#c9dfbd', '#f4da8c', '#f5be8e'];
const INPUT = [1, 2, 3, 4, 5];
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
export function WeatherMorph({ value, size = 96 }: { value: Animated.Value; size?: number }) {
  return <Animated.View pointerEvents="none" style={{ width: size, height: size, transform: [{ rotate: value.interpolate({ inputRange: INPUT, outputRange: ['-16deg', '-8deg', '0deg', '8deg', '16deg'] }) }, { scale: value.interpolate({ inputRange: INPUT, outputRange: [0.92, 0.96, 1, 1.04, 1.08] }) }] }}>
    {weathers.map((weather, i) => <Animated.View key={weather.score} style={[StyleSheet.absoluteFill, { opacity: value.interpolate({ inputRange: INPUT, outputRange: INPUT.map((_, n) => n === i ? 1 : 0) }), alignItems: 'center', justifyContent: 'center' }]}><weather.icon color="#25352a" size={size} weight="duotone" /></Animated.View>)}
  </Animated.View>;
}
export function MoodDial({ score, onChange, motion, compact = false }: { score: number; onChange: (value: number) => void; motion: Animated.Value; compact?: boolean }) {
  const [width, setWidth] = useState(320);
  const [position, setPosition] = useState(score);
  const root = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const geometry = useRef({ cx: 160, cy: 150, radius: 130 });
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const lastValue = useRef(score);
  const reduced = useReducedMotion();
  const radius = width * 0.405, cx = width / 2, cy = width * 0.455;
  const height = width * 0.84;
  geometry.current = { cx, cy, radius };
  useEffect(() => {
    const listener = motion.addListener(({ value }) => setPosition(value));
    return () => motion.removeListener(listener);
  }, [motion]);
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  function update(pageX: number, pageY: number) {
    const { cx, cy } = geometry.current;
    const value = valueFromPoint(pageX - origin.current.x, pageY - origin.current.y, cx, cy);
    lastValue.current = value; motion.stopAnimation(); motion.setValue(value);
    onChangeRef.current(Math.round(value));
  }
  function snap(value: number) {
    const next = Math.round(value); onChangeRef.current(next);
    if (reducedRef.current) motion.setValue(next);
    else Animated.spring(motion, { toValue: next, damping: 18, stiffness: 180, mass: 0.7, useNativeDriver: false }).start();
  }
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      const { pageX, pageY, locationX, locationY } = event.nativeEvent;
      origin.current = { x: pageX - locationX, y: pageY - locationY };
      root.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
      update(pageX, pageY);
    },
    onPanResponderMove: event => update(event.nativeEvent.pageX, event.nativeEvent.pageY),
    onPanResponderRelease: () => snap(lastValue.current),
    onPanResponderTerminate: () => snap(lastValue.current),
    onPanResponderTerminationRequest: () => false,
  })).current;
  const start = pointForValue(1, radius, cx, cy), end = pointForValue(5, radius, cx, cy);
  const thumb = pointForValue(position, radius, cx, cy);
  const path = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;
  const weather = weathers[score - 1];
  function change(value: number) { lastValue.current = value; snap(value); }
  const keyboardProps = Platform.OS === 'web' ? {
    tabIndex: 0 as const,
    onKeyDown: (event: { nativeEvent: { key: string }; preventDefault: () => void }) => {
      const key = event.nativeEvent.key;
      if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      change(key === 'Home' ? 1 : key === 'End' ? 5 : Math.max(1, Math.min(5, score + (['ArrowRight', 'ArrowUp'].includes(key) ? 1 : -1))));
    },
  } : {};
  return <View style={styles.wrapper}>
    <View ref={root} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[styles.touchArea, { height }, Platform.OS === 'web' && ({ touchAction: 'none', userSelect: 'none' } as any)]}
      {...responder.panHandlers} {...keyboardProps}
      accessible accessibilityRole="adjustable" aria-valuemin={1} aria-valuemax={5} aria-valuenow={score} aria-valuetext={`${weather.label}, ${weather.title}`} accessibilityLabel="Ta météo, glisse sur l’arc" accessibilityValue={{ min: 1, max: 5, now: score, text: `${weather.label}, ${weather.title}` }}
      accessibilityActions={[{ name: 'increment', label: 'Aller vers très bien' }, { name: 'decrement', label: 'Aller vers très mal' }]}
      onAccessibilityAction={event => change(Math.max(1, Math.min(5, score + (event.nativeEvent.actionName === 'increment' ? 1 : -1))))}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} pointerEvents="none">
        <Defs><LinearGradient id="moodTrack" x1="0%" x2="100%" y1="0%" y2="0%"><Stop offset="0%" stopColor="#c5b2e5" /><Stop offset="45%" stopColor="#c0d5bc" /><Stop offset="100%" stopColor="#f2bd83" /></LinearGradient></Defs>
        <Path d={path} fill="none" stroke="#ffffff" strokeOpacity={0.08} strokeWidth={26} strokeLinecap="round" />
        <Path d={path} fill="none" stroke="url(#moodTrack)" strokeOpacity={0.75} strokeWidth={10} strokeLinecap="round" />
        {weathers.map(w => { const p = pointForValue(w.score, radius, cx, cy); return <Circle key={w.score} cx={p.x} cy={p.y} r={3} fill="#26322d" opacity={0.55} />; })}
        <Circle cx={thumb.x} cy={thumb.y} r={17} fill="#f8f5e9" fillOpacity={0.17} />
        <Circle cx={thumb.x} cy={thumb.y} r={11} fill="#f8f5e9" />
        <Circle cx={thumb.x} cy={thumb.y} r={3} fill="#354134" />
      </Svg>
      <View pointerEvents="none" style={[styles.center, { top: cy - (compact ? 55 : 64), left: cx - 65 }]}>
        <Animated.View style={[styles.orb, { width: compact ? 106 : 126, height: compact ? 106 : 126, borderRadius: 80, backgroundColor: motion.interpolate({ inputRange: INPUT, outputRange: moodAccents }) }]}><WeatherMorph value={motion} size={compact ? 65 : 78} /></Animated.View>
      </View>
      <View pointerEvents="none" style={[styles.value, { top: cy + radius * 0.44, width }]}><Text style={styles.valueTitle}>{weather.label}</Text><Text style={styles.weatherName}>{weather.title.toUpperCase()} · {score}/5</Text></View>
    </View>
    <View style={styles.ends}><Pressable accessibilityRole="button" accessibilityLabel="Choisir Très mal" onPress={() => change(1)} style={styles.endButton}><Text style={styles.endLabel}>Très mal</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Choisir Très bien" onPress={() => change(5)} style={styles.endButton}><Text style={styles.endLabel}>Très bien</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 360, alignSelf: 'center' }, touchArea: { width: '100%' },
  center: { position: 'absolute', width: 130, alignItems: 'center' }, orb: { alignItems: 'center', justifyContent: 'center' },
  value: { position: 'absolute', left: 0, alignItems: 'center', gap: 7 }, valueTitle: { color: '#f8f5e9', fontSize: 28, lineHeight: 34, fontWeight: '500', letterSpacing: -0.8 }, weatherName: { fontFamily: mono, color: '#d1d5c8', fontSize: 10, letterSpacing: 1.5 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4, paddingHorizontal: 8 }, endButton: { minHeight: 44, minWidth: 72, justifyContent: 'center' }, endLabel: { color: '#deded0', fontSize: 12 },
});
