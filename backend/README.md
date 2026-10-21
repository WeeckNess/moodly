# Backend Strapi — Éclaircie

Strapi 5.57.0, Node.js 24, TypeScript et SQLite pour le MVP local Moodly.

## Démarrer depuis la racine du dépôt

```sh
npm run backend:install
npm run backend:db:init
npm run backend:dev
```

L'administration est disponible sur [localhost:1337/admin](http://localhost:1337/admin). Le compte administrateur est distinct des comptes de l'app. La commande d'initialisation se termine après synchronisation ; le serveur de développement reste actif.

Les données fictives sont interdites dans la base applicative. Les fixtures restent disponibles uniquement via `npm run backend:test:api`, dans une base temporaire supprimée après les tests. Créer les comptes et les équipes réels dans l’administration Strapi.

## Fonctionnement

- Connexion JWT, rôles Collaborateur et Manager et équipe résolus côté serveur.
- Une déclaration quotidienne sans relation vers son auteur ; journal de participation séparé.
- Statistiques collectives sur 30 jours, masquées sous cinq réponses.
- Policy `global::is-manager` sur les statistiques et les écritures d'actions collectives.
- Catalogue de tags administrable avec sélecteur Lucide et service serveur corrigé pour Node 24.
- Purge des réponses et journaux après 45 jours par défaut ; agrégats conservés séparément.

Les sauvegardes sont hors périmètre ici, selon la décision du porteur du projet du 20 octobre 2026. Les tests et les essais sur téléphone sont confirmés fonctionnels par celui-ci à cette date.

## Documentation et vérifications

- [Guide d'administration : comptes, équipes, rôles, tags et contacts](../docs/administration-strapi.md).
- [Modèle de données et initialisation](../docs/modele-donnees.md).
- [Contrat API](../docs/api.md).
- [État du backend](../docs/etat-strapi.md).
- [Validation et commandes de test](../docs/validation.md).

Depuis la racine, `npm run backend:test` vérifie les règles métier et la policy. `npm run backend:test:api` compile le backend et l'administration, démarre une API sur une base fictive temporaire, vérifie aussi le client du front et ferme cette instance. Installer les dépendances de `mobile` avant ce dernier contrôle.

Pour une compilation seule : `npm --prefix backend run build`. Les secrets `.env`, la base `.tmp/data.db` et les dépendances ne sont pas versionnés.
