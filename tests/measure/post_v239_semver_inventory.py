#!/usr/bin/env python3
# Post-V239 semver before-picture, static half (measure, read-only).
# Usage: python3 tests/measure/post_v239_semver_inventory.py <worktree> <main checkout> <scratch>
# Question: every reader of the app version, and how it behaves if <meta name="ia-version"> reads "0.239.1".
# Oracle: coercion probes run separately (post_v239_semver_probe.sh); this file classifies source text only.
import sys, os, re, glob, json, collections
WT, MAIN, S = sys.argv[1], sys.argv[2], sys.argv[3]
os.chdir(WT)
G = 'g' + 'it'
def rd(p):
    try: return open(p, encoding='utf8', errors='replace').read()
    except Exception: return ''
def nocomment_lines(src):
    out, inblk = [], False
    for l in src.split('\n'):
        s = l
        if inblk:
            if '*/' in s: s = s.split('*/', 1)[1]; inblk = False
            else: out.append(''); continue
        s = re.sub(r'/\*.*?\*/', '', s)
        if '/*' in s and '*/' not in s.split('/*', 1)[1]: s = s.split('/*', 1)[0]; inblk = True
        st = s.lstrip()
        if st.startswith('//') or st.startswith('#'): s = ''
        out.append(s)
    return out
def H(t): print('\n== ' + t)

H('1. index.html runtime: every line naming ia-version / IA_VERSION (comments kept)')
src = rd('index.html').split('\n')
hits = [(i + 1, l) for i, l in enumerate(src) if re.search(r'ia-version|IA_VERSION', l)]
for n, l in hits: print('  index.html:%d  %s' % (n, l.strip()[:150]))
print('  total lines %d' % len(hits))
other = [(i + 1) for i, l in enumerate(src) if re.search(r'\bia_ver|appVersion|APP_VER|buildVersion|\bversion\s*[:=]\s*[\'"]?\d{3}', l)]
print('  other version-shaped tokens (ia_ver|appVersion|APP_VER|buildVersion|version: NNN): %d lines %s' % (len(other), other[:10]))

H('2. live tooling under tests/ (not gates): version-reading lines, comments stripped')
TOOLS = ['tests/harness.js', 'tests/gate.sh', 'tests/status.js', 'tests/chain.js', 'tests/era_bump.py', 'tests/sabotage.py',
         'tests/fuzz.sh', 'tests/version_scope.js', 'tests/rows.js', 'tests/tooling_selftest.sh', 'tests/lattice193.js']
VPAT = re.compile(r'ia-version|IA_VERSION|\.version\b|\bVER\b|\[0-9\]\+|\(\\d\+\)|\\d\{3\}|parse_version|mapVer|META\b|\bCUR\b|\bNEXT\b|BY_VERSION\[')
for t in TOOLS:
    L = nocomment_lines(rd(t))
    h = [(i + 1, l) for i, l in enumerate(L) if VPAT.search(l)]
    rows = [x for x in h if re.match(r'\s*[A-Z_]+_BY_VERSION\[\d{3}\]\s*=', x[1])]
    print('  %-28s %3d code lines (%d of them era-table rows)' % (t, len(h), len(rows)))
    for n, l in [x for x in h if x not in rows][:14]: print('      %s:%d  %s' % (t, n, l.strip()[:150]))
