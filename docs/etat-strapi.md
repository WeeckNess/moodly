# État du serveur Strapi — Éclaircie

Mis à jour le 14 octobre 2026.

## Opérationnel

- Strapi v5.57.0, TypeScript et SQLite local.
- Configuration locale générée avec secrets aléatoires, jamais versionnée.
- Modèles Team, Tag, MoodEntry, SubmissionLog et DailyAggregate ; relation User → Team.
- Rôles Collaborateur / Manager et permissions métier initialisés au démarrage.
- Connexion JWT, route de session, saisie quotidienne et statistiques sur 30 jours.
- Contrôle du score, des tags, du rôle, de l’équipe et de la date côté serveur.
- Journal de déduplication et réponse créés dans une transaction ; doubles requêtes refusées.
- Statistiques collectives uniquement, masquées sous 5 réponses.
- Purge des réponses/journaux après 45 jours et agrégats conservés séparément.
- Seed local optionnel : un manager, huit collaborateurs et historique fictif.
- Application mobile reliée au serveur ; mode démo autonome distinct.

## Vérifié

Compilation TypeScript, démarrage, règles métier, rôles, saisies invalides, envois concurrents, seuil d’anonymat et absence de réponses individuelles dans les statistiques. Parcours de connexion et de saisie contrôlé dans la version web au format téléphone.

## À finaliser avant un usage réel

Validation de confidentialité et de conformité, traitement des recoupements par métadonnées et journaux, revue des dépendances et configuration HTTPS de l’hébergement. Les accès administrateur restent distincts des restrictions manager. Le MVP ne garantit pas un anonymat absolu face à un administrateur de base de données.

## Démarrer depuis la racine

```sh
npm run backend:install
npm run backend:demo
```

Sans ajout des comptes fictifs : `npm run backend:dev`.

Administration : http://localhost:1337/admin. Les identifiants de démonstration figurent dans le README. Contrat détaillé dans `docs/api.md`.
