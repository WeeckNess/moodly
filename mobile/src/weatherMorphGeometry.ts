type Frame = { fill: number[][][]; ink: number[][][] };

// Tiny contour deformations, anchored at the icon centre. No rotation or translation
// of the whole symbol. Outer and inner rings share the same breathing transform.
export function contourLife(frame: number, ring: number, phase: number) {
  'worklet';
  const breath = Math.sin(phase);
  const rays = frame === 4 && ring >= 2 ? Math.sin(phase * 2) * .025 : 0;
  return { x: 1 + breath * .008 + rays, y: 1 - breath * .006 + rays };
}
export function detailDrift(frame: number, y: number, phase: number) {
  'worklet';
  const lower = Math.max(0, Math.min(1, (y - 165) / 35));
  if (lower === 0) return 0;
  if (frame === 1) return lower * Math.sin(phase * 3) * 3;
  if (frame === 0) return lower * Math.sin(phase * 2) * 1.4;
  return 0;
}

// Every icon has matching contour slots and vertices: each vertex actually moves.
export function weatherMorphPath(value: number, frames: Frame[], layer: 'fill' | 'ink', phase = 0) {
  'worklet';
  const position = Math.max(1, Math.min(5, value)) - 1;
  const index = Math.min(3, Math.floor(position));
  const fraction = position - index;
  const mix = fraction * fraction * fraction * (fraction * (fraction * 6 - 15) + 10);
  const from = frames[index][layer], to = frames[index + 1][layer];
  let path = '';
  for (let ring = 0; ring < from.length; ring++) {
    // Empty Phosphor slots stay empty; don't send 96 identical vertices per slot.
    if (from[ring].every(point => point[0] === 128 && point[1] === 128) && to[ring].every(point => point[0] === 128 && point[1] === 128)) {
      path += 'M128 128Z';
      continue;
    }
    const fromLife = contourLife(index, ring, phase);
    const toLife = contourLife(index + 1, ring, phase);
    for (let i = 0; i < from[ring].length; i++) {
      const a = from[ring][i], b = to[ring][i];
      const ax = 128 + (a[0] - 128) * fromLife.x, bx = 128 + (b[0] - 128) * toLife.x;
      const ay = 128 + (a[1] - 128) * fromLife.y + detailDrift(index, a[1], phase);
      const by = 128 + (b[1] - 128) * toLife.y + detailDrift(index + 1, b[1], phase);
      const x = Math.round((ax + (bx - ax) * mix) * 100) / 100;
      const y = Math.round((ay + (by - ay) * mix) * 100) / 100;
      path += `${i === 0 ? 'M' : 'L'}${x} ${y}`;
    }
    path += 'Z';
  }
  return path;
}
