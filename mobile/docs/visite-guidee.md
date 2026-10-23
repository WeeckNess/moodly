# Visite guidée — nouvelle proposition

La visite est une présentation en plein écran, dans la direction artistique Éclaircie. Les anciennes bulles et découpes mesurées sur les pages ont été remplacées par des scènes dédiées : elles ne dépendent plus de la position de défilement ou de la taille d'une carte dans le profil.

- Téléphone : illustration à proportions fixes, texte puis commandes fixes en bas. Sur petit écran ou avec texte agrandi, le contenu peut défiler, sans cacher les commandes.
- Ordinateur : illustration et texte en deux colonnes.
- Transitions par fondu et entrée du texte ; météo interpolée en continu, choix essayables au geste ou par boutons accessibles, pousse du tronc et des feuilles, apparition progressive des raisons et actions, tracé du rapport personnel.
- Parcours distincts salarié et manager, navigation précédente/suivante, sortie à tout moment et reprise depuis « Revoir la visite guidée » dans le profil.

Les scènes sont des illustrations explicatives, sans données personnelles. Le geste météo ne modifie pas la réponse du jour et ne déclenche aucune requête métier. Les pages réelles ne changent pas pendant la visite. À la fin, le retour à l'accueil utilise la navigation existante.

Les animations s'arrêtent en arrière-plan. Avec la réduction des mouvements, les scènes restent statiques et les transitions instantanées. Le statut de visite déjà terminée est conservé pour éviter de forcer à nouveau les utilisateurs existants.

Vérifications : compilation TypeScript, tests mobile, export web de l'app ; contrôle navigateur des parcours salarié et manager, des commandes, et du cadrage en 320 × 568, 390 × 844 et format ordinateur. Aucun fichier backend ni appel de création de données n'est modifié. Le rendu natif sur téléphone physique reste à vérifier.
