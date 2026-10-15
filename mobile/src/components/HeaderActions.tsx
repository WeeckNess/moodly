import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowsLeftRightIcon, UserCircleIcon } from '../icons';
import { colors as c } from '../theme';
export function HeaderActions({ demo, manager = false, onSwitch, onProfile, disabled = false }: { demo: boolean; manager?: boolean; onSwitch: () => void; onProfile: () => void; disabled?: boolean }) {
  return <View style={s.row}>{demo && <Pressable accessibilityRole="button" disabled={disabled} accessibilityLabel={manager ? 'Passer à la vue salarié' : 'Passer à la vue manager'} onPress={onSwitch} style={s.switch}><ArrowsLeftRightIcon size={18} color={c.text} /><Text style={s.label}>{manager ? 'Salarié' : 'Manager'}</Text></Pressable>}<Pressable accessibilityRole="button" disabled={disabled} accessibilityLabel="Ouvrir mon profil" onPress={onProfile} style={s.profile}><UserCircleIcon size={29} weight="duotone" color={c.text} /></Pressable></View>;
}
const s = StyleSheet.create({ row: { flexDirection: 'row', gap: 8, alignItems: 'center' }, switch: { minHeight: 44, paddingHorizontal: 9, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff08' }, label: { color: c.muted, fontSize: 10 }, profile: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' } });
