#!/usr/bin/env python3
# V213 slice 3a — the gate and sabotage spec for D113a / D146.
#   tests/gates/g213_d113a.js        new gate (written whole; it is its own record)
#   tests/sabotage/v213_d113a.json   5 mutations, one named row each (S1 R1, S2 R2, S3 R4, S4 R4, S5 R3)
# This script writes NOTHING to the tree. It prepares the three artifacts the gate is proven on
# and pre-checks the spec, all under the scratchpad:
#   v212_f213.html   V212 (git 169537c) with ia-version forced to 213    -> the gate must go RED
#   tree_212.html    the slice-2b tree as it stands (ia-version 212)     -> NOT APPLICABLE, green
#   tree_f213.html   the slice-2b tree forced to 213                     -> every row GREEN
#   mut_S<n>.html    tree_f213 with mutation n applied, as sabotage.py applies it (count==1, replace)
# ia-version in index.html is not touched. Mario owns the bump.
import io, json, os, subprocess, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SP = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad/v213g'
V212 = '169537cb615546b6b68c6826887a70fc11e1d5cd'
META_212 = '<meta name="ia-version" content="212">'
META_213 = '<meta name="ia-version" content="213">'

def force(src, tag):
    n = src.count(META_212)
    if n != 1:
        sys.exit('ABORT: %s ia-version meta 212 count %d' % (tag, n))
    return src.replace(META_212, META_213, 1)

os.makedirs(SP, exist_ok=True)
tree = io.open(ROOT + '/index.html', encoding='utf-8').read()
base = subprocess.run(['git', '-C', ROOT, 'show', V212 + ':index.html'], capture_output=True, check=True).stdout.decode('utf-8')
for f in ['v212_f213.html', 'tree_212.html', 'tree_f213.html']:
    try: os.unlink(os.path.join(SP, f))
    except FileNotFoundError: pass
io.open(SP + '/v212_f213.html', 'w', encoding='utf-8').write(force(base, 'V212'))
io.open(SP + '/tree_212.html', 'w', encoding='utf-8').write(tree)
tf = force(tree, 'tree')
io.open(SP + '/tree_f213.html', 'w', encoding='utf-8').write(tf)
print('wrote v212_f213.html tree_212.html tree_f213.html under', SP)

spec = json.load(io.open(ROOT + '/tests/sabotage/v213_d113a.json', encoding='utf-8'))
bad = False
for i, m in enumerate(spec, 1):
    n = tf.count(m['anchor'])
    nb = base.count(m['anchor'])
    print('S%d anchor count on tree=%d (V212=%d)  %s' % (i, n, nb, m['name'][:70]))
    out = os.path.join(SP, 'mut_S%d.html' % i)
    try: os.unlink(out)
    except FileNotFoundError: pass
    if n != 1 or m['replacement'] == m['anchor']:
        bad = True
        continue
    io.open(out, 'w', encoding='utf-8').write(tf.replace(m['anchor'], m['replacement']))
if bad:
    sys.exit('ABORT: a sabotage anchor is not count 1 on the tree, or its replacement is a no-op.')
print('all %d sabotage anchors count 1 on the tree; mutants written' % len(spec))
