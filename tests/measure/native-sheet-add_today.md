# Today's add sheet, remove, the Wildcard tag, the jog, the 1RM card and the note

Written by `cd tests && node measure/native-sheet-add_today.ts` (read-only). Zone America/New_York.

## A. The add sheet over the ten programs as generated

- Training days: **551**. With lift work, where the whole day's sheet carries the add button: **543**. Cardio alone: 8 (0 of them with no list of sections for a pick to push onto).
- Rows the sheet offers, all days: **8179** (`gap` 2412, `more` 2509, `off` 3258). Per sheet: 7 to 17, middle 16. Sheets that offer nothing: 0.
- Distinct moves offered: 91. The region tag: `legs` 267, `pull` 9, `push` 267. The sets tag: 0 to 29, middle 12.
- The dose a pick would add (`_swapDetailFor(name, addedDetailFor(...))`), every row: 27 distinct. The fallback `3×10 — RPE 7` as the donor: 5162 rows. Reshaped by `_swapDetailFor` (a lift with no load to move): 265 rows.
- A "more" row whose dose reads no set count (its note then says 3): 0.
- The most common doses: `3×10 — RPE 7` 4938, `2×15–20 @ RPE 7` 451, `3×15–20 @ RPE 8` 450, `3 sets — RPE 7 (leave 3 or more in reserve)` 440, `3×8–12 each @ RPE 8` 366, `4×8–12 each @ RPE 8` 162.
- Rows by program: half-manny (Mario, NRC half, crossfit) 1057; 5k race, commercial, strength, beginner 710; 10k race, home basic, hypertrophy, advanced 592; marathon, crossfit, athletic support, 36-45 1326; 1.5 mile test goal, minimal, fat loss, beginner 804; 1.5 mile test goal, commercial, balanced 1038; run base, bodyweight, balanced 380; bike ftp, home full, strength support, advanced 656; swim 500, commercial, prevention support 946; run base and bike base, crossfit, balanced 670.

## B. What add and remove write (the page's own functions, HALF_MANNY)

`+` an entry added, `~` changed, `-` dropped.

| Step | On the page | Keys it changed | Toasts |
|---|---|---|---|
| | *week 1, mon, Posterior Chain* | | |
| The add button | `openAddSheet()` | nothing |  |
| A pick (Back squat, "gap") | `applyAddChoice(name)` | `ia_edits_<id>` (new) [+w1_mon] | Back squat added at 2×6–10 each @ RPE 7. |
| A second pick (Deadlift, "more") | `applyAddChoice(name)` | `ia_edits_<id>` [~w1_mon {~add}] | Deadlift added at 4×10 — fast and crisp, 60s rest. |
| The first added move logged (its card's Log) | `autoSaveSets; saveExWeight` | `ia_exw_<id>` (new) [+back_squat]; `ia_hist_<id>` (new) [+w1_mon]; `ia_logs_<id>` (new) [+w1_mon] |  |
| Its remove (the chip's button) | `removeAddedExercise(name)` | `ia_edits_<id>` [~w1_mon {~add}]; `ia_hist_<id>` [~w1_mon {~sections}] | Back squat removed. |
| The second one's remove | `removeAddedExercise(name)` | `ia_edits_<id>` [-w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | Deadlift removed. |
| The first move added again | `applyAddChoice(name)` | `ia_edits_<id>` [+w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | Back squat added at 2×6–10 each @ RPE 7. |
| Back, and the next launch the morning after | `closeDetail(); a cold start` | `ia_edits_<id>` [-w1_mon]; `ia_pop_idx_<id>` (new) [+reminder]; `ia_remind_last_<id>` (new); `ia_reminded_<id>` (new) [+w1_mon] |  |
| Done | `handleDayStatus(day, title, 'complete')` | `ia_comp_<id>` (new) [+w1_mon]; `ia_logs_<id>` [~w1_mon {~ts +rpe +run_dist +run_pace +run_mins +run_reps +run_rep_time +bike_mins +swim_yards +notes +swapFrom +swapTo}]; `ia_pop_dismiss_<id>` (new) [+date, +idx]; `ia_pop_idx_<id>` [+workout] | Done ✓ |
| Reopen the done day, and a pick | `openDayKey(day); applyAddChoice(name)` | `ia_edits_<id>` [+w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | Deadlift added at 4×10 — fast and crisp, 60s rest. |
| That pick's remove, on the done day | `removeAddedExercise(name)` | `ia_edits_<id>` [-w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | Deadlift removed. |
| | *three weeks on: week 1, tue, a day never touched* | | |
| A pick (Dumbbell front raise) | `applyAddChoice(name)` | `ia_edits_<id>` [+w1_tue] | Dumbbell front raise added at 3×10 — RPE 7. |
| The next launch | `a cold start` | `ia_edits_<id>` [-w1_tue]; `ia_remind_last_<id>`; `ia_reminded_<id>` [+w4_mon] |  |
| | *another phone, this week: week 1, mon, nothing touched but the pick* | | |
| A pick (Back squat) | `applyAddChoice(name)` | `ia_edits_<id>` (new) [+w1_mon] | Back squat added at 2×6–10 each @ RPE 7. |
| The next launch, the morning after | `a cold start` | `ia_pop_idx_<id>` (new) [+reminder]; `ia_remind_last_<id>` (new); `ia_reminded_<id>` (new) [+w1_mon] |  |
| The launch a week on | `a cold start` | `ia_edits_<id>` [-w1_mon]; `ia_pop_idx_<id>` [~reminder]; `ia_remind_last_<id>`; `ia_reminded_<id>` [+w1_sat] |  |

- This week, nothing touched but the pick: after it `[["Back squat"]]`; after the next morning's launch `[["Back squat"]]`; after the launch a week on `[]`.
- The record after the first pick (`ia_edits_<id>`): `{"w1_mon":{"add":[{"name":"Back squat","detail":"2×6–10 each @ RPE 7","ts":1788213600000}],"skip":[]}}`.
- The day's added block after it: `[{"label":"Added by you","items":["Back squat · 2×6–10 each @ RPE 7"]}]`; after the second: `[{"label":"Added by you","items":["Back squat · 2×6–10 each @ RPE 7","Deadlift · 4×10 — fast and crisp, 60s rest"]}]`.
- After the logged move's remove, its lift log entry: 1 entry (remove does not take a logged lift back).
- After both removes the record reads: `{}`.
- After the next launch the day still holds: `[{"label":"Added by you","items":["Back squat · 2×6–10 each @ RPE 7"]}]`.
- The week gone by: after the pick `[{"label":"Added by you","items":["Dumbbell front raise · 3×10 — RPE 7"]}]`; after the next launch `[]`.

## C. Where the Wildcard tag, the jog, the 1RM card, the note and an added move show

The ten programs at the end of the standard history (`tests/support/stored-state.ts` `life`), every training day:

| What the sheet would draw | Days of 551 |
|---|---|
| an added block (with 10 moves that carry a remove) | 10 |
| the Wildcard tag | 10 |
| a double day's jog | 0 |
| the 1RM card | 0 |
| the day's note | 0 |

- half-manny (Mario, NRC half, crossfit): added w1 thu, wildcard w2 wed
- 5k race, commercial, strength, beginner: added w1 wed, wildcard w2 mon
- 10k race, home basic, hypertrophy, advanced: added w1 wed, wildcard w2 mon
- marathon, crossfit, athletic support, 36-45: added w1 fri, wildcard w2 mon
- 1.5 mile test goal, minimal, fat loss, beginner: added w2 thu, wildcard w3 wed
- 1.5 mile test goal, commercial, balanced: added w2 wed, wildcard w3 mon
- run base, bodyweight, balanced: added w2 thu, wildcard w3 tue
- bike ftp, home full, strength support, advanced: added w2 wed, wildcard w3 mon
- swim 500, commercial, prevention support: added w1 wed, wildcard w2 mon
- run base and bike base, crossfit, balanced: added w2 thu, wildcard w3 wed

Every goal the wizard offers crossed with every focus (140 programs as built, 8782 training days; the cross of `tests/sweeps/program-shape.test.ts`):

- Program length: `longer` 133, `six weeks or fewer` 7.
- Programs with a 1RM card: **1** of 140, 3 days (`bench` 1, `deadlift` 1, `squat` 1).
- Programs with a day's note: **2** of 140, 6 days.
  - 3 days: "This is what the block built toward. Test it, log it, and the next block anchors off the number you hit." (plain words, no markup)
  - 3 days: "Peak week. The AMRAP number is the yardstick. Log it. Next block has to beat it." (plain words, no markup)
- The programs with a 1RM card: no cardio / strength (6 wk, 3 days).

## D. The 1RM card's save

The first program of the cross with a test day, in pounds and with its injury taken off: `no cardio / strength`, 6 weeks, seed 1001. Its test days: week 6 mon (bench), week 6 tue (deadlift), week 6 wed (squat).

- The day: "Push", tags ["lift","test","core"], its first move `Dumbbell decline press · Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.`. The card stands between the first section and the rest.
- The note under the work: "This is what the block built toward. Test it, log it, and the next block anchors off the number you hit."

| Step | On the page | Keys it changed | Toasts |
|---|---|---|---|
| The test set logged (225 for 3, the first move's card) | `autoSaveSets; saveExWeight` | `ia_exw_<id>` (new) [+dumbbell_decline_press]; `ia_hist_<id>` (new) [+w6_mon]; `ia_logs_<id>` (new) [+w6_mon] |  |
| Save as new bench max (225 for 3: 248) | `getPrograms; cfg[lift] = 248; savePrograms` | `ia_programs` [cfg {~bench}] |  |
| The next launch, the morning after | `a cold start` | `ia_remind_last_<id>`; `ia_reminded_<id>` [+w6_mon] |  |

- The config's maxes before: `{"bench":135,"squat":155,"deadlift":185}`; after the save: `{"bench":248,"squat":155,"deadlift":185}`.
- The save raises no toast: the card itself says "Saved. Your next block anchors off 248 lbs." and hides its button.

