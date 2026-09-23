#!/usr/bin/env python3
"""V205 slice 7e, part 1 of 2 — sabotage bookkeeping. TESTS ONLY.

index.html is NOT touched by this script; it is opened read-only, to ASSERT that
the re-anchored S3 mutation quotes a string that occurs exactly once in the
artifact it will be applied to. ia-version stays at 204.

Three edits:
  T1  v205_d129.json S3 was NOT-APPLIED (anchor count=0): it quoted the pre-D130
      nine-term rank vector `[-c.coll, ...]`. D130 split rank 1 into untol/tol,
      so the live vector has ten terms. Re-anchored to the ten-term key, still
      voiding c.identity and nothing else.
  T2  v205_d125_ceiling.json S3 is RETIRED, not deleted silently. The reason is
      recorded on S2, the row that now owns the same branch, in the same shape
      v205.json M8 uses for the retired CHI mirror.
  T4  v205_d125_ceiling.json S1 carries a recorded structural note: it is not a
      survivor, it is a licence that can be disarmed by deleting the feature the
      licence is keyed on. Recorded, not fixed.

Every anchor is asserted count==1 before anything is written; the first miss
aborts the whole script with nothing written.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tests/
REPO = os.path.dirname(ROOT)
D129 = os.path.join(ROOT, 'sabotage', 'v205_d129.json')
CEIL = os.path.join(ROOT, 'sabotage', 'v205_d125_ceiling.json')
ART  = os.path.join(REPO, 'index.html')

def die(msg):
    sys.exit('ABORT: ' + msg)

def load(p):
    raw = open(p, encoding='utf-8').read()
    rows = json.loads(raw)
    if json.dumps(rows, indent=2, ensure_ascii=False) + '\n' != raw:
        die(p + ' does not round-trip through json.dumps(indent=2); '
                'structural editing would reformat the whole file')
    return rows

def one(rows, tag):
    hits = [i for i, r in enumerate(rows) if r['name'].startswith(tag + ' ')]
    if len(hits) != 1:
        die('row %s: count==%d, expected 1' % (tag, len(hits)))
    return hits[0]

def write(p, rows):
    open(p, 'w', encoding='utf-8').write(json.dumps(rows, indent=2, ensure_ascii=False) + '\n')

# ── every anchor asserted BEFORE any write ────────────────────────────────────
src = open(ART, encoding='utf-8').read()

NEW_S3_ANCHOR = "        const _rank = c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];"
NEW_S3_REPL   = "        const _rank = c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, 0, c.spread, c.qualRest, c.qualFirst];"
OLD_S3_ANCHOR = "        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];"

n_new = src.count(NEW_S3_ANCHOR)
n_old = src.count(OLD_S3_ANCHOR)
if n_new != 1:
    die('the ten-term rank vector occurs %d times in index.html, expected 1' % n_new)
if n_old != 0:
    die('the pre-D130 nine-term rank vector still occurs %d times; the premise of T1 is wrong' % n_old)
if NEW_S3_REPL == NEW_S3_ANCHOR:
    die('S3 replacement is identical to its anchor')
print('ASSERT index.html: ten-term rank vector count==1, nine-term count==0 (read-only)')

d129 = load(D129)
ceil = load(CEIL)
i_s3_129 = one(d129, 'S3')
i_s1_c   = one(ceil, 'S1')
i_s2_c   = one(ceil, 'S2')
i_s3_c   = one(ceil, 'S3')
if d129[i_s3_129]['anchor'] != OLD_S3_ANCHOR:
    die('v205_d129 S3 anchor is not the pre-D130 vector this script expects to replace')
if ceil[i_s3_c]['anchor'] != '        capDays = 3;':
    die('v205_d125_ceiling S3 is not the capDays fallback row this script expects to retire')
if 'RETIRED' in ceil[i_s2_c]['note'] or 'STRUCTURAL' in ceil[i_s1_c]['note']:
    die('the ceiling notes already carry a slice 7e record; refusing to double-append')
print('ASSERT spec rows: d129 S3, ceiling S1/S2/S3 each count==1')

# ── T1: re-anchor v205_d129 S3 to the live ten-term key ───────────────────────
d129[i_s3_129]['anchor'] = NEW_S3_ANCHOR
d129[i_s3_129]['replacement'] = NEW_S3_REPL
d129[i_s3_129]['note'] += (
    " RE-ANCHORED AT SLICE 7E. The anchor above used to quote the pre-D130 nine-term key "
    "`[-c.coll, c.longLast, ...]` and read anchor count=0: NOT-APPLIED, which is not a pass and "
    "is not a survivor either. D130 split rank 1 into untolerated and tolerated, so the live key "
    "carries ten terms and opens `[-c.untol, -c.tol, ...]`. The mutation itself is unchanged in "
    "kind: c.identity is still the only slot voided, every line that computes identity still "
    "stands, and _evenKey is still built. The faithful re-anchor was RUN, not assumed, because a "
    "re-anchor that lands on a term the rest of the build has made inert is a no-op wearing a "
    "trip's clothes (see S2 in v205_d125_ceiling.json for the case where that is exactly what "
    "happened)."
)

# ── T2: retire ceiling S3, recording the reason on S2 ─────────────────────────
retired = ceil.pop(i_s3_c)
i_s2_c = one(ceil, 'S2')      # re-find after the pop; indices moved
ceil[i_s2_c]['note'] += (
    " RETIRED AT SLICE 7E: S3, the sibling mutation on this same branch, is gone from this spec. "
    "It dropped the fallback from three runs to two (`capDays = 3;` becomes `capDays = 2;`) and it "
    "was a genuine no-op at 204 AND at 205, for the same reason this row had to be re-aimed: D130 "
    "empties the fallback on every single-sport pace calendar, so no built week reaches the "
    "assignment and nothing inside it can be mutated into a defect. Per CLAUDE.md a no-op mutation "
    "is a mutation defect, not a gate defect. The reachability claim S3 used to lean on is now "
    "owned outright by P3f in gates/g205_d125_ceiling.js, which asserts BOTH halves: the fallback "
    "is empty, and the 14 named calendars are exactly those whose four-run floor is (untol 0, "
    "tol 1). WHAT WOULD MAKE S3 LIVE AGAIN: any ruling that puts a calendar back on the fallback "
    "path, at which point P3f's fellBack list stops being empty and the fallback's SIZE becomes "
    "observable again. Restore it then, against whichever gate row owns the size."
)

# ── T4: record the licence shape on ceiling S1. Recorded, NOT fixed ───────────
ceil[i_s1_c]['note'] += (
    " STRUCTURAL NOTE, SLICE 7E (recorded, not fixed): at ia-version 204 this row reads FAIL 0 and "
    "it is NOT a survivor. The mutation deletes the ceiling literal that gates/g205_d125_ceiling.js "
    "keys its HAS licence on, so the gate takes its pre-D125 SKIP arm, prints PASS 0 FAIL 0, and the "
    "runner scores a clean sheet as SURVIVED. Verified: the same mutation TRIPS on a 205-stamped "
    "copy, where the licence refuses instead of skipping. THE SHAPE, named so a future reader can "
    "find it again: a licence keyed on a feature EXISTING can be disarmed by deleting that feature, "
    "and a mutation that deletes a feature is exactly the mutation a sabotage sweep is built to "
    "run. Every HAS-gated licence in this repo has the same hole. This sweep must therefore be "
    "re-run AFTER the ia-version bump to 205, and this row read there and not here. This is a real "
    "structural hole in the licence pattern and it deserves a ruling of its own; it is not getting "
    "one today, and this note is the record that it is open."
)

write(D129, d129)
write(CEIL, ceil)
print('WROTE %s (S3 re-anchored to the ten-term key)' % os.path.relpath(D129, REPO))
print('WROTE %s (S3 retired -> %d rows; S2 carries the reason; S1 carries the licence note)'
      % (os.path.relpath(CEIL, REPO), len(ceil)))
print('RETIRED ROW (for the record): ' + retired['name'][:80] + ' ...')
