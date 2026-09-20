#!/usr/bin/env python3
# V200 D93 slice 1 of 3 — TOOLING ONLY. index.html is NOT touched and ia-version stays 199.
#
# PIECE A  tests/measure/v199_gk_blockcount.js : the accessory-family regex learns the bare
#          `Pull` / `Push` renames that singletonSupersetSweep (index.html:10010) writes.
# PIECE B  tests/gates/g199_deload_arbitration.js : pull-label plumbing only. NO assertions.
#          LABELS at :118 is left ALONE so every F/G/H/I number stays byte-identical; the
#          pull family gets its OWN list (PLABELS) and its OWN counters.
#
# Every anchor asserted count==1; first miss aborts before anything is written.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(ROOT)
MEAS = os.path.join(ROOT, 'tests', 'measure', 'v199_gk_blockcount.js')
GATE = os.path.join(ROOT, 'tests', 'gates', 'g199_deload_arbitration.js')

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

EDITS = []   # (path, old, new, tag)

# ── PIECE A ────────────────────────────────────────────────────────────────────
A_OLD = "const ACC=/^(Leg superset [AB]|Leg|Leg isolation|Pull superset [AB]|Push superset [AB])$/;"
A_NEW = (
    "// D93: the bare `Pull` and `Push` alternatives are singletonSupersetSweep's renames of a\n"
    "// superset trimmed to one item (index.html:10010). Without them this lens reported 90\n"
    "// spurious GAINS of 145,152 cards, all 90 on shoulder/protect — a 1-block card read as\n"
    "// 1 block before and 1 after, but the LABEL had left the family. With them the same\n"
    "// lattice reads 60,333 -> 60,333: 0 gained, 0 lost, 3,807 swapped.\n"
    "const ACC=/^(Leg superset [AB]|Leg|Leg isolation|Pull superset [AB]|Pull|Push superset [AB]|Push)$/;"
)
EDITS.append((MEAS, A_OLD, A_NEW, 'A1 accessory-family regex learns bare Pull/Push'))

# ── PIECE B, edit 1: the pull family gets its own list, LABELS untouched ───────
B1_OLD = "const LABELS=['Leg superset A','Leg superset B','Leg isolation','Explosive finisher'];\n"
B1_NEW = (
    "const LABELS=['Leg superset A','Leg superset B','Leg isolation','Explosive finisher'];\n"
    "// D93 (V200) — PULL SIDE. Its OWN list and its OWN counters: LABELS drives lblP1all/\n"
    "// lblP2all, which F1-F3c, G1-G5, H5 and I3 are pinned to, so adding a pull label there\n"
    "// would silently move every one of those numbers. Three labels, not two: the bare `Pull`\n"
    "// is what singletonSupersetSweep (index.html:10010) leaves when a superset is trimmed to\n"
    "// one item and loses its partner. That sweep runs POST-BUILD over weeks (index.html:9895),\n"
    "// downstream of p1/p2/p3, so `Pull` is expected to read 0 in the STAGE census and to be\n"
    "// the only place it appears is the SHIPPED-card census. Both are captured below.\n"
    "const PLABELS=['Pull superset A','Pull superset B','Pull'];\n"
)
EDITS.append((GATE, B1_OLD, B1_NEW, 'B1 PLABELS list beside LABELS'))

# ── PIECE B, edit 2: counters ─────────────────────────────────────────────────
B2_OLD = "  swapPop:0,swapBoth:0,swapReCap:0,swapReBudget:0,capLSBin:0,capLSBkilled:0,\n"
B2_NEW = (
    "  swapPop:0,swapBoth:0,swapReCap:0,swapReBudget:0,capLSBin:0,capLSBkilled:0,\n"
    "  pullP1all:{},pullP2all:{},pullShipAll:{},pullP1:{},pullP2:{},pullBothP1:0,pullSwapCensus:{},\n"
)
EDITS.append((GATE, B2_OLD, B2_NEW, 'B2 pull counters in blank()'))

# ── PIECE B, edit 3: the census itself. ONE block at the all-day-builds seam, so the
# deload-only half is guarded by `if(r.dl)` rather than needing a second anchor below
# `if(!r.dl) return;`. Nothing here reads _isPostChain or _pattern: posterior is secPost,
# the hand table E_PAT.
B3_OLD = "        LABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.lblP1all,lb); if(hasLab(r.p2,lb)) bump(S.lblP2all,lb); });\n"
B3_NEW = (
    "        LABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.lblP1all,lb); if(hasLab(r.p2,lb)) bump(S.lblP2all,lb); });\n"
    "        // ── D93 pull-side plumbing (no assertion in this slice) ──\n"
    "        // pullP1all/pullP2all: the STAGE record, all day builds — the same denominator and\n"
    "        // the same shape as lblP1all/lblP2all, kept in separate maps.\n"
    "        // pullShipAll: the SHIPPED card, all day builds. This is the only census that can\n"
    "        // see the bare `Pull` rename, and g193_samecard.js:374 already rules that the\n"
    "        // `Pull superset A` LABEL is not asserted to survive to the card, so P2 must ask\n"
    "        // its p1-vs-p2 question of the stage record and never of the shipped card.\n"
    "        // pullP1/pullP2/pullBothP1/pullSwapCensus: DELOAD cards only, a second denominator.\n"
    "        PLABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.pullP1all,lb); if(hasLab(r.p2,lb)) bump(S.pullP2all,lb); });\n"
    "        { const SL=shipLab[r.w+'|'+r.d]||[]; PLABELS.forEach(lb=>{ if(SL.indexOf(lb)>=0) bump(S.pullShipAll,lb); }); }\n"
    "        if(r.dl){\n"
    "          PLABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.pullP1,lb); if(hasLab(r.p2,lb)) bump(S.pullP2,lb); });\n"
    "          // raw facts only, no oracle: which pull block ENTERED holding posterior (hand\n"
    "          // table), and which pull block came OUT. P2/P2b in slice 2 turn this into an\n"
    "          // expected-survivor claim; slice 1 only records it.\n"
    "          if(hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B')){ S.pullBothP1++;\n"
    "            const pst=(lb)=>(r.p1||[]).some(s=>s.l===lb&&secPost(s)>0);\n"
    "            const srv=(lb)=>hasLab(r.p2,lb);\n"
    "            bump(S.pullSwapCensus,'enterPost='+((pst('Pull superset A')?'A':'')+(pst('Pull superset B')?'B':'')||'none')\n"
    "              +' surv='+((srv('Pull superset A')?'A':'')+(srv('Pull superset B')?'B':'')||'none')); }\n"
    "        }\n"
)
EDITS.append((GATE, B3_OLD, B3_NEW, 'B3 pull census in the sweep day loop'))

# ── assert every anchor count==1 BEFORE writing anything ──────────────────────
bufs = {}
for p, old, new, tag in EDITS:
    if p not in bufs:
        bufs[p] = read(p)
    n = bufs[p].count(old)
    if n != 1:
        sys.exit('ABORT %s: anchor count==%d (need 1) in %s' % (tag, n, p))
    bufs[p] = bufs[p].replace(old, new, 1)
    print('ok   %s' % tag)

for p, s in bufs.items():
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)
    print('wrote %s' % p)
print('index.html NOT touched; ia-version unchanged (199)')
