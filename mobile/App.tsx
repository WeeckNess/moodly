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
import { MoodChart } from './src/components/MoodChart';
import { MoodFlow } from './src/components/MoodFlow';
import { clearSupportMemory, recordPrivateMood } from './src/support';

type Page = 'home' | 'privacy' | 'guide';
const friendlyNumber = (value: number) => value.toFixed(1).replace('.', ',');
function Action({ label, onPress, secondary = false, disabled = false, busy = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; busy?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [s.action, secondary ? s.actionSecondary : s.actionPrimary, (disabled || busy) && s.disabled, pressed && { opacity: 0.8 }]}>
    <Text style={[s.actionText, { color: secondary ? c.text : c.ink }]}>{label}</Text>{busy ? <ActivityIndicator size="small" color={secondary ? c.text : c.ink} /> : <ArrowUpRightIcon size={19} color={secondary ? c.text : c.ink} />}
  </Pressable>;
}
function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) { return <Text style={[s.kicker, light && { color: c.ink }]}>{children}</Text>; }
function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={s.brandRow}><CloudSunIcon color={c.accent} weight="duotone" size={compact ? 26 : 32} /><Text style={[s.brand, compact && { fontSize: 24 }]}>éclaircie<Text style={{ color: c.accent }}>.</Text></Text></View>;
}
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
      if (!demo && jwt) void strapiApi.session(jwt).then(setSession).catch(() => setError('Ta session doit être renouvelée. Reconnecte-toi.'));
      else if (session.day !== localDay()) { setSession({ ...session, submitted: false, day: localDay() }); setScore(null); setTags([]); setSentNow(false); }
    });
    return () => subscription.remove();
  }, [session, jwt, demo]);
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      if (session.day === localDay()) return;
      if (demo) { setSession({ ...session, submitted: false, day: localDay() }); setScore(null); setTags([]); setSentNow(false); }
      else if (jwt) void strapiApi.session(jwt).then(info => { setSession(info); setScore(null); setTags([]); setSentNow(false); }).catch(() => setError('Reconnecte-toi pour renouveler ta session.'));
    }, 60000);
    return () => clearInterval(interval);
  }, [session, demo, jwt]);
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
  const navigation: { id: Page; label: string; icon: Icon }[] = [
    { id: 'home', label: session?.role === 'manager' ? 'La météo de l’équipe' : 'Ma météo', icon: session?.role === 'manager' ? UsersThreeIcon : CloudSunIcon },
    { id: 'guide', label: 'Comment ça marche', icon: BookOpenIcon },
    { id: 'privacy', label: 'Mes données', icon: ShieldCheckIcon },
  ];
  const navItems = navigation.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: page === item.id }} accessibilityLabel={item.label} onPress={() => navigate(item.id)} style={[s.navItem, page === item.id && s.navActive, !wide && s.navMobile]}>
    <item.icon size={20} color={page === item.id ? c.accent : c.muted} weight={page === item.id ? 'fill' : 'regular'} /><Text style={[s.navText, page === item.id && { color: c.text }, !wide && { fontSize: 10 }]}>{!wide && item.id === 'guide' ? 'Le principe' : !wide && item.id === 'home' && session?.role === 'manager' ? 'Mon équipe' : item.label}</Text>{wide && page === item.id && <View style={s.navDot} />}
  </Pressable>);
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

  const visible = stats?.data.filter(d => d.average !== null) ?? [];
  const mean = visible.length ? visible.reduce((sum, d) => sum + d.average!, 0) / visible.length : null;
  const now = new Date();
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return <SafeAreaView style={s.safe}><StatusBar style="light" /><View style={s.app}>
    {wide && <View style={s.sidebar}><Brand compact /><View style={{ marginTop: 30, gap: 8 }}><Kicker>TON ESPACE</Kicker><Text style={s.teamName}>{session.team.name}</Text></View><View style={s.sideNav}>{navItems}</View>
      <View style={{ flex: 1 }} /><View style={s.sidebarNote}><SunIcon color={c.accent} size={25} weight="duotone" /><Text style={s.body}>Toutes les météos{ '\n' }ont leur place.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter" style={s.userRow} onPress={() => void logout()}><View style={s.avatar}><Text style={s.avatarText}>{session.name.slice(0, 1)}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={s.userName}>{session.name}</Text><Text style={s.caption}>{session.role === 'manager' ? 'Manager' : 'Collaborateur'}</Text></View><SignOutIcon color={c.muted} size={19} /></Pressable>
    </View>}
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={[s.topbar, !wide && { paddingHorizontal: 20 }]}>{wide ? <Kicker>ÉCLAIRCIE / {page === 'home' ? 'LE TEMPS PRÉSENT' : page === 'privacy' ? 'EN CONFIANCE' : 'LE PRINCIPE'}</Kicker> : <Brand compact />}<View style={s.row}><View style={s.statusBadge}><View style={[s.liveDot, { backgroundColor: demo ? c.yellow : c.accent }]} /><Text style={s.statusText}>{demo ? 'DÉMO' : 'CONNECTÉ'}</Text></View>{!wide && <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter" onPress={() => void logout()} style={s.iconButton}><SignOutIcon size={20} color={c.muted} /></Pressable>}</View></View>
      <ScrollView ref={scroll} contentContainerStyle={[s.content, !tablet && { padding: 20, paddingBottom: 40, gap: 16 }]}>
        {demo && <View style={s.demoBar}><Text style={s.demoText}>ESPACE DÉMO · DONNÉES FICTIVES</Text><Pressable accessibilityRole="button" accessibilityLabel={session.role === 'manager' ? 'Démo collaborateur' : 'Démo manager'} style={s.demoSwitch} onPress={() => void openDemo(session.role === 'manager' ? 'collaborateur' : 'manager')}><Text style={s.demoText}>{session.role === 'manager' ? 'VUE COLLABORATEUR' : 'VUE MANAGER'}</Text><ArrowUpRightIcon color={c.yellow} size={14} /></Pressable></View>}
        {page === 'home' ? <>
          <View style={s.sectionLine}><Kicker>01 / {session.role === 'manager' ? 'LE COLLECTIF' : 'TA MÉTÉO DU JOUR'}</Kicker><Text style={s.date}>{date}</Text></View>
          <View style={s.headingRow}><View style={{ flex: 1 }}><Text style={s.hello}>Bonjour {session.name.split(' ')[0]}.</Text><Text accessibilityRole="header" style={[s.heroTitle, !tablet && { fontSize: 38, lineHeight: 43 }]}>{session.role === 'manager' ? <>Prendre le pouls.{ '\n' }<Text style={{ color: c.accent }}>Faire la différence.</Text></> : <>Un jour.{ '\n' }<Text style={{ color: c.accent }}>Une météo.</Text></>}</Text></View>{tablet && <View style={s.heroCorner}><CloudSunIcon color={c.accent} size={58} weight="thin" /><Kicker>{session.role === 'manager' ? '30 DERNIERS JOURS' : 'MOINS DE 10 SECONDES'}</Kicker></View>}</View>
          <>
            <View style={s.chartPanel}><View style={[s.chartHeader, !tablet && { flexDirection: 'column', alignItems: 'flex-start' }]}><View style={{ gap: 10 }}><Kicker>{session.team.name.toUpperCase()}</Kicker><Text style={s.panelTitle}>La météo de l’équipe</Text></View><View style={s.period}><Text style={s.periodText}>30 JOURS</Text></View></View>
              {statsLoading ? <View style={s.chartLoading}><ActivityIndicator color={c.accent} /><Text style={s.body}>Chargement de la météo collective…</Text></View> : statsError ? <View style={{ gap: 20 }}><Text accessibilityRole="alert" style={s.error}>{statsError}</Text><Action secondary label="Réessayer" onPress={() => void refreshStats()} /></View> : stats ? <>
                <View style={s.metrics}><View style={{ flex: 1 }}><Text style={s.bigMetric}>{mean === null ? '—' : friendlyNumber(mean)}<Text style={s.metricUnit}> / 5</Text></Text><Text style={s.caption}>Moyenne des jours visibles</Text></View><View style={s.metricSecondary}><Text style={s.mediumMetric}>{stats.meta.participation === null ? '—' : `${stats.meta.participation}%`}</Text><Text style={s.caption}>Participation sur 7 jours</Text></View></View>
                <MoodChart data={stats.data} /><View style={s.maskNotice}><EyeSlashIcon color={c.muted} size={18} /><Text style={[s.caption, { flex: 1 }]}>{stats.meta.maskedDays} jours masqués ou sans données. Au moins {stats.meta.threshold} réponses sont nécessaires pour afficher une moyenne.</Text></View>
              </> : null}
            </View><View style={s.managerNote}><InfoIcon color={c.accent} size={24} /><View style={{ flex: 1, gap: 8 }}><Text style={s.infoTitle}>Un signal pour ouvrir la discussion.</Text><Text style={s.body}>Cette météo invite à échanger avec l’équipe et à adapter les conditions de travail. Elle ne permet pas d’évaluer une personne ou de poser un diagnostic.</Text></View></View>
            <Pressable accessibilityRole="button" style={[s.textLink, { alignSelf: 'flex-start' }]} onPress={() => navigate('guide')}><Text style={s.linkText}>Et maintenant, comment agir ?</Text><ArrowUpRightIcon color={c.muted} size={17} /></Pressable>
          </>
        </> : page === 'privacy' ? <>
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
  safe: { flex: 1, backgroundColor: c.background }, app: { flex: 1, flexDirection: 'row' },
  loading: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brand: { fontSize: 30, fontWeight: '700', letterSpacing: -1.3, color: c.text },
  body: { fontSize: 14, lineHeight: 22, color: c.muted }, caption: { fontSize: 12, lineHeight: 19, color: c.muted },
  kicker: { fontFamily: mono, fontSize: 10, letterSpacing: 1.2, lineHeight: 17, color: c.dim },
  action: { minHeight: 50, paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15, borderWidth: 1 },
  actionPrimary: { backgroundColor: c.accent, borderColor: c.accent }, actionSecondary: { backgroundColor: 'transparent', borderColor: c.line }, actionText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 }, disabled: { opacity: 0.4 },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, linkText: { fontSize: 12, color: c.muted, textDecorationLine: 'underline' },
  liveDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: c.accent }, divider: { height: 1, backgroundColor: c.line, marginVertical: 3 },
  loginOuter: { flexGrow: 1, maxWidth: 1400, width: '100%', alignSelf: 'center' }, loginTop: { padding: 24, minHeight: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: c.line },
  loginLayout: { flex: 1, padding: 24, gap: 40, maxWidth: 1140, width: '100%', alignSelf: 'center', paddingVertical: 48 }, loginIntro: { gap: 28 },
  loginTitle: { fontSize: 66, lineHeight: 70, letterSpacing: -3, fontWeight: '600', color: c.text }, loginWeather: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  miniWeather: { width: 66, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  loginForm: { backgroundColor: c.panel, padding: 28, gap: 22, borderWidth: 1, borderColor: c.line, alignSelf: 'stretch' }, panelTitle: { color: c.text, fontSize: 24, lineHeight: 29, letterSpacing: -0.7, fontWeight: '500' },
  fieldLabel: { fontFamily: mono, color: c.muted, fontSize: 10, letterSpacing: 1 }, input: { color: c.text, backgroundColor: c.background, borderWidth: 1, borderColor: c.line, minHeight: 50, padding: 14, fontSize: 14 },
  loginFooter: { padding: 24, gap: 10, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  sidebar: { width: 250, borderRightWidth: 1, borderRightColor: c.line, paddingTop: 32, paddingHorizontal: 22, backgroundColor: c.background }, teamName: { fontSize: 12, lineHeight: 20, color: c.text },
  sideNav: { marginTop: 38, gap: 8 }, navItem: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderRadius: 4 }, navActive: { backgroundColor: c.elevated }, navText: { fontSize: 12, color: c.muted, flex: 1 }, navDot: { width: 5, height: 5, backgroundColor: c.accent, borderRadius: 4 },
  sidebarNote: { gap: 15, paddingVertical: 24, borderTopWidth: 1, borderTopColor: c.line }, userRow: { paddingVertical: 24, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { backgroundColor: c.elevated, width: 35, height: 35, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 13, color: c.accent }, userName: { fontSize: 12, color: c.text },
  topbar: { height: 70, paddingHorizontal: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: c.line },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: c.panel, borderWidth: 1, borderColor: c.line }, statusText: { color: c.muted, fontSize: 9, letterSpacing: 1, fontFamily: mono }, iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 36, paddingBottom: 28, maxWidth: 1040, alignSelf: 'center', width: '100%', gap: 24 },
  demoBar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.line }, demoText: { fontFamily: mono, fontSize: 9, color: c.yellow, letterSpacing: 0.4 }, demoSwitch: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }, date: { fontSize: 11, color: c.muted },
  headingRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-end', marginBottom: 4 }, hello: { fontSize: 13, color: c.muted, marginBottom: 12 }, heroTitle: { fontSize: 46, lineHeight: 51, letterSpacing: -1.8, fontWeight: '600', color: c.text }, heroCorner: { alignItems: 'flex-end', gap: 16, paddingBottom: 5 },
  questionPanel: { backgroundColor: c.cream, minHeight: 218, borderRadius: 8, overflow: 'hidden' }, questionCopy: { flex: 1, padding: 26, gap: 20 }, questionTitle: { fontSize: 32, lineHeight: 37, fontWeight: '500', letterSpacing: -1.1, color: c.ink }, questionBody: { fontSize: 12, lineHeight: 19, color: '#506050' }, questionArt: { minWidth: 220, flex: 0.65, justifyContent: 'center', backgroundColor: '#dce6c3' },
  art: { height: 240, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, orbit: { position: 'absolute', borderWidth: 1, borderColor: '#b5c39c' }, artCloud: { position: 'absolute', bottom: 25, right: 28, backgroundColor: '#dce6c3', padding: 5 },
  weatherGrid: { flexDirection: 'row', gap: 8, marginTop: -8 }, weatherCard: { flex: 1, minWidth: 0, minHeight: 156, borderRadius: 7, padding: 15, gap: 14, justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' }, weatherSelected: { borderColor: c.text, transform: [{ translateY: -5 }] }, weatherNumber: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', height: 16 }, weatherIndex: { fontFamily: mono, fontSize: 9, color: c.ink }, weatherTitle: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: c.ink }, weatherLabel: { textAlign: 'center', fontSize: 10, color: '#354633' },
  tagHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 4 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: -8 }, tag: { minHeight: 44, borderWidth: 1, borderColor: c.line, borderRadius: 4, paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, tagSelected: { backgroundColor: c.elevated, borderColor: c.accent }, tagText: { fontSize: 12, color: c.muted },
  sendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginTop: 2 }, trustLine: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  bottomInfo: { paddingTop: 24, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', justifyContent: 'space-between', gap: 14, marginTop: 2 }, infoTitle: { color: c.text, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  confirmPanel: { backgroundColor: c.accent, borderRadius: 7, padding: 32, gap: 22 }, confirmTitle: { fontSize: 29, lineHeight: 35, letterSpacing: -0.9, color: c.ink, fontWeight: '500' }, confirmBody: { fontSize: 14, lineHeight: 23, color: '#344b30' },
  chartPanel: { backgroundColor: c.panel, borderWidth: 1, borderColor: c.line, padding: 22, borderRadius: 7, gap: 24 }, chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, period: { padding: 9, borderWidth: 1, borderColor: c.line }, periodText: { fontFamily: mono, fontSize: 9, letterSpacing: 1, color: c.muted }, metrics: { flexDirection: 'row', alignItems: 'center', gap: 24 }, bigMetric: { fontSize: 52, fontWeight: '500', letterSpacing: -2, color: c.accent }, metricUnit: { fontSize: 20, letterSpacing: 0, color: c.dim }, mediumMetric: { color: c.text, fontSize: 26, letterSpacing: -0.7 }, metricSecondary: { borderLeftWidth: 1, borderLeftColor: c.line, paddingLeft: 20, gap: 6, flex: 1 },
  chartLoading: { minHeight: 250, alignItems: 'center', justifyContent: 'center', gap: 20 }, maskNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line },
  managerNote: { flexDirection: 'row', gap: 15, backgroundColor: c.panel, padding: 20, borderLeftWidth: 2, borderLeftColor: c.line }, infoRow: { flexDirection: 'row', gap: 18, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: c.line }, infoIcon: { width: 42, height: 42, backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }, intro: { maxWidth: 550, fontSize: 16, color: c.muted, lineHeight: 26 },
  footer: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 12, paddingTop: 20, gap: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' },
  mobileNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.background, paddingVertical: 8, paddingHorizontal: 10, gap: 6 }, navMobile: { flex: 1, flexDirection: 'column', paddingVertical: 9, paddingHorizontal: 4, gap: 7, minHeight: 58 }, error: { color: '#ffbaad', fontSize: 13, lineHeight: 20 },
});
