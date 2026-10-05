# M18 — V231: every HEAD gate on the real V231 candidate (saved by the main session)

Measure's return, V231 chat, 2026-10-04. Script `tests/measure/v231_gate_candidate.js` (+ `v231_gate_candidate_p1.js`),
summary `tests/measure/v231_gate_candidate.out.txt` (the full classified list; read it). Raw: session scratch `measure5/`.
All 89 HEAD gates run from a `git clone` of HEAD 71c76d8 (g231_* excluded), each alone, V230 as argv[3]. Copies: candidate
sha256 1249c248a6794d1c (== coach2 t_ALLx except line 8); V230 72ac41c8d34034ce; t_B b958d4b0, t_ABx 8d90f946, t_PREx 45078352.
Attribution chain V230 → B → A (t_ABx) → D196 (t_PREx) → D197 (t_ALLx), each stamped 231; alias clone adds X[231]=X[230].

Headline: V230 control 89/89 pass. STAMP (V230 stamped 231): 18 failing, 1 crash, 1 refusing (== M16). Candidate: 37 of 89
gates failing, 1 crash (g193_samecard), 1 refusing (g230 d194-postsweep): 101 failing lines, 55 version-only (also fail on
STAMP), 46 engine-caused. t_PREx == candidate row for row: D197 (slice 6) moves no HEAD gate row.

(a) tables with no [231] row — figure at 231 on the candidate vs [230]:
  MANNY_DIGEST (harness.js:374) 2d35e8f743680cfa vs 0ac7da6b1691a8e1, moves at A; failing readers g197a:356 D1, g197b:304 B8a,
    g198:222 C1, g199:505 B1, g200_core:153 F1b, g200_pull:328 B1, g202_d108:176 R6, g202_pace_anchor B1, g202_pace_copy:355 B2,
    g203:410, g204:545 (+ each one's row-exists check), g210:423 O6r, g226_d189:137 G10, g227:484 c-MANNY, g228 d2-MANNY,
    g229_d193:421 b.
  MANNY_DELOAD_OFF (harness:393) 145c60296526a949 vs 1069cd7f86eed204, moves at A (g199 B2).
  MANNY_CORE_OFF (harness:412) 5770a4b1c4e2404d vs 9d14801a63111081, moves at A (g200_core:151 F1a).
  DELOAD_ARB_BY_VERSION (g199:179): C1/C3 240 vs 264 (of 17,856 weeks; C3 denominator 14,976), moves at D196 (t_B 264, t_ABx
    264, t_PREx 240); D2 17 vs 19 (sha method 2,863 vs 2,861 differing of 2,880), moves at B; C5 0 and I3 18 (of 15,720) equal.
  Equal to [230]: DELOAD_HINGE (g199:193) E1a 12,369, E1b 9,319, E3 44/15,360, G1 1,275; E6 (g199:186) 28; OPEN_UNRULED
    (g193_samecard:318; throws at :320 = the crash) 53/53; HF_LEAK (g197b:236) and B5C (g197b:251) 0; SWAP_BY_VERSION
    (g200_pull:302) P2c 138, P6 {Kettlebell swing:138}; g219 ERA (:151) R1–R8 = 0,0,0,4770,891,412,0,0.
(b) literal HALF_MANNY `0ac7da6b1691a8e1` pins that fail (candidate prints 2d35e8f743680cfa, first at A), 17 files:
  g207_gk_trial_present:258 Q7, g207_test_week:339 D9, g208_d103a_chip:167 M1, g208_d103a_key:156 K5, g208_d103a_readers:290 M1,
  g208_d104a_runbase:207 M1, g209:293 M1, g210:419/421 O6, g211:67 HM, g214:233 HM, g215:75/282 HM, g216_d154:74 HM,
  g216_d156:64 HM, g223_d183:265/554 [NY] and [UTC] HM, g226_d189:114 G10 and g228:131 d2-MANNY (also table readers).
  Hold the literal but do not trip: g212:136, g213:79, g218:222, g221_d177/178/179/180, g223_d184:722/751.
(c) figures the engine moved (V230 → candidate; part; class):
  g197d:389 E5 capSessionBudget sha 36b5b8efdfa1d3d8 → 5e8f2f07d1c52dfc (B gives 10a5806729632f09, then A6 edits it again).
  g199:561 F2 15,720 → 15,702; g199:562 F3 30,264 → 30,246 (D196). g199:627 I2 108 → 0 (D196: the bodyweight
    "Banded hip thrust → Burpees" rename is gone; D196-1/-6).
  g215:272 P1 ×5 tiers (NEW since M16): knee/protect hip-extension reservation empty on 0 → 898 of 6,301 reads (part A).
    898 of 898 support_prevention reads empty on every tier; 0 of 5,403 in other foci. Cause: A1x (cand:8768) filters
    hipExtPool on prevention to thrust/bridge/pull-through, removing floor (b)'s `Bodyweight back extension` (cand:8755) before
    the reservation is read at :8868. 0 of 630 g215 LAT_K programs change digest B → ABx: the claim breaks at the read site,
    no card moves. UNCLASSIFIED (no card op).
  g221_d177 (all D196): G3a 832 → 839 of 146,289 (:438); G3c off-grammar 168 → 172 of 29,147 (:441); G3e 202 → 205 of 37,567
    (:445); G6a 1,243 → 1,253 of 150,989 (:455). Example: commercial|hypertrophy|beginner|lift|knee/workaround W5 tue, Barbell
    RDL → Leg press, 5×10 RPE 8.5 → RPE 7. D196-2 swaps entering the clamp (measure's reading).
  g225:272 CONFINEMENT: after the S1 strip, digests differ from V225: B moves run_base, run_marathon; A adds run_5k, run_half.
  g226_d188: :290 G2 120/120 → 0/120 (B); :575 G1h-P2b 0 → 48 configs (B 44, A 48); :578 G1h-P5 0 → 3,252 days (B 2,365, A).
  g226_d189:229 G6b 640/640 → 0/640 (B).
  g227 (A; follows the HALF_MANNY move): :474 c-DIGEST 8/8 → 7/8 (miss = manny); :454 c-UNINJ 0 → 144 of 1,396 chains (manny
    144/677, mario_noinj 0/719).
  g229_d193: :421 b outside 1,053/1,053 → 565/1,053, uninjured 133/133 → 50/133; d-BWSETS 1,239/1,239 → 1,169/1,239 (D196);
    :508 f non-cue details 1,722 → 1,734 (A); :456 j L1 uninjured 96/96 → 27/96 (B 51, A 27), R7 on held cards 30/30 → 28/30 (D196).
  g229_d194 p-SWAP/p-AUX/p-ADD move from B on (e.g. p-SWAP FIX == V228 on 8,595 of 9,174); p-UNSTAMPED moves at A.
  g230: d194-fixture L1 150,068 → 150,989 "aligned false" (B 150,047, A 150,042, D196 150,989); d193-k 1,243 → 1,253 (verbatim
    684 → 694, D196); d193-l G3a 832 → 839, G3c-off 168 → 172, G3e 202 → 205 (D196).
(d) instruments that can no longer see what they claim:
  g193_pool_overlay: evaluating assertions 220 → 185 (35 stop running; D196; t_B and t_ABx still 220); unresolved assignments
    3 → 8, the five new ones being the D196 literals (knee/protect squatPool, ankle/protect squatPool, lowback/protect
    backCompoundPool, lowback/protect hingePool, lowback/workaround backCompoundPool). Debt line 43 (thin-pool ankle/protect
    squatPool) stale.
  g199 I2c / I2d pass vacuously on 0 cells (tier census {}); held 108 bodyweight cells before.
(e) designed refusal: g230_d194_lens2:811 d194-postsweep (VER === ERA 230) REFUSES and its INFO row fails, STAMP and candidate.
Now PASS on the candidate (M16 rows): g210 O6u; g215 F2 (all tiers); g199 A1 and g200_pull A1 anchors; g199 I2's blank
interpolation evaluates (reads 0).
UNKNOWN: alias runs on part trees killed partway (STAMP, candidate, t_B finished); no line number for g229_d193 d-BWSETS;
no D196-n/A-n/B-n class checked case by case against the g221/g230/g229 populations (classes rest on part attribution and
printed examples); g225–g229 moves not segmented beyond what each gate prints; sabotage and fuzz not run.
