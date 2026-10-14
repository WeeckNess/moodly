// Même nombre de courbes et même repère (50, 50) pour tous les états.
const circle: number[] = [];
const radius = 26, step = Math.PI / 4, k = 4 / 3 * Math.tan(step / 4);
for (let i = 0; i < 8; i++) {
  const a = Math.PI + i * step, b = a + step;
  circle.push(50 + radius * (Math.cos(a) - k * Math.sin(a)), 50 + radius * (Math.sin(a) + k * Math.cos(a)),
    50 + radius * (Math.cos(b) + k * Math.sin(b)), 50 + radius * (Math.sin(b) - k * Math.cos(b)),
    50 + radius * Math.cos(b), 50 + radius * Math.sin(b));
}
const cloud = [
  22,43,28,36,37,38, 37,27,45,23,52,27, 59,26,66,33,65,40, 76,36,83,43,82,52,
  87,59,80,68,73,68, 66,72,57,72,50,72, 42,72,32,73,27,67, 18,67,16,58,23,51,
];
export function weatherPath(value: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, (5 - value) / 2));
  const mix = t * t * (3 - 2 * t);
  let path = `M ${24 - mix} ${50 + mix}`;
  for (let i = 0; i < circle.length; i += 6) {
    path += ' C';
    for (let j = 0; j < 6; j++) path += ` ${Math.round((circle[i + j] + (cloud[i + j] - circle[i + j]) * mix) * 100) / 100}`;
  }
  return path + ' Z';
}
