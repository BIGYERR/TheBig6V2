# Run names: decisions

What a run session is called on the card and in the session sheet: the headline of a speed run (line 1 of its
`detail`, which the compact renderers read) and the label of a long run (the first words of its `detail`). The names
live in the race-plan tables of `core/src/engine/nrc-race-bike-swim.ts`. The sessions themselves, their numbers and
their order are not this file's: `docs/decisions/speed-work.md`, `docs/decisions/run-week-layout.md`. Tests:
`tests/integration/run-names.test.ts`.

## D269 P-RUNNAMES: every run is named in the app's own words

- **Date:** 2026-11-01. **Ruled by:** the main session in the coach hat, on Mario's "Yes, both" (2026-11-01). Copy,
  not doctrine: the copy rule (the app sounds like a coach at every touchpoint; no user-facing brand strings).
- **Finding:** ten strings on the 5K and 10K run cards (nine distinct) are the source plans' own session names, carried over when
  the plans were transcribed (V186): eight speed-run headlines (one fartlek twice) and two long-run labels. Every other headline in the
  four tables, and every one in the half and marathon tables, is already written in the app's words (what the
  session is, then its spec: `8 × 1:00 at 5K Pace — 8:00 of work`). No test pinned any of them.
- **Changes:** the ten strings, and nothing else in their rows. A headline keeps its shape, what the session is and
  then its spec, with the source's title dropped and the description promoted:

  | Plan, week | Before | After |
  |---|---|---|
  | 5K W2 speed 1 | On the Move — Mile bursts between 5K and 10K reps, 6:00 of work, 7 efforts | Mile bursts between 5K and 10K reps — 6:00 of work, 7 efforts |
  | 5K W2 speed 2 | Faster Fun — descending Mile reps with 10K floats, 8:00 of work, 9 efforts | Descending Mile reps with 10K floats — 8:00 of work, 9 efforts |
  | 5K W3 speed | How Fartlek Can You Go — 9:15 of work, 14 efforts, recovery equals the effort | Fartlek, recovery equals the effort — 9:15 of work, 14 efforts |
  | 5K W4 speed | Rhythm and Roll — 5K bursts around a 3:00 10K rep, 8:00 of work, 11 efforts | 5K bursts around a 3:00 10K rep — 8:00 of work, 11 efforts |
  | 5K W5 speed | In the Zone — 5 × 4:00 at 5K Pace, 20:00 of work | 5 × 4:00 at 5K Pace — 20:00 of work |
  | 5K W6 speed | Go Fast — Mile reps growing 0:30 → 1:30, each chased by 0:15 at Best, 6:15 of work | Mile reps growing 0:30 → 1:30, each chased by 0:15 at Best — 6:15 of work |
  | 10K W3 speed 2 | How Fartlek Can You Go — 9:15 of work, 14 efforts, recovery equals the effort (the 5K W3 fartlek again) | Fartlek, recovery equals the effort — 9:15 of work, 14 efforts |
  | 10K W3 speed | Slow Down to Speed Up — descending ladder 10K → 5K → Mile → Best, 15:30 of work, 7 efforts | Descending ladder 10K → 5K → Mile → Best — 15:30 of work, 7 efforts |
  | 5K W4 long run label | Just A Run (30 min) | 30 Minute Run |
  | 5K W5 long run label | Fuel the Run (33 min) | 33 Minute Run |

  The two labels follow the 5K W2 long run, already `15 Minute Run`.
- **Does not change:** every number, pace, segment and recovery under each headline; the session type and subtype
  (`Speed Run — Intervals`, `Speed Run — Fartlek`, `Long Run`); the half and marathon tables; which week runs what;
  the dose; HALF_MANNY (a half-marathon program, none of whose names move).
- **Expected values:** the ten strings as the After column, and none of the nine Before titles anywhere in any
  program's cardio detail or subtype. The 5K and 10K entries of `tests/snapshots/program-output.json` move by text
  only (`859edcbd86960a26` to `dd594b2ff2873fea`, `e7d7d164518e0d99` to `07a61b21dc381813`, no grid line moves); the
  lattice (`tests/snapshots/program-output-lattice.json`) does not move, measured: none of its programs prints one of
  the ten; HALF_MANNY's digest `e47eb1012ab04bff` does not move.
- **Released:** v0.255.1 (Patch, Mario 2026-11-01).
