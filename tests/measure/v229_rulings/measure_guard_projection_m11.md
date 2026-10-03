# M11 — re-stated GUARD on the projection (D194 Amendment 2), V229 chat 2026-10-03 — measure's report, saved verbatim by the main session

MODE     B (before-picture). This is M11, the minimal measure D194 Amendment 2 orders. I ruled nothing and edited no tracked file. The shipped gate is unchanged at sha be66cffe0fe6, and `index.html` holds only the pre-existing slice-1/2 working changes.

**Short answer.** All three items print as Amendment 2 expects. The re-stated gate reads PASS 4 FAIL 0 with GUARD 2 / 0 / 0 on both CF5 and V228, M1 trips d2-CHIP and d2-UNDO while GUARD stays clear, and CF5 is unchanged byte for byte. **No miss against the items you asked for.** One sentence in the amendment's Sabotage section does not hold on CF5, below.

METHOD
- Driver: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_guard_projection.js`. Output: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_guard_projection.out.txt`.
- Scratch gate copy (builder's reference): `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure3/m11/g228_d192_undokey_proj.js` (sha 60e062d90265). Its diff against the shipped gate is `…/m11/gate_copy.diff` (4 hunks).
- Raw run outputs: `…/m11/gate_proj_{CF5,V228,CF5_M1}.out`. Mutant tree: `…/m11/cf5_m1.html` (sha 2c2b7ab12d6a). Trees: CF5, V228 (a53d3ea6c8d2), and V227 (c9069fe64113) as argv[3].

Gate-copy edits (every anchor count==1, asserted before writing):
- E0, location only, not part of the gate edit: the two `__dirname` paths (the harness require and `ROOT`) are pointed at the repo, so the copy runs from scratch. Builder does not carry this.
- E1: the `GUARD` constant now carries Amendment 2's row text verbatim. Beside it sit the hand stripper and the projection: `_CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/` (real em-dash); `_TEST_RX_HAND`, the TEST_RX_TEXT literal typed by hand; `_HELD_TEST_HAND`, R7's sentence with the RPE number free, mapping to `_TEST_RX_HAND`; `_stripHand`; `PROJ` = each section's `{label, items:[{name, detail, base:_stripHand(it._preHold ?? it.detail)}]}`; `PHN`, a count of `_preHold` keys.
- E2: `act()` returns `projEq`, `phLive` and `phBoot` beside the unchanged `bootEq`. d2-BOOT-U and every other row still read `bootEq`, the whole-day JSON.
- E3: the INFO D191 and GUARD block. `created` and `healed` are computed on `projEq`. The whole-JSON `createdW` and `healedW` print beside them. A shadow line reads "boot carries no `_preHold` where live does, projection equal". The FAIL thresholds are unchanged (hop5 > 2, walk+hop4 > 0, no-repeated-from > 0).
- INFO cross-check only, not the oracle: the hand stripper agrees with CF5's `_stripCapCue` on 142 of 142 distinct details across the 6 workaround fixtures, HALF_MANNY, MARIO and strength knee/wa (cue-shaped 10, held-test-shaped 1).

FINDING
**(1) The re-stated gate, argv[3] = V227.**

| Row | CF5 | V228 |
|---|---|---|
| Summary | PASS 4 FAIL 0 | PASS 4 FAIL 0 |
| d2-CHIP | 0 of 2,201 | 0 of 2,201 |
| d2-UNDO | 0 of 2,201 | 0 of 2,201 |
| d2-BOOT-U (whole JSON, unchanged) | 0 of 1,587 | 0 of 1,587 |
| d2-MANNY | `0ac7da6b1691a8e1` | `0ac7da6b1691a8e1` |
| GUARD, projection (hop5 / walk+hop4 / no-repeated-from) | **2 / 0 / 0, clear** | **2 / 0 / 0, clear** |
| GUARD, whole JSON beside it (hop5 / walk+hop4) | 36 / 81 | 2 / 0 |
| INFO shadow | **115 of 117** (walk 80, hop4 1, hop5 34); live carries more `_preHold` keys than boot on 115 of 115 | **0** of 2 |

- The 2 projected-created chains are the same pair on both trees: lowback_wa W3 tue hop5, shapes A>B>C>D>C>B and A>B>C>B>D>B.
- INFO D191, boot != live (walk / hop4 / hop5): CF5 whole JSON 98 / 47 / 93; CF5 projection **18 / 13 / 54**, equal to V228's 18 / 13 / 54 (V228 reads the same on both comparators). Projected healed on CF5: hop4 68, hop5 24, the same as V228. Whole-JSON healed on CF5 is hop4 35, hop5 19.

**(2) M1 on CF5** (`.pop()` → `[0]` in `swapOriginOf`): PASS 2 FAIL 2. d2-CHIP trips: wrong 448 of 2,201 (U_d′ 448 of 744, hop5 191 of 1,000), PIN chip "Trap bar deadlift". d2-UNDO trips: wrong 448 of 2,201 (day != pre 448, store != hand on U 318). d2-BOOT-U still passes (0 of 1,587) and d2-MANNY passes. GUARD is clear on the projection: 0 / 0 / 0.

**(3)** CF5 sha 5ff9119afd7e, equal to M10's.

**Against a ruling sentence (not your M11 list): the Sabotage section's "GUARD stays clear under both comparators".** Under M1 on CF5 the whole-JSON comparator reads hop5 39, walk+hop4 81. That is not clear; unmutated CF5 already reads 36 / 81 on whole JSON. The sentence holds on V228; on CF5 only the projection stays clear. Coach's call whether that sentence needs correcting.

ROOT     No new readers. The shadow is D191's lost record against slice 3's `_preHold`, as Amendment 2 finding 1 says. The projection removes it on 115 of 117 created chains and keeps the 2 V228 chains.

UNKNOWN  The re-stated copy was not run against a V226 or V227 candidate for discrimination. No other sabotage spec was run against the copy. The hand stripper cross-check covers 142 build details only; swap-time details on the GUARD chains are not separately cross-checked; the projected figures equal V228's, which is consistent with agreement there.
