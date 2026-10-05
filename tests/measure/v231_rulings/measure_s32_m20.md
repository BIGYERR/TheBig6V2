# M20 — V231: is S32-D194-A4 an equivalent mutant now? (saved by the main session)

Measure's return, V231 chat, 2026-10-04. Script `tests/measure/v231_s32.js`, output `tests/measure/v231_s32.out.txt`; raw in
scratch `measure7/`. Candidate 1b403743f8ad1b16; S32 mutant 3afc343beaa8c54b (anchor :10364 in `applySessionSwaps`, count 1).

Short answer: S32 is an equivalent mutant on FIX, OV1, OV5, uninjured and MIX (0 differing booted days each). It is NOT
equivalent on a path the app can reach: the athlete swaps a card and the injury plan changes afterwards (22,647 differing
booted days). That is the hole D194 Amendment 4 cited when it rejected this option ("swap in a hinge, flag a low back two days
later"). No gate in `tests/gates/` sees it.

(1) Gates: 94/94 green on both clean and mutant, 0 crashes, 0 REFUSED; g230 PASS 14 FAIL 0 on both; 90 byte-identical, 4 differ
    only in noise (g195 filename; g226_d189 and g230 temp paths; g231_d198 INFO sha line).
(2) Reach (booted days where the mutant's boot differs from the clean boot; M13's swap-and-boot shape, one hop per day per round,
    swaps through `applySwapChoice`; 1,579 injured cells: L432 432, LBW 432, LBWX 432, FAT 180, NRC 96, D190 6+2, MARIO 1;
    seed 76308):
      FIX 0 / 517,202 (234,856 swaps); OV1 0 / 517,202; OV5 0 / 502,530; UNINJ 0 / 43,750; MIX (INFO) 0 / 517,202.
      Late presentations (every write by app code):
      PRE1 (swap on the uninjured program, then applyInjuryDraft from W1) 10,289 / 489,426 (workaround 6,247, protect 4,042)
      PRE5 (same, from W5) 3,888 / 479,682
      OVOV (OV1 program, swap, then a second overlay on another region) 7,161 / 517,202
      OVT (OV1 program, swap, then the same region at the other tier) 1,309 / 517,202
      Total 22,647 / 3,584,196; reboot repeats every difference; undo+boot 0. Every lattice except MARIO is non-zero on PRE1,
      PRE5, OVOV (PRE1: L432 2,901, LBW 2,812, LBWX 2,638, FAT 1,385, NRC 476, D190 69, MARIO 8; by region lowback 3,984,
      shoulder 2,648, elbow 1,328, ankle 919, knee 885, hip 525).
    Mechanism (sample, up to 3 per cell, 8,611 sampled): the mutant keeps a swapped-in card the clean boot removes (PRE1 2,293
    of 3,394), or prints a duplicate name in one section that the clean boot dedupes (PRE1 1,101). Top PRE1 swap-ins: Mountain
    climbers → Burpees 587, High knees → Burpees 476, Mountain climbers → High knees 278, Back squat → Front squat 266, Ball
    slams → Broad jumps 238. Examples: PRE1 D190 knee/workaround W3 sat (Mountain climbers → High knees, then a knee overlay):
    clean boot drops the whole Explosive finisher (both jumps); mutant keeps `High knees 2×15` on a knee workaround. PRE1 D190
    hip/workaround W5 tue (Incline dumbbell curl → Barbell curl): clean `Biceps{Barbell curl}`, mutant `Biceps{Barbell curl;
    Barbell curl}`. OVT D190 lowback workaround→protect W5 sat (Mountain climbers → Burpees): clean `Explosive finisher{Burpees
    2×15}`, mutant `{Burpees 2×15; Burpees 2×10}`. Cause: the card was screened by `_swapInjuryOK` and the tap filter under the
    plan in force at tap time; the plan governing the day at boot came later.
    Controls: positive control (re-filter line deleted) differs on D190 94/1,764 (FIX, OV1), PRE1 84/1,490, PRE5 33/1,504; swaps
    replay at boot 234,856/234,856; the app never offers a name already on the day (0 of 248,179 candidates).
(3) Idempotence: every built lifting day equals applyInjuryFilter(day, _dayPlanCfg(prog, day)) on every presentation and tier
    (FIX, OV1, MIX, OV5, PRE1, PRE5, OVOV, OVT, UNINJ): 0 non-idempotent. So the narrowing is a no-op whenever the swap was
    chosen under the plan that governs the day at boot; it differs only when the plan changes after the swap.
ROOT: `applySessionSwaps` :10343–10367 (mutated site :10364: clean re-filters the whole day; the mutant re-details only
    surviving `_renamed` items, so it never drops, renames, dedupes or relabels). Day plan `_dayPlanCfg` :9994; swap screen
    `_swapInjuryOK`; late-plan writer `applyInjuryDraft` :15713 (pushes the overlay, refreshProgram, leaves the swap store);
    boot reader :16095.
SPREAD: g230 d194-postsweep (ii) vacuous at 231 (0 post-sweep rejects); no gate writes a swap and then changes the plan before
    booting. Tap-side single-item filter not re-measured (unchanged by S32).
UNKNOWN: seed 76308 only; one hop per day per round; PRE5's `from` date three days back via `_ovDraft.from` (date picker
    offer not checked); overlay removal with a swap in the store, travel overlays and legacy blobs not run; mechanism split is a
    sample; positive control on D190 only; live view after the late overlay not printed.
