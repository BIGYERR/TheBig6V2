# V239 measure m1: the rest stopwatch and the iOS project, before the island (2026-10-09)

Measure, read-only, before-picture. Asked: Mario wants the floating count-up rest stopwatch mirrored on the iPhone
Dynamic Island. That needs an ActivityKit Live Activity, so only the native Cordova app under `app/` can show it,
never the Pages PWA. Base: index.html V238 (HEAD ff23706; `app/` committed after this pass as 17c919a).
Scratch scripts: `tests/measure/v239_island_m1.sh` (native side and footprint). Web side by untruncated `grep -n`
of every `_ru*`, `ru*`, `rt*`, `updateRestFloat`, `performance.now`, `setInterval`, `ia_r*` hit, reads at
L14013-14146, L14247, L14797.

## A. Web state machine (index.html V238)
- State: 4 module `let`s at L14015: `_ruId` (interval handle), `_ruRunning`, `_ruElapsed` (ms, frozen value),
  `_ruStart` (a performance.now base). Only clock: `performance.now()`, 3 sites in the whole file (L14017, 14029,
  14030). 0 `Date.now` reads in the stopwatch.
- Seams:
  - Start/resume: `ruStart` L14029: `_ruStart = performance.now() - _ruElapsed`, 33 ms render interval.
  - Freeze: `ruPause` L14030: `_ruElapsed = performance.now() - _ruStart`, clears the interval.
  - Read: `_ruNow` L14017. Toggle: `ruToggle` L14031.
  - End: `ruReset` L14032 (pause, then elapsed = 0).
  - `ruResetIfIdle` L14034 zeroes only when not running, so a PAUSED clock is zeroed by it.
  - Render: `_ruRender` L14020 writes #rtMini, #rtBig, #rtCs, #rtToggle.
- Callers (complete):
  - Inline onclick: L1203 `rtCollapse()`, L1207 `rtToggleBtn()` (L14079 calls `ruToggle`), L1208 `rtResetBtn()`
    (L14080 calls `ruReset`).
  - `ruResetIfIdle`: 1 site, L14247, day open. An idle open starts at zero; a running clock survives navigation.
  - `ruReset` also called from setting a status, L14797 (V221 D179: Done/Skip stops and zeroes the clock).
  - `updateRestFloat` L14130 shows or hides the tab (1 caller, `showScreen` L1607). Shown only when activeProg is set and
    the screen is week, progress or bugs. Hiding does NOT pause the clock.
  - Expand/collapse `_rtSetExpanded` L14070, `rtExpand` L14077, `rtCollapse` L14078. Drag `_rtWireDrag` L14082
    (changes the side only). Intro `_rtPlayIntro`, armed at L7653 by programs.length===0.
- Persistence: none. 0 `ia_` keys written. `ia_rt_seen` / `ia_rt_intro2` appear only in a comment at L7652
  (retired). 0 visibilitychange/pagehide/pageshow handlers for it; the file's only visibilitychange listener,
  L18488, is the update check.
- Reload mid-run: every value returns to its L14015 initial (stopped, 0:00). Elapsed time is lost.
- Screen lock: L14014's header claims "runs through screen-lock". That holds only if WebKit's monotonic clock
  advances while the device sleeps. NOT measured on a device.
- A Live Activity has no wall-clock anchor today. It would be derived at L14029/L14030 as Date.now() minus elapsed.
- Other timers: none the athlete sees. `setInterval` 3 times: L7637 (build-loader messages, 380 ms), L14029 (this
  stopwatch), L18489 (15-minute update check). `raceCountdown` L4286 counts days. No rest countdown, no run timer.
- Gate coverage: 1 gate (`g221_d179_donenav.js`) and 1 spec (`v221_d179.json`) reference `ru*`. The harness stubs
  `performance.now` as `Date.now` (tests/harness.js:121).

## B. Native
- cordova-ios 8.1.1, cordova CLI 13.0.0, Xcode 26.6 (17F113), iOS SDK 26.5, simulator runtime iOS 26.5.
- `platforms/` is gitignored and recreated on demand. ios.mjs:87 runs `cordova platform add ios` only when
  platforms/ios is missing, so a hand-added widget extension target lives on this machine only and is lost on
  regeneration. ios.mjs:255 runs `cordova prepare` on every device build. `prepare` rewrites the pbxproj:
  PRODUCT_BUNDLE_IDENTIFIER scoped to target 'App' (prepare.js:299); IPHONEOS_DEPLOYMENT_TARGET and SWIFT_VERSION
  from config.xml preferences, written with no target named (prepare.js:323-332).
- Hook points: no app/hooks, 0 `<hook>` in config.xml, 0 plugins (app/plugins absent; ios.json installed_plugins {};
  App/Plugins holds only a README). Extension points: config.xml `<hook>`, a local plugin, `<config-file>` /
  `<edit-config>`.
- IPHONEOS_DEPLOYMENT_TARGET 13.0 in 2 of 2 build configs; config.xml sets no `deployment-target`.
- 1 PBXNativeTarget (application). No extension target.
- Swift: AppDelegate.swift (`@objc @implementation` extension of CDVAppDelegate, 1 override), SceneDelegate.swift,
  ViewController.swift, Bridging-Header.h, SWIFT_VERSION 5.0. SPM packages cordova-ios and cordova-ios-plugins
  (CordovaPlugins.swift). No Podfile.
- Entitlements-Debug/Release.plist: empty dicts. App-Info.plist: 19 keys, 0 NSSupportsLiveActivities, 0
  UIBackgroundModes.
- Builds: sim `cordova build ios --emulator --debug`, DSTROOT=~/Library/Caches/iron-asylum-ios (L153). Device
  `xcodebuild -workspace App.xcworkspace -scheme App` for `id=<UDID>`, -allowProvisioningUpdates
  -allowProvisioningDeviceRegistration, CODE_SIGN_STYLE=Automatic, DEVELOPMENT_TEAM=team (L255-275). Team source
  (L171-184): `--team`, IOS_TEAM_ID, then `defaults read com.apple.dt.Xcode IDEProvisioningTeams`. Personal Team
  install expires after 7 days (README).
- Simulators: 5 iPhones. iPhone 17 Pro Booted. Sensor bar classes: 17 Pro and 17 class_04; 17 Pro Max and Air
  class_05; 17e class_03 (not verified whether a notch).

## C. Repo footprint
- 30 untracked files in app/ (12 root, 8 e2e, 3 scripts, 7 src), 464,827 bytes (package-lock.json 384,958).
- Ignored on disk: node_modules 326M, platforms 12M, www 4.0M, .angular 852K, public/legacy 1.2M. No build.json.
- Secrets: 0 key, cert or provisioning files. ios.mjs:272 is only the `DEVELOPMENT_TEAM=${team}` template;
  package-lock.json hits only the `@inquirer/password` package URL. No team ID literal.

## Unknown
- Whether `performance.now()` advances during screen lock or app suspension in WKWebView on device (start, lock 60 s,
  compare).
- Whether node-xcode's `updateBuildProperty` with no target also rewrites an added extension target's settings.
- Whether a Live Activity renders in the 26.5 simulator.
- Which simulator types have a Dynamic Island, from Apple documentation rather than inferred.
