# V239 measure m2: the floating rest timer and the top of the screen, before D234 (2026-10-09)

Measure, read-only, before-picture for D234 (Mario's redirect: our in-app timer moves into the island spot, native
app only; see the foot of `v239_ruling_d233.md`). Tree as it stood: ia-version 239 with D233's uncommitted web edits.
Probe: `tests/measure/v239_d234_png.py` (stdlib PNG reader). Screenshot: `m2_week_17pro_sim.png` (1206×2622 px, 3×,
week screen, 23:08). Oracle: pixel bounds and source text; no JS evaluated in the WebView.

## A. The floating timer
- DOM, L1193–1210: `#restFloat` > `#rtAnchor` > `#rtTab` (with `#rtChev`, `#rtMini`) and `#rtCard` (with `#rtNub`,
  `.rt-head`, `.rt-cap`, `.rt-collapse`, `.rt-readout` holding `#rtBig`/`#rtCs`, and `.rt-actions` holding
  `#rtToggle.rt-btn`, `.rt-reset`).
- CSS, L853–876:
  - `#restFloat`: fixed, top 0, height 0, max-width 430, z 240, pointer-events none.
  - `#rtAnchor`: absolute, top 200px, right 0, left/right transition .18s.
  - `#rtTab`: radius 14 0 0 14. `#rtCard`: 196 wide, relative, display none.
  - `#rtMini.run`: signal colour (L859). `.rt-btn.running`: L871.
  - Keyframes `rtCardIntro` (L874) and `rtPillSettle` (L875). Side styles are set inline by `_rtApplySide`.
- JS, L14016–14146. State: `_rtSide`, `_rtExpanded`, `_rtIntroTO`, `_rtInited`, `_rtDragging`, `_rtIntroPending` (L14016).
  Functions and callers (untruncated):
  - `_rtDismissIntro` L14040, called at 14082, 14083, 14084, 14116.
  - `_rtPlayIntro` L14042, called at 14143.
  - `_rtApplySide` L14059, called at 14115, 14130, 14142.
  - `_rtSetExpanded` L14074, called at 14044, 14045, 14052, 14081, 14082, 14130.
  - `rtExpand` L14081, called at 14116 (tab tap).
  - `rtCollapse` L14082, called at 1203 (the › button), 14083, 14084, 14117.
  - `rtToggleBtn` / `rtResetBtn`, L14083–84: the card's onclick handlers.
  - `_rtWireDrag` L14086, on the tab and the card (L14126). The drag clamps top to 8..innerHeight−h−8, and the side
    snaps to the nearer half.
  - `_rtInit` L14121, called at 14139.
  - `updateRestFloat` L14134, sole caller `showScreen` L1607.
  - `_rtIntroPending` set at L7653 (first program built).
  - `_ruIsland` L14020, called at 14033, 14034, 14036, 14038, and 18104 (init).
- Screens: shown when `activeProg` is set and `_curScreen` is `screenWeek`, `screenProgress` or `screenBugs` (L14136).
  Hidden on Home, Wizard and Generate. Overlays never call `showScreen`, so `_curScreen` stays `screenWeek` under
  them. That is why the tab shows over the day detail.
- Stacking:
  - Below it: `.overlay` z 200 (L283: `#detailOverlay` L1058, `#swapOverlay` L1084, `#addOverlay` L1095), `.top-bar` and
    `.wk-topbar` z 100, `.tabbar` z 150.
  - Above it: `.rand-overlay` z 300 (L490: rand, rest, change, goal, mile and mileLock sheets, L1132–1183), toast 999,
    `.ia-update-banner` 1000, pop 2000, pop-confetti 2001, rpe 2500, and an inline overlay at L7518 (999).
- Stored state: none. Side and expanded state live in memory only. `ia_rt_seen` / `ia_rt_intro2` are retired (comment at
  L7652 only).

## B. The top of the screen
- Viewport meta L5: `viewport-fit=cover`. L10: `apple-mobile-web-app-status-bar-style` `black-translucent` (a PWA
  meta; the WKWebView shows dark glyphs).
- `env(safe-area-inset-*)`: 10 uses.
  - Top inset: L56 `.top-bar`, L285 and L703 `.detail-header` (fallback 44px, sticky, z 10), L492 `.rand-header`, L607
    `.wk-topbar` (sticky, z 100), L508 the update banner (calc +10px).
  - Bottom inset: L46 `.tabbar`.
  - Nothing in `#restFloat` uses a safe-area inset.
- Top 60 pt of each screen: header padding in the page background. On the week screen the first header ink is at y 65 pt.
  The day detail paints `#161618` (near black) through the inset (L703).

## C. The native WebView's top edge
- No StatusBar plugin (the only plugin is ia-island). config.xml has no StatusBar or viewport preferences.
  ViewController and MainViewController are empty subclasses.
- The WebView is created at `self.view.bounds` (CDVViewController.m ~L667). The safe-area top constraint (L417) and the
  Never inset (L424) are inside `#if TARGET_OS_MACCATALYST`, so neither applies on iPhone. **The WebView runs under the
  status bar and the island.** In the screenshot, the page background #F4F1E8 reaches y 10 pt, with a shade from 0 to
  10 pt.
- The Angular host keeps the metas (`app/www/index.html` L7, L12). The legacy markup is in the same document, with no
  iframe (legacy-host.ts L30).
- `env(safe-area-inset-top)` is not printed; it is inferred to be about 62 pt (the `.wk-topbar` padding puts ink at 65 pt).
- iPhone 17 Pro simulator, week screen:
  - island cutout: x 138.3, y 14.0, w 125.3, h 36.7 pt (centred: (402−125.3)/2 = 138.3);
  - status clock: x 51.3–96.7, y 26.3–38.7;
  - Wi-Fi and battery: x 315–366.3, y 26.3–38.3; grey cellular dots at about x 288–306.
- The tab sits at its default anchor (top 200px): about y 400–493 at the right edge, collapsed, reading 0:00.

## D. Device facts
- Measured: iPhone 17 Pro simulator, 125.3×36.7 pt at y 14.
- Every other model (14 Pro to 17 Pro Max, Air): UNKNOWN. Apple publishes no cutout dimensions. Commonly quoted
  teardown figures (about 126×37 pt at y about 11–14; safe-area top 59 pt on 14/15 Pro, 62 pt on 16/17 Pro) are
  unsourced.
- Island vs notch by top inset (notch 44–50 pt, island 59–62+ pt) is a heuristic. Apple does not guarantee it, and it
  fails in landscape, with zoomed display, and on future models.
- `IAIsland.swift` reports no model or safe-area data today. The native side could report `utsname` or
  `safeAreaInsets`; that is unbuilt.

## Unknown
- The live `env(safe-area-inset-top)` in the WKWebView.
- A day-detail screenshot.
- The cutout on any device but the 17 Pro simulator.
- Whether the 0–10 pt shade comes from the simulator or from iOS.
- Whether a pill at the island's coordinates lines up on real hardware.
