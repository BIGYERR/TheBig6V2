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
- **Proved (v0.255.0):** the FIT reader read the Pace 4's file of 2026-10-26 (93,169 bytes, 2,185 records, one a second
  but for one 20 s gap) and matched COROS's own summary: session 5,640.39 m, timer 36:24, 15 laps, the first 1,028.58 m
  in 420 s. The comparison, fed the watch's own track as the phone, read the tracks 0.0 m apart and the splits within
  1.3 s. On the simulator (iPhone 17 Pro, iOS 26.5, the debug build), a straight route played north at 4 m/s recorded
  through a screen lock: 84 fixes one a second, 4 m each, 4.006 m/s; the screen read the file back on unlock, finished at 1:42 and 0.25 mi, and shared `asylum-run-2026-11-01-0026.gpx` (101 points). Early in a run the average pace reads slow (85 s in, 6:51 against 6:42 played): the second before the first fix and the second since the last one count with no distance yet. The first runs against the watch decide whether that needs a ruling.

## D272 P-RECORDRUN: This Week records the run, and the deck holds no run cards (PROPOSED)

- **Date:** 2026-11-05. **Ruled by:** the main session in the coach hat, on Mario's picks the same day: hero draft A
  ("i like A lets try that one out"), the recording screen as R2 with R3's splits underneath ("i concur"), and "we dont
  need any cardio cards if we are going with A since the cardio and lift blocks are seperate and we are placing the
  record button on it". Awaiting Mario on the calls at the end. **Bump:** Mario picks at the build (MINOR recommended:
  a new capability, no program output moves). **Shipped:** not yet. This is D267's stage 2.
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
  same day, of the rest day's two actions, "Keep them as links". No new D-code. **Shipped:** not yet.
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
  **Shipped:** not yet.
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
