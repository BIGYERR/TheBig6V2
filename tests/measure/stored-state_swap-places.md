# Stored state: does any built day hold one lift twice?

Written by `tests/measure/stored-state_swap-places.cjs`, run on the v0.261.6 candidate (2026-11-11).

```
configs 865, days 60550, days with one lift twice 0
```

HALF_MANNY and the 864-config lattice (`tests/lattice193.js`, FULL), every day of every week: no built day holds one
lift twice. So a swap's merge of its undo places is never reached through a duplicate on the day as built. It is
reached through four taps on one day, each sheet offering only names not on the card: swap A for B, swap B for C, add
A back from the add sheet, swap that A for B again. The record of A for B then keeps A's first place and its new one.
HALF_MANNY's week 1 Monday does exactly this in the case "a day's swaps and edits, made and undone, and the nudge"
(`tests/integration/stored-state.test.ts`), and the break "swap places, merge" is red on it.
