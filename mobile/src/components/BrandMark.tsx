import { Text, View } from 'react-native';
import { CloudSunIcon } from '../icons';
import { colors } from '../theme';
export function BrandMark({ size = 22 }: { size?: number }) {
  return <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><CloudSunIcon color={colors.text} size={size * 1.14} /><Text style={{ fontSize: size, letterSpacing: -size / 22, fontWeight: '600', color: colors.text }}>éclaircie.</Text></View>;
}
