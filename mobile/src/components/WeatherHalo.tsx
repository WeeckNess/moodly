import { useId } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Mask, RadialGradient, Stop } from 'react-native-svg';
import { moodPalette } from '../theme';
const AEllipse = Animated.createAnimatedComponent(Ellipse);

export function WeatherHalo({ value, size }: { value: SharedValue<number>; size: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const width = size * 2.8, height = size * 1.9;
  const tint = useAnimatedProps(() => ({ fill: interpolateColor(value.value, [1, 2, 3, 4, 5], moodPalette.accents) }));
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', width, height, left: (size - width) / 2, top: (size - height) / 2 }}>
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs><RadialGradient id={`haloFade${id}`} cx="50%" cy="50%" rx="50%" ry="50%"><Stop offset="0%" stopColor="white" stopOpacity={1} /><Stop offset="40%" stopColor="white" stopOpacity={0.65} /><Stop offset="75%" stopColor="white" stopOpacity={0.16} /><Stop offset="100%" stopColor="white" stopOpacity={0} /></RadialGradient><Mask id={`haloMask${id}`} x={0} y={0} width={width} height={height} maskUnits="userSpaceOnUse"><Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#haloFade${id})`} /></Mask></Defs>
      <AEllipse animatedProps={tint} cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} opacity={0.055} mask={`url(#haloMask${id})`} />
    </Svg>
  </View>;
}
