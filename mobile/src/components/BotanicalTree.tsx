import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import artwork from '../gardenArtwork.json';
import { botanicalMilestones, gardenPercent, gardenTrackMoves, gardenTrackState, type GardenTrack } from '../gardenAnimation';
import { svgTransform } from '../svgTransform';
import { haptics } from '../haptics';
import { useReducedMotion } from './MoodDial';

type Node = { tag: string; props: Record<string, unknown>; track?: GardenTrack; children?: Node[] };
type Range = { from: number; to: number };
const nodes = artwork as Node[];
const APath = Animated.createAnimatedComponent(Path), AG = Animated.createAnimatedComponent(G);
const web = Platform.OS === 'web';
function StrokeTrack({ node, progress }: { node: Node; progress: SharedValue<number> }) {
  const track = node.track!;
  const props = useAnimatedProps(() => {
    const state = gardenTrackState(track, progress.value);
    return { opacity: state.opacity, strokeDashoffset: state.strokeDashoffset, ...(state.strokeWidth === undefined ? {} : { strokeWidth: state.strokeWidth }) };
  });
  return <APath {...node.props} animatedProps={props} />;
}
function ScaleTrack({ node, progress, children }: { node: Node; progress: SharedValue<number>; children: ReactNode }) {
  const track = node.track!;
  const props = useAnimatedProps(() => ({ ...svgTransform(web, 0, 0, 0, gardenTrackState(track, progress.value).amount) }));
  const { transform: _, ...base } = node.props;
  return <AG {...base} animatedProps={props}>{children}</AG>;
}
const SceneNode = memo(function SceneNode({ node, progress, range }: { node: Node; progress: SharedValue<number>; range: Range }) {
  const track = node.track;
  // Hidden and finished sequences are static: only the elements currently growing run worklets.
  if (track && Math.max(range.from, range.to) <= track.start) return null;
  const children = node.children?.map((child, index) => <SceneNode key={index} node={child} progress={progress} range={range} />);
  if (track && gardenTrackMoves(track, range.from, range.to)) {
    return node.tag === 'path' ? <StrokeTrack node={node} progress={progress} /> : <ScaleTrack node={node} progress={progress}>{children}</ScaleTrack>;
  }
  let props = node.props;
  if (track) {
    const state = gardenTrackState(track, range.to);
    props = node.tag === 'path' ? { ...props, opacity: state.opacity, strokeDashoffset: state.strokeDashoffset, ...(state.strokeWidth === undefined ? {} : { strokeWidth: state.strokeWidth }) } : { ...props, transform: `scale(${state.amount})` };
  }
  if (node.tag === 'path') return <Path {...props} />;
  if (node.tag === 'circle') return <Circle {...props} />;
  if (node.tag === 'ellipse') return <Ellipse {...props} />;
  return <G {...props}>{children}</G>;
});
export function BotanicalTree({ days, label, interactive = false }: { days: number; label: string; interactive?: boolean }) {
  const target = gardenPercent(days), reduced = useReducedMotion();
  const progress = useSharedValue(target);
  const [range, setRange] = useState<Range>({ from: target, to: target });
  const [active, setActive] = useState(AppState.currentState === 'active');
  const previousDays = useRef(days);
  useEffect(() => { if (interactive && botanicalMilestones.some(step => step.day > previousDays.current && step.day <= days)) haptics.grow(); previousDays.current = days; }, [days, interactive]);
  useEffect(() => { const listener = AppState.addEventListener('change', state => setActive(state === 'active')); return () => listener.remove(); }, []);
  useEffect(() => {
    cancelAnimation(progress);
    if (!active) return;
    const from = progress.value;
    if (reduced || from === target) { progress.value = target; setRange({ from: target, to: target }); return; }
    const duration = Math.max(900, Math.min(4200, Math.abs(target - from) * 70));
    setRange({ from, to: target });
    progress.value = withTiming(target, { duration, easing: Easing.inOut(Easing.cubic) });
    const finish = setTimeout(() => setRange({ from: target, to: target }), duration + 80);
    return () => { clearTimeout(finish); cancelAnimation(progress); };
  }, [target, reduced, active, progress]);
  return <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: '100%', aspectRatio: 620 / 650 }}>
    <Svg width="100%" height="100%" viewBox="90 40 620 650" pointerEvents="none" {...(web ? { 'aria-hidden': true } : { accessibilityElementsHidden: true })}>
      {nodes.map((node, index) => <SceneNode key={index} node={node} progress={progress} range={range} />)}
    </Svg>
  </View>;
}
