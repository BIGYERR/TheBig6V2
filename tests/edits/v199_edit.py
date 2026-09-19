#!/usr/bin/env python3
# V199 — D91: recoveryDeload keeps its ONE surviving accessory block by PATTERN,
# not by push order. Four edits + the version bump (last).
# Every anchor asserted count==1; the script aborts on the first miss and writes nothing.
import sys, io

P = 'index.html'
src = io.open(P, encoding='utf-8').read()
orig = src

R = []  # (tag, old, new)

# ── EDIT 1 — ONE WRITER FOR THE LENS ────────────────────────────────────────────────
# Module-level FUNCTION DECLARATION (not const: §10b — top-level let/const do not land on
# the VM context, and the hoist must be unconditional). Hoisted immediately above
# recoveryDeload's comment block. There is exactly one in-app copy of this lens.
A1 = "// ── RECOVERY-WEEK VOLUME DELOAD ─────────────────────────────────────────────\n"
N1 = ("// ── POSTERIOR-CHAIN LENS (single writer) ────────────────────────────────────\n"
      "// D85 shipped this lens inside capSessionBudget; D91 needs the same lens in\n"
      "// recoveryDeload. It is HOISTED, not copied — two in-app copies of \"what counts as\n"
      "// posterior chain\" is exactly the desync §10b warns about. THE SET IS {hinge,\n"
      "// hip_ext} AND NOTHING ELSE; leg_iso is deliberately outside it (EXLIB\n"
      "// .leg_accessory mixes 'Leg extension' and 'Leg press' in with 'Lying leg curl').\n"
      "// _pattern is called directly so this lens and the region caps can never disagree.\n"
      "function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; }\n"
      "\n") + A1
R.append(('E1 hoist _isPostChain', A1, N1))

# ── EDIT 2 — the capSessionBudget local becomes an ALIAS ─────────────────────────────
# Moved, not redefined. The call site below (…_postLeft<=1 && _isPost(it.name)…) is
# left byte-identical.
A2 = "  const _isPost=n=>{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; };\n"
N2 = "  const _isPost=_isPostChain;                            // D91: hoisted above recoveryDeload — ONE writer for the lens\n"
R.append(('E2 alias _isPost', A2, N2))

# ── EDIT 3 — the pre-pass ────────────────────────────────────────────────────────────
A3 = "  const keep=[]; let accessoryKept=false;\n"
N3 = A3 + (
"  // D91: the surviving accessory block is chosen by PATTERN, not by push order. The\n"
"  // builder pushes 'Leg superset A' (lunge + knee hold, a unilateral SQUAT pattern) before\n"
"  // 'Leg superset B' (the day's hinge/hip_ext), so first-come cost every deload leg day its\n"
"  // posterior chain by arithmetic. This pre-pass runs the loop's OWN four tests, in the\n"
"  // loop's own order, so an index can only be picked if the loop below would also have\n"
"  // reached its accessory branch — that is what guarantees exactly one block still survives.\n"
"  // MAIN/PRIMER/POWER/STRENGTH ARE SKIPPED, NOT SCORED. A posterior 'Main — Deadlift' must\n"
"  // not influence the arbitration: 14.10% of cards carry a posterior main and no posterior\n"
"  // accessory, and a naive all-sections pre-pass would leave those cards no accessory at all.\n"
"  // Prehab is never a candidate (always kept by the loop); fluff is never a candidate\n"
"  // (always dropped). NOTHING IS REORDERED — keep.push order stays forEach order.\n"
"  let pickIdx=-1;\n"
"  for(let i=0;i<sections.length;i++){\n"
"    const s=sections[i]; if(!s) continue;\n"
"    const L=(s.label||'').toLowerCase();\n"
"    if(/^main\\b|^primer|^power\\b|^strength\\b/.test(L)) continue;               // main work: never a candidate\n"
"    if(s.hip||/hip|mobility|stretch/.test(L)) continue;                          // prehab: always kept anyway\n"
"    if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) continue;     // fluff: always dropped anyway\n"
"    if(!(s.items||[]).some(it=>it&&_pattern(it.name))) continue;                  // the loop's own hasLift test\n"
"    if((s.items||[]).some(it=>it&&_isPostChain(it.name))){ pickIdx=i; break; }    // first posterior accessory block wins\n"
"  }\n")
R.append(('E3 pre-pass', A3, N3))

# ── EDIT 4 — the iterator index and the keep test ────────────────────────────────────
A4 = "  sections.forEach(s=>{\n    if(!s) return;\n    const L=(s.label||'').toLowerCase();\n"
N4 = "  sections.forEach((s,i)=>{\n    if(!s) return;\n    const L=(s.label||'').toLowerCase();\n"
R.append(('E4a forEach index', A4, N4))

A5 = "    if(hasLift&&!accessoryKept){ accessoryKept=true; keep.push(s); return; }      // exactly ONE accessory block survives\n"
N5 = "    if(hasLift&&!accessoryKept&&(pickIdx<0||i===pickIdx)){ accessoryKept=true; keep.push(s); return; }  // exactly ONE accessory block survives; D91 picks the posterior one when the card has one\n"
R.append(('E4b keep test', A5, N5))

# ── VERSION BUMP — LAST ──────────────────────────────────────────────────────────────
A6 = '<meta name="ia-version" content="198">'
N6 = '<meta name="ia-version" content="199">'
R.append(('V bump 198->199', A6, N6))

for tag, old, new in R:
    c = src.count(old)
    if c != 1:
        sys.exit('ABORT: anchor %-24s count==%d (expected 1). Nothing written.' % (tag, c))
    src = src.replace(old, new, 1)
    print('ok  %-24s applied' % tag)

if src == orig:
    sys.exit('ABORT: no change produced.')
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s  %d -> %d bytes' % (P, len(orig), len(src)))
