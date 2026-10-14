// Samples the installed Phosphor duotone SVG artwork into compatible contour meshes.
// Regenerate with: node scripts/build-weather-morph.cjs
const fs = require('node:fs');
const path = require('node:path');
const svgpath = require('svgpath');
const { svgPathProperties } = require('svg-path-properties');
const names = ['CloudLightning', 'CloudRain', 'Cloud', 'CloudSun', 'Sun'];
const COUNT = 96;
function area(points) { return points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2; }
function contours(d) {
  const absolute = svgpath(d).abs().unarc().unshort().toString();
  return absolute.split(/(?=M)/).filter(Boolean).map(ring => {
    const properties = new svgPathProperties(ring);
    const length = properties.getTotalLength();
    let points = Array.from({ length: COUNT }, (_, i) => { const p = properties.getPointAtLength(length * i / COUNT); return [p.x, p.y]; });
    if (area(points) < 0) points.reverse();
    return points;
  }).sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
}
function align(points, previous) {
  let offset = 0, best = Infinity;
  for (let shift = 0; shift < COUNT; shift++) {
    let cost = 0;
    for (let i = 0; i < COUNT; i++) { const p = points[(i + shift) % COUNT], q = previous[i]; cost += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; }
    if (cost < best) { best = cost; offset = shift; }
  }
  return points.map((_, i) => points[(i + offset) % COUNT]);
}
const frames = names.map(name => {
  const source = fs.readFileSync(path.join(__dirname, '../node_modules/phosphor-react-native/src/defs', name + '.tsx'), 'utf8');
  const duotone = source.split("'duotone',")[1].split("'fill',")[0];
  const paths = [...duotone.matchAll(/d="([^"]+)"/g)].map(match => match[1]);
  const result = { fill: contours(paths[0]), ink: contours(paths[1]) };
  console.log(name, 'fill:', result.fill.length, 'ink:', result.ink.length);
  return result;
});
for (const layer of ['fill', 'ink']) {
  const count = Math.max(...frames.map(frame => frame[layer].length));
  for (let slot = 0; slot < count; slot++) {
    let previous;
    for (const frame of frames) {
      let points = frame[layer][slot];
      if (!points) points = Array.from({ length: COUNT }, () => [128, 128]);
      if (previous) points = align(points, previous);
      frame[layer][slot] = points.map(p => p.map(n => Math.round(n * 1000) / 1000));
      previous = points;
    }
  }
}
fs.writeFileSync(path.join(__dirname, '../src/weatherContours.ts'), '// Generated from Phosphor Icons (MIT). See scripts/build-weather-morph.cjs.\nexport const weatherContours = ' + JSON.stringify(frames) + ';\n');
