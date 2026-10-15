# Rapports, jardin personnel et accompagnement

Le profil salarié rassemble désormais le jardin, les rapports sur 7 ou 30 jours, le rapport journalier et le calendrier. La saisie météo reste en deux étapes.

## Jardin

Une météo enregistrée avec succès sur cet appareil ajoute une journée au jardin. La note ne change pas la croissance. Les étapes sont : graine (0), pousse (1–4), jeune arbre (5–11), arbre en croissance (12–23), arbre épanoui (24 et plus). Le compteur continue ensuite sans récompense ni classement.

Le compteur ne baisse pas lors d’une pause ni lorsque les souvenirs de plus de 30 jours sont purgés. Il conserve seulement un total et la dernière date comptabilisée. Une même journée ne compte pas deux fois. Aucun historique antérieur n’est inventé. Le compteur est privé, propre au compte et à l’appareil ; stockage sécurisé sur mobile, mémoire de session sur web. Effacer le récap efface également l’arbre et le compteur d’accompagnement. Aucun transfert au manager.

Dans le profil salarié, les commandes « + 1 jour », « + 7 jours » et « Étape suivante » sont toujours visibles pour explorer la croissance. Les cinq étapes sont aussi sélectionnables directement. La simulation est temporaire, sans écriture dans le stockage ni effet sur les rapports. « Revenir à mon arbre réel » restaure immédiatement la progression personnelle.

## Essences et transformations

Le salarié choisit un chêne, un saule ou un pin, avec des silhouettes différentes. Le choix reste propre à son compte et à cet appareil ; stockage sécurisé sur mobile, mémoire de session sur web. Changer d’essence conserve le compteur. L’effacement du jardin supprime aussi ce choix.

La scène utilise des chemins SVG animés par Reanimated. Le tronc et les branches se déploient continûment, tandis que les masses de feuillage partagent 48 sommets et une topologie identique. Les formes sont interpolées à chaque image, à la fois entre les jours et entre les essences, sans remplacement d’illustration. Les journées au-delà de 24 font progressivement apparaître de petits bourgeons. Un souffle lent anime légèrement le port et les feuilles. Les boucles sont arrêtées lorsque l’application passe en arrière-plan ou que le composant est démonté. Avec « Réduire les animations », la scène est statique et les transitions sont immédiates.

## Rapports

Le rapport journalier reprend la météo et les raisons réellement saisies, plus la phrase positive de cette météo. Les bilans glissants de 7 et 30 jours indiquent la moyenne, le nombre de jours renseignés et les trois raisons les plus fréquemment choisies. Les jours vides ne sont jamais assimilés à une mauvaise note. Les raisons ne sont pas interprétées comme des causes, et les rapports ne sont pas des diagnostics.

Les rapports couvrent les souvenirs présents sur cet appareil. Ils ne sont ni récupérés depuis les réponses collectives anonymes, ni envoyés au serveur. La raison personnelle reste un brouillon effacé après l’envoi.

## Configurer les interlocuteurs dans Strapi

Dans le Content Manager, ouvrir **Team**, puis ajouter des éléments à **supportContacts**. Cette configuration administrative est rattachée à l’équipe :

- `kind` : psychologue, prevention, manager ou autre ;
- `name` : nom du professionnel ou service ;
- `qualification` : qualifications vérifiées par l’organisation ;
- `details` : disponibilité, coût/prise en charge, accès et modalités de confidentialité ;
- `email`, `phone` : coordonnées facultatives ;
- `bookingUrl` : lien HTTPS facultatif vers la réservation du prestataire.

Aucun professionnel fictif, badge d’agrément ou rendez-vous fictif n’est créé. Si aucun contact n’est renseigné, l’écran l’explique et invite à demander les coordonnées aux RH. La session authentifiée fournit uniquement les contacts de l’équipe de l’utilisateur ; aucune nouvelle route publique n’est exposée.

Les liens ouvrent le composeur e-mail, le téléphone ou le site de réservation. Aucun rapport ni mood n’est prérempli dans ces liens. Le brouillon proposé reste sélectionnable pour être copié et adapté librement. La modal après trois « Très mal » donne désormais accès à ces ressources, en plus de la préparation d’un échange.

## Vérification

Tests des bilans, du dédoublonnage, de la conservation de la croissance après purge et de l’effacement par compte. Contrôle des permissions API, compilation Strapi, typage et exports Expo. Vérification visuelle du profil et du parcours sur le compte fictif local.
