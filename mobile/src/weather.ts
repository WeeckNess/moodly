import { CloudLightningIcon, CloudRainIcon, CloudIcon, CloudSunIcon, SunIcon, BriefcaseIcon, ChatsCircleIcon, CompassIcon, ScalesIcon, HeartIcon, WrenchIcon } from './icons';
import { colors } from './theme';
export const weathers = [
  { score: 1, title: 'Orage', label: 'Très mal', icon: CloudLightningIcon, color: colors.lavender, message: 'Les journées difficiles ont aussi leur place.' },
  { score: 2, title: 'Pluie', label: 'Mal', icon: CloudRainIcon, color: colors.blue, message: 'Tu peux le dire, même quand le ciel est gris.' },
  { score: 3, title: 'Nuages', label: 'Moyen', icon: CloudIcon, color: colors.sage, message: 'Entre deux. Et c’est tout à fait OK.' },
  { score: 4, title: 'Éclaircies', label: 'Bien', icon: CloudSunIcon, color: colors.yellow, message: 'Un peu de lumière dans ta journée.' },
  { score: 5, title: 'Soleil', label: 'Très bien', icon: SunIcon, color: colors.coral, message: 'Aujourd’hui, le ciel est dégagé.' },
] as const;
export const moodTags = [
  { label: 'Charge', icon: BriefcaseIcon }, { label: 'Ambiance', icon: ChatsCircleIcon }, { label: 'Sens', icon: CompassIcon },
  { label: 'Équilibre', icon: ScalesIcon }, { label: 'Reconnaissance', icon: HeartIcon }, { label: 'Outils', icon: WrenchIcon },
];
