# Today's wizard and generating (measure, before the Expo app draws them)

Written by `cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-wizard_today.ts` (read-only). Zone America/New_York; the phone's day is Saturday 2026-08-29.

## A. The door, the shell and the steps

- One door: **+ Build New Program**, under the cards on the Programs tab (`startWizard`). It makes a new draft, shows the wizard screen at step one, and stores nothing (keys changed: none).
- The draft it opens with: `primaryPath` "body", `cardioTypes` [], `cardioGoals` {}, `eventTargeted` true, `liftingFocus` "balanced", `experience` "intermediate", `ageBracket` "18-35", `equipment` "home_full", `unit` "lbs", `restDays` [], `days` ["sun","mon","tue","wed","thu","fri","sat"], `bench` 0, `squat` 0, `deadlift` 0, `name` "", `startDate` "2026-08-29".
- Back on step one goes to the Programs tab (`showScreen('screenHome')`) and keeps the draft in memory; the next Build New Program makes a new one.

| Path | Steps walked by Continue | The count each shows | The bar's fill | The last button |
|---|---|---|---|---|
| event | 7: primary, profile, equipment, cardio_goal, lifting_focus, days, name | 1/7 2/7 3/7 4/7 5/7 6/7 7/7 | 14% 29% 43% 57% 71% 86% 100% | Generate Program → |
| body | 6: primary, profile, equipment, lifting_focus, days, name | 1/6 2/6 2/6 4/6 5/6 6/6 | 14% 29% 43% 71% 86% 100% | Generate Program → |
| both | 7: primary, profile, equipment, cardio_goal, lifting_focus, days, name | 1/7 2/7 3/7 4/7 5/7 6/7 7/7 | 14% 29% 43% 57% 71% 86% 100% | Generate Program → |

- Every step but the last reads **Continue →**. Continue never refuses: no step checks its answers. The checks are at Generate (section E) and in the rest day toggle (section D).
- The strength path walks 6 steps and never opens the cardio goals; Back from the lifting step skips them too.

## B. What each step draws on the ten seeded programs

Each seeded config is put into the draft whole (as the seeded walks hand it to Generate), then every step is drawn. A seeded config holds values no card of the wizard writes (section G).

| Program | Steps | Cardio goals: forms, and the lines under them | Days | Name: the start, the rows |
|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 7 | run other; set by the longest goal; race plan starts later [run]; no frame on the step | 5 training days, 0 advisories | set by race date (starts later); 11 rows; 14 weeks |
| 5k race, commercial, strength, beginner | 7 | run other; set by the longest goal; race plan starts later [run]; no frame on the step | 6 training days, 0 advisories | set by race date (starts later); 11 rows; 8 weeks |
| 10k race, home basic, hypertrophy, advanced | 7 | run other; set by the longest goal; race plan starts later [run]; no frame on the step | 5 training days, 0 advisories | set by race date (starts later); 11 rows; 8 weeks |
| marathon, crossfit, athletic support, 36-45 | 7 | run other; set by the longest goal; race plan starts later [run]; no frame on the step | 5 training days, at the floor, 0 advisories | set by race date (starts later); 11 rows; 18 weeks |
| 1.5 mile test goal, minimal, fat loss, beginner | 7 | run pace; set by the longest goal; no card on the step; frame hidden | 5 training days, 0 advisories | date field (short first week, 1 day(s)); 10 rows; 11 weeks |
| 1.5 mile test goal, commercial, balanced | 7 | run pace; set by the longest goal; no card on the step; frame hidden | 6 training days, 0 advisories | date field (short first week, 1 day(s)); 10 rows; 11 weeks |
| run base, bodyweight, balanced | 7 | run other; set by the longest goal; no card on the step; no frame on the step | 4 training days, 0 advisories | date field (short first week, 1 day(s)); 10 rows; 9 weeks |
| bike ftp, home full, strength support, advanced | 7 | bike other; set by the longest goal; no card on the step; no frame on the step | 6 training days, 0 advisories | date field (short first week, 1 day(s)); 10 rows; 7 weeks |
| swim 500, commercial, prevention support | 7 | swim swim; set by the longest goal; no card on the step; no frame on the step | 5 training days, 0 advisories | date field (moved to the next Monday); 10 rows; 12 weeks |
| run base and bike base, crossfit, balanced | 7 | run other, bike other; set by the longest goal; no card on the step; no frame on the step | 5 training days, 0 advisories | date field (short first week, 1 day(s)); 10 rows; 9 weeks |

| Kind drawn, on the ten | Count |
|---|---|
| cardio_goal: card under the date: no card on the step | 6 |
| cardio_goal: card under the date: race plan starts later [run] | 4 |
| cardio_goal: date fields | 4 |
| cardio_goal: draws | 10 |
| cardio_goal: form: baseline, bike | 2 |
| cardio_goal: form: baseline, run | 6 |
| cardio_goal: form: run pace goal | 2 |
| cardio_goal: form: swim 500 | 1 |
| cardio_goal: goal options | 63 |
| cardio_goal: length line: set by the longest goal | 10 |
| cardio_goal: mile advisory: none | 8 |
| cardio_goal: mile help: optional, a N mile | 5 |
| cardio_goal: mile help: optional, an N mile | 2 |
| cardio_goal: mile help: required | 1 |
| cardio_goal: number fields | 37 |
| cardio_goal: pace line shown | 2 |
| cardio_goal: pace reach frame hidden | 2 |
| cardio_goal: pace reach no frame on the step | 8 |
| cardio_goal: race block: none (not the race path) | 6 |
| cardio_goal: race block: the date field | 4 |
| cardio_goal: race buttons | 8 |
| cardio_goal: seed banner: none | 10 |
| cardio_goal: sport card, open | 11 |
| cardio_goal: sport card, shut | 19 |
| cardio_goal: swim advisory: none | 1 |
| cardio_goal: swim pace line shown | 1 |
| cardio_goal: the line for more than one sport | 1 |
| cardio_goal: unit buttons (mi, km) | 4 |
| cardio_goal: unit buttons (yd, m) | 2 |
| days: day toggles | 70 |
| days: days locked | 5 |
| days: days resting | 18 |
| days: draws | 10 |
| days: floor box, a goal named | 1 |
| days: no advisory | 10 |
| days: no floor box | 9 |
| equipment: a card chosen | 9 |
| equipment: cards | 50 |
| equipment: draws | 10 |
| lifting_focus: draws | 10 |
| lifting_focus: focus cards | 36 |
| lifting_focus: no add-on box | 10 |
| name: aligned copy: starts later | 4 |
| name: copy under the start: moved to the next Monday | 1 |
| name: copy under the start: short first week, 1 day(s) | 5 |
| name: date fields | 6 |
| name: draws | 10 |
| name: no pips | 4 |
| name: race date row: a date, N away | 4 |
| name: race date row: no row | 6 |
| name: start row: set by race date | 4 |
| name: start row: short first week | 5 |
| name: start row: the date alone | 1 |
| name: start: set by race date | 4 |
| name: start: the date field | 6 |
| name: summary rows | 104 |
| name: text field (the name) | 10 |
| primary: a card chosen | 4 |
| primary: cards | 30 |
| primary: draws | 10 |
| profile: age cards | 30 |
| profile: draws | 10 |
| profile: experience cards | 30 |
| profile: hint lines | 20 |
| profile: hint, Age 18-35: | 8 |
| profile: hint, Age 36-45: | 2 |
| profile: hint, experience advanced | 2 |
| profile: hint, experience beginner | 2 |
| profile: hint, experience intermediate | 6 |
| profile: unit buttons | 20 |

## C. Every kind a step can draw, over a wider set of drafts

Drafts drawn: 3732 on the cardio goals (and 18 more on a phone whose history holds three weeks of logged run paces, for the seed offer), 15104 on the rest days, 638 on the name step, and the small steps at each of their answers. A draft here is set whole; some hold what no walk of taps reaches, and section G says which.

| Kind drawn | Count |
|---|---|
| cardio_goal: card under the date: finishes before race day [run] | 257 |
| cardio_goal: card under the date: less than a week away [red] | 383 |
| cardio_goal: card under the date: no card on the step | 576 |
| cardio_goal: card under the date: peaks on race day [run] | 19 |
| cardio_goal: card under the date: race plan opens in a week [run] | 63 |
| cardio_goal: card under the date: race plan opens in a week, weeks behind [run] | 168 |
| cardio_goal: card under the date: race plan opens in a week, weeks behind, under the floor [signal] | 42 |
| cardio_goal: card under the date: race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal] | 231 |
| cardio_goal: card under the date: race plan starts later [run] | 420 |
| cardio_goal: card under the date: short for this goal [accent] | 43 |
| cardio_goal: card under the date: short for this goal [red] | 154 |
| cardio_goal: card under the date: test before the first training day [signal] | 1 |
| cardio_goal: card under the date: test in week 1, nothing left to train [signal] | 2 |
| cardio_goal: card under the date: test in week 1, nothing left to train, with the reach sentence [signal] | 2 |
| cardio_goal: card under the date: test in week 2 or later [run] | 563 |
| cardio_goal: card under the date: test in week 2 or later, with the reach sentence [accent] | 362 |
| cardio_goal: card under the date: test past the test block [accent] | 84 |
| cardio_goal: card under the date: test this week [accent] | 102 |
| cardio_goal: card under the date: test this week, with the reach sentence [accent] | 67 |
| cardio_goal: card under the date: the date has passed [red] | 211 |
| cardio_goal: date fields | 3174 |
| cardio_goal: draws | 3750 |
| cardio_goal: form: baseline, bike | 92 |
| cardio_goal: form: baseline, run | 1825 |
| cardio_goal: form: baseline, swim | 54 |
| cardio_goal: form: run pace goal | 1529 |
| cardio_goal: form: swim 100 (the 500 row too) | 126 |
| cardio_goal: form: swim 500 | 126 |
| cardio_goal: goal options | 21475 |
| cardio_goal: length line: set by the longest goal | 2524 |
| cardio_goal: length line: the test sets it | 926 |
| cardio_goal: length line: the test sets it (1 week) | 262 |
| cardio_goal: length line: your mile time sets it | 34 |
| cardio_goal: mile advisory: none | 838 |
| cardio_goal: mile advisory: not a real time | 474 |
| cardio_goal: mile advisory: over 25:00 | 474 |
| cardio_goal: mile advisory: required | 146 |
| cardio_goal: mile advisory: the chart's fastest row | 474 |
| cardio_goal: mile advisory: the chart's slowest row | 474 |
| cardio_goal: mile advisory: under 3:00 | 474 |
| cardio_goal: mile help: optional, a N mile | 1223 |
| cardio_goal: mile help: optional, an N mile | 1106 |
| cardio_goal: mile help: required | 1025 |
| cardio_goal: no box under the cards | 4 |
| cardio_goal: number fields | 16307 |
| cardio_goal: open sport with no goal picked | 2 |
| cardio_goal: pace line hidden | 378 |
| cardio_goal: pace line shown | 1151 |
| cardio_goal: pace reach frame hidden | 1425 |
| cardio_goal: pace reach frame: from the level default | 9 |
| cardio_goal: pace reach frame: from the mile entered | 95 |
| cardio_goal: pace reach no frame on the step | 2221 |
| cardio_goal: race block: none (not the race path) | 343 |
| cardio_goal: race block: the date field | 3174 |
| cardio_goal: race block: the holds copy | 181 |
| cardio_goal: race block: the time trial copy | 48 |
| cardio_goal: race buttons | 6806 |
| cardio_goal: seed banner: applied line | 6 |
| cardio_goal: seed banner: none | 3488 |
| cardio_goal: seed banner: the offer | 6 |
| cardio_goal: sport card, open | 3754 |
| cardio_goal: sport card, shut | 7496 |
| cardio_goal: swim advisory: 500 pace faster than the 100 | 18 |
| cardio_goal: swim advisory: none | 90 |
| cardio_goal: swim advisory: not a real time | 36 |
| cardio_goal: swim advisory: required, the 100 | 18 |
| cardio_goal: swim advisory: required, the 500 | 90 |
| cardio_goal: swim pace line hidden | 216 |
| cardio_goal: swim pace line shown | 36 |
| cardio_goal: the line for more than one sport | 4 |
| cardio_goal: unit buttons (mi, km) | 3058 |
| cardio_goal: unit buttons (yd, m) | 504 |
| days: day toggles | 105728 |
| days: days locked | 21147 |
| days: days resting | 52864 |
| days: draws | 15104 |
| days: floor box, a goal named | 7768 |
| days: floor box, three days | 512 |
| days: no advisory | 15104 |
| days: no floor box | 6824 |
| equipment: a card chosen | 5 |
| equipment: cards | 25 |
| equipment: draws | 5 |
| lifting_focus: Lift Only chosen | 1 |
| lifting_focus: a sport chosen | 2 |
| lifting_focus: add-on box (3 sports and Lift Only) | 3 |
| lifting_focus: draws | 9 |
| lifting_focus: focus cards | 33 |
| lifting_focus: no add-on box | 6 |
| name: aligned copy: opens in a week | 5 |
| name: aligned copy: opens in a week, weeks behind | 16 |
| name: aligned copy: opens in a week, weeks behind, under the floor | 12 |
| name: aligned copy: opens in a week, weeks behind, under the floor, the shorter plan link | 32 |
| name: aligned copy: starts later | 55 |
| name: copy under the start: a whole first week | 72 |
| name: copy under the start: moved to the next Monday | 108 |
| name: copy under the start: short first week, 1 day(s) | 72 |
| name: copy under the start: short first week, 2 day(s) | 86 |
| name: copy under the start: short first week, 3 day(s) | 60 |
| name: copy under the start: short first week, 4 day(s) | 60 |
| name: copy under the start: short first week, 5 day(s) | 36 |
| name: copy under the start: short first week, 6 day(s) | 12 |
| name: copy under the start: the week holds the test | 12 |
| name: date fields | 518 |
| name: draws | 638 |
| name: no pips | 55 |
| name: pips | 758 |
| name: pips drawn | 65 |
| name: race date row: a date, N away | 408 |
| name: race date row: a date, behind you | 4 |
| name: race date row: a date, race day | 4 |
| name: race date row: no date set | 92 |
| name: race date row: no row | 130 |
| name: start row: set by race date | 120 |
| name: start row: short first week | 338 |
| name: start row: the date alone | 180 |
| name: start: set by race date | 120 |
| name: start: the date field | 518 |
| name: summary rows | 6888 |
| name: text field (the name) | 638 |
| primary: a card chosen | 3 |
| primary: cards | 9 |
| primary: draws | 3 |
| profile: age cards | 162 |
| profile: draws | 54 |
| profile: experience cards | 162 |
| profile: hint lines | 108 |
| profile: hint, Age 18-35: | 18 |
| profile: hint, Age 36-54: | 18 |
| profile: hint, Age 55+: | 18 |
| profile: hint, experience advanced | 18 |
| profile: hint, experience beginner | 18 |
| profile: hint, experience intermediate | 18 |
| profile: unit buttons | 108 |

The rest day toggle, a tap on each training day of each of those rest day drafts (one lifting focus each):

| What the tap did | Taps |
|---|---|
| refused: "<goals> needs N training days — see why below" | 5873 |
| refused: "Three days is the floor. Two gives you the same session twice." | 308 |
| rested | 9051 |

- The model's words against the page's own markup: in 19633 of 19633 draws every word the Angular model yields is in the page's render of the same draft, and the count and the button read the same.

## D. What each tap reads and writes

On a phone with one program and three weeks of runs logged with a pace (the half-manny config), its day 2026-09-23. "Stored" is every `ia_` key before and after the tap. A typed field is written as its handler writes it.

| Tap | The draft's fields changed | Stored | Keys asked for | The page called | Toast |
|---|---|---|---|---|---|
| Build New Program | `startDate` | nothing | nothing | renderWizardStep 1, showScreen 1 | none |
| A path card (Race / Event) | `primaryPath` | nothing | nothing | renderWizardStep 1 | none |
| Continue | nothing | nothing | nothing | renderWizardStep 1 | none |
| An experience card | `experience` | nothing | nothing | renderWizardStep 1 | none |
| An age card | `ageBracket` | nothing | nothing | renderWizardStep 1 | none |
| kg | `unit` | nothing | nothing | renderWizardStep 1 | none |
| lbs, already chosen | nothing | nothing | nothing | none | none |
| An equipment card | `equipment` | nothing | nothing | renderWizardStep 1 | none |
| Continue into the cardio goals (race path, first time) | `raceDate`, `raceDateWeeks` | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| A sport, opened | `cardioTypes` | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| A goal, the first picked (the seed reader runs once) | `cardioGoals` (run.id, run.label, run.baseline), `_seed` | nothing | `ia_hist_<id>`, `ia_logs_<id>`, `ia_programs` | renderWizardStep 1, updateRaceDateFeedback 1, seedFromPriorPrograms 1 | none |
| Use this data (the seed offer) | `cardioGoals` (run.baseline, run.mileBestMins, run.mileBestSecs, run.mileBestSrc, run.baselineDist), `_seedApplied` | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 2 | none |
| Start fresh (the seed offer) | `_seedDismissed` | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| A goal, changed | `cardioGoals` (run.id, run.label) | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| A sport, shut (its goal goes) | `cardioTypes`, `cardioGoals` (run.id, run.label, run.baseline) | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| The mile, a digit typed | `cardioGoals` (run.mileBestMins, run.mileBestSrc) | nothing | nothing | updateRaceDateFeedback 1, updateMileAdvisory 1 | none |
| How far can you run, a digit typed | `cardioGoals` (run.baseline, run.baselineDist) | nothing | nothing | updateRaceDateFeedback 1 | none |
| Target distance, a digit typed | `cardioGoals` (run.targetDist) | nothing | nothing | updateRaceDateFeedback 1 | none |
| Target time, a digit typed | `cardioGoals` (run.targetMins, run.targetTime) | nothing | nothing | updateRaceDateFeedback 1, updatePaceTime 1 | none |
| mi or km | `cardioGoals` (run.paceUnit) | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| The pace goal's baseline, a digit typed | `cardioGoals` (run.baseline, run.baselineDist) | nothing | nothing | updateRaceDateFeedback 1 | none |
| Swim target time, a digit typed | `cardioGoals` (swim.targetMins, swim.targetTime) | nothing | nothing | updateSwimPaceDisplay 1, updatePaceTime 1 | none |
| Swim current time, a digit typed | `cardioGoals` (swim.baseMins) | nothing | nothing | updateSwimAdvisory 1 | none |
| yd or m | `cardioGoals` (swim.swimUnit) | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| Bike or swim baseline, a digit typed | `cardioGoals` (swim.baseline, swim.baselineDist) | nothing | nothing | none | none |
| ✕ Just building fitness | `eventTargeted`, `raceDate`, `raceDateWeeks` | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| ✓ I have a race date | `eventTargeted`, `raceDate`, `raceDateWeeks` | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 1 | none |
| The race date, a day picked | `raceDate`, `raceDateWeeks` | nothing | nothing | updateRaceDateFeedback 1 | none |
| The shorter plan link (under the floor) | `cardioGoals` (run.id, run.label) | nothing | nothing | renderWizardStep 1, updateRaceDateFeedback 2 | "Switched to the Run a 5K plan ✓" |
| A lifting focus card | `liftingFocus` | nothing | nothing | renderWizardStep 1 | none |
| An add-on sport (strength path) | `cardioTypes` | nothing | nothing | renderWizardStep 1 | none |
| Lift Only | `cardioTypes` | nothing | nothing | renderWizardStep 1 | none |
| A training day, rested | `restDays`, `days` | nothing | nothing | renderWizardStep 1 | none |
| A resting day, back to training | `restDays` | nothing | nothing | renderWizardStep 1 | none |
| A locked day (at the floor) | nothing | nothing | nothing | none | "Three days is the floor. Two gives you the same session twice." |
| Continue into the name step (the default name is made) | `name` | nothing | `ia_programs` | renderWizardStep 1, getPrograms 1 | none |
| The name, a letter typed | `name` | nothing | nothing | none | none |
| The start date, a day picked | `startDate` | nothing | nothing | updateStartResolve 1 | none |
| Back | nothing | nothing | nothing | renderWizardStep 1 | none |
| Back on step one | nothing | nothing | nothing | showScreen 1 | none |

- No tap before Generate stores anything. The draft lives in memory only: leave the app and it is gone.
- Use this data writes the mile ({"fields":["mileBestMins","mileBestSecs","mileBestSrc","baselineDist"],"src":"seeded","runs":4}: the fields it adds to the goal, where the mile is said to come from, and how many runs the reader found) and the longest run as the baseline.
- Two taps read the store: the first draw of a run goal's fields (the seed reader, once per wizard, kept on the draft) and the first draw of the name step with no name (it counts the programs for "Block N").

## E. Generate

**The pop-up.** Generate first asks the length (`calcProgramLength`). When it comes back with a warning, a pop-up stands over the wizard: "Heads Up", "N-Week Program", the warning, "The app will build you a N-week program that safely progresses toward your goal. Stick to the plan and you will get there.", and two buttons, **Go Back** (the wizard again, same step) and **Build N-Week Plan**. Over 366 drafts of one goal each, 265 raise it and 101 do not. Its N is the goal length, not the test week or the race plan's week count. The warning's kinds:

| Warning (numbers as N) | Drafts |
|---|---|
| Calorie Targets needs N weeks from your current base | 6 |
| Century Ride needs N weeks from your current base | 3 |
| Cycling Base needs N weeks from your current base | 6 |
| FTP / Power needs N weeks from your current base | 6 |
| Full Marathon plan — N weeks, fixed | 15 |
| Half Marathon plan — N weeks, fixed | 15 |
| N Time (…) needs N weeks | 12 |
| N Time needs N weeks from your current base | 36 |
| N-Mile Ride needs N weeks from your current base | 6 |
| NK plan — N weeks, fixed | 60 |
| Pace goal (…) needs N weeks | 70 |
| Running Base needs N weeks from your current base | 20 |
| Swim Base needs N weeks from your current base | 4 |
| Swim a Mile needs N weeks from your current base | 4 |
| Triathlon Swim needs N weeks from your current base | 2 |

**The refusals.** After the pop-up (or with none), Generate checks the mile, then the swim times. A refusal is a toast and the wizard again on the step it was on; nothing is stored:

| Refusal | Drafts |
|---|---|
| refused: "Over 25:00 reads as a walk, not a run. Check the entry." | 1 |
| refused: "Required. Enter your most recent timed 500yd." | 2 |
| refused: "Required. Enter your most recent timed mile." | 1 |
| refused: "That is not a real time. Check the minutes and seconds." | 1 |
| refused: "That mile time is not a real time. Check the minutes and seconds." | 1 |
| refused: "Under 3:00 is not a mile time. The world record is 3:43. Check the entry." | 1 |
| refused: "Your 500 pace is faster than your 100 time. Check both entries." | 1 |

**On an empty phone**, the ten seeded configs put into the draft, the name step drawn, then Generate (and Build N-Week Plan where the pop-up stands):

| Program | Pop-up | Keys written | Keys asked for | The page called | Screens | Stored | Dates | The stored cfg |
|---|---|---|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 14 weeks, 98 days, 82803 bytes | start 2026-08-31, opened 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| 5k race, commercial, strength, beginner | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 8 weeks, 56 days, 55644 bytes | start 2026-09-21, opened 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| 10k race, home basic, hypertrophy, advanced | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 8 weeks, 56 days, 48631 bytes | start 2026-10-05, opened 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| marathon, crossfit, athletic support, 36-45 | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 18 weeks, 126 days, 99359 bytes | start 2026-10-26, opened 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| 1.5 mile test goal, minimal, fat loss, beginner | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 11 weeks, 77 days, 65995 bytes | start 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| 1.5 mile test goal, commercial, balanced | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 11 weeks, 77 days, 69483 bytes | start 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| run base, bodyweight, balanced | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 9 weeks, 63 days, 48751 bytes | start 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| bike ftp, home full, strength support, advanced | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 7 weeks, 49 days, 44021 bytes | start 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| swim 500, commercial, prevention support | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 12 weeks, 84 days, 75376 bytes | start 2026-08-31, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |
| run base and bike base, crossfit, balanced | raised | `ia_active` new, `ia_programs` new | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | screenGenerate → screenWeek | 9 weeks, 63 days, 49105 bytes | start 2026-08-29, lands on week 1 (today's is 1) | no startDate in cfg, seed the config's |

**Beside a program with three weeks of history**, a day after its last launch, the same config generated as a second program:

| Program | Keys written | Keys asked for | The page called | Programs stored | Active after |
|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| 5k race, commercial, strength, beginner | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| 10k race, home basic, hypertrophy, advanced | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| marathon, crossfit, athletic support, 36-45 | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| 1.5 mile test goal, minimal, fat loss, beginner | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| 1.5 mile test goal, commercial, balanced | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| run base, bodyweight, balanced | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| bike ftp, home full, strength support, advanced | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| swim 500, commercial, prevention support | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |
| run base and bike base, crossfit, balanced | `ia_active` changed, `ia_programs` changed | `ia_active`, `ia_comp_<new>`, `ia_edits_<new>`, `ia_exw_<new>`, `ia_hist_<new>`, `ia_logs_<new>`, `ia_moves_<new>`, `ia_programs`, `ia_swaps_<new>`, `ia_wild_<new>` | buildProgram 2, savePrograms 1, loadActiveProgram 1, refreshProgram 1, renderWeekView 1, renderProgList 1, showScreen 2 | 2 | the new one |

- **Go Back** on the pop-up (raised: true): the wizard again on step name, the draft kept, stored nothing, no program made (none).
- A first program arms the rest timer's first use note (`_setRtIntroPending`, when the list was empty before); that is held in memory, not stored.
- A build that throws leaves the generating screen up with "Error: " and the error's words, and stores nothing.

The line under the figure, every value the page gave it over these 20 generates (numbers as N). The harness runs each timer once, so the six lines the page cycles at 380 ms show here as the first alone; the code holds the six (`Analyzing your goals...`, `Building cardio progressions...`, `Selecting exercises...`, `Calculating weights...`, `Assembling N weeks...`, `Almost done...`), the build at 2,400 ms, and This Week 600 ms after the ready line:

| Line | Times |
|---|---|
| Analyzing your goals... | 20 |
| Building your N-week program... | 20 |
| Your N-week program is ready! | 20 |

What a stored program holds, over the ten on the empty phone (how many of the ten carry each field):

| Field | Programs |
|---|---|
| cfg: `_raceDateCappedWeeks` | 10 |
| cfg: `_testWeek` | 10 |
| cfg: `ageBracket` | 10 |
| cfg: `bench` | 10 |
| cfg: `cardioGoals` | 10 |
| cfg: `cardioTypes` | 10 |
| cfg: `days` | 10 |
| cfg: `deadlift` | 10 |
| cfg: `equipment` | 10 |
| cfg: `eventTargeted` | 10 |
| cfg: `experience` | 10 |
| cfg: `goal` | 10 |
| cfg: `liftingFocus` | 10 |
| cfg: `name` | 10 |
| cfg: `primaryPath` | 10 |
| cfg: `raceDate` | 4 |
| cfg: `restDays` | 10 |
| cfg: `seed` | 10 |
| cfg: `squat` | 10 |
| cfg: `unit` | 10 |
| program: `_swapUniverseByKey` | 10 |
| program: `_swapUniverse` | 10 |
| program: `blockOpen` | 4 |
| program: `cfg` | 10 |
| program: `created` | 10 |
| program: `goal` | 10 |
| program: `id` | 10 |
| program: `legRecoveryNote` | 10 |
| program: `liftRecoveryWeeks` | 10 |
| program: `liftingFocus` | 10 |
| program: `name` | 10 |
| program: `primaryPath` | 10 |
| program: `raceDateWeeks` | 10 |
| program: `raceDate` | 10 |
| program: `seed` | 10 |
| program: `startDate` | 10 |
| program: `taperWeeks` | 10 |
| program: `totalWeeks` | 10 |
| program: `weeks` | 10 |

## F. The WebKit controls the wizard uses

Counted in the Angular screen's template (`frontends/app/src/app/screens/wizard/wizard.ts`), which is what today's iOS app draws:

| Control | In the template | Where | What it hands back, and when |
|---|---|---|---|
| `<input type="date">` | 2 | the race date (cardio goals, race path, "I have a race date"), `min` today, its value an attribute, on `input`; the start date (name step, when no race sets it), no `min`, its value a property, on `change` | a `YYYY-MM-DD` string, or blank |
| `<input type="number">` | 8 | the cardio goal forms: minutes and seconds pairs, a distance, a baseline; one is read only (the swim distance) | the typed text as a string, on every `input`; `min`, `max` and `step` are on the tag |
| `<input type="text">` | 1 | the program's name, `maxlength` 40 | the text, on every `input` |
| `<select>` | 0 | none | |
| `<textarea>` | 0 | none | |
| `<button>` | 12 | Back, the last button, the unit pairs, the race pair, the seed offer's two | a tap |
| a link written into copy | 1 | "The 5K plan fits this window better" under a race date below the plan's floor (`offerShorterPlan`), in the card under the date and under a start set by race date | a tap |

Number fields drawn at once, by form: the swim 500 form 5 (one read only), the swim 100 form 7, the run pace goal 6, a run goal with only a baseline 3 (the baseline and the mile's pair), a bike or swim baseline 1.

## G. Found by this measure, and what no walk of taps reaches

**The rest day step's advisory box is never drawn.** The step draws its advisories (lifting days, cardio goal days, interval days) only above the floor of training days. Over every set of goals a path offers, each lifting focus and each count of training days (18112 states), the advisories come back in 8648 and the count is above the floor in 8392, and never both: 0 states draw the box. Each advisory asks for a number of days no higher than the floor already locks. Today's behaviour; the beta's model keeps the branch, and no walk of taps can draw it.

**Hybrid with Run a 5K or Run a 10K builds a race plan whose race is today.** The cardio goals step gives every draft a race date of today when it has none (so the race path's card shows on first open), and the draft opens with "I have a race date" on. The hybrid path draws no race date control, so nothing there can change either. A race plan counts back from its race date on the hybrid path as on the race path:

| Goal, by taps from Build New Program | The draft after the cardio goals | The name step | The stored program | Today is |
|---|---|---|---|---|
| Run a 5K | `raceDate` 2026-08-29, `eventTargeted` true | start Mon, Jul 6, 2026, set by race date; "Your 5K is Sat, Aug 29 , 0 weeks out. The 8-week plan starts Mon, Jul 6 so race week is week 8. You open in week 8 . Weeks 1–7 are behind you: shown, not counted, not missed. Race day pins to Saturday . I don’t recommend under 4 weeks for the 5K." | 8 weeks from 2026-07-06, opened 2026-08-29, race date 2026-08-29 | week 8 of 8 |
| Run a 10K | `raceDate` 2026-08-29, `eventTargeted` true | start Mon, Jul 6, 2026, set by race date; "Your 10K is Sat, Aug 29 , 0 weeks out. The 8-week plan starts Mon, Jul 6 so race week is week 8. You open in week 8 . Weeks 1–7 are behind you: shown, not counted, not missed. Race day pins to Saturday . I don’t recommend under 4 weeks for the 10K. The 5K plan fits this window better." | 8 weeks from 2026-07-06, opened 2026-08-29, race date 2026-08-29 | week 8 of 8 |

Reached by taps alone: Hybrid, then Running, then the goal, then Continue to the end. The race path with "Just building fitness" is the one that says it runs the full plan to a time trial. Not ruled and not fixed here: the beta is held equal to it.

**What the ten seeded configs hold that no card of the wizard writes.** The wizard writes no seed (the engine makes one from the clock), no lift numbers (the draft keeps three zeros), a path of event, body or both, one of three ages and one of five equipments, and each goal's label from its own table:

| Program | Not reachable by taps |
|---|---|
| half-manny (Mario, NRC half, crossfit) | a seed, lift numbers |
| 5k race, commercial, strength, beginner | a seed, lift numbers, run label "5K" |
| 10k race, home basic, hypertrophy, advanced | a seed, lift numbers, run label "10K" |
| marathon, crossfit, athletic support, 36-45 | age "36-45", a seed, lift numbers, run label "Marathon" |
| 1.5 mile test goal, minimal, fat loss, beginner | path "fitness", equipment "minimal", a seed, lift numbers |
| 1.5 mile test goal, commercial, balanced | path "fitness", a seed, lift numbers |
| run base, bodyweight, balanced | path "fitness", age "36-45", a seed, lift numbers, run label "Base" |
| bike ftp, home full, strength support, advanced | path "fitness", a seed, lift numbers, bike label "FTP" |
| swim 500, commercial, prevention support | path "fitness", a seed, lift numbers, swim label "500" |
| run base and bike base, crossfit, balanced | path "fitness", a seed, lift numbers, run label "Base", bike label "Base" |

Every draw was named: yes (no draw fell outside the kinds this script names).

**Kinds the builders hold that no draft of section C drew** (of 19 looked for by name): "card under the date: card empty", "race plan opens in a week, under the floor", "mile help: optional, bare", "advisory: lifting days", "advisory: cardio goal days", "advisory: interval days, one sport", "advisory: interval days, sports sharing", "race date row: a date alone", "set by the longest goal (1 week)".

## H. On the simulator's copy of Mario's backup (counts only)

Read by a scratch script from a copy of the simulator's store (2026-11-20, the store's hash 278ba57f3f6a382b before and after, the hash the last session left; nothing was written to it), every walk on a phone of its own in the VM harness. The numbers below are the ones that script printed.

- 36 `ia_` keys; 3 programs, 1 of them archived; one is active.
- Build New Program, then Continue to the end on each path with the draft as it opens: 7 steps on the race path, 6 on the strength path, 7 on the hybrid path. The default name ends "Block 4": the stored programs plus one, the archived one counted.
- The seed offer is not drawn on a run goal: the reader finds no seed there (it wants three recovery runs logged with a pace inside its window).
- All of that stores nothing.
- A lift only program made by taps alone, on a phone of its own: no pop-up; `ia_active` and `ia_programs` change and the other 34 of the 36 keys do not; 3 programs become 4; the new one is active; the 3 programs already stored are the same to the byte after.

