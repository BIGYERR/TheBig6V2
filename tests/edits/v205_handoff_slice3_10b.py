#!/usr/bin/env python3
# V205 handoff fold, slice 3: element 3 (section 10b, generic doctrine only, one bullet each).
import io

P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
src = io.open(P, encoding="utf-8").read()
lines = src.split("\n")

def idx(prefix):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, "anchor count %d for %r" % (len(hits), prefix[:70])
    return hits[0]

NEW = [
"- **A ruling that moves cardio onto a lift day, off one, or between days names EVERY pass that reads that day's cardio or the next day's "
"(V205).** The readers are not co-located and they do not share a predicate: the **carry gate**, the **session budget**, the **regional "
"fatigue cap**, the **day-before-hard-cardio rewrite**, the **hinge clamp**, **`hotNext`** and **`hotCardio`** all key off the same two "
"cells, and so do the gates that count their output. **Grep `_cardioInterference(` and `legLoad` before the ruling is written**, not after "
"it fails. **Two reds in this build came from naming one reader** and assuming the rest would follow it.",
"- **A population's absence from a lattice is evidence about the lattice, not about the population (V205).** `run_base` was named in a blast "
"radius as unaffected on the strength of a **tw=6** sweep, and it moves at **tw=8**. \"It did not appear\" and \"it cannot appear\" are "
"different claims, and only the second one is a finding. Before recording a population as untouched, state the axis the lattice actually "
"swept and whether the population can even be expressed on it.",
"- **A pin transcribed from a failure message is not a pin (V205).** A scalar **11** lifted straight out of a gate's own error text would have "
"passed on the gate's own config and been **false on 2,232 of 3,240** builds. Deriving the number independently is what revealed the quantity "
"is **a rule with two arms, not a number**. If the only place a constant has ever been computed is the assertion that failed, it is the "
"engine asserting it equals itself with an extra step.",
"- **A dead limb that returns early is not value-identical to its replacement; it is unreachable (V205).** \"It returns the same thing\" and "
"\"nothing can reach it\" are different claims with different proofs, and conflating them is how a deletion gets waved through as a no-op. "
"The second claim is the stronger one and it is the one that licenses the delete — so **it needs its proof written down**, by name, in "
"the same place the limb used to be.",
"- **A sabotage anchor written in slice N can be silently invalidated by slice N+2 (V205).** The later slice edits the same neighbourhood, the "
"anchor stops matching, and nothing announces it until the sweep — **three surfaced at once at the end of this build**. Re-verify "
"**every** anchor's `count==1` before the sweep, not only the ones that already failed, and treat an anchor as owned by the file rather than "
"by the slice that wrote it.",
"- **Distinguish a FLOOR-KEYED licence from an EXPIRING one (V205).** A **floor-keyed** licence refuses **downward** — it pins a ruling "
"that stands and fails on any artifact older than the era that earned it. An **expiring** licence refuses **forward** — it guards a "
"direction a ruling has already found wrong and must fail the moment the replacement ships. They read almost identically and they fail in "
"opposite directions, so the predicate says which one it is. In this build `g202` D7's three-run arm is **the only expiring licence**; "
"everything else keyed on `ia-version` is a floor.",
]

i = idx("- **A fix that lives inside a chooser does not reach a population gated out of that chooser (V205).**")
lines[i + 1:i + 1] = NEW

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice3 OK")
