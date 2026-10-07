# Post-V233 measure mE: rows switched by equality to ONE ia-version (Mode B, no build)

Script: `tests/measure/v233_exact_version_rows.js` (modes scan / run / cmp / detail / cost). Runs were on a scratch clone of HEAD be9f8e7 (233), so the builder's in-flight gate edits were never read. Restamping only the `<meta ia-version>` moves no card: the engine reads IA_VERSION for the update banner and the bug line, nothing else.
- R0: candidate 233 vs V232, all 97 gates. R1: candidate restamped 234 vs V233, all 97 gates (this is the next bump, with no era rows added).
- R2: the forced run. Each of the 61 gates with an ERA constant gets HEAD code restamped to its own ERA, against tag V(ERA-1), so every `VER === ERA` is true. g207_gk Q6 was also run at 208 vs 207.
- Bisect: g212 at every tag 213..233 and g219 at every tag 220..233, each restamped to its era.

## Inventory: 139 exact-version rows in 29 gates
138 rows were already dark at 233 (SKIP or SCOPED). One row, g233 D211-untouched, PASSes at 233 and goes SKIP at 234.
- R0 printed 163 dark lines. 25 of them are excluded: range or retired predicates (`>=`, `<=`, `<`), environment skips (doctrine absent), and one summary line.
- R1 at 234: no other row goes silently dark. Every era-table lookup FAILs loudly (NO ROW) in 25 gates, and g193_samecard crashes (no summary).

| gate | rows | i | ii | iii | forced outcome / note |
|---|---|---|---|---|---|
| g206_d137 | 1 | 0 | 1 | 0 | S4a FAIL |
| g207_gk_trial_present | 1 | 0 | 1 | 0 | Q6 FAIL (4 NRC eves moved vs V207) |
| g207_test_week | 5 | 0 | 5 | 0 | B6 B7 B8 B11 D12 all FAIL |
| g208_d103a_chip | 3 | 0 | 3 | 0 | base-version selector; all PASS |
| g208_d103a_key | 1 | 0 | 1 | 0 | K4 needs a pre-slice tree; not forceable |
| g208_d103a_readers | 7 | 0 | 7 | 0 | 5 PASS, N1 FAIL, S3 not forceable |
| g208_d104a_runbase | 2 | 0 | 2 | 0 | R7 FAIL, R8b not forceable |
| g209_d140_tier | 4 | 0 | 4 | 0 | K2 and L1 PASS; C2 and N1 FAIL |
| g210_equipment_denials | 1 | 0 | 1 | 0 | O5b FAIL |
| g211_d153_d155 | 15 | 0 | 15 | 0 | G0 and G2r PASS (6); G3, G4 and G4b FAIL (9) |
| g212_d110a_swim | 10 | 2 | 6 | 2 | i: P1n, SH5. iii: D4, HM |
| g213_d113a | 7 | 1 | 5 | 1 | i: R3v (reach). iii: HM |
| g214_d158_eve | 3 | 0 | 3 | 0 | D7 PASS; D5 and D6 FAIL |
| g215_d149_ghd | 2 | 0 | 2 | 0 | as 7 forced lines: 4 PASS, 3 FAIL |
| g216_d154_swap_lens | 4 | 0 | 4 | 0 | as 6 forced lines: all FAIL |
| g216_d156_longday | 5 | 0 | 5 | 0 | F0 and F2 PASS; F3, N1 and K1 FAIL |
| g217_d160_dedupe_view | 17 | 0 | 17 | 0 | 4 PASS, 13 FAIL |
| g218_d157_swim_sizer | 10 | 1 | 9 | 0 | i: U2 |
| g219_d167_pairs | 9 | 0 | 8 | 1 | iii: R2 |
| g221_d177_swapfloor | 6 | 2 | 3 | 1 | i: G4b, G4c (reach). iii: G9 |
| g221_d178_active | 8 | 0 | 7 | 1 | iii: M1 |
| g221_d179_donenav | 3 | 0 | 2 | 1 | iii: G9 |
| g221_d180_blockopen | 4 | 0 | 3 | 1 | iii: I5 |
| g222_d181_durable | 3 | 0 | 3 | 0 | all FAIL |
| g223_d184_testlen | 4 | 0 | 2 | 2 | iii: R5 in NY and UTC |
| g229_d194_lens | 1 | 0 | 0 | 1 | iii: q DORMANCY PIN |
| g230_d194_lens2 | 1 | 0 | 0 | 1 | iii: d194-postsweep (ii) reach jobs (`VER === ERA` at :846) |
| g232_d199_runwheel | 1 | 0 | 1 | 0 | D-untouched FAIL (V233 moved the bike markup) |
| g233_d207_bikewheel | 1 | 0 | 1 | 0 | D211-untouched PASS at 233; SKIP at 234 |
| **total** | **139** | **6** | **121** | **12** | |

## Class (iii): what moved each claim
- **HALF_MANNY typed 0ac7da6b1691a8e1 (8 rows).** Rows: g212 HM, g213 HM, g221 G9 (d177), M1 (d178), G9 (d179), I5 (d180), and g223 R5 in NY and UTC. Moved at V231: `MANNY_DIGEST_BY_VERSION[231]` is 2d35e8f743680cfa (harness.js:375).
- **g212 D4 (typed 500-goal digests).** The bisect PASSes through V224 and FAILs from V225 (D186 P-CLOCKEND, D187 P-PACERATE).
- **g219 R2 ("CAND calendar repeats sat>sun 28, sun>mon 6").** The bisect PASSes through V225 and reads 36/6 from V226 (D188/D189).
- **g229 q.** The dormancy pin is retired at 230 by D194 part 2. This is the gate's own text; it was not bisected.
- **g230 d194-postsweep (ii).** Forced to 230, HEAD prints 0 reject days where the typed table holds 22. The gate text names P-BWFALLBACK and P-FILTERLAST (V231). Not bisected.

## g219 trio
`PAIR = VER === ERA` gates 9 rows in g219_d167_pairs.js. 8 are class ii: K2a.H, K2a.P, K2a.L, K2a.Z, D167a and R1 PASS when forced; K2b.N and K2b.T FAIL. R2 is class iii.

## Backstop cost
- 215 of 637 mutations across tests/sabotage/*.json name one of the 29 gates. The 637 was read from the working tree, where one spec file differs from HEAD.
- Times come from measure_T1 v233_time.out (8 jobs): serial 11,149 s, and about 1,394 s per build at 8 jobs (LPT packing, equal to sum/8).
- g230 alone is 5 mutations x 841 s = 4,207 s. Without it the total is 6,942 s, or about 868 s at 8 jobs.

## Unknown
- K4, S3 and R8b were not forced: their pre-slice trees exist under no tag.
- The (iii) movers for g229 q and g230 are not bisected.
- Mutation run times are assumed equal to a gate's normal run time. g230 spawns 8 workers of its own, so concurrent g230 mutations would contend.
- Rows outside tests/gates/*.js were not scanned.
