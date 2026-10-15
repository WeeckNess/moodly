export type PersonalMood = { day: string; score: number; tags: string[] };
export function retainPersonalMoods(entries: PersonalMood[], today: string): PersonalMood[] {
  const end = new Date(today + 'T12:00:00Z');
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 29);
  const first = start.toISOString().slice(0, 10);
  const days = new Map<string, PersonalMood>();
  for (const entry of entries) if (isDay(entry.day) && entry.day >= first && entry.day <= today && Number.isInteger(entry.score) && entry.score >= 1 && entry.score <= 5 && Array.isArray(entry.tags)) days.set(entry.day, { day: entry.day, score: entry.score, tags: entry.tags.filter(tag => typeof tag === 'string') });
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day));
}
export function personalTrend(entries: PersonalMood[], today: string) {
  const start = new Date(today + 'T12:00:00Z'); start.setUTCDate(start.getUTCDate() - 6);
  const days = retainPersonalMoods(entries, today).filter(entry => entry.day >= start.toISOString().slice(0, 10));
  return { count: days.length, average: days.length ? days.reduce((sum, entry) => sum + entry.score, 0) / days.length : null };
}
export function monthCells(month: string): (string | null)[] {
  const first = new Date(month + '-01T12:00:00Z');
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function isDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(day + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day;
}
