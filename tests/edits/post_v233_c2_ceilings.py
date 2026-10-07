#!/usr/bin/env python3
# Post-V233 tooling pass, ceiling-retirement slice C2 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Messages 3 and 4, and standing ruling 3 as
# amended: a check written to switch off after its own build retires when the next build ships, and the
# previous-version run (Proof scope) is its replacement. Evidence: measure mC
# (tests/measure/v233_rulings/measure_ceilings_mC.md, the (c) list): every row or conjunct below is dark at 233 and no
# live row shares it. This slice retires four sites, each with its predicate or flag and the helpers only it read:
#   g225_d187_pacerate      CONFINEMENT (`VER >= V231_ERA` prints SKIP; D187 V225, D189 Class B V226, V231 absorb ruling
#                           section 3). Retired with V231_ERA, D189_ERA, V224_COMMIT, V225_COMMIT, BASEFILE (argv[3],
#                           read only by CONFINEMENT and the header echo of its baseline) and the fs/os/cp requires.
#                           ROW_LABELS[9] leaves the REFUSED list.
#   g226_d188_beginnermile  G2's identity row (both branches), G1h-P2b and G1h-P5 (`VER >= V231_ERA` -> scopeSkip; D188
#                           V226, V231 absorb ruling section 3). Retired with V231_ERA, scopeSkip, stripS1, s1Count, G2's
#                           candidate build and diff, cnt.at690 and the P2b/P5 misses. Kept byte for byte: G2's
#                           V225 self-identity precondition and its header, every other G1h row, and the lattice INFO
#                           line (cnt.nonLR and cnt.unmoved still count). P2b and P5 leave G1H_ROWS (the NA list).
#   g228_d193_cueword       b-ONECLASS (flag ONE_RETIRED = VER >= 229 prints `SKIP ...: REFUSED`; D193 V228, D194
#                           Amendment 1 (r)). Retired with its V227 comparison, the SELFCHECK, the HALF_MANNY era-row
#                           conjunct, its INFO lines, subst, firstDiff, J, CLK and progDigest. Kept: the candidate build
#                           pass that fills BUILT (f-STRIP and g-COUPLE read it), the V227 baseline (f-STORED reads it).
#                           R.bONE leaves the REFUSED list.
#   g226_d189_pacedisclose  the G6b whole-program byte-equality conjunct (the else of flag V231; D189 V226, V231 absorb
#                           ruling section 3) and its SKIP line. The flag V231 stays: it drives the live split row, its
#                           lmoved conjunct and its INFO suffix. The 230-and-below form of the row loses the conjunct and
#                           says so in its label (dark at 233).
# Diff class: (R-e) silent-ceiling rows and conjuncts retired with their predicates/flags and unread helpers.
# Every anchor counts exactly 1 before anything is written; the first miss aborts the whole script.
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
TAIL = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(name, src, old, new):
    n = src.count(old)
    if n != 1:
        die(f'{name}: anchor count {n} != 1: {old[:90]!r}')
    return src.replace(old, new)


def cut(name, src, start, end, must=(), new='', must_not=()):
    """Replace src[start_marker : end_marker) with new; both markers count 1, the cut holds every `must`."""
    for m in (start, end):
        n = src.count(m)
        if n != 1:
            die(f'{name}: marker count {n} != 1: {m[:90]!r}')
    a, b = src.index(start), src.index(end)
    if b <= a:
        die(f'{name}: end marker precedes start marker: {start[:60]!r}')
    piece = src[a:b]
    for m in must:
        if m not in piece:
            die(f'{name}: cut lacks {m!r}')
    for m in must_not:
        if m in piece:
            die(f'{name}: cut holds {m!r}, which is live')
    return src[:a] + new + src[b:]


def gone(name, src, pats):
    """Every pattern is absent from the edited file (raw text, comments included, so a hit aborts)."""
    for p in pats:
        k = len(re.findall(p, src))
        if k:
            die(f'{name}: {p!r} still occurs {k} time(s) after the retirement')


def read(p):
    return open(p, encoding='utf-8').read()


out = {}

# ── g225_d187_pacerate: CONFINEMENT ──────────────────────────────────────────────────────────────────────────
n = 'g225'
p = os.path.join(G, 'g225_d187_pacerate.js')
s = read(p)
s = rep(n, s, "//   node tests/gates/g225_d187_pacerate.js <candidate.html> [baseline_V224.html]\n",
        "//   node tests/gates/g225_d187_pacerate.js <candidate.html>\n")
s = rep(n, s, "//   IA_ASSUME_VERSION=225 node tests/gates/g225_d187_pacerate.js <tree stamped 224> [baseline_V224.html]  (discrimination)\n",
        "//   IA_ASSUME_VERSION=225 node tests/gates/g225_d187_pacerate.js <tree stamped 224>  (discrimination)\n")
s = rep(n, s, "//   CONFINEMENT   whole-program digests from TWO different artifacts (candidate vs baseline), the only way\n"
              "//                 to prove NOTHING moved on a goal type this ruling does not touch.\n",
        "//   CONFINEMENT   (candidate vs a V224/V225 baseline, digest per goal; D187 V225, D189 Class B V226, scoped to 230 and\n"
        "//                 below by the V231 absorb ruling section 3) " + TAIL + "\n")
s = cut(n, s, "//   231 and up  CONFINEMENT is SCOPED to its era",
        "//   IA_ASSUME_VERSION=225 lifts a file stamped exactly 224",
        must=("g231_d195b_cost D195-B-b and g231_d195_hipext D195-A-b. Every other row asserts as before.",))
s = rep(n, s, "const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');\n",
        "const path = require('path');\n")
s = rep(n, s, "const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;\n", "")
s = cut(n, s, "// D189 P-PACEDISCLOSE (V226) Class B re-keys CONFINEMENT from 226",
        "\nlet pass = 0, fail = 0;\n",
        must=("const D189_ERA = 226;", "const V231_ERA = 231;", "const V224_COMMIT", "const V225_COMMIT"))
s = rep(n, s, " + (BASEFILE ? ' | argv baseline ' + BASEFILE : ' | no argv baseline (CONFINEMENT pulls its pinned commit)'));\n",
        ");\n")
s = rep(n, s, "  'MILE-REQUIRED beginner run_pace_goal, blank mile: unaffected (byte-identical beginner path)',\n"
              "  'CONFINEMENT 0 digest diffs on every non-pace-goal cell (swim/bike/run_base/NRC)',\n];\n",
        "  'MILE-REQUIRED beginner run_pace_goal, blank mile: unaffected (byte-identical beginner path)',\n];\n")
s = cut(n, s, "// ── CONFINEMENT (needs a baseline artifact: candidate vs V224, byte-identical digest per goal) ──\n",
        "\ndone();\n",
        must=("if(VER >= V231_ERA) console.log('SKIP CONFINEMENT D189 era", "ok(ROW_LABELS[9]", "const BASE_VER = +BASE.version;"),
        must_not=("ok(ROW_LABELS[8]",),
        new="// CONFINEMENT (candidate vs V224/V225, D187 V225 and D189 Class B V226; V231 absorb ruling section 3) " + TAIL + "\n")
gone(n, s, [r'\bfs\.', r'\bos\.', r'\bcp\.', r'\bBASEFILE\b', r'\bD189_ERA\b', r'\bV231_ERA\b', r'\bV22[45]_COMMIT\b',
            r'ROW_LABELS\[9\]', r'\bBASE_VER\b'])
out[p] = s

# ── g226_d188_beginnermile: G2 identity, G1h-P2b, G1h-P5 ─────────────────────────────────────────────────────
n = 'g226_d188'
p = os.path.join(G, 'g226_d188_beginnermile.js')
s = read(p)
s = rep(n, s, "//   G2 IDENTITY   two artifacts: the candidate with the D189 S1 suffix (typed below, ' ' + S1) stripped from every\n"
              "//                 note must equal the V225 artifact's build, digest for digest, and V225 must equal itself first.\n"
              "//                 Baseline: argv[3] if it reads ia-version 225, else `git show <V225 commit>:index.html`.\n",
        "//   G2 BASELINE   the V225 artifact's builds equal themselves (the precondition G1h's baseline rests on). Baseline:\n"
        "//                 argv[3] if it reads ia-version 225, else `git show <V225 commit>:index.html`. G2's identity row\n"
        "//                 (the candidate minus the D189 S1 suffix equals V225) " + TAIL + "\n")
s = cut(n, s, "//   231 and up    three rows are SCOPED to 230 and below",
        "//   225 and below every row asserts the V225 truth",
        must=("G2's V225\n//                 self-identity precondition and G1h-P0, P1, A1L, P2, P3, P4, L1 to L3 assert as before.",),
        new="//   G2's identity row, G1h-P2b and G1h-P5 (asserted at 226 to 230; V231 absorb ruling section 3) " + TAIL + "\n")
s = rep(n, s, "so below 226 its 11 rows are counted NA by name.", "so below 226 its 9 rows are counted NA by name.")
s = rep(n, s, "G1h: P0 to P5 stay green (V225 against V225 moves nothing)", "G1h: P0 to P4 stay green (V225 against V225 moves nothing)")
s = cut(n, s, "// V231 absorb ruling section 3 (g226_d188 G2, G1h-P2b, G1h-P5 SCOPE)",
        "\nlet pass = 0, fail = 0, na = 0;\n",
        must=("const V231_ERA = 231;", "const scopeSkip = (row, fig) =>"))
s = cut(n, s, "function stripS1(p){\n", "let BASE = null, baseWhy = '';\n",
        must=("const s1Count = p =>",))
s = cut(n, s, "    if(VER >= V231_ERA) scopeSkip('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', 'no V225 baseline');\n",
        "  } else {\n    for(const goal of ALL6) for(const s of SEEDS){\n",
        must=("    else ok('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', false, 'no V225 baseline');\n",))
s = rep(n, s, "  let selfEq = 0, same = 0, cells = 0, strips = 0; const bad = [], badSelf = [];\n",
        "  let selfEq = 0, cells = 0; const badSelf = [];\n")
s = rep(n, s, "      let r1, r2, c;\n", "      let r1, r2;\n")
s = cut(n, s, "      try { c = build(IA, cfg); } catch(e){ bad.push(goal + ' seed ' + s + ' candidate threw ' + e.message); continue; }\n",
        "    }\n    ok('G2 ' + TAG + ' ' + (D188 ? 'V225 baseline' : 'candidate') + ' builds equal themselves before any diff",
        must=("if(D188){ const st = stripS1(c);", "else { const k = s1Count(c);"))
s = cut(n, s, "    if(VER >= V231_ERA) scopeSkip('G2 ' + TAG + ' beginner no-mile program with exactly",
        "  }\n}\n\n// ══ G3 (D188 validator)",
        must=("V225 truth: no disclosure pass", "same === cells && cells > 0"),
        new="    // G2's identity row (the candidate minus S1 equals the V225 build; D188 V226, V231 absorb ruling section 3) " + TAIL + "\n")
s = rep(n, s, "'G1h-P2 long-run set and direction',\n"
              "    'G1h-P2b 11:30 weekGrid identity', 'G1h-P3 oracle tier = applied tier, minutes direction', 'G1h-P4 new-tier content',\n"
              "    'G1h-P5 unmoved days byte-identical', 'G1h-L1 liveness shorter tier',",
        "'G1h-P2 long-run set and direction',\n"
        "    'G1h-P3 oracle tier = applied tier, minutes direction', 'G1h-P4 new-tier content',\n"
        "    'G1h-L1 liveness shorter tier',")
s = rep(n, s, "const nBad = { P0: 0, P1: 0, A1L: 0, P2: 0, P2b: 0, P3: 0, P4: 0, P5: 0 }, bad = { P0: [], P1: [], A1L: [], P2: [], P2b: [], P3: [], P4: [], P5: [] };",
        "const nBad = { P0: 0, P1: 0, A1L: 0, P2: 0, P3: 0, P4: 0 }, bad = { P0: [], P1: [], A1L: [], P2: [], P3: [], P4: [] };")
s = rep(n, s, "a1lHit: 0, at690: 0, pairs: 0,", "a1lHit: 0, pairs: 0,")
s = rep(n, s, "      if(lic && L.m === HM){ cnt.at690++; if(H.weekGrid(p5) !== H.weekGrid(p6)) miss('P2b', L.tag + ' weekGrid differs at 11:30'); }\n", "")
s = rep(n, s, "if(!t5 && !t6){ cnt.nonLR++; if(LRJ(secs(d5)) !== LRJ(secs(d6))) miss('P5', where + ' non-long-run day: ' + shapeOf(d5) + ' -> ' + shapeOf(d6)); continue; }",
        "if(!t5 && !t6){ cnt.nonLR++; continue; }")
s = rep(n, s, "        if(mv === 0){ cnt.unmoved++; if(LRJ(secs(d5)) !== LRJ(secs(d6))) miss('P5', where + ' tier ' + t5 + ' unmoved: ' + shapeOf(d5) + ' -> ' + shapeOf(d6)); }\n",
        "        if(mv === 0) cnt.unmoved++;\n")
s = cut(n, s, "    if(VER >= V231_ERA) scopeSkip('G1h-P2b D188", "    ok('G1h-P3 D188 the hand tier",
        must=("ex('P2b')",),
        new="    // G1h-P2b (11:30 weekGrid identity; D188 V226, V231 absorb ruling section 3) " + TAIL + "\n")
s = cut(n, s, "    if(VER >= V231_ERA) scopeSkip('G1h-P5 D188", "    ok('G1h-L1 D188 liveness",
        must=("ex('P5')",),
        new="    // G1h-P5 (unmoved days byte-identical; D188 V226, V231 absorb ruling section 3) " + TAIL + "\n")
gone(n, s, [r'\bV231_ERA\b', r'\bscopeSkip\b', r'\bstripS1\b', r'\bs1Count\b', r'\bat690\b', r"miss\('P2b'", r"miss\('P5'",
            r"'P2b'", r"'P5'", r'strips \+=', r'(?<!cnt\.)\bsame\+\+', r'same === cells'])
out[p] = s

# ── g228_d193_cueword: b-ONECLASS ────────────────────────────────────────────────────────────────────────────
n = 'g228'
p = os.path.join(G, 'g228_d193_cueword.js')
s = read(p)
s = cut(n, s, "//   SUBST        V227's build (the baseline tree)", "//   HAND         the ruling's strings:",
        must=("whole expected grid: no other byte may differ.",))
s = rep(n, s, "//   ERA          the harness MANNY_DIGEST_BY_VERSION table (standing ruling 5).\n", "")
s = rep(n, s, "strip clock fields (ts, at, time, stamp,\n//   clock, now, id, created), and the baseline is built twice and must equal itself before any diff is read.\n",
        "and the f-STORED baseline grid\n//   is built on the V227 tree.\n")
s = cut(n, s, "//   165 of L432's injured builds carry no cue on V227", "//\n// VERSION PREDICATE (standing rulings 2 and 4). D193's split ships at 228.",
        must=("as a total on L432 and home_basic.",))
s = cut(n, s, "//   229 and up     b-ONECLASS is retired:", "//   IA_ASSUME_VERSION=228 lifts a file stamped exactly 227",
        must=("and g-COUPLE (R1, R4, R5, R6) assert at every version from 228 up.",),
        new="//   b-ONECLASS     (era 228 only; D194 Amendment 1 (r), successor D193 (a)/(b) in g229_d193_build.js) " + TAIL + "\n")
s = rep(n, s, "Run on V227 that way: c-LIT, b-ONECLASS, f-STRIP and f-STORED FAIL with",
        "Run on V227 that way: c-LIT, f-STRIP and f-STORED FAIL with")
s = rep(n, s, "(the V227 cue says \"two\", its grid is not V227-substituted, its stripper misses \"three\", its",
        "(the V227 cue says \"two\", its stripper misses \"three\", its")
s = rep(n, s, "//   The baseline (b-ONECLASS, f-STORED) is argv[3]", "//   The baseline (f-STORED) is argv[3]")
s = cut(n, s, "//   b-ONECLASS  candidate build == SUBST(V227 build)", "//   f-STRIP     _stripCapCue on hand strings",
        must=("Defends the split", "standing ruling 5."),
        new="//   b-ONECLASS  (era 228 only) " + TAIL + "\n")
s = rep(n, s, "trips c-LIT (and b-ONECLASS, f-STORED).", "trips c-LIT (and f-STORED).")
s = rep(n, s, "const { load, fixtures, progDigest } = H;\n", "const { load, fixtures } = H;\n")
s = cut(n, s, "  bONE:  'row b-ONECLASS", "  fSTR:  'row f-STRIP")
s = rep(n, s, "const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;\n"
              "const J = v => JSON.stringify(v, (k, x) => (CLK.test(k) || k === 'id' || k === 'created') ? undefined : x);\n", "")
s = cut(n, s, "// SUBST: every string leaf that ends with OLDC re-ended with NEWC", "\n// ── LOAD + VERSION PREDICATE",
        must=("function subst(v, tally){", "function firstDiff(a, b){"))
s = cut(n, s, "// ── b-ONECLASS (plus the build caches f-STRIP and g-COUPLE read)", "// ── f-STRIP ─",
        must=("const ONE_RETIRED = VER >= 229;", "if(ONE_RETIRED) console.log('SKIP ' + R.bONE", "const BUILT = {};", "BUILT[tag + '|' + k] = pc;"),
        new="// ── the candidate build pass (the caches f-STRIP and g-COUPLE read) ──\n"
            "// b-ONECLASS (era 228 only; D194 Amendment 1 (r), tests/measure/v229_rulings/d194_injlens_ruling.md) " + TAIL + "\n"
            "const BUILT = {};   // candidate builds by set|key\n"
            "{\n"
            "  const VC = fresh('C');\n"
            "  for(const [tag, list] of SETS) for(const { k, c } of list) BUILT[tag + '|' + k] = VC.buildProgram(clone(c));\n"
            "}\n\n")
gone(n, s, [r'\bONE_RETIRED\b', r'\bbONE\b', r'\bsubst\b', r'\bfirstDiff\b', r'\bJ\(', r'\bCLK\b', r'\bprogDigest\b',
            r'H\.MANNY_DIGEST_BY_VERSION', r'\bmannyOK\b', r'\bSUBST\('])
out[p] = s

# ── g226_d189_pacedisclose: the G6b byte-equality conjunct ───────────────────────────────────────────────────
n = 'g226_d189'
p = os.path.join(G, 'g226_d189_pacedisclose.js')
s = read(p)
s = rep(n, s, "//   CONFINEMENT   whole-program digest, candidate with the one S1 note restored vs the V225 artifact\n"
              "//                 (default: git show of the V225 commit), both built from the same pinned seed and clock;\n"
              "//                 the baseline is proved self-equal before any diff.\n",
        "//   BASELINE      the V225 artifact (default: git show of the V225 commit), built from the same pinned seed and clock\n"
        "//                 as the candidate and proved self-equal before any diff. G6b's whole-program byte equality with it\n"
        "//                 (the S1 note restored, asserted at 230 and below) " + TAIL + "\n")
s = rep(n, s, "Its whole-program byte equality with V225 asserts at 230 and below only and\n"
              "//                 at 231 and up prints one column-0 SKIP line, never PASS and never FAIL.\n",
        "Its whole-program byte equality with V225 (asserted at 230 and below)\n"
        "//                 " + TAIL + "\n")
s = rep(n, s, "      else if(H.progDigest(restored) !== H.progDigest(pb)){ miss('another byte moved vs V225', tag); continue; }\n",
        "      // the whole-program byte equality with V225 (the else of V231; V231 absorb ruling section 3) " + TAIL + "\n")
s = cut(n, s, "  if(V231) console.log('SKIP row G6b whole-program byte equality with V225", "  if(V231) ok(ROW.G6b + ' [V231 split:",
        must=("Never PASS, never FAIL.');\n",))
s = rep(n, s, "  else ok(ROW.G6b, cells === expectCells && good === cells, good + '/' + cells + ' cells (ruled 640)'",
        "  else ok(ROW.G6b + ' [whole-program byte equality retired Post-V233]', cells === expectCells && good === cells, good + '/' + cells + ' cells (ruled 640)'")
gone(n, s, [r"another byte moved vs V225", r"SKIP row G6b"])
for need in ("const V231 = VER >= V231_ERA;", "if(V231) ok(ROW.G6b + ' [V231 split:", "(V231 ? ' | INFO, not asserted:"):
    if s.count(need) != 1:
        die(f'{n}: live anchor {need!r} count {s.count(need)} != 1')
out[p] = s

for p, s in out.items():
    open(p, 'w', encoding='utf-8').write(s)
    print('WROTE', os.path.relpath(p, ROOT))
print('C2: 4 gates written')
