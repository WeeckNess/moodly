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

Scanner le QR code sur téléphone, ou utiliser `npm run web`. La connexion à Strapi est obligatoire. Le rôle et l’équipe du compte déterminent la vue affichée ; aucun mode fictif n’est proposé dans l’interface.

## Lancer le serveur

Dans un second terminal, depuis la racine :

```sh
npm run backend:install
npm run backend:dev
```

Pour des tests locaux uniquement, `npm run backend:demo` permet de créer des comptes et données fictifs. Ne pas utiliser ces données pour un lancement réel. Le premier démarrage de cette commande crée automatiquement `backend/.env` avec des secrets aléatoires, sans écraser un fichier existant. Le seed est explicite, idempotent et interdit en production. Il crée les rôles, une équipe, un manager, huit collaborateurs et 29 jours de données fictives. Aujourd’hui reste disponible pour tester la saisie.

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
- Interface mobile et web simplifiée : météo et profil. Le profil regroupe la confidentialité et la déconnexion. La vue salarié ou manager est définie par Strapi, sans bascule de rôle côté client.
- Connexion Strapi refaite : formulaire unique, affichage/masquage du mot de passe sans accès anonyme ; rôle et équipe résolus côté serveur.
- JWT conservé dans le stockage sécurisé système sur mobile ; en mémoire uniquement sur le web. Expiration après 8 heures et suppression à la déconnexion.
- Sélecteur gestuel en arc de 240° : un cercle ouvert en bas, parcouru de Très mal à Très bien, également utilisable au clavier et avec les actions d’accessibilité natives.
- Les cinq icônes météo Phosphor en duotone se transforment réellement par interpolation de leurs contours SVG, autour d’un centre fixe. Les points et les ouvertures se déforment sur le thread UI : aucun fondu entre icônes superposées. Le disque et l’icône centrale sont agrandis de 25 %, et la phrase positive apparaît au-dessus de l’arc, agrandie de 25 % (15 px). Fond et disque central changent de couleur. Le curseur et la scène sont animés par Reanimated, avec Gesture Handler sur le thread UI natif : aucune mise à jour React à chaque image, uniquement lors du changement de note. Clic éloigné : trajet continu sur tout l’arc, avec libellé et phrase positive au passage des paliers. Retour haptique léger au franchissement exact de chaque point entier, indépendamment du changement de libellé à mi-palier, sur téléphone compatible (aucune vibration sur le navigateur). Logo toujours droit et fixe. Trajet raccourci lorsque le réglage système demande moins de mouvement.
- Parcours collaborateur épuré en deux écrans fixes : météo, puis raisons facultatives. Contrôle serveur d’une réponse par jour, selon le fuseau Europe/Paris.
- Bouton « + Ma propre raison » : brouillon privé de 80 caractères maximum, non envoyé et effacé après la saisie. Seuls les tags prédéfinis sont transmis.
- Invitation privée après trois « Très mal » sur trois jours distincts dans les 30 derniers jours, comptés sur cet appareil uniquement. Aucune alerte individuelle au manager. Le message proposé doit être copié et envoyé volontairement par l’utilisateur.
- Journal et réponse créés dans une transaction ; contrainte unique pour bloquer les requêtes concurrentes.
- Vue manager : un graphique sur 30 jours, moyennes masquées sous 5 réponses et résumé texte.
- Participation collective sur 7 jours, masquée sous 5 participants distincts.
- Routes manager limitées à l’équipe gérée par le compte ; aucune route de lecture des réponses ou journaux.
- Profil personnel : carte météo quotidienne inspirée des souvenirs BeReal, calendrier des 30 derniers jours et tendance personnelle sur 7 jours. Stockage sécurisé par compte sur mobile ; mémoire de session uniquement sur le web réel. Aucun nouvel historique individuel côté serveur ou manager.
- Confidentialité, aide et déconnexion regroupées dans le profil, sans les anciennes pages ni barre d’onglets. Effacement local du récap et du compteur privé après confirmation.
- Purge des réponses et journaux après 45 jours par défaut, au démarrage et quotidiennement à 3 h, avec conservation séparée des agrégats.

## Rapports et accompagnement

Le profil contient un arbre personnel qui grandit au fil des journées partagées, des rapports journaliers et des bilans glissants sur 7 et 30 jours. Les professionnels et services d’accompagnement se configurent dans Strapi, par équipe, sans transmettre automatiquement les moods. Voir [la configuration et les règles de confidentialité](docs/rapports-jardin-accompagnement.md).

## Structure

```text
mobile/App.tsx                       Parcours et écrans
mobile/src/weather.ts                Météos et tags Phosphor
mobile/src/theme.ts                  Palette et typographie
mobile/src/components/MoodChart.tsx   Graphique accessible
mobile/src/components/MoodDial.tsx    Arc et transitions météo
mobile/src/components/MoodFlow.tsx    Parcours en deux étapes et fenêtres privées
mobile/src/support.ts                Compteur privé sur l’appareil
mobile/src/strapi.ts                  Client API et stockage du jeton
backend/src/api/                     Modèles, routes et contrôleurs
backend/src/lib/                     Validation, seed et conservation
backend/tests/                       Règles métier et intégration API
docs/                               Conception, API et état du serveur
```

## Vérifications

```sh
npm run typecheck
npm test
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

Le compteur d’accompagnement est isolé par compte à l’aide d’une clé opaque délivrée dans `/api/session`. Sur mobile, il utilise le stockage sécurisé système. Sur le web réel, il reste en mémoire pendant la session et se réinitialise à la déconnexion ou au rechargement. Il ne synchronise pas les appareils et ne reconstitue pas les anciennes réponses. Les dates hors fenêtre sont écartées lors de la prochaine saisie. Ce dispositif d’accompagnement ne constitue pas une validation RGPD.

Les dépendances du starter présentent des alertes npm audit : leur revue reste à mener avant un déploiement. Notifications locales, historique personnel et export CSV ne font pas partie de cette version.

## Références visuelles et techniques

- [ArtCraft — inspiration de la structure visuelle](https://getartcraft.com/apps) : contraste sombre, titres généreux, repères numérotés, filets et accents colorés. Aucun logo, visuel ou texte ArtCraft réutilisé.
- [Phosphor React Native](https://github.com/duongdev/phosphor-react-native)
- [Expo](https://docs.expo.dev/)
- [Strapi v5](https://docs.strapi.io/cms/quick-start)

## Revue de la nouvelle DA

La revue du portail manager, de la connexion et des parcours est détaillée dans [docs/revue-da.md](docs/revue-da.md). Le graphe reste unique sur trente jours, les journées masquées interrompent la courbe et la navigation par date expose uniquement les moyennes collectives autorisées.

## Profil et connexion — 15 octobre 2026

Le parcours simplifié et les limites du récap local sont décrits dans [docs/profil-personnel.md](docs/profil-personnel.md).
