export function haloFrame(progress: number, size: number, reach: number) {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  const radius = size * 0.45 + (reach - size * 0.45) * p;
  const opacity = p < 0.12 ? 0.06 * p / 0.12 : p < 0.65 ? 0.06 - 0.035 * (p - 0.12) / 0.53 : 0.025 * (1 - p) / 0.35;
  // One uniform scale keeps the wave circular on the screen, without perspective.
  return { scale: radius / (size * 2.6 * 0.57 / 2), opacity };
}
