# État du serveur Strapi — Éclaircie

Mis à jour le 20 octobre 2026.

## Opérationnel

- Strapi v5.57.0, Node.js 24, TypeScript et SQLite local.
- Initialisation reproductible avec `npm run backend:db:init`, sans serveur HTTP ni comptes fictifs.
- Configuration locale générée avec secrets aléatoires, jamais versionnée.
- Modèles Team, Tag, MoodEntry, SubmissionLog, DailyAggregate, TeamAction et ActionResponseLog ; relation User → Team et contacts d'accompagnement par équipe.
- Rôles Collaborateur / Manager et permissions métier initialisés au démarrage.
- Connexion JWT, route de session, saisie quotidienne et statistiques sur 30 jours.
- Policy `global::is-manager` sur les statistiques et les écritures d'actions ; vérification du compte actuel, de son rôle et de l'équipe gérée.
- Tags administrables par public, activation et ordre ; catalogue chargé par l'app depuis `/api/mood-tags`.
- Sélecteur `strapi-lucide-icons`, rendu Lucide natif et migration des anciennes icônes. Service de listing corrigé pour Node 24 par une extension versionnée du projet.
- Contrôle du score, des tags, du rôle, de l’équipe et de la date côté serveur.
- Journal de déduplication et réponse créés dans une transaction ; doubles requêtes refusées.
- Statistiques collectives uniquement, masquées sous 5 réponses.
- Purge des réponses/journaux après 45 jours et agrégats conservés séparément.
- Seed local optionnel : un manager, huit collaborateurs et historique fictif.
- Application mobile et web reliée au serveur ; les raccourcis de test utilisent les comptes Strapi fictifs, sans mode démo autonome. L'adresse de l'API est déduite de l'hôte en développement ou renseignée par `EXPO_PUBLIC_API_URL`.
- Actions collectives : création, avancement, bilan anonyme et résultats visibles après clôture, à partir de cinq retours.
- Clé opaque dans la session pour isoler le compteur privé local par compte. Le serveur ne calcule ni ne transmet d’alerte individuelle au manager ; les raisons personnelles ne sont pas envoyées.

## Vérifié

Compilation TypeScript et de l'administration, démarrage, règles métier, rôles, policy manager, saisies invalides, envois concurrents, seuil d'anonymat et absence de réponses individuelles dans les statistiques. Le catalogue de tags est testé après ajout, renommage et désactivation, et le service Lucide est exercé par une requête HTTP sur une base isolée. Le client du front est aussi testé contre cette API.

Les parcours ont été contrôlés dans le navigateur. Le porteur du projet confirme le 20 octobre 2026 que les tests et les essais sur téléphone fonctionnent. Détails et commandes dans [validation.md](validation.md).

## Périmètre local finalisé

La création des comptes et équipes, leurs relations, les droits, les tags, les icônes et les contacts sont documentés dans [le guide d'administration](administration-strapi.md). Les sauvegardes sont hors périmètre ici, par décision du porteur du projet du 20 octobre 2026.

## À finaliser avant un usage réel

Validation de confidentialité et de conformité, traitement des recoupements par métadonnées et journaux, revue des dépendances et configuration HTTPS de l’hébergement. Les accès administrateur restent distincts des restrictions manager. Le MVP ne garantit pas un anonymat absolu face à un administrateur de base de données.

## Démarrer depuis la racine

```sh
npm run backend:install
npm run backend:db:init
npm run backend:dev
```

Pour une démonstration avec comptes et historique fictifs : remplacer la dernière commande par `npm run backend:demo`.

Administration : http://localhost:1337/admin. Les identifiants de démonstration figurent dans le README. Contrat détaillé dans `docs/api.md`.
