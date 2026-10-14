# Validation Éclaircie

## Commandes

Depuis la racine :

```sh
npm run typecheck
npm test
npm run backend:test
npm run backend:test:api
```

Le dernier script crée sa propre base temporaire sous `backend/.tmp/`, utilise un port disponible et des comptes fictifs, puis ferme son serveur et supprime sa base de test. Il ne modifie pas la base de démonstration.

## Couverture

- Moyennes masquées avec zéro à quatre réponses ; affichées dès cinq réponses.
- Aucune note hors 1–5, valeur non entière, texte libre, équipe ou date forgée acceptée.
- Fenêtre de 30 jours stable au changement d’heure.
- Accès sans authentification refusé.
- Rôles manager et collaborateur séparés.
- Aucune route de lecture brute des réponses ou journaux.
- Deux envois simultanés créent une seule réponse ; l’autre reçoit 409.
- Le blocage journalier est visible dans la session.
- Statistiques limitées à l’équipe du compte même avec un paramètre d’équipe ajouté.
- Statistiques sans auteur ni horodatage technique.
- Parcours web : démo, sélection météo/tags, confirmation, navigation, connexion et saisie réelles.
- Contrôle visuel à 320 × 568, 390 × 844 et sur grand écran.
- Correspondance des coordonnées du geste avec les cinq valeurs de l’arc et clamp dans l’ouverture inférieure.
- Glissement, flèches clavier et valeur ARIA du curseur.
- Clic Très mal → Très bien : observation des cinq valeurs successives et du curseur passant par le haut de l’arc ; aucune rotation du logo.
- Phrase encourageante adaptée à chaque palier, sans déplacement du centre.
- Centre du visuel identique entre soleil et orage, vérifié dans le rendu navigateur.
- Contours à huit courbes compatibles : la forme intermédiaire est différente des deux extrémités.
- Maintien de la bonne extrémité lors du passage dans l’ouverture inférieure de l’arc.
- Parcours en deux étapes, ajout/édition d’une note privée, sélection de tags et envoi.
- Trois jours très bas déclenchent une seule invitation ; les répétitions du même jour ne gonflent pas le compteur ; les dates hors fenêtre sont écartées.
- Fenêtre d’accompagnement facultative, message à copier et absence d’envoi automatique.

## Limites

La validation navigateur ne remplace pas un test Android/iOS sur téléphone réel. Le retour haptique est intégré avec expo-haptics ; sa sensation et sa disponibilité restent à vérifier sur un téléphone compatible. Un export Expo n’est ni un APK signé ni une publication sur les stores. Ces contrôles ne constituent pas un audit de conformité ou une preuve d’anonymat absolu.
