export type GardenTrack = { kind: string; start: number; end: number; length?: number; 'width-from'?: number; 'width-to'?: number; 'width-start'?: number; 'width-end'?: number };
export function gardenPercent(days: number) { 'worklet'; return Number.isFinite(days) ? Math.max(0, Math.min(100, days)) : 0; }
export function gardenEase(value: number, start: number, end: number) {
  'worklet'; const t = Math.max(0, Math.min(1, (value - start) / (end - start))); return t * t * (3 - 2 * t);
}
export function gardenTrackState(track: GardenTrack, progress: number) {
  'worklet';
  const amount = gardenEase(progress, track.start, track.end);
  return {
    amount,
    opacity: progress > track.start ? 1 : 0,
    strokeDashoffset: (track.length ?? 0) * (1 - amount),
    strokeWidth: track['width-from'] === undefined ? undefined : track['width-from'] + (track['width-to']! - track['width-from']) * gardenEase(progress, track['width-start']!, track['width-end']!),
  };
}
export function gardenTrackMoves(track: GardenTrack, from: number, to: number) {
  const low = Math.min(from, to), high = Math.max(from, to);
  return low !== high && ((low < track.end && high > track.start) || (track['width-start'] !== undefined && low < track['width-end']! && high > track['width-start']));
}

export const botanicalMilestones = [
  { day: 0, label: 'Graine' }, { day: 7, label: 'Racines' },
  { day: 19, label: 'Première pousse' }, { day: 28, label: 'Branches' },
  { day: 48, label: 'Feuillage' }, { day: 76, label: 'Floraison' },
  { day: 100, label: 'Épanoui' },
];
export function botanicalStage(days: number) { return [...botanicalMilestones].reverse().find(step => days >= step.day) ?? botanicalMilestones[0]; }
