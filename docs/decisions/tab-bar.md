# Tab bar: decisions

The bottom tab bar (`nav.tabbar`, `frontends/app/src/legacy/src/css/shell.css`), shown and marked by `updateTabBar`
(`rest-day-shell.ts`), position fixed at the bottom of the viewport on the single-file page and in the iOS app. Tests:
`tests/unit/tab-bar.test.ts`.

## D256: P-KEYBOARDRESYNC, the page resyncs when the on-screen keyboard closes (v0.249.1)

- **Date:** reported 2026-10-26, ruled 2026-10-27. **Ruled by:** the main session (a defect), Mario ("go ahead and
  push tab bar fix"). **Bump:** PATCH, v0.249.1 (Mario). **Shipped:** v0.249.1.
- **The report (Mario, two Progress screenshots, the native app on iOS 26.7.2):** "when i go to the progress screen it
  drags the bottom bar in the middle of the screen", then "its whenever i click on the progress page and scroll up the
  bottom tab just floats up with it". A force-quit and reopen, straight to Progress with nothing typed, does not do it.
  Reduce Motion is off.
- **The finding:** in both screenshots the sticky top bar and the fixed tab bar sit shifted by the same distance, about
  300 points in the first, which is the on-screen keyboard's height. That is iOS 26's WebKit bug: once the on-screen
  keyboard closes, the layout viewport fixed elements hang from stays stale, and they drift when the page scrolls up
  (WebKit bug 297779; Apple developer forum thread 800125, Safari and WKWebView, still open on 26.7.2). No rule in the
  app's CSS or code moves the bar: desktop Chrome keeps it fixed. Not reproduced here: the iOS 26.5 simulator kept the
  bar in place in Safari and in the native app, but it ran with the hardware keyboard, so the on-screen keyboard never
  opened, and its program had too few logs for Progress to scroll.
- **What changes:** when the on-screen keyboard closes (the visual viewport grows back by more than 100 points), and
  when focus leaves a field without landing on another, the page scrolls one point (up, or down at the very top) and,
  a frame later, back, the workaround reported for this bug: a real scroll makes WebKit recompute where fixed elements
  belong. The step back waits a frame because two scrolls in one task net to nothing and the browser may drop them: in
  desktop Chrome the same-task pair fired zero or one scroll event, the frame-split pair two, landing back on the
  same pixel. One function, `installKeyboardResync`,
  installed at load, on the page and in the iOS app (which runs the same script).
- **What deliberately does not change:** the layout (the bar stays position fixed), every screen's scrolling, and the
  scroll position, which ends where it started. The durable alternative, an app shell in which the document never
  scrolls and the bar is a flex child of a full height page, is held: it moves every screen's scrolling and cannot be
  proved here. It comes back if this fix does not hold on Mario's phone.
- **Expected values (typed from the ruling):** a viewport that grows from 500 to 800 points at y=640 scrolls to 639, then
  back to 640 a frame later; at y=0 to 1, then back to 0; one that shrinks (the keyboard opening) or grows by 100 or less does not scroll; focus leaving a field for the
  page scrolls, focus moving to another field does not; no visual viewport (an old browser) leaves the focus path alone.
- **Tests:** `tests/unit/tab-bar.test.ts`, the function lifted out of the page with a hand-built window.
- **Proof that only the phone can give:** Mario types a load, closes the keyboard, opens Progress and scrolls up; the
  bar stays at the bottom. **Confirmed 2026-10-27** on v0.249.1, installed by `npm run device-ios`: "Tested on the
  phone: the tab bar stays at the bottom on Progress after typing." The app shell stays held, not needed.

## D266: P-LIQUIDTAB, the tab highlight glides like liquid and can be dragged, and every press shows (v0.254.0)

- **Date:** asked and ruled 2026-10-31. **Ruled by:** the main session (design), Mario's concurrence after trying the
  prototype on his phone ("Yep fluid is great!"). **Bump:** MINOR, v0.254.0 (Mario). **Shipped:** v0.254.0.
- **The ask (Mario):** "the clicks and stuff feel too fast you know, and the bottom bar like when you click the other
  buttons for the "highlight" bubble to move like liquid over to the one that got selected, or be able to grab it and
  just drag it back and forth all fluid like".
- **The measure (read 2026-10-31 on v0.252.0, unchanged at v0.253.1):**
  - The highlight is the active button's own background (`.tabbar button.active{background:var(--nav-on)}`,
    `css/look.css`), set by `updateTabBar`, so it jumps to the new tab at once. Only the tab's colour fades (0.15 s,
    `css/shell.css`). The bar takes no drag.
  - The page holds 38 press selectors (`:active`): 21 scale the control down, 16 tint it, one is the rest timer's grab
    cursor. There is no touch
    listener anywhere in `frontends/app/src` or `core/src` (0 hits for `touchstart`). WebKit shows `:active` on a touch
    only where a touch listener exists, and the grey tap flash is off (`css/base.css`,
    `-webkit-tap-highlight-color:transparent`), so on the phone a tap shows nothing until its result lands. The 21
    scaling presses also snap: none has a transition on transform except `.log-nudge-btn` and `.pop-act` (0.08 s).
  - Screens already rise in over 0.30 s and sheets slide over 0.36 to 0.40 s (`css/motion.css`).
- **The preview:** `docs/design/tab-feel.html`, the prototype published as an artifact, with a Before and After switch
  and three feels (Quick, Fluid, Heavy). Mario chose **Fluid**.
- **What changes:**
  1. **One pill glides.** The highlight becomes one element in the bar, behind the buttons, that springs from tab to
     tab. Its two edges are separate springs (unit mass, stiffness and damping): the edge on the side it travels
     toward leads at 260 and 23, the other trails at 140 and 21, so the pill stretches toward the new tab and its tail
     catches up. While it stretches it thins: its height scales by 1/√(width ÷ tab width), held between 0.84 and 1.04.
     Each tab's colour is signal by its share of the pill, the overlap over three quarters of the tab's width, capped
     at 1, so the colour passes from tab to tab with the pill.
  2. **The bar can be dragged.** A finger that moves more than 8 px along the bar grabs the pill: it follows the
     finger on springs 2.6 times stiffer (damping scaled to keep the same ratio), 8% taller while held, and past the
     first or last tab's centre it rubber bands, 26·(1 − e^(−d/90)) px for a finger d px past it, never more than 26 px.
     On release it opens the tab nearest the finger's position plus 0.12 s of its velocity (measured over the last
     80 ms), held within the end tabs, by clicking that tab's button: the same path a tap takes. The pill then aims at
     whichever tab is active, so a tab that refuses (This Week or Progress with no active program) sends it back. The
     tap the drag ends in opens nothing itself: a real click on the bar within 400 ms after a drag is swallowed. The bar
     takes no browser gesture (`touch-action:none`, was `manipulation`), so a slide along it is the pill's; a vertical
     swipe that starts on the bar no longer scrolls the page under it, as on a native tab bar.
  3. **Every press shows.** One touch listener on the document, passive and empty, so WebKit applies the 38 press
     styles on the phone. The 21 scaling presses sink over 100 ms (cubic-bezier(.2,0,.2,1)) and spring back over
     340 ms (cubic-bezier(.34,1.56,.64,1)); a tab's icon sinks to 0.84 the same way. The tinting presses show at their
     own timing, unchanged.
  4. **Reduce Motion** on the phone: the pill moves to its tab without the glide, and follows the finger without it.
  5. A bar that was hidden (a screen without it) comes back with the pill already on its tab, never gliding from where
     it was.
- **What deliberately does not change:** the four tabs, their order and what each opens (`tabGo`); the bar's look (D263:
  the floating pill, its blur, the signal tint); screen and sheet timings; the tinting presses' timing. The prototype
  held a press for at least 100 ms so a very quick tap still sinks; the build uses WebKit's own press state, released
  when the finger lifts, so a tap shorter than 100 ms sinks part way (at 50 ms about four fifths, by the sink curve).
  No haptics: the page cannot reach them, and the native app would need a plugin change.
- **Where:** `installTabGlide` and `installPressFeel` in `rest-day-shell.ts`, beside `updateTabBar`, which aims the pill
  each time it marks a tab, so the single-file page and the iOS app (whose tab buttons are Angular's, inside the same
  `#tabBar`) both get it. The pill's and the presses' CSS in `css/look.css` and `css/motion.css`.
- **Expected values (typed from the ruling, on a test bar of four 90 px tabs whose left edges sit 6, 96, 186 and 276 px
  into the bar):** the pill opens on the active tab, 90 px wide at 96 px; aimed one tab right it is wider than 108 px
  (1.2 tabs) at some frame, its leading edge never more than 4 px past its target, and it rests at 186 px, 90 px wide,
  within 0.6 s, the new tab's colour share 1 and the old one's 0; with Reduce Motion it is there at once, no frame
  asked. A finger moved 5 px grabs nothing; past 8 px the bar marks itself dragging; held 200 px past the last tab's
  centre (321 px) the pill's centre rests 23.2 px past it. A release with no velocity opens the tab under the finger;
  one at 1250 px/s from the third tab's centre opens the fourth. A real click right after a drag is stopped; one after a
  plain tap is not. The press listener is a passive `touchstart` on the document.
- **Tests:** `tests/unit/tab-bar.test.ts`, both installers lifted out of the page and run on a hand-built window.
- **Proof only the phone can give:** Mario taps across the tabs and drags the pill, and taps buttons on This Week, on
  the release in TestFlight.
- **Built (v0.254.0):** the pill is appended to the bar and kept under the buttons by `z-index` (the buttons are
  `position:relative`), in the single-file page and inside the iOS app's Angular tab bar alike. Checked in the dev
  container's page (`localhost:3000/app/`, a 375 px viewport): a tap from This Week to Progress stretched the pill to
  1.28 tabs and it came to rest on Progress; a drag from This Week to Bugs marked the bar dragging, held the pill lifted
  under the finger and opened Bugs on release. WebKit's press state and the feel under a finger wait for the phone.

## D280: P-ONERESYNC, one keyboard resync at a time (amends D256)

- **Date:** found and ruled 2026-11-08. **Ruled by:** the main session (a defect in D256's workaround, no doctrine),
  Mario ("yes fix it here"). **Bump:** PATCH, v0.259.2 (Mario), after the week-snap chat's v0.259.1, which landed on
  `dev` while this was ruled; re-read against it, the ruling stands (v0.259.1 does not touch the resync).
  **Shipped:** not yet.
- **The finding:** the Docker e2e's `log-session/log-progress` failed parity at 1.562% (20,920 px) with one build's
  Progress page scrolled one CSS pixel down and resting there, after the runner had already waited out each focus
  change's resync (Post-v0.259.0 tests pass). `installKeyboardResync` reads the page's y when its timer fires, nudges a
  point, and steps back to that y a frame later. Two resyncs whose timers fire before the same frame (two focus changes
  whose 350 ms timers are held behind one long task, such as the Progress render; or the keyboard closing and focus
  leaving together) overlap: the second reads the first's nudged y as home, and its step back lands there. The page
  then rests a point off where the athlete left it, for good. Measured in Chrome with the resync lifted from the
  v0.259.0 page (`tests/measure/keyboard-resync_latch.ts`, saved `.out.txt`): two focus changes 200 ms apart rest at
  0 in 5 of 5; held behind one 300 ms task, at 1 in 5 of 5; in one task, at 1 in 5 of 5; 5 ms apart, at 0 in 5 of 5.
  One function holds the behaviour, installed once on the window; the iOS app runs the same script. Nothing else
  nudges the window's scroll.
- **What changes:** a resync that comes due while another is in flight (its nudge made, its step back waiting for the
  frame) is skipped. The one in flight already makes the real scroll WebKit needs to recompute fixed elements, and it
  steps back to where the page rested. Once its step back has run, the next resync runs as before.
- **What deliberately does not change:** the two triggers (the visual viewport growing back by more than 100 points;
  focus leaving a field for the page), their delays (60 ms and 350 ms), the one point nudge and its direction (up, or
  down at the very top), the step back a frame later, and every call a single resync makes. The layout, the bar and
  every screen's scrolling stay as D256 left them.
- **Expected values (typed from the ruling):** at y=640, two resyncs before one frame call scrollTo (0, 639) then
  (0, 640) and the page rests at 640 (today: (0, 639), (0, 638), (0, 640), (0, 639), resting at 639). At y=0: (0, 1)
  then (0, 0), resting at 0 (today: resting at 1). Two resyncs with a frame between them both run: (0, 639), (0, 640),
  (0, 639), (0, 640). The keyboard closing and focus leaving before one frame: one resync, (0, 639), (0, 640). In
  Chrome, the measure's four cases all rest at 0. The e2e's `log-session/log-progress` at 0% in three runs in a row.
- **Tests:** `tests/unit/tab-bar.test.ts`, the function lifted out of the page on a window whose scrollTo moves the page,
  with its timers and its animation frames run apart.
- **Proof that only the phone can give:** none new. A single resync is unchanged, so D256's check (type a load, close
  the keyboard, open Progress, scroll up: the bar stays at the bottom) stands; Mario may repeat it on the build.
