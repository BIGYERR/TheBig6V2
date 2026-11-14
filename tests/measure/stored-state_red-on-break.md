# Stored state: do the golden records go red when the code is broken on purpose?

Written by `tests/measure/stored-state_red-on-break.mjs`. Each break changes one line of a copy of the built page;
`tests/integration/stored-state.test.ts`, `tests/sweeps/stored-state.test.ts` and `tests/sweeps/data-backup.test.ts`
run against the copy (`IA_APP`): the fast file first, the sweeps only for a break it lets through. The page as built
must be green on all three and every break red.

| Break | What it does | Result | Tests red | Caught by |
|---|---|---|---|---|
| (no break) | the page as built | green | 0 | all three files |
| log key | a log is stored under w1-mon, not w1_mon | red | 4 | the fast file |
| set draft | a logged card leaves its draft in the log | red | the golden file | the fast file |
| backup scan | the backup leaves out the last key | red | 2 | the fast file |
| completion status | a skipped day is stored as complete | red | the golden file | the fast file |
| part skip | a skipped part is not stored | red | 2 | the fast file |
| parts settle | the parts of a day never write its completion | red | 1 | the fast file |
| history, kept | a touched day is never snapshotted | red | 7 | the fast file |
| edit re-snapshot | an edit after the first touch is not folded into the day's snapshot | red | 2 | the fast file |
| swap record | a swap is not stored | red | 4 | the fast file |
| swap places | a swap is stored without where the lift stood | red | 1 | the fast file |
| swap places, merge | a pair swapped again forgets the places the earlier tap saw | red | 1 | the fast file |
| swap undo | an undone swap keeps its record | red | 1 | the fast file |
| swap count | a run of one swap never counts past one | red | 2 | the fast file |
| nudge offered | a nudge turned down is not marked offered | red | 2 | the fast file |
| skip record | a skipped movement is not stored | red | 2 | the fast file |
| skip undo | a movement put back stays skipped in the store | red | 1 | the fast file |
| add record | an added movement is not stored | red | 2 | the fast file |
| add undo | a removed movement stays added in the store | red | 1 | the fast file |
| edits prune | the edits of a frozen week are kept | red | 1 | the fast file |
| active id | the active program is not stored | red | 25 | the fast file |
| wildcard record | a Wildcard done is not stored | red | 1 | the fast file |
| purge | a deleted program keeps its logs | red | 1 | the fast file |
| rest move key | a moved rest day is stored under the picked day | red | 2 | the fast file |
| week count | the current week is counted one day late | red | 5 | the fast file |
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
| overlay order | the newest overlay is applied first, so the oldest wins | red | the golden file | the fast file |
| overlay kinds, injury | an injury overlay is skipped | red | 3 | the fast file |
| overlay kinds, travel | a travel overlay is skipped | red | 2 | the fast file |
| overlay window, last week | the last week of an overlay's span is not searched | red | 2 | the fast file |
| overlay window, first week | the first week of an overlay's span is not searched | red | 4 | the fast file |
| overlay key | a spliced day's stamp holds the overlay's kind only | red | 3 | the fast file |
| overlay travel mark | a trip builds as the athlete's own gym | red | 1 | the fast file |
| overlay patch, travel | a trip builds without its patch | red | 1 | the fast file |
| overlay patch, injury | an injury builds without its patch | red | 1 | the fast file |
| overlay clean injury build | an injury builds as a temporary setup | red | 2 | the sweeps |
| overlay day, before | a day before the span, in its first week, takes the variant | red | 2 | the fast file |
| overlay day, after | a day after the span, in its last week, takes the variant | red | 2 | the fast file |
| overlay day, first | the span's first day keeps the base | red | 4 | the fast file |
| overlay day, last | the span's last day keeps the base | red | 2 | the fast file |
| overlay rest days | a rest day of the variant replaces the base day | red | 2 | the fast file |
| overlay stamp | a spliced day carries no overlay key | red | 3 | the fast file |
| overlay splice | no day takes the variant | red | 4 | the fast file |
| overlay legal swaps | no variant's legal swaps are kept | red | 1 | the fast file |
| overlay failure | a failing overlay stops every later one | red | 1 | the fast file |
| overlay failure, told | a failed overlay is not told to the athlete | red | 1 | the fast file |
| overlay length | an overlay's span is read against the stored length only | red | 1 | the fast file |
| overlay week range | the launch hands the splice no week range | red | 4 | the fast file |
| overlay day date | the launch hands the splice no day date | red | 4 | the fast file |
| launch: guard, no config | a program with no config is handed back as stored -> a program with no config goes on to the rebuild | red | 1 | the fast file |
| launch: seed, none anywhere | a program with no seed anywhere is handed back as stored -> a program with no seed is rebuilt | red | 1 | the fast file |
| launch: seed, into the config | an older program's seed is put into its config -> the config stays without its seed | red | the golden file | the fast file |
| launch: seed, saved | the seed put back is written to ia_programs -> the seed is put back in hand only | red | 2 | the fast file |
| launch: seed, saved on its program | the seed is written to the stored program of the same id -> the seed is written to the first stored program | red | 1 | the fast file |
| launch: test week, only when unset | a program with a pinned test week is left alone -> every program derives its test week again at each launch | red | 2 | the fast file |
| launch: test week, backfilled | a dated test with no pinned week pins it at launch -> no test week is ever backfilled | red | 1 | the fast file |
| launch: test week, needs a week | a test before the start or past week 26 pins nothing -> a test with no week still writes the two keys | red | 1 | the fast file |
| launch: test week, a past test | a test already past pins nothing and writes nothing -> a past test pins | red | 1 | the fast file |
| launch: test week, set | the pinned week goes into the config -> the config gets the length and not the week | red | 1 | the fast file |
| launch: test week, length | the program's length is capped at the test week -> the config gets the week and not the length | red | 1 | the fast file |
| launch: test week, saved | the pin is written to ia_programs -> the pin is in hand only | red | 1 | the fast file |
| launch: test pin, goal family | only a pace test goal pins -> any run goal with a date pins | red | 3 | the fast file |
| launch: test pin, event off | a goal with its event switched off pins nothing -> it pins | red | 1 | the fast file |
| launch: test pin, week range | a test week outside 1 to 26 pins nothing -> any week pins | red | 1 | the fast file |
| launch: pace shift, set | an injury that stops quality running sets the pace shift on the config before the build -> no pace shift is ever set | red | 1 | the fast file |
| launch: pace shift, cleared | a pace shift that no longer derives is deleted from the config -> an old pace shift outlives its overlays | red | 1 | the fast file |
| launch: pace map, modes | only an injury whose plan touches running counts -> every injury with a cardio mode counts | red | 1 | the fast file |
| launch: pace map, half step | a half step week never counts -> a half step week counts | red | the golden file | the fast file |
| launch: pace map, open end | an injury with no end counts to today -> an injury with no end counts to the program's end | red | 1 | the fast file |
| launch: pace map, from the start | days before the program's first Monday do not count -> they count | red | 1 | the fast file |
| launch: pace map, days before the week | a week is shifted by the days hurt before it -> a week is shifted by the days hurt through its Monday | red | 1 | the fast file |
| launch: pace map, floor of one | any day hurt shifts the clock by at least a week -> one to three days hurt shift nothing | red | the golden file | the fast file |
| launch: pace map, merged spans | overlapping injuries count a day once -> overlapping injuries count a day twice | red | 1 | the fast file |
| launch: rebuild, id | the rebuilt program keeps its id -> it carries the build's own id | red | 7 | the fast file |
| launch: rebuild, name | the rebuilt program keeps its name -> it carries the build's name | red | 1 | the fast file |
| launch: rebuild, created | the rebuilt program keeps when it was made -> it carries the instant of this launch | red | 1 | the fast file |
| launch: rebuild, start | the rebuilt program keeps its start -> it has no start | red | 14 | the fast file |
| launch: rebuild, block open | the rebuilt program keeps where its block opened -> it has none | red | the golden file | the fast file |
| launch: rebuild, seed | the rebuilt program keeps the stored program's own seed -> it carries the config's | red | 1 | the fast file |
| launch: rebuild, overlays | the rebuilt program keeps its overlays -> it has none | red | 2 | the fast file |
| launch: rebuild, failure | a program the engine cannot build is handed back as stored -> nothing is handed back | red | 1 | the fast file |
| launch: splice, called | the overlays are spliced into the rebuilt grid -> no overlay is spliced | red | 4 | the fast file |
| launch: order, splice before the freeze | the freeze has the last word over an overlay -> the overlays are spliced after the freeze | red | 1 | the fast file |
| launch: overlay range, clamped | an overlay's weeks are clamped to the program -> they are not clamped | red | 1 | the fast file |
| launch: overlay range, no end | an overlay with no end runs to the last week -> it covers its first week only | red | the golden file | the fast file |
| launch: day date | a program day's date is its week's Monday plus its weekday -> every day reads a day late | red | 2 | the fast file |
| launch: freeze, the stored length | the current week is capped at the stored length first -> it is capped at the rebuilt length | red | the golden file | the fast file |
| launch: freeze, no clock | a program with no start still freezes by what was touched -> the freeze fails for it and every week is rebuilt | red | 1 | the fast file |
| launch: freeze, week count | the current week is counted from the start's Monday -> it is counted a day late | red | 1 | the fast file |
| launch: freeze, past the end | after the last week the current week is the last -> it runs past the end | red | 1 | the fast file |
| launch: touched, completion | a completion proves a day was seen -> it proves nothing | red | 1 | the fast file |
| launch: touched, log | a log proves a day was seen -> it proves nothing | red | 1 | the fast file |
| launch: touched, snapshot | a snapshot proves a day was seen -> it proves nothing to the cut | red | 1 | the fast file |
| launch: touched, lift log | a logged lift proves its day was seen -> it proves nothing | red | 1 | the fast file |
| launch: touched, lift log day | a logged lift freezes its own day -> it moves the cut and freezes no day | red | 1 | the fast file |
| launch: cut, the date | every week before the current one is frozen, touched or not -> only weeks up to the furthest touched are frozen | red | the golden file | the fast file |
| launch: cut, the furthest touched | every week up to the furthest touched is frozen, wherever the date is -> only the date decides | red | 1 | the fast file |
| launch: cut, the furthest touched week itself | the furthest touched week is frozen -> the cut stops a week short of it | red | 1 | the fast file |
| launch: freeze, reach | every week below the cut is frozen -> the last frozen week is rebuilt | red | 4 | the fast file |
| launch: freeze, written | a frozen week replaces the rebuilt one -> no week is frozen | red | 4 | the fast file |
| launch: freeze, history | a day with a snapshot is given back from it -> a snapshot is not read back | red | 3 | the fast file |
| launch: freeze, piercing | the current week and later take live days where untouched -> no frozen week is pierced | red | 3 | the fast file |
| launch: pierce, new days | a pierced week gains a day the rebuild has and the stored grid lacks -> it keeps the stored days only | red | 1 | the fast file |
| launch: past week, stored days only | a week behind the current one keeps the stored set of days -> it gains the rebuild's days too | red | 1 | the fast file |
| launch: injury cover, kind | only an injury covers a week -> a trip covers it too | red | 1 | the fast file |
| launch: freeze, injured week | a touched day with no snapshot, in a week an injury covers, takes the live day -> it keeps its stored form | red | 1 | the fast file |
| launch: touched day, stored form | a touched day with no snapshot keeps its stored form -> it takes the live day | red | 1 | the fast file |
| launch: touched day, live fallback | a touched day the stored grid lacks takes the live day -> it is dropped | red | 1 | the fast file |
| launch: untouched day, pierced week | an untouched day of a pierced week takes the live day -> it keeps its stored form | red | 3 | the fast file |
| launch: untouched day, past week | an untouched day of a past week keeps its stored form -> it takes the live day | red | 1 | the fast file |
| launch: moves, replayed | a moved rest day is laid back on the rebuilt grid -> no move is replayed | red | 2 | the fast file |
| launch: order, moves before swaps | the moves are laid before the swaps and the edits -> the moves are laid after the swaps | red | 1 | the fast file |
| launch: move, already applied | a move a frozen week already holds is not applied again -> it is applied again | red | the golden file | the fast file |
| launch: move, source | a rest day or a day already moved is never the source -> it can be | red | 1 | the fast file |
| launch: move, mark | the moved session says where it came from -> it does not | red | 3 | the fast file |
| launch: move, origin rests | the day a session left becomes a rest day -> the session shows on both days | red | 3 | the fast file |
| launch: move, old form | a move stored as a plain day name is read -> it is not | red | 1 | the fast file |
| launch: swaps, replayed | a session swap is laid back on the rebuilt day -> no swap is replayed | red | 1 | the fast file |
| launch: swaps, restored days | a day given back from its snapshot gets no replay -> its swaps are replayed onto the snapshot | red | 1 | the fast file |
| launch: swap replay, order | a day's swaps replay in the order made -> they replay newest first | red | 1 | the fast file |
| launch: swap replay, applied | each swap renames its lift on the day -> no lift is renamed | red | 1 | the fast file |
| launch: swap replay, injury filter | a swapped day under an injury goes through the injury filter again -> it does not | red | 1 | the fast file |
| launch: swap replay, hold kept | a renamed lift carries its dose from before the filter -> it does not | red | 1 | the fast file |
| launch: swap replay, the day's plan | the injury that governs a day is its own overlay's -> it is the config's | red | 1 | the fast file |
| launch: edits, pruned at launch | the edits of every week below the cut are dropped at launch -> none is dropped | red | 1 | the fast file |
| launch: edits, the prune cut | the prune stops at the freeze cut -> it takes the cut week too | red | 1 | the fast file |
| launch: edits, replayed | adds and skips are laid back on the rebuilt day -> none is replayed | red | 1 | the fast file |
| launch: order, swaps before edits | the edits are laid after the swaps -> the edits are laid before the swaps | red | 1 | the fast file |
| launch: edit replay, skip | a skipped movement is flagged -> it is not | red | 1 | the fast file |
| launch: edit replay, round | a skipped round is flagged whole -> it is not | red | 1 | the fast file |
| launch: edit replay, add | an added movement is put on the day -> it is not | red | 1 | the fast file |
| launch: edit replay, add mark | an added movement is marked the athlete's -> it is not | red | 1 | the fast file |
| launch: the instant handed over | the page hands the launch the instant -> it hands it none, so every launch reads as 1970 | red | 4 | the fast file |
| launch: the store handed over | the page hands the launch its store -> it hands it an empty one | red | 6 | the fast file |

**The page as built is green, and all 167 breaks turn the records red.**

## Breaks that change no record

| Break | What it does | Result | Why |
|---|---|---|---|
| overlay cache | an overlay's variant is built again for every overlay of the same kind and patch | no record changed | No effect is possible, found in v0.262.1 (tests/measure/stored-state_overlays-gaps.md): buildProgram is a pure function of its config (the engine check holds every digest), so a second build of the same kind and patch gives the same days and the same legal swaps, and a spliced day is a copy. The cache saves time and nothing else. |
| freeze cut, the touched term | the current week, when touched, is not frozen a week further | no record changed | No effect is possible: the next line takes the larger of this and the highest touched week plus one, and a touched current week is at least that week. The term is redundant. |
| history, first touch | a day's snapshot is overwritten on every touch | no record changed | No reachable effect, settled in v0.261.5 (docs/decisions/stored-state.md). The guard decides only when a day is snapshotted again after it changed. A launch gives every snapshotted day back from its snapshot, and an edit is folded into the snapshot as it is made. One tap changes a snapshotted day and leaves its snapshot alone, the rest sheet's Move of a day with a logged lift, and it leaves a moved rest day that nothing snapshots (tests/measure/stored-state_first-touch.md). In 180 random histories, 0 of 4,481 repeat snapshots met a changed day (stored-state_first-touch-walks.md). The rule itself is held by the unit tests. |
| snapshot, a key with no value | a listed key with no value goes into the backup | no record changed | No reachable effect, found in v0.261.8 (tests/measure/stored-state_backup-gaps.md): the snapshot asks the store for a key the store has just listed, and both stores, the browser's storage and the memory store, give a string for every key they list. The guard moved as written; the unit tests hold the snapshot. |
| launch: week of a date, before the start | a date before the program reads as week one -> it reads as a week before one | no record changed | No effect is possible in the grid's path, read in v0.262.2 (tests/measure/stored-state_freeze-gaps.md): overlayWeekRange clamps the week to one again, and the overlay sheet's "picks your program back up" line only asks whether the week is past the last. The unit tests hold the rule. |
| launch: freeze, before the start | before the start the current week is one -> it is a week before one | no record changed | No effect is possible: before the start the broken week is zero or less, the cut is still the furthest touched week plus one, and every week from one on is still pierced. |
| launch: touched, lift log week | a logged lift with no week proves nothing -> it writes a key for week zero or none | no record changed | No effect is possible: a key for week zero or for no week matches no real day and never raises the furthest touched week. |
| launch: empty days dropped | a day with nothing on either side is left out of the week -> it stays as an empty key | no record changed | No record can hold it: the grid in hand is recorded as JSON, which leaves a key with no day out either way. The unit tests hold the week's keys. |
| launch: edit replay, added block | the athlete's own added block is never flagged skipped -> it can be | no record changed | No reachable effect: edits are laid only on a week at or above the cut, which the freeze never fills, so the day is the engine's fresh build and holds no added block when the skips are flagged. The unit tests hold the rule (the edits laid twice). |
| launch: edit replay, add once | an added movement already on the day is not added again -> it is added again | no record changed | No reachable effect: edits are laid only on a week at or above the cut, a fresh build each launch, and each day is laid once. The unit tests hold the rule (the edits laid twice). |
