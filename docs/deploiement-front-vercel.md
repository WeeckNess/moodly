# Déploiement web de Moodly sur Vercel

Adresse publique : **https://moodly-pearl.vercel.app**.

Le projet Vercel **moodly**, dans l’espace **weeckness-projects**, contient uniquement le dossier `mobile/`. Le backend existant reste à `https://moodly-backend-theta.vercel.app`.

## Configuration

- Dossier à déployer : `mobile/` (ou Root Directory `mobile` en cas d’import du dépôt Git).
- Framework : Other.
- Installation : `npm ci`.
- Construction : `npm run build` (export web de production Expo).
- Sortie : `dist`.
- Variable publique Vercel, production et preview : `EXPO_PUBLIC_API_URL=/`.

Les requêtes `/api/*` du front sont relayées vers le backend par `mobile/vercel.json`. Le navigateur reste sur le même domaine et n’a pas besoin d’un changement CORS côté Strapi. Les routes conservent l’authentification du backend ; aucune base de données ni service Strapi n’est déployé dans ce projet. Les réponses API sont marquées privées et non mises en cache.

Les fichiers `.env*`, `.expo`, les dépendances locales et les sorties de construction ne sont pas envoyés. Les secrets Vercel locaux et les données du profil de simulation restent hors du déploiement.

## Redéployer depuis le Mac

Depuis `mobile/`, vérifier le projet lié avec `vercel project inspect --non-interactive`, puis déployer avec `vercel deploy --prod --scope weeckness-projects`. La liaison locale `.vercel` n’est pas versionnée. Une nouvelle machine peut lier explicitement le dossier au projet existant via `vercel link --project moodly --scope weeckness-projects`.

Le déploiement initial utilise le CLI Vercel. Une intégration Git automatique n’a pas été ajoutée.

## Vérification du déploiement initial

- Environnement : production ; état Vercel Ready ; front Expo / React Native Web.
- Construction distante : environ deux minutes, installation comprise.
- Page publique : HTTP 200, écran de connexion rendu dans le navigateur.
- Relais `/api/session` : HTTP 403 sans jeton, réponse Strapi JSON, `Cache-Control: private, no-store`.
- Formulaire public : un identifiant volontairement inexistant produit le message normal « Adresse ou mot de passe incorrect. », sans erreur CORS. Aucune donnée métier créée et aucun compte réel utilisé pour ce contrôle.
- Consultation des journaux d’erreur Vercel : aucun journal trouvé au moment de la vérification. Surveillance continue et drains non vérifiés.
- L’alias technique `moodly-weeckness-projects.vercel.app` conserve la protection Vercel. L’adresse à partager est `moodly-pearl.vercel.app`, accessible sans connexion à Vercel. La protection n’a pas été désactivée.
