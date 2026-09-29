# D181 5L licence re-ruling (V224) — extend by one era

Ruling for build P-WCTODAY / V224 gate-green pass. Coach spawn, saved verbatim (main
session saves every coach return before briefing builder, per CLAUDE.md).

**Extend `LIC5L_ERAS` by one era, same cap, same MAP conjunct, same test as V223; §12 (C)
stays open and is NOT scoped by this ruling.**

## Finding

Coach ran `tests/gates/g222_d181_chain.js` on the V224 candidate (working `index.html`,
stamped 224) and on `tests/edits/base_v223.html` (stamped 223); outputs saved under the
coach scratchpad (`g222_v223.out`, `g222_v224.out`, `full_223.txt`, `full_224.txt`). The
residue is the same class, count, rows and shape as V222 and V223. With licence, stamp and
timing lines stripped, diff of the two 45-line gate outputs is one line: `PASS 8 FAIL 0`
vs `PASS 7 FAIL 1`. The V224 diff against HEAD is two lines, both outside `<script>`
(`:8` the version stamp, `:646` the one CSS rule from D185); script spans `:1204–:18084`.
Nothing on the swap seam, the injury filter, or any of the 68 rows moved, and the print
proves it rather than infers it.

**Before (candidate 224, licence as committed `LIC5L_ERAS = [222, 223]`):**
```
  5L licence: REFUSED at ia-version 224 (eras 222, 223 only, standing ruling 2; above the last listed era 223): residue must be 0 until re-ruled
    5L manny|W3   n 382  name!=live 0  detail!=live 0  residue boot==MAP 0/0
    5L manny|W5   n 359  name!=live 0  detail!=live 0  residue boot==MAP 0/0
    5L manny|W7   n 350  name!=live 0  detail!=live 0  residue boot==MAP 0/0
    5L mario|W3   n 368  name!=live 0  detail!=live 0  residue boot==MAP 0/0
    5L mario|W5   n 3629  name!=live 0  detail!=live 68  residue boot==MAP 68/68
    5L residue pairs (live detail -> boot detail): 2 unique
      48× 2×10 -> 2×10 — hold RPE 7, two in the tank
      20× 2×8 -> 2×8 — hold RPE 7, two in the tank
FAIL row 5L ... detail!=live 68/5088 (licence REFUSED above 223: 0), residue rows unlike the MAP boot 0
PASS 7 FAIL 1
```
Base 223: `GRANTED at ia-version 223 (eras 222, 223; ...)`, identical five 5L lines and
identical two residue pairs (48× / 20×), `PASS 8 FAIL 0`.

**After (candidate 224, expected):**
```
  5L licence: GRANTED at ia-version 224 (eras 222, 223, 224; residue <= 70, each residue row = MAP boot)
    [same five 5L lines, same two residue pairs 48× / 20×]
PASS row 5L ... detail!=live 68/5088 (licence <= 70 of 15545, eras 222, 223, 224), residue rows unlike the MAP boot 0
PASS 8 FAIL 0
```
Base 223 unchanged, `PASS 8 FAIL 0`. A file stamped 225 prints REFUSED and demands 0.

## 1. The change, exactly

One file, `tests/gates/g222_d181_chain.js`.
- Line 86: `const LIC5L_ERAS = [222, 223], LIC5L_MAX = 70, LIC5L_OF = 15545;` →
  `const LIC5L_ERAS = [222, 223, 224], LIC5L_MAX = 70, LIC5L_OF = 15545;`.
- Header comment `:50` "eras 222, 223 (each added by a re-ruling that printed the same 68
  rows)" → "eras 222, 223, 224 (...)".
- Nothing else: the GRANTED/REFUSED strings at `:183` and `:347` and the R5L label already
  render from the array (`LIC5L_ERAS.join(', ')`, `LIC5L_ERAS[LIC5L_ERAS.length - 1]`), so
  they need no edit.
- Predicate stays `LIC5L_ERAS.includes(VER)`; not `VER <= 224`, for the reason the V223
  ruling gave (a list entry names the ruling that granted it and self-expires when the fix
  build simply does not add its number).
- Two edits, one file, well under the four-edit cap.

**Deliberately unchanged:** `LIC5L_MAX` 70 and `LIC5L_OF` 15545; the `resOff.length === 0`
MAP conjunct and `name.length === 0`; the ERA 222 refusal; rows 5/5c/5X/8/8d/9; the boot
re-filter at `applySessionSwaps`; `applySwapChoice`; `_swapInjuryOK`; `HALF_MANNY`
(gatekeeper's fuzz: all three arms identical to V223, and the gate's own manny rows print
0/0 residue on both files).

## 2. Grounds, and standing rule 7

"Nothing touched the swap path" alone would be an inference, and the rule in this repo is
that a claim about behaviour is printed, not inferred. But the V223 re-ruling built the
measure into the gate itself (edit (4): the residue-pair print, "so the next re-ruling
needs no patched copy"), and the licence's contract is exactly the test the handoff names:
same 68 rows byte-identical, boot==MAP 68/68. That print is above; it is the measure. So
the one-coach-spawn shape is sufficient and is what the V223 ruling and the V223 notes
item (3) prescribed for this case. Standing rule 7 does not bite: no premise was refuted.
The 5L trip is the licence expiring on schedule (standing ruling 2: a licence is a
predicate that REFUSES above its era), which is the gate doing what it was built to do,
not a measure contradicting a ruling. A fresh measure pass would be required if the
residue count, rows, or MAP conjunct had moved, or if the artifact diff had entered
`<script>`; neither is the case (two-line diff, both outside the script). For the record:
this was a zero-JS build, and the gate output diff is one summary line. This is the
cheapest possible instance of the per-build re-ruling the licence design forces.

## 3. Scope limit, stated for the record

This ruling extends a gate licence by one era and nothing more. It does NOT authorize,
scope, schedule or shape the §12 (C) fix (wiring `applyInjuryFilter` into
`applySwapChoice` after `_swapDetailFor`, never at boot). That fix stays its own future
build, with its own measure pass first (full enumeration; the manny 77 residue is a
different cause and must be isolated, and `!/RPE/.test(detail)` means hops from an
RPE-bearing detail behave differently), and when it ships, its build does not add its
version to `LIC5L_ERAS`, so 5L demands 0 and the licence self-expires. The V223 ruling's
recommendation stands: schedule it as a small swap-seam build right after held-queue
builds 4 and 5. Each build until then costs one spawn of this shape; that is the price the
licence design chose over a ceiling, and it is still the right price because a ceiling is
a pin nobody re-reads.

## 4. Blast radius

Test tooling only: one gate file, two lines. No goal, focus, calendar, week, card, digest
or athlete-facing string moves. Classification: `tests/gates/g222_d181_chain.js` hunk =
"D181 5L licence era extension, V224 re-ruling"; zero hunks in `index.html` attributable
to this ruling.

**Mario's call:** none. Licence shape is gate scope, the session's to record (CLAUDE.md:
"Siting, form, gate scope, agent order and tooling shape are the session's to decide").
Nothing in his program moves; the manny rows print 0/0 on both files. Tell him in one line
at most, by ruling name (D181 5L extended to era 224), not as a decision.

**Recommendation:** ship V224 with `LIC5L_ERAS = [222, 223, 224]` (line 86 plus the `:50`
comment), re-run `g222_d181_chain` on the candidate and on base 223 expecting
`PASS 8 FAIL 0` on both, and keep the §12 (C) fix as its own build after builds 4 and 5.
**Counter:** the residue has now been printed identical four builds running and the fix is
one live-path line, so ending the per-build spawn by shipping the fix inside V224 is
tempting; rebuttal, that puts an engine edit on the injury seam into a build whose entire
proof is "zero JS changed", and its before-picture (manny 77) is still not isolated, so it
would ship on an unmeasured premise, which is the exact thing standing rule 7 exists to
stop.
