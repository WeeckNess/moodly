const COOKIE = 'eclaircie.session';
const WEB_SESSION = 'web-cookie-session';
const MAX_AGE = 8 * 60 * 60 * 1000;

// Only the app's opt-in requests use cookies. Native clients keep bearer JWTs.
export default (config: { origins?: string[] } = {}) => async (ctx: any, next: () => Promise<void>) => {
  if (!ctx.path.startsWith('/api/') || ctx.get('X-Eclaircie-Web-Session') !== '1') return next();
  ctx.set('Cache-Control', 'private, no-store');
  // A custom header prevents simple cross-site form requests; Fetch Metadata also
  // excludes untrusted browser origins, including other same-site subdomains.
  const sameOrigin = ctx.get('Sec-Fetch-Site') === 'same-origin';
  const allowedDevelopmentOrigin = process.env.NODE_ENV !== 'production' && config.origins?.includes(ctx.get('Origin'));
  if (!sameOrigin && !allowedDevelopmentOrigin) {
    ctx.status = 403;
    ctx.body = { error: { message: 'Origine de session web non autorisée.' } };
    return;
  }
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, signed: false, overwrite: true, path: '/api' };
  if (ctx.path === '/api/auth/web-logout' && ctx.method === 'POST') {
    ctx.cookies.set(COOKIE, null, { ...options, maxAge: 0 });
    ctx.body = { data: { loggedOut: true } };
    return;
  }
  const cookie = ctx.cookies.get(COOKIE, { signed: false });
  if (cookie && !ctx.get('Authorization')) ctx.request.headers.authorization = `Bearer ${cookie}`;
  await next();
  if (ctx.method === 'POST' && ['/api/auth/local', '/api/auth/change-password'].includes(ctx.path) && ctx.status >= 200 && ctx.status < 300 && typeof ctx.body?.jwt === 'string') {
    const token = ctx.body.jwt;
    // Never expose a cookie-backed web token in the JSON response.
    ctx.body = { ...ctx.body, jwt: WEB_SESSION };
    ctx.cookies.set(COOKIE, token, { ...options, maxAge: MAX_AGE });
  }
};
