# Queue item P-LSDPACE: coach re-check r3 (the main session in the coach hat, 2026-10-16), on measure m3

Status: RE-RULED on m3 (`tests/measure/lsd-pace_recheck.md`), v0.240.0. Amends r2. One call back to Mario: the reach of
P-LSDPACE-3, because m3 found three things the 2026-10-16 question did not show him. No D-code yet; the build session
assigns them when it is slotted. Feature: `docs/decisions/lsd-pace.md`.

---

**Stands as r2 ruled, with m3's numbers.**
- **P-LSDPACE-1, the card.** The premise holds on v0.240.0: 16,492/16,492 NSW LSD cards print the clock pace, "(Zone 2)"
  and "60–70% max HR". The copy is r2's, unchanged.
- **P-LSDPACE-2, the form.** Miles + time, the pace derived from the athlete's two numbers (Mario, A). Unchanged.
- **P-LSDPACE-4, the hidden pace.** Wider than r2 wrote: every pace-family goal walks, not only the pace goal (faster than
  the own row on 6,916/16,492; 1,512/3,696 on the mile goal and on the 1.5 mi under 10 goal), so the own-row read applies
  to every NSW pace-family LSD dose. 120/9,424 long runs change tier (40 B to A, 80 B to C), r2's example among them.
  The hero estimate must read the dose: left to today's prose parse, 13,469/16,492 LSD days drop by up to 25 minutes;
  read off the dose, 1,980 move by 5 minutes.
- **P-LSDPACE-5, base easy runs keep their ceiling** (Mario). Unchanged.
- **The D189 note.** The case r2 guarded does not occur on the lattice (0 of 240 default-anchor builds put the note on an
  LSD). The guard row stays because it is cheap: the note sits on a W1 run whose detail prints a pace, or nowhere.

**Re-ruled: P-LSDPACE-3, the stamp.**

"The stamp is the V148 contract doing its job, not a stray prefill. The prescription owns the fixed dimension, and the
plan face over an empty value (D202) means 'as planned' in every reader. m3 shows the one writer derives on both forms,
so taking it out everywhere reaches every run the athlete logs, Mario's own HALF MANNY included: a long run logged by
time alone counts 0 miles, and a recovery run logged by miles alone stops storing a pace, so it drops off the recovery
pace chart and out of the next program's seed. It also leaves the fixed wheel showing a number nothing stores, which is
the thing D202 was written to forbid; a run done exactly as prescribed could then store its prescribed value only by a
roll away and back.

"Mario's ask on 2026-10-09 was about the LSD: 'an entry that is miles and pace that the user enters but not recommended
by the app.' The LSD is the one run where the doctrine itself loosens the fixed dimension (NSW p11: 'focus more on
duration than intensity'). So the line belongs on the dose, not on the goal: a dose that prints no pace (`noPace`, the
NSW LSD) carries no plan into the log. Its miles wheel opens on its zero face like the time wheel, the plan lives on the
strip ('Planned 3 mi'), nothing the athlete did not roll stores, and the pace derives from his two numbers. Every other
dose keeps V148 and D202 as they are. That keys on what the prescription says, so it is not a goal latch."

**Before** (v0.240.0, pace 1.5 mi 12:00, intermediate, mile 9:00, seed 76308; m3): W1 SAT strip `Run — LSD · Planned 3 mi
@ 11:17/mi`, miles wheel on the plan face; time only 0:36:00 stores `run_dist` "3", `run_mins` "36.00", `run_pace`
"12:00/mi", MILES tile 3. HALF_MANNY W1 SAT (NRC long run, 3.1 mi): time only stores "3.1" and its pace; W1 FRI (NRC
recovery, 25 min): miles only 3.00 stores `run_pace` "8:20/mi", drawn on the recovery pace chart.

**After, as recommended:** the NSW LSD: strip `Run — LSD · Planned 3 mi`, miles wheel on 0.00, time on 0:00:00; time only
0:36:00 stores `run_mins` "36.00" and no `run_dist`, no `run_pace`, readout `Pace — derived · enter miles`, MILES tile 0
until the miles are rolled; 3.10 with 0:36:00 stores "3.10", "36.00", "11:37/mi". HALF_MANNY and every non-LSD run:
unchanged (the stamp tests in `tests/integration/logging.test.ts` stand).

**Tests:** the r2 card copy on the example's W1 SAT and FRI; no NSW LSD card prints a pace, "(Zone 2)" beside a pace, or
"max HR" (0 of 16,492); the LSD strip prints no pace and its readout no "than target"; the LSD miles wheel opens on 0.00
and a time-only LSD log stores no miles and no pace; HALF_MANNY's W1 SAT time-only log still stores "3.1" and "15:14/mi";
the example's W10 SAT 6.6 mi moves tier B to A (own row 11:35); HALF_MANNY's digest stays `2d35e8f743680cfa`; the two
NSW test-goal snapshots move only by the ruled copy and tiers.

**Recommendation:** the stamp goes on doses that print no pace (the NSW LSD) and stays everywhere else.
**Counter:** Mario's rule is general and he chose every card with the 0-miles cost in view; if he holds to it, every fixed
wheel must open on zero with the plan only on the strip (D202 replaced app-wide), the doctrine line in CLAUDE.md is
reworded ("the third derives from what the athlete entered; an untouched fixed dimension stores nothing"), and the eight
stamp tests in `logging.test.ts` are rewritten.
