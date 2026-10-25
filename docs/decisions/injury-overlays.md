# Injury overlays: decisions

The HURT? sheet's regions (`INJURY_REGIONS`) and what each plan does to a program (`injuryPlan`, `applyInjuryFilter`
and `injuryDayTitle` in `core/src/engine/injury.ts`; the pool overrides in `core/src/engine/engine-c.ts`; the run sweep
`injurySweepCardio` in `core/src/engine/engine-a-b-calendar.ts`). The sheet's effect copy is `_INJ_EFFECT` in
`frontends/app/src/legacy/src/js/overlays.ts` and `INJ_EFFECT` in the Angular
`frontends/app/src/app/screens/change-sheet/change-sheet-model.ts`. The earlier rulings (D43, D44, D52, D54, D154,
D193, D194, D197) are recorded in the handoff and `docs/test-migration/13-injury-overlays.md`. Tests:
`tests/integration/injury-overlays.test.ts`, `tests/sweeps/injury-overlays.test.ts` and the app's
`frontends/app/test/unit/change-sheet.test.ts`.

## D245: a calf region on the HURT? sheet (v0.245.0)

- **Date:** ruled 2026-10-24. **Ruled by:** Mario (the brief); the name-level drops and the effect copy are the main
  session's, and Mario concurred with the copy on 2026-10-25 ("concur"). **Bump:** MINOR (Mario). **Shipped:** v0.245.0.
- **The report (Mario):** the athlete on the reported half has fried calves, and the sheet offers no calf.
- **What changes:**
  1. `calf` joins `INJURY_REGIONS` after the ankle, labelled `Calf` (the check-in line reads "how the calf feels").
  2. **Working around it:** jumps out (`noJumps`), every loaded calf raise out (the `calf_iso` pattern), and by name the
     three calf-loading drills the pattern classifier exempts as prehab (the soleus raise, the split-squat heel-raise
     hold, tiptoe walks), so the foot & ankle block draws without them and keeps its count. Every run goes easy and
     shorter (`cardioMode: 'reduce'`, the ankle workaround's sweep), which also takes the strides. The tibialis raises,
     banded dorsiflexion, knee-to-wall ankle rocks and the rest of the foot & ankle block stay. No squat or lunge cap:
     the brief asked for none, and a calf, unlike an ankle, is not loaded by the squat's range.
  3. **Protected:** the ankle protect plan line for line (drops, caps, names, `noimpact`), and one helper,
     `_ankleLike`, carries it to the ankle plan's other readers: the leg-day pool override, the foot & ankle block
     standing aside, and the `Posterior Chain` title.
  4. The sheet's effect copy, both frontends: working around it, "Calf raises and jumps are out. Tibialis raises and
     ankle mobility stay. Runs get shorter and stay easy."; protected, "Nothing stands on that calf under load. Leg day
     leans hip and hamstring. Runs become rides or swims, same slots, same clock." (the ankle's sentence, its noun
     swapped).
- **What deliberately does not change:** no session text, pace or table; the ankle, knee and every other region; a
  program with no calf injury (HALF_MANNY and both lattices are byte-identical).
- **Expected values (typed by hand from the ruling, on the reported half: intermediate, Home Full, Strength Support,
  rest Sunday and Wednesday, seed 1013):** working around a calf, no item anywhere in the block reads `calf_iso` or names
  a soleus raise, heel-raise hold or tiptoe walk, and none names a jump; every run is `Easy Run (protected)` with no leg
  load, and week 9 is Monday, Tuesday, Friday and Saturday protected easy runs, Thursday lift only; the foot & ankle
  block still prints a tibialis raise and a dorsiflexion or ankle-rock drill. A protected calf builds the protected
  ankle program week for week.
- **Proof:** the three D245 tests in `tests/integration/injury-overlays.test.ts` fail on v0.244.0 (no calf region
  there: the plan is null and the program is healthy) and pass; the app's change-sheet test holds the copy and the
  sheet's titles. The pool-chain oracle in `tests/support/injury-overlays.ts` reads `_ankleLike(_inj)` as the ankle's
  arm, since a protected calf runs the ankle's filter.
- **Flagged, then ruled as D247 (below):** the jump filter (`JUMPS` in `applyInjuryFilter`: jump, burpee, broad, bound, box jump, high
  knees, tuck) does not match `Pogo hops`, which the athletic power pool holds, so every no-jumps plan (knee, ankle,
  calf) could print it. None did on 96 sampled builds (three regions, both tiers, four tiers of gear, four seeds,
  Athletic Support). Recommendation: add `pogo` to `JUMPS`, a PATCH.

## D247: the jump filter catches pogo hops (v0.245.1)

- **Date:** found by D245 on 2026-10-24, ruled 2026-10-25. **Ruled by:** Mario ("yes" to the recommendation). **Bump:**
  PATCH (Mario). **Shipped:** v0.245.1.
- **The finding:** `JUMPS` in `applyInjuryFilter` (jump, burpee, broad, bound, box jump, high knees, tuck) does not match
  `Pogo hops`, which the athletic power pool holds, so a plan that sets `noJumps` (knee, ankle and calf, both tiers)
  would let it through.
- **What changes:** `pogo` joins `JUMPS`.
- **What it moves (source-surgery copy of v0.245.0, before the build):** nothing. 0 of 1,728 programs (the 864-cell
  injury lattice, and 864 knee, ankle and calf builds over the half, the pace goal and the base, both tiers, four foci,
  six tiers of gear and two seeds); none of them printed a pogo hop under a no-jumps plan before the fix. The fix is
  the filter's own claim made true: "kills jump/plyo conditioning".
- **Expected values (typed by hand):** a section holding `Pogo hops` and `Dumbbell row`, filtered under a calf,
  ankle or knee plan on either tier, keeps `Dumbbell row` alone; uninjured it keeps both.
