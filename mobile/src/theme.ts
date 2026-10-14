import { Platform } from 'react-native';
export const moodPalette = {
  backgrounds: ['#251e32', '#1c2b3b', '#202e29', '#363022', '#3c2b23'],
  accents: ['#d4c5f0', '#b7d4ed', '#c9dfbd', '#f4da8c', '#f5be8e'],
};
export const colors = {
  background: moodPalette.backgrounds[2], panel: '#27352e', elevated: '#334137', line: '#ffffff24', text: '#f8f5e9', muted: '#c5cec1', dim: '#a5b1a4',
  accent: '#f0f0dd', ink: '#203326', cream: '#f1f0df', sage: moodPalette.accents[2], yellow: moodPalette.accents[3], blue: moodPalette.accents[1], lavender: moodPalette.accents[0], coral: moodPalette.accents[4],
};
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
