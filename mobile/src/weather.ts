import { CloudLightningIcon, CloudRainIcon, CloudIcon, CloudSunIcon, SunIcon } from './icons';
import { colors } from './theme';
export const weathers = [
  { score: 1, label: 'Orage', feeling: 'Je traverse un moment difficile.', icon: CloudLightningIcon, color: colors.lavender, message: 'Tu mérites du soutien, à ton rythme.' },
  { score: 2, label: 'Pluie', feeling: 'J’ai le moral un peu bas.', icon: CloudRainIcon, color: colors.blue, message: 'Chaque petit pas compte. Prends soin de toi.' },
  { score: 3, label: 'Ciel couvert', feeling: 'Je me sens entre deux.', icon: CloudIcon, color: colors.sage, message: 'Accorde-toi un moment pour souffler.' },
  { score: 4, label: 'Éclaircies', feeling: 'Je me sens plutôt bien.', icon: CloudSunIcon, color: colors.yellow, message: 'Savoure les petites éclaircies de ta journée.' },
  { score: 5, label: 'Grand soleil', feeling: 'Je me sens vraiment bien.', icon: SunIcon, color: colors.coral, message: 'Profite de cette belle énergie !' },
] as const;
