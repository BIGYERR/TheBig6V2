// g207_test_calendar.js — the gate for D106a slice C (coach, Mario concurred): the calendar
// controls and the copy around a test goal's test week.
//   C3 one-time backfill in refreshProgram: a STORED dated test goal with no _testWeek key gets
//      one from its stored start (null when the test is past, before the start, or beyond the
//      goal length), persisted, so the key exists and it never runs again. Trained days stay
//      byte-identical through the per-day freeze.
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
//
// VERSION PREDICATE (standing ruling 4). D106a ships on ia-version 207. Below 207 every row is
// NOT APPLICABLE and skipped, never a bare PASS.
'use strict';
process.env.TZ = 'America/New_York';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA0 = H.load(ART);
const VER = +IA0.version;
const D106A_ERA = 207;

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function summary(){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }
const ROWS = ['C3a','C3b','C3c','C3d','C3e','C3f','C3g','C3h','C1a','C1b','C1c','C4a','C4b','C4c','C4d','C4e','C4f'];
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
  const pStart = iso(addDays(S, -42)), pTest = iso(addDays(S, -14));   // week 5 of that start, and in the past
  const P = stored(pace({raceDate:pTest, _raceDateCappedWeeks:11}), pStart, 'p_c3_past');
  const q = tryRefresh(P.V, P.read());
  ok('C3g a past test (start ' + pStart + ', test ' + pTest + ', week 5 but before today) writes the key null and keeps 11 weeks',
     !q.crash && own(q.cfg, '_testWeek') && q.cfg._testWeek === null && q.cfg._raceDateCappedWeeks === 11 && q.totalWeeks === 11 && P.read().cfg._testWeek === null,
     q.crash || JSON.stringify({tw: q.cfg._testWeek, cap: q.cfg._raceDateCappedWeeks, weeks: q.totalWeeks}));
  const far = iso(addDays(S, 7 * 14));   // week 15 > the 11-week goal length (D138)
  const F = stored(pace({raceDate:far, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_far');
  const f = tryRefresh(F.V, F.read());
  ok('C3h a test beyond the goal length (' + far + ', week 15 of 11) writes the key null and keeps 11 weeks',
     !f.crash && own(f.cfg, '_testWeek') && f.cfg._testWeek === null && f.cfg._raceDateCappedWeeks === 11 && f.totalWeeks === 11,
     f.crash || JSON.stringify({tw: f.cfg._testWeek, cap: f.cfg._raceDateCappedWeeks, weeks: f.totalWeeks}));
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
{
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
}
summary();
