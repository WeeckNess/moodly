# Espaces manager

Trois vues reprennent la palette pastel et les composants de l’app : **Mon équipe**, **Pour moi**, **Agir ensemble**.

## Mon équipe

Le graphique collectif sur 30 jours reste inchangé. Aucun mood individuel, classement, diagnostic automatique ou auteur de réponse n’est disponible. Le bouton d’aide ouvre désormais les outils pour agir.

## Pour moi

Le manager dispose du sélecteur météo, de raisons adaptées (arbitrages, moyens, conflits, objectifs, soutien hiérarchique, reconnaissance), de son jardin et de ses rapports privés. La saisie manager n’appelle pas l’API des moods collectifs : elle reste dans son stockage sécurisé sur mobile, ou en mémoire de session sur web. Elle ne rejoint aucun agrégat d’équipe, y compris celui de son équipe. Elle bénéficie de l’invitation privée après trois « Très mal » et des mêmes modalités d’effacement.

Une trame privée aide à préparer son échange avec sa hiérarchie ou une personne de confiance, sur les priorités, les moyens, le rôle ou le soutien. Les contacts d’accompagnement sont ceux configurés par l’organisation dans Team/supportContacts. Aucun professionnel ou rendez-vous fictif n’est inventé.

## Agir ensemble

Les trames de discussion sont adaptées aux thèmes charge, réunions, outils et coopération. Elles sont éditables, affichables sous forme de texte sélectionnable et ne sont ni stockées ni envoyées. Elles disparaissent en quittant cet espace.

Le manager peut publier une action pour son équipe : titre de 3 à 100 caractères, description de 500 caractères maximum, échéance dans les 90 prochains jours. Le formulaire indique explicitement que ces informations seront visibles par l’équipe et ne doivent pas contenir d’informations personnelles. Quatre idées servent de point de départ.

L’action suit les étapes **Décidée → En cours → Réalisée**, sans retour arrière. Le manager et les salariés voient le même état ; les salariés retrouvent les actions dans leur profil. Une action réalisée ouvre un bilan jusqu’à la date indiquée (date de réalisation + 7 jours).

Chaque collaborateur peut répondre une seule fois : Pas encore (1), Un peu (2), Oui (3). Les retours sont facultatifs. Les managers ne votent pas pour éviter d’isoler leur réponse. Aucun résultat, compteur de participants ou moyenne n’est révélé en direct. Après la clôture, une moyenne sur 3 et le nombre de retours sont visibles uniquement à partir de 5 réponses. Sous ce seuil, le résultat reste masqué. Ce bilan décrit l’utilité déclarée de l’action, sans établir de causalité avec l’évolution du mood.

## API et confidentialité

- GET `/api/team-actions` : actions de l’équipe authentifiée, maximum 30, sur les 120 derniers jours.
- POST `/api/team-actions` : manager effectivement responsable de l’équipe.
- PATCH `/api/team-actions/:documentId` : transitions de statut, même contrôle d’équipe.
- POST `/api/team-actions/:documentId/feedback` : collaborateurs membres de cette équipe, pendant le bilan.

Aucun paramètre client ne choisit l’équipe. Le serveur refuse les champs supplémentaires, les retours hors fenêtre et les doubles saisies. La somme et le nombre des retours sont mis à jour en transaction ; aucun retour individuel n’est conservé. Une clé HMAC séparée évite les doublons, sans champ utilisateur ni score dans le journal. Le journal expire après la fenêtre de disponibilité de l’action et est purgé par le mécanisme existant. Aucune route REST générique n’expose les actions brutes ou les journaux. La visibilité des résultats est appliquée côté serveur.

## Vérifications

Typage et tests mobiles ; compilation Strapi ; tests unitaires des validations et du seuil après clôture ; intégration API avec une base temporaire isolée (rôles, champs forgés, transitions, réponses concurrentes, seuil et absence de données individuelles). Vérification mobile du parcours manager privé, de la publication et du suivi d’une action sur l’équipe fictive locale, et de la visibilité côté salarié.
