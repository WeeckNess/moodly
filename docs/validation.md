# Validation Éclaircie

Mis à jour le 20 octobre 2026. Les tests et les essais sur téléphone sont confirmés fonctionnels par le porteur du projet à cette date ; les plateformes, modèles et versions de téléphone ne sont pas précisés. Les commandes ci-dessous permettent de reproduire les vérifications automatisées.

## Commandes

Depuis la racine :

```sh
npm run typecheck
npm test
npm run backend:test
npm run backend:test:api
```

Le dernier script compile le backend et l'administration, crée sa propre base temporaire sous `backend/.tmp/`, utilise un port disponible et des comptes fictifs, exécute les tests API puis le client du front contre cette API. Il ferme ensuite son serveur et supprime sa base de test. Il ne modifie pas la base de démonstration. Les dépendances de `backend` et de `mobile` doivent être installées avec Node 24.

## Couverture

- Moyennes masquées avec zéro à quatre réponses ; affichées dès cinq réponses.
- Aucune note hors 1–5, valeur non entière, texte libre, équipe ou date forgée acceptée.
- Fenêtre de 30 jours stable au changement d’heure.
- Accès sans authentification refusé.
- Rôles manager et collaborateur séparés.
- Policy manager : compte actif, rôle actuel et désignation comme manager de l'équipe de rattachement ; refus si le compte est absent, bloqué, rétrogradé ou mal affecté.
- Aucune route de lecture brute des réponses ou journaux.
- Deux envois simultanés créent une seule réponse ; l’autre reçoit 409.
- Le blocage journalier est visible dans la session.
- Statistiques limitées à l’équipe du compte même avec un paramètre d’équipe ajouté.
- Statistiques sans auteur ni horodatage technique.
- Tags chargés depuis Strapi, filtrés par rôle, triés, renommés et désactivés en base ; refus des tags indisponibles et maintien d'une saisie sans tag.
- Le bootstrap conserve les modifications du catalogue et migre les anciens noms d'icônes.
- Sélecteur Lucide contrôlé dans l'administration ; rendu SVG natif, alias et icône de repli testés.
- Service serveur Lucide corrigé et appelé via HTTP sous Node 24, sans nouvelle permission sur les rôles applicatifs. La permission du test est créée et retirée uniquement dans sa base isolée.
- Parcours web : connexion aux comptes Strapi, sélection météo/tags, confirmation, navigation et conservation du statut de participation après reconnexion.
- Contrôle visuel à 320 × 568, 390 × 844 et sur grand écran.
- Correspondance des coordonnées du geste avec les cinq valeurs de l’arc et clamp dans l’ouverture inférieure.
- Glissement, flèches clavier et valeur ARIA du curseur.
- Clic Très mal → Très bien : observation des cinq valeurs successives et du curseur passant par le haut de l’arc ; aucune rotation du logo.
- Phrase encourageante adaptée à chaque palier, sans déplacement du centre.
- Centre du visuel identique entre soleil et orage, vérifié dans le rendu navigateur.
- Icônes Phosphor en duotone avec déformation réelle des contours, disque et icône agrandis de 25 %, phrase de 15 px au-dessus de l’arc.
- Vérification de la topologie des contours et des tracés intermédiaires : deux tracés persistants à opacité constante, dont les coordonnées évoluent ; centre inchangé pendant la traversée.
- Détection des points entiers dans les deux sens, y compris les extrémités ; aucun déclenchement aux demi-paliers ni au départ d’un point.
- Maintien de la bonne extrémité lors du passage dans l’ouverture inférieure de l’arc.
- Parcours en deux étapes, ajout/édition d’une note privée, sélection de tags et envoi.
- Trois jours très bas déclenchent une seule invitation ; les répétitions du même jour ne gonflent pas le compteur ; les dates hors fenêtre sont écartées.
- Fenêtre d’accompagnement facultative, message à copier et absence d’envoi automatique.

## Limites

La confirmation des essais sur téléphone provient du porteur du projet ; elle est distincte des vérifications navigateur et des adaptateurs simulés. Un export Expo n'est ni un APK signé ni une publication sur les stores. Ces contrôles ne constituent pas un audit de conformité ou une preuve d'anonymat absolu. Les sauvegardes sont hors périmètre de la version locale à la demande du porteur du projet.

## Revue de la DA et du portail manager

Voir [revue-da.md](revue-da.md) pour les corrections, les parcours vérifiés, les formats d’écran et les limites de la validation du 14 octobre 2026.

## Profil personnel — 15 octobre 2026

Les tests mobiles couvrent également le calendrier, la rétention à trente jours, la tendance sur sept jours, l'isolation des comptes, les adaptateurs de stockage simulés et l'effacement local. La validation navigateur couvre la connexion des deux rôles et l'absence du brouillon libre dans le récap. Le récap commence avec les saisies enregistrées sur cet appareil. Voir [profil-personnel.md](profil-personnel.md).
