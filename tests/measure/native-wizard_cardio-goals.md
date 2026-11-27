# Today's cardio goals step, by taps (measure, before the Expo app draws it)

Written by `cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-wizard_cardio-goals.ts` (read-only). Zone America/New_York; the phone's day is Saturday 2026-08-29. `tests/measure/native-wizard_today.md` is the before-picture of the whole wizard, from drafts set whole. Every handler run here is read out of the markup the page wrote: an `onclick`, an `oninput`.

## A. Every goal's form

**The race path.** The draft as the step first draws: {"cardioTypes":[],"cardioGoals":{},"eventTargeted":true,"raceDate":"2026-08-29"}; number fields 0, goal options 0, box under the cards not drawn.

| Sport | Goal | Form | Number fields (key, placeholder, min, max, step) | Buttons | Mile help | Mile advisory | Swim advisory | Length line | Card under the date | Pace reach |
|---|---|---|---|---|---|---|---|---|---|---|
| run | Run a 5K (`run_5k`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| run | Run a 10K (`run_10k`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| run | Half Marathon (`run_half`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| run | Full Marathon (`run_marathon`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| run | Hit a Pace / Time Goal (`run_pace_goal`) | run pace goal | `targetDist` "e.g. 1.5" 0.1/–/0.1; `targetMins` "min" 0/99/–; `targetSecs` "sec" 0/59/–; `baselineDist` "e.g. 1.5" 0/–/0.1; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | mi, km | required | required | no swim times | the test sets it (1 week) | test this week [accent] | frame hidden |
| run | Build Running Base (`run_base`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| bike | Century Ride (100mi) (`bike_century`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| bike | 50-Mile Ride (`bike_50`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| bike | Improve FTP / Power (`bike_ftp`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| bike | Hit Calorie Targets (`bike_cals`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| bike | Build Cycling Base (`bike_base`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| swim | Triathlon Swim (`swim_tri`) | baseline, swim | `baselineDist` "e.g. 400" 0/–/50 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| swim | Swim a Mile (`swim_mile`) | baseline, swim | `baselineDist` "e.g. 400" 0/–/50 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |
| swim | Improve 100 Time (`swim_100_time`) | swim 100 (the 500 row too) | `(read only)` "" –/–/–; `targetMins` "min" 0/99/–; `targetSecs` "sec" 0/59/–; `baseMins` "min" 0/99/–; `baseSecs` "sec" 0/59/–; `base500Mins` "min" 0/99/–; `base500Secs` "sec" 0/59/– | yd, m | no mile field | no mile field | required, the 500 | set by the longest goal | less than a week away [red] | no frame on the step |
| swim | Improve 500 Time (`swim_500_time`) | swim 500 | `(read only)` "" –/–/–; `targetMins` "min" 0/99/–; `targetSecs` "sec" 0/59/–; `baseMins` "min" 0/99/–; `baseSecs` "sec" 0/59/– | yd, m | no mile field | no mile field | required, the 500 | set by the longest goal | less than a week away [red] | no frame on the step |
| swim | Build Swim Base (`swim_base`) | baseline, swim | `baselineDist` "e.g. 400" 0/–/50 | none | no mile field | no mile field | no swim times | set by the longest goal | less than a week away [red] | no frame on the step |

- Goals offered: run 6, bike 5, swim 5 (16). Stored by all of it: nothing.
- The race date block: drawn once a sport is open and a goal is held.

**The hybrid path.** The draft as the step first draws: {"cardioTypes":[],"cardioGoals":{},"eventTargeted":true,"raceDate":"2026-08-29"}; number fields 0, goal options 0, box under the cards not drawn.

| Sport | Goal | Form | Number fields (key, placeholder, min, max, step) | Buttons | Mile help | Mile advisory | Swim advisory | Length line | Card under the date | Pace reach |
|---|---|---|---|---|---|---|---|---|---|---|
| run | Run a 5K (`run_5k`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | no card on the step | no frame on the step |
| run | Run a 10K (`run_10k`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | no card on the step | no frame on the step |
| run | Hit a Pace / Time Goal (`run_pace_goal`) | run pace goal | `targetDist` "e.g. 1.5" 0.1/–/0.1; `targetMins` "min" 0/99/–; `targetSecs` "sec" 0/59/–; `baselineDist` "e.g. 1.5" 0/–/0.1; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | mi, km | required | required | no swim times | the test sets it (1 week) | no card on the step | frame hidden |
| run | Build Running Base (`run_base`) | baseline, run | `baselineDist` "e.g. 3" 0/–/0.5; `mileBestMins` "min" 3/20/–; `mileBestSecs` "sec" 0/59/– | none | optional, a N mile | none | no swim times | set by the longest goal | no card on the step | no frame on the step |
| bike | 50-Mile Ride (`bike_50`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | no card on the step | no frame on the step |
| bike | Improve FTP / Power (`bike_ftp`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | no card on the step | no frame on the step |
| bike | Hit Calorie Targets (`bike_cals`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | no card on the step | no frame on the step |
| bike | Build Cycling Base (`bike_base`) | baseline, bike | `baselineDist` "e.g. 20" 0/–/0.5 | none | no mile field | no mile field | no swim times | set by the longest goal | no card on the step | no frame on the step |
| swim | Swim a Mile (`swim_mile`) | baseline, swim | `baselineDist` "e.g. 400" 0/–/50 | none | no mile field | no mile field | no swim times | set by the longest goal | no card on the step | no frame on the step |
| swim | Improve 100 Time (`swim_100_time`) | swim 100 (the 500 row too) | `(read only)` "" –/–/–; `targetMins` "min" 0/99/–; `targetSecs` "sec" 0/59/–; `baseMins` "min" 0/99/–; `baseSecs` "sec" 0/59/–; `base500Mins` "min" 0/99/–; `base500Secs` "sec" 0/59/– | yd, m | no mile field | no mile field | required, the 500 | set by the longest goal | no card on the step | no frame on the step |
| swim | Improve 500 Time (`swim_500_time`) | swim 500 | `(read only)` "" –/–/–; `targetMins` "min" 0/99/–; `targetSecs` "sec" 0/59/–; `baseMins` "min" 0/99/–; `baseSecs` "sec" 0/59/– | yd, m | no mile field | no mile field | required, the 500 | set by the longest goal | no card on the step | no frame on the step |
| swim | Build Swim Base (`swim_base`) | baseline, swim | `baselineDist` "e.g. 400" 0/–/50 | none | no mile field | no mile field | no swim times | set by the longest goal | no card on the step | no frame on the step |

- Goals offered: run 4, bike 4, swim 4 (12). Stored by all of it: nothing.
- The race date block: never drawn on this path.

- The hybrid path offers every goal of the race path but 4: Half Marathon, Full Marathon, Century Ride (100mi), Triathlon Swim.
- Each goal picked alone, 28 picks over the two paths, each kind its first draw holds:

| Kind, as a goal is first picked | Count |
|---|---|
| card under the date: less than a week away [red] | 15 |
| card under the date: no card on the step | 12 |
| card under the date: test this week [accent] | 1 |
| form: baseline, bike | 9 |
| form: baseline, run | 8 |
| form: baseline, swim | 5 |
| form: run pace goal | 2 |
| form: swim 100 (the 500 row too) | 2 |
| form: swim 500 | 2 |
| length line: set by the longest goal | 26 |
| length line: the test sets it (1 week) | 2 |
| mile advisory: no mile field | 18 |
| mile advisory: none | 8 |
| mile advisory: required | 2 |
| mile help: no mile field | 18 |
| mile help: optional, a N mile | 8 |
| mile help: required | 2 |
| number fields | 74 |
| pace reach: frame hidden | 2 |
| pace reach: no frame on the step | 26 |
| swim advisory: no swim times | 24 |
| swim advisory: required, the 500 | 4 |

- A goal picked over another keeps every field the first one wrote: after the pace goal's six fields are typed, Running Base holds 11 of the 11 keys (`id`, `label`, `baseline`, `targetDist`, `targetMins`, `targetTime`, `targetSecs`, `baselineDist`, `mileBestMins`, `mileBestSrc`, `mileBestSecs`), its `id` and `label` alone changed. The fields its own form shows are filled from them: `baselineDist` "2", `mileBestMins` "8", `mileBestSecs` "15".
- A sport shut and opened again holds no goal: {}, number fields 0.

## B. Every number field: what a typed value writes, and what it leaves stale

Each field of each form is typed into from two states, the form as first picked and the form filled, one value at a time. After each value the draft is read, then every line of the step is read as the page shows it and again after a whole draw of the same draft: a line that differs is one the field's handler did not repaint (stale until the next whole draw).

| Field | Values typed | The draft's fields it writes | Lines its handler changed | Lines it left stale (times) |
|---|---|---|---|---|
| baseline, bike: `baselineDist` | 140 | baseline, baselineDist | none | progLenLine (55) |
| baseline, run: `baselineDist` | 280 | baseline, baselineDist | progLenLine | none |
| baseline, run: `mileBestMins` | 280 | mileBestMins, mileBestSrc | mileAdvisory | none |
| baseline, run: `mileBestSecs` | 280 | mileBestSecs | mileAdvisory | none |
| baseline, swim: `baselineDist` | 84 | baseline, baselineDist | none | progLenLine (11) |
| run pace goal: `baselineDist` | 56 | baseline, baselineDist | none | none |
| run pace goal: `mileBestMins` | 56 | mileBestMins, mileBestSrc | mileAdvisory, raceDateFeedback | none |
| run pace goal: `mileBestSecs` | 56 | mileBestSecs | mileAdvisory, raceDateFeedback | none |
| run pace goal: `targetDist` | 56 | targetDist | paceDisplayLine, raceDateFeedback | none |
| run pace goal: `targetMins` | 56 | targetMins, targetTime | paceDisplayLine, raceDateFeedback | none |
| run pace goal: `targetSecs` | 56 | targetSecs, targetTime | paceDisplayLine, raceDateFeedback | none |
| swim 100 (the 500 row too): `base500Mins` | 28 | base500Mins | swimAdvisory | none |
| swim 100 (the 500 row too): `base500Secs` | 28 | base500Secs | swimAdvisory | none |
| swim 100 (the 500 row too): `baseMins` | 28 | baseMins | swimAdvisory | progLenLine (2) |
| swim 100 (the 500 row too): `baseSecs` | 28 | baseSecs | swimAdvisory | progLenLine (4) |
| swim 100 (the 500 row too): `targetMins` | 28 | targetMins, targetTime | swimPaceLine | progLenLine (5) |
| swim 100 (the 500 row too): `targetSecs` | 28 | targetSecs, targetTime | swimPaceLine | progLenLine (5) |
| swim 500: `baseMins` | 28 | baseMins | swimAdvisory | progLenLine (4) |
| swim 500: `baseSecs` | 28 | baseSecs | swimAdvisory | none |
| swim 500: `targetMins` | 28 | targetMins, targetTime | swimPaceLine | progLenLine (7) |
| swim 500: `targetSecs` | 28 | targetSecs, targetTime | swimPaceLine | progLenLine (3) |

- 1680 values typed; 96 of them left at least one line stale. Stored by all of it: nothing.
- A value is written as typed, a string, with no clamp: the field's `min`, `max` and `step` are on the tag and nothing in the handler reads them.

| Kind, after a typed value | Count |
|---|---|
| card under the date: less than a week away [red] | 1344 |
| card under the date: test this week [accent] | 199 |
| card under the date: test this week, with the reach sentence [accent] | 137 |
| length line: set by the longest goal | 1344 |
| length line: the test sets it (1 week) | 336 |
| mile advisory: no mile field | 504 |
| mile advisory: none | 828 |
| mile advisory: not a real time | 36 |
| mile advisory: over 25:00 | 120 |
| mile advisory: required | 72 |
| mile advisory: the chart's fastest row | 24 |
| mile advisory: the chart's slowest row | 24 |
| mile advisory: under 3:00 | 72 |
| pace line: hidden | 172 |
| pace line: not on the form | 1344 |
| pace line: shown | 164 |
| pace reach: frame hidden | 336 |
| pace reach: no frame on the step | 1344 |
| swim advisory: 500 pace faster than the 100 | 17 |
| swim advisory: no swim times | 1400 |
| swim advisory: none | 135 |
| swim advisory: not a real time | 18 |
| swim advisory: required, the 100 | 21 |
| swim advisory: required, the 500 | 89 |
| swim pace line: hidden | 94 |
| swim pace line: not on the form | 1400 |
| swim pace line: shown | 186 |

## C. The race date, by taps

22 forms on the race path (each goal as first picked, and the pace goal filled six ways, two of them with the start date first set on the name step), each with 24 days picked, from -3 to 210 days from today: 528 picks. A pick writes `raceDate` and, when the day reads, `raceDateWeeks` (528 of 528), then repaints the length line, the pace line, the pace reach frame and the card. Stored by all of it: nothing.

| The card under the date, after a pick | Picks |
|---|---|
| finishes before race day [run] | 78 |
| less than a week away [red] | 60 |
| peaks on race day [run] | 10 |
| race plan opens in a week [run] | 3 |
| race plan opens in a week, weeks behind [run] | 15 |
| race plan opens in a week, weeks behind, under the floor [signal] | 5 |
| race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal] | 25 |
| race plan starts later [run] | 28 |
| short for this goal [accent] | 21 |
| short for this goal [red] | 100 |
| test before the first training day [signal] | 8 |
| test in week 2 or later [run] | 40 |
| test in week 2 or later, with the reach sentence [accent] | 90 |
| test past the test block [accent] | 7 |
| test this week [accent] | 4 |
| test this week, with the reach sentence [accent] | 12 |
| the date has passed [red] | 22 |

| The length line, after a pick | Picks |
|---|---|
| set by the longest goal | 380 |
| the test sets it | 130 |
| the test sets it (1 week) | 16 |
| your mile time sets it | 2 |

| The pace reach frame, after a pick | Picks |
|---|---|
| frame hidden | 168 |
| no frame on the step | 360 |

| The buttons and a blank field, on each of the 22 forms | Forms |
|---|---|
| I have a race date, after it: raceDate today, raceDateWeeks 0, the card less than a week away [red] | 15 |
| I have a race date, after it: raceDate today, raceDateWeeks 0, the card test before the first training day [signal] | 2 |
| I have a race date, after it: raceDate today, raceDateWeeks 0, the card test this week [accent] | 2 |
| I have a race date, after it: raceDate today, raceDateWeeks 0, the card test this week, with the reach sentence [accent] | 3 |
| I have a race date, already chosen: the step drawn again, raceDate today | 22 |
| Just building fitness: raceDate "", raceDateWeeks null, the field gone, copy "Program builds to peak fitness and holds. Pick a race when ready." | 20 |
| Just building fitness: raceDate "", raceDateWeeks null, the field gone, copy "Runs the full N-week NK plan and finishes with a NK time trial in place of race day." | 2 |
| a blank from the field (handed back by no tap, section J): raceDate "", raceDateWeeks kept from the last pick, the card card empty | 22 |
| a blank from the field, then a whole draw: raceDate today, the card less than a week away [red] | 15 |
| a blank from the field, then a whole draw: raceDate today, the card test before the first training day [signal] | 2 |
| a blank from the field, then a whole draw: raceDate today, the card test this week [accent] | 2 |
| a blank from the field, then a whole draw: raceDate today, the card test this week, with the reach sentence [accent] | 3 |

## D. The shorter plan link

The link is in the card under the date (and under a start set by a race date, section F). Of the 528 picks above it was offered on 25, each tapped:

| Form → the goal it switches to: the card after | Taps |
|---|---|
| Full Marathon → run_half: then race plan opens in a week, weeks behind [run] | 6 |
| Full Marathon → run_half: then race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal] | 7 |
| Half Marathon → run_10k: then race plan opens in a week, weeks behind [run] | 2 |
| Half Marathon → run_10k: then race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal] | 5 |
| Run a 10K → run_5k: then race plan opens in a week, weeks behind, under the floor [signal] | 5 |

| Form | Day picked | Switches to | The draft's fields changed | Toast | The card after |
|---|---|---|---|---|---|
| Run a 10K | 2026-09-05 (7 days) | `run_5k` | id, label | ["Switched to the Run a 5K plan ✓"] | race plan opens in a week, weeks behind, under the floor [signal] |
| Run a 10K | 2026-09-06 (8 days) | `run_5k` | id, label | ["Switched to the Run a 5K plan ✓"] | race plan opens in a week, weeks behind, under the floor [signal] |
| Run a 10K | 2026-09-08 (10 days) | `run_5k` | id, label | ["Switched to the Run a 5K plan ✓"] | race plan opens in a week, weeks behind, under the floor [signal] |
| Half Marathon | 2026-09-05 (7 days) | `run_10k` | id, label | ["Switched to the Run a 10K plan ✓"] | race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal] |
| Full Marathon | 2026-09-05 (7 days) | `run_half` | id, label | ["Switched to the Half Marathon plan ✓"] | race plan opens in a week, weeks behind, under the floor, the shorter plan offered [signal] |

## E. The seed offer

On a phone with one program and three weeks of runs logged with a pace (12 runs; the first measure's phone), its day 2026-09-23, each goal of each path picked alone in a wizard of its own (28 goals): the offer is drawn on 10, every run goal, and on no bike or swim goal. On a phone with no program the reader finds nothing (`_seed` null) and no banner is drawn.

| What was drawn or done | Count |
|---|---|
| Start fresh: then none, writes _seedDismissed | 10 |
| Use this data: then applied line | 10 |
| after Start fresh, the goal picked again: none | 10 |
| bike goal, on a phone with logged recovery runs: none | 9 |
| run goal, on a phone with logged recovery runs: the offer | 10 |
| swim goal, on a phone with logged recovery runs: none | 9 |

- Run a 5K (event): the reader ran at the goal's first draw (`_seed` unset before); the offer reads "Recent logs found: N recovery runs, avg N/mi, longest run N mi over your last N weeks."; Use this data writes baseline, mileBestMins, mileBestSecs, mileBestSrc, baselineDist, _seedApplied (mile 8:17, source {"kind":"seeded","prog":"<the program's name>","n":4}, baseline "7.4mi"); lines changed: none.
- Run a 10K (event): the reader ran at the goal's first draw (`_seed` unset before); the offer reads "Recent logs found: N recovery runs, avg N/mi, longest run N mi over your last N weeks."; Use this data writes baseline, mileBestMins, mileBestSecs, mileBestSrc, baselineDist, _seedApplied (mile 8:17, source {"kind":"seeded","prog":"<the program's name>","n":4}, baseline "7.4mi"); lines changed: none.
- The seed is read once per wizard: it is kept on the draft (`_seed`), with `_seedApplied` and `_seedDismissed`. Section F says what Generate does with the three.

## F. After the cardio goals: the name step, the pop-up, the refusals, what is stored

114 walks by taps from Build New Program: each goal of the race path with a race day 0, 10, 28, 56, 119 days out and with Just building fitness, each goal of the hybrid path, and each goal that asks for times once more with its fields left blank. Each is taken to the name step, then Generate, then Build on the pop-up; 108 built a program.

| What the name step drew, and what was built | Walks |
|---|---|
| built: keys changed ia_active, ia_programs | 108 |
| built: start resolved, today | 86 |
| built: start set by race date (blockOpen written), behind today | 17 |
| built: start set by race date (blockOpen written), in the future | 5 |
| name step, race date row: a date, N away | 67 |
| name step, race date row: a date, race day | 16 |
| name step, race date row: no date set | 16 |
| name step, race date row: no row | 15 |
| name step, start: set by race date, opens in a week, pips | 1 |
| name step, start: set by race date, opens in a week, weeks behind, pips | 3 |
| name step, start: set by race date, opens in a week, weeks behind, under the floor, pips | 3 |
| name step, start: set by race date, opens in a week, weeks behind, under the floor, the shorter plan link, pips | 10 |
| name step, start: set by race date, starts later, no pips | 5 |
| name step, start: the date field, a short first week | 92 |
| the shorter plan link under the start, tapped: writes id, label, toast ["Switched to the Run a 10K plan ✓"], still on name | 2 |
| the shorter plan link under the start, tapped: writes id, label, toast ["Switched to the Run a 5K plan ✓"], still on name | 2 |

| The pop-up at Generate | Walks |
|---|---|
| hybrid path: Calorie Targets needs N weeks from your current base | 1 |
| hybrid path: Cycling Base needs N weeks from your current base | 1 |
| hybrid path: FTP / Power needs N weeks from your current base | 1 |
| hybrid path: N Time (…) needs N weeks | 2 |
| hybrid path: N Time needs N weeks from your current base | 1 |
| hybrid path: N-Mile Ride needs N weeks from your current base | 1 |
| hybrid path: NK plan — N weeks, fixed | 2 |
| hybrid path: Pace goal (…) needs N weeks | 1 |
| hybrid path: Running Base needs N weeks from your current base | 1 |
| hybrid path: Swim Base needs N weeks from your current base | 1 |
| hybrid path: Swim a Mile needs N weeks from your current base | 1 |
| hybrid path: no pop-up | 2 |
| race path: Calorie Targets needs N weeks from your current base | 6 |
| race path: Century Ride needs N weeks from your current base | 6 |
| race path: Cycling Base needs N weeks from your current base | 6 |
| race path: FTP / Power needs N weeks from your current base | 6 |
| race path: Full Marathon plan — N weeks, fixed | 6 |
| race path: Half Marathon plan — N weeks, fixed | 6 |
| race path: N Time (…) needs N weeks | 12 |
| race path: N Time needs N weeks from your current base | 1 |
| race path: N-Mile Ride needs N weeks from your current base | 6 |
| race path: NK plan — N weeks, fixed | 12 |
| race path: Pace goal (…) needs N weeks | 6 |
| race path: Running Base needs N weeks from your current base | 6 |
| race path: Swim Base needs N weeks from your current base | 6 |
| race path: Swim a Mile needs N weeks from your current base | 6 |
| race path: Triathlon Swim needs N weeks from your current base | 6 |
| race path: no pop-up | 2 |

| Refused by toast, nothing stored | Walks |
|---|---|
| refused: "Required. Enter your most recent timed 500yd." | 4 |
| refused: "Required. Enter your most recent timed mile." | 2 |

| What the stored config holds, over the 108 built | Programs |
|---|---|
| cfg: `_raceDateCappedWeeks` | 108 |
| cfg: `_seed` | 40 |
| cfg: `_testWeek` | 108 |
| cfg: `eventTargeted` | 108 |
| cfg: `raceDateWeeks` | 96 |
| cfg: `raceDate` | 108 |
| goal: `base500Mins` | 7 |
| goal: `base500Secs` | 7 |
| goal: `baseMins` | 14 |
| goal: `baseSecs` | 14 |
| goal: `baselineDist` | 7 |
| goal: `baseline` | 108 |
| goal: `id` | 108 |
| goal: `label` | 108 |
| goal: `mileBestMins` | 7 |
| goal: `mileBestSecs` | 7 |
| goal: `mileBestSrc` | 7 |
| goal: `targetDist` | 7 |
| goal: `targetMins` | 21 |
| goal: `targetSecs` | 21 |
| goal: `targetTime` | 21 |

- With the seed applied (Running Base on the hybrid path, on the phone with logged runs), the stored config holds `_seed`, `_seedApplied`; the goal holds `id`, `label`, `baseline`, `mileBestMins`, `mileBestSecs`, `mileBestSrc`, `baselineDist`.

## G. The ten seeded programs, their cardio goals walked by taps

Last session the seeded configs were put into the draft whole. Here each is put in with no sport, no goal and no race date, on the cardio goals step, and its goals are then made by taps: the sport, the goal, each field the seeded goal holds that the form shows, the unit, the race date or Just building fitness. The walked draft is then held against the seeded config, and both are generated on phones of their own.

| Program | Taps | The walked draft differs from the seeded config in | The built program |
|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 6 | run.baseline (walked "5 mi", seeded "5mi"); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined) | the same grid, length, start and taper as the seeded one's |
| 5k race, commercial, strength, beginner | 6 | run.label (walked "Run a 5K", seeded "5K"); run.baseline (walked "3 mi", seeded "3mi"); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined) | the same grid, length, start and taper as the seeded one's |
| 10k race, home basic, hypertrophy, advanced | 6 | run.label (walked "Run a 10K", seeded "10K"); run.baseline (walked "4 mi", seeded "4mi"); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined) | the same grid, length, start and taper as the seeded one's |
| marathon, crossfit, athletic support, 36-45 | 6 | run.label (walked "Full Marathon", seeded "Marathon"); run.baseline (walked "8 mi", seeded "8mi"); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined) | the same grid, length, start and taper as the seeded one's |
| 1.5 mile test goal, minimal, fat loss, beginner | 7 | run.baseline (walked "", seeded undefined); run.targetTime (walked "12:00", seeded undefined); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined); run.paceUnit (walked undefined, seeded "mi") | the same grid, length, start and taper as the seeded one's |
| 1.5 mile test goal, commercial, balanced | 7 | run.baseline (walked "", seeded undefined); run.targetTime (walked "12:00", seeded undefined); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined); run.paceUnit (walked undefined, seeded "mi") | the same grid, length, start and taper as the seeded one's |
| run base, bodyweight, balanced | 5 | run.label (walked "Build Running Base", seeded "Base"); run.baseline (walked "2 mi", seeded "2mi"); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined) | the same grid, length, start and taper as the seeded one's |
| bike ftp, home full, strength support, advanced | 2 | bike.label (walked "Improve FTP / Power", seeded "FTP"); bike.baseline (walked "", seeded undefined); bike.ftp (walked undefined, seeded "200") | the same grid, length, start and taper as the seeded one's |
| swim 500, commercial, prevention support | 6 | swim.label (walked "Improve 500 Time", seeded "500"); swim.baseline (walked "", seeded undefined); swim.targetTime (walked "9:00", seeded undefined); swim.swimUnit (walked undefined, seeded "yd") | the same grid, length, start and taper as the seeded one's |
| run base and bike base, crossfit, balanced | 7 | run.label (walked "Build Running Base", seeded "Base"); run.baseline (walked "2 mi", seeded "2mi"); run.mileBestSrc (walked {"kind":"entered"}, seeded undefined); bike.label (walked "Build Cycling Base", seeded "Base"); bike.baseline (walked "", seeded undefined) | the same grid, length, start and taper as the seeded one's |

- 10 of 10 walked drafts build the seeded program's grid, length, start and taper.

## H. The lines no walk above drew: the pace reach frame, the mile help by level, a week that holds the test

270 more draws by taps: the pace goal on the race path with Just building fitness and on the hybrid path, at each level and two ages, five targets and four miles; each run goal's mile help at each level; and the race path's pace goal with today, then today and tomorrow, then three days rested on the rest day step before a race day is picked.

| What was drawn | Draws |
|---|---|
| hybrid path: length line the test sets it (1 week) | 120 |
| hybrid path: pace reach frame hidden | 44 |
| hybrid path: pace reach frame: from the level default | 10 |
| hybrid path: pace reach frame: from the mile entered | 66 |
| mile help, as a run goal is picked: optional, a N mile | 32 |
| mile help, as a run goal is picked: optional, an N mile | 20 |
| mile help, as a run goal is picked: required | 8 |
| race path, Just building fitness: length line set by the longest goal | 100 |
| race path, Just building fitness: length line your mile time sets it | 20 |
| race path, Just building fitness: pace reach frame hidden | 44 |
| race path, Just building fitness: pace reach frame: from the level default | 10 |
| race path, Just building fitness: pace reach frame: from the mile entered | 66 |
| race path, sat and sun and mon rested, a day picked: card test in week 1, nothing left to train, with the reach sentence [signal] | 2 |
| race path, sat and sun and mon rested, a day picked: card test in week 2 or later, with the reach sentence [accent] | 1 |
| race path, sat and sun and mon rested, a day picked: card test this week, with the reach sentence [accent] | 7 |
| race path, sat and sun rested, a day picked: card test in week 1, nothing left to train, with the reach sentence [signal] | 2 |
| race path, sat and sun rested, a day picked: card test in week 2 or later, with the reach sentence [accent] | 1 |
| race path, sat and sun rested, a day picked: card test this week, with the reach sentence [accent] | 7 |
| race path, sat rested, a day picked: card test in week 2 or later, with the reach sentence [accent] | 8 |
| race path, sat rested, a day picked: card test this week, with the reach sentence [accent] | 2 |

## I. Found by this measure

**Hit a Pace / Time Goal with no race date picked builds a one week program.** The step gives every draft a race date of today (the first measure's finding on the 5K and the 10K). A pace goal with a race date is a dated test, and a test dated today pins the program to its test week. On the race path the date field and its card are on the screen. On the hybrid path nothing draws either; the length line alone says it. By taps from Build New Program, Running, Hit a Pace / Time Goal, Continue to the end, Generate:

| Path, the goal | The draft's race date | The length line on the step | The pop-up's title | Built |
|---|---|---|---|---|
| Hybrid, its six fields typed | 2026-08-29, `eventTargeted` true | Program length: 1 week. Your test sets it. | N-Week Program | 1 week from 2026-08-29, `_testWeek` 1 |
| Hybrid, its fields blank | 2026-08-29, `eventTargeted` true | Program length: 1 week. Your test sets it. | none | refused: Required. Enter your most recent timed mile. |
| Race / Event, its six fields typed | 2026-08-29, `eventTargeted` true | Program length: 1 week. Your test sets it. | N-Week Program | 1 week from 2026-08-29, `_testWeek` 1 |
| Race / Event, its fields blank | 2026-08-29, `eventTargeted` true | Program length: 1 week. Your test sets it. | none | refused: Required. Enter your most recent timed mile. |

Not ruled and not fixed here: it is the first measure's finding (Hybrid with a 5K or a 10K) on a third goal, and the beta is held equal to it.

**A typed bike, swim or swim time field leaves the program length line as it was.** Their handlers repaint the swim pace line or the swim advisory, or nothing, and never the length line (section B: 9 field and line pairs, all of them the length line). The line is right again at the next whole draw (a goal, a unit, a sport, Continue and Back). Today's behaviour; the beta repaints what today's handler repaints and no more.

**The stored config keeps the seed reader's answer.** Every program made after a run goal was drawn stores `_seed` in its config (null when the reader found nothing, section F), and `_seedApplied` or `_seedDismissed` after either button. Today's behaviour; the beta stores the same.

## J. The WebKit controls of the step, tried in the simulator's Safari

Seen on 2026-11-26 in Safari on the iPhone 17 Pro simulator (iOS 26.5), on a scratch page whose fields are set as the step sets its own (a number field with `min`, `max` and `step` on the tag; a date field with its value an attribute, `min` today, read on `input`). Each key was typed and the value the field handed its `input` handler read after it. This section is typed by hand from that; the script does not make it.

**A number field.** The field keeps a text of its own and hands back a value made from it.

| Key typed at the end of the text | Kept in the text | |
|---|---|---|
| a digit | always | |
| `.` | when the text holds no `.` and no `e` | `5..2` shows `5.2`; `1e2.5` shows `1e25` |
| `e` or `E` | when the text holds none | `1ee2` shows `1e2`; `e` alone is kept |
| `-` or `+` | when the text is empty, or ends with `e` | `5-3` shows `53`; `5e-2` and `5e+2` are kept |
| anything else (a letter, a comma, a space, `/`, `:`, `'`) | never | `9,5` shows `95`; `1:30` shows `130`; `abc` shows nothing |

- A key that is not kept still fires `input`, with the value as it stood: the handler runs again (on the mile's fields it writes `mileBestSrc` again).
- The value handed back is the text when the text is a whole number as written (digits, an optional `.`, an optional exponent with its digits), with a leading `+` taken off and a `.` at the very end taken off. Otherwise it is blank.
- 45 texts read, each as typed key by key (the value after each key): `1.5` → 1, 1, 1.5 · `.5` → blank, .5 · `-5` → blank, -5 · `+5` → blank, 5 · `0012` → 0, 00, 001, 0012 · `5..2` → 5, 5, 5, 5.2 · `1e2` → 1, blank, 1e2 · `9,5` → 9, 9, 95 · ` 5` → blank, 5 · `1.50` → 1, 1, 1.5, 1.50 · `5-3` → 5, 5, 53 · `5e-2` → 5, blank, blank, 5e-2 · `abc` → blank, blank, blank · `007.0` → 0, 00, 007, 007, 007.0 · `1.` → 1, 1 · `99999` → 9, 99, 999, 9999, 99999 · `e5` → blank, blank · `5 5` → 5, 5, 55 · `1.5.5` → 1, 1, 1.5, 1.5, 1.55 · `05` → 0, 05 · `.` → blank · `-` → blank · `0` → 0 · `1e2.5` → 1, blank, 1e2, 1e2, 1e25 · `5e+2` → 5, blank, blank, 5e+2 · `-.5` → blank, blank, -.5 · `1ee2` → 1, blank, blank, 1e2 · `+.5` → blank, blank, .5 · `1.e2` → 1, 1, blank, 1.e2 · `-0` → blank, -0 · `5e2e` → 5, blank, 5e2, 5e2 · `1E2` → 1, blank, 1E2 · `.5.` → blank, .5, .5 · `5.e` → 5, 5, blank · `12/3` → 1, 12, 12, 123 · `1:30` → 1, 1, 13, 130 · `5'` → 5, 5 · `-5-` → blank, -5, -5 · `e-e` → blank, blank, blank · `1e+` → 1, blank, blank · `30` → 3, 30 · `59` → 5, 59 · `60` → 6, 60 · `12a.5-e3` → 1, 12, 12, 12, 12.5, 12.5, blank, 12.5e3 · `1.5` then delete three times → 1, 1, blank. (A 46th, `--5`, was changed by the simulator's keyboard into a long dash before it reached the field, and is not counted.)
- `min`, `max` and `step` change nothing that is typed or handed back: 1 is handed back under a `min` of 3, 99999 over a `max` of 59, 12.5 on a field with no `step`. A field drawn with a value shows it (8).
- Leading zeros and a zero after the point are kept as typed (`0012`, `1.50`).

**The race date's field** (its value an attribute, as the step writes it; the start date's and the change sheet's fields set theirs as a property, and were tried in the sessions that built them):

- A tap opens the calendar on the field's day. A day picked is handed to `input` at once and the calendar stays; the check closes it.
- `min` is not enforced: a day before today is offered like any other, picked and handed back (so "That date has already passed." is drawn by a tap).
- **Reset hands back the attribute's day**, the one the step was last drawn whole with, not a blank: after two picks, Reset fired `input` with the day the field was drawn with, and the calendar went back to it and stayed. So on this field the blank of section C's last two rows is never handed back, and "card empty" is drawn by no tap. (A whole draw is a goal, a sport, a unit, a race button, the seed's buttons, the shorter plan link, Continue and Back; a typed field and a picked day are not, so the attribute keeps the day of the last whole draw through them.)

## K. On the simulator's copy of Mario's backup (counts only)

Read by a scratch script from a copy of the simulator's store made before any build of this session (2026-11-26, the store's hash 278ba57f3f6a382b, the hash the last session left; nothing was written to it), every walk on a phone of its own in the VM harness. The numbers below are the ones that script printed.

- 36 `ia_` keys; 3 programs, 1 of them archived.
- The seed offer: the cardio goals step drawn with each run goal picked, 6 on the race path and 4 on the hybrid path: the offer is drawn on 0 of the 10. The reader finds no seed (`_seed` null).
- Three programs made by taps through the cardio goals step, each on a phone of its own (Run a 5K with a race day 56 days out; Hybrid with Build Running Base; Half Marathon with a race day 119 days out): each raised the pop-up, named itself "Block 4" by default, and changed 2 of the 36 keys (`ia_active`, `ia_programs`); 3 programs became 4, the new one active, the 3 already stored the same to the byte after.

