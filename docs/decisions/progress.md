# Progress: decisions

What the Progress screen shows. The lift ledger's tiers (MAIN LIFTS, RANGE LADDER, the rest) are built in
`frontends/app/src/legacy/src/js/lift-ledger-progress-screen.ts` and drawn by the iOS app's
`frontends/app/src/app/screens/progress/charts/` (`ledger-model.ts`, `ledger-cards.ts`). V196's rulings (D11, D57,
D59, in the handoff) are the history before this file: a lift is main by SLOT (item 0 of a `/^main/i` section), main
if ever, and the main line reads only main-slot sessions. Tests: `tests/integration/progress.test.ts`,
`tests/integration/progress-charts.test.ts`. Measure: `tests/measure/main-hinge_rotation.ts` and its `.out.txt`.

## D255: P-DEADLIFTLINE, the main hinge is one Deadlift line, its variants tagged (v0.249.0)

- **Date:** reported and ruled 2026-10-26. **Ruled by:** Mario ("i just want the main lift to display on the progress
  page as deadlift, this isnt mean to move an exercies in workouts in the program its just a display thing"; on the
  tags, "concur"). **Bump:** MINOR, v0.249.0 (Mario, the batch). **Shipped:** v0.249.0.
- **The report (Mario, Progress screenshot, MAIN LIFTS: Dumbbell bench press, Close-grip bench press, Barbell Romanian
  deadlift 95×8):** "why is romanian deadlift a main lift? and not deadlift? thats pretty nuts".
- **The finding (measure, 865 programs, `tests/measure/main-hinge_rotation.ts`):** the Posterior Chain main is drawn
  per two-week block from `EXLIB.back_compound` (Deadlift, Trap bar deadlift, Sumo deadlift, Barbell Romanian
  deadlift). HALF_MANNY: RDL W1–2, Trap bar W3–4, Sumo W5–6, Trap bar W7–8, Deadlift W9–10, RDL W11–12. Of 325
  programs with a barbell main hinge, 163 change variant inside the program, so MAIN LIFTS lists each variant as its
  own main lift. By name, the RDL is a main in 271 of 325.
- **What changes (display only):**
  - On MAIN LIFTS, the main-slot sessions of the four `EXLIB.back_compound` names are one block, titled **Deadlift**.
  - Its line plots each week's main-slot top set, whichever of the four it was. Each run of weeks on a lift other
    than the conventional deadlift is tagged once, over its first point: RDL, Trap bar, Sumo.
  - The headline top set and the "Opened at" set carry the same tag when they were not the conventional deadlift
    ("Opened at 95×8 RDL in week 1").
  - "up N lbs" compares like with like: it shows only when the opening set and the heaviest set are the same lift.
- **What deliberately does not change:** the program (what each day prescribes and which variant it draws), the slot
  rule (D11), the other main lifts (squat and press variants keep their own blocks), the RANGE LADDER and the rest,
  each variant's accessory sessions (kept off the main line, as now), and the stored logs.
- **Expected values (a hand-built history, typed from the ruling):** main-slot sessions RDL W1 95×8, RDL W2 95×8,
  Trap bar W3 155×10, Deadlift W9 185×8 make one block, Deadlift. Headline 185×8 untagged. "Opened at 95×8 RDL in
  week 1 · heaviest in week 9", with no "up". Points W1 95, W2 95, W3 155, W9 185, with "RDL" over W1 and "Trap bar" over W3, once each. With
  only Deadlift W9 185×8 and W10 195×8, the block reads "Opened at 185×8 in week 9 · up 10 lbs · heaviest in week 10".
- **Tests:** in `tests/integration/progress-charts.test.ts`, the two histories above on the single-file page and
  through the iOS app's ledger model.

## D255 Amendment 1: the first tag starts at the line, clear of the axis (v0.249.1)

- **Date:** 2026-10-27. **Ruled by:** the main session (a layout defect), found when Mario asked to see the line ("can
  you show me what that deadlift line on progress looks like?"). **Bump:** PATCH, v0.249.1 (Mario). **Shipped:** v0.249.1.
- **The finding:** a tag over the line's first point was centred on it, at the plot's left edge, where the y-axis
  labels end, so "RDL" ran into "125" in the screenshot sent to Mario.
- **What changes:** the first point's tag starts at the point (anchored at its start, two points left of it); every
  later tag stays centred over its point.
- **Expected values:** on the D255 history the RDL tag is drawn with `text-anchor="start"` and the Trap bar tag with
  `text-anchor="middle"`, on the page and in the iOS app.
- **Tests:** `tests/integration/progress.test.ts`, `frontends/app/test/unit/ledger.test.ts`.

