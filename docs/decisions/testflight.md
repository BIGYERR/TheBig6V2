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
- **Seen on `main`, the second run** (run 43554008703, merge 250e861, pull request 39, 2026-11-13 22:54 EST; the
  merge carried This Week in the Expo app, `docs/decisions/this-week.md`): the beta's gate went (9 s), the upload job
  archived, signed and uploaded `0.262.0 (101)` (581 s), and the processed job read it back as processed (101 s).
  The build number moved from 100 to 101 because the merge changed `frontends/native`: a build goes up once, and
  this was a new one. The leg reads `testflight next 0.262.0 (101) processed`. Today's lane on the same run: its
  gate went (11 s) and skipped the upload, since App Store Connect already held 0.262.0; its upload and processed
  jobs did not run. On `dev` before the merge (run 43552126510, 34a010e) every job was green: `native (Expo)` 799 s,
  unit and integration 776 s, e2e 385 s, `native (iOS simulator)` 224 s, app and backend 76 s.
- **Seen on `main`, the third run, the first with both lanes uploading** (run 43633436985, merge 0637ec8, pull
  request 40, 2026-11-14 14:41 EST; the merge carried v0.262.1 and the beta's icon): the two gates went together
  (12 s each). Today's lane uploaded `0.262.1` (169 s, done 14:45:06) and App Store Connect read it back as processed
  (132 s, done 14:47:20). The beta's lane archived, signed and uploaded `0.262.1 (103)` (731 s, done 14:54:30) and
  read it back as processed (103 s, done 14:56:15). The build number moved from 101 to 103 because two commits of the
  merge changed its inputs: 21f33ef (`core`, the overlay splice) and dc4551e (`frontends/native`, the icon). The legs
  read `testflight 0.262.1 processed` and `testflight next 0.262.1 (103) processed`. Neither lane waited on the other:
  today's was processed 7 min 10 s before the beta's upload ended.
- **On Mario's phone** (his report, 2026-11-14): builds 100 and 101 are installed from TestFlight, today's app
  (`com.bigyerr.ironasylum`) beside them and untouched.
- **On Mario's phone, build 103** (his report, 2026-11-14: "yes it says next but i dont see the widget extension"):
  the icon carries the NEXT band. No widget is offered, and none can be yet: the extension declares one
  `EmptyWidgetConfiguration` (`frontends/native/targets/RestTimerWidget/RestTimerWidget.swift`), which gives the
  widget gallery nothing to list. What shows the extension is in the build is the archive, not the phone: the upload
  job refuses an archive without `PlugIns/RestTimerWidget.appex` at the app's version, signs it with its own profile,
  and App Store Connect processed the result. The phone sees it in phase 4, when the widget gets its content
  (MIGRATION.md 4.1).
- **Seen on `main`, the fourth run, both lanes uploading again** (run 43654925719, merge f28435c, pull request 41,
  2026-11-14 18:46 EST; the merge carried v0.262.2, `refreshProgram` and the freeze in core): the two gates went
  together (10 s and 11 s). Today's lane uploaded `0.262.2` (264 s, done 18:52:16) and App Store Connect read it back
  as processed (101 s, done 18:54:00). The beta's lane archived, signed and uploaded `0.262.2 (104)` (711 s, done
  18:59:44) and read it back as processed (132 s, done 19:01:58). The build number moved from 103 to 104 because one
  commit of the merge changed its inputs: eef5517 (`core`, the launch). The two tests-only commits beside it changed
  neither `frontends/native`, `core` nor `tests/semver.js`, and did not count. The legs read `testflight 0.262.2
  processed` and `testflight next 0.262.2 (104) processed`. Today's lane was processed 5 min 44 s before the beta's
  upload ended.
- **On Mario's phone, today's app after the fourth run** (his two screenshots and his note, 2026-11-14 19:17: "i think
  the only thing atleast what i noticed is that no more tips from NSW on the rest day"): THE HALF MANNY, Week 12, 22
  days out, Race day Sun, Dec 6, Recovery Week; the strip REST, SPEED, RECOV, REST, LEGS, RECOV, LONG with Monday's
  cross and five checks; today's card Long Run, Skipped, Cutback · 60 min · 10:30/mi, "The long run steps back on
  purpose. Average no faster than 9:58/mi.", then Full Body Support, Pushups (slow tempo) + 1 more, closed out. The
  same words as his report of 09:37 that morning under 0.262.0, so nothing on This Week moved with the launch's lift
  into core. The screenshots do not show the build number, and he did not say whether the backup came first; a backup
  saved by 0.262.1 that day is on his Mac. **The tip:** his rest day screenshot is Wednesday the 11th, a past day, and
  the tip is drawn only on a rest day that is today (`week-view-model.ts`, `if (s.today) tip = d.restTip()`, since
  v0.258.0, D276). So it is the rule and not a change of 0.262.2; whether a past rest day should carry a tip is his
  to rule, and nothing was changed.
- **Seen on `main`, the fifth run, the beta's lane alone** (run 43662580379, merge 0c0d496, pull request 42,
  2026-11-14 20:20 EST; the merge carried no version: 6bfa503, the Expo screen's seam reading the lifted launch, and
  9995acd, a tests-only pass): the two gates went together (11 s and 13 s). Today's lane skipped its upload and its
  processed job, as the rule has it: App Store Connect already holds `0.262.2`, and a version goes up once. The beta's
  lane archived, signed and uploaded `0.262.2 (105)` (739 s, done 20:33:23) and read it back as processed (101 s, done
  20:35:06). The build number moved from 104 to 105 because one commit of the merge changed its inputs: 6bfa503
  (`frontends/native`, the seam). 9995acd changed neither `frontends/native`, `core` nor `tests/semver.js`, and did
  not count. The legs read `testflight 0.262.2 processed (uploaded before this run; a version goes up once, a fix is
  the next PATCH)` and `testflight next 0.262.2 (105) processed`. The run ended green, every job passed or skipped by
  rule. This is the first run where one lane went up and the other held, which is D288's point: neither waits on the
  other, and a merge that moves only the beta leaves today's app as it was.
- **Seen on `main`, the sixth run, the beta's lane alone again** (run 43673451809, merge 249af41, pull request 43,
  2026-11-14 22:41 EST; the merge carried no version: d106239, the dumbbell's fix, 67017d4, the swipe deck's cards
  read only, a8cf07e, docs, and 81beff7, rule wording): the two gates went together (10 s and 13 s). Today's lane
  skipped its upload and its processed job: App Store Connect already holds `0.262.2`. The beta's lane archived,
  signed and uploaded `0.262.2 (107)` (558 s, done 22:51:24) and read it back as processed (132 s, done 22:53:39).
  The build number moved from 105 to 107 because two commits of the merge changed its inputs, d106239 and 67017d4
  (both `frontends/native`); a8cf07e and 81beff7 changed neither `frontends/native`, `core` nor `tests/semver.js`,
  and did not count. There is no build 106: a number is a count of commits, and only a merge goes up. The legs read
  `testflight 0.262.2 processed (uploaded before this run; a version goes up once, a fix is the next PATCH)` and
  `testflight next 0.262.2 (107) processed`. The run ended green, every job passed or skipped by rule.
- **On Mario's phone, build 107** (his report, 2026-11-14, asked for the dumbbell after Friday then Saturday in week
  12 and for the deck beside today's deck on the same day: "Both same"). No screenshot came with it, so the record
  is his words. The dumbbell's entry is in `docs/decisions/this-week.md`, the deck's in
  `docs/decisions/swipe-deck.md`.
- **Seen on `main`, the seventh run, both lanes uploading** (run 43720981347, merge 199c85d, pull request 44,
  2026-11-15 08:49 EST; the merge carried v0.262.3: a80424f, docs, 8e1c1dc, the release, f70ae7c, the deck's logging
  in the Expo app, and 4d25a23, rule wording): the two gates went together (10 s and 11 s). Today's lane archived,
  signed and uploaded `0.262.3` (294 s, done 08:55:10) and read it back as processed (101 s, done 08:56:54). The
  beta's lane archived, signed and uploaded `0.262.3 (109)` (715 s, done 09:02:12) and read it back as processed
  (162 s, done 09:04:56). The build number moved from 107 to 109 because two commits of the merge changed its inputs,
  8e1c1dc (`core`'s version) and f70ae7c (`frontends/native`); there is no build 108. The legs read
  `testflight 0.262.3 processed` and `testflight next 0.262.3 (109) processed`. The run ended green, every job passed
  or skipped by rule. Both lanes went up in one merge, each on its own jobs, as in the third and fourth runs.
- **On Mario's phone, build 109** (his report, 2026-11-15, four screenshots): the deck's card went blank after a
  swipe, the beta's own defect, proved on the simulator on his backup and fixed
  (`docs/decisions/swipe-deck.md`, the build 109 entry). The fix reaches his phone with the next merge that
  changes `frontends/native`, as build 110. Today's app 0.262.3 came down from this run too; his one remark on it
  is Reopen opening the session sheet, which is D278 item 4.
- **Seen on `main`, the eighth run, the beta's lane alone** (run 43768135478, merge 03d7498, pull request 45,
  2026-11-15 17:14 EST; the merge carried no version: 6e1aa75, the blank card fixed, 4373c5a, the swap sheet, and
  6eb096e, rule wording): the two gates went together (14 s and 12 s). Today's lane skipped its upload, as ruled:
  App Store Connect already holds `0.262.3`, and a version goes up once. The beta's lane archived, signed and
  uploaded `0.262.3 (111)` (447 s, done 17:22:40) and read it back as processed (162 s, done 17:25:24). The build
  number moved from 109 to 111 because two commits of the merge changed `frontends/native`, 6e1aa75 and 4373c5a;
  there is no build 110, so the blank card's fix reached the phone as build 111, not as the 110 the entry above
  expected. The legs read `testflight 0.262.3 processed (uploaded before this run; a version goes up once, a fix is
  the next PATCH)` and `testflight next 0.262.3 (111) processed`. The run ended green, every job passed or skipped
  by rule.
- **On Mario's phone, build 111** (his report, 2026-11-15, his words, no screenshot): Reopen does nothing on a done
  session, the lift marked done closed the run too, a double tap does not turn the deck up and down, and "the swipe
  feels off and less natural". One is the beta's own and is fixed (the cards jumped to their places when a swipe was
  let go, where today's ease there); two are parts not built yet (Reopen waits for the session sheet, the pager is
  D275's call 1); one is today's ruling (D276 item 7). `docs/decisions/swipe-deck.md`, the build 111 entry. The fix
  reaches his phone with the next merge that changes `frontends/native`. He did not report on the blank card, the
  swap sheet or today's app 0.262.3, so none is recorded as seen.
- **Seen on `main`, the ninth run, the beta's lane alone** (run 43786033465, merge b995321, pull request 46,
  2026-11-15 20:23 EST; the merge carried no version: ec4e357, the swipe's settle, 62d9d5d, the pop-ups, and two
  rule wording commits; read and recorded by the next session, the pager's): the two gates went together (15 s and
  11 s). Today's lane skipped its upload, as ruled: App Store Connect already holds `0.262.3`. The beta's lane
  archived, signed and uploaded `0.262.3 (113)` (425 s, done 20:32:12) and read it back as processed (164 s, done
  20:34:59). The build number moved from 111 to 113 because two commits of the merge changed `frontends/native`,
  ec4e357 and 62d9d5d; there is no build 112. The notices read `testflight 0.262.3 processed (uploaded before this
  run; a version goes up once, a fix is the next PATCH)` and `testflight next 0.262.3 (113) processed`. The run
  ended green: 6 jobs passed and 8 skipped by rule.
- **Seen on `main`, the tenth run, both lanes** (run 43790686756, merge 2b31923, pull request 47, 2026-11-15 21:11
  EST; the merge carried v0.262.4, D291 P-OWNITEMS: cd50eea its ruling, 62b9b7b the release, 407c274 rule wording):
  the two gates went together (16 s today's, 10 s the beta's). Today's lane archived, signed and uploaded `0.262.4`
  (301 s, done 21:18:18) and read it back as processed (100 s, done 21:20:00). The beta's lane archived, signed and
  uploaded `0.262.4 (114)` (307 s, done 21:18:17) and read it back as processed (135 s, done 21:20:34). The build
  number moved from 113 to 114 on one commit, 62b9b7b, which changed `core`. The legs read `testflight 0.262.4
  processed` and `testflight next 0.262.4 (114) processed`. The run ended green: 8 jobs passed and 6 skipped by
  rule. Both lanes went up in one merge, each on its own jobs.
- **On Mario's phone, build 114** (his report, 2026-11-15, one sentence, no screenshot): "All same as today's", to
  the list the pager's session asked about on IA Next build 114 beside today's app at 0.262.4
  (`docs/decisions/swipe-deck.md`, the build 114 entry). Nothing differed, so nothing was fixed from it.
- **Seen on `main`, the eleventh run, the beta's lane alone** (run 43870419495, merge 691253e, pull request 48,
  2026-11-16 07:51 EST; the merge carried no version: 575f6a1, the double tap and the pager, 75ae30a, the opening,
  and three docs and rule wording commits; read and recorded by the next session, the session sheet's): the two
  gates went together (12 s today's, 10 s the beta's). Today's lane skipped its upload, as ruled: App Store
  Connect already holds `0.262.4`, and a version goes up once. The beta's lane archived, signed and uploaded
  `0.262.4 (116)` (521 s, done 08:06:44) and read it back as processed (132 s, done 08:08:58). The build number
  moved from 114 to 116 because two commits of the merge changed `frontends/native`, 575f6a1 and 75ae30a; there
  is no build 115. The notices read `testflight 0.262.4 processed (uploaded before this run; a version goes up
  once, a fix is the next PATCH)` and `testflight next 0.262.4 (116) processed`. The run ended green: 6 jobs
  passed and 8 skipped by rule.
- **On Mario's phone, build 116** (his report, 2026-11-16, one sentence, no screenshot): "Yep all good, can't
  reopen though not sure if that's just because you didn't build it out", to the double tap, the up and down
  pager, the opening, the close and Done, next one. Reopen is not built yet: it opens the session sheet, which
  starts with this session (`docs/decisions/swipe-deck.md`, the build 116 entry). Nothing was fixed from it.
- **Seen on `main`, the twelfth run, neither lane** (run 43958618007, merge 27a68d4, pull request 49, 2026-11-16
  16:17 EST; the merge carried one docs commit, 9c4707a, the migration's motion cut; read and recorded by the
  session sheet's second session): the two gates went together (12 s each). Both lanes skipped their uploads, as
  ruled: App Store Connect already holds `0.262.4`, and no commit of the merge changed `frontends/native`, `core`
  or `tests/semver.js`, so the beta's build stayed 116. The notices read `testflight 0.262.4 processed (uploaded
  before this run; a version goes up once, a fix is the next PATCH)` and `testflight next 0.262.4 (116) processed
  (uploaded before this run; a build goes up once, the next change to the app is the next build)`. The run ended
  green: 4 jobs passed and 10 skipped by rule.
- **Seen on `main`, the thirteenth run, the beta's lane alone** (run 43978885142, merge 612d762, pull request 50,
  2026-11-16 18:23 EST; the merge carried no version: 3b60455, Reopen opens the day's session sheet in the Expo
  app, and three docs and rule wording commits; read and recorded by the next session, the sheet's second. Run
  43978883963, named in that session's brief, is the Pages build of the same merge): the two gates went together
  (11 s today's, 12 s the beta's). Today's lane skipped its upload, as ruled. The beta's lane archived, signed and
  uploaded `0.262.4 (117)` (695 s, done 18:36:21) and read it back as processed (224 s, done 18:40:08). The build
  number moved from 116 to 117 on one commit, 3b60455, which changed `frontends/native`. The notices read
  `testflight 0.262.4 processed (uploaded before this run; a version goes up once, a fix is the next PATCH)` and
  `testflight next 0.262.4 (117) processed`. The run ended green: 6 jobs passed and 8 skipped by rule.
- **On Mario's phone, build 117** (his report, 2026-11-16, no screenshot): "1. yes its slides up 2. yes 3. yes 4.
  yes 5. yes all same as todays", to five steps on IA Next build 117: Reopen on a done lift, the sheet with its
  cards and set rows, the slider and the notes kept over Back and Reopen, Done and its undo with the pop-up, Skip
  and its undo. Nothing differed and no motion was named, so nothing was fixed from it
  (`docs/decisions/session-sheet.md`, the build 117 entry).
- **Seen on `main`, the fourteenth run, the beta's lane alone** (run 44185429056, merge 6e9b9bf, pull request 51,
  2026-11-17 16:59 EST; the merge carried no version: 272488b, the add sheet, remove, the Wildcard tag, the jog,
  the 1RM card and the day's note in the Expo app's session sheet, and three docs and rule wording commits; read
  and recorded by the next session, the cardio sheet's, which found the run still uploading and waited for it):
  the two gates went together (13 s today's, 14 s the beta's). Today's lane skipped its upload, as ruled. The
  beta's lane archived, signed and uploaded `0.262.4 (118)` (472 s, done 17:08:05) and read it back as processed
  (104 s, done 17:09:51). The build number moved from 117 to 118 on one commit, 272488b, which changed
  `frontends/native`. The notices read `testflight 0.262.4 processed (uploaded before this run; a version goes up
  once, a fix is the next PATCH)` and `testflight next 0.262.4 (118) processed`. The run ended green: 6 jobs
  passed and 8 skipped by rule.
- **On Mario's phone, build 118** (his report, 2026-11-17, no screenshot): "yep all good", to five steps on IA Next
  build 118: Reopen on a done lift, the add button beside the tags, the add sheet and a pick, the toast and the
  added card with its remove, the remove and its toast. Nothing differed and no motion was named, so nothing was
  fixed from it (`docs/decisions/session-sheet.md`, the build 118 entry).
