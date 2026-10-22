import type { Core } from '@strapi/strapi';
import { networkInterfaces } from 'node:os';

const localOrigins = ['http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8081'];
const configuredOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()).filter(Boolean);
const origins = new Set(configuredOrigins ?? localOrigins);
// Expo web accessed from another device has the host computer's LAN origin.
// Only this server's interface addresses are allowed, and only in development.
if (process.env.NODE_ENV === 'development') {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.internal || address.family !== 'IPv4') continue;
      for (const port of [8081, 8082]) origins.add(`http://${address.address}:${port}`);
    }
  }
}

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  { name: 'strapi::cors', config: { origin: [...origins] } },
  'global::media-uploads',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
