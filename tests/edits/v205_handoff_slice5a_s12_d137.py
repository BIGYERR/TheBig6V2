#!/usr/bin/env python3
# V205 handoff fold, slice 5a: element 5 (section 12) - D137 verbatim, the parked set,
# and D131's withdrawal.
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

# --- 1. D137, verbatim, at the head of section 12 ---------------------------
D137 = (
"- **D137 — `run_base` CHI FALLS AT WEEK 13 AND V205 IS WHAT INTRODUCED IT (coach, V205, RULED, UNBUILT — V206's FIRST SLICE).** "
"Reaches **136 of 1,836** configs: `run_base` at **≥13 weeks**, max **16**, and **multi-sport runs it out to 20**. The mechanism: "
"**Table 6's rows from week 13 on are TWO-PIECE** (two repeats), and the **base limb prints ONE piece**, taking `minPerRep` straight off the "
"row. So at the week-13 boundary the light tempo **falls 20 → 12** exactly where it should still be climbing. "
"**The fix is `Math.min(week, 12)` for `baseMode`** — hold the base reader on the last single-piece row rather than letting it read half "
"of a two-piece one. **Expected series after the fix:** `15, 15, 16, 11, 17, 17, 18, 13, 19, 19, 20, 14, 20, 20, 20, 12`. "
"**V205 introduced it: V204 CLIMBS across that boundary where V205 FALLS**, which is what makes this a regression this build caused and not a "
"capability it lacks — the same distinction that earned the INT ramp its fix (§11f). It is queued rather than folded in because it "
"touches a different goal family from everything V205 proved, and folding it into the last slice would have meant re-proving a 42-gate, "
"51-mutation artifact. **Its magnitude was retracted once**: the *\"57 → 17 min\"* figure is wrong, the real one is **15-19 → 15-18**, "
"a minute or two, because the base limb never prints reps × minutes (§11f)."
)
i = idx("## 12. Open / carried forward")
assert lines[i + 1] == "", "expected a blank line after the section 12 heading"
lines[i + 2:i + 2] = [D137, ""]

# --- 2. the parked set, naming slice 7c ------------------------------------
PARKED = (
"- **D113 AND D122's CROSSOVER RETIREMENT ARE PARKED BY MARIO'S RULING, AND THE ROOT CAUSE IS MULTI-SPORT (V205, measured, they get their own "
"version).** Mario: *\"ship V205 without D113, and give D113 its own version\"*. D113 makes the three-run week INT / CHI / long run; D122's "
"**crossover retirement** (slice 7c, parked with it) runs both quality sessions from week 1. **D122's PIN SHAPE did ship** — `g202`'s D7 "
"became a rule with two arms rather than a scalar — so do not read this row as D122 being wholly unbuilt; what is parked is the "
"retirement of the crossover itself. Measured on the V205 artifact, shipping either would put an **untolerated hard adjacency on 2,070 of "
"13,248 weeks**, and **all of it is multi-sport**. The cause is structural, not a tuning miss: **multi-sport never enters the solo spacing "
"chooser**, so it received neither D130's typed untolerated/tolerated split nor D125's relaxed long-run pin. Three remedies were named. "
"**(1) Route multi-sport through the chooser** — PREFERRED: one objective, one lens, and the typed split then covers everyone by "
"construction. (2) Give multi-sport its own adjacency pass — a second lens on the same doctrine, which §10b says is how the two "
"halves drift apart. (3) Gate D113 to solo weeks — cheapest, and it ships a doctrine that is true of some athletes and silently false for "
"the rest. **Nothing here is built and nothing should be built until the routing question is ruled.**"
)
repl_line("- **D113 AND D122 ARE PARKED BY MARIO'S RULING,", PARKED)

# --- 3. D131, withdrawn ----------------------------------------------------
D131 = (
"- **D131 — WITHDRAWN AS UNREACHABLE (coach, V205). Recorded so the number is not reused and the idea is not re-derived.** It was ruled "
"and then withdrawn by coach once the layout table was general: the state it prescribed **cannot be reached on any calendar**, because on the "
"14 four-training-day calendars a CHI on the long-run eve is **unavoidable**, which is the same finding that turned *\"0 tolerated preferred\"* "
"into **1 is the FLOOR** (D130 amended, §11f). A ruling withdrawn for unreachability is not a failed ruling; it is the general table doing "
"the job the narrow one could not. **Nothing to build.**"
)
lines[idx(PARKED[:60]) + 1:idx(PARKED[:60]) + 1] = [D131]

out = "\n".join(lines)
assert out != src, "no change written"
io.open(P, "w", encoding="utf-8").write(out)
print("slice5a OK")
