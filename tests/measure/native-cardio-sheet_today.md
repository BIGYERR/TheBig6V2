# Today's run card, cardio sheet and rest timer (measure, before the Expo app draws them)

Written by `cd tests && node measure/native-cardio-sheet_today.ts` (read-only). Zone America/New_York.

## A. Where the cardio sheet shows (the ten programs as generated)

| Program | Weeks | Days with a run, ride or swim | By sport | The log's form | Lift beside it | Cardio alone (Done and Skip kept) |
|---|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 14 | 56 | `run` 56 | `dist` 15, `generic` 14, `time` 27 | 54 | 2 |
| 5k race, commercial, strength, beginner | 8 | 32 | `run` 32 | `dist` 7, `generic` 8, `time` 17 | 30 | 2 |
| 10k race, home basic, hypertrophy, advanced | 8 | 32 | `run` 32 | `dist` 9, `generic` 15, `time` 8 | 30 | 2 |
| marathon, crossfit, athletic support, 36-45 | 18 | 72 | `run` 72 | `dist` 21, `generic` 18, `time` 33 | 70 | 2 |
| 1.5 mile test goal, minimal, fat loss, beginner | 11 | 44 | `run` 44 | `dist` 22, `reps_dist` 11, `time` 11 | 44 | 0 |
| 1.5 mile test goal, commercial, balanced | 11 | 44 | `run` 44 | `dist` 22, `reps_dist` 11, `time` 11 | 44 | 0 |
| run base, bodyweight, balanced | 9 | 27 | `run` 27 | `time` 27 | 27 | 0 |
| bike ftp, home full, strength support, advanced | 7 | 21 | `bike` 21 | `bike with its strip` 21 | 21 | 0 |
| swim 500, commercial, prevention support | 12 | 36 | `swim` 36 | `swim` 36 | 36 | 0 |
| run base and bike base, crossfit, balanced | 9 | 18 | `bike` 9, `run` 9 | `bike with its strip` 9, `time` 9 | 18 | 0 |
| **All ten** | | **382** | `bike` 30, `run` 316, `swim` 36 | `bike with its strip` 30, `dist` 96, `generic` 55, `reps_dist` 22, `swim` 36, `time` 143 | 374 | 8 |

- A day whose cardio is no run, ride or swim draws no field in the log: none.
- The card's button on the iOS app (Record run is offered, D272 item 6): 316 days open the recorder, 66 open the hand log (rides and swims). Without the recorder the same 316 read Log the run and open the hand log.
- 257 of the 382 doses carry a target pace (the strip's pace and the readout's gap); 0 were read from the detail's words, the rest from the engine's own dose.
- The wheels: `time` and `dist` draw two (the clock with hours, and miles), `reps_dist` the reps stepper and the rep clock, `reps_time` the stepper and miles, `generic` miles and pace side by side, a ride the clock with hours, a swim a number box and no wheel.

## B. What each tap of the cardio's log writes (The Half Manny)

**time**: week 1, tue, Recovery Run

| Step | The page's call | Keys written | Toast | The card after |
|---|---|---|---|---|
| Log the run on the card, or a done run's Reopen (the sheet opens) | `openDayKey(day)` | nothing |  | draft, run |
| Log, nothing rolled | `logCardio()` | nothing | Nothing to log yet. | draft, run |
| A wheel rolled (log_run_dist to 3.10) | `the wheel's settle` | nothing |  | draft, run |
| Log | `logCardio()` | `ia_hist_<id>` new [+w1_tue {title, dot, tags, cardio, sections}]; `ia_logs_<id>` new [+w1_tue {rpe="", run_dist="3.10", run_pace="4:50/mi", run_mins="", run_reps="", run_rep_time="", bike_mins="", swim_yards="", notes="", swapFrom="", swapTo="", week=1}] | Run logged ✓ | logged, run |
| The wheel rolled again (3.20) | `the wheel's settle` | `ia_logs_<id>` [~w1_tue {run_dist="3.20", run_pace="4:41/mi"}] |  | logged, run |
| Did a different activity? | `toggleCardioPicker()` | nothing |  | logged, run |
| The Bike chip | `setCardioSwap("bike")` | `ia_logs_<id>` [~w1_tue {run_dist="", run_pace="", swapFrom="run", swapTo="bike", parked={"run":{"run_dist":"3.20","run_pace":"4:41/mi","run_mins"...}] |  | draft, bike |
| The ride's clock rolled (45.00) | `the wheel's settle` | nothing |  | draft, bike |
| Log | `logCardio()` | `ia_logs_<id>` [~w1_tue {bike_mins="45.00"}] | Ride logged ✓ | logged, bike |
| The Bike chip again (the sport it is on) | `setCardioSwap("bike")` | nothing |  | logged, bike |
| The Run chip, back | `setCardioSwap("run")` | `ia_logs_<id>` [~w1_tue {run_dist="3.20", run_pace="4:41/mi", bike_mins="", swapFrom="", swapTo="", parked={"bike":{"bike_mins":"45.00"}}}] |  | logged, run |
| The sheet closed and opened again | `closeDetail(), openDayKey(day)` | nothing |  | logged, run |

**dist**: week 1, sat, Long Run

| Step | The page's call | Keys written | Toast | The card after |
|---|---|---|---|---|
| Log the run on the card, or a done run's Reopen (the sheet opens) | `openDayKey(day)` | nothing |  | draft, run |
| Log, nothing rolled | `logCardio()` | nothing | Nothing to log yet. | draft, run |
| A wheel rolled (log_run_mins to 28.50) | `the wheel's settle` | nothing |  | draft, run |
| Log | `logCardio()` | `ia_hist_<id>` [+w1_sat {title, dot, tags, cardio, sections}]; `ia_logs_<id>` [+w1_sat {rpe="", run_dist="3.1", run_pace="9:12/mi", run_mins="28.50", run_reps="", run_rep_time="", bike_mins="", swim_yards="", notes="", swapFrom="", swapTo="", week=1}] | Run logged ✓ | logged, run |
| The wheel rolled again (29.00) | `the wheel's settle` | `ia_logs_<id>` [~w1_sat {run_pace="9:21/mi", run_mins="29.00"}] |  | logged, run |

*No reps_dist day on The Half Manny.*

*No reps_time day on The Half Manny.*

**generic**: week 1, mon, Speed Run — Fartlek

| Step | The page's call | Keys written | Toast | The card after |
|---|---|---|---|---|
| Log the run on the card, or a done run's Reopen (the sheet opens) | `openDayKey(day)` | nothing |  | draft, run |
| Log, nothing rolled | `logCardio()` | nothing | Nothing to log yet. | draft, run |
| A wheel rolled (log_run_dist to 4.00) | `the wheel's settle` | nothing |  | draft, run |
| Log | `logCardio()` | `ia_hist_<id>` [+w1_mon {title, dot, tags, cardio, sections}]; `ia_logs_<id>` [+w1_mon {rpe="", run_dist="4.00", run_pace="", run_mins="", run_reps="", run_rep_time="", bike_mins="", swim_yards="", notes="", swapFrom="", swapTo="", week=1}] | Run logged ✓ | logged, run |
| The wheel rolled again (4.10) | `the wheel's settle` | `ia_logs_<id>` [~w1_mon {run_dist="4.10"}] |  | logged, run |

**solo**: week 14, sat, Recovery Run

| Step | The page's call | Keys written | Toast | The card after |
|---|---|---|---|---|
| The card's button (the sheet opens, with Done and Skip) | `openDayKey(day)` | nothing |  | draft, run |
| A wheel rolled, then Done | `handleDayStatus(day,title,"complete")` | `ia_comp_<id>` new [+w14_sat {title="Shakeout", status="complete"}]; `ia_hist_<id>` [+w14_sat {title, dot, tags, cardio, sections}]; `ia_logs_<id>` [+w14_sat {rpe="", run_dist="2", run_pace="14:15/mi", run_mins="28.50", run_reps="", run_rep_time="", bike_mins="", swim_yards="", notes="", swapFrom="", swapTo="", week=14}]; `ia_pop_dismiss_<id>` new [+date, +idx]; `ia_pop_idx_<id>` [+workout] |  | logged, run |

## C. The rest timer

- Start, Stop, Start, Reset, the idle reset, the card opened and folded: keys written, nothing. The clock, the side it docks to and whether its card is open live in memory only: a launch starts at 0:00, folded, on the right.
- The app calls it in five places: every screen change shows or hides it (`showScreen`), a day's sheet opening zeroes a stopped clock and leaves a running one (`openDetail`), Done or Skip stops and zeroes it (`handleDayStatus`), the first program generated plays its opening once (`doGenerate`), and the launch tells the Live Activity where it stands (`init`).

