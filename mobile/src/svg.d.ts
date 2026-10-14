import 'react-native-svg';
// Phosphor ajoute une classe CSS sur le web ; React Native l’ignore.
declare module 'react-native-svg' {
  interface SvgProps { className?: string }
}
