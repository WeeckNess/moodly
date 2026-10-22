// Pas de routes REST génériques : aucune lecture de réponses individuelles.
export default {
  routes: [
    { method: 'POST', path: '/team-members', handler: 'mood-entry.createMember', config: { auth: { scope: ['api::mood-entry.mood-entry.createMember'] }, policies: ['global::is-manager'] } },
    { method: 'GET', path: '/mood-tags', handler: 'mood-entry.tags', config: { auth: { scope: ['api::mood-entry.mood-entry.tags'] } } },
    { method: 'GET', path: '/session', handler: 'mood-entry.session', config: { auth: { scope: ['api::mood-entry.mood-entry.session'] } } },
    { method: 'POST', path: '/mood-entries', handler: 'mood-entry.create', config: { auth: { scope: ['api::mood-entry.mood-entry.create'] } } },
    { method: 'GET', path: '/team-stats', handler: 'mood-entry.stats', config: { auth: { scope: ['api::mood-entry.mood-entry.stats'] }, policies: ['global::is-manager'] } },
    { method: 'GET', path: '/team-actions', handler: 'mood-entry.actions', config: { auth: { scope: ['api::mood-entry.mood-entry.actions'] } } },
    { method: 'POST', path: '/team-actions', handler: 'mood-entry.createAction', config: { auth: { scope: ['api::mood-entry.mood-entry.createAction'] }, policies: ['global::is-manager'] } },
    { method: 'PATCH', path: '/team-actions/:documentId', handler: 'mood-entry.updateAction', config: { auth: { scope: ['api::mood-entry.mood-entry.updateAction'] }, policies: ['global::is-manager'] } },
    { method: 'POST', path: '/team-actions/:documentId/feedback', handler: 'mood-entry.actionFeedback', config: { auth: { scope: ['api::mood-entry.mood-entry.actionFeedback'] } } },
  ],
};
