# GPS recording: the seams a recorder plugs into (measure, 2026-10-31, v0.254.0)

The before-picture for D267 P-GPSTEST (`docs/decisions/gps-recording.md`). Read on the tree at 7d9fc12.

## The app today
- **No location code.** 0 files in `frontends/app/src`, `frontends/app/plugins-src` or `core/src` mention
  `geolocation`, `CLLocation` or `watchPosition`.
- **Where a test screen can sit.** The iOS app's Bugs tab is the Angular `ia-bug-report` component
  (`frontends/app/src/app/legacy/legacy-host.ts:72`, `#screenBugs`). The page on Pages draws its own Bugs page from
  `frontends/app/src/legacy/src/html/screens-late.html`. A row added to the component reaches the iOS app only;
  `index.html` does not change.
- **The one native plugin.** `plugins-src/ia-island` (Swift, `IAIsland.swift`, 108 lines when read on Post-v0.249.1)
  draws the rest timer's Live Activity and, since D264, opens the share sheet for a file the page makes
  (`window.iaIsland.share(fileName, text, done, fail)`).
- **iOS targets.** The app target is iOS 13.0 (the widget extension 16.2; `hooks/add-widget-target.js`). Recording in
  the background needs `UIBackgroundModes` = `location` and a location usage string in Info.plist. Neither is a
  capability on the signing profile, so the TestFlight secrets do not change. A Live Activity for a run would add a
  widget to the RestTimerWidget extension.
- **Storage.** Every log lives in localStorage; one program's grid alone is 58,478 bytes (measured V202). One fix as a
  JSON line with the ten fields iOS reports is 127 bytes, so an hour at one fix a second is 457,200 bytes. Tracks go
  to files on the phone, not localStorage.
- **The repo is public** (GitHub reports `visibility: public`). A track shows where a run starts and ends.

## The watch (COROS, connected to Claude 2026-10-28, read only)
- Devices: a COROS Pace 4 and a COROS heart rate monitor.
- 10 runs between 2026-09-28 and 2026-10-28, each named after the program's session.
- Lap data for one run (2026-10-26, "Week 10 tempo", 36:24, 5.64 km): 16 laps, distance in centimetres and pace in
  seconds per km; auto-lap at 1 mile (160,934 cm). The workout laps match the NRC session "5K reps around a 10:00
  tempo": the six 2:00 reps ran 8:39, 8:35, 8:31, 8:44, 8:46 and 8:43 per mile, the 10:00 tempo 9:25 per mile
  (s/km × 1.609344).
- FIT files with GPS are readable (50 a day). The record rate of the Pace 4's FIT file is **not read yet**: downloading
  one waits on Mario's yes.
