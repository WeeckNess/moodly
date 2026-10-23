import target from '../../demo-target.json';
import { shiftDay } from './mood';

const teams = ['atlas', 'horizon', 'boreale', 'plume'];
const sizes = [16, 12, 8, 4];
const counts = [3, 10, 22, 35, 55, 82, 105];
type Account = { email?: string; role?: { type?: string } };

// These histories are invented for the presentation, never reconstructed from anonymous moods.
export function demoProfileCount(user: Account, env: Record<string, string | undefined> = process.env): number | null {
  if (env.MOODLY_ENVIRONMENT !== 'demo' || env.MOODLY_DEPLOYMENT_PROJECT_ID !== target.vercelProjectId ||
      (env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== target.vercelProjectId)) return null;
  const match = /^(collaborateur([1-9]\d*)|manager(2)?)\.(atlas|horizon|boreale|plume)@demo\.eclaircie\.test$/.exec(user.email ?? '');
  if (!match) return null;
  const team = teams.indexOf(match[4]);
  const manager = match[1].startsWith('manager');
  const index = Number(manager ? match[3] ?? 1 : match[2]) - 1;
  if (user.role?.type !== (manager ? 'manager' : 'collaborateur') || index >= (manager ? (team === 0 ? 2 : 1) : sizes[team])) return null;
  return counts[(index + team * 3 + (manager ? 2 : 0)) % counts.length];
}

export function makeDemoPersonalProfile(count: number, day: string, labels: string[]) {
  const entries = Array.from({ length: Math.min(count, 29) }, (_, index) => ({
    day: shiftDay(day, index - Math.min(count, 29)),
    score: 1 + (index * 3 + count) % 5,
    tags: labels.length ? [labels[(index + count) % labels.length]] : [],
  }));
  return { version: 1 as const, entries, growth: { count, lastDay: shiftDay(day, -1) } };
}
