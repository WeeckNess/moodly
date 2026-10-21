# Animation de jardin fournie

Le dessin du dossier `eclaircie-arbre` est intégré au chêne dans les profils salarié et manager. Les 628 séquences originales sont conservées : graine, 10 racines, bois, 392 feuilles, boutons et pétales. Le saule et le pin conservent leurs dessins et leur progression existants.

`mobile/assets/garden/source.svg` conserve la source fournie. `npm run assets:garden --prefix mobile` régénère les données du dessin avec Python 3 et la dépendance de développement `svg-path-properties`. Aucun de ces outils n’est nécessaire à l’exécution de l’app.

Le composant `BotanicalTree` utilise react-native-svg et Reanimated sur web, Android et iOS. Aucun DOM, WebView, téléchargement, SMIL ou lecture automatique de 24 secondes. Les longueurs réelles des chemins sont précalculées : le `pathLength=1` SVG de la source ne peut pas être utilisé pour normaliser les tirets sur le moteur natif.

Une météo enregistrée correspond à un point de croissance, borné à 100 pour ce dessin. Le compteur privé existant reste la source de vérité, indépendamment de la note de moral. L’ouverture retrouve l’état enregistré ; la croissance change uniquement lorsque le compteur transmis change. Les étapes de test du chêne correspondent aux chapitres fournis. Elles ne modifient aucune donnée. Les autres essences conservent leurs repères.

Une transition interrompue repart de la valeur affichée. Le dessin est statique au repos ; seules les séquences qui changent utilisent des animations. Les éléments futurs restent masqués. La mise en arrière-plan suspend l’animation, la fermeture annule les timers et la préférence de réduction du mouvement rend la transition immédiate. Le libellé accessible annonce le stade et les journées ; les centaines de détails SVG sont exclus de la lecture vocale.

Validation : 28 tests mobiles, vérification TypeScript, exports Expo web/Android/iOS, contrôle visuel du profil à 390 px et absence d’erreurs console. Le ressenti et la fluidité sur un téléphone physique restent à vérifier dans Expo Go.
