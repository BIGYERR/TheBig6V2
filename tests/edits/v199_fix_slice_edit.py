#!/usr/bin/env python3
# V199 / D91 (AMENDMENT — no new D-code). Two edits:
#   1. index.html — relocate the _isPostChain declaration out of g197d E5's _itemCost
#      slice (which runs to the '// ── RECOVERY-WEEK VOLUME DELOAD' banner) to below
#      that banner and above `function recoveryDeload`. Top-level function declaration,
#      every caller sits below the new point: behaviourally inert.
#   2. tests/gates/g197d_d84_base.js — RE-PIN (never delete) E5's capSessionBudget
#      digest to the V199 text under a version predicate, naming D91.
# Every anchor asserted count==1. Abort on the first miss.
import hashlib, io, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
APP  = os.path.join(ROOT, 'index.html')
GATE = os.path.join(ROOT, 'tests/gates/g197d_d84_base.js')

def rd(p):
    with io.open(p, encoding='utf-8') as f: return f.read()
def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

def sub(src, old, new, tag):
    n = src.count(old)
    assert n == 1, 'ANCHOR %s: count==%d (expected 1)' % (tag, n)
    return src.replace(old, new)

# ───────────────────────── EDIT 1: relocate _isPostChain ─────────────────────────
app = rd(APP)

LENS_OLD = (
"// ── POSTERIOR-CHAIN LENS (single writer) ────────────────────────────────────\n"
"// D85 shipped this lens inside capSessionBudget; D91 needs the same lens in\n"
"// recoveryDeload. It is HOISTED, not copied — two in-app copies of \"what counts as\n"
"// posterior chain\" is exactly the desync §10b warns about. THE SET IS {hinge,\n"
"// hip_ext} AND NOTHING ELSE; leg_iso is deliberately outside it (EXLIB\n"
"// .leg_accessory mixes 'Leg extension' and 'Leg press' in with 'Lying leg curl').\n"
"// _pattern is called directly so this lens and the region caps can never disagree.\n"
"function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; }\n"
"\n"
"// ── RECOVERY-WEEK VOLUME DELOAD ─────────────────────────────────────────────\n"
)

LENS_NEW = (
"// ── RECOVERY-WEEK VOLUME DELOAD ─────────────────────────────────────────────\n"
)

app = sub(app, LENS_OLD, LENS_NEW, 'app/lens-remove')

DEL_TAIL_OLD = (
"// dynamic core injection is gated off recovery weeks at week assembly.\n"
"function recoveryDeload(sections){\n"
)

DEL_TAIL_NEW = (
"// dynamic core injection is gated off recovery weeks at week assembly.\n"
"\n"
"// ── POSTERIOR-CHAIN LENS (single writer) ────────────────────────────────────\n"
"// D85 shipped this lens inside capSessionBudget; D91 needs the same lens in\n"
"// recoveryDeload. It is HOISTED, not copied — two in-app copies of \"what counts as\n"
"// posterior chain\" is exactly the desync §10b warns about. THE SET IS {hinge,\n"
"// hip_ext} AND NOTHING ELSE; leg_iso is deliberately outside it (EXLIB\n"
"// .leg_accessory mixes 'Leg extension' and 'Leg press' in with 'Lying leg curl').\n"
"// _pattern is called directly so this lens and the region caps can never disagree.\n"
"// PLACED BELOW THE RECOVERY-WEEK BANNER ON PURPOSE (V199, D91 amendment): g197d E5\n"
"// confines _itemCost by slicing from its header up to that banner line, so a\n"
"// declaration above the banner lands INSIDE a confined slice and reads as an unruled\n"
"// edit to budget machinery. The placement is inert: a top-level function declaration\n"
"// hoists, and both callers (recoveryDeload below, capSessionBudget further down) sit\n"
"// after this point in source order anyway.\n"
"function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; }\n"
"\n"
"function recoveryDeload(sections){\n"
)

app = sub(app, DEL_TAIL_OLD, DEL_TAIL_NEW, 'app/lens-reinsert')

assert app.count('function _isPostChain') == 1, 'POST: _isPostChain declared %d times' % app.count('function _isPostChain')
assert '<meta name="ia-version" content="199">' in app, 'POST: ia-version is not 199'

# the relocated declaration must still precede every call site in source order
decl = app.index('function _isPostChain(n){')
for call in ('_isPostChain(it.name)', 'const _isPost=_isPostChain;'):
    assert app.count(call) == 1, 'POST: call site %r count!=1' % call
    assert app.index(call) > decl, 'POST: call site %r precedes the declaration' % call

wr(APP, app)
print('EDIT 1 ok — _isPostChain relocated below the RECOVERY-WEEK banner')

# ──────────────── EDIT 2: re-pin E5's capSessionBudget digest to V199 ────────────────
# Digest is recomputed from the artifact on disk at write time, never hardcoded.
a = app.index('function capSessionBudget(sections, cardio){')
b = app.index('\nfunction capRegionalFatigue', a)
assert a > 0 and b > a, 'capSessionBudget slice not found in the artifact'
CSB_V199 = hashlib.sha256(app[a:b].encode('utf-8')).hexdigest()
print('   capSessionBudget V199 digest: ' + CSB_V199)

g = rd(GATE)

PROV_OLD = (
"  //   CSB_D85  — V198, the text LICENSED BY RULING D85: the {hinge, hip_ext} floor that\n"
"  //              makes the day's last posterior chain item ineligible for the trim loop.\n"
)
PROV_NEW = (
"  //   CSB_D91  — V199, the text LICENSED BY RULING D91 (amendment to D85): D91 hoisted\n"
"  //              the {hinge, hip_ext} lens to a top-level _isPostChain so recoveryDeload\n"
"  //              and capSessionBudget read ONE writer; capSessionBudget's in-function\n"
"  //              copy became the alias `const _isPost=_isPostChain;`. Ruling D91 is what\n"
"  //              licenses that edit to the budget text — this is a RE-PIN, not a delete.\n"
"  //   CSB_D85  — V198, the text LICENSED BY RULING D85: the {hinge, hip_ext} floor that\n"
"  //              makes the day's last posterior chain item ineligible for the trim loop.\n"
"  //              Kept accepted under ia-version < 199 so V198-vs-V197 stays answerable.\n"
)
g = sub(g, PROV_OLD, PROV_NEW, 'gate/provenance')

CONST_OLD = "  const CSB_D85 = 'fb16df9c8a6798937d3e0a9904f23944bf3f68cac258a21ef772ccf9040357c3';\n"
CONST_NEW = ("  const CSB_D91 = '" + CSB_V199 + "';\n"
             "  const CSB_D85 = 'fb16df9c8a6798937d3e0a9904f23944bf3f68cac258a21ef772ccf9040357c3';\n")
g = sub(g, CONST_OLD, CONST_NEW, 'gate/const')

SEL_OLD = (
"  const pre = cv !== null && cv < 198;           // a pre-D85 artifact is allowed the pre-D85 text\n"
"  const want = pre ? CSB_PRE : CSB_D85;\n"
"  const era  = pre ? 'pre-D85' : 'D85 (V198)';\n"
)
SEL_NEW = (
"  // Era predicate, oldest first, newest era as the fallthrough. Each older digest stays\n"
"  // ACCEPTED for the versions that shipped it, so this gate keeps answering V198-vs-V197\n"
"  // and V197-vs-V196 after the re-pin. An unknown ia-version is held to the newest text.\n"
"  const preD85 = cv !== null && cv < 198;        // pre-D85 artifact: allowed the pre-D85 text\n"
"  const preD91 = cv !== null && cv < 199;        // V198: allowed the D85 text\n"
"  const want = preD85 ? CSB_PRE : (preD91 ? CSB_D85 : CSB_D91);\n"
"  const era  = preD85 ? 'pre-D85' : (preD91 ? 'D85 (V198)' : 'D91 (V199)');\n"
"  const rule = preD91 ? 'D85' : 'D91';           // the ruling that licenses THIS era's text\n"
)
g = sub(g, SEL_OLD, SEL_NEW, 'gate/selector')

ASSERT_OLD = (
"  ok('E5 capSessionBudget is byte-for-byte the ' + era + ' licensed text '\n"
"     + '(licensing ruling D85; nothing since D85 has edited budget machinery)',\n"
)
ASSERT_NEW = (
"  ok('E5 capSessionBudget is byte-for-byte the ' + era + ' licensed text '\n"
"     + '(licensing ruling ' + rule + '; nothing since ' + rule + ' has edited budget machinery)',\n"
)
g = sub(g, ASSERT_OLD, ASSERT_NEW, 'gate/assert-text')

wr(GATE, g)
print('EDIT 2 ok — E5 re-pinned to the D91 (V199) text under a version predicate')
