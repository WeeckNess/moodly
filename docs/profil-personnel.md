# Profil personnel et parcours simplifié — 15 octobre 2026

Le salarié retrouve ses propres souvenirs météo, avec une carte quotidienne, un calendrier et une tendance sur les sept derniers jours. Cette tendance ne contient aucune donnée collective. Le design reprend le principe d’un souvenir daté à la BeReal, avec les icônes météo et la palette Éclaircie ; aucune photo ni permission caméra n’est nécessaire.

## Parcours

- Connexion refaite, avec un seul accès à la démo, visibilité du mot de passe et authentification Strapi existante.
- Bandeau salarié/manager : bascule à deux flèches dans la démo et icône de profil. Les boutons de confidentialité et de déconnexion ont quitté ce bandeau.
- Les anciennes pages « Le principe » et « Confidentialité », ainsi que la barre d’onglets, sont supprimées. Ces informations se déplient dans le profil. La déconnexion se trouve dans le même écran.
- Le manager conserve son graphe anonyme sur trente jours et un profil de compte ; il ne voit aucun souvenir personnel d’un salarié. En connexion réelle, le rôle reste celui attribué par Strapi : la démonstration ne contourne pas ces permissions.

## Données personnelles locales

Après un envoi réussi, le récap conserve seulement la date, la note et les tags prédéfinis. La raison libre reste un brouillon de l’écran, jamais envoyé au serveur et jamais enregistré dans les souvenirs. Une journée possède un seul souvenir ; une répétition de démo remplace celui du même jour.

Sur mobile, une clé opaque par compte isole les profils dans SecureStore. Chaque journée est enregistrée séparément, pour rester sous les limites de taille du stockage sécurisé. Sur le web réel, les souvenirs restent uniquement en mémoire et disparaissent à la déconnexion ou au rechargement. Le récap ne se synchronise pas entre appareils et ne reconstitue pas les anciennes réponses anonymes.

La fenêtre est de trente jours, nettoyée à la lecture ou à l’écriture suivante. Le profil permet d’effacer ce récap et le compteur privé d’accompagnement après confirmation. Cet effacement ne modifie pas les réponses anonymes déjà envoyées. Les données de démonstration sont explicitement fictives et utilisent le stockage local de démo ; les exemples ne réapparaissent pas après leur effacement volontaire.

## Validation

- Douze tests mobiles : logique existante, calendrier, dates, rétention, unicité du souvenir journalier, exclusion du texte libre, tendance sur sept jours, stockage par compte et effacement de démo.
- Trois tests unitaires backend et six tests d’intégration sur une base temporaire : les permissions et l’anonymisation des agrégats restent inchangées.
- Connexions salarié et manager vérifiées dans le navigateur avec les comptes fictifs du backend local.
- Saisie de démo avec tag et brouillon, confirmation et carte du jour dans le profil ; le brouillon n’apparaît pas dans le récap.
- Profil réel sans souvenir fictif ; bascule de démo et accès au profil manager vérifiés.

Les essais des adaptateurs de stockage utilisent des doublures de SecureStore/AsyncStorage. Le clavier natif, l’autofill, les lecteurs d’écran et la persistance réelle sur Android/iOS restent à vérifier sur téléphone. Aucune récupération de mot de passe ni inscription fictive n’est ajoutée : les comptes restent provisionnés dans le backend.
