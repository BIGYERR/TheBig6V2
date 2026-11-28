// The session sheet in the Expo app (MIGRATION.md phase 3, the session sheet's first session; the record is
// docs/decisions/session-sheet.md): the sheet's pure logic in frontends/native/src/day-detail. Every expected value
// here is typed by hand: from the words today's sheet draws (day-detail.ts, session-log.ts and their models), from
// the rulings the page's handlers carry (V181 D1 and D2: Done and Skip, each undoing itself; V221 D179: a status
// closes the session; V236 D218: a cardio card that is a draft stores nothing; V236 D219: the effort is a number only
// once the slider was moved; V148: time, pace and distance, the third derived; V109: an added move, offered across
// regions with what it collides with said on the row; V163 D1 to D4: its dose by the nearest match of type, never a
// distance or a time), or from arithmetic (Epley: weight × (1 + reps / 30)). None is asked of the app: the comparison
// with today's sheet is tests/integration/native-session-sheet.test.ts.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import type { CardioFields } from '../../frontends/native/src/day-detail/cardio-fields-model.ts';
import { addCandidates, addSheetOf, addedDetailFor } from '../../frontends/native/src/day-detail/sheet-adds.ts';
import {
  IAW_SPEC, MOD_PAL, RPE_LABELS, TAG_META, benchmarkEntryFor, cardioLogLabel, cardioSwapNoteText, doseDerived, doseFromCardio, exLoggable, fmtPaceMi, parseClock, sessionLogProgress,
} from '../../frontends/native/src/day-detail/sheet-readers.ts';
import { RPE_INFO, SHEET_DRAWS, type SheetProgram, drawnBlocks, footOf, logOf, sheetDay, sheetFields, sheetMoves, sheetView, tokenOf } from '../../frontends/native/src/day-detail/sheet-screen.ts';
import { type LogForm, addMove, e1rmEstimate, formOf, moveRpe, persistLog, removeAdded, saveTestMax, tapStatus, typeNotes } from '../../frontends/native/src/day-detail/sheet-writes.ts';
import { type Session, snapshotDay } from '../../frontends/native/src/deck/deck-writes.ts';

const DAY = 86400000;
const NOW = new Date(2026, 10, 16, 12, 0, 0).getTime();
const filled = (keys: Record<string, unknown>): StateStore => { const s = memoryStore(); for (const [k, v] of Object.entries(keys)) s.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return s; };
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)!]));
const json = (s: StateStore, k: string): Record<string, Record<string, unknown>> => JSON.parse(s.get(k) || '{}');
const NATIVE = join(REPO, 'frontends/native/src');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

const lift = (name: string, detail: string) => ({ name, detail });
/** A program of one week: a lift day with a run beside it, a rest day, a day with no title and no run. */
const program = (over: Partial<SheetProgram> = {}): SheetProgram => ({
  id: 'p1', cfg: { unit: 'lbs' },
  weeks: {
    1: {
      mon: {
        title: 'Posterior Chain', tags: ['run', 'lift', 'rest'],
        cardio: { type: 'run', subtype: 'Easy Run', detail: '30 minutes easy, conversational.' },
        sections: [
          { label: 'Main — Hinge', items: [lift('Deadlift', '3×5 — RPE 7, 3 min rest')] },
          { label: 'Accessory', items: [lift('Barbell row', '2×6–10 @ RPE 7'), lift('Pushups', '3×12')] },
        ],
      },
      tue: { rest: true },
      sun: { sections: [{ label: 'Main — Squat', items: [lift('Back squat', '3×5')] }] },
    },
  },
  ...over,
} as SheetProgram);
const session = (store: StateStore, prog: SheetProgram, dayKey = 'mon'): Session => ({ store, prog, week: 1, dayKey });

describe('native session sheet: the models are today\'s files', () => {
  // The Expo app draws the sheet from copies of the Angular sheet's models. A copy can drift, so each is held equal
  // to the byte: a change to today's turns this red until the copy is made again.
  for (const f of ['day-detail-model.ts', 'session-log-model.ts', 'cardio-fields-model.ts', 'cardio-card-model.ts', 'sheet-marks-model.ts']) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(REPO, 'frontends/app/src/app/screens/day-detail', f));
      const copy = readFileSync(join(NATIVE, 'day-detail', f));
      assert.ok(today.length > 2000);
      assert.ok(copy.equals(today), f + ' differs from today\'s: copy it again (cp), never edit the copy');
    });
  }
  test('add-sheet-model.ts in frontends/native is frontends/app\'s, byte for byte', () => {
    const today = readFileSync(join(REPO, 'frontends/app/src/app/screens/add-sheet/add-sheet-model.ts'));
    const copy = readFileSync(join(NATIVE, 'add-sheet/add-sheet-model.ts'));
    assert.ok(today.length > 2000);
    assert.ok(copy.equals(today), 'add-sheet-model.ts differs from today\'s: copy it again (cp), never edit the copy');
  });
  test('the sheet\'s folder holds the screen, its view, its readers, the add sheet\'s readers, its writes and the seven models, and the cardio log\'s block, wheel and rules; the add sheet\'s holds its screen and its model', () => {
    assert.deepStrictEqual(readdirSync(join(NATIVE, 'day-detail')).sort(), [
      'CardioLogBlock.tsx', 'SessionSheet.tsx', 'Wheel.tsx', 'cardio-card-model.ts', 'cardio-fields-model.ts', 'cardio-log.ts', 'cardio-sheet-model.ts', 'day-detail-model.ts', 'session-log-model.ts',
      'session-sections-model.ts', 'sheet-adds.ts', 'sheet-marks-model.ts', 'sheet-readers.ts', 'sheet-screen.ts', 'sheet-writes.ts', 'wheels.ts',
    ]);
    assert.deepStrictEqual(readdirSync(join(NATIVE, 'add-sheet')).sort(), ['AddSheet.tsx', 'add-sheet-model.ts']);
  });
});

describe('native session sheet: the page\'s tables', () => {
  test('a header tag\'s words and its two colours, by the tag', () => {
    assert.deepStrictEqual(Object.keys(MOD_PAL).sort(), ['bike', 'core', 'hip', 'lift', 'peak', 'run', 'swim', 'test']);
    assert.deepStrictEqual(MOD_PAL['run'], ['var(--run)', 'rgba(var(--run-rgb),0.15)']);
    assert.deepStrictEqual([MOD_PAL['test']![0], MOD_PAL['peak']![0]], ['var(--signal)', 'var(--signal)']);
    assert.deepStrictEqual(Object.fromEntries(Object.entries(TAG_META).map(([k, v]) => [k, v.label])), { test: 'Test Week', peak: 'Peak Week', run: 'Run', bike: 'Bike', swim: 'Swim', lift: 'Lift', hip: 'Hip', core: 'Core' });
  });
  test('the effort slider\'s ten words', () => {
    assert.deepStrictEqual(RPE_LABELS, { 1: 'Very Easy', 2: 'Easy', 3: 'Moderate', 4: 'Somewhat Hard', 5: 'Hard', 6: 'Hard+', 7: 'Very Hard', 8: 'Very Hard+', 9: 'Max Effort', 10: 'All Out' });
  });
  test('the four wheels: miles to the hundredth, pace from 4 to 17 minutes with a dash, a rep under ten minutes, time under ten hours', () => {
    assert.deepStrictEqual(Object.keys(IAW_SPEC).sort(), ['dist', 'hms', 'pace', 'rept']);
    assert.deepStrictEqual(IAW_SPEC['dist'], { fmt: 'dec3', cap: 'Miles', cols: [{ min: 0, max: 99, wrap: false }, { min: 0, max: 9, dot: true }, { min: 0, max: 9 }] });
    assert.deepStrictEqual(IAW_SPEC['pace'], { fmt: 'clock', cap: 'Pace / mile', cols: [{ min: 4, max: 17, nil: true }, { min: 0, max: 59, pad: 2 }] });
    assert.deepStrictEqual(IAW_SPEC['rept'], { fmt: 'clock', cap: 'Typical rep', cols: [{ min: 0, max: 9, wrap: false }, { min: 0, max: 59, pad: 2 }] });
    assert.deepStrictEqual(IAW_SPEC['hms'], { fmt: 'hms', cap: 'Time', cols: [{ min: 0, max: 9, wrap: false }, { min: 0, max: 59, pad: 2 }, { min: 0, max: 59, pad: 2 }] });
  });
  test('the RPE reference carries today\'s words', () => {
    assert.equal(RPE_INFO.title, 'RPE — Rate of Perceived Exertion');
    assert.deepStrictEqual(RPE_INFO.scale.map((r) => r[0]), ['1–3', '4–6', '7–8', '9–10']);
    assert.equal(RPE_INFO.scale[2][1], 'Hard — a few words at a time');
    assert.equal(RPE_INFO.notes.length, 3);
    assert.ok(RPE_INFO.notes[0].includes('RPE 8 ≈ 2 reps left in the tank'));
    assert.equal(RPE_INFO.close, 'Got it');
  });
  test('a colour named by the page\'s token: its name, and its alpha when it is a tint', () => {
    assert.deepStrictEqual(tokenOf('var(--run)'), { name: 'run', alpha: 1 });
    assert.deepStrictEqual(tokenOf('rgba(var(--core-rgb),0.15)'), { name: 'core', alpha: 0.15 });
    assert.equal(tokenOf('#fff'), null);
  });
});

describe('native session sheet: the logged counter', () => {
  const day = { sections: [
    { label: 'Main', items: [lift('Deadlift', '3×5'), { name: 'Pushups', detail: '3×12', _skipped: true }] },
    { label: 'Round', _skipped: true, items: [lift('Dumbbell row', '3×10 each')] },
    { label: 'Accessory', items: [lift('Barbell row', '2×6–10 @ RPE 7'), lift('Walk it off', '')] },
  ] };
  test('a move with a prescription the card can read is counted; a move with none is not', () => {
    assert.equal(exLoggable('Deadlift', '3×5'), true);
    assert.equal(exLoggable('Walk it off', ''), false);
  });
  test('skipped moves and a skipped round are in neither number; a lift is done once the log holds it for this week and day', () => {
    assert.deepStrictEqual(sessionLogProgress(day as never, {}, 1, 'mon'), { done: 0, total: 2 });
    const stored = { deadlift: { entries: [{ week: 1, day: 'mon', weight: 225 }] }, barbell_row: { entries: [{ week: 1, day: 'tue', weight: 95 }, { week: 2, day: 'mon', weight: 95 }] } };
    assert.deepStrictEqual(sessionLogProgress(day as never, stored as never, 1, 'mon'), { done: 1, total: 2 });
    assert.deepStrictEqual(sessionLogProgress(null, {}, 1, 'mon'), { done: 0, total: 0 });
  });
});

describe('native session sheet: the run\'s dose and what a log derives from it', () => {
  test('a clock read as seconds', () => {
    assert.equal(parseClock('2:04'), 124);
    assert.equal(parseClock('90'), 90);
    assert.equal(parseClock(''), null);
    assert.equal(parseClock('1:02:03'), null);
    assert.equal(parseClock('abc'), null);
    assert.equal(fmtPaceMi(540), '9:00');
    assert.equal(fmtPaceMi(0), null);
    assert.equal(fmtPaceMi(undefined), null);
  });
  test('the dose the session carries wins; else its words are read: reps of a distance, reps of a time, a time, a distance', () => {
    const own = { k: 'time', mins: 40 };
    assert.equal(doseFromCardio({ type: 'run', detail: '3 miles', dose: own }), own);
    assert.deepStrictEqual(doseFromCardio({ type: 'run', detail: '6 x 400m at 7:30/mi, 90 sec jog between' }), { k: 'reps_dist', reps: 6, m: 400, tgt: 450, parsed: true });
    assert.deepStrictEqual(doseFromCardio({ type: 'run', detail: '4 x 5 min hard, 2 min easy' }), { k: 'reps_time', reps: 4, mins: 5, tgt: null, parsed: true });
    assert.deepStrictEqual(doseFromCardio({ type: 'run', detail: '30 minutes easy, conversational.' }), { k: 'time', mins: 30, tgt: null, parsed: true });
    assert.deepStrictEqual(doseFromCardio({ type: 'run', detail: '3 miles at 9:00/mi' }), { k: 'dist', mi: 3, tgt: 540, parsed: true });
  });
  test('a progression run carries no target pace; a bike interval and a swim are never read; no session, no dose', () => {
    assert.deepStrictEqual(doseFromCardio({ type: 'run', detail: '5 miles as a progression, from 10:00/mi down' }), { k: 'dist', mi: 5, tgt: null, parsed: true });
    assert.equal(doseFromCardio({ type: 'bike', subtype: 'Intervals', detail: '8 x 45s hard, 3 min easy warmup' }), null);
    assert.deepStrictEqual(doseFromCardio({ type: 'bike', subtype: 'Endurance', detail: '45 min steady' }), { k: 'time', mins: 45, tgt: null, parsed: true });
    assert.equal(doseFromCardio({ type: 'swim', detail: '1,500 yd' }), null);
    assert.equal(doseFromCardio({ type: 'swim', detail: '30 min easy' }), null, 'a swim keeps its yards form whatever its words say');
    assert.equal(doseFromCardio(null), null);
  });
  test('a timed run: the miles are free, the pace derives, and a blank time is the plan\'s', () => {
    const dose = { k: 'time', mins: 30 };
    assert.deepStrictEqual(doseDerived(dose, { mins: '', dist: '', reps: '', rep: '' }), {});
    // 30 min over 3 mi is 600 s a mile; 27 min over 3 mi is 540.
    assert.deepStrictEqual(doseDerived(dose, { mins: '', dist: '3.00', reps: '', rep: '' }), { sec: 600, pace: '10:00/mi', tgt: undefined, assumed: 'assuming planned 30 min' });
    assert.deepStrictEqual(doseDerived(dose, { mins: '27.00', dist: '3.00', reps: '', rep: '' }), { sec: 540, pace: '9:00/mi', tgt: undefined, assumed: null });
  });
  test('a run by distance: the time is free, and a blank distance is the plan\'s, handed back to be stamped', () => {
    const dose = { k: 'dist', mi: 3, tgt: 540 };
    assert.deepStrictEqual(doseDerived(dose, { mins: '', dist: '', reps: '', rep: '' }), {});
    assert.deepStrictEqual(doseDerived(dose, { mins: '27', dist: '', reps: '', rep: '' }), { sec: 540, pace: '9:00/mi', tgt: 540, dist: 3, assumed: 'assuming planned 3 mi' });
    assert.deepStrictEqual(doseDerived(dose, { mins: '30', dist: '4', reps: '', rep: '' }), { sec: 450, pace: '7:30/mi', tgt: 540, dist: null, assumed: null });
  });
  test('reps of a distance: the reps give the miles, the typical rep gives the pace; reps of a time: the miles give the pace', () => {
    // 6 × 400 m is 2,400 m, 1.49 mi to the hundredth.
    assert.deepStrictEqual(doseDerived({ k: 'reps_dist', reps: 6, m: 400 }, { mins: '', dist: '', reps: '6', rep: '' }), { dist: 1.49, vol: '6 × 400m' });
    assert.deepStrictEqual(doseDerived({ k: 'reps_dist', reps: 6, m: 400 }, { mins: '', dist: '', reps: '', rep: '' }), {});
    // 4 × 5 min is 20 min of work; over 2.5 mi that is 480 s a mile. With no reps logged the plan's four are assumed.
    assert.deepStrictEqual(doseDerived({ k: 'reps_time', reps: 4, mins: 5 }, { mins: '', dist: '2.5', reps: '4', rep: '' }), { sec: 480, pace: '8:00/mi', tgt: undefined, workMin: 20, assumed: null });
    assert.deepStrictEqual(doseDerived({ k: 'reps_time', reps: 4, mins: 5 }, { mins: '', dist: '2.5', reps: '', rep: '' }), { sec: 480, pace: '8:00/mi', tgt: undefined, workMin: 20, assumed: 'assuming planned 4 reps' });
    // Three of the four reps done is 15 min of work; over 2.5 mi that is 360 s a mile.
    assert.deepStrictEqual(doseDerived({ k: 'reps_time', reps: 4, mins: 5 }, { mins: '', dist: '2.5', reps: '3', rep: '' }), { sec: 360, pace: '6:00/mi', tgt: undefined, workMin: 15, assumed: null });
    assert.equal(doseDerived(null, { mins: '1', dist: '1', reps: '', rep: '' }), null);
  });
  test('the words under the sport picker, and the cardio card\'s Log', () => {
    assert.equal(cardioSwapNoteText('bike', 'run', {}), 'Counts toward Bike, not Run.');
    assert.equal(cardioSwapNoteText('bike', 'run', { parked: { run: { run_dist: '3.10', run_pace: '' } } }), 'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.');
    assert.equal(cardioSwapNoteText('swim', 'run', { parked: { run: { run_dist: '', run_pace: '' } } }), 'Counts toward Swim, not Run.');
    assert.deepStrictEqual([cardioLogLabel(true), cardioLogLabel(false)], ['Logged ✓', 'Log']);
  });
  test('the benchmark run logged in a week: named by the day\'s snapshot, timed by its log or else its plan, never a swapped one', () => {
    const bench = { cardio: { type: 'run', subtype: 'Benchmark Run — Baseline', dose: { k: 'time', mins: 20 } } };
    const store = filled({
      ia_logs_p1: { w1_sat: { run_dist: '1.80', run_mins: '' }, w1_mon: { run_dist: '3.00', run_mins: '27' }, w6_sat: { run_dist: '2.00', run_mins: '19' }, w7_sat: { run_dist: '2.00', swapTo: 'bike' }, w8_sat: { run_dist: '2.00' } },
      ia_hist_p1: { w1_sat: bench, w1_mon: { cardio: { type: 'run', subtype: 'Easy Run' } }, w6_sat: { cardio: { type: 'run', subtype: 'Benchmark Run — Retest' } }, w7_sat: bench },
    });
    // 20 planned minutes over 1.8 mi; 19 logged minutes over 2 mi is 570 s a mile.
    assert.deepStrictEqual(benchmarkEntryFor(store, 'p1', 1), { dist: 1.8, mins: 20, sec: 1200 / 1.8 });
    assert.deepStrictEqual(benchmarkEntryFor(store, 'p1', 6), { dist: 2, mins: 19, sec: 570 });
    assert.equal(benchmarkEntryFor(store, 'p1', 7), null, 'a swapped session is passed over');
    assert.equal(benchmarkEntryFor(store, 'p1', 8), null, 'a day with no snapshot is passed over');
    assert.equal(benchmarkEntryFor(store, 'p1', 2), null);
    // A benchmark whose snapshot carries no planned time and whose log holds none is taken as 20 minutes: 1,200 s over 2 mi.
    const bare = filled({ ia_logs_p1: { w1_sat: { run_dist: '2.00' } }, ia_hist_p1: { w1_sat: { cardio: { type: 'run', subtype: 'Benchmark Run — Baseline' } } } });
    assert.deepStrictEqual(benchmarkEntryFor(bare, 'p1', 1), { dist: 2, mins: 20, sec: 600 });
  });
});

describe('native session sheet: a day drawn as a sheet', () => {
  test('a lift day with a run: the header, the counter, the body in today\'s order, the foot', () => {
    const v = sheetView(memoryStore(), program(), 1, 'mon', NOW)!;
    assert.deepStrictEqual([v.over, v.title, v.counter, v.footTitle], ['Week 1 · Monday', 'Posterior Chain', '0 / 3 logged', 'Posterior Chain']);
    assert.deepStrictEqual(v.tags, { chips: [{ label: 'Run', color: 'var(--run)', bg: 'rgba(var(--run-rgb),0.15)' }, { label: 'Lift', color: 'var(--lift)', bg: 'rgba(var(--lift-rgb),0.15)' }], travel: false });
    // Lifting first when lifting is the priority: the main section, the rest, then the run, then the log.
    assert.deepStrictEqual(v.body.map((b) => b.kind), ['sections', 'sections', 'cardio', 'log']);
    assert.deepStrictEqual(sheetMoves(v).map((x) => [x.name, x.detail]), [['Deadlift', '3×5 — RPE 7, 3 min rest'], ['Barbell row', '2×6–10 @ RPE 7'], ['Pushups', '3×12']]);
    assert.deepStrictEqual(v.foot, [
      { id: 'statusBtn_complete', cls: 'day-done', label: 'Done', undo: false, status: 'complete' },
      { id: 'statusBtn_skipped', cls: 'day-skip', label: 'Skip', undo: false, status: 'skipped' },
    ]);
    const cardio = v.body[2] as { card: { label: string; detail: string; blockCls: string } };
    assert.deepStrictEqual([cardio.card.label, cardio.card.detail, cardio.card.blockCls], ['Run — Easy Run', '30 minutes easy, conversational.', 'run-block']);
  });
  test('its log: a slider nobody has moved, the run\'s fields drawn for a timed run, and the dose its saves derive from', () => {
    const v = sheetView(memoryStore(), program(), 1, 'mon', NOW)!;
    const log = logOf(v);
    assert.deepStrictEqual([log.view.rpeValue, log.view.rpeText, log.view.notes], ['5', 'Move slider', '']);
    assert.deepStrictEqual({ ...log.view.cardio, chips: log.view.cardio!.chips.map((c) => c.label) }, { planned: 'run', active: 'run', logged: false, swapped: false, chips: ['Run · planned', 'Bike', 'Swim'], note: '', logLabel: 'Log' });
    assert.equal(log.fields.kind, 'time');
    const f = log.fields as Extract<CardioFields, { first: unknown }>;
    assert.deepStrictEqual([f.first.hiddenId, f.first.value, f.first.plan, f.second.hiddenId, f.second.value, f.strip.label, f.strip.value], ['log_run_mins', '', '30', 'log_run_dist', '', 'Run — EASY · Planned', '30 min']);
    assert.deepStrictEqual(v.dose, { k: 'time', mins: 30, tgt: null, parsed: true });
  });
  test('on an event program, or a support focus, the run keeps the top', () => {
    assert.deepStrictEqual(sheetView(memoryStore(), program({ primaryPath: 'event' }), 1, 'mon', NOW)!.body.map((b) => b.kind), ['cardio', 'sections', 'sections', 'log']);
    assert.deepStrictEqual(sheetView(memoryStore(), program({ liftingFocus: 'support_strength' }), 1, 'mon', NOW)!.body.map((b) => b.kind), ['cardio', 'sections', 'sections', 'log']);
  });
  test('the stored state shows on it: a lift logged, the day\'s effort and notes, the day done under the title it was closed with', () => {
    const store = filled({
      ia_exw_p1: { deadlift: { name: 'Deadlift', entries: [{ week: 1, day: 'mon', weight: 225, setsDone: [5, 5, 4], setsW: [225, 225, 225], ts: NOW - DAY }] } },
      ia_logs_p1: { w1_mon: { rpe: '8', notes: 'Bar felt heavy', run_dist: '3.00', run_mins: '27.00', week: 1, ts: NOW } },
      ia_comp_p1: { w1_mon: { title: 'Closed As This', status: 'complete', ts: NOW } },
    });
    const before = held(store);
    const v = sheetView(store, program(), 1, 'mon', NOW)!;
    assert.deepStrictEqual([v.title, v.counter], ['Closed As This', '1 / 3 logged']);
    const log = logOf(v);
    assert.deepStrictEqual([log.view.rpeValue, log.view.rpeText, log.view.notes, log.view.cardio!.logged, log.view.cardio!.logLabel], ['8', '8 — Very Hard+', 'Bar felt heavy', true, 'Logged ✓']);
    assert.deepStrictEqual(v.foot.map((b) => [b.label, b.undo, b.cls, b.status]), [['Done ✓ ', true, 'day-done is', 'complete'], ['Skip', false, 'day-skip', 'skipped']]);
    assert.deepStrictEqual(sheetMoves(v).map((x) => x.logged), [true, false, false]);
    assert.deepStrictEqual(held(store), before, 'drawing the sheet wrote nothing');
  });
  test('a skipped day carries Skipped big and Done small; the foot alone is drawn again after an undo', () => {
    const store = filled({ ia_comp_p1: { w1_mon: { status: 'skipped', ts: NOW } } });
    assert.deepStrictEqual(sheetView(store, program(), 1, 'mon', NOW)!.foot.map((b) => [b.id, b.label, b.undo, b.cls, b.status]), [
      ['statusBtn_skipped', 'Skipped ✕ ', true, 'day-done skipped', 'skipped'], ['statusBtn_complete', 'Done', false, 'day-skip', 'complete']]);
    assert.deepStrictEqual(footOf(memoryStore(), program(), 1, 'mon').map((b) => b.label), ['Done', 'Skip']);
    // A record with no status, and the old partial, read as done (V181 D1).
    assert.equal(footOf(filled({ ia_comp_p1: { w1_mon: { ts: NOW } } }), program(), 1, 'mon')[0].label, 'Done ✓ ');
    assert.equal(footOf(filled({ ia_comp_p1: { w1_mon: { status: 'partial', ts: NOW } } }), program(), 1, 'mon')[0].label, 'Done ✓ ');
  });
  test('the two nudges: the top of the range hit on every set last time, and a day logged but never marked', () => {
    const store = filled({
      ia_exw_p1: { barbell_row: { name: 'Barbell row', entries: [{ week: 0, day: 'mon', weight: 95, setsDone: [10, 10], ts: NOW - 7 * DAY }] } },
      ia_logs_p1: { w1_mon: { notes: 'Did it at lunch', week: 1, ts: NOW } },
    });
    const v = sheetView(store, program(), 1, 'mon', NOW)!;
    assert.deepStrictEqual(v.body.map((b) => b.kind), ['nudge', 'sections', 'sections', 'cardio', 'log', 'logNudge']);
    assert.deepStrictEqual((v.body[0] as { nudge: unknown }).nudge, { shown: ['Barbell row'], extra: '' });
    assert.deepStrictEqual(v.body[5], { kind: 'logNudge', dayKey: 'mon', title: 'Posterior Chain' });
    // One set short of the top, no nudge; a status on the day, no never marked nudge.
    const short = filled({ ia_exw_p1: { barbell_row: { name: 'Barbell row', entries: [{ week: 0, day: 'mon', weight: 95, setsDone: [10, 9] }] } }, ia_logs_p1: { w1_mon: { notes: 'x' } }, ia_comp_p1: { w1_mon: { status: 'complete', ts: NOW } } });
    assert.deepStrictEqual(sheetView(short, program(), 1, 'mon', NOW)!.body.map((b) => b.kind), ['sections', 'sections', 'cardio', 'log']);
  });
  test('a run logged as a ride: the card is on the bike, its fields are the bike\'s, no dose is planned for it, and it is live by the bike\'s number', () => {
    const store = filled({ ia_logs_p1: { w1_mon: { swapTo: 'bike', swapFrom: 'run', bike_mins: '40.00', parked: { run: { run_dist: '3.10' } } } } });
    const v = sheetView(store, program(), 1, 'mon', NOW)!;
    const log = logOf(v);
    assert.deepStrictEqual({ ...log.view.cardio, chips: log.view.cardio!.chips.map((c) => c.label) }, {
      planned: 'run', active: 'bike', logged: true, swapped: true, chips: ['Run · planned', 'Bike', 'Swim'],
      note: 'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.', logLabel: 'Logged ✓',
    });
    assert.equal(v.dose, null, 'a swapped sport has no planned dose');
    const f = log.fields as Extract<CardioFields, { kind: 'bike' }>;
    assert.deepStrictEqual([f.kind, f.strip, f.wheel.hiddenId, f.wheel.value], ['bike', null, 'log_bike_mins', '40.00']);
    assert.deepStrictEqual(formOf(log).wrap, { planned: 'run', active: 'bike' });
    // The run's own number alone does not make the bike's card live.
    const parkedOnly = filled({ ia_logs_p1: { w1_mon: { swapTo: 'bike', swapFrom: 'run', run_dist: '3.10' } } });
    assert.equal(logOf(sheetView(parkedOnly, program(), 1, 'mon', NOW)!).view.cardio!.logged, false);
  });
  test('a jog logged on the day from the rest sheet stands above everything in the view', () => {
    const store = filled({ ia_logs_p1: { w1_mon: { restLog: { run: { mins: 20, rpe: 4 } } } } });
    const v = sheetView(store, program(), 1, 'mon', NOW)!;
    assert.deepStrictEqual(v.body[0], { kind: 'also', label: 'Also on Monday', lines: ['20 min run logged · RPE 4'], week: 1, dayKey: 'mon' });
    assert.deepStrictEqual(drawnBlocks(v).map((b) => b.kind), ['also', 'sections', 'sections', 'cardio', 'log'], 'and is drawn there');
    // Two jogs are two lines; a type with neither a time nor a distance is no line, and no line is no block.
    const two = sheetView(filled({ ia_logs_p1: { w1_mon: { restLog: { run: { mins: 20, rpe: 4 }, walk: { mins: 45 }, bike: {} } } } }), program(), 1, 'mon', NOW)!;
    assert.deepStrictEqual((two.body[0] as { lines: string[] }).lines.length, 2);
    assert.notEqual(sheetView(filled({ ia_logs_p1: { w1_mon: { restLog: { bike: {} } } } }), program(), 1, 'mon', NOW)!.body[0]!.kind, 'also');
  });
  test('a day with no title, no run and no tags: Training, no cardio card, no fields, a foot title of nothing', () => {
    const v = sheetView(memoryStore(), program(), 1, 'sun', NOW)!;
    assert.deepStrictEqual([v.over, v.title, v.footTitle, v.counter, v.dose], ['Week 1 · Sunday', 'Training', '', '0 / 1 logged', null]);
    assert.deepStrictEqual(v.body.map((b) => b.kind), ['sections', 'log']);
    assert.deepStrictEqual([logOf(v).view.cardio, logOf(v).fields], [null, { kind: 'none' }]);
    assert.deepStrictEqual(v.tags, { chips: [], travel: false });
  });
  test('the view holds the whole day: a test day\'s 1RM card between the main lift and the rest, and the day\'s note after the work', () => {
    const prog = program();
    const mon = prog.weeks[1]!['mon'] as { testLift?: string; note?: string };
    mon.testLift = 'deadlift';
    mon.note = 'Test it, log it.';
    const store = filled({ ia_exw_p1: { deadlift: { name: 'Deadlift', entries: [{ week: 1, day: 'mon', weight: 315, setsDone: [2], ts: NOW }] } } });
    const v = sheetView(store, prog, 1, 'mon', NOW)!;
    assert.deepStrictEqual(v.body.map((b) => b.kind), ['sections', 'e1rm', 'sections', 'cardio', 'note', 'log']);
    assert.deepStrictEqual((v.body[1] as { card: unknown }).card, { lift: 'deadlift', liftLabel: 'deadlift', unit: 'lbs', weight: '315', reps: 2 });
  });
  test('the screen draws every kind of block the view holds, in the view\'s order', () => {
    assert.deepStrictEqual([...SHEET_DRAWS], ['also', 'wildcard', 'nudge', 'sections', 'e1rm', 'cardio', 'note', 'log', 'logNudge']);
    const prog = program();
    (prog.weeks[1]!['mon'] as { testLift?: string; note?: string }).testLift = 'deadlift';
    (prog.weeks[1]!['mon'] as { testLift?: string; note?: string }).note = 'Test it, log it.';
    const v = sheetView(memoryStore(), prog, 1, 'mon', NOW)!;
    assert.deepStrictEqual(drawnBlocks(v).map((b) => b.kind), ['sections', 'e1rm', 'sections', 'cardio', 'note', 'log']);
    assert.deepStrictEqual(drawnBlocks(v), v.body, 'nothing of the view is left undrawn');
  });
  // The view held the tag before the screen drew it (the sheet's first session): this guards what must not change.
  test('a Wildcard done in the day\'s place: its tag stands above the work, under a jog, with the day named as still on the board', () => {
    const store = filled({ ia_wild_p1: [{ week: 1, dayKey: 'mon', ts: NOW }], ia_logs_p1: { w1_mon: { restLog: { run: { mins: 20, rpe: 4 } } } } });
    const v = sheetView(store, program(), 1, 'mon', NOW)!;
    assert.deepStrictEqual(v.body.slice(0, 2).map((b) => b.kind), ['also', 'wildcard']);
    assert.deepStrictEqual(v.body[1], { kind: 'wildcard', sub: 'Posterior Chain is still on the board.' });
    // A day with no title is "Your session"; a Wildcard done on another day shows no tag here.
    const sun = sheetView(filled({ ia_wild_p1: [{ week: 1, dayKey: 'sun', ts: NOW }] }), program(), 1, 'sun', NOW)!;
    assert.deepStrictEqual(sun.body[0], { kind: 'wildcard', sub: 'Your session is still on the board.' });
    assert.ok(!sheetView(filled({ ia_wild_p1: [{ week: 1, dayKey: 'sun', ts: NOW }] }), program(), 1, 'mon', NOW)!.body.some((b) => b.kind === 'wildcard'));
  });
  test('no sheet for a rest day or a day the grid does not hold', () => {
    assert.equal(sheetView(memoryStore(), program(), 1, 'tue', NOW), null);
    assert.equal(sheetView(memoryStore(), program(), 1, 'wed', NOW), null);
    assert.equal(sheetView(memoryStore(), program(), 2, 'mon', NOW), null);
    assert.equal(sheetDay(program(), 1, 'tue'), null);
  });
  test('each move\'s fields are the card\'s own, by its key', () => {
    const v = sheetView(memoryStore(), program(), 1, 'mon', NOW)!;
    const F = sheetFields(v);
    assert.deepStrictEqual(Object.keys(F), ['deadlift', 'barbell_row', 'pushups']);
    assert.deepStrictEqual(F['deadlift']!.reps.map((r) => r.value), ['5', '5', '5']);
    assert.equal(F['pushups']!.logged, false);
  });
});

describe('native session sheet: the log\'s form', () => {
  const wheel = (hiddenId: string, value: string) => ({ kind: 'dist', hiddenId, value, cap: '', ncols: 3, plan: null, cols: [] });
  const strip = { bike: false, label: '', value: '' };
  const drawn = (fields: CardioFields, cardio: { planned: string; active: string } | null = { planned: 'run', active: 'run' }): LogForm => formOf({
    view: { rpeValue: '5', rpeText: 'Move slider', notes: 'kept', cardio: cardio ? { ...cardio, logged: false, swapped: false, chips: [], note: '', logLabel: 'Log' } : null },
    fields,
  });
  test('a draw leaves a slider nobody has moved, the stored notes, and the card\'s two sports', () => {
    assert.deepStrictEqual(drawn({ kind: 'none' }, null), { rpe: '5', touched: false, notes: 'kept', nodes: {}, wrap: null });
    assert.deepStrictEqual(drawn({ kind: 'swim', yards: '1500' }, { planned: 'run', active: 'swim' }).wrap, { planned: 'run', active: 'swim' });
  });
  test('every cardio field the template draws is a node of the form, with the value it was drawn with', () => {
    assert.deepStrictEqual(drawn({ kind: 'time', strip, first: wheel('log_run_mins', '27.00'), second: wheel('log_run_dist', '3.00') }).nodes, { log_run_mins: '27.00', log_run_dist: '3.00' });
    assert.deepStrictEqual(drawn({ kind: 'dist', strip, first: wheel('log_run_dist', ''), second: wheel('log_run_mins', '31.50') }).nodes, { log_run_dist: '', log_run_mins: '31.50' });
    assert.deepStrictEqual(drawn({ kind: 'reps_dist', strip, stepper: { shown: '6', of: 'of 6', stored: '5' }, wheel: wheel('log_run_rep_time', '1:32') }).nodes, { log_run_reps: '5', log_run_rep_time: '1:32' });
    assert.deepStrictEqual(drawn({ kind: 'reps_time', strip, stepper: { shown: '4', of: 'of 4', stored: '' }, wheel: wheel('log_run_dist', '2.50') }).nodes, { log_run_reps: '', log_run_dist: '2.50' });
    assert.deepStrictEqual(drawn({ kind: 'run', speedHint: false, dist: wheel('log_run_dist', '4.20'), pace: wheel('log_run_pace', '8:45') }).nodes, { log_run_dist: '4.20', log_run_pace: '8:45' });
    assert.deepStrictEqual(drawn({ kind: 'bike', strip: null, wheel: wheel('log_bike_mins', '45.00') }).nodes, { log_bike_mins: '45.00' });
    assert.deepStrictEqual(drawn({ kind: 'swim', yards: '1500' }).nodes, { log_swim_yards: '1500' });
  });
  test('the slider moved is a number and a mark; the notes typed are the notes', () => {
    const f = drawn({ kind: 'none' }, null);
    assert.deepStrictEqual(moveRpe(f, 7), { ...f, rpe: '7', touched: true });
    assert.deepStrictEqual(typeNotes(f, 'New words'), { ...f, notes: 'New words' });
    assert.equal(f.touched, false, 'the form given is left as it was');
  });
});

describe('native session sheet: the log saved as it changes', () => {
  const blank = (over: Partial<LogForm> = {}): LogForm => ({ rpe: '5', touched: false, notes: '', nodes: { log_run_mins: '', log_run_dist: '' }, wrap: { planned: 'run', active: 'run' }, ...over });
  const dose = { k: 'time', mins: 30 };
  test('notes on a card that holds no run: the entry written whole, the effort blank until the slider is moved, every cardio key blank', () => {
    const store = memoryStore(), prog = program();
    persistLog(session(store, prog), blank({ notes: 'Bar felt heavy' }), dose, false, NOW);
    assert.equal(store.get('ia_logs_p1'), '{"w1_mon":{"rpe":"","run_dist":"","run_pace":"","run_mins":"","run_reps":"","run_rep_time":"","bike_mins":"","swim_yards":"","notes":"Bar felt heavy","swapFrom":"","swapTo":"","week":1,"ts":' + NOW + '}}');
    // A log entry marks the day touched: the day is snapshotted, once, as it stood.
    assert.deepStrictEqual(json(store, 'ia_hist_p1')['w1_mon'], JSON.parse(JSON.stringify(prog.weeks[1]!['mon'])));
    assert.deepStrictEqual(store.keys().sort(), ['ia_hist_p1', 'ia_logs_p1']);
  });
  test('the slider moved stores its number; left alone, the entry keeps the effort it had', () => {
    const store = filled({ ia_logs_p1: { w1_mon: { rpe: '6', notes: 'old' } } });
    persistLog(session(store, program()), blank({ notes: 'new' }), dose, false, NOW);
    assert.deepStrictEqual([json(store, 'ia_logs_p1')['w1_mon']!['rpe'], json(store, 'ia_logs_p1')['w1_mon']!['notes']], ['6', 'new']);
    persistLog(session(store, program()), moveRpe(blank({ notes: 'new' }), 9), dose, false, NOW);
    assert.equal(json(store, 'ia_logs_p1')['w1_mon']!['rpe'], '9');
  });
  test('a draft card stores none of its numbers (D218): a value on the form stays on the form until a commit', () => {
    const store = memoryStore();
    const f = blank({ nodes: { log_run_mins: '27.00', log_run_dist: '3.00' } });
    persistLog(session(store, program()), f, dose, false, NOW);
    const e = json(store, 'ia_logs_p1')['w1_mon']!;
    assert.deepStrictEqual([e['run_mins'], e['run_dist'], e['run_pace']], ['', '', '']);
    // The commit (Done, Skip) reads the form, and the pace derives: 27 min over 3 mi is 9:00 a mile.
    persistLog(session(store, program()), f, dose, true, NOW);
    const c = json(store, 'ia_logs_p1')['w1_mon']!;
    assert.deepStrictEqual([c['run_mins'], c['run_dist'], c['run_pace']], ['27.00', '3.00', '9:00/mi']);
  });
  test('a live card is read from the form on every save, its derived pace filled in only where the form holds none', () => {
    const store = filled({ ia_logs_p1: { w1_mon: { run_dist: '3.00', run_mins: '27.00', run_pace: '9:00/mi', notes: '' } } });
    persistLog(session(store, program()), blank({ notes: 'after', nodes: { log_run_mins: '30.00', log_run_dist: '3.00' } }), dose, false, NOW);
    const e = json(store, 'ia_logs_p1')['w1_mon']!;
    assert.deepStrictEqual([e['run_mins'], e['run_dist'], e['run_pace'], e['notes']], ['30.00', '3.00', '10:00/mi', 'after']);
    // A pace the form itself holds is never written over by the derived one (the dosed forms draw no pace field; the rule is the page's own guard).
    const typed = filled({ ia_logs_p1: { w1_mon: { run_dist: '3.00' } } });
    persistLog(session(typed, program()), blank({ nodes: { log_run_mins: '27.00', log_run_dist: '3.00', log_run_pace: '8:00' } }), dose, false, NOW);
    assert.equal(json(typed, 'ia_logs_p1')['w1_mon']!['run_pace'], '8:00');
    // On a run by distance a blank miles wheel is the plan's, stamped as text.
    const byDist = filled({ ia_logs_p1: { w1_mon: { run_mins: '27.00' } } });
    persistLog(session(byDist, program()), blank({ nodes: { log_run_dist: '', log_run_mins: '27.00' } }), { k: 'dist', mi: 3 }, false, NOW);
    assert.deepStrictEqual([json(byDist, 'ia_logs_p1')['w1_mon']!['run_dist'], json(byDist, 'ia_logs_p1')['w1_mon']!['run_pace']], ['3', '9:00/mi']);
  });
  test('a card on a swapped sport is live by that sport\'s numbers, not the planned sport\'s', () => {
    // The entry holds a ride; the form is on the bike: live, so the ride's minutes are read from the form.
    const store = filled({ ia_logs_p1: { w1_mon: { swapTo: 'bike', bike_mins: '40.00' } } });
    persistLog(session(store, program()), blank({ nodes: { log_bike_mins: '45.00' }, wrap: { planned: 'run', active: 'bike' } }), null, false, NOW);
    assert.equal(json(store, 'ia_logs_p1')['w1_mon']!['bike_mins'], '45.00');
    // The entry holds only a run's miles; the form is on the bike: a draft, so the form's minutes stay on the form.
    const draft = filled({ ia_logs_p1: { w1_mon: { swapTo: 'bike', run_dist: '3.10' } } });
    persistLog(session(draft, program()), blank({ nodes: { log_bike_mins: '45.00' }, wrap: { planned: 'run', active: 'bike' } }), null, false, NOW);
    assert.equal(json(draft, 'ia_logs_p1')['w1_mon']!['bike_mins'], '');
  });
  test('a day with no run has no card: nothing is live, and a commit stores no number', () => {
    const store = filled({ ia_logs_p1: { w1_sun: { run_dist: '2.00' } } });
    persistLog(session(store, program(), 'sun'), { rpe: '5', touched: false, notes: 'n', nodes: {}, wrap: null }, null, true, NOW);
    const e = json(store, 'ia_logs_p1')['w1_sun']!;
    assert.deepStrictEqual([e['run_dist'], e['swapFrom'], e['swapTo'], e['notes']], ['', '', '', 'n']);
  });
  test('a swapped sport is named on the entry; the planned sport is not', () => {
    const store = memoryStore();
    persistLog(session(store, program()), blank({ nodes: { log_bike_mins: '' }, wrap: { planned: 'run', active: 'bike' } }), null, false, NOW);
    assert.deepStrictEqual([json(store, 'ia_logs_p1')['w1_mon']!['swapFrom'], json(store, 'ia_logs_p1')['w1_mon']!['swapTo']], ['run', 'bike']);
  });
  test('the set drafts, the parked sports and a rest day\'s jog ride the rewrite, after the entry\'s own fields', () => {
    const sets = { deadlift: { r: ['5', '', ''], w: ['225', '', ''], L: '225' } }, parked = { bike: { bike_mins: '40.00' } }, restLog = { run: { mins: 20, rpe: 4 } };
    const store = filled({ ia_logs_p1: { w1_mon: { rpe: '', notes: '', sets, parked, restLog, other: 'dropped' } } });
    persistLog(session(store, program()), blank({ notes: 'kept them' }), dose, false, NOW);
    const e = json(store, 'ia_logs_p1')['w1_mon']!;
    assert.deepStrictEqual([e['sets'], e['parked'], e['restLog']], [sets, parked, restLog]);
    assert.deepStrictEqual(Object.keys(e).slice(-3), ['sets', 'parked', 'restLog']);
    assert.equal('other' in e, false, 'a field the rewrite does not name is not carried');
  });
  test('the day\'s first snapshot is kept: a second save does not take it again', () => {
    const store = memoryStore(), prog = program();
    persistLog(session(store, prog), blank(), dose, false, NOW);
    const first = store.get('ia_hist_p1');
    (prog.weeks[1]!['mon'] as { title?: string }).title = 'Renamed';
    persistLog(session(store, prog), blank({ notes: 'again' }), dose, false, NOW + 1);
    assert.equal(store.get('ia_hist_p1'), first);
  });
});

describe('native session sheet: Done, Skip, and each one\'s undo', () => {
  const form = (over: Partial<LogForm> = {}): LogForm => ({ rpe: '5', touched: false, notes: '', nodes: { log_run_mins: '', log_run_dist: '' }, wrap: { planned: 'run', active: 'run' }, ...over });
  const dose = { k: 'time', mins: 30 };
  test('Done on a pending day: the day done under its title, the sheet closed, the pop-up to follow, no toast', () => {
    const store = memoryStore();
    assert.deepStrictEqual(tapStatus(session(store, program()), form({ notes: 'Good day' }), dose, 'Posterior Chain', 'complete', NOW), { toast: null, closed: true, popup: true });
    assert.equal(store.get('ia_comp_p1'), '{"w1_mon":{"title":"Posterior Chain","ts":' + NOW + ',"status":"complete"}}');
    assert.equal(json(store, 'ia_logs_p1')['w1_mon']!['notes'], 'Good day', 'the log is saved by the same tap');
    assert.ok(json(store, 'ia_hist_p1')['w1_mon'], 'and the day snapshotted');
  });
  test('Done on a done day is the undo: pending again, the log kept, the sheet open, "Unmarked"', () => {
    const store = filled({ ia_comp_p1: { w1_mon: { title: 'Posterior Chain', ts: NOW - 1, status: 'complete' }, w1_sun: { ts: 1, status: 'skipped' } }, ia_logs_p1: { w1_mon: { rpe: '8', notes: 'kept' } } });
    assert.deepStrictEqual(tapStatus(session(store, program()), form({ notes: 'kept' }), dose, 'Posterior Chain', 'complete', NOW), { toast: 'Unmarked', closed: false, popup: false });
    assert.equal(store.get('ia_comp_p1'), '{"w1_sun":{"ts":1,"status":"skipped"}}');
    assert.deepStrictEqual([json(store, 'ia_logs_p1')['w1_mon']!['rpe'], json(store, 'ia_logs_p1')['w1_mon']!['notes']], ['8', 'kept']);
  });
  test('Skip on a pending day: skipped, the sheet closed, its toast, no pop-up; Skip again is its undo', () => {
    const store = memoryStore();
    assert.deepStrictEqual(tapStatus(session(store, program()), form(), dose, 'Posterior Chain', 'skipped', NOW), { toast: 'Skipped ✕ The week moves on', closed: true, popup: false });
    assert.equal(json(store, 'ia_comp_p1')['w1_mon']!['status'], 'skipped');
    assert.deepStrictEqual(tapStatus(session(store, program()), form(), dose, 'Posterior Chain', 'skipped', NOW), { toast: 'Unmarked', closed: false, popup: false });
    assert.equal(store.get('ia_comp_p1'), '{}');
  });
  test('Done over Skipped, and Skip over Done, set the other status straight over', () => {
    const store = filled({ ia_comp_p1: { w1_mon: { ts: 1, status: 'skipped' } } });
    assert.deepStrictEqual(tapStatus(session(store, program()), form(), dose, 'Posterior Chain', 'complete', NOW), { toast: null, closed: true, popup: true });
    assert.equal(json(store, 'ia_comp_p1')['w1_mon']!['status'], 'complete');
    assert.deepStrictEqual(tapStatus(session(store, program()), form(), dose, 'Posterior Chain', 'skipped', NOW).closed, true);
    assert.equal(json(store, 'ia_comp_p1')['w1_mon']!['status'], 'skipped');
  });
  test('a tap that sets a status commits the form (D218); the undo tap does not', () => {
    const rolled = form({ nodes: { log_run_mins: '27.00', log_run_dist: '3.00' } });
    const store = memoryStore();
    tapStatus(session(store, program()), rolled, dose, 'Posterior Chain', 'complete', NOW);
    assert.deepStrictEqual([json(store, 'ia_logs_p1')['w1_mon']!['run_dist'], json(store, 'ia_logs_p1')['w1_mon']!['run_pace']], ['3.00', '9:00/mi']);
    // The undo saves as any other write does: on a card that holds no number, none is written.
    const undo = filled({ ia_comp_p1: { w1_mon: { ts: 1, status: 'complete' } } });
    tapStatus(session(undo, program()), rolled, dose, 'Posterior Chain', 'complete', NOW);
    assert.equal(json(undo, 'ia_logs_p1')['w1_mon']!['run_dist'], '');
  });
  test('a status set by hand takes the day whole: its skipped parts are cleared, and the record is the athlete\'s', () => {
    const store = filled({ ia_parts_p1: { w1_mon: { lift: 1 }, w1_sun: { lift: 1 } } });
    tapStatus(session(store, program()), form(), dose, 'Posterior Chain', 'complete', NOW);
    assert.equal(store.get('ia_parts_p1'), '{"w1_sun":{"lift":1}}');
    assert.deepStrictEqual(json(store, 'ia_comp_p1')['w1_mon'], { title: 'Posterior Chain', ts: NOW, status: 'complete' });
  });
  test('a day with no title is closed under none', () => {
    const store = memoryStore();
    tapStatus(session(store, program(), 'sun'), { rpe: '5', touched: false, notes: '', nodes: {}, wrap: null }, null, '', 'complete', NOW);
    assert.equal(store.get('ia_comp_p1'), '{"w1_sun":{"title":null,"ts":' + NOW + ',"status":"complete"}}');
  });
  test('the season\'s mark is let go only by the undo of Done on the program\'s last day', () => {
    // Week 1 starts Monday 2026-11-16: its last scheduled day is Sunday.
    const prog = program({ startDate: '2026-11-16', totalWeeks: 1 } as never);
    const store = filled({ ia_season_shown_p1: '1', ia_comp_p1: { w1_mon: { ts: 1, status: 'complete' }, w1_sun: { ts: 1, status: 'complete' } } });
    tapStatus(session(store, prog, 'mon'), form(), dose, 'Posterior Chain', 'complete', NOW);
    assert.equal(store.get('ia_season_shown_p1'), '1', 'another day\'s undo keeps it');
    tapStatus(session(store, prog, 'sun'), { rpe: '5', touched: false, notes: '', nodes: {}, wrap: null }, null, '', 'complete', NOW);
    assert.equal(store.get('ia_season_shown_p1'), null, 'the last day\'s undo lets it go');
    const skipped = filled({ ia_season_shown_p1: '1', ia_comp_p1: { w1_sun: { ts: 1, status: 'skipped' } } });
    tapStatus(session(skipped, prog, 'sun'), { rpe: '5', touched: false, notes: '', nodes: {}, wrap: null }, null, '', 'skipped', NOW);
    assert.equal(skipped.get('ia_season_shown_p1'), '1', 'the undo of a Skip keeps it');
  });
});

// ── The sheet's second session: the add sheet, add and remove, the 1RM card's save ────────────────────────────────
// A week of three days, built by hand. What each move trains is the exercise library's: squats (back, front, goblet,
// the leg press), hinges (the deadlifts, the swing), lunges and hip thrusts are leg work; presses, pushups and raises
// are push work; rows, pulldowns and curls are pull work; dead bugs train no pattern. The barbell lifts, the leg press
// and the lunge are the heavy tier, the goblet squat one under them, and a hip thrust, a curl and pushups the lightest.
const addProgram = (universe: string[] = ['Front squat', 'Dumbbell goblet squat', 'Deadlift', 'Walking lunges', 'Barbell hip thrust', 'Overhead press', 'Pushups', 'Barbell row', 'Dumbbell curl', 'Dead bugs', 'back squat', 'Leg press']): SheetProgram => ({
  id: 'p1', cfg: { unit: 'lbs' }, _swapUniverse: universe,
  weeks: {
    1: {
      mon: {
        title: 'Legs',
        sections: [
          { label: 'Main — Squat', items: [lift('Back squat', '4×3 — RPE 8')] },
          { label: 'Accessory', items: [lift('Leg press', '3×8–12 @ RPE 8'), lift('Romanian deadlift', '2×6–10 each @ RPE 7'), lift('Kettlebell swing', '3×20 sec')] },
        ],
      },
      wed: {
        title: 'Push',
        sections: [
          { label: 'Main — Press', items: [lift('Barbell bench press', '4×5 — RPE 8')] },
          { label: 'Accessory', items: [lift('Dumbbell lateral raise', '2×15–20 @ RPE 7'), lift('Dumbbell bench press', '3×10 — RPE 7')] },
        ],
      },
      fri: { title: 'Pull', sections: [{ label: 'Accessory', items: [lift('Dumbbell curl', '3×12–15 @ RPE 8')] }] },
    },
  },
} as unknown as SheetProgram);
const monOf = (prog: SheetProgram) => prog.weeks[1]!['mon'] as unknown as { title?: string; sections: { label?: string; _added?: boolean; items: { name?: string; detail?: string; _addedByUser?: boolean; _skipped?: boolean }[] }[] };

describe('native session sheet: what the add sheet lists', () => {
  test('a leg day: work it has no pattern for, more of a pattern it has, and another region\'s, each the heavier first and then by name', () => {
    const prog = addProgram();
    const c = addCandidates(monOf(prog) as never, prog);
    assert.equal(c.region, 'legs', 'the day\'s region is its first move\'s');
    assert.deepStrictEqual({ ...c.pats }, { squat: 2, hinge: 2 });
    // Lunges and hip thrusts are leg work the day has no pattern for. The lunge is the heavier.
    assert.deepStrictEqual(c.gap, ['Walking lunges', 'Barbell hip thrust']);
    // A hinge and two squats, on a day that already hinges and squats: the two barbell lifts by name, then the goblet squat.
    assert.deepStrictEqual(c.more, ['Deadlift', 'Front squat', 'Dumbbell goblet squat']);
    // Push and pull work is offered, not hidden: the barbell lifts first, by name, then the light ones.
    assert.deepStrictEqual(c.off, ['Barbell row', 'Overhead press', 'Dumbbell curl', 'Pushups']);
  });
  test('never a move on the card, whatever its case; never a move with no pattern', () => {
    const prog = addProgram();
    const c = addCandidates(monOf(prog) as never, prog);
    const all = [...c.gap, ...c.more, ...c.off];
    assert.ok(!all.includes('back squat') && !all.includes('Leg press'), 'on the card already');
    assert.ok(!all.includes('Dead bugs'), 'dead bugs train no pattern');
    assert.equal(all.length, 9);
  });
  test('at most six, five and six; a day with nothing on it has no region, so nothing is another region\'s', () => {
    const squats = ['Front squat', 'Leg press', 'Dumbbell goblet squat', 'Barbell box squat', 'Back squat', 'Front squat 2'];
    const many = addProgram([...squats, 'Deadlift', 'Romanian deadlift', 'Trap bar deadlift', 'Walking lunges', 'Barbell hip thrust', 'Overhead press', 'Barbell bench press', 'Dumbbell bench press', 'Pushups', 'Dips',
      'Dumbbell lateral raise', 'Dumbbell front raise', 'Barbell row', 'Dumbbell row', 'Pullups', 'Chinups', 'Lat pulldown', 'Dumbbell curl']);
    const mon = monOf(many);
    mon.sections = [{ label: 'Main — Squat', items: [lift('Kettlebell swing', '3×10')] }];
    const c = addCandidates(mon as never, many);
    assert.ok(c.gap.length <= 6 && c.more.length <= 5 && c.off.length === 6, JSON.stringify(c));
    // Thirteen push and pull moves were on offer: the six kept are the heaviest, so no curl, raise, pushup or dip.
    for (const light of ['Dumbbell curl', 'Dumbbell lateral raise', 'Dumbbell front raise', 'Pushups']) assert.ok(!c.off.includes(light), light);
    const empty = addProgram();
    monOf(empty).sections = [];
    const e = addCandidates(monOf(empty) as never, empty);
    assert.deepStrictEqual([e.region, e.more, e.off], [null, [], []]);
    assert.equal(e.gap.length, 6, 'everything is work the day has none of, cut to six');
  });
  test('no program, no universe: nothing to offer', () => {
    assert.deepStrictEqual({ ...addCandidates(monOf(addProgram()) as never, null), pats: null }, { gap: [], more: [], off: [], region: 'legs', pats: null });
    assert.deepStrictEqual(addCandidates(monOf(addProgram([])) as never, addProgram([])).gap, []);
  });
});

describe('native session sheet: the dose an added move takes', () => {
  const prog = addProgram();
  const mon = monOf(prog) as never;
  test('the same pattern on today\'s card donates, its accessory and never its Main', () => {
    assert.equal(addedDetailFor(mon, 'Front squat', 1, prog), '3×8–12 @ RPE 8', 'the leg press\'s, not the Main back squat\'s 4×3');
    assert.equal(addedDetailFor(mon, 'Deadlift', 1, prog), '2×6–10 each @ RPE 7', 'the Romanian deadlift\'s');
  });
  test('a dose of time or distance never donates to a rep lift: the swing\'s seconds are passed over', () => {
    // The swing is the last hinge on the card, and the last match would win. Its 3×20 sec is refused by its words.
    assert.equal(addedDetailFor(mon, 'Deadlift', 1, prog), '2×6–10 each @ RPE 7');
    // '3×20s' names no unit the words catch: the parse reads it as seconds, and refuses it.
    for (const refused of ['3×40 yards heavy', '3×30 yd', '2×100 meters', '3×20 sec', '3×20s', '2×2 min', '3×30 hold', '2×max time']) {
      const p = addProgram();
      monOf(p).sections[1]!.items = [lift('Romanian deadlift', '2×8 @ RPE 7'), lift('Kettlebell swing', refused)];
      assert.equal(addedDetailFor(monOf(p) as never, 'Deadlift', 1, p), '2×8 @ RPE 7', refused);
    }
  });
  test('two accessories of the pattern on today\'s card: the last one donates, since accessories sit lowest', () => {
    const p = addProgram();
    monOf(p).sections[1]!.items = [lift('Leg press', '3×8–12 @ RPE 8'), lift('Dumbbell goblet squat', '2×12–15 @ RPE 7')];
    assert.equal(addedDetailFor(monOf(p) as never, 'Front squat', 1, p), '2×12–15 @ RPE 7');
  });
  test('two days of the week hold the pattern, or the region: the earlier day donates', () => {
    const p = addProgram();
    (p.weeks[1]!['wed'] as unknown as { sections: { items: unknown[] }[] }).sections[1]!.items.push(lift('Dumbbell curl', '2×10 @ RPE 7'));
    assert.equal(addedDetailFor(monOf(p) as never, 'Dumbbell curl', 1, p), '2×10 @ RPE 7', 'Wednesday\'s curl, before Friday\'s');
    assert.equal(addedDetailFor(monOf(p) as never, 'Barbell row', 1, p), '2×10 @ RPE 7', 'pull work: Wednesday\'s curl is the first of the week');
  });
  test('no such pattern today: the same pattern anywhere in the week, days in calendar order', () => {
    assert.equal(addedDetailFor(mon, 'Dumbbell curl', 1, prog), '3×12–15 @ RPE 8', 'Friday\'s curl');
    assert.equal(addedDetailFor(mon, 'Pushups', 1, prog), '3×10 — RPE 7', 'Wednesday\'s dumbbell bench, a horizontal press; never the Main barbell bench');
  });
  test('no such pattern in the week: the same region anywhere in the week, the first donor found', () => {
    assert.equal(addedDetailFor(mon, 'Walking lunges', 1, prog), '3×8–12 @ RPE 8', 'leg work: Monday\'s leg press is the first');
    assert.equal(addedDetailFor(mon, 'Overhead press', 1, prog), '2×15–20 @ RPE 7', 'push work: Wednesday\'s lateral raise stands before its bench');
    assert.equal(addedDetailFor(mon, 'Barbell row', 1, prog), '3×12–15 @ RPE 8', 'pull work: Friday\'s curl');
  });
  test('nothing of its type anywhere, a week the grid does not hold, or a move with no pattern: three sets of ten at RPE 7', () => {
    const lone = addProgram();
    delete (lone.weeks[1] as Record<string, unknown>)['fri'];
    assert.equal(addedDetailFor(monOf(lone) as never, 'Barbell row', 1, lone), '3×10 — RPE 7');
    assert.equal(addedDetailFor(mon, 'Barbell row', 2, prog), '3×10 — RPE 7');
    assert.equal(addedDetailFor(mon, 'Dead bugs', 1, prog), '3×10 — RPE 7');
  });
  test('a round, a core block, a hip block, a primer and the athlete\'s own added work never donate', () => {
    const p = addProgram();
    monOf(p).sections = [
      { label: 'Accessory', items: [lift('Leg press', '2×20')] },
      { label: 'Round', superset: true, items: [lift('Front squat', '3×8')] } as never,
      { label: 'Round', type: 'superset', items: [lift('Front squat', '5×5')] } as never,
      { label: 'Core', core: true, items: [lift('Back squat', '3×9')] } as never,
      { label: 'Hips', hip: true, items: [lift('Back squat', '3×11')] } as never,
      { label: 'Primer — Squat', items: [lift('Back squat', '2×3')] },
      { label: 'Added by you', _added: true, items: [lift('Barbell box squat', '6×6')] },
    ];
    assert.equal(addedDetailFor(monOf(p) as never, 'Dumbbell goblet squat', 1, p), '2×20', 'the last squat among the donors is the accessory leg press');
  });
});

describe('native session sheet: the add sheet as drawn', () => {
  test('the header: the day, its week, its region, its working sets, and each row\'s words', () => {
    const v = addSheetOf(addProgram(), 1, 'mon')!;
    // 4 sets of back squat, 3 of leg press, 2 of Romanian deadlift, 3 of swings.
    assert.deepStrictEqual([v.title, v.weekTag, v.regionTag, v.setsTag], ['Legs', 'Week 1', 'Leg day', '12 sets']);
    assert.deepStrictEqual(v.gap, [{ name: 'Walking lunges', caution: false, note: '' }, { name: 'Barbell hip thrust', caution: false, note: '' }]);
    // A deadlift adds the Romanian deadlift's 2 sets, a squat the leg press's 3.
    assert.deepStrictEqual(v.more, [
      { name: 'Deadlift', caution: true, note: 'Your day already has this pattern. Sets go to 14.' },
      { name: 'Front squat', caution: true, note: 'Your day already has this pattern. Sets go to 15.' },
      { name: 'Dumbbell goblet squat', caution: true, note: 'Your day already has this pattern. Sets go to 15.' },
    ]);
    assert.deepStrictEqual(v.off, [
      { name: 'Barbell row', caution: true, note: 'Pull work on a leg day. Check what it sits next to in the week.' },
      { name: 'Overhead press', caution: true, note: 'Push work on a leg day. Check what it sits next to in the week.' },
      { name: 'Dumbbell curl', caution: true, note: 'Pull work on a leg day. Check what it sits next to in the week.' },
      { name: 'Pushups', caution: true, note: 'Push work on a leg day. Check what it sits next to in the week.' },
    ]);
  });
  test('a skipped move\'s sets and open sets are not counted; a push day is a Push day, a day with no title is Training', () => {
    const p = addProgram();
    monOf(p).sections[1]!.items[0]!._skipped = true;                    // the leg press's 3
    monOf(p).sections[1]!.items[2]!.detail = '3 sets — RPE 7';          // the swing: open sets
    assert.equal(addSheetOf(p, 1, 'mon')!.setsTag, '6 sets');
    const wed = addSheetOf(addProgram(), 1, 'wed')!;
    assert.deepStrictEqual([wed.title, wed.regionTag, wed.setsTag], ['Push', 'Push day', '9 sets']);
    const q = addProgram();
    delete monOf(q).title;
    monOf(q).sections = [];
    assert.deepStrictEqual([addSheetOf(q, 1, 'mon')!.title, addSheetOf(q, 1, 'mon')!.regionTag, addSheetOf(q, 1, 'mon')!.setsTag], ['Training', 'Today', '0 sets']);
  });
  test('no day at that place, or no program: no sheet', () => {
    assert.equal(addSheetOf(addProgram(), 1, 'thu'), null);
    assert.equal(addSheetOf(addProgram(), 2, 'mon'), null);
    assert.equal(addSheetOf(null, 1, 'mon'), null);
  });
});

describe('native session sheet: add and remove', () => {
  const edits = (s: StateStore) => json(s, 'ia_edits_p1');
  test('a pick: the move under "Added by you" with the dose of its nearest type, the record stamped, and its words', () => {
    const prog = addProgram(), store = memoryStore();
    assert.equal(addMove(session(store, prog), 'Deadlift', NOW), 'Deadlift added at 2×6–10 each @ RPE 7.');
    assert.deepStrictEqual(monOf(prog).sections.length, 3);
    assert.deepStrictEqual(monOf(prog).sections[2], { label: 'Added by you', _added: true, items: [{ name: 'Deadlift', detail: '2×6–10 each @ RPE 7', _addedByUser: true }] });
    assert.deepStrictEqual(edits(store), { w1_mon: { add: [{ name: 'Deadlift', detail: '2×6–10 each @ RPE 7', ts: NOW }], skip: [] } });
    assert.deepStrictEqual(Object.keys(held(store)), ['ia_edits_p1'], 'a day touched in no other way has no snapshot, and the add makes none');
  });
  test('a second pick joins the same block; a lift with no load to move takes open sets at the same effort', () => {
    const prog = addProgram(), store = memoryStore();
    addMove(session(store, prog), 'Deadlift', NOW);
    assert.equal(addMove(session(store, prog), 'Pushups', NOW + 5), 'Pushups added at 3 sets — RPE 7 (leave 3 or more in reserve).');
    assert.deepStrictEqual(monOf(prog).sections.length, 3, 'one block for both');
    assert.deepStrictEqual(monOf(prog).sections[2]!.items.map((i) => [i.name, i.detail]), [['Deadlift', '2×6–10 each @ RPE 7'], ['Pushups', '3 sets — RPE 7 (leave 3 or more in reserve)']]);
    assert.deepStrictEqual(edits(store)['w1_mon']!['add'], [{ name: 'Deadlift', detail: '2×6–10 each @ RPE 7', ts: NOW }, { name: 'Pushups', detail: '3 sets — RPE 7 (leave 3 or more in reserve)', ts: NOW + 5 }]);
  });
  test('a move already in the block is not put there twice', () => {
    const prog = addProgram(), store = memoryStore();
    addMove(session(store, prog), 'Deadlift', NOW);
    addMove(session(store, prog), 'Deadlift', NOW + 9);
    assert.deepStrictEqual(monOf(prog).sections[2]!.items.map((i) => i.name), ['Deadlift']);
  });
  test('the day\'s snapshot takes the add in where the day has one, and none is made where it has none', () => {
    const prog = addProgram(), store = memoryStore();
    const s = session(store, prog);
    snapshotDay(s);
    assert.ok(!store.get('ia_hist_p1')!.includes('Added by you'));
    addMove(s, 'Deadlift', NOW);
    const snap = json(store, 'ia_hist_p1')['w1_mon'] as { sections: { label?: string; items: { name: string }[] }[] };
    assert.deepStrictEqual(snap.sections[2]!.items.map((i) => i.name), ['Deadlift']);
    removeAdded(s, 'Deadlift');
    assert.equal((json(store, 'ia_hist_p1')['w1_mon'] as { sections: unknown[] }).sections.length, 2, 'and the remove out again');
  });
  test('remove: the move leaves the block, the record and the card, and says so; the last one out takes the block and the record with it', () => {
    const prog = addProgram(), store = memoryStore();
    const s = session(store, prog);
    addMove(s, 'Deadlift', NOW);
    addMove(s, 'Pushups', NOW);
    assert.equal(removeAdded(s, 'Deadlift'), 'Deadlift removed.');
    assert.deepStrictEqual(monOf(prog).sections[2]!.items.map((i) => i.name), ['Pushups']);
    assert.deepStrictEqual((edits(store)['w1_mon']!['add'] as { name: string }[]).map((a) => a.name), ['Pushups']);
    assert.equal(removeAdded(s, 'Pushups'), 'Pushups removed.');
    assert.deepStrictEqual(monOf(prog).sections.map((x) => x.label), ['Main — Squat', 'Accessory']);
    assert.deepStrictEqual(edits(store), {}, 'no record is left for the day');
  });
  test('remove does not take a logged lift back, and never touches the plan\'s own moves', () => {
    const prog = addProgram();
    const log = { deadlift: { name: 'Deadlift', entries: [{ week: 1, day: 'mon', weight: 225, setsDone: [8, 8], ts: NOW }] } };
    const store = filled({ ia_exw_p1: log });
    const s = session(store, prog);
    addMove(s, 'Deadlift', NOW);
    removeAdded(s, 'Deadlift');
    assert.deepStrictEqual(json(store, 'ia_exw_p1'), log);
    const before = JSON.stringify(monOf(prog).sections);
    removeAdded(s, 'Back squat');
    assert.equal(JSON.stringify(monOf(prog).sections), before, 'a planned move is not an added one');
  });
  test('no day in hand, or a program with no id: nothing is added, removed or stored', () => {
    const prog = addProgram(), store = memoryStore();
    assert.equal(addMove(session(store, prog, 'thu'), 'Deadlift', NOW), null);
    assert.equal(removeAdded(session(store, prog, 'thu'), 'Deadlift'), null);
    const anon = { ...addProgram(), id: '' } as SheetProgram;
    assert.equal(addMove(session(store, anon), 'Deadlift', NOW), null);
    assert.equal(removeAdded(session(store, anon), 'Deadlift'), null);
    assert.deepStrictEqual(held(store), {});
    assert.equal(monOf(anon).sections.length, 2);
  });
});

describe('native session sheet: the 1RM card\'s estimate and its save', () => {
  const stored = () => [{ id: 'p1', cfg: { unit: 'lbs', bench: 135, squat: 155 } }, { id: 'p2', cfg: { bench: 100 } }];
  const inHand = (): SheetProgram => ({ ...program(), cfg: { unit: 'lbs', bench: 135 } } as unknown as SheetProgram);
  test('Epley: a single is itself, more reps add a thirtieth of the weight each, rounded; no weight is no estimate', () => {
    assert.equal(e1rmEstimate('315', '1'), 315);
    assert.equal(e1rmEstimate('225', '3'), 248);      // 225 × 1.1 = 247.5
    assert.equal(e1rmEstimate('200', '5'), 233);      // 200 × 1.1667 = 233.3
    assert.equal(e1rmEstimate('112.5', '3'), 124);    // 112.5 × 1.1 = 123.75; the half pound counts (112 would give 123)
    assert.equal(e1rmEstimate('', '3'), 0);
    assert.equal(e1rmEstimate('abc', '3'), 0);
    assert.equal(e1rmEstimate('225', ''), 225, 'no reps is read as one');
  });
  test('save: the estimate is the lift\'s max in the stored program and in the one in hand, no other field or program moves, and the card says so', () => {
    const store = filled({ ia_programs: stored() }), prog = inHand();
    assert.deepStrictEqual(saveTestMax(session(store, prog), 'bench', 'lbs', '225', '3'), { estimate: 248, saved: 'Saved. Your next block anchors off 248 lbs.' });
    assert.deepStrictEqual(JSON.parse(store.get('ia_programs')!), [{ id: 'p1', cfg: { unit: 'lbs', bench: 248, squat: 155 } }, { id: 'p2', cfg: { bench: 100 } }]);
    assert.equal((prog.cfg as { bench?: number }).bench, 248);
    assert.deepStrictEqual(Object.keys(held(store)), ['ia_programs'], 'nothing else is written');
    assert.equal(saveTestMax(session(store, prog), 'deadlift', 'kg', '100', '1').saved, 'Saved. Your next block anchors off 100 kg.');
    assert.equal(JSON.parse(store.get('ia_programs')!)[0].cfg.deadlift, 100);
  });
  test('an estimate of nothing saves nothing and says nothing', () => {
    const store = filled({ ia_programs: stored() }), prog = inHand(), before = held(store);
    assert.deepStrictEqual(saveTestMax(session(store, prog), 'bench', 'lbs', '', '3'), { estimate: 0, saved: null });
    assert.deepStrictEqual(held(store), before);
    assert.equal((prog.cfg as { bench?: number }).bench, 135);
  });
  test('a program the store does not hold: nothing is written, as today\'s card writes nothing and still shows its line', () => {
    const store = filled({ ia_programs: [{ id: 'p2', cfg: { bench: 100 } }] }), prog = inHand(), before = held(store);
    assert.deepStrictEqual(saveTestMax(session(store, prog), 'bench', 'lbs', '225', '3'), { estimate: 248, saved: 'Saved. Your next block anchors off 248 lbs.' });
    assert.deepStrictEqual(held(store), before);
    assert.equal((prog.cfg as { bench?: number }).bench, 135);
  });
});

describe('native session sheet: which files write, and what the screen calls', () => {
  const dir = join(NATIVE, 'day-detail');
  const code = (f: string): string => strip(readFileSync(join(dir, f), 'utf8'));
  const writers = (t: string): string[] => [...new Set([...t.matchAll(/\b((?:write|record|refresh|clear|drop|set|settle|add|count|mark|skip)[A-Z]\w*)\(\s*(?:s\.)?store\b/g)].map((m) => m[1]!))].sort();
  const sheet = read('day-detail/SessionSheet.tsx');
  test('sheet-writes.ts alone calls core\'s writers, and exactly the eight the two measures named; nothing writes a key by hand', () => {
    // The first session's five, and the second's three: an add, its remove, and the 1RM card's save.
    assert.deepStrictEqual(writers(code('sheet-writes.ts')), ['addAddEdit', 'clearDayParts', 'clearDayStatus', 'dropAddEdit', 'setDayStatus', 'settleDayParts', 'writeDayLogs', 'writePrograms']);
    for (const f of readdirSync(dir).filter((x) => x !== 'sheet-writes.ts')) assert.deepStrictEqual(writers(code(f)), [], f + ' calls none of core\'s writers');
    for (const f of readdirSync(dir)) {
      assert.doesNotMatch(code(f), /\b\w*[sS]tore\.(set|remove)\(/, f + ' writes no key by hand');
      assert.doesNotMatch(code(f), /localStorage|AsyncStorage/, f + ' names no other storage');
    }
    // The add sheet's own folder reads and draws: no writer, no store, no clock.
    for (const f of ['AddSheet.tsx', 'add-sheet-model.ts']) {
      const t = strip(read('add-sheet/' + f));
      assert.deepStrictEqual(writers(t), [], f);
      assert.doesNotMatch(t, /\bstore\b|state-|sheet-writes|Date\.now\(\)/, f + ' reaches no store');
    }
    // The day's snapshot, first and renewed, is the deck's own port, and the season's mark is let go by the pop-ups' own file.
    assert.ok(code('sheet-writes.ts').includes("import { type Session, resnapshotDay, snapshotDay } from '../deck/deck-writes';") && code('sheet-writes.ts').includes('releaseSeasonShown(pop)'));
  });
  test('the view and the readers read only: no tap, no clock of their own', () => {
    for (const f of ['sheet-screen.ts', 'sheet-readers.ts', 'sheet-adds.ts']) assert.doesNotMatch(code(f), /Date\.now\(\)|Math\.random\(\)/, f);
    assert.doesNotMatch(code('sheet-writes.ts'), /Date\.now\(\)|Math\.random\(\)/, 'every write is stamped with the instant it is handed');
  });
  test('every press on the sheet is one of these: it closes, opens something to read, or calls a tap', () => {
    const presses = [...sheet.matchAll(/testID=\{?["']([a-z-]+)/g)].map((m) => m[1]!);
    assert.deepStrictEqual([...new Set(presses)].sort(), [
      'session-sheet', 'sheet-', 'sheet-back', 'sheet-body', 'sheet-cardio', 'sheet-counter', 'sheet-fill-', 'sheet-foot', 'sheet-load-', 'sheet-log', 'sheet-log-', 'sheet-lognudge', 'sheet-markdone',
      'sheet-minus-', 'sheet-move-', 'sheet-notes', 'sheet-over', 'sheet-plus-', 'sheet-putback', 'sheet-rangenudge', 'sheet-rep-', 'sheet-reuse-', 'sheet-roundback-', 'sheet-roundminus-', 'sheet-rows-',
      'sheet-rpe', 'sheet-rpeclose', 'sheet-rpeinfo', 'sheet-rpeover', 'sheet-setload-', 'sheet-sets-', 'sheet-slider', 'sheet-swap-', 'sheet-tags', 'sheet-title', 'sheet-unswap-',
      // The second session's: the add button, an added move's remove, the jog, the Wildcard tag, the note, the 1RM card.
      'sheet-add', 'sheet-remove-', 'sheet-also', 'sheet-wildcard', 'sheet-note', 'sheet-max', 'sheet-max-weight', 'sheet-max-reps-', 'sheet-max-out', 'sheet-max-save', 'sheet-max-saved',
      // The rest sheet's session: the jog's Edit cardio.
      'sheet-also-edit',
    ].sort());
    // The cards' taps are the deck's own writers, each stamped with the instant of the tap.
    for (const call of ['tapStep(session, fieldsNow.current, exKey, k, step, Date.now())', 'tapReuse(session, fieldsNow.current, exKey, value, Date.now())', 'tapFill(session, fieldsNow.current, exKey, value, Date.now())',
      'tapLog(session, fieldsNow.current, x, Date.now())', 'leftField(session, fieldsNow.current, exKey, Date.now())', 'act(session, a, off)', 'undoSwap(session, from)', 'swapMove(session, swap.ctx, to, Date.now())']) {
      assert.ok(sheet.includes(call), call);
    }
  });
  test('each control of a card calls its own tap with its own move, set and number', () => {
    for (const wired of [
      "onPress={() => h.step(x.exKey, r.s, -r.step)}", "onPress={() => h.step(x.exKey, r.s, r.step)}",
      "onChangeText={(t) => h.rep(x.exKey, r.s, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}",
      "onChangeText={(t) => h.setLoad(x.exKey, r.s, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}",
      "onChangeText={(t) => h.load(x.exKey, t)} onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}",
      "onPress={() => h.reuse(x.exKey, reuse.value)}", "onPress={() => h.fill(x.exKey, load.fill!.value)}", "onPress={() => h.log(x)}", "onPress={() => h.sets(x.exKey)}",
      "onPress={() => h.swap(x.swap!.secIdx, x.swap!.itemIdx)}", "onPress={() => h.edit({ kind: 'exercise', name: x.name }, true)}", "onPress={() => h.edit({ kind: 'exercise', name: x.name }, false)}",
      "onPress={() => h.edit({ kind: 'round', secIdx: b.secIdx }, true)}", "onPress={() => h.edit({ kind: 'round', secIdx: sec.secIdx }, false)}", "onPress={() => h.unswap(x.swappedFrom!)}",
      "onPress={() => { leave(); away(onClose); }}", "onPress={() => setInfo(true)}", "onPress={() => setInfo(false)}",
    ]) assert.ok(sheet.includes(wired), wired);
    // A field typed into holds the text and saves nothing until it is left; a field left saves its move.
    assert.ok(sheet.includes("rep: (exKey, k, text) => typed(exKey, (f) => typeRep(f, k, text)),") && sheet.includes("setLoad: (exKey, k, text) => typed(exKey, (f) => typeSetLoad(f, k, text)),") && sheet.includes("load: (exKey, text) => typed(exKey, (f) => typeLoad(f, text)),"));
    assert.ok(sheet.includes("blur: (exKey) => { if (focused.current === exKey) { focused.current = null; save(exKey); } },"));
    // Sets opening marks the top set, as the page's toggleSets does; a swap that finds no sheet says so; a pick's nudge waits 1.4 s.
    assert.ok(sheet.includes("if (opened && f) apply({ ...fieldsNow.current, [exKey]: openedSets(f) });"));
    assert.ok(sheet.includes("if (sheet) setSwap(sheet); else say('Nothing to swap here');") && sheet.includes("if (r.nudge) timers.current.push(setTimeout(() => setNudge({ from, to }), 1400));"));
    // The card shows what its fields hold: every set's row once its sets are open, and the load field only while they are shut.
    assert.ok(sheet.includes("{sets && open && f && fv && (") && sheet.includes("{load && !open && (") && sheet.includes("{load && load.fill && open && ("));
    assert.ok(sheet.includes("{sets.rows.map((r, ri) => {"), 'every set is drawn: no pips on the sheet');
  });
  test('the slider and the notes save as they change; Done, Skip and Mark Done are one tap, which closes the sheet only when a status was set', () => {
    // The dose a save derives from is the cardio card's own, which the sport picker changes (cardio-log.ts).
    assert.ok(sheet.includes('const next = moveRpe(f, v);\n    hold(next);\n    persistLog(session, next, cardioNow.current.dose, false, Date.now());'));
    assert.ok(sheet.includes('if (f.touched && f.rpe === String(v)) return;'), 'a drag that stays on its number saves once');
    assert.ok(sheet.includes('const next = typeNotes(formNow.current, text);\n    hold(next);\n    persistLog(session, next, cardioNow.current.dose, false, Date.now());'));
    assert.ok(sheet.includes('const r = tapStatus(session, formNow.current, cardioNow.current.dose, title, st, Date.now());\n    if (r.toast) say(r.toast);'), 'the tap\'s toast is raised');
    assert.ok(sheet.includes('if (!r.closed) { setView((v) => ({ ...v, foot: footOf(store, prog, open.week, open.dayKey) })); return; }'), 'an undo draws the foot again and nothing else');
    assert.ok(sheet.includes('if (r.popup) away(() => onDone(prog, open.week, open.dayKey)); else away(onClose);'));
    assert.ok(sheet.includes("onPress={() => status(btn.status, view.footTitle)}") && sheet.includes("onPress={() => status('complete', blk.title)}"));
  });
  test('an edit draws the whole sheet again: every field and the log\'s form afresh', () => {
    assert.ok(sheet.includes('const next = sheetView(store, g, open.week, open.dayKey, Date.now(), inHand);\n    if (!next) return;\n    setView(next);\n    apply(sheetFields(next));\n    hold(formOf(logOf(next)));\n    holdCardio(cardioOf(next, g));\n    setDrawn((n) => n + 1);\n    setSetsOpen({});'));
  });
  test('the sheet draws every block of its frame, and the run\'s fields inside its log', () => {
    assert.ok(sheet.includes('drawnBlocks(frame).map('));
    assert.ok(sheet.includes('{log.view.cardio && form.wrap && ('));
    for (const words of ['‹ Back', 'RPE ⓘ', 'Log This Session', 'How hard was it? — RPE', 'Notes', 'How did it go? Anything to remember next week?', 'You logged this one but never marked it.', 'Mark Done ✓', 'tap to undo',
      'Time to add weight.', "' Last session you hit the top of the range on every set of '", "'. Go up in weight today and start back at the bottom of the range.'", 'Put it back', 'put it back', 'Swapped in', 'Skipped', 'Varied', "'This is what tracks\\nyour progress'",
      '>Exercise</Text>', '>Wildcard done</Text>', '>Edit cardio</Text>', '>remove</Text>', "<Text style={[s.bold, { color: p.signal }]}>You added this</Text>{' · not in the plan'}</Text>"]) {
      assert.ok(sheet.includes(words), words);
    }
  });
  test('the add button opens the add sheet over the day in hand; a pick adds the move, draws the whole sheet again and says so; remove does the same', () => {
    assert.ok(sheet.includes('<Pressable testID="sheet-add" accessibilityRole="button" accessibilityLabel="Add an exercise to this day" hitSlop={8} onPress={openAdd}'));
    assert.ok(sheet.includes("const sheet = addSheetOf(prog, open.week, open.dayKey);\n    if (sheet) setAdd(sheet); else say('Nothing to add to here');"));
    assert.ok(sheet.includes('const toast = addMove(session, name, Date.now());\n    if (toast === null) return;\n    redraw();\n    say(toast);'));
    assert.ok(sheet.includes('{add && <AddSheet palette={p} view={add} calm={calm} onPick={added} onClose={() => setAdd(null)} />}'));
    assert.ok(sheet.includes("<Text testID={'sheet-remove-' + x.exKey} accessibilityRole=\"button\" onPress={() => h.remove(x.name)}"));
    assert.ok(sheet.includes('const toast = removeAdded(session, name);\n      if (toast === null) return;\n      redraw();\n      say(toast);'));
    // The add sheet itself: a row is a pick, which is handed on once, as the sheet leaves; Back only leaves.
    const add = read('add-sheet/AddSheet.tsx');
    assert.ok(add.includes("onPress={() => leave(() => onPick(r.name))}") && add.includes('<Pressable testID="add-back" accessibilityRole="button" hitSlop={12} onPress={() => leave()}>'));
    assert.ok(add.includes('if (leaving.current) return;\n    leaving.current = true;\n    if (before) before();'), 'a second tap while the sheet leaves does nothing');
    assert.ok(add.includes("{v.gap.map((r, k) => row(r, k, 'gap'))}") && add.includes("{v.more.map((r, k) => row(r, k, 'more'))}") && add.includes("{v.off.map((r, k) => row(r, k, 'off'))}"));
    for (const words of ['‹ Back', '>Add an exercise</Text>', '{v.title}', '{v.weekTag}', '{v.regionTag}', '{v.setsTag}', '>Added work matches the closest thing to it in your week.</Text>',
      ">Today isn't training these</Text>", '>Work your day has no movement for yet.</Text>', 'caution("More of what you\'re already doing")', '>Your day already trains this pattern. Adding here stacks fatigue on the same tissue.</Text>',
      "caution('Not what today is for')", '>Different region than this day trains. Fine once, but watch what it lands next to.</Text>', ">Nothing left in your kit that isn't already on this card.</Text>",
      '>Added work holds for this session only. It logs and counts like anything else on the card. Next week says what it always said.</Text>', '{r.name}', '{r.note}']) {
      assert.ok(add.includes(words), words);
    }
    assert.ok(add.includes('const none = !v.gap.length && !v.more.length && !v.off.length;') && add.includes('{none\n          ? <Text testID="add-empty"'), 'the empty words stand only where all three lists are empty, and the foot only where one is not');
  });
  test('the jog\'s Edit cardio hands the day to the app, which opens the rest sheet over this one; the Wildcard tag and the note only draw', () => {
    assert.ok(sheet.includes('<Pressable testID="sheet-also-edit" accessibilityRole="button" onPress={() => { leave(); onRest({ prog: prog as unknown as RestProgram, week: open.week, dayKey: open.dayKey, view: \'cardio\' }, () => redraw()); }} style={[s.alsoBtn, { borderColor: p.border2 }]}><Text style={[s.alsoBtnText, { color: p.text }]}>Edit cardio</Text></Pressable>'));
    assert.ok(sheet.includes('<Text style={[s.alsoLbl, { color: p.muted }]}>{blk.label}</Text>') && sheet.includes('{blk.lines.map((l, i) => <Text key={i} style={[s.alsoLine, { color: p.run }]}>{l}</Text>)}'));
    assert.ok(sheet.includes('<Text style={[s.wcSub, { color: p.muted }]}>{blk.sub}</Text>'));
    assert.ok(sheet.includes("if (blk.kind === 'note') return <Text key={k} testID=\"sheet-note\"") && sheet.includes('{plain(blk.html)}</Text>;'));
    // The sheet draws no rest sheet itself and writes no jog: it only asks.
    assert.doesNotMatch(strip(sheet), /openRestSheet|<RestSheet|applyRestCardio|clearRestCardio|applyRestMove/);
  });
  test('the 1RM card: the estimate reads 0 until a field changes, the save is one call with the card\'s lift and its two fields, and its line stands where the button stood', () => {
    assert.ok(sheet.includes("if (blk.kind === 'e1rm') return <E1rm key={k} card={blk.card} p={p} onSave={(weight, reps) => saveMax(blk.card.lift, weight, reps)} />;"));
    assert.ok(sheet.includes('const saveMax = (lift: string, weight: string, reps: string): MaxSaved => { leave(); return saveTestMax(session, lift, unit, weight, reps); };'));
    assert.ok(sheet.includes('const [weight, setWeight] = useState(c.weight);\n  const [reps, setReps] = useState(c.reps);\n  const [estimate, setEstimate] = useState(0);\n  const [saved, setSaved] = useState(\'\');'));
    assert.ok(sheet.includes('const typed = (t: string): void => { setWeight(t); setEstimate(e1rmEstimate(t, String(reps))); };'));
    assert.ok(sheet.includes('const picked = (n: number): void => { setReps(n); setEstimate(e1rmEstimate(weight, String(n))); };'));
    assert.ok(sheet.includes('const r = onSave(weight, String(reps));\n    setEstimate(r.estimate);\n    if (r.saved !== null) setSaved(r.saved);'));
    assert.ok(sheet.includes('{[1, 2, 3, 4, 5].map((n) => (') && sheet.includes('onPress={() => picked(n)}') && sheet.includes('value={weight} onChangeText={typed}'));
    assert.ok(sheet.includes('{saved\n        ? <Text testID="sheet-max-saved"') && sheet.includes('onPress={save}'));
    for (const words of ['<Text style={[s.e1rmHdText, { color: p.text }]}>Estimated 1RM</Text>', '<Text style={[s.e1rmOutLbl, { color: p.muted }]}>Estimated 1RM</Text>', '>from your test set</Text>', "{'Weight (' + c.unit + ')'}", '>Reps</Text>', "{estimate + ' '}", "{'Save as new ' + c.liftLabel + ' max'}",
      '>Experienced with heavy singles and have a spotter? A single at RPE 9.5 works too. Enter it at 1 rep.</Text>']) {
      assert.ok(sheet.includes(words), words);
    }
  });
  test('This Week opens it: Reopen on a done lift, and Start where the day opens no deck', () => {
    const week = read('this-week/ThisWeek.tsx');
    assert.ok(week.includes("else if (r.to === 'day') { if (onReopen) onReopen(k.week, k.key); }") && week.includes("onPress={() => tap('reopen')}"));
    assert.ok(week.includes('if (view) onDeck({ prog: grid, week, dayKey: key, view, warn }, from); else openSheet(week, key);'));
    assert.ok(week.includes('const view = sheetView(store, grid, week, key, Date.now(), inHand);\n    if (view) onSheet({ prog: grid, week, dayKey: key, view, only });'));
    assert.ok(week.includes('onStart={startDeck} onReopen={openSheet} onCardio={openSheet} onRecord={record} onRest={'));
    const app = read('App.tsx');
    assert.ok(app.includes('onSheet={(s) => { setGoing(false); setSheet(s); }}'));
    assert.ok(app.includes('onDone={(prog, week, dayKey) => { setSheet(null); complete({ store: phoneStore, prog } as unknown as PopSession, week, dayKey); }} />'), 'Done closes the sheet and raises the completion pop-up over This Week');
    assert.ok(app.includes('<SessionSheet palette={p} store={phoneStore} open={sheet} inHand={inHand} calm={calm} onClose={() => setSheet(null)} onProgram={setHeld} onOver={setOver} say={say}'));
  });
});
