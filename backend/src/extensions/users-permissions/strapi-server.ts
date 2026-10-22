export default (plugin: any) => {
  const attributes = plugin.contentTypes.user.schema.attributes;
  attributes.mustChangePassword = { type: 'boolean', default: false, private: true };
  attributes.credentialVersion = { type: 'integer', default: 0, private: true };
  attributes.displayName = { type: 'string', minLength: 2, maxLength: 80 };
  attributes.team = { type: 'relation', relation: 'manyToOne', target: 'api::team.team' };
  // Strapi v5 fournit une fabrique de contrôleur, pas un contrôleur déjà instancié.
  const originalAuth = plugin.controllers.auth;
  plugin.controllers.auth = (context: any) => {
    const auth = typeof originalAuth === 'function' ? originalAuth(context) : originalAuth;
    const { strapi } = context;
    const users = () => strapi.db.query('plugin::users-permissions.user');
    const issue = (id: number, credentialVersion: number) => strapi.plugin('users-permissions').service('jwt').issue({ id, credentialVersion });
    return {
      ...auth,
      async callback(ctx: any) {
        await auth.callback(ctx);
        if (ctx.body?.jwt && ctx.body?.user?.id) {
          const user = await users().findOne({ where: { id: ctx.body.user.id } });
          ctx.body.jwt = issue(user.id, user.credentialVersion ?? 0);
        }
      },
      async changePassword(ctx: any) {
        const { password, passwordConfirmation } = ctx.request.body ?? {};
        if (typeof password !== 'string' || password.length < 12) return ctx.badRequest('Choisis un mot de passe d’au moins 12 caractères.');
        if (Buffer.byteLength(password, 'utf8') > 72) return ctx.badRequest('Ton mot de passe est trop long. Essaie une phrase plus courte.');
        if (password !== passwordConfirmation) return ctx.badRequest('Les deux nouveaux mots de passe ne correspondent pas.');
        await strapi.db.transaction(async () => {
          await auth.changePassword(ctx);
          if (ctx.body?.jwt && ctx.state.user?.id) {
            const user = await users().findOne({ where: { id: ctx.state.user.id } });
            const credentialVersion = (user.credentialVersion ?? 0) + 1;
            await users().update({ where: { id: user.id }, data: { mustChangePassword: false, credentialVersion } });
            ctx.body.jwt = issue(user.id, credentialVersion);
            ctx.set('Cache-Control', 'no-store');
          }
        });
      },
    };
  };
  return plugin;
};
