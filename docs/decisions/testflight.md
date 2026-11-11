# TestFlight: decisions

The native app's road to the phone through App Store Connect: the TestFlight jobs in `.github/workflows/pipeline.yml`
after the deploy proof on `main`, `frontends/app/scripts/ios.mjs release` (the signed archive and the upload),
`scripts/testflight.mjs` (the gate and the wait) and the bundle `frontends/app/config.xml` describes. The setup is in
`frontends/app/README.md`, TestFlight from CI. Tests: `frontends/app/test/unit/testflight.test.ts` and
`release-signing.test.ts`.

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
