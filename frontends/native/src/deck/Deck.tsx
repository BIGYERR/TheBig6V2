// The swipe deck in the Expo app (MIGRATION.md phase 3, the first screen; D275 P-DECK and D283 P-DECKFIT,
// docs/decisions/swipe-deck.md), drawn as today's deck draws it (frontends/app/src/app/screens/deck/deck.ts and
// deck.css, with the session sheet's cards from day-detail/session-sections.ts in deck mode): a day's lift work as a
// deck of cards, one card at a time in a fan, a sideways swipe to move on, the next card rising drawn in full under the
// finger (call 3), the dots, the session map, the RPE bubble (call 7), and each move's sets opening in place while
// the others fold (D283).
//
// IT LOGS (D289 P-NATIVEWRITES, docs/decisions/data-backup.md), into this app's own store and nowhere else. A set's
// steppers and fields, the load field, the reuse pill and Fill every set, Log, Done next one, Call it's effort and
// notes with Mark the day done, and skip with put it back all do what today's do: the fields are set-fields.ts, the
// writes deck-writes.ts, each the page's own handler with the page's globals as arguments. A move's fields are drawn
// from its card when the deck opens and again after a skip or its undo, and are changed in place in between, as the
// page's inputs are. Done, next one sends the card behind the deck with a glow (call 10); a skip punches the card
// (call 5). Both are still under Reduce Motion.
//
// IT SWAPS (the deck's third session). The swap mark on a single lift's card and on a move's row opens the swap sheet
// (swap-sheet/SwapSheet.tsx over deck-swaps.ts); a pick swaps the lift and Put it back undoes it (deck-writes.ts
// swapMove and undoSwap, the page's applySwapChoice and undoSwap), each drawing the day again as a skip does.
//
// UP AND DOWN (the deck's fifth session; D275 call 1). Two taps on a card inside 320 ms turn the deck between sideways
// and an up and down pager, either way, with no toast and no hint (call 15); every open starts sideways. Up and down
// there is no fan: the top card follows the finger, the card coming in stands a card height and 14 points away, a
// drag let go past 80 points slides both over 290 ms, the dots stand in a column at the right, and Done, next one
// sends the card up and away. A tall card's body scrolls first. The opening out of the card (call 16) is
// DeckOpening.tsx, which holds this screen and paints its ground: the deck has none of its own, as today's has none.
//
// Not here yet: remove on an added move (drawn, taking no press: today's deck hides it on the card an added move
// gets, and the add sheet is the session sheet's). The coach's nudge is raised here, 1.4 s after the third pick running of one pair (swap-sheet.ts), and
// answered through deck-writes.ts; Make the change hands back the rebuilt program, which this screen and This Week
// then hold. Mark the day done hands the day to the app, which closes the deck and raises the completion pop-up.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Keyboard, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polyline, Rect, SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import type { ExCard, ExView, Rx, SetRow } from '../day-detail/session-sections-model';
import { DISPLAY, type Palette, TEXT } from '../theme';
import {
  CALL_IT_WORDS, type CardAct, type DeckCard, PIP_THRESHOLD, ctaText, numeral, openAfterSetsTap, restOpen, rpeBubble, rxLine, stateOf,
} from './deck-model';
import { parseRx } from './deck-readers';
import { SwapNudge } from '../swap-nudge/SwapNudge';
import { SwapSheet } from '../swap-sheet/SwapSheet';
import { PLAN_CHANGE_FAILED } from '../this-week/week-screen';
import {
  type BodyScroll, type CoverKind, type DeckOpen, type DeckProgram, type Fields, PAGER_GAP, type Travel, coverOf, deckView, freshFields, isTap, loggedCards, movesOf, pagerTakes,
  slotsFrom, swipeTo, tapped, toneColor, travelOf,
} from './deck-screen';
import { type SwapOpen, swapSheetOf } from './deck-swaps';
import { type Session, acceptNudge, act, dismissNudge, leftField, markDay, nudgeWords, swapMove, tapDone, tapFill, tapLog, tapReuse, tapStep, undoSwap } from './deck-writes';
import { type FieldsView, type MoveFields, fieldsView, openedSets, typeLoad, typeRep, typeSetLoad } from './set-fields';

/** A card's sizes (D283, Mario's "Auto"): Roomy on a screen 700 points tall or more, Tight below it. */
interface Sizes { num: number; title: number; meta: number; name: number; line: number; cue: number; ctl: number; ic: number; mic: number; pad: number; item: number; row: number; load: number }
const ROOMY: Sizes = { num: 30, title: 24, meta: 14, name: 17, line: 15, cue: 13, ctl: 44, ic: 36, mic: 32, pad: 18, item: 12, row: 8, load: 76 };
const TIGHT: Sizes = { num: 22, title: 20, meta: 13, name: 15, line: 13, cue: 12, ctl: 34, ic: 30, mic: 26, pad: 12, item: 6, row: 6, load: 66 };

const FAN = 3;
const SWIPE = 80;
const PEEK = 140;
/** A card let go past the line: the card coming to the top settles in 290 ms, every other in 260 (deck.ts cardStyle's transitions; CSS ease). */
const SETTLE_TOP = { duration: 290, easing: Easing.bezier(0.22, 0.61, 0.36, 1) };
const SETTLE_FAN = { duration: 260, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };
/** The done motion's curve and the two parts of its 760 ms (deck.css deckTuck: out to the side by 42%, then behind). */
const TUCK = Easing.bezier(0.45, 0, 0.2, 1);
const TUCK_OUT = 319;
const TUCK_IN = 441;
/** Up and down the card leaves in one run of the same 760 ms (deck.css deckPagerLeave and deckPagerRise). */
const PAGER_LEAVE = 760;

/** Type and tints on a card: white at an alpha (rgba(var(--on-band-rgb), a)). */
const on = (a: number): string => 'rgba(255,255,255,' + a + ')';
/** Markup a name may carry, dropped: a card's words are plain here. */
const plain = (s: string): string => String(s).replace(/<[^>]*>/g, '').trim();
/** A hex colour as "r,g,b", for a glow written as rgba. */
const rgbOf = (hex: string): string => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}
function Tick({ size, color, width = 2.5 }: { size: number; color: string; width?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12" /></Svg>;
}
function Undo({ size, color }: { size: number; color: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 14L4 9l5-5" /><Path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>;
}

/** What a move's controls call, by the move's key. */
interface Handlers {
  step: (exKey: string, s: number, step: number) => void;
  rep: (exKey: string, s: number, text: string) => void;
  setLoad: (exKey: string, s: number, text: string) => void;
  load: (exKey: string, text: string) => void;
  focus: (exKey: string) => void;
  blur: (exKey: string) => void;
  reuse: (exKey: string, value: number) => void;
  fill: (exKey: string, value: number) => void;
  log: (x: ExCard) => void;
  skip: (name: string) => void;
  unskip: (name: string) => void;
  swap: (secIdx: number, itemIdx: number) => void;
  unswap: (from: string) => void;
}

export function Deck({ palette: p, store, open, onClose, onDone, onProgram, onOver, say }: {
  palette: Palette; store: StateStore; open: DeckOpen; onClose: () => void;
  /** A card the app draws over the toast, as today's overlay stands over it (z-index 2000 over 999): the nudge, or none. */
  onOver: (card: React.ReactNode) => void;
  /** Mark the day done: the day is stored; the app closes the deck and raises the completion pop-up over This Week. */
  onDone: (prog: DeckProgram, week: number, dayKey: string) => void;
  /** Make the change: the program rebuilt around the preference, for This Week to hold in place of the one it has. */
  onProgram: (prog: DeckProgram) => void;
  say: (toast: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const z = height >= 700 ? ROOMY : TIGHT;
  /** The program in hand: the one the deck opened on, or the one Make the change handed back. */
  const [prog, setProg] = useState(open.prog);
  const session: Session = { store, prog, week: open.week, dayKey: open.dayKey };
  const unit = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';

  // ── What the deck holds: the day as drawn, each move's fields, and what was done in this open ──
  const [view, setView] = useState(open.view);
  const [fields, setFields] = useState(() => freshFields(open.view.cards));
  const fieldsNow = useRef(fields);
  const apply = (F: Fields): void => {
    fieldsNow.current = F;
    setFields(F);
  };
  /** Cards marked done with nothing on them the app can log; the deck's own, for this open. */
  const [doneLocal, setDoneLocal] = useState<Record<string, boolean>>({});
  const [dayDone, setDayDone] = useState(open.view.dayDone);
  const [rpe, setRpe] = useState(open.view.rpe);
  const rpeTouched = useRef(false);
  const [notes, setNotes] = useState(open.view.notes);
  const cards = useMemo(() => loggedCards(view.cards, fields), [view, fields]);
  const n = cards.length;
  const rxOf = useMemo(() => {
    const out: Record<string, Rx | null> = {};
    for (const x of movesOf(view.cards)) out[x.exKey] = parseRx(x.rxDetail, x.name);
    return out;
  }, [view]);

  const [i, setI] = useState(open.view.first);
  const [sheet, setSheet] = useState<'map' | null>(null);
  const [bubble, setBubble] = useState<number | null>(null);
  /** Per move, whether its sets are open; per card, the move kept whole while the others fold (D283); per move, its pip. */
  const [setsOpen, setSetsOpen] = useState<Record<string, boolean>>({});
  const [openMove, setOpenMove] = useState<Record<string, string | null>>({});
  const [pips, setPips] = useState<Record<string, number>>({});
  /** Which way the finger is going: the next card rises on a pull to the left, the one before on a pull to the right. */
  const [dir, setDir] = useState(1);
  const dirNow = useRef(1);
  const dx = useRef(new Animated.Value(0)).current;
  const at = useRef(i);
  at.current = i;
  /** A finger on Call it's slider keeps the deck from taking the drag. */
  const sliding = useRef(false);

  // ── Up and down (call 1): a double tap turns the deck, either way; every open starts sideways ──
  const [vert, setVert] = useState(false);
  const vertNow = useRef(false);
  vertNow.current = vert;
  // Each card stands on a slot, a card height and 14 points apart, and the pager on a page: the top card's slot. A
  // drag moves `dy`; a slide takes the page on by one and the drag to nothing together, so when it ends the card
  // that came in is already where the top card stands and nothing is set back (deck-screen.ts pagerY).
  const [slot, setSlot] = useState(0);
  const slotNow = useRef(0);
  slotNow.current = slot;
  const pageV = useRef(new Animated.Value(0)).current;
  const dy = useRef(new Animated.Value(0)).current;
  const [stageH, setStageH] = useState(0);
  /** Each card's body: how far it is scrolled, its box and its content, so a tall card scrolls before the pager pages. */
  const bodies = useRef<Record<string, { y: number; box: number; content: number }>>({});
  const [tall, setTall] = useState<Record<string, boolean>>({});
  const bodyOf = (key: string): BodyScroll => { const b = bodies.current[key]; return b ? { y: b.y, max: Math.max(0, b.content - b.box) } : { y: 0, max: 0 }; };
  const sized = (key: string, part: { box?: number; content?: number }): void => {
    const b = { ...(bodies.current[key] ?? { y: 0, box: 0, content: 0 }), ...part };
    bodies.current[key] = b;
    const is = b.box > 0 && b.content > b.box + 2;
    setTall((m) => (!!m[key] === is ? m : { ...m, [key]: is }));
  };
  const topKey = useRef('');
  /** The keyboard is up: the card's body keeps its own scroll, so a field can come out from under it. */
  const [keys, setKeys] = useState(false);
  useEffect(() => {
    const up = Keyboard.addListener('keyboardWillShow', () => setKeys(true)), down = Keyboard.addListener('keyboardDidHide', () => setKeys(false));
    return () => { up.remove(); down.remove(); };
  }, []);
  const lastTap = useRef<number | null>(null);
  const pressAt = useRef({ x: 0, y: 0 });

  // ── Motion (call 10 and call 5), still under Reduce Motion ──
  const [calm, setCalm] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setCalm, () => {}); }, []);
  const calmNow = useRef(false);
  calmNow.current = calm;
  // A swipe let go past the line, or a dot pressed: today's cards ease to their new places (deck.ts cardStyle's
  // transitions), they do not jump. Each card keeps the place go() gives it and wears what it has left to travel on
  // top, which runs out to nothing; the values are new for every move and are never taken off a card mid flight.
  const [settle, setSettle] = useState<{ travel: (Travel | null)[]; top: Animated.Value; fan: Animated.Value } | null>(null);
  useEffect(() => {
    if (!settle) return;
    Animated.timing(settle.top, { toValue: 1, ...SETTLE_TOP, useNativeDriver: true }).start();
    Animated.timing(settle.fan, { toValue: 1, ...SETTLE_FAN, useNativeDriver: true }).start();
  }, [settle]);
  const [done, setDone] = useState<{ phase: 'lift' | 'leave'; glow: boolean; tucked: boolean } | null>(null);
  const busy = useRef(false);
  const liftV = useRef(new Animated.Value(0)).current;
  const leaveV = useRef(new Animated.Value(0)).current;
  /** Up and down the glow is a layer of its own, shown and hidden by this value, so the card is not drawn again for it. */
  const glowV = useRef(new Animated.Value(0)).current;
  const [hit, setHit] = useState<string | null>(null);
  const hitV = useRef(new Animated.Value(0)).current;
  const holeV = useRef(new Animated.Value(1)).current;
  const shardV = useRef(SHARDS.map(() => new Animated.Value(0))).current;
  const [stageW, setStageW] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const later = (fn: () => void, ms: number): void => { timers.current.push(setTimeout(fn, ms)); };

  /** At rest the card behind is the next one, in the fan. */
  const rest = (): void => { dirNow.current = 1; setDir(1); };
  /** To card k. With `letGo`, the points the top card was dragged when it was let go (0 for a dot), the cards ease there. */
  const go = (k: number, letGo?: number): void => {
    if (!n) return;
    const to = ((k % n) + n) % n;
    if (letGo !== undefined && !vertNow.current && !calmNow.current && to !== at.current) {
      setSettle({ travel: Array.from({ length: n }, (_x, j) => travelOf(j, at.current, to, n, letGo, FAN, PEEK)), top: new Animated.Value(0), fan: new Animated.Value(0) });
    } else setSettle(null);
    dx.setValue(0);
    if (vertNow.current) {
      // Up and down a jump (a dot, a tile of the map) moves the page, the nearer way round, and every card keeps the
      // slot it stands on: the cards in sight are moved by the page's value alone. Seen on the simulator: a card
      // handed a new place instead is not moved there until a value changes (a dot lit and the card before stayed).
      if (!slid.current) {
        const s = slotNow.current + slotsFrom(to, at.current, n);
        slotNow.current = s;
        pageV.setValue(s);
        setSlot(s);
      }
      slid.current = false;
      dy.setValue(0);
    }
    rest();
    setI(to);
  };
  /** A slide or the done motion has taken the page to its slot already: the jump that follows moves it no further. */
  const slid = useRef(false);
  const landed = (s: number): void => {
    slid.current = true;
    slotNow.current = s;
    // Said again where it came to rest, so the value the screen is next told is the one it shows.
    pageV.setValue(s);
    setSlot(s);
  };
  /** Up and down, a drag let go past the line: both cards slide a stride over 290 ms (deck.ts slide), then the deck is on that card. */
  const slide = (to: 1 | -1): void => {
    if (calmNow.current) {
      dy.setValue(0);
      go(at.current + to);
      return;
    }
    busy.current = true;
    Animated.parallel([
      Animated.timing(pageV, { toValue: slotNow.current + to, ...SETTLE_TOP, useNativeDriver: true }),
      Animated.timing(dy, { toValue: 0, ...SETTLE_TOP, useNativeDriver: true }),
    ]).start(() => {
      busy.current = false;
      landed(slotNow.current + to);
      go(at.current + to);
    });
  };
  const pan = useMemo(() => PanResponder.create({
    // A sideways drag moves the deck; an up and down one is the card's own scroll (deck.css touch-action: pan-y).
    // Up and down the pager owns the finger, and a tall card's body scrolls first (deck-screen.ts pagerTakes).
    onMoveShouldSetPanResponderCapture: (_e, g) => {
      if (n < 2 || busy.current || sliding.current) return false;
      if (vertNow.current) return pagerTakes(g.dx, g.dy, bodyOf(topKey.current));
      return Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;
    },
    onPanResponderMove: (_e, g) => {
      const along = vertNow.current ? g.dy : g.dx;
      const d = along < 0 ? 1 : -1;
      // Up and down the card before and the card after both stand ready, so a pull the other way draws nothing
      // again; a deck of two has one other card, which is put where the finger is going.
      if (d !== dirNow.current) { dirNow.current = d; if (!vertNow.current || n === 2) setDir(d); }
      (vertNow.current ? dy : dx).setValue(along);
    },
    onPanResponderRelease: (_e, g) => {
      if (vertNow.current) {
        const to = swipeTo(g.dy, SWIPE);
        if (to) slide(to);
        else Animated.timing(dy, { toValue: 0, ...SETTLE_TOP, useNativeDriver: true }).start(rest);
        return;
      }
      if (g.dx < -SWIPE) go(at.current + 1, g.dx);
      else if (g.dx > SWIPE) go(at.current - 1, g.dx);
      else Animated.timing(dx, { toValue: 0, duration: 290, easing: Easing.bezier(0.22, 0.61, 0.36, 1), useNativeDriver: true }).start(rest);
    },
    onPanResponderTerminate: () => { dx.setValue(0); dy.setValue(0); rest(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [n]);

  /**
   * A press on a card that is not on a control (deck.ts down and up): one that ends within 6 points of where it began
   * is a tap, and two inside 320 ms turn the deck between sideways and up and down. Nothing says so (call 15). A tap
   * takes the keyboard off its field, as a tap beside a field does.
   */
  const cardTap = (x: number, y: number): void => {
    if (busy.current || !isTap(x - pressAt.current.x, y - pressAt.current.y)) return;
    leave();
    const t = tapped(lastTap.current, performance.now());
    lastTap.current = t.last;
    if (!t.turn) return;
    setSettle(null);
    dx.setValue(0);
    dy.setValue(0);
    liftV.setValue(0);
    glowV.setValue(0);
    rest();
    setVert((v) => !v);
  };

  // ── Sets open in place, the other moves fold (D283; deck.ts foldOf, setsTapped, foldTapped) ──
  const foldOf = (c: DeckCard): string | null => openMove[c.key] || restOpen(c);
  /** A move's sets as they open: the page marks the top set then, which restates the summary from the cells. */
  const setsOpened = (exKey: string): void => {
    const f = fieldsNow.current[exKey];
    if (f) apply({ ...fieldsNow.current, [exKey]: openedSets(f) });
  };
  const setsTapped = (c: DeckCard, exKey: string): void => {
    const opened = !setsOpen[exKey];
    if (opened) setsOpened(exKey);
    setSetsOpen((m) => ({ ...m, [exKey]: opened }));
    setOpenMove((m) => ({ ...m, [c.key]: openAfterSetsTap(c, exKey, opened) }));
  };
  const foldTapped = (c: DeckCard, exKey: string): void => {
    const was = foldOf(c);
    if (was && setsOpen[was]) { setsOpened(exKey); setSetsOpen((m) => ({ ...m, [was]: false, [exKey]: true })); }
    setOpenMove((m) => ({ ...m, [c.key]: exKey }));
  };

  // ── Set logging (set-logging.ts through set-fields.ts and deck-writes.ts) ──
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
  /** A key typed into a field: the field holds it, and nothing is saved until the field is left. */
  const typed = (exKey: string, next: (f: MoveFields) => MoveFields): void => {
    const f = fieldsNow.current[exKey];
    if (f) apply({ ...fieldsNow.current, [exKey]: next(f) });
  };
  const h: Handlers = {
    step: (exKey, s, step) => { leave(); apply(tapStep(session, fieldsNow.current, exKey, s, step, Date.now())); },
    rep: (exKey, s, text) => typed(exKey, (f) => typeRep(f, s, text)),
    setLoad: (exKey, s, text) => typed(exKey, (f) => typeSetLoad(f, s, text)),
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
    skip: (name) => edit({ kind: 'exercise', name }, true),
    unskip: (name) => edit({ kind: 'exercise', name }, false),
    swap: (secIdx, itemIdx) => openSwap(secIdx, itemIdx),
    unswap: (from) => putBack(from),
  };

  // ── Skip and put it back (deck.ts act, skip and redraw) ──
  /** The day drawn again after an edit: every move's fields afresh, the reader kept on their card. */
  const redraw = (g: DeckProgram = prog): void => {
    const next = deckView(store, g, open.week, open.dayKey, Date.now(), open.warn);
    if (!next) return;
    const key = (cards[at.current] || { key: '' }).key;
    const k = next.cards.findIndex((c) => c.key === key);
    setView(next);
    apply(freshFields(next.cards));
    setOpenMove({});
    setSetsOpen({});
    setI(k >= 0 ? k : Math.min(at.current, next.cards.length - 1));
  };
  function edit(a: CardAct, off: boolean): void {
    leave();
    const toast = act(session, a, off);
    redraw();
    if (toast) say(toast);
  }
  // ── Swap and put it back (swap-sheet.ts openSwapSheet, applySwapChoice and undoSwap) ──
  /** The swap sheet, open on one lift of the day, or none. */
  const [swap, setSwap] = useState<SwapOpen | null>(null);
  function openSwap(secIdx: number, itemIdx: number): void {
    leave();
    const sheet = swapSheetOf(prog, open.week, open.dayKey, secIdx, itemIdx);
    if (sheet) setSwap(sheet); else say('Nothing to swap here');
  }
  /** A pick: the lift swapped, the day drawn again under the sheet as it slides away, the toast; the nudge 1.4 s on, when it is due. */
  const pick = (to: string): void => {
    if (!swap) return;
    const from = swap.ctx.name;
    const r = swapMove(session, swap.ctx, to, Date.now());
    if (!r) return;
    redraw();
    say(r.toast);
    if (r.nudge) later(() => setNudge({ from, to }), 1400);
  };
  // ── The coach's nudge (day-status.ts showSwapNudge, dismissSwapNudge, acceptSwapNudge) ──
  const [nudge, setNudge] = useState<{ from: string; to: string } | null>(null);
  /** Leave the plan alone: the pair is marked offered, and never asked again. */
  const leavePlan = (): void => {
    if (nudge) dismissNudge(session, nudge.from);
    setNudge(null);
  };
  /** Make the change: the preference into the program, the program rebuilt, the day drawn again from it, today's toast. */
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
  function putBack(from: string): void {
    leave();
    const toast = undoSwap(session, from);
    if (!toast) return;
    redraw();
    say(toast);
  }
  /** A skip punches the card (board V), plain grey under Reduce Motion, and raises no pop up (call 5). */
  const skip = (c: DeckCard): void => {
    if (!c.skip) return;
    edit(c.skip, true);
    if (calm) return;
    setHit(c.key);
    hitV.setValue(0);
    holeV.setValue(0);
    Animated.timing(hitV, { toValue: 1, duration: 520, easing: Easing.linear, useNativeDriver: true }).start();
    Animated.timing(holeV, { toValue: 1, duration: 380, easing: Easing.bezier(0.3, 1.2, 0.4, 1), useNativeDriver: true }).start();
    shardV.forEach((v, k) => { v.setValue(0); Animated.timing(v, { toValue: 1, duration: 620, delay: k * 15, easing: Easing.bezier(0.2, 0.6, 0.5, 1), useNativeDriver: true }).start(); });
    later(() => setHit(null), 680);
  };

  // ── The big button (deck.ts advance and markDay) ──
  const top = cards[i];
  topKey.current = top ? top.key : '';
  const isLogged = (c: DeckCard): boolean => !c.skipped && (c.logged || !!doneLocal[c.key]) && (c.kind !== 'finish' || dayDone);
  const states = cards.map((c, k) => stateOf(c, k, i, !!doneLocal[c.key] || (c.kind === 'finish' && dayDone)));
  const cta = top ? ctaText(top, !!doneLocal[top.key], dayDone) : '';
  const quiet = !!top && (top.kind === 'finish' ? dayDone : top.skipped || top.logged || !!doneLocal[top.key]);

  /**
   * Mark the day done: the day's effort (only once the slider is moved, D219) and notes, the day complete; the app
   * then closes the deck and raises the completion pop-up over This Week, where today's toast would stand (D179).
   */
  const mark = (): void => {
    markDay(session, view.title, rpeTouched.current ? rpe : null, notes, Date.now());
    setDayDone(true);
    onDone(prog, open.week, open.dayKey);
  };
  /** Done, next one logs what the card shows and sends it behind the deck; on a card logged or skipped it moves on. */
  const advance = (): void => {
    const c = cards[i];
    if (!c || busy.current) return;
    leave();
    if (c.kind === 'finish') {
      if (dayDone) onClose(); else mark();
      return;
    }
    const marking = !c.skipped && !c.logged && !doneLocal[c.key];
    if (marking) {
      const r = tapDone(session, fieldsNow.current, c.moves, Date.now());
      apply(r.fields);
      r.toasts.forEach(say);
      if (!r.tried) setDoneLocal((d) => ({ ...d, [c.key]: true }));
    }
    if (calm || n < 2) {
      later(() => go(at.current + 1), 200);
      return;
    }
    // Call 10: the card lifts, with a glow when it was just marked, then goes out to the side and behind the deck
    // while the next one rises (deck.css deckTuck and deckPeekRise, 760 ms).
    busy.current = true;
    liftV.setValue(0);
    leaveV.setValue(0);
    if (vertNow.current) {
      // Up and down (deck.css deckPagerLeave and deckPagerRise): the card lifts on its slot, then goes up and away
      // while the next rises into its place, one run of the 760 ms. The page goes on a slot, as a slide takes it,
      // and the lift lets go. Nothing is drawn again between the tap and the end: the lift, the glow and the page
      // are values the cards already wear, so nothing the screen is asked to draw can land in the middle of the
      // motion, and when it ends the card that came in is already where the top card stands.
      glowV.setValue(marking ? 1 : 0);
      Animated.timing(liftV, { toValue: 1, duration: 340, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
      later(() => {
        glowV.setValue(0);
        Animated.parallel([
          Animated.timing(pageV, { toValue: slotNow.current + 1, duration: PAGER_LEAVE, easing: TUCK, useNativeDriver: true }),
          Animated.timing(liftV, { toValue: 0, duration: PAGER_LEAVE, easing: TUCK, useNativeDriver: true }),
        ]).start(() => {
          busy.current = false;
          liftV.setValue(0);
          landed(slotNow.current + 1);
          go(at.current + 1);
        });
      }, marking ? 560 : 220);
      return;
    }
    setDone({ phase: 'lift', glow: marking, tucked: false });
    Animated.timing(liftV, { toValue: 1, duration: 340, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
    later(() => {
      setDone({ phase: 'leave', glow: false, tucked: false });
      Animated.timing(leaveV, { toValue: 1, duration: TUCK_OUT, easing: TUCK, useNativeDriver: true }).start(() => {
        setDone({ phase: 'leave', glow: false, tucked: true });
        Animated.timing(leaveV, { toValue: 2, duration: TUCK_IN, easing: TUCK, useNativeDriver: true }).start(() => {
          busy.current = false;
          liftV.setValue(0);
          setDone(null);
          go(at.current + 1);
        });
      });
    }, marking ? 560 : 220);
  };

  // ── Where each card sits (deck.ts cardStyle and faceStyle, sideways) ──
  const q = dx.interpolate({ inputRange: [-PEEK, 0, PEEK], outputRange: [1, 0, 1], extrapolate: 'clamp' });
  const leaving = !!done && done.phase === 'leave';
  const peek = n > 1 ? (i + (done ? 1 : dir) + n) % n : -1;
  /** A card's place with what it has left to travel on top: the shift before its own, the scale and the turn after. */
  const settling = (k: number, place: { zIndex: number; transform: object[] }): object => {
    const t = settle ? settle.travel[k] : null;
    if (!t) return place;
    const v = k === i ? settle!.top : settle!.fan;
    const l = (a: number, b: number) => v.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
    return { zIndex: place.zIndex, transform: [{ translateX: l(t.x, 0) }, { translateY: l(t.y, 0) }, ...place.transform, { scale: l(t.s, 1) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [t.r + 'deg', '0deg'] }) }] };
  };
  /** Up and down, a card on a slot stands its strides from the page, plus the drag (deck-screen.ts pagerY). */
  const stride = stageH + PAGER_GAP;
  const pagerAt = (on: number) => Animated.add(pageV.interpolate({ inputRange: [on - 1, on + 1], outputRange: [stride, -stride] }), dy);
  // Up and down the top card always wears its lift, which is nothing while it rests: 10 points up and 103% lifted.
  const lifted = [{ translateY: Animated.add(pagerAt(slot), liftV.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })) }, { scale: liftV.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }];
  const glowOf = (c: DeckCard): string => {
    const g = rgbOf(c.tone === 'hip' ? p.hip : c.tone === 'core' ? p.core : c.tone === 'finish' ? p.onBand : p.lift);
    return '0 0 0 2px rgba(' + g + ',0.9), 0 0 42px 8px rgba(' + g + ',0.6), 0 20px 44px rgba(0,0,0,0.26)';
  };
  const cardStyle = (k: number): object => {
    const pos = (k - i + n) % n;
    if (pos === 0) {
      const c = cards[k]!;
      if (hit === c.key) {
        const f = [0, 0.07, 0.17, 0.29, 0.43, 0.59, 0.77, 1];
        return { zIndex: 20, transform: [
          { translateX: hitV.interpolate({ inputRange: f, outputRange: [0, -14, 12, -9, 6, -4, 2, 0] }) },
          { translateY: hitV.interpolate({ inputRange: f, outputRange: [0, 6, -5, 4, -2, 2, -1, 0] }) },
          { rotate: hitV.interpolate({ inputRange: f, outputRange: ['0deg', '-2deg', '1.6deg', '-1.1deg', '0.7deg', '-0.4deg', '0.2deg', '0deg'] }) },
        ] };
      }
      // Up and down the card stays on its slot, lifted, and leaves with the page (deck.css deckPagerLeave: from 10
      // points up at 103% to a card height and 14 points up at its own size).
      if (vert) return { zIndex: 20, transform: lifted };
      if (done && done.phase === 'lift') {
        return [{ zIndex: 20, transform: [{ translateY: liftV.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }, { scale: liftV.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] },
          done.glow && { boxShadow: glowOf(c) }];
      }
      if (leaving) {
        const t = [0, 1, 2];
        return { zIndex: done!.tucked ? 1 : 20, opacity: leaveV.interpolate({ inputRange: [0, 1.69, 2], outputRange: [1, 1, 0] }), transform: [
          { translateX: leaveV.interpolate({ inputRange: t, outputRange: [0, stageW * 0.72, 45] }) },
          { translateY: leaveV.interpolate({ inputRange: t, outputRange: [-10, -30, -21] }) },
          { scale: leaveV.interpolate({ inputRange: t, outputRange: [1.03, 0.97, 0.895] }) },
          { rotate: leaveV.interpolate({ inputRange: t, outputRange: ['0deg', '10deg', '4.8deg'] }) },
        ] };
      }
      return settling(k, { zIndex: 20, transform: [{ translateX: dx }, { rotate: dx.interpolate({ inputRange: [-260, 260], outputRange: ['-10deg', '10deg'] }) }] });
    }
    // No fan up and down: every card stands on a slot of its own, a stride from the next, so only the top card is in
    // the stage at rest, the next one a stride below and the one before a stride above. On a deck of two the other
    // card is both, and stands where the finger is going.
    if (vert) return { zIndex: 15, transform: [{ translateY: pagerAt(slot + slotsFrom(k, i, n, dir)) }] };
    if (k === peek && leaving) {
      const l = (a: number, b: number) => leaveV.interpolate({ inputRange: [0, 2], outputRange: [a, b] });
      return { zIndex: 15, transform: [{ translateX: l(15, 0) }, { translateY: l(-7, 0) }, { scale: l(0.965, 1) }, { rotate: leaveV.interpolate({ inputRange: [0, 2], outputRange: ['1.6deg', '0deg'] }) }] };
    }
    if (k === peek && !done) {
      const f = (peek - i + n) % n === 1 ? { x: 15, y: -7, s: 0.965, r: '1.6deg' } : { x: 0, y: 0, s: 0.92, r: '0deg' };
      const l = (a: number, b: number) => q.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
      return settling(k, { zIndex: 15, transform: [{ translateX: l(f.x, 0) }, { translateY: l(f.y, 0) }, { scale: l(f.s, 1) }, { rotate: q.interpolate({ inputRange: [0, 1], outputRange: [f.r, '0deg'] }) }] });
    }
    if (pos >= 1 && pos <= FAN) {
      return settling(k, { zIndex: 10 - pos, transform: [{ translateX: pos * 15 }, { translateY: pos * -7 }, { scale: 1 - pos * 0.035 }, { rotate: pos * 1.6 + 'deg' }] });
    }
    return { zIndex: 1, opacity: 0 };
  };
  // A card's words are never hidden by an opacity of their own: every card but the top one wears a cover of its own
  // colour (deck-screen.ts coverOf), and the top card wears none, so nothing can leave its words hidden. Hidden by
  // their own opacity, the words of the card a swipe brought up stayed hidden whenever the finger rested before it
  // lifted (IA Next build 109, Mario's phone): the opacity went from a moving value to a plain 1 the screen was never sent.
  // The card behind is a plain card until a drag begins (deck.ts faceStyle: no face while nothing moves), so a skipped
  // card, which is drawn at 72%, shows no words through it. From two points of drag its words come up from a quarter.
  const coverOpacity = (kind: CoverKind): number | Animated.AnimatedInterpolation<number> => {
    if (kind === 'rest') return 1;
    if (kind === 'leave') return leaveV.interpolate({ inputRange: [0, 2], outputRange: [0.75, 0] });
    return q.interpolate({ inputRange: [0, 2 / PEEK, 1], outputRange: [1, 0.75 - (0.75 * 2) / PEEK, 0] });
  };

  const s = styles;
  // The dots: in a row under the stage sideways, in a column at its right up and down, the lit one long the way they run.
  const dots = cards.map((c, k) => (
    <Pressable key={c.key} testID={'deck-dot-' + k} accessibilityRole="button" accessibilityLabel={'Card ' + (k + 1) + ', ' + states[k]} hitSlop={8} onPress={() => { leave(); go(k, 0); }}
      style={[s.dot, { backgroundColor: k === i ? p.text : states[k] === 'Logged' ? p.signal : p.border2 }, k === i && (vert ? { height: 22 } : { width: 22 })]} />
  ));
  return (
    <View testID="deck" accessibilityViewIsModal style={[StyleSheet.absoluteFill, { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(14, insets.bottom) }]}>
      <View style={s.head}>
        <Pressable testID="deck-back" accessibilityRole="button" accessibilityLabel="Back to This Week" onPress={() => { leave(); onClose(); }} style={s.round44}>
          <Icon name="chevronLeft" size={22} color={p.text} />
        </Pressable>
        <Text testID="deck-title" numberOfLines={1} style={[s.title, { color: p.text }]}>{view.title}</Text>
        <Pressable testID="deck-map" accessibilityRole="button" accessibilityLabel="See the whole session" onPress={() => { leave(); setSheet('map'); }} style={s.round44}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={p.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x={4} y={4} width={6} height={6} rx={1.5} /><Rect x={14} y={4} width={6} height={6} rx={1.5} /><Rect x={4} y={14} width={6} height={6} rx={1.5} /><Rect x={14} y={14} width={6} height={6} rx={1.5} />
          </Svg>
        </Pressable>
      </View>

      <View style={[s.clip, vert && s.clipV]}>
      <View testID="deck-stage" style={[s.stage, vert && s.stageV]} onLayout={(e) => { setStageW(e.nativeEvent.layout.width); setStageH(e.nativeEvent.layout.height); }} {...pan.panHandlers}>
        {cards.map((c, k) => { const cover = coverOf(k, i, peek, done ? done.phase : null, vert); return (
          <Animated.View
            key={c.key}
            testID={'deck-card-' + k}
            pointerEvents={k === i ? 'auto' : 'none'}
            accessibilityElementsHidden={k !== i}
            importantForAccessibility={k === i ? 'auto' : 'no-hide-descendants'}
            style={[s.card, { backgroundColor: toneColor(p, c.tone), transformOrigin: vert ? 'center bottom' : 'left bottom' },
              isLogged(c) && { boxShadow: '0 0 0 3px ' + p.signal + ', 0 14px 38px rgba(' + p.signalRgb + ',0.40), 0 8px 24px rgba(0,0,0,0.14)' },
              c.skipped && k === i && { opacity: 0.72 }, cardStyle(k)]}
          >
            <View style={s.face}>
              <ScrollView
                style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
                // Up and down a body that fits its box does not move, so the pager has the finger; a tall one scrolls, without a bounce.
                scrollEnabled={!vert || !!tall[c.key] || keys} bounces={!vert} scrollEventThrottle={16}
                onScroll={(e) => { const b = bodies.current[c.key]; if (b) b.y = e.nativeEvent.contentOffset.y; }}
                onLayout={(e) => sized(c.key, { box: e.nativeEvent.layout.height })}
                onContentSizeChange={(_w, h) => sized(c.key, { content: h })}
              >
              <Pressable
                testID={'deck-tap-' + k} accessible={false} style={{ flexGrow: 1, padding: z.pad, paddingBottom: z.pad - 2 }}
                onPressIn={(e) => { pressAt.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; }}
                onPress={(e) => cardTap(e.nativeEvent.pageX, e.nativeEvent.pageY)}
              >
                {isLogged(c) && <View pointerEvents="none" style={s.bigcheck}><Tick size={240} color={on(1)} /></View>}
                <View style={[s.top, { minHeight: z.ic }]}>
                  <View style={s.numRow}>
                    <Text style={[s.num, { fontSize: z.num, color: p.onBand }]}>{numeral(k, n).num}</Text>
                    <Text style={[s.numOf, { color: on(0.62) }]}>{numeral(k, n).of}</Text>
                    {isLogged(c) && <View style={[s.doneChip, { backgroundColor: on(0.2) }]}><Tick size={12} color={p.onBand} width={3.5} /><Text style={[s.doneText, { color: p.onBand }]}>Logged</Text></View>}
                  </View>
                  <View style={s.acts}>
                    {c.swap && <Pressable testID="deck-swap" accessibilityRole="button" accessibilityLabel="Swap this exercise" onPress={() => openSwap(c.swap!.secIdx, c.swap!.itemIdx)} style={[s.act, { width: z.ic, height: z.ic, backgroundColor: on(0.16) }]}><Icon name="swap" size={17} color={p.onBand} /></Pressable>}
                    {c.skip && c.kind !== 'lift' && <Pressable testID="deck-skip" accessibilityRole="button" accessibilityLabel="Skip the whole card" onPress={() => skip(c)} style={[s.act, s.actAll, { height: z.ic, backgroundColor: on(0.16) }]}><Text style={[s.actAllText, { color: p.onBand }]}>Skip all</Text></Pressable>}
                    {c.undo && <Pressable testID="deck-undo" accessibilityRole="button" accessibilityLabel="Put it back" onPress={() => edit(c.undo!, false)} style={[s.act, { width: z.ic, height: z.ic, backgroundColor: p.onBand }]}><Undo size={18} color={p.band} /></Pressable>}
                    {c.skip && c.kind === 'lift' && <Pressable testID="deck-skip" accessibilityRole="button" accessibilityLabel="Skip this card" onPress={() => skip(c)} style={[s.act, { width: z.ic, height: z.ic, backgroundColor: on(0.16) }]}><Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={p.onBand} strokeWidth={2.5} strokeLinecap="round"><Line x1={5} y1={12} x2={19} y2={12} /></Svg></Pressable>}
                  </View>
                </View>
                <Text testID={'deck-name-' + k} style={[s.name, { fontSize: z.title, lineHeight: z.title * 1.12, color: p.onBand }, c.skipped && { textDecorationLine: 'line-through', textDecorationColor: on(0.5) }]}>{c.title}</Text>
                <Text testID={'deck-meta-' + k} style={[s.meta, { fontSize: z.meta, lineHeight: z.meta * 1.3, color: on(0.76) }]}>{c.meta}</Text>
                <View style={[s.rule, { backgroundColor: on(0.2) }]} />
                {!!c.cue && !c.skipped && <Text testID={'deck-cue-' + k} style={[s.cue, { fontSize: z.cue, lineHeight: z.cue * 1.35, color: on(0.8) }]}>{c.cue}</Text>}
                {c.swappedFrom && (
                  <View style={[s.from, { backgroundColor: on(0.16) }]}>
                    <Text style={[s.fromB, { color: p.onBand }]}>Swapped in</Text>
                    <Text numberOfLines={1} style={[s.fromText, { color: on(0.78) }]}>{'for ' + c.swappedFrom}</Text>
                    <Pressable testID="deck-unswap" accessibilityRole="button" accessibilityLabel="Put it back" hitSlop={8} onPress={() => putBack(c.swappedFrom!)} style={[s.fromBtn, { backgroundColor: p.onBand }]}><Undo size={15} color={p.band} /></Pressable>
                  </View>
                )}
                {c.kind === 'finish' ? (
                  <CallIt p={p} rpe={rpe} notes={notes} sliding={sliding}
                    onRpe={(v) => { rpeTouched.current = true; setRpe(v); }} onNotes={setNotes} />
                ) : !c.skipped && (
                  <View>
                    {c.views.flatMap((v) => (v.kind === 'section' ? v.body.items : [])).map((x, xi, all) => {
                      const f = x.kind === 'card' ? fields[x.exKey] : undefined;
                      return (
                        <Move
                          key={xi} x={x} c={c} z={z} p={p} last={xi === all.length - 1}
                          f={f} fv={x.kind === 'card' && f ? fieldsView(f, rxOf[x.exKey] ?? null, unit) : null} h={h}
                          open={x.kind === 'card' && !!setsOpen[x.exKey]}
                          folded={x.kind === 'card' && foldOf(c) !== null && foldOf(c) !== x.exKey}
                          pip={x.kind === 'card' ? pips[x.exKey] ?? 0 : 0}
                          onSets={(key) => setsTapped(c, key)} onFold={(key) => foldTapped(c, key)}
                          onPip={(key, n2) => setPips((m) => ({ ...m, [key]: n2 }))}
                          onRpe={() => setBubble(c.rpe ?? 7)}
                        />
                      );
                    })}
                  </View>
                )}
              </Pressable>
              </ScrollView>
            </View>
            {cover && <Animated.View key={cover} testID={'deck-cover-' + k} pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: toneColor(p, c.tone), opacity: coverOpacity(cover) }]} />}
            {c.skipped && (
              <Animated.View pointerEvents="none" style={[s.hole, hit === c.key && { opacity: holeV.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1] }), transform: [{ rotate: '-13deg' }, { scale: holeV.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.2, 1.12, 1] }) }] }]}>
                <Svg viewBox="0 0 220 220" width={200} height={200}>
                  <Path d={HOLE} fill="rgba(0,0,0,0.62)" transform="translate(5,7)" /><Path d={HOLE} fill={p.bg} />
                </Svg>
              </Animated.View>
            )}
            {c.skipped && hit === c.key && SHARDS.map((sh, k2) => (
              <Animated.View key={k2} pointerEvents="none" style={[s.shard, { opacity: shardV[k2]!.interpolate({ inputRange: [0, 0.38, 1], outputRange: [1, 1, 0] }), transform: [
                { translateX: shardV[k2]!.interpolate({ inputRange: [0, 0.38, 1], outputRange: [0, sh.x[0], sh.x[1]] }) },
                { translateY: shardV[k2]!.interpolate({ inputRange: [0, 0.38, 1], outputRange: [0, sh.y[0], sh.y[1]] }) },
                { rotate: shardV[k2]!.interpolate({ inputRange: [0, 0.38, 1], outputRange: ['0deg', sh.r[0] + 'deg', sh.r[1] + 'deg'] }) },
              ] }]}>
                <Svg viewBox="0 0 30 30" width={sh.s} height={sh.s}><Path d="M4,8 L20,2 L28,18 L12,28 Z" fill={on(0.85)} /></Svg>
              </Animated.View>
            ))}
          </Animated.View>
        ); })}
        {vert && top && <Animated.View testID="deck-glow" pointerEvents="none" style={[s.card, { transformOrigin: 'center bottom', zIndex: 19, boxShadow: glowOf(top), opacity: glowV, transform: lifted }]} />}
      </View>
      {vert && <View testID="deck-dots" style={s.dotsV}>{dots}</View>}
      </View>

      {!vert && <View testID="deck-dots" style={s.dots}>{dots}</View>}
      <View style={s.foot}>
        <Pressable
          testID="deck-cta" accessibilityRole="button" onPress={advance}
          style={[s.cta, quiet ? { backgroundColor: p.text } : { backgroundColor: p.signal, boxShadow: '0 10px 28px rgba(' + p.signalRgb + ',0.42)' }]}
        >
          <Text style={[s.ctaText, { color: quiet ? p.bg : p.onSignal }]}>{cta}</Text>
        </Pressable>
      </View>

      {sheet === 'map' && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable accessibilityLabel="Close" onPress={() => setSheet(null)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(' + p.scrimRgb + ',0.5)' }]} />
          <View testID="deck-sheet" accessibilityLabel="The whole session" style={[s.sheet, { backgroundColor: p.bg, paddingBottom: Math.max(20, insets.bottom) }]}>
            <View style={s.sheetHead}>
              <Text numberOfLines={1} style={[s.sheetTitle, { color: p.text }]}>{view.title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSheet(null)} style={[s.x, { backgroundColor: p.surface2 }]}><Text style={{ color: p.text, fontSize: 15 }}>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={s.tiles}>
              {cards.map((c, k) => (
                <Pressable key={c.key} testID={'deck-tile-' + k} accessibilityRole="button" onPress={() => { go(k); setSheet(null); }}
                  style={[s.tile, { backgroundColor: toneColor(p, c.skipped ? 'skip' : c.tone) }, k === i && { boxShadow: '0 0 0 2px ' + p.text }, states[k] === 'Logged' && { boxShadow: '0 0 0 2px ' + p.signal }]}>
                  <Text style={[s.tileNum, { color: p.onBand }]}>{String(k + 1).padStart(2, '0')}</Text>
                  <Text style={[s.tileKick, { color: on(0.78) }]}>{c.kicker}</Text>
                  <Text style={[s.tileTitle, { color: p.onBand }]}>{c.title}</Text>
                  <Text style={[s.tileState, { color: on(0.84) }]}>{states[k]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {bubble !== null && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable accessibilityLabel="Close" onPress={() => setBubble(null)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(' + p.scrimRgb + ',0.5)' }]} />
          <View testID="deck-bubble" accessibilityLabel="What RPE means" style={[s.bubble, { backgroundColor: p.surface }]}>
            <Text style={[s.bubbleK, { color: p.text }]}>{'RPE ' + bubble}</Text>
            <Text style={[s.bubbleLine, { color: p.text }]}>{rpeBubble(bubble).line}</Text>
            {rpeBubble(bubble).rows.map((r) => (
              <View key={r.range} style={[s.band, r.on && { backgroundColor: p.signal }]}>
                <Text style={[s.bandR, { color: r.on ? p.onSignal : p.muted }]}>{r.range}</Text>
                <Text style={[s.bandL, { color: r.on ? p.onSignal : p.text }]}>{r.label}</Text>
                <Text style={[s.bandD, { color: r.on ? p.onSignal : p.muted }]}>{r.detail}</Text>
              </View>
            ))}
            <Pressable testID="deck-gotit" accessibilityRole="button" onPress={() => setBubble(null)} style={[s.gotit, { backgroundColor: p.text }]}><Text style={[s.gotitText, { color: p.bg }]}>Got it</Text></Pressable>
          </View>
        </View>
      )}
      {swap && <SwapSheet palette={p} view={swap.view} calm={calm} onPick={pick} onClose={() => setSwap(null)} />}
    </View>
  );
}

/** The punched hole of a skipped card (deck.ts, board V). */
const HOLE = 'M110,30 L122,52 L142,42 L140,66 L164,60 L154,82 L182,84 L164,102 L190,114 L166,124 L184,146 L158,144 L166,168 L142,158 L138,186 L118,166 L104,192 L96,164 L72,178 L74,152 L48,158 L60,136 L32,130 L52,112 L28,98 L54,88 L40,64 L66,68 L64,42 L88,54 Z';
/** The punch's four shards (deck.css deckD1 to deckD4): a size, and where each flies at 38% and at its end. */
const SHARDS = [
  { s: 17, x: [-52, -98], y: [-26, 86], r: [-140, -300] },
  { s: 13, x: [46, 88], y: [-34, 74], r: [120, 280] },
  { s: 11, x: [-22, -44], y: [-44, 104], r: [-90, -210] },
  { s: 15, x: [28, 58], y: [-40, 112], r: [100, 240] },
] as const;

/** Call it (call R): the day's effort and its word, the slider, the notes. Nothing is stored until Mark the day done. */
function CallIt({ p, rpe, notes, sliding, onRpe, onNotes }: { p: Palette; rpe: number; notes: string; sliding: { current: boolean }; onRpe: (v: number) => void; onNotes: (t: string) => void }) {
  const s = styles;
  const fill = ((rpe - 1) / 9) * 100;
  const width = useRef(0);
  const x0 = useRef(0);
  const at = (x: number): void => {
    if (!width.current) return;
    onRpe(Math.min(10, Math.max(1, Math.round(1 + (x / width.current) * 9))));
  };
  const drag = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => { sliding.current = true; x0.current = e.nativeEvent.locationX; at(x0.current); },
    onPanResponderMove: (_e, g) => at(x0.current + g.dx),
    onPanResponderRelease: () => { sliding.current = false; },
    onPanResponderTerminate: () => { sliding.current = false; },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  return (
    <View testID="deck-callit" style={s.callit}>
      <View style={s.rpeRead}>
        <Text testID="deck-rpe" style={[s.rpeN, { color: p.onBand }]}>{rpe}</Text>
        <Text style={[s.rpeW, { color: on(0.84) }]}>{CALL_IT_WORDS[rpe] || ''}</Text>
      </View>
      <View
        testID="deck-slider" accessible accessibilityRole="adjustable" accessibilityLabel="How hard was the whole session, 1 to 10"
        accessibilityValue={{ min: 1, max: 10, now: rpe }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onRpe(Math.min(10, Math.max(1, rpe + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
        onLayout={(e) => { width.current = e.nativeEvent.layout.width; }} style={s.slider} {...drag.panHandlers}
      >
        <View pointerEvents="none" style={[s.track, { backgroundColor: on(0.18) }]} />
        <View pointerEvents="none" style={[s.track, { width: (fill + '%') as `${number}%`, right: undefined, backgroundColor: p.signal }]} />
        <View pointerEvents="none" style={[s.thumb, { left: (fill + '%') as `${number}%`, backgroundColor: p.signal, borderColor: p.onBand }]} />
      </View>
      <Text style={[s.notesLbl, { color: on(0.78) }]}>Notes</Text>
      <TextInput testID="deck-notes" accessibilityLabel="Notes" multiline value={notes} onChangeText={onNotes} style={[s.notes, s.notesText, { backgroundColor: on(0.1), color: p.onBand }]} />
    </View>
  );
}

interface MoveProps {
  x: ExView; c: DeckCard; z: Sizes; p: Palette; last: boolean; open: boolean; folded: boolean; pip: number;
  /** The move's fields and what they show, for a move with a card. */
  f: MoveFields | undefined; fv: FieldsView | null; h: Handlers;
  onSets: (exKey: string) => void; onFold: (exKey: string) => void; onPip: (exKey: string, s: number) => void; onRpe: () => void;
}

/** One move on a card: the session sheet's exercise card in deck mode (session-sections.ts with deck.css over it). */
function Move({ x, c, z, p, last, open, folded, pip, f, fv, h, onSets, onFold, onPip, onRpe }: MoveProps) {
  const s = styles;
  if (x.kind === 'skipped') {
    return (
      <View style={s.skipped}>
        <Text style={[s.skippedLbl, { color: on(0.72) }]}>Skipped</Text>
        <Text numberOfLines={1} style={[s.skippedName, { color: on(0.72) }]}>{plain(x.name)}</Text>
        <Text testID="deck-putback" accessibilityRole="button" onPress={() => h.unskip(x.name)} style={[s.skippedUndo, { color: on(0.72) }]}>Put it back</Text>
      </View>
    );
  }
  const line = rxLine(String(x.rxDetail || x.detail || ''));
  const lift = c.kind === 'lift', cool = c.kind === 'cool';
  const sets = x.log ? x.log.sets : null, load = x.log ? x.log.load : null;
  const logged = f ? f.logged : x.logged;
  const head = fv && sets ? fv.head : sets ? sets.head : '';
  const edge = [{ paddingVertical: z.item }, !last && !lift && { borderBottomWidth: 1, borderBottomColor: on(0.14) }, (last || lift) && { paddingBottom: 0 }];
  if (folded) {
    return (
      <Pressable testID={'deck-move-' + x.exKey} accessibilityRole="button" accessibilityLabel={'Open ' + plain(x.name)} onPress={() => onFold(x.exKey)} style={[s.foldRow, edge, { paddingVertical: z.item - 2 }]}>
        <Text numberOfLines={1} style={[s.moveName, { flex: 1, fontSize: z.name - 1, color: p.onBand }]}>{plain(x.name)}</Text>
        {sets && <Text style={[s.foldVal, { color: on(0.72) }]}>{head}</Text>}
        {logged && <Text style={[s.badge, { color: p.onBand }]}>✓</Text>}
      </Pressable>
    );
  }
  const logBtn = x.log && (
    <Pressable testID={'deck-log-' + x.exKey} accessibilityRole="button" onPress={() => h.log(x)} style={[s.log, { height: z.ctl, backgroundColor: p.onBand }]}><Text style={[s.logText, { color: p.band }]}>Log</Text></Pressable>
  );
  if (cool) {
    return (
      <View testID={'deck-move-' + x.exKey} style={[s.coolRow, edge]}>
        <View style={{ flex: 1 }}>
          <NameRow x={x} z={z} p={p} controls={false} logged={logged} h={h} />
          {!!line.dose && <Text style={[s.dose, { fontSize: z.line, lineHeight: z.line * 1.25, color: p.onBand }]}>{line.dose}</Text>}
          {!!line.cue && <Text style={[s.moveCue, { fontSize: z.cue, lineHeight: z.cue * 1.3, color: on(0.76) }]}>{line.cue}</Text>}
        </View>
        {logBtn}
      </View>
    );
  }
  const setLine = sets && (
    <View style={s.setLine}>
      <Pressable testID={'deck-sets-' + x.exKey} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => onSets(x.exKey)} style={s.setHead}>
        <Text style={[s.setVal, { fontSize: z.line, color: p.onBand }]}>{head}</Text>
        {!!line.rpe && <Text style={[s.setRpe, { fontSize: z.line, color: on(0.76) }]}>{'· ' + line.rpe}</Text>}
        {(fv ? fv.varied : sets.varied) && <Text style={[s.vary, { color: p.onBand, borderColor: on(0.35) }]}>Varied</Text>}
        <View style={[s.caret, { backgroundColor: open ? p.onBand : on(0.16) }, open && { transform: [{ rotate: '180deg' }] }]}><Icon name="chevronDown" size={14} color={open ? p.band : p.onBand} /></View>
      </Pressable>
      {lift && c.rpe !== null && !!line.rpe && (
        <Pressable testID="deck-rpeinfo" accessibilityRole="button" accessibilityLabel="What RPE means" hitSlop={10} onPress={onRpe} style={s.rpeInfo}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={on(0.85)} strokeWidth={2} strokeLinecap="round"><Circle cx={12} cy={12} r={9.5} /><Line x1={12} y1={11} x2={12} y2={16.5} /><Circle cx={12} cy={7.6} r={0.6} fill={on(0.85)} /></Svg>
        </Pressable>
      )}
    </View>
  );
  const reuse = load && load.reuse ? { ...load.reuse, ...(f && f.reuse ? f.reuse : {}) } : null;
  return (
    <View testID={'deck-move-' + x.exKey} style={edge}>
      {!lift && <NameRow x={x} z={z} p={p} controls logged={logged} h={h} />}
      {load ? setLine : (
        <View style={s.lineLog}><View style={{ flex: 1 }}>{setLine}</View>{logBtn}</View>
      )}
      {!lift && !!line.cue && <Text style={[s.moveCue, { fontSize: z.cue, lineHeight: z.cue * 1.3, color: on(0.76) }]}>{line.cue}</Text>}
      {!lift && x.added && <Text style={[s.chip, { color: on(0.76) }]}><Text style={{ color: p.onBand, fontWeight: '700' }}>You added this</Text>{' · not in the plan  '}<Text style={{ color: p.onBand }}>remove</Text></Text>}
      {!lift && x.swappedFrom && <Text style={[s.chip, { color: on(0.76) }]}><Text style={{ color: p.onBand, fontWeight: '700' }}>Swapped in</Text>{' for ' + x.swappedFrom + '  '}<Text testID={'deck-unswap-' + x.exKey} accessibilityRole="button" suppressHighlighting onPress={() => h.unswap(x.swappedFrom!)} style={{ color: p.onBand }}>put it back</Text></Text>}
      {sets && open && f && fv && <Rows x={x} rows={sets.rows} f={f} fv={fv} foot={sets.foot} pip={pip} p={p} h={h} onPip={(n2) => onPip(x.exKey, n2)} />}
      {load && (
        <View style={[s.weightRow, { marginTop: z.row }]}>
          {!open && (
            <View style={s.weight}>
              <View style={[s.winput, { width: z.load, height: z.ctl, backgroundColor: on(0.1), borderColor: on(0.26) }]}>
                <TextInput
                  testID={'deck-load-' + x.exKey} accessibilityLabel={(fv ? fv.loadLabel : load.label) + ', ' + load.unit} keyboardType="decimal-pad" selectTextOnFocus
                  value={f && f.load ? f.load.value : load.value} placeholder={f && f.load ? f.load.placeholder : ''} placeholderTextColor={on(0.5)}
                  onChangeText={(t) => h.load(x.exKey, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}
                  style={[s.wval, s.field, { flex: 1, color: p.onBand }]}
                />
                <Text style={[s.wunit, { color: on(0.72) }]}>{load.unit}</Text>
              </View>
              {reuse && (
                <Pressable testID={'deck-reuse-' + x.exKey} accessibilityRole="button" onPress={() => h.reuse(x.exKey, reuse.value)} style={[s.reuse, { height: z.ctl - 6, backgroundColor: reuse.stale ? 'transparent' : on(0.16) }, reuse.stale && { borderWidth: 1, borderStyle: 'dashed', borderColor: on(0.26) }]}>
                  <Text style={[s.reuseIco, { color: p.onBand }]}>↺</Text>
                  <Text numberOfLines={1} style={[s.reuseTxt, { color: p.onBand }]}>{reuse.text}<Text style={[s.reuseRec, { color: on(0.76) }]}>{' · ' + reuse.rec}</Text></Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={{ flex: 1 }} />
          {logBtn}
        </View>
      )}
      {load && load.warn && <View style={s.warn}><Text style={[s.warnIco, { color: p.onBand }]}>△</Text><Text style={[s.warnTxt, { color: on(0.84) }]}>{load.warn}</Text></View>}
      {load && load.fill && open && (
        <Pressable testID={'deck-fill-' + x.exKey} accessibilityRole="button" onPress={() => h.fill(x.exKey, load.fill!.value)} style={[s.fill, { backgroundColor: load.fill.stale ? 'transparent' : on(0.16) }, load.fill.stale && { borderWidth: 1, borderStyle: 'dashed', borderColor: on(0.26) }]}>
          <Text style={[s.reuseIco, { color: p.onBand }]}>↺</Text>
          <Text style={[s.reuseTxt, { color: p.onBand }]}>{load.fill.text}<Text style={[s.reuseRec, { color: on(0.76) }]}>{'  ' + load.fill.rec}</Text></Text>
        </Pressable>
      )}
    </View>
  );
}

/** A move's name, with its swap, its minus and its check once logged. */
function NameRow({ x, z, p, controls, logged, h }: { x: ExCard; z: Sizes; p: Palette; controls: boolean; logged: boolean; h: Handlers }) {
  const s = styles;
  return (
    <View style={s.nameRow}>
      <Text style={[s.moveName, { flex: 1, fontSize: z.name, lineHeight: z.name * 1.22, color: p.onBand }]}>{plain(x.name)}</Text>
      {controls && x.swap && <Pressable testID={'deck-swap-' + x.exKey} accessibilityRole="button" accessibilityLabel="Swap this exercise" onPress={() => h.swap(x.swap!.secIdx, x.swap!.itemIdx)} style={[s.mic, { width: z.mic, height: z.mic, backgroundColor: on(0.14) }]}><Icon name="swap" size={16} color={p.onBand} /></Pressable>}
      {controls && x.skip && <Pressable testID={'deck-minus-' + x.exKey} accessibilityRole="button" accessibilityLabel="Skip this exercise" onPress={() => h.skip(x.name)} style={[s.mic, { width: z.mic, height: z.mic, backgroundColor: on(0.14) }]}><Icon name="minus" size={16} color={p.onBand} /></Pressable>}
      {logged && <Text style={[s.badge, { color: p.onBand }]}>✓</Text>}
    </View>
  );
}

/** A move's set rows, open: past four sets one at a time behind the pips (board P), the top set marked, the foot. */
function Rows({ x, rows, f, fv, foot, pip, p, h, onPip }: { x: ExCard; rows: SetRow[]; f: MoveFields; fv: FieldsView; foot: string | null; pip: number; p: Palette; h: Handlers; onPip: (s: number) => void }) {
  const s = styles;
  const pipped = rows.length > PIP_THRESHOLD;
  return (
    <View testID={'deck-rows-' + x.exKey} style={s.rows}>
      {pipped && (
        <View accessibilityLabel="Sets" style={s.pips}>
          {rows.map((r) => (
            <Pressable key={r.s} accessibilityRole="button" accessibilityLabel={'Set ' + (r.s + 1)} accessibilityState={{ selected: r.s === pip }} onPress={() => onPip(r.s)} style={[s.pip, { backgroundColor: r.s === pip ? p.onBand : on(0.16) }]}>
              <Text style={[s.pipText, { color: r.s === pip ? p.band : p.onBand }]}>{r.s + 1}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {rows.filter((r) => !pipped || r.s === pip).map((r, ri, shown) => {
        const rep = f.reps[r.s], cell = r.weight ? f.loads[r.s] : undefined;
        const isTop = !!cell && !!fv.top[r.s];
        return (
          <View key={r.s} style={[s.row, ri < shown.length - 1 && { borderBottomWidth: 1, borderBottomColor: on(0.14) }]}>
            <Text style={[s.rowNum, { color: on(0.72) }]}>{r.s + 1}</Text>
            <View style={[s.ctl, { borderColor: on(0.26), backgroundColor: on(0.1) }]}>
              <Pressable testID={'deck-minus-' + x.exKey + '-' + r.s} accessibilityRole="button" accessibilityLabel={'Set ' + (r.s + 1) + ', fewer'} onPress={() => h.step(x.exKey, r.s, -r.step)} style={[s.step, { backgroundColor: on(0.16) }]}><Text style={[s.stepText, { color: p.onBand }]}>−</Text></Pressable>
              <View style={s.val}>
                <TextInput
                  testID={'deck-rep-' + x.exKey + '-' + r.s} accessibilityLabel={'Set ' + (r.s + 1)} keyboardType="number-pad" selectTextOnFocus
                  value={rep ? rep.value : r.value} placeholder={rep ? rep.placeholder : r.placeholder} placeholderTextColor={on(0.72)}
                  onChangeText={(t) => h.rep(x.exKey, r.s, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}
                  style={[s.valText, s.field, { minWidth: 34, textAlign: 'center', color: p.onBand }]}
                />
                {!!r.suffix && <Text style={[s.suf, { color: on(0.72) }]}>{r.suffix}</Text>}
                {!!fv.delta[r.s] && <Text style={[s.delta, { color: p.onBand }]}>{fv.delta[r.s]}</Text>}
              </View>
              <Pressable testID={'deck-plus-' + x.exKey + '-' + r.s} accessibilityRole="button" accessibilityLabel={'Set ' + (r.s + 1) + ', more'} onPress={() => h.step(x.exKey, r.s, r.step)} style={[s.step, { backgroundColor: on(0.16) }]}><Text style={[s.stepText, { color: p.onBand }]}>+</Text></Pressable>
            </View>
            {r.weight && cell && (
              <View style={[s.wcell, { borderColor: isTop ? p.onBand : on(0.26), backgroundColor: on(0.1) }]}>
                {isTop && <Text style={[s.toppip, { backgroundColor: p.onBand, color: p.band }]}>Top</Text>}
                <TextInput
                  testID={'deck-setload-' + x.exKey + '-' + r.s} accessibilityLabel={'Set ' + (r.s + 1) + ' load, ' + r.weight.unit} keyboardType="decimal-pad" selectTextOnFocus
                  value={cell.value} placeholder={cell.placeholder} placeholderTextColor={on(0.6)}
                  onChangeText={(t) => h.setLoad(x.exKey, r.s, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}
                  style={[s.wcellVal, s.field, { flex: 1, textAlign: 'right', color: p.onBand }]}
                />
                <Text style={[s.wcellU, { color: on(0.72) }]}>{r.weight.unit}</Text>
              </View>
            )}
          </View>
        );
      })}
      {foot && (
        <View style={[s.rowFoot, { borderTopColor: on(0.14) }]}>
          <Text style={[s.footLbl, { color: on(0.72) }]}>{fv.footLabel}</Text>
          <Text style={[s.footVal, { color: p.onBand }]}>{fv.footValue}</Text>
        </View>
      )}
    </View>
  );
}

// Weights: every 600 and 800 of today's CSS is 700 here, as on This Week (ThisWeek.tsx): Helvetica Neue has neither.
const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4, paddingRight: 14, paddingBottom: 2, paddingLeft: 10 },
  round44: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', letterSpacing: -0.72, lineHeight: 26.4 },
  // The stage in its box. Up and down the box cuts the cards off at the stage's head and foot (deck.css clip-path
  // inset 0 -40px 0 -24px), the stage gives 14 more points at the right, and the dots stand 24 points past it.
  clip: { flex: 1, marginTop: 16 },
  clipV: { overflow: 'hidden' },
  stage: { flex: 1, marginHorizontal: 20 },
  stageV: { marginRight: 34 },
  card: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 28px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)' },
  face: { flex: 1 },
  bigcheck: { position: 'absolute', top: 88, right: -46, opacity: 0.18 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  numRow: { flexDirection: 'row', alignItems: 'baseline' },
  num: { fontFamily: DISPLAY, fontWeight: '700', letterSpacing: -1.2 },
  numOf: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  doneChip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999 },
  doneText: { fontFamily: TEXT, fontSize: 12, fontWeight: '700', lineHeight: 12 },
  acts: { flexDirection: 'row', gap: 6 },
  act: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  actAll: { paddingHorizontal: 13 },
  actAllText: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },
  name: { marginTop: 10, fontFamily: DISPLAY, fontWeight: '700', letterSpacing: -0.6 },
  meta: { marginTop: 4, fontFamily: TEXT, fontWeight: '700' },
  rule: { height: 1, marginTop: 12 },
  cue: { paddingTop: 10, fontFamily: TEXT },
  from: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 4, paddingRight: 4, paddingLeft: 12, borderRadius: 999 },
  fromB: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  fromText: { flex: 1, fontFamily: TEXT, fontSize: 12 },
  fromBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hole: { position: 'absolute', left: '50%', top: '46%', marginLeft: -100, marginTop: -100, transform: [{ rotate: '-13deg' }] },
  shard: { position: 'absolute', left: '50%', top: '46%' },
  // A field on a card: the box around it is the card's own, so the input adds no room of its own.
  field: { padding: 0, margin: 0 },

  // A move (deck.css .deck-work .exercise-item.ex-deck).
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moveName: { fontFamily: DISPLAY, fontWeight: '700', letterSpacing: -0.17 },
  mic: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badge: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
  dose: { marginTop: 2, fontFamily: DISPLAY, fontWeight: '700' },
  moveCue: { marginTop: 3, fontFamily: TEXT },
  chip: { marginTop: 2, fontFamily: TEXT, fontSize: 12, lineHeight: 15.6 },
  setLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  setHead: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
  setVal: { fontFamily: DISPLAY, fontWeight: '700' },
  setRpe: { fontFamily: TEXT, fontWeight: '700' },
  vary: { fontFamily: TEXT, fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 },
  caret: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rpeInfo: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  lineLog: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  log: { minWidth: 64, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  logText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  weightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  weight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  winput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10 },
  wval: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700' },
  wunit: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  reuse: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 999 },
  reuseIco: { fontSize: 15, fontWeight: '700', lineHeight: 15 },
  reuseTxt: { flexShrink: 1, fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  reuseRec: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  warn: { flexDirection: 'row', gap: 6, marginTop: 8 },
  warnIco: { fontSize: 12 },
  warnTxt: { flex: 1, fontFamily: TEXT, fontSize: 12, lineHeight: 16 },
  fill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 9, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  foldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foldVal: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  coolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skipped: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, paddingHorizontal: 14, marginVertical: 4, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.22)' },
  skippedLbl: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700' },
  skippedName: { flex: 1, fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', textDecorationLine: 'line-through' },
  skippedUndo: { fontFamily: TEXT, fontSize: 11, textDecorationLine: 'underline' },

  // The set rows (the session sheet's .exset-row, under deck.css).
  rows: { marginTop: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.16)' },
  pips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8 },
  pip: { minWidth: 34, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pipText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  rowNum: { width: 16, textAlign: 'center', fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  ctl: { flex: 1, flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  step: { width: 38, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700', lineHeight: 24 },
  val: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 5 },
  valText: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700' },
  suf: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  delta: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  wcell: { width: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, borderWidth: 1, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 7, minHeight: 36 },
  wcellVal: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '700' },
  wcellU: { fontFamily: TEXT, fontSize: 10, fontWeight: '700' },
  toppip: { position: 'absolute', top: -7, right: 6, fontFamily: TEXT, fontSize: 8, fontWeight: '700', paddingVertical: 1, paddingHorizontal: 4, borderRadius: 2, overflow: 'hidden' },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 8, borderTopWidth: 1 },
  footLbl: { fontFamily: TEXT, fontSize: 10, fontWeight: '700' },
  footVal: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },

  // Call it.
  callit: { marginTop: 22, gap: 10 },
  rpeRead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  rpeN: { fontFamily: DISPLAY, fontSize: 48, fontWeight: '700', lineHeight: 48 },
  rpeW: { flexShrink: 1, fontFamily: TEXT, fontSize: 16, fontWeight: '700' },
  slider: { height: 40 },
  track: { position: 'absolute', left: 0, right: 0, top: 17, height: 6, borderRadius: 3 },
  thumb: { position: 'absolute', top: 6, width: 28, height: 28, marginLeft: -14, borderRadius: 14, borderWidth: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.45)' },
  notesLbl: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },
  notes: { minHeight: 84, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, textAlignVertical: 'top' },
  notesText: { fontFamily: TEXT, fontSize: 16, lineHeight: 20 },

  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 14, paddingHorizontal: 20 },
  dotsV: { position: 'absolute', right: 10, top: 0, bottom: 0, width: 8, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  foot: { paddingTop: 12, paddingHorizontal: 20 },
  cta: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700', letterSpacing: -0.17 },

  // The session map and the RPE bubble.
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '78%', paddingTop: 18, paddingHorizontal: 16, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 12 },
  sheetTitle: { flex: 1, fontFamily: DISPLAY, fontSize: 20, fontWeight: '700' },
  x: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 2 },
  tile: { width: '48.8%', minHeight: 98, padding: 12, borderRadius: 16, gap: 2 },
  tileNum: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700' },
  tileKick: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  tileTitle: { fontFamily: TEXT, fontSize: 15, fontWeight: '700', lineHeight: 18 },
  tileState: { marginTop: 'auto', fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  bubble: { position: 'absolute', left: 24, right: 24, top: 170, padding: 20, borderRadius: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 14px rgba(0,0,0,0.12)' },
  bubbleK: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700' },
  bubbleLine: { fontFamily: TEXT, fontSize: 16, fontWeight: '700', lineHeight: 21.6, paddingTop: 6, paddingBottom: 12 },
  band: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  bandR: { width: 40, fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  bandL: { width: 76, fontFamily: TEXT, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  bandD: { flex: 1, fontFamily: TEXT, fontSize: 14, lineHeight: 18 },
  gotit: { marginTop: 14, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  gotitText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700' },
});
