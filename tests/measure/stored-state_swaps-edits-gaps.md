# Stored state: which swap and edit rules do the golden records see, before the move?

Written by `tests/measure/stored-state_swaps-edits-gaps.mjs`, run on v0.261.5's build (2026-11-11), before the fifth
lift slice. One break per rule on a copy of the page; `tests/integration/stored-state.test.ts` first, then the two
sweeps for a break it lets through.

| Break | Result |
|---|---|
| swap record (a swap is not stored) | red (fast file) |
| swap rx merge (a pair swapped again forgets the earlier places) | GREEN, the records miss it |
| swap undo (an undone swap keeps its record) | GREEN, the records miss it |
| swap count (a run never counts past one) | GREEN, the records miss it |
| nudge offered (a nudge turned down is not marked) | GREEN, the records miss it |
| skip record (a skipped movement is not stored) | GREEN, the records miss it |
| skip undo (a movement put back stays skipped) | GREEN, the records miss it |
| add record (an added movement is not stored) | GREEN, the records miss it |
| add undo (a removed movement stays added) | GREEN, the records miss it |
| edits prune (a frozen week's edits are kept) | red (fast file) |
| wildcard record (a Wildcard done is not stored) | red (fast file) |
| active id (the active program is not stored) | red (fast file) |

**8 of 12 green.** Why: the next launch freezes a touched week and prunes its edits (`pruneDayEdits`), so the
standard history's skip and add are gone from `ia_edits_` before any record is taken; and no history undoes a swap,
swaps one pair three times or swaps a pair again while its record stands. Closed in v0.261.6 by the case "a day's
swaps and edits, made and undone, and the nudge" (`tests/integration/stored-state.test.ts`), with no launch between
the taps; `tests/measure/stored-state_red-on-break.md` shows each of these breaks red on it.
