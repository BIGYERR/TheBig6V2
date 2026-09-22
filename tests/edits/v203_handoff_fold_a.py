# -*- coding: utf-8 -*-
# V203 handoff fold, part A: elements 1, 2, 3.
import io, sys
P = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"
s = io.open(P, encoding="utf-8").read()
def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, "ANCHOR %s count==%d (need 1)" % (tag, n)
    s = s.replace(old, new, 1)
    print("ok  " + tag)

# ---------- ELEMENT 1 ----------
V203_BUILT = ("**V203 BUILT the athlete's own pace row: D116 (a pencil on the Run paces group opens a sheet that "
"writes `mileBestMins`/`mileBestSecs` directly — the anchor had five write sites, all of them wizard draft, so it "
"could not be changed after creation; the value goes in as typed with no snap, no one-row cap and no cooldown, and a "
"race-week lock at `_goalCurWeek(p) >= (p.totalWeeks||6) - 2` opens an explaining popup instead of the sheet, "
"evaluated at tap and not at render), D117 (every NRC recovery run and non-race long run now prints a ceiling and "
"carries `dose.cap`, computed by the new `steadyCapSec(row)` = `round((tempo+recovery)/2)`, which is now the single "
"owner — run_base's two inline copies re-pointed output-identically and `_steadyCeilingFor` demoted in comment to a "
"pre-V203 `ia_hist_` fallback; the Progress chart had been grading NRC easy runs against a ceiling the card never "
"printed), D118 (`commitGoalChange` carries `mileBestMins`/`mileBestSecs`/`mileBestSrc` across a run goal change — it "
"had dropped all three since D5, so a switch out and back rebuilt the athlete on the 9:30 intermediate default, 51/56 "
"cardio cards faster than he is, under a sentence claiming no mile time was entered), D119 (the `edited` provenance "
"form, with a widened guard so a malformed `mileBestSrc` cannot render \"no mile time was entered\" about an athlete "
"who entered one) and D120 (`g200_core_tier`'s F1a/F1b, the last two hardcoded HALF_MANNY digests in the suite, "
"became era rows; new `MANNY_CORE_OFF_DIGEST_BY_VERSION` starting at 200).** ")

rep('- **Working file:** `index.html` — **V202**; `<meta name="ia-version">`=**202**. Built in order after V201. **V202 BUILT',
    '- **Working file:** `index.html` — **V203**; `<meta name="ia-version">`=**203**. Built in order after V202. ' + V203_BUILT + '**V202 BUILT',
    'E1 working-file version + V203 BUILT')

# D11 is overturned by D116 (Mario rejected the evidence-gated sheet); it is no longer open.
rep('Open: D45 (retest-strip pace formatter, §12), D11 (evidence-gated re-anchor), the odd-object',
    'Open: D45 (retest-strip pace formatter, §12), the odd-object',
    'E1 drop D11 from the Open list')

MRW203 = ("""- **Most recent work (V203): the mile the athlete could not change, and the easy-run ceiling the card never printed.** The anchor the whole run path keys on had **five write sites, every one of them a wizard draft**, so once a program existed there was no way to change it. **D116** puts a pencil on the Run paces group: it opens a sheet that writes `mileBestMins`/`mileBestSecs` directly, and the value goes in **as typed** — no snap to a chart column, no one-row cap, no cooldown — interpolating exactly as a wizard entry does. A race-week lock at `_goalCurWeek(p) >= (p.totalWeeks||6) - 2` opens an explaining popup instead of the sheet, and it is **evaluated at tap, not at render**, so a screen left open across the boundary still locks. **D117** gives the steady ceiling one owner, the new `steadyCapSec(row)` = `round((tempo+recovery)/2)`: every NRC recovery run and every non-race long run now prints the ceiling and carries `dose.cap`, run_base's two inline copies were re-pointed **output-identically**, and `_steadyCeilingFor` is demoted in comment to a fallback for `ia_hist_` snapshots frozen before V203. Until now the Progress chart was grading NRC easy runs against **a ceiling the card never printed**. **D118** stops `commitGoalChange` dropping `mileBestMins`/`mileBestSecs`/`mileBestSrc`; it had dropped all three since D5, so switching a run goal out and back rebuilt the athlete on the **9:30 intermediate default** — **51/56** cardio cards faster than he is — under a sentence telling him no mile time was entered. **D119** adds the `edited` provenance form and widens the guard so a malformed `mileBestSrc` cannot render "no mile time was entered" about an athlete who entered one. **D120** turns `g200_core_tier`'s F1a/F1b, the last two hardcoded HALF_MANNY digests in the suite, into era rows under a new `MANNY_CORE_OFF_DIGEST_BY_VERSION` starting at 200. GREEN on the final artifact: **32 gate files, PASS 1730 FAIL 0** (V202 baseline 1470, 0 red); sabotage **15/15 TRIPPED, 0 NOT-APPLIED, 0 CRASH**, plus **2 non-artifact D120 cases proven separately** (43/0 control, 42/1 each, F1a red and F1b green); blast radius **15 hunks, 100% classified, 0 unruled removals**; differential fuzz **432 configs / 32,760 day-records / 0 violations**, all **8,136** differing records classed `D117_ceiling_sentence` with **zero `sections` differences** — the positive proof that D116, D118 and D119 move no build. Era rows: `MANNY_DIGEST_BY_VERSION[203]='7d4f7ed45cc5bd53'`, `MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203]='8fe23ae9eadde78c'`, `MANNY_CORE_OFF_DIGEST_BY_VERSION[203]='658ad56c903ad829'`, all three reproduced independently by gatekeeper from the V199–V202 tag artifacts. **Flagged, not fixed:** a `new Date(...)` UTC off-by-one at `:2991`, `:13740` and in the D116 popup, which renders a race date a day early and a days-out count one short (§12).

""")
rep('- **Most recent work (V202): the NSW test-goal run path',
    MRW203 + '- **Prior work (V202): the NSW test-goal run path',
    'E1 insert V203 lead + demote V202')

# ---------- ELEMENT 2 ----------
rep("""| `ia_hist_<id>` (V104) | `w3_thu` |""",
    """| `ia_hist_<id>` (V104) | `w3_thu` |""".replace('X','X'),
    'E2 noop guard') if False else None

S4 = ("""
**`mileBestSrc` has a THIRD kind, `edited` (V203, D116/D118/D119).** The provenance stamp on the mile anchor was `wizard` or `seeded`; an anchor written by the D116 pencil stamps `edited` and carries `at` (timestamp), `wk` (the program week it was written in) and `from` (the anchor it replaced). **`from` is always emitted**, including when the value it replaced was the 9:30 intermediate default, so the record can never imply the athlete chose a number the app chose for him. **A run goal change now PRESERVES the anchor:** `commitGoalChange` carries `mileBestMins`, `mileBestSecs` and `mileBestSrc` across the change — it had dropped all three since D5. `baseline` and `baselineDist` are still dropped exactly as D5 wrote them; they describe the block being left, not the athlete.
""")
rep("""\n## 5. Current engine behavior\n""", S4 + """\n## 5. Current engine behavior\n""", 'E2 §4 mileBestSrc edited')

rep("ceiling = `(tempo+recovery)/2` — the Steady Aerobic pace",
    "ceiling = `steadyCapSec(row)` = `round((tempo+recovery)/2)` (V203 D117 made this the single owner; the value is unchanged) — the Steady Aerobic pace",
    'E2 §5 run_base ceiling re-points to steadyCapSec')

S5 = ("""
- **`steadyCapSec(row)` is the SINGLE OWNER of the steady ceiling (V203, D117).** One function, `round((tempo+recovery)/2)` off the athlete's own `PACE_CHART` row. Every NRC **recovery run** now ends `Do not run faster than <pace>.` and every **non-race long run** ends `Average no faster than <pace>.` — the ceiling is on the AVERAGE there because Nike's long-run progression finishes faster than recovery pace **by definition**, so a hard cap would contradict the session it is printed on. **Race day, time trial, Speed, Fartlek and Hills carry no ceiling at all**; a ceiling on a quality session is a contradiction. The two surviving inline `(tempo+recovery)/2` at `:3863`/`:3867` are run_base **CHI targets, not ceilings**, and are RULED to stay separate so a future change to the ceiling cannot silently move a prescription (§12 carries the open coaching question of whether "steady pace" is one concept or two).
""")
rep("""\n## 5b. Injury overlays""", S5 + """\n## 5b. Injury overlays""", 'E2 §5 steadyCapSec bullet')

S8 = ("""
**`dose.cap` is written by EVERY NRC easy card, not only the time-dosed run_base branch (V203, D117).** Before V203 the cap rode only on run_base's `{k:'time', mins, tgt, cap}`, so the Progress module was grading NRC recovery and long runs against a ceiling the card never printed. **`easyVsPrescribed`'s population is unchanged** — entry is gated on `tgt>0` and the fallback already returned a positive number — so what moved is only WHICH arm supplies the number, never how many runs are graded. **`_steadyCeilingFor` is now a self-expiring fallback:** it serves `ia_hist_` snapshots frozen before V203 that carry no `dose.cap`, its comment says exactly that, and no new day reaches it.
""")
rep("""\n## 8b. Exercise swap (V102)""", S8 + """\n## 8b. Exercise swap (V102)""", 'E2 §8 dose.cap')

rep("Concurred. Four forms; the seeded form names",
    "Concurred. Four forms (a FIFTH, `edited`, was added at V203 D119); the seeded form names",
    'E2 provenance form count')

# ---------- ELEMENT 3 ----------
S10B = ("""- **A width-truncated grep is a label, not evidence (V203).** `grep | cut -c1-N` over `index.html` will miss a call site that sits inside a long template literal and report a rendered function as dead code. Ask `grep -c` for the bare symbol and reconcile the count against what the truncated view showed. Coach cut a ruling on "this function is never called"; it was called at `:13629`, and its false sentence was shipping.
- **Re-verify HEAD, `ia-version` and the D-code registry immediately before EVERY builder dispatch, not only at `session-start` (V203).** A baseline proved at minute zero can be several versions stale by the time a measure-then-rule cycle finishes. A concurrent session shipped and tagged V202 mid-design and took D100–D103 with it; the first build parked under standing ruling 7 and the whole ruling was re-cut.
- **A gate that CRASHES under its own sabotage mutation scores as a trip while evaluating nothing (V203).** A gate must survive reading the malformed shape its own ruling says the app must survive. `g203_mile_pencil` dereferenced `mileBestSrc.from` blind and died under its own M2 — a green sweep line for a gate that never ran an assertion.
- **A mutation that makes a render THROW is not a mutation that makes it print the wrong thing (V203).** A sentence that throws prints nothing, so a negative row asserting "does not print X" stays green for a hollow reason. Pair every negative row with a row asserting the surface actually rendered. Shipped as two separate mutations (M12/M13) plus a "did not throw" row, because one mutation covering two guards cannot tell them apart.
- **`sabotage.py` mutates ONLY the candidate artifact (V203).** A case that targets the harness or a gate file cannot ride the sweep. Prove it directly and record it under an ignored key, rather than contorting it into a shape the runner will report NOT-APPLIED — a NOT-APPLIED row is indistinguishable from a broken anchor. D120's two cases are the worked example.

""")
rep("""\n## 11. Resolved bugs""", "\n" + S10B + """## 11. Resolved bugs""", 'E3 §10b five bullets')

io.open(P, "w", encoding="utf-8").write(s)
print("PART A WRITTEN")
