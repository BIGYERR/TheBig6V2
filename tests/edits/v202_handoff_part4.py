#!/usr/bin/env python3
# V202 handoff part 4 — documentation only. ONE bullet at the head of §12.
# Records the four surviving statements of the refuted "never persisted" invariant
# (:259, :555, :600, :1260). RECORDS, does not fix: repairing the premise is a claim
# about how the code behaves today, which is coach's to rule on evidence.
import sys, io

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"

with io.open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

ANCHOR = "## 12. Open / carried forward\n\n"

n = src.count(ANCHOR)
if n != 1:
    sys.stderr.write("ABORT: anchor count == %d, expected 1\n" % n)
    sys.exit(1)

BULLET = (
"- **THE HANDOFF STILL STATES A REFUTED INVARIANT IN FOUR PLACES, AND V202's §4 CORRECTION IS WHAT EXPOSED THEM "
"(V202, RECORDED NOT FIXED — coach rules).** `:259` and `:555` assert that `refreshProgram`'s output is never "
"persisted, and they do it **as the stated justification for V133's day-unit freeze rule**, so neither line can be "
"edited without making a claim about why that rule is right; `:600` states the same thing in the present tense "
"inside a past-tense narration of the V104 bug; `:1260` is an open item whose headline claims `prog.weeks` is "
"“still never persisted, so drift is unbounded” and whose recommended remedy is a thing the code already "
"partly does. **What is actually true, measured this session:** the grid IS persisted at creation "
"(`index.html:6634`), `refreshProgram` DOES read it back (`:14516` / `:14601`), and that read is **load-bearing** "
"— strip it and **9 of 9** logged run sessions flip off target by **1:02 to 1:25/mi**. The stored copy is "
"re-stamped with the live rebuild by **exactly three** user actions (`applyRestMove :1385`, `setProgRace :13483`, "
"`setProgStart :13495`) and **NOT on an ordinary boot**, which is the nuance that keeps `:1260` from being simply "
"deleted. **The open question, so the next session does not re-derive it: does V133's conclusion survive on a "
"repaired premise?** The stored grid can be **stale relative to the current engine even though it is persisted**, "
"which may be the claim 259/555 were reaching for; if it is, the guard stands and only its justification is "
"rewritten. **Coach rules; measure has most of the evidence already** "
"(`tests/measure/v202_persistence_C.js`, `tests/measure/v202_persistence_D.js`). **Priority: `:1260` first** — it "
"is the one most likely to cost a session real time, because it advertises partly-solved work as outstanding.\n"
)

out = src.replace(ANCHOR, ANCHOR + BULLET, 1)

if out == src:
    sys.stderr.write("ABORT: replacement was a no-op\n")
    sys.exit(1)

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(out)

print("OK: anchor count 1, bullet inserted at head of §12 (%d chars)" % len(BULLET))
