# The Expo app's Run recorder beside today's: the look, and what the simulator showed

Measured 2026-11-28 on the iPhone 17 Pro simulator (iOS 26.5), IA Next 0.263.0 built from `chat/run-recorder`.
Today's installed app on that simulator is 0.255.2, whose recorder has no second row (D296 is v0.263.0's), so the
reference is today's markup drawn by WebKit: today's template typed out for four states inside today's built page
and under `week-view.css`, served to the simulator's Safari
(`tests/measure/native-run-recorder_reference.py`). Today's app was opened too, by night: its header, its clock
and its first row stand where the reference's do, band for band.

## 1. The bands, the beta against today's (points; `tests/measure/native-run-recorder_bands.py`)

A past run of 2.24 mi with steps and a barometer, opened from Past runs, by night. The first build drew every line
from the CSS alone; the comparison found nine differences, fixed in one build. After it:

| Line | Beta: top, height, gap above | Today's: top, height, gap above | Gap differs by |
|---|---|---|---|
| Back's pill | 62.0, 37.3, 11.3 | 62.0, 37.0, 11.3 | 0.0 |
| The when line | 103.0, 9.7, 3.7 | 102.7, 9.7, 3.7 | 0.0 |
| The title | 122.3, 16.3, 9.7 | 122.0, 16.3, 9.7 | 0.0 |
| The GPS line | 178.3, 9.3, 39.7 | 178.0, 9.3, 39.7 | 0.0 |
| The clock | 215.3, 41.0, 27.7 | 215.0, 41.0, 27.7 | 0.0 |
| Miles, Avg pace, This mile | 280.0, 9.7, 23.7 | 279.7, 9.7, 23.7 | 0.0 |
| Their figures | 307.7, 17.3, 18.0 | 307.7, 17.3, 18.3 | 0.3 |
| Climb, Cadence, Steps | 349.7, 10.0, 24.7 | 349.3, 10.0, 24.3 | 0.3 |
| Their figures | 376.0, 13.3, 16.3 | 376.0, 13.3, 16.7 | 0.3 |
| The buttons | 407.7, 50.3, 18.3 | 408.0, 50.0, 18.7 | 0.3 |
| Splits | 498.3, 12.0, 19.3 under its rule | 530.3, 12.0, 19.3 | 0.0 |
| Mile 1 | 524.7, 10.3, 14.3 | 556.0, 10.3, 13.7 | 0.7 |
| Mile 2 | 551.0, 10.3, 16.0 | 582.0, 10.3, 15.7 | 0.3 |
| Past runs | 605.7, 9.7, 19.7 under its rule | 636.7, 9.7, 19.7 | 0.0 |
| A past run's pill | 627.3, 41.0, 12.0 | 658.0, 41.0, 11.7 | 0.3 |
| The next pill | 676.3, 41.3, 8.0 | 707.0, 41.0, 8.0 | 0.0 |

Every line stands within 0.7 of a point of today's. Today's reference is 31 lower from Splits on because it also
draws the message line (**That run could not be shared.**), which the beta's shot does not hold: 18 of line and
14 of gap.

**What the first build had wrong, each fixed:** Back's pill 2 short; the title 1.7 high and the band's edge 1.7
high under it; the clock's figures 5 high in their line; 2 short under the first row's figures; 0.7 under the
second's; the buttons 2 short; a split's line 1.7 short; a past run's pill 1.3 short.

## 2. A run's start: the narrow space

iOS writes a run's start as **Nov 28 at 12:35 PM** with a narrow space that does not break before PM (U+202F).
WebKit draws that space. React Native's text drew nothing for it: **12:35PM**. The screen now draws a plain space
there (`recorder-screen.ts` `drawnLabel`), and the label the GPX is named by is left as iOS wrote it.

## 3. What the simulator showed of the module

- **The module is found and asks iOS as today's does.** Open on the Bugs row raised **Allow "IA Next" to use your
  location?** with today's words under it. Motion & Fitness was asked too, in today's words; on the simulator its
  question came up later, after Finish.
- **A run records.** Start wrote `Application Support/ia-gps/run-<ms>.jsonl` in the beta's own container: the
  start mark, then one fix a second from `xcrun simctl location booted run "City Run"`. The clock, the miles and
  both paces moved (0.03 mi at 0:14, 7:29 a mile).
- **It records behind another app.** With Safari in front the file went from 43 lines to 86, a line a second, and on its
  return the screen read the file back: 1:28 and 0.20 mi.
- **Pause, Resume and Finish** drew their buttons and wrote their marks. Finish drew Share and Delete, the run's
  start over the title, and the run in Past runs.
- **A past run** with steps and a barometer (a made-up file written into the folder: 900 s north at 4 m/s) drew
  15:00, 2.24, 6:42, **10 ft**, **150 spm**, **2,250**, and its splits **6:42 +10 ft** and **6:42 −7 ft**, which
  are the figures today's own test types by hand for that run.
- **Share** raised the share sheet on `asylum-run-2026-11-28-1235`, a GPX of 17 KB. **Delete** asked **Delete
  this run? It cannot come back.** under the app's name, Cancel and OK, and OK deleted the file.
- **Not shown by the simulator:** the step counter and the barometer on a live run, and a run with the screen
  locked. Those are the phone's.

## 4. Two things that are today's own (not ruled, not changed)

- **By day, Back is a white pill with white words.** The header's band sets the type's colour and not the pill's
  ground (`.back-btn` under `.detail-header`, `session-sheet.css` over `detail-sheet.css`). Seen on the reference
  by day. The beta draws it as today's does.
- **On the simulator, today's Delete asks nothing and deletes nothing.** Today's app 0.255.2, a past run opened,
  Delete tapped twice: no question came up and the run stayed. The page's `confirm()` returned without one. Whether
  the phone does the same is not known. The beta asks the question D267 rules and deletes on OK. The question's
  title, **IA Next**, is this session's pick, since today's showed none to copy.
