import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, strapiApi, type TeamAction } from '../strapi';
import { colors as c, mono } from '../theme';
import { localDay } from '../date';
import { CaretRightIcon, CheckCircleIcon, ShieldCheckIcon } from '../icons';
const names = { planned: 'Décidée', active: 'En cours', completed: 'Réalisée' };
const ideas = ['Clarifier les trois priorités', 'Alléger une réunion récurrente', 'Préserver une plage sans interruption', 'Revoir la répartition de la charge'];
export function TeamActions({ jwt, manager = false }: { jwt: string; manager?: boolean }) {
  const [actions, setActions] = useState<TeamAction[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [form, setForm] = useState(false), [title, setTitle] = useState(''), [description, setDescription] = useState('');
  const defaultDue = new Date(localDay() + 'T12:00:00Z'); defaultDue.setUTCDate(defaultDue.getUTCDate() + 14);
  const [dueDay, setDueDay] = useState(defaultDue.toISOString().slice(0, 10));
  const refresh = useCallback(async () => { setLoading(true); setError(''); try { setActions(await strapiApi.actions(jwt)); } catch (err) { setError(err instanceof Error ? err.message : 'Chargement impossible.'); } finally { setLoading(false); } }, [jwt]);
  useEffect(() => { void refresh(); }, [refresh]);
  async function run(action: () => Promise<unknown>, created = false) {
    if (busy) return; setBusy(true); setError('');
    try { await action(); if (created) { setForm(false); setTitle(''); setDescription(''); } await refresh(); }
    catch (err) { setError(err instanceof ApiError && err.status === 409 ? 'Ton retour est déjà enregistré. Actualise la liste.' : err instanceof Error ? err.message : 'Enregistrement impossible.'); }
    finally { setBusy(false); }
  }
  return <View style={s.section}>
    <Text style={s.kicker}>DE L’ÉCOUTE AUX ACTES</Text><Text accessibilityRole="header" style={s.heading}>Nos actions collectives.</Text>
    <Text style={s.body}>{manager ? 'Choisissez une petite action avec l’équipe, puis partage son avancement. Le bilan s’ouvre après sa réalisation.' : 'Retrouve les engagements de ton équipe et donne ton avis après leur réalisation.'}</Text>
    <View style={s.row}><Pressable accessibilityRole="button" disabled={loading || busy} onPress={() => void refresh()} style={s.small}><Text style={s.link}>Actualiser les actions</Text></Pressable>{manager && <Pressable accessibilityRole="button" disabled={busy} onPress={() => setForm(value => !value)} style={s.small}><Text style={s.link}>{form ? 'Fermer le formulaire' : '+ Nouvelle action'}</Text></Pressable>}</View>
    {form && manager && <View style={s.card}>
      <Text style={s.label}>Une idée à adapter ensemble</Text><View style={s.choices}>{ideas.map(idea => <Pressable key={idea} accessibilityRole="button" onPress={() => setTitle(idea)} style={s.choice}><Text style={s.caption}>{idea}</Text></Pressable>)}</View>
      <Text style={s.label}>L’action décidée</Text><TextInput accessibilityLabel="Titre de l’action collective" value={title} onChangeText={setTitle} maxLength={100} style={s.input} placeholder="Une action concrète" placeholderTextColor={c.dim} />
      <Text style={s.label}>Ce qui va changer</Text><TextInput accessibilityLabel="Description de l’action collective" value={description} onChangeText={setDescription} maxLength={500} multiline style={[s.input, { minHeight: 88 }]} placeholder="Sans noms ni situations individuelles" placeholderTextColor={c.dim} />
      <Text style={s.label}>Échéance · AAAA-MM-JJ</Text><TextInput accessibilityLabel="Échéance de l’action collective" value={dueDay} onChangeText={setDueDay} maxLength={10} style={s.input} />
      <Text style={s.caption}>Le titre, la description et l’échéance seront visibles par ton équipe. N’ajoute aucune information personnelle.</Text>
      <Pressable accessibilityRole="button" disabled={busy || title.trim().length < 3} onPress={() => void run(() => strapiApi.createAction(jwt, { title, description, dueDay }), true)} style={[s.primary, (busy || title.trim().length < 3) && { opacity: .5 }]}><Text style={s.primaryText}>Publier l’action pour l’équipe</Text>{busy ? <ActivityIndicator color={c.ink} /> : <CaretRightIcon size={18} color={c.ink} />}</Pressable>
    </View>}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    {loading ? <ActivityIndicator color={c.link} /> : actions.length === 0 ? <View style={s.card}><Text style={s.label}>La prochaine éclaircie se construit ensemble.</Text><Text style={s.body}>Aucune action publiée pour le moment.</Text></View> : actions.map(action => <View key={action.id} style={s.card}>
      <View style={s.row}><Text style={s.status}>{names[action.status]}</Text><Text style={s.caption}>{new Date(action.dueDay + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text></View>
      <Text accessibilityRole="header" style={s.actionTitle}>{action.title}</Text>{action.description ? <Text style={s.body}>{action.description}</Text> : null}
      <View style={s.progress}>{(['planned', 'active', 'completed'] as const).map((status, i) => <View key={status} style={[s.progressStep, i <= ['planned', 'active', 'completed'].indexOf(action.status) && { backgroundColor: c.link }]} />)}</View>
      {manager && action.status !== 'completed' && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(() => strapiApi.updateAction(jwt, action.id, action.status === 'planned' ? 'active' : 'completed'))} style={s.primary}><Text style={s.primaryText}>{action.status === 'planned' ? 'Démarrer cette action' : 'Marquer comme réalisée'}</Text><CheckCircleIcon size={20} color={c.ink} /></Pressable>}
      {action.status === 'completed' && <>
        <Text style={s.caption}>{action.reviewClosed ? 'La période de retour est terminée.' : `Bilan anonyme ouvert jusqu’au ${new Date(action.reviewUntil! + 'T12:00:00Z').toLocaleDateString('fr-FR')}.`}</Text>
        {!manager && !action.reviewClosed && !action.hasResponded && <><Text style={s.label}>Cette action t’a-t-elle aidé ?</Text><View style={s.choices}>{[{ score: 1, label: 'Pas encore' }, { score: 2, label: 'Un peu' }, { score: 3, label: 'Oui' }].map(choice => <Pressable key={choice.score} accessibilityRole="button" disabled={busy} onPress={() => void run(() => strapiApi.actionFeedback(jwt, action.id, choice.score))} style={s.choice}><Text style={s.link}>{choice.label}</Text></Pressable>)}</View></>}
        {action.hasResponded && <Text style={s.link}>Merci, ton retour est enregistré.</Text>}
        {action.feedback ? <Text style={s.body}>Utilité moyenne : {action.feedback.average.toFixed(1).replace('.', ',')} / 3 · {action.feedback.count} retours.</Text> : <View style={s.row}><ShieldCheckIcon size={16} color={c.muted} /><Text style={[s.caption, { flex: 1 }]}>{action.reviewClosed ? `Résultat masqué : moins de ${action.threshold} retours.` : `Le résultat sera disponible après la clôture, à partir de ${action.threshold} retours. Aucun résultat en direct.`}</Text></View>}
      </>}
    </View>)}
  </View>;
}
const s = StyleSheet.create({ section: { gap: 16 }, kicker: { fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: 1.2 }, heading: { fontSize: 28, lineHeight: 33, color: c.text, letterSpacing: -.8 }, body: { fontSize: 13, lineHeight: 21, color: c.muted }, caption: { fontSize: 10, lineHeight: 16, color: c.dim }, label: { fontSize: 13, fontWeight: '500', lineHeight: 20, color: c.text }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, small: { minHeight: 44, justifyContent: 'center', flexShrink: 1 }, link: { fontSize: 11, lineHeight: 18, color: c.link }, card: { borderWidth: 1, borderColor: c.line, borderRadius: 24, padding: 20, gap: 14, backgroundColor: c.surface }, input: { borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 14, color: c.text, fontSize: 14, minHeight: 48, backgroundColor: c.panel }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: c.line }, primary: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: c.accent, padding: 16, borderRadius: 16 }, primaryText: { color: c.ink, fontSize: 12, fontWeight: '600', flexShrink: 1 }, status: { color: c.link, fontSize: 10, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: c.selected, borderRadius: 12 }, actionTitle: { fontSize: 20, color: c.text, lineHeight: 25, letterSpacing: -.4 }, progress: { flexDirection: 'row', gap: 5 }, progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.line }, error: { color: c.error, fontSize: 12, lineHeight: 19 } });
