// g221_d177_swapfloor.js — GATE for D177 (P-SWAPFLOOR): a swapped Main is prescribed the way the engine would have
// prescribed the candidate in that slot.
//
//   node tests/gates/g221_d177_swapfloor.js <candidate.html> [baseline_V220.html]
//   IA_ASSUME_VERSION=221 node tests/gates/g221_d177_swapfloor.js <tree stamped 220> [baseline_V220.html]   (pre-bump dev only)
//
// THE RULING THIS DEFENDS: tests/measure/v221_rulings/p_swapfloor_ruling.md (R1, R2, R4, R5, RR1, RR2, RR3, RR4, RR5,
// "Gate scope ... gatekeeper must prove" items 1 to 4, RE-BASELINE ON V219) and the Rule and Floor table sections of
// p_swapfloor_ruling.v1.md (R3 there superseded by RR4). Mario (2026-09-23): the KB swing stays on strength Main swaps,
// floored 10–15. D-code D177, ships on ia-version 221.
//
// ORACLE. Hand-typed, never asked of the engine:
//   HAND_FLOOR   the floor table as the ruling adopts it ("all from _REP_FLOOR as it stands", RR1 rows, RR4 literal
//                `landmine (reverse lunge|rotational press)` in the unilateral [6,10] row). G2 is typed from RR1 by name.
//   GRAM         the wave Main grammar `S×R — RPE ` (R2), parsed by a gate-side regex; the rewrite keeps every byte but
//                the rep token (R1). Toast copy is R5's sentence and the V119 sentences, typed.
//   EXPG / EXPT  Mario's card and toast, the ruling's own strings.
//   DOCTRINE     knee/workaround copy "Jumps are out." is the oracle for the injury filter re-run (G7-1b).
//   Identity rows (G5) take the day's own JSON before the swap as the oracle: undo must give it back byte for byte.
// OBSERVATION is the live path: applySwapChoice / undoSwap / refreshProgram / buildProgram inside the harness VM.
//
// VERSION PREDICATE (standing rulings 2 and 4). D177 ships at 221.
//   below 221      REFUSED, every assertion row FAILS by name.
//   221 and up     hand and class rows (G1 G2 G3 G5 G6 G7-1 G7-2a G8b) assert.
//   229 and up     D193's build half (V229): G3a G3c G3d G3e G3f and G6a assert D177's claim BENEATH THE PLAN'S HOLD
//                  (tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 4 "The rules", (l) predicate and R8 trigger
//                  restated; tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r)) by the hand oracle under
//                  "V229 D193 ERA" below, on each row's whole population, and pin as a conjunct how many cards and toasts
//                  moved against D177's own comparison: G3a 832, G3c power 0 / off grammar 168, G3d 263, G3e 202, G3f 199,
//                  G6a 1,243 (D194 Amendment 3: from 229 G6a's V119 "changed [0,0] pair" is judged on the donor read
//                  beneath its hold) (0 on V228, so each re-keyed row fails there). Fixture presentation (`cfg.injury` stored);
//                  app equivalence is D194 part 2's row. Below 229 these rows assert exactly as before.
//   231 and up     (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, class D196-1 at the swap sheet; standing
//                  rulings 2 and 4) the same six rows read a second pin table, D193_PIN_V231: G3a 839, G3c power 0 / off
//                  grammar 172, G3d 263, G3e 205, G3f 199, G6a 1,253 (229 and 230 keep the table above). G3a, G3c, G3e
//                  and G6a carry one more conjunct: the moved pairs whose donor is `Single-leg hip thrust (shoulders on
//                  bed)` (the D196-1 bodyweight lowback/workaround card that was `Burpees` on V230) count G3a 7, G3c off
//                  grammar 4, G3e 3, G6a toast 10 (typed pins, the ruling's print; the D198 re-ruling states the four
//                  figures unchanged by D198; V230 has 0 such donors, so each re-keyed row fails there). Below 231 the
//                  rows assert as before.
//   pair rows      G4a G7-4 G8a assert only on D177's build pair: candidate 221 against baseline 220 (argv[3] when it
//                  reads 220, else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS. G9 asserts on 221 only.
//   minimum rows   G4b and G4c run from 221 up (Version scope, post-V233): Landmine rotations and Dumbbell renegade rows
//                  are named no-change under _swapDetailFor against V220 at every version, so off the pair they load
//                  V220 themselves (argv[3] when it reads 220, else git 8ee4385). No V220: FAIL, never PASS.
//   IA_ASSUME_VERSION=221 lifts a file stamped 220 to 221 for a pre-bump development run. It is announced, and it is
//   ignored on any file not stamped exactly 220. gate.sh never sets it.
// GATE-SCOPE ITEM 2, RESTATED (RE-RULING ON V220 (swap durability), item 3): "Frozen-day re-swap: a day with an
//   `ia_hist_` snapshot at `4×3`, re-swapped through `applySwapChoice`, shows the window live (G7-2a). Whether that
//   re-swap survives a reboot is not D177's claim; it is P-SWAPDURABLE's." The reboot assertion is row 1 of
//   P-SWAPDURABLE's gate (item 4). This gate carries no row for it.
//
// ROWS
//   G1a  Mario's card: commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308, W5 Thu, Barbell box
//        squat -> Dumbbell goblet squat via applySwapChoice prints EXPG.            G1b  the toast is EXPT.
//   G2   _repFloor equals the hand table on 14 named movements.
//   G3   lite lattice L1 (seed 76308), every Main and Power swap pair, live applySwapChoice, hand parse and hand table:
//        G3a 0 changes outside the rep token   G3b 0 land under their window   G3c 0 power pairs and 0 off-grammar Main
//        donors change   G3d donors at or above the floor stay verbatim   G3e null-row pairs stay verbatim
//        G3f every pair under its window prints exactly the hand rewrite (and there are some).
//   G4   (pair) L1: 0 _pattern-null items differ under _swapDetailFor, candidate vs V220, while Main swap pairs do;
//        G4b Landmine rotations, G4c Dumbbell renegade rows: named no-change, present on the lattice.
//   G5   G5a L1 swap then undo leaves day.sections byte-identical (clock fields stripped) on every pair;
//        G5b including Close-grip bench press -> Dips; G5c a CONSTRUCTED duplicate-name day (tap, tap both, reboot
//        re-apply); G5d a legacy record without rx: name back, no throw, record cleared.
//   G6   G6a L1: the third toast fires exactly when the hand window fires, V119 copy on a changed [0,0] pair,
//        "Same job, same numbers." otherwise; G6b home_basic Dumbbell decline press -> Dips keeps the V119 copy;
//        G6c Dumbbell Romanian deadlift 4×6 -> Kettlebell single-leg deadlift prints "Same job, same numbers." verbatim.
//   G7   G7-1a cfg.exSwapPrefs {Barbell box squat: Dumbbell goblet squat}: the window on every week the pref lands, on a
//        build and on a reboot with W1 frozen (W1 byte-identical to its snapshot); cfg not mutated.
//        G7-1b the injury filter still re-runs after a pref (Box jumps pref: healthy lands it, knee/workaround drops it).
//        G7-2a a day restored from an ia_hist_ snapshot at 4×3, re-swapped through applySwapChoice, shows the window live.
//        G7-2a is gate-scope item 2 as restated above.   G7-4 (pair) lite lattice L2 at a second seed: 0 cards change
//        against V220.
//   G8   G8a (pair) L2: 0 add-path details change against V220. G8b addedDetailFor's fallback is `3×10 — RPE 7`: in the
//        Main grammar and at or above every hand window's low end, so no window can move it.
//   G9   HALF_MANNY digest 0ac7da6b1691a8e1 on the candidate, self-stable (221 only; standing ruling 5, no era row).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';
let pass = 0, fail = 0, skip = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
const EXPG = '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const EXPT = 'Dumbbell goblet squat in, barbell box squat out. The load runs out before the reps do here. Same sets, same effort. Reps move to 8 to 12.';
const DONOR_M = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
// The floor table as ruled. Order matters (first match wins), exactly as the table reads.
const HAND_FLOOR = [
  // null row (RR1: "the NULL row carries verbatim"): the wave's own barbell compounds, exact names
  [/^(barbell bench press|incline barbell press|close-grip bench press|barbell row|pendlay row|deadlift|sumo deadlift|trap bar deadlift|romanian deadlift|back squat|front squat|paused back squat|box squat|overhead press|push press|good mornings)$/i, null],
  // V119 unloadable rows [0,0] (kept exactly as V119 wrote them, R2)
  [/foot on chair|hands on bed|shoulders on bed|under a table|\(anchored\)|partner\/anchor/i, [0, 0]],
  [/banded|resistance band|band pull-apart/i, [0, 0]],
  [/glute bridge|bodyweight back extension|45° back extension/i, [0, 0]],
  [/nordic|glute-ham|\bghr\b/i, [0, 0]],
  [/inverted row|prone y-t-w|reverse snow angel/i, [0, 0]],
  [/wall sit|wall walk|assisted pistol|spanish squat/i, [0, 0]],
  [/\bdips\b|pushup|push-up|pike pushup/i, [0, 0]],
  [/squat \(slow/i, [0, 0]],
  // load-ceilinged windows (v1 Floor table, RR1)
  [/goblet/i, [8, 12]],
  [/pull-through|pull through/i, [8, 12]],
  [/straight-arm pulldown/i, [8, 12]],
  [/kettlebell swing|\bswing\b/i, [10, 15]],                 // Mario 2026-09-23: kept, 10–15
  [/hip thrust/i, [6, 10]],
  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6, 10]],   // RR4 literal
  [/\brow\b/i, [6, 10]],
  [/dumbbell|kettlebell|\bdb\b|\bkb\b/i, [5, 8]],
  [/leg press|hack squat|machine|pulldown/i, [5, 8]],
  [/cable|crossover|pec deck|\bfly\b|flye/i, [8, 12]],
];
const handFloor = n => { for(const [re, w] of HAND_FLOOR) if(re.test(String(n || ''))) return w; return null; };
const HAND_G2 = [['Dumbbell goblet squat', [8, 12]], ['Kettlebell swing', [10, 15]], ['Barbell hip thrust', [6, 10]],
  ['Zercher single-leg deadlift', [6, 10]], ['Landmine reverse lunge', [6, 10]], ['Landmine rotational press', [6, 10]],
  ['Landmine rotations', null], ['Dumbbell row', [6, 10]], ['Dumbbell bench press', [5, 8]], ['Leg press', [5, 8]],
  ['Cable lateral raise', [8, 12]], ['Back squat', null], ['Barbell box squat', null], ['Step-ups (KB)', [6, 10]]];
const GRAM = /^(\d+)×(\d+)(?:–(\d+))? — RPE /;                       // R2: the wave Main grammar
const REP_TOKEN = /^(\d+)×\d+(?:–\d+)?/;
const handRewrite = (d, w) => d.replace(REP_TOKEN, (m, s) => s + '×' + w[0] + '–' + w[1]);
const stripRep = s => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');
// D190: the plan's cue is a second live-path writer outside `_swapDetailFor`; D177's claim is the rep token.
// So G3c's power and off-grammar compares are cue-blind above 226: the exact suffix is removed from both sides,
// once, before comparing. Typed here, never read from the engine. At 226 and below this is identity. The cue
// byte itself is in D190's gate's custody (tests/measure/v227_rulings/d190_swapseam_ruling.md, Gates).
// V228 D193 R1 (split, Mario round 2; Amendment 2 "g227 gates": "`cueBlind` strips both wordings, the same shape as R4"):
// the cue is recognised by shape, V227's "two" and V228's "three", still only above 226.
const D190_CUE_RE = / — hold RPE 7, (?:two|three) in the tank$/;
function cueBlind(s){ if(!(VER > 226 && typeof s === 'string')) return s; const m = D190_CUE_RE.exec(s); return m ? s.slice(0, m.index) : s; }
function handKind(n, D){
  const W = handFloor(n);
  if(W === null) return { k:'null', W };
  if(W[1] === 0) return { k:'zero', W };
  const m = GRAM.exec(D || '');
  if(!m) return { k:'offgram', W };
  if(+m[2] < W[0]) return { k:'win', W, out:handRewrite(D, W) };
  return { k:'atfloor', W };
}
const T3 = (to, from, w) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Same sets, same effort. Reps move to ' + w[0] + ' to ' + w[1] + '.';
const T119 = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here, so take the sets to the same effort.';
const TSAME = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. Same job, same numbers.';
const DOCTRINE_KNEE = 'Jumps are out.';
const FALLBACK = '3×10 — RPE 7';

// ── V229 D193 ERA: D177's claim beneath the plan's hold (D193's build half, D194 part 1) ────────────────────────
// THE RULINGS THIS DEFENDS above 228 (standing rulings 2 and 4; the predicate reads the artifact's own ia-version):
//   tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 2 gate claims (l) "D177's claim is verbatim beneath the
//   plan's hold" and (k) "G6a's hand kind gains a `hold` flag from the hand cap table plus a hand RPE parse";
//   Amendment 4 "The rules": the (l) predicate ("On uncapped targets the card equals the donor read beneath its hold by
//   the hand stripper (both cue wordings; R7 text → `_testRx` text), byte-verbatim after that. On capped targets the
//   card equals the hand hold applied to the stripped donor (number 7, gloss by shape per Amendment 1 §3, R7 text for
//   the test prose, rep token unchanged).") and the R8 trigger restated ("the clamp changed the RPE of the dose it was
//   handed: the donor read beneath its hold (`_stripCapCue`), converted for the target where the target is unloadable
//   (`_bwSetsFromDetail`'s bucket)"); its corrected claims "Rows to absorb on CF3 with the V228 figure 0: G3a 832, G3d
//   263, G3e 202, G3f 199, G3c-off 168. G3c power 0 | 0." and (k) "0 false claims"; and
//   tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r): "g221 G3a 832 / G3c off-grammar 168, power 0 /
//   G3d 263 / G3e 202 / G3f 199 (D193 Amendment 4)"; and its Amendment 3, which replaces (r)'s G6a clause: "`g221` G6a
//   **1,243 of 150,068** (D193 R8, Amendment 4 (k)): at 229 and up the V119 'changed [0,0] pair' is judged against the
//   donor read beneath its hold, the (l) lens; every moved toast ends with the hold sentence and its pair's clamp
//   changed the number by the (k) hand oracle; 0 hand clamp pairs lack it; the 148,825 others equal the hand formula".
// Fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
// HAND ORACLE, typed here, never asked of the engine (the engine's _pattern only names a target's pattern, the input
// the plan's filter itself reads; every expected card and toast is computed below):
//   CAP_HAND    the plan's cap per region and tier, the three cells L1 carries (measure's M8 hand table,
//               tests/measure/v229_caprpe_cf3.js :29). An injury with no row throws: a missing row fails loudly.
//   stripHand   the donor read beneath its hold: both cue wordings (D193 R4); R7's held-test text by shape (its fixed
//               clauses, the RPE number free) -> the strength test text (Amendment 3 section 2).
//   holdHand    the hold on a capped target, the filter's two-way rule: no RPE named -> the cue (predicate unchanged);
//               the strength test text -> R7's text (R7); a named RPE above 7, a range by its top, -> 7 with the RPE 7
//               gloss for its shape (Amendment 1 section 3: bwsets `(leave 3 or more in reserve)`, wave `(leave ~3 reps
//               in reserve)`, loadCapped `(leave ~3 in reserve)`; the @ RPE grammar gets no gloss).
//   rpeHand     a hand RPE parse (the highest number named, a range by its top). bucketHand: the unloadable reader's
//               bucket (Amendment 3 section 1: 6 for RPE 6.x, light or easy; 7 for RPE 7.x; else 8), applied only where
//               the reader converts (CONVERTS_HAND): an unloadable target and a donor that names a rep target `S×R`
//               (D177/V119: "a swap onto a movement with no load to move, where a rep target is a guess rather than an
//               instruction"); any other donor, the test prose included, carries unconverted: R8's verbatim branch.
//   T3H T119H TSAMEH  R8's three hold toasts (Amendment 2 R8), typed.
// Each re-keyed row asserts the (l) predicate on its whole population (capped target: the card is holdHand of D177's
// card on the stripped donor; uncapped: D177's card on the stripped donor) and pins how many cards moved against D177's
// own comparison. G6a (D194 Amendment 3): the hand toast formula's V119 "changed [0,0] pair" is judged on the donor
// read beneath its hold (wantT9; the V228 line runs unchanged below 229); every moved toast is the hold variant of its
// hand kind on a hand clamp pair, every hand clamp pair's toast moved, and the moved count is pinned at (k)'s 1,243.
const D193_ERA = 229;
const D193_PIN = { G3a:832, G3cPow:0, G3cOff:168, G3d:263, G3e:202, G3f:199, G6a:1243 };   // G6a: D194 Amendment 3 (replaces Amendment 1 (r)'s 1,252), D193 Amendment 4 (k)
// V231 (absorb ruling section 3, g221 ABSORB, class D196-1): the second pin table for ia-version 231 and up, and the moved
// pairs it adds, all on one donor name, typed from the ruling's print (never this run).
const D193_V231_ERA = 231;
const D193_PIN_V231 = { G3a:839, G3cPow:0, G3cOff:172, G3d:263, G3e:205, G3f:199, G6a:1253 };
const BED_DONOR = 'Single-leg hip thrust (shoulders on bed)', BED_PIN_V231 = { out:7, off:4, nul:3, t:10 };
const CAP_HAND = { knee:{ workaround:['squat', 'lunge', 'leg_iso'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'] }, shoulder:{ protect:[] } };
const CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/;
const CUE3_HAND = ' — hold RPE 7, three in the tank';
const TEST_RX_HAND = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7_HAND = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TEST_SHAPE_HAND = /^Work up to one heavy set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
const R7_SHAPE_HAND = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
const stripHand = d => typeof d !== 'string' ? d : R7_SHAPE_HAND.test(d) ? TEST_RX_HAND : d.replace(CUE_HAND, '');
function holdHand(d){
  if(typeof d !== 'string' || !d) return d;
  if(!/RPE/.test(d)) return d + CUE3_HAND;
  if(TEST_SHAPE_HAND.test(d)) return R7_HAND;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if(!(Math.max(+a, b ? +b : 0) > 7)) return t;
    if(!g) return 'RPE 7';
    return /^stop/.test(gl) ? 'RPE 7 (leave 3 or more in reserve)' : /^heaviest/.test(gl) ? 'RPE 7 (leave ~3 in reserve)' : 'RPE 7 (leave ~3 reps in reserve)';
  });
}
const rpeHand = d => { const re = /RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/g; let m, best = null; while((m = re.exec(String(d || '')))){ const v = Math.max(+m[1], m[2] ? +m[2] : 0); if(best === null || v > best) best = v; } return best; };
const CONVERTS_HAND = /^\s*\d+\s*[×x]\s*\d/;
const bucketHand = d => /rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8;
function capHand(cfg, to){
  if(!cfg || !cfg.injury) return false;
  const r = CAP_HAND[cfg.injury.region], c = r && r[cfg.injury.tier];
  if(!c) throw new Error('g221: no hand cap row for ' + cfg.injury.region + '/' + cfg.injury.tier);
  return c.indexOf(patE(clean(to))) >= 0;
}
const HOLD_HAND = ' Your injury plan holds this one at RPE 7.';
const T3H = (to, from, w) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Reps move to ' + w[0] + ' to ' + w[1] + '.' + HOLD_HAND;
const T119H = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here.' + HOLD_HAND;
const TSAMEH = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. Same sets, same reps.' + HOLD_HAND;
const S9 = { capPairs:0, bA:0, bOff:0, bAt:0, bNull:0, bWin:0, mvT:0, bT:0, missT:0, clampT:0, ex:{} };
const BED9 = { out:0, off:0, nul:0, t:0 };   // V231: moved pairs whose donor is BED_DONOR (G3a, G3c off grammar, G3e, G6a toast), every tree
const note9 = (k, s) => { (S9.ex[k] = S9.ex[k] || []).length < 3 && S9.ex[k].push(s); };
const exs9 = k => (S9.ex[k] || []).map(s => ' | e.g. ' + s).join('');

// ── FIXTURES ─────────────────────────────────────────────────────────────────
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLOCK = /^_?(ts|at|time|stamp|clock|now)$/i;
const J = v => JSON.stringify(v, (k, x) => CLOCK.test(k) ? undefined : x);
function mk(t, f, x, g, i, seed){
  const race = !!g.id && /half/.test(g.id);
  return { name:'M', primaryPath:g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes:g.id ? ['run'] : [],
    cardioGoals:g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted:race, raceDate:race ? '2026-12-06' : null, liftingFocus:f, experience:x, ageBracket:'18-35', equipment:t, unit:'lbs',
    restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench:135, squat:155, deadlift:185, seed, ...(i.v ? { injury:i.v } : {}) };
}
const LO = { k:'liftonly', id:null }, HALF = { k:'half', id:'run_half' }, PACE = { k:'pace', id:'run_pace_goal' };
const INJ = (r, t) => ({ k:r + '/' + t, v:{ region:r, tier:t } }), HEALTHY = { k:'healthy', v:null };
const TIERS = ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'];
const FOCUS = ['support_prevention', 'support_strength', 'hypertrophy', 'strength'];
const L1 = [], L2 = [];
for(const t of TIERS) for(const f of FOCUS) for(const x of ['beginner', 'advanced']) for(const g of [LO, HALF])
  for(const i of [HEALTHY, INJ('knee', 'workaround'), INJ('lowback', 'workaround'), INJ('shoulder', 'protect')]) L1.push(mk(t, f, x, g, i, 76308));
for(const t of TIERS) for(const f of FOCUS) for(const g of [LO, PACE, HALF])
  for(const i of [HEALTHY, INJ('knee', 'workaround'), INJ('hip', 'workaround')]) L2.push(mk(t, f, 'intermediate', g, i, 51407));
const MARIO = () => mk('commercial', 'support_strength', 'beginner', LO, INJ('knee', 'workaround'), 76308);

// ── ROWS (static, so a refused era fails every one by name) ──────────────────
const R = {
  G1a:"G1a Mario's card (commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308, W5 Thu): Barbell box squat -> Dumbbell goblet squat via applySwapChoice prints `" + EXPG + '`',
  G1b:'G1b the toast is `' + EXPT + '`',
  G2:'G2 _repFloor equals the hand floor table on 14 named movements (RR1 rows, RR4 landmine literal, swing 10–15)',
  G3a:'G3a L1: 0 Main swap pairs change outside the rep token',
  G3b:'G3b L1: 0 Main swap pairs on a window row land under their window',
  G3c:'G3c L1: 0 power pairs change, 0 Main donors outside the S×R — RPE grammar change (R2); compare cue-blind above 226 (D190)',
  G3d:'G3d L1: donors at or above the floor stay verbatim',
  G3e:'G3e L1: null-row pairs stay verbatim',
  G3f:'G3f L1: every Main pair under its window prints exactly the hand rewrite (and some do)',
  G4b:'G4b (from 221, against V220) L1: Landmine rotations, named no-change under _swapDetailFor, present on the lattice',
  G4c:'G4c (from 221, against V220) L1: Dumbbell renegade rows, named no-change under _swapDetailFor, present on the lattice',
  G5a:'G5a L1: swap then undo leaves day.sections byte-identical on every Main and Power pair (R4)',
  G5b:'G5b L1: Close-grip bench press -> Dips -> undo restores the donor detail, day byte-identical',
  G5c:'G5c constructed duplicate-name day (RR4 re-scope): tap / tap both / reboot re-apply, then undo, byte-identical',
  G5d:'G5d legacy record without rx: undo restores the name, throws nothing, clears the record (RR3)',
  G6a:'G6a L1: the third toast fires exactly when the hand window fires; V119 copy on a changed [0,0] pair; "Same job, same numbers." otherwise',
  G6b:'G6b home_basic|strength|beginner W1 Mon: Dumbbell decline press -> Dips keeps the V119 copy',
  G6c:'G6c home_basic|strength|beginner W1 Tue: Dumbbell Romanian deadlift 4×6 -> Kettlebell single-leg deadlift prints "Same job, same numbers." and the donor verbatim',
  G71a:'G7-1a cfg.exSwapPrefs {Barbell box squat: Dumbbell goblet squat}: every week the pref lands prints the window, on a build and on a reboot with W1 frozen; cfg not mutated',
  G71b:'G7-1b the injury filter still re-runs after a pref: Box jumps lands on healthy, never on knee/workaround ("' + DOCTRINE_KNEE + '")',
  G72a:'G7-2a a day restored from an ia_hist_ snapshot at 4×3, re-swapped through applySwapChoice, shows the window live',
  G8b:'G8b addedDetailFor fallback is `' + FALLBACK + '`: Main grammar, at or above every hand window low end, left verbatim',
};

// ── RUN ──────────────────────────────────────────────────────────────────────
const t0 = Date.now();
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a pre-bump development run, not a ship proof');
}
console.log('g221 D177 | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | L1 ' + L1.length + ' configs, L2 ' + L2.length);
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D177 P-SWAPFLOOR (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// The V220 pair loader (D177's build pair, 221 vs 220: G4a, G7-4, G8a and G9 read it, and G4b and G4c on 221 through B4 = B) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
// G4b and G4c run from D177's era onward (Version scope): the named no-change under _swapDetailFor is against V220 at
// every version from 221 up, so they load V220 themselves.
let B4 = null, base4Why = '';
if(VER >= ERA){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) B4 = b; else base4Why = 'argv[3] reads ' + b.version + '; '; }
    if(!B4){
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g221d177-')), f = path.join(tmp, 'v220.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V220_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      const b = load(f); fs.rmSync(tmp, { recursive:true, force:true });
      if(+b.version === BASE_ERA){ B4 = b; base4Why += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else base4Why += 'git reads ' + b.version;
    }
  } catch(e){ base4Why += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B4 = null; }
}
const sdB4 = B4 ? B4.eval('_swapDetailFor') : null;
const minRow = (key, cond, got) => {
  if(VER >= ERA && sdB4) return ok(R[key], cond, got);
  return ok(R[key] + ' (setup: ' + base4Why + ')', false);
};
const LS = IA.localStorage;
IA.eval("globalThis.__T=null;showToast=function(m){globalThis.__T=m;};openDetail=function(){};closeSwapSheet=function(){};"
  + "renderWeekView=function(){};showScreen=function(){};bumpSwapCount=function(){return false;};activeProgId='P1';");
const sdE = IA.eval('_swapDetailFor'), rfE = IA.eval('_repFloor'), patE = IA.eval('_pattern'), scE = IA.eval('swapCandidates');
const safe = fn => { try { return fn(); } catch(e){ return [false, 'threw ' + (e && e.message)]; } };
const row = (key, fn) => { const r = safe(fn); ok(R[key], r[0], r[0] ? undefined : r[1]); };
const mainIdx = day => (day.sections || []).findIndex(s => /^main/i.test(clean(s && s.label)));
function liveSwap(prog, w, d, si, ii, to){
  IA.ctx.__P = prog; const it = prog.weeks[w][d].sections[si].items[ii];
  IA.ctx.__c = { secIdx:si, itemIdx:ii, name:it.name, detail:it.detail || '' };
  IA.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';globalThis.__T=null;_swapCtx=__c;applySwapChoice(" + JSON.stringify(to) + ')');
  return { item:prog.weeks[w][d].sections[si].items[ii], toast:IA.eval('globalThis.__T') };
}

// G1 Mario's card
row('G1a', () => {
  LS.clear(); const cfg = MARIO(), p = IA.buildProgram(cfg); p.cfg = cfg; const day = p.weeks[5].thu, si = mainIdx(day);
  const it = day.sections[si].items[0];
  if(clean(it.name) !== 'Barbell box squat' || it.detail !== DONOR_M) return [false, 'fixture moved: ' + it.name + ' :: ' + it.detail];
  const r = liveSwap(p, 5, 'thu', si, 0, 'Dumbbell goblet squat'); globalThis.__G1 = r.toast;
  return [r.item.name === 'Dumbbell goblet squat' && r.item.detail === EXPG, r.item.name + ' :: ' + r.item.detail];
});
row('G1b', () => [globalThis.__G1 === EXPT, globalThis.__G1]);

// G2 hand floor table
row('G2', () => {
  const bad = HAND_G2.filter(([n, w]) => JSON.stringify(rfE(n)) !== JSON.stringify(w)).map(([n, w]) => n + ' want ' + JSON.stringify(w) + ' got ' + JSON.stringify(rfE(n)));
  return [!bad.length, bad.join('; ')];
});

// L1 sweep: G3, G4, G5a/b, G6a in one pass over every Main and Power swap pair.
const S = { cfgs:0, crash:[], days:0, pairs:0, main:0, pow:0, powChg:0, offN:0, offChg:0, winN:0, winBad:0, atN:0, atBad:0, nullN:0, nullBad:0,
  zeroN:0, zeroChg:0, outside:0, under:0, underN:0, idBad:0, throws:0, toastBad:0, t3:0, pn:0,
  lr:0, lrDiff:0, rr:0, rrDiff:0, cgbp:null, ex:{} };
const note = (k, s) => { (S.ex[k] = S.ex[k] || []).length < 3 && S.ex[k].push(s); };
const exs = k => (S.ex[k] || []).map(s => ' | e.g. ' + s).join('');
for(const cfg of L1){
  let p; try { p = IA.buildProgram(cfg); } catch(e){ S.crash.push(cfg.equipment + '|' + cfg.liftingFocus + ': ' + e.message); continue; }
  S.cfgs++; const prog = Object.assign({}, p, { cfg }); IA.ctx.__P = prog;
  const tag = [cfg.equipment, cfg.liftingFocus, cfg.experience, cfg.primaryPath, cfg.injury ? cfg.injury.region + '/' + cfg.injury.tier : 'healthy'].join('|');
  for(const w of Object.keys(p.weeks)) for(const d of Object.keys(p.weeks[w])){
    const day = p.weeks[w][d]; if(!day || day.rest || !Array.isArray(day.sections)) continue;
    S.days++;
    day.sections.forEach(s => ((s && s.items) || []).forEach(it => {
      if(!it || !it.name || typeof it.detail !== 'string' || patE(it.name) != null) return;
      S.pn++; const n = clean(it.name);
      // G4b and G4c (minimum rows) read V220 through sdB4 at every version from 221 up.
      if(n === 'Landmine rotations'){ S.lr++; if(!!sdB4 && sdB4(it.name, it.detail) !== sdE(it.name, it.detail)) S.lrDiff++; }
      if(n === 'Dumbbell renegade rows'){ S.rr++; if(!!sdB4 && sdB4(it.name, it.detail) !== sdE(it.name, it.detail)) S.rrDiff++; }
    }));
    IA.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';localStorage.removeItem('ia_swaps_P1');");
    for(let si = 0; si < day.sections.length; si++){
      const L = clean(day.sections[si] && day.sections[si].label);
      const isMain = /^main/i.test(L), isPow = /^power|explosive finisher/i.test(L);
      if(!isMain && !isPow) continue;
      const nItems = (day.sections[si].items || []).length;
      for(let ii = 0; ii < nItems; ii++){
        const it0 = day.sections[si].items[ii]; if(!it0 || !it0.name || typeof it0.detail !== 'string') continue;
        let c = null; try { c = scE(clean(it0.name), day, w, prog); } catch(e){} if(!c) continue;
        const cands = [].concat(c.tier1 || [], c.tier2 || []).map(z => typeof z === 'string' ? z : z.name);
        for(const to of cands){
          const it = day.sections[si].items[ii], from = it.name, D = it.detail;
          const before = J(day.sections), raw = JSON.stringify(day.sections);
          const H = handKind(to, D), where = tag + ' W' + w + ' ' + d + ' ' + clean(from) + ' -> ' + to;
          let O = null, toast = null, after = null;
          try {
            IA.ctx.__c = { secIdx:si, itemIdx:ii, name:from, detail:D };
            IA.eval("globalThis.__T=null;_swapCtx=__c;applySwapChoice(" + JSON.stringify(to) + ')');
            O = day.sections[si].items[ii].detail; toast = IA.eval('globalThis.__T');
            IA.eval('undoSwap(' + JSON.stringify(from) + ')');
            after = J(day.sections);
          } catch(e){ S.throws++; note('throw', where + ' ' + e.message); }
          S.pairs++;
          if(after !== before){ S.idBad++; note('id', where + ' [' + H.k + ']'); }
          if(from === 'Close-grip bench press' && to === 'Dips' && !S.cgbp) S.cgbp = { where, ok:after === before, D, O };
          day.sections = JSON.parse(raw); IA.eval("localStorage.removeItem('ia_swaps_P1')");
          // G6a toast by hand kind
          const wantT = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== D) ? T119(to, from) : TSAME(to, from);
          if(toast !== wantT){ S.toastBad++; note('toast', where + ' [' + H.k + '] ' + toast); }
          if(/The load runs out before the reps do here/.test(String(toast))) S.t3++;
          // V229 D193 (k), R8 trigger restated (Amendment 4): fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
          if(VER >= D193_ERA){
            const Db9 = stripHand(D), capd9 = capHand(cfg, to);
            const conv9 = H.k === 'zero' && CONVERTS_HAND.test(Db9);   // the unloadable reader converts a named rep target only
            const pre9 = conv9 ? bucketHand(Db9) : rpeHand(H.k === 'win' ? handRewrite(Db9, H.W) : Db9);
            const clamp9 = capd9 && pre9 !== null && pre9 > 7;
            const wantH = H.k === 'win' ? T3H(to, from, H.W) : conv9 ? T119H(to, from) : TSAMEH(to, from);
            if(clamp9) S9.clampT++;
            // D194 Amendment 3: the V119 "changed [0,0] pair" is judged on the donor read beneath its hold, the (l) lens.
            const wantT9 = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== Db9) ? T119(to, from) : TSAME(to, from);
            if(toast !== wantT9){ S9.mvT++; if(clean(from) === BED_DONOR) BED9.t++; if(!(clamp9 && toast === wantH && String(toast).endsWith(HOLD_HAND))){ S9.bT++; note9('t', where + ' [' + H.k + (clamp9 ? ', hand clamp pair' : ', not a hand clamp pair') + '] ' + toast + ' | want ' + (clamp9 ? wantH : wantT9)); } }
            else if(clamp9){ S9.missT++; note9('miss', where + ' [' + H.k + '] ' + toast + ' | want ' + wantH); }
          }
          if(isPow){
            if(H.k === 'zero') continue;
            S.pow++; if(cueBlind(O) !== cueBlind(D)){ S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }
            continue;
          }
          S.main++;
          if(H.k === 'zero'){ S.zeroN++; if(O !== D) S.zeroChg++; continue; }
          if(O !== D && stripRep(O) !== stripRep(D)){ S.outside++; if(clean(from) === BED_DONOR) BED9.out++; note('out', where + ' :: ' + D + ' => ' + O); }
          if(H.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)){ S.offChg++; if(clean(from) === BED_DONOR) BED9.off++; note('off', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'null'){ S.nullN++; if(O !== D){ S.nullBad++; if(clean(from) === BED_DONOR) BED9.nul++; note('null', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'atfloor'){ S.atN++; if(O !== D){ S.atBad++; note('at', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'win'){ S.winN++; if(O !== H.out){ S.winBad++; note('win', where + ' :: ' + D + ' => ' + O); } }
          // V229 D193 (l), Amendment 4 "The rules": fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
          if(VER >= D193_ERA){
            const Db9 = stripHand(D), E9 = H.k === 'win' ? handRewrite(Db9, H.W) : Db9, capd9 = capHand(cfg, to), X9 = capd9 ? holdHand(E9) : E9;
            if(capd9) S9.capPairs++;
            if(stripRep(O) !== stripRep(X9)){ S9.bA++; note9('A', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'offgram' && cueBlind(O) !== cueBlind(X9)){ S9.bOff++; note9('off', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'null' && O !== X9){ S9.bNull++; note9('null', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'atfloor' && O !== X9){ S9.bAt++; note9('at', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'win' && O !== X9){ S9.bWin++; note9('win', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
          }
          if(H.k === 'win' || H.k === 'atfloor'){
            S.underN++; const m = GRAM.exec(O || ''); if(!m || +m[2] < H.W[0]){ S.under++; note('under', where + ' :: ' + O); }
          }
        }
      }
    }
  }
}
console.log('  L1: ' + S.cfgs + '/' + L1.length + ' builds, ' + S.days + ' training days, ' + S.pairs + ' swap pairs (' + S.main + ' Main, ' + S.pow + ' Power) | window ' + S.winN
  + ', at/over floor ' + S.atN + ', null row ' + S.nullN + ', off grammar ' + S.offN + ', [0,0] ' + S.zeroN + ' (' + S.zeroChg + ' changed) | third toast ' + S.t3
  + ' | _pattern-null items ' + S.pn + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
const crashNote = S.crash.length ? ' | build crashes ' + S.crash.length + ': ' + S.crash.slice(0, 2).join('; ') : '';
// V229 D193 era (VER >= D193_ERA): G3a G3c G3d G3e G3f and G6a assert D193 Amendment 4's (l)/(k) predicate on their
// whole population and pin the moved count (0 on V228). Fixture presentation (`cfg.injury` stored); app equivalence is
// D194 part 2's row. Below 229 each row asserts exactly as before.
// V231 (absorb ruling section 3): at 231 and up the six D9 rows read D193_PIN_V231; 229 and 230 read D193_PIN.
const D9 = VER >= D193_ERA, ERA231 = VER >= D193_V231_ERA, PIN9 = ERA231 ? D193_PIN_V231 : D193_PIN;
if(D9) console.log('  D193 era (V' + VER + '): Main pairs on a hand-capped target ' + S9.capPairs + ', hand clamp pairs (toasts) ' + S9.clampT);
if(D9) console.log('  V231 bed-thrust donor (' + BED_DONOR + ') moved pairs on this tree: G3a ' + BED9.out + ', G3c off grammar ' + BED9.off + ', G3e ' + BED9.nul + ', G6a toast ' + BED9.t + ' | pin table ' + (ERA231 ? 'D193_PIN_V231 (ia-version ' + D193_V231_ERA + ' and up)' : 'D193_PIN (229 and 230)') + ' | swap pairs ' + S.pairs);
if(D9) ok(R.G3a + ' [V229 D193 Amendment 4 (l): moved ' + S.outside + ' == pin ' + PIN9.G3a + '; card != the hand card beneath the hold ' + S9.bA + ']' + (ERA231 ? ' [V231 D196-1: bed-thrust donor moved ' + BED9.out + ' == ' + BED_PIN_V231.out + ']' : ''), !S.crash.length && S.main > 0 && S9.bA === 0 && S.outside === PIN9.G3a && (!ERA231 || BED9.out === BED_PIN_V231.out), 'moved ' + S.outside + ' of ' + S.main + ' (pin ' + PIN9.G3a + '), beneath-the-hold misses ' + S9.bA + (ERA231 ? ', bed-thrust donor moved ' + BED9.out + ' (pin ' + BED_PIN_V231.out + ')' : '') + crashNote + exs9('A') + exs('out'));
else ok(R.G3a, !S.crash.length && S.main > 0 && S.outside === 0, S.outside + ' of ' + S.main + crashNote + exs('out'));
ok(R.G3b, !S.crash.length && S.underN > 0 && S.under === 0, S.under + ' of ' + S.underN + crashNote + exs('under'));
if(D9) ok(R.G3c + ' [V229 D193 Amendment 4 (l): power moved ' + S.powChg + ' == pin ' + PIN9.G3cPow + ', off grammar moved ' + S.offChg + ' == pin ' + PIN9.G3cOff + '; off-grammar card != the hand card beneath the hold ' + S9.bOff + ']' + (ERA231 ? ' [V231 D196-1: bed-thrust donor off grammar moved ' + BED9.off + ' == ' + BED_PIN_V231.off + ']' : ''), !S.crash.length && S.pow > 0 && S.powChg === PIN9.G3cPow && S.offN > 0 && S9.bOff === 0 && S.offChg === PIN9.G3cOff && (!ERA231 || BED9.off === BED_PIN_V231.off), 'power ' + S.powChg + ' of ' + S.pow + ' (pin ' + PIN9.G3cPow + '), off grammar moved ' + S.offChg + ' of ' + S.offN + ' (pin ' + PIN9.G3cOff + '), beneath-the-hold misses ' + S9.bOff + (ERA231 ? ', bed-thrust donor off grammar moved ' + BED9.off + ' (pin ' + BED_PIN_V231.off + ')' : '') + crashNote + exs('pow') + exs9('off') + exs('off'));
else ok(R.G3c, !S.crash.length && S.pow > 0 && S.powChg === 0 && S.offN > 0 && S.offChg === 0, 'power ' + S.powChg + ' of ' + S.pow + ', off grammar ' + S.offChg + ' of ' + S.offN + crashNote + exs('pow') + exs('off'));
if(D9) ok(R.G3d + ' [V229 D193 Amendment 4 (l): moved ' + S.atBad + ' == pin ' + PIN9.G3d + '; card != the hand card beneath the hold ' + S9.bAt + ']', !S.crash.length && S.atN > 0 && S9.bAt === 0 && S.atBad === PIN9.G3d, 'moved ' + S.atBad + ' of ' + S.atN + ' (pin ' + PIN9.G3d + '), beneath-the-hold misses ' + S9.bAt + crashNote + exs9('at') + exs('at'));
else ok(R.G3d, !S.crash.length && S.atN > 0 && S.atBad === 0, S.atBad + ' of ' + S.atN + crashNote + exs('at'));
if(D9) ok(R.G3e + ' [V229 D193 Amendment 4 (l): moved ' + S.nullBad + ' == pin ' + PIN9.G3e + '; card != the hand card beneath the hold ' + S9.bNull + ']' + (ERA231 ? ' [V231 D196-1: bed-thrust donor moved ' + BED9.nul + ' == ' + BED_PIN_V231.nul + ']' : ''), !S.crash.length && S.nullN > 0 && S9.bNull === 0 && S.nullBad === PIN9.G3e && (!ERA231 || BED9.nul === BED_PIN_V231.nul), 'moved ' + S.nullBad + ' of ' + S.nullN + ' (pin ' + PIN9.G3e + '), beneath-the-hold misses ' + S9.bNull + (ERA231 ? ', bed-thrust donor moved ' + BED9.nul + ' (pin ' + BED_PIN_V231.nul + ')' : '') + crashNote + exs9('null') + exs('null'));
else ok(R.G3e, !S.crash.length && S.nullN > 0 && S.nullBad === 0, S.nullBad + ' of ' + S.nullN + crashNote + exs('null'));
if(D9) ok(R.G3f + ' [V229 D193 Amendment 4 (l): moved ' + S.winBad + ' == pin ' + PIN9.G3f + '; card != the hand rewrite beneath the hold ' + S9.bWin + ']', !S.crash.length && S.winN > 0 && S9.bWin === 0 && S.winBad === PIN9.G3f, 'moved ' + S.winBad + ' of ' + S.winN + ' (pin ' + PIN9.G3f + '), beneath-the-hold misses ' + S9.bWin + crashNote + exs9('win') + exs('win'));
else ok(R.G3f, !S.crash.length && S.winN > 0 && S.winBad === 0, S.winBad + ' of ' + S.winN + crashNote + exs('win'));
// G4a retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). It defended D177 RR5: on the build pair no _pattern-null item differed under _swapDetailFor against V220 while Main swap pairs did.
minRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);
minRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);
ok(R.G5a, !S.crash.length && S.pairs > 0 && S.idBad === 0 && S.throws === 0 && S.winN > 0 && S.zeroChg > 0,
  S.idBad + ' of ' + S.pairs + ' not identical, throws ' + S.throws + crashNote + exs('id') + exs('throw'));
ok(R.G5b, !!S.cgbp && S.cgbp.ok && S.cgbp.O !== S.cgbp.D, S.cgbp ? JSON.stringify(S.cgbp) : 'pair not on L1');
if(D9) ok(R.G6a + ' [V229 D193 (k), R8 trigger restated, D194 Amendment 3 (V119 changed judged beneath the hold): moved ' + S9.mvT + ' == pin ' + PIN9.G6a + ', every one the hold variant on a hand clamp pair (not ' + S9.bT + '), hand clamp pairs ' + S9.clampT + ' without the hold toast ' + S9.missT + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + ']' + (ERA231 ? ' [V231 D196-1: bed-thrust donor toast moved ' + BED9.t + ' == ' + BED_PIN_V231.t + ']' : ''), !S.crash.length && S.pairs > 0 && S9.bT === 0 && S9.missT === 0 && S9.mvT === PIN9.G6a && (!ERA231 || BED9.t === BED_PIN_V231.t) && S.t3 === S.winN && S.t3 > 0, 'moved ' + S9.mvT + ' of ' + S.pairs + ' (pin ' + PIN9.G6a + '), not a hold variant on a hand clamp pair ' + S9.bT + ', hand clamp pair without it ' + S9.missT + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + (ERA231 ? ', bed-thrust donor toast moved ' + BED9.t + ' (pin ' + BED_PIN_V231.t + ')' : '') + exs9('t') + exs9('miss'));
else ok(R.G6a, !S.crash.length && S.pairs > 0 && S.toastBad === 0 && S.t3 === S.winN && S.t3 > 0, S.toastBad + ' of ' + S.pairs + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + exs('toast'));

// G5c constructed duplicate-name day, G5d legacy record
const store = () => JSON.parse(LS.getItem('ia_swaps_P1') || '{}');
function fixtureM(){
  LS.clear(); const cfg = MARIO(), p = IA.buildProgram(cfg), prog = Object.assign({}, p, { cfg }), day = prog.weeks[5].thu, si = mainIdx(day);
  IA.ctx.__P = prog; IA.eval("activeProg=__P;activeProgId='P1';currentWeek=5;currentDayKey='thu';"); return { prog, day, si };
}
function tap(day, si, ii, to){ const it = day.sections[si].items[ii]; IA.ctx.__c = { secIdx:si, itemIdx:ii, name:it.name, detail:it.detail || '' };
  IA.eval('_swapCtx=__c;applySwapChoice(' + JSON.stringify(to) + ')'); }
const DUP = '2×4 — RPE 8 (leave ~2 reps in reserve), 3 min rest';   // hand-written, differs from the donor, under the goblet window
function inject(day, si){ const X = day.sections[si].items[0].name, tsi = day.sections.findIndex((s, k) => k !== si && s && Array.isArray(s.items));
  day.sections[tsi].items.push({ name:X, detail:DUP }); return { X, tsi, tii:day.sections[tsi].items.length - 1 }; }
row('G5c', () => {
  const bad = [];
  { const { day, si } = fixtureM(), { X } = inject(day, si), before = J(day.sections);
    tap(day, si, 0, 'Dumbbell goblet squat'); IA.eval('undoSwap(' + JSON.stringify(X) + ')');
    if(J(day.sections) !== before) bad.push('tap A, undo'); }
  { const { day, si } = fixtureM(), { X, tsi, tii } = inject(day, si), before = J(day.sections);
    tap(day, si, 0, 'Dumbbell goblet squat'); tap(day, tsi, tii, 'Dumbbell goblet squat'); IA.eval('undoSwap(' + JSON.stringify(X) + ')');
    if(J(day.sections) !== before) bad.push('tap A, tap B, undo'); }
  { const { day, si } = fixtureM(), { X, tsi, tii } = inject(day, si), before = J(day.sections);
    tap(day, si, 0, 'Dumbbell goblet squat'); IA.ctx.__S = store(); IA.eval('applySessionSwaps(activeProg,__S)');
    const renamed = day.sections[tsi].items[tii].name === 'Dumbbell goblet squat';
    IA.eval('undoSwap(' + JSON.stringify(X) + ')');
    if(!renamed) bad.push('reboot re-apply did not rename B (fixture)'); else if(J(day.sections) !== before) bad.push('tap A, reboot re-apply, undo: B ' + day.sections[tsi].items[tii].detail); }
  return [!bad.length, bad.join('; ')];
});
row('G5d', () => {
  const { day, si } = fixtureM(), X = day.sections[si].items[0].name;
  tap(day, si, 0, 'Dumbbell goblet squat');
  const s = store(); s.w5_thu = (s.w5_thu || []).map(e => ({ from:e.from, to:e.to, ts:e.ts })); LS.setItem('ia_swaps_P1', JSON.stringify(s));
  let threw = null; try { IA.eval('undoSwap(' + JSON.stringify(X) + ')'); } catch(e){ threw = e.message; }
  const it = day.sections[si].items[0];
  return [threw === null && it.name === X && !store().w5_thu, 'threw ' + threw + ', ' + it.name + ', record ' + JSON.stringify(store().w5_thu || null)];
});

// G6b / G6c named pairs
function namedPair(cfg, w, d, fromName, to){
  LS.clear(); const p = IA.buildProgram(cfg), prog = Object.assign({}, p, { cfg }), day = prog.weeks[w][d];
  let si = -1, ii = -1; day.sections.forEach((s, a) => { if(si < 0 && /^main/i.test(clean(s.label))) (s.items || []).forEach((x, b) => { if(ii < 0 && clean(x.name) === fromName){ si = a; ii = b; } }); });
  if(si < 0) return { miss:'fixture moved: no Main ' + fromName + ' on W' + w + ' ' + d };
  const D = day.sections[si].items[ii].detail, r = liveSwap(prog, w, d, si, ii, to); return { D, O:r.item.detail, toast:r.toast };
}
const HB = () => mk('home_basic', 'strength', 'beginner', LO, HEALTHY, 76308);
row('G6b', () => { const r = namedPair(HB(), 1, 'mon', 'Dumbbell decline press', 'Dips'); if(r.miss) return [false, r.miss];
  return [r.toast === T119('Dips', 'Dumbbell decline press') && r.O !== r.D && !GRAM.test(r.O), r.toast + ' :: ' + r.O]; });
row('G6c', () => { const r = namedPair(HB(), 1, 'tue', 'Dumbbell Romanian deadlift', 'Kettlebell single-leg deadlift'); if(r.miss) return [false, r.miss];
  const m = GRAM.exec(r.D || '');
  return [!!m && +m[2] === 6 && r.O === r.D && r.toast === TSAME('Kettlebell single-leg deadlift', 'Dumbbell Romanian deadlift'), r.D + ' => ' + r.O + ' :: ' + r.toast]; });

// G7-1a build path and reboot with W1 frozen
row('G71a', () => {
  LS.clear(); const PREF = { 'Barbell box squat':'Dumbbell goblet squat' };
  const c0 = MARIO(), p0 = IA.buildProgram(c0), cP = Object.assign(MARIO(), { exSwapPrefs:Object.assign({}, PREF) }), cPj = JSON.stringify(cP);
  const pp = IA.buildProgram(cP); const bad = [];
  if(JSON.stringify(cP) !== cPj) bad.push('cfg mutated by buildProgram');
  const slots = [];
  Object.keys(p0.weeks).forEach(w => Object.keys(p0.weeks[w]).forEach(d => { const a = p0.weeks[w][d]; if(!a || !Array.isArray(a.sections)) return;
    a.sections.forEach((s, k) => (s.items || []).forEach((x, j) => { if(x.name === 'Barbell box squat') slots.push({ w, d, k, j, D:x.detail }); })); }));
  const want = sl => { const H = handKind('Dumbbell goblet squat', sl.D); return H.k === 'win' ? H.out : sl.D; };
  const wins = slots.filter(sl => handKind('Dumbbell goblet squat', sl.D).k === 'win');
  const at = (P, sl) => { const y = P.weeks[sl.w] && P.weeks[sl.w][sl.d]; const x = y && y.sections && y.sections[sl.k] && y.sections[sl.k].items[sl.j]; return x || {}; };
  slots.forEach(sl => { const x = at(pp, sl); if(x.name !== 'Dumbbell goblet squat' || x.detail !== want(sl)) bad.push('build W' + sl.w + ' ' + sl.d + ' ' + x.name + ' :: ' + x.detail); });
  // reboot: stored program carries the pref, W1's box squat day was trained (ia_hist_), no clock so the cut is 2
  const w1 = slots.filter(sl => +sl.w === 1)[0];
  if(!w1) bad.push('fixture: no W1 box squat');
  else {
    const stored = JSON.parse(JSON.stringify(pp)); Object.assign(stored, { id:'PF', name:'F', created:1, startDate:null, cfg:JSON.parse(cPj) });
    const snap = JSON.parse(JSON.stringify(p0.weeks[1][w1.d]));
    IA.ctx.__SP = stored; IA.eval('savePrograms([__SP]);');
    LS.setItem('ia_hist_PF', JSON.stringify({ ['w1_' + w1.d]:snap }));
    const rb = IA.eval("refreshProgram(getPrograms().find(function(x){return x.id==='PF';}))");
    if(J(rb.weeks[1][w1.d]) !== J(snap)) bad.push('frozen W1 ' + w1.d + ' not byte-identical to its snapshot');
    slots.filter(sl => +sl.w > 1).forEach(sl => { const x = at(rb, sl); if(x.name !== 'Dumbbell goblet squat' || x.detail !== want(sl)) bad.push('reboot W' + sl.w + ' ' + sl.d + ' ' + x.name + ' :: ' + x.detail); });
  }
  return [slots.length > 1 && wins.length > 0 && !bad.length, 'pref slots ' + slots.length + ', under window ' + wins.length + '; ' + bad.slice(0, 4).join('; ')];
});
row('G71b', () => {
  const html = IA.html.replace(/^\s*\/\/.*$/gm, '');
  const doctrine = html.indexOf(DOCTRINE_KNEE) >= 0;
  const PREF = { 'Barbell box squat':'Box jumps' }, count = P => { let n = 0; Object.values(P.weeks).forEach(W => Object.values(W).forEach(D =>
    ((D && D.sections) || []).forEach(s => ((s && s.items) || []).forEach(x => { if(x && /jump/i.test(x.name || '')) n++; })))); return n; };
  const h = MARIO(); delete h.injury; h.exSwapPrefs = Object.assign({}, PREF);
  const k = Object.assign(MARIO(), { exSwapPrefs:Object.assign({}, PREF) });
  const nh = count(IA.buildProgram(h)), nk = count(IA.buildProgram(k));
  return [doctrine && nh > 0 && nk === 0, 'doctrine ' + doctrine + ', healthy jump items ' + nh + ', knee/workaround ' + nk];
});

// G7-2 frozen day: ia_hist_ snapshot at 4×3, restored on boot, re-swapped live (gate-scope item 2, restated)
row('G72a', () => {
  LS.clear(); const cfg = MARIO(), p = IA.buildProgram(cfg);
  const stored = JSON.parse(JSON.stringify(p)); Object.assign(stored, { id:'PH', name:'H', created:1, startDate:null, cfg:MARIO() });
  const snap = JSON.parse(JSON.stringify(p.weeks[5].thu)), si = mainIdx(snap);
  if(clean(snap.sections[si].items[0].name) !== 'Barbell box squat' || snap.sections[si].items[0].detail !== DONOR_M) return [false, 'fixture moved'];
  IA.ctx.__SP = stored; IA.eval('savePrograms([__SP]);'); LS.setItem('ia_hist_PH', JSON.stringify({ w5_thu:snap }));
  const boot = () => IA.eval("activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PH';}));activeProgId='PH';currentWeek=5;currentDayKey='thu';activeProg.weeks[5].thu");
  const day = boot(); const restored = J(day) === J(snap);
  IA.ctx.__c = { secIdx:si, itemIdx:0, name:day.sections[si].items[0].name, detail:day.sections[si].items[0].detail };
  IA.eval("globalThis.__T=null;_swapCtx=__c;applySwapChoice('Dumbbell goblet squat')");
  const live = IA.eval('activeProg.weeks[5].thu').sections[si].items[0], toast = IA.eval('globalThis.__T');
  return [restored && live.name === 'Dumbbell goblet squat' && live.detail === EXPG && toast === EXPT, 'restored ' + restored + ', live ' + live.name + ' :: ' + live.detail + ' :: ' + toast];
});

// G7-4 and G8a retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). They defended D177 on its build pair (221 vs 220): over L2 no engine card and no add-path detail moved against V220.

// G8b the add-path fallback, read from the candidate's source (comments stripped)
row('G8b', () => {
  const i = IA.js.indexOf('function addedDetailFor('), k = IA.js.indexOf('\nfunction ', i + 1);
  if(i < 0 || k < 0) return [false, 'addedDetailFor not found'];
  const body = IA.js.slice(i, k).replace(/^\s*\/\/.*$/gm, '');
  const m = body.match(/return\s+('(?:[^'\\]|\\.)*')\s*;\s*\}\s*$/);
  if(!m) return [false, 'no trailing literal return'];
  const lit = Function('"use strict";return ' + m[1])();
  const g = GRAM.exec(lit), lows = HAND_FLOOR.filter(r => r[1] && r[1][1] !== 0).map(r => r[1][0]), maxLo = Math.max.apply(null, lows);
  const probes = ['Dumbbell goblet squat', 'Kettlebell swing', 'Barbell hip thrust', 'Landmine rotational press', 'Dumbbell row', 'Leg press', 'Cable lateral raise'];
  const moved = probes.filter(n => sdE(n, lit) !== lit);
  return [lit === FALLBACK && !!g && +g[2] >= maxLo && !moved.length, JSON.stringify(lit) + ' grammar ' + !!g + ' low ' + (g && g[2]) + ' vs max window low ' + maxLo + ' moved ' + moved.join(',')];
});

// G9 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). It defended standing ruling 5 at D177: the HALF_MANNY digest typed for 221, self-stable.
console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
done();
