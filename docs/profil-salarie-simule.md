# Profil salarié avec un mois d’activité simulée

Un compte salarié dédié peut recevoir un historique synthétique explicitement préparé pour les essais. Cela ne transforme pas les données en réponses réelles et ne réactive pas le seed automatique de la base applicative.

La création ponctuelle du compte et des 30 déclarations collectives se fait dans Strapi, en transaction avec les journaux de participation et les agrégats. L’historique du profil reste indépendant : aucune route de lecture des réponses individuelles n’est ajoutée.

Pour préremplir son calendrier, ses rapports et son arbre en développement, `EXPO_PUBLIC_SAMPLE_PROFILE` peut contenir un JSON `{ "profile": "clé opaque du compte synthétique", "entries": [{ "day": "AAAA-MM-JJ", "score": 3, "tags": [] }] }`. Ce paramètre local n’est pas versionné. Il ne doit jamais contenir un historique réel ni un secret : les variables EXPO_PUBLIC sont publiques.

L’app ne lit cet aperçu qu’en développement et pour la clé de compte correspondante. Elle limite les entrées à 30 jours, ignore les dates futures ou expirées, conserve les saisies déjà présentes et évite les imports concurrents. Les journées importées utilisent le stockage personnel habituel ; elles ne sont pas renvoyées à l’API et ne doublent pas les réponses collectives. Effacer le récap désactive le réimport sur cet appareil, grâce à une préférence sans notes ni tags.

Le profil du manager et les comptes réels ne sont pas affectés. Sans cette variable, le comportement normal reste inchangé. En production, aucun préremplissage ne s’exécute. L’export web a été contrôlé pour vérifier l’absence de la clé et de l’historique d’aperçu.
