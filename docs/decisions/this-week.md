# This Week: decisions

The iOS app's This Week screen (the Angular `frontends/app/src/app/screens/week-view/`). Mario's redesign, written in
his own spec `docs/design/WEEK_SCREEN_REDESIGN.md` with its mockup `docs/design/week-screen-mockup.dc.html` (from his
redesign chat, 2026-11-06), wired to D272 on the canvas "The Half Manny mockup"
(https://claude.ai/artifact/1km7jKQuQTDrdVQ71roHaH, board THE MOCKUP). The run card, the lift card and the recorder are
D272's (`docs/decisions/gps-recording.md`, with Amendments 1 and 2); the deck behind Start lift is D275's
(`docs/decisions/swipe-deck.md`). Tests: `tests/unit/this-week-hero.test.ts`, `tests/integration/this-week-hero.test.ts`
and the app's `frontends/app/test/unit/week-view.test.ts`.

## D276 P-WEEKSCREEN: This Week as Mario redesigned it, the week title strip and two cards (Mario, 2026-11-08)

- **Date:** 2026-11-08, Post-v0.257.0. **Ruled by:** Mario. His spec ("Status: approved mockup, ready to build",
  2026-11-06) and THE MOCKUP; today, on the build's scope: "Screen now, rest next"; on the day strip's order: "sunday
  through saturday + race day title" (he had asked for race day to stand out on plans that have one: "i like the idea
  of highliting the race day for programs with a race day"). **Bump:** MINOR, v0.258.0 (Mario, 2026-11-08: a new
  screen and a new way into the deck and the recorder; no program output moves). **Shipped:** v0.258.0 (2026-11-08), with D277; "D276 as built", below.
- **Why (his spec):** today's screen says "Week 11" four times, cuts the day words to `RUN POSTE`, puts a big button
  on a session already closed out, shows a race date instead of a countdown, and drops a session's detail into a strip
  too small for it. The look stays (the Track look, D263); the structure changes.
- **The measure (2026-11-08, on v0.257.0):** `tests/measure/this-week_day-codes.js`, saved as
  `tests/measure/this-week_day-codes.md`, over the 864-config lattice and 33 other programs (62,091 training days).
  - **One word per day.** By the spec's rule (a run day wears its run's word, a lift only day its focus, a rest day
    REST) no word passes five letters, but two lift only titles fall to the title cut at five letters, the fault the
    spec names: `Posterior Chain` reads `POSTE` (2,298 days) and `Recovery Lift` reads `RECOV` (30), the Recovery
    Run's word. An injury plan's `Incline Walk` falls to the generic `RUN` (12,096 days).
  - **The last Sunday.** Sunday first moves each program week's Sunday into the next week's title, so the program's
    last Sunday needs a title of its own. It holds the race on 333 programs, training on 543 (the lattice's injury
    plans put an easy run or an incline walk on race day; three Sunday trained strength programs end on a lift) and a
    rest day on 21.
- **What changes (this build, the Angular screen only):**
  1. **The week title strip.** The program's name above it as today; then the week titles, `Week 1` to the last week,
     56 px, 800, sideways in a strip that snaps (each title 240 px wide, the strip full bleed, `padding-right` 150 px
     so the last one can sit at the left, no scrollbar), the week in view in full ink and the others barely there;
     a fade over its right end, under the Hurt? pill. Scrolling the strip picks the week where it settles; tapping a
     dim title picks it and scrolls to it. Only this strip swipes. It replaces the `Week N` headline and the
     `Wk 1 … Wk 14` chip row.
  2. **Sunday first, and a last title.** The day strip runs `S M T W T F S` on calendar dates: a week title's Sunday is
     the program week before it (rest on every week of HALF_MANNY but the race), its Monday to Saturday that program
     week's. After the last week the strip ends on one more title holding the program's last Sunday alone, its other
     six columns empty: **`Race Day`** on a race plan (the program is aligned to its race date, `progAlignment`), its
     Sunday the race, RACE in the accent; **`Last day`** on every other plan (the session's word, see below). Week 1's
     Sunday is before the program and is drawn empty.
  3. **The race row.** On a race plan, a flag, `{N} days out` (today to the race, unchanged by the strip) and `Race day
     Sun, Dec 6` under it; on race day `Race day today`, after it `Raced Sun, Dec 6`. Tapping it opens the date picker
     that sets the race date, as the Race Day box does today. Any other plan keeps its Program start box, in the same
     row. The phase pill sits on the right, its words and states as today's; the Race Day title reads `Race Day`.
  4. **The day strip** in one card, seven columns: the day's letter (the accent today, full ink when picked), a 36 px
     circle (a check once done; a filled circle with the date for a session to come; no fill and a dim date for rest
     or a past day not done; a ring on the picked day), and one word under it, never cut (below). **A tap picks the
     day** and loads it into the cards; it no longer opens the session sheet. When a week loads: the week holding
     today picks today's session, or the next one not done; a past week its Saturday; a week to come its Monday; the
     last title its Sunday.
  5. **The day card** (the run card on a run day): the when line (`Today · Thursday`, `Tomorrow · Friday`,
     `Yesterday · Wednesday`, else `Friday, Nov 13`), the title (the run's name on a run day, the lift's on a lift only
     day, `Rest` on a rest day), the meta line and one or two sentences under it. On a run day not yet logged:
     **Record run** (the iOS app with its GPS plugin, D272 item 6), which opens D267's recorder out of the run card
     (D272 Amendment 2's motion) with **Ran without the phone?** on it before Start (D272's open item, Mario's
     concurrence below), opening the hand log; elsewhere **Log the run**, which opens the day's hand log. Rides, swims
     and rows have no Record (D272 call 3): their button opens the hand log for that sport. The card's top (its when
     line and title, with a chevron) opens the day's session sheet, where the hand log, the review and the edits live
     (P-DECK answer 3).
  6. **The lift card**, on a day with a run and lift work: `Then lift` (`After the run` for the cool down), the lift's
     name, its first movement and how many more, and **Start lift** (`Start the cool down`), an outline button until
     the run is logged, then the accent button: one glow (D263). It opens the deck out of the lift card (D275 call 16,
     `DeckState.start`). A lift only day puts **Start session** on the day card instead.
  7. **Done rows.** A card whose work is done shows a check, what was done and its own **Reopen**: the run and the lift
     reopen apart (D272 Amendment 1). No orange button on a closed day. Reopen opens the day's session sheet, where a
     logged run is edited and a closed day is undone, as Open session did (D179).
  8. **Rest days** show `Rest`, today's words, any jog logged, and two links: Training anyway? and Log cardio (Edit
     cardio once one is logged), as today (D272 Amendment 1, item 3; D231's rule for a day whose session moved away).
  9. **Hurt?** is a pill over the strip's right end, no icon, the injured region's name while an injury is live, and
     opens today's injury sheet (the spec: "Hook into whatever Hurt? does today").
- **The day's word** (the measure's rule, with three words the spec did not have to name): a run day wears its run's:
  `SPEED`, `RECOV`, `LONG`, `SHAKE` (the shakeout), `RACE` (race day); a test plan's runs their chip as today (`SI`,
  `LI`, `STDY`, `EASY`, `TEST`, `LSD`, `INT`), an incline walk `WALK`; a ride `BIKE`, a swim `SWIM`. A lift only day
  wears its focus as today (`LEGS`, `PULL`, `PUSH`, `UPPER`, `LOWER`, `FULL`), `Posterior Chain` **`HINGE`** and
  `Recovery Lift` **`LIGHT`**. A rest day `REST`. Colours: the run's colour for a run, bike or swim day to come, the
  accent for a lift only day and for RACE, dim for rest and for a past day.
- **Kept below the cards, as today:** the Wildcard tag, the three tiles (Done, Miles, Day streak; Done and Miles now
  count the seven days the strip shows), the rest day's tip, and Random Workout and Traveling?. The mockup leaves them
  out; nothing else reaches Random Workout or Traveling?, so they stay until a ruling moves them.
- **Not in this build (each its own build, in this order, Mario 2026-11-08):** Can't run? (D249, which writes the week
  and needs its good, careful and bad rule measured first); the recorder screen as D272 draws it (R2 over R3) with Save
  behind the track test, the live bar and "Back to your run"; Bugs off the tab bar and the timer edge tab off This Week
  (the spec's section 8, outside this screen). The mockup's Hurt? sheet (swap the run for an easy 2 mi, make it a rest
  day, flag an injury) changes what a day prescribes and needs a coach ruling before it is built.
- **Does not change:** what any program prescribes (HALF_MANNY digest `147f083be4e04e34`); the stores (the week strip
  sets the legacy `currentWeek` as the chips did); the session sheet, the deck, the rest sheet and the injury sheet;
  the page Pages serves, whose This Week stays as it is (the iOS app is the product).

## D276 as built (v0.258.0, 2026-11-08)

- **Where:** the iOS app's Angular screens. `frontends/app/src/app/screens/week-view/` (`week-view-model.ts` the logic,
  `week-view.ts` the screen, `week-view.css` its styles, global in `angular.json` beside the deck's); Record run's host
  `screens/run-recorder/record-host.ts`; the grow out of a card, moved out of the deck unchanged into
  `screens/deck/grow-motion.ts` so the deck and the recorder open with the same numbers. The page Pages serves changes
  only by its version.
- **Mario saw it first:** the build itself, served on the Mac with HALF_MANNY loaded (weeks 1 to 10 done) and a simulated
  GPS plugin, clicked through in the browser pane at 375 px: "looks right!" (2026-11-08). D277 (swipe back) followed.
- **Decisions the build made (siting and form, recorded here):**
  1. The legacy `currentWeek` follows what the screen shows or opens: the title's own week, and the week before for a
     Sunday. A value the screen did not write (a boot, a program loaded, the wizard) moves the strip to the title holding
     today when it is today's week.
  2. A tap on a week title, or a scroll that settles, picks the week; each title keeps the day picked in it until the
     program changes. With no pick, the ruling's default (item 4).
  3. The day card's top carries a chevron that opens the day's session sheet (the hand log, review and edits); Reopen on
     a done row opens it too, where a closed day is undone (D179). Log the run (no GPS plugin) opens it as well.
  4. A day is done for the lift card when it is marked complete or partial; the run card is done once the run is logged
     for the sport it is credited to (D213) or the day is marked; a skipped day shows Skipped on both.
  5. The run card's words come from the engine's session: the name (the subtype's head; the race as Race Day, the
     shakeout as Shakeout Run), the meta (the kind, the dose or a speed session's work, the target pace), the coaching
     line (the note's first sentence without its label, then the ceiling sentence the detail names).
  6. On a program where lifting is the priority, a day with both puts the lift card first and the run second ("Then
     run"), as the session sheet orders it (`liftsFirst`).
  7. The race row reads `{N} days out` and `Race day Sun, Dec 6`, `1 day out` the day before, `Race day today` on the
     day and `Raced` after; tapping it opens the race date picker.
  8. The tiles count the seven days the strip shows, the week before's Sunday jog included.
  9. Record run's recorder sits beside the deck, outside This Week's screen, since the screen's shrink under an overlay
     holds anything fixed inside it. Ran without the phone? closes the recorder into the card, then opens the hand log.
  10. Mouse drags move the week strip in a browser, as fingers do on the phone (the dev server and the pane).
- **The e2e:** the journeys reach every shared sheet by each build's own path (`tests/e2e/flow.ts`: `tapDay`, `tapToday`,
  `weekBtn`), since the page keeps its own This Week.
- **Tests:** `tests/unit/this-week-hero.test.ts` (the titles, the live title and the Sunday column, the day words, the
  run card's words from the engine's text, the race row, Record run's grow), `tests/integration/this-week-hero.test.ts`
  (HALF_MANNY's strips and cards through the legacy helpers), `frontends/app/test/unit/week-view.test.ts` (the screen's
  assembly on stubs), `frontends/app/test/unit/run-recorder.test.ts` (Ran without the phone?). Each fails on v0.257.0
  but the phase label test, carried over unchanged to guard what does not change.

## D278 P-CARDIOSHEET: the run card carries its own workout, and the chevron goes (Mario, 2026-11-08)

- **Date:** 2026-11-08, Post-v0.258.0. **Ruled by:** Mario, on the mile nudge's mockup inside the new This Week: "the
  button for record the run should have the workout in it, since we got rid of the cardio cards, and we dont need the
  arrow button that pulls up the whole workout now that we split it ... we gotta probably fix it for all the cardio
  cards". His three picks the same hour, each asked with a recommendation: a cardio's button opens just that cardio
  ("Just that cardio"); the workout sits above the clock on the recorder ("Above the clock", against the recommendation
  of under it); the chevron goes and the whole day is reached from Reopen only ("Yes, drop it"). He tapped the build
  through (served on the Mac, his Saturday seeded, a stand-in GPS plugin): "Looks right". **Amends** D276 items 5 and 7
  and D276 as built, decision 3; D272 Amendment 2's recorder gains the workout. **Bump:** PATCH, v0.258.1 (Mario,
  2026-11-08). **Shipped:** v0.258.1 (2026-11-08).
- **Finding:** on v0.258.0 the run card's chevron and its Log the run both opened the whole session sheet (the lift
  sections, the run's cardio card, the log, the day's Done and Skip), and Record run opened the recorder with a clock,
  miles and pace and no workout. Once This Week split the day into a run card and a lift card, the run's workout (its
  steps, its paces, the coaching note: the session sheet's cardio card) was no longer on the screen you run with, only
  behind the whole day.
- **What changes (the iOS app's screens only):**
  1. **No chevron.** A card's top no longer opens the day.
  2. **Record run carries the workout.** The recorder draws the run's cardio card (the session sheet's own: the sport and
     session, the detail, the note) above the GPS line and the clock.
  3. **The cardio's own sheet.** Log the run, Log the ride, Log the swim, and the recorder's Ran without the phone? open the
     session sheet for that cardio alone: the day's when line and the cardio's name over its cardio card and its hand log
     (RPE, the wheels, Log, notes). No lift sections, no add button, no logged counter, no tags, and no Done and Skip on a
     day that also holds lift work.
  4. **Reopen splits.** A done run, ride or swim card reopens its own sheet, where the log is edited; a done lift card
     reopens the whole day, where a closed day is undone (D179).
- **Decisions the build made (siting and form):**
  1. A day that is only cardio keeps the day's Done and Skip on its cardio's sheet: with the chevron gone it is the one
     place left to skip or undo that day.
  2. The cardio sheet's over line and the recorder's are the day's when line (`Today · Saturday`), on a second run card
     too (it read `Then run` on the recorder before).
  3. The recorder's workout is the session sheet's CardioCard component, without the benchmark strip.
- **Does not change:** what any program prescribes (HALF_MANNY digest `147f083be4e04e34`); the stores; the deck; the lift
  card and its Start lift; the rest day; the session sheet opened any other way; the page Pages serves (its version only).
- **The strongest counter-argument, for Mario:** on a day with lift work, skipping the whole day, adding an exercise or
  writing the day's notes before training now has no door (the deck still swaps and skips each lift, and Reopen opens
  the whole day once a card is done). Mario: drop it.
- **Where (as built, v0.258.1):** the routes, the sheet's frame and the recorder's workout are
  `frontends/app/src/app/screens/day-detail/cardio-sheet-model.ts`; `day-detail/sheet-mode.ts` carries a card's ask to
  the next open of the session sheet (`day-detail.ts`); This Week taps through `cardRoute` (`week-view.ts`, the chevron
  and its style gone); the recorder takes `workout` (`run-recorder.ts`, `record-host.ts`). The page Pages serves changes
  only by its version (`tools/same-script.mjs`: the same 172,655 script tokens).
- **The e2e:** a card no longer opens a day's whole session sheet before it is done, so in the app the journeys pick the
  day by a tap and open its whole sheet through the legacy `openDayKey` the chevron called (`tests/e2e/flow.ts`,
  `openPicked`); the relaunch journey reopens the done lift card.
- **Tests:** `frontends/app/test/unit/cardio-sheet.test.ts` (the routes for each button and each Reopen, the sheet for one
  cardio alone and its foot, lift work by a section with a movement, the recorder's workout, and the three templates that
  draw them, read as text). Its seven model tests cannot load on v0.258.0 (`cardio-sheet-model.ts` is not there); its
  four template tests, run on v0.258.0's sources, each fail.

## D279 P-WEEKSNAP: the week strip lands on the week in view, with a long glide when the app opens (Mario, 2026-11-08)

- **Date:** 2026-11-08, Post-v0.259.0. **Ruled by:** Mario, on v0.258.1 from TestFlight (his screenshot at 21:05:
  `Week 1` and the edge of `Week 2` both dim, the cards on today): "when the Ios app loads it doesnt load on the current
  week or atleast it doesnt show it its like showing this weird in between thing, and im cool with adding the scrolly
  animation we had before on the weeks". Asked with a prototype of four presets on his phone
  (https://claude.ai/artifact/GnEY7dRhqMrMfvTYMsftoc, kept as `docs/design/week-scoot-prototype.html`), he picked
  **Long glide** (against the recommendation of As before, the page's old numbers). **Amends** D276 item 1 and D276 as
  built, decision 1. **Bump:** PATCH (Mario, 2026-11-08: "PATCH v0.258.2", which becomes v0.259.1 if the mile nudge
  lands first; v0.259.0 reached `origin/dev` before this was built, so it is **v0.259.1**). **Shipped:** v0.259.1 (2026-11-08).
- **The measure (2026-11-08, on v0.258.1, then v0.259.0's identical This Week):** HALF_MANNY seeded at today's clock
  (start Mon Aug 31, week 10 of 14, today Sunday Nov 8, so the title in view is `Week 11`), the iOS app's web bundle
  served to Safari on the iPhone 17 Pro simulator (iOS 26.5), with a probe on the strip's `scrollLeft`.
  - Mario's screen came back on the first, uncached load: the cards on Sunday Nov 8 to Saturday Nov 14 (`Week 11`), the
    strip at `Week 1`, no title in full ink. Five warm loads after it landed on `Week 11`, and so did a late web font
    forced 1.5 s after boot.
  - **With only the app's stylesheet held back 1.5 s it comes back on demand,** and the probe shows why: the first draw
    writes `scrollLeft = 2400` at 275 ms into a strip that is not yet a scroller (`overflow-x: visible`, `scrollWidth` =
    `clientWidth` = 386 px, the stylesheet not loaded), and WebKit clamps it to 0. The stylesheet lands at 1.5 s, the
    strip becomes a scroller (`scrollWidth` 3,750 px) still at 0, no scroll event fires, so nothing settles: `Week 11`
    stays the title in view, scrolled out of sight.
  - **Root cause:** `WeekView.render` places the strip with one write, in the same task as the first draw, and counts it
    placed whenever the strip has a width, never checking that the write took. WebKit runs the app's module scripts
    before its stylesheet has applied (Chrome holds them, which is why the browser pane and the e2e never showed it); on
    the phone a cold launch can lose the same race. Other readers of the placement: none. `toTitle`, `settle` and
    `dragUp` act on a strip the athlete is touching, by then a scroller.
- **What changes (the iOS app's This Week only):**
  1. **The strip is placed once it can scroll.** It is placed only when it is wider inside than its box (its stylesheet
     in), and counts as placed only when its scroll position is where it was sent; until then it tries again on each
     frame, for up to 10 seconds. A hidden screen still waits for the first draw it shows on.
  2. **The glide when the app opens.** Once per launch, on the first placement, the strip starts at `Week 1`, waits
     **300 ms**, then travels to the title in view in **1,200 ms**: accelerating from rest (ease in and out, cubic) to a
     peak **16 px** past the title in view (at most 5% of the distance, never past the strip's end) over the first 76% of
     the time, then easing back onto it. The title at the strip's left edge is lit as it passes, counting up, never past
     the title in view, which is lit at the end. The page's old scoot (V146, V147) had the same curve and split, with
     260 ms, 550 ms and 12 px. Nothing glides when the title in view is `Week 1`, or when the phone asks for reduced
     motion: the strip is placed at once.
  3. **A touch ends the glide.** A touch on the strip during the glide puts it on the title in view at once, and the
     swipe goes on from there. A scroll the glide makes never picks a week.
  4. **Every later placement is instant,** as today: a program loaded, the week set from outside.
- **Expected values (by hand, from the numbers above):** HALF_MANNY on Nov 8 on a 402 px strip: 15 titles, so
  `scrollWidth` 15 × 240 + 150 = 3,750, the end 3,750 − 402 = 3,348; the target (11 − 1) × 240 = 2,400; the peak
  2,400 + min(16, 120) = 2,416. Into the travel: 228 ms (p = 0.19) at 151 px, `Week 2` lit; 456 ms (p = 0.38) at
  1,208 px, `Week 6` lit; 912 ms (p = 0.76) at the peak 2,416, `Week 11` lit; 1,056 ms (p = 0.88) at 2,408; 1,200 ms
  at 2,400. `Race Day` in view: the target 14 × 240 = 3,360 is past the end, so 3,348, and the peak is the end (no
  overshoot). `Week 2` in view: target 240, peak 240 + min(16, 12) = 252.
- **Does not change:** what any program prescribes (HALF_MANNY digest `147f083be4e04e34`); the stores; which title is in
  view (D276 as built, decision 1); taps, swipes and the settle rule; the page Pages serves, whose This Week keeps its
  own scoot (its version only).

## D279 as built (v0.259.1, 2026-11-08)

- **Where:** the iOS app's Angular This Week. `frontends/app/src/app/screens/week-view/week-strip.ts` (the placer and the
  glide, framework free: the strip and the clock are passed in); `week-view.ts` places through it on a draw that has not
  placed the strip, lights the glide's title (`isOn`, the `lit` signal), ignores the glide's scrolls (`scrolled`) and
  stops it on a touch (`dragDown`); `week-view.css` drops the title's colour fade while it glides (`.tw-strip.gliding`).
  The page Pages serves changes only by its version.
- **Decisions the build made (siting and form):**
  1. The glide's title is lit by its own signal, and `aria-current` stays on the title in view throughout, so whatever
     reads the week in view reads `aria-current`, never the ink.
  2. A touch ends a glide only: a placement still waiting for the stylesheet keeps waiting.
  3. A glide that ends off its title (WebKit refusing the last write) falls back to the instant placement and its checks.
  4. The glide turns the strip's snapping off while it runs and back on at the end, as a mouse drag already did.
- **The e2e:** the journeys read the title in view by `aria-current` (`tests/e2e/flow.ts`, `openPicked` and `tapDay`),
  since during the launch's glide the lit title is the one passing.
- **Proof on WebKit (the iPhone 17 Pro simulator, iOS 26.5, Safari, HALF_MANNY seeded at Nov 8, the app's stylesheet held
  back 1.5 s):** v0.259.0 left the strip on `Week 1` with no title lit; this build writes nothing while the strip cannot
  scroll, starts at `Week 1` when the stylesheet lands (1,562 ms), travels from 1,881 ms to 3,079 ms (1,200 ms) and
  ends at 2,400 px on `Week 11`, still there at 4 s.
- **Tests:** `frontends/app/test/unit/week-strip.test.ts` (12: the curve's values and lit titles, the strip's end, ready,
  the placement after the stylesheet lands, a write that does not hold, the 10 second limit, the glide frame by frame,
  later placements, reduced motion and Week 1, a touch mid glide, a touch before the stylesheet, and the screen's wiring
  read as text). The file cannot load on v0.259.0: `week-strip.ts` is not there (`git cat-file -e` on it fails).
