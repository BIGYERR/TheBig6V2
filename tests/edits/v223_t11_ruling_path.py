#!/usr/bin/env python3
# V223 post-proof rename slice t11. No index.html change (proven GREEN and FROZEN; this script asserts
# its bytes are unchanged). Standing rule (handoff section 12): the shipped ruling and scripts move from
# the triage chat's v212_ prefix to the shipping version's prefix. V223 ships D182 (P-RACEDATE), D183
# (P-SAFEPACE) and D184 (P-TESTLEN, whose prior sections live in p_safepace_ruling.md).
# Precedent: v222_t3_ruling_path.py (gate comment check), v221_t7_rename.py (moves plus path strings).
#   1. MOVES (os.rename): two rulings tests/measure/v212_rulings/ -> tests/measure/v223_rulings/, six
#      build 3 measure scripts v212_<name>.js -> v223_<name>.js. Every source must exist and every
#      destination must not; any miss aborts before anything moves.
#   2. PATH STRINGS: the two ruling paths (v212_rulings/ + p_racedate_ruling.md, p_safepace_ruling.md;
#      assembled in code below, never spelled whole here, so the post-rename grep over tests/edits/v223_*
#      stays empty) become their v223_rulings/ paths; each moved script's name `v212_<name>` (word bounded) becomes
#      `v223_<name>`. Only in the listed targets, and each target's old token count is asserted
#      exactly before anything is written.
#      Gates: every changed line must be a // comment line and differ only by the swap (v222_t3 shape).
#      Everywhere else, exactly one changed line may be executable: the self exclusion regex in the
#      moved safepace_m script (`!/v212_safepace_m\.js$/`), which must follow the file's new name or
#      the script would walk itself.
#      Not touched: v212_rulings/p_swapdurable_ruling.md refs (moved in V222), v212_f213.html, the
#      historic v220/v221/v222/v213 edits and g213_d113a.js, .out.txt logs, the handoff, and the
#      `v212 measure` / `v212tz_` words inside the moved scripts (session label and tmp file name,
#      not paths to a moved file).
#   3. STAY PUT (bytes asserted unchanged): builds 4 and 5 rulings and scripts, unknown owners.
#   4. REPORT ONLY: any file in the repo (not .git, not index.html) still naming a moved path.
import os, re, sys, glob, hashlib

R = '/Users/CanasBangin/Desktop/TheBig6V2'
M = R + '/tests/measure'
SELF = os.path.abspath(__file__)


def die(msg):
    print('ABORT ' + msg + '; nothing moved or written')
    sys.exit(1)


RULINGS = ['p_racedate_ruling.md', 'p_safepace_ruling.md']
SCRIPTS = ['race_date_tz', 'weeksout_dst', 'safe_pace_offer', 'safepace_m', 'testlen_m7', 'testlen_m8']
MOVES = [(M + '/v212_rulings/' + f, M + '/v223_rulings/' + f) for f in RULINGS]
MOVES += [(M + '/v212_' + s + '.js', M + '/v223_' + s + '.js') for s in SCRIPTS]

SUBS = [(re.compile(re.escape('v212_rulings/' + f)), 'v223_rulings/' + f, f.split('_')[1]) for f in RULINGS]
SUBS += [(re.compile(r'\bv212_' + s + r'\b'), 'v223_' + s, s) for s in SCRIPTS]
LABELS = [lab for _, _, lab in SUBS]  # racedate, safepace, then the six script names

# Expected old token counts per target, keyed by POST-move relative path (read at pre-move path).
EXPECT = {
    'tests/gates/g223_d182_racedate.js': {'racedate': 1},
    'tests/gates/g223_d183_safepace.js': {'safepace': 1},
    'tests/gates/g207_test_calendar.js': {'safepace': 1},
    'tests/gates/g203_mile_pencil.js': {'safepace': 1, 'racedate': 1},
    'tests/edits/v223_s3p_d182_review_past.py': {'racedate': 1},
    'tests/edits/v223_s4_d183_repaint_core.py': {'safepace': 1},
    'tests/edits/v223_s5_d183_goal_handlers.py': {'safepace': 1},
    'tests/edits/v223_s6_d183_mile_handlers.py': {'safepace': 1},
    'tests/edits/v223_s7_d183_reach_card.py': {'safepace': 1},
    'tests/edits/v223_s8_d183_header_name.py': {'safepace': 1},
    'tests/edits/v223_s9_d183_retire_descs.py': {'safepace': 1},
    'tests/edits/v223_s10_d183_pace_lines.py': {'safepace': 1},
    'tests/edits/v223_s11_d183_dash_sweep.py': {'safepace': 1},
    'tests/edits/v223_s12_d184a_one_owner.py': {'safepace': 1},
    'tests/edits/v223_s13_d184b_one_length.py': {'safepace': 1},
    'tests/edits/v223_t1_d182_g203_rekey.py': {'racedate': 2},
    'tests/edits/v223_t2_d183_rekey_g207_g218_g203.py': {'safepace': 3},
    'tests/edits/v223_t6_era_rows_harness_g193.py': {'racedate': 1, 'safepace': 1},
    'tests/edits/v223_t7_era_rows_g197b_g199_g200_g219.py': {'racedate': 1, 'safepace': 1},
    'tests/edits/v223_t9_g204_census_row.py': {'safepace': 1},
    'tests/measure/v223_race_date_tz.js': {'race_date_tz': 1},
    'tests/measure/v223_weeksout_dst.js': {'weeksout_dst': 2, 'race_date_tz': 1},
    'tests/measure/v223_safe_pace_offer.js': {'safe_pace_offer': 1},
    'tests/measure/v223_safepace_m.js': {'safepace_m': 2},
    'tests/measure/v223_testlen_m7.js': {'testlen_m7': 1},
    'tests/measure/v223_testlen_m8.js': {'testlen_m8': 1},
    'tests/measure/v223_rebase_digest_probe.js': {'safepace_m': 1},
    'tests/measure/v223_rulings/p_racedate_ruling.md': {'race_date_tz': 1, 'weeksout_dst': 3},
    'tests/measure/v223_rulings/p_safepace_ruling.md': {'safe_pace_offer': 2, 'safepace_m': 1, 'testlen_m8': 1},
    'tests/measure/v223_rulings/p_testlen_d184_ruling.md': {'safepace': 2},  # lines 5 and 12
}
# The only changed lines allowed to be executable (not a comment, not a string of comment text).
EXEC_ALLOWED = {'tests/measure/v223_safepace_m.js:105'}

# Every other build file is scanned too; it must carry zero old tokens (asserted, not written).
ZERO = sorted(set(
    [os.path.relpath(p, R) for p in glob.glob(R + '/tests/gates/g223_*.js')]
    + [os.path.relpath(p, R) for p in glob.glob(R + '/tests/edits/v223_*.py') if os.path.abspath(p) != SELF]
    + [os.path.relpath(p, R) for p in glob.glob(M + '/v223_*.js')]
    + [os.path.relpath(p, R) for p in glob.glob(M + '/v223_rulings/*.md')]
    + [os.path.relpath(p, R) for p in glob.glob(R + '/tests/sabotage/v223_*.json')]
) - set(EXPECT))

KEEP = [M + '/v212_rulings/p_pacedisclose_ruling.md', M + '/v212_rulings/p_pacemodel_proposal.md',
        M + '/v212_pacerate.js', M + '/v212_pacerate.out.txt', M + '/v212_pacerate_m6.out.txt',
        M + '/v212_pace_math_origin.txt', M + '/v212_default_pace_disclosure.js',
        M + '/v212_stored_grid_freeze.js', M + '/v212_stored_grid_rewrite.js',
        M + '/v212swim_gk_lattice.js', M + '/v212swim_remeasure.js', R + '/index.html']


def pre_path(rel):
    ab = R + '/' + rel
    for a, b in MOVES:
        if b == ab:
            return a
    return ab


def counts(s):
    return {lab: len(pat.findall(s)) for pat, rep, lab in SUBS if pat.findall(s)}


def subst(s):
    for pat, rep, lab in SUBS:
        s = pat.sub(rep, s)
    return s


def is_comment_line(rel, ln):
    t = ln.lstrip()
    if rel.endswith('.md'):
        return True  # prose
    if rel.endswith('.py'):
        return t.startswith('#') or t.startswith('//')  # // = JS comment text carried in a py string
    return t.startswith('//')


# ---- preconditions (nothing moved or written until all hold) ----
for a, b in MOVES:
    if not os.path.isfile(a):
        die('source missing: ' + a)
    if os.path.exists(b):
        die('destination exists: ' + b)
if not os.path.isdir(M + '/v223_rulings'):
    die('tests/measure/v223_rulings/ does not exist')
for k in KEEP:
    if not os.path.isfile(k):
        die('stay-put file missing: ' + k)
KEEP_SHA = {k: hashlib.sha256(open(k, 'rb').read()).hexdigest() for k in KEEP}

plans = []
exec_changed = set()
for rel in sorted(EXPECT):
    src_path = pre_path(rel)
    if not os.path.isfile(src_path):
        die('target missing: ' + os.path.relpath(src_path, R))
    src = open(src_path, 'rb').read().decode('utf-8')
    got = counts(src)
    if got != EXPECT[rel]:
        die('%s: old token counts %r, expected %r' % (os.path.relpath(src_path, R), got, EXPECT[rel]))
    out = subst(src)
    a, b = src.split('\n'), out.split('\n')
    if len(a) != len(b):
        die(rel + ': line count changed')
    changed = [i for i in range(len(a)) if a[i] != b[i]]
    for i in changed:
        if subst(a[i]) != b[i]:
            die('%s:%d changed line is not a pure path swap' % (rel, i + 1))
        if not is_comment_line(rel, a[i]):
            if rel.startswith('tests/gates/'):
                die('%s:%d gate line holding the old path is not a // comment' % (rel, i + 1))
            exec_changed.add('%s:%d' % (rel, i + 1))
    if counts(out):
        die('%s: old tokens remain after substitution: %r' % (rel, counts(out)))
    for lab, n in EXPECT[rel].items():
        rep = [r for p, r, l in SUBS if l == lab][0]
        if out.count(rep) - src.count(rep) != n:
            die('%s: new token %s count not raised by exactly %d' % (rel, rep, n))
    plans.append((rel, out, len(changed)))
if exec_changed != EXEC_ALLOWED:
    die('executable changed lines %r, expected exactly %r' % (sorted(exec_changed), sorted(EXEC_ALLOWED)))
for rel in ZERO:
    c = counts(open(pre_path(rel), 'rb').read().decode('utf-8'))
    if c:
        die('%s carries old tokens %r but is not in the expected table' % (rel, c))

# ---- moves ----
for a, b in MOVES:
    os.rename(a, b)
    print('moved  %s -> %s' % (os.path.relpath(a, R), os.path.relpath(b, R)))

# ---- writes ----
for rel, out, nlines in plans:
    with open(R + '/' + rel, 'wb') as fh:
        fh.write(out.encode('utf-8'))
    print('wrote  %s: %s (%d line%s)' % (rel, ', '.join('%s x%d' % kv for kv in sorted(EXPECT[rel].items())),
                                        nlines, '' if nlines == 1 else 's'))
print('exec   %s (self exclusion regex follows the new file name)' % ', '.join(sorted(exec_changed)))

# ---- re-read and re-assert on disk ----
for rel, out, _ in plans:
    got = open(R + '/' + rel, 'rb').read().decode('utf-8')
    if got != out:
        print('FAIL %s: on-disk content does not match the plan' % rel); sys.exit(2)
    if counts(got):
        print('FAIL %s: old tokens on disk after write' % rel); sys.exit(2)
for a, b in MOVES:
    if os.path.exists(a) or not os.path.isfile(b):
        print('FAIL move not on disk: ' + b); sys.exit(2)
for k in KEEP:
    if hashlib.sha256(open(k, 'rb').read()).hexdigest() != KEEP_SHA[k]:
        print('FAIL stay-put file changed: ' + k); sys.exit(2)
print('keep   %d stay-put files byte-identical (index.html among them)' % len(KEEP))

# ---- report only: anything in the repo still naming a moved path ----
left = []
for dp, dn, fn in os.walk(R):
    dn[:] = [d for d in dn if d != '.git']
    for f in fn:
        p = os.path.join(dp, f)
        if p == R + '/index.html' or os.path.abspath(p) == SELF:
            continue
        try:
            s = open(p, 'rb').read().decode('utf-8')
        except Exception:
            continue
        c = counts(s)
        if c:
            left.append('%s: %r' % (os.path.relpath(p, R), c))
print('report %d file(s) outside the targets still name a moved path%s' % (len(left), ':' if left else ''))
for x in left:
    print('       ' + x)
print('OK')
