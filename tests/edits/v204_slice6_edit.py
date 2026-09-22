#!/usr/bin/env python3
# V204 slice 6 — D126 (gate-integrity half). Gate files only. index.html is NOT touched.
# Three gates reproduced the defective clock idiom as their own oracle (floor the minutes,
# round the seconds -> "7:60"). Rewritten to round the WHOLE value first, which is the
# clock contract written from first principles, with no call into the artifact.
# Plus: seconds-limb regexes tightened from \d\d to [0-5]\d so a malformed pace fails
# to parse instead of silently matching.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = lambda n: os.path.join(ROOT, 'tests', 'gates', n)

EDITS = {
  G('g203_ceiling_and_anchor.js'): [
    # EDIT 1 — oracle
    ("function paceStr(sec){ return Math.floor(sec/60) + ':' + String(Math.round(sec%60)).padStart(2,'0') + '/mi'; }",
     "function paceStr(sec){ const t = Math.round(sec); return Math.floor(t/60) + ':' + String(t%60).padStart(2,'0') + '/mi'; }"),
    # EDIT 4 — seconds limbs (174, 175, 180, 184, 185, 243, 244)
    ("     speed.every(c => !/faster than \\d+:\\d\\d\\/mi\\./.test(String(c.detail))),",
     "     speed.every(c => !/faster than \\d+:[0-5]\\d\\/mi\\./.test(String(c.detail))),"),
    ("     JSON.stringify((speed.find(c => /faster than \\d+:\\d\\d\\/mi\\./.test(String(c.detail))) || {}).subtype));",
     "     JSON.stringify((speed.find(c => /faster than \\d+:[0-5]\\d\\/mi\\./.test(String(c.detail))) || {}).subtype));"),
    ("     hardLong.every(c => !/faster than \\d+:\\d\\d\\/mi\\./.test(String(c.detail)) && !/no faster than/.test(String(c.detail))),",
     "     hardLong.every(c => !/faster than \\d+:[0-5]\\d\\/mi\\./.test(String(c.detail)) && !/no faster than/.test(String(c.detail))),"),
    ("     all.every(c => { const m = String(c.detail).match(/faster than (\\d+:\\d\\d\\/mi)\\./); return !m || m[1] === S.row.capStr; }),",
     "     all.every(c => { const m = String(c.detail).match(/faster than (\\d+:[0-5]\\d\\/mi)\\./); return !m || m[1] === S.row.capStr; }),"),
    ("     JSON.stringify(all.map(c => String(c.detail).match(/faster than (\\d+:\\d\\d\\/mi)\\./)).filter(Boolean).map(m => m[1])));",
     "     JSON.stringify(all.map(c => String(c.detail).match(/faster than (\\d+:[0-5]\\d\\/mi)\\./)).filter(Boolean).map(m => m[1])));"),
    ("const AROUND    = c => (String(c.detail).match(/Around (\\d+:\\d\\d\\/mi) is right for you/) || [])[1];",
     "const AROUND    = c => (String(c.detail).match(/Around (\\d+:[0-5]\\d\\/mi) is right for you/) || [])[1];"),
    ("const CAPSTR    = c => (String(c.detail).match(/do not run faster than (\\d+:\\d\\d\\/mi)\\./) || [])[1];",
     "const CAPSTR    = c => (String(c.detail).match(/do not run faster than (\\d+:[0-5]\\d\\/mi)\\./) || [])[1];"),
  ],
  G('g202_pace_anchor.js'): [
    # EDIT 2 — oracle
    ("  clock: s => Math.floor(s/60) + ':' + String(Math.round(s % 60)).padStart(2, '0'),",
     "  clock: s => { const t = Math.round(s); return Math.floor(t/60) + ':' + String(t % 60).padStart(2, '0'); },"),
  ],
  G('g202_int_doctrine.js'): [
    # EDIT 3 — oracle
    ("const clk = t => Math.floor(t/60) + ':' + String(Math.round(t%60)).padStart(2,'0');",
     "const clk = t => { const v = Math.round(t); return Math.floor(v/60) + ':' + String(v%60).padStart(2,'0'); };"),
    # EDIT 4 — seconds limbs (131 parser, 136, 196)
    ("const toSec = p => { const m = /^(\\d+):(\\d\\d)$/.exec(p); return m ? +m[1]*60 + +m[2] : null; };",
     "const toSec = p => { const m = /^(\\d+):([0-5]\\d)$/.exec(p); return m ? +m[1]*60 + +m[2] : null; };"),
    ("    const m = /at (\\d+:\\d\\d)\\/mi\\. This week's goal pace is (\\d+:\\d\\d)\\/mi\\./.exec(r.detail);",
     "    const m = /at (\\d+:[0-5]\\d)\\/mi\\. This week's goal pace is (\\d+:[0-5]\\d)\\/mi\\./.exec(r.detail);"),
    ("    const m = /This week's goal pace is (\\d+:\\d\\d)\\/mi/.exec(c.detail);",
     "    const m = /This week's goal pace is (\\d+:[0-5]\\d)\\/mi/.exec(c.detail);"),
  ],
}

# Pass 1: assert every anchor is present exactly once, across every file, before writing anything.
loaded, fail = {}, []
for path, pairs in EDITS.items():
    with io.open(path, encoding='utf-8') as f:
        loaded[path] = f.read()
    for old, new in pairs:
        n = loaded[path].count(old)
        print('%-4s %s  %s' % (('OK' if n == 1 else 'MISS'), n, os.path.basename(path) + ' :: ' + old[:72]))
        if n != 1:
            fail.append((path, old, n))
if fail:
    print('ABORT: %d anchor(s) not count==1. Nothing written.' % len(fail))
    sys.exit(1)

# Pass 2: apply and write.
for path, pairs in EDITS.items():
    s = loaded[path]
    for old, new in pairs:
        s = s.replace(old, new, 1)
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(s)
    print('WROTE %s (%d replacements)' % (os.path.basename(path), len(pairs)))
print('DONE. index.html untouched; ia-version stays at 203.')
