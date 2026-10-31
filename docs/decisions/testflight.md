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
