# Base de données Strapi

## Initialisation locale

Avec Node.js 24, depuis la racine du dépôt :

```sh
npm run backend:install
npm run backend:db:init
```

La commande génère le fichier local `backend/.env` s'il manque, compile le backend et charge Strapi sans démarrer de serveur HTTP. Strapi synchronise les tables SQLite dans `backend/.tmp/data.db` par défaut. Le bootstrap initialise les rôles Collaborateur/Manager, les permissions et le catalogue de tags. Aucun compte ni historique fictif n'est ajouté par cette commande.

La commande peut être relancée ; elle réutilise la base et les référentiels existants. Le bootstrap applique également la purge configurée des données expirées (45 jours par défaut). Arrêter le serveur avant de l'exécuter sur la même base. Le fichier SQLite et les secrets locaux ne sont pas versionnés ; les schémas et le bootstrap permettent de recréer la base.

Pour lancer ensuite l'API : `npm run backend:dev`. Pour ajouter volontairement les comptes et l'historique de démonstration : `npm run backend:demo`.

## Version de Node et pilote SQLite

Le projet utilise Node.js 24 (`.nvmrc` et `engines`). Le pilote natif `better-sqlite3` doit être installé ou recompilé avec la même version majeure de Node que celle utilisée pour lancer Strapi.

Sur le Mac de développement, Node 24 est installé avec Homebrew. Pour l'activer dans le terminal courant et relancer l'initialisation depuis la racine :

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
node --version
npm run backend:db:init
```

Si `ERR_DLOPEN_FAILED` persiste après activation de Node 24, exécuter `npm rebuild --prefix backend better-sqlite3` puis relancer l'initialisation. Avec nvm, `nvm use` active la version indiquée par `.nvmrc`.

## Modèle attendu

| Entité | Champs métier | Relations |
| --- | --- | --- |
| User (Users & Permissions) | username, email, mot de passe et rôle gérés par le plugin | team → Team ; role → rôle du plugin |
| Team | name obligatoire | manager → User |
| Tag | label obligatoire et unique (80 caractères maximum), audience, icon, enabled, position | Référencé par MoodEntry |
| MoodEntry | score entier obligatoire de 1 à 5 ; day obligatoire, date sans heure | team → Team ; tags → Tag, plusieurs et optionnels |
| SubmissionLog | day obligatoire ; deduplicationKey obligatoire, unique et privée | user → User, relation privée |

La relation User → Team est ajoutée par `backend/src/extensions/users-permissions/strapi-server.ts`. Les autres modèles sont définis dans `backend/src/api/*/content-types/*/schema.json`. Les brouillons et la publication sont désactivés pour ces collections.

`MoodEntry` ne possède aucune relation vers User ou SubmissionLog. Le contrôleur déduit l'équipe et le jour côté serveur. `SubmissionLog` bloque les doubles saisies avec une clé HMAC calculée à partir du couple utilisateur/jour ; son unicité en base protège aussi contre les envois concurrents. Il ne stocke ni score ni tags.

Des index SQL uniques explicites protègent `SubmissionLog.deduplicationKey`, `DailyAggregate.aggregateKey` et `Tag.label`. L'option d'attribut `unique: true` de Strapi v5 ne suffit pas ici à créer une contrainte SQL. Si une base existante contient des doublons, la synchronisation échoue au lieu de supprimer silencieusement des données.

Les tags initiaux du collaborateur sont Charge, Ambiance, Sens, Équilibre, Reconnaissance et Outils. Ceux du manager sont Arbitrages, Moyens, Conflits, Objectifs, Reconnaissance et Soutien hiérarchique. Reconnaissance appartient aux deux publics. Cette initialisation et la migration des six anciens tags ne s'exécutent qu'une fois, avec un marqueur en base : les tags renommés, désactivés ou supprimés ne sont pas réinitialisés aux redémarrages suivants.

Dans **Content Manager → Tag**, l'administrateur peut ajouter ou modifier les libellés, choisir `audience` (`collaborateur`, `manager`, `both`), l'icône dans le sélecteur **Lucide Icons** avec recherche et aperçu (`strapi-lucide-icons`), `enabled` et `position` (les plus petits nombres apparaissent en premier). Préférer la désactivation à la suppression pour conserver les relations historiques. Les anciens libellés déjà enregistrés dans l'historique privé de l'appareil restent lisibles.

Le champ `icon` est le custom field `plugin::strapi-lucide-icons.icon` et stocke un nom Lucide en kebab-case, par exemple `alarm-clock`. L'app le rend avec `lucide-react-native`. Les deux catalogues sont alignés sur la version 1.14.0. Les anciennes valeurs `chat` et `scales` sont migrées vers `message-circle` et `scale`, sans modifier les autres choix. Après installation des dépendances, redémarrer Strapi et recharger l'administration pour afficher le sélecteur. Lors d'un déploiement, reconstruire l'administration avec `npm --prefix backend run build`.

L'app recharge les tags à chaque ouverture de l'étape des raisons. Une liste vide ou une erreur ne produit aucune liste de secours codée en dur ; l'utilisateur peut envoyer sa météo sans tag. Une icône générique couvre les icônes non reconnues par une ancienne version de l'app.

Les réponses et les journaux n'ont pas de routes REST génériques de lecture. Les horodatages techniques Strapi ne sont pas exposés par les réponses métier.

## Agrégats et extensions existantes

`DailyAggregate` conserve, par équipe et par jour, `scoreSum` et `responseCount`. La clé privée unique `aggregateKey` évite les doublons équipe/jour. Cette collection permet de conserver les statistiques après la purge des réponses brutes. Le seuil de cinq réponses est appliqué par l'API avant de transmettre une moyenne au manager.

Le dépôt contient également les actions collectives (`TeamAction`, `ActionResponseLog`) et les contacts d'accompagnement de Team. Ces extensions sont conservées avec le modèle de base.

Les comptes, réponses et journaux sont des données locales ; ils ne font pas partie des fichiers à committer. Le contrat des routes est décrit dans `docs/api.md`.
