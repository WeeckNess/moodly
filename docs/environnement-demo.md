# Backend de démonstration

La démonstration dispose d'une instance Strapi et d'une base PostgreSQL indépendantes. Aucune donnée réelle n'est copiée.

Administration : [moodly-backend-demo.vercel.app/admin](https://moodly-backend-demo.vercel.app/admin). URL de base de l'API : `https://moodly-backend-demo.vercel.app` (les routes métier commencent par `/api`).

| Usage | Projet Vercel | Base Neon |
| --- | --- | --- |
| Réel | `moodly-backend` | `moodly-db` |
| Démonstration | `moodly-backend-demo` | `moodly-demo-db` |

La démo utilise le même code métier et les mêmes contrôles d'accès. Ses secrets, JWT, comptes et données sont distincts. Les modifications dans son administration ne modifient pas la base réelle. Sur Vercel, « Production » désigne aussi l'environnement public du **projet de démo** ; cela ne le relie pas à la base réelle.

## Jeu d'exemples

- Studio Atlas : 16 collaborateurs et 2 managers, moral globalement positif avec des variations.
- Atelier Horizon : 12 collaborateurs et 1 manager, tendance qui s'améliore.
- Équipe Boréale : 8 collaborateurs et 1 manager, résultats plus contrastés.
- Cellule Plume : 4 collaborateurs et 1 manager, statistiques masquées sous le seuil de cinq réponses.

Le peuplement du 23 octobre 2026 contient 45 comptes applicatifs, 1 384 réponses anonymes, 1 384 journaux de participation, 164 agrégats quotidiens, 32 actions et les 11 tags initiaux. Le jeu couvre les 45 jours précédant son initialisation, avec des journées sans réponse et des journées sous le seuil d'anonymat. La journée courante est libre pour effectuer une saisie pendant la présentation.

Chaque équipe possède huit actions : prévues, en cours, en retard, réalisées avec bilan encore ouvert, réalisées avec bilan clôturé visible ou masqué faute de retours. Les contacts d'accompagnement portent explicitement la mention fictive et utilisent des adresses `.test`, sans coordonnées de professionnels réels.

Tous les comptes fictifs sont listés dans `backend/.env.demo-accounts.local`, avec le mot de passe généré pour cette démo. Ce fichier est privé et ignoré par Git, Docker et les envois Vercel. Exemples de connexions :

- `manager.atlas@demo.eclaircie.test` : manager de Studio Atlas.
- `manager2.atlas@demo.eclaircie.test` : second manager de la même équipe.
- `collaborateur1.atlas@demo.eclaircie.test` : saisie quotidienne et bilan d'une action.
- `manager.horizon@demo.eclaircie.test` : équipe avec une progression du moral.
- `manager.plume@demo.eclaircie.test` : statistiques sous le seuil d'anonymat.

Les comptes applicatifs restent distincts du compte d'administration Strapi. L'administrateur de démo utilise `teo.jamin@epitech.digital` ; son mot de passe est enregistré séparément dans `backend/.env.demo-admin.local` et diffère de celui de l'administration réelle.

## Compléter les exemples

Depuis la racine, avec Node.js 24 et les dépendances backend installées :

```sh
npm --prefix backend run build
npm run backend:demo:init
```

La commande lit exclusivement `backend/.env.demo.local`. **Ne pas remplacer ce fichier par les variables de production.** Avant toute connexion, elle vérifie le mode démo, les identifiants des projets Vercel/Neon, le nom de la base et les hôtes des deux connexions PostgreSQL, selon `backend/demo-target.json`. Une connexion réelle est refusée, même accompagnée de marqueurs de démonstration.

La commande est explicite : aucun peuplement fictif n'a lieu au démarrage normal de Strapi. Elle ajoute les jours manquants sur la période courante sans doubler les comptes, réponses, agrégats ou actions existants, sans supprimer les essais effectués dans la démo et sans réinitialiser les mots de passe. Les dates des actions initiales restent celles de leur création. Les fixtures des tests API restent réservées à leur propre SQLite temporaire ; elles ne servent pas à peupler cet environnement.

Le script utilise un verrou PostgreSQL partagé avec le démarrage du conteneur. Les inserts en lots et leurs relations sont réalisés dans des transactions. Le backend de démo vérifie également sa cible avant chaque démarrage.

## Utilisation avec l'application

Seul le backend de démo dispose d'un projet dédié. Le front existant peut basculer entre les deux backends depuis [moodly-front → CDN → Routing Rules](https://vercel.com/teo-s-team1/moodly-front/cdn/routing), sans redéploiement. Conserver `EXPO_PUBLIC_API_URL=/` sur le front.

La règle `Backend Strapi` utilise les paramètres suivants :

| Champ | Valeur |
| --- | --- |
| Mode | Regex |
| Source | `^/api/(.*)$` |
| Action | Rewrite |
| Destination démo | `https://moodly-backend-demo.vercel.app/api/$1` |
| Destination réelle | `https://moodly-backend-theta.vercel.app/api/$1` |

Modifier la destination, enregistrer puis publier les changements. La capture `$1` conserve le chemin de chaque requête, par exemple `auth/local`. Cette syntaxe a été vérifiée sur le routage publié ; la variante en `:path*` y provoquait une erreur 405 à la connexion. Désactiver la règle puis publier rétablit aussi la destination réelle définie dans `mobile/vercel.json`.

La bascule concerne tous les utilisateurs du front. Se déconnecter avant de basculer, puis se reconnecter avec un compte du backend choisi. Au 23 octobre 2026, la règle est activée vers le backend de démo ; connexion, session Atlas, six tags et statistiques sur 30 jours vérifiés via le domaine du front.

Pour utiliser la démo avec Expo en local, définir `EXPO_PUBLIC_API_URL` sur l'URL du backend de démonstration, puis redémarrer Expo. Ne pas ajouter de clé API ou de secret serveur dans l'application. Les comptes de démonstration n'existent pas dans le backend réel.

```sh
EXPO_PUBLIC_API_URL=https://moodly-backend-demo.vercel.app npm start
```

### Jardin et historique personnel simulés

L'API `/api/session` du backend de démo fournit un champ optionnel `demoProfile` uniquement pour les 45 comptes fictifs attendus. L'activation exige le mode démo et l'identifiant du projet Vercel de démonstration ; aucun compte ordinaire ne reçoit ce champ. Le front suit ainsi le backend choisi dans la règle Vercel, sans variable de démo à modifier au moment de la bascule.

Le profil reçoit une progression fictive de 3, 10, 22, 35, 55, 82 ou 105 météos selon le compte : les sept stades du dessin sont représentés. Jusqu'à 29 journées précédentes alimentent le calendrier et les rapports personnels, avec les raisons actuellement disponibles dans Strapi. Aujourd'hui reste libre pour une saisie pendant la présentation. Ces souvenirs sont inventés indépendamment des réponses collectives anonymes ; ils ne reconstruisent pas les météos d'une personne.

Exemples :

| Compte | Progression initiale | Stade |
| --- | --- | --- |
| `collaborateur1.atlas@demo.eclaircie.test` | 3 | Graine |
| `collaborateur2.atlas@demo.eclaircie.test` | 10 | Racines |
| `collaborateur3.atlas@demo.eclaircie.test` | 22 | Première pousse |
| `collaborateur1.horizon@demo.eclaircie.test` (Noah Bernard) | 35 | Branches |
| `collaborateur5.atlas@demo.eclaircie.test` | 55 | Feuillage |
| `manager.horizon@demo.eclaircie.test` (Noah Bernard) | 82 | Floraison |
| `collaborateur7.atlas@demo.eclaircie.test` | 105 | Épanoui |

Le profil affiche « Démonstration · historique personnel fictif ». L'import conserve les saisies locales existantes et ne double pas la croissance lorsqu'il est relancé. « Effacer mon récap personnel » désactive le réimport pour ce compte sur cet appareil/navigateur. Le web conserve les souvenirs en mémoire de session : après un rechargement ou une reconnexion, le scénario initial est réimporté s'il n'a pas été désactivé. Sur téléphone, il utilise le stockage sécurisé habituel. Le compteur privé d'accompagnement n'est pas prérempli.

Les profils réels gardent leur fonctionnement : historique personnel et jardin locaux, aucun historique fictif reçu depuis l'API. Les graphiques collectifs, la participation, les raisons, les contacts et les actions utilisent la base du backend sélectionné.

Les médias restent désactivés comme dans l'environnement réel. La purge quotidienne conserve la règle des 45 jours ; relancer le peuplement avant une présentation lointaine permet de compléter l'historique récent. L'offre gratuite et le runtime conteneur Vercel peuvent entraîner une attente au premier accès.

## Publication et vérification

Le projet Vercel de démo est `prj_0Xa34GsZrkOrvEqLr6lLsSh4lV9h`, et son projet Neon est `steep-art-30148412`. Ces ressources ont leurs propres secrets. L'association du dépôt local au projet Vercel réel reste inchangée. Le premier envoi de démonstration a été réalisé depuis une copie temporaire des sources dans `/private/tmp/moodly-backend-demo`, sans `.env`, données locales ou dépendances. Ne pas republier cette copie si les sources ont changé : la resynchroniser ou préparer une nouvelle copie isolée, puis vérifier le projet lié avant toute publication.

Déploiement du 23 octobre 2026 : [3gbunEdYi2zt7Yy89JcPu9XkX2Aj](https://vercel.com/teo-s-team1/moodly-backend-demo/3gbunEdYi2zt7Yy89JcPu9XkX2Aj), conteneur exécuté à Francfort, construction en 4 min 46 s. L'envoi comprend les modifications locales en cours ; aucun commit ou push n'a été créé pour cette publication.

Vérifications : 18 tests unitaires, compilation TypeScript et administration ; refus des véritables URL PostgreSQL avant toute connexion du script de démo ; seconde initialisation sans nouveaux comptes, réponses ou actions. Les contrôles API, d'abord en local puis en HTTPS sur l'instance publiée, vérifient deux managers d'Atlas, une courbe collective de 30 jours, le masquage de Plume, le refus des statistiques manager pour un collaborateur, une saisie du jour encore disponible, les raisons, les contacts et les différents bilans d'actions. Les nombres d'équipes, utilisateurs, réponses et actions sont également confirmés par l'API d'administration ; connexion administrateur vérifiée dans le navigateur. Aucun peuplement de la base réelle n'est effectué. Le front a ensuite été connecté au backend de démo par la règle de routage décrite ci-dessus.

Mise à jour du jardin simulé du 23 octobre 2026 : backend [EeDVMKj13s9HHWYwp65aMG2Dwdof](https://vercel.com/teo-s-team1/moodly-backend-demo/EeDVMKj13s9HHWYwp65aMG2Dwdof), front [EP4XJuCLu36MQXidM8KrQ8C9LNUD](https://vercel.com/teo-s-team1/moodly-front/EP4XJuCLu36MQXidM8KrQ8C9LNUD) construit puis promu sur `https://moodly-front.vercel.app`. Validation : 58 tests front, 20 tests unitaires backend, vérifications TypeScript, 12 contrôles API et un parcours du client front sur SQLite temporaire ; profils Noah salarié (35) et manager (82) reçus par l'API publique. Le navigateur confirme le jardin Branches, 35 météos, le calendrier et les rapports du salarié. Aucun commit ni push créé pour cette mise à jour.
