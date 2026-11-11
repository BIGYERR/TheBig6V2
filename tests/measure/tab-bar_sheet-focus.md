# Tab bar: does a field keep focus when its sheet closes? (D285, measured 2026-11-11)

**Question.** D285 takes focus off a field when its sheet closes. What does WebKit do by itself?

**How.** `tests/measure/tab-bar_sheet-focus.html`: one sheet with the app's own sheet rules (`css/detail-sheet.css`,
`css/motion.css`: `display:block`, a 0.36 s slide, then `visibility:hidden`), one field in it, a fixed bar, and a readout
of `document.activeElement`, `visualViewport.height` and the order of events. Served from the Mac, opened in Safari on
the iOS 26.5 simulator (iPhone 17 Pro), the on-screen keyboard forced on. Each run: open the sheet, tap the field (the
keyboard rises, the visual viewport goes from 714 to 404), close, read the log three or more seconds later. One run
each. This is the simulator's Safari, not the app's web view on the phone (iOS 26.7.2), which D256 found it does not
match.

| Run | How the sheet closed | Event order read back | Field focused after | Keyboard after |
|---|---|---|---|---|
| 1 | a tap on a `<button>` in the sheet | `focusout`, `closed` | no (BODY) | closed (714) |
| 2 | the page removes `open` itself, 4 s after focus, no tap (`?auto`) | `closed-by-app`, `focusout` | no (BODY) | closed (714) |
| 3 | the page removes the focused field from the document, no tap (`?remove`) | `removed-by-app` | no (BODY) | closed (714) |
| 4 | run 3 with `blur()` first (`?after&remove`) | `focusout`, `blurred`, `removed-by-app` | no (BODY) | closed (714) |

**What it shows.**
- A tap on a button takes focus off the field before the click (run 1). D285 changes nothing there.
- A sheet the page closes without a tap keeps the field focused until the sheet turns hidden, then WebKit drops focus
  and `focusout` fires (run 2). D285 moves that to the moment the sheet closes, up to 0.36 s sooner.
- A focused field removed from the document fires no `focusout` at all (run 3). That is how the swipe deck closes (its
  cards leave the page 420 ms after Back). D256's focus trigger never runs there; only its viewport trigger is left.
  With D285's blur first, `focusout` fires (run 4), so both triggers run.
- In every run the keyboard closed and the bar sat at the bottom. The floating bar itself did not show, as in D256.
