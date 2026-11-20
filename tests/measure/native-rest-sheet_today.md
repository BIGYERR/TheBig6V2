# Today's rest day sheet and the coach's mile nudge (measure, before the Expo app draws them)

Made by `tests/measure/native-rest-sheet_today.ts` on today's page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each through the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed.

## A. Where the sheet opens

Today's app (the Angular screens) has two doors and the page a third:

- This Week, the rest card of the day picked: **Training anyway?** opens the sheet on Move (`openRestSheet(week, day, 'move')`), and **Log cardio**, or **Edit cardio** once a jog line prints, opens it on Log cardio (`'cardio'`). Training anyway? is not drawn on a rest day whose session moved away (`week-view.ts` `restSheet`, `week-view-model.ts`).
- The session sheet of a double day (a training day that holds a jog): the Also on the day block's **Edit cardio** (`'cardio'`).
- The page alone (the PWA's week list, `openDayKey` on a rest day): the sheet with no view asked, which is the menu, **Not resting?**. No Angular screen calls it that way, so today's iOS app never draws the menu.

Counted on every week from the first to the one in view, at each stretch:

| Stretch | Rest days | The sheet opens (the day has come) | Refused: not come around yet | Before the start | Move offered | Log cardio alone (the session moved away) | Double days |
|---|---|---|---|---|---|---|---|
| 0 generated | 18 | 0 | 14 | 4 | 0 | 0 | 0 |
| 1 first week | 27 | 12 | 11 | 4 | 12 | 0 | 0 |
| 2 second week | 45 | 23 | 18 | 4 | 23 | 0 | 0 |
| 3 third week | 63 | 46 | 13 | 4 | 41 | 5 | 0 |
| 4 after two weeks away | 117 | 100 | 13 | 4 | 95 | 5 | 0 |

- The standard history logs no jog, so it makes no double day: a walk of its own makes one (section C).

## B. What the sheet draws

Read off the page's builders (`renderRestSheet`, `_renderRestMove`, `_renderRestCardio`), then counted off the markup of every draw the walks of section C made (500 draws):

| Kind | Draws that held it, or how many |
|---|---|
| Log cardio view | 280 |
| Log cardio: Clear this <jog> | 124 |
| Log cardio: Log it | 198 |
| Log cardio: Logged ✓ | 82 |
| Log cardio: Noted | 21 |
| Log cardio: What did you do? | 156 |
| Log cardio: Your <jog> on <day> | 124 |
| Log cardio: a chip with a check | 154 |
| Log cardio: a sport chip | 607 |
| Log cardio: a wheel | 443 |
| Log cardio: an effort row | 840 |
| Log cardio: an effort row picked | 156 |
| Log cardio: face of Bike | 26 |
| Log cardio: face of Row | 10 |
| Log cardio: face of Run | 137 |
| Log cardio: face of Swim | 17 |
| Log cardio: face of Walk | 90 |
| Log cardio: the meters box | 10 |
| Log cardio: the yards box | 17 |
| Move view | 210 |
| Move: Already logged here | 10 |
| Move: Already logged here, lines | 20 |
| Move: Log cardio instead | 10 |
| Move: Move it here | 90 |
| Move: Nothing left to move | 10 |
| Move: a row picked | 90 |
| Move: a session row | 1016 |
| Move: the spacing warning | 21 |
| Move: the warning names one day | 21 |
| a record of a sport the program does not train | 10 |
| the menu | 10 |

- The Move view: the kicker (`<Day> · Training anyway`), the title, the sentence naming the day, then either Nothing left to move with Log cardio instead, or the label Not logged this week, one row a session (its title, `<Day> · not logged`, a check when picked), the spacing warning under the rows when the pick stacks a region on a neighbour, and Move it here once a row is picked. Already logged here stands above the rows when the day holds a jog, one line a sport.
- The Log cardio view: the kicker (`<Day> · Log cardio`), one of two titles with its sentence, the sport chips (the program's sports, a sport a record holds, then Walk; a check on each that holds a record), the time wheel, then by sport the miles wheel (run, bike), a meters box (row), a yards box (swim) or nothing (walk), three effort rows (RPE 5, 7, 9+), Noted at RPE 9, the button (Log it, or Logged ✓ while the face is the record), and Clear this <jog> where the sport picked holds a record (Tap again to clear once armed).
- Toasts the walks drew: "<the jog> logged ✓"; "Moved. <day> is your rest now ✓"; "Nothing to log yet. Add a time or a distance."; "Nothing to log yet. Add a time."; "Ride cleared"; "Run cleared"; "Swim cleared"; "That rest day has not come around yet"; "To remove it, use Clear."; "Walk cleared". Read from the code and drawn by no walk here: "No active program. Tap Set Active or build a new one." (no program in hand), "Pick a session" (Move it here is not drawn until a row is picked).

## C. What each tap reads and writes

| Tap | The page's call | Keys written | Keys asked for | The page called | Days of the grid changed | The sheet | Toast | Taps |
|---|---|---|---|---|---|---|---|---|
| A rest day that has not come | `openRestSheet(w, day, view)` | nothing | nothing | none | 0 | stays shut | That rest day has not come around yet | 10 |
| The page's own door: the menu | `openRestSheet(w, day)` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| The menu: Train a session here | `_rdSet('view','move')` | nothing | `ia_comp_<id>`, `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| Training anyway? | `openRestSheet(w, day, 'move')` | nothing | `ia_comp_<id>`, `ia_logs_<id>` | none | 0 | drawn | none | 90 |
| Move: a session picked | `_rdSet('pick', day)` | nothing | `ia_comp_<id>`, `ia_logs_<id>` | none | 0 | drawn | none | 90 |
| Move it here | `applyRestMove()` | `ia_moves_<id>` new, `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_wild_<id>` | applyRestDayMoves 1, savePrograms 1, renderWeekView 1 | 2 | closes | Moved. <day> is your rest now ✓ | 90 |
| The old day after a move: Training anyway? asked anyway | `openRestSheet(w, day, 'move')` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| The new day after a move, no jog on it (no door leads here) | `openRestSheet(w, day, 'cardio')` | nothing | `ia_logs_<id>` | none | 0 | stays shut | That rest day has not come around yet | 10 |
| Log cardio | `openRestSheet(w, day, 'cardio')` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 31 |
| Log cardio: a sport chip | `_rdType(sport)` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 21 |
| Log it with an empty face | `applyRestCardio()` | nothing | `ia_logs_<id>` | none | 0 | as it was | Nothing to log yet. Add a time or a distance. | 11 |
| Log cardio: an effort row | `_rdRpe(5)` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 21 |
| Log cardio: the same effort row again (deselects) | `_rdRpe(5)` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 21 |
| Log cardio: RPE 9+ | `_rdRpe(9)` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 21 |
| Log it (time and distance) | `applyRestCardio()` | `ia_logs_<id>` new | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | <the jog> logged ✓ | 11 |
| Edit cardio | `openRestSheet(w, day, 'cardio')` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 21 |
| Edit cardio: Logged ✓ with the face unchanged | `applyRestCardio()` | nothing | `ia_logs_<id>` | none | 0 | closes | none | 21 |
| Edit cardio: the face changed, Log it | `applyRestCardio()` | `ia_logs_<id>` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | <the jog> logged ✓ | 21 |
| Edit cardio: the face rolled to zero, Log it | `applyRestCardio()` | nothing | `ia_logs_<id>` | none | 0 | as it was | To remove it, use Clear. | 21 |
| Clear, first tap | `clearRestCardio()` | nothing | nothing | none | 0 | as it was | none | 21 |
| Clear, second tap (the day holds nothing else) | `clearRestCardio()` | `ia_logs_<id>` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | Run cleared / Walk cleared / Ride cleared / Swim cleared | 21 |
| Log it: a second sport on the day | `applyRestCardio()` | `ia_logs_<id>` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | <the jog> logged ✓ | 10 |
| Clear, second tap (another jog stays) | `clearRestCardio()` | `ia_logs_<id>` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | Run cleared / Ride cleared / Swim cleared | 10 |
| Training anyway? on a day that holds a jog | `openRestSheet(w, day, 'move')` | nothing | `ia_comp_<id>`, `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| A double day: Edit cardio | `openRestSheet(w, day, 'cardio')` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| A double day: Log it | `applyRestCardio()` | `ia_logs_<id>` changed | `ia_comp_<id>`, `ia_exw_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1, openDetail 1 | 0 | closes | <the jog> logged ✓ | 10 |
| A double day: Training anyway? asked anyway | `openRestSheet(w, day, 'move')` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| Clear, second tap (the day holds a session's log) | `clearRestCardio()` | `ia_logs_<id>` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | Walk cleared | 10 |
| Log it with an empty face (walk) | `applyRestCardio()` | nothing | `ia_logs_<id>` | none | 0 | as it was | Nothing to log yet. Add a time. | 10 |
| Log it (a walk, time alone) | `applyRestCardio()` | `ia_logs_<id>` new | `ia_comp_<id>`, `ia_logs_<id>`, `ia_wild_<id>` | saveLogs 1, renderWeekView 1 | 0 | closes | <the jog> logged ✓ | 10 |
| Training anyway? with every session done | `openRestSheet(w, day, 'move')` | nothing | `ia_comp_<id>`, `ia_logs_<id>` | none | 0 | drawn | none | 10 |
| Nothing left to move: Log cardio instead | `_rdSet('view','cardio')` | nothing | `ia_logs_<id>` | none | 0 | drawn | none | 10 |

## D. Move, and the carried item

- On the ten first weeks, nothing trained: 18 rest days offer Move and 52 sessions are offered across the ten programs; every pair was moved, 90 moves on 90 picks. A pick stacked a region on one neighbour 21 times and on both 0 times (the warning; the move is never refused).
- Every move changed two days of the grid in hand (the session lands with `movedFrom`, its old day becomes a rest day with `moved`), wrote `ia_moves_<id>` and the grid into `ia_programs`, and called no rebuild. At the next morning's launch the moved day read the same on 90 of 90.
- **The carried item (MIGRATION.md section 7): Move meets it.** `restMoveCandidates` offers a day with no completion and no logged field; a lift log, a set draft and a part skipped alone are none of those, though each snapshots the day. At the end of the first trained week of the standard history Move still offers 32 sessions across the ten programs, and 2 of them hold a snapshot (the day whose last part was skipped alone). The Expo app's sheet, written from the page line for line, offers the same sessions and carries the item as it stands.

## E. The coach's mile nudge (D274)

- **When it is judged:** after every tap of the cardio card's Log (`logCardio`, which the Angular screen wraps), whatever the tap stored, on the card in view. Not after Mark the day done, not after the rest sheet's Log it (a jog is no run card), and the recorder is phase 4.
- **What it reads:** `ia_programs` (the program's config, its length, the record a dismissal left), `ia_hist_<id>`, `ia_logs_<id>`, `ia_comp_<id>`, the week the calendar is in, and the pace chart's recovery column.
- **When it rises:** when the card just logged and the easy card before it were both run a chart row (30 s of mile) or more off the plan the same way, the pencil is not locked, and no record names either card against this mile. It waits until This Week is on screen with the session sheet shut, then 700 ms, and rises over it.
- **Update mile time** stores the record on the program (`mileNudge`: the two cards and the mile judged against), then opens the mile pencil with the offer in its two fields; nothing is rebuilt until the pencil's own Save. **Keep** stores the same record and closes.

| Program | Taps of Log judged (runs logged with a distance and a time) | Of them an easy card with a pace target | The judge offers | Offers that go slower | Offers that go faster |
|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 4 | 1 | 0 | 0 | 0 |
| 5k race, commercial, strength, beginner | 4 | 1 | 0 | 0 | 0 |
| 10k race, home basic, hypertrophy, advanced | 4 | 0 | 0 | 0 | 0 |
| marathon, crossfit, athletic support, 36-45 | 5 | 2 | 1 | 0 | 1 |
| 1.5 mile test goal, minimal, fat loss, beginner | 4 | 4 | 0 | 0 | 0 |
| 1.5 mile test goal, commercial, balanced | 4 | 4 | 0 | 0 | 0 |
| run base, bodyweight, balanced | 3 | 3 | 0 | 0 | 0 |
| bike ftp, home full, strength support, advanced | 0 | 0 | 0 | 0 | 0 |
| swim 500, commercial, prevention support | 0 | 0 | 0 | 0 | 0 |
| run base and bike base, crossfit, balanced | 3 | 3 | 0 | 0 | 0 |

- Across the ten: 31 runs logged, 18 on a card with a pace target, 1 offers (0 slower, 1 faster). Of 1 answers, 1 wrote `ia_programs` alone, and the judge stayed shut on the same card after 1.
- The one offer's words: label "Coach", title "Two easy runs in a row off the plan.", body "9:09 and 9:00 a mile against 11:35. Your runs say your mile is nearer 7:00 than 9:00. Change it and every run ahead of you rebuilds. The mile locks from week 16.", buttons "Update mile time" and "Keep 9:00"; the pencil's fields {"mins":"7","secs":"00"}.
- The standard history draws 1 offer, 0 slower and 1 faster, with no record in the way and no locked pencil: a walk of its own makes each kind it does not before a break list is written.

## F. On the simulator's copy of Mario's backup (counts only)

Read by a scratch script from a copy of the simulator's store (2026-11-19, the store's hash 278ba57f3f6a382b before and after, the hash the last session read; nothing was written to it), every tap on a phone of its own in the VM harness. Typed here by hand: no name, note, date or load.

- The store holds 36 `ia_` keys and 3 programs. The active program is inside its 14 weeks. No rest day move is stored.
- From its first week to the one in view: 26 rest days; the sheet opens on 25 and offers Move on all 25; 1 has not come around. 1 day holds a jog, of 1 sport, and it is a rest day: no double day.
- The week in view: 2 rest days, the sheet opens on 1 and offers Move there, with 3 sessions to move; none of the 3 picks draws the spacing warning. **1 of the 3 holds a snapshot: the carried item is live on his data this week.** Across all weeks to the one in view Move would offer 12 sessions, 1 of them holding a snapshot.
- The Log cardio view draws 2 chips (his 1 sport, then Walk).
- Move it here wrote `ia_moves_<id>` (new) and `ia_programs`, one toast. Log it (a walk, and his sport with a time, a distance and an effort) changed `ia_logs_<id>` alone, one toast each. Log it with an empty face wrote nothing, one toast.
- On the day that holds his jog: Edit cardio with the face unchanged wrote nothing and said nothing; Clear in two taps changed `ia_logs_<id>` alone, one toast.
- The nudge: 11 runs logged with a distance and a time, all 11 on an easy card with a pace target. Judged today it offers after 0 (the pencil is locked). Had each tap been judged in the week it was logged, 8 of the 11 would have offered. No record is stored on the program.

