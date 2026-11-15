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
export function coverOf(k: number, top: number, peek: number, done: 'lift' | 'leave' | null): CoverKind | null {
  if (k === top) return null;
  if (k !== peek) return 'rest';
  if (done === 'leave') return 'leave';
  return done ? 'rest' : 'drag';
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
