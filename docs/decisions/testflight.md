# TestFlight: decisions

The native app's road to the phone through App Store Connect: the TestFlight jobs in `.github/workflows/pipeline.yml`
after the deploy proof on `main`, `frontends/app/scripts/ios.mjs release` (the signed archive and the upload),
`scripts/testflight.mjs` (the gate and the wait) and the bundle `frontends/app/config.xml` describes. The setup is in
`frontends/app/README.md`, TestFlight from CI. Tests: `frontends/app/test/unit/testflight.test.ts` and
`release-signing.test.ts`. The beta app (the Expo app, `com.bigyerr.ironasylum.next`) has a lane of its own beside
it (D288): `frontends/native/scripts/`, its setup in `frontends/native/README.md`, its tests in
`tests/unit/native-testflight.test.ts`.

## D265: P-IPHONEONLY, the native app is iPhone only (v0.253.1)

- **Date:** 2026-10-31. **Ruled by:** Mario, choosing "iPhone only" over keeping iPad with a full-screen flag.
  **Bump:** PATCH (Mario). **Shipped:** v0.253.1.
- **The finding:** the first upload (pipeline run #45, 41166198014, on `main` at 1c1d89a, v0.252.0) signed and
  archived both targets, then App Store Connect refused the export: the bundle provided only portrait orientations
  (`UIInterfaceOrientationPortrait`, `UIInterfaceOrientationPortraitUpsideDown`), and an iPad-capable bundle must list
  all four to support iPad multitasking. Cordova's default device family is iPhone and iPad (`TARGETED_DEVICE_FAMILY`
  "1,2"), and `config.xml` sets `Orientation` portrait. Every secret Mario set was right: the certificate, its password
  and both profiles signed, and the upload reached Apple.
- **What changes:** `config.xml` adds `<preference name="target-device" value="handset" />` to the iOS platform, so
  Cordova writes `TARGETED_DEVICE_FAMILY` "1" and the app is iPhone only. Measured on a simulator build of the change:
  the app and the RestTimerWidget extension both carry `UIDeviceFamily` [1], so Apple's iPad orientation check no
  longer applies.
- **What deliberately does not change:** the app stays portrait only, and no screen, program or stored value changes;
  the page differs from v0.253.0 only in its version. The widget extension was already iPhone only (its hook sets
  `TARGETED_DEVICE_FAMILY` 1). An iPad can still run the app in iPhone mode.
- **Not chosen:** keeping iPad with `UIRequiresFullScreen`, which also passes the check but keeps an iPad build the app
  was never designed for, and would need iPad screenshots for a store listing.
- **Version:** 0.252.0 never reached App Store Connect, so the gate would have uploaded it again; Mario picked a PATCH
  so the first TestFlight build has a number of its own. The data backup build took 0.253.0 first, so this is 0.253.1.
- **Expected:** `testflight.test.ts` holds the preference in `config.xml`'s iOS platform with `Orientation` portrait
  (red on v0.253.0). The proof of the fix itself is the next TestFlight run on `main`: `testflight 0.253.1 processed`.

## D282: P-IOS15FLOOR, the native app runs on iOS 15 and later

- **Date:** 2026-11-10. **Ruled by:** Mario ("we need to shift from the floor being iOS 13 to iOS 15").
  **Bump:** PATCH (Mario). **Shipped:** v0.259.4. First written as D281 and v0.259.3; the swipe-deck
  chat landed its own D281 and 0.259.3 on `dev` first, so both were renumbered before any push.
- **The finding:** App Store Connect emails Mario after every TestFlight upload that the app's deployment target is
  too low: ITMS-90068, first seen on 0.254.0 (run 41222630185), the app targets iOS 13.0 and from April 2027 an upload
  must target 15.0 or later. `config.xml` never set `deployment-target`, so the App target inherits cordova-ios 8.1.1's template value:
  the generated `App.xcodeproj` (main checkout, before this change) carries `IPHONEOS_DEPLOYMENT_TARGET = 13.0` on both
  of the app's configurations and `16.2` on both of the RestTimerWidget extension's (set by the `ia-island` hook).
- **What changes:** `config.xml` adds `<preference name="deployment-target" value="15.0" />` to the iOS platform.
  Cordova's prepare writes it into every configuration; the `ia-island` after_prepare hook then sets the extension's
  own 16.2 again, as it already did for `TARGETED_DEVICE_FAMILY`. The app's minimum iOS becomes 15.0.
- **What deliberately does not change:** the widget extension stays at 16.2, and the Live Activity stays behind its
  `#available(iOS 16.2, *)` checks, so a phone on 15.0 to 16.1 runs the app without the island as before. The GPS
  plugin's `#available` checks for iOS 11 to 14 become always true and are left as written (a compiler note, not an
  error; no behaviour moves). No screen, program or stored value changes; the page differs from v0.259.3 only in its
  version. Phones on iOS 13 and 14 can no longer install new builds; Mario's phone is far past both.
- **Not chosen:** handoff §12 had parked the line to ride in the next release with its own reason to go up (a version
  goes up to TestFlight once). Mario chose a PATCH of its own: the warning arrives with every upload until it ships.
- **Expected:** `testflight.test.ts` holds the preference in `config.xml`'s iOS platform (red on v0.259.3). A local
  simulator build of the change shows `IPHONEOS_DEPLOYMENT_TARGET = 15.0` on the app's configurations and `16.2` on the
  extension's, and the built app's `MinimumOSVersion` is 15.0. The proof of the fix itself is the next upload from
  `main`: no deployment target email from App Store Connect.

## D288: P-NEXTLANE, the beta app has its own TestFlight lane, and a build goes up once

- **Date:** 2026-11-13. **Ruled by:** Mario (his brief: "a second TestFlight lane for com.bigyerr.ironasylum.next ...
  It runs beside today's lane and never touches it"; asked when the beta goes up, he chose "Once per change").
  **Bump:** none (Mario): today's app and the page do not change, `ia-version` stays 0.262.0.
  **Shipped:** Post-v0.262.0, the React Native migration's phase 2, session 3.
- **The finding:** today's rule, a version goes up to TestFlight once, would stall the beta. The Expo app's version is
  core's release version, and a phase 2 or 3 session changes the Expo app without moving it: sessions 1 and 2 were
  both Post-v0.262.0. Under today's rule the first upload would be the last until today's app is next released.
  App Store Connect asks only that a build number is new within its version.
- **What changes:** the pipeline gains three jobs on `main`, `next TestFlight (gate)`, `(upload)` and `(processed)`,
  for `com.bigyerr.ironasylum.next` with its `RestTimerWidget` extension
  (`frontends/native/scripts/testflight.mjs`, `scripts/ios.mjs release`).
  - **A build goes up once.** The beta's version stays core's. Its build number is a count: the commits in the
    checkout's history that changed `frontends/native`, `core` or `tests/semver.js`, what the app is built from.
    TestFlight shows `0.262.0 (101)`. A merge that changes none of them carries the count App Store Connect already
    holds and skips, green. A merge that changes any of them is the next build.
  - **The gate** skips, green, while any of its seven secrets is unset, before it counts or asks anything. Five are
    today's (the API key's three, the Apple Distribution certificate's two); two are the beta's own App Store
    profiles, `IOS_PROFILE_NEXT_APP` and `IOS_PROFILE_NEXT_WIDGET`.
  - **The signing is today's code**, imported and unchanged (`frontends/app/scripts/signing.mjs`): manual signing,
    one profile per signed target. No EAS.
  - **The archive is checked before it goes up:** the app and the widget must carry the beta's bundle ids, core's
    version and the build number, or the upload is refused.
  - **The app's config** takes the lane's build number as `IA_NEXT_BUILD` and answers the export compliance question
    (no non-exempt encryption). Any other build keeps the version as its build number, as before.
- **What deliberately does not change:** today's lane. Its three jobs, its scripts, its tests, its secrets and its
  rule (a version goes up once, a fix is the next PATCH) are untouched, and no file under `frontends/app` changes.
  The beta's jobs need none of today's and sit above them in the pipeline file, because today's test reads from its
  gate to the end of the file. Their names start with "next" and their notices are titled "TestFlight next", so
  today's leg, which reads jobs that start with "TestFlight" and notices titled "TestFlight", never reads them.
  Nothing installs over `com.bigyerr.ironasylum`; the beta keeps its own bundle id and its own store.
- **Not chosen:** once per version (the stall above); every merge to `main` (about twenty macOS minutes a merge, and
  TestFlight filling with identical builds on tests-only and docs merges); EAS Build (MIGRATION.md 4.1).
- **Expected:** `tests/unit/native-testflight.test.ts`. The gate's three decisions and their notices, typed by hand.
  The count checked against real git in a temp repository: 1 after a core commit, still 1 after a docs commit, 2 and
  3 after a `frontends/native` and a `tests/semver.js` commit, still 3 after a test, today's app and the page, 3 on
  `main` through a merge commit, still 3 after a merge that changes no input, 4 after one that changes the app; a
  shallow clone refused. The archive refused with today's bundle id or a widget at another version. The pipeline's
  wiring: the seven secrets, no `needs` on today's jobs, the whole history fetched, today's three jobs reading
  nothing of the beta's.
- **The native spike it carries** (MIGRATION.md 4.1, the plugin risk): the widget target is added on every
  `expo prebuild` by `@bacons/apple-targets` 5.0.0 from `frontends/native/targets/RestTimerWidget`, and the Swift
  module is a local Expo module, `frontends/native/modules/ia-spike`, found by Expo's autolinking. `ios/` is still
  generated and never committed; the fallback of a committed `ios/` folder was not needed. The widget is empty (one
  `EmptyWidgetConfiguration`) and keeps the name and bundle id phase 4 will use, so its App ID and profile are made
  once. The module does nothing: the app asks it one question when the bundle loads, and the Bugs screen says
  "Swift answers." or "Swift does not answer." (`tests/unit/native-shell.test.ts`).
- **Proved on:** the simulator (iPhone 17 Pro, iOS 26.5, Release, Hermes): the screen reads "Swift answers.", the
  built app holds `PlugIns/RestTimerWidget.appex` with the bundle id `com.bigyerr.ironasylum.next.RestTimerWidget`.
  An unsigned Release archive for a device (`npm run archive-ios`) carried `0.262.0 (99)` in the app and the widget.
  Today's signing function, run on the generated project, set both targets to manual signing, and Xcode resolved
  the app's identity to Apple Distribution for a device build.
- **Seen on `main`** (run 43546144149, merge 62ea4ca, 2026-11-13, after Mario's App Store Connect steps and his two
  profile secrets): the gate went (28 s), the upload job archived, signed and uploaded `0.262.0 (100)` (7 min 35 s),
  and the processed job read it back from App Store Connect as processed (1 min 41 s). The lane's leg reads
  `testflight next 0.262.0 (100) processed`. Today's lane on the same run: its gate skipped, since App Store Connect
  already held 0.262.0, and its upload and processed jobs did not run. The two lanes ran apart, as ruled.
- **Not yet seen:** the build installed on Mario's phone from TestFlight, and the widget extension there.
