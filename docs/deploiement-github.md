# Déploiements depuis GitHub

Le dépôt source reste [WeeckNess/moodly](https://github.com/WeeckNess/moodly), anciennement `WeeckNess/moodly-starter`. Aucun fork ni transfert n'est nécessaire. Le workflow `.github/workflows/deploy-vercel.yml` utilise GitHub Actions pour envoyer le commit testé aux deux projets Vercel existants de `Téo's team` (`teo-s-team1`). La liaison native Vercel/GitHub n'est pas utilisée : le compte connecté est collaborateur d'un dépôt personnel appartenant à un autre compte.

| Projet Vercel | Dossier source | Adresse publique |
| --- | --- | --- |
| `moodly-backend-demo` | `backend` | https://moodly-backend-demo.vercel.app |
| `moodly-front` | `mobile` | https://moodly-front.vercel.app |

Le backend réel `moodly-backend` est exclu des cibles du script. Les identifiants des deux projets et de l'équipe sont publics, fixés dans `.github/scripts/deploy-vercel.cjs` et ne nécessitent pas de secrets GitHub supplémentaires. Les secrets Strapi/PostgreSQL restent configurés dans Vercel ; le workflow ne les télécharge pas. Aucun peuplement de base n'est lancé.

## Activation à effectuer une fois

La configuration du workflow est prête ; les déploiements resteront refusés tant que les conditions suivantes ne sont pas réunies.

1. Le propriétaire du dépôt protège `main` dans les réglages GitHub, avec revue des pull requests avant fusion. Le workflow vérifie `github.ref_protected` avant d'accéder aux identifiants de déploiement. Les secrets ne doivent pas être utilisés par une branche de code non revue.
2. Le propriétaire crée l'environnement GitHub **`production`**, limité à la branche `main`. Configurer les approbateurs requis si cette protection est disponible pour l'offre du dépôt. Sur un dépôt privé, les environnements et les protections disponibles dépendent de l'offre GitHub ; si GitHub les refuse, conserver le workflow inactif jusqu'à une configuration adaptée.
3. Le titulaire du compte Vercel `teojmn` crée un jeton dédié aux déploiements dans [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens), limité à `Téo's team`, avec expiration. Il ajoute sa valeur directement comme secret **`VERCEL_TOKEN`** de l'environnement GitHub `production`. Ne pas partager le jeton dans le chat, un fichier versionné ou les journaux. S'il est enregistré au niveau dépôt, tous les collaborateurs disposant du droit d'écriture peuvent le référencer dans un workflow : préférer le secret d'environnement protégé.
4. Dans [Actions](https://github.com/WeeckNess/moodly/actions), sélectionner **Deploy front and demo backend to Vercel**, puis **Run workflow** sur `main` pour le premier essai.

Le premier essai doit être suivi jusqu'à son terme : tests, constructions distantes, vérification HTTP des deux déploiements provisoires, promotion et vérification des domaines publics. Avant cette première exécution réussie, ne pas considérer l'automatisation comme active ou validée.

## Déroulement

Un push sur `main` touchant `mobile/`, `backend/`, `.github/`, `.nvmrc` ou les manifests npm déclenche le workflow. Une modification de documentation seule ne relance pas les constructions. Le lancement manuel reste possible, exclusivement sur `main` protégée.

Le premier job installe Node 24 et les dépendances npm verrouillées, vérifie les types et les tests du front/backend ainsi que les garde-fous du script de déploiement. Il ne dispose d'aucun jeton Vercel. Le job de publication attend sa réussite et les protections de l'environnement `production`. Les actions checkout/setup-node sont fixées à des SHA et la version du CLI Vercel est fixée à `65.1.0`. Le token Vercel n'est fourni qu'à l'étape de déploiement, après l'installation des outils.

Le script publie d'abord le backend de démonstration puis le front. Pour chaque cible :

1. Envoi du commit exact extrait de GitHub et construction sur Vercel avec les variables de production du projet ; les domaines restent associés à la version précédente.
2. Vérification de `/_health` (204) pour Strapi, ou `/` (200) pour le front. Le CLI utilise l'authentification existante pour accéder aux déploiements protégés, sans désactiver leur protection.
3. Promotion du déploiement prêt sur le domaine public, puis nouveau contrôle HTTP.

Un build ou un contrôle provisoire en échec empêche la promotion de la cible et arrête le workflow. Si le front échoue après la promotion du backend, le backend reste publié et le front conserve sa version précédente. Une défaillance du domaine public après promotion est signalée en échec ; inspecter le déploiement avant de relancer ou de revenir à la version précédente. Les liens et le commit sont consignés dans le résumé du run GitHub ; aucun journal contenant des secrets n'est publié en artefact.

## Front réel ou démo

Le workflow conserve `EXPO_PUBLIC_API_URL=/` dans Vercel. La règle `Backend Strapi` de `moodly-front → CDN → Routing Rules` choisit toujours le backend réel ou de démonstration, indépendamment d'un nouveau déploiement. Voir [environnement-demo.md](environnement-demo.md).

## Restrictions d'accès

La configuration native d'un dépôt GitHub personnel exige son propriétaire. La publication via Actions utilise le jeton Vercel configuré ; elle ne donne pas de nouveaux droits aux auteurs des commits. L'offre Vercel Hobby impose également que l'auteur d'un commit privé soit le propriétaire de l'équipe Hobby. Si un commit d'un autre auteur est refusé, conserver l'erreur et adapter les droits ou l'offre avec le porteur du projet ; ne pas falsifier l'auteur pour contourner cette règle.

Références : [GitHub Actions et Vercel](https://vercel.com/docs/git/vercel-for-github#using-github-actions), [règles des équipes Hobby](https://vercel.com/docs/git#using-hobby-teams), [environnements GitHub](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
