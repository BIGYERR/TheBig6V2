// The easy-day ceiling (D117): every Recovery Run and every non-race Long Run of an NRC plan prints a ceiling and
// carries it as dose.cap; speed runs, race day and the time trial carry none. run_base's two easy-run sites print the
// same ceiling beside their "Around" pace (slice D; the form after D109: "Around X is right for you. Do not run
// faster than Y."), and its benchmark runs carry none.
//
// Oracles, typed here: the tempo and recovery columns of three chart rows (doctrine/nikerunclub5k.txt: 8:00 is tempo
// 9:25 = 565, recovery 10:30 = 630; 10:30 is 12:00 = 720 and 13:20 = 800; 9:30 is 11:00 = 660 and 12:10 = 730), the
// ruled ceiling (the midpoint of tempo and recovery, rounded), and the two ruled sentences. steadyCapSec is never
// called; the hand rows are first checked against PACE_CHART so a chart edit fails a named test.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures } from '../support/app.ts';
import { loadAppAt, clone, runSessions } from '../support/pace-clock.ts';
import type { Session } from '../support/pace-clock.ts';
const IA = loadAppAt(new Date(2026, 9, 11, 12, 0, 0));
const paceStr = (sec: number): string => {
  const t = Math.round(sec);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') + '/mi';
};
/** A PACE_CHART row typed by hand, with its ceiling: the midpoint of tempo and recovery, and that as a clock. */
interface Row { mileSec: number; mile: string; tempo: number; recovery: number; cap: number; capStr: string }
const ROWS: Row[] = [
  { mileSec: 480, mile: '8:00', tempo: 565, recovery: 630 },
  { mileSec: 630, mile: '10:30', tempo: 720, recovery: 800 }, // HALF_MANNY's row
  { mileSec: 570, mile: '9:30', tempo: 660, recovery: 730 }, // the intermediate default row
].map((r) => {
  const cap = Math.round((r.tempo + r.recovery) / 2);
  return { ...r, cap, capStr: paceStr(cap) };
});
const REC_TAIL = (cap: string) => 'Do not run faster than ' + cap + '.';
const LONG_TAIL = (cap: string) => 'Average no faster than ' + cap + '.';
const midDash = (s: string) => /[A-Za-z0-9,)]\s*[—-]\s*[A-Za-z0-9(]/.test(s);

test('the hand rows match PACE_CHART, and the ceiling is the midpoint of tempo and recovery', () => {
  const chart = IA.eval('PACE_CHART');
  for (const r of ROWS) {
    const row = chart.find((x: { mile: number }) => x.mile === r.mileSec);
    assert.ok(row, `PACE_CHART has an exact row at ${r.mile}`);
    assert.equal(row.tempo, r.tempo, `${r.mile} tempo`);
    assert.equal(row.recovery, r.recovery, `${r.mile} recovery`);
  }
  // round((565 + 630) / 2) = 598 = 9:58; round((720 + 800) / 2) = 760 = 12:40; round((660 + 730) / 2) = 695 = 11:35.
  assert.deepEqual(ROWS.map((r) => r.cap + ' ' + r.capStr), ['598 9:58/mi', '760 12:40/mi', '695 11:35/mi']);
  assert.equal(new Set(ROWS.map((r) => r.cap)).size, 3, 'the ceiling moves with the row');
  assert.ok(ROWS.every((r) => r.cap > r.tempo && r.cap < r.recovery), 'it sits between tempo and recovery');
});

function nrcRuns(goal: string, row: Row, raceDate?: string | null) {
  const cfg = clone(fixtures.HALF_MANNY);
  const [mm, ss] = row.mile.split(':');
  cfg.cardioGoals.run = { id: goal, label: goal, mileBestMins: mm, mileBestSecs: ss };
  if (raceDate) cfg.raceDate = raceDate;
  else {
    delete cfg.raceDate;
    cfg.primaryPath = 'test';
    cfg.eventTargeted = false;
  }
  return runSessions(IA.buildProgram(cfg)).map((r) => r.s);
}
const SWEEP = [
  { label: 'run_half at 8:00, race on the calendar', goal: 'run_half', row: ROWS[0], race: '2026-12-06' },
  { label: 'run_half at 10:30, race on the calendar', goal: 'run_half', row: ROWS[1], race: '2026-12-06' },
  { label: 'run_10k at 8:00, race on the calendar', goal: 'run_10k', row: ROWS[0], race: '2026-12-06' },
  { label: 'run_10k at 10:30, no race (time trial)', goal: 'run_10k', row: ROWS[1], race: null },
];
const seen = { speed: new Set(), raceDay: 0, timeTrial: 0, rec: 0, long: 0, speedRuns: 0 };
const CEILING = /faster than (\d+:[0-5]\d\/mi)\./;

for (const S of SWEEP) {
  test(`${S.label}: recovery and long runs print ${S.row.capStr} and carry dose.cap ${S.row.cap}; speed, race day and the time trial carry none`, () => {
    const all = nrcRuns(S.goal, S.row, S.race);
    const rec = all.filter((c) => c.subtype === 'Recovery Run');
    const longs = all.filter((c) => /^Long Run/.test(c.subtype));
    const speed = all.filter((c) => /^Speed Run/.test(c.subtype));
    const easyLong = longs.filter((c) => !/RACE DAY|TIME TRIAL/.test(c.subtype));
    const hardLong = longs.filter((c) => /RACE DAY|TIME TRIAL/.test(c.subtype));
    assert.ok(rec.length > 0 && easyLong.length > 0 && speed.length > 0, `recovery ${rec.length}, long ${easyLong.length}, speed ${speed.length}`);
    seen.rec += rec.length;
    seen.long += easyLong.length;
    seen.speedRuns += speed.length;
    for (const c of speed) seen.speed.add(c.subtype.replace('Speed Run — ', ''));
    for (const c of hardLong) /RACE DAY/.test(c.subtype) ? seen.raceDay++ : seen.timeTrial++;

    for (const c of rec) {
      assert.ok(String(c.detail).trim().endsWith(REC_TAIL(S.row.capStr)), `recovery run: ${c.detail}`);
      assert.equal(c.dose && c.dose.cap, S.row.cap);
    }
    for (const c of easyLong) {
      assert.ok(String(c.detail).trim().endsWith(LONG_TAIL(S.row.capStr)), `long run: ${c.detail}`);
      assert.equal(c.dose && c.dose.cap, S.row.cap);
    }
    for (const c of speed) {
      assert.ok(!c.dose || c.dose.cap === undefined, `${c.subtype} carries no dose.cap`);
      assert.doesNotMatch(String(c.detail), /faster than \d+:[0-5]\d\/mi\./, `${c.subtype} prints no ceiling`);
    }
    for (const c of hardLong) {
      assert.ok(!c.dose || c.dose.cap === undefined, `${c.subtype} carries no dose.cap`);
      assert.doesNotMatch(String(c.detail), /faster than \d+:[0-5]\d\/mi\.|no faster than/, `${c.subtype} prints no ceiling`);
    }
    const printed = all.map((c) => (String(c.detail).match(CEILING) || [])[1]).filter(Boolean);
    assert.deepEqual([...new Set(printed)], [S.row.capStr], 'no card prints another row\'s ceiling');
  });
}

test('the NRC sweep reached intervals, tempo, fartlek, hills, a race day, a time trial and enough of each card', () => {
  for (const t of ['Intervals', 'Tempo', 'Fartlek', 'Hills']) assert.ok(seen.speed.has(t), `${t} in ${[...seen.speed]}`);
  assert.ok(seen.raceDay >= 1 && seen.timeTrial >= 1, `race day ${seen.raceDay}, time trial ${seen.timeTrial}`);
  assert.ok(seen.rec >= 20 && seen.long >= 10 && seen.speedRuns >= 20, JSON.stringify({ rec: seen.rec, long: seen.long, speed: seen.speedRuns }));
});

test('the two ceiling sentences carry no mid-sentence dash and no Nike, and ship in the app as typed', () => {
  assert.ok(!midDash(REC_TAIL('12:40/mi')));
  assert.ok(!midDash(LONG_TAIL('12:40/mi')));
  assert.doesNotMatch(REC_TAIL('x') + LONG_TAIL('x'), /Nike/);
  assert.ok(IA.html.includes('Do not run faster than '));
  assert.ok(IA.html.includes('Average no faster than '));
});

// run_base holds one chart row for the whole block. Its two easy-run sites are told apart by the sentence each owns.
const IS_L = (c: Session) => /This is the longest run of your week/.test(String(c.detail)); // the long easy run
const IS_E = (c: Session) => /Distance is not the goal; time on feet is\./.test(String(c.detail)); // the week's other easy runs
const BASE_TAIL = (cap: string) => 'is right for you. Do not run faster than ' + cap + '.';
const AROUND = (c: Session) => (String(c.detail).match(/Around (\d+:[0-5]\d\/mi) is right for you/) || [])[1];
const CAPSTR = (c: Session) => (String(c.detail).match(/is right for you\. Do not run faster than (\d+:[0-5]\d\/mi)\./) || [])[1];
function baseRuns(row: Row) {
  const cfg = clone(fixtures.HALF_MANNY);
  const [mm, ss] = row.mile.split(':');
  cfg.cardioGoals.run = { id: 'run_base', label: 'Build Running Base', baselineDist: '5', baseline: '5mi', mileBestMins: mm, mileBestSecs: ss };
  delete cfg.raceDate;
  cfg.primaryPath = 'test';
  cfg.eventTargeted = false;
  return runSessions(IA.buildProgram(cfg)).map((r) => r.s);
}
const baseCaps: string[] = [];
for (const r of [ROWS[0], ROWS[1]]) {
  test(`run_base at ${r.mile}: both easy-run sites print Around ${paceStr(r.recovery)} and the ceiling ${r.capStr} from the same row; benchmarks carry none`, () => {
    const all = baseRuns(r);
    const L = all.filter(IS_L);
    const E = all.filter(IS_E);
    assert.ok(L.length > 0 && E.length > 0, `long easy ${L.length}, easy ${E.length}`);
    assert.equal(all.filter((c) => IS_L(c) && IS_E(c)).length, 0, 'the two sites are disjoint');
    baseCaps.push(r.mile + ':' + L.concat(E).map(CAPSTR).join('|'));
    for (const c of L.concat(E)) {
      assert.ok(String(c.detail).includes(BASE_TAIL(r.capStr)), String(c.detail));
      assert.equal(c.dose && c.dose.cap, r.cap);
      assert.equal(AROUND(c), paceStr(r.recovery), 'the Around pace is the same row\'s recovery');
    }
    const bench = all.filter((c) => /^Benchmark Run/.test(c.subtype));
    assert.ok(bench.length > 0, 'run_base has benchmark runs');
    for (const c of bench) assert.ok(!CAPSTR(c) && (!c.dose || c.dose.cap === undefined), `${c.subtype} carries no ceiling`);
  });
}

test('run_base\'s ceiling moves with the anchor: 9:58/mi at an 8:00 mile, 12:40/mi at 10:30', () => {
  assert.equal(baseCaps.length, 2, 'the two run_base tests ran first');
  assert.notEqual(baseCaps[0], baseCaps[1]);
  assert.ok(baseCaps[0].includes('9:58/mi') && !baseCaps[0].includes('12:40/mi'), baseCaps[0]);
  assert.ok(baseCaps[1].includes('12:40/mi') && !baseCaps[1].includes('9:58/mi'), baseCaps[1]);
});
