# Administration Strapi — Éclaircie

État au 20 octobre 2026. Ce guide couvre le MVP local du projet.

## Démarrage

Utiliser Node.js 24 (`nvm use` depuis la racine si nvm est installé). Sur le Mac de développement, `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` active la version Homebrew adaptée.

Depuis la racine :

```sh
npm run backend:install
npm run backend:db:init
npm run backend:dev
```

Ouvrir [l'administration](http://localhost:1337/admin). À la première ouverture, créer le compte administrateur. Ses identifiants sont distincts des comptes de l'app ; il n'existe pas de compte administrateur de démonstration fourni par le projet.

`backend:db:init` initialise les schémas, rôles et tags puis se termine. `backend:dev` maintient le serveur en fonctionnement. Les secrets sont dans `backend/.env` et la base locale dans `backend/.tmp/data.db` ; ces fichiers sont exclus de Git. Voir [le modèle de données](modele-donnees.md).

## Créer une équipe et ses comptes

L'inscription publique est désactivée. Les comptes sont créés dans **Content Manager → User** (collection du plugin Users & Permissions), et non dans la gestion des administrateurs.

1. Dans **Content Manager → Team**, créer l'équipe avec son `name`. Laisser temporairement `manager` vide.
2. Dans **User**, créer le compte manager : `username`, `email`, mot de passe, `provider = local`, `confirmed = true`, `blocked = false`, rôle **Manager**, et relation `team` vers cette équipe.
3. Retourner dans **Team** et renseigner `manager` avec ce compte, puis enregistrer.
4. Créer les collaborateurs dans **User** avec le rôle **Collaborateur**, `provider = local`, `confirmed = true`, `blocked = false` et la même relation `team`.
5. Se connecter à l'app avec ces comptes. Le rôle et l'équipe affichés proviennent de Strapi.

Ne pas utiliser les rôles génériques **Authenticated** ou **Public** pour les comptes Moodly. Pour consulter les statistiques et publier des actions, les deux liens doivent être cohérents : `User.team` désigne l'équipe et `Team.manager` désigne le même utilisateur. Le MVP rattache chaque compte à une seule équipe.

Un compte sans équipe ne peut pas utiliser les routes métier. Un manager non désigné dans `Team.manager` ne peut pas accéder aux statistiques ni créer ou modifier une action. Pour suspendre un compte, passer `blocked` à `true`. Après un changement de rôle ou d'équipe, se déconnecter et se reconnecter pour actualiser l'interface ; les contrôles serveur relisent déjà le compte actuel.

## Droits applicatifs

Le bootstrap crée les rôles et les permissions métier nécessaires. La policy `global::is-manager` protège `GET /api/team-stats`, `POST /api/team-actions` et `PATCH /api/team-actions/:documentId`. Elle vérifie la session, le rôle manager actuel, l'absence de blocage et l'affectation à l'équipe gérée. Les contrôleurs conservent également leurs contrôles métier.

Les collaborateurs et managers peuvent lire le catalogue de tags et les actions de leur équipe. Seuls les collaborateurs envoient une déclaration collective et un bilan d'action. Les comptes applicatifs ne disposent d'aucune lecture brute des réponses, des journaux ou des agrégats. Conserver ces restrictions dans **Settings → Users & Permissions → Roles**.

## Gérer les raisons et leurs icônes

Dans **Content Manager → Tag**, créer ou modifier :

| Champ | Utilisation |
| --- | --- |
| `label` | Libellé unique, 80 caractères maximum. |
| `audience` | `collaborateur`, `manager` ou `both`. |
| `icon` | Bouton **Browse** du sélecteur Lucide : recherche, aperçu puis choix de l'icône. |
| `enabled` | Active ou retire le tag des choix proposés. |
| `position` | Ordre croissant d'affichage ; le libellé départage les égalités. |

Enregistrer les changements. L'app recharge le catalogue à chaque ouverture de l'écran des raisons ; aucune recompilation n'est nécessaire pour un choix présent dans le catalogue embarqué. Préférer la désactivation à la suppression afin de conserver les relations historiques. Les tags supprimés ou renommés ne sont pas recréés au redémarrage. Une liste vide permet toujours de déclarer son moral sans tag.

`strapi-lucide-icons` et les catalogues `lucide-react` / `lucide-react-native` sont alignés sur 1.14.0. L'extension `backend/src/extensions/strapi-lucide-icons/strapi-server.ts` corrige le service serveur en chargeant le catalogue via son chemin `.mjs`, compatible avec Node 24, sans modifier le paquet installé. Elle conserve la normalisation du plugin. Sa route technique de listing n'est pas accordée aux rôles applicatifs : l'app utilise `/api/mood-tags`.

## Configurer l'accompagnement

Dans **Content Manager → Team → supportContacts**, renseigner les interlocuteurs de l'équipe et leurs coordonnées. Les URL de réservation doivent utiliser HTTPS. La liste est transmise dans la session de cette équipe. Aucun mood ni rapport personnel n'est envoyé automatiquement à ces contacts. Voir [rapports, jardin et accompagnement](rapports-jardin-accompagnement.md).

## Données de démonstration et conservation

`npm run backend:demo` démarre le serveur avec un seed explicite : une équipe fictive, un manager, huit collaborateurs et 29 jours d'historique. Les comptes et mots de passe de démonstration figurent dans le [README](../README.md). Un démarrage normal n'ajoute pas ces données. Le seed est interdit en production et ne réinitialise pas les mots de passe existants.

Les réponses et journaux de participation sont purgés au démarrage et chaque jour à 3 h, fuseau Europe/Paris, après 45 jours par défaut. `MOODLY_RETENTION_DAYS` peut modifier cette durée avec un minimum de 30 jours. Les agrégats sont conservés séparément. L'historique personnel et la météo privée du manager restent sur l'appareil.

Les sauvegardes sont hors périmètre de cette version locale, conformément à la décision du porteur du projet du 20 octobre 2026.

## Validation

Les commandes reproductibles et leur couverture figurent dans [validation.md](validation.md). Le porteur du projet confirme le 20 octobre 2026 que les tests et les essais sur téléphone fonctionnent. Ces essais ne sont donc pas une tâche restante du périmètre actuel.
