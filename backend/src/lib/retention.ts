import type { Core } from '@strapi/strapi';
import { shiftDay, today } from './mood';
export async function purgeExpired(strapi: Core.Strapi) {
  const configured = Number(process.env.MOODLY_RETENTION_DAYS || 45);
  const days = Number.isInteger(configured) && configured >= 30 ? configured : 45;
  const cutoff = shiftDay(today(), -days);
  await strapi.db.query('api::mood-entry.mood-entry' as any).deleteMany({ where: { day: { $lt: cutoff } } });
  await strapi.db.query('api::submission-log.submission-log' as any).deleteMany({ where: { day: { $lt: cutoff } } });
}
