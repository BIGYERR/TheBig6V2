// The session sheet in the Expo app (MIGRATION.md phase 3, the session sheet's first session), drawn as today's draws
// it (frontends/app/src/app/screens/day-detail over detail-sheet.css, session-sheet.css and look.css): the day's
// header on its band (Back, the logged count, the RPE reference, the week and day, the title, the tags), then the
// body in today's order (a double day's jog, the Wildcard tag, the range nudge, the cardio card, the sections with
// every exercise card and its set rows, the test week's 1RM card after the first section, the day's note, the log
// with its effort slider and notes, the never marked nudge), then Done and Skip at the foot, each undoing itself.
// Every word, number and order is today's: what the sheet shows is sheet-screen.ts, today's own models held to the
// byte.
//
// It is reached as today's is: Reopen on a done lift's card, and Start where the day opens no deck (This Week).
// The cards' taps are the deck's own (../deck/deck-writes.ts), since today's page runs one handler for both screens;
// the slider, the notes, Done and Skip are sheet-writes.ts, and so are the add sheet's pick, an added move's remove
// and the 1RM card's save (the sheet's second session). A skip, a swap, an add, a remove and each undo draw the
// whole sheet again, as today's openDetail does, which starts the log's form afresh. All of it goes to this app's
// own store (D289).
//
// Not drawn yet, each waiting for its own session: in the log the run's fields, its wheels, its Log and its sport
// picker, which come with the cardio sheet; the run's workout is drawn as words. The jog's Edit cardio opens the rest
// day sheet on Log cardio (rest-sheet/RestSheet.tsx), and the sheet is drawn again once it wrote. The 1RM card's reps are five buttons where today's is a list of five.
//
// The motion is this app's own, built once (MIGRATION.md section 6, decision 14): the sheet slides up and away as
// the swap sheet does.
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';
import { dayStatus } from '@ia/core/engine/state-day-status.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { AddSheet } from '../add-sheet/AddSheet';
import type { AddSheetView } from '../add-sheet/add-sheet-model';
import type { CardAct } from '../deck/deck-model';
import { parseRx } from '../deck/deck-readers';
import type { DayInHand, DeckProgram, Fields } from '../deck/deck-screen';
import type { RestAsk, RestProgram } from '../rest-sheet/rest-sheet-model';
import { type SwapOpen, swapSheetOf } from '../deck/deck-swaps';
import { type Session, acceptNudge, act, dismissNudge, leftField, nudgeWords, swapMove, tapFill, tapLog, tapReuse, tapStep, undoSwap } from '../deck/deck-writes';
import { type FieldsView, type MoveFields, fieldsView, openedSets, typeLoad, typeRep, typeSetLoad } from '../deck/set-fields';
import { SwapNudge } from '../swap-nudge/SwapNudge';
import { SwapSheet } from '../swap-sheet/SwapSheet';
import { DISPLAY, type Palette, TEXT } from '../theme';
import { WildcardMark } from '../this-week/marks';
import { PLAN_CHANGE_FAILED } from '../this-week/week-screen';
import type { CardioCardView } from './cardio-card-model';
import { type CardioLog, cardioLogOf, logCardio, setNode, stepReps, swapSport, togglePicker } from './cardio-log';
import { CardioLogBlock, type CardioTaps } from './CardioLogBlock';
import type { E1rmCard, FootButton } from './day-detail-model';
import type { ExCard, ExView, Rx, SectionView } from './session-sections-model';
import { addSheetOf } from './sheet-adds';
import { RPE_LABELS } from './sheet-readers';
import { RPE_INFO, type SheetOpen, type SheetProgram, type SheetView, drawnBlocks, footOf, logOf, sheetDay, sheetFields, sheetFrame, sheetMoves, sheetView, tokenOf } from './sheet-screen';
import { type LogForm, type MaxSaved, addMove, cardioLive, e1rmEstimate, formOf, moveRpe, persistLog, removeAdded, saveTestMax, tapStatus, typeNotes } from './sheet-writes';
import type { WheelFlushers } from './Wheel';

/** motion.css: the overlay's slide, cubic-bezier(.32,.72,0,1), 400 ms in and 360 ms out. */
const SLIDE = Easing.bezier(0.32, 0.72, 0, 1);
const SLIDE_IN = 400;
const SLIDE_OUT = 360;

/** The add button's plus, as today's header draws it (day-detail.ts). */
const PLUS = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
/** Type on the header band: white at an alpha (rgba(var(--on-band-rgb), a)). */
const on = (a: number): string => 'rgba(255,255,255,' + a + ')';
/** Markup the engine's words may carry, as plain words: a break is a new line, every other tag is dropped. */
const plain = (s: string): string => String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
/** A hex colour at an alpha. */
const tint = (hex: string, a: number): string => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
/** A colour the models name by the page's token, from the palette. */
function tokenColor(p: Palette, css: string, fallback: string): string {
  const t = tokenOf(css);
  const hex = t ? (p as unknown as Record<string, unknown>)[t.name] : null;
  if (!t || typeof hex !== 'string' || hex[0] !== '#') return fallback;
  return t.alpha === 1 ? hex : tint(hex, t.alpha);
}

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}

/** What a move's controls call, by the move's key (the deck's set, with a round's minus and its undo). */
export interface SheetHandlers {
  step: (exKey: string, s: number, step: number) => void;
  rep: (exKey: string, s: number, text: string) => void;
  setLoad: (exKey: string, s: number, text: string) => void;
  load: (exKey: string, text: string) => void;
  focus: (exKey: string) => void;
  blur: (exKey: string) => void;
  reuse: (exKey: string, value: number) => void;
  fill: (exKey: string, value: number) => void;
  log: (x: ExCard) => void;
  sets: (exKey: string) => void;
  edit: (a: CardAct, off: boolean) => void;
  swap: (secIdx: number, itemIdx: number) => void;
  unswap: (from: string) => void;
  remove: (name: string) => void;
}

export function SessionSheet({ palette: p, store, open, inHand, calm, onClose, onDone, onProgram, onOver, onRest, onLogged, onGoing, say }: {
  palette: Palette; store: StateStore; open: SheetOpen; calm: boolean;
  /** What a day's open leaves behind for the app's life: each draw of the sheet sets it, as today's open() does. */
  inHand: DayInHand;
  /** The sheet is gone, by Back or after a Skip. */
  onClose: () => void;
  /** Done: the day is stored and the sheet has slid away; the app raises the completion pop-up over This Week. */
  onDone: (prog: DeckProgram, week: number, dayKey: string) => void;
  /** Make the change: the program rebuilt around the preference, for This Week to hold in place of the one it has. */
  onProgram: (prog: DeckProgram) => void;
  /** A card the app draws over the toast: the coach's nudge, or none. */
  onOver: (card: React.ReactNode) => void;
  /** Edit cardio on a day that holds a session and a jog: the rest day sheet on Log cardio, and what to draw again once it wrote. */
  onRest: (ask: RestAsk, wrote: () => void) => void;
  /** The cardio card's Log was tapped: the app judges the coach's mile nudge on this card (D274). */
  onLogged: (week: number, dayKey: string) => void;
  /** The sheet has begun to slide away: This Week shows again from here, as today's does once the sheet loses its open mark. */
  onGoing: () => void;
  say: (toast: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const s = styles;
  /** The program in hand: the one the sheet opened on, or the one Make the change handed back. */
  const [prog, setProg] = useState<SheetProgram>(open.prog);
  const session: Session = { store, prog, week: open.week, dayKey: open.dayKey };
  const unit = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';

  // ── What the sheet holds: the day as drawn, each move's fields, the log's form ──
  const [view, setView] = useState(open.view);
  const [fields, setFields] = useState(() => sheetFields(open.view));
  const fieldsNow = useRef(fields);
  const apply = (F: Fields): void => { fieldsNow.current = F; setFields(F); };
  const [form, setForm] = useState<LogForm>(() => formOf(logOf(open.view)));
  const formNow = useRef(form);
  const hold = (f: LogForm): void => { formNow.current = f; setForm(f); };
  /** The log's cardio card: its fields, the dose they were drawn with, the picker and the note (cardio-log.ts). */
  const cardioOf = (v: SheetView, g: SheetProgram): CardioLog => { const day = sheetDay(g, v.week, v.dayKey); return cardioLogOf(logOf(v), day && day.cardio, v.dose); };
  const [cardio, setCardio] = useState<CardioLog>(() => cardioOf(open.view, open.prog));
  const cardioNow = useRef(cardio);
  const holdCardio = (c: CardioLog): void => { cardioNow.current = c; setCardio(c); };
  /** Counts the cardio fields' draws, so each draw starts its wheels afresh (the page's iaWheelInit). */
  const [drawn, setDrawn] = useState(0);
  /** The wheels still settling: each rests at once before a tap reads the form (the page's iaWheelFlush). */
  const flushers = useRef<WheelFlushers>({ list: [] }).current;
  const flush = (): void => { flushers.list.forEach((f) => f()); };
  const [setsOpen, setSetsOpen] = useState<Record<string, boolean>>({});
  const [info, setInfo] = useState(false);
  const rxOf = useMemo(() => {
    const out: Record<string, Rx | null> = {};
    for (const x of sheetMoves(view)) out[x.exKey] = parseRx(x.rxDetail, x.name);
    return out;
  }, [view]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // ── The slide ──
  const y = useRef(new Animated.Value(calm ? 0 : 1)).current;
  const leaving = useRef(false);
  useEffect(() => {
    if (!calm) Animated.timing(y, { toValue: 0, duration: SLIDE_IN, easing: SLIDE, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** The sheet slides away once, then `then` runs. A second tap while it leaves does nothing. */
  const away = (then: () => void): void => {
    if (leaving.current) return;
    leaving.current = true;
    Keyboard.dismiss();
    onGoing();
    if (calm) { then(); return; }
    Animated.timing(y, { toValue: 1, duration: SLIDE_OUT, easing: SLIDE, useNativeDriver: true }).start(() => then());
  };

  // ── Set logging: the deck's own taps (set-logging.ts through set-fields.ts and deck-writes.ts) ──
  /** The move whose field holds the keyboard. Leaving a field saves what the move's cells hold (the page's blur). */
  const focused = useRef<string | null>(null);
  const save = (exKey: string): void => apply(leftField(session, fieldsNow.current, exKey, Date.now()));
  /** A press on a control takes the keyboard off its field first, as a tap on the page does, so its cells are saved first. */
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
  /** The whole sheet drawn again after an edit, as the page's openDetail draws it: every field and the log's form afresh. */
  const redraw = (g: SheetProgram = prog): void => {
    const next = sheetView(store, g, open.week, open.dayKey, Date.now(), inHand);
    if (!next) return;
    setView(next);
    apply(sheetFields(next));
    hold(formOf(logOf(next)));
    holdCardio(cardioOf(next, g));
    setDrawn((n) => n + 1);
    setSetsOpen({});
  };

  // ── Swap and put it back, and the coach's nudge (the deck's, over this sheet) ──
  const [swap, setSwap] = useState<SwapOpen | null>(null);
  const [nudge, setNudge] = useState<{ from: string; to: string } | null>(null);
  const pick = (to: string): void => {
    if (!swap) return;
    const from = swap.ctx.name;
    const r = swapMove(session, swap.ctx, to, Date.now());
    if (!r) return;
    redraw();
    say(r.toast);
    if (r.nudge) timers.current.push(setTimeout(() => setNudge({ from, to }), 1400));
  };
  const leavePlan = (): void => {
    if (nudge) dismissNudge(session, nudge.from);
    setNudge(null);
  };
  const changePlan = (): void => {
    if (!nudge) return;
    const r = acceptNudge(session, nudge.from, nudge.to, Date.now(), {
      overlay: (ov, e) => { console.error('overlay apply failed', ov && ov.id, e); say(PLAN_CHANGE_FAILED); },
      freeze: (e) => { console.error('week freeze failed; showing fully rebuilt weeks', e); },
      rebuild: (e) => { console.error('refreshProgram failed; using stored program', e); },
    });
    setNudge(null);
    if (r.prog) {
      setProg(r.prog);
      onProgram(r.prog);
      redraw(r.prog);
    }
    say(r.toast);
  };
  useEffect(() => {
    onOver(nudge ? <SwapNudge palette={p} text={nudgeWords(nudge.from, nudge.to)} calm={calm} onYes={changePlan} onNo={leavePlan} /> : null);
    return () => onOver(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudge]);

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
      const toast = act(session, a, off);
      redraw();
      if (toast) say(toast);
    },
    swap: (secIdx, itemIdx) => {
      leave();
      const sheet = swapSheetOf(prog, open.week, open.dayKey, secIdx, itemIdx);
      if (sheet) setSwap(sheet); else say('Nothing to swap here');
    },
    unswap: (from) => {
      leave();
      const toast = undoSwap(session, from);
      if (toast === null) return;
      redraw();
      say(toast);
    },
    remove: (name) => {
      leave();
      const toast = removeAdded(session, name);
      if (toast === null) return;
      redraw();
      say(toast);
    },
  };

  // ── Add an exercise (openAddSheet and applyAddChoice), and the test week's 1RM card ──
  const [add, setAdd] = useState<AddSheetView | null>(null);
  const openAdd = (): void => {
    leave();
    const sheet = addSheetOf(prog, open.week, open.dayKey);
    if (sheet) setAdd(sheet); else say('Nothing to add to here');
  };
  const added = (name: string): void => {
    const toast = addMove(session, name, Date.now());
    if (toast === null) return;
    redraw();
    say(toast);
  };
  const saveMax = (lift: string, weight: string, reps: string): MaxSaved => { leave(); return saveTestMax(session, lift, unit, weight, reps); };

  // ── The log: the effort and the notes are saved as they change (persistLogFields) ──
  const slid = (v: number): void => {
    const f = formNow.current;
    if (f.touched && f.rpe === String(v)) return;
    const next = moveRpe(f, v);
    hold(next);
    persistLog(session, next, cardioNow.current.dose, false, Date.now());
  };
  const noted = (text: string): void => {
    const next = typeNotes(formNow.current, text);
    hold(next);
    persistLog(session, next, cardioNow.current.dose, false, Date.now());
  };

  // ── The cardio's hand log: the wheels, the stepper, Log and the sport picker (cardio-log.ts) ──
  const cardioTaps: CardioTaps = {
    held: (id) => formNow.current.nodes[id] || '',
    set: (id, value) => { hold(setNode(session, formNow.current, cardioNow.current, id, value, Date.now())); },
    step: (delta) => { const r = stepReps(session, formNow.current, cardioNow.current, delta, Date.now()); hold(r.form); holdCardio(r.log); },
    log: () => {
      flush();
      const toast = logCardio(session, formNow.current, cardioNow.current, Date.now());
      if (toast) say(toast);
      // The Log tap is a write like any other: the form's state is set again so the button reads the store afresh.
      hold({ ...formNow.current });
      onLogged(open.week, open.dayKey);
    },
    picker: () => holdCardio(togglePicker(cardioNow.current)),
    chip: (sport) => {
      flush();
      const r = swapSport(session, formNow.current, cardioNow.current, sport, Date.now());
      hold(r.form);
      holdCardio(r.log);
      setDrawn((n) => n + 1);
    },
  };

  // ── Done and Skip (handleDayStatus) ──
  const status = (st: 'complete' | 'skipped', title: string): void => {
    if (leaving.current) return;
    leave();
    // A tap that sets a status rests every wheel first; the undo does not (handleDayStatus, V221 D179).
    if (dayStatus(store, prog.id, open.week, open.dayKey) !== st) flush();
    const r = tapStatus(session, formNow.current, cardioNow.current.dose, title, st, Date.now());
    if (r.toast) say(r.toast);
    if (!r.closed) { setView((v) => ({ ...v, foot: footOf(store, prog, open.week, open.dayKey) })); return; }
    if (r.popup) away(() => onDone(prog, open.week, open.dayKey)); else away(onClose);
  };

  const log = logOf(view);
  /** The sheet as it draws: the whole day, or the one cardio it was opened for (D278 item 3). */
  const frame = sheetFrame(view, open.only, prog);
  const rpeText = form.touched ? form.rpe + ' — ' + (RPE_LABELS[+form.rpe] || '') : log.view.rpeText;

  return (
    <Animated.View testID="session-sheet" accessibilityViewIsModal style={[StyleSheet.absoluteFill, { backgroundColor: p.bg, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}>
      {/* The header's band is dark by day and by night, so the clock over it is light while the sheet is up. */}
      <StatusBar style="light" />
      <View style={[s.header, { backgroundColor: p.bandHeader, borderBottomColor: p.border, paddingTop: Math.max(insets.top, 12) }]}>
        <View style={s.toprow}>
          <Pressable testID="sheet-back" accessibilityRole="button" hitSlop={12} onPress={() => { leave(); away(onClose); }}>
            <Text style={[s.back, { color: on(0.6) }]}>‹ Back</Text>
          </Pressable>
          <View style={s.topright}>
            {frame.counter !== null && <Text testID="sheet-counter" style={[s.counter, { backgroundColor: p.onBand }]}>{frame.counter}</Text>}
            <Pressable testID="sheet-rpeinfo" accessibilityRole="button" accessibilityLabel="What is RPE?" hitSlop={8} onPress={() => setInfo(true)} style={[s.rpeBtn, { borderColor: on(0.3) }]}>
              <Text style={[s.rpeBtnText, { color: p.onBand }]}>RPE ⓘ</Text>
            </Pressable>
          </View>
        </View>
        <Text testID="sheet-over" style={[s.over, { color: p.onBand }]}>{frame.over}</Text>
        <Text testID="sheet-title" style={[s.title, { color: p.onBand }]}>{frame.title}</Text>
        <View style={s.tagrow}>
          <View testID="sheet-tags" style={s.tags}>
            {frame.tags.chips.map((t, k) => <Text key={k} style={[s.tag, { color: tokenColor(p, t.color, p.onBand), backgroundColor: tokenColor(p, t.bg, on(0.12)) }]}>{t.label}</Text>)}
            {frame.tags.travel && <View style={[s.tag, s.travel, { borderColor: on(0.3) }]}><Icon name="backpack" size={11} color={p.onBand} /><Text style={[s.travelText, { color: p.onBand }]}>Travel</Text></View>}
          </View>
          {!frame.cardio && (
            <Pressable testID="sheet-add" accessibilityRole="button" accessibilityLabel="Add an exercise to this day" hitSlop={8} onPress={openAdd}
              style={({ pressed }) => [s.addBtn, { backgroundColor: on(pressed ? 0.2 : 0.1), borderColor: on(0.3) }]}>
              <SvgXml xml={PLUS} color={p.onBand} width={12} height={12} /><Text style={[s.addBtnText, { color: p.onBand }]}>Exercise</Text>
            </Pressable>
          )}
        </View>
      </View>
      <ScrollView testID="sheet-body" style={{ flex: 1 }} contentContainerStyle={[s.body, { paddingBottom: 20 + insets.bottom }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {drawnBlocks(frame).map((blk, k) => {
          if (blk.kind === 'also') {
            return (
              <View key={k} testID="sheet-also" style={[s.also, { backgroundColor: 'rgba(' + p.inkRgb + ',0.06)', borderColor: p.border2 }]}>
                <Text style={[s.alsoLbl, { color: p.muted }]}>{blk.label}</Text>
                {blk.lines.map((l, i) => <Text key={i} style={[s.alsoLine, { color: p.run }]}>{l}</Text>)}
                <Pressable testID="sheet-also-edit" accessibilityRole="button" onPress={() => { leave(); onRest({ prog: prog as unknown as RestProgram, week: open.week, dayKey: open.dayKey, view: 'cardio' }, () => redraw()); }} style={[s.alsoBtn, { borderColor: p.border2 }]}><Text style={[s.alsoBtnText, { color: p.text }]}>Edit cardio</Text></Pressable>
              </View>
            );
          }
          if (blk.kind === 'wildcard') {
            return (
              <View key={k} testID="sheet-wildcard" style={[s.wcTag, { backgroundColor: p.surface, borderLeftColor: p.signal }]}>
                <WildcardMark color={p.signal} size={16} />
                <View style={{ flexShrink: 1 }}>
                  <Text style={[s.wcLbl, { color: p.signal }]}>Wildcard done</Text>
                  <Text style={[s.wcSub, { color: p.muted }]}>{blk.sub}</Text>
                </View>
              </View>
            );
          }
          if (blk.kind === 'e1rm') return <E1rm key={k} card={blk.card} p={p} onSave={(weight, reps) => saveMax(blk.card.lift, weight, reps)} />;
          if (blk.kind === 'note') return <Text key={k} testID="sheet-note" style={[s.note, { color: p.muted, backgroundColor: 'rgba(' + p.inkRgb + ',0.10)', borderLeftColor: p.accent }]}>{plain(blk.html)}</Text>;
          if (blk.kind === 'nudge') {
            return (
              <Text key={k} testID="sheet-rangenudge" style={[s.progNudge, { color: p.text, backgroundColor: 'rgba(' + p.inkRgb + ',0.06)', borderColor: p.border2 }]}>
                <Text style={s.bold}>Time to add weight.</Text>{' Last session you hit the top of the range on every set of '}
                {blk.nudge.shown.map((n, i) => <Text key={i}><Text style={s.bold}>{n}</Text>{i < blk.nudge.shown.length - 1 ? ' and ' : ''}</Text>)}
                {blk.nudge.extra + '. Go up in weight today and start back at the bottom of the range.'}
              </Text>
            );
          }
          if (blk.kind === 'sections') return <SheetSections key={k} sections={blk.sections} p={p} fields={fields} setsOpen={setsOpen} rxOf={rxOf} unit={unit} h={h} />;
          if (blk.kind === 'cardio') return <Cardio key={k} c={blk.card} p={p} />;
          if (blk.kind === 'log') {
            return (
              <View key={k} testID="sheet-log" style={[s.logSection, { backgroundColor: p.surface }]}>
                <View style={[s.logHead, { borderBottomColor: p.border }]}><Icon name="chart" size={15} color={p.text} /><Text style={[s.logHeadText, { color: p.text }]}>Log This Session</Text></View>
                <View style={s.logBody}>
                  <View style={s.logLabelRow}>
                    <Text style={[s.logLabel, { color: p.muted }]}>How hard was it? — RPE</Text>
                    <Text accessibilityRole="button" accessibilityLabel="What is RPE?" onPress={() => setInfo(true)} style={[s.logLabel, { color: p.muted }]}> ⓘ</Text>
                  </View>
                  <View style={s.rpeRow}>
                    <Slider p={p} value={+form.rpe || 5} onChange={slid} />
                    <Text testID="sheet-rpe" style={[s.rpeWords, { color: p.text }]}>{rpeText}</Text>
                  </View>
                  {log.view.cardio && form.wrap && (
                    <CardioLogBlock p={p} card={log.view.cardio} c={cardio} nodes={form.nodes} active={form.wrap.active || form.wrap.planned} logged={cardioLive(session, form)}
                      drawn={drawn} flushers={flushers} on={cardioTaps} />
                  )}
                  <Text style={[s.logLabel, { color: p.muted }]}>Notes</Text>
                  <TextInput testID="sheet-notes" accessibilityLabel="Notes" multiline value={form.notes} onChangeText={noted} placeholder="How did it go? Anything to remember next week?" placeholderTextColor={p.muted}
                    style={[s.notes, { backgroundColor: p.surface2, borderColor: p.border2, color: p.text }]} />
                </View>
              </View>
            );
          }
          if (blk.kind === 'logNudge') {
            return (
              <View key={k} testID="sheet-lognudge" style={[s.logNudge, { backgroundColor: 'rgba(' + p.inkRgb + ',0.12)', borderColor: 'rgba(' + p.inkRgb + ',0.5)' }]}>
                <View style={s.logNudgeLine}><Icon name="notebook" size={14} color={p.text} /><Text style={[s.logNudgeText, { color: p.text }]}>You logged this one but never marked it.</Text></View>
                <Pressable testID="sheet-markdone" accessibilityRole="button" onPress={() => status('complete', blk.title)} style={[s.logNudgeBtn, { backgroundColor: p.accent }]}><Text style={[s.logNudgeBtnText, { color: p.onInk }]}>Mark Done ✓</Text></Pressable>
              </View>
            );
          }
          return null;
        })}
        {frame.foot && (
          <View testID="sheet-foot" style={s.foot}>
            {view.foot.map((btn, k) => <Foot key={btn.id} btn={btn} big={k === 0} p={p} onPress={() => status(btn.status, view.footTitle)} />)}
          </View>
        )}
      </ScrollView>
      {info && (
        <Pressable testID="sheet-rpeover" accessibilityLabel="Close" onPress={() => setInfo(false)} style={[StyleSheet.absoluteFill, s.infoOver, { backgroundColor: 'rgba(' + p.scrimRgb + ',0.55)' }]}>
          <Pressable style={[s.infoCard, { backgroundColor: p.surface }]} onPress={() => {}}>
            <Text style={[s.infoTitle, { color: p.text }]}>{RPE_INFO.title}</Text>
            <Text style={[s.infoSub, { color: p.muted }]}>{RPE_INFO.sub}</Text>
            {RPE_INFO.scale.map(([n, words]) => <View key={n} style={s.infoRow}><Text style={[s.infoN, { color: p.text }]}>{n}</Text><Text style={[s.infoWords, { color: p.text }]}>{words}</Text></View>)}
            {RPE_INFO.notes.map((n, k) => <Text key={k} style={[s.infoNote, { color: p.muted }]}>{n}</Text>)}
            <Pressable testID="sheet-rpeclose" accessibilityRole="button" onPress={() => setInfo(false)} style={[s.infoClose, { backgroundColor: p.accent }]}><Text style={[s.infoCloseText, { color: p.onInk }]}>{RPE_INFO.close}</Text></Pressable>
          </Pressable>
        </Pressable>
      )}
      {swap && <SwapSheet palette={p} view={swap.view} calm={calm} onPick={pick} onClose={() => setSwap(null)} />}
      {add && <AddSheet palette={p} view={add} calm={calm} onPick={added} onClose={() => setAdd(null)} />}
    </Animated.View>
  );
}

/**
 * A day's sections with their cards, as the session sheet draws them. Random Workout draws a Wildcard's with the same
 * component, as today's draws both with SessionSections.
 */
export function SheetSections({ sections, p, fields, setsOpen, rxOf, unit, h, gap }: {
  sections: SectionView[]; p: Palette; fields: Fields; setsOpen: Record<string, boolean>; rxOf: Record<string, Rx | null>; unit: string; h: SheetHandlers;
  /** The space between two sections where it is not the session sheet's own (Random Workout's column lays 16 between its pieces). */
  gap?: number;
}) {
  const s = styles;
  const card = (x: ExView, k: number, inBlock: boolean, last: boolean) => (
    <Move key={k} x={x} p={p} inBlock={inBlock} last={last} open={x.kind === 'card' && !!setsOpen[x.exKey]} f={x.kind === 'card' ? fields[x.exKey] : undefined}
      fv={x.kind === 'card' && fields[x.exKey] && x.log ? fieldsView(fields[x.exKey]!, rxOf[x.exKey] ?? null, unit) : null} h={h} />
  );
  const section = (sec: SectionView, k: number) => {
    if (sec.kind === 'skippedRound') {
      return (
        <View key={k} style={[s.skipped, { backgroundColor: p.surface2, borderColor: p.border2 }]}>
          <Text style={[s.skippedLbl, { color: p.muted }]}>Skipped</Text>
          <Text numberOfLines={1} style={[s.skippedName, { color: p.muted }]}>{sec.text}</Text>
          <Text testID={'sheet-roundback-' + sec.secIdx} accessibilityRole="button" onPress={() => h.edit({ kind: 'round', secIdx: sec.secIdx }, false)} style={[s.skippedUndo, { color: p.muted }]}>Put it back</Text>
        </View>
      );
    }
    const b = sec.body;
    return (
      <View key={k} style={s.section}>
        {sec.label !== null && <Text style={[s.secLabel, { color: p.muted }]}>{plain(sec.label)}</Text>}
        {b.kind === 'block' && (
          <View>
            {b.label && <Text style={[s.secLabel, { color: tokenColor(p, b.label.color, p.muted) }]}>{plain(b.label.text)}</Text>}
            {b.items.map((x, i) => card(x, i, false, i === b.items.length - 1))}
          </View>
        )}
        {b.kind === 'core' && (
          <View style={[s.wrap, { backgroundColor: tint(p.core, 0.1), borderColor: tint(p.core, 0.25) }]}>
            <Text style={[s.wrapHead, { color: p.core, backgroundColor: tint(p.core, 0.12) }]}>{plain(b.header)}</Text>
            {b.items.map((x, i) => card(x, i, true, i === b.items.length - 1))}
          </View>
        )}
        {b.kind === 'round' && (
          <View style={[s.wrap, { backgroundColor: p.surface, borderColor: p.signal }]}>
            <View style={[s.roundHead, { backgroundColor: 'rgba(' + p.signalRgb + ',0.10)' }]}>
              <Text style={[s.roundTxt, { color: p.signal }]}>{plain(b.header)}</Text>
              <Pressable testID={'sheet-roundminus-' + b.secIdx} accessibilityRole="button" accessibilityLabel="Skip this round" hitSlop={8} onPress={() => h.edit({ kind: 'round', secIdx: b.secIdx }, true)} style={[s.roundMinus, { backgroundColor: 'rgba(' + p.signalRgb + ',0.10)', borderColor: 'rgba(' + p.signalRgb + ',0.35)' }]}>
                <Icon name="minus" size={15} color={p.signal} />
              </Pressable>
            </View>
            {b.items.map((x, i) => card(x, i, true, i === b.items.length - 1))}
          </View>
        )}
      </View>
    );
  };
  return <View style={[s.sections, gap !== undefined && { gap }]}>{sections.map(section)}</View>;
}

/**
 * The test week's 1RM card (e1rm-card.ts): the test set's weight and reps, prefilled from the logged set, the Epley
 * estimate, and the save. The estimate reads 0 until a field changes, as today's does; once saved, the card's own
 * line stands where the button stood.
 */
function E1rm({ card: c, p, onSave }: { card: E1rmCard; p: Palette; onSave: (weight: string, reps: string) => MaxSaved }) {
  const s = styles;
  const [weight, setWeight] = useState(c.weight);
  const [reps, setReps] = useState(c.reps);
  const [estimate, setEstimate] = useState(0);
  const [saved, setSaved] = useState('');
  const typed = (t: string): void => { setWeight(t); setEstimate(e1rmEstimate(t, String(reps))); };
  const picked = (n: number): void => { setReps(n); setEstimate(e1rmEstimate(weight, String(n))); };
  const save = (): void => {
    const r = onSave(weight, String(reps));
    setEstimate(r.estimate);
    if (r.saved !== null) setSaved(r.saved);
  };
  return (
    <View testID="sheet-max" style={[s.e1rm, { backgroundColor: p.surface2, borderColor: p.border2 }]}>
      <View style={s.e1rmHd}><Text style={[s.e1rmHdText, { color: p.text }]}>Estimated 1RM</Text><Text style={[s.e1rmSmall, { color: p.muted }]}>from your test set</Text></View>
      <View style={s.e1rmRow}>
        <View style={s.e1rmField}>
          <Text style={[s.e1rmLbl, { color: p.muted }]}>{'Weight (' + c.unit + ')'}</Text>
          <TextInput testID="sheet-max-weight" accessibilityLabel={'Weight (' + c.unit + ')'} keyboardType="decimal-pad" selectTextOnFocus value={weight} onChangeText={typed}
            style={[s.e1rmInput, { color: p.text, backgroundColor: p.surface, borderColor: p.border2 }]} />
        </View>
        <View style={s.e1rmField}>
          <Text style={[s.e1rmLbl, { color: p.muted }]}>Reps</Text>
          <View style={s.e1rmReps}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} testID={'sheet-max-reps-' + n} accessibilityRole="button" accessibilityLabel={n + ' reps'} accessibilityState={{ selected: n === reps }} onPress={() => picked(n)}
                style={[s.e1rmRep, { backgroundColor: n === reps ? p.accent : p.surface, borderColor: n === reps ? p.accent : p.border2 }]}>
                <Text style={[s.e1rmRepText, { color: n === reps ? p.onInk : p.text }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <View style={[s.e1rmOut, { backgroundColor: 'rgba(' + p.inkRgb + ',0.08)' }]}>
        <Text style={[s.e1rmOutLbl, { color: p.muted }]}>Estimated 1RM</Text>
        <Text testID="sheet-max-out" style={[s.e1rmVal, { color: p.text }]}>{estimate + ' '}<Text style={[s.e1rmUnit, { color: p.muted }]}>{c.unit}</Text></Text>
      </View>
      {saved
        ? <Text testID="sheet-max-saved" style={[s.e1rmSaved, { color: p.green, backgroundColor: tint(p.run, 0.15) }]}>{saved}</Text>
        : <Pressable testID="sheet-max-save" accessibilityRole="button" onPress={save} style={[s.e1rmSave, { backgroundColor: p.signal }]}><Text style={[s.e1rmSaveText, { color: p.onSignal }]}>{'Save as new ' + c.liftLabel + ' max'}</Text></Pressable>}
      <Text style={[s.e1rmHint, { color: p.muted }]}>Experienced with heavy singles and have a spotter? A single at RPE 9.5 works too. Enter it at 1 rep.</Text>
    </View>
  );
}

/** One of the foot's two buttons: the big one carries the day's status and undoes it, the small one sets the other. */
function Foot({ btn, big, p, onPress }: { btn: FootButton; big: boolean; p: Palette; onPress: () => void }) {
  const s = styles;
  if (!big) {
    return <Pressable testID={'sheet-' + btn.id} accessibilityRole="button" onPress={onPress} style={[s.daySkip, { borderColor: p.border2 }]}><Text style={[s.daySkipText, { color: p.muted }]}>{btn.label}</Text></Pressable>;
  }
  const is = btn.cls === 'day-done is', skipped = btn.cls === 'day-done skipped';
  const ground = skipped ? p.surface2 : is ? p.accent : p.signal, ink = skipped ? p.muted : is ? p.onInk : p.onSignal;
  return (
    <Pressable testID={'sheet-' + btn.id} accessibilityRole="button" onPress={onPress}
      style={[s.dayDone, { backgroundColor: ground }, skipped && { borderWidth: 2, borderColor: p.border2, paddingVertical: 14 }, !skipped && !is && { boxShadow: '0 10px 28px rgba(' + p.signalRgb + ',0.42)' }]}>
      <Text style={[s.dayDoneText, { color: ink }]}>{btn.label}{btn.undo && <Text style={s.undoSmall}>tap to undo</Text>}</Text>
    </Pressable>
  );
}

/** The effort slider, 1 to 10 (the page's range input): a drag or a tap places it. */
function Slider({ p, value, onChange }: { p: Palette; value: number; onChange: (v: number) => void }) {
  const s = styles;
  const width = useRef(0), x0 = useRef(0);
  const change = useRef(onChange);
  change.current = onChange;
  const at = (x: number): void => { if (width.current) change.current(Math.min(10, Math.max(1, Math.round(1 + (x / width.current) * 9)))); };
  const drag = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => { x0.current = e.nativeEvent.locationX; at(x0.current); },
    onPanResponderMove: (_e, g) => at(x0.current + g.dx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  const fill = ((value - 1) / 9) * 100;
  return (
    <View testID="sheet-slider" accessible accessibilityRole="adjustable" accessibilityLabel="How hard was it, 1 to 10" accessibilityValue={{ min: 1, max: 10, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={(e) => onChange(Math.min(10, Math.max(1, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      onLayout={(e) => { width.current = e.nativeEvent.layout.width; }} style={s.slider} {...drag.panHandlers}>
      <View pointerEvents="none" style={[s.track, { backgroundColor: p.border2 }]} />
      <View pointerEvents="none" style={[s.track, { width: (fill + '%') as `${number}%`, right: undefined, backgroundColor: p.accent }]} />
      <View pointerEvents="none" style={[s.thumb, { left: (fill + '%') as `${number}%`, backgroundColor: p.surface, borderColor: p.accent }]} />
    </View>
  );
}

/** The cardio card (cardio-card.ts over cardio-card-model.ts): the session's name, its segments or its words, its note, the retest strip. */
function Cardio({ c, p }: { c: CardioCardView; p: Palette }) {
  const s = styles;
  const kind = c.blockCls.replace('-block', '');
  const ink = kind === 'run' ? p.run : kind === 'bike' || kind === 'swim' ? p.bike : p.text;
  return (
    <View testID="sheet-cardio" style={[s.cardio, { backgroundColor: p.surface, borderColor: tint(ink.startsWith('#') ? ink : '#111111', 0.3) }]}>
      <Text style={[s.cardioLabel, { color: ink }]}>{plain(c.label)}</Text>
      {c.segments ? c.segments.map((sg, k) => <Text key={k} style={[s.cardioDetail, { color: p.text }]}><Text style={s.bold}>{sg.label + '  '}</Text>{plain(sg.text)}</Text>) : <Text style={[s.cardioDetail, { color: p.text }]}>{plain(c.detail)}</Text>}
      {c.total !== null && <Text style={[s.cardioNote, { color: p.muted }]}>{c.total}</Text>}
      {c.note !== null && <Text style={[s.cardioNote, { color: p.muted }]}>{plain(c.note)}</Text>}
      {c.bench.map((b, k) => <Text key={k} style={[s.cardioNote, { color: p.muted }]}>{b.lead !== null && <Text style={s.bold}>{b.lead}</Text>}{b.text}</Text>)}
    </View>
  );
}

interface MoveProps { x: ExView; p: Palette; inBlock: boolean; last: boolean; open: boolean; f: MoveFields | undefined; fv: FieldsView | null; h: SheetHandlers }

/** One exercise card (session-sections.ts as the sheet draws it): every set behind its summary, the load, the pills, Log. */
function Move({ x, p, inBlock, last, open, f, fv, h }: MoveProps) {
  const s = styles;
  if (x.kind === 'skipped') {
    return (
      <View style={[s.skipped, { backgroundColor: p.surface2, borderColor: p.border2 }, inBlock && { marginHorizontal: 10, marginTop: 9 }]}>
        <Text style={[s.skippedLbl, { color: p.muted }]}>Skipped</Text>
        <Text numberOfLines={1} style={[s.skippedName, { color: p.muted }]}>{plain(x.name)}</Text>
        <Text testID="sheet-putback" accessibilityRole="button" onPress={() => h.edit({ kind: 'exercise', name: x.name }, false)} style={[s.skippedUndo, { color: p.muted }]}>Put it back</Text>
      </View>
    );
  }
  const sets = x.log ? x.log.sets : null, load = x.log ? x.log.load : null;
  const logged = f ? f.logged : x.logged;
  const reuse = load && load.reuse ? { ...load.reuse, ...(f && f.reuse ? f.reuse : {}) } : null;
  return (
    <View testID={'sheet-move-' + x.exKey} style={[inBlock ? [s.itemIn, !last && { borderBottomWidth: 1, borderBottomColor: p.border }] : [s.item, { backgroundColor: p.surface, borderColor: logged ? tint(p.run, 0.4) : 'transparent' }]]}>
      <View style={s.nameRow}>
        <Text style={[s.name, { color: p.text }]}>{plain(x.name)}</Text>
        {x.swap && <Pressable testID={'sheet-swap-' + x.exKey} accessibilityRole="button" accessibilityLabel="Swap this exercise" hitSlop={6} onPress={() => h.swap(x.swap!.secIdx, x.swap!.itemIdx)} style={[s.mic, { backgroundColor: p.surface2 }]}><Icon name="swap" size={16} color={p.muted} /></Pressable>}
        {x.skip && <Pressable testID={'sheet-minus-' + x.exKey} accessibilityRole="button" accessibilityLabel="Skip this exercise" hitSlop={6} onPress={() => h.edit({ kind: 'exercise', name: x.name }, true)} style={[s.mic, { backgroundColor: p.surface2 }]}><Icon name="minus" size={16} color={p.muted} /></Pressable>}
        <Text style={[s.badge, { color: p.run }]}>{logged ? '✓' : ''}</Text>
      </View>
      {!!x.detail && <Text style={[s.detail, { color: p.text }]}>{plain(x.detail)}</Text>}
      {x.added && (
        <View style={[s.chipRow, { borderTopColor: p.border }]}>
          <Text style={[s.chipText, { color: p.muted }]}><Text style={[s.bold, { color: p.signal }]}>You added this</Text>{' · not in the plan'}</Text>
          <Text testID={'sheet-remove-' + x.exKey} accessibilityRole="button" onPress={() => h.remove(x.name)} style={[s.chipUndo, { color: p.muted }]}>remove</Text>
        </View>
      )}
      {x.swappedFrom && (
        <View style={[s.chipRow, { borderTopColor: p.border }]}>
          <Text style={[s.chipText, { color: p.muted }]}><Text style={[s.bold, { color: p.signal }]}>Swapped in</Text>{' for ' + x.swappedFrom}</Text>
          <Text testID={'sheet-unswap-' + x.exKey} accessibilityRole="button" onPress={() => h.unswap(x.swappedFrom!)} style={[s.chipUndo, { color: p.muted }]}>put it back</Text>
        </View>
      )}
      {x.log && (
        <View style={s.log}>
          {sets && (
            <Pressable testID={'sheet-sets-' + x.exKey} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => h.sets(x.exKey)} style={[s.setHead, { borderTopColor: p.border }]}>
              <Text style={[s.setLbl, { color: p.muted }]}>Sets</Text>
              <Text numberOfLines={1} style={[s.setVal, { color: p.text }]}>{fv ? fv.head : sets.head}</Text>
              <Text style={[s.setSub, { color: p.muted }]}>{fv ? fv.sub : sets.sub}</Text>
              <View style={{ flex: 1 }} />
              {(fv ? fv.varied : sets.varied) && <Text style={[s.vary, { color: p.signal, borderColor: 'rgba(' + p.signalRgb + ',0.35)' }]}>Varied</Text>}
              <View style={open && { transform: [{ rotate: '180deg' }] }}><Icon name="chevronDown" size={20} color={p.muted} /></View>
            </Pressable>
          )}
          {sets && open && f && fv && (
            <View testID={'sheet-rows-' + x.exKey} style={[s.rows, { borderTopColor: p.border }]}>
              {sets.rows.map((r, ri) => {
                const rep = f.reps[r.s], cell = r.weight ? f.loads[r.s] : undefined;
                const isTop = !!cell && !!fv.top[r.s];
                return (
                  <View key={r.s} style={[s.row, ri < sets.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
                    <Text style={[s.rowNum, { color: p.muted }]}>{r.s + 1}</Text>
                    <View style={[s.ctl, { borderColor: p.border2, backgroundColor: p.surface }]}>
                      <Pressable testID={'sheet-minus-' + x.exKey + '-' + r.s} accessibilityRole="button" accessibilityLabel={'Set ' + (r.s + 1) + ', fewer'} onPress={() => h.step(x.exKey, r.s, -r.step)} style={[s.step, { backgroundColor: p.surface2 }]}><Text style={[s.stepText, { color: p.text }]}>−</Text></Pressable>
                      <View style={s.val}>
                        <TextInput testID={'sheet-rep-' + x.exKey + '-' + r.s} accessibilityLabel={'Set ' + (r.s + 1)} keyboardType="number-pad" selectTextOnFocus
                          value={rep ? rep.value : r.value} placeholder={rep ? rep.placeholder : r.placeholder} placeholderTextColor={p.muted}
                          onChangeText={(t) => h.rep(x.exKey, r.s, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)} style={[s.valText, s.field, { color: p.text }]} />
                        {!!r.suffix && <Text style={[s.suf, { color: p.muted }]}>{r.suffix}</Text>}
                        {!!fv.delta[r.s] && <Text style={[s.delta, { color: fv.delta[r.s]![0] === '-' ? p.signal : p.run }]}>{fv.delta[r.s]}</Text>}
                      </View>
                      <Pressable testID={'sheet-plus-' + x.exKey + '-' + r.s} accessibilityRole="button" accessibilityLabel={'Set ' + (r.s + 1) + ', more'} onPress={() => h.step(x.exKey, r.s, r.step)} style={[s.step, { backgroundColor: p.surface2 }]}><Text style={[s.stepText, { color: p.text }]}>+</Text></Pressable>
                    </View>
                    {r.weight && cell && (
                      <View style={[s.wcell, { borderColor: isTop ? p.signal : p.border2, backgroundColor: p.surface }]}>
                        {isTop && <Text style={[s.toppip, { backgroundColor: p.signal, color: p.onSignal }]}>Top</Text>}
                        <TextInput testID={'sheet-setload-' + x.exKey + '-' + r.s} accessibilityLabel={'Set ' + (r.s + 1) + ' load, ' + r.weight.unit} keyboardType="decimal-pad" selectTextOnFocus
                          value={cell.value} placeholder={cell.placeholder} placeholderTextColor={p.muted}
                          onChangeText={(t) => h.setLoad(x.exKey, r.s, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)} style={[s.wcellVal, s.field, { color: cell.inherit ? p.muted : p.text }]} />
                        <Text style={[s.wcellU, { color: p.muted }]}>{r.weight.unit}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {sets.foot && (
                <View style={[s.rowFoot, { borderTopColor: p.border }]}>
                  <Text style={[s.footLbl, { color: p.muted }]}>{fv.footLabel}</Text>
                  <Text style={[s.footVal, { color: p.text }]}>{fv.footValue}</Text>
                  <Text style={[s.footNote, { color: p.muted }]}>{'This is what tracks\nyour progress'}</Text>
                </View>
              )}
            </View>
          )}
          {load && !open && (
            <View style={s.weight}>
              <Text style={[s.weightLbl, { color: p.muted }]}>{fv ? fv.loadLabel : load.label}</Text>
              <TextInput testID={'sheet-load-' + x.exKey} accessibilityLabel={(fv ? fv.loadLabel : load.label) + ', ' + load.unit} keyboardType="decimal-pad" selectTextOnFocus
                value={f && f.load ? f.load.value : load.value} placeholder={f && f.load ? f.load.placeholder : ''} placeholderTextColor={p.muted}
                onChangeText={(t) => h.load(x.exKey, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}
                style={[s.winput, { borderColor: logged ? p.run : p.border2, backgroundColor: p.surface, color: p.text }]} />
              <Text style={[s.wunit, { color: p.muted }]}>{load.unit}</Text>
              {reuse && (
                <Pressable testID={'sheet-reuse-' + x.exKey} accessibilityRole="button" onPress={() => h.reuse(x.exKey, reuse.value)} style={[s.reuse, { backgroundColor: reuse.stale ? 'transparent' : p.surface2, borderColor: p.border2 }, reuse.stale && { borderStyle: 'dashed' }]}>
                  <Text style={[s.reuseIco, { color: reuse.stale ? p.muted : p.signal }]}>↺</Text>
                  <View><Text style={[s.reuseTxt, { color: reuse.stale ? p.muted : p.text }]}>{reuse.text}</Text><Text style={[s.reuseRec, { color: p.muted }]}>{reuse.rec}</Text></View>
                </Pressable>
              )}
            </View>
          )}
          {load && load.warn && <View style={[s.warn, { borderTopColor: p.border2 }]}><Text style={[s.warnTxt, { color: p.muted }]}>△</Text><Text style={[s.warnTxt, { flex: 1, color: p.muted }]}>{load.warn}</Text></View>}
          {load && load.fill && open && (
            <Pressable testID={'sheet-fill-' + x.exKey} accessibilityRole="button" onPress={() => h.fill(x.exKey, load.fill!.value)} style={[s.reuse, s.fill, { backgroundColor: load.fill.stale ? 'transparent' : p.surface2, borderColor: p.border2 }, load.fill.stale && { borderStyle: 'dashed' }]}>
              <Text style={[s.reuseIco, { color: load.fill.stale ? p.muted : p.signal }]}>↺</Text>
              <View><Text style={[s.reuseTxt, { color: load.fill.stale ? p.muted : p.text }]}>{load.fill.text}</Text><Text style={[s.reuseRec, { color: p.muted }]}>{load.fill.rec}</Text></View>
            </Pressable>
          )}
          <Pressable testID={'sheet-log-' + x.exKey} accessibilityRole="button" onPress={() => h.log(x)} style={[s.logBtn, { backgroundColor: p.signal }]}><Text style={[s.logBtnText, { color: p.onSignal }]}>Log</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 13, borderBottomWidth: 1 },
  toprow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  topright: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  counter: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '700', color: '#0a0a0a', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, overflow: 'hidden' },
  rpeBtn: { borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  rpeBtnText: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700' },
  over: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  title: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700', lineHeight: 30, marginTop: 1 },
  tagrow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 9 },
  tags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingLeft: 7, paddingRight: 9 },
  addBtnText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  also: { borderWidth: 1, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14 },
  alsoLbl: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700' },
  alsoLine: { fontFamily: TEXT, fontSize: 13, fontWeight: '500', marginTop: 6 },
  alsoBtn: { alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  alsoBtnText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  wcTag: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderLeftWidth: 3, borderRadius: 16 },
  wcLbl: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  wcSub: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  note: { fontFamily: TEXT, fontSize: 13, lineHeight: 13 * 1.5, borderLeftWidth: 3, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingVertical: 10, paddingHorizontal: 14, overflow: 'hidden' },
  e1rm: { borderWidth: 1, borderRadius: 16, padding: 14 },
  e1rmHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  e1rmHdText: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  e1rmSmall: { fontFamily: TEXT, fontSize: 11, fontWeight: '500' },
  e1rmRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  e1rmField: { flex: 1 },
  e1rmLbl: { fontFamily: TEXT, fontSize: 10, marginBottom: 4 },
  e1rmInput: { borderWidth: 1, borderRadius: 6, fontFamily: 'Menlo', fontSize: 15, fontWeight: '700', paddingVertical: 9, paddingHorizontal: 10 },
  e1rmReps: { flexDirection: 'row', gap: 4 },
  e1rmRep: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingVertical: 9 },
  e1rmRepText: { fontFamily: 'Menlo', fontSize: 15, fontWeight: '700' },
  e1rmOut: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  e1rmOutLbl: { fontFamily: TEXT, fontSize: 11 },
  e1rmVal: { fontFamily: 'Menlo', fontSize: 24, fontWeight: '700' },
  e1rmUnit: { fontSize: 12, fontWeight: '500' },
  e1rmSave: { alignItems: 'center', marginTop: 10, borderRadius: 999, padding: 11 },
  e1rmSaveText: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },
  e1rmSaved: { marginTop: 10, borderRadius: 8, padding: 10, fontFamily: TEXT, fontSize: 12.5, fontWeight: '700', textAlign: 'center', overflow: 'hidden' },
  e1rmHint: { fontFamily: TEXT, fontSize: 11, lineHeight: 11 * 1.45, marginTop: 8 },
  tag: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11, overflow: 'hidden' },
  travel: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5 },
  travelText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  body: { paddingTop: 16, paddingHorizontal: 16, gap: 14 },
  bold: { fontWeight: '700' },
  progNudge: { fontFamily: TEXT, fontSize: 13, lineHeight: 13 * 1.45, borderWidth: 1, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, overflow: 'hidden' },
  sections: { gap: 2 },
  section: { marginBottom: 2 },
  secLabel: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingTop: 10, paddingBottom: 8, paddingHorizontal: 4 },
  wrap: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 9 },
  wrapHead: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingVertical: 8, paddingHorizontal: 14 },
  roundHead: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, paddingHorizontal: 14 },
  roundTxt: { flex: 1, fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', lineHeight: 13 * 1.35 },
  roundMinus: { borderWidth: 1, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 7 },
  item: { borderWidth: 1, borderRadius: 16, marginBottom: 9, paddingVertical: 13, paddingHorizontal: 15 },
  itemIn: { paddingVertical: 11, paddingHorizontal: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontFamily: TEXT, fontSize: 15, fontWeight: '500' },
  mic: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8 },
  badge: { minWidth: 14, textAlign: 'right', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  detail: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', lineHeight: 15 * 1.3, marginTop: 4 },
  chip: { marginTop: 9, paddingTop: 8, borderTopWidth: 1, fontFamily: TEXT, fontSize: 11 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, paddingTop: 8, borderTopWidth: 1 },
  chipText: { flex: 1, fontFamily: TEXT, fontSize: 11 },
  chipUndo: { fontFamily: TEXT, fontSize: 11, textDecorationLine: 'underline' },
  log: { marginTop: 11 },
  setHead: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingVertical: 9 },
  setLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  setVal: { flexShrink: 1, fontFamily: DISPLAY, fontSize: 20, fontWeight: '700' },
  setSub: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  vary: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 },
  rows: { borderTopWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  rowNum: { width: 16, textAlign: 'center', fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  ctl: { flex: 1, flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 6, overflow: 'hidden' },
  step: { width: 38, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700', lineHeight: 24 },
  val: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 2 },
  valText: { minWidth: 34, textAlign: 'center', fontFamily: DISPLAY, fontSize: 21, fontWeight: '700' },
  field: { padding: 0, margin: 0 },
  suf: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  delta: { minWidth: 26, fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  wcell: { width: 78, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 7 },
  wcellVal: { flex: 1, textAlign: 'right', fontFamily: DISPLAY, fontSize: 19, fontWeight: '700' },
  wcellU: { fontFamily: TEXT, fontSize: 10, fontWeight: '700' },
  toppip: { position: 'absolute', top: -7, right: 6, fontSize: 8, fontWeight: '700', paddingVertical: 1, paddingHorizontal: 4, borderRadius: 2, overflow: 'hidden' },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingTop: 9, paddingBottom: 2 },
  footLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  footVal: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  footNote: { flex: 1, textAlign: 'right', fontFamily: TEXT, fontSize: 11, lineHeight: 11 * 1.25 },
  weight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  weightLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  winput: { width: 82, borderWidth: 1, borderRadius: 6, fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', textAlign: 'center', paddingVertical: 7, paddingHorizontal: 6 },
  wunit: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  reuse: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  fill: { marginLeft: 0, justifyContent: 'center', marginTop: 9 },
  reuseIco: { fontSize: 15, fontWeight: '700', lineHeight: 17 },
  reuseTxt: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', lineHeight: 12 * 1.15 },
  reuseRec: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700', marginTop: 1 },
  warn: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 9, paddingTop: 9, borderTopWidth: 1 },
  warnTxt: { fontFamily: TEXT, fontSize: 11, lineHeight: 11 * 1.35 },
  logBtn: { marginTop: 12, padding: 12, borderRadius: 999, alignItems: 'center' },
  logBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
  skipped: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 9 },
  skippedLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  skippedName: { flex: 1, fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', textDecorationLine: 'line-through' },
  skippedUndo: { fontFamily: TEXT, fontSize: 11, textDecorationLine: 'underline' },
  cardio: { borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18 },
  cardioLabel: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  cardioDetail: { fontFamily: TEXT, fontSize: 14, lineHeight: 14 * 1.5 },
  cardioNote: { fontFamily: TEXT, fontSize: 12, lineHeight: 12 * 1.45, marginTop: 8 },
  logSection: { borderRadius: 16, overflow: 'hidden' },
  logHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  logHeadText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  logBody: { paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  logLabelRow: { flexDirection: 'row', alignItems: 'baseline' },
  logLabel: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  rpeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  rpeWords: { minWidth: 120, textAlign: 'right', fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  slider: { flex: 1, height: 40 },
  track: { position: 'absolute', left: 0, right: 0, top: 17, height: 6, borderRadius: 3 },
  thumb: { position: 'absolute', top: 6, width: 28, height: 28, marginLeft: -14, borderRadius: 14, borderWidth: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' },
  notes: { height: 64, borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, fontFamily: TEXT, fontSize: 14, lineHeight: 14 * 1.4, textAlignVertical: 'top' },
  logNudge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14 },
  logNudgeLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  logNudgeText: { flexShrink: 1, fontFamily: TEXT, fontSize: 13, lineHeight: 13 * 1.4 },
  logNudgeBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  logNudgeBtnText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  foot: { alignItems: 'center', paddingTop: 10 },
  dayDone: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 999 },
  dayDoneText: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700' },
  undoSmall: { fontFamily: TEXT, fontSize: 11, fontWeight: '500', opacity: 0.6 },
  daySkip: { marginTop: 8, borderWidth: 1.5, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18 },
  daySkipText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  infoOver: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  infoCard: { alignSelf: 'stretch', borderRadius: 16, padding: 20, gap: 8 },
  infoTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700' },
  infoSub: { fontFamily: TEXT, fontSize: 13, lineHeight: 13 * 1.45 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoN: { width: 44, fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
  infoWords: { flex: 1, fontFamily: TEXT, fontSize: 14 },
  infoNote: { fontFamily: TEXT, fontSize: 12, lineHeight: 12 * 1.45 },
  infoClose: { marginTop: 6, borderRadius: 999, padding: 12, alignItems: 'center' },
  infoCloseText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
});
