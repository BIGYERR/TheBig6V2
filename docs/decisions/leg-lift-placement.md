# Leg lift placement: decisions

Where the hinge (pull) and squat (legs) days land against the runs. `deconflictLegLiftDays` in
`core/src/engine/core-legs.ts` hands race, pace and base programs to `nrcLegLiftPlacement`, which places both roles by
`_nrcLegCost`: the long run and its eve are forbidden, and the pull day is priced at 0.5 on a speed day so hard days stay
hard (V189 D36; its record is in the handoff). Every other program keeps the 48h tiers below it. Tests:
`tests/integration/leg-lift-placement.test.ts`.

## Parked: heavy lower mains spaced 48h off every leg-load run (proposed 2026-10-24, held by Mario, no D-code)

- **The proposal (Mario's brief):** a set of heavy lower mains (deadlift, Romanian deadlift, trap bar deadlift, pin
  squat, front squat, back squat, hip thrust); a day whose main is in it stays 48 hours off any leg-load cardio session
  whatever its role, and where it cannot, the main swaps to an upper or lighter variant rather than the run moving.
- **What the measure found (on v0.242.0 and a source-surgery copy of the two NRC run changes, D243 and D244):** the RDL
  on tempo day was the ruled D36 pairing, not a role the deconflict missed: `deconflictLegLiftDays` already moves both
  pull and legs. Under 48 hours either side, 64 of 64 advanced and 19 of 64 intermediate rest-day calendars (four to
  seven training days, run_half, Strength Support) have no legal day at all, and both heavy mains fit on 12 of 64
  intermediate ones, so the lighter swap would fire most weeks and every advanced week. A narrower rule (not on a
  leg-load day, not the day before one) fits both on 38 of 64 intermediate calendars.
- **Mario's ruling (2026-10-24):** "Hold change 3. Keep D36 as ruled. Change 1 removes the stacking that caused the
  problem. Do not add a spacing rule or a lighter-main swap. If I revisit this later it will be a set cap on hard-run
  days, not a move."
- **What would bring it back:** a report of heavy lower work stacking on a hard run day after D243 ships. The form
  Mario named is a set cap on hard-run days, not a relocation or a swap.
