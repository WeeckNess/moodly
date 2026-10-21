const test = require('node:test'), assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), path = require('node:path');
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/gardenAnimation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText)(moduleUnderTest, moduleUnderTest.exports);
const api = moduleUnderTest.exports;
const nodes = require('../src/gardenArtwork.json');
const tracks = []; function visit(node) { if (node.track) tracks.push(node); node.children?.forEach(visit); } nodes.forEach(visit);
test('Les 628 séquences du dessin fourni sont conservées sans DOM ni SMIL', () => {
  assert.equal(tracks.length, 628);
  const counts = {}; tracks.forEach(node => { counts[node.track.kind] = (counts[node.track.kind] ?? 0) + 1; });
  assert.equal(counts.leaf, 392); assert.equal(counts.root, 10); assert.equal(counts.petal, 120);
  assert.ok(!JSON.stringify(nodes).includes('animateTransform'));
  for (const node of tracks) {
    assert.ok(node.track.end > node.track.start);
    if (node.tag === 'path') {
      assert.ok(node.track.length > 0);
      assert.deepEqual(node.props.strokeDasharray, [node.track.length, node.track.length]);
      assert.equal(api.gardenTrackState(node.track, 0).opacity, 0);
      assert.equal(api.gardenTrackState(node.track, 100).strokeDashoffset, 0);
    }
  }
});
test('La pousse et l’épaisseur progressent continûment, dans les deux sens', () => {
  const node = tracks.find(node => node.track.kind === 'trunk'), t = node.track;
  const a = api.gardenTrackState(t, t.start), b = api.gardenTrackState(t, (t.start + t.end) / 2), c = api.gardenTrackState(t, t.end);
  assert.equal(a.amount, 0); assert.equal(b.amount, .5); assert.equal(c.amount, 1);
  assert.ok(b.strokeDashoffset > c.strokeDashoffset && b.strokeDashoffset < a.strokeDashoffset);
  assert.ok(api.gardenTrackState(t, 100).strokeWidth > b.strokeWidth);
  assert.equal(api.gardenTrackMoves(t, 0, 100), true);
  assert.equal(api.gardenTrackMoves(t, 100, 0), true);
  assert.equal(api.gardenTrackMoves(t, 100, 100), false);
  assert.equal(api.gardenTrackMoves(t, t.end, t['width-end']), true);
});
test('Les journées pilotent seules la progression et les repères correspondent au nouvel arbre', () => {
  assert.equal(api.gardenPercent(-1), 0); assert.equal(api.gardenPercent(32.5), 32.5);
  assert.equal(api.gardenPercent(130), 100); assert.equal(api.gardenPercent(NaN), 0);
  assert.equal(api.botanicalStage(12).label, 'Racines');
  assert.equal(api.botanicalStage(65).label, 'Feuillage');
  assert.equal(api.botanicalStage(100).label, 'Épanoui');
});
