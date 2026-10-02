# V227 measure — the A>B>C>B undo defect found while writing g227_d190_seam row (d)

Saved verbatim from measure's return by the main session. Script `tests/measure/v227_d190_undo.js` (+ `_post.js`), output `tests/measure/v227_d190_undo.out.txt`. Found by builder (slice 6): 28 of 72 sampled hop3 A>B>C>B chains undo to A instead of C; row (d) "swap then undo byte-identical on the whole day on every injured chain" was narrowed by builder to hop1/hop2/cyc2 and is PARKED (standing ruling 7) pending a coach re-ruling.

MODE A (prove). Measured on V226 and on the V227 working tree.

**Headline.** Builder's account holds, and it is not D191's defect. Undo goes wrong on **28,246 of 28,246** strict A>B>C>B chains (every one), on all 5 configs, uninjured ones included. D190 heals 0 and creates 0. The cause is `swapOriginOf`'s first-match chip lookup. A counterfactual taking the most recent match fixes 28,246 + 1,112 rows and breaks 0.

METHOD: trees `u_v226.html` (= base_v226), `u_v227.html` (= working index.html at 227), `u_cf.html` (V227 with `swapOriginOf` taking the LAST matching record, `.filter(...).pop()`, anchor count 1). Population: hop3, every 3-tap chain on one slot, targets from the sheet's own candidate list; mario knee/wa, lowback/wa, elbow/wa, HALF_MANNY, mario_noinj, W3 and W5: **462,622 chains per tree**, all reachable. hop4: seeded sample 2,000 per config, 10,000 total. CF: every revisit-shaped hop3 chain plus every 20th other (102,549). Act: fresh page per batch; taps through `applySwapChoice`; then `chip = swapOriginOf(current name)` and `undoSwap(chip)` (what the card chip calls). Oracle: the slot and the whole day (clock fields stripped) as the live page showed them before the last tap.

## Q1 — mechanism (V227 lines; same code on V226)

| site | file:line |
|---|---|
| `swapOriginOf` | index.html:14176 |
| chip lookup | :14179 `const hit=list.filter(e=>e&&e.to===name)[0];` takes the **first** record whose `to` is the current name |
| card chip render | :12825 `_swappedFrom=…swapOriginOf(i.name)` |
| `undoSwap` | :14436 |
| undo lookup | :14441, first record with `from===chip` |
| rename back | :14443 `back[hit.to]=from` |
| clear | :14460 `clearSwap(from)` |
| `recordSwap` same-from filter (D191) | :10286 |

Hand trace on A>B>C>B: store `[A→B, B→C, C→B]`, all kept. The chip on B finds A→B first and offers A. `undoSwap(A)` renames B back to **A** where C was expected; the last match would offer C.

| row | store before undo | chip | slot before the last tap | after undo | store after | chip after |
|---|---|---|---|---|---|---|
| mario W3 tue Main: Trap bar DL > RDL > Deadlift > RDL | `[TBDL→RDL, RDL→DL, DL→RDL]` | Trap bar deadlift | Deadlift `4×5 — RPE 7…` | **Trap bar deadlift** `4×5 — RPE 7…` | `[RDL→DL, DL→RDL]` | none |
| lowback W3 tue: Neutral-grip chinups > Chinups > Lat pulldown > Chinups | `[NG→Chinups, Chinups→LPD, LPD→Chinups]` | Neutral-grip chinups | Lat pulldown `4×5…` | **Neutral-grip chinups** `4×5…` | `[Chinups→LPD, LPD→Chinups]` | none |

On CF both rows return to Deadlift and Lat pulldown (correct).

## Q2 — hop3, full enumeration (undo wrong, slot = whole day, both trees)

| config | A>B>C>B | A>B>A>B | A>B>A>x | A>B>C>A | other |
|---|---|---|---|---|---|
| mario knee/wa | **5,962/5,962** | 0/474 | 0/5,804 | 0/5,344 | 0/84,281 |
| lowback/wa | **4,608/4,608** | 0/421 | 0/4,422 | 0/4,093 | 0/53,931 |
| elbow/wa | **6,032/6,032** | 0/479 | 0/5,863 | 0/5,226 | 0/82,648 |
| HALF_MANNY | **5,454/5,454** | 0/468 | 0/5,499 | 0/4,991 | 0/71,727 |
| mario_noinj | **6,190/6,190** | 0/502 | 0/6,061 | 0/5,545 | 0/86,597 |
| **total** | **28,246/28,246** | 0/2,344 | 0/27,649 | 0/25,199 | 0/379,184 |

- Overall 28,246 / 462,622 on V226 and V227, identical rows. V227: created 0, healed 0 (slot and day). Injury-blind (HALF_MANNY 5,454, mario_noinj 6,190). No chip missing: 0 of 462,622.

## Q3 — hop4 sample (10,000; V226 = V227 = 1,112 wrong; CF 0)

| shape | wrong (n) |
|---|---|
| A>B>C>D>B | 494 (494) |
| A>B>C>D>C | 528 (528) |
| A>B>C>A>C | 52 (52) |
| A>B>A>C>A | 38 (38) |
| other 11 shapes | 0 |

- By config: elbow 239, lowback 227, manny 228, mario 221, noinj 197.
- One rule: **the last target equals an earlier target other than the latest one**. The chip resolves to that name's first donor. Undo lands on the chip 1,112/1,112, on the original donor 494. 90 of the 1,112 also had a collapsed store (A>B>A>C>A, A>B>C>A>C); the last-match key still fixes them.
- Example (mario W3 mon, A>B>C>D>C): Side plank > Dead bugs > Ab wheel > Windshield wipers > Ab wheel. Undo gives **Dead bugs** where Windshield wipers was expected; the chip afterwards offers Side plank.

## Q4 — overlap with D191 (A>B>A>x, the same-from collapse)

| | A>B>C>B (this defect) | A>B>A>x (D191) |
|---|---|---|
| store collapsed by :10286 | 0 / 28,246 (one record per hop) | 27,649 / 27,649 |
| undo wrong | 28,246 / 28,246 | 0 / 27,649 |
| boot ≠ live (U1) | not measured here | 1,257 (U1) |

- Separate causes. The wrong rows already keep one record per hop, so a one-record-per-hop store does not fix them. The undo key does: CF (most recent `to` match) fixes 28,246/28,246 hop3 and 1,112/1,112 hop4, creates 0, leaves 0 wrong on any shape (102,549 + 10,000 chains).
- Shared store, opposite key errors: D191 drops records by `from` on write; this picks the oldest record by `to` on read.

## Q5 — what the athlete sees (V227, mario W3 tue, slot [0][0] "Main — Trap bar deadlift")

| step | card | chip | toast |
|---|---|---|---|
| tap 1 → RDL | Barbell RDL `4×5 — RPE 7…` | Trap bar deadlift | "Barbell Romanian deadlift in, trap bar deadlift out. Same job, same numbers." |
| tap 2 → Deadlift | Deadlift `4×5…` | Barbell RDL | "Deadlift in, barbell romanian deadlift out. Same job, same numbers." |
| tap 3 → RDL | Barbell RDL `4×5…` | **Trap bar deadlift** (expected Deadlift) | "Barbell Romanian deadlift in, deadlift out. Same job, same numbers." |
| undo | **Trap bar deadlift** `4×5…` | **none** | "Trap bar deadlift is back on the card." |
| next boot | Trap bar deadlift `4×5…` | (store `[RDL→DL, DL→RDL]` dead) | |

- The chip names the grid lift, not the lift just left. One undo skips two taps, then no chip is offered, so Deadlift cannot be reached by undo. The card holds after a reboot. The two dead records stay in `ia_swaps_` and replay as no-ops.

## UNKNOWN
hop4 is a sample (10,000), not an enumeration; 5+ taps not run. CF covers the chip lookup only; `undoSwap`'s own first-`from` lookup when two records share a `from` (currently prevented by D191's same-from filter) not measured. CF boot == live not run. Whether real athletes tap A>B>C>B is not measured.
