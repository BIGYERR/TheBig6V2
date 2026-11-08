# Measure: what a logged run says about the mile anchor (Post-v0.256.0, 2026-11-07)

Script: `tests/measure/mile-anchor_logged-pace.js` (`node tests/measure/mile-anchor_logged-pace.js index.html`, 2 s).
Why: Mario's HALF_MANNY long runs came in at 11:03/mi against a prescribed 13:20 (COROS, heart rate 167, classed tempo)
because his 10:30 mile anchor is stale, and the app said nothing. He asked for a measure, then a mockup of a nudge, before
any ruling. No ruling here.

## 1. How much faster is "a row"

The pace chart's rows are 30 seconds of mile apart; its recovery column steps 25 to 35 s/mi per row. On a recovery-pace
card, a run logged **about 35 s/mi faster than prescribed reads as one whole row faster** on every row from 6:00 to
12:00; 15 s/mi faster is under half a row (noise, a warm day, a downhill route); 60 s/mi is 1.7 rows; Mario's 2:17/mi is
3.9 rows. The table in the script output has every row.

## 2. Mario's runs, by column

**Correction (same day, after Mario pasted his Program selections):** his live program's anchor is an **8:00 mile, edited in
week 5**, not the fixture's 10:30. Prescribed recovery 10:30/mi, tempo 9:25, 10K 9:00. Read against that, his long runs
(11:01, 11:03) were 31 to 33 s/mi SLOWER than prescribed and his tempo (10:23) 58 s/mi slower, all at tempo heart rates.
The implied anchors below stand (the chart arithmetic is the same); the direction flips: his anchor is about two rows too
fast, and a nudge built only for runs coming in faster than the plan would never have spoken to him. The rule has to be
symmetric: two easy runs in a row more than a row off the prescribed pace in either direction offer the pencil with the
implied number. The table keeps the 10:30 column headings because they are what the fixture prescribes; his own rows
faster figures are therefore overstated by two rows.

| Run (COROS, typed by hand) | Pace | Read as | Implied mile | Rows faster than 10:30 |
|---|---|---|---|---|
| Mon 26 Oct tempo, 36:24 | 10:23/mi | tempo | 8:54 | 3.2 |
| Sat 31 Oct long, 1:00:10, HR 165 | 11:01/mi | recovery | 8:31 | 4.0 |
| Wed 4 Nov run, 20:14, HR 168 | 10:04/mi | tempo | 8:38 | 3.7 |
| Sat 7 Nov long, 1:00:59, HR 167 max 184 | 11:03/mi | recovery | 8:33 | 3.9 |

The two columns disagree by 0.7 rows, and the disagreement is the finding: the long runs were run at 88 to 92% of max
heart rate, tempo effort, so reading them as recovery runs overstates him by a row. **A logged pace alone cannot tell a
fitter athlete from one running too hard.** The tempo column is the honest read: about 8:54. A 9:00 anchor (row 540)
prescribes recovery 11:35/mi, tempo 10:30/mi, 10K pace 10:00/mi: paces he would take seriously.

## 3. What the rule would have to work with

- **Fields.** A logged run stores `run_dist`, `run_mins` (and `run_pace` on some forms) in `ia_logs_` under `w<week>_<day>`;
  the prescription it ran against is the frozen `ia_hist_` snapshot's `cardio.dose` (`k` time or dist, `tgt` sec/mi). The
  derived readout already prints "Your pace … 2:17/mi faster than target" (V191 D40, `doseDerived` in
  `log-entries.ts`). Nothing reads that delta after the sheet closes.
- **Which cards.** Only recovery and long cards carry a pace the whole run is meant to hold; a speed card's logged pace
  averages work and recovery and cannot be compared. A race program hands the rule three such cards a week (two
  recovery, one long): 5K and 10K plans 24 over 8 weeks, the half 42 over 14, the marathon 54 over 18.
- **The lock.** The pencil locks in the last three weeks (D189: `totalWeeks − week < 3`), so a nudge can only act in weeks
  1 to 11 of the half (33 of its 42 paced cards), 1 to 5 of the 5K and 10K plans, 1 to 15 of the marathon. Mario is in
  week 11: **this is the last week his anchor can change.** In the locked weeks the nudge has nothing to offer and must
  not show.
- **Two in a row.** With three readable cards a week, "two consecutive recovery or long cards each a row or more
  faster" can fire inside one week; a single fast run never fires.
- **False positives.** A deliberate fast finish, a short recovery run run hard, a downhill route: each can read a row
  faster once. Two in a row at a row or more is the floor; the implied anchor should be stated from the slower of the
  two runs, rounded to the slower 30-second row, and offered, never written. A run logged on a swapped sport
  (`swapTo`) or without both fields is skipped, as the benchmark reader already does.

## What this measure does not do

It does not rule. The design question for Mario is where the nudge lives and what it says (the mockup); the ruling
after his pick is the next D-code, in `docs/decisions/mile-anchor.md`, shipped as its own release.
