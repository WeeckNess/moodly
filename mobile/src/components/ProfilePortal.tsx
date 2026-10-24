import { TourTarget, TourReplayButton } from './tour/OnboardingTour';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ArrowLeftIcon, ArrowRightIcon, CaretDownIcon, LockSimpleIcon, ShieldCheckIcon, SignOutIcon, TrashIcon } from '../icons';
import { colors as c, mono, moodPalette } from '../theme';
import { weathers } from '../weather';
import { monthCells, type PersonalMood } from '../personalHistoryLogic';
import type { Session } from '../strapi';
import { HapticSettings } from './HapticSettings';
import { PersonalGarden } from './PersonalGarden';
import { SupportResources } from './SupportResources';
import { WeatherMorph } from './WeatherMorph';
import { useReducedMotion } from '../motionPreferences';
export type ProfileSection = 'privacy' | 'guide' | 'support' | null;
type Props = { personalOnly?: boolean; session: Session; today: string; history: PersonalMood[]; loading: boolean; error: string; section: ProfileSection; onBack: () => void; onLogout: () => void; onClear: () => Promise<void> };
export function ProfilePortal(props: Props) {
  const scroll = useRef<ScrollView>(null);
  const employee = props.session.role === 'collaborateur' || props.personalOnly === true;
  const [selected, setSelected] = useState(props.today);
  useEffect(() => {
    if (props.history.length && !props.history.some(entry => entry.day === props.today)) { setSelected(props.history[0].day); setMonth(props.history[0].day.slice(0, 7)); }
  }, [props.today, props.history]);
  const [month, setMonth] = useState(props.today.slice(0, 7));
  const [expanded, setExpanded] = useState<ProfileSection>(props.section);
  const [confirm, setConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  const entry = props.history.find(day => day.day === selected);
  const reduced = useReducedMotion();
  const motion = useSharedValue(entry?.score ?? 3);
  useEffect(() => {
    motion.value = withTiming(entry?.score ?? 3, { duration: reduced ? 0 : 1100, easing: Easing.inOut(Easing.cubic) });
    return () => cancelAnimation(motion);
  }, [entry?.score, reduced, motion]);
  const dayStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(motion.value, [1, 2, 3, 4, 5], moodPalette.accents) }));
  const cutoff = new Date(props.today + 'T12:00:00Z'); cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  const first = cutoff.toISOString().slice(0, 10);
  const prettyDay = new Date(selected + 'T12:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const monthName = new Date(month + '-01T12:00:00Z').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  function moveMonth(offset: number) {
    const date = new Date(month + '-01T12:00:00Z'); date.setUTCMonth(date.getUTCMonth() + offset);
    const next = date.toISOString().slice(0, 7); setMonth(next);
    setSelected(props.history.find(day => day.day.startsWith(next))?.day ?? (next === props.today.slice(0, 7) ? props.today : `${next}-01`));
  }
  async function clear() {
    setClearing(true); setClearError('');
    try { await props.onClear(); setConfirm(false); }
    catch { setClearError('L’effacement n’a pas pu aboutir. Réessaie dans un instant.'); }
    finally { setClearing(false); }
  }
  return <SafeAreaView style={s.safe}><StatusBar style="dark" /><View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel={props.session.role === 'manager' ? 'Retour à mon espace manager' : 'Retour à ma météo'} disabled={clearing} onPress={props.onBack} style={s.icon}><ArrowLeftIcon size={22} color={c.text} /></Pressable><Text style={s.headerTitle}>Mon profil</Text><View style={{ width: 44 }} /></View>
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      <View style={s.identity}><View style={s.avatar}><Text style={s.initial}>{props.session.name.charAt(0).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={s.name}>{props.session.name}</Text><Text style={s.body}>{props.session.team.name}</Text></View><Text style={s.role}>{props.session.role === 'manager' ? 'Manager' : 'Salarié'}</Text></View>
      {props.error ? <Text accessibilityRole="alert" style={s.error}>{props.error}</Text> : null}
      {employee ? <>
        <View style={s.intro}><Text style={s.body}>Ces données, associées à ton nom, ne sont visibles que par toi</Text><Text accessibilityRole="header" style={s.title}>Tes jours,{ '\n' }ta météo.</Text><Text style={s.body}>Un souvenir de ton ressenti, jour après jour.</Text></View>
        <PersonalGarden profile={props.session.privateSupportKey} history={props.history} today={props.today} tourScroll={scroll} />
        {props.loading ? <View style={s.loading}><ActivityIndicator color={c.text} /><Text style={s.body}>Tes souvenirs arrivent…</Text></View> : <>
          <TourTarget id="calendar" scroll={scroll} style={s.calendar}><View style={s.monthRow}><Pressable accessibilityRole="button" accessibilityLabel="Mois précédent" disabled={month <= first.slice(0, 7)} onPress={() => moveMonth(-1)} style={[s.icon, month <= first.slice(0, 7) && { opacity: 0.3 }]}><ArrowLeftIcon size={18} color={c.text} /></Pressable><Text style={s.month}>{monthName}</Text><Pressable accessibilityRole="button" accessibilityLabel="Mois suivant" disabled={month >= props.today.slice(0, 7)} onPress={() => moveMonth(1)} style={[s.icon, month >= props.today.slice(0, 7) && { opacity: 0.3 }]}><ArrowRightIcon size={18} color={c.text} /></Pressable></View>
            <View style={s.grid}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => <Text key={index} style={s.weekday}>{label}</Text>)}{monthCells(month).map((day, index) => {
              const mood = props.history.find(entry => entry.day === day);
              const weather = mood ? weathers[mood.score - 1] : null;
              const unavailable = !day || day > props.today || day < first;
              return <View key={day ?? `blank-${index}`} style={s.cell}>{day && <Pressable accessibilityRole="button" accessibilityLabel={`${new Date(day + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, ${weather?.label ?? 'aucune météo'}`} accessibilityState={{ selected: selected === day, disabled: unavailable }} aria-pressed={selected === day} disabled={unavailable} onPress={() => setSelected(day)} style={[s.dayButton, weather && { backgroundColor: weather.color }, selected === day && s.selectedDay, unavailable && { opacity: 0.25 }]}>{weather && <weather.icon size={20} color={c.ink} weight="duotone" />}<Text style={[s.dayNumber, weather && { color: c.ink }, day === props.today && { fontWeight: '700' }]}>{Number(day.slice(-2))}</Text></Pressable>}</View>;
            })}</View><Text style={s.calendarHint}>Touche un jour pour retrouver ta météo.</Text>
          </TourTarget>
          <View accessibilityLiveRegion="polite">{entry ? <Animated.View style={[s.dayCard, dayStyle]}>
            <View style={s.dayHeader}><Text style={s.dayKicker}>RAPPORT JOURNALIER</Text></View>
            <View style={s.dayArt}><WeatherMorph value={motion} size={112} /></View>
            <Text style={s.dayMood}>{weathers[entry.score - 1].label}</Text><Text style={s.dayDate}>{prettyDay}</Text><Text style={{ color: c.ink, fontSize: 13, lineHeight: 20, marginTop: 12 }}>{weathers[entry.score - 1].message}</Text><Text style={{ color: c.ink, fontSize: 11, lineHeight: 17, marginTop: 12 }}>{entry.tags.length ? "Ce qui a joué dans ta journée :" : "Tu n’as pas ajouté de raison collective à cette météo."}</Text>
            {entry.tags.length > 0 && <View style={s.tags}>{entry.tags.map(tag => <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>)}</View>}
          </Animated.View> : <View style={s.empty}><LockSimpleIcon size={25} color={c.muted} /><Text style={s.emptyTitle}>{selected === props.today ? (props.session.submitted ? 'Ta météo a été partagée.' : 'Ta journée reste à raconter.') : 'Une journée sans souvenir.'}</Text><Text style={s.body}>{selected === props.today && props.session.submitted ? 'Ta météo a déjà été partagée aujourd’hui. Elle n’est pas enregistrée dans ce récapitulatif local.' : 'Aucune météo enregistrée pour cette date. Tu gardes le choix de partager, à ton rythme.'}</Text>{selected === props.today && !props.session.submitted && <Pressable accessibilityRole="button" onPress={props.onBack} style={s.primary}><Text style={s.primaryText}>Partager ma météo</Text><ArrowRightIcon size={18} color={c.ink} /></Pressable>}<Text style={s.caption}>{prettyDay}</Text></View>}</View>
        </>}
      </> : <View style={s.managerAccount}><ShieldCheckIcon size={34} color={c.sage} /><Text accessibilityRole="header" style={s.title}>Un espace{ '\n' }pour le collectif.</Text><Text style={s.body}>Tu consultes la météo anonyme de ton équipe. Le profil ne contient aucune réponse individuelle de tes collaborateurs.</Text></View>}
      <TourTarget id="support" scroll={scroll} revealOnMount={props.section === 'support'}><SupportResources contacts={props.session.team.supportContacts} /></TourTarget>
      <TourTarget id="guide" scroll={scroll}><TourReplayButton /></TourTarget>
      <View style={s.settings}>
        <HapticSettings />
        <Pressable accessibilityRole="button" accessibilityLabel="Mes données et confidentialité" accessibilityState={{ expanded: expanded === 'privacy' }} onPress={() => setExpanded(expanded === 'privacy' ? null : 'privacy')} style={s.setting}><Text style={s.settingText}>Mes données et confidentialité</Text><CaretDownIcon size={18} color={c.muted} /></Pressable>
        {expanded === 'privacy' && <View style={s.explanation}><Text style={s.body}>{employee ? 'Ton récap personnel conserve seulement tes notes et tes tags des 30 derniers jours sur cet appareil. Les souvenirs plus anciens sont effacés à l’ouverture de l’app. Ton arbre conserve seulement un nombre de journées partagées et la date de la dernière, sur cet appareil, jusqu’à l’effacement de ton récap. Il ne contient aucune note. Ta raison personnelle n’est jamais envoyée. Personne à part toi, sur cet appareil et pendant 30 jours, n’a accès à ces souvenirs.' : 'Le manager voit les moyennes de son équipe sur 30 jours. Les journées avec moins de cinq réponses restent masquées, sans liste de participants.'}</Text><Text style={s.body}>{props.personalOnly ? 'Ta météo de manager reste privée sur cet appareil. Elle n’est ajoutée à aucun agrégat et n’est transmise ni aux RH ni à ta hiérarchie.' : <>La météo collective est déterminée à partir des météos collectives mais elle n’est jamais reliée à ton identité. Le journal de participation retient uniquement si tu as répondu aujourd’hui. Réponses et journaux sont supprimés après 45 jours par défaut.</>}</Text></View>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === 'guide' }} onPress={() => setExpanded(expanded === 'guide' ? null : 'guide')} style={s.setting}><Text style={s.settingText}>Comment ça marche ?</Text><CaretDownIcon size={18} color={c.muted} /></Pressable>
        {expanded === 'guide' && <View style={s.explanation}><Text style={s.body}>Choisis ta météo avec l’arc, ajoute une raison si tu le souhaites et partage. La participation à la saisie de la météo du jour reste sur la base du volontariat et est facultative</Text><Text style={s.body}>Les managers eux, ne voient que la météo globale de leurs équipes sur 30 jours. Cela leur permet de suivre le moral de leurs équipes et de mener des actions visant à entretenir améliorer le bien-être des salariés</Text></View>}
        {employee && <Pressable accessibilityRole="button" onPress={() => { setClearError(''); setConfirm(true); }} style={s.setting}><Text style={s.settingText}>Effacer mon récap personnel</Text><TrashIcon size={18} color={c.muted} /></Pressable>}
        <Pressable accessibilityRole="button" onPress={props.onLogout} style={s.setting}><Text style={s.settingText}>Me déconnecter</Text><SignOutIcon size={18} color={c.muted} /></Pressable>
      </View>
    </ScrollView>
    <Modal visible={confirm} transparent onRequestClose={() => { if (!clearing) setConfirm(false); }}><View style={s.overlay}><View style={s.sheet} role="dialog" aria-modal accessibilityViewIsModal><Text accessibilityRole="header" style={s.emptyTitle}>Effacer tes souvenirs ?</Text><Text style={s.body}>Ton récap, ton arbre et ton compteur privé d’accompagnement seront effacés sur cet appareil. {props.personalOnly ? 'Aucune donnée de l’équipe n’est modifiée.' : 'Les réponses anonymes déjà partagées restent inchangées.'}</Text>{clearError ? <Text accessibilityRole="alert" style={s.error}>{clearError}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel="Confirmer l’effacement du récap" disabled={clearing} onPress={() => void clear()} style={s.primary}><Text style={s.primaryText}>Effacer mon récap</Text>{clearing && <ActivityIndicator color={c.ink} />}</Pressable><Pressable accessibilityRole="button" disabled={clearing} onPress={() => setConfirm(false)} style={s.cancel}><Text style={s.settingText}>Annuler</Text></Pressable></View></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, icon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: c.text, fontSize: 15, fontWeight: '500' }, content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 22 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' }, initial: { color: c.ink, fontSize: 21, fontWeight: '600' }, name: { color: c.text, fontSize: 19, letterSpacing: -0.3 }, role: { color: c.muted, fontSize: 10, backgroundColor: c.surface, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 }, body: { fontSize: 13, lineHeight: 21, color: c.muted }, caption: { fontSize: 10, lineHeight: 16, color: c.muted }, intro: { gap: 10 }, title: { color: c.text, fontSize: 34, lineHeight: 39, letterSpacing: -1, fontWeight: '500' }, trend: { flexDirection: 'row', alignItems: 'center', gap: 12 }, trendTitle: { fontSize: 13, color: c.text }, average: { color: c.text, fontSize: 31, letterSpacing: -0.8 }, unit: { fontSize: 13, letterSpacing: 0, color: c.muted }, dayCard: { borderRadius: 26, padding: 22, minHeight: 310, overflow: 'hidden' }, dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dayKicker: { fontFamily: mono, color: c.ink, fontSize: 9, letterSpacing: 1.3 }, dayArt: { minHeight: 142, alignItems: 'center', justifyContent: 'center' }, dayMood: { color: c.ink, fontSize: 32, letterSpacing: -1, fontWeight: '500' }, dayDate: { color: c.ink, fontSize: 12, lineHeight: 19, marginTop: 6, textTransform: 'capitalize' }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 }, tag: { backgroundColor: '#ffffff40', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, tagText: { color: c.ink, fontSize: 10 }, empty: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 24, padding: 22, gap: 15 }, emptyTitle: { color: c.text, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 }, primary: { minHeight: 48, padding: 16, backgroundColor: c.accent, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, primaryText: { color: c.ink, fontSize: 12, fontWeight: '600' }, calendar: { borderRadius: 24, padding: 12, borderWidth: 1, borderColor: c.line }, monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, month: { color: c.text, fontSize: 13, textTransform: 'capitalize' }, grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }, weekday: { width: '14.285714%', color: c.dim, fontSize: 10, textAlign: 'center', paddingVertical: 10 }, cell: { width: '14.285714%', padding: 2 }, dayButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: 'transparent' }, selectedDay: { borderColor: c.text }, dayNumber: { fontSize: 10, color: c.muted }, calendarHint: { color: c.muted, fontSize: 10, lineHeight: 17, paddingHorizontal: 6, marginTop: 14 }, settings: { borderTopWidth: 1, borderColor: c.line }, setting: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderColor: c.line }, settingText: { color: c.text, fontSize: 12, lineHeight: 19, flexShrink: 1 }, explanation: { gap: 15, paddingVertical: 16 }, loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 16 }, error: { color: c.error, fontSize: 12, lineHeight: 19 }, managerAccount: { paddingVertical: 18, gap: 20 }, overlay: { flex: 1, backgroundColor: '#263c2e66', padding: 24, justifyContent: 'center' }, sheet: { backgroundColor: c.panel, borderRadius: 24, padding: 24, gap: 20, maxWidth: 420, width: '100%', alignSelf: 'center' }, cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' } });
