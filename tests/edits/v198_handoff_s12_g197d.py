#!/usr/bin/env python3
# V198, tests/record only. Adds ONE new §12 bullet recording that g197d_d84_base's E1h
# failed self-comparison at V197 and that E1h/E5 are now baseline-version-aware / re-pinned.
# Neighbouring bullets are NOT rewritten. Anchor asserted count==1 before writing.
import io, sys

DOC = '/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md'
ANCHOR = '\n- **A zero-length lattice axis makes the identity fuzz report green on 0 configs'

BULLET = (
    "\n- **`g197d_d84_base`'s E1h FAILED WHEN V197 WAS COMPARED TO ITSELF, and E5's premise "
    "was superseded by D85 (V198 gatekeeper, tooling; both amended).** Worse than the entry "
    "above it says: those five baseline-only assertions were not merely uncovered by sabotage, "
    "two of them were unsatisfiable outside one particular pair of artifacts. **E1h** (“Calves "
    "rises somewhere”) is D84's OWN FOOTPRINT and D84 shipped IN V197, so the claim can only be "
    "put against a pre-D84 baseline; gatekeeper measured `PASS 5 FAIL 1` on V197-vs-V197 with "
    "E1h as the single failure, and every baseline at V197 or later falsifies it by construction. "
    "It is now **baseline-version-aware**: it reads `ia-version` out of the baseline, puts the "
    "claim when that is `< 197`, and on any other baseline prints a named `REFUSE E1h … NOT RUN` "
    "line and counts it in a REFUSED bucket echoed beside the `PASS n FAIL n` summary. It does "
    "NOT silently skip — a no-op assertion is the vacuity defect this repo keeps paying for — and "
    "a refusal is never counted as a pass. **E5** pinned `capSessionBudget` byte-identical to the "
    "baseline under D84's premise that no budget machinery moved, which D85 deliberately falsifies. "
    "**Re-pinned, not deleted** (a deletion is an unruled removal, and E5 is the only assertion in "
    "the suite that sees the D85 edit as an EDIT rather than as an outcome): `capSessionBudget` is "
    "confined to the sha256 of its **D85-licensed text** (`fb16df9c…`; the pre-D85 text `c8064f3c…`, "
    "byte-identical in V196 and V197, is allowed only when the artifact itself reads `ia-version < 198`), "
    "while `_itemCost`/`_setCount` keep the baseline byte comparison because D85 does not own them. "
    "Narrowing E5 to those two was the rejected alternative: it leaves the one function D85 touched "
    "with no confinement at all. Proved green on V198-vs-V197 (`PASS 5 FAIL 0`, `REFUSED 1`) and on "
    "V197-vs-V196 (`PASS 6 FAIL 0`, E1h put and passed), and E5 trips on both a semantic (`<=1` "
    "→ `<=0`) and a comment-only edit to `capSessionBudget`. Unchanged and still open from the entry "
    "above: with no baseline under `sabotage.py`, none of these have mutation coverage.\n"
)

src = io.open(DOC, encoding='utf-8').read()
n = src.count(ANCHOR)
print('anchor s12-insert count=%d' % n)
if n != 1:
    sys.stderr.write('ABORT, no bytes written\n'); sys.exit(1)

out = src.replace(ANCHOR, BULLET + ANCHOR, 1)
assert out != src
io.open(DOC, 'w', encoding='utf-8').write(out)
print('wrote ' + DOC)
