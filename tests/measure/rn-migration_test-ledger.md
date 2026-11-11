# React Native migration: the test ledger

Written by `tests/measure/rn-migration_inventory.mjs`. One row per test file as of the commit it was run on. "Tests" and "Assertions" are static counts (a loop counts once). "Plan" is a first pass made by rule from what the file drives; the phase that touches a file confirms or corrects its row, then fills "Replacement" and "After" (the replacement's own counts). No row's file is deleted until its replacement passes and has been shown red on a deliberate break (MIGRATION.md, section 3).

| File | Tests | Assertions | Drives | Plan | Replacement | After (tests / assertions) |
|---|---|---|---|---|---|---|
| `tests/unit/app-look.test.ts` | 16 | 32 | source read | KEEP: drives no page | | |
| `tests/unit/claims.test.ts` | 4 | 23 | own code | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/clock-format.test.ts` | 6 | 7 | lifted fn | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/unit/data-backup.test.ts` | 9 | 21 | Angular source, lifted fn, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/unit/design-tokens.test.ts` | 4 | 10 | source read | RETIRE at cutover: the web view or stylesheet it tests is gone; behaviour that survives gets a screen test | | |
| `tests/unit/e2e-collage.test.ts` | 33 | 92 | own code | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/e2e-flow.test.ts` | 10 | 29 | source read | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/e2e-parity.test.ts` | 6 | 12 | own code | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/e2e-report.test.ts` | 13 | 32 | source read | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/exercise-bench.test.ts` | 5 | 11 | lifted fn | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/unit/fit-file.test.ts` | 4 | 4 | @ia/core | KEEP: already runs on core alone | | |
| `tests/unit/gps-recording.test.ts` | 13 | 32 | @ia/core | KEEP: already runs on core alone | | |
| `tests/unit/landing.test.ts` | 6 | 25 | own code | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/night-mode.test.ts` | 6 | 9 | source read | KEEP: drives no page | | |
| `tests/unit/pace-delta.test.ts` | 8 | 20 | lifted fn, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/unit/page-comments.test.ts` | 10 | 13 | source read | RETIRE at cutover: the web view or stylesheet it tests is gone; behaviour that survives gets a screen test | | |
| `tests/unit/semver.test.ts` | 20 | 79 | @ia/core, source read | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/stored-state.test.ts` | 37 | 144 | page, script text, @ia/core | RE-POINT at `@ia/core`: the golden records of stored state; the same histories driven through core once the logic has moved (confirmed by hand, phase 1) | | |
| `tests/unit/swipe-deck.test.ts` | 31 | 130 | Angular source, source read | RETIRE at cutover: the web view or stylesheet it tests is gone; behaviour that survives gets a screen test | | |
| `tests/unit/tab-bar.test.ts` | 31 | 74 | lifted fn, script text, source read | RETIRE at cutover: the web view or stylesheet it tests is gone; behaviour that survives gets a screen test | | |
| `tests/unit/this-week-hero.test.ts` | 14 | 77 | Angular source | KEEP: drives no page | | |
| `tests/unit/tree-at.test.ts` | 4 | 18 | Angular source, source read | KEEP: repo tooling, while the tool exists | | |
| `tests/unit/version-label.test.ts` | 4 | 11 | lifted fn, @ia/core | KEEP: already runs on core alone | | |
| `tests/unit/worktree-deps.test.ts` | 5 | 25 | source read | KEEP: repo tooling, while the tool exists | | |
| `tests/integration/active-program.test.ts` | 28 | 88 | page, script text | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/adjacent-day-dedupe.test.ts` | 11 | 30 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/app-look.test.ts` | 4 | 5 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/boot.test.ts` | 6 | 14 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/cardio-sessions.test.ts` | 38 | 145 | page, script text, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/clock-format.test.ts` | 15 | 44 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/compound-tier.test.ts` | 10 | 35 | page, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/core-trunk.test.ts` | 23 | 53 | page, script text, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/data-backup.test.ts` | 7 | 33 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/deload.test.ts` | 17 | 42 | page, script text, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/duplicate-movements.test.ts` | 13 | 43 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/e2e-browser.test.ts` | 6 | 18 | lifted fn | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/easy-run-ceiling.test.ts` | 6 | 35 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/engine-modules.test.ts` | 3 | 10 | engine modules, source read | KEEP: already runs on core alone | | |
| `tests/integration/equipment-tiers.test.ts` | 38 | 126 | page, @ia/core, source read | KEEP: already runs on core alone | | |
| `tests/integration/exercise-bench.test.ts` | 18 | 63 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/injury-overlays.test.ts` | 35 | 119 | page, script text | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/injury-plan-lens.test.ts` | 12 | 54 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/ledger.test.ts` | 26 | 63 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/leg-accessory.test.ts` | 14 | 58 | page+DOM, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/leg-day-volume.test.ts` | 10 | 39 | page, script text, @ia/core | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/leg-lift-placement.test.ts` | 12 | 44 | page, script text | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/log-copy.test.ts` | 8 | 13 | page, Angular source, lifted fn, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/logging.test.ts` | 66 | 412 | page, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/long-run-day.test.ts` | 12 | 37 | page, script text, @ia/core | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/mile-anchor.test.ts` | 22 | 82 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/mile-pencil.test.ts` | 12 | 62 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/night-mode.test.ts` | 5 | 20 | page, Angular source, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/pace-clock.test.ts` | 15 | 58 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/pace-wizard.test.ts` | 33 | 117 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/pop-ups.test.ts` | 34 | 76 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/power-block.test.ts` | 8 | 16 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/program-detail.test.ts` | 2 | 3 | page, Angular source | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/program-output.test.ts` | 5 | 5 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/program-shape.test.ts` | 10 | 30 | page, @ia/core | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/progress-charts.test.ts` | 3 | 8 | Angular source, lifted fn | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/progress.test.ts` | 16 | 38 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/race-date.test.ts` | 14 | 74 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/rest-sheet.test.ts` | 15 | 60 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/rest-timer.test.ts` | 21 | 167 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/run-names.test.ts` | 5 | 10 | page, engine modules | KEEP: already runs on core alone | | |
| `tests/integration/run-session-class.test.ts` | 18 | 52 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/run-week-layout.test.ts` | 55 | 161 | page, script text, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/runner-armor-circuit.test.ts` | 15 | 55 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/session-budget.test.ts` | 20 | 71 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/session-edits.test.ts` | 8 | 49 | page+DOM, Angular source | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/session-sheet.test.ts` | 10 | 22 | page, Angular source, lifted fn | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/sheet-close.test.ts` | 2 | 7 | source read | KEEP: drives no page | | |
| `tests/integration/skip-pill.test.ts` | 9 | 19 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/sport-swap.test.ts` | 18 | 76 | page, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/stored-state.test.ts` | 14 | 41 | page | RE-POINT at `@ia/core`: the golden records of stored state; the same histories driven through core once the logic has moved (confirmed by hand, phase 1) | | |
| `tests/integration/supersets.test.ts` | 24 | 56 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/swap-durability.test.ts` | 9 | 30 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/swaps.test.ts` | 39 | 145 | page, script text | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/swim.test.ts` | 35 | 115 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/swipe-deck.test.ts` | 8 | 32 | page, Angular source | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/test-length.test.ts` | 26 | 103 | page, script text | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/test-week.test.ts` | 29 | 104 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/this-week-hero.test.ts` | 12 | 26 | page, Angular source | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/version-label.test.ts` | 4 | 15 | page+DOM, source read | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/week-freeze.test.ts` | 9 | 17 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/integration/week-view.test.ts` | 22 | 33 | page+DOM, script text | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/wildcard.test.ts` | 50 | 146 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/integration/wizard-builders.test.ts` | 4 | 6 | page, Angular source | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/adjacent-day-dedupe.test.ts` | 10 | 30 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/cardio-sessions.test.ts` | 5 | 18 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/core-trunk.test.ts` | 1 | 7 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/data-backup.test.ts` | 3 | 15 | page, @ia/core, source read | RE-POINT at `@ia/core`: the golden records of stored state; the same histories driven through core once the logic has moved (confirmed by hand, phase 1) | | |
| `tests/sweeps/deload.test.ts` | 11 | 48 | page, script text, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/duplicate-movements.test.ts` | 15 | 44 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/engine-modules.test.ts` | 1 | 2 | engine modules, source read | KEEP: already runs on core alone | | |
| `tests/sweeps/equipment-tiers.test.ts` | 34 | 109 | page, @ia/core, source read | KEEP: already runs on core alone | | |
| `tests/sweeps/injury-overlays.test.ts` | 10 | 62 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/leg-accessory-trim-order.test.ts` | 8 | 21 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/leg-accessory.test.ts` | 8 | 16 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/leg-lift-placement.test.ts` | 5 | 24 | page, script text | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/logging.test.ts` | 4 | 19 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/long-run-day.test.ts` | 5 | 18 | page, script text, @ia/core | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/mile-anchor.test.ts` | 0 | 0 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/pace-clock.test.ts` | 0 | 0 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/program-output.test.ts` | 1 | 4 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/program-shape.test.ts` | 2 | 9 | page, @ia/core | KEEP: already runs on core alone | | |
| `tests/sweeps/race-date.test.ts` | 2 | 12 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/run-session-class.test.ts` | 4 | 38 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/run-week-layout.test.ts` | 12 | 39 | page, script text | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/runner-armor-circuit.test.ts` | 9 | 27 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/session-budget.test.ts` | 16 | 45 | page, source read | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/stored-state.test.ts` | 3 | 9 | page | RE-POINT at `@ia/core`: the golden records of stored state; the same histories driven through core once the logic has moved (confirmed by hand, phase 1) | | |
| `tests/sweeps/swaps.test.ts` | 18 | 47 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/swim.test.ts` | 9 | 28 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/swipe-deck.test.ts` | 3 | 6 | page, Angular source | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/test-length.test.ts` | 4 | 10 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/test-week.test.ts` | 5 | 16 | page | RE-POINT at `@ia/core`: same assertions, no page booted | | |
| `tests/sweeps/week-view.test.ts` | 5 | 7 | page | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `tests/sweeps/wildcard.test.ts` | 1 | 3 | page+DOM | REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core | | |
| `frontends/app/test/unit/add-sheet.test.ts` | 3 | 8 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/bug-report.test.ts` | 5 | 22 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/cardio-card.test.ts` | 3 | 7 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/cardio-fields.test.ts` | 5 | 24 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/cardio-goal.test.ts` | 10 | 44 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/cardio-sheet.test.ts` | 11 | 29 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/change-sheet.test.ts` | 8 | 29 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/day-detail.test.ts` | 9 | 22 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/deck.test.ts` | 10 | 26 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/dot-chart.test.ts` | 4 | 13 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/goal-sheet.test.ts` | 6 | 13 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/ledger.test.ts` | 7 | 24 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/legacy-bundle.test.ts` | 5 | 8 | own code | RETIRE at cutover: Cordova and legacy tooling, replaced by the Expo build checks | | |
| `frontends/app/test/unit/mile-nudge.test.ts` | 16 | 34 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/mile-sheet.test.ts` | 5 | 9 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/native-build.test.ts` | 4 | 10 | source read | RETIRE at cutover: Cordova and legacy tooling, replaced by the Expo build checks | | |
| `frontends/app/test/unit/native-version.test.ts` | 3 | 4 | source read | RETIRE at cutover: Cordova and legacy tooling, replaced by the Expo build checks | | |
| `frontends/app/test/unit/pop-up.test.ts` | 4 | 14 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/program-chips.test.ts` | 4 | 11 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/program-detail.test.ts` | 3 | 13 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/program-list.test.ts` | 5 | 12 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/progress.test.ts` | 8 | 27 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/random-workout.test.ts` | 5 | 15 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/release-signing.test.ts` | 14 | 25 | own code | RETIRE at cutover: Cordova and legacy tooling, replaced by the Expo build checks | | |
| `frontends/app/test/unit/rest-timer.test.ts` | 8 | 29 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/run-charts.test.ts` | 9 | 30 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/run-recorder.test.ts` | 10 | 29 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/runlog.test.ts` | 15 | 42 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/session-log.test.ts` | 5 | 17 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/session-sections.test.ts` | 9 | 34 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/sheet-marks.test.ts` | 3 | 12 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/skip-pill.test.ts` | 14 | 62 | source read | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/swap-nudge.test.ts` | 2 | 3 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/swap-sheet.test.ts` | 6 | 15 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/swipe-back.test.ts` | 6 | 20 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/sync-legacy.test.ts` | 13 | 36 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/testflight.test.ts` | 21 | 32 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/version.test.ts` | 15 | 35 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/week-strip.test.ts` | 12 | 70 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/unit/week-view.test.ts` | 11 | 42 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/unit/wizard.test.ts` | 7 | 29 | own code | KEEP: a pure model the new screen reuses | | |
| `frontends/app/test/integration/app-shell.test.ts` | 2 | 3 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/integration/build-index.test.ts` | 17 | 44 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/integration/legacy-bundle.test.ts` | 5 | 16 | source read | RETIRE at cutover: Cordova and legacy tooling, replaced by the Expo build checks | | |
| `frontends/app/test/integration/module-blocks.test.ts` | 3 | 8 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/integration/pwa-local-log.test.ts` | 2 | 3 | own code | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/integration/pwa-local.test.ts` | 14 | 32 | own code | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/integration/run-wrapper.test.ts` | 8 | 30 | source read | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `frontends/app/test/integration/sync-legacy.test.ts` | 7 | 13 | own code | REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten | | |
| `backend/test/auth.test.ts` | 9 | 28 | own code | KEEP: the server, not the app | | |
| `backend/test/client.test.ts` | 4 | 14 | source read | KEEP: the server, not the app | | |
| `backend/test/deploy.test.ts` | 6 | 27 | source read | KEEP: the server, not the app | | |
| `backend/test/dev-container.test.ts` | 6 | 24 | source read | KEEP: the server, not the app | | |
| `backend/test/dev.test.ts` | 7 | 34 | source read | KEEP: the server, not the app | | |
| `backend/test/mac-local.test.ts` | 6 | 19 | source read | KEEP: the server, not the app | | |
| `backend/test/request-log.test.ts` | 4 | 9 | own code | KEEP: the server, not the app | | |
| `backend/test/semver-parity.test.ts` | 3 | 7 | own code | KEEP: the server, not the app | | |
| `backend/test/server.test.ts` | 23 | 90 | own code | KEEP: the server, not the app | | |
| `backend/test/site.test.ts` | 9 | 27 | source read | KEEP: the server, not the app | | |
| `backend/test/versions.test.ts` | 9 | 33 | own code | KEEP: the server, not the app | | |

**Total: 179 files, 2078 tests, 6934 assertions.**
