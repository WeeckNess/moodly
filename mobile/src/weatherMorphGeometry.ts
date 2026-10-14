type Frame = { fill: number[][][]; ink: number[][][] };

// Every icon has matching contour slots and vertices: each vertex actually moves.
export function weatherMorphPath(value: number, frames: Frame[], layer: 'fill' | 'ink') {
  'worklet';
  const position = Math.max(1, Math.min(5, value)) - 1;
  const index = Math.min(3, Math.floor(position));
  const fraction = position - index;
  const mix = fraction * fraction * (3 - 2 * fraction);
  const from = frames[index][layer], to = frames[index + 1][layer];
  let path = '';
  for (let ring = 0; ring < from.length; ring++) {
    for (let i = 0; i < from[ring].length; i++) {
      const a = from[ring][i], b = to[ring][i];
      const x = Math.round((a[0] + (b[0] - a[0]) * mix) * 100) / 100;
      const y = Math.round((a[1] + (b[1] - a[1]) * mix) * 100) / 100;
      path += `${i === 0 ? 'M' : 'L'}${x} ${y}`;
    }
    path += 'Z';
  }
  return path;
}
