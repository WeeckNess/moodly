# Signature tactile Éclaircie

Les retours natifs utilisent Expo Haptics, avec une seule intensité par interaction pour toutes les météos. Il n’y a aucun signal de sanction lié à une note basse.

- Arc : cran marqué au passage exact d’un point entier ; cran plus net à l’arrivée d’un balayage rapide ou d’un grand déplacement, en remplacement du cran normal, sans seconde impulsion au même point. Les crans sont espacés d’au moins 42 ms.
- Raisons : impulsion rigide à l’ajout, plus légère au retrait.
- Confirmation : deux impulsions Medium puis Heavy sur iOS à 95 ms d’intervalle après réussite de l’enregistrement. Aucun signal de succès pour une erreur, un doublon refusé ou la fin d’un essai privé.
- Nouvelle étape du jardin : deux impulsions supplémentaires après la confirmation, sans chevauchement. Les seuils incluent la floraison, les fruits et l’abondance. Dans la simulation du jardin, le retour accompagne le début d’une transformation vers une nouvelle étape. Ouvrir un jardin déjà enregistré ou changer d’essence ne relance pas cette célébration.

Sur iOS : impacts Medium et Heavy pour les crans et validations, Rigid à l’ajout d’une raison et Light au retrait. Sur Android : effets natifs Segment_Tick, Confirm, Virtual_Key, Toggle_Off et Context_Click. Les erreurs d’un matériel non compatible sont ignorées ; l’interaction reste fonctionnelle.

- Navigation : impact Heavy sur iOS et Long_Press sur Android lors des changements de page, des onglets manager, de la connexion/déconnexion, du passage météo/raisons et du retour dans l’essai privé. Aucun impact au premier affichage ou si on reste sur la même page. Les transitions rapprochées sont limitées à un impact toutes les 180 ms ; une confirmation en cours garde la priorité.

## Réglage

Le profil propose « Vibrations tactiles » et, sur téléphone, « Essayer la signature tactile ». La préférence est conservée sur cet appareil via AsyncStorage ; elle ne contient aucune donnée de santé. Elle s’applique à tous les espaces de l’app. Aucun retour ne joue avant son chargement, dans le navigateur ou quand l’app est en arrière-plan. Désactiver les vibrations ou quitter l’app annule les impulsions différées.

Les séquences de confirmation ont priorité sur les crans et les sélections pour éviter les superpositions. Les timers sont annulés au démontage de l’app.

## Validation

Tests automatisés avec horloge et moteur tactile simulés : double confirmation, signatures Android distinctes, limitation des crans, préférence persistée, annulation des impulsions, absence de vibration avant chargement, sur web et en arrière-plan. Contrôle du réglage dans le navigateur et exports Expo web/iOS/Android. Le porteur du projet confirme le 20 octobre 2026 que les essais sur téléphone fonctionnent ; voir [validation.md](validation.md) pour la provenance et les limites de cette validation.
