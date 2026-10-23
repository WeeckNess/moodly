# Déploiement web de Moodly sur Vercel

Adresse publique actuelle : **https://moodly-front.vercel.app**.

Le projet Vercel **moodly-front**, dans **Téo's team** (`teo-s-team1`), construit le dossier `mobile/` du dépôt [WeeckNess/moodly](https://github.com/WeeckNess/moodly). Les paramètres du projet sont :

- Framework : Other.
- Root Directory : `mobile`.
- Installation : `npm ci`.
- Construction : `npm run build` (export web Expo).
- Sortie : `dist`.
- Node.js : 24.x.
- Variable publique Vercel, production et preview : `EXPO_PUBLIC_API_URL=/`.

Les requêtes `/api/*` passent par le domaine du front, avec authentification JWT Strapi. `mobile/vercel.json` définit le backend réel comme destination par défaut. La règle du projet `CDN → Routing Rules → Backend Strapi` permet de choisir la démo ; elle reste prioritaire lors des redéploiements. Voir [la bascule réel/démo](environnement-demo.md).

## Source GitHub

Le workflow **Deploy front and demo backend to Vercel** est préparé dans `.github/workflows/deploy-vercel.yml`. Il déploie le front et le backend de démonstration depuis le commit testé de `main`, avec construction distante et vérification avant promotion. L'activation nécessite la protection de `main`, l'environnement GitHub `production` et son secret `VERCEL_TOKEN` : [procédure complète](deploiement-github.md).

Les secrets applicatifs restent dans Vercel. Le workflow ne télécharge pas de fichiers `.env` et ne les ajoute pas au dépôt. Les données locales, les dépendances et les sorties de construction ne constituent pas la source du déploiement.

## Dépannage depuis le Mac

Depuis la racine du dépôt, avec Node 24 et le CLI authentifié, cibler explicitement le projet existant :

```sh
VERCEL_ORG_ID=team_SLEbao2P3yLYY21T8Uc87kCz \
VERCEL_PROJECT_ID=prj_gmWpfloa5d6w0S6hsfUC9F7goX7P \
vercel deploy --prod --scope teo-s-team1 --project moodly-front
```

Le dossier envoyé doit contenir `mobile/`, puisque le projet utilise cette Root Directory. Une copie ne contenant que les fichiers de `mobile/` ne convient pas avec ce réglage. Les fichiers `.vercel` locaux ne sont pas versionnés ; les identifiants explicites évitent d'utiliser une liaison locale vers un autre projet.

L'ancien déploiement `moodly-pearl.vercel.app`, dans l'espace `weeckness-projects`, est distinct du projet `moodly-front` concerné par ce guide.
