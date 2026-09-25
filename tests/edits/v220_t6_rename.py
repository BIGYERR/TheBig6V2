#!/usr/bin/env python3
# V220 slice T6 (rename). No index.html change (it is proven and FROZEN).
# Mario's instruction: the triage chat's "v212_" files are renamed to the prefix of the version that ships
# them when they are committed. V220 ships four rulings (P-RECOVBANNER, P-EMOJI, P-POPCOND, P-BARERX).
#   1. MOVES (os.rename): the four rulings into tests/measure/v220_rulings/, seven measure scripts/logs
#      v212_ -> v220_, and gatekeeper's gkA_v220_fuzz.js -> v220_gatekeeper_fuzz.js. Every source must exist
#      and every destination must not; any miss aborts before anything moves.
#   2. PATH STRINGS: literal substitution of each old path/name by its new one, in the listed files only.
#      .out.txt logs are moved but never rewritten (a log records what was run at the time). The eight
#      rulings that stay in v212_rulings/, later-build v212_ scripts and the handoff are not touched.
#   3. g220_d174_emoji.js below 220: a standalone REFUSED line in g220_d175_popcond.js's form, so gate.sh's
#      refusal counter sees it; the per-row FAILs stay.
import os, re, sys, glob

R = '/Users/CanasBangin/Desktop/TheBig6V2'
M = R + '/tests/measure'
SELF = os.path.abspath(__file__)


def die(msg):
    print('ABORT ' + msg + '; nothing moved or written')
    sys.exit(1)


RULINGS = ['p_recovbanner_ruling.md', 'p_emoji_ruling.md', 'p_popcond_ruling.md', 'p_barerx_ruling.md']
SCRIPTS = ['recovery_banner', 'emoji_chrome', 'popup_conditions', 'popcond_verify', 'bare_rx']
MOVES = [(M + '/v212_rulings/' + f, M + '/v220_rulings/' + f) for f in RULINGS]
MOVES += [(M + '/v212_' + a, M + '/v220_' + a) for a in
          ['recovery_banner.js', 'emoji_chrome.js', 'emoji_chrome.out.txt', 'popup_conditions.js',
           'popup_conditions.out.txt', 'popcond_verify.js', 'bare_rx.js']]
MOVES += [(M + '/gkA_v220_fuzz.js', M + '/v220_gatekeeper_fuzz.js')]

# substitutions: (compiled pattern, replacement, label)
SUBS = [(re.compile(re.escape('v212_rulings/' + f)), 'v220_rulings/' + f, 'v212_rulings/' + f) for f in RULINGS]
SUBS += [(re.compile(r'\bv212_' + s + r'\b'), 'v220_' + s, 'v212_' + s) for s in SCRIPTS]
SUBS += [(re.compile(r'\bgkA_v220_fuzz\b'), 'v220_gatekeeper_fuzz', 'gkA_v220_fuzz')]

# targets (post-move paths). .out.txt logs are excluded by construction.
TARGETS = [R + '/tests/gates/' + g for g in ['g220_d173_recovbanner.js', 'g220_d174_emoji.js', 'g220_d175_popcond.js']]
TARGETS += sorted(p for p in glob.glob(R + '/tests/edits/v220_*.py') if os.path.abspath(p) != SELF)
TARGETS += [M + '/v220_rulings/' + f for f in RULINGS]
TARGETS += [M + '/v220_' + s + '.js' for s in SCRIPTS] + [M + '/v220_gatekeeper_fuzz.js']
TARGETS += [M + '/v220_rebase_bare_rx.js', M + '/v220_popcond_census.js', M + '/v220_rebase_build1.js']

GATE = R + '/tests/gates/g220_d174_emoji.js'
REF_OLD = "  if(!(VER >= 220)){ ROWS.forEach(([id, d]) => {"
REF_NEW = ("  if(!(VER >= 220)){ console.log('REFUSED: ia-version ' + VER + ' predates D174 P-EMOJI (V220). No row may pass on it.');\n"
           "    ROWS.forEach(([id, d]) => {")

# ---- preconditions (nothing written until all hold) ----
for a, b in MOVES:
    if not os.path.isfile(a):
        die('source missing: ' + a)
    if os.path.exists(b):
        die('destination exists: ' + b)
g = open(GATE, encoding='utf-8').read()
if g.count(REF_OLD) != 1:
    die('g220_d174 refusal anchor count %d (want 1)' % g.count(REF_OLD))
for t in TARGETS:
    pre = t
    for a, b in MOVES:
        if b == t:
            pre = a
    if not os.path.isfile(pre):
        die('substitution target missing: ' + pre)

# ---- 1. moves ----
os.makedirs(M + '/v220_rulings', exist_ok=True)
for a, b in MOVES:
    os.rename(a, b)
    print('moved %s -> %s' % (os.path.relpath(a, R), os.path.relpath(b, R)))

# ---- 2. path strings ----
for t in TARGETS:
    s0 = open(t, encoding='utf-8').read()
    s, tally = s0, []
    for pat, rep, label in SUBS:
        s, n = pat.subn(rep, s)
        if n:
            tally.append('%s x%d' % (label, n))
    if s != s0:
        open(t, 'w', encoding='utf-8').write(s)
        print('paths  %s: %s' % (os.path.relpath(t, R), ', '.join(tally)))

# ---- 3. g220_d174 standalone REFUSED line ----
g = open(GATE, encoding='utf-8').read()
if g.count(REF_OLD) != 1:
    die('g220_d174 refusal anchor lost after path pass')
open(GATE, 'w', encoding='utf-8').write(g.replace(REF_OLD, REF_NEW, 1))
print('gate   tests/gates/g220_d174_emoji.js: standalone REFUSED line below 220')
