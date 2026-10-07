# measure mD: D212 prerequisites (Post-V233, no build). Numbers only; no ruling, no recommendation.

MODE     A (prove the ruling's four prerequisites before builder writes the row).
METHOD   tests/measure/v233_d212_prereq.js (run / report; MD_SET=injwide sweeps every injured config in U).
         Lattice: g219 HEAD's lattice read verbatim from `git show HEAD:tests/gates/g219_d167_pairs.js`, swept subset 5,310
         (5,250 healthy + 60 injured: shoulder/knee/lowback workaround x20 each). 17 arms: tags V219..V233 (git show V<N>:index.html),
         V219+S4, V233+S4 (tests/sabotage/v219.json S4-D167, anchor count==1). Injured-wide: all 1,020 injured configs in U on V219, V233, V233+S4.
         ORACLE: D212's hand table only (DB lateral raise / front raise / rear delt fly on every dumbbell tier; commercial adds Cable lateral
         raise, Face pull; bodyweight none). Names compared lower-case; no _pattern / isTrackableWeight. Shipped cards, Monday-start calendar,
         every adjacent training-day pair; repeat = family member on B outside Main/Primer/Power whose name is anywhere on A.
         D160 instrument: inert deep-copy snapshots after deconflictAdjacentDupes and before d18LongRunDayPass; inert by progDigest 133/133 per arm
         (26/26 injured-wide); 0 crashes, 0 missing snapshots on every arm.

## Per tag (healthy 5,250; buckets sat>sun / sun>mon / interior)
| tags | delt repeats | VIOLATIONS | licensed (liveness) | injured-60 delt repeats | D160 false FAIL | member stripped after dedupe |
| V219..V225 | 28/6/94 = 128 | 0 | 128 (29 configs) | 0 | 0 | 0 |
| V226..V233 | 36/6/102 = 144 | 0 | 144 (29 configs) | 0 | 0 | 0 |
Licensed residue is home_full only: Dumbbell lateral raise interior (76 at V219, 84 at V233), Dumbbell front raise (52 / 60).
Near-miss names (delt-looking, not in the table) on the healthy lattice: 0 on every tag.

## S4 arms (healthy)
| arm | delt repeats | VIOLATIONS sat>sun/sun>mon/interior | R2 buckets | healthy configs | injured-60 violations |
| V219+S4 | 253 | 64/8/53 = 125 | 72 | 28 | 12 (lowback/knee workaround #8032 et al.) |
| V233+S4 | 282 | 80/8/50 = 138 | 88 | 28 | 12 |
Every healthy S4 violation is Dumbbell lateral raise, home_full (V233+S4: strength 118, hypertrophy 20; beginner 103).
Coach's #7089 W1 sat>sun picture FAILs on V233+S4 (missing rear delt fly), plus W2-5, W7, W9.
D160 on S4: B-side false FAIL 0/125 and 0/138. A-side: 29 / 26 interior violations have the missing rear delt fly on A's pre-D18
card, stripped from Thursday by D18 (e.g. #8460 NSW multi pace+bike home_full/strength/beginner rest sun,wed, W7 thu>fri). The engine
reads A through _d18View, so those are true FAILs; no tag has any.

## Injured beyond the 60 (all 1,020 injured configs in U)
V219 and V233: 6 delt repeats, 6 violations, all #8028 (injury mix, run_base home_full/hypertrophy/beginner, rest sat,sun,
shoulder/workaround), W1..W6 thu>fri, Dumbbell rear delt fly [Delts finisher], missing Dumbbell lateral raise. The lateral raise is
removed by name by the shoulder tier, so a gear-only oracle FAILs an engine-legal card:
  index.html:8050 (protect)    P.dropNames=/\bdips\b|bench dips|lateral raise|front raise|ab wheel|hanging|l-sit|dragon flag/i;
  index.html:8059 (workaround) P.dropNames=/overhead|arnold|push press|military|pike pushup|pike pushups|handstand|wall walk|\bdips\b|bench dips|lateral raise/i;
V233+S4 injured-wide: 161 violations. Near-miss name `Prone Y raise` prints 180 times on injured configs (not in the table).
Intermediate tags V220..V232 were not run injured-wide.

## UNKNOWN
Injured-wide on V220..V232. Equipment tier `minimal` (in the table) is not on the lattice. Whether Prone Y raise is loaded/in-family is unruled.
Outputs: scratchpad/measure_D212/ (arm_*.json, arm2_*S4.json, iw_*.json, report_all.out, report_iw.out, report_s4b.out, haz_8460.out).
