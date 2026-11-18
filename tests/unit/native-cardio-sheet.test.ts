// The Expo app's cardio sheet (MIGRATION.md phase 3, row 3), by rule; its floating rest timer came out again (D295). Every expected value here is
// typed by hand from the rulings the rules carry (the wheels V182 to V237, the dose grammar V148, draft and logged
// V236 D218, the park V234 D213 and D214, the gap V191 D40, one cardio alone D278, the rest clock V221 D179 and V239
// D233), never asked of today's page. tests/integration/native-cardio-sheet.test.ts holds the same rules equal to
// today's page tap by tap.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import { type Dose, wheelView } from '../../frontends/native/src/day-detail/cardio-fields-model.ts';
import { type CardioLog, CARDIO_LOGGED_TOAST, cardioLogOf, doseReadout, logCardio, setNode, stepReps, swapSport, togglePicker } from '../../frontends/native/src/day-detail/cardio-log.ts';
import { cardRoute, liftOnDay } from '../../frontends/native/src/day-detail/cardio-sheet-model.ts';
import { IAW_SPEC } from '../../frontends/native/src/day-detail/sheet-readers.ts';
import { type SheetProgram, logOf, sheetFrame, sheetView } from '../../frontends/native/src/day-detail/sheet-screen.ts';
import { type LogForm, cardioLive, formOf, parkSport } from '../../frontends/native/src/day-detail/sheet-writes.ts';
import { WHEEL_ROW, WHEEL_SETTLE_MS, wheelFormat, wheelHome, wheelParse, wheelRecentre, wheelRest, wheelSeed, wheelSel } from '../../frontends/native/src/day-detail/wheels.ts';
import type { Session } from '../../frontends/native/src/deck/deck-writes.ts';

const NATIVE = join(REPO, 'frontends/native/src');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const NOW = 1790000000000;

/** A program of one week: a run beside a lift, a run alone, a ride beside a lift, a lift alone. */
const program = (): SheetProgram => ({
  id: 'p1', cfg: { unit: 'lbs' },
  weeks: {
    1: {
      mon: { title: 'Posterior Chain', tags: ['run', 'lift'], cardio: { type: 'run', subtype: 'Easy Run', detail: 'Easy.', dose: { k: 'time', mins: 30, tgt: 600 } }, sections: [{ label: 'Main', items: [{ name: 'Deadlift', detail: '3×5' }] }] },
      tue: { title: 'Shakeout', tags: ['run'], cardio: { type: 'run', subtype: 'Recovery Run', detail: 'Easy.', dose: { k: 'dist', mi: 2 } }, sections: [] },
      wed: { title: 'Intervals', tags: ['run', 'lift'], cardio: { type: 'run', subtype: 'Intervals', detail: '6 x 400m', dose: { k: 'reps_dist', reps: 6, m: 400, tgt: 480 } }, sections: [{ label: 'Main', items: [{ name: 'Back squat', detail: '3×5' }] }] },
      thu: { title: 'Ride', tags: ['bike', 'lift'], cardio: { type: 'bike', subtype: 'Endurance', detail: '45 min', dose: { k: 'time', mins: 45 } }, sections: [{ label: 'Main', items: [{ name: 'Bench press', detail: '3×5' }] }] },
      fri: { title: 'Upper', tags: ['lift'], sections: [{ label: 'Main', items: [{ name: 'Overhead press', detail: '3×5' }] }] },
    },
  },
} as unknown as SheetProgram);
const session = (store: StateStore, dayKey = 'mon'): Session => ({ store, prog: program(), week: 1, dayKey });
/** The day's sheet as first drawn: its form and its cardio card. */
function opened(store: StateStore, dayKey = 'mon'): { s: Session; f: LogForm; c: CardioLog } {
  const s = session(store, dayKey);
  const v = sheetView(store, s.prog as SheetProgram, 1, dayKey, NOW)!;
  const day = (s.prog.weeks[1] as Record<string, { cardio?: unknown }>)[dayKey]!;
  return { s, f: formOf(logOf(v)), c: cardioLogOf(logOf(v), day.cardio as never, v.dose) };
}
const entry = (store: StateStore, dayKey = 'mon'): Record<string, unknown> => (JSON.parse(store.get('ia_logs_p1') || '{}') as Record<string, Record<string, unknown>>)['w1_' + dayKey] || {};

describe('native cardio sheet: the models are today\'s files', () => {
  for (const [f, from] of [['day-detail/cardio-sheet-model.ts', 'day-detail/cardio-sheet-model.ts']] as const) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(REPO, 'frontends/app/src/app/screens', from));
      const copy = readFileSync(join(NATIVE, f));
      assert.ok(today.length > 2000);
      assert.ok(copy.equals(today), f + ' differs from today\'s: copy it again (cp), never edit the copy');
    });
  }
});

describe('native cardio sheet: the wheels\' rules', () => {
  test('a row is 44 points and a wheel is read 90 ms after it last moved', () => {
    assert.equal(WHEEL_ROW, 44);
    assert.equal(WHEEL_SETTLE_MS, 90);
  });
  test('a stored time reads back as a clock: decimal minutes to the second, pegged at 9:59:59, zero when blank or malformed (D200, D203, D208, D215)', () => {
    assert.deepStrictEqual(wheelParse('hms', '7.5'), ['0', '7', '30']);
    assert.deepStrictEqual(wheelParse('hms', '15.33'), ['0', '15', '20']);
    assert.deepStrictEqual(wheelParse('hms', '90'), ['1', '30', '0']);
    assert.deepStrictEqual(wheelParse('hms', '.5'), ['0', '0', '30']);
    assert.deepStrictEqual(wheelParse('hms', '600'), ['9', '59', '59']);
    for (const blank of ['', 'abc', '-1', null, undefined]) assert.deepStrictEqual(wheelParse('hms', blank), ['0', '0', '0'], String(blank));
  });
  test('stored miles read back digit by digit, the whole held to 99, zero when blank or malformed (D203, D220)', () => {
    assert.deepStrictEqual(wheelParse('dist', '3.1'), ['3', '1', '0']);
    assert.deepStrictEqual(wheelParse('dist', '13.11'), ['13', '1', '1']);
    assert.deepStrictEqual(wheelParse('dist', '.86'), ['0', '8', '6']);
    assert.deepStrictEqual(wheelParse('dist', '120.5'), ['99', '5', '0']);
    assert.deepStrictEqual(wheelParse('dist', '4'), ['4', '0', '0']);
    for (const blank of ['', 'abc']) assert.deepStrictEqual(wheelParse('dist', blank), ['0', '0', '0'], blank);
  });
  test('a pace keeps its dash when blank or malformed and is held to 4 to 17 minutes; a rep clock lands on zero (D220, D222)', () => {
    assert.deepStrictEqual(wheelParse('pace', '9:15'), ['9', '15']);
    assert.deepStrictEqual(wheelParse('pace', '3:10'), ['4', '10']);
    assert.deepStrictEqual(wheelParse('pace', '21:05'), ['17', '5']);
    for (const blank of ['', '9', 'abc']) assert.deepStrictEqual(wheelParse('pace', blank), ['', ''], blank);
    assert.deepStrictEqual(wheelParse('rept', '1:52'), ['1', '52']);
    assert.deepStrictEqual(wheelParse('rept', '12:70'), ['9', '59']);
    for (const blank of ['', 'x']) assert.deepStrictEqual(wheelParse('rept', blank), ['0', '0'], blank);
  });
  test('a face stores: decimal minutes to two places, miles to two, a padded clock, and nothing at zero or on the dash (D200, D215, D220, D222)', () => {
    assert.equal(wheelFormat('hms', ['0', '7', '30']), '7.50');
    assert.equal(wheelFormat('hms', ['0', '15', '20']), '15.33');
    assert.equal(wheelFormat('hms', ['1', '0', '0']), '60.00');
    assert.equal(wheelFormat('hms', ['0', '0', '0']), '');
    assert.equal(wheelFormat('dist', ['3', '1', '0']), '3.10');
    assert.equal(wheelFormat('dist', ['0', '0', '5']), '0.05');
    assert.equal(wheelFormat('dist', ['0', '0', '0']), '');
    assert.equal(wheelFormat('pace', ['9', '5']), '9:05');
    assert.equal(wheelFormat('pace', ['', '30']), '');
    assert.equal(wheelFormat('pace', ['9', '']), '9:00');
    assert.equal(wheelFormat('rept', ['1', '5']), '1:05');
    assert.equal(wheelFormat('rept', ['0', '0']), '');
  });
  test('a column that wraps opens from its middle copy; hours, whole miles, rep minutes and the dash column from their first row (D5, D216, D220)', () => {
    assert.equal(wheelHome({ min: 0, max: 59, pad: 2 }), 120);
    assert.equal(wheelHome({ min: 0, max: 9 }), 20);
    assert.equal(wheelHome({ min: 0, max: 9, wrap: false }), 0);
    assert.equal(wheelHome({ min: 4, max: 17, nil: true }), 0);
  });
  test('a blank fixed wheel opens on the plan and shows it; a stored value wins; a blank free wheel opens on zero, a blank pace on its dash (D202, D220)', () => {
    // 30 planned minutes: hours row 0, minutes 30 in the middle copy (120 + 30), seconds 0 (120).
    assert.deepStrictEqual(wheelSeed(wheelView(IAW_SPEC, 'hms', 'log_run_mins', '', null, 30)), { rows: [0, 150, 120], face: '30.00' });
    assert.deepStrictEqual(wheelSeed(wheelView(IAW_SPEC, 'hms', 'log_run_mins', '28.50', null, 30)), { rows: [0, 148, 150], face: '28.50' });
    // Miles: the whole from row 0, tenths and hundredths from their middle copies (20).
    assert.deepStrictEqual(wheelSeed(wheelView(IAW_SPEC, 'dist', 'log_run_dist', '')), { rows: [0, 20, 20], face: '' });
    assert.deepStrictEqual(wheelSeed(wheelView(IAW_SPEC, 'dist', 'log_run_dist', '3.14')), { rows: [3, 21, 24], face: '3.14' });
    // Pace: the dash is the first row; 9 minutes is the sixth row after it (4, 5, 6, 7, 8, 9).
    assert.deepStrictEqual(wheelSeed(wheelView(IAW_SPEC, 'pace', 'log_run_pace', '')), { rows: [0, 120], face: '' });
    assert.deepStrictEqual(wheelSeed(wheelView(IAW_SPEC, 'pace', 'log_run_pace', '9:15')), { rows: [6, 135], face: '9:15' });
  });
  test('a rest reads the row nearest its offset, held inside the column', () => {
    const col = wheelView(IAW_SPEC, 'dist', 'x', '').cols[0]!;
    assert.equal(wheelSel(col, 3 * 44), '3');
    assert.equal(wheelSel(col, 3 * 44 + 21), '3');
    assert.equal(wheelSel(col, 3 * 44 + 23), '4');
    assert.equal(wheelSel(col, -500), '0');
    assert.equal(wheelSel(col, 99999), '99');
  });
  test('a wrapped column at rest in its first or last copy is jumped two copies back toward the middle; one that does not wrap never moves (D5)', () => {
    const wrap = { wrap: true, len: 60 }, fixed = { wrap: false, len: 10 };
    assert.equal(wheelRecentre(wrap, 5 * 44), (5 + 120) * 44);
    assert.equal(wheelRecentre(wrap, 59 * 44), (59 + 120) * 44);
    assert.equal(wheelRecentre(wrap, 60 * 44), 60 * 44);
    assert.equal(wheelRecentre(wrap, 240 * 44), 240 * 44);
    assert.equal(wheelRecentre(wrap, 241 * 44), (241 - 120) * 44);
    assert.equal(wheelRecentre(fixed, 2 * 44), 2 * 44);
  });
  test('opening a day never writes: nothing is written until a wheel rests on a face other than the one it opened on; after that only a face the field already holds is passed over (V232)', () => {
    let st = { moved: false, seedFace: '30.00' };
    let r = wheelRest('hms', st, ['0', '30', '0'], '');
    assert.deepStrictEqual(r, { write: null, st: { moved: false, seedFace: '30.00' } }, 'a rest on the plan it opened on');
    r = wheelRest('hms', st, ['0', '31', '0'], '');
    assert.deepStrictEqual(r, { write: '31.00', st: { moved: true, seedFace: '30.00' } });
    st = r.st;
    assert.equal(wheelRest('hms', st, ['0', '31', '0'], '31.00').write, null, 'the face the field holds');
    // Back on the plan once it has moved: the plan is now a number the athlete chose, and is written.
    assert.equal(wheelRest('hms', st, ['0', '30', '0'], '31.00').write, '30.00');
    // A wheel that has moved, rested on zero: the field is emptied.
    assert.equal(wheelRest('hms', st, ['0', '0', '0'], '31.00').write, '');
  });
});

describe('native cardio sheet: the readout under the fields (V148, V191 D40)', () => {
  const time: Dose = { k: 'time', mins: 30, tgt: 600 };
  test('nothing on the generic form; one row saying what to enter until the free dimension is in', () => {
    assert.deepStrictEqual(doseReadout(null, { log_run_dist: '3.00' }), []);
    assert.deepStrictEqual(doseReadout(time, {}), [{ label: 'Your pace', value: 'enter distance', small: '', empty: true, joined: false }]);
    assert.deepStrictEqual(doseReadout({ k: 'dist', mi: 3 }, {}), [{ label: 'Your pace', value: 'enter minutes', small: '', empty: true, joined: false }]);
    assert.deepStrictEqual(doseReadout({ k: 'reps_dist', reps: 6, m: 400 }, {}), [{ label: 'Your rep pace', value: 'enter a rep time', small: '', empty: true, joined: false }]);
  });
  test('the pace, what it assumed, and its gap to the target: on target inside five seconds, seconds under a minute, m:ss from there', () => {
    // 3 miles in the planned 30 minutes is 10:00 a mile, the target.
    assert.deepStrictEqual(doseReadout(time, { log_run_dist: '3.00' }), [{ label: 'Your pace', value: '10:00/mi', small: 'assuming planned 30 min · on target', empty: false, joined: false }]);
    // 3 miles in 29 minutes is 9:40 a mile: 20 seconds under.
    assert.equal(doseReadout(time, { log_run_dist: '3.00', log_run_mins: '29.00' })[0]!.small, '20s/mi faster than target');
    // 3 miles in 29.65 minutes is 9:53 a mile: 7 seconds under, outside the five that read as on target.
    assert.equal(doseReadout(time, { log_run_dist: '3.00', log_run_mins: '29.65' })[0]!.small, '7s/mi faster than target');
    // 3 miles in 34 minutes is 11:20 a mile: 1:20 over.
    assert.equal(doseReadout(time, { log_run_dist: '3.00', log_run_mins: '34.00' })[0]!.small, '1:20/mi slower than target');
    // No target, nothing assumed: the pace alone.
    assert.deepStrictEqual(doseReadout({ k: 'dist', mi: 3 }, { log_run_dist: '3.00', log_run_mins: '27.00' }), [{ label: 'Your pace', value: '9:00/mi', small: '', empty: false, joined: false }]);
  });
  test('a rep session: the work done, and the pace under it with no rule between', () => {
    // 6 by 400 m is 2400 m, 1.49 miles. A 2:00 rep over 400 m is 8:03 a mile (120 s over 0.24855 mi is 482.8 s), 3 seconds off 8:00.
    assert.deepStrictEqual(doseReadout({ k: 'reps_dist', reps: 6, m: 400, tgt: 480 }, { log_run_reps: '6', log_run_rep_time: '2:00' }), [
      { label: 'Work done', value: '1.49 mi', small: '6 × 400m', empty: false, joined: false },
      { label: 'Your pace', value: '8:03/mi', small: 'on target', empty: false, joined: true },
    ]);
    // 4 by 5 minutes with 2.5 work miles: 20 work minutes, 8:00 a mile.
    assert.deepStrictEqual(doseReadout({ k: 'reps_time', reps: 4, mins: 5 }, { log_run_dist: '2.50' }), [{ label: 'Your pace', value: '8:00/mi', small: 'assuming planned 4 reps · over 20 work min', empty: false, joined: false }]);
  });
});

describe('native cardio sheet: what a tap writes (D218, D213)', () => {
  test('a wheel rolled on a draft card writes nothing; Log on an empty card says so; Log commits, stamps the derived pace and names the sport', () => {
    const store = memoryStore();
    let { s, f, c } = opened(store);
    assert.deepStrictEqual(f.nodes, { log_run_mins: '', log_run_dist: '' });
    assert.equal(logCardio(s, f, c, NOW), 'Nothing to log yet.');
    assert.equal(store.get('ia_logs_p1'), null, 'an empty Log writes nothing');
    f = setNode(s, f, c, 'log_run_dist', '3.00', NOW);
    assert.equal(f.nodes['log_run_dist'], '3.00');
    assert.equal(store.get('ia_logs_p1'), null, 'a draft is form only');
    assert.equal(cardioLive(s, f), false);
    assert.equal(logCardio(s, f, c, NOW), 'Run logged ✓');
    assert.equal(cardioLive(s, f), true);
    const e = entry(store);
    // 3 miles over the planned 30 minutes: the pace is derived onto the old key, the minutes stay blank.
    assert.deepStrictEqual([e['run_dist'], e['run_mins'], e['run_pace'], e['week'], e['ts']], ['3.00', '', '10:00/mi', 1, NOW]);
    assert.ok(store.get('ia_hist_p1')!.includes('w1_mon'), 'the day is snapshotted on its first touch');
    // Logged: the next roll is saved as it lands.
    f = setNode(s, f, c, 'log_run_dist', '3.10', NOW + 1);
    assert.deepStrictEqual([entry(store)['run_dist'], entry(store)['run_pace'], entry(store)['ts']], ['3.10', '9:41/mi', NOW + 1]);
  });
  test('the toasts name the sport the chip credits', () => {
    assert.deepStrictEqual(CARDIO_LOGGED_TOAST, { run: 'Run logged ✓', bike: 'Ride logged ✓', swim: 'Swim logged ✓' });
  });
  test('a day with no run, ride or swim has no card: Log, the picker\'s chip and the stepper do nothing', () => {
    const store = memoryStore();
    const { s, f, c } = opened(store, 'fri');
    assert.equal(f.wrap, null);
    assert.equal(logCardio(s, f, c, NOW), null);
    assert.deepStrictEqual(swapSport(s, f, c, 'bike', NOW), { form: f, log: c });
    assert.deepStrictEqual(stepReps(s, f, c, 1, NOW), { form: f, log: c });
    assert.equal(store.get('ia_logs_p1'), null);
  });
  test('the stepper starts from the plan while its field is blank, stays inside 0 to 30, and is form only until the card is logged', () => {
    const store = memoryStore();
    let { s, f, c } = opened(store, 'wed');
    assert.equal(c.repsShown, '6');
    assert.equal(f.nodes['log_run_reps'], '');
    let r = stepReps(s, f, c, -1, NOW);
    assert.deepStrictEqual([r.form.nodes['log_run_reps'], r.log.repsShown], ['5', '5']);
    assert.equal(store.get('ia_logs_p1'), null, 'a draft');
    for (let i = 0; i < 8; i++) r = stepReps(s, r.form, r.log, -1, NOW);
    assert.equal(r.form.nodes['log_run_reps'], '0', 'never under zero');
    for (let i = 0; i < 40; i++) r = stepReps(s, r.form, r.log, 1, NOW);
    assert.equal(r.form.nodes['log_run_reps'], '30', 'never over thirty');
    f = r.form; c = r.log;
    assert.equal(logCardio(s, f, c, NOW), 'Run logged ✓');
    // 30 by 400 m is 12000 m: 7.46 miles, derived onto the distance.
    assert.deepStrictEqual([entry(store, 'wed')['run_reps'], entry(store, 'wed')['run_dist']], ['30', '7.46']);
    r = stepReps(s, f, c, -1, NOW + 5);
    assert.deepStrictEqual([entry(store, 'wed')['run_reps'], entry(store, 'wed')['ts']], ['29', NOW + 5], 'logged: the step is saved');
  });
  test('Did a different activity? opens the picker and closes it, and writes nothing', () => {
    const store = memoryStore();
    const { c } = opened(store);
    assert.equal(c.picker, false);
    assert.equal(togglePicker(c).picker, true);
    assert.equal(togglePicker(togglePicker(c)).picker, false);
    assert.equal(store.get('ia_logs_p1'), null);
  });
  test('a chip credits the sport and never erases: the leaving sport\'s numbers park, the fields change, the note says where it counts, and the way back returns them', () => {
    const store = memoryStore();
    let { s, f, c } = opened(store);
    f = setNode(s, f, c, 'log_run_dist', '3.00', NOW);
    logCardio(s, f, c, NOW);
    let r = swapSport(s, f, c, 'bike', NOW + 1);
    assert.deepStrictEqual(r.form.wrap, { planned: 'run', active: 'bike' });
    assert.deepStrictEqual(r.form.nodes, { log_bike_mins: '' }, 'the ride\'s one field, blank');
    assert.equal(r.log.fields.kind, 'bike');
    assert.equal(r.log.dose, null, 'no plan in the new sport');
    assert.equal(r.log.note, 'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.');
    let e = entry(store);
    assert.deepStrictEqual([e['run_dist'], e['run_pace'], e['swapFrom'], e['swapTo']], ['', '', 'run', 'bike']);
    assert.deepStrictEqual(e['parked'], { run: { run_dist: '3.00', run_pace: '10:00/mi', run_mins: '', run_reps: '', run_rep_time: '' } });
    assert.equal(cardioLive(s, r.form), false, 'a draft under the new sport');
    // The chip the card is on: nothing moves.
    const before = store.get('ia_logs_p1');
    const same = swapSport(s, r.form, r.log, 'bike', NOW + 1);
    assert.equal(store.get('ia_logs_p1'), before);
    assert.deepStrictEqual(same.form, r.form);
    // A ride logged, then back to the run: the run's numbers return, the ride's park, the planned dose and its form come back.
    f = setNode(s, r.form, r.log, 'log_bike_mins', '45.00', NOW + 2);
    assert.equal(logCardio(s, f, r.log, NOW + 2), 'Ride logged ✓');
    r = swapSport(s, f, r.log, 'run', NOW + 3);
    e = entry(store);
    assert.deepStrictEqual([e['run_dist'], e['bike_mins'], e['swapFrom'], e['swapTo']], ['3.00', '', '', '']);
    assert.deepStrictEqual(e['parked'], { bike: { bike_mins: '45.00' } });
    assert.deepStrictEqual(r.form.nodes, { log_run_mins: '', log_run_dist: '3.00' });
    assert.deepStrictEqual(r.log.dose, { k: 'time', mins: 30, tgt: 600 });
    assert.equal(r.log.note, '');
    assert.equal(r.log.fields.kind, 'time');
  });
  test('the park by itself: the leaving sport\'s numbers leave the top level for the park, before the form is saved again', () => {
    const store = memoryStore();
    let { s, f, c } = opened(store);
    f = setNode(s, f, c, 'log_run_dist', '3.00', NOW);
    logCardio(s, f, c, NOW);
    const e = parkSport(s, 'run', 'bike');
    assert.deepStrictEqual([entry(store)['run_dist'], entry(store)['run_pace'], entry(store)['bike_mins']], ['', '', '']);
    assert.deepStrictEqual(entry(store)['parked'], { run: { run_dist: '3.00', run_pace: '10:00/mi', run_mins: '', run_reps: '', run_rep_time: '' } });
    assert.deepStrictEqual([e['run_dist'], e['bike_mins']], ['', ''], 'the entry handed back is the stored one');
  });
  test('a day opened on a swapped sport: the picker open, the note under it, that sport\'s fields with no dose, and the planned dose kept for the way back', () => {
    const store = memoryStore();
    const first = opened(store);
    const f = setNode(first.s, first.f, first.c, 'log_run_dist', '3.00', NOW);
    logCardio(first.s, f, first.c, NOW);
    swapSport(first.s, f, first.c, 'bike', NOW);
    const { f: form, c } = opened(store);
    assert.deepStrictEqual(form.wrap, { planned: 'run', active: 'bike' });
    assert.equal(c.picker, true);
    assert.equal(c.note, 'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.');
    assert.deepStrictEqual([c.fields.kind, c.dose, c.repsShown], ['bike', null, null]);
    assert.deepStrictEqual(c.doseFull, { k: 'time', mins: 30, tgt: 600 });
    // A day opened on its planned sport: the picker shut, no note.
    assert.deepStrictEqual([first.c.picker, first.c.note, first.c.sub], [false, '', 'Easy Run']);
  });
  test('a sport left with nothing in it parks nothing, and the note is the one sentence', () => {
    const store = memoryStore();
    const { s, f, c } = opened(store);
    const r = swapSport(s, f, c, 'swim', NOW);
    assert.equal(entry(store)['parked'], undefined);
    assert.equal(r.log.note, 'Counts toward Swim, not Run.');
    assert.deepStrictEqual(r.form.nodes, { log_swim_yards: '' });
    // The park by itself: a tap on the sport the card is on stores nothing, and hands back the entry as it stands.
    const before = store.get('ia_logs_p1');
    assert.deepStrictEqual(parkSport(s, 'swim', 'swim')['swapTo'], 'swim');
    assert.equal(store.get('ia_logs_p1'), before);
  });
});

describe('native cardio sheet: one cardio alone, and where a card\'s tap goes (D278)', () => {
  const card = (kind: 'run' | 'lift', act: 'record' | 'log' | 'deck' | null) => ({ kind, title: kind === 'run' ? 'Easy Run' : 'Posterior Chain', button: act ? { act } : null });
  test('Log the run, the ride or the swim opens that cardio\'s own sheet; Start opens the deck; a done run reopens its own sheet, a done lift the whole day', () => {
    assert.deepStrictEqual(cardRoute(card('run', 'log'), 'Today', 'button'), { to: 'cardio', sheet: { over: 'Today', title: 'Easy Run' } });
    assert.deepStrictEqual(cardRoute(card('run', 'record'), 'Today', 'button'), { to: 'record' });
    assert.deepStrictEqual(cardRoute(card('lift', 'deck'), 'Today', 'button'), { to: 'deck' });
    assert.equal(cardRoute(card('run', null), 'Today', 'button'), null);
    assert.deepStrictEqual(cardRoute(card('run', null), 'Tuesday', 'reopen'), { to: 'cardio', sheet: { over: 'Tuesday', title: 'Easy Run' } });
    assert.deepStrictEqual(cardRoute(card('lift', null), 'Tuesday', 'reopen'), { to: 'day' });
  });
  test('the sheet for one cardio alone: its when line and name, no tags, no counter, no add button, the cardio card and the log only; Done and Skip only on a day with no lift', () => {
    const store = memoryStore();
    const prog = program();
    const beside = sheetView(store, prog, 1, 'mon', NOW)!;
    const whole = sheetFrame(beside, null, prog);
    assert.deepStrictEqual([whole.over, whole.title, whole.cardio, whole.foot], ['Week 1 · Monday', 'Posterior Chain', false, true]);
    assert.ok(whole.body.some((b) => b.kind === 'sections') && whole.counter !== null && whole.tags.chips.length > 0);
    const alone = sheetFrame(beside, { over: 'Today', title: 'Easy Run' }, prog);
    assert.deepStrictEqual([alone.over, alone.title, alone.counter, alone.cardio, alone.foot], ['Today', 'Easy Run', null, true, false]);
    assert.deepStrictEqual(alone.tags, { chips: [], travel: false });
    assert.deepStrictEqual(alone.body.map((b) => b.kind), ['cardio', 'log']);
    // A day that is only its run keeps Done and Skip, the one place left to skip or undo it.
    const solo = sheetFrame(sheetView(store, prog, 1, 'tue', NOW)!, { over: 'Tomorrow', title: 'Recovery Run' }, prog);
    assert.deepStrictEqual([solo.cardio, solo.foot], [true, true]);
    assert.equal(liftOnDay([]), false);
    assert.equal(liftOnDay([{ items: [] }, { items: [{}] }]), true);
  });
  test('This Week routes a card\'s button and its Reopen by cardRoute; Record run opens the run\'s own sheet until the recorder is built', () => {
    const week = read('this-week/ThisWeek.tsx');
    assert.ok(week.includes("const r = cardRoute(k, when || '', which);\n    if (!r) return;\n    if (r.to === 'deck') start();\n    else if (r.to === 'day') { if (onReopen) onReopen(k.week, k.key); }\n    else if (onCardio) onCardio(k.week, k.key, r.to === 'cardio' ? r.sheet : { over: when || '', title: k.title });"));
    assert.ok(week.includes("onPress={() => tap('button')}") && week.includes("onPress={() => tap('reopen')}"));
    assert.ok(week.includes("when={first ? first.label : ''}"), 'the when line is the first card\'s label');
    assert.ok(week.includes('const openSheet = (week: number, key: string, only: CardioOnly | null = null): void => {') && week.includes('onCardio={openSheet}'));
    const sheet = read('day-detail/SessionSheet.tsx');
    assert.ok(sheet.includes('const frame = sheetFrame(view, open.only, prog);'));
    assert.ok(sheet.includes('{!frame.cardio && (\n            <Pressable testID="sheet-add"'), 'no add button on one cardio alone');
    assert.ok(sheet.includes('{frame.foot && (\n          <View testID="sheet-foot"'), 'Done and Skip only where the frame keeps them');
    for (const part of ['{frame.over}', '{frame.title}', 'frame.counter !== null', 'frame.tags.chips.map(', 'frame.tags.travel &&']) assert.ok(sheet.includes(part), part);
  });
});

describe('native cardio sheet: the screen', () => {
  const sheet = read('day-detail/SessionSheet.tsx');
  const block = read('day-detail/CardioLogBlock.tsx');
  const wheel = read('day-detail/Wheel.tsx');
  test('the block draws today\'s words', () => {
    for (const words of ["label('run', 'Log the run')", "label('bike', 'Log the ride')", "label('swim', 'Log the swim')", "sub('Shows the plan. Move it to match the watch.')", "sub('Off the watch.')", '>Reps completed</Text>',
      "sub('what the watch showed on most reps')", '>Miles in the work reps</Text>', "sub('Leave out the easy jog between reps.')", '>Whole session off the watch. Warm up, efforts and recoveries all count.</Text>', 'placeholder="yards"',
      '>Did a different activity?</Text>', '>Logged as</Text>', '{cardioLogLabel(logged)}', '{x.label}', '{x.value}', '{st.of}', '{ch.label}', '{c.note}']) {
      assert.ok(block.includes(words), words);
    }
    assert.doesNotMatch(strip(block) + strip(wheel), /Nike/);
  });
  test('each tap of the block is one of cardio-log.ts\'s, on the form and the card in hand; Log and a chip rest every wheel first, and a chip starts the wheels afresh', () => {
    assert.ok(sheet.includes("held: (id) => formNow.current.nodes[id] || '',"));
    assert.ok(sheet.includes('set: (id, value) => { hold(setNode(session, formNow.current, cardioNow.current, id, value, Date.now())); },'));
    assert.ok(sheet.includes('step: (delta) => { const r = stepReps(session, formNow.current, cardioNow.current, delta, Date.now()); hold(r.form); holdCardio(r.log); },'));
    assert.ok(sheet.includes('flush();\n      const toast = logCardio(session, formNow.current, cardioNow.current, Date.now());\n      if (toast) say(toast);'));
    assert.ok(sheet.includes('picker: () => holdCardio(togglePicker(cardioNow.current)),'));
    assert.ok(sheet.includes('flush();\n      const r = swapSport(session, formNow.current, cardioNow.current, sport, Date.now());\n      hold(r.form);\n      holdCardio(r.log);\n      setDrawn((n) => n + 1);'));
    assert.ok(sheet.includes('logged={cardioLive(session, form)}'), 'the button reads the store, never a flag of its own');
    assert.ok(sheet.includes("if (dayStatus(store, prog.id, open.week, open.dayKey) !== st) flush();"), 'a status set rests the wheels; the undo does not');
    assert.ok(block.includes("const wheel = (w: WheelView) => <Wheel key={w.hiddenId + ':' + drawn} w={w} p={p} held={() => on.held(w.hiddenId)} onWrite={on.set} flushers={flushers} />;"));
  });
  test('a wheel reads its face 90 ms after it last moved, through the rules, and rests at once when asked', () => {
    assert.ok(wheel.includes('timers.current[ci] = setTimeout(() => settle(ci), WHEEL_SETTLE_MS);'));
    assert.ok(wheel.includes('const y = offsets.current[ci]!, back = wheelRecentre(col, y);'));
    assert.ok(wheel.includes('const r = wheelRest(w.kind, moved.current, vals, now.current.held());\n    moved.current = r.st;\n    if (r.write !== null) now.current.onWrite(w.hiddenId, r.write);'));
    assert.ok(wheel.includes('const seed = useMemo(() => wheelSeed(w), [w]);') && wheel.includes('contentOffset={{ x: 0, y: seed.rows[ci]! * WHEEL_ROW }}'));
    assert.ok(wheel.includes('const flush = (): void => { timers.current.forEach((t, ci) => { if (t) { clearTimeout(t); settle(ci); } }); };'));
    assert.ok(wheel.includes('snapToInterval={WHEEL_ROW}'));
  });
  test('the rules and the block write no key and read no clock of their own; the one write of the picker is sheet-writes.ts\'s', () => {
    for (const f of ['day-detail/wheels.ts', 'day-detail/cardio-log.ts', 'day-detail/CardioLogBlock.tsx', 'day-detail/Wheel.tsx']) {
      const t = strip(read(f));
      assert.doesNotMatch(t, /Date\.now\(\)|Math\.random\(\)|\bstore\.(set|remove)\(|writeDayLogs|localStorage|AsyncStorage/, f);
    }
    assert.ok(strip(read('day-detail/cardio-log.ts')).includes('const e = parkSport(s, leaving, sport);'));
  });
});

describe('native rest timer: there is none (D295 P-ISLANDONLY)', () => {
  test('the Expo app holds no floating rest timer: no file of it, and neither the app nor the day\'s sheet names one', () => {
    assert.equal(existsSync(join(NATIVE, 'rest-timer')), false, 'frontends/native/src/rest-timer is gone');
    for (const f of ['App.tsx', 'day-detail/SessionSheet.tsx', 'deck/Deck.tsx', 'deck/DeckOpening.tsx']) {
      assert.doesNotMatch(strip(read(f)), /rest-timer|RestTimer|RestClock|resetIfIdle|\brest\.reset\b|showsOn/, f + ' names the rest timer');
    }
  });
  test('the page keeps its own floating timer, which a web page needs (the PWA has no Dynamic Island)', () => {
    const page = readFileSync(join(REPO, 'frontends/app/src/legacy/src/js/rest-timer.ts'), 'utf8');
    assert.ok(page.includes('function _rtInit('), 'the page\'s timer is still wired');
    assert.ok(existsSync(join(REPO, 'frontends/app/src/app/screens/rest-timer/rest-timer-model.ts')), 'and today\'s iOS app keeps its own');
  });
});
