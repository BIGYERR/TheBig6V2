# Screens into Angular components: decisions

Architecture phase E (`docs/architecture-migration.md` §3): the app's screens move from the legacy script's
string-built HTML into Angular components in `frontends/app/src/app/screens/<screen>/`, one screen a release. Tests:
the screen's logic, apart from Angular, in `frontends/app/test/unit/<screen>.test.ts` (node --test); its rendering and
behaviour in the Docker e2e (`tests/e2e/flow.ts`, against both builds) and its parity (the Angular app's screen against
the single-file page's, pixel for pixel).

These are code-layout decisions, not coaching rulings: none changes what a program prescribes, what a screen shows or
what is stored.

## How a screen moves (v0.239.8)

- **Date:** 2026-10-12. **Decided by:** the session, inside Mario's standing answer for the migration ("PATCH each, in
  order").
- **The Angular app hosts the legacy app whole** (`LegacyHost` mounts its markup and runs its script) and, once it has
  booted, puts each moved screen's component inside that screen's element, in place of its content
  (`src/app/screens/screens.ts`, `MOVED_SCREENS`). The screen element stays, so the legacy navigation (`showScreen`, the
  tab bar) shows and hides it as before, and the component's host takes no box (`display: contents`), so the screen's
  layout sees the same children.
- **The single-file page keeps the legacy screen** until Mario switches the Pages source to the Angular build: Pages
  serves the page, and the native app runs the Angular build. The e2e's parity holds the two the same, screen by
  screen; when Pages serves the Angular build, the legacy screen's code goes.
- **A component reads the legacy app through `LegacyBridge`:** `call(name, ...)` for a legacy function, and
  `global(name)` for a top-level binding (`activeProg`, `currentWeek`, `IA_VERSION`), which a classic script keeps in the
  global scope but not on `globalThis`; an indirect eval of a validated identifier reads it.
- **The markup moves as it is**, element for element and inline style for inline style, so the screen looks as it did;
  restyling it into component CSS and the design system's tokens is a later step under its own parity proof.
- **The logic moves apart from Angular** (`<screen>-model.ts`, no Angular import), so node --test tests it as it is;
  `src/app/package.json` marks the app's TypeScript as ES modules for Node and tsc.
- **Each step is a PATCH:** the native app's version label comes from `ia-version`, so a release that changes only the
  Angular app still moves it.

## Release scope: v0.239.8 moves the bug report

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.8.
- **Moved:** `#screenBugs`, the bug report: `src/app/screens/bug-report/bug-report.ts` (the component, signals for the
  text, the sending state and the status line) and `bug-report-model.ts` (the context block, the Web3Forms body, how a
  send ends, the status lines and toast, each the legacy `submitBug`'s word for word). The legacy `submitBug` stays in
  the single-file page. The unreachable branch for an unset form key is not carried over (the key is set).
- **Tests:** `frontends/app/test/unit/bug-report.test.ts` (5: the context block typed by hand, the program-less and
  partial program lines, the posted body and headers, every way a send ends, the status lines); the e2e's bug-report
  step now also sends with nothing typed and expects 'Type what went wrong first.' on both builds. A local headless
  look found the Angular screen and the page's 0 of 334,836 pixels apart, the same label and the same empty-send line.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.9 moves the rest timer

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.9.
- **Moved:** `#restFloat`, the floating rest timer: `src/app/screens/rest-timer/rest-timer.ts` (the component: the
  readout and the Start/Stop button follow signals; the docking side, the open card, the intro and the drag write the
  same inline styles the legacy script wrote) and `rest-timer-model.ts` (the stopwatch, its clock, the readout, the side
  styles, the drag box, the Live Activity calls, when it shows). The legacy `rest-timer.js` stays in the single-file
  page.
- **A component that other legacy code calls:** the rest of the app calls into the timer (`updateRestFloat` on every
  screen change, `ruReset` when a day closes, `ruResetIfIdle` when one opens, `_ruIsland` at boot, `_setRtIntroPending`
  after the first program). `LegacyBridge.provide(name, fn)` hands each to the component: a top-level function of a
  classic script is a writable property of the global object, and every call looks it up afresh.
- **Tests:** `frontends/app/test/unit/rest-timer.test.ts` (8: the stopwatch on a driven clock, the wall clock with the
  Live Activity and performance.now() without, what the Live Activity is told, the readout, both sides' styles, the
  drag box and the docking half, when it shows). The e2e's strength journey gains a rest-timer step on both builds:
  open, Start (the button reads Stop, the tab marked running), Stop, Reset (0:00 and .00), fold back, and a drag that
  docks it to the left edge (20/20 steps, every one at 0.000% parity).
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.10 moves the celebration pop-up

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.10.
- **Moved:** `#popOverlay`'s card: `src/app/screens/pop-up/pop-up.ts` (the component; the kicker, message, sub, stats and
  buttons follow signals, drawn at once before the overlay opens, as the legacy writes were) and `pop-up-model.ts` (what
  a call shows, and the confetti, each drawing Math.random in the legacy order, so a seeded random falls the same). The
  pools, `POP_CFG` and the line pickers stay in the legacy script, which `tests/integration/pop-ups.test.ts` reads.
- **Legacy callers:** `popFire` (a closed day, a streak, the season, a reminder, the injury check-ins, Random Workout),
  `popClose` and `popDismissBg` (the overlay's own onclick) reach the component through `LegacyBridge.provide`. An action
  button runs the handler code its caller wrote (`"popClose();injSnooze('p1')"`) through `LegacyBridge.run`, in the
  global scope, as the legacy onclick attribute did. The icon and a stat's label are the app's own markup (an icon's
  SVG), kept as they are (`bypassSecurityTrustHtml`); the card keeps a tap to itself, as before.
- **Tests:** `frontends/app/test/unit/pop-up.test.ts` (4: a tier with its picked line and the pickers' order, a caller's
  own content and buttons, the dismiss word, an unknown tier and the season shake, and the confetti's draw order checked
  draw by draw). The e2e's log-done step now expects the workout pop-up up with 'WORKOUT COMPLETE' and a dismiss button
  in its photograph, then closes it with that button, on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.11 moves the program list

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.11.
- **Moved:** `#progList`, the home screen's program cards: `src/app/screens/program-list/program-list.ts` (the cards,
  their header, rename box, meta line and actions, with both archive confirmations) and `program-list-model.ts` (the
  cards and their state, the meta line, the empty lines, each the legacy `renderProgList`'s). The program store, the
  active program and the list's state (open cards, the card being renamed, the archive being confirmed) stay the
  legacy script's; its actions change them and call `renderProgList`, which `LegacyBridge.provide` hands to the
  component with `toggleProgCard`. The list draws at once when asked, since `startRename` focuses the new rename box
  straight after. A card's detail is still `progDetailHTML`'s markup, inserted as it is (its goal, mile and copy buttons
  keep their handlers); a later step templates it.
- **Kept as it was, on purpose:** the name is written into the page as the legacy list wrote it (markup in a name is
  read as markup); an absent name reads 'undefined' on the card and nothing in the rename box. Escaping it would change
  what a few names show, so it is not this step's.
- **Tests:** `frontends/app/test/unit/program-list.test.ts` (5: the meta line typed by hand, the cards, the open, active,
  renamed and confirming states on their own card only, the legacy name rules, the empty lines). The e2e's programs step
  now opens the run's card and reads its selections, starts a rename (the box takes the caret) and leaves it with
  Escape, and starts an archive and calls it off, on both builds, the open card in its photograph.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.12 moves the exercise swap sheet

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.12.
- **Moved:** `#swapOverlay`, the swap sheet: `src/app/screens/swap-sheet/swap-sheet.ts` (the header, its tags and what a
  pick keeps, the same-job and different-job rows, the empty and foot lines) and `swap-sheet-model.ts` (the tags, the
  short prescription, the implement order in a one-implement round, the rows and their notes, each the legacy
  `openSwapSheet`'s). The candidates still come from the legacy `swapCandidates`, `auxSwapCandidates` and
  `swapLoadNote`, and a pick is still the legacy `applySwapChoice`.
- **A legacy `let` written from Angular:** `applySwapChoice` reads the swap's context from `let _swapCtx`, which only
  code in the global scope can assign. `LegacyBridge.set(name, value)` writes it (an indirect eval of the validated name,
  the value through a temporary global). `openSwapSheet` and `closeSwapSheet` reach the component through
  `LegacyBridge.provide`; the sheet draws before it opens.
- **Tests:** `frontends/app/test/unit/swap-sheet.test.ts` (6: the tags and fallbacks, the short prescription, the
  implement, the whole sheet with its load note and cautions, the main lift and an aux family, the one-implement
  order). The e2e's swap step now picks the first candidate after the sheet's photograph and finds the day reopened with
  the new name and the sheet closed, on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.13 moves the add-an-exercise sheet

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.13.
- **Moved:** `#addOverlay`: `src/app/screens/add-sheet/add-sheet.ts` (the header and its tags, the three groups, the
  empty and foot lines) and `add-sheet-model.ts` (the tags, the groups and their notes, the day's working sets, each the
  legacy `openAddSheet`'s). The candidates still come from the legacy `addCandidates`, `addedDetailFor` and `parseRx`,
  and adding one is still the legacy `applyAddChoice`, which closes the sheet through `closeAddSheet`; both
  `openAddSheet` and `closeAddSheet` reach the component through `LegacyBridge.provide`.
- **Tests:** `frontends/app/test/unit/add-sheet.test.ts` (3: the tags and fallbacks, the groups and their notes, the
  working sets). The e2e gains an add-sheet step on both builds (the strength journey's thirteenth): open a day, its
  `+`, the sheet in the photograph, then a pick that lands on the day under "Added by you".
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.14 moves the change-a-goal sheet's body

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.14.
- **Moved:** `#goalBody` inside `#goalOverlay` (the overlay's frame and its Back button stay legacy markup):
  `src/app/screens/goal-sheet/goal-sheet.ts` (the heading, the option rows, the decision panel, its target fields and
  buttons) and `goal-sheet-model.ts` (which options show, which are bigger, and the decision's title, text, fields and
  button labels, each the legacy `renderGoalSheet`'s). The draft stays the legacy `_goalDraft`; picking, typing and
  committing are still the legacy `selectGoalOpt`, `_goalSetInput`, `_goalInputsValid` and `commitGoalChange`.
  `renderGoalSheet` and `_goalRefreshCommit` reach the component through `LegacyBridge.provide`; a keystroke redraws
  only the commit button's state, so a field keeps its caret, and a pick draws the decision panel anew, so a field typed
  for one goal never shows under the next (the legacy write cleared it the same way).
- **Tests:** `frontends/app/test/unit/goal-sheet.test.ts` (6: the heading and option marks, the hybrid exclusions, a
  step up started and fresh, a step down with the pace fields, a program with no goal and a time goal, a pick not on
  offer). The e2e gains a goal-sheet step on both builds (the strength journey's twenty-first): the run goal's pencil,
  the sheet in the photograph with the pace goal picked, then the switch held shut until a distance and a time are
  typed, the typed distance kept, and Keep closing the sheet.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.15 moves the mile pencil's two sheets

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.15.
- **Moved:** `#mileOverlay` (its header and body) and `#mileLockBody`, in `src/app/screens/mile-sheet/`: `mile-sheet.ts`
  (the edit sheet; it takes over `openMileSheet` through `LegacyBridge.provide`), `mile-lock.ts` (the lock's body),
  `mile-sheet-state.ts` (the lock's facts, which the edit sheet lists at the tap and the lock draws before it opens) and
  `mile-sheet-model.ts` (when a tap locks, what the lock lists, how a stored mile starts a field, the two texts, each
  the legacy `openMileSheet`'s). The draft stays the legacy `_mileDraft`; saving is still the legacy
  `commitMileChange`, which reads the two fields by their ids, and closing is still the legacy `closeMileSheet`. The
  fields stay the same elements from open to open and each open writes the stored mile into them, as the legacy did:
  a first draft drew them anew on each open, and a local comparison showed the page keeping a focused field's focus
  across a close and reopen where the draft lost it.
- **Tests:** `frontends/app/test/unit/mile-sheet.test.ts` (5: when the lock starts, the facts with a race date, race
  day and behind you in the countdown's words with a date line that throws, the week alone, a stored field). The e2e's
  1.5 mile test journey gains two steps on both builds: the pencil opens the sheet on the stored 7:30, a change kept
  back is gone on reopening; then `relaunchOn` (new: the frozen clock moved to a later moment for a relaunch, through
  the tab's sessionStorage, which the app never reads) brings the athlete back on the Wednesday of week 4, the re-entry
  reminder is skipped, and the pencil shows the lock: 17 days out, Sat, Nov 14, 2026, week 4 of 6.
  `tests/unit/e2e-flow.test.ts` holds the helper and the page script to one sessionStorage key.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.16 moves the swap nudge and the RPE card

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.16.
- **Moved:** the card inside `#swapNudgeOverlay`: `src/app/screens/swap-nudge/swap-nudge.ts` and `swap-nudge-model.ts`
  (the two paragraphs and the slot words, each the legacy `showSwapNudge`'s). It takes over `showSwapNudge` through
  `LegacyBridge.provide`, writing the legacy `_nudgeCtx` first as before; accepting and declining are still the legacy
  `acceptSwapNudge` and `dismissSwapNudge`, and when to offer it is still the legacy `bumpSwapCount`. The card inside
  `#rpeInfoOverlay`: `src/app/screens/rpe-info/rpe-info.ts` (static); opening it and the overlay's tap outside stay the
  legacy `showRpeInfo` and `hideRpeInfo`. The overlays themselves stay legacy markup. The space between the nudge's two
  buttons is kept (`&ngsp;`), so the card's text reads as the page's does.
- **Tests:** `frontends/app/test/unit/swap-nudge.test.ts` (2: the paragraphs, the slot words). The e2e reaches the nudge
  for real in the strength journey: the swap step records the trade, then the athlete puts it back and makes it again
  twice on the same Friday, and the third trade earns the nudge, which is declined. The log-session journey opens the
  RPE card from the effort's ⓘ and closes it with Got it, the day still open. A local comparison of both builds also
  matched: the nudge declined and accepted with no program, the RPE card kept by a tap inside, closed by Got it and by
  the backdrop.
- **Found, for a ruling (handoff §12):** `showToast` never cancels an earlier timer, so a toast inside another's 2.2 s
  is cut short (the e2e waits each toast out); the nudge prints the pattern id ("your hpress"), and its "three
  sessions running" counts trades, not sessions.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.17 moves the injury and travel sheet's body

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.17.
- **Moved:** `#changeBody` inside `#changeOverlay` (the frame and its Back button stay legacy markup):
  `src/app/screens/change-sheet/change-sheet.ts` (the head, the date boxes, the choice cards, the effect panel and the
  foot's button, one template each, shared by both sheets) and `change-sheet-model.ts` (the head for the sheet the
  draft is on; the travel sheet's dates, tiers and effect, with the full gym's answer and the outside-the-program line;
  the injury sheet's regions, tiers, effect and the off-ramp; every string the legacy `renderOverlaySheet`,
  `_renderTravelTab` and `_renderInjuryTab`'s). The draft stays the legacy `_ovDraft`; each choice is still the legacy
  `_ovSet`, which redraws through `renderOverlaySheet` (provided); the foot is still the legacy `applyOverlayDraft`,
  `applyInjuryDraft` or `closeOverlaySheet`. The date helpers, the program's range and the resume line are still the
  legacy `_fmtDate`, `_fmtDateWd`, `_dayCount`, `_dayCountWord`, `overlayWeekRange` and `overlayBackCopy`.
- **Tests:** `frontends/app/test/unit/change-sheet.test.ts` (7: the heads, a dated trip, a room-only day and an open
  end, the full gym and dates outside the program, the regions before a pick, a region and tier, the off-ramp). The e2e
  gains two photographed states on both builds: Hurt? with a lower back to protect (then the neck's off-ramp, which
  closes and applies nothing), and Traveling? with a room-only day (then a full gym, which asks for no dates and
  closes). The bodyweight journey taps the knee by its name: the legacy `onclick` it found it by is not in the
  component. The log-session journey's Done photograph now waits its toast out under the pop-up: the full run failed
  it once at 0.805% (the toast in one build's photograph, gone in the other's), the never-cancelled toast timer of
  v0.239.16's finding firing on either side of the shutter.
- **Found, for a ruling (handoff §12):** the injury check-in line asks how "the lower" feels for a lower back.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.18 moves Random Workout

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.18.
- **Moved:** `#randOverlay` (its header and body): `src/app/screens/random-workout/random-workout.ts` (the Back
  button, the two filters, the two-tap reset, the badge, title, cardio block, note and the done line or Complete
  button) and `random-workout-model.ts` (the pool for a goal and filter, the draw that never repeats the last workout,
  the weekday key, the sheet for a workout, This Week's counter, each the legacy `getActivePool`, `reroll` and
  `updateRandCounter`'s). It takes over `openRandom` and `updateRandCounter` (This Week calls it too) through
  `LegacyBridge.provide`; the filter and the pending reset are the component's now (nothing else read the legacy
  `randFilter` or `resetPending`). The draw keeps the legacy order of `Math.random` calls and still records itself
  through `_setLastRandIdx`, `_setCurrentRandIdx` and `_setCurrentRandDayKey`. The pools, the done list
  (`getWildcardDone`, `saveWildcardDone`), the sections (`buildSectionsHTML`, laid in a box with `display: contents`
  so the sheet's flex column and gap see each section as before), completing (`completeWildcard`) and closing
  (`closeRandom`) stay legacy.
- **Tests:** `frontends/app/test/unit/random-workout.test.ts` (5: the pools, the draw, the weekday key, the sheet, the
  counter). The e2e's random-workout step becomes three on both builds: My Goal; See All (then back to My Goal, a
  Wildcard completed, the sheet closed, the Wildcard pop-up dismissed and This Week's counter at one); the reset's
  "Tap again" (then the second tap: the button back, the toast, the counter at none). `closeSheet` also finds a
  `.back-btn`, the Back button the component draws without the legacy `onclick`.
- **Found, suspected (handoff §12):** the Wildcard's exercise controls index into the active day's sections.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.19 moves the toast and the update banner's contents

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.19.
- **Moved:** the message inside `#toast`: `src/app/screens/toast/toast.ts`, which takes over `showToast` through
  `LegacyBridge.provide` (every legacy caller reaches it). The message is the app's own markup, as before, laid in a box
  that makes none of its own. It still hides 2.2 s after it shows, and an earlier toast's timer is still never
  cancelled: handoff §12's finding (1) is Mario's to rule, and this step moves the toast without changing it. No toast
  fires during boot, before the component mounts. The two spans inside `#iaUpdateBanner`:
  `src/app/screens/update-banner/update-banner.ts`; the banner, the check that shows it and its tap to refresh stay
  legacy (`update-check.js`), and the ✕ still calls `iaDismissUpdate` without the tap reaching the banner.
- **Tests:** neither has logic of its own to unit-test. The toast is read by the e2e in a dozen steps (its text and its
  `show`), all at 0 px on both builds. The banner cannot appear in the e2e (the check finds the same version it runs);
  a local comparison of both builds matched it shown, dismissed by its ✕ (the page did not reload), and staying
  dismissed for the session, and matched toasts with plain text and with markup, all at 0 px.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.20 moves the Progress screen's arrangement, journal and estimator

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.20.
- **Moved:** `#progressBody`: `src/app/screens/progress/progress-screen.ts`, which takes over `renderProgressScreen`
  through `LegacyBridge.provide` (the tab, the chips, the restore and delete bar call it), and `progress-model.ts`
  (the program shown, the weekly sums, the charts in the legacy order with the legacy arguments, the Session Journal,
  the RPE colours, the 1RM estimate, each the legacy `renderProgressScreen`, `runCalc` and `setCalcLift`'s). The
  empty states, the journal and the estimator are the component's template. The program chips and the restore bar
  (`_progChipsHTML`), every chart builder and the Lift Ledger (`buildLedgerCards`) are still legacy markup, each laid
  in a box with `display: contents` so the screen's flex column and gap see them as before; each moves in a later step.
  The stores, the fold and dedupe of loads, and the readers the charts take are still legacy. The estimator's lift is
  still the legacy `calcLift`, through `_setCalcLift`. Each render draws the body anew (a fresh view object keys the
  template), as the legacy write did: a folded journal week or a typed estimate resets on a re-render, as before.
  Strings the legacy wrote as markup (the notes, the swap line, the jog lines) stay markup.
- **Tests:** `frontends/app/test/unit/progress.test.ts` (8: the program shown; the weekly sums with the rest-day jog,
  the running mean RPE and the big-three loads; a run program's chart order with the short first week withheld; the
  effort chart, projection, pace chart and empty state by coverage; swim and bike charts and the ledger alone; the
  journal by week with markup kept; the RPE colours; the estimate). The e2e's log-session journey checks the journal's
  open week (its day, RPE words and quoted note) and gains an estimator step (225 for 5 estimates 265, then Squat), on
  both builds.
- **Found, for a ruling (handoff §12):** journal notes are written into the page as markup.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.21 moves Progress's weekly dot charts

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.21.
- **Moved:** the legacy `buildDotChart` (Weekly Running Mileage, Weekly Swimming Volume, Weekly Cycling Time, Average
  Session RPE): `src/app/screens/progress/charts/dot-chart.ts` draws the card and its SVG, and `dot-chart-model.ts`
  works out every coordinate with the legacy builder's arithmetic (the 320 × 120 box and its padding, the top at 1.2
  times the peak or the given one, the dashed line between neighbouring logged weeks, the week labels every one, two
  or four weeks, the total and the peak to one place). A series with nothing logged draws nothing, as before. The
  Progress model now returns chart blocks (a dot chart to draw, or a legacy builder's markup) and takes `dotChart`
  through its deps, so the models import only each other's types. The legacy builder stays in the single-file page.
- **Tests:** `frontends/app/test/unit/dot-chart.test.ts` (4: the scale, gridlines, points, line and labels worked by
  hand; a broken line and a fixed top; the label spacing past eight and sixteen weeks and a lone week; nothing logged
  and an all-zero series). `progress.test.ts`'s chart cases now read blocks, and a planned swim with nothing logged
  draws nothing. The e2e photographs the RPE dot chart (log-session) and the strength journey's Progress on both
  builds at 0 px.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.22 moves Progress's run charts

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.22.
- **Moved:** the legacy `buildLadderChart`, `buildEasyZoneChart`, `buildEasyBandsFallback`, `buildEasyEffortChart`,
  `buildEasyEffortEmpty`, `buildProjectionCard`, `buildPaceChart` and `buildDriftChart`. Each is now a pure function
  in `src/app/screens/progress/charts/run-charts-model.ts` returning a card spec (`chart-card-model.ts`: the title,
  head, body and footer markup, and the SVG as elements with the attribute strings the legacy wrote, in its order), and
  one component draws them all (`chart-card.ts`, with `svg-attrs.ts` writing each element's attributes). The readers
  they take (`ladderWeekly`, `easyVsPrescribed`, `runsByClass`, `easyEffortWeekly`, `recoveryPaceWeekly`,
  `plannedVsLogged`) and the pace table's helpers stay legacy. The dead `buildClassBandsChart` and `buildMultiDotChart`
  (nothing calls them) stay behind in the page.
- **Config:** `frontends/app/tsconfig.app.json` sets `rewriteRelativeImportExtensions`, so a model can import another
  as `./x.ts`, which node's test runner needs and the Angular build now accepts.
- **Tests:** `tests/integration/progress-charts.test.ts` lifts each legacy builder out of the page and requires its
  markup from the new model, byte for byte, over 28 inputs that walk every branch (the nothing cases, the race line,
  covered distance, the week in progress and the short first week, the aim line, a widened range, coarse and fine
  grids, twelve and twenty weeks). `frontends/app/test/unit/run-charts.test.ts` (9) holds hand-worked values (the
  ladder's grid, race line, bars and labels; the drift's bars and net; the zone's head and labels; the bands' verdicts;
  the projection's finish times; the pace chart's own card). `progress.test.ts` now stubs the readers and checks the
  chart order. No e2e journey logs runs across weeks, so a local comparison stubbed the readers in both builds over
  three scenarios and matched all 22 chart cards in pixels at 2×.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.23 moves Progress's Lift Ledger

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.23.
- **Moved:** the legacy `buildLedgerCards`, `buildMainLiftBlock`, `_ladderRow` and `_ladderTrack`:
  `src/app/screens/progress/charts/ledger-cards.ts` (Main Lifts, the Range Ladder, Other Accessory Work, in the legacy
  markup), `ledger-model.ts` (each card's words and numbers, a main lift's line and an accessory's rep-range track as
  SVG elements), `card-shell.ts` (the legacy `_iaCard` as a shell around projected content) and `svg-picture.ts` (an
  SVG from elements, shared). The rows still come from the legacy `ledgerModel`. With this step no chart on the
  screen is legacy markup; the Progress model's blocks are dot charts, chart cards and the ledger.
- **Text runs:** a run of text the legacy wrote as one text node stays one: the first draft split " in week 2 ·
  heaviest in week 2" around an `@if` into two nodes, and Chrome placed the letters across the join a pixel apart (13
  to 21 pixels in a card). The model now hands back each run as the legacy markup cut it.
- **Tests:** `tests/integration/progress-charts.test.ts` gains six ledgers written back out in the legacy format and
  held to `buildLedgerCards` byte for byte (every card in pounds and kilograms, a reps main alone, an unready ladder
  with nothing stepped up, other work alone, nothing at all). `frontends/app/test/unit/ledger.test.ts` (6) holds
  hand-worked values (the unit conversion, the gain and the bold dot, a single session and a reps main, the track's
  ticks and nudged dots, a ready track, every card's words). No e2e journey logs loads, so a local comparison stubbed
  `ledgerModel` in both builds and matched every card in pixels, in pounds and in kilograms. The e2e still shows
  Other Accessory Work in the log-session journey.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.24 moves Progress's program chips and the archived bar

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.24.
- **Moved:** the legacy `_progChipsHTML` and `_restoreBarHTML`: `src/app/screens/progress/program-chips.ts` (the chips
  row, the archived bar with Restore and the trash, and the delete's confirmation) and `program-chips-model.ts` (the
  chips' order: the active program, the live ones newest first, the archived; the labels; the shown chip; which bar
  an archived program gets). The handlers stay legacy: `setProgressView`, `unarchiveProg` then the screen again,
  `askPurgeFromProgress`, `deleteProg(id, true)`, `cancelProgressConfirm`; so do `_purgeWarnsCrossProg` and the armed
  confirmation (`confirmProgId`, `confirmTier`). A chip's label keeps the program name as markup and the confirmation
  keeps it escaped, as each did (handoff §12's finding 5 covers the chips' name). With this step the whole Progress
  screen is Angular components; its data readers (the stores, `ledgerModel`, the chart readers) are still legacy.
- **Tests:** `tests/integration/progress-charts.test.ts` gains seven cases held to the legacy `_progChipsHTML` (four
  programs in order, an archived program's bar, its armed delete with and without the cross-program warning and with
  markup in its name, an archive armed elsewhere, one archived program alone, one live program alone); the legacy bar
  is an indented template literal inside flex rows, so both sides drop the whitespace between tags.
  `frontends/app/test/unit/program-chips.test.ts` (4). The strength journey's Progress photographs the chips in the
  e2e on both builds; a local comparison matched the archived bar, the armed delete, Cancel and a chip switch in
  pixels and in what each left behind.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.25 moves This Week

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.25.
- **Moved:** `#screenWeek` whole: `src/app/screens/week-view/week-view.ts` (the header, HURT?, the week buttons, the
  start and race dates, the phase pill, the day strip, the hero, the Wildcard tag, the stat tiles, and the bar with
  Random Workout and Traveling?) and `week-view-model.ts` (every decision of the legacy `renderWeekView`: the phase by
  program length, the pill's priority of injury, travel, taper and recovery, the injury wash, the overlay marks on the
  week buttons, the strip's cells and colours, the hero for a rest day, a session today or a browsed week, and the
  tiles). It takes over `renderWeekView` through `LegacyBridge.provide`. Each render draws the strip and the days list
  anew, as the legacy `innerHTML` writes did, then runs the legacy scoot (`_wkStripTarget`, `_wkScoot`,
  `_wkScootCancel`, the `_wkScootDone` latch) on the new strip, since the scoot repaints the buttons' `active` class by
  hand. The day codes, the hero's summary, time and travel tag, the Wildcard marks, the streak, the rest-day tip, the
  race alignment and every store read stay legacy. `#randCounter` and `#changeActiveWrap` are left empty for their
  legacy writers (`updateRandCounter`, now the RandomWorkout component's, and `renderOverlayChip`), and every id the
  legacy had stays (`#raceDateInput` is also the wizard's, so document order still decides which one a lookup finds).
- **Boot:** the legacy boot draws This Week before the components mount, and the mount replaces that drawing. The host
  now calls a screen's `mounted()` once it is attached; This Week's stops the boot's scoot (animating the removed
  strip) and draws itself as the first draw, scoot included. The first full e2e without it showed a blank This Week
  after every relaunch.
- **Tests:** `frontends/app/test/unit/week-view.test.ts` (8: the phase labels by length; the header, dates and pill;
  the pill's priority and the wash; the strip's cells; the rest-day hero; today's hero and a closed day; a browsed week
  with its tags and its move; the tiles). Every journey photographs This Week, in its rest-day, today, browsed, closed,
  injury, week 4 and week 6 states, at 0 px on both builds. The e2e finds a day cell by its label (`tapDay`, new) and
  the rest hero's cardio button by its place, the legacy `onclick` attributes it matched being gone from the component.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.26 moves the wizard's shell and its first three steps

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.26.
- **Moved:** `#screenWizard`: `src/app/screens/wizard/wizard.ts` (the Back button, the progress bar, the step count,
  the next button, and the steps "What are you training for?", "About you" and "Your equipment") and
  `wizard-model.ts` (the shell's progress and count, a lifting-only program skipping the cardio step, and the moved
  steps' cards and hints, each the legacy `renderWizardStep`'s). It takes over `renderWizardStep` through
  `LegacyBridge.provide`. The four steps not yet moved (the cardio goal, lifting focus, days, name) are drawn by the
  original legacy `renderWizardStep`, captured before it was replaced, into a `#wizardBody` of their own: the
  component swaps the body element when a step moves between the two, so neither writes into the other's. The legacy
  renderer also writes the shell's count and next label; the component binds those as `textContent`, so a write from
  either side holds, and both write the same words. The draft is still the legacy `WD` (a card writes its field and
  draws the step again, as the legacy handler did), the step the legacy `wizardStep`, and moving between steps
  `wizardBack`, `wizardNext` and `setUnit`.
- **Tests:** `frontends/app/test/unit/wizard.test.ts` (4: the shell's progress, counts and labels; the paths; the
  profile's cards, hints and units; the equipment). The e2e finds a wizard card by the words on it (`tapCard`,
  `cardSelected`, new), the legacy `onclick` attributes being gone from the moved steps; all four journeys that build a
  program photograph the moved steps at 0 px on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.27 moves the wizard's lifting focus, days and name steps

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.27.
- **Moved:** the steps "Lifting focus" (the focuses for the path, and on a lifting-first program the optional cardio
  add-on with Lift Only), "Rest days" (the toggles, the floor's lock and why it holds, the advisories) and "Name your
  program" (the name, the start date or the race-derived start with its copy and pips, the summary): `wizard.ts` and
  `wizard-model.ts` (`liftingView`, `daysView`, `nameSummary`). The legacy readers stay legacy: `LIFTING_OPTIONS`,
  `toggleCardioTypeSport`, `toggleRestDay`, `getDayAdvisories`, `getMinTrainDays`, `goalLabel`, `wizardTestPin`,
  `calcProgramLength`, `resolveStartDate`, `startResolveCopy`, `startSummaryVal`, `wizardAlignment`,
  `alignedStartCopy`, `alignedPipsHTML`, `raceCountdown`. The name step still writes its default name and start into
  the draft before it reads, as the legacy did. The component takes over `updateStartResolve`: a start date change
  repaints only the explanation and the summary's start row, so the native date picker stays open (the legacy wrote
  the two nodes by id for the same reason). Only the cardio goal step is left to the legacy renderer.
- **Tests:** `frontends/app/test/unit/wizard.test.ts` grows to 7 (the focuses and the add-on, the days and the floor,
  the summary). The e2e taps a rest day by its two letters (`tapRest`, new) and a focus by its words; the strength
  journey's name step now moves the start to a Friday, checks the explanation and the summary's start row change and
  the typed name stays, photographs it, and puts the start back before generating. 68/68 at 0 px on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.28 moves the session sheet's frame and header

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.28.
- **Moved:** `#detailOverlay`: `src/app/screens/day-detail/day-detail.ts` (Back, the logged count, RPE, the week and
  day, the title, the tags, the add button, and the body and foot frames) and `day-detail-model.ts` (lifting first only
  when lifting is the priority, the body's order, the "logged but never marked" nudge, the count). It takes over
  `openDetail` through `LegacyBridge.provide`, so every open and every re-render (a skip, a swap, an add, a KB size,
  the nudge) reaches it. The sheet is drawn anew on each call, as the legacy writes did; a re-render keeps the reader's
  place and a fresh open starts at the top, decided from the sheet's own state as before. The body is still the legacy
  builders' markup (`buildSectionsHTML` with its set logging, `e1rmCalcHTML`, `buildCardioHTML`, `rangeTopNudgeHTML`,
  `wildcardTagHTML`, `buildLogHTML`), called in the legacy order, since a stale-load warning shows only on the first
  row that earns it; the foot is still `renderStatusFoot`'s. After each draw the component runs the legacy wiring: the
  log fields save as they change (`persistLogFields`, a cardio field once its card is live), the wheels start
  (`iaWheelInit`), the derived dose paints (`updateDoseDerived`).
- **Tests:** `frontends/app/test/unit/day-detail.test.ts` (4: lifting first, the body's order, the nudge, the count).
  Every journey that opens a day photographs the sheet at 0 px on both builds; the log-session journey logs two
  exercises, an effort and a note through it and finds them after a relaunch, so the wiring holds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.29 moves the app's frames

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.29.
- **Moved:** `src/app/screens/frames/`: `home-screen.ts` (`#screenHome`: the title, the program list, the Build New
  Program button), `generating-screen.ts` (`#screenGenerate`: the lifting figure and its title; the line under it is
  still written by the legacy `generateProgram`), `progress-frame.ts` (`#screenProgress`: the title and the scrolling
  body) and `tab-bar.ts` (the four buttons inside `#tabBar`). Their templates were derived from the legacy partials by
  script, each `onclick` becoming a `(click)` that calls the same legacy function (`startWizard`, `tabGo`). The
  ProgramList and ProgressScreen components are now the frames' children, not mounts of their own. The tab bar's
  showing and its active tab are still the legacy `updateTabBar`'s, on the buttons' ids.
- **Host:** the host now draws each mounted component at once, so a child (the program list) has taken over its
  legacy function before any legacy call can reach it. The legacy boot marks the active tab on the buttons the mount
  then removes; the tab bar's `mounted()` runs `updateTabBar` again for the screen the boot showed. The first e2e run
  without it photographed the Programs and This Week tabs unmarked (about a thousand pixels each).
- **Tests:** no logic of their own to unit-test; every journey photographs the frames, 68/68 at 0 px on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.30 moves three overlay frames

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.30.
- **Moved:** the frames (the header with its Back button, and the body) of `#goalOverlay`, `#mileLockOverlay` and
  `#changeOverlay`: the GoalSheet, MileLock and ChangeSheet components now mount on the overlay and draw the frame,
  their content inside the body element with the id it had (`#goalBody`, `#mileLockBody`, `#changeBody`). Back still
  calls the legacy `closeGoalSheet`, `closeMileSheet` and `closeOverlaySheet`. Of the overlays, only the rest-day
  sheet (`#restOverlay`, the v0.240.0 feature build) keeps legacy markup.
- **Tests:** the e2e's goal sheet, injury and travel sheets and mile lock steps photograph the frames and close them
  by Back, 68/68 at 0 px on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.31 moves the session sheet's status foot

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.31.
- **Moved:** the legacy `statusFootHTML` and `renderStatusFoot`: the DayDetail component draws the foot (the big button
  carries the day's status and undoes it, the small one the other status; a pending day offers Done and Skip) from
  `statusFoot` in `day-detail-model.ts`, and takes over `renderStatusFoot` through `LegacyBridge.provide`, which the
  legacy `handleDayStatus` calls on every status change. Each button still calls the legacy `handleDayStatus`.
- **Tests:** `frontends/app/test/unit/day-detail.test.ts` gains the foot's three states. The strength journey gains a
  step (`day-skip`): Friday skipped (the day closes, its toast), reopened with "Skipped ✕ tap to undo", undone (the
  "Unmarked" toast, the usual foot back). The log-session journey closes a day with Done and finds "Done ✓ tap to
  undo" after a relaunch. 69/69 at 0 px on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.32 moves the session sheet's 1RM calculator and range-top nudge

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.32.
- **Moved:** the sheet's body is now a list of blocks: each legacy builder's markup in a box that makes none of its own
  (the body is a flex column, and no rule depends on its direct children), and components where a piece has moved.
  The test-week calculator (the legacy `e1rmCalcHTML`, `e1rmCalcUpdate`, `saveTestMax`): `day-detail/e1rm-card.ts`,
  prefilled from the logged test set (`e1rmCard`), estimating by Epley (`epley`, a single being itself), reading 0
  until a field changes as the legacy did, and saving the estimate as the lift's max into the stored program and the
  active one, with no rebuild. Its two labels stay unassociated with their fields, as the legacy's were (a lint
  exception says so). The range-top nudge (the legacy `rangeTopNudgeHTML`): `rangeNudge` and the sheet's template,
  its text cut into the legacy's text runs. The legacy reads both guarded stay guarded.
- **Tests:** `frontends/app/test/unit/day-detail.test.ts` grows to 8 (the blocks' order with the calculator after the
  main, Epley, the prefill, the nudge's names and count). No journey reaches a test-lift day or earns the nudge, so a
  local comparison opened one crafted day in both builds (a bench test, three accessories, two at the top of their
  range) and matched the sheet, the calculator before and after a typed set, and the saved note, in pixels and facts.
  69/69 at 0 px on both builds.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.

## Release scope: v0.239.33 moves the session sheet's cardio card

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.33.
- **Moved:** the legacy `buildCardioHTML`: `day-detail/cardio-card.ts` and `cardio-card-model.ts` (the classes by
  sport, the title with its session, a swim's segments with their yards in total, or the detail with its line breaks
  as breaks, the note, the retest strip). The prescription's words are the engine's markup and stay markup. The
  retest strip still comes from the legacy `_benchStripHTML`, which reads the logs and the frozen days.
- **Tests:** `tests/integration/session-sheet.test.ts` (new) lifts `buildCardioHTML` out of the page and requires its
  markup from the view, byte for byte, over 9 inputs (a long run with a note, a retest, a ride, a segmented swim, a
  swim with segments but no yards, a swim without segments, another sport, no detail, no cardio).
  `frontends/app/test/unit/cardio-card.test.ts` (3). The e2e photographs run cards in four journeys at 0 px.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.
