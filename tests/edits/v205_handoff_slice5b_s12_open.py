#!/usr/bin/env python3
# V205 handoff fold, slice 5b: element 5 (section 12) - the bike fork pair, closing D114,
# and the open items V205 surfaced.
import io

P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
src = io.open(P, encoding="utf-8").read()
lines = src.split("\n")

def idx(prefix):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, "anchor count %d for %r" % (len(hits), prefix[:70])
    return hits[0]

def repl_line(prefix, new):
    lines[idx(prefix)] = new

# --- 1. the bike fork is now a PAIR, one open ruling ------------------------
BIKE = (
"- **BIKE CHI AND BIKE INT ARE BOTH ON V115 HAND RAMPS WITH NO NSW SOURCE — ONE OPEN RULING, NOT TWO (V205, D128 + D135 disclosed, "
"deliberately not fixed).** `getCHIBike` and `getINTBike` are the V115 hand ramps carried over byte-identical because **neither guide covers "
"cycling**, so applying a run/swim table to a bike would be an invention rather than a transcription. That is the right call and it leaves a "
"real, sized gap: **2,664 bike CHI cards, 1,872 of them prescribing MORE than Table 6 would at the same week**, off a ramp nobody sourced; "
"bike INT sits on the same unsourced footing. **Rule them together.** They were forked for one reason and they are read as a pair by the bike "
"caller (`:4501-4502`), so a cycling doctrine anchor — which the repo does not have — replaces both readers in one build or the two "
"halves drift apart. Recorded so neither is mistaken for a transcription."
)
repl_line("- **BIKE CHI SHIPS 2,664 CARDS WITH NO NSW SOURCE,", BIKE)

# --- 2. D114 is CLOSED by V205: drop the row, fix D115's appendix ----------
del lines[idx("- **D114 — GUIDE B TABLE 6 DRIVES INT REPS AND CHI MINUTES (coach, V202, RULED, UNBUILT, INTERIM).**")]

D115 = (
"- **D115 — A p13 / p16 SEGMENT LADDERS (coach, V202, RULED, BLOCKED ON A DATA-SHAPE CHANGE).** A's tables prescribe mixed ladders, not "
"one rep length: **17 of 26 p13 rows and 15 of 26 p16 rows** are mixed. `_dose` holds ONE rep length, so the ladders cannot be expressed at "
"all until the dose contract carries a segment LIST. That contract change is the build, and the ladder is the payload. "
"**[V205: D114 IS NOW FULLY BUILT AND ITS OWN ROW IS RETIRED.** The CHI half shipped as **D128** (`NSW_TABLE6_CHI` + `chiFromTable6`) and the "
"INT half shipped as **D114a + D135 + D136** (`NSW_TABLE6_INT` + `intFromTable6`, A's cap of 8 over B's ten, bike forked off) — a "
"correction to this row's earlier claim that the INT-rep half was already wired at V202, which it was not. **D114's licence-to-refuse clause "
"survives the build and still binds the build that ships D115:** the segment ladders supersede the table, and a ramp pinned to a superseded "
"source must fail loudly rather than quietly out-rank its replacement.]**"
)
repl_line("- **D115 — A p13 / p16 SEGMENT LADDERS", D115)

# --- 3. the open items V205 surfaced ---------------------------------------
NEW = [
"- **THE 1,296 PACE BUILDS STILL ON ONE QUALITY SESSION (V205, measured, the size of what parking D113/D122 costs).** Until D113 and D122's "
"crossover retirement ship, **1,296 pace builds run a single quality session a week**, which is below the guide's own standard week. This is "
"the price of the parking decision and it is recorded as a number so the next scoping conversation does not have to re-measure it.",
"- **`_cardioInterference` CHARGES A REHAB WALK AT THE UNLABELLED DEFAULT (V205, found not fixed).** `:9193`, `if(inten == null) inten = 0.75;` "
"— a pain-free incline walk written by the injury sweep matches none of the intensity tokens, so it falls through to the **0.75 "
"unlabelled default** and is charged as three quarters of a normal session's leg cost. A rehab walk is the **least** taxing cardio the app "
"prescribes and it is being priced above `recovery` (0.55). The fix is a token, not a redesign, but it moves every downstream pass that reads "
"the value (§10b: name every reader before ruling), so it gets its own ruling.",
"- **`_nrcRunShape` CANNOT READ SWEEP-WRITTEN SUBTYPES ON EITHER ARM (V205, latent, found not fixed).** The classifier keys the NRC arm on the "
"Nike subtypes and the NSW arm on `legLoad`; **a subtype rewritten by the injury sweep matches neither**, so an overlaid week classifies as "
"null shape. It is latent today because it sits **behind the `legTaxing` guard**, which the rewritten session does not satisfy, so nothing "
"currently observes it. Latent is not fixed: the guard is what is hiding it, and any ruling that widens the guard exposes this immediately.",
"- **`half` + `protect` (288 CONFIGS) IS UNREACHED BY THE LATTICE (V205).** No sweep in this build touches that intersection, so **nothing is "
"known about it either way** — which is a statement about the lattice, not about the population (§10b). Recorded so a future blast "
"radius does not quietly list it as unaffected.",
"- **`capSessionBudget` IS ENGAGED ON 52.32% OF CELLS, AND THAT IS STANDING STATE, NOT A V205 EFFECT (V205, measured).** The budget fires on "
"more than half of all day cells across the lattice. V205 did not move that number and no ruling here targets it. It is recorded because a "
"future measure will find it and needs to know it is the baseline rather than a regression to chase.",
"- **THE W8 CUTBACK-PLACEMENT SHIFT AT tw=10/11/12 IS UNATTRIBUTED (V205, seen not explained).** Cutback placement moves at week 8 on "
"**tw=10, 11 and 12** and no ruling in this build claims it. It classified cleanly in the blast radius under a ruled class, so it did not "
"block the ship, but **\"classified\" is not \"explained\"**. Attribute it before any ruling touches cutback placement.",
]
lines[idx(BIKE[:60]) + 1:idx(BIKE[:60]) + 1] = NEW

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice5b OK")
