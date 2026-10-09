// g238_d223_restlog.js — GATE for D223 (P-RESTMOVELOG: a rest-day jog is its own record on the day, restLog, and the
// moved-in session starts empty), D224 (readers: sums add the jog, pair readers ignore it, max readers take it as its own
// candidate; the journal prints the hero's sentence), D225, D226 and D227 (slice 5).
//
//   node tests/gates/g238_d223_restlog.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v238_rulings/v238_ruling_d223_d227.md (Mario concurred 2026-10-08: "1. concur
// 2. yes 3. yes 4. yes 5. yes 6. queue"), section "Gate rows I want held (claims)" R1 to R12, with "D223 to D227
// Amendment 1" (it RESTATES R1, R5, R6, R9 and R10; the restated text governs) and the two stored-entry tables.
// Evidence ruled against: tests/measure/v238_rulings/measure_restmovelog_m1.md and measure_premise_m2.md.
// Row names: tests/measure/v238_rulings/v238_row_ruled.txt.
//
// SLICES. Slice 4 (this file's first cut) carries D223-writer (R1), D223-carry (R2), D223-noseed (R3), D224-miles (R4),
// D224-progress (R5) and D224-journal (R6). Slice 5 appended D225-swapaway (R7), D226-logmore (R8), D223-lens (R9),
// D224-hero (R10) and D227-digest (R11): each has its id in LABEL (the row table), its hand oracles in the slice 5 oracle
// block, and one guard() block ahead of the summary, driving the shared env C (mkEnv below, g237's, program id g238).
// Slice 5 fixed one env defect, no oracle: a cardioFields re-render (setCardioSwap) now drops the cardio nodes it replaced,
// as the real DOM does (reparse below); R1 to R6 print byte-identical lines before and after on both trees.
// Sabotage: tests/sabotage/v238_d223.json, one mutation per ruled behaviour, each naming its row here.
//
// ORACLES. Hand values typed from the ruling, never asked of the engine: the jog 37 min / 3.7 mi / RPE 7 (run), 37 min /
// 1370 yd (swim), 37 min with or without 9.5 typed (bike, row), 37 min walk; the session values 5.2 mi (the wheel's face
// stores "5.20"), 45 min, 1500 yd, RPE 8, RPE 6, 2.0 mi; the sums 3.7 + 5.2 = 8.9, 37 + 45 = 82, 1370 + 1500 = 2870; the
// two-effort RPE means (7 + 6) / 2 = 6.5 and (8 + 7) / 2 = 7.5 (two efforts only, so the pairwise fold's order cannot
// matter); the maxima max(3.7) = 3.7, max(5.2, 3.7) = 5.2, max(2.0, 3.7) = 3.7; plannedVsLogged W1 {presc 3.1, act 5.2};
// the hero sentence "<mins> min <word> logged · RPE <n>" with the hero's words run / ride / swim / row / walk (D224);
// RPE_LABELS' words typed from the ruling's quotes and the table (Very Easy .. All Out). The engine is used only to
// build the programs and to run the athlete's gestures and the readers named in each row.
//
// HOSTS (ruling header, HALF_MANNY seed 76308): W1 MON Speed Run (run:generic), TUE lift, WED rest, FRI Recovery Run
// (run:time), SAT Long Run (run:dist, plan 3.1). Bike and swim forms are m1's R2 multi-sport cells: the m1 config
// run_10k + bike_base + swim_base, seed 76308 (cfg.seed pinned), the first week holding a rest day and the sport's day.
// The row jog is driven through the same sheet on that config; the sheet offers row only when cardioTypes holds it, and
// applyRestCardio is one writer for every type.
//
// GESTURES. The rest sheet: openRestSheet(w, d, 'cardio'), the chip _rdSet('type'), the minutes box's own onchange
// (_restDraft.mins = number), the distance box's onchange (_restDraft.dist = the typed string), the RPE chip _rdSet('rpe'),
// Log it = applyRestCardio(). The move: openRestSheet(w, d, 'move'), _rdSet('pick'), applyRestMove(). The moved-in form:
// openDayKey (C.open), wheels rolled by the scroll settle (C.roll), the yards box typed and its input event, the slider
// through its own oninput (updateRPEDisplay) and the persist listener, Log = logCardio(), Done = handleDayStatus. A lift's
// value is a set draft through writeSetDraft (the exercise card's autosave writer) with the day open, then Done.
// Stored entries are read RAW from ia_logs_g238 (never through getLogs, whose lens would hide a V237 writer's shape).
//
// VERSION PREDICATE (standing rulings 2 and 4). D223 to D227 ship at ia-version 238, read from the candidate's
// <meta name="ia-version">.
//   below 238      REFUSED: every row runs and carries a failing version conjunct, so every row FAILS by name.
//   238 and up     every row asserts (a minimum, never one exact version).
// On the V237 body relabelled 238 every row R1 to R6 FAILS on a data conjunct (printed per row by INFO lines):
//   D223-writer on every cell (no restLog; rest_cardio, rest_type, rest_mins, rpe and the sport sum written);
//   D223-carry on every cell (the rebuild drops the jog); D223-noseed on the seeded nodes, Logged, nudge and slider;
//   D224-miles on 5.2 / 0 / 0; D224-progress on the run, bike and swim totals, the double-day RPE, maxDist (the V237 jog
//   carries no ts) and the lift-moved ladder; D224-journal on every journal conjunct but the walk program's
//   "No data yet" one, which V237's own writer also keeps off (its entry holds rpe 7): see the row's INFO lines.
// R7 to R10 FAIL there on a data conjunct too, and the conjuncts the ruling marks as guards hold on V237 by design:
//   D225-swapaway on away-offered (44/44) and under-swap (22/22 offered); its back-clean, back-blank (22/22) and
//   back-logged (0/22) arms are Amendment 2's guards and pass. D226-logmore on all three arms (no restLog; the sum and
//   the last RPE land in the flat keys). D223-lens on getLogs, getLogsFor, the journal, the sets entry and save-converts;
//   its MILES, hero, Progress and ladder reads give V237's own numbers off the flat keys, and reads-write-nothing and
//   boot-writes-nothing are R12's no-change guards (S7 of the spec breaks them). D224-hero on r1 (no line, Log cardio),
//   bike>run (one line) and bike>bike (20 min); none and v237-single are guards (V237's own lines).
//   D227-digest PASSES on both trees: a no-change era row (HALF_MANNY 2d35e8f743680cfa both sides); S18 of the spec
//   moves the program and trips it.
//
// ROWS (ids are the licence file's names)
//   D223-writer   (R1 as restated by A1) a sheet jog on a fresh rest day stores exactly {restLog, week, ts}: run 37 / 3.7 / 7
//                 -> restLog {run:{mins:37, dist:3.7, rpe:7}}, week 1, ts > 0; run with no distance -> no dist key; bike and
//                 row -> {mins:37, rpe:7}, and dist:9.5 when 9.5 is typed; swim 1370 -> {mins:37, dist:1370, rpe:7}; walk ->
//                 {mins:37, rpe:7}, never a dist key, also when a distance was typed under Run before the Walk chip; on every
//                 cell rpe, run_dist, bike_mins, swim_yards, rest_cardio, rest_type and rest_mins are absent.
//   D223-carry    (R2) HALF_MANNY W1 WED run jog, then TUE / SAT / MON moved onto WED: Done untouched, RPE 8, and a value
//                 then its commit (SAT and MON: miles rolled to 5.20, Log; TUE, a lift: a set draft, Done) each leave restLog
//                 equal to {run:{mins:37, dist:3.7, rpe:7}} (0 of 3 leaves lost), and the gesture's own bytes landed.
//   D223-noseed   (R3) the moved-in dist (SAT), generic (MON), time (FRI), bike (bike jog 37 min) and swim (swim jog 1370 yd)
//                 forms: every cardio node '', wrap data-logged "0", button "Log", no nudge, slider unmarked on "Move slider";
//                 Done untouched stores rpe '' and the seven session keys ''.
//   D224-miles    (R4) week MILES: WED jog + MON moved in, 5.20 Log -> 8.9; WED jog + TUE moved in, Done -> 3.7; WED run jog
//                 under a moved-in bike form, 0:45:00 Log -> 3.7.
//   D224-progress (R5 as restated by A1) Progress W1 run = 3.7 + 5.2 = 8.9 (SAT moved in, 5.20 Log), bike = 37 + 45 = 82,
//                 swim = 1370 + 1500 = 2870; plannedVsLogged W1 {presc 3.1, act 5.2}; average RPE two efforts: jog 7 + MON
//                 own-day 6 = 6.5, jog 7 + TUE moved in RPE 8 = 7.5; seedFromPriorPrograms maxDist 3.7 from a jog-only
//                 program (three pace-only recovery runs plus the jog), 5.2 with a 5.2 session on the jog's day (never
//                 8.9); ladderWeekly W1 3.7 (MON 2.0 + WED jog), 5.2 (5.2 session on the jog's day), 3.7 (lift moved in,
//                 Done untouched).
//   D224-journal  (R6 as restated by A1) the Done-untouched moved-in day prints "37 min run logged · RPE 7" and no RPE header
//                 or RPE_LABELS word; a legacy V237 cross-type entry (rest_type bike, rest_mins 20, rpe 5, run_dist 3.7,
//                 bike_mins 20) prints "20 min ride logged · RPE 5" and no run line; a walk-only program renders Progress
//                 (no "No data yet") and the Wed row "37 min walk logged · RPE 7"; W1 rows sort by ts: FRI logged, then
//                 MON, then the WED jog prints Fri, Mon, Wed.
//   D225-swapaway (R7 as restated by D225 Amendment 2) m1 part C: seed 76308, 7 configs (m1's SRC_DEF), each W1 run, bike or
//                 swim day (22), opened with the clock on the config's first W1 rest day; logged-then-swap (a session value
//                 rolled or typed, Log) and swap-blank, then the chip to the arriving sport (the first of bike, run, swim that
//                 is not planned): restMoveCandidates offers 0/44. Tapped back to the planned sport: swapTo "" and no parked
//                 key on 44/44, swap-blank offered 22/22, logged-then-swap offered 0/22 with its number back at the top level
//                 (D219 item 2). Plus D225's amended sentence ("not offered if a session's numbers were" logged under the
//                 swap) and E10's bare lg.swapTo||lg.parked: a value logged under the swap, then tapped back, leaves parked
//                 holding it, swapTo "" and the top level blank on 22/22, offered 0/22. This arm is the only one that sees
//                 parked alone: every swapped-away day also carries swapTo.
//   D226-logmore  (R8) the rest sheet twice on one day: run 37 / 3.7 / 7 then 20 / 2 / 5 -> run {mins 57, dist 5.7, rpe 7};
//                 run 37 / 3.7 / 5 then 20 / 2 / 9 -> rpe 9 (the higher in both directions); run 37 / 3.7 / 7 then bike 20 / 5
//                 (MULTI's bike cell) -> {run:{mins 37, dist 3.7, rpe 7}, bike:{mins 20, rpe 5}}; no flat key on any arm.
//   D223-lens     (R9 as restated by A1) V237 bytes planted raw: {rest_cardio, rest_type run, rest_mins 37, rpe 7, run_dist
//                 3.7} on W1 WED reads {restLog:{run:{mins 37, dist 3.7, rpe 7}}} through getLogs and getLogsFor, MILES 3.7,
//                 the rest hero line, Progress run 3.7 and RPE 7, the journal's jog line (no RPE header) and ladderWeekly 3.7,
//                 and those reads write nothing; the same plus sets {front_squat}, week 1, ts on W1 SUN reads {restLog, sets,
//                 week, ts}, sets byte-equal, no flat key; init(), renderWeekView and renderProgressScreen leave the raw store
//                 byte-identical; one saveLogs (MON's slider to 6) stores both entries in those shapes.
//   D224-hero     (R10 as restated by A1) clock on W1 WED, the rest hero: no entry -> no line, "Log cardio"; R1's stored shape
//                 and the V237 single log -> "37 min run logged · RPE 7"; V237 bike>run -> "20 min run logged · RPE 5" then
//                 "37 min ride logged · RPE —"; V237 bike>bike -> "57 min ride logged · RPE 5"; "Log more" on each entry.
//   D227-digest   (R11) HALF_MANNY (seed 76308) built twice on a pristine load, self-stable, equals MANNY_DIGEST_BY_VERSION
//                 at the candidate's version (the row must exist); the 238 row is 2d35e8f743680cfa, the ruling's print.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const S = require('../status')('g238_d223_restlog');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 238;
const t0 = Date.now();
const J = JSON.stringify;

// ── the row table: one LABEL per declared row (slice 5 appends D225-swapaway, D226-logmore, D223-lens, D224-hero and
//    D227-digest here) ───────────────────────────────────────────────────────────────────────────────────────────────
const LABEL = {
  'D223-writer':   'D223-writer (VER >= 238) a sheet jog stores exactly {restLog, week, ts}: restLog[type] = {mins, dist when typed, rpe} as numbers, walk never a dist; no rpe, sport key or rest_* key at top level',
  'D223-carry':    'D223-carry (VER >= 238) TUE / SAT / MON moved onto the WED jog: Done untouched, RPE 8 and value then commit each leave restLog {run:{mins:37, dist:3.7, rpe:7}} whole',
  'D223-noseed':   'D223-noseed (VER >= 238) moved-in dist, generic, time, bike and swim forms open empty: nodes blank, data-logged 0, Log, no nudge, Move slider; Done untouched stores rpe and the seven blank',
  'D224-miles':    'D224-miles (VER >= 238) week MILES credits the jog: MON moved in 5.2 -> 8.9, TUE moved in Done -> 3.7, bike form 45 min -> 3.7',
  'D224-progress': 'D224-progress (VER >= 238) Progress run 8.9, bike 82, swim 2870; drift act 5.2; average RPE 6.5 and 7.5; maxDist 3.7 and 5.2; ladder 3.7, 5.2, 3.7',
  'D224-journal':  'D224-journal (VER >= 238) the journal prints the jog in the hero sentence, never an RPE label; a legacy type with no mins prints nothing; a walk-only program renders; rows sort by ts',
  'D225-swapaway': 'D225-swapaway (VER >= 238) m1 part C, 7 configs, 22 days x 2 modes: swapped away offered 0/44; tapped back swapTo blank and no parked 44/44, swap-blank offered 22/22, logged-then-swap 0/22; numbers logged under the swap then tapped back are parked and offered 0/22',
  'D226-logmore':  'D226-logmore (VER >= 238) Log more never overwrites: run then run sums mins and dist and keeps the higher RPE (7 then 5 gives 7, 5 then 9 gives 9); run then bike adds bike and keeps run whole',
  'D223-lens':     'D223-lens (VER >= 238) a planted V237 jog reads as restLog through getLogs, getLogsFor, MILES, hero, Progress, journal and ladder; the one with sets reads {restLog, sets, week, ts}; boot and renders write nothing; one saveLogs stores both converted',
  'D224-hero':     'D224-hero (VER >= 238) the rest hero prints one line per restLog type with mins: R1 entry and V237 single log 37 min run, V237 bike>run two lines, V237 bike>bike 57 min ride, Log more on each; no entry no line and Log cardio',
  'D227-digest':   'D227-digest (VER >= 238) HALF_MANNY built twice, self-stable, equals the era row for the candidate (row present); era row 238 is 2d35e8f743680cfa',
};
const IDS = Object.keys(LABEL);
S.declare(IDS);

// ── hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────────────
const JOG = {        // the sheet's draft as the athlete fills it: mins a number (the box's onchange), dist the typed string
  run:       { type:'run',  mins:37, dist:'3.7',  rpe:7 },
  runNoDist: { type:'run',  mins:37, dist:'',     rpe:7 },
  walk:      { type:'walk', mins:37, dist:'',     rpe:7 },
  walkStale: { type:'walk', mins:37, dist:'2',    rpe:7, stale:true },   // 2 typed under Run, then the Walk chip
  bike:      { type:'bike', mins:37, dist:'',     rpe:7 },
  bikeDist:  { type:'bike', mins:37, dist:'9.5',  rpe:7 },
  row:       { type:'row',  mins:37, dist:'',     rpe:7 },
  rowDist:   { type:'row',  mins:37, dist:'9.5',  rpe:7 },
  swim:      { type:'swim', mins:37, dist:'1370', rpe:7 },
};
const RL = {         // restLog, typed from the ruling (D223 item 1 as restated by A6; R1 as restated by A1)
  run:       { run:{ mins:37, dist:3.7, rpe:7 } },
  runNoDist: { run:{ mins:37, rpe:7 } },
  walk:      { walk:{ mins:37, rpe:7 } },
  walkStale: { walk:{ mins:37, rpe:7 } },
  bike:      { bike:{ mins:37, rpe:7 } },
  bikeDist:  { bike:{ mins:37, dist:9.5, rpe:7 } },
  row:       { row:{ mins:37, rpe:7 } },
  rowDist:   { row:{ mins:37, dist:9.5, rpe:7 } },
  swim:      { swim:{ mins:37, dist:1370, rpe:7 } },
};
const ENTRY_KEYS = ['restLog', 'ts', 'week'];          // a fresh day's entry after one jog, sorted (ruling table row 1)
const TOP_ABSENT = ['rpe', 'run_dist', 'bike_mins', 'swim_yards', 'rest_cardio', 'rest_type', 'rest_mins'];
const SEVEN = ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time', 'bike_mins', 'swim_yards'];
const NUDGE = 'You logged this one but never marked it.';
const COPY = { log:'Log', slider:'Move slider' };
const HAND = { milesMon:8.9, milesTue:3.7, milesBike:3.7, run:8.9, bike:82, swim:2870, rpeOwn:6.5, rpeDouble:7.5,
  pvlPresc:3.1, pvlAct:5.2, maxJog:3.7, maxDouble:5.2, ladOwn:3.7, ladDouble:5.2, ladLift:3.7 };
{ // the arithmetic, typed out (never the engine's sums)
  const chk = [[3.7 + 5.2, 8.9], [37 + 45, 82], [1370 + 1500, 2870], [(7 + 6) / 2, 6.5], [(8 + 7) / 2, 7.5], [Math.max(5.2, 3.7), 5.2], [Math.max(2.0, 3.7), 3.7]];
  for(const [a, b] of chk) if(Math.abs(a - b) > 1e-9) throw new Error('hand oracle self-check ' + a + ' != ' + b);
}
const SESS = { dist:[['0', '5'], ['1', '2'], ['2', '0']], dist2:[['0', '2'], ['1', '0'], ['2', '0']], bike45:[['0', '0'], ['1', '45'], ['2', '0']] };
const SESS_BYTES = { dist:'5.20', dist2:'2.00' };   // the miles wheel's face bytes (ruling table: "the wheel's own face stores 5.20")
const LINE = (mins, word, rpe) => mins + ' min ' + word + ' logged · RPE ' + rpe;   // the hero sentence (D224), typed
const JOG_LINE_RE = /^\d+ min (run|ride|swim|row|walk) logged · RPE (\d+|—)$/;
const LABEL_WORDS = ['Very Easy', 'Easy', 'Moderate', 'Somewhat Hard', 'Hard', 'Hard+', 'Very Hard', 'Very Hard+', 'Max Effort', 'All Out'];
const RPE_HEAD_RE = /^RPE \d+ — /;
const LEGACY_X = { rest_cardio:true, rest_type:'bike', rest_mins:20, rpe:5, run_dist:3.7, bike_mins:20 };   // D223 item 5's cross-type example, V237 bytes
const near = (a, b) => typeof a === 'number' && isFinite(a) && Math.abs(a - b) < 1e-9;
const canon = v => Array.isArray(v) ? v.map(canon) : (v && typeof v === 'object') ? Object.keys(v).sort().reduce((o, k) => { o[k] = canon(v[k]); return o; }, {}) : v;
const CJ = v => J(canon(v));

// ── version, read from the candidate's meta ──────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
const VM = HTML.match(/<meta name="ia-version" content="(\d+)">/);
const VER = VM ? +VM[1] : 0;
const verCj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
S.info('g238 D223-D227 P-RESTMOVELOG | candidate ' + ART + ' ia-version ' + VER);
if(!(VER >= ERA)) S.info('REFUSED: ia-version ' + VER + ' predates D223 to D227 (V' + ERA + '). Every row runs and FAILS by its version conjunct.');

// ── ENV (g237_d220_distzero.js mkEnv, the g236 / g235 / g233 lineage; program id g238; the clock settable) ───────────
const RealDate = Date, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function mkEnv(file){
  const IA = H.load(file), ctx = IA.ctx, ev = IA.eval, LS = IA.localStorage;
  let VNOW = new RealDate(2026, 8, 21, 10).getTime();
  class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(VNOW); } static now(){ return VNOW; } }
  ctx.Date = FD; ctx.performance = { now:() => VNOW };
  let tid = 1; const T = new Map(), errs = [];
  const sched = (fn, ms, every) => { const id = tid++; T.set(id, { fn, at:VNOW + Math.max(0, +ms || 0), every }); return id; };
  ctx.setTimeout = (fn, ms) => sched(fn, ms, 0); ctx.setInterval = (fn, ms) => sched(fn, ms, Math.max(1, +ms || 1));
  ctx.requestAnimationFrame = fn => sched(() => fn(VNOW), 16, 0);
  ctx.clearTimeout = id => T.delete(id); ctx.clearInterval = id => T.delete(id); ctx.cancelAnimationFrame = id => T.delete(id);
  if(ctx.window && ctx.window !== ctx) Object.assign(ctx.window, { setTimeout:ctx.setTimeout, setInterval:ctx.setInterval, clearTimeout:ctx.clearTimeout,
    clearInterval:ctx.clearInterval, requestAnimationFrame:ctx.requestAnimationFrame, performance:ctx.performance, Date:FD });
  const advance = ms => { const end = VNOW + ms;
    for(let n = 0; n < 200000; n++){ let b = null; for(const [id, t] of T) if(t.at <= end && (!b || t.at < b[1].at)) b = [id, t];
      if(!b) break; const [id, t] = b; VNOW = t.at; if(t.every) t.at += t.every; else T.delete(id);
      try { t.fn(); } catch(e){ errs.push(e.message); } }
    VNOW = end; };
  if(ev('typeof Event') === 'undefined') ctx.Event = class { constructor(t){ this.type = t; } };
  const els = {}; let WHEELS = []; let parsedIds = new Set(); const INPUTS = {};
  const unq = s => s.replace(/&quot;/g, '"');
  function mk(id){
    const cls = new Set(), lis = {};
    const e = { id, value:'', textContent:'', style:{}, dataset:{}, children:[], offsetWidth:0, offsetHeight:0, offsetTop:0, offsetLeft:0, scrollTop:0, _html:'',
      classList:{ add:(...c) => c.forEach(x => cls.add(x)), remove:(...c) => c.forEach(x => cls.delete(x)),
        toggle:(c, f) => { const on = f === undefined ? !cls.has(c) : !!f; on ? cls.add(c) : cls.delete(c); return on; }, contains:c => cls.has(c) },
      addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){},
      dispatchEvent:evt => { if(evt.type === 'input') INPUTS[id] = (INPUTS[id] || 0) + 1; (lis[evt.type] || []).forEach(f => f({ target:e, currentTarget:e, type:evt.type })); return true; },
      setAttribute(){}, getAttribute(){ return null; }, appendChild(){}, removeChild(){}, remove(){}, insertAdjacentHTML(){},
      querySelector(){ return null; }, querySelectorAll(){ return []; }, closest(){ return null; }, setPointerCapture(){},
      getBoundingClientRect(){ return { top:0, left:0, width:0, height:0, bottom:0, right:0 }; }, scrollIntoView(){}, focus(){}, blur(){},
      get className(){ return [...cls].join(' '); }, set className(v){ cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach(x => cls.add(x)); } };
    if(id === 'detailBody' || id === 'cardioFields')
      Object.defineProperty(e, 'innerHTML', { get(){ return e._html; }, set(v){ e._html = String(v); reparse(e._html, id === 'detailBody'); } });
    else e.innerHTML = '';
    if(id === 'detailOverlay') e.querySelectorAll = s => s === '.iaw-col' ? [].concat(...WHEELS.map(w => w._cols)) : [];
    return e;
  }
  function reparse(html, full){
    if(full){ for(const id of parsedIds) delete els[id]; parsedIds = new Set(); }
    // slice 5 (env defect, named): a cardioFields re-render (setCardioSwap) replaces the cardio nodes it held, as the real
    // DOM does; without this the leaving sport's node stayed reachable and persistLogFields read its stale value back.
    else { for(const id of [...parsedIds]) if(/^log_(run|bike|swim)_/.test(id)){ delete els[id]; parsedIds.delete(id); } }
    const re = /<(\w+)([^>]*?)\sid="([^"]+)"([^>]*)>/g; let m;
    while((m = re.exec(html))){ const id = m[3], attrs = m[2] + ' ' + m[4]; if(id === 'detailBody' || id === 'cardioFields') continue;
      const el = mk(id); const vm = attrs.match(/\svalue="([^"]*)"/); if(vm) el.value = unq(vm[1]);
      let dm; const dre = /\sdata-([a-z]+)="([^"]*)"/g; while((dm = dre.exec(attrs))) el.dataset[dm[1]] = unq(dm[2]);
      els[id] = el; parsedIds.add(id); }
    WHEELS = parseWheels(html);
  }
  function parseWheels(html){
    const out = []; const parts = html.split('<div class="iaw" ').slice(1);
    for(const p of parts){
      const head = p.match(/^data-kind="([^"]+)" data-for="([^"]+)"(?: data-plan="([^"]*)")?>/); if(!head) continue;
      const body = p.slice(0, p.indexOf('<input type="hidden"') < 0 ? p.length : p.indexOf('<input type="hidden"'));
      const cols = []; const cre = /<div class="iaw-col" data-ci="(\d+)" data-wrap="(1?)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g; let c;
      while((c = cre.exec(body))){
        const items = []; const ire = /<div class="iaw-it(?: nil)?" data-v="([^"]*)">([^<]*)<\/div>/g; let it;
        while((it = ire.exec(c[4]))){ const v = it[1]; items.push({ v, face:it[2], style:{}, getAttribute:k => k === 'data-v' ? v : null }); }
        const lis = {}; let st = 0; const attrs = { 'data-ci':c[1], 'data-wrap':c[2], 'data-len':c[3] };
        cols.push({ style:{}, _lis:lis, items, wrap:c[2], len:c[3], getAttribute:k => attrs[k] == null ? null : attrs[k], querySelectorAll:s => s === '.iaw-it' ? items : [],
          addEventListener:(t, fn) => { (lis[t] = lis[t] || []).push(fn); },
          get scrollTop(){ return st; }, set scrollTop(v){ st = v; (lis.scroll || []).forEach(f => f()); } });
      }
      const a = { 'data-kind':head[1], 'data-for':head[2], 'data-plan':head[3] == null ? null : unq(head[3]) };
      out.push({ _cols:cols, kind:head[1], hid:head[2], plan:a['data-plan'], getAttribute:k => a[k] == null ? null : a[k], querySelectorAll:s => s === '.iaw-col' ? cols : [] });
    }
    return out;
  }
  const doc = ctx.document; doc.getElementById = id => (els[id] || (els[id] = mk(id)));
  if(!doc.addEventListener) doc.addEventListener = function(){};
  const SCREENS = [...new Set((IA.html.match(/class="screen[^"]*" id="(\w+)"/g) || []).map(s => s.match(/id="(\w+)"/)[1]))];
  SCREENS.forEach(s => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = sel => sel === '.screen' ? SCREENS.map(s => els[s]) : sel === '.screen.with-tabbar' ? SCREENS.map(s => els[s]).filter(x => x.classList.contains('with-tabbar'))
    : sel === '.iaw' ? WHEELS : sel === '.iaw-col' ? [].concat(...WHEELS.map(w => w._cols)) : [];
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'screenWeek', 'daysList', 'progressBody', 'restOverlay', 'restBody'].forEach(i => doc.getElementById(i));
  ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
  ev('var __dots=[]; var __realBDC=buildDotChart; buildDotChart=function(){ __dots.push(Array.prototype.slice.call(arguments,0,3)); return __realBDC.apply(this,arguments); };');
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, wheels:() => WHEELS };
  E.now = () => VNOW;
  E.setNow = t => { VNOW = t; };
  E.use = p => { const q = JSON.parse(J(p)); q.id = 'g238'; q.startDate = '2026-09-21'; delete q.blockOpen; delete q.created; delete q.createdAt;
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([q])); LS.setItem('ia_active', 'g238'); ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId="g238"; currentWeek=1; progressViewId=null;'); ev("showScreen('screenWeek')"); return q; };
  E.logs = () => LS.getItem('ia_logs_g238') || '{}';
  E.entry = (w, d) => JSON.parse(E.logs())['w' + w + '_' + d] || null;          // RAW bytes, no lens
  E.setLog = (w, d, entry) => { const L = JSON.parse(E.logs()); if(entry == null) delete L['w' + w + '_' + d]; else L['w' + w + '_' + d] = entry; LS.setItem('ia_logs_g238', J(L)); };
  E.open = (w, d) => { ev('currentWeek=' + w + ';'); els.detailOverlay.classList.remove('open'); els.detailBody.innerHTML = '';
    for(const k in INPUTS) delete INPUTS[k]; ev("openDayKey('" + d + "')"); advance(500); };
  E.wheel = hid => WHEELS.find(w => w.hid === hid) || null;
  E.need = hid => { const w = E.wheel(hid); if(!w) throw new Error('no wheel for ' + hid + ' on the rendered form'); return w; };
  E.rollAt = (wh, pairs, ms) => { for(const [ci, v] of pairs){ const c = wh._cols[ci], cur = Math.round(c.scrollTop / 44); let best = -1;
      for(let k = 0; k < c.items.length; k++) if(c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
      if(best < 0) throw new Error('no row ' + J(v) + ' in column ' + ci); c.scrollTop = best * 44; }
    advance(ms); };
  E.roll = (wh, pairs) => E.rollAt(wh, pairs, 500);
  E.tap = (d, s) => { ev("handleDayStatus('" + d + "','x','" + s + "')"); advance(500); };
  E.log = () => { if(ev('typeof logCardio') !== 'function') return false; ev('logCardio()'); advance(50); return true; };
  E.btnMarkup = () => (els.detailBody.innerHTML.match(/<button[^>]*\sid="cardioLogBtn"[^>]*>([^<]*)<\/button>/) || [])[1];
  E.label = () => { const b = els.cardioLogBtn; return (b && b.textContent) || E.btnMarkup() || ''; };
  E.logged = () => els.cardioSwapWrap ? els.cardioSwapWrap.dataset.logged : undefined;
  E.rpe = v => { els.log_rpe.value = v; if(ev('typeof updateRPEDisplay') === 'function') ev('updateRPEDisplay')(v); els.log_rpe.dispatchEvent({ type:'input' }); advance(50); };
  E.back = () => { ev('closeDetail()'); advance(200); };
  return E;
}
function mkCfg(sports, f, ex, eq, rd, sd){   // measure m1's (tests/measure/v238_restmovelog.js) R2 source config shape
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = Object.assign({ id:s[1], label:s[1] }, { mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, s[2] || {}); });
  return { name:'L', primaryPath:/^support_/.test(f) ? 'event' : 'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg,
    eventTargeted:race, raceDate:race ? '2026-12-20' : null, liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs',
    restDays:rd.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}

// ── conjunct rows ────────────────────────────────────────────────────────────────────────────────────────────────────
const row = (id, cj, extra) => {
  const bad = cj.filter(c => !c[1]);
  for(const c of cj) S.info(id + ' ' + (c[1] ? 'ok  ' : 'BAD ') + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id] + (extra ? ' [' + extra + ']' : ''), bad.map(c => c[0] + ': ' + c[2]).slice(0, 4).join('; ') + (bad.length > 4 ? '; and ' + (bad.length - 4) + ' more' : ''));
};
const guard = (id, fn) => { try { fn(); } catch(e){ row(id, [verCj(id), ['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]); } };

const C = mkEnv(ART);
// noon of day d in week w, startDate Mon 2026-09-21 (hand date math: 2026-09-21 is a Monday)
const at = (w, d, h) => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d), h == null ? 12 : h).getTime();
const HALF_CFG = JSON.parse(J(H.fixtures.HALF_MANNY));
const HALF = C.IA.buildProgram(JSON.parse(J(HALF_CFG)));
const MULTI_CFG = mkCfg([['run', 'run_10k', {}], ['bike', 'bike_base', {}], ['swim', 'swim_base', {}]], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308);
const MULTI = C.IA.buildProgram(JSON.parse(J(MULTI_CFG)));
const card = x => (x && !x.rest && x.cardio && !Array.isArray(x.cardio)) ? x.cardio : null;
const ctOf = x => String((card(x) || {}).type || '').toLowerCase();
const subOf = (p, w, d) => String((card(p.weeks[w] && p.weeks[w][d]) || {}).subtype || '');
// the first week of MULTI holding a rest day and a day of `sport` (m1 R2's cell rule)
const cellOf = sport => { for(const w of Object.keys(MULTI.weeks).map(Number).sort((a, b) => a - b)){
    const rest = DAYS.find(d => MULTI.weeks[w][d] && MULTI.weeks[w][d].rest), day = DAYS.find(d => ctOf(MULTI.weeks[w][d]) === sport);
    if(rest && day) return { w, rest, day }; }
  return null; };
const BIKE = cellOf('bike'), SWIM = cellOf('swim');
S.info('hosts: HALF_MANNY seed ' + HALF_CFG.seed + ' W1 ' + DAYS.map(d => { const x = HALF.weeks[1][d]; return d + '=' + (x.rest ? 'rest' : (card(x) ? ctOf(x) + ':' + ((card(x).dose || {}).k || 'generic') + ' ' + J(subOf(HALF, 1, d)) : 'lift')); }).join(' | '));
S.info('hosts: MULTI (m1 R2 run_10k+bike_base+swim_base, seed ' + MULTI_CFG.seed + ') bike cell ' + J(BIKE) + ', swim cell ' + J(SWIM));
const halfHostCj = () => { const W = HALF.weeks[1], sd = (card(W.sat) || {}).dose || {}, fd = (card(W.fri) || {}).dose || {};
  const ok = !!W.wed.rest && !card(W.tue) && !W.tue.rest && /Speed Run/.test(subOf(HALF, 1, 'mon')) && !(card(W.mon) || {}).dose
    && /Recovery Run/.test(subOf(HALF, 1, 'fri')) && fd.k === 'time' && /Long Run/.test(subOf(HALF, 1, 'sat')) && sd.k === 'dist' && +sd.mi === 3.1;
  return ['hosts', ok, 'W1 wed rest ' + !!W.wed.rest + ', tue lift ' + (!card(W.tue) && !W.tue.rest) + ', mon ' + J(subOf(HALF, 1, 'mon')) + ' dose ' + J((card(W.mon) || {}).dose || null)
    + ', fri ' + J(subOf(HALF, 1, 'fri')) + ' ' + J(fd.k) + ', sat ' + J(subOf(HALF, 1, 'sat')) + ' ' + J(sd.k) + ' ' + J(sd.mi) + ' (ruling: rest, lift, Speed Run generic, Recovery Run time, Long Run dist 3.1)']; };

// ── gestures ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// The rest sheet's Log it. The draft's w and day are cleared first, so a refused openRestSheet cannot ride a stale day.
const sheetJog = (w, d, j) => {
  C.ev('_restDraft.w=null; _restDraft.day=null;'); C.ev("openRestSheet(" + w + ",'" + d + "','cardio')");
  const dr = C.ev('({w:_restDraft.w, day:_restDraft.day})'); if(dr.w !== w || dr.day !== d) throw new Error('openRestSheet(' + w + ',' + d + ') refused (draft ' + J(dr) + ')');
  if(j.stale){ C.ev("_rdSet('type','run')"); C.ev('_restDraft.dist=' + J(j.dist) + ';'); C.ev("_rdSet('type'," + J(j.type) + ')'); }
  else { C.ev("_rdSet('type'," + J(j.type) + ')'); C.ev('_restDraft.dist=' + J(j.dist) + ';'); }
  C.ev('_restDraft.mins=' + j.mins + ';'); C.ev("_rdSet('rpe'," + j.rpe + ')'); C.ev('applyRestCardio()'); C.advance(50); };
// "Training anyway?": the move sheet, the pick, Move it here. Returns whether the pick was offered and landed.
const sheetMove = (w, d, pick) => {
  const offered = Array.from(C.ev('restMoveCandidates(' + w + ')') || []).map(c => c.day).includes(pick);
  C.ev('_restDraft.w=null; _restDraft.day=null;'); C.ev("openRestSheet(" + w + ",'" + d + "','move')");
  C.ev("_rdSet('pick','" + pick + "')"); C.ev('applyRestMove()'); C.advance(50);
  const moved = C.ev('(activeProg.weeks[' + w + ']["' + d + '"]||{}).movedFrom') === pick;
  return { offered, moved }; };
// one drive: a fresh store, the clock on the rest day, the jog, the move, the moved-in form open
const drive = (prog, w, rest, j, pick) => {
  C.use(prog); C.setNow(at(w, rest)); sheetJog(w, rest, j);
  const mv = pick ? sheetMove(w, rest, pick) : { offered:true, moved:true };
  if(pick) C.open(w, rest);
  return mv; };
const mvTxt = (mv, pick) => pick + (mv.offered ? ' offered' : ' NOT OFFERED') + (mv.moved ? ', moved in' : ', NOT moved');
const typeSwim = v => { C.els.log_swim_yards.value = v; C.els.log_swim_yards.dispatchEvent({ type:'input' }); C.advance(50); };
const setDraft = () => { C.ev("writeSetDraft('front_squat',['5'],['135'],'')"); C.advance(50); };
const restLogOf = (w, d) => (C.entry(w, d) || {}).restLog;
const milesTile = w => { C.ev('currentWeek=' + w + '; renderWeekView()');
  const m = /color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(C.els.daysList.innerHTML || ''); return m ? m[1] : null; };
const progress = () => { C.ctx.__dots.length = 0; C.ev('progressViewId=null; renderProgressScreen()'); return C.els.progressBody.innerHTML || ''; };
const chartVal = (title, w) => { for(const a of C.ctx.__dots){ if(String(a[0]).indexOf(title) < 0) continue; const wk = Array.from(a[1]), dat = Array.from(a[2]); return { drawn:true, v:dat[wk.indexOf(w)] }; }
  return { drawn:false, v:undefined }; };
const pvl = w => { const r = C.ev('plannedVsLogged(getLogs(), getDayHist(), activeProg.totalWeeks||99, null, false)') || {}; return r[w] ? { presc:r[w].presc, act:r[w].act } : null; };
const ladder = w => { const r = C.ev('ladderWeekly(getLogs(), activeProg.totalWeeks||99, null, false)') || {}; return r[w]; };
// the journal: week -> rows [{day, segs}], text segments between tags, each week's block cut at its </details>
const journal = html => { const out = {};
  for(let p of html.split('<details class="journal-week"').slice(1)){
    p = p.slice(0, p.indexOf('</details>') < 0 ? p.length : p.indexOf('</details>'));
    const wm = p.match(/<span>Week (\d+)<\/span>/); if(!wm) continue;
    out[+wm[1]] = p.split('<div style="background:var(--surface2);border-radius:4px;padding:10px 12px;margin-bottom:6px">').slice(1)
      .map(r => { const segs = r.split(/<[^>]*>/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean); return { day:segs[0], segs }; });
  }
  return out; };
const rowOf = (jr, w, day) => ((jr[w] || []).find(r => r.day === day)) || null;
const jogLinesOf = r => r ? r.segs.filter(s => JOG_LINE_RE.test(s)) : [];
const labelHits = r => r ? LABEL_WORDS.filter(L => r.segs.some(s => s.indexOf(L) >= 0)) : [];
const headOf = r => r ? r.segs.filter(s => RPE_HEAD_RE.test(s)) : [];

// ── D223-writer (R1 as restated by A1) ──────────────────────────────────────────────────────────────────────────────
guard('D223-writer', () => {
  const cj = [verCj('D223-writer')];
  const CELLS = [['run', HALF, 1, 'wed'], ['runNoDist', HALF, 1, 'wed'], ['walk', HALF, 1, 'wed'], ['walkStale', HALF, 1, 'wed'],
    ['bike', MULTI, BIKE.w, BIKE.rest], ['bikeDist', MULTI, BIKE.w, BIKE.rest], ['row', MULTI, BIKE.w, BIKE.rest], ['rowDist', MULTI, BIKE.w, BIKE.rest],
    ['swim', MULTI, SWIM.w, SWIM.rest]];
  cj.push(halfHostCj());
  for(const [nm, prog, w, d] of CELLS){
    drive(prog, w, d, JOG[nm], null); const e = C.entry(w, d) || {};
    const keys = Object.keys(e).sort(), top = TOP_ABSENT.filter(k => k in e);
    const ok = CJ(e.restLog) === CJ(RL[nm]) && J(keys) === J(ENTRY_KEYS) && typeof e.ts === 'number' && e.ts > 0 && e.week === w && !top.length;
    cj.push([nm, ok, 'W' + w + ' ' + d + ' ' + J(JOG[nm]) + ': restLog ' + CJ(e.restLog) + ', keys ' + J(keys) + ', ts ' + J(e.ts) + ', week ' + J(e.week)
      + (top.length ? ', top-level ' + top.map(k => k + '=' + J(e[k])).join(' ') : '') + ' (hand ' + CJ(RL[nm]) + ', ' + J(ENTRY_KEYS) + ', ts > 0, ' + w + ', none of ' + TOP_ABSENT.join(' ') + ')']);
  }
  row('D223-writer', cj);
});

// ── D223-carry (R2) ──────────────────────────────────────────────────────────────────────────────────────────────────
guard('D223-carry', () => {
  const cj = [verCj('D223-carry'), halfHostCj()];
  const want = CJ(RL.run);
  for(const pick of ['tue', 'sat', 'mon']) for(const seq of ['done', 'rpe8', 'value']){
    const mv = drive(HALF, 1, 'wed', JOG.run, pick); let ran = '', ranOk = false;
    if(seq === 'done'){ C.tap('wed', 'complete'); const e = C.entry(1, 'wed') || {}; ranOk = C.ev("statusOf(1,'wed')") === 'complete' && 'swapTo' in e; ran = 'Done: status ' + J(C.ev("statusOf(1,'wed')")) + ', rebuilt ' + ('swapTo' in e); }
    else if(seq === 'rpe8'){ C.rpe('8'); const e = C.entry(1, 'wed') || {}; ranOk = e.rpe === '8'; ran = 'RPE 8: rpe ' + J(e.rpe); C.back(); }
    else if(pick === 'tue'){ setDraft(); C.tap('wed', 'complete'); const e = C.entry(1, 'wed') || {}; ranOk = !!(e.sets && e.sets.front_squat) && 'swapTo' in e; ran = 'set draft then Done: sets ' + J(Object.keys(e.sets || {})) + ', rebuilt ' + ('swapTo' in e); }
    else { C.roll(C.need('log_run_dist'), SESS.dist); C.log(); const e = C.entry(1, 'wed') || {}; ranOk = e.run_dist === SESS_BYTES.dist; ran = '5.20 then Log: run_dist ' + J(e.run_dist); C.back(); }
    const rl = restLogOf(1, 'wed'), lost = Object.keys(RL.run.run).filter(k => !(rl && rl.run && rl.run[k] === RL.run.run[k])).length;
    cj.push([pick + '-' + seq, mv.offered && mv.moved && ranOk && CJ(rl) === want,
      mvTxt(mv, pick) + '; ' + ran + '; restLog ' + CJ(rl) + ', ' + lost + ' of 3 leaves lost (hand ' + want + ', 0 lost)']);
  }
  row('D223-carry', cj);
});

// ── D223-noseed (R3) ─────────────────────────────────────────────────────────────────────────────────────────────────
guard('D223-noseed', () => {
  const cj = [verCj('D223-noseed'), halfHostCj()];
  const FORMS = [['dist', HALF, 1, 'wed', 'sat', JOG.run], ['generic', HALF, 1, 'wed', 'mon', JOG.run], ['time', HALF, 1, 'wed', 'fri', JOG.run],
    ['bike', MULTI, BIKE.w, BIKE.rest, BIKE.day, JOG.bike], ['swim', MULTI, SWIM.w, SWIM.rest, SWIM.day, JOG.swim]];
  for(const [nm, prog, w, rest, pick, j] of FORMS){
    const mv = drive(prog, w, rest, j, pick); const html = C.els.detailBody.innerHTML || '';
    const ids = [...new Set((html.match(/\sid="log_(?:run|bike|swim)_[a-z_]+"/g) || []).map(s => s.slice(5, -1)))];
    const seeded = ids.filter(id => (C.els[id] || {}).value !== '').map(id => id + '=' + J(C.els[id].value));
    const lg = C.logged(), lbl = C.label(), ndg = html.includes(NUDGE);
    const disp = (html.match(/id="rpeDisplay"[^>]*>([^<]*)</) || [])[1], touched = ((C.els.log_rpe || {}).dataset || {}).touched;
    cj.push([nm + '-open', mv.offered && mv.moved && ids.length > 0 && !seeded.length && lg === '0' && lbl === COPY.log && !ndg && disp === COPY.slider && touched !== '1',
      'W' + w + ' ' + rest + ' <- ' + mvTxt(mv, pick) + ' (jog ' + j.type + '): nodes ' + J(ids) + ' seeded ' + (seeded.join(' ') || 'none') + ', data-logged ' + J(lg) + ', button ' + J(lbl)
      + ', nudge ' + ndg + ', slider ' + J(disp) + ' touched ' + J(touched) + ' (hand: >= 1 node, none, "0", ' + J(COPY.log) + ', false, ' + J(COPY.slider) + ', unmarked)']);
    C.tap(rest, 'complete'); const e = C.entry(w, rest) || {}; const nb = SEVEN.filter(k => e[k] !== '');
    cj.push([nm + '-done', e.rpe === '' && !nb.length, 'Done untouched: rpe ' + J(e.rpe) + (nb.length ? ', not blank ' + nb.map(k => k + '=' + J(e[k])).join(' ') : ', the seven blank') + ' (hand "", the seven "")']);
  }
  row('D223-noseed', cj);
});

// ── D224-miles (R4) ──────────────────────────────────────────────────────────────────────────────────────────────────
guard('D224-miles', () => {
  const cj = [verCj('D224-miles'), halfHostCj()];
  let mv = drive(HALF, 1, 'wed', JOG.run, 'mon'); C.roll(C.need('log_run_dist'), SESS.dist); C.log(); C.back();
  let e = C.entry(1, 'wed') || {}, m = milesTile(1);
  cj.push(['mon-typed', mv.offered && mv.moved && e.run_dist === SESS_BYTES.dist && m === String(HAND.milesMon), mvTxt(mv, 'mon') + ', 5.20 Log: run_dist ' + J(e.run_dist) + ', MILES ' + J(m) + ' (hand "5.20", ' + HAND.milesMon + ')']);
  mv = drive(HALF, 1, 'wed', JOG.run, 'tue'); C.tap('wed', 'complete'); m = milesTile(1);
  cj.push(['tue-done', mv.offered && mv.moved && C.ev("statusOf(1,'wed')") === 'complete' && m === String(HAND.milesTue), mvTxt(mv, 'tue') + ', Done: MILES ' + J(m) + ' (hand ' + HAND.milesTue + ')']);
  mv = drive(MULTI, BIKE.w, BIKE.rest, JOG.run, BIKE.day); C.roll(C.need('log_bike_mins'), SESS.bike45); C.log(); C.back();
  e = C.entry(BIKE.w, BIKE.rest) || {}; m = milesTile(BIKE.w);
  cj.push(['bike-form', mv.offered && mv.moved && +e.bike_mins === 45 && m === String(HAND.milesBike), 'MULTI W' + BIKE.w + ' ' + BIKE.rest + ' <- ' + mvTxt(mv, BIKE.day) + ', 0:45:00 Log: bike_mins ' + J(e.bike_mins) + ', MILES ' + J(m) + ' (hand 45, ' + HAND.milesBike + ')']);
  row('D224-miles', cj);
});

// ── D224-progress (R5 as restated by A1) ─────────────────────────────────────────────────────────────────────────────
guard('D224-progress', () => {
  const cj = [verCj('D224-progress'), halfHostCj()];
  // run total and drift: WED jog, SAT moved in, 5.20 Log
  let mv = drive(HALF, 1, 'wed', JOG.run, 'sat'); C.roll(C.need('log_run_dist'), SESS.dist); C.log(); C.back();
  let e = C.entry(1, 'wed') || {}; progress(); let c = chartVal('Weekly Running Mileage', 1); const pv = pvl(1);
  cj.push(['run-total', mv.offered && mv.moved && e.run_dist === SESS_BYTES.dist && c.drawn && near(c.v, HAND.run), mvTxt(mv, 'sat') + ', 5.20 Log: run_dist ' + J(e.run_dist) + ', Weekly Running Mileage W1 ' + J(c.v) + ' (hand ' + HAND.run + ')']);
  cj.push(['drift', !!pv && near(pv.presc, HAND.pvlPresc) && near(pv.act, HAND.pvlAct), 'plannedVsLogged W1 ' + J(pv) + ' (hand presc ' + HAND.pvlPresc + ', act ' + HAND.pvlAct + ', never 8.9)']);
  const ld2 = ladder(1);
  cj.push(['ladder-double', near(ld2, HAND.ladDouble), 'ladderWeekly W1 ' + J(ld2) + ' with the 5.2 session on the jog\'s day (hand max(5.2, 3.7) = ' + HAND.ladDouble + ', never 8.9)']);
  let sd = null;   // maxDist needs SEED_MIN_RUNS recovery runs, so both maxDist cells run on the program built below
  // bike total: bike jog 37, the bike day moved in, 0:45:00 Log
  mv = drive(MULTI, BIKE.w, BIKE.rest, JOG.bike, BIKE.day); C.roll(C.need('log_bike_mins'), SESS.bike45); C.log(); C.back();
  e = C.entry(BIKE.w, BIKE.rest) || {}; progress(); c = chartVal('Weekly Cycling Time', BIKE.w);
  cj.push(['bike-total', mv.offered && mv.moved && +e.bike_mins === 45 && c.drawn && near(c.v, HAND.bike), 'MULTI W' + BIKE.w + ' ' + mvTxt(mv, BIKE.day) + ', 0:45:00 Log: bike_mins ' + J(e.bike_mins) + ', Weekly Cycling Time ' + J(c.v) + ' (hand 37 + 45 = ' + HAND.bike + ')']);
  // swim total: swim jog 37 min 1370 yd, the swim day moved in, 1500 typed, Log
  mv = drive(MULTI, SWIM.w, SWIM.rest, JOG.swim, SWIM.day); typeSwim('1500'); C.log(); C.back();
  e = C.entry(SWIM.w, SWIM.rest) || {}; progress(); c = chartVal('Weekly Swimming Volume', SWIM.w);
  cj.push(['swim-total', mv.offered && mv.moved && e.swim_yards === '1500' && c.drawn && near(c.v, HAND.swim), 'MULTI W' + SWIM.w + ' ' + mvTxt(mv, SWIM.day) + ', 1500 Log: swim_yards ' + J(e.swim_yards) + ', Weekly Swimming Volume ' + J(c.v) + ' (hand 1370 + 1500 = ' + HAND.swim + ')']);
  // average RPE, two efforts each: jog 7 + MON own-day 6; jog 7 + TUE moved in RPE 8
  drive(HALF, 1, 'wed', JOG.run, null); C.open(1, 'mon'); C.rpe('6'); C.back();
  e = C.entry(1, 'mon') || {}; progress(); c = chartVal('Average Session RPE', 1);
  cj.push(['rpe-own', e.rpe === '6' && c.drawn && near(c.v, HAND.rpeOwn), 'WED jog RPE 7 + MON own day RPE ' + J(e.rpe) + ': Average Session RPE W1 ' + J(c.v) + ' (hand (7 + 6) / 2 = ' + HAND.rpeOwn + ')']);
  mv = drive(HALF, 1, 'wed', JOG.run, 'tue'); C.rpe('8'); C.back();
  e = C.entry(1, 'wed') || {}; progress(); c = chartVal('Average Session RPE', 1);
  cj.push(['rpe-double', mv.offered && mv.moved && e.rpe === '8' && c.drawn && near(c.v, HAND.rpeDouble), mvTxt(mv, 'tue') + ', RPE ' + J(e.rpe) + ' over the jog\'s 7: Average Session RPE W1 ' + J(c.v) + ' (hand (8 + 7) / 2 = ' + HAND.rpeDouble + ')']);
  // maxDist: three pace-only recovery runs (no run_dist) with hist snapshots, then the WED jog; then a 5.2 session on the jog's day
  const REC = []; for(const w of Object.keys(HALF.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){ if(REC.length < 3 && !(w === 1 && d === 'wed') && /recovery/i.test(subOf(HALF, w, d)) && ctOf(HALF.weeks[w][d]) === 'run') REC.push([w, d]); }
  C.use(HALF); C.setNow(at(1, 'wed'));
  REC.forEach(([w, d], i) => { C.ev('currentWeek=' + w + "; snapshotDay(" + w + ",'" + d + "'); currentWeek=1;");
    C.setLog(w, d, { rpe:'', run_dist:'', run_pace:'10:30/mi', run_mins:'25', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'', swapFrom:'', swapTo:'', week:w, ts:at(1, 'wed') - (i + 1) * 3600000 }); });
  sheetJog(1, 'wed', JOG.run); sd = C.ev('seedFromPriorPrograms(' + C.now() + ')');
  const sdA = sd ? { n:sd.n, maxDist:sd.maxDist } : null;
  cj.push(['maxdist-jog', REC.length === 3 && !!sd && sd.n === 3 && near(sd.maxDist, HAND.maxJog), 'recovery runs ' + J(REC) + ' (pace only), WED jog 3.7: seed ' + J(sdA) + ' (hand n 3, maxDist ' + HAND.maxJog + ')']);
  mv = (() => { const r = sheetMove(1, 'wed', 'sat'); C.open(1, 'wed'); return r; })(); C.roll(C.need('log_run_dist'), SESS.dist); C.log(); C.back();
  sd = C.ev('seedFromPriorPrograms(' + C.now() + ')'); const sdB = sd ? { n:sd.n, maxDist:sd.maxDist } : null;
  cj.push(['maxdist-double', mv.offered && mv.moved && !!sd && near(sd.maxDist, HAND.maxDouble), mvTxt(mv, 'sat') + ', 5.20 Log on the jog\'s day: seed ' + J(sdB) + ' (hand maxDist max(5.2, 3.7) = ' + HAND.maxDouble + ', never 8.9)']);
  // ladder: MON 2.00 on its own day + the WED jog; a lift moved onto the jog's day, Done untouched
  drive(HALF, 1, 'wed', JOG.run, null); C.open(1, 'mon'); C.roll(C.need('log_run_dist'), SESS.dist2); C.log(); C.back();
  e = C.entry(1, 'mon') || {}; const ld1 = ladder(1);
  cj.push(['ladder-own', e.run_dist === SESS_BYTES.dist2 && near(ld1, HAND.ladOwn), 'MON 2.00 Log (run_dist ' + J(e.run_dist) + ') + WED jog 3.7: ladderWeekly W1 ' + J(ld1) + ' (hand max(2.0, 3.7) = ' + HAND.ladOwn + ')']);
  mv = drive(HALF, 1, 'wed', JOG.run, 'tue'); C.tap('wed', 'complete'); const ld3 = ladder(1);
  cj.push(['ladder-lift', mv.offered && mv.moved && near(ld3, HAND.ladLift), mvTxt(mv, 'tue') + ', Done untouched: ladderWeekly W1 ' + J(ld3) + ' (hand ' + HAND.ladLift + '; V237 0)']);
  row('D224-progress', cj);
});

// ── D224-journal (R6 as restated by A1) ──────────────────────────────────────────────────────────────────────────────
guard('D224-journal', () => {
  const cj = [verCj('D224-journal'), halfHostCj()];
  const runLine = LINE(37, 'run', 7), rideLine = LINE(20, 'ride', 5), walkLine = LINE(37, 'walk', 7);
  // the Done-untouched moved-in day over the jog
  let mv = drive(HALF, 1, 'wed', JOG.run, 'tue'); C.tap('wed', 'complete');
  let jr = journal(progress()), r = rowOf(jr, 1, 'Wed');
  cj.push(['moved-done', mv.offered && mv.moved && !!r && jogLinesOf(r).length === 1 && jogLinesOf(r)[0] === runLine && !headOf(r).length && !labelHits(r).length,
    mvTxt(mv, 'tue') + ', Done untouched: Wed row ' + (r ? J(r.segs) : 'ABSENT') + ' (hand jog lines [' + J(runLine) + '], no "RPE n —" header, no RPE_LABELS word)']);
  // a legacy V237 cross-type entry: bike holds mins, run holds only its distance
  C.use(HALF); C.setNow(at(1, 'wed')); C.setLog(1, 'wed', LEGACY_X);
  jr = journal(progress()); r = rowOf(jr, 1, 'Wed');
  cj.push(['legacy-nomins', !!r && J(jogLinesOf(r)) === J([rideLine]) && !headOf(r).length && !labelHits(r).length,
    'planted ' + J(LEGACY_X) + ': Wed row ' + (r ? J(r.segs) : 'ABSENT') + ' (hand jog lines [' + J(rideLine) + '], no run line: run holds no mins; no header, no label word)']);
  // a walk-only program
  drive(HALF, 1, 'wed', JOG.walk, null); const ph = progress(); jr = journal(ph); r = rowOf(jr, 1, 'Wed');
  const nRows = Object.values(jr).reduce((a, x) => a + x.length, 0);
  cj.push(['walk-renders', !ph.includes('No data yet'), 'walk jog the only entry: Progress ' + (ph.includes('No data yet') ? 'falls back to "No data yet"' : 'renders') + ' (hand renders)']);
  cj.push(['walk-row', !!r && nRows === 1 && J(jogLinesOf(r)) === J([walkLine]) && !headOf(r).length, 'journal rows ' + nRows + ', Wed row ' + (r ? J(r.segs) : 'ABSENT') + ' (hand 1 row, jog lines [' + J(walkLine) + '], no header)']);
  // ts order within W1: FRI logged, then MON, then the WED jog, an hour apart, on W1 SUN
  C.use(HALF); C.setNow(at(1, 'sun', 9));
  C.open(1, 'fri'); C.rpe('6'); C.back(); C.setNow(at(1, 'sun', 10));
  C.open(1, 'mon'); C.rpe('6'); C.back(); C.setNow(at(1, 'sun', 11));
  sheetJog(1, 'wed', JOG.run);
  const ts = ['fri', 'mon', 'wed'].map(d => (C.entry(1, d) || {}).ts);
  jr = journal(progress()); const order = (jr[1] || []).map(x => x.day);
  cj.push(['ts-order', J(order) === J(['Fri', 'Mon', 'Wed']), 'stored ts fri/mon/wed ' + J(ts) + ': W1 rows ' + J(order) + ' (hand ["Fri","Mon","Wed"], logging order)']);
  row('D224-journal', cj);
});

// ── slice 5 hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────
// R7 (D225 Amendment 2): m1 part C's population, typed from the ruling: seed 76308, 7 configs, 22 days x 2 modes; tapped
// back, swap-blank offered 22/22 and logged-then-swap 0/22. The configs are m1's SRC_DEF (tests/measure/v238_restmovelog.js
// and slice 3's self-check, the same list); the arriving sport is m1's: the first of bike, run, swim that is not planned.
const R7N = { cfgs:7, days:22, away:44, blankBack:22, loggedBack:0, underBack:0 };
const R7_SRC = () => [['HALF_MANNY', HALF_CFG], ['run10k+bike+swim', MULTI_CFG],
  ['run_pace', mkCfg([['run', 'run_pace_goal', { targetDist:'1.5', targetMins:'10', targetSecs:'30' }]], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
  ['run_base', mkCfg([['run', 'run_base', {}]], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
  ['swim_base', mkCfg([['swim', 'swim_base', {}]], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
  ['bike_ftp', mkCfg([['bike', 'bike_ftp', {}]], 'balanced', 'intermediate', 'commercial', ['sun', 'wed'], 76308)],
  ['run_5k', mkCfg([['run', 'run_5k', {}]], 'strength', 'advanced', 'commercial', ['sat', 'sun'], 76308)]];
const SWAP_ORDER = ['bike', 'run', 'swim'];
const PRIMARY = ['log_run_dist', 'log_bike_mins', 'log_swim_yards', 'log_run_rep_time', 'log_run_mins'];   // m1 typeOne's node order
// R8 (D226): run 37 / 3.7 / 7 then 20 / 2 / 5 -> 57 / 5.7 / max(7, 5) = 7; 37 / 3.7 / 5 then 20 / 2 / 9 -> 57 / 5.7 / max(5, 9) = 9;
// run 37 / 3.7 / 7 then bike 20 / 5 -> run kept whole, bike {mins 20, rpe 5}.
const JOG2 = { run20:{ type:'run', mins:20, dist:'2', rpe:5 }, run20hard:{ type:'run', mins:20, dist:'2', rpe:9 },
  run37easy:{ type:'run', mins:37, dist:'3.7', rpe:5 }, bike20:{ type:'bike', mins:20, dist:'', rpe:5 } };
const MORE = { runRun:{ run:{ mins:57, dist:5.7, rpe:7 } }, runRunUp:{ run:{ mins:57, dist:5.7, rpe:9 } },
  runBike:{ run:{ mins:37, dist:3.7, rpe:7 }, bike:{ mins:20, rpe:5 } } };
// R9 / R10: V237 bytes typed from the ruling's tables (the V237 column; Amendment 1's appended rows), and what they read as.
const LEG1 = { rest_cardio:true, rest_type:'run', rest_mins:37, rpe:7, run_dist:3.7 };
const LEG_SETS = { front_squat:{ r:['5', '5'], w:['135', '135'], L:'' } };          // writeSetDraft's {r, w, L} draft
const LEG2_TS = at(1, 'wed', 9);
const LEG2 = { rest_cardio:true, rest_type:'run', rest_mins:37, rpe:7, run_dist:3.7, sets:LEG_SETS, week:1, ts:LEG2_TS };
const LENS1 = { restLog:{ run:{ mins:37, dist:3.7, rpe:7 } } };                                  // the lens invents no week, no ts
const LENS2 = { restLog:{ run:{ mins:37, dist:3.7, rpe:7 } }, sets:LEG_SETS, week:1, ts:LEG2_TS };
const LENS2_KEYS = ['restLog', 'sets', 'ts', 'week'];
const LEG_BR = { rest_cardio:true, rest_type:'run', rest_mins:20, rpe:5, bike_mins:37, run_dist:2 };   // bike>run
const LEG_BB = { rest_cardio:true, rest_type:'bike', rest_mins:20, rpe:5, bike_mins:57 };              // bike>bike
const R1E = { restLog:{ run:{ mins:37, dist:3.7, rpe:7 } }, week:1, ts:at(1, 'wed', 9) };            // R1's stored shape
const HERO_BTN = { more:'Log more', none:'Log cardio' };
// R11 (D227): the digest the ruling printed for HALF_MANNY at 238 (standing ruling 5); the era row must carry it.
const HAND_DIGEST_238 = '2d35e8f743680cfa';
{ const chk = [[37 + 20, 57], [3.7 + 2, 5.7], [Math.max(7, 5), 7], [Math.max(5, 9), 9]];
  for(const [a, b] of chk) if(Math.abs(a - b) > 1e-9) throw new Error('hand oracle self-check ' + a + ' != ' + b); }
const rlEq = (a, b) => !!a && typeof a === 'object' && J(Object.keys(a).sort()) === J(Object.keys(b).sort())
  && Object.keys(b).every(t => !!a[t] && J(Object.keys(a[t]).sort()) === J(Object.keys(b[t]).sort()) && Object.keys(b[t]).every(k => near(a[t][k], b[t][k])));
const offeredOn = (w, d) => Array.from(C.ev('restMoveCandidates(' + w + ')') || []).map(c => c.day).includes(d);
const swapChip = s => { C.ev('setCardioSwap(' + J(s) + ')'); C.advance(50); };
// one session value on the form as it stands (formHtml: the opened body, or the cardio fields a chip re-rendered): the first
// PRIMARY node on it; a wheel's column 0 rolled to its first positive row other than the one it shows (a roll onto the
// shown row commits nothing), the yards box typed 1500 (its input event). Returns what landed in the node, or null when the
// form holds no PRIMARY node. Presence is read off the markup: the mock creates any node a reader asks for.
let formHtml = '';
const sessionValue = () => {
  for(const id of PRIMARY){
    if(!formHtml.includes('id="' + id + '"')) continue;
    const wh = C.wheel(id);
    if(wh){ const c0 = wh._cols[0], cur = Math.round(c0.scrollTop / 44);
      const k = c0.items.findIndex((x, i) => i !== cur && x.v !== '' && +x.v > 0 && x.v !== (c0.items[cur] || {}).v); if(k < 0) return null;
      C.roll(wh, [['0', c0.items[k].v]]); return id + '=' + J((C.els[id] || {}).value); }
    if(id === 'log_swim_yards'){ typeSwim('1500'); return id + '=' + J(C.els[id].value); }
  }
  return null; };
const heroOf = (w, d) => { C.ev('currentWeek=' + w + '; renderWeekView()'); const h = C.els.daysList.innerHTML || '';
  const lines = []; const re = /<div class="wk-rest-logged">([^<]*)<\/div>/g; let m; while((m = re.exec(h))) lines.push(m[1]);
  const b = h.match(new RegExp("openRestSheet\\(" + w + ",'" + d + "','cardio'\\)\">([^<]*)</button>"));
  return { lines, btn:b ? b[1] : null, rest:h.includes('REST DAY') }; };

// ── D225-swapaway (R7 as restated by D225 Amendment 2) ───────────────────────────────────────────────────────────────
guard('D225-swapaway', () => {
  const cj = [verCj('D225-swapaway')];
  const days = []; let cfgs = 0;
  for(const [nm, cfg] of R7_SRC()){ const prog = C.IA.buildProgram(JSON.parse(J(cfg)));
    const rest = DAYS.find(d => prog.weeks[1][d] && prog.weeks[1][d].rest); if(!rest) continue; cfgs++;
    for(const d of DAYS){ const x = prog.weeks[1][d], ct = ctOf(x); if(x && !x.rest && ['run', 'bike', 'swim'].includes(ct)) days.push([nm, prog, rest, d, ct]); } }
  const N = { logged:0, landed:0, parkedLogged:0, away:0, awayOff:0, back:0, backClean:0, blank:0, blankOff:0, loggedBack:0, loggedOff:0, loggedNums:0, under:0, underState:0, underOff:0 };
  const ex = {}; const note = (k, s) => { ex[k] = ex[k] || []; if(ex[k].length < 3) ex[k].push(s); };
  const sessHeld = e => SEVEN.filter(k => e[k]);
  for(const [nm, prog, rest, d, ct] of days){
    const t = SWAP_ORDER.find(s => s !== ct), tag = nm + ' W1 ' + d + ' ' + ct + '>' + t;
    for(const mode of ['logged-then-swap', 'swap-blank', 'logged-under-swap']){
      C.use(prog); C.setNow(at(1, rest)); C.open(1, d); formHtml = C.els.detailBody.innerHTML || '';
      if(mode === 'logged-then-swap'){ const v = sessionValue(); C.log(); const e = C.entry(1, d) || {};
        if(v && sessHeld(e).length) N.logged++; else note('logged', tag + ' ' + J(v) + ' ' + J(e)); }
      swapChip(t); formHtml = C.els.cardioFields.innerHTML || '';
      if(mode === 'logged-under-swap'){ const v = sessionValue(); C.log(); const e = C.entry(1, d) || {};
        if(!(v && e.swapTo === t && sessHeld(e).length)) note('under-log', tag + ' ' + J(v) + ' ' + J(e)); }
      else { const L1 = C.entry(1, d) || {}; N.away++;
        if(L1.swapTo === t && (mode !== 'logged-then-swap' || (L1.parked && L1.parked[ct]))) N.landed++; else note('landed', tag + ' ' + mode + ' ' + J(L1));
        if(mode === 'logged-then-swap' && L1.parked && L1.parked[ct]) N.parkedLogged++;
        if(offeredOn(1, d)){ N.awayOff++; note('away', tag + ' ' + mode); } }
      swapChip(ct);
      const L2 = C.entry(1, d) || {}, off2 = offeredOn(1, d), clean = L2.swapTo === '' && !('parked' in L2);
      if(mode === 'logged-under-swap'){ N.under++;
        if(L2.swapTo === '' && L2.parked && L2.parked[t] && !sessHeld(L2).length) N.underState++; else note('under-state', tag + ' ' + J(L2));
        if(off2){ N.underOff++; note('under-off', tag); } continue; }
      N.back++; if(clean) N.backClean++; else note('back-clean', tag + ' ' + mode + ' ' + J(L2));
      if(mode === 'swap-blank'){ N.blank++; if(off2) N.blankOff++; else note('blank-off', tag); }
      else { N.loggedBack++; if(off2){ N.loggedOff++; note('logged-off', tag); } if(sessHeld(L2).length) N.loggedNums++; else note('logged-nums', tag + ' ' + J(L2)); }
    }
  }
  const eg = k => ex[k] ? ' e.g. ' + ex[k].join(' | ') : '';
  S.info('D225-swapaway population: ' + days.map(x => x[0] + ':' + x[3] + ':' + x[4]).join(' '));
  cj.push(['population', cfgs === R7N.cfgs && days.length === R7N.days, cfgs + ' configs with a W1 rest day, ' + days.length + ' W1 run/bike/swim days (hand ' + R7N.cfgs + ', ' + R7N.days + ')']);
  cj.push(['logged', N.logged === R7N.days, 'logged-then-swap: a session number stored before the chip on ' + N.logged + '/' + days.length + ' (hand all)' + eg('logged')]);
  cj.push(['swap-landed', N.landed === R7N.away && N.parkedLogged === R7N.days, 'after the chip swapTo the arriving sport on ' + N.landed + '/' + N.away + ', the planned set parked on ' + N.parkedLogged + '/' + R7N.days + ' logged days (hand ' + R7N.away + ', ' + R7N.days + ')' + eg('landed')]);
  cj.push(['away-offered', N.away === R7N.away && N.awayOff === 0, 'swapped-away days offered by restMoveCandidates ' + N.awayOff + '/' + N.away + ' (hand 0/' + R7N.away + '; V237 44/44)' + eg('away')]);
  cj.push(['back-clean', N.back === R7N.away && N.backClean === R7N.away, 'tapped back: swapTo "" and no parked key on ' + N.backClean + '/' + N.back + ' (hand ' + R7N.away + '/' + R7N.away + '; a guard, V237 alike)' + eg('back-clean')]);
  cj.push(['back-blank', N.blank === R7N.days && N.blankOff === R7N.blankBack, 'tapped back, swap-blank offered ' + N.blankOff + '/' + N.blank + ' (hand ' + R7N.blankBack + '/' + R7N.days + '; a guard, V237 alike)' + eg('blank-off')]);
  cj.push(['back-logged', N.loggedBack === R7N.days && N.loggedOff === R7N.loggedBack && N.loggedNums === R7N.days, 'tapped back, logged-then-swap offered ' + N.loggedOff + '/' + N.loggedBack + ', the session number back at the top level on ' + N.loggedNums + '/' + N.loggedBack + ' (hand ' + R7N.loggedBack + '/' + R7N.days + ' and ' + R7N.days + '/' + R7N.days + ': D219 item 2; a guard, V237 alike)' + eg('logged-off') + eg('logged-nums')]);
  // D225's amended sentence ("not offered if a session's numbers were" logged under the swap) and E10's bare
  // lg.swapTo||lg.parked: the tap back parks the swap's numbers, leaves swapTo '' and the top level blank, so parked alone
  // is what keeps the day off the list.
  cj.push(['under-swap', N.under === R7N.days && N.underState === R7N.days && N.underOff === R7N.underBack, 'a number logged under the swap, then tapped back: parked holds it, swapTo "", top level blank on ' + N.underState + '/' + N.under + '; offered ' + N.underOff + '/' + N.under + ' (hand ' + R7N.days + '/' + R7N.days + ', 0/' + R7N.days + '; V237 offers them)' + eg('under-log') + eg('under-state') + eg('under-off')]);
  row('D225-swapaway', cj);
});

// ── D226-logmore (R8) ────────────────────────────────────────────────────────────────────────────────────────────────
guard('D226-logmore', () => {
  const cj = [verCj('D226-logmore'), halfHostCj()];
  const ARMS = [['run-run', HALF, 1, 'wed', [JOG.run, JOG2.run20], MORE.runRun, 'higher first: 7 then 5'],
    ['run-run-up', HALF, 1, 'wed', [JOG2.run37easy, JOG2.run20hard], MORE.runRunUp, 'higher last: 5 then 9'],
    ['run-bike', MULTI, BIKE.w, BIKE.rest, [JOG.run, JOG2.bike20], MORE.runBike, 'another type']];
  for(const [nm, prog, w, d, seq, want, why] of ARMS){
    C.use(prog); C.setNow(at(w, d)); seq.forEach(j => sheetJog(w, d, j));
    const e = C.entry(w, d) || {}, top = TOP_ABSENT.filter(k => k in e);
    cj.push([nm, rlEq(e.restLog, want) && !top.length, 'W' + w + ' ' + d + ' ' + seq.map(j => J(j)).join(' then ') + ' (' + why + '): restLog ' + CJ(e.restLog)
      + (top.length ? ', top-level ' + top.map(k => k + '=' + J(e[k])).join(' ') : '') + ' (hand ' + CJ(want) + ', none of ' + TOP_ABSENT.join(' ') + ')']);
  }
  row('D226-logmore', cj);
});

// ── D223-lens (R9 as restated by A1) ─────────────────────────────────────────────────────────────────────────────────
guard('D223-lens', () => {
  const cj = [verCj('D223-lens'), halfHostCj()];
  const runLine = LINE(37, 'run', 7);
  // the V237 single log alone, read through every reader
  C.use(HALF); C.setNow(at(1, 'wed')); C.setLog(1, 'wed', LEG1);
  const raw0 = C.logs();
  const gl = (C.ev('getLogs()') || {}).w1_wed, gf = (C.ev("getLogsFor('g238')") || {}).w1_wed;
  cj.push(['getLogs', CJ(gl) === CJ(LENS1), 'planted ' + J(LEG1) + ': getLogs().w1_wed ' + CJ(gl) + ' (hand ' + CJ(LENS1) + ')']);
  cj.push(['getLogsFor', CJ(gf) === CJ(LENS1), "getLogsFor('g238').w1_wed " + CJ(gf) + ' (hand ' + CJ(LENS1) + ')']);
  const m = milesTile(1);
  cj.push(['miles', m === '3.7', 'week MILES ' + J(m) + ' (hand "3.7")']);
  const hr = heroOf(1, 'wed');
  cj.push(['hero', hr.rest && J(hr.lines) === J([runLine]) && hr.btn === HERO_BTN.more, 'rest hero ' + hr.rest + ' lines ' + J(hr.lines) + ' button ' + J(hr.btn) + ' (hand ' + J([runLine]) + ', ' + J(HERO_BTN.more) + ')']);
  const ph = progress(), cr = chartVal('Weekly Running Mileage', 1), ca = chartVal('Average Session RPE', 1);
  cj.push(['progress', cr.drawn && near(cr.v, 3.7) && ca.drawn && near(ca.v, 7), 'Weekly Running Mileage W1 ' + J(cr.v) + ', Average Session RPE W1 ' + J(ca.v) + ' (hand 3.7, 7)']);
  const r = rowOf(journal(ph), 1, 'Wed');
  cj.push(['journal', !!r && J(jogLinesOf(r)) === J([runLine]) && !headOf(r).length && !labelHits(r).length, 'Wed row ' + (r ? J(r.segs) : 'ABSENT') + ' (hand jog lines [' + J(runLine) + '], no "RPE n —" header, no RPE_LABELS word)']);
  const ld = ladder(1);
  cj.push(['ladder', near(ld, 3.7), 'ladderWeekly W1 ' + J(ld) + ' (hand 3.7)']);
  const raw1 = C.logs();
  cj.push(['reads-write-nothing', raw1 === raw0, 'raw ia_logs_g238 after the reads above ' + (raw1 === raw0 ? 'byte-identical' : 'CHANGED to ' + raw1) + ' (hand unchanged; a guard, V237 alike)']);
  // both planted, then boot, the week view and Progress: nothing written; one saveLogs on another day stores both converted
  C.use(HALF); C.setNow(at(1, 'wed')); C.setLog(1, 'wed', LEG1); C.setLog(1, 'sun', LEG2);
  const b0 = C.logs(), b0b = C.logs();
  cj.push(['baseline', b0 === b0b && J(Object.keys(JSON.parse(b0)).sort()) === J(['w1_sun', 'w1_wed']), 'planted store read twice ' + (b0 === b0b ? 'equal' : 'DIFFERENT') + ', keys ' + J(Object.keys(JSON.parse(b0)).sort()) + ' (hand equal, ["w1_sun","w1_wed"])']);
  C.ev('init()'); C.advance(500); C.ev('currentWeek=1; renderWeekView()'); progress();
  const b1 = C.logs();
  cj.push(['boot-writes-nothing', b1 === b0, 'raw ia_logs_g238 after init(), renderWeekView and renderProgressScreen ' + (b1 === b0 ? 'byte-identical' : 'CHANGED to ' + b1) + ' (hand unchanged; a guard, V237 alike)']);
  const s2 = (C.ev('getLogs()') || {}).w1_sun || {};
  const s2top = TOP_ABSENT.filter(k => k in s2);
  cj.push(['sets-entry', CJ(s2) === CJ(LENS2) && J(s2.sets) === J(LEG_SETS) && J(Object.keys(s2).sort()) === J(LENS2_KEYS) && !s2top.length,
    'planted ' + J(LEG2) + ': getLogs().w1_sun ' + CJ(s2) + (s2top.length ? ', still ' + s2top.join(' ') : '') + ' (hand ' + CJ(LENS2) + ', sets byte-equal, keys ' + J(LENS2_KEYS) + ')']);
  C.open(1, 'mon'); C.rpe('6'); C.back();
  const b2 = C.logs(), A = JSON.parse(b2), mon = A.w1_mon || {};
  cj.push(['save-converts', b2 !== b1 && mon.rpe === '6' && CJ(A.w1_wed) === CJ(LENS1) && CJ(A.w1_sun) === CJ(LENS2) && J((A.w1_sun || {}).sets) === J(LEG_SETS),
    'one saveLogs (MON slider 6, stored rpe ' + J(mon.rpe) + '): raw w1_wed ' + CJ(A.w1_wed) + ', raw w1_sun ' + CJ(A.w1_sun) + (b2 === b1 ? ', store UNCHANGED' : '') + ' (hand "6", ' + CJ(LENS1) + ', ' + CJ(LENS2) + ')']);
  row('D223-lens', cj);
});

// ── D224-hero (R10 as restated by A1) ────────────────────────────────────────────────────────────────────────────────
guard('D224-hero', () => {
  const cj = [verCj('D224-hero'), halfHostCj()];
  const CASES = [['none', null, [], HERO_BTN.none], ['r1', R1E, [LINE(37, 'run', 7)], HERO_BTN.more],
    ['v237-single', LEG1, [LINE(37, 'run', 7)], HERO_BTN.more],
    ['v237-bike>run', LEG_BR, [LINE(20, 'run', 5), LINE(37, 'ride', '—')], HERO_BTN.more],
    ['v237-bike>bike', LEG_BB, [LINE(57, 'ride', 5)], HERO_BTN.more]];
  for(const [nm, entry, lines, btn] of CASES){
    C.use(HALF); C.setNow(at(1, 'wed')); if(entry) C.setLog(1, 'wed', entry);
    const h = heroOf(1, 'wed');
    cj.push([nm, h.rest && J(h.lines) === J(lines) && h.btn === btn, (entry ? 'planted ' + J(entry) : 'no entry') + ': rest hero ' + h.rest + ', lines ' + J(h.lines) + ', button ' + J(h.btn) + ' (hand ' + J(lines) + ', ' + J(btn) + ')'
      + (nm === 'v237-single' ? '; V237\'s own line, a guard' : '')]);
  }
  row('D224-hero', cj);
});

// ── D227-digest (R11) ────────────────────────────────────────────────────────────────────────────────────────────────
guard('D227-digest', () => {
  const cj = [verCj('D227-digest')];
  const T = H.MANNY_DIGEST_BY_VERSION || {}, row238 = T[ERA], rowV = T[VER];
  const P = H.load(ART);            // a pristine load: the real clock, no env patches
  const d1 = H.progDigest(P.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)))), d2 = H.progDigest(P.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))));
  cj.push(['era-238', row238 === HAND_DIGEST_238, 'MANNY_DIGEST_BY_VERSION[' + ERA + '] ' + J(row238 == null ? 'NO ROW' : row238) + ' (hand ' + HAND_DIGEST_238 + ', the ruling\'s printed digest)']);
  cj.push(['era-row', typeof rowV === 'string' && /^[0-9a-f]{16}$/.test(rowV), 'MANNY_DIGEST_BY_VERSION[' + VER + '] ' + J(rowV == null ? 'NO ROW' : rowV) + ' (hand: present, an unruled digest move has no row)']);
  cj.push(['self-stable', d1 === d2, 'HALF_MANNY seed ' + H.fixtures.HALF_MANNY.seed + ' built twice: ' + d1 + ' / ' + d2]);
  cj.push(['built', d1 === rowV, 'built ' + d1 + ' vs era row ' + J(rowV == null ? 'NO ROW' : rowV)]);
  row('D227-digest', cj);
});

if(C.errs.length) S.info('timer errors ' + C.errs.length + ': ' + C.errs.slice(0, 3).join(' | '));
S.info('g238 wall ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
S.summary();
