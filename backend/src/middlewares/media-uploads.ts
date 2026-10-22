// Le disque d'une instance Vercel est éphémère : aucun média ne doit y être ajouté.
export default () => async (ctx: any, next: () => Promise<void>) => {
  const uploadRoute = /^\/(?:api\/)?upload(?:\/|$)/.test(ctx.path);
  if (process.env.MOODLY_MEDIA_UPLOADS_ENABLED === 'false' && uploadRoute && !['GET', 'HEAD', 'DELETE'].includes(ctx.method)) {
    ctx.status = 403;
    ctx.body = { error: { status: 403, name: 'ForbiddenError', message: 'La médiathèque est en lecture seule sur cet hébergement.' } };
    return;
  }
  await next();
};
