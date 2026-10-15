import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SupportContact } from '../strapi';
import { colors as c, mono } from '../theme';
import { ChatsCircleIcon, ArrowUpRightIcon, LockSimpleIcon } from '../icons';
const kindLabels = { psychologue: 'Psychologue du travail', prevention: 'Prévention & santé au travail', manager: 'Interlocuteur de l’entreprise', autre: 'Accompagnement' };
export function SupportResources({ contacts = [] }: { contacts?: SupportContact[] }) {
  const [error, setError] = useState('');
  const [prepare, setPrepare] = useState(false);
  async function open(url: string) {
    setError('');
    try { await Linking.openURL(url); } catch { setError('Ce lien n’a pas pu être ouvert. Utilise les coordonnées affichées pour contacter le service.'); }
  }
  return <View style={s.card}>
    <ChatsCircleIcon size={32} color={c.sage} weight="duotone" />
    <Text style={s.kicker}>À TON ÉCOUTE</Text>
    <Text accessibilityRole="header" style={s.title}>Trouver du soutien.</Text>
    <Text style={s.body}>Tu peux demander un échange à tout moment. Tu choisis ton interlocuteur et ce que tu souhaites lui raconter.</Text>
    {contacts.length === 0 ? <View style={s.contact}><Text style={s.name}>Les contacts ne sont pas encore renseignés.</Text><Text style={s.body}>Demande à ton service RH les coordonnées du psychologue du travail ou du dispositif d’accompagnement proposé par ton entreprise.</Text></View> : contacts.map((contact, index) => <View key={index} style={s.contact}>
      <Text style={s.kicker}>{kindLabels[contact.kind] ?? 'Accompagnement'}</Text><Text style={s.name}>{contact.name}</Text>
      {contact.qualification ? <Text style={s.body}>{contact.qualification}</Text> : null}
      {contact.details ? <Text style={s.body}>{contact.details}</Text> : null}
      {contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? <Pressable accessibilityRole="link" onPress={() => void open(`mailto:${contact.email}`)} style={s.link}><Text selectable style={s.linkText}>{contact.email}</Text><ArrowUpRightIcon size={18} color={c.sage} /></Pressable> : null}
      {contact.phone && /^[+\d\s().-]{3,30}$/.test(contact.phone) ? <Pressable accessibilityRole="link" onPress={() => void open(`tel:${contact.phone!.replace(/[^+\d]/g, '')}`)} style={s.link}><Text selectable style={s.linkText}>{contact.phone}</Text><ArrowUpRightIcon size={18} color={c.sage} /></Pressable> : null}
      {contact.bookingUrl && /^https:\/\//i.test(contact.bookingUrl) ? <Pressable accessibilityRole="link" onPress={() => void open(contact.bookingUrl!)} style={s.link}><Text style={s.linkText}>Consulter les rendez-vous</Text><ArrowUpRightIcon size={18} color={c.sage} /></Pressable> : null}
    </View>)}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <View style={s.notice}><LockSimpleIcon size={16} color={c.muted} /><Text style={[s.caption, { flex: 1 }]}>Aucune météo ni aucun rapport transmis automatiquement. Les coordonnées ouvrent ton application de contact ou le site du prestataire. Les modalités de confidentialité sont à vérifier avec ce service.</Text></View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: prepare }} onPress={() => setPrepare(value => !value)} style={s.prepare}><Text style={s.linkText}>{prepare ? 'Fermer mon brouillon' : 'Préparer un premier échange'}</Text></Pressable>
    {prepare && <View style={s.contact}><Text style={s.caption}>MESSAGE À COPIER ET ADAPTER</Text><Text selectable style={s.body}>Bonjour, j’aimerais prendre un moment pour échanger sur mon ressenti au travail et sur ce qui pourrait m’aider. Pourriez-vous m’indiquer vos disponibilités et les modalités de cet accompagnement ?</Text><Text style={s.caption}>Tu décides si tu l’envoies. Rien ne part depuis cet écran.</Text></View>}
  </View>;
}
const s = StyleSheet.create({ card: { gap: 16, borderRadius: 26, borderWidth: 1, borderColor: c.line, padding: 22 }, kicker: { color: c.muted, fontFamily: mono, fontSize: 9, letterSpacing: 1.1 }, title: { color: c.text, fontSize: 28, lineHeight: 33, letterSpacing: -0.8 }, body: { color: c.muted, fontSize: 13, lineHeight: 21 }, caption: { color: c.dim, fontSize: 11, lineHeight: 17 }, name: { color: c.text, fontSize: 16, lineHeight: 23 }, contact: { gap: 10, paddingTop: 16, borderTopWidth: 1, borderColor: c.line }, link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, linkText: { color: c.sage, fontSize: 12, flexShrink: 1, lineHeight: 19 }, notice: { flexDirection: 'row', gap: 8 }, prepare: { minHeight: 48, justifyContent: 'center' }, error: { color: '#ffc1b6', fontSize: 12, lineHeight: 19 } });
