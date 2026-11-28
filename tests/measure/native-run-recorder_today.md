# The run recorder today, and what the beta holds: the measure before phase 4's recorder session

Measured 2026-11-28 on `dev` 5977e7e (`ia-version` 0.263.0, IA Next 0.263.0 (131)), before anything is built
(`MIGRATION.md`, phase 4; section 6 decisions 18 and 19; `tests/measure/native-phase4_pieces.md`, row 2 of its cut).
Read only, from the code: every count below is one a command printed on that commit. No simulator was touched (one
was booted with today's app running, another chat's). No ruling and no build.

## A. Today's recorder: 1,031 lines in 6 files

| File | Lines | What it is |
|---|---|---|
| `frontends/app/plugins-src/ia-gps/src/ios/IAGps.swift` | 375 | Core Location, the step counter, the barometer, one raw file a run. 31 lines name Cordova |
| `frontends/app/plugins-src/ia-gps/www/gps.js` | 57 | `window.iaGps`: 11 calls and one event channel |
| `frontends/app/plugins-src/ia-gps/plugin.xml` | 40 | The Info.plist lines and the two frameworks |
| `screens/run-recorder/run-recorder.ts` | 260 | The screen |
| `screens/run-recorder/run-recorder-model.ts` | 166 | The screen's words, from core's math |
| `screens/run-recorder/record-host.ts` | 133 | Record run's frame: the recorder grown out of the run card |

The math is core's and is not the screen's: `core/src/gps`, 662 lines in 5 files (`track.ts` 340, `fit.ts` 211,
`gpx.ts` 55, `format.ts` 51, `index.ts` 5). The model calls `gpsSummary`, `pacePerMile`, `parseRecording`,
`recordingGpx` and seven formatters, and holds no arithmetic of its own.

## B. The 11 calls and the one event channel

| Call | What native does | What comes back | Calls in the screen |
|---|---|---|---|
| `listen` | Keeps the channel, sends the permission as it stands | Events, below | 1 (as the screen is made) |
| `warm` | Location on, so the screen shows accuracy before Start. Asks Location when it is unasked, and Motion once | nothing | 1 (as the screen is made) |
| `cool` | Location off, unless a run is recording | nothing | 1 (as the screen closes) |
| `start` | A new run when none is recording: waits for permission if it is not given, then the file, the start mark, the step counter and the barometer | nothing; the start mark arrives as an event | 1 |
| `pause` | The pause mark. Location stays on | nothing | 1 |
| `resume` | The resume mark | nothing | 1 |
| `finish` | The finish mark, the sensors stopped, the file closed, background location off | the run's id, or "no run is recording" | 1 |
| `status` | | `{recording, paused, id}` | 2 (on a start mark; on every resync) |
| `list` | | `[{id, bytes}]`, newest first | 1 |
| `read` | Only a bare `run-…` id, so no call reaches outside the folder | the file's text, or "no such run" | 4 (the live run on resync, each past run's row, a past run opened, the run just finished) |
| `remove` | Never the run recording | nothing, or why not | 1 |

**Events** (`{type, …}`): `auth` (`unasked`, `granted`, `denied`: at `listen` and at every change), `fix` (`fix`,
`recorded`: every fix iOS delivers while the app is in front, recorded or not), `mark` (`line`: start, pause,
resume, finish), `motion` (`line`: a step counter or barometer reading, while the app is in front), `error`
(`message`). Native writes every line to the file before it sends anything. In the background nothing is sent: the
file has every line, and the screen reads it back when the page is visible again (`visibilitychange`, then
`status`, `read`, `list` and a `read` for each past run).

## C. What it stores, and where

- **One file a run:** `Application Support/ia-gps/run-<ms since 1970>.jsonl` in the app's own container, one JSON
  object a line: marks `{t, mark}`, fixes (10 fields: `t lat lon ha alt va spd sa crs ca`), step readings
  `{t, steps, sd, cad}`, barometer readings `{t, ralt, kpa}`. Raw: nothing native filters a fix.
- **No stored state.** The recorder's three screen files name `iaStore`, `localStorage` or an `ia_` key 0 times.
  A recorded run reaches no log, no chart and no backup (Save to the day is D272 item 4, the next session's).
- **It leaves the phone only by Share:** the GPX made by core (`recordingGpx`), handed to the share sheet through
  the island plugin's `share` call (D264's, not the island's).
- **The runs on Mario's phone are in today's app's container.** The beta's recorder writes into the beta's own.
  Nothing moves between them.

## D. The screen and its states

One screen, two doors. Top to bottom: Back, a when line and a title; the run's workout card (run card door only);
the GPS line; the clock (56 pt); Miles, Avg pace, This mile; Climb, Cadence, Steps (D296's second row); the
buttons; Ran without the phone? (run card door, before Start); a message line; Splits, one row a mile, each with
its time and its climb; Past runs, one button a run (its start, then miles and time).

| State | When | Buttons | Notes |
|---|---|---|---|
| Empty | No run in hand | Start | GPS line: **Waiting for GPS.**, `GPS ±N m`, or **Location is off for The Asylum. Turn it on in Settings.** Past runs listed |
| Recording | A start mark, live | Pause, Finish | The clock runs on the wall clock, once a second |
| Paused | A pause mark, live | Resume, Finish | |
| Finished | Finish just pressed | Share, Delete | The when line becomes the run's start. Back goes to Empty, not out |
| A past run | A row of Past runs tapped (never while live) | Share, Delete | A run with no finish mark (iOS closed the app) reads as finished at its last line |

- **Delete** asks first with WebKit's own question (`confirm`): **Delete this run? It cannot come back.**
- **Share failing** says **That run could not be shared.** A native error prints its own words on the message line.
- **Back** from a live run or from Empty closes the screen. A live run keeps recording with the screen closed.

## E. Where it opens from

1. **The Bugs tab's Run recorder row** (`bug-report.ts`): the row **Run recorder**, **Test GPS against your watch.
   Runs stay on this phone.**, Open. Drawn only when `window.iaGps` is there. Opens the screen as its own overlay
   with those words as its title and when line.
2. **Record run on This Week's run card** (`week-view.ts` `record`, `record-host.ts`; D272 item 6, Amendment 2):
   offered only when `window.iaGps` is there, runs only. The screen grows out of the card with the deck's numbers
   (168 ms lift, 420 ms open, 357 ms close; at once under reduced motion), under the day's when line and the run's
   name, with the run's workout card above the GPS line (D278 item 2) and **Ran without the phone?** before Start,
   which closes the recorder and opens the run's own hand log.

## F. What it asks of iOS (`plugin.xml`)

- `NSLocationWhenInUseUsageDescription`: **The Asylum records your route while you run. It stays on this phone.**
- `NSMotionUsageDescription`: **The Asylum counts your steps and your climb while you record a run. It stays on
  this phone.**
- `UIBackgroundModes`: `location`. Location is asked while in use only; a run keeps recording with the screen
  locked under the blue pill (`allowsBackgroundLocationUpdates`, `showsBackgroundLocationIndicator`).
- Frameworks: CoreLocation, CoreMotion.

**No capability, no entitlement, no profile change.** All three are lines of the app's Info.plist. None is a
capability on the App ID and none is written into a signing profile. Today's app went up to TestFlight with these
lines under secrets that did not change (location in v0.255.0, motion in v0.263.0). The beta's
`app.config.js` sets no `infoPlist` and no entitlement today (0 mentions of either), and its widget target has
none.

## G. What the beta holds today

- **Record run is offered and opens the hand log** (D294 P-HANDLOGDOOR). `drawWeek` is called with `gps` true, the
  card's route already answers `{ to: 'record' }` (`cardio-sheet-model.ts` `cardRoute`), and `ThisWeek.tsx` sends
  that route to the run's own sheet. The seam is that one branch.
- **The workout above the clock is already modelled:** `recordWorkout` (`cardio-sheet-model.ts`, D278 item 2).
- **No Run recorder row on Bugs** (`Bugs.tsx`: "The Run recorder's row is phase 4's").
- **One Swift module, the pattern to follow:** `modules/ia-spike` (a podspec, `expo-module.config.json`, 14 lines
  of Swift), found by Expo's autolinking on every prebuild. `scripts/prebuild-stamp.mjs` already counts `modules`
  and `app.config.js` as native inputs, so a fast simulator build cannot miss the new module.
- **A share sheet already there:** the Bugs tab saves the backup into the app's cache and hands it to React
  Native's `Share`. The GPX goes the same way; the island plugin's `share` is not needed.
- **Not there:** any location or motion code, any event channel from Swift, an `infoPlist`.

## H. Tests there today

- `frontends/app/test/unit/run-recorder.test.ts`: 13 tests of the model (the screen's words, the buttons by state).
- `tests/unit/gps-recording.test.ts`: 24 tests of core's math. `tests/unit/fit-file.test.ts`: 4.
- `frontends/app/test/unit/cardio-sheet.test.ts`: the route to the recorder, the workout above the clock, Ran
  without the phone?.
- The Docker e2e names the recorder 0 times (no plugin in a browser).
- The beta's tests that hold D294's door: `tests/unit/native-cardio-sheet.test.ts`, `tests/unit/native-this-week.test.ts`,
  `tests/unit/native-bugs-tab.test.ts` (no Run recorder row). Each changes when the recorder is built.

## I. What the build is, piece by piece

| Piece | From | Size today | What is new |
|---|---|---|---|
| The module, `modules/ia-gps` | `IAGps.swift` | 375 lines, 31 of them Cordova's | The 11 calls as an Expo module's functions, the channel as one event. Every other line kept |
| The app's side of the module | `gps.js` | 57 | The same 11 calls and the event, typed; a build without the module reads as no recorder |
| The model | `run-recorder-model.ts` | 166 | A copy held equal to today's by a test, as the other screens' models are |
| The screen | `run-recorder.ts` | 260 | Today's rows and states. The app coming to the front stands in for `visibilitychange`. Share through the cache and `Share`. Delete's question as the system's alert |
| The Bugs row | `bug-report.ts` | 12 lines of template | The row and its overlay |
| Record run's door | `record-host.ts`, `week-view.ts` | 133 and 6 | The one branch in `ThisWeek.tsx`, the frame out of the card, the workout card, Ran without the phone? to the hand log. D294 ends |
| The Info.plist lines | `plugin.xml` | 3 keys | `ios.infoPlist` in `app.config.js` |

- **What the simulator can show:** a moving location (`xcrun simctl location`), so Start, the clock, miles, both
  paces, the splits, Pause, Resume, Finish, Share, Delete and the past runs. Today's app on the simulator holds the
  same screen, so the look has a reference.
- **What it cannot:** the step counter and the barometer (Climb, Cadence, Steps stay blank), and recording with
  the screen locked. Those are his phone's.
- **On his phone:** iOS asks Location and Motion once on IA Next. The words name **The Asylum**, as today's.
- **The other open chat** (`chat/gps-field-tests`): nothing ahead of `origin/dev`, one uncommitted file,
  `tests/measure/gps-recording_first-run.mjs`. No piece above edits it, and none edits `core/src/gps`.

## J. The cut, put to Mario

**His answer, 2026-11-28: "One session".** Built in the two steps below.

**One session or two.** Recommended: one, built in two steps. First the module, the screen and the Bugs row, seen
on the simulator with a moving location and committed. Then Record run's door. If the first step shows trouble,
the session stops there and tells him, and the door moves to the next session.

- **Why one:** the door is small once the screen is there (one branch, a frame, a card that is already modelled),
  and the next session rebuilds what stands behind that door anyway (D272 items 3 to 5). Two sessions cost one more
  merge, one more build on his phone and one more run to check it.
- **The case against:** this is the first real Swift through the beta's lane, with background location. In two
  sessions his phone would see the module alone first, through the Bugs row, and a fault there would be found on a
  smaller change. One session is also long (a module, a screen, two doors, a break list, the simulator, an archive).
