# GPS recording: the first run on v0.263.0 against the watch (measure, on v0.263.0)

What D293 and D296 left to see on the phone (`docs/decisions/gps-recording.md`): the distance by the 10 m rule against
the watch, the steps and cadence against the watch's, the climb against its session ascent, and whether the step
counter and the barometer keep reporting through a run in the pocket with the screen locked.

- **The run.** One road run of about 56 minutes with no pause, the phone on v0.263.0's Run recorder and the COROS Pace 4
  together.
- **The files.** The Run recorder's GPX, shared from the phone; it is not committed (a track shows where a run starts
  and ends) and sat in the session's scratchpad. The watch's totals are COROS's own activity record, read through the
  connector; no watch file was downloaded.
- **The script.** `node tests/measure/gps-recording_first-run.mjs <run.gpx> 7.62 55:48 150 15 10` printed everything
  below; nothing was added up by hand.

## The fixes
- 3352 fixes over 55:51 from Start, 1 segment; seconds between fixes: 1 s ×3351.
- Accuracy: median 2.4 m, worst 5.8 m; worse than 10 m: 0; worse than 50 m: 0.

## Distance
- The watch: 7620 m in 55:48 (COROS rounds to 10 m, so 7615 to 7625 m). The phone recorded 55:51.
- The recorder (the 10 m rule, as the screen counted): 7619.2 m, -0.08% to +0.06% against the watch.
- Every fix joined (the count before v0.263.0): 7782.1 m, +2.06% to +2.19%.
- Splits: mile 1 11:28, mile 2 11:42, mile 3 11:22, mile 4 11:41.

## Steps and cadence
- The phone: 8340 steps, 149.3 steps a minute over 55:51 moving.
- The watch: 150 steps a minute (149.5 to 150.5) over 55:48, so 8342 to 8398 steps; the phone's 8340 is -0.36% against the middle.

## Climb
- The watch: 15 m up, 10 m down (net +5 m).
- The recorder (the barometer on the 2 m turn band, as the screen counted): 23.3 m up, 12.7 m down; split net climb +3.7, +1.6, +1.0, -2.9 m.
- The barometer on a 3 m band: 19.7 m up, 9.1 m down.
- The barometer on a 4 m band: 16.3 m up, 5.7 m down.
- The barometer on a 5 m band: 16.3 m up, 5.7 m down.
- The barometer on a 6 m band: 10.6 m up, 0.0 m down.
- GPS altitude on a 2 m band: 100.8 m up, 98.9 m down.
- GPS altitude on a 5 m band: 20.5 m up, 18.6 m down.
- The barometer held to GPS altitude over 2 min, on the 2 m band: 20.9 m up, 18.8 m down.
- The barometer held to GPS altitude over 5 min, on the 2 m band: 18.3 m up, 16.1 m down.
- The barometer held to GPS altitude over 10 min, on the 2 m band: 18.5 m up, 16.1 m down.
- The barometer held to GPS altitude over 20 min, on the 2 m band: 19.2 m up, 15.8 m down.
- The barometer against its own 10 s mean: median 0.06 m, worst 0.63 m.
- Where each stood from Start, in m: 5 min: barometer 0.5, GPS 2.0; 10 min: barometer 3.3, GPS 4.0; 15 min: barometer 4.4, GPS 3.0; 20 min: barometer 4.8, GPS 3.7; 25 min: barometer 5.3, GPS 2.0; 30 min: barometer 7.6, GPS 4.8; 35 min: barometer 6.3, GPS 1.2; 40 min: barometer 2.4, GPS -3.8; 45 min: barometer 6.6, GPS -1.8; 50 min: barometer 8.7, GPS 0.2; 55 min: barometer 10.2, GPS 1.1.

## The step counter and the barometer through the run
- The step counter: first reading 8 s after Start, 1307 values, the longest wait for a new one 5 s; seconds between new values: 2 s ×696, 3 s ×491, 4 s ×118, 5 s ×1.
- The barometer: first reading 1 s after Start, 2520 values, the longest wait for a new one 7 s; seconds between new values: 1 s ×1932, 2 s ×434, 3 s ×93, 4 s ×40, 5 s ×12, 6 s ×5, 7 s ×3.

## What it shows
- **Distance holds.** The 10 m rule reads the watch's distance within its rounding; joining every fix, the count
  before v0.263.0, read about 2% long on the same fixes. One fix a second for the whole run, none worse than 10 m.
- **Steps and cadence hold.** 0.36% under the middle of the watch's range, two steps under its floor.
- **Both sensors report all run.** No wait for a new step total over 5 s, none for a new barometer reading over 7 s, in
  55:51. The file does not say whether the screen was locked; if it was, iOS keeps both reporting while the recorder
  runs in the background.
- **Climb reads high, and no band fixes it.** The barometer is smooth (a median 0.06 m off its own 10 s mean) but it
  drifted: 10.2 m up at 55 minutes where GPS altitude stood 1.1 m up and the watch's totals net +5 m. The drift counts
  as climb. A wider band trades the climb for the descent (4 m: 16.3 up, 5.7 down), and holding the barometer to GPS
  altitude takes out the net drift but leaves both totals near 18 and 16. One run cannot pick between them: D296's
  2 m band was read off the watch's own altitude, and this is the first time the phone's barometer has been measured
  against it. The climb stays as built until more runs are in (`docs/decisions/gps-recording.md`, D296).
