'use strict';
// The sport chip on a cardio day: swapping a run for a bike or a swim credits the new sport and never erases what the
// athlete typed. Rulings D213 (P-SWAPKEEP: the leaving sport's numbers park under parked[sport] and come back when the
// athlete switches back; a moved-in day parks under its own key) and D214 (the swap note says what is kept), V234.
// The record is in the handoff and tests/measure/v234_rulings/v234_ruling_d213_d214.md.
//
// Fixture: HALF_MANNY, W1 SAT Long Run (dose 3.1 mi), clock 2026-10-03 (a Saturday; the program starts 2026-09-28).
// Oracle, typed by hand: the numbers typed (45 minutes, 5 miles, bike 40, swim 1000), the derived pace 45 / 5 = 9:00/mi
// and 45 / 6 = 7:30/mi, the four D214 notes, W1 MILES 5 or 0 and DONE 1/5 (one 5 mi log; W1 rests Sun and Wed, so five
// training days). The app is driven through openDetail, setCardioSwap, persistLogFields, handleDayStatus,
// renderWeekView and applyRestMove; the engine is never asked for an expected value.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { APP, fixtures } = require('../support/app.js');
const S = require('../support/sport-swap.js');

const J = JSON.stringify;
const RUN_PARKED = { run_dist: '5', run_mins: '45', run_pace: '9:00/mi' };
const RUN_PARKED6 = { run_dist: '6', run_mins: '45', run_pace: '7:30/mi' };
const NOTE = {
  bike1: 'Counts toward Bike, not Run.',
  bike2: 'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.',
  swim1: 'Counts toward Swim, not Run.',
  swim2: 'Counts toward Swim, not Run. Your Run numbers are kept. Switch back and they return.',
};
const PLAN_FACE = '3.1 mi';
const sameMap = (a, b) => assert.deepEqual(Object.fromEntries(Object.entries(a).map(([k, v]) => [k, String(v)])), b);
const noTs = L => { if (!L) return L; const o = Object.assign({}, L); delete o.ts; return J(o); };

const W = S.sportWorld();
const MANNY = JSON.parse(J(fixtures.HALF_MANNY)), PID = 'p_sport', K = 'w1_sat';
const fresh = () => { W.install(MANNY, PID); return W.open('sat'); };
const NOTES_SEEN = [];

test('the repro day is W1 SAT Long Run, planned run, with its 3.1 mi strip', () => {
  fresh();
  assert.equal(W.E('activeProg.weeks[1].sat.cardio && activeProg.weeks[1].sat.cardio.subtype'), 'Long Run');
  assert.deepEqual(Object.assign({}, W.REG.get('cardioSwapWrap').dataset), { planned: 'run', active: 'run', logged: '0' });
  assert.ok(/class="plan-strip"/.test(W.fieldsHTML()) && W.fieldsHTML().includes(PLAN_FACE));
});

// The repro walk: type 45 / 5, swap to bike, type bike 40, reopen, swap back, reopen.
const R = {};
{
  fresh();
  W.type('sat', { run_mins: '45', run_dist: '5' }); R.L0 = W.entry(PID, K); R.w0 = W.weekStats();
  R.s1 = W.swap('bike'); R.L1 = W.entry(PID, K); R.n1 = W.liveNote(); NOTES_SEEN.push(R.n1 && R.n1.text);
  R.form1 = { active: W.active(), bike: W.hid('bike_mins'), strip: /plan-strip/.test(W.fieldsHTML()) };
  R.w1 = W.weekStats();
  W.type('sat', { bike_mins: '40' }); R.L2 = W.entry(PID, K); R.w2 = W.weekStats();
  W.open('sat'); R.rn = W.renderNote(); NOTES_SEEN.push(R.rn && R.rn.text);
  R.reopen1 = { active: W.active(), bike: W.hid('bike_mins'), entry: W.entry(PID, K) };
  W.swap('run'); R.L3 = W.entry(PID, K); R.n3 = W.liveNote();
  R.form3 = { mins: W.hid('run_mins'), dist: W.hid('run_dist'), strip: /class="plan-strip"/.test(W.fieldsHTML()) && W.fieldsHTML().includes(PLAN_FACE) };
  R.w3 = W.weekStats();
  W.open('sat'); R.rn2 = W.renderNote(); R.L4 = W.entry(PID, K);
  R.reopen2 = { active: W.active(), mins: W.hid('run_mins'), dist: W.hid('run_dist'), strip: /plan-strip/.test(W.fieldsHTML()) };
}

test('a swap parks the run the athlete typed and clears it from the top', () => {
  // K1
  assert.ok(R.L0 && R.L0.run_mins === '45' && R.L0.run_dist === '5' && R.L0.run_pace === '9:00/mi', J(R.L0));
  assert.ok(!(R.s1 && R.s1.threw));
  assert.ok(S.topBlank(R.L1, 'run'), J(R.L1));
  assert.equal(R.L1.swapFrom, 'run'); assert.equal(R.L1.swapTo, 'bike');
  assert.deepEqual(Object.keys(R.L1.parked), ['run']);
  sameMap(S.nonBlank(R.L1.parked.run), RUN_PARKED);
  assert.deepEqual(R.form1, { active: 'bike', bike: '', strip: false });
});

test('what the athlete types on the target sport parks under that sport on the swap back', () => {
  // K2
  assert.equal(R.L2.bike_mins, '40');
  sameMap(S.nonBlank(R.L2.parked.run), RUN_PARKED);
  sameMap(S.nonBlank(R.L3.parked.bike), { bike_mins: '40' });
  assert.equal(R.L3.bike_mins || '', '');
});

test('the swap back restores the run at the top, the form, the plan strip, and hides the note', () => {
  // K3
  assert.deepEqual([R.L3.run_mins, R.L3.run_dist, R.L3.run_pace], ['45', '5', '9:00/mi']);
  assert.equal(R.L3.swapTo || '', ''); assert.equal(R.L3.swapFrom || '', '');
  assert.ok(!(R.L3.parked && 'run' in R.L3.parked));
  assert.deepEqual(R.form3, { mins: '45', dist: '5', strip: true });
  assert.deepEqual(R.n3, { display: 'none', text: '' });
});

test('reopening the day rebuilds the same form from the stored entry and writes nothing', () => {
  // K4
  assert.equal(R.reopen1.active, 'bike'); assert.equal(R.reopen1.bike, '40');
  assert.equal(noTs(R.reopen1.entry), noTs(R.L2)); assert.equal(R.reopen1.entry.ts, R.L2.ts);
  assert.deepEqual(R.reopen2, { active: 'run', mins: '45', dist: '5', strip: true });
  assert.equal(R.L4.ts, R.L3.ts); assert.equal(noTs(R.L4), noTs(R.L3));
});

test('the week credits the run when logged, nothing while it is swapped to an empty bike, and the run again after', () => {
  // C1
  assert.equal(R.w0.miles, '5'); assert.equal(R.w1.miles, '0'); assert.equal(R.w2.miles, '0'); assert.equal(R.w3.miles, '5');
});

test('the note while swapped says the run numbers are kept, live and when the day is reopened; it hides once undone', () => {
  // N2 (and its second walk below)
  assert.deepEqual(R.n1, { display: 'block', text: NOTE.bike2 });
  assert.deepEqual(R.rn, { display: 'block', text: NOTE.bike2 });
  assert.deepEqual(R.rn2, { display: 'none', text: '' });
  const b = noteWalk('bike', true);
  assert.equal(b.live.text, NOTE.bike2); assert.equal(b.ren.text, NOTE.bike2);
});

test('Mark Done while swapped keeps the entry as it was and marks the day complete', () => {
  // K5
  fresh();
  W.type('sat', { run_mins: '45', run_dist: '5' }); W.swap('bike'); W.type('sat', { bike_mins: '40' });
  const before = W.entry(PID, K); W.markDone('sat'); const after = W.entry(PID, K);
  sameMap(S.nonBlank(before.parked.run), RUN_PARKED);
  assert.equal(noTs(after), noTs(before));
  assert.equal(W.comp(PID, K), 'complete');
});

test('a day saved first, then swapped, keeps its run parked, stays complete and counts no miles', () => {
  // K6
  fresh();
  W.type('sat', { run_mins: '45', run_dist: '5' }); W.markDone('sat');
  assert.equal(W.comp(PID, K), 'complete');
  W.open('sat'); W.swap('bike'); const L = W.entry(PID, K);
  sameMap(S.nonBlank(L.parked.run), RUN_PARKED);
  assert.ok(S.topBlank(L, 'run') && L.swapTo === 'bike');
  assert.equal(W.comp(PID, K), 'complete');
  const w = W.weekStats(); assert.equal(w.done, '1/5'); assert.equal(w.miles, '0');
});

test('three hops keep every typed set and restore each sport on its return', () => {
  // K7
  fresh();
  W.type('sat', { run_mins: '45', run_dist: '5' }); W.swap('bike'); W.type('sat', { bike_mins: '40' }); W.swap('swim');
  const La = W.entry(PID, K);
  assert.deepEqual(Object.keys(La.parked).sort(), ['bike', 'run']);
  sameMap(S.nonBlank(La.parked.run), RUN_PARKED); sameMap(S.nonBlank(La.parked.bike), { bike_mins: '40' });
  W.type('sat', { swim_yards: '1000' }); W.swap('run'); const Lb = W.entry(PID, K);
  assert.deepEqual([Lb.run_mins, Lb.run_dist, Lb.run_pace, Lb.swapTo || ''], ['45', '5', '9:00/mi', '']);
  assert.deepEqual(Object.keys(Lb.parked).sort(), ['bike', 'swim']);
  sameMap(S.nonBlank(Lb.parked.bike), { bike_mins: '40' }); sameMap(S.nonBlank(Lb.parked.swim), { swim_yards: '1000' });
  assert.deepEqual([W.hid('run_mins'), W.hid('run_dist')], ['45', '5']);
  W.swap('bike'); const Lc = W.entry(PID, K);
  assert.equal(Lc.bike_mins, '40'); assert.ok(S.topBlank(Lc, 'run')); assert.equal(W.hid('bike_mins'), '40');
  assert.deepEqual(Object.keys(Lc.parked).sort(), ['run', 'swim']);
  sameMap(S.nonBlank(Lc.parked.run), RUN_PARKED); sameMap(S.nonBlank(Lc.parked.swim), { swim_yards: '1000' });
});

test('tapping the chip of the sport already active changes nothing', () => {
  // K8
  fresh();
  W.type('sat', { run_mins: '45', run_dist: '5' }); const a0 = W.entry(PID, K); W.swap('run'); assert.equal(noTs(W.entry(PID, K)), noTs(a0));
  W.swap('bike'); W.type('sat', { bike_mins: '40' }); const b0 = W.entry(PID, K); W.swap('bike');
  assert.equal(noTs(W.entry(PID, K)), noTs(b0)); assert.equal(W.hid('bike_mins'), '40');
});

test('with nothing typed, swaps leave no parked record; a run cleared in its own form parks nothing', () => {
  // K9
  fresh();
  for (const s of ['bike', 'swim', 'run', 'bike', 'run']) { W.swap(s); const L = W.entry(PID, K); assert.ok(L && !('parked' in L), 'after ' + s + ': ' + J(L)); }
  fresh(); W.type('sat', { run_mins: '45', run_dist: '5' }); W.swap('bike'); W.swap('run');
  W.type('sat', { run_mins: '', run_dist: '' }); const Lc = W.entry(PID, K);
  assert.ok(S.topBlank(Lc, 'run') && !('parked' in Lc), J(Lc));
  W.swap('bike'); const Ld = W.entry(PID, K);
  assert.ok(!('parked' in Ld) && Ld.swapTo === 'bike', J(Ld));
});

test('a run moved onto the rest day parks under the rest day and comes back there', () => {
  // K10 (D213 Amendment 1)
  W.install(MANNY, PID);
  assert.equal(W.E('!!(activeProg.weeks[1].wed && activeProg.weeks[1].wed.rest)'), true, 'W1 Wed is a rest day');
  W.tryv(() => W.E('openRestSheet(1,"wed","move"); _restDraft.pick="sat"; applyRestMove();'));
  assert.equal(W.E('JSON.stringify({t:(activeProg.weeks[1].wed.cardio||{}).type, from:activeProg.weeks[1].wed.movedFrom})'), J({ t: 'run', from: 'sat' }));
  W.open('wed'); assert.equal(W.type('wed', { run_mins: '45', run_dist: '5' }), '');
  assert.equal(W.REG.get('cardioSwapWrap').dataset.planned, 'run');
  W.swap('bike'); const Lw = W.entry(PID, 'w1_wed'), Ls = W.entry(PID, K);
  assert.ok(Lw && Lw.swapTo === 'bike' && S.topBlank(Lw, 'run'), J(Lw));
  sameMap(S.nonBlank(Lw.parked.run), RUN_PARKED);
  assert.ok(!(Ls && Ls.parked), 'w1_sat carries nothing parked');
  W.swap('run'); const Lr = W.entry(PID, 'w1_wed');
  assert.deepEqual([Lr.run_mins, Lr.run_dist, Lr.run_pace, 'parked' in Lr, Lr.swapTo || ''], ['45', '5', '9:00/mi', false, '']);
  assert.deepEqual([W.hid('run_mins'), W.hid('run_dist')], ['45', '5']);
});

test('a wheel still settling at the swap parks the value it settles to (6 miles, 7:30/mi)', () => {
  // K11
  fresh(); W.type('sat', { run_mins: '45', run_dist: '5' });
  // a column with a live settle timer, as iaWheelInit leaves one mid-coast: its settle writes the hidden node and runs
  // the input listener's body (persistLogFields and updateDoseDerived)
  const col = { _iawT: 1, ran: 0, _iawSettle() { this._iawT = 0; this.ran++; const h = W.REG.get('log_run_dist'); if (h) h.value = '6'; W.E('persistLogFields(currentDayKey); updateDoseDerived();'); } };
  const wrap = W.REG.get('cardioSwapWrap'), q0 = wrap.querySelectorAll;
  wrap.querySelectorAll = sel => /iaw-col/.test(sel) ? [col] : q0.call(wrap, sel);
  W.swap('bike'); const L = W.entry(PID, K);
  assert.equal(col.ran, 1);
  sameMap(S.nonBlank(L.parked.run), RUN_PARKED6);
  assert.ok(S.topBlank(L, 'run'));
});

function noteWalk(target, typed) {
  fresh(); if (typed) W.type('sat', { run_mins: '45', run_dist: '5' });
  W.swap(target); const live = W.liveNote(); W.open('sat'); const ren = W.renderNote();
  NOTES_SEEN.push(live && live.text, ren && ren.text); return { live, ren };
}

test('a swap with nothing typed says only where it counts, live and on reopen', () => {
  // N1
  const a = noteWalk('bike', false);
  assert.deepEqual(a.live, { display: 'block', text: NOTE.bike1 });
  assert.deepEqual(a.ren, { display: 'block', text: NOTE.bike1 });
});

test('a swim swap prints both notes the same way', () => {
  // N3
  for (const [typed, want] of [[false, NOTE.swim1], [true, NOTE.swim2]]) {
    const w = noteWalk('swim', typed);
    assert.deepEqual(w.live, { display: 'block', text: want }); assert.deepEqual(w.ren, { display: 'block', text: want });
  }
});

test('the old swap copy is gone and no printed note carries a dash or hyphen', () => {
  // N4
  const src = fs.readFileSync(APP, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');
  assert.equal((src.match(/Swapped from/g) || []).length, 0);
  assert.equal((src.match(/progress, not /g) || []).length, 0);
  const seen = NOTES_SEEN.filter(x => x);
  assert.ok(seen.length >= 10, 'notes collected: ' + seen.length);
  assert.deepEqual(seen.filter(x => /[\u2014\u2013-]/.test(x)), []);
});

test('the swap matrix: every typed field parks on the swap and returns on the return (straight back and via a third sport)', () => {
  // L1, sample: the six planned cells x both targets x saved or not, straight back and through a third sport (the sweep
  // also reopens while swapped and types on the target first: 96 rows)
  const rows = S.swapMatrix(W, r => r.hop === 'back' || r.hop === '3hop');
  assert.equal(rows.length, 48);
  assert.deepEqual(rows.filter(r => r.bad.length).map(r => r.name + ': ' + r.bad.slice(0, 3).join('; ')), []);
});
