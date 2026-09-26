#!/usr/bin/env python3
# V222 slice 3 of 3 — D181 (P-SWAPDURABLE), re-ruling R4 + two comment rewrites + ia-version bump.
# Ruling: tests/measure/v212_rulings/p_swapdurable_ruling.md, "RE-RULING ON V221 (measure refutations)".
#   E8  (C4) R4: applySessionSwaps map build composes one day's records in recording order.
#   E9  (C3) pruneDayEdits comment: coach's rationale, no longer cites pruneSwaps.
#   E10 (C1) add/skip banner comment: add, skip, swap and undo all take the resnapshot step.
#   E11 (C5) <meta name="ia-version"> 221 -> 222 (last replacement).
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

# ── precondition: slices 1 and 2 are in the tree ──
code = strip_comments(src)
pre = [
    ('resnapshotDayEdit(currentWeek,currentDayKey);', 3, code),
    ('if(dk) snapshotDay(w, dk);', 1, code),
    ('pruneSwaps', 0, code),
    ('<meta name="ia-version" content="221">', 1, src),
]
for tok, n, hay in pre:
    c = hay.count(tok)
    if c != n: die('precondition %r count %d, want %d' % (tok, c, n))

EDITS = [
  ('E8 C4 R4 applySessionSwaps composition',
   "    const map=Object.create(null);\n"
   "    (store[k]||[]).forEach(e=>{if(e&&e.from&&e.to)map[e.from]=e.to;});\n"
   "    if(applySwapPrefs(day.sections,map) && prog.cfg && prog.cfg.injury){\n",
   "    // V222 D181 (R4). Records on one day compose in recording order, so a second swap on\n"
   "    // one slot resolves to the athlete's last choice.\n"
   "    const list=(store[k]||[]).filter(e=>e&&e.from&&e.to);\n"
   "    const map=Object.create(null);\n"
   "    list.forEach(r=>{let cur=r.from;list.forEach(e=>{if(e.from===cur)cur=e.to;});map[r.from]=cur;});\n"
   "    if(applySwapPrefs(day.sections,map) && prog.cfg && prog.cfg.injury){\n"),
  ('E9 C3 pruneDayEdits comment',
   "// Same rationale as pruneSwaps: once a week is frozen the edit is baked into the stored\n"
   "// week, so keeping the record risks re-applying it against a week the engine reshaped.\n"
   "function pruneDayEdits(pid,cutWeek){\n",
   "// applySessionSwaps is idempotent against a snapshot (no donor name left on the day, so a\n"
   "// second pass is a no-op). applyDayEdits is not: it rewrites every item's _skipped from the\n"
   "// store and pushes adds deduped by name only. So on a touched week this prune is what keeps\n"
   "// the store from arguing with a record that resnapshotDayEdit has already folded the edit into.\n"
   "function pruneDayEdits(pid,cutWeek){\n"),
  ('E10 C1 add/skip banner comment',
   "// Every mutation follows the same three steps as the swap handlers: mutate the live day,\n"
   "// write the store, re-render. The extra step here is resnapshotDayEdit — if the athlete\n"
   "// has already logged something, ia_hist_ holds the snapshot and the freeze restores from\n"
   "// it, so an edit that is not folded into the snapshot silently vanishes on the next boot.\n",
   "// Every mutation follows the same steps as the swap handlers: mutate the live day, write\n"
   "// the store, resnapshotDayEdit, re-render. Add, skip, swap and undo all take the resnapshot\n"
   "// step — if the athlete has already logged something, ia_hist_ holds the snapshot and the\n"
   "// freeze restores from it, so an edit that is not folded into the snapshot silently vanishes\n"
   "// on the next boot.\n"),
  ('E11 C5 ia-version bump',
   '<meta name="ia-version" content="221"><!-- SINGLE SOURCE OF TRUTH',
   '<meta name="ia-version" content="222"><!-- SINGLE SOURCE OF TRUTH'),
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
if out.count('pruneSwaps') != 0: die('pruneSwaps still present (code or comment)')
if out.count('ia-version" content="222"') != 1: die('version meta not 222')
if strip_comments(out).count('resnapshotDayEdit(currentWeek,currentDayKey);') != 3: die('slice 1 calls moved')
P.write_text(out, encoding='utf-8')
print('WROTE', P, len(out) - len(src), 'chars')
