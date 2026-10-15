import { useEffect, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import type { DailyStat } from '../strapi';
import { colors as c, mono, moodPalette } from '../theme';
import { ArrowLeftIcon, ArrowRightIcon, EyeSlashIcon } from '../icons';
import { chartSegments, visibleMean } from '../chartGeometry';
export function MoodChart({ data, threshold = 5 }: { data: DailyStat[]; threshold?: number }) {
  const [width, setWidth] = useState(300);
  const [selected, setSelected] = useState(Math.max(0, data.length - 1));
  useEffect(() => { setSelected(Math.max(0, data.length - 1)); }, [data]);
  const height = 216, top = 16, bottom = 32;
  const x = (i: number) => 28 + i * (width - 44) / Math.max(data.length - 1, 1);
  const y = (v: number) => height - bottom - (v - 1) / 4 * (height - bottom - top);
  const mean = visibleMean(data);
  const summary = mean === null ? 'Pas encore de journée visible.' : `Moyenne des journées visibles : ${mean.toFixed(1).replace('.', ',')} sur 5.`;
  const day = data[selected];
  const dateLabel = (value: string, long = false) => new Date(`${value}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: long ? 'long' : 'short' });
  const positions = [...new Set([0, Math.round((data.length - 1) / 2), data.length - 1])].filter(i => data[i]);
  return <View onLayout={event => setWidth(Math.max(180, event.nativeEvent.layout.width))}>
    <View accessible accessibilityRole="image" accessibilityLabel={`Évolution sur 30 jours. ${summary} Les jours avec moins de ${threshold} réponses sont masqués.`} onTouchEnd={event => { const position = Math.round((event.nativeEvent.locationX - 28) / (width - 44) * (data.length - 1)); setSelected(Math.max(0, Math.min(data.length - 1, position))); }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} pointerEvents="none">
        {[1, 2, 3, 4, 5].map(value => <ViewlessGrid key={value} value={value} y={y(value)} width={width} />)}
        {data.map((d, i) => d.average === null ? <Line key={d.day} x1={x(i)} x2={x(i)} y1={top} y2={height - bottom} stroke={c.line} strokeDasharray="2 6" /> : null)}
        {day && <Line x1={x(selected)} x2={x(selected)} y1={top} y2={height - bottom} stroke={c.muted} strokeOpacity={0.4} strokeDasharray="3 5" />}
        {chartSegments(data, width, height).map(segment => <Line key={segment.to} x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={c.text} strokeWidth={2.5} strokeLinecap="round" />)}
        {data.map((d, i) => d.average !== null ? <Circle key={d.day} cx={x(i)} cy={y(d.average)} r={selected === i ? 6 : 3} fill={moodPalette.accents[Math.max(0, Math.min(4, Math.round(d.average) - 1))]} stroke={c.ink} strokeWidth={1.5} /> : null)}
        {positions.map(i => <SvgText key={i} x={x(i)} y={height - 6} fill={c.muted} fontSize={10} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>{dateLabel(data[i].day)}</SvgText>)}
      </Svg>
    </View>
    <View style={s.legend}><View style={s.dot} /><Text style={s.legendText}>Moyenne / 5</Text><EyeSlashIcon size={13} color={c.muted} /><Text style={s.legendText}>Pointillés : jour masqué</Text></View>
    {day && <View style={s.selection}><Pressable accessibilityRole="button" accessibilityLabel="Journée précédente" disabled={selected === 0} onPress={() => setSelected(i => i - 1)} style={[s.arrow, selected === 0 && { opacity: 0.3 }]}><ArrowLeftIcon size={18} color={c.text} /></Pressable><View style={s.detail} accessibilityLiveRegion="polite"><Text style={s.date}>{dateLabel(day.day, true)}</Text><Text style={s.detailText}>{day.average === null ? 'Journée masquée · aucune note visible' : `${day.average.toFixed(1).replace('.', ',')} / 5 · moyenne collective`}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Journée suivante" disabled={selected === data.length - 1} onPress={() => setSelected(i => i + 1)} style={[s.arrow, selected === data.length - 1 && { opacity: 0.3 }]}><ArrowRightIcon size={18} color={c.text} /></Pressable></View>}
  </View>;
}
function ViewlessGrid({ value, y, width }: { value: number; y: number; width: number }) {
  return <><SvgText x={0} y={y + 4} fill={c.muted} fontSize={10}>{value}</SvgText><Line x1={28} x2={width - 16} y1={y} y2={y} stroke={c.line} strokeOpacity={0.5} /></>;
}
const s = StyleSheet.create({ legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 8, marginTop: 10 }, dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: c.link }, legendText: { fontSize: 10, color: c.muted }, selection: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderColor: c.line, marginTop: 18, paddingTop: 10 }, arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, detail: { flex: 1, gap: 5, alignItems: 'center' }, date: { fontFamily: mono, fontSize: 10, color: c.text }, detailText: { fontSize: 11, lineHeight: 16, color: c.muted, textAlign: 'center' } });
