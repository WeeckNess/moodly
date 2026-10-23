import { randomUUID, createHmac } from 'node:crypto';
import { shiftDay, today, THRESHOLD } from './mood';
const q = (uid: string) => strapi.db.query(uid as any);
const actions = () => q('api::team-action.team-action');
export function actionSummary(action: any, day: string, hasResponded = false) {
  const closed = Boolean(action.reviewUntil && day > action.reviewUntil);
  const visible = closed && action.feedbackCount >= THRESHOLD;
  return { id: action.documentId, title: action.title, description: action.description || '', dueDay: action.dueDay, status: action.status, reviewUntil: action.reviewUntil || null, reviewClosed: closed, hasResponded, feedback: visible ? { count: action.feedbackCount, average: Math.round(action.feedbackSum / action.feedbackCount * 10) / 10 } : null, threshold: THRESHOLD };
}
export function validAction(input: any, day: string) {
  if (!input || typeof input !== 'object' || Object.keys(input).some(key => !['title', 'description', 'dueDay'].includes(key))) return false;
  return typeof input.title === 'string' && input.title.trim().length >= 3 && input.title.length <= 100 && (input.description === undefined || typeof input.description === 'string' && input.description.length <= 500) && typeof input.dueDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDay) && Number.isFinite(Date.parse(input.dueDay)) && new Date(input.dueDay + 'T12:00:00Z').toISOString().slice(0, 10) === input.dueDay && input.dueDay >= day && input.dueDay <= shiftDay(day, 90);
}
const responseKey = (user: any, action: any) => createHmac('sha256', process.env.JWT_SECRET!).update(`action-feedback:${user.id}:${action.documentId}`).digest('hex');
async function managed(user: any) { return user.role.type === 'manager' && user.team && await q('api::team.team').findOne({ where: { id: user.team.id } }); }
export async function listActions(ctx: any, user: any) {
  const day = today();
  const records = await actions().findMany({ where: { team: user.team.id, createdDay: { $gte: shiftDay(day, -120) } }, orderBy: { createdAt: 'desc' }, limit: 30 });
  ctx.body = { data: await Promise.all(records.map(async (action: any) => actionSummary(action, day, user.role.type === 'collaborateur' && Boolean(await q('api::action-response-log.action-response-log').findOne({ where: { deduplicationKey: responseKey(user, action) } }))))) };
}
export async function createAction(ctx: any, user: any) {
  if (!await managed(user)) return ctx.forbidden('Action réservée au manager de cette équipe.');
  const data = ctx.request.body?.data;
  if (!validAction(data, today())) return ctx.badRequest('Titre de 3 à 100 caractères, description de 500 caractères maximum et échéance dans les 90 prochains jours.');
  const action = await actions().create({ data: { documentId: randomUUID(), title: data.title.trim(), description: data.description?.trim() || '', dueDay: data.dueDay, createdDay: today(), team: user.team.id, status: 'planned', feedbackCount: 0, feedbackSum: 0 } });
  ctx.status = 201; ctx.body = { data: actionSummary(action, today()) };
}
export async function updateAction(ctx: any, user: any) {
  if (!await managed(user)) return ctx.forbidden('Action réservée au manager de cette équipe.');
  const data = ctx.request.body?.data;
  if (!data || Object.keys(data).length !== 1 || !['active', 'completed'].includes(data.status)) return ctx.badRequest('Statut invalide.');
  const action = await actions().findOne({ where: { documentId: ctx.params.documentId, team: user.team.id } });
  if (!action) return ctx.notFound('Action introuvable.');
  const allowed = action.status === 'planned' && data.status === 'active' || action.status === 'active' && data.status === 'completed';
  if (!allowed) return ctx.badRequest('Cette étape est déjà passée ou indisponible.');
  const updated = await actions().update({ where: { id: action.id, status: action.status }, data: { status: data.status, ...(data.status === 'completed' ? { reviewUntil: shiftDay(today(), 7) } : {}) } });
  if (!updated) return ctx.badRequest('L’action a changé. Actualise la page.');
  ctx.body = { data: actionSummary(updated, today()) };
}
export async function actionFeedback(ctx: any, user: any) {
  if (user.role.type !== 'collaborateur') return ctx.forbidden('Ce retour est réservé aux collaborateurs.');
  const data = ctx.request.body?.data;
  if (!data || Object.keys(data).length !== 1 || ![1, 2, 3].includes(data.score)) return ctx.badRequest('Choisis un retour parmi les trois propositions.');
  const action = await actions().findOne({ where: { documentId: ctx.params.documentId, team: user.team.id } });
  if (!action) return ctx.notFound('Action introuvable.');
  if (action.status !== 'completed' || !action.reviewUntil || today() > action.reviewUntil || action.createdDay < shiftDay(today(), -120)) return ctx.badRequest('Le bilan de cette action n’est pas ouvert.');
  const key = responseKey(user, action), log = () => q('api::action-response-log.action-response-log');
  if (await log().findOne({ where: { deduplicationKey: key } })) { ctx.status = 409; ctx.body = { error: { message: 'Ton retour a déjà été enregistré.' } }; return; }
  try {
    await strapi.db.transaction(async ({ trx }) => {
      await strapi.db.connection('team_actions').where({ id: action.id }).forUpdate().transacting(trx).first();
      await log().create({ data: { documentId: randomUUID(), deduplicationKey: key, expiresOn: shiftDay(action.createdDay, 121) } });
      const current = await actions().findOne({ where: { id: action.id } });
      await actions().update({ where: { id: action.id }, data: { feedbackCount: current.feedbackCount + 1, feedbackSum: current.feedbackSum + data.score } });
    });
    ctx.status = 201; ctx.body = { data: { received: true } };
  } catch (error) { if (await log().findOne({ where: { deduplicationKey: key } })) { ctx.status = 409; ctx.body = { error: { message: 'Ton retour a déjà été enregistré.' } }; return; } throw error; }
}
