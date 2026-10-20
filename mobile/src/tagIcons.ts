import * as icons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const legacy = new Map([['chat', 'message-circle'], ['scales', 'scale']]);
const registry = new Map<string, LucideIcon>();
for (const [name, Icon] of Object.entries(icons)) {
  if (typeof Icon === 'object' && Icon !== null && 'render' in Icon) {
    registry.set(name.toLowerCase(), Icon as LucideIcon);
  }
}

// Couvre aussi les alias Lucide et les noms contenant des sigles (ex. arrow-down-a-z).
export function tagIcon(name: string) {
  const key = (legacy.get(name) ?? name).replace(/-/g, '').toLowerCase();
  return registry.get(key) ?? icons.Compass;
}
