import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import type { Icon } from 'phosphor-react-native';
import { ArrowRightIcon, ArrowUpRightIcon, BookOpenIcon, CloudSunIcon, ChatsCircleIcon, EyeSlashIcon, InfoIcon, LockSimpleIcon, ShieldCheckIcon, SignOutIcon, SunIcon, UsersThreeIcon } from './src/icons';
import { colors as c, mono } from './src/theme';
import { weathers } from './src/weather';
import { ApiError, strapiApi, tokenStore, type Role, type Session, type TeamStats } from './src/strapi';
import { demoSession, demoStats, localDay } from './src/demo';
import { ManagerPortal } from './src/components/ManagerPortal';
import { PortalNavigation } from './src/components/PortalNavigation';
import { BrandMark } from './src/components/BrandMark';
import { MoodFlow } from './src/components/MoodFlow';
import { clearSupportMemory, recordPrivateMood } from './src/support';

type Page = 'home' | 'privacy' | 'guide';
function Action({ label, onPress, secondary = false, disabled = false, busy = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; busy?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [s.action, secondary ? s.actionSecondary : s.actionPrimary, (disabled || busy) && s.disabled, pressed && { opacity: 0.8 }]}>
    <Text style={[s.actionText, { color: secondary ? c.text : c.ink }]}>{label}</Text>{busy ? <ActivityIndicator size="small" color={secondary ? c.text : c.ink} /> : <ArrowUpRightIcon size={19} color={secondary ? c.text : c.ink} />}
  </Pressable>;
}
function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) { return <Text style={[s.kicker, light && { color: c.ink }]}>{children}</Text>; }
function Brand({ compact = false }: { compact?: boolean }) { return <BrandMark size={compact ? 22 : 26} />; }
function InfoRow({ icon: I, title, children }: { icon: Icon; title: string; children: ReactNode }) {
  return <View style={s.infoRow}><View style={s.infoIcon}><I size={22} color={c.accent} /></View><View style={{ flex: 1, gap: 7 }}><Text style={s.infoTitle}>{title}</Text><Text style={s.body}>{children}</Text></View></View>;
}
function Eclaircie() {
  const { width } = useWindowDimensions();
  const wide = width >= 960, tablet = width >= 660;
  const [session, setSession] = useState<Session | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [page, setPage] = useState<Page>('home');
  const [score, setScore] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [sentNow, setSentNow] = useState(false);
  const [supportPrompt, setSupportPrompt] = useState(false);
  const requestVersion = useRef(0);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    tokenStore.read().then(async token => {
      if (!token) return;
      try { const info = await strapiApi.session(token); if (active) { setSession(info); setJwt(token); } }
      catch { await tokenStore.clear(); }
    }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);
  const refreshStats = useCallback(async () => {
    if (session?.role !== 'manager') return;
    const version = ++requestVersion.current;
    setStatsLoading(true); setStatsError('');
    try {
      const data = demo ? demoStats() : await strapiApi.teamStats(jwt!);
      if (version === requestVersion.current) setStats(data);
    } catch (err) {
      if (version === requestVersion.current) { setStats(null); setStatsError(err instanceof ApiError && err.status === 401 ? 'Ta session a expiré. Déconnecte-toi pour te reconnecter.' : err instanceof Error ? err.message : 'Chargement impossible.'); }
    } finally { if (version === requestVersion.current) setStatsLoading(false); }
  }, [session?.role, demo, jwt]);
  useEffect(() => { void refreshStats(); }, [refreshStats]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' || !session) return;
      if (session.role === 'manager') void refreshStats();
      const version = requestVersion.current;
      if (!demo && jwt) void strapiApi.session(jwt).then(info => { if (version === requestVersion.current) setSession(info); }).catch(() => { if (version === requestVersion.current) setError('Ta session doit être renouvelée. Reconnecte-toi.'); });
      else if (session.day !== localDay()) { setSession({ ...session, submitted: false, day: localDay() }); setScore(null); setTags([]); setSentNow(false); }
    });
    return () => subscription.remove();
  }, [session, jwt, demo, refreshStats]);
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      if (session.day === localDay()) return;
      if (session.role === 'manager') void refreshStats();
      const version = requestVersion.current;
      if (demo) { setSession({ ...session, submitted: false, day: localDay() }); setScore(null); setTags([]); setSentNow(false); }
      else if (jwt) void strapiApi.session(jwt).then(info => { if (version !== requestVersion.current) return; setSession(info); setScore(null); setTags([]); setSentNow(false); }).catch(() => { if (version === requestVersion.current) setError('Reconnecte-toi pour renouveler ta session.'); });
    }, 60000);
    return () => clearInterval(interval);
  }, [session, demo, jwt, refreshStats]);
  function navigate(next: Page) { setPage(next); scroll.current?.scrollTo({ y: 0, animated: false }); }
  async function openDemo(role: Role) {
    requestVersion.current++; setStats(null); setError(''); setSentNow(false); setScore(null); setTags([]); setDemo(true); setJwt(null);
    const info = demoSession(role);
    info.submitted = role === 'collaborateur' && await AsyncStorage.getItem('eclaircie.demo.day') === localDay();
    setSession(info); setSupportPrompt(false); navigate('home');
  }
  async function login() {
    if (!identifier.trim() || !password) { setError('Renseigne ton adresse et ton mot de passe.'); return; }
    setBusy(true); setError('');
    try {
      const result = await strapiApi.login(identifier.trim(), password);
      const info = await strapiApi.session(result.jwt);
      await tokenStore.write(result.jwt);
      requestVersion.current++; setStats(null); setJwt(result.jwt); setSession(info); setDemo(false); setPassword(''); setSentNow(false); setSupportPrompt(false); navigate('home');
    } catch (err) { setError(err instanceof ApiError && [400, 401].includes(err.status) ? 'Adresse ou mot de passe incorrect.' : err instanceof Error ? err.message : 'Connexion impossible.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    requestVersion.current++; await tokenStore.clear(); setSession(null); setJwt(null); setDemo(false); setPage('home'); setError(''); setStats(null); setScore(null); setTags([]); setSentNow(false); setSupportPrompt(false); clearSupportMemory();
  }
  async function submit() {
    if (score === null || !session) return;
    setBusy(true); setError('');
    try {
      let submittedDay = localDay();
      if (demo) await AsyncStorage.setItem('eclaircie.demo.day', submittedDay);
      else { const result = await strapiApi.submitMood(jwt!, score, tags); submittedDay = result.data.day; }
      setSession({ ...session, submitted: true, day: submittedDay }); setSentNow(true);
      if (demo || session.privateSupportKey) {
        const prompt = await recordPrivateMood(demo ? 'demo' : session.privateSupportKey!, submittedDay, score, demo);
        setSupportPrompt(prompt);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) { setSession({ ...session, submitted: true, day: localDay() }); setSentNow(false); }
      else if (err instanceof ApiError && err.status === 401) setError('Ta session a expiré. Reconnecte-toi pour envoyer ta météo.');
      else setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally { setBusy(false); }
  }
  const navItems = <PortalNavigation page={page} manager={session?.role === 'manager'} onNavigate={navigate} vertical={wide} />;
  if (restoring) return <View style={s.loading}><ActivityIndicator color={c.accent} /><Text style={s.body}>Un instant…</Text></View>;

  if (!session) return <SafeAreaView style={s.safe}><StatusBar style="light" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.loginOuter} keyboardShouldPersistTaps="handled">
    <View style={[s.loginTop, wide && { paddingHorizontal: 48 }]}><Brand /><Kicker>LA MÉTÉO DU COLLECTIF</Kicker></View>
    <View style={[s.loginLayout, wide && { flexDirection: 'row' }, !tablet && { paddingVertical: 22, gap: 16 }]}>
      <View style={[s.loginIntro, wide && { flex: 1.2 }, !tablet && { display: 'none' }]}><View style={s.sectionLine}><Kicker>01 / UN MOMENT POUR TOI</Kicker><View style={s.liveDot} /></View>
        <Text accessibilityRole="header" style={[s.loginTitle, !tablet && { fontSize: 48, lineHeight: 52 }]}>Tous les jours{ '\n' }ne sont pas{ '\n' }<Text style={{ color: c.accent }}>plein soleil.</Text></Text>
        <Text style={[s.body, { maxWidth: 370, fontSize: 17, lineHeight: 27 }]}>Et c’est OK. Partage ta météo intérieure en quelques secondes. Ensemble, faisons place aux éclaircies.</Text>
        <View style={s.loginWeather}>{weathers.map(w => <View key={w.score} style={[s.miniWeather, { backgroundColor: w.color }]}><w.icon size={tablet ? 40 : 30} color={c.ink} weight="duotone" /></View>)}</View>
        <View style={s.trustLine}><ShieldCheckIcon size={17} color={c.accent} /><Text style={s.caption}>Volontaire. Sans nom sur ta réponse.</Text></View>
      </View>
      <View style={[s.loginForm, wide && { flex: 0.8 }]}><Kicker>02 / TON ESPACE</Kicker><Text style={s.panelTitle}>Content de te voir.</Text><Text style={s.body}>Connecte-toi avec ton compte d’équipe.</Text>
        <View style={{ gap: 10 }}><Text style={s.fieldLabel}>ADRESSE E-MAIL</Text><TextInput accessibilityLabel="Adresse e-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={identifier} onChangeText={setIdentifier} placeholder="toi@entreprise.fr" placeholderTextColor={c.dim} style={s.input} /></View>
        <View style={{ gap: 10 }}><Text style={s.fieldLabel}>MOT DE PASSE</Text><TextInput accessibilityLabel="Mot de passe" autoCapitalize="none" autoComplete="current-password" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={() => void login()} placeholder="Ton mot de passe" placeholderTextColor={c.dim} style={s.input} /></View>
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        <Action label="Entrer dans mon espace" onPress={() => void login()} busy={busy} />
        <View style={s.divider} /><Text style={s.caption}>Envie de découvrir ? Aucune donnée réelle nécessaire.</Text>
        <Action label="Explorer la démo" secondary onPress={() => void openDemo('collaborateur')} />
        <Pressable accessibilityRole="button" style={s.textLink} onPress={() => void openDemo('manager')}><Text style={s.linkText}>Découvrir la vue manager</Text><ArrowRightIcon color={c.muted} size={16} /></Pressable>
      </View>
    </View><View style={[s.loginFooter, !tablet && { display: 'none' }]}><Kicker>LE RESSENTI DE CHACUN. LA MÉTÉO DU COLLECTIF.</Kicker><Text style={s.caption}>Éclaircie / Projet Moodly</Text></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;

  if (session.role === 'collaborateur' && page === 'home') return <MoodFlow
    key={demo ? 'demo-collaborateur' : session.privateSupportKey ?? session.name}
    score={score} onScore={setScore} tags={tags} onTags={setTags}
    submitted={session.submitted} sentNow={sentNow} demo={demo} busy={busy} error={error}
    supportPrompt={supportPrompt} onDismissSupport={() => setSupportPrompt(false)}
    onSubmit={() => void submit()} onPrivacy={() => navigate('privacy')} onLogout={() => void logout()}
    onDemoManager={() => void openDemo('manager')}
    onReplay={() => { void AsyncStorage.removeItem('eclaircie.demo.day').then(() => { setSession({ ...session, submitted: false }); setScore(3); setTags([]); setSentNow(false); setSupportPrompt(false); }); }}
  />;

  if (session.role === 'manager' && page === 'home') return <ManagerPortal session={session} stats={stats} loading={statsLoading} error={statsError} demo={demo} onRefresh={() => void refreshStats()} onNavigate={navigate} onLogout={() => void logout()} onDemo={() => void openDemo('collaborateur')} />;
  return <SafeAreaView style={s.safe}><StatusBar style="light" /><View style={s.app}>
    {wide && <View style={s.sidebar}><Brand compact /><View style={{ marginTop: 30, gap: 8 }}><Kicker>TON ESPACE</Kicker><Text style={s.teamName}>{session.team.name}</Text></View><View style={s.sideNav}>{navItems}</View>
      <View style={{ flex: 1 }} /><View style={s.sidebarNote}><SunIcon color={c.accent} size={25} weight="duotone" /><Text style={s.body}>Toutes les météos{ '\n' }ont leur place.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter" style={s.userRow} onPress={() => void logout()}><View style={s.avatar}><Text style={s.avatarText}>{session.name.slice(0, 1)}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={s.userName}>{session.name}</Text><Text style={s.caption}>{session.role === 'manager' ? 'Manager' : 'Collaborateur'}</Text></View><SignOutIcon color={c.muted} size={19} /></Pressable>
    </View>}
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={[s.topbar, !wide && { paddingHorizontal: 20 }]}>{wide ? <Kicker>ÉCLAIRCIE / {page === 'home' ? 'LE TEMPS PRÉSENT' : page === 'privacy' ? 'EN CONFIANCE' : 'LE PRINCIPE'}</Kicker> : <Brand compact />}<View style={s.row}><View style={s.statusBadge}><View style={[s.liveDot, { backgroundColor: demo ? c.yellow : c.accent }]} /><Text style={s.statusText}>{demo ? 'DÉMO' : 'CONNECTÉ'}</Text></View>{!wide && <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter" onPress={() => void logout()} style={s.iconButton}><SignOutIcon size={20} color={c.muted} /></Pressable>}</View></View>
      <ScrollView ref={scroll} contentContainerStyle={[s.content, !tablet && { padding: 20, paddingBottom: 40, gap: 16 }]}>
        {demo && <View style={s.demoBar}><Text style={s.demoText}>ESPACE DÉMO · DONNÉES FICTIVES</Text><Pressable accessibilityRole="button" accessibilityLabel={session.role === 'manager' ? 'Démo collaborateur' : 'Démo manager'} style={s.demoSwitch} onPress={() => void openDemo(session.role === 'manager' ? 'collaborateur' : 'manager')}><Text style={s.demoText}>{session.role === 'manager' ? 'VUE COLLABORATEUR' : 'VUE MANAGER'}</Text><ArrowUpRightIcon color={c.yellow} size={14} /></Pressable></View>}
        {page === 'privacy' ? <>
          <Kicker>01 / EN CONFIANCE</Kicker><Text accessibilityRole="header" style={s.heroTitle}>Tes données.{ '\n' }<Text style={{ color: c.accent }}>En toute clarté.</Text></Text><Text style={s.intro}>Tu dois pouvoir comprendre ce que tu partages, qui le voit et pourquoi.</Text>
          <InfoRow icon={ShieldCheckIcon} title="Ta note n’a pas ton nom">Les réponses contiennent une équipe, une date, une note et des tags. Elles n’ont pas de lien vers ton compte. Un journal séparé retient seulement si tu as répondu aujourd’hui.</InfoRow>
          <InfoRow icon={UsersThreeIcon} title="Une météo collective uniquement">Le manager accède aux moyennes de son équipe. Un jour avec moins de 5 réponses est masqué. Il n’a accès ni aux réponses individuelles ni à la liste des participants.</InfoRow>
          <InfoRow icon={LockSimpleIcon} title="Tu gardes le choix">Répondre est facultatif. Les tags collectifs restent prédéfinis. Ta raison personnelle est un brouillon privé, jamais transmis, puis effacé après l’envoi. Aucune relance nominative.</InfoRow>
          <InfoRow icon={ChatsCircleIcon} title="Une invitation privée, si tu en as besoin">Après trois météos « Très mal » sur des jours distincts dans les 30 derniers jours, l’app peut t’inviter à préparer un échange. Le compteur reste dans le stockage sécurisé du téléphone. Sur le web, il reste seulement en mémoire pendant la session. Ton manager ne reçoit aucune alerte.</InfoRow>
          <InfoRow icon={EyeSlashIcon} title="Une conservation limitée">Les réponses et journaux sont supprimés après 45 jours par défaut. Les moyennes collectives restent disponibles. Les administrateurs techniques ont des accès distincts de ceux du manager.</InfoRow>
          <View style={s.managerNote}><InfoIcon color={c.yellow} size={22} /><Text style={[s.body, { flex: 1 }]}>{demo ? 'Tu explores une démonstration. Les graphiques sont fictifs ; seule la date de ta saisie de démo est mémorisée localement.' : 'Ce prototype protège l’accès manager. Avant un usage avec de vrais salariés, l’organisation doit valider la confidentialité, les accès administrateur, les journaux techniques et les informations à fournir.'}</Text></View>
        </> : <>
          <Kicker>01 / LE PRINCIPE</Kicker><Text accessibilityRole="header" style={s.heroTitle}>Un petit geste.{ '\n' }<Text style={{ color: c.accent }}>Une vraie écoute.</Text></Text><Text style={s.intro}>Éclaircie transforme les ressentis du quotidien en point de départ pour mieux travailler ensemble.</Text>
          <InfoRow icon={CloudSunIcon} title="01 — Choisis ta météo">Orage, pluie, nuages, éclaircies ou soleil : cinq façons de dire comment tu te sens. Tu peux préciser ce qui joue grâce aux tags.</InfoRow>
          <InfoRow icon={UsersThreeIcon} title="02 — Le collectif se dessine">Au fil des jours, les réponses composent une tendance sur 30 jours. Seules les journées avec suffisamment de participation sont visibles.</InfoRow>
          <InfoRow icon={BookOpenIcon} title="03 — Place à la conversation">Managers : partagez les tendances en équipe, écoutez sans chercher qui a répondu, puis choisissez une action concrète sur la charge, les outils ou l’organisation.</InfoRow>
          <View style={s.confirmPanel}><Kicker light>VOUS AVEZ DIT / NOUS AVONS FAIT</Kicker><Text style={s.confirmTitle}>L’écoute prend du sens{ '\n' }quand elle devient action.</Text><Text style={s.confirmBody}>Exemple : « La charge pèse en ce moment. Cette semaine, nous allons revoir ensemble les priorités. » Puis faites un point avec l’équipe sur les effets de cette action.</Text></View>
        </>}
        <View style={s.footer}><Kicker>LE RESSENTI DE CHACUN. LA MÉTÉO DU COLLECTIF.</Kicker><View style={s.row}><SunIcon color={c.dim} size={15} /><Text style={s.caption}>Éclaircie</Text></View></View>
      </ScrollView>
      {!wide && <View style={s.mobileNav} accessibilityRole="tablist">{navItems}</View>}
    </View>
  </View></SafeAreaView>;
}
export default function App() { return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><Eclaircie /></SafeAreaProvider></GestureHandlerRootView>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  app: { flex: 1, flexDirection: 'row' },
  loading: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { fontSize: 14, lineHeight: 22, color: c.muted },
  caption: { fontSize: 12, lineHeight: 19, color: c.muted },
  kicker: { fontFamily: mono, fontSize: 10, letterSpacing: 1.2, lineHeight: 17, color: c.dim },
  action: { minHeight: 50, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15, borderWidth: 1 },
  actionPrimary: { backgroundColor: c.accent, borderColor: c.accent },
  actionSecondary: { backgroundColor: 'transparent', borderColor: c.line },
  actionText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  disabled: { opacity: 0.4 },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  linkText: { fontSize: 12, color: c.muted, textDecorationLine: 'underline' },
  liveDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: c.accent },
  divider: { height: 1, backgroundColor: c.line, marginVertical: 3 },
  loginOuter: { flexGrow: 1, maxWidth: 1400, width: '100%', alignSelf: 'center' },
  loginTop: { padding: 24, minHeight: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: c.line },
  loginLayout: { flex: 1, padding: 24, gap: 40, maxWidth: 1140, width: '100%', alignSelf: 'center', paddingVertical: 48 },
  loginIntro: { gap: 28 },
  loginTitle: { fontSize: 66, lineHeight: 70, letterSpacing: -3, fontWeight: '600', color: c.text },
  loginWeather: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  miniWeather: { width: 66, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  loginForm: { borderRadius: 24, backgroundColor: c.panel, padding: 28, gap: 22, borderWidth: 1, borderColor: c.line, alignSelf: 'stretch' },
  panelTitle: { color: c.text, fontSize: 24, lineHeight: 29, letterSpacing: -0.7, fontWeight: '500' },
  fieldLabel: { fontFamily: mono, color: c.muted, fontSize: 10, letterSpacing: 1 },
  input: { borderRadius: 14, color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.line, minHeight: 50, padding: 14, fontSize: 14 },
  loginFooter: { padding: 24, gap: 10, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  sidebar: { width: 250, borderRightWidth: 1, borderRightColor: c.line, paddingTop: 32, paddingHorizontal: 22, backgroundColor: c.background },
  teamName: { fontSize: 12, lineHeight: 20, color: c.text },
  sideNav: { marginTop: 38, gap: 8 },
  sidebarNote: { gap: 15, paddingVertical: 24, borderTopWidth: 1, borderTopColor: c.line },
  userRow: { paddingVertical: 24, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { backgroundColor: c.elevated, width: 35, height: 35, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, color: c.accent },
  userName: { fontSize: 12, color: c.text },
  topbar: { height: 70, paddingHorizontal: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: c.line },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: c.panel, borderWidth: 1, borderColor: c.line },
  statusText: { color: c.muted, fontSize: 9, letterSpacing: 1, fontFamily: mono },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 36, paddingBottom: 28, maxWidth: 1040, alignSelf: 'center', width: '100%', gap: 24 },
  demoBar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.line },
  demoText: { fontFamily: mono, fontSize: 9, color: c.yellow, letterSpacing: 0.4 },
  demoSwitch: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  heroTitle: { fontSize: 36, lineHeight: 42, letterSpacing: -1.8, fontWeight: '500', color: c.text },
  trustLine: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  infoTitle: { color: c.text, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  confirmPanel: { backgroundColor: c.accent, borderRadius: 24, padding: 28, gap: 22 },
  confirmTitle: { fontSize: 29, lineHeight: 35, letterSpacing: -0.9, color: c.ink, fontWeight: '500' },
  confirmBody: { fontSize: 14, lineHeight: 23, color: '#344b30' },
  managerNote: { borderRadius: 20, flexDirection: 'row', gap: 15, backgroundColor: c.panel, padding: 20, borderLeftWidth: 2, borderLeftColor: c.line },
  infoRow: { flexDirection: 'row', gap: 18, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: c.line },
  infoIcon: { width: 42, height: 42, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  intro: { maxWidth: 550, fontSize: 16, color: c.muted, lineHeight: 26 },
  footer: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 12, paddingTop: 20, gap: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' },
  mobileNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.background, paddingVertical: 8, paddingHorizontal: 10, gap: 6 },
  error: { color: '#ffbaad', fontSize: 13, lineHeight: 20 }
});
