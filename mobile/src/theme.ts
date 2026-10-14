import { Platform } from 'react-native';
export const colors = {
  background: '#121615', panel: '#1a201d', elevated: '#242c27', line: '#343e37', text: '#f5f3e9', muted: '#b0b9af', dim: '#858f85',
  accent: '#d8eda0', ink: '#203326', cream: '#f1f0df', sage: '#b8cdbe', yellow: '#f2ce73', blue: '#a5bad9', lavender: '#c2b5dc', coral: '#dea79a',
};
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
