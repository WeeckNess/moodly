# Vibrations dans la webapp

La version web utilise maintenant `navigator.vibrate` pour les crans de la météo, les sélections, les changements de page, les confirmations et le bouton de test du profil. Les signatures natives Expo restent inchangées.

## Gestion

- Détection de l’API à l’exécution, sans décider à partir du nom du navigateur.
- Nécessité d’une interaction utilisateur préalable ; une session restaurée ne lance pas de vibration avant ce geste.
- Motifs de confirmation envoyés en une fois au navigateur, avec leurs pauses, pour éviter la dépendance aux temporisateurs web.
- Limitation des doublons et priorité aux confirmations ; l’intensité ne dépend pas de la note du mood.
- Arrêt immédiat lors de la désactivation du réglage, du passage en arrière-plan ou du démontage de l’app.
- Préférence locale conservée et même interrupteur pour la webapp et les versions natives.
- Un navigateur sans API affiche un interrupteur désactivé et une explication. Un appel refusé ou une exception donne un état de refus, sans plantage.
- Le test indique seulement qu’un motif a été demandé. Il ne prétend jamais avoir vérifié le moteur physique.

## Limite matérielle et navigateur

**Aucune garantie universelle de vibration n’est possible dans une webapp.** L’API est implémentée dans des navigateurs Chromium compatibles ; WebKit ne propose pas cette API sur iPhone et s’oppose actuellement à sa standardisation. Installer le site sur l’écran d’accueil n’ajoute pas cette API. Les réglages du téléphone, le mode silencieux, le matériel ou le navigateur peuvent aussi limiter les vibrations lorsque la méthode existe.

Le retour `true` de `navigator.vibrate` n’est pas une mesure du moteur et ne prouve pas qu’une vibration a été ressentie. Les animations existantes restent utilisables sur tous les appareils, sans les présenter comme une vibration.

Sources consultées le 22 octobre 2026 :

- [Spécification Vibration API](https://w3c.github.io/vibration/)
- [MDN — Navigator.vibrate](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate)
- [WebKit — demande de prise en charge sur iPhone](https://bugs.webkit.org/show_bug.cgi?id=288846)

## Vérification

Tests simulant une API compatible, son absence, un refus et une exception, l’absence de geste initial, les durées et les pauses, le dédoublonnage, le stockage du réglage et l’arrêt en arrière-plan. Ces tests valident le comportement de l’app, pas la réponse d’un moteur physique : celle-ci nécessite un test sur le téléphone concerné.
