import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { demoStats, tags, type Role } from './src/demo';

const labels = ['Très mal', 'Mal', 'Moyen', 'Bien', 'Très bien'];
function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, disabled && { opacity: 0.45 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
function Moodly() {
  const [role, setRole] = useState<Role | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittedDay, setSubmittedDay] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const today = new Date().toLocaleDateString('fr-CA');
  const stats = demoStats();
  const visible = stats.filter(d => d.average !== null);
  const average = (visible.reduce((sum, d) => sum + d.average!, 0) / visible.length).toFixed(1).replace('.', ',');
  return <SafeAreaView style={s.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={s.container}>
    <Text style={s.brand}>moodly.</Text><Text style={s.body}>Une petite pause pour prendre le pouls.</Text>
    <View style={s.notice}><Text>MODE DÉMO · Données fictives · Aucun compte réel</Text></View>
    {privacy ? <View style={s.card}><Text style={s.title}>Tes données</Text>
      <Text style={s.body}>Cette démo garde ton choix en mémoire pendant la session. Rien n’est envoyé au serveur. Fermer l’app réinitialise la démo.</Text>
      <Text style={s.body}>Objectif du MVP : participation volontaire, réponses sans auteur et moyennes par équipe. La protection réelle reste à implémenter côté serveur.</Text>
      <Button title="Revenir" onPress={() => setPrivacy(false)} />
    </View> : !role ? <View style={s.card}><Text style={s.title}>Bienvenue 👋</Text><Text style={s.body}>Choisis un parcours pour explorer la base.</Text>
      <Button title="Démo collaborateur" onPress={() => setRole('collaborateur')} /><Button title="Démo manager" onPress={() => setRole('manager')} />
    </View> : role === 'collaborateur' ? <View style={s.card}>
      <Text style={s.title}>{submittedDay === today ? 'Merci pour ton retour !' : 'Comment te sens-tu aujourd’hui ?'}</Text>
      {submittedDay === today ? <Text accessibilityLiveRegion="polite" style={s.body}>Réponse simulée. Tu pourras répondre demain dans cette session.</Text> : <>
        <View style={s.row}>{labels.map((label, i) => <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: score === i + 1 }} accessibilityLabel={`${i + 1} sur 5, ${label}`} onPress={() => setScore(i + 1)} style={[s.mood, score === i + 1 && s.selected]}><Text style={s.score}>{i + 1}</Text><Text>{label}</Text></Pressable>)}</View>
        <Text style={s.body}>Ce qui joue (facultatif)</Text><View style={s.row}>{tags.map(tag => <Pressable key={tag} accessibilityRole="checkbox" accessibilityState={{ checked: selectedTags.includes(tag) }} onPress={() => setSelectedTags(current => current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag])} style={[s.tag, selectedTags.includes(tag) && s.selected]}><Text>{tag}</Text></Pressable>)}</View>
        <Button title="Envoyer mon moral · démo" disabled={score === null} onPress={() => setSubmittedDay(today)} />
      </>}<Text style={s.caption}>Participation volontaire · 1 réponse par jour prévue</Text>
    </View> : <View style={s.card}><Text style={s.caption}>ÉQUIPE PRODUIT · DONNÉES FICTIVES</Text><Text style={s.title}>Le moral sur 30 jours</Text><Text style={s.brand}>{average} / 5</Text>
      <View accessible accessibilityLabel={`Graphique fictif sur 30 jours. Moyenne ${average} sur 5. ${stats.length - visible.length} jours masqués sous 5 réponses.`}>
        <Svg width="100%" height={180} viewBox="0 0 320 180">
          {[1, 2, 3, 4, 5].map(n => <Line key={n} x1={10} x2={310} y1={160 - (n - 1) * 35} y2={160 - (n - 1) * 35} stroke="#dce6e0" />)}
          {stats.map((d, i) => {
            if (d.average === null) return null;
            const x = 10 + i * 300 / 29, y = 160 - (d.average - 1) * 35, previous = stats[i - 1]?.average;
            return <G key={d.day}>{previous != null && <Line x1={x - 300 / 29} y1={160 - (previous - 1) * 35} x2={x} y2={y} stroke="#25634d" strokeWidth={3} />}<Circle cx={x} cy={y} r={3} fill="#25634d" /></G>;
          })}
        </Svg>
      </View><View style={[s.row, { justifyContent: 'space-between' }]}><Text>{stats[0].day}</Text><Text>{stats[29].day}</Text></View>
      <Text style={s.body}>Moral moyen fictif : {average}/5 sur les jours visibles.</Text><Text style={s.caption}>{stats.length - visible.length} jours masqués : moins de 5 réponses. Les trous ne sont pas reliés.</Text>
    </View>}
    {!privacy && <Button title="Comment sont utilisées mes données ?" onPress={() => setPrivacy(true)} />}
    {role && !privacy && <Button title="Changer de parcours" onPress={() => { setRole(null); setScore(null); setSelectedTags([]); }} />}
  </ScrollView></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Moodly /></SafeAreaProvider>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f7f2' }, container: { padding: 20, gap: 18, width: '100%', maxWidth: 540, alignSelf: 'center' },
  brand: { fontSize: 40, fontWeight: '800', color: '#174735' }, body: { fontSize: 16, lineHeight: 24, color: '#354a3e' },
  caption: { fontSize: 13, lineHeight: 20, color: '#46594f' }, notice: { padding: 12, backgroundColor: '#fff0cd', borderRadius: 12 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 24, gap: 20 }, title: { fontSize: 26, fontWeight: '700', color: '#183e30' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, mood: { minWidth: 70, minHeight: 70, padding: 10, borderWidth: 1, borderColor: '#c9d8cf', borderRadius: 12, alignItems: 'center', gap: 4 },
  score: { fontSize: 22, fontWeight: '700', color: '#183e30' }, selected: { backgroundColor: '#d2ebdc', borderColor: '#25634d', borderWidth: 2 },
  tag: { minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#c9d8cf', justifyContent: 'center' },
  button: { minHeight: 48, backgroundColor: '#25634d', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
