// Progress in the Expo app (MIGRATION.md phase 3, row 4), in place of today's ProgressFrame, ProgressScreen and
// ProgramChips (frontends/app/src/app/screens/progress): the program chips and the archived program's bar, the
// empty states, the weekly dot charts, the run cards, the Lift Ledger, the Session Journal and the 1RM estimator,
// each with today's words. What it shows is progress-screen.ts's view; what a tap writes is progress-writes.ts's.
//
// The body is drawn anew on every draw, as the page writes it anew: the journal's weeks fold back (the latest
// open), the estimator folds and its two numbers clear.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { asyIcon } from '@ia/core/engine/icons.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { DISPLAY, type Palette, TEXT } from '../theme';
import { CardTitle, DotChartCard, LedgerCards, RunCard } from './ChartCards';
import { paint } from './paint';
import type { ChipsView } from './program-chips-model';
import { CALC_LIFTS, type JournalWeek } from './progress-model';
import {
  DRAWN, type ProgressState, afterDelete, askPurge, cancelConfirm, estimateLine, estimatorUnit, markupParts, openProgress, progressView,
  setCalcLift, showProgram,
} from './progress-screen';
import { deleteProgram, restoreProgram } from './progress-writes';

/** An icon core draws as markup, in a colour and a size. */
function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}

export function Progress({ palette: p, store, state: st, say }: {
  palette: Palette; store: StateStore;
  /** What the page keeps between draws; the app holds it, so the estimator's lift outlives a visit. */
  state: ProgressState;
  say: (text: string) => void;
}) {
  const insets = useSafeAreaInsets();
  // The tab's tap (showProgressScreen), then the first draw. n counts the draws: each is a body of its own.
  const [drawn, setDrawn] = useState(() => { openProgress(st); return { view: progressView(store, st, Date.now()), n: 0 }; });
  const redraw = (): void => setDrawn((d) => ({ view: progressView(store, st, Date.now()), n: d.n + 1 }));
  const v = drawn.view;
  const on = {
    show: (id: string): void => { showProgram(st, id); redraw(); },
    restore: (id: string): void => { const toast = restoreProgram(store, id); redraw(); if (toast) say(toast); },
    askPurge: (id: string): void => { askPurge(st, id); redraw(); },
    purge: (id: string): void => { const toast = deleteProgram(store, id); afterDelete(st, id); redraw(); say(toast); },
    cancel: (): void => { cancelConfirm(st); redraw(); },
  };
  return (
    <View testID="progress" style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={[s.top, { paddingTop: insets.top, borderBottomColor: p.border }]}>
        <Text style={[s.app, { color: p.muted }]}>The Asylum</Text>
        <Text accessibilityRole="header" style={[s.screen, { color: p.text }]}>Progress</Text>
      </View>
      <ScrollView key={drawn.n} testID="progress-body" contentContainerStyle={[s.body, { paddingBottom: 140 + insets.bottom }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        {v && (
          <>
            <Chips view={v.chips} palette={p} on={on} />
            {v.empty && (
              <View testID="progress-empty" style={s.empty}>
                <View style={s.emptyIcon}><Icon name="📊" size={44} color={p.muted} /></View>
                <Text style={[s.emptyHead, { color: p.text }]}>No data yet</Text>
                <Text style={[s.emptyText, { color: p.muted }]}>
                  {v.empty === 'none' ? 'Start logging your sessions and your progress will appear here as dotted line charts.' : 'Log sessions to see progress charts, exercise history, and your training journal here.'}
                </Text>
              </View>
            )}
            {v.charts.filter((c) => DRAWN.includes(c.kind)).map((c, i) => (
              c.kind === 'dot' ? <DotChartCard key={i} spec={c.spec} palette={p} />
                : c.kind === 'card' ? <RunCard key={i} spec={c.spec} palette={p} />
                  : <LedgerCards key={i} view={c.view} palette={p} />
            ))}
            {v.journal && <Journal weeks={v.journal} palette={p} />}
            {v.estimator && <Estimator palette={p} state={st} unit={estimatorUnit(store)} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** The program chips and the archived program's bar (the Angular ProgramChips). */
function Chips({ view: v, palette: p, on }: { view: ChipsView; palette: Palette; on: { show: (id: string) => void; restore: (id: string) => void; askPurge: (id: string) => void; purge: (id: string) => void; cancel: () => void } }) {
  const b = v.bar;
  return (
    <>
      {v.chips && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chips}>
          {v.chips.map((c) => {
            const label = markupParts(c.label), color = c.sel ? p.onInk : p.muted;
            return (
              <Pressable key={c.id} testID="program-chip" accessibilityRole="button" accessibilityState={{ selected: c.sel }} onPress={() => on.show(c.id)}
                style={[s.chip, { borderColor: c.sel ? p.accent : p.border, backgroundColor: c.sel ? p.accent : p.surface }]}>
                {label.icon && <SvgXml xml={label.icon.replace(/ style="[^"]*"/, '')} color={color} width={13} height={13} />}
                <Text numberOfLines={1} style={[s.chipText, { color }]}>{label.text}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {b && b.kind === 'confirm' && (
        <View testID="delete-confirm" style={[s.confirm, { backgroundColor: p.surface, borderColor: p.red }]}>
          <Text style={[s.confirmText, { color: p.red }]}>
            {'This erases all logs, weights, and history for “' + b.name + '”. It cannot be undone.'}
            {b.warn && <Text style={{ color: p.muted }}>{'\nOther programs are using these loads as starting points — those will go blank.'}</Text>}
          </Text>
          <View style={s.confirmRow}>
            <Pressable testID="delete-forever" accessibilityRole="button" onPress={() => on.purge(b.id)} style={[s.action, s.grow, { borderColor: 'rgba(255,69,58,0.35)' }]}><Text style={[s.actionText, { color: p.red }]}>Delete Forever</Text></Pressable>
            <Pressable testID="delete-cancel" accessibilityRole="button" onPress={on.cancel} style={[s.action, s.grow, { borderColor: p.border2 }]}><Text style={[s.actionText, { color: p.muted }]}>Cancel</Text></Pressable>
          </View>
        </View>
      )}
      {b && b.kind === 'archived' && (
        <View testID="archived-bar" style={[s.bar, { backgroundColor: p.surface }]}>
          <Text style={[s.barText, { color: p.muted }]}>This program is archived — history only.</Text>
          <Pressable testID="restore" accessibilityRole="button" onPress={() => on.restore(b.id)} style={[s.action, { borderColor: p.border2 }]}><Text style={[s.actionText, { color: p.muted }]}>Restore</Text></Pressable>
          <Pressable testID="delete-ask" accessibilityRole="button" accessibilityLabel="Delete this program forever" onPress={() => on.askPurge(b.id)} style={[s.action, s.trash, { borderColor: p.border2 }]}>
            <Icon name="trash" size={16} color={p.red} />
          </Pressable>
        </View>
      )}
    </>
  );
}

/** The Session Journal: a week folds and unfolds on its head; only the latest opens unfolded. */
function Journal({ weeks, palette: p }: { weeks: JournalWeek[]; palette: Palette }) {
  const [open, setOpen] = useState<Record<number, boolean>>(() => Object.fromEntries(weeks.map((w) => [w.week, w.open])));
  return (
    <View testID="journal" style={[s.card, { backgroundColor: p.surface }]}>
      <CardTitle html={asyIcon('📓', 15) + ' Session Journal'} color={p.muted} gap={12} />
      {weeks.map((wk, wi) => (
        <View key={wk.week} style={wi ? [s.week, { borderTopColor: p.border }] : null}>
          <Pressable testID="journal-week" accessibilityRole="button" accessibilityState={{ expanded: !!open[wk.week] }} onPress={() => setOpen((o) => ({ ...o, [wk.week]: !o[wk.week] }))} style={s.weekHead}>
            <Text style={[s.weekName, { color: p.muted }]}>{'Week ' + wk.week}</Text>
            <View style={s.weekCount}>
              <Text style={[s.weekCountText, { color: p.muted }]}>{wk.count}</Text>
              <View style={open[wk.week] ? s.turned : null}><Icon name="chevronDown" size={14} color={p.muted} /></View>
            </View>
          </Pressable>
          {open[wk.week] && (
            <View style={s.entries}>
              {wk.entries.map((e, i) => {
                const swap = e.swap ? markupParts(e.swap.html) : null;
                return (
                  <View key={i} testID="journal-entry" style={[s.entry, { backgroundColor: p.surface2 }]}>
                    <View style={[s.entryHead, { marginBottom: e.headMb }]}>
                      <Text style={[s.entryDay, { color: p.text }]}>{e.day}</Text>
                      {e.rpe && <Text style={[s.entryRpe, { color: paint(e.rpe.color, p) }]}>{e.rpe.text}</Text>}
                    </View>
                    {swap && e.swap && (
                      <View style={[s.swap, { backgroundColor: 'rgba(' + p.inkRgb + ',0.06)', marginBottom: e.swap.mb }]}>
                        {swap.icon && <SvgXml xml={swap.icon.replace(/ style="[^"]*"/, '')} color={p.accent} width={12} height={12} />}
                        <Text style={[s.swapText, { color: p.accent }]}>{swap.text}</Text>
                      </View>
                    )}
                    {e.jogLines.length > 0 && (
                      <View style={{ marginBottom: e.jogMb }}>
                        {e.jogLines.map((l, li) => <Text key={li} style={[s.jog, { color: p.run }]}>{markupParts(l).text}</Text>)}
                      </View>
                    )}
                    {e.notes && <Text style={[s.notes, { color: p.muted }]}>{markupParts(e.notes).text}</Text>}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/** The 1RM estimator: folded until its head is tapped, a lift of three, two numbers, and the estimate once both are there. */
function Estimator({ palette: p, state: st, unit }: { palette: Palette; state: ProgressState; unit: string }) {
  const [open, setOpen] = useState(false);
  const [lift, setLift] = useState(st.calcLift);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const line = estimateLine(st, weight, reps, unit);
  return (
    <View testID="estimator" style={[s.estimator, { backgroundColor: p.surface }]}>
      <Pressable testID="estimator-head" accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={s.estimatorHead}>
        <CardTitle html={asyIcon('🧮', 15) + ' 1RM Estimator'} color={p.muted} gap={0} />
      </Pressable>
      {open && (
        <View style={s.estimatorBody}>
          <Text style={[s.estimatorSay, { color: p.muted }]}>Optional — estimate a one-rep max from any recent set, just for your own records. Your training still runs on RPE.</Text>
          <View style={[s.lifts, { backgroundColor: p.surface2, borderColor: p.border2 }]}>
            {CALC_LIFTS.map((n, i) => (
              <Pressable key={n} testID={'calc-lift-' + n} accessibilityRole="button" accessibilityState={{ selected: lift === n }} onPress={() => { setCalcLift(st, n); setLift(n); }}
                style={[s.lift, i ? { borderLeftWidth: 1, borderLeftColor: p.border2 } : null, { backgroundColor: lift === n ? p.accent : 'transparent' }]}>
                <Text style={[s.liftText, { color: lift === n ? p.onInk : p.muted }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.inputs}>
            <View style={s.inputGroup}>
              <Text style={[s.inputLabel, { color: p.muted }]}>Weight</Text>
              <TextInput testID="calc-weight" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 185" placeholderTextColor={p.dim}
                style={[s.input, { backgroundColor: p.surface, borderColor: p.border2, color: p.text }]} />
            </View>
            <View style={s.inputGroup}>
              <Text style={[s.inputLabel, { color: p.muted }]}>Reps</Text>
              <TextInput testID="calc-reps" value={reps} onChangeText={setReps} keyboardType="decimal-pad" placeholder="e.g. 5" placeholderTextColor={p.dim}
                style={[s.input, { backgroundColor: p.surface, borderColor: p.border2, color: p.text }]} />
            </View>
          </View>
          <Text testID="calc-result" style={[s.result, { color: p.muted }]}>
            {line && <><Text style={[s.resultBold, { color: p.accent }]}>{line.bold}</Text>{line.rest}</>}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // The page's top bar (look.css .top-bar): the app's name small, the screen's name large.
  top: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  app: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '600' },
  screen: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '700', letterSpacing: -1.2, lineHeight: 42, marginTop: 2 },
  body: { paddingTop: 16, paddingHorizontal: 20, gap: 20 },
  card: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  chipsScroll: { flexGrow: 0 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  chipText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 },
  barText: { fontFamily: TEXT, fontSize: 12, flex: 1 },
  confirm: { gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 },
  confirmText: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  confirmRow: { flexDirection: 'row', gap: 8 },
  action: { padding: 7, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  trash: { paddingVertical: 8, paddingHorizontal: 10 },
  actionText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { marginBottom: 16 },
  emptyHead: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontFamily: TEXT, fontSize: 13, lineHeight: 20.8, textAlign: 'center' },
  week: { borderTopWidth: 1 },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  weekName: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700' },
  weekCount: { flexDirection: 'row', alignItems: 'center', gap: 7, opacity: 0.75 },
  weekCountText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700' },
  turned: { transform: [{ rotate: '180deg' }] },
  entries: { paddingTop: 2, paddingBottom: 8 },
  entry: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6 },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDay: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  entryRpe: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  swap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 7 },
  swapText: { fontFamily: TEXT, fontSize: 11, fontWeight: '600' },
  jog: { fontFamily: TEXT, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  notes: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  estimator: { borderRadius: 16, paddingHorizontal: 16, marginTop: 4 },
  estimatorHead: { paddingVertical: 14 },
  estimatorBody: { paddingBottom: 14 },
  estimatorSay: { fontFamily: TEXT, fontSize: 12, lineHeight: 19.2, marginBottom: 10 },
  lifts: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  lift: { flex: 1, padding: 9, alignItems: 'center' },
  liftText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  inputs: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700' },
  input: { fontFamily: TEXT, fontSize: 16, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 4 },
  result: { fontFamily: TEXT, fontSize: 13, minHeight: 20, lineHeight: 19.5 },
  resultBold: { fontWeight: '700' },
});
