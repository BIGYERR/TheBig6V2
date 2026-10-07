#!/usr/bin/env python3
"""Post-V233 tooling pass, slice 11: heavy-gate slots. Tests only; index.html is not touched, no version bump.

  T-v  g230_d194_lens2.js: POOL = G230_POOL, else GATE_POOL, else 4 (HEAD's default before slice 7; never 0)
  T-w  gate.sh step 4: a gate with a pool column starts first, in the background, with GATE_POOL=<n>; the rest run
       through xargs at -P max(2, JOBS - sum of pools) (-P JOBS exactly when no gate has a pool column)
  T-x  sabotage.py: in every mode a mutation whose gate has a pool column runs after the others, one at a time, with
       GATE_POOL=<SABOTAGE_JOBS>; the report stays in spec order
  T-y  gate_times.txt: the optional third column pool=<n>; g230 gets pool=6
  T-z  tooling_selftest.sh: rows G14-G17 (T-w) and S10-S12 (T-x)

Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(ROOT, *a)
FILES = {k: P('tests', *k.split('/')) for k in (
    'gates/g230_d194_lens2.js', 'gate.sh', 'gate_times.txt', 'sabotage.py', 'tooling_selftest.sh')}
TEXT = {k: open(v, encoding='utf-8').read() for k, v in FILES.items()}

def rep(key, old, new):
    n = TEXT[key].count(old)
    if n != 1:
        print(f'ABORT: {key}: anchor count {n}, want 1:\n{old[:300]}')
        sys.exit(1)
    TEXT[key] = TEXT[key].replace(old, new)

# ---- T-v: g230 POOL ------------------------------------------------------------------------------------------------
G = 'gates/g230_d194_lens2.js'
rep(G, r"""// RUNTIME. Jobs run in a pool of POOL worker processes: G230_POOL when it is a positive integer, else the machine's core
//   count (os.cpus().length, never 0; post-V233, Mario), printed as "pool N": the 7 lattice enumerations first,
""", r"""// RUNTIME. Jobs run in a pool of POOL worker processes: G230_POOL when it is a positive integer, else GATE_POOL when it
//   is one (tests/gate.sh sets it from this gate's pool column in tests/gate_times.txt, tests/sabotage.py to its
//   SABOTAGE_JOBS), else 4 (HEAD's default before slice 7; never 0; post-V233 s11: slice 7's core-count default
//   multiplied with GATE_JOBS and SABOTAGE_JOBS), printed as "pool N": the 7 lattice enumerations first,
""")
rep(G, r"""const POOL = /^[1-9][0-9]*$/.test(process.env.G230_POOL || '') ? +process.env.G230_POOL : Math.max(1, (os.cpus() || []).length),
""", r"""const POOL = /^[1-9][0-9]*$/.test(process.env.G230_POOL || '') ? +process.env.G230_POOL
    : /^[1-9][0-9]*$/.test(process.env.GATE_POOL || '') ? +process.env.GATE_POOL : 4,
""")

# ---- T-y: gate_times.txt pool column -------------------------------------------------------------------------------
T = 'gate_times.txt'
rep(T, r"""# Gate start order for tests/gate.sh step 4: `<gate file> <seconds>` per line; `#` lines are comments.
""", r"""# Gate start order for tests/gate.sh step 4: `<gate file> <seconds> [pool=<n>]` per line; `#` lines are comments.
""")
rep(T, r"""# every other gate is its T1 time (v233 gate phase, 8 jobs) x 0.432, mSG's median alone/T1 ratio.
""", r"""# every other gate is its T1 time (v233 gate phase, 8 jobs) x 0.432, mSG's median alone/T1 ratio.
# pool=<n> (post-V233 s11; Mario: parallelize first): the gate runs <n> worker processes of its own (g230 only). gate.sh
# starts it first, in the background, with GATE_POOL=<n>, and runs the other gates at -P max(2, GATE_JOBS - the sum of
# the pools); sabotage.py runs its mutations after the others, one at a time, with GATE_POOL=<SABOTAGE_JOBS>. A third
# column that is not pool=<positive integer>, or a fourth column, is a CONFIGURATION error in both. The column is set
# here by hand, not measured: GATE_TIMES_OUT writes seconds only, so a refresh from it carries every pool=<n> over.
""")
rep(T, "g230_d194_lens2.js 1064.0\n", "g230_d194_lens2.js 1064.0 pool=6\n")

# ---- T-w: gate.sh step 4 heavy slots -------------------------------------------------------------------------------
S = 'gate.sh'
rep(S, r"""  # and the weekly full run refreshes gate_times.txt from that file.
""", r"""  # and the weekly full run refreshes gate_times.txt from that file.
  #
  # HEAVY SLOTS (post-V233 s11; Mario: parallelize first, trim only what is still over). A gate with a third column
  # `pool=<n>` in gate_times.txt runs <n> worker processes of its own (g230 today). It starts FIRST, in the background,
  # with GATE_POOL=<n> in its environment; the other gates go through xargs at -P max(2, JOBS - the sum of those pools),
  # so its workers and the other gates share the JOBS slots instead of multiplying (slice 7's core-count pool under -P 8
  # reached load 65). With no pool column xargs runs at -P JOBS exactly as before. A third column that is not
  # pool=<positive integer>, or a fourth column, is a CONFIGURATION error. Grading, RED, the per-gate seconds and
  # GATE_TIMES_OUT read the same result files in the same glob order as before.
""")
rep(S, r"""  rm -rf "$TMP/gateout" "$TMP/gatelist" "$TMP/globlist" "$TMP/startkeys" "$TMP/rungate.sh" "$TMP/times.out"   # delete artifacts before regenerating them
""", r"""  rm -rf "$TMP/gateout" "$TMP/gatelist" "$TMP/globlist" "$TMP/startkeys" "$TMP/rungate.sh" "$TMP/times.out" "$TMP/pools" "$TMP/heavy" "$TMP/lightlist"   # delete artifacts before regenerating them
""")
rep(S, r"""  cut -f4- "$TMP/startkeys" | tr '\n' '\0' > "$TMP/gatelist"
  GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" \
    xargs -0 -n 1 -P "$JOBS" "$TMP/rungate.sh" < "$TMP/gatelist"
""", r"""  # HEAVY SLOTS (see above). pools: <gate> TAB <n> per pool-column line, or BAD TAB <line>.
  awk -v tf="$TIMES" 'BEGIN { while ((getline l < tf) > 0) { n = split(l, f, " "); if (n < 3 || f[1] ~ /^#/) continue
      if (n == 3 && f[3] ~ /^pool=[1-9][0-9]*$/) printf "%s\t%s\n", f[1], substr(f[3], 6); else printf "BAD\t%s\n", l } }' > "$TMP/pools"
  BADP="$(awk -F'\t' '$1 == "BAD" { print $2 }' "$TMP/pools")"
  if [ -n "$BADP" ]; then echo "FAIL: CONFIG: tests/gate_times.txt: a third column must be pool=<positive integer>, and nothing follows it; got: $BADP"; exit 1; fi
  : > "$TMP/heavy"; : > "$TMP/lightlist"
  awk -F'\t' -v pf="$TMP/pools" -v hv="$TMP/heavy" -v lt="$TMP/lightlist" '
    BEGIN { while ((getline l < pf) > 0) { split(l, p, "\t"); PL[p[1]] = p[2] } }
    { b = $4; sub(/.*\//, "", b); if (b in PL) printf "%s\t%s\n", PL[b], $4 > hv; else print $4 > lt }' "$TMP/startkeys"
  HSUM=0; HPIDS=(); HNAMES=""
  while IFS=$'\t' read -r HP HG; do
    GATE_POOL="$HP" GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" "$TMP/rungate.sh" "$HG" < /dev/null &
    HPIDS+=("$!"); HSUM=$(( HSUM + HP )); HNAMES="$HNAMES${HNAMES:+, }$(basename "$HG") GATE_POOL=$HP"
  done < "$TMP/heavy"
  LP="$JOBS"
  if [ "$HSUM" -gt 0 ]; then
    LP=$(( JOBS - HSUM )); if [ "$LP" -lt 2 ]; then LP=2; fi
    echo "   heavy slots: started first in the background: $HNAMES; the other $(wc -l < "$TMP/lightlist" | tr -d ' ') gates run -P $LP (max(2, GATE_JOBS $JOBS - pools $HSUM))"
  fi
  tr '\n' '\0' < "$TMP/lightlist" > "$TMP/gatelist"
  if [ -s "$TMP/gatelist" ]; then
    GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" \
      xargs -0 -n 1 -P "$LP" "$TMP/rungate.sh" < "$TMP/gatelist"
  fi
  for HPID in ${HPIDS[@]+"${HPIDS[@]}"}; do wait "$HPID" || true; done   # the worker always exits 0; the grader reads its files
""")

# ---- T-x: sabotage.py heavy mutations last and serial ---------------------------------------------------------------
B = 'sabotage.py'
rep(B, r"""    CONFIGURATION error and exits 2 before any mutation runs, never clamped
""", r"""    CONFIGURATION error and exits 2 before any mutation runs, never clamped
  - a mutation whose gate has a pool column in tests/gate_times.txt (`<gate> <seconds> pool=<n>`: the gate
    runs workers of its own, g230 today) runs AFTER the others, one at a time, with GATE_POOL=<SABOTAGE_JOBS>
    in its environment, in every mode (post-V233 s11). The report stays in spec order, so it reads the same as
    when every mutation ran JOBS-wide. A third column that is not pool=<positive integer> exits 2 (CONFIG)
""")
rep(B, r"""def run_gate(gate, html):
    gate = os.path.abspath(gate)
    r = subprocess.run(['node', gate, html], capture_output=True, text=True)
""", r"""def run_gate(gate, html, env=None):
    gate = os.path.abspath(gate)
    r = subprocess.run(['node', gate, html], capture_output=True, text=True, env=env)
""")
rep(B, r"""def run_mutation(src, here, i, m, td):
""", r"""def run_mutation(src, here, i, m, td, pool=None):
""")
rep(B, r"""        status, p, f, out = run_gate(gate, path)
""", r"""        status, p, f, out = run_gate(gate, path, None if pool is None else dict(os.environ, GATE_POOL=str(pool)))
""")
rep(B, r"""def trip(src, sel, known, surv, gone=()):
""", r'''GATE_TIMES =os.path.join(HERE, 'gate_times.txt')   # post-V233 s11: its pool column marks a gate with workers of its own

def gate_pools(path=GATE_TIMES):
    """{gate basename: n} for every `<gate> <seconds> pool=<n>` line (post-V233 s11). No file means no such gate. A
    third column that is not pool=<positive integer>, or a fourth column, is a CONFIG error, as in gate.sh step 4."""
    if not os.path.isfile(path):
        return {}
    pools = {}
    for k, raw in enumerate(open(path, encoding='utf-8').read().split('\n'), 1):
        f = raw.split()
        if len(f) < 3 or f[0].startswith('#'):
            continue
        if len(f) != 3 or not re.fullmatch(r'pool=[1-9][0-9]*', f[2]):
            config_exit(f'{os.path.relpath(path, ROOT)} line {k}: a third column must be pool=<positive integer>, '
                        f'and nothing follows it; got: {raw.strip()}')
        pools[f[0]] = int(f[2][5:])
    return pools

def heavy_pool(m, pools):
    """The pool column of the mutation's gate, else None. A malformed row is light here and CRASHes in run_mutation
    exactly as before."""
    g = m.get('gate') if isinstance(m, dict) else None
    return pools.get(os.path.basename(g)) if isinstance(g, str) else None

def run_all(src, here, todo, td):
    """run_mutation over todo = [(i, mutation)]; the results in no fixed order (every caller sorts them by i). The light
    mutations run JOBS-wide; then each mutation whose gate has a pool column runs, one at a time in todo order, with
    GATE_POOL=JOBS (post-V233 s11): that gate's own workers must not multiply with JOBS mutations at once."""
    pools = gate_pools()
    light = [(i, m) for i, m in todo if heavy_pool(m, pools) is None]
    heavy = [(i, m) for i, m in todo if heavy_pool(m, pools) is not None]
    with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
        done = [fu.result() for fu in [pool.submit(run_mutation, src, here, i, m, td) for i, m in light]]
    for i, m in heavy:
        done.append(run_mutation(src, here, i, m, td, pool=JOBS))
    return done

def trip(src, sel, known, surv, gone=()):
''')
rep(B, r"""        with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
            done = [fu.result() for fu in [pool.submit(run_mutation, src, HERE, k, row[2], td)
                                           for k, row in enumerate(sel)]]
""", r"""        done = run_all(src, HERE, [(k, row[2]) for k, row in enumerate(sel)], td)   # pool-column gates last, serial
""")
rep(B, r"""    def run_one(i, m, td):
        return run_mutation(src, here, i, m, td)

    with tempfile.TemporaryDirectory() as td:
        with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
            done = [fu.result() for fu in [pool.submit(run_one, i, m, td) for i, m in enumerate(muts)]]
""", r"""    # A mutation whose gate has a pool column in tests/gate_times.txt runs after the others, one at a time, with
    # GATE_POOL=JOBS (run_all; post-V233 s11). The print below is in spec order, so the report does not move.
    with tempfile.TemporaryDirectory() as td:
        done = run_all(src, here, list(enumerate(muts)), td)
""")

# ---- T-z: self-test rows -------------------------------------------------------------------------------------------
Z = 'tooling_selftest.sh'
rep(Z, r"""# its jobs in input order) and then execs the real xargs with the same arguments and the same input.
""", r"""# its jobs in input order) and then execs the real xargs with the same arguments and the same input. It also writes those
# arguments, one per line, to <log>.args, so a row can read the -P gate.sh chose.
""")
rep(Z, r"""cat > "$SELFTEST_XARGS_LOG.raw"
""", r"""printf '%s\n' "$@" > "$SELFTEST_XARGS_LOG.args"
cat > "$SELFTEST_XARGS_LOG.raw"
""")
rep(Z, r"""row "G13 no gate_times.txt: every gate is unknown and starts in glob order" '[ "$(words "$W/g_allpass.start")" = "a_ok.js b_ok.js c_ok.js" ] && hasF "$O" "no tests/gate_times.txt: every gate is unknown"' "$O"
""", r"""row "G13 no gate_times.txt: every gate is unknown and starts in glob order" '[ "$(words "$W/g_allpass.start")" = "a_ok.js b_ok.js c_ok.js" ] && hasF "$O" "no tests/gate_times.txt: every gate is unknown"' "$O"
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
run "$O" env -u GATE_JOBS -u GATE_POOL PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$W/g_heavy.start" SELFTEST_REAL_XARGS="$REAL_XARGS" SELFTEST_CONC="$CD" GATE_TIMES_OUT="$O.times" bash "$GH/tests/gate.sh" "$R/index.html"
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
""")
rep(Z, r"""    sys.exit(0)
sys.exit(2)
PY
""", r"""    sys.exit(0)
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
""")
rep(Z, r"""row "S9 a survivors line naming no mutation is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T9 -> no such mutation  (no mutation of that name in toy_spec.json;"' "$O"
""", r"""row "S9 a survivors line naming no mutation is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T9 -> no such mutation  (no mutation of that name in toy_spec.json;"' "$O"
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
""")

for k, v in FILES.items():
    open(v, 'w', encoding='utf-8').write(TEXT[k])
print('post_v233_s11_heavy_slots: wrote ' + ', '.join(FILES))
