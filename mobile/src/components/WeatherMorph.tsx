import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { weatherContours } from '../weatherContours';
import { weatherMorphPath } from '../weatherMorphGeometry';
const APath = Animated.createAnimatedComponent(Path);

export function WeatherMorph({ value, size = 96 }: { value: SharedValue<number>; size?: number }) {
  const fill = useAnimatedProps(() => ({ d: weatherMorphPath(value.value, weatherContours, 'fill') }));
  const ink = useAnimatedProps(() => ({ d: weatherMorphPath(value.value, weatherContours, 'ink') }));
  return <Svg width={size} height={size} viewBox="0 0 256 256" pointerEvents="none" accessibilityElementsHidden>
    <APath animatedProps={fill} fill="#25352a" opacity={0.2} fillRule="evenodd" />
    <APath animatedProps={ink} fill="#25352a" fillRule="evenodd" />
  </Svg>;
}
