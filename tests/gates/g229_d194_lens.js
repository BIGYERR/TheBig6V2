// g229_d194_lens.js — GATE for D194 P-INJLENS part 1 (V229): outside buildProgram the plan that governs a card is the
// plan of the day the card is on (R1), so the swap, aux and add sheets list only what that day's plan allows (R2(2));
// the build half of D193 reaches the athlete the app can actually build, an overlay athlete (row (o)); and the hold
// half (D193 slices 2 and 3) stays dormant on every overlay program, pinned to V229 so D194 part 2 must re-key it (q).
//
//   node tests/gates/g229_d194_lens.js <candidate.html> [baseline_V228.html]
//   IA_ASSUME_VERSION=229 node tests/gates/g229_d194_lens.js <tree stamped 228> [baseline_V228.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v229_rulings/d194_injlens_ruling.md. D194: R1 (the plan of the day), R2, R3,
// gate claims (o), (p) and (q), sabotage S23 to S26; Mario's decisions (D194 V229 SCOPE "Build half + sheet", D194
// QUEUE ORDER "Part 2 first"); Amendment 1 ((p) additions, (q) restated, S27); Amendment 2 (no change to these rows);
// the session note. Figures: tests/measure/v229_rulings/measure_overlay_injury_v228.md, measure_lens_cf4_m9.md and
// measure_slice3_cf5_m10.md. D-code D194, part 1 ships on ia-version 229. HALF_MANNY may not move (0ac7da6b1691a8e1,
// era row [229] = [228]); D193 (b) and the harness era table assert that, not this file.
//
// PRESENTATIONS. Since V98 the app's injury reaches a program only as an overlay (measure: 0 non-overlay writers of
// cfg.injury in 77 blobs). OV = the real path: an uninjured build of the config, stored with startDate 2026-08-24 and
// booted, then the app's own writer `_ovDraft.injRegion=…; _ovDraft.injTier=…; _ovDraft.from='2026-09-21';
// applyInjuryDraft()` (W5 Monday), read back from ia_programs and booted again. FIX = the fixture presentation the
// D190/D193 gates drive: the same cfg with `cfg.injury` stored, no overlay. Every VM pins the clock to 2026-09-24 12:00,
// every config pins cfg.seed 76308, and overlay `id`/`created` are stripped before two stored records are compared.
//
// ORACLES. Nothing below asks the candidate's engine what the answer should be.
//   REJECTED  the ruled definition measure used for the 1,451 figure: V228's `_swapInjuryOK(name, the config's fully
//             injured cfg)`, run in a separate judge VM booted from the BASELINE file (argv[3] reading 228, else the
//             V228 commit). It is never the candidate's own function; the candidate only decides which names it
//             lists. Beside it, the hand-independent conjunct: on every spliced (stamped) day the OV list equals the
//             FIX list on the same tree. And the judge is shown not blind on the same sweep: the pre-`from` W3 lists
//             (uninjured read) carry names it rejects.
//   TYPED     every other expected value is typed here, from the ruling's Before/After blocks and the measure
//             reports: the hand CAP table (D193 Amendment 1), a hand RPE parse, the cue shape, R7's held-test text,
//             the strength test text, the toast shape "<to> in, <from> out. Same job, same numbers.", the hold
//             sentence, the slot [3,1], the ruled counts and the named V228 cards.
//   TREE      "byte-identical to V228" compares the candidate's output with the BASELINE tree's output on the same
//             config, presentation and clock (tree to tree). Before any diff is read: each tree's stored OV record is
//             written twice in two fresh VMs and must equal itself, and two VMs booted on one record must list the same
//             sheets (non-empty).
//
// VERSION PREDICATE (standing rulings 2 and 4).
//   below 229   REFUSED: every row FAILS by name.
//   229         every row asserts.
//   230 and up  (o) and (p) assert. (q) is retired at 230 by D194 part 2 (Amendment 1 R3′), not inverted: past 229 it
//               prints one named `SKIP row q … retired at ia-version 230 by D194 part 2; delivery asserted by
//               g230_d194_lens2 d194-q′ and d194-eq` line, never PASS and never FAIL, on the live run and on the
//               no-baseline setup run alike (b-ONECLASS's V229 idiom, tests/gates/g228_d193_cueword.js: a column-0
//               REFUSED or a named FAIL would red gate.sh). What it pinned dormant is asserted delivered by
//               tests/gates/g230_d194_lens2.js rows d194-q′ (the typed hand routes) and d194-eq (overlay == fixture on
//               the D190 lattice); session form calls 3 and 7, tests/measure/v230_rulings/v230_session_calls.md. At 229
//               (q) asserts exactly as before.
//   231 and up  (tests/measure/v231_rulings/v231_absorb_ruling.md section 3; standing rulings 2 and 4) p-SWAP, p-AUX and
//               p-ADD SPLIT: they keep rejected 0, rows >= 1 rejected 0, OV == FIX on every stamped W5 row, every W5 row
//               stamped, W3 unstamped and the judge not blind, at the V231 row counts 4,608 / 1,814 / 1,440 (typed, the
//               ruling's print; V230 4,529 / 1,754 / 1,440). Their "pre-from W3 == V228" and "FIX W3+W5 == V228"
//               conjuncts and the row-set symmetry those two rest on (the candidate prints 5,202/5,460, 1,506/1,602,
//               1,344/1,440 and 8,595/9,174, 3,491/3,704, 2,691/2,880) assert at 230 and below only. The durable form
//               ("a FIX list differs from V228 only on a day whose built card differs from V228's") was probed and does
//               not hold on the candidate (61 FIX rows differ on V228-identical days, e.g. bodyweight lowback/workaround
//               W5 tue Single-leg hip thrust; V230 0), so the split is plain. p-UNSTAMPED SPLITS: it keeps Thursday-from, the
//               travel-only overlay and mario_noinj W3/W5 == V228 32/32 32/32; its HALF_MANNY W3/W5 == V228 conjunct
//               (the candidate prints 27/31, 26/30, the moved lists on the A-1 Tuesday card) asserts at 230 and below
//               only. At 231 and up each scoped conjunct prints one named SKIP line at column 0 naming the successors
//               g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d, never PASS and never
//               FAIL. Below 231 the four rows assert exactly as before.
//   Post-V233   the four rows' scoped "== V228" conjuncts, the row-set symmetry and their SKIP lines (V231 absorb
//               ruling, dark at 231 and up) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//   IA_ASSUME_VERSION=229 lifts a file stamped exactly 228 to 229 for a discrimination run; it is announced, ignored on
//   any other file, and gate.sh never sets it. On V228 that way every row FAILS at its V228 figure: (o) lowback 2 and
//   the W6 thu test text; p-SWAP 1,451 / 1,387; p-AUX 4,228 / 941; p-ADD 2,104 / 1,120; p-MARIO 2 of 223; p-UNSTAMPED
//   thu 2, fri 1, sat 3; p-BRIDGE 9 of 390; (q) on its fixture conjunct (V228 keeps no dose anywhere, so the dormant
//   machinery is absent, not dormant).
//   The baseline is argv[3] if it reads ia-version 228, else `git show <V228_COMMIT>:index.html` into os.tmpdir()
//   (tests/sabotage.py passes no argv[3]); the run prints which. No V228 tree makes every row FAIL setup by name.
//
// ROWS
//   o           Overlay reach of D193's build half, through the app's writer on an uninjured build: lowback/workaround
//               bodyweight W5 capped cards above RPE 7 = 0 (V228 2: tue Single-leg hip thrust, thu Squat (slow 3s
//               tempo), required on the baseline); mario knee/wa W5 capped above 7 = 0 with cue 1 on both trees; knee/wa
//               strength beginner commercial (6 weeks) W6 thu `Main — Barbell box squat` == R7's held-test text (V228
//               the test text, required on the baseline), W6 tue `Main — Barbell Romanian deadlift` == the test text on
//               both; every OV card == the FIX card on the same tree: mario W5 31/31, lowback bodyweight W5 30/30,
//               strength W6 33/33, every carded day stamped.
//   p-SWAP      L1 injured overlay slice (g221's L1, 288 injured of 384), W5 swap lists (swapCandidates tier1+tier2):
//               rejected names 0 (V228 1,451 of 39,117), cards offering >= 1 rejected 0 of 4,529 (V228 1,387), OV == FIX
//               on spliced days 4,529/4,529, every W5 card stamped; pre-`from` W3 OV lists == V228; FIX lists W3 and
//               W5 == V228 (the fallback is exact); judge not blind on W3.
//   p-AUX       the same for auxSwapCandidates (the _powerAllowed site too): 0 (V228 4,228 of 21,856), cards 0 of 1,754
//               (V228 941), OV == FIX 1,754/1,754; W3 and FIX identity as above.
//   p-ADD       the same for addCandidates (gap+more+off per day): 0 (V228 2,104 of 19,380), day pickers 0 of 1,440
//               (V228 1,120), OV == FIX 1,440/1,440; W3 and FIX identity as above.
//   p-MARIO     mario knee/wa OV W5: swap 0 of 222 on 22 cards, aux 0 of 66, add 0 of 79, OV == FIX 32/32, W3 == V228
//               32/32; the baseline names the V228 cards: swap 2 of 223 (tue Sumo deadlift: Jump squats; thu Barbell box
//               squat: Jump squats), aux 2 of 68 (sat Mountain climbers: Burpees, High knees), add 5 of 79.
//               activeProg.cfg.injury null, W5 thu stamped with the knee/workaround patch, W3 thu unstamped.
//   p-UNSTAMPED a day the plan does not stamp keeps V228's lists, a stamped day loses the rejected names: `from`
//               2026-09-24 (Thursday): mon, tue, wed unstamped and == V228 (mon 6/6, tue 7/7; tue keeps Sumo deadlift:
//               Jump squats, 2 of 77), thu, fri, sat stamped and 0 rejected (V228 2 of 56, 1 of 101, 3 of 55); a
//               travel-only overlay (minimal, 09-22 to 09-24, on mario_noinj): stamped tue and thu, W5 == V228 32/32;
//               uninjured HALF_MANNY W3 30/30, W5 29/29 and mario_noinj W3 32/32, W5 32/32 == V228.
//   p-BRIDGE    imBackFromInjury on the mario overlay: bridge days (W5 thu to W6 tue) 0 rejected under knee/workaround
//               (V228 9 of 390); halfstep days (W6 thu to sat) == V228's uninjured read 19/19.
//   q           Dormancy pin, VER === 229. On the mario OV program, W5 thu [3,1] Single-leg hip thrust, the hand routes
//               of Amendment 1 (U1, U2, RB, with RB carried to undo and undo+boot as D194 finding 2's chain): every hop,
//               reboot slot, boot, undo, undo+boot and direct line prints "2×6–10 @ RPE 8", `_preHold` none, the three
//               toasts "… Same job, same numbers.", no `ph` in the record, no `_preHold` anywhere in a booted program,
//               and every line and the undone day == V228's (the V228 routes are run twice and must equal themselves). On a FIXED-SEED SAMPLE of overlay chains (not the D190
//               lattice's 13,323 W5 + 5,257 W3, too slow for a gate; see SAMPLE): live, toast, boot, undo and
//               undo+boot == V228's on every chain, kept dose 0, `ph` 0, hold toasts 0, `_preHold` on any booted or
//               undone item 0. Not blind: the same routes on the FIX presentation print Amendment 1's After block (U2
//               hop1 Leg extension "2×6–10 @ RPE 7" with `_preHold` "2×6–10 @ RPE 8" and the hold sentence; U2 undo
//               restores both; RB reboot slot keeps "2×6–10 @ RPE 8"; RB live == boot == direct "2×6–10 @ RPE 8"), and
//               the sample's W5 chains on the FIX presentation keep a dose and print the hold sentence (> 0 each). V228
//               keeps no dose anywhere, so (q) FAILS there on that conjunct.
//
// SAMPLE (q). Chains are drawn on the BASELINE tree, so the population is the same whichever tree is the candidate:
//   the seven D190 configs (mario knee/wa, knee/protect, ankle, hip, lowback, shoulder, elbow at workaround), W5 from
//   the FIX sheet (== the candidate's OV sheet on spliced days, row p) and W3 from the OV sheet (the uninjured grid an
//   overlay program shows before `from`). Every swappable patterned slot of every training day; per slot, a PRNG seeded
//   229194 with the slot's key draws up to 3 distinct H (each gives hop1 A>H, cyc2 A>H>A when H's sheet offers A, and
//   hop2 A>H>X) and up to 3 distinct Y (each gives hop3 A>Y>H'>Z), where H and H' are held under the config's plan by
//   the hand CAP table and every hop is on the sheet of the card before it.
//   One chain per day per batch, as measure ran the lattice; `_preHold` is counted over the whole booted or undone
//   program per batch. At V229 the draw is 1,159 chains (W5 568, W3 591); denominators print.
//
// RUNTIME. The L1 sweep and the chain sample run in 4 worker processes (fixed; no environment knob); each prints one
//   result line on stdout and writes no file. A worker that dies fails the rows it owed, by name.
//
// SABOTAGE THIS FILE IS MEANT TO CATCH (scratch copies, each anchor count==1; trips as printed by builder at V229):
//   S23  _dayPlanCfg returns prog.cfg regardless of the day: p-SWAP 1,451 of 39,117 / 1,387, p-AUX 4,228 / 941, p-ADD
//        2,104 / 1,120, p-MARIO swap 2 of 223, p-UNSTAMPED thu/fri/sat 2/1/3, p-BRIDGE 9 of 390. o and q stay green.
//   S24a swapCandidates left on prog.cfg: p-SWAP 1,451 / 1,387, p-MARIO swap 2 of 223, p-UNSTAMPED, p-BRIDGE.
//   S24b auxSwapCandidates left on prog.cfg: p-AUX 4,228 / 941, p-MARIO aux 2 of 68, p-UNSTAMPED, p-BRIDGE.
//   S24c addCandidates left on prog.cfg: p-ADD 2,104 / 1,120, p-MARIO add 5 of 79, p-UNSTAMPED, p-BRIDGE.
//   S25  the tap guard and its filter cfg read the lens (premature activation): q only (U2 hop1 Leg extension holds at
//        RPE 7 with the hold toast on the overlay program; the sample moves on every W5 chain).
//   S26  the lens reads the week's Monday stamp instead of the day's: p-UNSTAMPED (Thursday-from thu/fri/sat back to
//        2/1/3) and p-BRIDGE (halfstep days read the bridge patch, 14/19).
//   S27  the boot keep is written outside the prog.cfg.injury guard: q only (every booted overlay program in the
//        sample carries `_preHold`; the hand route's reboot slot keeps a dose).
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load, fixtures } = H;

const ROOT = path.join(__dirname, '..', '..');
const ERA = 229, BASE_ERA = 228;
const V228_COMMIT = '2c1a89c85fc5c3193b8646a49fe94eed3f221fb1';   // V228: D193 R1/R4 + D192 (the V228 artifact, forever)
const SHARDS = 4, MARK = '__G229_RESULT__';
const IS_WORKER = process.argv.includes('--worker');
const POS = process.argv.slice(2).filter(a => a !== '--worker');
const ART = POS[0] || path.join(ROOT, 'index.html');
const BASEFILE = POS[1] || null;

// ── TYPED ORACLE ─────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24', FROM = '2026-09-21', FROM_THU = '2026-09-24';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const CUE = / — hold RPE 7, (two|three) in the tank$/;
const R7T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TESTT = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const KNEE_STAMP = '["injury",{"injury":{"region":"knee","tier":"workaround"}}]';
const CAP = { knee:{ workaround:['squat', 'lunge', 'leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat', 'lunge'], protect:['squat'] },
  hip:{ workaround:['hinge', 'lunge', 'hip_ext', 'squat'], protect:['squat'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'], protect:['squat', 'hip_ext'] },
  shoulder:{ workaround:['hpress', 'vpress', 'delt_iso'], protect:[] }, elbow:{ workaround:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect:['row', 'vpull'] } };
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const W = {   // the ruled figures (V229 expected; V228 where the row requires the baseline to show the defect)
  o:{ lowbackBase:['tue Single-leg hip thrust', 'thu Squat (slow 3s tempo)'], same:{ mario:31, lowback_bw:30, strength6:33 }, marioCue:1, weeks:6,
    thuLabel:'Main — Barbell box squat', tueLabel:'Main — Barbell Romanian deadlift' },
  L1:{ cfgs:288, pat:4529, aux:1754, add:1440, v228:{ pat:'1,451 of 39,117, cards 1,387', aux:'4,228 of 21,856, cards 941', add:'2,104 of 19,380, pickers 1,120' } },
  mario:{ patCards:22, pat:222, aux:66, add:79, addDays:5, eq:32, w3:32,
    base:{ pat:[2, 223, ['tue Sumo deadlift: Jump squats', 'thu Barbell box squat: Jump squats']], aux:[2, 68, ['sat Mountain climbers: Burpees, High knees']], add:[5, 79] } },
  thu:{ base:{ thu:[2, 56], fri:[1, 101], sat:[3, 55] }, tue:[2, 77, ['tue Sumo deadlift: Jump squats', 'tue (add): g:Jump squats']], same:{ mon:6, tue:7 } },
  travel:32, noinj:{ w3:32, w5:32 }, bridge:{ base:[9, 390] }, halfstep:19,
};
// V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, p-SWAP / p-AUX / p-ADD SPLIT): the W5 row counts the
// kept conjuncts read at 231 and up (typed, the ruling's print; V230 reads W.L1).
const V231_ERA = 231, W231 = { pat:4608, aux:1814, add:1440 };

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const clone = x => JSON.parse(JSON.stringify(x));
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = (inj, extra) => { const c = Object.assign(clone(MARIO), extra || {}); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }),
  hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }),
  elbow_wa:withInj({ region:'elbow', tier:'workaround' }), lowback_bw:withInj({ region:'lowback', tier:'workaround' }, { equipment:'bodyweight' }),
  strength6:withInj({ region:'knee', tier:'workaround' }, { liftingFocus:'strength' }), mario_noinj:withInj(null), manny:clone(fixtures.HALF_MANNY) };
if(typeof CFGS.manny.seed !== 'number') CFGS.manny.seed = 76308;
// L1: g221_d177_swapfloor.js's lite lattice, verbatim (measure's gate_rows_V227.json.l1 is this list, 384 configs)
function mk(t, f, x, g, i, seed){
  const race = !!g.id && /half/.test(g.id);
  return { name:'M', primaryPath:g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes:g.id ? ['run'] : [],
    cardioGoals:g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted:race, raceDate:race ? '2026-12-06' : null, liftingFocus:f, experience:x, ageBracket:'18-35', equipment:t, unit:'lbs',
    restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench:135, squat:155, deadlift:185, seed, ...(i.v ? { injury:i.v } : {}) };
}
const LO = { k:'liftonly', id:null }, HALF = { k:'half', id:'run_half' };
const INJ = (r, t) => ({ k:r + '/' + t, v:{ region:r, tier:t } }), HEALTHY = { k:'healthy', v:null };
const L1 = [];
for(const t of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal']) for(const f of ['support_prevention', 'support_strength', 'hypertrophy', 'strength'])
  for(const x of ['beginner', 'advanced']) for(const g of [LO, HALF]) for(const i of [HEALTHY, INJ('knee', 'workaround'), INJ('lowback', 'workaround'), INJ('shoulder', 'protect')]) L1.push(mk(t, f, x, g, i, 76308));
const L1INJ = L1.map((c, i) => i).filter(i => L1[i].injury);

// ── VM PLUMBING (shared by the parent and the workers) ───────────────────────────────────────────────────────────
function pin(IA, off){ const T = new Date(CLOCK + 'T12:00:00').getTime() + (off || 0); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};popFire=function(){};try{closeRestSheet=function(){};}catch(e){}"
  + "globalThis.__dayLists=function(w,d){var day=activeProg.weeks[w]&&activeProg.weeks[w][d];var out=[];if(!day||day.rest||!day.sections)return {stamp:null,rows:out};day.sections.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var p=_pattern(it.name);if(p){var c=swapCandidates(it.name,day,w,activeProg);out.push({si:si,ii:ii,n:it.name,k:'pat',L:c.tier1.concat(c.tier2)});}else if(_auxFamily(it.name)){out.push({si:si,ii:ii,n:it.name,k:'aux',L:auxSwapCandidates(it.name,day,activeProg).slice()});}});});var a=addCandidates(day,w,activeProg);out.push({si:-1,ii:-1,n:'(add)',k:'add',L:[].concat(a.gap.map(function(x){return 'g:'+x;}),a.more.map(function(x){return 'm:'+x;}),a.off.map(function(x){return 'o:'+x;}))});return {stamp:day._ovKey?JSON.stringify(day._ovKey):null,rows:out};};"
  + "globalThis.__weekLists=function(w){var o={};['mon','tue','wed','thu','fri','sat','sun'].forEach(function(d){o[d]=__dayLists(w,d);});return JSON.stringify(o);};"
  + "globalThis.__judge=function(names,cfg){return names.filter(function(n){return !_swapInjuryOK(n,cfg);});};";
function fresh(file, off){ const X = load(file); pin(X, off); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
const stripClock = j => { const o = JSON.parse(j); (o.overlays || []).forEach(v => { delete v.id; delete v.created; }); return JSON.stringify(o); };
// the stored record: FIX = cfg.injury stored; OV = uninjured build stored, booted, then the app's own writer
function stored(X, cfg, pres, from){
  const base = clone(cfg); delete base.injury; const c = pres === 'CFG' ? clone(cfg) : base;
  const p = X.buildProgram(clone(c)); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(c) }); let j = JSON.stringify(s);
  if(pres === 'OV' && cfg.injury){ setup(X, j);
    E(X, '_ovDraft.injRegion=' + JSON.stringify(cfg.injury.region) + ';_ovDraft.injTier=' + JSON.stringify(cfg.injury.tier) + ";_ovDraft.from='" + (from || FROM) + "';applyInjuryDraft();");
    j = JSON.stringify(JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM')); }
  return j; }
const weekLists = (IA, w) => JSON.parse(E(IA, '__weekLists(' + w + ')'));
const rowKey = (d, r) => d + '|' + r.k + '|' + r.si + '_' + r.ii + '|' + r.n;
// the judge: V228's _swapInjuryOK on the fully injured cfg, in its own VM on the baseline file, memoised by name and plan
function judgeMk(file){ const J = fresh(file); const memo = new Map();
  return (names, cfg) => { const key = JSON.stringify(cfg.injury || null) + '|' + cfg.equipment + '|' + cfg.experience + '|' + cfg.ageBracket; const out = [];
    names.forEach(n0 => { const n = String(n0).replace(/^[gmo]:/, ''); const mk_ = key + '|' + n;
      if(!memo.has(mk_)){ J.ctx.__nn = [n]; J.ctx.__cc = cfg; memo.set(mk_, Array.from(E(J, '__judge(__nn,__cc)')).length > 0); }
      if(memo.get(mk_)) out.push(n0); }); return out; }; }

// ── WORKER: the L1 sweep and the chain sample ────────────────────────────────────────────────────────────────────
function workerMain(){
  const spec = JSON.parse(fs.readFileSync(0, 'utf8'));
  const C = fresh(spec.art), B = fresh(spec.base), judge = judgeMk(spec.base);
  const res = { ok:true, l1:[] };
  for(const ci of spec.l1){ const cfg = L1[ci];
    const sCO = stored(C, cfg, 'OV'), sCF = stored(C, cfg, 'CFG'), sBO = stored(B, cfg, 'OV'), sBF = stored(B, cfg, 'CFG');
    setup(C, sCO); const o5 = weekLists(C, 5), o3 = weekLists(C, 3);
    setup(C, sCF); const f5 = weekLists(C, 5), f3 = weekLists(C, 3);
    setup(B, sBO); const b3 = weekLists(B, 3);
    setup(B, sBF); const bf5 = weekLists(B, 5), bf3 = weekLists(B, 3);
    const K = {}; ['pat', 'aux', 'add'].forEach(k => { K[k] = { n5:0, st5:0, offers:0, rej:0, cards:0, eqFix:0, fixMiss:0, longer:0, n3:0, eq3:0, st3:0, rej3:0, nf:0, eqf:0, ex:[], reg:{} }; });
    const map = WL => { const m = new Map(); DAYS.forEach(d => WL[d].rows.forEach(r => m.set(rowKey(d, r), JSON.stringify(r.L)))); return m; };
    const mf5 = map(f5), mb3 = map(b3), mbf5 = map(bf5), mbf3 = map(bf3);
    DAYS.forEach(d => o5[d].rows.forEach(r => { const x = K[r.k]; const k = rowKey(d, r); x.n5++; const stp = !!o5[d].stamp; if(stp) x.st5++;
      x.offers += r.L.length; const rj = judge(r.L, cfg); x.rej += rj.length;
      if(rj.length){ x.cards++; const rg = cfg.injury.region + '/' + cfg.injury.tier; x.reg[rg] = (x.reg[rg] || 0) + 1; if(x.ex.length < 2) x.ex.push('L1#' + ci + ' ' + rg + ' ' + cfg.equipment + ' W5 ' + d + ' ' + clean(r.n) + ': ' + rj.join(', ')); }
      if(stp){ if(!mf5.has(k)) x.fixMiss++; else if(mf5.get(k) === JSON.stringify(r.L)) x.eqFix++; else if(r.L.length > JSON.parse(mf5.get(k)).length) x.longer++; } }));
    DAYS.forEach(d => o3[d].rows.forEach(r => { const x = K[r.k]; x.n3++; if(o3[d].stamp) x.st3++; if(mb3.get(rowKey(d, r)) === JSON.stringify(r.L)) x.eq3++; x.rej3 += judge(r.L, cfg).length; }));
    [[f5, mbf5], [f3, mbf3]].forEach(([WL, M]) => DAYS.forEach(d => WL[d].rows.forEach(r => { const x = K[r.k]; x.nf++; if(M.get(rowKey(d, r)) === JSON.stringify(r.L)) x.eqf++; })));
    // the row-set symmetry (the p-SWAP/p-AUX/p-ADD "== V228" conjuncts rested on it) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
    res.l1.push({ ci, K });
  }
  process.stdout.write(MARK + JSON.stringify(res) + '\n');
}
if(IS_WORKER){ try { workerMain(); } catch(e){ process.stdout.write(MARK + JSON.stringify({ ok:false, err:String(e && e.stack || e).slice(0, 600) }) + '\n'); } }
else parentMain();

// ── PARENT ───────────────────────────────────────────────────────────────────────────────────────────────────────
function parentMain(){
const t0 = Date.now();
// ROW IDS (post-V233 V5; CLAUDE.md Proof scope, Row manifest): every row prints its one status line through the
// shared helper tests/status.js. Ids: d194-<the row's name> (D194's gate claims), declared from ORDER below; the parent prints, workers return data.
// A row's label is its R text without the `row <name>` prefix (the id carries the name); a PASS keeps the figures in
// parentheses, a FAIL prints them as its detail. A boot failure, REFUSED or a setup failure FAILS every row by name.
const STAT = require('../status')('g229_d194_lens');
const ID = { o:'d194-o', pSWAP:'d194-p-SWAP', pAUX:'d194-p-AUX', pADD:'d194-p-ADD', pMAR:'d194-p-MARIO', pUNS:'d194-p-UNSTAMPED', pBRI:'d194-p-BRIDGE' };
const lab = l => String(l).replace(/^row \S+ +/, '');
const ok = (k, l, c, g) => c ? STAT.pass(ID[k], lab(l) + (g === undefined ? '' : ' (' + g + ')')) : STAT.fail(ID[k], lab(l), g === undefined ? '' : 'got ' + g);
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); STAT.summary(); };
const P = s => console.log(s);
const R = {
  o:     'row o           D193 build half on the overlay path (applyInjuryDraft on an uninjured build): lowback/wa bodyweight W5 capped cards above RPE 7 = 0 (V228 2), mario W5 0 with cue 1, strength W6 thu Main == R7 text (V228 the test), W6 tue RDL == the test; OV cards == FIX cards 31/31, 30/30, 33/33',
  pSWAP: 'row p-SWAP      L1 overlay W5 swap lists: rejected names 0 (V228 ' + W.L1.v228.pat + ' of 4,529), OV == FIX on spliced days 4,529/4,529',
  pAUX:  'row p-AUX       L1 overlay W5 aux lists (incl. _powerAllowed): rejected 0 (V228 ' + W.L1.v228.aux + ' of 1,754), OV == FIX 1,754/1,754',
  pADD:  'row p-ADD       L1 overlay W5 add pickers: rejected 0 (V228 ' + W.L1.v228.add + ' of 1,440), OV == FIX 1,440/1,440',
  pMAR:  'row p-MARIO     mario knee/wa overlay W5: swap 0 of 222 (V228 2 of 223: tue Sumo deadlift and thu Barbell box squat offer Jump squats), aux 0 of 66 (V228 2 of 68), add 0 of 79 (V228 5 of 79); OV == FIX 32/32',
  pUNS:  'row p-UNSTAMPED Thursday-from: mon to wed unstamped and == V228, thu to sat 0 rejected (V228 2 / 1 / 3); travel-only overlay W5 == V228; mario_noinj W3/W5 lists == V228',
  pBRI:  'row p-BRIDGE    imBackFromInjury: bridge days legal under knee/workaround, 0 rejected (V228 9 of 390); halfstep days == the uninjured read 19/19',
};
const ORDER = ['o', 'pSWAP', 'pAUX', 'pADD', 'pMAR', 'pUNS', 'pBRI'];
STAT.declare(ORDER.map(k => ID[k]));   // an ORDER key with no id throws: no summary, red

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ ORDER.forEach(k => ok(k, R[k] + ' (boot: ' + e.message + ')', false)); done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; P('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else P('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
P('g229 D194 P-INJLENS part 1 (lens, overlay reach, dormancy pin) | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
if(!(VER >= ERA)){
  P('REFUSED: ia-version ' + VER + ' predates D194 P-INJLENS part 1 (V' + ERA + '). No row may pass on it.');
  ORDER.forEach(k => ok(k, R[k] + ' (REFUSED)', false));
  done();
}
let FILES = { C:ART, B:null }, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!FILES.B){
  const f = path.join(os.tmpdir(), 'g229_d194_lens_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V228_COMMIT + ':index.html'], { maxBuffer:1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ FILES.B = f; baseWhy += 'git show ' + V228_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
P('  V' + BASE_ERA + ' baseline: ' + (FILES.B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
// q (D194 part 1's dormancy pin on every overlay program, era 229; Amendment 1 R3′) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
if(!FILES.B){ ORDER.forEach(k => { ok(k, R[k] + ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')', false); }); done(); }
const CF = FILES.C, BF = FILES.B;
const RES = {};   // row -> [cond, got]
const guard = (k, fn) => { try { fn(); } catch(e){ RES[k] = [false, 'crash: ' + String(e && e.message || e).slice(0, 160)]; P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); } };

// ── SELF-CHECK: each tree's stored OV record equals itself; two VMs on one record list the same sheets ────────────
let SELF = true;
for(const [tag, f] of [['candidate', CF], ['V228', BF]]){
  const a = stored(fresh(f), CFGS.mario, 'OV'), b = stored(fresh(f), CFGS.mario, 'OV'); const X = fresh(f), Y = fresh(f); setup(X, a); setup(Y, a);
  const la = JSON.stringify([weekLists(X, 3), weekLists(X, 5)]), lb = JSON.stringify([weekLists(Y, 3), weekLists(Y, 5)]);
  const s = stripClock(a) === stripClock(b) && a === b && la === lb && la.length > 1000; if(!s) SELF = false;
  P('  SELFCHECK ' + tag + ': two OV writes equal (pinned clock, raw) ' + (a === b) + ', stripped ' + (stripClock(a) === stripClock(b)) + ' (' + a.length + ' bytes) | two VMs, same record, W3+W5 lists equal ' + (la === lb) + ' (' + la.length + ' bytes)');
}

// q's chain sample retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). pat() stays: row o reads it.
const PX = fresh(BF); const patMemo = {}; const pat = n => (n in patMemo) ? patMemo[n] : (patMemo[n] = PX.eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-');

// ── WORKERS ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const shards = Array.from({ length:SHARDS }, () => ({ art:CF, base:BF, l1:[] }));
L1INJ.forEach((ci, i) => shards[i % SHARDS].l1.push(ci));
const tW = Date.now();
const WORK = shards.map((spec, i) => new Promise(res => { let out = '', err = '';
  const ch = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename, '--worker'], { stdio:['pipe', 'pipe', 'pipe'] });
  ch.stdout.setEncoding('utf8'); ch.stderr.setEncoding('utf8');   // a multi-byte character split across two chunks decodes whole
  ch.stdout.on('data', d => { out += d; }); ch.stderr.on('data', d => { err += d; });
  ch.on('error', e => { err += String(e && e.message || e); }); ch.on('close', code => {
    const line = out.split('\n').find(l => l.startsWith(MARK)); let j = null; try { j = line ? JSON.parse(line.slice(MARK.length)) : null; } catch(e){}
    if(!j || j.ok !== true) P('  worker ' + i + ' unusable (exit ' + code + ')' + (j && j.err ? ': ' + j.err : '') + (err ? ' | stderr ' + err.slice(-400).trim() : ''));
    res(j && j.ok === true ? j : null); });
  ch.stdin.end(JSON.stringify(spec)); }));

// ── SINGLES (parent, while the workers run) ─────────────────────────────────────────────────────────────────────────
const judge = judgeMk(BF);
const progVM = (f, ck, pres, from) => { const X = fresh(f); setup(X, stored(X, CFGS[ck], pres, from)); return X; };
function rejSum(WL, cfg, kinds, days){ let n = 0, offers = 0, rej = 0, cards = 0; const ex = [];
  (days || DAYS).forEach(d => WL[d].rows.filter(r => kinds.includes(r.k)).forEach(r => { n++; offers += r.L.length; const j = judge(r.L, cfg); rej += j.length; if(j.length){ cards++; ex.push(d + ' ' + clean(r.n) + ': ' + j.join(', ')); } }));
  return { n, offers, rej, cards, ex }; }
function eqL(A, B, days){ let n = 0, eq = 0, nb = 0; const ex = []; (days || DAYS).forEach(d => { const m = new Map(B[d].rows.map(r => [rowKey(d, r), JSON.stringify(r.L)])); nb += B[d].rows.length;
  A[d].rows.forEach(r => { n++; if(m.get(rowKey(d, r)) === JSON.stringify(r.L)) eq++; else if(ex.length < 2) ex.push(d + ' ' + clean(r.n) + ' [' + r.k + ']'); }); });
  return { n, eq, nb, all:n > 0 && eq === n && nb === n, ex }; }
const items = (X, w) => { const wk = JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[' + w + '])')); const o = [];
  DAYS.forEach(d => ((wk[d] && wk[d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name) o.push({ d, si, ii, n:clean(it.name), det:it.detail || '' }); }))); return { o, stamped:DAYS.filter(d => wk[d] && wk[d].sections && wk[d].sections.length && wk[d]._ovKey).length, carded:DAYS.filter(d => wk[d] && wk[d].sections && wk[d].sections.length).length }; };
const sameCards = (a, b) => a.filter((i, k) => b[k] && b[k].n === i.n && b[k].det === i.det).length;

// (o) build half on the overlay path
guard('o', () => { const out = {}, lines = [];
  for(const [tag, f] of [['C', CF], ['B', BF]]){ out[tag] = {};
    for(const ck of ['lowback_bw', 'mario']){ const cap = CAP[CFGS[ck].injury.region][CFGS[ck].injury.tier];
      const a = items(progVM(f, ck, 'OV'), 5), b = items(progVM(f, ck, 'CFG'), 5);
      const hi = a.o.filter(i => cap.includes(pat(i.n)) && rpeMax(i.det) > 7).map(i => i.d + ' ' + i.n);
      out[tag][ck] = { hi, cue:a.o.filter(i => CUE.test(i.det)).length, same:sameCards(a.o, b.o), n:a.o.length, nb:b.o.length, stamped:a.stamped, carded:a.carded };
      lines.push(tag + ' ' + ck + ' W5 cards ' + a.o.length + ' | capped above RPE 7 ' + hi.length + (hi.length ? ' (' + hi.join('; ') + ')' : '') + ' | cue ' + out[tag][ck].cue + ' | OV == FIX ' + out[tag][ck].same + '/' + Math.max(a.o.length, b.o.length) + ' | stamped days ' + a.stamped + '/' + a.carded); }
    const X = progVM(f, 'strength6', 'OV'), Y = progVM(f, 'strength6', 'CFG');
    const m = d => JSON.parse(E(X, "JSON.stringify((function(){var s=activeProg.weeks[6]&&activeProg.weeks[6]." + d + "&&activeProg.weeks[6]." + d + ".sections[0];var it=s&&s.items[0];return {l:s&&s.label,d:it&&it.detail};})())"));
    const a6 = items(X, 6), b6 = items(Y, 6);
    out[tag].s6 = { weeks:+E(X, 'activeProg.totalWeeks'), thu:m('thu'), tue:m('tue'), same:sameCards(a6.o, b6.o), n:a6.o.length, nb:b6.o.length, stamped:a6.stamped, carded:a6.carded };
    const s6 = out[tag].s6; lines.push(tag + ' strength6 weeks ' + s6.weeks + ' | W6 thu ' + JSON.stringify(clean(s6.thu.l)) + ' == R7 ' + (s6.thu.d === R7T) + ', == TEST ' + (s6.thu.d === TESTT) + ' | W6 tue ' + JSON.stringify(clean(s6.tue.l)) + ' == TEST ' + (s6.tue.d === TESTT) + ' | OV == FIX ' + s6.same + '/' + Math.max(s6.n, s6.nb) + ' | stamped days ' + s6.stamped + '/' + s6.carded); }
  lines.forEach(l => P('    o ' + l));
  const c = out.C, b = out.B, s6c = c.s6, s6b = b.s6;
  const okC = c.lowback_bw.hi.length === 0 && c.mario.hi.length === 0 && c.mario.cue === W.o.marioCue
    && c.mario.same === W.o.same.mario && c.mario.n === W.o.same.mario && c.mario.nb === W.o.same.mario
    && c.lowback_bw.same === W.o.same.lowback_bw && c.lowback_bw.n === W.o.same.lowback_bw && c.lowback_bw.nb === W.o.same.lowback_bw
    && s6c.same === W.o.same.strength6 && s6c.n === W.o.same.strength6 && s6c.nb === W.o.same.strength6
    && c.mario.stamped === c.mario.carded && c.lowback_bw.stamped === c.lowback_bw.carded && s6c.stamped === s6c.carded
    && s6c.weeks === W.o.weeks && clean(s6c.thu.l) === W.o.thuLabel && s6c.thu.d === R7T && clean(s6c.tue.l) === W.o.tueLabel && s6c.tue.d === TESTT;
  const okB = JSON.stringify(b.lowback_bw.hi) === JSON.stringify(W.o.lowbackBase) && b.mario.hi.length === 0 && b.mario.cue === W.o.marioCue
    && s6b.thu.d === TESTT && s6b.tue.d === TESTT && s6b.same === W.o.same.strength6 && b.mario.same === W.o.same.mario && b.lowback_bw.same === W.o.same.lowback_bw;
  RES.o = [SELF && okC && okB, 'lowback capped above 7 ' + c.lowback_bw.hi.length + ' (V228 ' + b.lowback_bw.hi.length + '), mario ' + c.mario.hi.length + ' cue ' + c.mario.cue + ', W6 thu ' + (s6c.thu.d === R7T ? 'R7' : s6c.thu.d === TESTT ? 'TEST' : 'other') + ', W6 tue ' + (s6c.tue.d === TESTT ? 'TEST' : 'other') + ', OV == FIX ' + c.mario.same + '/' + c.lowback_bw.same + '/' + s6c.same + (okB ? '' : '; BASELINE not as ruled') + (SELF ? '' : '; SELFCHECK failed')];
});

// (p) mario knee/wa overlay W5 + presentation facts
guard('pMAR', () => { const KN = CFGS.mario; const r = {};
  for(const [tag, f] of [['C', CF], ['B', BF]]){ const X = progVM(f, 'mario', 'OV'), Y = progVM(f, 'mario', 'CFG');
    r[tag] = { o5:weekLists(X, 5), o3:weekLists(X, 3), f5:weekLists(Y, 5), inj:E(X, 'JSON.stringify(activeProg.cfg.injury||null)'),
      st5:E(X, 'activeProg.weeks[5].thu._ovKey||null'), st3:E(X, 'activeProg.weeks[3].thu._ovKey||null') }; }
  const S = t => ({ pat:rejSum(r[t].o5, KN, ['pat']), aux:rejSum(r[t].o5, KN, ['aux']), add:rejSum(r[t].o5, KN, ['add']) });
  const c = S('C'), b = S('B'); const eqF = eqL(r.C.o5, r.C.f5), eq3 = eqL(r.C.o3, r.B.o3);
  ['C', 'B'].forEach(t => { const s = t === 'C' ? c : b; P('    p-MARIO ' + t + ' cfg.injury ' + r[t].inj + ' | W5 thu _ovKey ' + r[t].st5 + ' | W3 thu _ovKey ' + r[t].st3 + ' | swap ' + s.pat.rej + ' of ' + s.pat.offers + ' (' + s.pat.n + ' cards)' + (s.pat.ex.length ? ' [' + s.pat.ex.join('; ') + ']' : '') + ' | aux ' + s.aux.rej + ' of ' + s.aux.offers + (s.aux.ex.length ? ' [' + s.aux.ex.join('; ') + ']' : '') + ' | add ' + s.add.rej + ' of ' + s.add.offers + ' (' + s.add.n + ' days)'); });
  P('    p-MARIO candidate OV == FIX W5 ' + eqF.eq + '/' + eqF.n + ' | W3 OV == V228 ' + eq3.eq + '/' + eq3.n);
  const pres = r.C.inj === 'null' && r.C.st5 === KNEE_STAMP && r.C.st3 === null;
  const okC = c.pat.rej === 0 && c.pat.n === W.mario.patCards && c.pat.offers === W.mario.pat && c.aux.rej === 0 && c.aux.offers === W.mario.aux
    && c.add.rej === 0 && c.add.offers === W.mario.add && c.add.n === W.mario.addDays && eqF.all && eqF.n === W.mario.eq && eq3.all && eq3.n === W.mario.w3;
  const okB = b.pat.rej === W.mario.base.pat[0] && b.pat.offers === W.mario.base.pat[1] && JSON.stringify(b.pat.ex) === JSON.stringify(W.mario.base.pat[2])
    && b.aux.rej === W.mario.base.aux[0] && b.aux.offers === W.mario.base.aux[1] && JSON.stringify(b.aux.ex) === JSON.stringify(W.mario.base.aux[2])
    && b.add.rej === W.mario.base.add[0] && b.add.offers === W.mario.base.add[1];
  RES.pMAR = [SELF && pres && okC && okB, 'swap ' + c.pat.rej + ' of ' + c.pat.offers + (c.pat.ex.length ? ' [' + c.pat.ex.join('; ') + ']' : '') + ', aux ' + c.aux.rej + ' of ' + c.aux.offers + ', add ' + c.add.rej + ' of ' + c.add.offers + ', OV == FIX ' + eqF.eq + '/' + eqF.n + (pres ? '' : '; presentation not the overlay path') + (okB ? '' : '; BASELINE not as ruled')];
});

// (p) unstamped days: Thursday-from, travel-only, uninjured
guard('pUNS', () => { const KN = CFGS.mario; const T = {}, lines = [];
  for(const [tag, f] of [['C', CF], ['B', BF]]){ const X = progVM(f, 'mario', 'OV', FROM_THU); T[tag] = { L:weekLists(X, 5), st:{} }; DAYS.forEach(d => { T[tag].st[d] = !!E(X, '(activeProg.weeks[5].' + d + '&&activeProg.weeks[5].' + d + '._ovKey)||null'); }); }
  const perDay = (t, d) => rejSum(T[t].L, KN, ['pat', 'aux', 'add'], [d]);
  const c = {}, b = {}; ['mon', 'tue', 'thu', 'fri', 'sat'].forEach(d => { c[d] = perDay('C', d); b[d] = perDay('B', d); });
  const eqMon = eqL(T.C.L, T.B.L, ['mon']), eqTue = eqL(T.C.L, T.B.L, ['tue']), eqWed = eqL(T.C.L, T.B.L, ['wed']);
  lines.push('Thursday-from stamps C ' + DAYS.map(d => d + ':' + (T.C.st[d] ? 'S' : '-')).join(' ') + ' | mon == V228 ' + eqMon.eq + '/' + eqMon.n + ', tue ' + eqTue.eq + '/' + eqTue.n + ' (tue rejected ' + c.tue.rej + ' of ' + c.tue.offers + ' [' + c.tue.ex.join('; ') + ']) | wed rows ' + eqWed.n
    + ' | rejected C thu ' + c.thu.rej + '/' + c.thu.offers + ' fri ' + c.fri.rej + '/' + c.fri.offers + ' sat ' + c.sat.rej + '/' + c.sat.offers + ' | V228 thu ' + b.thu.rej + '/' + b.thu.offers + ' fri ' + b.fri.rej + '/' + b.fri.offers + ' sat ' + b.sat.rej + '/' + b.sat.offers);
  const okThu = ['mon', 'tue', 'wed'].every(d => !T.C.st[d]) && ['thu', 'fri', 'sat'].every(d => T.C.st[d]) && eqMon.all && eqMon.n === W.thu.same.mon && eqTue.all && eqTue.n === W.thu.same.tue
    && c.tue.rej === W.thu.tue[0] && c.tue.offers === W.thu.tue[1] && JSON.stringify(c.tue.ex) === JSON.stringify(W.thu.tue[2])
    && c.thu.rej === 0 && c.fri.rej === 0 && c.sat.rej === 0 && ['thu', 'fri', 'sat'].every(d => b[d].rej === W.thu.base[d][0] && b[d].offers === W.thu.base[d][1]);
  // travel-only overlay (minimal, 09-22 to 09-24) on mario_noinj
  const TV = {}; for(const [tag, f] of [['C', CF], ['B', BF]]){ const X = progVM(f, 'mario_noinj', 'OV'); E(X, "_ovDraft.equipment='minimal';_ovDraft.from='2026-09-22';_ovDraft.to='2026-09-24';applyOverlayDraft();");
    TV[tag] = { L:weekLists(X, 5), st:DAYS.filter(d => /substitute/.test(String(E(X, 'JSON.stringify((activeProg.weeks[5].' + d + '&&activeProg.weeks[5].' + d + '._ovKey)||null)')))) }; }
  const eqTV = eqL(TV.C.L, TV.B.L);
  lines.push('travel-only stamped ' + TV.C.st.join(',') + ' | W5 == V228 ' + eqTV.eq + '/' + eqTV.n);
  const okTV = TV.C.st.join(',') === 'tue,thu' && eqTV.all && eqTV.n === W.travel;
  // uninjured programs
  const U = {}; for(const nm of ['manny', 'mario_noinj']) for(const [tag, f] of [['C', CF], ['B', BF]]){ const X = progVM(f, nm, 'OV'); U[nm + tag] = { w3:weekLists(X, 3), w5:weekLists(X, 5) }; }
  const um3 = eqL(U.mannyC.w3, U.mannyB.w3), um5 = eqL(U.mannyC.w5, U.mannyB.w5), un3 = eqL(U.mario_noinjC.w3, U.mario_noinjB.w3), un5 = eqL(U.mario_noinjC.w5, U.mario_noinjB.w5);
  lines.push('uninjured == V228: HALF_MANNY W3 ' + um3.eq + '/' + um3.n + ' W5 ' + um5.eq + '/' + um5.n + ' | mario_noinj W3 ' + un3.eq + '/' + un3.n + ' W5 ' + un5.eq + '/' + un5.n);
  const okU = un3.all && un3.n === W.noinj.w3 && un5.all && un5.n === W.noinj.w5;
  const dayMv = (A, B) => DAYS.map(d => { const e = eqL(A, B, [d]); return (e.eq === e.n && e.nb === e.n) ? null : d + ' ' + e.eq + '/' + e.n + (e.nb !== e.n ? ' (V228 ' + e.nb + ' rows)' : ''); }).filter(Boolean).join(', ') || 'none';
  lines.push('HALF_MANNY lists differing from V228 by day: W3 ' + dayMv(U.mannyC.w3, U.mannyB.w3) + ' | W5 ' + dayMv(U.mannyC.w5, U.mannyB.w5));
  lines.forEach(l => P('    p-UNSTAMPED ' + l));
  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, p-UNSTAMPED SPLIT; standing rulings 2 and 4): at
  // 231 and up the row keeps Thursday-from, travel-only and mario_noinj W3/W5 == V228.
  // Its HALF_MANNY W3/W5 == V228 conjunct (V231 absorb ruling, dark from `VER >= V231_ERA`) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
  if(VER >= V231_ERA){ const okN = un3.all && un3.n === W.noinj.w3 && un5.all && un5.n === W.noinj.w5;
    R.pUNS += ' [V231 split: Thursday-from, travel-only, mario_noinj W3/W5 == V228]';
    RES.pUNS = [SELF && okThu && okTV && okN, 'Thursday-from thu/fri/sat rejected ' + c.thu.rej + '/' + c.fri.rej + '/' + c.sat.rej + ', mon/tue == V228 ' + (eqMon.all && eqTue.all) + (okThu ? '' : ' (Thursday-from not as ruled)') + '; travel ' + eqTV.eq + '/' + eqTV.n + '; mario_noinj W3 ' + un3.eq + '/' + un3.n + ', W5 ' + un5.eq + '/' + un5.n + (okN ? '' : ' MOVED')]; }
  else RES.pUNS = [SELF && okThu && okTV && okU, 'Thursday-from thu/fri/sat rejected ' + c.thu.rej + '/' + c.fri.rej + '/' + c.sat.rej + ', mon/tue == V228 ' + (eqMon.all && eqTue.all) + (okThu ? '' : ' (Thursday-from not as ruled)') + '; travel ' + eqTV.eq + '/' + eqTV.n + '; uninjured ' + (okU ? 'identical' : 'MOVED')];
});

// (p) bridge and halfstep (imBackFromInjury on the mario overlay; clock +60 s for distinct ids)
guard('pBRI', () => { const KN = CFGS.mario; const BR = {};
  for(const [tag, f] of [['C', CF], ['B', BF]]){ const X = progVM(f, 'mario', 'OV'); pin(X, 60000); const id = E(X, "activeProg.overlays.find(function(o){return o.type==='injury';}).id"); let err = null;
    try { E(X, 'imBackFromInjury(' + JSON.stringify(id) + ');'); } catch(e){ err = String(e && e.message || e).slice(0, 80); }
    BR[tag] = { err, bridge:{}, halfstep:{}, days:[] };
    for(const w of [5, 6, 7]) DAYS.forEach(d => { const s = E(X, '(activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d + '&&activeProg.weeks[' + w + '].' + d + '._ovKey)||null'); if(typeof s !== 'string') return;
      const p = (JSON.parse(s)[1] || {}).injury || {}; const kind = p.bridge ? 'bridge' : p.halfstep ? 'halfstep' : 'other'; BR[tag].days.push('W' + w + d + ':' + kind);
      if(kind !== 'other'){ const one = JSON.parse(E(X, 'JSON.stringify(__dayLists(' + w + ',"' + d + '"))')); BR[tag][kind]['W' + w + d] = one; } }); }
  const flat = (o) => { const W_ = {}; Object.keys(o).forEach(k => { W_[k] = o[k]; }); return W_; };
  const keysC = Object.keys(BR.C.bridge), keysH = Object.keys(BR.C.halfstep);
  const bc = rejSum(flat(BR.C.bridge), KN, ['pat', 'aux', 'add'], keysC), bb = rejSum(flat(BR.B.bridge), KN, ['pat', 'aux', 'add'], Object.keys(BR.B.bridge));
  let hn = 0, he = 0; keysH.forEach(k => { const e = eqL({ x:BR.C.halfstep[k] }, { x:BR.B.halfstep[k] || { rows:[] } }, ['x']); hn += e.n; he += e.eq; });
  P('    p-BRIDGE C stamped ' + BR.C.days.join(' ') + (BR.C.err ? ' ERR ' + BR.C.err : '') + ' | bridge days ' + keysC.length + ' rejected (knee/wa judge) C ' + bc.rej + ' of ' + bc.offers + ', V228 ' + bb.rej + ' of ' + bb.offers + ' | halfstep days ' + keysH.length + ' lists == V228 ' + he + '/' + hn);
  const okBR = !BR.C.err && keysC.length > 0 && keysH.length > 0 && JSON.stringify(BR.C.days) === JSON.stringify(BR.B.days) && bc.rej === 0 && bb.rej === W.bridge.base[0] && bb.offers === W.bridge.base[1] && hn === W.halfstep && he === hn;
  RES.pBRI = [SELF && okBR, 'bridge rejected ' + bc.rej + ' of ' + bc.offers + ' (V228 ' + bb.rej + ' of ' + bb.offers + '), halfstep ' + he + '/' + hn];
});

// ── MERGE (workers) ─────────────────────────────────────────────────────────────────────────────────────────────────
Promise.all(WORK).then(rs => {
  const okW = rs.every(Boolean); P('  workers ' + rs.filter(Boolean).length + '/' + SHARDS + ' usable (' + ((Date.now() - tW) / 1000).toFixed(1) + ' s from spawn)');
  // L1
  const L = rs.filter(Boolean).flatMap(r => r.l1); const seen = new Set(L.map(x => x.ci)); const allCfg = okW && seen.size === W.L1.cfgs && L1INJ.every(ci => seen.has(ci));
  for(const [k, row, want] of [['pat', 'pSWAP', W.L1.pat], ['aux', 'pAUX', W.L1.aux], ['add', 'pADD', W.L1.add]]){
    const S = { n5:0, st5:0, offers:0, rej:0, cards:0, eqFix:0, fixMiss:0, longer:0, n3:0, eq3:0, st3:0, rej3:0, nf:0, eqf:0 }; const ex = [], reg = {};
    L.forEach(x => { const K = x.K[k]; Object.keys(S).forEach(f => { S[f] += K[f]; }); K.ex.forEach(e => { if(ex.length < 3) ex.push(e); }); Object.keys(K.reg).forEach(g => { reg[g] = (reg[g] || 0) + K.reg[g]; }); });
    P('    ' + row + ' L1 cfgs ' + seen.size + ' | W5 ' + k + ' rows ' + S.n5 + ' (stamped ' + S.st5 + ') | rejected ' + S.rej + ' of ' + S.offers + ' | rows >= 1 rejected ' + S.cards + (S.cards ? ' (' + Object.keys(reg).sort().map(g => g + ' ' + reg[g]).join(', ') + ')' : '')
      + ' | OV == FIX ' + S.eqFix + '/' + S.st5 + ' (OV longer ' + S.longer + ', FIX row missing ' + S.fixMiss + ') | W3 OV == V228 ' + S.eq3 + '/' + S.n3 + ' (stamped ' + S.st3 + ', judge rejects ' + S.rej3 + ' names there) | FIX W3+W5 == V228 ' + S.eqf + '/' + S.nf);
    ex.forEach(e => P('      e.g. ' + e));
    const c = allCfg && SELF && S.n5 === want && S.st5 === want && S.rej === 0 && S.cards === 0 && S.eqFix === want && S.fixMiss === 0
      && S.n3 > 0 && S.st3 === 0 && S.rej3 > 0 && S.nf > 0;
    // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, p-SWAP / p-AUX / p-ADD SPLIT, classes B-1, A-1
    // and D196 via the cards; standing rulings 2 and 4): at 231 and up the row asserts at the W231 row counts.
    // Its "pre-from W3 == V228" and "FIX W3+W5 == V228" conjuncts and the row-set symmetry they rest on (V231 absorb
    // ruling, dark from `VER >= V231_ERA`) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
    if(VER >= V231_ERA){ const w2 = W231[k];
      const c2 = allCfg && SELF && S.n5 === w2 && S.st5 === w2 && S.rej === 0 && S.cards === 0 && S.eqFix === w2 && S.fixMiss === 0 && S.n3 > 0 && S.st3 === 0 && S.rej3 > 0 && S.nf > 0;
      R[row] += ' [V231 split: rejected 0, rows 0, OV == FIX ' + w2 + '/' + w2 + ']';
      RES[row] = [c2, 'rejected ' + S.rej + ' of ' + S.offers + ', rows >= 1 rejected ' + S.cards + ' of ' + S.n5 + ', OV == FIX ' + S.eqFix + '/' + S.st5 + (allCfg ? '' : '; L1 sweep incomplete (' + seen.size + ' cfgs)') + (S.rej3 > 0 ? '' : '; judge blind on W3')]; }
    else RES[row] = [c, 'rejected ' + S.rej + ' of ' + S.offers + ', rows >= 1 rejected ' + S.cards + ' of ' + S.n5 + ', OV == FIX ' + S.eqFix + '/' + S.st5 + ', W3 == V228 ' + S.eq3 + '/' + S.n3 + ', FIX == V228 ' + S.eqf + '/' + S.nf + (allCfg ? '' : '; L1 sweep incomplete (' + seen.size + ' cfgs)') + (S.rej3 > 0 ? '' : '; judge blind on W3')];
  }
  // print rows in order
  ORDER.forEach(k => {
    const r = RES[k] || [false, 'row not computed']; ok(k, R[k], r[0], r[1]); });
  done();
}).catch(e => { P('  MERGE CRASH ' + String(e && e.stack || e).slice(0, 400)); ORDER.forEach(k => ok(k, R[k] + ' (merge crashed)', false)); done(); });
}
