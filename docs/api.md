# API Éclaircie

Toutes les routes métier exigent un JWT Strapi valide. Les rôles et permissions sont initialisés au démarrage. Aucun paramètre client ne permet de changer l’équipe consultée ou la date d’une saisie.

La policy `global::is-manager` est attachée à `GET /api/team-stats`, `POST /api/team-actions` et `PATCH /api/team-actions/:documentId`. Elle relit le compte, refuse les comptes bloqués ou sans rôle Manager et exige que `User.team` corresponde à une équipe dont `Team.manager` désigne ce compte. Les contrôleurs conservent leurs vérifications métier. Le refus de policy produit un statut 403.

## POST /api/auth/local

Authentification native Users & Permissions :

```json
{ "identifier": "collaborateur1@eclaircie.test", "password": "EclaircieDemo2026!" }
```

Renvoie un JWT de 8 heures. L’auto-inscription publique est désactivée.

## GET /api/session

Compte avec rôle Moodly et équipe requis. Renvoie uniquement le prénom/nom d’affichage, le rôle, le nom de l’équipe, le jour courant Europe/Paris et un booléen indiquant si le compte a répondu aujourd’hui. Aucune note n’est renvoyée. Une `privateSupportKey` opaque, propre au compte, permet de séparer les compteurs d’accompagnement sur un appareil partagé ; elle ne contient aucune réponse et n’est jamais exposée dans les statistiques manager.

## POST /api/mood-entries

Les tags proposés proviennent de `GET /api/mood-tags`, pas d'une liste dans le front. Lors de la saisie, le serveur accepte uniquement les libellés actuellement actifs pour les collaborateurs (ou les deux publics), jusqu'à 20 choix. Un libellé inexistant, renommé, désactivé ou réservé au manager est refusé avec un statut 400.

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

## GET /api/mood-tags

JWT et compte affecté à une équipe requis. Renvoie le catalogue actif correspondant au rôle du compte, trié par `position` puis par libellé. Les paramètres client ne permettent pas de changer le public consulté. Exemple :

```json
{ "data": [{ "id": "documentId-du-tag", "label": "Charge", "icon": "briefcase" }] }
```

La création, la modification, la désactivation et la suppression des tags passent par l'administration Strapi. Les rôles applicatifs disposent uniquement de cette route de lecture. Les tags du manager servent à sa météo privée et ne sont pas transmis au serveur lors de sa saisie.

`icon` contient le nom Lucide choisi avec le plugin `strapi-lucide-icons`, par exemple `message-circle`, `scale` ou `alarm-clock`. La valeur est une chaîne, jamais du code SVG ni du HTML.

## Accès fermés

Aucune route REST générique de lecture, modification ou suppression de MoodEntry, SubmissionLog ou DailyAggregate. Les comptes applicatifs n’ont pas d’accès à l’administration Strapi.

## Actions collectives

| Route | Accès |
| --- | --- |
| `GET /api/team-actions` | Collaborateurs et managers, actions de leur équipe. |
| `POST /api/team-actions` | Manager de l'équipe, policy `is-manager`. |
| `PATCH /api/team-actions/:documentId` | Manager de l'équipe, policy `is-manager`, transitions prévues uniquement. |
| `POST /api/team-actions/:documentId/feedback` | Collaborateur, une réponse anonyme par action après sa réalisation. |

Les contrats et la période de bilan figurent dans [espaces-manager.md](espaces-manager.md).

## Catalogue technique Lucide

Le service du plugin associé à `GET /api/strapi-lucide-icons/icons` renvoie `{ "icons": ["alarm-clock", "..."] }` lorsqu'une permission explicite lui est accordée. Une extension du projet corrige l'import du catalogue `.mjs` sous Node 24 et conserve le normaliseur du plugin. Le bootstrap n'accorde cette route ni aux comptes Public, ni aux rôles applicatifs ; le front utilise uniquement `/api/mood-tags`. Aucune permission supplémentaire n'est nécessaire pour le sélecteur de l'administration.

Pour créer et affecter les comptes correctement, voir [le guide d'administration](administration-strapi.md).
