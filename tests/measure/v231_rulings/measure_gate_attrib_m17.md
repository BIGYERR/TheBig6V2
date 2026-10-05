# M17 — V231: which part moves each M16 figure, and whether its card change is in a ruled diff class

Measure's return, saved verbatim by the main session (V231 chat, 2026-10-04). Script `tests/measure/v231_gate_attrib.js` (PARTs
uni, floor, cls, clsw, gprep, probe; shell steps in its tail comment), output `tests/measure/v231_gate_attrib.out.txt`; scratch
`measure4/` (per_<tree>/ gate outputs, hook/*.jsonl, rows_*.json, cls.out, gcls.out, summ_c.out). Trees are coach's
`coach1/t_*.html` (named at the top of `v231_ruling_d196_d195a1_d197.md`).

MODE     B (before-picture). M17: which part of V231 moves each figure M16 saw move on the whole-V231 copy, and whether the card change behind it falls in a ruled diff class.

## Read this first

Several card changes fall outside every diff class the ruling lists, and two of its "measured" claims do not hold once the lattice is widened. All of it is A (D195 Amendment 1), except one D197 drop and some D196 label variants. Each item below has its count and an example:

1. **A removes carries on runner days.** 49 ops on my lattice. 46 are shoulder/protect, the rest elbow/protect. All are prevention, race or test family, and the remover is `capSessionBudget`. On the cfgs g221 and g229_d194 actually build it is 66 ops. Example: shoulder/protect, commercial, beginner, s1234, sun/wed, W2 tue. B's card has `Loaded carry finisher :: Farmer carry 3×40 yards, heavy`. ABp adds the 4th circuit item, and the carry is gone. The ruling text says "a removal of a carry ... is a regression" and "Carry lost 0", but its lattice had no injured prevention cells beyond L432.
2. **A removes other runner-day items.** 182 ops:
   - `capSessionBudget` removes 128 Core items, mostly on shoulder/protect and elbow/protect.
   - `capRegionalFatigue` removes 30 items from inside `Leg circuit — runner armor`: the lunge (Walking lunge, Reverse lunge, Bulgarian split squat, Step-ups) or the hold (Wall sit 22, Spanish squat hold 12, Single-leg wall sit 4).
   - Example: FULL, support_prevention, race, bodyweight, beginner, s76308, sat/sun, W3 mon. The circuit goes from `Walking lunge | Single-leg wall sit | SL RDL` to `Single-leg wall sit | SL RDL | Single-leg hip thrust (shoulders on bed)`.
   - The ruling said D3 and the V123 lunge-then-hold pairing in positions 1–2 do not change.
3. **A builds its item on knee/protect.** The ruling said it is never built there. It printed on 90 knee/protect days in my lattice (78 loaded, 12 minimal), always as `Bodyweight back extension`. The g215 floor (b) section below explains why.
4. **D197 drops a section.** 9 days: g215's lattice, ankle/workaround, bodyweight, hypertrophy, s4242, W1–W3 mon. `Chest volume :: Burpees 3×15` disappears. The ruling says D197 has 0 drops.
5. **D196 hits labels the ruling does not name.** 12 lattice days on taper or race-week primers: `Primer — Burpees` becomes `Primer — Single-leg glute bridge` (knee/protect) or the bed thrust (lowback). It has D196-1's shape on a `Primer —` label, not `Main —`. g215's cfgs also show a `Leg` (singular) re-draw on knee/protect: `Bodyweight back extension` → `Single-leg hip thrust`, 38 ops.
6. **D196 gives the Burpees pull accessory a different dose.** 86 ops return as `Burpees 3×10`; the ruling only names `2×10`.

All of this is coach's call; I am not ruling on it.

## (1) g210 O6u: the HALF_MANNY swap universe, 86 → 83

**Names lost:** `Barbell hip thrust`, `Glute-ham raise`, `45° back extension`. None are gained.

**Universe size by tree:** V 86 (V230); B 86; W5 86; FL 86; A 83 (14aacbced1c527d7); AB 83 (14aacbced1c527d7); Ap 83 (f5ed630033ebe3db); Ar 83 (f5ed630033ebe3db); ABp 83 (2d35e8f743680cfa); PRE 83 (2d35e8f743680cfa); ALL 83 (2d35e8f743680cfa).

The part is A1, the prevention `hipExtPool` subset (ALL :8495).

**Code path:**
- `prog._swapUniverse = _swapUniverseList()` (:11024) holds every array passed to `pick()` (:1871) or `_swapUniverseAdd`.
- `_slot` registers its whole raw pool (:8813), and `hipExtSel = _slot(hipExtPool,...)` (:8868) is how `hipExtPool` reaches it.
- On V230, commercial prevention registered `['Barbell hip thrust','Glute-ham raise','45° back extension','Cable pull-through','Single-leg hip thrust']`. After A1 only `Single-leg hip thrust` is registered. Cable pull-through survives through another pool.
- The bodyweight filter runs on top (:11002). `swapUniverseFor` (:9980) reads the stored universe and `swapCandidates` (:10105) reads that.

**Does HALF_MANNY (seed 76308) lose a pickable swap?** Yes, on 27 item lists across 23 days, W1–W13:
- 12 are on days whose card is byte-identical V vs ALL: Saturday `Post-run mobility :: Standing calf stretch` on W4–W11 and W13; W1 sat `Power — explosive first :: Kettlebell swing`; W5 and W6 thu `Pull superset B :: Kettlebell swing`.
- 15 are on the Tuesdays: `Calf — achilles armor` raises, and `Kettlebell swing` or `Step-ups (KB)` in the circuit.
- The three names are on no V230 card in any week, so the loss is to the swap sheet only.
- Six more lists lose `Single-leg hip thrust` (W3, W5, W6 tue) because it is now on the card itself.
- Those slots are refilled with other names, such as Step-ups (KB) in 24 lists.

**Across lattices:** Prevention (FULL 432 + L432 144): universe changes on 467/576 programs (commercial 99/108, crossfit 99/108, home_full 93/108, home_basic 72/72, minimal 72/72, bodyweight 32/108). Control (2,880 non-prevention): 0/2,880.

Names lost on prevention: 45° back extension, Barbell hip thrust, Glute-ham raise, Cable pull-through (commercial 99), Bodyweight back extension (home_basic 72, minimal 72, bodyweight 32), Nordic (home_basic 48, minimal 48).

W5 also adds `Single-leg hip thrust (shoulders on bed)` to the universe of 18 bodyweight programs (6 prevention, 12 control). The ruling said the universe was "unchanged in effect".

**Other readers of the narrowed `hipExtPool`:**
- **:8584 `_preInj.hipExt`.** The snapshot is taken after A1, so `_dirty.lower` (:8766) does not move. Read from source, not measured.
- **:8595–8596, the knee/protect filter and its fallback.**
- **:8746 and :8756, the reservation and floor (b).** This is what fires g215 F2; see the next section.
- **:8868 → `ex.hipExt`.** It feeds the circuit at :9297 (that is A2). It also feeds Leg superset B at :9325–9328, but only in the non-prevention branch, which a prevention build never reaches.
- **:9439, `_rdl` in `Lower strength`.** Reached only by locked strength or hypertrophy goals. 0 `Lower strength` changes in the A step of my lattice.
- **The swap universe,** covered above.

## (2) g215 F2: floor (b)

**What it asserts.** D149's floor (b): when the knee/protect hip-extension reservation empties `hipExtPool`, `Bodyweight back extension` is appended (:8756). F2 asserts the floor fires only on the hand-computed tier set FIRE_B = {home_full}. It fires when a copy with the floor written out builds a different program.

**Fires by tree** (replica of the g215 knee/protect lattice, 630 configs, 126 per tier; commercial | crossfit | home_basic | bodyweight | home_full):
```
V    0 |  0 | 0 | 0 |  79
A    4 |  4 | 0 | 0 |  83
Ap  18 | 18 | 9 | 3 |  97
ABp 18 | 18 | 9 | 3 | 102
ALL 18 | 18 | 9 | 0 | 102
```
- Every new firing on a non-home_full tier is support_prevention.
- **Cause:** A1 empties the remainder: `['Single-leg hip thrust']` minus the HT names is `[]`. A2 prints the floor name. A3 lets it survive where `capRegionalFatigue` used to trim it.

**What the athlete sees** (commercial, support_prevention, beginner, run_5k, s76308, W1 thu):
```
V230: Leg circuit — runner armor (SS 2) :: Single-leg hip thrust 2×8–12 each @ RPE 6–7 | Kettlebell single-leg deadlift 2×8 — hold RPE 7, three in the tank
ALL:  … | Bodyweight back extension 2 sets — RPE 6 (leave 3 or more in reserve)    (+ Loaded carry finisher :: Suitcase carry, B-1)
```
That is a bodyweight name with the no-load wording on a commercial-gym card.
- **Counts:** commercial 58 days over 18 programs (5 programs print the name for the first time); crossfit the same; home_basic 22 days over 9 programs.
- **Class:** shaped like A-1, but outside the ruling's stated scope (finding 3 above).

## (3) Table: every other M16 (c) row

Figures are V230 → part trees (unstamped, ia-version 230). M16's stamped ALL231 figures reproduce exactly on the unstamped ALL tree, which is the baseline check.

| Gate row | V230 → ALL | Part | Class | Example |
|---|---|---|---|---|
| g193_pool_overlay debt :43 | trips → stale; PASS 220 → 185 | W5 only | No card change. The gate's static pool resolver loses the ankle/protect literal once it names `_bwHTak`, and 35 assertions stop being evaluated. Instrument blind spot. | — |
| g197d E5 | sha 36b5… → 10a5… | B, AB, ABp, ALL | Source hash of `capSessionBudget` (the `_prehabHalf`/`_cost` edit). Not a card change. | — |
| g199 C1/C3 | 264 → 240 | W5 | D196-1/-3/-4. Lattice: W5 changes 603/245/92 ops classified, plus UNCLASSIFIED Primer renames. | lowback/workaround Main Burpees → bed thrust |
| g199 F2 / F3 / I2 | 15,720 → 15,702; 30,264 → 30,246; I2 blank | W5 | same | — |
| g199 D2 | 19 → 17 | B | B-1 | — |
| g199 E6 | 28 → 40 on B/AB/ABp, 28 on W5 and ALL | B, restored on ALL | B-1 | — |
| g221 G3a / G3c-off / G3e / G6a | 832 → 839; 168 → 172; 202 → 205; 1,243 → 1,253 | W5 only (V, B, A, Ap, ABp, FL all pass) | On g221's own cfgs, W5 changes only bodyweight lowback/workaround days: D196-1 104, D196-3 16, plus 8 UNCLASSIFIED Primer days. The pair-level identity of the +7 is not printed. | — |
| g225 CONFINEMENT | run_base and run_marathon move on B; swim_100, swim_500, bike_ftp move on A | B and A | On its 7 cfgs: B-1 6 ops, A-1 58. All classified. | — |
| g226_d188 G2 | 120 → 0/120 | B | B-1 | — |
| g226_d188 G1h-P2b | 0 → 48 | B 44, A 24, AB 48 | On 404 of its cfgs: B-1 2,739, B-2 3, A-1 903. 0 UNCLASSIFIED. | W1 tue `[Main — Back squat] … [Leg circuit]` |
| g226_d188 G1h-P5 | 0 → 3,252 | B 2,365, A 1,708, AB 3,252 | same | same |
| g226_d189 G6b | 640 → 0/640 | B | B-1, 5,444 ops on 454 cfgs, all classified | run_5k beginner s1000 |
| g227 c-UNINJ / c-DIGEST | 0 → 172/1,396; 8/8 → 7/8 | A (A, AB, Ap, ABp, ALL identical) | A-1, on HALF_MANNY's 12 Tuesdays | — |
| g229_d193 b | 1,053/1,053 → 573 | B 867, A 810, W5 1,010, FL 1,042 (every part) | B-1, A-1, D196-1/-3/-4, D197-1 on its 6 cfgs, all classified. Uninjured 133 → 50 comes from B 86 and A 97. | — |
| g229_d193 d-BWSETS | 1,239 → 1,169 | W5 | D196-4 | — |
| g229_d193 j | R7 30 → 28 | W5 | D196-1: two held Burpees test cards become bridge or thrust | — |
| g229_d193 j, L1 uninjured | 96 → 27 | B 51, A 72 | B-1, A-1 | — |
| g229_d193 f | 1,722 → 1,734 | A 1,725, ABp 1,734 | A-1 | — |
| g229_d194 p-SWAP/AUX/ADD | W3/FIX == V228 lists move | B, A, W5 each | Its 385 cfgs: B-1, A-1, D196 classified, **plus UNCLASSIFIED: 66 carry drops and 73 Core drops (A), and 8 Primer days (W5)** | shoulder/protect W2 tue carry drop |
| g229_d194 p-UNSTAMPED "uninjured MOVED" | moves | A | A-1 | — |
| g230 d194-fixture | L1 150,068 → 150,898, "aligned false" | B 150,047, A 150,044, W5 151,007 | Follows the g221 pair population | — |
| g230 d193-k | clamp 1,243 → 1,253 | W5 | same as g221 | — |
| g230 d193-k INFO capped | 458 → 440 | A | A-1 | — |
| g230 d193-l | as g221 | W5 | same as g221 | — |
| g230 d194-postsweep (unstamped tree) | — | W5: rejects 4; FL: 0 | — | — |

## Lattice classifier

**Method:** day-level ops along the chain V → B → ABp → PRE → ALL; 6,912 configs (FULL 3,024 + INJ 3,024 + L432 + LBW), 385,560 day cells; 0 crashes; V == V on 141/141 builds checked. Every UNCLASSIFIED removal attributed by ablation: `__REGIONAL_OFF` → `capRegionalFatigue`, `__BUDGET_OFF` → `capSessionBudget`.

**V → ALL:** 4,194/6,912 programs and 25,444 days changed.

| Step | Days changed | UNCLASSIFIED days | What is outside the classes |
|---|---|---|---|
| B | 20,023 | 1 | B-1 26,548 ops, B-2 28. One removal: knee/workaround W7 wed, `Barbell good mornings` → `Dumbbell split-stance deadlift` on Leg superset B. |
| A | 5,284 (all prevention) | 200 | A-1 5,000, A-2 722 (all non-runner), A-3 72. Outside: carry or calf removed 49 (all budget), other removals 182. |
| W5 (D196) | 872 (all bodyweight, the four plans) | 41 | D196-1 603, -2 168, -3 92 (+86 at 3×10), -4 245. Outside: the Primer renames and 17 `capRegionalFatigue` drops of `Single-leg glute bridge` from the circuit on ankle/protect bodyweight. |
| FL (D197) | 12 | 0 | D197-1 12 (elbow/workaround). The g215 cfgs add the 9 Burpees drops. |

## Root

- **The A-step removals and the knee/protect item** trace to A1 (:8495) feeding A2 (:9297), with A3 (:10774, :10827, :10830, :10951) letting the item survive. Then `capSessionBudget` (:10576) spends the day's budget and drops the carry or Core items, and `capRegionalFatigue` drops the circuit's first or second item.
- **The universe narrowing** is `_slot`'s registration of `hipExtPool` (:8813, :8868).
- **The D197 drop** is the post-sweep `applyInjuryFilter` (:11007).

## Unknown

- Gate figures on the Ar and PRE trees (skipped for time). g230 on Ap, ABp and ALL (skipped; M16's stamped ALL231 outputs cover ALL). g230 on AB finished with an exit code but did not print its summary in my extract.
- The hook captured only 6–11 cfgs for g199, g225, g227 and g229_d193; most of their builds were not observed. Their classes rest on the lattice classifier plus those few cfgs.
- The pair-level identity of g221's +7, +4, +3 and +10 (I have the part and the card classes, not the pairs).
- Why the 9 D197 drops happen only in g215's lattice (my lattice: 0). Age bracket is suspected; not measured.
- The g193 "35 rows not evaluated" is read from the gate source, not printed from its resolver.
- Sabotage and fuzz were not run.
