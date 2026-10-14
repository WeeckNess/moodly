export const TAGS = ['Charge', 'Ambiance', 'Sens', 'Équilibre', 'Reconnaissance', 'Outils'];
export const THRESHOLD = 5;
export const TIMEZONE = 'Europe/Paris';
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function dateRange(day: string, length = 30) {
  return Array.from({ length }, (_, i) => shiftDay(day, i - length + 1));
}
export function validateMood(data: unknown): { score: number; tags: string[] } | null {
  if (!data || typeof data !== 'object') return null;
  const input = data as Record<string, unknown>;
  if (Object.keys(input).some(key => !['score', 'tags'].includes(key))) return null;
  if (!Number.isInteger(input.score) || Number(input.score) < 1 || Number(input.score) > 5) return null;
  const tags = input.tags ?? [];
  if (!Array.isArray(tags) || tags.length > TAGS.length || tags.some(tag => !TAGS.includes(tag))) return null;
  return { score: Number(input.score), tags: [...new Set(tags)] };
}
export function safePoints(days: string[], aggregates: { day: string; responseCount: number; scoreSum: number }[]) {
  return days.map(day => {
    const item = aggregates.find(a => a.day === day);
    return { day, average: item && item.responseCount >= THRESHOLD ? Math.round(item.scoreSum / item.responseCount * 100) / 100 : null };
  });
}
