# Parked: D234 P-ISLANDPILL (V239)

## What it was
Inside the native app, on a phone whose island the plugin confirms (`window.iaIsland.hasIsland === true`, read once in
`_rtInit`), the floating rest tab became an ink pill drawn around the Dynamic Island cutout. The clock sat in the
leading tail and the timer or pause glyph in the trailing cap. The card hung beneath the pill, a tap toggled it, there
was no drag, and the first-program intro dropped the card out of the pill. The PWA and native phones without an island
kept the V238 tab. Ruling: `tests/measure/v239_rulings/v239_ruling_d234.md` (R1 to R7, Amendments 1 to 3).

## Why it is parked
`tests/measure/v239_rulings/measure_nowplaying_m5.md`: with another app's audio playing, iOS draws its Now Playing island
around the cutout (about x 100 to 293 pt). It sits above the page, so it covers the pill (x 99 to 279) entirely, and taps
there go to iOS. Mario plays music most sessions. Amendment 3 named this case as refuting D234 as a whole. Mario chose
"Pull it, park it": see "D234 is PARKED" at the foot of the ruling file. V239 ships D233 only: the Live Activity outside
the app and the V238 tab inside it. index.html went back to the tree gatekeeper's first draft proved green
(sha256 5b26f5cf...).

## What is here
- `v239_d234_sliceD.py`, `v239_d234_sliceE.py` and `v239_d234_sliceF.py` are the edit scripts, in order:
  - D: the pill CSS, the `timer` icon, the arm decision in `_rtInit`, and the pill render in `_ruRender`;
  - E: the card hang and keyframes, the tap toggle, `_rtPlayPillIntro`, and the `updateRestFloat` dispatch;
  - F: the card-body tap during the intro.
  Each takes a pre-slice source html as its argument and writes index.html.
- `g239_d234_pill.js` is the gate: 9 rows, 9/9 on the V239 pill tree.
- `v239_d234.json` is the sabotage spec: 18 mutations, all tripped.
- `mkspec_v239_d234.py` is the spec's generator. It writes to `tests/sabotage/`, so do not run it from here unless you
  are resuming.
- `smokeD.js` and `smokeE.js` are builder's scratch smoke checks. Their paths are hard-coded.
- `d234_row_ruled_parked.txt` is the licence file with the D234 rows, as it stood before the revert.
- The native N3 patch (the `hasIsland` info action and the model list) is added here by the native builder.

## How to resume (only under a new ruling)
1. Save a pre-slice copy of the then-current index.html.
2. Run D against it, then save that output and run E against it, then save that output and run F against it. Each
   script asserts every anchor count==1 and aborts with nothing written on a miss. Re-anchor whatever has drifted, keeping
   each hunk's meaning.
3. Move the gate back to `tests/gates/` and the spec back to `tests/sabotage/`, restore the licence rows, then run the
   gate and a trip run of the spec on that tree.

## Inert by construction
Nothing in this folder runs in `gate.sh` or in any tool. `gate.sh` globs `tests/gates/*.js`. `sabotage.py` globs
`tests/sabotage/*.json`. `chain.js`, `version_scope.js` and `era_bump.py` list `tests/gates` one level deep. `rows.js`
reads gate outputs only. The one recursive walk, X1 in `tooling_selftest.sh`, records file paths to prove the self-test
wrote nothing. It never reads or runs them.
