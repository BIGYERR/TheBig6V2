// g231_d195_hipext.js — GATE for D195 P-HIPEXT (V231): Amendment 2's A (the runner armor circuit's fourth item,
// the prevention hip extension subset sited after the reservation and registering the whole pool, the four-item
// allowance read live on the card, the fourth item rank 3 in both trims) and D195-B (the budget's cost lens prices the
// prehab rails at half). Gate run 1 carried D195-A-a and D195-A-c; gate run 2 adds D195-A-d and D195-A-e; gate run 5
// adds D195-A-b and D195-A-f (the prevention shard).
//
//   node tests/gates/g231_d195_hipext.js <candidate.html> [baseline_V230.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, D195 Amendment 2, "Gate rows this re-ruling
//   needs (keyed VER ≥ 231)":
//   D195-A-a  "HALF_MANNY era row 231 = `2d35e8f743680cfa`; conjuncts: B-alone counterfactual `0ac7da6b1691a8e1`,
//             A-without-B counterfactual `f5ed630033ebe3db`; `prog._swapUniverse` size 86 and set == V230's typed list;
//             all 12 Tue W1–W12 carry a fourth circuit item `Single-leg hip thrust` with detail `2×6–10 each @ RPE 7`;
//             calf string W1–W14 `YYY-YYY-YYY---`; carry string `YYY-YYY-YYY---`; W13/W14 and every non-Tuesday ==
//             V230's cards." Session call: the prior row's `14aacbced1c527d7` conjunct is NOT carried (printed by
//             coach1, never re-printed by the session).
//   D195-A-c  "pure function, `capRegionalFatigue(list,'legs',cardio,'support_prevention')`: (i) Main 3 sets + four-item
//             circuit (lunge, hold, hinge, hip thrust, 2 sets each) + calf 2 sets, cardio null → unchanged; (ii) the
//             same with a three-item circuit plus a pattern-bearing `Leg isolation` item (five moves, no four-item
//             circuit) → one item trimmed; (iii) list (i) with a hard-run cardio object (`_cardioInterference` ≥ 1.4) →
//             exactly the circuit's index-3 item leaves, lunge/hold/hinge/calf stay. V230 fails (i)."
//   D195-A-d  "pure function, `capSessionBudget` on a hand-built legs day with a four-item circuit (hold `2×25 sec`),
//             calf, hip rail (one stretch, two band items), foot/ankle, `Loaded carry finisher 3×40 yards`, a two-item
//             optional core block: at 20.5 the carry leaves; at 22 the carry then the core block's later item; at 23.5
//             the carry, the spare core item, then the circuit's index-3 item, never the hold or calf. Typed cells:
//             shoulder/protect | commercial | beginner | s1234 | sun,wed | race W2 tue reads a four-item circuit, the
//             calf line and no carry at 231 (V230: three-item circuit, no carry); W3 mon of shoulder/protect | test |
//             commercial | intermediate | s87747 | sat,sun reads `Wall sit 2×25 sec` at circuit position 2 and three
//             items." Context (A6): "rank 3 with item rank 0: the carry (32) goes first, the optional core block's spare
//             item (30, later position) second, the thrust third"; B prices `_isHalf` names and members of
//             EXLIB.hip_stability, knee_stability, foot_ankle, foot_ankle_bw at 0.5x; stretches cost 0.
//   D195-A-e  "g215 F2: floor (b) fires on {home_full} only, home_full 84/126 at 231, commercial/crossfit/home_basic/
//             bodyweight 0/126, prevention cells 0/90."
//   D195-A-b  "prevention shard (FULL prevention at s76308 and s87747, both rests, six tiers, three families, plus INJ
//             prevention shoulder/protect, elbow/protect, knee/protect, ankle/protect on commercial and bodyweight): per
//             runner leg day, item multiset after == V230's + B's restorations + at most one circuit item; removals only
//             from a `Loaded carry finisher` or an optional/core block; circuit positions 1–2 names == V230's; `Calf —
//             achilles armor` present wherever V230 has it; non-runner prevention leg days carry a three-item circuit;
//             knee/protect circuit length == V230's. Fails on V230 (no fourth item on runner days)."
//   D195-A-f  "universe on the prevention shard: every non-bodyweight program's `prog._swapUniverse` set == V230's;
//             bodyweight lowback programs == V230 ∪ {`Single-leg hip thrust (shoulders on bed)`}; every other program ==
//             V230."
//   Session calls 6–8 (tests/measure/v231_rulings/v231_session_calls.md) set A-b's oracle to the A step (the NOT-A tree:
//             baseline + slices 1, 4, 5 and slice 6's D197 re-filter), its non-runner clause to "byte-identical to NOT-A",
//             and add bodyweight lowback prevention cells to A-f's set.
//   Regressions line (same ruling, final class list): "any change to circuit positions 1–2 at the A step; any fourth item
//             on knee/protect or on a non-runner prevention day; any name lost from any swap universe".
//   D-code D195 (Amendment 2 + B), ships on ia-version 231. HALF_MANNY moves by this ruling only: the ruling printed
//   2d35e8f743680cfa first (ABx = PREx = ALLx, universe 86), standing ruling 5.
//
// VERSION PREDICATE (standing rulings 2 and 4). Every row RUNS on every tree; `VER >= 231` (VER = the candidate's
//   ia-version meta) is the first conjunct of every row. A tree below 231 is never skipped or refused: its rows FAIL by
//   their own conjuncts as well as by the predicate (the run-against-the-previous-version proof). On V230 as candidate
//   the expected failures are: D195-A-a version, digest (0ac7da6b1691a8e1), era row, the candidate-carries-the-surgery
//   sub-conjuncts of both counterfactuals, the 12 Tuesday fourth items; D195-A-c version and (i) (V230's move cap 4 cuts
//   the calf from a card that holds five moves); D195-A-d version, the three hand lists (V230 has no A6, so the thrust
//   scores 10 not 30, and no B, so foot & ankle prices at full and every list reads 2 sets heavier) and both typed
//   cells (V230's W2 tue circuit has three items; its W3 mon circuit has two, the hold and the calf gone); D195-A-e
//   version and home_full (79, not 84); D195-A-b version, b-notA (the presence check: V230 carries none of the 7 NOT-A
//   replacements), b-fourth (0/1,544 appended), and by their own conjuncts against NOT-A (V230 lacks B, D196, D197):
//   b-add (9 D196 days), b-rem (212 days), b-circ (106), b-calf (120 of 1,290); b-nonrun (528/528) and b-knee (95/95)
//   hold on V230; D195-A-f version and f-bwlb (0/8: V230's bodyweight lowback universes lack the bed thrust).
//
// PRESENTATION. HALF_MANNY is `fixtures.HALF_MANNY` (cfg.seed 76308) with the clock pinned to 2026-08-24 12:00 (the
//   coach's surgery clock); every build is in a fresh VM; `id` and `created` are stripped from day JSON; every digest is
//   the harness's progDigest (clock fields and the universe stripped). Each tree's HALF_MANNY is built twice in two VMs
//   and must equal itself before anything is compared (an unstable tree FAILS the row, never diffs).
//
// ORACLES. Nothing below asks the candidate's engine what the answer should be.
//   LITERAL       the ruling's printed digests (2d35e8f743680cfa, 0ac7da6b1691a8e1, f5ed630033ebe3db), the ruling's
//                 strings (calf and carry `YYY-YYY-YYY---`, the fourth item's name and detail), the ruling's verdicts on
//                 the three hand-built lists (unchanged / one item trimmed / exactly index 3 leaves).
//   TYPED V230    V230_UNIVERSE (86 names), V230_DAY (sha256/16 of every HALF_MANNY day's JSON, W1–W14 × 7) and
//                 V230_TUE (the three runner armor circuit items of W1–W12 Tuesday). Taken ONCE from the V230 baseline
//                 (scratchpad/base_v230.html == `git show 71c76d8:index.html`, ia-version 230) by builder's probe on
//                 2026-10-04, same presentation as above, and typed here; the gate never asks the baseline for them.
//                 The baseline is re-read in this run only to prove the typed tables are V230's (instrument conjunct
//                 a-inst): V230 digest 0ac7da6b1691a8e1 self-identical, universe == V230_UNIVERSE, days 98/98 ==
//                 V230_DAY, Tuesday circuits == V230_TUE.
//   COUNTERFACTUALS  in-gate source surgery on the BASELINE text (the smaller construction): B-alone = V230 + slice 1's
//                 one replacement (tests/edits/v231_s1_d195b_cost.py); A-without-B = V230 + slice 2's four and slice 3's
//                 three replacements (tests/edits/v231_s2_d195_a3c_a5.py, v231_s3_d195_a1x_a2r_a6.py). The texts are
//                 typed below (copied from those scripts). Every anchor is asserted count == 1 on the working text and
//                 every replacement text count == 1 in the CANDIDATE (the surgery is the candidate's own code, so on a
//                 tree that lacks it the counterfactual conjunct FAILS by name); a miss is a FAIL, never a skip.
//   HAND          D195-A-c's cardio object, derived from `_cardioInterference`'s source (read 2026-10-04, index.html
//                 :9604): type 'run' → base 1.0; subtype 'Speed Run — Intervals' lower-cased matches the hard-quality
//                 scan /interval|\bint\b|speed run|.../ → intensity 1.4 (no dose key, so the subtype scan decides);
//                 detail '' → no miles, no minutes → distBump 0; return +(1.0 × 1.4 + 0).toFixed(2) = 1.4, which is
//                 ≥ 1.4. _legCut = round(1.4 × 3) = 4, so the legs set cap falls 14 → 10 under the 11 sets of list (i).
//   HAND (A-d)    the three legs days' totals and trim walks are worked item by item in the comments on dDay below,
//                 from the ruling's pricing and from capSessionBudget's source as read 2026-10-04 (index.html :10574:
//                 cap = max(12, SESSION_SET_BUDGET 20 − round(_cardioInterference(null) 0 × 2)) = 20; trim score
//                 (A6) = (index ≥ 3 in a `Leg circuit` section ? 3 : section rank) × 10 + item rank; ties go to the
//                 later position). The expected survivors are the ruling's verdicts; the gate never asks the engine.
//   TYPED CARDS (A-d)  the two cells' cfgs are coach's INJ lattice constructor (tests/measure/v231_coach2_surgery.js
//                 mk(), cfg.injury set directly, seed pinned), clock 2026-08-24 12:00. CARD_231_F1, CARD_231_FH and
//                 CARD_V230_F1 are coach's printed cards (tests/measure/v231_coach2_surgery.cards3.out.txt lines 43–48
//                 [ABx], 115–120 [B == ABx], 28–33 [V]); coach printed no V230 card for the W3 mon cell, so
//                 CARD_V230_FH is one build of the V230 baseline by builder gate run 2 on 2026-10-04 (same clock and
//                 cfg), typed. Instrument conjunct d-inst re-reads the baseline to prove the two V230 cards.
//   LATTICE (A-e) g215's knee/protect lattice LAT_K (630 = 5 tiers × 6 goals × 7 foci × 3 experiences) and its F2
//                 method, copied from tests/gates/g215_d149_ghd.js: a copy of the candidate with floor (b) written out
//                 (FB_FROM → FB_TO, anchor count 1); the floor fired on a config iff the two progDigests differ. Clock
//                 pinned 2026-08-24 as coach measured it (g215 itself runs on the live clock).
//
// ROWS
//   D195-A-a  conjuncts a-ver, a-digest, a-era, a-cfB, a-cfA, a-uni, a-tue, a-calf, a-carry, a-other, a-inst.
//   D195-A-c  conjuncts c-ver, c-hand (the engine reads the hand cardio at 1.4), c-i, c-ii, c-iii, each list unmutated.
//   D195-A-d  conjuncts d-ver, d-fix (the hand totals are 20.5 / 22 / 23.5), d-20.5, d-22, d-23.5 (each: the ruled
//             items leave, nothing else does, the hold and the calf stay, the input is unmutated), d-cellA, d-cellB,
//             d-inst.
//   D195-A-e  conjuncts e-ver, e-anchor, e-lattice (630 built, 126 per tier, 90 prevention cells, 0 crashed),
//             e-home_full (84/126), e-others (commercial, crossfit, home_basic, bodyweight 0/126), e-prev (0/90).
//   D195-A-b  conjuncts b-ver, b-notA (the NOT-A tree: 10 anchors count 1, every replacement once in the candidate, built
//             264/264, self-identical in two VMs), b-shard (264 = 216 FULL + 48 INJ, 0 crashed, hand runner predicate ==
//             cfg), b-fourth (runner leg days with the appended circuit item > 0, non-runner 0, knee/protect 0), b-add,
//             b-rem, b-circ, b-calf, b-nonrun (byte-identical to NOT-A), b-knee (see the ORACLE note above rowAb). Prints
//             the A-4 tallies NOT-A -> candidate (never asserted).
//   D195-A-f  conjuncts f-ver, f-shard (272 = the A-b shard + 8 bodyweight lowback prevention cells; universes present,
//             V230's self-identical in two VMs), f-nonbw, f-bwlb (denominator >= 1), f-other.
//   STATUS gate run 5 parked D195-A-b as first written (its V230 + B-restorations oracle charged 9 D196-1/D196-2 days to
//             A and its "three-item circuit" shorthand is false on V230 itself); session calls 6–8
//             (tests/measure/v231_rulings/v231_session_calls.md) unparked it in the form below (gate run 5b).
//   The era-row conjunct (a-era) reads harness MANNY_DIGEST_BY_VERSION[231]; row existence is a conjunct so an absent
//   row fails loudly (standing ruling 5). Until the era-row run lands it FAILS by name.
//
// Temp files: the two counterfactual trees, the NOT-A tree and (if needed) the git copy of V230 go under os.tmpdir() (the runner sets
//   TMPDIR to its scratch path) and are removed on exit.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION, DAYS } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 231, BASE_ERA = 230, V230_COMMIT = '71c76d8';
const CLOCK = '2026-08-24';

// ── LITERALS FROM THE RULING ──────────────────────────────────────────────────────────────────────────────────────
const DIG_231 = '2d35e8f743680cfa';     // era row 231 (ABx = PREx = ALLx)
const DIG_BALONE = '0ac7da6b1691a8e1';  // B alone (unmoved)
const DIG_ANOB = 'f5ed630033ebe3db';    // Ax: the amended A without B
const DIG_V230 = '0ac7da6b1691a8e1';    // V230 (the baseline's own digest; instrument)
const CALF_STR = 'YYY-YYY-YYY---';
const CARRY_STR = 'YYY-YYY-YYY---';
const FOURTH = ['Single-leg hip thrust', '2×6–10 each @ RPE 7'];
const CIRCUIT_RE = /^Leg circuit — runner armor/;

// ── TYPED V230 TABLES (builder probe on scratchpad/base_v230.html, 2026-10-04; see header) ─────────────────────────
const V230_UNIVERSE = [
  "45° back extension", "Ab wheel rollouts", "Back squat", "Ball slams",
  "Banded dorsiflexion", "Banded monster walks", "Banded side steps", "Barbell Romanian deadlift",
  "Barbell bench press", "Barbell good mornings", "Barbell hip thrust", "Barbell overhead press",
  "Barbell push press", "Barbell row", "Bench dips", "Bird dogs",
  "Broad jumps", "Burpees", "Chinups", "Clamshells w/ band",
  "Close-grip bench press", "Dead bugs", "Deadlift", "Decline pushups",
  "Diamond pushups", "Dips", "Dumbbell Arnold press", "Dumbbell Bulgarian split squat",
  "Dumbbell bench press", "Dumbbell decline press", "Dumbbell floor press", "Dumbbell front raise",
  "Dumbbell goblet side lunge", "Dumbbell incline press", "Dumbbell lateral raise", "Dumbbell rear delt fly",
  "Dumbbell row", "Dumbbell seated calf raise", "Dumbbell skullcrushers", "Dumbbell split-stance deadlift",
  "Dumbbell standing calf raise", "Farmer carry", "Feet-elevated inverted rows", "Front squat",
  "Glute-ham raise", "Hanging knee raises", "Hip 90/90 stretch", "Hip airplane (light KB)",
  "IT band stretch", "Incline barbell press", "Inverted rows (bodyweight)", "Inverted rows (rings)",
  "Jump squats", "Kettlebell single-arm press", "Kettlebell single-arm row", "Kettlebell single-leg deadlift",
  "Kettlebell swing", "L-sit chinups", "L-sit hold", "Landmine reverse lunge",
  "Landmine rotational press", "Mountain climbers", "Neutral-grip chinups", "Overhead carry",
  "Overhead dumbbell extension", "Pendlay row", "Plank hold", "Pushups (slow tempo)",
  "Reverse lunge (KB)", "Seated banded hip flexion", "Single-leg bent-knee soleus raise", "Single-leg hip thrust",
  "Spanish squat hold (KB)", "Standing ankle CARs", "Standing band hip abduction", "Step-ups (KB)",
  "Suitcase carry", "Sumo deadlift", "Terminal knee extension (band)", "Tibialis raise (wall lean)",
  "Trap bar deadlift", "Walking lunge (KB)", "Wall sit", "Weighted 90/90 hip switch",
  "Weighted chinups", "Worlds greatest stretch",
];
// sha256(JSON.stringify(day, id/created stripped)).slice(0,16), HALF_MANNY on V230, keyed '<week> <day>'
const V230_DAY = {
  "1 mon":'c0d84ce6011d7e7c', "1 tue":'55ce8104e7bad873', "1 wed":'fa159962594d33b0', "1 thu":'14dd1e66b1a3ae7a', "1 fri":'0d6ed6acaa6055d7', "1 sat":'211a3c9f4d108953', "1 sun":'fa159962594d33b0',
  "2 mon":'33332cbfcfe9127a', "2 tue":'c2175b55e3ab6e78', "2 wed":'fa159962594d33b0', "2 thu":'b469137a4a707150', "2 fri":'0e512014e4f95ebd', "2 sat":'90efa200eeb75c81', "2 sun":'fa159962594d33b0',
  "3 mon":'2d064c81bb0905f2', "3 tue":'a6187302d3854862', "3 wed":'fa159962594d33b0', "3 thu":'9e9cc3c784bd7773', "3 fri":'8e2036cd9f32a804', "3 sat":'56223dd2180a3bcb', "3 sun":'fa159962594d33b0',
  "4 mon":'6e2ca3aa41991df1', "4 tue":'a64b3af28ae9fe03', "4 wed":'fa159962594d33b0', "4 thu":'5b7a4e4776fb4b8f', "4 fri":'d3f5e8d2c9842315', "4 sat":'50f04567852c4b86', "4 sun":'fa159962594d33b0',
  "5 mon":'9dcd2e8d00c17b22', "5 tue":'25a5f77341e2a45b', "5 wed":'fa159962594d33b0', "5 thu":'58fb122f0577796a', "5 fri":'8cd82e71a701d394', "5 sat":'e67f96ed99ad305b', "5 sun":'fa159962594d33b0',
  "6 mon":'c92fd4f0bbaf5a59', "6 tue":'f8c68a8e6c1f3fcd', "6 wed":'fa159962594d33b0', "6 thu":'d65b6c6be76ce9b4', "6 fri":'3ac3d1e41d7a37e2', "6 sat":'e1935ee70dd60553', "6 sun":'fa159962594d33b0',
  "7 mon":'44a6dd98cbda64f4', "7 tue":'4ccd6534759389f0', "7 wed":'fa159962594d33b0', "7 thu":'b78a1fb0c8dc2935', "7 fri":'cc044ac413f9a537', "7 sat":'def39124560e6a07', "7 sun":'fa159962594d33b0',
  "8 mon":'b69667d778d7dbc3', "8 tue":'a59fa073282d1057', "8 wed":'fa159962594d33b0', "8 thu":'856c56c1f08ca23f', "8 fri":'c29c006d1729f14d', "8 sat":'10fdbb4ead063666', "8 sun":'fa159962594d33b0',
  "9 mon":'97306dea53973bf0', "9 tue":'a96d0723fb14abf7', "9 wed":'fa159962594d33b0', "9 thu":'6259ccc936ecfe34', "9 fri":'6ca71468a71e3eac', "9 sat":'f62601811d11153c', "9 sun":'fa159962594d33b0',
  "10 mon":'77654ae03a106463', "10 tue":'88c4b700dd6c6234', "10 wed":'fa159962594d33b0', "10 thu":'cca3faf5ce848c2d', "10 fri":'54e9a4a9a213f753', "10 sat":'3d52bafc3e81a4cd', "10 sun":'fa159962594d33b0',
  "11 mon":'b652611c8b0f6ae0', "11 tue":'3bf90959356995f1', "11 wed":'fa159962594d33b0', "11 thu":'1b2c4b71069d7799', "11 fri":'d19a5741c4716c60', "11 sat":'fd37ed4dfe2879f1', "11 sun":'fa159962594d33b0',
  "12 mon":'b0d804228e153983', "12 tue":'51dd54e422f31714', "12 wed":'fa159962594d33b0', "12 thu":'6abb3ab4d998048a', "12 fri":'a8ab552be2acb91d', "12 sat":'e9bb15bec0635ae0', "12 sun":'fa159962594d33b0',
  "13 mon":'6eea7b6b3ca9c188', "13 tue":'a47952d009c47e36', "13 wed":'fa159962594d33b0', "13 thu":'4ad0bc7a983293ab', "13 fri":'26c45647cf42a5f8', "13 sat":'a7afdafacc4f1366', "13 sun":'fa159962594d33b0',
  "14 mon":'cebd9dfa91c44846', "14 tue":'f17b55362a476853', "14 wed":'fa159962594d33b0', "14 thu":'f3445b57d934f1c7', "14 fri":'fa159962594d33b0', "14 sat":'8420c349584f9c65', "14 sun":'bbcb0443bfe004e0',
};
// the runner armor circuit on V230's W1–W12 Tuesday (three items: lunge, hold, hinge), [name, detail]
const V230_TUE = {
  1:  [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Barbell Romanian deadlift', '2×6–10 @ RPE 7']],
  2:  [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Barbell Romanian deadlift', '2×6–10 @ RPE 7']],
  3:  [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell swing', '2×8']],
  4:  [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell swing', '2×8']],
  5:  [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Kettlebell swing', '2×8']],
  6:  [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Kettlebell swing', '2×8']],
  7:  [['Walking lunge (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
  8:  [['Walking lunge (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
  9:  [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Dumbbell split-stance deadlift', '2×6–10 @ RPE 7']],
  10: [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Dumbbell split-stance deadlift', '2×6–10 @ RPE 7']],
  11: [['Step-ups (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
  12: [['Step-ups (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
};

// ── SURGERY TEXTS (typed from tests/edits/v231_s1/s2/s3; old -> new) ──────────────────────────────────────────────
const S1 = [
  ['s1 B _cost membership',
   "  const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
   "  const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };"],
];
const S2_RANK2 = "    if(/superset b|biceps|triceps|leg isolation|calves|accessory|pump|chest \\+ knee/.test(L)) return 2;\n";
const S2_CAPFOR = "  const _capFor = r => Math.max(6, _setCap(r) - (r==='legs' ? _legCut : _uppCut));\n";
const S2_S3 = [
  ['s2 A5 rank line', S2_RANK2, "    if(/^leg circuit/.test(L)) return (itemIdx>=3) ? 3 : 2;\n" + S2_RANK2],
  ['s2 A3c _moveCapFor', S2_CAPFOR, S2_CAPFOR + "  const _moveCapFor = r => _moveCap(r) + ((role==='legs' && r==='legs' && out.some(s=>/^leg circuit/i.test((s&&s.label)||'')&&((s&&s.items)||[]).length>=4)) ? 1 : 0);\n"],
  ['s2 A3c overAmt read', "      ((regionMoves[r]||0)-_moveCap(r))*4\n", "      ((regionMoves[r]||0)-_moveCapFor(r))*4\n"],
  ['s2 A3c over read',
   "      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCap(r))\n",
   "      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCapFor(r))\n"],
  ['s3 A1x',
   "    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n  };\n",
   "    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n  };\n"
   + "  if(preventionSupport){ _swapUniverseAdd(hipExtPool); hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through'); }\n"],
  ['s3 A2r',
   "        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[\n"
   + "          {name:ex.lunge[0],detail:'2×10 each'},\n"
   + "          {name:ex.kneeStab,detail:'2×25 sec'},\n"
   + "          {name:ex.hinge[0],detail:'2×8'}]});\n",
   "        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[\n"
   + "          {name:ex.lunge[0],detail:'2×10 each'},\n"
   + "          {name:ex.kneeStab,detail:'2×25 sec'},\n"
   + "          {name:ex.hinge[0],detail:'2×8'}].concat((_isRunner&&ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});\n"],
  ['s3 A6',
   "        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder\n"
   + "        const score=sr*10+_itemRank(it.name);\n",
   "        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder\n"
   + "        const score=(((ii>=3)&&/^leg circuit/i.test((s&&s.label)||''))?3:sr)*10+_itemRank(it.name);\n"],
];

// ── HELPERS ─────────────────────────────────────────────────────────────────────────────────────────────────────
const clone = o => JSON.parse(JSON.stringify(o));
const sha16 = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const DORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayJ = day => JSON.stringify(day || null, (k, v) => (k === 'id' || k === 'created') ? undefined : v);
const liveSecs = day => (day && !day.rest && day.sections || []).filter(s => (s.items || []).length);
const hasSec = (day, re) => liveSecs(day).some(s => re.test(clean(s.label)));
const TMPS = [];
process.on('exit', () => TMPS.forEach(f => { try { fs.unlinkSync(f); } catch(e){} }));
function tmpWrite(tag, text){ const f = path.join(os.tmpdir(), 'g231_d195_' + tag + '_' + process.pid + '.html'); fs.writeFileSync(f, text); TMPS.push(f); return f; }
function pinned(file){   // a fresh VM with the clock pinned to CLOCK 12:00 (new Date() and Date.now())
  const X = load(file); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
function manny(file){    // HALF_MANNY on two fresh VMs: {prog, dig, self}
  const p1 = pinned(file).buildProgram(clone(fixtures.HALF_MANNY)), p2 = pinned(file).buildProgram(clone(fixtures.HALF_MANNY));
  const d1 = progDigest(p1), d2 = progDigest(p2); return { prog:p1, dig:d1, self:d1 === d2, dig2:d2 }; }
function surgery(text, reps, candText){   // -> {text, ok, why}
  let t = text; const why = [];
  for(const [tag, oldS, newS] of reps){
    const n = t.split(oldS).length - 1; if(n !== 1){ why.push(tag + ': anchor count ' + n + ' on the V230 text'); continue; }
    t = t.replace(oldS, () => newS);
    const c = candText.split(newS).length - 1; if(c !== 1) why.push(tag + ': replacement text count ' + c + ' in the candidate (expected 1)');
  }
  return { text:t, ok:!why.length, why }; }

// ── PLUMBING ────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const R = {
  'D195-A-a': 'row D195-A-a (D195 Am. 2, VER >= 231) HALF_MANNY era row 231 = 2d35e8f743680cfa; B-alone 0ac7da6b1691a8e1, A-without-B f5ed630033ebe3db; universe 86 == V230 typed; W1–W12 Tue fourth circuit item Single-leg hip thrust 2×6–10 each @ RPE 7; calf and carry YYY-YYY-YYY---; W13/W14 and every non-Tuesday == V230',
  'D195-A-c': 'row D195-A-c (D195 Am. 2, VER >= 231) capRegionalFatigue(list,\'legs\',cardio,\'support_prevention\'): (i) four-item circuit + calf, no cardio -> unchanged; (ii) three-item circuit + Leg isolation (five moves) -> one item trimmed; (iii) list (i) + hard run (interference 1.4) -> exactly circuit index 3 leaves',
};
R['D195-A-d'] = 'row D195-A-d (D195 Am. 2, VER >= 231) capSessionBudget on the hand legs day: 20.5 -> the carry leaves; 22 -> the carry then the core block\'s later item; 23.5 -> the carry, the spare core item, then the circuit\'s index-3 item; never the hold or calf. Cells: shoulder/protect race W2 tue four-item circuit + calf, no carry (V230 three items); shoulder/protect test W3 mon Wall sit 2×25 sec at circuit position 2, three items';
R['D195-A-e'] = 'row D195-A-e (D195 Am. 2, VER >= 231) g215 F2: floor (b) fires on {home_full} only, home_full 84/126, commercial/crossfit/home_basic/bodyweight 0/126, prevention cells 0/90';
R['D195-A-b'] = 'row D195-A-b (D195 Am. 2 + session calls 6–7, VER >= 231) prevention shard (FULL prevention s76308/s87747 + INJ shoulder/elbow/knee/ankle protect on commercial/bodyweight, 264 programs) against NOT-A (V230 + slices 1, 4, 5, 6-refilter): per runner leg day items == NOT-A + at most one item appended at the end of the runner armor circuit; removals only from the Loaded carry finisher or the optional core block; circuit positions 1–2 == NOT-A; calf wherever NOT-A has it; knee/protect circuit length == NOT-A; non-runner leg days byte-identical to NOT-A';
R['D195-A-f'] = 'row D195-A-f (D195 Am. 2 + session call 8, VER >= 231) universe on the prevention shard + 8 bodyweight lowback prevention cells: non-bodyweight programs == V230; bodyweight lowback == V230 ∪ {Single-leg hip thrust (shoulders on bed)}; every other program == V230';
const ORDER = ['D195-A-a', 'D195-A-b', 'D195-A-c', 'D195-A-d', 'D195-A-e', 'D195-A-f'];
// a row = list of [conjunct name, bool, detail]; it passes only if every conjunct holds
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }

// ── LOAD + VERSION ──────────────────────────────────────────────────────────────────────────────────────────────
let IA, VER = NaN, CAND_TEXT = '';
try { IA = load(ART); VER = +IA.version; CAND_TEXT = fs.readFileSync(ART, 'utf8'); }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g231 D195 P-HIPEXT (Amendment 2 A + B) | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every row runs and must FAIL by its own conjuncts)'));
let BF = null, BASE_TEXT = '', baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ BF = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!BF){
  try { const f = tmpWrite('v230', cp.execFileSync('git', ['-C', ROOT, 'show', V230_COMMIT + ':index.html'], { maxBuffer:1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ BF = f; baseWhy += 'git show ' + V230_COMMIT + ':index.html written to ' + f + ' (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
if(BF) BASE_TEXT = fs.readFileSync(BF, 'utf8');
P('  V' + BASE_ERA + ' baseline: ' + (BF ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));

// ── ROW D195-A-a ────────────────────────────────────────────────────────────────────────────────────────────────
function rowAa(){
  const cj = [];
  cj.push(['a-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  // the candidate's HALF_MANNY
  const C = manny(ART), p = C.prog;
  cj.push(['a-digest', C.self && C.dig === DIG_231, 'candidate HALF_MANNY ' + C.dig + (C.self ? ' (self-identical in two VMs)' : ' (NOT self-identical: ' + C.dig2 + ')') + ', ruled ' + DIG_231]);
  const era = MANNY_DIGEST_BY_VERSION[ERA];
  cj.push(['a-era', era !== undefined && era === DIG_231, era === undefined ? 'harness MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT (row existence is a conjunct, standing ruling 5)' : 'harness MANNY_DIGEST_BY_VERSION[' + ERA + '] = ' + era + ', ruled ' + DIG_231]);
  // counterfactuals by source surgery on the V230 text
  if(!BF){ cj.push(['a-cfB', false, 'no V230 tree: ' + baseWhy]); cj.push(['a-cfA', false, 'no V230 tree: ' + baseWhy]); }
  else for(const [nm, reps, want, what] of [['a-cfB', S1, DIG_BALONE, 'B alone = V230 + slice 1 (1 replacement)'], ['a-cfA', S2_S3, DIG_ANOB, 'A without B = V230 + slices 2 and 3 (7 replacements)']]){
    const s = surgery(BASE_TEXT, reps, CAND_TEXT);
    let d = '(not built)', self = false, uni = '?';
    try { const M = manny(tmpWrite(nm, s.text)); d = M.dig; self = M.self; uni = (M.prog._swapUniverse || []).length; } catch(e){ d = 'CRASH ' + String(e && e.message || e).slice(0, 120); }
    cj.push([nm, s.ok && self && d === want, what + ': digest ' + d + (self ? '' : ' (not self-identical)') + ', universe ' + uni + ', ruled ' + want + (s.ok ? '' : ' | SURGERY: ' + s.why.join('; '))]);
  }
  // universe
  const U = Array.isArray(p._swapUniverse) ? p._swapUniverse : [], US = new Set(U), TS = new Set(V230_UNIVERSE);
  const lost = V230_UNIVERSE.filter(n => !US.has(n)), gained = [...US].filter(n => !TS.has(n));
  cj.push(['a-uni', U.length === 86 && US.size === 86 && !lost.length && !gained.length, 'prog._swapUniverse length ' + U.length + ', distinct ' + US.size + ', lost vs V230 ' + JSON.stringify(lost) + ', gained ' + JSON.stringify(gained)]);
  // W1–W12 Tuesday: the fourth circuit item, on V230's three, and nothing else on the day moved
  const wks = Object.keys(p.weeks || {}).sort((a, b) => a - b);
  let tueOK = 0; const tueBad = [];
  for(let w = 1; w <= 12; w++){
    const day = (p.weeks[w] || {}).tue, secs = (day && day.sections) || [], si = secs.findIndex(s => CIRCUIT_RE.test(clean(s && s.label)));
    const it = si >= 0 ? (secs[si].items || []).map(i => [clean(i.name), clean(i.detail)]) : null;
    let why = '';
    if(!it) why = 'no runner armor circuit';
    else if(it.length !== 4) why = it.length + ' circuit items';
    else if(JSON.stringify(it[3]) !== JSON.stringify(FOURTH)) why = 'item 4 ' + JSON.stringify(it[3]);
    else if(JSON.stringify(it.slice(0, 3)) !== JSON.stringify(V230_TUE[w])) why = 'items 1–3 ' + JSON.stringify(it.slice(0, 3)) + ' != V230';
    else { const d2 = clone(day); d2.sections[si].items.splice(3, 1); if(sha16(dayJ(d2)) !== V230_DAY[w + ' tue']) why = 'the day without item 4 != V230 (another line moved)'; }
    if(why) tueBad.push('W' + w + ' ' + why); else tueOK++;
  }
  cj.push(['a-tue', tueOK === 12, 'W1–W12 Tue carrying ' + FOURTH.join(' ') + ' as item 4 after V230\'s three, day otherwise == V230: ' + tueOK + '/12' + (tueBad.length ? ' | ' + tueBad.slice(0, 3).join('; ') : '')]);
  let calf = '', carry = '';
  for(let w = 1; w <= 14; w++){ const t = (p.weeks[w] || {}).tue; calf += hasSec(t, /^Calf — achilles/) ? 'Y' : '-'; carry += hasSec(t, /carry/i) ? 'Y' : '-'; }
  cj.push(['a-calf', calf === CALF_STR, 'Tue calf W1–W14 ' + calf + ', ruled ' + CALF_STR]);
  cj.push(['a-carry', carry === CARRY_STR, 'Tue carry W1–W14 ' + carry + ', ruled ' + CARRY_STR]);
  // W13/W14 and every non-Tuesday day == V230
  let oN = 0, oEq = 0; const oBad = [];
  for(let w = 1; w <= 14; w++) for(const d of DORDER){ if(d === 'tue' && w <= 12) continue; oN++;
    const h = sha16(dayJ((p.weeks[w] || {})[d])); if(h === V230_DAY[w + ' ' + d]) oEq++; else oBad.push('W' + w + ' ' + d); }
  cj.push(['a-other', wks.length === 14 && oN === 86 && oEq === 86, 'weeks ' + wks.length + '; W13/W14 and non-Tuesday days == V230 ' + oEq + '/' + oN + (oBad.length ? ' | differ: ' + oBad.slice(0, 6).join(', ') : '')]);
  // instrument: the typed tables are V230's (the baseline re-read in this run)
  if(!BF) cj.push(['a-inst', false, 'no V230 tree: ' + baseWhy]);
  else { const B = manny(BF), q = B.prog; const bu = new Set(q._swapUniverse || []);
    let bd = 0, bt = 0; for(let w = 1; w <= 14; w++) for(const d of DORDER) if(sha16(dayJ((q.weeks[w] || {})[d])) === V230_DAY[w + ' ' + d]) bd++;
    for(let w = 1; w <= 12; w++){ const s = liveSecs((q.weeks[w] || {}).tue).find(x => CIRCUIT_RE.test(clean(x.label))); if(s && JSON.stringify(s.items.map(i => [clean(i.name), clean(i.detail)])) === JSON.stringify(V230_TUE[w])) bt++; }
    const uok = (q._swapUniverse || []).length === 86 && bu.size === 86 && V230_UNIVERSE.every(n => bu.has(n));
    cj.push(['a-inst', B.self && B.dig === DIG_V230 && uok && bd === 98 && bt === 12, 'V230 baseline HALF_MANNY ' + B.dig + (B.self ? ' self-identical' : ' NOT self-identical') + ' (ruled ' + DIG_V230 + '), universe == V230_UNIVERSE ' + uok + ', days == V230_DAY ' + bd + '/98, Tue circuits == V230_TUE ' + bt + '/12']); }
  row('D195-A-a', cj);
}

// ── ROW D195-A-c ────────────────────────────────────────────────────────────────────────────────────────────────
// Hand-built lists. List (i) is HALF_MANNY's W6 Tuesday as the ruling prints it (Main 3 sets, the four-item circuit at
// 2 sets each, the calf at 2 sets). Moves on V230's own reading: squat, lunge, hinge, hip_ext, calf_iso = 5 (the hold
// carries no pattern and accrues nothing), REGION_MOVE_CAP.legs = 4; sets 3+2+2+2+2 = 11 <= 14.
function rowAc(){
  const cj = [];
  cj.push(['c-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const L1 = [
    { label:'Main — Front squat', items:[{ name:'Front squat', detail:'3×8 — RPE 7' }] },
    { label:'Leg circuit — runner armor', superset:true, rounds:2, items:[
      { name:'Dumbbell Bulgarian split squat', detail:'2×8–12 each @ RPE 7' }, { name:'Spanish squat hold (KB)', detail:'2×25 sec' },
      { name:'Kettlebell swing', detail:'2×8' }, { name:'Single-leg hip thrust', detail:'2×6–10 each @ RPE 7' }] },
    { label:'Calf — achilles armor', items:[{ name:'Dumbbell seated calf raise', detail:'2×12–15 each, slow 3-sec lower' }] },
  ];
  // (ii): the circuit back to three items plus a pattern-bearing Leg isolation item (leg_iso): five moves, no four-item circuit
  const L2 = clone(L1); L2[1].items.pop(); L2.push({ label:'Leg isolation', items:[{ name:'Leg extension', detail:'2×12–15' }] });
  // (iii) expected: list (i) minus the circuit's index-3 item, every other section and item verbatim
  const E3 = clone(L1); E3[1].items.splice(3, 1);
  const CARDIO = { type:'run', subtype:'Speed Run — Intervals', detail:'' };   // hand value 1.4 (header, HAND)
  const CARDIO_HAND = 1.4;
  let crf = null, ci = null, why = '';
  try { crf = IA.eval('capRegionalFatigue'); ci = IA.eval('_cardioInterference'); } catch(e){ why = String(e && e.message || e).slice(0, 120); }
  if(typeof crf !== 'function' || typeof ci !== 'function'){ ['c-hand', 'c-i', 'c-ii', 'c-iii'].forEach(n => cj.push([n, false, 'capRegionalFatigue/_cardioInterference not reachable ' + why])); row('D195-A-c', cj); return; }
  const call = (L, cardio) => { const inp = clone(L), before = JSON.stringify(inp); let out, err = '';
    try { out = crf(inp, 'legs', cardio, 'support_prevention'); } catch(e){ err = String(e && e.message || e).slice(0, 120); }
    return { out, err, mut:JSON.stringify(inp) !== before }; };
  const show = L => Array.isArray(L) ? L.map(s => s.label + ' :: ' + (s.items || []).map(i => i.name).join(' | ')).join(' || ') : String(L);
  const iv = ci(clone(CARDIO));
  cj.push(['c-hand', iv === CARDIO_HAND && iv >= 1.4, '_cardioInterference(' + JSON.stringify(CARDIO) + ') = ' + iv + ', hand ' + CARDIO_HAND]);
  const r1 = call(L1, null);
  cj.push(['c-i', !r1.err && !r1.mut && JSON.stringify(r1.out) === JSON.stringify(L1), '(i) cardio null: ' + (r1.err ? 'THREW ' + r1.err : (JSON.stringify(r1.out) === JSON.stringify(L1) ? 'unchanged' : 'CHANGED -> ' + show(r1.out))) + (r1.mut ? ' | input mutated' : '')]);
  const r2 = call(L2, null);
  // "one item trimmed": the output equals list (ii) with exactly one item removed, every other section and item verbatim.
  // A section the trim empties is not a card line, so sections with no items are dropped on both sides before comparing
  // (a one-item `Leg isolation` section emptied by the trim is the same card whether its empty shell is kept or not).
  const live = L => L.filter(s => (s.items || []).length);
  let oneOff = false, removed = '';
  if(!r2.err && Array.isArray(r2.out)) for(let si = 0; si < L2.length && !oneOff; si++) for(let ii = 0; ii < L2[si].items.length && !oneOff; ii++){
    const e = clone(L2); const gone = e[si].items.splice(ii, 1)[0]; if(JSON.stringify(live(e)) === JSON.stringify(live(r2.out))){ oneOff = true; removed = e[si].label + ' :: ' + gone.name; } }
  cj.push(['c-ii', !r2.err && !r2.mut && oneOff, '(ii) three-item circuit + Leg isolation, cardio null: ' + (r2.err ? 'THREW ' + r2.err : oneOff ? 'exactly one item trimmed (' + removed + ')' : 'NOT exactly one item trimmed -> ' + show(r2.out)) + (r2.mut ? ' | input mutated' : '')]);
  const r3 = call(L1, CARDIO);
  cj.push(['c-iii', !r3.err && !r3.mut && JSON.stringify(r3.out) === JSON.stringify(E3), '(iii) list (i) + hard run: ' + (r3.err ? 'THREW ' + r3.err : JSON.stringify(r3.out) === JSON.stringify(E3) ? 'exactly circuit index 3 (Single-leg hip thrust) left; lunge, hold, hinge, calf, Main verbatim' : 'NOT as ruled -> ' + show(r3.out)) + (r3.mut ? ' | input mutated' : '')]);
  row('D195-A-c', cj);
}

// ── ROW D195-A-d ────────────────────────────────────────────────────────────────────────────────────────────────
// THE HAND LEGS DAY. Pricing (the ruling's, D195-B): a stretch costs 0; an `_isHalf` name (carry, wall sit, hold, plank,
// clamshell, side steps, ...) or a member of EXLIB.hip_stability / knee_stability / foot_ankle / foot_ankle_bw costs half
// its sets; anything else costs its sets (_setCount: the leading N of `N×`). Cap: cardio null, _cardioInterference 0,
// cap = max(12, 20 − 0) = 20. Trim score (A6): (index ≥ 3 in a `Leg circuit` section ? 3 : section rank) × 10 + item
// rank (carry 2, wall sit / hold 1, else 0); the highest score leaves first, ties to the later position (si×100+ii).
// Section ranks: Main and Hip stability are protected (`^main`, /hip/ in the label); the Loaded carry finisher is 3
// (/carry|finisher/, optional); the optional core block is 3 while it holds two items and protected (s.core) once down
// to one (D48); the circuit, the calf (`Calf — achilles armor` matches no rank-2 token) and Foot & ankle are 1.
// The three days differ ONLY in protected sections (Main sets, the hip rail's band sets), so the candidate order is the
// same on all three and only the stopping point moves.
const D_CAP = 20;
function dDay(mainN, stepsN, clamN){
  const L = [
    { label:'Main — Back squat', items:[
      { name:'Back squat', detail:mainN + '×12 — RPE 6.5' } ] },                               // mainN, full (protected)
    { label:'Leg circuit — runner armor', superset:true, rounds:2, items:[
      { name:'Step-ups (KB)', detail:'2×8–12 each @ RPE 6–7' },                               // 2, full; score 1×10+0 = 10
      { name:'Wall sit', detail:'2×25 sec' },                                                 // 2×0.5 = 1 (_isHalf); THE HOLD, 1×10+1 = 11
      { name:'Kettlebell swing', detail:'2×8' },                                              // 2, full; hinge; 10
      { name:'Single-leg hip thrust', detail:'2×6–10 each @ RPE 6–7' } ] },                   // 2, full; hip_ext; index 3 (A6) 3×10+0 = 30
    { label:'Calf — achilles armor', items:[
      { name:'Dumbbell standing calf raise', detail:'2×12–15 each, slow 3-sec lower' } ] },   // 2, full; THE CALF, 1×10+0 = 10
    { label:'Hip stability', items:[                                                          // protected (/hip/)
      { name:'Clamshells w/ band', detail:clamN + '×15 each' },                               // clamN×0.5 (_isHalf clamshell; hip_stability)
      { name:'Banded side steps', detail:stepsN + '×15–20 each @ RPE 6–7' },                  // stepsN×0.5 (_isHalf side steps; hip_stability)
      { name:'IT band stretch', detail:'2×30 sec each' } ] },                                 // 0 (stretch)
    { label:'Foot & ankle', items:[
      { name:'Tibialis raise (wall lean)', detail:'2×20' },                                   // 2×0.5 = 1 (foot_ankle, B); 10
      { name:'Single-leg bent-knee soleus raise', detail:'2×12 each, slow' } ] },             // 2×0.5 = 1 (foot_ankle, B); 10
    { label:'Loaded carry finisher', optional:true, items:[
      { name:'Farmer carry', detail:'3×40 yards, heavy' } ] },                                // 3×0.5 = 1.5 (_isHalf carry); 3×10+2 = 32
    { label:'', coreHeader:'Core — Anti-Rotation', core:true, optional:true, items:[          // injectDynamicCore's shape (:7046)
      { name:'Side plank', detail:'3×30–45 sec each' },                                       // 3×0.5 = 1.5 (_isHalf plank); 30
      { name:'Plank shoulder taps', detail:'3×12 each' } ] },                                 // 3×0.5 = 1.5 (_isHalf plank); 30, the later position
  ];
  // Main + circuit (2+1+2+2) + calf 2 + hip rail (clamN+stepsN)×0.5 + foot & ankle (1+1) + carry 1.5 + core (1.5+1.5)
  const hand = mainN + 7 + 2 + (clamN + stepsN) * 0.5 + 2 + 1.5 + 3;
  return { L, hand };
}
const CARRY = ['Loaded carry finisher', 'Farmer carry'], CORE2 = ['Core — Anti-Rotation', 'Plank shoulder taps'], THRUST = ['Leg circuit — runner armor', 'Single-leg hip thrust'];
const D_CASES = [
  // 3 + 7 + 2 + (2+2)×0.5 + 2 + 1.5 + 3 = 20.5 > 20: the carry (32) leaves → 19 ≤ 20, stop.
  { tag:'d-20.5', want:20.5, day:dDay(3, 2, 2), gone:[CARRY] },
  // 4 + 7 + 2 + (2+3)×0.5 + 2 + 1.5 + 3 = 22: the carry → 20.5 > 20; the core block's two items tie at 30 above the
  // thrust's 30 by position (the core block sits last) → its later item leaves → 19 ≤ 20, stop.
  { tag:'d-22', want:22, day:dDay(4, 3, 2), gone:[CARRY, CORE2] },
  // 5 + 7 + 2 + (3+3)×0.5 + 2 + 1.5 + 3 = 23.5: the carry → 22; the spare core item → 20.5 > 20; the core block is down
  // to one item (protected), so the only 30 left is the circuit's index-3 item (posterior count 2: the swing and the
  // thrust, so D85's last-posterior floor does not hold it) → 18.5 ≤ 20, stop. The hold (11) and the calf (10) are
  // never reached.
  { tag:'d-23.5', want:23.5, day:dDay(5, 3, 3), gone:[CARRY, CORE2, THRUST] },
];
const secKey = s => (s && (s.label || s.coreHeader)) || '';
const dProj = L => L.filter(s => (s.items || []).length).map(s => [secKey(s), s.items.map(i => [i.name, i.detail])]);
// the two typed cells: coach's INJ mk() (seed pinned, cfg.injury set directly), clock 2026-08-24
const CELL_F1 = { tag:'shoulder/protect | commercial | beginner | s1234 | sun,wed | race (run_half)', w:2, d:'tue',
  cfg:{ name:'M', primaryPath:'event', cardioTypes:['run'], cardioGoals:{ run:{ id:'run_half', label:'run_half', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' } }, eventTargeted:false, liftingFocus:'support_prevention', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:1234, injury:{ region:'shoulder', tier:'protect' } } };
const CELL_FH = { tag:'shoulder/protect | test (run_base) | commercial | intermediate | s87747 | sat,sun', w:3, d:'mon',
  cfg:{ name:'M', primaryPath:'event', cardioTypes:['run'], cardioGoals:{ run:{ id:'run_base', label:'run_base', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' } }, eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sat','sun'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:87747, injury:{ region:'shoulder', tier:'protect' } } };
// cards3 lines 43–48 ([ABx]; the candidate is ALLx and builds this card)
const CARD_231_F1 = [
  "Main — Back squat :: Back squat 3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest",
  "Leg circuit — runner armor (SS 2) :: Step-ups (KB) 2×8–12 each @ RPE 6–7 | Wall sit 2×25 sec | Kettlebell swing 2×8 | Single-leg hip thrust 2×6–10 each @ RPE 6–7",
  "Calf — achilles armor :: Dumbbell standing calf raise 2×12–15 each, slow 3-sec lower",
  "Hip stability :: Clamshells w/ band 2×15 each | Banded side steps 2×15–20 each @ RPE 6–7 | IT band stretch 2×30 sec each",
  "Foot & ankle :: Tibialis raise (wall lean) 2×20 | Single-leg bent-knee soleus raise 2×12 each, slow",
  "Core — Anti-Rotation :: Side plank 3×30–45 sec each | Plank shoulder taps 3×12 each",
];
// cards3 lines 28–33 ([V])
const CARD_V230_F1 = [
  "Main — Back squat :: Back squat 3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest",
  "Leg circuit — runner armor (SS 2) :: Step-ups (KB) 2×8–12 each @ RPE 6–7 | Wall sit 2×25 sec | Kettlebell swing 2×8",
  "Calf — achilles armor :: Dumbbell standing calf raise 2×12–15 each, slow 3-sec lower",
  "Hip stability :: Clamshells w/ band 2×15 each | Banded side steps 2×15–20 each @ RPE 6–7 | IT band stretch 2×30 sec each",
  "Foot & ankle :: Tibialis raise (wall lean) 2×20 | Single-leg bent-knee soleus raise 2×12 each, slow",
  "Core — Anti-Rotation :: Side plank 3×30–45 sec each | Plank shoulder taps 3×12 each",
];
// cards3 lines 115–120 ([B]; ABx1 and ABx printed identical)
const CARD_231_FH = [
  "Main — Back squat :: Back squat 3×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest",
  "Leg circuit — runner armor (SS 2) :: Dumbbell Bulgarian split squat 2×8–12 each @ RPE 7 | Wall sit 2×25 sec | Barbell good mornings 2×6–10 @ RPE 7",
  "Calf — achilles armor :: Machine seated calf raise 2×12–15 each, slow 3-sec lower",
  "Hip stability :: Banded monster walks 2×12–15 each @ RPE 7 | Banded side steps 2×15–20 each @ RPE 7 | IT band stretch 2×30 sec each",
  "Foot & ankle :: Standing ankle CARs 2×5 each direction | Banded dorsiflexion 2×15 each",
  "Core — Rotational Power :: Landmine rotations 2×8–12 each @ RPE 7",
];
// NOT printed by coach: one build of the V230 baseline (scratchpad/base_v230.html) by builder gate run 2, 2026-10-04,
// clock 2026-08-24, cfg CELL_FH; typed here, re-proved by d-inst
const CARD_V230_FH = [
  "Main — Back squat :: Back squat 3×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest",
  "Leg circuit — runner armor (SS 2) :: Dumbbell Bulgarian split squat 2×8–12 each @ RPE 7 | Barbell good mornings 2×6–10 @ RPE 7",
  "Hip stability :: Banded monster walks 2×12–15 each @ RPE 7 | Banded side steps 2×15–20 each @ RPE 7 | IT band stretch 2×30 sec each",
  "Foot & ankle :: Standing ankle CARs 2×5 each direction | Banded dorsiflexion 2×15 each",
  "Core — Rotational Power :: Landmine rotations 2×8–12 each @ RPE 7",
];
const cardLines = day => liveSecs(day).map(s => clean(s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: '
  + s.items.map(it => clean(it.name) + ' ' + clean(it.detail || '') + (it.__bw ? ' [<' + it.__bw.was + ']' : '')).join(' | '));
function rowAd(){
  const cj = [];
  cj.push(['d-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const hands = D_CASES.map(c => c.day.hand);
  cj.push(['d-fix', JSON.stringify(hands) === JSON.stringify([20.5, 22, 23.5]) && D_CASES.every(c => c.day.hand === c.want && c.want > D_CAP), 'hand totals ' + JSON.stringify(hands) + ' (ruled 20.5, 22, 23.5), cap ' + D_CAP]);
  let csb = null, why = '';
  try { csb = IA.eval('capSessionBudget'); } catch(e){ why = String(e && e.message || e).slice(0, 120); }
  if(typeof csb !== 'function') D_CASES.forEach(c => cj.push([c.tag, false, 'capSessionBudget not reachable ' + why]));
  else for(const c of D_CASES){
    const inp = clone(c.day.L), before = JSON.stringify(inp); let out, err = '';
    try { out = csb(inp, null); } catch(e){ err = String(e && e.message || e).slice(0, 120); }
    const mut = JSON.stringify(inp) !== before;
    const exp = clone(c.day.L);
    c.gone.forEach(([k, n]) => { const s = exp.find(x => secKey(x) === k); const j = s ? s.items.findIndex(i => i.name === n) : -1; if(j >= 0) s.items.splice(j, 1); });
    const got = Array.isArray(out) ? dProj(out) : null, want = dProj(exp);
    const names = P2 => (P2 || []).flatMap(([k, its]) => its.map(([n]) => k + ' :: ' + n));
    const left = names(dProj(c.day.L)).filter(n => !names(got).includes(n));
    const hold = names(got).includes('Leg circuit — runner armor :: Wall sit'), calf = names(got).includes('Calf — achilles armor :: Dumbbell standing calf raise');
    const good = !err && !mut && JSON.stringify(got) === JSON.stringify(want) && hold && calf;
    cj.push([c.tag, good, 'total ' + c.want + ': ' + (err ? 'THREW ' + err : 'left [' + left.join('; ') + '], ruled [' + c.gone.map(g => g.join(' :: ')).join('; ') + ']'
      + (hold ? '' : ' | THE HOLD LEFT') + (calf ? '' : ' | THE CALF LEFT') + (JSON.stringify(got) === JSON.stringify(want) ? '' : ' | survivors != ruled')) + (mut ? ' | input mutated' : '')]);
  }
  // the typed cells
  const circ = day => { const s = liveSecs(day).find(x => CIRCUIT_RE.test(clean(x.label))); return s ? s.items.map(i => [clean(i.name), clean(i.detail)]) : null; };
  const cellCards = file => { const X = pinned(file); return [CELL_F1, CELL_FH].map(c => { const p = X.buildProgram(clone(c.cfg)); return ((p.weeks || {})[c.w] || {})[c.d]; }); };
  let cd = null; try { cd = cellCards(ART); } catch(e){ why = String(e && e.message || e).slice(0, 120); }
  if(!cd){ cj.push(['d-cellA', false, 'candidate build failed ' + why]); cj.push(['d-cellB', false, 'candidate build failed ' + why]); }
  else {
    const [a, b] = cd, ca = cardLines(a), cb = cardLines(b), ia = circ(a), ib = circ(b);
    const aCalf = hasSec(a, /^Calf — achilles/), aCarry = hasSec(a, /carry/i);
    cj.push(['d-cellA', JSON.stringify(ca) === JSON.stringify(CARD_231_F1) && !!ia && ia.length === 4 && aCalf && !aCarry,
      CELL_F1.tag + ' W' + CELL_F1.w + ' ' + CELL_F1.d + ': circuit ' + (ia ? ia.length : 'ABSENT') + ' items, calf ' + aCalf + ', carry ' + aCarry + ', card == CARD_231_F1 ' + (JSON.stringify(ca) === JSON.stringify(CARD_231_F1)) + (JSON.stringify(ca) === JSON.stringify(CARD_V230_F1) ? ' (reads CARD_V230_F1)' : '')]);
    const pos2 = ib && ib[1] ? ib[1].join(' ') : 'ABSENT';
    cj.push(['d-cellB', JSON.stringify(cb) === JSON.stringify(CARD_231_FH) && !!ib && ib.length === 3 && pos2 === 'Wall sit 2×25 sec',
      CELL_FH.tag + ' W' + CELL_FH.w + ' ' + CELL_FH.d + ': circuit ' + (ib ? ib.length : 'ABSENT') + ' items, position 2 ' + pos2 + ', card == CARD_231_FH ' + (JSON.stringify(cb) === JSON.stringify(CARD_231_FH)) + (JSON.stringify(cb) === JSON.stringify(CARD_V230_FH) ? ' (reads CARD_V230_FH)' : '')]);
  }
  if(!BF) cj.push(['d-inst', false, 'no V230 tree: ' + baseWhy]);
  else { let bd = null; try { bd = cellCards(BF); } catch(e){ why = String(e && e.message || e).slice(0, 120); }
    const e1 = bd && JSON.stringify(cardLines(bd[0])) === JSON.stringify(CARD_V230_F1), e2 = bd && JSON.stringify(cardLines(bd[1])) === JSON.stringify(CARD_V230_FH);
    cj.push(['d-inst', !!(e1 && e2), bd ? 'V230 baseline: W2 tue == CARD_V230_F1 ' + e1 + ', W3 mon == CARD_V230_FH ' + e2 : 'V230 build failed ' + why]); }
  row('D195-A-d', cj);
}

// ── ROW D195-A-e ────────────────────────────────────────────────────────────────────────────────────────────────
// g215's knee/protect lattice and F2 method, copied verbatim from tests/gates/g215_d149_ghd.js (mk, GOALS, FOC, EXPS,
// RESTS, SEEDS, LAT_K, FB_FROM/FB_TO). Ruled: floor (b) fires on {home_full} only.
const E_TIERS = ['commercial', 'crossfit', 'home_full', 'home_basic', 'bodyweight'];
const E_GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const E_FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const E_EXPS = ['beginner','intermediate','advanced'], E_RESTS = [['sun','wed'],['sat','sun']];
const E_SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
function eMk(eq, gi, f, exp, age, si, inj){
  const [g, x] = E_GOALS[gi % E_GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: E_RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: E_SEEDS[si] };
  if(inj) c.injury = inj;
  return c;
}
const FB_FROM = "(_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left";
const FB_TO   = "_left";
const E_RULED = { commercial:0, crossfit:0, home_full:84, home_basic:0, bodyweight:0 }, E_PER = 126, E_PREV_N = 90, E_PREV_FIRE = 0;
function rowAe(){
  const cj = [];
  cj.push(['e-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const LAT_K = [];
  for(const eq of E_TIERS) E_GOALS.forEach((_, gi) => E_FOC.forEach((f, fi) => E_EXPS.forEach((e, ei) => { const si = (gi + fi + ei) % 2;
    LAT_K.push({ eq, f, cfg: eMk(eq, gi, f, e, si ? '55+' : '18-35', si, { region:'knee', tier:'protect' }) }); })));
  const n = CAND_TEXT.split(FB_FROM).length - 1;
  cj.push(['e-anchor', n === 1, 'floor (b) anchor count ' + n + ' in the candidate (expected 1)']);
  if(n !== 1){ ['e-lattice', 'e-home_full', 'e-others', 'e-prev'].forEach(k => cj.push([k, false, 'no counterfactual: anchor count ' + n])); row('D195-A-e', cj); return; }
  const C = pinned(ART), Q = pinned(tmpWrite('cfFB', CAND_TEXT.replace(FB_FROM, () => FB_TO)));
  const cnt = {}, fire = {}; let crash = 0, prevN = 0, prevFire = 0, built = 0;
  E_TIERS.forEach(t => { cnt[t] = 0; fire[t] = 0; });
  for(const x of LAT_K){ cnt[x.eq]++; const pv = x.f === 'support_prevention'; if(pv) prevN++;
    let a, b; try { a = progDigest(C.buildProgram(clone(x.cfg))); b = progDigest(Q.buildProgram(clone(x.cfg))); } catch(e){ crash++; continue; }
    built++; if(a !== b){ fire[x.eq]++; if(pv) prevFire++; } }
  const fmt = () => E_TIERS.map(t => t + ' ' + fire[t] + '/' + cnt[t]).join(', ');
  cj.push(['e-lattice', LAT_K.length === 630 && built === 630 && crash === 0 && E_TIERS.every(t => cnt[t] === E_PER) && prevN === E_PREV_N,
    'LAT_K ' + LAT_K.length + ' configs, built ' + built + ', crashed ' + crash + ', per tier ' + E_TIERS.map(t => cnt[t]).join('/') + ', prevention cells ' + prevN]);
  cj.push(['e-home_full', fire.home_full === E_RULED.home_full, 'floor (b) fires on home_full ' + fire.home_full + '/' + cnt.home_full + ', ruled ' + E_RULED.home_full + ' | ' + fmt()]);
  const others = E_TIERS.filter(t => t !== 'home_full');
  cj.push(['e-others', others.every(t => fire[t] === E_RULED[t]), others.map(t => t + ' ' + fire[t] + '/' + cnt[t]).join(', ') + ', ruled 0 each']);
  cj.push(['e-prev', prevFire === E_PREV_FIRE, 'prevention cells firing ' + prevFire + '/' + prevN + ', ruled ' + E_PREV_FIRE + '/' + E_PREV_N]);
  row('D195-A-e', cj);
}

// ── ROWS D195-A-b and D195-A-f: THE PREVENTION SHARD ────────────────────────────────────────────────────────────
// LATTICE coach's cfg builders, copied from tests/measure/v231_coach2_surgery.js (FAM, TIERS6, EXPS, SEEDS, RESTS, REGS,
//   ITIERS, mk()). The INJ cell counter k runs over coach's WHOLE INJ lattice so every kept cell's experience and seed are
//   coach's. Seed pinned by mk(); cfg.injury set directly; clock 2026-08-24 12:00 (pinned()). One VM per tree, reused
//   across the shard: candidate, V230 and V230 again (A-f, self-identity), NOT-A and NOT-A again (A-b, self-identity).
// HAND runner predicate, typed from index.html :9283 (`const _isRunner = (cfg.cardioTypes||[]).indexOf('run') >= 0;`, read
//   2026-10-04) and mk() (race and test families set cardioTypes ['run'], family none sets []): runner iff family race or
//   test. The gate checks the hand table against each cfg (disagreements must be 0).
// ORACLE (A-b), session calls 6–7 (tests/measure/v231_rulings/v231_session_calls.md): the A STEP, built in-gate. NOT-A =
//   the V230 baseline text + the replacements of slice 1 (S1 above), slice 4 (three), slice 5 (two) and slice 6's D197
//   re-filter (one; the version bump is not carried), typed below from tests/edits/v231_s4_d196_lens_ankle_knee.py,
//   v231_s5_d196_lowback.py, v231_s6_d197_bump.py. Every anchor count == 1 on the working text and every replacement
//   text present once in the candidate (the a-cfB pattern: on a tree that lacks the code, b-notA FAILS by name). NOT-A is
//   built twice in two VMs and must equal itself per program before anything is compared.
//   Per runner leg day (a day where NOT-A or the candidate carries `Leg circuit — runner armor`): the candidate's item
//   multiset (key = section label + name + detail) == NOT-A's + at most one item, and that item is appended at the end
//   of the circuit (the circuit's other items == NOT-A's circuit in order); removals only from NOT-A's `Loaded carry
//   finisher` or its core block (s.core / coreHeader), the core block never emptied (A-4: "the last core item ...
//   never"); circuit positions 1–2 names literally == NOT-A's and rounds == NOT-A's (A-1: "rounds unchanged"); calf
//   present wherever NOT-A has it (every leg day); knee/protect circuit length == NOT-A's. Every non-runner leg day is
//   byte-identical to NOT-A's day (JSON, id/created stripped). b-fourth: runner leg days carrying the appended item > 0,
//   non-runner 0, knee/protect 0. The candidate's own output is never the oracle. The A-4 tallies (NOT-A -> candidate
//   removals by section) are printed, never asserted (the ruling's carry 43 / spare core 90 are M17's lattice).
// A-f compares universes with the V230 baseline. Its set is the A-b shard plus, per session call 8, coach's INJ lattice
//   cells bodyweight lowback/protect and lowback/workaround, support_prevention, race and test families (8 cells).
const S4_S5_S6 = [
  ['s4 L lenses',
   "  const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;\n",
   "  const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;\n"
   + "  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';\n"
   + "  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';\n"],
  ['s4 KP knee/protect squat literal',
   "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];\n",
   "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):[_bwHTak,'Single-leg glute bridge','Bodyweight back extension'];\n"],
  ['s4 AP ankle/protect squat literal',
   "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];\n",
   "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):[_bwHTak,'Single-leg glute bridge'];\n"],
  ['s5 lowback/protect back + hinge',
   "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):['Banded hip thrust','Single-leg glute bridge'];\n"
   + "        hingePool = ['Banded hip thrust','Single-leg glute bridge'];\n",
   "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):[_bwHTlb,'Single-leg glute bridge'];\n"
   + "        hingePool = [_bwHTlb,'Single-leg glute bridge'];\n"],
  ['s5 lowback/workaround back',
   "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):['Banded hip thrust','Single-leg hip thrust'];\n",
   "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):[_bwHTlb,'Single-leg hip thrust'];\n"],
  ['s6 D197 post-sweep re-filter',
   "  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n",
   "  if(cfg.equipment==='bodyweight'){ bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n"
   + "    if(cfg.injury) Object.keys(weeks).forEach(_w=>Object.keys(weeks[_w]||{}).forEach(_d=>{ const _day=weeks[_w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=applyInjuryFilter(_day.sections,cfg); })); }\n"],
];
const NOTA_REPS = S1.concat(S4_S5_S6);   // 1 + 3 + 2 + 1 = 7 replacements
const SH_FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const SH_FAM = { race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]], test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]], none:[[null,{}]] };
const SH_TIERS = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'], SH_EXPS = ['beginner','intermediate','advanced'];
const SH_SEEDS = [87747, 76308, 1234, 4242], SH_RESTS = [['sun','wed'], ['sat','sun']];
const SH_REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], SH_ITIERS = ['workaround','protect'];
function shMk(f, fam, eq, ei, si, ri, inj){ const g = SH_FAM[fam][(si + ei) % SH_FAM[fam].length];
  const c = { name:'M', primaryPath:/^support_/.test(f) ? 'event' : 'goal', cardioTypes:g[0] ? ['run'] : [], cardioGoals:g[0] ? { run:Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
    eventTargeted:false, liftingFocus:f, experience:SH_EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:SH_RESTS[ri].slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SH_SEEDS[si] };
  if(inj) c.injury = inj; return c; }
// A-b's shard (the ruling): FULL prevention at s76308 and s87747 (both rests, six tiers, three families; the FULL
// lattice's three experiences) + INJ prevention {shoulder, elbow, knee, ankle}/protect on {commercial, bodyweight}.
// A-f only (session call 8): INJ prevention lowback/{protect, workaround} on bodyweight, race and test families.
const SH_FULL_SEEDS = [76308, 87747], SH_INJ_REGS = ['shoulder','elbow','knee','ankle'], SH_INJ_EQ = ['commercial','bodyweight'];
const SH_N = { all:264, FULL:216, INJ:48, LB:8 };   // hand: FULL 3 fam × 6 tiers × 3 exps × 2 seeds × 2 rests; INJ 4 regions × 3 fam × 2 tiers × 2 rests; LB 2 plans × 2 fam × 2 rests
const SH_RUNNER = { race:true, test:true, none:false };
const SH_BEDHT = 'Single-leg hip thrust (shoulders on bed)';
function shard(){ const out = [];
  for(const f of SH_FOC) for(const fam of Object.keys(SH_FAM)) for(const eq of SH_TIERS) for(let ei = 0; ei < 3; ei++) for(let si = 0; si < 4; si++) for(let ri = 0; ri < 2; ri++)
    if(f === 'support_prevention' && SH_FULL_SEEDS.includes(SH_SEEDS[si])) out.push({ L:'FULL', ab:true, fam, eq, inj:'none', c:shMk(f, fam, eq, ei, si, ri, null) });
  let k = 0;
  for(const r of SH_REGS) for(const t of SH_ITIERS) for(const f of SH_FOC) for(const fam of Object.keys(SH_FAM)) for(const eq of SH_TIERS) for(let ri = 0; ri < 2; ri++){ const ei = k % 3, si = (k >> 1) % 4; k++;
    if(f !== 'support_prevention') continue;
    if(t === 'protect' && SH_INJ_REGS.includes(r) && SH_INJ_EQ.includes(eq)) out.push({ L:'INJ', ab:true, fam, eq, inj:r + '/' + t, c:shMk(f, fam, eq, ei, si, ri, { region:r, tier:t }) });
    else if(r === 'lowback' && eq === 'bodyweight' && fam !== 'none') out.push({ L:'INJ-LB', ab:false, fam, eq, inj:r + '/' + t, c:shMk(f, fam, eq, ei, si, ri, { region:r, tier:t }) }); }
  out.forEach(x => { x.tag = x.L + ' ' + x.fam + '|' + x.eq + '|' + x.inj + '|' + x.c.experience + '|s' + x.c.seed + '|' + x.c.restDays.join(','); });
  return out; }
const shLab = s => clean((s && (s.label || s.coreHeader)) || '');
const shItems = day => { const o = []; liveSecs(day).forEach(s => { const lb = shLab(s), core = !!(s.core || s.coreHeader);
  (s.items || []).forEach(it => { if(it && it.name) o.push({ k:lb + ' :: ' + clean(it.name) + ' :: ' + clean(it.detail || ''), lab:lb, n:clean(it.name), d:clean(it.detail || ''), core }); }); }); return o; };
const shCirc = day => liveSecs(day).find(s => CIRCUIT_RE.test(clean(s.label))) || null;
const shCI = s => s ? s.items.map(i => clean(i.name) + ' :: ' + clean(i.detail || '')) : [];
const mdiff = (a, b) => { const m = {}; b.forEach(x => { m[x] = (m[x] || 0) + 1; }); return a.filter(x => { if(m[x]){ m[x]--; return false; } return true; }); };
const tal = (arr, key) => { const m = {}; arr.forEach(z => { const kk = key(z); m[kk] = (m[kk] || 0) + 1; }); return Object.keys(m).sort((a, b) => m[b] - m[a] || (a < b ? -1 : 1)).map(kk => kk + ' ' + m[kk]).join(', ') || '(none)'; };
let SH = null;
function shardBuilds(){
  if(SH) return SH;
  SH = { ok:false, why:'', progs:[], t:0, na:null, naWhy:'' };
  if(!BF){ SH.why = 'no V230 tree: ' + baseWhy; return SH; }
  const t1 = Date.now();
  const na = surgery(BASE_TEXT, NOTA_REPS, CAND_TEXT); SH.na = na;
  const XC = pinned(ART), XB = pinned(BF), XB2 = pinned(BF);
  let XN = null, XN2 = null;
  if(na.why.some(w => /anchor count/.test(w))) SH.naWhy = 'NOT-A not built: ' + na.why.join('; ');
  else { try { const f = tmpWrite('shNotA', na.text); XN = pinned(f); XN2 = pinned(f); } catch(e){ SH.naWhy = 'NOT-A failed to boot: ' + String(e && e.message || e).slice(0, 100); XN = XN2 = null; } }
  const bld = (X, c) => { try { return X.buildProgram(clone(c)); } catch(e){ return { __crash:String(e && e.message || e).slice(0, 120), weeks:{} }; } };
  const uni = p => Array.isArray(p && p._swapUniverse) ? new Set(p._swapUniverse) : null;
  for(const x of shard()){
    const pc = bld(XC, x.c), pv = bld(XB, x.c), pv2 = bld(XB2, x.c);
    const pn = (x.ab && XN) ? bld(XN, x.c) : null, pn2 = (x.ab && XN2) ? bld(XN2, x.c) : null;
    const rec = { x, runner:SH_RUNNER[x.fam], days:[],
      crash:[['candidate', pc], ['V230', pv], ['V230 VM2', pv2]].filter(([, p]) => p.__crash).map(([t, p]) => t + ': ' + p.__crash),
      naCrash:[['NOT-A', pn], ['NOT-A VM2', pn2]].filter(([, p]) => p && p.__crash).map(([t, p]) => t + ': ' + p.__crash) };
    rec.uC = uni(pc); rec.uV = uni(pv); rec.uV2 = uni(pv2);
    rec.naBuilt = !!(pn && pn2 && !pn.__crash && !pn2.__crash);
    if(rec.naBuilt) rec.selfN = progDigest(pn) === progDigest(pn2);
    if(x.ab && rec.naBuilt && !pc.__crash){
      const wks = [...new Set(Object.keys(pn.weeks || {}).concat(Object.keys(pc.weeks || {})))].sort((a, b) => a - b);
      for(const w of wks) for(const d of DORDER){
        const N = ((pn.weeks || {})[w] || {})[d], C = ((pc.weeks || {})[w] || {})[d], cn = shCirc(N), cc = shCirc(C);
        if(!cn && !cc) continue;
        rec.days.push({ w:+w, d, Ni:shCI(cn), Ci:shCI(cc), circLabC:cc ? shLab(cc) : '', rn:cn ? cn.rounds : null, rc:cc ? cc.rounds : null,
          calfN:hasSec(N, /^Calf — achilles/), calfC:hasSec(C, /^Calf — achilles/), iN:shItems(N), iC:shItems(C), same:dayJ(N) === dayJ(C) });
      }
    }
    SH.progs.push(rec);
  }
  SH.t = (Date.now() - t1) / 1000; SH.ok = true; return SH;
}
// per leg day, read against NOT-A only
function shAn(z){
  const kn = z.iN.map(i => i.k), kc = z.iC.map(i => i.k), add = mdiff(kc, kn), rem = mdiff(kn, kc);
  const remIt = rem.map(k => z.iN.find(i => i.k === k)), remBad = remIt.filter(i => !(/^Loaded carry finisher/.test(i.lab) || i.core));
  const coreEmptied = z.iN.some(i => i.core) && !z.iC.some(i => i.core);
  const head = JSON.stringify(z.Ci.slice(0, z.Ni.length)) === JSON.stringify(z.Ni);
  const appended = z.Ni.length > 0 && z.Ci.length === z.Ni.length + 1 && head;
  const addOK = !add.length || (add.length === 1 && appended && add[0] === z.circLabC + ' :: ' + z.Ci[z.Ci.length - 1]);
  const nm = L => L.map(q => q.split(' :: ')[0]);
  const lit12 = JSON.stringify(nm(z.Ni).slice(0, 2)) === JSON.stringify(nm(z.Ci).slice(0, 2));
  const rounds = !(z.Ni.length && z.Ci.length) || z.rn === z.rc;
  return { add, rem, remIt, remBad, coreEmptied, appended, grew:z.Ci.length > z.Ni.length, addOK, lit12, rounds };
}
function rowAb(){
  const cj = [];
  cj.push(['b-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const S = shardBuilds();
  if(!S.ok){ ['b-notA', 'b-shard', 'b-fourth', 'b-add', 'b-rem', 'b-circ', 'b-calf', 'b-nonrun', 'b-knee'].forEach(n => cj.push([n, false, S.why])); row('D195-A-b', cj); return; }
  const progs = S.progs.filter(r => r.x.ab), crashed = progs.filter(r => r.crash.length), naB = progs.filter(r => r.naBuilt), selfN = naB.filter(r => r.selfN).length;
  cj.push(['b-notA', S.na.ok && !S.naWhy && naB.length === progs.length && selfN === naB.length,
    'NOT-A = V230 + slices 1, 4, 5, 6-refilter (' + NOTA_REPS.length + ' replacements): ' + (S.na.ok ? 'every anchor count 1 on the working text, every replacement once in the candidate' : 'SURGERY: ' + S.na.why.join('; '))
    + (S.naWhy ? ' | ' + S.naWhy : '') + ' | built ' + naB.length + '/' + progs.length + (progs.some(r => r.naCrash.length) ? ' [' + progs.filter(r => r.naCrash.length).slice(0, 2).map(r => r.x.tag + ' ' + r.naCrash.join('; ')).join(' | ') + ']' : '')
    + ', self-identical in two VMs ' + selfN + '/' + naB.length]);
  const nF = progs.filter(r => r.x.L === 'FULL').length, nI = progs.filter(r => r.x.L === 'INJ').length;
  const rmis = progs.filter(r => SH_RUNNER[r.x.fam] !== ((r.x.c.cardioTypes || []).indexOf('run') >= 0)).length;
  const D = []; progs.forEach(r => r.days.forEach(dy => { const z = Object.assign({ r }, dy); z.a = shAn(z); z.tag = r.x.tag + ' W' + dy.w + ' ' + dy.d; D.push(z); }));
  const run = D.filter(z => z.r.runner), non = D.filter(z => !z.r.runner), knee = D.filter(z => z.r.x.inj === 'knee/protect');
  cj.push(['b-shard', progs.length === SH_N.all && nF === SH_N.FULL && nI === SH_N.INJ && !crashed.length && rmis === 0 && run.length > 0 && non.length > 0 && knee.length > 0,
    'programs ' + progs.length + ' (FULL ' + nF + ', INJ ' + nI + '; hand ' + SH_N.all + ' = ' + SH_N.FULL + ' + ' + SH_N.INJ + '), crashed ' + crashed.length
    + (crashed.length ? ' [' + crashed.slice(0, 2).map(r => r.x.tag + ' ' + r.crash.join('; ')).join(' | ') + ']' : '')
    + ', runner predicate vs cfg disagreements ' + rmis + ' | leg days ' + D.length + ': runner ' + run.length + ', non-runner ' + non.length + ', knee/protect ' + knee.length + ' | shard builds (A-b + A-f) ' + S.t.toFixed(1) + ' s']);
  const ap = run.filter(z => z.a.appended), nonG = non.filter(z => z.a.grew), kneeG = knee.filter(z => z.a.grew);
  cj.push(['b-fourth', ap.length > 0 && !nonG.length && !kneeG.length, 'runner leg days with one item appended to the circuit ' + ap.length + '/' + run.length + ' | by family ' + tal(ap, z => z.r.x.fam) + ' | by plan ' + tal(ap, z => z.r.x.inj)
    + ' | circuit grown on non-runner days ' + nonG.length + ', on knee/protect days ' + kneeG.length + (nonG.length || kneeG.length ? ' [' + nonG.concat(kneeG).slice(0, 4).map(z => z.tag).join(', ') + ']' : '')]);
  const show = L => L.slice(0, 10).map(z => z.tag + ' :: rem ' + JSON.stringify(z.a.rem) + ' add ' + JSON.stringify(z.a.add) + ' | NOT-A circuit ' + JSON.stringify(z.Ni) + ' C ' + JSON.stringify(z.Ci)).join(' || ');
  const addBad = run.filter(z => !z.a.addOK);
  cj.push(['b-add', !addBad.length, 'runner leg days whose additions vs NOT-A are at most one item appended at the end of the circuit ' + (run.length - addBad.length) + '/' + run.length
    + ' (items added ' + run.reduce((s2, z) => s2 + z.a.add.length, 0) + ')' + (addBad.length ? ' | OUTSIDE (' + addBad.length + ' days, by cell ' + tal(addBad, z => z.r.x.inj + ' ' + z.r.x.eq) + '): ' + show(addBad) : '')]);
  const remBad = run.filter(z => z.a.remBad.length || z.a.coreEmptied), remIt = run.flatMap(z => z.a.remIt.map(i => ({ z, i })));
  const sec = i => /^Loaded carry finisher/.test(i.lab) ? 'carry finisher' : i.core ? 'core block' : i.lab.replace(/ — .*$/, '');
  cj.push(['b-rem', !remBad.length, 'runner leg days removing only from the Loaded carry finisher or the core block (never emptying it) ' + (run.length - remBad.length) + '/' + run.length
    + ' | removal days vs NOT-A ' + run.filter(z => z.a.rem.length).length + ', items by section ' + tal(remIt, q => sec(q.i))
    + (remBad.length ? ' | OUTSIDE (' + remBad.length + ' days, by cell ' + tal(remBad, z => z.r.x.inj + ' ' + z.r.x.eq) + '): ' + show(remBad) : '')]);
  P('    D195-A-b A-4 tallies (print only, NOT-A -> candidate, runner leg days ' + run.length + '): carry finisher ' + remIt.filter(q => sec(q.i) === 'carry finisher').length + ' (' + tal(remIt.filter(q => sec(q.i) === 'carry finisher'), q => q.z.r.x.inj + ' ' + q.z.r.x.eq) + ')'
    + ' | spare core item ' + remIt.filter(q => sec(q.i) === 'core block').length + ' (' + tal(remIt.filter(q => sec(q.i) === 'core block'), q => q.z.r.x.inj + ' ' + q.z.r.x.eq) + ')'
    + ' | other ' + remIt.filter(q => !/^(carry finisher|core block)$/.test(sec(q.i))).length);
  const cBad = run.filter(z => !z.a.lit12 || !z.a.rounds);
  cj.push(['b-circ', !cBad.length, 'runner leg days whose circuit positions 1–2 names == NOT-A\'s and rounds == NOT-A\'s ' + (run.length - cBad.length) + '/' + run.length
    + (cBad.length ? ' | DIFFER (' + cBad.length + ' days, by cell ' + tal(cBad, z => z.r.x.inj + ' ' + z.r.x.eq) + '): ' + cBad.slice(0, 8).map(z => z.tag + ' NOT-A ' + JSON.stringify(z.Ni) + ' C ' + JSON.stringify(z.Ci) + (z.a.rounds ? '' : ' rounds ' + z.rn + '->' + z.rc)).join(' || ') : '')]);
  const calfN = D.filter(z => z.calfN), calfLost = calfN.filter(z => !z.calfC);
  cj.push(['b-calf', !calfLost.length, 'leg days carrying `Calf — achilles armor` where NOT-A has it ' + (calfN.length - calfLost.length) + '/' + calfN.length + (calfLost.length ? ' | LOST: ' + calfLost.slice(0, 6).map(z => z.tag).join(', ') : '')]);
  const nonBad = non.filter(z => !z.same);
  cj.push(['b-nonrun', !nonBad.length, 'non-runner leg days byte-identical to NOT-A\'s day ' + (non.length - nonBad.length) + '/' + non.length
    + (nonBad.length ? ' | DIFFER (' + nonBad.length + ' days, by cell ' + tal(nonBad, z => z.r.x.L + ' ' + z.r.x.inj + ' ' + z.r.x.eq) + '): ' + show(nonBad) : '')]);
  const kBad = knee.filter(z => z.Ci.length !== z.Ni.length);
  cj.push(['b-knee', !kBad.length, 'knee/protect leg days with circuit length == NOT-A\'s ' + (knee.length - kBad.length) + '/' + knee.length + ' | lengths ' + tal(knee, z => 'N' + z.Ni.length + ' C' + z.Ci.length) + (kBad.length ? ' | DIFFER: ' + kBad.slice(0, 6).map(z => z.tag + ' NOT-A ' + JSON.stringify(z.Ni) + ' C ' + JSON.stringify(z.Ci)).join(' || ') : '')]);
  row('D195-A-b', cj);
}
function rowAf(){
  const cj = [];
  cj.push(['f-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const S = shardBuilds();
  if(!S.ok){ ['f-shard', 'f-nonbw', 'f-bwlb', 'f-other'].forEach(n => cj.push([n, false, S.why])); row('D195-A-f', cj); return; }
  const all = S.progs, nLB = all.filter(r => r.x.L === 'INJ-LB').length, built = all.filter(r => !r.crash.length), have = built.filter(r => r.uC && r.uV && r.uV2);
  const uself = have.filter(r => r.uV.size === r.uV2.size && [...r.uV].every(n => r.uV2.has(n))).length;
  cj.push(['f-shard', all.length === SH_N.all + SH_N.LB && nLB === SH_N.LB && built.length === all.length && have.length === built.length && uself === have.length,
    'programs ' + all.length + ' (A-b shard ' + (all.length - nLB) + ' + bodyweight lowback prevention ' + nLB + '; hand ' + SH_N.all + ' + ' + SH_N.LB + '), built on candidate and V230 (two VMs) ' + built.length
    + ', _swapUniverse an array on every tree ' + have.length + '/' + built.length + ', V230 universe self-identical in two VMs ' + uself + '/' + have.length]);
  const grp = { nonbw:[], bwlb:[], other:[] };
  have.forEach(r => grp[r.x.eq !== 'bodyweight' ? 'nonbw' : /^lowback\//.test(r.x.inj) ? 'bwlb' : 'other'].push(r));
  const judge = (g, wantOf) => grp[g].map(r => { const want = wantOf(r), lost = [...want].filter(n => !r.uC.has(n)), gain = [...r.uC].filter(n => !want.has(n));
    return (lost.length || gain.length) ? r.x.tag + ' lost ' + JSON.stringify(lost) + ' gained ' + JSON.stringify(gain) : null; }).filter(Boolean);
  const b1 = judge('nonbw', r => r.uV), b2 = judge('bwlb', r => new Set([...r.uV, SH_BEDHT])), b3 = judge('other', r => r.uV);
  const sz = g => grp[g].length ? ' (sizes ' + tal(grp[g], r => r.uC.size + '') + ')' : '';
  cj.push(['f-nonbw', !b1.length, 'non-bodyweight programs with _swapUniverse set == V230\'s ' + (grp.nonbw.length - b1.length) + '/' + grp.nonbw.length + sz('nonbw') + (b1.length ? ' | DIFFER: ' + b1.slice(0, 3).join('; ') : '')]);
  const lbHadV = grp.bwlb.filter(r => r.uV.has(SH_BEDHT)).length;
  cj.push(['f-bwlb', grp.bwlb.length >= 1 && !b2.length, 'bodyweight lowback programs == V230 ∪ {' + SH_BEDHT + '} ' + (grp.bwlb.length - b2.length) + '/' + grp.bwlb.length + ' (denominator ' + grp.bwlb.length + ', must be >= 1; '
    + lbHadV + ' of them already carry the bed thrust on V230)' + sz('bwlb') + (b2.length ? ' | DIFFER: ' + b2.slice(0, 3).join('; ') : '')]);
  cj.push(['f-other', !b3.length, 'every other program (bodyweight, not lowback) == V230 ' + (grp.other.length - b3.length) + '/' + grp.other.length + sz('other') + (b3.length ? ' | DIFFER: ' + b3.slice(0, 3).join('; ') : '')]);
  row('D195-A-f', cj);
}

const ROWS = { 'D195-A-a':rowAa, 'D195-A-b':rowAb, 'D195-A-c':rowAc, 'D195-A-d':rowAd, 'D195-A-e':rowAe, 'D195-A-f':rowAf };
for(const k of ORDER){ try { ROWS[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
done();
