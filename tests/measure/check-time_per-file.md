# Where the 60-second check's time goes (measure, 2026-11-19, Post-v0.263.0)

Asked because the check ran at 47 to 53 s in the program list's session and hit its limit twice under machine load.
Read on a quiet machine (8 processors), on `dev` at b63aa36. Every figure is one a command printed
(`npx vitest run unit integration --reporter=json`, `node tools/check.mjs` and its run log under `temp/runs/`).

## The lanes

- The check passed in 45.7 s. Every step but one was done 21 s in. The last was the tests lane's
  `unit and integration tests`, at 45.7 s: it alone sets the check's time.
- The same Vitest run alone, nothing beside it: 32.07 s (tests 80%, import 17%, transform 3%).
- So the other lanes cost it about 14 s by sharing the processors in the first 21 s.

## The files

- 113 files, 2,354 tests (2,352 passed, 2 skipped). The files' own times add up to 163.8 s, spread over the
  processors.
- No file is a long pole: the slowest is 12.0 s, and the ten slowest add up to 87.2 s.
- 22 files are the Expo app's (`native-*`), 76.0 s of the 163.8. Of that, 35.0 s is their walks of The Half Manny
  through the standard history, which each file's sweep also makes as the first of its ten programs.
- 38 tests take a second or more.

| File | Its time (s) | Tests |
|---|---|---|
| integration/native-this-week.test.ts | 12.0 | 30 |
| integration/e2e-browser.test.ts | 10.6 | 8 |
| integration/native-program-list.test.ts | 9.2 | 13 |
| integration/native-store.test.ts | 9.1 | 30 |
| integration/native-session-sheet.test.ts | 8.7 | 7 |
| integration/stored-state.test.ts | 8.6 | 25 |
| integration/native-deck-swap.test.ts | 8.6 | 4 |
| integration/native-progress.test.ts | 8.2 | 8 |
| integration/native-deck.test.ts | 6.6 | 4 |
| integration/run-week-layout.test.ts | 5.7 | 55 |

A boot of the page in the harness takes 3 ms once the script is compiled (8 ms to compile it the first time in a
process), so the boots are not where the time is.

## The trim tried

The program list's slowest test (5.9 s inside the full run, 3.4 s alone) walks the list at five stretches, the goal
sheet and the mile pencil at two, and a second program. Alone, by walk: the list 0.46 s, the goal sheet 0.32 s
before anything is trained and 0.80 s after three weeks, the mile pencil 0.15 s and 0.42 s, the second program
0.61 s. The goal sheet and the mile pencil after three weeks (1.2 s) were taken out of the fast file; the sweep
makes both on all ten programs, The Half Manny first.

- The program list's break list on the trimmed file, in four parts: 180 breaks made of 180, 0 let through by the
  fast files, 0 let through by every file.
- The check after the trim: 45.7 s. Before it: 45.7 s. The trim is too small to read.

## What this says

- The time is flat across 113 files, and it grows with each row of the migration: each new `native-*` fast file
  that walks the whole standard history adds 5 to 9 s of file time, about a second of the check.
- The one piece large enough to read is the 35.0 s of standard history walks the sweeps already make. Taking them
  out of the fast files means each of the eight native break lists runs again, since its fast stage would catch
  less. That is a pass of its own, not a small one.
- A new fast file can be written light from the start: The Half Manny at the stretches that draw the most, the
  kinds the standard history does not draw on phones of their own, and the ten programs through every stretch in
  the sweep.
