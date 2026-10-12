# Group 3: boot and build basics

Phase 2 parity record (`docs/test-migration.md`, the parity rule). The legacy gate stays in `tests/gates/` and keeps
running in CI until phase 3 deletes the machinery; this file is what explains its rows when the manifest drops them.

- **Gate:** `g000_boot.js` (9 rows).
- **New tests:** `tests/integration/boot.test.js` (6 tests). The app's clock is pinned to 2026-10-11 12:00 local (the
  same today as `tests/integration/program-output.test.js`), so the build reads one today in every run; the gate built
  on the real clock.
- **Oracles:** the doctrine (Nike's half plan is 14 weeks), the calendar (2026-12-06 is a Sunday, checked by date
  arithmetic) and the fixture (rest days Sunday and Wednesday, seed 76308), each checked by "the hand values match the
  fixture and the calendar".

## Rows

| Gate | Row | Held by |
|---|---|---|
| `g000_boot.js` | `G000-exports-buildProgram` | `tests/integration/boot.test.js` › "the app boots and exports buildProgram, refreshProgram and raceAlignment" |
| `g000_boot.js` | `G000-exports-refreshProgram` | `tests/integration/boot.test.js` › "the app boots and exports buildProgram, refreshProgram and raceAlignment" |
| `g000_boot.js` | `G000-exports-raceAlignment` | `tests/integration/boot.test.js` › "the app boots and exports buildProgram, refreshProgram and raceAlignment" |
| `g000_boot.js` | `G000-builds-HALF-MANNY` | `tests/integration/boot.test.js` › "Mario's half marathon program builds, with its seed pinned" |
| `g000_boot.js` | `G000-seed-pinned` | `tests/integration/boot.test.js` › "Mario's half marathon program builds, with its seed pinned" |
| `g000_boot.js` | `G000-half-14-weeks` | `tests/integration/boot.test.js` › "the half marathon plan is 14 weeks long" |
| `g000_boot.js` | `G000-race-W14-SUN` | `tests/integration/boot.test.js` › "race day is the race session on week 14 Sunday" |
| `g000_boot.js` | `G000-W1-rest` | `tests/integration/boot.test.js` › "the athlete's rest days, Sunday and Wednesday, are rest in week 1" |
| `g000_boot.js` | `G000-self-stable` | `tests/integration/program-output.test.js` › "every program equals itself when built twice" (its first config is `fixtures.HALF_MANNY`; held there, not repeated) |

**Totals:** 9 rows; 9 mapped (8 to `boot.test.js`, 1 to `program-output.test.js`), 0 dropped.

## Mutations

Mutations naming the gate (`tests/sabotage/example.json`), applied to a scratch copy of `index.html`, with
`IA_APP=<copy> node --test tests/integration/boot.test.js`:

| Mutation | Result |
|---|---|
| race pin removed (`NRC_GOALS` emptied) | caught: "the half marathon plan is 14 weeks long", "race day is the race session on week 14 Sunday" |
| no-op mutation (an anchor that does not exist) | not applied: its anchor occurs 0 times by design (the example of a NOT-APPLIED report) |

**1 of 1 applicable caught.**

## The release before

These tests guard behaviour no ruling changed; they pass on V238 and V239 as on today's body.
