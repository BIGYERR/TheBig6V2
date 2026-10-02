# V227 measure — D190 unknowns U1 (hop3 revisit residue) and U2 (exSwapPrefs build path)

Saved verbatim from measure's return by the main session. Scripts `tests/measure/v227_d190_unknowns.js`, `v227_d190_unknowns_ref.js`; output `tests/measure/v227_d190_unknowns.out.txt`. Scratch raw: `u1res_*.json`, `u2_moved_cards.txt` under `.../scratchpad/measure2/`. index.html and every gate untouched.

**Headline.** U1 is handoff V222 note (5)(D): `recordSwap`'s same-from filter drops the donor's first record when a chain revisits it. That leaves 1,257 three-swap rows where live ≠ boot on both trees. D190 creates 0 of them and heals 580 other rows. U2: on the exSwapPrefs build, the cue was hiding cards from the grammar sweep. D190 moves 390 cards, and every one that can be compared (212 of 218) now matches what the uninjured build prints for the same pref.

## U1 — the hop3 residue (A > B > A > C)

Mechanism (line numbers are V226):

| site | file:line | what it does |
|---|---|---|
| `recordSwap` same-from filter | index.html:10282 `const list=(s[k]\|\|[]).filter(e=>e&&e.from!==from);` | The A→C tap deletes the earlier A→B record. The store becomes `[{B→A},{A→C}]`. |
| `applySessionSwaps` | :10301 → `applySwapPrefs` :10155 → `_swapDetailFor` :10119 | Boot replays B→A first, a no-op because B is no longer on the card. Then A→C runs from the **grid dose**. |
| `applySwapChoice` | :14290 (D190: :14293) | Live carries whatever B left on the card. B's bodyweight-sets form, or B's window reps, rides back through A into C. |

Stored records (identical on V226 and D190):
- knee_protect#1946 W3 thu, Cable pull-through > 45° back ext > Cable pull-through > SL hip thrust: stored `[{"from":"45° back extension","to":"Cable pull-through"},{"from":"Cable pull-through","to":"Single-leg hip thrust"}]`; live `4 sets — RPE 7 (leave 3 or more in reserve)`; boot `4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up…`.
- lowback#1209 W3 tue, DB curl > Inverted rows (rings) > DB curl > Incline DB curl: stored `[{"from":"Inverted rows (rings)","to":"Dumbbell curl"},{"from":"Dumbbell curl","to":"Incline dumbbell curl"}]`; live `3 sets — RPE 7 (leave 3 or more in reserve)`; boot `3×10–12 @ RPE 7`.
- Neither stored list contains the donor's first record.
- No unloadable middle: mario W3 mon, Close-grip bench > Landmine rotational press > Close-grip bench > Barbell bench. Live `4×6–10 — RPE 7…`, boot `4×5 — RPE 7…` (the handoff note's own box→goblet→box→leg press shape).

Population, every three-swap chain enumerated: mario knee/wa, lowback/wa, elbow/wa, W3 and W5. 269,588 chains per tree, all reachable.

| | V226 | D190 |
|---|---|---|
| residue (slot or whole day, live ≠ boot) | 1,837 / 269,588 | 1,257 / 269,588 |
| A>B>A>x (revisits the donor) | 1,257 / 17,463 | 1,257 / 17,463 |
| A>B>C>x | 580 / 237,462 | 0 / 237,462 |
| cyc3 | 0 / 14,663 | 0 / 14,663 |
| (a) cue anywhere in the chain | 788 | 208 |
| (b) no cue anywhere | 1,049 | 1,049 |
| residue rows whose store lost the A→B record | 1,257 of 1,257 revisit rows (the 580 A>B>C>x rows keep all 3 records) | 1,257 / 1,257 |
| mario W3 / W5 / lowback W3 / W5 / elbow W3 / W5 | 178/49,650, 830/52,215, 158/34,071, 201/33,404, 185/48,376, 285/51,872 | 176, 252, 158, 201, 185, 285 |

- V226 → D190: residue on both trees 1,257; healed 580 (all mario, class (a), the boot-cue rows on 3-swap chains); created 0.
- D190 residue by kind (1,257 rows, all revisit shape):

| B (the middle swap) | class | rows | live → boot |
|---|---|---|---|
| unloadable | (b) no cue | 883 | bodyweight-sets form → grid dose |
| loaded, window reps carried back | (b) no cue | 166 | loaded → grid dose |
| unloadable, donor cued | (a) cue | 208 | bodyweight-sets form → cued boot 127, other boot 81 |

- The collapse is necessary but not sufficient: 14,832 of 16,206 revisit chains that boot correctly also lost the A→B record. It only shows when B changed the dose.
- This is the handoff's V222 note (5)(D), `IRON_ASYLUM_HANDOFF_1_1.md`:1369: "(5) **(D)** `recordSwap`'s same-`from` filter collapses a chain that revisits its donor (box→goblet→box→leg press boots `4×5–8` against a live `4×8–12`); unmeasured, detail only." Related, note (3) on the same line: "(3) **Live path (B):** a rep target lost through an unloadable middle hop is never regained on a loadable end (1,117 of 16,341 chains end on "N sets"); D177's `rx` already holds the slot's original detail by position."

## U2 — the exSwapPrefs build path

| | file:line |
|---|---|
| `accessoryGrammarSweep` | index.html:6781 |
| predicate | :6793 `const m=/^(\d+)×(\d+)(–\d+)?( each)?$/.exec(it.detail\|\|'');` anchored at `$`, so any suffix (the cue) fails the match. Not a `!/RPE/` guard. Name exemptions `_BW_KEEP_FIXED` (:6753) and `_GRAMMAR_BALLISTIC`. |
| build order | native `applyInjuryFilter` :10903 (cue written) → exSwapPrefs block :10937 (`applySwapPrefs`, then `applyInjuryFilter` on a hit) → `unloadableRxSweep` + `accessoryGrammarSweep` :10963, which runs LAST |

Direct call, same output on both trees: `"2×10 each"` → `"2×8–12 each @ RPE 7"`; `"2×10 each — hold RPE 7, two in the tank"` → unchanged. So on V226 the carried cue stops the grammar sweep, and V226 prints `2×10 each — hold RPE 7, two in the tank` on an uncapped hinge.

Population (one pref per natively cued source to every sheet candidate):

| config | cued sources | prefs | builds moved | cards moved / target cards | kinds |
|---|---|---|---|---|---|
| mario knee/wa | 2 | 12 | 9/12 | 28/52 | ii+g 28 |
| lowback/wa | 4 | 40 | 31/40 | 92/168 | ii+g 54, iii 38 |
| hip/wa | 6 | 47 | 22/47 | 52/156 | ii+g 36, iii 16 |
| elbow/wa | 12 | 106 | 47/106 | 112/504 | ii+g 30, iii 82 |
| shoulder/wa | 8 | 63 | 29/63 | 106/406 | ii+g 44, iii 62 |
| **total** | 32 | 268 | 138/268 | 390/1,286 | ii+g 192, iii 198 |

- ii+g: cue drops and the grammar sweep rewrites the dose (`2×10 each — hold…` → `2×8–12 each @ RPE 6–7 / 7 / 8`, per the sweep's week and beginner table). iii: `N sets — RPE 7 (leave 3 or more in reserve)` → `N sets — RPE 8 (stop 2 reps short of failure)`. No card other than the target moved. Moved cards span weeks 1, 2, 4, 5, 6 and others.

Independent reference: what the uninjured build (V226) prints in the same slot with the same pref (never meets a cue).

| | cards |
|---|---|
| D190 == uninjured + same pref | 212 |
| V226 == uninjured + same pref | 0 |
| neither | 6 (lowback iii 2, shoulder iii 4) |
| no reference (slot not on the uninjured card; all 28 mario rows) | 172 |

Example: shoulder {DB incline press → Cable pushdown} W1 mon. V226 `3×10 — hold RPE 7, two in the tank`; D190 `3×8–12 @ RPE 6–7`; uninjured with the pref `3×8–12 @ RPE 6–7`. Native-print-of-target reference empty (0/192).

HALF_MANNY: `fixtures.HALF_MANNY.exSwapPrefs` is null; digest unmoved (0ac7da6b1691a8e1).

Writers of exSwapPrefs: one path, the swap nudge; the wizard never writes it. `acceptSwapNudge` :14469 writes :14475–14476; reached from the button at :1100 ("Make the change") via `showSwapNudge` :14455 via `applySwapChoice` :14307 `if(nudge)` via `bumpSwapCount` :10330. Fires on the 3rd identical from→to swap (`SWAP_NUDGE_AT=3`).

## UNKNOWN
U1 covered mario, lowback, elbow W3/W5 only (not hip, shoulder, ankle, knee/protect, manny, 4+ swaps). Whether the nudge ever fires on a natively cued source in real use. The 6 "neither" U2 cards not inspected. The 127 vs 81 cued-boot split inside class (a) not segmented.
