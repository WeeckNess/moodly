import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { gardenPercent } from '../gardenAnimation';
import { profileBranch, profileBranches, profileBud, profileCanopy, profileDetail, profileFlower, profileFlowers, profileFruit, profileFruits, profileGrass, profileLeaf, profileMilestones, profileRoot, profileSprigs, profileTreeState } from '../profileTree';
import { svgTransform } from '../svgTransform';
import { colors as c } from '../theme';
import { haptics } from '../haptics';
import { useReducedMotion } from '../motionPreferences';

const APath = Animated.createAnimatedComponent(Path), ACircle = Animated.createAnimatedComponent(Circle), AG = Animated.createAnimatedComponent(G), AEllipse = Animated.createAnimatedComponent(Ellipse);
const web = Platform.OS === 'web';
const greens = ['#bdd7ad', '#a6c88e', '#b0cf98', '#9cbe86', '#b8d5a3', '#a9c994'];
type Growth = { progress: SharedValue<number>; index: number };
function Root({ progress, index }: Growth) {
  const side = index % 2 ? 1 : -1, reach = 12 + Math.floor(index / 2) * 9;
  const props = useAnimatedProps(() => ({ strokeDashoffset: 100 * (1 - profileRoot(progress.value, index)), opacity: profileRoot(progress.value, index) }));
  return <APath d={`M180 251q${side * 6} ${9 + index} ${side * reach} ${18 + index * 2}`} animatedProps={props} stroke="#a2ad85" strokeWidth={1.8} strokeLinecap="round" fill="none" strokeDasharray={[100, 100]} />;
}
function Branch({ progress, index }: Growth) {
  const [x, y, start] = profileBranches[index];
  const props = useAnimatedProps(() => ({ strokeDashoffset: 120 * (1 - profileBranch(progress.value, index)), strokeWidth: profileTreeState(progress.value).trunkWidth * .75, opacity: profileBranch(progress.value, index) }));
  return <APath d={`M180 ${start}L${x} ${y}`} animatedProps={props} stroke="#6b7652" strokeLinecap="round" fill="none" strokeDasharray={[120, 120]} />;
}
function Leaf({ progress, index }: Growth) {
  const [x, y, r] = profileCanopy[index];
  const props = useAnimatedProps(() => ({ r: r * profileLeaf(progress.value, index) }));
  return <ACircle cx={x} cy={y} animatedProps={props} fill={greens[index % greens.length]} />;
}
function Bud({ progress, index }: Growth) {
  const [x, y] = profileBranches[index];
  const props = useAnimatedProps(() => ({ r: 7 * profileBud(progress.value, index), opacity: profileBud(progress.value, index) }));
  return <ACircle cx={x} cy={y} animatedProps={props} fill="#a6c88e" />;
}
function Sprig({ progress, index }: Growth) {
  const [x, y, angle] = profileSprigs[index];
  const props = useAnimatedProps(() => ({ ...svgTransform(web, x, y, angle, profileDetail(progress.value, index)), opacity: .5 * profileDetail(progress.value, index) }));
  return <AG animatedProps={props}><Path d="M0 9V-9" stroke="#668a56" strokeWidth={1.2} strokeLinecap="round" /><Ellipse cx={-4} cy={-4} rx={5} ry={2.5} fill="#739b60" transform="rotate(35 -4 -4)" /><Ellipse cx={4} cy={1} rx={5} ry={2.5} fill="#739b60" transform="rotate(-35 4 1)" /></AG>;
}
function Fruit({ progress, index }: Growth) {
  const [x, y] = profileFruits[index];
  const props = useAnimatedProps(() => ({ ...svgTransform(web, x, y, 0, profileFruit(progress.value, index)), opacity: profileFruit(progress.value, index) }));
  return <AG animatedProps={props}><Path d="M0-3q-2-5 1-7" stroke="#6b7652" strokeWidth={1.3} fill="none" /><Ellipse cx={3} cy={-7} rx={4} ry={2} fill="#668a56" transform="rotate(-25 3 -7)" /><Circle r={5.5} fill={index % 3 ? '#e5b25e' : '#e49a7c'} /><Circle cx={-1.5} cy={-1.5} r={1.5} fill="#fff0c6" opacity={.65} /></AG>;
}
function Grass({ progress, index }: Growth) {
  const x = [114, 240, 135, 222, 99, 259][index];
  const props = useAnimatedProps(() => ({ ...svgTransform(web, x, 250, 0, profileGrass(progress.value, index)), opacity: profileGrass(progress.value, index) }));
  return <AG animatedProps={props}><Path d="M0 0q-1-9-6-13M0 0q0-13 4-17M0 0q5-7 10-8" stroke="#789b65" strokeWidth={1.5} strokeLinecap="round" fill="none" /><Circle cx={4} cy={-17} r={2.7} fill={index % 2 ? c.coral : c.yellow} /></AG>;
}
function Flower({ progress, index }: Growth) {
  const [x, y] = profileFlowers[index];
  const props = useAnimatedProps(() => {
    const amount = profileFlower(progress.value, index);
    return { ...svgTransform(web, x, y, 0, amount), opacity: amount };
  });
  return <AG animatedProps={props}>{[0, 1, 2, 3, 4].map(petal => <Ellipse key={petal} cx={0} cy={-3} rx={2.8} ry={4.5} fill={index % 2 ? c.yellow : c.coral} transform={`rotate(${petal * 72})`} />)}<Circle r={2.5} fill="#fffcf5" /></AG>;
}

// Profile-only artwork: the stored daily count stays independent of the visual stages.
export function SoftGardenTree({ days, label, interactive = false }: { days: number; label: string; interactive?: boolean }) {
  const target = gardenPercent(days), reduced = useReducedMotion();
  const progress = useSharedValue(target);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const previousDays = useRef(days);
  useEffect(() => { if (interactive && profileMilestones.some(step => step.day > previousDays.current && step.day <= days)) haptics.grow(); previousDays.current = days; }, [days, interactive]);
  useEffect(() => { const listener = AppState.addEventListener('change', state => setActive(state === 'active')); return () => listener.remove(); }, []);
  useEffect(() => {
    cancelAnimation(progress);
    if (active) progress.value = reduced ? target : withTiming(target, { duration: Math.max(700, Math.min(2400, Math.abs(target - progress.value) * 35)), easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [target, reduced, active, progress]);
  const trunk = useAnimatedProps(() => { const state = profileTreeState(progress.value); return { strokeDashoffset: 143 * (1 - state.trunk), strokeWidth: state.trunkWidth, opacity: state.trunk }; });
  const seed = useAnimatedProps(() => { const state = profileTreeState(progress.value); return { opacity: state.seed, rx: 7 + state.seedOpen * 2, ry: 4 + state.seedOpen }; });
  const shoot = useAnimatedProps(() => { const state = profileTreeState(progress.value); return { opacity: state.shoot, ...svgTransform(web, 180, 252 - state.trunk * 143, 0, state.shoot) }; });
  return <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: '100%', aspectRatio: 360 / 310 }}>
    <Svg width="100%" height="100%" viewBox="0 0 360 310" pointerEvents="none" {...(web ? { 'aria-hidden': true } : { accessibilityElementsHidden: true })}>
      <Circle cx={180} cy={148} r={121} fill="#e5eddb" opacity={.65} />
      {Array.from({ length: 10 }, (_, index) => <Root key={index} index={index} progress={progress} />)}
      <Ellipse cx={180} cy={250} rx={85} ry={13} fill="#bfd6ae" />
      <AEllipse animatedProps={seed} cx={180} cy={252} fill="#9b825d" />
      <APath animatedProps={trunk} d="M180 252V109" stroke="#6b7652" strokeLinecap="round" fill="none" strokeDasharray={[143, 143]} />
      {profileBranches.map((_, index) => <Branch key={index} index={index} progress={progress} />)}
      {profileBranches.map((_, index) => <Bud key={index} index={index} progress={progress} />)}
      <AG animatedProps={shoot}><Ellipse cx={-9} cy={-3} rx={12} ry={5} fill="#a6c88e" transform="rotate(28 -9 -3)" /><Ellipse cx={9} cy={-6} rx={12} ry={5} fill={c.sage} transform="rotate(-28 9 -6)" /></AG>
      {profileCanopy.map((_, index) => <Leaf key={index} index={index} progress={progress} />)}
      {profileSprigs.map((_, index) => <Sprig key={index} index={index} progress={progress} />)}
      {profileFlowers.map((_, index) => <Flower key={index} index={index} progress={progress} />)}
      {profileFruits.map((_, index) => <Fruit key={index} index={index} progress={progress} />)}
      {Array.from({ length: 6 }, (_, index) => <Grass key={index} index={index} progress={progress} />)}
    </Svg>
  </View>;
}
