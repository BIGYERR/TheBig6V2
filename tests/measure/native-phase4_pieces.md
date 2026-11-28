# Phase 4, piece by piece: what today's app holds, what the beta holds, what each piece needs

Measured 2026-11-27 on `dev` 5dfa36a (`ia-version` 0.263.0, IA Next 0.263.0 (131)), before anything of phase 4 is
built (`MIGRATION.md`, phase 4; section 6 decisions 15 and 17). Read only: every number below is a line count or a
grep count a command printed on that commit. No ruling and no build.

## A. Today's native code (`frontends/app/plugins-src`, 1,241 lines in 12 files)

| File | Lines | What it is |
|---|---|---|
| `ia-gps/src/ios/IAGps.swift` | 375 | The recorder: Core Location, the step counter, the barometer, one raw file a run |
| `ia-gps/www/gps.js` | 57 | `window.iaGps`: 11 calls and one event channel |
| `ia-gps/plugin.xml` | 40 | Two permission strings, the location background mode |
| `ia-island/src/ios/IAIsland.swift` | 143 | The Live Activity's three calls, and the share sheet (D264) |
| `ia-island/src/ios/RestTimerAttributes.swift` | 18 | The activity's data, compiled into the app and the widget |
| `ia-island/src/ios/widget/RestTimerWidget.swift` | 137 | What the lock screen and the Dynamic Island draw |
| `ia-island/src/ios/widget/Info.plist` | 29 | The widget's own |
| `ia-island/www/island.js` | 35 | `window.iaIsland`: run, stop, end, share |
| `ia-island/hooks/add-widget-target.js` | 348 | Adds the widget target to Cordova's Xcode project |
| `ia-island/plugin.xml` | 35 | `NSSupportsLiveActivities` |

- **Cordova in the Swift:** 31 lines of `IAGps.swift` and 15 of `IAIsland.swift` name Cordova (`CDV…`,
  `commandDelegate`, the view controller). Those are the plumbing an Expo module replaces. The rest is kept.
- **The hook (348 lines) does not move.** The beta's widget target is made by `@bacons/apple-targets` on every
  prebuild (`frontends/native/targets/RestTimerWidget/expo-target.config.js`).
- **What the plugins ask of iOS:** `NSLocationWhenInUseUsageDescription` (**The Asylum records your route while you
  run. It stays on this phone.**), `NSMotionUsageDescription` (**The Asylum counts your steps and your climb while you
  record a run. It stays on this phone.**), `UIBackgroundModes` `location`, `NSSupportsLiveActivities`. Each is a
  line of the app's Info.plist. None is a capability on the App ID, and the widget hook sets no entitlement and no
  app group: neither plugin changed a signing profile (`ia-gps/plugin.xml`, its own note).
- **The recorder's files:** `IAGps.swift` writes each run under the app's Application Support folder. The runs on
  Mario's phone are in today's app's container. The beta's recorder writes into the beta's own.

## B. Today's screens that use them

- **`iaGps`, 6 mentions in 4 files:** the recorder's screen (`screens/run-recorder/`: `run-recorder.ts` 260 lines,
  `record-host.ts` 133, `run-recorder-model.ts` 166; 559 in all), This Week's run card (`week-view.ts`: Record run is
  offered when the plugin is there, D272 item 6) and the Bugs tab's Run recorder row (`bug-report.ts`).
- **`iaIsland`, 10 mentions in 6 files:** the page's rest stopwatch (`legacy/src/js/rest-timer.ts`, 5: the wall
  clock inside the app, and run, stop or end after every change), the Angular rest timer and its model (1 each),
  two that are the share sheet, not the island (the recorder's Share, the backup's Save), and one comment.
- **The math is in core and stays:** `core/src/gps`, 662 lines in 5 files (`track.ts` 340: D293's 10 m rule, the
  splits, D296's steps, cadence and climb; `fit.ts` 211; `gpx.ts` 55; `format.ts` 51).
- **Today's recorder is D267's test bench:** Start, Pause, Resume, Finish, the second row (Climb, Cadence, Steps),
  the kept runs, Share (GPX), Keep for the test and Delete. D272 items 3 to 5 (the recording screen as R2 over R3,
  the summary, Save to the day behind the gate, the live bar, "Back to your run") are ruled and were never built in
  today's app: they build once, in the beta (Mario, 2026-11-22). The gate is met on the runs already recorded (D293
  item 5, `docs/decisions/gps-recording.md`).

## C. What the beta holds already (`frontends/native`)

- **A widget target, empty:** `targets/RestTimerWidget/` (`RestTimerWidget.swift` 18 lines, an
  `EmptyWidgetConfiguration`; deployment target 16.4; no entitlements). It builds, signs and uploads with every
  IA Next build, under the profile `IOS_PROFILE_NEXT_WIDGET`.
- **One Swift module that does nothing:** `modules/ia-spike/` (`IASpikeModule.swift` 14 lines: one function,
  `answer`, read by `native-spike.ts`, `spike-line.ts` and the Bugs tab's report context, **Swift answers.**).
- **The seams the screens left open:** This Week offers Record run and opens the hand log (D294 P-HANDLOGDOOR);
  the Bugs tab draws no Run recorder row ("Not built, with its owner: phase 4"); no rest timer at all since IA Next
  120 (D295 P-ISLANDONLY).
- **Packages there:** `expo-file-system`, `expo-document-picker`, `expo-clipboard`, `expo-sqlite`,
  `react-native-svg`, `@bacons/apple-targets`. **Not there:** any location, motion, ActivityKit or HealthKit code;
  `@kingstinct/react-native-healthkit` and `react-native-nitro-modules` (D292's pick).
- **The beta's Info.plist asks for nothing yet:** `app.config.js` sets no `infoPlist` and no entitlement.

## D. Piece by piece

| Piece | Ruled by | Swift that moves | New in the beta | Needs from Mario |
|---|---|---|---|---|
| The rest timer on the Dynamic Island | D233, D295 | `IAIsland.swift` (run, stop, end; the share call stays behind), `RestTimerAttributes.swift`, `RestTimerWidget.swift`: 298 lines | An Expo module; the widget's Swift in the target that is there; `NSSupportsLiveActivities` | One product call, open since D295: what on a screen starts, stops and resets a rest. No capability, no profile |
| The recorder, as today's | D267, D293, D296, D272 items 6 and 7 | `IAGps.swift`, 375 lines | An Expo module with an event channel; the recorder's screen from today's model; the Bugs tab's Run recorder row; Record run opening it out of the run card | The two permission strings (today's words name **The Asylum**; carried unless he says otherwise). iOS asks Location and Motion once on IA Next. No capability, no profile |
| The recording screen as ruled | D272 items 3 to 5 | none | R2 over R3 (the ring, the pace guard, the splits), the summary with Effort, Save to the day, the live bar, "Back to your run" | A real run on the phone. Nothing to set up |
| The watch import, the read | D292, Amendments 1 and 2 | none of today's | The HealthKit module, the read permission strings, the background delivery entitlement, the rule that fills the run card | HealthKit ticked on the App ID `com.bigyerr.ironasylum.next`, its App Store profile made again, the secret `IOS_PROFILE_NEXT_APP` replaced. The first step on his phone: COROS writes each run as a workout |
| The Profile page and the watch's setup | D292 Amendment 3; his word of 2026-11-22 (Bugs becomes Profile) | none | The tab's new name and its settings button (not ruled), Your watch first, the card on This Week, Steps, the Checklist | A mockup he picks from before the build (the page's shape is not ruled) |

- **The profile and the entitlement, in order.** A profile that allows HealthKit still signs a build that does not
  ask for it, so Mario can make the new profile at any time before the watch session at no risk. The other way
  round fails: a build that asks for HealthKit under the old profile does not sign, and the beta's lane goes red
  on `main`. Today's lane is apart (D288) and is not touched by either.
- **What the simulator can show:** a Live Activity and the Dynamic Island (iPhone 17 Pro), and a moving location
  (`xcrun simctl location`). **What it cannot:** the step counter and the barometer, recording with the screen
  locked, Health holding a watch's run. Those are seen on his phone, and the recorder's exit gate is a real run
  beside the watch.
- **The other open chat** (`chat/gps-field-tests`): its branch holds nothing ahead of `origin/dev`, and its
  worktree has one uncommitted file, `tests/measure/gps-recording_first-run.mjs`. No piece above edits that file.
  Its climb fix would change `core/src/gps/track.ts`, which the recorder's two sessions read and do not edit.

## E. The cut (proposed 2026-11-27; concurred by Mario the same day: "Go, island first")

**Amended 2026-11-28:** row 1 is put off until after the migration (Mario, in the island's own session;
`MIGRATION.md`, section 6 decision 19; `docs/decisions/rest-timer.md`). Four sessions are left, rows 2 to 5, and
the exit gate loses its rest on the lock screen and the island.

| # | Session | Why here |
|---|---|---|
| 1 | The rest timer on the Dynamic Island, with the call on what starts a rest | The smallest Swift (298 lines), seen whole on the simulator, and the first real code through the module, the widget target and the beta's lane. It gives back what the beta lost at build 120 |
| 2 | The recorder as today's: the module, the screen, the Bugs row, Record run | The larger Swift, held equal to today's screen. By then the climb chat has had a session more to land its fix |
| 3 | The recording screen as ruled: R2 over R3, the summary, Save to the day, the live bar | New work on a recorder already seen on his phone. May take two sessions |
| 4 | The watch import's read: HealthKit, the rule that fills the card | The one piece that changes signing. Its profile is made before it |
| 5 | The Profile page, Your watch and the guided setup | Its shape is picked from a mockup first; the Checklist reads what session 4 built |
| | The exit gate | A run with the phone beside the watch, a rest on the lock screen and the island, a run on the watch alone |

Five sessions, six if session 3 is cut in two (`MIGRATION.md` estimated four to five before D292's guided setup
and the Profile page were in it). **The case against this order:** the recorder first would give Mario more runs
on the beta before cutover, and the exit gate is a run; the island first costs that one session.
