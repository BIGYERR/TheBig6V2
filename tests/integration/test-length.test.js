'use strict';
// How long a dated NSW test goal's program is, and where it starts. Rulings: D106a (doGenerate writes the test pin from
// the resolved start; a stored dated test goal with no pin backfills it on boot; setProgStart re-pins), D183 (the race
// date card's sentences), D184 (P-TESTLEN: the pin holds whenever the test week is a row of Table 6, weeks 1 to 26; one
// owner, progTestPin, and one length on every surface; past week 26 the goal length builds and the card prints the
// interim sentence; (c') a start whose week holds the test is kept, and week 1 is the test week) and D187 R3 (a
// non-beginner pace goal with no mile has no anchor and doGenerate refuses it). The record is in the handoff and
// tests/measure/v207_rulings/, tests/measure/v223_rulings/.
//
// This file runs each claim on hand cells and a sample of each lattice; tests/sweeps/test-length.test.js runs the
// lattices whole (the 1,440-cell length lattice, the 120,050-point snap lattice, every (c) cell's build, start sentence
// and card) in both zones. The length and snap claims run under TZ=America/New_York and TZ=UTC: test weeks are counted
// across both 2026-11-01 (fall back) and 2027-03-14 (spring forward).
//
// Oracles, typed by hand: Monday week arithmetic on integer civil days (tests/support/test-week.js); 26, Table 6's last
// row, typed from the ruling; the ruling's After cells, sentences and toasts; dates printed by Intl in UTC from the ISO
// date, never by the app's formatter; the goal length past week 26 is what the same inputs build with no test date.
process.env.TZ = 'America/New_York';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { appScript, fixtures } = require('../support/app.js');
const X = require('../support/test-week.js');
const L = require('../support/test-length.js');
const { stripComments, compiles } = require('../support/week-view.js');
const { J } = L;
const { clone, canon, own } = X;

// ── the wizard writes the pin (D106a, D184) ──────────────────────────────────────────────────────────────────────
function generate(V, fields) {
  V.IA.window.__F = fields;
  V.IA.eval('Object.assign(WD, JSON.parse(JSON.stringify(__F)))');
  V.IA.eval('doGenerate()');
  const sub = (V.els.get('generateSub') || {}).textContent;
  V.IA.flushTimers();
  const ps = V.IA.eval('getPrograms()');
  return { sub, prog: ps[ps.length - 1], n: ps.length };
}

test('the wizard pins a dated test goal to its test week, 1 to 26, and the generate screen names that length; undated, before the start or past 26 keeps the 11-week goal', () => {
  // G1 to G5, on one WD in order, so a pin written only when set would survive into the next row (the latch rule).
  const V = L.wizardVM('2026-09-14', 12, 0);
  const base = X.prtTing(); delete base.seed;
  const runs = [
    // [row, fields, test week by hand, length, resolved start, generate line]
    ['G1', Object.assign({}, base, { seed: 24865 }), 5, 5, '2026-09-21', 'Building your 5-week program...'],
    ['G2', { eventTargeted: false, raceDate: '' }, null, 11, '2026-09-21', 'Building your 11-week program...'],
    ['G3', { eventTargeted: true, raceDate: '2026-09-14' }, null, 11, '2026-09-21', null],
    ['G4', { eventTargeted: true, raceDate: '2026-12-28' }, 15, 15, '2026-09-21', 'Building your 15-week program...'],
    ['G4b', { eventTargeted: true, raceDate: '2027-03-15' }, 26, 26, '2026-09-21', 'Building your 26-week program...'],
    ['G4c', { eventTargeted: true, raceDate: '2027-03-22' }, null, 11, '2026-09-21', 'Building your 11-week program...'],
    ['G5', { eventTargeted: true, raceDate: '2026-10-19', startDate: '2026-09-27' }, 4, 4, '2026-09-28', 'Building your 4-week program...'],
  ];
  // The hand weeks: Monday arithmetic from the resolved start; week 27 is past Table 6; Sun 2026-09-27 with Sunday rest snaps to Monday (D25).
  assert.deepEqual([['2026-09-21', '2026-10-19'], ['2026-09-21', '2026-12-28'], ['2026-09-21', '2027-03-15'], ['2026-09-21', '2027-03-22'], ['2026-09-28', '2026-10-19'], ['2026-09-21', '2026-09-14']]
    .map(([s, t]) => X.handWeek(s, t)), [5, 15, 26, 27, 4, null]);
  let before = V.IA.eval('getPrograms().length');
  for (const [row, f, tw, len, start, sub] of runs) {
    const r = generate(V, f);
    assert.equal(r.n, before + 1, row + ': a program was stored');
    before = r.n;
    const c = r.prog.cfg || {};
    assert.ok(own(c, '_testWeek'), row + ': the stored cfg carries _testWeek');
    assert.deepEqual([c._testWeek, c._raceDateCappedWeeks, r.prog.totalWeeks, r.prog.startDate], [tw, len, len, start], row);
    if (sub) assert.equal(r.sub, sub, row + ': the generate screen');
  }
  for (const [row, f] of [
    ['G6 run_base', { startDate: '2026-09-21', raceDate: '2026-10-19', eventTargeted: true, cardioGoals: { run: { id: 'run_base', label: 'Build Running Base', baselineDist: '2', baseline: '2mi' } } }],
    ['G7 NRC 5K', { startDate: '2026-09-21', raceDate: '2026-11-22', eventTargeted: true, cardioGoals: { run: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '15' } } }],
  ]) {
    const r = generate(V, f), c = (r.prog && r.prog.cfg) || {};
    assert.equal(r.n, before + 1, row + ': a program was stored');
    before = r.n;
    assert.equal(c._testWeek, null, row + ': a dated goal that is not a test has no test week');
    assert.equal(c._raceDateCappedWeeks, r.prog.totalWeeks, row);
    assert.notEqual(r.prog.totalWeeks, 5, row + ': not capped to the date');
  }
});

// ── the boot backfill and setProgStart (D106a slice C, D184) ─────────────────────────────────────────────────────
// Today is pinned to Sun 2026-10-11 12:00. Dates by hand: S, the next Monday after today, is 2026-10-12; the test
// R = S + 28 = Mon 2026-11-09 is week 5 from S and week 4 from S + 7 = 2026-10-19. The fixture's goal length is 11.
const TODAY = '2026-10-11', S = '2026-10-12', S7 = '2026-10-19', R = '2026-11-09';
const PAST_START = '2026-08-31', PAST_TEST = '2026-09-28';   // S - 42 and S - 14: week 5 of that start, before today
const W15 = '2027-01-18', W14 = '2027-01-11', W28 = '2027-04-19';   // S + 98, S + 91, S + 189

test('the hand dates of the backfill are what the calendar says', () => {
  assert.equal(X.dayKey(TODAY), 'sun');
  assert.deepEqual([S, S7, R, PAST_START, PAST_TEST, W15, W14, W28].map(X.dayKey), Array(8).fill('mon'));
  assert.deepEqual([X.addDays(TODAY, 1), X.addDays(S, 7), X.addDays(S, 28), X.addDays(S, -42), X.addDays(S, -14), X.addDays(S, 98), X.addDays(S, 91), X.addDays(S, 189)],
    [S, S7, R, PAST_START, PAST_TEST, W15, W14, W28]);
  assert.deepEqual([X.handWeek(S, R), X.handWeek(S7, R), X.handWeek(PAST_START, PAST_TEST), X.handWeek(S, W15), X.handWeek(S, W14), X.handWeek(S, W28)], [5, 4, 5, 15, 14, 28]);
});

const pace = over => X.prtTing(Object.assign({ raceDate: R }, over || {}));
/** A stored program in a fresh VM, with a trained W1 Monday (a sentinel) proved by its ia_hist_ snapshot. */
function stored(cfg, startIso, id) {
  const V = L.wizardVM(TODAY, 12, 0), IA = V.IA;
  const p = clone(IA.buildProgram(clone(cfg)));
  p.id = id; p.startDate = startIso;
  const day = p.weeks[1].mon;
  day.title = 'SENTINEL MON w1';
  const first = (day.sections || []).find(s => (s.items || []).length); if (first) first.items[0].name = 'Sentinel movement';
  const SENT = clone(day);
  IA.localStorage.setItem('ia_programs', JSON.stringify([p]));
  IA.localStorage.setItem('ia_active', p.id);
  const h = {}; h[IA.eval('completedKey')(1, 'mon')] = clone(SENT);
  IA.localStorage.setItem('ia_hist_' + p.id, JSON.stringify(h));
  const read = () => JSON.parse(IA.localStorage.getItem('ia_programs'))[0];
  return { V, IA, p, SENT, read };
}

test('a stored dated test goal with no pin backfills it on refresh: test week 5, 5 weeks, both pins persisted, the trained day frozen, the trial on the test day', () => {
  // C3a, C3b, C3c
  const Q = stored(pace({ _raceDateCappedWeeks: 11 }), S, 'p_c3'), pre = Q.read();
  assert.ok(!own(pre.cfg, '_testWeek') && pre.totalWeeks === 11, 'premise: no pin, 11 weeks');
  const a = Q.IA.refreshProgram(Q.read()), per = Q.read();
  assert.deepEqual([a.cfg._testWeek, a.cfg._raceDateCappedWeeks, a.totalWeeks], [5, 5, 5]);
  assert.deepEqual([per.cfg._testWeek, per.cfg._raceDateCappedWeeks], [5, 5], 'persisted');
  assert.equal(canon(a.weeks[1].mon), canon(Q.SENT), 'the trained W1 Monday is byte-identical');
  assert.notEqual(Q.IA.buildProgram(clone(pace({ _raceDateCappedWeeks: 5, _testWeek: 5 }))).weeks[1].mon.title, Q.SENT.title, 'a fresh build of that day differs, so the freeze is real');
  assert.ok(X.isTrial(a.weeks[5].mon.cardio), 'the trial on W5 Monday');
});

test('the backfill runs once: with the pin stored, moving the start a week later and refreshing keeps test week 5', () => {
  // C3d: a re-run would derive week 4.
  const Q = stored(pace({ _raceDateCappedWeeks: 11 }), S, 'p_c3');
  Q.IA.refreshProgram(Q.read());
  const p2 = Q.read(); p2.startDate = S7;
  const b = Q.IA.refreshProgram(p2);
  assert.equal(b.cfg._testWeek, 5);
  assert.equal(Q.read().cfg._testWeek, 5);
});

test('the backfill leaves an NRC program and an undated pace goal alone: no test week key, the length unchanged', () => {
  // C3e, C3f
  const N = stored(Object.assign({}, fixtures.HALF_MANNY), S, 'p_c3_nrc'), a = N.IA.refreshProgram(N.read());
  assert.ok(!own(a.cfg, '_testWeek') && !own(N.read().cfg, '_testWeek'));
  assert.equal(a.totalWeeks, N.p.totalWeeks);
  const U = stored(pace({ eventTargeted: false, raceDate: '', _raceDateCappedWeeks: 11 }), S, 'p_c3_nodate'), u = U.IA.refreshProgram(U.read());
  assert.ok(!own(u.cfg, '_testWeek') && !own(U.read().cfg, '_testWeek'));
  assert.equal(u.totalWeeks, 11);
});

test('a test already past writes nothing: no key in memory or in storage, the stored cfg bytes unchanged, 11 weeks', () => {
  // C3g
  const P = stored(pace({ raceDate: PAST_TEST, _raceDateCappedWeeks: 11 }), PAST_START, 'p_c3_past'), bytes = canon(P.read().cfg);
  const q = P.IA.refreshProgram(P.read());
  assert.ok(!own(q.cfg, '_testWeek') && !own(P.read().cfg, '_testWeek'));
  assert.equal(canon(P.read().cfg), bytes);
  assert.deepEqual([q.cfg._raceDateCappedWeeks, q.totalWeeks], [11, 11]);
});

test('a test past the 11-week goal pins its own week: week 15 builds 15 weeks with the trial on the test weekday, both pins persisted', () => {
  // C3h
  const F = stored(pace({ raceDate: W15, _raceDateCappedWeeks: 11 }), S, 'p_c3_far'), f = F.IA.refreshProgram(F.read()), fp = F.read().cfg;
  assert.deepEqual([f.cfg._testWeek, f.cfg._raceDateCappedWeeks, f.totalWeeks, fp._testWeek, fp._raceDateCappedWeeks], [15, 15, 15, 15, 15]);
  assert.ok(X.isTrial(f.weeks[15][X.dayKey(W15)].cardio));
});

test('a stored null pin with the test in week 14 of 11 re-pins to 14 and keeps the trained day frozen; in week 28, past Table 6, it stays null and writes nothing', () => {
  // C3i, C3j
  const I = stored(pace({ raceDate: W14, _testWeek: null, _raceDateCappedWeeks: 11 }), S, 'p_c3_v209'), ii = I.IA.refreshProgram(I.read()), ip = I.read().cfg;
  assert.deepEqual([ii.cfg._testWeek, ii.cfg._raceDateCappedWeeks, ii.totalWeeks, ip._testWeek, ip._raceDateCappedWeeks], [14, 14, 14, 14, 14]);
  assert.equal(canon(ii.weeks[1].mon), canon(I.SENT));
  assert.notEqual(I.IA.buildProgram(clone(pace({ raceDate: W14, _testWeek: 14, _raceDateCappedWeeks: 14 }))).weeks[1].mon.title, I.SENT.title);
  const Jw = stored(pace({ raceDate: W28, _testWeek: null, _raceDateCappedWeeks: 11 }), S, 'p_c3_w28'), bytes = canon(Jw.read().cfg), jj = Jw.IA.refreshProgram(Jw.read());
  assert.ok(own(jj.cfg, '_testWeek') && jj.cfg._testWeek === null && Jw.read().cfg._testWeek === null);
  assert.equal(canon(Jw.read().cfg), bytes);
  assert.deepEqual([jj.cfg._raceDateCappedWeeks, jj.totalWeeks], [11, 11]);
});

function moveStart(Q, iso) {
  Q.IA.eval('activeProgId = ' + J(Q.p.id) + '; activeProg = JSON.parse(localStorage.getItem("ia_programs"))[0];');
  Q.IA.eval('setProgStart(' + J(iso) + ')');
  return Q.IA.eval('activeProg');
}

test('moving the start a week later re-pins test week 4, builds 4 weeks, persists the pin and keeps the trained day frozen; an NRC program gets no pin', () => {
  // C1a, C1b, C1c
  const Q = stored(pace({ _raceDateCappedWeeks: 5, _testWeek: 5 }), S, 'p_c1'), ap = moveStart(Q, S7);
  assert.deepEqual([ap.startDate, ap.cfg._testWeek, ap.cfg._raceDateCappedWeeks, ap.totalWeeks, Q.read().cfg._testWeek], [S7, 4, 4, 4, 4]);
  assert.equal(canon(ap.weeks[1].mon), canon(Q.SENT));
  const N = stored(Object.assign({}, fixtures.HALF_MANNY), S, 'p_c1_nrc'), m = moveStart(N, S7);
  assert.ok(!own(m.cfg, '_testWeek'));
});

// ── the race date card on the cardio goal step (D183, D184) ──────────────────────────────────────────────────────
const INTACT = 'stays intact';
function feedback(wd) {
  const V = L.wizardVM(TODAY, 12, 0, { absent: ['raceDateInput'] });
  V.IA.window.__W = wd;
  V.IA.eval('Object.assign(WD, JSON.parse(JSON.stringify(__W)))');
  V.IA.eval('updateRaceDateFeedback()');
  return String(V.els.get('raceDateFeedback').innerHTML || '');
}
const wdPace = over => Object.assign({ cardioTypes: ['run'], cardioGoals: pace().cardioGoals, experience: 'intermediate', ageBracket: '18-35',
  liftingFocus: 'balanced', eventTargeted: true, primaryPath: 'event', restDays: ['sun', 'wed'] }, over || {});
const CARD = {
  w5: 'Your test is in week 5. The program ends on it. The taper lands in front of it.',
  tw1: 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.',
  none: 'Your test is before your first training day. This program starts after it and does not include it.',
  nrc: 'Less than a week away. Not enough time to train.',
};

test('the race date card names the test week: week 5, the start week, and a test before the start', () => {
  // C4a, C4b, C4c. Start the week after S, test that Thursday: week 1. Start S + 35, test R: the test is before it.
  const h5 = feedback(wdPace({ startDate: S, raceDate: R }));
  assert.ok(h5.includes(CARD.w5) && !h5.includes(INTACT), h5.slice(0, 200));
  assert.equal(X.handWeek(S7, X.addDays(S, 10)), 1);
  const h1 = feedback(wdPace({ startDate: S7, raceDate: X.addDays(S, 10) }));
  assert.ok(h1.includes(CARD.tw1), h1.slice(0, 200));
  const hb = feedback(wdPace({ startDate: X.addDays(S, 35), raceDate: R }));
  assert.ok(hb.includes('var(--signal)') && hb.includes(CARD.none) && !hb.includes(INTACT) && !hb.includes('Your test is in week'), hb.slice(0, 200));
});

test('a test goal three days out is the start week, never red; an NRC 5K three days out keeps its own sentence; no dash in any of them', () => {
  // C4d: started today, Sunday, with Sunday rest, so week 1 snaps to Monday 2026-10-12 (D25) and holds the Wednesday test.
  // C4e, C4f.
  const soon = X.addDays(TODAY, 3);
  assert.equal(X.dayKey(soon), 'wed');
  const hr = feedback(wdPace({ startDate: TODAY, raceDate: soon }));
  assert.ok(hr.includes(CARD.tw1) && !hr.includes('var(--red)'), hr.slice(0, 200));
  const hn = feedback(wdPace({ startDate: TODAY, raceDate: soon, cardioGoals: { run: { id: 'run_5k', label: '5K' } } }));
  assert.ok(hn.includes(CARD.nrc) && !hn.includes('Less than a week away —'), hn.slice(0, 200));
  for (const s of Object.values(CARD).concat(['Your test is in week 2. The program ends on it. The taper lands in front of it.'])) assert.doesNotMatch(s, /[-‐-―]/);
});

// ── one predicate (D184) ─────────────────────────────────────────────────────────────────────────────────────────
test("Table 6's last row is read in one place, progTestPin, and no week gate of the old shape is left", () => {
  // P1 (once for both zones: the source has no zone). Comments stripped; the stripped code must compile.
  const code = stripComments(appScript());
  assert.ok(compiles(code));
  const hits = [...code.matchAll(/NSW_TABLE6_INT\.length\s*-\s*1\b/g)].map(m => m.index);
  const fnAt = [...code.matchAll(/function\s+progTestPin\s*\(/g)].map(m => m.index);
  assert.equal(fnAt.length, 1);
  assert.equal(hits.length, 1);
  const open = code.indexOf('{', fnAt[0]); let d = 0, j = open;
  for (; j < code.length; j++) { if (code[j] === '{') d++; else if (code[j] === '}') { d--; if (d === 0) break; } }
  assert.ok(hits[0] > open && hits[0] < j, 'inside function progTestPin');
  assert.deepEqual([...code.matchAll(/<=\s*(len|totalWeeksPreview|recommended)\b/g)].map(m => m.index), []);
});

test('the snap lattice holds 120,050 points, 1,206 of them a short week that holds the test, split as the ruling counts them', () => {
  // R1's oracle against the ruling's typed counts (zone free: date arithmetic only)
  const seg = {}, byRest = {};
  for (const x of L.C_POINTS) { seg[L.segOf(x.eo)] = (seg[L.segOf(x.eo)] || 0) + 1; byRest[x.rk] = (byRest[x.rk] || 0) + 1; }
  assert.equal(L.SNAP_LATTICE.length, 120050);
  assert.equal(L.C_POINTS.length, 1206);
  assert.deepEqual(seg, { '==': 42, '>': 1134, '<': 30 });
  assert.deepEqual(byRest, { 'thu..sun': 580, 'fri,sat,sun': 344, 'sat,sun': 170, sun: 56, 'sun,wed': 56 });
  assert.equal(L.C_CELLS.length, 603);
});

// ── one length on every surface, and the start that holds the test (D184), in both zones ────────────────────────
const INTERIM_TYPED = 'Your test is in week 27. The test block is 26 weeks. This program builds 11 weeks now. Start a test block when the test is 26 weeks out.';
const Q4 = 'That week holds your test. Nothing left to train before it ✓';
const WEEKDAYS = { '2026-09-21': 'mon', '2026-09-22': 'tue', '2026-11-01': 'sun', '2026-12-28': 'mon', '2027-02-04': 'thu', '2027-03-14': 'sun',
  '2027-03-15': 'mon', '2027-03-18': 'thu', '2027-03-22': 'mon', '2027-03-25': 'thu', '2027-04-15': 'thu' };
const RULING_WEEKS = [['2027-02-04', 20], ['2026-12-28', 15], ['2027-03-15', 26], ['2027-03-18', 26], ['2027-03-22', 27], ['2027-03-25', 27], ['2026-09-14', null]];

for (const [zone, tz, offsets] of [['New York', 'America/New_York', [300, 240]], ['UTC', 'UTC', [0, 0]]]) {
  describe('in ' + zone, () => {
    let V;
    before(() => { process.env.TZ = tz; V = L.wizardVM('2026-09-22', 21, 16); });

    test('the zone is the one asked for, the clock pin reaches the app, and the hand week oracle agrees with the ruling', () => {
      // Z0, Z1, Z2
      assert.deepEqual([new Date(2027, 2, 13, 12).getTimezoneOffset(), new Date(2027, 2, 15, 12).getTimezoneOffset()], offsets);
      for (const [iso, d] of Object.entries(WEEKDAYS)) {
        assert.equal(X.dayKey(iso), d, iso);
        assert.equal(X.fromCiv(X.civI(iso)), iso);
        assert.equal(X.JS7[((X.civI(iso) % 7) + 11) % 7], d, iso + ' by day count');
      }
      for (const [t, w] of RULING_WEEKS) assert.equal(X.handWeek(L.W1MON, t), w, t);
      for (let k = 1; k <= 30; k++) assert.deepEqual([X.dayKey(L.thuOfWeek(k)), X.handWeek(L.W1MON, L.thuOfWeek(k)), X.handWeek('2026-09-22', L.thuOfWeek(k))], ['thu', k, k]);
      assert.equal(L.interim(27, 11), INTERIM_TYPED);
      assert.equal(V.IA.eval('(function(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + d.getHours() + ":" + d.getMinutes(); })()'), '2026-09-22 21:16');
      assert.equal(V.IA.eval('Date.now()'), new Date(2026, 8, 22, 21, 16).getTime());
    });

    test("a 1 mi 6:00 beginner tested Thu 2027-02-04 from Mon 2026-09-21 builds 20 weeks, pins 20, and the trial is W20 Thursday", () => {
      // RD: the ruling's After cell
      V.today('2026-09-22');
      L.setWD(V, { primaryPath: 'event', cardioTypes: ['run'], experience: 'beginner', ageBracket: '18-35', eventTargeted: true, raceDate: '2027-02-04',
        liftingFocus: 'support_prevention', equipment: 'crossfit', restDays: ['sun', 'wed'], unit: 'lbs', seed: 4242, name: 'M', startDate: L.W1MON,
        cardioGoals: { run: { id: 'run_pace_goal', label: 'x', targetDist: '1', paceUnit: 'mi', targetMins: '6', targetSecs: '0', targetTime: '6:00' } } });
      const g = L.gen(V);
      assert.ok(!g.err, g.err);
      assert.deepEqual([g.p.startDate, g.p.totalWeeks, g.cfg._testWeek, g.cfg._raceDateCappedWeeks], [L.W1MON, 20, 20, 20]);
      assert.deepEqual(L.trialCards(g.p), ['W20 thu 1 Mile Test — TIME TRIAL']);
      assert.equal(g.sub, 'Building your 20-week program...');
    });

    test('weeks 1 to 26: the goal step header, the name step, the generate screen and the built program all print the test week', () => {
      // B1248 on a sample: every fifth group (goal x experience x mile), four test weeks each; a non-beginner with no mile refuses
      V.today('2026-09-22');
      let n = 0, refusals = 0;
      X.every(L.LENGTH_GROUPS, 5).forEach((g, j) => {
        const r = L.lengthGroup(V, g, [...new Set([1, 1 + ((7 * j) % 26), 13 + (j % 13), 26])]);
        assert.deepEqual(r.bad, [], g.gl + ' ' + g.exp);
        n += r.inN; refusals += r.refuseIn;
      });
      assert.ok(n >= 30 && refusals > 0 && refusals < n, `${n} cells, ${refusals} refusals`);
    });

    test('weeks 27 to 30: the card prints the interim sentence, every surface prints the goal length, and no trial is built', () => {
      // K27 on a sample, and its typed anchor: PRT TING tested Thu 2027-03-25 (week 27) builds its 11-week goal
      V.today('2026-09-22');
      let n = 0;
      X.every(L.LENGTH_GROUPS, 5).forEach((g, j) => { const r = L.lengthGroup(V, g, [27 + (j % 4)]); assert.deepEqual(r.bad, [], g.gl + ' ' + g.exp); n += r.outN; });
      assert.ok(n >= 8);
      const o = X.prtTing({ raceDate: '2027-03-25' });
      L.setWD(V, o); const c = L.copy(V); L.setWD(V, o); const g = L.gen(V);
      assert.ok(!c.err && !g.err, c.err || g.err);
      assert.equal(c.fb, INTERIM_TYPED);
      assert.deepEqual([c.hdr, c.name, g.sub, g.p.totalWeeks, L.trialCards(g.p).length], [11, 11, 'Building your 11-week program...', 11, 0]);
    });

    test('a start whose short week holds the test keeps the entered day with holdsTest, and no other start moves for a test date', () => {
      // R1 on a sample: every (c) point and every thirteenth other point
      const pts = L.C_POINTS.concat(X.every(L.SNAP_LATTICE.filter(x => !x.c), 13));
      const r = L.resolverPoints(V, pts);
      assert.equal(r.cOk, L.C_POINTS.length);
      assert.equal(r.moved, 0);
      assert.deepEqual(r.bad, []);
    });

    test('a program built from such a start is one week, starts on the entered day and carries only the trial, on the test weekday', () => {
      // R2 on a sample: every seventh (c) cell of the 1.5 mi goal, the experience level rotating
      const cells = X.every(L.C_CELLS, 7);
      let r = { n: 0, seg: {}, bad: [] };
      L.EXPERIENCE.forEach((exp, i) => { const s = L.snapBuilds(V, cells.filter((_, k) => k % 3 === i), [exp]); r.n += s.n; r.bad.push(...s.bad); for (const k in s.seg) r.seg[k] = (r.seg[k] || 0) + s.seg[k]; });
      assert.deepEqual(Object.keys(r.seg).sort(), ['<', '==', '>'], 'entered before, on and after today');
      assert.deepEqual(r.bad, []);
    });

    test('the name step says the week holds the test, with the entered day, and never "today" or "this week"', () => {
      // R3 on a sample of the (c) cells
      const r = L.snapNameStep(V, X.every(L.C_CELLS, 7));
      assert.ok(r.seg['=='] > 0 && r.seg['>'] > 0 && r.seg['<'] > 0, JSON.stringify(r.seg));
      assert.deepEqual(r.bad, []);
    });

    test('a short week that does not hold the test still snaps to Monday and says so', () => {
      // R3S: entered Thu 2026-09-24 with Thursday to Sunday rest, test Tue 2026-09-29, outside that week.
      const x = { today: '2026-09-24', start: '2026-09-24', rk: 'thu..sun', race: '2026-09-29', gl: L.G15, eo: 0 };
      assert.ok(!L.isC(x.start, L.RESTS[x.rk], x.race));
      V.today(x.today); L.setWD(V, L.snapCfg(x, 'intermediate'));
      assert.equal(String(L.nameStep(V)).replace(/<[^>]+>/g, ''), 'Nothing left to train that week, so this starts Mon, Sep 28. Week 1 runs Sep 28 – Oct 4.');
    });

    test('the race date card on such a week says the test is in week 1 with nothing left to train, in the signal colour, with no Primer or shakeout', () => {
      // R4 on a sample, and the two cells the ruling names: A (today Thu 2026-09-24, entered today, test Sat) and B (entered Thu 2026-10-08, test Sat 2026-10-10)
      const has = (t, s, rk, q) => L.C_CELLS.find(x => x.today === t && x.start === s && x.rk === rk && x.race === q);
      const A = has('2026-09-24', '2026-09-24', 'thu..sun', '2026-09-26'), Bc = has('2026-09-21', '2026-10-08', 'thu..sun', '2026-10-10');
      assert.ok(A && Bc, 'cells A and B are (c) cells');
      const r = L.snapCallout(V, X.every(L.C_CELLS, 7).concat([A, Bc]));
      assert.ok(r.seg['=='] > 0 && r.seg['>'] > 0 && r.seg['<'] > 0, JSON.stringify(r.seg));
      assert.deepEqual(r.bad, []);
    });

    test('the race date card keeps its sentences on other weeks: a test this week with a start today, and week 3', () => {
      // R4D: today Mon 2026-09-21, no start chosen, Sunday rest, test Thu 2026-09-24 (week 1, not a (c) cell).
      // R4B: today Mon 2026-09-21, no start chosen, Thursday to Sunday rest, test Sat 2026-10-10 (week 3).
      for (const [rk, race, week, want] of [['sun', '2026-09-24', 1, 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.'],
        ['thu..sun', '2026-10-10', 3, 'Your test is in week 3. The program ends on it. The taper lands in front of it.']]) {
        const x = { today: '2026-09-21', rk, race, gl: L.G15 };
        assert.ok(!L.isC(x.today, L.RESTS[rk], race) && X.handWeek(x.today, race) === week);
        V.today(x.today); L.setWD(V, L.snapCfg(x, 'intermediate'));
        assert.ok(L.txt(L.callout(V)).startsWith(want), L.txt(L.callout(V)).slice(0, 140));
      }
    });

    test('moving the start into a week that holds the test keeps the entered day, pins week 1 and says so: on, after and before today', () => {
      // R6: cells A (==), B (>) and C (<)
      for (const [seg, today, rk, race, built, entered] of [['==', '2026-09-24', 'thu..sun', '2026-09-26', '2026-09-28', '2026-09-24'],
        ['>', '2026-09-21', 'thu..sun', '2026-10-10', undefined, '2026-10-08'], ['<', '2026-09-27', 'sat,sun', '2026-09-27', '2026-09-28', '2026-09-26']]) {
        assert.ok(L.isC(entered, L.RESTS[rk], race) && X.handWeek(entered, race) === 1 && L.segOf(X.civI(entered) - X.civI(today)) === seg, 'oracle ' + seg);
        V.today(today);
        const r = L.redate(V, L.snapCfg({ today, start: built, rk, race, gl: L.G15 }, 'intermediate'), entered);
        assert.ok(!r.err, r.err);
        assert.deepEqual([r.start, r.tw, r.cap, r.toasts], [entered, 1, 1, [Q4]], seg);
        assert.ok(!r.toasts.some(m => m.includes('—')));
      }
    });

    test('moving the start into a short week without the test snaps to the next Monday, with the plain snap toast', () => {
      // R6S: the R3S cell, built from Mon 2026-09-21, re-dated to Thu 2026-09-24.
      V.today('2026-09-24');
      const r = L.redate(V, L.snapCfg({ today: '2026-09-24', start: '2026-09-21', rk: 'thu..sun', race: '2026-09-29', gl: L.G15 }, 'intermediate'), '2026-09-24');
      assert.ok(!r.err, r.err);
      assert.equal(r.start, '2026-09-28');
      assert.deepEqual(r.toasts, ['Nothing to train that week. Starts ' + L.dayU('2026-09-28') + ' ✓']);
    });

    test("a race goal moved into its race week still snaps: HALF_MANNY with Thursday to Sunday rest, re-dated to Thu 2026-12-03", () => {
      // R6N: the (c) shape by date, but a race goal has no test date for the resolver; it snaps to Mon 2026-12-07.
      const o = Object.assign(clone(fixtures.HALF_MANNY), { restDays: ['thu', 'fri', 'sat', 'sun'] });
      assert.ok(o.cardioGoals.run.id === 'run_half' && o.raceDate === '2026-12-06' && L.isC('2026-12-03', o.restDays, o.raceDate));
      V.today('2026-09-22');
      const r = L.redate(V, o, '2026-12-03');
      assert.ok(!r.err, r.err);
      assert.equal(r.start, '2026-12-07');
      assert.equal(r.toasts.length, 1);
      assert.ok(r.toasts[0].startsWith('Nothing to train that week') && r.toasts[0] !== Q4, r.toasts[0]);
    });
  });
}
