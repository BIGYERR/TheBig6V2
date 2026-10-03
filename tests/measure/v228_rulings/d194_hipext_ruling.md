# D194 P-HIPEXT — coach ruling (saved verbatim by the main session)

- Issued 2026-10-03 by coach on the V228 tree (`git show HEAD:index.html`, ia-version 228). The working copy carried the parked V229 D193 slice and was not read.
- Trigger: Mario, "how much hip work do workouts get? im running two programs and i dont think i have been assigned to do hip thrusts or anything of the sort", then "lets see what coach says, i just feel like its important to develop but i wanna hear what he says".
- Evidence: measure `tests/measure/v228_hip_volume.js` / `.out.txt` and `v228_hip_volume_hist.js` / `.out.txt`. Coach's scratch (not kept): `legdays.out.txt`, `ident.js`, `lens.js`, `monfri.js`.
- **P-HIPEXT is D195.** Coach wrote "D194" off the registry on the V228 tree; the V229 session then issued D194 to P-INJLENS (handoff registry line 10, commit 5297b4b: "next free D195"). Every "D194", "D194-A" and "D194-B" in the verbatim ruling below reads as D195, D195-A and D195-B. The filename keeps `d194_` because the handoff registry line and the queue memory already cite this path.
- Status: RULED by coach. **Mario CONCURRED 2026-10-03: "i concur with the ruling, build it after V229".** That settles both doctrine calls: (1) A amends V154 D3, so the prevention circuit grows to four items; (2) B lets the budget stop cutting prehab-priced items everywhere. Build slot: **V231, together with P-BWFALLBACK** (Mario in a concurrent chat, commit e0fe785: "P-HIPEXT goes with P-BWFALLBACK at V231"; consistent with "after V229"). V230 is D194 P-INJLENS part 2. One fresh coach rules P-HIPEXT and P-BWFALLBACK together at V231 because both touch `hipExtPool`/`hipExtBW`.
- Mario also asked where barbell hip thrusts belong and accepted the ruling as written: `Barbell hip thrust` stays in the non-prevention `hipExtPool` (Leg superset B) and stays OUT of the prevention circuit (bilateral loaded form, RACK station, single-leg circuit). Not reopened.
- Not checked by coach: overlap with the queued P-BWFALLBACK (bandless hip thrust → single-leg glute bridge), which touches the same `hipExtPool` / `hipExtBW` names on bodyweight and band-light tiers. A fresh coach checks that before builder.
- Tree drift: this ruling was printed on V228. V229 and V230 land before it builds, so measure re-prints the before-picture and the five numbers on the V230 tree before that coach rules.
- Before builder: measure prints the five numbers listed under "Numbers measure must print before builder".

---

RULING — P-HIPEXT, issued as **D194** (registry: highest assigned D193, next free D194; one number, two parts A and B, gate them as D194-A / D194-B).

Evidence this session, all printed from `git show HEAD:index.html` (ia-version 228) via the harness, scratch under `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/aa3a9e4d-3acf-485c-a985-4a887f16c031/scratchpad/coach/` (`legdays.out.txt`, `ident.js`, `lens.js`, `monfri.js`). Measure's tables: `tests/measure/v228_hip_volume.out.txt`, `_hist.out.txt`.

---

## D194 — Hip extension is drawn on every leg day and thrown away twice: once by a branch that never reads it, once by a cost lens that under-implements its own docstring

### Finding

Two different mechanisms, one outcome: a glute-max item is selected for every leg day and almost never printed.

**Prevention branch (HALF MANNY).** `ex.hipExt` is drawn at :8843 on all 12 lifting weeks at seed 76308 (Single-leg hip thrust W5, W6, W9–W12; 45° back extension W1, W2, W7, W8; GHR W3, W4) and the prevention branch at :9259-9272 never reads it. D3's stated premise, "glute-max redundancy with the hinge", keys on the circuit's hinge being a single-leg hinge. At Mario's seed the hinge slot is Barbell RDL (W1–W2, bilateral, hamstring/erector-biased), KB swing (W3–W6, bilateral ballistic), split-stance DL (W9–W10, staggered stance) and a true single-leg DL only in W7, W8, W11, W12. The engine's own `hipExtPool` comment (:8463-8467) states the opposite premise: "Complements the hinge (RDL is hamstring/erector-biased; these are glute- and eccentric-hamstring-biased)." The lattice confirms the branch is the sole cause: support_prevention 0/360 C1 items on every loaded tier (bodyweight 34/72 only because the bodyweight hinge pool happens to carry a glute bridge). Measured week: C2 hinge 4–9 sets, C3 frontal 2–6 sets, C1 glute-max 0 sets, 14 of 14 weeks.

**Non-prevention leg day (PRT TING).** The hip thrust is drawn 6/6 weeks W1–W6 and printed once (W4, a recovery week where `recoveryDeload` drops Leg superset A and the day lands under cap). `capSessionBudget` is the whole story at this seed: `__BUDGET_OFF` prints 6/6. The day arrives at the budget at 23–25.5 against cap 20 every normal week (printed: W1 24.5, W2 25.5, W3 23, W5 23, W6 23, W7 24, W9 25.5); the trim takes the carry (1.5), then the hip thrust (rank 2 via `/superset b/`, 3 sets), then the TKE hold (W2, W9). Measure's hist: the W4 print only exists from V199; W4 was lived earlier, so Mario's lived hip-thrust count on PRT is 0.

**The budget's cost lens is the defect, not its order.** The V100 docstring (handoff L348) prices "carries, holds, isometrics, activation, core 0.5×sets". `_isHalf` (:10539, its only reader is `_cost` on :10540, nothing else in the file reads it) implements that for 4 of the 13 names in the three prehab pools the leg day is built from: `EXLIB.hip_stability` (clamshells and side steps yes; monster walks, band abduction, hip airplane, seated band hip flexion no), `EXLIB.knee_stability` (Wall sit and Spanish squat hold yes; Terminal knee extension (band) no, same slot, same `3×25 sec` prescription, priced 3 instead of 1.5), `EXLIB.foot_ankle` (tibialis raise, banded dorsiflexion, soleus raise, ankle CARs: none). Re-priced to the docstring, every normal PRT leg day lands at **exactly 20 = cap** (W1 24.5→20, W2 25.5→20, W3 23→20, W5 23→20, W6 23→20, W7 24→20, W9 25.5→20; `lens.js`), so `_total<=cap` returns early and the designed card prints whole. That the card lands on the cap to the half-set on seven different draws is the evidence that the leg day was designed to the docstring's price, not the regex's.

### Coaching argument

Running is hip extension. The hinge family trains it at length (hamstrings, erectors); nothing in either program trains the glute at terminal extension, which is the toe-off position and the quality the NSW guide names outright. Page 8: "Problem areas that are often weak and underdeveloped, and should be targeted to avoid injury: … 4. Posterior and medial glutes 5. Hamstrings 6. Tibialis anterior", and rule 8 of the strength-workout list: "Be sure to include exercises for the vulnerable or underdeveloped areas". Medial glute is covered by the Hip stability rail (C3 4–6 sets/week on both programs). Posterior glute is covered by nothing. On a prevention build that is the one quality a runner-armor circuit cannot be missing: glute-max underactivity shifts load onto the hamstrings and lets the hip drop, which is the mechanism behind the ITB, patellar and hamstring complaints the prevention focus exists for. Two sets at RPE 7 (D2) is the right dose; the single-leg form is the right form for a circuit built on unilateral control, and the barbell hip thrust stays what the file already calls it, "the glute-power builder for the athletic goal". On the athletic build the item is already prescribed by the engine; the budget is deleting it because band prehab is being charged as if it were loaded sets. Hard days hard: Tuesday is the no-run leg day on both programs, so the item costs the run nothing.

Why not the order side: pushing Leg superset B ahead of A (D84's pattern) saves the hip thrust 9/9 at seed 87747 but spends the knee hold on 6/9 weeks and the lunge on 3/9 (computed from the printed cards), which is the V123 runner pairing Mario called. Re-ranking a posterior superset B to rank 1 does nothing: the tie-break still evicts the latest rank-1 item, which is the hip thrust. A floor is forbidden (V198 lesson). The cost side is the only lever that fixes the actual defect and displaces nothing.

### What changes

**A. Prevention circuit reads the slot (pool side).** On `preventionSupport`, `hipExtPool` at :8468 is the unilateral glute-max subset of the tier's pool, drawn by the same `_slot` at :8843: measure's C1 class (`hip thrust | glute bridge | pull-through`) minus the two bilateral loaded forms, `Barbell hip thrust` and `Cable pull-through`. By tier that is: crossfit / commercial / home_full → `Single-leg hip thrust` (a pool of one, D5's precedent: prevention filtered power to the swing); minimal / home_basic → `Banded hip thrust`, `Single-leg glute bridge (weighted)`; bodyweight → `Single-leg glute bridge`, `Single-leg hip thrust (shoulders on bed)` under `_bwRung`. Pool and reader share one lens because the reader reads `ex.hipExt`. The runner-armor circuit (:9259-9262) becomes four items, one round, D3's "one circuit" intact and the V123 lunge → hold pairing byte-identical in positions 1–2: `[lunge 2×10 each, kneeStab 2×25 sec, hinge 2×8, hipExt 2×8 each]`. Reps: 8 is the circuit hinge's own count, `each` is the lunge's unilateral form, and 8 sits inside the file's `REP_AFFINITY` row `[/hip thrust/, [6,10]]` (:9918); no new number. The accessory grammar is expected to print it as `2×6–10 each @ RPE 7` by analogy with the hinge (`2×8` → `2×6–10 @ RPE 7`) and the lunge; measure confirms the printed string. Omitted when `ex.hipExt` is null or equals `ex.hinge[0]` (mirrors the non-prevention null handling; the bodyweight hinge pool shares `Single-leg glute bridge`). Station: every name in the subset is `_stationClass` PORT, so the round crosses no fixed station; `Barbell hip thrust` is RACK, one more reason it stays out.

**B. The budget's cost lens is brought to the V100 docstring (cost side).** `_cost` prices an item at 0.5× when `_isHalf(name)` matches OR the name is a member of `EXLIB.hip_stability`, `EXLIB.knee_stability`, `EXLIB.foot_ankle` or `EXLIB.foot_ankle_bw`. Membership, not a longer regex, so the lens follows the pools the writers draw from (:6293, :6313, the kneeStab `_bw` at :8844). Nothing else in `capSessionBudget` moves: cap formula, `SESSION_SET_BUDGET`, `_secRank`, `_itemRank`, the D85 floor, the D50 floor, the trim loop, the protected set. This change can only lower a day's total, so it can only make the loop stop earlier; no day loses an item it prints today.

Slice order: B first, then A. With B landed, A displaces nothing at seed 76308 (every Tue lands 16.5–17.5 after +2). With A alone, the Loaded carry finisher goes on W5, W9, W10, W11 Tue (18.5 + 2 = 20.5) and the trim order, unchanged, names it: carries are the first rung by V100. That is the displaced-sets answer for A, and it is zero once B is in.

### What deliberately does not change

- Taper and race weeks (PRT W10–W11, MANNY W13–W14): primer only, totals 9–10, untouched by A (circuit not built) and B (under cap).
- Long-run day and its eve (`nrcLegLiftPlacement`, `d18LongRunDayPass`), `raceEveLiftPass`: Tuesday is neither; untouched.
- Recovery weeks: A still writes the item (deload keys `leg superset a`, not the circuit); whether `recoveryDeload` reaches a fourth circuit item on W8/W12 is a number for measure (named below).
- D3's shape (one circuit, V123 pairing), D2's dose, D4's calf line, D5's swing: untouched. D3's redundancy clause is withdrawn as a premise; D3 is amended, not retracted.
- Non-prevention leg card order, `Leg superset B` label and rank, D81/D84 (Leg isolation and Calves remain fodder when a day is over cap).
- `Barbell hip thrust` stays in the non-prevention pool for support_athletic and the others; it prints now because the day is under cap, not because it is protected.
- Injury overlays: the new item is `_pattern` hip_ext like any other and the lowback/protect cap on hip_ext applies to it; no overlay logic moves.

### Before / After (expected), the weeks still ahead

**HALF MANNY, seed 76308, next leg day W6 Tue (Oct 6):**
Before (printed):
```
Main — Front squat :: Front squat 3×8 — RPE 7
Leg circuit — runner armor (2 rounds) :: Dumbbell Bulgarian split squat 2×8–12 each @ RPE 7 | Spanish squat hold (KB) 2×25 sec | Kettlebell swing 2×8
Calf — achilles armor :: Dumbbell seated calf raise 2×12–15 each, slow 3-sec lower
Hip stability :: Banded side steps | Clamshells w/ band | Weighted 90/90 hip switch
Foot & ankle :: Single-leg bent-knee soleus raise | Tibialis raise (wall lean)
Loaded carry finisher :: Suitcase carry 3×40 yards each, heavy          (budget view 17.5 / cap 20)
```
After (A+B, expected):
```
Leg circuit — runner armor (2 rounds) :: … | Kettlebell swing 2×8 | Single-leg hip thrust 2×8 each   (grammar: 2×6–10 each @ RPE 7)
everything else identical; carry stays                                     (budget view 15.5 + 2 = 17.5 / cap 20)
```
Same shape W7–W12: W7 (Walking lunge / Wall sit / KB single-leg DL / + Single-leg hip thrust, 17.5), W9 and W10 (goblet side lunge / Spanish hold / split-stance DL / + thrust, 17.5), W11 (Step-ups / Wall sit / KB SLDL / + thrust, 16.5), W8 and W12 deload weeks (circuit + thrust, calf and carry already gone). W13, W14 unchanged. W6 is the one remaining week where the hinge is the swing, so the round holds two glute-max items of different quality (ballistic end-range, slow unilateral); from W7 the hinge is a single-leg or split-stance DL and D3's premise no longer holds at all.

**PRT TING, seed 87747, last loading leg day W9 Tue (Oct 6):**
Before (printed): `Front squat 4×3 — RPE 8.5 | Leg superset A: Dumbbell Bulgarian split squat 3×8–12 each (TKE trimmed) | Leg superset B: Kettlebell single-leg deadlift 3×6–10 (45° back extension trimmed) | Hip stability ×3 | Foot & ankle ×2 | (carry trimmed)` — budget view 25.5 → 18.
After (B, expected): `Front squat 4×3 | Leg superset A (SS 3): Bulgarian split squat + Terminal knee extension (band) 3×25 sec | Leg superset B (SS 3): KB single-leg deadlift + 45° back extension 3 sets — RPE 8 | Hip stability ×3 | Foot & ankle ×2 | Overhead carry 3×40 yards each` — budget view 20 = cap, no trim. W10, W11: unchanged. A does not reach PRT. Note for Mario: the W7–W9 draw at this seed is a 45° back extension, not a thrust; the six hip-thrust draws were W1–W6 and are lived.

### Blast radius (for gatekeeper's differential)

- **A:** focus `support_prevention` only; race, test and no-run families; all six tiers. Every non-taper prevention leg day gains one circuit item (expected 12/12 at seed 76308). Carry finisher may go on any prevention leg day that lands over 20 after +2 (zero at this seed with B). Diff class: one item appended inside `Leg circuit — runner armor`; `rounds` unchanged.
- **B:** every focus, family and tier; every day cell where the budget fires at V228 AND the day carries one of the nine newly-priced names (TKE, monster walks, band abduction, hip airplane, seated band hip flexion, tibialis raise, banded dorsiflexion, soleus raise, ankle CARs). In practice legs days, plus Push days carrying a `Chest + knee` TKE (PRT W1, W2, W9 Mon fire under both lenses, 22 → 20.5 against cap 17, so the trim may stop one item earlier there). Diff class: items present in the V228 `__BUDGET_OFF` build and absent at V228 now print; **zero removals anywhere** (the lens only lowers totals). Expected direction at the legs site: C1 printed rises from 3,551/6,298 toward the 4,969 budget-off figure.

### HALF_MANNY digest

**Moves, by A.** All 12 Tue cards W1–W12 change (the stored grid holds lived weeks too; Mario's lived days stay frozen from `ia_hist_`). **B alone leaves HALF_MANNY byte-identical:** the six items the budget trims at this seed are Mon/Fri core pieces (W2, W5, W6, W10, W11 Mon; W11 Fri), and the only prehab-pool names on those days are `Spanish squat hold (KB)` and `Wall sit`, both already 0.5× under the current regex (`monfri.js`); every Tue is under cap at 19.5 or below and B only lowers it. Digest and all 12 before/after cards get printed from the surgery copy in the build chat, with B landed first, then A (standing ruling 5). Era row 229 anchored to that digest; the B-only arm is a byte-identity conjunct.

### Numbers measure must print before builder (not measured here, by brief)

1. A on the 432 support_prevention lattice builds: leg days gaining the item / losing the carry / losing the D4 calf line (the calf is rank 1 and later than the circuit, so on a day still over cap after +2 the trim spends carry, then calf, before the circuit; if that count is nonzero the fallback shape is the item as its own 2-set section after the calf line, label without the token `hip` so `_protected`'s `/hip/` latch does not catch it) / bodyweight-tier `hinge === hipExt` omissions / `capRegionalFatigue` hits / `recoveryDeload` reaching the fourth item on W8, W12.
2. B on the full lattice: day cells changed, items restored, removals (must be 0), C1 printed at the legs site after.
3. PRT W9 Mon exact after-card (which conditioning or core item returns, if any).
4. The printed grammar string for `Single-leg hip thrust 2×8 each` on a prevention build.
5. The 12 HALF_MANNY Tue cards and digest from the surgery copy, B then A.

### For Mario, in my words

You were right, and the numbers back you. The Half Manny has never had a hip thrust or a bridge on it. Not one set in 14 weeks, on every version since V155. PRT TING picked a barbell hip thrust for you six weeks running and then deleted it five of those six times before you ever saw it, because the set budget was charging your band work and ankle work at the same price as a loaded set and had to cut something. The one week it printed was a recovery week on a version you were not on yet. So your lived total across both programs is zero. The hinge work you have been doing is real and it is not wasted, but it trains the back of the hip at length, hamstrings and low back. Nothing trains the glute at the top, the position you push off from. The Navy guide lists the posterior glute as one of the seven areas that are usually weak and should be trained on purpose to avoid injury. On a prevention program that is the one thing the leg circuit should not be missing. The fix is small. On the Half Manny your Tuesday circuit gets a fourth movement, a single leg hip thrust, two sets at RPE 7, from next Tuesday on. On PRT TING the budget stops double charging your prehab, so the Tuesday card prints the way it was built. For you that is one more week, W9, that gets its back extension, its knee hold and its carry back, then taper. Nothing moves on your run days, your long run, your taper or race week.

**Recommendation:** Ship D194 A and B together in V229 or the next free build, B sliced first, with Mario's concurrence on two doctrine calls: the prevention circuit grows to four items (amends D3, his GO), and the PRT W9 Tuesday card gets three pieces back two weeks out from his test.

**Counter:** V100 added the budget precisely because the hip circuit and holds were invisible to the engine, and B makes that work cheaper again, so the leg day Mario actually trains gets longer (about 11 loaded sets plus holds, band work and a carry, roughly an hour); if he thinks that day is too long, the honest fix is fewer sections on the card, not a cost regex that silently eats the glute work.
