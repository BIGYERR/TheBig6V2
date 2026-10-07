#!/usr/bin/env python3
# Post-V233 tooling pass, cleanup slice A2 (tests only; index.html untouched, ia-version stays 233, no bump).
# Ruling: tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Messages 3 and 4; CLAUDE.md standing ruling 3
# as amended ("a check written to switch off after its own build retires when the next build ships, and the
# previous-version run is its replacement"). Clears tests/version_scope_debt.txt (3 gates, 4 hits).
#   (R-a)  g220_d174_emoji: rows C0-C4 and their predicate `bver === '219'` (a baseline-version read from the meta tag)
#          retired; C5 (candidate only) kept with the POP_POOLS read it needs.
#   (R-a)  g230_d194_lens2: the class-iii `VER === ERA` reach jobs, jobReach and the helpers only it fed, and the 230-only
#          d194-postsweep assertion they fed ((i) at 22, (ii), the typed-build re-read) and (ii)'s SKIP line at 231+.
#   (R-e)  g230_d194_lens2: the silent-ceiling claim row d194-fixture (measure mC) with the L1 jobs' V229 CFG sweep (BCFG)
#          and the fix compare that fed only it, and W.fixPairs.
#   (R-b)  tests/version_scope_debt.txt: the three debt lines deleted; the header kept.
#   (T-ae) tests/version_scope.js: the SELECTOR exclusion (a baseline object loaded from argv[3], compared to a pinned
#          version only in the condition of `cond ? B : null`), selectors listed by --list.
#   (T-af) tests/gate.sh: GATE_TIMES_OUT carries each gate's pool=<n> column; GATE_JOBS=1 is fully serial with a pool
#          gate. tests/tooling_selftest.sh: rows G18-G21.
# Every anchor is asserted count == 1 before anything is written; the first miss aborts the whole script.
import sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
FILES = {
    'g220': 'tests/gates/g220_d174_emoji.js',
    'g230': 'tests/gates/g230_d194_lens2.js',
    'debt': 'tests/version_scope_debt.txt',
    'lint': 'tests/version_scope.js',
    'gate': 'tests/gate.sh',
    'self': 'tests/tooling_selftest.sh',
}
SRC = {k: open(ROOT + p, encoding='utf-8').read() for k, p in FILES.items()}
OUT = dict(SRC)


def abort(msg):
    print('ABORT ' + msg + ' (nothing written)')
    sys.exit(1)


def rep(k, old, new, label):
    n = OUT[k].count(old)
    if n != 1:
        abort('%s %s: anchor count %d' % (k, label, n))
    OUT[k] = OUT[k].replace(old, new)


def cut(k, start, end, new, label):
    """Replace the span from `start` (count == 1) through the first `end` after it, inclusive."""
    n = OUT[k].count(start)
    if n != 1:
        abort('%s %s: start anchor count %d' % (k, label, n))
    i = OUT[k].index(start)
    j = OUT[k].find(end, i)
    if j < 0:
        abort('%s %s: end anchor not found after start' % (k, label))
    OUT[k] = OUT[k][:i] + new + OUT[k][j + len(end):]


# ===================================================================================================================
# g220_d174_emoji.js (R-a)
# ===================================================================================================================
rep('g220', "//   - the V219 artifact (git show 920fa0a:index.html) for pool and dismiss ORDER, never for the edited rows;\n",
    "//   - (rows C0-C4 read the V219 artifact, git show 920fa0a:index.html, for pool and dismiss ORDER; retired Post-V233,\n"
    "//     see ROWS);\n", 'oracle list V219 line')
rep('g220', "//   C0 V219 readable  C1 pool tiers and counts  C2 unedited rows equal V219  C3 edited rows = hand table (and V219 =\n"
            "//   Before)  C4 POP_DISMISS  C5 reminder pool ASCII\n",
    "//   C5 reminder pool ASCII. C0-C4 (V219 readable, pool tiers and counts, unedited rows equal V219, edited rows = hand\n"
    "//   table and V219 = Before, POP_DISMISS), switched by the baseline's ia-version read `bver === '219'`, retired\n"
    "//   Post-V233 under standing ruling 3 (a build-scoped claim retires when the next build ships; the previous-version run\n"
    "//   replaces it).\n", 'ROWS header C0-C5')
rep('g220', "const BASE_REF = '920fa0a';   // V219 commit (\"V219: D167/D171/D159/D164/D170/D165/D166\")\n", '', 'BASE_REF')
rep('g220', "const COUNTS = { workout:27, reminder:5, streak:5, season:9 };\n", '', 'COUNTS')
cut('g220', "  ['C0', 'V219 artifact (git show ' + BASE_REF + ':index.html) readable and stamped 219'],\n",
    "  ['C4', 'POP_DISMISS: 7 labels, order and text unchanged from V219 (emoji kept)'],\n", '', 'ROWS C0-C4')
cut('g220', "  family(['C0', 'C1', 'C2', 'C3', 'C4', 'C5'], () => {\n",
    "    ok('C5', !!tp && tp.reminder.length === 5 && hi.length === 0, hi.map(s => JSON.stringify(s)).join(' '));\n  });\n",
    "  // C0-C4 (the V219 comparison, armed by the baseline's ia-version read) retired Post-V233 under standing ruling 3.\n"
    "  family(['C5'], () => {\n"
    "    if(!S) S = scan(src);\n"
    "    const tp = literalAt(S, 'const POP_POOLS=');\n"
    "    const hi = tp ? (tp.reminder || []).map(popText).filter(s => [...String(s)].some(ch => ch.codePointAt(0) > 0x7F)) : ['(no pool)'];\n"
    "    ok('C5', !!tp && tp.reminder.length === 5 && hi.length === 0, hi.map(s => JSON.stringify(s)).join(' '));\n  });\n",
    'family C')

# ===================================================================================================================
# g230_d194_lens2.js (R-a reach + 230 postsweep; R-e d194-fixture)
# ===================================================================================================================
# --- header comments
rep('g230', "//                 candidate (row d194-fixture claims the fixture is unmoved; no population leans on that claim).\n",
    "//                 candidate (no population leaned on the fixture-unmoved claim row d194-fixture, retired Post-V233).\n",
    'POPULATION note')
rep('g230', "//               d194-fixture is SCOPED to 230: at 231 and up it prints one column-0 SKIP line with this tree's figures,\n"
            "//               never PASS and never FAIL (\"V230's claim about V230; a later build's fixture moves by its own ruling\n"
            "//               (D195 A-1/B-1, D196, D197)\"; the candidate's L1 sweep has 150,989 pairs, V229 150,068).\n",
    "//               d194-fixture (scoped to 230 by section 3: a SKIP line at 231 and up) retired Post-V233 (POST-V233 below).\n",
    'VERSION PREDICATE d194-fixture')
rep('g230', "(ii) is dropped as vacuous (no reject day exists) and prints one column-0\n"
            "//               SKIP line; the reach jobs, which serve (ii) and the typed-build re-read, run at 230 only.\n",
    "(ii) is dropped as vacuous (no reject day exists).\n"
    "//   POST-V233  (standing ruling 3 as amended: a check written to switch off after its own build retires when the next\n"
    "//               build ships; the previous-version run replaces it) retired: d194-fixture, with the L1 jobs' V229 CFG\n"
    "//               sweep that fed only it (measure mC); d194-postsweep's 230 assertion ((i) at the typed 22, (ii) the reach,\n"
    "//               the typed-build re-read) with its `VER === ERA` reach jobs, jobReach and its helpers, and (ii)'s SKIP line\n"
    "//               at 231 and up. At 230 d194-postsweep now FAILS by name.\n",
    'VERSION PREDICATE postsweep reach')
rep('g230', "while the three instrument\n"
            "//   rows and the claim row d194-fixture pass; d194-postsweep FAILS on its (ii) (V229's overlay boot keeps the jump: 0 of\n"
            "//   88 boots equal the hand oracle) while its (i) holds (the same 22 rejects).\n",
    "while the three instrument\n"
    "//   rows pass; d194-postsweep FAILS by name (its 230 assertion retired Post-V233).\n", 'IA_ASSUME_VERSION note')
rep('g230', "//   V229 the same 22 post-sweep rejects, and V229 OV1 boot != V229 fixture boot on 88 of 88 swaps (d194-postsweep).\n",
    "//   V229 the same 22 post-sweep rejects on OV1 and the fixture (d194-postsweep).\n", 'baseline figure note')
rep('g230', "// ROWS (the three instrument rows first; if one fails, every other row FAILS by name, unread. Then the claim row\n"
            "//   d194-fixture, which fails by name and gates nothing, then the figure rows, each read and asserted on its own.)\n",
    "// ROWS (the three instrument rows first; if one fails, every other row FAILS by name, unread. Then the figure rows,\n"
    "//   each read and asserted on its own.)\n", 'ROWS intro')
cut('g230', "//   d194-fixture  CLAIM, not an instrument (R3′ \"V230 moves two guards and two filter cfgs and nothing else\"): the\n",
    "under the mutation that exists to test it.\n",
    "//   d194-fixture  retired Post-V233 (VERSION PREDICATE, POST-V233): the CLAIM (R3′ \"nothing else\") that candidate CFG ==\n"
    "//               V229 CFG on the L1 sweep and on the L9 pairs at CFG1, scoped to 230 at V231 (absorb ruling section 3).\n",
    'ROWS d194-fixture doc')
rep('g230', "named before the fold. V231 re-keyed it to 0 (absorb ruling section 6; VERSION PREDICATE above).\n",
    "named before the fold. V231 re-keyed it to 0 (absorb ruling section 6; VERSION PREDICATE above).\n"
    "//               Post-V233: the 230 assertion, its reach and (ii)'s SKIP line retired (VERSION PREDICATE, POST-V233).\n",
    'ROWS postsweep doc')
rep('g230', "//   shards (54 L432 configs each, both trees, OV1 and the fixture; at 230 and up) and its 11 reach jobs (at 230 only)\n"
            "//   (one per typed reject build, both trees, OV1 and the fixture); each enumeration, when it lands, queues its config's\n",
    "//   shards (54 L432 configs each, both trees, OV1 and the fixture; at 230 and up; its 11 reach jobs, at 230 only,\n"
    "//   retired Post-V233); each enumeration, when it lands, queues its config's\n", 'RUNTIME reach jobs')
# --- typed tables only the retired rows read
rep('g230', "self:{ records:56, l1:384 }, fixPairs:324,", "self:{ records:56, l1:384 },", 'W.fixPairs')
rep('g230', "builds:11, tried:144, landed:88 };", "builds:11 };   // tried 144 / landed 88 fed the 230 reach, retired Post-V233",
    'PS_N tried/landed')
# --- helpers only jobReach fed, and jobReach
cut('g230', "const psCards = dy => {", "\n", '', 'psCards')
cut('g230', "const psH = dy => {", "\n", '', 'psH')
cut('g230', "const psVis = dy => ", "\n", '', 'psVis')
cut('g230', "// the hand oracle for the boot: the live day",
    "e.sections = (e.sections || []).filter(s => s.items && s.items.length); return e; }\n", '', 'psOracle')
cut('g230', "// measure's trySwap: the first of three candidates", "  return { none:true }; }\n", '', 'psTrySwap')
cut('g230', "// reach: one typed reject build on the four presentations",
    "ora:psVis(ora) } }); } } }\n  return out; }\n", '', 'jobReach')
rep('g230', "ps:jobPS, reach:jobReach };", "ps:jobPS };", 'JOBK reach')
# --- the L1 jobs' V229 CFG sweep and fix compare (fed only d194-fixture)
rep('g230', "S:{ CCFG:newL1(), CSTAMP:newL1(), BCFG:newL1(), BSTAMP:newL1() },\n"
            "    x:{ sc:{ n:0, align:true, card:0, toast:0 }, fix:{ n:0, align:true, card:0, toast:0 }, nc:{ n:0, eq:0 },",
    "S:{ CCFG:newL1(), CSTAMP:newL1(), BSTAMP:newL1() },\n"
    "    x:{ sc:{ n:0, align:true, card:0, toast:0 }, nc:{ n:0, eq:0 },", 'jobL1 out')
rep('g230', "BCFG:sweepL1(B, cfg, 'CFG'), ", '', 'jobL1 BCFG sweep')
rep('g230', "cmp(out.x.sc, R.CSTAMP, R.CCFG, 'sc'); cmp(out.x.fix, R.CCFG, R.BCFG, 'fix');",
    "cmp(out.x.sc, R.CSTAMP, R.CCFG, 'sc');", 'jobL1 fix cmp')
rep('g230', "BCFG:sumL1('BCFG'), ", '', 'parent L BCFG')
rep('g230', "const X = { sc:{ n:0, align:true, card:0, toast:0 }, fix:{ n:0, align:true, card:0, toast:0 }, nc:",
    "const X = { sc:{ n:0, align:true, card:0, toast:0 }, nc:", 'parent X fix')
rep('g230', "', CSTAMP ' + L.CSTAMP.pairs + ', BCFG ' + L.BCFG.pairs + ', BSTAMP '", "', CSTAMP ' + L.CSTAMP.pairs + ', BSTAMP '",
    'L1 line pairs')
rep('g230', "[L.CCFG.thr, L.CSTAMP.thr, L.BCFG.thr, L.BSTAMP.thr]", "[L.CCFG.thr, L.CSTAMP.thr, L.BSTAMP.thr]", 'L1 line throws')
# --- d194-fixture: label, FIG, computation, SKIP print
cut('g230', "  'd194-fixture': 'row d194-fixture CLAIM", "\n", '', 'R d194-fixture')
rep('g230', "const FIG = ['d194-fixture', ", "const FIG = [", 'FIG head')
rep('g230', "'d194-postsweep'];   // d194-fixture is a claim row: read like a figure row, gates nothing\n", "'d194-postsweep'];\n",
    'FIG tail')
cut('g230', "  // the claim row d194-fixture (R3′ \"nothing else\"): computed beside the instruments",
    "', aligned ' + X.fix.align + '), pairs ' + fp + '/' + PR.length]; }\n", '', 'RES d194-fixture')
rep('g230', "  // the two sets are named on the BASELINE fixture (B:CFG1, the ruled expected answer; the claim row d194-fixture says\n"
            "  // it == the candidate's fixture and gates nothing), not by the card the overlay printed: its bwsets ends at RPE 7\n",
    "  // the two sets are named on the BASELINE fixture (B:CFG1, the ruled expected answer), not by the card the overlay\n"
    "  // printed: its bwsets ends at RPE 7\n", 'k″ comment')
cut('g230', "  // V231 (absorb ruling section 3, g230 d194-fixture SCOPE; standing rulings 2 and 4): at 231 and up the claim row is\n",
    "Never PASS, never FAIL.'); return; }\n", "  FIG.forEach(k => {\n", 'FIG.forEach SKIP')
# --- the reach jobs (VER === ERA) and the 230 postsweep branch they fed
rep('g230', "// d194-postsweep (D194 Amendment 4; V231 absorb ruling section 6) asserts at 230 and up, so its population jobs run at 230\n"
            "// and up; its reach jobs serve (ii) and the typed-build re-read, which assert at 230 only ((ii) is dropped as vacuous at\n"
            "// 231 and up: no reject day exists), so they run only there.\n",
    "// d194-postsweep (D194 Amendment 4; V231 absorb ruling section 6): its population jobs run at 230 and up. Its reach jobs\n"
    "// (at 230 only: (ii) and the typed-build re-read) retired Post-V233 under standing ruling 3, with the 230 assertion.\n",
    'JOBS postsweep comment')
rep('g230', "  if(VER === ERA) [...new Set(PS_TABLE.map(psBuild))].forEach(k => JOBS.push({ kind:'reach', ck:k, art:CF, base:BF })); }\n",
    "}\n", 'reach jobs VER === ERA')
rep('g230', "  // d194-postsweep (D194 Amendment 4, INFO): at 230 the typed table, the re-read and (ii) assert as ruled. V231 (absorb ruling\n",
    "  // d194-postsweep (D194 Amendment 4, INFO): its 230 assertion (the typed table, the re-read, (ii)) retired Post-V233\n"
    "  // (standing ruling 3); at 230 the row FAILS by name. V231 (absorb ruling\n", 'postsweep block comment 1')
rep('g230', "(no reject day exists) and prints one column-0 SKIP line.\n", "(no reject day exists).\n", 'postsweep block comment 2')
cut('g230', "    P('SKIP row d194-postsweep (ii) the reach on the typed reject days:", "Never PASS, never FAIL.');\n", '',
    'SKIP (ii) line')
cut('g230', "  else { const SJ = JOBS.map((j, i) => j.kind === 'ps' ? res[i] : undefined).filter(x => x !== undefined), RJ = ",
    ", V229 rejects == typed ' + popOK('B:OV1') + '/' + popOK('B:CFG1'))]; }\n",
    "  else RES['d194-postsweep'] = [false, 'its ia-version 230 assertion ((i) at the typed 22, (ii) the reach, the typed-build"
    " re-read) retired Post-V233 under standing ruling 3; d194-postsweep asserts from 231'];\n", 'postsweep 230 branch')

# ===================================================================================================================
# tests/version_scope_debt.txt (R-b): every debt line deleted, the header kept
# ===================================================================================================================
rep('debt', "g208_d103a_readers.js 1  # 7 rows (mE 0/7/0) retired Post-V233 R2; the hit left is E3e's V213 tree source (IB.version === 213), not a row switch\n",
    '', 'debt g208')
rep('debt', "g220_d174_emoji.js 2  # 0 rows (not in mE): bver === '219', a baseline version read from the ia-version meta\n", '', 'debt g220')
rep('debt', "g230_d194_lens2.js 1  # 1 rows, mE classes 0/0/1\n", '', 'debt g230')

# ===================================================================================================================
# tests/version_scope.js (T-ae): the SELECTOR exclusion
# ===================================================================================================================
rep('lint', "// version binding (BASE_VER, or a name read from the ia-version meta), which is a hit.\n",
    "// version binding (BASE_VER, or a name read from the ia-version meta), which is a hit.\n"
    "// Also NOT a hit (post-V233 A2), a SELECTOR: `(B && +B.version === NNN) ? B : null`, the equality inside the condition\n"
    "// of a ternary assigned to a name that is not a version binding, whose consequent is that same object B and whose\n"
    "// alternate is null or undefined, where B is loaded (load(...)) from argv[3], directly or through one binding, and is\n"
    "// never bound from the candidate path. The comparison only chooses which pinned file a live row reads as its oracle\n"
    "// (g208_d103a_readers' E3e and its V213 tree). --list prints each selector as a `# selector (not a hit)` line.\n",
    'header selector')
rep('lint', "    asg.push({ name, rhs: code.slice(re.lastIndex, k), rhsNc: nc.slice(re.lastIndex, k), prevCh });\n",
    "    asg.push({ name, rhs: code.slice(re.lastIndex, k), rhsNc: nc.slice(re.lastIndex, k), prevCh, from: re.lastIndex, to: k });\n",
    'asg offsets')
rep('lint', "  // equality operands\n  const hits = []; const eq = /[!=]==?/g;\n",
    r"""  // SELECTOR (post-V233 A2; header): a baseline object B loaded from argv[3] (directly or through one binding) and never
  // bound from the candidate path, its version compared to an era in the condition of `cond ? B : null`.
  const ARGV3 = /\bprocess\s*\.\s*argv\s*\[\s*3\s*\]/, ARGV2 = /\bprocess\s*\.\s*argv\s*\[\s*2\s*\]/;
  const argv3 = new Set(asg.filter(a => ARGV3.test(a.rhs)).map(a => a.name));
  const baseObjs = new Set(asg.filter(a => /\bload\s*\(/.test(a.rhs) && (ARGV3.test(a.rhs) || mentions(a.rhs, argv3))).map(a => a.name));
  for (const a of asg) if (mentions(a.rhs, candPath) || ARGV2.test(a.rhs)) baseObjs.delete(a.name);
  baseObjs.delete('IA'); for (const c of candPath) baseObjs.delete(c);
  const selectors = [];
  const selector = (o, verSide) => {
    const mm = new RegExp('^(' + ID + ')\\s*\\.\\s*(version|IA_VERSION)$').exec(stripWrap(verSide)); if (!mm || !baseObjs.has(mm[1])) return false;
    const a = asg.filter(z => z.from <= o && o < z.to).sort((x, y) => (x.to - x.from) - (y.to - y.from))[0];
    if (!a || vers.has(a.name)) return false;
    const lead = a.rhs.length - a.rhs.replace(/^\s+/, '').length, t = ternaryBranches(a.rhs.trim());
    return !!t && o - a.from < lead + t[0].length && t[1].trim() === mm[1] && /^(null|undefined)$/.test(t[2].trim()); };
  // equality operands
  const hits = []; const eq = /[!=]==?/g;
""", 'selector code')
rep('lint', r"""    if ((isVer(L) && isEra(R)) || (isVer(R) && isEra(L))) hits.push({ line: lineAt(o), kind: op, expr: (L.trim() + ' ' + op + ' ' + R.trim()).replace(/\s+/g, ' ') });
""", r"""    if ((isVer(L) && isEra(R)) || (isVer(R) && isEra(L))) {
      const h = { line: lineAt(o), kind: op, expr: (L.trim() + ' ' + op + ' ' + R.trim()).replace(/\s+/g, ' ') };
      if (selector(o, isVer(L) ? L : R)) selectors.push(h); else hits.push(h); }
""", 'hits push')
rep('lint', "  return { hits: hits.sort((a, b) => a.line - b.line), vers: [...vers], objs: [...objs], eras: [...eras] };\n",
    "  return { hits: hits.sort((a, b) => a.line - b.line), selectors, vers: [...vers], objs: [...objs], eras: [...eras] };\n",
    'analyse return')
rep('lint', r"""    for (const f of files) { if (!S[f].hits.length) continue; g++; for (const h of S[f].hits) { n++; console.log(f + ':' + h.line + '\t' + h.expr); } }
""", r"""    for (const f of files) for (const h of S[f].selectors) console.log('# selector (not a hit) ' + f + ':' + h.line + '\t' + h.expr);
    for (const f of files) { if (!S[f].hits.length) continue; g++; for (const h of S[f].hits) { n++; console.log(f + ':' + h.line + '\t' + h.expr); } }
""", '--list selectors')

# ===================================================================================================================
# tests/gate.sh (T-af)
# ===================================================================================================================
rep('gate', "  # gate_times.txt; when GATE_TIMES_OUT is set it writes the measured `<gate> <seconds>` lines there after grading,\n"
            "  # and the weekly full run refreshes gate_times.txt from that file.\n",
    "  # gate_times.txt; when GATE_TIMES_OUT is set it writes the measured `<gate> <seconds>` lines there after grading,\n"
    "  # each gate's `pool=<n>` column carried over from gate_times.txt (post-V233 A2), and the weekly full run refreshes\n"
    "  # gate_times.txt from that file.\n", 'header GATE_TIMES_OUT')
rep('gate', "  # GATE_TIMES_OUT read the same result files in the same glob order as before.\n",
    "  # GATE_TIMES_OUT read the same result files in the same glob order as before. GATE_JOBS=1 is fully serial (post-V233\n"
    "  # A2): each pool gate runs to completion first, in the foreground and one at a time (still with GATE_POOL=<n>), then\n"
    "  # the other gates go through xargs at -P 1; with GATE_JOBS above 1 nothing here changes.\n", 'header serial')
HEAVY_OLD = r"""  HSUM=0; HPIDS=(); HNAMES=""
  while IFS=$'\t' read -r HP HG; do
    GATE_POOL="$HP" GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" "$TMP/rungate.sh" "$HG" < /dev/null &
    HPIDS+=("$!"); HSUM=$(( HSUM + HP )); HNAMES="$HNAMES${HNAMES:+, }$(basename "$HG") GATE_POOL=$HP"
  done < "$TMP/heavy"
  LP="$JOBS"
  if [ "$HSUM" -gt 0 ]; then
    LP=$(( JOBS - HSUM )); if [ "$LP" -lt 2 ]; then LP=2; fi
    echo "   heavy slots: started first in the background: $HNAMES; the other $(wc -l < "$TMP/lightlist" | tr -d ' ') gates run -P $LP (max(2, GATE_JOBS $JOBS - pools $HSUM))"
  fi
"""
HEAVY_NEW = r"""  HSUM=0; HPIDS=(); HNAMES=""
  if [ "$JOBS" -eq 1 ]; then
  # GATE_JOBS=1 (post-V233 A2): fully serial. Every pool gate runs to completion here, in the foreground and one at a time,
  # before xargs starts the other gates at -P 1.
  while IFS=$'\t' read -r HP HG; do HSUM=$(( HSUM + HP )); HNAMES="$HNAMES${HNAMES:+, }$(basename "$HG") GATE_POOL=$HP"; done < "$TMP/heavy"
  if [ "$HSUM" -gt 0 ]; then
    echo "   heavy slots: GATE_JOBS 1 is serial: $HNAMES run to completion first, one at a time; the other $(wc -l < "$TMP/lightlist" | tr -d ' ') gates run -P 1"
    while IFS=$'\t' read -r HP HG; do
      GATE_POOL="$HP" GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" "$TMP/rungate.sh" "$HG" < /dev/null
    done < "$TMP/heavy"
  fi
  LP=1
  else
""" + HEAVY_OLD + "  fi\n"
rep('gate', HEAVY_OLD, HEAVY_NEW, 'heavy launch')
rep('gate', "  # GATE_TIMES_OUT: the measured seconds, glob order, in gate_times.txt's format. A gate with no measured time is named\n"
            "  # and left out (it then starts first on a run that reads this file, as an unknown gate does).\n",
    "  # GATE_TIMES_OUT: the measured seconds, glob order, in gate_times.txt's format. A gate with no measured time is named\n"
    "  # and left out (it then starts first on a run that reads this file, as an unknown gate does). Each gate's pool=<n>\n"
    "  # column is carried over from gate_times.txt (post-V233 A2), so a refresh from this file never drops it.\n",
    'GATE_TIMES_OUT comment')
rep('gate', r"""      if printf '%s' "$SEC" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then echo "$(basename "$g") $SEC" >> "$TMP/times.out"
""", r"""      PCOL="$(awk -F'\t' -v b="$(basename "$g")" '$1 == b { printf " pool=%s", $2; exit }' "$TMP/pools")"   # carried over
      if printf '%s' "$SEC" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then echo "$(basename "$g") $SEC$PCOL" >> "$TMP/times.out"
""", 'GATE_TIMES_OUT pool column')

# ===================================================================================================================
# tests/tooling_selftest.sh (T-af rows G18-G21)
# ===================================================================================================================
G17 = """row "G17 grading unchanged: all 8 graded in glob order (the heavy toy 4th) with seconds, GATE_TIMES_OUT lists all 8, ALL GATES PASS, exit 0" 'rc_is "$O" 0 && hasX "$O" "ALL GATES PASS" && graded8 "$O"' "$O"
"""
rep('self', G17, G17 + r"""row "G18 GATE_TIMES_OUT carries the pool column over: d_heavy.js <seconds> pool=3, the 7 light toys two columns each" '[ "$(grep -cE "^d_heavy\.js [0-9]+(\.[0-9]+)? pool=3$" "$O.times" || true)" = 1 ] && [ "$(grep -cE "^[a-z]_light\.js [0-9]+(\.[0-9]+)?$" "$O.times" || true)" = 7 ]' "$O.times"
# GATE_JOBS=1 is fully serial (post-V233 A2): the pool toy runs to completion first, in the foreground, with its GATE_POOL;
# then the other toys one at a time (xargs -P 1), longest first. Each toy appends `start <toy> <GATE_POOL or -> <toys
# running, itself included>` and `end <toy>` to one log, in the order they happen.
GS="$W/gate_serial"; mk_gate_tree "$GS"; SD="$W/gate_serial_conc"; mkdir -p "$SD/run"
cat > "$W/serial_toy.js" <<'JS'
const fs = require('fs'), path = require('path'), D = process.env.SELFTEST_CONC, me = path.basename(__filename);
fs.writeFileSync(path.join(D, 'run', me), '');
fs.appendFileSync(path.join(D, 'serial.log'), 'start ' + me + ' ' + (process.env.GATE_POOL || '-') + ' ' + fs.readdirSync(path.join(D, 'run')).length + '\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
fs.unlinkSync(path.join(D, 'run', me));
fs.appendFileSync(path.join(D, 'serial.log'), 'end ' + me + '\n');
console.log('PASS 1 FAIL 0');
JS
for k in a_light b_heavy c_light; do cp "$W/serial_toy.js" "$GS/tests/gates/$k.js"; done
printf '# toy start times: b_heavy.js has the pool column; c_light.js is the longer of the other two\na_light.js 1.0\nb_heavy.js 0.5 pool=2\nc_light.js 2.0\n' > "$GS/tests/gate_times.txt"
O="$W/g_serial.out"
run "$O" env -u GATE_POOL GATE_JOBS=1 PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$W/g_serial.start" SELFTEST_REAL_XARGS="$REAL_XARGS" SELFTEST_CONC="$SD" GATE_TIMES_OUT="$O.times" bash "$GS/tests/gate.sh" "$R/index.html"
SERIAL="start b_heavy.js 2 1|end b_heavy.js|start c_light.js - 1|end c_light.js|start a_light.js - 1|end a_light.js"
row "G19 GATE_JOBS=1 with a pool=2 toy: it ran to completion first with GATE_POOL=2, then the other two one at a time, longest first, never two at once" '[ "$(tr "\n" "|" < "$SD/serial.log" | sed "s/|$//")" = "$SERIAL" ]' "$SD/serial.log"
row "G20 at GATE_JOBS=1 xargs got the 2 other toys at -P 1, and gate.sh named the serial heavy slot" '[ "$(words "$W/g_serial.start")" = "c_light.js a_light.js" ] && [ "$(xargs_p "$W/g_serial.start.args")" = 1 ] && hasF "$O" "heavy slots: GATE_JOBS 1 is serial: b_heavy.js GATE_POOL=2 run to completion first, one at a time; the other 2 gates run -P 1"' "$O"
row "G21 grading unchanged at GATE_JOBS=1: 3 graded in glob order, ALL GATES PASS, exit 0; GATE_TIMES_OUT keeps b_heavy.js pool=2" 'rc_is "$O" 0 && hasX "$O" "ALL GATES PASS" && [ "$(grade_order "$O")" = "a_light.js b_heavy.js c_light.js" ] && [ "$(grep -cE "^b_heavy\.js [0-9]+(\.[0-9]+)? pool=2$" "$O.times" || true)" = 1 ]' "$O"
""", 'self rows G18-G21')

# ===================================================================================================================
# write (only after every anchor above held); re-read each target right before its write so a concurrent edit to the
# same file (M1a edits tooling_selftest.sh in parallel) is detected rather than clobbered
# ===================================================================================================================
for k, p in FILES.items():
    if open(ROOT + p, encoding='utf-8').read() != SRC[k]:
        abort('%s changed on disk while this script ran' % p)
for k, p in FILES.items():
    if OUT[k] == SRC[k]:
        abort('%s: no change produced' % p)
for k, p in FILES.items():
    with open(ROOT + p, 'w', encoding='utf-8') as f:
        f.write(OUT[k])
    print('wrote %s (%+d bytes)' % (p, len(OUT[k]) - len(SRC[k])))
print('post_v233_a2_cleanup: all anchors held; 6 files written')
