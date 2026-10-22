import { TourTarget } from './tour/OnboardingTour';
import { Pressable, StyleSheet } from 'react-native';
import { UserCircleIcon } from '../icons';
import { colors as c } from '../theme';
export function HeaderActions({ onProfile, disabled = false }: { onProfile: () => void; disabled?: boolean }) {
  return <TourTarget id="profile"><Pressable accessibilityRole="button" disabled={disabled} accessibilityLabel="Ouvrir mon profil" onPress={onProfile} style={s.profile}><UserCircleIcon size={29} weight="duotone" color={c.text} /></Pressable></TourTarget>;
}
const s = StyleSheet.create({ profile: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' } });
