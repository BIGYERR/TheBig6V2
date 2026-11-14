# Stored state: applyOverlays, its reach, its callers, and are the records blind to its rules? (on 0.262.0)

Written by `tests/measure/stored-state_overlays-gaps.mjs` (read-only), from the built page and the source files.

## 1. What the function reaches

`applyOverlays` is 36 lines of the built page. It uses these names of the page and of core; a page name's own reach is followed, a core name's is not.

| Name | Declared in | Depth | Lines | Names it uses | ia_ keys it names |
|---|---|---|---|---|---|
| `_parseLocalDate` | core `calendar.ts` | 1 | 7 | none | none |
| `_progDayDate` | page `week-view-sections.ts` | 1 | 7 | getWeekMonday | none |
| `getWeekMonday` | core `calendar.ts` | 2 | 9 | none | none |
| `buildProgram` | core `budget-engine-d.ts` | 1 | 9 | _swapUniverseReset, engineA_timeline, engineB_cardio, engineC_kinematics, engineD_synthesis, planCalendar | none |
| `overlayWeekRange` | page `overlays.ts` | 1 | 9 | weekOfDate | none |
| `weekOfDate` | page `overlays.ts` | 2 | 7 | _parseLocalDate, getWeekMonday | none |
| `showToast` | page `rest-day-shell.ts` | 1 | 1 | none | none |

ia_ keys named in `applyOverlays` itself: **none**. Store calls in it (`iaStore`): 0.

## 2. Who calls it, and who calls what it reaches

| Name | Calls in the built page | From |
|---|---|---|
| `applyOverlays` | 1 | refreshProgram |
| `_progDayDate` | 2 | applyOverlays, dayBeforeStart |
| `overlayWeekRange` | 10 | _liveInjuryOverlay, _renderTravelTab, applyInjuryDraft, applyOverlayDraft, applyOverlays, overlaySpanLabel, refreshProgram, renderOverlayChip, renderWeekView ×2 |
| `weekOfDate` | 3 | overlayBackCopy, overlayWeekRange ×2 |
| `showToast` | 65 | _afterEdit ×2, acceptSwapNudge, applyBackup, applyInjuryDraft ×4, applyOverlayDraft ×5, applyOverlays, applyRestCardio ×2, applyRestMove ×2, applySwapChoice, archiveProg, clearRestCardio, commitGoalChange, commitMileChange ×3, commitRename, completeWildcard, copyExport ×2, copyProgSel, deleteProg, doGenerate ×2, engineCheckRun, handleDayStatus ×2, injSnooze, loadActiveProgram, logCardio ×2, offerShorterPlan, openAddSheet, openDayKey, openInjurySheet, openOverlaySheet, openRestSheet ×2, openSwapSheet, removeOverlay, resetWildcardCounter, resolveReminder, saveBackup ×3, saveExWeight ×2, selectKBSize, setActive, setProgRace ×2, setProgStart, tabGo, toggleRestDay, unarchiveProg, undoSwap |

## 3. A break inside each rule, against the records

21 breaks and the control; **5 green on the records** (the control must be red).

| Break | The rule | What the break does | The records | Tests red |
|---|---|---|---|---|
| log key (control) | the control | a log is stored under w1-mon | red (the fast file) | 4: HALF_MANNY through the standard history: the same history twice leaves the same bytes; a key holding broken JSON reads as empty, and the next log replaces it; a day's parts settle its status: a skipped lift with a logged run is done, both parts skipped is skipped, and neither latches; what Progress reads from three weeks of runs, the nudge taken, and a second program: the readers, the seed and the purge warning are in the records |
| order | later made wins: overlays are applied oldest first | the newest overlay is applied first, so the oldest wins | red (the fast file) | the golden file |
| kinds, injury | an injury overlay is applied | an injury overlay is skipped | red (the fast file) | 1: a logged day with no history kept, in a week an injury then covers, takes the injured form at the next launch |
| kinds, travel | a travel overlay is applied | a travel overlay is skipped | red (the fast file) | the golden file |
| window, last week | every week of the span is searched | the last week of the span is not searched | red (the fast file) | the golden file |
| window, first week | every week of the span is searched | the first week of the span is not searched | red (the fast file) | 1: a logged day with no history kept, in a week an injury then covers, takes the injured form at the next launch |
| key | a day is stamped with its overlay's kind and patch | the stamp and the cache key hold the kind only | red (the fast file) | the golden file |
| travel mark | a travel variant builds as a temporary setup | a travel variant builds as the athlete's own gym | GREEN (blind) |  |
| patch, travel | a travel variant builds from the patched config | a travel variant builds without its patch | red (the fast file) | the golden file |
| patch, injury | an injury variant builds from the patched config | an injury variant builds without its patch | red (the fast file) | the golden file |
| clean injury build | an injury variant builds without the travel mark | an injury variant builds as a temporary setup | red (the sweeps) | 2: the ten seeded programs: each one through the standard history, twice the same, leaves its golden bytes; a sample of the lattice (every 36th of 864 configs): each through the standard history, twice the same |
| day unit, from | a day before the span keeps the base | a day before the span, in its first week, takes the variant | red (the fast file) | the golden file |
| day unit, to | a day after the span keeps the base | a day after the span, in its last week, takes the variant | red (the fast file) | the golden file |
| day unit, first day | the span's first day takes the variant | the span's first day keeps the base | red (the fast file) | 1: a logged day with no history kept, in a week an injury then covers, takes the injured form at the next launch |
| day unit, last day | the span's last day takes the variant | the span's last day keeps the base | red (the fast file) | the golden file |
| rest days | a rest day of the variant leaves the base day alone | a rest day of the variant replaces the base day | red (the fast file) | the golden file |
| stamp | a spliced day carries its overlay key | a spliced day carries no key | red (the fast file) | the golden file |
| splice | a day in the span takes the variant's day | no day takes the variant | red (the fast file) | 1: a logged day with no history kept, in a week an injury then covers, takes the injured form at the next launch |
| swap universe | the variant's legal swaps ride on the program by overlay key | no variant's legal swaps are kept | GREEN (blind) |  |
| failure | an overlay that fails is reported and the others still apply | a failing overlay stops every later one | GREEN (blind) |  |
| cache | one build per distinct kind and patch | a build per overlay | GREEN (blind) |  |
| length | the span is clamped to the rebuilt program's length | the span is clamped to the stored length only | GREEN (blind) |  |
