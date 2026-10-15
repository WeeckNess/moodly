import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError, strapiApi, tokenStore, type Session, type TeamStats } from './src/strapi';
import { localDay } from './src/date';
import { clearPrivateSupport, clearSupportMemory, recordPrivateMood } from './src/support';
import { clearPersonalHistory, clearPersonalMemory, readPersonalHistory, savePersonalMood } from './src/personalHistory';
import type { PersonalMood } from './src/personalHistoryLogic';
import { colors as c } from './src/theme';
import { LoginScreen } from './src/components/LoginScreen';
import { ManagerPortal } from './src/components/ManagerPortal';
import { MoodFlow } from './src/components/MoodFlow';
import { ProfilePortal, type ProfileSection } from './src/components/ProfilePortal';

function Eclaircie() {
  const [session, setSession] = useState<Session | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [page, setPage] = useState<'home' | 'profile'>('home');
  const [profileSection, setProfileSection] = useState<ProfileSection>(null);
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
  const [history, setHistory] = useState<PersonalMood[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const requestVersion = useRef(0);
  const accountEpoch = useRef(0);
  const historyKey = session?.privateSupportKey ?? null;

  useEffect(() => {
    let active = true;
    void tokenStore.read().then(async token => {
      if (!token) return;
      try { const info = await strapiApi.session(token); if (active) { accountEpoch.current++; setSession(info); setJwt(token); } }
      catch { await tokenStore.clear(); }
    }).catch(() => setError('La session n’a pas pu être restaurée. Reconnecte-toi.')).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setHistory([]); setHistoryError('');
    if (!historyKey || session?.role !== 'collaborateur') { setHistoryLoading(false); return; }
    setHistoryLoading(true);
    void readPersonalHistory(historyKey, localDay()).then(entries => { if (active) setHistory(entries); }).catch(() => { if (active) setHistoryError('Ton récap local n’a pas pu être chargé. Ta météo collective reste indépendante.'); }).finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [historyKey, session?.role, session?.day]);
  const refreshStats = useCallback(async () => {
    if (session?.role !== 'manager') return;
    const version = ++requestVersion.current;
    setStatsLoading(true); setStatsError('');
    try {
      const data = await strapiApi.teamStats(jwt!);
      if (version === requestVersion.current) setStats(data);
    } catch (err) {
      if (version === requestVersion.current) { setStats(null); setStatsError(err instanceof ApiError && err.status === 401 ? 'Ta session a expiré. Reconnecte-toi depuis ton profil.' : err instanceof Error ? err.message : 'Chargement impossible.'); }
    } finally { if (version === requestVersion.current) setStatsLoading(false); }
  }, [session?.role, jwt]);
  useEffect(() => { void refreshStats(); }, [refreshStats]);
  useEffect(() => {
    function refreshSession() {
      if (!session) return;
      if (session.role === 'manager') void refreshStats();
      const epoch = accountEpoch.current;
      if (jwt) void strapiApi.session(jwt).then(info => {
        if (epoch !== accountEpoch.current) return;
        setSession(info);
        if (session.day !== info.day) { setScore(null); setTags([]); setSentNow(false); }
      }).catch(() => { if (epoch === accountEpoch.current) setError('Reconnecte-toi depuis ton profil pour renouveler ta session.'); });
      else if (session.day !== localDay()) { setSession({ ...session, submitted: false, day: localDay() }); setScore(null); setTags([]); setSentNow(false); }
    }
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refreshSession(); });
    const interval = setInterval(() => { if (session && session.day !== localDay()) refreshSession(); }, 60000);
    return () => { subscription.remove(); clearInterval(interval); };
  }, [session, jwt, refreshStats]);
  function openProfile(section: ProfileSection = null) { setProfileSection(section); setPage('profile'); }
  async function login(credentials = { identifier, password }) {
    if (busy) return;
    if (!credentials.identifier.trim() || !credentials.password) { setError('Renseigne ton adresse et ton mot de passe.'); return; }
    setBusy(true); setError('');
    const epoch = ++accountEpoch.current;
    try {
      const result = await strapiApi.login(credentials.identifier.trim(), credentials.password);
      const info = await strapiApi.session(result.jwt);
      if (epoch !== accountEpoch.current) return;
      await tokenStore.write(result.jwt);
      if (epoch !== accountEpoch.current) return;
      requestVersion.current++; setStats(null); setJwt(result.jwt); setSession(info); setPassword(''); setScore(null); setTags([]); setSentNow(false); setSupportPrompt(false); setPage('home');
    } catch (err) { if (epoch === accountEpoch.current) setError(err instanceof ApiError && [400, 401].includes(err.status) ? 'Adresse ou mot de passe incorrect.' : err instanceof Error ? err.message : 'Connexion impossible.'); }
    finally { if (epoch === accountEpoch.current) setBusy(false); }
  }
  async function logout() {
    try { await tokenStore.clear(); }
    catch { setHistoryError('La déconnexion n’a pas pu aboutir. Réessaie.'); return; }
    accountEpoch.current++; requestVersion.current++;
    setSession(null); setJwt(null); setPage('home'); setError(''); setStats(null); setScore(null); setTags([]); setSentNow(false); setSupportPrompt(false); setHistory([]); setHistoryError(''); setBusy(false); setIdentifier(''); setPassword('');
    clearSupportMemory(); clearPersonalMemory();
  }
  async function submit() {
    if (score === null || !session || busy) return;
    const epoch = accountEpoch.current;
    const profile = historyKey;
    setBusy(true); setError('');
    try {
      const result = await strapiApi.submitMood(jwt!, score, tags);
      const submittedDay = result.data.day;
      if (epoch !== accountEpoch.current) return;
      setSession({ ...session, submitted: true, day: submittedDay }); setSentNow(true);
      if (profile) {
        try { const entries = await savePersonalMood(profile, { day: submittedDay, score, tags }, submittedDay); if (epoch === accountEpoch.current) { setHistory(entries); setHistoryError(''); } }
        catch { if (epoch === accountEpoch.current) setHistoryError('Ta météo est partagée, mais son souvenir n’a pas pu être enregistré sur cet appareil.'); }
        const prompt = await recordPrivateMood(profile, submittedDay, score);
        if (epoch === accountEpoch.current) setSupportPrompt(prompt);
      }
    } catch (err) {
      if (epoch !== accountEpoch.current) return;
      if (err instanceof ApiError && err.status === 409) { setSession({ ...session, submitted: true, day: localDay() }); setSentNow(false); }
      else if (err instanceof ApiError && err.status === 401) setError('Ta session a expiré. Reconnecte-toi depuis ton profil.');
      else setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally { if (epoch === accountEpoch.current) setBusy(false); }
  }
  async function clearHistory() {
    if (!historyKey) throw new Error('Profil indisponible');
    await clearPersonalHistory(historyKey, localDay());
    await clearPrivateSupport(historyKey);
    setHistory([]); setHistoryError(''); setSupportPrompt(false);
  }
  if (restoring) return <View style={s.loading}><ActivityIndicator color={c.accent} /><Text style={s.body}>Un instant…</Text></View>;
  if (!session) return <LoginScreen identifier={identifier} password={password} onIdentifier={setIdentifier} onPassword={setPassword} onLogin={() => void login()} onTestLogin={__DEV__ ? role => void login({ identifier: role === 'manager' ? 'manager@eclaircie.test' : 'collaborateur2@eclaircie.test', password: 'EclaircieDemo2026!' }) : undefined} busy={busy} error={error} />;
  if (page === 'profile') return <ProfilePortal session={session} today={localDay()} history={history} loading={historyLoading} error={historyError} section={profileSection} onBack={() => setPage('home')} onLogout={() => void logout()} onClear={clearHistory} />;
  if (session.role === 'manager') return <ManagerPortal session={session} stats={stats} loading={statsLoading} error={statsError} onRefresh={() => void refreshStats()} onProfile={() => openProfile()} onHelp={() => openProfile('guide')} />;
  return <MoodFlow key={session.privateSupportKey ?? session.name} score={score} onScore={setScore} tags={tags} onTags={setTags} submitted={session.submitted} sentNow={sentNow} busy={busy} error={error} supportPrompt={supportPrompt} onDismissSupport={() => setSupportPrompt(false)} onSubmit={() => void submit()} onProfile={() => openProfile()} onSupport={() => openProfile('support')} />;
}
export default function App() { return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><Eclaircie /></SafeAreaProvider></GestureHandlerRootView>; }
const s = StyleSheet.create({ loading: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', gap: 20 }, body: { fontSize: 14, lineHeight: 22, color: c.muted } });
