#!/usr/bin/env python3
# V201 — D94. A posterior Main suppresses the D91 deload pre-pass entirely.
#
# Ruling (coach, V201, ruled on measure): on a deload PULL day the Main is a deadlift
# variant by construction (index.html:8202), so the day's hip extension is already on the
# card and is the heaviest thing on it. D91's pre-pass then scores 'Pull superset B' above
# 'A' because an ex.cond[2] CONDITIONING draw happened to be a 'Kettlebell swing', and
# deletes the day's only vertical pull. Measured: 135/135 L-healthy cards carry a posterior
# Main and 135/135 ship with ZERO vertical pull.
#
# Shipped text is measure's mutant C, VERBATIM — the counterfactual was run against it.
# Slices 2 and 3 do the g200 re-pin and the sabotage spec; nothing here touches g200.
#
# Anchors are asserted count==1 before any write. First miss aborts the whole script.
# Version meta bump is LAST.

import sys, io

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

with io.open(PATH, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

orig_len = len(src)
reps = []

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 1 — the suppression clause. Verbatim from the ruling.
#          Uses _isPostChain (single writer, :9388). No second lens introduced.
# ─────────────────────────────────────────────────────────────────────────────
A1_OLD = (
    "  let pickIdx=-1;\n"
    "  for(let i=0;i<sections.length;i++){\n"
)
A1_NEW = (
    "  let pickIdx=-1;\n"
    "  const __mainPost=sections.some(s=>s&&/^main\\b|^primer|^power\\b|^strength\\b/.test((s.label||'').toLowerCase())&&(s.items||[]).some(it=>it&&_isPostChain(it.name)));\n"
    "  for(let i=0;i<sections.length&&!__mainPost;i++){\n"
)
reps.append(('E1 pre-pass suppression clause', A1_OLD, A1_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 2 — the comment block is now half true. It said MAIN/PRIMER/POWER/STRENGTH
#          ARE SKIPPED, NOT SCORED. That remains true of CANDIDACY and is false as a
#          whole statement once a posterior Main suppresses the pass. Rewrite, name D94,
#          and state the pool/post-filter rule explicitly: same lens on both sides.
#          Literal bytes for the em-dash in 'Main — Deadlift'.
# ─────────────────────────────────────────────────────────────────────────────
A2_OLD = (
    "  // MAIN/PRIMER/POWER/STRENGTH ARE SKIPPED, NOT SCORED. A posterior 'Main — Deadlift' must\n"
    "  // not influence the arbitration: 14.10% of cards carry a posterior main and no posterior\n"
    "  // accessory, and a naive all-sections pre-pass would leave those cards no accessory at all.\n"
)
A2_NEW = (
    "  // MAIN/PRIMER/POWER/STRENGTH ARE SKIPPED AS CANDIDATES, AND A POSTERIOR MAIN SUPPRESSES\n"
    "  // THE PRE-PASS ENTIRELY (V201, D94). Those are two different claims and both are load-bearing.\n"
    "  // Skipped as candidates is D91: a posterior 'Main — Deadlift' must not WIN the arbitration,\n"
    "  // because 14.10% of cards carry a posterior main and no posterior accessory, and a naive\n"
    "  // all-sections pre-pass would leave those cards no accessory at all. But it must still be\n"
    "  // SEEN, which is D94: on a deload PULL day the Main is a deadlift variant by construction,\n"
    "  // so the day's hip extension is already on the card and is the heaviest thing on it. Scoring\n"
    "  // an accessory block up for a stray conditioning 'Kettlebell swing' then deleted the day's\n"
    "  // only vertical pull on 135/135 measured L-healthy cards. When __mainPost is true the loop\n"
    "  // never runs, pickIdx stays -1, and the forEach below falls back to push order — exactly one\n"
    "  // accessory block still survives, so the zero-posterior trap D91 closed stays closed.\n"
    "  // SAME LENS (_isPostChain) ON BOTH SIDES, per the pool/post-filter rule: the test that makes\n"
    "  // a block a candidate and the test that suppresses the pre-pass can never disagree.\n"
)
reps.append(('E2 D91/D94 comment block', A2_OLD, A2_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 3 — version meta. LAST replacement, per procedure. 200 -> 201, bump of exactly one.
# ─────────────────────────────────────────────────────────────────────────────
A3_OLD = '<meta name="ia-version" content="200">'
A3_NEW = '<meta name="ia-version" content="201">'
reps.append(('E3 ia-version 200 -> 201', A3_OLD, A3_NEW))

# ── assert every anchor count==1 BEFORE writing anything; abort on first miss ──
for name, old, new in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %s matched %d times (expected exactly 1). No write.\n' % (name, n))
        sys.exit(1)
    if new in src:
        sys.stderr.write('ABORT: anchor %s replacement text already present. No write.\n' % name)
        sys.exit(1)

for name, old, new in reps:
    src = src.replace(old, new, 1)
    print('OK  %s' % name)

with io.open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(src)

print('wrote %s  %d -> %d bytes (+%d)' % (PATH, orig_len, len(src), len(src) - orig_len))
