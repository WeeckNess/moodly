const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
function harness(os = 'ios', preference = null, web = {}) {
  let now = 1000, index = 0, onState;
  const pending = new Map(), calls = [], storage = new Map(preference === null ? [] : [['eclaircie.preferences.haptics', preference]]);
  const state = { currentState: 'active', addEventListener: (_, callback) => { onState = callback; return { remove() {} }; } };
  const enums = Object.fromEntries(['Light', 'Soft', 'Rigid', 'Medium', 'Heavy', 'Segment_Tick', 'Confirm', 'Virtual_Key', 'Long_Press', 'Clock_Tick', 'Gesture_End', 'Toggle_On', 'Toggle_Off', 'Keyboard_Tap', 'Context_Click'].map(key => [key, key]));
  const imports = { 'react-native': { Platform: { OS: os }, AppState: state }, '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => storage.set(key, value) } }, 'expo-haptics': { ImpactFeedbackStyle: enums, AndroidHaptics: enums, impactAsync: async style => calls.push([now, style]), performAndroidHapticsAsync: async style => calls.push([now, style]) } };
  const events = new Map();
  const navigator = { userActivation: { hasBeenActive: web.activated ?? true }, ...(web.available ? { vibrate: pattern => { calls.push([now, Array.isArray(pattern) ? [...pattern] : pattern]); if (web.throws) throw new Error('not allowed'); return web.accepted ?? true; } } : {}) };
  const document = { visibilityState: 'visible', addEventListener: (name, handler) => { events.set(name, handler); }, removeEventListener: name => events.delete(name) };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/haptics.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', 'Date', 'setTimeout', 'clearTimeout', 'navigator', 'document', code)(module, module.exports, key => imports[key], { now: () => now }, (fn, delay) => { const id = ++index; pending.set(id, { fn, due: now + delay }); return id; }, id => pending.delete(id), navigator, document);
  function advance(ms) { const end = now + ms; while (true) { const next = [...pending].sort((a, b) => a[1].due - b[1].due)[0]; if (!next || next[1].due > end) break; pending.delete(next[0]); now = next[1].due; next[1].fn(); } now = end; }
  return { api: module.exports, calls, storage, advance, navigator, events, visibility(value) { document.visibilityState = value; events.get('visibilitychange')?.(); }, background() { state.currentState = 'background'; onState?.('background'); } };
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
test('Aucun retour sur navigateur incompatible, en arrière-plan ou avant le chargement du réglage', async () => {
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

test('La webapp joue les crans et les navigations après interaction, sans doublons', async () => {
  const h = harness('web', null, { available: true });
  assert.equal(h.api.getHapticsStatus(), 'loading');
  await h.api.initializeHaptics();
  assert.equal(h.api.getHapticsStatus(), 'available');
  h.api.haptics.detent(); h.api.haptics.detent(); h.advance(50); h.api.haptics.detent(true);
  assert.deepEqual(h.calls, [[1000, 14], [1050, 28]]);
  h.advance(50); h.api.haptics.navigate(); h.api.haptics.navigate();
  assert.deepEqual(h.calls.at(-1), [1100, 28]);
  assert.equal(h.calls.length, 3);
});
test('Les signatures web sont envoyées en un motif natif, sans dépendre des temporisateurs', async () => {
  const h = harness('web', null, { available: true }); await h.api.initializeHaptics();
  h.api.haptics.confirm(true);
  assert.deepEqual(h.calls, [[1000, [24, 71, 40, 285, 24, 86, 40]]]);
  h.advance(1000); assert.equal(h.calls.length, 1);
  assert.equal(h.api.haptics.test(), true);
  assert.deepEqual(h.calls.at(-1), [2000, [14, 86, 24, 86, 40]]);
});
test('L’absence d’interaction et la mise en arrière-plan empêchent et interrompent les vibrations web', async () => {
  const h = harness('web', null, { available: true, activated: false });
  const cleanup = h.api.activateHaptics(); await h.api.initializeHaptics();
  assert.equal(h.api.getHapticsStatus(), 'needs-interaction');
  assert.equal(h.api.haptics.test(), false); assert.equal(h.calls.length, 0);
  h.navigator.userActivation.hasBeenActive = true;
  h.api.haptics.confirm();
  h.visibility('hidden'); assert.deepEqual(h.calls.at(-1), [1000, 0]);
  assert.equal(h.api.getHapticsStatus(), 'inactive');
  const count = h.calls.length; h.api.haptics.navigate(); h.advance(1000); assert.equal(h.calls.length, count);
  cleanup(); assert.equal(h.events.size, 0);
});
test('Les appareils incompatibles ou les refus du navigateur ne sont pas présentés comme une réussite', async () => {
  const absent = harness('web'); await absent.api.initializeHaptics();
  assert.equal(absent.api.getHapticsStatus(), 'unsupported'); assert.equal(absent.api.haptics.test(), false);
  for (const option of [{ accepted: false }, { throws: true }]) {
    const h = harness('web', null, { available: true, ...option }); await h.api.initializeHaptics();
    assert.equal(h.api.haptics.test(), false); assert.equal(h.api.getHapticsStatus(), 'blocked');
  }
});
test('Désactiver le réglage web arrête immédiatement le motif et empêche les suivants', async () => {
  const h = harness('web', null, { available: true }); await h.api.initializeHaptics();
  h.api.haptics.confirm(); await h.api.setHapticsEnabled(false);
  assert.deepEqual(h.calls.at(-1), [1000, 0]); assert.equal(h.api.getHapticsStatus(), 'off');
  const count = h.calls.length; h.advance(1000); h.api.haptics.navigate(); assert.equal(h.calls.length, count);
  const saved = harness('web', 'off', { available: true }); await saved.api.initializeHaptics();
  assert.equal(saved.api.haptics.test(), false); assert.equal(saved.calls.length, 0);
});
