import { purgeExpired } from '../../../lib/retention';

export default {
  async retention(ctx: any) {
    await purgeExpired(strapi);
    ctx.set('Cache-Control', 'no-store');
    ctx.body = { ok: true };
  },
};
