// The swipe deck in the Expo app, as a view (MIGRATION.md phase 3, the first screen): the launch's grid, the stored
// state and the clock in, the day's deck out. The view is today's own two models (deck-model.ts and the session
// sheet's card model, ../day-detail/session-sections-model.ts, copies of the Angular app's held equal by a test), so
// every card, word and order here is D275's and D283's, unchanged. The Angular deck feeds those models through its
// bridge into the legacy page (deck.ts build() and open()); this feeds them from core's readers of the stored state
// and from deck-readers.ts. Read only (D287, until the session D289 names): nothing here writes a key.
import { isRepExercise, isTimeExercise, isTrackableWeight } from '@ia/core/engine/exercise-kinds.ts';
import { exStoreKey, foldExAliasKeys } from '@ia/core/engine/exercise-library.ts';
import { dayStoreKey, readDayLogs, setDraftOf } from '@ia/core/engine/state-day-log.ts';
import { dayStatus } from '@ia/core/engine/state-day-status.ts';
import { entryDay, readLiftLog } from '@ia/core/engine/state-lift-log.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { type ExEntry, type ExSection, type SectionReads, sectionsView } from '../day-detail/session-sections-model';
import type { Palette } from '../theme';
import { secRounds } from '../this-week/week-readers';
import { type DeckCard, deckCards, deckOpens } from './deck-model';
import {
  crossProgLastEntry, exControlFlags, isKBExercise, isStaleTs, parseRx, recencyLabel, rxSuffix, setsSubLabel, setsSummary, setsVaried,
  stripLeadingSets, swapOriginOf, toDispW,
} from './deck-readers';

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

/** The lift log as the page holds it after its launch: old keys folded into today's, on a copy, never written back. */
function liftLog(store: StateStore, programId: string): Record<string, { entries?: ExEntry[] } | undefined> {
  const log = JSON.parse(JSON.stringify(readLiftLog(store, programId) || {})) as Record<string, { entries?: ExEntry[] } | undefined>;
  // Today's page folds the active program's log as it launches and stores it (bug-report-init.ts). This app's copy
  // is read only, so the same fold is made here on the copy in hand: a log already folded comes through unchanged.
  try { foldExAliasKeys(log as never); } catch { /* an unreadable row draws as it is */ }
  return log;
}

/**
 * What the cards read (the Angular sectionReads, session-sections-reads.ts), from the store and the grid in hand:
 * the page's globals are `prog`, `week` and `dayKey`, its clock is `nowMs`, and its once-per-open stale warning
 * (two globals the deck resets as it opens) is held here, new for each call.
 */
export function deckReads(store: StateStore, prog: DeckProgram, week: number, dayKey: string, nowMs: number): SectionReads {
  const id = prog.id;
  const log = liftLog(store, id);
  const unit = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
  const wk = prog.weeks[week];
  const day = (wk && wk[dayKey]) || null;
  let shown = false, src = '';
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
    // The page caches each prescription for its set handlers. Nothing here logs yet, so nothing reads one.
    cacheRx: () => {},
    setsSummary: (rx, w, r) => setsSummary(rx, w, r),
    setsSubLabel: (rx, w, r, logged) => setsSubLabel(rx, w, r, logged),
    setsVaried: (a) => setsVaried(a),
    readDraft: (k) => setDraftOf(store, id, week, dayKey, k) as { r?: unknown[]; w?: unknown[]; L?: string } | null,
    toDispW: (x) => toDispW(x, unit),
    isStale: (ts) => isStaleTs(ts, nowMs),
    recency: (ts, form) => recencyLabel(ts, form, nowMs),
    warnShown: () => shown,
    warnSrc: () => src,
    speakWarn: (s) => { shown = true; src = s; },
    stripLeadingSets: (d) => stripLeadingSets(d),
    secRounds: (sec) => secRounds(sec as never),
  };
}

/** The day's cards: the deck's model over the session sheet's cards for the whole day (deck.ts build()). */
export function dayCards(store: StateStore, prog: DeckProgram, week: number, dayKey: string, nowMs: number): DeckCard[] {
  const wk = prog.weeks[week];
  const day = (wk && wk[dayKey]) || null;
  if (!day || day.rest) return [];
  const secs = day.sections || [];
  const views = sectionsView(secs, 0, deckReads(store, prog, week, dayKey, nowMs));
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

/**
 * The deck for a day, or null when Start does not open one: a rest day, a day the grid does not hold, or a day whose
 * only card is its cool down (today's app opens the day sheet there, which this app does not draw yet).
 */
export function deckView(store: StateStore, prog: DeckProgram, week: number, dayKey: string, nowMs: number): DeckView | null {
  const wk = prog.weeks[week];
  const day = (wk && wk[dayKey]) || null;
  if (!day || day.rest) return null;
  const cards = dayCards(store, prog, week, dayKey, nowMs);
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
