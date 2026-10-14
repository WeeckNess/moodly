import type { Role, Session, TeamStats } from './strapi';
export function localDay() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function demoSession(role: Role): Session { return { name: role === 'manager' ? 'Alex' : 'Camille', role, team: { name: 'Studio · Démonstration' }, submitted: false, day: localDay() }; }
export function demoStats(): TeamStats {
  const day = localDay();
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 29 + i);
    return { day: date.toISOString().slice(0, 10), average: i % 8 === 0 || i === 29 ? null : Math.round((3.7 + Math.sin(i / 4) * 0.7) * 100) / 100 };
  });
  return { data, meta: { team: 'Studio · Démonstration', threshold: 5, participation: 88, maskedDays: data.filter(d => d.average === null).length } };
}
