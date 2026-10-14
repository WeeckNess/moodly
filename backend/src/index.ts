import type { Core } from '@strapi/strapi';
import { setup } from './lib/seed';
import { purgeExpired } from './lib/retention';
export default {
  register() {},
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setup(strapi);
    await purgeExpired(strapi);
    strapi.cron.add({ moodlyRetention: { task: () => purgeExpired(strapi), options: { rule: '0 0 3 * * *', tz: 'Europe/Paris' } } });
  },
};
