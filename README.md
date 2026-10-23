<img src="mobile/assets/eclaircie-icon.svg" width="80" alt="Icône Éclaircie">

# Moodly · Éclaircie

### Prendre la météo du collectif, sans transformer chaque ressenti en suivi individuel.

**React Native · Expo · TypeScript · Strapi 5 · SQLite / PostgreSQL**

Éclaircie est une application mobile et web de partage du moral en équipe. Chaque collaborateur exprime sa météo du jour, de l’orage au soleil. Le manager dispose d’une vision collective pour ouvrir la discussion et suivre des actions d’équipe.

Le projet associe une **interface gestuelle et animée**, un **espace personnel conservé sur l’appareil** et un **backend qui limite l’accès aux résultats collectifs**. Moodly est le nom du projet ; Éclaircie est l’identité de l’application.

## Deux usages, une même application

| Collaborateur | Manager |
| --- | --- |
| Partager sa météo en deux étapes. | Consulter la tendance collective sur 30 jours. |
| Ajouter des raisons prédéfinies facultatives. | Suivre la participation de l’équipe. |
| Retrouver son récap personnel et son jardin. | Préparer et suivre des actions collectives. |
| Choisir volontairement de demander de l’aide. | Utiliser aussi un espace personnel privé. |

## Ce qui fait le projet

- **Une météo expressive** : cinq états, un sélecteur en arc, transitions SVG, retours tactiles sur téléphone et prise en compte de la réduction du mouvement.
- **Un rituel quotidien simple** : une réponse collective par jour, contrôlée côté serveur selon le fuseau Europe/Paris.
- **Un jardin personnel** : progression visuelle au fil des journées partagées, calendrier et bilans personnels.
- **Une lecture collective** : les moyennes sont masquées sous cinq réponses ; la participation utilise également un seuil de cinq personnes distinctes.
- **Des actions concrètes** : préparer une discussion, publier une action d’équipe et recueillir un bilan après sa réalisation.
- **Une administration métier** : comptes, équipes, rôles, tags et contacts d’accompagnement gérés dans Strapi.

## Architecture et données

```text
Application Expo / React Native
             │ API
             ▼
Backend Strapi · comptes, rôles et règles métier
             │
             ▼
SQLite en local / PostgreSQL pour l’hébergement
```

L’historique personnel reste sur l’appareil : stockage sécurisé sur mobile, mémoire de session sur le web. Les réponses collectives sont enregistrées sans relation directe vers leur auteur ; un journal de participation séparé contrôle les doublons.

Cela **ne constitue pas une garantie d’anonymat absolu** : les accès administrateur et les données techniques peuvent permettre des recoupements. Les limites sont détaillées dans la [documentation de conception](docs/conception.md).

## Lancer le projet

Prérequis : **Node.js 24**, npm et, pour le mobile, Expo Go compatible avec le SDK 57 ou un simulateur.

```sh
git clone https://github.com/WeeckNess/moodly.git
cd moodly
npm ci
npm run backend:install
npm run backend:db:init
npm run backend:dev
```

L’administration Strapi s’ouvre sur **http://localhost:1337/admin**. Créer le compte d’administration, puis les équipes et les comptes applicatifs selon le [guide d’administration](docs/administration-strapi.md). Les comptes Strapi d’administration sont distincts des comptes de l’app.

Dans un second terminal, depuis la racine :

```sh
npm start
```

Scanner le QR code avec Expo Go, ou lancer `npm run web`. En réseau local, le téléphone et le serveur doivent être accessibles sur le même réseau. Pour une API distante, configurer `mobile/.env` à partir de `mobile/.env.example` avec `EXPO_PUBLIC_API_URL` ; aucun secret serveur ne doit y figurer.

## Présenter une démonstration

Un environnement de démonstration **séparé du backend réel** existe, avec des équipes et des historiques fictifs. Les accès ne sont pas publiés dans ce dépôt. La procédure et les précautions de peuplement figurent dans le [guide de démonstration](docs/environnement-demo.md).

Le démarrage normal de Strapi initialise les schémas, les rôles et les tags : il ne crée pas de comptes ou d’historiques fictifs. Les exemples de présentation relèvent de l’environnement de démo dédié ; les tests API utilisent leur propre base temporaire.

## Structure

```text
mobile/          Application, composants et client API
backend/         Strapi, modèles, contrôleurs et permissions
backend/tests/   Tests métier et d’intégration
mobile/tests/    Tests du client et des interactions
docs/            Conception, API, administration et déploiement
```

## Vérifications disponibles

```sh
npm run typecheck
npm test
npm run backend:test
npm run backend:test:api
npm run build --prefix backend
```

Les tests API démarrent une instance isolée avec une base SQLite temporaire. Un export ou un build ne remplace pas un essai sur téléphone.

## Documentation

- [Guide de développement complet](DEVELOPMENT.md)
- [Administration des équipes et des comptes](docs/administration-strapi.md)
- [Modèle de données](docs/modele-donnees.md) et [contrat API](docs/api.md)
- [Parcours manager](docs/espaces-manager.md)
- [Validation et tests](docs/validation.md)
- [Déploiement](docs/deploiement-vercel.md) et [démonstration isolée](docs/environnement-demo.md)

## Statut et crédits

Le projet est en évolution. La confidentialité, les accès et l’exploitation doivent être validés avant toute utilisation avec de vrais salariés. Aucun diagnostic médical ni alerte individuelle automatique au manager n’est proposé.

Les icônes utilisent notamment Phosphor et Lucide ; les notices sont conservées dans le dépôt. La présence de notices tierces ne vaut pas licence globale sur l’ensemble du projet.

Projet présenté dans le portfolio de **Thom Legros — [WeeckNess](https://github.com/WeeckNess)**.
