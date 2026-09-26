// g222_d181_durable.js — GATE for D181 (P-SWAPDURABLE): a swap the athlete made stays made until the athlete undoes it,
// and the boot never re-applies a session swap onto a day the freeze restored from ia_hist_.
//
//   node tests/gates/g222_d181_durable.js <candidate.html> [baseline_V221.html]
//   IA_ASSUME_VERSION=222 node tests/gates/g222_d181_durable.js <tree stamped 221> [baseline_V221.html]   (discrimination run only)
//
// THE RULING THIS DEFENDS: tests/measure/v222_rulings/p_swapdurable_ruling.md, read whole: the original ruling (R1 swap and
// undo fold into the day's record, R2 the per-exercise Log is a first touch, "Three things the fix must not do" (a)(b)(c)),
// "RE-RULING ON V221 (measure refutations)" (R3': the pruneSwaps call and function are deleted, `_swapCut` and
// pruneDayEdits stay; gate rows 1 to 7 redefined: row 3 is boot-orphaned logs, the exw count is a control), "SECOND
// RE-RULING ON V222 PARKED SLICE 3" (R4' per-record replay in recording order, R5 no re-apply onto a day restored from
// ia_hist_, record kept; "Revised gate rows" table; sabotage list), and the three MARIO DECISION blocks (final: V222 =
// R1 + R2 + R3' + R4' + R5, the up_ts trade accepted). D-code D181, ships on ia-version 222.
// This file carries rows 1, 1c, 2, 3, 3d, 4, 4d, 5s, 6a, 6b, 6c, 7, 10 and one INFO row. Rows 5, 5c, 5L, 5X, 8, 8d, 9
// are g222_d181_chain.js's.
//
// ORACLE. Never asked of the engine:
//   the athlete's last live action: the name the athlete last chose (swap target, or the donor after undo), the live
//   card and the ia_hist_ record as written before the reboot, the swap store bytes as written;
//   hand-typed strings from the ruling: `Barbell box squat :: 4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3
//   warmup sets, 2–3 min rest` (the donor), `Dumbbell goblet squat :: 4×8–12 — RPE 7 (...)` (the After line and D177's
//   toast "Reps move to 8 to 12"), `Leg press 4×8–12` (the goblet -> leg press hop, "Same job, same numbers." carries
//   the goblet's detail verbatim), Front squat keeps 4×3 (the D177 null row);
//   date arithmetic: startDate 2026-08-24 is a Monday, so W5 Thu is 2026-09-24 and each clock's week is
//   floor(days/7)+1; the freeze cut is max(current week (+1 when touched), highest touched week + 1) (D108), typed.
// OBSERVATION is the live path in the harness VM: applySwapChoice / undoSwap / writeSetDraft / logExerciseWeight /
// handleDayStatus / applyAddChoice / skipExercise / applyRestMove, then refreshProgram as the boot. The freeze cut is
// read by wrapping pruneDayEdits (the one reader of `_swapCut`), never computed by the engine for us.
// FIXTURE: the premise lattice of tests/measure/v222_swapdurable_premise.js (itself tests/measure/v221_swap_frozen.js):
// Mario's config commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308, W5 Thu Main, dated and
// dateless, five clocks, goblet and verbatim pairs, other-day touch, seven touch|order cells, reboot same clock and next
// week: 504 cells.
//
// VERSION PREDICATE (standing rulings 2 and 4). D181 ships at 222.
//   below 222      REFUSED, every assertion row FAILS by name.
//   222 and up     hand rows (1 1c 2 3 3d 4 4d 5s 6a 10) assert.
//   pair rows      6b 6c 7 assert only on D181's build pair: candidate 222 against baseline 221 (argv[3] when it reads
//                  221, else git 57b9dee). Any other candidate: SKIP, scoped out, never PASS.
//   IA_ASSUME_VERSION=222 lifts a file stamped exactly 221 to 222 for a discrimination run. It is announced, and it is
//   ignored on any file not stamped exactly 221. gate.sh never sets it.
//   CONTROL rows (1c 3d 4d 6a, and the pair rows 6b 6c 7) pass on V221 as well by design; they are labelled CONTROL in
//   their row text. Every other row FAILS on V221 under IA_ASSUME_VERSION=222 with the ruling's V221 number.
//
// ROWS (each: V221, After, from the second re-ruling's "Revised gate rows")
//   1    Lattice DURABLE per touch×order cell: after reboot the slot carries the athlete's last choice in name AND detail,
//        and on a touched day the ia_hist_ record carries it too (the After line "hist holds target").   190/504 -> 504/504
//   1c   CONTROL inside row 1: draft|swap_then_touch and done|swap_then_touch.                              72/72 -> 72/72
//   2    Undo reachable after reboot, seven orderings: boot1 goblet 4×8–12, chip offers the box squat, undo puts the box
//        squat back at the slot with 4×3, clears the record, the snapshot (when there is one) holds the box squat, and
//        boots 2 and 3 show box 4×3.                                                                          1/7 -> 7/7
//   3    Boot-orphaned logs: an ia_exw_ key naming a lift on the last live card and absent from the booted card.
//                                                                                                           72/504 -> 0/504
//   3d   CONTROL: ia_exw_ key count and entry count equal across the reboot.                             504/504 -> 504/504
//   4    M3 add/skip × swap on a frozen day, 42 orderings: live==boot AND live==next-week boot.              13/42 -> 42/42
//   4d   CONTROL: M3 double-apply (the premise's formula: two goblets, or an add list that grew).            0/42 -> 0/42
//   5s   M4 snapshotted day, box -> goblet -> leg press, touch first / between / last: boot1 Leg press 4×8–12, chip
//        offers goblet, undo -> goblet 4×8–12 (boot), chip offers box, undo -> box 4×3 (boot), record gone.     0/3 -> 3/3
//   6a   CONTROL (must-not (a)): a swap or an undo on an untouched day writes no ia_hist_ and leaves the freeze cut
//        unchanged, 36 cells.                                                                                0/36 -> 0/36
//   6b   PAIR CONTROL (must-not (b)): an injury overlay added after a swap on an untrained W5 Thu still pierces it (the booted
//        day is not the stored grid, no ia_hist_ key), the swap stands, same day on candidate and baseline.
//   6c   PAIR CONTROL (must-not (c)): a trained day with no swap (draft W5 Thu, done W5 Thu, draft W3 Tue) boots byte-identical
//        on candidate and baseline and equal to its snapshot; a tick-only day's freeze cut equals the baseline's and
//        the hand cut (W5 Thu -> 6, W3 Tue -> 5).
//   7    PAIR CONTROL: 0 engine cards differ between candidate and baseline over a 97-config lattice (baseline equals itself),
//        and HALF_MANNY's digest equals MANNY_DIGEST_BY_VERSION[ia-version] from tests/harness.js.
//   10   The record on a hist-restored day survives the boot byte-unchanged and the undo chip is offered, seven shapes.
//                                                                                                  n/a (pruned) 0/7 -> 7/7
//   INFO (never counts): a rest-day-moved, snapshotted, swapped day on both trees (the second re-ruling's first carried
//        unknown): snapshot at the origin, and snapshot at the destination. Printed, not asserted.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 222, BASE_ERA = 221, V221_COMMIT = '57b9dee80269743a40b350aa399351661dd9c06b';
let pass = 0, fail = 0, skip = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };
const done = () => { console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
const DONOR = 'Barbell box squat', GOB = 'Dumbbell goblet squat', FRONT = 'Front squat', LP = 'Leg press';
const DONOR_M = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const EXPG    = '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const EXPLP   = '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';   // "Same job, same numbers."
const PAIRS = { goblet:{ to:GOB, det:EXPG }, verbatim:{ to:FRONT, det:DONOR_M } };                          // Front squat: D177 null row
const ADDN = 'Dumbbell hammer curl', ADDSWAP = 'Dumbbell biceps curl';
// Date arithmetic. 2026-08-24 is a Monday; a day's program week is floor(days since start / 7) + 1.
const START = '2026-08-24', W = 5, D = 'thu';
const CLOCKS = { future_prevwk:'2026-09-17', future_samewk:'2026-09-21', today:'2026-09-24', past_samewk:'2026-09-26', past_nextwk:'2026-09-29' };
const dayNum = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
const handWeek = iso => Math.floor((dayNum(iso) - dayNum(START)) / 7) + 1;
const HAND_W5THU = '2026-09-24';
// D108's cut, typed: max(current week, +1 when the current week is touched; highest touched week + 1).
const handCut = (clockIso, touchedWeeks) => { const cw = handWeek(clockIso), mx = Math.max(0, ...touchedWeeks);
  return Math.max(cw + (touchedWeeks.includes(cw) ? 1 : 0), mx + 1); };
const HAND_CUT = { tick_w5thu:handCut(CLOCKS.today, [5]), tick_w3tue:handCut(CLOCKS.today, [3]) };   // 6 and 5

// ── FIXTURES ─────────────────────────────────────────────────────────────────
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLOCKF = /^_?(ts|at|time|stamp|clock|now|created)$/i;
const J = v => JSON.stringify(v, (k, x) => CLOCKF.test(k) ? undefined : x);
function MARIO(){ return { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null,
  liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308,
  injury:{ region:'knee', tier:'workaround' } }; }
function mk(t, f, x, g, i, seed){
  const race = !!g.id && /half/.test(g.id);
  return { name:'M', primaryPath:g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes:g.id ? ['run'] : [],
    cardioGoals:g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted:race, raceDate:race ? '2026-12-06' : null, liftingFocus:f, experience:x, ageBracket:'18-35', equipment:t, unit:'lbs',
    restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench:135, squat:155, deadlift:185, seed, ...(i.v ? { injury:i.v } : {}) };
}
const LO = { k:'liftonly', id:null }, HALF = { k:'half', id:'run_half' };
const L7 = [MARIO()];
for(const t of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal']) for(const f of ['support_prevention', 'support_strength', 'hypertrophy', 'strength'])
  for(const g of [LO, HALF]) for(const i of [{ v:null }, { v:{ region:'knee', tier:'workaround' } }]) L7.push(mk(t, f, 'beginner', g, i, 76308));

// ── ROWS (static, so a refused era fails every one by name) ──────────────────
const R = {
  R1: '1 lattice DURABLE, 504 cells, per touch×order cell: the booted slot carries the last choice in name AND detail (goblet `' + EXPG + '`, Front squat `' + DONOR_M + '`), and a touched day\'s ia_hist_ carries it (V221 190/504)',
  R1c:'1c CONTROL (passes on V221 too): draft|swap_then_touch and done|swap_then_touch 72/72 each',
  R2: '2 undo reachable after reboot, 7 orderings: boot1 `' + GOB + ' :: ' + EXPG + '`, chip offers ' + DONOR + ', undo -> `' + DONOR + ' :: ' + DONOR_M + '` at the slot, record cleared, snapshot holds the box squat, boots 2 and 3 hold (V221 1/7)',
  R3: '3 boot-orphaned logs: an ia_exw_ key naming a lift on the last live card and absent from the booted card, 0/504 (V221 72/504)',
  R3d:'3d CONTROL (passes on V221 too): ia_exw_ key and entry counts equal across the reboot, 504/504',
  R4: '4 M3 add/skip × swap on a frozen W5 Thu, 42 orderings: live==boot AND live==next-week boot 42/42 (V221 13/42)',
  R4d:'4d CONTROL (passes on V221 too): M3 double-apply 0/42 (the COPY shape reads 6/42)',
  R5s:'5s M4 snapshotted day, box -> goblet -> leg press, touch first/between/last: boot1 `' + LP + ' :: ' + EXPLP + '` chip goblet, undo -> goblet 4×8–12, chip box, undo -> box 4×3, record gone, each surviving a boot 3/3 (V221 0/3)',
  R6a:'6a CONTROL, must-not (a) (passes on V221 too): a swap or an undo on an untouched day writes no ia_hist_ and leaves the freeze cut unchanged, 0/36',
  R6b:'6b PAIR CONTROL, must-not (b) (invariance: same day on both trees by design): a knee/workaround overlay added after a swap on an untrained W5 Thu still pierces it, the swap stands, no ia_hist_, same day on candidate and V221',
  R6c:'6c PAIR CONTROL, must-not (c) (invariance: same on both trees by design): a trained day with no swap boots byte-identical on candidate and V221 and equal to its snapshot; a tick-only day\'s cut equals V221\'s and the hand cut (' + HAND_CUT.tick_w5thu + ', ' + HAND_CUT.tick_w3tue + ')',
  R7: '7 PAIR CONTROL (invariance: nothing in buildProgram): 0 engine cards differ, candidate vs V221, over ' + L7.length + ' configs (V221 equals itself); HALF_MANNY digest equals MANNY_DIGEST_BY_VERSION[ia-version]',
  R10:'10 the record on a hist-restored day survives the boot byte-unchanged and the undo chip is offered, 7 shapes (V221 0/7, pruned)',
};

// ── LOAD + VERSION PREDICATE ─────────────────────────────────────────────────
const t0 = Date.now();
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
}
console.log('g222 D181 durable | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D181 P-SWAPDURABLE (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// HALF_MANNY first, on an unpinned clock, exactly as the harness prints it.
const MANNY_C = (() => { try { return progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)) + '/' + progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)); } catch(e){ return 'threw ' + e.message; } })();
let B = null, baseWhy = '';
if(VER === ERA){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) B = b; else baseWhy = 'argv[3] reads ' + b.version + '; '; }
    if(!B){
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g222d181-')), f = path.join(tmp, 'v221.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V221_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      const b = load(f); fs.rmSync(tmp, { recursive:true, force:true });
      if(+b.version === BASE_ERA){ B = b; baseWhy += 'baseline from git ' + V221_COMMIT.slice(0, 7); } else baseWhy += 'git reads ' + b.version;
    }
  } catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }
}
const PAIR = VER === ERA && !!B;
console.log('  pair rows: ' + (PAIR ? 'LIVE (candidate ' + VER + ' vs V' + BASE_ERA + (baseWhy ? ', ' + baseWhy : ', argv[3]') + ')' : VER === ERA ? 'SETUP FAILED (' + baseWhy + ')' : 'scoped out (candidate ' + VER + ' is not D181\'s pair)'));
const pairRow = (key, cond, got) => {
  if(PAIR) return ok(R[key], cond, got);
  if(VER === ERA) return ok(R[key] + ' (setup: ' + baseWhy + ')', false);
  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D181's build pair (222 vs 221)");
};
const MANNY_B = B ? (() => { try { return progDigest(B.buildProgram(B.fixtures.HALF_MANNY)); } catch(e){ return 'threw ' + e.message; } })() : null;

// ── DRIVER (the premise's, unchanged in shape) ───────────────────────────────
function pin(X, iso){ const T = new Date(iso + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } X.ctx.Date = FD; }
const E = (X, c) => X.eval(c);
// The freeze cut is read where the engine hands it on: pruneDayEdits(pid, _swapCut). Wrapping it changes nothing.
const WRAP = "globalThis.__cut=null;(function(){var f=pruneDayEdits;pruneDayEdits=function(p,c){globalThis.__cut=c;return f(p,c);};})();";
E(IA, WRAP); if(B) E(B, WRAP);
function setupCfg(X, cfg, dated, mutateStored){
  X.localStorage.clear(); pin(X, CLOCKS.today);
  const p = X.buildProgram(cfg), st = JSON.parse(JSON.stringify(p));
  Object.assign(st, { id:'PM', name:'M', created:1, startDate:dated ? START : null, cfg:JSON.parse(JSON.stringify(cfg)) });
  if(mutateStored) mutateStored(st);
  X.ctx.__SP = st; E(X, 'savePrograms([__SP]);'); return p; }
const setup = (X, dated) => setupCfg(X, MARIO(), dated);
function boot(X){ return E(X, "globalThis.__cut=null;activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
const cutNow = X => E(X, 'globalThis.__cut');
function view(X, w, d){ E(X, 'currentWeek=' + (w || W) + ";currentDayKey='" + (d || D) + "';"); }
function day(X, w, d){ return E(X, 'activeProg.weeks[' + (w || W) + '].' + (d || D)); }
function loc(dy, name){ const ss = dy.sections || []; for(let si = 0; si < ss.length; si++){ const it = ss[si].items || []; for(let ii = 0; ii < it.length; ii++) if(clean(it[ii].name) === name) return { si, ii }; } return null; }
let L0 = null;
function cardAt(X){ const dy = day(X); const it = dy && dy.sections && dy.sections[L0.si] && dy.sections[L0.si].items[L0.ii]; return it ? { name:clean(it.name), detail:clean(it.detail), skip:!!it._skipped } : { name:'(none)', detail:'' }; }
const fullOf = c => c.name + ' :: ' + c.detail;
function swapAt(X, to){ view(X); const dy = day(X); const it = dy.sections[L0.si].items[L0.ii];
  X.ctx.__c = { secIdx:L0.si, itemIdx:L0.ii, name:it.name, detail:it.detail }; X.ctx.__to = to; E(X, '_swapCtx=__c;applySwapChoice(__to);'); }
function touch(X, kind){ view(X); const c = cardAt(X); X.ctx.__n = c.name; X.ctx.__det = day(X).sections[L0.si].items[L0.ii].detail; X.ctx.__title = day(X).title || 'T';
  if(kind === 'draft') E(X, "writeSetDraft(exStoreKey(__n),['5','5'],['95','95'],'');");
  if(kind === 'tick')  E(X, 'logExerciseWeight(__n,95,__det,' + W + ",[5,5,5,5],[95,95,95,95],'" + D + "');");
  if(kind === 'done')  E(X, "handleDayStatus('" + D + "',__title,'complete');");
  return c.name; }
function otherTouch(X){ const wk = boot(X); E(X, 'currentWeek=' + wk + ";currentDayKey='mon';writeSetDraft('zz_other',['1'],['1'],'');"); }
const JS = (X, k) => JSON.parse(X.localStorage.getItem(k) || '{}');
const KEY = 'w' + W + '_' + D;
function recs(X){ const sw = JS(X, 'ia_swaps_PM')[KEY]; return sw ? sw.map(e => e.from + '->' + e.to).join(',') : 'none'; }
function histSlot(X){ const hs = JS(X, 'ia_hist_PM')[KEY]; const it = hs && hs.sections && hs.sections[L0.si] && hs.sections[L0.si].items[L0.ii]; return it ? clean(it.name) + ' :: ' + clean(it.detail) : 'none'; }
const chipFor = (X, name) => { view(X); return E(X, 'swapOriginOf(' + JSON.stringify(name) + ')') || '-'; };
const dayKeys = X => { const dy = day(X); const s = new Set(); (dy.sections || []).forEach(sec => (sec.items || []).forEach(it => { if(it && it.name){ X.ctx.__n = clean(it.name); s.add(E(X, 'exStoreKey(__n)')); } })); return s; };
function exwAt(X){ const exw = JS(X, 'ia_exw_PM'); const keys = Object.keys(exw);
  return { keys:keys.length, entries:keys.reduce((a, k) => a + ((exw[k] && exw[k].entries) || []).length, 0),
    here:keys.filter(k => ((exw[k] && exw[k].entries) || []).some(e => +e.week === W && e.day === D)) }; }

// ── ROWS 1, 1c, 3, 3d: the lattice ───────────────────────────────────────────
const ORD = [['none', '-'], ['draft', 'swap_then_touch'], ['draft', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['done', 'swap_then_touch'], ['done', 'touch_then_swap']];
function run(X, o){
  const p = setup(X, o.dated);
  if(!L0){ L0 = loc(p.weeks[W][D], DONOR); if(!L0) throw new Error('fixture moved: no ' + DONOR + ' on W5 Thu'); }
  pin(X, CLOCKS[o.clock]); boot(X); if(o.other) otherTouch(X); boot(X);
  const P = PAIRS[o.pair]; view(X); if(cardAt(X).name !== DONOR) return { err:'donor not on card' };
  if(o.touch === 'none') swapAt(X, P.to);
  else if(o.order === 'swap_then_touch'){ swapAt(X, P.to); touch(X, o.touch); } else { touch(X, o.touch); swapAt(X, P.to); }
  view(X); const live = fullOf(cardAt(X)), liveKeys = dayKeys(X), ex0 = exwAt(X);
  pin(X, CLOCKS[o.reboot || o.clock]); boot(X); view(X);
  const c = cardAt(X), bootKeys = dayKeys(X), ex1 = exwAt(X), hist = histSlot(X), want = P.to + ' :: ' + P.det;
  return { live, card:fullOf(c), want, hist, rec:recs(X),
    durable:fullOf(c) === want && (o.touch === 'none' || hist === want),
    orphan:ex0.here.filter(k => liveKeys.has(k) && !bootKeys.has(k)),
    exwEq:ex0.keys === ex1.keys && ex0.entries === ex1.entries, exw:ex0.keys + '/' + ex0.entries + '->' + ex1.keys + '/' + ex1.entries }; }
const cells = [];
{ const o = { dated:true, clock:'today', pair:'goblet', touch:'draft', order:'swap_then_touch', other:false };
  const a = JSON.stringify(run(IA, o)), b = JSON.stringify(run(IA, o)); console.log('  SELFCHECK candidate lattice cell equals itself: ' + (a === b)); if(a !== b) cells.selfBad = true; }
for(const dated of [true, false]) for(const clock of Object.keys(CLOCKS)) for(const pair of Object.keys(PAIRS))
  for(const other of [false, true]) for(const [touchK, order] of ORD) for(const reboot of [null, 'past_nextwk']){
    if(reboot === clock) continue; const o = { dated, clock, pair, other, touch:touchK, order, reboot };
    let r; try { r = run(IA, o); } catch(e){ r = { err:'CRASH ' + e.message }; } cells.push({ o, r }); }
{
  const good = cells.filter(x => !x.r.err), errs = cells.length - good.length;
  const cellN = (t, ord) => { const s = good.filter(x => x.o.touch === t && x.o.order === ord); return [s.filter(x => x.r.durable).length, s.length]; };
  console.log('  lattice: ' + cells.length + ' cells, errors ' + errs + (errs ? ' e.g. ' + cells.find(x => x.r.err).r.err : '') + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  ORD.forEach(([t, ord]) => { const [n, m] = cellN(t, ord); console.log('    ' + (t + '|' + ord).padEnd(22) + ' DURABLE ' + n + '/' + m); });
  const bad = good.filter(x => !x.r.durable);
  bad.slice(0, 4).forEach(x => console.log('    e.g. REVERTED ' + JSON.stringify(x.o) + ' live=' + x.r.live + ' | boot=' + x.r.card + ' | hist=' + x.r.hist + ' | rec=' + x.r.rec));
  const nDur = good.length - bad.length, allCells = ORD.every(([t, ord]) => { const [n, m] = cellN(t, ord); return m === 72 && n === 72; });
  ok(R.R1, !errs && !cells.selfBad && cells.length === 504 && nDur === 504 && allCells, 'DURABLE ' + nDur + '/' + cells.length);
  const c1 = cellN('draft', 'swap_then_touch'), c2 = cellN('done', 'swap_then_touch');
  ok(R.R1c, !errs && c1[0] === 72 && c1[1] === 72 && c2[0] === 72 && c2[1] === 72, 'draft|swap_then_touch ' + c1.join('/') + ', done|swap_then_touch ' + c2.join('/'));
  const orph = good.filter(x => x.r.orphan.length), byCell = {};
  orph.forEach(x => { const k = x.o.touch + '|' + x.o.order; byCell[k] = (byCell[k] || 0) + 1; });
  if(orph.length) console.log('    orphan e.g. ' + JSON.stringify(orph[0].o) + ' keys=' + orph[0].r.orphan.join(',') + ' boot=' + orph[0].r.card);
  ok(R.R3, !errs && good.length === 504 && orph.length === 0, orph.length + '/' + good.length + ' ' + JSON.stringify(byCell));
  const eq = good.filter(x => x.r.exwEq).length;
  ok(R.R3d, !errs && good.length === 504 && eq === 504, eq + '/' + good.length);
}

// ── ROW 2: undo after reboot, seven orderings ────────────────────────────────
{
  const out = []; let n = 0;
  for(const [t, ord] of ORD){
    setup(IA, true); pin(IA, CLOCKS.today); boot(IA); view(IA);
    if(t === 'none') swapAt(IA, GOB); else if(ord === 'swap_then_touch'){ swapAt(IA, GOB); touch(IA, t); } else { touch(IA, t); swapAt(IA, GOB); }
    boot(IA); view(IA); const b1 = fullOf(cardAt(IA)), chip = chipFor(IA, GOB);
    E(IA, 'undoSwap(' + JSON.stringify(DONOR) + ');'); view(IA); const u = fullOf(cardAt(IA)), recU = recs(IA), histU = histSlot(IA);
    boot(IA); view(IA); const b2 = fullOf(cardAt(IA)); boot(IA); view(IA); const b3 = fullOf(cardAt(IA));
    const WD = DONOR + ' :: ' + DONOR_M;
    const good = b1 === GOB + ' :: ' + EXPG && chip === DONOR && u === WD && recU === 'none' && (t === 'none' ? histU === 'none' : histU === WD) && b2 === WD && b3 === WD;
    if(good) n++;
    out.push('    ' + (t + '|' + ord).padEnd(22) + (good ? ' OK   ' : ' MISS ') + 'boot1=' + b1.split(' — ')[0] + ' chip=' + chip + ' | undo-> ' + u.split(' — ')[0] + ' rec=' + recU + ' hist=' + histU.split(' — ')[0] + ' | boot2=' + b2.split(' — ')[0] + ' boot3=' + b3.split(' — ')[0]);
  }
  out.forEach(s => console.log(s));
  ok(R.R2, n === 7, n + '/7');
}

// ── ROWS 4, 4d: M3 add/skip × swap on a frozen day ───────────────────────────
function daySig(X){ const dy = day(X); const ss = dy.sections || [];
  const main = cardAt(X); const skipped = [], added = []; let gobN = 0, donN = 0;
  ss.forEach(s => { if(s._skipped) skipped.push('ss'); (s.items || []).forEach(it => { const nm = clean(it.name); if(nm === GOB) gobN++; if(nm === DONOR) donN++; if(it._skipped) skipped.push(nm); if(s._added) added.push(nm); }); });
  return main.name + ' ' + main.detail.split(' — ')[0] + (main.skip ? '[x]' : '') + ' | skip=' + (skipped.join(',') || '-') + ' | add=' + (added.join(',') || '-') + ' | nGob=' + gobN + ' nDonor=' + donN; }
{
  const agg = { n:0, ok1:0, ok2:0, both:0, dbl:0, fails:[] };
  for(const tk of ['draft', 'tick']) for(const seq of [['swap', 'add'], ['add', 'swap'], ['swap', 'skipslot'], ['skipslot', 'swap'], ['swap', 'skipother'], ['skipother', 'swap'], ['add', 'swapadded']])
    for(const tpos of [0, 1, 2]){
      setup(IA, true); pin(IA, CLOCKS.today); boot(IA); view(IA);
      const other = (() => { const dy = day(IA); for(const s of dy.sections) for(const it of (s.items || [])) if(clean(it.name) !== DONOR && it.name && !s.superset) return it.name; })();
      const ops = seq.slice(); ops.splice(tpos, 0, 'touch');
      for(const op of ops){ view(IA);
        if(op === 'touch') touch(IA, tk);
        else if(op === 'swap') swapAt(IA, GOB);
        else if(op === 'add') E(IA, 'applyAddChoice(' + JSON.stringify(ADDN) + ');');
        else if(op === 'skipslot') E(IA, 'skipExercise(' + JSON.stringify(E(IA, 'activeProg.weeks[5].thu.sections[' + L0.si + '].items[' + L0.ii + '].name')) + ');');
        else if(op === 'skipother') E(IA, 'skipExercise(' + JSON.stringify(other) + ');');
        else if(op === 'swapadded'){ const dy = day(IA); const si = dy.sections.findIndex(s => s._added); if(si < 0) continue;
          const ii = dy.sections[si].items.findIndex(it => it.name === ADDN);
          IA.ctx.__c = { secIdx:si, itemIdx:ii, name:ADDN, detail:dy.sections[si].items[ii].detail }; E(IA, '_swapCtx=__c;applySwapChoice(' + JSON.stringify(ADDSWAP) + ');'); } }
      view(IA); const live = daySig(IA); boot(IA); view(IA); const b1 = daySig(IA); pin(IA, CLOCKS.past_nextwk); boot(IA); view(IA); const b2 = daySig(IA);
      agg.n++; if(b1 === live) agg.ok1++; if(b2 === live) agg.ok2++; if(b1 === live && b2 === live) agg.both++;
      if(/nGob=[2-9]/.test(b1 + b2) || /add=[^|]*,/.test(b1 + b2) && !/add=[^|]*,/.test(live)) agg.dbl++;
      if((b1 !== live || b2 !== live) && agg.fails.length < 4) agg.fails.push('    ' + (tk + '|' + ops.join('>')).padEnd(34) + ' LIVE ' + live + ' | BOOT ' + b1 + ' | NXWK ' + b2);
    }
  console.log('  M3: live==boot ' + agg.ok1 + '/' + agg.n + ', live==next-week boot ' + agg.ok2 + '/' + agg.n + ', double-apply ' + agg.dbl + '/' + agg.n);
  agg.fails.forEach(s => console.log(s));
  ok(R.R4, agg.n === 42 && agg.both === 42, agg.both + '/' + agg.n + ' (boot ' + agg.ok1 + ', next-week boot ' + agg.ok2 + ')');
  ok(R.R4d, agg.n === 42 && agg.dbl === 0, agg.dbl + '/' + agg.n);
}

// ── ROW 5s: second swap on one slot, snapshotted day ─────────────────────────
{
  let n = 0; const out = [];
  for(const pos of ['first', 'between', 'last']){
    setup(IA, true); pin(IA, CLOCKS.today); boot(IA); view(IA);
    if(pos === 'first') touch(IA, 'draft'); swapAt(IA, GOB); if(pos === 'between') touch(IA, 'draft');
    swapAt(IA, LP); if(pos === 'last') touch(IA, 'draft');
    view(IA); const live = fullOf(cardAt(IA));
    boot(IA); view(IA); const b1 = fullOf(cardAt(IA)), c1 = chipFor(IA, LP);
    E(IA, 'undoSwap(' + JSON.stringify(GOB) + ');'); view(IA); const u1 = fullOf(cardAt(IA));
    boot(IA); view(IA); const b2 = fullOf(cardAt(IA)), c2 = chipFor(IA, GOB);
    E(IA, 'undoSwap(' + JSON.stringify(DONOR) + ');'); view(IA); const u2 = fullOf(cardAt(IA));
    boot(IA); view(IA); const b3 = fullOf(cardAt(IA)), r3 = recs(IA);
    const WL = LP + ' :: ' + EXPLP, WG = GOB + ' :: ' + EXPG, WD = DONOR + ' :: ' + DONOR_M;
    const good = live === WL && b1 === WL && c1 === GOB && u1 === WG && b2 === WG && c2 === DONOR && u2 === WD && b3 === WD && r3 === 'none';
    if(good) n++;
    out.push('    draft|' + pos.padEnd(8) + (good ? ' OK   ' : ' MISS ') + 'live=' + live.split(' — ')[0] + ' BOOT1 ' + b1.split(' — ')[0] + ' chip=' + c1 + ' | undo-> ' + u1.split(' — ')[0] + ' BOOT2 ' + b2.split(' — ')[0] + ' chip=' + c2 + ' | undo-> ' + u2.split(' — ')[0] + ' BOOT3 ' + b3.split(' — ')[0] + ' rec=' + r3);
  }
  out.forEach(s => console.log(s));
  ok(R.R5s, n === 3, n + '/3');
}

// ── ROW 6a: swap / undo on an untouched day ──────────────────────────────────
{
  let n = 0, bad = 0; const ex = [];
  for(const dated of [true, false]) for(const clock of Object.keys(CLOCKS)) for(const pair of Object.keys(PAIRS)) for(const reboot of [null, 'past_nextwk']){
    if(reboot === clock) continue; n++;
    setup(IA, dated); pin(IA, CLOCKS[clock]); boot(IA); boot(IA); const cut0 = cutNow(IA);
    const h0 = IA.localStorage.getItem('ia_hist_PM');
    swapAt(IA, PAIRS[pair].to); view(IA); const sw = cardAt(IA).name === PAIRS[pair].to; const h1 = IA.localStorage.getItem('ia_hist_PM');
    E(IA, 'undoSwap(' + JSON.stringify(DONOR) + ');'); view(IA); const un = cardAt(IA).name === DONOR; const h2 = IA.localStorage.getItem('ia_hist_PM');
    boot(IA); const cut1 = cutNow(IA);
    swapAt(IA, PAIRS[pair].to); const h3 = IA.localStorage.getItem('ia_hist_PM'); boot(IA); const cut2 = cutNow(IA);
    const v = !sw || !un || h1 !== h0 || h2 !== h0 || h3 !== h0 || cut1 !== cut0 || cut2 !== cut0;
    if(v){ bad++; if(ex.length < 3) ex.push(clock + '|' + pair + '|dated=' + dated + ' swapped=' + sw + ' undone=' + un + ' hist ' + (h0 !== h1 || h0 !== h2 || h0 !== h3 ? 'WRITTEN' : 'same') + ' cut ' + cut0 + '/' + cut1 + '/' + cut2); }
  }
  ok(R.R6a, n === 36 && bad === 0, bad + '/' + n + (ex.length ? ' ' + ex.join('; ') : ''));
}

// ── ROW 10: record on a hist-restored day survives the boot, chip offered ────
{
  let n = 0; const out = [];
  const SH = [['draft', 'touch_then_swap'], ['draft', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['done', 'touch_then_swap'], ['done', 'swap_then_touch'], ['draft', 'chain_lp']];
  for(const [t, ord] of SH){
    setup(IA, true); pin(IA, CLOCKS.today); boot(IA); view(IA);
    if(ord === 'swap_then_touch'){ swapAt(IA, GOB); touch(IA, t); }
    else if(ord === 'touch_then_swap'){ touch(IA, t); swapAt(IA, GOB); }
    else { touch(IA, t); swapAt(IA, GOB); swapAt(IA, LP); }
    const raw0 = IA.localStorage.getItem('ia_swaps_PM'), snap = !!JS(IA, 'ia_hist_PM')[KEY], shown = ord === 'chain_lp' ? LP : GOB, origin = ord === 'chain_lp' ? GOB : DONOR;
    boot(IA); view(IA); const raw1 = IA.localStorage.getItem('ia_swaps_PM'), chip = chipFor(IA, shown), card = cardAt(IA).name;
    const good = snap && raw0 && raw1 === raw0 && !!JSON.parse(raw1 || '{}')[KEY] && chip === origin && card === shown;
    if(good) n++;
    out.push('    ' + (t + '|' + ord).padEnd(22) + (good ? ' OK   ' : ' MISS ') + 'snapshot=' + snap + ' store byte-equal=' + (raw1 === raw0) + ' rec=' + recs(IA) + ' card=' + card + ' chip=' + chip);
  }
  out.forEach(s => console.log(s));
  ok(R.R10, n === SH.length, n + '/' + SH.length);
}
console.log('  hand rows done | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// ── PAIR ROWS 6b, 6c, 7 ──────────────────────────────────────────────────────
function run6b(X){
  const H = MARIO(); delete H.injury;
  const p = setupCfg(X, H, true); const l = loc(p.weeks[W][D], DONOR); if(!l) return { err:'no donor on the healthy W5 Thu' };
  const stored = JSON.parse(JSON.stringify(p.weeks[W][D]));
  pin(X, CLOCKS.today); boot(X); view(X);
  const it = day(X).sections[l.si].items[l.ii]; X.ctx.__c = { secIdx:l.si, itemIdx:l.ii, name:it.name, detail:it.detail }; X.ctx.__to = GOB; E(X, '_swapCtx=__c;applySwapChoice(__to);');
  const liveSlot = clean(day(X).sections[l.si].items[l.ii].name);
  E(X, "(function(){var ps=getPrograms();ps[0].overlays=[{id:'ov_g222',type:'injury',from:'2026-09-21',to:null,patch:{injury:{region:'knee',tier:'workaround'}},note:'',created:1}];savePrograms(ps);})()");
  boot(X); const b = day(X); const slot = clean(b.sections[l.si].items[l.ii].name);
  const names = dy => dy.sections.map((s, si) => (s.items || []).map((x, ii) => (si === l.si && ii === l.ii) ? '#' : clean(x.name)).join(';')).join('|');
  return { liveSlot, slot, hist:!!JS(X, 'ia_hist_PM')[KEY], pierced:names(b) !== names(stored), day:J(b), stored:names(stored), booted:names(b) }; }
function run6c(X){
  const r = {};
  const trained = [['draft_w5thu', 5, 'thu', 'draft'], ['done_w5thu', 5, 'thu', 'done'], ['draft_w3tue', 3, 'tue', 'draft']];
  for(const [tag, w, d, kind] of trained){
    setup(X, true); pin(X, CLOCKS.today); boot(X); view(X, w, d); X.ctx.__title = day(X, w, d).title || 'T';
    if(kind === 'draft') E(X, "writeSetDraft('zz_g222',['5'],['95'],'');"); else E(X, "handleDayStatus('" + d + "',__title,'complete');");
    const snap = JS(X, 'ia_hist_PM')['w' + w + '_' + d];
    boot(X); const b = day(X, w, d); r[tag] = { day:J(b), eqSnap:!!snap && J(b) === J(snap) }; }
  for(const [tag, w, d] of [['tick_w5thu', 5, 'thu'], ['tick_w3tue', 3, 'tue']]){
    setup(X, true); pin(X, CLOCKS.today); boot(X); view(X, w, d); const it = day(X, w, d).sections[0].items[0];
    X.ctx.__n = clean(it.name); X.ctx.__det = it.detail; E(X, 'logExerciseWeight(__n,95,__det,' + w + ",[5],[95],'" + d + "');");
    boot(X); r[tag] = { cut:cutNow(X), day:J(day(X, w, d)) }; }
  return r; }
if(PAIR){
  // 6b
  { let a, b, b2; try { a = run6b(IA); b = run6b(B); b2 = run6b(B); } catch(e){ a = { err:'threw ' + e.message }; }
    if(a.err || !b || b.err) pairRow('R6b', false, (a.err || (b && b.err)));
    else { console.log('    6b stored W5 Thu  ' + a.stored + '\n    6b booted (cand)  ' + a.booted + '\n    6b booted (V221)  ' + b.booted);
      pairRow('R6b', b.day === b2.day && a.liveSlot === GOB && a.slot === GOB && !a.hist && a.pierced && a.day === b.day,
        'candidate: slot ' + a.slot + ', pierced ' + a.pierced + ', ia_hist_ ' + a.hist + ' | V221: slot ' + b.slot + ', pierced ' + b.pierced + ' | same day ' + (a.day === b.day) + ' | V221 self ' + (b.day === b2.day)); } }
  // 6c
  { let a, b, b2; try { a = run6c(IA); b = run6c(B); b2 = run6c(B); } catch(e){ a = null; console.log('    6c threw ' + e.message); }
    if(!a) pairRow('R6c', false, 'threw');
    else { const tr = ['draft_w5thu', 'done_w5thu', 'draft_w3tue'];
      const same = tr.filter(k => a[k].day === b[k].day && a[k].eqSnap && b[k].eqSnap);
      const self = tr.every(k => b[k].day === b2[k].day) && b.tick_w5thu.cut === b2.tick_w5thu.cut;
      const cuts = ['tick_w5thu', 'tick_w3tue'].map(k => k + ' ' + a[k].cut + '/' + b[k].cut + ' hand ' + HAND_CUT[k]);
      const cutsOk = ['tick_w5thu', 'tick_w3tue'].every(k => a[k].cut === b[k].cut && a[k].cut === HAND_CUT[k]);
      console.log('    6c info: tick-only day booted equal across trees: w5thu ' + (a.tick_w5thu.day === b.tick_w5thu.day) + ', w3tue ' + (a.tick_w3tue.day === b.tick_w3tue.day) + ' (not asserted: the ruling asks the cut)');
      pairRow('R6c', self && same.length === tr.length && cutsOk, 'trained days byte-identical and equal to the snapshot ' + same.length + '/' + tr.length + ' | cuts cand/V221: ' + cuts.join(', ') + ' | V221 self ' + self); } }
  // 7
  { pin(IA, CLOCKS.today); pin(B, CLOCKS.today); let cards = 0, diff = 0, dig = 0, self = 0, crash = 0; const ex = [];
    for(const cfg of L7){
      let pe, pb, pb2; try { pe = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); pb = B.buildProgram(JSON.parse(JSON.stringify(cfg))); pb2 = B.buildProgram(JSON.parse(JSON.stringify(cfg))); } catch(e){ crash++; continue; }
      if(J(pb.weeks) !== J(pb2.weeks)) self++;
      if(J(pe.weeks) !== J(pb.weeks)) dig++;
      Object.keys(pe.weeks).forEach(w => Object.keys(pe.weeks[w]).forEach(d => { const de = pe.weeks[w][d], db = pb.weeks[w] && pb.weeks[w][d];
        (de && de.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { cards++; const ib = db && db.sections && db.sections[si] && db.sections[si].items && db.sections[si].items[ii];
          if(!ib || ib.name !== it.name || ib.detail !== it.detail){ diff++; if(ex.length < 3) ex.push('W' + w + ' ' + d + ' ' + clean(it.name)); } })); })); }
    const want = MANNY_DIGEST_BY_VERSION[VER], mc = MANNY_C.split('/');
    pairRow('R7', !crash && cards > 0 && diff === 0 && dig === 0 && self === 0 && mc[0] === mc[1] && mc[0] === want && MANNY_B === want,
      diff + ' of ' + cards + ' cards, ' + dig + ' of ' + L7.length + ' builds moved; V221 self-unstable ' + self + '; crashes ' + crash + ' | HALF_MANNY ' + MANNY_C + ' (V221 ' + MANNY_B + ') vs MANNY_DIGEST_BY_VERSION[' + VER + '] ' + want + (ex.length ? ' | ' + ex.join('; ') : '')); }
} else { pairRow('R6b', false, 'no pair'); pairRow('R6c', false, 'no pair'); pairRow('R7', false, 'no pair'); }

// ── INFO: rest-day moved, snapshotted, swapped day (never counts) ────────────
function infoMove(X, tag){
  const lines = [];
  const nm = dy => !dy ? '(none)' : dy.rest ? 'REST' + (dy.moved ? '(moved to ' + dy.movedTo + ')' : '') : (dy.title || '?') + (dy.movedFrom ? '(from ' + dy.movedFrom + ')' : '') + ' [' + (dy.sections || []).map(s => (s.items || []).map(i => clean(i.name)).join(';')).join('|').slice(0, 90) + ']';
  for(const shape of ['snap_at_origin', 'snap_at_dest']){
    try {
      setup(X, true); pin(X, CLOCKS.today); boot(X);
      if(shape === 'snap_at_origin'){ view(X, 5, 'tue'); E(X, "writeSetDraft('zz_tue',['5'],['95'],'');"); }
      const cands = E(X, 'restMoveCandidates(5).map(function(c){return c.day;}).join(",")');
      E(X, "_restDraft.w=5;_restDraft.day='wed';_restDraft.pick='tue';applyRestMove();");
      view(X, 5, 'wed');
      if(shape === 'snap_at_dest') E(X, "writeSetDraft('zz_wed',['5'],['95'],'');");
      const dy = day(X, 5, 'wed'); let sl = null, to = null;
      (dy.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(sl || !it || !it.name) return;
        if(!E(X, 'exControlFlags(activeProg.weeks[5].wed.sections[' + si + '],' + ii + ',activeProg.weeks[5].wed.sections[' + si + '].items[' + ii + ']).canSwap')) return;
        const c = E(X, 'swapCandidates(' + JSON.stringify(it.name) + ',activeProg.weeks[5].wed,5,activeProg)'); const t1 = ((c && c.tier1) || []).concat((c && c.tier2) || []);
        if(t1.length){ sl = { si, ii, n:clean(it.name) }; to = t1[0]; } }));
      if(!sl){ lines.push('INFO ' + tag + ' ' + shape + ': no swappable slot on moved Wed'); continue; }
      const it = dy.sections[sl.si].items[sl.ii]; X.ctx.__c = { secIdx:sl.si, itemIdx:sl.ii, name:it.name, detail:it.detail }; X.ctx.__to = to; E(X, '_swapCtx=__c;applySwapChoice(__to);');
      const liveTue = nm(day(X, 5, 'tue')), liveWed = nm(day(X, 5, 'wed')), hk = Object.keys(JS(X, 'ia_hist_PM')).filter(k => /^w5_/.test(k)).join(','), sk = Object.keys(JS(X, 'ia_swaps_PM')).join(',');
      boot(X); const bTue = nm(day(X, 5, 'tue')), bWed = nm(day(X, 5, 'wed')), bSlot = clean(day(X, 5, 'wed').sections[sl.si] && day(X, 5, 'wed').sections[sl.si].items[sl.ii] ? day(X, 5, 'wed').sections[sl.si].items[sl.ii].name : '(none)');
      lines.push('INFO ' + tag + ' ' + shape + ': move candidates ' + cands + ' | swap on Wed ' + sl.n + ' -> ' + clean(to) + ' | hist keys ' + (hk || '-') + ' | swap keys ' + (sk || '-')
        + '\n       LIVE tue ' + liveTue + '\n            wed ' + liveWed + '\n       BOOT tue ' + bTue + '\n            wed ' + bWed + '\n       BOOT wed slot ' + bSlot + ' (swap ' + (bSlot === clean(to) ? 'shown' : 'NOT shown') + ') | wed == live ' + (bWed === liveWed) + ' | tue == live ' + (bTue === liveTue));
    } catch(e){ lines.push('INFO ' + tag + ' ' + shape + ': threw ' + e.message); }
  }
  lines.forEach(s => console.log(s)); }
console.log('\n-- INFO (prints, never counts): rest-day move x snapshot x swap, W5 (move Tue -> Wed, clock W5 Thu) --');
infoMove(IA, 'candidate V' + STAMP);
if(B) infoMove(B, 'baseline V' + B.version);
console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
done();
