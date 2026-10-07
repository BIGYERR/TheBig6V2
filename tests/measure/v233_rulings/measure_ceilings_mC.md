# Post-V233 measure mC: non-equality version predicates in tests/gates/*.js (no build)

Mode B. Tree: Post-V233 working tree, snapshot taken 2026-10-06 at the start of the pass (index.html ia-version 233).
Script: `tests/measure/v233_ceiling_rows.js [root] [runDir]` (comments and string bodies blanked with version_scope.js's own `blank()`).
Single gate runs at 233 (candidate 233, argv[3] = V232 6ee30ea), one at a time, two lanes max. g230 NOT run (1,064 s, pool=6).

## Denominator
222 non-equality predicates (`< <= > >=`, either operand order, against a 3-digit literal or an era-like constant)
in 76 of 97 gate files.

| class | n | meaning |
|---|---|---|
| (a) minimum | 138 | below-era exit / REFUSED / `>= ERA` conjunct / era-table floor clamp / behaviour on from an era |
| (a2) era switch | 52 | both sides assert (if/else or ternary value); row live at every version |
| cosmetic | 14 | label or log text only |
| fixture | 1 | g225_d187:272 `BASE_VER` (argv[3] provenance) |
| (b) licence | 0 | no non-equality predicate makes a row REFUSE/FAIL above an era |
| (c) silent ceiling | 17 | 11 c-row (whole row dark) + 6 c-conj (a conjunct dark, row still asserts) |

## (c) list (all dark at 233; confirmed by the run's SKIP lines except g230, static)
| site | rows | live row shares the branch | claim's ruling |
|---|---|---|---|
| g190_rounds:414 `VER < D176_ERA` (dark side is the else) | G11b | no (G11f separate) | D176 P-BARERX, V220 |
| g199_deload_arbitration:639 flag `I2_V231` | I2c, I2d (SKIP RETIRED) | flag also drives live I2 value switch | V231 absorb, D196 |
| g217_d160_dedupe_view:117 flag `PAIR_SCOPE = VER <= 218` | K1 gk/multi delta, K2 gk/multi, K3, K4 gk/multi, K5 gk/multi, K6 (10) | yes: same branch runs live K1 gk / K1 multi | D160 V217/218, V219 rescope |
| g224_d185_wctoday:98 `artifactV <= 231` | positional lines 643-647 (5) | no (1b separate) | D185 V224; V232 D199 call 17 |
| g225_d187_pacerate:188 `VER >= 231` | CONFINEMENT (1) | no | D187/D189; V231 absorb |
| g226_d188_beginnermile:301, :314, :588, :592 | G2, G1h-P2b, G1h-P5 (3) | no | D188 V226; V231 absorb |
| g226_d189_pacedisclose:213 flag `V231` | G6b byte-equality conjunct | yes (G6b live) | D189 V226; V231 absorb |
| g228_d193_cueword:234 flag `ONE_RETIRED = VER >= 229` | b-ONECLASS (prints `SKIP …: REFUSED`) | no | D193 V228; D194 Am. 1 (r) |
| g229_d193_build:456, :458, :508 | b, j conjuncts | yes (b, j live) | D193 V229; V231 absorb |
| g229_d194_lens:492, :579 | p-UNSTAMPED, p-SWAP, p-AUX, p-ADD conjuncts | yes (4 live) | D194 V229; V231 absorb |
| g230_d194_lens2:1128 | d194-fixture CLAIM | no | D194 R3′ V230; V231 absorb |

Totals: 24 whole rows dark in 8 gates; 7 rows with a dark conjunct in 3 gates; 11 gates.
Of the crude 17-gate grep list only g217 is (c); g208_*, g207_gk_trial_present, g214, g215, g216 x2,
g218, g219_samecard_draws, g197b, g193_samecard, g207_test_week, g205_d125_spaced, g219_d167 are (a)/(a2).

## Static rule probe
(b) = 0, so every (c) prints a line whose first token is SKIP and none prints FAIL. A word rule on REFUSED/FAIL anywhere
in the branch text calls 9 of 17 (c) a licence (8 carry "never FAIL"/FAIL in the SKIP text, g228 prints "SKIP …: REFUSED").
Reach problems for any static rule: 4 of 17 sit behind a one-hop flag; 2 of 17 have the dark side on the else of a `<`/`<=`;
6 of 17 (c-conj) and g217 share the branch with a live ok(), so "branch has no ok()" misses 7 of 17.
