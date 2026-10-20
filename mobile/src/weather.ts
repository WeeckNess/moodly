import { CloudLightningIcon, CloudRainIcon, CloudIcon, CloudSunIcon, SunIcon } from './icons';
import { colors } from './theme';
export const weathers = [
  { score: 1, title: 'Orage', label: 'Très mal', icon: CloudLightningIcon, color: colors.lavender, message: 'Tu mérites du soutien, à ton rythme.' },
  { score: 2, title: 'Pluie', label: 'Mal', icon: CloudRainIcon, color: colors.blue, message: 'Chaque petit pas compte. Prends soin de toi.' },
  { score: 3, title: 'Nuages', label: 'Moyen', icon: CloudIcon, color: colors.sage, message: 'Accorde-toi un moment pour souffler.' },
  { score: 4, title: 'Éclaircies', label: 'Bien', icon: CloudSunIcon, color: colors.yellow, message: 'Savoure les petites éclaircies de ta journée.' },
  { score: 5, title: 'Soleil', label: 'Très bien', icon: SunIcon, color: colors.coral, message: 'Profite de cette belle énergie !' },
] as const;
