#!/usr/bin/env python3
# Post-V233 tooling pass, conversion slice V4 (tests only; index.html untouched, ia-version stays 233).
# Ruling: Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 5; CLAUDE.md Proof scope, Row
# manifest ("Every new gate, and every gate converted by hand, prints its rows through the shared status helper
# tests/status.js") and Version scope ("Every row a gate declares prints exactly one status line ... a declared row with
# no status line is red"). Evidence (`node tests/rows.js parse` on V233 outputs): g227_d190_cuecap (8 status lines),
# g227_d190_seam (7), g228_d193_cueword (5 before C2 retired b-ONECLASS) have 0 keyed lines; g000_boot has 10 status
# lines, 8 unkeyed (its two `W1 ... is rest` lines keyed W1 by accident).
#
# Gates: g227_d190_cuecap.js, g227_d190_seam.js, g228_d193_cueword.js, g000_boot.js.
# Diff class (V-a) only: verdict printing routed through tests/status.js; every assertion's logic, inputs, expected
# values and oracle are unchanged. Per gate: S.declare([...]) up front, one status line per declared id, S.summary() in
# place of the gate's own summary.
#   g227/g228: the row names have no digit after their letters (b-ALL, c-LIT, a-U'), so each id is the ruling the gate
#     defends (standing ruling 4) plus the row name: D190-b-ALL ... D190-c-MANNY, D190-a-MEM ... D190-e,
#     D193-c-LIT ... D193-g-COUPLE. a-U' and d-U' are D190-a-Uprime and D190-d-Uprime (the grammar has no apostrophe).
#     The row name leaves the label (the id carries it). ok() becomes a router ok(row key, label, cond, got) onto S, the
#     same PASS-label / FAIL-detail split as before; done() keeps its runtime line and calls S.summary().
#   g000_boot: one id per check, G000-<the check's name>; the W1 sun / wed rest pair (a forEach) is one loop row,
#     G000-W1-rest (2 sub-results), so 10 status lines become 9 rows.
#   Every gate: a boot failure (g000: also no candidate) or a REFUSED version prints FAIL for every declared id by name
#   (V3's failAll; was one `FAIL boot` line). Exit codes are unchanged: 1 on any FAIL, else 0.
#
# Every anchor is asserted count == 1 in the file's state at that step; the first miss aborts the whole script before
# any file is written.
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'tests', 'gates')
EDITS = {}

# ── shared pieces of the three g227/g228 gates ─────────────────────────────────────────────────────────────────────
OLD_OK = r'''let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
'''
def new_ok(gate, rid):
    return (r'''const t0 = Date.now();
// Rows print through tests/status.js (post-V233 V4). RID: row key -> status id. ok(row key, label, cond, got) is the
// row's one status line: got prints in the label on a PASS and as the detail on a FAIL, as before.
const S = require('../status')('%s');
const RID = %s;
S.declare(Object.values(RID));
const ok = (k, l, c, g) => c ? S.pass(RID[k], l + (g === undefined ? '' : ' (' + g + ')')) : S.fail(RID[k], l, g === undefined ? '' : 'got ' + g);
''' % (gate, rid))
OLD_DONE_SECS = r'''const done = () => { console.log('  runtime ' + secs()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
'''
NEW_DONE_SECS = r'''const done = () => { console.log('  runtime ' + secs()); S.summary(); };
// a boot failure or a REFUSED version: FAIL for every declared id by name (R is read at call time, after it is typed)
const failAll = (why, detail) => { for(const k of Object.keys(RID)) S.fail(RID[k], R[k] + ' (' + why + ')', detail); done(); };
'''
OLD_REFUSED = r'''  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
'''
NEW_REFUSED = r'''  failAll('REFUSED');
'''
OLD_BOOT_IA = r'''try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }'''
NEW_BOOT_IA = r'''try { IA = load(ART); STAMP = +IA.version; } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }'''

def strip_row(key, name):
    # the label loses its leading `row <name>` (the id carries the name); pattern anchored on the R key
    return ('re', r"(\n  " + re.escape(key) + r":\s*['\"])row " + re.escape(name) + r" +", r'\1')

# ---------------------------------------------------------------- g227_d190_cuecap -----------------------------
EDITS['g227_d190_cuecap.js'] = [
('lit', r''''use strict';
''', r'''// IDS (post-V233 V4: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest). Each row above
//   is the id D190-<row>, keyed to the ruling it defends (standing ruling 4): D190-b-ALL, D190-b-HAND-1, D190-b-HAND-2,
//   D190-b-HAND-3, D190-c-TOAST, D190-c-UNINJ, D190-c-DIGEST, D190-c-MANNY. A boot failure or a REFUSED version prints
//   FAIL for every declared id by name.
'use strict';
'''),
('lit', OLD_OK, new_ok('g227_d190_cuecap', "{ bALL:'D190-b-ALL', bH1:'D190-b-HAND-1', bH2:'D190-b-HAND-2', bH3:'D190-b-HAND-3', cTOAST:'D190-c-TOAST',\n  cUNINJ:'D190-c-UNINJ', cDIGEST:'D190-c-DIGEST', cMANNY:'D190-c-MANNY' }")),
('lit', OLD_DONE_SECS, NEW_DONE_SECS),
strip_row('bALL', 'b-ALL'), strip_row('bH1', 'b-HAND-1'), strip_row('bH2', 'b-HAND-2'), strip_row('bH3', 'b-HAND-3'),
strip_row('cTOAST', 'c-TOAST'), strip_row('cUNINJ', 'c-UNINJ'), strip_row('cDIGEST', 'c-DIGEST'), strip_row('cMANNY', 'c-MANNY'),
('lit', OLD_BOOT_IA, NEW_BOOT_IA),
('lit', OLD_REFUSED, NEW_REFUSED),
('lit', r'''  ok(R.bALL, SELF_C && hops > 0''', r'''  ok('bALL', R.bALL, SELF_C && hops > 0'''),
('lit', r'''  if(!L){ ok(R[h.key] + ' (setup: ' ''', r'''  if(!L){ ok(h.key, R[h.key] + ' (setup: ' '''),
('lit', r'''  ok(R[h.key], okH, ''', r'''  ok(h.key, R[h.key], okH, '''),
('lit', r'''  if(!B) ok(R.cTOAST + setupNote, false);''', r'''  if(!B) ok('cTOAST', R.cTOAST + setupNote, false);'''),
('lit', r'''      ok(R.cTOAST + ' [V229 D193 R8''', r'''      ok('cTOAST', R.cTOAST + ' [V229 D193 R8'''),
('lit', r'''    else ok(R.cTOAST, SELF_C''', r'''    else ok('cTOAST', R.cTOAST, SELF_C'''),
('lit', r'''  if(!B) ok(R.cUNINJ + setupNote, false);''', r'''  if(!B) ok('cUNINJ', R.cUNINJ + setupNote, false);'''),
('lit', r'''      ok(R.cUNINJ + ' [V231 A-1: ''', r'''      ok('cUNINJ', R.cUNINJ + ' [V231 A-1: '''),
('lit', r'''    else ok(R.cUNINJ, SELF_C''', r'''    else ok('cUNINJ', R.cUNINJ, SELF_C'''),
('lit', r'''  if(!B) ok(R.cDIGEST + setupNote, false);''', r'''  if(!B) ok('cDIGEST', R.cDIGEST + setupNote, false);'''),
('lit', r'''    ok(R.cDIGEST + (VER >= 228''', r'''    ok('cDIGEST', R.cDIGEST + (VER >= 228'''),
('lit', r'''  ok(R.cMANNY + (has ? ''', r'''  ok('cMANNY', R.cMANNY + (has ? '''),
]

# ---------------------------------------------------------------- g227_d190_seam -------------------------------
EDITS['g227_d190_seam.js'] = [
('lit', r''''use strict';
''', r'''// IDS (post-V233 V4: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest). Each row above
//   is the id D190-<row>, keyed to the ruling it defends (standing ruling 4): D190-a-MEM, D190-a-U, D190-a-Uprime (a-U'),
//   D190-d-U, D190-d-Uprime (d-U'), D190-e-PRE, D190-e (the id grammar has no apostrophe). The INFO lines stay INFO (not
//   rows). A boot failure or a REFUSED version prints FAIL for every declared id by name.
'use strict';
'''),
('lit', OLD_OK, new_ok('g227_d190_seam', "{ aMEM:'D190-a-MEM', aU:'D190-a-U', aUp:'D190-a-Uprime', dU:'D190-d-U', dUp:'D190-d-Uprime', ePRE:'D190-e-PRE',\n  e:'D190-e' }")),
('lit', r'''const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
''', r'''const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); S.summary(); };
// a boot failure or a REFUSED version: FAIL for every declared id by name (R is read at call time, after it is typed)
const failAll = (why, detail) => { for(const k of Object.keys(RID)) S.fail(RID[k], R[k] + ' (' + why + ')', detail); done(); };
'''),
strip_row('aMEM', 'a-MEM D190'), strip_row('aU', 'a-U D190'), strip_row('aUp', "a-U' D190"), strip_row('dU', 'd-U D190'),
strip_row('dUp', "d-U' D190"), strip_row('ePRE', 'e-PRE D190'), strip_row('e', 'e D190'),
('lit', r'''try { IA0 = load(ART); STAMP = +IA0.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }''',
        r'''try { IA0 = load(ART); STAMP = +IA0.version; } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }'''),
('lit', OLD_REFUSED, NEW_REFUSED),
('lit', r'''  ok(R.ePRE, SELF && good''', r'''  ok('ePRE', R.ePRE, SELF && good'''),
('lit', r'''  ok(R.aMEM, SELF && reach.length''', r'''  ok('aMEM', R.aMEM, SELF && reach.length'''),
('lit', r'''  ok(R.aU, SELF && U.length''', r'''  ok('aU', R.aU, SELF && U.length'''),
('lit', r'''  if(!B) ok(R.aUp + ' (setup: no V226 tree: ' ''', r'''  if(!B) ok('aUp', R.aUp + ' (setup: no V226 tree: ' '''),
('lit', r'''    ok(R.aUp, SELF && created.length''', r'''    ok('aUp', R.aUp, SELF && created.length'''),
('lit', r'''  ok(R.dU, SELF && Ud.length''', r'''  ok('dU', R.dU, SELF && Ud.length'''),
('lit', r'''  if(!B) ok(R.dUp + ' (setup: no V226 tree: ' ''', r'''  if(!B) ok('dUp', R.dUp + ' (setup: no V226 tree: ' '''),
('lit', r'''    ok(R.dUp, SELF && UdP.length''', r'''    ok('dUp', R.dUp, SELF && UdP.length'''),
('lit', r'''  ok(R.e, SELF && LOC.length''', r'''  ok('e', R.e, SELF && LOC.length'''),
]

# ---------------------------------------------------------------- g228_d193_cueword ----------------------------
EDITS['g228_d193_cueword.js'] = [
('lit', r'''// SABOTAGE THIS FILE IS MEANT TO CATCH (scratch copies, each anchor count==1):
''', r'''// IDS (post-V233 V4: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest). Each row above
//   is the id D193-<row>, keyed to the ruling it defends (standing ruling 4): D193-c-LIT, D193-f-STRIP, D193-f-STORED,
//   D193-g-COUPLE. A boot failure or a REFUSED version prints FAIL for every declared id by name.
//
// SABOTAGE THIS FILE IS MEANT TO CATCH (scratch copies, each anchor count==1):
'''),
('lit', OLD_OK, new_ok('g228_d193_cueword', "{ cLIT:'D193-c-LIT', fSTR:'D193-f-STRIP', fSTO:'D193-f-STORED', gCPL:'D193-g-COUPLE' }")),
('lit', OLD_DONE_SECS, NEW_DONE_SECS),
strip_row('cLIT', 'c-LIT'), strip_row('fSTR', 'f-STRIP'), strip_row('fSTO', 'f-STORED'), strip_row('gCPL', 'g-COUPLE'),
('lit', OLD_BOOT_IA, NEW_BOOT_IA),
('lit', OLD_REFUSED, NEW_REFUSED),
('lit', r'''  ok(R.cLIT, !!m && m[1]''', r'''  ok('cLIT', R.cLIT, !!m && m[1]'''),
('lit', r'''  ok(R.fSTR, handBad.length === 0''', r'''  ok('fSTR', R.fSTR, handBad.length === 0'''),
('lit', r'''  if(!B) ok(R.fSTO + setupNote, false);''', r'''  if(!B) ok('fSTO', R.fSTO + setupNote, false);'''),
('lit', r'''    ok(R.fSTO, allOK, ''', r'''    ok('fSTO', R.fSTO, allOK, '''),
('lit', r'''  ok(R.gCPL, fenceOK && pw > 0''', r'''  ok('gCPL', R.gCPL, fenceOK && pw > 0'''),
]

# ---------------------------------------------------------------- g000_boot ------------------------------------
EDITS['g000_boot.js'] = [
('lit', r'''//   - defects surface as `FAIL <name>: <why>` lines, never uncaught throws
''', r'''//   - every row prints through tests/status.js (post-V233 V4; CLAUDE.md Proof scope, Row manifest): declared up
//     front, one status line per row, `PASS <id> <name>` or `FAIL <id> <name> — <why>`, never uncaught throws
'''),
('lit', r'''let pass = 0, fail = 0;
function check(name, ok, why){ if(ok){ pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (why ? ': ' + why : '')); } }
function tryCheck(name, fn){ try { check(name, fn()); } catch(e){ check(name, false, 'threw ' + e.message); } }
''', r'''// ROWS: one id per check, G000-<the check's name>; the W1 sun / wed rest pair is one loop row. No candidate, or a
// candidate that does not boot, prints FAIL for every declared id by name; a row that cannot run because HALF MANNY did
// not build is named by summary() as a dark row. Exit 1 on any FAIL, else 0, as before.
const S = require('../status')('g000_boot');
const ROWS = [
  ['G000-exports-buildProgram', 'exports buildProgram'], ['G000-exports-refreshProgram', 'exports refreshProgram'],
  ['G000-exports-raceAlignment', 'exports raceAlignment'], ['G000-builds-HALF-MANNY', 'builds HALF MANNY'],
  ['G000-half-14-weeks', 'half = 14 weeks'], ['G000-seed-pinned', 'seed pinned'], ['G000-race-W14-SUN', 'race session on W14 SUN'],
  ['G000-W1-rest', 'W1 sun and wed are rest'], ['G000-self-stable', 'self-stable'] ];
S.declare(ROWS.map(r => r[0]));
const NAME = Object.fromEntries(ROWS);
const failAll = (why, detail) => { for(const [id, l] of ROWS) S.fail(id, l + ' (' + why + ')', detail); S.summary(); };
function check(id, ok, why){ S.check(id, ok, NAME[id], why); }
function tryCheck(id, fn){ try { check(id, fn()); } catch(e){ check(id, false, 'threw ' + e.message); } }
'''),
('lit', r'''if(!cand){ console.log('usage: node g000_boot.js <candidate.html> [baseline.html]'); console.log('PASS 0 FAIL 1'); process.exit(1); }''',
        r'''if(!cand){ console.log('usage: node g000_boot.js <candidate.html> [baseline.html]'); failAll('usage', 'no candidate html given'); }'''),
('lit', r'''try { IA = load(cand); } catch(e){ console.log('FAIL boot: ' + e.message); console.log('PASS 0 FAIL 1'); process.exit(1); }''',
        r'''try { IA = load(cand); } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }'''),
('lit', r'''check('exports buildProgram', ''', r'''check('G000-exports-buildProgram', '''),
('lit', r'''check('exports refreshProgram', ''', r'''check('G000-exports-refreshProgram', '''),
('lit', r'''check('exports raceAlignment', ''', r'''check('G000-exports-raceAlignment', '''),
('lit', r'''tryCheck('builds HALF MANNY', ''', r'''tryCheck('G000-builds-HALF-MANNY', '''),
('lit', r'''  check('half = 14 weeks', ''', r'''  check('G000-half-14-weeks', '''),
('lit', r'''  check('seed pinned', ''', r'''  check('G000-seed-pinned', '''),
('lit', r'''  check('race session on W14 SUN', ''', r'''  check('G000-race-W14-SUN', '''),
('lit', r'''  ['sun','wed'].forEach(d => check('W1 ' + d + ' is rest', !!(prog.weeks['1'][d] && prog.weeks['1'][d].rest)));''',
        r'''  { const L = S.loop('G000-W1-rest', NAME['G000-W1-rest']);
    ['sun','wed'].forEach(d => L.check(!!(prog.weeks['1'][d] && prog.weeks['1'][d].rest), 'W1 ' + d + ' is rest'));
    L.done(); }'''),
('lit', r'''  tryCheck('self-stable', ''', r'''  tryCheck('G000-self-stable', '''),
('lit', r'''console.log(`PASS ${pass} FAIL ${fail}`);
process.exit(fail ? 1 : 0);''', r'''S.summary();'''),
]

# ---------------------------------------------------------------- apply ----------------------------------------
# collisions: the new identifiers must not already be bound in the file
NEW_NAMES = {
    'g227_d190_cuecap.js': ['S', 'RID', 'failAll'],
    'g227_d190_seam.js': ['S', 'RID', 'failAll'],
    'g228_d193_cueword.js': ['S', 'RID', 'failAll'],
    'g000_boot.js': ['S', 'ROWS', 'NAME', 'failAll', 'L'],
}
out = {}
for name, subs in EDITS.items():
    p = os.path.join(G, name)
    s = open(p, encoding='utf-8').read()
    for v in NEW_NAMES[name]:
        if re.search(r'\b(?:const|let|var|function)\s+' + v + r'\b', s) or re.search(r'(?<![\w.\'"])' + v + r'\.(?:pass|fail|check|loop|declare|summary)\(', s):
            print(f'ABORT {name}: identifier {v} already bound; the conversion would collide'); sys.exit(1)
    for k, (kind, a, b) in enumerate(subs):
        if kind == 'lit':
            n = s.count(a)
            if n != 1:
                print(f'ABORT {name} edit #{k}: anchor count={n}: {a[:90]!r}'); sys.exit(1)
            s = s.replace(a, b)
        else:
            s2, n = re.subn(a, b, s)
            if n != 1:
                print(f'ABORT {name} edit #{k}: pattern count={n}: {a[:90]!r}'); sys.exit(1)
            s = s2
    out[name] = s

# the old printing must be gone, and every verdict call must name a declared row
def code_of(s):
    return re.sub(r'^\s*//.*$', '', s, flags=re.M)
for name, s in out.items():
    code = code_of(s)
    for t in [r'\bpass\+\+', r'\bfail\+\+', r'\blet pass\b', r"console\.log\('(?:\\n)?PASS", r"console\.log\(`PASS", r"console\.log\('FAIL",
              r"console\.log\('ok", r'process\.exit\(', r"'PASS 0 FAIL 1'"]:
        m = re.search(t, code)
        if m:
            line = code[code.rfind('\n', 0, m.start()) + 1: code.find('\n', m.start())]
            print(f'ABORT {name}: old printing {t!r} still present: {line.strip()[:100]}'); sys.exit(1)
    if name == 'g000_boot.js':
        ids = re.findall(r"\['(G000-[\w.\-]+)', '", code)
        calls = re.findall(r"(?<![\w.])(?:check|tryCheck)\('([^']+)'", code) + re.findall(r"S\.loop\('([^']+)'", code)
        if sorted(set(calls)) != sorted(ids) or len(calls) != len(ids):
            print(f'ABORT {name}: verdict calls {sorted(calls)} != declared ids {sorted(ids)}'); sys.exit(1)
    else:
        keys = re.findall(r"(\w+):'D19[03]-[\w\-]+'", code)
        firsts = re.findall(r'(?<![\w.])ok\(([^,]+),', code)
        bad = [f for f in firsts if not (f in ("'%s'" % k for k in keys) or f in ('h.key', 'k'))]
        if bad:
            print(f'ABORT {name}: ok() call whose first argument is not a row key: {bad[:3]}'); sys.exit(1)
        missing = [k for k in keys if "'%s'" % k not in firsts and not (k in ('bH1', 'bH2', 'bH3') and 'h.key' in firsts)]
        if missing:
            print(f'ABORT {name}: declared row keys with no ok() call site: {missing}'); sys.exit(1)
        if re.search(r"(?<![\w.])ok\(R[.\[]", code):
            print(f'ABORT {name}: an old ok(R...) call survives'); sys.exit(1)
for name, s in out.items():
    open(os.path.join(G, name), 'w', encoding='utf-8').write(s)
    print(f'wrote tests/gates/{name}: {len(EDITS[name])} replacements')
