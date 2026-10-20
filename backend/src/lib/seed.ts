import type { Core } from '@strapi/strapi';
import { createHmac, randomUUID } from 'node:crypto';
import { dateRange, today } from './mood';
import { setupTags } from './tags';
export async function setup(strapi: Core.Strapi) {
  const q = (uid: string) => strapi.db.query(uid as any);
  const roles: Record<string, any> = {};
  for (const [type, name] of [['collaborateur', 'Collaborateur'], ['manager', 'Manager']]) {
    roles[type] = await q('plugin::users-permissions.role').findOne({ where: { type } }) ?? await q('plugin::users-permissions.role').create({ data: { type, name, description: `Rôle Éclaircie : ${name}` } });
  }
  for (const type of ['collaborateur', 'manager']) {
    for (const action of ['session', 'tags', 'actions', ...(type === 'manager' ? ['stats', 'createAction', 'updateAction'] : ['create', 'actionFeedback'])]) {
      const permission = `api::mood-entry.mood-entry.${action}`;
      if (!await q('plugin::users-permissions.permission').findOne({ where: { role: roles[type].id, action: permission } })) {
        await q('plugin::users-permissions.permission').create({ data: { role: roles[type].id, action: permission } });
      }
    }
  }
  await setupTags(strapi);
  const settings = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
  const advanced = await settings.get() as Record<string, unknown>;
  await settings.set({ value: { ...advanced, allow_register: false } });
  if (process.env.MOODLY_DEMO_SEED !== 'true') return;
  if (process.env.NODE_ENV === 'production') throw new Error('Seed de démonstration interdit en production.');
  const userService = strapi.plugin('users-permissions').service('user');
  const password = process.env.MOODLY_DEMO_PASSWORD || 'EclaircieDemo2026!';
  let manager = await q('plugin::users-permissions.user').findOne({ where: { email: 'manager@eclaircie.test' } });
  if (!manager) manager = await userService.add({ username: 'Alex', email: 'manager@eclaircie.test', password, provider: 'local', confirmed: true, blocked: false, role: roles.manager.id });
  let team = await q('api::team.team').findOne({ where: { name: 'Studio · Démonstration' } });
  if (!team) team = await strapi.documents('api::team.team' as any).create({ data: { name: 'Studio · Démonstration', manager: manager.id } });
  await q('plugin::users-permissions.user').update({ where: { id: manager.id }, data: { team: team.id } });
  const employees: { id: number }[] = [];
  for (let i = 1; i <= 8; i++) {
    const email = `collaborateur${i}@eclaircie.test`;
    let user = await q('plugin::users-permissions.user').findOne({ where: { email } });
    if (!user) user = await userService.add({ username: `Camille ${i}`, email, password, provider: 'local', confirmed: true, blocked: false, role: roles.collaborateur.id, team: team.id });
    employees.push(user);
  }
  for (const [i, day] of dateRange(today()).slice(0, -1).entries()) {
    if (await q('api::daily-aggregate.daily-aggregate').findOne({ where: { aggregateKey: `${team.id}:${day}` } })) continue;
    const count = i % 8 === 0 ? 3 : 8;
    let sum = 0;
    await strapi.db.transaction(async () => {
      for (let n = 0; n < count; n++) {
        const score = Math.max(1, Math.min(5, Math.round(3.7 + Math.sin(i / 4) * 0.7 + (n % 3 - 1) * 0.6)));
        sum += score;
        await q('api::mood-entry.mood-entry').create({ data: { documentId: randomUUID(), score, day, team: team.id } });
        const key = createHmac('sha256', process.env.JWT_SECRET!).update(`${employees[n].id}:${day}`).digest('hex');
        await q('api::submission-log.submission-log').create({ data: { documentId: randomUUID(), user: employees[n].id, day, deduplicationKey: key } });
      }
      await q('api::daily-aggregate.daily-aggregate').create({ data: { documentId: randomUUID(), day, team: team.id, aggregateKey: `${team.id}:${day}`, responseCount: count, scoreSum: sum } });
    });
  }
  strapi.log.info('Éclaircie : comptes et historique fictifs prêts. Identifiants dans le README.');
}
