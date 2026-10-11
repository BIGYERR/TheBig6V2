# Queue item P-LSDPACE: measure m2 (log form and readers), V238 as shipped (2fbc98c). CODE READS ONLY.

No script ran: the worktree's Bash guard refused every heredoc containing JS with `?` ternaries or glob characters inside braces.
There are no lattice numbers and no VM drive. Every line below is a code read at V238 line numbers plus the gates. Nothing was printed.
The counts are left to the build chat's measure (driver recipe at the end).

## Q1 Pace-family LSD log form (dose.k 'dist', lsd_long and lsd_easy; cardioFieldHTML :13894-13899)
- Strip (_doseStripHTML :13582, tgt appended :13589): "Run — LSD · Planned X mi @ m:ss/mi".
- Wheel 1, miles (dist, log_run_dist): its face shows the plan miles (data-plan=dose.mi) while its hidden input holds ''.
  Sub-line: "Shows the plan. Move it to match the watch."
- Wheel 2, time (hms, log_run_mins): no plan, parks at 0:00:00. Sub-line: "Off the watch."
- NO pace input. Pace is derived as time ÷ miles. A pace wheel exists only on the generic form (:13914-13917).
- Readout (updateDoseDerived :13593): "Pace — derived m:ss/mi", plus "assuming planned X mi" when miles are untouched,
  plus "Ns/mi faster/slower than target" or "on target" against dose.tgt (:13606). With no minutes it shows "enter minutes".
- Store (persistLogFields :14858): rpe (only if touched), run_dist, run_pace, run_mins, run_reps, run_rep_time,
  bike_mins, swim_yards ('' while DRAFT), notes, swapFrom, swapTo, week, ts; also sets, parked, restLog.
- On a Log or Done commit, doseDerived (:14905-14908) fills a missing run_pace with the derived pace and, if the miles were
  untouched, writes run_dist = String(dose.mi). **Untouched plan miles are saved as if the athlete entered them**, and
  the stored pace is computed from those plan miles. g237's D221 rows pin this as the "V148 stamp".
- logCardio :14920 refuses an all-blank form ("Nothing to log yet."). Miles alone with no time stores no pace.

## Q2 Scope
- run_base easy: time dose. Plan minutes seed the time wheel; the miles wheel starts at 0.00; the derived pace assumes
  the planned minutes. The strip shows "@ tgt" and the delta prints. run_mins is not stamped; the derived pace is stored.
- NRC long runs: dist doses with tgt and cap, the same form as NSW. NRC recovery, time or dist: UNKNOWN.

## Q3 Readers of a stored NSW LSD log (field read; whether NSW LSD reaches it)
- Week MILES tile :12277: run_dist, yes. Progress weekly mileage :17691: run_dist, yes; the session count :17710 also counts it.
- ladderWeekly :16755/:16766: run_dist, yes. plannedVsLogged (≈:16826): snapshot dose.mi against run_dist, yes.
- seedFromPriorPrograms :16496: maxDist from run_dist, yes (:16507). Its paces go through _recoveryPaceEntry :16532,
  which needs a /recovery/ subtype: no.
- recoveryPaceWeekly :16547: no. easyVsPrescribed :17248: no (only Recovery/Easy; _runClass :16731 returns "Long" for LSD).
  easyEffortWeekly: no.
- runsByClass: run_pace, yes, under class Long. It is the fallback chart, drawn only when the zone chart is empty.
- Journal :17830: no (prints notes, rpe, swap, restLog). _hasLog nudge :14275: yes.
- So every pace that reaches a chart from an LSD log is a derived pace.

## Q4 Readers of dose.tgt
- _longRunTier :11126: NSW long minutes = mi × tgt / 60. Removing tgt gives m=0 and no tier, and d18LongRunDayPass :11171
  skips the day: no carry ban and no tier A/B lift cuts (m1: tiers on 4,240 NSW long runs). Keeping tgt unprinted changes nothing.
- sessionTimeEst :11796: reads the pace out of detail, NOT dose. An unprinted pace falls to miles × 10 min (:11827)
  whether tgt stays or goes.
- doseFromCardio :13530: returns the emitted dose. tgt matters only on the prose-parse fallback for old snapshots.
- doseDerived :13554 → updateDoseDerived: if tgt stays, the faster/slower line still prints unless the readout changes.
  If tgt goes, the line disappears. persistLogFields never stores tgt.
- d189DefaultAnchorNote :11155: keys on `\d:\d\d/mi` in the detail, not on dose.tgt. It appends to the first paced W1 run:
  "Paces here start from a M:SS mile, the <exp> default. Tap the pencil on your program card to enter your mile
  time. Every run ahead of you rebuilds off it." Whether that run is an LSD: UNKNOWN. With the pace gone from the
  LSD detail, the note moves to the next paced W1 run.

## Q5 Overlap with V239 (rest sheet, P-RESTWHEEL; m3)
- Rest-sheet functions (openRestSheet :1382, _renderRestCardio :1432, applyRestCardio :1470) are not shared with the session form.
- Shared: persistLogFields :14858 (carries restLog), getLogs :1268, saveLogs :1277, restNorm :1241, and the readers
  week MILES :12277, Progress sums :17691-17701, ladderWeekly :16766, seedFromPriorPrograms :16511 and the journal.
- Mario's V239 rule ("a prefill is a placeholder, never a stored value") describes the same pattern as the
  dist-form plan-miles stamp at :14908.

## Q6 PRT TING
- The live config is not in the repo. Handoff :184 says PRT TING was deleted in V206; the new program's config is not recorded.
- Typed variants: v202_run_path_B.js pinned() (run_pace_goal 1.5 mi 11:00, mile 8:15, event 2026-10-19, seed 24865);
  g209 STAND :93 (same, goal path); g202 :56 (10:30 target, no event); g223 K27 :394 (test 2027-03-25).
- What their LSD cards and log forms show: UNKNOWN, none were built.

## UNKNOWN, and the run that settles it
Every count. Build a VM driver on g237's mkEnv (tests/gates/g237_d220_distzero.js:172-284). Open lsd_long and lsd_easy on the
three pace goals and on PRT STAND, roll time only, Log, and print what is stored. Then take the lattice counts for tgt, strip, tier and d189.
In this worktree, write block-bodied JS with no `?` ternaries inside braces in the heredoc.
