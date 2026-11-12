# Stored state: do the golden records go red when the code is broken on purpose?

Written by `tests/measure/stored-state_red-on-break.mjs`. Each break changes one line of a copy of the built page;
`tests/integration/stored-state.test.ts`, `tests/sweeps/stored-state.test.ts` and `tests/sweeps/data-backup.test.ts`
run against the copy (`IA_APP`): the fast file first, the sweeps only for a break it lets through. The page as built
must be green on all three and every break red.

| Break | What it does | Result | Tests red | Caught by |
|---|---|---|---|---|
| (no break) | the page as built | green | 0 | all three files |
| log key | a log is stored under w1-mon, not w1_mon | red | 4 | the fast file |
| freeze, history | a touched day is not restored from its snapshot at launch | red | 1 | the fast file |
| freeze, piercing | an overlay no longer reaches the untouched days of the current week | red | the golden file | the fast file |
| freeze, reach | the last frozen week is rebuilt instead | red | 1 | the fast file |
| freeze, injured week | a touched day in an injured week keeps its stored form | red | 1 | the fast file |
| set draft | a logged card leaves its draft in the log | red | the golden file | the fast file |
| backup scan | the backup leaves out the last key | red | 2 | the fast file |
| completion status | a skipped day is stored as complete | red | the golden file | the fast file |
| part skip | a skipped part is not stored | red | 2 | the fast file |
| parts settle | the parts of a day never write its completion | red | 1 | the fast file |
| history, kept | a touched day is never snapshotted | red | 3 | the fast file |
| edit re-snapshot | an edit after the first touch is not folded into the day's snapshot | red | 1 | the fast file |
| swap record | a swap is not stored | red | 2 | the fast file |
| swap places | a swap is stored without where the lift stood | red | 1 | the fast file |
| swap places, merge | a pair swapped again forgets the places the earlier tap saw | red | 1 | the fast file |
| swap undo | an undone swap keeps its record | red | 1 | the fast file |
| swap count | a run of one swap never counts past one | red | 2 | the fast file |
| nudge offered | a nudge turned down is not marked offered | red | 2 | the fast file |
| skip record | a skipped movement is not stored | red | 1 | the fast file |
| skip undo | a movement put back stays skipped in the store | red | 1 | the fast file |
| add record | an added movement is not stored | red | 1 | the fast file |
| add undo | a removed movement stays added in the store | red | 1 | the fast file |
| edits prune | the edits of a frozen week are kept | red | the golden file | the fast file |
| active id | the active program is not stored | red | 19 | the fast file |
| wildcard record | a Wildcard done is not stored | red | 1 | the fast file |
| seed write back | an old program's seed is not written back to its config | red | the golden file | the fast file |
| purge | a deleted program keeps its logs | red | 1 | the fast file |
| rest move key | a moved rest day is stored under the picked day | red | 1 | the fast file |
| week count | the current week is counted one day late | red | 4 | the fast file |
| seed runs | the seed counts no run | red | 1 | the fast file |
| delete warning | a program's lift log never warns | red | 1 | the fast file |
| recovery run | any run counts as a recovery run | red | 1 | the fast file |
| recovery target | the recovery pace has no target | red | the golden file | the fast file |
| longest run | a week's runs are summed, not the longest taken | red | the golden file | the fast file |
| runs by class | no run is placed in its class | red | 1 | the fast file |
| easy effort count | the easy effort counts no run | red | the golden file | the fast file |
| logged miles | no logged mile is counted against the plan | red | the golden file | the fast file |
| program week | a program's week is counted one week early | red | 1 | the fast file |
| cut week | no week is held back | red | 1 | the fast file |
| run class | a long run has no class | red | the golden file | the fast file |
| pace seconds | a pace reads its minutes only | red | the golden file | the fast file |
| mile from recovery | the table is not read between its rows, recovery to mile | red | the golden file | the fast file |
| half from mile | the table is not read between its rows, mile to half | red | the golden file | the fast file |
| run card regime | a logged run card reads as a draft | red | 1 | the fast file |
| swap preference | the nudge taken stores no preference | red | 1 | the fast file |
| backup scan, prefix | the backup takes every key, not only the app's | red | 1 | the fast file |
| backup order | the backup keeps storage order | red | 1 | the fast file |
| snapshot kind | the file is not marked as a backup | red | 2 | the fast file |
| snapshot format | the file carries no format | red | 2 | the fast file |
| snapshot version | the file does not name its release | red | 1 | the fast file |
| snapshot made | the file does not carry when it was made | red | 1 | the fast file |
| reader kind | a file of another kind is read | red | 1 | the fast file |
| reader newer | a newer file reads as not a backup | red | 1 | the fast file |
| reader format | a file with no format is read | red | 1 | the fast file |
| reader data | a file whose data is not an object is read | red | 1 | the fast file |
| reader keys | a file with a key not the app's, or a value not a string, is read | red | 1 | the fast file |
| reader programs | a file with no program list is read | red | 1 | the fast file |
| program count | every program list counts one | red | 1 | the fast file |
| reader made | the file's time is not read | red | 1 | the fast file |
| load clears | a load keeps the phone's keys the file does not hold | red | 1 | the fast file |
| load writes | a load writes nothing | red | 2 | the fast file |
| load rollback, clear | a refused load keeps what it wrote | red | 1 | the fast file |
| load rollback, restore | a refused load does not put back what the phone held | red | 1 | the fast file |
| load result | a refused load reports success | red | 1 | the fast file |

**The page as built is green, and all 64 breaks turn the records red.**

## Breaks that change no record

| Break | What it does | Result | Why |
|---|---|---|---|
| freeze cut, the touched term | the current week, when touched, is not frozen a week further | no record changed | No effect is possible: the next line takes the larger of this and the highest touched week plus one, and a touched current week is at least that week. The term is redundant. |
| history, first touch | a day's snapshot is overwritten on every touch | no record changed | No reachable effect, settled in v0.261.5 (docs/decisions/stored-state.md). The guard decides only when a day is snapshotted again after it changed. A launch gives every snapshotted day back from its snapshot, and an edit is folded into the snapshot as it is made. One tap changes a snapshotted day and leaves its snapshot alone, the rest sheet's Move of a day with a logged lift, and it leaves a moved rest day that nothing snapshots (tests/measure/stored-state_first-touch.md). In 180 random histories, 0 of 4,481 repeat snapshots met a changed day (stored-state_first-touch-walks.md). The rule itself is held by the unit tests. |
| snapshot, a key with no value | a listed key with no value goes into the backup | no record changed | No reachable effect, found in v0.261.8 (tests/measure/stored-state_backup-gaps.md): the snapshot asks the store for a key the store has just listed, and both stores, the browser's storage and the memory store, give a string for every key they list. The guard moved as written; the unit tests hold the snapshot. |
