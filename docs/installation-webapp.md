# Moodly sur tout l’écran du téléphone

L’export web utilise un manifeste installable, une icône 192/512 px, une icône Apple 180 px et les métadonnées de lancement iOS. L’interface utilise la hauteur dynamique du viewport et `viewport-fit=cover`. Les SafeAreaView existantes protègent les boutons autour de l’encoche et de la barre de geste.

Le lancement installé demande `fullscreen` aux navigateurs qui prennent en charge `display_override`, avec `standalone` comme repli. Ce dernier ouvre une fenêtre d’app sans barre d’adresse. Les barres système peuvent rester visibles selon le téléphone ; ce réglage ne force pas la disparition des contrôles du navigateur lorsque le site est ouvert dans un simple onglet.

## iPhone

1. Ouvrir https://moodly-pearl.vercel.app dans Safari.
2. Utiliser Partager → Sur l’écran d’accueil.
3. Si l’option « Ouvrir comme app web » apparaît, l’activer.
4. Lancer Éclaircie depuis son icône sur l’écran d’accueil.

Si un raccourci avait été ajouté avant cette mise à jour et ouvre toujours Safari, le recréer à partir du site mis à jour.

## Android

Ouvrir le site dans Chrome, puis utiliser le menu → Installer l’application / Ajouter à l’écran d’accueil. Lancer ensuite l’app par son icône.

## Limites et vérifications

Aucun service worker n’est ajouté et aucune réponse API ni donnée personnelle n’est mise en cache pour cette installation. Le fonctionnement reste connecté au backend existant. Le mode installé n’ajoute pas d’API de vibration à Safari.

Contrôles : export Expo, validation des références et dimensions des icônes, présence du manifeste et des métadonnées iOS, maintien du zoom, et vérification des dimensions du conteneur dans un navigateur à taille mobile. Le lancement depuis l’écran d’accueil et les encoches réelles nécessitent une vérification sur téléphone physique.

Références : [Expo](https://docs.expo.dev/guides/progressive-web-apps/), [Apple](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html), [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
