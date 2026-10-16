import { svgTransform } from '../svgTransform';
import { haptics } from '../haptics';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { branchPath, canopyPath, clamp, gardenMilestones, fruitPath, fruitPosition, gardenLife, mix, ramp, treeProgress, trunkPath, type TreeSpecies } from '../treeGeometry';
import { useReducedMotion } from './MoodDial';
const WEB = Platform.OS === 'web';
const APath = Animated.createAnimatedComponent(Path);
const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const leafColors = ['#8aaa70', '#adc783', '#a2bd79', '#779d65', '#91b16f', '#b0c98d', '#bdcf98'];
function Branch({ day, species, index }: { day: SharedValue<number>; species: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => ({ d: branchPath(day.value, species.value, index), strokeWidth: mix(1, 3, ramp(day.value, 1, 24)), opacity: ramp(day.value, 0, 3) * (index >= 3 ? 1 - clamp(species.value - 1) : 1) }));
  return <APath animatedProps={props} stroke="#baa67c" fill="none" strokeLinecap="round" />;
}
function Leaves({ day, species, breeze, index }: { day: SharedValue<number>; species: SharedValue<number>; breeze: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => ({ d: canopyPath(day.value, species.value, index, Math.sin(breeze.value + index * .6)), opacity: (index < 2 ? ramp(day.value, 0, .5) : ramp(day.value, [0, 0, 3, 6, 8, 11, 14][index], [1, 1, 12, 15, 17, 20, 23][index])) * (index >= 3 ? 1 - clamp(species.value - 1) : 1) }));
  return <APath animatedProps={props} fill={leafColors[index]} />;
}
function Grass({ day, breeze, index }: { day: SharedValue<number>; breeze: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => {
    const start = 5 + index * 1.3, height = (9 + index % 4 * 4) * ramp(day.value, start, start + 17);
    const x = 49 + index * 12.5, y = 220 + Math.sin(index * .8) * 3;
    const wind = Math.sin(breeze.value + index * .5) * height * .15;
    return { d: `M${x},${y} Q${x - 6 + wind},${y - height * .6} ${x - 5 + wind},${y - height} M${x},${y} Q${x + 6 + wind},${y - height * .45} ${x + 7 + wind},${y - height * .7}`, opacity: ramp(day.value, start, start + 5) * .7 };
  });
  return <APath animatedProps={props} stroke={index % 2 ? '#9dbf7e' : '#759765'} strokeWidth={1.7} strokeLinecap="round" fill="none" />;
}
function GroundFlower({ day, breeze, index }: { day: SharedValue<number>; breeze: SharedValue<number>; index: number }) {
  const x = [64, 251, 95, 222, 43, 277][index], y = [214, 217, 210, 211, 220, 221][index];
  const props = useAnimatedProps(() => { const size = ramp(day.value, 18 + index * 9, 36 + index * 9); return { ...svgTransform(WEB, x, y, Math.sin(breeze.value + index) * 4, size), opacity: size }; });
  return <AG animatedProps={props}><Path d="M0 3 Q-2 -4 0 -13" fill="none" stroke="#759b61" strokeWidth={1.4} />{[0, 1, 2, 3, 4].map(petal => <Ellipse key={petal} cx={0} cy={-16} rx={2.5} ry={4} fill={index % 2 ? '#b48bc8' : '#ecc85c'} transform={`rotate(${petal * 72} 0 -12)`} />)}<Circle cx={0} cy={-12} r={2} fill="#d6a341" /></AG>;
}
function OrchardFruit({ day, species, breeze, index }: { day: SharedValue<number>; species: SharedValue<number>; breeze: SharedValue<number>; index: number }) {
  const delay = index * 4;
  const group = useAnimatedProps(() => { const p = fruitPosition(species.value, index); return { ...svgTransform(WEB, p.x, p.y, Math.sin(breeze.value + index) * 2.5) }; });
  const blossom = useAnimatedProps(() => { const size = gardenLife(day.value - delay).blossom; return { ...svgTransform(WEB, 0, 0, 0, size), opacity: size }; });
  const fruit = useAnimatedProps(() => { const size = gardenLife(day.value - delay).fruit; return { d: fruitPath(species.value, size), fill: interpolateColor(species.value, [0, 1, 2], ['#d9ac66', '#e2cf88', '#b58d62']), opacity: size }; });
  const cap = useAnimatedProps(() => { const size = gardenLife(day.value - delay).fruit; return { d: `M${-5 * size},${-3 * size} Q0,${-8 * size} ${5 * size},${-3 * size} Q0,${-1 * size} ${-5 * size},${-3 * size}Z`, opacity: size * (1 - clamp(species.value)) }; });
  const stem = useAnimatedProps(() => ({ d: `M0,-2 Q2,-6 0,-10`, opacity: ramp(day.value - delay, 26, 38) }));
  const texture = useAnimatedProps(() => { const size = gardenLife(day.value - delay).fruit; return { d: `M${-2 * size},${-3 * size} L${2 * size},0 L${-2 * size},${3 * size} M${2 * size},${-3 * size} L${-2 * size},0 L${2 * size},${3 * size}`, opacity: size * clamp(species.value - 1) * .6 }; });
  return <AG animatedProps={group}>
    <APath animatedProps={stem} stroke="#9f8f69" strokeWidth={1} fill="none" />
    <AG animatedProps={blossom}>{[0, 1, 2, 3, 4].map(petal => <Ellipse key={petal} cx={0} cy={-3} rx={2.4} ry={4} fill="#ffe8b1" transform={`rotate(${petal * 72})`} />)}<Circle r={2} fill="#dfbf75" /></AG>
    <APath animatedProps={fruit} /><APath animatedProps={cap} fill="#927851" /><APath animatedProps={texture} stroke="#715b43" strokeWidth={.8} fill="none" />
  </AG>;
}
export function GrowingTree({ days, species, label, interactive = false }: { days: number; species: TreeSpecies; label: string; interactive?: boolean }) {
  const previousDays = useRef(days);
  useEffect(() => { if (interactive && gardenMilestones.some(step => step.day > previousDays.current && step.day <= days)) haptics.grow(); previousDays.current = days; }, [days, interactive]);
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
  const sway = useAnimatedProps(() => ({ ...svgTransform(WEB, 0, 0, Math.sin(breeze.value) * .7, 1, 160, 220) }));
  const seed = useAnimatedProps(() => ({ rx: mix(6, 2, ramp(progress.value, 0, 2)), ry: mix(3.5, 1.5, ramp(progress.value, 0, 2)), opacity: mix(1, .4, ramp(progress.value, 0, 3)) }));
  const sun = useAnimatedProps(() => ({ opacity: .65 + .08 * Math.sin(breeze.value) }));
  return <View accessible accessibilityRole="image" accessibilityLabel={label}>
    <Svg width="100%" height={255} viewBox="0 0 320 255" pointerEvents="none" {...(Platform.OS === 'web' ? { 'aria-hidden': true } : { accessibilityElementsHidden: true })}>
      <ACircle animatedProps={sun} cx={251} cy={49} r={20} fill="#f3c95f" />
      <Path d="M25 224 Q95 207 160 219 Q236 204 295 224" stroke="#6c8662" strokeWidth={1} fill="none" opacity={.5} />
      {Array.from({ length: 19 }, (_, index) => <Grass key={index} day={progress} breeze={breeze} index={index} />)}
      <AEllipse animatedProps={seed} cx={160} cy={220} fill="#eedfa7" />
      <AG animatedProps={sway}>
        <APath animatedProps={trunk} stroke="#c9b58a" strokeLinecap="round" fill="none" />
        {leafColors.map((_, index) => <Branch key={index} index={index} day={progress} species={essence} />)}
        {leafColors.map((_, index) => <Leaves key={index} index={index} day={progress} species={essence} breeze={breeze} />)}
        {Array.from({ length: 7 }, (_, index) => <OrchardFruit key={index} index={index} day={progress} species={essence} breeze={breeze} />)}
      </AG>
      {Array.from({ length: 6 }, (_, index) => <GroundFlower key={index} index={index} day={progress} breeze={breeze} />)}
    </Svg>
  </View>;
}
