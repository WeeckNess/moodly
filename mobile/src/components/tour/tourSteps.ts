export type TourRoute = 'home' | 'profile' | 'support' | 'self' | 'act';
export type TourSceneKind = 'welcome' | 'mood' | 'reasons' | 'profile' | 'garden' | 'calendar' | 'support' | 'team' | 'self' | 'act' | 'finish';
export type TourStep = { id: TourSceneKind; chapter: string; title: string; body: string; hint: string };

export function tourSteps(manager: boolean): TourStep[] {
  return [
    { id: 'welcome', chapter: manager ? 'APPRENDRE À UTILISER ÉCLAIRCIE' : 'UN MOMENT POUR TOI', title: 'Un petit tour.\nÀ ton rythme.', body: 'Découvre les gestes essentiels d’Éclaircie. Tu peux passer la visite et la retrouver dans ton profil.', hint: 'Une minute pour prendre tes repères' },
    ...(manager ? [
      { id: 'team', chapter: 'ÉCOUTER LE COLLECTIF', title: 'Une tendance.\nPas des personnes.', body: 'Retrouve la météo de ton équipe sur 30 jours. En dessous de cinq réponses, la journée est masquée. Aucun ressenti individuel n’est visible.', hint: 'Les données restent collectives' },
      { id: 'self', chapter: 'TON ÉQUILIBRE AUSSI', title: 'Manager.\nEt humain, surtout.', body: 'L’espace « Pour moi » accueille ta propre météo, ton jardin et tes rapports. Ce ressenti reste privé sur ton appareil.', hint: 'Ton espace personnel reste à toi' },
      { id: 'act', chapter: 'DE L’ÉCOUTE AUX ACTES', title: 'Un petit pas.\nEnsemble.', body: 'Prépare une discussion, propose une action et fais le bilan avec l’équipe. Le moral ouvre le dialogue, il ne mesure pas la performance.', hint: 'Écouter · agir · faire le bilan' },
    ] as TourStep[] : [
      { id: 'mood', chapter: '01 / TA MÉTÉO', title: 'Un geste.\nCe que tu ressens.', body: 'Fais glisser le curseur de l’orage au soleil. Toutes les météos ont leur place, même les jours plus difficiles.', hint: 'Suis le rond lumineux, puis essaie à ton tour' },
      { id: 'reasons', chapter: '02 / CE QUI JOUE', title: 'Un peu de contexte.\nSi tu en as envie.', body: 'Après ta météo, choisis des raisons facultatives. Ta propre raison reste un brouillon privé, puis s’efface après l’envoi.', hint: 'Tu peux aussi continuer sans raison' },
    ] as TourStep[]),
    { id: 'profile', chapter: 'TON ESPACE PERSONNEL', title: 'Tout commence\npar toi.', body: 'L’icône de profil ouvre ton jardin, ton calendrier et tes rapports personnels. Tu y retrouves aussi tes réglages.', hint: 'Le profil, en haut à droite de l’app' },
    { id: 'garden', chapter: 'PRENDRE LE TEMPS', title: 'Jour après jour,\nça prend racine.', body: 'Chaque journée enregistrée fait grandir ton arbre, quel que soit ton moral. Sans série à tenir, sans obligation de te sentir bien.', hint: 'Ta progression suit le temps, pas ta note' },
    { id: 'calendar', chapter: 'PRENDRE DU RECUL', title: 'Tes journées.\nUn peu de recul.', body: `Touche une date pour retrouver ta météo. Les rapports sur 7 et 30 jours éclairent ta tendance personnelle, ${manager ? 'uniquement ' : ''}sur ton appareil.`, hint: 'Un souvenir personnel pour chaque jour partagé' },
    ...(!manager ? [
      { id: 'support', chapter: 'NE PAS RESTER SEUL', title: 'Une conversation\npeut tout changer.', body: 'Retrouve les contacts proposés par ton entreprise. Tu choisis de prendre contact : aucune alerte automatique à ton manager.', hint: 'Toi seul décides de faire le premier pas' },
    ] as TourStep[] : []),
    { id: 'finish', chapter: 'TE VOILÀ CHEZ TOI', title: 'On commence\npar ta journée ?', body: 'Tu gardes le choix de participer. Cette visite reste accessible depuis ton profil, quand tu en as besoin.', hint: 'La visite n’a envoyé aucune réponse' },
  ];
}

// Reserve space for text and fixed controls before sizing the illustration.
export function tourLayout(width: number, height: number, top: number, bottom: number) {
  const wide = width >= 900 && height >= 620;
  const compact = height - top - bottom < 700;
  const gutter = width < 360 ? 20 : 28;
  const stageHeight = wide ? Math.min(440, height - top - bottom - 190) : Math.min(310, Math.max(152, height - top - bottom - 440), (width - gutter * 2) * 300 / 360);
  return { wide, compact, gutter, stageHeight };
}
