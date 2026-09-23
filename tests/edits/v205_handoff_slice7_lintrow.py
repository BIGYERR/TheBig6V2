#!/usr/bin/env python3
# V205 handoff fold, slice 7: the _isoToday lint-debt row carried STALE line pins
# (:1832/:13452). The real declarations are :1903 and :14843 on the V205 artifact.
import io

P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
src = io.open(P, encoding="utf-8").read()
lines = src.split("\n")

def idx(prefix):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, "anchor count %d for %r" % (len(hits), prefix[:70])
    return hits[0]

ROW = (
"- **`_isoToday` LINT DEBT ROW (V205, carried, AND ITS LINE PINS WERE STALE).** `tests/lint_allow.txt` still holds exactly one entry, "
"`_isoToday`: a duplicate top-level declaration, identical behaviour, second wins by hoisting. **V205 touched neither declaration**, so the "
"debt itself is unchanged and is recorded here so it is not mistaken for new debt. **What WAS wrong is the record:** this row read `:1832` "
"and `:13452`, and neither was right at V204 either — the real sites are **`:1903`** (unmoved since V204) and **`:14843`** (V204: "
"`:14421`; it moved because V205 inserted code above it, not because anything about the duplicate changed). The comment header inside "
"`tests/lint_allow.txt` carries the same stale pair and is **not corrected here**, because that file is outside this pass; correct it in the "
"next build that touches the tests. **Standing point, and it is why this is written out: a line pin in prose is not maintained by anything** "
"— it was checkable, it was never checked, and it drifted silently across three versions. Grep the symbol, never trust the number."
)
lines[idx("- **`_isoToday` LINT DEBT ROW (V204, carried).**")] = ROW

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice7 OK")
