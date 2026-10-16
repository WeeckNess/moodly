// SVG groups take a six-value affine matrix on native, and an SVG attribute on web.
// Sending SVG rotate/translate strings to Reanimated's native CSS parser is invalid.
export function svgMatrix(x: number, y: number, degrees: number, scale = 1, originX = 0, originY = 0): number[] {
  'worklet';
  const angle = degrees * Math.PI / 180, a = Math.cos(angle) * scale, b = Math.sin(angle) * scale;
  return [a, b, -b, a, x + originX - a * originX + b * originY, y + originY - b * originX - a * originY];
}
export function svgTransform(web: boolean, x: number, y: number, degrees: number, scale = 1, originX = 0, originY = 0): { transform?: string; matrix?: number[] } {
  'worklet';
  const matrix = svgMatrix(x, y, degrees, scale, originX, originY);
  return web ? { transform: `matrix(${matrix.join(' ')})` } : { matrix };
}
