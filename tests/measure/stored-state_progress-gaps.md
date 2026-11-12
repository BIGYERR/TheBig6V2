# Stored state: could the golden records see what Progress reads and computes?

Measured before the sixth lift slice (v0.261.7), on v0.261.6. Two parts.

## 1. What Progress's readers hand back on HALF_MANNY's standard history

Written by `tests/measure/stored-state_progress-gaps.ts` (the history of `tests/support/stored-state.ts`, `life()`,
America/New_York, the last launch on 2026-10-07).

- 6 log entries: 2 with a pace, 4 with a distance, **none at RPE 3 or 4**, none swapped. 7 history days, 6 with a run.
- `_cutWeek` 6. `recoveryPaceWeekly` `{"weekly":{"1":549},"tgt":800,"nWeeks":1}`: one recovery run with a pace.
- `ladderWeekly` `{"1":3.5,"2":5.5,"3":6.5}`. `runsByClass`: one Recovery and one Easy dot, the other classes empty.
- `easyEffortWeekly` `{"weekly":{},"nRuns":0,"nWeeks":0}`: **empty**.
- `plannedVsLogged` `{"1":{"presc":3.1,"act":0}}`.
- `seedFromPriorPrograms` **null** (one program). `_purgeWarnsCrossProg` **false** (one program).
- No history takes the swap nudge, so no record holds the preference it writes; no test at all names `acceptSwapNudge`.
- Every one of these writes nothing, so a record of the `ia_` keys cannot show any of them.

## 2. Each break inside a moved rule, against v0.261.6's own records

Written by `tests/measure/stored-state_progress-gaps-breaks.mjs`: each v0.261.7 break of
`stored-state_red-on-break.mjs`, made in the built page, run against v0.261.6's stored-state files and golden file (a
tree of that release, `tools/tree-at.mjs`), the fast file first and the sweeps only for a break it lets through. The
control row is an earlier break those records catch, to show the instrument can go red.

16 breaks and the control, 16 green on v0.261.6's records (the control must be red).

| Break | On v0.261.6's records |
|---|---|
| log key (control) | red |
| seed runs | green (blind) |
| delete warning | green (blind) |
| recovery run | green (blind) |
| recovery target | green (blind) |
| longest run | green (blind) |
| runs by class | green (blind) |
| easy effort count | green (blind) |
| logged miles | green (blind) |
| program week | green (blind) |
| cut week | green (blind) |
| run class | green (blind) |
| pace seconds | green (blind) |
| mile from recovery | green (blind) |
| half from mile | green (blind) |
| run card regime | green (blind) |
| swap preference | green (blind) |
