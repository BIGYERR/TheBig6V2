# GPS recording: how the watch counts climb and cadence (measure, on v0.262.4)

The measure behind D296 (`docs/decisions/gps-recording.md`): the iPhone's barometer and step counter are counted the
way the COROS Pace 4 counts its own, so the phone and the watch can be compared run against run.

- **The files.** The watch's FIT files of the road run and the track test, read through the
  COROS connector on Mario's yes; neither is committed.
- **The script.** `node tests/measure/gps-recording_watch-climb.mjs <label>=<watch.fit> ...` printed everything below;
  nothing was added up by hand.

---

## Road run

- The watch's session: total ascent 11 m, total descent 17 m; its altitude track: 3595 points.

| Band | Dead band: climb, descent | Turn band: climb, descent |
|---|---|---|
| 0 m | 18.0 m, 25.0 m | 18.0 m, 25.0 m |
| 0.5 m | 18.0 m, 25.0 m | 18.0 m, 25.0 m |
| 1 m | 18.0 m, 25.0 m | 18.0 m, 25.0 m |
| 1.5 m | 6.0 m, 12.0 m | 11.0 m, 18.0 m |
| 2 m | 6.0 m, 12.0 m | 11.0 m, 18.0 m |
| 3 m | 3.0 m, 9.0 m | 7.0 m, 14.0 m |
| 4 m | 0.0 m, 4.0 m | 4.0 m, 11.0 m |

- Cadence: 3590 records, mean 150.5 steps a minute; the session's average cadence (field 18) 75 strides a minute.

## Track test

- The watch's session: total ascent 0 m, total descent 0 m; its altitude track: 737 points.

| Band | Dead band: climb, descent | Turn band: climb, descent |
|---|---|---|
| 0 m | 4.0 m, 3.0 m | 4.0 m, 3.0 m |
| 0.5 m | 4.0 m, 3.0 m | 4.0 m, 3.0 m |
| 1 m | 4.0 m, 3.0 m | 4.0 m, 3.0 m |
| 1.5 m | 0.0 m, 0.0 m | 0.0 m, 0.0 m |
| 2 m | 0.0 m, 0.0 m | 0.0 m, 0.0 m |
| 3 m | 0.0 m, 0.0 m | 0.0 m, 0.0 m |
| 4 m | 0.0 m, 0.0 m | 0.0 m, 0.0 m |

- Cadence: 804 records, mean 139.3 steps a minute; the session's average cadence (field 18) 67 strides a minute.

---

## How to read it

- **The watch counts climb with a 2 m turn band.** Counted as a turn band of 1.5 m or 2 m, its own altitude track gives
  its own session totals: 11 m of climb on the road (the session says 11 m) and 18 m of descent (the session says 17 m),
  and nothing on the flat track (the session says 0 m). Counting every change gives 18 m and 25 m on the road and 4 m
  and 3 m on the track, which the watch does not report. The dead band, which drops what is left below the band at
  every turn, reads short (6 m of climb on the road).
- **2 m, not 1.5 m.** Both give the same totals on these two runs; 2 m is the larger, so a phone in a pocket, whose air
  pressure moves with every stride and gust, has the wider margin before a wobble counts as a hill.
- **The watch's cadence is steps a minute.** Its records average 150.5 steps a minute on the road and 139.3 on the
  track, twice its session's 75 and 67 strides a minute. The phone's cadence is its steps over its moving minutes, in
  steps a minute, to be read against these.

## The phone's GPS altitude cannot give the climb

Printed by `node tests/measure/gps-recording_gps-altitude.mjs <phone.gpx> <watch.fit> <label>`, once a run:

- The road run, the phone's GPS altitude, 3622 fixes, every change: climb 603 m, descent 606 m, range 3 to 13 m.
- The road run, the phone's GPS altitude, each the mean of 9: climb 132 m, descent 133 m, range 4 to 12 m.
- The road run, the watch's barometric altitude, 3595 points, every change: climb 18 m, descent 25 m, range 2 to 10 m.
- The track test, the phone's GPS altitude, 842 fixes, every change: climb 133 m, descent 134 m, range 7 to 11 m.
- The track test, the phone's GPS altitude, each the mean of 9: climb 20 m, descent 22 m, range 8 to 11 m.
- The track test, the watch's barometric altitude, 737 points, every change: climb 4 m, descent 3 m, range 6 to 7 m.

The phone's GPS altitude wanders a few metres from one second to the next, so summed it reads hundreds of metres of
climb on a flat road (603 m against the watch's 18 m), and still 132 m when each is the mean of 9. A pocket GPS cannot
give a run's climb; the barometer, which the watch uses, can.
