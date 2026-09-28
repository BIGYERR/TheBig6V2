// g207_test_calendar.js — the gate for D106a slice C (coach, Mario concurred): the calendar
// controls and the copy around a test goal's test week.
//   C3 the backfill in refreshProgram (D106a; C3g to C3j re-keyed V223 for D184 P-TESTLEN,
//      tests/measure/v223_rulings/p_testlen_d184_ruling.md Q1): a STORED dated test goal whose
//      _testWeek is absent or null re-derives its test week from its stored start each boot
//      until it pins. It pins when the test is in weeks 1 to 26 (the rows of Table 6) and not
//      past, and persists both pins, so the key is numeric and it stops running. Otherwise it
//      writes nothing: the key stays as it was (absent or null) and the stored length stands.
//      Trained days stay byte-identical through the per-day freeze.
//   C1 setProgStart re-pins a dated test goal from the new start and refreshes (setProgRace's
//      shape: untrained weeks re-pin, trained weeks stay frozen).
//   C2 / A4 coach's verbatim copy: the red card under a week, and the wizard sentence.
//
// STUB AND STORE PATTERN: tests/gates/g202_d108_touchset_freeze.js. One fresh VM per scenario;
// the stored program is written into ia_programs, a trained day is proved by an ia_hist_
// snapshot keyed by the app's own completedKey, and a "reload" is the app's own
// refreshProgram(storedProg) against that same store.
//
// ORACLES, all independent of the engine:
//   * DATES are computed here from the real clock, never literals, because the backfill's
//     "past" rule reads today: S = the next Monday strictly after today, and the test is
//     S + 28 days, which is week 5 by Monday arithmetic done in this file. A start one week
//     later makes the same test week 4. The goal length of the fixture is 11 weeks (recorded
//     in the D106a ruling as the g202_d108 literal).
//   * FROZEN = the fixture's OWN stored bytes (a sentinel W1 Mon written into the stored grid
//     and its ia_hist_ snapshot). The anti-vacuity row proves a fresh build of that day
//     differs from the sentinel, so "frozen" is a real claim.
//   * RUNS ONCE: after the backfill, the stored start is moved a week later and the program
//     refreshed again. A backfill that re-ran would now derive week 4; the key keeps 5.
//   * COPY: coach's strings verbatim, and no dash in either new sentence.
//   * D184 ROWS, no licence predicate (the ruling keeps no row's old direction): C3g, C3h and C3i
//     fail on V222 and pass on V223; C3j and C3d are controls and pass on both. Weeks are Monday
//     arithmetic from S: S + 7(k - 1) days is week k, so S + 91 is week 14, S + 98 is week 15 and
//     S + 189 is week 28 (past Table 6's 26 rows). "Writes nothing" is proved against the
//     fixture's OWN stored cfg bytes in ia_programs, read before the refresh (canon, keys sorted).
//
// VERSION PREDICATE (standing ruling 4). D106a ships on ia-version 207. Below 207 every row is
// NOT APPLICABLE and skipped, never a bare PASS.
//
// SECOND PREDICATE, the C4 copy rows (re-keyed V223 for D183 P-SAFEPACE R3 and amendments 2 and 3,
// tests/measure/v223_rulings/p_safepace_ruling.md; tests/edits/v223_t2_d183_rekey_g207_g218_g203.py).
// Standing rulings 2 and 4: the D106a C4 rows are licensed at ia-version <= 222 (their era) and do
// not run above it; the D183 C4 rows run at >= 223 and assert R3's card copy and colour, typed from
// the ruling. C4d derives its test week by hand (Monday weeks, the D25 start snap, rest sun/wed).
// IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run; it is
// announced, ignored on any other stamp, and gate.sh never sets it.
'use strict';
process.env.TZ = 'America/New_York';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA0 = H.load(ART);
const VER = +IA0.version;
const D106A_ERA = 207;
const D183_ERA = 223;
const ERA_V = (process.env.IA_ASSUME_VERSION === String(D183_ERA) && VER === D183_ERA - 1) ? D183_ERA : VER;
if(ERA_V !== VER) console.log('ASSUMED ia-version ' + ERA_V + ' on a file stamped ' + VER + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function summary(){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }
const ROWS = ['C3a','C3b','C3c','C3d','C3e','C3f','C3g','C3h','C3i','C3j','C1a','C1b','C1c','C4a','C4b','C4c','C4d','C4e','C4f'];
if(VER < D106A_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D106a (V' + D106A_ERA + ').');
  for(const r of ROWS) skipRow(r + ' skipped below the D106a era');
  summary();
}

// ── dates, by hand ───────────────────────────────────────────────────────────────────
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const addDays = (d, n) => { const x = new Date(d); x.setDate(d.getDate() + n); x.setHours(0, 0, 0, 0); return x; };
const S = addDays(TODAY, ((8 - TODAY.getDay()) % 7) || 7);          // next Monday strictly after today
const S_ISO = iso(S), S7_ISO = iso(addDays(S, 7)), R_ISO = iso(addDays(S, 28));   // test = week 5 from S
console.log('# dates: today ' + iso(TODAY) + ', S ' + S_ISO + ' (Mon), test ' + R_ISO + ' (Mon, week 5 from S, week 4 from ' + S7_ISO + ')');

const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function pace(over){
  return Object.assign({
    name:'PRT TING', primaryPath:'event', eventTargeted:true, raceDate:R_ISO, cardioTypes:['run'],
    cardioGoals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15',
      mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}},
    liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs',
    restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315, seed:24865
  }, over || {});
}
const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const isTrial = c => !!c && /TIME TRIAL/.test(String(c.subtype || ''));

// A stored program in a fresh VM, with a trained (sentinel) W1 Mon proved by ia_hist_.
function stored(cfg, startIso, id){
  const V = H.load(ART);
  const p = clone(V.buildProgram(clone(cfg)));
  p.id = id; p.startDate = startIso;
  const day = p.weeks[1].mon;
  day.title = 'SENTINEL MON w1';
  const first = (day.sections || []).find(s => (s.items || []).length); if(first) first.items[0].name = 'Sentinel movement';
  const SENT = clone(day);
  V.localStorage.setItem('ia_programs', JSON.stringify([p]));
  V.localStorage.setItem('ia_active', p.id);
  const h = {}; h[V.eval('completedKey')(1, 'mon')] = clone(SENT);
  V.localStorage.setItem('ia_hist_' + p.id, JSON.stringify(h));
  const read = () => JSON.parse(V.localStorage.getItem('ia_programs'))[0];
  return { V, p, SENT, read };
}
function tryRefresh(V, prog){ try { return V.refreshProgram(prog); } catch(e){ return {crash: e.message}; } }

// ── C3 — the one-time backfill ───────────────────────────────────────────────────────
{
  const L = stored(pace({_raceDateCappedWeeks:11}), S_ISO, 'p_c3');
  const pre = L.read();
  const a = tryRefresh(L.V, L.read());
  const per = L.read();
  ok('C3a stored pre-V207 test goal (no _testWeek, 11 weeks, start ' + S_ISO + ', test ' + R_ISO + '): refresh writes _testWeek 5 and _raceDateCappedWeeks 5, builds 5 weeks, and persists both',
     !own(pre.cfg, '_testWeek') && pre.totalWeeks === 11 && !a.crash && a.cfg._testWeek === 5 && a.cfg._raceDateCappedWeeks === 5
       && a.totalWeeks === 5 && per.cfg._testWeek === 5 && per.cfg._raceDateCappedWeeks === 5,
     JSON.stringify({preKey: own(pre.cfg, '_testWeek'), preWeeks: pre.totalWeeks, crash: a.crash, tw: a.cfg && a.cfg._testWeek, cap: a.cfg && a.cfg._raceDateCappedWeeks, weeks: a.totalWeeks, persisted: per.cfg._testWeek}));
  const fresh = L.V.buildProgram(clone(pace({_raceDateCappedWeeks:5, _testWeek:5})));
  ok('C3b the trained W1 Mon is byte-identical to the stored sentinel (and a fresh build of it differs, so the freeze is real)',
     !a.crash && canon(a.weeks[1].mon) === canon(L.SENT) && fresh.weeks[1].mon.title !== L.SENT.title,
     a.crash || (a.weeks[1].mon && a.weeks[1].mon.title));
  ok('C3c the backfilled program prints the trial on the test weekday (W5 Mon)', !a.crash && isTrial(a.weeks[5] && a.weeks[5].mon && a.weeks[5].mon.cardio),
     a.crash || JSON.stringify(a.weeks[5] && a.weeks[5].mon && a.weeks[5].mon.cardio && a.weeks[5].mon.cardio.subtype));
  const p2 = L.read(); p2.startDate = S7_ISO;
  const b = tryRefresh(L.V, p2);
  ok('C3d it runs once: with the key present, moving the stored start a week later and refreshing again keeps _testWeek 5 (a re-run would derive 4)',
     !b.crash && b.cfg._testWeek === 5 && L.read().cfg._testWeek === 5, b.crash || (b.cfg._testWeek + '/' + L.read().cfg._testWeek));
}
{
  const N = stored(Object.assign({}, H.fixtures.HALF_MANNY), S_ISO, 'p_c3_nrc');
  const a = tryRefresh(N.V, N.read());
  ok('C3e a stored NRC program (HALF_MANNY) is untouched: no _testWeek key in memory or in storage, length unchanged',
     !a.crash && !own(a.cfg, '_testWeek') && !own(N.read().cfg, '_testWeek') && a.totalWeeks === N.p.totalWeeks, a.crash || JSON.stringify({key: own(a.cfg, '_testWeek'), weeks: a.totalWeeks}));
  const U = stored(pace({eventTargeted:false, raceDate:'', _raceDateCappedWeeks:11}), S_ISO, 'p_c3_nodate');
  const u = tryRefresh(U.V, U.read());
  ok('C3f a stored pace program without a test date is untouched: no _testWeek key, 11 weeks',
     !u.crash && !own(u.cfg, '_testWeek') && !own(U.read().cfg, '_testWeek') && u.totalWeeks === 11, u.crash || JSON.stringify({key: own(u.cfg, '_testWeek'), weeks: u.totalWeeks}));
  // D184 (P-TESTLEN, V223): the backfill writes nothing unless the test pins. cfgBytes is the
  // fixture's own stored cfg in ia_programs; read before the refresh, it is the "no write" oracle.
  const cfgBytes = X => canon(X.read().cfg);
  const DOW = ['sun','mon','tue','wed','thu','fri','sat'];   // Date.getDay() order
  const pStart = iso(addDays(S, -42)), pTest = iso(addDays(S, -14));   // week 5 of that start, and in the past
  const P = stored(pace({raceDate:pTest, _raceDateCappedWeeks:11}), pStart, 'p_c3_past');
  const pBytes = cfgBytes(P);
  const q = tryRefresh(P.V, P.read());
  ok('C3g a past test (start ' + pStart + ', test ' + pTest + ', week 5 but before today) writes nothing (D184): no _testWeek key in memory or in ia_programs, the stored cfg bytes unchanged, cap 11, 11 weeks',
     !q.crash && !own(q.cfg, '_testWeek') && !own(P.read().cfg, '_testWeek') && cfgBytes(P) === pBytes
       && q.cfg._raceDateCappedWeeks === 11 && q.totalWeeks === 11,
     q.crash || JSON.stringify({memKey: own(q.cfg, '_testWeek'), storeKey: own(P.read().cfg, '_testWeek'), tw: q.cfg._testWeek, cap: q.cfg._raceDateCappedWeeks, weeks: q.totalWeeks, bytesEqual: cfgBytes(P) === pBytes}));
  const farD = addDays(S, 7 * 14), far = iso(farD), farDay = DOW[farD.getDay()];   // week 15 of the 11-week goal
  const F = stored(pace({raceDate:far, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_far');
  const f = tryRefresh(F.V, F.read());
  const fp = F.read().cfg, fDay = !f.crash && f.weeks && f.weeks[15] && f.weeks[15][farDay];
  ok('C3h a test past the goal length (' + far + ', week 15 of 11) pins it (D184): _testWeek 15, _raceDateCappedWeeks 15, 15 weeks, both persisted, and the trial sits in W15 on the test weekday (' + farDay + ')',
     !f.crash && f.cfg._testWeek === 15 && f.cfg._raceDateCappedWeeks === 15 && f.totalWeeks === 15
       && fp._testWeek === 15 && fp._raceDateCappedWeeks === 15 && isTrial(fDay && fDay.cardio),
     f.crash || JSON.stringify({tw: f.cfg._testWeek, cap: f.cfg._raceDateCappedWeeks, weeks: f.totalWeeks, persisted: [fp._testWeek, fp._raceDateCappedWeeks], w15: fDay && fDay.cardio && fDay.cardio.subtype}));
  // C3i: the population the D184 backfill exists for, the V209 shape the ruling names (_testWeek
  // stored null because the old gate stopped at the goal length; the test in week 14 of 11, M8 S3's
  // example). It re-pins and persists, and the trained W1 Mon holds through the re-pin.
  const i14 = iso(addDays(S, 7 * 13));
  const I = stored(pace({raceDate:i14, _testWeek:null, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_v209');
  const ii = tryRefresh(I.V, I.read());
  const ip = I.read().cfg, iW1 = !ii.crash && ii.weeks && ii.weeks[1] && ii.weeks[1].mon;
  const iFresh = I.V.buildProgram(clone(pace({raceDate:i14, _testWeek:14, _raceDateCappedWeeks:14})));
  ok('C3i the V209 shape (_testWeek null, test ' + i14 + ', week 14 of 11) re-pins (D184): _testWeek 14, _raceDateCappedWeeks 14, 14 weeks, both persisted, and the trained W1 Mon is byte-identical to the sentinel (a fresh build of it differs)',
     !ii.crash && ii.cfg._testWeek === 14 && ii.cfg._raceDateCappedWeeks === 14 && ii.totalWeeks === 14
       && ip._testWeek === 14 && ip._raceDateCappedWeeks === 14
       && !!iW1 && canon(iW1) === canon(I.SENT) && iFresh.weeks[1].mon.title !== I.SENT.title,
     ii.crash || JSON.stringify({tw: ii.cfg._testWeek, cap: ii.cfg._raceDateCappedWeeks, weeks: ii.totalWeeks, persisted: [ip._testWeek, ip._raceDateCappedWeeks], w1mon: iW1 && iW1.title}));
  // C3j (control, passes on both): _testWeek null with the test in week 28, past Table 6. No pin, no write.
  const j28 = iso(addDays(S, 7 * 27));
  const J = stored(pace({raceDate:j28, _testWeek:null, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_w28');
  const jBytes = cfgBytes(J);
  const jj = tryRefresh(J.V, J.read());
  ok('C3j control: _testWeek null with the test in week 28 (' + j28 + ') stays null in memory and in ia_programs, the stored cfg bytes unchanged, cap 11, 11 weeks',
     !jj.crash && own(jj.cfg, '_testWeek') && jj.cfg._testWeek === null && J.read().cfg._testWeek === null && cfgBytes(J) === jBytes
       && jj.cfg._raceDateCappedWeeks === 11 && jj.totalWeeks === 11,
     jj.crash || JSON.stringify({tw: jj.cfg._testWeek, stored: J.read().cfg._testWeek, cap: jj.cfg._raceDateCappedWeeks, weeks: jj.totalWeeks, bytesEqual: cfgBytes(J) === jBytes}));
}

// ── C1 — setProgStart re-pins ─────────────────────────────────────────────────────────
function moveStart(X, dateIso){
  let err = null;
  X.V.eval('activeProgId = ' + JSON.stringify(X.p.id) + '; activeProg = JSON.parse(localStorage.getItem("ia_programs"))[0];');
  try { X.V.eval('setProgStart(' + JSON.stringify(dateIso) + ')'); } catch(e){ err = e.message; }
  return { ap: X.V.eval('activeProg'), err };
}
{
  const T = stored(pace({_raceDateCappedWeeks:5, _testWeek:5}), S_ISO, 'p_c1');
  const {ap, err} = moveStart(T, S7_ISO);
  const per = T.read();
  ok('C1a setProgStart one week later (' + S7_ISO + ') on a test-pinned program re-pins _testWeek 4 and _raceDateCappedWeeks 4, builds 4 weeks, and persists the pin' + (err ? ' [setProgStart threw after the fact: ' + err + ']' : ''),
     ap && ap.startDate === S7_ISO && ap.cfg._testWeek === 4 && ap.cfg._raceDateCappedWeeks === 4 && ap.totalWeeks === 4 && per.cfg._testWeek === 4,
     JSON.stringify({start: ap && ap.startDate, tw: ap && ap.cfg._testWeek, cap: ap && ap.cfg._raceDateCappedWeeks, weeks: ap && ap.totalWeeks, persisted: per.cfg._testWeek}));
  ok('C1b the trained W1 Mon stays byte-identical to the stored sentinel through the re-pin',
     !!(ap && ap.weeks && ap.weeks[1]) && canon(ap.weeks[1].mon) === canon(T.SENT), ap && ap.weeks && ap.weeks[1] && ap.weeks[1].mon && ap.weeks[1].mon.title);
  const N = stored(Object.assign({}, H.fixtures.HALF_MANNY), S_ISO, 'p_c1_nrc');
  const m = moveStart(N, S7_ISO);
  ok('C1c setProgStart on an NRC program writes no test pin', !!m.ap && !own(m.ap.cfg, '_testWeek'), m.ap && JSON.stringify(m.ap.cfg._testWeek));
}

// ── C4 — the copy (C2 red card, A4 wizard sentence) ──────────────────────────────────
const A4_5 = 'Your program ends on your test. 5 weeks. The taper lands in front of it.';
const A4_1 = 'Your program ends on your test. 1 week. The taper lands in front of it.';
const RED  = 'Your test is less than a week away. You get the test week only. Primer lifts, a shakeout, then the test.';
const RED_OLD = 'Less than a week away — not enough time to train.';
const INTACT = 'stays intact';
function feedback(wd){
  const V = H.load(ART);
  V.eval("(function(){ const o = document.getElementById; const m = {}; document.getElementById = function(id){ if(id === 'raceDateInput') return null; return m[id] || (m[id] = o.call(document, id)); }; })()");
  V.eval('Object.assign(WD, ' + JSON.stringify(wd) + ')');
  try { V.eval('updateRaceDateFeedback()'); } catch(e){ return 'THREW ' + e.message; }
  return String(V.eval("document.getElementById('raceDateFeedback').innerHTML") || '');
}
const wdPace = over => Object.assign({cardioTypes:['run'], cardioGoals:pace().cardioGoals, experience:'intermediate', ageBracket:'18-35',
  liftingFocus:'balanced', eventTargeted:true, primaryPath:'event', restDays:['sun','wed']}, over || {});
const C4_ERA = ERA_V >= D183_ERA
  ? 'D183 era (ia-version ' + ERA_V + ' >= ' + D183_ERA + '): R3 card copy and colour'
  : 'D106a era (ia-version ' + ERA_V + ' <= ' + (D183_ERA - 1) + '): A4 sentence and the red card';
console.log('# C4 rows: ' + C4_ERA);
if(ERA_V < D183_ERA){
  const h5 = feedback(wdPace({startDate:S_ISO, raceDate:R_ISO}));
  ok('C4a wizard, test inside the goal length (start ' + S_ISO + ', test ' + R_ISO + '): coach\'s sentence verbatim, and "stays intact" is gone',
     h5.includes(A4_5) && !h5.includes(INTACT), h5.slice(0, 160));
  const s1 = iso(addDays(S, 7)), t1 = iso(addDays(S, 10));   // test on the Thursday of the start week
  const h1 = feedback(wdPace({startDate:s1, raceDate:t1}));
  ok('C4b wizard, test in the start week (start ' + s1 + ', test ' + t1 + '): the singular form', h1.includes(A4_1), h1.slice(0, 160));
  const hb = feedback(wdPace({startDate:iso(addDays(S, 35)), raceDate:R_ISO}));
  ok('C4c wizard, test before the start (no test week): the existing "stays intact" sentence stands and coach\'s does not print',
     hb.includes(INTACT) && !hb.includes('Your program ends on your test.'), hb.slice(0, 160));
  const soon = iso(addDays(TODAY, 3));
  const hr = feedback(wdPace({startDate:iso(TODAY), raceDate:soon}));
  ok('C4d red card, test goal under a week out (' + soon + '): coach\'s sentence verbatim, still red', hr.includes(RED) && hr.includes('var(--red)') && !hr.includes(RED_OLD), hr.slice(0, 200));
  const hn = feedback(wdPace({startDate:iso(TODAY), raceDate:soon, cardioGoals:{run:{id:'run_5k', label:'5K'}}}));
  ok('C4e red card, NRC 5K under a week out: the existing sentence stands', hn.includes(RED_OLD) && !hn.includes(RED), hn.slice(0, 200));
  ok('C4f no dash in either new sentence', ![A4_5, A4_1, RED].some(s => /[-‐-―]/.test(s)) && h5.includes(A4_5) && hr.includes(RED));
} else {
  console.log('  n/a  the D106a C4 rows are licensed at ia-version <= ' + (D183_ERA - 1) + ' only; ia-version ' + ERA_V + ' runs the D183 C4 rows in their place');
  // R3's card sentences, typed from the ruling (never read from the app).
  const T_W5 = 'Your test is in week 5. The program ends on it. The taper lands in front of it.';
  const T_TW1 = 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.';
  const T_NULL = 'Your test is before your first training day. This program starts after it and does not include it.';
  const T_WK = n => 'Your test is in week ' + n + '. The program ends on it. The taper lands in front of it.';
  const NT_1WK = 'Less than a week away. Not enough time to train.';
  const h5 = feedback(wdPace({startDate:S_ISO, raceDate:R_ISO}));
  ok('C4a D183 era, test in week 5 (start ' + S_ISO + ', test ' + R_ISO + '): the R3 sentence verbatim, and "stays intact" is gone',
     h5.includes(T_W5) && !h5.includes(INTACT), h5.slice(0, 200));
  const s1 = iso(addDays(S, 7)), t1 = iso(addDays(S, 10));   // test on the Thursday of the start week
  const h1 = feedback(wdPace({startDate:s1, raceDate:t1}));
  ok('C4b D183 era, test in the start week (start ' + s1 + ', test ' + t1 + '): the R3 tw 1 sentence verbatim', h1.includes(T_TW1), h1.slice(0, 200));
  const bs = iso(addDays(S, 35));
  const hb = feedback(wdPace({startDate:bs, raceDate:R_ISO}));
  ok('C4c D183 era, test before the start (start ' + bs + ', test ' + R_ISO + '): the --signal null row verbatim, neither "stays intact" nor "Your test is in week"',
     hb.includes('var(--signal)') && hb.includes(T_NULL) && !hb.includes(INTACT) && !hb.includes('Your test is in week'), hb.slice(0, 200));
  // The test week by hand: week 1 is the Monday week holding the start; a start whose remaining days of
  // that week are all rest (sun/wed here) snaps to the next Monday (D25). The test is today + 3.
  const ISO7 = ['mon','tue','wed','thu','fri','sat','sun'], REST = ['sun','wed'];
  const soonD = addDays(TODAY, 3), soon = iso(soonD);
  const off = (TODAY.getDay() + 6) % 7;                                   // 0 Mon .. 6 Sun
  const snapped = off > 0 && ISO7.slice(off).filter(k => !REST.includes(k)).length === 0;
  const startMon = addDays(TODAY, snapped ? 7 - off : -off);
  const testMon = addDays(soonD, -((soonD.getDay() + 6) % 7));
  const twHand = Math.round((testMon - startMon) / 86400000) / 7 + 1;
  const T_D = twHand === 1 ? T_TW1 : T_WK(twHand);
  const hr = feedback(wdPace({startDate:iso(TODAY), raceDate:soon}));
  ok('C4d D183 era, test goal under a week out (start ' + iso(TODAY) + ', test ' + soon + ', week ' + twHand + ' by hand' + (snapped ? ', D25 start snap to ' + iso(startMon) : '') + '): the matching R3 sentence verbatim, and never red',
     (twHand === 1 || twHand === 2) && hr.includes(T_D) && !hr.includes('var(--red)'), hr.slice(0, 200));
  const hn = feedback(wdPace({startDate:iso(TODAY), raceDate:soon, cardioGoals:{run:{id:'run_5k', label:'5K'}}}));
  ok('C4e D183 era, NRC 5K under a week out: the R3 sentence verbatim, and not the dashed text', hn.includes(NT_1WK) && !hn.includes(RED_OLD), hn.slice(0, 200));
  const NEW = [T_W5, T_TW1, T_NULL, T_WK(2), NT_1WK];
  ok('C4f D183 era, no dash in any typed sentence, and each renders on its case',
     !NEW.some(s => /[-‐-―]/.test(s)) && h5.includes(T_W5) && h1.includes(T_TW1) && hb.includes(T_NULL) && hr.includes(T_D) && hn.includes(NT_1WK));
}
summary();
