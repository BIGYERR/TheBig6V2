# Stored state: can a tap change a day after its snapshot, before its next one?

Written by `tests/measure/stored-state_first-touch.ts` on HALF_MANNY, week 1. X is mon (the first training day), R is wed (the first rest day after it).

After one lift logged on mon (Barbell Romanian deadlift): snapshot kept, completion none, log entry {"week":1,"ts":1788213600000}.

## 1. a lift logged on mon
| Day | In hand | Snapshot | In hand equals its snapshot |
|---|---|---|---|
| mon | Posterior Chain | Posterior Chain | yes |
| tue | Strength Support | none |  |
| wed | rest | none |  |
| thu | Leg Strength + Mobility | none |  |
| fri | Recovery Lift | none |  |
| sat | Full Body Support | none |  |
| sun | rest | none |  |

On wed, the rest sheet offers these sessions to move: mon, tue, thu, fri, sat. mon (a lift already logged) is **offered**.

## 2. mon moved onto wed (same launch)
| Day | In hand | Snapshot | In hand equals its snapshot |
|---|---|---|---|
| mon | rest (moved to wed) | Posterior Chain | **no** |
| tue | Strength Support | none |  |
| wed | Posterior Chain (moved from mon) | none |  |
| thu | Leg Strength + Mobility | none |  |
| fri | Recovery Lift | none |  |
| sat | Full Body Support | none |  |
| sun | rest | none |  |

## 3. the next launch, wed not yet trained
| Day | In hand | Snapshot | In hand equals its snapshot |
|---|---|---|---|
| mon | rest (moved to wed) | Posterior Chain | **no** |
| tue | Strength Support | none |  |
| wed | Posterior Chain (moved from mon) | none |  |
| thu | Leg Strength + Mobility | none |  |
| fri | Recovery Lift | none |  |
| sat | Full Body Support | none |  |
| sun | rest | none |  |

## 4. the moved session trained on wed (same launch)
| Day | In hand | Snapshot | In hand equals its snapshot |
|---|---|---|---|
| mon | rest (moved to wed) | Posterior Chain | **no** |
| tue | Strength Support | none |  |
| wed | Posterior Chain (moved from mon) | Posterior Chain (moved from mon) | yes |
| thu | Leg Strength + Mobility | none |  |
| fri | Recovery Lift | none |  |
| sat | Full Body Support | none |  |
| sun | rest | none |  |

## 5. the launch after that
| Day | In hand | Snapshot | In hand equals its snapshot |
|---|---|---|---|
| mon | Posterior Chain | Posterior Chain | yes |
| tue | Strength Support | none |  |
| wed | Posterior Chain (moved from mon) | Posterior Chain (moved from mon) | yes |
| thu | Leg Strength + Mobility | none |  |
| fri | Recovery Lift | none |  |
| sat | Full Body Support | none |  |
| sun | rest | none |  |

At that launch mon and wed **both hold the session**: the day it was moved from is a training day again.

A further touch of mon: its day equals its snapshot, and the history key is unchanged.

Every ia_ key at the end, sha256: `075178481d7a9dd24351b2854b67a8ca41a804e9ee362a4268484f7478b333dd`
