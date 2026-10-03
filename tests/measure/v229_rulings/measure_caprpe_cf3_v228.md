# M8 on CF3 (D193 Amendment 3), measured on shipped V228 — measure's report, saved verbatim by the main session

Script `tests/measure/v229_caprpe_cf3.js` (PART=prep|chains|gate|builds|report|extra), output `tests/measure/v229_caprpe_cf3.out.txt` (288 lines). V229 chat, 2026-10-02.

MODE     B (before-picture). This is M8 on a CF3 copy, D193 Amendment 3.

**Summary:** 33 of the 39 ruled figures reproduce exactly on CF3. Six do not, and each is named below. The kept dose closes both new routes: reboot (i-r) and undo (i-u). HALF_MANNY did not move. Uninjured builds are byte-identical, 133 of 133.

**Tree I measured against:** HEAD 2c1a89c == origin/main. `index.html` reads ia-version 228. The working copy equals `git show HEAD` (both sha a53d3ea6c8d2). V227 was taken from `git show 5ce31e8`.

METHOD   `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_caprpe_cf3.js` (PART=prep|chains|gate|builds|report|extra). Output: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_caprpe_cf3.out.txt`, 288 lines.
- **Scratch:** `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure/`, holding `t_cf3.html` (sha caa16e0c6902), `t_v228.html`, `t_v227.html`, the res/gate dumps and the `in/` copies.
- **Lattices:**
  - D190 chain lattice: 18,580 chains (L9 injured, weeks 3/5/7), run in-session, reboot-before-last-hop and undo-route, each on V227, V228 and CF3.
  - D177 gate L1 sweep: 150,068 rows per tree, from 384 builds.
  - L432; `home_basic` (108 builds); L9 class (iii) and (iii-b) pairs; the 4-config wave set; mario stores and hand rows.
- **Oracles:**
  - the hand cap table;
  - a hand hold function typed from Amendment 1 §3 plus R7 (it agreed with CF3's clamp on all 9 probes);
  - a hand stripper;
  - the hand RPE bucket rule for unloadable pairs;
  - the exact R7 and R8 strings from the ruling;
  - V228 shipped as the pre-hold carry, valid because L9 natives on CF3 equal V228 on 1,254 of 1,254.
- **Baseline checks before any diff:**
  - The lens wrapper is neutral: 144 of 144 builds match.
  - Two VMs given the same config agree: 10 of 10.
  - Re-running V227 reproduces the V228-chat V227 run: 18,580 of 18,580, live and boot.
  - The V227 gate re-dump has the same sha as the old dump (209513b5bc59).
- 0 worker crashes; every part printed its summary.

**Siting choices in the surgery.** These are my reading, not the ruling; builder may take them as a reference.
1. **Shared texts.** R7's text is a new top-level constant `INJ_HELD_TEST`. `_testRx`'s text is copied to a top-level `_TEST_RX_TEXT`. Alternative left to builder: hoist `_testRx` itself, which has 3 build readers (:9115, :9197, :9244).
2. **The stripper** (:8095) maps R7 back by exact string equality, not by shape. `_capRpeClamp` puts the R7 check first, using CF2's `_testRx`-shape regex, which accepts any RPE number.
3. **Boot replay (:10162/:10308).** `applySwapPrefs` gains a third parameter, `keep`. Only `applySessionSwaps` passes it, and only as `!!prog.cfg.injury`. With `keep` set, the replay carries from `_preHold` and writes the pre-filter replay result into it. Neither the build path (`exSwapPrefs`) nor undo passes `keep`. Printed: the build path carries a kept dose on 0 of 18,580 chains.
4. **Live tap (:14274).** The carry reads `_preHold` when it exists. `_preHold = _swapDetailFor(...)` is written on every injured hop, even when the filter changed nothing.
5. **R8 trigger.** `_held = /RPE/.test(_preF) && filter output !== _preF`, which is CF2's predicate. Because it is keyed on the converted donor, a donor that named no RPE can still fire it. See miss 5.
6. **The record.** Each `rx` entry gains an optional field `ph` beside `d`. It is written only when the from-card has a string `_preHold`.
7. **Undo (:14440).** Items renamed back from `hit.to` to `from` drop `_preHold`. The rx restore then sets `_preHold = p.ph`, or deletes it when `ph` is absent. This also covers records without `rx` (pre-V221 records).
8. **Injury guard.** On uninjured programs nothing is ever written. `delete` on an absent field is a no-op.

FINDING  (ruled | V228 shipped | CF3)
```
(a)  L432 filter lens RPE>7      316 | 316 (all bwsets) | 0      CF3 vs V228 changed 316, UNCLASSIFIED 0
     (216 plain + 16 Burpees Mains + 28 Pushups (slow 3s eccentric) + 56 Squat (slow 3s tempo), all bodyweight)
     home_basic final lens        120 | 120 (filter lens 120) | 0 ; changed 120, unclassified 0
     (a′) final-only RPE>7          4 | 4 | 4
     (a″) filter-only              52 | 72 (16 RPE>7) | 72 (0 RPE>7)      MISS 1
(e)  class (iii) live/boot   196/210 | 196 live, 196 boot | 0 ; ends 196 bwsets RPE 7 + 14 cue ; live==boot 210/210
     build                   202/218 | 202/218 | 0 ; 202 RPE 7 + 16 cue
(e′) L9 live/boot               114 | 114 / 114 | 0 / 0 ; live==boot 114/114 ; == hand hold 114/114
     build                    52/118 | 52/118 | 0 ; == hand hold 118/118
     wave rows                     20 | 20 >7 | 0 ; live==boot 20/20 ; == hand hold 20/20 ; hold toast 20/20
(i)  in-session residue           487 | 487 | 487 ; same ids on all three trees (0 only-one-side)
     boot == pre-hold          18,093 | n/a | 18,093/18,580 ; live == pre-hold 18,580/18,580 (6,062 uncapped + 12,518 capped)
(i-r) reboot                   18,093 | 18,093 | 18,093/18,580 ; the 487 misses are exactly the V227 residue ids ; rebooted slot carries the dose 18,580
(i-u) undo then hop            sized | 11,096 chains | live==boot 11,096 ; live==direct 5,228 (MISS 2) ; live==pre-hold 11,096 ; undone card carries the dose 11,096
(l)  G3a                          728 | 0 | 832 = 529 hold-of-donor + 199 hold-of-window + 104 R7 donor -> _testRx      MISS 3
     G3d                          263 | 0 | 263
     G3e                          177 | 0 | 202 = 177 + 25 R7 -> _testRx                                                MISS 3
     G3f                          199 | 0 | 199
     G3c off-grammar               89 | 0 | 168 = 89 + 79 R7 -> _testRx                                                MISS 3
     G3c power                    118 | 118 two-only reader / 0 both-wordings reader (HEAD g221 :117-118) | same
D177 L1 changed vs V227         2,247 | 1,594 (literal only) | 2,247: literal 1,594, clamp bwsets 439, grammar@ 130, R7 28,
                                        Burpees Mains 56 (54 clamp + 2 R7), unclassified 0   (labels differ: MISS 6)
(j)  build              30/0/102/0/96 | 0 R7 | 30 (28 + 2 filter-capped Burpees) / 0 number-only / 102/102 / 0 uninjured / 96/96
     live                 127/113/0   | n/a | 127 (56 TEST9 donors + 71 R7 natives, all capped) / 113 == V228 == V227 cards,
                                              toast "Same job, same numbers." 113/113 / 0 number-only ; the 71 get the hold toast 71/71
(k)  hold variants          1,243     | 0 | 1,243 == expected 1,243/1,243 (verbatim 684, unloadable 360, window 199)
     false claims / off-set holds   0/0 | n/a | 0 / 0 ; non-clamp toasts == V228 == V227 148,825/148,825
     INFO 458 (398 + 60)              | 458 (capped targets) | 458: 6.5->6 398, 7.5->7 60      MISS 4 (scope)
(f)  0/1,722 + 9 tank cards           | n/a | 0/1,722 + 0/9 ; 0/348 distinct non-cue details over L432+home_basic+L1
     _stripCapCue(R7) === _testRx true ; identity on _testRx true
HALF_MANNY 0ac7da6b1691a8e1 on V227, V228 and CF3 (unpinned clock, twice; pinned clock 0ac7…)
uninjured 133/133 (37 support lattice + mario_noinj; 96 healthy L1)
uninjured swap object row: mario_noinj W5, 27 slots, two hops then undo; item+day JSON 27/27, ia_swaps_ 27/27, undo day 27/27, 0 _preHold
```

**Mario hand rows (CF3; Amendment 3 "After" reproduces):**
- **In-session:** hop1 `@ RPE 8`; hop2 Leg extension `@ RPE 7` (kept `@ RPE 8`, toast "…Same sets, same reps. Your injury plan holds this one at RPE 7."); hop3 Barbell good mornings `@ RPE 8`. Boot and direct both `@ RPE 8`.
- **Reboot route:** the rebooted slot shows Leg extension `@ RPE 7` with `@ RPE 8` kept; hop3 Barbell good mornings `@ RPE 8`, equal to boot and direct.
- **Undo route:**
  - Records show `rx:[{d:"2×6–10 @ RPE 7", ph:"2×6–10 @ RPE 8"}]`.
  - Undo chip is "Leg extension", which comes back `@ RPE 7` with `@ RPE 8` kept.
  - hop3 Barbell hip thrust prints `@ RPE 8`, equal to boot and direct.
- **V228 shipped:** `@ RPE 8` on every print.
- **R7 rows (knee/wa strength beginner commercial, W6 thu box squat):**
  - → RDL prints `_testRx` (the RPE 9 test) with "Same job, same numbers."
  - → Leg press prints R7's text with the hold toast.
  - → Leg press → RDL ends on the RDL with `_testRx`.
  - Boot matches live on all three.

**The six misses:**
1. **(a″) reads 72, not 52.** The (a″) definition is "capped under the filter lens, not under the final lens". On V228 L432 that is 72 cards, every one `Banded hip thrust{hip_ext}>Burpees`: 36 Mains and 36 cued accessories (Leg superset B 24, Leg circuit 12). The ruled 52 counted only the 16 Mains above RPE 7. The other 20 Mains already sit at or under 7 (12 beginner floor `RPE 6–7`, 8 prevention `RPE 7`).
2. **(i-u) "live == boot == direct" holds on only 5,228 of 11,096 chains, and V228 prints the same 5,228.** Live==boot holds on 11,096 of 11,096 on both trees.
   - In all 5,868 misses the live end is a bwsets card: hop 1 was an unloadable intermediate whose sets-form conversion carries forward.
   - The direct one-hop from the native prints a different shape: capped cue 2,849, capped grammar 694, uncapped grammar 905, uncapped no-RPE 1,420.
   - Example, hip_wa#801, 45° back extension > Barbell hip thrust > Glute-ham raise: live and boot `2 sets — RPE 7 (…)`, direct `2×10 each — hold RPE 7, three in the tank`.
   - Because V228 has identical counts, this route dependence is not the hold. The hold-sensitive comparator (pre-hold carry along the route) passes 11,096 of 11,096.
3. **(l) G3a, G3e and G3c-off grew by 104, 25 and 79 rows.** These are R7-native donors swapped onto uncapped targets that now print `_testRx`, per Amendment 3 §2. They fail a byte-verbatim D==O predicate and pass the re-scoped "verbatim beneath the hold" reading. The 104 G3a rows are the 79 offgram plus 25 null-kind rows. The ruled 118 for G3c power exists only under the V227-era "two"-only reader; HEAD's g221 reader returns 0.
4. **(k) INFO 458 holds only when restricted to capped targets.** Restricted that way, CF3 prints 458, matching how M5 computed it. Run over every target, the same predicate prints 7,378 on CF3 and 7,648 on V228.
   - This measures P-BWBUCKET's uncapped population, which Amendment 3 left unmeasured: 6,920 pairs on V228 rows.
   - Split: 6.5→6 1,009; 7→6 4,736; 7.5→7 186; 8.5→8 451; 9→8 374; 9.5→8 164.
   - Caveat: in the 7→6 bucket my parse reads an `RPE 6–7` donor as 7.
5. **Unruled toast population.** On the 196 L9 class (iii) live pairs, CF3 prints "…No load to add here. Your injury plan holds this one at RPE 7.", where V228 prints "…so take the sets to the same effort."
   - The donor names no RPE (`3×10` after the cue strip). The unloadable reader writes 8, then the clamp lowers it to 7.
   - These pairs are inside Amendment 3 §1's hand oracle (unloadable bucket "else 8") but outside R8's sentence ("an RPE the donor named").
   - The gate L1 rows contain 0 such pairs, so the 1,243 cannot see them. Coach's call.
6. **D177 L1 per-name labels differ; totals match.**
   - Clamp bwsets 439 by final V227 name: Banded hip thrust 108, Single-leg hip thrust 26, Dumbbell goblet squat 67, Split squat 116, Squat (slow 3s tempo) 94, 45° back extension 28. The ruling says "Squat (slow 3s tempo) 277, Banded hip thrust 134".
   - Grammar@ 130: Dumbbell row 46, Single-leg hip thrust 28, Reverse lunge (KB) 56. The ruling says "Dumbbell row 74".

ROOT
- **What D192 moved, by call site:** `swapOriginOf` index.html:14179-14185 at V228 (`list.filter(e=>e.to===name).pop()`).
  - 1,577 undo chips moved between CF2 and CF3. Every one is a hop3 chain that returns to a name already on the card. Example, mario#0, 45° back extension > Step-ups (KB) > 45° back extension: chip "Kettlebell swing" on CF2, "Step-ups (KB)" on CF3.
  - Undo now restores the pre-last-hop card on 18,580 of 18,580 chains, on both V228 and CF3. CF2 managed 17,089 by detail and 17,003 by name. Amendment 3's INFO of roughly 1,500 chains where undo does not restore the pre-last-hop card is therefore 0 on V228.
  - `undoSwap` (:14440) still takes the first record whose `from` matches (`[0]`).
  - The 487 residue did not move: the same ids on V227, V228 and CF3, in-session and in (i-r).
- **Kept-dose writers and readers in CF3 (comments stripped):**
  - boot replay read/write :10188/:10189
  - record write :14309
  - live read :14315
  - live write :14321
  - undo drop :14472
  - undo restore :14485
  - The only generic day/item serializers my grep found are `resnapshotDayEdit`/`snapshotDay` (:1316, :1327); both are copies.

SPREAD   Stores after each route (mario knee/wa W5 thu):
- **After a hop:** `ia_swaps_` holds `ph` on the second record only, because hop 1 is off a native with no kept dose. `ia_programs` holds no kept dose and `ia_hist_` is absent.
- **After `applyRestMove`:** `ia_programs` W5 thu holds `{"name":"Leg extension","detail":"2×6–10 @ RPE 7","_preHold":"2×6–10 @ RPE 8"}`.
  - On reboot it is read back through the freeze's stored grid. Neither record matches the renamed item, so the replay does not fire and the slot comes straight from the stored item.
  - hop3 then prints `@ RPE 8`, equal to boot.
- **Trained-day swap (`snapshotDay`, then hops):** `ia_hist_` carries `_preHold`. On reboot the hist-restored slot keeps it, and hop3 prints `@ RPE 8`, equal to boot.
- V228 writes no kept dose to any store.
- **P-HOLDBENEATH INFO on the gate L1 rows:** 2,965 donor cards are natives the build held (R7 184, bwsets 2,781). 1,623 of them land on uncapped targets.
  - 113 are R7 donors, and they print `_testRx`: 0 R7 rows on uncapped targets.
  - 1,510 are bwsets donors that carry the held RPE 7 verbatim. That is the number-clamp class, still open.

UNKNOWN
- **Not measured:**
  - the travel overlay, gate row (h);
  - seeds other than 76308;
  - the (i-u) lattice beyond hop3 chains whose hop 1 fires (undo onto a hop-2 hold, or multiple undos);
  - hist-restored and past-week days across the lattice (only the one mario row);
  - the add path;
  - sabotage S11–S21.
- **Generic readers:** any reader that iterates or serializes item objects other than the two grep patterns above was not enumerated.
- **Wave rows:** cross-checked against the hand hold and live==boot only, not against the ruling's 8.5/9/8 per-row V227 text beyond the four printed rows.
