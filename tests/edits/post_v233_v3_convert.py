#!/usr/bin/env python3
# Post-V233 tooling pass, conversion slice V3 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 5; CLAUDE.md Proof scope, Row manifest:
# every gate converted by hand prints its rows through tests/status.js, one status line per declared row.
#
# Gates: g223_d182_racedate.js, g223_d183_safepace.js, g223_d184_testlen.js, g225_d187_pacerate.js.
# Diff class (V-a) only: verdict printing routed through tests/status.js; every assertion's logic, inputs, expected
# values and oracle are unchanged.
#
# The three g223 gates are a PARENT that spawns one child per zone (NY, UTC). Each (row, zone) is its own row, id
# <row>.<zone>; CHILD0.<zone> is the parent's existing check that the zone's child ran every row and printed its CHILD
# summary. The parent declares every id (where the one summary runs) and re-prints each child status line by id through
# its status instance; the child prints its rows through its own status instance (the emitter: it declares nothing and
# prints no summary; its CHILD line is the parent's protocol, unchanged). Row names with no digit get one to fit the
# id grammar: safepace HM -> HM0, RN -> RN0; testlen RD -> RD0 (the label keeps the row name).
# g225_d187_pacerate.js: its nine unnamed rows take ids from their existing family names: CENSUS1..3, RATE1, COPY1..2,
# MILE1..3 (MILE-REQUIRED).
# A boot failure or a REFUSED version prints FAIL for every declared id by name (was: one boot line / every row).
#
# Every anchor is asserted count == 1 before anything is written; the first miss aborts the whole script.
import os, re, sys

R = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates'
EDITS = {}

def need_absent(name, src, tokens):
    for t in tokens:
        if re.search(t, src):
            sys.exit(f'ABORT {name}: identifier {t} already in the file; the conversion would collide')

# ── shared g223 parent pieces ──────────────────────────────────────────────────────────────────────────────────────
OLD_HELPERS = r'''  let pass = 0, fail = 0;
  const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
  const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
'''
def new_helpers(gate):
    return (r'''  const S = require('../status')('%s');
  const DECL = [];   // [id, label]: every (row, zone), then the zone's child check; declared here, where the one summary runs
  for(const [tag, tz] of ZONES){
    for(const k of ROW_KEYS) DECL.push([rowId(k, tag), ROWS[k]]);
    DECL.push([childId(tag), 'child under TZ=' + tz + ' ran every row and printed its CHILD summary']);
  }
  S.declare(DECL.map(d => d[0]));
  const failAll = (why, detail) => { for(const [id, l] of DECL) S.fail(id, l + ' (' + why + ')', detail); S.summary(); };
''' % gate)

OLD_BOOT = r'''catch(e){ ok('boot: the candidate loads in the harness', false, e.message); done(); }'''
NEW_BOOT = r'''catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }'''

OLD_REFUSED = r'''    for(const [tag] of ZONES) for(const k of ROW_KEYS) ok('[' + tag + '] ' + ROWS[k] + ' (REFUSED)', false);
    done();
'''
NEW_REFUSED = r'''    failAll('REFUSED');
'''

OLD_FWD = r'''      const m = /^(PASS|FAIL) (\[(\w+)\] (\w+) .*)$/.exec(line);
      if(m){ if(m[3] === tag && ROWS[m[4]]) (m[1] === 'PASS' ? pass++ : fail++); console.log(line); }
'''
NEW_FWD = r'''      const m = /^(PASS|FAIL) (\S+) (.*)$/.exec(line);
      if(m && S.ID_RE.test(m[2])) (m[1] === 'PASS' ? S.pass(m[2], m[3]) : S.fail(m[2], m[3]));   // the child's status line, printed here by id
'''

def old_seen(W):
    return (r'''    const seen = %s.filter(k => new RegExp('^(PASS|FAIL) \\[' + tag + '\\] ' + k + ' ', 'm').test(out));
    ok('[' + tag + '] child under TZ=' + tz + ' ran every row and printed its CHILD summary (exit ' + r.status + ')',
       !!s && s[1] === tag && seen.length === %s.length && +s[2] + +s[3] === %s.length,
       (s ? s[0] : 'no CHILD summary') + '; rows seen ' + seen.length + '/' + %s.length);
  }
  done();
}
''' % (W, W, W, W))
def new_seen(W):
    return (r'''    const seen = %s.filter(k => new RegExp('^(PASS|FAIL) ' + rowId(k, tag).replace(/\./g, '\\.') + ' ', 'm').test(out));
    S.check(childId(tag), !!s && s[1] === tag && seen.length === %s.length && +s[2] + +s[3] === %s.length,
       'child under TZ=' + tz + ' ran every row and printed its CHILD summary (exit ' + r.status + ')',
       'got ' + (s ? s[0] : 'no CHILD summary') + '; rows seen ' + seen.length + '/' + %s.length);
  }
  S.summary();
}
''' % (W, W, W, W))

def ids_block(extra):
    return (r'''// Row ids (tests/status.js; CLAUDE.md Proof scope, Row manifest): every row prints once per zone, keyed <row>.<zone>
// (Z0.NY, Z0.UTC).%s CHILD0.<zone> is the parent's check that the zone's
// child ran every row and printed its CHILD summary.
''' % extra)

# ── g223_d182_racedate.js ──────────────────────────────────────────────────────────────────────────────────────────
G = 'g223_d182_racedate.js'
EDITS[G] = [
    (r'''Every row is printed once per zone, tagged
// [NY] or [UTC].''',
     r'''Every row is printed once per zone, keyed
// <row>.NY or <row>.UTC (tests/status.js: the parent declares every id and prints the one summary).'''),
    (r'''const isControl = (key, tag) => /^Z/.test(key) || (key === 'R3' && tag === 'UTC');
''',
     r'''const isControl = (key, tag) => /^Z/.test(key) || (key === 'R3' && tag === 'UTC');
''' + ids_block('') + r'''const rowId = (key, tag) => key + '.' + tag;
const childId = tag => 'CHILD0.' + tag;
'''),
    (OLD_HELPERS, new_helpers(G)),
    (OLD_BOOT, NEW_BOOT),
    (OLD_REFUSED, NEW_REFUSED),
    (OLD_FWD, NEW_FWD),
    (old_seen('ROW_KEYS'), new_seen('ROW_KEYS')),
    (r'''let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const label = '[' + TAG + '] ' + ROWS[key] + (isControl(key, TAG) && key === 'R3' ? ' (CONTROL under UTC: no DST, the V222 raw floor is right here)' : '');
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; console.log('PASS ' + label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + label + ' (' + (total - bad.length) + '/' + total + ' cells; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}
''',
     r'''const CS = require('../status')('g223_d182_racedate.js child ' + TAG);   // this zone's emitter: the parent declares every id and prints the one summary
let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const id = rowId(key, TAG), label = ROWS[key] + (isControl(key, TAG) && key === 'R3' ? ' (CONTROL under UTC: no DST, the V222 raw floor is right here)' : '');
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; CS.pass(id, label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; CS.fail(id, label, (total - bad.length) + '/' + total + ' cells; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '')); }
}
'''),
]

# ── g223_d183_safepace.js ──────────────────────────────────────────────────────────────────────────────────────────
G = 'g223_d183_safepace.js'
EDITS[G] = [
    (r'''const isControl = key => CONTROLS.has(key);
''',
     r'''const isControl = key => CONTROLS.has(key);
''' + ids_block(' HM and RN carry no digit, so their ids add one\n// (HM0, RN0) and the label keeps the row name.') + r'''const RID = { HM: 'HM0', RN: 'RN0' };
const rowId = (key, tag) => (RID[key] || key) + '.' + tag;
const childId = tag => 'CHILD0.' + tag;
'''),
    (OLD_HELPERS, new_helpers(G)),
    (OLD_BOOT, NEW_BOOT),
    (OLD_REFUSED, NEW_REFUSED),
    (OLD_FWD, NEW_FWD),
    (old_seen('ROW_KEYS'), new_seen('ROW_KEYS')),
    (r'''let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const label = '[' + TAG + '] ' + ROWS[key];
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; console.log('PASS ' + label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + label + ' (' + (total - bad.length) + '/' + total + ' cells; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}
''',
     r'''const CS = require('../status')('g223_d183_safepace.js child ' + TAG);   // this zone's emitter: the parent declares every id and prints the one summary
let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const id = rowId(key, TAG), label = ROWS[key];
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; CS.pass(id, label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; CS.fail(id, label, (total - bad.length) + '/' + total + ' cells; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '')); }
}
'''),
]

# ── g223_d184_testlen.js ───────────────────────────────────────────────────────────────────────────────────────────
G = 'g223_d184_testlen.js'
EDITS[G] = [
    (r'''Every row prints once per zone, tagged [NY] or [UTC].''',
     r'''Every row prints once per zone, keyed <row>.NY or <row>.UTC (tests/status.js).'''),
    (r'''const isControl = key => /^Z/.test(key) || ['R3S', 'R4D', 'R4B', 'R6N'].includes(key);
''',
     r'''const isControl = key => /^Z/.test(key) || ['R3S', 'R4D', 'R4B', 'R6N'].includes(key);
''' + ids_block(' RD carries no digit, so its id adds one (RD0) and\n// the label keeps the row name.') + r'''const RID = { RD: 'RD0' };
const rowId = (key, tag) => (RID[key] || key) + '.' + tag;
const childId = tag => 'CHILD0.' + tag;
'''),
    (OLD_HELPERS, new_helpers(G)),
    (OLD_BOOT, NEW_BOOT),
    (OLD_REFUSED, NEW_REFUSED),
    (OLD_FWD, NEW_FWD),
    (old_seen('want'), new_seen('want')),
    (r'''let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const label = '[' + TAG + '] ' + ROWS[key];
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; console.log('PASS ' + label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + label + ' (' + (total - bad.length) + '/' + total + ' cells' + (note ? '; ' + note : '') + '; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}
''',
     r'''const CS = require('../status')('g223_d184_testlen.js child ' + TAG);   // this zone's emitter: the parent declares every id and prints the one summary
let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const id = rowId(key, TAG), label = ROWS[key];
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; CS.pass(id, label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; CS.fail(id, label, (total - bad.length) + '/' + total + ' cells' + (note ? '; ' + note : '') + '; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '')); }
}
'''),
]

# ── g225_d187_pacerate.js ──────────────────────────────────────────────────────────────────────────────────────────
G = 'g225_d187_pacerate.js'
PACE_IDS = ['CENSUS1', 'CENSUS2', 'CENSUS3', 'RATE1', 'COPY1', 'COPY2', 'MILE1', 'MILE2', 'MILE3']
EDITS[G] = [
    (r'''let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

let STAMP = NaN;
try { STAMP = +H.load(ART).version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
''',
     r'''// Rows print through tests/status.js (CLAUDE.md Proof scope, Row manifest): one status line per declared id, one
// summary. The ids take each row's existing family name: CENSUS1..3, RATE1, COPY1..2, MILE1..3 (MILE-REQUIRED).
const S = require('../status')('g225_d187_pacerate.js');
const t0 = Date.now();
const ROWS = {
  CENSUS1: 'CENSUS PACE_IMPROVE declared exactly once',
  CENSUS2: 'CENSUS old {3,5,7} literal table: 0 occurrences (comment-stripped)',
  CENSUS3: 'CENSUS PACE_IMPROVE read at the expected reader-site count',
  RATE1: 'RATE PACE_IMPROVE deep-equals {beginner:3, intermediate:3, advanced:2}',
  COPY1: 'COPY run SI note template: no "safe rate" / "safely"',
  COPY2: 'COPY swim INT note template: no "safe rate" / "safely"',
  MILE1: 'MILE-REQUIRED non-beginner run_pace_goal, blank mile: refused',
  MILE2: 'MILE-REQUIRED non-beginner NON-pace run goal, blank mile: unaffected',
  MILE3: 'MILE-REQUIRED beginner run_pace_goal, blank mile: unaffected (byte-identical beginner path)',
};
const ROW_IDS = Object.keys(ROWS);
S.declare(ROW_IDS);
const ok = (id, c, g) => c ? S.pass(id, ROWS[id] + (g === undefined ? '' : ' (' + g + ')')) : S.fail(id, ROWS[id], g === undefined ? '' : 'got ' + g);
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); S.summary(); };
const failAll = (why, detail) => { for(const id of ROW_IDS) S.fail(id, ROWS[id] + ' (' + why + ')', detail); done(); };

let STAMP = NaN;
try { STAMP = +H.load(ART).version; } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }
'''),
    (r'''const ROW_LABELS = [
  'CENSUS PACE_IMPROVE declared exactly once',
  'CENSUS old {3,5,7} literal table: 0 occurrences (comment-stripped)',
  'CENSUS PACE_IMPROVE read at the expected reader-site count',
  'RATE PACE_IMPROVE deep-equals {beginner:3, intermediate:3, advanced:2}',
  'COPY run SI note template: no "safe rate" / "safely"',
  'COPY swim INT note template: no "safe rate" / "safely"',
  'MILE-REQUIRED non-beginner run_pace_goal, blank mile: refused',
  'MILE-REQUIRED non-beginner NON-pace run goal, blank mile: unaffected',
  'MILE-REQUIRED beginner run_pace_goal, blank mile: unaffected (byte-identical beginner path)',
];
''', ''),
    (r'''  ROW_LABELS.forEach(l => ok(l + ' (REFUSED)', false));
  done();
''', r'''  failAll('REFUSED');
'''),
] + [('ok(ROW_LABELS[%d], ' % i, "ok('%s', " % pid) for i, pid in enumerate(PACE_IDS)]

COLLIDE = {
    'g223_d182_racedate.js': [r'\bCS\b', r'\browId\b', r'\bchildId\b', r'\bDECL\b', r'\bfailAll\b', r'\bRID\b', r'\bS\.'],
    'g223_d183_safepace.js': [r'\bCS\b', r'\browId\b', r'\bchildId\b', r'\bDECL\b', r'\bfailAll\b', r'\bRID\b', r'\bS\.'],
    'g223_d184_testlen.js': [r'\bCS\b', r'\browId\b', r'\bchildId\b', r'\bDECL\b', r'\bfailAll\b', r'\bRID\b', r'\bS\.'],
    'g225_d187_pacerate.js': [r'\b(?:const|let|var)\s+S\b', r'(?<![\\\w])S\.', r'\bROWS\b', r'\bROW_IDS\b', r'\bfailAll\b'],   # [\s\S] is a regex class, not S
}

out = {}
for name, edits in EDITS.items():
    p = os.path.join(R, name)
    src = open(p, encoding='utf-8').read()
    need_absent(name, src, COLLIDE[name])
    for k, (a, b) in enumerate(edits):
        n = src.count(a)
        if n != 1:
            sys.exit(f'ABORT {name} edit {k + 1}: anchor count {n} (want 1): {a[:90]!r}')
        src = src.replace(a, b)
    if name == 'g225_d187_pacerate.js' and 'ROW_LABELS' in src:
        sys.exit('ABORT g225_d187_pacerate.js: ROW_LABELS still read after the conversion')
    for t in (r'\bpass\+\+', r'\bfail\+\+', r"console\.log\('(PASS|FAIL) "):
        if re.search(t, src):
            sys.exit(f'ABORT {name}: an old verdict print survives ({t})')
    out[p] = src
    print(f'{name}: {len(edits)} edits, every anchor count == 1')
for p, s in out.items():
    open(p, 'w', encoding='utf-8').write(s)
print(f'WROTE {len(out)} gates')
