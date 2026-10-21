import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors as c, mono } from '../theme';
import { growthStage, personalReport, type PersonalMood } from '../personalHistoryLogic';
import { readGrowth, readTreeSpecies, saveTreeSpecies } from '../personalHistory';
import { weathers } from '../weather';
import { botanicalMilestones, botanicalStage } from '../gardenAnimation';
import { GrowingTree } from './GrowingTree';
import { gardenMilestones, gardenTitle, treeSpecies, type TreeSpecies } from '../treeGeometry';

export function PersonalGarden({ profile, history, today }: { profile?: string; history: PersonalMood[]; today: string }) {
  const [species, setSpecies] = useState<TreeSpecies>('oak');
  const [speciesError, setSpeciesError] = useState('');
  const [savingSpecies, setSavingSpecies] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const shownCount = previewCount ?? count;
  const [period, setPeriod] = useState<7 | 30>(7);
  const [error, setError] = useState(false);
  const stage = growthStage(shownCount ?? 0);
  const milestones = species === 'oak' ? botanicalMilestones : gardenMilestones;
  const nextMilestone = milestones.find(step => step.day > (shownCount ?? 0))?.day ?? null;
  const stageLabel = species === 'oak' ? botanicalStage(shownCount ?? 0).label.toLowerCase() : ['graine', 'pousse', 'jeune arbre', 'arbre en croissance', 'arbre épanoui'][stage];
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
      <GrowingTree interactive={previewCount !== null} days={shownCount ?? 0} species={species} label={`${treeSpecies.find(tree => tree.id === species)!.name} : ${stageLabel}. ${shownCount ?? 0} journées ${previewCount === null ? 'enregistrées' : 'simulées'}.`} />
      <View style={s.testPanel}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tester l’évolution du jardin" accessibilityState={{ expanded: testOpen }} onPress={() => setTestOpen(value => !value)} style={s.testToggle}><Text style={s.testLabel}>{testOpen ? 'Masquer les tests −' : 'Tester l’évolution +'}{previewCount !== null ? ` · ${previewCount} j simulés` : ''}</Text></Pressable>
        {testOpen && <>
          <Text style={s.caption}>Aperçu temporaire. Aucune donnée personnelle modifiée.</Text>
          <View style={s.testSteps}>
            {[1, 7, 30].map(days => <Pressable key={days} accessibilityRole="button" accessibilityLabel={`Simuler ${days} jour${days > 1 ? 's' : ''} de plus`} onPress={() => setPreviewCount(value => (value ?? count ?? 0) + days)} style={s.testStep}><Text style={s.testLabel}>+ {days} j</Text></Pressable>)}
            <Pressable accessibilityRole="button" accessibilityLabel="Voir la prochaine étape de l’arbre" disabled={nextMilestone === null} onPress={() => setPreviewCount(nextMilestone)} style={[s.testStep, nextMilestone === null && { opacity: .4 }]}><Text style={s.testLabel}>Étape suivante</Text></Pressable>
          </View>
          <View style={s.testSteps}>{milestones.map(step => <Pressable key={step.day} accessibilityRole="button" accessibilityLabel={`Tester l’arbre : ${step.label}`} accessibilityState={{ selected: previewCount === step.day }} onPress={() => setPreviewCount(step.day)} style={[s.testStep, previewCount === step.day && s.testSelected]}><Text style={s.testLabel}>{step.label} · {step.day} j</Text></Pressable>)}</View>
          {previewCount !== null && <Pressable accessibilityRole="button" onPress={() => setPreviewCount(null)} style={s.testToggle}><Text style={s.testLabel}>Revenir à mon arbre réel</Text></Pressable>}
        </>}
      </View>
      <Text accessibilityRole="header" style={s.title}>{species === 'oak' ? `${botanicalStage(shownCount ?? 0).label}. À ton rythme.` : gardenTitle(shownCount ?? 0)}</Text>
      <Text style={s.body}>{previewCount !== null ? `Aperçu à ${previewCount} journée${previewCount > 1 ? 's' : ''}. Ta progression réelle reste inchangée.` : error ? 'Ton arbre n’a pas pu être chargé. Réouvre ton profil pour réessayer.' : count === null ? 'Ton jardin arrive…' : `${count} météo${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}. Chaque météo compte, de l’orage au soleil.`}</Text>
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
const s = StyleSheet.create({ speciesButton: { minHeight: 48, paddingHorizontal: 22, borderRadius: 24, justifyContent: 'center', backgroundColor: c.surface }, error: { color: c.error, fontSize: 12, lineHeight: 18 }, testPanel: { gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 12 }, testToggle: { minHeight: 44, justifyContent: 'center' }, testSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, testLabel: { color: c.muted, fontSize: 10, lineHeight: 16 }, testSelected: { borderColor: c.muted, backgroundColor: c.surface }, testStep: { minHeight: 44, paddingHorizontal: 10, borderRadius: 10, justifyContent: 'center', borderWidth: 1, borderColor: c.line }, linkText: { color: c.link, fontSize: 12 }, garden: { borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, padding: 22, gap: 12 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, kicker: { fontFamily: mono, fontSize: 9, letterSpacing: 1.2, color: c.muted }, pill: { fontSize: 9, color: c.muted, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 7 }, title: { color: c.text, fontSize: 24, lineHeight: 29, letterSpacing: -0.6 }, subtitle: { fontSize: 14, color: c.text }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 11, lineHeight: 17 }, report: { gap: 16, padding: 22, borderRadius: 26, borderWidth: 1, borderColor: c.line }, tabs: { flexDirection: 'row', gap: 8 }, tab: { minHeight: 44, paddingHorizontal: 20, borderRadius: 22, justifyContent: 'center', backgroundColor: c.surface }, active: { backgroundColor: c.sage }, tabText: { fontSize: 12, color: c.text }, average: { fontSize: 40, color: c.text, letterSpacing: -1 }, tagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: c.line, paddingTop: 10 } });
