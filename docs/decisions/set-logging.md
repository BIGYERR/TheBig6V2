# Set logging: decisions

What an exercise card logs and how it labels it: the set rows, the load field, the reuse pill and its stale warning,
drawn by `buildExItem` (`frontends/app/src/legacy/src/js/set-logging.ts`) on the single-file page and by
`exItemView` (`frontends/app/src/app/screens/day-detail/session-sections-model.ts`) in the iOS app; the pill's text
after a log is rewritten in place by `day-detail.ts`. What a line logs is `parseRx` (`docs/decisions/supersets.md`,
D253). Tests: `tests/integration/session-sheet.test.ts`, `frontends/app/test/unit/session-sections.test.ts`.

## D257: P-KBUNIT, a kettlebell weighs in the program's unit (v0.249.0)

- **Date:** reported and ruled 2026-10-26. **Ruled by:** the main session (a copy defect), Mario not objecting when it
  was put in the batch. **Bump:** MINOR, v0.249.0 (Mario, the batch). **Shipped:** v0.249.0.
- **The report (Mario's screenshots, two of them):** the Spanish squat hold (KB) and Kettlebell single-arm row cards
  read "LOAD … LB" and "25 lb earlier today" while every other loaded card reads "LBS".
- **The finding:** every kettlebell card on a pounds program prints "lb": the load field, each set's unit, the reuse
  pill, the fill pill and the stale warning (`buildExItem`, `exItemView`), and the pill rewritten after a log
  (`day-detail.ts`). A kilogram program prints "kg" either way.
- **What changes:** a kettlebell card prints the program's unit, as every other loaded card does: "lbs" or "kg".
- **What deliberately does not change:** the stored loads (always pounds), the kilogram display, the load steps, and
  `buildKBChips` (bell-size chips), which nothing calls.
- **Expected values:** Kettlebell single-arm row on a pounds program: `<span class="ex-wunit">lbs</span>` and no
  "lb" label; on a kilogram program, "kg"; the iOS app draws the same card; `exItemView` in pounds gives each set and
  the load field "lbs".
- **Tests:** `tests/integration/session-sheet.test.ts` (both builders, both units) and
  `frontends/app/test/unit/session-sections.test.ts`.
