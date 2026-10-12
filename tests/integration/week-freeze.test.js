'use strict';
// The week freeze: a day the athlete has seen keeps its card across a reboot. Ruling D108 (V202, E14): the touched set
// reads all four stores, so a day is frozen by any store that proves the athlete saw it. ia_exw_ is a load written
// against a prescription (selectKBSize writes it and nothing else); ia_hist_ is the snapshot of the card shown.
//
// Method: the stored program's week 4 carries sentinel bytes on the probe day (mon) and the control day (thu), so a day
// rebuilt by the engine is visibly not the stored card. A reboot is the app's own boot path, refreshProgram(stored),
// against the same storage. Each store gets its own fresh app with only that store written, so each claim is
// attributable to one store (with both stores in one week either alone lifts the cut past both days).
//
// Oracle: the fixture's own stored bytes (the sentinel week written to ia_programs, the snapshot written to ia_hist_).
// The engine is never asked what the frozen card should be; one test proves the live build differs from the sentinel,
// so "frozen" is a real claim, and the control day proves a day with nothing stored still rebuilds.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock, progDigest } = require('../support/app.js');

const TODAY = new Date(2026, 9, 11, 12, 0, 0);
const clone = v => JSON.parse(JSON.stringify(v));
// A recursive key sort (JSON.stringify with a key list is an allowlist at every level and would strip the sections).
function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const exNamesOf = day => {
  const out = [];
  ((day && day.sections) || []).forEach(s => (s.items || []).forEach(i => { if (i && i.name) out.push(i.name); }));
  return out;
};

// The V202 reporter's config (PRT TING), seed pinned, undated (no race date), so no test week pin touches it.
const CFG = {
  name: 'PRT TING', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: false, raceDate: '',
  liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35', equipment: 'full_gym', unit: 'lbs',
  restDays: ['sun', 'wed'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 185, squat: 245, deadlift: 315, seed: 24865,
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '10', targetSecs: '30',
    targetTime: '10:30', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, baselineDist: '3', baseline: '3mi' } },
};
const WK = 4;          // a future week: the program starts this week, so the current week is 1
const PROBE = 'mon';   // the only day with a record, in each scenario
const CONTROL = 'thu'; // nothing written

function app() { const IA = loadApp(); pinClock(IA, TODAY); IA.eval('showToast=function(){};'); return IA; }

/** A stored program whose week WK carries sentinels, with exactly one store written for the probe day; then a reboot. */
function scenario(only) {
  const V = app();
  const stored = clone(V.buildProgram(clone(CFG)));
  stored.id = 'p_freeze_' + only;
  const r = V.eval("resolveStartDate(_isoToday(),['sun','wed'])");
  stored.startDate = (r && r.start) || V.eval('_isoToday()');
  for (const d of [PROBE, CONTROL]) {
    const day = stored.weeks[WK][d];
    day.title = 'SENTINEL ' + d.toUpperCase() + ' w' + WK;
    const first = (day.sections || []).find(s => (s.items || []).length);
    if (first) first.items[0].name = 'Sentinel movement ' + d;
  }
  const SENT = clone(stored.weeks[WK]);
  V.localStorage.setItem('ia_programs', JSON.stringify([stored]));
  V.localStorage.setItem('ia_active', stored.id);
  let HIST = null, histKey = null;
  if (only === 'hist') {
    histKey = V.eval('completedKey(' + WK + ",'" + PROBE + "')");
    HIST = { [histKey]: clone(SENT[PROBE]) };
    V.localStorage.setItem('ia_hist_' + stored.id, JSON.stringify(HIST));
  } else {
    // keyed by exercise slug through the app's one writer of that slug; the week and day live on the entry
    const exName = exNamesOf(SENT[PROBE])[0] || 'Back squat';
    const EXW = { [V.exStoreKey(exName)]: { name: exName, entries: [{ weight: 135, setsReps: '3x5', setsDone: [], setsW: [], week: WK, day: PROBE, ts: 1 }] } };
    V.localStorage.setItem('ia_exw_' + stored.id, JSON.stringify(EXW));
  }
  const stores = ['ia_comp_', 'ia_logs_', 'ia_hist_', 'ia_exw_'].filter(p => V.localStorage.getItem(p + stored.id) !== null);
  const after = V.refreshProgram(JSON.parse(V.localStorage.getItem('ia_programs'))[0]);
  return { SENT, HIST, histKey, after, A: (after.weeks && after.weeks[WK]) || {}, stores };
}

const LIVE = app().buildProgram(clone(CFG));
const SX = scenario('exw');
const SH = scenario('hist');

test('the pinned config builds the same program twice', () => {
  // R0
  assert.equal(progDigest(app().buildProgram(clone(CFG))), progDigest(LIVE));
});

test('the fixture week carries the probe day and the control day', () => {
  // R0b
  assert.ok(LIVE.weeks[WK] && LIVE.weeks[WK][PROBE] && LIVE.weeks[WK][CONTROL]);
});

test('each scenario writes exactly one store', () => {
  // R0c
  assert.deepEqual(SX.stores, ['ia_exw_']);
  assert.deepEqual(SH.stores, ['ia_hist_']);
});

test('the live build of both days differs from the stored sentinels, so a frozen day is a real claim', () => {
  // R4
  assert.notEqual(canon(LIVE.weeks[WK][PROBE]), canon(SX.SENT[PROBE]));
  assert.notEqual(canon(LIVE.weeks[WK][PROBE]), canon(SH.SENT[PROBE]));
  assert.notEqual(canon(LIVE.weeks[WK][CONTROL]), canon(SX.SENT[CONTROL]));
});

test('a logged weight alone (ia_exw_) freezes the day: the reboot keeps the stored card byte for byte', () => {
  // R1
  assert.ok(SX.A[PROBE]);
  assert.equal(canon(SX.A[PROBE]), canon(SX.SENT[PROBE]));
});

test('beside a logged weight, a day with no record is rebuilt to the live build', () => {
  // R1c
  assert.notEqual(canon(SX.A[CONTROL]), canon(SX.SENT[CONTROL]));
  assert.equal(canon(SX.A[CONTROL]), canon(LIVE.weeks[WK][CONTROL]));
});

test('a snapshot alone (ia_hist_) freezes the day to the snapshot, byte for byte', () => {
  // R2
  assert.ok(SH.A[PROBE]);
  assert.equal(canon(SH.A[PROBE]), canon(SH.HIST[SH.histKey]));
});

test('beside a snapshot, a day with no record is rebuilt to the live build', () => {
  // R2c
  assert.notEqual(canon(SH.A[CONTROL]), canon(SH.SENT[CONTROL]));
  assert.equal(canon(SH.A[CONTROL]), canon(LIVE.weeks[WK][CONTROL]));
});

test('the week beyond the freeze cut is the live build in both scenarios', () => {
  // R5: the cut is a frontier, not a blanket
  for (const S of [SX, SH]) {
    if (S.after.weeks[WK + 1]) assert.equal(canon(S.after.weeks[WK + 1]), canon(LIVE.weeks[WK + 1]));
  }
  assert.ok(SX.after.weeks[WK + 1] || SH.after.weeks[WK + 1], 'a week after the cut exists');
});
