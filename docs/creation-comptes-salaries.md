# Créer un compte salarié depuis l’espace manager

Le bouton **Ajouter un salarié**, sous les onglets de l’espace manager, ouvre un formulaire avec le nom complet et l’adresse e-mail professionnelle.

Strapi crée le compte avec le rôle `collaborateur`, dans l’équipe gérée par le manager connecté. Il génère un mot de passe initial aléatoire, affichable dans la confirmation. Le manager transmet les identifiants directement au salarié ; aucun e-mail automatique n’est envoyé. Le mot de passe initial n’est plus consultable dans l’application après fermeture de la confirmation. Il n’expire pas automatiquement, mais son remplacement est obligatoire à la première connexion. La fenêtre demande le mot de passe initial, un nouveau mot de passe (12 caractères minimum) et sa confirmation. Elle permet de se déconnecter, sans passer cette étape. Le tutoriel ne démarre qu’après le changement.

Le salarié se connecte avec son adresse et ce mot de passe initial, puis choisit son mot de passe personnel. Les connexions suivantes utilisent le nouveau mot de passe et n’affichent plus cette fenêtre. Son nom d’affichage est distinct de son identifiant technique : deux salariés peuvent porter le même nom. Les comptes existants restent compatibles.

## Accès et données

- `POST /api/team-members`, réservé au manager authentifié, actif et réellement responsable de son équipe.
- Entrée : `{ "data": { "name": "Prénom Nom", "email": "prenom@entreprise.fr" } }`.
- Aucun rôle, mot de passe ou identifiant d’équipe fourni par le client n’est accepté.
- Adresse normalisée ; une adresse existante donne une erreur 409, sans modifier ni déplacer l’ancien compte. Une collision concurrente ne crée qu’un compte.
- Le service utilisateur Strapi assure le hachage du mot de passe. La réponse de création est marquée `Cache-Control: no-store`. Elle ne fournit aucun JWT salarié.
- Le manager ne récupère aucune note individuelle, aucun historique personnel et aucun nouveau droit de consultation des données du salarié.

## Vérifications

Tests API dans une base temporaire : accès anonyme/salarié refusés, champs forgés rejetés, création, connexion avec les identifiants générés, nom d’affichage, rattachement et rôle imposés, mot de passe haché, doublons et requêtes concurrentes.

Le runner redémarre son serveur isolé entre les suites backend et client : leurs connexions ne cumulent pas artificiellement les tentatives d’authentification d’une même IP. Le limiteur réel reste actif, sans modification de la configuration applicative.

Le contrôle visuel du formulaire utilise l’équipe existante, sans créer de faux salarié dans la base locale de l’utilisateur.

## Première connexion et changement de mot de passe

`mustChangePassword` est un champ privé du compte Strapi, activé à la création par le manager. `/session` expose uniquement l’indicateur booléen permettant de choisir l’écran. Les autres fonctions Moodly sont bloquées côté serveur jusqu’au changement. Les comptes existants, ayant déjà un mot de passe personnel, restent compatibles et ne sont pas forcés de le modifier rétroactivement.

Le changement passe par `/auth/change-password`, avec le contrôle du mot de passe actuel par Strapi. Mot de passe et indicateur sont mis à jour dans une transaction. Une version privée des identifiants invalide les anciens JWT sur les routes Moodly ; le client remplace son jeton après le changement. La longueur est limitée à 72 octets UTF-8 pour respecter le hachage utilisé par Strapi. Les secrets ne sont ni journalisés ni stockés localement par le formulaire.
