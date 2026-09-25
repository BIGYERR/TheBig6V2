#!/usr/bin/env python3
"""V221 T6a (test files only, 4 edits). index.html is NOT touched.

1-3. tests/harness.js: the three [221] era rows (MANNY_DIGEST, MANNY_DELOAD_OFF_DIGEST, MANNY_CORE_OFF_DIGEST)
     said D177 "adds a _REP_FLOOR row". D177 WIDENS the existing unilateral [6,10] row to also match the literal
     `landmine (reverse lunge|rotational press)` (p_swapfloor_ruling.md, RR2 then RR4). Comment only; the row
     values (= the [220] row) do not change. Wording matches the T5c rows in g197b/g199/g200.
4.   tests/sabotage/v221_d177.json: one new mutation pinning g192's G4c licence. The unilateral row's authored
     literal is loosened to `landmine.*press`; the licence exempts only the literal as one whole alternative, so
     G4c must fail. The runner executes one named gate per mutation: gates/g192_landmine_rotpress.js.
     The other 12 mutations are untouched (asserted after write).

Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
"""
import json, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HARNESS = os.path.join(ROOT, 'tests/harness.js')
SPEC = os.path.join(ROOT, 'tests/sabotage/v221_d177.json')
CAND = sys.argv[1] if len(sys.argv) > 1 else None

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def need1(src, anchor, label):
    n = src.count(anchor)
    print(f'anchor {label}: count={n}')
    if n != 1: die(f'{label} anchor count={n}, want 1')

OLD_CLAUSE = ('ruled UNMOVED (D177 adds a _REP_FLOOR row that scheme() reads and 0 engine cards change: measure '
              '0/1,201,231 on the V220 rebase, tests/measure/v221_rebase_swapfloor.out.txt;')
NEW_CLAUSE = ('ruled UNMOVED (D177 widens the _REP_FLOOR balance row [6,10] to the two loaded landmine lifts, read by '
              'scheme() and _swapDetailFor(), no draw, and moves 0 engine cards, 0/1,201,231 printed by measure on the '
              'V220 rebase (tests/measure/v221_rebase_swapfloor.out.txt) and 0/903,969 by builder;')
ROWS = [
    ('H1 MANNY_DIGEST[221]',            '\nMANNY_DIGEST_BY_VERSION[221] = MANNY_DIGEST_BY_VERSION[220];   // V221 (D177/D178/D179/D180): '),
    ('H2 MANNY_DELOAD_OFF_DIGEST[221]', '\nMANNY_DELOAD_OFF_DIGEST_BY_VERSION[221] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[220];   // V221 (D177/D178/D179/D180): '),
    ('H3 MANNY_CORE_OFF_DIGEST[221]',   '\nMANNY_CORE_OFF_DIGEST_BY_VERSION[221] = MANNY_CORE_OFF_DIGEST_BY_VERSION[220];   // V221 (D177/D178/D179/D180): '),
]

# ── the new mutation (edit 4) ──────────────────────────────────────────────────
MUT_ANCHOR = 'pistol|landmine (reverse lunge|rotational press)/i, [6,10]], // balance caps expressible load'
MUT_REPL   = 'pistol|landmine.*press/i, [6,10]], // balance caps expressible load'
NEW_MUT = {
    "name": "S1-D177 RR4 -> the authored literal in the unilateral [6,10] row loosens to `landmine.*press`: the G4c licence must not cover it",
    "anchor": MUT_ANCHOR,
    "replacement": MUT_REPL,
    "gate": "gates/g192_landmine_rotpress.js",
    "note": "NAMED TRIP: G4c (no loosened landmine-press regex anywhere in live code; the loosened row regex is listed). The V221 licence exempts only the literal `landmine (reverse lunge|rotational press)` as one whole alternative of a _REP_FLOOR regex, so any other landmine-press spelling in the same row still fails. Bycatch: Landmine reverse lunge also loses its floor (g221 G2), not the named gate.",
}
SPEC_TAIL = ('  "note": "NAMED TRIP: G8b (fallback literal, low 8 under max window low 10, Kettlebell swing probe moves). '
             'Not D177 code: it pins the premise G8b states."\n }\n]')

def main():
    h = open(HARNESS, encoding='utf-8').read()
    s = open(SPEC, encoding='utf-8').read()
    orig_muts = json.loads(s)
    if len(orig_muts) != 12: die(f'spec holds {len(orig_muts)} mutations, want 12')

    # ── assert every anchor BEFORE writing anything ──
    for label, head in ROWS:
        need1(h, head + OLD_CLAUSE, label)
    n_old = h.count(OLD_CLAUSE); print(f'old clause total: count={n_old} (want 3)')
    if n_old != 3: die('old clause count != 3')
    need1(s, SPEC_TAIL, 'S4 spec tail (last mutation close)')
    if CAND:
        c = open(CAND, encoding='utf-8').read()
        need1(c, MUT_ANCHOR, 'S4 mutation anchor on candidate')
        if c.replace(MUT_ANCHOR, MUT_REPL) == c: die('S4 mutation is a no-op on the candidate')

    # ── edits 1-3: harness comment wording ──
    for label, head in ROWS:
        h = h.replace(head + OLD_CLAUSE, head + NEW_CLAUSE)
    if h.count(OLD_CLAUSE) != 0 or h.count(NEW_CLAUSE) != 3: die('harness post-condition')

    # ── edit 4: append the mutation (1-space JSON layout of the file) ──
    body = json.dumps(NEW_MUT, ensure_ascii=False, indent=1)          # '{\n "name": ...\n}'
    body = '\n'.join(' ' + L for L in body.split('\n'))                 # one level in
    new_tail = SPEC_TAIL[:-len('\n]')] + ',\n' + body + '\n]'
    s2 = s.replace(SPEC_TAIL, new_tail)
    muts = json.loads(s2)
    if len(muts) != 13: die(f'spec now holds {len(muts)}, want 13')
    if muts[:12] != orig_muts: die('the other 12 mutations changed')
    if muts[12] != NEW_MUT: die('new mutation did not round-trip')

    open(HARNESS, 'w', encoding='utf-8').write(h)
    open(SPEC, 'w', encoding='utf-8').write(s2)
    print('WROTE tests/harness.js (3 comment rows) and tests/sabotage/v221_d177.json (12 -> 13 mutations)')

if __name__ == '__main__':
    main()
