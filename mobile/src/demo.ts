export type Role = 'collaborateur' | 'manager';
export type DailyStat = { day: string; average: number | null };
export const tags = ['Charge', 'Ambiance', 'Sens', 'Équilibre', 'Reconnaissance', 'Outils'];
// Fixtures uniquement : aucune réponse réelle ne quitte le téléphone.
export function demoStats(): DailyStat[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - 29 + i);
    const count = i % 7 === 0 ? 3 : 8;
    return { day: day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), average: count < 5 ? null : Math.round((3.6 + Math.sin(i / 3) * 0.5 - i * 0.015) * 10) / 10 };
  });
}
