import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { branchPath, canopyPath, clamp, mix, ramp, treeProgress, trunkPath, type TreeSpecies } from '../treeGeometry';
import { useReducedMotion } from './MoodDial';
const APath = Animated.createAnimatedComponent(Path);
const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const leafColors = ['#a8c28b', '#c5d89f', '#bed39a', '#92b47e', '#aac68a', '#cbdca6', '#d5e2b1'];
function Branch({ day, species, index }: { day: SharedValue<number>; species: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => ({ d: branchPath(day.value, species.value, index), strokeWidth: mix(1, 3, ramp(day.value, 1, 24)), opacity: ramp(day.value, 0, 3) * (index >= 3 ? 1 - clamp(species.value - 1) : 1) }));
  return <APath animatedProps={props} stroke="#baa67c" fill="none" strokeLinecap="round" />;
}
function Leaves({ day, species, breeze, index }: { day: SharedValue<number>; species: SharedValue<number>; breeze: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => ({ d: canopyPath(day.value, species.value, index, Math.sin(breeze.value + index * .6)), opacity: (index < 2 ? ramp(day.value, 0, .5) : ramp(day.value, [0, 0, 3, 6, 8, 11, 14][index], [1, 1, 12, 15, 17, 20, 23][index])) * (index >= 3 ? 1 - clamp(species.value - 1) : 1) }));
  return <APath animatedProps={props} fill={leafColors[index]} />;
}
function Bud({ day, breeze, index }: { day: SharedValue<number>; breeze: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => ({ r: 3.2 * ramp(day.value, 23 + index * 5, 32 + index * 5), opacity: .65 + .12 * Math.sin(breeze.value + index) }));
  return <ACircle animatedProps={props} cx={[119, 188, 154][index]} cy={[102, 104, 71][index]} fill="#efdc94" />;
}
export function GrowingTree({ days, species, label }: { days: number; species: TreeSpecies; label: string }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const progress = useSharedValue(treeProgress(days));
  const essence = useSharedValue(['oak', 'willow', 'pine'].indexOf(species));
  const breeze = useSharedValue(0);
  useEffect(() => { const listener = AppState.addEventListener('change', state => setActive(state === 'active')); return () => listener.remove(); }, []);
  useEffect(() => { progress.value = withTiming(treeProgress(days), { duration: reduced ? 0 : 1800, easing: Easing.inOut(Easing.cubic) }); }, [days, reduced, progress]);
  useEffect(() => { essence.value = withTiming(['oak', 'willow', 'pine'].indexOf(species), { duration: reduced ? 0 : 1400, easing: Easing.inOut(Easing.cubic) }); }, [species, reduced, essence]);
  useEffect(() => {
    cancelAnimation(breeze);
    if (!reduced && active) { breeze.value = 0; breeze.value = withRepeat(withTiming(Math.PI * 2, { duration: 10000, easing: Easing.linear }), -1, false); }
    else breeze.value = 0;
    return () => cancelAnimation(breeze);
  }, [reduced, active, breeze]);
  const trunk = useAnimatedProps(() => ({ d: trunkPath(progress.value, essence.value), strokeWidth: mix(2, 7, ramp(progress.value, 0, 24)), opacity: ramp(progress.value, 0, .5) }));
  const sway = useAnimatedProps(() => ({ transform: `rotate(${Math.sin(breeze.value) * .7} 160 220)` }));
  const seed = useAnimatedProps(() => ({ rx: mix(6, 2, ramp(progress.value, 0, 2)), ry: mix(3.5, 1.5, ramp(progress.value, 0, 2)), opacity: mix(1, .4, ramp(progress.value, 0, 3)) }));
  const sun = useAnimatedProps(() => ({ opacity: .65 + .08 * Math.sin(breeze.value) }));
  return <View accessible accessibilityRole="image" accessibilityLabel={label}>
    <Svg width="100%" height={255} viewBox="0 0 320 255" pointerEvents="none" {...(Platform.OS === 'web' ? { 'aria-hidden': true } : { accessibilityElementsHidden: true })}>
      <ACircle animatedProps={sun} cx={251} cy={49} r={20} fill="#edda8c" />
      <Path d="M25 224 Q95 207 160 219 Q236 204 295 224" stroke="#a8b991" strokeWidth={1} fill="none" opacity={.5} />
      <AEllipse animatedProps={seed} cx={160} cy={220} fill="#eedfa7" />
      <AG animatedProps={sway}>
        <APath animatedProps={trunk} stroke="#c9b58a" strokeLinecap="round" fill="none" />
        {leafColors.map((_, index) => <Branch key={index} index={index} day={progress} species={essence} />)}
        {leafColors.map((_, index) => <Leaves key={index} index={index} day={progress} species={essence} breeze={breeze} />)}
        {[0, 1, 2].map(index => <Bud key={index} index={index} day={progress} breeze={breeze} />)}
      </AG>
    </Svg>
  </View>;
}
