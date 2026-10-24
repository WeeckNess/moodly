import { TourTarget } from './tour/OnboardingTour';
import { useEffect, useState, type RefObject } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors as c, mono } from '../theme';
import { personalReport, type PersonalMood } from '../personalHistoryLogic';
import { readGrowth } from '../personalHistory';
import { weathers } from '../weather';
import { profileStage } from '../profileTree';
import { SoftGardenTree } from './SoftGardenTree';

export function PersonalGarden({ profile, history, today, tourScroll }: { tourScroll?: RefObject<ScrollView | null>; profile?: string; history: PersonalMood[]; today: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setCount(null); setError(false);
    if (profile) void readGrowth(profile).then(value => { if (active) setCount(value.count); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [profile, history]);
  const report = personalReport(history, today, period);
  return <>
    <TourTarget id="garden" scroll={tourScroll} style={s.garden}>
      <SoftGardenTree days={count ?? 0} label={`Ton arbre : ${profileStage(count ?? 0).label.toLowerCase()}. ${count ?? 0} journées enregistrées.`} />
      <Text accessibilityRole="header" style={s.title}>{`${profileStage(count ?? 0).label}. À ton rythme.`}</Text>
      <Text style={s.body}>{error ? 'Ton arbre n’a pas pu être chargé. Réouvre ton profil pour réessayer.' : count === null ? 'Ton jardin arrive…' : `${count} météo${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}. Chaque météo compte, de l’orage au soleil.`}</Text>
      <Text style={s.caption}>Aucun objectif, aucune série à maintenir. Ton arbre ne régresse pas lors d’une pause. {Platform.OS === 'web' ? 'Sur le web, il reste dans cette session.' : 'Il grandit sur cet appareil, sans partager sa progression.'}</Text>

    </TourTarget>
    <View style={s.report}>
      <Text style={s.kicker}>PRENDRE DU RECUL</Text>
      <Text accessibilityRole="header" style={s.title}>Tes rapports personnels.</Text>
      <View style={s.tabs}>{([7, 30] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)} style={[s.tab, period === value && s.active]}><Text style={[s.tabText, period === value && { color: c.ink }]}>{value === 7 ? '7 jours' : '30 jours'}</Text></Pressable>)}</View>
      {report.count ? <>
        <Text style={s.average}>{report.average!.toFixed(1).replace('.', ',')}<Text style={s.body}> / 5</Text></Text>
        <Text style={s.body}>{report.count} journée{report.count > 1 ? 's' : ''} renseignée{report.count > 1 ? 's' : ''} sur {period}. Météo moyenne : {weathers[Math.round(report.average!) - 1].label.toLowerCase()}.</Text>
        <Text style={s.caption}>Les jours sans réponse ne sont pas comptés. Cette moyenne décrit tes saisies ; elle ne mesure pas ta santé.</Text>
        {report.tags.length > 0 && <View style={{ gap: 10 }}><Text style={s.subtitle}>Ce qui revient dans tes journées</Text>{report.tags.map(([tag, occurrences]) => <View key={tag} style={s.tagRow}><Text style={s.body}>{tag}</Text><Text style={s.caption}>{occurrences} journée{occurrences > 1 ? 's' : ''}</Text></View>)}<Text style={s.caption}>Tes raisons choisies, sans interprétation automatique de leurs effets.</Text></View>}
      </> : <Text style={s.body}>Ton premier rapport apparaîtra après une météo partagée sur cet appareil. En attendant, prends ton temps.</Text>}
    </View>
  </>;
}
const s = StyleSheet.create({ garden: { borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, padding: 22, gap: 12 }, kicker: { fontFamily: mono, fontSize: 9, letterSpacing: 1.2, color: c.muted }, title: { color: c.text, fontSize: 24, lineHeight: 29, letterSpacing: -0.6 }, subtitle: { fontSize: 14, color: c.text }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 11, lineHeight: 17 }, report: { gap: 16, padding: 22, borderRadius: 26, borderWidth: 1, borderColor: c.line }, tabs: { flexDirection: 'row', gap: 8 }, tab: { minHeight: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center', backgroundColor: c.surface }, active: { backgroundColor: c.sage }, tabText: { fontSize: 12, color: c.text }, average: { fontSize: 40, color: c.text, letterSpacing: -1 }, tagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 10 } });
