// The swipe deck in the Expo app against today's deck (tests/integration/native-deck.test.ts and the sweep of that
// name). Two draws of one day of one launch of a test phone (support/stored-state.ts):
//
//   pageDay    today's: the Angular deck's own models (frontends/app/src/app/screens/deck/deck-model.ts over
//              day-detail/session-sections-model.ts) fed by the legacy page's own functions through sectionReads, with
//              the page's state set as deck.ts open() sets it before it draws, and put back afterwards.
//   nativeDay  the Expo app's: frontends/native/src/deck/deck-screen.ts over core's store, the phone's keys in it, and
//              over the grid its own launch hands back (support/native-this-week.ts nativeGrid).
//
// Each day is compared twice: its cards (every card of every training day, the cool down's alone included), and the
// deck Start opens (its title, the card it opens on, Call it's effort and notes, whether the day is done), or none.
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type DeckCard, deckCards, deckOpens } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { type DeckProgram, type DeckView, dayCards, deckView } from '../../frontends/native/src/deck/deck-screen.ts';
import { launchNow, nativeGrid, phoneStore } from './native-this-week.ts';
import type { Phone } from './stored-state.ts';

/** One day, drawn: its cards, and the deck Start opens, or null where it opens none. */
export interface DayDeck { cards: DeckCard[]; view: DeckView | null }

const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
export const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** What a draw of today's deck made the page hold, so a test can say which readers a comparison went through. */
export interface Went { drafts: number; cross: number; warned: number }

/**
 * Today's deck for a day, made on the page itself: deck.ts open() and build(), each bridge call made on the page.
 * The page's own state (the week and day in hand, the stale warning, the unit, the prescription cache) is put back,
 * so a history walks on as if the deck had never been opened.
 */
export function pageDay(P: Phone, week: number, dayKey: string, went?: Went): DayDeck {
  const f = <T>(name: string): T => P.ev(name) as T;
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  const prog = P.prog;
  const day = (prog && prog.weeks && prog.weeks[week] && prog.weeks[week][dayKey]) || null;
  if (!day || day.rest) return { cards: [], view: null };
  const win = P.IA.window as Record<string, unknown>;
  const was = { week: f<number>('currentWeek'), day: f<string | null>('currentDayKey'), shown: f<boolean>('_staleWarnShown'), src: f<string>('_staleWarnSrc'), unit: win['_unitLabel'] };
  const cache = f<Record<string, unknown>>('_rxCache'), cached = JSON.stringify(cache);
  try {
    // What open() sets before it draws: the stale warning once per open, the unit, the active day; and the week in
    // view, which This Week has set by the time Start is tapped.
    call('_setStaleWarnShown', false);
    call('_setStaleWarnSrc', '');
    win['_unitLabel'] = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
    call('_setCurrentWeek', week);
    call('_setCurrentDayKey', dayKey);
    const reads = sectionReads({ call, global: f });
    if (went) {
      const draft = reads.readDraft, cross = reads.crossLast, speak = reads.speakWarn;
      reads.readDraft = (k) => { const x = draft(k); if (x) went.drafts++; return x; };
      reads.crossLast = (k) => { const x = cross(k); if (x) went.cross++; return x; };
      reads.speakWarn = (s) => { went.warned++; speak(s); };
    }
    const secs = (day.sections || []) as ExSection[];
    const cards = plain(deckCards(secs, sectionsView(secs, 0, reads), (s) => call<number | null>('_secRounds', s)));
    if (!deckOpens(cards)) return { cards, view: null };
    const entry = (call<Record<string, { rpe?: unknown; notes?: unknown } | undefined>>('getLogs'))[call<string>('logKey', week, dayKey)] || null;
    const stored = entry && entry.rpe != null && entry.rpe !== '' ? +(entry.rpe as string) : NaN;
    const first = cards.findIndex((c) => c.kind !== 'finish' && !c.skipped && !c.logged);
    return {
      cards,
      view: {
        week, dayKey, title: day.title || 'Training', cards, first: first < 0 ? cards.length - 1 : first,
        rpe: stored >= 1 && stored <= 10 ? stored : 7,
        notes: entry && typeof entry.notes === 'string' ? entry.notes : '',
        dayDone: call('statusOf', week, dayKey) === 'complete',
      },
    };
  } finally {
    call('_setCurrentWeek', was.week);
    call('_setCurrentDayKey', was.day);
    call('_setStaleWarnShown', was.shown);
    call('_setStaleWarnSrc', was.src);
    win['_unitLabel'] = was.unit;
    for (const k of Object.keys(cache)) delete cache[k];
    Object.assign(cache, JSON.parse(cached));
  }
}

/** The Expo app's deck for the same day, over the grid and the store given. */
export function nativeDay(store: StateStore, grid: DeckProgram, week: number, dayKey: string, nowMs: number): DayDeck {
  return plain({ cards: dayCards(store, grid, week, dayKey, nowMs), view: deckView(store, grid, week, dayKey, nowMs) });
}

/** What the comparisons held, so a test can say it compared something of each kind. */
export interface Seen {
  days: number; decks: number; coolOnly: number; cards: number; lift: number; round: number; block: number; cool: number;
  logged: number; skipped: number; swapped: number; added: number; moves: number; rows: number; loads: number; reuse: number; stale: number;
  drafts: number; cross: number; warned: number; done: number; noted: number;
}
export const seen = (): Seen => ({
  days: 0, decks: 0, coolOnly: 0, cards: 0, lift: 0, round: 0, block: 0, cool: 0, logged: 0, skipped: 0, swapped: 0, added: 0, moves: 0, rows: 0,
  loads: 0, reuse: 0, stale: 0, drafts: 0, cross: 0, warned: 0, done: 0, noted: 0,
});

/**
 * Every training day of every week the phone's program holds: the two draws, handed to `same` to compare. The Expo
 * app draws over its own launch's grid, from a store holding the phone's keys. Returns what the draws held.
 */
export function everyDeck(P: Phone, same: (native: DayDeck, page: DayDeck, what: string) => void, tally: Seen = seen()): Seen {
  const store = phoneStore(P);
  const grid = nativeGrid(P, store) as unknown as DeckProgram;
  const now = launchNow(P).getTime();
  const weeks = Object.keys(P.prog.weeks).map(Number).sort((a, b) => a - b);
  for (const w of weeks) for (const d of DAYS7) {
    const day = P.prog.weeks[w][d];
    if (!day || day.rest) continue;
    const went: Went = { drafts: 0, cross: 0, warned: 0 };
    const page = pageDay(P, w, d, went);
    same(nativeDay(store, grid, w, d, now), page, 'week ' + w + ', ' + d);
    tally.days++;
    tally.drafts += went.drafts; tally.cross += went.cross; tally.warned += went.warned;
    if (page.view) { tally.decks++; if (page.view.dayDone) tally.done++; if (page.view.notes) tally.noted++; } else if (page.cards.length) tally.coolOnly++;
    for (const c of page.cards) {
      if (c.kind === 'finish') continue;
      tally.cards++;
      tally[c.kind]++;
      if (c.logged) tally.logged++;
      if (c.skipped) tally.skipped++;
      if (c.swappedFrom) tally.swapped++;
      for (const v of c.views) if (v.kind === 'section') for (const x of v.body.items) {
        if (x.kind !== 'card') continue;
        tally.moves++;
        if (x.added) tally.added++;
        if (x.log && x.log.sets) tally.rows += x.log.sets.rows.length;
        if (x.log && x.log.load) tally.loads++;
        if (x.log && x.log.load && x.log.load.reuse) { tally.reuse++; if (x.log.load.reuse.stale) tally.stale++; }
      }
    }
  }
  return tally;
}
