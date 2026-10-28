# Speed work: logging an NRC speed session, and what Progress reads from it

## D258: P-SPEEDLOG, a speed session logs its efforts and a pace for each zone it names (PROPOSED)

- **Date:** asked and proposed 2026-10-27. **Ruled by:** coach, proposed; awaiting Mario's concurrence. **Bump:** not
  asked yet. **Shipped:** not yet.
- **The ask (Mario, five screenshots of the run log forms):** "all the NRC runs have like sprints fartleks other type
  of runs much more dynamic than i think our NSW runs have, so how can we input them and use them as useful data on
  the progress page to help runners gauge progress".
- **The finding (measure, `tests/measure/run-logging_session-forms.js` on v0.249.1, six run goals by three levels,
  seed 1013):** every NSW run session (240 of 240) resolves a dose and gets its own form (time, distance, or reps with a
  typical rep time). On the NRC arm, long runs (144) and recovery runs (261) do too. Every NRC speed run (171 of 576
  NRC runs, 39 distinct sessions: 27 interval, 6 tempo, 4 fartlek, 2 hill) resolves no dose and falls to the generic
  form: whole session miles and whole session pace. That pace averages the warm up and the jog recoveries in with the
  efforts, so it says nothing about the speed work, and Progress plots it in the Interval band of RUNS BY INTENSITY
  CLASS as if it did. Shape of the 171: numbered pace zones per session 0 (24, the fartleks and hills), 1 (65),
  2 (25), 3 (57), never more; 5K Pace appears in 98, Mile 73, 10K 66, Tempo 40, Half 6, Marathon 3. Efforts per
  session run 1 to 20.
- **Doctrine (Nike's half plan, glossary and pace notes):** hills: "use effort as a guide rather than pace". Paces:
  "there will be days you may be a little ahead of pace, and other days a little behind", "only to be used as a
  guide". So hills take no pace, and nothing judges one session.
- **What changes (the run log card on a day whose run subtype starts "Speed Run"):**
  - The plan strip reads the session's work: `RUN — INTERVALS · PLANNED   9 efforts · 42:00 of work`.
  - **Efforts completed**, the NSW rep stepper, "of N". N is the headline's "N efforts" where Nike states it, else the
    work lines counted (a "k ×" line counts k, a "rounds of" block multiplies its lines, a "→ 0:15 at Best Pace" chase
    counts one); a continuous fartlek counts its hard surges (total ÷ (hard + easy), rounded up); a hill workout reads
    **Rounds completed** "of 5". A session of one effort (a single tempo block, or a progression Nike says to "run as
    one continuous progression") has no stepper. Untouched, it shows N and stores nothing, as the NSW stepper; on a
    logged session an untouched stepper reads as every effort done.
  - **A pace for each zone the session prints a number for**, in the order the session first names it: the label
    (`5K PACE`), one `pace` wheel **opened on the session's target** (Mario, 2026-10-27, on the mockups: "since we
    added a log button for the run portion if we left the wheel logs on the target wouldnt that work? and make it
    easier for the user"), and under it `Target 11:15/mi`, which gains the gap once the wheel moves (`Target 11:15/mi ·
    9s/mi faster`, the logger's own delta wording, "on target" inside 5 s/mi). Under the zones: "Shows the target.
    Move it to match the watch." Two wheels to a row. Best Pace (no number), Recovery Pace (not the work) and hill
    efforts (doctrine above) get none.
  - **How a target-faced wheel stores (the NSW fixed wheels' rule, D202 and `doseDerived`):** the target face is
    display only, so an untouched wheel stores '' and a moved one stores its pace. Nothing stores until the Log tap
    (D218). On a logged session a blank zone reads as **run on target, as planned**, the way a blank NSW fixed wheel
    reads as "assuming planned 20 min". So the on-target run is one tap, and Progress can still tell a pace the athlete
    set from one the plan assumed (D259). This departs from D202's "a blank free wheel shows the dash" for these
    wheels only: pace is the free dimension here, and the target face is the faster start.
  - **Whole run, miles**: one `dist` wheel, free, its zero face storing '' (D220), "Warm up, efforts and recoveries.
    Off the watch." It feeds weekly mileage as `run_dist` does today.
  - The Log button keeps D218: the card is live once any of its fields holds a value.
- **Stored (additive, on the same `ia_logs_` entry):** `run_efforts` (a count), `run_zones` (`{mile, fiveK, tenK,
  tempo, half, marathon}`, each `m:ss` per mile), `run_dist` (the whole run). This form writes no `run_pace` and no
  `run_mins`. The new fields join the swap chip's parked set (D213), so a swap to bike parks them and the swap back
  restores them.
- **What deliberately does not change:** the program (no engine change: the form reads the session's frozen detail,
  the `ia_hist_` copy on a trained day, through a parser, so `HALF_MANNY` holds); long and recovery run forms; every
  NSW form; bike, swim and the rest-day jog; "Did a different activity?"; entries logged before this ship, which keep
  their fields and are read as before. Nothing migrates.
- **Siting (the session's call):** the parser is new shared logic, so it lives in `core/` and both renderers (the page's
  `cardioFieldHTML` and the iOS app's `cardio-fields`) read it.
- **Expected values (typed from the session text):** "3 rounds of 10K → 5K → Mile — 42:00 of work": efforts 9 (3
  rounds of 3 lines), zones 10K 11:35, 5K 11:15, Mile 10:30 at a 10:30 mile. "8 × 1:00 at 5K Pace — 8:00 of work":
  efforts 8, one zone. "Mixed-pace ladder down to Best — 10:00 of work, 10 efforts": efforts 10 (stated), zones 5K,
  10K, Mile, no Best. "25:00 tempo": no stepper, one zone, Tempo. "21:00 fartlek — 1:00 hard, 2:00 easy": efforts 7,
  no wheel. "Hill workout — 5 rounds of 10K effort into Best effort": rounds 5, no wheel. "8K tempo, bookended by 2K
  easy": no stepper, Tempo. All 39 distinct sessions get a hand-typed row in the parser's unit test.
- **Tests (proposed):** `tests/unit/speed-work.test.ts` (the parser on all 39), `tests/integration/speed-work.test.ts`
  (the form on the page, what Log stores, the swap park), the iOS app's cardio-fields test.

## D259: P-SPEEDPROGRESS, Progress reads the speed work (PROPOSED)

- **Date:** proposed 2026-10-27, with D258. **Ruled by:** coach, proposed; awaiting Mario. **Bump:** not asked yet.
  **Shipped:** not yet.
- **The finding:** Progress has six run cards (LONG RUN LADDER, RUNS BY INTENSITY CLASS, SAME EFFORT MORE SPEED, the
  projection, DRIFT FROM PLAN, the easy zone). The speed sessions reach one of them, through the whole session pace
  D258 retires.
- **What changes (a SPEED WORK group on Progress, run programs only, shown once one speed session is logged):**
  - **Where and how it reads (the third scratch mockup, 2026-10-27).** Mario asked for "more visually appealing", a
    look at Runna and Strava, then sent Runna's run screens (best effort hexagons with PB tags, mile splits as bars
    with a +/- column, a filled pace chart). The group sits after the easy zone card under a large `Speed work`
    header with `8 of 14 sessions`, four cards, inside the design system (ink actions, no signal orange, 2 px card
    corners, Helvetica big numbers with tabular figures). They replace the first mockup's three cards with the same
    data:
    - **Your 5K efforts:** the main zone of the last three sessions with a pace set (ties go to the zone with more
      work, 5K over 10K in the mockup). One line in 24 px display type, "12s/mi faster than the plan." ("Right on
      the plan." inside 5 s/mi), the weeks and RPE under it. Then the zone's gap to target across the plan's weeks as a
      filled line chart (gradient fill in the zone colour, dashed target line, the latest point ringed), then two rows,
      `Latest 5K pace 11:03/mi` and `Target 11:15/mi`.
    - **What your speed work says:** four hexagon badges in the zone colours (the goal race, 13.1 in denim; 10K ochre;
      5K terracotta; 1MI brick), each with its time from the pace chart's row at the main zone's median pace, the
      plan's time under it, and a small sage tag `▲1:34` when faster than the plan. When the nudge fires, an ink button
      `Update my mile to 10:21` and the rebuild line; otherwise "From your logged paces on the pace chart. A guide, not a
      promise." **New against the first proposal:** race times show whenever three sessions carry a set pace, not only
      when the nudge fires. Coach's caution: short reps flatter a race time, hence the guide line.
    - **Pace by zone, splits style:** columns `Zone`, `Latest pace`, `+/−`. One bar per zone with a set pace, in the
      zone colour, longer when faster, the pace printed inside (`11:03/mi`), an ink tick at the target, and the gap on
      the right (`+0:12` sage when faster, `−0:05` brick when slower, `±0` inside 5 s/mi). Under the zone name `from
      11:12` (its first logged pace) or `1 logged`. Zone colours run by intensity: Mile brick, 5K terracotta, 10K
      ochre, Tempo plum, Half denim, Marathon sage.
    - **Sessions:** one tile for every speed session in the plan, its type letter (I, T, F, H), filled ink when
      finished, filled to the fraction done when cut short, dashed when still ahead. "7 finished in full. Week 6
      stopped at 16 of 20."
  - **Three creative directions (scratch mockups, 2026-10-27, awaiting Mario's pick).** Mario: "lets take some
    creative freedoms with it so it doesnt look exactly like runna ... maybe a little humor or some super fun facts
    about distance ... this app is for mostly people in the military and people who run already". Same data, design
    system fonts and palette only:
    - **Race day:** the projected race time printed as a race bib (pin holes, tear-off strip `▲ 1:34 ON THE PLAN`,
      "Pin it on"), the zones as a mono `OFFICIAL SPLITS` results slip with a barcode ("Keep this receipt. Your legs
      will."), and the speed miles by the numbers: laps of a 400 m track, football fields (100 yd, goal line to goal
      line), Golden Gate Bridges (1.7 mi).
    - **Ops report:** a `SITREP` (situation, assessment, action) under an `UNCLASSIFIED // FOR YOUR LEGS ONLY` bar with an
      `AHEAD OF SCHEDULE` stamp in brick; a **PT test translator** on dog tags (Navy 1.5 mi, Army 2 mi, USMC 3 mi, the
      goal race), the test times by Riegel's formula (exponent 1.06) off the chart's mile and 5K, which would be new
      to the app and need their own ruling; a mission log of every speed session ("Week 6 stopped at 16 of 20. It
      happens. Don't make it a habit.").
    - **Chase the rabbit:** the plan as the pacer: "207 m clear of your plan at 13.1", a top-down track with YOU ahead
      of PLAN at the finish; the zones as track lanes, metres up on the rabbit per mile; lap math (one lap at your 5K
      pace, laps and football fields so far).
  - **Three more directions (Mario: "give me three more options", 2026-10-27, awaiting his pick):**
    - **Front page:** `The Asylum Times` sports page (Georgia serif, a system font on iOS, for the masthead, headline
      and body): "Local Runner Beats Plan by 12 Seconds a Mile", a short story ("The plan declined to comment."), a mono
      box score of the zones, a race day forecast box, a classified ("WANTED: one mile time, updated."), and "Also in
      this issue" (laps, sessions finished, next week).
    - **Finish line:** a finish gantry with a checker banner and an amber LED race clock reading the projected time, "You
      cross 1:34 before the plan does."; a dark YOU vs PLAN scoreboard per zone ("FINAL YOU 4 · PLAN 0 · TIE 1. The plan
      has requested a rematch."); a flip-card lap counter (120 laps run at speed).
    - **Patches:** stitched patches earned from the log (First rep, No quit, Ahead of the plan, 30 mile club, Left turn
      only) and locked ones with what is left (Sub 11 5K pace, 3s/mi to go; Full send; Race ready), the latest patch as
      the lead card with the mile button, and the next patch with a progress bar. The thresholds are coach's to rule.
  - **PACE VS TARGET.** One dot per logged zone per session: x the program week, y the seconds per mile faster (up) or
    slower (down) than the target the session printed for that zone, a band of ±5 s/mi marked on target (the logger's
    own "on target" rule). One colour per zone. Under it a line per zone: "5K Pace · 6 sessions · 8 s/mi faster than
    target". A zone left on its target (stored '', D258) draws as a hollow dot on the zero line, "as planned", and is
    counted apart ("5K Pace · 6 sessions, 2 as planned"). The NSW arm joins: a Short Interval's rep pace and a Long
    Interval's pace against their printed targets.
  - **SESSIONS FINISHED.** One mark per speed session, filled when every effort was done, part filled when cut short:
    "Finished in full 7 of 9."
  - **YOUR PACES HAVE MOVED** (shown only when it fires). Ahead: the three most recent speed sessions that logged a
    zone pace each ran every logged zone at least 10 s/mi faster than its target, at session RPE 7 or under. Only a
    pace the athlete set counts: a zone left on its target is no evidence either way, so a session whose zones were
    all left on target is skipped when the last three are counted. The card
    names the mile those paces imply on Nike's chart (the median logged pace of the zone with the most work, read across
    its row to the mile) and offers "Update my mile", the existing mile sheet (its lock in the last three weeks holds).
    Behind: three sessions each at least 10 s/mi slower at RPE 8 or more: "The paces are ahead of you right now. Run
    by effort. If it holds, put in the mile you can run today," with the same button. It never changes the program by
    itself.
- **What deliberately does not change:** the six run cards (a speed session logged on D258's form carries no whole
  session pace, so it stops drawing a dot in RUNS BY INTENSITY CLASS; logs from before keep theirs); the projection
  card; the lift cards; the mile sheet.
- **Expected values (typed from the chart and the ruling):** mile 10:30, so 5K Pace 11:15/mi. A 5K zone logged at
  11:05 is a dot at +10. Three sessions at 11:05, 11:04 and 11:06, RPE 6, 7 and 6: the card fires and names a 10:21
  mile (the chart's row at a 5K pace of 11:05). Same paces with one session at RPE 8: no card.
- **Tests (proposed):** `tests/integration/speed-work.test.ts` (hand-built histories on the page), the iOS app's
  run-charts model test.
- **Coach's numbers Mario may move:** 10 s/mi and three sessions for the nudge; RPE 7 and under, 8 and over.
