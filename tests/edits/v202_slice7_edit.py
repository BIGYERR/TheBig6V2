#!/usr/bin/env python3
# V202 slice 7 (FINAL) — four app/harness edits + one test-file cleanup.
#   S1  D2b-iii PACE CLOCK appendix lifted OUT of the dampened limb; it now appends to
#       whichever INT note fires, whenever _psShift > 0.  (Two replacements: remove, re-site.)
#   S2  the four identical generic INT note strings replaced AS A SET (count==4, not four
#       hand-anchored sites) — 10 -> 8 to match getINTReps and D112 limb A (A 259-260),
#       and the two mid-sentence em-dashes removed per the copy rule.
#   S3  tests/harness.js era tables get a V202 row, written as a REFERENCE to 201, which
#       under the D94-t convention in that file asserts RULED UNMOVED.
#   S4  ia-version 201 -> 202 (LAST replacement in index.html).
#   S5  tests/sabotage/v202.json labels renumbered to a unique contiguous set.
# Every anchor asserted before writing.  Abort the whole script on the first miss.

import io, json, os, re, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
APP  = os.path.join(ROOT, 'index.html')
HARN = os.path.join(ROOT, 'tests', 'harness.js')
SAB  = os.path.join(ROOT, 'tests', 'sabotage', 'v202.json')

def read(p):
    with io.open(p, encoding='utf-8') as f: return f.read()
def write(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

FAILED = []
def rep(src, old, new, label, n=1):
    c = src.count(old)
    print('  anchor %-28s count==%d  (found %d)  %s' % (label, n, c, 'OK' if c == n else 'MISS'))
    if c != n:
        FAILED.append(label)
        raise SystemExit('ABORT: anchor %s expected count==%d, found %d. Nothing written.' % (label, n, c))
    return src.replace(old, new)

APPENDIX = " PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week."

# ────────────────────────────────────────────────────────────────────────────
print('S1 — lift the PACE CLOCK appendix out of the dampened branch')
app = read(APP)
print('  pre : appendix sites =', app.count(APPENDIX))

# S1a — remove it from inside the dampened limb.
s1a_old = ("""            if(_psShift > 0) note += '""" + APPENDIX + """';
          } else {""")
s1a_new = ("""          } else {""")
app = rep(app, s1a_old, s1a_new, 'S1a remove-from-dampened')

# S1b — re-site it after the whole note chain, so it appends to whichever note fired.
s1b_old = """          }
        } else {
          // Fallback: use chart 5K pace for interval target"""
s1b_new = """          }
          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about
          // which class of note fired. It only ever sat inside the dampened limb because that
          // limb happened to be the one that also fired on the shift; once a goal-met limb was
          // added above it (V202 slice 5) a goal-met athlete under an injury shift silently
          // lost the sentence. ONE predicate at ONE site, appended to whichever INT note fires,
          // rather than the same predicate copied into every limb to drift apart later.
          if(_psShift > 0) note += '""" + APPENDIX + """';
        } else {
          // Fallback: use chart 5K pace for interval target"""
app = rep(app, s1b_old, s1b_new, 'S1b re-site-after-chain')
print('  post: appendix sites =', app.count(APPENDIX))

# ────────────────────────────────────────────────────────────────────────────
print('S2 — the four identical INT note strings, replaced as a SET')
INT_OLD = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All-out on each rep, full recovery between. Build from 4 reps to 10 — hard cap at 10. Quality over quantity — if pace drops, stop.'
INT_NEW = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.'
print('  pre : old count =', app.count(INT_OLD), ' new count =', app.count(INT_NEW))
app = rep(app, INT_OLD, INT_NEW, 'S2 int-note-set', n=4)
post_old, post_new = app.count(INT_OLD), app.count(INT_NEW)
print('  post-assert: old count ==', post_old, '(want 0)   new count ==', post_new, '(want 4)')
assert post_old == 0, 'S2 post-assert failed: old string survives'
assert post_new == 4, 'S2 post-assert failed: new string not at 4 sites'
# guard: no stray survivor of either defective number anywhere in the note family
print('  residual "reps to 10" =', app.count('Build from 4 reps to 10'), '(want 0)')
assert app.count('Build from 4 reps to 10') == 0

# ────────────────────────────────────────────────────────────────────────────
print('S4 — ia-version bump (LAST replacement in index.html)')
app = rep(app, '<meta name="ia-version" content="201">', '<meta name="ia-version" content="202">', 'S4 ia-version')
write(APP, app)
print('  index.html written.')

# ────────────────────────────────────────────────────────────────────────────
print('S3 — harness era tables: V202 rows written as REFERENCES to 201')
h = read(HARN)
h3a_old = """MANNY_DIGEST_BY_VERSION[201] = MANNY_DIGEST_BY_VERSION[200];              // D94: ruled UNMOVED (pull deload cards only; HALF_MANNY's cond[2] draws are never a hinge)"""
h3a_new = h3a_old + """
// V202: ruled UNMOVED, and written as a REFERENCE for that reason — under this file's D94-t
// convention a LITERAL row asserts a ruled MOVE and a REFERENCE row asserts a ruled UNMOVED.
// Every V202 ruling lands on NSW test-goal run work: D100/D101 move run_pace_goal anchors and
// the weekly rate, D111/D112 move INT pace, recovery and warm-up, D2b-iii re-sites the pace
// clock appendix, and the generic INT note copy changed. HALF_MANNY is an NRC half-marathon
// fixture: no pace-goal progression, no NSW INT session, no card touched.
MANNY_DIGEST_BY_VERSION[202] = MANNY_DIGEST_BY_VERSION[201];"""
h = rep(h, h3a_old, h3a_new, 'S3a manny-row-202')

h3b_old = """MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[200];   // D94: ruled UNMOVED"""
h3b_new = h3b_old + """
// V202: ruled UNMOVED for the same reason — a reference row, not a literal. The deload-off
// variant of HALF_MANNY is the same NRC fixture with the deload pre-pass disabled; V202 moves
// nothing it draws from.
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[202] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201];"""
h = rep(h, h3b_old, h3b_new, 'S3b deload-off-row-202')
write(HARN, h)
print('  tests/harness.js written.')

# ────────────────────────────────────────────────────────────────────────────
print('S5 — tests/sabotage/v202.json label renumber (unique + contiguous)')
raw = read(SAB)
spec = json.loads(raw)
print('  mutations =', len(spec))

# Old labels in list order; M8..M13 are each used twice, which is why selecting a mutation
# by name is ambiguous today. Gatekeeper selects by name and cannot edit the spec.
old_labels = [m['name'].split(' ->')[0].strip() for m in spec]
dupes = sorted({l for l in old_labels if old_labels.count(l) > 1}, key=lambda x: int(x[1:]))
print('  duplicated labels before:', dupes)

# Renumber in list order, M1..Mn. Indices 0-12 already hold M1..M13 and do not move,
# which keeps every note cross-reference in that block correct as written.
new_labels = ['M%d' % (i + 1) for i in range(len(spec))]
label_map = []
for i, (o, n) in enumerate(zip(old_labels, new_labels)):
    label_map.append((i, o, n))

for i, o, n in label_map:
    if o == n: continue
    # Anchor on the label plus enough of the mutation's own sentence to be unique.
    head_old = '"name": "%s -> %s' % (o, spec[i]['name'].split(' -> ', 1)[1][:44])
    head_new = '"name": "%s -> %s' % (n, spec[i]['name'].split(' -> ', 1)[1][:44])
    raw = rep(raw, head_old, head_new, 'S5 name idx%02d %s->%s' % (i, o, n))

# Prose cross-references inside notes that pointed at a renumbered mutation.
raw = rep(raw, 'D2 stays GREEN for the same reason as M8.',
               'D2 stays GREEN for the same reason as M14.', 'S5 note idx14 ref')
raw = rep(raw, 'Labelled M17 because this file already reuses M8..M13 twice.',
               'Labelled M16 after the V202 slice 7 renumber; before that renumber this file reused M8..M13 twice and no mutation could be selected by name.',
               'S5 note idx15 ref')
raw = rep(raw, 'WHY THIS MUTATION EXISTS SEPARATELY FROM M14: M14 breaks the NUMBERS and leaves the metas right; M16 breaks a META and leaves the numbers right.',
               'WHY THIS MUTATION EXISTS SEPARATELY FROM M20: M20 breaks the NUMBERS and leaves the metas right; M22 breaks a META and leaves the numbers right.',
               'S5 note idx21 ref')

after = json.loads(raw)
assert len(after) == len(spec), 'S5: mutation count changed'
for i in range(len(spec)):
    assert after[i]['anchor'] == spec[i]['anchor'], 'S5: anchor changed at idx %d' % i
    assert after[i]['replacement'] == spec[i]['replacement'], 'S5: replacement changed at idx %d' % i
    assert after[i]['gate'] == spec[i]['gate'], 'S5: declared target changed at idx %d' % i
    assert after[i]['name'].split(' -> ', 1)[1] == spec[i]['name'].split(' -> ', 1)[1], 'S5: name body changed at idx %d' % i
lbls = [m['name'].split(' ->')[0].strip() for m in after]
assert len(set(lbls)) == len(lbls), 'S5: labels still not unique'
assert lbls == ['M%d' % (i + 1) for i in range(len(after))], 'S5: labels not contiguous in order'
write(SAB, raw)
print('  tests/sabotage/v202.json written.')
print()
print('  LABEL MAP (old -> new):')
for i, o, n in label_map:
    print('    idx %2d  %-4s -> %-4s  [%s]  %s' % (i, o, n, after[i]['gate'].replace('gates/', ''), after[i]['name'].split(' -> ', 1)[1][:66]))

print()
print('ALL EDITS APPLIED. failed anchors:', FAILED or 'none')
