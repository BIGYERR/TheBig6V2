## D. Where each tier of the completion pop-up can be reached

| program | weeks | scheduled days | days with a deck | the final scheduled day | a deck there |
|---|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 14 | 70 | 59 | week 14 sun, Race Day | no |
| 5k race, commercial, strength, beginner | 8 | 48 | 46 | week 8 sun, Race Day | no |
| 10k race, home basic, hypertrophy, advanced | 8 | 40 | 37 | week 8 sun, Race Day | no |
| marathon, crossfit, athletic support, 36-45 | 18 | 89 | 73 | week 18 sun, Race Day | no |
| 1.5 mile test goal, minimal, fat loss, beginner | 11 | 51 | 51 | week 11 sat, Full Body | yes |
| 1.5 mile test goal, commercial, balanced | 11 | 61 | 60 | week 11 sat, Post-Run Mobility | no |
| run base, bodyweight, balanced | 9 | 33 | 33 | week 9 sat, Full Body | yes |
| bike ftp, home full, strength support, advanced | 7 | 37 | 37 | week 7 sat, Full Body — Lower | yes |
| swim 500, commercial, prevention support | 12 | 60 | 60 | week 12 fri, Full Body Support | yes |
| run base and bike base, crossfit, balanced | 9 | 41 | 41 | week 9 sat, Full Body | yes |

Over the ten programs: 497 of 530 scheduled days open a deck; the final scheduled day opens one on 5 of 10.

## E. The season pop-up and the long gap, THE HALF MANNY

- A launch after two weeks away: the reminder, "More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work." / "Saturday, Wk 3 · Full Body Support", buttons ["✓ Done","✕ Skip"]. Keys it wrote: ["ia_remind_last_<id>","ia_reminded_<id>"].
- A second launch the same day, the first not answered: 0 pop-ups raised.
- A launch the next day: the reminder, "More than a week off. Mark what happened, then eas..." / "Monday, Wk 4 · Posterior Chain".
- The day after the final scheduled day (week 14 sun of 14): the reminder asks about "Sunday, Wk 14 · Race Day"; answered Done: the season pop-up, kicker "Season complete", stats ["3 Workouts","0 Skips","14 Weeks"], line "Full block. No shortcuts, no excuses, no crying. Go be insufferable about it. 🔥", button []. Keys written: ["ia_comp_<id>","ia_hist_<id>","ia_pop_dismiss_<id>","ia_pop_idx_<id>","ia_remind_last_<id>","ia_reminded_<id>","ia_season_shown_<id>"].

## F. The other callers of the pop-up in the ten standard histories

- 27 × reminder / Unfinished business / its own words / buttons ✓ Done, ✕ Skip
- 15 × streak / N-day streak 🔥 / a pool line
- 10 × workout / Back in / its own words
- 35 × workout / Workout complete / a pool line

## G. Make the change, read before the page's timers run

- Right after acceptSwapNudge: keys changed ["ia_programs"] (the count is untouched where the pair was never counted: `not counted`).
- After the page's queued timers ran (the launch's reminder, 600 ms): further keys changed ["ia_remind_last_<id>","ia_reminded_<id>"].

