import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors as c, mono } from '../theme';
import { growthStage, personalReport, type PersonalMood } from '../personalHistoryLogic';
import { readGrowth } from '../personalHistory';
import { weathers } from '../weather';
import { useReducedMotion } from './MoodDial';

export function PersonalGarden({ profile, history, today }: { profile?: string; history: PersonalMood[]; today: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const shownCount = previewCount ?? count;
  const [period, setPeriod] = useState<7 | 30>(7);
  const [error, setError] = useState(false);
  const stage = growthStage(shownCount ?? 0);
  const reduced = useReducedMotion();
  const growth = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    let active = true;
    setCount(null); setError(false);
    if (profile) void readGrowth(profile).then(value => { if (active) setCount(value.count); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [profile, history]);
  useEffect(() => { growth.stopAnimation(); growth.setValue(reduced ? 1 : 0.92); Animated.timing(growth, { toValue: 1, duration: reduced ? 0 : 800, useNativeDriver: true }).start(); }, [stage, reduced, growth]);
  const report = personalReport(history, today, period);
  return <>
    <View style={s.garden}>
      <View style={s.top}><Text style={s.kicker}>TON JARDIN INTÉRIEUR</Text><Text style={s.pill}>Personnel</Text></View>
      {__DEV__ && <View style={s.testPanel}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: testing }} onPress={() => { setTesting(value => !value); setPreviewCount(null); }} style={s.testToggle}><Text style={s.tabText}>{testing ? 'Fermer les tests' : 'Tester l’évolution de l’arbre'}</Text></Pressable>
        {testing && <>
          <Text style={s.caption}>Prévisualisation temporaire · aucune journée ajoutée.</Text>
          <View style={s.testSteps}>{[{ count: 0, label: 'Graine' }, { count: 1, label: 'Pousse' }, { count: 5, label: 'Jeune arbre' }, { count: 12, label: 'Croissance' }, { count: 24, label: 'Épanoui' }].map(step => <Pressable key={step.count} accessibilityRole="button" accessibilityLabel={`Tester l’arbre : ${step.label}`} accessibilityState={{ selected: previewCount === step.count }} onPress={() => setPreviewCount(step.count)} style={[s.testStep, previewCount === step.count && s.active]}><Text style={[s.tabText, previewCount === step.count && { color: c.ink }]}>{step.label}</Text><Text style={[s.caption, previewCount === step.count && { color: c.ink }]}>{step.count} j</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" onPress={() => setPreviewCount(null)} style={s.testToggle}><Text style={s.linkText}>Revenir à mon arbre réel</Text></Pressable>
        </>}
      </View>}
      <Animated.View accessible accessibilityRole="image" accessibilityLabel={`Ton arbre : ${['graine', 'pousse', 'jeune arbre', 'arbre en croissance', 'arbre épanoui'][stage]}. ${shownCount ?? 0} journées ${previewCount === null ? 'partagées' : 'simulées'}.`} style={{ alignItems: 'center', transform: [{ scale: growth }] }}>
        <Svg width="100%" height={205} viewBox="0 0 320 205">
          <Circle cx={243} cy={43} r={22} fill="#edda8c" opacity={0.7} />
          <Path d="M25 183 Q95 164 160 179 Q236 160 295 183" stroke="#a8b991" strokeWidth={1} fill="none" opacity={0.6} />
          {stage === 0 ? <Ellipse cx={160} cy={177} rx={7} ry={4} fill="#eedfa7" /> : <>
            <Path d={stage === 1 ? 'M160 181 Q156 164 160 144' : 'M160 181 Q154 130 161 65'} stroke="#c9b58a" strokeWidth={stage < 2 ? 4 : 7} strokeLinecap="round" fill="none" />
            {stage === 1 ? <><Path d="M160 157 Q127 155 134 133 Q158 133 160 157" fill="#a8c98f" /><Path d="M159 147 Q161 122 183 122 Q188 145 159 147" fill="#d5e4ad" /></> : <>
              <Path d="M159 131 L125 104 M159 111 L193 81 M160 92 L143 68" stroke="#c9b58a" strokeWidth={4} strokeLinecap="round" />
              <Ellipse cx={145} cy={66} rx={31} ry={30} fill="#b3cc91" /><Ellipse cx={185} cy={85} rx={34} ry={32} fill="#cfdda6" /><Ellipse cx={124} cy={102} rx={29} ry={27} fill="#91b481" />
              {stage >= 3 && <><Ellipse cx={104} cy={79} rx={33} ry={30} fill="#a4c38b" /><Ellipse cx={176} cy={48} rx={37} ry={32} fill="#c3d79d" /><Ellipse cx={211} cy={105} rx={32} ry={29} fill="#accb92" /></>}
              {stage >= 4 && <><Ellipse cx={220} cy={65} rx={33} ry={29} fill="#d4e1ae" /><Circle cx={127} cy={51} r={6} fill="#eedb92" /><Circle cx={202} cy={104} r={5} fill="#eedb92" /><Circle cx={176} cy={28} r={4} fill="#eedb92" /></>}
            </>}
          </>}
        </Svg>
      </Animated.View>
      <Text accessibilityRole="header" style={s.title}>{['Tout commence ici.', 'Une pousse, à ton rythme.', 'Tes repères prennent racine.', 'Un peu plus de place pour toi.', 'Ton arbre continue son chemin.'][stage]}</Text>
      <Text style={s.body}>{previewCount !== null ? `Aperçu à ${previewCount} journée${previewCount > 1 ? 's' : ''}. Ta progression réelle reste inchangée.` : error ? 'Ton arbre n’a pas pu être chargé. Réouvre ton profil pour réessayer.' : count === null ? 'Ton jardin arrive…' : `${count} journée${count > 1 ? 's' : ''} partagée${count > 1 ? 's' : ''}. Chaque météo compte, de l’orage au soleil.`}</Text>
      <Text style={s.caption}>Aucun objectif, aucune série à maintenir. Ton arbre ne régresse pas lors d’une pause. {Platform.OS === 'web' ? 'Sur le web, il reste dans cette session.' : 'Il grandit sur cet appareil, sans partager sa progression.'}</Text>

    </View>
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
const s = StyleSheet.create({ testPanel: { gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 12 }, testToggle: { minHeight: 44, justifyContent: 'center' }, testSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, testStep: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 4, justifyContent: 'center', backgroundColor: '#ffffff08' }, linkText: { color: c.sage, fontSize: 12 }, garden: { borderRadius: 26, backgroundColor: '#ffffff06', borderWidth: 1, borderColor: c.line, padding: 22, gap: 12 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, kicker: { fontFamily: mono, fontSize: 9, letterSpacing: 1.2, color: c.muted }, pill: { fontSize: 9, color: c.muted, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 7 }, title: { color: c.text, fontSize: 24, lineHeight: 29, letterSpacing: -0.6 }, subtitle: { fontSize: 14, color: c.text }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 11, lineHeight: 17 }, report: { gap: 16, padding: 22, borderRadius: 26, borderWidth: 1, borderColor: c.line }, tabs: { flexDirection: 'row', gap: 8 }, tab: { minHeight: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center', backgroundColor: '#ffffff08' }, active: { backgroundColor: c.sage }, tabText: { fontSize: 12, color: c.text }, average: { fontSize: 40, color: c.text, letterSpacing: -1 }, tagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 10 } });
