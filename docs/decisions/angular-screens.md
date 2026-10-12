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
