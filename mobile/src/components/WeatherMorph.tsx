import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useReducedMotion } from '../motionPreferences';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { weatherContours } from '../weatherContours';
import { weatherMorphPath } from '../weatherMorphGeometry';
const APath = Animated.createAnimatedComponent(Path);

export function WeatherMorph({ value, size = 96, animate = false }: { value: SharedValue<number>; size?: number; animate?: boolean }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const phase = useSharedValue(0);
  const live = animate && active && !reduced;
  useEffect(() => {
    if (!animate) return;
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, [animate]);
  useEffect(() => {
    cancelAnimation(phase);
    phase.value = 0;
    if (live) phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 6800, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(phase);
  }, [live, phase]);
  const fill = useAnimatedProps(() => ({ d: weatherMorphPath(value.value, weatherContours, 'fill', live ? phase.value : 0), opacity: .2 + (live ? Math.sin(phase.value) * .012 : 0) }));
  const ink = useAnimatedProps(() => ({ d: weatherMorphPath(value.value, weatherContours, 'ink', live ? phase.value : 0) }));
  return <Svg width={size} height={size} viewBox="0 0 256 256" pointerEvents="none" {...(Platform.OS === 'web' ? { 'aria-hidden': true } : { accessibilityElementsHidden: true })}>
    <APath animatedProps={fill} fill="#25352a" fillRule="evenodd" />
    <APath animatedProps={ink} fill="#25352a" fillRule="evenodd" />
  </Svg>;
}
