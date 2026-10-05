#!/usr/bin/env python3
# V232 slice 5: re-key g224_d185_wctoday section 1 (test file only; index.html is not edited).
# Decision: tests/measure/v232_rulings/v232_session_calls.md item 17 (gate scope, not doctrine), on gatekeeper run 1
# (tests/measure/v232_rulings/gatekeeper_run1.md): g224 RED on section 1 only, rows "line 643..647" compare
# lines[642..646] to fixed strings; V232's ruled D199 CSS hunk (`.iaw-solo` + comment, 6 lines at :335) moved the five
# lines to 649-653, byte-identical and in order. 23 other rows pass, the independent cascade resolver among them.
#   E3a header: a SECTION 1 SCOPE paragraph after the VERSION PREDICATE paragraph (V232 D199, session call 17).
#   E3b section 1: the five positional rows keep their labels, their indices (lines[642..646], NOT re-pointed: standing
#       ruling 3) and their hand-typed literals (now held once in V224_BLOCK, asserted byte-identical to the old rows'
#       literals below); they run only at ia-version <= 231 (the V224 layout era, standing ruling 4) and above it each
#       prints a SKIP naming the reason, counted in neither PASS nor FAIL. Section 1b adds position-free successor rows,
#       run on every version the gate runs on (>= 224, or a mid-slice surface): each of the five lines occurs exactly
#       once in the comment-stripped <style> text, and they are contiguous in V224's order, located by content.
#   Section 2 onward and the summary line are untouched.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, subprocess, hashlib

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
G = ROOT + '/tests/gates/g224_d185_wctoday.js'
P = ROOT + '/index.html'
CAND_SHA = '03b5924d809d'


def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)


cs = hashlib.sha1(open(P, 'rb').read()).hexdigest()
if not cs.startswith(CAND_SHA): die('index.html is not the V232 candidate (shasum %s)' % cs)
if subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', G], cwd=ROOT).returncode != 0: die('g224 differs from HEAD')
src = open(G, encoding='utf-8').read()

# ── E3a header ───────────────────────────────────────────────────────────────────────────
A1 = """// artifact) still runs the rows, since the surface is there to test.
"""
N1 = A1 + """//
// SECTION 1 SCOPE (V232, D199; session call 17 in tests/measure/v232_rulings/v232_session_calls.md).
// Section 1's five positional rows ("line 643".."line 647") carry the V224 build's own
// file layout as their premise (standing ruling 4). It held through V231 because no CSS
// landed above :643; V232's D199 `.iaw-solo` rule and its comment (6 lines at :335) moved
// the five lines to 649-653, byte-identical and in order. So the positional rows run only
// at ia-version <= 231 and, above it, each prints a SKIP naming the reason (never PASS,
// never FAIL). Their indices are NOT re-pointed (standing ruling 3: a re-pointed pin looks
// freshly maintained and breaks on the next insertion). Section 1b carries the same claim
// position-free on every version this gate runs on (>= 224, or a mid-slice surface): each
// of the five hand-typed lines occurs exactly once in the <style> text (comments
// stripped), and they are contiguous in V224's order, located by content, never by line
// number.
"""

# ── E3b section 1 ────────────────────────────────────────────────────────────────────────
L = ['.wk-day-num .chk{color:var(--run);}',
     '.wk-day-num .wc-mark{color:var(--signal);}',
     '.wc-mark{display:inline-flex;align-items:center;gap:1px;color:var(--signal);line-height:1;}',
     '.wc-mark-w{font-family:var(--font-display);font-weight:800;font-size:11px;letter-spacing:0;}']
A2 = r"""// ── 1. guardrail: lines 643/644/645/646 stay byte-identical, new line lands right after 645 ──
const lines = SRC.split('\n');
eq('line 643 unchanged (.wk-day-num .chk)', lines[642], '""" + L[0] + r"""');
eq('line 644 unchanged (.wk-day-num .wc-mark)', lines[643], '""" + L[1] + r"""');
eq('line 645 unchanged (.wc-mark base)', lines[644], '""" + L[2] + r"""');
eq('line 646 is the new D185 rule (inserted immediately after :645)', lines[645], NEW_RULE);
eq('line 647 unchanged (.wc-mark-w), pushed down by exactly one', lines[646], '""" + L[3] + r"""');
"""
N2 = r"""// ── 1. guardrail: lines 643/644/645/646 stay byte-identical, new line lands right after 645 ──
// The five hand-typed lines of the V224 block, in V224's order (the literals these rows always carried).
const V224_BLOCK = [
  '""" + L[0] + r"""',
  '""" + L[1] + r"""',
  '""" + L[2] + r"""',
  NEW_RULE,
  '""" + L[3] + r"""',
];
const V224_NAMES = ['.wk-day-num .chk', '.wk-day-num .wc-mark', '.wc-mark base', 'the D185 rule', '.wc-mark-w'];
// Positional rows: the V224 layout premise (standing ruling 4), scoped to ia-version <= 231 (V232 D199, session
// call 17). Indices are NOT re-pointed (standing ruling 3). Above 231 each prints a SKIP: never PASS, never FAIL.
const POSITIONAL_MAX_V = 231;
const POSITIONAL = [   // [label, 0-based line index in the V224 layout]
  ['line 643 unchanged (.wk-day-num .chk)', 642],
  ['line 644 unchanged (.wk-day-num .wc-mark)', 643],
  ['line 645 unchanged (.wc-mark base)', 644],
  ['line 646 is the new D185 rule (inserted immediately after :645)', 645],
  ['line 647 unchanged (.wc-mark-w), pushed down by exactly one', 646],
];
const POSITIONAL_SKIP_WHY = 'scoped to ia-version <= ' + POSITIONAL_MAX_V + ', the V224 layout premise (standing ruling 4); '
  + "V232's D199 `.iaw-solo` CSS (6 lines at :335) shifted the block by 6 lines; the position-free successor rows 1b "
  + 'below carry the claim (session call 17). Never PASS, never FAIL.';
const lines = SRC.split('\n');
let skip1 = 0;
POSITIONAL.forEach(([label, ix], k) => {
  if (artifactV <= POSITIONAL_MAX_V) eq(label, lines[ix], V224_BLOCK[k]);
  else { skip1++; console.log('  SKIP ' + label + ' at ia-version ' + artifactV + ': ' + POSITIONAL_SKIP_WHY); }
});
if (skip1) console.log('  ' + skip1 + ' positional rows SKIPPED at ia-version ' + artifactV + ', counted in neither PASS nor FAIL');

// ── 1b. position-free successor (V232 D199, session call 17): the same five lines, located by content ──
const styleText = [...SRC.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const styleLines = styleText.split('\n');
V224_BLOCK.forEach((s, k) => eq('1b ' + V224_NAMES[k] + ' occurs exactly once in the <style> text (comments stripped), located by content', styleText.split(s).length - 1, 1));
const blockAt = styleLines.indexOf(V224_BLOCK[0]);
const blockGot = blockAt < 0 ? [] : styleLines.slice(blockAt, blockAt + V224_BLOCK.length);
ok('1b the five lines are contiguous in V224 order (' + V224_NAMES.join(', ') + '; the D185 rule immediately after the .wc-mark base, .wc-mark-w immediately after it), located by content, never by line number',
   blockAt >= 0 && blockGot.length === V224_BLOCK.length && blockGot.every((l, k) => l === V224_BLOCK[k]),
   blockAt < 0 ? 'the first line is not a whole line of the <style> text' : 'got ' + JSON.stringify(blockGot));
"""

for name, a in (('E3a header', A1), ('E3b section 1', A2)):
    n = src.count(a)
    print('ANCHOR %s count %d' % (name, n))
    if n != 1: die('%s anchor count %d' % (name, n))
# the old rows' literals are exactly the four V224_BLOCK literals, and NEW_RULE is the gate's own constant
if src.count("const NEW_RULE = '.wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}';") != 1:
    die('NEW_RULE constant is not the D185 rule literal exactly once')
for s in L:
    if src.count("'" + s + "'") != 1: die('old literal %r is not in the gate exactly once' % s)
if chr(92) + 'u' in N1 + N2: die('a \\u escape was typed')

out = src.replace(A1, N1, 1).replace(A2, N2, 1)
for s in L:
    if out.count("'" + s + "'") != 1: die('new literal %r is not in the gate exactly once' % s)
if out.count('lines[642]') or out.count('lines[646]'): die('an old positional index survived as a literal read')
for ix in ('642', '643', '644', '645', '646'):
    if out.count("', " + ix + "],") != 1: die('positional index %s is not carried exactly once in POSITIONAL' % ix)
open(G, 'w', encoding='utf-8').write(out)
r = subprocess.run(['node', '--check', G], capture_output=True, text=True)
if r.returncode: die('node --check failed: ' + r.stderr[-600:])
print('WROTE %s (+%d lines), node --check ok' % (G, out.count('\n') - src.count('\n')))
