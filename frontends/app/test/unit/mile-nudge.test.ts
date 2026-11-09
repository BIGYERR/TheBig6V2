// D274 P-ANCHORNUDGE with Amendment 1 (docs/decisions/mile-anchor.md): two easy runs in a row more than a chart row off
// the plan, the same way, offer the mile pencil pre-filled with the slower run's mile rounded up a row. The judge and
// the sheet's words (src/app/screens/mile-nudge/mile-nudge-model.ts) on the pace chart itself (core's PACE_CHART, read
// as data through its own interpolation), then the screens that wire it, read as text. Every expected value is typed
// here from the ruling's hand table, as Amendment 1 corrects it against the chart: Mario's 11:01 and 11:03 against an
// 8:00 mile (recovery 10:30) read 8:31 and 8:33 and offer 9:00 (his logged 1:00:59 over 5.52 mi is 662.83 s, 8:32);
// the fixture's 12:40 and 12:30 against 10:30 (recovery 13:20) read 9:56 and 9:47 and offer 10:00.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { paceChartLookup } from '../../../../core/src/engine/cardio-progression.ts';
import {
  type DayLike,
  type LogLike,
  type NudgeInput,
  clock,
  easyTarget,
  judgeNudge,
  loggedPace,
  nudgeText,
  offerFields,
  offerSec,
} from '../../src/app/screens/mile-nudge/mile-nudge-model.ts';

const implied = (pace: number) => paceChartLookup('recovery', pace).mile;
const rx = (subtype: string, tgt?: number): DayLike => ({ cardio: { type: 'run', subtype, dose: tgt ? { tgt } : null } });
/** A run logged as miles and minutes: 6 mi in 66.1 min is 661 s a mile. */
const ran = (dist: number, mins: number): LogLike => ({ run_dist: String(dist), run_mins: String(mins) });

/** Mario's program: an 8:00 mile (480 s), recovery and long runs at 10:30 (630 s), 14 weeks, the calendar in week 10. */
function mario(over: Partial<NudgeInput> = {}): NudgeInput {
  return {
    week: 10, day: 'sat',
    hist: {
      w9_mon: rx('Speed Run — Intervals'), w9_tue: rx('Recovery Run', 630), w9_fri: rx('Recovery Run', 630), w9_sat: rx('Long Run', 630),
      w10_mon: rx('Speed Run — Tempo'), w10_tue: rx('Recovery Run', 630), w10_fri: rx('Recovery Run', 630), w10_sat: rx('Long Run — Dress Rehearsal', 630),
    },
    logs: { w9_tue: ran(3, 31.7), w9_fri: ran(3, 31.7), w9_sat: ran(5.46, 60.17), w10_sat: ran(5.52, 60.98) },
    comp: { w10_tue: 'complete', w10_fri: 'complete' },
    anchor: 480, curWeek: 10, totalWeeks: 14, record: null, implied,
    ...over,
  };
}

describe('the mile nudge judge (D274)', () => {
  it('reads Mario\'s two long runs as 8:31 and 8:32 and offers 9:00, passing over this week\'s runs marked done with no log', () => {
    const o = judgeNudge(mario());
    assert.ok(o);
    assert.deepEqual(
      { cards: o.cards.map((c) => c.key), paces: o.cards.map((c) => clock(c.pace)), implied: o.implied, dir: o.dir, offer: o.offer, lock: o.lockWeek },
      { cards: ['w9_sat', 'w10_sat'], paces: ['11:01', '11:03'], implied: [511, 512], dir: 1, offer: 540, lock: 12 },
    );
  });

  it('reads the hand table on whole seconds: 11:01 and 11:03 are 8:31 and 8:33; 12:40 and 12:30 are 9:56 and 9:47', () => {
    assert.deepEqual([661, 663, 760, 750].map(implied), [511, 513, 596, 587]);
  });

  it('offers 10:00 to two runs a row faster than a 10:30 mile (recovery 13:20)', () => {
    const fast = judgeNudge({
      week: 3, day: 'fri', hist: { w3_tue: rx('Recovery Run', 800), w3_fri: rx('Recovery Run', 800) },
      logs: { w3_tue: ran(6, 76), w3_fri: ran(6, 75) }, comp: {}, anchor: 630, curWeek: 3, totalWeeks: 14, implied,
    });
    assert.ok(fast);
    assert.deepEqual({ implied: fast.implied, dir: fast.dir, offer: fast.offer }, { implied: [596, 587], dir: -1, offer: 600 });
  });

  it('never speaks on one run, however far off', () => {
    assert.equal(judgeNudge(mario({ logs: { w10_sat: ran(5.52, 60.98) } })), null);
  });

  it('stays quiet when a run is under a row off: 15 s a mile slower than the plan', () => {
    assert.equal(judgeNudge(mario({ logs: { w9_sat: ran(6, 64.5), w10_sat: ran(6, 64.5) } })), null);
  });

  it('stays quiet when the two runs are off in opposite directions', () => {
    assert.equal(judgeNudge(mario({ logs: { w9_sat: ran(6, 66.3), w10_sat: ran(6, 55) } })), null);
  });

  it('never reads a speed run, logged or just logged, and never the race', () => {
    assert.equal(judgeNudge(mario({ logs: { w10_mon: ran(4, 30), w10_sat: ran(5.52, 60.98) } })), null);
    assert.equal(judgeNudge(mario({ day: 'mon', logs: { w9_sat: ran(5.46, 60.17), w10_mon: ran(4, 50) } })), null);
    assert.equal(easyTarget(rx('Long Run — RACE DAY', 730)), null);
    assert.equal(easyTarget(rx('Long Run — Peak', 630)), 630);
    assert.equal(easyTarget(rx('Recovery Run')), null);
  });

  it('passes over a skipped run and a run logged as another sport, and counts the easy run before them', () => {
    const logs = { w9_sat: ran(5.46, 60.17), w10_tue: ran(3, 33.6), w10_fri: { ...ran(10, 30), swapTo: 'bike' }, w10_sat: ran(5.52, 60.98) };
    const o = judgeNudge(mario({ logs, comp: { w10_tue: 'skipped' } }));
    assert.deepEqual(o && o.cards.map((c) => c.key), ['w9_sat', 'w10_sat']);
    assert.equal(loggedPace({ run_dist: '5', run_mins: '' }), null);
  });

  it('is silent in the last three weeks, when the pencil is locked: week 12 of 14', () => {
    assert.equal(judgeNudge(mario({ curWeek: 12 })), null);
    assert.ok(judgeNudge(mario({ curWeek: 11 })));
  });

  it('after an answer, waits for two new runs: a third does not reopen it, a fourth does', () => {
    const record = { cards: ['w9_sat', 'w10_sat'], anchor: 480 };
    assert.equal(judgeNudge(mario({ record })), null);
    const hist = { ...mario().hist, w11_tue: rx('Recovery Run', 630), w11_fri: rx('Recovery Run', 630) };
    const third = { ...mario().logs, w11_tue: ran(3, 33.1) };
    assert.equal(judgeNudge(mario({ week: 11, day: 'tue', curWeek: 11, hist, logs: third, record })), null);
    const fourth = { ...third, w11_fri: ran(3, 33.1) };
    assert.deepEqual(judgeNudge(mario({ week: 11, day: 'fri', curWeek: 11, hist, logs: fourth, record }))?.cards.map((c) => c.key), ['w11_tue', 'w11_fri']);
  });

  it('forgets the record once the pencil moves the mile', () => {
    const o = judgeNudge(mario({ anchor: 450, record: { cards: ['w9_sat', 'w10_sat'], anchor: 480 } }));
    assert.deepEqual(o && { cards: o.cards.map((c) => c.key), offer: o.offer }, { cards: ['w9_sat', 'w10_sat'], offer: 540 });
  });

  it('offers the slower run\'s mile rounded up a row, in both directions (Amendment 1)', () => {
    assert.deepEqual([offerSec([511, 513]), offerSec([596, 587]), offerSec([528, 535]), offerSec([510, 540])], [540, 600, 540, 540]);
  });
});

describe('the mile nudge sheet (D274 item 3)', () => {
  it('says what the runs say, in the coach\'s words, with no dash', () => {
    const t = nudgeText(judgeNudge(mario())!);
    assert.deepEqual(t, {
      label: 'Coach',
      title: 'Two easy runs in a row off the plan.',
      body: '11:01 and 11:03 a mile against 10:30. Your runs say your mile is nearer 9:00 than 8:00. Change it and every run ahead of you rebuilds. The mile locks from week 12.',
      update: 'Update mile time',
      keep: 'Keep 8:00',
    });
    assert.equal(/\w\s?[-–—]\s?\w/.test(t.title + t.body), false);
  });

  it('fills the pencil with the offer: 9 and 00', () => {
    assert.deepEqual(offerFields(540), { mins: '9', secs: '00' });
    assert.deepEqual(offerFields(600), { mins: '10', secs: '00' });
  });
});

describe('the screens that wire it (D274, Amendment 1)', () => {
  const src = (f: string) => readFileSync(new URL('../../src/app/' + f, import.meta.url), 'utf8');

  it('judges after the legacy log is saved, and raises the sheet only over This Week with the session sheet shut', () => {
    const n = src('screens/mile-nudge/mile-nudge.ts');
    assert.match(n, /this\.bridge\.provide\('logCardio', \(\) => \{\n\s+log\(\);\n\s+this\.afterLog\(\);/);
    assert.match(n, /return !\(d && d\.classList\.contains\('open'\)\) && !!document\.getElementById\('screenWeek'\)\?\.classList\.contains\('active'\);/);
    assert.match(n, /export const NUDGE_DELAY_MS = 700;/);
    assert.match(src('legacy/legacy-host.ts'), /@if \(booted\(\)\) \{<ia-mile-nudge \/>\}/);
  });

  it('opens the pencil with the offer in its fields, and either answer records the pair on the program', () => {
    const n = src('screens/mile-nudge/mile-nudge.ts');
    assert.match(n, /this\.mile\.prefill\.set\(offerFields\(o\.offer\)\);\n\s+this\.bridge\.call\('openMileSheet', this\.progId\);/);
    assert.match(n, /p\.mileNudge = \{ cards: \[o\.cards\[0\]\.key, o\.cards\[1\]\.key\], anchor: o\.anchor \};/);
    const m = src('screens/mile-sheet/mile-sheet.ts');
    assert.match(m, /this\.mins\(\)\.nativeElement\.value = pre \? pre\.mins : mileField\(g\.mileBestMins\);/);
    assert.match(m, /this\.secs\(\)\.nativeElement\.value = pre \? pre\.secs : mileField\(g\.mileBestSecs\);/);
  });
});
