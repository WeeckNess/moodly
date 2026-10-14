# API Éclaircie

Toutes les routes métier exigent un JWT Strapi valide. Les rôles et permissions sont initialisés au démarrage. Aucun paramètre client ne permet de changer l’équipe consultée ou la date d’une saisie.

## POST /api/auth/local

Authentification native Users & Permissions :

```json
{ "identifier": "collaborateur1@eclaircie.test", "password": "EclaircieDemo2026!" }
```

Renvoie un JWT de 8 heures. L’auto-inscription publique est désactivée.

## GET /api/session

Compte avec rôle Moodly et équipe requis. Renvoie uniquement le prénom/nom d’affichage, le rôle, le nom de l’équipe, le jour courant Europe/Paris et un booléen indiquant si le compte a répondu aujourd’hui. Aucune note n’est renvoyée. Une `privateSupportKey` opaque, propre au compte, permet de séparer les compteurs d’accompagnement sur un appareil partagé ; elle ne contient aucune réponse et n’est jamais exposée dans les statistiques manager.

## POST /api/mood-entries

Rôle Collaborateur uniquement :

```json
{ "data": { "score": 4, "tags": ["Charge", "Ambiance"] } }
```

Score entier 1–5, tags fermés. Les champs supplémentaires sont refusés. L’équipe et la date sont déduites côté serveur. Une transaction crée le journal unique utilisateur/jour, la réponse sans relation User et la mise à jour de l’agrégat collectif. Réponse minimale :

```json
{ "data": { "submitted": true, "day": "2026-10-14" } }
```

201 : saisie créée. 400 : contenu invalide. 401/403 : accès refusé. 409 : réponse déjà enregistrée. Les réponses ne sont jamais retournées au client.

## GET /api/team-stats?days=30

Rôle Manager uniquement. La fenêtre est fixée à 30 jours. Seule l’équipe affectée au compte et dont il est le manager est accessible, même si le client ajoute un paramètre `team`.

```json
{
  "data": [{ "day": "2026-10-14", "average": null }],
  "meta": {
    "team": "Studio · Démonstration",
    "threshold": 5,
    "participation": 88,
    "maskedDays": 5
  }
}
```

La réponse réelle contient 30 dates. `average` vaut `null` sous 5 réponses ou sans données. Aucun nombre exact de réponses par jour, auteur, tag individuel ou horodatage technique n’est exposé. Le taux de participation porte sur les 7 derniers jours et vaut `null` sous 5 participants distincts.

## Accès fermés

Aucune route REST générique de lecture, modification ou suppression de MoodEntry, SubmissionLog ou DailyAggregate. Les comptes applicatifs n’ont pas d’accès à l’administration Strapi.
