# Stored state: random histories, and whether a day is ever snapshotted again after it changed

Written by `tests/measure/stored-state_first-touch-walks.ts` (200 histories asked for, 60 taps each, over the 10 seeded programs).

| What | Count |
|---|---|
| Histories walked | 180 |
| Taps | 10800 (0 threw in the harness and were passed over) |
| Calls of snapshotDay | 5711 |
| of those, on a day that already had a snapshot | 4481 |
| of those, with the day in hand different from its snapshot (the guard decides what is stored) | **0** |
| Times a tap left a snapshotted day in hand different from its snapshot (counted after every tap) | 840 |
| of those, the day in hand was a rest day its session was moved away from | 840 |

Taps by kind: add 443, back 459, done 462, injury 450, jog 473, later 948, lift 1337, move 1342, part 935, removeOverlay 434, run 438, skip 443, skipMove 423, swap 911, travel 438, undoSwap 421, unskipMove 443.
