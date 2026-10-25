# Race dates: decisions

A race date sets a race program's start: `raceAlignment` counts back from the race (Monday of race week minus the plan's
weeks less one), the wizard's name step prints that start in place of the date field (`wizardAlignment`), and
`_applyWizardStart` builds the program from it. The earlier rulings on race dates (D14a, D180, D182) are recorded in the
handoff and `tests/measure/v221_rulings/`, `tests/measure/v223_rulings/`. Code: `frontends/app/src/legacy/src/js/wizard.ts`
and the Angular `frontends/app/src/app/screens/wizard/wizard.ts`. Tests: `tests/integration/race-date.test.ts`.

## D242: the name step's summary row reads the start the field above it shows (v0.242.1)

- **Date:** reported and ruled 2026-10-24. **Ruled by:** Mario ("make them read the same source"). **Bump:** PATCH
  (Mario). **Shipped:** v0.242.1.
- **The report (Mario):** on wizard step 7 the summary row said "Start date Sat, Oct 24, 2026, short first week" while
  the start date field above it showed Mon, Oct 26.
- **The finding (measure, on v0.242.0, the clock Saturday 2026-10-24):** a half marathon with a race date aligns, so
  the field prints `raceAlignment`'s start, Monday 2026-10-26, and `_applyWizardStart` builds the program from that same
  date. The summary row read `resolveStartDate(WD.startDate)` instead: the wizard's default start, today, a Saturday,
  so a short first week. `startSummaryVal` has an aligned arm, but no caller ever handed it an aligned start, so it never
  printed. The same call sat in the legacy name step and in the Angular wizard's.
- **What changes:** the summary row's start comes from one helper, `wizardStartSummary`: with an alignment it is the
  aligned start (the existing aligned arm, "set by race date"), otherwise the resolver's start, as before. The legacy
  name step and the Angular wizard both call it.
- **What deliberately does not change:** the field, the sentence under it, the generate path and the program built.
  Without a race date the row reads exactly as before. The row's copy is not touched.
- **Expected values (typed by hand, the clock Saturday 2026-10-24, rest days Sunday and Wednesday):** a half marathon
  racing Sunday 2027-01-31 (14 weeks; race week's Monday 2027-01-25, less 13 weeks, is Monday 2026-10-26): the field
  prints `Mon, Oct 26, 2026` and the summary row `Mon, Oct 26, 2026 — set by race date` (before: `Sat, Oct 24, 2026 —
  short first week`). With no race date and the start left on today, the row stays `Sat, Oct 24, 2026 — short first
  week`.
- **Flagged, not ruled (copy, Mario's call):** both arms of the row join with an em-dash, which the copy rule keeps out
  of what the athlete reads. Recommendation: a comma, `Mon, Oct 26, 2026, set by race date`.
