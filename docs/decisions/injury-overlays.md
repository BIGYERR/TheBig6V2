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

## Hurt? and Traveling? in the Expo app: the sheet, the chips, I'm back and the check in (Post-v0.263.0, the migration's phase 3, row 5, the third of three sessions)

- **Date:** 2026-11-20. **Ruled by:** no new ruling. Every word, number and behaviour is today's, carried into the
  Expo app unchanged, so each keeps its ruling: an overlay stored on its program by its dates, the weeks derived
  (V96); travel as holding, and a full gym as an answer that stores nothing; the injury's two tiers and what each
  region's plan does (D43, D44, D52, D54, D154, D193, D194, D197, and D245 above for the calf); I'm back as one
  return week, and a second week, cardio only, where the injury took running away (V142 D1); the pop-up that
  promises only what the engine enforces, the pace clock spoken for the pace goal alone (V142 D2b); the check in
  two weeks on, on This Week until it is answered; one date grammar for every surface that names a span, `to` the
  last day covered (V175 D29); the beta's own store (D289, `docs/decisions/data-backup.md`). **The cut** was put to
  Mario after the measure (`tests/measure/native-injury-travel_today.md`) as one session for all of row 5's third
  part (this sheet, the chips, This Week's two dates in `docs/decisions/this-week.md`, the copy button in
  `docs/decisions/active-program.md`, and the two native packages), with the case against said (half again the rest
  sheet's session, and two packages' build risk; the other way was two sessions); he took it ("Concur, build it",
  2026-11-20). **Bump:** none, the page and core do not move (a Post-v0.263.0 pass, standing ruling 1).
  **Shipped:** Post-v0.263.0, no build of today's app; the beta's next build carries it.
- **Finding (the measure).** Today's iOS app opens each sheet by one door, both on This Week: the Hurt? pill beside
  the week titles, which reads the region in red while an injury is live, and Traveling? at the foot. The sheet has
  an Angular model (`change-sheet-model.ts`); the chips under the two buttons have none: the page writes them as
  markup (`overlays.ts` `renderOverlayChip`). Every write is `ia_programs` alone. A choice on the sheet writes
  nothing; Apply change, a chip's ✕ and I'm back store the list and rebuild the program; the check in's Same, More
  time and Worse store when it was last asked and rebuild nothing; a refusal says why and writes nothing.
- **What is built** (`frontends/native/src/change-sheet/`): `change-sheet-model.ts`, today's file, byte for byte;
  `overlay-readers.ts`, written from the page function for function (the date words and the span grammar, the
  chips and the check in as data, the draft kept for the app's life as the page keeps `_ovDraft`, what a From
  carries); `overlay-writes.ts` (Traveling?'s and Hurt?'s Apply change, the ✕, I'm back with its pop-up, the check
  in's three answers and the two buttons of Better's pop-up); `ChangeSheet.tsx`, the sheet, in the frame the goal
  sheet uses; `ChangeChips.tsx`, the chips, drawn by This Week at each draw. A date box opens the app's own
  calendar (`frontends/native/src/date-box/`, below).
- **The date box.** Today's app asks WebKit for a date: a calendar with Reset and a check, a change at each day
  picked, a blank value after Reset. React Native has no such field, so the beta draws its own over the iOS calendar
  (`@react-native-community/datetimepicker` 9.2.1, the version Expo SDK 58 names): a day picked is written at once
  and the box stays until the check or a tap outside; Reset writes a blank, the box stays and its calendar goes back
  to today; every day is offered. What it hands back is what WebKit's field hands the page (`date-box.ts`), so every
  kind stays reachable: From and Through reading Set date, the trip that runs onward, Pick both dates, a Through
  before From. Its look follows WebKit's box and is judged on his phone.
- **Carried as today's, not ruled and not fixed (found by the measure and by the walks):**
  - Hurt? applied while an injury is live stores a second injury beside the first: two chips, and the pill names
    the first.
  - The week after a return week is stored as an injury with an end, so its chip offers I'm back, Hurt? opens on
    its region, and I'm back on it leaves another return week.
  - A change that has ended stays stored; nothing prunes the list.
  - After I'm back the pace clock counts only what is still stored, which is the return week: an injury of any
    length reads "about 1 more week" on a pace goal. Six weeks injured and one day injured say the same.
  - Changes stored in one launch of the page share an id only where its clock is pinned (the tests); on a phone two
    taps are milliseconds apart.
- **Proof.** After every tap the draft, every byte of the sheet's markup while it is open (the Expo app's view
  printed as the page's markup), every byte of the chips, each toast, each pop-up whole, whether the sheet closed,
  the program in hand whole, This Week under it and every `ia_` key equal today's page: on The Half Manny, a
  program with a start date and a phone with two programs stored in the 60-second check
  (`tests/integration/native-change-sheet.test.ts`, 9 tests)
  and on the ten seeded programs through the standard history, with a dated test goal, a pace goal with an event
  and no date, and a lifter beside them
  (`tests/sweeps/native-change-sheet.test.ts`, 14 tests). Each kind the screens can draw, say or write has a
  floor, read off the builders; the kinds no seeded program draws by itself are made by a walk of their own (the
  check in at fourteen days, asked three times; Better answered each way; a second I'm back on the week after; a
  second injury; a trip of every span; the changes no tap stores: Less time, Suspended, a kind and a gear with no
  name, a trip with no end, an injury in a region with no name; a program with no start date). Each rule by a hand
  table: `tests/unit/native-change-sheet.test.ts` (64 tests). A break per rule:
  `tests/measure/native-change-sheet_breaks.md` (411 breaks, every one red: 401 on the fast files and 10 on the sweep). The whole of `tests/unit` and `tests/integration`:
  118 files, 2,522 passed and 2 skipped. None of the three new files loads on the commit before (`git cat-file -e` fails on
  `frontends/native/src/change-sheet/overlay-readers.ts` there), so each fails there by construction.
- **Not reachable from the screen, held by a hand table alone:** That date didn't resolve (a race date the calendar
  hands over always reads); a region the app has no name for; the guards behind a button the sheet does not draw.
- **The look, measured beside today's own.** Today's installed app on the simulator holds no injury and no trip,
  so today's sheets and chips were drawn by WebKit itself: the Expo app's views printed as the page's markup (the
  strings the walks hold equal to the page's, byte for byte), inside the page's frame and under today's
  stylesheets, opened in the simulator's Safari at the phone's width. Hurt? top and foot, Traveling?, and the chips
  with the check in: every text band of the final build within a point of today's (read from the pixels of both
  screenshots). Three gaps showed first and are fixed: a tier's second line stood 1.7 short (WebKit lays a card's
  line at 16), the date box's value 1.0 high, and the effect's lines drifted to 1.5 low by the third. The check in
  is drawn as any chip: `week-view.css` gives `.reassess-card` a red edge and `.change-chip`, later in the sheet,
  takes it back, as WebKit's own draw showed. A test holds each measured value
  (`tests/unit/native-change-sheet.test.ts`, the look).
- **Today's date field, tried in the same Safari** on a field set as the Angular screens set theirs (its value as a
  property, an earliest day on it): a day picked is written at once and the box stays; Reset writes a blank and the
  box stays, its calendar back on today; the earliest day is not enforced, a day before it is picked and written.
  The beta's box does each of the three, so a Through before From is still answered by the page's own refusal.
- **Seen on the simulator** (iPhone 17 Pro, iOS 26.5; `npm run sim-ios` with the two packages' pods, then
  `sim-ios:fast` on the final code). On a copy of Mario's backup: Traveling? applied (the toast, the day built under
  travel, the chip); Hurt? applied (the pill in red, the injury week, the chip with I'm back); the race date moved
  in the calendar (written at the pick with its toast, the box staying; Reset back on today with the date kept; the
  check closing it; the title back on the week holding today); I'm back (Two weeks to full send, the return week's
  chip and the week after's); a chip's ✕; and the copy button (the toast, and 10 lines on the simulator's
  clipboard). On a test phone's keys, since the copy of his backup holds no injury two weeks old: the check in
  under its chip, Better, the pop-up's two buttons, More time and its toast. The store was put back after:
  `278ba57f3f6a382b`, the hash the session began on. The new build's first launch had raised the day after reminder
  and written its marks (3 of the 36 keys differed, counted, never read), so the file put back is the copy made
  before any build. **Not yet seen:** Mario's phone.

## On Mario's phone, IA Next build 126 (2026-11-20)

- Put to him: Hurt? on a region and a tier, its chip, I'm back and its pop-up, the return week's chips and their ✕;
  Traveling? with its dates in the calendar, and its chip. **His report:** "All good" (no screenshot). Nothing
  differed and no motion was named, so nothing was fixed from it. The check in was not put to him: it is drawn
  only on an injury 14 days old, and it stays not yet seen on his phone.

## The date box's Reset goes back to the day it opened on (Post-v0.263.0, the wizard's session)

- Seen again in the simulator's Safari with the wizard's start date (`docs/decisions/angular-screens.md`, the wizard
  in the Expo app): WebKit's Reset blanks the field and its calendar shows the day the box opened on, which is today
  only for a blank field. `DateBox.tsx` keeps that day (`opened`) and Reset sets the calendar to it. What Reset
  writes is unchanged: a blank. `tests/unit/native-change-sheet.test.ts` holds the line, and the three breaks of
  `tests/measure/native-change-sheet_breaks.mjs` that name it are pointed at it.

## The date box: a field drawn with its value as an attribute, and a pressed look (Post-v0.263.0, the cardio goals' session)

- **Seen in the simulator's Safari on 2026-11-26** on a field set as the wizard sets its race date (its value an
  attribute, `min` today, read on `input`): a day picked is handed on at once and the calendar stays; `min` is not
  enforced, a day before today is picked and handed on; **Reset does not blank this field**: it goes back to the
  day it was drawn with, hands that day to its handler, and the calendar goes back to that day and stays. A field
  whose value is a property (the start date, the change sheet's dates, This Week's two) was tried again the same
  day: Reset fires its change with a blank and the calendar keeps a day circled, as recorded above.
- **Built:** a `DateAsk` may name `reset`, the day the field was drawn with; `resetWrites` and `resetDay`
  (`date-box.ts`) hand that day on and put the calendar on it, and with none Reset writes a blank as before. The
  wizard's race date is the one ask that names it.
- **Mario's phone on IA Next 127 (2026-11-26): "the reset button doesnt click".** On a field already on today, Reset
  writes its blank and nothing on the screen moves, on today's app as on the beta. Reset and the check now dim
  under the finger (`PRESSED_DIM`), as WebKit's own buttons do. What Reset writes is unchanged. Still today's, and
  not ruled: Reset leaves a day chosen in the calendar and the field blank (the handoff's section 12).
- `tests/unit/native-change-sheet.test.ts` holds each; the three Reset breaks of
  `tests/measure/native-change-sheet_breaks.mjs` are pointed at the line as it stands, and the wizard's list holds
  five more (`tests/measure/native-wizard_breaks.mjs`).
