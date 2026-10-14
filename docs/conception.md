# Éclaircie — note de conception

## Intention et périmètre

Éclaircie permet de partager son moral par une météo en moins de 10 secondes. La métaphore donne un vocabulaire simple au ressenti, sans valoriser le soleil au détriment des journées difficiles. Cinq choix associent icône Phosphor, libellé et score : orage (1), pluie (2), nuages (3), éclaircies (4), soleil (5).

Le collaborateur se connecte et parcourt un arc arrondi de 240° avec le doigt : un cercle ouvert en bas, de Très mal à Très bien. Le fond et le disque central évoluent avec son geste. Les cinq icônes météo Phosphor en duotone se fondent progressivement entre elles sans rotation ni déplacement du centre. L’icône et le disque sont agrandis de 25 %. La phrase encourageante se trouve au-dessus de l’arc. Le geste et le curseur utilisent Reanimated et Gesture Handler sur le thread UI natif, avec ressort amorti sans dépassement pendant le glissement. Un clic éloigné déclenche un trajet continu sur tout l’arc (jusqu’à 960 ms), interrompable depuis sa position courante. Le libellé et la phrase suivent la note la plus proche. Un léger retour haptique natif est déclenché au franchissement des points entiers (1 à 5), dans les deux sens, avec protection contre les répétitions dues au tremblement autour d’un point. Le ressenti dépend du téléphone compatible et de sa latence système. Le logo ne tourne jamais. React ne met à jour le libellé qu’au changement de note. L’ouverture inférieure ne provoque plus de saut entre les extrémités. Une deuxième page rassemble les raisons facultatives. Le bouton « + » ouvre une note privée de 80 caractères, non transmise et effacée après l’envoi. Seuls les tags fermés alimentent le collectif. Le manager dispose d’un seul graphique sur 30 jours et d’un taux collectif de participation. Pas d’historique individuel côté manager, de commentaire libre transmis, de classement, de diagnostic ou de gamification.

## Direction artistique et accessibilité

La structure s’inspire de https://getartcraft.com/apps : fond sombre, titres généreux, repères numérotés, filets fins et accents colorés. L’identité et les textes restent propres à Éclaircie. Palette : charbon végétal, crème, sauge, jaune et couleurs secondaires des météos. Police native, libellés techniques monospace système, aucun média distant chargé par l’interface.

Les icônes Phosphor sont embarquées, avec imports ciblés. Le choix actif utilise un contour et une coche en plus de la couleur. Les contrôles possèdent des noms et états accessibles. La navigation mobile reste disponible en bas d’écran. La saisie du moral et les raisons occupent deux écrans distincts, sans défilement aux tailles normales testées 320 × 568 et 390 × 844. Les contenus explicatifs sont déplacés dans les écrans dédiés accessibles depuis le bouclier. Les animations de transition respectent la préférence système de réduction des mouvements ; le curseur conserve un trajet continu raccourci à 120 ms pour éviter toute téléportation. L’arc accepte les flèches du clavier, Home/End et les actions des lecteurs d’écran. Le graphique possède une description et un résumé texte. La lisibilité doit encore être validée sur appareils réels, lecteurs d’écran et avec agrandissement du texte.

## Architecture et protection de l’accès manager

React Native + Expo constitue l’app ; Strapi v5 expose l’API et SQLite sert au développement local. Ce choix mobile, demandé par le porteur du projet, remplace la stack Vue/Capacitor du brief et doit être accepté par l’encadrant.

Le serveur résout lui-même l’équipe, le rôle et la date Europe/Paris. Il refuse les champs supplémentaires et contrôle le score et les tags. Une transaction crée un journal unique utilisateur/jour, une réponse sans relation utilisateur et un agrégat équipe/jour. Le manager ne dispose d’aucune route de lecture des réponses ou journaux. Sa route agrégée est limitée à son équipe et masque les jours sous cinq réponses. Les trous du graphique ne sont pas reliés.

Le JWT expire après huit heures. Il reste dans le stockage sécurisé système sur mobile et uniquement en mémoire sur le web. La déconnexion supprime la copie locale. HTTPS est nécessaire en déploiement ; le développement local utilise HTTP.

## Invitation privée à échanger

Après trois « Très mal » sur des jours distincts dans les 30 derniers jours, une fenêtre propose un échange avec le manager ou une personne de confiance. Aucun signal individuel ne part au manager ; l’utilisateur choisit de préparer, copier et transmettre un message. La fenêtre peut aussi être ouverte volontairement depuis la confirmation. Il s’agit d’un mécanisme d’accompagnement, pas d’une règle garantissant la conformité RGPD.

Le compteur conserve au plus trois dates, sans raison personnelle, dans le stockage sécurisé du mobile. Une clé opaque propre au compte évite de mélanger les profils sur un appareil partagé. Le web réel garde ce compteur uniquement en mémoire pendant la session. Il ne se synchronise pas entre appareils et ne récupère pas d’historique depuis Strapi. Les dates hors fenêtre sont éliminées lors de la prochaine saisie. Les répétitions de démonstration le même jour ne comptent pas comme plusieurs jours.

## Mini-registre de conception

| Ensemble | Finalité | Accès applicatif | Conservation prévue |
| --- | --- | --- | --- |
| Compte, rôle, équipe | Connexion et contrôle d’accès | Session du compte ; administration | Durée de gestion du compte, à définir avec l’organisation |
| Réponse : équipe, date, score, tags | Construire la tendance collective | Création collaborateur ; aucune lecture applicative | 45 jours par défaut |
| Journal : utilisateur, date, clé unique | Limiter à une réponse par jour et calculer la participation collective | Serveur uniquement | 45 jours par défaut |
| Agrégat : équipe, date, somme, effectif | Calculer les moyennes | Moyenne filtrée côté manager | Conservé dans le MVP ; durée finale à définir |
| Date locale de saisie de démo | Simuler la limite quotidienne | Appareil de démonstration | Remplacée à la saisie d’un autre jour ou réinitialisée volontairement |
| Dates de trois météos très basses au maximum | Proposer une invitation privée | Stockage sécurisé mobile ; mémoire de session sur le web réel ; stockage local pour la démo fictive | Fenêtre de 30 jours, nettoyée lors de la prochaine saisie |
| Raison personnelle | Aider à formuler son ressenti | Mémoire de l’écran uniquement | Effacée après l’envoi ou à la fermeture du parcours |

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
