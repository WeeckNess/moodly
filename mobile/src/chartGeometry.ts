type Day = { day: string; average: number | null };
export function chartSegments(data: Day[], width: number, height: number) {
  const x = (i: number) => 28 + i * (width - 44) / Math.max(data.length - 1, 1);
  const y = (v: number) => height - 32 - (v - 1) / 4 * (height - 48);
  const segments = [];
  for (let i = 1; i < data.length; i++) {
    const previous = data[i - 1].average, current = data[i].average;
    if (previous !== null && current !== null) segments.push({ from: i - 1, to: i, x1: x(i - 1), y1: y(previous), x2: x(i), y2: y(current) });
  }
  return segments;
}
export function visibleMean(data: Day[]) {
  const values = data.filter(d => d.average !== null);
  return values.length ? values.reduce((sum, d) => sum + d.average!, 0) / values.length : null;
}
