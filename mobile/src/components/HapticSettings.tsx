import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { getHapticsEnabled, getHapticsStatus, haptics, initializeHaptics, setHapticsEnabled, subscribeHaptics } from '../haptics';
import { colors as c } from '../theme';
export function HapticSettings() {
  const enabled = useSyncExternalStore(subscribeHaptics, getHapticsEnabled, () => false);
  const status = useSyncExternalStore(subscribeHaptics, getHapticsStatus, () => 'loading');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [testMessage, setTestMessage] = useState('');
  useEffect(() => { void initializeHaptics(); }, []);
  async function toggle(value: boolean) { setBusy(true); setError(''); setTestMessage(''); try { await setHapticsEnabled(value); } catch { setError('Le réglage n’a pas pu être enregistré. Réessaie.'); } finally { setBusy(false); } }
  const unsupported = status === 'unsupported';
  const description = unsupported ? 'Ce navigateur ne propose pas de vibrations pour les webapps. Les animations visuelles restent disponibles.'
    : status === 'blocked' ? 'Le navigateur a refusé la vibration. Vérifie les réglages de ton téléphone, puis réessaie.'
    : status === 'inactive' ? 'Reviens dans l’app pour ressentir les vibrations.'
    : status === 'loading' ? 'Chargement de ton réglage…'
    : !enabled ? 'Les vibrations sont désactivées dans Moodly.'
    : Platform.OS === 'web' ? 'Vibrations disponibles dans ce navigateur. Teste le ressenti sur ton téléphone ; le mode silencieux et les réglages système peuvent les limiter.'
    : 'Le ressenti dépend de ton téléphone et de ses réglages système. Toutes les météos ont la même intensité.';
  function test() {
    setTestMessage(haptics.test() ? 'Test lancé. Si tu ne ressens rien, vérifie les réglages de vibration de ton téléphone.' : 'La vibration n’a pas pu être lancée sur cet appareil.');
  }
  return <View style={s.section}><View style={s.row}><View style={{ flex: 1, gap: 5 }}><Text style={s.title}>Vibrations tactiles</Text><Text style={s.caption}>Molette, changements de page et confirmations.</Text></View><Switch accessibilityLabel="Activer les vibrations tactiles" value={!unsupported && enabled} disabled={busy || unsupported || status === 'loading'} onValueChange={value => void toggle(value)} trackColor={{ false: '#c6cec1', true: c.link }} thumbColor={c.panel} /></View><Text style={s.caption}>{description}</Text>{!unsupported && status !== 'loading' && enabled && <Pressable accessibilityRole="button" onPress={test} style={s.test}><Text style={s.link}>{status === 'needs-interaction' ? 'Activer et tester les vibrations' : 'Tester les vibrations'}</Text></Pressable>}{!!testMessage && <Text accessibilityLiveRegion="polite" style={s.caption}>{testMessage}</Text>}{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}</View>;
}
const s = StyleSheet.create({ section: { gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderColor: c.line }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { color: c.text, fontSize: 12 }, caption: { color: c.dim, fontSize: 10, lineHeight: 17 }, test: { minHeight: 44, justifyContent: 'center' }, link: { color: c.link, fontSize: 12 }, error: { color: c.error, fontSize: 11, lineHeight: 17 } });
