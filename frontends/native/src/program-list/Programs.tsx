// The Programs tab in the Expo app (MIGRATION.md phase 3, row 5), drawn as today's draws it
// (frontends/app/src/app/screens/program-list/program-list.ts and program-detail.ts over screens.css and look.css):
// Your Programs; a card for each program that is not archived, the active one edged in signal: its name, its goal's
// badge, the rename pencil and the chevron, the three lines under them, and, open, its detail (Focus, Profile,
// Schedule, Starting 1RM, Run paces with the mile's pencil and where the mile comes from, Cardio with a pencil by
// each goal, Event target, the seed); then Set Active or Active ✓ and Archive, or the archive's question, or the
// delete's warning. Under the cards, Build New Program. Every word and number is today's: the view is
// list-screen.ts's, over today's own models.
//
// The taps are list-screen.ts's (what is kept between draws) and list-writes.ts's (the store). Set Active ends on
// This Week, as today's does. The goal's pencil and the mile's pencil hand their sheet up to the app, which draws it
// over the tab bar. Drawn and taking no press: the copy button by the seed (the clipboard is a native package this
// app does not carry yet) and Build New Program (the wizard, row 6).
import { type ReactNode, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { GoalSheet } from '../goal-sheet/GoalSheet';
import { MileSheet } from '../mile-sheet/MileSheet';
import { DISPLAY, type Palette, TEXT } from '../theme';
import {
  LIST_WORDS, type ListCard, type ListState, type Run, activeId, archiveQuestion, askArchive, askPurge, cancelConfirm, endRename, listView, markupLines,
  openGoal, openMile, purgeWarning, refreshReport, startRename, toggleCard,
} from './list-screen';
import { type Outcome, archiveProgram, deleteProgram, renameProgram, setActive } from './list-writes';
import type { DetailChip, DetailRow } from './program-detail-model';
import { EMPTY_HTML } from './program-list-model';

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}

/** A line the page writes as markup: its icons inline at `size`, its words, the bold ones in `bold`. */
function Line({ runs, size, style, bold, color }: { runs: Run[]; size: number; style: object; bold?: object; color: string }) {
  return (
    <View style={styles.line}>
      {runs.map((r, i) => (r.icon
        ? <SvgXml key={i} xml={r.icon.replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />
        : <Text key={i} style={[style, r.bold && bold]}>{r.text}</Text>))}
    </View>
  );
}

/** A goal badge's colour (screens.css .badge-*): the lift's, the hip's, the run's, the bike's, the ink; any other goal has none. */
function badgeColor(goal: string, p: Palette): string | null {
  return ({ strength: p.lift, hypertrophy: p.hip, fatloss: p.run, athletic: p.bike, balanced: p.accent } as Record<string, string>)[goal] || null;
}

export function Programs({ palette: p, store, state: st, calm, say, onSwitch, onGone, onCover }: {
  palette: Palette; store: StateStore;
  /** What the page keeps between draws; the app holds it, so an open card outlives a visit. */
  state: ListState;
  calm: boolean;
  say: (text: string) => void;
  /** Set Active switched the program: the app shows This Week. */
  onSwitch: () => void;
  /** A program was archived or deleted: Progress lets go of it. */
  onGone: (id: string) => void;
  /** A sheet to draw over the whole screen and the tab bar, or none. */
  onCover: (sheet: ReactNode) => void;
}) {
  const insets = useSafeAreaInsets();
  const [drawn, setDrawn] = useState(() => ({ view: listView(store, st, new Date()), n: 0 }));
  const redraw = (): void => setDrawn((d) => ({ view: listView(store, st, new Date()), n: d.n + 1 }));
  // The rename box's words as typed: the page reads its input at Save.
  const typed = useRef('');
  const report = refreshReport(say);
  /** A sheet's outcome (a goal switched, a mile saved): the list draws again, then the toast, as today's order. */
  const done = (o: Outcome): void => { redraw(); if (o.toast) say(o.toast); };
  const on = {
    toggle: (id: string): void => { toggleCard(st, id); redraw(); },
    pencil: (c: ListCard): void => { typed.current = c.nameValue; startRename(st, c.id); redraw(); },
    save: (id: string): void => { const toast = renameProgram(store, id, typed.current); endRename(st); redraw(); if (toast) say(toast); },
    cancelRename: (): void => { endRename(st); redraw(); },
    askArchive: (id: string): void => { askArchive(st, id); redraw(); },
    askPurge: (id: string): void => { askPurge(st, id); redraw(); },
    cancel: (): void => { cancelConfirm(st); redraw(); },
    setActive: (id: string): void => { const o = setActive(store, id, Date.now(), report); redraw(); if (o.toast) say(o.toast); if (o.switched) onSwitch(); },
    archive: (id: string): void => { const o = archiveProgram(store, id, activeId(store), Date.now(), report); cancelConfirm(st); onGone(id); redraw(); if (o && o.toast) say(o.toast); },
    purge: (id: string): void => { const o = deleteProgram(store, id, activeId(store), Date.now(), report); cancelConfirm(st); onGone(id); redraw(); if (o.toast) say(o.toast); },
    goal: (id: string, sport: string): void => {
      const draft = openGoal(store, id, sport);
      if (draft) onCover(<GoalSheet palette={p} store={store} draft={draft} calm={calm} report={report} onClose={() => onCover(null)} onDone={done} />);
    },
    mile: (id: string): void => {
      const open = openMile(store, id, new Date());
      if (open) onCover(<MileSheet palette={p} store={store} open={open} calm={calm} report={report} say={say} onClose={() => onCover(null)} onDone={done} />);
    },
  };
  const v = drawn.view;
  const s = styles;
  const btn = (id: string, label: string, kind: 'primary' | 'danger' | 'plain', onPress: () => void, extra?: object) => (
    <Pressable testID={id} accessibilityRole="button" onPress={onPress}
      style={[s.action, kind === 'primary' ? { backgroundColor: p.accent, borderColor: p.accent } : { borderColor: kind === 'danger' ? 'rgba(255,69,58,0.35)' : p.border2 }, extra]}>
      <Text style={[s.actionText, { color: kind === 'primary' ? p.onInk : kind === 'danger' ? p.red : p.muted }]}>{label}</Text>
    </Pressable>
  );
  const rows = (label: string, list: DetailRow[]) => (
    <View style={s.group}>
      <Text style={[s.groupLabel, { color: p.signal }]}>{label}</Text>
      {list.map((r) => <View key={r.k} testID="detail-row" style={s.row}><Text style={[s.rowK, { color: p.muted }]}>{r.k}</Text><Text style={[s.rowV, { color: p.text }]}>{r.v}</Text></View>)}
    </View>
  );
  const chip = (c: DetailChip, i: number, third: boolean) => (
    <View key={i} testID="detail-chip" style={[s.chip, third ? s.chipThird : s.chipGrow, { backgroundColor: p.surface2, borderColor: p.border }]}>
      <Text style={[s.chipK, { color: p.muted }]}>{c.k}</Text>
      <Text style={[s.chipV, { color: p.text }]}>{c.v}</Text>
      <Text style={[s.chipU, { color: p.muted }]}>{c.u}</Text>
    </View>
  );
  const pencil = (id: string, label: string, size: number, onPress: () => void) => (
    <Pressable testID={id} accessibilityRole="button" accessibilityLabel={label} hitSlop={10} onPress={onPress} style={s.pencil}><Icon name="pencil" size={size} color={p.muted} /></Pressable>
  );
  const detail = (c: ListCard) => {
    const d = c.detail;
    return (
      <View testID={'detail-' + c.id} style={[s.detail, { borderTopColor: p.border }]}>
        {rows('Focus', d.focus)}
        {rows('Profile', d.profile)}
        {rows('Schedule', d.schedule)}
        <View style={s.group}>
          <Text style={[s.groupLabel, { color: p.signal }]}>{'Starting 1RM'}{d.estimated && <Text style={[s.est, { color: p.muted }]}>{' (est.)'}</Text>}</Text>
          <View style={s.chips}>{d.lifts.map((x, i) => chip(x, i, false))}</View>
        </View>
        {d.paces && (
          <View style={s.group}>
            <View style={s.labelRow}>
              <Text style={[s.groupLabel, s.flat, { color: p.signal }]}>Run paces</Text>
              {pencil('mile-pencil-' + c.id, 'Change mile time', 14, () => on.mile(c.id))}
            </View>
            <View style={[s.chips, s.wrap]}>{d.paces.chips.map((x, i) => chip(x, i, true))}</View>
            <Text testID="pace-source" style={[s.source, { color: p.muted }]}>
              {markupLines(d.paces.sentence).flat().map((r, i) => <Text key={i} style={r.bold && { color: p.text, fontWeight: '600' }}>{r.text}</Text>)}
            </Text>
          </View>
        )}
        <View style={s.group}>
          <Text style={[s.groupLabel, { color: p.signal }]}>Cardio</Text>
          {d.cardio ? d.cardio.map((x) => (
            <View key={x.type} testID="detail-row" style={s.row}>
              <Text style={[s.rowK, { color: p.muted }]}>{x.label}</Text>
              <View style={s.goal}>
                <Text style={[s.rowV, { color: p.text }]}>{x.goal}</Text>
                {pencil('goal-pencil-' + c.id + '-' + x.type, 'Change ' + x.label + ' goal', 14, () => on.goal(c.id, x.type))}
              </View>
            </View>
          )) : <View testID="detail-row" style={s.row}><Text style={[s.rowK, { color: p.muted }]}>Cardio</Text><Text style={[s.rowV, { color: p.text }]}>Lift only</Text></View>}
        </View>
        {d.event && rows('Event target', d.event)}
        <View style={s.foot}>
          <Text testID="detail-seed" style={[s.seed, { color: p.muted }]}>{d.seed}</Text>
          {/* Copy selections is not built yet: the button is drawn and takes no press. */}
          <View accessibilityLabel="Copy program selections for troubleshooting" style={[s.copy, { backgroundColor: p.surface, borderColor: p.border2 }]}><Icon name="copy" size={15} color={p.muted} /></View>
        </View>
      </View>
    );
  };
  const head = (c: ListCard) => (
    <>
      <View style={s.cardHead}>
        <Text testID="card-name" style={[s.name, { color: p.text }]}>{markupLines(c.name).flat().map((r) => r.text).join('')}</Text>
        <View style={s.headRight}>
          <View style={[s.badge, badgeColor(c.goal, p) ? { backgroundColor: badgeColor(c.goal, p)! + '26' } : null]}><Text style={[s.badgeText, { color: badgeColor(c.goal, p) || p.text }]}>{c.goalLabel}</Text></View>
          {pencil('rename-' + c.id, 'Rename program', 16, () => on.pencil(c))}
          <View style={/ open$/.test(c.cardClass) ? s.turned : null}><Icon name="chevronDown" size={18} color={p.muted} /></View>
        </View>
      </View>
      {markupLines(c.metaHtml).map((runs, i) => <Line key={i} runs={runs} size={13} style={[s.meta, { color: p.muted }]} color={p.muted} />)}
    </>
  );
  return (
    <View testID="programs" style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={[s.top, { paddingTop: insets.top, borderBottomColor: p.border }]}>
        <Text style={[s.app, { color: p.muted }]}>The Asylum</Text>
        <Text accessibilityRole="header" style={[s.screen, { color: p.text }]}>{LIST_WORDS.title}</Text>
      </View>
      {/* One body through every draw: the list keeps its place when a tap low on an open card draws it again. */}
      <ScrollView testID="programs-body" contentContainerStyle={[s.body, { paddingBottom: 140 + insets.bottom }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {v.empty && <Text testID="programs-empty" style={[s.empty, { color: p.muted }]}>{EMPTY_HTML[v.empty].replace('<br>', '\n')}</Text>}
        {v.cards.map((c) => (
          <View key={c.id} testID={'card-' + c.id} style={[s.card, { backgroundColor: p.surface, borderColor: c.isActive ? p.signal : 'transparent' }]}>
            {c.editing ? (
              <>
                <View style={s.cardHead}>
                  <TextInput testID={'rename-input-' + c.id} defaultValue={c.nameValue} onChangeText={(t) => { typed.current = t; }} maxLength={40} autoFocus selectTextOnFocus returnKeyType="done"
                    onSubmitEditing={() => on.save(c.id)} style={[s.renameInput, { backgroundColor: p.surface, borderColor: p.border2, color: p.text }]} />
                  <View style={s.renameBtns}>
                    {btn('rename-save-' + c.id, LIST_WORDS.save, 'primary', () => on.save(c.id), s.renameSave)}
                    <Pressable testID={'rename-cancel-' + c.id} accessibilityRole="button" accessibilityLabel="Cancel" onPress={on.cancelRename} style={[s.action, s.renameX, { borderColor: p.border2 }]}><Icon name="x" size={15} color={p.muted} /></Pressable>
                  </View>
                </View>
                {markupLines(c.metaHtml).map((runs, i) => <Line key={i} runs={runs} size={13} style={[s.meta, { color: p.muted }]} color={p.muted} />)}
              </>
            ) : (
              <>
                <Pressable testID={'card-tap-' + c.id} accessibilityRole="button" accessibilityState={{ expanded: / open$/.test(c.cardClass) }} onPress={() => on.toggle(c.id)}>{head(c)}</Pressable>
                {/ open$/.test(c.cardClass) && detail(c)}
              </>
            )}
            {c.confirm === 1 ? (
              <View testID="archive-confirm" style={s.confirm}>
                <Text style={[s.confirmText, { color: p.text }]}>{archiveQuestion(c.name)}<Text style={[s.confirmNote, { color: p.muted }]}>{'\n' + LIST_WORDS.archiveNote}</Text></Text>
                <View style={s.actions}>
                  {btn('archive-' + c.id, LIST_WORDS.archive, 'primary', () => on.archive(c.id))}
                  {btn('confirm-cancel', LIST_WORDS.cancel, 'plain', on.cancel)}
                </View>
                <Text testID={'purge-link-' + c.id} accessibilityRole="button" onPress={() => on.askPurge(c.id)} style={[s.purgeLink, { color: p.muted }]}>{LIST_WORDS.purgeLink}</Text>
              </View>
            ) : c.confirm === 2 ? (
              <View testID="purge-confirm" style={s.confirm}>
                <Text style={[s.confirmText, { color: p.red }]}>{purgeWarning(c.name)}</Text>
                <View style={s.actions}>
                  {btn('purge-' + c.id, LIST_WORDS.purge, 'danger', () => on.purge(c.id))}
                  {btn('confirm-cancel', LIST_WORDS.cancel, 'plain', on.cancel)}
                </View>
              </View>
            ) : (
              <View style={[s.actions, s.actionsTop]}>
                {c.isActive
                  ? <View testID={'active-' + c.id} style={[s.action, s.isActive, { borderColor: p.border2 }]}><Text style={[s.actionText, { color: p.muted }]}>{LIST_WORDS.active}</Text></View>
                  : btn('set-active-' + c.id, LIST_WORDS.setActive, 'primary', () => on.setActive(c.id))}
                {btn('archive-ask-' + c.id, LIST_WORDS.archive, 'danger', () => on.askArchive(c.id))}
              </View>
            )}
          </View>
        ))}
        {/* The wizard is not built yet (row 6): the button is drawn and takes no press. */}
        <View testID="build-new" style={[s.build, { borderColor: p.border2 }]}><Text style={[s.buildText, { color: p.text }]}>{LIST_WORDS.build}</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  app: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '600' },
  screen: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '800', letterSpacing: -1.6, lineHeight: 42, marginTop: 2 },
  body: { paddingTop: 16, paddingHorizontal: 20, gap: 10 },
  empty: { fontFamily: TEXT, fontSize: 14, textAlign: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  card: { borderRadius: 16, borderWidth: 1, paddingVertical: 18, paddingHorizontal: 20 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', flexShrink: 1 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4 },
  badgeText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700' },
  pencil: { padding: 2 },
  turned: { transform: [{ rotate: '180deg' }] },
  line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  meta: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  actionsTop: { marginTop: 10 },
  action: { flex: 1, padding: 7, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  isActive: { opacity: 0.4 },
  confirm: { marginTop: 10, gap: 8 },
  confirmText: { fontFamily: TEXT, fontSize: 13, lineHeight: 19.5 },
  confirmNote: { fontSize: 12 },
  purgeLink: { fontFamily: TEXT, fontSize: 11, textDecorationLine: 'underline', paddingVertical: 2 },
  renameInput: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 4, fontFamily: TEXT, fontSize: 16, paddingVertical: 8, paddingHorizontal: 10 },
  renameBtns: { flexDirection: 'row', gap: 6, flexShrink: 0, marginLeft: 8 },
  renameSave: { flex: 0, paddingVertical: 8, paddingHorizontal: 12 },
  renameX: { flex: 0, paddingVertical: 8, paddingHorizontal: 10 },
  detail: { marginTop: 13, paddingTop: 13, borderTopWidth: 1 },
  group: { marginBottom: 12 },
  groupLabel: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700', marginBottom: 5 },
  flat: { marginBottom: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  est: { fontSize: 9, fontWeight: '400' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  rowK: { fontFamily: TEXT, fontSize: 13, lineHeight: 22.1 },
  rowV: { fontFamily: TEXT, fontSize: 13, lineHeight: 22.1, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  chips: { flexDirection: 'row', gap: 6 },
  wrap: { flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 4, alignItems: 'center' },
  chipGrow: { flex: 1 },
  chipThird: { flexGrow: 1, flexBasis: '30%' },
  chipK: { fontFamily: DISPLAY, fontSize: 9, fontWeight: '700' },
  chipV: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', lineHeight: 19.8 },
  chipU: { fontFamily: TEXT, fontSize: 9 },
  source: { fontFamily: TEXT, fontSize: 11, lineHeight: 16.5, marginTop: 6 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 },
  seed: { fontFamily: 'Menlo', fontSize: 11 },
  copy: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1 },
  build: { marginTop: 6, borderWidth: 1.5, borderRadius: 4, padding: 15, alignItems: 'center' },
  buildText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
});
