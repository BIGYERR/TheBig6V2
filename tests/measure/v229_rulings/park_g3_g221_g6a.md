# V229 gate slice G3 PARKED — g221 G6a cannot pass as ruled (builder's report, saved verbatim by the main session, 2026-10-03)

Standing ruling 7: a gate row that cannot pass is a measure too. Builder's scratch mirror is the quantification; the 9 are enumerated below. Parked script `tests/edits/v229_g3_g221_absorb.py` (must not be run as it stands). Mirror and outputs: `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/builder/g3/` (debug_cand.out lists all 9).

**Why it parks (G6a):** G6a pins 1,252 moved toasts and requires every one to be a hold toast on a clamp pair. Of the 1,252:
- 1,243 are hold toasts on hand clamp pairs, the same count as D193 Amendment 4's (k) "1,243 hold variants". No hand clamp pair lacks its hold toast.
- 9 are not hold toasts. Each is a W6 strength test-week Main carrying R7's text, swapped onto an uncapped unloadable target. The card prints the test text read beneath the hold, and the toast is "Same job, same numbers." That is the class Amendment 3 §2 rules true ("the 113 uncapped targets print `_testRx` byte-identical to V227 with 'Same job, same numbers.' (true)").
- They count as moved only because the gate's existing V228 hand formula is `(zero && O !== D) ? V119 copy`: the card changed (R7 text → test text), so the formula expects the V119 copy.
- D194 Amendment 1 (r) says the row "parks if any moved toast is not a hold variant".

The 9 (all W6 thu, strength, toast "Same job, same numbers."): home_basic beginner knee/wa Split squat → Banded hip thrust; home_basic advanced knee/wa Split squat → Banded hip thrust; bodyweight beginner knee/wa Split squat → Nordic hamstring curl (anchored); bodyweight beginner knee/wa Split squat → Single-leg glute bridge; bodyweight advanced knee/wa Split squat → Bodyweight back extension; bodyweight advanced knee/wa Split squat → Nordic hamstring curl (anchored); bodyweight advanced lowback/wa Squat (slow 3s tempo) → Bulgarian split squat (foot on chair); minimal beginner knee/wa Split squat → Banded hip thrust; minimal advanced knee/wa Split squat → Banded hip thrust.

**Two resolutions builder named (picked neither):**
- (a) At 229, judge G6a's V119 "changed" on the donor read beneath the hold, i.e. the stripped donor. Then the moved count is 1,243, which is D193 Amendment 4 (k)'s own figure, and the pin moves from 1,252 to 1,243. That contradicts D194 Amendment 1 (r)'s "1,252".
- (b) Keep 1,252 and add a named third class: a "Same job, same numbers." toast on an R7 donor read beneath onto an uncapped unloadable target (Amendment 3 §2), pinned at 9.

**Scratch-mirror prints:**

| Run | Summary | G3 rows | G6a |
|---|---|---|---|
| candidate, base_v228 as argv[3] | PASS 19 FAIL 1 | all pass: G3a moved 832 == pin; G3c power 0 == pin 0, off grammar 168 == pin; G3d 263; G3e 202; G3f 199; each with 0 cards off the hand card beneath the hold | moved 1,252, not a hold variant 9, clamp pairs without the hold toast 0, third toast 5,984 vs hand window 5,984 |
| candidate, V220 copy as argv[3] | identical: PASS 19 FAIL 1 | as above | as above |
| base_v228 as candidate | PASS 20 FAIL 0 | path below 229 unchanged | unchanged |
| V228 stamped 229 (discrimination) | PASS 14 FAIL 6 | all five fail at moved 0 vs pin, with 1,267 / 345 / 263 / 460 / 199 cards off the hand card beneath the hold | fails: moved 0, all 2,514 hand clamp pairs lack the hold toast |
| `_capRpeClamp` returning its input unchanged | PASS 14 FAIL 6 | the same six red | red |

In the first run, the hand oracle counts 4,912 Main pairs on a capped target and 1,243 clamp pairs.

**Choices the ruling did not make (builder):**
1. Whether a target is capped comes from the hand cap table plus the candidate's own `_pattern`, the same input the plan's filter reads. Measure's M8 read `_pattern` off a separate V228 VM instead. All expected cards and toasts are computed by hand.
2. The cap table carries only L1's three cells (knee/workaround, lowback/workaround, shoulder/protect; typed from measure's M8 table, `v229_caprpe_cf3.js` :29). Any other injury throws.
3. For the toast's branch and its pre-hold RPE: an unloadable target and a donor that names a rep target `S×R` (typed from D177/V119: "a rep target is a guess … converts those and only those"). Before that rule, 63 test-prose pairs misread; with it, all 63 match.
4. The pins are literals active from 229 up, not an `_BY_VERSION` era table. D133's "counts are era rows" convention would argue for a table.
5. Re-keyed rows print their moved count and pin inside the row label, because a PASS line prints only its label.
