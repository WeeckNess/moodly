import { timingSafeEqual } from 'node:crypto';

export default (ctx: any) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(ctx.request.header.authorization ?? '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
