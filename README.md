# Éclaircie — la météo du collectif

Application mobile du projet Moodly. Chaque collaborateur partage son moral sous forme de météo, de l’orage au soleil. Le manager consulte un seul graphique collectif sur 30 jours.

**React Native + Expo + TypeScript · Strapi v5 · SQLite.** React Native remplace Vue 3 + Capacitor à la demande du porteur du projet. Cet écart au brief reste à valider avec l’encadrant.

Le backend hébergé sur Vercel utilise PostgreSQL Neon ; SQLite reste réservé au développement local. Configuration et republication dans [le guide Vercel](docs/deploiement-vercel.md).

Un [backend de démonstration séparé](docs/environnement-demo.md) dispose de ses propres équipes, comptes et historiques fictifs, sans modifier la base réelle ni l'application web réelle.

## Lancer l’application

Prérequis : Node.js 24, npm, Expo Go compatible avec le SDK 57 ou un simulateur.

Depuis la racine :

```sh
npm ci
npm start
```

Scanner le QR code sur téléphone, ou utiliser `npm run web`. Connecte-toi avec un compte applicatif réel créé dans Strapi et rattaché à une équipe et un rôle Moodly.

La connexion à Strapi est obligatoire. Le rôle et l’équipe du compte déterminent la vue affichée ; aucun mode fictif n’est proposé dans l’interface.

## Lancer le serveur

Dans un second terminal, depuis la racine :

```sh
npm run backend:install
npm run backend:db:init
npm run backend:dev
```

La commande `backend:db:init` initialise la base, les rôles et les tags sans comptes fictifs. Le [modèle de données et la procédure d'initialisation](docs/modele-donnees.md) détaillent les relations et les règles de conservation.

Le démarrage initialise uniquement les schémas, les rôles, les permissions et le catalogue de raisons. Aucun compte, équipe, historique ou agrégat fictif n’est créé. Les anciennes commandes de démonstration et la connexion rapide ont été retirées. Les fixtures des tests API sont autorisées uniquement dans une base temporaire isolée.

Créer les équipes et les comptes réels dans Strapi avant utilisation : voir [l’administration](docs/administration-strapi.md). Le compte administrateur est conservé et reste distinct des comptes applicatifs.

Administration : http://localhost:1337/admin. Le compte administrateur est distinct des comptes de l’app et doit être créé à la première ouverture.

Le [guide d'administration Strapi](docs/administration-strapi.md) explique la création des équipes et des comptes, l'affectation des rôles, la désignation du manager, les tags et les contacts d'accompagnement. L'[état du backend](docs/etat-strapi.md) décrit le périmètre finalisé au 20 octobre 2026. Les sauvegardes sont hors périmètre de cette version locale, à la demande du porteur du projet.

### Connexion du front à Strapi

La connexion, la session, la saisie quotidienne, les statistiques et les actions collectives passent par `mobile/src/strapi.ts`. Les rôles et l'équipe proviennent de Strapi ; les comptes de l'administration ne sont pas des comptes applicatifs.

En développement, laisser `EXPO_PUBLIC_API_URL` vide (ou ne pas créer `mobile/.env`) : sur le web, le client utilise l'hôte de la page au port 1337 ; sur téléphone avec Expo Go en mode LAN, il utilise l'hôte du bundle Metro au même port. Le front et Strapi doivent donc tourner sur le même PC.

Pour une API sur une autre machine, un tunnel Expo ou une version de production, créer `mobile/.env` à partir de `mobile/.env.example` et renseigner explicitement l'adresse de l'API :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:1337
```

Téléphone et PC doivent être sur le même réseau. Redémarrer Expo après modification du fichier `.env`. Utiliser HTTPS pour un déploiement. En développement, Strapi autorise automatiquement les adresses réseau de la machine qui le lance, sur les ports Expo 8081 et 8082. Un autre PC sur le même réseau doit ouvrir `http://IP_DU_PC_SERVEUR:8081` (pas son propre `localhost`). Le port 1337 doit aussi être accessible ; certains Wi-Fi publics isolent les appareils. Après un changement de réseau, relancer Expo en mode LAN et Strapi ; si une IP est définie explicitement dans `.env`, la mettre à jour aussi. L’app native n’est pas soumise au CORS navigateur.

Les jetons JWT restent en mémoire sur le web et dans SecureStore sur mobile. Le récap personnel et la météo privée du manager restent sur l'appareil. Seule la déclaration collective du collaborateur est envoyée à Strapi, sans raison libre ni auteur dans la réponse enregistrée.

Les raisons proposées sont gérées dans **Strapi → Content Manager → Tag** : libellé, public collaborateur/manager/les deux, icône, activation et ordre. Le plugin `strapi-lucide-icons` fournit le sélecteur d'icônes Lucide avec recherche et aperçu ; l'app utilise `lucide-react-native` pour les afficher. L'app lit `GET /api/mood-tags` à chaque ouverture de l'écran des raisons. Les changements ne nécessitent pas de recompilation du front tant que l'icône appartient au catalogue embarqué. Voir [le modèle et la gestion du catalogue](docs/modele-donnees.md).

En production, seules les origines déclarées dans `CORS_ORIGINS` sont autorisées (ou les origines localhost par défaut si la variable est absente), sans ajout automatique des IP réseau. Pour tester depuis un autre réseau, il faut héberger l’app **et** l’API avec des adresses HTTPS accessibles ; le lien Expo seul ne publie pas Strapi.

## Fonctionnalités livrées

- Jardin : animation SVG fournie intégrée au chêne, de la graine aux fleurs, avec racines visibles et 628 séquences pilotées par les journées enregistrées. Compatible Expo web/Android/iOS, progression réelle et préférence de réduction du mouvement. Voir [l’intégration du dessin](docs/arbre-fourni.md).

- Identité Éclaircie : fonds pastel lumineux, textes vert profond, grands titres, filets fins, accents sauge, jaune, lavande et pêche, cinq météos Phosphor.
- Interface mobile et web simplifiée : météo et profil. Le profil regroupe la confidentialité et la déconnexion. La vue salarié ou manager est définie par Strapi, sans bascule de rôle côté client.
- Connexion Strapi refaite : formulaire unique, affichage/masquage du mot de passe sans accès anonyme ; rôle et équipe résolus côté serveur.
- JWT conservé dans le stockage sécurisé système sur mobile ; en mémoire uniquement sur le web. Expiration après 8 heures et suppression à la déconnexion.
- Sélecteur gestuel en arc de 240° : un cercle ouvert en bas, parcouru de Très mal à Très bien, également utilisable au clavier et avec les actions d’accessibilité natives.
- Les cinq icônes météo Phosphor en duotone se transforment réellement par interpolation de leurs contours SVG, autour d’un centre fixe. Les points et les ouvertures se déforment sur le thread UI : aucun fondu entre icônes superposées. Le disque et l’icône centrale sont agrandis de 25 %, et la phrase positive apparaît au-dessus de l’arc, agrandie de 25 % (15 px). Fond et disque central changent de couleur. Le curseur et la scène sont animés par Reanimated, avec Gesture Handler sur le thread UI natif : aucune mise à jour React à chaque image, uniquement lors du changement de note. Clic éloigné : trajet continu sur tout l’arc, avec libellé et phrase positive au passage des paliers. Retour haptique léger au franchissement exact de chaque point entier, indépendamment du changement de libellé à mi-palier, sur téléphone compatible (aucune vibration sur le navigateur). Logo toujours droit et fixe. Trajet raccourci lorsque le réglage système demande moins de mouvement.
- Après une réponse, « Refaire la sélection » rouvre le parcours en essai privé. Le score et les tags de cet essai restent dans l’écran : aucune deuxième réponse, aucun souvenir ni progression d’arbre ajoutés.
- Parcours collaborateur épuré en deux écrans fixes : météo, puis raisons facultatives. Contrôle serveur d’une réponse par jour, selon le fuseau Europe/Paris.
- Bouton « + Ma propre raison » : brouillon privé de 80 caractères maximum, non envoyé et effacé après la saisie. Seuls les tags prédéfinis sont transmis.
- Invitation privée après trois « Très mal » sur trois jours distincts dans les 30 derniers jours, comptés sur cet appareil uniquement. Aucune alerte individuelle au manager. Le message proposé doit être copié et envoyé volontairement par l’utilisateur.
- Journal et réponse créés dans une transaction ; contrainte unique pour bloquer les requêtes concurrentes.
- Vue manager : un graphique sur 30 jours, moyennes masquées sous 5 réponses et résumé texte.
- Participation collective sur 7 jours, masquée sous 5 participants distincts.
- Policy `global::is-manager` sur les statistiques et les écritures d'actions : compte actif, rôle manager et équipe effectivement gérée. Aucune route de lecture des réponses ou journaux.
- Profil personnel : carte météo quotidienne inspirée des souvenirs BeReal, calendrier des 30 derniers jours et tendance personnelle sur 7 jours. Stockage sécurisé par compte sur mobile ; mémoire de session uniquement sur le web réel. Aucun nouvel historique individuel côté serveur ou manager.
- Confidentialité, aide et déconnexion regroupées dans le profil, sans les anciennes pages ni barre d’onglets. Effacement local du récap et du compteur privé après confirmation.
- Purge des réponses et journaux après 45 jours par défaut, au démarrage et quotidiennement à 3 h, avec conservation séparée des agrégats.

## Rapports et accompagnement

Le profil contient un arbre personnel qui grandit au fil des journées partagées, des rapports journaliers et des bilans glissants sur 7 et 30 jours. Les professionnels et services d’accompagnement se configurent dans Strapi, par équipe, sans transmettre automatiquement les moods. Voir [la configuration et les règles de confidentialité](docs/rapports-jardin-accompagnement.md).

## Espaces manager

**Mon équipe** conserve le graphe collectif. **Pour moi** propose une météo de manager strictement privée, son jardin, ses rapports, ses raisons adaptées et son accompagnement. **Agir ensemble** permet de préparer une discussion, publier et suivre une action collective, puis recueillir un bilan anonyme après sa réalisation. Voir [les parcours, règles de confidentialité et nouvelles routes](docs/espaces-manager.md).

## Retours tactiles

Signature de molette sur l’arc, sélection douce des raisons, double confirmation et célébration des étapes du jardin. Réglage et bouton d’essai dans le profil sur téléphone. Voir [les signatures et leur validation](docs/retours-tactiles.md).

## Structure

```text
mobile/App.tsx                       Parcours et écrans
mobile/src/weather.ts                Météos Phosphor
mobile/src/tagIcons.ts               Rendu des icônes Lucide choisies dans Strapi
mobile/src/theme.ts                  Palette et typographie
mobile/src/components/MoodChart.tsx   Graphique accessible
mobile/src/components/MoodDial.tsx    Arc et transitions météo
mobile/src/components/MoodFlow.tsx    Parcours en deux étapes et fenêtres privées
mobile/src/support.ts                Compteur privé sur l’appareil
mobile/src/strapi.ts                  Client API et stockage du jeton
backend/src/api/                     Modèles, routes et contrôleurs
backend/src/lib/                     Validation, seed et conservation
backend/src/policies/                Contrôle d'accès manager
backend/src/extensions/              Relations utilisateur et correctif serveur Lucide
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

Le script compile le serveur, démarre l’instance isolée, exécute les tests backend puis le client du front contre cette même API et supprime uniquement sa base temporaire. Le test du client vérifie connexion, session, saisie persistée, doublon refusé, rôles et graphe collectif. Il nécessite les dépendances de `mobile` et `backend`. Voir `docs/validation.md`.

Le porteur du projet confirme le 20 octobre 2026 que les tests et les essais sur téléphone fonctionnent. Le correctif du listing serveur Lucide et la policy manager sont également couverts par les vérifications automatisées du backend.

## Limites avant utilisation réelle

Le MVP limite ce que voit le manager ; ce n’est pas une preuve d’anonymat absolu. Les accès administrateur, horodatages, identifiants internes et journaux techniques peuvent permettre des recoupements. Une validation de confidentialité et de conformité reste nécessaire avant une utilisation avec de vrais salariés. Voir `docs/conception.md`.

Le compteur d’accompagnement est isolé par compte à l’aide d’une clé opaque délivrée dans `/api/session`. Sur mobile, il utilise le stockage sécurisé système. Sur le web réel, il reste en mémoire pendant la session et se réinitialise à la déconnexion ou au rechargement. Il ne synchronise pas les appareils et ne reconstitue pas les anciennes réponses. Les dates hors fenêtre sont écartées lors de la prochaine saisie. Ce dispositif d’accompagnement ne constitue pas une validation RGPD.

La revue des dépendances et la configuration HTTPS relèvent de la préparation d'un éventuel déploiement. Les notifications locales et l'export CSV ne sont pas intégrés. L'historique personnel existe et reste local à l'appareil.

## Références visuelles et techniques

- [ArtCraft — inspiration de la structure visuelle](https://getartcraft.com/apps) : contraste sombre, titres généreux, repères numérotés, filets et accents colorés. Aucun logo, visuel ou texte ArtCraft réutilisé.
- [Phosphor React Native](https://github.com/duongdev/phosphor-react-native)
- [Strapi Lucide Icons](https://github.com/shx08/strapi-lucide-icons) et [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native) : sélecteur et icônes des tags, [licence ISC et notices](docs/LUCIDE-LICENSE.txt).
- [Expo](https://docs.expo.dev/)
- [Strapi v5](https://docs.strapi.io/cms/quick-start)

## Revue de la nouvelle DA

La revue du portail manager, de la connexion et des parcours est détaillée dans [docs/revue-da.md](docs/revue-da.md). Le graphe reste unique sur trente jours, les journées masquées interrompent la courbe et la navigation par date expose uniquement les moyennes collectives autorisées.

## Profil et connexion — 15 octobre 2026

Le parcours simplifié et les limites du récap local sont décrits dans [docs/profil-personnel.md](docs/profil-personnel.md).
