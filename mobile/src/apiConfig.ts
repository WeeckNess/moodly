type ApiConfig = {
  configuredUrl?: string;
  development: boolean;
  webOrigin?: string;
  bundleUrl?: string;
};

export function resolveApiUrl(config: ApiConfig): string {
  const explicit = config.configuredUrl?.trim();
  if (explicit) {
    const url = new URL(explicit);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('EXPO_PUBLIC_API_URL doit être une adresse HTTP(S) sans identifiants ni paramètres.');
    }
    return url.toString().replace(/\/+$/, '');
  }
  if (!config.development) throw new Error('EXPO_PUBLIC_API_URL doit être renseignée pour la version de production.');
  // Sur le web et dans Expo Go, Strapi tourne sur le même PC que le front.
  const source = config.webOrigin ?? config.bundleUrl;
  if (source) {
    const url = new URL(source);
    if (['http:', 'https:'].includes(url.protocol)) {
      url.port = '1337';
      url.pathname = '/';
      url.search = '';
      url.hash = '';
      return url.toString().replace(/\/$/, '');
    }
  }
  return 'http://localhost:1337';
}
