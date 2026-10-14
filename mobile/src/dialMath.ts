export const START_ANGLE = 150;
export const ARC_SWEEP = 240;
export function pointForValue(value: number, radius: number, centerX: number, centerY: number) {
  'worklet';
  const angle = (START_ANGLE + (Math.max(1, Math.min(5, value)) - 1) / 4 * ARC_SWEEP) * Math.PI / 180;
  return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
}
export function valueFromPoint(x: number, y: number, centerX: number, centerY: number) {
  'worklet';
  let angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  if (angle <= 30) angle += 360;
  else if (angle < START_ANGLE) angle = angle < 90 ? 390 : START_ANGLE;
  return Math.max(1, Math.min(5, 1 + (angle - START_ANGLE) / ARC_SWEEP * 4));
}

export function continuousValueFromPoint(x: number, y: number, centerX: number, centerY: number, previous: number) {
  'worklet';
  const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
  // L’ouverture n’est pas une boucle : ne pas sauter d’une extrémité à l’autre.
  if (angle > 30 && angle < 150) return previous >= 3 ? 5 : 1;
  return valueFromPoint(x, y, centerX, centerY);
}

// A distant tap travels the entire arc; reduced motion keeps a short continuous sweep.
export function sweepDuration(from: number, to: number, reduced = false) {
  'worklet';
  return reduced ? 120 : 160 + Math.abs(to - from) * 200;
}

// The interval excludes the departure point and includes the arrival point.
export function crossedStops(from: number, to: number): number[] {
  'worklet';
  const stops: number[] = [];
  if (to > from) {
    for (let stop = 1; stop <= 5; stop++) if (from < stop && to >= stop) stops.push(stop);
  } else if (to < from) {
    for (let stop = 5; stop >= 1; stop--) if (from > stop && to <= stop) stops.push(stop);
  }
  return stops;
}
