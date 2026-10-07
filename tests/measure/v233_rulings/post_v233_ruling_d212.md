# D212 (coach, Post-V233, 2026-10-06): forward form of g219's retired R2; S4's guard. Saved verbatim by the main session.
Brief: question, measure mS4 (v233_rulings/measure_r2_repeats_mS4.md), handoff :926 / :976 / :993 / :1381, doctrine lines.
Status: RULED by coach; awaiting Mario's concurrence; measure prerequisites (4) open; builder not briefed.

D212 — POOL EXHAUSTED IS A CLAIM ABOUT THE ATHLETE'S GEAR, NOT ABOUT THE BUILD'S DRAW (forward form of R2; S4's guard)

FINDING. R2 pinned a count (28/6) that D188 Class A2 legitimately moved to 36/6 at V226. The engine's own rule at index.html:7366-7368 is not a count; it is "swap a loaded adjacent repeat whenever any like-for-like name is legal; leave it only when the pool is exhausted." S4 (`cands.length<2`) leaves an item that has exactly one legal swap, which the engine's rule forbids and no count catches. Printed on V233 (probe, g219's 5,310-config lattice): every residual repeat in R2's buckets is `Dumbbell front raise` (42 items, 13 configs, all home_full) and in every case the two other dumbbell delt raises already print on the two cards (0 of 144 delt residuals, all buckets, have a family member missing). Under S4: 150 delt residuals with a member missing (80 sat>sun, 8 sun>mon, 62 interior; 144 lateral raise, 6 rear delt fly; 18+ configs), e.g. #7089 W1: Sat Delts finisher [lateral raise; front raise], Sun Accessory V233 [decline press; rear delt fly] vs S4 [decline press; lateral raise] with rear delt fly on neither card.

THE FORWARD CLAIM (one row, every build >= 219, healthy configs). A loaded delt-isolation accessory may print on two consecutive training days (outside Main/Primer/Power on the second) only when every other gear-legal member of the delt-isolation family already prints on one of those two cards; and > 0 such licensed repeats exist on the lattice (liveness).

THE ORACLE (hand-typed from this ruling, never from the engine). FAMILY: Dumbbell lateral raise, Dumbbell front raise, Dumbbell rear delt fly on every tier that has dumbbells (crossfit, commercial, home_full, home_basic, minimal); commercial adds Cable lateral raise and Face pull; bodyweight has no loaded member. GEAR RULE: dumbbells on every tier but bodyweight, cables only on commercial (NSW guide p.6-7: "personalized routines based on equipment availability"; the only delt exercise doctrine names is the "deltoid lateral raise"). CARDS: the shipped program's day cards on the Monday-start calendar (CAL, as g219 already types it). Membership is by name in the table, so no lens (`_pattern`, `isTrackableWeight`) is consulted at all. Soundness: the engine's universe is a SUBSET of the gear-legal family (it only holds pools the build drew: #7089 on crossfit carries one delt name, HALF_MANNY on crossfit carries three), so a FAIL where a gear-legal member is absent from both cards is a real coaching finding, not noise: the athlete owns the dumbbell and was handed a repeat instead. A member the engine adds later cannot break the row; a member removed from the family trips it loudly, which is the correct place for a re-ruling.

THE RESIDUE IS CORRECT, NOT A DEFECT. The 42 front raises are a three-member dumbbell family genuinely used up: Saturday's Delts finisher prints two of three, the tier-B long-run Sunday (D188 A2, "more time on your feet means less lifting that day") prints the third plus one repeat. Front raise is the lowest-cost item on the card (2×10-12 @ RPE 6-7 on #7089), anterior delt that every press already loads, beginner dumbbells: a monotony complaint, not a recovery hazard, the same lens V117 ruled for unloaded repeats (handoff :1381). Doctrine has no 48-hour or same-muscle rule; its upper/lower split IS the hybrid Sunday (run = lower, lifting = upper). The engine's comment stands. Nothing changes in the app.

WHAT DOES NOT CHANGE. index.html, HALF_MANNY (0 residual repeats on V233 and under S4, digest equal, printed), the Main/Primer/Power exemption, V117's loaded-only scope, R2's retired count. The three interior `Single-leg hip thrust` residuals at #14391 (hip_ext family, home_full hypertrophy beginner, V231) are outside this row and outside R2's buckets; a hip_ext or tri_iso table is optional and not needed to trip S4.

Before (V233, #7089 run_base home_full/strength/beginner, rest Mon/Wed/Fri, seed 24865):
  W1 SAT {run} Delts finisher [Dumbbell lateral raise; Dumbbell front raise]
  W1 SUN {run} Accessory [Dumbbell decline press; Dumbbell rear delt fly]
After (V233 unchanged; the row must REJECT this S4 picture):
  W1 SUN {run} Accessory [Dumbbell decline press; Dumbbell lateral raise]   <- rear delt fly on neither card: FAIL

BLAST RADIUS: gate only. Residue lives on home_full hypertrophy/strength (13 configs in R2's buckets, 41 of 42 beginner); the row reads all 5,310. Test goals and race goals alike; no calendar or week moves.

MEASURE MUST ESTABLISH BEFORE BUILDER WRITES IT: (1) 0 violations on every tag V219..V233, healthy configs (I printed V233 only; the 17-arm script already exists); (2) residual delt repeats on the 60 injured lattice configs per tag (V233: 0; if any tag has one, type the shoulder-tier strip from index.html:8050 and :8059 into the oracle, else scope the row to healthy and record the injured count as a watch); (3) the row trips V219+S4 as well as V233+S4 (expect 64+ at V219, 88 at V233 in R2's buckets); (4) the D160 hazard: a member on B before D18 and stripped by D18 would read as a false FAIL; V233 shows 0, confirm per tag. Probe script: /private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/95d4b21f-2594-431f-a459-d740ba2b91b4/scratchpad/coach/probe.js (modes probe / sweep / report).

Recommendation: ship the family-table row as g219's R2 replacement, scoped to healthy configs, with the liveness conjunct, and leave the 42 front raises in the app as licensed residue.
Counter: on a tier-B long-run day the tier's own intent is less lifting, so dropping an exhausted repeat (Sunday Delts keeps rear delt fly alone) would honour both rulings at once; it is an app change touching 13 of 5,310 programs and belongs in §12 as a watch, not in a tooling pass.

## Mario's concurrence (2026-10-07, V234 chat; saved by the main session)
Mario: "Concur with D212. Land it first as a tests-only follow-up, then V234: P-SWAPKEEP."
Status: CONCURRED. Build as the Post-V233 D212 follow-up (tests only, no version, no tag, no deploy proof).
Session siting (main session's call, not a ruling change): the row is g219_d167_pairs.js key `D212`, reading the CAND
program the shard already builds (no new build per config), healthy configs only (`x.ik === 'healthy'`), with the
liveness conjunct (licensed repeats > 0). Injured configs are counted and printed as a watch, never graded. The oracle
is the hand table above, typed in the gate. Manifest: one ruled `+ g219_d167_pairs.js D212` line. v219 S4-D167 leaves
tests/sabotage/known_survivors.txt in the same slice (the list only shrinks; the gate is re-armed).
