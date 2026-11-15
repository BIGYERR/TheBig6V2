# Set logging: does Log store another move's sets?

Written by `node tests/measure/set-logging_shared-rows.ts` (read-only). The page: `dist-github-pages/index.html`, ia-version 0.262.2.

## 1. The proof, at the seed

- The program: **run base, bodyweight, balanced**, as the wizard generates it. The day: week 4, mon, Legs.
- `split_squat`: Split squat, "3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest", **3 rows**, typed 8, 8, 7.
- `split_squat_heel_raise_hold`: Split-squat heel-raise hold, "2×30 sec each", **2 rows**, typed 31, 32.
- Log on Split squat stores `setsDone` **[8,8,7,31,32]**: 5 sets for a move of 3.
- The card drawn again from that entry: the summary reads "**8 / 8 / 7 / 31 / 32**", marked Varied; its rows hold 8, 8, 7.
- Log on Split-squat heel-raise hold stores `setsDone` [31,32], its own rows.

## 2. How often

A day counts when it holds a move with a Log button beside a move with set rows whose key starts with the first one's key and an underscore.

| Programs | Built | Holding such a day | Training days | Days with a pair | The pairs, by day |
|---|---|---|---|---|---|
| The shared lattice (`tests/lattice193.js` FULL, over HALF_MANNY) | 864 | 85 | 60480 | 285 | `pike_pushups / pike_pushups__feet_elevated_` 168, `side_plank / side_plank__top_leg_raised_` 22, `single_leg_hip_thrust / single_leg_hip_thrust__shoulders_on_bed_` 29, `split_squat / split_squat_heel_raise_hold` 66 |
| HALF_MANNY alone (Mario's config, as built) | 1 | 0 | 70 | 0 | none |
| The ten seeded programs (`tests/support/programs.ts`) | 10 | 1 | 551 | 5 | `pike_pushups / pike_pushups__feet_elevated_` 3, `split_squat / split_squat_heel_raise_hold` 2 |

- First on the lattice: healthy bodyweight support_prevention beginner seed=1013, week 3, tue. First of the ten: run base, bodyweight, balanced, week 4, mon.
- A program as built holds no swap and no added move. A swap or an add on the phone can make a pair the build did not.

## 3. Who else reads rows by the start of an id

Every `[id^=`, `[id*=` or `[id$=` in `frontends/app/src`, `frontends/native/src` and `core/src`: **1**.

- `frontends/app/src/legacy/src/js/day-detail.ts:245` const rows = Array.prototype.slice.call(document.querySelectorAll('input[id^="exset_'+exKey+'_"]'));

`setRepVals`, `setWeightVals` and `rawSetVals` (`set-logging.ts`) walk `exset_<key>_<set>` and `exsetw_<key>_<set>` one id at a time until none answers, so each reads its own move only.
