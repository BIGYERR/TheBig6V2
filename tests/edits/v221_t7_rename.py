#!/usr/bin/env python3
# V221 slice T7 (rename). No index.html change (it is proven and FROZEN).
# Mario's instruction: the triage chat's "v212_" files are renamed to the prefix of the version that ships
# them when they are committed. V221 ships P-SWAPFLOOR (D177), P-ACTIVE (D178, plus D180 P-BLOCKOPEN, which
# lives in the same ruling file) and P-DONENAV (D179).
#   1. MOVES (os.rename): four rulings from tests/measure/v212_rulings/ into tests/measure/v221_rulings/,
#      five measure scripts v212_ -> v221_. Every source must exist and every destination must not; any
#      miss aborts before anything moves.
#   2. PATH STRINGS: literal substitution of each old path/name by its new one, in the listed files only.
#      Rulings match only as `v212_rulings/p_<name>` paths, so a bare `p_swapfloor_ruling.md` (as
#      p_swapdurable_ruling.md, which leads V222 and stays in v212_rulings/, names it) stays correct and is
#      not touched. .out.txt logs are moved but never rewritten (a log records what was run at the time).
#      The rulings that stay in v212_rulings/, the other v212_ scripts and the handoff are not touched.
#   3. REPORT ONLY: every other file under tests/ (not .out.txt) that still names a moved path is printed
#      and left alone; a file in v212_rulings/ naming a moved ruling by its v212_rulings/ path is flagged.
import os, re, sys, glob

R = '/Users/CanasBangin/Desktop/TheBig6V2'
M = R + '/tests/measure'
SELF = os.path.abspath(__file__)


def die(msg):
    print('ABORT ' + msg + '; nothing moved or written')
    sys.exit(1)


RULINGS = ['p_swapfloor_ruling.md', 'p_swapfloor_ruling.v1.md', 'p_active_ruling.md', 'p_donenav_ruling.md']
SCRIPTS = ['swapfloor_counterfactual', 'goblet_low_reps', 'slow_goblet_timed', 'done_nav', 'open_vs_active']
MOVES = [(M + '/v212_rulings/' + f, M + '/v221_rulings/' + f) for f in RULINGS]
MOVES += [(M + '/v212_' + s + '.js', M + '/v221_' + s + '.js') for s in SCRIPTS]

# substitutions: (compiled pattern, replacement, label)
SUBS = [(re.compile(re.escape('v212_rulings/' + f)), 'v221_rulings/' + f, 'v212_rulings/' + f) for f in RULINGS]
SUBS += [(re.compile(r'\bv212_' + s + r'\b'), 'v221_' + s, 'v212_' + s) for s in SCRIPTS]

# targets (post-move paths). .out.txt logs are excluded by construction.
TARGETS = [M + '/v221_rulings/' + f for f in RULINGS]
TARGETS += [M + '/v221_' + s + '.js' for s in SCRIPTS]
TARGETS += [M + '/v221_rebase_active.js', M + '/v221_donenav_pending.js', M + '/v221_blockopen.js',
            M + '/v221_swap_frozen.js']
TARGETS += sorted(glob.glob(R + '/tests/gates/g221_*.js'))
TARGETS += sorted(p for p in glob.glob(R + '/tests/edits/v221_*.py') if os.path.abspath(p) != SELF)
TARGETS += sorted(glob.glob(R + '/tests/sabotage/v221_*.json'))
KEEP = [M + '/v212_rulings/' + f for f in ['p_swapdurable_ruling.md', 'p_racedate_ruling.md',
        'p_safepace_ruling.md', 'p_pacedisclose_ruling.md', 'p_pacemodel_proposal.md']]


def pre_path(t):
    for a, b in MOVES:
        if b == t:
            return a
    return t


def counts(s):
    return [(label, len(pat.findall(s))) for pat, rep, label in SUBS]


# ---- preconditions (nothing written until all hold) ----
for a, b in MOVES:
    if not os.path.isfile(a):
        die('source missing: ' + a)
    if os.path.exists(b):
        die('destination exists: ' + b)
for k in KEEP:
    if not os.path.isfile(k):
        die('stay-put ruling missing: ' + k)
for t in TARGETS:
    if t.endswith('.out.txt'):
        die('a .out.txt log is in the target list: ' + t)
    if not os.path.isfile(pre_path(t)):
        die('substitution target missing: ' + pre_path(t))
KEEP_BYTES = {k: open(k, 'rb').read() for k in KEEP}

print('== pre-substitution counts (old tokens per target, at pre-move path) ==')
for t in TARGETS:
    c = [(l, n) for l, n in counts(open(pre_path(t), encoding='utf-8').read()) if n]
    print('pre    %s: %s' % (os.path.relpath(pre_path(t), R), ', '.join('%s x%d' % x for x in c) if c else '0'))

# ---- 1. moves ----
os.makedirs(M + '/v221_rulings', exist_ok=False)
for a, b in MOVES:
    os.rename(a, b)
    print('moved  %s -> %s' % (os.path.relpath(a, R), os.path.relpath(b, R)))

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

# ---- proof: every source gone, every destination present, zero old tokens left in every target ----
bad = 0
for a, b in MOVES:
    if os.path.exists(a) or not os.path.isfile(b):
        print('FAIL move %s -> %s' % (os.path.relpath(a, R), os.path.relpath(b, R)))
        bad += 1
for t in TARGETS:
    left = sum(n for l, n in counts(open(t, encoding='utf-8').read()))
    print('post   %s: %d' % (os.path.relpath(t, R), left))
    if left:
        bad += 1
for k, v in KEEP_BYTES.items():
    if open(k, 'rb').read() != v:
        print('FAIL stay-put ruling changed: ' + os.path.relpath(k, R))
        bad += 1

# ---- 3. report only: other files under tests/ still naming a moved path ----
print('== outside the target list (report only, not rewritten) ==')
TSET = set(os.path.abspath(t) for t in TARGETS) | {SELF}
for dp, dn, fn in os.walk(R + '/tests'):
    for f in sorted(fn):
        p = os.path.abspath(os.path.join(dp, f))
        if p in TSET:
            continue
        try:
            s = open(p, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        c = [(l, n) for l, n in counts(s) if n]
        if not c:
            continue
        kind = 'LOG (.out.txt, never rewritten)' if f.endswith('.out.txt') else 'OTHER'
        if os.path.dirname(p) == M + '/v212_rulings' and any(l.startswith('v212_rulings/') for l, n in c):
            kind = 'FLAG for main session (stays in v212_rulings/, names a moved ruling by path)'
        print('ref    %s [%s]: %s' % (os.path.relpath(p, R), kind, ', '.join('%s x%d' % x for x in c)))

print('RESULT %s' % ('OK' if not bad else 'FAIL %d' % bad))
sys.exit(1 if bad else 0)
