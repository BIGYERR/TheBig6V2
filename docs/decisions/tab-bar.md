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
  bar stays at the bottom.
