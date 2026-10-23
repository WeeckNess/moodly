import type { Core } from '@strapi/strapi';

type PolicyContext = { state: { user?: { id: number } } };

export default async (context: PolicyContext, _config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const id = context.state.user?.id;
  if (!id) return false;
  // Relire le compte : un JWT existant ne doit pas conserver un ancien rôle ou rattachement.
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id }, populate: { role: true, team: true },
  });
  if (!user || user.blocked || user.role?.type !== 'manager' || !user.team) return false;
  const team = await strapi.db.query('api::team.team').findOne({
    where: { id: user.team.id }, select: ['id'],
  });
  return Boolean(team);
};
