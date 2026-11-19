# Watch import: which hand log form each prescribed run opens (D292, measured 2026-11-15 on v0.262.4)

`node tests/measure/watch-import_run-forms.js` on the root `index.html` (v0.262.4). For every run a program prescribes,
the form the day's hand log opens is the kind `doseFromCardio` returns for it: `time` (minutes and miles), `dist` (miles
and minutes), `reps_dist` (reps and a rep time), `reps_time` (reps and miles), or `none` (miles and pace, the form a
run with no dose opens). The bracket is the emitted dose's `key` when it has one. A watch import may write only what
that form writes, and only when the watch's totals for the outing are what the form asks for.

```
half-manny: 56 runs, {"none":14,"time":27,"dist":15}
  Long Run -> dist 9; Long Run — Cutback -> time 1; Long Run — Dress Rehearsal -> dist 1; Long Run — Peak -> dist 1; Long Run — RACE DAY -> dist 1; Long Run — Taper -> dist 1; Recovery Run -> dist 2; Recovery Run -> time 26; Speed Run — Fartlek -> none 1; Speed Run — Intervals -> none 10; Speed Run — Tempo -> none 3
5k race: 32 runs, {"none":8,"time":17,"dist":7}
  Long Run -> dist 1; Long Run -> time 4; Long Run — Peak -> dist 1; Long Run — RACE DAY -> dist 1; Long Run — Taper -> dist 1; Recovery Run -> dist 3; Recovery Run -> time 13; Speed Run — Fartlek -> none 1; Speed Run — Intervals -> none 4; Speed Run — Tempo -> none 3
10k race: 32 runs, {"none":15,"time":8,"dist":9}
  Long Run -> dist 5; Long Run — Peak -> dist 1; Long Run — RACE DAY -> dist 1; Long Run — Taper -> dist 1; Recovery Run -> dist 1; Recovery Run -> time 8; Speed Run — Fartlek -> none 1; Speed Run — Hills -> none 1; Speed Run — Intervals -> none 9; Speed Run — Tempo -> none 4
marathon: 72 runs, {"dist":21,"none":18,"time":33}
  Long Run -> dist 9; Long Run -> time 1; Long Run — Cutback -> dist 2; Long Run — Cutback -> time 1; Long Run — Peak -> dist 1; Long Run — RACE DAY -> dist 1; Long Run — Taper -> dist 3; Recovery Run -> dist 5; Recovery Run -> time 31; Speed Run — Fartlek -> none 2; Speed Run — Hills -> none 2; Speed Run — Intervals -> none 9; Speed Run — Tempo -> none 5
1.5 mile test (fat loss): 44 runs, {"reps_dist":11,"time":11,"dist":22}
  Long Interval (LI) -> time (chi) 11; Long Slow Distance (LSD) -> dist (easy) 11; Long Slow Distance (LSD) -> dist (long) 11; Short Interval (SI) -> reps_dist (int) 11
1.5 mile test (balanced): 44 runs, {"reps_dist":11,"time":11,"dist":22}
  Long Interval (LI) -> time (chi) 11; Long Slow Distance (LSD) -> dist (easy) 11; Long Slow Distance (LSD) -> dist (long) 11; Short Interval (SI) -> reps_dist (int) 11
run base: 27 runs, {"time":27}
  Benchmark Run -> time (bench) 1; Benchmark Run — Retest -> time (bench) 1; Easy Run + Strides -> time (easy) 5; Easy Run -> time (easy) 18; Easy Run — Long + Strides -> time (long) 2
ALL: {"none":55,"time":134,"dist":96,"reps_dist":22}
```

What it says for the import:

- **Whole outing, so the watch's totals are the form's numbers:** every Recovery Run, Long Run (cutback, dress
  rehearsal, peak, taper and Race Day included), Easy Run and Long Slow Distance. Their dose is the run itself.
- **Speed Runs on a race plan open the `none` form** (miles and pace). D272 call 2 already rules that a Speed Run records
  its whole run, so the watch's totals are that form's numbers too. HALF_MANNY: 14 of its 56 runs.
- **A block inside the outing, so the totals are not the form's numbers:** the Short Interval's `reps_dist` (four to
  eight reps of 400 m or 800 m with recoveries, and a warm up), the Long Interval's `time` dose with key `chi` (the
  fifteen minutes at tempo pace, not the jog around them), and the Benchmark Run's `time` dose with key `bench` (a timed
  test whose distance moves the program's paces). The watch's whole outing would write a slower pace against these
  targets. They wait for the laps (stage 4, D258).
- HALF_MANNY, Mario's program: all 56 runs are whole outing or Speed Runs. The test goal programs: their 22 Long Slow
  Distance runs of 44. Run base: its Easy Runs (18, 5 and 2), not its two Benchmark Runs.
