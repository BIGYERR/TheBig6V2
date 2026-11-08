# Swipe back: decisions

The iOS edge swipe in the app: a finger from the left edge of the screen, dragged right, goes back a page. The app's
pages are layers drawn over This Week, not pages the web view navigated to, so the web view's own back swipe has nothing
to go back to; the app does it itself. Tests: `frontends/app/test/unit/swipe-back.test.ts`.

## D277 P-SWIPEBACK: a swipe from the left edge goes back, as on iOS (Mario, 2026-11-08)

- **Date:** 2026-11-08, Post-v0.257.0. **Ruled by:** Mario, after clicking through the This Week mockup (D276):
  "looks right! one last thing is can we add the swipe to go back feature native in iOS you konw where you swipe to the
  right on the left side of the screen to go back a page". **Bump:** inside v0.258.0's MINOR (Mario picked MINOR for
  the build it joins; a new capability, no program output moves). **Shipped:** v0.258.0 (2026-11-08), with D276.
- **What changes (the iOS app's Angular screens, and the page the iOS app hosts; the page Pages serves is unchanged):**
  1. **Where it works:** on every full-screen page that has a Back: the session sheet, the swap sheet and the add
     sheet, Random Workout, the rest day sheet, Traveling?, the goal sheet, the mile sheet and its lock, the swipe deck
     and the run recorder. The top one goes back; a page under another waits its turn.
  2. **What it does is that page's Back.** The swipe ends by pressing the page's own Back, so it closes, saves and
     cleans up exactly as a tap does (the session sheet's Back flushes its wheels; the recorder's Back on a finished run
     returns to its start, and the page slides back in, as Back keeps it open).
  3. **How it feels (iOS's numbers):** it starts within 24 px of the left edge; it takes the touch once the finger has
     moved 10 px more sideways than up or down (a page scroll keeps the touch otherwise); the page follows the finger
     one to one with a shadow on its left edge; let go past half the screen's width, or flick right faster than 0.3 px
     a millisecond, and it goes back; a flick left, or a short drag, slides it home. Both settle over 280 ms,
     `cubic-bezier(.2,.8,.2,1)`; with Reduce Motion it follows the finger and settles at once.
  4. **Where it does not:** the tab screens (This Week, Progress, Bugs, Programs), which have no Back; pop-ups and the
     RPE card, which have none; the new program wizard, whose steps change in place with no page under them to show;
     and a touch that starts on the rest timer docked at the left edge (D235), which keeps its drag.
- **Does not change:** what any program prescribes; any page's Back; the deck's own sideways swipe between cards, which
  starts inside the card, past the edge.

## D277 as built (v0.258.0, 2026-11-08)

- **Where:** `frontends/app/src/app/screens/frames/swipe-back-model.ts` (the numbers and the rules) and `swipe-back.ts`
  (the gesture, installed once by the legacy host on the document's capture phase, touch on the phone and a mouse drag
  in a browser).
- **Decisions the build made:** the top page is the open one highest on screen (its z-index, then its place in the
  page), and a pop-up or the RPE card on top, or a sheet open inside the deck, stops the swipe; the release speed is the
  finger's last two samples, so a finger held still before it lets go is no flick; once a swipe has the touch, the click
  it would leave behind is swallowed, never the page's own Back press.
- **Seen, not tested on the phone:** in the browser pane at 375 px, a held short drag slides home, a long one closes the
  session sheet and the deck back onto This Week with the week kept. The feel on the phone (WebKit touch, the page's own
  scroll beside the edge) is for TestFlight.
- **Tests:** `frontends/app/test/unit/swipe-back.test.ts` (the edge, the lock, the release, the speed, the top page);
  it fails on v0.257.0, where none of it exists.
