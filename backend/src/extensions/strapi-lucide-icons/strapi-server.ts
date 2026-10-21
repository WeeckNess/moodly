import dynamicIconImports from 'lucide-react/dynamicIconImports.mjs';

// Le plugin 1.14.0 importe ce module sans extension ; Node 24 exige le chemin .mjs.
// L'extension applicative est conservée après npm ci, sans modifier node_modules.
export default (plugin: any) => {
  const original = plugin.services.icons;
  const names = Object.keys(dynamicIconImports).sort();
  plugin.services.icons = (context: any) => ({
    ...original(context),
    async list() { return [...names]; },
  });
  return plugin;
};
