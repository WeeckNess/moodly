import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CheckIcon } from '../../icons';
import { colors as c, moodPalette } from '../../theme';
import { continuousValueFromPoint, valueFromPoint } from '../../dialMath';
import { WeatherMorph } from '../WeatherMorph';
import { type TourSceneKind } from './tourSteps';

const AGroup = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);
const ease = Easing.inOut(Easing.cubic);
// SVG text does not inherit React Native Text's system font on the web.
const sceneFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
});
function SceneText(props: ComponentProps<typeof SvgText>) {
  return <SvgText {...props} fontFamily={sceneFont} />;
}

export function TourScene({ scene, reduced, active }: { scene: TourSceneKind; reduced: boolean; active: boolean }) {
  const progress = useSharedValue(reduced ? 1 : 0), weather = useSharedValue(scene === 'finish' ? 5 : 3), touchPulse = useSharedValue(0);
  const [canvasWidth, setCanvasWidth] = useState(360);
  const drag = useMemo(() => Gesture.Pan().enabled(scene === 'mood').minDistance(0).onBegin(event => {
    const x = event.x * 360 / canvasWidth, y = event.y * 360 / canvasWidth;
    if (Math.hypot(x - 180, y - 151) < 50) return;
    cancelAnimation(weather);
    weather.value = withTiming(valueFromPoint(x, y, 180, 151), { duration: reduced ? 0 : 420 });
  }).onUpdate(event => {
    const x = event.x * 360 / canvasWidth, y = event.y * 360 / canvasWidth;
    if (Math.hypot(x - 180, y - 151) < 50) return;
    weather.value = withTiming(continuousValueFromPoint(x, y, 180, 151, weather.value), { duration: reduced ? 0 : 70 });
  }).onFinalize(() => {
    weather.value = withTiming(Math.round(weather.value), { duration: reduced ? 0 : 180 });
  }), [scene, canvasWidth, weather, reduced]);
  const isWeather = ['welcome', 'mood', 'self', 'finish'].includes(scene);
  useEffect(() => {
    if (!active) return;
    progress.value = reduced ? 1 : withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [scene, active, reduced, progress]);
  useEffect(() => {
    if (active && !reduced && isWeather) weather.value = withRepeat(withSequence(withDelay(1100, withTiming(5, { duration: 1800, easing: ease })), withDelay(1000, withTiming(2, { duration: 2200, easing: ease })), withDelay(1000, withTiming(3, { duration: 1400, easing: ease }))), -1, false);
    return () => cancelAnimation(weather);
  }, [scene, active, reduced, isWeather, weather]);
  useEffect(() => {
    touchPulse.value = 0;
    if (scene === 'mood' && active && !reduced) touchPulse.value = withRepeat(withTiming(1, { duration: 1250, easing: ease }), -1, true);
    return () => cancelAnimation(touchPulse);
  }, [scene, active, reduced, touchPulse]);
  const touchGlow = useAnimatedProps(() => {
    const angle = (150 + (weather.value - 1) * 60) * Math.PI / 180;
    return { cx: 180 + 124 * Math.cos(angle), cy: 151 + 124 * Math.sin(angle), r: 22 + touchPulse.value * 4, opacity: .13 + touchPulse.value * .09 };
  });
  const touchHalo = useAnimatedProps(() => {
    const angle = (150 + (weather.value - 1) * 60) * Math.PI / 180;
    return { cx: 180 + 124 * Math.cos(angle), cy: 151 + 124 * Math.sin(angle), r: 16 + touchPulse.value * 2, opacity: .28 + touchPulse.value * .1 };
  });
  const orb = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(weather.value, [1, 2, 3, 4, 5], moodPalette.accents) }));
  const thumb = useAnimatedProps(() => {
    const angle = (150 + (weather.value - 1) * 60) * Math.PI / 180;
    return { cx: 180 + 124 * Math.cos(angle), cy: 151 + 124 * Math.sin(angle) };
  });
  function choose(value: number) { cancelAnimation(weather); weather.value = withTiming(value, { duration: reduced ? 0 : 700, easing: ease }); }
  return <View style={s.outer}>
    <View style={s.canvas} onLayout={event => setCanvasWidth(event.nativeEvent.layout.width)}>
      <Svg width="100%" height="100%" viewBox="0 0 360 300" {...(Platform.OS === 'web' ? { 'aria-hidden': true } : { accessible: false, accessibilityElementsHidden: true })}>
        <Circle cx={180} cy={150} r={138} fill={scene === 'support' ? '#e4e7f8' : scene === 'garden' ? '#e5eddb' : '#eef0e3'} />
        <Ellipse cx={180} cy={275} rx={105} ry={8} fill="#283c3109" />
        {isWeather && <><Path d="M72.6 213 A124 124 0 1 1 287.4 213" fill="none" stroke={c.line} strokeWidth={8} strokeLinecap="round" />{[1, 2, 3, 4, 5].map(v => { const a = (150 + (v - 1) * 60) * Math.PI / 180; return <Circle key={v} cx={180 + 124 * Math.cos(a)} cy={151 + 124 * Math.sin(a)} r={3} fill={c.muted} />; })}{scene === 'mood' && <><ACircle animatedProps={touchGlow} fill={c.yellow} /><ACircle animatedProps={touchHalo} fill={c.yellow} /></>}<ACircle animatedProps={thumb} r={12} fill={c.panel} stroke={c.ink} strokeWidth={scene === 'mood' ? 2 : 3} /></>}
        {scene === 'profile' && <G><Rect x={54} y={47} width={252} height={210} rx={25} fill={c.panel} stroke={c.line} /><Path d="M54 105H306" stroke={c.line} /><SceneText x={74} y={82} fontSize={18} fill={c.text} fontWeight="600">éclaircie.</SceneText><Circle cx={275} cy={77} r={20} fill={c.yellow} /><Circle cx={275} cy={73} r={6} fill="none" stroke={c.ink} strokeWidth={2} /><Path d="M264 88q11-15 22 0" fill="none" stroke={c.ink} strokeWidth={2} /><SceneText x={180} y={153} fontSize={23} fill={c.text} textAnchor="middle">Mon espace</SceneText>{['Jardin', 'Calendrier', 'Rapports'].map((t,i) => <G key={t}><Rect x={72+i*74} y={173} width={68} height={29} rx={14} fill={c.background} /><SceneText x={106+i*74} y={192} fontSize={10} fill={c.link} textAnchor="middle">{t}</SceneText></G>)}<SceneText x={180} y={232} fontSize={11} fill={c.link} textAnchor="middle">Pour toi uniquement</SceneText></G>}
        {scene === 'support' && <G><Rect x={131} y={41} width={98} height={81} rx={27} fill={c.lavender} /><Path d="M155 65q0-8 10-8h29q10 0 10 10v15q0 10-10 10h-19l-15 10 3-12q-8-2-8-10Z" stroke={c.ink} strokeWidth={3} fill="none" strokeLinejoin="round" /><Circle cx={170} cy={75} r={2} fill={c.ink} /><Circle cx={180} cy={75} r={2} fill={c.ink} /><Circle cx={190} cy={75} r={2} fill={c.ink} /><Rect x={54} y={141} width={252} height={114} rx={23} fill={c.panel} stroke={c.line} /><SceneText x={180} y={179} fontSize={18} fill={c.text} textAnchor="middle">Et si on prenait</SceneText><SceneText x={180} y={205} fontSize={18} fill={c.text} textAnchor="middle">un moment pour parler ?</SceneText><SceneText x={180} y={235} fontSize={11} fill={c.link} textAnchor="middle">À ton initiative</SceneText></G>}
        {scene === 'garden' && <GardenDrawing progress={progress} />}
        {scene === 'calendar' && <CalendarDrawing progress={progress} />}
        {scene === 'reasons' && <G><Rect x={47} y={65} width={266} height={172} rx={27} fill={c.panel} stroke={c.line} /><SceneText x={70} y={98} fontSize={13} fill={c.muted}>CE QUI JOUE POUR TOI</SceneText>{['La charge', 'L’équipe', 'Mon équilibre'].map((label, i) => <RevealGroup key={label} progress={progress} order={i}><Rect x={69} y={113 + i * 34} width={222} height={27} rx={13.5} fill={i === 1 ? c.sage : c.background} /><SceneText x={84} y={131 + i * 34} fontSize={13} fill={c.text}>{label}</SceneText>{i === 1 && <Path d="M268 157l4 4 7-8" fill="none" stroke={c.ink} strokeWidth={2} strokeLinecap="round" />}</RevealGroup>)}</G>}
        {scene === 'team' && <G><Rect x={38} y={61} width={284} height={180} rx={27} fill={c.panel} stroke={c.line} /><SceneText x={59} y={94} fontSize={13} fill={c.muted}>UNE MÉTÉO COLLECTIVE</SceneText>{[0, 1, 2, 3, 4].map(i => <RevealGroup key={i} progress={progress} order={i}><Circle cx={85 + i * 47} cy={142} r={12} fill={c.sage} /><Path d={`M${72 + i * 47} 180q13-27 26 0`} fill={c.sage} /></RevealGroup>)}<Path d="M84 196q96 36 192 0" stroke={c.link} strokeWidth={2} fill="none" strokeDasharray="3 6" /><Rect x={135} y={207} width={90} height={24} rx={12} fill={c.yellow} /><SceneText x={180} y={223} textAnchor="middle" fontSize={11} fill={c.ink}>5 minimum</SceneText></G>}
        {scene === 'act' && <G><Rect x={65} y={50} width={230} height={209} rx={26} fill={c.panel} stroke={c.line} />{['Écouter', 'Agir ensemble', 'Faire le bilan'].map((t, i) => <RevealGroup key={t} progress={progress} order={i}><Circle cx={98} cy={99 + i * 58} r={13} fill={[c.sage, c.yellow, c.lavender][i]} /><Path d={`M92 ${99 + i * 58}l4 4 8-9`} stroke={c.ink} strokeWidth={2} fill="none" strokeLinecap="round" /><SceneText x={124} y={104 + i * 58} fontSize={15} fill={c.text}>{t}</SceneText>{i < 2 && <Path d={`M98 ${116 + i * 58}v21`} stroke={c.line} strokeWidth={2} />}</RevealGroup>)}</G>}
      </Svg>
      {isWeather && <View pointerEvents="none" style={s.orbPosition}><Animated.View style={[s.orb, orb]}><WeatherMorph value={weather} size={canvasWidth * .26} animate={active && !reduced} /></Animated.View></View>}
      <FloatingDetail progress={progress} scene={scene} />
      {scene === 'mood' && <GestureDetector gesture={drag}><Animated.View accessibilityLabel="Aperçu du geste météo" style={StyleSheet.absoluteFill} /></GestureDetector>}
    </View>
    {scene === 'mood' && <View style={s.moodStops}>{[1, 2, 3, 4, 5].map((v, i) => <Pressable key={v} accessibilityRole="button" accessibilityLabel={`Essayer la météo ${['Très mal', 'Mal', 'Moyen', 'Bien', 'Très bien'][i]} dans la visite`} onPress={() => choose(v)} style={s.stopTouch}><View style={[s.dot, { backgroundColor: moodPalette.accents[i] }]} /></Pressable>)}</View>}
  </View>;
}
function RevealGroup({ progress, order, children }: { progress: SharedValue<number>; order: number; children: React.ReactNode }) {
  const props = useAnimatedProps(() => ({ opacity: Math.max(0, Math.min(1, (progress.value - order * .13) / .35)) }));
  return <AGroup animatedProps={props}>{children}</AGroup>;
}
function FloatingDetail({ progress, scene }: { progress: SharedValue<number>; scene: TourSceneKind }) {
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 18 }, { scale: .92 + progress.value * .08 }] }));
  const label = scene === 'garden' ? 'À ton rythme' : scene === 'finish' ? 'Bienvenue chez toi' : scene === 'self' ? 'Rien que pour toi' : scene === 'welcome' ? 'Toutes les météos comptent' : null;
  if (!label) return null;
  return <Animated.View pointerEvents="none" style={[s.floating, style]}><CheckIcon size={15} color={c.link} /><Text style={s.miniText}>{label}</Text></Animated.View>;
}
function GardenDrawing({ progress }: { progress: SharedValue<number> }) {
  const trunk = useAnimatedProps(() => ({ strokeDashoffset: 300 * (1 - progress.value) }));
  return <G><Ellipse cx={180} cy={250} rx={85} ry={13} fill="#bfd6ae" /><APath animatedProps={trunk} d="M180 252V109M180 181l-41-44M180 160l38-41M180 206l-52-26M180 222l39-32" stroke="#6b7652" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={300} />{[[139, 133, 37], [182, 94, 44], [218, 123, 39], [127, 171, 31], [218, 168, 37], [176, 150, 47]].map(([x, y, r], i) => <GrowingLeaf key={i} x={x} y={y} r={r} progress={progress} index={i} />)}<Circle cx={142} cy={157} r={6} fill={c.coral} /><Circle cx={216} cy={140} r={6} fill={c.yellow} /><Circle cx={183} cy={117} r={6} fill={c.coral} /><Path d="M120 249l-5-12m5 12 5-17m115 17 5-12m-5 12-5-17" stroke={c.link} strokeWidth={2} fill="none" strokeLinecap="round" /></G>;
}
function GrowingLeaf({ x, y, r, progress, index }: { x: number; y: number; r: number; progress: SharedValue<number>; index: number }) {
  const props = useAnimatedProps(() => ({ r: r * Math.max(0, Math.min(1, (progress.value - .16 - index * .07) / .45)), opacity: Math.min(1, progress.value * 2) }));
  return <ACircle cx={x} cy={y} animatedProps={props} fill={index % 2 ? '#a6c88e' : c.sage} />;
}
function CalendarDrawing({ progress }: { progress: SharedValue<number> }) {
  const reveal = useAnimatedProps(() => ({ strokeDashoffset: 170 * (1 - progress.value) }));
  return <G><Rect x={60} y={49} width={240} height={205} rx={25} fill={c.panel} stroke={c.line} /><SceneText x={82} y={83} fontSize={14} fill={c.text}>Tes journées</SceneText><Path d="M82 99H278" stroke={c.line} />{Array.from({ length: 21 }, (_, i) => <G key={i}><Circle cx={94 + (i % 7) * 29} cy={121 + Math.floor(i / 7) * 32} r={10} fill={i < 12 ? [c.sage, c.yellow, c.blue, c.lavender][i % 4] : c.background} /><SceneText x={94 + (i % 7) * 29} y={125 + Math.floor(i / 7) * 32} fontSize={9} fill={c.text} textAnchor="middle">{i + 1}</SceneText></G>)}<APath animatedProps={reveal} d="M88 226q20-21 40-12t38-6 38 3 50-12" fill="none" stroke={c.link} strokeWidth={3} strokeLinecap="round" strokeDasharray={170} /></G>;
}
const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', justifyContent: 'center' }, canvas: { height: '100%', aspectRatio: 1.2, maxWidth: '100%' },
  orbPosition: { position: 'absolute', left: '25%', top: '20%', width: '50%', height: '60%', alignItems: 'center', justifyContent: 'center' }, orb: { width: '100%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  floating: { position: 'absolute', bottom: '5%', alignSelf: 'center', backgroundColor: c.panel, borderRadius: 30, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 7, borderColor: c.line, borderWidth: 1 },
  miniText: { fontSize: 11, color: c.link }, moodStops: { flexDirection: 'row', position: 'absolute', bottom: 0, alignSelf: 'center' }, stopTouch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, dot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1, borderColor: c.line },
});
