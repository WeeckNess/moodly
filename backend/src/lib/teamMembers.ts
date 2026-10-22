import { randomBytes } from 'node:crypto';
const users = () => strapi.db.query('plugin::users-permissions.user');
export function memberInput(value: unknown): { name: string; email: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => !['name', 'email'].includes(key)) || typeof data.name !== 'string' || typeof data.email !== 'string') return null;
  const name = data.name.trim(), email = data.email.trim().toLowerCase();
  if (name.length < 2 || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { name, email };
}
export async function createTeamMember(ctx: any, manager: any) {
  const team = manager.role?.type === 'manager' && await strapi.db.query('api::team.team').findOne({ where: { id: manager.team.id, manager: manager.id } });
  if (!team) return ctx.forbidden('Création réservée au manager de cette équipe.');
  const input = memberInput(ctx.request.body?.data);
  if (!input) return ctx.badRequest('Indiquez un nom de 2 à 80 caractères et une adresse e-mail valide.');
  const existing = () => users().findOne({ where: { $or: [{ email: { $eqi: input.email } }, { username: { $eqi: input.email } }] }, select: ['id'] });
  const conflict = () => { ctx.status = 409; ctx.body = { error: { message: 'Cette adresse est déjà utilisée. Aucun compte existant n’a été modifié.' } }; };
  if (await existing()) return conflict();
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'collaborateur' } });
  if (!role) return ctx.internalServerError('Le rôle salarié est indisponible.');
  const password = `Ec!${randomBytes(18).toString('base64url')}7a`;
  try {
    // Le service Strapi chiffre le mot de passe ; aucun rôle ni rattachement ne vient du client.
    await strapi.plugin('users-permissions').service('user').add({ username: input.email, displayName: input.name, email: input.email, password, mustChangePassword: true, provider: 'local', confirmed: true, blocked: false, role: role.id, team: team.id });
  } catch (error) {
    if (await existing()) return conflict();
    throw error;
  }
  ctx.set('Cache-Control', 'no-store');
  ctx.status = 201;
  // Pas de JWT salarié, de hachage ou d’historique renvoyé au manager.
  ctx.body = { data: { name: input.name, email: input.email, team: team.name, initialPassword: password } };
}
