# GPS recording: the iOS app records a run, checked against the watch

## D267: P-GPSTEST, the iOS app records a test run by GPS, and a script checks it against the watch (PROPOSED)

- **Date:** ruled 2026-10-31. **Ruled by:** the main session in the coach hat; awaiting Mario. **Bump:** Mario picks.
  **Shipped:** not yet.
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
