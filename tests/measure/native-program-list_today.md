# Today's program list and its sheets (measure, before the Expo app draws them)

Written by `cd tests && node measure/native-program-list_today.ts` (read-only). Zone America/New_York.

## A. What the list draws: the ten programs, one stored, at each of the five stretches

| Program | The card's meta line | Detail rows (focus, profile, schedule) | 1RM chips (est.) | Pace chips, and where the mile comes from | Cardio rows (pencils) | Event rows | Changes across the stretches |
|---|---|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | Mo · Tu · Th · Fr · Sa · 14 wks cardio · 6 wks lift / ▢ CrossFit · intermediate · 18-35 / ▢ Half Marathon | 3, 4, 3 | 3 | 6: Mile 5K 10K Tempo Half Recovery; entered | 1 | Race date, Time out | 4 of 4 steps |
| 5k race, commercial, strength, beginner | Mo · Tu · We · Th · Fr · Sa · 8 wks cardio · 6 wks lift / ▢ Gym · beginner · 18-35 / ▢ 5K | 3, 4, 3 | 3 | 5: Mile 5K 10K Tempo Recovery; entered | 1 | Race date, Time out | 4 of 4 steps |
| 10k race, home basic, hypertrophy, advanced | Mo · Tu · We · Th · Fr · 8 wks cardio · 6 wks lift / ▢ Basic · advanced · 18-35 / ▢ 10K | 3, 4, 3 | 3 | 5: Mile 5K 10K Tempo Recovery; entered | 1 | Race date, Time out | 4 of 4 steps |
| marathon, crossfit, athletic support, 36-45 | Su · Tu · We · Fr · Sa · 18 wks cardio · 6 wks lift / ▢ CrossFit · intermediate · 36-45 / ▢ Marathon | 3, 4, 3 | 3 | 6: Mile 5K 10K Tempo Marathon Recovery; entered | 1 | Race date, Time out | 4 of 4 steps |
| 1.5 mile test goal, minimal, fat loss, beginner | Mo · Tu · Th · Fr · Sa · 11 wks cardio · 6 wks lift / ▢ Minimal · beginner · 18-35 / ▢ Hit a Pace / Time Goal | 3, 4, 3 | 3 | 6: Goal Mile 5K 10K Tempo Recovery; entered | 1 | none | none |
| 1.5 mile test goal, commercial, balanced | Mo · Tu · We · Th · Fr · Sa · 11 wks cardio · 6 wks lift / ▢ Gym · intermediate · 18-35 / ▢ Hit a Pace / Time Goal | 3, 4, 3 | 3 | 6: Goal Mile 5K 10K Tempo Recovery; entered | 1 | none | none |
| run base, bodyweight, balanced | Mo · We · Th · Sa · 9 wks cardio · 6 wks lift / ▢ Bodyweight · intermediate · 36-45 / ▢ Base | 3, 4, 3 | 3 | 2: Mile Recovery; entered | 1 | none | none |
| bike ftp, home full, strength support, advanced | Mo · Tu · We · Th · Fr · Sa · 7 wks cardio · 6 wks lift / ▢ Full · advanced · 18-35 / ▢ FTP | 3, 4, 3 | 3 | none | 1 | none | none |
| swim 500, commercial, prevention support | Mo · Tu · We · Th · Fr · 12 wks cardio · 6 wks lift / ▢ Gym · intermediate · 18-35 / ▢ 500 | 3, 4, 3 | 3 | none | 1 | none | none |
| run base and bike base, crossfit, balanced | Mo · Tu · Th · Fr · Sa · 9 wks cardio · 6 wks lift / ▢ CrossFit · intermediate · 18-35 / ▢ Base + ▢ Base | 3, 4, 3 | 3 | 2: Mile Recovery; entered | 2 | none | none |

- Cards drawn: 50 (10 programs, five stretches). Detail rows 500, 1RM chips 150 (marked est. on 0 cards).
- Run paces: 40 groups, 190 chips. Chip names: Mile 40, 5K 30, 10K 30, Tempo 30, Half 5, Recovery 40, Marathon 5, Goal 10. Units: `/mi · 9/10` 20, `/mi · 7–8/10` 20, `/mi · 6–7/10` 20, `/mi · 6/10` 20, `/mi` 80, `/mi · 4–5/10` 20, `1.5 mi` 10.
- The sentence under the paces, by where the mile comes from: entered 40. (The kinds the builder has: default, entered, seeded, edited, clamped fast, clamped slow, clamped not a time.)
- Cardio rows with a pencil: 55; Lift only cards: 0. Event groups: 20 (40 rows). Seeds printed: 50.
- Not drawn by any of these: the empty list (two lines), a card being renamed, the two confirm tiers, a second card, an archived program (it leaves the list). Section B makes them.

## B. The list's taps, on each of the ten programs at the end of the third week

"first" is the walked program (three weeks of history); "second" is a program made the wizard's way beside it, which the wizard leaves active. Each tap runs on a phone of its own.

| Tap | The page's call | Keys written | The page called | Toast | Active after | Screen after | Programs |
|---|---|---|---|---|---|---|---|
| Open a card, close it | `toggleProgCard(id) twice` | nothing | none | none | first | as before | 10 of 10 |
| The pencil by the name | `startRename(id)` | nothing | none | none | first | as before | 10 of 10 |
| Rename: Save | `commitRename(id)` | `ia_programs` changed | none | Renamed ✓ | first | as before | 10 of 10 |
| Copy selections | `copyProgSel(id)` | nothing | none | none | first | as before | 10 of 10 |
| Archive (first tap) | `askArchive(id)` | nothing | none | none | first | as before | 10 of 10 |
| Delete forever… (the link) | `askPurge(id)` | nothing | none | none | first | as before | 10 of 10 |
| Cancel | `cancelConfirm()` | nothing | none | none | first | as before | 10 of 10 |
| Archive the only program | `archiveProg(id)` | `ia_active` removed, `ia_programs` changed | loadActiveProgram 1 | Program archived | none | as before | 10 of 10 |
| Delete Forever, the only program | `deleteProg(id)` | `ia_active` removed, `ia_programs` changed, every key the first owns removed | loadActiveProgram 1 | Program deleted | none | as before | 10 of 10 |
| Set Active on the first | `setActive(first)` | `ia_active` changed, `ia_reminded_<first>` changed | refreshProgram 1, buildProgram 4, loadActiveProgram 1, markPastAsked 1 | Active program updated | first | screenWeek | 10 of 10 |
| Archive the first (not active) | `archiveProg(first)` | `ia_programs` changed | none | Program archived | second | as before | 10 of 10 |
| Archive the second (active): the first takes over | `archiveProg(second)` | `ia_active` changed, `ia_programs` changed, `ia_reminded_<first>` changed | refreshProgram 1, buildProgram 4, loadActiveProgram 1, markPastAsked 1 | Program archived | first | as before | 10 of 10 |
| Delete Forever the first (not active) | `deleteProg(first)` | `ia_programs` changed, every key the first owns removed | none | Program deleted | second | as before | 10 of 10 |
| Delete Forever the second (active): the first takes over | `deleteProg(second)` | `ia_active` changed, `ia_programs` changed, `ia_reminded_<first>` changed | refreshProgram 1, buildProgram 4, loadActiveProgram 1, markPastAsked 1 | Program deleted | first | as before | 10 of 10 |
| Delete Forever the first while active: the second takes over | `deleteProg(first)` | `ia_active` changed, `ia_programs` changed, every key the first owns removed | refreshProgram 1, buildProgram 1, loadActiveProgram 1, markPastAsked 1 | Program deleted | second | as before | 10 of 10 |

- "Every key the program owns": the fifteen families of purgeProgData. A walked program held 11 to 14 of them.
- A rebuild is `refreshProgram` (core's refreshStoredProgram); `buildProgram` counts the engine builds inside it (one, and one more for each overlay it splices).

## C. The goal sheet

| Program, sport | Options listed (a step up) | Need a target typed | Switches made | Keys written | The page called | Days of the grid changed (trained ones) | Toast |
|---|---|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit), run | 6 (1) | 1 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 49 to 60 of 98 (0) | Goal switched. Program rebuilt from this week. |
| 5k race, commercial, strength, beginner, run | 6 (3) | 1 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 23 to 35 of 56 (0) | Goal switched. Program rebuilt from this week. |
| 10k race, home basic, hypertrophy, advanced, run | 6 (2) | 1 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 23 to 30 of 56 (0) | Goal switched. Program rebuilt from this week. |
| marathon, crossfit, athletic support, 36-45, run | 6 (0) | 1 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 65 to 79 of 126 (0) | Goal switched. Program rebuilt from this week. |
| 1.5 mile test goal, minimal, fat loss, beginner, run | 6 (4) | 0 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 34 to 39 of 77 (0) | Goal switched. Program rebuilt from this week. |
| 1.5 mile test goal, commercial, balanced, run | 6 (4) | 0 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 45 to 46 of 77 (0) | Goal switched. Program rebuilt from this week. |
| run base, bodyweight, balanced, run | 6 (5) | 1 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 23 to 23 of 63 (0) | Goal switched. Program rebuilt from this week. |
| bike ftp, home full, strength support, advanced, bike | 5 (2) | 0 | 4 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 11 to 23 of 49 (0) | Goal switched. Program rebuilt from this week. |
| swim 500, commercial, prevention support, swim | 5 (2) | 1 | 4 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 29 to 49 of 84 (0) | Goal switched. Program rebuilt from this week. |
| run base and bike base, crossfit, balanced, run | 6 (5) | 1 | 5 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 29 to 29 of 63 (0) | Goal switched. Program rebuilt from this week. |
| run base and bike base, crossfit, balanced, bike | 5 (3) | 0 | 4 | `ia_programs` changed | refreshProgram 1, buildProgram 4 | 6 to 28 of 63 (0) | Goal switched. Program rebuilt from this week. |

- Sheets: 11 (a sport of a program), 63 options listed, 52 switches made (every option but the current one).
- The decision panel: a step up 31, a plain switch 21; a target typed on 7; the started wording on 52.
- A switch changed the grid on 52 of 52; days already logged or marked that changed: 0.
- On a program that is not active (half-manny (Mario, NRC half, crossfit) beside a second): wrote `ia_programs` changed; the page called none.
- Make the switch with a target missing (the pace goal, nothing typed): wrote nothing; toast none (the button is greyed and takes no tap).

## D. The mile pencil

| Program | Pencil shown | Locked at each stretch (week of weeks) | A new mile (9:30): keys written | The page called | Days changed (trained ones) | Source after | Toast |
|---|---|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | yes | open 1/14, open 1/14, open 2/14, open 3/14, open 6/14 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 52 of 98 (0) | edited, from {"mins":"10","secs":"30","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| 5k race, commercial, strength, beginner | yes | open 1/8, open 1/8, open 2/8, open 3/8, locked 6/8 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 28 of 56 (0) | edited, from {"mins":"8","secs":"00","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| 10k race, home basic, hypertrophy, advanced | yes | open 1/8, open 1/8, open 2/8, open 3/8, locked 6/8 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 27 of 56 (0) | edited, from {"mins":"8","secs":"30","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| marathon, crossfit, athletic support, 36-45 | yes | open 1/18, open 1/18, open 2/18, open 3/18, open 6/18 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 64 of 126 (0) | edited, from {"mins":"9","secs":"00","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| 1.5 mile test goal, minimal, fat loss, beginner | yes | open 1/11, open 2/11, open 3/11, open 4/11, open 7/11 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 36 of 77 (0) | edited, from {"mins":"8","secs":"15","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| 1.5 mile test goal, commercial, balanced | yes | open 1/11, open 2/11, open 3/11, open 4/11, open 7/11 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 38 of 77 (0) | edited, from {"mins":"8","secs":"15","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| run base, bodyweight, balanced | yes | open 1/9, open 2/9, open 3/9, open 4/9, locked 7/9 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 22 of 63 (0) | edited, from {"mins":"11","secs":"0","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |
| bike ftp, home full, strength support, advanced | no | | | | | | |
| swim 500, commercial, prevention support | no | | | | | | |
| run base and bike base, crossfit, balanced | yes | open 1/9, open 2/9, open 3/9, open 4/9, locked 7/9 | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 6 of 63 (0) | edited, from {"mins":"11","secs":"0","kind":"entered"} | Mile updated. Every run still ahead of you now reads from your new row. |

- The pencil shows on 8 of 10 programs (a run goal that reads the pace chart). Opened at 40 stretches, the lock stood on 4. Trained days a new mile changed: 0.
- A blank field (``:`30`): wrote nothing; toast: Put in both the minutes and the seconds..
- Not a time (`9`:`75`): wrote nothing; toast: That mile time is not a real time. Check the minutes and seconds..
- Faster than the chart (`3`:`30`): wrote `ia_programs` changed; toast: Mile updated. Every run still ahead of you now reads from your new row. At 3:30 your paces come from the chart’s fastest row, 5:00. It tops out there..
- Slower than the chart (`25`:`0`): wrote `ia_programs` changed; toast: Mile updated. Every run still ahead of you now reads from your new row. At 25:00 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first..
- The same mile again (`10`:`30`): wrote `ia_programs` changed; toast: Mile updated. Every run still ahead of you now reads from your new row..
- The lock on half-manny (Mario, NRC half, crossfit) in week 12 of 14: locked true, facts Days out, Race day, Week; the tap wrote nothing.
- The lock on run base, bodyweight, balanced in week 7 of 9: locked true, facts Week; the tap wrote nothing.

## E. Injury and travel (the sheet, the chip, the check in)

- Traveling? opens: "Traveling?", "Temporary change"; 3 cards (Room only, Mini gym, Full gym), 2 date boxes, an effect panel of 2 lines, the button `travel`. Opening wrote nothing; the draft starts today through 13 days on, Mini gym.
- Hurt? opens: "Hurt?", "Train around it"; 8 region cards (Shoulder, Elbow / Wrist, Lower Back, Hip / Glute, Knee, Ankle / Foot / Shin, Calf, Neck / something else), no tiers, no button until a region is picked. A region picked: 2 tiers, an effect panel of 3 lines, 1 date box, the button `injury`. Neck / something else: 1 line, the button `close`.

| Tap | The page's call | Keys written | The page called | Days changed (trained ones), least to most | Toast or pop-up | Programs |
|---|---|---|---|---|---|---|
| Hurt? Apply change (workaround) | `applyInjuryDraft()` | `ia_programs` changed | refreshProgram 1, buildProgram 2 | 28 to 84 (0) | Working around it ✓ | 30 taps |
| Hurt? Apply change (protect) | `applyInjuryDraft()` | `ia_programs` changed | refreshProgram 1, buildProgram 2 | 28 to 84 (0) | Protected. Train around it ✓ | 30 taps |
| The chip: I'm back (run was held back: two return weeks) | `imBackFromInjury(id)` | `ia_programs` changed | refreshProgram 1, buildProgram 3, popFire 1 | 28 to 84 (0) | pop-up: Back in | 10 taps |
| The chip: ✕ (remove the change) | `removeOverlay(id)` | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 28 to 84 (0) | Change removed ✓ | 10 taps |
| The check in: better | `injReassess(id,'better')` | nothing | popFire 1 | 0 to 0 (0) | pop-up: Check in | 10 taps |
| The check in: same | `injReassess(id,'same')` | `ia_programs` changed | none | 0 to 0 (0) | Staying on the plan. It will ask again in two weeks. | 10 taps |
| The check in: worse | `injReassess(id,'worse')` | `ia_programs` changed | popFire 1 | 0 to 0 (0) | pop-up: Check in | 10 taps |
| The chip: I'm back (run never held back: one return week) | `imBackFromInjury(id)` | `ia_programs` changed | refreshProgram 1, buildProgram 2, popFire 1 | 28 to 84 (0) | pop-up: Back in | 10 taps |
| Traveling? Apply change (Room only, today through 13 days on) | `applyOverlayDraft()` | `ia_programs` changed | refreshProgram 1, buildProgram 2 | 7 to 12 (0) | Change applied ✓ | 10 taps |
| The chip: ✕ on a travel change | `removeOverlay(id)` | `ia_programs` changed | refreshProgram 1, buildProgram 1 | 7 to 12 (0) | Change removed ✓ | 10 taps |
| Traveling? Apply change (Mini gym, today through 13 days on) | `applyOverlayDraft()` | `ia_programs` changed | refreshProgram 1, buildProgram 2 | 7 to 12 (0) | Change applied ✓ | 10 taps |
| Traveling? Full gym: Got it | `applyOverlayDraft()` | nothing | none | 0 to 0 (0) | none | 10 taps |
| Traveling? dates outside the program | `applyOverlayDraft()` | nothing | none | 0 to 0 (0) | That range is outside your program | 10 taps |
| Hurt? no region picked | `applyInjuryDraft()` | nothing | none | 0 to 0 (0) | Pick a region | 10 taps |

## F. The rest day sheet

| Program | Rest days in the first week | Where the sheet opens (the day has come) | Where Move is offered | Sessions offered to move | A spacing warning on a pick |
|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 2 | 2 | 2 | 5 | 3 of 5 |
| 5k race, commercial, strength, beginner | 1 | 1 | 1 | 6 | 2 of 6 |
| 10k race, home basic, hypertrophy, advanced | 2 | 2 | 2 | 5 | 0 of 5 |
| marathon, crossfit, athletic support, 36-45 | 2 | 2 | 2 | 5 | 1 of 5 |
| 1.5 mile test goal, minimal, fat loss, beginner | 2 | 2 | 2 | 5 | 2 of 5 |
| 1.5 mile test goal, commercial, balanced | 1 | 1 | 1 | 6 | 2 of 6 |
| run base, bodyweight, balanced | 3 | 3 | 3 | 4 | 2 of 4 |
| bike ftp, home full, strength support, advanced | 1 | 1 | 1 | 6 | 2 of 6 |
| swim 500, commercial, prevention support | 2 | 2 | 2 | 5 | 0 of 5 |
| run base and bike base, crossfit, balanced | 2 | 2 | 2 | 5 | 2 of 5 |

- Rest days across the ten first weeks: 18; the sheet opens on 18, Move is offered on 18; sessions offered to move 52, a spacing warning on 16 picks onto the first rest day.

| Tap | The page's call | Keys written | The page called | Days of the grid changed | Toast | Taps |
|---|---|---|---|---|---|---|
| Train a session here: Move it here | `applyRestMove()` | `ia_moves_<id>` new, `ia_programs` changed | none | 2 to 2 | Moved. <day> is your rest now ✓ | 10 |
| Log cardio: Log it (the program's sport, time and distance) | `applyRestCardio()` | `ia_logs_<id>` new | none | 0 to 0 | <the jog> logged ✓ | 11 |
| Edit cardio: Logged ✓ with the face unchanged | `applyRestCardio()` | nothing | none | 0 to 0 | none | 10 |
| Edit cardio: Clear, first tap | `clearRestCardio()` | nothing | none | 0 to 0 | none | 10 |
| Edit cardio: Clear, second tap | `clearRestCardio() twice` | `ia_logs_<id>` changed | none | 0 to 0 | Run cleared / Ride cleared / Swim cleared | 10 |
| Log cardio: Log it (a walk, time alone) | `applyRestCardio()` | `ia_logs_<id>` new | none | 0 to 0 | <the jog> logged ✓ | 10 |
| Log it with an empty face | `applyRestCardio()` | nothing | none | 0 to 0 | Nothing to log yet. Add a time or a distance. | 10 |

## G. The coach's mile nudge (D274) on the standard history

| Program | Runs logged with a distance and a time | Of them an easy card with a pace target | The judge offers |
|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 4 | 1 | 0 |
| 5k race, commercial, strength, beginner | 4 | 1 | 0 |
| 10k race, home basic, hypertrophy, advanced | 4 | 0 | 0 |
| marathon, crossfit, athletic support, 36-45 | 5 | 2 | 1 |
| 1.5 mile test goal, minimal, fat loss, beginner | 4 | 4 | 0 |
| 1.5 mile test goal, commercial, balanced | 4 | 4 | 0 |
| run base, bodyweight, balanced | 3 | 3 | 0 |
| bike ftp, home full, strength support, advanced | 0 | 0 | 0 |
| swim 500, commercial, prevention support | 0 | 0 | 0 |
| run base and bike base, crossfit, balanced | 3 | 3 | 0 |

- Across the ten: 31 runs logged, 18 on a card with a pace target, 1 offers. Either answer writes `ia_programs` (the two cards judged and the mile, on the program); Update mile time then opens the pencil with the offer in its fields.

## H. On the simulator's copy of Mario's backup (counts only)

Read by a scratch script from a copy of the simulator's store (2026-11-18, the store's hash 278ba57f3f6a382b before and after; nothing was written to it), every tap on a phone of its own in the VM harness. Typed here by hand: no name, note, date or load.

- The store holds 36 `ia_` keys and 3 programs, 1 of them archived. The list draws 2 cards.
- All 3 programs mark their 1RM chips "(est.)": none has a lift entered. No seeded program draws that mark.
- Run paces: 6 chips on each of the 3. The sentence reads the mile as entered on 2 and as edited on 1 (the standard history draws entered alone).
- The mile pencil shows the lock on all 3: each stands in its last three weeks. The edit sheet opens on none of his programs today.
- Goal sheets: 4 (three run sheets of 6 options, one second sport of 5).
- Stored beside the programs: 1 overlay on 1 program, no rest day move, a jog on 2 days (1 on each of 2 programs), no nudge record.
- The active program this week: 2 rest days; the rest sheet opens on 1 and offers Move there, with 3 sessions to move. No injury is live. Of its 11 runs logged with a distance and a time, the nudge would offer after 0.
- Set Active on the other live program: `ia_active` and its `ia_reminded_<id>` changed; one rebuild (2 engine builds).
- Archive: the one that is not active wrote `ia_programs` alone; the active one wrote `ia_active`, `ia_programs` and the other's `ia_reminded_<id>`, with one rebuild.
- Delete Forever: 11 or 12 of the 15 families removed with the program's row; on the active one the other takes over, as Archive.
- A goal switch on the active program (4 options that need nothing typed): `ia_programs` changed, one rebuild, 7 to 8 of 98 days changed, 0 of them logged or marked.
- Hurt? (two regions, both tiers tried once each) and Traveling? (Room only): `ia_programs` changed, one rebuild (2 engine builds), 6 of 98 days changed, 0 of them logged or marked.
- The rest sheet: Move wrote `ia_moves_<id>` (new) and `ia_programs`, 2 days of the grid changed, no rebuild; a walk logged changed `ia_logs_<id>` alone.

## I. What each piece reads and writes, and through which of core's readers and writers (read from the code)

| Piece | Reads | Writes | Core's own | The page's code, not in core |
|---|---|---|---|---|
| The list and a card's detail | `ia_programs`, `ia_active` | nothing | readPrograms, readActiveProgramId; runAnchorInfo, raceCountdown, raceCountdownWords, NRC_GOALS, _fmtMileAnchor, DEFAULT_1RM, ALL_DAYS_ORDER | progSelData and its five label tables, runAnchorChips, runAnchorSentence (programs.ts); _fmtStartDay (wizard.ts, the beta has it); the list's state (open cards, the rename, the confirm tier) |
| Rename | `ia_programs` | `ia_programs` | readPrograms, writePrograms | commitRename (program-manage.ts) |
| Set Active (the one switch) | `ia_programs` and every key a launch reads | `ia_active`, the launch's own (an older program repaired, edits of frozen weeks dropped), `ia_reminded_<id>` | writeActiveProgramId, refreshStoredProgram | setActive, loadActiveProgram (program-manage.ts); markPastAsked (popups-streaks-reminders.ts). The beta has the launch (week-screen.ts) and markPastAsked's readers (pop-ups.ts) |
| Archive | `ia_programs`, `ia_active` | `ia_programs`; on the active one the switch's, or `ia_active` removed | readPrograms, writePrograms | archiveProg, _handoffActiveFrom (program-manage.ts) |
| Delete Forever | the same | `ia_programs`, the fifteen families removed; on the active one the switch's | the same | deleteProg, purgeProgData (the beta has both for Progress, without the switch) |
| Copy selections | `ia_programs` | nothing (the clipboard) | none | progSelLines, runAnchorLine, copyProgSel (programs.ts) |
| The goal sheet | `ia_programs` | `ia_programs`; on the active program a rebuild | readPrograms, writePrograms, refreshStoredProgram, getWeekMonday | commitGoalChange, _goalCurWeek, _goalInputsValid (programs.ts); CARDIO_GOALS_BY_TYPE, HYBRID_EXCLUDED_GOALS, _GOAL_RANK, _GOAL_REQ_INPUTS (wizard.ts, the wizard's own tables: row 6 reads them too) |
| The mile pencil and its lock | `ia_programs` | `ia_programs`; on the active program a rebuild | the same; raceCountdown, raceCountdownWords | openMileSheet, commitMileChange (programs.ts); _mileEntryState (wizard-generate.ts, shared with the wizard) |
| The coach's nudge | `ia_programs`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_comp_<id>` | `ia_programs` (the record) | runAnchorInfo, paceChartLookup, the day readers | nothing but the Angular screen's own model and its hook on the cardio log |
| Hurt? and Traveling? | the program in hand | `ia_programs` (the overlay); a rebuild | overlayWeekRange, weekOfDate, INJURY_REGIONS, refreshStoredProgram | openOverlaySheet, openInjurySheet, _ovSet, applyOverlayDraft, applyInjuryDraft, the date words (_fmtDate, _fmtDateWd, _dayCount, _dayCountWord, _addDaysIso), overlayBackCopy (overlays.ts) |
| The chip, I'm back, the check in | the program in hand | `ia_programs` (overlays, lastAsk); a rebuild on ✕ and I'm back | injuryPlan, paceShiftMap, overlayWeekRange | renderOverlayChip (the page writes the chip and the check in card itself: no Angular model), overlaySpanLabel, removeOverlay, imBackFromInjury, injReassess, injSnooze (overlays.ts); two pop-ups (popFire) |
| The rest day sheet | the grid in hand, `ia_logs_<id>`, `ia_comp_<id>`, `ia_moves_<id>` | Move: `ia_moves_<id>`, `ia_programs` (the grid); Log and Clear: `ia_logs_<id>` | applyRestDayMoves, the day log's reader and writer, CARDIO_PARK_FIELDS, _pattern, _PATTERN_REGION | all of the sheet (rest-day-shell.ts: the page writes it as markup, no Angular model): the menu, Move with its candidates and its spacing warning, the cardio face on the wheels, Log, Clear, the two eligibility tests |

- A switch of the active program: Set Active, Archive of the active one, Delete Forever of the active one (the first program not archived takes over; with none, `ia_active` is removed).
- A rebuild (core's refreshStoredProgram): every switch; a goal switch or a new mile on the active program; Hurt? and Traveling? Apply change; the chip's ✕; I'm back.
- No rebuild: rename; Archive or Delete Forever of a program that is not active; a goal or a mile on a program that is not active; the check in's answers; the rest sheet (Move lays the stored moves over the grid in hand with core's applyRestDayMoves and stores the grid); the nudge's answers.
- Kinds the standard walks draw none of, each to be made by a walk of its own before a break list is written: the "(est.)" mark, a Lift only card, the sentence for a default, a seeded, an edited and each of three clamped miles, both empty lists, a second card, a card being renamed, both confirm tiers.

## J. What row 5 owes from earlier rows

- Archiving: Progress's walk archives on the page and carries the keys over (tests/support/native-progress.ts). The list's Archive is the beta's own.
- The rest of a switch after Delete Forever: Progress's deleteProgram puts the pointer on the next program and stops (progress-writes.ts). The launch's writes and the past days marked as asked (D238) come with the list's switch.
- The jog's Edit cardio on the session sheet is drawn and takes no press until the rest sheet is built (SessionSheet.tsx).
- On This Week, drawn and taking no press: Hurt?, Traveling?, the rest card's Log cardio or Edit cardio and Training anyway?, the start date and the race date. The start date and the race date are named in no row of MIGRATION.md.
- The beta has no Programs tab, no date box and no clipboard: a date box and a clipboard are each a native package.

