const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Seul le pont SVG natif est remplacé : les composants et tracés Lucide sont réels.
const load = Module._load;
const svg = Object.fromEntries(['Svg', 'Path', 'Circle', 'Rect', 'Line', 'Polyline', 'Polygon', 'Ellipse', 'G'].map(name => [name, name.toLowerCase()]));
let icons;
try {
  Module._load = function (id, ...args) { return id === 'react-native-svg' ? svg : load.call(this, id, ...args); };
  icons = require('lucide-react-native');
} finally { Module._load = load; }
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/tagIcons.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleForTest = { exports: {} };
new Function('module', 'exports', 'require', code)(moduleForTest, moduleForTest.exports, id => {
  assert.equal(id, 'lucide-react-native'); return icons;
});
const { tagIcon } = moduleForTest.exports;

test('Une icône Lucide choisie hors de l’ancienne liste produit son véritable tracé SVG', () => {
  for (const [name, Icon] of [['alarm-clock', icons.AlarmClock], ['chart-no-axes-gantt', icons.ChartNoAxesGantt], ['a-arrow-down', icons.AArrowDown], ['map-pin-house', icons.MapPinHouse], ['arrow-down-a-z', icons.ArrowDownAZ], ['alarm-check', icons.AlarmClockCheck]]) {
    assert.equal(tagIcon(name), Icon, name);
    const markup = renderToStaticMarkup(React.createElement(tagIcon(name), { size: 24, color: '#123456' }));
    assert.match(markup, /<svg/); assert.match(markup, /<(path|circle|rect|line|polyline)/); assert.match(markup, /#123456/);
  }
});

test('Les anciennes icônes sont compatibles et une icône inconnue utilise le repli', () => {
  assert.equal(tagIcon('chat'), icons.MessageCircle);
  assert.equal(tagIcon('scales'), icons.Scale);
  assert.equal(tagIcon('unknown-future-icon'), icons.Compass);
  assert.equal(tagIcon('__proto__'), icons.Compass);
});
