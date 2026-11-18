# GPS recording: the track test and the road run (measure, 2026-11-17, on v0.262.4)

The result D272's gate names (`docs/decisions/gps-recording.md`, D272 call 1): four laps of a 400 m track in lane 1, the
phone within 2% of 1,600 m (32 m), and one road run within 2% of the watch. It is the measure behind D293.

- **The runs.** Road: 2026-11-13, 5:07 PM, a Recovery Run of about 60 minutes, the phone (the Run recorder, v0.255.0's
  plugin) and the COROS Pace 4 together. Track: 2026-11-17, 5:15 PM, about 30 s standing on the line, 4 laps of lane 1,
  about 60 s standing, the phone and the watch together, the watch on a plain Run (not Track Run, which snaps to the
  track). Mario carried the phone as he runs with it.
- **The files.** Each run's GPX, shared from the Run recorder, and the watch's FIT file, read through the COROS connector
  on Mario's yes. None is committed: a track shows where a run starts and ends. They sat in the session's scratchpad.
- **The script.** `node tests/measure/gps-recording_track-test.mjs <track.gpx> <track.fit> <road.gpx> <road.fit>`
  printed everything below; nothing was added up by hand.

---

## The track: 4 laps of lane 1, 1,600 m

- Phone: 842 fixes over 14:02; iOS accuracy median 2.2 m, 90th 3.5 m, worst 7.4 m.
- Phone as recorded, the whole recording: 1665.9 m, +4.12%.
- Phone as recorded, the run alone (its own speed over 1 m/s, 12:17): 1641.8 m, +2.61%.
- Phone standing: 13.2 m counted in the 37 s before the run, 10.9 m in the 68 s after.
- Phone lap by lap (each pass of the run's first fix): 407 m, 407 m, 409 m, 409 m.
- Watch: session 1615.4 m over 14:02, +0.96%; over the run 1613.0 m, +0.81%. It logged positions only while moving: its first is 34.6 s after the phone's, its last 71.0 s before.

## The road run: the phone against the watch, over the seconds both recorded

- The phone started 9.5 s before the watch and stopped 16.0 s after it; the seconds both recorded: 3596.
- Watch 9034.0 m; phone as recorded 9182.1 m, +1.64%.

## Each candidate fix on the same raw fixes

| Fix | Track, whole recording, against 1,600 m | Road, against the watch |
|---|---|---|
| Positions as recorded | 1665.9 m, +4.12% | +1.64% |
| Positions as recorded, no distance under 0.5 m/s | 1644.4 m, +2.77% | +1.64% |
| Positions as recorded, no distance under 1 m/s | 1644.4 m, +2.77% | +1.64% |
| Positions averaged over 5 fixes | 1636.2 m, +2.26% | -0.14% |
| Positions averaged over 5 fixes, no distance under 0.5 m/s | 1626.0 m, +1.62% | -0.14% |
| Positions averaged over 5 fixes, no distance under 1 m/s | 1626.0 m, +1.62% | -0.14% |
| Positions averaged over 9 fixes | 1623.0 m, +1.44% | -0.96% |
| Positions averaged over 9 fixes, no distance under 0.5 m/s | 1613.4 m, +0.84% | -0.96% |
| Positions averaged over 9 fixes, no distance under 1 m/s | 1613.4 m, +0.84% | -0.96% |
| iOS speed times time | 1622.6 m, +1.41% | -2.96% |

---

## How to read it

- **The gate as the recorder counts today.** The track half fails: 1665.9 m is 65.9 m over, against 32 m allowed (the
  run alone, 41.8 m over, fails too). The road half passes: +1.64% against the watch over the seconds both recorded.
  Over the whole of each device's recording the road read +2.12% (`gps-recording_watch-compare.js`, which compares whole
  recordings), because the phone ran 9.5 s before the watch and 16.0 s after it; the seconds both recorded are the fair
  comparison.
- **Two causes, both in how the recorder counts, not in the signal.** iOS's accuracy was 2.2 m at the median and 7.4 m
  at worst, so no accuracy cut changes anything (D267 ruled none). The phone adds about 8 m a lap while running: one
  fix a second, each a little to one side, joined into a slight zig-zag. And it counts its drift while standing:
  13.2 m in the 37 s before the run and 10.9 m in the 68 s after.
- **The watch is a fair second opinion.** On the track it read +0.81% over the run (some of that is the runner's line:
  400 m is measured 30 cm off the inside edge, and the middle of lane 1 runs about 2 m a lap longer). On the road, if
  the watch reads about as long as it did on the track, a fix at -0.96% against it sits within about 0.2% of the road's
  true distance; that is an estimate, since the road has no known distance.
- **Standing.** The road run's seconds both recorded hold no standing, so its column is the same with and without the
  speed cut. On the track 0.5 m/s and 1 m/s give the same distance on every row: the result does not hang on the exact
  number.
- **Not this.** iOS's own speed reading times time read 1.41% long on the track and 2.96% short on the road: it does not
  follow the distance either way.
