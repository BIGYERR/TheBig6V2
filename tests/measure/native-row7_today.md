# What is left of row 7, on today's page (measure, before the Expo app draws it)

Made by `tests/measure/native-row7_today.ts` on today's page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each through the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed.

## A. Random Workout: what there is to draw

The pools are the page's own table (`random-wildcard.ts` `RAND_POOLS`), not the engine's and not core's. My Goal draws from the pool named for the program's goal, or from `balanced` when the goal has none. See All draws from every pool laid end to end.

| Pool | Workouts | With a cardio block | With a note | Sections | Cards |
|---|---|---|---|---|---|
| strength | 30 | 0 | 0 | 52 | 109 |
| hypertrophy | 30 | 0 | 0 | 64 | 149 |
| fatloss | 29 | 2 | 1 | 41 | 138 |
| athletic | 30 | 6 | 0 | 45 | 135 |
| balanced | 30 | 5 | 1 | 55 | 137 |

See All draws from 149 workouts. Titles used by more than one workout: 6. Workouts with no section: 0.

A section's fields, by how many sections carry that set:

| Fields | Count |
|---|---|
| items, label | 136 |
| items, label, rounds, superset | 9 |
| items, label, superset | 112 |

A card's fields:

| Fields | Count |
|---|---|
| detail, name | 668 |

The cards are the session sheet's own (`buildSectionsHTML` with the source `wild`; the Angular screen draws them with the session sheet's `SessionSections`). Drawn for each of the 149 workouts on one phone (0 threw), the handlers their markup carries:

| Handler | Count |
|---|---|
| autoSaveSets | 3850 |
| cascadeSetWeights | 473 |
| fillAllSetWeights | 132 |
| onSetWeight | 1451 |
| openSwapSheet | 654 |
| reuseWeight | 139 |
| saveExWeight | 666 |
| setDelta | 1926 |
| skipExercise | 668 |
| skipSuperset | 121 |
| stepSet | 3852 |
| toggleSets | 645 |

Classes drawn at least once: 48. The ones that are a control or a field:

| Class | Count |
|---|---|
| ex-log | 666 |
| ex-logbtn | 666 |
| ex-skipbtn | 668 |
| ex-swapbtn | 654 |
| ex-winput | 473 |
| exset-btn | 3852 |
| ss-minus | 121 |

## B. The door on This Week, and its counter

One door: the Random Workout button at This Week's foot, beside Traveling? (`week-view.ts`, `openRandom`). It carries a counter, the goal's own Wildcards done out of how many the goal's pool holds (`updateRandCounter`). The beta draws the button with no counter and no press.

The ten programs' goals and the pool My Goal draws from:

| Goal: pool | Count |
|---|---|
| athletic: its own | 2 |
| balanced: its own | 3 |
| endurance: balanced, no pool of its own | 2 |
| fatloss: its own | 1 |
| hypertrophy: its own | 1 |
| strength: its own | 1 |

The counter at each stretch (the standard history completes one Wildcard in the second week, by a title no pool holds, so it is stored and not counted):

| Program | 0 generated | 1 first week | 2 second week | 3 third week | 4 after two weeks away |
|---|---|---|---|---|---|
| 1 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 2 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 3 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 4 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 5 | 0/29 | 0/29 | 0/29 (1 stored) | 0/29 (1 stored) | 0/29 (1 stored) |
| 6 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 7 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 8 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 9 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |
| 10 | 0/30 | 0/30 | 0/30 (1 stored) | 0/30 (1 stored) | 0/30 (1 stored) |

## C. What each tap reads and writes

Ten phones, each on its third week. Every tap, and the stored keys it changed (the count is how many of the ten):

| Tap | Stored keys changed | Phones |
|---|---|---|
| Random Workout (open) | nothing | 10 |
| See All | nothing | 10 |
| My Goal | nothing | 10 |
| Swap mark on a card | nothing | 10 |
| A move picked in the swap sheet | nothing | 10 |
| Put it back (a swap) | nothing | 10 |
| Minus on a card | nothing | 10 |
| Put it back (a card) | nothing | 10 |
| Minus on a round | nothing | 10 |
| Put it back (a round) | nothing | 10 |
| Log on a card (two sets typed) | `ia_exw_<id>` changed | 10 |
| The entry a Wildcard card's Log stores | fields day, setsDone, setsReps, setsW, ts, week, weight; the week being viewed yes; its day blank (the day last opened, `currentDayKey`, and none was opened this launch); today's weekday (`currentRandDayKey`, which the draw sets and nothing reads) no | 10 |
| Reset, the first tap | nothing | 10 |
| Complete | `ia_wild_<id>` changed | 10 |
| After Complete: the sheet's working day | cleared | 10 |
| After Complete: This Week's tag for today | drawn | 10 |
| The same workout drawn again | Done Before, no Complete button | 10 |
| Reset, tapped twice | `ia_wild_<id>` changed | 10 |
| Back | nothing | 10 |
| A day opened first, then a set changed on a Wildcard card | `ia_logs_<id>` changed | 10 |
| Where that set's draft is kept | in the log of the day last opened | 10 |
| A day opened first, then Log on that card | `ia_exw_<id>` changed, `ia_logs_<id>` changed | 10 |
| The day that entry carries | the day last opened | 10 |

Draws made by tapping a filter 200 times in a row: 0 repeated the workout before it (the draw is made again while it lands on the last one).
Swaps made on a Wildcard card: 10. Cards taken off: 10. Rounds taken off: 10. None is stored: they live on the sheet's own copy of the draw, which a new draw, a filter or Back throws away.

The toasts those taps spoke:

| Tap: toast | Count |
|---|---|
| A move picked in the swap sheet: Barbell box squat in, back squat out. Same job, same numbers. | 2 |
| A move picked in the swap sheet: Close-grip bench press in, barbell bench press out. Same job, same numbers. | 5 |
| A move picked in the swap sheet: Close-grip pushups in, barbell bench press out. No load to add here, so take the sets to the same effort. | 1 |
| A move picked in the swap sheet: Double Kettlebell deadlift in, kettlebell swing out. Same job, same numbers. | 1 |
| A move picked in the swap sheet: Dumbbell Arnold press in, dumbbell incline press out. Same job, same numbers. | 1 |
| Complete: <title> logged ✓ | 10 |
| Minus on a card: Back squat is off today. Tap to put it back. | 2 |
| Minus on a card: Barbell bench press is off today. Tap to put it back. | 6 |
| Minus on a card: Dumbbell incline press is off today. Tap to put it back. | 1 |
| Minus on a card: Kettlebell swing is off today. Tap to put it back. | 1 |
| Minus on a round: Round is off today. Tap to put it back. | 10 |
| Put it back (a card): Back squat is back on the card. | 2 |
| Put it back (a card): Barbell bench press is back on the card. | 6 |
| Put it back (a card): Dumbbell incline press is back on the card. | 1 |
| Put it back (a card): Kettlebell swing is back on the card. | 1 |
| Put it back (a round): Round is back on the card. | 10 |
| Put it back (a swap): Back squat is back on the card. | 2 |
| Put it back (a swap): Barbell bench press is back on the card. | 6 |
| Put it back (a swap): Dumbbell incline press is back on the card. | 1 |
| Put it back (a swap): Kettlebell swing is back on the card. | 1 |
| Reset, tapped twice: Wildcard counter reset ✓ | 10 |

The pop-up Complete raises 380 ms on (its own dispatcher, never the season banner):

| Tier: kicker / line / sub line | Count |
|---|---|
| workout: Wildcard done / You showed up. That is the whole game. / Streak holds. | 3 |
| workout: Wildcard done / You showed up. That is the whole game. / Streak: N. | 7 |

## D. Complete, by the day it lands on

The record is `ia_wild_<id>` alone: the title, the time, and the program's week and day read from today's date (never the week being viewed). Off the program's calendar it stores no day.

Ten phones, Complete on each of the seven days from the third week's launch, and once 400 days on:

| The day → the pop-up's sub line | Count |
|---|---|
| a rest day → Streak holds. | 18 |
| a training day → Streak: N. | 52 |
| after the program's last week (no day stored) → Streak holds. | 10 |

## E. The Bugs tab: the Look row and the backup

The Look row (D261): three buttons, one stored key, read at launch and at each tap. Ten phones:

| Tap → stored keys changed | Count |
|---|---|
| Auto → `ia_theme` removed | 10 |
| Day → `ia_theme` changed | 10 |
| Night → `ia_theme` new | 10 |
| Night, then a backup → `ia_theme` new | 10 |

The backup (D264). Ten phones on their third week, 14 to 17 keys each (160 in all):

| What | Count |
|---|---|
| A newer format: This backup is from a newer app. Update the app first. | 10 |
| File name: asylum-backup-<date>.json | 10 |
| Its message: Backup from <day>. N program. Loading it replaces everything on this phone. | 10 |
| Load it on an empty phone → every key equal to the file | 10 |
| Load it over another program's phone → every key equal to the file, none of the other phone's left | 10 |
| Not a backup: That file is not an Asylum backup. | 10 |
| Save a backup in the harness (no share sheet, no plugin) → failed, toast: Backup failed. Try again. | 10 |
| The file holds every ia_ key the phone holds: yes | 10 |
| The file: data, format, kind, made, version | 10 |
| The look is in the file (ia_theme): yes | 10 |

## F. The pop-ups and the toasts: today's callers

Calls that raise a pop-up (`popFire`), by the page's file:

| File | Count |
|---|---|
| overlays.ts | 4 |
| popups-streaks-reminders.ts | 4 |
| random-wildcard.ts | 1 |

Calls that speak a toast (`showToast`), by the page's file (the Angular screens speak through the same function):

| File | Count |
|---|---|
| bug-report-init.ts | 1 |
| data-backup.ts | 4 |
| day-detail.ts | 3 |
| day-status.ts | 7 |
| overlays.ts | 13 |
| popups-streaks-reminders.ts | 1 |
| program-manage.ts | 7 |
| programs.ts | 8 |
| random-wildcard.ts | 2 |
| rest-day-shell.ts | 8 |
| swap-sheet.ts | 6 |
| week-view-sections.ts | 1 |
| wizard-generate.ts | 2 |
| wizard.ts | 2 |

## G. What the beta holds of row 7, and what is left

Read from the sources (`frontends/native/src`, `frontends/app/src/app/screens`), not counted by this script.

Held already:

- The swap sheet and the add sheet on a program's day (phase 3, sessions 3 and 7), and the RPE card.
- The pop-up card and eight of the nine callers above: the four of `popups-streaks-reminders.ts` and the four of `overlays.ts`.
- The toast (`App.tsx`), which every screen built so far speaks through.
- The Engine row (D286) and a backup loaded and checked key by key (D287), on a Bugs tab written in the beta's own words.

Left:

1. **Random Workout.** The counter on its door; the sheet (two filters, the two tap reset, the badge and title, the cardio block, the note); its cards, which are the session sheet's with the source `wild` (swap, minus, a round's minus, put it back, and the log); Complete, the ninth pop-up caller, and This Week after it.
2. **The Bugs tab as today draws it.** The bug report (the text, Send to Web3Forms, five status lines, one toast); the Look row (`ia_theme`; the beta follows the phone alone); Your data (Save a backup, which the beta has none of; Load a backup, which today asks about before it replaces anything and the beta does at once); the build label. The Run recorder row is phase 4's.

Not in row 7, and not proposed: the update banner (`update-check.ts` fetches the page and compares its version; the beta's updates come through TestFlight).

Found, today's own, not ruled:

- A Log on a Wildcard card writes the lift history (`ia_exw_<id>`) under the week being viewed and the day last opened, blank when none was. The draw sets `currentRandDayKey` to today's weekday and nothing reads it.
- With a day opened since the launch, a set changed on a Wildcard card is kept as a draft in that day's log (`ia_logs_<id>`), and the day is snapshotted (`ia_hist_<id>`) as a day trained is. With none opened, a changed set is kept nowhere until Log.
- A Wildcard's cards are drawn in pounds until a day has been opened, whatever the program's unit: the unit is set as a deck or a session sheet opens (`_unitLabel`).
- On a kilogram program with no day opened, a card's Log turns the load field by the program's unit and its toast says kg (`saveExWeight` reads the program's unit), while each set's load is stored as the pounds the card shows (`toStoreW` reads the label). Read from the code and held by the beta's walk (`tests/integration/native-random-workout.test.ts`), not counted here: the ten seeded programs are in pounds.
- A goal with no pool of its own draws from `balanced` (endurance, 2 of the 10 programs; known since V195, D66).
