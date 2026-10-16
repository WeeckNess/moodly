const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/svgTransform.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} }; new Function('module', 'exports', code)(loaded, loaded.exports);
const { svgMatrix, svgTransform } = loaded.exports;
test('Le profil utilise une matrice native et un attribut SVG valide sur web', () => {
  const native = svgTransform(false, 10, 20, 30, .5);
  assert.equal(native.matrix.length, 6); assert.equal('transform' in native, false);
  assert.ok(native.matrix.every(Number.isFinite));
  const web = svgTransform(true, 10, 20, 30, .5);
  assert.match(web.transform, /^matrix\(/); assert.equal('matrix' in web, false);
});
test('Le balancement garde le pied de l’arbre fixe et supporte une croissance depuis zéro', () => {
  for (const angle of [-.7, 0, .7]) {
    const [a, b, c, d, x, y] = svgMatrix(0, 0, angle, 1, 160, 220);
    assert.ok(Math.abs(a * 160 + c * 220 + x - 160) < 1e-9);
    assert.ok(Math.abs(b * 160 + d * 220 + y - 220) < 1e-9);
  }
  assert.deepEqual(svgMatrix(20, 30, 0, 0).map(value => Object.is(value, -0) ? 0 : value), [0, 0, 0, 0, 20, 30]);
});
