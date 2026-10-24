import { TourTarget } from './tour/OnboardingTour';
import { haptics } from '../haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as NativeAnimated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, ArrowRightIcon, CaretRightIcon, ArrowUpRightIcon, CheckIcon, CheckCircleIcon, PlusCircleIcon, ShieldCheckIcon, XIcon, ChatsCircleIcon } from '../icons';
import { weathers } from '../weather';
import { strapiApi, type MoodTag } from '../strapi';
import { tagIcon } from '../tagIcons';
import Animated, { cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { HeaderActions } from './HeaderActions';
import { BrandMark } from './BrandMark';
import { colors as c, mono } from '../theme';
import { MoodDial, moodAccents, moodBackgrounds, useReducedMotion, WeatherMorph } from './MoodDial';

type Props = {
  jwt: string;
  privateMood?: boolean; onBack?: () => void;
  score: number | null; onScore: (score: number) => void; tags: string[]; onTags: (tags: string[]) => void;
  submitted: boolean; sentNow: boolean; busy: boolean; error: string;
  supportPrompt: boolean; onDismissSupport: () => void;
  onSubmit: () => void; onProfile: () => void; onSupport: () => void;
};
const INPUT = [1, 2, 3, 4, 5];
export function MoodFlow(props: Props) {
  const personal = props.privateMood === true;
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
  const [tagOptions, setTagOptions] = useState<MoodTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState('');
  const [tagReload, setTagReload] = useState(0);
  const reduced = useReducedMotion();
  const motion = useSharedValue(props.score ?? 3);
  const entrance = useRef(new NativeAnimated.Value(1)).current;
  const backgroundStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(motion.value, INPUT, moodBackgrounds) }));
  const accentStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(motion.value, INPUT, moodAccents) }));
  const done = props.submitted;
  useEffect(() => {
    if (step !== 'reasons' || done) return;
    let active = true;
    setTagsLoading(true); setTagsError(''); setTagOptions([]);
    void strapiApi.tags(props.jwt).then(options => {
      if (!active) return;
      setTagOptions(options);
      props.onTags(props.tags.filter(label => options.some(tag => tag.label === label)));
    }).catch(() => {
      if (!active) return;
      props.onTags([]);
      setTagsError('Les raisons ne sont pas disponibles. Tu peux réessayer ou continuer sans raison.');
    }).finally(() => { if (active) setTagsLoading(false); });
    return () => { active = false; };
  }, [props.jwt, step, done, tagReload]);
  const supportVisible = props.supportPrompt || manualSupport;
  useEffect(() => {
    if (!done) return;
    setPrivateReason(''); setReasonDraft('');
  }, [done]);
  useEffect(() => { setPrepareMessage(false); }, [supportVisible]);
  function go(next: 'mood' | 'reasons') {
    if (next !== step) haptics.navigate();
    if (next === 'reasons') {
      const chosen = Math.round(motion.value);
      cancelAnimation(motion);
      motion.value = withTiming(chosen, { duration: reduced ? 0 : 160 });
      props.onScore(chosen);
    }
    setStep(next);
    entrance.setValue(reduced ? 1 : 0);
    NativeAnimated.timing(entrance, { toValue: 1, duration: reduced ? 0 : 280, useNativeDriver: Platform.OS !== 'web' }).start();
  }
  function dismissSupport() { props.onDismissSupport(); setManualSupport(false); setPrepareMessage(false); }
  return <Animated.View style={[styles.background, backgroundStyle]}>
    <StatusBar style="dark" /><SafeAreaView style={styles.safe}>
      <View style={[styles.header, compact && { height: 54 }]}>
        {props.onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Retour à mon espace manager" onPress={props.onBack} style={styles.iconButton}><ArrowLeftIcon color={c.text} size={22} /></Pressable> : <BrandMark />}
        <HeaderActions disabled={props.busy} onProfile={props.onProfile} />
      </View>
      <NativeAnimated.View style={[styles.body, { maxWidth: width >= 660 ? 520 : 430, opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        {done ? <TourTarget id="mood" style={[styles.done, compact && { gap: 14, paddingBottom: 16 }]}>
          <Animated.View style={[styles.doneOrb, accentStyle, compact && { width: 92, height: 92, marginBottom: 0 }]}><CheckCircleIcon color={c.ink} size={66} weight="duotone" /></Animated.View>
          <Text style={styles.eyebrow}>{personal ? 'TON MOMENT PERSONNEL' : props.sentNow ? 'C’EST PARTAGÉ' : 'DÉJÀ PARTAGÉE AUJOURD’HUI'}</Text><Text accessibilityRole="header" style={styles.doneTitle}>Ta météo compte.</Text><Text style={styles.doneBody}>{personal ? 'Ta météo est enregistrée dans ton espace personnel.' : 'Merci pour ton retour. Il contribue à la météo collective.'}{'\n'}On se retrouve demain.</Text>
          <Pressable accessibilityRole="button" style={styles.supportLink} onPress={() => setManualSupport(true)}><ChatsCircleIcon size={19} color={c.text} /><Text style={styles.supportLinkText}>Besoin d’en parler ?</Text></Pressable>
        </TourTarget> : step === 'mood' ? <>
          <View style={[styles.intro, compact && { paddingTop: 5, gap: 8 }]}><Text style={styles.eyebrow}>01 / TA MÉTÉO</Text><Text accessibilityRole="header" style={[styles.title, compact && { fontSize: tiny ? 26 : 29, lineHeight: tiny ? 31 : 34 }]}>À l’intérieur,{ '\n' }quel temps fait-il ?</Text></View>
          <TourTarget id="mood" style={[styles.dialSpace, tiny && { minHeight: 230 }]}><Text style={styles.gestureHint}>{weathers[(props.score ?? 3) - 1].message}</Text><View style={{ width: '100%', maxWidth: tiny ? 230 : compact ? 280 : 350 }}><MoodDial compact={compact} score={props.score ?? 3} onChange={props.onScore} motion={motion} /></View></TourTarget>
          <TourTarget id="continue" style={styles.bottom}><Pressable accessibilityRole="button" accessibilityLabel="Continuer vers les raisons" onPress={() => go('reasons')} style={[styles.primary, { paddingVertical: 10 }]}><Text style={styles.primaryText}>Continuer</Text><View accessible={false} pointerEvents="none" style={styles.continueIcon}><CaretRightIcon size={21} weight="bold" color={c.cream} /></View></Pressable><Text style={styles.footnote}>{personal ? 'Pour toi uniquement · aucun envoi à l’entreprise' : 'Volontaire · Sans nom sur ta réponse'}</Text></TourTarget>
        </> : <>
          <View style={[styles.intro, compact && { paddingTop: 5, gap: 8 }]}><View style={styles.stepHeader}><Pressable accessibilityRole="button" accessibilityLabel="Retour à ma météo" onPress={() => go('mood')} style={styles.back}><ArrowLeftIcon size={18} color={c.text} /></Pressable><Text style={styles.eyebrow}>02 / CE QUI JOUE</Text><Animated.View style={[styles.smallOrb, accentStyle]}><WeatherMorph value={motion} size={23} /></Animated.View></View><Text accessibilityRole="header" style={[styles.title, compact && { fontSize: tiny ? 26 : 29, lineHeight: tiny ? 31 : 34 }]}>{tiny ? 'Ce qui joue aujourd’hui' : <>Qu’est-ce qui{ '\n' }fait la différence ?</>}</Text><Text style={styles.optional}>Tu peux aussi passer cette étape.</Text></View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.reasonSpace, compact && { gap: 8, paddingVertical: tiny ? 8 : 14 }]}>
            {tagsLoading ? <ActivityIndicator accessibilityLabel="Chargement des raisons" color={c.ink} /> : tagsError ? <View style={{ gap: 10 }}><Text accessibilityRole="alert" style={styles.error}>{tagsError}</Text><Pressable accessibilityRole="button" onPress={() => setTagReload(value => value + 1)} style={styles.supportSecondary}><Text style={styles.supportSecondaryText}>Réessayer de charger les raisons</Text></Pressable></View> : tagOptions.length === 0 ? <Text style={styles.optional}>Aucune raison proposée pour le moment. Tu peux continuer sans en choisir.</Text> : null}
            <View style={styles.reasonGrid}>{tagOptions.map(tag => { const active = props.tags.includes(tag.label); const Icon = tagIcon(tag.icon); return <Pressable key={tag.id} accessibilityRole="checkbox" accessibilityLabel={tag.label} accessibilityState={{ checked: active }} aria-checked={active} disabled={tagsLoading || props.busy || (!active && props.tags.length >= 20)} onPress={() => { haptics.reason(!active); props.onTags(active ? props.tags.filter(t => t !== tag.label) : [...props.tags, tag.label]); }} style={[styles.reason, active && styles.reasonSelected, compact && { minHeight: tiny ? 48 : 58, padding: tiny ? 12 : 14, gap: tiny ? 8 : 10 }]}><Icon style={{ flexShrink: 0 }} size={tiny ? 20 : 24} color={active ? c.ink : c.muted} strokeWidth={active ? 2.5 : 2} /><Text numberOfLines={2} style={[styles.reasonText, tiny && { fontSize: 10 }]}>{tag.label}</Text>{active && <CheckIcon style={{ position: 'absolute', right: 7, top: 6 }} size={11} color={c.ink} />}</Pressable>; })}</View>
            <Pressable accessibilityRole="button" accessibilityLabel={privateReason ? 'Modifier ma raison personnelle' : 'Ajouter ma propre raison'} onPress={() => { setReasonDraft(privateReason); setReasonModal(true); }} style={[styles.addReason, compact && { minHeight: tiny ? 56 : 60 }]}><PlusCircleIcon size={25} color={c.text} /><View style={{ flex: 1, gap: 4 }}><Text style={styles.reasonText}>{privateReason || 'Ma propre raison'}</Text><Text style={styles.privateLabel}>Note personnelle · non partagée</Text></View>{privateReason ? <CheckIcon size={16} color={c.ink} /> : null}</Pressable>
          </ScrollView>
          <View style={styles.bottom}>{props.error ? <Text accessibilityRole="alert" style={styles.error}>{props.error}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={personal ? 'Enregistrer ma météo privée' : 'Partager ma météo'} disabled={props.busy || tagsLoading} onPress={props.onSubmit} style={[styles.primary, props.busy && { opacity: 0.65 }]}><Text style={styles.primaryText}>{personal ? 'Enregistrer pour moi' : props.tags.length ? 'Partager ma météo' : 'Partager sans raison collective'}</Text>{props.busy ? <ActivityIndicator size="small" color={c.ink} /> : <ArrowRightIcon size={21} color={c.ink} />}</Pressable><Text style={styles.footnote}>{personal ? 'Conservé sur cet appareil. Aucun ajout au graphe collectif.' : 'Seuls les tags prédéfinis sont transmis.'}</Text></View>
        </>}
      </NativeAnimated.View>
    </SafeAreaView>
    <Modal visible={reasonModal} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => setReasonModal(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.overlay, { padding: 0 }]}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}><View style={styles.sheet} accessibilityViewIsModal role="dialog" aria-modal={true}><View style={styles.sheetHeader}><Text style={styles.sheetKicker}>JUSTE POUR TOI</Text><Pressable accessibilityRole="button" accessibilityLabel="Fermer la raison personnelle" onPress={() => setReasonModal(false)} style={styles.iconButton}><XIcon size={21} color={c.text} /></Pressable></View><Text accessibilityRole="header" style={styles.sheetTitle}>Ta propre raison.</Text><Text style={styles.sheetBody}>Ce brouillon reste sur cet écran. Il n’est envoyé ni au serveur ni à ton manager, puis il est effacé après l’envoi.</Text><TextInput accessibilityLabel="Ma raison personnelle" placeholder="Ce qui joue pour moi…" placeholderTextColor={c.dim} value={reasonDraft} onChangeText={setReasonDraft} maxLength={80} multiline style={styles.noteInput} /><Text style={styles.counter}>{reasonDraft.length}/80</Text><Pressable accessibilityRole="button" style={styles.primary} onPress={() => { setPrivateReason(reasonDraft.trim()); setReasonModal(false); }}><Text style={styles.primaryText}>{reasonDraft.trim() ? 'Ajouter à mon écran' : 'Retirer ma note'}</Text><CheckIcon size={19} color={c.ink} /></Pressable></View></ScrollView></KeyboardAvoidingView>
    </Modal>
    <Modal visible={supportVisible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={dismissSupport}>
      <View style={[styles.overlay, { padding: 0 }]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.modalScroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.sheet, styles.supportSheet]} accessibilityViewIsModal role="dialog" aria-modal={true}>
            <View style={styles.sheetHeader}>
              <View style={styles.supportBadge}><ChatsCircleIcon size={27} color={c.link} weight="duotone" /></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fermer l’invitation à échanger" onPress={dismissSupport} style={styles.supportClose}><XIcon color={c.text} size={21} /></Pressable>
            </View>
            <View style={styles.supportIntro}>
              <Text style={styles.sheetKicker}>UN MOMENT POUR TOI</Text>
              <Text accessibilityRole="header" style={styles.sheetTitle}>{prepareMessage ? 'Un premier pas.' : 'Tu peux en parler.'}</Text>
              <Text style={styles.sheetBody}>{prepareMessage ? 'Voici un message à copier et adapter. Tu choisis à qui le transmettre.' : props.supportPrompt ? `Tu as partagé trois météos « ${weathers[0].label} » sur des jours distincts au cours des 30 derniers jours. Si tu le souhaites, tu peux échanger avec un professionnel, ton manager ou une personne de confiance.` : 'Un professionnel, ton manager ou une personne de confiance : choisis la personne avec qui tu te sens à l’aise.'}</Text>
            </View>
            {prepareMessage && <View style={styles.supportMessage}><Text style={styles.sheetKicker}>TON BROUILLON</Text><Text selectable style={styles.sheetBody}>Bonjour, j’aimerais prendre un moment pour échanger sur mon ressenti au travail et sur ce qui pourrait m’aider. Serais-tu disponible pour en parler ?</Text><Text style={styles.privacyNoteText}>Tu peux sélectionner ce texte pour le copier. Rien n’est envoyé depuis cet écran.</Text></View>}
            <View style={styles.supportPrivacy}><ShieldCheckIcon size={18} color={c.link} /><Text style={styles.privacyNoteText}>Ton choix reste privé. Aucune alerte ni météo individuelle n’est transmise à ton manager.</Text></View>
            <View style={styles.supportActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Trouver un accompagnement" style={({ pressed }) => [styles.primary, pressed && { opacity: .8 }]} onPress={() => { dismissSupport(); props.onSupport(); }}><Text style={styles.primaryText}>Trouver du soutien</Text><CaretRightIcon color={c.ink} weight="bold" size={20} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={prepareMessage ? 'Retour aux options d’échange' : 'Préparer un échange'} style={({ pressed }) => [styles.supportSecondary, pressed && { opacity: .7 }]} onPress={() => setPrepareMessage(value => !value)}>{prepareMessage ? <ArrowLeftIcon color={c.link} size={19} /> : <ChatsCircleIcon color={c.link} size={19} />}<Text style={styles.supportSecondaryText}>{prepareMessage ? 'Retour aux options' : 'Préparer un échange'}</Text>{!prepareMessage && <CaretRightIcon color={c.link} size={18} />}</Pressable>
              <Pressable accessibilityRole="button" onPress={dismissSupport} style={styles.supportDismiss}><Text style={styles.supportDismissText}>{prepareMessage ? 'Fermer' : 'Pas maintenant'}</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  </Animated.View>;
}
const styles = StyleSheet.create({
  supportSheet: { padding: 20, gap: 18, maxWidth: 420 },
  supportBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: c.selected, alignItems: 'center', justifyContent: 'center' },
  supportClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
  supportIntro: { gap: 12 },
  supportPrivacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: c.elevated, padding: 12, borderRadius: 14 },
  supportMessage: { gap: 10, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14 },
  supportActions: { gap: 10 },
  supportSecondary: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  supportSecondaryText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 19, color: c.link },
  supportDismiss: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  supportDismissText: { fontSize: 12, color: c.muted },
  background: { flex: 1 },
  safe: { flex: 1 },
  header: { height: 68, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  intro: { paddingTop: 22, gap: 16 },
  eyebrow: { fontFamily: mono, fontSize: 10, letterSpacing: 1.7, color: c.muted, textAlign: 'center' },
  title: { color: c.text, fontSize: 35, lineHeight: 41, fontWeight: '500', letterSpacing: -1.1, textAlign: 'center' },
  dialSpace: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 280, gap: 6 },
  gestureHint: { minHeight: 44, maxWidth: 340, lineHeight: 21.25, paddingHorizontal: 8, fontSize: 15, color: c.muted, textAlign: 'center' },
  bottom: { paddingBottom: 18, gap: 12, paddingTop: 12 },
  primary: { backgroundColor: c.accent, minHeight: 54, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  continueIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: c.ink },
  primaryText: { color: c.ink, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  footnote: { fontSize: 10, lineHeight: 15, color: c.muted, textAlign: 'center' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, justifyContent: 'center' },
  smallOrb: { width: 36, height: 36, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optional: { fontSize: 12, color: c.muted, textAlign: 'center' },
  reasonSpace: { flexGrow: 1, justifyContent: 'center', gap: 14, paddingVertical: 14 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reason: { width: '48%', flexGrow: 1, minHeight: 76, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  reasonSelected: { backgroundColor: c.selected, borderColor: c.link },
  reasonText: { fontSize: 12, color: c.text, flexShrink: 1 },
  addReason: { minHeight: 78, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15 },
  privateLabel: { color: c.muted, fontSize: 10, lineHeight: 16 },
  done: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 23, paddingBottom: 40 },
  doneOrb: { width: 132, height: 132, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 34, letterSpacing: -1.2, color: c.text, textAlign: 'center' },
  doneBody: { fontSize: 14, lineHeight: 24, textAlign: 'center', color: c.muted },
  supportLink: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, borderWidth: 1, borderColor: c.line, borderRadius: 25 },
  supportLinkText: { color: c.text, fontSize: 13 },
  replay: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 12, color: c.muted, textDecorationLine: 'underline' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  overlay: { flex: 1, backgroundColor: '#263c2e66', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: c.panel, borderRadius: 24, padding: 24, gap: 20, width: '100%', maxWidth: 440, alignSelf: 'center', borderWidth: 1, borderColor: c.line },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetKicker: { fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: c.muted },
  sheetTitle: { fontSize: 28, lineHeight: 34, color: c.text, letterSpacing: -0.7 },
  sheetBody: { fontSize: 13, lineHeight: 21, color: c.muted },
  noteInput: { borderWidth: 1, borderColor: c.line, borderRadius: 13, minHeight: 96, textAlignVertical: 'top', color: c.text, fontSize: 16, lineHeight: 23, padding: 14, backgroundColor: c.surface },
  counter: { fontFamily: mono, fontSize: 10, color: c.dim, textAlign: 'right', marginTop: -10 },
  privacyNote: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  privacyNoteText: { flex: 1, fontSize: 11, lineHeight: 18, color: c.muted },
  message: { color: c.text, fontSize: 14, lineHeight: 23, backgroundColor: c.surface, padding: 16, borderRadius: 13 },
  error: { fontSize: 12, lineHeight: 18, color: c.error }
});
