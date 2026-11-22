# GPS recording: the iOS app records a run, checked against the watch

## D267: P-GPSTEST, the iOS app records a test run by GPS, and a script checks it against the watch (v0.255.0)

- **Date:** ruled 2026-10-31. **Ruled by:** the main session in the coach hat; Mario concurred 2026-10-31 ("Concur"),
  with the plugin in its own folder and CLAUDE.md's Native line reworded to match ("Approve the wording").
  **Bump:** MINOR, v0.255.0 (Mario). **Shipped:** v0.255.0.
- **The ask (Mario):** "integrate some GPS tracking so we are rocking nice like strava" (2026-10-27); "i use a coros
  pace 4 to track my runs and want to record the run on my phone to compare while we do testing, unless we can build it
  super accurate first time up ... one day id like to be able to sync with coros and other watchs" (2026-10-28);
  "Start stage 1" (2026-10-31).
- **The measure** (`tests/measure/gps-recording_seams.md`, read 2026-10-31 on v0.254.0):
  - The app has no location code (0 files mention `geolocation`, `CLLocation` or `watchPosition`).
  - The iOS app's Bugs tab is the Angular `ia-bug-report` component; the page on Pages draws its own. A row on the
    component reaches the iOS app only, and `index.html` does not change.
  - `ia-island` already opens the share sheet for a file the page makes (D264).
  - Background location is two Info.plist keys, no capability on the signing profile, so TestFlight's secrets stay as
    they are. A run Live Activity would change the RestTimerWidget extension.
  - One raw fix is 127 bytes as a JSON line, 457,200 bytes an hour at one fix a second. Every log lives in
    localStorage today.
  - The repo is public. A track shows where a run starts and ends.
  - The watch's laps carry each effort's distance and pace (Monday's tempo: six reps 8:31 to 8:46 per mile, the tempo
    9:25 per mile). The Pace 4's FIT record rate is not read yet.
- **The coaching argument.** The log captures the free dimension and the pace derives from it. A recorder that is 3%
  long writes a pace 3% too fast into every chart that reads the log, the next program's seed included. So stage 1
  records beside the log, never into it. It earns its way onto the run card by matching a known distance, and the
  watch is the second opinion, not the truth: a 400 m track is the truth. And no number is guessed: a filter the
  recorder needs is set from measured runs, so stage 1 ships with none beyond what iOS itself flags.

- **What changes (the iOS app only):**
  1. **The recorder** (a new plugin, `plugins-src/ia-gps`, Swift). Start asks for location while the app is in use,
     then records every fix iOS delivers: best accuracy, no distance filter, activity type fitness, never paused by
     iOS. It keeps recording with the screen locked or the app in the background, under the blue location pill. Each
     fix is written to a file the moment it arrives (Application Support), so a crash or iOS closing the app keeps the
     run up to that second. Pause and Resume are marks in the same file. Finish closes it.
  2. **Record raw, judge later.** The file keeps what iOS reports, unfiltered: time, latitude, longitude, altitude,
     horizontal and vertical accuracy, speed and its accuracy, course and its accuracy. Every judgement runs in
     TypeScript in `core/src/gps/` over the raw file, so a filter retuned later reruns on every run already recorded.
  3. **The math** (`core/src/gps/`). Distance by haversine on the IUGG mean Earth radius, 6,371,008.8 m. A fix iOS marks
     invalid (negative horizontal accuracy) is dropped. Time between Pause and Resume counts toward elapsed time, not
     moving time, and the gap a pause spans adds no distance. A mile split falls at 1,609.344 m, its time interpolated
     between the two fixes either side. Nothing else in stage 1: no accuracy cut, no speed ceiling, no smoothing.
  4. **The test screen, Run recorder** (a row on the Bugs tab, iOS only). It shows the GPS state with the accuracy iOS
     reports, then time, distance in miles to two places, average pace, the pace of the mile in progress, and the
     splits so far. Buttons: Start, Pause, Resume, Finish. After Finish: the summary, the splits, Share (a GPX file
     through the share sheet) and Delete. Past test runs list newest first. No current pace: a current pace needs a
     smoothing window, and the comparison sets that window.
  5. **The comparison** (`tests/measure/gps-recording_watch-compare.js`, run on the Mac). It reads the phone's GPX and
     the watch's FIT file of the same run and prints each one's distance and the difference, the mile splits side by
     side, and how far apart the tracks sit (median and worst, each phone fix against the watch's position at the same
     second). The reference run: four laps of a 400 m track in lane 1, 1,600 m, where both devices are judged against
     the known distance.
  6. **A FIT reader** (`core/src/gps/fit.ts`) for the comparison: the file header, definition and data messages, and
     the record messages' time, position (semicircles), distance and speed. The app reuses it when it reads watch runs.

- **Copy (the athlete reads it).** Bugs tab row: **Run recorder**, note "Test GPS against your watch. Runs stay on this
  phone." Screen: "Waiting for GPS." until the first fix, then "GPS ±8 m" with iOS's accuracy. Buttons Start, Pause,
  Resume, Finish, Share, Delete; the delete asks "Delete this run? It cannot come back." The location prompt: "The
  Asylum records your route while you run. It stays on this phone."
- **What deliberately does not change:** the run card, the log (`ia_logs_` and every other localStorage key),
  Progress and the program. A test run is not a logged run; typed entry stays the record. HALF_MANNY and the lattice do
  not move. `index.html` changes only in its version meta. The rest timer's Live Activity and its widget extension
  stay as they are: no run Live Activity in stage 1. No COROS sign in, no Apple Health, no audio cues. **No track ever
  enters the repo:** phone exports and watch files live in the scratchpad or the gitignored `temp/`, and the comparison
  prints distances and times, never a coordinate.
- **Blast radius:** the iOS app only: one row on the Bugs tab, one new screen, one new plugin and its two Info.plist
  keys. Every goal, focus and calendar prescribes what it did.
- **Tests (each fails on v0.254.0, where none of this exists):**
  - `tests/unit/gps-recording.test.ts` (`@ia/core`): two fixes one degree of latitude apart on a meridian are
    111,195.08 m apart (6,371,008.8 × π ÷ 180); a fix with negative horizontal accuracy adds no distance; time between
    Pause and Resume counts in elapsed time and not moving time, and the pause's gap adds no distance; on a straight
    meridian track at a constant speed the first mile split lands at 1,609.344 m ÷ that speed; the GPX holds one
    `trkpt` per valid fix with its time and a new `trkseg` after each pause.
  - `tests/unit/fit-file.test.ts` (`@ia/core`): a FIT file built byte by byte from the FIT protocol (header, one
    definition for the record message, two records) reads back as the typed time, position, distance and speed; a
    file whose CRC is wrong is refused.
  - `frontends/app/test/unit/run-recorder.test.ts`: the Bugs tab shows the Run recorder row only when the plugin is
    present; the screen walks waiting, recording, paused and finished with the buttons each state shows; distance
    prints in miles to two places and pace as m:ss per mile.
  - The native compile is CI's `native (iOS simulator)` job. On the simulator a route played by `xcrun simctl
    location` records and prints its splits (seen, reported, not a test).
- **Recommendation.** Ship it as stage 1, by itself: it is the instrument the later stages are tuned with. The
  strongest case against: a test screen is plumbing on a tab the athlete sees. It is one row, iOS only, and the app has
  one athlete; it moves onto the run card in stage 2.
- **Later, not ruled (no D-codes):** stage 2 the run card (Start on the card fills miles and time; a run Live Activity;
  a chime at the prescribed time or distance; a warning past "Do not run faster than"); stage 3 the map and splits on
  the day and Progress; stage 4 speed sessions effort by effort, after D258; stage 5 COROS: watch runs into the card,
  the day's run onto the watch; Apple Health for other watches.
- **Built (v0.255.0), the form the ruling left open:** the Bugs tab row reads **Run recorder**, its note, and one
  **Open** button. The screen opens over the tab bar with **‹ Back**; Back from a finished run returns to the start, and
  Back from the start or from a live run closes the screen (a live run keeps recording). The screen turns location on
  when it opens, so the GPS line reads iOS's accuracy before Start, and off again when it closes unless a run is
  recording. Its numbers read **Miles**, **Avg pace** and **This mile** (the pace of the mile in progress), and the
  splits list under **Splits**; past runs list under **Past runs** in the phone's own short date and time, "Nov 1 at 12:26 AM · 0.25 mi · 1:42" on iOS 26. Fixes iOS
  delivers during a pause are written raw like every other and count for nothing, so the GPX leaves them out. A run iOS
  ended without a finish mark reads as finished at its last line. The plugin skips iOS's "location unknown" error,
  which is iOS still looking. Shared files are named `asylum-run-<local date>-<hhmm>.gpx`.
- **Proved (v0.255.0):** the FIT reader read the Pace 4's file of one tempo run (93,169 bytes, 2,185 records, one a second
  but for one 20 s gap) and matched COROS's own summary: session 5,640.39 m, timer 36:24, 15 laps, the first 1,028.58 m
  in 420 s. The comparison, fed the watch's own track as the phone, read the tracks 0.0 m apart and the splits within
  1.3 s. On the simulator (iPhone 17 Pro, iOS 26.5, the debug build), a straight route played north at 4 m/s recorded
  through a screen lock: 84 fixes one a second, 4 m each, 4.006 m/s; the screen read the file back on unlock, finished at 1:42 and 0.25 mi, and shared `asylum-run-2026-11-01-0026.gpx` (101 points). Early in a run the average pace reads slow (85 s in, 6:51 against 6:42 played): the second before the first fix and the second since the last one count with no distance yet. The first runs against the watch decide whether that needs a ruling.

## D272 P-RECORDRUN: This Week records the run, and the deck holds no run cards (ruled 2026-11-08, Mario's answers at the end)

- **Date:** 2026-11-05. **Ruled by:** the main session in the coach hat, on Mario's picks the same day: hero draft A
  ("i like A lets try that one out"), the recording screen as R2 with R3's splits underneath ("i concur"), and "we dont
  need any cardio cards if we are going with A since the cardio and lift blocks are seperate and we are placing the
  record button on it". Awaiting Mario on the calls at the end. **Bump:** Mario picks at the build (MINOR recommended:
  a new capability, no program output moves). **Shipped:** items 1, 2, 6 and 7 as Amendments 1 and 2 left them in v0.258.0 (2026-11-08, with D276: the run card and the lift card, Record run opening D267's recorder); items 3 to 5 (R2 over R3, Save, the gate) build next. This is D267's stage 2.
- **The designs:** the canvas "This Week hero drafts" (https://claude.ai/artifact/1km7jKQuQTDrdVQ71roHaH), board A
  (clickable, the recorder inside it) and boards R2 and R3; week 10 Friday of HALF_MANNY.
- **The measure (2026-11-05, on v0.255.2):**
  - D267 is on `main` since v0.255.0. No phone run against the watch is saved yet: `tests/measure/` holds the
    comparison script and no report, so the track test D267 names has not been recorded.
  - A run's log entry is the three fields the hand log writes: `run_mins`, `run_dist` and `run_pace`
    (`log-entries.ts`: `doseFromCardio` reads the dose and its target, `doseDerived` derives the pace; the prescription
    owns the fixed dimension, the log captures the free one).
  - HALF_MANNY's 56 runs: 28 Recovery Runs name a target pace and a mile ceiling ("Do not run faster than"), 26 dosed by
    time and 2 by distance; 13 of the 14 Long Runs name an average ceiling ("Average no faster than") and run as a
    progression; 14 Speed Runs (10 intervals, 3 tempo, 1 fartlek) name
    several zones, no one ceiling and no dose; Race Day has a target and no ceiling. Every Recovery Run and Long Run
    carries its target and ceiling in the dose the engine emits (`dose.tgt` 800 s and `dose.cap` 760 s on HALF_MANNY).
  - The agreed deck (P-DECK, `docs/decisions/swipe-deck.md`) carries three things on its run card: run first (call 9),
    the hand log (call 11) and Can't run? (call 12, which ruled D249). The cool down after the run (call 14) is its own
    card.
- **The coaching argument.** The run is a different job from the lift: outside, on a clock, the phone in a pocket. One
  block that owns the run and the button that records it keeps the run whole; a run card inside a lift deck splits the
  run from its record. D267's argument still holds: a recorder that reads long writes a pace too fast into every chart
  that reads the log, the next program's seed included. So a recorded run reaches the log only after the recorder has
  matched a known distance.
- **What changes:**
  1. **This Week's hero splits the day (draft A).** A training day with a run shows a run block and a lift block in one
     card, in the day's order (`_liftFirst`: on a race plan the run first, "Run first" and "Then lift"). The run block
     prints the run's name, its dose and target as chips, the ceiling line from the session text, and **Record run**.
     The lift block prints the lift's name, its first movement and the count, and **Start lift**, which opens the deck
     (P-DECK answer 3). One button glows (D263): Record run until the run is saved, then Start lift. A saved run shows
     a check with its miles, time and pace; the day closes when both are done. A lift only day shows the lift block
     alone, a run only day the run block alone. A rest day keeps its hero (D224).
  2. **Two quiet links sit under Record run:** Log by hand, which opens the run's log as call 11 has it (the plan strip,
     the Time and Miles wheels, the pace against the target, Did a different activity?, Log), and Can't run?, which
     opens call 12's sheet (move it to a later day marked good, careful or bad, or skip it; D249 as ruled).
  3. **The recording screen is R2 over R3.** Full screen from Record run: the state and the GPS accuracy at the top
     (D267's words); a ring around the time that fills toward the dose (time for a time dose, miles for a distance
     dose) with the dose under it; Miles and Avg pace; the pace guard; the splits table, one row a mile, the mile in
     progress live; Pause, Resume and Finish. **The pace guard reads only what the session names:** a mile ceiling and
     a target (the 28 Recovery Runs) put the pace of the mile in progress against both; an average ceiling (the 13 Long
     Runs) puts the average against it and the target; Race Day shows its target only; a Speed Run, which has no dose, shows
     no guard. The guard reads `dose.cap` and `dose.tgt`, never the session text. The splits table's
     "vs" column shows only when the session names a target. Minimize keeps recording, puts a live bar on This Week, and
     Record run reads "Back to your run" with the time.
  4. **Finish shows the summary:** time, miles, average pace, the splits, an Effort slider 1 to 10 (untouched stores
     nothing, D219), Save to the day, Share (the GPX, D267) and Delete (D267's confirm). **Save writes the run's log
     entry through the writer the hand log uses:** `run_mins` the moving time in minutes to two places, `run_dist` the
     miles to two places, `run_pace` derived as the hand log derives it. A recorded entry is edited like a typed one.
     The track stays a file on the phone (D267); the entry keeps the run's file id, so a later stage can draw its splits
     and its map.
  5. **The gate.** Save to the day appears once the recorder has passed the track test D267 set: four laps of a 400 m
     track in lane 1, the phone within 2% of 1,600 m (32 m), and one road run whose phone distance is within 2% of the
     watch's. Until then the summary offers Share and Delete and says the run is kept for the comparison, and Log by
     hand stays the log. The result is written to `tests/measure/gps-recording_track-test.md`.
  6. **Where Record shows:** the iOS app only, when the `ia-gps` plugin is present (D267's rule for its row); the page on
     Pages keeps Log by hand. Runs only: a ride, a swim or a row block shows Log by hand and no Record.
  7. **The deck holds no cardio cards (amends P-DECK).** Calls 9, 11 and 12 move from the deck's run card to the hero's
     run block, as items 1 and 2 say. Call 14's cool down stays a deck card, so a run day whose only lift work is the
     cool down opens a deck of that one card. The day sheet (P-DECK answer 3) keeps the run's log for review and edits.
- **Does not change:** what any program prescribes (HALF_MANNY and the lattice do not move); the log's fields and their
  format (a recorded run is an entry the hand log could have written); D267's recorder math, and the Run recorder row on
  the Bugs tab, which stays the test bench until the gate passes; the rest day hero and its jog log (D223, D224); the
  deck's lift cards, rounds, rest day card and journal.
- **Not in this stage (later, no D-codes):** a run Live Activity on the lock screen; a chime at the dose and a warning
  past the ceiling; the map (stage 3); effort by effort on speed sessions (stage 4, after D258).
- **Tests (each fails on v0.255.2, where none of this exists):**
  - `tests/unit/gps-recording.test.ts` (`@ia/core`): the guard's kind from hand typed doses: `{k:'time', mins:45, tgt:800, cap:760}` gives the
    mile guard at 760 and 800, `{k:'dist', mi:8, tgt:800, cap:760}` on a Long Run the average guard, no dose none; the log fields for 2,700 s moving over 3.379 mi are `run_mins` 45.00 and `run_dist` 3.38, with the pace the
    hand log derives for them.
  - `tests/integration/this-week-hero.test.ts`: on HALF_MANNY week 10 Friday the hero prints a run block with Record run
    before a lift block with Start lift; Thursday prints no Record; a saved run moves the glow to Start lift; with no
    plugin there is no Record and Log by hand remains.
  - `frontends/app/test/unit/run-recorder.test.ts`: the guard shows for a mile ceiling, the average for an average
    ceiling and nothing for a Speed Run; Save stays hidden until the gate passes; an untouched Effort stores nothing.
  - The deck's own tests when it is built: a run and lift day's deck holds no cardio card.
- **Order:** builds after the deck (P-DECK), or in one release with it, since item 7 changes the deck. The gate's test
  run can happen any time before; stage 1 is already on the phone.
- **Calls for Mario:** (1) the gate in item 5, at 2%; (2) Speed Runs record whole run totals with no guard until stage
  4; (3) rides, swims and rows keep Log by hand with no Record.
- **Correction (2026-11-05, before Mario's answer):** the measure first said the Long Runs carry no target, read off
  `doseFromCardio`'s parse of the session text. The doses the engine emits carry `tgt` and `cap` on all 28 Recovery
  Runs and 13 of the 14 Long Runs, and Race Day carries `tgt` alone, so the guard reads the dose, and the test of a
  text reader became a test of the guard's kind. Found while building the full week prototype.

## D272 Amendment 1: two cards on This Week, and no Log by hand under Record (Mario, 2026-11-06)

- **Date:** 2026-11-06. **Ruled by:** Mario, on the canvas board "Your design, wired" (his This Week redesign from another
  chat, `week-screen-mockup.dc.html` with `WEEK_SCREEN_REDESIGN.md`, wired to D272): "we are splitting the cardio from
  the run on the hero page lets make sure we do that, and take out the "log by hand" under the record"; and earlier the
  same day, of the rest day's two actions, "Keep them as links". No new D-code. **Shipped:** v0.258.0 (2026-11-08), but Can't run? (D249), which builds next.
- **What changes in D272:**
  1. **Item 1: the run and the lift are two cards**, not two blocks in one card. The run card comes first: the day,
     the run's name, its dose and pace, the coaching line, Record run. The lift card follows: "Then lift" (or "After the
     run" for the cool down), the lift's name, its first movement and the count, and Start lift, an outline button until
     the run is saved and the accent button after it (one glow, D263). A lift only day and a run only day show one card.
     A card that is done shows a done row with its own Reopen, so the run and the lift reopen apart.
  2. **Item 2: Log by hand comes off the hero.** Can't run? stays, alone, under Record run. The hand log keeps its home
     on the day sheet (P-DECK answer 3), for review and edits; item 5's "Log by hand stays the log" until the gate passes
     now means that log.
  3. **Rest days keep Training anyway? and Log cardio** as two small links under the rest card, where the redesign's
     spec had no button.
  4. A ride, a swim or a row has no Record (call 3 of D272), so its card's button opens the hand log for that sport.
- **Open:** where a run done without the phone (a treadmill, the watch alone) is logged from This Week now that Log by
  hand is off the run card. The main session recommends a quiet "Ran without the phone?" link on the recorder before
  Start, which opens the same hand log.

## D272 Amendment 2: Record run opens out of the run card, Lift first at 420 ms (Mario, 2026-11-08)

- **Date:** 2026-11-08. **Ruled by:** Mario, on the canvas's THE MOCKUP (Version 54, four styles at four speeds, with
  Record run growing out of its card beside Start lift): "i like the lift first at 420 ms". No new D-code.
  **Shipped:** v0.258.0 (2026-11-08), but the live bar, which comes with R2 over R3.
- **What changes in D272:** the recorder no longer appears at once. Record run opens it out of the run card with the
  same motion as the deck, P-DECK call 16 (`docs/decisions/swipe-deck.md`), whose numbers are the ones to build: drawn
  at the card first under a copy of it, the card lifts for 168 ms, opens over 420 ms (588 ms in all), closes over
  357 ms, and reduced motion opens and closes at once. Here the copy is the run card's top: the day, the run's name in
  the card's own size, and its dose line; the recorder's ground is the screen's ground.
- **Every way out closes into the run card:** Minimize and Back, Save, Keep for the test, and Delete (its confirm sheet
  goes first, then the recorder closes). Save's done row and its toast land after the close, so the card the recorder
  shrinks into is the card the run was saved to.
- **The live bar** (a run still going, the recorder minimized) opens the recorder the same way from the bar itself,
  with no card copy.
- **Does not change:** the recorder's screens, D267's track test gate, and D272's three open calls.

## D272: Mario's answers to the three calls and the open item (2026-11-08)

- **Date:** 2026-11-08, Post-v0.257.0. **Ruled by:** Mario, "Concur with all four", each the main session's
  recommendation, after he asked for them in plain words. No new D-code. D272 is ruled with these answers.
- **Call 1, the gate:** Save to the day appears only once the recorder has passed D267's track test at 2%: four laps of
  a 400 m track in lane 1 within 32 m of 1,600 m, and one road run within 2% of the watch. Until then a recorded run is
  kept on the phone and shared as a GPX file, and the run is logged by hand on the day sheet. (The case against: until
  the track test is run, Record run cannot fill in the log.)
- **Call 2, Speed Runs:** the recorder records a Speed Run's whole run (time, miles, average pace, mile splits) and shows
  no pace guard until stage 4 (effort by effort, after D258). (The case against: interval paces are not checked live.)
- **Call 3, rides, swims and rows:** no Record; their card's button opens the hand log for that sport (Amendment 1,
  item 4). (The case against: a GPS ride could work, but only running has been checked.)
- **The open item of Amendment 1, a run done without the phone:** a quiet **Ran without the phone?** link on the recorder
  before Start, which opens the day's hand log. The day card's top also opens the day sheet (`docs/decisions/this-week.md`,
  D276). (The case against: one tap more than a link on the run card.)
- **How it builds:** v0.258.0 (D276, `docs/decisions/this-week.md`) puts the run card, the lift card and Record run on
  This Week; Record run opens D267's recorder out of the run card with Ran without the phone? on it. The recording
  screen as R2 over R3, Save behind the gate, the live bar and "Back to your run" build next, then Can't run? (D249),
  in their own releases (Mario, 2026-11-08, "Screen now, rest next").
- **Where items 3 to 5 build (Mario, 2026-11-22, "Phase 4, once"):** the recording screen as R2 over R3, Save behind
  the gate, the live bar and "Back to your run" are built once, in the Expo app, in the migration's phase 4
  (`MIGRATION.md`), and never in today's app. The session recommended it after the first run on v0.263.0: built now,
  they would be built twice, and the climb (D296) is not settled. The case against: until phase 4 a recorded run does
  not fill the day's log, so runs are logged by hand. No new D-code: the items and their words are unchanged, only
  where they are built.

## D293 P-GPSSMOOTH: the recorder counts a fix only once it stands 10 m from the last one kept (proposed 2026-11-17, revised the same day, concurred 2026-11-18)

- **Date:** 2026-11-17 and 2026-11-18, Post-v0.262.4. **Ruled by:** the main session in the coach hat, on the two test
  runs Mario ran for D272's gate. First proposed as a 9 fix mean with no distance under 0.5 m/s; revised the same day,
  before Mario concurred, when he asked whether speed matters and the measure showed the mean depends on it. Mario
  concurred with the revised rule on 2026-11-18, his one condition that the code names the rule in its own words.
  **Bump:** MINOR, v0.263.0, with D296 (Mario: "MINOR 0.263.0, both"). **Shipped:** v0.263.0.
- **The ask (Mario):** "damn i didnt do the 400m track thing but here is what the app got, STRAVA got and you can look up
  what my COROS watch got that day" (2026-11-15, the road run); "think we need anything else to make sure the phone is
  accurate or what?"; the track run; "yeah write it up"; then "hmm does speed matter at all? like would it
  work for cycling and things like that?" and "do you not have any other running apps or code that have solved this
  problem already? this cant be a new problem".
- **The measure** (`tests/measure/gps-recording_track-test.md` and `tests/measure/gps-recording_speed.md`, their
  scripts beside them; the runs' GPX and FIT files are not committed):
  - **The track (4 laps of lane 1, 1,600 m).** As the recorder counts today, the phone read 1665.9 m for the whole
    recording (+4.12%) and 1641.8 m for the run alone (+2.61%). Lap by lap: 407, 407, 409 and 409 m. Standing, it
    counted 13.2 m in the 37 s before the run and 10.9 m in the 68 s after. The watch read 1613.0 m over the run
    (+0.81%) and logged positions only while moving.
  - **The road run.** Over the 3,596 s both recorded, the phone read 9182.1 m against the watch's 9034.0 m
    (+1.64%).
  - **The signal was good.** iOS's accuracy on the track: median 2.2 m, worst 7.4 m.
  - **The first proposal, withdrawn.** Each fix the mean of 9, no distance under 0.5 m/s: 1613.4 m (+0.84%) on the
    track and -0.96% against the watch on the road. But 9 fixes are 9 seconds, so the mean cuts every bend by more the
    faster the athlete goes: on a clean track it reads 1.25% short at the track test's pace, 3.92% at 5:58 a mile and
    11.91% at 9 m/s; on the two runs with every 3rd or 4th fix kept (the same ground 3 or 4 times as fast, the phone's
    own noise) it reads 5.29% and 9.56% short on the track. Its +0.84% was the corner it cut cancelling the noise it
    removed, at one pace only.
  - **The 10 m rule.** A fix kept only once it is 10 m from the last kept fix, iOS accuracy 50 m or better: 1622.0 m on
    the track (+1.38%, 22.0 m over against the 32 m allowed) and -0.09% against the watch on the road. With every 2nd,
    3rd or 4th fix kept it reads between +0.76% and +1.53% on the track and between -0.74% and -0.09% on the road; on
    the clean courses it stays within 0.82% of the true path at every speed from a walk to 12 m/s, but a 9 m/s ride on a
    running track's bends (-1.55%). 5 m reads 1632.4 m (+2.03%, over the gate) and +0.57%; 15 m 1609.8 m (+0.61%) and
    -0.77%.
- **The finding.** The recorder is long for two reasons, both in how it counts and neither in the signal. Running, it
  joins one fix a second, each a little to one side of the true path, into a slight zig-zag. Standing, it counts the
  fixes' drift as distance. A cure that averages a fixed number of fixes averages a fixed time, so it trades the
  zig-zag for corners cut in proportion to speed. A minimum step does not depend on speed: standing drift never stands
  10 m from the last kept fix, a 2 m wobble adds little to a 10 m step, and at a ride's speed every fix is kept and no
  bend is averaged away.
- **The coaching argument.** D267's still holds: a recorder that reads long writes a pace too fast into every chart that
  reads the log. One that reads short on bends writes a pace too slow, and worst where it matters, the athlete's speed
  work on a track. The rule has to hold at every pace the program prescribes, and the program also prescribes rides
  (its cycling goals). The 10 m rule holds within the watch's own reach on the known distance at every speed tried.
- **What changes (`core/src/gps/`, the math every run is counted by):**
  1. **The 10 m rule.** In each stretch (D267: the fixes between Start, a pause and Finish) the first valid fix with an
     iOS accuracy of 50 m or better is kept. After it, such a fix is kept only when it stands 10 m or more from the
     last kept fix, and that distance is added. A fix with an accuracy worse than 50 m is never kept. Nothing after a
     stretch's last kept fix is added (less than 10 m a stretch).
  2. **Splits.** A mile split falls between the two kept fixes either side of it, its moving time interpolated between
     them as before.
  3. **What reads it.** The distance, the average pace, the mile splits and the pace of the mile in progress. While a
     run records, the distance moves in steps of 10 m or more.
  4. **Every run is counted again.** The raw files do not change, so every run on the phone shows its new count the
     next time it is opened.
  5. **The gate is met on the runs already recorded.** D272's track test judges the recorder, and the plugin does not
     change for the count, so the build proves the gate by running the two runs' raw fixes through the new math (the
     track measure's row "The recorder's own count"). Save to the day (D272 items 3 to 5) may then build, in its own
     release.
- **Where the numbers come from.** 10 m and 50 m are the minimum step and the accuracy limit open source run and ride
  trackers use, measured here on Mario's runs rather than taken on trust: 10 m sits between 5 m, which fails the track
  half of the gate by 0.4 m, and 15 m, which reads closer on the track and further on the road and moves the live
  distance about every 7 seconds at his pace. 50 m changes nothing on his runs (worst 7.4 m); it keeps a wild fix, such
  as the first seconds of a cold GPS, out of the count.
- **What deliberately does not change:** the plugin and the raw file it writes (D267 item 2: record raw, judge later);
  the GPX, which keeps every valid fix, so the comparison sees what the phone saw (the 50 m limit and the 10 m rule are
  the count's, not the file's); the run card, the log and the program; the time, which was never wrong. iOS's speed
  reading is not used for distance, and no speed cut is needed. A step has no upper limit: after the GPS is lost the
  next kept fix counts as the straight line from the last.
- **Blast radius:** the iOS app's Run recorder (the Angular screen and `core/src/gps/`); every recorded run's distance,
  pace and splits on its screen. The page on Pages, the Expo beta (no recorder yet) and every program are untouched.
- **Tests (`tests/unit/gps-recording.test.ts`, hand oracles; each new one fails on v0.262.4):** a track north at 3 m/s
  whose fixes alternate 2 m east and west reads 5 m a second as every fix joined, 200 m over 40 s, and 120 m under the
  rule (the kept fixes are every 4th, 12 m apart on the line: the 3rd stands √(81 + 16) ≈ 9.85 m off); fixes wandering
  inside 4.3 m for a minute add nothing; a fix 100 m off with an accuracy of 60 m is never kept while one of 50 m is;
  a run north at 4 m/s that stops 4 m past its last kept fix counts 12 m, not 16. The D267 tests (the meridian degree,
  an invalid fix, a pause's gap, a straight track's splits, the GPX) keep their oracles: on a straight line at a steady
  speed the kept fixes lie on the line.
- **Mario's calls, answered:** (1) the revised rule, concurred 2026-11-18; (2) MINOR v0.263.0 with D296, his pick.
- **The first run on v0.263.0** (Post-v0.263.0, `tests/measure/gps-recording_first-run.md`): one road run of about 56
  minutes with the watch, one fix a second, none worse than 10 m. The recorder read 7619.2 m against the watch's
  7617.46 m (its lap data), +0.02%; every fix joined would have read +2.16%. Mile by mile the two part by up to 9.9 s
  against the watch's laps and come back together, mile 4 ending 1.0 s apart. The rule holds, and nothing changes.

## D296 P-STEPCLIMB: the recorder counts the steps and the climb (ruled 2026-11-18)

- **Date:** 2026-11-18, Post-v0.262.4. **Ruled by:** the main session in the coach hat, put to Mario on 2026-11-17 as
  the first of four ways to bring the phone's motion sensors in; Mario: "build step 1 and park 2 and 3 we will talk
  about it later, and yeah throw away 4 thats too much". **Bump:** MINOR, v0.263.0, with D293 (Mario). **Shipped:**
  v0.263.0.
- **The ask (Mario):** "also i see strava has elevation changes and stuff in their run records how do we get that?";
  "so you dont want to try the mixing of motion sensor thing you were talking about for max accuracy? whats the lift on
  that".
- **The measure** (`tests/measure/gps-recording_watch-climb.md`, its scripts beside it; no run file is committed):
  - **The phone's GPS altitude cannot give the climb.** Summed, it read 603 m of climb on the flat road run against the
    watch's 18 m, and 132 m with each altitude the mean of 9; 133 m on the track against the watch's 4 m.
  - **The watch counts climb with a 2 m turn band.** Its own altitude track, counted as below, gives its own session
    totals: 11 m of climb on the road (the session says 11 m), 18 m of descent (17 m), and nothing on the track (0 m).
    Every change counted gives 18 m and 25 m; a dead band of 2 m gives 6 m and 12 m.
  - **The watch's cadence** averaged 150.5 steps a minute on the road and 139.3 on the track.
- **The finding.** The climb a run's record shows comes from air pressure, as on the watch, not from GPS. The iPhone has
  a barometer and a step counter (Core Motion); the recorder reads neither today.
- **What changes:**
  1. **The plugin records two more kinds of line, raw, beside the fixes:** from the step counter, the steps since Start
     (`steps`), and where iOS gives them its distance from steps (`sd`, metres) and its current cadence (`cad`, steps a
     second); from the barometer, the altitude relative to its first reading (`ralt`, metres) and the pressure (`kpa`).
     Each line carries the time it arrived (`t`). As D267: nothing is filtered on the phone, and every judgement runs
     in core over the raw lines, so a rule tuned later reruns on the runs already recorded.
  2. **One permission, Motion & Fitness**, asked when the recorder opens, beside Location: "The Asylum counts your steps
     and your climb while you record a run. It stays on this phone." Refused, or on a phone without the sensors, the run
     records by GPS as before and the new figures read as blank.
  3. **Steps and cadence.** The steps a run counts are the rise in the step total between two readings of one stretch,
     the total standing at 0 at Start, so the steps between the last reading before a pause and the first after it
     count for nothing. The cadence is those steps over the moving minutes, in steps a minute,
     the watch's unit.
  4. **Climb.** The barometer's altitude in each stretch, counted as the watch counts its own (a turn band of 2 m): the
     altitude last counted is the mark, the stretch's first reading to begin with; a reading above the mark counts as
     climb when the last change counted was a climb or when it stands 2 m or more above the mark, a reading below the
     mark counts as descent the same way, and either way the mark moves to it. The climb shows in feet.
  5. **A split's climb.** Each mile split carries the net change of the barometer's altitude across the mile, from the
     last reading at or before its start to the last at or before its end, in feet with its sign.
  6. **The screen.** Under Miles, Avg pace and This mile, a second row: Climb ("59 ft"), Cadence ("152 spm") and Steps
     ("8,412"); a blank where there is no reading. Each split row adds its climb ("+10 ft").
  7. **The GPX** gives each point the step total and the barometer's altitude last read at or before its time, as the
     extensions `ia:steps` and `ia:ralt`, which other GPX readers ignore, so the comparison on the Mac reads them. Its
     `ele` stays iOS's GPS altitude.
- **Where the numbers come from.** The 2 m band is read off the watch: 1.5 m and 2 m both give the watch's totals on
  both runs, and 2 m, the larger, gives a phone in a pocket, whose air pressure moves with every stride and gust, the
  wider margin before a wobble counts as a hill. Steps a minute is the watch's own unit.
- **Parked and dropped (Mario, 2026-11-18).** Parked, to talk about later: steps that carry the distance through a GPS
  loss (the second way), and Apple's own workout session on the iPhone, iOS 26 and later (the third). Dropped: a fusion
  of our own of the motion sensors with GPS (the fourth), weeks of work that the references at hand could not prove.
- **What deliberately does not change:** the distance (D293 counts it; the step counter's distance is recorded, never
  counted); the GPX's `ele`; the run card, the log and every program; the page on Pages and the Expo beta (the recorder
  is the iOS app's alone).
- **Blast radius:** the iOS app: the ia-gps plugin (Core Motion, and one Info.plist key, a usage text and not a signing
  capability, so the TestFlight secrets do not change), the Run recorder screen and `core/src/gps/`.
- **Not yet seen:** whether iOS keeps the barometer and the step counter reporting with the screen locked. The step
  total counts from Start whatever the gaps; a gap in the barometer would lose the climb it spans. The next run with the
  watch shows it, and its measure (steps, cadence and climb against the watch's) is written when that run is in.
- **Tests (hand oracles; each new one fails on v0.262.4):** `tests/unit/gps-recording.test.ts`: the two new lines parse
  and a fix still parses as before; step totals of 0 and 100, a pause, then 150 and 250 count 200 steps, the 50 between
  the last reading before the pause and the first after it dropped; the cadence is those steps over the moving minutes; the
  altitudes 0, 1, 1.9, 0.5, 2.5, 3.5, 2, 1.4 and 2 count 3.5 m of climb and 2.1 m of descent; the band starts again
  after a pause; a split carries the barometer's net change across its mile; the GPX points carry the step total and
  the barometer's altitude last read. `frontends/app/test/unit/run-recorder.test.ts`: the second row reads "33 ft",
  "150 spm" and "1,500"; a run with no readings reads blank; a split row reads "+10 ft" and "−7 ft".
- **The first run on v0.263.0** (Post-v0.263.0, `tests/measure/gps-recording_first-run.md`): 8340 steps against the
  watch's 150 steps a minute over 55:48 (8342 to 8398), 0.36% under the middle; cadence 149.3 against 150. The step
  counter gave a new total at least every 5 s and the barometer a new reading at least every 7 s, the whole run through
  (the file does not say whether the screen was locked). The climb read 23.3 m up and 12.7 m down against the watch's
  15 and 10: the barometer drifted 10.2 m up over the run where GPS altitude stood 1.1 m up, and the drift counted as
  climb. Neither a wider band (4 m: 16.3 up, 5.7 down) nor the barometer held to GPS altitude (over 5 min: 18.3 up,
  16.1 down) reads the watch's totals. In the coach hat: the 2 m band was read off the watch's altitude, and this is the
  first time the phone's barometer has been measured against it; one run cannot pick the fix. The climb stays as built,
  the next runs with the watch are measured by the same script, and a ruling follows when they agree on a cause.
