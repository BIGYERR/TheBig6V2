# The exercise bench: which movements the generator may draw, from where, for whom: decisions

The pools the generator draws from (`EXLIB` in `core/src/engine/exercise-library.ts`; the per-tier pool literals in
`buildProgram`, `core/src/engine/engine-c.ts`; the prehab blocks `buildHipSection` and `buildFootAnkleSection` and the
four core pillars `CORE_PILLARS` in `core/src/engine/prehab.ts`; the core draw `getDynamicCoreBlock` in
`core/src/engine/core-legs.ts`), the gear gates that decide which tier may print a name (`_gearLens`, `prehab.ts`;
`_auxGearOK`, `region-caps.ts`; the bodyweight sweep's `_BW_SUBS` and `_BW_GEAR`), and the wildcard sessions
(`RAND_POOLS`, `frontends/app/src/legacy/src/js/random-wildcard.ts`). Earlier harvests of the same kind are in the
handoff: V178 (the Darren fold, D1 to D6) and V192 (D41 to D43). Tests: none yet; the build writes them.

## P-BENCH-1 to -4: Mario's screenshot harvest, 2026-10-18 (concurred, not built)

- **Date:** 2026-10-18. Mario brought 20 screenshots (Meta AI summaries of Instagram and YouTube workouts, one
  Instagram caption, one plain list) and asked: run them through coach, match each to the goals and gym setups it
  suits, ask where in doubt, and mind the doubles. **Ruled by:** coach, in the main session, on measure m1 below; Mario concurred 2026-10-18 ("Concur, all 26"),
  with the Russian twist added over coach's call.
  **D-codes:** assigned from the registry when Mario concurs. **Bump:** not picked yet (a ruling that changes what a
  program prescribes is MINOR; Mario picks before the build). **Shipped:** not yet.
- **Measure m1:** `tests/measure/exercise-bench_coverage.js` (report beside it, `.out.txt`): 504 healthy programs, 6
  tiers x 7 lifting focuses x 3 experiences x 2 cardio (run half, bike base) x 2 seeds, on v0.240.0 (v0.240.1, shipped the same day by another session, touched no engine file). For every block a
  movement could join it prints how many programs reach it, per tier and per focus, and every name it prints today
  with counts. A second pass (scratch, not kept) counted core pillars on 5K, 10K, marathon, base and pace-goal runners.

### The sources, transcribed (73 entries, 66 distinct names after 7 doubles; 4 screenshots repeat another)

| Src | What it is | Entries |
|---|---|---|
| S1 | Runner video, "avoid these" (sarcastic) | Incline goblet squat, split lunge calf raise, Cossack squat, banded tibialis raise |
| S2 | Core stability list, 10 | Suitcase carry (overhead or front rack), offset walk (PVC), single-leg stance around the world, advanced side plank (top leg lifted), renegade row, ab wheel rollout, stir the pot (ball), cable chops and lifts, "Milko" bench press (single-arm DB bench), med ball slams |
| S3 | Hip pain list, 13 | Cossack squat shift, loaded half-kneeling hip mobility, pigeon raises, banded leg lifts, hip flexor raises, single-leg glute bridge, Bulgarian split squat, weighted lateral lunge, tiptoe goblet squat, weighted back extension, hamstring curl (on a rower), side plank + banded hip raise, monster steps |
| S4 | Odell Beckham Jr., ELEV80N, 8 | Landmine reverse lunge, split squat jumps, seated overhead DB press, single-arm incline DB bench, loaded farmer marches, renegade rows, Russian flys, plyometric pushups (off a bench) |
| S5 | Maximus Vamvakatis, feet and ankles, 15 | SL balance on Bosu with KB overhead, static SL balance on Bosu, pistol squat on Bosu, forward to reverse taps (slant board), balance on toes, loaded calf raise (step), SL lunge calf raise, Bulgarian ISO hold heel up, weighted tib raise (KB on foot), banded tib raise (seated), towel scrunches, lacrosse ball squeezes, roll out fascia, knee over toe flexion (bench), banded tiptoe walks |
| S6 | Dead bug progression, 3 | Wall-press dead bug (first item cut off: hands push into a wall), barbell dead bug (Li Dayin), overhead load + band + med ball dead bug (Lu Xiaojun) |
| S7 | Radoslav, hip control, 10 | Copenhagen plank bent knee, adductor magnus slide-out, hip airplane, rotational plank, hip thrust with opposite leg, band-resisted KB swing, explosive pin squat from 90°, overcoming isometrics, single-leg band + KB drill (sandball), hip rotation load transfer drill |
| S8 | Instagram lower body, with doses | Deficit reverse lunge 3x12-16 alt, KB swing 3x12-15, heel-elevated goblet squat 3x6-8, lateral lunge to knee drive 2-3x8/side, glute bridge ISO hold 2x30 sec, bent-knee calf raise (cut off; Meta AI read 3x8-10) |
| S9 | Core circuit, 4 rounds | Overhead sit-up x8, V-up x8, Russian twist (heels down) x8/side, kneeling wood chop x8/side |

Doubles across sources: heel-elevated = incline goblet squat (S1, S8); split lunge calf raise = SL lunge calf raise
(S1, S5); Cossack (S1, S3); banded tib raise (S1, S5); renegade row (S2, S4); advanced side plank = side plank + banded
hip raise (S2, S3); single-arm DB bench (S2, S4). **S4 is the V178 source:** its landmine reverse lunge, renegade rows
and split-squat jumps are already in, and its Russian flys and seated-on-floor press were ruled out there.

### What m1 found before ruling (numbers on v0.240.0)

- **Where a block reaches.** Hip stability (and its mobility piece) rides every leg day of every program, all tiers
  (504 of 504). Foot & ankle rides runners' leg days only (252 of 252 run programs, 0 bike). Anti-rotation and
  rotational power reach every program. Power leads the full day on athletic support (36 of 36) and on CrossFit (84 of
  84), 6 of 36 elsewhere. Conditioning is fat loss and athletic support. Leg supersets are every focus but prevention.
  The calves block is hypertrophy only (6 of 84 per tier).
- **F1, the loaded anti-extension tier only ever prints its first member.** 114 of 114 loaded draws per tier print
  `Ab wheel rollouts`; `Weighted dead bugs` and `Barbell rollouts` print 0 of 504 programs. Cause: that branch fires
  when `R ≡ 2 (mod 3)` and draws `rot(arr, R)` = `arr[(2R − 1) mod 3]`, which is index 0 for every such R
  (`getDynamicCoreBlock`, the `anti_extension_loaded` branch). V193 logged `Barbell rollouts` at 0 prints as "latent"
  without the cause. Anything added to that tier would never print.
- **F2, the same draw has no gear lens:** `Ab wheel rollouts` prints 114 times on the bodyweight tier ("No weights")
  and 114 on minimal. `_BW_GEAR` has no wheel token, so the sweep lets it through. Unruled.
- **F3, runners almost never get anti-extension or dynamic bracing.** 0 of the half-marathon (252 programs) and
  pace-goal core blocks; 10% to 28% of 5K, 10K, marathon and base blocks; every bike program gets both. Cause: the
  hard-run test reads `assignedType`, which nothing writes (already in §12, for a ruling), and a runner's core day is
  nearly always the eve of a run, which draws only anti-rotation or rotational power. So a dead bug, sit-up or V-up
  added to those pillars would reach almost no runner, Mario's half included.
- THE HALF MANNY (CrossFit, prevention, half): hip stability and foot & ankle every Tuesday leg day; core Monday and
  Friday, anti-rotation or rotational only; power Saturday, the swing only (prevention keeps only the swing, V154 D5).

### P-BENCH-1, admit 26 movements, each into the pool whose job it already does

No new slot and no new implement (V178 D1's rule). A name's goals and tiers are the block's reach above, narrowed by
its gear. Prehab names join `_pattern`'s explicit prehab rule; every name gets its dose, gear gate, bodyweight
substitute where it names gear, and injury drops as listed.

| # | Name (as it would print) | Source | Pool, block | Goals it reaches | Tiers | Dose | Why, and the injury rule |
|---|---|---|---|---|---|---|---|
| 1 | Single-leg balance hold (eyes closed) | S5 (Bosu x2 folded), S5 balance on toes | `foot_ankle`, `foot_ankle_bw` | runners, every focus | all | 2×30 sec each | Nothing on the bench trains single-leg balance; it is the best evidenced ankle-sprain prevention there is. The floor does the job; the Bosu does not add to it. |
| 2 | Single-leg KB pass-around | S2 around the world | `foot_ankle` | runners | all but bodyweight | 2×5 each direction, each leg | The loaded rung above #1. |
| 3 | Kettlebell tibialis raise (seated) | S5 weighted tib raise | `foot_ankle` | runners | all but bodyweight | 2×15 | The loaded rung above the wall-lean tib raise. |
| 4 | Split-squat heel-raise hold | S5 Bulgarian ISO heel up | `foot_ankle`, `foot_ankle_bw` | runners | all | 2×30 sec each | Calf and Achilles isometric in a running position. |
| 5 | Knee-to-wall ankle rocks | S5 knee over toe | `foot_ankle`, `foot_ankle_bw` | runners | all | 2×10 each | Dorsiflexion range; a wall or a bench does it. |
| 6 | Towel scrunches | S5 | `foot_ankle`, `foot_ankle_bw` | runners | all | 2×20 each foot | Foot intrinsics; toe yoga only appears in race week. A towel is already assumed on every tier (`Towel grip squeeze`). |
| 7 | Tiptoe walks | S5 banded tiptoe walks | `foot_ankle`, `foot_ankle_bw` | runners | all | 2×30 yards | Calf endurance in gait. The band is dropped. |
| 8 | Copenhagen plank (bent knee) | S7 | `hip_stability`, BW stab list | every program, leg day | all (a bench or a chair) | 2×20 sec each | The bench has no adductor work at all. The Copenhagen is the one groin drill with a trial behind it. Hip injury plan drops it. |
| 9 | Side plank (top leg raised) | S2 advanced side plank, S3 side plank + banded hip raise | `hip_stability`, BW stab list | every program | all | 2×20 sec each | Glute med under a side plank; the band is dropped. |
| 10 | Glute bridge hold | S8 glute bridge ISO hold | `hip_stability`, BW stab list | every program | all | 2×30 sec | Glute endurance and pelvic control, gentle enough for a sore back. |
| 11 | Cossack squat shift | S1, S3 | `hip_mobility` | every program | all | 2×6 each side, slow | V192 D41 kept Cossack out of the lunge pool as "a mobility screen wearing a strength caption". S3 files it as mobility, and that is where it goes. Knee injury plan drops it. |
| 12 | Half-kneeling hip flexor stretch | S3 loaded half-kneeling hip mobility | `hip_mobility` | every program | all | 2×45 sec each | The runner's tight hip flexor has no stretch on the bench. Load is optional, so it prints unloaded. |
| 13 | Pigeon lift-offs | S3 pigeon raises | `hip_mobility` | every program | all | 2×8 each | Active end-range external rotation. **Resolution:** "pigeon raises" read as the FRC pigeon lift-off. If the clip shows something else, it is rejected (V178 D5). |
| 14 | Heel-elevated goblet squat | S1, S8; S3 tiptoe goblet folded | `squat` no-barbell loaded list, `EXLIB.squat_joint` | home gyms without a barbell (main), older hypertrophy on barbell tiers | all but bodyweight | the slot's (S8: 3×6-8) | Quad-biased, upright, knee capacity. Knee injury plan drops it, as it drops the goblet. |
| 15 | Pin squat | S7 explosive pin squat, bands dropped | `EXLIB.squat` | barbell tiers, squat main | home full, commercial, CrossFit | the slot's, capped at 6 (`REP_AFFINITY`) | Dead-stop concentric from the safeties. Positional lift, so 6 reps max (doctrine). Knee and low-back plans drop it with the back squat. |
| 16 | Deficit reverse lunge (KB) | S8 | `EXLIB.lunge`, no-barbell loaded lunge list | every focus but prevention (leg supersets) | all but bodyweight | the slot's | A reverse lunge through more range. Knee plan drops it. |
| 17 | Goblet side lunge to knee drive | S8 lateral lunge to knee drive | `EXLIB.lunge`, no-barbell loaded lunge list | same as #16 | all but bodyweight | the slot's, each side | Frontal plane into a single-leg finish and a hip flexor drive. The name avoids "lateral" (`_isCompound` vetoes it, V192 D41). |
| 18 | Dumbbell split-stance calf raise | S1, S5 SL lunge calf raise | `EXLIB.calves` | hypertrophy (the calves block) | all but bodyweight | the slot's | A calf raise in a running stance. |
| 19 | Single-arm dumbbell bench press | S2, S4 (incline folded) | `EXLIB.chest_acc` | strength, balanced, both strength supports (accessory) | all but bodyweight | the slot's, prints a side | Offset load makes the trunk work; one arm makes a light dumbbell heavy (the travel rack). Shoulder plans drop it with the DB bench. |
| 20 | Seated dumbbell shoulder press | S4 | `EXLIB.shoulder` (both lists) | every focus with a shoulder slot | all but bodyweight | the slot's | V178 ruled out the seated-on-floor press because "seated DB press exists". It does not: no seated press is on the bench. This is the bench-seated press V178 meant. Needs a `_pattern` row (vertical press), or the `/press/` catch-all files it horizontal. |
| 21 | Plyo pushups | S4 | power pool, all three lists | athletic support, CrossFit | all | the power slot's (priced 0.5 by the existing `plyo push` row) | Upper-body rate of force; the cost table already prices it and no pool offers it. Shoulder, elbow and wrist plans drop it by name, because 0.5 survives the workaround gate. |
| 22 | Wall-press dead bug | S6 | `anti_extension.static` | non-runners today (F3) | all | 3×8 each, slow | The static anti-extension rung with a press into the wall. |
| 23 | Overhead sit-up | S9 | `dynamic_bracing` | non-runners today (F3) | all | 3×8 | NSW trains the sit-up for the PST ("sets of push-ups, sit-ups and pull-ups 4-5 times" a week, `doctrine/nsw_ptg_sealswcc_11pg.txt`), and no pillar holds one. Low-back plan drops it. |
| 24 | V-ups | S9 | `dynamic_bracing` | non-runners today (F3) | all | 3×8 | The sit-up's harder rung. Low-back plan drops it. |
| 25 | Farmer march | S4 loaded farmer marches | `dynamic_bracing` | non-runners today (F3) | all but bodyweight | 3×20 marches | Loaded hip flexion and bracing in place. The pillar's only member that needs no bar, and a carry for a home gym with no 40 yards. |
| 26 | Russian twist (heels down) | S9 | `rotational_power` | every program (the pillar reaches runners too) | all | 3×8 each | **Mario's call over coach's (2026-10-18, "Add it").** Coach held that the pillar is defined as non-compressive and a twist rotates a flexed spine; Mario kept it at the source's dose, heels down, bodyweight. Low-back plans drop it. It is a hot-tomorrow pillar, so it must stay low fatigue: bodyweight only, never weighted. |

**Widened, not new:** `Split-squat jumps` (S4) joins the no-barbell loaded and the barbell power lists; today it prints
only on bodyweight (4 of 504). The existing 1.5 price keeps it from beginners.

### P-BENCH-2, already on the bench (no change), or folded into a name above

- **Already in, by another name:** banded tib raise = `Banded dorsiflexion`; suitcase carry; renegade row; ab wheel;
  cable chops and lifts and kneeling wood chop = `Cable woodchoppers` / `Band woodchopper (door anchor)`; med ball
  slams = `Ball slams`; banded leg lifts = `Side-lying leg raises` / `Standing band hip abduction`; hip flexor raises =
  `Seated banded hip flexion`; single-leg glute bridge; Bulgarian split squat; weighted lateral lunge = `Dumbbell goblet
  side lunge`; weighted back extension = `45° back extension` (the plate is dose); monster steps = `Banded monster
  walks`; landmine reverse lunge; hip airplane; KB swing; loaded calf raise on a step = `Dumbbell standing calf raise`;
  bent-knee calf raise = `Dumbbell seated calf raise` / `Single-leg bent-knee soleus raise`; rotational plank = `Side
  plank thread-the-needle`.
- **Folded, a variant of a kept name:** tiptoe goblet squat (#14); single-arm incline DB bench (#19); both side plank
  leg-lift entries (#9); both Bosu balances and balance on toes (#1, #4); barbell dead bug = `Weighted dead bugs` (the
  implement is the variable); band-resisted KB swing = `Kettlebell swing` (a band, not a stimulus); hip thrust with
  opposite leg = `Single-leg hip thrust` (the free leg is a cue); hip rotation load transfer drill = `Weighted 90/90 hip
  switch` (one hip in internal rotation, the other in external; if the clip is a standing drill, show it); front-rack
  carry stays out (carries are three threads, Farmer, Suitcase, Overhead).

### P-BENCH-3, rejected, with the reason

- **Russian flys:** rejected at V178 D5 (resolves to no movement). Not reopened.
- **Pistol squat on a Bosu:** a loaded single-leg squat on an unstable base is a balance stunt that lowers the force it
  trains; `Assisted pistol squat` and #1 cover the two halves.
- **Forward to reverse taps:** needs a slant board, and the caption does not resolve to a known drill.
- **Lacrosse ball squeezes:** a cue on a calf raise (heels together), not a movement.
- **Roll out fascia:** self-massage, not training; the app has no slot for it beyond the recovery day's foam roll.
- **The Lu Xiaojun dead bug:** a band, a med ball and an overhead load at once; `Weighted dead bugs` is the rung.
- **Adductor magnus slide-out:** needs sliders, which are not modeled (V178); #8 and #11 cover the adductors.
- **Hamstring curl on a rower:** only the tiers that own a rower would get it, and they already own a better knee
  flexion (machine curls on commercial, GHR on CrossFit).
- **Overcoming isometrics:** a method, not a movement; it needs a position to be one (V178 D5).
- **Single-leg band + KB drill with a sandball:** needs an anchor and a sandbag (V192: no anchors; odd objects wait
  for the HYROX modifier); `Kettlebell single-leg deadlift` and `Hip airplane (light KB)` cover it.
- **Offset walk (PVC):** needs a pipe; `Suitcase carry` is the one-sided carry the bench has.
- **Stir the pot:** needs a stability ball. Held on Mario's call on small gear (below).

### P-BENCH-4, the two defects m1 found that decide whether part of P-BENCH-1 ever prints

- **F1 and F2 are fixed in the same release:** the loaded anti-extension draw rotates on its own clock (the
  `Math.floor((R−1)/3)` shape the rotational branch already uses), and it goes through the same gear lens as the other
  pillars, with a bodyweight fallback to two static members. Without it, `Weighted dead bugs` and anything added beside
  it never print, and the ab wheel keeps printing for athletes who own nothing. Moves every non-runner's loaded core
  day; trained days stay frozen.
- **F3 is not fixed here.** Which runs count as hard is its own ruling, with its own before and after grid, and §12
  already holds it. Until it lands, #22 to #25 reach bike, swim and lift-only programs, and almost no runner.

### Recommendation and counter

- **Recommendation:** admit the 25 (26 with Mario's Russian twist), widen split-squat jumps, keep out the 27 that are already here (20) or are variants of a kept name (7),
  reject the 11 above, hold Stir the pot, and fix F1 and F2 in the same release. Build it in two slices that ship separately: the prehab rail
  first (#1 to #13, which reach THE HALF MANNY), then the strength, power and core names with F1 and F2 (#14 to #25).
- **Counter:** 25 names in one ruling dilutes each one's repetition: the foot & ankle block goes from 4 drills to 11, so
  any one drill appears on about 1 leg day in 5. NSW p.7 asks for variety across days, and the block is prehab, not a
  progression, so the variety is the point; but if Mario wants fewer, cut #5, #6 and #7 first.

### Questions for Mario (doctrine and his own program), and his answers

1. **Russian twist (S9):** coach: leave it out (the rotational pillar is defined as non-compressive, and a twist holds
   the spine flexed while it rotates; NSW's trunk table, Table 3, gives wipers for rotation, and the pillar has them).
   **Mario, 2026-10-18: "Add it."** Admitted as #26.
2. **Small gear** (Bosu, stability ball, sliders, slant board, PVC, lacrosse ball): coach: model none of it now; the
   floor versions go in, and the gadget versions wait in §12 beside the HYROX modifier. Counter: a commercial gym owns
   all of it, so commercial could take Stir the pot today. **Mario, 2026-10-18:** shown a mockup (one wizard step
   after Your equipment, any tier, ticks stored with the program, older programs read as none ticked), he chose
   "Queue it after these": its own release once both slices ship (§12). It unlocks the held gadget moves and retires
   F2 properly (the wheel becomes a tick). The rejects on merit (the Bosu pistol) stay out either way.
3. **THE HALF MANNY:** adding names to a pool reshuffles every future draw from it, so his future hip and foot & ankle
   blocks change (trained days stay frozen; race week's fixed pair does not move). Coach: take the one reshuffle.
   **Mario, 2026-10-18: "Take the reshuffle."**
4. **The list itself (ship or hold):** **Mario, 2026-10-18: "Concur, all 26."** The two-slice order is the session's
   call (order of work), not his.

### Before the build (standing ruling 5)

From a source-surgery copy, coach prints THE HALF MANNY's new digest and every changed card before and after, and the
lattice sweep's moved cells, before builder writes anything. Each admitted name needs a test that it prints on the
tiers above and nowhere else, carries its dose and side, is timed or counted as its dose says, and drops under the
injury plans named.
