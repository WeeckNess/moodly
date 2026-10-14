# Éclaircie — la météo du collectif

Application mobile du projet Moodly. Chaque collaborateur partage son moral sous forme de météo, de l’orage au soleil. Le manager consulte un seul graphique collectif sur 30 jours.

**React Native + Expo + TypeScript · Strapi v5 · SQLite.** React Native remplace Vue 3 + Capacitor à la demande du porteur du projet. Cet écart au brief reste à valider avec l’encadrant.

## Lancer l’application

Prérequis : Node.js 24, npm, Expo Go compatible avec le SDK 57 ou un simulateur.

Depuis la racine :

```sh
npm ci
npm start
```

Scanner le QR code sur téléphone, ou utiliser `npm run web`. La démo fonctionne sans serveur via « Explorer la démo » ou « Découvrir la vue manager ».

## Lancer le serveur et les comptes fictifs

Dans un second terminal, depuis la racine :

```sh
npm run backend:install
npm run backend:demo
```

Le premier démarrage crée automatiquement `backend/.env` avec des secrets aléatoires, sans écraser un fichier existant. Le seed est explicite, idempotent et interdit en production. Il crée les rôles, une équipe, un manager, huit collaborateurs et 29 jours de données fictives. Aujourd’hui reste disponible pour tester la saisie.

| Compte fictif | Identifiant | Mot de passe local par défaut |
| --- | --- | --- |
| Manager | `manager@eclaircie.test` | `EclaircieDemo2026!` |
| Collaborateur 1 | `collaborateur1@eclaircie.test` | `EclaircieDemo2026!` |
| Collaborateur 2 à 8 | `collaborateur2@eclaircie.test` à `collaborateur8@eclaircie.test` | `EclaircieDemo2026!` |

`MOODLY_DEMO_PASSWORD` permet de choisir un autre mot de passe **avant la première création**. Les mots de passe des comptes existants ne sont pas réinitialisés. Ces comptes sont réservés à une démonstration locale avec des données fictives.

Pour lancer le serveur sans créer les comptes fictifs : `npm run backend:dev`.

Administration : http://localhost:1337/admin. Le compte administrateur est distinct des comptes de l’app et doit être créé à la première ouverture.

### Sur un téléphone physique

Créer `mobile/.env` à partir de `mobile/.env.example`, puis remplacer `localhost` par l’IP du PC sur le réseau local :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:1337
```

Téléphone et PC doivent être sur le même réseau. Redémarrer Expo après modification. Utiliser HTTPS pour un déploiement. Les navigateurs web nécessitent aussi une origine autorisée dans `CORS_ORIGINS` ; l’app native n’est pas soumise au CORS navigateur.

## Fonctionnalités livrées

- Identité Éclaircie : fond sombre, grands titres, filets fins, accents sauge et jaune, cinq météos Phosphor.
- Interface adaptée au mobile et au web : barre de navigation mobile, navigation latérale sur grand écran.
- Connexion réelle Strapi, rôle et équipe résolus côté serveur.
- JWT conservé dans le stockage sécurisé système sur mobile ; en mémoire uniquement sur le web. Expiration après 8 heures et suppression à la déconnexion.
- Saisie 1 à 5, tags prédéfinis facultatifs, confirmation et contrôle serveur d’une réponse par jour, selon le fuseau Europe/Paris.
- Journal et réponse créés dans une transaction ; contrainte unique pour bloquer les requêtes concurrentes.
- Vue manager : un graphique sur 30 jours, moyennes masquées sous 5 réponses et résumé texte.
- Participation collective sur 7 jours, masquée sous 5 participants distincts.
- Routes manager limitées à l’équipe gérée par le compte ; aucune route de lecture des réponses ou journaux.
- Écrans « Mes données » et « Comment ça marche ».
- Mode démo explicitement fictif ; seule sa date de saisie est conservée localement, indépendamment du serveur.
- Purge des réponses et journaux après 45 jours par défaut, au démarrage et quotidiennement à 3 h, avec conservation séparée des agrégats.

## Structure

```text
mobile/App.tsx                       Parcours et écrans
mobile/src/weather.ts                Météos et tags Phosphor
mobile/src/theme.ts                  Palette et typographie
mobile/src/components/MoodChart.tsx   Graphique accessible
mobile/src/strapi.ts                  Client API et stockage du jeton
backend/src/api/                     Modèles, routes et contrôleurs
backend/src/lib/                     Validation, seed et conservation
backend/tests/                       Règles métier et intégration API
docs/                               Conception, API et état du serveur
```

## Vérifications

```sh
npm run typecheck
npm run backend:test
npm run build --prefix backend
```

Exports de contrôle :

```sh
cd mobile
npx expo export --platform web
npx expo export --platform android
npx expo export --platform ios
```

Les exports vérifient les bundles ; ils ne constituent pas une installation sur téléphone ou un APK signé.

Les tests API utilisent automatiquement une base SQLite temporaire et un port libre, avec des comptes fictifs :

```sh
npm run backend:test:api
```

Le script compile le serveur, démarre l’instance isolée, exécute les tests et supprime uniquement sa base temporaire. Voir `docs/validation.md`.

## Limites avant utilisation réelle

Le MVP limite ce que voit le manager ; ce n’est pas une preuve d’anonymat absolu. Les accès administrateur, horodatages, identifiants internes et journaux techniques peuvent permettre des recoupements. Une validation de confidentialité et de conformité reste nécessaire avant une utilisation avec de vrais salariés. Voir `docs/conception.md`.

Les dépendances du starter présentent des alertes npm audit : leur revue reste à mener avant un déploiement. Notifications locales, historique personnel et export CSV ne font pas partie de cette version.

## Références visuelles et techniques

- [ArtCraft — inspiration de la structure visuelle](https://getartcraft.com/apps) : contraste sombre, titres généreux, repères numérotés, filets et accents colorés. Aucun logo, visuel ou texte ArtCraft réutilisé.
- [Phosphor React Native](https://github.com/duongdev/phosphor-react-native)
- [Expo](https://docs.expo.dev/)
- [Strapi v5](https://docs.strapi.io/cms/quick-start)
