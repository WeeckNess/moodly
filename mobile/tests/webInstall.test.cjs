const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../public');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
function pngSize(file) { const data = fs.readFileSync(file); assert.equal(data.subarray(1, 4).toString(), 'PNG'); return [data.readUInt32BE(16), data.readUInt32BE(20)]; }
test('L’installation ouvre notre application dans une fenêtre dédiée, sans sortir de son domaine', () => {
  assert.equal(manifest.id, '/'); assert.equal(manifest.scope, '/'); assert.equal(manifest.start_url, '/');
  assert.equal(manifest.display, 'standalone'); assert.ok(manifest.display_override.includes('fullscreen'));
  for (const icon of manifest.icons) {
    assert.match(icon.src, /^\/icons\/[\w-]+\.png$/);
    assert.equal(pngSize(path.join(root, icon.src)).join('x'), icon.sizes);
  }
  for (const size of ['192x192', '512x512']) assert.ok(manifest.icons.some(icon => icon.sizes === size && icon.purpose.includes('any')));
});
test('La page exportable déclare le manifeste, le mode iPhone et les zones sûres sans bloquer le zoom', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /viewport-fit=cover/);
  assert.ok(!/user-scalable=no|maximum-scale=1/.test(html));
  assert.match(html, /<html lang="fr">/);
  assert.deepEqual(pngSize(path.join(root, 'icons/apple-touch-icon.png')), [180, 180]);
});
