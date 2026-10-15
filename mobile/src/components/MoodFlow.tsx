import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as NativeAnimated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, CheckIcon, CheckCircleIcon, PlusCircleIcon, ShieldCheckIcon, XIcon, ChatsCircleIcon } from '../icons';
import { moodTags, weathers } from '../weather';
import Animated, { cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { HeaderActions } from './HeaderActions';
import { BrandMark } from './BrandMark';
import { mono } from '../theme';
import { MoodDial, moodAccents, moodBackgrounds, useReducedMotion, WeatherMorph } from './MoodDial';

type Props = {
  score: number | null; onScore: (score: number) => void; tags: string[]; onTags: (tags: string[]) => void;
  submitted: boolean; sentNow: boolean; busy: boolean; error: string;
  supportPrompt: boolean; onDismissSupport: () => void;
  onSubmit: () => void; onProfile: () => void;
};
const INPUT = [1, 2, 3, 4, 5];
export function MoodFlow(props: Props) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom;
  const compact = availableHeight < 720;
  const tiny = availableHeight < 620;
  const [step, setStep] = useState<'mood' | 'reasons'>('mood');
  const [reasonModal, setReasonModal] = useState(false);
  const [reasonDraft, setReasonDraft] = useState('');
  const [privateReason, setPrivateReason] = useState('');
  const [manualSupport, setManualSupport] = useState(false);
  const [prepareMessage, setPrepareMessage] = useState(false);
  const reduced = useReducedMotion();
  const motion = useSharedValue(props.score ?? 3);
  const entrance = useRef(new NativeAnimated.Value(1)).current;
  const backgroundStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(motion.value, INPUT, moodBackgrounds) }));
  const accentStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(motion.value, INPUT, moodAccents) }));
  const done = props.submitted;
  const supportVisible = props.supportPrompt || manualSupport;
  useEffect(() => {
    if (!done) return;
    setPrivateReason(''); setReasonDraft('');
  }, [done]);
  useEffect(() => { setPrepareMessage(false); }, [supportVisible]);
  function go(next: 'mood' | 'reasons') {
    if (next === 'reasons') {
      const chosen = Math.round(motion.value);
      cancelAnimation(motion);
      motion.value = withTiming(chosen, { duration: reduced ? 0 : 160 });
      props.onScore(chosen);
    }
    setStep(next);
    entrance.setValue(reduced ? 1 : 0);
    NativeAnimated.timing(entrance, { toValue: 1, duration: reduced ? 0 : 280, useNativeDriver: true }).start();
  }
  function dismissSupport() { props.onDismissSupport(); setManualSupport(false); setPrepareMessage(false); }
  return <Animated.View style={[styles.background, backgroundStyle]}>
    <StatusBar style="light" /><SafeAreaView style={styles.safe}>
      <View style={[styles.header, compact && { height: 54 }]}>
        <BrandMark />
        <HeaderActions disabled={props.busy} onProfile={props.onProfile} />
      </View>
      <NativeAnimated.View style={[styles.body, { maxWidth: width >= 660 ? 520 : 430, opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        {done ? <View style={styles.done}>
          <Animated.View style={[styles.doneOrb, accentStyle]}><CheckCircleIcon color="#26372a" size={66} weight="duotone" /></Animated.View>
          <Text style={styles.eyebrow}>{props.sentNow ? 'C’EST PARTAGÉ' : 'DÉJÀ PARTAGÉE AUJOURD’HUI'}</Text><Text accessibilityRole="header" style={styles.doneTitle}>Ta météo compte.</Text><Text style={styles.doneBody}>Merci pour ton retour. Il contribue à la météo collective.{'\n'}On se retrouve demain.</Text>
          <Pressable accessibilityRole="button" style={styles.supportLink} onPress={() => setManualSupport(true)}><ChatsCircleIcon size={19} color="#e9e6d9" /><Text style={styles.supportLinkText}>Besoin d’en parler ?</Text></Pressable>
        </View> : step === 'mood' ? <>
          <View style={[styles.intro, compact && { paddingTop: 5, gap: 8 }]}><Text style={styles.eyebrow}>01 / TA MÉTÉO</Text><Text accessibilityRole="header" style={[styles.title, compact && { fontSize: tiny ? 26 : 29, lineHeight: tiny ? 31 : 34 }]}>À l’intérieur,{ '\n' }quel temps fait-il ?</Text></View>
          <View style={[styles.dialSpace, tiny && { minHeight: 230 }]}><Text style={styles.gestureHint}>{weathers[(props.score ?? 3) - 1].message}</Text><View style={{ width: '100%', maxWidth: tiny ? 230 : compact ? 280 : 350 }}><MoodDial compact={compact} score={props.score ?? 3} onChange={props.onScore} motion={motion} /></View></View>
          <View style={styles.bottom}><Pressable accessibilityRole="button" accessibilityLabel="Continuer vers les raisons" onPress={() => go('reasons')} style={styles.primary}><Text style={styles.primaryText}>Continuer</Text><ArrowRightIcon size={21} color="#27352c" /></Pressable><Text style={styles.footnote}>Volontaire · Sans nom sur ta réponse</Text></View>
        </> : <>
          <View style={[styles.intro, compact && { paddingTop: 5, gap: 8 }]}><View style={styles.stepHeader}><Pressable accessibilityRole="button" accessibilityLabel="Retour à ma météo" onPress={() => go('mood')} style={styles.back}><ArrowLeftIcon size={18} color="#ede9de" /></Pressable><Text style={styles.eyebrow}>02 / CE QUI JOUE</Text><Animated.View style={[styles.smallOrb, accentStyle]}><WeatherMorph value={motion} size={23} /></Animated.View></View><Text accessibilityRole="header" style={[styles.title, compact && { fontSize: tiny ? 26 : 29, lineHeight: tiny ? 31 : 34 }]}>{tiny ? 'Ce qui joue aujourd’hui' : <>Qu’est-ce qui{ '\n' }fait la différence ?</>}</Text><Text style={styles.optional}>Tu peux aussi passer cette étape.</Text></View>
          <View style={[styles.reasonSpace, compact && { gap: 8, paddingVertical: tiny ? 8 : 14 }]}><View style={styles.reasonGrid}>{moodTags.map(tag => { const active = props.tags.includes(tag.label); return <Pressable key={tag.label} accessibilityRole="checkbox" accessibilityLabel={tag.label} accessibilityState={{ checked: active }} aria-checked={active} onPress={() => props.onTags(active ? props.tags.filter(t => t !== tag.label) : [...props.tags, tag.label])} style={[styles.reason, active && styles.reasonSelected, compact && { minHeight: tiny ? 48 : 58, padding: tiny ? 12 : 14, gap: tiny ? 8 : 10 }]}><tag.icon style={{ flexShrink: 0 }} size={tiny ? 20 : 24} color={active ? '#eff4dd' : '#d5d9cc'} weight={active ? 'fill' : 'regular'} /><Text numberOfLines={2} style={[styles.reasonText, tiny && { fontSize: 10 }]}>{tag.label}</Text>{active && <CheckIcon style={{ position: 'absolute', right: 7, top: 6 }} size={11} color="#eff4dd" />}</Pressable>; })}</View>
            <Pressable accessibilityRole="button" accessibilityLabel={privateReason ? 'Modifier ma raison personnelle' : 'Ajouter ma propre raison'} onPress={() => { setReasonDraft(privateReason); setReasonModal(true); }} style={[styles.addReason, compact && { minHeight: tiny ? 56 : 60 }]}><PlusCircleIcon size={25} color="#eeeadd" /><View style={{ flex: 1, gap: 4 }}><Text style={styles.reasonText}>{privateReason || 'Ma propre raison'}</Text><Text style={styles.privateLabel}>Note personnelle · non partagée</Text></View>{privateReason ? <CheckIcon size={16} color="#e8edd7" /> : null}</Pressable>
          </View>
          <View style={styles.bottom}>{props.error ? <Text accessibilityRole="alert" style={styles.error}>{props.error}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel="Partager ma météo" disabled={props.busy} onPress={props.onSubmit} style={[styles.primary, props.busy && { opacity: 0.65 }]}><Text style={styles.primaryText}>{props.tags.length ? 'Partager ma météo' : 'Partager sans raison collective'}</Text>{props.busy ? <ActivityIndicator size="small" color="#27352c" /> : <ArrowRightIcon size={21} color="#27352c" />}</Pressable><Text style={styles.footnote}>Seuls les tags prédéfinis sont transmis.</Text></View>
        </>}
      </NativeAnimated.View>
    </SafeAreaView>
    <Modal visible={reasonModal} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => setReasonModal(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.overlay, { padding: 0 }]}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}><View style={styles.sheet} accessibilityViewIsModal role="dialog" aria-modal={true}><View style={styles.sheetHeader}><Text style={styles.sheetKicker}>JUSTE POUR TOI</Text><Pressable accessibilityRole="button" accessibilityLabel="Fermer la raison personnelle" onPress={() => setReasonModal(false)} style={styles.iconButton}><XIcon size={21} color="#eae7dd" /></Pressable></View><Text accessibilityRole="header" style={styles.sheetTitle}>Ta propre raison.</Text><Text style={styles.sheetBody}>Ce brouillon reste sur cet écran. Il n’est envoyé ni au serveur ni à ton manager, puis il est effacé après l’envoi.</Text><TextInput accessibilityLabel="Ma raison personnelle" placeholder="Ce qui joue pour moi…" placeholderTextColor="#949f95" value={reasonDraft} onChangeText={setReasonDraft} maxLength={80} multiline style={styles.noteInput} /><Text style={styles.counter}>{reasonDraft.length}/80</Text><Pressable accessibilityRole="button" style={styles.primary} onPress={() => { setPrivateReason(reasonDraft.trim()); setReasonModal(false); }}><Text style={styles.primaryText}>{reasonDraft.trim() ? 'Ajouter à mon écran' : 'Retirer ma note'}</Text><CheckIcon size={19} color="#27352c" /></Pressable></View></ScrollView></KeyboardAvoidingView>
    </Modal>
    <Modal visible={supportVisible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={dismissSupport}>
      <View style={[styles.overlay, { padding: 0 }]}><ScrollView contentContainerStyle={styles.modalScroll}><View style={styles.sheet} accessibilityViewIsModal role="dialog" aria-modal={true}><View style={styles.sheetHeader}><ChatsCircleIcon size={30} color="#d8eda0" weight="duotone" /><Pressable accessibilityRole="button" accessibilityLabel="Fermer l’invitation à échanger" onPress={dismissSupport} style={styles.iconButton}><XIcon color="#eae7dd" size={21} /></Pressable></View><Text accessibilityRole="header" style={styles.sheetTitle}>{prepareMessage ? 'Un premier pas.' : 'Tu peux en parler.'}</Text>
        <Text style={styles.sheetBody}>{prepareMessage ? 'Voici un message que tu peux copier et adapter. Tu choisis à qui le transmettre.' : props.supportPrompt ? 'Tu as partagé trois météos « Très mal » sur des jours distincts au cours des 30 derniers jours. Si tu le souhaites, tu peux demander un temps d’échange avec ton manager ou une personne de confiance.' : 'Si tu en ressens le besoin, tu peux demander un temps d’échange avec ton manager ou une personne de confiance.'}</Text>
        {prepareMessage ? <Text selectable style={styles.message}>Bonjour, j’aimerais prendre un moment pour échanger sur mon ressenti au travail et sur ce qui pourrait m’aider. Serais-tu disponible pour en parler ?</Text> : <View style={styles.privacyNote}><ShieldCheckIcon size={18} color="#cedebd" /><Text style={styles.privacyNoteText}>Invitation privée. Aucune alerte ni réponse individuelle n’est envoyée à ton manager.</Text></View>}
        <Pressable accessibilityRole="button" style={styles.primary} onPress={() => prepareMessage ? dismissSupport() : setPrepareMessage(true)}><Text style={styles.primaryText}>{prepareMessage ? 'Fermer' : 'Préparer un échange'}</Text><ArrowUpRightIcon color="#27352c" size={19} /></Pressable>{!prepareMessage && <Pressable accessibilityRole="button" onPress={dismissSupport} style={styles.replay}><Text style={styles.secondaryText}>Pas maintenant</Text></Pressable>}
      </View></ScrollView></View>
    </Modal>
  </Animated.View>;
}
const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  header: { height: 68, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  intro: { paddingTop: 22, gap: 16 },
  eyebrow: { fontFamily: mono, fontSize: 10, letterSpacing: 1.7, color: '#c5cec1', textAlign: 'center' },
  title: { color: '#f8f5e9', fontSize: 35, lineHeight: 41, fontWeight: '500', letterSpacing: -1.1, textAlign: 'center' },
  dialSpace: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 280, gap: 6 },
  gestureHint: { minHeight: 44, maxWidth: 340, lineHeight: 21.25, paddingHorizontal: 8, fontSize: 15, color: '#c5cec1', textAlign: 'center' },
  bottom: { paddingBottom: 18, gap: 12, paddingTop: 12 },
  primary: { backgroundColor: '#f0f0dd', minHeight: 54, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  primaryText: { color: '#27352c', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  footnote: { fontSize: 10, lineHeight: 15, color: '#c5cec1', textAlign: 'center' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, justifyContent: 'center' },
  smallOrb: { width: 36, height: 36, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optional: { fontSize: 12, color: '#c5cec1', textAlign: 'center' },
  reasonSpace: { flex: 1, justifyContent: 'center', gap: 14, paddingVertical: 14 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reason: { width: '48%', flexGrow: 1, minHeight: 76, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffffff29', backgroundColor: '#ffffff05' },
  reasonSelected: { backgroundColor: '#ffffff15', borderColor: '#e4e9d3' },
  reasonText: { fontSize: 12, color: '#eeeadd', flexShrink: 1 },
  addReason: { minHeight: 78, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ffffff50', borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15 },
  privateLabel: { color: '#c5cec1', fontSize: 10, lineHeight: 16 },
  done: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 23, paddingBottom: 40 },
  doneOrb: { width: 132, height: 132, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 34, letterSpacing: -1.2, color: '#f8f5e9', textAlign: 'center' },
  doneBody: { fontSize: 14, lineHeight: 24, textAlign: 'center', color: '#d1d8ca' },
  supportLink: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, borderWidth: 1, borderColor: '#ffffff35', borderRadius: 25 },
  supportLinkText: { color: '#e9e6d9', fontSize: 13 },
  replay: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 12, color: '#c5cec1', textDecorationLine: 'underline' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  overlay: { flex: 1, backgroundColor: '#07110be0', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: '#202923', borderRadius: 24, padding: 24, gap: 20, width: '100%', maxWidth: 440, alignSelf: 'center', borderWidth: 1, borderColor: '#3b473d' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetKicker: { fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: '#c5cec1' },
  sheetTitle: { fontSize: 28, lineHeight: 34, color: '#f8f5e9', letterSpacing: -0.7 },
  sheetBody: { fontSize: 13, lineHeight: 21, color: '#ccd4c6' },
  noteInput: { borderWidth: 1, borderColor: '#53614f', borderRadius: 13, minHeight: 96, textAlignVertical: 'top', color: '#f3f0e3', fontSize: 16, lineHeight: 23, padding: 14, backgroundColor: '#18201a' },
  counter: { fontFamily: mono, fontSize: 10, color: '#b3c0ac', textAlign: 'right', marginTop: -10 },
  privacyNote: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  privacyNoteText: { flex: 1, fontSize: 11, lineHeight: 18, color: '#c5cec1' },
  message: { color: '#f1efdf', fontSize: 14, lineHeight: 23, backgroundColor: '#18201a', padding: 16, borderRadius: 13 },
  error: { fontSize: 12, lineHeight: 18, color: '#ffc1b6' }
});
