// g237_d220_distzero.js — GATE for D220 (P-DISTZERO: the miles and rep-time wheels read 0, never a dash; their zero
// faces 0.00 and 0:00 store ''; both first columns carry wrap:false by name), D221 (P-REOPENSTAMP: on a dose=dist form
// the planned-miles stamp is derived, re-derived on every save and never read back into the wheel) and D222 (scope:
// pace keeps its dash; no copy; no program output).
//
//   node tests/gates/g237_d220_distzero.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v237_rulings/v237_ruling_d220_d222.md (CONCURRED by Mario 2026-10-08), section
// "Gate rows" (row names and claims verbatim), with D220 "What changes" items 1 to 3 (the hand format table and D203's
// numeric rows), the Before/After block, and D222 "Pace: out" and "Program output".
// Evidence ruled against: tests/measure/v237_rulings/measure_distzero_mA.md and measure_reopenstamp_mB.md.
//
// SLICES. Slice 4a (this file's first cut) carries D220-zero, D220-format, D220-rows, D220-wrap, D222-pace and
// D222-digest. Slice 4b added D220-open, D220-tail, D220-clear-zero and D220-fixed-zero. Slices 4b and 4c append D220-open, D220-tail, D220-clear-zero, D220-fixed-zero and the five D221 rows:
// each adds its ids to LABEL (the row table), its hand oracles to the oracle block, and one guard() block per row ahead
// of the summary, driving the shared env C (mkEnv below, g236's, with g232's __FORCE hook; program id g237).
//
// ORACLES. Hand values typed from the ruling, never asked of the engine; _iawFormat, _iawParse and iaWheelHTML output
// is compared only to the literals below, never to itself:
//   dist [0,7,5] "0.75", [3,1,0] "3.10", [13,1,0] "13.10", [99,9,9] "99.99", [0,0,1] "0.01"; rept [0,45] "0:45",
//   [1,5] "1:05", [9,59] "9:59" (D220 item 2); D203's numeric rows '.86' -> [0,8,6], '3.1' -> [3,1,0], '3.456' ->
//   [3,4,5], '100' -> [99,0,0] (D220 item 3); the zero face and the blank or malformed parse land on zeros, pace keeps
//   ['',''] (D220 items 2 and 3, D222); rendered column lists typed by hand: dist whole miles '0'..'99' (100 rows), tenths
//   and hundredths '0'..'9', rep minutes '0'..'9', rep seconds '0'..'59', pace ['','4'..'17'] (15 rows), hms hours
//   '0'..'9' and minutes / seconds '0'..'59' (D215-rows); a wrapping column renders its hand list repeated a whole
//   number of times (two or more) with data-wrap "1" and data-len the hand list's length (D5, D216); pace control
//   [9,30] "9:30" and '9:30' -> [9,30] (D222: the pace wheel is untouched). HALF_MANNY digest 2d35e8f743680cfa (printed
//   by the ruling before the build; standing ruling 5; this ruling moves no digest).
// The engine is used only to render (iaWheelHTML), to call the two pure converters and _iawWraps, and to build
// HALF_MANNY for its digest.
//
// VERSION PREDICATE (standing rulings 2 and 4). D220, D221 and D222 ship at ia-version 237, read from the candidate's
// <meta name="ia-version">.
//   below 237      REFUSED: every row runs and carries a failing version conjunct, so every row FAILS by name.
//   237 and up     every row asserts (a minimum, never one exact version). D222-digest reads MANNY_DIGEST_BY_VERSION[VER].
// On the V236 body relabelled 237: D220-zero and D220-rows FAIL by their own conjuncts; D220-format, D220-wrap, D222-pace
// and D222-digest PASS (regression guards). Slice 4b: D220-open FAILS on the 0.00 / 0:00 faces (fri-faces, reps-face,
// generic-miles), D220-tail on lattice-no-nil, D220-clear-zero on live-zero / live-seven / live-nudge / legacy-dist-back /
// legacy-rept-back ("0.00" and "0:00" stored), D220-fixed-zero on zero-stamp (stores "0.00", no planned-miles stamp).
// D220 Amendment 1: the blank pace face is "—:00"; D220-open's two pace conjuncts pass on V236 and V237 by design (D222).
// Slice 4c: D221-seed FAILS on the hidden stamp "3.1", D221-clear on the surviving run_dist "3.1", D221-rolled on the
// collision conjunct, D221-swap on the cleared case; D221-restamp PASSES (regression guard).
//
// ROWS (ids are the ruling's names)
//   D220-zero     _iawFormat('dist',['0','0','0']) is ''; _iawFormat('rept',['0','0']) is ''; _iawParse('dist', s) for
//                 '' / 'abc' / '.' / '-1' / '0' / '0.00' is ['0','0','0']; _iawParse('rept', s) for '' / 'abc' / '45' /
//                 '0:00' is ['0','0']; _iawParse('pace','') is ['',''] and _iawFormat('pace',['','30']) is ''.
//   D220-format   (regression guard) the dist and rept hand format tables; D203's numeric parse rows.
//   D220-rows     rendered dist column 0 exactly '0'..'99' (100 items, no nil item, data-len 100, data-wrap ''), columns
//                 1 and 2 wrap; rept column 0 exactly '0'..'9' (10 items, data-wrap ''), column 1 wraps; pace column 0
//                 still begins with '' (15 items, data-wrap ''); hms unchanged (D215-rows).
//   D220-wrap     (regression guard, like D216-wrap) _iawWraps dist [false,true,true], rept [false,true], pace
//                 [false,true], hms [false,true,true]. The mutation dropping wrap:false on dist or rept trips it.
//   D222-pace     (regression guard) pace column 0 exactly ['','4'..'17'] (15 items, one nil, data-wrap ''), column 1
//                 wraps; _iawParse('pace', '') and ('pace', 'abc') are ['',''] (the blank line and the no-match line);
//                 _iawFormat('pace',['','30']) is ''; control [9,30] "9:30" and '9:30' -> [9,30].
//   D222-digest   era row: MANNY_DIGEST_BY_VERSION[VER] exists (conjunct) and is 2d35e8f743680cfa, and HALF_MANNY built on
//                 the candidate (twice, self-stable) digests to it.
//   (slice 4b, the device rows: HALF_MANNY on env C, a fresh store per drive, wheels driven by the scroll settle (C.roll);
//    forced doses through g232's __FORCE hook, a forced null dose through a second wrapper, __FORCE_NULL)
//   D220-open     fresh open, 0 inputs, no ia_logs_g237, no ia_hist_g237: W1 SAT (Long Run, plan 3.1) miles 3.10, time
//                 0:00:00; W1 FRI (Recovery Run, plan 25) time 0:25:00, miles 0.00; forced reps_dist rep time 0:00;
//                 forced null dose: generic form, miles 0.00, pace column 0 on the dash, pace face "—:00" (D220 Amendment 1).
//   D220-tail     W1 SAT miles [0,7,5] + time 0:47:13, Log: run_dist "0.75", run_mins "47.22", run_pace "62:58/mi",
//                 Run logged ✓, Logged ✓; W1 FRI miles 0.75, time untouched, Log: run_mins "", run_dist "0.75", run_pace
//                 "33:20/mi", derived note "assuming planned 25 min"; forced reps_dist 6 x 400 m, rep time 0:45, reps +1,
//                 Log: run_rep_time "0:45", run_reps "7", run_pace "3:01/mi". Lattice (measure mA's 54 programs, every run
//                 day opened, structural): no '' item on column 0 of any dist or rept wheel, lost 0 / N, N >= 1,908 + 48.
//   D220-clear-zero  W1 FRI LIVE (the B1 bytes) opens on 0.75 writing nothing; miles to 0.00: run_dist "", all seven '',
//                 Log, _hasLog (by hand) false, no nudge on re-render. Legacy run_dist "0.00" opens 0.00 writing nothing,
//                 0.75 then 0.00 stores "". Legacy run_rep_time "0:00" (forced reps_dist) the same, via 0:45.
//   D220-fixed-zero  W1 SAT Log of 4.20 + 0:47:13 (run_pace "11:15/mi"); miles to 0.00: run_dist "3.1", run_pace
//                 "15:14/mi", derived line "assuming planned 3.1 mi"; from the same setup miles to 0.75: "0.75", "62:58/mi".
//   (slice 4c, D221, HALF_MANNY W1 SAT plan 3.1; "the stamped entry" both by the app's Log of 0:47:13 and by the hand
//    literal STAMPED: run_dist "3.1" = String(3.1), run_mins "47.22", run_pace "15:14/mi")
//   D221-seed     stored stamp: open writes nothing, hidden '', face 3.10, derived "assuming planned 3.1 mi", Logged ✓
//                 (also reopened after the app's Log); stored "3.10": hidden "3.10", no "assuming"; "4.20": hidden and face 4.20.
//   D221-clear    reopened stamp, time 0:00:00: all seven '', Log; Back: status null, no nudge, restMoveCandidates(1) has
//                 sat, week tile 0, Progress W1 0, plannedVsLogged W1 act 0 (controls before the clear: 3.1 each, sat
//                 withheld); after Done the same bytes, status complete; miles to 0.00 alone: 0 inputs, store unchanged.
//   D221-restamp  reopened stamp: RPE 7 moves no cardio byte, rpe "7"; time 0:50:00: run_dist "3.1", run_pace "16:08/mi".
//   D221-rolled   stored "3.10" / "4.20" with "47.22": hidden its bytes; time to zero keeps it, run_mins and run_pace '',
//                 LIVE. Collision: the first two-decimal dose=dist day of the run-goal lattice (printed, with N of M), stored
//                 run_dist String(mi), run_mins '': open writes nothing; RPE 7 -> run_dist '' (the ruled cost).
//   D221-swap     reopened stamp, chip Bike: parked.run {run_dist "3.1", run_mins "47.22"}, note with its second sentence;
//                 chip Run: entry identical (ts stripped), Logged ✓. After a time clear, chip Bike: no parked, bare note.
//   Paces by hand: 47.22 min = 2833.2 s; 2833.2/0.75 = 3777.6, 1500/0.75 = 2000, 2833.2/3.1 = 913.9, 2833.2/4.2 = 674.6,
//                 45 / (400/1609.344) = 181.05 s/mi, each rounded to whole seconds, m:ss/mi (paceHand, never _fmtPaceMi).
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const S = require('../status')('g237_d220_distzero');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 237;
const t0 = Date.now();
const J = JSON.stringify;

// ── the row table: one LABEL per declared row (slices 4b and 4c append theirs here) ─────────────────────────────────
const LABEL = {
  'D220-zero':   "D220-zero (VER >= 237) the zero faces 0.00 and 0:00 format to ''; dist and rept parse of a blank or malformed string land on zeros; pace keeps ['',''] and its dash",
  'D220-format': 'D220-format (VER >= 237) the dist and rept hand format tables and D203 numeric parse rows, unchanged',
  'D220-rows':   "D220-rows (VER >= 237) rendered dist whole miles '0'..'99' (100, no nil, data-len 100, no wrap), tenths and hundredths wrap; rept minutes '0'..'9' (10, no wrap), seconds wrap; pace keeps the dash; hms unchanged",
  'D220-wrap':   'D220-wrap (VER >= 237) _iawWraps: dist [false,true,true], rept [false,true], pace [false,true], hms [false,true,true]',
  'D222-pace':   "D222-pace (VER >= 237) the pace wheel is untouched: rows ['','4'..'17'], blank and malformed parse ['',''], the dash formats to ''",
  'D222-digest': 'D222-digest (VER >= 237, era row) MANNY_DIGEST_BY_VERSION[VER] exists and is 2d35e8f743680cfa; HALF_MANNY digests to it',
  'D220-open':   'D220-open (VER >= 237) a fresh open writes nothing: W1 SAT 3.10 / 0:00:00, W1 FRI 0:25:00 / 0.00, forced reps_dist 0:00, forced null dose 0.00 / —:00',
  'D220-tail':   "D220-tail (VER >= 237) Mario's case: W1 SAT 0.75 + 0:47:13 Log, W1 FRI 0.75 Log, forced reps_dist 0:45 + 1 rep Log, stored by hand; no '' item on any dist or rept column 0 across the lattice",
  'D220-clear-zero': "D220-clear-zero (VER >= 237) a free miles wheel rolled to 0.00 stores '' (LIVE 0.75 and legacy 0.00); a rep time wheel rolled to 0:00 stores '' (legacy 0:00)",
  'D220-fixed-zero': 'D220-fixed-zero (VER >= 237) a LIVE dist form (47.22, 4.20): miles to 0.00 lands the planned stamp 3.1 and its pace; miles to 0.75 stores 0.75 and its pace',
  'D221-seed':    "D221-seed (VER >= 237) a stored stamp \"3.1\" opens with hidden '' on the plan face 3.10, \"assuming planned 3.1 mi\", Logged ✓, writing nothing; a rolled \"3.10\" or \"4.20\" seeds its own bytes",
  'D221-clear':   'D221-clear (VER >= 237) a reopened stamped long run clears in one gesture (time to 0:00:00): all seven blank, Log; Back: unmarked, no nudge, offered to the rest sheet, week / Progress / drift miles 0; after Done the same, still complete; miles to 0.00 alone writes nothing',
  'D221-restamp': 'D221-restamp (VER >= 237, regression guard) a reopened stamped long run: RPE to 7 moves no cardio byte; time to 0:50:00 re-stamps "3.1" and re-derives 16:08/mi',
  'D221-rolled':  'D221-rolled (VER >= 237) an athlete-rolled "3.10" or "4.20" survives a reopened time clear as a LIVE miles-only log; a two-decimal plan stored byte-equal to its stamp drops on the next LIVE write (the ruled cost)',
  'D221-swap':    'D221-swap (VER >= 237) a reopened stamped long run parks the stamp with its minutes on chip Bike (note keeps its second sentence) and returns byte-identical on chip Run; after a time clear chip Bike parks nothing',
};
const IDS = Object.keys(LABEL);
S.declare(IDS);

// ── hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────────────
const seq = (a, b) => { const o = []; for(let v = a; v <= b; v++) o.push(String(v)); return o; };   // typed range, not the engine's
const Z3 = ['0', '0', '0'], Z2 = ['0', '0'], NIL2 = ['', ''];
const DIST_FMT = [[['0', '7', '5'], '0.75'], [['3', '1', '0'], '3.10'], [['13', '1', '0'], '13.10'], [['99', '9', '9'], '99.99'], [['0', '0', '1'], '0.01']];
const REPT_FMT = [[['0', '45'], '0:45'], [['1', '5'], '1:05'], [['9', '59'], '9:59']];
const D203_NUM = [['.86', ['0', '8', '6']], ['3.1', ['3', '1', '0']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];
const DIST_ZERO_PARSE = ['', 'abc', '.', '-1', '0', '0.00'];
const REPT_ZERO_PARSE = ['', 'abc', '45', '0:00'];
const MILES = seq(0, 99), DIGIT = seq(0, 9), SIXTY = seq(0, 59), PACE0 = [''].concat(seq(4, 17));
const WRAPS_WANT = { dist:[false, true, true], rept:[false, true], pace:[false, true], hms:[false, true, true] };
const HALF_DIGEST = '2d35e8f743680cfa';
// slice 4b: paces by hand from seconds typed here (never _fmtPaceMi): whole seconds per mile rounded, m:ss/mi
const paceHand = (sec, mi) => { const t = Math.round(sec / mi); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') + '/mi'; };
const SEC_4713 = 47 * 60 + 13.2;                 // "47.22" min stored = 2833.2 s (0:47:13 rounds to 47.22 min)
const SEC_25 = 25 * 60;                          // W1 FRI plan 25 min = 1500 s
const MI_REP = 400 / 1609.344;                   // forced reps_dist 400 m = 0.248548 mi
const HAND = { p075:paceHand(SEC_4713, 0.75),    // 3777.6 s/mi -> "62:58/mi" (ruling A2)
  pFri:paceHand(SEC_25, 0.75),                   // 2000 s/mi -> "33:20/mi" (ruling B1)
  pPlan:paceHand(SEC_4713, 3.1),                 // 913.9 s/mi -> "15:14/mi" (ruling A8)
  p420:paceHand(SEC_4713, 4.2),                  // 674.6 s/mi -> "11:15/mi" (setup of D220-fixed-zero)
  pRep:paceHand(45, MI_REP) };                   // 181.05 s/mi -> "3:01/mi" (forced reps_dist 0:45 per 400 m)
{ const lit = { p075:'62:58/mi', pFri:'33:20/mi', pPlan:'15:14/mi', p420:'11:15/mi', pRep:'3:01/mi' };   // the arithmetic above, typed out
  for(const k in lit) if(HAND[k] !== lit[k]) throw new Error('hand oracle self-check ' + k + ' ' + HAND[k] + ' != ' + lit[k]); }
const FORCED_RD = { k:'reps_dist', reps:6, m:400, tgt:480 };   // g236 D218-reps' forced dose
const SEVEN = ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time', 'bike_mins', 'swim_yards'];
const NUDGE = 'You logged this one but never marked it.';
const COPY = { log:'Log', logged:'Logged ✓', run:'Run logged ✓' };
const LAT_FLOOR = { dist:1908, rept:48 };        // measure mA (tests/measure/v237_distzero.out.txt section 2): 54 programs, 1,956 run days
// slice 4c (D221): the stamp bytes, typed. HALF_MANNY's grid line "W1 SAT Full Body Support {Long Run}" (ruling header)
// carries a dose=dist plan of 3.1 mi; the V148 stamp writes String() of that number. Never read from the app's stamp.
const PLAN_SAT = 3.1, STAMP = String(PLAN_SAT);  // "3.1"
const SEC_50 = 50 * 60;                          // time rolled to 0:50:00 = 3000 s
HAND.p50 = paceHand(SEC_50, PLAN_SAT);           // 3000 / 3.1 = 967.7 s/mi -> "16:08/mi" (ruling, "The gesture, after")
if(STAMP !== '3.1' || HAND.p50 !== '16:08/mi') throw new Error('hand oracle self-check D221: ' + STAMP + ' ' + HAND.p50);
// the full entry shape persistLogFields writes (week, swapFrom, swapTo ride every save), typed, so a byte comparison
// after a round trip measures D221 and not the shape normalisation of a hand-made legacy entry
const STAMPED = { rpe:'', run_dist:STAMP, run_pace:HAND.pPlan, run_mins:'47.22', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'', week:1, swapFrom:'', swapTo:'' };
const ROLLED = { '3.10':HAND.pPlan, '4.20':HAND.p420 };   // athlete-rolled miles bytes and the pace each derives with "47.22"
// cardioSwapNoteText (:13438) typed: active Bike, planned Run; the second sentence prints only over a parked number
const NOTE_BARE = 'Counts toward Bike, not Run.', NOTE_KEPT = NOTE_BARE + ' Your Run numbers are kept. Switch back and they return.';

// ── version, read from the candidate's meta ──────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
const VM = HTML.match(/<meta name="ia-version" content="(\d+)">/);
const VER = VM ? +VM[1] : 0;
const verCj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA];
S.info('g237 D220-D222 P-DISTZERO, P-REOPENSTAMP | candidate ' + ART + ' ia-version ' + VER);
if(!(VER >= ERA)) S.info('REFUSED: ia-version ' + VER + ' predates D220 / D221 / D222 (V' + ERA + '). Every row runs and FAILS by its version conjunct.');

// ── ENV (g236_d218_logbutton.js mkEnv: g235 / g233 lineage plus g232's __FORCE hook; program id g237) ──────────────
// Slice 4a's rows call only the pure converters and iaWheelHTML; the device helpers below are the shared env the
// D220-open/-tail/-clear-zero/-fixed-zero and D221 rows drive (slices 4b and 4c).
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
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'screenWeek', 'daysList', 'progressBody'].forEach(i => doc.getElementById(i));
  ctx.popConfetti = function(){}; ev('popConfetti=globalThis.popConfetti;');
  ev('var __dots=[]; var __realBDC=buildDotChart; buildDotChart=function(){ __dots.push(Array.prototype.slice.call(arguments,0,3)); return __realBDC.apply(this,arguments); };');
  ev('var __realDFC=doseFromCardio; doseFromCardio=function(c){ return globalThis.__FORCE || __realDFC(c); };');   // g232's hook
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, wheels:() => WHEELS };
  E.use = p => { const q = JSON.parse(J(p)); q.id = 'g237'; q.startDate = '2026-09-21'; delete q.blockOpen; delete q.created; delete q.createdAt;
    [...LS._map.keys()].forEach(k => LS.removeItem(k)); LS.setItem('ia_programs', J([q])); ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId="g237"; currentWeek=1; progressViewId=null;'); ev("showScreen('screenWeek')"); return q; };
  E.logs = () => LS.getItem('ia_logs_g237') || '{}';
  E.entry = (w, d) => JSON.parse(E.logs())['w' + w + '_' + d] || null;
  E.setLog = (w, d, entry) => { const L = JSON.parse(E.logs()); if(entry == null) delete L['w' + w + '_' + d]; else L['w' + w + '_' + d] = entry; LS.setItem('ia_logs_g237', J(L)); };
  E.hist = (w, d) => !!JSON.parse(LS.getItem('ia_hist_g237') || '{}')['w' + w + '_' + d];
  E.wipe = () => { [...LS._map.keys()].filter(k => k !== 'ia_programs').forEach(k => LS.removeItem(k)); };
  E.open = (w, d) => { ev('currentWeek=' + w + ';'); els.detailOverlay.classList.remove('open'); els.detailBody.innerHTML = '';
    for(const k in INPUTS) delete INPUTS[k]; ev("openDayKey('" + d + "')"); advance(500); };
  E.inputs = () => Object.values(INPUTS).reduce((a, b) => a + b, 0);
  E.face = wh => { const f = wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.face : '?'; }); return wh.kind === 'hms' ? f.join(':') : f.join(''); };
  E.wheel = hid => WHEELS.find(w => w.hid === hid) || null;
  E.need = hid => { const w = E.wheel(hid); if(!w) throw new Error('no wheel for ' + hid + ' on the rendered form'); return w; };
  // Set every named column inside ONE settle window, then let `ms` of the clock run: the athlete's "roll, let go".
  E.rollAt = (wh, pairs, ms) => { for(const [ci, v] of pairs){ const c = wh._cols[ci], cur = Math.round(c.scrollTop / 44); let best = -1;
      for(let k = 0; k < c.items.length; k++) if(c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
      if(best < 0) throw new Error('no row ' + J(v) + ' in column ' + ci); c.scrollTop = best * 44; }
    advance(ms); };
  E.roll = (wh, pairs) => E.rollAt(wh, pairs, 500);
  E.tap = (d, s) => { ev("handleDayStatus('" + d + "','x','" + s + "')"); advance(500); };
  E.status = (w, d) => ev("statusOf(" + w + ",'" + d + "')");
  // The Log tap. On a tree with no logCardio the tap is a no-op, so a row fails by its own conjuncts, not by a crash.
  E.log = () => { if(ev('typeof logCardio') !== 'function') return false; ev('logCardio()'); advance(50); return true; };
  E.toast = () => els.toast.innerHTML;
  E.clearToast = () => { els.toast.innerHTML = ''; };
  E.btnMarkup = () => (els.detailBody.innerHTML.match(/<button[^>]*\sid="cardioLogBtn"[^>]*>([^<]*)<\/button>/) || [])[1];
  E.label = () => { const b = els.cardioLogBtn; return (b && b.textContent) || E.btnMarkup() || ''; };
  E.logged = () => els.cardioSwapWrap ? els.cardioSwapWrap.dataset.logged : undefined;
  E.rpe = v => { els.log_rpe.value = v; if(ev('typeof updateRPEDisplay') === 'function') ev('updateRPEDisplay')(v); els.log_rpe.dispatchEvent({ type:'input' }); advance(50); };
  E.note = v => { els.log_notes.value = v; els.log_notes.dispatchEvent({ type:'input' }); advance(50); };
  E.chart = (title, w) => { ctx.__dots.length = 0; ev('renderProgressScreen')();
    for(const a of ctx.__dots){ if(String(a[0]).indexOf(title) < 0) continue; const wk = Array.from(a[1]), dat = Array.from(a[2]); return { drawn:true, v:dat[wk.indexOf(w)] }; }
    return { drawn:false, v:undefined }; };
  return E;
}
function mkCfg(sports, f, ex, eq, sd){   // g233_d207_bikewheel.js's lattice shape
  const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const cg = {}; sports.forEach(s => { cg[s[0]] = s[0] === 'run' ? { id:s[1], label:s[1], mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } : { id:s[1], label:s[1] }; });
  return { name:'L', primaryPath:'goal', cardioTypes:sports.map(s => s[0]), cardioGoals:cg, eventTargeted:race, raceDate:race ? '2026-12-20' : null,
    liftingFocus:f, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun', 'wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd };
}

// ── conjunct rows ────────────────────────────────────────────────────────────────────────────────────────────────────
const row = (id, cj, extra) => {
  const bad = cj.filter(c => !c[1]);
  for(const c of cj) S.info(id + ' ' + (c[1] ? 'ok  ' : 'BAD ') + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id] + (extra ? ' [' + extra + ']' : ''), bad.map(c => c[0] + ': ' + c[2]).slice(0, 4).join('; '));
};
const guard = (id, fn) => { try { fn(); } catch(e){ row(id, [verCj(id), ['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]); } };

const C = mkEnv(ART);
const FMT = (k, v) => C.ev('_iawFormat')(k, v), PARSE = (k, s) => C.ev('_iawParse')(k, s);
const SPEC = C.ev('_IAW_SPEC'), WRAPS = c => C.ev('_iawWraps')(c);
const arr = a => Array.from(a || []);
// rendered columns of one wheel kind: data-wrap, data-len, the data-v list and the nil count, read off iaWheelHTML's markup
const renderCols = kind => { const h = C.ev('iaWheelHTML')(kind, 'g237_' + kind, ''); const out = [];
  const re = /<div class="iaw-col" data-ci="(\d+)" data-wrap="([^"]*)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g; let m;
  while((m = re.exec(h))){ const items = [...m[4].matchAll(/<div class="iaw-it( nil)?" data-v="([^"]*)">/g)]; out.push({ wrap:m[2], len:+m[3], vals:items.map(x => x[2]), nils:items.filter(x => x[1]).length }); }
  return out; };
const short = v => v.length > 12 ? J(v.slice(0, 4)).slice(0, -1) + ',...,' + J(v.slice(-2)).slice(1) + ' (' + v.length + ')' : J(v) + ' (' + v.length + ')';
// a fixed column: exactly the hand list, no nil unless the hand list carries '', data-wrap '', data-len its length
const fixedCj = (tag, c, want) => { c = c || { vals:[], nils:-1, wrap:'?', len:-1 }; const wantNil = want.filter(v => v === '').length;
  return [[tag + '-rows', J(c.vals) === J(want), short(c.vals) + ' (hand ' + short(want) + ')'],
    [tag + '-nil', c.nils === wantNil, c.nils + ' nil items (hand ' + wantNil + ')'],
    [tag + '-len', c.len === want.length, 'data-len ' + c.len + ' (hand ' + want.length + ')'],
    [tag + '-data-wrap', c.wrap === '', 'data-wrap ' + J(c.wrap) + ' (hand "")']]; };
// a wrapping column: data-wrap '1', data-len the hand list's length, the items the hand list repeated k >= 2 whole times
const wrapCj = (tag, c, want) => { c = c || { vals:[], nils:-1, wrap:'?', len:-1 }; const k = want.length ? c.vals.length / want.length : 0;
  const whole = Number.isInteger(k) && k >= 2 && c.vals.every((v, i) => v === want[i % want.length]);
  return [[tag + '-wraps', c.wrap === '1' && c.len === want.length && whole && c.nils === 0,
    'data-wrap ' + J(c.wrap) + ', data-len ' + c.len + ', ' + c.vals.length + ' items' + (whole ? ' = ' + k + ' x hand list' : ' NOT whole repeats of the hand list') + ', ' + c.nils + ' nil (hand "1", ' + want.length + ', k >= 2 x ' + short(want) + ', 0)']]; };

// ── D220-zero ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D220-zero', () => {
  const cj = [verCj('D220-zero')];
  let g = FMT('dist', Z3); cj.push(['fmt-dist-zero', g === '', 'dist ' + J(Z3) + ' -> ' + J(g) + ' (hand "")']);
  g = FMT('rept', Z2); cj.push(['fmt-rept-zero', g === '', 'rept ' + J(Z2) + ' -> ' + J(g) + ' (hand "")']);
  const pd = DIST_ZERO_PARSE.map(s => { const r = arr(PARSE('dist', s)); return [s, r, J(r) === J(Z3)]; });
  cj.push(['parse-dist', pd.every(x => x[2]), pd.map(x => J(x[0]) + ' -> ' + J(x[1])).join(', ') + ' (hand each ' + J(Z3) + ')']);
  const pr = REPT_ZERO_PARSE.map(s => { const r = arr(PARSE('rept', s)); return [s, r, J(r) === J(Z2)]; });
  cj.push(['parse-rept', pr.every(x => x[2]), pr.map(x => J(x[0]) + ' -> ' + J(x[1])).join(', ') + ' (hand each ' + J(Z2) + ')']);
  const pp = arr(PARSE('pace', '')); cj.push(['parse-pace-blank', J(pp) === J(NIL2), 'pace "" -> ' + J(pp) + ' (hand ' + J(NIL2) + ')']);
  g = FMT('pace', ['', '30']); cj.push(['fmt-pace-dash', g === '', 'pace ["","30"] -> ' + J(g) + ' (hand "")']);
  row('D220-zero', cj);
});

// ── D220-format ──────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D220-format', () => {
  const cj = [verCj('D220-format')];
  const tab = (kind, T, sep) => T.map(([v, w]) => { const g = FMT(kind, v); return [v.join(sep), g, w, g === w]; });
  const fd = tab('dist', DIST_FMT, ',');
  cj.push(['fmt-dist', fd.every(x => x[3]), fd.map(x => '[' + x[0] + '] -> ' + J(x[1]) + (x[3] ? '' : ' (hand ' + J(x[2]) + ')')).join(', ')]);
  const fr = tab('rept', REPT_FMT, ',');
  cj.push(['fmt-rept', fr.every(x => x[3]), fr.map(x => '[' + x[0] + '] -> ' + J(x[1]) + (x[3] ? '' : ' (hand ' + J(x[2]) + ')')).join(', ')]);
  const pn = D203_NUM.map(([s, w]) => { const r = arr(PARSE('dist', s)); return [s, r, w, J(r) === J(w)]; });
  cj.push(['d203-numeric', pn.every(x => x[3]), pn.map(x => J(x[0]) + ' -> ' + J(x[1]) + (x[3] ? '' : ' (hand ' + J(x[2]) + ')')).join(', ')]);
  row('D220-format', cj);
});

// ── D220-rows ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D220-rows', () => {
  const cj = [verCj('D220-rows')];
  const d = renderCols('dist'), r = renderCols('rept'), p = renderCols('pace'), h = renderCols('hms');
  cj.push(['dist-cols', d.length === 3, d.length + ' columns (hand 3)']);
  cj.push(...fixedCj('dist-col0', d[0], MILES), ...wrapCj('dist-col1', d[1], DIGIT), ...wrapCj('dist-col2', d[2], DIGIT));
  cj.push(['rept-cols', r.length === 2, r.length + ' columns (hand 2)']);
  cj.push(...fixedCj('rept-col0', r[0], DIGIT), ...wrapCj('rept-col1', r[1], SIXTY));
  const p0 = p[0] || { vals:[], wrap:'?' };
  cj.push(['pace-dash', p0.vals[0] === '' && p0.vals.length === 15 && p0.wrap === '', 'col0 first ' + J(p0.vals[0]) + ', ' + p0.vals.length + ' items, data-wrap ' + J(p0.wrap) + ' (hand "", 15, "")']);
  // hms unchanged (D215-rows): hours '0'..'9' fixed, minutes and seconds wrap
  cj.push(['hms-cols', h.length === 3, h.length + ' columns (hand 3)']);
  cj.push(...fixedCj('hms-col0', h[0], DIGIT), ...wrapCj('hms-col1', h[1], SIXTY), ...wrapCj('hms-col2', h[2], SIXTY));
  row('D220-rows', cj);
});

// ── D220-wrap ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D220-wrap', () => {
  const cj = [verCj('D220-wrap')];
  for(const k of Object.keys(WRAPS_WANT)){ const g = SPEC[k].cols.map(c => WRAPS(c)); cj.push([k, J(g) === J(WRAPS_WANT[k]), J(g) + ' (hand ' + J(WRAPS_WANT[k]) + ')']); }
  row('D220-wrap', cj);
});

// ── D222-pace ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D222-pace', () => {
  const cj = [verCj('D222-pace')];
  const p = renderCols('pace');
  cj.push(['pace-cols', p.length === 2, p.length + ' columns (hand 2)']);
  cj.push(...fixedCj('pace-col0', p[0], PACE0), ...wrapCj('pace-col1', p[1], SIXTY));
  for(const s of ['', 'abc']){ const r = arr(PARSE('pace', s)); cj.push(['parse-' + (s || 'blank'), J(r) === J(NIL2), 'pace ' + J(s) + ' -> ' + J(r) + ' (hand ' + J(NIL2) + ')']); }
  let g = FMT('pace', ['', '30']); cj.push(['fmt-dash', g === '', 'pace ["","30"] -> ' + J(g) + ' (hand "")']);
  g = FMT('pace', ['9', '30']); const r = arr(PARSE('pace', '9:30'));
  cj.push(['control', g === '9:30' && J(r) === J(['9', '30']), 'pace ["9","30"] -> ' + J(g) + ', "9:30" -> ' + J(r) + ' (hand "9:30", ["9","30"])']);
  row('D222-pace', cj);
});

// ── D222-digest (era row) ────────────────────────────────────────────────────────────────────────────────────────────
guard('D222-digest', () => {
  const cj = [verCj('D222-digest')];
  const T = H.MANNY_DIGEST_BY_VERSION || {}, has = Object.prototype.hasOwnProperty.call(T, VER);
  cj.push(['era-row', has, 'MANNY_DIGEST_BY_VERSION[' + VER + '] ' + (has ? 'present' : 'MISSING')]);
  cj.push(['era-value', T[VER] === HALF_DIGEST, J(T[VER]) + ' (ruling ' + HALF_DIGEST + ')']);
  const P0 = H.load(ART), P1 = H.load(ART);
  const dg0 = H.progDigest(P0.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)))), dg1 = H.progDigest(P1.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY))));
  cj.push(['self-stable', dg0 === dg1 && /^[0-9a-f]{16}$/.test(dg0), 'HALF_MANNY built twice ' + dg0 + ' / ' + dg1 + ' (hand: equal, 16 hex)']);
  cj.push(['built', dg0 === HALF_DIGEST && dg0 === T[VER], 'HALF_MANNY on the candidate ' + dg0 + ' (ruling ' + HALF_DIGEST + ', era row ' + J(T[VER]) + ')']);
  row('D222-digest', cj);
});

// ── slice 4b: device rows (HALF_MANNY on env C; forced doses through g232's __FORCE hook) ─────────────────────────
// A forced null dose (the generic run form): g232's hook cannot return null (it reads __FORCE || the engine), so a second
// wrapper in front of it returns null while __FORCE_NULL is set. Off, both hooks are the engine's own doseFromCardio.
C.ev('var __g237n=doseFromCardio; doseFromCardio=function(c){ return globalThis.__FORCE_NULL ? null : __g237n(c); };');
const HALF = C.IA.buildProgram(JSON.parse(J(H.fixtures.HALF_MANNY)));
const unforce = () => { C.ctx.__FORCE = null; C.ctx.__FORCE_NULL = false; };
const fresh = () => { C.use(HALF); unforce(); };
const faceHand = wh => { if(!wh) return '(no wheel)';   // the face the athlete reads, '' shown as the dash
  const f = wh._cols.map(c => { const it = c.items[Math.round(c.scrollTop / 44)]; return it ? (it.v === '' ? '—' : it.v) : '?'; });
  const p2 = x => x === '—' ? x : String(x).padStart(2, '0');
  return wh.kind === 'dist' ? f[0] + '.' + f[1] + f[2] : wh.kind === 'hms' ? f[0] + ':' + p2(f[1]) + ':' + p2(f[2]) : f[0] + ':' + p2(f[1]); };
const F = hid => faceHand(C.wheel(hid));
const subOf = (w, d) => (HALF.weeks[w] && HALF.weeks[w][d] && HALF.weeks[w][d].cardio && HALF.weeks[w][d].cardio.subtype) || '';
const seven = e => e ? Object.fromEntries(SEVEN.map(k => [k, e[k]])) : null;
const allBlank = e => !!e && SEVEN.every(k => e[k] === '');
const hasLogHand = e => !!e && !!((e.notes && e.notes.trim()) || SEVEN.some(k => e[k]));   // the _hasLog predicate, typed from its line
const nudge = () => C.els.detailBody.innerHTML.includes(NUDGE);
const derivedLine = () => (C.els.doseDerived && C.els.doseDerived.innerHTML) || '';
const keyAbsent = k => C.LS.getItem(k) == null;
// a blank open: wipe the store but the program, open, and report what the open wrote
const openFresh = (w, d) => { C.wipe(); C.open(w, d);
  const wrote = []; if(C.inputs()) wrote.push(C.inputs() + ' input'); if(!keyAbsent('ia_logs_g237')) wrote.push('ia_logs_g237 ' + C.LS.getItem('ia_logs_g237'));
  if(!keyAbsent('ia_hist_g237')) wrote.push('ia_hist_g237'); return wrote; };
const wroteTxt = wr => wr.join(', ') || 'nothing';

// ── D220-open ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D220-open', () => {
  const cj = [verCj('D220-open')];
  fresh(); let wr = openFresh(1, 'sat'); let pl = (C.wheel('log_run_dist') || {}).plan;
  cj.push(['sat-host', /Long Run/.test(subOf(1, 'sat')) && pl === '3.1', 'W1 sat ' + J(subOf(1, 'sat')) + ', miles data-plan ' + J(pl) + ' (ruling Long Run, 3.1)']);
  cj.push(['sat-faces', F('log_run_dist') === '3.10' && F('log_run_mins') === '0:00:00' && !wr.length, 'miles ' + F('log_run_dist') + ', time ' + F('log_run_mins') + ', wrote ' + wroteTxt(wr) + ' (hand 3.10, 0:00:00, nothing)']);
  wr = openFresh(1, 'fri'); pl = (C.wheel('log_run_mins') || {}).plan;
  cj.push(['fri-host', /Recovery Run/.test(subOf(1, 'fri')) && pl === '25', 'W1 fri ' + J(subOf(1, 'fri')) + ', time data-plan ' + J(pl) + ' (ruling Recovery Run, 25)']);
  cj.push(['fri-faces', F('log_run_mins') === '0:25:00' && F('log_run_dist') === '0.00' && !wr.length, 'time ' + F('log_run_mins') + ', miles ' + F('log_run_dist') + ', wrote ' + wroteTxt(wr) + ' (hand 0:25:00, 0.00, nothing)']);
  C.ctx.__FORCE = FORCED_RD; wr = openFresh(1, 'fri');
  cj.push(['reps-face', F('log_run_rep_time') === '0:00' && !wr.length, 'forced reps_dist rep time ' + F('log_run_rep_time') + ', wrote ' + wroteTxt(wr) + ' (hand 0:00, nothing)']);
  unforce(); C.ctx.__FORCE_NULL = true; wr = openFresh(1, 'fri');
  const gen = !!C.wheel('log_run_pace') && !C.wheel('log_run_mins'), pw = C.wheel('log_run_pace');
  const pc0 = pw && pw._cols[0] ? (pw._cols[0].items[Math.round(pw._cols[0].scrollTop / 44)] || {}).v : '?';
  cj.push(['generic-miles', gen && F('log_run_dist') === '0.00' && !wr.length, 'forced null dose: generic form ' + gen + ', miles ' + F('log_run_dist') + ', wrote ' + wroteTxt(wr) + ' (hand true, 0.00, nothing)']);
  cj.push(['generic-pace-dash', pc0 === '', 'pace column 0 on ' + J(pc0) + ' (hand "": the pace wheel keeps its dash, D222)']);
  // D220 Amendment 1: the blank pace face is "—:00" (minutes on the dash, seconds at home 00), never a seconds dash.
  cj.push(['generic-pace-face', F('log_run_pace') === '—:00', 'pace face ' + F('log_run_pace') + ' (hand —:00, D220 Amendment 1)']);
  unforce();
  row('D220-open', cj);
});

// ── D220-tail (Mario's case, the ruling's A2 and B1, the forced rep time) and the structural lattice ─────────────────
const LAT4 = { progs:0, days:0, dist:0, rept:0, nil:0, bad:[], errs:[] };
guard('D220-tail', () => {
  const cj = [verCj('D220-tail')];
  // A2: W1 SAT fresh, miles 0.75 (column 0 on '0'), time 0:47:13, Log
  fresh(); openFresh(1, 'sat'); C.roll(C.need('log_run_dist'), [[0, '0'], [1, '7'], [2, '5']]); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  const leftA = F('log_run_dist') + ' / ' + F('log_run_mins'); C.clearToast(); let tapped = C.log(); let e = C.entry(1, 'sat') || {};
  cj.push(['sat-log', tapped && e.run_dist === '0.75' && e.run_mins === '47.22' && e.run_pace === HAND.p075,
    'left ' + leftA + '; run_dist ' + J(e.run_dist) + ', run_mins ' + J(e.run_mins) + ', run_pace ' + J(e.run_pace) + ' (hand "0.75", "47.22", ' + J(HAND.p075) + ': 2833.2 s / 0.75 mi)']);
  cj.push(['sat-toast', C.toast() === COPY.run && C.label() === COPY.logged, 'toast ' + J(C.toast()) + ', button ' + J(C.label()) + ' (hand ' + J(COPY.run) + ', ' + J(COPY.logged) + ')']);
  // B1: W1 FRI fresh, time on its plan face, miles 0.75, Log
  openFresh(1, 'fri'); C.roll(C.need('log_run_dist'), [[0, '0'], [1, '7'], [2, '5']]);
  const leftB = F('log_run_mins') + ' / ' + F('log_run_dist'), dl = derivedLine(); C.clearToast(); tapped = C.log(); e = C.entry(1, 'fri') || {};
  cj.push(['fri-log', tapped && e.run_mins === '' && e.run_dist === '0.75' && e.run_pace === HAND.pFri && dl.includes('assuming planned 25 min'),
    'left ' + leftB + '; run_mins ' + J(e.run_mins) + ', run_dist ' + J(e.run_dist) + ', run_pace ' + J(e.run_pace) + ', derived note ' + (dl.includes('assuming planned 25 min') ? 'present' : 'ABSENT') + ' (hand "", "0.75", ' + J(HAND.pFri) + ': 1500 s / 0.75 mi, "assuming planned 25 min")']);
  cj.push(['fri-toast', C.toast() === COPY.run, 'toast ' + J(C.toast()) + ' (hand ' + J(COPY.run) + ')']);
  // forced reps_dist (6 x 400 m) on W1 FRI: rep time 0:45, reps +1, Log
  C.ctx.__FORCE = FORCED_RD; openFresh(1, 'fri'); C.roll(C.need('log_run_rep_time'), [[0, '0'], [1, '45']]); C.ev('doseRep(1)'); C.advance(50);
  const leftR = F('log_run_rep_time'); C.clearToast(); tapped = C.log(); e = C.entry(1, 'fri') || {}; unforce();
  cj.push(['reps-log', tapped && e.run_rep_time === '0:45' && String(e.run_reps) === '7' && e.run_pace === HAND.pRep && C.toast() === COPY.run,
    'left ' + leftR + '; run_rep_time ' + J(e.run_rep_time) + ', run_reps ' + J(e.run_reps) + ', run_pace ' + J(e.run_pace) + ', toast ' + J(C.toast()) + ' (hand "0:45", "7", ' + J(HAND.pRep) + ': 45 s / (400 m / 1609.344), ' + J(COPY.run) + ')']);
  // the lattice (measure mA's 54 programs): every run day's form rendered by the real open; column 0 of every dist and rept
  // wheel carries no '' item. Structural: no Log is driven.
  const GOALS = ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal'], SEEDS = [76308, 24865];
  const PROGS = [['HALF_MANNY', JSON.parse(J(H.fixtures.HALF_MANNY))]];
  for(const g of GOALS) for(const f of ['balanced', 'strength']) for(const ex of ['beginner', 'advanced']) for(const sd of SEEDS) PROGS.push([g + '|' + f + '|' + ex + '|' + sd, mkCfg([['run', g]], f, ex, 'commercial', sd)]);
  for(const sd of SEEDS) PROGS.push(['multi|' + sd, mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', 'commercial', sd)]);
  for(const reg of ['knee', 'ankle', 'lowback']){ const c = mkCfg([['run', 'run_10k'], ['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 76308); c.injury = { region:reg, tier:'protect' }; PROGS.push(['injury ' + reg, c]); }
  for(const [name, cfg] of PROGS){
    let p; try { p = C.IA.buildProgram(cfg); } catch(err){ LAT4.errs.push(name + ' build ' + err.message); continue; }
    LAT4.progs++; C.use(p); unforce();
    for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){
      const x = p.weeks[w][d]; if(!x || x.rest || !x.cardio || Array.isArray(x.cardio) || (x.cardio.type || '').toLowerCase() !== 'run') continue;
      LAT4.days++;
      try { C.open(w, d);
        for(const wh of C.wheels()){ if(wh.kind !== 'dist' && wh.kind !== 'rept') continue; LAT4[wh.kind]++;
          const v0 = wh._cols[0] ? wh._cols[0].items.map(i => i.v) : ['?'];
          if(!wh._cols[0] || v0.indexOf('') >= 0){ LAT4.nil++; if(LAT4.bad.length < 3) LAT4.bad.push(name + ' W' + w + ' ' + d + ' ' + wh.kind + ' column 0 ' + J(v0.slice(0, 3)) + '...'); } }
      } catch(err){ LAT4.errs.push(name + ' W' + w + ' ' + d + ': ' + String(err.message).slice(0, 100)); }
    }
  }
  const N = LAT4.dist + LAT4.rept;
  S.info('D220-tail lattice: ' + LAT4.progs + ' / ' + PROGS.length + ' programs, ' + LAT4.days + ' run days, ' + LAT4.dist + ' dist wheels, ' + LAT4.rept + ' rept wheels, errors ' + LAT4.errs.length);
  cj.push(['lattice-no-nil', LAT4.nil === 0 && N > 0 && !LAT4.errs.length, 'lost ' + LAT4.nil + ' / ' + N + ' (dist ' + LAT4.dist + ', rept ' + LAT4.rept + ')' + (LAT4.bad.length ? ' e.g. ' + LAT4.bad.join(' | ') : '') + (LAT4.errs.length ? '; ' + LAT4.errs.length + ' errors e.g. ' + LAT4.errs[0] : '') + ' (hand 0)']);
  cj.push(['lattice-floor', LAT4.progs === PROGS.length && LAT4.dist >= LAT_FLOOR.dist && LAT4.rept >= LAT_FLOOR.rept,
    LAT4.progs + ' / ' + PROGS.length + ' programs, ' + LAT4.days + ' run days, ' + LAT4.dist + ' dist + ' + LAT4.rept + ' rept wheels (hand floor 54 programs, ' + LAT_FLOOR.dist + ' + ' + LAT_FLOOR.rept + ', measure mA)']);
  row('D220-tail', cj, 'lost ' + LAT4.nil + ' / ' + N + ', lattice ' + LAT4.progs + ' programs, ' + LAT4.days + ' run days');
});

// ── D220-clear-zero (W1 FRI time form, free miles; forced reps_dist on W1 FRI for the rep time) ──────────────────────
guard('D220-clear-zero', () => {
  const cj = [verCj('D220-clear-zero')];
  // LIVE: the ruling's B1 bytes stored
  fresh(); C.wipe(); C.setLog(1, 'fri', { rpe:'', run_dist:'0.75', run_pace:HAND.pFri, run_mins:'', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'' });
  let before = C.logs(); C.open(1, 'fri');
  cj.push(['live-open', F('log_run_dist') === '0.75' && C.inputs() === 0 && C.logs() === before && C.label() === COPY.logged,
    'miles ' + F('log_run_dist') + ', ' + C.inputs() + ' inputs, store ' + (C.logs() === before ? 'unchanged' : 'CHANGED') + ', button ' + J(C.label()) + ' (hand 0.75, 0, unchanged, ' + J(COPY.logged) + ')']);
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '0'], [2, '0']]); let e = C.entry(1, 'fri');
  cj.push(['live-zero', !!e && e.run_dist === '', 'miles ' + F('log_run_dist') + ': run_dist ' + J(e && e.run_dist) + ' (hand "", not "0.00")']);
  cj.push(['live-seven', allBlank(e) && C.label() === COPY.log && !hasLogHand(e), 'cardio keys ' + J(seven(e)) + ', button ' + J(C.label()) + ', _hasLog by hand ' + hasLogHand(e) + ' (hand all seven "", ' + J(COPY.log) + ', false)']);
  C.open(1, 'fri'); const st = C.status(1, 'fri'), nu = nudge();
  cj.push(['live-nudge', !nu && st == null, 're-render: nudge ' + nu + ', status ' + J(st) + ' (hand false, null)']);
  // legacy "0.00" on the free miles wheel
  C.wipe(); C.setLog(1, 'fri', { rpe:'5', run_dist:'0.00' }); before = C.logs(); C.open(1, 'fri');
  cj.push(['legacy-dist-open', F('log_run_dist') === '0.00' && C.inputs() === 0 && C.logs() === before, 'miles ' + F('log_run_dist') + ', ' + C.inputs() + ' inputs, store ' + (C.logs() === before ? 'unchanged' : 'CHANGED') + ' (hand 0.00, 0, unchanged)']);
  C.roll(C.need('log_run_dist'), [[1, '7'], [2, '5']]); let mid = (C.entry(1, 'fri') || {}).run_dist;
  C.roll(C.need('log_run_dist'), [[1, '0'], [2, '0']]); e = C.entry(1, 'fri') || {};
  cj.push(['legacy-dist-back', mid === '0.75' && e.run_dist === '', 'to 0.75 ' + J(mid) + ', back to 0.00 ' + J(e.run_dist) + ' (hand "0.75", "")']);
  // legacy "0:00" on the rep time wheel (forced reps_dist)
  C.ctx.__FORCE = FORCED_RD; C.wipe(); C.setLog(1, 'fri', { rpe:'5', run_rep_time:'0:00' }); before = C.logs(); C.open(1, 'fri');
  cj.push(['legacy-rept-open', F('log_run_rep_time') === '0:00' && C.inputs() === 0 && C.logs() === before, 'rep time ' + F('log_run_rep_time') + ', ' + C.inputs() + ' inputs, store ' + (C.logs() === before ? 'unchanged' : 'CHANGED') + ' (hand 0:00, 0, unchanged)']);
  C.roll(C.need('log_run_rep_time'), [[1, '45']]); mid = (C.entry(1, 'fri') || {}).run_rep_time;
  C.roll(C.need('log_run_rep_time'), [[1, '0']]); e = C.entry(1, 'fri') || {}; unforce();
  cj.push(['legacy-rept-back', mid === '0:45' && e.run_rep_time === '', 'to 0:45 ' + J(mid) + ', back to 0:00 ' + J(e.run_rep_time) + ' (hand "0:45", "")']);
  row('D220-clear-zero', cj);
});

// ── D220-fixed-zero (W1 SAT dist form, LIVE from a Log of 4.20 and 0:47:13) ─────────────────────────────────────────
guard('D220-fixed-zero', () => {
  const cj = [verCj('D220-fixed-zero')];
  const setup = () => { fresh(); C.wipe(); C.open(1, 'sat'); C.roll(C.need('log_run_dist'), [[0, '4'], [1, '2'], [2, '0']]); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
    C.log(); return C.entry(1, 'sat') || {}; };
  let e0 = setup();
  cj.push(['setup', e0.run_dist === '4.20' && e0.run_mins === '47.22' && e0.run_pace === HAND.p420 && C.label() === COPY.logged,
    'Log: run_dist ' + J(e0.run_dist) + ', run_mins ' + J(e0.run_mins) + ', run_pace ' + J(e0.run_pace) + ', button ' + J(C.label()) + ' (hand "4.20", "47.22", ' + J(HAND.p420) + ', ' + J(COPY.logged) + ')']);
  C.roll(C.need('log_run_dist'), [[0, '0'], [1, '0'], [2, '0']]); let e = C.entry(1, 'sat') || {}; const dl = derivedLine();
  cj.push(['zero-stamp', e.run_dist === '3.1' && e.run_pace === HAND.pPlan && e.run_mins === '47.22', 'miles ' + F('log_run_dist') + ': run_dist ' + J(e.run_dist) + ', run_pace ' + J(e.run_pace) + ', run_mins ' + J(e.run_mins) + ' (hand "3.1", ' + J(HAND.pPlan) + ': 2833.2 s / 3.1 mi, "47.22")']);
  cj.push(['zero-derived', dl.includes('assuming planned 3.1 mi'), 'derived line ' + (dl.includes('assuming planned 3.1 mi') ? 'carries' : 'LACKS') + ' "assuming planned 3.1 mi"']);
  e0 = setup(); C.roll(C.need('log_run_dist'), [[0, '0'], [1, '7'], [2, '5']]); e = C.entry(1, 'sat') || {};
  cj.push(['to-075', e.run_dist === '0.75' && e.run_pace === HAND.p075 && e.run_mins === '47.22', 'miles ' + F('log_run_dist') + ': run_dist ' + J(e.run_dist) + ', run_pace ' + J(e.run_pace) + ', run_mins ' + J(e.run_mins) + ' (hand "0.75", ' + J(HAND.p075) + ', "47.22")']);
  row('D220-fixed-zero', cj);
});

// ── slice 4c: D221 device rows (HALF_MANNY W1 SAT, dose=dist, plan 3.1) ─────────────────────────────────────────────
// mB's drive (tests/measure/v237_reopenstamp.js): the hidden inputs read as strings as the DOM does, Back is closeDetail,
// a column already on its row is not rolled. "The stamped entry" two ways: 'log' = the app's own Log (fresh, time
// 0:47:13, Log, Back), 'seed' = the hand literal STAMPED written to the store and frozen with snapshotDay (as mB's typed
// rows are), so the drift reader has its W1 SAT prescription on both.
const STR_IDS = ['log_run_reps', 'log_run_dist', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_run_pace', 'log_rpe', 'log_swim_yards', 'log_notes'];
const strv = id => { const el = C.els[id]; if(!el || el._sv) return; let v = String(el.value == null ? '' : el.value);
  Object.defineProperty(el, 'value', { get(){ return v; }, set(x){ v = String(x == null ? '' : x); }, configurable:true }); el._sv = 1; };
const openS = (w, d) => { C.open(w, d); STR_IDS.forEach(strv); };
const back = () => { C.ev('closeDetail()'); C.advance(200); };
const hidOf = id => C.els[id] ? String(C.els[id].value) : '(no node)';
const colv = (wh, ci) => { const c = wh._cols[ci]; const it = c.items[Math.round(c.scrollTop / 44)]; return it ? it.v : '?'; };
const mv = (hid, pairs) => { const wh = C.need(hid); const need = pairs.filter(([ci, v]) => colv(wh, ci) !== v); if(need.length) C.roll(wh, need); };
const T4713 = () => mv('log_run_mins', [[0, '0'], [1, '47'], [2, '13']]);
const TZERO = () => mv('log_run_mins', [[0, '0'], [1, '0'], [2, '0']]);
const resetInputs = () => { for(const k in C.INPUTS) delete C.INPUTS[k]; };
const noClock = e => e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'ts').sort()) : null;   // standing: strip clock fields
const liveHand = e => !!(e && (e.run_dist || e.run_pace || e.run_mins || e.run_reps || e.run_rep_time));    // cardioEntryLive(run), typed from :14754
const histRaw = () => C.LS.getItem('ia_hist_g237');
// stamp W1 SAT one of the two ways and leave the detail closed; returns the stored entry
const stampSat = way => { fresh(); C.wipe();
  if(way === 'log'){ openS(1, 'sat'); T4713(); C.log(); back(); }
  else { C.setLog(1, 'sat', Object.assign({}, STAMPED)); C.ev("snapshotDay(1,'sat')"); back(); }
  return C.entry(1, 'sat') || {}; };
const stampOk = e => e.run_dist === STAMP && e.run_mins === '47.22' && e.run_pace === HAND.pPlan;
const stampTxt = e => 'run_dist ' + J(e.run_dist) + ', run_mins ' + J(e.run_mins) + ', run_pace ' + J(e.run_pace);
// readers, each the real one: the week tile renderWeekView writes (:12213), Progress "Weekly Running Mileage" (:17678,
// through buildDotChart, as g236 reads its charts), plannedVsLogged (:16748) on the stored logs and ia_hist_, and
// restMoveCandidates (:1529). Hand values: 0 / no point / 0 / offered after a clear; 3.1 / 3.1 / 3.1 / withheld before.
const WEEKS_N = Object.keys(HALF.weeks).length;
const wkMiles = () => { C.ev('renderWeekView()'); for(const k in C.els){ const h = C.els[k] && C.els[k].innerHTML;
    const m = typeof h === 'string' && h.match(/<div class="wk-stat-num" style="color:var\(--run\)">([^<]*)<\/div><div class="wk-stat-lbl">MILES<\/div>/); if(m) return m[1]; }
  return '(no MILES tile)'; };
const progMi = () => { const c = C.chart('Weekly Running Mileage', 1); return c.drawn ? (c.v == null ? 0 : +c.v) : '(no chart)'; };
const pvlAct = () => { const wk = C.ev('plannedVsLogged')(JSON.parse(C.logs()), JSON.parse(histRaw() || '{}'), WEEKS_N, 0, false); return wk && wk[1] ? +wk[1].act : '(no week 1)'; };
const restOffers = () => Array.from(C.ev('restMoveCandidates(1)')).map(c => c.day);
const readers = () => ({ wk:wkMiles(), prog:progMi(), pvl:pvlAct(), rest:restOffers() });
const rdTxt = r => 'week tile ' + J(r.wk) + ', Progress W1 ' + J(r.prog) + ', drift act ' + J(r.pvl) + ', rest sheet ' + J(r.rest);

// ── D221-seed ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D221-seed', () => {
  const cj = [verCj('D221-seed')];
  const openSeed = entry => { fresh(); C.wipe(); C.setLog(1, 'sat', entry); const before = C.logs(); openS(1, 'sat');
    const wrote = []; if(C.inputs()) wrote.push(C.inputs() + ' input'); if(C.logs() !== before) wrote.push('ia_logs_g237 CHANGED'); if(histRaw() != null) wrote.push('ia_hist_g237');
    return { wrote, hid:hidOf('log_run_dist'), face:F('log_run_dist'), dl:derivedLine(), lbl:C.label() }; };
  let o = openSeed(Object.assign({}, STAMPED));
  cj.push(['stamp-open', !o.wrote.length && o.hid === '' && o.face === '3.10' && o.dl.includes('assuming planned 3.1 mi') && o.lbl === COPY.logged,
    'stored ' + stampTxt(STAMPED) + ': wrote ' + wroteTxt(o.wrote) + ', hidden ' + J(o.hid) + ', face ' + o.face + ', derived line ' + (o.dl.includes('assuming planned 3.1 mi') ? 'carries' : 'LACKS') + ' "assuming planned 3.1 mi", button ' + J(o.lbl) + ' (hand nothing, "", 3.10, carries, ' + J(COPY.logged) + ')']);
  // the same stamp made by the app's own Log, reopened
  const e0 = stampSat('log'); let before = C.logs(); openS(1, 'sat');
  const h0 = hidOf('log_run_dist'), f0 = F('log_run_dist'), d0 = derivedLine(), l0 = C.label(), n0 = C.inputs();
  cj.push(['log-reopen', stampOk(e0) && n0 === 0 && C.logs() === before && h0 === '' && f0 === '3.10' && d0.includes('assuming planned 3.1 mi') && l0 === COPY.logged,
    'Log 0:47:13 stored ' + stampTxt(e0) + '; reopen ' + n0 + ' inputs, store ' + (C.logs() === before ? 'unchanged' : 'CHANGED') + ', hidden ' + J(h0) + ', face ' + f0 + ', derived ' + (d0.includes('assuming planned 3.1 mi') ? 'carries' : 'LACKS') + ' "assuming", button ' + J(l0) + ' (hand the stamp bytes; 0, unchanged, "", 3.10, carries, ' + J(COPY.logged) + ')']);
  back();
  o = openSeed(Object.assign({}, STAMPED, { run_dist:'3.10' }));
  cj.push(['rolled-310', !o.wrote.length && o.hid === '3.10' && o.face === '3.10' && !o.dl.includes('assuming'), 'stored "3.10": wrote ' + wroteTxt(o.wrote) + ', hidden ' + J(o.hid) + ', face ' + o.face + ', derived ' + (o.dl.includes('assuming') ? 'CARRIES' : 'lacks') + ' "assuming" (hand nothing, "3.10", 3.10, lacks)']);
  o = openSeed(Object.assign({}, STAMPED, { run_dist:'4.20', run_pace:HAND.p420 }));
  cj.push(['rolled-420', !o.wrote.length && o.hid === '4.20' && o.face === '4.20', 'stored "4.20": wrote ' + wroteTxt(o.wrote) + ', hidden ' + J(o.hid) + ', face ' + o.face + ' (hand nothing, "4.20", 4.20)']);
  row('D221-seed', cj);
});

// ── D221-clear ───────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D221-clear', () => {
  const cj = [verCj('D221-clear')];
  for(const way of ['log', 'seed']){
    const e0 = stampSat(way), r0 = readers();
    cj.push([way + '-control', stampOk(e0) && r0.wk === '3.1' && r0.prog === 3.1 && r0.pvl === 3.1 && r0.rest.indexOf('sat') < 0,
      'stamped ' + stampTxt(e0) + '; ' + rdTxt(r0) + ' (hand the stamp bytes; "3.1", 3.1, 3.1, sat withheld: the readers are alive)']);
    openS(1, 'sat'); TZERO(); const e = C.entry(1, 'sat'), lbl = C.label(); back();
    const st = C.status(1, 'sat'), r = readers(); openS(1, 'sat'); const nu = nudge(); back();
    cj.push([way + '-clear', allBlank(e) && lbl === COPY.log, 'reopen, time 0:00:00: cardio keys ' + J(seven(e)) + ', button ' + J(lbl) + ' (hand all seven "", ' + J(COPY.log) + ')']);
    cj.push([way + '-back', st == null && !nu && r.rest.indexOf('sat') >= 0, 'Back: status ' + J(st) + ', nudge on reopen ' + nu + ', rest sheet ' + J(r.rest) + ' (hand null, false, includes sat)']);
    cj.push([way + '-readers', r.wk === '0' && r.prog === 0 && r.pvl === 0, rdTxt(r) + ' (hand "0", 0, 0)']);
  }
  // after Done: the same bytes, the status stays complete
  fresh(); C.wipe(); openS(1, 'sat'); T4713(); C.tap('sat', 'complete'); const ed = C.entry(1, 'sat') || {}; back();
  openS(1, 'sat'); TZERO(); const e = C.entry(1, 'sat'); back(); const st = C.status(1, 'sat');
  cj.push(['done-clear', stampOk(ed) && allBlank(e) && st === 'complete', 'Done at 0:47:13 stored ' + stampTxt(ed) + '; reopen, time 0:00:00: cardio keys ' + J(seven(e)) + ', status ' + J(st) + ' (hand the stamp bytes; all seven "", "complete")']);
  // miles to 0.00 alone on the reopened stamped entry: next '' equals the hidden ''
  for(const way of ['log', 'seed']){
    stampSat(way); openS(1, 'sat'); const before = C.logs(); resetInputs(); mv('log_run_dist', [[0, '0'], [1, '0'], [2, '0']]);
    const n = C.inputs(), same = C.logs() === before, e1 = C.entry(1, 'sat') || {}; back();
    cj.push([way + '-miles-zero', n === 0 && same, 'reopen, miles to 0.00: ' + n + ' input, store ' + (same ? 'unchanged' : 'CHANGED to ' + stampTxt(e1)) + ' (hand 0, unchanged)']);
  }
  row('D221-clear', cj);
});

// ── D221-restamp (regression guard) ──────────────────────────────────────────────────────────────────────────────────
guard('D221-restamp', () => {
  const cj = [verCj('D221-restamp')];
  for(const way of ['log', 'seed']){
    const e0 = stampSat(way); openS(1, 'sat'); const b = C.entry(1, 'sat') || {}; C.rpe('7'); const e1 = C.entry(1, 'sat') || {};
    cj.push([way + '-rpe', stampOk(e0) && J(seven(e1)) === J(seven(b)) && e1.rpe === '7', 'RPE to 7: cardio keys ' + (J(seven(e1)) === J(seven(b)) ? 'identical' : 'MOVED ' + J(seven(b)) + ' -> ' + J(seven(e1))) + ', rpe ' + J(e1.rpe) + ' (hand identical, "7")']);
    mv('log_run_mins', [[0, '0'], [1, '50'], [2, '0']]); const e2 = C.entry(1, 'sat') || {}; back();
    cj.push([way + '-time-50', e2.run_dist === STAMP && e2.run_pace === HAND.p50, 'time 0:50:00: run_dist ' + J(e2.run_dist) + ', run_pace ' + J(e2.run_pace) + ', run_mins ' + J(e2.run_mins) + ' (hand ' + J(STAMP) + ', ' + J(HAND.p50) + ': 3000 s / 3.1 mi)']);
  }
  row('D221-restamp', cj);
});

// ── D221-rolled ──────────────────────────────────────────────────────────────────────────────────────────────────────
// The collision day: the first dose=dist day whose plan carries two decimals, scanned over D220-tail's run-goal lattice
// (6 goals x 2 focus x 2 experience x 2 seeds, measure mB's run half) in a fixed order; the plan read off the grid's dose.
const COLL = { progs:0, distDays:0, two:0, pick:null, errs:[] };
guard('D221-rolled', () => {
  const cj = [verCj('D221-rolled')];
  for(const md of Object.keys(ROLLED)){
    fresh(); C.wipe(); C.setLog(1, 'sat', Object.assign({}, STAMPED, { run_dist:md, run_pace:ROLLED[md] })); openS(1, 'sat');
    const h = hidOf('log_run_dist'); TZERO(); const e = C.entry(1, 'sat') || {}, lbl = C.label(); back();
    cj.push(['rolled-' + md.replace('.', ''), h === md && e.run_dist === md && e.run_mins === '' && e.run_pace === '' && liveHand(e) && lbl === COPY.logged,
      'stored ' + J(md) + ' + "47.22": reopen hidden ' + J(h) + '; time to zero: run_dist ' + J(e.run_dist) + ', run_mins ' + J(e.run_mins) + ', run_pace ' + J(e.run_pace) + ', LIVE by hand ' + liveHand(e) + ', button ' + J(lbl) + ' (hand ' + J(md) + ', ' + J(md) + ', "", "", true, ' + J(COPY.logged) + ')']);
  }
  const GOALS = ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal'], SEEDS = [76308, 24865];
  for(const g of GOALS) for(const f of ['balanced', 'strength']) for(const ex of ['beginner', 'advanced']) for(const sd of SEEDS){
    const name = g + '|' + f + '|' + ex + '|' + sd; let p;
    try { p = C.IA.buildProgram(mkCfg([['run', g]], f, ex, 'commercial', sd)); } catch(err){ COLL.errs.push(name + ' build ' + err.message); continue; }
    COLL.progs++;
    for(const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for(const d of DAYS){
      const x = p.weeks[w][d], c = x && !x.rest && x.cardio && !Array.isArray(x.cardio) ? x.cardio : null;
      if(!c || (c.type || '').toLowerCase() !== 'run' || !c.dose || c.dose.k !== 'dist') continue;
      COLL.distDays++; if(!/\.\d\d$/.test(String(c.dose.mi))) continue;
      COLL.two++; if(!COLL.pick) COLL.pick = { name, p, w, d, mi:c.dose.mi, sub:c.subtype || '' };
    }
  }
  S.info('D221-rolled collision scan: ' + COLL.two + ' two-decimal of ' + COLL.distDays + ' dose=dist days over ' + COLL.progs + ' programs' + (COLL.errs.length ? ', errors ' + COLL.errs.length + ' e.g. ' + COLL.errs[0] : ''));
  const K = COLL.pick;
  if(!K) cj.push(['collision', false, 'no two-decimal dose=dist day in ' + COLL.distDays + ' dose=dist days over ' + COLL.progs + ' programs (hand: one exists, measure mB 16 of 511)']);
  else {
    const sb = String(K.mi); C.use(K.p); unforce(); C.wipe();
    C.setLog(K.w, K.d, { rpe:'', run_dist:sb, run_pace:'', run_mins:'', run_reps:'', run_rep_time:'', bike_mins:'', swim_yards:'', notes:'' });
    const before = C.logs(); openS(K.w, K.d); const n = C.inputs(), same = C.logs() === before, h = hidOf('log_run_dist'), fc = F('log_run_dist');
    C.rpe('7'); const e = C.entry(K.w, K.d) || {}; back();
    S.info('D221-rolled collision day: ' + K.name + ' W' + K.w + ' ' + K.d + ' ' + J(K.sub) + ' plan ' + K.mi + ' mi (real lattice day, not forced)');
    cj.push(['collision', n === 0 && same && e.run_dist === '' && e.rpe === '7',
      K.name + ' W' + K.w + ' ' + K.d + ' plan ' + K.mi + ' (' + COLL.two + ' two-decimal of ' + COLL.distDays + ' dose=dist days): stored run_dist ' + J(sb) + ', run_mins "": open ' + n + ' input, store ' + (same ? 'unchanged' : 'CHANGED') + ', hidden ' + J(h) + ', face ' + fc + '; RPE to 7: run_dist ' + J(e.run_dist) + ', rpe ' + J(e.rpe) + ' (hand 0, unchanged; "", "7": the ruled cost)']);
  }
  row('D221-rolled', cj, K ? 'collision ' + K.name + ' W' + K.w + ' ' + K.d + ' plan ' + K.mi + ', ' + COLL.two + ' two-decimal of ' + COLL.distDays + ' dose=dist days' : 'no collision day');
});

// ── D221-swap ────────────────────────────────────────────────────────────────────────────────────────────────────────
guard('D221-swap', () => {
  const cj = [verCj('D221-swap')];
  const noteTxt = () => (C.els.cardioSwapNote && C.els.cardioSwapNote.textContent) || '';
  const chip = s => { C.ev("setCardioSwap('" + s + "')"); C.advance(200); };
  for(const way of ['log', 'seed']){
    stampSat(way); openS(1, 'sat'); const b = C.entry(1, 'sat') || {};
    chip('bike'); const e1 = C.entry(1, 'sat') || {}, pr = (e1.parked && e1.parked.run) || {}, nt = noteTxt();
    cj.push([way + '-park', pr.run_dist === STAMP && pr.run_mins === '47.22' && nt === NOTE_KEPT,
      'chip Bike: parked.run.run_dist ' + J(pr.run_dist) + ', parked.run.run_mins ' + J(pr.run_mins) + ', note ' + J(nt) + ' (hand ' + J(STAMP) + ', "47.22", ' + J(NOTE_KEPT) + ')']);
    chip('run'); const e2 = C.entry(1, 'sat') || {}, lbl = C.label(); back();
    const same = J(noClock(e2)) === J(noClock(b));
    cj.push([way + '-return', stampOk(b) && same && lbl === COPY.logged, 'chip Run: entry ' + (same ? 'byte-identical (ts stripped)' : 'MOVED ' + J(noClock(b)) + ' -> ' + J(noClock(e2))) + ', button ' + J(lbl) + ' (hand identical, ' + J(COPY.logged) + ')']);
    stampSat(way); openS(1, 'sat'); TZERO(); chip('bike'); const e3 = C.entry(1, 'sat') || {}, n3 = noteTxt(); back();
    cj.push([way + '-cleared', !('parked' in e3) && n3 === NOTE_BARE, 'time to zero, chip Bike: parked ' + (('parked' in e3) ? J(e3.parked) : 'absent') + ', note ' + J(n3) + ' (hand absent, ' + J(NOTE_BARE) + ')']);
  }
  row('D221-swap', cj);
});

if(C.errs.length) S.info('timer errors ' + C.errs.length + ': ' + C.errs.slice(0, 3).join(' | '));
S.info('g237 wall ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
S.summary();
