import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { weathers } from '../weather';

function WeatherLayer({ index, value, size }: { index: number; value: SharedValue<number>; size: number }) {
  const Icon = weathers[index].icon;
  const style = useAnimatedStyle(() => {
    const blend = Math.max(0, 1 - Math.abs(value.value - (index + 1)));
    // Smooth blending preserves the actual Phosphor artwork and a fixed, upright centre.
    return { opacity: blend * blend * (3 - 2 * blend) };
  });
  return <Animated.View style={[StyleSheet.absoluteFill, style]}><Icon size={size} color="#25352a" weight="duotone" /></Animated.View>;
}
export function WeatherMorph({ value, size = 96 }: { value: SharedValue<number>; size?: number }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    {weathers.map((weather, index) => <WeatherLayer key={weather.score} index={index} value={value} size={size} />)}
  </View>;
}
