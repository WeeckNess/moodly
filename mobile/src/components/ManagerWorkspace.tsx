import { EmployeeCreation } from './EmployeeCreation';
import { TourTarget } from './tour/OnboardingTour';
import { useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ManagerPortal } from './ManagerPortal';
import { TeamActions } from './TeamActions';
import { SupportResources } from './SupportResources';
import { BrandMark } from './BrandMark';
import { HeaderActions } from './HeaderActions';
import { CaretRightIcon, HeartIcon, ShieldCheckIcon, SunIcon, BookOpenIcon } from '../icons';
import { colors as c, mono } from '../theme';
import { personalTrend, type PersonalMood } from '../personalHistoryLogic';
import { localDay } from '../date';

export type ManagerSection = 'team' | 'self' | 'act';
type Props = ComponentProps<typeof ManagerPortal> & { section: ManagerSection; onSection: (section: ManagerSection) => void; jwt: string; history: PersonalMood[]; onMood: () => void };
const tabs = [{ id: 'team' as const, label: 'Mon équipe' }, { id: 'self' as const, label: 'Pour moi' }, { id: 'act' as const, label: 'Agir ensemble' }];
export function ManagerWorkspace(props: Props) {
  const section = props.section, setSection = props.onSection;
  const trend = personalTrend(props.history, localDay());
  const submitted = props.history.some(entry => entry.day === localDay());
  const navigation = <><TourTarget id="manager-nav" style={s.navigation}>{tabs.map(tab => <Pressable key={tab.id} accessibilityRole="button" accessibilityLabel={`Espace manager : ${tab.label}`} accessibilityState={{ selected: section === tab.id }} onPress={() => setSection(tab.id)} style={[s.tab, section === tab.id && s.activeTab]}><Text style={[s.tabText, section === tab.id && { color: c.ink, fontWeight: '600' }]}>{tab.label}</Text></Pressable>)}</TourTarget><EmployeeCreation jwt={props.jwt} team={props.session.team.name} /></>;
  if (section === 'team') return <ManagerPortal {...props} navigation={navigation} onHelp={() => setSection('act')} />;
  return <SafeAreaView style={s.safe}><StatusBar style="dark" /><View style={s.header}><BrandMark /><HeaderActions onProfile={props.onProfile} /></View>{navigation}<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    {section === 'self' ? <>
      <Text style={s.kicker}>TON ÉQUILIBRE COMPTE AUSSI</Text><Text accessibilityRole="header" style={s.title}>Avant l’équipe,{ '\n' }un moment pour toi.</Text><Text style={s.body}>Tu accompagnes les autres. Tu as aussi le droit de souffler, de demander des moyens et de recevoir du soutien.</Text>
      <View style={[s.card, { backgroundColor: c.selected }]}><View style={s.row}><View style={s.round}><SunIcon size={30} color={c.ink} /></View><View style={{ flex: 1, gap: 5 }}><Text style={s.cardTitle}>Ma météo personnelle</Text><Text style={s.caption}>{submitted ? 'Ton moment du jour est enregistré.' : 'Comment te sens-tu aujourd’hui ?'}</Text></View></View><Pressable accessibilityRole="button" onPress={props.onMood} style={s.primary}><Text style={s.primaryText}>{submitted ? 'Retrouver ma météo' : 'Prendre mon moment'}</Text><CaretRightIcon size={20} color={c.ink} weight="bold" /></Pressable><View style={s.row}><ShieldCheckIcon size={16} color={c.link} /><Text style={[s.caption, { flex: 1 }]}>Privé. Cette météo ne rejoint aucun graphe d’équipe et n’est transmise ni aux RH ni à ta hiérarchie.</Text></View></View>
      <Pressable accessibilityRole="button" onPress={props.onProfile} style={s.card}><View style={s.row}><HeartIcon size={26} color={c.link} /><Text style={[s.cardTitle, { flex: 1 }]}>Mon jardin & mes rapports</Text><CaretRightIcon size={20} color={c.link} /></View><Text style={s.body}>{trend.count ? `${trend.count} météo${trend.count > 1 ? 's' : ''} sur les 7 derniers jours · moyenne personnelle ${trend.average!.toFixed(1).replace('.', ',')} / 5.` : 'Ton arbre et tes rapports personnels se construisent à ton rythme.'}</Text><Text style={s.caption}>{Platform.OS === 'web' ? 'Historique dans cette session web uniquement.' : 'Historique privé dans le stockage sécurisé de ce téléphone.'}</Text></Pressable>
      <MeetingPlanner personal />
      <SupportResources contacts={props.session.team.supportContacts} />
    </> : <>
      <Text style={s.kicker}>LA BOUSSOLE DU COLLECTIF</Text><Text accessibilityRole="header" style={s.title}>Écouter.{ '\n' }Choisir. Avancer.</Text><Text style={s.body}>Le graphe ouvre une discussion. Une action décidée ensemble lui donne une suite concrète.</Text>
      <MeetingPlanner />
      <TeamActions jwt={props.jwt} manager />
      <View style={s.card}><BookOpenIcon size={26} color={c.link} /><Text style={s.cardTitle}>Un rendez-vous avec le collectif</Text><Text style={s.body}>1. Partage la tendance, sans interpréter les journées masquées.</Text><Text style={s.body}>2. Demande ce qui faciliterait le quotidien, sans réclamer de témoignage individuel.</Text><Text style={s.body}>3. Choisissez une seule action réaliste et une échéance.</Text><Text style={s.body}>4. Faites le bilan après sa réalisation, puis ajustez ensemble.</Text><Text style={s.caption}>Le mood n’est pas un indicateur de performance. Aucune recherche de l’auteur d’une réponse.</Text></View>
    </>}
  </ScrollView></SafeAreaView>;
}
function MeetingPlanner({ personal = false }: { personal?: boolean }) {
  const topics = personal ? ['Mes priorités', 'Mes moyens', 'Mon rôle', 'Mon soutien'] : ['La charge', 'Les réunions', 'Les outils', 'La coopération'];
  const [topic, setTopic] = useState(topics[0]), [draft, setDraft] = useState(''), [ready, setReady] = useState(false), [preview, setPreview] = useState(false);
  function prepare() {
    setDraft(personal ? `J’aimerais échanger sur ${topic.toLowerCase()}.\n\nCe que je rencontre : …\nCe dont j’aurais besoin : …\nCe que nous pourrions ajuster : …\nUne date pour refaire le point : …` : `Un temps d’échange sur ${topic.toLowerCase()}.\n\n1. Qu’est-ce qui fonctionne bien et que nous souhaitons préserver ?\n2. Qu’est-ce qui rend le quotidien plus difficile ? Chacun peut choisir de ne pas répondre.\n3. Quel petit changement pourrions-nous essayer ensemble ?\n4. Quelle action retenons-nous et quand en faisons-nous le bilan ?`);
    setReady(true); setPreview(false);
  }
  return <View style={s.card}><Text style={s.cardTitle}>{personal ? 'Préparer mon propre échange' : 'Préparer une discussion d’équipe'}</Text><Text style={s.body}>{personal ? 'Pose tes besoins avant d’en parler à ta hiérarchie ou à un interlocuteur de confiance.' : 'Une trame pour ouvrir la discussion, sans chercher qui a répondu au questionnaire.'}</Text><View style={s.topics}>{topics.map(label => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: topic === label }} onPress={() => { setTopic(label); setReady(false); setDraft(''); }} style={[s.topic, topic === label && { backgroundColor: c.selected, borderColor: c.link }]}><Text style={s.caption}>{label}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={prepare} style={s.secondary}><Text style={s.link}>{ready ? 'Recréer la trame' : 'Créer ma trame d’échange'}</Text><CaretRightIcon size={18} color={c.link} /></Pressable>
    {ready && <><Text style={s.caption}>BROUILLON PRIVÉ · À ADAPTER</Text>{preview ? <Text selectable style={s.body}>{draft}</Text> : <TextInput accessibilityLabel={personal ? 'Mon brouillon pour ma hiérarchie' : 'Mon brouillon de discussion d’équipe'} multiline value={draft} onChangeText={setDraft} maxLength={2000} style={s.draft} />}<Pressable accessibilityRole="button" onPress={() => setPreview(value => !value)} style={s.secondary}><Text style={s.link}>{preview ? 'Modifier mon brouillon' : 'Afficher le texte à copier'}</Text></Pressable><Text style={s.caption}>Sélectionne le texte pour le copier. Ce brouillon n’est pas enregistré ni envoyé ; il disparaît en quittant cet espace.</Text></>}
  </View>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: c.background }, header: { minHeight: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, navigation: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 6, flexDirection: 'row' }, tab: { flex: 1, minHeight: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }, activeTab: { backgroundColor: c.selected }, tabText: { fontSize: 11, color: c.muted }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 24, paddingBottom: 40, gap: 22 }, kicker: { fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: 1.2 }, title: { color: c.text, fontSize: 34, lineHeight: 39, letterSpacing: -1 }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 10, lineHeight: 17 }, card: { backgroundColor: c.surface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: c.line, gap: 15 }, cardTitle: { color: c.text, fontSize: 19, lineHeight: 25, letterSpacing: -.4 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, round: { width: 52, height: 52, backgroundColor: c.yellow, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }, primary: { backgroundColor: c.accent, borderRadius: 16, minHeight: 52, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, primaryText: { color: c.ink, fontSize: 13, fontWeight: '600' }, topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, topic: { minHeight: 44, borderRadius: 14, paddingHorizontal: 13, justifyContent: 'center', borderWidth: 1, borderColor: c.line }, secondary: { flexDirection: 'row', minHeight: 48, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'space-between', gap: 10 }, link: { color: c.link, fontSize: 12 }, draft: { color: c.text, backgroundColor: c.panel, minHeight: 190, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: c.line, textAlignVertical: 'top', fontSize: Platform.OS === 'web' ? 16 : 13, lineHeight: 21 } });
