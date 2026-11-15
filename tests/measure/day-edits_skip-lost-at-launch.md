# Day edits: a skip on a day not yet trained, and the next launch

Written by `node tests/measure/day-edits_skip-lost-at-launch.ts` (read-only). Today's page in the VM harness, HALF_MANNY.

| Before the skip | The move skipped | In the session | After a launch the same evening |
|---|---|---|---|
| no day of week 1 trained | Kettlebell swing, on sat | skipped, `{"w1_sat":{"add":[],"skip":["Kettlebell swing"]}}` | skipped, `{"w1_sat":{"add":[],"skip":["Kettlebell swing"]}}` |
| week 1, mon trained and marked done | Kettlebell swing, on sat | skipped, `{"w1_sat":{"add":[],"skip":["Kettlebell swing"]}}` | **not skipped**, `{}` |

- The same launch is the Expo app's (`refreshStoredProgram`), so the beta does the same, and is held equal to the page on it.
- Not ruled. A skip made in the session that trains the day is kept: the day's snapshot takes it in.
