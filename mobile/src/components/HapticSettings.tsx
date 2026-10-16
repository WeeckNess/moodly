import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { getHapticsEnabled, haptics, initializeHaptics, setHapticsEnabled, subscribeHaptics } from '../haptics';
import { colors as c } from '../theme';
export function HapticSettings() {
  const [enabled, setEnabled] = useState(getHapticsEnabled()), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { const unsubscribe = subscribeHaptics(() => setEnabled(getHapticsEnabled())); void initializeHaptics(); return unsubscribe; }, []);
  async function toggle(value: boolean) { setBusy(true); setError(''); try { await setHapticsEnabled(value); } catch { setError('Le réglage n’a pas pu être enregistré. Réessaie.'); } finally { setBusy(false); } }
  return <View style={s.section}><View style={s.row}><View style={{ flex: 1, gap: 5 }}><Text style={s.title}>Vibrations tactiles</Text><Text style={s.caption}>Molette douce, sélections et confirmations.</Text></View><Switch accessibilityLabel="Activer les vibrations tactiles" value={enabled} disabled={busy} onValueChange={value => void toggle(value)} trackColor={{ false: '#c6cec1', true: c.link }} thumbColor={c.panel} /></View><Text style={s.caption}>{Platform.OS === 'web' ? 'Sur téléphone compatible avec Expo Go. Aucun retour vibratoire dans le navigateur.' : 'Le ressenti dépend de ton téléphone et de ses réglages système. Toutes les météos ont la même intensité.'}</Text>{Platform.OS !== 'web' && enabled && <Pressable accessibilityRole="button" onPress={haptics.test} style={s.test}><Text style={s.link}>Essayer la signature tactile</Text></Pressable>}{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}</View>;
}
const s = StyleSheet.create({ section: { gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderColor: c.line }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { color: c.text, fontSize: 12 }, caption: { color: c.dim, fontSize: 10, lineHeight: 17 }, test: { minHeight: 44, justifyContent: 'center' }, link: { color: c.link, fontSize: 12 }, error: { color: c.error, fontSize: 11, lineHeight: 17 } });
