// The swipe deck in the Expo app, as a view (MIGRATION.md phase 3, the first screen): the launch's grid, the stored
// state and the clock in, the day's deck out. The view is today's own two models (deck-model.ts and the session
// sheet's card model, ../day-detail/session-sections-model.ts, copies of the Angular app's held equal by a test), so
// every card, word and order here is D275's and D283's, unchanged. The Angular deck feeds those models through its
// bridge into the legacy page (deck.ts build() and open()); this feeds them from core's readers of the stored state
// and from deck-readers.ts. Nothing here writes a key: what the deck writes is deck-writes.ts (D289).
import { isRepExercise, isTimeExercise, isTrackableWeight } from '@ia/core/engine/exercise-kinds.ts';
import { exStoreKey, foldExAliasKeys } from '@ia/core/engine/exercise-library.ts';
import { dayStoreKey, readDayLogs, setDraftOf } from '@ia/core/engine/state-day-log.ts';
import { dayStatus } from '@ia/core/engine/state-day-status.ts';
import { entryDay, readLiftLog } from '@ia/core/engine/state-lift-log.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { type ExCard, type ExEntry, type ExSection, type SectionReads, sectionsView } from '../day-detail/session-sections-model';
import type { Palette } from '../theme';
import { secRounds } from '../this-week/week-readers';
import { type DeckCard, deckCards, deckOpens } from './deck-model';
import {
  crossProgLastEntry, exControlFlags, isKBExercise, isStaleTs, parseRx, recencyLabel, rxSuffix, setsSubLabel, setsSummary, setsVaried,
  stripLeadingSets, swapOriginOf, toDispW,
} from './deck-readers';
import { type MoveFields, fieldsOf } from './set-fields';

/** A colour under the deck's shade of black (deck.css --deck-shade over --lift, --hip, --core). */
export function shaded(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number): number => Math.round(v * (1 - alpha));
  return 'rgb(' + c((n >> 16) & 255) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
}
/** A card's ground by its kind (call 4): a lift or a round, hip work, core work, the finish. */
export function toneColor(p: Pick<Palette, 'lift' | 'hip' | 'core' | 'band' | 'mark' | 'deckShade'>, tone: string): string {
  if (tone === 'finish') return p.band;
  if (tone === 'skip') return p.mark;
  return shaded(tone === 'hip' ? p.hip : tone === 'core' ? p.core : p.lift, p.deckShade);
}

/** A scheduled day, as far as the deck reads it (deck.ts DeckDay). */
export interface DeckDay { title?: string; rest?: unknown; sections?: ExSection[] }
/** The program a launch hands back, as far as the deck reads it. */
export interface DeckProgram {
  id: string;
  cfg?: { unit?: string } | null;
  weeks: Record<string, Record<string, DeckDay | null | undefined> | undefined>;
}

/**
 * The stale-load warning of one open of the deck (the page's _staleWarnShown and _staleWarnSrc): it speaks once, on
 * the first stale load drawn, and a redraw after an edit does not speak it again.
 */
export interface StaleWarn { shown: boolean; src: string }

/** The lift log as the page holds it after its launch: old keys folded into today's, on a copy. */
function liftLog(store: StateStore, programId: string): Record<string, { entries?: ExEntry[] } | undefined> {
  const log = JSON.parse(JSON.stringify(readLiftLog(store, programId) || {})) as Record<string, { entries?: ExEntry[] } | undefined>;
  // Today's page folds the active program's log as it launches and stores it (bug-report-init.ts), and so does this
  // app's launch (week-screen.ts foldLiftLog). A log already folded comes through this unchanged; it stays for a
  // store drawn without a launch.
  try { foldExAliasKeys(log as never); } catch { /* an unreadable row draws as it is */ }
  return log;
}

/**
 * What the cards read (the Angular sectionReads, session-sections-reads.ts), from the store and the grid in hand:
 * the page's globals are `prog`, `week` and `dayKey`, its clock is `nowMs`, and its once-per-open stale warning
 * (two globals the deck resets as it opens) is `warn`: new for each call unless the caller keeps one for the open.
 */
export function deckReads(store: StateStore, prog: DeckProgram, week: number, dayKey: string, nowMs: number, warn: StaleWarn = { shown: false, src: '' }): SectionReads {
  const id = prog.id;
  const log = liftLog(store, id);
  const unit = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
  const wk = prog.weeks[week];
  const day = (wk && wk[dayKey]) || null;
  return {
    exKey: (name) => exStoreKey(name as string),
    entries: (k) => (log[k] && log[k]!.entries) || [],
    crossLast: (k) => crossProgLastEntry(store, id, k),
    week,
    dayKey,
    entryDay: (e) => entryDay(e as { day?: string; ts?: number }),
    unit,
    isTime: (n) => isTimeExercise(n),
    isKB: (n) => isKBExercise(n),
    isRep: (n) => isRepExercise(n),
    isTrackable: (n) => isTrackableWeight(n),
    hasProgram: true,
    daySection: (i) => (day && (day.sections || [])[i]) || null,
    controlFlags: (sec, i, it) => exControlFlags(sec, i, it),
    swapOrigin: (n) => swapOriginOf(store, id, week, dayKey, n),
    parseRx: (d, n) => parseRx(d, n),
    rxSuffix: (rx) => rxSuffix(rx),
    // The page caches each prescription for its set handlers. The deck reads it again from the card (Deck.tsx rxOf).
    cacheRx: () => {},
    setsSummary: (rx, w, r) => setsSummary(rx, w, r),
    setsSubLabel: (rx, w, r, logged) => setsSubLabel(rx, w, r, logged),
    setsVaried: (a) => setsVaried(a),
    readDraft: (k) => setDraftOf(store, id, week, dayKey, k) as { r?: unknown[]; w?: unknown[]; L?: string } | null,
    toDispW: (x) => toDispW(x, unit),
    isStale: (ts) => isStaleTs(ts, nowMs),
    recency: (ts, form) => recencyLabel(ts, form, nowMs),
    warnShown: () => warn.shown,
    warnSrc: () => warn.src,
    speakWarn: (s) => { warn.shown = true; warn.src = s; },
    stripLeadingSets: (d) => stripLeadingSets(d),
    secRounds: (sec) => secRounds(sec as never),
  };
}

/** The day's cards: the deck's model over the session sheet's cards for the whole day (deck.ts build()). */
export function dayCards(store: StateStore, prog: DeckProgram, week: number, dayKey: string, nowMs: number, warn?: StaleWarn): DeckCard[] {
  const wk = prog.weeks[week];
  const day = (wk && wk[dayKey]) || null;
  if (!day || day.rest) return [];
  const secs = day.sections || [];
  const views = sectionsView(secs, 0, deckReads(store, prog, week, dayKey, nowMs, warn));
  return deckCards(secs, views, (s) => secRounds(s as never));
}

/** A day opened as a deck: what deck.ts open() sets before it draws. */
export interface DeckView {
  week: number;
  dayKey: string;
  /** The day's title, 'Training' when it has none. */
  title: string;
  cards: DeckCard[];
  /** The card the deck opens on: the first that is neither skipped nor logged, else the finish. */
  first: number;
  /** Call it: the day's stored effort when it holds one from 1 to 10, else 7; and its notes. */
  rpe: number;
  notes: string;
  /** The day is marked complete. */
  dayDone: boolean;
}

/** What This Week hands the deck it opens: the launch's grid, the week and the day, the day as first drawn, and that draw's stale warning. */
export interface DeckOpen { prog: DeckProgram; week: number; dayKey: string; view: DeckView; warn: StaleWarn }

/**
 * The deck for a day, or null when Start does not open one: a rest day, a day the grid does not hold, or a day whose
 * only card is its cool down (today's app opens the day sheet there, which this app does not draw yet).
 */
export function deckView(store: StateStore, prog: DeckProgram, week: number, dayKey: string, nowMs: number, warn?: StaleWarn): DeckView | null {
  const wk = prog.weeks[week];
  const day = (wk && wk[dayKey]) || null;
  if (!day || day.rest) return null;
  const cards = dayCards(store, prog, week, dayKey, nowMs, warn);
  if (!deckOpens(cards)) return null;
  const entry = (readDayLogs(store, prog.id) as unknown as Record<string, { rpe?: unknown; notes?: unknown } | undefined>)[dayStoreKey(week, dayKey)] || null;
  const stored = entry && entry.rpe != null && entry.rpe !== '' ? +(entry.rpe as string) : NaN;
  const first = cards.findIndex((c) => c.kind !== 'finish' && !c.skipped && !c.logged);
  return {
    week, dayKey,
    title: day.title || 'Training',
    cards,
    first: first < 0 ? cards.length - 1 : first,
    rpe: stored >= 1 && stored <= 10 ? stored : 7,
    notes: entry && typeof entry.notes === 'string' ? entry.notes : '',
    dayDone: dayStatus(store, prog.id, week, dayKey) === 'complete',
  };
}

/**
 * What hides a card's words while it is not the top card: a cover of the card's own colour, by what the card is doing.
 * 'rest' is a plain card (the fan, and the card behind while nothing moves), 'drag' the card behind as a finger pulls
 * the top one, 'leave' the card behind as Done, next one sends the top one away. The top card has none, whatever else
 * is going on, so its words always show. The screen draws a fresh cover whenever the kind changes.
 */
export type CoverKind = 'rest' | 'drag' | 'leave';
export function coverOf(k: number, top: number, peek: number, done: 'lift' | 'leave' | null, vert = false): CoverKind | null {
  if (k === top) return null;
  // Up and down every card is drawn in full on its own slot (deck.ts faceStyle: opacity 1), a stride from the next,
  // and only the top card is in the stage at rest: no card wears a cover.
  if (vert) return null;
  if (k !== peek) return 'rest';
  if (done === 'leave') return 'leave';
  return done ? 'rest' : 'drag';
}

/** Where a card stands on the stage: its shift in points, its scale, its turn in degrees, and whether it is drawn. */
export interface Pose { x: number; y: number; s: number; r: number; shown: boolean }
/**
 * Where card k stands, sideways, with card `top` on top of `n` and the top card dragged `dx` points (deck.ts
 * cardStyle): the top card under the finger, turned a degree for every 26 points; the card a drag of more than two
 * points raises, on its way to the top card's place as the drag covers `rise` points (the next card from the fan's
 * first seat, the one before from 92% behind the top card); `fan` cards fanned behind, each 15 points across, 7 up,
 * 3.5% smaller and 1.6 degrees round; every other card not drawn, standing where the top card stands (today's
 * visibility: hidden; transform: none).
 */
export function poseOf(k: number, top: number, n: number, dx: number, fan: number, rise: number): Pose {
  const pos = (((k - top) % n) + n) % n;
  if (pos === 0) return { x: dx, y: 0, s: 1, r: dx / 26, shown: true };
  const peek = n > 1 && Math.abs(dx) > 2 ? (top + (dx < 0 ? 1 : -1) + n) % n : -1;
  if (k === peek) {
    const q = Math.min(1, Math.abs(dx) / rise);
    const f = pos === 1 ? { x: 15, y: -7, s: 0.965, r: 1.6 } : { x: 0, y: 0, s: 0.92, r: 0 };
    const l = (a: number, b: number): number => a + (b - a) * q;
    return { x: l(f.x, 0), y: l(f.y, 0), s: l(f.s, 1), r: l(f.r, 0), shown: true };
  }
  if (pos <= fan) return { x: pos * 15, y: pos * -7, s: 1 - pos * 0.035, r: pos * 1.6, shown: true };
  return { x: 0, y: 0, s: 1, r: 0, shown: false };
}

/** What a card has left to travel to where it comes to rest: points across and up, its scale as a ratio, degrees. */
export interface Travel { x: number; y: number; s: number; r: number }
/**
 * A card's travel as the deck goes from card `from` on top to card `to`, the top card let go at `dx` (deck.ts go:
 * today's cards ease to their new places by cardStyle's transitions, they do not jump). Null for a card that is not
 * drawn where it comes to rest, which goes at once as today's does, and for one that does not move.
 */
export function travelOf(k: number, from: number, to: number, n: number, dx: number, fan: number, rise: number): Travel | null {
  const a = poseOf(k, from, n, dx, fan, rise), b = poseOf(k, to, n, 0, fan, rise);
  if (!b.shown) return null;
  const t = { x: a.x - b.x, y: a.y - b.y, s: a.s / b.s, r: a.r - b.r };
  return t.x || t.y || t.s !== 1 || t.r ? t : null;
}

// ── The double tap and the up and down pager (D275 call 1; deck.ts down, move, up, slide and cardStyle, vert) ──

/** Two taps inside this many milliseconds switch the deck between sideways and up and down (deck.ts DOUBLE_TAP). */
export const DOUBLE_TAP = 320;
/** A press is a tap when it ends within this many points of where it began, across and down (deck.ts up). */
export const TAP_SLOP = 6;
/** Up and down, the card coming in stands one card height and this many points from the top card (deck.ts cardStyle). */
export const PAGER_GAP = 14;

/** Whether a press that moved `dx` across and `dy` down by the time it ended is a tap. */
export function isTap(dx: number, dy: number): boolean {
  return Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP;
}

/**
 * A tap at `now` milliseconds, the tap before it at `last` (null when there is none to pair with): whether the two
 * turn the deck, and the tap to remember. A turn clears the clock, so a third tap begins a pair of its own.
 */
export function tapped(last: number | null, now: number): { turn: boolean; last: number | null } {
  return last !== null && now - last < DOUBLE_TAP ? { turn: true, last: null } : { turn: false, last: now };
}

/** Where a card stands up and down: its shift down the stage in points, and whether it is drawn. */
export interface PagerPose { y: number; shown: boolean }
/**
 * Where card k stands, up and down, with card `top` on top of `n`, the top card dragged `dy` points down a stage `h`
 * points tall: the top card under the finger, with no turn; the card a drag of more than two points brings in, one
 * card height and 14 points below the top card going on and above it going back, following the finger; no fan, so
 * every other card is not drawn. On a deck of two the other card is both the next and the one before: it comes from
 * below on a pull up and from above on a pull down (today's keeps it below either way, and the two cross as the top
 * card is let go; not carried, docs/decisions/swipe-deck.md).
 */
export function pagerPose(k: number, top: number, n: number, dy: number, h: number): PagerPose {
  const pos = (((k - top) % n) + n) % n;
  if (pos === 0) return { y: dy, shown: true };
  const peek = n > 1 && Math.abs(dy) > 2 ? (top + (dy < 0 ? 1 : -1) + n) % n : -1;
  if (k !== peek) return { y: 0, shown: false };
  return { y: (dy < 0 ? h + PAGER_GAP : -(h + PAGER_GAP)) + dy, shown: true };
}

/**
 * Where a card stands while the pager slides (deck.ts slide: 290 ms on the settle's curve): the screen keeps each
 * card on a slot, a card height and the gap apart, and the pager at a page; a card `slots` slots past the page the
 * pager is on stands that many strides down, plus the drag. A slide takes the page on by one and the drag to
 * nothing together, so the top card goes from where it was let go to one stride away and the card coming in lands
 * on nothing, and when the slide ends no card has anywhere left to move.
 */
export function pagerY(slots: number, h: number, drag: number): number {
  return slots * (h + PAGER_GAP) + drag;
}

/**
 * How many slots card `k` stands from the top card `top` of `n`, up and down: 0 itself, 1 the next card, -1 the one
 * before, and so on, the nearer way round. On a deck of two the other card is both the next and the one before, and
 * stands `two` slots on: 1, or -1 while the finger pulls down. It is also how far the page goes for a jump from
 * card `top` to card `k` (a dot, a tile of the map): the page moves and every card keeps the slot it stands on, so
 * the cards in sight are moved by the page alone.
 */
export function slotsFrom(k: number, top: number, n: number, two = 1): number {
  const o = (((k - top) % n) + n) % n;
  if (o === 0) return 0;
  if (n === 2) return two;
  return o > n / 2 ? o - n : o;
}

/** A drag let go `d` points from where it began: on to the next card (1), back to the one before (-1), or neither (0). */
export function swipeTo(d: number, line: number): 1 | -1 | 0 {
  return d < -line ? 1 : d > line ? -1 : 0;
}

/** How far a card's body is scrolled, and how far it can scroll: both 0 for a card that fits its box. */
export interface BodyScroll { y: number; max: number }
/**
 * Whether the pager takes a drag that has moved `dx` across and `dy` down. It takes one that has gone 8 points and
 * is more down than across (the sideways swipe's own test, turned). A tall card's body scrolls first (deck.ts move:
 * taller than its box by more than 2 points): the pager takes the drag only where the body has no further to go
 * that way, at its foot for a pull up and at its head for a pull down.
 */
export function pagerTakes(dx: number, dy: number, body: BodyScroll): boolean {
  if (Math.abs(dy) <= 8 || Math.abs(dy) <= Math.abs(dx) * 1.2) return false;
  if (body.max <= 2) return true;
  return dy < 0 ? body.y >= body.max - 1 : body.y <= 1;
}

/** Every move's fields of a deck, by the move's key. */
export type Fields = Record<string, MoveFields>;

/** Every move's card of a day's deck, in order. */
export function movesOf(cards: DeckCard[]): ExCard[] {
  return cards.flatMap((c) => c.views.flatMap((v) => (v.kind === 'section' ? v.body.items : []))).filter((x): x is ExCard => x.kind === 'card');
}

/** Each move's fields as its card draws them: at the deck's opening, and again after a skip or its undo. */
export function freshFields(cards: DeckCard[]): Fields {
  const out: Fields = {};
  for (const x of movesOf(cards)) out[x.exKey] = fieldsOf(x);
  return out;
}

/**
 * The cards with what this open has logged: a move is logged once Log has left it so, and a card when each of its
 * moves is (the page reads the same from the store after each tap, deck.ts touched()).
 */
export function loggedCards(cards: DeckCard[], fields: Fields): DeckCard[] {
  return cards.map((c) => {
    if (!c.moves.length) return c;
    const moves = c.moves.map((m) => ({ ...m, logged: fields[m.exKey] ? fields[m.exKey]!.logged : m.logged }));
    return { ...c, moves, logged: moves.every((m) => m.logged) };
  });
}
