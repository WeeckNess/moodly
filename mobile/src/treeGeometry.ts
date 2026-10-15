export type TreeSpecies = 'oak' | 'willow' | 'pine';
export const treeSpecies = [
  { id: 'oak' as const, name: 'Chêne', description: 'Une couronne ronde, des branches généreuses.' },
  { id: 'willow' as const, name: 'Saule', description: 'Un port souple, un feuillage qui retombe doucement.' },
  { id: 'pine' as const, name: 'Pin', description: 'Une silhouette élancée, des étages de verdure.' },
];
export function isTreeSpecies(value: unknown): value is TreeSpecies { return value === 'oak' || value === 'willow' || value === 'pine'; }
export function clamp(value: number, low = 0, high = 1) { 'worklet'; return Math.max(low, Math.min(high, value)); }
export function mix(a: number, b: number, amount: number) { 'worklet'; return a + (b - a) * amount; }
export function ramp(day: number, start: number, end: number) { 'worklet'; const t = clamp((day - start) / (end - start)); return t * t * (3 - 2 * t); }
export function trunkHeight(day: number, pine: number) { 'worklet'; return 35 * ramp(day, 0, 1) + (88 + pine * 12) * ramp(day, 1, 24); }
export function treeProgress(day: number) { 'worklet'; return clamp(day, 0, 60); }
// All essences share 48 vertices per leaf mass and identical path commands.
// This makes species changes an actual contour morph, including midway through growth.
const pinePolygon = [[0, -1], [.27, -.52], [.12, -.52], [.55, -.05], [.3, -.05], [.92, .65], [.4, .65], [.4, .88], [-.4, .88], [-.4, .65], [-.92, .65], [-.3, -.05], [-.55, -.05], [-.12, -.52], [-.27, -.52]];
function samplePolygon(points: number[][], count: number) {
  const lengths = points.map((p, i) => Math.hypot(p[0] - points[(i + 1) % points.length][0], p[1] - points[(i + 1) % points.length][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, (_, i) => { let offset = i * total / count, edge = 0; while (offset > lengths[edge] && edge < lengths.length - 1) { offset -= lengths[edge]; edge++; } const p = points[edge], q = points[(edge + 1) % points.length]; return [mix(p[0], q[0], offset / lengths[edge]), mix(p[1], q[1], offset / lengths[edge])]; });
}
export const treeContours = [
  Array.from({ length: 48 }, (_, i) => { const angle = -Math.PI / 2 + i / 48 * Math.PI * 2; const lobe = 1 + .055 * Math.cos(angle * 7); return [Math.cos(angle) * lobe, Math.sin(angle) * lobe]; }),
  Array.from({ length: 48 }, (_, i) => { const angle = -Math.PI / 2 + i / 48 * Math.PI * 2; return [Math.cos(angle) * .75, Math.sin(angle) * 1.25]; }),
  samplePolygon(pinePolygon, 48),
];
export function speciesWeights(species: number) { 'worklet'; return [clamp(1 - Math.abs(species)), clamp(1 - Math.abs(species - 1)), clamp(1 - Math.abs(species - 2))]; }
// Stable branches: two shoot leaves become the first canopy masses; later branches unfold progressively.
const anchors = [
  [-28, -82, 31, 28, 0], [29, -101, 34, 30, 0], [0, -131, 34, 31, 3], [-57, -112, 32, 29, 6], [56, -111, 32, 29, 8], [-29, -145, 29, 26, 11], [29, -151, 31, 28, 14],
];
export function canopyPath(day: number, species: number, index: number, breeze = 0) {
  'worklet';
  const d = treeProgress(day), weights = speciesWeights(species), a = anchors[index];
  const emerge = ramp(d, index < 2 ? 0 : a[4], index < 2 ? 1 : a[4] + 9);
  const mature = ramp(d, 1, 24);
  const shoot = ramp(d, 0, 1);
  const willow = weights[1], pine = weights[2];
  const x = 160 + a[0] * mix(.36, 1 - pine, mature);
  const trunk = trunkHeight(d, pine);
  const y = mix(211 - trunk * .75, mix(220 + a[1] + willow * (index % 2 ? 10 : 20), [148, 118, 87, 110, 110, 80, 80][index], pine), mature);
  const rx = mix(index < 2 ? 12 * shoot : 0, mix(a[2] * (1 + willow * .1), [62, 48, 34, 30, 30, 24, 24][index], pine), mature) * emerge;
  const ry = mix(index < 2 ? 5 * shoot : 0, mix(a[3], [46, 39, 35, 30, 30, 25, 25][index], pine), mature) * emerge;
  const points: number[][] = [];
  for (let i = 0; i < 48; i++) {
    let px = 0, py = 0;
    for (let n = 0; n < 3; n++) { px += treeContours[n][i][0] * weights[n]; py += treeContours[n][i][1] * weights[n]; }
    // The initial two leaves tilt towards the stem before opening into their mature crown shape.
    const angle = (index === 0 ? -.55 : .55) * (1 - mature) + breeze * .012 * (1 + willow);
    const ox = px * rx, oy = py * ry;
    points.push([x + ox * Math.cos(angle) - oy * Math.sin(angle), y + ox * Math.sin(angle) + oy * Math.cos(angle)]);
  }
  // Rounded quadratic segments remain topologically identical at every frame.
  let path = `M${(points[47][0] + points[0][0]) / 2},${(points[47][1] + points[0][1]) / 2}`;
  for (let i = 0; i < 48; i++) { const p = points[i], q = points[(i + 1) % 48]; path += `Q${p[0]},${p[1]} ${(p[0] + q[0]) / 2},${(p[1] + q[1]) / 2}`; }
  return path + 'Z';
}
export function trunkPath(day: number, species: number) {
  'worklet'; const w = speciesWeights(species), height = trunkHeight(treeProgress(day), w[2]), curve = w[1] * 9 - w[0] * 3;
  return `M160,220 C${156 + curve},${220 - height * .3} ${160 + curve},${220 - height * .7} 160,${220 - height}`;
}
export function branchPath(day: number, species: number, index: number) {
  'worklet'; const d = treeProgress(day), a = anchors[index], w = speciesWeights(species), extent = ramp(d, index < 2 ? 1 : a[4], index < 2 ? 6 : a[4] + 8);
  const mature = ramp(d, 1, 24), trunk = trunkHeight(d, w[2]);
  const startY = 220 - trunk * (.45 + index * .045);
  const endX = 160 + a[0] * (1 - w[2] * .4) * extent;
  const endY = mix(startY, 220 + a[1] + w[1] * (index % 2 ? 10 : 20) - w[2] * index * 2, extent * mature);
  return `M160,${startY} Q${mix(160, endX, .8)},${startY - 8 * extent} ${endX},${endY}`;
}
