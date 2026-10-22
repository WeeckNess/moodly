export default {
  routes: [{ method: 'GET', path: '/maintenance/retention', handler: 'maintenance.retention', config: { auth: false, policies: ['global::is-cron'] } }],
};
