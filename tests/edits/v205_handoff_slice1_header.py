#!/usr/bin/env python3
# V205 handoff fold, slice 1: D-code registry + element 1 (current state header).
# Only IRON_ASYLUM_HANDOFF_1_1.md is touched.
import io, sys

P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
src = io.open(P, encoding="utf-8").read()
lines = src.split("\n")

def repl_line(prefix, new):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, "anchor count %d for %r" % (len(hits), prefix[:60])
    lines[hits[0]] = new

# --- 1. REGISTRY FIRST -------------------------------------------------------
repl_line(
    "- **D-CODE REGISTRY (read before issuing any D-code): highest assigned = D136.",
    "- **D-CODE REGISTRY (read before issuing any D-code): highest assigned = D137. Next free = D138.** "
    "Keep this line current in the same edit that issues a number. Three collisions happened in one session at V198 "
    "(D86/D87 already shipped in V197, then D90 proposed twice) and the V192 D41/D45 collision in this file is the same failure.",
)

# --- 2. ELEMENT 1: working-file line ----------------------------------------
WORKING = (
"- **Working file:** `index.html` — **V205**; `<meta name=\"ia-version\">`=**205**. Built in order after V204. "
"**V205 BUILT the NSW pace goal's week, seven rulings.** "
"**D125 amended** — the even-spread day chooser is replaced by **`_nrcSpacedRunDays`'s full objective**, the long run is relaxed "
"from a **pin to a preference**, and the ceiling goes **3 → 4**. "
"**D127** — D36's long-run protection extends to the **pace family**: the hinge and the heavy lower pair ride a quality day and "
"nothing axial lands on the long run or its eve. Long-run-eve hits **1,980/6,336 → 0**, every one of them a four-training-day config. "
"It shipped **BEFORE the ceiling by ruling**, because the ceiling would otherwise have created **495/2,079** at five days. "
"**D128** — CHI minutes and reps come from **Guide B Table 6** (`NSW_TABLE6_CHI` + `chiFromTable6`), replacing a V115 hand ramp "
"with **no source** that reached **3 × 20 = 60 min**. The hardcoded `isMilGoal && week > 26` limb is **DELETED, not re-pointed**, "
"because a table read indexed `min(week, 26)` **IS** the doctrine's \"do not increase\" row. The **bike forks off** (`getCHIBike`) and "
"**swim takes the rep tier**. "
"**D129 + addendum + final wording** — ranks **6 identity, 7 spread, 8 rest-into-the-long-run, 9 earliest first quality**, all "
"**pace-gated**; `recBeforeLong`'s Sunday-first lens is corrected **for the pace family ONLY**, because NRC keeps the shipped predicate: "
"**182/804** chooser rows and **54/112** built programs move under the correction. "
"**D130 + amendment** — the fourth run reaches **all 64 rest-day calendars**, rank 1 splits into **untolerated and tolerated**, the "
"only tolerated pair being **CHI immediately before the long LSD**, and on the **14** four-training-day calendars **1 is the FLOOR**. "
"**D132** — on a solo-run pace program whose `cardioMode` is `noimpact`/`noimpact_swim` the ceiling **stays 3**: a week the overlay "
"rewrote to walks has no SI, no LI and no long run, so D125's four-session argument does not reach it. "
"**D114's INT half + D135 + D136** — Table 6's **INT column** with **Guide A's cap of 8**, fixing a regression **V205 itself caused** "
"when weekly INT spread the old ramp over 11 weeks; **bike INT forks off**; **A's 8 stands over B's Table 7 10**, and the column is "
"stored **raw** with the clamp visible in the reader. "
"**D122's pin shape** — `g202`'s D7 became a **RULE, not a scalar**: a scalar 11 would have passed on the gate's own config and been "
"**false on 2,232 of 3,240** pace builds. "
"Gate proof at 205: **42 gates, PASS 2033 FAIL 0, REFUSED 0**; sabotage **51/51 TRIPPED, 0 SURVIVED, 0 NOT-APPLIED, 0 CRASH** across "
"**ten specs**; blast radius **18 hunks, 100% classified, 0 unruled removals**; fuzz **3,213 configs / 1,039,216 tuples / 0 violations**. "
"`HALF_MANNY` **UNMOVED** at `7d4f7ed45cc5bd53`, all three era tables carrying `[205]` REFERENCE rows, rebuilt independently and mutually "
"distinct. NRC confinement **891/891 byte-identical**; **0** prescribed bike cards moved. "
"**NOT SHIPPED: D113; D122's crossover retirement (slice 7c parked by Mario); D131 (withdrawn as unreachable); D137 (ruled, V206's first "
"slice)** — all four in §12."
)
repl_line("- **Working file:** `index.html` — **V205**;", WORKING)

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice1 OK")
