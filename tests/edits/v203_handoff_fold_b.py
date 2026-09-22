# -*- coding: utf-8 -*-
# V203 handoff fold, part B: elements 4, 5, 6.
import io
P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
s = io.open(P, encoding="utf-8").read()
def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, "ANCHOR %s count==%d (need 1)" % (tag, n)
    s = s.replace(old, new, 1)
    print("ok  " + tag)

# ---------- ELEMENT 4 — §11f V203 block, ABOVE V202 ----------
V203_RULINGS = """### V203 — D116/D117/D118/D119/D120, the athlete gets a pencil on his own mile (Mario: "i dont think we need a 'log a result' page", "just make it explicit that the reason you cant edit it is because you are too close to the race", "take out the 'the row holds......' too long and we are good", "yes bump it to 203")
- **THE FORM IS A PENCIL, NOT A RESULT SHEET (D116).** Mario: *"i dont think we need a 'log a result' page i like the run paces and we just need a button with a pencil to change the anchor for the mile time so the program can rerun the calculations to shift the runs to the new mile time"*. Coach had ruled an evidence-gated sheet: a distance picked from the five chart anchor columns, a logged RESULT and never a typed pace, one chart row per result, and a 28-day cooldown. **Rejected.** The rejection is coherent, not a concession: with a typed time there is nothing to cap against except his own previous entry, so the cap and the cooldown went out with the evidence gate that justified them. The value goes in as typed and interpolates exactly as a wizard entry does, because a second snapping rule would make the same field mean two different things depending on which screen wrote it. This also retires **D11**, the evidence-gated re-anchor that had been open since V172.
- **THE RACE-WEEK LOCK STAYS (D116).** On my recommendation, with coach concurring, and it is the one rail Mario did not ask for. D117's ceiling governs easy days; the anchor ROW governs every speed session and the race-day target pace. Re-pacing the last three weeks changes the sessions whose only job is to arrive fresh, which is the one window where a new number cannot help and can hurt. Predicate: `_goalCurWeek(p) >= (p.totalWeeks||6) - 2`.
- **THE LOCK IS A POPUP THAT EXPLAINS, NOT A DISABLED CONTROL (D116).** Mario: *"just make it explicit that the reason you cant edit it is because you are too close to the race, make a pop up for it with the reason why"*. The pencil stays tappable all the way through race week; a greyed control tells the athlete nothing and reads as a bug.
- **THE POPUP COPY IS SHORTENED (D116).** Mario: *"take out the 'the row holds......' too long and we are good"*. He cut the paragraph saying the lock lifts after the race. **Recommendation rejected:** I argued that without it the first athlete to hit the lock has no way to know it is temporary and will read it as permanent. His call, made, and recorded here so it is not re-litigated.
- **`re-pace` BECAME `reset the pace of` (D116, copy).** Mario's own standing copy rule bars mid-sentence hyphens in anything the athlete reads, and `re-pace` is one. Coach had recommended shipping his wording as approved; the standing rule outranks the approval, because the approval was of the meaning and not of the punctuation.
- **THE DETOUR IS TWO PROGRAMS, NOT A PAUSE BUTTON (ruled, NO BUILD REQUIRED).** Mario: *"i am runninga half marathon program, but i want to run a goal pace 1.5 miles for about 4-5 weeks"*, and he reached the answer himself: *"what i need to do is just on my own, keep my long distance day (which right now is saturday) to not lose my 'half marathon' mileage then pick up wherevr"*. That is Nike's own jump-in rule — run the TAIL of the plan, never the head — and not resume-at-the-week-he-left. With a FIXED race date it is the only shape that preserves the taper. Measured, not assumed: two live programs coexist, all **14** per-program stores are keyed by program id, creating the second touches nothing in the first, and the half returns at week 8 with weeks 8–14 byte-identical to a no-detour build. **Coach's earlier position — that he should slide the race date — was overtaken by the date being fixed.** The polish items this exposes are in §12; none of them blocks the detour.
- **A 1.5-MILE RESULT CANNOT MOVE THE ROW (D116).** 1.5 miles is not a column in `PACE_CHART`, and neither the app nor the NSW guide carries a 1.5-mile-to-mile conversion. Coach refused to invent one: a fabricated conversion would contaminate the anchor that every run in the program keys on. Mario runs a one-mile time trial at the end of the block and enters that.
- **VERSION 203.** Mario: *"yes bump it to 203"*, after a concurrent session took 202 out from under the design.

"""
rep("### V202 — D100/D104/D112, the pace clock re-anchors",
    V203_RULINGS + "### V202 — D100/D104/D112, the pace clock re-anchors",
    'E4 §11f V203 block')

# ---------- ELEMENT 5 — §12 ----------
S12 = """- **THE `new Date(...)` UTC OFF-BY-ONE (V203, FLAGGED NOT FIXED — needs its own ruling).** `new Date('YYYY-MM-DD')` parses as UTC and renders in local time, so at `:2991`, `:13740` and inside the D116 race-week popup a race date prints **a day early** and the days-out count reads **one short**. It needs a measure pass over EVERY date site before anything moves, and the open question is whether `raceAlignment` itself is off by a day or only the display is — those are different bugs with different blast radii. The popup was written to agree with the program card deliberately: a popup that disagreed with the card would have shipped a second wrong number instead of one.
- **THE TWO run_base CHI `(tempo+recovery)/2` TARGETS AT `:3863`/`:3867` (V203, D117 left them standing ON PURPOSE).** They compute the same number as `steadyCapSec` and mean something different: a TARGET to run at, not a CEILING not to cross. Folding them into the ceiling owner would let a future ceiling change silently move a prescription. The open coaching question underneath is whether "steady pace" is ONE concept the app should name once, or two concepts that happen to share arithmetic today. Coach rules before either site moves.
- **THE DETOUR POLISH SET (V203, ruled shape, unbuilt — none of it blocks the detour).** Four surfaces misread a deliberate absence. (1) **The skipped-week nag:** returning to the half at week 8 after a deliberate gap leaves **25 sessions** reading as outstanding, because nothing in the app has a concept of a deliberate absence. (2) **The streak reads `ia_comp_<activeProgId>`**, so it shows **0** for the whole detour even while the athlete trains every day. (3) **Progress defaults to "No data yet"** when the new program is active, with the half's full screen one chip-tap away and no sign that it is there. (4) **`buildProjectionCard` renders a HALF MARATHON finish projection on a 1.5-mile program**. Each is a separate small ruling; do not batch them into one "detour mode".
"""
rep("## 12. Open / carried forward\n\n- **THE HANDOFF STILL STATES A REFUTED INVARIANT",
    "## 12. Open / carried forward\n\n" + S12 + "\n- **THE HANDOFF STILL STATES A REFUTED INVARIANT",
    'E5 §12 additions')

rep("but a gate that can exit non-zero and score green is a gate that cannot report.",
    "but a gate that can exit non-zero and score green is a gate that cannot report. **Re-observed unchanged at V203** — still queued, still not fixed.",
    'E5 gate.sh exit-code re-observation')

# D11 is retired by D116 (Mario rejected the evidence gate). Delete, do not annotate.
rep("- **Evidence-gated re-anchor (D11 — OPEN, design session, not a build).** After a logged race or the NRC dress rehearsal, compute the row that result implies (`paceChartLookup` by the race column) and offer it ONCE — accept/decline, Progress marks the change point. Never a free-form field. Design it together with the next item.\n",
    "",
    'E5 delete D11 (closed by D116)')

# ---------- ELEMENT 6 — ONE digest line, newest FIRST ----------
DIGEST = """- **V203 — the mile he could not change, and the goal sheet that had been deleting it.** Opened on Mario wanting to edit his mile anchor after onboarding: measure found the anchor had **five write sites, all wizard draft**, so it was unreachable once a program existed, and that `commitGoalChange` had been dropping `mileBestMins`/`mileBestSecs`/`mileBestSrc` since D5 — switching a run goal out and back silently rebuilt him on the **9:30 intermediate default**, **51/56** cardio cards faster than he is, under a sentence saying no mile time was entered. A second thread, his 4-5 week 1.5-mile block inside a fixed-date half, resolved to a design that needed **no build at all**: two live programs, Nike's own jump-in rule (run the tail, never the head), proved by measure — all **14** per-program stores keyed by program id, weeks 8-14 byte-identical to a no-detour build. Mid-design a concurrent session shipped and tagged **V202**, taking D100–D103; the first slice PARKED under standing ruling 7 and the whole ruling was re-cut against the new HEAD. Shipped: **D116** (a pencil on the Run paces group, value as typed, no snap and no cooldown — Mario rejected coach's evidence-gated result sheet — with a race-week lock that opens an explaining popup rather than greying the control, evaluated at tap not at render), **D117** (`steadyCapSec(row)` becomes the single owner of the steady ceiling; every NRC recovery and non-race long run now PRINTS the ceiling it was already being graded against and carries `dose.cap`), **D118** (the goal change preserves the anchor), **D119** (the `edited` provenance form, guard widened against a malformed `mileBestSrc`) and **D120** (the suite's last two hardcoded HALF_MANNY digests become era rows). GREEN: **32 gate files, PASS 1730 FAIL 0** (V202 baseline 1470); sabotage **15/15 TRIPPED, 0 NOT-APPLIED, 0 CRASH** plus 2 non-artifact D120 cases proven separately; blast radius **15 hunks 100% classified, 0 unruled removals**; differential fuzz **432 configs / 32,760 day-records / 0 violations**, all **8,136** differing records classed `D117_ceiling_sentence` and **zero `sections` differences**, which is the positive proof that D116/D118/D119 move no build. Two defects found in the TESTS themselves: a gate that **crashed** under its own mutation and scored as a trip while evaluating nothing, and a mutation that made a render THROW so a negative row stayed green for a hollow reason. Flagged, not fixed: a `new Date` UTC off-by-one at `:2991`, `:13740` and in the D116 popup (§12).

"""
rep("- **V202 — the NSW test-goal run path, and the session that found there are TWO Physical",
    DIGEST + "- **V202 — the NSW test-goal run path, and the session that found there are TWO Physical",
    'E6 digest line above V202')

io.open(P, "w", encoding="utf-8").write(s)
print("PART B WRITTEN")
