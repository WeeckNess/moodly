export const START_ANGLE = 150;
export const ARC_SWEEP = 240;
export function pointForValue(value: number, radius: number, centerX: number, centerY: number) {
  const angle = (START_ANGLE + (Math.max(1, Math.min(5, value)) - 1) / 4 * ARC_SWEEP) * Math.PI / 180;
  return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
}
export function valueFromPoint(x: number, y: number, centerX: number, centerY: number) {
  let angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  if (angle <= 30) angle += 360;
  else if (angle < START_ANGLE) angle = angle < 90 ? 390 : START_ANGLE;
  return Math.max(1, Math.min(5, 1 + (angle - START_ANGLE) / ARC_SWEEP * 4));
}
