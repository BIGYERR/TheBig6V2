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
  program prescribes is MINOR; Mario picked it for slice 1). **Shipped:** slice 1 (#1 to #13) in v0.241.0 as D239;
  slice 2 (#14 to #26) queued.
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

## D239 P-BENCH-PREHAB: slice 1, the thirteen prehab movements (ruled 2026-10-18, building as v0.241.0)

- **Date:** 2026-10-18. **Ruled by:** coach, on P-BENCH-1 #1 to #13 as Mario concurred, with the integration measure
  below. **Bump:** MINOR, v0.241.0 (Mario, 2026-10-18). **D-code:** D239, the registry's next free number on HEAD
  55a10bf (v0.240.1). **Shipped:** v0.241.0 (2026-10-18), with Amendment 1.
- **What the integration measure found** (the 13 names read through every rule that judges a name, on v0.240.1):
  1. `_pattern` would file three of them as training patterns: `Split-squat heel-raise hold` and `Cossack squat shift`
     as `squat` (the trailing `/squat/` catch-all), `Glute bridge hold` as `hip_ext`. That counts them as leg volume
     and lets a pattern drop or cap reach them. V178 rule: prehab is exempt by an explicit rule, not by falling through.
  2. The mobility piece of the hip block has always cost nothing in the session budget (every member matches the
     stretch rule). `Cossack squat shift` and `Pigeon lift-offs` do not match it; priced at their sets they change 707
     of 1,728 lattice programs (a bodyweight leg day loses its leg isolation, for one).
  3. The dose sweeps would rewrite five of the doses: the loaded tiers' rep-range grammar (`Pigeon lift-offs 2×8 each`
     becomes `2×6–10 each @ RPE 7`, `Knee-to-wall ankle rocks` likewise) and the bodyweight sweep's effort copy
     (`Towel scrunches`, `Tiptoe walks`, `Cossack squat shift` become `2 sets — RPE 8`). A mobility drill and a foot
     drill take no effort target.
- **The ruling, whole:**
  - **Pools and doses:** P-BENCH-1 #1 to #13 exactly as tabled above: `EXLIB.foot_ankle` gains #1 to #7,
    `EXLIB.foot_ankle_bw` gains #1, #4, #5, #6, #7; `EXLIB.hip_stability` and the bodyweight stability list in
    `buildHipSection` gain #8, #9, #10; `EXLIB.hip_mobility` gains #11, #12, #13; each dose in its block's detail table.
  - **`_pattern`:** the V178 prehab exemption line names `balance hold`, `pass-around`, `heel-raise hold`, `ankle rock`,
    `towel scrunch`, `tiptoe walk`, `glute bridge hold`, `cossack`, `hip flexor stretch`, `pigeon`. (The two planks
    already leave at the core line's `plank`; the KB tib raise at `tibialis`.)
  - **The budget:** the mobility piece stays free: the session cost's stretch rule in `budget-engine-d.ts` gains
    `cossack|pigeon`. The long-run tier B counter's copy of the rule stays as it is: a hip block never lands on a tier B
    day (0 of 1,728 lattice programs move when that copy is changed), so the edit would be untestable.
  - **The doses stay as written:** `_BW_KEEP_FIXED` gains `ankle rock|towel scrunch|tiptoe walk|cossack|pigeon`.
  - **Injury plans, by the plan's own shape (protect drops, workaround keeps unless the load is the injury):**
    knee/protect drops `Cossack squat shift` and `Split-squat heel-raise hold` (it already drops the knee-cap
    isometrics, wall sit and Spanish squat); hip/protect drops `Copenhagen plank (bent knee)`, `Cossack squat shift`
    and `Glute bridge hold` (it already drops hip extension); hip/workaround drops `Copenhagen plank (bent knee)` (the
    adductor is the likeliest injured tissue in a hip plan). An ankle plan already steps the whole foot & ankle block
    aside. P-BENCH-1 said "knee injury plan drops" Cossack; this narrows it to protect, where the plan drops squats.
  - **Unchanged:** race week's fixed pair (`Standing ankle CARs`, `Toe yoga`); the taper keeps drawing foot & ankle
    (V179) and drops hip stability; foot & ankle stays runner only; the hip block still draws two stability drills and
    one mobility piece.
- **Before and after (the source-surgery copy, `base_v0.240.1.html` vs the copy, scratch):** THE HALF MANNY
  2d35e8f743680cfa → **b7ca51befcf96a9e** (self-stable). 12 days change, all Tuesdays, and only their Hip stability and
  Foot & ankle sections. W1 is unchanged; W6 Tuesday's foot block, before `Single-leg bent-knee soleus raise 2×12 each,
  slow | Tibialis raise (wall lean) 2×20`, after `Single-leg balance hold (eyes closed) 2×30 sec each | Single-leg KB
  pass-around 2×5 each direction, each leg`; W13 Tuesday's, after `Split-squat heel-raise hold 2×30 sec each |
  Kettlebell tibialis raise (seated) 2×15`. On the FULL lattice x run/bike (1,728 programs) every program moves; 0
  violations of tier, runner, race week, injury or dose; the 13 print 84 to 784 times per tier.
- **One knock-on, classified (after Amendment 1, against v0.240.1):** 112 items outside the prehab blocks are added
  and 0 lost on the 1,728 programs, every one on the bodyweight tier (a leg isolation, a calves block, a superset's
  second item, the armor circuit's fourth item that the budget used to cut). Cause: D195-B prices the rails at half by `EXLIB.hip_stability`, so the three shared
  names cost half on bodyweight while the four bodyweight-only names (`Side-lying leg raises`, `Clamshells
  (bodyweight)`, `Fire hydrants`, `Standing hip abduction`) still cost full. Found, not fixed (§12).
- **Watch:** the hip block's "two glute med drills" promise was already diluted by V178's airplane and hip flexion; with
  the Copenhagen and the bridge hold, a loaded tier's block draws no abductor 1 time in 6 (was 1 in 15).
- **Tests** (`tests/integration/exercise-bench.test.ts`, `tests/unit/exercise-bench.test.ts`): each name prints with its
  dose on the tiers above and nowhere else; the two KB names never on bodyweight; no foot name on a bike program; race
  week keeps its pair; each injury drop next to a healthy twin that prints the name; `_pattern` is null for all 13;
  a hand session at the cap keeps every item with the Cossack or the pigeon as its mobility piece; THE HALF MANNY's
  digest and cards in the program-output snapshot; the lattice snapshots regenerated by this ruling.

### D239 Amendment 1: the injury drops come out of the pool before the draw (coach, 2026-10-18, during the build)

- **Premise refuted by the sweeps:** the ruling said the hip block "still draws two stability drills and one mobility
  piece". With the drops applied after the draw (by `applyInjuryFilter`, like every other drop), a block that drew a
  dropped name printed short: 720 short blocks on knee/protect and 452 on hip/workaround across the 1,728 lattice
  programs, and the freed budget let other items print (floor (b)'s back extension on one home_full knee/protect
  cell, 84 → 85 in the armor circuit sweep).
- **Amended:** `buildHipSection` and `buildFootAnkleSection` take the plan's drop list (`_prehabKeep` in Engine C, from
  `injuryPlan(cfg).dropNames`) and filter their pools before the draw, so an injured athlete's prehab blocks keep their
  count: 0 short blocks after. Healthy programs are untouched (THE HALF MANNY stays b7ca51befcf96a9e); 408 injured
  programs move (knee/protect 192, hip/workaround 216, and hip/protect off the lattice). Only the D239 names are in any
  plan's drop list among the prehab pools, so nothing older moves. Race week's fixed pair is not filtered.
- **Tests:** the injury-drop test in `tests/integration/exercise-bench.test.ts`, and a guard that no injured
  athlete's hip block prints under three items or foot block under two.

## P-BENCH-5 to -7: the second batch of screenshots, 2026-10-19 (concurred, not built)

- **Date:** 2026-10-19. Mario sent 12 more screenshots after v0.241.0. **Ruled by:** coach, in the main session, on
  measure m1's block reach (unchanged by D239 for these pools); Mario concurred 2026-10-19 ("Add all to the next build").
  **D-codes:** when slice 2 is slotted. **Shipped:** not yet; rides slice 2.
- **The sources (12 screenshots, 6 distinct; 46 entries, 41 distinct names):** the S8 lower-body post again (Instagram
  and Meta AI, twice each: already P-BENCH); B1 Bernardo Rebeil, NFL core (hollow press 3×30-40, ball slams,
  woodchoppers, side to sides), twice; B2 Joey Bronston, stronger runner legs, four supersets (barbell Bulgarian split
  squat, plyo Bulgarian split squat, bench pistol squat, plyo pistol squat, crossover single-arm RDL, plyo lateral step
  overs 60 s, lateral lunge to knee drive, Copenhagen plank hip dips); B3 Jake Pilon, marathon leg day 31 days out
  (single-leg box jump, seated jump, trap bar deadlift, barbell hip thrust, barbell reverse lunge, weighted calf raise,
  bent-knee calf raise); B4 an injury-prevention leg session (Bosu balance and squats, balance on toes, Bulgarian split
  squats, loaded step downs, loaded calf raise, full-range goblet squat, KB single-leg RDL, Copenhagen iso holds, box
  jumps, single-leg box jumps, vertical jump to deep squat, pogo hops, hip flexor band work, monster walks); B5 Jake
  Pilon, runner accessories (KB cross-body Bulgarian split squat, Bosu pistol squat to RDL, KB hip flexor raise,
  Copenhagen plank 2×45 s); B6 Jake Pilon, landmine core circuit (overhead sit-up, side-to-side leg raise, Russian
  twist heels down, kneeling rotation); B7 a Threads "hybrid endurance workout" (a lap between each of eight stations).
- **What B6 tells P-BENCH:** batch 1's core circuit (S9) is this landmine circuit written out without the bar. The
  landmine Russian twist is the bench's `Landmine rotations` (barbell tiers); Mario's #26 bodyweight twist covers every
  other tier, so the two together give the twist everywhere, and #26 stands as he ruled it.

### P-BENCH-5, admit eight movements and one session

| # | Name | Source | Pool | Reaches | Tiers | Dose | Why, and the injury rule |
|---|---|---|---|---|---|---|---|
| 27 | Hollow hold dumbbell press | B1 hollow press | `anti_extension.loaded` | non-runners today (F3), and only once F1 is fixed | all but bodyweight | 3×30 sec | A hollow hold with a press riding on it, the loaded anti-extension rung. Timed (`hold`). Rides slice 2 with F1. |
| 28 | Bulgarian split squat jumps | B2 plyo Bulgarian split squat | power pool, all three lists | athletic support, CrossFit | all (a chair on bodyweight) | the power slot's | The rear-foot-elevated rung above split-squat jumps; the existing `split-squat jump` row prices it 1.5, so intermediate and up. Knee plans drop it with the jumps. |
| 29 | Copenhagen plank (long lever) | B2 hip dips, B4 iso holds, B5 2×45 s | `hip_stability` | every program, leg day | all | 2×20 sec each | The rung above D239's bent knee. Advanced only (`EX_MIN_EXP`, wired into the hip block's draw). The hip plans' `copenhagen` drops already cover it. |
| 30 | Single-leg box jumps | B3, B4 | barbell power list | athletic support, CrossFit | home full, commercial, CrossFit (a box) | the power slot's | Single-leg takeoff. The existing `box jump` row prices it 2.0, so advanced and 18 to 35 only. |
| 31 | Seated box jumps | B3 seated jump | barbell power list | athletic support, CrossFit | home full, commercial, CrossFit | the power slot's | Takeoff with no countermovement, landing on the box. Needs its own cost row at 1.0 above the `box jump` row: it has no landing from height. |
| 32 | Barbell reverse lunge | B3 | `EXLIB.lunge` | every focus but prevention | home full, commercial, CrossFit | the slot's | The heavy loaded reverse lunge; a step back is the bail. Knee plan drops it with the lunges. |
| 33 | Step-downs (KB) | B4 loaded step downs | `EXLIB.lunge`, no-barbell loaded lunge list | every focus but prevention | all but bodyweight | the slot's, each side | The eccentric single-leg quad drill, the runner's knee control. Needs a `_pattern` lunge row (`step-down`), so the knee plan drops it. |
| 34 | Kettlebell hip flexor raise | B5 | `hip_stability` | every program, leg day | all but bodyweight | 2×10 each | Loaded hip flexion past 90°, the rung above seated banded hip flexion. **Resolution:** a standing knee drive with a light KB hooked on the foot. |
| W | Lap and station circuit | B7 | `RAND_POOLS`, fat loss and athletic | the wildcard | all (a track or a 400 m loop) | as posted: a lap between 20 squat jumps, 20 pushups, 20 mountain climbers each leg, 20 lunges, 10 burpees, 20 sit-ups, 10 spiderman pushups, 20 moving side lunges | A whole session, which only the wildcard can carry; it prescribes nothing in a program. |

### P-BENCH-6, already on the bench or a variant of a kept name

S8 again (all six, P-BENCH #10, #14, #16, #17, swing, soleus); ball slams; woodchoppers = `Cable woodchoppers`; side to
sides = `Medicine ball rotary toss`; bench pistol squat = `Assisted pistol squat`; crossover single-arm RDL =
`Kettlebell single-leg deadlift` (the contralateral bell is how it is done); plyo lateral step overs = `Lateral bounds`;
lateral lunge to knee drive = #17; Copenhagen hip dips and iso holds = the Copenhagen family (#29, D239); trap bar
deadlift; barbell hip thrust; weighted and loaded calf raise = `Dumbbell standing calf raise`; bent-knee calf raise;
Bulgarian split squats; full-range goblet squat; KB single-leg RDL; box jumps; pogo hops; hip flexor band work =
`Seated banded hip flexion`; monster walks; balance on toes = D239's heel-raise hold and balance hold; KB cross-body
Bulgarian split squat = `Dumbbell Bulgarian split squat` (the load side is a cue); overhead sit-up = #23; side-to-side
leg raise = `Windshield wipers`; Russian twist = #26; kneeling rotation = `Landmine rotations`.

### P-BENCH-7, rejected or held

- **Barbell Bulgarian split squat:** a back-racked bar with the rear foot on a bench has no bail (V192's Zercher
  reasoning); the dumbbell version stays the loaded one.
- **Plyo pistol squat:** a single-leg jump out of a pistol loads the knee at full depth on landing; the bench's
  single-leg landings (bounds, #28, #30) train the running quality without it.
- **Vertical jump to deep squat:** the deep landing is a cue on `Jump squats`, and a deep-flexion landing is the wrong
  default for a runner's knee.
- **Bosu pistol squat to RDL, Bosu balance and squats:** held for the small-gear step (and the pistol stays out on
  merit, as in P-BENCH-3).

### Recommendation and counter

- **Recommendation:** fold P-BENCH-5 into slice 2 (it is the same kind of work: strength, power, core and two hip
  drills), so slice 2 carries #14 to #34 and the wildcard, with F1 and F2.
- **Counter:** slice 2 grows from 13 names to 21 and the wildcard; if Mario wants a smaller release, the power trio
  (#28, #30, #31) and the wildcard can ride a slice 3.

## Parked: the movements rejected or held, kept to revisit (Mario, 2026-10-19)

Mario concurred with every rejection and fold in P-BENCH-2, -3, -6 and -7 on 2026-10-19 ("i concur with your
rulings"), and asked that the rejected ones be kept because they will come up again. Nothing here is built. Each line
is the movement as the source named it, where it came from, and why it is out today; reopening one is a new ruling.
Standing rule from the same exchange: every reject or fold is listed to Mario with its reason before a ruling is final.

| # | Movement | Source | Status | Why it is out today | What would bring it back |
|---|---|---|---|---|---|
| 1 | Russian flys | S4 | rejected | resolves to no movement (V178 D5) | the clip showing a real drill |
| 2 | Pistol squat on a Bosu | S5 | rejected | a loaded single-leg squat on an unstable base; `Assisted pistol squat` and the balance hold cover the halves | not the small-gear step: out on merit |
| 3 | Forward to reverse taps (slant board) | S5 | rejected | needs a slant board; the caption does not resolve to a drill | the clip, and the small-gear step |
| 4 | Lacrosse ball squeezes | S5 | rejected | a cue on a calf raise (heels together), not a movement | a cue field on a movement |
| 5 | Roll out fascia | S5 | rejected | self-massage, not training | a recovery-day slot beyond the foam roll |
| 6 | Overhead load + band + med ball dead bug (Lu Xiaojun) | S6 | rejected | three implements at once; `Weighted dead bugs` is the rung | the small-gear step, as an advanced rung |
| 7 | Adductor magnus slide-out | S7 | rejected | needs sliders; the Copenhagen and the Cossack cover the adductors | the small-gear step (sliders) |
| 8 | Hamstring curl on a rower seat | S3 | rejected | only rower tiers could do it, and they own better curls | the small-gear step (sliders), as a slider curl |
| 9 | Overcoming isometrics | S7 | rejected | a method, not a movement | a named position (an isometric mid-thigh pull, a pin squat push) |
| 10 | Single-leg band + KB drill with a sandball | S7 | rejected | needs an anchor and a sandbag | the HYROX odd-object modifier |
| 11 | Offset walk (PVC pipe) | S2 | rejected | needs a pipe; `Suitcase carry` is the one-sided carry | the small-gear step (PVC) |
| 12 | Barbell Bulgarian split squat | B2 | rejected | back-racked bar, rear foot on a bench: no bail | a safety-bar or front-rack form |
| 13 | Plyo pistol squat | B2 | rejected | lands on one leg at full knee depth | an advanced-only power rung, by ruling |
| 14 | Vertical jump to deep squat | B4 | rejected | the deep landing is a cue on `Jump squats`, a poor default for a runner's knee | a landing-skill block |
| 15 | Bosu balance and squats, Bosu pistol squat to RDL, the Bosu balance holds | S5, B4, B5 | held | Bosu not modeled | the small-gear step (the pistol stays out on merit) |
| 16 | Stir the pot | S2 | held | stability ball not modeled | the small-gear step |

The folds (a movement read as one already on the bench) are listed in P-BENCH-2 and P-BENCH-6; each can be split back
out by a ruling.
