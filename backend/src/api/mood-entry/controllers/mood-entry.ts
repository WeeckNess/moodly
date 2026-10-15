import { listActions, createAction, updateAction, actionFeedback } from '../../../lib/teamActions';
import { randomUUID, createHmac } from 'node:crypto';
import { dateRange, safePoints, shiftDay, today, validateMood, THRESHOLD } from '../../../lib/mood';

const query = (uid: string) => strapi.db.query(uid as any);
async function getMember(ctx: any) {
  if (!ctx.state.user) { ctx.unauthorized('Connexion requise.'); return null; }
  const user = await query('plugin::users-permissions.user').findOne({
    where: { id: ctx.state.user.id }, populate: { role: true, team: { populate: ['supportContacts'] } },
  });
  if (!user || user.blocked || !user.team || !['collaborateur', 'manager'].includes(user.role?.type)) {
    ctx.forbidden('Votre compte doit être affecté à une équipe et un rôle Moodly.'); return null;
  }
  return user;
}
export default {
  async actions(ctx: any) { const user = await getMember(ctx); if (user) await listActions(ctx, user); },
  async createAction(ctx: any) { const user = await getMember(ctx); if (user) await createAction(ctx, user); },
  async updateAction(ctx: any) { const user = await getMember(ctx); if (user) await updateAction(ctx, user); },
  async actionFeedback(ctx: any) { const user = await getMember(ctx); if (user) await actionFeedback(ctx, user); },
  async session(ctx: any) {
    const user = await getMember(ctx); if (!user) return;
    const day = today();
    const log = await query('api::submission-log.submission-log').findOne({ where: { user: user.id, day } });
    ctx.body = { data: { name: user.username, role: user.role.type, team: { name: user.team.name, supportContacts: (user.team.supportContacts ?? []).map((contact: any) => ({ name: contact.name, kind: contact.kind, qualification: contact.qualification, details: contact.details, email: contact.email, phone: contact.phone, bookingUrl: contact.bookingUrl })) }, submitted: Boolean(log), day, privateSupportKey: createHmac('sha256', process.env.JWT_SECRET!).update(`private-support:${user.id}`).digest('hex') } };
  },
  async create(ctx: any) {
    const user = await getMember(ctx); if (!user) return;
    if (user.role.type !== 'collaborateur') return ctx.forbidden('Saisie réservée aux collaborateurs.');
    const input = validateMood(ctx.request.body?.data);
    if (!input) return ctx.badRequest('Choisissez une note de 1 à 5 et des tags prédéfinis uniquement.');
    const day = today();
    const key = createHmac('sha256', process.env.JWT_SECRET!).update(`${user.id}:${day}`).digest('hex');
    if (await query('api::submission-log.submission-log').findOne({ where: { deduplicationKey: key } })) {
      ctx.status = 409; ctx.body = { error: { message: 'Votre météo a déjà été envoyée aujourd’hui.' } }; return;
    }
    const tagRecords = await query('api::tag.tag').findMany({ where: { label: { $in: input.tags } } });
    if (tagRecords.length !== input.tags.length) return ctx.badRequest('Tags indisponibles.');
    try {
      await strapi.db.transaction(async ({ trx }) => {
        await strapi.db.connection('teams').where({ id: user.team.id }).forUpdate().transacting(trx).first();
        await query('api::submission-log.submission-log').create({ data: { documentId: randomUUID(), user: user.id, day, deduplicationKey: key } });
        await query('api::mood-entry.mood-entry').create({ data: {
          documentId: randomUUID(), score: input.score, day, team: user.team.id, tags: tagRecords.map(tag => tag.id),
        } });
        const aggregate = await query('api::daily-aggregate.daily-aggregate').findOne({ where: { team: user.team.id, day } });
        if (aggregate) {
          await query('api::daily-aggregate.daily-aggregate').update({ where: { id: aggregate.id }, data: { scoreSum: aggregate.scoreSum + input.score, responseCount: aggregate.responseCount + 1 } });
        } else {
          await query('api::daily-aggregate.daily-aggregate').create({ data: { documentId: randomUUID(), day, team: user.team.id, aggregateKey: `${user.team.id}:${day}`, scoreSum: input.score, responseCount: 1 } });
        }
      });
      ctx.status = 201; ctx.body = { data: { submitted: true, day } };
    } catch (error) {
      // Une collision concurrente ne doit jamais créer deux réponses ou incrémenter deux fois la moyenne.
      const duplicate = await query('api::submission-log.submission-log').findOne({ where: { deduplicationKey: key } });
      if (duplicate) { ctx.status = 409; ctx.body = { error: { message: 'Votre météo a déjà été envoyée aujourd’hui.' } }; return; }
      throw error;
    }
  },
  async stats(ctx: any) {
    const user = await getMember(ctx); if (!user) return;
    if (user.role.type !== 'manager') return ctx.forbidden('Vue réservée aux managers.');
    // L’équipe est toujours déduite du compte, jamais des paramètres du client.
    const team = await query('api::team.team').findOne({ where: { id: user.team.id, manager: user.id } });
    if (!team) return ctx.forbidden('Vous ne gérez pas cette équipe.');
    const days = dateRange(today());
    const aggregates = await query('api::daily-aggregate.daily-aggregate').findMany({ where: { team: team.id, day: { $gte: days[0], $lte: days[29] } } });
    const data = safePoints(days, aggregates as any);
    const users = await query('plugin::users-permissions.user').findMany({ where: { team: team.id, role: { type: 'collaborateur' }, blocked: false }, select: ['id'] });
    const logs = await query('api::submission-log.submission-log').findMany({ where: { user: { id: { $in: users.map(u => u.id) } }, day: { $gte: shiftDay(today(), -6), $lte: today() } }, populate: { user: { select: ['id'] } } });
    const participants = new Set(logs.map((log: any) => log.user?.id).filter(Boolean)).size;
    const participation = participants >= THRESHOLD && users.length >= THRESHOLD ? Math.round(participants / users.length * 100) : null;
    ctx.body = { data, meta: { team: team.name, threshold: THRESHOLD, participation, maskedDays: data.filter(point => point.average === null).length } };
  },
};
