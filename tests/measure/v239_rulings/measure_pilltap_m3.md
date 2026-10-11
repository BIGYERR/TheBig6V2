# V239 m3: the pill cannot be tapped. iOS takes every tap in the status bar strip (2026-10-10, 00:04 to 00:06)

The main session drove the iPhone 17 Pro simulator, build 1.0.239 as proved native GREEN (D233 plus D234 R1–R4, R6,
R7 and Amendments 1–2, web slices D–F). Measure cannot tap the simulator, so these probes are the main session's,
recorded verbatim. Taps went through the simulator control tool (HID-level touches); screenshots came from
`xcrun simctl io booted screenshot`.

- The pill renders as ruled: ink, x about 99–279, y 11–54, `0:00` muted on the left and the timer glyph on the right, with
  no edge tab. Screenshot: `m3_pill_idle_17pro_sim.png`. The status clock reading `00:04` ends a hairline before the
  pill's left end.
- Tapping the pill at (116, 32) and then (112, 50), with the page at scroll 0: the card does not open. A pixel sample under
  the pill at x 189, y 60–160 is page bone #F4F1E8 throughout.
- Discriminator: with the page scrolled down about 40 pt, a tap on the pill at (112, 32) **scrolls the page back to the top**.
  That is iOS's status bar scroll-to-top gesture, so iOS consumed the tap and the WebView never received it.
- Bounding the strip, with the page scrolled each time:
  - a tap at (60, 50) scrolls to top: swallowed;
  - a tap at (60, 58) leaves the page scrolled: delivered to the page.
  The swallowed strip ends between y 50 and 58 pt. It is consistent with a status bar frame of about 54 pt on this model
  (not printed from UIKit). The whole pill (y 11–54) lies inside it.
- Not tested: whether hiding the status bar (`prefersStatusBarHidden`) or setting `scrollView.scrollsToTop = false` on the
  WKWebView releases the strip to the page; whether the island cutout itself passes touches; whether a real device behaves
  as the simulator does.
Consequence: D234 R3 ("a tap on the pill opens the same #rtCard") cannot hold while the status bar is visible. The gate
row `D234-native-tap` passes in the VM because it dispatches a synthetic click and never meets iOS. Coach re-rules R3
(standing ruling 7).
