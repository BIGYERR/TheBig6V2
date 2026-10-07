#!/usr/bin/env bash
# tooling_selftest.sh: the committed proof of the post-V233 proof-scope tooling (post-V233 slice 10).
#
#   bash tests/tooling_selftest.sh <scratch-dir> [tools-dir]
#
# The tools of the post-V233 tooling pass (tests/gate.sh, version_scope.js, era_bump.py, sabotage.py, chain.js) were
# proven only by builder scratch scripts that died with their chat. This file rebuilds those proofs as named rows, so an
# edit that quietly undoes a ruled behaviour (gate.sh back to stop-at-first-red, say) turns a row red. Every expected
# value is typed here from the ruling, the documented list or a hand table; none is read back from the tool under test.
#
# <scratch-dir> must exist and must not be inside the repo. Everything the self-test makes (toy trees, a git clone,
# fixtures, TMPDIR) goes under a fresh <scratch-dir>/selftest.XXXXXX, kept for inspection. Nothing under the repo is
# written: row X1 proves it (the repo's file list is the same at the end as at the start, and no file under it is newer
# than the run's start marker; .git and .claude aside), so run the self-test alone, not beside a gate.sh run (that one
# writes .last_diff.txt).
# [tools-dir] (default: the directory this file sits in) holds the seven tools under test. Point it at a copy with one
# tool sabotaged and that tool's rows go red. Everything else (index.html, harness.js, lint_allow.txt, the gates, the
# sabotage specs and lists, the tags V232 and V233, the reach map at HEAD) comes from the repo.
# No real gate runs: gate.sh grades toy gates (it still boots index.html at step 3), sabotage.py trips a toy gate,
# status.js runs inside toy gates and rows.js reads toy outputs (post-V233 slice M1a); gate.sh step 4b checks toy rows (M1b).
# Rows scoped to a version read today's ia-version from index.html (CUR) and bump to CUR+1, never a typed version.
# Prints one row per claim, then `PASS n FAIL n`; a missing summary is a crash. Exit 0 only on FAIL 0, 2 on a refusal.
set -eo pipefail

usage() { echo "usage: bash tests/tooling_selftest.sh <scratch-dir> [tools-dir]"; }
if [ -z "${1:-}" ]; then usage; echo "REFUSED: no scratch dir: the self-test writes only under the dir it is given"; exit 2; fi
if [ ! -d "$1" ]; then usage; echo "REFUSED: scratch dir $1 does not exist"; exit 2; fi
HERE="$(cd "$(dirname "$0")" && pwd -P)"
R="$(cd "$HERE/.." && pwd -P)"
SCR="$(cd "$1" && pwd -P)"
case "$SCR/" in "$R/"*) usage; echo "REFUSED: scratch dir $SCR is inside the repo $R"; exit 2 ;; esac
TA="${2:-$HERE}"
if [ ! -d "$TA" ]; then usage; echo "REFUSED: tools dir $TA does not exist"; exit 2; fi
T="$(cd "$TA" && pwd -P)"
for f in gate.sh version_scope.js era_bump.py sabotage.py chain.js status.js rows.js; do
  if [ ! -f "$T/$f" ]; then usage; echo "REFUSED: tools dir $T has no $f"; exit 2; fi
done

T0="$(date +%s)"
unset ROW_RULED ROW_MANIFEST_OUT ROW_CHECK_BOOTSTRAP   # gate.sh step 4b reads these: none leaks in from the caller
W="$(mktemp -d "$SCR/selftest.XXXXXX")"
mkdir -p "$W/tmp"
export TMPDIR="$W/tmp" PYTHONDONTWRITEBYTECODE=1
touch "$W/.start"
# X1's record of the repo: every file path (.git, .claude and Finder's .DS_Store aside). Files only: a directory's
# mtime here is restamped by an agent outside the self-test seconds after any write into it (seen in s10, whole-second
# stamps on the repo root, tests and tests/edits only), so a directory is no evidence either way.
repo_files() { find "$R" \( -path "$R/.git" -o -path "$R/.claude" \) -prune -o -type f ! -name .DS_Store -print | LC_ALL=C sort > "$1"; }
repo_files "$W/repo_files.before"
CUR="$(grep -oE '<meta name="ia-version" content="[0-9]+"' "$R/index.html" | grep -oE '[0-9]+' | tail -1 || true)"
if [ -z "$CUR" ]; then echo "setup: index.html carries no ia-version meta (crash)"; exit 1; fi
NEXT=$((CUR + 1))
echo "tooling self-test: tools $T"
echo "   repo $R, today's ia-version $CUR (era rows bump to $NEXT), run dir $W"

# ---- row helpers ---------------------------------------------------------------------------------------------------
P=0; F=0
row() { # row <name> <condition, eval'd> [file to point at on a FAIL]
  if eval "$2"; then P=$((P + 1)); echo "  ok    $1"
  else F=$((F + 1)); echo "FAIL  $1"; if [ -n "${3:-}" ]; then echo "        see $3"; fi; fi
}
run() { # run <out> <cmd...>: output and exit code captured, never fatal
  local out="$1" rc=0; shift
  "$@" > "$out" 2>&1 || rc=$?
  echo "$rc" > "$out.rc"
}
rc_is() { [ "$(cat "$1.rc")" = "$2" ]; }
has() { grep -qE -- "$2" "$1"; }      # a line matches the ERE
hasF() { grep -qF -- "$2" "$1"; }     # a line holds the fixed string
hasX() { grep -qxF -- "$2" "$1"; }    # a whole line equals the string
lacks() { ! grep -qE -- "$2" "$1"; }
words() { tr '\n' ' ' < "$1" | sed 's/ *$//'; }

# ---- oracle helpers (python, independent of the tools under test) -------------------------------------------------
cat > "$W/oracle.py" <<'PY'
import glob, json, os, re, sys

def known(path):
    """The documented-list format (`<spec>.json <mutation name>  # reason`): [(spec, name)] in file order."""
    out = []
    for raw in open(path, encoding='utf-8').read().split('\n'):
        l = raw.rstrip()
        if not l.strip() or l.lstrip().startswith('#'):
            continue
        sp, _, rest = l.partition(' ')
        out.append((sp, rest.partition('  # ')[0]))
    return out

def put(path, text):
    open(path, 'w', encoding='utf-8').write(text)

cmd, a = sys.argv[1], sys.argv[2:]
if cmd == 'anchors-exact':      # <out> <known>: the documented NOT-APPLIED lines are exactly the list, nothing else red
    out = open(a[0], encoding='utf-8').read().split('\n'); K = known(a[1])
    doc = [l for l in out if l.startswith('NOT-APPLIED  documented    ')]
    red = [l for l in out if l.startswith(('NOT-APPLIED  UNDOCUMENTED', 'STALE', 'CRASH', 'FAIL'))]
    each = all(any(l.startswith('NOT-APPLIED  documented    %s  %s  (' % k) for l in doc) for k in K)
    summ = any(re.fullmatch(r'ANCHORS \d+ checked, %d not-applied \(%d documented\)' % (len(K), len(K)), l) for l in out)
    sys.exit(0 if K and len(doc) == len(K) and each and summ and not red else 1)
if cmd == 'pick-live':          # <cand> <specdir> <known> <edited cand out> <spec out> <name out>
    src = open(a[0], encoding='utf-8').read(); K = set(known(a[2]))
    for p in sorted(glob.glob(os.path.join(a[1], '*.json'))):
        sp = os.path.basename(p)
        try:
            muts = json.load(open(p, encoding='utf-8'))
        except Exception:
            continue
        for m in (muts if isinstance(muts, list) else []):
            if not isinstance(m, dict) or not all(isinstance(m.get(f), str) for f in ('name', 'anchor', 'replacement', 'gate')):
                continue
            an = m['anchor']
            if len(an) < 2 or '\n' in m['name'] or (sp, m['name']) in K or src.count(an) != 1 or src.replace(an, m['replacement']) == src:
                continue
            mid = len(an) // 2
            bad = src.replace(an, an[:mid] + 'QSELFTEST' + an[mid:])
            if bad.count(an) != 0:
                continue
            put(a[3], bad); put(a[4], sp); put(a[5], m['name'])
            sys.exit(0)
    sys.exit(1)
if cmd == 'drop-first':         # <known> <list out> <spec out> <name out>: the list minus its first entry
    lines = open(a[0], encoding='utf-8').read().split('\n')
    k = next(i for i, l in enumerate(lines) if l.strip() and not l.lstrip().startswith('#'))
    sp, _, rest = lines[k].rstrip().partition(' ')
    put(a[1], '\n'.join(lines[:k] + lines[k + 1:])); put(a[2], sp); put(a[3], rest.partition('  # ')[0])
    sys.exit(0)
if cmd == 'toy-spec':           # <gate> <spec out>
    t = lambda n, an, rp: {'name': n, 'anchor': an, 'replacement': rp, 'gate': a[0]}
    put(a[1], json.dumps([t('T1 -> alpha breaks, the toy gate trips', 'alpha', 'BROKEN alpha'),
                          t('T2 -> beta is renamed, the toy gate cannot see it', 'beta', 'beta2'),
                          t('T3 -> delta is gone from the toy candidate, so this never applies', 'delta', 'delta2')], indent=1))
    sys.exit(0)
if cmd == 'chain-cands':        # <V233 html> <getPrograms cand out> <const cand out> <const line out>
    s = open(a[0], encoding='utf-8').read()
    g = list(re.finditer(r'^function getPrograms\([^)]*\)\s*\{', s, re.M))
    c = list(re.finditer(r'^const ([A-Z_][A-Z0-9_]*)\s*=\s*(\d+)\s*;', s, re.M))
    if len(g) != 1 or not c:
        print('chain-cands: getPrograms count %d, numeric top-level consts %d' % (len(g), len(c))); sys.exit(1)
    put(a[1], s[:g[0].end()] + 'var _chainProbe=0;' + s[g[0].end():])
    x = c[0]; v = str(int(x.group(2)) + 1)
    put(a[2], s[:x.start(2)] + v + s[x.end(2):]); put(a[3], s[x.start():x.start(2)] + v + s[x.end(2):x.end()])
    sys.exit(0)
if cmd == 'heavy-spec':         # <heavy gate> <light gate> <spec out>: H1 L1 H2 L2 L3, heavy and light interleaved
    t = lambda n, an, g: {'name': n, 'anchor': an, 'replacement': 'BROKEN-' + n[:2], 'gate': g}
    put(a[2], json.dumps([t('H1 -> alpha breaks, judged by the pool-column gate', 'alpha', a[0]),
                          t('L1 -> beta breaks, judged by a light gate', 'beta', a[1]),
                          t('H2 -> gamma breaks, judged by the pool-column gate', 'gamma', a[0]),
                          t('L2 -> delta breaks, judged by a light gate', 'delta', a[1]),
                          t('L3 -> epsilon breaks, judged by a light gate', 'epsilon', a[1])], indent=1))
    sys.exit(0)
if cmd == 'heavy-order':        # <log> <pool>: L1-3 start together, no GATE_POOL, all end; then H1, H2 serial with <pool>
    ev = [l.split() for l in open(a[0], encoding='utf-8').read().split('\n') if l.strip()]
    k = next((j for j, e in enumerate(ev) if e[1].startswith('H')), len(ev))
    lt, hv = ev[:k], ev[k:]
    ok = (len(ev) == 10 and hv == [['start', 'H1', a[1]], ['end', 'H1'], ['start', 'H2', a[1]], ['end', 'H2']]
          and sorted(e[1] for e in lt if e[0] == 'start') == ['L1', 'L2', 'L3'] and all(e[2] == '-' for e in lt if e[0] == 'start')
          and sorted(e[1] for e in lt if e[0] == 'end') == ['L1', 'L2', 'L3'] and all(e[0] == 'start' for e in lt[:3]))
    if not ok:
        print('heavy-order: ' + ' | '.join(' '.join(e) for e in ev))
    sys.exit(0 if ok else 1)
sys.exit(2)
PY
oracle() { python3 "$W/oracle.py" "$@"; }

# =====================================================================================================================
echo "== gate.sh: toy gates on index.html (every red graded, GATES RED k of m, step 5, start order, GATE_TIMES_OUT)"
# The start order is read off xargs's own input: a shim first on PATH copies the list gate.sh feeds xargs (xargs starts
# its jobs in input order) and then execs the real xargs with the same arguments and the same input. It also writes those
# arguments, one per line, to <log>.args, so a row can read the -P gate.sh chose.
REAL_XARGS="$(command -v xargs)"
mkdir -p "$W/shim"
cat > "$W/shim/xargs" <<'SHIM'
#!/usr/bin/env bash
set -eo pipefail
printf '%s\n' "$@" > "$SELFTEST_XARGS_LOG.args"
cat > "$SELFTEST_XARGS_LOG.raw"
tr '\0' '\n' < "$SELFTEST_XARGS_LOG.raw" | sed 's#.*/##' > "$SELFTEST_XARGS_LOG"
exec "$SELFTEST_REAL_XARGS" "$@" < "$SELFTEST_XARGS_LOG.raw"
SHIM
chmod +x "$W/shim/xargs"
mk_gate_tree() { # <root>: gate.sh, version_scope.js and rows.js under test, the repo's harness and lint list, an empty toy
  mkdir -p "$1/tests/gates"     # debt file, and a header-only toy skip_allow.txt (a bootstrapped step 4b still runs
  cp "$T/gate.sh" "$T/version_scope.js" "$T/rows.js" "$1/tests/"   # rows.js check against it: post-V233 M1c)
  cp "$R/tests/harness.js" "$1/tests/"
  if [ -f "$R/tests/lint_allow.txt" ]; then cp "$R/tests/lint_allow.txt" "$1/tests/"; fi
  printf '# toy debt file: no toy gate carries debt\n' > "$1/tests/version_scope_debt.txt"
  printf '# toy skip_allow.txt: no entries\n' > "$1/tests/skip_allow.txt"
}
gate_run() { # <out> <start log> <gate.sh> <args...>; ROW_CHECK_BOOTSTRAP=1, so a toy tree here needs no row manifest
  local out="$1" log="$2"; shift 2      # (its skip check runs on one built from the run; the row check has its own rows, G22 to G31)
  run "$out" env PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$log" SELFTEST_REAL_XARGS="$REAL_XARGS" GATE_TIMES_OUT="$out.times" ROW_CHECK_BOOTSTRAP=1 bash "$@"
}
grade_order() { sed -nE 's/^   ([a-z]_[a-z]+\.js): PASS .*/\1/p; s/^FAIL: ([a-z]_[a-z]+\.js) printed .*/\1/p' "$1" | tr '\n' ' ' | sed 's/ *$//'; }
times_ok() { # <file>: gate.sh's header, then one `<gate> <seconds>` line per toy gate, in glob order
  head -1 "$1" | grep -q '^# gate.sh measured wall seconds per gate' || return 1
  [ "$(grep -v '^#' "$1" | awk '{print $1}' | tr '\n' ' ' | sed 's/ *$//')" = "a_pass.js b_fail.js c_crash.js d_refused.js e_pass.js" ] || return 1
  [ "$(grep -cE '^[a-z]_[a-z]+\.js [0-9]+(\.[0-9]+)?$' "$1" || true)" = 5 ]
}
GA="$W/gate_mixed"; mk_gate_tree "$GA"
printf "console.log('PASS 1 FAIL 0');\n" > "$GA/tests/gates/a_pass.js"
printf "console.log('  FAIL toy b row, red on purpose');\nconsole.log('PASS 0 FAIL 1');\n" > "$GA/tests/gates/b_fail.js"
printf "console.log('toy c starts');\nthrow new Error('toy c crashes before its summary');\n" > "$GA/tests/gates/c_crash.js"
printf "console.log('REFUSED toy d row: it could not be put');\nconsole.log('PASS 1 FAIL 0');\n" > "$GA/tests/gates/d_refused.js"
printf "const IA = { version: '%s' }, VER = +IA.version;\nif (VER === %s) console.log('planted exact-version row');\nconsole.log('PASS 2 FAIL 0');\n" "$CUR" "$NEXT" > "$GA/tests/gates/e_pass.js"
printf '# toy start times: e_pass.js is left out, so its cost is unknown and it starts first\na_pass.js 1.0\nb_fail.js 3.0\nc_crash.js 2.0\nd_refused.js 5.0\n' > "$GA/tests/gate_times.txt"
{ cat "$R/index.html"; printf '\n<!-- tooling self-test baseline: two lines apart from the candidate -->\n'; } > "$W/base.html"
gate_run "$W/g_mixed.out" "$W/g_mixed.start" "$GA/tests/gate.sh" "$R/index.html" "$W/base.html"
O="$W/g_mixed.out"
row "G1 gate.sh, mixed toy set (pass, FAIL, crash, REFUSED, pass with a planted row): exit 1" 'rc_is "$O" 1' "$O"
row "G2 the FAIL gate is graded with its detail" 'has "$O" "^   b_fail\.js: PASS 0 FAIL 1  " && hasX "$O" "  FAIL toy b row, red on purpose"' "$O"
row "G3 the crash after it (no summary) is graded and named" 'has "$O" "^FAIL: c_crash\.js printed no PASS/FAIL summary \(crash\?\)"' "$O"
row "G4 the REFUSED gate after that is graded red (blocking)" 'has "$O" "^   d_refused\.js: PASS 1 FAIL 0  .*REFUSED \(blocking\)$" && has "$O" "^FAIL: d_refused\.js REFUSED an assertion"' "$O"
row "G5 step 2b: the planted exact-version row is red by name" 'hasX "$O" "FAIL: version_scope.js: PASS 4 FAIL 1 (exit 1)" && has "$O" "^FAIL new exact-version row: e_pass\.js has 1 exact-version hit and no debt line"' "$O"
row "G6 every red is listed once: GATES RED 4 of 6 with the four names" 'hasX "$O" "GATES RED 4 of 6: version_scope.js b_fail.js c_crash.js d_refused.js"' "$O"
row "G7 step 5 runs after the reds (blast-radius diff written)" 'hasX "$O" "== 5. blast-radius diff vs base.html" && has "$O" "^   [0-9]+ hunks, \+[0-9]+/-[0-9]+ lines" && [ -s "$GA/.last_diff.txt" ]' "$O"
row "G8 no ALL GATES PASS on a red run" 'lacks "$O" "^ALL GATES PASS"' "$O"
row "G9 start order: the unknown gate first, then longest first (e d b c a)" '[ "$(words "$W/g_mixed.start")" = "e_pass.js d_refused.js b_fail.js c_crash.js a_pass.js" ] && hasF "$O" "not in the file, started first: e_pass.js"' "$W/g_mixed.start"
row "G10 grade order is glob order (a b c d e)" '[ "$(grade_order "$O")" = "a_pass.js b_fail.js c_crash.js d_refused.js e_pass.js" ]' "$O"
row "G11 GATE_TIMES_OUT written: header, then the five gates in glob order with seconds" 'times_ok "$O.times"' "$O.times"
GB="$W/gate_allpass"; mk_gate_tree "$GB"
for k in a b c; do printf "console.log('PASS 1 FAIL 0');\n" > "$GB/tests/gates/${k}_ok.js"; done
gate_run "$W/g_allpass.out" "$W/g_allpass.start" "$GB/tests/gate.sh" "$R/index.html"
O="$W/g_allpass.out"
row "G12 all-pass toy set: ALL GATES PASS, exit 0, no GATES RED line" 'rc_is "$O" 0 && hasX "$O" "ALL GATES PASS" && lacks "$O" "^GATES RED"' "$O"
row "G13 no gate_times.txt: every gate is unknown and starts in glob order" '[ "$(words "$W/g_allpass.start")" = "a_ok.js b_ok.js c_ok.js" ] && hasF "$O" "no tests/gate_times.txt: every gate is unknown"' "$O"
# Heavy slots (post-V233 s11): a gate with a pool column in gate_times.txt starts first, in the background, with
# GATE_POOL=<n>; the others go through xargs at -P max(2, JOBS - the pools). GATE_JOBS and GATE_POOL are unset for this
# run, so JOBS is gate.sh's 8 and the pool=3 toy leaves -P 5. The toys log into $CD: the heavy toy the GATE_POOL it saw,
# each light toy how many light toys were running when it started (itself included) and whether the heavy toy was.
GH="$W/gate_heavy"; mk_gate_tree "$GH"; CD="$W/gate_heavy_conc"; mkdir -p "$CD/run"
cat > "$W/light_toy.js" <<'JS'
const fs = require('fs'), path = require('path'), D = process.env.SELFTEST_CONC, me = path.basename(__filename);
fs.writeFileSync(path.join(D, 'run', me), '');
const n = fs.readdirSync(path.join(D, 'run')).length, h = fs.existsSync(path.join(D, 'heavy.run')) ? 1 : 0;
fs.appendFileSync(path.join(D, 'light.log'), me + ' ' + n + ' ' + h + '\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
fs.unlinkSync(path.join(D, 'run', me));
console.log('PASS 1 FAIL 0');
JS
for k in a b c e f g h; do cp "$W/light_toy.js" "$GH/tests/gates/${k}_light.js"; done
cat > "$GH/tests/gates/d_heavy.js" <<'JS'
const fs = require('fs'), path = require('path'), D = process.env.SELFTEST_CONC, P = process.env.GATE_POOL || '(unset)';
fs.writeFileSync(path.join(D, 'heavy.run'), '');
fs.writeFileSync(path.join(D, 'heavy.pool'), 'GATE_POOL=' + P + '\n');
console.log('toy heavy: GATE_POOL=' + P);
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2500);
fs.unlinkSync(path.join(D, 'heavy.run'));
console.log('PASS 1 FAIL 0');
JS
printf '# toy start times: d_heavy.js has the pool column and the shortest time, so only the column starts it first\na_light.js 2.0\nb_light.js 7.0\nc_light.js 4.0\nd_heavy.js 0.5 pool=3\ne_light.js 6.0\nf_light.js 1.0\ng_light.js 5.0\nh_light.js 3.0\n' > "$GH/tests/gate_times.txt"
O="$W/g_heavy.out"
run "$O" env -u GATE_JOBS -u GATE_POOL PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$W/g_heavy.start" SELFTEST_REAL_XARGS="$REAL_XARGS" SELFTEST_CONC="$CD" GATE_TIMES_OUT="$O.times" ROW_CHECK_BOOTSTRAP=1 bash "$GH/tests/gate.sh" "$R/index.html"
xargs_p() { sed -n '/^-P$/{n;p;}' "$1"; }   # the value after -P in the shim's argument log
light_ok() { # <log>: 7 lines; at most 5 light toys at once and 5 reached; at least one light toy saw the heavy toy running
  [ "$(wc -l < "$1" | tr -d ' ')" = 7 ] && [ "$(awk '$2 > m { m = $2 } END { print m + 0 }' "$1")" = 5 ] && awk '$3 == 1 { f = 1 } END { exit !f }' "$1"
}
EIGHT="a_light.js b_light.js c_light.js d_heavy.js e_light.js f_light.js g_light.js h_light.js"
graded8() { # <out>: the eight toys graded in glob order, each with its seconds, and GATE_TIMES_OUT in the same order
  [ "$(grade_order "$1")" = "$EIGHT" ] && [ "$(grep -cE '^   [a-z]_[a-z]+\.js: PASS 1 FAIL 0  [0-9]+(\.[0-9]+)? s$' "$1" || true)" = 8 ] \
    && [ "$(grep -v '^#' "$1.times" | awk '{print $1}' | tr '\n' ' ' | sed 's/ *$//')" = "$EIGHT" ]
}
row "G14 heavy slots: the pool=3 toy ran with GATE_POOL=3 in its environment" 'hasX "$CD/heavy.pool" "GATE_POOL=3"' "$O"
row "G15 it started first, in the background; xargs got only the 7 light toys, longest first, at -P 5 = max(2, 8 - 3)" '[ "$(words "$W/g_heavy.start")" = "b_light.js e_light.js g_light.js c_light.js h_light.js a_light.js f_light.js" ] && [ "$(xargs_p "$W/g_heavy.start.args")" = 5 ] && hasF "$O" "heavy slots: started first in the background: d_heavy.js GATE_POOL=3; the other 7 gates run -P 5 (max(2, GATE_JOBS 8 - pools 3))"' "$O"
row "G16 while it ran, the light toys never ran more than 5 at once (JOBS - 3), reached 5, and ran beside it" 'light_ok "$CD/light.log"' "$CD/light.log"
row "G17 grading unchanged: all 8 graded in glob order (the heavy toy 4th) with seconds, GATE_TIMES_OUT lists all 8, ALL GATES PASS, exit 0" 'rc_is "$O" 0 && hasX "$O" "ALL GATES PASS" && graded8 "$O"' "$O"
row "G18 GATE_TIMES_OUT carries the pool column over: d_heavy.js <seconds> pool=3, the 7 light toys two columns each" '[ "$(grep -cE "^d_heavy\.js [0-9]+(\.[0-9]+)? pool=3$" "$O.times" || true)" = 1 ] && [ "$(grep -cE "^[a-z]_light\.js [0-9]+(\.[0-9]+)?$" "$O.times" || true)" = 7 ]' "$O.times"
# GATE_JOBS=1 is fully serial (post-V233 A2): the pool toy runs to completion first, in the foreground, with its GATE_POOL;
# then the other toys one at a time (xargs -P 1), longest first. Each toy appends `start <toy> <GATE_POOL or -> <toys
# running, itself included>` and `end <toy>` to one log, in the order they happen.
GS="$W/gate_serial"; mk_gate_tree "$GS"; SD="$W/gate_serial_conc"; mkdir -p "$SD/run"
cat > "$W/serial_toy.js" <<'JS'
const fs = require('fs'), path = require('path'), D = process.env.SELFTEST_CONC, me = path.basename(__filename);
fs.writeFileSync(path.join(D, 'run', me), '');
fs.appendFileSync(path.join(D, 'serial.log'), 'start ' + me + ' ' + (process.env.GATE_POOL || '-') + ' ' + fs.readdirSync(path.join(D, 'run')).length + '\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
fs.unlinkSync(path.join(D, 'run', me));
fs.appendFileSync(path.join(D, 'serial.log'), 'end ' + me + '\n');
console.log('PASS 1 FAIL 0');
JS
for k in a_light b_heavy c_light; do cp "$W/serial_toy.js" "$GS/tests/gates/$k.js"; done
printf '# toy start times: b_heavy.js has the pool column; c_light.js is the longer of the other two\na_light.js 1.0\nb_heavy.js 0.5 pool=2\nc_light.js 2.0\n' > "$GS/tests/gate_times.txt"
O="$W/g_serial.out"
run "$O" env -u GATE_POOL GATE_JOBS=1 PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$W/g_serial.start" SELFTEST_REAL_XARGS="$REAL_XARGS" SELFTEST_CONC="$SD" GATE_TIMES_OUT="$O.times" ROW_CHECK_BOOTSTRAP=1 bash "$GS/tests/gate.sh" "$R/index.html"
SERIAL="start b_heavy.js 2 1|end b_heavy.js|start c_light.js - 1|end c_light.js|start a_light.js - 1|end a_light.js"
row "G19 GATE_JOBS=1 with a pool=2 toy: it ran to completion first with GATE_POOL=2, then the other two one at a time, longest first, never two at once" '[ "$(tr "\n" "|" < "$SD/serial.log" | sed "s/|$//")" = "$SERIAL" ]' "$SD/serial.log"
row "G20 at GATE_JOBS=1 xargs got the 2 other toys at -P 1, and gate.sh named the serial heavy slot" '[ "$(words "$W/g_serial.start")" = "c_light.js a_light.js" ] && [ "$(xargs_p "$W/g_serial.start.args")" = 1 ] && hasF "$O" "heavy slots: GATE_JOBS 1 is serial: b_heavy.js GATE_POOL=2 run to completion first, one at a time; the other 2 gates run -P 1"' "$O"
row "G21 grading unchanged at GATE_JOBS=1: 3 graded in glob order, ALL GATES PASS, exit 0; GATE_TIMES_OUT keeps b_heavy.js pool=2" 'rc_is "$O" 0 && hasX "$O" "ALL GATES PASS" && [ "$(grade_order "$O")" = "a_light.js b_heavy.js c_light.js" ] && [ "$(grep -cE "^b_heavy\.js [0-9]+(\.[0-9]+)? pool=2$" "$O.times" || true)" = 1 ]' "$O"

echo "== gate.sh step 4b: the row check on toy gates (manifest present, a vanished row, ROW_RULED, no manifest, BOOTSTRAP, ROW_MANIFEST_OUT)"
# Post-V233 M1b (CLAUDE.md Proof scope, Row manifest). Each toy tree holds rows.js under test and a header-only
# skip_allow.txt; r_a.js prints rows R1 and R2, r_b.js prints B1. Every manifest below is typed here from those lines.
mk_row_tree() { # <root> [manifest lines...]: no lines, no tests/row_manifest.txt
  local root="$1"; shift
  mk_gate_tree "$root"; cp "$T/rows.js" "$root/tests/"
  printf '# toy skip_allow.txt: no entries\n' > "$root/tests/skip_allow.txt"
  printf "console.log('PASS R1 one');\nconsole.log('PASS R2 two');\nconsole.log('PASS 2 FAIL 0');\n" > "$root/tests/gates/r_a.js"
  printf "console.log('  ok   B1 one');\nconsole.log('PASS 1 FAIL 0');\n" > "$root/tests/gates/r_b.js"
  if [ $# -gt 0 ]; then { echo '# toy manifest, typed by hand'; printf '%s\n' "$@"; } > "$root/tests/row_manifest.txt"; fi
}
in_order() { # <file> <fixed strings...>: each first appears on a later line than the one before it
  local f="$1" prev=0 n s; shift
  for s in "$@"; do n="$(grep -nF -m1 -- "$s" "$f" | cut -d: -f1 || true)"; [ -n "$n" ] && [ "$n" -gt "$prev" ] || return 1; prev="$n"; done
}
RM="$W/rows_match"; mk_row_tree "$RM" "r_a.js R1 once" "r_a.js R2 once" "r_b.js B1 once"
run "$W/r_match.out" bash "$RM/tests/gate.sh" "$R/index.html"
O="$W/r_match.out"
row "G22 row check, manifest present and matching: step 4b prints PASS 3 FAIL 0; ALL GATES PASS, exit 0, no GATES RED line" 'rc_is "$O" 0 && has "$O" "^== 4b\. row check" && hasX "$O" "   rows.js check: PASS 3 FAIL 0" && hasX "$O" "ALL GATES PASS" && lacks "$O" "^GATES RED"' "$O"
RV="$W/rows_vanish"; mk_row_tree "$RV" "c_fail.js C1 once" "r_a.js R1 once" "r_a.js R2 once" "r_a.js R3 once" "r_b.js B1 once"
printf "console.log('FAIL C1 toy c row, red on purpose');\nconsole.log('PASS 0 FAIL 1');\n" > "$RV/tests/gates/c_fail.js"
run "$W/r_vanish.out" bash "$RV/tests/gate.sh" "$R/index.html" "$W/base.html"
O="$W/r_vanish.out"
row "G23 a manifest row with no status line (r_a.js R3) is red at step 4b, listed with the gate reds (GATES RED 2 of 5), and step 5 still runs" 'rc_is "$O" 1 && has "$O" "^FAIL vanished r_a\.js R3 " && hasX "$O" "FAIL: row check: PASS 4 FAIL 1 (exit 1)" && hasX "$O" "GATES RED 2 of 5: c_fail.js rows.js" && in_order "$O" "== 4b. row check" "GATES RED 2 of 5" "== 5. blast-radius diff vs base.html" && lacks "$O" "^ALL GATES PASS"' "$O"
printf '%s\n' "- r_a.js R3  # toy ruling: R3 retires" > "$W/r_ruled.txt"
run "$W/r_ruled.out" env ROW_RULED="$W/r_ruled.txt" bash "$RV/tests/gate.sh" "$R/index.html"
O="$W/r_ruled.out"
row "G24 the same run with ROW_RULED explaining the vanish (- r_a.js R3): step 4b passes (PASS 5 FAIL 0), only the toy gate is red (GATES RED 1 of 5)" 'rc_is "$O" 1 && hasX "$O" "   rows.js check: PASS 5 FAIL 0" && hasX "$O" "GATES RED 1 of 5: c_fail.js" && lacks "$O" "^FAIL vanished"' "$O"
RA="$W/rows_absent"; mk_row_tree "$RA"
run "$W/r_absent.out" bash "$RA/tests/gate.sh" "$R/index.html"
O="$W/r_absent.out"
row "G25 no tests/row_manifest.txt: step 4b is red (row check: no manifest), GATES RED 1 of 4: rows.js, exit 1" 'rc_is "$O" 1 && has "$O" "^FAIL: row check: no manifest" && hasX "$O" "GATES RED 1 of 4: rows.js" && lacks "$O" "^ALL GATES PASS" && lacks "$O" "^BOOTSTRAP"' "$O"
run "$W/r_boot.out" env ROW_CHECK_BOOTSTRAP=1 ROW_MANIFEST_OUT="$W/r_boot.manifest" bash "$RA/tests/gate.sh" "$R/index.html"
O="$W/r_boot.out"
row "G26 no manifest with ROW_CHECK_BOOTSTRAP=1: a BOOTSTRAP line instead of the red; no GATES RED line, ALL GATES PASS, exit 0" 'rc_is "$O" 0 && has "$O" "^BOOTSTRAP: row check NOT RUN" && lacks "$O" "row check: no manifest" && lacks "$O" "^GATES RED" && hasX "$O" "ALL GATES PASS"' "$O"
mkdir -p "$W/r_hand"; for g in r_a r_b; do node "$RA/tests/gates/$g.js" > "$W/r_hand/$g.js.out"; done
run "$W/r_hand.manifest" node "$T/rows.js" manifest "$W/r_hand"
printf '%s\n' "r_a.js R1 once" "r_a.js R2 once" "r_b.js B1 once" > "$W/r_boot.want"
row "G27 ROW_MANIFEST_OUT written: the three typed rows, a run line naming the candidate, ia-version $CUR and the date, equal to rows.js manifest of the same outputs (run line aside); no tests/row_manifest.txt written" '[ -s "$W/r_boot.manifest" ] && [ "$(grep -v "^#" "$W/r_boot.manifest")" = "$(cat "$W/r_boot.want")" ] && hasF "$W/r_boot.manifest" "# run: candidate $R/index.html, ia-version $CUR, " && [ "$(grep -v "^# run:" "$W/r_boot.manifest")" = "$(grep -v "^# run:" "$W/r_hand.manifest")" ] && [ ! -e "$RA/tests/row_manifest.txt" ]' "$W/r_boot.manifest"
# BOOTSTRAP still checks skips and allow entries (post-V233 M1c; Mario, Message 4: the first run under the check sorts each
# skip red into a real dark row or an allowed skip). RS is a row tree with no manifest and a third toy gate, s_skip.js,
# printing S0 PASS and S1 SKIP. The manifest a bootstrapped run builds holds 5 keys (r_a.js R1 R2, r_b.js B1, s_skip.js
# S0 S1), each once, so PASS is 5 plus the allow lines that matched; m is 3 toy gates, version_scope.js and the row check.
RS="$W/rows_bootskip"; mk_row_tree "$RS"
printf "console.log('PASS S0 one');\nconsole.log('SKIP S1 the toy input file is absent');\nconsole.log('PASS 1 FAIL 0');\n" > "$RS/tests/gates/s_skip.js"
run "$W/r_bskip.out" env ROW_CHECK_BOOTSTRAP=1 bash "$RS/tests/gate.sh" "$R/index.html"
O="$W/r_bskip.out"
row "G28 BOOTSTRAP, a toy SKIP line (s_skip.js S1) with no allow entry: red at step 4b by gate and key (PASS 5 FAIL 1), GATES RED 1 of 5: rows.js, exit 1" 'rc_is "$O" 1 && has "$O" "^FAIL skip s_skip\.js S1 L2 .* SKIP with no tests/skip_allow\.txt entry" && hasX "$O" "FAIL: row check: PASS 5 FAIL 1 (exit 1)" && hasX "$O" "GATES RED 1 of 5: rows.js" && lacks "$O" "^ALL GATES PASS"' "$O"
printf '%s\n' "# toy skip_allow.txt" "s_skip.js S1  # toy: the input file is absent" > "$RS/tests/skip_allow.txt"
run "$W/r_ballow.out" env ROW_CHECK_BOOTSTRAP=1 bash "$RS/tests/gate.sh" "$R/index.html"
O="$W/r_ballow.out"
row "G29 the same BOOTSTRAP run with its allow entry: step 4b ran and passes (PASS 6 FAIL 0), ALL GATES PASS, exit 0, no GATES RED and no FAIL line" 'rc_is "$O" 0 && hasX "$O" "   rows.js check: PASS 6 FAIL 0" && hasX "$O" "ALL GATES PASS" && lacks "$O" "^GATES RED" && lacks "$O" "^FAIL"' "$O"
printf '%s\n' "# toy skip_allow.txt" "s_skip.js S1  # toy: the input file is absent" "r_a.js R1  # toy: R1 never skips" "r_b.js B1" > "$RS/tests/skip_allow.txt"
run "$W/r_bstale.out" env ROW_CHECK_BOOTSTRAP=1 bash "$RS/tests/gate.sh" "$R/index.html"
O="$W/r_bstale.out"
row "G30 BOOTSTRAP with a stale allow entry (r_a.js R1 prints PASS) and one with no cause (r_b.js B1): each red by line (PASS 6 FAIL 2), GATES RED 1 of 5: rows.js, exit 1" 'rc_is "$O" 1 && has "$O" "^FAIL stale allow line 3: r_a\.js R1  # toy: R1 never skips .* matched no SKIP" && has "$O" "^FAIL allow line 4: r_b\.js B1 .* no cause" && hasX "$O" "FAIL: row check: PASS 6 FAIL 2 (exit 1)" && hasX "$O" "GATES RED 1 of 5: rows.js"' "$O"
boot_lines() { has "$1" "^BOOTSTRAP: row check NOT RUN against a manifest" && has "$1" "^BOOTSTRAP: the skip check RUNS" && has "$1" "^BOOTSTRAP: gatekeeper writes the first tests/row_manifest\.txt" && lacks "$1" "row check: no manifest"; }
row "G31 the loud BOOTSTRAP lines still print on every bootstrapped run, red or green (G28, G29, G30), and say the skip check runs" 'boot_lines "$W/r_bskip.out" && boot_lines "$W/r_ballow.out" && boot_lines "$W/r_bstale.out"' "$W/r_bskip.out"

# =====================================================================================================================
echo "== version_scope.js: the repo tree, then a toy tree (planted row, over a debt count, stale debt)"
VR="$W/vs_repo/tests"; mkdir -p "$VR"
cp -R "$R/tests/gates" "$VR/gates"; cp "$T/version_scope.js" "$VR/"; cp "$R/tests/version_scope_debt.txt" "$VR/"
NG="$(ls "$VR/gates" | grep -c '\.js$' || true)"
run "$W/v_repo.out" node "$VR/version_scope.js"
row "V1 the repo's gates against the repo's debt file: PASS $NG FAIL 0 (one row per gate)" 'rc_is "$W/v_repo.out" 0 && hasX "$W/v_repo.out" "PASS $NG FAIL 0"' "$W/v_repo.out"
VT="$W/vs_toy/tests"; mkdir -p "$VT/gates" "$W/vs_toy/orig"; cp "$T/version_scope.js" "$VT/"
HDR="const IA = { version: '$CUR' }, VER = +IA.version;"
printf '%s\nif (VER >= %s) console.log("a minimum, not a hit");\n' "$HDR" "$CUR" > "$VT/gates/clean.js"
printf '%s\nif (VER === %s) console.log("one exact row");\n' "$HDR" "$CUR" > "$VT/gates/debt1.js"
printf '%s\nif (VER === %s) console.log("first exact row");\nif (VER !== %s) console.log("second exact row");\n' "$HDR" "$CUR" "$NEXT" > "$VT/gates/debt2.js"
printf '# toy debt file\ndebt1.js 1  # toy: one hit\ndebt2.js 2  # toy: two hits\n' > "$VT/version_scope_debt.txt"
cp "$VT/gates/"*.js "$W/vs_toy/orig/"
run "$W/v_toy.out" node "$VT/version_scope.js"
row "V2 toy tree at its debt (one clean gate, two at their counts): PASS 3 FAIL 0" 'rc_is "$W/v_toy.out" 0 && hasX "$W/v_toy.out" "PASS 3 FAIL 0"' "$W/v_toy.out"
printf 'if (VER === %s) console.log("planted");\n' "$NEXT" >> "$VT/gates/clean.js"
run "$W/v_plant.out" node "$VT/version_scope.js"; cp "$W/vs_toy/orig/clean.js" "$VT/gates/"
row "V3 a row planted in the clean gate is a new exact-version row, red by name" 'rc_is "$W/v_plant.out" 1 && has "$W/v_plant.out" "^FAIL new exact-version row: clean\.js has 1 exact-version hit and no debt line" && hasX "$W/v_plant.out" "PASS 2 FAIL 1"' "$W/v_plant.out"
printf 'if (VER === %s) console.log("planted");\n' "$NEXT" >> "$VT/gates/debt1.js"
run "$W/v_over.out" node "$VT/version_scope.js"; cp "$W/vs_toy/orig/debt1.js" "$VT/gates/"
row "V4 one hit over a debt count is red by name" 'rc_is "$W/v_over.out" 1 && has "$W/v_over.out" "^FAIL new exact-version row: debt1\.js has 2 exact-version hits, its debt line says 1" && hasX "$W/v_over.out" "PASS 2 FAIL 1"' "$W/v_over.out"
printf '%s\nif (VER === %s) console.log("first exact row");\nif (VER >= %s) console.log("now a minimum");\n' "$HDR" "$CUR" "$NEXT" > "$VT/gates/debt2.js"
run "$W/v_stale.out" node "$VT/version_scope.js"; cp "$W/vs_toy/orig/debt2.js" "$VT/gates/"
row "V5 one hit removed under a debt line is stale debt, red by name" 'rc_is "$W/v_stale.out" 1 && hasX "$W/v_stale.out" "FAIL stale debt: debt2.js now 1, lower the line" && hasX "$W/v_stale.out" "PASS 2 FAIL 1"' "$W/v_stale.out"

# =====================================================================================================================
echo "== era_bump.py: a scratch git tree of tests/harness.js + tests/gates (V$CUR rows present, V$NEXT written)"
# The 11 row-per-version tables (measure mT section 1; CLAUDE.md Proof scope, Era rows). A table added or retired is a
# ruling, and this list moves with it.
TABLES='tests/harness.js MANNY_DIGEST_BY_VERSION
tests/harness.js MANNY_DELOAD_OFF_DIGEST_BY_VERSION
tests/harness.js MANNY_CORE_OFF_DIGEST_BY_VERSION
tests/gates/g193_samecard.js OPEN_UNRULED_BY_VERSION
tests/gates/g197b_sweep.js HF_LEAK_BY_VERSION
tests/gates/g197b_sweep.js B5C_BY_VERSION
tests/gates/g199_deload_arbitration.js DELOAD_ARB_BY_VERSION
tests/gates/g199_deload_arbitration.js E6_BY_VERSION
tests/gates/g199_deload_arbitration.js DELOAD_HINGE_BY_VERSION
tests/gates/g200_pull_arbitration.js SWAP_BY_VERSION
tests/gates/g219_samecard_draws.js ERA'
ER="$W/era"; mkdir -p "$ER/tests"
cp -R "$R/tests/gates" "$ER/tests/gates"; cp "$R/tests/harness.js" "$ER/tests/"; cp "$T/era_bump.py" "$ER/tests/"
gitc() { git -c user.name=selftest -c user.email=selftest@invalid -c commit.gpgsign=false -c core.hooksPath=/dev/null -c init.defaultBranch=main "$@"; }
gitc -C "$ER" init -q; gitc -C "$ER" add -A; gitc -C "$ER" commit -q -m "tooling self-test: the tree before the era bump"
printf 'tooling self-test scratch ruling: V%s moves no table\n' "$NEXT" > "$W/ruling.md"
EB="$ER/tests/era_bump.py"
every_table() { # <file> <ERE with @F (file) @S (table)>: a line matches it for each of the 11 tables
  local f s pat
  while read -r f s; do
    pat="$(printf '%s' "$2" | sed -e "s#@F#$f#g" -e "s#@S#$s#g")"
    has "$1" "$pat" || return 1
  done <<EOF
$TABLES
EOF
}
tree_clean() { [ -z "$(git -C "$ER" status --porcelain)" ]; }
added_is() { [ "$(git -C "$ER" diff --numstat | awk '{a += $1; d += $2} END {print a + 0 " " d + 0}')" = "$1 0" ]; }
run "$W/e_check.out" python3 "$EB" --check "$CUR"
row "E1 --check $CUR: all 11 tables present, 0 unregistered, exit 0" 'rc_is "$W/e_check.out" 0 && every_table "$W/e_check.out" "^present +@F +@S\[$CUR\] line [0-9]+$" && hasX "$W/e_check.out" "era_bump --check $CUR: 11 present, 0 missing or duplicate, 0 unregistered"' "$W/e_check.out"
run "$W/e_dry.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md" --dry-run
row "E2 $NEXT --dry-run: 11 rows planned, nothing written" 'rc_is "$W/e_dry.out" 0 && hasX "$W/e_dry.out" "era_bump V$NEXT: DRY RUN, 11 row(s) in 6 file(s) would be written; 0 moved; nothing written" && every_table "$W/e_dry.out" "^WOULD +@F +@S\[$NEXT\] = @S\[$CUR\]  after line [0-9]+$" && tree_clean' "$W/e_dry.out"
run "$W/e_moved.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md" --moved MANNY_DIGEST_BY_VERSION
git -C "$ER" diff > "$W/e_moved.diff"
row "E3 $NEXT --moved MANNY_DIGEST_BY_VERSION: writes 10, the moved table is left to builder" 'rc_is "$W/e_moved.out" 0 && hasX "$W/e_moved.out" "era_bump V$NEXT: wrote 10 row(s) in 6 file(s); 1 moved (ruling $W/ruling.md)" && has "$W/e_moved.out" "^MOVED +tests/harness\.js +MANNY_DIGEST_BY_VERSION\[$NEXT\]: not written" && added_is 10 && lacks "$W/e_moved.diff" "MANNY_DIGEST_BY_VERSION\[$NEXT\]"' "$W/e_moved.out"
git -C "$ER" checkout -q -- .
run "$W/e_bump.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md"
git -C "$ER" diff -U0 > "$W/e_bump.diff"
row "E4 $NEXT: writes 11 rows, each [$NEXT] = [$CUR] in its own file, nothing removed" 'rc_is "$W/e_bump.out" 0 && hasX "$W/e_bump.out" "era_bump V$NEXT: wrote 11 row(s) in 6 file(s); 0 moved (ruling $W/ruling.md)" && added_is 11 && every_table "$W/e_bump.diff" "^\+[[:space:]]*@S\[$NEXT\] = @S\[$CUR\];   // era_bump V$NEXT: ruled UNMOVED, reference to \[$CUR\]; "' "$W/e_bump.out"
run "$W/e_check2.out" python3 "$EB" --check "$NEXT"
row "E5 the bumped tree reads --check $NEXT: 11 present, exit 0" 'rc_is "$W/e_check2.out" 0 && hasX "$W/e_check2.out" "era_bump --check $NEXT: 11 present, 0 missing or duplicate, 0 unregistered"' "$W/e_check2.out"
D0="$(git -C "$ER" diff | shasum)"
run "$W/e_rerun.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md"
row "E6 a second $NEXT run refuses every table and writes nothing (exit 2)" 'rc_is "$W/e_rerun.out" 2 && hasX "$W/e_rerun.out" "era_bump V$NEXT: REFUSED, 11 refusal(s); no file written" && [ "$(grep -c "already exists" "$W/e_rerun.out" || true)" = 11 ] && [ "$(git -C "$ER" diff | shasum)" = "$D0" ]' "$W/e_rerun.out"
run "$W/e_eod.out" python3 "$EB" --era-only-diff HEAD
row "E7 --era-only-diff HEAD after the bump: 6 era-only, 0 edited" 'rc_is "$W/e_eod.out" 0 && hasX "$W/e_eod.out" "era_bump --era-only-diff HEAD: 6 era-only, 0 edited"' "$W/e_eod.out"
printf '// a non-era line, tooling self-test\n' >> "$ER/tests/gates/g219_samecard_draws.js"
run "$W/e_eod2.out" python3 "$EB" --era-only-diff HEAD
row "E8 one non-era line flips that gate to edited" 'rc_is "$W/e_eod2.out" 0 && has "$W/e_eod2.out" "^edited +tests/gates/g219_samecard_draws\.js +\(non-era line at [0-9]+\)$" && hasX "$W/e_eod2.out" "era_bump --era-only-diff HEAD: 5 era-only, 1 edited"' "$W/e_eod2.out"

# =====================================================================================================================
echo "== sabotage.py: --anchors-only on index.html, then the survivors list on a toy spec and toy gate"
SB="$W/sab/tests"; mkdir -p "$SB"
cp "$T/sabotage.py" "$SB/"; cp -R "$R/tests/sabotage" "$SB/sabotage"
SAB="$SB/sabotage.py"; KN="$SB/sabotage/known_not_applied.txt"
run "$W/s_anchors.out" python3 "$SAB" --anchors-only "$R/index.html"
row "S1 --anchors-only index.html: exit 0, the NOT-APPLIED are exactly the documented list" 'rc_is "$W/s_anchors.out" 0 && oracle anchors-exact "$W/s_anchors.out" "$KN"' "$W/s_anchors.out"
oracle pick-live "$R/index.html" "$SB/sabotage" "$KN" "$W/cand_anchor_edited.html" "$W/live.spec" "$W/live.name"
LSP="$(cat "$W/live.spec")"; LNM="$(cat "$W/live.name")"
run "$W/s_edited.out" python3 "$SAB" --anchors-only "$W/cand_anchor_edited.html"
row "S2 a live anchor edited in the candidate: undocumented NOT-APPLIED by spec and name, exit 1" 'rc_is "$W/s_edited.out" 1 && hasF "$W/s_edited.out" "NOT-APPLIED  UNDOCUMENTED  $LSP  $LNM  (anchor count=0)"' "$W/s_edited.out"
oracle drop-first "$KN" "$W/known_missing.txt" "$W/missing.spec" "$W/missing.name"
MSP="$(cat "$W/missing.spec")"; MNM="$(cat "$W/missing.name")"
run "$W/s_missing.out" python3 "$SAB" --anchors-only "$R/index.html" --known "$W/known_missing.txt"
row "S3 a known list missing a line: that mutation is undocumented, exit 1" 'rc_is "$W/s_missing.out" 1 && hasF "$W/s_missing.out" "NOT-APPLIED  UNDOCUMENTED  $MSP  $MNM  ("' "$W/s_missing.out"
{ cat "$KN"; printf '\n%s %s  # tooling self-test: this anchor applies today\n' "$LSP" "$LNM"; } > "$W/known_stale.txt"
KL="$(wc -l < "$W/known_stale.txt" | tr -d ' ')"
run "$W/s_stale.out" python3 "$SAB" --anchors-only "$R/index.html" --known "$W/known_stale.txt"
row "S4 a known line whose anchor applies is STALE, exit 1" 'rc_is "$W/s_stale.out" 1 && hasF "$W/s_stale.out" "STALE        known list line $KL: $LSP  $LNM  (documented NOT-APPLIED, but its anchor now applies"' "$W/s_stale.out"
TY="$W/sab_toy"; mkdir -p "$TY"
printf "const s = require('fs').readFileSync(process.argv[2], 'utf8');\nif (s.includes('BROKEN')) { console.log('  FAIL toy gate: the candidate is broken'); console.log('PASS 0 FAIL 1'); }\nelse console.log('PASS 1 FAIL 0');\n" > "$TY/toy_gate.js"
printf '<p>alpha beta gamma</p>\n' > "$TY/cand.html"
oracle toy-spec "$TY/toy_gate.js" "$TY/toy_spec.json"
printf '# toy known list\ntoy_spec.json T3 -> delta is gone from the toy candidate, so this never applies  # toy: documented NOT-APPLIED\n' > "$TY/known.txt"
S2L='toy_spec.json T2 -> beta is renamed, the toy gate cannot see it  # toy: survives by design'
printf '# toy survivors\n%s\n' "$S2L" > "$TY/surv_ok.txt"
printf '# toy survivors: none\n' > "$TY/surv_none.txt"
printf '# toy survivors\n%s\ntoy_spec.json T1 -> alpha breaks, the toy gate trips  # toy: listed, but it trips\n' "$S2L" > "$TY/surv_trips.txt"
printf '# toy survivors\n%s\ntoy_spec.json T3 -> delta is gone from the toy candidate, so this never applies  # toy: listed, never applies\n' "$S2L" > "$TY/surv_noapply.txt"
printf '# toy survivors\n%s\ntoy_spec.json T9 -> no such mutation  # toy: names nothing\n' "$S2L" > "$TY/surv_noname.txt"
for s in ok none trips noapply noname; do
  run "$W/s_surv_$s.out" python3 "$SAB" --gates toy_gate "$TY/cand.html" "$TY/toy_spec.json" --known "$TY/known.txt" --survivors "$TY/surv_$s.txt"
done
O="$W/s_surv_ok.out"
row "S5 --gates on the toy: T1 trips, the listed T2 is a documented survivor, T3 documented NOT-APPLIED, exit 0" 'rc_is "$O" 0 && has "$O" "^TRIPPED +toy_spec\.json  T1 " && has "$O" "^SURVIVED +toy_spec\.json  T2 .*\(documented survivor\)$" && has "$O" "^NOT-APPLIED +toy_spec\.json  T3 .*\(documented\)$"' "$O"
O="$W/s_surv_none.out"
row "S6 the same survivor unlisted fails the run (its row carries no documented tag)" 'rc_is "$O" 1 && has "$O" "^SURVIVED +toy_spec\.json  T2 .*  toy_gate\.js PASS 1 FAIL 0$"' "$O"
O="$W/s_surv_trips.out"
row "S7 a listed survivor that trips is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T1 -> alpha breaks, the toy gate trips  (documented SURVIVED, but it now trips;"' "$O"
O="$W/s_surv_noapply.out"
row "S8 a listed survivor whose anchor no longer applies is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T3 -> delta is gone from the toy candidate, so this never applies  (documented SURVIVED, but it now does not apply;"' "$O"
O="$W/s_surv_noname.out"
row "S9 a survivors line naming no mutation is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T9 -> no such mutation  (no mutation of that name in toy_spec.json;"' "$O"
# Heavy mutations (post-V233 s11): a mutation whose gate has a pool column in gate_times.txt runs after the others, one
# at a time, with GATE_POOL=<SABOTAGE_JOBS> (unset here, so 8); the others run JOBS-wide with no GATE_POOL. Both toy
# gates log each run's start (with the GATE_POOL it saw) and its end to one file, in the order they happen.
printf '# toy times: heavy_gate.js runs workers of its own\nheavy_gate.js 1.0 pool=3\nlight_gate.js 1.0\n' > "$SB/gate_times.txt"
cat > "$TY/heavy_gate.js" <<'JS'
const fs = require('fs'), s = fs.readFileSync(process.argv[2], 'utf8'), L = process.env.SELFTEST_SABLOG;
const t = (s.match(/BROKEN-([A-Z0-9]+)/) || [null, '?'])[1];
fs.appendFileSync(L, 'start ' + t + ' ' + (process.env.GATE_POOL || '-') + '\n');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, t[0] === 'H' ? 300 : 800);
fs.appendFileSync(L, 'end ' + t + '\n');
console.log('  FAIL toy: ' + t + ' broke the candidate'); console.log('PASS 0 FAIL 1');
JS
cp "$TY/heavy_gate.js" "$TY/light_gate.js"
printf '<p>alpha beta gamma delta epsilon</p>\n' > "$TY/hcand.html"
oracle heavy-spec "$TY/heavy_gate.js" "$TY/light_gate.js" "$TY/heavy_spec.json"
printf '# toy known list: none\n' > "$TY/known_none.txt"
run "$W/s_heavy_plain.out" env -u SABOTAGE_JOBS -u GATE_POOL SELFTEST_SABLOG="$W/s_heavy_plain.log" python3 "$SAB" "$TY/hcand.html" "$TY/heavy_spec.json"
run "$W/s_heavy_gates.out" env -u SABOTAGE_JOBS -u GATE_POOL SELFTEST_SABLOG="$W/s_heavy_gates.log" python3 "$SAB" --gates heavy_gate,light_gate "$TY/hcand.html" "$TY/heavy_spec.json" --known "$TY/known_none.txt" --survivors "$TY/surv_none.txt"
rep_order() { sed -nE 's/^TRIPPED +(heavy_spec\.json  )?([HL][0-9]) -> .*/\2/p' "$1" | tr '\n' ' ' | sed 's/ *$//'; }
O="$W/s_heavy_plain.out"
row "S10 plain sabotage.py, toy spec: the pool-column gate's H1, H2 ran after L1 L2 L3, one at a time, with GATE_POOL=8; L1 L2 L3 ran together with none" 'oracle heavy-order "$W/s_heavy_plain.log" 8' "$W/s_heavy_plain.log"
row "S11 plain: the report stays in spec order (H1 L1 H2 L2 L3), all 5 TRIPPED, exit 0" 'rc_is "$O" 0 && [ "$(rep_order "$O")" = "H1 L1 H2 L2 L3" ] && hasX "$O" "SABOTAGE tripped=5 survived=0 not_applied=0 crash=0 of 5"' "$O"
O="$W/s_heavy_gates.out"
row "S12 --gates, same toy spec: the same run order and GATE_POOL=8, the report in spec order, exit 0" 'oracle heavy-order "$W/s_heavy_gates.log" 8 && rc_is "$O" 0 && [ "$(rep_order "$O")" = "H1 L1 H2 L2 L3" ]' "$O"

# =====================================================================================================================
echo "== chain.js: a clean clone at HEAD (its gate.sh and harness.js are HEAD's), fixtures from the tags V232 and V233"
CL="$W/clone"
git clone -q --shared "$R" "$CL"
cp "$T/chain.js" "$T/era_bump.py" "$CL/tests/"
git -C "$R" show V232:index.html > "$W/V232.html"
git -C "$R" show V233:index.html > "$W/V233.html"
oracle chain-cands "$W/V233.html" "$W/cand_getprograms.html" "$W/cand_const.html" "$W/const.line"
CLINE="$(cat "$W/const.line")"
run "$W/c_bump.out" node "$CL/tests/chain.js" "$W/V232.html" "$W/V233.html"
O="$W/c_bump.out"
row "C1 V232 -> V233: the meta line is a VERSION BUMP, no OUTSIDE hunk, VERDICT LOCAL (mechanical)" 'rc_is "$O" 0 && hasX "$O" "VERSION BUMP hunks 1" && has "$O" "^  VERSION BUMP \(gate\.sh step 0\)  base L[0-9]+ V232  cand L[0-9]+ V233$" && hasX "$O" "OUTSIDE A FUNCTION hunks 0" && has "$O" "^VERDICT LOCAL \(mechanical\)"' "$O"
run "$W/c_getprograms.out" node "$CL/tests/chain.js" "$W/V233.html" "$W/cand_getprograms.html"
O="$W/c_getprograms.out"
row "C2 an edit inside getPrograms: one CHANGED function, VERDICT CROSS-CUTTING on its reach" 'rc_is "$O" 0 && hasX "$O" "FUNCTIONS changed 1, added 0, removed 0" && has "$O" "^  CHANGED  getPrograms  executed by [0-9]+ gates in the map$" && hasX "$O" "OUTSIDE A FUNCTION hunks 0" && has "$O" "^VERDICT CROSS-CUTTING: getPrograms executed by [0-9]+ gates \(> 20\)$"' "$O"
run "$W/c_const.out" node "$CL/tests/chain.js" "$W/V233.html" "$W/cand_const.html"
O="$W/c_const.out"
row "C3 an edited top-level const: OUTSIDE A FUNCTION, VERDICT CROSS-CUTTING" 'rc_is "$O" 0 && hasX "$O" "FUNCTIONS changed 0, added 0, removed 0" && hasX "$O" "VERSION BUMP hunks 0" && hasX "$O" "OUTSIDE A FUNCTION hunks 1" && has "$O" "^    \+ L[0-9]+ $CLINE" && hasX "$O" "VERDICT CROSS-CUTTING: 1 OUTSIDE A FUNCTION hunk(s)"' "$O"

# =====================================================================================================================
echo "== status.js and rows.js: toy gates through the helper, then toy outputs (every legacy grammar, a manifest, check)"
# Post-V233 slice M1a (CLAUDE.md Proof scope, Version scope and Row manifest). The toy gates sit in tests/gates/ of a toy
# tree beside a copy of status.js, so they require it as a real gate does: require('../status'). Every expected line
# below is typed from the ruling and the helper's documented line forms, never read back from the tool.
RW="$W/rows"
mkdir -p "$RW/tests/gates"
cp "$T/status.js" "$RW/tests/status.js"
cat > "$RW/tests/gates/st_dark.js" <<'JS'
const S = require('../status')('st_dark');
S.declare(['A1', 'A2', 'A3']);
S.pass('A1', 'first');
S.fail('A2', 'second', 'why');
S.summary();
JS
cat > "$RW/tests/gates/st_twice.js" <<'JS'
const S = require('../status')('st_twice');
S.declare(['A1']);
S.pass('A1', 'once');
S.pass('A1', 'twice');
S.summary();
JS
cat > "$RW/tests/gates/st_loop.js" <<'JS'
const S = require('../status')('st_loop');
S.declare(['L1', 'L2', 'L3', 'S1', 'S2']);
const a = S.loop('L1', 'five subs'); for (const k of ['a', 'b', 'c', 'd', 'e']) a.check(true, k); a.done();
const b = S.loop('L2', 'four subs'); b.check(true, 'a'); b.check(false, 'b', 'x'); b.check(true, 'c'); b.check(false, 'd'); b.done();
const c = S.loop('L3', 'empty loop'); c.done();
S.skip('S1', 'input missing');
S.scoped('S2', 'no candidate pair');
S.summary();
JS
cat > "$RW/tests/gates/st_clean.js" <<'JS'
const S = require('../status')('st_clean');
S.declare(['G1', 'G2.1', 'd194-x']);
S.pass('G1', 'one');
S.check('G2.1', 1 + 1 === 2, 'two');
S.skip('d194-x', 'the input file is missing');
S.summary();
JS
cat > "$RW/tests/gates/st_badid.js" <<'JS'
const S = require('../status')('st_badid');
S.declare(['row q']);
S.pass('row q', 'never printed');
S.summary();
JS
for g in st_dark st_twice st_loop st_clean st_badid; do run "$W/h_$g.out" node "$RW/tests/gates/$g.js"; done
O="$W/h_st_dark.out"
row "H1 status.js: a declared id with no status line is FAIL by name; PASS 1 FAIL 2, exit 1" 'rc_is "$O" 1 && hasX "$O" "PASS A1 first" && hasX "$O" "FAIL A2 second — why" && hasX "$O" "FAIL A3 declared, no status line (a dark row)" && hasX "$O" "PASS 1 FAIL 2"' "$O"
O="$W/h_st_twice.out"
row "H2 status.js: one id printed twice is FAIL by name; PASS 2 FAIL 1, exit 1" 'rc_is "$O" 1 && hasX "$O" "FAIL A1 printed 2 status lines (one row, one line)" && hasX "$O" "PASS 2 FAIL 1"' "$O"
O="$W/h_st_loop.out"
row "H3 status.js: a loop row prints ONE line (n of n; k of n failed with the first failures; a zero-run loop is FAIL)" 'hasX "$O" "PASS L1 five subs (5 of 5)" && hasX "$O" "FAIL L2 four subs — 2 of 4 failed: b (x); d" && hasX "$O" "FAIL L3 empty loop — the loop ran 0 times: no sub-result, a dark row" && [ "$(grep -c " L1 " "$O")" = 1 ] && [ "$(grep -c " L2 " "$O")" = 1 ] && hasX "$O" "PASS 1 FAIL 2" && rc_is "$O" 1' "$O"
row "H4 status.js: SKIP and SCOPED OUT print canonical lines; a clean gate is PASS 2 FAIL 0, exit 0" 'hasX "$W/h_st_loop.out" "SKIP S1 input missing" && hasX "$W/h_st_loop.out" "SCOPED OUT S2 no candidate pair" && rc_is "$W/h_st_clean.out" 0 && hasX "$W/h_st_clean.out" "PASS G1 one" && hasX "$W/h_st_clean.out" "PASS G2.1 two" && hasX "$W/h_st_clean.out" "SKIP d194-x the input file is missing" && hasX "$W/h_st_clean.out" "PASS 2 FAIL 0"' "$W/h_st_clean.out"
O="$W/h_st_badid.out"
row "H5 status.js: an id outside the grammar crashes the gate (exit not 0, no summary)" '! rc_is "$O" 0 && lacks "$O" "^PASS [0-9]+ FAIL [0-9]+" && hasF "$O" "outside the id grammar"' "$O"
run "$W/h_parse.out" node "$T/rows.js" parse st_loop "$W/h_st_loop.out"
printf '%s\n' "ROW L1 PASS L1" "ROW L2 FAIL L2" "ROW L3 FAIL L3" "ROW S1 SKIP L4" "ROW S2 SCOPED OUT L5" > "$W/h_parse.want"
O="$W/h_parse.out"
row "H6 rows.js parse reads the status.js output exactly: five rows, keys and statuses as printed, nothing unkeyed" 'rc_is "$O" 0 && [ "$(grep "^ROW " "$O")" = "$(cat "$W/h_parse.want")" ] && lacks "$O" "^UNKEYED" && hasX "$O" "parse st_loop.js: status lines 5, keyed 5 in 5 keys (0 many), unkeyed 0, sub-lines 0, tags INFO 1, summary yes"' "$O"

# rows.js parse on one toy output holding every legacy grammar measure mR found.
cat > "$W/m_legacy.out" <<'OUT'
PASS A1 col0 pass
FAIL A2 col0 fail
  ok   B1 indented ok
  FAIL B2 indented fail
ok   C1 col0 ok
pass  D1 lowercase pass
SKIP E1 skipped, input missing
SCOPED OUT E2 scoped out
SKIP I2c: RETIRED at some point
PASS row d193-k row prefixed
    a4-dedupe a4-dedupe-ver ok :: a sub-line, not a row
INFO an info line
PASS no id-like token here
some prose
PASS 9 FAIL 2
OUT
printf '%s\n' "ROW A1 PASS L1" "ROW A2 FAIL L2" "ROW B1 PASS L3" "ROW B2 FAIL L4" "ROW C1 PASS L5" "ROW D1 PASS L6" "ROW E1 SKIP L7" "ROW E2 SCOPED OUT L8" "ROW I2c SKIP L9" "ROW d193-k PASS L10" > "$W/m_legacy.want"
run "$W/m_parse.out" node "$T/rows.js" parse legacy "$W/m_legacy.out"
O="$W/m_parse.out"
row "M1 rows.js parse: every legacy grammar keyed (col-0 PASS/FAIL, indented ok/FAIL, col-0 ok, pass, SKIP, SCOPED OUT, RETIRED, row prefix); sub-line, INFO and prose are not rows; the id-less line is UNKEYED" 'rc_is "$O" 0 && [ "$(grep "^ROW " "$O")" = "$(cat "$W/m_legacy.want")" ] && [ "$(grep -c "^UNKEYED" "$O")" = 1 ] && hasX "$O" "UNKEYED PASS L13: PASS no id-like token here" && hasX "$O" "parse legacy.js: status lines 11, keyed 10 in 10 keys (0 many), unkeyed 1, sub-lines 1, tags INFO 1, summary yes"' "$O"

# A toy run: a.js (A1, A2 once; L1 a loop row; S1 a SKIP) and b.js (B1, B2 indented ok). Each variant is run0 with one
# line added or removed.
mkrun() { mkdir -p "$1"; printf '%s\n' "PASS A1 one" "PASS A2 two" "PASS L1 loop row x" "PASS L1 loop row y" "SKIP S1 input missing" > "$1/a.js.out"; printf '%s\n' "  ok   B1 one" "  ok   B2 two" > "$1/b.js.out"; }
mkrun "$W/run0"
printf '%s\n' "a.js A1 once" "a.js A2 once" "a.js L1 many" "a.js S1 once" "b.js B1 once" "b.js B2 once" > "$W/m_manifest.want"
run "$W/m_manifest.txt" node "$T/rows.js" manifest "$W/run0" --run "toy run0"
O="$W/m_manifest.txt"
row "M2 rows.js manifest: a generated header naming the run, then one sorted <gate> <key> <once|many> line per key" 'rc_is "$O" 0 && [ "$(grep -v "^#" "$O")" = "$(cat "$W/m_manifest.want")" ] && has "$O" "^# .*GENERATED" && hasX "$O" "# run: toy run0"' "$O"
printf '%s\n' "# toy allow file" "a.js S1  # toy: the input file is missing" > "$W/m_allow.txt"
chk() { local out="$1"; shift; run "$out" node "$T/rows.js" check "$W/m_manifest.txt" "$@"; }
chk "$W/m_round.out" "$W/run0" --allow "$W/m_allow.txt"
row "M3 rows.js check: the run against its own manifest, its SKIP allowed: PASS 7 FAIL 0, exit 0" 'rc_is "$W/m_round.out" 0 && hasX "$W/m_round.out" "PASS 7 FAIL 0"' "$W/m_round.out"
mkrun "$W/run1"; grep -v "A2" "$W/run1/a.js.out" > "$W/run1/a.tmp"; mv "$W/run1/a.tmp" "$W/run1/a.js.out"
chk "$W/m_vanish.out" "$W/run1" --allow "$W/m_allow.txt"
row "M4 check: a manifest key with no status line is red as vanished" 'rc_is "$W/m_vanish.out" 1 && has "$W/m_vanish.out" "^FAIL vanished a\.js A2 " && hasX "$W/m_vanish.out" "PASS 6 FAIL 1"' "$W/m_vanish.out"
printf '%s\n' "- a.js A2  # toy ruling: A2 retires" > "$W/m_ruled_rm.txt"
chk "$W/m_vanish_ruled.out" "$W/run1" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_rm.txt"
row "M5 check: the same vanish with a ruled \`- a.js A2\` line passes: PASS 7 FAIL 0, exit 0" 'rc_is "$W/m_vanish_ruled.out" 0 && hasX "$W/m_vanish_ruled.out" "PASS 7 FAIL 0"' "$W/m_vanish_ruled.out"
mkrun "$W/run2"; echo "PASS A1 again" >> "$W/run2/a.js.out"
chk "$W/m_dup.out" "$W/run2" --allow "$W/m_allow.txt"
printf '%s\n' "~ a.js A1  # toy ruling: A1 becomes a loop row" > "$W/m_ruled_ar.txt"
chk "$W/m_dup_ruled.out" "$W/run2" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_ar.txt"
row "M6 check: once -> many unruled (an arity-once key printing twice) is red as a duplicate; with a ruled \`~\` line it passes" 'rc_is "$W/m_dup.out" 1 && has "$W/m_dup.out" "^FAIL duplicate a\.js A1 .* printed 2 status lines, manifest arity once" && rc_is "$W/m_dup_ruled.out" 0 && hasX "$W/m_dup_ruled.out" "PASS 7 FAIL 0"' "$W/m_dup.out"
mkrun "$W/run3"; echo "PASS L1 loop row z" >> "$W/run3/a.js.out"
chk "$W/m_many.out" "$W/run3" --allow "$W/m_allow.txt"
row "M7 check: an arity-many key moving from 2 lines to 3 is silent (no FAIL, no line naming it): PASS 7 FAIL 0" 'rc_is "$W/m_many.out" 0 && hasX "$W/m_many.out" "PASS 7 FAIL 0" && lacks "$W/m_many.out" " L1"' "$W/m_many.out"
mkrun "$W/run4"; grep -v "loop row y" "$W/run4/a.js.out" > "$W/run4/a.tmp"; mv "$W/run4/a.tmp" "$W/run4/a.js.out"
chk "$W/m_once.out" "$W/run4" --allow "$W/m_allow.txt"
row "M8 check: many -> once unruled (a loop row printing one line) is red" 'rc_is "$W/m_once.out" 1 && has "$W/m_once.out" "^FAIL arity a\.js L1 .* printed 1 status line, manifest arity many"' "$W/m_once.out"
chk "$W/m_noallow.out" "$W/run0"
row "M9 check: a SKIP line with no allow entry is red by gate and key" 'rc_is "$W/m_noallow.out" 1 && has "$W/m_noallow.out" "^FAIL skip a\.js S1 L5 .* SKIP with no tests/skip_allow\.txt entry" && hasX "$W/m_noallow.out" "PASS 6 FAIL 1"' "$W/m_noallow.out"
printf '%s\n' "a.js S1  # toy: the input file is missing" "a.js *  # every row" "b.js B1" > "$W/m_allow_bad.txt"
chk "$W/m_blanket.out" "$W/run0" --allow "$W/m_allow_bad.txt"
row "M10 check: a blanket allow entry (wildcard) and an entry with no cause are red" 'rc_is "$W/m_blanket.out" 1 && has "$W/m_blanket.out" "^FAIL allow line 2: a\.js \*  # every row .* blanket entry" && has "$W/m_blanket.out" "^FAIL allow line 3: b\.js B1 .* no cause"' "$W/m_blanket.out"
printf '%s\n' "a.js S1  # toy: the input file is missing" "b.js B2  # toy: nothing skips here" > "$W/m_allow_stale.txt"
chk "$W/m_stale.out" "$W/run0" --allow "$W/m_allow_stale.txt"
row "M11 check: an allow entry that matched no SKIP or SCOPED OUT line is red as stale" 'rc_is "$W/m_stale.out" 1 && has "$W/m_stale.out" "^FAIL stale allow line 2: b\.js B2 .* matched no SKIP or SCOPED OUT line" && hasX "$W/m_stale.out" "PASS 7 FAIL 1"' "$W/m_stale.out"
mkrun "$W/run5"; echo "PASS N1 a new row" >> "$W/run5/b.js.out"
chk "$W/m_new.out" "$W/run5" --allow "$W/m_allow.txt"
row "M12 check: an unruled added key is red as new" 'rc_is "$W/m_new.out" 1 && has "$W/m_new.out" "^FAIL new b\.js N1 " && hasX "$W/m_new.out" "PASS 7 FAIL 1"' "$W/m_new.out"
printf '%s\n' "+ b.js N1  # toy ruling: N1 joins" > "$W/m_ruled_add.txt"
chk "$W/m_new_ruled.out" "$W/run5" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_add.txt"
row "M13 check: the same key with a ruled \`+ b.js N1\` line passes: PASS 8 FAIL 0, exit 0" 'rc_is "$W/m_new_ruled.out" 0 && hasX "$W/m_new_ruled.out" "PASS 8 FAIL 0"' "$W/m_new_ruled.out"
printf '%s\n' "+ b.js N9  # toy: a pre-licence for a row that never prints" "- a.js A1  # toy: a removal that did not happen" > "$W/m_ruled_stale.txt"
chk "$W/m_ruled_stale.out" "$W/run0" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_stale.txt"
row "M14 check: a ruled line that matches no actual change is red as stale (an add that never prints, a removal of a row still printing)" 'rc_is "$W/m_ruled_stale.out" 1 && has "$W/m_ruled_stale.out" "^FAIL stale ruled line 1: \+ b\.js N9 " && has "$W/m_ruled_stale.out" "^FAIL stale ruled line 2: - a\.js A1 " && hasX "$W/m_ruled_stale.out" "PASS 7 FAIL 2"' "$W/m_ruled_stale.out"

# Fallback keys (post-V233 M1b): a status line with no id-like key is keyed L:<first 8 hex of sha256(normalized label)>.
# The normalized labels are typed here from the documented masks (quoted -> <q>, clock -> <t>, digits -> <n>), and the
# keys come from python's hashlib on those typed labels, never from rows.js. fb_b is fb_a with every digit, quoted value
# and clock value changed; fb_c is fb_a with one word changed in each of its first two lines.
fb_key() { python3 -c 'import hashlib, sys; print("L:" + hashlib.sha256(sys.argv[1].encode("utf-8")).hexdigest()[:8])' "$1"; }
mkdir -p "$W/fb_a" "$W/fb_b" "$W/fb_c"
printf '%s\n' "PASS cells checked 12 of 12 in 3.4 s at 12:34:56" "  ok the \"mario\" week holds, digest 'ab12'" "FAIL rows differ: 2" "PASS 2 FAIL 1" > "$W/fb_a/fb.js.out"
printf '%s\n' "PASS cells checked 40 of 40 in 17.9 s at 03:01:02" "  ok the \"manny\" week holds, digest 'ff99'" "FAIL rows differ: 7" "PASS 2 FAIL 1" > "$W/fb_b/fb.js.out"
printf '%s\n' "PASS cells counted 12 of 12 in 3.4 s at 12:34:56" "  ok the \"mario\" month holds, digest 'ab12'" "FAIL rows differ: 2" "PASS 2 FAIL 1" > "$W/fb_c/fb.js.out"
FA1="cells checked <n> of <n> in <t> at <t>"; FA2="the <q> week holds, digest <q>"; FA3="rows differ: <n>"
FC1="cells counted <n> of <n> in <t> at <t>"; FC2="the <q> month holds, digest <q>"
KA1="$(fb_key "$FA1")"; KA2="$(fb_key "$FA2")"; KA3="$(fb_key "$FA3")"; KC1="$(fb_key "$FC1")"; KC2="$(fb_key "$FC2")"
printf '%s\n' "FALLBACK $KA1 PASS L1  # $FA1" "FALLBACK $KA2 PASS L2  # $FA2" "FALLBACK $KA3 FAIL L3  # $FA3" > "$W/fb_a.want"
printf '%s\n' "FALLBACK $KC1 PASS L1  # $FC1" "FALLBACK $KC2 PASS L2  # $FC2" "FALLBACK $KA3 FAIL L3  # $FA3" > "$W/fb_c.want"
for v in a b c; do run "$W/fb_parse_$v.out" node "$T/rows.js" parse fb "$W/fb_$v/fb.js.out"; done
row "M15 fallback keys: each id-less status line is keyed L:<8 hex of sha256(its normalized label)>, the same when only digits, quoted values and clock values change, a new key when a word changes" 'rc_is "$W/fb_parse_a.out" 0 && [ "$(grep "^FALLBACK " "$W/fb_parse_a.out")" = "$(cat "$W/fb_a.want")" ] && [ "$(grep "^FALLBACK " "$W/fb_parse_b.out")" = "$(cat "$W/fb_a.want")" ] && [ "$(grep "^FALLBACK " "$W/fb_parse_c.out")" = "$(cat "$W/fb_c.want")" ] && [ "$KA1" != "$KC1" ] && [ "$KA2" != "$KC2" ]' "$W/fb_parse_a.out"
run "$W/fb_manifest.txt" node "$T/rows.js" manifest "$W/fb_a"
printf '%s\n' "fb.js $KA1 once  # $FA1" "fb.js $KA2 once  # $FA2" "fb.js $KA3 once  # $FA3" | LC_ALL=C sort > "$W/fb_manifest.want"
run "$W/fb_check_b.out" node "$T/rows.js" check "$W/fb_manifest.txt" "$W/fb_b"
run "$W/fb_check_c.out" node "$T/rows.js" check "$W/fb_manifest.txt" "$W/fb_c"
row "M16 fallback keys enter the manifest with the label after #; fb_b checks clean against fb_a's manifest (PASS 3 FAIL 0); fb_c is 2 vanished and 2 new (PASS 1 FAIL 4)" 'rc_is "$W/fb_manifest.txt" 0 && [ "$(grep -v "^#" "$W/fb_manifest.txt")" = "$(cat "$W/fb_manifest.want")" ] && rc_is "$W/fb_check_b.out" 0 && hasX "$W/fb_check_b.out" "PASS 3 FAIL 0" && rc_is "$W/fb_check_c.out" 1 && has "$W/fb_check_c.out" "^FAIL vanished fb\.js $KA1 " && has "$W/fb_check_c.out" "^FAIL vanished fb\.js $KA2 " && has "$W/fb_check_c.out" "^FAIL new fb\.js $KC1 " && has "$W/fb_check_c.out" "^FAIL new fb\.js $KC2 " && hasX "$W/fb_check_c.out" "PASS 1 FAIL 4"' "$W/fb_check_c.out"
mkdir -p "$W/na_run"
printf '%s\n' "PASS Q0 one" "N/A Q1 no candidate pair at this config" "NOT APPLICABLE Q2 the input is absent" "  DEFER Q3 waits on the input file" "PASS 1 FAIL 0" > "$W/na_run/na.js.out"
run "$W/na_manifest.txt" node "$T/rows.js" manifest "$W/na_run"
printf '%s\n' "na.js Q0 once" "na.js Q1 once" "na.js Q2 once" "na.js Q3 once" > "$W/na_manifest.want"
run "$W/na_noallow.out" node "$T/rows.js" check "$W/na_manifest.txt" "$W/na_run"
printf '%s\n' "na.js Q1  # toy: no candidate pair" "na.js Q2  # toy: the input file is absent" "na.js Q3  # toy: the input file is absent" > "$W/na_allow.txt"
run "$W/na_allow.out" node "$T/rows.js" check "$W/na_manifest.txt" "$W/na_run" --allow "$W/na_allow.txt"
row "M17 N/A, NOT APPLICABLE and DEFER lines are skip statuses: rows in the manifest, each red by key with no allow entry (PASS 4 FAIL 3), clean when allowed (PASS 7 FAIL 0)" '[ "$(grep -v "^#" "$W/na_manifest.txt")" = "$(cat "$W/na_manifest.want")" ] && rc_is "$W/na_noallow.out" 1 && has "$W/na_noallow.out" "^FAIL skip na\.js Q1 L2 .* N/A with no tests/skip_allow\.txt entry" && has "$W/na_noallow.out" "^FAIL skip na\.js Q2 L3 .* NOT APPLICABLE with no tests/skip_allow\.txt entry" && has "$W/na_noallow.out" "^FAIL skip na\.js Q3 L4 .* DEFER with no tests/skip_allow\.txt entry" && hasX "$W/na_noallow.out" "PASS 4 FAIL 3" && rc_is "$W/na_allow.out" 0 && hasX "$W/na_allow.out" "PASS 7 FAIL 0"' "$W/na_noallow.out"
mkdir -p "$W/vc_run"
printf '%s\n' "SKIP S1 a" "SKIP S2 b" "SKIP S3 c" "SKIP S4 d" "SKIP S5 e" "PASS 0 FAIL 0" > "$W/vc_run/vc.js.out"
run "$W/vc_manifest.txt" node "$T/rows.js" manifest "$W/vc_run"
printf '%s\n' "vc.js S1  # skipped since V233" "vc.js S2  # build 233 has no fixture" "vc.js S3  # the ia-version predates the input" "vc.js S4  # an era row not yet bumped" "vc.js S5  # the input file is missing" > "$W/vc_allow.txt"
run "$W/vc_check.out" node "$T/rows.js" check "$W/vc_manifest.txt" "$W/vc_run" --allow "$W/vc_allow.txt"
row "M18 an allow cause naming a version (V233, the build number 233, ia-version, era) is red by line; the cause naming the missing input is not" 'rc_is "$W/vc_check.out" 1 && hasF "$W/vc_check.out" "FAIL allow line 1: vc.js S1  # skipped since V233 — the cause names a version" && hasF "$W/vc_check.out" "FAIL allow line 2: vc.js S2  # build 233 has no fixture — the cause names a version" && hasF "$W/vc_check.out" "FAIL allow line 3: vc.js S3  # the ia-version predates the input — the cause names a version" && hasF "$W/vc_check.out" "FAIL allow line 4: vc.js S4  # an era row not yet bumped — the cause names a version" && lacks "$W/vc_check.out" "allow line 5" && lacks "$W/vc_check.out" "^FAIL skip vc\.js S5 "' "$W/vc_check.out"
# Tallies (post-V233 F1, the session call on measure mSK): a status word followed only by counts is a gate's closing
# count line, not a row. tl.js prints one PASS row, a SKIP row with a cause (P9), two count lines with extra label text
# (rows: keys 3 and 0), then three bare count lines (L5, L6, and L8 after a blank line). Every expected line is typed.
mkdir -p "$W/tl_run"
printf '%s\n' "PASS T1 one" "SKIP P9: some cause" "SKIP 3 cells: the input file is missing" "SCOPED OUT 0  SKIP 0  NOT YET BUILT 0  swim card" "SKIP 3" "SCOPED OUT 0  SKIP 0  NOT YET BUILT 0" "" "SKIP 0" "PASS 1 FAIL 0" > "$W/tl_run/tl.js.out"
printf '%s\n' "ROW T1 PASS L1" "ROW P9 SKIP L2" "ROW 3 SKIP L3" "ROW 0 SCOPED OUT L4" > "$W/tl_rows.want"
printf '%s\n' "TALLY SKIP L5: SKIP 3" "TALLY SCOPED OUT L6: SCOPED OUT 0  SKIP 0  NOT YET BUILT 0" "TALLY SKIP L8: SKIP 0" > "$W/tl_tally.want"
run "$W/tl_parse.out" node "$T/rows.js" parse tl "$W/tl_run/tl.js.out"
O="$W/tl_parse.out"
row "M19 rows.js parse: SKIP 3, SCOPED OUT 0  SKIP 0  NOT YET BUILT 0 and SKIP 0 (after a blank line) are TALLY, not rows; SKIP P9: some cause and both count lines with extra label text stay rows" 'rc_is "$O" 0 && [ "$(grep "^ROW " "$O")" = "$(cat "$W/tl_rows.want")" ] && [ "$(grep "^TALLY " "$O")" = "$(cat "$W/tl_tally.want")" ] && lacks "$O" "^(UNKEYED|FALLBACK) " && hasX "$O" "parse tl.js: status lines 4, keyed 4 in 4 keys (0 many), unkeyed 0, sub-lines 0, tags none, summary yes" && hasX "$O" "tally tl.js: 3 count line(s) read as tallies (a status word followed only by counts): not rows, never keyed or checked"' "$O"
run "$W/tl_manifest.txt" node "$T/rows.js" manifest "$W/tl_run"
printf '%s\n' "tl.js 0 once" "tl.js 3 once" "tl.js P9 once" "tl.js T1 once" > "$W/tl_manifest.want"
run "$W/tl_check.out" node "$T/rows.js" check "$W/tl_manifest.txt" "$W/tl_run"
O="$W/tl_check.out"
row "M20 rows.js manifest holds no tally key; check with no allow entry: the three tallies are not red, P9 and the two count lines with extra text are red skips by key (PASS 4 FAIL 3)" 'rc_is "$W/tl_manifest.txt" 0 && [ "$(grep -v "^#" "$W/tl_manifest.txt")" = "$(cat "$W/tl_manifest.want")" ] && rc_is "$O" 1 && has "$O" "^FAIL skip tl\.js P9 L2 .* SKIP with no tests/skip_allow\.txt entry" && has "$O" "^FAIL skip tl\.js 3 L3 .* SKIP with no tests/skip_allow\.txt entry" && has "$O" "^FAIL skip tl\.js 0 L4 .* SCOPED OUT with no tests/skip_allow\.txt entry" && [ "$(grep -c "^FAIL" "$O")" = 3 ] && hasX "$O" "INFO tally lines (a status word followed only by counts), not rows, never keyed or checked: 3 in 1 gates" && hasX "$O" "PASS 4 FAIL 3"' "$O"

# =====================================================================================================================
echo "== the repo"
repo_files "$W/repo_files.after"
find "$R" \( -path "$R/.git" -o -path "$R/.claude" \) -prune -o -type f ! -name .DS_Store -newer "$W/.start" -print > "$W/x_newer.txt"
row "X1 no file under the repo (.git and .claude aside) was created, deleted or modified by this run" 'cmp -s "$W/repo_files.before" "$W/repo_files.after" && [ ! -s "$W/x_newer.txt" ]' "$W/x_newer.txt"

echo "selftest wall $(( $(date +%s) - T0 )) s (run dir $W)"
echo "PASS $P FAIL $F"
if [ "$F" -gt 0 ]; then exit 1; fi
