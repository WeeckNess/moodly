# Validation Éclaircie

## Commandes

Depuis la racine :

```sh
npm run typecheck
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
- Contrôle visuel à 390 × 844 et sur grand écran.

## Limites

La validation navigateur ne remplace pas un test Android/iOS sur téléphone réel. Un export Expo n’est ni un APK signé ni une publication sur les stores. Ces contrôles ne constituent pas un audit de conformité ou une preuve d’anonymat absolu.
