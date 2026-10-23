import { createHmac, randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import { dateRange, shiftDay, today } from './mood';
import { assertDemoTarget, type DemoTarget } from './demoGuard';

export const demoTeams = [
  { key: 'atlas', name: 'DÉMO · Studio Atlas', size: 16, managers: 2, baseline: 3.9, trend: -0.2 },
  { key: 'horizon', name: 'DÉMO · Atelier Horizon', size: 12, managers: 1, baseline: 2.5, trend: 1.3 },
  { key: 'boreale', name: 'DÉMO · Équipe Boréale', size: 8, managers: 1, baseline: 3.1, trend: 0.2 },
  { key: 'plume', name: 'DÉMO · Cellule Plume', size: 4, managers: 1, baseline: 3.5, trend: 0 },
];

const firstNames = ['Camille', 'Samir', 'Léa', 'Noah', 'Inès', 'Hugo', 'Jade', 'Adam', 'Chloé', 'Louis', 'Sarah', 'Gabriel', 'Zoé', 'Amir', 'Manon', 'Raphaël'];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Laurent', 'Moreau', 'Simon', 'Michel', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'André'];

export function demoDay(team: typeof demoTeams[number], dayIndex: number, teamIndex: number) {
  // Quelques journées absentes ou sous le seuil permettent de montrer le masquage.
  const count = dayIndex % 13 === 0 ? 0 : dayIndex % 9 === 0 ? Math.min(3, team.size) : team.size - dayIndex % Math.max(1, Math.floor(team.size / 3));
  const scores = Array.from({ length: count }, (_, n) => Math.max(1, Math.min(5,
    Math.round(team.baseline + team.trend * dayIndex / 44 + Math.sin((dayIndex + teamIndex * 4) / 4) * 0.8 + (n % 5 - 2) * 0.45))));
  return { count, scores };
}

type SeedRow = { data: Record<string, unknown>; relations: Record<string, number[]> };

// Strapi ne gère pas les relations dans createMany. On les insère en lots en
// utilisant ses métadonnées, dans la même transaction que les lignes métier.
async function insertBatch(strapi: Core.Strapi, uid: string, rows: SeedRow[], trx: any) {
  if (!rows.length) return;
  const query = strapi.db.query(uid as any);
  await query.createMany({ data: rows.map(row => row.data) });
  const records = await query.findMany({ where: { documentId: { $in: rows.map(row => row.data.documentId) } }, select: ['id', 'documentId'] });
  const ids = new Map(records.map(record => [record.documentId, record.id]));
  const grouped = new Map<string, Record<string, number>[]>();
  for (const row of rows) {
    const id = ids.get(row.data.documentId as string);
    if (!id) throw new Error('Une ligne de démonstration n’a pas été créée.');
    for (const [attribute, targets] of Object.entries(row.relations)) {
      const metadata = strapi.db.metadata.get(uid as any) as any;
      const join = metadata.attributes[attribute]?.joinTable;
      if (!join?.name || !join.joinColumn?.name || !join.inverseJoinColumn?.name) throw new Error(`Relation démo non prise en charge : ${uid}.${attribute}`);
      const links = grouped.get(join.name) ?? [];
      for (const [index, target] of targets.entries()) {
        const link: Record<string, number> = { [join.joinColumn.name]: id, [join.inverseJoinColumn.name]: target };
        if (join.orderColumnName) link[join.orderColumnName] = index + 1;
        if (join.inverseOrderColumnName) link[join.inverseOrderColumnName] = index + 1;
        links.push(link);
      }
      grouped.set(join.name, links);
    }
  }
  for (const [table, links] of grouped) {
    for (let offset = 0; offset < links.length; offset += 500) {
      await strapi.db.connection(table).transacting(trx).insert(links.slice(offset, offset + 500));
    }
  }
}

export async function seedDemo(strapi: Core.Strapi, target: DemoTarget) {
  assertDemoTarget(process.env, target);
  const password = process.env.MOODLY_DEMO_PASSWORD;
  if (!password || password.length < 16) throw new Error('Le mot de passe des comptes démo doit être fourni et contenir au moins 16 caractères.');
  const q = (uid: string) => strapi.db.query(uid as any);
  const roles = {
    manager: await q('plugin::users-permissions.role').findOne({ where: { type: 'manager' } }),
    collaborateur: await q('plugin::users-permissions.role').findOne({ where: { type: 'collaborateur' } }),
  };
  if (!roles.manager || !roles.collaborateur) throw new Error('Initialiser les rôles avant de peupler la démo.');
  const tags = await q('api::tag.tag').findMany({ where: { enabled: true, audience: { $in: ['collaborateur', 'both'] } }, orderBy: { position: 'asc' } });
  if (!tags.length) throw new Error('Le catalogue de tags de démonstration est vide.');
  const userService = strapi.plugin('users-permissions').service('user');
  const day = today();
  const days = dateRange(shiftDay(day, -1), 45);
  const credentials: { email: string; role: string; team: string }[] = [];
  let createdMoods = 0;
  let createdActions = 0;

  for (const [teamIndex, definition] of demoTeams.entries()) {
    let team = await q('api::team.team').findOne({ where: { name: definition.name } });
    if (!team) team = await strapi.documents('api::team.team' as any).create({ data: {
      name: definition.name,
      supportContacts: [
        { name: 'Écoute · Démonstration', kind: 'psychologue', qualification: 'Contact fictif', details: 'Exemple pour la présentation : aucun professionnel réel ne sera contacté.', email: `ecoute.${definition.key}@demo.eclaircie.test` },
        { name: 'Prévention · Démonstration', kind: 'prevention', qualification: 'Contact fictif', details: 'Ressource de démonstration, sans permanence réelle.', email: `prevention.${definition.key}@demo.eclaircie.test` },
      ],
    } as any });
    const members: any[] = [];
    for (const role of ['manager', 'collaborateur'] as const) {
      const count = role === 'manager' ? definition.managers : definition.size;
      for (let n = 0; n < count; n++) {
        const prefix = role === 'manager' ? `manager${n ? n + 1 : ''}` : `collaborateur${n + 1}`;
        const email = `${prefix}.${definition.key}@demo.eclaircie.test`;
        let user = await q('plugin::users-permissions.user').findOne({ where: { email }, populate: { team: true, role: true } });
        if (!user) user = await userService.add({
          username: email, displayName: `${firstNames[(n + teamIndex * 3) % firstNames.length]} ${lastNames[(n + teamIndex) % lastNames.length]}${role === 'manager' ? ' · Manager démo' : ''}`,
          email, password, provider: 'local', confirmed: true, blocked: false, mustChangePassword: false,
          role: roles[role].id, team: team.id,
        });
        else if (user.team?.id !== team.id || user.role?.type !== role) throw new Error(`Le compte ${email} existe avec un autre rattachement : aucun compte modifié.`);
        if (role === 'collaborateur') members.push(user);
        credentials.push({ email, role, team: definition.name });
      }
    }

    const existing = await q('api::daily-aggregate.daily-aggregate').findMany({ where: { team: team.id, day: { $in: days } }, select: ['day'] });
    const present = new Set(existing.map(record => record.day));
    const moods: SeedRow[] = [], logs: SeedRow[] = [], aggregates: SeedRow[] = [];
    for (const [index, date] of days.entries()) {
      if (present.has(date)) continue;
      const { count, scores } = demoDay(definition, index, teamIndex);
      if (!count) continue;
      for (const [n, score] of scores.entries()) {
        const user = members[(n + index) % members.length];
        const chosenTags = [...new Set([tags[(index + n) % tags.length].id, tags[(index + n + (score <= 2 ? 1 : 3)) % tags.length].id])];
        moods.push({ data: { documentId: randomUUID(), score, day: date }, relations: { team: [team.id], tags: chosenTags } });
        logs.push({ data: { documentId: randomUUID(), day: date, deduplicationKey: createHmac('sha256', process.env.JWT_SECRET!).update(`${user.id}:${date}`).digest('hex') }, relations: { user: [user.id] } });
      }
      aggregates.push({ data: { documentId: randomUUID(), day: date, aggregateKey: `${team.id}:${date}`, scoreSum: scores.reduce((sum, value) => sum + value, 0), responseCount: count }, relations: { team: [team.id] } });
    }
    await strapi.db.transaction(async ({ trx }) => {
      await insertBatch(strapi, 'api::mood-entry.mood-entry', moods, trx);
      await insertBatch(strapi, 'api::submission-log.submission-log', logs, trx);
      await insertBatch(strapi, 'api::daily-aggregate.daily-aggregate', aggregates, trx);
    });
    createdMoods += moods.length;

    const templates = [
      { title: 'Clarifier les priorités de la semaine', status: 'planned', created: -2, due: 7 },
      { title: 'Préparer un atelier de partage des pratiques', status: 'planned', created: -1, due: 14 },
      { title: 'Protéger deux créneaux sans réunion', status: 'active', created: -12, due: 3 },
      { title: 'Rééquilibrer les tâches urgentes', status: 'active', created: -8, due: -1 },
      { title: 'Tester un point d’équipe plus court', status: 'completed', created: -20, due: -2, review: 5, feedback: 6 },
      { title: 'Rendre les objectifs du mois plus lisibles', status: 'completed', created: -30, due: -10, review: -3, feedback: 9 },
      { title: 'Essayer un nouveau rituel de reconnaissance', status: 'completed', created: -25, due: -14, review: -7, feedback: 3 },
      { title: 'Faire le bilan de nos outils', status: 'planned', created: -4, due: 30 },
    ];
    for (const template of templates) {
      if (await q('api::team-action.team-action').findOne({ where: { team: team.id, title: template.title } })) continue;
      const reviewers = members.slice(1, Math.min(template.feedback ?? 0, members.length - 1) + 1);
      const scores = reviewers.map((_, index) => index % 4 === 0 ? 2 : 3);
      await strapi.db.transaction(async () => {
        const action = await q('api::team-action.team-action').create({ data: {
          documentId: randomUUID(), team: team.id, title: template.title,
          description: 'Exemple fictif : échanger en équipe, convenir d’un petit changement et observer ensemble son effet.',
          status: template.status, createdDay: shiftDay(day, template.created), dueDay: shiftDay(day, template.due),
          reviewUntil: template.review === undefined ? null : shiftDay(day, template.review),
          feedbackCount: reviewers.length, feedbackSum: scores.reduce((sum, score) => sum + score, 0),
        } });
        if (reviewers.length) await q('api::action-response-log.action-response-log').createMany({ data: reviewers.map(user => ({
          documentId: randomUUID(), expiresOn: shiftDay(action.createdDay, 121),
          deduplicationKey: createHmac('sha256', process.env.JWT_SECRET!).update(`action-feedback:${user.id}:${action.documentId}`).digest('hex'),
        })) });
      });
      createdActions++;
    }
    strapi.log.info(`Démo : ${definition.name}, ${definition.size} collaborateurs, ${definition.managers} manager(s).`);
  }
  return { credentials, createdMoods, createdActions };
}
