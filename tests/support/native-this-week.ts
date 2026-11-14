// This Week in the Expo app against today's screen (tests/integration/native-this-week.test.ts and the sweep of that
// name). Two draws of one launch of a test phone (support/stored-state.ts):
//
//   pageView    today's: the Angular screen's own model (frontends/app/src/app/screens/week-view/week-view-model.ts)
//               fed by the legacy page's own functions, each called as week-view.ts render() calls it through the bridge.
//   nativeView  the Expo app's: frontends/native/src/this-week/week-screen.ts over core's store, the phone's keys in it.
//
// Both draw the grid the page holds (activeProg, what refreshProgram handed back), so the two can be compared on every
// launch of a history; the Expo app's own source of the grid, the stored one, is checked apart from this.
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type WeekDeps, type WeekInput, type WeekView, liveTitle, weekView } from '../../frontends/app/src/app/screens/week-view/week-view-model.ts';
import { wildcardSub } from '../../frontends/app/src/app/screens/day-detail/sheet-marks-model.ts';
import { type ScreenProgram, drawWeek, midnight } from '../../frontends/native/src/this-week/week-screen.ts';
import type { Phone } from './stored-state.ts';

/** The launch's clock, as the page reads it (pinClock). */
export function launchNow(P: Phone): Date {
  return new Date(P.ev('Date.now()') as number);
}

/** The grid the page holds, as plain data. */
export function pageGrid(P: Phone): ScreenProgram {
  return JSON.parse(JSON.stringify(P.prog)) as ScreenProgram;
}

/**
 * The title the Angular screen shows at a launch (week-view.ts render): the legacy currentWeek is the week holding
 * today then, so the title holding today (liveTitle). A walker that has since opened another week's day has moved
 * currentWeek, which the Expo app does not have; `bootWeek` says whether the page still sits where it launched.
 */
export function pageShown(P: Phone): number {
  const prog = P.prog;
  const total = prog.totalWeeks || 6;
  const weekMon: Date | null = prog.startDate ? P.ev('getWeekMonday')(prog.startDate) : null;
  return liveTitle(weekMon, midnight(launchNow(P)), total, P.ev('calcCurrentWeek()'));
}
/** The legacy currentWeek is still the week holding today, as a launch leaves it. */
export function bootWeek(P: Phone): boolean {
  return P.ev('currentWeek') === P.ev('calcCurrentWeek()');
}

/** Today's screen for a title and a picked column: week-view.ts render(), its bridge calls made on the page itself. */
export function pageView(P: Phone, shown: number, picked: number | null, gps: boolean): WeekView {
  const f = <T>(name: string): T => P.ev(name) as T;
  const prog = P.prog;
  const totalWeeks = prog.totalWeeks || 6;
  const today = midnight(launchNow(P));
  const input: WeekInput = {
    prog, shown, picked, actualWeek: P.ev('calcCurrentWeek()'), today,
    weekMon: prog.startDate ? f<(s: string) => Date>('getWeekMonday')(prog.startDate) : null,
    completed: P.ev('getCompleted()'),
    logs: P.ev('getLogs()'),
    parts: P.ev('getPartSkips()'),
    dayFull: P.ev('DAY_FULL'),
    gps,
  };
  const regions = f<Record<string, { label?: string } | undefined>>('INJURY_REGIONS');
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  const deps: WeekDeps = {
    weekRange: (ov) => call('overlayWeekRange', prog, ov, totalWeeks),
    parseDate: (iso) => call('_parseLocalDate', iso),
    isTravel: (day) => call('dayIsTravel', day),
    beforeStart: (w, d) => call('dayBeforeStart', prog, w, d),
    regionLabel: (r) => (regions[r] || {}).label,
    icon: (n, s) => call('asyIcon', n, s),
    liftFocus: (t) => call('liftFocusCode', t),
    runChip: (sub, key, type) => call('runSessionCode', sub, key, type),
    wildcardOn: (w, d) => call('wildcardOn', w, d),
    statusOf: (w, d) => call('statusOf', w, d),
    heroSummary: (day) => call('heroSummary', day),
    sessionTime: (day) => call('sessionTimeEst', day),
    restTip: () => call('restDayTip'),
    restLines: (rl) => call('restLogLines', rl),
    streak: () => call('computeStreak'),
    wildcardSub: (w, k) => (k ? wildcardSub(call('wildcardOn', w, k), (prog && prog.weeks && prog.weeks[w] ? prog.weeks[w][k] : null)) : null),
    liveInjury: () => ((call<{ patch?: { injury?: { region: string } } } | null>('_liveInjuryOverlay') || {}).patch || {}).injury || null,
    alignment: () => call('progAlignment', prog),
    shortDay: (iso) => call('_fmtStartDay', iso),
    completedKey: (w, d) => call('completedKey', w, d),
    logKey: (w, d) => call('logKey', w, d),
  };
  return JSON.parse(JSON.stringify(weekView(input, deps))) as WeekView;
}

/** The phone's keys in a store of core's (the plain map unless one is given), as the Expo app holds them. */
export function phoneStore(P: Phone, store: StateStore = memoryStore()): StateStore {
  for (const [k, v] of Object.entries(P.dump())) store.set(k, v);
  return store;
}

/** The Expo app's screen for the same title and column, over the grid given (the page's, to compare the two). */
export function nativeView(store: StateStore, grid: ScreenProgram, now: Date, shown: number | null, picked: number | null, gps: boolean): WeekView {
  return JSON.parse(JSON.stringify(drawWeek(store, grid, now, { shown, picked }, gps).view)) as WeekView;
}

/** How many draws a comparison made, by what they held, so a test can say it compared something. */
export interface Seen { draws: number; cards: number; rests: number; done: number; skipped: number; wild: number; injury: number; travel: number; race: number }
export const seen = (): Seen => ({ draws: 0, cards: 0, rests: 0, done: 0, skipped: 0, wild: 0, injury: 0, travel: 0, race: 0 });

/**
 * Every title of the program, each with the launch's own pick and with each of the seven columns picked: the two draws,
 * handed to `same` to compare. Returns what the draws held.
 */
export function everyDraw(P: Phone, same: (native: WeekView, page: WeekView, what: string) => void, tally: Seen = seen()): Seen {
  const grid = pageGrid(P);
  const store = phoneStore(P);
  const now = launchNow(P);
  const total = grid.totalWeeks || 6;
  for (const gps of [true, false]) {
    for (let shown = 1; shown <= total + 1; shown++) {
      for (const picked of [null, 0, 1, 2, 3, 4, 5, 6]) {
        // The run card's words turn on gps alone: every pick with it, the launch's own pick without.
        if (!gps && picked !== null) continue;
        const page = pageView(P, shown, picked, gps);
        const native = nativeView(store, grid, now, shown, picked, gps);
        same(native, page, 'title ' + shown + ', column ' + picked + (gps ? ', gps' : ''));
        tally.draws++;
        const d = page.days;
        if (d) {
          tally.cards += d.cards.length;
          if (d.rest) tally.rests++;
          tally.done += d.cards.filter((c) => c.done).length;
          tally.skipped += d.cards.filter((c) => c.skip && c.skip.on).length;
          if (d.wildcard !== null) tally.wild++;
        }
        if (page.injuryWeek) tally.injury++;
        // A travel day's card says so in its meta line; a whole week of them reads Maintenance Week on the pill.
        if (page.pill.html === 'Maintenance Week' || (d && d.cards.some((c) => c.meta.endsWith(' · Travel')))) tally.travel++;
        if (page.row.kind === 'race') tally.race++;
      }
    }
  }
  return tally;
}
