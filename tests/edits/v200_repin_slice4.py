#!/usr/bin/env python3
# v200_repin_slice4.py — V200 D89 re-pin, SLICE 4 of 4 (gates + measure header only).
#
# index.html IS NOT TOUCHED by this script. ia-version stays 200; D89's two hunks are
# already shipped and gatekeeper-verified. This slice moves the last two literal HALF_MANNY
# digest pins onto the version-keyed tables slice 3 put in tests/harness.js, and corrects a
# misreadable header in the D89 measure script.
#
# EDIT 1-2  tests/gates/g199_deload_arbitration.js  B1 and B2
#           B1 -> MANNY_DIGEST_BY_VERSION[IP.version]         (was literal 6e32421331693437)
#           B2 -> MANNY_DELOAD_OFF_DIGEST_BY_VERSION[IP.version] (was literal 75ae3d256b642a9d)
#           B1's "byte-identical to V198" is STRUCK: true history, false predicate. A
#           single-artifact gate cannot re-prove a claim about a diff between two artifacts.
#           B2's own meaning (B1 is MEANINGFUL because the fixture passes through the
#           deload) is preserved verbatim.
# EDIT 3    tests/gates/g200_pull_arbitration.js  B1
#           Same re-pin. "D93 is a gate-only ruling: 0 hunks in index.html, so this must not
#           move" is STRUCK: D93 was gate-only, D89 is not, so that sentence asserts a
#           falsehood regardless of the digest value. Nothing else in that file is touched.
# EDIT 4    tests/measure/v200_d89_tier3_readers.js  one header line, no measurement logic
#           and no number changed.
#
# Every anchor is asserted count==1 before any file is written; the first miss aborts the
# whole script with nothing written.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G199 = os.path.join(ROOT, 'tests', 'gates', 'g199_deload_arbitration.js')
G200 = os.path.join(ROOT, 'tests', 'gates', 'g200_pull_arbitration.js')
MEAS = os.path.join(ROOT, 'tests', 'measure', 'v200_d89_tier3_readers.js')

EDITS = []   # (path, old, new)

# ── EDIT 1-2 · g199 ────────────────────────────────────────────────────────────────────
EDITS.append((G199,
"const {load, fixtures, progDigest}=require(path.join(__dirname,'..','harness.js'));",
"const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));"))

EDITS.append((G199,
"ok(dig==='6e32421331693437','B1 HALF_MANNY progDigest is 6e32421331693437, byte-identical to V198 (got '+dig+')');",
"const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IP.version];             // era row, not a literal (D89)\n"
"const MANNY_OFF=MANNY_DELOAD_OFF_DIGEST_BY_VERSION[IP.version];     // era row, not a literal (D89)\n"
"ok(!!MANNY_DIGEST&&dig===MANNY_DIGEST,'B1 HALF_MANNY progDigest matches the V'+IP.version+' row of MANNY_DIGEST_BY_VERSION ('+(MANNY_DIGEST||'NO ROW')+') (got '+dig+')'"
"+(MANNY_DIGEST?'':' — no MANNY_DIGEST_BY_VERSION row for V'+IP.version+': an unruled digest move'));"))

EDITS.append((G199,
"ok(digOff==='75ae3d256b642a9d','B2 with __DELOAD_OFF the same fixture moves to 75ae3d256b642a9d (got '+digOff+'): B1 is MEANINGFUL, the fixture does pass through the deload (B1 would be vacuous if the two digests were equal)');",
"ok(!!MANNY_OFF&&digOff===MANNY_OFF,'B2 with __DELOAD_OFF the same fixture matches the V'+IP.version+' row of MANNY_DELOAD_OFF_DIGEST_BY_VERSION ('+(MANNY_OFF||'NO ROW')+') (got '+digOff+'): B1 is MEANINGFUL, the fixture does pass through the deload (B1 would be vacuous if the two digests were equal)'"
"+(MANNY_OFF?'':' — no MANNY_DELOAD_OFF_DIGEST_BY_VERSION row for V'+IP.version+': an unruled digest move'));"))

# ── EDIT 3 · g200_pull_arbitration ─────────────────────────────────────────────────────
EDITS.append((G200,
"const {load, fixtures, progDigest}=require(path.join(__dirname,'..','harness.js'));",
"const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));"))

EDITS.append((G200,
"ok(fdig==='6e32421331693437','B1 HALF_MANNY progDigest is 6e32421331693437, byte-identical to V198 (got '+fdig+'). D93 is a gate-only ruling: 0 hunks in index.html, so this must not move');",
"const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IP.version];             // era row, not a literal (D89)\n"
"ok(!!MANNY_DIGEST&&fdig===MANNY_DIGEST,'B1 HALF_MANNY progDigest matches the V'+IP.version+' row of MANNY_DIGEST_BY_VERSION ('+(MANNY_DIGEST||'NO ROW')+') (got '+fdig+')'"
"+(MANNY_DIGEST?'':' — no MANNY_DIGEST_BY_VERSION row for V'+IP.version+': an unruled digest move'));"))

# ── EDIT 4 · measure header line ───────────────────────────────────────────────────────
EDITS.append((MEAS,
"// v200_d89_tier3_readers.js — MEASURE PASS (read-only, rules nothing)\n//\n",
"// v200_d89_tier3_readers.js — MEASURE PASS (read-only, rules nothing)\n"
"//\n"
"// READ THIS BEFORE QUOTING ANY NUMBER BELOW. The \"D89 DELTA\" figures in this file (R1 2,773 · R3 58,992 · R4 135,956) are the MODEL A / MODEL B COUNTERFACTUALS measured to CHOOSE a model, NOT the shipped V200 delta: shipped D89 moved R1 through R4 by 0 and moved R7 by the Pallof-only shape, which is pinned in tests/gates/g200_core_tier.js.\n"
"//\n"))

# ── apply: assert every anchor count==1 across the whole set FIRST ─────────────────────
src = {}
for p, old, new in EDITS:
    if p not in src:
        with io.open(p, 'r', encoding='utf-8') as f:
            src[p] = f.read()

cur = dict(src)
for i, (p, old, new) in enumerate(EDITS, 1):
    n = cur[p].count(old)
    if n != 1:
        sys.stderr.write('ABORT: replacement %d in %s matched %d times, want exactly 1\n  anchor: %s\n'
                         % (i, os.path.basename(p), n, old[:120]))
        sys.exit(1)
    cur[p] = cur[p].replace(old, new, 1)
    print('ok  %d/%d  %s  <- %s' % (i, len(EDITS), os.path.basename(p), old[:70].replace('\n', ' ')))

for p in cur:
    if cur[p] == src[p]:
        sys.stderr.write('ABORT: %s unchanged\n' % p)
        sys.exit(1)
    with io.open(p, 'w', encoding='utf-8') as f:
        f.write(cur[p])
    print('wrote %s' % p)

print('slice 4 applied: %d replacements across %d files; index.html NOT touched' % (len(EDITS), len(cur)))
