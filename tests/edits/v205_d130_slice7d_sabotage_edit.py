#!/usr/bin/env python3
"""V205 slice 7d - test bookkeeping only. index.html is NOT touched.

EDIT 1  tests/sabotage/v205_d125_ceiling.json  S2   re-anchored AND re-aimed
EDIT 2  tests/sabotage/v205_d125.json          S3   re-anchored (D130 rank key)
EDIT 3  tests/sabotage/v205_d125.json          S5   re-anchored (slice 6 widened gate)
EDIT 4  tests/gates/g205_d125_spaced.js        P2/P2b relabelled as descriptive

Every replacement asserts count==1 before anything is written; the first miss
aborts the whole script with nothing on disk.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(ROOT)

def die(msg):
    sys.stderr.write('ABORT: ' + msg + '\n'); sys.exit(1)

def ser(val):
    """The exact bytes this value occupies in the spec file. The specs were
    written by hand/json.dump; try the non-escaped form first, then the
    ascii-escaped one. Exactly one must appear exactly once."""
    return [json.dumps(val, ensure_ascii=False), json.dumps(val)]

def repl_json_field(text, obj, key, newval, tag):
    hits = []
    for s in ser(obj[key]):
        line = '    "%s": %s' % (key, s)
        if text.count(line) == 1:
            hits.append(line)
    hits = list(dict.fromkeys(hits))
    if len(hits) != 1:
        die('%s field %s: %d unique serialisations found at count==1' % (tag, key, len(hits)))
    old = hits[0]
    new = '    "%s": %s' % (key, json.dumps(newval, ensure_ascii=False))
    print('  %-26s anchor count==1 OK  (%d -> %d bytes)' % (tag + '.' + key, len(old), len(new)))
    return text.replace(old, new, 1)

def repl_text(text, old, new, tag):
    n = text.count(old)
    if n != 1:
        die('%s: anchor count==%d, expected 1\n---\n%s\n---' % (tag, n, old[:300]))
    print('  %-26s anchor count==1 OK' % tag)
    return text.replace(old, new, 1)

def find(spec, prefix):
    hit = [o for o in spec if o['name'].startswith(prefix)]
    if len(hit) != 1:
        die('%d objects named %s' % (len(hit), prefix))
    return hit[0]

# ── source of truth: the anchors as they read in index.html TODAY ─────────────
SRC = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
A_GUARD = '      if(_paceCapped && capDays > 3 && (!_pick || _pick.untol > 0)){'
A_RANK  = '        const _rank = c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];'
A_CAP   = '    const _paceCapped = PACE_GOALS.has(_soloRunGoal) && capDays<=nCardio && capDays>=2;'
for nm, a in (('guard', A_GUARD), ('rank', A_RANK), ('paceCapped', A_CAP)):
    if SRC.count(a) != 1:
        die('index.html anchor %s occurs %d times' % (nm, SRC.count(a)))
    print('  index.html %-16s count==1 OK' % nm)

# ── EDIT 1: ceiling S2 ────────────────────────────────────────────────────────
P_CEIL = os.path.join(ROOT, 'tests/sabotage/v205_d125_ceiling.json')
t = open(P_CEIL, encoding='utf-8').read()
s2 = find(json.load(open(P_CEIL, encoding='utf-8')), 'S2 ')

S2_NAME = ("S2 -> the D130 split is undone at the conditional ceiling itself: the guard re-reads the "
    "unsplit total (_pick.coll) instead of _pick.untol. Every line of the fallback stays in place and "
    "still fires exactly as written, and the chooser, the rank vector and the tolerated/untolerated "
    "split are all untouched. Only the guard's QUESTION regresses, so the 14 calendars whose four-run "
    "floor is (untol 0, tol 1) fall back to three runs again, which is exactly the pre-D130 behaviour "
    "the ruling removed. 50 of the 64 calendars stay byte-identical, so a gate that only sampled "
    "Mario's own week would ship this")
S2_NOTE = ("NAMED TRIP: P2 goes red naming sun,mon,tue (engine deals 3 where the exhaustive search "
    "reaches untol 0 at four). P3 goes red at 4 training days (21/35, not 35/35). P3e goes red (50 of "
    "64, not 64). P3f goes red listing the 14 that fell back. P4 goes red on the built pair count "
    "(5412, not 6336) and P4b on the tolerated adjacency that vanished with them. P6 goes red (462 of "
    "462 weeks off four) and P6b with it. EXPECTED: P2, P3, P3e, P3f, P4, P4b, P6, P6b -- 8 FAIL of "
    "20. REWRITTEN AT SLICE 7D. The old form quoted `_pick.coll > 0`, which slice 7a replaced with "
    "`_pick.untol > 0`: NOT-APPLIED. A straight re-anchor that merely voids the branch "
    "(`if(false && ...)`) was MEASURED SURVIVED at 20 PASS 0 FAIL, because D130 empties this fallback "
    "on every single-sport pace calendar and voiding a branch that never fires is a no-op. Per "
    "CLAUDE.md a no-op mutation is a mutation defect, so the mutation is re-aimed at the guard's "
    "predicate, which is the live thing D130 changed.")
t = repl_json_field(t, s2, 'name', S2_NAME, 'ceiling S2')
t = repl_json_field(t, s2, 'anchor', A_GUARD, 'ceiling S2')
t = repl_json_field(t, s2, 'replacement',
    '      if(_paceCapped && capDays > 3 && (!_pick || _pick.coll > 0)){', 'ceiling S2')
t = repl_json_field(t, s2, 'note', S2_NOTE, 'ceiling S2')
json.loads(t)

# ── EDITS 2 and 3: d125 S3 and S5 ─────────────────────────────────────────────
P_D125 = os.path.join(ROOT, 'tests/sabotage/v205_d125.json')
u = open(P_D125, encoding='utf-8').read()
spec = json.load(open(P_D125, encoding='utf-8'))
s3, s5 = find(spec, 'S3 '), find(spec, 'S5 ')

S3_NOTE = ("NAMED TRIP: P1 goes red on 125 of 157 calendar x ceiling rows, naming the rank vector the "
    "engine chose against the one the ruling orders. P8 goes red on 20 of 29 built rows. P8c goes red "
    "with 37 calendars putting the long run mid-week. EXPECTED: P1, P8, P8c -- 3 FAIL of 19. "
    "RE-ANCHORED AT SLICE 7D: the old form quoted the pre-D130 key [-c.coll, c.longLast, ...], which "
    "D130 split into [-c.untol, -c.tol, c.longLast, ...]: NOT-APPLIED. The mutation is unchanged in "
    "kind -- rank 2 reads a constant instead of longLast -- and it still trips P1/P8 as written.")
u = repl_json_field(u, s3, 'anchor', A_RANK, 'd125 S3')
u = repl_json_field(u, s3, 'replacement',
    '        const _rank = c => [-c.untol, -c.tol, 1, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];',
    'd125 S3')
u = repl_json_field(u, s3, 'note', S3_NOTE, 'd125 S3')

S5_NAME = ("S5 -> the pace family stops entering the chooser at all and silently falls back to even "
    "spread. PACE_GOALS still exists, the chooser still exists, the NRC path still routes, and the "
    "DAY COUNT is unchanged, so the week still looks like a pace week. Only the DAY CHOICE regresses, "
    "which is precisely the thing even spread cannot reason about: spaceHardCardio can permute types "
    "within whatever days even spread happened to pick, but it cannot pick different days.")
S5_NOTE = ("NAMED TRIP: P6c goes red naming the routing predicate. P7 goes red with 88 untolerated "
    "hard-run adjacencies across 704 built weeks, and P7b goes red with 220 tolerated adjacencies "
    "across 20 calendars that are not among the 14 the ruling names. P8 goes red on 24 of 29 built "
    "rows. EXPECTED: P6c, P7, P7b, P8 -- 4 FAIL of 19. RE-ANCHORED AT SLICE 7D: the old form quoted "
    "`capDays<nCardio`, which slice 6 widened to `capDays<=nCardio`: NOT-APPLIED. The old note also "
    "predicted P7 would stay green by design; that expired with D130. P7 now asks whether a BUILT "
    "week carries an untolerated adjacency, and even spread does not reach it.")
u = repl_json_field(u, s5, 'name', S5_NAME, 'd125 S5')
u = repl_json_field(u, s5, 'anchor', A_CAP, 'd125 S5')
u = repl_json_field(u, s5, 'note', S5_NOTE, 'd125 S5')
json.loads(u)

# ── EDIT 4: the d125_spaced P2/P2b relabel ────────────────────────────────────
P_GATE = os.path.join(ROOT, 'tests/gates/g205_d125_spaced.js')
g = open(P_GATE, encoding='utf-8').read()

g = repl_text(g,
"""//   * P2 is the RULING'S AFTER-GRID, typed in as literals: at a four-run ceiling 50 of the
//     64 rest-day calendars reach zero collisions — 21/35, 21/21, 7/7, 1/1 — and all 14
//     losers are four-training-day calendars at coll=1.""",
"""//   * P2 DESCRIBES THE UNSPLIT SEARCH SPACE and is not the shipping criterion. On the
//     unsplit collision total at a four-run ceiling, 50 of the 64 rest-day calendars reach
//     zero — 21/35, 21/21, 7/7, 1/1 — and all 14 losers are four-training-day calendars at
//     coll=1. That was D125's after-grid; D130 then split rank 1 into (untol, tol) and all
//     64 now ship four runs, so nothing keys on 50/64 any more. The rows that say what
//     SHIPS are P1 and P8 here, and P3e/P3f in tests/gates/g205_d125_ceiling.js. P2/P2b
//     stay because they are still true of the space the chooser searches.""",
'spaced header bullet')

g = repl_text(g,
"// ── P2 the ruling's after-grid at a four-run ceiling ───────────────────────────",
"""// ── P2 the UNSPLIT search space at a four-run ceiling (DESCRIPTIVE, NOT THE CRITERION) ──
// Superseded as the shipping criterion by D130. What ships is asserted by P1 and P8 below,
// and by P3e/P3f in tests/gates/g205_d125_ceiling.js.""",
'spaced P2 section comment')

g = repl_text(g,
"ok('P2 at a four-run ceiling 50 of 64 calendars reach zero collisions (21/35, 21/21, 7/7, 1/1)', !gridBad, gridBad);",
"ok('P2 DESCRIPTIVE (not the shipping criterion, see P1/P8): on the UNSPLIT collision total at a four-run ceiling, 50 of 64 calendars reach zero (21/35, 21/21, 7/7, 1/1)', !gridBad, gridBad);",
'spaced P2 label')

g = repl_text(g,
"ok('P2b all 14 losers are four-day calendars stuck at coll=1',",
"ok('P2b DESCRIPTIVE (not a failure set): all 14 unsplit losers are four-day calendars stuck at coll=1. Under D130 these same 14 ship four runs and pay one TOLERATED adjacency, which P3f in g205_d125_ceiling.js owns',",
'spaced P2b label')

open(P_CEIL, 'w', encoding='utf-8').write(t)
open(P_D125, 'w', encoding='utf-8').write(u)
open(P_GATE, 'w', encoding='utf-8').write(g)
print('WROTE: %s\nWROTE: %s\nWROTE: %s' % (P_CEIL, P_D125, P_GATE))
