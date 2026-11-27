// Random Workout in the Expo app (MIGRATION.md phase 3, row 7), drawn as today's draws it
// (frontends/app/src/app/screens/random-workout over overlays-components.css, detail-sheet.css, session-sheet.css
// and look.css, in the .rand-overlay frame): Back, the two filters and the counter's reset in the header; the badge
// and the title, the cardio block, the workout's cards, its note, and Complete or the done block. Every word, number
// and order is today's: what the sheet shows is random-screen.ts over today's own model, held to the byte.
//
// It opens from This Week's Random Workout button, on a fresh draw. A filter draws again. The cards are the session
// sheet's own (../day-detail/SessionSheet.tsx SheetSections), and their taps the deck's own writes handed the
// Wildcard's working day: a swap, a minus and each put it back change that day alone and store nothing; a card's Log
// and its set draft go where today's go, under the week in hand and the day last opened. Complete stores the
// Wildcard's record, speaks its toast and leaves; the app draws This Week again and raises the pop-up 380 ms on.
// All of it goes to this app's own store (D289).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { type SheetHandlers, SheetSections } from '../day-detail/SessionSheet';
import type { Rx } from '../day-detail/session-sections-model';
import { parseRx } from '../deck/deck-readers';
import type { DayInHand, Fields } from '../deck/deck-screen';
import { type SwapOpen, swapSheetOn } from '../deck/deck-swaps';
import { type Session, act, leftField, swapMove, tapFill, tapLog, tapReuse, tapStep, undoSwap } from '../deck/deck-writes';
import { type MoveFields, openedSets, typeLoad, typeRep, typeSetLoad } from '../deck/set-fields';
import { type Leave, SheetFrame } from '../program-list/SheetFrame';
import { SwapSheet } from '../swap-sheet/SwapSheet';
import { DISPLAY, type Palette, TEXT } from '../theme';
import { type RandOpen, type RandProgram, type RandSheet, type RandState, RAND_WORDS, RESET_ASK_MS, goalOf, openRandom, wildFields, wildMoves, wildSections, wildSession } from './random-screen';
import { RAND_COLORS, RAND_FILTERS, type RandFilter } from './random-workout-model';
import { type Completed, completeWildcard, resetWildcards } from './random-writes';

/** A hex colour at an alpha. */
const tint = (hex: string, a: number): string => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
/** The colour a model names by the page's palette word (RAND_COLORS: lift, hip, run, bike, accent). */
const toneOf = (p: Palette, tone: string | undefined): string | null => {
  const hex = tone ? (p as unknown as Record<string, unknown>)[tone] : null;
  return typeof hex === 'string' && hex[0] === '#' ? hex : null;
};

/** Each section is a piece of the frame's column here (.rand-body's 16), where the session sheet stacks them 2 apart. */
const SECTION_GAP = 16;

/** What the reset keeps between its two taps (the Angular screen's resetPending), for the app's life as the screen's is. */
export interface ResetAsk { pending: boolean }

export function RandomWorkout({ palette: p, store, prog, week, hand, opened, state: st, reset, calm, say, onClose, onWrote, onComplete }: {
  palette: Palette; store: StateStore;
  /** The draw the button's tap made, and its cards (random-screen.ts openRandom). */
  opened: RandSheet;
  /** The program in hand (today's activeProg) and the week This Week holds as its own (currentWeek). */
  prog: RandProgram; week: number;
  /** What the last deck or sheet opened left behind: the day, the unit and the stale warning (deck-screen.ts). */
  hand: DayInHand;
  /** The filter and the last draw, and the reset's ask, each kept by the app for its life. */
  state: RandState; reset: ResetAsk;
  calm: boolean;
  say: (toast: string) => void;
  /** The sheet is gone, by Back or after Complete. */
  onClose: () => void;
  /** The counter's reset emptied the record: This Week's counter is read again. */
  onWrote: () => void;
  /** Complete stored the record, before the sheet slides away: the app draws This Week and raises the pop-up. */
  onComplete: (r: Completed) => void;
}) {
  const s = styles;
  const session: Session = wildSession(store, prog, hand, week);

  // ── What the sheet holds: the draw, its cards as drawn, each move's fields ──
  const [open, setOpen] = useState<RandOpen>(opened);
  const [sections, setSections] = useState(opened.sections);
  const [fields, setFields] = useState(() => wildFields(opened.sections));
  const fieldsNow = useRef(fields);
  const apply = (F: Fields): void => { fieldsNow.current = F; setFields(F); };
  const [setsOpen, setSetsOpen] = useState<Record<string, boolean>>({});
  const rxOf = useMemo(() => {
    const out: Record<string, Rx | null> = {};
    for (const x of wildMoves(sections)) out[x.exKey] = parseRx(x.rxDetail, x.name);
    return out;
  }, [sections]);
  /** The cards drawn again from the working day (the Angular drawSections): after a draw, a swap, a minus, an undo. */
  const drawn = (next: RandSheet['sections']): void => {
    setSections(next);
    apply(wildFields(next));
    setSetsOpen({});
  };
  const redraw = (): void => drawn(wildSections(store, prog, hand, week, open.wild, Date.now()));
  /** A filter's tap, as the Angular setFilter: the filter kept, then a fresh draw. */
  const filter = (f: RandFilter): void => {
    leave();
    st.filter = f;
    const o = openRandom(st, store, prog, hand, week, Math.random, Date.now());
    setOpen(o);
    drawn(o.sections);
  };

  // ── The two tap reset: the first asks again for three seconds, the second empties the record ──
  const [, setAsked] = useState(0);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const tapReset = (): void => {
    if (!reset.pending) {
      reset.pending = true;
      setAsked((n) => n + 1);
      // The page's timer is never taken back: it ends the ask three seconds on, whatever was tapped since.
      setTimeout(() => { reset.pending = false; if (alive.current) setAsked((n) => n + 1); }, RESET_ASK_MS);
      return;
    }
    reset.pending = false;
    const toast = resetWildcards(store, prog);
    setAsked((n) => n + 1);
    onWrote();
    say(toast);
  };

  // ── Set logging: the deck's own taps, under the week in hand and the day last opened ──
  const focused = useRef<string | null>(null);
  const save = (exKey: string): void => apply(leftField(session, fieldsNow.current, exKey, Date.now()));
  const leave = (): void => {
    const k = focused.current;
    focused.current = null;
    if (k) save(k);
    Keyboard.dismiss();
  };
  const typed = (exKey: string, next: (f: MoveFields) => MoveFields): void => {
    const f = fieldsNow.current[exKey];
    if (f) apply({ ...fieldsNow.current, [exKey]: next(f) });
  };
  const [swap, setSwap] = useState<SwapOpen | null>(null);
  const pick = (to: string): void => {
    if (!swap) return;
    const r = swapMove(session, swap.ctx, to, Date.now(), open.wild);
    if (!r) return;
    redraw();
    say(r.toast);
  };
  const h: SheetHandlers = {
    step: (exKey, k, step) => { leave(); apply(tapStep(session, fieldsNow.current, exKey, k, step, Date.now())); },
    rep: (exKey, k, text) => typed(exKey, (f) => typeRep(f, k, text)),
    setLoad: (exKey, k, text) => typed(exKey, (f) => typeSetLoad(f, k, text)),
    load: (exKey, text) => typed(exKey, (f) => typeLoad(f, text)),
    focus: (exKey) => { focused.current = exKey; },
    blur: (exKey) => { if (focused.current === exKey) { focused.current = null; save(exKey); } },
    reuse: (exKey, value) => { leave(); apply(tapReuse(session, fieldsNow.current, exKey, value, Date.now())); },
    fill: (exKey, value) => { leave(); apply(tapFill(session, fieldsNow.current, exKey, value, Date.now())); },
    log: (x) => {
      leave();
      const r = tapLog(session, fieldsNow.current, x, Date.now());
      apply(r.fields);
      if (r.toast) say(r.toast);
    },
    sets: (exKey) => {
      const opened = !setsOpen[exKey];
      const f = fieldsNow.current[exKey];
      if (opened && f) apply({ ...fieldsNow.current, [exKey]: openedSets(f) });
      setSetsOpen((m) => ({ ...m, [exKey]: opened }));
    },
    edit: (a, off) => {
      leave();
      const toast = act(session, a, off, open.wild);
      redraw();
      if (toast) say(toast);
    },
    swap: (secIdx, itemIdx) => {
      leave();
      const sheet = swapSheetOn(prog, open.wild, secIdx, itemIdx);
      if (sheet) setSwap(sheet); else say('Nothing to swap here');
    },
    unswap: (from) => {
      leave();
      const toast = undoSwap(session, from, open.wild);
      if (toast === null) return;
      redraw();
      say(toast);
    },
    // A Wildcard holds no added move: the add sheet is the session sheet's alone.
    remove: () => {},
  };

  const complete = (away: Leave): void => {
    leave();
    away(() => {
      const r = completeWildcard(store, prog, open.head.title, new Date());
      say(r.toast);
      onComplete(r);
    });
  };

  const v = open.head;
  const tone = toneOf(p, RAND_COLORS[goalOf(prog)]);
  const c = v.cardio;
  const kind = c ? c.blockCls.replace('-block', '') : '';
  const blockInk = kind === 'run' ? p.run : kind === 'bike' || kind === 'swim' ? p.bike : p.text;
  const labelInk = !c ? p.text : c.labelCls === 'cardio-label-run' ? p.run : c.labelCls === 'cardio-label-swim' ? p.swim : c.labelCls === 'cardio-label-bike' ? p.core : p.accent;

  const head = (
    <>
      <View testID="rand-filters" style={s.filters}>
        {RAND_FILTERS.map((f) => {
          const on = st.filter === f.id;
          return (
            <Pressable key={f.id} testID={'rand-filter-' + f.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => filter(f.id)}
              style={[s.filter, { borderColor: on ? p.lift : p.border2 }, on && { backgroundColor: p.lift }]}>
              <Text numberOfLines={1} style={[s.filterText, { color: on ? '#0a0a0a' : p.muted }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable testID="rand-reset" accessibilityRole="button" accessibilityLabel={RAND_WORDS.resetLabel} onPress={tapReset} style={[s.reset, { borderColor: p.border2 }]}>
        <Text style={[s.resetText, { color: reset.pending ? p.red : p.muted }]}>{reset.pending ? RAND_WORDS.again : RAND_WORDS.reset}</Text>
      </Pressable>
    </>
  );

  return (
    <>
      <SheetFrame id="rand-sheet" palette={p} calm={calm} onClose={onClose} head={head}>
        {(away) => (
          <View testID="rand-body" style={s.body}>
            <View style={s.top}>
              <Text testID="rand-badge" style={[s.badge, tone ? { color: tone, backgroundColor: tint(tone, 0.133) } : { color: p.text }]}>{v.done ? RAND_WORDS.badgeDone : RAND_WORDS.badge}</Text>
              <Text testID="rand-title" accessibilityRole="header" style={[s.title, { color: p.text }]}>{v.title}</Text>
            </View>
            {c && (
              <View testID="rand-cardio" style={[s.cardio, { backgroundColor: p.surface, borderColor: tint(blockInk.startsWith('#') ? blockInk : '#111111', 0.3) }]}>
                <Text style={[s.cardioLabel, { color: labelInk }]}>{c.type}</Text>
                <Text style={[s.cardioDetail, { color: p.text }]}>{c.detail}</Text>
              </View>
            )}
            <SheetSections sections={sections} p={p} fields={fields} setsOpen={setsOpen} rxOf={rxOf} unit={hand.unit} h={h} gap={SECTION_GAP} />
            {v.note !== null && <Text testID="rand-note" style={[s.note, { color: p.muted, backgroundColor: 'rgba(' + p.inkRgb + ',0.08)', borderColor: 'rgba(' + p.inkRgb + ',0.22)' }]}>{v.note}</Text>}
            {v.done ? (
              <View testID="rand-done" style={[s.done, { backgroundColor: tint(p.run, 0.12), borderColor: tint(p.run, 0.35) }]}>
                <Text style={[s.doneText, { color: p.run }]}>{RAND_WORDS.doneBlock}</Text>
              </View>
            ) : (
              <Pressable testID="rand-complete" accessibilityRole="button" onPress={() => complete(away)} style={({ pressed }) => [s.complete, { backgroundColor: p.run }, pressed && s.pressed]}>
                <SvgXml xml={asyIcon(RAND_WORDS.completeIcon, 14).replace(/ style="[^"]*"/, '')} color="#0a0a0a" width={14} height={14} />
                <Text style={s.completeText}>{RAND_WORDS.complete}</Text>
              </Pressable>
            )}
          </View>
        )}
      </SheetFrame>
      {swap && <SwapSheet palette={p} view={swap.view} calm={calm} onPick={pick} onClose={() => setSwap(null)} />}
    </>
  );
}

const styles = StyleSheet.create({
  // The header's bar beside Back (.rand-filter-bar: flex 1, 12 from Back on top of the header's own 14 gap, 8 between).
  filters: { flex: 1, flexDirection: 'row', gap: 8, marginLeft: 12 },
  filter: { flex: 1, borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  filterText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', paddingBottom: 1.7 },
  reset: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  // The page asks for 600, which WebKit draws with Helvetica Neue's Bold (tests/unit/native-look.test.ts).
  resetText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  // The frame's column with 16 between its pieces (.rand-body).
  body: { gap: 16 },
  // Measured beside today's own page in the simulator's Safari: the badge sits in a line 21 high, 1.7 under the
  // wrap's 4, and the title's line ends 1.7 lower than iOS's own, so the first piece under it starts where today's does.
  top: { alignItems: 'center', paddingTop: 4, paddingBottom: 17.7 },
  badge: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700', paddingTop: 3, paddingBottom: 4.7, paddingHorizontal: 10, borderRadius: 2, marginTop: 1.7, marginBottom: 8.7, overflow: 'hidden' },
  title: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  cardio: { borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 2 },
  // WebKit lays the label's line at 16.6: the block is 87 high over one line of words.
  cardioLabel: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', lineHeight: 16.6, marginBottom: 8 },
  cardioDetail: { fontFamily: TEXT, fontSize: 14, lineHeight: 14 * 1.6, marginBottom: 6 },
  note: { fontFamily: TEXT, fontSize: 12, fontStyle: 'italic', lineHeight: 12 * 1.6, borderWidth: 1, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginTop: 2, overflow: 'hidden' },
  done: { borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, marginTop: 12, alignItems: 'center' },
  // WebKit's lines: the done block is 45 high and Complete 49.
  doneText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', lineHeight: 19, textAlign: 'center' },
  complete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 999, padding: 14, marginTop: 12 },
  completeText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', lineHeight: 21, color: '#0a0a0a' },
  pressed: { opacity: 0.85 },
});
