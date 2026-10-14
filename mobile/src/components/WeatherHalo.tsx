import { useEffect, useId, useState } from 'react';
import { AccessibilityInfo, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Mask, RadialGradient, Stop } from 'react-native-svg';
import { haloFrame } from '../haloMotion';
import { moodPalette } from '../theme';
const AEllipse = Animated.createAnimatedComponent(Ellipse);

function LightField({ value, size, ring = false }: { value: SharedValue<number>; size: number; ring?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tint = useAnimatedProps(() => ({ fill: interpolateColor(value.value, [1, 2, 3, 4, 5], moodPalette.accents) }));
  return <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <Defs><RadialGradient id={`haloFade${id}`} cx="50%" cy="50%" rx="50%" ry="50%">
      {(ring ? [[0, 0], [36, 0], [49, 0.55], [57, 1], [68, 0.3], [85, 0]] : [[0, 1], [38, 0.8], [70, 0.2], [100, 0]]).map(([offset, opacity]) => <Stop key={offset} offset={`${offset}%`} stopColor="white" stopOpacity={opacity} />)}
    </RadialGradient><Mask id={`haloMask${id}`} x={0} y={0} width={size} height={size} maskUnits="userSpaceOnUse"><Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} fill={`url(#haloFade${id})`} /></Mask></Defs>
    <AEllipse animatedProps={tint} cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} mask={`url(#haloMask${id})`} />
  </Svg>;
}
function LightWave({ value, phase, offset, size, reach }: { value: SharedValue<number>; phase: SharedValue<number>; offset: number; size: number; reach: number }) {
  const diameter = size * 2.6;
  const style = useAnimatedStyle(() => {
    const progress = (phase.value + offset) % 1;
    const frame = haloFrame(progress, size, reach);
    return { opacity: frame.opacity, transform: [{ scale: frame.scale }] };
  });
  return <Animated.View style={[{ position: 'absolute', width: diameter, height: diameter, left: (size - diameter) / 2, top: (size - diameter) / 2 }, style]}><LightField value={value} size={diameter} ring /></Animated.View>;
}
export function WeatherHalo({ value, size }: { value: SharedValue<number>; size: number }) {
  const { width, height } = useWindowDimensions();
  const reach = Math.hypot(width, height);
  const phase = useSharedValue(0);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; listener.remove(); };
  }, []);
  useEffect(() => {
    if (!reduced) phase.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.linear }), -1, false);
    else { cancelAnimation(phase); phase.value = 0; }
    return () => cancelAnimation(phase);
  }, [reduced, phase]);
  const diameter = size * 3.2;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', width: size, height: size, left: 0, top: 0 }}>
    <View style={{ position: 'absolute', width: diameter, height: diameter, left: (size - diameter) / 2, top: (size - diameter) / 2, opacity: 0.045 }}><LightField value={value} size={diameter} /></View>
    {!reduced && [0, 0.25, 0.5, 0.75].map(offset => <LightWave key={offset} value={value} phase={phase} offset={offset} size={size} reach={reach} />)}
  </View>;
}
