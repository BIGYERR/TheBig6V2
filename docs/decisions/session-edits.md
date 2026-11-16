# Session edits: decisions

What the athlete can change on a session before training it: swap a movement, skip one, add one, and undo each. The
controls are drawn by `buildExItem` and `buildSectionsHTML` (`frontends/app/src/legacy/src/js/set-logging.ts`,
`week-view-sections.ts`) on the single-file page and by `SessionSections` (`frontends/app/src/app/screens/day-detail/`)
in the iOS app; which card carries which control is `exControlFlags`, one source for both. The handlers are in
`swap-sheet.ts` and the stored edits in `swaps-edits.ts`. The V162 control matrix (rulings D0 to D6, in the handoff) is
the history before this file. Tests: `tests/integration/session-edits.test.ts`. Measure:
`tests/measure/workout-skip_controls.ts` and its `.out.txt`.

## D248: P-MAINSKIP, the main lift takes the minus (v0.246.0; amends V162 D0)

- **Date:** reported and ruled 2026-10-25. **Ruled by:** Mario ("yes, minus on main"), on the main session's measure
  (coach hat). **Bump:** MINOR (Mario). **Shipped:** v0.246.0.
- **The report (Mario):** "we cant cancel swap out main lifts or cardio events for our programs, i think we should be
  able to at least skip it in workout".
- **The finding (measure, 865 programs: HALF_MANNY and the 864-config lattice FULL):** 36,276 main slots (item 0 of a
  `/^main/i` section, outside a round), 0 skippable, by V162 D0, whose guarantee was that swap is the top lift's exit.
  44 of them have an empty swap sheet (lowback/protect on home_full and crossfit, vertical pull mains: Chinups 16,
  Assisted pullups 20, Neutral-grip chinups 8, every vertical pull already on the card), so neither control works, and
  the empty sheet's own words ("drop it with the minus and move on") point at a minus that is not there. The only exit
  left was skipping the whole day.
- **What changes:** the main slot carries the minus like every other exercise card. A skipped main lift is the same
  struck-through stub with "Put it back", stored with the day's edits, folded into the snapshot, and its toast is every
  skip's ("<Name> is off today. Tap to put it back."). Notes still carry no control.
- **What deliberately does not change:** no program moves (HALF_MANNY's digest stays). Swap stays on the main slot, and
  the sheet still tags it MAIN LIFT. A skipped main lift logs nothing, so the ledger's slot reading (`_slotOfEntry`) and
  next week's prescription are untouched. The rounds' rules (V162 R2, D1) are untouched.
- **Tests:** a main slot is skippable by `exControlFlags`; HALF_MANNY's main lift card carries the minus on the session
  sheet and skips to the stub, stored for the day; a lowback/protect vertical pull main with an empty swap sheet carries
  the minus.

## D249: P-CARDIOSKIP, the cardio card (ruled 2026-11-04, ships with the swipe deck)

- **Date:** measured 2026-10-25, not ruled. **Mario's line:** open to a skip on cardio cards, and asked for ideas: moving
  a session to another day, with a warning when the move conflicts with the rest of the program.
- **The finding (measure):** 48,440 cardio cards on the 865 programs, none with a control; 47,790 on a day that also
  lifts, 650 cardio only. Today the only way to drop the run is to skip the whole day, or to mark it Done without it.
- **Ruled 2026-11-04 (Mario, "i concur with all", the main session's recommendation):** the run card gets Can't run?,
  as the swipe deck canvas has it (P-DECK, `docs/decisions/swipe-deck.md`, call 12): move the run to a later day, each
  day marked good, careful or bad for it (an easy run beside a hard day, a hard run on the eve of the long run), or skip
  it. It ships with the deck's build, after the lattice measure and coach's read-ahead ruling that file names.
  **Shipped:** not yet.

## D250: P-WILDEDIT, the Wildcard's swap and minus act on the Wildcard (v0.246.0)

- **Date:** reported and ruled 2026-10-25. **Ruled by:** Mario ("act on the Wildcard"), on the main session's measure.
  **Bump:** MINOR with D248 (Mario). **Shipped:** v0.246.0.
- **The report (Mario):** "the wildcard workouts the swap button doesnt work".
- **The finding (measure):** a Wildcard's cards are drawn with the session sheet's controls, which address the program
  day the session sheet last pointed at (`activeProg.weeks[currentWeek][currentDayKey]`), by section and item index for
  swap and the round minus, and by name for the minus. On HALF_MANNY, week 1, with the sheet last on each weekday in
  turn, 4,389 swap taps over the 143 Wildcards: 0 open the card tapped; 2,477 toast "Nothing to swap here"; 1,875 open
  the sheet for a program exercise and 37 for a program exercise of the same name, and all 1,912 open under the
  Wildcard (`.overlay` z-index 200 under `.rand-overlay` 300), so the tap looks dead, and a pick there would swap the
  program day's card. Of 3,908 minus taps, 211 strike a same-named exercise off the program day without a word; the
  rest do nothing. The page and the iOS app share it.
- **What changes:**
  - Each draw is copied into the Wildcard's own working day (`_wildDraw`); its cards are drawn from it and their
    controls address it (`'wild'`), never a program day.
  - Swap on a Wildcard card opens the sheet for that card, above the Wildcard. The candidates are the program's kit and
    injury plan against the Wildcard's own cards. A pick changes the Wildcard's card, with the session sheet's toast and
    the SWAPPED IN chip, whose "put it back" restores it.
  - The minus on a Wildcard card, and the round minus, strike it on the Wildcard, with "Put it back".
  - Nothing on the Wildcard writes a swap, a skip, a swap count, a swap nudge or a snapshot to any program day.
  - The edits last for the draw: a reroll, a filter change, or closing the Wildcard starts clean. The pools themselves
    are never changed.
- **What deliberately does not change:** the draw, the pools, Complete (`ia_wild_`), and logging sets on a Wildcard
  card. Measured beside this ruling: all 143 Wildcards carry set logging, which writes to the program day the session
  sheet last pointed at; that is its own ruling, after this build.
- **Tests:** on the Wildcard, a swap opens the sheet for the card tapped (HALF_MANNY week 1, sheet last on Monday, "Max
  Effort Bench", Barbell bench press); a pick changes the Wildcard's card and leaves the program day and the stored
  swaps as they were; the chip's put it back restores the Wildcard's card; the minus and the round minus strike the
  Wildcard's card and leave the program day's same-named card on; closing clears the draw and the pools are unchanged;
  the swap sheet stacks above the Wildcard.

## D291: P-OWNITEMS, a built program hands every day items of its own (ruled 2026-11-15)

- **Date:** 2026-11-15. **Who ruled:** Mario, on the finding put to him after the pop-ups' proof met it ("what shared
  items fix", then "yeah lets fix that !"). The session recommended it ahead of the pager, as its own release.
  **Bump:** PATCH, his pick of three ("PATCH, 0.262.4 (Recommended)"). **Release:** v0.262.4 (2026-11-15).
- **The finding** (`tests/measure/day-edits_shared-items.md`, `tests/measure/day-edits_shared-objects.md`):
  - *The cause.* The core block hands out its table's own objects. `getDynamicCoreBlock`
    (`core/src/engine/core-legs.ts`) draws two members of a pillar of `CORE_PILLARS` (`prehab.ts`) and returns them
    as they stand in the table (`items: items.slice(0,2)`). `injectDynamicCore` pushes that block onto the day. The
    table has one object per member, so every day that draws Side plank holds the same Side plank, and so does every
    program built in the process. The protect tier's own trunk draw (`engine-c.ts`) already copies what it draws.
  - *The reach.* Over the 864-config lattice, 1,010,495 objects and arrays walked in two builds of each: 75 programs
    hold at least one of the engine's own objects, 739 in all, every one an item of a section and nothing else (no
    section, no day, no run). Over the ten seeded programs, 95, with 37 objects standing in more than one place of
    one build; THE HALF MANNY holds 10 in 26 places. The names are the core pillars' members and no other: Suitcase
    carry, Side plank, Plank shoulder taps, Russian twist (heels down), Farmer carry, Windshield wipers, Side plank
    thread-the-needle, Pallof press, Bird dogs, Band woodchopper (door anchor), Dumbbell renegade rows, Medicine
    ball rotary toss, Cable woodchoppers, and on other tiers the dynamic bracing and anti-extension members. A
    program whose later passes rebuild its items (an injury plan's filter, the bodyweight tier's substitutions)
    holds none, which is why 789 of the lattice's programs are clean.
  - *What writes to an item in place.* A skip and its undo (`_skipped`: the page's `skipExercise`, the beta's
    `skipMove`, and core's `applyDayEdits` at every launch while the edit is kept). A swap and its undo (`name`,
    `detail`, `_preHold`: the page's `applySwapChoice` and `undoSwap`, the beta's `swapMove` and `undoSwap`, core's
    `applySessionSwaps` at a launch). A preference from the nudge (`name`, `detail`: `applySwapPrefs` inside
    `buildProgram`, which then writes to the table itself).
  - *What the athlete sees today.* THE HALF MANNY on today's page: Suitcase carry skipped on week 1 Tuesday reads
    skipped on week 6 Friday and week 7 Tuesday, in the same launch and after a fresh one, for as long as the edit
    is kept. A swap of such a move shows on its other days until the next launch. A preference that names one
    renames the table's member for the rest of the launch: a later build draws by the new name, and a fresh launch
    then holds another program than the one the nudge left in hand (seen once in 40 accepted nudges of the walks).
- **What changes:** `getDynamicCoreBlock` hands back a copy of each member it draws. Every item of a built program is
  then an object of its own: none stands in two places of a program, and none is the engine's.
- **What deliberately does not change:** what any program prescribes on the lattice. A copy carries the same name and
  dose, so every digest of `tests/snapshots/program-output-lattice.json` and HALF_MANNY's stays as it is; the
  release is proved by those files not moving. The tables, the draw, the rotation and the same-card lens are not
  touched. No stored key's format changes, and nothing is migrated.
- **What moves, and is ruled to move:**
  1. *In hand.* A skip, a swap or their undo on a core, trunk or carry move stays on its day.
  2. *Golden records of stored state* whose history skips or swaps one of these moves: the grid a launch hands back
     loses the mark the edit left on the move's other days. Each record that moves is regenerated and its change
     classified as exactly that, in the release's commit.
  3. *A program whose config holds a preference for one of these moves.* Its later weeks are drawn from the table as
     written, then the trade is made, where today the table was renamed part way through the build. Counted before
     the build, on a copy with the fix made.
- **Not ruled here, found beside it:** on the bodyweight tier a preference does not reach a move that a later
  substitution puts on the card (Bird dogs at 3×20 alternating on week 8 Thursday of the seeded bodyweight program
  kept its name under a Bird dogs preference). Carried in the handoff's section 12.
- **Expected values:** two builds of one config share no object, and no object of a build is reached by two paths:
  0 of 1,010,495 on the lattice, 0 on the ten programs (today 739 and 866 on the lattice, 95 and 56 on the ten).
  THE HALF MANNY, Suitcase carry skipped on week 1 Tuesday: skipped there, and on week 6 Friday and week 7 Tuesday
  not, in the same launch and after a fresh one. The lattice's 864 digests identical.
- **Then, in the walks:** the three places the pop-ups' proof gave way to this (`docs/decisions/swipe-deck.md`) are
  taken back: the program after Make the change is held equal to the page the tap was made on, a nudge on a core
  move is answered both ways, and one walk runs on the grid as the app holds it.

## D291 as built (v0.262.4, 2026-11-15)

- **The change:** one line of `core/src/engine/core-legs.ts`: `getDynamicCoreBlock` returns
  `items.slice(0,2).map(it=>({...it}))`, after its dedup, which compares the table's objects. On the page: that line,
  four blank lines where its comment stood, and the version.
- **What moved, against the ruling's three:**
  1. *In hand:* as ruled. Suitcase carry skipped on week 1 Tuesday of THE HALF MANNY is skipped there and not on
     week 6 Friday or week 7 Tuesday, in the launch it was made in and after a fresh one; swapped, it keeps its name
     on the other two.
  2. *Golden records of stored state:* none moved. No history of the records skips or swaps one of these moves on a
     day whose mark reached a recorded grid. `tests/snapshots/` has no diff.
  3. *A preference for one of these moves* (`tests/measure/day-edits_core-preference.md`, each config on a fresh
     page of 0.262.3 and of this release): 162 preferences tried over HALF_MANNY and the ten programs; 149 build the
     same program on both, 13 differ on one or two days. What a preference is ruled to give is the plain program
     with the trade made wherever the move stands: 148 of 162 before, 161 of 162 now. The 13 were the table renamed
     part way through a build: Windshield wipers at Suitcase carry's 3×40 yd each on week 14 Wednesday of the
     marathon program, a second member drawn into week 2 Tuesday's block of THE HALF MANNY that the plain program
     does not hold. The one left is the bodyweight tier's later substitution (not ruled, above).
- **Does not change:** all 864 digests of the lattice and HALF_MANNY's; with no preference all eleven programs are
  the same on both pages.
- **Tests:** `tests/integration/program-shape.test.ts` (D291: Suitcase carry on three days as three objects, a mark
  on one alone, the next build clean; no object shared in HALF_MANNY and each of the ten programs),
  `tests/sweeps/program-shape.test.ts` (the 864 lattice programs: 1,010,495 objects, none shared),
  `tests/integration/session-edits.test.ts` (the skip and the swap on today's page, in the launch and after a fresh
  one), with `tests/support/shared-objects.ts`. On the 0.262.3 page (`IA_APP`): 13 of the 15 fail; the two that
  pass are the two programs that held none (said in the file). The walks: `tests/support/native-deck-swap.ts`
  `both` hands the launch's own grid, never a copy, the page the tap was made on is the reference after Make the
  change again, and a nudge on a core move is answered both ways (87 due over the ten programs: 44 Make the change,
  34 of them moving a day, 43 Leave the plan alone). Run on the commit before (`tools/tree-at.mjs`), that walk is
  red at the first launch after a swap.
- **Proof:** the whole suite and every sweep pass (143 files); `tests/snapshots/` untouched; the page's diff is the
  three hunks above.
