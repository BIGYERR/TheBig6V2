# GPS recording: does the count depend on speed? (measure, on v0.262.4)

Mario, after D293 was first proposed: "hmm does speed matter at all? like would it work for cycling and things like
that?", then "this cant be a new problem". The measure behind D293's revision (`docs/decisions/gps-recording.md`).

- **The runs.** The track test (4 laps of lane 1) and the road run, each the phone's GPX shared
  from the Run recorder, and the road run's watch FIT; none is committed. They are the runs of
  `gps-recording_track-test.md`.
- **The script.** `node tests/measure/gps-recording_speed.mjs <track.gpx> <road.gpx> <road.fit>` printed everything
  below; nothing was added up by hand.

---

## A. Geometry, no noise, one fix a second, against the true path

Track, 4 laps, 1600.0 m:

| Speed | Every fix | Mean of 9 fixes | Mean over 9 m of ground | 10 m rule | Kalman, 3 m/s |
|---|---|---|---|---|---|
| 1.4 m/s, walk | -0.08% | -0.70% | -0.70% | -0.82% | -0.30% |
| 2.2 m/s, the track laps | -0.05% | -1.25% | -1.25% | -0.52% | -0.49% |
| 3 m/s, 8:57 a mile | -0.08% | -2.03% | -1.37% | -0.50% | -0.81% |
| 4.5 m/s, 5:58 a mile | -0.19% | -3.92% | -1.57% | -0.75% | -1.61% |
| 6.5 m/s, easy ride | -0.14% | -6.91% | -1.12% | -0.36% | -2.75% |
| 9 m/s, ride | -0.58% | -11.91% | -2.21% | -1.55% | -4.97% |
| 12 m/s, fast ride | -0.50% | -18.18% | -0.50% | -0.50% | -7.38% |

City block, 2 laps, 8 m corners, 2772.5 m:

| Speed | Every fix | Mean of 9 fixes | Mean over 9 m of ground | 10 m rule | Kalman, 3 m/s |
|---|---|---|---|---|---|
| 1.4 m/s, walk | -0.02% | -0.50% | -0.50% | -0.45% | -0.20% |
| 2.2 m/s, the track laps | -0.03% | -0.90% | -0.90% | -0.26% | -0.37% |
| 3 m/s, 8:57 a mile | -0.04% | -1.33% | -0.96% | -0.29% | -0.55% |
| 4.5 m/s, 5:58 a mile | -0.06% | -2.15% | -1.03% | -0.48% | -0.93% |
| 6.5 m/s, easy ride | -0.21% | -3.37% | -0.91% | -0.42% | -1.55% |
| 9 m/s, ride | -0.17% | -4.69% | -1.23% | -0.53% | -2.13% |
| 12 m/s, fast ride | -0.29% | -6.40% | -0.29% | -0.29% | -2.96% |

## B. The two runs, every n-th fix kept: the same ground n times as fast, with the phone's own noise

The track test averaged 1.90 m/s over the whole recording; the road run 2.51 m/s over the seconds both recorded.

Track, against 1,600 m:

| Fixes kept | Every fix | Mean of 9 fixes | Mean over 9 m of ground | 10 m rule | Kalman, 3 m/s |
|---|---|---|---|---|---|
| every fix | +4.12% | +0.84% | +1.16% | +1.38% | +2.31% |
| every 2nd | +3.23% | -1.70% | +1.11% | +1.42% | +1.99% |
| every 3rd | +2.72% | -5.29% | +0.99% | +1.53% | +1.69% |
| every 4th | +2.62% | -9.56% | +0.90% | +0.76% | +1.59% |

Road, against the watch:

| Fixes kept | Every fix | Mean of 9 fixes | Mean over 9 m of ground | 10 m rule | Kalman, 3 m/s |
|---|---|---|---|---|---|
| every fix | +1.64% | -0.96% | -0.50% | -0.09% | +0.76% |
| every 2nd | +0.85% | -2.61% | -0.50% | -0.31% | +0.26% |
| every 3rd | +0.37% | -4.15% | -0.84% | -0.57% | -0.09% |
| every 4th | +0.06% | -5.69% | -0.40% | -0.74% | -0.36% |

---

## How to read it

- **A count that averages a fixed number of fixes averages a fixed time.** At one fix a second, 9 fixes are 9 seconds:
  about 20 m of ground at the track test's pace, 60 to 110 m on a bike. The mean of positions on a bend lies inside the
  bend, so the count reads short, and more so the faster the athlete goes: on a clean track the mean of 9 reads 1.25%
  short at the track test's pace, 3.92% at 5:58 a mile and 11.91% at 9 m/s. On the two runs with every 3rd or 4th fix
  kept it reads 5.29% and 9.56% short on the track. Its +0.84% on the track test at the athlete's own pace was the
  corner it cut cancelling the noise it removed, a balance that holds at that pace only.
- **The 10 m rule does not depend on speed.** A fix counts only once it stands 10 m from the last one kept, and the
  distance joins the kept fixes. Standing, the drift never reaches 10 m from the last kept fix, so it adds nothing; at a
  run a 2 m wobble on a 10 m step adds little; on a bike every fix is more than 10 m on, so every fix is kept and no
  corner is averaged away. On the clean courses it reads within 0.82% of the true path at every speed but a 9 m/s ride
  on a running track's bends (-1.55%). On the two runs at every speed tried it reads between +0.76% and +1.53% on the
  track and between -0.74% and -0.09% against the watch on the road.
- **The other two.** Averaging over 9 m of ground holds at every speed too, a little short of the 10 m rule on the road;
  it has more parts to get wrong. The position only Kalman filter cuts corners with speed like the mean of 9 (-7.38% at
  12 m/s on the clean track) and leaves the track test 2.31% long.
- **Every fix joined reads closer the faster the run.** The wobble between fixes is a smaller share of a longer step,
  so at bike speed the noise matters little and the corner a smoothing cuts matters more.
- **Not this.** Every 2nd, 3rd or 4th fix stands in for a faster run on the same ground with the phone's own noise. Real
  fixes a second apart at bike speed sit closer together in their errors than fixes 3 or 4 seconds apart, so a real ride
  should read closer still; one ride with the watch is the proof.
