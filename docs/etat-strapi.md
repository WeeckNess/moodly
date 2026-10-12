# État du serveur Strapi — Moodly

Mis à jour le 12 octobre 2026.

Le serveur dispose d’une base technique prête à démarrer. La logique métier du MVP reste à développer. L’application mobile fonctionne actuellement en mode démo et ne transmet aucune réponse à Strapi.

## Ce qui est fait

- Installation de **Strapi v5.57.0** avec TypeScript.
- Configuration d’une base **SQLite** pour le développement local.
- Fichier `.env.example` pour préparer la configuration locale.
- Plugin **Users & Permissions** installé pour la future authentification.
- Compilation et démarrage du serveur vérifiés.

### Modèles de données créés

| Modèle | Contenu | Objectif |
| --- | --- | --- |
| `Team` | Nom de l’équipe, relation vers son manager | Regrouper les collaborateurs |
| `Tag` | Libellé unique | Catégoriser les raisons du moral |
| `MoodEntry` | Score de 1 à 5, date, équipe, tags | Stocker une réponse sans relation vers son auteur |
| `SubmissionLog` | Utilisateur, date, clé de déduplication unique | Préparer le blocage d’une deuxième réponse dans la journée |

Les modèles existent, mais aucune route métier de saisie ou de statistiques n’est encore implémentée. La présence d’une clé unique dans le journal ne suffit pas à rendre le blocage opérationnel.

## Ce qui reste à faire

1. Configurer les rôles **Collaborateur** et **Manager**, leurs permissions et l’affectation des utilisateurs à une équipe.
2. Connecter la véritable connexion mobile à Strapi et gérer le jeton de session.
3. Développer la route de saisie : valider le score et les tags, déduire l’équipe et la date côté serveur, créer le journal et la réponse dans une même transaction.
4. Bloquer les doubles réponses, y compris lors de deux requêtes simultanées.
5. Développer la route des statistiques : 30 jours de moyennes, uniquement pour l’équipe du manager, avec des valeurs masquées sous **5 réponses**.
6. Fermer l’accès aux réponses individuelles et aux journaux pour les utilisateurs de l’application.
7. Définir les durées de conservation et la purge, examiner les horodatages et les logs techniques pour éviter les recoupements.
8. Ajouter des données fictives de démonstration et vérifier les accès, la confidentialité et le fonctionnement sur téléphone.

**L’anonymat n’est pas encore garanti par cette base.** Il dépend des contrôleurs, des permissions et de la gestion des métadonnées qui restent à implémenter.

## Démarrage local

Depuis la racine du dépôt `moodly-starter` :

```sh
npm run backend:install
```

Lors de la première configuration, si `backend/.env` n’existe pas :

```sh
cp backend/.env.example backend/.env
```

Remplacer les valeurs d’exemple par des secrets aléatoires distincts, puis lancer :

```sh
npm run backend:dev
```

Administration : http://localhost:1337/admin. À la première ouverture, créer un compte administrateur. Ce compte est distinct des futurs comptes collaborateur et manager.

## Documents associés

- `docs/api.md` : contrat des routes métier à développer.
- `README.md` : installation et état général du projet.
