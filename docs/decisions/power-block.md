# Power block: decisions

The power block a Full Body day leads with on Athletic Support and on CrossFit gear (`Power — explosive first` and
`Power — lower explosive`, built in `core/src/engine/engine-c.ts`), and its one prescription writer, `_powerPrescribe`,
with `_powerDose`, `_POWER_COST` and `_POWER_REST` in `core/src/engine/power-accessory.ts`. Earlier rulings on it live in
the handoff (V129 the power class, V130 the dose from the budget, V143, V144 D4, V170 D1 to D5). Tests:
`tests/integration/power-block.test.ts` (it boots the page, so it runs against any release through `IA_APP`).

## D260: P-POWERSETS, a max-intent power movement runs 3 to 5 sets, and the trap bar jump says light bar (v0.250.0)

- **Date:** reported and ruled 2026-10-27. **Ruled by:** coach (the main session in the coach hat), at Mario's ask.
  **Mario:** concurred 2026-10-27, "I concur with D260 P-POWERSETS as ruled." **Bump:** MINOR, v0.250.0
  (Mario, 2026-10-27). **Shipped:** v0.250.0.
- **The report (Mario, a phone screenshot of W2 Saturday, Full Body with an LSD run):** `Trap bar jump 7×3 — max
  intent, ~2 min rest`, logged at 135 lbs, then Jump squats. "wtf is doing 7 sets of 3 reps doign for an athelte ?does
  it make sense?" Then: "have the coach set a rule, i already konw its not in any doctrine, unless you wanna find some
  reliable respectible stuff online".
- **The finding (measure on v0.249.1, `tests/measure/power-block_set-count.js`, report `.out.txt` beside it):**
  `_powerDose` writes sets = round(budget × age mod × 0.20 ÷ (cost × reps)), clamped 3 to 10. An intermediate's
  double-leg jump triple: 110 × 0.20 ÷ 3 = 7.3, so 7 sets. Beginner 6, advanced 9. Over 1,188 programs (the 864-config
  lattice on HALF_MANNY, and 324 NSW test-goal programs: pace and base, Athletic Support and Injury Prevention, three
  gear tiers, every experience and age, three seeds), **165 of 893 power items priced above 0.5 print more than 5
  sets**; a block runs up to 14 sets and 28 minutes of prescribed rest; the median block is 35 reps. The 0.20 share was
  tuned so experience would move the number inside the clamp (the comment above `_powerDose` says so); no source
  wrote it. The 80 to 140 contact bands it divides are a whole plyometric session of submaximal drills, and the
  doctrine files on disk (the 2020 guide, the 11-page SEAL guide, the four Nike plans) say nothing about plyometrics,
  jumps or power. The 135 lbs is Mario's own entry: the app never fills a load (V131), and the card says nothing
  about how heavy.
- **Outside sources (read online 2026-10-27, Mario's ask):**
  - NSCA, *Essentials of Strength Training and Conditioning* (Haff and Triplett), the power rows of the goal table:
    3 to 5 sets, 1 to 2 reps (single effort) or 3 to 5 reps (multiple effort), 2 to 5 minutes rest. Read through the
    CSCS study guides that reproduce the table, not the book itself.
  - Turner, Tobin and Delahunt, *J Strength Cond Res* 2015, 29(6):1627–1632: the hexagonal bar jump squat peaks in
    power between 10 and 20 percent of a box squat 1RM (reported by the papers citing it; the full text not read).
    Swinton et al. 2012, as cited in the same reviews: 20 to 40 percent of a back squat 1RM.
  - Llanos-Lagos et al., *Sports Medicine* 2024 (PMC11052887): in middle and long distance runners, plyometric
    training improves running economy, a small effect with moderate certainty of evidence.
- **Coach's argument:** "The power block earns its place for a runner. Fast, stiff ground contacts make a better
  stride, and the meta-analysis says so. But power is a quality of the rep, not of the pile. The gain comes from the
  first few fast, fully rested sets. Past four or five, most athletes jump lower and slower, and the extra sets are
  fatigue sitting on the day of the long run. Every source I can stand behind writes power as 3 to 5 sets. Ours
  writes 7 for an intermediate and 9 for an advanced athlete because we divided a whole plyometric session's contact
  budget between two movements and let the arithmetic pick the sets. Keep the budget, keep the costs, keep experience
  and age scaling it. Just spend it where the sources spend it: 3 to 5 sets. And a trap bar jump is a jump with a bar
  in your hands, not a deadlift you leave the floor on. The research puts its best power at a light load. The card
  should say so, because the athlete picks the weight."
- **What changes:**
  1. **Sets, for a movement priced above 0.5 in `_POWER_COST`:** sets = round(budget × age mod × 12 ÷ 110 ÷ (cost ×
     reps)), clamped 3 to 5. Derivation: 12 ÷ 110 puts the reference athlete (intermediate, 18 to 35, a double-leg
     jump triple) at 4 sets, the middle of NSCA's 3 to 5; 5 is the top of that band; 3 stays the floor (V130's "below
     3 is not a training stimulus", NSCA's bottom). Experience and age still scale the dose (V144 D4-i stands).
  2. **Cue:** the Trap bar jump prints `light bar, ` before its cue: `light bar, max intent` in the lead slot,
     `light bar, explosive` in the second. No other movement's cue changes.
  - The deload keeps its own rule (60 percent of the sets, never under 2), so it now reads 3→2, 4→2 and 5→3.
- **What deliberately does not change:**
  - The 0.5 tier (Kettlebell swing, Ball slams, Wall ball shots, Plyo pushups): V170 D3's density dose stands
    (share 0.20, 10 reps, clamp 3 to 10). It is not max-intent work, and NSCA's power band does not describe it.
  - Reps by slot (3 and 5), rest by cost (V170 D1), the cost table and the tier gates by experience and age (V129,
    V144 D4-ii), the budgets 90, 110 and 130 and the age mods, and which movements are picked.
  - V130's warning (never add sets to reach the band) stands; this ruling moves the other way.
  - A power block on a short LSD day: D140 puts an NSW long run under 45 minutes in tier C, which keeps power. Not
    reopened.
- **Expected values (typed by hand from the formula above; the lead slot, a cost 1.0 triple, was → now):**

  | | 18 to 35 | 36 to 54 | 55+ |
  |---|---|---|---|
  | beginner | 6 → 3 | 6 → 3 | 5 → 3 |
  | intermediate | 7 → 4 | 7 → 4 | 6 → 3 |
  | advanced | 9 → 5 | 8 → 4 | 7 → 4 |

  Every second-slot item priced above 0.5 (5 reps) prints 3 sets at every experience and age (was 3 to 5). Every
  1.5 and 2.0 triple prints 3 (an intermediate split squat jump lead was 5, an advanced box jump lead was 4). An
  intermediate Kettlebell swing lead stays `4×10 — fast and crisp, 60s rest`.
- **Before and after (harness, v0.249.1 and a source-surgery copy, `tests/measure/power-block_set-count.js`):**
  - pace goal, Athletic Support, CrossFit gear, intermediate, 18 to 35, seed 3039, W3 Saturday, Full Body, LSD:
    before `Trap bar jump 7×3 — max intent, ~2 min rest | Pogo hops 4×5 — explosive, ~2 min rest`;
    after `Trap bar jump 4×3 — light bar, max intent, ~2 min rest | Pogo hops 3×5 — explosive, ~2 min rest`.
  - pace goal, Athletic Support, CrossFit gear, advanced, 18 to 35, seed 1013, W1 Saturday, Full Body, LSD:
    before `Pogo hops 9×3 — max intent, ~2 min rest | Wall ball shots 5×10 — fast and crisp, 60s rest`;
    after `Pogo hops 5×3 — max intent, ~2 min rest | Wall ball shots 5×10 — fast and crisp, 60s rest`.
  - Over the 1,188 programs: items above 5 sets 165 → 0; the largest block 14 → 10 sets (an advanced 5×3 lead with a 5×10 swing-tier second);
    the median block 35 → 27 reps.
- **Blast radius (v0.249.1 against the surgery copy):** **HALF_MANNY does not move** (digest `e47eb1012ab04bff` both
  sides; its one power day is 0.5-tier work). The lattice moves 7 of 864 programs, all healthy on CrossFit gear. The
  NSW sample moves 128 of 324 programs and 586 of 1,218 power items. Golden files that move with this ruling:
  `tests/snapshots/program-output-lattice.json` (those 7 cells) and `tests/snapshots/program-output.json` (2 of its
  programs: `marathon, crossfit, athletic support, 36-45` and `run base and bike base, crossfit, balanced`). Three
  PRT TING pins in `tests/integration/session-budget.test.ts` move too, because PRT TING carries a power block; they
  are re-pinned in the release commit with this ruling named. No existing test pins the current set counts.
  **Missed at ship (found 2026-10-28, when Mario asked for the CI runs on c077c61, df76378 and pull request 6):** two
  more sweep golden files move with D260, and v0.250.0 left them unregenerated, so CI's unit and integration job was
  red. `tests/snapshots/leg-accessory-trim-order.json`: days over the session cap 6,368 → 6,320 and over-cap days the
  push order leaves untouched 3,887 → 3,839, the same 48 days back under the cap on fewer power sets; the push order's
  own counts do not move. `tests/snapshots/session-budget-lattice.json`: days the budget changes 3,614 → 3,540; the
  census by tier and class does not move. Both sweeps pass on v0.249.1 and fail on v0.250.0, and the only engine
  change between them is D260. Regenerated under this ruling in the Post-v0.250.0 sweep snapshot pass (tests only).
- **Tests (each behaviour, its hand value):**
  - an intermediate, 18 to 35, Trap bar jump lead prints `4×3 — light bar, max intent, ~2 min rest`;
  - the lead slot's sets for a cost 1.0 triple follow the table above, all nine cells;
  - a 5-rep second-slot item priced above 0.5 prints 3 sets for every experience and age;
  - a Trap bar jump in the second slot prints `light bar, explosive`;
  - an intermediate Kettlebell swing lead still prints `4×10 — fast and crisp, 60s rest` (guards what must not move);
  - a deload week's intermediate Trap bar jump prints `2×3`;
  - across a sweep of NSW and lattice programs no power item priced above 0.5 prints more than 5 sets or fewer than 3
    outside a deload week;
  - HALF_MANNY's digest stays `e47eb1012ab04bff` (held by `tests/snapshots/program-output.json`, which did not move for
    it; a pin in the feature file would go red on any later ruling that moves HALF_MANNY).
- **Recommendation:** ship it. It cuts the set count to what NSCA's power table allows, keeps every earlier power
  ruling that still holds, and leaves HALF_MANNY alone. **The strongest counter:** V144 D4 settled the power budget,
  and an athlete who was progressing on 7×3 now reads 4×3. The answer is that the budget still sets the dose; only the
  share each movement takes changes, and nothing sourced backs 7.

## P-POWERPAIR: two movements from one family in a block (held, no D-code)

- **Date:** 2026-10-27, coach, from the same screenshot (Trap bar jump, then Jump squats). **Status:** held by coach;
  comes back only if Mario wants it.
- **The finding:** 190 of 639 two-movement blocks pair two movements from one family (158 two two-leg vertical jumps,
  32 two hip ballistics; families typed by hand in the measure script).
- **Why held:** the only family table the repo carries is `_POWER_COST`, and its rows are cost classes, not movement
  families (Seated box jumps have their own row; a swing and a clean sit in different rows). A candidate that kept the
  second slot out of the lead's row stripped the second movement from 108 of 639 blocks and still left 124 same-family
  pairs. A real rule needs a family table no source here writes. At D260's dose the overlap costs about 3 sets and 6
  minutes, not the 20 it cost before.

## Seen in passing (not ruled)

- Plyo pushups in a power block print `N sets — RPE 8 (stop 2 reps short of failure)`: the bodyweight sweep rewrites
  their dose after `_powerPrescribe`, so a power movement carries an effort cue written for strength work (72 items on
  the lattice at RPE 8). Listed for Mario; not part of D260.
