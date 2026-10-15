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

export function personalReport(entries: PersonalMood[], end: string, length: number) {
  const start = new Date(end + 'T12:00:00Z'); start.setUTCDate(start.getUTCDate() - length + 1);
  const days = retainPersonalMoods(entries, end).filter(entry => entry.day >= start.toISOString().slice(0, 10));
  const tags = new Map<string, number>();
  for (const entry of days) for (const tag of new Set(entry.tags)) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  return { count: days.length, average: days.length ? days.reduce((sum, entry) => sum + entry.score, 0) / days.length : null, tags: [...tags].sort((a, b) => b[1] - a[1]).slice(0, 3) };
}
export type Growth = { count: number; lastDay: string | null };
export function advanceGrowth(previous: Growth, day: string): Growth {
  if (!isDay(day) || (previous.lastDay !== null && day <= previous.lastDay)) return previous;
  return { count: previous.count + 1, lastDay: day };
}
export function growthStage(count: number) { return count < 1 ? 0 : count < 5 ? 1 : count < 12 ? 2 : count < 24 ? 3 : 4; }
