# measure mS4: g219 row R2 (calendar repeats) and sabotage v219 S4-D167 (Post-V233, no build)

MODE     A (prove the S4 survivor) plus record. No ruling, no recommendation.
METHOD   tests/measure/v233_r2_repeats.js (run / report / week). Lattice: g219 HEAD's own lattice, read verbatim out of
         `git show HEAD:tests/gates/g219_d167_pairs.js` (15,180 configs; swept 5,310 = all 3,900 Sunday-training + every
         8th of 11,280 Sunday-rest). Count: HEAD R2 `reps()` copied; eligibility lens = FROZEN V218 (git 44fd483)
         isTrackableWeight/_pattern. 17 arms: tags V219..V233, V219+S4, V233+S4. Self-check: V219 reads 28/6 (R2's pin).
         Inert logging line before the S4 anchor (cands.length per dedupe decision): progDigest equal on 133/133 sampled per arm.
         Gate reach: 82 gates that execute deconflictAdjacentDupes (tests/measure/v233_gate_reach.json, g230 excluded),
         HEAD-committed copies (git archive, GIT_DIR pinned), each on V233 and V233+S4, baseline V232, shards 1.
         Outputs: scratchpad/measure_S4/ (arm_*.json, v233_hist.out, v233_s4_219.out, v233_s4_233.out, week*.out, gates/).

## 1. Definition
R2 counts ITEMS. For each swept config's shipped program, on the Monday-start calendar, for each day A and day A+1 that both train:
every item on A+1 whose lower-cased name is anywhere on A's card, not in a Main/Primer/Power section, loaded and patterned under V218's lens.
Bucketed by A's weekday: sat>sun (same week), sun>mon (W Sunday to W+1 Monday), interior (everything else, not pinned).
Athlete terms: a loaded accessory he did yesterday is printed again today, in a non-Main block.
Denominators (V233): adjacent training-day pairs sat>sun 39,523, sun>mon 10,800; eligible items on the B day 32,833 / 11,115.

## 2. History (5,310 configs each)
| tags | sat>sun | sun>mon | interior | programs with any repeat |
| V219..V225 | 28 | 6 | 94 | 29 |
| V226..V230 | 36 | 6 | 102 | 29 |
| V231..V233 | 36 | 6 | 105 | 30 |
V225 -> V226: +8 sat>sun, 0 removed: 4 configs (#8394, #9444, #10494, #15111), all run_pace_goal home_full/hypertrophy/beginner, W5 and W6,
`Dumbbell front raise` in the Sunday Delts section. Mechanism (printed, #8394 W5): V225 Sunday = Main incline press + Secondary DB bench only;
V226 Sunday adds Chest volume, Delts [rear delt fly; front raise], Pallof; Saturday's Delts finisher already holds the front raise.
That is the long-run tier reacting to a beginner's mile (D188 Class A2). V230 -> V231 moved only interior (+3), not R2's pins.
Every sat>sun/sun>mon repeat on V233 (42 items, 13 configs) is `Dumbbell front raise`, home_full, hypertrophy; 41/42 beginner.
Dedupe decisions at the anchor on V233: sat>sun cands 0/1/2+ = 64/146/1,455; sun>mon 6/8/143; interior 105/178/4,403.
Ruling text: tests/measure/v226_rulings/d188_d189_ruling.md and d188_a2_relicence.md contain 0 matches for dedupe|repeat|adjacent|consecutive.
The licence that covers the mechanism: handoff :926 (Class A2, coach: "More time on your feet means less lifting that day. That is the same
rule we used before. It just reads your number now."). Adjacent-repeat rulings: handoff :976 (D167), :993 (D160), :1380, :1381 (V117).

## 3. S4
Anchor index.html:7368 `if(!cands.length) return;` -> `if(cands.length<2) return;`: an item with exactly one legal like-for-like swap is left as a repeat.
R2 on V219: 28/6 -> 92/14. On V233: 36/6 -> 116/14 (interior 105 -> 283; programs with any repeat 30 -> 90).
The 88 added sat>sun/sun>mon items: 18 configs, all `Dumbbell lateral raise`, home_full/strength (65 beginner sat>sun Accessory,
15 intermediate sat>sun Accessory, 8 beginner sun>mon Delts finisher).
Week (#7089 NSW solo run_base home_full/strength/beginner, rest mon,wed,fri, seed 24865, W1):
  Sat Delts finisher [Dumbbell lateral raise; Dumbbell front raise] (both arms)
  Sun Accessory V233 [Dumbbell decline press; Dumbbell rear delt fly] / S4 [Dumbbell decline press; Dumbbell lateral raise]
Live gates: 82 run, 82 printed a summary. 1 differs: g217_d160_dedupe_view 13/0 -> 10/11, every FAIL is its own instrument
anchor `if(!cands.length) return;` count 0 (text, not behaviour). g_fuzz_shard_equiv FAIL 1 identically on both arms.

## 4. Doctrine
NSW 11-page guide (doctrine/nsw_ptg_sealswcc_11pg.txt:16): "Use a split routine of upper body and lower body exercises on alternate days."
physicaltrainingguide2020.txt: 0 hits for consecutive / back-to-back / same muscle / alternate days / 48 hours.
Handoff :1381 (V117, Mario's call): adjacent-day spacing scoped to LOADED movements; unloaded repeats "a monotony complaint rather than a recovery hazard".
index.html:7366-7367: "Pool exhausted: LEAVE IT. A duplicate on consecutive days is worse than nothing to swap to, but reaching outside the legal universe to avoid it is worse than both."
Handoff :1506 (parked by Mario): "Back squat then sumo deadlift on consecutive days (the region pass is press-only)."

## UNKNOWN
g230_d194_lens2 not run against S4 (pool of 4 processes, 17 min alone). Builders' working-tree gate edits not run (HEAD copies only).
Why the front raise and lateral raise pools are exhausted / single on home_full (the universe membership) not printed.
