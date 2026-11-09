// This Week's redesign (D276 P-WEEKSCREEN, docs/decisions/this-week.md) with D272's run and lift cards
// (docs/decisions/gps-recording.md) on the booted app: HALF_MANNY drawn through the legacy script's own helpers, as the
// iOS app's WeekView draws it. HALF_MANNY starts Monday 2026-08-31, so title 11 runs Sun Nov 8 to Sat Nov 14 and the
// race is Sun Dec 6; the clock is pinned to Thursday Nov 12, 2026, 24 days out. The expected strips and cards are typed
// by hand from the program's week 10 and 11 grid (v0.257.0: Monday Speed Run with Posterior Chain, Tuesday Recovery Run
// with Strength Support, Wednesday rest, Thursday Leg Strength + Mobility, Friday Recovery Run with Recovery Lift,
// Saturday Long Run with Post-Run Mobility, Sunday rest; week 14 ends Saturday Shakeout, Sunday Race Day).
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock } from '../support/app.ts';
import { type Column, type DayCard, type WeekDeps, type WeekProgram, type WeekView, COLS, dayWord, weekView } from '../../frontends/app/src/app/screens/week-view/week-view-model.ts';

const IA = loadApp();
pinClock(IA, '2026-11-12T10:00:00');
const W = IA.window;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const P = clone(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))) as unknown as WeekProgram & { id: string; startDate: string };
assert.equal(JSON.stringify(P.weeks), JSON.stringify(IA.buildProgram(clone(IA.fixtures.HALF_MANNY)).weeks), 'HALF_MANNY builds the same twice');
P.id = 'p_week';
P.name = 'THE HALF MANNY';
P.startDate = '2026-08-31';
IA.localStorage.setItem('ia_programs', JSON.stringify([P]));
IA.localStorage.setItem('ia_active', P.id);
IA.eval('showToast=function(){};activeProgId=null;activeProg=null;init();');
const prog = IA.eval('activeProg') as WeekProgram;
const TODAY = new Date(2026, 10, 12);
const MON = W['getWeekMonday'](prog.startDate) as Date;

/** The legacy helpers, as WeekView hands them to the model. */
const deps: WeekDeps = {
  weekRange: (ov) => W['overlayWeekRange'](prog, ov, prog.totalWeeks),
  parseDate: (iso) => W['_parseLocalDate'](iso),
  isTravel: (day) => W['dayIsTravel'](day),
  beforeStart: (w, d) => W['dayBeforeStart'](prog, w, d),
  regionLabel: (r) => (IA.eval('INJURY_REGIONS')[r] || {}).label,
  icon: (n, s) => W['asyIcon'](n, s),
  liftFocus: (t) => W['liftFocusCode'](t),
  runChip: (s, k, t) => W['runSessionCode'](s, k, t),
  wildcardOn: (w, d) => W['wildcardOn'](w, d),
  statusOf: (w, d) => W['statusOf'](w, d),
  heroSummary: (day) => W['heroSummary'](day),
  sessionTime: (day) => W['sessionTimeEst'](day),
  restTip: () => W['restDayTip'](),
  restLines: (rl) => W['restLogLines'](rl),
  streak: () => W['computeStreak'](),
  wildcardSub: () => null,
  liveInjury: () => null,
  alignment: () => W['progAlignment'](prog),
  shortDay: (iso) => W['_fmtStartDay'](iso),
  completedKey: (w, d) => W['completedKey'](w, d),
  logKey: (w, d) => W['logKey'](w, d),
};
/** The screen at title `shown`, the day `picked` (or its default), with or without the GPS plugin. */
function screen(shown: number, picked: number | null = null, gps = true): WeekView {
  return weekView({
    prog, shown, picked, actualWeek: W['calcCurrentWeek'](), today: TODAY, weekMon: MON,
    completed: W['getCompleted'](), logs: W['getLogs'](), dayFull: IA.eval('DAY_FULL'), gps,
  }, deps);
}
const cols = (v: WeekView) => v.days!.strip.map((c: Column) => (c.empty ? c.letter + c.num + '·' : c.letter + c.num + ' ' + c.word));
const cards = (v: WeekView) => v.days!.cards.map((k: DayCard) => [k.kind, k.label, k.title, k.meta, k.blurb, k.button ? k.button.text + (k.button.glow ? ' (glow)' : '') : null, k.done ? k.done.title + ': ' + k.done.line : null]);
const COL = (key: string) => COLS.indexOf(key as never);
function log(key: string, entry: Record<string, unknown> | null): void {
  const logs = W['getLogs']();
  if (entry) logs[key] = entry;
  else delete logs[key];
  W['saveLogs'](logs);
}
function mark(key: string, status: string | null): void {
  const comp = W['getCompleted']();
  if (status) comp[key] = { status };
  else delete comp[key];
  W['saveCompleted'](comp);
}

describe('the week title strip and the day strip, Sunday first', () => {
  test('the strip holds Week 1 to Week 14 and Race Day, and opens on the title holding today', () => {
    const v = screen(11);
    assert.deepEqual(v.titles.map((t) => t.title), ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14', 'Race Day']);
    assert.deepEqual(v.titles.filter((t) => t.active).map((t) => t.n), [11]);
    assert.deepEqual(v.row, { kind: 'race', big: '24 days out', small: 'Race day Sun, Dec 6', iso: '2026-12-06' });
  });

  test('title 11 runs Sunday Nov 8 (week 10\'s rest) to Saturday Nov 14, one word a day, and picks today, Thursday', () => {
    const v = screen(11);
    assert.deepEqual(cols(v), ['S8 REST', 'M9 SPEED', 'T10 RECOV', 'W11 REST', 'T12 LEGS', 'F13 RECOV', 'S14 LONG']);
    const sun = v.days!.strip[0] as Extract<Column, { empty: false }>;
    assert.deepEqual([sun.week, sun.key], [10, 'sun']);
    assert.equal(v.days!.picked, COL('thu'));
    assert.equal((v.days!.strip[COL('thu')] as { today: boolean }).today, true);
  });

  test('the Race Day title holds the race alone on its Sunday, picked, with RACE in the signal colour', () => {
    const v = screen(15);
    assert.deepEqual(cols(v), ['S6 RACE', 'M7·', 'T8·', 'W9·', 'T10·', 'F11·', 'S12·']);
    assert.equal(v.days!.picked, 0);
    assert.equal((v.days!.strip[0] as { wordColor: string }).wordColor, 'var(--signal)');
    assert.equal(v.pill.html, 'Race Day');
    assert.deepEqual(cards(v), [['run', 'Sunday, Dec 6', 'Race Day', '13.1 mi · 12:10/mi', 'This is what every week built toward.', 'Record the race (glow)', null]]);
  });

  test('week 1\'s Sunday is before the program and empty; a past title picks its Saturday, a title to come its Monday', () => {
    assert.deepEqual(cols(screen(1)).slice(0, 2), ['S30·', 'M31 SPEED']);
    assert.equal(screen(10).days!.picked, COL('sat'));
    assert.equal(screen(12).days!.picked, COL('mon'));
  });

  test('every HALF_MANNY day wears one word of five letters or fewer, Posterior Chain\'s run naming its day', () => {
    const seen = new Set<string>();
    for (let w = 1; w <= 14; w++) for (const k of COLS) seen.add(dayWord(prog.weeks[w]![k], deps));
    assert.deepEqual([...seen].sort(), ['LEGS', 'LONG', 'RACE', 'RECOV', 'REST', 'SHAKE', 'SPEED']);
  });
});

describe('the run card and the lift card (D272 as amended)', () => {
  test('Friday: the run card first with Record run glowing, then the lift card with Start lift as an outline', () => {
    assert.deepEqual(cards(screen(11, COL('fri'))), [
      ['run', 'Tomorrow · Friday', 'Recovery Run', '45 min · 13:20/mi', 'Just as important as the hard days. Do not run faster than 12:40/mi.', 'Record run (glow)', null],
      ['lift', 'Then lift', 'Recovery Lift', '', 'Dumbbell incline press + 5 more', 'Start lift', null],
    ]);
  });

  test('Thursday, a lift only day: one card, Start session, and no Record', () => {
    assert.deepEqual(cards(screen(11, COL('thu'))), [['lift', 'Today · Thursday', 'Leg Strength + Mobility', '~40 min', 'Back squat + 8 more', 'Start session (glow)', null]]);
  });

  test('Saturday: the long run, then the cool down after it', () => {
    assert.deepEqual(cards(screen(11, COL('sat'))).map((c) => [c[1], c[2], c[5]]), [['Saturday, Nov 14', 'Long Run', 'Record run (glow)'], ['After the run', 'Stretch and roll', 'Start the cool down']]);
  });

  test('a logged run shows its done row with its own Reopen, and the glow moves to Start lift', () => {
    log('w11_fri', { run_dist: '3.4', run_mins: '45', run_pace: '13:14' });
    try {
      assert.deepEqual(cards(screen(11, COL('fri'))).map((c) => [c[0], c[5], c[6]]), [['run', null, 'Recovery Run: 3.4 mi · 45:00 · 13:14/mi'], ['lift', 'Start lift (glow)', null]]);
    } finally {
      log('w11_fri', null);
    }
  });

  test('a closed day shows both done rows and no button; a skipped day says so on each card', () => {
    mark('w11_fri', 'complete');
    try {
      assert.deepEqual(cards(screen(11, COL('fri'))).map((c) => [c[5], c[6]]), [[null, 'Recovery Run: Closed out'], [null, 'Recovery Lift: Closed out']]);
    } finally {
      mark('w11_fri', null);
    }
    mark('w11_fri', 'skipped');
    try {
      assert.deepEqual(cards(screen(11, COL('fri'))).map((c) => [c[5], c[6]]), [[null, 'Recovery Run: Skipped'], [null, 'Recovery Lift: Skipped']]);
    } finally {
      mark('w11_fri', null);
    }
  });

  test('without the GPS plugin there is no Record: the run card logs the run by hand (D272 item 6)', () => {
    const run = screen(11, COL('fri'), false).days!.cards[0]!;
    assert.deepEqual(run.button, { text: 'Log the run', act: 'log', glow: true });
  });

  test('a rest day keeps Training anyway? and Log cardio (D272 Amendment 1, item 3)', () => {
    const v = screen(12, 0);
    assert.deepEqual(v.days!.cards, []);
    assert.deepEqual(v.days!.rest, { week: 11, key: 'sun', when: 'Sunday, Nov 15', lines: [], logLabel: 'Log cardio', anyway: true });
  });
});
