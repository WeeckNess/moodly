export type SupportState = { lowDays: string[]; promptedOn: string | null };
export function nextSupportState(previous: SupportState, day: string, score: number) {
  const cutoff = new Date(`${day}T12:00:00Z`); cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  const start = cutoff.toISOString().slice(0, 10);
  const days = previous.lowDays.filter(d => d >= start && d <= day);
  if (score === 1 && !days.includes(day)) days.push(day);
  const shouldPrompt = score === 1 && days.length >= 3 && (!previous.promptedOn || !days.includes(previous.promptedOn));
  return { state: { lowDays: days.slice(-3), promptedOn: shouldPrompt ? day : previous.promptedOn }, shouldPrompt };
}
