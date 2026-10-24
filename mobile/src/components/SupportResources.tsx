import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SupportContact } from '../strapi';
import { colors as c, mono } from '../theme';
import { ChatsCircleIcon, ArrowUpRightIcon, CaretRightIcon, XIcon } from '../icons';
const kindLabels = { psychologue: 'Psychologue du travail', prevention: 'Prévention & santé au travail', manager: 'Interlocuteur de l’entreprise', autre: 'Accompagnement' };
export function SupportResources({ contacts = [] }: { contacts?: SupportContact[] }) {
  const [error, setError] = useState('');
  const [prepare, setPrepare] = useState(false);
  async function open(url: string) {
    setError('');
    try { await Linking.openURL(url); } catch { setError('Ce lien n’a pas pu être ouvert. Utilise les coordonnées affichées pour contacter le service.'); }
  }
  return <View style={s.card}>
    <ChatsCircleIcon size={32} color={c.link} weight="duotone" />
    <Text accessibilityRole="header" style={s.title}>Trouver du soutien.</Text>
    <Text style={s.body}>Tu peux demander un échange à tout moment. Tu choisis ton interlocuteur et ce que tu souhaites lui raconter.</Text>
    {contacts.length === 0 ? <View style={s.contact}><Text style={s.name}>Les contacts ne sont pas encore renseignés.</Text><Text style={s.body}>Demande à ton service RH les coordonnées du psychologue du travail ou du dispositif d’accompagnement proposé par ton entreprise.</Text></View> : contacts.map((contact, index) => <View key={index} style={s.contact}>
      <Text style={s.kicker}>{kindLabels[contact.kind] ?? 'Accompagnement'}</Text><Text style={s.name}>{contact.name}</Text>
      {contact.qualification ? <Text style={s.body}>{contact.qualification}</Text> : null}
      {contact.details ? <Text style={s.body}>{contact.details}</Text> : null}
      {contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? <Pressable accessibilityRole="link" onPress={() => void open(`mailto:${contact.email}`)} style={s.link}><Text selectable style={s.linkText}>{contact.email}</Text><ArrowUpRightIcon size={18} color={c.link} /></Pressable> : null}
      {contact.phone && /^[+\d\s().-]{3,30}$/.test(contact.phone) ? <Pressable accessibilityRole="link" onPress={() => void open(`tel:${contact.phone!.replace(/[^+\d]/g, '')}`)} style={s.link}><Text selectable style={s.linkText}>{contact.phone}</Text><ArrowUpRightIcon size={18} color={c.link} /></Pressable> : null}
      {contact.bookingUrl && /^https:\/\//i.test(contact.bookingUrl) ? <Pressable accessibilityRole="link" onPress={() => void open(contact.bookingUrl!)} style={s.link}><Text style={s.linkText}>Consulter les rendez-vous</Text><ArrowUpRightIcon size={18} color={c.link} /></Pressable> : null}
    </View>)}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Text style={s.caption}>Les modalités de confidentialité sont à vérifier avec ce service.</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: prepare }} onPress={() => setPrepare(value => !value)} style={({ pressed }) => [s.prepare, pressed && { opacity: .8 }]}><ChatsCircleIcon size={21} weight="duotone" color={c.ink} /><Text style={s.prepareText}>{prepare ? 'Fermer mon brouillon' : 'Préparer un premier échange'}</Text>{prepare ? <XIcon size={19} color={c.ink} /> : <CaretRightIcon size={19} weight="bold" color={c.ink} />}</Pressable>
    {prepare && <View style={s.contact}><Text style={s.caption}>MESSAGE À COPIER ET ADAPTER</Text><Text selectable style={s.body}>Bonjour, j’aimerais prendre un moment pour échanger sur mon ressenti au travail et sur ce qui pourrait m’aider. Pourriez-vous m’indiquer vos disponibilités et les modalités de cet accompagnement ?</Text><Text style={s.caption}>Tu décides si tu l’envoies. Rien ne part depuis cet écran.</Text></View>}
  </View>;
}
const s = StyleSheet.create({ card: { gap: 16, borderRadius: 26, borderWidth: 1, borderColor: c.line, padding: 22 }, kicker: { color: c.muted, fontFamily: mono, fontSize: 9, letterSpacing: 1.1 }, title: { color: c.text, fontSize: 28, lineHeight: 33, letterSpacing: -0.8 }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 11, lineHeight: 17 }, name: { color: c.text, fontSize: 16, lineHeight: 23 }, contact: { gap: 10, paddingTop: 16, borderTopWidth: 1, borderColor: c.line }, link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, linkText: { color: c.link, fontSize: 12, flexShrink: 1, lineHeight: 19 }, prepare: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', gap: 10 }, prepareText: { flex: 1, color: c.ink, fontSize: 13, fontWeight: '600', lineHeight: 19 }, error: { color: c.error, fontSize: 12, lineHeight: 19 } });
