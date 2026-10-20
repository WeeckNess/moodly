import type { Core } from '@strapi/strapi';

// Valeurs de départ uniquement : l'administration devient la source de vérité ensuite.
const defaults = [
  { label: 'Charge', audience: 'collaborateur', icon: 'briefcase', position: 0 },
  { label: 'Ambiance', audience: 'collaborateur', icon: 'message-circle', position: 1 },
  { label: 'Sens', audience: 'collaborateur', icon: 'compass', position: 2 },
  { label: 'Équilibre', audience: 'collaborateur', icon: 'scale', position: 3 },
  { label: 'Reconnaissance', audience: 'both', icon: 'heart', position: 4 },
  { label: 'Outils', audience: 'collaborateur', icon: 'wrench', position: 5 },
  { label: 'Arbitrages', audience: 'manager', icon: 'scale', position: 0 },
  { label: 'Moyens', audience: 'manager', icon: 'wrench', position: 1 },
  { label: 'Conflits', audience: 'manager', icon: 'message-circle', position: 2 },
  { label: 'Objectifs', audience: 'manager', icon: 'compass', position: 3 },
  { label: 'Soutien hiérarchique', audience: 'manager', icon: 'heart', position: 5 },
];

export async function setupTags(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'core', name: 'moodly', key: 'tag-catalog-v1' });
  const initialized = await store.get();
  const tags = strapi.db.query('api::tag.tag');
  await strapi.db.transaction(async () => {
    // Strapi ajoute les colonnes, mais ne remplit pas les anciennes lignes.
    for (const [field, value] of Object.entries({ enabled: true, audience: 'collaborateur', icon: 'compass', position: 0 })) {
      await tags.updateMany({ where: { [field]: { $null: true } }, data: { [field]: value } });
    }
    // Conversion idempotente des anciennes icônes vers les noms du sélecteur Lucide.
    for (const [oldName, icon] of Object.entries({ chat: 'message-circle', scales: 'scale' })) {
      await tags.updateMany({ where: { icon: oldName }, data: { icon } });
    }
    if (initialized) return;
    for (const data of defaults) {
      const existing = await tags.findOne({ where: { label: data.label } });
      if (existing) await tags.update({ where: { id: existing.id }, data });
      else await strapi.documents('api::tag.tag').create({ data: { ...data, enabled: true } as any });
    }
    await store.set({ value: true });
  });
}

export const tagAudience = (role: string) => ({ enabled: true, audience: { $in: [role, 'both'] } });
