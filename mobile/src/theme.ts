import { Platform } from 'react-native';
export const moodPalette = {
  backgrounds: ['#f0e9fa', '#e6f1fc', '#f2f4e9', '#fff3d6', '#ffe9dc'],
  accents: ['#cfb9f1', '#acd2ec', '#bdd7ad', '#f8d36b', '#f6b083'],
};
export const colors = {
  background: moodPalette.backgrounds[2], panel: '#fffcf5', elevated: '#e6ecdd', line: '#34483528', text: '#283c31', muted: '#536257', dim: '#606b60',
  accent: '#f8d36b', ink: '#263c2e', cream: '#fffaf0', surface: '#ffffff80', selected: '#dce9ce', link: '#3f6749', error: '#a13e35',
  sage: moodPalette.accents[2], yellow: moodPalette.accents[3], blue: moodPalette.accents[1], lavender: moodPalette.accents[0], coral: moodPalette.accents[4],
};
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
