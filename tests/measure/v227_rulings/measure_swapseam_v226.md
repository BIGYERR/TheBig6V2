# V227 measure — P-SWAPSEAM before-picture (on V226, HEAD 637bc8e)

Saved verbatim from measure's return by the main session. Scripts: `tests/measure/v227_swapseam.js`,
`v227_swapseam_post.js`, `v227_swapseam_manny.js`; output `tests/measure/v227_swapseam.out.txt`.

MODE     A (prove), with a counterfactual surgery pass (B-style before/after)

**Headline.** The reporter's 68 rows reproduce exactly at V226. The proposed surgery (`applyInjuryFilter` in `applySwapChoice` right after `_swapDetailFor`) takes the gate's 5L residue to 0. It does **not** retire the residue across a wider lattice: it creates 5 new rows of its own. It also turns gate `g221_d177_swapfloor` red: G3c fails on both placements, and G6a fails only on the brief's literal placement. A premise for coach does not survive (point 4 below).

REPRO    mario = commercial | support_strength | beginner | liftonly | knee/workaround | seed 76308. Start 2026-08-24, clock pinned 2026-09-24. W5, hop2, untouched. Each hop goes through `applySwapChoice` on a fresh page; each boot is a fresh page loaded with the device storage the act left.
- Result: **68 of 3,629** mario W5 hop2+cyc2 chains have a slot detail that differs live vs boot.
- By day: sat 26, thu 20, tue 22.
- Rows printed in full:

| row | day, slot, section | chain | live | boot |
|---|---|---|---|---|
| mario#5409 | W5 thu [3][0] Leg superset B | Kettlebell swing (2×8) → Dumbbell split-stance deadlift (2×8) → Dumbbell goblet squat | `2×8` | `2×8 — hold RPE 7, two in the tank` |
| mario#5410 | same | KB swing → DB split-stance DL → Reverse lunge (KB) | `2×8` | same as above |
| mario#5411 | same | KB swing → DB split-stance DL → Leg press | `2×8` | same as above |
| mario#5500 | same | KB swing → Barbell hip thrust → Leg extension | `2×8` | same as above |
| mario#7429 | W5 sat [1][1] Explosive finisher | KB swing (2×10) → DB split-stance DL → Dumbbell goblet squat | `2×10` | `2×10 — hold RPE 7, two in the tank` |

- **The only differing bytes** are the appended suffix ` — hold RPE 7, two in the tank`. Name, reps, sets and RPE are equal on all 68 of 68.
- **One correction to the handoff's account.** The donor is not the RDL slot. It is Kettlebell swing, in "Leg superset B", "Explosive finisher" and "Pull superset B". The middle hop is a hinge (RDL, DL, sumo, trap bar, single-leg DL, hip thrust, GHR). The last hop lands on a knee-capped pattern (squat, lunge, leg_iso).

METHOD   9 configs (mario; HALF_MANNY; mario uninjured; mario knee/protect; mario workaround on ankle, hip, lowback, shoulder, elbow) × weeks 3, 5, 7 × every reachable hop1, hop2, cyc2 chain (gate's enumerator) = **66,969 chains** per tree, all reachable at replay on every tree. Mode t1 (touch, then chain) on a sample of 2,262 chains.
- Trees (scratch copies): BASE = V226 + a neutral probe recording whether the boot re-filter changed the day. S1 = BASE + surgery right after `_swapDetailFor`, before `_reRx` (the brief's literal placement). S2 = same surgery after `_reRx`.
- Oracles: live = what the athlete saw after the last `applySwapChoice`; undo = the live slot before the last hop; cue = the typed literal string.
- Identity: `progDigest` of `buildProgram` equal across HEAD, BASE, S1, S2 for 9 of 9 configs, each built twice. HALF_MANNY `0ac7da6b1691a8e1` on HEAD and S1 = `MANNY_DIGEST_BY_VERSION[226]`. `buildProgram` does not move.

## FINDING 1 — the 5L population at V226 (BASE): 128 / 66,969

| segment | residue / reachable |
|---|---|
| mario knee/wa hop2 | 68 / 6,525 |
| mario knee/wa hop1 | 0 / 552 |
| mario knee/wa cyc2 | 0 / 474 |
| ankle/wa hop2 | 59 / 6,517 |
| ankle/wa hop1 | 1 / 550 |
| ankle/wa cyc2 | 0 / 480 |
| knee/protect, hip, lowback, shoulder, elbow (all classes) | 0 / 33,333 |
| manny (no injury) | 0 / 9,386 |
| mario_noinj | 0 / 7,831 |
| gate lattice: mario W3 / W5 | 0 / 3,370 and 68 / 3,629 |
| gate lattice: manny W3 / W5 / W7 | 0 / 3,177, 0 / 3,018, 0 / 2,472 |

- RPE-bearing donors: 0 residue of 31,775 injured reachable chains. All 128 residue rows have a donor and live detail with no RPE (denominator 17,977).
- Difference kind: 128 of 128 are the cue appended at boot. Pairs: 92× `2×10`, 36× `2×8`. Boot equals the MAP boot on 128 of 128.
- Pattern path: hinge→squat 94, hinge→lunge 28, hinge→leg_iso 6.
- Section: Explosive finisher 50, Pull superset B 42, Leg superset B 36.

## FINDING 2 — the "manny 77" class is the harness's boot model, not the engine
- Booting again in the VM that made the swaps leaves 209 of 8,667 manny hop2+cyc2 chains different from live (W5 114, W7 95). A fresh page leaves **0 of 8,667**.
- Example: Ab wheel rollouts → Garhammer raises. Live `3×8 each`; in-VM boot `2×6–10 each @ RPE 7`; fresh boot `3×8 each`.
- The shared-reference leak documented in the gate's BOOT MODEL comment (lines 34–39). The V222 measure booted in the same VM; same mechanism, different population.

## FINDING 3 — counterfactual S1 (and S2)
- **Residue across the lattice: 5 / 66,969.** All 5 are ankle/wa W3 thu, Leg superset B. **0 of the 5 were BASE residue: the surgery created them.**
- Mechanism: hop 1 goes into a capped pattern (KB swing → goblet squat), so the live card gets the cue. Hop 2 leaves to an uncapped movement; `_swapDetailFor` carries the cue along. At boot both hops replay first and the filter runs once at the end, on an uncapped item, so no cue.
- The 5 rows: 3× live `2×8 — hold RPE 7, two in the tank` vs boot `2×8` (targets DB split-stance DL, KB single-leg DL, and (cyc2) back to Kettlebell swing; the cue sits on a hinge the ankle plan does not cap). 2× live `2 sets — RPE 7 (leave 3 or more in reserve)` vs boot `2 sets — RPE 8 (stop 2 reps short of failure)` (targets 45° back extension and Nordic curl; `_bwSetsFromDetail` reads the cue's "RPE 7").
- The gate's 5L population goes to 0 / 5,088 (g222_d181_chain on S1: PASS 8 FAIL 0).
- Live card moved: 133 / 66,969 (mario hop2 68, ankle hop2 63, ankle hop1 1, ankle cyc2 1). Boot card moved: 0 / 66,969. Reachability moved: 0.
- Toast moved (S1): 133 / 66,969. "Same job, same numbers." becomes "No load to add here…", because `_reRx` (:14291) now sees the cue. S2 moves 0 toasts.
- Undo result moved: 5 (improvements, see SPREAD).
- Per-gate run (all 81 gate files pass on base_v226.html); every gate unchanged on the surgery copies except:

| gate | baseline | S1 | S2 |
|---|---|---|---|
| g221_d177_swapfloor | PASS 20 FAIL 0 | PASS 18 FAIL 2 | PASS 19 FAIL 1 |

- G3c fails on S1 and S2: "0 power pairs change… (got power 118 of 4066 …)". Example: knee/workaround W5 sat, Kettlebell swing → Step-ups (KB), `2×10 => 2×10 — hold RPE 7, two in the tank`.
- G6a fails on S1 only: "the third toast fires exactly when the hand window fires… got 118 of 150068". Toast becomes "No load to add here" on Step-ups (KB).
- g222_d181_chain and g222_d181_durable PASS on both. (`tests/gate.sh` stops at the first red gate; the table is from running each gate directly.)

## FINDING 4 — premise check
- The fix as briefed (S1 placement) breaks the swap toast on 133 live swaps and trips G6a.
- Either placement trips D177's G3c on 118 power pairs and leaves 5 new residue rows.
- Retiring the licence on "residue 0" holds on the gate's own population, not on the 9-config lattice.

## FINDING 5 — the boot re-filter in `applySessionSwaps` (:10316–10318)
- BASE: changes the day on 128 of 49,752 injured hit days (the same 128 residue rows).
- After S1/S2: still changes the day on **128 of 49,752**; every write is the cue on the swapped item (mario 68/68, ankle 60/60). The boot replays from the stored donor detail through `applySwapPrefs` → `_swapDetailFor` (:10166), unfiltered, so the re-filter is what makes boot equal live in those rows. Not redundant.

## FINDING 6 — uninjured configs
manny, mario_noinj: **0 of 17,217** rows moved under S1 or S2 (live, boot, toast, undo). The surgery is guarded on `cfg.injury`.

## ROOT
- Written live at `index.html:14290`: `item.detail=_swapDetailFor(to,item.detail,_rx)`, no injury filter.
- Written at boot at :10316–10318: `applySessionSwaps` runs `applySwapPrefs` (its `_swapDetailFor` at :10166), then `applyInjuryFilter` on a hit. Called from refreshProgram at :16018.
- The cue: `applyInjuryFilter` at :8125, `if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail+=' — hold RPE 7, two in the tank'`.
- `_swapInjuryOK` (:9960–9963) filters a throwaway `3×5` and discards the detail.

## SPREAD (BASE → surgery)

| reader | BASE | after surgery | double-filter risk |
|---|---|---|---|
| `_reRx` / toast (:14291, :14302) | correct | S1: 133 wrong toasts; S2: 0 | — |
| `recordSwap` (:14293) | stores `rx` = donor detail before the rename, plus from/to | unchanged | — |
| undoSwap rx restore (:14422) | undo slot ≠ pre-hop live 0 / 66,969; undo boot ≠ undo live 5 / 66,969 (ankle: undo back to a capped middle restores rx `2×8`, boot re-filters it to the cued form) | 0 / 66,969 and 0 / 66,969; fixes those 5 | — |
| `resnapshotDayEdit` / ia_hist_ (:1309, :14296) | t1: hist ≠ live 0 / 2,262; boot ≠ live 0 / 2,262 | same 0 / 2,262; hist now stores the cued detail | — |
| `snapshotDay` (:1320) | copies the live day; covered by t1 | same | — |
| D177 `_repFloor` window inside `_swapDetailFor` (:10121) | runs before the filter; 1,946 window toasts | 1,946 unchanged; 0 rows carry both window and cue | windowed details carry "RPE", so the filter skips them |
| `REP_AFFINITY` (:1695) | only reader :8826 is a build-time pool filter, not on the swap path | `buildProgram` digest unchanged 9/9 | — |
| idempotency | `f(f(x))==f(x)` on 49,752 / 49,752 injured live days | same | f(live) ≠ live 128 / 49,752 before, 0 after; the cue contains "RPE", so it cannot double |

## UNKNOWN
- hop3+ chains, collide2 and exch3 not run under the surgery (the classes where a middle-hop cue can survive, as in the 5 new ankle rows).
- `applyAddChoice` (:14413) also calls `_swapDetailFor` with no filter, and the boot replays the stored add detail with no filter. Not measured.
- Only the workaround tier swept for ankle, hip, lowback, shoulder, elbow; knee/protect only for knee; halfstep not swept.
- Equipment, focus, experience fixed at mario's values. Weeks 3, 5, 7 only.
- The G3c lattice (event configs, power sections) read from the gate's own output, not re-segmented.
