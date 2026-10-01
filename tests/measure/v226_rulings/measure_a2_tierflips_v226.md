# Measure D — D188 tier moves, both directions (after gatekeeper run 1 RED)

Persisted by the orchestrator from measure's return, 2026-09-30 (measure is read-only).
Script: `tests/measure/v226_a2_tierflips.js`; output: `tests/measure/v226_a2_tierflips.out.txt`.

## Refutes the ruling's A2 numbers
A2 is not one-directional. A slower entered mile also moves tiers the other way: 1,800 long-run days in 1,080 / 28,350 beginner programs go to a longer tier (C→B 1,080 days, B→A 720 days), i.e. less lifting; B→A is lift → mobility only. All are run_base on the event path with a support_* focus, mile 12:00 to 14:00; within that slice 1,080 / 1,080 programs, every age, rest, seed, equipment.

REPRO gatekeeper's cell (run_base 3mi, support_prevention, event, mon/thu/sun, seed 1000, mile 13:00), W3 SAT `Easy Run — Long`: V225 40 min at 14:05 (tgt 845) → tier C; V226 45 min at 14:30 (tgt 870) → tier B.

## Method
Lattice: 10 goal variants (pace 12:00 and 13:30 target, 5k, 10k, half none/5mi, marathon none/8mi, base none/3mi) × 9 miles × all 7 wizard focuses (support_* on event, body focuses on hybrid) × 3 ages × 3 rest × 5 seeds = 28,350 beginner cells, 56,700 builds, commercial. Oracle: tier from dose minutes and doctrine thresholds 75/45; disagreed with `_longRunTier` 0 times. Self-identity 4,050 cells, 0 diffs either side; 0 crashes.

## Finding — 9,600 tier-moved days across 4,740 / 28,350 programs
- 6,540 days / 3,345 programs shorter tier (more lifting): A→B 10k, half, half 5mi, marathon, marathon 8mi 630 each; pace12 1,260; pace13:30 at 10:00 or 11:00 630; base 315. B→C 1,065.
- 1,800 days / 1,080 programs longer tier (less lifting): base and base3mi only, all support_* focuses; 1,080 at W3 C→B (40→45 min), 720 B→A at W7 and W9 (70→75 min). 0 in body focuses.
- 1,260 days / 315 programs length-confounded: pace13:30 at 9:00 drops 11 → 9 weeks (E3): 945 days whose long run disappears (A or B → none), 315 days C→B at a faster mile through week realignment, 5,775 non-long-run days whose sections changed. 315 C→C long-run days changed sections with no tier move, all in that block.
- Equipment: no effect (commercial, home_full, bodyweight each 3,840 days over 2 seeds).

## Root
`_longRunTier` index.html:11014; minutes `d.mi*d.tgt/60` or `mins` (:11022); ≥75 A, ≥45 B (:11024); applied by `d18LongRunDayPass` (:11056). run_base long run `round5(dist × _row.recovery/60)` :3969; `_row` from `_anchorSec = _mileBestSecs || _expCurrentPace` (:3816-3818): slower entered mile → slower recovery pace → more minutes → a step at the 5-minute rounding.
Why coach saw 0 at 13:00: coach's lattice used balanced on hybrid only, where run_base long days are a fixed B45 at W6/W8 that never scale with pace. Missing axis: primaryPath event × support_* focus. Pace goals at 13:00 gain 0.4–1.9 min, cross no threshold.

## Population checks
- Non-beginners: 22,680 cells, 0 tier moves, 0 section changes (20,160 byte-identical; 2,520 no-mile cells differ elsewhere).
- Beginner no mile: 0 tier moves, 0 section changes (3,150 differ outside long-run lifting: the S1 note).
- Beginner at 11:30: 3,150 / 3,150 byte-identical.
- Direction: 0 tier-read moves against the sign of (mile − 690 s); the only 315 against-sign are the confounded pace13:30 9:00 W8 days.
- Banned content on 301,725 V226 long-run days: carries 0, hinge on B 0, power on B 0, lifting on A 0, >8 sets on B 0.

## UNKNOWN
Body focuses on hybrid only; one race date (2026-12-20), one start date; miles faster than 9:00 or slower than 14:00 and chart clamps not swept; 8-set count from a leading `N×` only (not superset rounds); whether the 11→9 week change is covered by A1/E3 not checked against the ruling text (coach's call).
