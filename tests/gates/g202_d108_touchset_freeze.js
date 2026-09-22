// V202 D108 / E14 — THE TOUCHED-SET READS ALL FOUR STORES.
//
// CLAIM UNDER TEST: a day the athlete has SEEN is frozen by ANY store that proves they
// saw it. ia_exw_ is a load written against a prescription; ia_hist_ is the snapshot of
// the prescription shown. Before D108 the touched-set read ia_comp_ and ia_logs_ only,
// so an exw-only day (reachable in the shipped app: selectKBSize calls logExerciseWeight
// and nothing else) and a hist-only day were both re-prescribed on the next boot.
//
// STUB REUSED: tests/measure/v202_persistence_D.js's persistence model — harness
// makeContext's Map-backed localStorage persists for the life of one IA instance, so a
// "reload" is calling the app's own boot-path function refreshProgram(storedProg) against
// that same store. (v202_persistence_C.js's cross-VM copy is not needed here: nothing in
// this gate changes artifacts mid-run.) No stub in this file takes a callback.
//
// ORACLE INDEPENDENCE (§10b): the frozen card is compared against THE FIXTURE'S OWN
// STORED BYTES — the sentinel week this file wrote into ia_programs, and the snapshot
// this file wrote into ia_hist_. The engine is never asserted equal to itself for the
// freeze rows. R4 is the anti-vacuity conjunct: it proves the live engine build of those
// same two days DIFFERS from the sentinel, so "frozen" is a real claim and not a tie.
// R3 is the CONTROL: a day with nothing stored must still rebuild. Without it this gate
// would pass on an engine that froze everything.
//
// ONE STORE PER SCENARIO, AND WHY. The cut is per-WEEK but the restore is per-DAY, so an
// exw-only day and a hist-only day sitting in the SAME week are not independent: either
// store alone lifts the cut past both, and the hist row then passes with ia_hist_ removed
// from the touched-set entirely. (Caught by sabotage M25, which did not trip.) So each
// store gets its OWN fresh VM with ONLY that store written, plus its own control day.
// Each row is then attributable to exactly one store.

const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
H.EXPORT_NAMES.push('completedKey', 'logKey', 'entryDay', 'exStoreKey');

const HTML = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(HTML);

let PASS = 0, FAIL = 0;
function row(id, ok, msg){ if(ok){ PASS++; console.log('  ok   ' + id + '  ' + msg); } else { FAIL++; console.log('  FAIL ' + id + '  ' + msg); } }

// ── canonical digest: recursive key sort. (JSON.stringify(v, keys.sort()) is an
// ALLOWLIST applied at every nesting level and silently strips sections/items, which
// makes every day compare equal — instrument defect, avoided here.)
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function exNamesOf(day){
  const out = [];
  if(!day || !Array.isArray(day.sections)) return out;
  day.sections.forEach(s => (s.items || []).forEach(i => { if(i && i.name) out.push(i.name); }));
  return out;
}
const clone = v => JSON.parse(JSON.stringify(v));

// ── PINNED CFG (the V202 PRT TING reporter config, seed pinned) ────────────────
const SEED = 24865;
const CFG = {
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:185, squat:245, deadlift:315, seed:SEED,
  cardioGoals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal',
    targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'30', targetTime:'10:30',
    mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'},
    baselineDist:'3', baseline:'3mi'}}
};

const W      = 4;        // a FUTURE week: start date is this week, so _curWk === 1
const DAY_P  = 'mon';    // the PROBE day: the only day with a record, in each scenario
const DAY_CT = 'thu';    // the CONTROL day: nothing written at all, in each scenario

console.log('== g202_d108_touchset_freeze  (ia-version ' + IA.version + ')');

// ── R0  build, and prove the baseline equals itself before diffing anything ────
const live = IA.buildProgram(clone(CFG));
const live2 = IA.buildProgram(clone(CFG));
row('R0', H.progDigest(live) === H.progDigest(live2),
  'pinned seed ' + SEED + ' is self-stable before any diff (digest ' + H.progDigest(live) + ')');

const haveWeek = !!(live.weeks && live.weeks[W]);
row('R0b', haveWeek && [DAY_P, DAY_CT].every(d => !!live.weeks[W][d]),
  'fixture week ' + W + ' carries the probe day ' + DAY_P + ' and the control day ' + DAY_CT);
if(!haveWeek){ console.log('PASS ' + PASS + ' FAIL ' + FAIL); process.exit(1); }

// ── SCENARIO BUILDER ───────────────────────────────────────────
// A STORED program whose week W differs from what the engine now builds. This is the
// "changed engine" the ruling describes, produced without touching the engine: the stored
// week carries sentinel bytes, so anything re-prescribed is visibly not the stored card.
// `only` is 'exw' or 'hist' and is the ONLY store written. Fresh VM per scenario.
function scenario(only){
  const V = H.load(HTML);
  const stored = clone(V.buildProgram(clone(CFG)));
  stored.id = 'p_d108_' + only;
  const r = V.resolveStartDate(V._isoToday(), ['sun','wed']);
  stored.startDate = (r && r.start) || V._isoToday();
  [DAY_P, DAY_CT].forEach(d => {
    const day = stored.weeks[W][d];
    day.title = 'SENTINEL ' + d.toUpperCase() + ' w' + W;
    const first = (day.sections || []).find(s => (s.items || []).length);
    if(first) first.items[0].name = 'Sentinel movement ' + d;
  });
  const SENT = clone(stored.weeks[W]);   // the fixture's own bytes: THE ORACLE
  V.localStorage.setItem('ia_programs', JSON.stringify([stored]));
  V.localStorage.setItem('ia_active', stored.id);

  let HIST = null, EXW = null, histKey = null;
  if(only === 'hist'){
    // keyed by the app's own completedKey
    histKey = V.completedKey(W, DAY_P);
    HIST = {}; HIST[histKey] = clone(SENT[DAY_P]);
    V.localStorage.setItem('ia_hist_' + stored.id, JSON.stringify(HIST));
  } else {
    // keyed by EXERCISE SLUG via the app's single writer of that slug (exStoreKey); the
    // week/day live on the ENTRY, which is why the touched-set has to DERIVE 'w<N>_<day>'
    // from entries rather than Object.assign the store.
    const exName = exNamesOf(SENT[DAY_P])[0] || 'Back squat';
    EXW = {}; EXW[V.exStoreKey(exName)] = { name: exName, entries: [
      { weight: 135, setsReps: '3x5', setsDone: [], setsW: [], week: W, day: DAY_P, ts: 1 }
    ]};
    V.localStorage.setItem('ia_exw_' + stored.id, JSON.stringify(EXW));
  }

  const isolated = ['ia_comp_', 'ia_logs_', 'ia_hist_', 'ia_exw_']
    .filter(p => V.localStorage.getItem(p + stored.id) !== null);
  const after = V.refreshProgram(JSON.parse(V.localStorage.getItem('ia_programs'))[0]);
  return { V, stored, SENT, HIST, histKey, after, A: (after.weeks && after.weeks[W]) || {}, isolated };
}

const SX = scenario('exw');
const SH = scenario('hist');

// ── R0c  each scenario really is a SINGLE-store fixture ──────────────────
row('R0c', SX.isolated.length === 1 && SX.isolated[0] === 'ia_exw_' &&
           SH.isolated.length === 1 && SH.isolated[0] === 'ia_hist_',
  'each scenario writes exactly ONE store (exw: [' + SX.isolated.join(',') + '], hist: [' + SH.isolated.join(',') + ']), so every row below is attributable to it alone');

// ── R4  ANTI-VACUITY (stated before the freeze rows because it licenses them) ──
row('R4', canon(live.weeks[W][DAY_P])  !== canon(SX.SENT[DAY_P]) &&
          canon(live.weeks[W][DAY_P])  !== canon(SH.SENT[DAY_P]) &&
          canon(live.weeks[W][DAY_CT]) !== canon(SX.SENT[DAY_CT]),
  'the live engine build of the probe and control days DIFFERS from the stored sentinel, so "frozen" is a real claim');

// ── R1  ia_exw_ ALONE freezes the day ───────────────────────────
row('R1', !!SX.A[DAY_P] && canon(SX.A[DAY_P]) === canon(SX.SENT[DAY_P]),
  'ia_exw_-ONLY day w' + W + '_' + DAY_P + ' is byte-identical to the fixture\'s stored card after reload');
row('R1c', !!SX.A[DAY_CT] && canon(SX.A[DAY_CT]) !== canon(SX.SENT[DAY_CT]) &&
           canon(SX.A[DAY_CT]) === canon(live.weeks[W][DAY_CT]),
  'CONTROL day w' + W + '_' + DAY_CT + ' in the exw scenario has no record and was REBUILT to the live build');

// ── R2  ia_hist_ ALONE freezes the day, against the fixture's own snapshot ───
row('R2', !!SH.A[DAY_P] && canon(SH.A[DAY_P]) === canon(SH.HIST[SH.histKey]),
  'ia_hist_-ONLY day w' + W + '_' + DAY_P + ' is byte-identical to the fixture\'s stored ia_hist_ snapshot');
row('R2c', !!SH.A[DAY_CT] && canon(SH.A[DAY_CT]) !== canon(SH.SENT[DAY_CT]) &&
           canon(SH.A[DAY_CT]) === canon(live.weeks[W][DAY_CT]),
  'CONTROL day w' + W + '_' + DAY_CT + ' in the hist scenario has no record and was REBUILT to the live build');

// ── R5  the freeze did not swallow the whole program ──────────────────
const laterW = W + 1;
row('R5', (!SX.after.weeks[laterW] || canon(SX.after.weeks[laterW]) === canon(live.weeks[laterW])) &&
          (!SH.after.weeks[laterW] || canon(SH.after.weeks[laterW]) === canon(live.weeks[laterW])),
  'week ' + laterW + ' (beyond the cut) is the live build in both scenarios: the cut is a frontier, not a blanket');

// ── R6  this edit moves no prescription: the pinned digest from the ruling ─────────
const mannyRow = H.MANNY_DIGEST_BY_VERSION[IA.version];
const manny = H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))));
row('R6', !!mannyRow && manny === mannyRow,
  'HALF MANNY matches the V' + IA.version + ' row of MANNY_DIGEST_BY_VERSION ('
  + (mannyRow || 'NO ROW') + '): got ' + manny + '. D108 changes no prescription; a move here '
  + 'is an unruled digest move, and an absent row is a missing pin, not a pass');

console.log('PASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
