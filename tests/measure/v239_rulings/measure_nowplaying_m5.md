# V239 m5: another app's Now Playing covers the pill (2026-10-11 12:32)

The main session drove the iPhone 17 Pro simulator, build 1.0.239 as proved native GREEN (pill arm active), recorded verbatim.
This measures D234 Amendment 3's named unmeasured risk. Mario: music plays "most sessions".
- Audio source: a local 120 s 220 Hz tone (`tone.wav`), served from the session scratch at http://127.0.0.1:8765 and played
  in the simulator's Safari (a tap on the audio control's play button).
- Then `xcrun simctl launch booted com.bigyerr.ironasylum` brought The Asylum to the front (week screen, pill arm).
- Screenshot `m5_app_with_music_17pro_sim.png`:
  - iOS draws its Now Playing compact island around the cutout (Safari's speaker glyph on the left, the waveform
    dots on the right), spanning about x 100–293 pt.
  - It sits above the page and covers the pill (x 99–279) entirely; only a hairline of the pill's left curve shows.
  - Our clock and glyph are not visible.
  - iOS also moved the status clock left and hid the cellular glyph.
- Taps on that region go to iOS's island (it expands Now Playing), never to the page. This was not tapped, to avoid
  driving Safari further. It is inferred from iOS behaviour, not measured.
Consequence (Amendment 3, "On-device acceptance"): "If it does, that refutes D234 as a whole, not this amendment: the
fallback is the tab arm (`hasIsland` false) and a fresh ruling." With music on most sessions, the in-app pill would be
hidden in Mario's normal use. The Live Activity (D233), shown when the app is not in front, coexists with Now Playing as iOS's
split island.
