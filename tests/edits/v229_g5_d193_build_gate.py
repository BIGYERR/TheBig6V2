#!/usr/bin/env python3
# v229_g5_d193_build_gate.py — V229 gate slice g5: write tests/gates/g229_d193_build.js, the gate for D193 P-CAPRPE's
# build half as V229 ships it (D194 R2(1)). No index.html edit. Rulings: tests/measure/v228_rulings/d193_caprpe_ruling.md
# (R2, R7, Amendments 1 to 4, V229 session decisions) and tests/measure/v229_rulings/d194_injlens_ruling.md (gate
# claims (a), (b), (d), (f), (g), (h), (j) build only; Amendment 1's (b) addition).
# Refuses if the gate already exists; one write; literal bytes (real em-dashes, en-dashes, multiplication signs).
import os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'tests', 'gates', 'g229_d193_build.js')
GATE = r'''// g229_d193_build.js — GATE for D193 P-CAPRPE's BUILD half as V229 ships it (D194 R2(1)): on a capped pattern no
// built card prints above RPE 7 (R2, the clamp inside applyInjuryFilter, Amendment 1 §3's four shapes), a held pattern
// does not test (R7, D193-HELDTEST), the stripper reads beneath R7's text (Amendment 3 §2), and nothing else moves.
//
//   node tests/gates/g229_d193_build.js <candidate.html> [baseline_V228.html]
//   IA_ASSUME_VERSION=229 node tests/gates/g229_d193_build.js <tree stamped 228> [baseline_V228.html]   (discrimination only)
//
// THE RULINGS THIS DEFENDS
//   tests/measure/v228_rulings/d193_caprpe_ruling.md: R2 (as re-stated by Amendment 2) and R7 (D193-HELDTEST, Mario
//   round 2: "yes (R7's text, held lifts only), for V229"); Amendment 1 §2 (U, the filter-lens population: "a card is
//   in U when the pattern of the name applyInjuryFilter judged (the name before bodyweightSweep) is in the plan's
//   cap"), §3 (the four-shape table), §7 (gate claims (a), (b), (d), (g), (h)); Amendment 3 §2 (the stripper's fifth
//   shape) and §3 (the 2 Burpees; (j) build 30 / 0 / 102/102 / 0 uninjured); Amendment 4 (corrected figures: (a) 316
//   -> 0 on L432 and 120 -> 0 on home_basic, (a′) INFO 4, (a″) INFO 72 all `Banded hip thrust>Burpees`); the V229
//   session decisions (siting #1: one hoisted test text; siting #2: the stripper matches R7 by shape, number free).
//   tests/measure/v229_rulings/d194_injlens_ruling.md: "Gate claims (V229 ...)" (a), (b), (d), (f), (g), (h), "(j)
//   build only", and Amendment 1's (b) addition ("the boot replay writes no `_preHold` on an uninjured program; after
//   an uninjured undo no item carries `_preHold` (object row, V228 byte-identical)").
//   D-code D193, ships on ia-version 229. HALF_MANNY may not move (standing ruling 5; harness era row
//   MANNY_DIGEST_BY_VERSION[229] = [228] by reference).
//
// NOT THIS FILE. D193's live rows (e), (e′), (i), (i-r), (i-u), (k), (k″) and the live half of (l) are V230's, keyed
// to D194 part 2 (D194 R3/R3′: "Not written at V229"). D194's own rows (o), (p), (q), (r) are its own family. (c),
// the cue literal, is g228_d193_cueword's c-LIT.
//
// ORACLE. Typed here; the engine is never asked for an expected value.
//   CAP       the hand cap table per region and tier (knee wa squat/lunge/leg_iso, protect hinge; ankle wa squat/lunge,
//             protect squat; hip wa hinge/lunge/hip_ext/squat, protect squat; lowback wa hinge/squat/row/hip_ext,
//             protect squat/hip_ext; shoulder wa hpress/vpress/delt_iso, protect none; elbow wa hpress/tri_iso/bi_iso/
//             row/vpull, protect row/vpull). A name's pattern is read from the BASELINE tree's _pattern (the
//             classifier is not under test; the cap is).
//   HOLD      the four-shape hold table, Amendment 1 §3, typed: a capped detail naming RPE above 7 (a range by its top)
//             gets the number 7 and its gloss restated by shape: `(stop 2 reps short of failure)` -> `(leave 3 or more
//             in reserve)` (bwsets); `(leave ~N rep(s) in reserve)` -> `(leave ~3 reps in reserve)` (wave);
//             `(heaviest pair you can find)` -> `(leave ~3 in reserve)` (loadCapped); no gloss -> none (grammar
//             `@ RPE 7`, no gloss, no cue). Plus R7's fifth shape: the test text (any RPE number) -> R7's text.
//   R7_T      `Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight
//             and the reps. Your injury plan holds this lift, so there is no new baseline here.` (R7, typed)
//   TEST_T    `Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and
//             the reps. That set is your new baseline.` (typed)
//   CUE_RE    / — hold RPE 7, (?:two|three) in the tank$/ (real em-dash), the cue by shape, both wordings.
//   RPE       a hand parse: every `RPE a` or `RPE a–b` token, the card's RPE is the largest top.
//   FORBID    `stop 2 reps short`, `~2 reps`, `~1 rep`, `heaviest pair` (Amendment 1 §7 (d)).
//   WAVE      the ruling's own printed wave texts (Amendment 1, Before/After): `4×3 — RPE 8.5 (leave ~2 reps in
//             reserve), ramp up with 2–3 warmup sets, 3 min rest` and `4×3 — RPE 9 (leave ~1 rep in reserve), …` ->
//             `4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest`.
//   FIGURES   the ruled counts: (a) V228 316 (L432) and 120 (home_basic); (f) 1,722 non-cue L9 cards and HALF_MANNY's
//             9 "tank" cards; (j) 30 held test cards (28 + 2 Burpees), 102 filter-lens-uncapped test cards, 96
//             uninjured L1 builds; (b) 133 uninjured builds.
//   ERA       the harness MANNY_DIGEST_BY_VERSION table (standing ruling 5).
//
// THE FILTER LENS. Each build runs in a VM whose bodyweightSweep is wrapped to tag every item with the name it carries
//   when the sweep starts (the name applyInjuryFilter judged), as measure and coach did (Amendment 1 §2). The tag rides
//   the item object and is stripped before any JSON is compared; the SELFCHECK proves the wrapped build, tag stripped,
//   equals a plain fresh-page build on both trees.
//
// POPULATION. All builds pin the clock (2026-09-24) and cfg.seed (76308) and strip clock fields (ts, at, time, stamp,
//   clock, now, id, created). Every baseline build is built twice and must equal itself before any diff is read.
//   L9        tests/gates/g228_d193_cueword.js's nine (MARIO knee/wa, HALF_MANNY, MARIO uninjured, knee/protect, ankle,
//             hip, lowback, shoulder, elbow at workaround).
//   L432      region × tier × commercial, crossfit, home_full, bodyweight × experience × support focus (MARIO otherwise).
//   HB        the same grid on home_basic (108, Amendment 1 §5).
//   L1        tests/gates/g221_d177_swapfloor.js's lite lattice (384: 288 injured, 96 healthy; the D177 L1 lattice).
//   TL        the travel overlay lattice: {...cfg, ...{equipment}, _travel:true} over the HB grid with home_basic and
//             with minimal (216); feeds (b) and d-LOADCAP.
//   H         (h)'s one injured config: MARIO knee/wa through {...cfg, ...patch, _travel:true} with home_basic and with
//             minimal.
//   UN133     MARIO uninjured + 36 uninjured support cells over commercial, crossfit, home_full, bodyweight, plus L1's 96
//             healthy builds (measure's 37 + 96).
//   The CLAMP POPULATION of a build is every baseline card in U (baseline lens) whose V228 detail names RPE above 7 or
//   is the test text. It is the only set the ruling licenses to move.
//
// VERSION PREDICATE (standing rulings 2 and 4). D193's build half ships at 229.
//   below 229      REFUSED, every row FAILS by name.
//   229 and up     every row asserts.
//   IA_ASSUME_VERSION=229 lifts a file stamped exactly 228 to 229 for a discrimination run. It is announced, and ignored
//   on any other file. gate.sh never sets it. Run on V228 that way every row but g FAILS at its V228 figure (printed
//   by builder): a 316 and 120; b 0 moved on L432, home_basic and L1 (an empty diff); d-BWSETS 0 of 1,239 (L432 316,
//   HB 120, L1 493, TL 308, H 2); d-GRAMMAR 0 of 130; d-WAVE 2 of 2 held keep `~2 reps` / `~1 rep`; d-LOADCAP 0 of 310;
//   f INJ_HELD_TEST and TEST_RX_TEXT absent, R7's text not stripped; h 2 and 2 above 7, heaviest pair 0 of 2; j R7 on 0
//   of 30. g is the invariant pair: it PASSES on V228 (as g228's g-COUPLE did on V227), it carries no V229 conjunct.
//   The baseline is argv[3] if it reads ia-version 228, else `git show <V228_COMMIT>:index.html` into os.tmpdir(),
//   because tests/sabotage.py passes no argv[3]. No tree reading 228 makes every baseline row FAIL setup by name.
//
// FIXTURE PRESENTATION. Row g's two live swaps run on a stored program whose cfg carries the injury: fixture
//   presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
//
// ROWS
//   a          On L432 and HB, 0 candidate cards in U (candidate lens) name RPE > 7, U > 0, and the baseline reads the
//              ruled 316 and 120 (the lattice is the ruled lattice). INFO (a′): final-lens capped, filter-lens uncapped,
//              above 7 (ruled 4). INFO (a″): filter-lens capped, final-lens uncapped, any RPE (ruled 72, every one
//              `Banded hip thrust>Burpees`). Defends R2 (Amendment 4 (a)).
//   b          On every injured build (L9, L432, HB, L1, TL, H) the program JSON with the clamp population's details
//              blanked is byte-identical to V228's (so every card outside it, capped at or under 7 or uncapped, is
//              byte-identical: R2's "a detail at or under 7 is left byte-identical and gets no cue" and (b)'s
//              "uncapped unchanged"), and > 0 cards move on L432, HB and L1 (an empty diff is a failure). UN133
//              byte-identical, 0 `_preHold` in any build. HALF_MANNY's digest equals the era row and [229] === [228].
//              Object row (D194 Amendment 1): MARIO uninjured W5, every swappable slot, two live hops, a boot replay
//              and an undo: item, day, swap record, booted day and undone day JSON equal V228's, 0 `_preHold`, 0 `ph`.
//   d-BWSETS   every bwsets card in the clamp population reads the hand hold of its V228 text
//              (`N sets — RPE 7 (leave 3 or more in reserve)`, rest clause untouched), its RPE is 7, it keeps no FORBID.
//   d-GRAMMAR  every grammar card in the clamp population reads `@ RPE 7`, no gloss, no cue.
//   d-WAVE     SYNTHETIC DONOR (no build card carries the wave shape above 7 on a capped pattern; the live rows that do
//              are V230's (e′)): the ruling's two printed wave texts handed to applyInjuryFilter on Barbell box squat
//              (squat, held under knee/wa) read the typed After text; the same two texts on Barbell Romanian deadlift
//              (hinge, not held) come back byte-identical.
//   d-LOADCAP  every loadCapped card in the clamp population (travel overlay, TL and H) reads `RPE 7 (leave ~3 in
//              reserve)`, keeps no `heaviest pair`.
//   f          INJ_HELD_TEST === R7_T and TEST_RX_TEXT === TEST_T (siting #1); _stripCapCue(INJ_HELD_TEST) ===
//              TEST_RX_TEXT; R7's shape with another number strips to TEST_RX_TEXT (siting #2); identity on
//              TEST_RX_TEXT, on the hand near misses, on every non-cue card of L9 (1,722), on HALF_MANNY's 9 "tank"
//              cards and on every distinct non-cue detail of every build this gate makes. Both cue wordings strip.
//   g          invariants, true on V228 and V229: _addRxKind of a cued detail (either wording) is null while the bare
//              dose is not; 0 POWER cards cued on every injured lattice (> 0 seen); MARIO knee/wa W5 thu Kettlebell
//              swing `2×8` -> Dumbbell split-stance deadlift and W5 tue Sumo deadlift `4×3 — RPE 7 (leave ~3 reps in
//              reserve), …` -> Barbell Romanian deadlift carry the donor verbatim live and after a boot replay, toast
//              "… Same job, same numbers.".
//   h          H: 0 candidate cards in U above RPE 7 on both overlay builds (V228 2 and 2); every capped card whose V228
//              text carries `(heaviest pair you can find)` above 7 (> 0) reads `3 sets of 8 to 12 — RPE 7 (leave ~3 in
//              reserve)` followed by V228's own rest clause.
//   j          L1: the V228 test cards held by the filter lens are exactly 30 (2 of them final-name Burpees) and every
//              one reads R7_T; the 102 not held (66 on injured builds, 36 on L1's healthy ones, which hold nothing) are
//              byte-identical to V228; R7_T appears 30 times on L1 and 0 times on
//              any uninjured build; 0 number-only (`at RPE 7. … new baseline.`) cards on any build; L1's 96 uninjured
//              builds byte-identical.
//
// SABOTAGE THIS FILE IS MEANT TO CATCH (scratch copies, each anchor count==1; D193/D194 S-codes in brackets):
//   M1 [S2]  the clamp branch in applyInjuryFilter returns the detail unchanged: trips a (316, 120), b, d-*, h, j.
//   M2 [S3]  the clamp applied regardless of cap: trips b.
//   M3 [S7]  bwsets clamp keeps `(stop 2 reps short of failure)`: trips d-BWSETS.
//   M4 [S9]  loadCapped clamp keeps `(heaviest pair you can find)`: trips d-LOADCAP, h.
//   M5 [S10] wave clamp keeps `~2 reps`: trips d-WAVE.
//   M6 [S14] fifth shape number-only: trips j.     M7 [S15] fifth shape regardless of cap: trips b, j.
//   M8 [S17] stripper does not map R7: trips f.    M9 [S5] stripper strips any ` — …` tail: trips f, g.
//   M10 [S8] `\bhold\b` removed from _addRxKind: trips g.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load, fixtures, progDigest } = H;

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 229, BASE_ERA = 228;
const V228_COMMIT = '2c1a89c85fc5c3193b8646a49fe94eed3f221fb1';   // V228: D193 R1/R4 + D192 (the V228 artifact, forever)
let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

const R = {
  a:   'row a         0 cards in U (the hand cap table holds the pattern of the name applyInjuryFilter judged, before bodyweightSweep) name RPE > 7 on L432 and on home_basic (V228 316 and 120)',
  b:   'row b         nothing moves but the clamp population: every other card of every injured build byte-identical to V228, > 0 moved; uninjured 133 byte-identical; HALF_MANNY on the era row, [229] === [228]; no _preHold on an uninjured item after a build, two live swaps, a boot replay or an undo',
  dBW: 'row d-BWSETS  every bwsets card the clamp writes reads `N sets — RPE 7 (leave 3 or more in reserve)` (hand table), RPE 7, 0 keep `stop 2 reps short`',
  dGR: 'row d-GRAMMAR every grammar card the clamp writes reads `@ RPE 7`, no gloss, no cue (hand table)',
  dWV: 'row d-WAVE    synthetic donor: the ruling\'s two printed wave texts through applyInjuryFilter read `RPE 7 (leave ~3 reps in reserve)` on a held lift, 0 keep `~2 reps` or `~1 rep`; byte-identical on an unheld lift',
  dLC: 'row d-LOADCAP every loadCapped card the clamp writes on the travel overlay reads `RPE 7 (leave ~3 in reserve)`, 0 keep `heaviest pair`',
  f:   'row f         _stripCapCue(INJ_HELD_TEST) === TEST_RX_TEXT (both typed, R7 by shape); identity on TEST_RX_TEXT and on every non-cue detail (L9 1,722, HALF_MANNY 9 "tank" cards)',
  g:   'row g         coupling guards: _addRxKind refuses a cued detail; 0 power cards cued; a loaded-to-loaded swap carries the donor verbatim live and at boot (fixture presentation)',
  h:   'row h         travel overlay {...cfg, ...patch, _travel:true}, MARIO knee/wa, home_basic and minimal: 0 cards in U above RPE 7; the heaviest pair shape on a capped card reads `3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)`',
  j:   'row j         build, D177 L1: R7 text on the 30 held test cards (28 + 2 Burpees), 0 number-only, 102/102 unheld test cards byte-identical to V228, 0 R7 on uninjured, 96/96 uninjured L1 byte-identical',
};

// ── TYPED ORACLE ─────────────────────────────────────────────────────────────────────────────────────────────────
const OLDC = ' — hold RPE 7, two in the tank', NEWC = ' — hold RPE 7, three in the tank';
const CUE_RE = / — hold RPE 7, (?:two|three) in the tank$/;
const TEST_T = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7_T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const R7_AT6 = 'Work up to one working set of 3 to 5 reps at RPE 6. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TEST_SHAPE = /^Work up to one heavy set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
const NUMONLY = /at RPE 7\..*new baseline\./;
const CAP = { knee:{ workaround:['squat', 'lunge', 'leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat', 'lunge'], protect:['squat'] },
  hip:{ workaround:['hinge', 'lunge', 'hip_ext', 'squat'], protect:['squat'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'], protect:['squat', 'hip_ext'] },
  shoulder:{ workaround:['hpress', 'vpress', 'delt_iso'], protect:[] }, elbow:{ workaround:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect:['row', 'vpull'] } };
const capOf = c => c && c.injury ? CAP[c.injury.region][c.injury.tier] : [];
const SEVEN = { bwsets:'RPE 7 (leave 3 or more in reserve)', wave:'RPE 7 (leave ~3 reps in reserve)', loadCapped:'RPE 7 (leave ~3 in reserve)', grammar:'RPE 7' };
const FORBID = ['stop 2 reps short', '~2 reps', '~1 rep', 'heaviest pair'];
function handHold(d){
  if(typeof d !== 'string') return d;
  if(TEST_SHAPE.test(d)) return R7_T;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\+?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if(!(Math.max(+a, b ? +b : 0) > 7)) return t;
    if(!g) return SEVEN.grammar;
    if(/^stop/.test(gl)) return SEVEN.bwsets;
    if(/^heaviest/.test(gl)) return SEVEN.loadCapped;
    return SEVEN.wave; });
}
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const kindOf = d => { d = String(d || ''); if(d === R7_T) return 'R7'; if(TEST_SHAPE.test(d)) return 'test'; if(CUE_RE.test(d)) return 'cue'; if(/^\d+ sets — RPE/.test(d)) return 'bwsets';
  if(/@ RPE/.test(d)) return 'grammar'; if(/^\d+×[\d–]+ — RPE [\d.–]+ \(leave ~/.test(d)) return 'wave'; if(/sets of \d+ to \d+ — RPE/.test(d)) return 'loadCapped'; if(/RPE/.test(d)) return 'other'; return 'none'; };
const WAVE85 = '4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest';
const WAVE9 = '4×3 — RPE 9 (leave ~1 rep in reserve), ramp up with 2–3 warmup sets, 3 min rest';
const WAVE7 = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest';
const LOADCAP_HEAD = '3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)';
const STRIP_HAND = [
  ['3×10' + OLDC, '3×10'], ['3×10' + NEWC, '3×10'], ['2×10 each' + OLDC, '2×10 each'], ['2×10 each' + NEWC, '2×10 each'],
  [R7_T, TEST_T], [R7_AT6, TEST_T], [TEST_T, null], [R7_T + ' ', null], ['3×10 — hold RPE 7, four in the tank', null], ['3×10' + NEWC + ', 2 min rest', null],
  ['RPE 6 (recovery — leave 4+ reps in the tank)', null], ['RPE 6 (leave plenty in the tank)', null], [WAVE85, null], [WAVE7, null], ['3×10', null], ['', null],
];
const MANNY_TANK = 9, NONCUE_L9 = 1722, A_L432 = 316, A_HB = 120, J_HELD = 30, J_BURPEES = 2, J_UNHELD = 102, J_UNINJ = 96, UNINJ_N = 133;
const POWER = /fast and crisp|crisp and explosive|explosive|max intent/i;
const KB = 'Kettlebell swing', SSDL = 'Dumbbell split-stance deadlift', SUMO = 'Sumo deadlift', RDL = 'Barbell Romanian deadlift', STEP = 'Step-ups (KB)';
const SUMO_D = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest';
const L2L = [ { w:5, d:'thu', sec:'Leg superset B', from:KB, d0:'2×8', to:SSDL, toast:'Dumbbell split-stance deadlift in, kettlebell swing out. Same job, same numbers.' },
  { w:5, d:'tue', sec:'Main', from:SUMO, d0:SUMO_D, to:RDL, toast:'Barbell Romanian deadlift in, sumo deadlift out. Same job, same numbers.' } ];
const PAT_TYPED = { [KB]:'hinge', [SSDL]:'hinge', [SUMO]:'hinge', [RDL]:'hinge', 'Barbell box squat':'squat' };
const CAP_KNEE = CAP.knee.workaround;

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; else delete c.injury; return c; };
const seeded = c => { const x = clone(c); if(typeof x.seed !== 'number') x.seed = 76308; return x; };
const L9 = { mario:withInj({ region:'knee', tier:'workaround' }), manny:seeded(fixtures.HALF_MANNY), mario_noinj:withInj(null),
  knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }),
  lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'], TIERS = ['workaround', 'protect'], EXPS = ['beginner', 'intermediate', 'advanced'],
  FOCS = ['support_strength', 'support_athletic', 'support_prevention'];
const grid = (EQ, extra) => { const r = []; for(const g of REGS) for(const t of TIERS) for(const eq of EQ) for(const ex of EXPS) for(const fo of FOCS)
  r.push({ k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }, extra || {}) }); return r; };
// D177 L1, verbatim from tests/gates/g221_d177_swapfloor.js
function mk(t, f, x, g, i, seed){
  const race = !!g.id && /half/.test(g.id);
  return { name:'M', primaryPath:g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes:g.id ? ['run'] : [],
    cardioGoals:g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted:race, raceDate:race ? '2026-12-06' : null, liftingFocus:f, experience:x, ageBracket:'18-35', equipment:t, unit:'lbs',
    restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench:135, squat:155, deadlift:185, seed, ...(i.v ? { injury:i.v } : {}) };
}
const LO = { k:'liftonly', id:null }, HALF = { k:'half', id:'run_half' };
const INJ1 = (r, t) => ({ k:r + '/' + t, v:{ region:r, tier:t } }), HEALTHY = { k:'healthy', v:null };
const L1 = [];
for(const t of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal']) for(const f of ['support_prevention', 'support_strength', 'hypertrophy', 'strength'])
  for(const x of ['beginner', 'advanced']) for(const g of [LO, HALF]) for(const i of [HEALTHY, INJ1('knee', 'workaround'), INJ1('lowback', 'workaround'), INJ1('shoulder', 'protect')])
    L1.push({ k:t + '|' + f + '|' + x + '|' + g.k + '|' + i.k, c:mk(t, f, x, g, i, 76308) });
const UN37 = [{ k:'mario_noinj', c:withInj(null) }];
for(const eq of ['commercial', 'crossfit', 'home_full', 'bodyweight']) for(const ex of EXPS) for(const fo of FOCS)
  UN37.push({ k:'noinj|' + eq + '|' + ex + '|' + fo, c:Object.assign(withInj(null), { equipment:eq, experience:ex, liftingFocus:fo }) });
const overlay = (cfg, patch) => ({ ...cfg, ...patch, _travel:true });   // the app's substitute-overlay build, applyOverlays
const TL = []; grid(['home_basic']).forEach(x => { for(const eq of ['home_basic', 'minimal']) TL.push({ k:x.k.replace('home_basic', 'travel ' + eq), c:overlay(Object.assign(clone(x.c), { equipment:'commercial' }), { equipment:eq }) }); });
const HCFG = { home_basic:overlay(clone(L9.mario), { equipment:'home_basic' }), minimal:overlay(clone(L9.mario), { equipment:'minimal' }) };

const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const J = v => JSON.stringify(v, (k, x) => (k === '__pre' || CLK.test(k) || k === 'id' || k === 'created') ? undefined : x);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const WRAP = "var __BUILD=0;var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; ((dy&&dy.sections)||[]).forEach(function(s){ (s.items||[]).forEach(function(it){ if(it&&it.name) it.__pre={n:it.name,b:__BUILD}; }); }); }); }); }catch(e){} return __origBWS.apply(this,arguments); };";
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}";
const FILES = { C:ART, B:null };
const plainVM = which => { const X = load(FILES[which]); pin(X); return X; };
const lensVM = which => { const X = plainVM(which); E(X, WRAP); return X; };
const appVM = which => { const X = plainVM(which); E(X, HELP); return X; };
function cardsOf(p, b){ const m = []; Object.keys((p && p.weeks) || {}).forEach(w => Object.keys(p.weeks[w] || {}).forEach(d => { const dy = p.weeks[w][d];
  ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it) return; const pre = (it.__pre && it.__pre.b === b) ? it.__pre.n : it.name;
    m.push({ k:w + '|' + d + '|' + si + '|' + ii, w, d, si, ii, label:clean(s.label), n:clean(it.name), pre:clean(pre), det:typeof it.detail === 'string' ? it.detail : '' }); })); })); return m; }
function buildIn(X, cfg){ E(X, '__BUILD++'); const b = E(X, '__BUILD'); X.ctx.__C = clone(cfg); const p = E(X, 'buildProgram(__C)'); return { json:J(p), cards:cardsOf(p, b) }; }
const tally = (m, k) => { m[k] = (m[k] || 0) + 1; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const cnt = (s, sub) => String(s).split(sub).length - 1;

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g229 D193 build half (R2 clamp, R7 held test, stripper fifth shape) | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D193 P-CAPRPE\'s build half (V' + ERA + ', D194 R2(1)). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
let BASE_OK = false, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ BASE_OK = true; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!BASE_OK){
  const f = path.join(os.tmpdir(), 'g229_d193_build_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V228_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ BASE_OK = true; FILES.B = f; baseWhy += 'git show ' + V228_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
console.log('  V' + BASE_ERA + ' baseline: ' + (BASE_OK ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
const setupNote = BASE_OK ? '' : ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')';

// ── f: the stripper and the two hoisted texts (needs only the candidate) ─────────────────────────────────────────
const XF = plainVM('C');
const stripAll = arr => { XF.ctx.__arr = arr; return Array.from(E(XF, '__arr.map(function(d){return _stripCapCue(d);})')); };
const DISTINCT = new Set();                 // every distinct non-cue detail of every candidate build, read under f
const L9CARDS = {};                        // candidate cards of L9 (f)

// ── g: power accumulators ────────────────────────────────────────────────────────────────────────────────────────
const PW = { pw:0, cued:0, cuedAll:0, bad:[] };

if(!BASE_OK){
  ['a', 'b', 'dBW', 'dGR', 'dWV', 'dLC', 'h', 'j'].forEach(k => ok(R[k] + setupNote, false));
} else {
  // ── SELFCHECK: the lens wrapper is neutral and the shared VM is inert, on both trees ─────────────────────────────
  const VC = lensVM('C'), VB = lensVM('B');
  const PATV = plainVM('B'); const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(PATV, '_pattern(' + JSON.stringify(n) + ')') || '-');
  const probe = [L9.mario, L9.manny, L9.elbow_wa, Object.assign(clone(MARIO), { injury:{ region:'lowback', tier:'protect' }, equipment:'bodyweight', experience:'advanced' }), TL[0].c, L1[L1.length - 1].c];
  const selfC = probe.every(c => buildIn(VC, c).json === J(plainVM('C').buildProgram(clone(c))));
  const selfB = probe.every(c => buildIn(VB, c).json === J(plainVM('B').buildProgram(clone(c))));
  console.log('    SELFCHECK wrapped lens build (tag stripped) == plain fresh-page build on ' + probe.length + ' probes: candidate ' + selfC + ', V' + BASE_ERA + ' ' + selfB);
  const SELF = { n:0, same:0, bad:[] };

  // per-lattice accumulators
  const A = {}; const newA = () => ({ builds:0, U:0, Uhi:0, UhiB:0, a1:0, a1B:0, a2:0, a2B:0, a2tab:{}, ex:[] });
  const B = { inj:0, injSame:0, moved:{}, bad:[], un:0, unSame:0, unBad:[], preHold:0 };
  const D = {}; const newD = () => ({ pop:0, ok:0, forb:0, notSeven:0, bySet:{}, ex:[] });
  const JJ = { held:0, heldOK:0, burpees:0, unheld:0, unheldUn:0, unheldSame:0, r7L1:0, r7Un:0, r7Other:0, numOnly:0, l1Un:0, l1UnSame:0, heldOther:0, heldOtherOK:0, unheldOther:0, unheldOtherSame:0, ex:[] };
  const HH = {};

  const setDet = (o, c, v) => { try { o.weeks[c.w][c.d].sections[c.si].items[c.ii].detail = v; } catch(e){} };
  function runInjured(tag, key, cfg){
    const cap = capOf(cfg);
    const C = buildIn(VC, cfg), B1 = buildIn(VB, cfg), B2 = buildIn(VB, cfg);
    SELF.n++; if(B1.json === B2.json) SELF.same++; else if(SELF.bad.length < 3) SELF.bad.push(tag + ' ' + key);
    const a = A[tag] || (A[tag] = newA()); a.builds++;
    C.cards.forEach(c => { const fc = cap.includes(pat(c.pre)), nc = cap.includes(pat(c.n)), hi = rpeMax(c.det) > 7;
      if(fc){ a.U++; if(hi){ a.Uhi++; if(a.ex.length < 3) a.ex.push(key + ' W' + c.w + ' ' + c.d + ' [' + c.label + '] ' + c.n + ' (judged ' + c.pre + ') ' + JSON.stringify(c.det)); } }
      if(nc && !fc && hi) a.a1++; if(fc && !nc){ a.a2++; tally(a.a2tab, c.pre + '>' + c.n); }
      const cue = CUE_RE.test(c.det); if(POWER.test(c.det) || /^Power/.test(c.label)){ PW.pw++; if(cue){ PW.cued++; if(PW.bad.length < 3) PW.bad.push(key + ' W' + c.w + ' ' + c.d + ' ' + c.n + ' :: ' + c.det); } }
      if(c.det === R7_T){ if(tag === 'L1') JJ.r7L1++; else JJ.r7Other++; }
      if(NUMONLY.test(c.det)) JJ.numOnly++;
      if(!cue && c.det !== R7_T) DISTINCT.add(c.det); });
    B1.cards.forEach(b => { const fc = cap.includes(pat(b.pre)), nc = cap.includes(pat(b.n)), hi = rpeMax(b.det) > 7; if(fc && hi) a.UhiB++; if(nc && !fc && hi) a.a1B++; if(fc && !nc) a.a2B++; });
    if(tag === 'L9') L9CARDS[key] = C.cards;
    // the clamp population, defined on the baseline with the baseline's lens
    const cm = new Map(C.cards.map(c => [c.k, c]));
    const pop = B1.cards.filter(b => cap.includes(pat(b.pre)) && (TEST_SHAPE.test(b.det) || rpeMax(b.det) > 7));
    const pb = JSON.parse(B1.json), pc = JSON.parse(C.json); let moved = 0;
    pop.forEach(b => { const c = cm.get(b.k); if(c && c.det !== b.det) moved++; setDet(pb, b, '#'); setDet(pc, b, '#'); });
    B.inj++; B.moved[tag] = (B.moved[tag] || 0) + moved;
    if(JSON.stringify(pb) === JSON.stringify(pc)) B.injSame++; else if(B.bad.length < 4){ const x = JSON.stringify(pb), y = JSON.stringify(pc); let i = 0; while(i < x.length && x[i] === y[i]) i++; B.bad.push(tag + ' ' + key + ' @' + i + ' V228 …' + x.slice(Math.max(0, i - 80), i + 60) + '… candidate …' + y.slice(Math.max(0, i - 80), i + 60) + '…'); }
    // d and j over the population
    pop.forEach(b => { const c = cm.get(b.k); const cd = c ? c.det : null, sameName = !!c && c.n === b.n;
      if(TEST_SHAPE.test(b.det)){
        const good = sameName && cd === R7_T; const burp = !cap.includes(pat(b.n));
        if(tag === 'L1'){ JJ.held++; if(good) JJ.heldOK++; if(burp) JJ.burpees++; } else { JJ.heldOther++; if(good) JJ.heldOtherOK++; }
        if(!good && JJ.ex.length < 4) JJ.ex.push(tag + ' ' + key + ' W' + b.w + ' ' + b.d + ' ' + b.n + ' -> ' + (c && c.n) + ' ' + JSON.stringify(cd));
        return; }
      const kind = kindOf(b.det); const d = D[kind] || (D[kind] = newD()); d.pop++; tally(d.bySet, tag);
      const want = handHold(b.det); const forb = cd === null || FORBID.some(f => cd.includes(f)); const seven = rpeMax(cd) === 7;
      if(forb) d.forb++; if(!seven) d.notSeven++;
      if(sameName && cd === want && !forb && seven) d.ok++; else if(d.ex.length < 3) d.ex.push(tag + ' ' + key + ' W' + b.w + ' ' + b.d + ' ' + b.n + ' ' + JSON.stringify(b.det) + ' -> ' + JSON.stringify(cd) + ' want ' + JSON.stringify(want)); });
    // j: unheld test cards
    B1.cards.forEach(b => { if(!TEST_SHAPE.test(b.det) || cap.includes(pat(b.pre))) return; const c = cm.get(b.k); const same = !!c && c.det === b.det && c.n === b.n;
      if(tag === 'L1'){ JJ.unheld++; if(same) JJ.unheldSame++; } else { JJ.unheldOther++; if(same) JJ.unheldOtherSame++; }
      if(!same && JJ.ex.length < 4) JJ.ex.push('unheld ' + tag + ' ' + key + ' W' + b.w + ' ' + b.d + ' ' + b.n + ' -> ' + (c && c.n) + ' ' + JSON.stringify(c && c.det)); });
    if(tag === 'H'){ const hp = pop.filter(b => /\(heaviest pair you can find\)/.test(b.det)); HH[key] = { UhiC:C.cards.filter(c => cap.includes(pat(c.pre)) && rpeMax(c.det) > 7).length,
      UhiB:B1.cards.filter(b => cap.includes(pat(b.pre)) && rpeMax(b.det) > 7).length, hp:hp.length,
      hpOK:hp.filter(b => { const c = cm.get(b.k); return !!c && c.n === b.n && c.det === handHold(b.det) && c.det.indexOf(LOADCAP_HEAD) === 0 && c.det.slice(LOADCAP_HEAD.length) === b.det.slice(b.det.indexOf(')') + 1); }).length,
      ex:hp.slice(0, 2).map(b => 'W' + b.w + ' ' + b.d + ' ' + b.n + ' ' + JSON.stringify(b.det) + ' -> ' + JSON.stringify(cm.get(b.k) && cm.get(b.k).det)) }; }
  }
  function runUninjured(tag, key, cfg, counted){
    const C = buildIn(VC, cfg), B1 = buildIn(VB, cfg), B2 = buildIn(VB, cfg);
    SELF.n++; if(B1.json === B2.json) SELF.same++; else if(SELF.bad.length < 3) SELF.bad.push(tag + ' ' + key);
    if(tag === 'L9') L9CARDS[key] = C.cards;
    if(/"_preHold"/.test(C.json)) B.preHold++;
    C.cards.forEach(c => { if(c.det === R7_T) JJ.r7Un++; if(NUMONLY.test(c.det)) JJ.numOnly++; if(!CUE_RE.test(c.det) && c.det !== R7_T) DISTINCT.add(c.det); });
    if(counted){ B.un++; if(C.json === B1.json) B.unSame++; else if(B.unBad.length < 3) B.unBad.push(tag + ' ' + key); }
    if(tag === 'L1'){ JJ.l1Un++; if(C.json === B1.json) JJ.l1UnSame++;
      // an uninjured build holds nothing, so its test cards are unheld by the filter lens (measure's 102 = 66 + 36)
      const cm = new Map(C.cards.map(c => [c.k, c])); B1.cards.forEach(b => { if(!TEST_SHAPE.test(b.det)) return; const c = cm.get(b.k); JJ.unheld++; JJ.unheldUn++;
        if(c && c.det === b.det && c.n === b.n) JJ.unheldSame++; else if(JJ.ex.length < 4) JJ.ex.push('unheld uninjured ' + key + ' W' + b.w + ' ' + b.d + ' ' + b.n + ' -> ' + (c && c.n) + ' ' + JSON.stringify(c && c.det)); }); }
  }
  for(const k of Object.keys(L9)){ if(L9[k].injury) runInjured('L9', k, L9[k]); else runUninjured('L9', k, L9[k], false); }
  grid(['commercial', 'crossfit', 'home_full', 'bodyweight']).forEach(x => runInjured('L432', x.k, x.c));
  grid(['home_basic']).forEach(x => runInjured('HB', x.k, x.c));
  L1.forEach(x => { if(x.c.injury) runInjured('L1', x.k, x.c); else runUninjured('L1', x.k, x.c, true); });
  UN37.forEach(x => runUninjured('UN37', x.k, x.c, true));
  TL.forEach(x => runInjured('TL', x.k, x.c));
  Object.keys(HCFG).forEach(k => runInjured('H', k, HCFG[k]));
  const selfAll = selfC && selfB && SELF.same === SELF.n && SELF.n > 0;
  console.log('    baseline == itself (every baseline build built twice) ' + SELF.same + '/' + SELF.n + (SELF.bad.length ? ' MISMATCH ' + SELF.bad.join(', ') : '') + ' | runtime ' + secs());

  // ── a ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  for(const t of ['L432', 'HB', 'L1', 'L9', 'TL', 'H']){ const a = A[t]; if(!a) continue;
    console.log('    a ' + t + ' (' + a.builds + ' builds): U ' + a.U + ' | U naming RPE > 7: candidate ' + a.Uhi + ', V' + BASE_ERA + ' ' + a.UhiB + (t === 'L432' ? ' (ruled ' + A_L432 + ')' : t === 'HB' ? ' (ruled ' + A_HB + ')' : '')
      + ' | INFO (a′) final-only above 7: candidate ' + a.a1 + ', V' + BASE_ERA + ' ' + a.a1B + (t === 'L432' ? ' (ruled 4)' : '') + ' | INFO (a″) filter-only: candidate ' + a.a2 + ', V' + BASE_ERA + ' ' + a.a2B + (t === 'L432' ? ' (ruled 72)' : '') + (a.a2 ? ' ' + fmt(a.a2tab) : ''));
    a.ex.forEach(s => console.log('      U above 7: ' + s)); }
  { const L = A.L432 || newA(), HB = A.HB || newA();
    ok(R.a, selfAll && L.U > 0 && HB.U > 0 && L.Uhi === 0 && HB.Uhi === 0 && L.UhiB === A_L432 && HB.UhiB === A_HB,
      'L432 ' + L.Uhi + ' of U ' + L.U + ' above 7 (V' + BASE_ERA + ' ' + L.UhiB + '), home_basic ' + HB.Uhi + ' of U ' + HB.U + ' (V' + BASE_ERA + ' ' + HB.UhiB + ')' + (selfAll ? '' : '; SELFCHECK failed')); }

  // ── b ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  const MD = H.MANNY_DIGEST_BY_VERSION || {};
  const has = Object.prototype.hasOwnProperty.call(MD, ERA) && typeof MD[ERA] === 'string', ref = has && MD[ERA] === MD[BASE_ERA];
  const row = MD[VER];
  const built = progDigest(load(ART).buildProgram(clone(fixtures.HALF_MANNY)));          // the harness way (real clock)
  const builtPin = progDigest(plainVM('C').buildProgram(clone(fixtures.HALF_MANNY)));     // and on the gate's pinned clock
  const mannyOK = has && ref && typeof row === 'string' && built === row && builtPin === row;
  console.log('    b injured builds: outside the clamp population byte-identical ' + B.injSame + '/' + B.inj + ' | moved (all inside it) ' + fmt(B.moved));
  B.bad.forEach(s => console.log('      DIFF ' + s));
  console.log('    b uninjured byte-identical ' + B.unSame + '/' + B.un + ' (ruled ' + UNINJ_N + ')' + (B.unBad.length ? ' DIFF ' + B.unBad.join(', ') : '') + ' | builds carrying _preHold ' + B.preHold);
  console.log('    b MANNY MANNY_DIGEST_BY_VERSION[' + ERA + '] ' + (has ? MD[ERA] : 'ABSENT') + ', [' + BASE_ERA + '] ' + MD[BASE_ERA] + ', [' + VER + '] ' + row + ' | HALF_MANNY built ' + built + ', pinned ' + builtPin);
  // the object row: MARIO uninjured W5, every swappable slot, two hops, a boot replay, an undo
  const OB = objectRow();
  console.log('    b object row (MARIO uninjured W5, two live hops, boot replay, undo): slots ' + OB.n + ' | item+day == V' + BASE_ERA + ' ' + OB.same + ' | record == ' + OB.rec + ' | booted day == ' + OB.boot + ' | undone day == ' + OB.undo
    + ' | candidate _preHold after hops/boot/undo ' + OB.pre + ', ph in records ' + OB.ph + ', in stores ' + OB.store);
  OB.ex.forEach(s => console.log('      ' + s));
  const movedAll = (B.moved.L432 || 0) > 0 && (B.moved.HB || 0) > 0 && (B.moved.L1 || 0) > 0;
  ok(R.b + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)'), selfAll && B.inj > 0 && B.injSame === B.inj && movedAll && B.un === UNINJ_N && B.unSame === B.un && B.preHold === 0 && mannyOK
    && OB.n > 0 && OB.same === OB.n && OB.rec === OB.n && OB.boot === OB.n && OB.undo === OB.n && OB.pre === 0 && OB.ph === 0 && OB.store === 0,
    'outside ' + B.injSame + '/' + B.inj + ', moved L432 ' + (B.moved.L432 || 0) + ' HB ' + (B.moved.HB || 0) + ' L1 ' + (B.moved.L1 || 0) + '; uninjured ' + B.unSame + '/' + B.un + '; MANNY [' + ERA + ']' + (ref ? '===' : '!==') + '[' + BASE_ERA + '], ' + built + (built === row ? ' == ' : ' != ') + '[' + VER + ']; object row ' + OB.same + '/' + OB.n + ', _preHold ' + OB.pre);

  // ── d ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  Object.keys(D).sort().forEach(k => { const d = D[k]; console.log('    d ' + k + ': clamp population ' + d.pop + ' (' + fmt(d.bySet) + ') | hand hold ' + d.ok + ' | keep FORBID ' + d.forb + ' | RPE != 7 ' + d.notSeven); d.ex.forEach(s => console.log('      ' + s)); });
  const dRow = (key, kind, extra) => { const d = D[kind] || newD(); ok(R[key], selfAll && d.pop > 0 && d.ok === d.pop && d.forb === 0 && d.notSeven === 0 && (extra === undefined || extra), d.ok + '/' + d.pop + ' hand hold, ' + d.forb + ' keep FORBID, ' + d.notSeven + ' RPE != 7'); };
  dRow('dBW', 'bwsets', (D.bwsets && D.bwsets.bySet.L432 > 0 && D.bwsets.bySet.HB > 0 && D.bwsets.bySet.L1 > 0));
  dRow('dGR', 'grammar');
  // d-WAVE: synthetic donor through the plan's single writer
  { const X = plainVM('C'); const PV = plainVM('B'); const patOK = Object.keys(PAT_TYPED).every(n => (E(PV, '_pattern(' + JSON.stringify(n) + ')') || null) === PAT_TYPED[n]) && CAP_KNEE.includes(PAT_TYPED['Barbell box squat']) && !CAP_KNEE.includes(PAT_TYPED[RDL]);
    const ins = [['Barbell box squat', WAVE85, WAVE7], ['Barbell box squat', WAVE9, WAVE7], [RDL, WAVE85, WAVE85], [RDL, WAVE9, WAVE9]];
    X.ctx.__S = ins.map(r => ({ label:'x', items:[{ name:r[0], detail:r[1] }] })); X.ctx.__cfg = clone(L9.mario);
    let out = []; try { out = JSON.parse(E(X, 'JSON.stringify(applyInjuryFilter(__S,__cfg))')); } catch(e){ out = []; }
    const got = ins.map((r, i) => { const it = out[i] && out[i].items && out[i].items[0]; return it ? { n:it.name, d:it.detail } : null; });
    const good = ins.map((r, i) => !!got[i] && got[i].n === r[0] && got[i].d === r[2]);
    const keep = got.slice(0, 2).filter(g => !g || /~2 reps|~1 rep/.test(g.d)).length;
    console.log('    d-WAVE synthetic donor (knee/wa plan, applyInjuryFilter): build cards of the wave shape in the clamp population ' + ((D.wave && D.wave.pop) || 0) + ' | patterns typed == classifier ' + patOK);
    ins.forEach((r, i) => console.log('      ' + r[0] + ' ' + JSON.stringify(r[1]) + ' -> ' + JSON.stringify(got[i] && got[i].d) + (good[i] ? ' ok' : ' WANT ' + JSON.stringify(r[2]))));
    ok(R.dWV, patOK && good.every(Boolean) && keep === 0, good.filter(Boolean).length + '/4 as typed, ' + keep + ' of 2 held keep ~2 reps / ~1 rep'); }
  if(!BASE_OK) ok(R.dLC + setupNote, false); else dRow('dLC', 'loadCapped', (D.loadCapped && (D.loadCapped.bySet.TL || 0) > 0));

  // ── h ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  { const hb = HH.home_basic || {}, mn = HH.minimal || {};
    console.log('    h MARIO knee/wa travel overlay: home_basic U above 7 candidate ' + hb.UhiC + ', V' + BASE_ERA + ' ' + hb.UhiB + ' | minimal candidate ' + mn.UhiC + ', V' + BASE_ERA + ' ' + mn.UhiB
      + ' | heaviest pair above 7 on a capped card (V' + BASE_ERA + ') home_basic ' + hb.hp + ', reading `' + LOADCAP_HEAD + '` + V' + BASE_ERA + '\'s rest clause ' + hb.hpOK + ' | minimal ' + mn.hp + ' | INFO TL lattice U above 7: candidate ' + ((A.TL && A.TL.Uhi) || 0) + ', V' + BASE_ERA + ' ' + ((A.TL && A.TL.UhiB) || 0));
    (hb.ex || []).forEach(s => console.log('      ' + s));
    ok(R.h, selfAll && hb.UhiC === 0 && mn.UhiC === 0 && hb.hp > 0 && hb.hpOK === hb.hp && mn.hpOK === mn.hp,
      'U above 7 home_basic ' + hb.UhiC + ', minimal ' + mn.UhiC + '; heaviest pair ' + hb.hpOK + '/' + hb.hp + ' read the hold'); }

  // ── j ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  console.log('    j L1: held test cards ' + JJ.held + ' (ruled ' + J_HELD + '; final-name uncapped Burpees ' + JJ.burpees + ', ruled ' + J_BURPEES + ') reading R7 ' + JJ.heldOK + ' | unheld test cards byte-identical ' + JJ.unheldSame + '/' + JJ.unheld + ' (ruled ' + J_UNHELD + '; on uninjured builds ' + JJ.unheldUn + ')'
    + ' | R7 on L1 ' + JJ.r7L1 + ', elsewhere injured ' + JJ.r7Other + ', on uninjured ' + JJ.r7Un + ' | number-only anywhere ' + JJ.numOnly + ' | L1 uninjured byte-identical ' + JJ.l1UnSame + '/' + JJ.l1Un + ' (ruled ' + J_UNINJ + ')'
    + ' | other lattices: held ' + JJ.heldOtherOK + '/' + JJ.heldOther + ', unheld identical ' + JJ.unheldOtherSame + '/' + JJ.unheldOther);
  JJ.ex.forEach(s => console.log('      ' + s));
  ok(R.j, selfAll && JJ.held === J_HELD && JJ.heldOK === J_HELD && JJ.burpees === J_BURPEES && JJ.unheld === J_UNHELD && JJ.unheldSame === J_UNHELD && JJ.r7L1 === J_HELD && JJ.r7Un === 0
    && JJ.numOnly === 0 && JJ.l1Un === J_UNINJ && JJ.l1UnSame === J_UNINJ && JJ.heldOtherOK === JJ.heldOther && JJ.unheldOtherSame === JJ.unheldOther,
    'R7 on ' + JJ.heldOK + ' of ' + JJ.held + ' held, unheld ' + JJ.unheldSame + '/' + JJ.unheld + ', number-only ' + JJ.numOnly + ', uninjured R7 ' + JJ.r7Un + ', L1 uninjured ' + JJ.l1UnSame + '/' + JJ.l1Un);

  // the object row (b): defined here, called above
  function objectRow(){
    const r = { n:0, same:0, rec:0, boot:0, undo:0, pre:0, ph:0, store:0, ex:[] };
    const P0 = plainVM('B'); const st0 = clone(P0.buildProgram(clone(L9.mario_noinj))); Object.assign(st0, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(L9.mario_noinj) });
    const ST = JSON.stringify(st0); const W5 = st0.weeks[5] || {};
    const V = { C:{ X:appVM('C'), Y:appVM('C') }, B:{ X:appVM('B'), Y:appVM('B') } };
    const setup = X => { X.localStorage.clear(); X.ctx.__SP = JSON.parse(ST); E(X, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); };
    const bootFrom = (src, dst) => { const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); };
    const dayJ = (X, d) => J(JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[5].' + d + ')')));
    for(const d of Object.keys(W5)){ const dy = W5[d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name) return; const o = {};
      for(const t of ['C', 'B']){ const { X, Y } = V[t]; setup(X); E(X, "currentWeek=5;currentDayKey='" + d + "';"); X.ctx.__D = E(X, 'activeProg.weeks[5].' + d);
        let tg = []; try { tg = Array.from(E(X, '__cands(__D,5,' + JSON.stringify(it.name) + ')')); } catch(e){} if(!tg.length) return;
        for(const to of tg.slice(0, 2)){ const cur = JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[5].' + d + '.sections[' + si + '].items[' + ii + '])'));
          X.ctx.__c = { secIdx:si, itemIdx:ii, name:cur.name, detail:cur.detail }; X.ctx.__to = to; try { E(X, '__T.length=0;_swapCtx=__c;applySwapChoice(__to);'); } catch(e){} }
        const item = J(JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[5].' + d + '.sections[' + si + '].items[' + ii + ']||null)'))), day = dayJ(X, d);
        const recRaw = E(X, "localStorage.getItem('ia_swaps_PM')") || ''; const rec = recRaw ? J(JSON.parse(recRaw)) : '';
        bootFrom(X, Y); const boot = dayJ(Y, d);
        const curN = JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[5].' + d + '.sections[' + si + '].items[' + ii + ']||{})')).name || '';
        const chip = E(X, 'swapOriginOf(' + JSON.stringify(curN) + ')') || ''; if(chip){ try { E(X, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){} }
        const undo = dayJ(X, d);
        const stores = ['ia_programs', 'ia_hist_PM', 'ia_swaps_PM'].map(k => E(X, "localStorage.getItem('" + k + "')") || '').join('\n') + '\n' + ['ia_programs', 'ia_hist_PM', 'ia_swaps_PM'].map(k => E(Y, "localStorage.getItem('" + k + "')") || '').join('\n');
        o[t] = { tg:tg.slice(0, 2).join('>'), item, day, rec, boot, undo, stores }; }
      if(!o.C || !o.B) return; r.n++;
      if(o.C.tg === o.B.tg && o.C.item === o.B.item && o.C.day === o.B.day) r.same++; else if(r.ex.length < 3) r.ex.push('W5 ' + d + ' ' + it.name + ' ' + o.C.tg + ' vs ' + o.B.tg + ': ' + o.C.item.slice(0, 160) + ' vs ' + o.B.item.slice(0, 160));
      if(o.C.rec === o.B.rec) r.rec++; if(o.C.boot === o.B.boot) r.boot++; if(o.C.undo === o.B.undo) r.undo++;
      r.pre += cnt(o.C.item + o.C.day + o.C.boot + o.C.undo, '"_preHold"'); r.ph += cnt(o.C.rec, '"ph"'); r.store += cnt(o.C.stores, '_preHold') + cnt(o.C.stores, '"ph"'); })); }
    return r;
  }
}

// ── f ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const lit = n => E(XF, 'typeof ' + n + "==='string'?" + n + ':null');
  const held = lit('INJ_HELD_TEST'), test = lit('TEST_RX_TEXT');
  const litOK = held === R7_T && test === TEST_T;
  const viaConst = held !== null ? stripAll([held])[0] : null;
  const outs = stripAll(STRIP_HAND.map(r => r[0]));
  const handBad = []; STRIP_HAND.forEach(([d, w], i) => { const want = w === null ? d : w; if(outs[i] !== want) handBad.push(JSON.stringify(d).slice(0, 70) + ' -> ' + JSON.stringify(outs[i]).slice(0, 70) + ' want ' + JSON.stringify(want).slice(0, 70)); });
  // L9 (built here when the baseline arm did not run)
  if(!Object.keys(L9CARDS).length){ const X = lensVM('C'); Object.keys(L9).forEach(k => { L9CARDS[k] = buildIn(X, L9[k]).cards; L9CARDS[k].forEach(c => { if(!CUE_RE.test(c.det) && c.det !== R7_T) DISTINCT.add(c.det); }); }); }
  const pop = []; Object.keys(L9).forEach(k => (L9CARDS[k] || []).forEach(c => { if(!CUE_RE.test(c.det) && c.det !== R7_T) pop.push(c.det); }));
  const po = stripAll(pop); let falseStrips = 0; pop.forEach((d, i) => { if(po[i] !== d) falseStrips++; });
  const tank = (L9CARDS.manny || []).filter(c => /tank/.test(c.det)).map(c => c.det); const to = stripAll(tank); let tankBad = 0; tank.forEach((d, i) => { if(to[i] !== d) tankBad++; });
  const dist = [...DISTINCT]; const dout = stripAll(dist); let distBad = 0; const dEx = []; dist.forEach((d, i) => { if(dout[i] !== d){ distBad++; if(dEx.length < 3) dEx.push(JSON.stringify(d).slice(0, 120)); } });
  console.log('    f INJ_HELD_TEST ' + (held === R7_T ? '== R7 typed' : JSON.stringify(held)) + ' | TEST_RX_TEXT ' + (test === TEST_T ? '== test typed' : JSON.stringify(test)) + ' | _stripCapCue(INJ_HELD_TEST) ' + (viaConst === TEST_T ? '=== TEST_RX_TEXT' : JSON.stringify(viaConst))
    + ' | hand strings ' + (STRIP_HAND.length - handBad.length) + '/' + STRIP_HAND.length + ' | L9 non-cue cards false strips ' + falseStrips + '/' + pop.length + ' (ruled ' + NONCUE_L9 + ') | HALF_MANNY "tank" cards ' + tank.length + ' (ruled ' + MANNY_TANK + '), stripped ' + tankBad
    + ' | distinct non-cue details of every build false strips ' + distBad + '/' + dist.length);
  handBad.forEach(s => console.log('      ' + s)); dEx.forEach(s => console.log('      false strip ' + s));
  ok(R.f, litOK && viaConst === TEST_T && test !== null && stripAll([test])[0] === TEST_T && handBad.length === 0 && pop.length === NONCUE_L9 && falseStrips === 0 && tank.length === MANNY_TANK && tankBad === 0 && dist.length > 0 && distBad === 0,
    'constants ' + (litOK ? 'as typed' : 'NOT as typed') + ', strip(INJ_HELD_TEST) ' + (viaConst === TEST_T ? '=== TEST_RX_TEXT' : 'WRONG') + ', hand ' + handBad.length + ' wrong, false strips ' + falseStrips + '/' + pop.length + ', tank ' + tankBad + '/' + tank.length + ', distinct ' + distBad + '/' + dist.length);
}

// ── g ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const X = plainVM('C');
  const kinds = ['3×10' + OLDC, '3×10' + NEWC, '2×10 each' + OLDC, '2×10 each' + NEWC].map(d => E(X, '_addRxKind(' + JSON.stringify(d) + ',' + JSON.stringify(STEP) + ')'));
  const bare = E(X, '_addRxKind(' + JSON.stringify('3×10') + ',' + JSON.stringify(STEP) + ')');
  const fenceOK = kinds.every(k => k === null) && bare !== null && bare !== undefined;
  if(!PW.pw){ const V = lensVM('C'); for(const [set, list] of [['L432', grid(['commercial', 'crossfit', 'home_full', 'bodyweight'])], ['HB', grid(['home_basic'])]]) list.forEach(x => buildIn(V, x.c).cards.forEach(c => {
    if(POWER.test(c.det) || /^Power/.test(c.label)){ PW.pw++; if(CUE_RE.test(c.det)) PW.cued++; } })); }
  // loaded-to-loaded, live and after a boot replay, on a stored MARIO knee/wa program built on the candidate
  const st = clone(plainVM('C').buildProgram(clone(L9.mario))); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(L9.mario) }); const ST = JSON.stringify(st);
  const PV = plainVM('C'); const patOK = [KB, SSDL, SUMO, RDL].every(n => (E(PV, '_pattern(' + JSON.stringify(n) + ')') || null) === PAT_TYPED[n] && !CAP_KNEE.includes(PAT_TYPED[n]));
  const res = []; let allOK = fenceOK && patOK && PW.pw > 0 && PW.cued === 0;
  for(const p of L2L){
    const A = appVM('C'), Bt = appVM('C'); A.localStorage.clear(); A.ctx.__SP = JSON.parse(ST);
    E(A, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();");
    const dy = E(A, 'activeProg.weeks[' + p.w + '].' + p.d); let L = null;
    ((dy && dy.sections) || []).forEach((s, si) => { if(clean(s.label).indexOf(p.sec) !== 0) return; (s.items || []).forEach((it, ii) => { if(!L && it && clean(it.name) === p.from) L = { si, ii }; }); });
    if(!L){ allOK = false; res.push(p.from + ': slot not found on W' + p.w + ' ' + p.d + ' ' + p.sec + ' (fixture moved)'); continue; }
    const slot = (Z) => { const it = E(Z, 'activeProg.weeks[' + p.w + '].' + p.d + '.sections[' + L.si + '].items[' + L.ii + ']'); return it ? { n:clean(it.name), d:String(it.detail || '') } : { n:'(none)', d:'' }; };
    E(A, 'currentWeek=' + p.w + ";currentDayKey='" + p.d + "';__T.length=0;"); const pre = slot(A);
    const offered = Array.from(E(A, '__cands(activeProg.weeks[' + p.w + '].' + p.d + ',' + p.w + ',' + JSON.stringify(pre.n) + ')')).includes(p.to);
    A.ctx.__c = { secIdx:L.si, itemIdx:L.ii, name:pre.n, detail:pre.d }; A.ctx.__to = p.to; E(A, '_swapCtx=__c;applySwapChoice(__to);');
    const live = slot(A), toast = Array.from(E(A, '__T')).join(' / ');
    const ls = new Map(A.localStorage._map); Bt.localStorage.clear(); for(const [k, v] of ls) Bt.localStorage.setItem(k, v);
    E(Bt, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); const boot = slot(Bt);
    const good = pre.d === p.d0 && offered && live.n === p.to && live.d === p.d0 && boot.n === p.to && boot.d === p.d0 && toast === p.toast;
    if(!good) allOK = false;
    res.push('W' + p.w + ' ' + p.d + ' [' + p.sec + '] ' + p.from + ' ' + JSON.stringify(pre.d) + ' -> ' + live.n + ' live ' + JSON.stringify(live.d) + ', boot ' + JSON.stringify(boot.d) + ', offered ' + offered + ', toast ' + JSON.stringify(toast) + ' -> ' + (good ? 'verbatim' : 'MOVED'));
  }
  console.log('    g _addRxKind ' + JSON.stringify(kinds) + ' on the cued details, ' + JSON.stringify(bare) + ' on the bare dose | POWER cards on the injured lattices ' + PW.pw + ', cued ' + PW.cued + ' | patterns typed == classifier ' + patOK);
  PW.bad.forEach(s => console.log('      cued power: ' + s)); res.forEach(s => console.log('      ' + s));
  ok(R.g, allOK, 'fence ' + (fenceOK ? 'holds' : 'BROKEN') + ', power cued ' + PW.cued + '/' + PW.pw + ', loaded-to-loaded ' + res.filter(s => s.endsWith('verbatim')).length + '/' + L2L.length + ' verbatim');
}
done();
'''
if os.path.exists(OUT):
    sys.exit('REFUSED: ' + OUT + ' already exists; this script writes it once and never overwrites')
CHECKS = [
    ("const ERA = 229, BASE_ERA = 228;", 1),
    ("const V228_COMMIT = '2c1a89c85fc5c3193b8646a49fe94eed3f221fb1';", 1),
    ("const CUE_RE = / — hold RPE 7, (?:two|three) in the tank$/;", 1),
    ("const R7_T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';", 1),
    ("const TEST_T = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';", 1),
    ("console.log('\\nPASS ' + pass + ' FAIL ' + fail);", 1),
]
for anchor, want in CHECKS:
    n = GATE.count(anchor)
    if n != want:
        sys.exit('ABORT: anchor count ' + str(n) + ' != ' + str(want) + ': ' + anchor[:80])
if re.search(re.escape(chr(92)) + 'u[0-9a-fA-F]{4}', GATE):
    sys.exit('ABORT: a backslash-u escape is typed into the gate')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(GATE)
print('wrote ' + OUT + ' (' + str(len(GATE.encode('utf-8'))) + ' bytes)')
