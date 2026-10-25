// Logging a session on the day card: the wheels the run and bike forms are made of, opening a day, rolling a wheel,
// the Log button, Done and Skip, the sport chip, and a jog logged on a rest day. Rulings D199 to D227 (the run and bike
// wheels, the zero faces, the Log button, the rest-day log).
//
// The app is driven the way the athlete drives it on the phone (tests/support/log-form.ts): openDayKey renders the
// form, the wheels settle and commit on a virtual clock, logCardio, handleDayStatus, setCardioSwap and the rest sheet
// are the app's own. Every program is stored as starting Monday 2026-09-21 with the clock on that Monday 10:00.
// HALF_MANNY (seed 76308) week 1: mon Speed Run (no dose), tue lifting, wed rest, fri Recovery Run (time, 25 min),
// sat Long Run (distance, 3.1 mi), sun rest.
//
// Oracles are typed by hand: 0:47:13 is 47 + 13/60 = 47.2167 min, stored "47.22"; 47.22 min = 2833.2 s, so 3.1 mi is
// 913.9 s/mi, "15:14/mi"; every other pace is whole seconds per mile by hand (paceHand). Faces are typed strings. The
// app's converters are compared only to those literals. The lattices over many programs are tests/sweeps/logging.test.ts;
// this file opens HALF_MANNY's run days and the hand hosts.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APP, fixtures } from '../support/app.ts';
import {
  DAYS, NUDGE, mkCfg, cardioOf, sportOf, weeksOf, paceHand, logForm, readForm, renderedColumns, stripComments,
  DOSES, runFormShape, runOpenFaces, BIKE_GLYPH, bikeShape, bikeCopyBad,
} from '../support/log-form.ts';
import type { Roll, SportSpec } from '../support/log-form.ts';
import type { DayKey, Program } from '@ia/core';

/** A rest-day jog as the rest sheet takes it. */
interface Jog {
  type: string;
  mins: number;
  dist: string;
  rpe: number;
  stale?: boolean;
}
/** A Session Journal row: the day and the text segments between tags. */
interface JournalRow {
  day: string;
  segs: string[];
}

const J = JSON.stringify;
const HTML = fs.readFileSync(APP, 'utf8');
const SRC = stripComments(HTML);

const TAIL = '47.22'; // 0:47:13
const SAT_DIST = '3.1'; // HALF_MANNY W1 sat Long Run plan, String(3.1)
const SAT_PACE = '15:14/mi'; // 2833.2 s / 3.1 mi = 913.9 s/mi
const COPY = { log: 'Log', logged: 'Logged ✓', run: 'Run logged ✓', bike: 'Ride logged ✓', swim: 'Swim logged ✓', empty: 'Nothing to log yet.', slider: 'Move slider' };
const SEVEN = ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time', 'bike_mins', 'swim_yards'];
const ZERO3 = ['0', '0', '0'];
const seq = (a: number, b: number) => { const o: string[] = []; for (let v = a; v <= b; v++) o.push(String(v)); return o; };
const rep5 = (a: string[]) => ([] as string[]).concat(a, a, a, a, a);

const REPS_DIST = { k: 'reps_dist', reps: 6, m: 400, tgt: 480 };

// One environment for the whole file; each test stores its own program and starts from an empty store.
const C = logForm('logging');
const HALF = C.build(fixtures.HALF_MANNY);
const fresh = () => { C.use(HALF); C.unforce(); };
const subOf = (p: Program, w: number, d: DayKey) => String((cardioOf(p.weeks[w] && p.weeks[w][d]) || {}).subtype || '');
/** The first run day of HALF_MANNY (W1 mon). */
const RUN_HOST = ((): [number, DayKey] | null => {
  for (const w of weeksOf(HALF)) for (const d of DAYS) if (sportOf(HALF.weeks[w][d]) === 'run') return [w, d];
  return null;
})();
/** Opens with an empty store and reports what the open wrote. */
function openFresh(w: number, d: string) {
  C.wipe();
  C.open(w, d);
  const wrote: string[] = [];
  if (C.inputs()) wrote.push(C.inputs() + ' input events');
  if (C.LS.getItem('ia_logs_' + C.id) != null) wrote.push('ia_logs_ ' + C.LS.getItem('ia_logs_' + C.id));
  if (C.histRaw() != null) wrote.push('ia_hist_');
  return wrote;
}

// ── the wheels ───────────────────────────────────────────────────────────────────────────────────────────────────────
const iawFormat = C.ev('_iawFormat');
const iawParse = C.ev('_iawParse');
const FMT = (k: string, v: unknown) => iawFormat(k, v);
const PARSE = (k: string, s: string) => Array.from(iawParse(k, s));

test('the time wheel shows hours 0 to 9 with no dash and no wrap, minutes and seconds 00 to 59 wrapping, capped Time', () => {
  const { html, cols } = renderedColumns(C, 'hms');
  assert.equal(cols.length, 3);
  assert.match(html, /class="iaw-cell iaw-f3"/);
  assert.equal((html.match(/<div class="iaw-cap">([^<]*)<\/div>/) || [])[1], 'Time');
  assert.deepEqual(cols[0].vals, seq(0, 9), 'hours rows');
  assert.deepEqual(cols[0].faces, seq(0, 9), 'hours faces');
  assert.equal(cols[0].nils, 0);
  assert.equal(cols[0].len, 10);
  assert.equal(cols[0].wrap, '');
  for (const ci of [1, 2]) {
    assert.deepEqual(cols[ci].vals, rep5(seq(0, 59)), 'column ' + ci + ' rows, five copies');
    assert.deepEqual(cols[ci].faces, rep5(seq(0, 59).map((v) => v.padStart(2, '0'))), 'column ' + ci + ' faces');
    assert.equal(cols[ci].wrap, '1');
    assert.equal(cols[ci].len, 60);
    assert.equal(cols[ci].nils, 0);
  }
});

test('the miles wheel shows whole miles 0 to 99 with no dash and no wrap, tenths and hundredths wrapping', () => {
  const { cols } = renderedColumns(C, 'dist');
  assert.equal(cols.length, 3);
  assert.deepEqual(cols[0].vals, seq(0, 99));
  assert.equal(cols[0].nils, 0);
  assert.equal(cols[0].len, 100);
  assert.equal(cols[0].wrap, '');
  for (const ci of [1, 2]) {
    assert.equal(cols[ci].wrap, '1');
    assert.equal(cols[ci].len, 10);
    assert.equal(cols[ci].nils, 0);
    assert.ok(cols[ci].vals.length >= 20 && cols[ci].vals.length % 10 === 0 && cols[ci].vals.every((v, i) => v === String(i % 10)), 'whole copies of 0..9');
  }
});

test('the rep time wheel shows minutes 0 to 9 with no dash and no wrap, seconds wrapping', () => {
  const { cols } = renderedColumns(C, 'rept');
  assert.equal(cols.length, 2);
  assert.deepEqual(cols[0].vals, seq(0, 9));
  assert.equal(cols[0].nils, 0);
  assert.equal(cols[0].len, 10);
  assert.equal(cols[0].wrap, '');
  assert.equal(cols[1].wrap, '1');
  assert.equal(cols[1].len, 60);
  assert.ok(cols[1].vals.length >= 120 && cols[1].vals.every((v, i) => v === String(i % 60)), 'whole copies of 0..59');
});

test('the pace wheel keeps its dash: minutes dash then 4 to 17, seconds wrapping', () => {
  const { cols } = renderedColumns(C, 'pace');
  assert.equal(cols.length, 2);
  assert.deepEqual(cols[0].vals, [''].concat(seq(4, 17)));
  assert.equal(cols[0].nils, 1);
  assert.equal(cols[0].len, 15);
  assert.equal(cols[0].wrap, '');
  assert.equal(cols[1].wrap, '1');
  assert.equal(cols[1].len, 60);
  assert.ok(cols[1].vals.length >= 120 && cols[1].vals.every((v, i) => v === String(i % 60)));
});

test('hours, whole miles and rep minutes never wrap; every other column wraps unless it carries a dash', () => {
  const SPEC = C.ev('_IAW_SPEC');
  const wraps = (k: string) => Array.from(SPEC[k].cols, (c) => C.ev('_iawWraps')(c));
  assert.deepEqual(wraps('hms'), [false, true, true]);
  assert.deepEqual(wraps('dist'), [false, true, true]);
  assert.deepEqual(wraps('rept'), [false, true]);
  assert.deepEqual(wraps('pace'), [false, true]);
});

test('every second from 0:00:01 to 9:59:59 stores as decimal minutes to two places and reads back to itself', () => {
  // hundredths n = round(5T/3) = floor((10T + 3) / 6): 10T is even and 6k + 3 odd, so there is no tie. Integer arithmetic.
  for (let T = 1; T < 36000; T++) {
    const h = Math.floor(T / 3600), m = Math.floor((T % 3600) / 60), s = T % 60, n = Math.floor((10 * T + 3) / 6);
    const want = Math.floor(n / 100) + '.' + String(n % 100).padStart(2, '0');
    const got = FMT('hms', [String(h), String(m), String(s)]);
    if (got !== want) assert.fail(`${h}:${m}:${s} formats ${got}, want ${want}`);
    const back = PARSE('hms', got);
    if (J(back) !== J([String(h), String(m), String(s)])) assert.fail(`${got} reads back ${J(back)}`);
  }
  const EX: [string[], string][] = [[['0', '7', '30'], '7.50'], [['0', '15', '20'], '15.33'], [['0', '30', '0'], '30.00'], [['0', '47', '13'], '47.22'],
    [['0', '0', '30'], '0.50'], [['0', '1', '0'], '1.00'], [['1', '0', '0'], '60.00'], [['0', '59', '59'], '59.98'], [['9', '59', '59'], '599.98']];
  for (const [v, want] of EX) assert.equal(FMT('hms', v), want, v.join(':'));
});

test('the zero time face 0:00:00 stores nothing, and a blank or malformed time opens on it', () => {
  assert.equal(FMT('hms', ['0', '0', '0']), '');
  assert.equal(FMT('hms', ['0', '00', '00']), '');
  for (const s of ['', 'abc', '-1', '0', '0.00']) assert.deepEqual(PARSE('hms', s), ZERO3, J(s));
});

test('a stored time reads back to its nearest second, and anything at or over 9:59:59 pegs there', () => {
  const PEG = ['9', '59', '59'];
  const TABLE: [string, string[]][] = [['15.333', ['0', '15', '20']], ['100', ['1', '40', '0']], ['7.5', ['0', '7', '30']], ['47.22', ['0', '47', '13']],
    ['45.5', ['0', '45', '30']], ['45', ['0', '45', '0']], ['.5', ['0', '0', '30']], ['599', ['9', '59', '0']],
    ['599.98', PEG], ['599.99', PEG], ['600', PEG], ['601', PEG], ['630.5', PEG], ['650', PEG], ['1200', PEG]];
  for (const [s, want] of TABLE) assert.deepEqual(PARSE('hms', s), want, s);
});

test('a stored distance reads back by its first two decimals, clamps at 99, and a blank or malformed one lands on 0.00', () => {
  const TABLE: [string, string[]][] = [['.86', ['0', '8', '6']], ['3.1', ['3', '1', '0']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']],
    ['abc', ZERO3], ['.', ZERO3], ['-1', ZERO3], ['', ZERO3], ['0', ZERO3], ['0.00', ZERO3]];
  for (const [s, want] of TABLE) assert.deepEqual(PARSE('dist', s), want, J(s));
});

test('the miles and rep time wheels store their faces, and their zero faces store nothing', () => {
  const DIST: [string[], string][] = [[['0', '7', '5'], '0.75'], [['3', '1', '0'], '3.10'], [['13', '1', '0'], '13.10'], [['99', '9', '9'], '99.99'], [['0', '0', '1'], '0.01']];
  for (const [v, want] of DIST) assert.equal(FMT('dist', v), want, v.join(','));
  const REPT: [string[], string][] = [[['0', '45'], '0:45'], [['1', '5'], '1:05'], [['9', '59'], '9:59']];
  for (const [v, want] of REPT) assert.equal(FMT('rept', v), want, v.join(','));
  assert.equal(FMT('dist', ['0', '0', '0']), '');
  assert.equal(FMT('rept', ['0', '0']), '');
  // a dash value still formats to nothing
  assert.equal(FMT('dist', ['', '8', '6']), '');
  assert.equal(FMT('rept', ['', '55']), '');
  for (const s of ['', 'abc', '45', '0:00']) assert.deepEqual(PARSE('rept', s), ['0', '0'], J(s));
});

test('the pace wheel reads and stores as before: blank or malformed stays on the dash, 9:30 round trips', () => {
  assert.deepEqual(PARSE('pace', ''), ['', '']);
  assert.deepEqual(PARSE('pace', 'abc'), ['', '']);
  assert.equal(FMT('pace', ['', '30']), '');
  assert.equal(FMT('pace', ['9', '30']), '9:30');
  assert.deepEqual(PARSE('pace', '9:30'), ['9', '30']);
});

test('a stacked wheel is capped at 178.2 px, three fifths of a 375 pt row after its padding', () => {
  const W375 = (375 - 2 * 16 - 2 * 1 - 2 * 16 - 12) * 3 / 5; // .detail-body, .log-section border, .log-body, .iaw-wrap gap
  assert.equal(W375, 178.2);
  const css = HTML.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = css.match(/\.iaw-solo\{max-width:([\d.]+)px;?\}/g) || [];
  assert.equal(rules.length, 1);
  assert.equal(parseFloat((rules[0].match(/max-width:([\d.]+)px/) as RegExpMatchArray)[1] as string), W375);
  const PREMISES = ['.detail-body{padding:16px 16px 20px !important;', '.log-section{background:var(--surface) !important;border:1px solid var(--border) !important;',
    '.log-body{padding:14px 16px;', '.iaw-wrap{display:flex;gap:12px;', '.iaw-cell{flex:1;min-width:0;}', '.iaw-cell.iaw-f3{flex:3;}', '.iaw-cell.iaw-f2{flex:2;}',
    '.iaw{display:flex;', 'border:1px solid var(--border2);border-radius:4px;position:relative;'];
  for (const p of PREMISES) assert.ok(css.includes(p), p);
});

// ── the run form: shape and copy ─────────────────────────────────────────────────────────────────────────────────────
const facesNow = () => { const o: Record<string, string> = {}; C.wheels().forEach((w) => { o[w.hid] = C.face(w); }); return o; };

test('the run time, distance and rep forms are wheels, the fixed one showing the plan, each alone in its row', () => {
  assert.ok(RUN_HOST, 'HALF_MANNY has a run day');
  C.use(HALF);
  for (const k of ['time', 'dist', 'reps_time']) {
    C.force(DOSES[k]);
    C.setLog(RUN_HOST![0], RUN_HOST![1], null);
    C.open(RUN_HOST![0], RUN_HOST![1]);
    assert.deepEqual(runFormShape(k, readForm(C.form()), DOSES[k]), [], k);
  }
  C.unforce();
  const boxes = (HTML.match(/<input\b[^>]*>/g) || []).filter((t) => /type="number"/.test(t) && /id="log_run_(mins|dist)"/.test(t));
  assert.equal(boxes.length, 0, 'no number box for run minutes or miles anywhere in the app');
});

test('opening a run form with nothing stored writes nothing and shows the plan on the fixed wheel, zero on the free ones', () => {
  C.use(HALF);
  for (const k of ['time', 'dist', 'reps_time']) {
    C.force(DOSES[k]);
    for (const stored of [null, { run_mins: '', run_dist: '', rpe: '', notes: '' }]) {
      C.setLog(RUN_HOST![0], RUN_HOST![1], stored);
      const before = C.logs();
      C.open(RUN_HOST![0], RUN_HOST![1]);
      const tag = k + (stored ? ' stored blank' : ' no entry');
      assert.deepEqual(facesNow(), runOpenFaces(k, DOSES[k]), tag);
      assert.equal(C.inputs(), 0, tag + ': input events');
      assert.equal(C.logs(), before, tag + ': ia_logs_ unchanged');
      assert.equal(C.hidden('log_run_dist'), '', tag + ': hidden miles');
      if (k !== 'reps_time') assert.equal(C.hidden('log_run_mins'), '', tag + ': hidden minutes');
    }
  }
  C.unforce();
});

test('an older stored run opens on its own faces and writes nothing', () => {
  const LEGACY: [string, Record<string, string>, Record<string, string>][] = [ // [form, stored, faces by hand]
    ['dist', { run_dist: '3.456' }, { log_run_dist: '3.45', log_run_mins: '0:00:00' }],
    ['dist', { run_dist: '.86' }, { log_run_dist: '0.86', log_run_mins: '0:00:00' }],
    ['dist', { run_dist: '100' }, { log_run_dist: '99.00', log_run_mins: '0:00:00' }],
    ['time', { run_mins: '100' }, { log_run_mins: '1:40:00', log_run_dist: '0.00' }],
    ['time', { run_mins: '15.333' }, { log_run_mins: '0:15:20', log_run_dist: '0.00' }],
    ['time', { run_mins: '650' }, { log_run_mins: '9:59:59', log_run_dist: '0.00' }],
    ['time', { run_mins: '7.5' }, { log_run_mins: '0:07:30', log_run_dist: '0.00' }],
  ];
  C.use(HALF);
  for (const [k, stored, want] of LEGACY) {
    C.force(DOSES[k]);
    C.setLog(RUN_HOST![0], RUN_HOST![1], Object.assign({ rpe: '5' }, stored));
    const before = C.logs();
    C.open(RUN_HOST![0], RUN_HOST![1]);
    assert.deepEqual(facesNow(), want, J(stored));
    assert.equal(C.inputs(), 0, J(stored));
    assert.equal(C.logs(), before, J(stored));
  }
  C.unforce();
});

test('every HALF_MANNY run day with a time or distance dose opens on its plan, in the ruled shape, writing nothing', () => {
  C.use(HALF);
  let n = 0;
  const kinds = new Set();
  for (const w of weeksOf(HALF)) {
    for (const d of DAYS) {
      const c = cardioOf(HALF.weeks[w][d]);
      if (!c || String(c.type).toLowerCase() !== 'run') continue;
      const dose = C.dose(c);
      if (!dose || (dose.k !== 'time' && dose.k !== 'dist')) continue;
      C.setLog(w, d, null);
      const before = C.logs();
      C.open(w, d);
      const tag = 'W' + w + ' ' + d + ' ' + dose.k;
      assert.deepEqual(runFormShape(dose.k, readForm(C.form()), dose), [], tag);
      assert.deepEqual(facesNow(), runOpenFaces(dose.k, dose), tag);
      assert.equal(C.inputs(), 0, tag);
      assert.equal(C.logs(), before, tag);
      n++;
      kinds.add(dose.k);
    }
  }
  assert.ok(n > 0 && kinds.has('time') && kinds.has('dist'), n + ' days, kinds ' + J([...kinds]));
});

test('the run forms read Log the run, Shows the plan, Off the watch, and Miles in the work reps, with no dash', () => {
  const COPY_RUN: Record<string, { label: string; subs: string[]; caps: string[] }> = {
    time: { label: 'Log the run', subs: ['Shows the plan. Move it to match the watch.', 'Off the watch.'], caps: ['Time', 'Miles'] },
    dist: { label: 'Log the run', subs: ['Shows the plan. Move it to match the watch.', 'Off the watch.'], caps: ['Miles', 'Time'] },
    reps_time: { label: 'Miles in the work reps', subs: ['Leave out the easy jog between reps.'], caps: ['Miles'] },
  };
  C.use(HALF);
  const all = [];
  for (const k of Object.keys(COPY_RUN)) {
    C.force(DOSES[k]);
    C.setLog(RUN_HOST![0], RUN_HOST![1], null);
    C.open(RUN_HOST![0], RUN_HOST![1]);
    const f = readForm(C.form());
    const labels = f.labels.filter((l) => l !== 'Reps completed');
    assert.deepEqual(labels, [COPY_RUN[k].label], k + ' label');
    assert.deepEqual(f.subs, COPY_RUN[k].subs, k + ' sub-labels');
    assert.deepEqual(f.caps, COPY_RUN[k].caps, k + ' caps');
    all.push(...labels, ...f.subs);
  }
  C.unforce();
  for (const t of all) assert.doesNotMatch(t, /—|–| - /, t);
  const fn = (HTML.match(/function cardioFieldHTML\([\s\S]*?\n}\n/) || [''])[0].replace(/\/\/[^\n]*/g, '');
  assert.ok(fn.length > 0);
  assert.ok(!/Hours first/.test(fn), 'no "Hours first" in cardioFieldHTML');
});

// ── the run form: rolling the wheels ─────────────────────────────────────────────────────────────────────────────────
test('a rolled run wheel waits for the Log tap, which stores two-decimal minutes and miles and the derived pace', () => {
  const [W, D] = RUN_HOST!;
  C.use(HALF);
  // free miles to 2 on the 15 min time form
  C.force(DOSES.time); C.setLog(W, D, null); C.open(W, D);
  C.roll(C.need('log_run_dist'), [[0, '2']]);
  assert.equal(C.entry(W, D), null, 'nothing stored before Log');
  assert.deepEqual({ mins: C.hidden('log_run_mins'), dist: C.hidden('log_run_dist') }, { mins: '', dist: '2.00' });
  let dd = C.derived().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(dd.includes(paceHand(15 * 60, 2)) && /assuming planned 15 min/.test(dd), dd); // 900 s / 2 mi = 7:30/mi
  C.tapLogButton();
  let e = C.entry(W, D) || {};
  assert.equal(e.run_mins || '', '');
  assert.equal(e.run_dist, '2.00');
  // then the fixed time from 0:15:00 to 0:15:30
  C.setLog(W, D, null); C.open(W, D);
  C.roll(C.need('log_run_dist'), [[0, '2']]);
  C.roll(C.need('log_run_mins'), [[2, '30']]);
  assert.equal(C.entry(W, D), null);
  assert.equal(C.hidden('log_run_mins'), '15.50');
  dd = C.derived().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(dd.includes(paceHand(15.5 * 60, 2)) && !/assuming/.test(dd), dd); // 930 s / 2 mi = 7:45/mi
  C.tapLogButton();
  e = C.entry(W, D) || {};
  assert.equal(e.run_mins, '15.50');
  assert.equal(e.run_pace, '7:45/mi');
  assert.equal(Math.round(C.ev('doseDerived')(DOSES.time, { mins: e.run_mins, dist: e.run_dist }).sec), 465);
  // the fixed miles from 8.00 to 8.25
  C.force(DOSES.dist); C.setLog(W, D, null); C.open(W, D);
  C.roll(C.need('log_run_dist'), [[1, '2']]);
  C.roll(C.need('log_run_dist'), [[2, '5']]);
  assert.equal(C.entry(W, D), null);
  assert.equal(C.hidden('log_run_dist'), '8.25');
  C.tapLogButton();
  assert.equal((C.entry(W, D) || {}).run_dist, '8.25');
  C.unforce();
});

test('away from the plan and back to it commits both moves; settling on the plan alone writes nothing', () => {
  const [W, D] = RUN_HOST!;
  C.use(HALF);
  C.force(DOSES.dist); C.setLog(W, D, null); C.open(W, D);
  C.roll(C.need('log_run_dist'), [[1, '5']]);
  assert.equal(C.hidden('log_run_dist'), '8.50');
  C.roll(C.need('log_run_dist'), [[1, '0']]);
  assert.equal(C.hidden('log_run_dist'), '8.00');
  assert.equal(C.INPUTS.log_run_dist, 2, 'two input events');
  assert.equal(C.entry(W, D), null);
  C.tapLogButton();
  assert.equal((C.entry(W, D) || {}).run_dist, '8.00');
  // settle on the seed face 0:15:00 only
  C.force(DOSES.time); C.setLog(W, D, null); C.open(W, D);
  C.roll(C.need('log_run_mins'), [[1, '15']]);
  C.roll(C.need('log_run_mins'), [[0, '0']]);
  assert.equal(C.entry(W, D), null);
  assert.equal(C.inputs(), 0);
  C.unforce();
});

const BIKE_CENTURY = C.build(mkCfg([['bike', 'bike_century']], 'balanced', 'beginner', 'commercial', 76308));

test('a blank time wheel opens on 0:00:00, a planned one on its plan, and neither writes', () => {
  C.use(BIKE_CENTURY);
  assert.match(subOf(BIKE_CENTURY, 1, 'mon'), /Long Slow Distance|LSD/);
  assert.deepEqual(openFresh(1, 'mon'), []);
  assert.equal(C.face(C.need('log_bike_mins')), '0:00:00');
  C.use(HALF);
  assert.match(subOf(HALF, 1, 'sat'), /Long Run/);
  assert.deepEqual(openFresh(1, 'sat'), []);
  assert.equal(C.face(C.need('log_run_mins')), '0:00:00');
  assert.equal(C.need('log_run_mins').plan, null, 'the free time wheel carries no plan');
  assert.match(subOf(HALF, 1, 'fri'), /Recovery Run/);
  assert.deepEqual(openFresh(1, 'fri'), []);
  assert.equal(C.face(C.need('log_run_mins')), '0:25:00');
  assert.equal(C.need('log_run_mins').plan, '25');
  assert.ok(!C.need('log_run_mins')._cols[0].items.some((it) => it.v === ''), 'no dash row on the planned hours');
});

test('a time rolled from 0:00:00 to 0:47:13 stores 47.22 through Done, with the plan stamp and its pace on a long run', () => {
  C.use(BIKE_CENTURY);
  openFresh(1, 'mon');
  C.roll(C.need('log_bike_mins'), [[1, '47'], [2, '13']]);
  assert.equal(C.INPUTS.log_bike_mins, 1, 'one input event');
  C.tap('mon', 'complete');
  assert.equal((C.entry(1, 'mon') || {}).bike_mins, TAIL);
  assert.equal(C.status(1, 'mon'), 'complete');
  assert.ok(C.hist(1, 'mon'), 'the day is frozen in ia_hist_');
  const bc = C.chart('Weekly Cycling Time', 1);
  assert.ok(bc.drawn && +bc.v === 47.22, J(bc));

  C.use(HALF);
  openFresh(1, 'sat');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  assert.equal(C.INPUTS.log_run_mins, 1);
  assert.equal(C.INPUTS.log_run_dist || 0, 0);
  C.tap('sat', 'complete');
  const e = C.entry(1, 'sat') || {};
  assert.deepEqual([e.run_mins, e.run_dist, e.run_pace], [TAIL, SAT_DIST, SAT_PACE]);
  assert.equal(C.status(1, 'sat'), 'complete');
  assert.ok(C.hist(1, 'sat'));
  const rc = C.chart('Weekly Running Mileage', 1);
  assert.ok(rc.drawn && +rc.v === 3.1, J(rc));
});

test('a planned time wheel stores what it is rolled to, 0:30:00 as 30.00 and back from 1:25:00 to 0:25:00', () => {
  C.use(HALF);
  openFresh(1, 'fri');
  C.roll(C.need('log_run_mins'), [[1, '30']]);
  C.log();
  assert.equal((C.entry(1, 'fri') || {}).run_mins, '30.00');
  openFresh(1, 'fri');
  C.roll(C.need('log_run_mins'), [[0, '1']]);
  C.log();
  assert.equal((C.entry(1, 'fri') || {}).run_mins, '85.00');
  C.roll(C.need('log_run_mins'), [[0, '0']]);
  assert.equal((C.entry(1, 'fri') || {}).run_mins, '25.00');
});

test('rolling a logged time back to 0:00:00 in the same open clears it, and the readers drop it', () => {
  // bike: stored 47.22 opens on 0:47:13 writing nothing; rolled to zero it stores ''
  C.use(BIKE_CENTURY); C.wipe(); C.setLog(1, 'mon', { rpe: '5', bike_mins: TAIL });
  let before = C.logs();
  C.open(1, 'mon');
  assert.equal(C.face(C.need('log_bike_mins')), '0:47:13');
  assert.equal(C.inputs(), 0);
  assert.equal(C.logs(), before);
  const nudge0 = C.nudge();
  const ch0 = C.chart('Weekly Cycling Time', 1);
  C.roll(C.need('log_bike_mins'), [[1, '0'], [2, '0']]);
  assert.equal((C.entry(1, 'mon') || {}).bike_mins, '');
  C.open(1, 'mon');
  assert.equal(nudge0, true, 'the unmarked nudge shows over 47.22');
  assert.equal(C.nudge(), false, 'and is gone after the clear');
  const ch1 = C.chart('Weekly Cycling Time', 1);
  assert.ok(ch0.drawn && +ch0.v === 47.22 && ch1.drawn && (ch1.v == null || +ch1.v === 0), J([ch0, ch1]));
  // a long run logged in this open, then rolled to zero: the minutes, the plan stamp and the pace all clear
  C.use(HALF); C.wipe(); C.open(1, 'sat');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.log();
  let e = C.entry(1, 'sat') || {};
  assert.deepEqual([e.run_mins, e.run_dist, e.run_pace], [TAIL, SAT_DIST, SAT_PACE]);
  C.roll(C.need('log_run_mins'), [[1, '0'], [2, '0']]);
  e = C.entry(1, 'sat') || {};
  assert.deepEqual([e.run_mins, e.run_dist, e.run_pace], ['', '', '']);
  // a stored 30.00 on the planned time form
  C.wipe(); C.setLog(1, 'fri', { rpe: '5', run_mins: '30.00' }); C.open(1, 'fri');
  assert.equal(C.face(C.need('log_run_mins')), '0:30:00');
  C.roll(C.need('log_run_mins'), [[1, '0']]);
  assert.equal((C.entry(1, 'fri') || {}).run_mins, '');
  // an older stored "0.00" opens on 0:00:00 writing nothing; 0:47:00 and back stores ''
  C.use(BIKE_CENTURY); C.wipe(); C.setLog(1, 'mon', { rpe: '5', bike_mins: '0.00' });
  before = C.logs();
  C.open(1, 'mon');
  assert.equal(C.face(C.need('log_bike_mins')), '0:00:00');
  assert.equal(C.inputs(), 0);
  assert.equal(C.logs(), before);
  C.roll(C.need('log_bike_mins'), [[1, '47']]);
  assert.equal((C.entry(1, 'mon') || {}).bike_mins, '47.00');
  C.roll(C.need('log_bike_mins'), [[1, '0']]);
  assert.equal((C.entry(1, 'mon') || {}).bike_mins, '');
});

// ── miles and rep time: zero, never a dash ───────────────────────────────────────────────────────────────────────────
// Paces by hand (paceHand, never the app's formatter): 2833.2 s / 0.75 mi = 3777.6 -> 62:58/mi; 1500 s / 0.75 mi =
// 2000 -> 33:20/mi; 2833.2 s / 4.2 mi = 674.6 -> 11:15/mi; 45 s per 400 m (0.248548 mi) = 181.05 -> 3:01/mi;
// 3000 s / 3.1 mi = 967.7 -> 16:08/mi.
const SEC_4713 = 47 * 60 + 13.2;
const P = { p075: '62:58/mi', pFri: '33:20/mi', p420: '11:15/mi', pRep: '3:01/mi', p50: '16:08/mi' };

test('the hand paces are the arithmetic typed out', () => {
  assert.equal(paceHand(SEC_4713, 0.75), P.p075);
  assert.equal(paceHand(25 * 60, 0.75), P.pFri);
  assert.equal(paceHand(SEC_4713, 3.1), SAT_PACE);
  assert.equal(paceHand(SEC_4713, 4.2), P.p420);
  assert.equal(paceHand(45, 400 / 1609.344), P.pRep);
  assert.equal(paceHand(50 * 60, 3.1), P.p50);
});

test('a fresh run form opens on 3.10 and 0:00:00, 0:25:00 and 0.00, a rep time of 0:00, and a generic 0.00 with the pace on its dash', () => {
  fresh();
  let wr = openFresh(1, 'sat');
  assert.match(subOf(HALF, 1, 'sat'), /Long Run/);
  assert.equal(C.need('log_run_dist').plan, '3.1');
  assert.deepEqual([C.faceText(C.wheel('log_run_dist')), C.faceText(C.wheel('log_run_mins')), wr], ['3.10', '0:00:00', []]);
  wr = openFresh(1, 'fri');
  assert.match(subOf(HALF, 1, 'fri'), /Recovery Run/);
  assert.equal(C.need('log_run_mins').plan, '25');
  assert.deepEqual([C.faceText(C.wheel('log_run_mins')), C.faceText(C.wheel('log_run_dist')), wr], ['0:25:00', '0.00', []]);
  C.force(REPS_DIST);
  wr = openFresh(1, 'fri');
  assert.deepEqual([C.faceText(C.wheel('log_run_rep_time')), wr], ['0:00', []]);
  C.force(null);
  wr = openFresh(1, 'fri');
  assert.ok(C.wheel('log_run_pace') && !C.wheel('log_run_mins'), 'a null dose renders the generic form');
  assert.deepEqual([C.faceText(C.wheel('log_run_dist')), wr], ['0.00', []]);
  assert.equal(C.colValue(C.wheel('log_run_pace')!, 0), '', 'the pace minutes sit on the dash');
  assert.equal(C.faceText(C.wheel('log_run_pace')), '—:00');
  C.unforce();
});

test('miles rolled from 0.00 are logged with their pace: 0.75 with 0:47:13, 0.75 on the planned 25 min, a 0:45 rep', () => {
  fresh();
  openFresh(1, 'sat');
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '7'], [2, '5']]);
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.clearToast();
  C.log();
  let e = C.entry(1, 'sat') || {};
  assert.deepEqual([e.run_dist, e.run_mins, e.run_pace], ['0.75', TAIL, P.p075]);
  assert.equal(C.toast(), COPY.run);
  assert.equal(C.label(), COPY.logged);
  openFresh(1, 'fri');
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '7'], [2, '5']]);
  assert.ok(C.derived().includes('assuming planned 25 min'), C.derived());
  C.clearToast();
  C.log();
  e = C.entry(1, 'fri') || {};
  assert.deepEqual([e.run_mins, e.run_dist, e.run_pace], ['', '0.75', P.pFri]);
  assert.equal(C.toast(), COPY.run);
  C.force(REPS_DIST);
  openFresh(1, 'fri');
  C.roll(C.need('log_run_rep_time'), [[0, '0'], [1, '45']]);
  C.ev('doseRep(1)'); C.advance(50);
  C.clearToast();
  C.log();
  e = C.entry(1, 'fri') || {};
  C.unforce();
  assert.deepEqual([e.run_rep_time, String(e.run_reps), e.run_pace], ['0:45', '7', P.pRep]);
  assert.equal(C.toast(), COPY.run);
});

test('free miles or a rep time rolled to zero store nothing, and a run with nothing left reads as not logged', () => {
  const live = { rpe: '', run_dist: '0.75', run_pace: P.pFri, run_mins: '', run_reps: '', run_rep_time: '', bike_mins: '', swim_yards: '', notes: '' };
  fresh(); C.wipe(); C.setLog(1, 'fri', live);
  let before = C.logs();
  C.open(1, 'fri');
  assert.deepEqual([C.faceText(C.wheel('log_run_dist')), C.inputs(), C.logs() === before, C.label()], ['0.75', 0, true, COPY.logged]);
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '0'], [2, '0']]);
  let e = C.entry(1, 'fri');
  assert.equal(e.run_dist, '', 'not "0.00"');
  assert.deepEqual(SEVEN.map((k) => e[k]), SEVEN.map(() => ''), 'every session number blank');
  assert.ok(!(e.notes && e.notes.trim()), 'and no note: nothing left that reads as logged');
  assert.equal(C.label(), COPY.log);
  C.open(1, 'fri');
  assert.equal(C.nudge(), false);
  assert.equal(C.status(1, 'fri') == null, true);
  // an older stored "0.00"
  C.wipe(); C.setLog(1, 'fri', { rpe: '5', run_dist: '0.00' });
  before = C.logs();
  C.open(1, 'fri');
  assert.deepEqual([C.faceText(C.wheel('log_run_dist')), C.inputs(), C.logs() === before], ['0.00', 0, true]);
  C.roll(C.need('log_run_dist'), [[1, '7'], [2, '5']]);
  assert.equal((C.entry(1, 'fri') || {}).run_dist, '0.75');
  C.roll(C.need('log_run_dist'), [[1, '0'], [2, '0']]);
  assert.equal((C.entry(1, 'fri') || {}).run_dist, '');
  // an older stored rep time "0:00"
  C.force(REPS_DIST); C.wipe(); C.setLog(1, 'fri', { rpe: '5', run_rep_time: '0:00' });
  before = C.logs();
  C.open(1, 'fri');
  assert.deepEqual([C.faceText(C.wheel('log_run_rep_time')), C.inputs(), C.logs() === before], ['0:00', 0, true]);
  C.roll(C.need('log_run_rep_time'), [[1, '45']]);
  assert.equal((C.entry(1, 'fri') || {}).run_rep_time, '0:45');
  C.roll(C.need('log_run_rep_time'), [[1, '0']]);
  e = C.entry(1, 'fri') || {};
  C.unforce();
  assert.equal(e.run_rep_time, '');
});

test('on a logged long run, miles rolled to 0.00 fall back to the planned 3.1 and its pace; to 0.75 they store 0.75', () => {
  const setup = () => {
    fresh(); C.wipe(); C.open(1, 'sat');
    C.roll(C.need('log_run_dist'), [[0, '4'], [1, '2'], [2, '0']]);
    C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
    C.log();
    return C.entry(1, 'sat') || {};
  };
  let e = setup();
  assert.deepEqual([e.run_dist, e.run_mins, e.run_pace, C.label()], ['4.20', TAIL, P.p420, COPY.logged]);
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '0'], [2, '0']]);
  e = C.entry(1, 'sat') || {};
  assert.deepEqual([e.run_dist, e.run_pace, e.run_mins], [SAT_DIST, SAT_PACE, TAIL]);
  assert.ok(C.derived().includes('assuming planned 3.1 mi'), C.derived());
  setup();
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '7'], [2, '5']]);
  e = C.entry(1, 'sat') || {};
  assert.deepEqual([e.run_dist, e.run_pace, e.run_mins], ['0.75', P.p075, TAIL]);
});

// ── the planned-miles stamp on a reopened long run ───────────────────────────────────────────────────────────────────
// The stamp is the plan written as String(3.1) = "3.1" with the minutes' pace. A stamped entry is made two ways: the
// app's own Log of 0:47:13 ('log'), or the typed entry below frozen with snapshotDay ('seed'). The hidden nodes read as
// strings, as the DOM does.
const STAMPED = { rpe: '', run_dist: SAT_DIST, run_pace: SAT_PACE, run_mins: TAIL, run_reps: '', run_rep_time: '', bike_mins: '', swim_yards: '', notes: '', week: 1, swapFrom: '', swapTo: '' };
const STR_IDS = ['log_run_reps', 'log_run_dist', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_run_pace', 'log_rpe', 'log_swim_yards', 'log_notes'];
function openS(w: number, d: string) {
  C.open(w, d);
  for (const k of STR_IDS) {
    const el = C.els[k];
    if (!el || el._sv) continue;
    let v = String(el.value == null ? '' : el.value);
    Object.defineProperty(el, 'value', { get() { return v; }, set(x) { v = String(x == null ? '' : x); }, configurable: true });
    el._sv = 1;
  }
}
const T4713 = () => C.moveTo('log_run_mins', [[0, '0'], [1, '47'], [2, '13']]);
const TZERO = () => C.moveTo('log_run_mins', [[0, '0'], [1, '0'], [2, '0']]);
const stampOk = (e: any) => e.run_dist === SAT_DIST && e.run_mins === TAIL && e.run_pace === SAT_PACE;
function stampSat(way: string) {
  fresh(); C.wipe();
  if (way === 'log') { openS(1, 'sat'); T4713(); C.log(); C.back(); } else { C.setLog(1, 'sat', Object.assign({}, STAMPED)); C.ev("snapshotDay(1,'sat')"); C.back(); }
  return C.entry(1, 'sat') || {};
}
const seven = (e: any) => (e ? SEVEN.map((k) => e[k]) : null);
const allBlank = (e: any) => !!e && SEVEN.every((k) => e[k] === '');
/** The week view's MILES tile, Progress W1 miles, plannedVsLogged W1 actual, and the days the rest sheet offers. */
function readers() {
  C.ev('renderWeekView()');
  let wk = '(no MILES tile)';
  for (const k in C.els) {
    const h = C.els[k] && C.els[k].innerHTML;
    const m = typeof h === 'string' && h.match(/<div class="wk-stat-num" style="color:var\(--run\)">([^<]*)<\/div><div class="wk-stat-lbl">MILES<\/div>/);
    if (m) { wk = m[1]; break; }
  }
  const c = C.chart('Weekly Running Mileage', 1);
  const pv = C.ev('plannedVsLogged')(JSON.parse(C.logs()), JSON.parse(C.histRaw() || '{}'), Object.keys(HALF.weeks).length, 0, false);
  return { wk, prog: c.drawn ? (c.v == null ? 0 : +c.v) : '(no chart)', pvl: pv && pv[1] ? +pv[1].act : '(no week 1)', rest: Array.from(C.ev('restMoveCandidates(1)')).map((x: any) => x.day) };
}

test('a reopened stamp shows the plan face 3.10 with an empty hidden node and writes nothing; rolled miles seed their own', () => {
  const openSeed = (entry: unknown) => {
    fresh(); C.wipe(); C.setLog(1, 'sat', entry);
    const before = C.logs();
    openS(1, 'sat');
    return { wrote: C.inputs() + (C.logs() !== before ? 1 : 0) + (C.histRaw() != null ? 1 : 0), hid: C.hidden('log_run_dist'), face: C.faceText(C.wheel('log_run_dist')), dl: C.derived(), lbl: C.label() };
  };
  let o = openSeed(Object.assign({}, STAMPED));
  assert.deepEqual([o.wrote, o.hid, o.face, o.lbl], [0, '', '3.10', COPY.logged]);
  assert.ok(o.dl.includes('assuming planned 3.1 mi'), o.dl);
  const e0 = stampSat('log');
  assert.ok(stampOk(e0), J(e0));
  const before = C.logs();
  openS(1, 'sat');
  assert.deepEqual([C.inputs(), C.logs() === before, C.hidden('log_run_dist'), C.faceText(C.wheel('log_run_dist')), C.label()], [0, true, '', '3.10', COPY.logged]);
  assert.ok(C.derived().includes('assuming planned 3.1 mi'));
  C.back();
  o = openSeed(Object.assign({}, STAMPED, { run_dist: '3.10' }));
  assert.deepEqual([o.wrote, o.hid, o.face, o.dl.includes('assuming')], [0, '3.10', '3.10', false]);
  o = openSeed(Object.assign({}, STAMPED, { run_dist: '4.20', run_pace: P.p420 }));
  assert.deepEqual([o.wrote, o.hid, o.face], [0, '4.20', '4.20']);
});

test('a reopened stamped long run clears in one roll of the time to zero, and every reader lets it go', () => {
  for (const way of ['log', 'seed']) {
    const e0 = stampSat(way);
    const r0 = readers();
    assert.ok(stampOk(e0), way + ' ' + J(e0));
    assert.deepEqual([r0.wk, r0.prog, r0.pvl, r0.rest.includes('sat')], ['3.1', 3.1, 3.1, false], way + ' readers before the clear');
    openS(1, 'sat'); TZERO();
    const e = C.entry(1, 'sat');
    const lbl = C.label();
    C.back();
    const st = C.status(1, 'sat');
    const r = readers();
    openS(1, 'sat');
    const nu = C.nudge();
    C.back();
    assert.ok(allBlank(e), way + ' all seven blank ' + J(seven(e)));
    assert.equal(lbl, COPY.log, way);
    assert.deepEqual([st == null, nu, r.rest.includes('sat')], [true, false, true], way + ' after Back');
    assert.deepEqual([r.wk, r.prog, r.pvl], ['0', 0, 0], way + ' readers after the clear');
  }
  // after Done the same bytes clear and the day stays complete
  fresh(); C.wipe(); openS(1, 'sat'); T4713(); C.tap('sat', 'complete');
  const ed = C.entry(1, 'sat') || {};
  C.back();
  openS(1, 'sat'); TZERO();
  const e = C.entry(1, 'sat');
  C.back();
  assert.ok(stampOk(ed), J(ed));
  assert.ok(allBlank(e), J(seven(e)));
  assert.equal(C.status(1, 'sat'), 'complete');
  // miles to 0.00 alone on the reopened stamp: the hidden node is already '', nothing is written
  for (const way of ['log', 'seed']) {
    stampSat(way);
    openS(1, 'sat');
    const before = C.logs();
    C.resetInputs();
    C.moveTo('log_run_dist', [[0, '0'], [1, '0'], [2, '0']]);
    assert.deepEqual([C.inputs(), C.logs() === before], [0, true], way);
    C.back();
  }
});

test('on a reopened stamp the RPE moves no session number, and a new time re-stamps 3.1 with its pace', () => {
  for (const way of ['log', 'seed']) {
    const e0 = stampSat(way);
    assert.ok(stampOk(e0));
    openS(1, 'sat');
    const b = C.entry(1, 'sat') || {};
    C.rpe('7');
    const e1 = C.entry(1, 'sat') || {};
    assert.deepEqual(seven(e1), seven(b), way + ' the RPE moves no session number');
    assert.equal(e1.rpe, '7');
    C.moveTo('log_run_mins', [[0, '0'], [1, '50'], [2, '0']]);
    const e2 = C.entry(1, 'sat') || {};
    C.back();
    assert.deepEqual([e2.run_dist, e2.run_pace], [SAT_DIST, P.p50], way);
  }
});

test('rolled miles survive a time clear as a miles-only log; a two-decimal plan stored as its own stamp drops on the next write', () => {
  const ROLLED: Record<string, string> = { '3.10': SAT_PACE, '4.20': P.p420 };
  for (const md of Object.keys(ROLLED)) {
    fresh(); C.wipe(); C.setLog(1, 'sat', Object.assign({}, STAMPED, { run_dist: md, run_pace: ROLLED[md] }));
    openS(1, 'sat');
    const h = C.hidden('log_run_dist');
    TZERO();
    const e = C.entry(1, 'sat') || {};
    const lbl = C.label();
    C.back();
    assert.deepEqual([h, e.run_dist, e.run_mins, e.run_pace, lbl], [md, md, '', '', COPY.logged], md);
  }
  // the collision: the first dose=dist day whose plan carries two decimals, over the run goals in a fixed order
  let K = null;
  for (const g of ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal']) {
    for (const f of ['balanced', 'strength']) {
      for (const ex of ['beginner', 'advanced']) {
        for (const sd of [76308, 24865]) {
          const p = C.build(mkCfg([['run', g]], f, ex, 'commercial', sd));
          for (const w of weeksOf(p)) {
            for (const d of DAYS) {
              const c = cardioOf(p.weeks[w][d]);
              if (!c || String(c.type).toLowerCase() !== 'run' || !c.dose || c.dose.k !== 'dist') continue;
              if (/\.\d\d$/.test(String(c.dose.mi))) { K = { name: g + '|' + f + '|' + ex + '|' + sd, p, w, d, mi: c.dose.mi }; break; }
            }
            if (K) break;
          }
          if (K) break;
        }
        if (K) break;
      }
      if (K) break;
    }
    if (K) break;
  }
  assert.ok(K, 'a two-decimal dose=dist day exists in the run-goal lattice');
  C.use(K.p); C.unforce(); C.wipe();
  C.setLog(K.w, K.d, { rpe: '', run_dist: String(K.mi), run_pace: '', run_mins: '', run_reps: '', run_rep_time: '', bike_mins: '', swim_yards: '', notes: '' });
  const before = C.logs();
  openS(K.w, K.d);
  assert.deepEqual([C.inputs(), C.logs() === before], [0, true], K.name + ' W' + K.w + ' ' + K.d + ' opens writing nothing');
  C.rpe('7');
  const e = C.entry(K.w, K.d) || {};
  C.back();
  assert.deepEqual([e.run_dist, e.rpe], ['', '7'], 'the ruled cost: the stamp-equal miles drop on the next write');
});

test('a reopened stamp parks with its minutes on chip Bike and comes back unchanged on chip Run; a cleared one parks nothing', () => {
  const NOTE_BARE = 'Counts toward Bike, not Run.';
  const NOTE_KEPT = NOTE_BARE + ' Your Run numbers are kept. Switch back and they return.';
  const noteTxt = () => (C.els.cardioSwapNote && C.els.cardioSwapNote.textContent) || '';
  const noClock = (e: any) => (e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'ts').sort()) : null);
  for (const way of ['log', 'seed']) {
    stampSat(way);
    openS(1, 'sat');
    const b = C.entry(1, 'sat') || {};
    C.chip('bike');
    const e1 = C.entry(1, 'sat') || {};
    const pr = (e1.parked && e1.parked.run) || {};
    assert.deepEqual([pr.run_dist, pr.run_mins, noteTxt()], [SAT_DIST, TAIL, NOTE_KEPT], way + ' parked');
    C.chip('run');
    const e2 = C.entry(1, 'sat') || {};
    const lbl = C.label();
    C.back();
    assert.ok(stampOk(b));
    assert.deepEqual(noClock(e2), noClock(b), way + ' back on Run, ts stripped');
    assert.equal(lbl, COPY.logged);
    stampSat(way);
    openS(1, 'sat'); TZERO(); C.chip('bike');
    const e3 = C.entry(1, 'sat') || {};
    const n3 = noteTxt();
    C.back();
    assert.ok(!('parked' in e3), way + ' nothing parked after the clear');
    assert.equal(n3, NOTE_BARE);
  }
});

// ── the bike form ────────────────────────────────────────────────────────────────────────────────────────────────────
// Hosts: the first bike day with a time dose on bike_base (balanced, intermediate, commercial, seed 24865), and
// HALF_MANNY's first run day. Hand doses: time 45 (Long Ride), reps_time 3 x 15 (Sweet Spot), none (Interval).
const BIKE_BASE = C.build(mkCfg([['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 24865));
const BIKE_HOST = ((): [number, DayKey] | null => {
  for (const w of weeksOf(BIKE_BASE)) {
    for (const d of DAYS) {
      if (sportOf(BIKE_BASE.weeks[w][d]) !== 'bike') continue;
      const z = C.dose(cardioOf(BIKE_BASE.weeks[w][d]));
      if (z && z.k === 'time') return [w, d];
    }
  }
  return null;
})();
const HAND_BIKE: Record<string, { dose: Record<string, unknown> | null; sub: string }> = { time: { dose: { k: 'time', mins: 45 }, sub: 'Long Ride (LSD)' }, reps_time: { dose: { k: 'reps_time', reps: 3, mins: 15 }, sub: 'Sweet Spot' }, none: { dose: null, sub: 'Interval' } };
/** Opens week w day d over `stored` and reads the bike form, its face and what the open wrote. */
function openBike(w: number, d: string, stored: unknown) {
  C.setLog(w, d, stored);
  const before = C.logs();
  C.open(w, d);
  const wb = C.wheel('log_bike_mins');
  const wr = C.wheel('log_run_mins');
  return { fm: C.form(), face: wb ? C.face(wb) : null, runFace: wr ? C.face(wr) : null, inputs: C.inputs(), same: C.logs() === before, hid: C.hidden('log_bike_mins') };
}
/** Every bike form of program p in the weeks listed (every week when none are) on the days `pick` takes, opened over
 * `stored` (the swapped-in case) or nothing. */
function bikeForms(p: Program, pick: (x: any) => boolean, stored: Record<string, string> | null, weeks?: number[]) {
  C.use(p);
  C.unforce();
  const out: (ReturnType<typeof openBike> & { tag: string; k: string; ct: boolean; hasDose: boolean })[] = [];
  for (const w of weeksOf(p).filter((n) => !weeks || weeks.includes(n))) {
    for (const d of DAYS) {
      const x = p.weeks[w][d];
      const c = cardioOf(x);
      if (!c || !pick(x)) continue;
      const dose = stored ? null : C.dose(c);
      const r = openBike(w, d, stored ? Object.assign({}, stored, { swapFrom: sportOf(x) }) : null);
      out.push(Object.assign(r, { tag: 'W' + w + ' ' + d, k: dose ? dose.k + (dose.parsed ? '(parsed)' : '') : 'null', ct: c.subtype === 'Cross-Train', hasDose: !!dose }));
    }
  }
  return out;
}
const SWAPPED_IN = { swapTo: 'bike', bike_mins: '', run_mins: '', run_dist: '', swim_yards: '', rpe: '', notes: '' };
let bikeSample: Record<string, ReturnType<typeof bikeForms>> | null = null;
/** A sample of the bike lattice (the full one is the sweep): weeks 1 and 6 of a bike goal, which reach every dose kind
 * (time, none, and reps_time from W6), weeks 1 and 2 of an injured run and bike pair whose bike days include
 * Cross-Train, and HALF_MANNY's week 1 and 2 run days opened as a swapped-in bike. */
function sampleBikeForms() {
  if (bikeSample) return bikeSample;
  bikeSample = {
    a: bikeForms(C.build(mkCfg([['bike', 'bike_century']], 'balanced', 'advanced', 'commercial', 76308)), (x) => sportOf(x) === 'bike', null, [1, 6]),
    b: bikeForms(C.build(Object.assign(mkCfg([['run', 'run_half'], ['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 76308), { injury: { region: 'knee', tier: 'protect' } })), (x) => sportOf(x) === 'bike', null, [1, 2]),
    c: bikeForms(HALF, (x) => sportOf(x) === 'run', SWAPPED_IN, [1, 2]),
  };
  return bikeSample;
}

test('the bike form is one H:MM:SS wheel for the ride, alone in its row, with no plan on it and no number box', () => {
  for (const k of Object.keys(HAND_BIKE)) {
    for (const e of [{}, { bike_mins: '45' }]) {
      const fm = C.ev('cardioFieldHTML')('bike', e, HAND_BIKE[k].dose, HAND_BIKE[k].sub);
      assert.deepEqual(bikeShape(fm, !!HAND_BIKE[k].dose, e.bike_mins || ''), [], k + ' ' + J(e));
    }
  }
  const S = sampleBikeForms();
  for (const g of ['a', 'b', 'c']) {
    assert.ok(S[g].length > 0, 'sample ' + g + ' has bike forms');
    for (const x of S[g]) assert.deepEqual(bikeShape(x.fm, x.hasDose), [], g + ' ' + x.tag + ' ' + x.k);
  }
  const kinds = new Set(S.a.map((x) => x.k));
  assert.ok(kinds.has('time') && kinds.has('reps_time') && kinds.has('null'), J([...kinds]));
  const ct = S.b.filter((x) => x.ct);
  assert.ok(ct.length > 0 && ct.every((x) => x.k === 'time(parsed)'), 'Cross-Train bike days read a parsed time dose');
  // a live chip to Bike on a HALF_MANNY run day
  C.use(HALF); C.unforce(); C.setLog(RUN_HOST![0], RUN_HOST![1], null); C.open(RUN_HOST![0], RUN_HOST![1]);
  C.chip('bike');
  assert.deepEqual(bikeShape(C.els.cardioFields._html, false), []);
  assert.equal(C.face(C.need('log_bike_mins')), '0:00:00');
  const boxes = (SRC.match(/<input\b[^>]*>/g) || []).filter((t) => /type="number"/.test(t) && /id="log_bike_mins"/.test(t));
  assert.equal(boxes.length, 0, 'no number box for bike minutes in the app');
});

test('the bike form reads Log the ride after the bike glyph, with no sub-label', () => {
  for (const k of Object.keys(HAND_BIKE)) {
    assert.deepEqual(bikeCopyBad(C.ev('cardioFieldHTML')('bike', {}, HAND_BIKE[k].dose, HAND_BIKE[k].sub)), [], k);
  }
  const S = sampleBikeForms();
  for (const g of ['a', 'b', 'c']) for (const x of S[g]) assert.deepEqual(bikeCopyBad(x.fm), [], g + ' ' + x.tag);
  C.use(HALF); C.unforce(); C.setLog(RUN_HOST![0], RUN_HOST![1], null); C.open(RUN_HOST![0], RUN_HOST![1]);
  C.chip('bike');
  assert.deepEqual(bikeCopyBad(C.els.cardioFields._html), []);
  assert.equal((SRC.match(/Bike — actual duration/g) || []).length, 0);
  assert.equal(BIKE_GLYPH.length, 2);
});

test('opening a bike day writes nothing: a blank ride opens on 0:00:00, a stored one on its own face, pegged at 9:59:59', () => {
  assert.ok(BIKE_HOST, 'bike_base has a time-dosed bike day');
  const [W, D] = BIKE_HOST!;
  C.use(BIKE_BASE);
  for (const k of Object.keys(HAND_BIKE)) {
    C.force(HAND_BIKE[k].dose);
    for (const stored of [null, { bike_mins: '', rpe: '', notes: '' }]) {
      const r = openBike(W, D, stored);
      assert.deepEqual([r.face, r.inputs, r.same, r.hid], ['0:00:00', 0, true, ''], k + (stored ? ' stored blank' : ' no entry'));
    }
  }
  C.force(HAND_BIKE.time.dose);
  const LEGACY = [['45', '0:45:00'], ['45.5', '0:45:30'], ['.5', '0:00:30'], ['90', '1:30:00'], [30, '0:30:00'], ['599', '9:59:00'],
    ['599.98', '9:59:59'], ['600', '9:59:59'], ['630.5', '9:59:59'], ['-1', '0:00:00']];
  for (const [v, want] of LEGACY) {
    const r = openBike(W, D, { bike_mins: v, rpe: '5' });
    assert.deepEqual([r.face, r.inputs, r.same], [want, 0, true], J(v));
  }
  C.unforce();
  const S = sampleBikeForms();
  for (const g of ['a', 'b', 'c']) for (const x of S[g]) assert.deepEqual([x.face, x.inputs, x.same], ['0:00:00', 0, true], g + ' ' + x.tag);
});

test('the run time and bike forms seed 650, 600 and 630.5 at 9:59:59, 599 at 9:59:00 and 45.5 at 0:45:30, writing nothing', () => {
  const CLAMP = [['650', '9:59:59'], ['600', '9:59:59'], ['630.5', '9:59:59'], ['599', '9:59:00'], ['45.5', '0:45:30']];
  C.use(BIKE_BASE); C.force(HAND_BIKE.time.dose);
  for (const [v, want] of CLAMP) {
    const r = openBike(BIKE_HOST![0], BIKE_HOST![1], { bike_mins: v, rpe: '5' });
    assert.deepEqual([r.face, r.inputs, r.same], [want, 0, true], 'bike ' + v);
  }
  C.use(HALF); C.force(DOSES.time);
  for (const [v, want] of CLAMP) {
    const r = openBike(RUN_HOST![0], RUN_HOST![1], { run_mins: v, rpe: '5' });
    assert.deepEqual([r.runFace, r.inputs, r.same], [want, 0, true], 'run ' + v);
  }
  C.unforce();
});

test('a rolled ride waits for the Log tap; then Progress and the unmarked nudge read it, and a blank ride gets no nudge', () => {
  const [W, D] = BIKE_HOST!;
  C.use(BIKE_BASE); C.force(HAND_BIKE.time.dose); C.setLog(W, D, null); C.open(W, D);
  C.roll(C.need('log_bike_mins'), [[0, '0']]);
  C.roll(C.need('log_bike_mins'), [[1, '45']]);
  assert.equal(C.entry(W, D), null);
  assert.equal(C.hidden('log_bike_mins'), '45.00');
  assert.equal(C.INPUTS.log_bike_mins, 1, 'hours already on 0: one input event');
  C.tapLogButton();
  assert.equal((C.entry(W, D) || {}).bike_mins, '45.00');
  const ch = C.chart('Weekly Cycling Time', W);
  assert.ok(ch.drawn && ch.v === 45, J(ch));
  C.open(W, D);
  assert.equal(C.nudge(), true);
  C.setLog(W, D, { bike_mins: '', rpe: '5', notes: '' });
  C.open(W, D);
  assert.equal(C.nudge(), false);
  C.unforce();
});

test('settling a bike wheel on the face it opened on writes nothing, stored or blank', () => {
  const [W, D] = BIKE_HOST!;
  C.use(BIKE_BASE); C.force(HAND_BIKE.time.dose);
  C.setLog(W, D, { bike_mins: '45', rpe: '5' });
  const b1 = C.logs();
  C.open(W, D);
  C.roll(C.need('log_bike_mins'), [[1, '45']]);
  C.roll(C.need('log_bike_mins'), [[0, '0']]);
  assert.deepEqual([C.logs() === b1, C.inputs(), C.face(C.need('log_bike_mins'))], [true, 0, '0:45:00']);
  C.setLog(W, D, null);
  C.open(W, D);
  C.roll(C.need('log_bike_mins'), [[0, '0']]);
  assert.deepEqual([C.entry(W, D), C.inputs()], [null, 0]);
  C.unforce();
});

test('a stored ride over the dial opens pegged at 9:59:59, and touching it commits 599.97 then 599.98', () => {
  const [W, D] = BIKE_HOST!;
  C.use(BIKE_BASE); C.force(HAND_BIKE.time.dose);
  C.setLog(W, D, { bike_mins: '630.5', rpe: '5' });
  C.open(W, D);
  assert.equal(C.face(C.need('log_bike_mins')), '9:59:59');
  C.roll(C.need('log_bike_mins'), [[2, '58']]);
  assert.equal((C.entry(W, D) || {}).bike_mins, '599.97');
  C.roll(C.need('log_bike_mins'), [[2, '59']]);
  assert.equal((C.entry(W, D) || {}).bike_mins, '599.98');
  assert.equal(C.hidden('log_bike_mins'), '599.98');
  C.unforce();
});

// ── the Log button ───────────────────────────────────────────────────────────────────────────────────────────────────
// A cardio card is a draft until it holds a session number; the Log tap stores it. Copy: Log, Logged ✓, Run logged ✓,
// Ride logged ✓, Swim logged ✓, Nothing to log yet. An untouched RPE slider stores no RPE.
/** The first day of `sport` in a fresh program from cfg. */
function hostOf(cfg: object, sport: string) {
  const p = C.build(cfg);
  for (let w = 1; w <= (p.totalWeeks || 20); w++) {
    for (const d of DAYS) if (p.weeks[w] && sportOf(p.weeks[w][d]) === sport) return { p, w, d };
  }
  throw new Error('no ' + sport + ' day');
}

test('a rolled time is a draft: nothing stored, no snapshot, the hidden node holds it and the button reads Log', () => {
  fresh(); C.open(1, 'fri');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  assert.equal(C.entry(1, 'fri'), null);
  assert.equal(C.hist(1, 'fri'), false);
  assert.equal(C.hidden('log_run_mins'), TAIL);
  assert.equal(C.face(C.need('log_run_mins')), '0:47:13');
  assert.equal(C.label(), COPY.log);
});

test('the Log tap stores the draft with no RPE, freezes the day, relabels the button and says Run logged', () => {
  fresh(); C.open(1, 'fri');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.clearToast();
  C.log();
  const L = C.entry(1, 'fri') || {};
  assert.deepEqual([L.run_mins, L.run_dist, L.run_pace, L.rpe], [TAIL, '', '', ''], 'the time form has no miles, so no pace');
  assert.equal(C.hist(1, 'fri'), true);
  assert.deepEqual([C.label(), C.logged()], [COPY.logged, '1']);
  assert.equal(C.toast(), COPY.run);
  // the distance form: the planned 3.1 lands at the tap with its pace
  fresh(); C.open(1, 'sat');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  assert.equal(C.entry(1, 'sat'), null);
  C.log();
  const T = C.entry(1, 'sat') || {};
  assert.deepEqual([T.run_mins, T.run_dist, T.run_pace, T.rpe], [TAIL, SAT_DIST, SAT_PACE, '']);
});

test('after Log a roll saves quietly and the button stays Logged; rolled to zero it stores nothing and reads Log', () => {
  fresh(); C.open(1, 'fri');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.log();
  assert.equal((C.entry(1, 'fri') || {}).run_mins, TAIL);
  C.clearToast();
  C.roll(C.need('log_run_mins'), [[1, '50'], [2, '0']]);
  assert.deepEqual([(C.entry(1, 'fri') || {}).run_mins, C.toast(), C.label()], ['50.00', '', COPY.logged]);
  C.roll(C.need('log_run_mins'), [[1, '0']]);
  assert.deepEqual([(C.entry(1, 'fri') || {}).run_mins, C.label(), C.logged()], ['', COPY.log, '0']);
});

test('Log on an untouched card writes nothing and says Nothing to log yet', () => {
  fresh(); C.open(1, 'fri');
  C.clearToast();
  C.log();
  assert.deepEqual([C.entry(1, 'fri'), C.hist(1, 'fri'), C.toast()], [null, false, COPY.empty]);
});

test('an RPE or a note on a draft is saved, the rolled time is not', () => {
  fresh(); C.open(1, 'fri');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.rpe('7');
  let e = C.entry(1, 'fri') || {};
  assert.deepEqual([e.rpe, e.run_mins], ['7', '']);
  C.note('felt easy');
  e = C.entry(1, 'fri') || {};
  assert.deepEqual([e.rpe, e.run_mins, e.notes], ['7', '', 'felt easy']);
});

test('Done and Skip commit a rolled draft, inside the wheel\'s settle window or after it; the undo tap commits nothing', () => {
  for (const [s, want] of [['complete', 'complete'], ['skipped', 'skipped']]) {
    for (const ms of [20, 200]) {
      fresh(); C.open(1, 'fri');
      C.rollAt(C.need('log_run_mins'), [[1, '47'], [2, '13']], ms);
      assert.equal(C.entry(1, 'fri'), null, s + ' at ' + ms + ' ms: nothing before the tap');
      C.tap('fri', s);
      assert.deepEqual([(C.entry(1, 'fri') || {}).run_mins, C.status(1, 'fri')], [TAIL, want], s + ' at ' + ms + ' ms');
    }
  }
  fresh(); C.open(1, 'fri');
  C.tap('fri', 'complete');
  const blank = C.entry(1, 'fri') || {};
  assert.deepEqual([blank.run_mins, blank.rpe], ['', ''], 'Done untouched stores blanks');
  C.open(1, 'fri');
  assert.deepEqual([C.label(), C.logged()], [COPY.log, '0']);
  C.roll(C.need('log_run_mins'), [[1, '30']]);
  assert.equal((C.entry(1, 'fri') || {}).run_mins, '');
  C.tap('fri', 'complete'); // the same status again: undo
  const e = C.entry(1, 'fri') || {};
  assert.deepEqual([C.status(1, 'fri'), e.run_mins, C.hidden('log_run_mins')], [null, '', '30.00']);
});

test('a stored run opens as Logged and writes nothing', () => {
  fresh(); C.setLog(1, 'fri', { rpe: '7', run_mins: TAIL, run_dist: '', notes: '' });
  const before = C.logs();
  C.open(1, 'fri');
  assert.deepEqual([C.label(), C.logged(), C.face(C.need('log_run_mins'))], [COPY.logged, '1', '0:47:13']);
  assert.deepEqual([C.inputs(), C.logs() === before, C.hist(1, 'fri')], [0, true, false]);
});

test('a ride waits for the Log tap, which stores 45.00, says Ride logged and reaches Progress', () => {
  const B = hostOf(mkCfg([['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 24865), 'bike');
  C.use(B.p); C.unforce(); C.open(B.w, B.d);
  assert.equal(C.label(), COPY.log);
  C.roll(C.need('log_bike_mins'), [[1, '45']]);
  assert.deepEqual([C.entry(B.w, B.d), C.hidden('log_bike_mins')], [null, '45.00']);
  C.clearToast();
  C.log();
  assert.deepEqual([(C.entry(B.w, B.d) || {}).bike_mins, C.toast(), C.label()], ['45.00', COPY.bike, COPY.logged]);
  const ch = C.chart('Weekly Cycling Time', B.w);
  assert.ok(ch.drawn && +ch.v === 45, J(ch));
});

test('typed swim yards wait for the Log tap, which stores them and says Swim logged', () => {
  const W = hostOf(mkCfg([['swim', 'swim_base']], 'balanced', 'intermediate', 'commercial', 24865), 'swim');
  C.use(W.p); C.unforce(); C.open(W.w, W.d);
  const before = C.logs();
  for (const v of ['1', '15', '150', '1500']) C.type('log_swim_yards', v);
  assert.deepEqual([C.entry(W.w, W.d), C.logs() === before], [null, true]);
  C.clearToast();
  C.log();
  assert.deepEqual([(C.entry(W.w, W.d) || {}).swim_yards, C.toast(), C.label()], ['1500', COPY.swim, COPY.logged]);
});

test('a rep stepper step waits for the Log tap, which stores the reps and the miles they make', () => {
  // 7 x 400 m = 2800 m / 1609.344 = 1.7398 -> "1.74"; 7 x 3 min has no distance to derive
  const REPS_TIME = { k: 'reps_time', reps: 6, mins: 3, tgt: 480 };
  for (const [D, dist] of [[REPS_DIST, '1.74'], [REPS_TIME, '']] as const) {
    fresh(); C.force(D); C.open(1, 'fri');
    C.ev('doseRep(1)'); C.advance(50);
    assert.deepEqual([String(C.els.log_run_reps.value), C.entry(1, 'fri')], ['7', null], D.k);
    C.clearToast();
    C.log();
    const e = C.entry(1, 'fri') || {};
    assert.deepEqual([String(e.run_reps), e.run_dist, C.toast()], ['7', dist, COPY.run], D.k);
  }
  C.unforce();
});

test('the sport chip does not park a draft, and parks and returns a logged run', () => {
  fresh(); C.open(1, 'sat');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.chip('bike');
  const a = C.entry(1, 'sat') || {};
  assert.deepEqual([a.swapTo, !!a.parked, a.run_mins], ['bike', false, '']);
  C.chip('run');
  assert.equal(C.face(C.need('log_run_mins')), '0:00:00');
  fresh(); C.open(1, 'sat');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.log();
  const L = C.entry(1, 'sat') || {};
  assert.deepEqual([L.run_mins, L.run_dist, L.run_pace], [TAIL, SAT_DIST, SAT_PACE]);
  C.chip('bike');
  const b = C.entry(1, 'sat') || {};
  assert.deepEqual([b.parked && b.parked.run && b.parked.run.run_mins, C.label()], [TAIL, COPY.log]);
  C.chip('run');
  const r = C.entry(1, 'sat') || {};
  assert.deepEqual([r.run_mins, !!r.parked, C.label()], [TAIL, false, COPY.logged]);
});

test('a lifting day has no Log button and its RPE saves on the move', () => {
  // HALF_MANNY's lift-only day: Thursday since D243 (v0.243.0), Tuesday before.
  fresh(); C.open(1, 'thu');
  const body = C.els.detailBody.innerHTML;
  assert.ok(body.length > 0);
  assert.doesNotMatch(body, /id="cardioLogBtn"/);
  assert.doesNotMatch(body, /id="cardioSwapWrap"/);
  C.rpe('7');
  assert.equal((C.entry(1, 'thu') || {}).rpe, '7');
});

test('the Log button copy is exact in the source, with a real check mark, no dash and no brand', () => {
  const body = (name: string) => { const i = SRC.indexOf(name); if (i < 0) return ''; const j = SRC.indexOf('\n}', i); return SRC.slice(i, j < 0 ? i + 600 : j + 2); };
  const lab = body('function cardioLogLabel(');
  const lc = body('function logCardio(');
  assert.ok(lab.includes("'" + COPY.logged + "'") && lab.includes("'" + COPY.log + "'"), lab.slice(0, 200));
  const fn = C.ev('cardioLogLabel');
  assert.deepEqual([fn(true), fn(false)], [COPY.logged, COPY.log]);
  const toastDecl = (SRC.match(/var CARDIO_LOGGED_TOAST=\{[^}]*\};/) || [''])[0];
  assert.equal(toastDecl, "var CARDIO_LOGGED_TOAST={run:'" + COPY.run + "',bike:'" + COPY.bike + "',swim:'" + COPY.swim + "'};");
  assert.ok(lc.includes("showToast('" + COPY.empty + "')"), 'logCardio says Nothing to log yet.');
  for (const s of [COPY.log, COPY.logged, COPY.run, COPY.bike, COPY.swim, COPY.empty]) {
    assert.doesNotMatch(s, /[-—]/, s);
    assert.doesNotMatch(s, /nike/i, s);
  }
  assert.ok(!/\\u2713/.test(lab + toastDecl), 'the check mark is the character, not an escape');
  for (const s of ['Did a different activity?', 'Logged as', NUDGE, "'Unmarked'", 'Move slider']) assert.ok(SRC.includes(s), s);
});

test('an untouched RPE slider stores no RPE; a moved one stores its value; a stored one is carried', () => {
  fresh(); C.open(1, 'fri');
  C.note('easy');
  let e = C.entry(1, 'fri') || {};
  assert.deepEqual([e.rpe, e.notes], ['', 'easy']);
  C.rpe('7');
  e = C.entry(1, 'fri') || {};
  assert.deepEqual([e.rpe, C.els.log_rpe.dataset.touched], ['7', '1']);
  C.open(1, 'fri');
  const touched = C.els.log_rpe.dataset.touched;
  C.note('easy, legs fine');
  e = C.entry(1, 'fri') || {};
  assert.deepEqual([touched, e.rpe, e.notes], [undefined, '7', 'easy, legs fine']);
  fresh(); C.open(1, 'fri');
  C.tap('fri', 'complete');
  assert.deepEqual([(C.entry(1, 'fri') || {}).rpe, C.status(1, 'fri')], ['', 'complete']);
});

test('a blank RPE counts for nothing: the RPE chart, the journal, a swap-only day and the rest sheet all skip it', () => {
  // W1 of the Session Journal: the day names and the text
  const week1 = () => {
    const h = String(C.els.progressBody.innerHTML || '');
    const i = h.indexOf('Session Journal');
    const blocks = i < 0 ? [] : h.slice(i).match(/<details class="journal-week"[^>]*>[\s\S]*?<\/details>/g) || [];
    const b = blocks.find((x) => x.includes('<span>Week 1</span>')) || '';
    return { found: i >= 0, days: (b.match(/color:var\(--text\)">(Sun|Mon|Tue|Wed|Thu|Fri|Sat)<\/div>/g) || []).map((s) => s.slice(-9, -6)), text: b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
  };
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); C.open(1, 'sat'); C.rpe('7');
  const ch = C.chart('Average Session RPE', 1);
  const j1 = week1();
  assert.ok(ch.drawn && +ch.v === 7, 'the untouched Friday adds nothing to the mean ' + J(ch));
  assert.deepEqual(j1.days, ['Sat']);
  assert.ok(j1.text.includes('RPE 7 — Very Hard'), j1.text);
  fresh(); C.open(1, 'sat'); C.chip('bike'); C.ev('renderProgressScreen()');
  const j2 = week1();
  assert.ok(j2.found);
  assert.deepEqual(j2.days, ['Sat']);
  assert.ok(j2.text.includes('Swapped Run → Bike') && !/RPE \d/.test(j2.text), j2.text);
  fresh(); C.open(1, 'fri');
  C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  C.log();
  assert.deepEqual(Array.from(C.ev('restMoveCandidates(1)')).map((c: any) => c.day), ['mon', 'tue', 'thu', 'sat'], 'a logged Friday is not offered');
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete');
  assert.ok(!Array.from(C.ev('restMoveCandidates(1)')).map((c: any) => c.day).includes('fri'), 'nor a completed one');
});

// ── a jog logged on a rest day ───────────────────────────────────────────────────────────────────────────────────────
// The rest sheet's Log it stores the jog as its own record on the day (restLog[type] = {mins, dist when typed, rpe}),
// and a session moved onto the day ("Training anyway?") starts empty. Readers that sum add the jog, readers that pair a
// plan with a log ignore it, and readers that take a maximum take it as one candidate.
// Hand values: the jog 37 min / 3.7 mi / RPE 7; sessions 5.20 mi, 0:45:00, 1500 yd; sums 3.7 + 5.2 = 8.9, 37 + 45 = 82,
// 1370 + 1500 = 2870; means (7 + 6) / 2 = 6.5 and (8 + 7) / 2 = 7.5; maxima max(5.2, 3.7) = 5.2, max(2.0, 3.7) = 3.7.
// The second config is run_10k + bike_base + swim_base (seed 76308); its bike and swim cells are the first week holding
// a rest day and that sport's day. Every goal of these configs carries the run baseline fields, as the wizard's
// multi-sport form writes them.
const RUN_FIELDS = { mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' };
const restCfg = (sports: SportSpec[], f: string, ex: string, eq: string, rd: string[], sd: number) => mkCfg(sports.map((s): SportSpec => [s[0], s[1], Object.assign({}, RUN_FIELDS, s[2] || {})]), f, ex, eq, sd, rd);
const MULTI_CFG = restCfg([['run', 'run_10k'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308);
const MULTI = C.build(MULTI_CFG);
const cellOf = (sport: string): { w: number; rest: DayKey; day: DayKey } | null => {
  for (const w of weeksOf(MULTI)) {
    const rest = DAYS.find((d) => MULTI.weeks[w][d] && MULTI.weeks[w][d].rest);
    const day = DAYS.find((d) => sportOf(MULTI.weeks[w][d]) === sport);
    if (rest && day) return { w, rest, day };
  }
  return null;
};
const BIKE_CELL = cellOf('bike');
const SWIM_CELL = cellOf('swim');
const JOG: Record<string, Jog> = {
  run: { type: 'run', mins: 37, dist: '3.7', rpe: 7 },
  runNoDist: { type: 'run', mins: 37, dist: '', rpe: 7 },
  walk: { type: 'walk', mins: 37, dist: '', rpe: 7 },
  walkStale: { type: 'walk', mins: 37, dist: '2', rpe: 7, stale: true }, // 2 typed under Run, then the Walk chip
  bike: { type: 'bike', mins: 37, dist: '', rpe: 7 },
  bikeDist: { type: 'bike', mins: 37, dist: '9.5', rpe: 7 },
  row: { type: 'row', mins: 37, dist: '', rpe: 7 },
  rowDist: { type: 'row', mins: 37, dist: '9.5', rpe: 7 },
  swim: { type: 'swim', mins: 37, dist: '1370', rpe: 7 },
};
const RL: Record<string, Record<string, Record<string, number>>> = {
  run: { run: { mins: 37, dist: 3.7, rpe: 7 } },
  runNoDist: { run: { mins: 37, rpe: 7 } },
  walk: { walk: { mins: 37, rpe: 7 } },
  walkStale: { walk: { mins: 37, rpe: 7 } },
  bike: { bike: { mins: 37, rpe: 7 } },
  bikeDist: { bike: { mins: 37, dist: 9.5, rpe: 7 } },
  row: { row: { mins: 37, rpe: 7 } },
  rowDist: { row: { mins: 37, dist: 9.5, rpe: 7 } },
  swim: { swim: { mins: 37, dist: 1370, rpe: 7 } },
};
const TOP_ABSENT = ['rpe', 'run_dist', 'bike_mins', 'swim_yards', 'rest_cardio', 'rest_type', 'rest_mins'];
const SESS: Record<string, Roll[]> = { dist: [[0, '5'], [1, '2'], [2, '0']], dist2: [[0, '2'], [1, '0'], [2, '0']], bike45: [[0, '0'], [1, '45'], [2, '0']] };
// the hero sentence; from v0.240.0 (D229) the distance follows logged when the record holds one
const LINE = (mins: number, word: string, rpe: number | string, dist?: string) => mins + ' min ' + word + ' logged' + (dist ? ' · ' + dist : '') + ' · RPE ' + rpe;
const JOG_LINE_RE = /^(\d+ min (run|ride|swim|row|walk) logged( · [\d.]+ (mi|yd|m))?|[\d.]+ (mi|yd|m) (run|ride|swim|row) logged) · RPE (\d+|—)$/;
const LABEL_WORDS = ['Very Easy', 'Easy', 'Moderate', 'Somewhat Hard', 'Hard', 'Hard+', 'Very Hard', 'Very Hard+', 'Max Effort', 'All Out'];
const near = (a: unknown, b: number) => typeof a === 'number' && Number.isFinite(a) && Math.abs(a - b) < 1e-9;
const canon = (v: any): any => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = canon(v[k]); return o; }, {} as Record<string, any>) : v);
const CJ = (v: unknown) => J(canon(v));

/** The rest sheet's Log it, filled as the athlete fills it. */
function sheetJog(w: number, d: string, j: Jog) {
  C.ev('_restDraft.w=null; _restDraft.day=null;');
  C.ev('openRestSheet(' + w + ",'" + d + "','cardio')");
  const dr = C.ev('({w:_restDraft.w, day:_restDraft.day})');
  if (dr.w !== w || dr.day !== d) throw new Error('openRestSheet(' + w + ',' + d + ') refused');
  if (j.stale) { C.ev("_rdSet('type','run')"); C.ev('_restDraft.dist=' + J(j.dist) + ';'); C.ev("_rdSet('type'," + J(j.type) + ')'); } else { C.ev("_rdSet('type'," + J(j.type) + ')'); C.ev('_restDraft.dist=' + J(j.dist) + ';'); }
  C.ev('_restDraft.mins=' + j.mins + ';');
  C.ev("_rdSet('rpe'," + j.rpe + ')');
  C.ev('applyRestCardio()');
  C.advance(50);
}
/** "Training anyway?": the move sheet, the pick, Move it here. Whether the pick was offered and landed. */
function sheetMove(w: number, d: string, pick: string) {
  const offered = Array.from(C.ev('restMoveCandidates(' + w + ')') || []).map((c: any) => c.day).includes(pick);
  C.ev('_restDraft.w=null; _restDraft.day=null;');
  C.ev('openRestSheet(' + w + ",'" + d + "','move')");
  C.ev("_rdSet('pick','" + pick + "')");
  C.ev('applyRestMove()');
  C.advance(50);
  return { offered, moved: C.ev('(activeProg.weeks[' + w + ']["' + d + '"]||{}).movedFrom') === pick };
}
/** A fresh store, the clock on the rest day, the jog, then the move and the moved-in form open when `pick` is given. */
function drive(prog: Program, w: number, rest: DayKey, j: Jog, pick: string | null) {
  C.use(prog);
  C.setNow(C.at(w, rest));
  sheetJog(w, rest, j);
  const mv = pick ? sheetMove(w, rest, pick) : { offered: true, moved: true };
  if (pick) C.open(w, rest);
  return mv;
}
const restLogOf = (w: number, d: string) => (C.entry(w, d) || {}).restLog;
const milesTile = (w: number) => {
  C.ev('currentWeek=' + w + '; renderWeekView()');
  const m = /color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(C.els.daysList.innerHTML || '');
  return m ? m[1] : null;
};
const progress = () => { C.ctx.__dots.length = 0; C.ev('progressViewId=null; renderProgressScreen()'); return C.els.progressBody.innerHTML || ''; };
const chartVal = (title: string, w: number) => {
  for (const a of C.ctx.__dots) {
    if (String(a[0]).indexOf(title) < 0) continue;
    return { drawn: true, v: Array.from(a[2])[Array.from(a[1]).indexOf(w)] };
  }
  return { drawn: false, v: undefined };
};
const ladder = (w: number) => (C.ev('ladderWeekly(getLogs(), activeProg.totalWeeks||99, null, false)') || {})[w];
/** The Session Journal: week -> rows [{day, segs}], the text segments between tags. */
function journal(html: string) {
  const out: Record<number, JournalRow[]> = {};
  for (let p of html.split('<details class="journal-week"').slice(1)) {
    p = p.slice(0, p.indexOf('</details>') < 0 ? p.length : p.indexOf('</details>'));
    const wm = p.match(/<span>Week (\d+)<\/span>/);
    if (!wm) continue;
    out[+wm[1]] = p.split('<div style="background:var(--surface2);border-radius:4px;padding:10px 12px;margin-bottom:6px">').slice(1)
      .map((r) => { const segs = r.split(/<[^>]*>/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean); return { day: segs[0], segs }; });
  }
  return out;
}
const rowOf = (jr: Record<number, JournalRow[]>, w: number, day: string) => (jr[w] || []).find((r) => r.day === day) || null;
const jogLinesOf = (r: JournalRow | null) => (r ? r.segs.filter((s) => JOG_LINE_RE.test(s)) : []);
const labelHits = (r: JournalRow | null) => (r ? LABEL_WORDS.filter((L) => r.segs.some((s) => s.indexOf(L) >= 0)) : []);
const headOf = (r: JournalRow | null) => (r ? r.segs.filter((s) => /^RPE \d+ — /.test(s)) : []);
/** The rest hero on the week view: its logged lines and its button. */
function heroOf(w: number, d: string) {
  C.ev('currentWeek=' + w + '; renderWeekView()');
  const h = C.els.daysList.innerHTML || '';
  const lines = [...h.matchAll(/<div class="wk-rest-logged">([^<]*)<\/div>/g)].map((m) => m[1]);
  const b = h.match(new RegExp('openRestSheet\\(' + w + ",'" + d + "','cardio'\\)\">([^<]*)</button>"));
  return { lines, btn: b ? b[1] : null, rest: h.includes('REST DAY') };
}

test('the hosts are as typed: HALF_MANNY W1 has a rest Wednesday, a lifting Thursday (D243) and the three run doses; the multi-sport cells exist', () => {
  const W = HALF.weeks[1];
  assert.ok(W.wed.rest && !cardioOf(W.thu) && !W.thu.rest);
  assert.match(subOf(HALF, 1, 'mon'), /Speed Run/);
  assert.ok(!cardioOf(W.mon).dose);
  assert.match(subOf(HALF, 1, 'fri'), /Recovery Run/);
  assert.equal(cardioOf(W.fri).dose.k, 'time');
  assert.match(subOf(HALF, 1, 'sat'), /Long Run/);
  assert.deepEqual([cardioOf(W.sat).dose.k, +cardioOf(W.sat).dose.mi], ['dist', 3.1]);
  assert.ok(BIKE_CELL && SWIM_CELL, J([BIKE_CELL, SWIM_CELL]));
});

test('a rest-day jog stores exactly its own record: restLog with minutes, distance when typed and RPE, the week and a time', () => {
  const CELLS: [string, Program, number, DayKey][] = [['run', HALF, 1, 'wed'], ['runNoDist', HALF, 1, 'wed'], ['walk', HALF, 1, 'wed'], ['walkStale', HALF, 1, 'wed'],
    ['bike', MULTI, BIKE_CELL!.w, BIKE_CELL!.rest], ['bikeDist', MULTI, BIKE_CELL!.w, BIKE_CELL!.rest], ['row', MULTI, BIKE_CELL!.w, BIKE_CELL!.rest],
    ['rowDist', MULTI, BIKE_CELL!.w, BIKE_CELL!.rest], ['swim', MULTI, SWIM_CELL!.w, SWIM_CELL!.rest]];
  for (const [nm, prog, w, d] of CELLS) {
    drive(prog, w, d, JOG[nm], null);
    const e = C.entry(w, d) || {};
    assert.equal(CJ(e.restLog), CJ(RL[nm]), nm);
    assert.deepEqual(Object.keys(e).sort(), ['restLog', 'ts', 'week'], nm);
    assert.ok(typeof e.ts === 'number' && e.ts > 0, nm + ' ts');
    assert.equal(e.week, w, nm);
    assert.deepEqual(TOP_ABSENT.filter((k) => k in e), [], nm + ' no flat keys');
  }
});

test('a session moved onto a jog day leaves the jog whole through Done, an RPE, and a logged value', () => {
  const want = CJ(RL.run);
  for (const pick of ['tue', 'sat', 'mon']) {
    for (const step of ['done', 'rpe8', 'value']) {
      const mv = drive(HALF, 1, 'wed', JOG.run, pick);
      const tag = pick + ' ' + step;
      assert.deepEqual([mv.offered, mv.moved], [true, true], tag);
      if (step === 'done') {
        C.tap('wed', 'complete');
        assert.equal(C.status(1, 'wed'), 'complete', tag);
        assert.ok('swapTo' in (C.entry(1, 'wed') || {}), tag + ' the entry was rebuilt');
      } else if (step === 'rpe8') {
        C.rpe('8');
        assert.equal((C.entry(1, 'wed') || {}).rpe, '8', tag);
        C.back();
      } else if (pick === 'tue') {
        C.ev("writeSetDraft('front_squat',['5'],['135'],'')"); C.advance(50);
        C.tap('wed', 'complete');
        const e = C.entry(1, 'wed') || {};
        assert.ok(e.sets && e.sets.front_squat && 'swapTo' in e, tag);
      } else {
        C.roll(C.need('log_run_dist'), SESS.dist);
        C.log();
        assert.equal((C.entry(1, 'wed') || {}).run_dist, '5.20', tag);
        C.back();
      }
      assert.equal(CJ(restLogOf(1, 'wed')), want, tag + ': the jog is whole');
    }
  }
});

test('a session moved onto a jog day opens empty: every node blank, Log, no nudge, the slider unmoved; Done stores blanks', () => {
  const FORMS: [string, Program, number, DayKey, string, Jog][] = [['dist', HALF, 1, 'wed', 'sat', JOG.run], ['generic', HALF, 1, 'wed', 'mon', JOG.run], ['time', HALF, 1, 'wed', 'fri', JOG.run],
    ['bike', MULTI, BIKE_CELL!.w, BIKE_CELL!.rest, BIKE_CELL!.day, JOG.bike], ['swim', MULTI, SWIM_CELL!.w, SWIM_CELL!.rest, SWIM_CELL!.day, JOG.swim]];
  for (const [nm, prog, w, rest, pick, j] of FORMS) {
    const mv = drive(prog, w, rest, j, pick);
    assert.deepEqual([mv.offered, mv.moved], [true, true], nm);
    const html = C.els.detailBody.innerHTML || '';
    const ids = [...new Set<string>((html.match(/\sid="log_(?:run|bike|swim)_[a-z_]+"/g) || []).map((s: string) => s.slice(5, -1)))];
    assert.ok(ids.length > 0, nm + ' has cardio nodes');
    assert.deepEqual(ids.filter((k) => (C.els[k] || {}).value !== ''), [], nm + ' nothing seeded');
    assert.deepEqual([C.logged(), C.label(), html.includes(NUDGE)], ['0', COPY.log, false], nm);
    assert.equal((html.match(/id="rpeDisplay"[^>]*>([^<]*)</) || [])[1], COPY.slider, nm);
    assert.notEqual(((C.els.log_rpe || {}).dataset || {}).touched, '1', nm);
    C.tap(rest, 'complete');
    const e = C.entry(w, rest) || {};
    assert.equal(e.rpe, '', nm);
    assert.deepEqual(SEVEN.filter((k) => e[k] !== ''), [], nm + ' the seven blank');
  }
});

test('the week MILES tile adds the jog: 3.7 + 5.2 moved in = 8.9, 3.7 under a lift, 3.7 under a ride', () => {
  let mv = drive(HALF, 1, 'wed', JOG.run, 'mon');
  C.roll(C.need('log_run_dist'), SESS.dist); C.log(); C.back();
  assert.ok(mv.offered && mv.moved);
  assert.equal((C.entry(1, 'wed') || {}).run_dist, '5.20');
  assert.equal(milesTile(1), '8.9');
  mv = drive(HALF, 1, 'wed', JOG.run, 'tue');
  C.tap('wed', 'complete');
  assert.ok(mv.offered && mv.moved && C.status(1, 'wed') === 'complete');
  assert.equal(milesTile(1), '3.7');
  mv = drive(MULTI, BIKE_CELL!.w, BIKE_CELL!.rest, JOG.run, BIKE_CELL!.day);
  C.roll(C.need('log_bike_mins'), SESS.bike45); C.log(); C.back();
  assert.ok(mv.offered && mv.moved);
  assert.equal(+(C.entry(BIKE_CELL!.w, BIKE_CELL!.rest) || {}).bike_mins, 45);
  assert.equal(milesTile(BIKE_CELL!.w), '3.7');
});

test('Progress sums the jog with the session, the plan drift ignores it, and the maxima take it as one candidate', () => {
  // run total and drift: WED jog, SAT moved in, 5.20 Log
  let mv = drive(HALF, 1, 'wed', JOG.run, 'sat');
  C.roll(C.need('log_run_dist'), SESS.dist); C.log(); C.back();
  assert.ok(mv.offered && mv.moved);
  progress();
  let c = chartVal('Weekly Running Mileage', 1);
  assert.ok(c.drawn && near(c.v, 8.9), 'run 3.7 + 5.2 ' + J(c));
  const pv = (C.ev('plannedVsLogged(getLogs(), getDayHist(), activeProg.totalWeeks||99, null, false)') || {})[1];
  assert.ok(pv && near(pv.presc, 3.1) && near(pv.act, 5.2), 'drift ' + J(pv && { presc: pv.presc, act: pv.act }));
  assert.ok(near(ladder(1), 5.2), 'ladder max(5.2, 3.7) ' + ladder(1));
  // bike total
  mv = drive(MULTI, BIKE_CELL!.w, BIKE_CELL!.rest, JOG.bike, BIKE_CELL!.day);
  C.roll(C.need('log_bike_mins'), SESS.bike45); C.log(); C.back();
  progress();
  c = chartVal('Weekly Cycling Time', BIKE_CELL!.w);
  assert.ok(mv.offered && mv.moved && c.drawn && near(c.v, 82), 'bike 37 + 45 ' + J(c));
  // swim total
  mv = drive(MULTI, SWIM_CELL!.w, SWIM_CELL!.rest, JOG.swim, SWIM_CELL!.day);
  C.type('log_swim_yards', '1500'); C.log(); C.back();
  assert.equal((C.entry(SWIM_CELL!.w, SWIM_CELL!.rest) || {}).swim_yards, '1500');
  progress();
  c = chartVal('Weekly Swimming Volume', SWIM_CELL!.w);
  assert.ok(mv.offered && mv.moved && c.drawn && near(c.v, 2870), 'swim 1370 + 1500 ' + J(c));
  // average RPE over two efforts
  drive(HALF, 1, 'wed', JOG.run, null); C.open(1, 'mon'); C.rpe('6'); C.back();
  progress();
  c = chartVal('Average Session RPE', 1);
  assert.ok(c.drawn && near(c.v, 6.5), 'jog 7 and Monday 6 ' + J(c));
  mv = drive(HALF, 1, 'wed', JOG.run, 'tue'); C.rpe('8'); C.back();
  progress();
  c = chartVal('Average Session RPE', 1);
  assert.ok(mv.offered && mv.moved && c.drawn && near(c.v, 7.5), 'jog 7 and the moved-in 8 ' + J(c));
  // maxDist: three pace-only recovery runs, then the jog; then a 5.2 session on the jog's day
  const REC: [number, DayKey][] = [];
  for (const w of weeksOf(HALF)) for (const d of DAYS) if (REC.length < 3 && !(w === 1 && d === 'wed') && /recovery/i.test(subOf(HALF, w, d)) && sportOf(HALF.weeks[w][d]) === 'run') REC.push([w, d]);
  C.use(HALF); C.setNow(C.at(1, 'wed'));
  REC.forEach(([w, d], i) => {
    C.ev('currentWeek=' + w + '; snapshotDay(' + w + ",'" + d + "'); currentWeek=1;");
    C.setLog(w, d, { rpe: '', run_dist: '', run_pace: '10:30/mi', run_mins: '25', run_reps: '', run_rep_time: '', bike_mins: '', swim_yards: '', notes: '', swapFrom: '', swapTo: '', week: w, ts: C.at(1, 'wed') - (i + 1) * 3600000 });
  });
  sheetJog(1, 'wed', JOG.run);
  let sd = C.ev('seedFromPriorPrograms(' + C.now() + ')');
  assert.equal(REC.length, 3);
  assert.ok(sd && sd.n === 3 && near(sd.maxDist, 3.7), 'maxDist from the jog ' + J(sd && { n: sd.n, maxDist: sd.maxDist }));
  mv = sheetMove(1, 'wed', 'sat'); C.open(1, 'wed');
  C.roll(C.need('log_run_dist'), SESS.dist); C.log(); C.back();
  sd = C.ev('seedFromPriorPrograms(' + C.now() + ')');
  assert.ok(mv.offered && mv.moved && sd && near(sd.maxDist, 5.2), 'maxDist max(5.2, 3.7), never 8.9 ' + J(sd && sd.maxDist));
  // ladder: Monday 2.00 plus the jog; a lift moved onto the jog's day
  drive(HALF, 1, 'wed', JOG.run, null); C.open(1, 'mon');
  C.roll(C.need('log_run_dist'), SESS.dist2); C.log(); C.back();
  assert.equal((C.entry(1, 'mon') || {}).run_dist, '2.00');
  assert.ok(near(ladder(1), 3.7), 'ladder max(2.0, 3.7) ' + ladder(1));
  mv = drive(HALF, 1, 'wed', JOG.run, 'tue'); C.tap('wed', 'complete');
  assert.ok(mv.offered && mv.moved && near(ladder(1), 3.7), 'ladder under a lift ' + ladder(1));
});

test('the journal prints a jog as the hero sentence with its distance, never an RPE label; an old cross-type jog prints its minutes and its distance; rows sort by time', () => {
  const runLine = LINE(37, 'run', 7, '3.7 mi');
  let mv = drive(HALF, 1, 'wed', JOG.run, 'tue');
  C.tap('wed', 'complete');
  let r = rowOf(journal(progress()), 1, 'Wed');
  assert.ok(mv.offered && mv.moved && r, 'a Wed row');
  assert.deepEqual([jogLinesOf(r), headOf(r), labelHits(r)], [[runLine], [], []], J(r.segs));
  // a stored jog in the older flat shape: bike holds the minutes, run only its distance
  C.use(HALF); C.setNow(C.at(1, 'wed'));
  C.setLog(1, 'wed', { rest_cardio: true, rest_type: 'bike', rest_mins: 20, rpe: 5, run_dist: 3.7, bike_mins: 20 });
  r = rowOf(journal(progress()), 1, 'Wed');
  assert.ok(r);
  // v0.240.0 (D229, D224-journal restated): the run's distance alone now prints its own line, after the ride's (the lens's key order)
  assert.deepEqual([jogLinesOf(r), headOf(r), labelHits(r)], [[LINE(20, 'ride', 5), '3.7 mi run logged · RPE —'], [], []], J(r.segs));
  // a walk-only program
  drive(HALF, 1, 'wed', JOG.walk, null);
  const ph = progress();
  const jr = journal(ph);
  r = rowOf(jr, 1, 'Wed');
  assert.ok(!ph.includes('No data yet'), 'Progress renders');
  assert.equal(Object.values(jr).reduce((a, x) => a + x.length, 0), 1);
  assert.deepEqual([jogLinesOf(r), headOf(r)], [[LINE(37, 'walk', 7)], []]);
  // logging order within W1: Friday, then Monday, then the Wednesday jog, an hour apart
  C.use(HALF); C.setNow(C.at(1, 'sun', 9));
  C.open(1, 'fri'); C.rpe('6'); C.back(); C.setNow(C.at(1, 'sun', 10));
  C.open(1, 'mon'); C.rpe('6'); C.back(); C.setNow(C.at(1, 'sun', 11));
  sheetJog(1, 'wed', JOG.run);
  assert.deepEqual((journal(progress())[1] || []).map((x) => x.day), ['Fri', 'Mon', 'Wed']);
});

test('a day swapped away from its sport is never offered to the rest sheet; swapped back it is offered only if nothing was logged', () => {
  // seven configs (seed 76308), each W1 run, bike or swim day; the arriving sport is the first of bike, run, swim not planned
  const SRC_CFGS: [string, object][] = [['HALF_MANNY', fixtures.HALF_MANNY], ['run10k+bike+swim', MULTI_CFG],
    ['run_pace', restCfg([['run', 'run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '30' }]], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
    ['run_base', restCfg([['run', 'run_base']], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
    ['swim_base', restCfg([['swim', 'swim_base']], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
    ['bike_ftp', restCfg([['bike', 'bike_ftp']], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
    ['run_5k', restCfg([['run', 'run_5k']], 'strength', 'advanced', 'commercial', ['sat', 'sun'], 76308)]];
  const PRIMARY = ['log_run_dist', 'log_bike_mins', 'log_swim_yards', 'log_run_rep_time', 'log_run_mins'];
  const offeredOn = (w: number, d: string) => Array.from(C.ev('restMoveCandidates(' + w + ')') || []).map((c: any) => c.day).includes(d);
  const held = (e: any) => SEVEN.filter((k) => e[k]);
  let formHtml = '';
  // one session value on the form as it stands: a wheel's column 0 rolled to its first positive row other than the
  // one it shows, or the yards box typed 1500
  const sessionValue = () => {
    for (const k of PRIMARY) {
      if (!formHtml.includes('id="' + k + '"')) continue;
      const wh = C.wheel(k);
      if (wh) {
        const c0 = wh._cols[0];
        const cur = Math.round(c0.scrollTop / 44);
        const i = c0.items.findIndex((x, n) => n !== cur && x.v !== '' && +x.v > 0 && x.v !== (c0.items[cur] || {}).v);
        if (i < 0) return null;
        C.roll(wh, [[0, c0.items[i].v]]);
        return k + '=' + J(C.hidden(k));
      }
      if (k === 'log_swim_yards') { C.type('log_swim_yards', '1500'); return k + '=' + J(C.hidden(k)); }
    }
    return null;
  };
  const days: [string, Program, DayKey, DayKey, string][] = [];
  let cfgs = 0;
  for (const [nm, cfg] of SRC_CFGS) {
    const prog = C.build(cfg);
    const rest = DAYS.find((d) => prog.weeks[1][d] && prog.weeks[1][d].rest);
    if (!rest) continue;
    cfgs++;
    for (const d of DAYS) if (['run', 'bike', 'swim'].includes(sportOf(prog.weeks[1][d]))) days.push([nm, prog, rest, d, sportOf(prog.weeks[1][d])]);
  }
  assert.deepEqual([cfgs, days.length], [7, 22], 'seven configs with a W1 rest day, 22 W1 run, bike or swim days');
  for (const [nm, prog, rest, d, ct] of days) {
    const t = ['bike', 'run', 'swim'].find((s) => s !== ct) as string;
    for (const mode of ['logged-then-swap', 'swap-blank', 'logged-under-swap']) {
      const tag = nm + ' W1 ' + d + ' ' + ct + '>' + t + ' ' + mode;
      C.use(prog); C.setNow(C.at(1, rest)); C.open(1, d);
      formHtml = C.els.detailBody.innerHTML || '';
      if (mode === 'logged-then-swap') {
        const v = sessionValue();
        C.log();
        assert.ok(v && held(C.entry(1, d) || {}).length, tag + ' a number stored before the chip');
      }
      C.ev('setCardioSwap(' + J(t) + ')'); C.advance(50);
      formHtml = C.els.cardioFields.innerHTML || '';
      if (mode === 'logged-under-swap') {
        const v = sessionValue();
        C.log();
        const e = C.entry(1, d) || {};
        assert.ok(v && e.swapTo === t && held(e).length, tag + ' a number logged under the swap ' + J(e));
      } else {
        const L1 = C.entry(1, d) || {};
        assert.equal(L1.swapTo, t, tag);
        if (mode === 'logged-then-swap') assert.ok(L1.parked && L1.parked[ct], tag + ' the planned numbers are parked');
        assert.equal(offeredOn(1, d), false, tag + ' swapped away: not offered');
      }
      C.ev('setCardioSwap(' + J(ct) + ')'); C.advance(50);
      const L2 = C.entry(1, d) || {};
      if (mode === 'logged-under-swap') {
        assert.ok(L2.swapTo === '' && L2.parked && L2.parked[t] && !held(L2).length, tag + ' tapped back: the swap\'s numbers parked ' + J(L2));
        assert.equal(offeredOn(1, d), false, tag + ' not offered');
        continue;
      }
      assert.ok(L2.swapTo === '' && !('parked' in L2), tag + ' tapped back: clean ' + J(L2));
      if (mode === 'swap-blank') assert.equal(offeredOn(1, d), true, tag + ' nothing logged: offered');
      else {
        assert.equal(offeredOn(1, d), false, tag + ' logged: not offered');
        assert.ok(held(L2).length, tag + ' the number is back at the top');
      }
    }
  }
});

// v0.240.0 (D228 item 4, D226 amended): the sheet reopens on the record and Log writes the face over it (V238 summed: 57 / 5.7).
test('Log on a rest day writes the face over the type\'s record: a second run replaces the first; a ride sits beside it', () => {
  const ARMS: [string, Program, number, DayKey, Jog[], Record<string, Record<string, number>>][] = [
    ['run then run, higher first', HALF, 1, 'wed', [JOG.run, { type: 'run', mins: 20, dist: '2', rpe: 5 }], { run: { mins: 20, dist: 2, rpe: 5 } }],
    ['run then run, higher last', HALF, 1, 'wed', [{ type: 'run', mins: 37, dist: '3.7', rpe: 5 }, { type: 'run', mins: 20, dist: '2', rpe: 9 }], { run: { mins: 20, dist: 2, rpe: 9 } }],
    ['run then ride', MULTI, BIKE_CELL!.w, BIKE_CELL!.rest, [JOG.run, { type: 'bike', mins: 20, dist: '', rpe: 5 }], { run: { mins: 37, dist: 3.7, rpe: 7 }, bike: { mins: 20, rpe: 5 } }],
  ];
  for (const [nm, prog, w, d, steps, want] of ARMS) {
    C.use(prog); C.setNow(C.at(w, d));
    steps.forEach((j) => sheetJog(w, d, j));
    const e = C.entry(w, d) || {};
    const rl = e.restLog || {};
    assert.deepEqual(Object.keys(rl).sort(), Object.keys(want).sort(), nm);
    for (const t of Object.keys(want)) {
      assert.deepEqual(Object.keys(rl[t]).sort(), Object.keys(want[t]).sort(), nm + ' ' + t);
      for (const k of Object.keys(want[t])) assert.ok(near(rl[t][k], want[t][k]), nm + ' ' + t + '.' + k + ' ' + rl[t][k]);
    }
    assert.deepEqual(TOP_ABSENT.filter((k) => k in e), [], nm + ' no flat keys');
  }
});

test('a jog stored in the older flat shape reads as a rest log everywhere, and nothing is rewritten until the next save', () => {
  const LEG1 = { rest_cardio: true, rest_type: 'run', rest_mins: 37, rpe: 7, run_dist: 3.7 };
  const LENS1 = { restLog: { run: { mins: 37, dist: 3.7, rpe: 7 } } };
  const SETS = { front_squat: { r: ['5', '5'], w: ['135', '135'], L: '' } };
  const TS = C.at(1, 'wed', 9);
  const LEG2 = { rest_cardio: true, rest_type: 'run', rest_mins: 37, rpe: 7, run_dist: 3.7, sets: SETS, week: 1, ts: TS };
  const LENS2 = { restLog: { run: { mins: 37, dist: 3.7, rpe: 7 } }, sets: SETS, week: 1, ts: TS };
  const runLine = LINE(37, 'run', 7, '3.7 mi');
  C.use(HALF); C.setNow(C.at(1, 'wed')); C.setLog(1, 'wed', LEG1);
  const raw0 = C.logs();
  assert.equal(CJ((C.ev('getLogs()') || {}).w1_wed), CJ(LENS1), 'getLogs');
  assert.equal(CJ((C.ev('getLogsFor(' + J(C.id) + ')') || {}).w1_wed), CJ(LENS1), 'getLogsFor');
  assert.equal(milesTile(1), '3.7');
  const hr = heroOf(1, 'wed');
  assert.deepEqual([hr.rest, hr.lines, hr.btn], [true, [runLine], 'Edit cardio']);
  const ph = progress();
  const cr = chartVal('Weekly Running Mileage', 1);
  const ca = chartVal('Average Session RPE', 1);
  assert.ok(cr.drawn && near(cr.v, 3.7) && ca.drawn && near(ca.v, 7), J([cr, ca]));
  const r = rowOf(journal(ph), 1, 'Wed');
  assert.ok(r);
  assert.deepEqual([jogLinesOf(r), headOf(r), labelHits(r)], [[runLine], [], []]);
  assert.ok(near(ladder(1), 3.7));
  assert.equal(C.logs(), raw0, 'the reads wrote nothing');
  // both shapes planted; boot, the week view and Progress write nothing; one save stores both converted
  C.use(HALF); C.setNow(C.at(1, 'wed')); C.setLog(1, 'wed', LEG1); C.setLog(1, 'sun', LEG2);
  const b0 = C.logs();
  assert.deepEqual(Object.keys(JSON.parse(b0)).sort(), ['w1_sun', 'w1_wed']);
  C.ev('init()'); C.advance(500); C.ev('currentWeek=1; renderWeekView()'); progress();
  const b1 = C.logs();
  assert.equal(b1, b0, 'boot and the renders wrote nothing');
  const s2 = (C.ev('getLogs()') || {}).w1_sun || {};
  assert.equal(CJ(s2), CJ(LENS2));
  assert.equal(J(s2.sets), J(SETS));
  assert.deepEqual(Object.keys(s2).sort(), ['restLog', 'sets', 'ts', 'week']);
  C.open(1, 'mon'); C.rpe('6'); C.back();
  const A = JSON.parse(C.logs());
  assert.equal((A.w1_mon || {}).rpe, '6');
  assert.equal(CJ(A.w1_wed), CJ(LENS1), 'stored converted');
  assert.equal(CJ(A.w1_sun), CJ(LENS2), 'stored converted with its sets');
  assert.equal(J((A.w1_sun || {}).sets), J(SETS));
});

// v0.240.0 (D224-hero restated): each line carries its distance (D229), and the button reads Edit cardio (D228 item 8).
test('the rest hero prints one line per logged type, with its distance, under Edit cardio, and Log cardio when nothing is logged', () => {
  const CASES: [string, object | null, string[], string][] = [
    ['none', null, [], 'Log cardio'],
    ['a rest log', { restLog: { run: { mins: 37, dist: 3.7, rpe: 7 } }, week: 1, ts: C.at(1, 'wed', 9) }, [LINE(37, 'run', 7, '3.7 mi')], 'Edit cardio'],
    ['an older single jog', { rest_cardio: true, rest_type: 'run', rest_mins: 37, rpe: 7, run_dist: 3.7 }, [LINE(37, 'run', 7, '3.7 mi')], 'Edit cardio'],
    ['an older ride then run', { rest_cardio: true, rest_type: 'run', rest_mins: 20, rpe: 5, bike_mins: 37, run_dist: 2 }, [LINE(20, 'run', 5, '2 mi'), LINE(37, 'ride', '—')], 'Edit cardio'],
    ['an older ride then ride', { rest_cardio: true, rest_type: 'bike', rest_mins: 20, rpe: 5, bike_mins: 57 }, [LINE(57, 'ride', 5)], 'Edit cardio'],
  ];
  for (const [nm, entry, lines, btn] of CASES) {
    C.use(HALF); C.setNow(C.at(1, 'wed'));
    if (entry) C.setLog(1, 'wed', entry);
    const h = heroOf(1, 'wed');
    assert.deepEqual([h.rest, h.lines, h.btn], [true, lines, btn], nm);
  }
});
