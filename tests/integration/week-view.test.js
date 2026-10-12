'use strict';
// The week view and closing a day. Rulings: D173 (P-RECOVBANNER: the week view stops explaining the placement; the
// placement and its program field stay) and D179 (P-DONENAV: Done, Skip and Mark Done ✓ close the day and land on This
// Week, with its amendment: the hero status copy, the skipped strip ✕, the rest timer on a close, no Done toast under
// the pop-up). The record is in the handoff and tests/measure/v220_rulings/, tests/measure/v221_rulings/.
//
// The day-close claims run here on a sample of HALF_MANNY's 70 training days (every seventh, and two whole weeks for
// the hero and the strip); tests/sweeps/week-view.test.js runs every training day.
//
// Oracles, typed by hand: the D36 placement sentence; the two hero strings and the Skip toast label from the D179
// amendment; the weekday names; the cell's day of month by date arithmetic; the pace wheel's row table; the idle rest
// timer print. The app is driven through its own handlers (handleDayStatus, openDayKey, closeDetail, renderWeekView,
// iaWheelInit, rtToggleBtn, popClose) in the VM harness, with a virtual clock that runs every timer callback.
process.env.TZ = 'America/New_York';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock, appScript, fixtures } = require('../support/app.js');
const W = require('../support/week-view.js');

// ── the recovery banner is gone; the placement trace stays (D173) ────────────────────────────────────────────────
const D36 = 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.';
const RECYCLE = String.fromCodePoint(0x267B), RECYCLE_ESC = String.fromCharCode(92) + 'u267b';
const SRC = W.stripComments(appScript());

test('the comment strip keeps the code: it compiles and still holds the week renderer and its stats block', () => {
  // B0
  assert.ok(W.compiles(SRC), 'the stripped inline script compiles');
  assert.equal(W.count(SRC, 'function renderWeekView('), 1);
  assert.ok(W.count(SRC, 'wk-stats') >= 1);
});

test('the app source never prints the recovery spacing banner', () => {
  // B1, B2, B3
  assert.equal(W.count(SRC, 'Recovery spacing'), 0);
  assert.equal(W.count(SRC, 'activeProg.legRecoveryNote'), 0, 'no screen reads the placement note');
  assert.equal(W.count(SRC, RECYCLE), 0, 'no recycle glyph');
  assert.equal(W.count(SRC.toLowerCase(), RECYCLE_ESC), 0, 'no recycle glyph as escape text');
});

test("the program keeps the placement note as a trace, word for word", () => {
  // B4
  const IA = loadApp();
  pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));
  assert.equal(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))).legRecoveryNote, D36);
});

test('week 1 renders its stats block with no banner, no recycle glyph and no sentence of the note', () => {
  // B5: HALF_MANNY and one NSW test program (pace goal), both carrying a note, so the render is not vacuous.
  const NSW_TEST = {
    name: 'NSW', primaryPath: 'goal', eventTargeted: false, cardioTypes: ['run'],
    cardioGoals: { run: { id: 'run_pace_goal', label: 'P', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' } },
    liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', restDays: ['sun', 'wed'],
    days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 185, squat: 255, deadlift: 315, startDate: '2026-09-21', seed: 24865,
  };
  const sentences = s => s.split('. ').map(x => x.replace(/\.$/, '')).filter(Boolean);
  for (const [name, cfg] of [['HALF_MANNY', fixtures.HALF_MANNY], ['NSW pace test', NSW_TEST]]) {
    const IA = loadApp({ dom: true });
    pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));
    const prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
    assert.ok(typeof prog.legRecoveryNote === 'string' && prog.legRecoveryNote.length > 0, name + ' carries a note');
    IA.localStorage.clear();
    IA.ctx.__P = prog;
    IA.eval('activeProgId=__P.id;activeProg=__P;currentWeek=1;renderWeekView();');
    const html = IA.els.daysList ? IA.els.daysList.innerHTML : '';
    assert.ok(html.length > 0, name + ' renders a week');
    assert.ok(html.includes('class="wk-stats"'), name + ' renders the stats block');
    assert.ok(!html.includes('Recovery spacing'), name + ' prints no banner');
    assert.ok(!html.includes(RECYCLE), name + ' prints no recycle glyph');
    for (const s of sentences(D36).concat(sentences(prog.legRecoveryNote))) assert.ok(!html.includes(s), name + ' prints no "' + s + '"');
  }
});

// ── closing a day (D179) ─────────────────────────────────────────────────────────────────────────────────────────
const E = W.weekEnv();
const SAMPLE = E.TRAIN.filter((_, i) => i % 7 === 0);
const allPass = (q, k, n) => {
  const t = q.get(k);
  assert.equal(t.fail, 0, k + ' failed: ' + t.examples.join(' | '));
  assert.equal(t.pass, n, k + ' ran ' + t.pass + ' cases, want ' + n);
};

test('the hand oracle agrees with itself: the wheel rows and the Monday start', () => {
  assert.equal(W.MIN_ROWS[W.W_SEED_ROWS[0]], '9');
  assert.equal(W.SEC_ROWS[W.W_SEED_ROWS[1]], '30');
  assert.equal(W.MIN_ROWS[W.W_TARGET_ROW], '10');
  assert.equal(new Date(W.dateOf(1, 'mon')).getDay(), 1);
});

test('HALF_MANNY has 70 training days, all inside the block, and stores no blockOpen', () => {
  // F0 (the render half is asserted after the lattices below, in the last test)
  assert.equal(E.TRAIN.length, 70);
  assert.equal(E.p.blockOpen, undefined);
  assert.ok(SAMPLE.length >= 10);
});

E.setup();
const CLOSE = W.closeTaps(E, SAMPLE);

test('Done, Skip and Mark Done ✓ close the day and land on This Week', () => {
  // C1, C2, C3 (Mark Done ✓ also marks the day complete)
  allPass(CLOSE, 'C1', SAMPLE.length);
  allPass(CLOSE, 'C2', SAMPLE.length);
  allPass(CLOSE, 'C3', SAMPLE.length);
});

test('an undo tap (Done ✓ or Skipped ✕ again) stays on the day, says Unmarked and clears the status', () => {
  // C4
  allPass(CLOSE, 'C4', 2 * SAMPLE.length);
});

test('the pop-up shows over This Week after Done and Mark Done ✓, and never after Skip', () => {
  // C5, C6
  allPass(CLOSE, 'C5', 2 * SAMPLE.length);
  allPass(CLOSE, 'C6', SAMPLE.length);
});

test('Done never shows the toast under the pop-up; Skip shows its own label and no pop-up', () => {
  // T1 (every 10 ms through +2.3 s), T2
  allPass(CLOSE, 'T1', SAMPLE.length);
  allPass(CLOSE, 'T2', SAMPLE.length);
});

const TIMER = W.timerTaps(E, SAMPLE);

test('Done, Skip and Mark Done ✓ stop and zero a running rest timer and leave the float where it is', () => {
  // B1d, B1s, B1m
  for (const k of ['B1d', 'B1s', 'B1m']) allPass(TIMER, k, SAMPLE.length);
});

test('an undo tap and ‹ Back keep a running rest timer running on the same interval', () => {
  // B2u, B2b
  allPass(TIMER, 'B2u', SAMPLE.length);
  allPass(TIMER, 'B2b', SAMPLE.length);
});

const WHEEL = W.wheelTaps(E);

test('a pace wheel still settling when Done or Skip is tapped saves the value it was turned to', () => {
  // W1: seeded 9:30, turned to 10:30, tapped 40 ms into the 90 ms window; also when the layout reads 0 after the close
  assert.ok(WHEEL.runDay, 'some training day renders a pace wheel');
  allPass(WHEEL.q, 'W1', 4);
});

test('an undo tap inside the settle window is not flushed; the wheel settles on its own', () => {
  // W2: a stored 9:30 reads 9:30 at the tap and 10:30 after the settle; a 9:30 only on the form stores nothing
  allPass(WHEEL.q, 'W2', 4);
});

const HERO_WEEKS = [1, 7];
const HS = W.heroAndStrip(E, HERO_WEEKS);

test("today's hero says Done or Skipped after the close, offers OPEN SESSION, and goes back to START SESSION on undo", () => {
  // A1a, A1b, A1c
  allPass(HS.q, 'A1a', HS.todays);
  allPass(HS.q, 'A1b', HS.todays);
  allPass(HS.q, 'A1c', 3 * HS.todays);
});

test('closing a past day leaves the hero on today, byte for byte', () => {
  // A2
  allPass(HS.q, 'A2', 2 * HS.pairs);
});

test('the strip marks a skipped day ✕ and a done day ✓, and an undone day shows its date again', () => {
  // A3a, A3b, A3c (today and past cells, each in its own class)
  allPass(HS.q, 'A3a', 2 * HS.pairs);
  allPass(HS.q, 'A3b', 2 * HS.pairs);
  allPass(HS.q, 'A3c', 4 * HS.pairs);
});

test('a skipped day that carries a Wildcard shows the Wildcard mark, not ✕', () => {
  // A3d (D71b precedence)
  allPass(HS.q, 'A3d', 2 * HS.pairs);
});

test('no render in these lattices shows a day as before signup', () => {
  // F0, render half
  assert.ok(E.PRE.renders > 0);
  assert.equal(E.PRE.n, 0);
});

// ── the close copy in the source (comments stripped) ─────────────────────────────────────────────────────────────
const OLD_SKIP = 'Skipped ✕ — the week moves on';
const body = name => { const i = SRC.indexOf('function ' + name + '('), k = SRC.indexOf('\nfunction ', i + 1); return i < 0 ? '' : SRC.slice(i, k < 0 ? undefined : k); };

test('the old em-dash Skip label survives only in resolveReminder', () => {
  // K1
  assert.equal(W.count(SRC, OLD_SKIP), 1);
  assert.equal(W.count(body('resolveReminder'), OLD_SKIP), 1);
});

test('handleDayStatus labels a skip with the new copy and no em-dash', () => {
  // K2
  const hd = body('handleDayStatus');
  assert.equal(W.count(hd, "skipped:'" + W.SKIP_LBL + "'"), 1);
  assert.equal(W.count(hd, 'Skipped ✕ —'), 0);
});

test('OPEN SESSION and each hero string appear once in the source', () => {
  // K3
  assert.equal(W.count(SRC, 'OPEN SESSION'), 1);
  assert.equal(W.count(SRC, W.DONE_STR), 1);
  assert.equal(W.count(SRC, W.SKIP_STR), 1);
});
