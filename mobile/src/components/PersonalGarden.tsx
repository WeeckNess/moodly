import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors as c, mono } from '../theme';
import { growthStage, personalReport, type PersonalMood } from '../personalHistoryLogic';
import { readGrowth, readTreeSpecies, saveTreeSpecies } from '../personalHistory';
import { weathers } from '../weather';
import { GrowingTree } from './GrowingTree';
import { treeSpecies, type TreeSpecies } from '../treeGeometry';

export function PersonalGarden({ profile, history, today }: { profile?: string; history: PersonalMood[]; today: string }) {
  const [species, setSpecies] = useState<TreeSpecies>('oak');
  const [speciesError, setSpeciesError] = useState('');
  const [savingSpecies, setSavingSpecies] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const shownCount = previewCount ?? count;
  const [period, setPeriod] = useState<7 | 30>(7);
  const [error, setError] = useState(false);
  const stage = growthStage(shownCount ?? 0);
  useEffect(() => {
    let active = true;
    setCount(null); setError(false);
    if (profile) void readGrowth(profile).then(value => { if (active) setCount(value.count); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [profile, history]);
  useEffect(() => {
    let active = true;
    if (profile) void readTreeSpecies(profile).then(value => { if (active) setSpecies(value); }).catch(() => { if (active) setSpeciesError('Ton choix d’arbre n’a pas pu être chargé.'); });
    return () => { active = false; };
  }, [profile, history]);
  async function chooseSpecies(next: TreeSpecies) {
    if (savingSpecies || !profile) return;
    setSavingSpecies(true); setSpeciesError('');
    try { await saveTreeSpecies(profile, next); setSpecies(next); }
    catch { setSpeciesError('Ton choix n’a pas pu être enregistré. Réessaie.'); }
    finally { setSavingSpecies(false); }
  }
  const report = personalReport(history, today, period);
  return <>
    <View style={s.garden}>
      <View style={s.top}><Text style={s.kicker}>TON JARDIN INTÉRIEUR</Text><Text style={s.pill}>Personnel</Text></View>
      <Text style={s.subtitle}>Quel arbre te ressemble ?</Text>
      <View style={s.testSteps}>{treeSpecies.map(tree => <Pressable key={tree.id} accessibilityRole="button" accessibilityLabel={`Choisir le ${tree.name.toLowerCase()}`} accessibilityState={{ selected: species === tree.id, disabled: savingSpecies }} disabled={savingSpecies} onPress={() => void chooseSpecies(tree.id)} style={({ pressed }) => [s.speciesButton, species === tree.id && s.active, pressed && { transform: [{ scale: .96 }], opacity: .85 }]}><Text style={[s.tabText, species === tree.id && { color: c.ink }]}>{tree.name}</Text></Pressable>)}</View>
      <Text style={s.caption}>{treeSpecies.find(tree => tree.id === species)!.description} Tu peux changer d’essence sans perdre ta progression.</Text>
      {speciesError ? <Text accessibilityRole="alert" style={s.error}>{speciesError}</Text> : null}
      <GrowingTree days={shownCount ?? 0} species={species} label={`${treeSpecies.find(tree => tree.id === species)!.name} : ${['graine', 'pousse', 'jeune arbre', 'arbre en croissance', 'arbre épanoui'][stage]}. ${shownCount ?? 0} journées ${previewCount === null ? 'partagées' : 'simulées'}.`} />
      <View style={s.testPanel}>
        <Text style={s.subtitle}>Explorer l’évolution de mon arbre</Text>
        <Text style={s.caption}>Ajoute des jours simulés pour voir la croissance. Tes rapports et ta progression réelle ne changent pas.</Text>
        <View style={s.testSteps}>
          {[1, 7].map(days => <Pressable key={days} accessibilityRole="button" accessibilityLabel={`Simuler ${days} jour${days > 1 ? 's' : ''} de plus`} onPress={() => setPreviewCount(value => (value ?? count ?? 0) + days)} style={[s.testStep, s.active]}><Text style={[s.tabText, { color: c.ink }]}>+ {days} jour{days > 1 ? 's' : ''}</Text></Pressable>)}
          <Pressable accessibilityRole="button" accessibilityLabel="Voir la prochaine étape de l’arbre" disabled={stage === 4} onPress={() => setPreviewCount([1, 5, 12, 24][stage])} style={[s.testStep, stage === 4 && { opacity: 0.4 }]}><Text style={s.tabText}>Étape suivante</Text></Pressable>
        </View>
        <View style={s.testSteps}>{[{ count: 0, label: 'Graine' }, { count: 1, label: 'Pousse' }, { count: 5, label: 'Jeune arbre' }, { count: 12, label: 'Croissance' }, { count: 24, label: 'Épanoui' }].map(step => <Pressable key={step.count} accessibilityRole="button" accessibilityLabel={`Tester l’arbre : ${step.label}`} accessibilityState={{ selected: previewCount === step.count }} onPress={() => setPreviewCount(step.count)} style={[s.testStep, previewCount === step.count && s.active]}><Text style={[s.tabText, previewCount === step.count && { color: c.ink }]}>{step.label}</Text><Text style={[s.caption, previewCount === step.count && { color: c.ink }]}>{step.count} j</Text></Pressable>)}</View>
        {previewCount !== null && <Pressable accessibilityRole="button" onPress={() => setPreviewCount(null)} style={s.testToggle}><Text style={s.linkText}>Revenir à mon arbre réel</Text></Pressable>}
      </View>
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
const s = StyleSheet.create({ speciesButton: { minHeight: 48, paddingHorizontal: 22, borderRadius: 24, justifyContent: 'center', backgroundColor: '#ffffff08' }, error: { color: '#ffc1b6', fontSize: 12, lineHeight: 18 }, testPanel: { gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 12 }, testToggle: { minHeight: 44, justifyContent: 'center' }, testSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, testStep: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 4, justifyContent: 'center', backgroundColor: '#ffffff08' }, linkText: { color: c.sage, fontSize: 12 }, garden: { borderRadius: 26, backgroundColor: '#ffffff06', borderWidth: 1, borderColor: c.line, padding: 22, gap: 12 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, kicker: { fontFamily: mono, fontSize: 9, letterSpacing: 1.2, color: c.muted }, pill: { fontSize: 9, color: c.muted, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 7 }, title: { color: c.text, fontSize: 24, lineHeight: 29, letterSpacing: -0.6 }, subtitle: { fontSize: 14, color: c.text }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 11, lineHeight: 17 }, report: { gap: 16, padding: 22, borderRadius: 26, borderWidth: 1, borderColor: c.line }, tabs: { flexDirection: 'row', gap: 8 }, tab: { minHeight: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center', backgroundColor: '#ffffff08' }, active: { backgroundColor: c.sage }, tabText: { fontSize: 12, color: c.text }, average: { fontSize: 40, color: c.text, letterSpacing: -1 }, tagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 10 } });
