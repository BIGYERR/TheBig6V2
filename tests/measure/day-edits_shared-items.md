# One item object on several days: what the engine hands back, and what an edit to it reaches

Read-only measure, today's page in the VM harness and core in this process, America/New_York.

## A. The ten seeded programs, the grid in hand on today's page

| program | items | item objects on more than one day | the places they stand in | their sections |
|---|---|---|---|---|
| half-manny (Mario, NRC half, crossfit) | 368 | 10 | 26 | section 2 13, section 3 13 |
| 5k race, commercial, strength, beginner | 250 | 2 | 4 | section 2 2, section 3 2 |
| 10k race, home basic, hypertrophy, advanced | 171 | 0 | 0 | none |
| marathon, crossfit, athletic support, 36-45 | 446 | 1 | 2 | section 3 2 |
| 1.5 mile test goal, minimal, fat loss, beginner | 315 | 9 | 30 | section 2 15, section 3 15 |
| 1.5 mile test goal, commercial, balanced | 357 | 8 | 19 | section 2 11, section 3 8 |
| run base, bodyweight, balanced | 227 | 0 | 0 | none |
| bike ftp, home full, strength support, advanced | 247 | 1 | 2 | section 3 2 |
| swim 500, commercial, prevention support | 349 | 5 | 10 | section 3 10 |
| run base and bike base, crossfit, balanced | 288 | 1 | 2 | section 3 2 |

8 of 10 programs hold one; 37 item objects stand in 95 places.

THE HALF MANNY's, each with its places:

- Suitcase carry (3×40 yd each): week 1 tue, week 6 fri, week 7 tue
- Bird dogs (3×12 each): week 1 tue, week 9 tue
- Medicine ball rotary toss (3×8 each): week 1 fri, week 7 fri
- Side plank (3×30–45 sec each): week 2 fri, week 3 tue, week 9 tue
- Plank shoulder taps (3×12 each): week 2 fri, week 3 tue, week 10 fri, week 11 tue
- Side plank thread-the-needle (3×10 each): week 3 fri, week 11 fri
- Pallof press (3×12 each): week 5 tue, week 10 fri, week 11 tue
- Band woodchopper (door anchor) (3×12 each): week 5 fri, week 6 tue, week 11 fri
- Russian twist (heels down) (3×8 each): week 5 fri, week 6 tue
- Farmer carry (3×40 yd): week 6 fri, week 7 tue

## B. THE HALF MANNY on today's page: one of them skipped on its first day

- Suitcase carry stands on week 1 tue and on week 6 fri, week 7 tue. Before the skip, skipped there: week 6 fri: false, week 7 tue: false.
- After `skipExercise` on week 1 tue, in the same launch, skipped on its other days: week 6 fri: true, week 7 tue: true. Toast: "Suitcase carry is off today. Tap to put it back.".
- What the skip stored: `ia_edits_` {"w1_tue":{"add":[],"skip":["Suitcase carry"]}}.
- After a fresh launch on those keys, skipped on its other days: week 6 fri: true, week 7 tue: true.

## C. Core in one process, as the Expo app holds it: two builds of one stored program

- 28 of 384 items are the same object in both builds. A grid the Expo app holds as the launch hands it back shares them with every later build in the process; the tests' walks hold a copy (`tests/support/native-this-week.ts` `nativeGrid`), so none of them writes to a shared one.

## D. Met by the proof of the Expo app's nudge (tests/support/native-deck-logging.ts), not measured here

- *A swap, then Make the change, in one launch of today's page.* The 1.5 mile commercial program, its first week: Bird dogs swapped for Farmer march on one day, then a nudge accepted on another lift two days on. The program the page then holds has Farmer march at 3×10–15 each @ RPE 8 on week 9 Tuesday, where a fresh launch on the same keys has Bird dogs at 3×12 each. Once in 40 nudges accepted over the ten programs (`leaked` in the walk's tally).
- *A preference that names one of these items.* The bodyweight program, its third week: the nudge accepted for Bird dogs to Ab wheel rollouts. A build later in the same process has Ab wheel rollouts on week 8 Thursday, alone in its block; a fresh launch on the same keys has Bird dogs at 3×20 alternating with McGill curl-up beside it. The rebuild renamed the engine's own item, and a fresh build does not make the trade on that day. The walk answers such a nudge Leave the plan alone (4 of 87 over the ten programs, `spared`), so Make the change on a core, trunk or carry move is not proved equal.

