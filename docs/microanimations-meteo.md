# Micro-animations du sélecteur météo

Le symbole principal conserve les contours Phosphor et son orientation verticale. Il ne se déplace pas et aucun halo n’est ajouté.

- Déformation respiratoire lente du contour, ancrée au centre, sur un cycle de 6,8 secondes.
- Petit mouvement du détail de pluie et de la pointe de l’éclair ; les rayons du soleil se déploient légèrement sans rotation.
- Variation douce de l’opacité du remplissage duotone, entre 18,8 et 21,2 %.
- Réponse de pression du disque pendant le geste (+1,2 %) et retour élastique au franchissement d’un palier (+1,8 %), sans changer les positions du curseur ou le déclenchement des vibrations.
- Interpolation des contours par une courbe quintique : vitesse et accélération nulles aux extrémités pour adoucir les arrivées.

Ces mouvements ne s’activent que sur le symbole central du sélecteur. Les miniatures et cartes restent statiques. Les cycles tournent dans Reanimated, sans mise à jour React à chaque image ; les contours vides sont compactés pour réduire le volume SVG traité.

Le cycle s’annule au démontage et à la mise en arrière-plan. La préférence système de réduction des mouvements est lue avant toute animation ; elle supprime les mouvements décoratifs et le rebond. Les couleurs et la vraie transformation météo restent liées au geste.

Validation : 41 tests mobiles, typage, exports web/Android/iOS, contrôle des limites des tracés et de la continuité de boucle. Dans le navigateur, les contours évoluent au repos tandis que l’arc reste fixe ; le parcours jusqu’au soleil conserve le centrage. La fluidité et le ressenti sur téléphone physique restent à vérifier dans Expo Go.
