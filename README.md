# Moodly — micro base mobile

Base de départ du projet étudiant : React Native + Expo + TypeScript, avec un serveur Strapi v5 et SQLite. **React Native remplace ici Vue 3 + Capacitor à la demande du porteur du projet. Cet écart au brief est à valider avec l’encadrant.**

## Ce qui est prêt

- Deux parcours de **démo**, collaborateur et manager, sans authentification réelle.
- Saisie 1 à 5, tags facultatifs et confirmation. Blocage d’une deuxième saisie le même jour dans la session uniquement.
- Un graphique sur 30 jours de données fictives, avec des trous pour les jours sous 5 réponses, accompagné d’un résumé texte.
- Écran d’information sur les données.
- Projet Strapi v5 installable et quatre modèles : Team, MoodEntry, Tag, SubmissionLog.
- Client API préparé dans `mobile/src/strapi.ts`, non connecté aux écrans.

**Ce dépôt est un starter, pas le MVP terminé.** Aucun moral réel n’est envoyé ou conservé. Le choix du parcours ne constitue pas un contrôle d’accès. Le graphique ne reflète pas les saisies de la démo.

## Démarrer l’app

Prérequis : Node.js 24 LTS, npm et Expo Go sur un téléphone compatible, ou un simulateur configuré.

Depuis la racine du dépôt `moodly-starter` :

```sh
npm ci
npm start
```

L’installation à la racine installe automatiquement les dépendances de `mobile`. Le serveur Strapi reste indépendant. Les commandes dans `mobile` fonctionnent aussi.

Scanner le QR code dans Expo Go, sur le même réseau que le PC. `npm run web` ouvre la version web. `npm run android` ou `npm run ios` utilise un émulateur/simulateur disponible.

Le mode démo fonctionne sans serveur et ne demande aucun compte.

## Démarrer Strapi

Dans un autre terminal :

```sh
cd backend
npm ci
cp .env.example .env
npm run develop
```

Remplacer les valeurs d’exemple de `.env` par des secrets aléatoires différents avant de lancer le serveur. Créer le compte administrateur sur http://localhost:1337/admin. Les modèles sont consultables dans le Content Manager. Ne pas ouvrir les permissions de lecture de MoodEntry ou SubmissionLog.

L’authentification native Strapi existe via Users & Permissions. Les routes métier personnalisées de saisie et de statistiques **ne sont pas encore implémentées**.

Pour le futur raccordement mobile : copier `mobile/.env.example` en `mobile/.env`, remplacer `localhost` par l’IP du PC sur téléphone, puis redémarrer Expo. Cette configuration est actuellement inutilisée par les écrans de démo. En production, utiliser HTTPS.

## Structure

```text
mobile/App.tsx          Écrans de démo
mobile/src/demo.ts      Données fictives et tags
mobile/src/strapi.ts    Client pour les futures routes
backend/config/        Configuration Strapi
backend/src/api/       Modèles de données, sans routes publiques
docs/api.md            Contrat et règles à implémenter
```

## Prochaines étapes pour le MVP

1. Créer les rôles Collaborateur et Manager, affecter chaque utilisateur à une équipe, connecter l’écran de login et gérer le jeton avec un stockage adapté.
2. Implémenter la saisie serveur : équipe et date dérivées côté serveur, validation, transaction entre journal unique utilisateur/jour et réponse sans auteur.
3. Implémenter la route de statistiques, limitée à l’équipe du manager et aux seuls agrégats, avec seuil de 5 réponses appliqué côté serveur.
4. Tester les accès interdits, les doubles saisies concurrentes et les risques de recoupement par métadonnées/journaux. Définir la purge et documenter la confidentialité.
5. Ajouter un seed explicitement fictif, tester sur téléphone, préparer la note de conception et la vidéo.

Les modèles seuls ne garantissent pas l’anonymat. Les horodatages et logs techniques doivent être pris en compte dans la conception. Ne pas utiliser cette base avec des données réelles avant de terminer ces étapes.

## Vérification

```sh
cd mobile
npm run typecheck
npx expo export --platform web
```

```sh
cd backend
npm run build
```

Les dépendances générées présentent des alertes npm audit ; leur revue reste à faire avant déploiement.

## Documentation

- [Expo](https://docs.expo.dev/more/create-expo/)
- [Strapi v5](https://docs.strapi.io/cms/quick-start)
