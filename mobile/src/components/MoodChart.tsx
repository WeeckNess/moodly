import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { DailyStat } from '../strapi';
import { colors as c, mono } from '../theme';
export function MoodChart({ data }: { data: DailyStat[] }) {
  const [width, setWidth] = useState(300);
  const height = 236, left = 24, right = 15, top = 18, bottom = 34;
  const x = (i: number) => left + i * (width - left - right) / Math.max(data.length - 1, 1);
  const y = (v: number) => height - bottom - (v - 1) / 4 * (height - bottom - top);
  const mean = data.filter(d => d.average !== null);
  const summary = mean.length ? `Moral moyen des jours visibles : ${(mean.reduce((sum, d) => sum + d.average!, 0) / mean.length).toFixed(1)} sur 5.` : 'Aucun jour ne compte encore assez de réponses pour être affiché.';
  const path = data.map((d, i) => d.average === null ? '' : `${i === 0 || data[i - 1].average === null ? 'M' : 'L'} ${x(i)} ${y(d.average)}`).join(' ');
  const dateLabel = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return <View onLayout={event => setWidth(Math.max(240, event.nativeEvent.layout.width))}>
    <View accessible accessibilityRole="image" accessibilityLabel={`Évolution sur 30 jours. ${summary} Les jours sous 5 réponses sont masqués.`}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[1, 2, 3, 4, 5].map(value => <ViewlessGrid key={value} value={value} y={y(value)} width={width} />)}
        {data.map((d, i) => d.average === null ? <Line key={d.day} x1={x(i)} x2={x(i)} y1={top} y2={height - bottom} stroke={c.line} strokeDasharray="2 6" /> : null)}
        <Path d={path} stroke={c.accent} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
        {data.map((d, i) => d.average !== null ? <Circle key={d.day} cx={x(i)} cy={y(d.average)} r={3.3} fill={c.accent} stroke={c.panel} strokeWidth={1.5} /> : null)}
        {[0, 9, 19, 29].filter(i => data[i]).map(i => <SvgText key={i} x={x(i)} y={height - 8} fill={c.muted} fontSize={10} textAnchor={i === 0 ? 'start' : i === 29 ? 'end' : 'middle'}>{dateLabel(data[i].day)}</SvgText>)}
      </Svg>
    </View>
    <View style={styles.legend}><View style={styles.dot} /><Text style={styles.text}>MORAL MOYEN / 5</Text><Text style={styles.text}> · </Text><Text style={styles.text}>POINTILLÉS : JOUR MASQUÉ</Text></View>
    <Text style={styles.summary}>{summary}</Text>
  </View>;
}
function ViewlessGrid({ value, y, width }: { value: number; y: number; width: number }) {
  return <><SvgText x={0} y={y + 4} fill={c.muted} fontSize={11}>{value}</SvgText><Line x1={24} x2={width - 15} y1={y} y2={y} stroke={c.line} /></>;
}
const styles = StyleSheet.create({ legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.accent }, text: { fontFamily: mono, fontSize: 9, letterSpacing: 0.5, color: c.muted }, summary: { fontSize: 13, color: c.muted, lineHeight: 20, marginTop: 16 } });
