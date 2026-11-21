// Hurt? and Traveling? in the Expo app (MIGRATION.md phase 3, row 5, its third session), drawn as today's draws them
// (frontends/app/src/app/screens/change-sheet/change-sheet.ts over week-view.css .ov- and look.css, in the
// .rand-overlay frame): one sheet for each, never a tab between them. Hurt? asks where the problem is and how bad,
// says what changes, and takes a From. Traveling? takes From and Through and what there is to train with, and says
// what the trip does. Every word is change-sheet-model.ts's, today's own file; the draft and its dates are
// overlay-readers.ts's; Apply change is overlay-writes.ts's, to this app's own store.
//
// The sizes, weights, gaps and colours are today's computed styles, as the rest day sheet holds them
// (rest-sheet/RestSheet.tsx has the measure of each line). A date box opens the app's own calendar (date-box/).
//
// A tap that closes the sheet runs in today's order: the program in hand, the sheet away, This Week drawn, the toast.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RefreshReport } from '@ia/core/engine/state-refresh.ts';

import type { DateAsk } from '../date-box/date-box';
import { type Leave, SheetFrame } from '../program-list/SheetFrame';
import { DISPLAY, type Palette, TEXT } from '../theme';
import type { ChoiceCard, DateField, Effect, OverlayDraft, SheetAction } from './change-sheet-model';
import { setDraft, sheetView } from './overlay-readers';
import { type OverlaySession, type OverlayTap, applyInjuryDraft, applyOverlayDraft } from './overlay-writes';

/** The words the Angular sheet writes itself (change-sheet.ts). */
export const SHEET_WORDS = { gear: 'What you’ll have', where: 'Where’s the problem', howBad: 'How bad is it', apply: 'Apply change', gotIt: 'Got it' } as const;

export function ChangeSheet({ palette: p, session, draft: opened, calm, say, report, onDraft, onDate, onClose, onDone }: {
  palette: Palette;
  /** The store and the program in hand. */
  session: OverlaySession;
  /** The draft as the tap that opened the sheet left it (overlay-readers.ts openTravel, openInjury). */
  draft: OverlayDraft;
  calm: boolean;
  say: (text: string) => void;
  /** What a rebuild is told when a part of it fails. */
  report: RefreshReport;
  /** The draft after each choice: the app keeps it for its life, as the page keeps its own. */
  onDraft: (d: OverlayDraft) => void;
  /** A date box tapped: the app's calendar over the sheet. */
  onDate: (ask: DateAsk) => void;
  onClose: () => void;
  /** Apply change stored the change: the program in hand, before This Week is drawn again. */
  onDone: (tap: OverlayTap) => void;
}) {
  const s = styles;
  const [draft, setDraftState] = useState(opened);
  const now = useRef(draft);
  const hold = (d: OverlayDraft): void => { now.current = d; setDraftState(d); onDraft(d); };
  const view = sheetView(draft, session.prog, new Date());

  const act = (a: SheetAction, leave: Leave): void => {
    if (a === 'close') { leave(); return; }
    const r = a === 'travel' ? applyOverlayDraft(session, now.current, Date.now(), report) : applyInjuryDraft(session, now.current, Date.now(), report);
    if (!r.closed) { if (r.toast) say(r.toast); return; }
    leave(() => { onDone(r); if (r.toast) say(r.toast); });
  };

  const card = (c: ChoiceCard) => (
    <Pressable key={c.key + c.id} testID={'change-' + c.key + '-' + c.id} accessibilityRole="button" accessibilityState={{ selected: c.sel }} onPress={() => hold(setDraft(now.current, c.key, c.id, new Date()))}
      style={[s.eq, { borderColor: c.sel ? p.accent : p.border2 }, c.sel && { backgroundColor: p.surface }]}>
      <View style={s.eqBody}>
        <Text style={[s.eqName, c.sel ? { color: p.text, fontWeight: '700' } : { color: p.muted }]}>{c.name}</Text>
        {c.desc !== null && <Text style={[s.eqDesc, { color: p.muted }]}>{c.desc}</Text>}
      </View>
      {c.sel && <Text style={[s.eqChk, { color: p.text }]}>✓</Text>}
    </Pressable>
  );
  const effect = (e: Effect) => (
    <View testID="change-effect" style={[s.effect, { borderTopColor: p.border }]}>
      {e.title !== null && <Text style={[s.effectTtl, { color: p.text }]}>{e.title}</Text>}
      {/* A line with no words is the page's empty div: no height of its own. */}
      {e.subs.map((x, i) => (x.text === '' ? null : <Text key={i} style={[s.effectSub, { color: p.muted }, x.style !== null && x.style.includes('margin-top:6px') && s.subGap]}>{x.text}</Text>))}
    </View>
  );
  const dates = (fields: DateField[], gap: boolean) => (
    <View style={[s.dates, gap && s.datesGap]}>
      {fields.map((f) => (
        <Pressable key={f.key} testID={'change-date-' + f.key} accessibilityRole="button" accessibilityLabel={f.label + ', ' + f.shown}
          onPress={() => onDate({ value: f.value, min: f.min, onChange: (iso) => hold(setDraft(now.current, f.key, iso, new Date())) })}
          style={[s.date, { backgroundColor: p.surface, borderColor: p.border2 }]}>
          <Text style={[s.dateLbl, { color: p.muted }]}>{f.label}</Text>
          <Text style={[s.dateVal, { color: p.text }]}>{f.shown}</Text>
        </Pressable>
      ))}
    </View>
  );
  const foot = (a: SheetAction, leave: Leave) => (
    <Pressable testID={'change-' + (a === 'close' ? 'got-it' : 'apply')} accessibilityRole="button" onPress={() => act(a, leave)} style={({ pressed }) => [s.apply, { backgroundColor: p.accent }, pressed && s.pressed]}>
      <Text style={[s.applyText, { color: p.onInk }]}>{a === 'close' ? SHEET_WORDS.gotIt : SHEET_WORDS.apply}</Text>
    </Pressable>
  );
  const label = (text: string, gap = false) => <Text style={[s.label, gap && s.labelGap, { color: p.muted }]}>{text}</Text>;

  return (
    <SheetFrame id="change-sheet" palette={p} calm={calm} onClose={onClose}>
      {(leave) => (
        <View testID={view.injury ? 'change-injury' : 'change-travel'} style={s.body}>
          <Text testID="change-kicker" style={[s.kicker, { color: p.muted }]}>{view.kicker}</Text>
          <Text testID="change-title" accessibilityRole="header" style={[s.title, { color: p.text }]}>{view.title}</Text>
          <Text style={[s.intro, { color: p.muted }]}>{view.intro}</Text>
          {view.travel && (
            <>
              {view.travel.dates && dates(view.travel.dates, false)}
              {label(SHEET_WORDS.gear)}
              {view.travel.cards.map(card)}
              {effect(view.travel.effect)}
              {foot(view.travel.action, leave)}
            </>
          )}
          {view.injury && (
            <>
              {label(SHEET_WORDS.where)}
              {view.injury.regions.map(card)}
              {view.injury.tiers && label(SHEET_WORDS.howBad, true)}
              {view.injury.tiers && view.injury.tiers.map(card)}
              {view.injury.effect && effect(view.injury.effect)}
              {view.injury.dates && dates(view.injury.dates, true)}
              {view.injury.action && foot(view.injury.action, leave)}
            </>
          )}
        </View>
      )}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  // The frame's column with 16 between its pieces (.rand-body), on top of each piece's own margins.
  body: { gap: 16 },
  kicker: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  title: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', letterSpacing: -0.24, lineHeight: 26, marginTop: 4, marginBottom: -1.4 },
  intro: { fontFamily: TEXT, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 18 },
  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5, marginBottom: 7 },
  labelGap: { marginTop: 12 },
  dates: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  datesGap: { marginTop: 12 },
  date: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 },
  dateLbl: { fontFamily: DISPLAY, fontSize: 12, paddingBottom: 1.7, marginBottom: 4.7 },
  dateVal: { fontFamily: TEXT, fontSize: 15, fontWeight: '500', paddingBottom: 2.1 },
  eq: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 6 },
  eqBody: { flex: 1 },
  eqName: { fontFamily: TEXT, fontSize: 14, fontWeight: '500', paddingBottom: 2.3 },
  // WebKit lays the line at 16; a tier's line runs to two, so the height is set and not left under one line.
  eqDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 2 },
  eqChk: { fontFamily: TEXT, fontSize: 15, paddingBottom: 2.1 },
  // Measured beside today's own sheet in the simulator's Safari: the effect stood 0.6 low, and each later line 0.3 more.
  effect: { borderTopWidth: 1, paddingTop: 14, marginTop: 11.4, marginBottom: 16 },
  effectTtl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5, marginBottom: 2.3 },
  effectSub: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  subGap: { marginTop: 5.7 },
  apply: { borderRadius: 999, padding: 15, alignItems: 'center' },
  applyText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', paddingBottom: 2.3 },
  pressed: { transform: [{ scale: 0.98 }] },
});
