# V237 measure mC: the blank pace face (g237 D220-open, conjunct generic-pace-face)

Mode B (before-picture for a parked row, standing ruling 7). Read-only. No ruling.
Script `tests/measure/v237_paceface.js`, output `tests/measure/v237_paceface.out.txt`.
Files: candidate `index.html` (ia-version 237) and V236 as shipped (`base_v236.html`, ia-version 236).
Oracle: the row the real `iaWheelInit` lands on in the DOM stub (v235 mkEnv + v236 env), the raw HTML bytes, the ruling's own strings.

## 1. The face, on both files
- Pace spec: col0 rows 15 (dash + 4..17, no wrap); col1 rows 60 (0..59, wraps, no dash row, home index 120).
- Stored '' and 'abc': parse ['',''], col0 lands on the dash, col1 has no '' row and lands on its home row '0'.
  Rendered column faces ["—","00"]. Stored '8:30': ["8","30"]. Same on 237 and 236.
- There is no separator glyph in the markup or CSS between the two columns; the athlete sees "—" and "00".
  Written in the gates' join convention that is "—:00", the face the ruling's own Before block uses for rept.
- Identical 237 vs 236: pace spec, rows, parse, format and iaWheelHTML bytes (sha) on '', 'abc', '8:30', and the
  rendered faces all match. `_iawParse`, `_iawFormat` and `cardioFieldHTML` differ in source (the dist and rept D220/D221
  changes) but give the same pace output on all three inputs.

## 2. Where a pace wheel renders
- One call site: `cardioFieldHTML`'s generic run branch, index.html:13852 (V236 :13835). It is reached through
  `buildLogHTML` (index.html:13904) and `setCardioSwap` (index.html:14901).
- Lattice (v237_distzero's 54 configs, engine dose, no hook): 627 of 1,956 run sessions (32.1%) get a null dose and
  render the generic form. All 627 are Speed Run subtypes (Intervals 378, Tempo 132, Fartlek 67, Hills 50).
  180 bike or swim sessions (124 bike, 56 swim) also reach it through a swap to run. Checked once with the real
  `setCardioSwap('run')` (multi seed 76308, W1 tue bike): faces ["—","00"]. The counts are the same on both files.
- So real days reach the generic form, and `__FORCE` is not needed to get there.

## 3. Does "—:—" exist?
- The literal "—:—" occurs 0 times in either file, and so do `—:—` and `&mdash;:&mdash;`.
- Blank landed faces, 237: dist 0 .0 0, pace — 00, rept 0 00, hms 0 00 00. On 236: dist — .0 0, pace — 00,
  rept — 00, hms 0 00 00. No wheel on either file has a dash in a tail column, because only column 0 ever carries a nil row.
