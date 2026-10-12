# Contrat API cible — à implémenter

Ce fichier décrit les routes métier à développer. Elles ne sont pas livrées par le starter.

## POST /api/auth/local

Route native Users & Permissions : `{ "identifier": "…", "password": "…" }` → jeton JWT et utilisateur. Résoudre le rôle et l’équipe depuis le serveur ; ne jamais faire confiance au rôle choisi dans l’interface.

## POST /api/mood-entries

Collaborateur authentifié seulement. Corps cible : `{ "data": { "score": 4, "tags": ["Charge"] } }`.

- Valider score entier 1–5 et tags existants (le contrôleur résout leurs relations).
- Déduire l’équipe et la date depuis le serveur, avec une convention de fuseau horaire définie.
- Créer SubmissionLog avec une clé unique utilisateur/jour et MoodEntry dans la même transaction.
- Ne jamais mettre de relation utilisateur dans MoodEntry.
- Aucun texte libre, aucun horaire dans la réponse. Renvoi minimal de confirmation.
- Retourner 409 si une réponse existe déjà ce jour-là.
- Garder la lecture des saisies et des journaux fermée pour tous les utilisateurs de l’app.

## GET /api/team-stats?days=30

Manager authentifié seulement, uniquement pour sa propre équipe. Le serveur renvoie les 30 dates, même sans réponse, et un résultat agrégé :

```json
{ "data": [{ "day": "2026-10-12", "average": null }] }
```

Moyenne nulle lorsque moins de 5 réponses ; ne jamais renvoyer les réponses individuelles ni les métadonnées permettant un recoupement. L’interface ne doit pas relier les jours masqués.

## Confidentialité à finaliser

Définir conservation et purge. Traiter les horodatages automatiques Strapi, les logs de requêtes, les accès administrateur et les possibilités de recoupement entre journal et saisie. La séparation des tables et le seuil seuls ne prouvent pas un anonymat garanti.
