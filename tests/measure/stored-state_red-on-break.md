# Stored state: do the golden records go red when the code is broken on purpose?

Written by `tests/measure/stored-state_red-on-break.mjs`. Each break changes one line of a copy of the built page;
`tests/integration/stored-state.test.ts`, `tests/sweeps/stored-state.test.ts` and `tests/sweeps/data-backup.test.ts`
run against the copy (`IA_APP`): the fast file first, the sweeps only for a break it lets through. The page as built
must be green on all three and every break red.

| Break | What it does | Result | Tests red | Caught by |
|---|---|---|---|---|
| (no break) | the page as built | green | 0 | all three files |
| log key | a log is stored under w1-mon, not w1_mon | red | 2 | the fast file |
| freeze, history | a touched day is not restored from its snapshot at launch | red | the golden file | the fast file |
| freeze, piercing | an overlay no longer reaches the untouched days of the current week | red | the golden file | the fast file |
| freeze, reach | the last frozen week is rebuilt instead | red | the golden file | the fast file |
| freeze, injured week | a touched day in an injured week keeps its stored form | red | 1 | the fast file |
| set draft | a logged card leaves its draft in the log | red | the golden file | the fast file |
| backup scan | the backup leaves out the last key | red | 1 | the fast file |
| completion status | a skipped day is stored as complete | red | the golden file | the fast file |
| seed write back | an old program's seed is not written back to its config | red | the golden file | the fast file |
| purge | a deleted program keeps its logs | red | 1 | the fast file |
| rest move key | a moved rest day is stored under the picked day | red | the golden file | the fast file |
| week count | the current week is counted one day late | red | 4 | the fast file |

**The page as built is green, and all 12 breaks turn the records red.**

## Breaks that change no record

| Break | What it does | Result | Why |
|---|---|---|---|
| freeze cut, the touched term | the current week, when touched, is not frozen a week further | no record changed | No effect is possible: the next line takes the larger of this and the highest touched week plus one, and a touched current week is at least that week. The term is redundant. |
| history, first touch | a day's snapshot is overwritten on every touch | no record changed | Not shown either way. In every history here a touched day is restored from its snapshot at each launch, so a second snapshot writes the same bytes. Whether any tap can change a touched day before its next snapshot (a moved rest day, a sport swap) was not traced. To settle before the freeze slice. |
