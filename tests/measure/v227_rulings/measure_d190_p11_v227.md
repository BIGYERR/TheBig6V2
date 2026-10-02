# V227 measure — D190 RE-RULING 2 premise P11 (gate row (d)) and its named trip

Saved verbatim from measure's return by the main session. Script `tests/measure/v227_d190_p11.js`, output `tests/measure/v227_d190_p11.out.txt`.

**Headline.** **P11 PASS.** Every one of the 7 classes is non-empty and every chain in U_d (15,112) undoes byte-identical; U_d' has 90 chains and D190 created 0 wrong. The named trip works: g227 row d and g221 G5a/G5b/G5c trip. **g221 G7-1a does NOT trip**, so naming G7-1a in the spec would be wrong.

METHOD: enumerator copied from `tests/gates/g227_d190_seam.js` (read, not edited): N=40, N3=6, NC=8, the same seeds, the same FULL days (knee and ankle on tue/thu/sat), the same classes. Configs: the gate's six workaround regions plus HALF_MANNY and mario_noinj (not in the gate's CFGS). W3 and W5. 15,202 chains, all reachable on every tree. Trees: V227 = working index.html; V226 = scratchpad/base_v226.html; SAB = V227 minus index.html:14449–14459 (the `if(Array.isArray(hit.rx)){…}` block in `undoSwap`, anchor count 1). Hand chip = the last hop's `from`; chip read as the card renders it (`swapOriginOf` :14176/:14179, render :12825); expected day after `undoSwap(chip)` = the whole day before the last hop, clock fields stripped. U_d = the chain's `to` names pairwise distinct. Cross-slot: collide2's last card is slot j (holds A after B→A; chip the B→A record); exch3's last card is slot i (holds B after X→B; chip X).

## P11 — row (d) on the seam walk (V227)

| class | \|U_d\| | chip found | chip == hand chip | undo byte-identical | wrong | \|U_d'\| | U_d' wrong | V226 wrong | created | healed |
|---|---|---|---|---|---|---|---|---|---|---|
| hop1 | 3,009 | 3,009 | 3,009 | 3,009 | 0 | 0 | — | — | — | — |
| hop2 | 6,932 | 6,932 | 6,932 | 6,932 | 0 | 0 | — | — | — | — |
| cyc2 | 2,812 | 2,812 | 2,812 | 2,812 | 0 | 0 | — | — | — | — |
| hop3 | 860 | 860 | 860 | 860 | 0 | 90 | 35 | 35 | 0 | 0 |
| cyc3 | 474 | 474 | 474 | 474 | 0 | 0 | — | — | — | — |
| collide2 | 522 | 522 | 522 | 522 | 0 | 0 | — | — | — | — |
| exch3 | 503 | 503 | 503 | 503 | 0 | 0 | — | — | — | — |
| **total** | **15,112** | 15,112 | 15,112 | 15,112 | **0** | **90** | 35 | 35 | **0** | 0 |

By config (undo byte-identical / |U_d|): knee/wa 3,317/3,317; ankle/wa 3,323/3,323; hip/wa 1,384/1,384; lowback/wa 1,378/1,378; shoulder/wa 1,441/1,441; elbow/wa 1,439/1,439; HALF_MANNY 1,379/1,379; mario_noinj 1,451/1,451. U_d created vs V226: 0. U_d' is all hop3: 35 strict A>B>C>B wrong (the D192 class), 55 A>B>A>B right.
Cross-slot examples (knee/wa W3 mon), both byte-identical: collide2 [0][0] CGBP→Bench dips, then [1][0] Incline barbell press→CGBP; last card [1][0] CGBP; chip Incline barbell press (hand: same). exch3 [2][0] DB incline→DB decline, [0][0] CGBP→DB incline, [2][0] DB decline→CGBP; last card [2][0] CGBP; chip DB decline press (hand: same).

## Named trip — SAB (the `hit.rx` restore removed)

| class | U_d wrong on SAB |
|---|---|
| hop1 | 596 / 3,009 |
| hop2 | 977 / 6,932 |
| cyc2 | 81 / 2,812 |
| hop3 | 104 / 860 |
| cyc3 | 9 / 474 |
| collide2 | 81 / 522 |
| exch3 | 38 / 503 |
| **total** | **1,886 / 15,112** |

By config: ankle 449, knee 445, elbow 227, hip 223, shoulder 200, lowback 183, mario_noinj 93, manny 66. Lattice classes (hop1/hop2/cyc2): 1,654 / 12,753. First differing item: donor dose lost 433, rep token differs 342, other 1,111. Example: knee W5 thu, Barbell box squat → Leg press, then undo; the donor comes back `4×5–8 — RPE 7…` instead of `4×3 — RPE 7…`.

| gate on SAB (argv[3] = V226) | result | rows |
|---|---|---|
| g227_d190_seam | PASS 5 FAIL 1 | **row d FAIL**: not byte-identical 1,526 / 10,513, no chip 0 |
| g221_d177_swapfloor | PASS 17 FAIL 3 | **G5a FAIL** (26,715 of 150,068), **G5b FAIL** (Close-grip bench press → Dips → undo returns `3 sets — RPE 6…`), **G5c FAIL**; **G7-1a PASS** (does not trip) |

G7-1a checks the exSwapPrefs window on a build and a reboot, so it never calls `undoSwap`. The trip names that fire are g227 row d and g221 G5a/G5b/G5c.

## UNKNOWN
SAB "other" kind (1,111) not broken down. HALF_MANNY and mario_noinj added here; the gate's own lattice has 6 configs (its row d prints 10,513 lattice chains). U_d' holds only 90 chains on this walk; the full A>B>C>B population is in the undo report (28,246 / 28,246 wrong).
