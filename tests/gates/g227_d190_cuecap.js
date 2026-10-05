// g227_d190_cuecap.js — GATE for D190 (P-SWAPSEAM), claims (b) and (c): after every live swap the card carries the
// plan's cue iff the plan caps the movement now on the card, and the swap seam moves nothing V226 printed that D190
// did not rule moved (toasts, uninjured athletes, buildProgram, HALF_MANNY).
//
//   node tests/gates/g227_d190_cuecap.js <candidate.html> [baseline_V226.html]
//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_cuecap.js <tree stamped 226> [baseline_V226.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v227_rulings/d190_swapseam_ruling.md, D190 R1 to R6 and the new-gate claims
// (b) and (c), as RE-RULING 1 restates them ("(b) cue <=> cap after every live swap with the three named examples,
// stands; (c) toasts 0, uninjured 0, lattice digests equal, HALF_MANNY [227]=[226], stands"). D-code D190, ships on
// ia-version 227. Claims (a), (c2-i..iii), (d) and (e) are the other D190 gate files, not this one.
//
// ORACLE. Typed here; the engine is never asked for an expected value.
//   CUE    the cue literal ' — hold RPE 7, two in the tank' (real em-dash), typed.
//   CAP    the cap table typed from the ruling header (read from injuryPlan by coach): knee/wa squat, lunge, leg_iso;
//          ankle/wa squat, lunge; hip/wa hinge, lunge, hip_ext, squat; lowback/wa hinge, squat, row, hip_ext;
//          shoulder/wa hpress, vpress, delt_iso; elbow/wa hpress, tri_iso, bi_iso, row, vpull.
//   IFF    a swapped card is right when it ends with CUE exactly when CAP[region] holds the pattern of the movement now
//          on the card AND the cue-free dose (the card with one trailing CUE removed) is non-empty and carries no "RPE";
//          CUE appears at most once and only as the suffix. A movement's pattern comes from the engine's classifier
//          (_pattern; the classifier is not under test). The HAND rows type the pattern too and assert the classifier
//          agrees with the ruling header.
//   HAND   the ruling's own strings (its before/after tables): `2×8`, `2×8 — hold RPE 7, two in the tank`,
//          `2 sets — RPE 8 (stop 2 reps short of failure)`, and the toast `Dumbbell goblet squat in, kettlebell swing
//          out. Same job, same numbers.`; patterns Kettlebell swing hinge (measure's donor path hinge->squat),
//          Dumbbell split-stance deadlift hinge, Dumbbell goblet squat squat, Nordic hamstring curl (anchored) hip_ext.
//   V226   the pair rows: the same chains run on the V226 baseline (argv[3] if it reads 226, else the pinned V226
//          commit; see VERSION PREDICATE), what V226 printed on the same taps.
//   ERA    c-MANNY: the harness MANNY_DIGEST_BY_VERSION table (standing ruling 5).
//
// POPULATION. Lattice: MARIO's config under knee/wa (MARIO itself), ankle/wa, hip/wa, lowback/wa, shoulder/wa,
//   elbow/wa; plus HALF_MANNY and mario_noinj for the uninjured rows. Weeks 3 and 5. Classes hop1 (A->B), hop2
//   (A->B->C), cyc2 (A->B->A), enumerated on the tree under test with the gate enumerator (tests/measure/
//   v227_swapseam.js): a hop is taken only when its target is in the swap sheet's own list for the item as it then
//   stands (swapCandidates tier1+tier2, or auxSwapCandidates for a null-pattern aux-family item) and the slot's canSwap
//   flag is on. Replay re-checks each hop; a chain with a hop not offered at replay is dropped from b-ALL and counted.
//   Full enumeration of all six injured configs does not fit the runtime budget (about 42,000 chains, one fresh page
//   per chain per day), so the injured lattice is two strata, both printed with denominators:
//     R  EVERY chain the cue can touch, fully enumerated: the donor's grid card carries CUE (a natively cued donor), or
//        the donor's cue-free dose is RPE-free and some movement in the chain (donor or hop target) sits on a capped
//        pattern. This is every chain a dropped live filter (M1), a dropped live strip (M2) or a misplaced filter (M4)
//        can move, so every class the sabotage list must trip is in the population by construction, including ankle/wa
//        W3 thu Leg superset B.
//     S  a fixed-seed sample of at most NS per (config, week, day, class) of the rest (the controls: the iff predicts
//        no cue anywhere on them).
//   Uninjured (HALF_MANNY, mario_noinj): a fixed-seed sample of at most NU per (config, week, day, class).
//   measure's full-enumeration counts are the ship proof (cue <=> cap 0 violations of 43,871, toasts moved 0 of
//   66,969, uninjured 0 of 17,217); this is the guard. Fixtures: MARIO = commercial|support_strength|beginner|
//   liftonly|knee/workaround, seed 76308; the region configs are MARIO with injury switched to the region at the
//   workaround tier; HALF_MANNY from the harness; mario_noinj = MARIO with no injury. Program start 2026-08-24, clock
//   pinned 2026-09-24.
//
// BOOT MODEL. A boot in the app is a fresh page. The harness VM is not (HALF_MANNY's build shares items by reference
//   with module-level tables, so an in-VM reboot starts from a card that already carries the swap; g222's BOOT MODEL).
//   So every act starts on a fresh VM, and every boot is a fresh VM loaded with the device storage that act left.
//   Chains run in batches of one chain per (week, day), each batch its own fresh page and fresh store. SELFCHECK proves
//   on each tree and config that a boot equals itself and equals a fresh-page boot (W5 thu); PAIRSELF proves the
//   baseline equals itself on one batch per config (act, boot, toast, undo, undo-boot) before any pair diff is read.
//
// VERSION PREDICATE (standing rulings 2 and 4). D190 ships at 227.
//   below 227      REFUSED, every assertion row FAILS by name.
//   227 and up     every row asserts.
//   229 and up     c-TOAST re-keyed (D193's R8 hold toasts: tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 2
//                  R8 and Amendment 4 "The rules", R8 trigger restated; tests/measure/v229_rulings/d194_injlens_ruling.md
//                  Amendment 1 (r) and Amendment 3's beneath-the-hold lens): every toast that moved against V226 is the
//                  hold variant of its hand kind on a hand clamp pair, every hand clamp pair prints the hold sentence, and
//                  the moved count is pinned (1,706 of 9,882; 0 on V228).
//                  Fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
//                  Below 229 c-TOAST asserts exactly as before.
//   231 and up     c-DIGEST and c-UNINJ re-keyed (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, class A-1:
//                  HALF_MANNY's W1 to W12 Tuesdays gain D195 Amendment 2's fourth item). c-DIGEST: manny wants the
//                  harness era row MANNY_DIGEST_BY_VERSION[VER] (standing ruling 5; 2d35e8f743680cfa at 231; an absent
//                  row FAILS by name), mario_noinj still wants V226. c-UNINJ: mario_noinj 0 moved of 719 chains; manny
//                  144 moved of 677, every moved chain on W3 tue or W5 tue (typed pins, the ruling's print). Below 231
//                  both rows assert exactly as before. c-MANNY needs no change (it already reads MD[VER]).
//   IA_ASSUME_VERSION=227 lifts a file stamped exactly 226 to 227 for a discrimination run. It is announced, and
//   ignored on any other file. gate.sh never sets it.
//   Pair rows (c-TOAST, c-UNINJ, c-DIGEST) read the baseline from argv[3] if it reads ia-version 226, else from
//   `git show 637bc8e24a243daf3803a554125bba117f44281f:index.html` (V226) into os.tmpdir(): tests/sabotage.py passes no
//   argv[3] (the V226 slice 7e defect; the fix is the g225_d187_pacerate.js / g226 form). The run prints which source
//   it used. If neither yields a tree reading 226 (git missing, the commit unreadable), those rows FAIL setup by
//   name, never PASS. c-MANNY reads the harness table, not the baseline.
//   Discrimination (IA_ASSUME_VERSION=227 on base_V226, argv[3] base_V226): b-ALL and b-HAND-1 FAIL, because the V226
//   live card never cues (b-HAND-2 and b-HAND-3 fail too, on their uncued hop 1). The c rows PASS there: they are
//   controls, base against base.
//
// ROWS
//   b-ALL     every live hop of every reachable chain in R+S on the six injured configs: the swapped slot carries the
//             hop's target by name and its detail satisfies IFF. 0 violations of N hops, N > 0, with hops the oracle
//             says the plan cues, hops it says it does not, and hops off a cued donor all present.
//   b-HAND-1  MARIO (knee/wa) W5 thu Leg superset B: Kettlebell swing (2×8) -> Dumbbell split-stance deadlift ->
//             Dumbbell goblet squat. Hop 1 `2×8`, hop 2 ends `2×8 — hold RPE 7, two in the tank`; each hop's live card
//             boots equal (slot and whole day).
//   b-HAND-2  ankle/wa W3 thu Leg superset B: Kettlebell swing (2×8) -> Dumbbell goblet squat -> Dumbbell
//             split-stance deadlift. Hop 1 `2×8 — hold RPE 7, two in the tank` with the toast `Dumbbell goblet squat
//             in, kettlebell swing out. Same job, same numbers.`, hop 2 `2×8`; live == boot on each.
//   b-HAND-3  ankle/wa W3 thu Leg superset B: Kettlebell swing (2×8) -> Dumbbell goblet squat -> Nordic hamstring curl
//             (anchored). Hop 1 cued (as b-HAND-2), hop 2 `2 sets — RPE 8 (stop 2 reps short of failure)`; live == boot.
//   c-TOAST   the toast on every live hop of the injured lattice (R+S) equals V226's toast on the same chain, and the
//             hop's reachability is unmoved. 0 moved of N hops.
//   c-UNINJ   HALF_MANNY and mario_noinj: per chain the live day, every hop's slot and toast, the boot, the undo of the
//             last hop (chip, slot, toast, day) and the boot after the undo all equal V226. 0 moved of N chains.
//   c-DIGEST  progDigest(buildProgram) on the artifact equals V226's on all eight lattice configs (the uninjured two
//             included), each built twice per tree and equal to itself.
//   c-MANNY   MANNY_DIGEST_BY_VERSION[227] exists and === MANNY_DIGEST_BY_VERSION[226] (an absent row FAILS by name),
//             and HALF_MANNY's digest on the artifact equals the artifact era's row (at 227 that is [227]).
//
// SABOTAGE THIS FILE IS MEANT TO CATCH (scratch copies, each anchor count==1):
//   M1  the `if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){` live filter block in applySwapChoice made a
//       no-op: trips b-ALL (cue missing on capped ends) and b-HAND-1.
//   M2  `const _base=_stripCapCue(_wasDetail);` -> `const _base=_wasDetail;`: trips b-ALL (cue carried onto an uncapped
//       loaded end) and b-HAND-2.
//   M4  the live filter block moved above `const _reRx=(item.detail!==_base);`: trips c-TOAST (a cue the filter appends
//       turns "Same job, same numbers." into "No load to add here").
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load, fixtures, progDigest } = H;

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 227, BASE_ERA = 226;
const V226_COMMIT = '637bc8e24a243daf3803a554125bba117f44281f';   // V226: D188/D189 (the V226 artifact, forever)
const NS = 16, NU = 24;
let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

const R = {
  bALL:   'row b-ALL    cue <=> cap on every live hop of the injured lattice (knee, ankle, hip, lowback, shoulder, elbow at workaround; W3, W5; hop1, hop2, cyc2): the card ends with the cue iff the plan caps the pattern and the cue-free dose carries no RPE',
  bH1:    'row b-HAND-1 MARIO knee/wa W5 thu Leg superset B: Kettlebell swing (2×8) -> Dumbbell split-stance deadlift -> Dumbbell goblet squat ends `{RX8C}`, live == boot',
  bH2:    'row b-HAND-2 ankle/wa W3 thu Leg superset B: Kettlebell swing (2×8) -> Dumbbell goblet squat (`{RX8C}`) -> Dumbbell split-stance deadlift (`2×8`), live == boot',
  bH3:    'row b-HAND-3 ankle/wa W3 thu Leg superset B: Kettlebell swing -> Dumbbell goblet squat (cued) -> Nordic hamstring curl (anchored) prints `2 sets — RPE 8 (stop 2 reps short of failure)`, live == boot',
  cTOAST: 'row c-TOAST  pair vs V226: the toast on every live hop of the injured lattice is unmoved, 0 moved',
  cUNINJ: 'row c-UNINJ  pair vs V226: HALF_MANNY and mario_noinj live, boot, toast and undo unmoved, 0 moved',
  cDIGEST:'row c-DIGEST pair vs V226: progDigest(buildProgram) equal on every lattice config, the uninjured two included',
  cMANNY: 'row c-MANNY  MANNY_DIGEST_BY_VERSION[227] exists and === [226] by reference; HALF_MANNY on the artifact prints the era row',
};

// ── TYPED ORACLE ─────────────────────────────────────────────────────────────────────────────────────────────────
// CUE, RX8C and HANDS are typed after the version predicate below (V228 D193 R1, split): they read VER.
const CAP = { knee:['squat', 'lunge', 'leg_iso'], ankle:['squat', 'lunge'], hip:['hinge', 'lunge', 'hip_ext', 'squat'],
  lowback:['hinge', 'squat', 'row', 'hip_ext'], shoulder:['hpress', 'vpress', 'delt_iso'], elbow:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'] };
const KB = 'Kettlebell swing', SSDL = 'Dumbbell split-stance deadlift', GOB = 'Dumbbell goblet squat', NORD = 'Nordic hamstring curl (anchored)';
const PAT_TYPED = { [KB]:'hinge', [SSDL]:'hinge', [GOB]:'squat', [NORD]:'hip_ext' };
const RX8 = '2×8', BW8 = '2 sets — RPE 8 (stop 2 reps short of failure)';
const TOAST_GOB = 'Dumbbell goblet squat in, kettlebell swing out. Same job, same numbers.';
const cueCount = s => s.split(CUE).length - 1;
const stripCue = s => s.endsWith(CUE) ? s.slice(0, s.length - CUE.length) : s;
// IFF: true when the card is right. region null (uninjured) never cues.
function iff(region, pattern, detail){
  const d = String(detail || ''), has = d.endsWith(CUE), n = cueCount(d), base = stripCue(d);
  const want = !!region && CAP[region].includes(pattern) && !!base && !/RPE/.test(base);
  return { ok:has === want && n === (has ? 1 : 0), want, has };
}

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = r => { const c = clone(MARIO); if(r) c.injury = { region:r, tier:'workaround' }; else delete c.injury; return c; };
const CFGS = { mario:withInj('knee'), ankle_wa:withInj('ankle'), hip_wa:withInj('hip'), lowback_wa:withInj('lowback'), shoulder_wa:withInj('shoulder'),
  elbow_wa:withInj('elbow'), manny:clone(fixtures.HALF_MANNY), mario_noinj:withInj(null) };
const INJ_CK = ['mario', 'ankle_wa', 'hip_wa', 'lowback_wa', 'shoulder_wa', 'elbow_wa'], UNINJ_CK = ['manny', 'mario_noinj'];
const REG = ck => (CFGS[ck].injury && CFGS[ck].injury.tier === 'workaround') ? CFGS[ck].injury.region : null;
const WEEKS = [3, 5], DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
const FILES = { C:ART, B:null }, stored = {};
function fresh(which){ const T = load(FILES[which]); T.__tag = which; pin(T); E(T, HELP); return T; }
function setup(IA, ck){
  IA.localStorage.clear(); pin(IA);
  const key = IA.__tag + ck;
  if(!stored[key]){ const P = fresh(IA.__tag); const p = P.buildProgram(clone(CFGS[ck])); const st = clone(p);
    Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[key] = JSON.stringify(st); }
  IA.ctx.__SP = JSON.parse(stored[key]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA, w, d){ E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA, w, d){ return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
function sig(dy){ if(!dy || !dy.sections) return '(none)'; return dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '') + (it._skipped ? '[x]' : '')).join(';') + '}').join(' '); }
function slotOf(dy, si, ii){ const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n:clean(it.name), d:it.detail || '' } : { n:'(none)', d:'' }; }
const dumpLS = IA => new Map(IA.localStorage._map);
function putLS(IA, m){ IA.localStorage.clear(); for(const [k, v] of m) IA.localStorage.setItem(k, v); }
function reboot(from){ const T = fresh(from.__tag); putLS(T, dumpLS(from)); boot(T); return T; }   // a fresh page on the same device
const toastsOf = IA => Array.from(E(IA, '__T')).join(' / ');
// one hop through the sheet, exactly as the sheet does it; returns 1 when the target was not offered
function hop(IA, c, h){
  view(IA, c.w, c.d); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections[h.si] && dy.sections[h.si].items[h.ii];
  if(!it) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d;
  const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')'));
  const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);');
  return (!can || !cands.includes(h.to)) ? 1 : 0;
}
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; }
function shuffled(arr, key){ const a = arr.slice(), r = mulberry(hstr(key)); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '-';

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
// V228 D193 R1 (split, Mario round 2; Amendment 2 "g227 gates"): the hand cue literal is version-predicated on the
// artifact's own ia-version, "three" at 228 and above, "two" at 227 and below, so every row still runs on V227. Sited
// here, after VER (a `let` declared above): the old TYPED ORACLE site would read it in its temporal dead zone. RX8C and
// HANDS read CUE at load time, so they sit here too (HANDS moved verbatim); the bH1/bH2 labels are filled from RX8C.
const CUE = VER >= 228 ? ' — hold RPE 7, three in the tank' : ' — hold RPE 7, two in the tank';
const RX8C = RX8 + CUE;
const HANDS = [
  { key:'bH1', ck:'mario',    w:5, d:'thu', sec:'Leg superset B', donor:KB, donorRx:RX8, hops:[SSDL, GOB],  want:[RX8, RX8C],  toast:[null, null] },
  { key:'bH2', ck:'ankle_wa', w:3, d:'thu', sec:'Leg superset B', donor:KB, donorRx:RX8, hops:[GOB, SSDL],  want:[RX8C, RX8],  toast:[TOAST_GOB, null] },
  { key:'bH3', ck:'ankle_wa', w:3, d:'thu', sec:'Leg superset B', donor:KB, donorRx:RX8, hops:[GOB, NORD],  want:[RX8C, BW8],  toast:[TOAST_GOB, null] },
];
R.bH1 = R.bH1.split('{RX8C}').join(RX8C); R.bH2 = R.bH2.split('{RX8C}').join(RX8C);
console.log('g227 D190 cue <=> cap + pairs | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | NS ' + NS + ', NU ' + NU);
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D190 P-SWAPSEAM (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// V226 baseline for the pair rows c-TOAST, c-UNINJ, c-DIGEST (V227 slice 10, the V226 slice 7e form of g225_d187_pacerate.js and the g226
// gates): argv[3] if it reads 226, else `git show <V226_COMMIT>:index.html` into os.tmpdir(), because
// tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy lives until
// exit. No tree reading 226 leaves B null and the pair rows FAIL setup by name, never PASS.
let B = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!B){
  const f = path.join(os.tmpdir(), 'g227_d190_cuecap_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V226_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git show ' + V226_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
console.log('  V' + BASE_ERA + ' baseline: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
const TREES = B ? ['C', 'B'] : ['C'];
// SELFCHECK: a boot equals itself and a fresh-page boot, per tree and config, and the day is non-empty
const self = {};
for(const T of TREES) for(const ck of Object.keys(CFGS)){
  const X = fresh(T); setup(X, ck); boot(X); const a = JS(dayOf(X, 5, 'thu')); boot(X); const b = JS(dayOf(X, 5, 'thu'));
  const c = JS(dayOf(reboot(X), 5, 'thu'));
  self[T + ':' + ck] = a === b && a === c && a.length > 20;
}
const SELF_C = Object.keys(self).filter(k => k.startsWith('C:')).every(k => self[k]), SELF_B = !!B && Object.keys(self).filter(k => k.startsWith('B:')).every(k => self[k]);
console.log('  SELFCHECK boot==boot==fresh boot, W5 thu: ' + Object.keys(self).map(k => k + ' ' + self[k]).join(', '));
// the classifier (not under test), one VM per tree
const PV = fresh('C'), pc = {};
const pat = n => (n in pc) ? pc[n] : (pc[n] = E(PV, '_pattern(' + JSON.stringify(n) + ')') || null);

// ── ENUMERATE (tree under test; the gate enumerator) ───────────────────────────────────────────────────────────────
const ALL = {};
for(const ck of Object.keys(CFGS)){
  const X = fresh('C'); setup(X, ck); boot(X); const chains = []; let id = 0;
  const cand = (w, n) => Array.from(E(X, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(X, '__canSwap(__D,' + si + ',' + ii + ')');
  const add = (cls, w, d, sl, tos) => chains.push({ id:ck + '#' + id++, ck, cls, w, d, si:sl.si, ii:sl.ii, donor:clean(sl.n), dt:sl.dt, hops:tos.map(to => ({ si:sl.si, ii:sl.ii, to })) });
  for(const w of WEEKS) for(const d of DAYS){
    const live = dayOf(X, w, d); if(!live || !live.sections) continue;
    const bs = clone(live); X.ctx.__D = bs;
    const slots = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name, dt:it.detail || '' }); }));
    for(const sl of slots){ X.ctx.__D = bs; const c1 = cand(w, sl.n);
      for(const Bn of c1){ add('hop1', w, d, sl, [Bn]);
        const d1 = clone(bs); d1.sections[sl.si].items[sl.ii].name = Bn; X.ctx.__D = d1; if(!can(sl.si, sl.ii)) continue;
        for(const C of cand(w, Bn)) add(C === sl.n ? 'cyc2' : 'hop2', w, d, sl, [Bn, C]); } }
  }
  ALL[ck] = chains;
}
// ── POPULATIONS ───────────────────────────────────────────────────────────────────────────────────────────────────
const capped = (ck, n) => { const r = REG(ck); return !!r && CAP[r].includes(pat(n)); };
const natCued = c => c.dt.endsWith(CUE);
const freeDose = c => { const b = stripCue(c.dt); return !!b && !/RPE/.test(b); };
const inR = c => natCued(c) || (freeDose(c) && (capped(c.ck, c.donor) || c.hops.some(h => capped(c.ck, h.to))));
function sample(rows, n, tag){
  const g = {}; rows.forEach(c => { const k = c.w + '|' + c.d + '|' + c.cls; (g[k] = g[k] || []).push(c); });
  let out = []; Object.keys(g).sort().forEach(k => { out = out.concat(shuffled(g[k], g[k][0].ck + '|' + k + '|' + tag).slice(0, n)); }); return out;
}
const POP = {};
for(const ck of INJ_CK){ const r = ALL[ck].filter(inR), s = sample(ALL[ck].filter(c => !inR(c)), NS, 'S'); r.forEach(c => { c.stratum = 'R'; }); s.forEach(c => { c.stratum = 'S'; }); POP[ck] = r.concat(s);
  console.log('  POP ' + ck.padEnd(12) + ' enumerated ' + ALL[ck].length + ' | R (cue-reachable, full) ' + r.length + ' (natively cued donor ' + r.filter(natCued).length + ') | S (sample <= ' + NS + ') ' + s.length + ' | ' + fmt(tally(POP[ck], c => 'W' + c.w + '|' + c.cls))); }
for(const ck of UNINJ_CK){ POP[ck] = sample(ALL[ck], NU, 'U'); console.log('  POP ' + ck.padEnd(12) + ' enumerated ' + ALL[ck].length + ' | sample <= ' + NU + ' ' + POP[ck].length + ' | ' + fmt(tally(POP[ck], c => 'W' + c.w + '|' + c.cls))); }
console.log('  enumerated | ' + secs());

// ── RUN (one chain per (week, day) per batch, each batch a fresh page and a fresh store) ─────────────────────────────
function runBatch(which, ck, batch, full, out){
  const A = fresh(which); setup(A, ck); boot(A);
  const st = {};
  batch.forEach(c => { st[c.id] = { pre:slotOf(dayOf(A, c.w, c.d), c.si, c.ii), preSig:sig(dayOf(A, c.w, c.d)), steps:[], toasts:[], unreach:0 }; });
  for(const c of batch){ const s = st[c.id]; for(const h of c.hops){ E(A, '__T.length=0;'); s.unreach += hop(A, c, h); s.steps.push(slotOf(dayOf(A, c.w, c.d), h.si, h.ii)); s.toasts.push(toastsOf(A)); } }
  batch.forEach(c => { st[c.id].live = sig(dayOf(A, c.w, c.d)); });
  if(full){
    const Rb = reboot(A); batch.forEach(c => { st[c.id].boot = sig(dayOf(Rb, c.w, c.d)); });
    batch.forEach(c => { const s = st[c.id], last = s.steps[s.steps.length - 1]; view(A, c.w, c.d);
      const chip = E(A, 'swapOriginOf(' + JSON.stringify(last.n) + ')') || ''; s.chip = chip; s.undoToast = '';
      if(chip){ E(A, '__T.length=0;'); E(A, 'undoSwap(' + JSON.stringify(chip) + ');'); s.undoToast = toastsOf(A); }
      s.undoSlot = slotOf(dayOf(A, c.w, c.d), c.si, c.ii); s.undoSig = sig(dayOf(A, c.w, c.d)); });
    const U = reboot(A); batch.forEach(c => { st[c.id].undoBoot = sig(dayOf(U, c.w, c.d)); });
  }
  batch.forEach(c => { out[c.id] = st[c.id]; });
}
function batches(chains){ const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length)), out = [];
  for(let b = 0; b < nB; b++) out.push(lists.map(l => l[b]).filter(Boolean)); return out; }
function run(which, ck, chains, full){ const out = {}; for(const bt of batches(chains)) runBatch(which, ck, bt, full, out); return out; }
const RES = { C:{}, B:{} };
for(const ck of INJ_CK){ RES.C[ck] = run('C', ck, POP[ck], false); if(B) RES.B[ck] = run('B', ck, POP[ck], false); }
console.log('  injured lattice run on ' + TREES.join('+') + ' | ' + secs());
for(const ck of UNINJ_CK){ RES.C[ck] = run('C', ck, POP[ck], true); if(B) RES.B[ck] = run('B', ck, POP[ck], true); }
console.log('  uninjured run on ' + TREES.join('+') + ' | ' + secs());
// PAIRSELF: the baseline equals itself on one batch per config (act, boot, toast, undo, undo-boot)
let PAIRSELF = false;
if(B){ PAIRSELF = true; const ps = [];
  for(const ck of Object.keys(CFGS)){ const bt = batches(POP[ck])[0] || []; const o1 = {}, o2 = {}; runBatch('B', ck, bt, true, o1); runBatch('B', ck, bt, true, o2);
    const eq = bt.length > 0 && JSON.stringify(o1) === JSON.stringify(o2); ps.push(ck + ' ' + (eq ? bt.length + '/' + bt.length : 'MISMATCH')); if(!eq) PAIRSELF = false; }
  console.log('  PAIRSELF V' + BASE_ERA + ' == itself (one batch per config): ' + ps.join(', ')); }
const tag = c => c.ck + ' W' + c.w + ' ' + c.d + ' ' + c.cls + ' ' + c.donor + ' > ' + c.hops.map(h => h.to).join(' > ');

// ── b-ALL ──────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  let hops = 0, wantCue = 0, wantNo = 0, offCued = 0, dropped = 0, nChains = 0; const bad = [];
  const seg = {};
  for(const ck of INJ_CK){ const r = REG(ck);
    for(const c of POP[ck]){ const s = RES.C[ck][c.id]; if(s.unreach){ dropped++; continue; } nChains++;
      c.hops.forEach((h, k) => { const st = s.steps[k], v = iff(r, pat(h.to), st.d), nameOK = st.n === clean(h.to); hops++;
        const donorD = k === 0 ? c.dt : s.steps[k - 1].d; if(donorD.endsWith(CUE)) offCued++;
        if(v.want) wantCue++; else wantNo++;
        const o = seg[ck + '|' + c.stratum] = seg[ck + '|' + c.stratum] || { n:0, cue:0, bad:0 }; o.n++; if(v.want) o.cue++;
        if(!v.ok || !nameOK){ o.bad++; bad.push({ c, k, st, v, nameOK, p:pat(h.to) }); } }); } }
  Object.keys(seg).sort().forEach(k => console.log('    b ' + k.padEnd(16) + ' hops ' + String(seg[k].n).padStart(5) + '  oracle cues ' + String(seg[k].cue).padStart(4) + '  violations ' + seg[k].bad));
  console.log('    b guard: chains ' + nChains + ', dropped (hop not offered at replay) ' + dropped + ', hops the oracle cues ' + wantCue + ', hops it does not ' + wantNo + ', hops off a cued donor ' + offCued);
  if(bad.length) console.log('    b violations by kind: ' + fmt(tally(bad, b => b.c.ck + '|' + b.p + '|' + (!b.nameOK ? 'name' : b.v.want ? 'cue missing' : b.v.has ? 'cue on an uncued card' : 'cue malformed'))));
  bad.slice(0, 4).forEach(b => console.log('      ' + tag(b.c) + ' hop' + (b.k + 1) + ' [' + b.p + ']: ' + b.st.n + ' :: ' + b.st.d));
  ok(R.bALL, SELF_C && hops > 0 && wantCue > 0 && wantNo > 0 && offCued > 0 && bad.length === 0, 'violations ' + bad.length + '/' + hops + ' hops on ' + nChains + ' chains (oracle cues ' + wantCue + ', off a cued donor ' + offCued + ')');
}

// ── b-HAND-1..3 ───────────────────────────────────────────────────────────────────────────────────────────────────
for(const h of HANDS){
  const r = REG(h.ck);
  const typedOK = h.hops.every((to, k) => CAP[r].includes(PAT_TYPED[to]) === h.want[k].endsWith(CUE));   // the typed oracle agrees with itself
  const patOK = [h.donor].concat(h.hops).every(n => pat(n) === PAT_TYPED[n]);
  const A = fresh('C'); setup(A, h.ck); boot(A); const d0 = dayOf(A, h.w, h.d); let L = null;
  ((d0 && d0.sections) || []).forEach((s, si) => { if(clean(s.label).indexOf(h.sec) !== 0) return; (s.items || []).forEach((it, ii) => { if(!L && clean(it.name) === h.donor) L = { si, ii }; }); });
  if(!L){ ok(R[h.key] + ' (setup: ' + h.donor + ' not in ' + h.sec + ' on ' + h.ck + ' W' + h.w + ' ' + h.d + ', fixture moved)', false); continue; }
  const pre = slotOf(d0, L.si, L.ii), got = [];
  for(let k = 1; k <= h.hops.length; k++){
    const X = fresh('C'); setup(X, h.ck); boot(X); let un = 0, toast = '';
    for(let j = 0; j < k; j++){ E(X, '__T.length=0;'); un += hop(X, { w:h.w, d:h.d }, { si:L.si, ii:L.ii, to:h.hops[j] }); toast = toastsOf(X); }
    const live = slotOf(dayOf(X, h.w, h.d), L.si, L.ii), liveS = sig(dayOf(X, h.w, h.d));
    const Y = reboot(X); const bt = slotOf(dayOf(Y, h.w, h.d), L.si, L.ii), btS = sig(dayOf(Y, h.w, h.d));
    got.push({ un, toast, live, bt, dayEq:liveS === btS });
  }
  console.log('    ' + h.key + ' ' + h.ck + ' W' + h.w + ' ' + h.d + ' [' + L.si + '][' + L.ii + '] pre ' + pre.n + ' :: ' + pre.d + ' | patterns typed==classifier ' + patOK + ' (' + [h.donor].concat(h.hops).map(n => n + ' ' + pat(n)).join(', ') + ')');
  got.forEach((g, k) => console.log('      hop' + (k + 1) + ' -> ' + h.hops[k] + ' | live ' + g.live.n + ' :: ' + g.live.d + ' | boot ' + g.bt.n + ' :: ' + g.bt.d + (g.dayEq ? ' (day == live)' : ' (day != live)') + ' | not offered ' + g.un + ' | toast ' + g.toast));
  const okH = SELF_C && typedOK && patOK && pre.n === h.donor && pre.d === h.donorRx && got.every((g, k) => g.un === 0 && g.live.n === h.hops[k] && g.live.d === h.want[k]
    && g.bt.n === g.live.n && g.bt.d === g.live.d && g.dayEq && (h.toast[k] === null || g.toast === h.toast[k]));
  ok(R[h.key], okH, got.map((g, k) => 'hop' + (k + 1) + ' live ' + JSON.stringify(g.live.d) + (g.bt.d === g.live.d && g.dayEq ? ' =boot' : ' boot ' + JSON.stringify(g.bt.d))).join(', '));
}

// ── c-TOAST ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const setupNote = B ? '' : ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')';
  if(!B) ok(R.cTOAST + setupNote, false);
  else {
    let hops = 0, moved = 0, nonEmpty = 0, cueHops = 0; const mv = [], seg = {};
    for(const ck of INJ_CK){ const r = REG(ck);
      for(const c of POP[ck]){ const a = RES.C[ck][c.id], b = RES.B[ck][c.id];
        c.hops.forEach((h, k) => { hops++; if(a.toasts[k]) nonEmpty++; if(iff(r, pat(h.to), a.steps[k].d).want) cueHops++;
          const o = seg[ck] = seg[ck] || { n:0, mv:0 }; o.n++;
          if(a.toasts[k] !== b.toasts[k] || !!a.unreach !== !!b.unreach){ moved++; o.mv++; mv.push({ c, k, a:a.toasts[k], b:b.toasts[k] }); } }); } }
    console.log('    c-TOAST ' + Object.keys(seg).map(k => k + ' ' + seg[k].mv + '/' + seg[k].n).join(', ') + ' | hops with a toast ' + nonEmpty + ', hops the plan cues ' + cueHops);
    if(mv.length) console.log('    c-TOAST moves: ' + fmt(tally(mv, m => String(m.b).replace(/^.* out\. /, '').slice(0, 30) + ' => ' + String(m.a).replace(/^.* out\. /, '').slice(0, 30))));
    mv.slice(0, 3).forEach(m => console.log('      ' + tag(m.c) + ' hop' + (m.k + 1) + '\n        V' + BASE_ERA + ' ' + m.b + '\n        now  ' + m.a));
    // V229 D193 R8 (Amendment 2 R8, Amendment 4 "The rules": R8 trigger restated, (k) "0 false claims"), D194 Amendment 1 (r)
    // ("c-TOAST 1,706 of 9,882 (D193 R8: every moved toast ends with the hold sentence and its pair's clamp changed the number
    // by the (k) hand oracle; count pinned; the row parks if any moved toast is not a hold variant)") and Amendment 3 (the
    // dose is judged beneath its hold). Fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
    // HAND (k) ORACLE, typed, never the tree under test, measure's M8 (k) method (tests/measure/v229_caprpe_cf3.js :359-368)
    // carried hop by hop: the dose handed to the clamp is the chain's dose read beneath its hold (both cue wordings; R7's
    // text by shape -> the strength test text), converted where V226 itself converted the same pair (its card != its
    // donor, both read beneath the cue, and no window toast) by the unloadable reader's bucket (Amendment 3 section 1: 6
    // for RPE 6.x, light or easy; 7 for RPE 7.x; else 8), else its named RPE (a range by its top). A clamp pair is a
    // target capped by CAP (the gate's hand table; `pat` is the classifier, not under test) with that RPE above 7. The
    // hold variant's body is typed from R8: window "The load runs out before the reps do here. Reps move to a to b."
    // (a and b off V226's window toast), unloadable "No load to add here.", verbatim "Same sets, same reps.", each ending
    // " Your injury plan holds this one at RPE 7.".
    const D193_ERA = 229, D193_CTOAST_PIN = 1706;
    if(VER >= D193_ERA){
      const HOLD_K = ' Your injury plan holds this one at RPE 7.';
      const CUE_K = / — hold RPE 7, (?:two|three) in the tank$/;
      const R7_K = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
      const TEST_K = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
      const blindK = s => typeof s !== 'string' ? '' : R7_K.test(s) ? TEST_K : s.replace(CUE_K, '');
      const rpeK = d => { const re = /RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/g; let m, best = null; while((m = re.exec(String(d || '')))){ const v = Math.max(+m[1], m[2] ? +m[2] : 0); if(best === null || v > best) best = v; } return best; };
      const bucketK = d => /rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8;
      const bwK = d => { const m = /^(\d+)\s*[×x]/.exec(d || ''); const s = m ? Math.min(4, Math.max(2, +m[1])) : 3, r = bucketK(d); return r === 8 ? s + ' sets — RPE 8 (stop 2 reps short of failure)' : s + ' sets — RPE ' + r + ' (leave 3 or more in reserve)'; };
      const bodyOf = t => { const i = String(t || '').indexOf(' out. '); return i < 0 ? null : String(t).slice(i + 6); };
      let mvK = 0, badK = 0, clampK = 0, missK = 0; const exK = [], kinds = {};
      for(const ck of INJ_CK){ const r = REG(ck);
        for(const c of POP[ck]){ const a = RES.C[ck][c.id], b = RES.B[ck][c.id]; let beneath = blindK(c.dt);
          c.hops.forEach((h, k) => {
            const bDon = k === 0 ? b.pre.d : b.steps[k - 1].d, bCard = b.steps[k].d, bT = b.toasts[k] || '', aT = a.toasts[k] || '';
            const wm = /The load runs out before the reps do here\. .*Reps move to (\d+) to (\d+)\./.exec(bT);
            const conv = !wm && blindK(bCard) !== blindK(bDon);
            const pre = conv ? bucketK(beneath) : rpeK(beneath);
            const clamp = !!r && CAP[r].includes(pat(h.to)) && pre !== null && pre > 7;
            const kind = wm ? 'window' : conv ? 'unloadable' : 'verbatim';
            const body = wm ? 'The load runs out before the reps do here. Reps move to ' + wm[1] + ' to ' + wm[2] + '.' + HOLD_K : conv ? 'No load to add here.' + HOLD_K : 'Same sets, same reps.' + HOLD_K;
            if(clamp){ clampK++; if(!aT.endsWith(HOLD_K)){ missK++; if(exK.length < 4) exK.push('clamp pair without the hold: ' + tag(c) + ' hop' + (k + 1) + ' [' + kind + '] ' + aT); } }
            if(aT !== bT || !!a.unreach !== !!b.unreach){ mvK++; kinds[kind] = (kinds[kind] || 0) + 1;
              if(!(clamp && aT.endsWith(HOLD_K) && bodyOf(aT) === body)){ badK++; if(exK.length < 8) exK.push('moved, not the hold variant on a hand clamp pair: ' + tag(c) + ' hop' + (k + 1) + ' [' + kind + (clamp ? ', clamp' : ', not clamp') + '] V' + BASE_ERA + ' ' + bT + ' | now ' + aT + ' | want body ' + body); } }
            if(conv) beneath = bwK(beneath);
          }); } }
      console.log('    c-TOAST D193 R8 (V' + VER + '): moved ' + mvK + ' by hand kind ' + fmt(kinds) + ' | hand clamp pairs ' + clampK + ', without the hold sentence ' + missK + ' | moved and not the hold variant on a hand clamp pair ' + badK);
      exK.forEach(s => console.log('      ' + s));
      ok(R.cTOAST + ' [V229 D193 R8, D194 Amendment 1 (r) / Amendment 3: moved ' + mvK + ' == pin ' + D193_CTOAST_PIN + ', every one the hold variant on a hand clamp pair (not ' + badK + '), hand clamp pairs ' + clampK + ' without the hold ' + missK + ']',
        SELF_C && SELF_B && PAIRSELF && hops > 0 && nonEmpty > 0 && cueHops > 0 && moved === mvK && badK === 0 && missK === 0 && mvK === D193_CTOAST_PIN,
        'toasts moved ' + moved + '/' + hops + ' hops (pin ' + D193_CTOAST_PIN + '), not a hold variant on a hand clamp pair ' + badK + ', hand clamp pairs without the hold ' + missK);
    }
    else ok(R.cTOAST, SELF_C && SELF_B && PAIRSELF && hops > 0 && nonEmpty > 0 && cueHops > 0 && moved === 0, 'toasts moved ' + moved + '/' + hops + ' hops');
  }
}
// ── c-UNINJ ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const setupNote = B ? '' : ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')';
  if(!B) ok(R.cUNINJ + setupNote, false);
  else {
    const F = ['unreach', 'steps', 'toasts', 'live', 'boot', 'chip', 'undoToast', 'undoSlot', 'undoSig', 'undoBoot'];
    let n = 0, moved = 0, liveMoved = 0, undos = 0, replays = 0; const mv = [], line = [];
    for(const ck of UNINJ_CK){ let m = 0, k = 0;
      for(const c of POP[ck]){ const a = RES.C[ck][c.id], b = RES.B[ck][c.id]; n++; k++;
        if(a.live !== a.preSig) liveMoved++; if(a.chip) undos++; if(a.boot !== a.preSig) replays++;
        const diff = F.filter(f => JSON.stringify(a[f]) !== JSON.stringify(b[f])); if(diff.length){ moved++; m++; mv.push({ c, diff }); } }
      line.push(ck + ' ' + m + '/' + k); }
    console.log('    c-UNINJ ' + line.join(', ') + ' | chains that moved the live card ' + liveMoved + ', undos taken ' + undos + ', boots that replayed a swap ' + replays);
    if(mv.length) console.log('    c-UNINJ moved fields: ' + fmt(tally(mv, m => m.diff.join('+'))));
    mv.slice(0, 3).forEach(m => console.log('      ' + tag(m.c) + ' fields ' + m.diff.join(',')));
    // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g227:454 c-UNINJ RE-KEY, class A-1; standing
    // rulings 2 and 4): at 231 and up HALF_MANNY's Tuesdays carry D195 Amendment 2's fourth item, so the pair against
    // V226 moves on manny's W3 tue and W5 tue chains only. Typed pins (the ruling's print, never this run): mario_noinj
    // 0 moved of 719; manny 144 moved of 677, every moved chain on W3 tue or W5 tue. Below 231 the row is unchanged.
    const V231_ERA = 231, UNINJ_PIN = { manny:{ n:677, moved:144 }, mario_noinj:{ n:719, moved:0 } }, UNINJ_DAYS = ['3|tue', '5|tue'];
    if(VER >= V231_ERA){
      const mvOf = ck => mv.filter(m => m.c.ck === ck), offDay = mv.filter(m => !UNINJ_DAYS.includes(m.c.w + '|' + m.c.d));
      const pinOK = UNINJ_CK.every(ck => POP[ck].length === UNINJ_PIN[ck].n && mvOf(ck).length === UNINJ_PIN[ck].moved);
      console.log('    c-UNINJ V231 (A-1): moved by chain day ' + fmt(tally(mv, m => m.c.ck + ' W' + m.c.w + ' ' + m.c.d)) + ' | moved off W3 tue / W5 tue ' + offDay.length + ' | typed pins ' + UNINJ_CK.map(ck => ck + ' ' + UNINJ_PIN[ck].moved + '/' + UNINJ_PIN[ck].n).join(', '));
      offDay.slice(0, 3).forEach(m => console.log('      off-day move: ' + tag(m.c) + ' fields ' + m.diff.join(',')));
      ok(R.cUNINJ + ' [V231 A-1: mario_noinj ' + UNINJ_PIN.mario_noinj.moved + ' of ' + UNINJ_PIN.mario_noinj.n + ', manny ' + UNINJ_PIN.manny.moved + ' of ' + UNINJ_PIN.manny.n + ', every move on W3 tue or W5 tue]',
        SELF_C && SELF_B && PAIRSELF && n > 0 && liveMoved > 0 && undos > 0 && replays > 0 && pinOK && offDay.length === 0 && moved === UNINJ_PIN.manny.moved + UNINJ_PIN.mario_noinj.moved,
        UNINJ_CK.map(ck => ck + ' moved ' + mvOf(ck).length + '/' + POP[ck].length).join(', ') + ', off W3 tue / W5 tue ' + offDay.length);
    }
    else ok(R.cUNINJ, SELF_C && SELF_B && PAIRSELF && n > 0 && liveMoved > 0 && undos > 0 && replays > 0 && moved === 0, 'moved ' + moved + '/' + n + ' chains (live, boot, toast, undo, undo-boot)');
  }
}
// ── c-DIGEST ──────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const setupNote = B ? '' : ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')';
  const DG = {};
  for(const T of TREES){ DG[T] = {}; for(const ck of Object.keys(CFGS)){
    const a = progDigest(fresh(T).buildProgram(clone(CFGS[ck]))), b = progDigest(fresh(T).buildProgram(clone(CFGS[ck]))); DG[T][ck] = a === b ? a : 'SELF-MISMATCH ' + a + '/' + b; } }
  Object.keys(CFGS).forEach(ck => console.log('    c-DIGEST ' + ck.padEnd(12) + ' now ' + DG.C[ck] + (B ? '  V' + BASE_ERA + ' ' + DG.B[ck] : '')));
  if(!B) ok(R.cDIGEST + setupNote, false);
  else {
    // V228 D193 R1 (split), class (i): at VER >= 228 the six injured configs are licensed to move by the cue word only and
    // read against measure's hand table (tests/measure/v228_cdigest.out.txt: V227 output with the word substituted, hashed
    // by the harness progDigest), never against this gate's own run; manny and mario_noinj still read against V226.
    // Below 228 the row is unchanged.
    const D193_DIGEST = { mario:'39679fdc5762f2b5', ankle_wa:'24fea086fe087454', hip_wa:'6c73687da203475a', lowback_wa:'d6e7e7178c37c073', shoulder_wa:'7cd72ca7e37a6f29', elbow_wa:'9a1b2079ac9cf7bd' };
    // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g227:474 c-DIGEST RE-KEY, class A-1; standing
    // rulings 2 and 5): at 231 and up manny wants the harness era row MANNY_DIGEST_BY_VERSION[VER] (2d35e8f743680cfa at
    // 231), never this run; an absent row wants the string ABSENT and fails the row by name. mario_noinj still wants V226.
    const V231_ERA = 231, MDV = H.MANNY_DIGEST_BY_VERSION || {};
    const mannyWant = (Object.prototype.hasOwnProperty.call(MDV, VER) && typeof MDV[VER] === 'string') ? MDV[VER] : 'ABSENT MANNY_DIGEST_BY_VERSION[' + VER + ']';
    const wantOf = ck => (VER >= V231_ERA && ck === 'manny') ? mannyWant : (VER >= 228 && Object.prototype.hasOwnProperty.call(D193_DIGEST, ck)) ? D193_DIGEST[ck] : DG.B[ck];
    if(VER >= 228) console.log('    c-DIGEST at ' + VER + ': ' + Object.keys(D193_DIGEST).map(ck => ck + ' want ' + D193_DIGEST[ck]).join(', ') + ' (D193 class (i), measure); ' + (VER >= V231_ERA ? 'manny wants MANNY_DIGEST_BY_VERSION[' + VER + '] ' + mannyWant + ' (V231 A-1, standing ruling 5; V' + BASE_ERA + ' reads ' + DG.B.manny + '), mario_noinj wants V' + BASE_ERA : 'manny, mario_noinj want V' + BASE_ERA));
    const eq = Object.keys(CFGS).filter(ck => !/SELF/.test(DG.C[ck]) && !/SELF/.test(DG.B[ck]) && DG.C[ck] === wantOf(ck)).length;
    ok(R.cDIGEST + (VER >= 228 ? ' (at 228 and above: the six injured against the D193 class (i) table)' : '') + (VER >= V231_ERA ? ' (at 231 and above: manny against MANNY_DIGEST_BY_VERSION[' + VER + '], V231 A-1)' : ''), eq === Object.keys(CFGS).length, eq + '/' + Object.keys(CFGS).length + ' configs equal'); }
}
// ── c-MANNY (standing ruling 5) ───────────────────────────────────────────────────────────────────────────────────
{
  const MD = H.MANNY_DIGEST_BY_VERSION || {};
  const has = Object.prototype.hasOwnProperty.call(MD, ERA) && typeof MD[ERA] === 'string', ref = has && MD[ERA] === MD[BASE_ERA];
  const row = MD[VER];
  const built = progDigest(load(ART).buildProgram(clone(fixtures.HALF_MANNY)));            // the harness way (real clock)
  const builtPin = progDigest(fresh('C').buildProgram(clone(fixtures.HALF_MANNY)));        // and with the gate's pinned clock
  console.log('    c-MANNY MANNY_DIGEST_BY_VERSION[' + ERA + '] ' + (has ? MD[ERA] : 'ABSENT') + ', [' + BASE_ERA + '] ' + MD[BASE_ERA] + ', [' + VER + '] ' + row + ' | HALF_MANNY built ' + built + ', pinned ' + builtPin);
  ok(R.cMANNY + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)'), has && ref && typeof row === 'string' && built === row && builtPin === row,
    '[' + ERA + ']' + (ref ? '===' : '!==') + '[' + BASE_ERA + '], HALF_MANNY ' + built + (built === row ? ' == ' : ' != ') + '[' + VER + ']');
}
done();
