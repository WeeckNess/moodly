# Créer un compte salarié depuis l’espace manager

Le bouton **Ajouter un salarié**, sous les onglets de l’espace manager, ouvre un formulaire avec le nom complet et l’adresse e-mail professionnelle.

Strapi crée le compte avec le rôle `collaborateur`, dans l’équipe gérée par le manager connecté. Il génère un mot de passe initial aléatoire, affichable dans la confirmation. Le manager transmet les identifiants directement au salarié ; aucun e-mail automatique n’est envoyé. Le mot de passe initial n’est plus consultable dans l’application après fermeture de la confirmation. Il n’expire pas automatiquement ; il ne s’agit pas d’un lien d’invitation ni d’un dispositif imposant un changement à la première connexion.

Le salarié se connecte normalement avec son adresse et ce mot de passe. Son nom d’affichage est distinct de son identifiant technique : deux salariés peuvent porter le même nom. Les comptes existants restent compatibles.

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
