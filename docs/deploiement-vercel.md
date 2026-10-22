# Déployer Strapi sur Vercel

Le projet Vercel `moodly-backend` appartient à `Téo's team` (`teo-s-team1`). La base PostgreSQL Neon `moodly-db`, offre gratuite, est hébergée à Francfort. Elle a été créée sans importer la base SQLite locale. Le bootstrap ajoute les schémas, rôles, permissions et tags ; les équipes et comptes applicatifs sont à créer dans Strapi.

Administration en ligne : [moodly-backend-theta.vercel.app/admin](https://moodly-backend-theta.vercel.app/admin). Base de l'API : `https://moodly-backend-theta.vercel.app`, avec les routes métier préfixées par `/api`.

Publication de production vérifiée le 22 octobre 2026 depuis le commit `f8bb911`, via [ce déploiement Vercel](https://vercel.com/teo-s-team1/moodly-backend/BHTU26GnVvnW9uepfq41rdUiQCvX). Le contrôle HTTPS confirme `/_health` à 204, la connexion administrateur à 200, les 11 tags avec leurs icônes, la purge à 200 avec le secret et à 403 sans secret, les ajouts de médias à 403 et le refus d'une session applicative anonyme. Connexion et sélecteur Lucide de 1 703 icônes également vérifiés dans l'administration du navigateur. Aucun compte applicatif ni équipe de test n'a été ajouté à la production.

## Exécution

Vercel construit `backend/Dockerfile.vercel` avec Node.js 24. Le service `strapi` est déclaré explicitement avec `runtime: "container"`, et toutes les routes lui sont transmises par la réécriture de `vercel.json`. Le runtime conteneur de Vercel est en bêta ; il peut arrêter une instance inactive, puis la redémarrer à la prochaine requête. Prévoir une latence au premier accès.

`scripts/start-production.cjs` vérifie les secrets et PostgreSQL, puis démarre le code compilé dans `dist`. Un verrou PostgreSQL acquis avec la connexion directe sérialise les migrations et le bootstrap entre les instances qui démarrent simultanément. Le pool utilisé par les requêtes Strapi est limité à trois connexions par instance, avec un minimum de zéro.

Le disque des instances est éphémère. Les ajouts dans la médiathèque sont donc désactivés par `MOODLY_MEDIA_UPLOADS_ENABLED=false`, conformément au choix du porteur du projet. Les icônes des tags continuent à fonctionner avec Lucide. Pour activer ultérieurement les médias, configurer d'abord un fournisseur de stockage persistant.

La purge est déclenchée par Vercel Cron sur `GET /api/maintenance/retention`, chaque jour à 02:00 UTC. L'horaire Hobby peut varier dans l'heure prévue. La policy exige `Authorization: Bearer <CRON_SECRET>` ; sans ce secret, la route est refusée. La purge au démarrage est conservée ; le cron interne du processus Strapi est désactivé sur Vercel. La conservation reste de 45 jours par défaut, avec agrégats séparés.

## Variables de production

L'intégration Neon fournit `DATABASE_URL` (pool) et `DATABASE_URL_UNPOOLED` (connexion directe pour l'initialisation). Ces variables sont connectées uniquement à Production : ne pas donner la base de production à des previews.

| Variable | Valeur ou usage |
| --- | --- |
| `APP_KEYS` | Deux clés aléatoires séparées par une virgule |
| `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET` | Secrets distincts, générés pour la production |
| `NODE_ENV` | `production` |
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX` | `0`, `3` |
| `HOST`, `PORT` | `0.0.0.0`, `1337` |
| `TRUST_PROXY` | `true`, pour HTTPS derrière le proxy Vercel |
| `MOODLY_INTERNAL_CRON` | `false` |
| `MOODLY_MEDIA_UPLOADS_ENABLED` | `false` |
| `MOODLY_RETENTION_DAYS` | `45` |
| `STRAPI_TELEMETRY_DISABLED` | `true` |
| `CORS_ORIGINS` | Origines web autorisées, séparées par des virgules |
| `PUBLIC_URL` | Facultatif : URL publique si un domaine personnalisé est ajouté |

Les secrets sont enregistrés dans Vercel et dans des fichiers locaux `.env.*.local` ignorés. Aucune base SQLite, clé ou identité locale n'entre dans le conteneur. Ne pas publier ces fichiers. Le script de setup génère une configuration seulement en développement ; en production il refuse de démarrer si un secret requis manque.

## Republier

Depuis `backend/`, avec une CLI Vercel connectée :

```sh
npx vercel project inspect --non-interactive --scope teo-s-team1
npm test
npm run build
npx vercel deploy --prod --scope teo-s-team1
```

Vérifier que l'inspection désigne `teo-s-team1/moodly-backend`. Vercel reconstruit le conteneur depuis les sources du dossier `backend`, indépendamment de la compilation locale. Sur l'offre Hobby, l'auteur du commit déployé doit avoir accès au projet Vercel : enregistrer les modifications sous sa propre identité Git autorisée, sans réécrire l'identité d'un commit tiers. Le premier déploiement est effectué par CLI ; la connexion automatique au dépôt GitHub n'a pas abouti et aucun déploiement automatique Git n'est configuré.

Après publication, contrôler `/_health` (204), `/admin` et la connexion administrateur, puis le catalogue Lucide. La route de purge doit refuser un appel sans secret. L'application Expo doit recevoir l'URL publique via `EXPO_PUBLIC_API_URL` ; les origines d'un éventuel front web doivent aussi être autorisées dans `CORS_ORIGINS`.

Le premier compte administrateur utilise l'adresse choisie par le porteur du projet. Son mot de passe généré est dans `backend/.env.admin.local`, ignoré par Git et les envois Vercel/Docker. Le changer depuis l'administration après la première connexion. Ce compte est distinct des comptes de l'application.

Les sauvegardes restent hors périmètre à la demande du porteur du projet.

Le build signale 53 alertes de dépendances npm, dont 5 critiques ; elles ne sont pas corrigées par cette configuration d'hébergement. Leur exploitabilité et les mises à jour compatibles restent à examiner dans une revue des dépendances.

Références : [runtime conteneur Vercel](https://vercel.com/docs/functions/container-images), [cron sécurisé](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [déploiement Strapi](https://docs.strapi.io/cms/deployment).
