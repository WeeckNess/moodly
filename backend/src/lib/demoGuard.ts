export type DemoTarget = { vercelProjectId: string; neonProjectId: string; databaseHost: string; databaseName: string };

// L'activation du mode démo ne suffit jamais : la cible doit aussi correspondre
// aux ressources de démonstration provisionnées et versionnées dans demo-target.json.
export function assertDemoTarget(env: Record<string, string | undefined>, target: DemoTarget) {
  const fail = () => { throw new Error('Opération démo refusée : environnement, projet ou base différents de la cible de démonstration.'); };
  if (env.MOODLY_ENVIRONMENT !== 'demo' || env.DATABASE_CLIENT !== 'postgres' ||
      env.MOODLY_DEPLOYMENT_PROJECT_ID !== target.vercelProjectId || env.NEON_PROJECT_ID !== target.neonProjectId ||
      (env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== target.vercelProjectId)) fail();
  for (const name of ['DATABASE_URL', 'DATABASE_URL_UNPOOLED']) {
    try {
      const url = new URL(env[name] ?? '');
      const host = url.hostname.replace(/-pooler(?=\.)/, '');
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || host !== target.databaseHost ||
          decodeURIComponent(url.pathname.slice(1)) !== target.databaseName || (url.port && url.port !== '5432')) fail();
    } catch { fail(); }
  }
}
