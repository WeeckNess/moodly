// Pas de routes REST génériques : aucune lecture de réponses individuelles.
export default {
  routes: [
    { method: 'GET', path: '/session', handler: 'mood-entry.session', config: { auth: { scope: ['api::mood-entry.mood-entry.session'] } } },
    { method: 'POST', path: '/mood-entries', handler: 'mood-entry.create', config: { auth: { scope: ['api::mood-entry.mood-entry.create'] } } },
    { method: 'GET', path: '/team-stats', handler: 'mood-entry.stats', config: { auth: { scope: ['api::mood-entry.mood-entry.stats'] } } },
  ],
};
