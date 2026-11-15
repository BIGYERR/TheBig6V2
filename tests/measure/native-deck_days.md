# The swipe deck in the Expo app: what today's decks hold, over the standard histories

Written by `node tests/measure/native-deck_days.ts` (read-only). The ten seeded programs, each walked through the
standard history (`tests/support/stored-state.ts`, `life`); at each of its five launches, every training day of
every week turned into today's deck on the page itself, as `deck.ts` builds it.

| What | Count |
|---|---|
| launches | 50 |
| days | 3745 |
| training days | 2755 |
| days whose Start opens the deck | 2628 |
| decks drawn from a set draft | 0 |
| decks drawn from another program's log | 0 |
| decks where the stale warning spoke | 183 |
| cards | 9582 |
| cards: lift | 4555 |
| cards with a swap control | 4461 |
| cards with a cue | 2059 |
| cards with an RPE mark | 3555 |
| moves | 15261 |
| moves with set rows | 15166 |
| moves with a load field | 8208 |
| cards: round | 3204 |
| cards: block | 1712 |
| rest days | 990 |
| days whose only card is the cool down (Start opens the day sheet) | 95 |
| cards: cool | 111 |
| moves with nothing to log | 95 |
| training days with no card | 32 |
| cards logged | 222 |
| moves logged today | 330 |
| moves with a reuse pill | 1209 |
| cards swapped in | 28 |
| cards skipped | 24 |
| moves added by the athlete | 40 |
| moves whose reuse pill is stale | 241 |
| moves carrying the stale warning | 183 |
| programs | 10 |
| moves skipped | 8 |

**A training day carries:** `title` 2755, `dot` 2755, `tags` 2755, `cardio` 2755, `sections` 2755, `_ovKey` 730, `movedFrom` 15

**A section carries:** `label` 8768, `items` 8768, `superset` 3866, `rounds` 3845, `optional` 1647, `hip` 929, `core` 799, `pillar` 799, `coreHeader` 799, `_added` 40

**An item carries:** `name` 15466, `detail` 15466, `_addedByUser` 40, `_skipped` 32
