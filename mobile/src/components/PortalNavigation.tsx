import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpenIcon, CloudSunIcon, ShieldCheckIcon, UsersThreeIcon } from '../icons';
import { colors as c } from '../theme';
export type PortalPage = 'home' | 'privacy' | 'guide';
export function PortalNavigation({ page, manager, onNavigate, vertical = false }: { page: PortalPage; manager: boolean; onNavigate: (page: PortalPage) => void; vertical?: boolean }) {
  const items = [{ id: 'home' as const, label: manager ? 'Mon équipe' : 'Ma météo', icon: manager ? UsersThreeIcon : CloudSunIcon }, { id: 'guide' as const, label: 'Le principe', icon: BookOpenIcon }, { id: 'privacy' as const, label: 'Confidentialité', icon: ShieldCheckIcon }];
  return <View accessibilityRole="tablist" style={[s.row, vertical && { flexDirection: 'column' }]}>{items.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: page === item.id }} aria-selected={page === item.id} onPress={() => onNavigate(item.id)} style={[s.tab, vertical && s.vertical, page === item.id && s.active]}><item.icon size={21} color={page === item.id ? c.text : c.muted} weight={page === item.id ? 'fill' : 'regular'} /><Text style={[s.label, vertical && { fontSize: 13 }, page === item.id && { color: c.text }]}>{item.label}</Text></Pressable>)}</View>;
}
const s = StyleSheet.create({ row: { flexDirection: 'row', gap: 6, width: '100%' }, tab: { flex: 1, minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 8 }, vertical: { flex: 0, width: '100%', flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, minHeight: 52, gap: 12 }, active: { backgroundColor: c.elevated }, label: { fontSize: 10, color: c.muted, textAlign: 'center' } });
