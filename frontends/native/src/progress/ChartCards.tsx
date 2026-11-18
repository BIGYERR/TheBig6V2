// Progress's cards in the Expo app (MIGRATION.md phase 3, row 4): the weekly dot chart (the Angular DotChart,
// charts/dot-chart.ts), a run card (ChartCard, charts/chart-card.ts) and the Lift Ledger's three (LedgerCards and
// CardShell, charts/ledger-cards.ts and card-shell.ts), each drawn from today's own model with today's words. Every
// number comes from the spec.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, SvgXml, Text as SvgText } from 'react-native-svg';

import { DISPLAY, type Palette, TEXT } from '../theme';
import { blockType, markupBlocks } from './card-markup';
import type { CardSpec } from './charts/chart-card-model';
import type { DotSpec } from './charts/dot-chart-model';
import type { LedgerView } from './charts/ledger-model';
import { paint } from './paint';
import { markupParts } from './progress-screen';
import { SvgPicture } from './SvgPicture';

/** A card's title as the page writes it: its icon, then its words, in the card's colour. */
export function CardTitle({ html, color, gap, size = 15 }: { html: string; color: string; gap: number; size?: number }) {
  const t = markupParts(html);
  return (
    <View style={[s.title, { marginBottom: gap }]}>
      {t.icon && <SvgXml xml={t.icon.replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />}
      <Text style={[s.titleText, { color }]}>{t.text}</Text>
    </View>
  );
}

/** The page's _iaCard: the card, its title in a colour, what the caller puts inside, and a footer when there is one. */
export function CardShell({ title, color, foot, palette: p, children }: { title: string; color: string; foot: string | null; palette: Palette; children: React.ReactNode }) {
  return (
    <View style={[s.card, { backgroundColor: p.surface }]}>
      <CardTitle html={title} color={color} gap={12} />
      {children}
      {foot && <Text style={[s.foot, { color: p.muted }]}>{markupParts(foot).text}</Text>}
    </View>
  );
}

/** A card's head, body or footer as the page writes it: each block a line of type of its own, each <b> bold in the colour it names. `base` is the type of the words outside any block (the footer's). */
export function Markup({ html, base, palette: p }: { html: string; base?: object; palette: Palette }) {
  return (
    <>
      {markupBlocks(html).map((b, i) => (
        <Text key={i} style={b.style ? blockType(b.style, p) : base}>
          {b.runs.map((r, j) => (r.bold ? <Text key={j} style={[s.bold, r.color !== null && { color: paint(r.color, p) }]}>{r.text}</Text> : r.text))}
        </Text>
      ))}
    </>
  );
}

/** One run card (the page's ChartCard): the title in the card's colour, the head, the picture, the body and the footer, each only where the spec holds one. */
export function RunCard({ spec: c, palette: p }: { spec: CardSpec; palette: Palette }) {
  return (
    <View testID="run-card" style={[s.card, { backgroundColor: p.surface }]}>
      <CardTitle html={c.title} color={paint(c.color, p)} gap={c.titleGap} />
      {c.head && <Markup html={c.head} palette={p} />}
      {c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style="width:100%;height:auto;overflow:visible" els={c.svg.els} palette={p} />}
      {c.body && <Markup html={c.body} palette={p} />}
      {c.foot && <Markup html={c.foot} base={[s.foot, { color: p.muted }]} palette={p} />}
    </View>
  );
}

/** One weekly dot chart: gridlines and their values, the dashed line between logged weeks, a dot and its halo on each, the week labels, then the total and the peak. */
export function DotChartCard({ spec: c, palette: p }: { spec: DotSpec; palette: Palette }) {
  const color = paint(c.color, p), axis = 'rgba(' + p.inkRgb + ',0.3)', grid = 'rgba(' + p.inkRgb + ',0.06)';
  return (
    <View testID="dot-chart" style={[s.card, { backgroundColor: p.surface }]}>
      <CardTitle html={c.title} color={color} gap={10} />
      <Svg viewBox={'0 0 ' + c.width + ' ' + c.height} style={{ width: '100%', aspectRatio: c.width / c.height, overflow: 'visible' }}>
        {c.grid.map((g, i) => <Line key={'g' + i} x1={c.left} y1={g.y} x2={c.right} y2={g.y} stroke={grid} strokeWidth={1} />)}
        {c.grid.map((g, i) => <SvgText key={'v' + i} x={c.left - 4} y={g.y + 4} fill={axis} fontSize={8} textAnchor="end" fontFamily={DISPLAY}>{g.label}</SvgText>)}
        <Path d={c.path} stroke={color} strokeWidth={1.5} strokeDasharray="3,3" fill="none" opacity={0.6} />
        {c.points.map((pt, i) => <Circle key={'d' + i} cx={pt.x} cy={pt.y} r={4} fill={color} opacity={0.9} />)}
        {c.points.map((pt, i) => <Circle key={'h' + i} cx={pt.x} cy={pt.y} r={7} fill={color} opacity={0.15} />)}
        {c.xLabels.map((l, i) => <SvgText key={'w' + i} x={l.x} y={c.xLabelY} fill={axis} fontSize={8} textAnchor="middle" fontFamily={DISPLAY}>{l.text}</SvgText>)}
      </Svg>
      <Text style={[s.sum, { color: p.muted }]}>
        {'Total logged: '}<Text style={[s.bold, { color }]}>{c.total + ' ' + c.unit}</Text>{' · Peak week: '}<Text style={[s.bold, { color }]}>{c.peak + ' ' + c.unit}</Text>
      </Text>
    </View>
  );
}

/** The Lift Ledger: Main Lifts, the Range Ladder and Other Accessory Work, each drawn only when it has rows. */
export function LedgerCards({ view: v, palette: p }: { view: LedgerView; palette: Palette }) {
  const m = v.mains, l = v.ladder, o = v.other;
  return (
    <>
      {m && (
        <CardShell title={m.title} color={p.lift} foot={m.foot} palette={p}>
          {m.blocks.map((b, i) => (
            <View key={i} testID="main-lift" style={[s.block, { borderBottomColor: p.border }]}>
              <View style={s.blockHead}>
                <Text style={[s.blockName, { color: p.text }]}>{b.name}</Text>
                <Text style={[s.blockTop, { color: p.lift }]}>{b.top}</Text>
              </View>
              <Text style={[s.blockLine, { color: p.muted }]}>
                {'Opened at '}<Text style={[s.bold, { color: p.text }]}>{b.opened}</Text>{b.afterOpened}
                {b.gain && <><Text style={[s.bold, { color: p.lift }]}>{b.gain}</Text>{b.afterGain}</>}
              </Text>
              {b.chart && <SvgPicture viewBox={b.chart.viewBox} style={b.chart.style} els={b.chart.els} palette={p} />}
            </View>
          ))}
        </CardShell>
      )}
      {l && (
        <CardShell title={l.title} color={p.lift} foot={l.foot} palette={p}>
          <View style={s.readyRow}>
            <Text style={[s.readyNum, { color: l.ready ? p.signal : p.muted }]}>{l.ready}</Text>
            <Text style={[s.readyWords, { color: p.text }]}>ready to move up</Text>
          </View>
          <Text style={[s.readySub, { color: p.muted }]}>
            {l.ups
              ? <>{'You have stepped the weight up '}<Text style={[s.bold, { color: p.text }]}>{l.ups + ' time' + (l.ups === 1 ? '' : 's')}</Text>{' across these lifts this block. Hit the top of the range on every set, then add weight and start back at the bottom.'}</>
              : 'Hit the top of the range on every set, then add weight and start back at the bottom.'}
          </Text>
          {l.rows.map((r, i) => (
            <View key={i} testID="ladder-row" style={[s.ladderRow, { borderBottomColor: p.border }]}>
              <View style={s.ladderWords}>
                <Text style={[s.ladderName, { color: p.text }]}>{r.name}</Text>
                <Text style={[s.ladderMeta, { color: p.muted }]}><Text style={[s.bold, { color: p.text }]}>{r.weight}</Text>{r.detail}</Text>
                {r.ready
                  ? <Text style={[s.addWeight, { color: p.signal }]}>Add weight</Text>
                  : <Text style={[s.toGo, { color: p.muted }]}>{r.toGo + ' to go'}</Text>}
              </View>
              <SvgPicture viewBox={r.track.viewBox} style={r.track.style} els={r.track.els} palette={p} />
            </View>
          ))}
        </CardShell>
      )}
      {o && (
        <CardShell title={o.title} color={p.muted} foot={o.foot} palette={p}>
          {o.rows.map((r, i) => (
            <View key={i} testID="other-row" style={[s.otherRow, { borderBottomColor: p.border }]}>
              <Text style={[s.otherName, { color: p.text }]}>{r.name}</Text>
              <Text style={[s.otherMeta, { color: p.muted }]}>{r.meta}</Text>
            </View>
          ))}
        </CardShell>
      )}
    </>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  titleText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  foot: { fontFamily: TEXT, fontSize: 11, marginTop: 6, lineHeight: 16.5 },
  sum: { fontFamily: TEXT, fontSize: 11, marginTop: 4 },
  bold: { fontWeight: '700' },
  block: { paddingVertical: 12, borderBottomWidth: 1 },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  blockName: { fontFamily: TEXT, fontSize: 13, fontWeight: '600', lineHeight: 17, flexShrink: 1 },
  blockTop: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '700' },
  blockLine: { fontFamily: TEXT, fontSize: 11, marginTop: 2, marginBottom: 8 },
  readyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginBottom: 2 },
  readyNum: { fontFamily: DISPLAY, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, lineHeight: 32 },
  readyWords: { fontFamily: TEXT, fontSize: 13, fontWeight: '600' },
  readySub: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  ladderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  ladderWords: { flex: 1, minWidth: 0 },
  ladderName: { fontFamily: TEXT, fontSize: 12, fontWeight: '500', lineHeight: 15.6 },
  ladderMeta: { fontFamily: TEXT, fontSize: 10, marginTop: 2 },
  addWeight: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700', marginTop: 3 },
  toGo: { fontFamily: TEXT, fontSize: 10, marginTop: 3 },
  otherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  otherName: { fontFamily: TEXT, fontSize: 12, flexShrink: 1 },
  otherMeta: { fontFamily: TEXT, fontSize: 10 },
});
