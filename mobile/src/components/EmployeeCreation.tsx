import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRightIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, PlusCircleIcon, UsersThreeIcon, XIcon } from '../icons';
import { strapiApi, type CreatedEmployee } from '../strapi';
import { colors as c, mono } from '../theme';
import { useReducedMotion } from '../motionPreferences';
import { haptics } from '../haptics';

export function EmployeeCreation({ jwt, team }: { jwt: string; team: string }) {
  const [open, setOpen] = useState(false), [name, setName] = useState(''), [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [created, setCreated] = useState<CreatedEmployee | null>(null), [visible, setVisible] = useState(false);
  const pending = useRef(false), insets = useSafeAreaInsets(), reduced = useReducedMotion();
  function close() { if (pending.current) return; setOpen(false); setCreated(null); setVisible(false); setName(''); setEmail(''); setError(''); }
  async function create() {
    if (pending.current) return;
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Renseigne le nom et une adresse e-mail valide.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { const employee = await strapiApi.createEmployee(jwt, { name: name.trim(), email: email.trim().toLowerCase() }); setCreated(employee); setName(''); setEmail(''); haptics.confirm(); }
    catch (err) { setError(err instanceof Error ? err.message : 'La création n’a pas abouti. Réessaie.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <>
    <View style={s.launcher}><Pressable accessibilityRole="button" onPress={() => { setOpen(true); haptics.navigate(); }} style={s.add}><UsersThreeIcon size={21} color={c.link} /><Text style={s.addText}>Ajouter un salarié</Text><PlusCircleIcon size={21} color={c.link} /></Pressable></View>
    <Modal visible={open} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.overlayContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View accessibilityViewIsModal role="dialog" aria-modal accessibilityLabel="Créer un compte salarié" style={s.sheet}>
            <View style={s.row}><View style={s.badge}>{created ? <CheckCircleIcon size={27} color={c.ink} /> : <UsersThreeIcon size={27} color={c.ink} />}</View><Text style={s.kicker}>{created ? 'BIENVENUE DANS L’ÉQUIPE' : 'TON ÉQUIPE'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fermer la création de compte" disabled={busy} onPress={close} style={s.icon}><XIcon size={22} color={c.text} /></Pressable></View>
            <Text accessibilityRole="header" style={s.title}>{created ? 'Son espace est prêt.' : 'Une place dans l’équipe.'}</Text>
            {created ? <>
              <Text style={s.body}>{created.name} peut se connecter à son espace salarié. Son compte est rattaché à {created.team}.</Text>
              <View style={s.credentials}><Text style={s.label}>Adresse de connexion</Text><Text selectable style={s.email}>{created.email}</Text><Text style={s.label}>Mot de passe initial</Text><View style={s.row}><TextInput accessibilityLabel="Mot de passe initial du salarié" value={created.initialPassword} editable={false} secureTextEntry={!visible} selectTextOnFocus style={s.password} /><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Masquer le mot de passe initial' : 'Afficher le mot de passe initial'} onPress={() => setVisible(value => !value)} style={s.icon}>{visible ? <EyeSlashIcon size={23} color={c.link} /> : <EyeIcon size={23} color={c.link} />}</Pressable></View></View>
              <Text style={s.body}>Transmets ces identifiants directement à la personne. Aucun e-mail n’est envoyé automatiquement. Le mot de passe ne sera plus affiché après fermeture.</Text>
              <Pressable accessibilityRole="button" onPress={close} style={s.primary}><Text style={s.primaryText}>J’ai conservé les identifiants</Text><CheckCircleIcon size={21} color={c.ink} /></Pressable>
            </> : <>
              <Text style={s.body}>Crée son accès à {team}. Le rôle salarié et l’équipe sont attribués automatiquement.</Text>
              <View style={s.field}><Text style={s.label}>Nom complet</Text><TextInput accessibilityLabel="Nom du salarié" value={name} onChangeText={setName} editable={!busy} maxLength={80} autoCapitalize="words" autoComplete="off" placeholder="Prénom Nom" placeholderTextColor={c.dim} style={s.input} /></View>
              <View style={s.field}><Text style={s.label}>Adresse professionnelle</Text><TextInput accessibilityLabel="Adresse e-mail du salarié" value={email} onChangeText={setEmail} editable={!busy} maxLength={254} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="off" placeholder="prenom@entreprise.fr" placeholderTextColor={c.dim} style={s.input} /></View>
              <Text style={s.caption}>Créer un accès ne donne aucun accès à ses météos individuelles ni à son historique personnel.</Text>
              {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => void create()} style={[s.primary, busy && { opacity: .6 }]}><Text style={s.primaryText}>{busy ? 'Création en cours…' : 'Créer le compte salarié'}</Text>{busy ? <ActivityIndicator color={c.ink} /> : <ArrowRightIcon size={21} color={c.ink} />}</Pressable>
            </>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
const s = StyleSheet.create({
  launcher: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 8 }, add: { minHeight: 44, borderRadius: 15, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, addText: { flex: 1, fontSize: 12, fontWeight: '600', color: c.link },
  overlay: { flex: 1, backgroundColor: '#172c2377' }, overlayContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }, sheet: { width: '100%', maxWidth: 440, backgroundColor: c.panel, borderRadius: 28, padding: 24, gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, badge: { width: 46, height: 46, borderRadius: 17, backgroundColor: c.sage, justifyContent: 'center', alignItems: 'center' }, kicker: { flex: 1, fontFamily: mono, fontSize: 9, lineHeight: 15, color: c.muted, letterSpacing: 1 }, icon: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: c.text, fontSize: 30, lineHeight: 35, letterSpacing: -.8 }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, field: { gap: 9 }, label: { fontSize: 12, fontWeight: '600', color: c.text }, input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, fontSize: 15, color: c.text, backgroundColor: c.surface }, caption: { color: c.dim, fontSize: 11, lineHeight: 18 }, error: { color: c.error, fontSize: 13, lineHeight: 20 },
  primary: { minHeight: 54, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 17, backgroundColor: c.yellow, flexDirection: 'row', gap: 14, alignItems: 'center', justifyContent: 'space-between' }, primaryText: { flex: 1, color: c.ink, fontSize: 14, fontWeight: '600' }, credentials: { backgroundColor: c.background, borderRadius: 18, padding: 16, gap: 12 }, email: { color: c.text, fontSize: 15 }, password: { flex: 1, fontFamily: mono, fontSize: 13, color: c.text, minHeight: 44 },
});
