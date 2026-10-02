# V227 measure — D190 RE-RULING 1 §D premises P9 (parks) and P10 (wording only)

Saved verbatim from measure's return by the main session. Script `tests/measure/v227_d190_p9p10.js`, output `tests/measure/v227_d190_p9p10.out.txt`.

**Headline.** P9 holds: all 6 "neither" cards sit outside (c2-ii)'s population, and ankle/wa adds 18 cards, all ii+g, with 0 "other". P10 holds only in part: the cue causes the RPE 7 form on 6 of the 18 native RPE-7 cards. The other 12 print RPE 7 even with the cue removed.

METHOD: trees `base_v226.html`, `d190_226.html` (measure2/ scratch), plus counterfactual `cf_nocue_226.html` (V226 with the cue append at :8125 replaced by `detail=detail;`, anchor count 1). Cap table typed from the ruling header. A slot is (week, day, section index, item index). Uninjured reference = same cfg without injury, same pref, built on V226.

## P9a — the 6 "neither" U2 cards: found 6 of 390

| card | V226 | D190 | uninjured + same pref, same slot | pattern / capped | same name, same slot | P.swapNames | class |
|---|---|---|---|---|---|---|---|
| lowback {Barbell hip thrust → 45° back extension} W1 thu [3][0] Leg ss B | 45° back extension `2 sets — RPE 7 (leave 3 or more in reserve)` | `2 sets — RPE 8 (stop 2 reps short of failure)` | Kettlebell swing `2×8` (45° back ext is at [3][1]: `2 sets — RPE 6 (leave 3…)`) | hip_ext / capped | no | null / null | OUTSIDE (slot, capped) |
| lowback same, W2 thu [3][0] | same | same | same | hip_ext / capped | no | null / null | OUTSIDE (slot, capped) |
| shoulder {DB decline press → Diamond pushups} W1 mon [2][0] Chest volume | Diamond pushups `3 sets — RPE 7 (leave 3…)` | `3 sets — RPE 8 (stop 2…)` | Diamond pushups `3 sets — RPE 6 (leave 3…)` | hpress / capped | yes | null / null | OUTSIDE (capped) |
| shoulder same, W1 fri [1][0] Pump | `2 sets — RPE 7…` | `2 sets — RPE 8…` | `2 sets — RPE 6…` | hpress / capped | yes | null / null | OUTSIDE (capped) |
| shoulder same, W2 mon [2][0] | `3 sets — RPE 7…` | `3 sets — RPE 8…` | `3 sets — RPE 6…` | hpress / capped | yes | null / null | OUTSIDE (capped) |
| shoulder same, W2 fri [1][0] | `2 sets — RPE 7…` | `2 sets — RPE 8…` | `2 sets — RPE 6…` | hpress / capped | yes | null / null | OUTSIDE (capped) |

- Inside 0, outside 6 (4 out on a capped pattern alone; 2 on both a capped pattern and a different name in the slot). `P.swapNames` renamed none. All are class (iii) on a capped pattern. The uninjured reference reads RPE 6 because W1–W2 on a beginner floors RPE 6; no cue on that build.

## P9b — U2's method on ankle/wa
- Natively cued cards: 6, all Dumbbell Bulgarian split squat `2×10 each — hold RPE 7, two in the tank`, W1–W6 thu, Leg superset A. One distinct source, not two.
- Sheet candidates: DB split-stance DL [hinge], Barbell box squat [squat, capped], Barbell RDL [hinge], Deadlift [hinge], Leg press [squat, capped].

| prefs | builds moved | cards moved / target cards | ii+g | iii | ii (cue only) | other / gone / non-target |
|---|---|---|---|---|---|---|
| 5 | 3/5 (the 3 hinge targets) | 18/34 | 18 | 0 | 0 | **0** |

- (c2-ii) on the 18: byte-equal 12, outside the population 6 (W3/W4, uninjured slot holds Dumbbell goblet side lunge), inside and not equal 0.
- Example: {Bulgarian → DB split-stance DL} W5 thu. V226 `2×10 each — hold RPE 7, two in the tank`; D190 `2×8–12 each @ RPE 8`; uninjured with the pref `2×8–12 each @ RPE 8`. The 2 capped targets (box squat, leg press) do not move.

## P10 — native unloadable accessories on capped patterns (no pref, no swap)

| step | file:line (V226) |
|---|---|
| cue append | index.html:8125 |
| build filter calls | :10903 and :10921 |
| sweep | `unloadableRxSweep` :11173, called at :10963 |
| detail rewrite | `_bwSetsFromDetail` call at :11194 |
| RPE read | `_bwSetsFromDetail` :6754, reads `rpe` at :6757 via `/rpe\s*7/i` (the cue's "RPE 7" matches) |
| beginner floor | :6761 (W1–2 set to 6; W3–4 lowers 8 to 7) |

Direct call: `_bwSetsFromDetail("2×10 each — hold RPE 7, two in the tank",5,"beginner",false)` → `2 sets — RPE 7 (leave 3 or more in reserve)`; without the cue → `2 sets — RPE 8 (stop 2 reps short of failure)`.

| config | capped-pattern cards | unloadable (sets form) | V226 forms | D190 == V226 | CF (cue off) forms | W5+: V226 RPE 7 / CF RPE 8 |
|---|---|---|---|---|---|---|
| mario knee/wa | 12 | 0 | — | — | — | 0 / 0 |
| ankle/wa | 12 | 0 | — | — | — | 0 / 0 |
| lowback/wa | 24 | 6 | RPE 6 ×2, RPE 7 ×4 | 6/6 | RPE 6 ×2, RPE 7 ×2, RPE 8 ×2 | 2 / 2 |
| hip/wa | 30 | 2 | RPE 6 ×2 | 2/2 | RPE 6 ×2 | 0 / 0 |
| elbow/wa | 58 | 16 | RPE 6 ×6, RPE 7 ×10 | 16/16 | RPE 6 ×6, RPE 7 ×6, RPE 8 ×4 | 6 / 4 |
| shoulder/wa | 46 | 6 | RPE 6 ×2, RPE 7 ×4 | 6/6 | RPE 6 ×2, RPE 7 ×4 | 2 / 0 |
| **total** | 182 | **30** | RPE 7 ×18 | **30/30** | | |

- Of the 18 RPE-7 cards, 6 are RPE 7 because of the cue (RPE 8 with the cue off; all W5–W6, lowback 2, elbow 4). The other 12 read RPE 7 with the cue off too: 8 are W3–W4 (beginner floor lowers 8 to 7); 4 are W5–W6 (elbow 2, shoulder 2), source unidentified.
- D190 moves none of the 30 native cards (30/30 equal).
- By week, V226 form / CF form: W1–2 6/6 ×12; W3–4 7/7 ×8; W5–6 7/7 ×4 and 7/8 ×6.
- Examples: lowback W5 sat Strength, Inverted rows (rings) [row]: V226 = D190 `2 sets — RPE 7 (leave 3 or more in reserve)`; cue off `2 sets — RPE 8 (stop 2 reps short of failure)`. elbow W5 tue Pull superset A, L-sit chinups [vpull]: V226 = D190 `2 sets — RPE 7 (leave 3…)`; cue off `2 sets — RPE 8 (stop 2…)`.
- P10 reading: the premise holds on 6 of 18 cards. On 12 of 18 the RPE 7 is set by rule, either the beginner floor (8) or something not yet found (4), not by the cue.

## UNKNOWN
What sets RPE 7 on the 4 W5+ cards (elbow 2, shoulder 2) with the cue off (source text or prevention ceiling; not traced). P10 covers mario's beginner config only. Native unloadables on capped patterns: 0 on knee/wa and 0 on ankle/wa in this config.
