#!/usr/bin/env python3
# Post-V233 tooling pass, ceiling-retirement slice C3 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Messages 3 and 4, and standing ruling 3 as amended:
# a check written to switch off after its own build retires when the next build ships, and the previous-version run
# (Proof scope) is its replacement. Evidence: measure mC (tests/measure/v233_rulings/measure_ceilings_mC.md): the
# silent-ceiling CONJUNCTS of the V231 absorb ruling, dark at 233 inside rows that still assert.
#   g229_d193_build  row b: the two "byte-identical to V228" conjuncts (injured builds outside the clamp population,
#                    the 133 uninjured builds; `VER >= V231_ERA ? bKeep : bKeep && ...` and the SKIP line). The ternary
#                    collapses to bKeep, the row's 233 verdict.
#                    row j: the "L1 uninjured 96/96 byte-identical" conjunct (`JJ.l1UnSame === J_UNINJ` on the below-231
#                    side and the SKIP line). `VER >= V231_ERA` stays: it still switches row j's D196-1 values.
#   g229_d194_lens   p-SWAP, p-AUX, p-ADD: "pre-from W3 == V228", "FIX W3+W5 == V228" and the row-set symmetry they rest
#                    on (symOK, the worker's `sym` and its `cnt` helper, the SKIP line). p-UNSTAMPED: the HALF_MANNY W3/W5
#                    == V228 conjunct (W.manny, okU's HALF_MANNY half, the SKIP line). `VER >= V231_ERA` stays: it still
#                    switches the W231 row counts and the labels.
# Labels: each live row's label drops the retired claim and the "...SKIP(s)" clause naming it (b, j, p-SWAP, p-AUX,
# p-ADD, p-UNSTAMPED); every other byte of every PASS/FAIL line is unchanged. The INFO lines that print the retired
# figures stay (they read um3/um5, B.injSame/B.unSame, JJ.l1UnSame, S.eq3/S.eqf, which therefore stay).
# Diff class: (R-e) silent-ceiling conjuncts retired, live rows untouched in verdict.
# Every anchor counts exactly 1 before anything is written; the first miss aborts the whole script.
import json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
TAIL = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(name, src, old, new):
    n = src.count(old)
    if n != 1:
        die(f'{name}: anchor count {n} != 1: {old[:100]!r}')
    return src.replace(old, new)


def blank(src):
    """tests/version_scope.js's own blank(): {code: comments and string bodies blanked, nc: comments blanked}."""
    r = subprocess.run(['node', '-e', "const vs=require(process.argv[1]);let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.stringify(vs.blank(s))));",
                        os.path.join(ROOT, 'tests', 'version_scope.js')], input=src, capture_output=True, text=True)
    if r.returncode:
        die('blank() failed: ' + r.stderr[-300:])
    o = json.loads(r.stdout)
    if not isinstance(o, dict) or len(o.get('code', '')) != len(src) or len(o.get('nc', '')) != len(src):
        die('blank() returned an unexpected shape')
    return o


def count_code(src, pat):
    """Occurrences of pat with comments stripped (blank().nc), so a token inside a string still counts."""
    return len(re.findall(pat, blank(src)['nc']))


new = {}

# ── g229_d193_build: rows b and j ─────────────────────────────────────────────────────────────────────────────────────
g = 'g229_d193_build'
s = open(os.path.join(G, g + '.js'), encoding='utf-8').read()
# header: the 231 block keeps its history; one line records the retirement
s = rep(g, s, "//                  `2×6–10 each @ RPE 7`, 2 to 14). Below 231 both rows assert as before.\n",
              "//                  `2×6–10 each @ RPE 7`, 2 to 14). Below 231 both rows assert as before.\n"
              "//   Post-V233      b's two and j's one scoped \"byte-identical to V228\" conjuncts and their SKIP lines (V231 absorb\n"
              "//                  ruling, dark at 231 and up) " + TAIL + "\n")
# label: R.b and R.j drop the retired claims
s = rep(g, s, "  b:   'row b         nothing moves but the clamp population: every other card of every injured build byte-identical to V228, > 0 moved; uninjured 133 byte-identical; HALF_MANNY on the era row,",
              "  b:   'row b         > 0 moved; uninjured 133; HALF_MANNY on the era row,")
s = rep(g, s, ", 0 R7 on uninjured, 96/96 uninjured L1 byte-identical',\n",
              ", 0 R7 on uninjured',\n")
# row b: the comment, the SKIP line, the label's SKIP clause, the ternary
s = rep(g, s, "  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g229_d193:421 b SPLIT; standing rulings 2 and 4):\n"
              "  // bKeep is every conjunct the row keeps at 231 and up (object row, 0 _preHold on uninjured builds, HALF_MANNY on the era\n"
              "  // row, > 0 clamp moves, the baseline equal to itself). The two \"byte-identical to V228\" conjuncts assert at 230 and below\n"
              "  // only; at 231 and up they print one named SKIP line at column 0, never PASS and never FAIL.\n",
              "  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g229_d193:421 b SPLIT; standing rulings 2 and 4):\n"
              "  // bKeep is the row (object row, 0 _preHold on uninjured builds, HALF_MANNY on the era row, > 0 clamp moves, the\n"
              "  // baseline equal to itself).\n"
              "  // Row b's two \"byte-identical to V228\" conjuncts (V231 absorb ruling, dark from `VER >= V231_ERA`) " + TAIL + "\n")
s = rep(g, s, "  if(VER >= V231_ERA) console.log('SKIP row b byte-identical to V228 (injured builds outside the clamp population ' + B.injSame + '/' + B.inj + ', uninjured builds ' + B.unSame + '/' + B.un + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');\n", "")
s = rep(g, s, " [V231 split: object row, _preHold, MANNY era row, > 0 moved; the byte-identical conjuncts SKIP]",
              " [V231 split: object row, _preHold, MANNY era row, > 0 moved]")
s = rep(g, s, "    VER >= V231_ERA ? bKeep : bKeep && B.injSame === B.inj && B.unSame === B.un,\n",
              "    bKeep,\n")
# row j: the comment, the SKIP line, the label's SKIP clause, the below-231 conjunct
s = rep(g, s, "  // thrust (R7's text), final-name Burpees 0, bed thrust held 2, unheld 102/102, number-only 0, uninjured R7 0; its\n"
              "  // \"L1 uninjured byte-identical to V228\" conjunct asserts at 230 and below only and at 231 and up prints one named SKIP\n"
              "  // line at column 0, never PASS and never FAIL. Below 231 the row is unchanged.\n",
              "  // thrust (R7's text), final-name Burpees 0, bed thrust held 2, unheld 102/102, number-only 0, uninjured R7 0. Below 231\n"
              "  // the row asserts its V229 figures.\n"
              "  // Row j's \"L1 uninjured byte-identical to V228\" conjunct (V231 absorb ruling, dark from `VER >= V231_ERA`) " + TAIL + "\n")
s = rep(g, s, "    console.log('SKIP row j L1 uninjured byte-identical to V228 (' + JJ.l1UnSame + '/' + JJ.l1Un + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');\n", "")
s = rep(g, s, " + J_V231.burpees + '; the L1 uninjured byte-identical conjunct SKIPs]',",
              " + J_V231.burpees + ']',")
s = rep(g, s, "    && JJ.numOnly === 0 && JJ.l1Un === J_UNINJ && JJ.l1UnSame === J_UNINJ && JJ.heldOtherOK === JJ.heldOther",
              "    && JJ.numOnly === 0 && JJ.l1Un === J_UNINJ && JJ.heldOtherOK === JJ.heldOther")
# proofs on the result: nothing names the retired conjuncts in code; every kept reader is still read
b = blank(s)['code']
for pat in (r'B\.injSame === B\.inj', r'B\.unSame === B\.un', r'l1UnSame === J_UNINJ', r'\bSKIP\b'):
    if count_code(s, pat): die(f'{g}: retired token still in code: {pat}')
if re.search(r'VER\s*>=\s*V231_ERA\s*\?\s*bKeep', b): die(f'{g}: b ternary survived')
for pat, lo in ((r'\bB\.injSame\b', 2), (r'\bB\.unSame\b', 2), (r'\bJJ\.l1UnSame\b', 2), (r'\bJ_UNINJ\b', 2), (r'\bV231_ERA\b', 3), (r'\bbKeep\b', 2)):
    k = count_code(s, pat)
    if k < lo: die(f'{g}: kept reader {pat} read {k} times, want >= {lo}')
new[g] = s

# ── g229_d194_lens: p-SWAP, p-AUX, p-ADD, p-UNSTAMPED ─────────────────────────────────────────────────────────────────
g = 'g229_d194_lens'
s = open(os.path.join(G, g + '.js'), encoding='utf-8').read()
s = rep(g, s, "//               FAIL. Below 231 the four rows assert exactly as before.\n",
              "//               FAIL. Below 231 the four rows assert exactly as before.\n"
              "//   Post-V233   the four rows' scoped \"== V228\" conjuncts, the row-set symmetry and their SKIP lines (V231 absorb\n"
              "//               ruling, dark at 231 and up) " + TAIL + "\n")
# W.manny: read only by okU's HALF_MANNY half
s = rep(g, s, "  travel:32, manny:{ w3:30, w5:29 }, noinj:{ w3:32, w5:32 },", "  travel:32, noinj:{ w3:32, w5:32 },")
# labels
for row in ("pSWAP: 'row p-SWAP      L1 overlay W5 swap lists: rejected names 0 (V228 ' + W.L1.v228.pat + ' of 4,529), OV == FIX on spliced days 4,529/4,529",
            "pAUX:  'row p-AUX       L1 overlay W5 aux lists (incl. _powerAllowed): rejected 0 (V228 ' + W.L1.v228.aux + ' of 1,754), OV == FIX 1,754/1,754",
            "pADD:  'row p-ADD       L1 overlay W5 add pickers: rejected 0 (V228 ' + W.L1.v228.add + ' of 1,440), OV == FIX 1,440/1,440"):
    s = rep(g, s, row + "; pre-from W3 and every FIX list == V228',\n", row + "',\n")
s = rep(g, s, "travel-only overlay W5 == V228; HALF_MANNY and mario_noinj W3/W5 lists == V228',\n",
              "travel-only overlay W5 == V228; mario_noinj W3/W5 lists == V228',\n")
# worker: the row-set symmetry (sym, cnt)
s = rep(g, s, "    // row-set symmetry: the baseline lists no row the candidate lacks\n"
              "    const cnt = WL => DAYS.reduce((n, d) => n + WL[d].rows.length, 0);\n"
              "    res.l1.push({ ci, K, sym:[cnt(o3) === cnt(b3), cnt(f5) === cnt(bf5), cnt(f3) === cnt(bf3)] });\n",
              "    // the row-set symmetry (the p-SWAP/p-AUX/p-ADD \"== V228\" conjuncts rested on it) " + TAIL + "\n"
              "    res.l1.push({ ci, K });\n")
# p-UNSTAMPED
s = rep(g, s, "  const okU = um3.all && um3.n === W.manny.w3 && um5.all && um5.n === W.manny.w5 && un3.all && un3.n === W.noinj.w3 && un5.all && un5.n === W.noinj.w5;\n",
              "  const okU = un3.all && un3.n === W.noinj.w3 && un5.all && un5.n === W.noinj.w5;\n")
s = rep(g, s, "  // 231 and up the row keeps Thursday-from, travel-only and mario_noinj W3/W5 == V228; the HALF_MANNY W3/W5 == V228\n"
              "  // conjunct asserts at 230 and below only and at 231 and up prints one named SKIP line at column 0.\n",
              "  // 231 and up the row keeps Thursday-from, travel-only and mario_noinj W3/W5 == V228.\n"
              "  // Its HALF_MANNY W3/W5 == V228 conjunct (V231 absorb ruling, dark from `VER >= V231_ERA`) " + TAIL + "\n")
s = rep(g, s, "    P('SKIP row p-UNSTAMPED HALF_MANNY W3/W5 lists == V228 (W3 ' + um3.eq + '/' + um3.n + ', W5 ' + um5.eq + '/' + um5.n + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');\n", "")
s = rep(g, s, "mario_noinj W3/W5 == V228; the HALF_MANNY W3/W5 conjunct SKIPs]';", "mario_noinj W3/W5 == V228]';")
# p-SWAP / p-AUX / p-ADD
s = rep(g, s, "  const symOK = L.every(x => x.sym.every(Boolean));\n", "")
s = rep(g, s, "    const c = allCfg && symOK && SELF && S.n5 === want && S.st5 === want && S.rej === 0 && S.cards === 0 && S.eqFix === want && S.fixMiss === 0\n"
              "      && S.n3 > 0 && S.eq3 === S.n3 && S.st3 === 0 && S.rej3 > 0 && S.nf > 0 && S.eqf === S.nf;\n",
              "    const c = allCfg && SELF && S.n5 === want && S.st5 === want && S.rej === 0 && S.cards === 0 && S.eqFix === want && S.fixMiss === 0\n"
              "      && S.n3 > 0 && S.st3 === 0 && S.rej3 > 0 && S.nf > 0;\n")
s = rep(g, s, "    // and D196 via the cards; standing rulings 2 and 4): at 231 and up the row keeps every conjunct but the two \"== V228\"\n"
              "    // ones and the row-set symmetry they rest on, at the W231 row counts; those print one named SKIP line at column 0.\n",
              "    // and D196 via the cards; standing rulings 2 and 4): at 231 and up the row asserts at the W231 row counts.\n"
              "    // Its \"pre-from W3 == V228\" and \"FIX W3+W5 == V228\" conjuncts and the row-set symmetry they rest on (V231 absorb\n"
              "    // ruling, dark from `VER >= V231_ERA`) " + TAIL + "\n")
s = rep(g, s, "    if(VER >= V231_ERA){ const w2 = W231[k], asym = L.filter(x => !x.sym.every(Boolean)).length;\n",
              "    if(VER >= V231_ERA){ const w2 = W231[k];\n")
s = rep(g, s, "      P('SKIP row ' + row.replace(/^p/, 'p-') + ' pre-from W3 OV lists == V228 (' + S.eq3 + '/' + S.n3 + '), FIX W3+W5 lists == V228 (' + S.eqf + '/' + S.nf + ') and the row-set symmetry they rest on (' + asym + ' of ' + seen.size + ' cfgs asymmetric) on this tree: scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');\n", "")
s = rep(g, s, " + w2 + '/' + w2 + '; W3 == V228, FIX == V228 and the row-set symmetry SKIP]';", " + w2 + '/' + w2 + ']';")
s = rep(g, s, " + (S.rej3 > 0 ? '' : '; judge blind on W3') + (symOK ? '' : '; row sets differ')];\n",
              " + (S.rej3 > 0 ? '' : '; judge blind on W3')];\n")
for pat in (r'\bsymOK\b', r'\basym\b', r'\.sym\b', r'\bsym:', r'\bcnt\(', r'W\.manny\b', r'S\.eq3 === S\.n3', r'S\.eqf === S\.nf', r'\bSKIP\b', r'row sets differ'):
    if count_code(s, pat): die(f'{g}: retired token still in code: {pat}')
for pat, lo in ((r'\bum3\b', 3), (r'\bum5\b', 3), (r'\bb3\b', 2), (r'\bbf5\b', 2), (r'\bbf3\b', 2), (r'\bokU\b', 2), (r'\bokN\b', 2),
                (r'\bS\.eq3\b', 2), (r'\bS\.eqf\b', 2), (r'\bV231_ERA\b', 3), (r'\bW231\b', 2), (r'\bCFGS\.manny\b|\bmanny:', 1)):
    k = count_code(s, pat)
    if k < lo: die(f'{g}: kept reader {pat} read {k} times, want >= {lo}')
new[g] = s

# ── write, then parse ─────────────────────────────────────────────────────────────────────────────────────────────────
for g, s in new.items():
    p = os.path.join(G, g + '.js')
    open(p, 'w', encoding='utf-8').write(s)
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode: die(g + ': node --check failed: ' + r.stderr[-400:])
    print('wrote + node --check ok: tests/gates/' + g + '.js')
