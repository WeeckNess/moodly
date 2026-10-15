# Revue Éclaircie — 14 octobre 2026

Cette revue décrit la version du 14 octobre. La connexion et la navigation ont ensuite été simplifiées le 15 octobre : voir [profil-personnel.md](profil-personnel.md).

## Résultat

La connexion, la saisie collaborateur, le portail manager, le guide et la confidentialité partagent maintenant la DA Éclaircie : marque identique, tons météo, texte crème, surfaces arrondies, icônes Phosphor et navigation cohérente. La saisie reste en deux écrans et son curseur conserve son mouvement continu, son morphing et ses vibrations.

## Corrections réalisées

- Extraction de la marque et de la navigation communes ; palette météo centralisée. Suppression des anciens styles inutilisés du portail.
- Portail manager dédié sur mobile et bureau : météo collective, moyenne des seules journées visibles, participation sur sept jours et un unique graphe sur trente jours. L’icône représente la météo arrondie de la moyenne de période, pas le ressenti d’une personne ni un diagnostic.
- Courbe interrompue aux jours masqués. Les valeurs absentes ne deviennent ni zéro ni une estimation. Les flèches et le toucher permettent de consulter une date ; une journée masquée ne révèle aucune note ni effectif.
- Chargement, absence de données, erreur, nouvelle tentative et actualisation manuelle prévus. Rafraîchissement au retour de l’app et au changement de jour ; réponses de session périmées ignorées après un changement de session.
- Seuil de confidentialité fourni par l’API dans le graphe et sa description accessible. Le portail n’ajoute aucune consultation individuelle ni export de réponses.
- Connexion, guide, confidentialité et boutons harmonisés ; onglets sélectionnés exposés aux technologies d’assistance. Contrôles de navigation du graphe de 44 px au minimum.
- Au passage vers les raisons, la note est figée à partir de la position réelle du curseur, y compris si sa transition est en cours.
- Adresse locale de l’API mise à jour pour le réseau courant dans le fichier `.env` ignoré par Git ; Expo redémarré. Cette adresse est propre à la machine et au réseau.

## Vérifications effectuées

- TypeScript, y compris contrôle des imports et variables inutilisés.
- Sept tests mobiles : coordonnées du curseur, ouverture de l’arc, points haptiques, morphing des contours, logique d’accompagnement privée et absence de liaison à travers les jours masqués.
- Trois tests unitaires backend et six tests d’intégration sur une base temporaire : authentification, rôles séparés, champs forgés refusés, unicité des saisies, seuil de cinq réponses appliqué côté serveur et agrégats sans auteur.
- Connexion manager au backend Strapi local avec le compte fictif : chargement des trente jours et des métriques.
- Parcours de démonstration : manager, consultation d’une date, guide, confidentialité, retour au collectif ; collaborateur, sélection météo, tag, note privée, envoi et confirmation.
- Rendus à 320 × 568, 390 × 844 et 1280 × 900 ; absence de débordement horizontal. Le manager et les pages d’information peuvent défiler ; la saisie météo et les raisons restent séparées.
- Exports Expo web, Android et iOS réussis.

## Points restant à valider sur appareil

Le rendu navigateur et les exports ne remplacent pas les essais Android/iOS réels : vibrations et latence, clavier natif, lecteur d’écran, agrandissement du texte et performances du morphing. Les états de chargement, d’erreur et de données entièrement masquées sont traités dans le code ; leur comportement doit également être éprouvé sur réseau mobile dégradé. Cette revue visuelle et fonctionnelle ne constitue pas un audit RGPD ni une garantie d’anonymat absolu face aux accès administrateur et journaux techniques.
