#!/usr/bin/env python3
# V222 slice 3' (resumes parked slice 3) — D181 (P-SWAPDURABLE), SECOND RE-RULING R4' + two comments.
# Ruling: tests/measure/v212_rulings/p_swapdurable_ruling.md, "SECOND RE-RULING ON V222 PARKED SLICE 3
# (chain detail, snapshot re-apply)", MARIO DECISION: ship R1 + R2 + R3' + R4' + R5.
# Supersedes parked slice 3's E8 (composed map) and E9 (pruneDayEdits comment). E10 and E11 stand.
#   E12 (C4) R4': applySessionSwaps replays one day's records in array (= recording) order, one
#             one-entry map per applySwapPrefs pass; injury re-filter once if any pass hit.
#   E13 (C4) applySessionSwaps header comment: no longer claims idempotence.
#   E14 (C3) pruneDayEdits comment: the ruled R5/R1 text; "idempotent against a snapshot" gone.
# ia-version is already 222 (slice 3's E11); this script does not touch it.
# Every anchor asserted count==1 before anything is written; the first miss aborts the script.
import re, sys, pathlib

P = pathlib.Path(__file__).resolve().parents[2] / 'index.html'
src = P.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def strip_comments(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    s = re.sub(r'(?m)^\s*//.*$', '', s)
    s = re.sub(r'(?m)(?<=[;{})\s])\s*//(?!/).*$', '', s)
    return s

PARKED_MAP = ("    list.forEach(r=>{let cur=r.from;list.forEach(e=>{if(e.from===cur)cur=e.to;});"
              "map[r.from]=cur;});\n")

# ── precondition: slices 1, 2 and parked 3 are in the tree ──
code = strip_comments(src)
pre = [
    ('<meta name="ia-version" content="222">', 1, src),
    ('<meta name="ia-version" content="221">', 0, src),
    ('resnapshotDayEdit(currentWeek,currentDayKey);', 3, code),
    ('if(dk) snapshotDay(w, dk);', 1, code),
    ('pruneSwaps', 0, src),
    (PARKED_MAP, 1, src),
]
for tok, n, hay in pre:
    c = hay.count(tok)
    if c != n: die('precondition %r count %d, want %d' % (tok, c, n))

EDITS = [
  ("E12 C4 R4' applySessionSwaps per-record replay",
   "    // V222 D181 (R4). Records on one day compose in recording order, so a second swap on\n"
   "    // one slot resolves to the athlete's last choice.\n"
   "    const list=(store[k]||[]).filter(e=>e&&e.from&&e.to);\n"
   "    const map=Object.create(null);\n"
   + PARKED_MAP +
   "    if(applySwapPrefs(day.sections,map) && prog.cfg && prog.cfg.injury){\n"
   "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n"
   "    }\n",
   "    // V222 D181 (R4'). Records replay in recording order, one per pass, through the same\n"
   "    // _swapDetailFor the sheet used, so each hop's detail comes from the hop before it.\n"
   "    const list=(store[k]||[]).filter(e=>e&&e.from&&e.to);\n"
   "    let hit=false;\n"
   "    list.forEach(e=>{\n"
   "      const m1=Object.create(null); m1[e.from]=e.to;\n"
   "      if(applySwapPrefs(day.sections,m1)) hit=true;\n"
   "    });\n"
   "    if(hit && prog.cfg && prog.cfg.injury){\n"
   "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n"
   "    }\n"),
  ('E13 C4 applySessionSwaps header comment',
   "// Re-applied at the very end of refreshProgram, after the freeze, alongside rest-day\n"
   "// moves — both are the athlete's own edits, so nothing the engine does should undo\n"
   "// them. Idempotent: a frozen week already carrying the swap has no name left to\n"
   "// match, so a second pass is a no-op rather than a double-apply.\n"
   "function applySessionSwaps(prog,store){\n",
   "// Re-applied at the very end of refreshProgram, after the freeze, alongside rest-day\n"
   "// moves — both are the athlete's own edits, so nothing the engine does should undo\n"
   "// them. V222 D181 (R4'): a day's records replay in recording order (array order, which\n"
   "// recordSwap keeps by push) through the same _swapDetailFor the sheet used, so the booted\n"
   "// card is the card the athlete built. Days the freeze restored from ia_hist_ never reach\n"
   "// this function (R5).\n"
   "function applySessionSwaps(prog,store){\n"),
  ('E14 C3 pruneDayEdits comment',
   "// applySessionSwaps is idempotent against a snapshot (no donor name left on the day, so a\n"
   "// second pass is a no-op). applyDayEdits is not: it rewrites every item's _skipped from the\n"
   "// store and pushes adds deduped by name only. So on a touched week this prune is what keeps\n"
   "// the store from arguing with a record that resnapshotDayEdit has already folded the edit into.\n"
   "function pruneDayEdits(pid,cutWeek){\n",
   "// Session swaps are never applied to a day restored from ia_hist_ (V222 D181 R5), because\n"
   "// the snapshot carries the athlete's swaps by construction (R1) and re-applying a record\n"
   "// onto it rewrites the day whenever one record's `to` is another's `from`. applyDayEdits\n"
   "// has no such exclusion and is not idempotent (it rewrites every item's _skipped from the\n"
   "// store and pushes adds deduped by name only), so on a touched week this prune is what\n"
   "// keeps the store from arguing with a record resnapshotDayEdit has already folded the\n"
   "// edit into.\n"
   "function pruneDayEdits(pid,cutWeek){\n"),
]

for tag, a, b in EDITS:
    c = src.count(a)
    if c != 1: die('%s anchor count %d' % (tag, c))

out = src
for tag, a, b in EDITS:
    if out.count(a) != 1: die('%s anchor count moved to %d mid-script' % (tag, out.count(a)))
    out = out.replace(a, b, 1)
    print('OK ' + tag)

# ── postconditions ──
post = [
    ('idempotent against a snapshot', 0, out),
    ('V222 D181 (R4).', 0, out),
    ("V222 D181 (R4')", 2, out),
    (PARKED_MAP, 0, out),
    ('const map=Object.create(null);', 0, out[out.index('function applySessionSwaps('):out.index('// ── COACH NUDGE')]),
    ('Idempotent', 0, out[out.index('function applyDayEdits('):out.index('// ── COACH NUDGE')]),
    ('if(applySwapPrefs(day.sections,m1)) hit=true;', 1, out),
    ('<meta name="ia-version" content="222">', 1, out),
    ('pruneSwaps', 0, out),
    ('resnapshotDayEdit(currentWeek,currentDayKey);', 3, strip_comments(out)),
    ('if(dk) snapshotDay(w, dk);', 1, strip_comments(out)),
]
for tok, n, hay in post:
    c = hay.count(tok)
    if c != n: die('postcondition %r count %d, want %d' % (tok, c, n))

P.write_text(out, encoding='utf-8')
print('WROTE', P, len(out) - len(src), 'chars')
