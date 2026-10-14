# Éclaircie — note de conception

## Intention et périmètre

Éclaircie permet de partager son moral par une météo en moins de 10 secondes. La métaphore donne un vocabulaire simple au ressenti, sans valoriser le soleil au détriment des journées difficiles. Cinq choix associent icône Phosphor, libellé et score : orage (1), pluie (2), nuages (3), éclaircies (4), soleil (5).

Le collaborateur se connecte, choisit une météo et, s’il le souhaite, des tags fermés. Le manager dispose d’un seul graphique sur 30 jours et d’un taux collectif de participation. Pas d’historique individuel, de commentaire libre, de classement, de diagnostic ou de gamification.

## Direction artistique et accessibilité

La structure s’inspire de https://getartcraft.com/apps : fond sombre, titres généreux, repères numérotés, filets fins et accents colorés. L’identité et les textes restent propres à Éclaircie. Palette : charbon végétal, crème, sauge, jaune et couleurs secondaires des météos. Police native, libellés techniques monospace système, aucun média distant chargé par l’interface.

Les icônes Phosphor sont embarquées, avec imports ciblés. Le choix actif utilise un contour et une coche en plus de la couleur. Les contrôles possèdent des noms et états accessibles. La navigation mobile reste disponible en bas d’écran. Les tags facultatifs sont repliés sur téléphone pour garder la saisie principale visible. Le graphique possède une description et un résumé texte. La lisibilité doit encore être validée sur appareils réels, lecteurs d’écran et avec agrandissement du texte.

## Architecture et protection de l’accès manager

React Native + Expo constitue l’app ; Strapi v5 expose l’API et SQLite sert au développement local. Ce choix mobile, demandé par le porteur du projet, remplace la stack Vue/Capacitor du brief et doit être accepté par l’encadrant.

Le serveur résout lui-même l’équipe, le rôle et la date Europe/Paris. Il refuse les champs supplémentaires et contrôle le score et les tags. Une transaction crée un journal unique utilisateur/jour, une réponse sans relation utilisateur et un agrégat équipe/jour. Le manager ne dispose d’aucune route de lecture des réponses ou journaux. Sa route agrégée est limitée à son équipe et masque les jours sous cinq réponses. Les trous du graphique ne sont pas reliés.

Le JWT expire après huit heures. Il reste dans le stockage sécurisé système sur mobile et uniquement en mémoire sur le web. La déconnexion supprime la copie locale. HTTPS est nécessaire en déploiement ; le développement local utilise HTTP.

## Mini-registre de conception

| Ensemble | Finalité | Accès applicatif | Conservation prévue |
| --- | --- | --- | --- |
| Compte, rôle, équipe | Connexion et contrôle d’accès | Session du compte ; administration | Durée de gestion du compte, à définir avec l’organisation |
| Réponse : équipe, date, score, tags | Construire la tendance collective | Création collaborateur ; aucune lecture applicative | 45 jours par défaut |
| Journal : utilisateur, date, clé unique | Limiter à une réponse par jour et calculer la participation collective | Serveur uniquement | 45 jours par défaut |
| Agrégat : équipe, date, somme, effectif | Calculer les moyennes | Moyenne filtrée côté manager | Conservé dans le MVP ; durée finale à définir |
| Date locale de saisie de démo | Simuler la limite quotidienne | Appareil de démonstration | Remplacée à la saisie d’un autre jour |

Le seuil protège l’affichage manager ; il ne garantit pas à lui seul un anonymat absolu. Les administrateurs, identifiants internes, sauvegardes, horodatages et logs peuvent permettre des recoupements. Avant un usage réel, valider la qualification des données et le cadre de traitement, informer les salariés, examiner les accès privilégiés et les risques de réidentification. Aucun consentement juridique n’est simulé par un bouton de l’app. Ce MVP n’est pas un dispositif de diagnostic médical.

## Adoption — plan ADKAR

- **Conscience** : présenter l’objectif d’écoute collective et les limites de l’outil avant son lancement.
- **Désir** : expliquer l’intérêt pour les salariés et l’engagement du manager à agir sans chercher les auteurs.
- **Connaissance** : proposer les écrans « Le principe » et « Mes données », puis une courte démonstration.
- **Capacité** : rendre la saisie rapide, facultative et accessible ; laisser les tags optionnels.
- **Renforcement** : partager régulièrement « vous avez dit / nous avons fait » en réunion et observer la participation au niveau de l’équipe uniquement.

## Sobriété et validation

Aucune vidéo, image lourde ou police distante. Le graphique reçoit 30 agrégats en une seule requête ; il ne charge pas les saisies brutes. Aucun polling périodique du graphique. La purge automatique évite de conserver indéfiniment les réponses et journaux.

Les tests couvrent seuil, validation, dates, rôles, champs forgés, concurrence et forme des statistiques. Les exports mobiles vérifient les bundles. Restent à réaliser : tests sur téléphone réel, mesure du poids du binaire, revue des dépendances, validation de confidentialité et préparation de la démo vidéo.
