# Wildcard: decisions

The Wildcard sheet (the Random Workout): the legacy page's `renderRand` (`frontends/app/src/legacy/src/js/random-wildcard.ts`)
and the native app's `randView` (`frontends/app/src/app/screens/random-workout/random-workout-model.ts`). Rulings on
editing a Wildcard's sections live in `docs/decisions/session-edits.md` (D250). Tests: `tests/integration/wildcard.test.ts`
and `frontends/app/test/unit/random-workout.test.ts`.

## D262 P-WILDTINT: the Wildcard badge draws the tint it was written with

- **Date:** 2026-10-28. **Ruled by:** Mario ("can you fix it now and lets roll it into this dev push"), on the defect
  the D261 build found and recommended fixing.
- **Finding:** the badge over a Wildcard's title ("Wildcard", or "Done Before ✓") is meant to sit on a faint tint of its
  program goal's colour: its style is `background:${color}22`, a hex colour with a `22` alpha (34/255). But since the
  colours became tokens the goal's colour is a `var(--…)` string, so the background reads `var(--lift)22`, which is not a
  colour: the declaration is dropped and the badge has had no fill, in the single-file page and, since its port, in the
  native app (whose test pinned `background:var(--lift)22` as the expected value). Its text colour always drew.
- **Changes:** the background is the goal colour's tint, `rgba(var(--<colour>-rgb), 0.133)` (34/255, the alpha the code
  was written with), so it follows the night palette like every other tint (D261). The goals keep their colours:
  strength and support strength the lift colour; hypertrophy and support prevention the mobility colour (`--hip`);
  fat loss and endurance the run colour; athletic and support athletic the bike colour; balanced the accent. The accent
  gains its tint token, `--accent-rgb` (day `24,23,18`, night `228,223,210`, the channels of `--accent` in each
  palette).
- **Does not change:** the badge's text colour, its words, its shape; which goal takes which colour; the sheet's other
  parts. A goal outside the nine still gets no colour (its style is now empty rather than two invalid declarations).
  No program output.
- **Expected values:** a strength program's badge reads `background:rgba(var(--lift-rgb),0.133);color:var(--lift)`; a
  balanced one `background:rgba(var(--accent-rgb),0.133);color:var(--accent)`; an endurance one
  `background:rgba(var(--run-rgb),0.133);color:var(--run)`; the same strings in both builds.
- **Released:** pending.
