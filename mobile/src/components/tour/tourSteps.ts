export type TourRoute = 'home' | 'profile' | 'support' | 'self' | 'act';
export type TourStep = { id: string; route: TourRoute; target?: string; title: string; body: string; gesture?: 'swipe' | 'tap' };
export function tourSteps(manager: boolean): TourStep[] {
  const personal: TourStep[] = [
    { id: 'garden', route: 'profile', target: 'garden', title: 'Ton jardin grandit avec toi.', body: 'Chaque journée enregistrée fait avancer ton arbre, quel que soit ton moral. Aucune obligation de te sentir bien, aucune course à la régularité.' },
    { id: 'calendar', route: 'profile', target: 'calendar', title: 'Un souvenir, jour après jour.', body: 'Touche une date pour retrouver ta météo personnelle. Tes rapports sur 7 et 30 jours t’aident à prendre du recul. Cet historique reste sur ton appareil.', gesture: 'tap' },
    { id: 'support', route: 'support', target: 'support', title: 'Tu peux en parler.', body: 'Retrouve les interlocuteurs proposés par ton entreprise et prépare un premier échange. Tu décides de prendre contact : aucune alerte automatique à ton manager.' },
    { id: 'finish', route: 'profile', target: 'guide', title: 'À ton rythme, toujours.', body: 'Tu peux revoir cette visite depuis ton profil. Tu gardes le choix de participer et de prendre du temps pour toi.' },
  ];
  return [
    { id: 'welcome', route: 'home', title: 'On fait le tour ensemble ?', body: 'En moins d’une minute, découvre ta météo, ton espace personnel et les ressources à tes côtés.' },
    ...(manager ? [
      { id: 'team', route: 'home', target: 'manager-nav', title: 'Écouter ton équipe.', body: 'Mon équipe rassemble les tendances des 30 derniers jours, issues de Strapi. Une journée reste masquée sous cinq réponses. Aucune météo individuelle n’est accessible.' },
      { id: 'self', route: 'self', target: 'manager-nav', title: 'Ton équilibre compte aussi.', body: 'Dans Pour moi, prends ta météo personnelle, retrouve tes rapports et prépare tes propres échanges. Ta météo de manager reste privée sur cet appareil.', gesture: 'tap' },
      { id: 'act', route: 'act', target: 'manager-nav', title: 'De l’écoute aux actes.', body: 'Prépare une discussion, décide d’une action collective et fais son bilan avec l’équipe. Le ressenti ouvre une conversation, il ne mesure pas la performance.' },
    ] as TourStep[] : [
      { id: 'mood', route: 'home', target: 'mood', title: 'Un geste pour ta météo.', body: 'Fais glisser le curseur sur l’arc, de Très mal à Très bien. Si tu as déjà partagé aujourd’hui, « Refaire la sélection » permet un essai privé.', gesture: 'swipe' },
      { id: 'reasons', route: 'home', target: 'continue', title: 'Ce qui joue, si tu le souhaites.', body: 'Continuer ouvre les raisons facultatives. Les tags prédéfinis accompagnent la réponse collective ; ta raison libre reste un brouillon privé. La visite n’envoie aucune réponse.', gesture: 'tap' },
    ] as TourStep[]),
    { id: 'profile', route: 'home', target: 'profile', title: 'Ton espace, juste pour toi.', body: 'Cette icône ouvre ton jardin, ton calendrier, tes rapports personnels et tes réglages.', gesture: 'tap' },
    ...personal,
  ];
}
export type TourRect = { x: number; y: number; w: number; h: number };
export function fitTourRect(rect: TourRect, width: number, height: number): TourRect | null {
  if (rect.w <= 0 || rect.h <= 0 || rect.y >= height || rect.y + rect.h <= 0 || rect.x >= width || rect.x + rect.w <= 0) return null;
  const x = Math.max(8, rect.x - 6), y = Math.max(8, rect.y - 6);
  return { x, y, w: Math.max(0, Math.min(width - 8, rect.x + rect.w + 6) - x), h: Math.max(0, Math.min(height - 8, rect.y + rect.h + 6) - y) };
}
export function tourCardTop(rect: TourRect | null, height: number, cardHeight: number, inset: number) {
  const top = inset + 12, bottom = Math.max(top, height - cardHeight - inset - 12);
  if (!rect) return Math.max(top, (height - cardHeight) / 2);
  if (rect.y + rect.h + 16 + cardHeight <= height - inset - 12) return rect.y + rect.h + 16;
  if (rect.y - cardHeight - 16 >= top) return rect.y - cardHeight - 16;
  return rect.y + rect.h / 2 > height / 2 ? top : bottom;
}
