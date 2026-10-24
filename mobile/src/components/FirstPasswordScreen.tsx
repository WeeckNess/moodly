import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from './BrandMark';
import { EyeIcon, EyeSlashIcon, LockSimpleIcon, ArrowRightIcon } from '../icons';
import { colors as c, mono } from '../theme';
import { useReducedMotion } from '../motionPreferences';
export function FirstPasswordScreen({ onChange, onLogout, logoutError }: { logoutError?: string; onChange: (current: string, password: string, confirmation: string) => Promise<void>; onLogout: () => void }) {
  const [current, setCurrent] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef(false), insets = useSafeAreaInsets(), reduced = useReducedMotion();
  async function save() {
    if (pending.current) return;
    if (!current) { setError('Renseigne le mot de passe initial reçu.'); return; }
    if (password.length < 12) { setError('Choisis au moins 12 caractères pour ton nouveau mot de passe.'); return; }
    if (password !== confirmation) { setError('Les deux nouveaux mots de passe ne correspondent pas.'); return; }
    if (password === current) { setError('Choisis un mot de passe différent de celui reçu.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { await onChange(current, password, confirmation); setCurrent(''); setPassword(''); setConfirmation(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Le changement n’a pas abouti. Réessaie.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <SafeAreaView style={s.background}><View style={s.header}><BrandMark /></View>
    <Modal visible transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => {}}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheet} accessibilityViewIsModal role="dialog" aria-modal accessibilityLabel="Choisir mon mot de passe personnel">
            <View style={s.badge}><LockSimpleIcon size={29} color={c.ink} /></View><Text style={s.kicker}>TON PREMIER PAS</Text>
            <Text accessibilityRole="header" style={s.title}>Ton espace.{ '\n' }Ton mot de passe.</Text>
            <Text style={s.body}>Remplace le mot de passe initial reçu par celui de ton choix avant de découvrir Éclaircie.</Text>
            {([{ label: 'Mot de passe initial', value: current, change: setCurrent, complete: 'current-password' }, { label: 'Nouveau mot de passe', value: password, change: setPassword, complete: 'new-password' }, { label: 'Confirmer le nouveau mot de passe', value: confirmation, change: setConfirmation, complete: 'new-password' }] as const).map(field => <View key={field.label} style={s.field}><Text style={s.label}>{field.label}</Text><TextInput accessibilityLabel={field.label} value={field.value} onChangeText={value => { field.change(value); setError(''); }} secureTextEntry={!visible} editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete={field.complete} maxLength={128} style={s.input} /></View>)}
            <View style={s.row}><Text style={[s.caption, { flex: 1 }]}>12 caractères minimum. Une phrase facile à retenir fonctionne aussi.</Text><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Masquer les mots de passe' : 'Afficher les mots de passe'} onPress={() => setVisible(value => !value)} style={s.icon}>{visible ? <EyeSlashIcon size={23} color={c.link} /> : <EyeIcon size={23} color={c.link} />}</Pressable></View>
            {!!(error || logoutError) && <Text accessibilityRole="alert" style={s.error}>{error || logoutError}</Text>}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()} style={[s.primary, busy && { opacity: .6 }]}><Text style={s.primaryText}>{busy ? 'Enregistrement…' : 'Enregistrer et découvrir l’app'}</Text>{busy ? <ActivityIndicator color={c.ink} /> : <ArrowRightIcon size={21} color={c.ink} />}</Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={onLogout} style={s.logout}><Text style={s.link}>Me déconnecter</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({ background: { flex: 1, backgroundColor: c.background }, header: { padding: 24 }, overlay: { flex: 1, backgroundColor: '#172c2377' }, content: { flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' }, sheet: { width: '100%', maxWidth: 440, padding: 24, gap: 16, borderRadius: 28, backgroundColor: c.panel }, badge: { width: 54, height: 54, borderRadius: 19, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' }, kicker: { color: c.muted, fontFamily: mono, fontSize: 10, letterSpacing: 1 }, title: { color: c.text, fontSize: 32, lineHeight: 36, letterSpacing: -.8 }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, field: { gap: 8 }, label: { color: c.text, fontSize: 12, fontWeight: '600' }, input: { minHeight: 50, borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: c.line, color: c.text, fontSize: Platform.OS === 'web' ? 16 : 15, backgroundColor: c.surface }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, caption: { color: c.dim, fontSize: 11, lineHeight: 18 }, icon: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }, error: { color: c.error, fontSize: 13, lineHeight: 20 }, primary: { minHeight: 54, borderRadius: 17, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.yellow }, primaryText: { flex: 1, color: c.ink, fontWeight: '600', fontSize: 14 }, logout: { minHeight: 44, justifyContent: 'center', alignItems: 'center' }, link: { color: c.link, fontSize: 13 } });
