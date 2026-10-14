import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { weatherPath } from '../weatherGeometry';
const APath = Animated.createAnimatedComponent(Path);
const ALine = Animated.createAnimatedComponent(Line);
function Ray({ angle, value }: { angle: number; value: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const amount = Math.max(0, Math.min(1, (value.value - 3) / 2));
    return { x1: 50 + Math.cos(angle) * 34, y1: 50 + Math.sin(angle) * 34,
      x2: 50 + Math.cos(angle) * (34 + amount * 9), y2: 50 + Math.sin(angle) * (34 + amount * 9), opacity: amount };
  });
  return <ALine animatedProps={props} stroke="#25352a" strokeWidth={2.7} strokeLinecap="round" />;
}
function Drop({ x, value }: { x: number; value: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const rain = Math.max(0, 1 - Math.abs(value.value - 2));
    return { opacity: rain, x1: x, y1: 80, x2: x - rain * 3, y2: 80 + rain * 9 };
  });
  return <ALine animatedProps={props} stroke="#25352a" strokeWidth={2.4} strokeLinecap="round" />;
}
export function WeatherMorph({ value, size = 96 }: { value: SharedValue<number>; size?: number }) {
  const body = useAnimatedProps(() => ({ d: weatherPath(value.value) }));
  const mouth = useAnimatedProps(() => ({ d: `M 41 57 Q 50 ${49 + (value.value - 1) * 4} 59 57` }));
  const lightning = useAnimatedProps(() => ({ opacity: Math.max(0, Math.min(1, 2 - value.value)) }));
  return <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none" accessibilityElementsHidden>
    {Array.from({ length: 8 }, (_, i) => <Ray key={i} angle={i * Math.PI / 4} value={value} />)}
    <APath animatedProps={body} fill="#fff7dc" fillOpacity={0.22} stroke="#25352a" strokeWidth={2.7} strokeLinejoin="round" />
    <Circle cx={41} cy={46} r={1.9} fill="#25352a" /><Circle cx={59} cy={46} r={1.9} fill="#25352a" />
    <APath animatedProps={mouth} fill="none" stroke="#25352a" strokeWidth={2.2} strokeLinecap="round" />
    <Drop x={36} value={value} /><Drop x={50} value={value} /><Drop x={64} value={value} />
    <APath animatedProps={lightning} d="M 52 79 L 44 89 L 51 89 L 47 98 L 61 85 L 54 85 L 59 79 Z" fill="#25352a" />
  </Svg>;
}
