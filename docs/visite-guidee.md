# Visite guidée Éclaircie

Adaptation du tutoriel du projet local **OnBoarding**, dans `src/components/tour/` : accueil, carte flottante, voile avec découpe qui se déplace, curseur fantôme, progression cliquable, précédent/suivant, fermeture et confettis finaux. L’interface reprend les couleurs pastel et les icônes Phosphor de Moodly.

L’implémentation utilise React Native, SVG et Reanimated sur Expo Go et sur le web. Aucun DOM, WebView ou moteur d’animation supplémentaire n’est nécessaire sur mobile.

## Parcours

- Salarié : accueil → météo → raisons facultatives → profil → jardin → calendrier → accompagnement → relance du guide.
- Manager : accueil → équipe → espace personnel privé → actions collectives → profil → jardin → calendrier → accompagnement → relance du guide.

Le tutoriel navigue sur les vrais écrans et fait défiler le profil jusqu’à la cible. Le curseur est uniquement une illustration : aucune sélection, soumission, prise de contact ou création d’action n’est exécutée.

La première connexion sur un appareil ouvre automatiquement la visite après 700 ms. La fermeture ou la fin mémorise uniquement une préférence locale, distincte pour chaque compte et chaque rôle, via AsyncStorage. Ce choix n’est pas envoyé à Strapi et ne contient aucun mood. La visite peut être relancée depuis **Mon profil → Revoir la visite guidée**.

La fermeture laisse l’utilisateur sur l’écran consulté ; terminer ramène à l’accueil. Un élément absent ou hors champ donne une carte explicative sans projecteur. Les démonstrations s’arrêtent en arrière-plan. Le réglage système de réduction des animations supprime les gestes, transitions et confettis. Sur le web, Échap ferme et les flèches gauche/droite changent d’étape. Le contenu derrière la fenêtre est masqué aux lecteurs d’écran pendant la visite.

## Vérification

Tests de géométrie sur petits écrans et de séparation des parcours, vérification TypeScript et exports Expo web / Android / iOS. Les contrôles visuels dans le navigateur portent sur l’ouverture, les étapes, le défilement, la fermeture, la relance et les deux rôles. Les retours haptiques restent à vérifier sur un téléphone physique.
