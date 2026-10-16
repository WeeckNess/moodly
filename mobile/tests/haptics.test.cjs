const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
function harness(os = 'ios', preference = null) {
  let now = 1000, index = 0, onState;
  const pending = new Map(), calls = [], storage = new Map(preference === null ? [] : [['eclaircie.preferences.haptics', preference]]);
  const state = { currentState: 'active', addEventListener: (_, callback) => { onState = callback; return { remove() {} }; } };
  const enums = Object.fromEntries(['Light', 'Soft', 'Rigid', 'Medium', 'Heavy', 'Segment_Tick', 'Confirm', 'Virtual_Key', 'Long_Press', 'Clock_Tick', 'Gesture_End', 'Toggle_On', 'Toggle_Off', 'Keyboard_Tap', 'Context_Click'].map(key => [key, key]));
  const imports = { 'react-native': { Platform: { OS: os }, AppState: state }, '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => storage.set(key, value) } }, 'expo-haptics': { ImpactFeedbackStyle: enums, AndroidHaptics: enums, impactAsync: async style => calls.push([now, style]), performAndroidHapticsAsync: async style => calls.push([now, style]) } };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/haptics.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', 'Date', 'setTimeout', 'clearTimeout', code)(module, module.exports, key => imports[key], { now: () => now }, (fn, delay) => { const id = ++index; pending.set(id, { fn, due: now + delay }); return id; }, id => pending.delete(id));
  function advance(ms) { const end = now + ms; while (true) { const next = [...pending].sort((a, b) => a[1].due - b[1].due)[0]; if (!next || next[1].due > end) break; pending.delete(next[0]); now = next[1].due; next[1].fn(); } now = end; }
  return { api: module.exports, calls, storage, advance, background() { state.currentState = 'background'; onState?.('background'); } };
}
test('La confirmation joue deux impulsions distinctes, sans chevauchement des crans', async () => {
  const h = harness(); await h.api.initializeHaptics(); h.api.haptics.confirm(); h.api.haptics.detent();
  assert.deepEqual(h.calls, [[1000, 'Medium']]); h.advance(95); assert.deepEqual(h.calls, [[1000, 'Medium'], [1095, 'Heavy']]);
  h.api.haptics.detent(); assert.equal(h.calls.length, 2);
});
test('Les crans, arrivées et sélections utilisent des signatures différentes', async () => {
  const h = harness('android'); await h.api.initializeHaptics();
  h.api.haptics.detent(); h.api.haptics.detent(); h.advance(50); h.api.haptics.detent(true); h.api.haptics.reason(true); h.api.haptics.reason(false);
  assert.deepEqual(h.calls.map(x => x[1]), ['Segment_Tick', 'Confirm', 'Virtual_Key', 'Toggle_Off']);
});
test('Désactiver les vibrations annule les impulsions différées et persiste le choix', async () => {
  const h = harness(); await h.api.initializeHaptics(); h.api.haptics.confirm(true); await h.api.setHapticsEnabled(false); h.advance(1000); h.api.haptics.reason(true);
  assert.equal(h.calls.length, 1); assert.equal(h.storage.get('eclaircie.preferences.haptics'), 'off');
  const previous = harness('ios', 'off'); await previous.api.initializeHaptics(); previous.api.haptics.confirm(); previous.advance(1000); assert.equal(previous.calls.length, 0);
});
test('Aucun retour sur web, en arrière-plan ou avant le chargement du réglage', async () => {
  const web = harness('web'); await web.api.initializeHaptics(); web.api.haptics.confirm(); web.advance(1000); assert.equal(web.calls.length, 0);
  const h = harness(); h.api.haptics.detent(); assert.equal(h.calls.length, 0); h.api.activateHaptics(); await h.api.initializeHaptics(); h.api.haptics.confirm(); h.background(); h.advance(1000); assert.equal(h.calls.length, 1);
});

test('La navigation est franche, sans doublon rapide ni interruption de la confirmation', async () => {
  for (const os of ['ios', 'android']) {
    const h = harness(os); await h.api.initializeHaptics();
    h.api.haptics.navigate(); h.api.haptics.navigate();
    assert.deepEqual(h.calls, [[1000, os === 'ios' ? 'Heavy' : 'Long_Press']]);
    h.advance(180); h.api.haptics.navigate(); assert.equal(h.calls.length, 2);
    h.api.haptics.confirm(); h.advance(180); h.api.haptics.navigate();
    assert.equal(h.calls.length, 4);
    h.advance(20); h.api.haptics.navigate(); assert.equal(h.calls.length, 5);
  }
});
