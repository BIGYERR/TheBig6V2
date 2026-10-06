#!/usr/bin/env python3
"""Post-V233 measure S: the sabotage sweep's own history, V190-V233 (record + git, not the engine).

    python3 tests/measure/v233_sabotage_history.py <scratch> meta   # git, anchor history, record snippets
    python3 tests/measure/v233_sabotage_history.py <scratch> run    # re-run the V221 trio (+controls) on tag trees

Oracles: tag dates from git; "what changed" from `git diff --name-only` between tags; NOT-APPLIED from
str.count(anchor) on each tag's own index.html (the runner's count==1 rule, recomputed, not read from any
report); TRIPPED/SURVIVED only from each tag tree's own tests/sabotage.py run on that tag's index.html.
Writes only under <scratch>.
"""
import json, os, re, subprocess, sys, datetime, collections
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
S = os.path.abspath(sys.argv[1]); MODE = sys.argv[2]
os.makedirs(S, exist_ok=True)
def git(*a, binary=False):
    r = subprocess.run(['git', '-C', REPO] + list(a), capture_output=True)
    if r.returncode: raise RuntimeError('git ' + ' '.join(a) + ': ' + r.stderr.decode()[:300])
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')
TAGS = ['V%d' % n for n in range(190, 234)]
def tdate(t): return datetime.datetime.fromisoformat(git('log', '-1', '--format=%aI', t).strip())

def meta():
    out = open(os.path.join(S, 'meta.out'), 'w')
    P = lambda *a: print(*a, file=out)
    D = {t: tdate(t) for t in TAGS}
    span = (D['V233'] - D['V190']).total_seconds() / 86400
    P('BUILDS V190..V233 = %d tags; span %.2f days; intervals %d; builds/week %.2f' % (len(TAGS), span, len(TAGS) - 1, (len(TAGS) - 1) / span * 7))
    # per-ISO-week counts
    wk = collections.Counter(D[t].isocalendar()[1] for t in TAGS)
    P('builds per ISO week:', dict(sorted(wk.items())))
    # per-interval change classes
    rows = {}
    trig = 0
    for i in range(1, len(TAGS)):
        a, b = TAGS[i - 1], TAGS[i]
        names = git('diff', '--name-status', a, b, '--', 'tests/gates', 'tests/harness.js', 'tests/sabotage', 'tests/sabotage.py', 'tests/gate.sh', 'index.html').split('\n')
        names = [n.split('\t') for n in names if n.strip()]
        g_add = [n[-1] for n in names if n[-1].startswith('tests/gates/') and n[0].startswith('A')]
        g_mod = [n[-1] for n in names if n[-1].startswith('tests/gates/') and not n[0].startswith('A')]
        harn = any(n[-1] == 'tests/harness.js' for n in names)
        sab = [n[-1] for n in names if n[-1].startswith('tests/sabotage')]
        html = any(n[-1] == 'index.html' for n in names)
        commits = git('log', '--format=%h %s', a + '..' + b).strip().split('\n')
        tests_only = [c for c in commits if not re.match(r'^\w+ V\d+:', c)]
        rows[b] = dict(g_add=len(g_add), g_mod=len(g_mod), harn=harn, sab=len(sab), html=html,
                       gap_h=(D[b] - D[a]).total_seconds() / 3600, mods=g_mod, nontag=tests_only)
        trig += (len(g_add) + len(g_mod)) > 0
        P('%s  +%.1fh  gates add %d mod %d  harness %s  sabotage-files %d  index.html %s  interim-commits %s  mod: %s' % (
            b, rows[b]['gap_h'], len(g_add), len(g_mod), 'Y' if harn else '-', len(sab), 'Y' if html else '-',
            tests_only, ','.join(os.path.basename(x) for x in g_mod)[:300]))
    P('intervals where a tests/gates file was added or edited: %d / %d; harness.js edited: %d / %d; index.html changed: %d / %d' % (
        trig, len(TAGS) - 1, sum(r['harn'] for r in rows.values()), len(TAGS) - 1, sum(r['html'] for r in rows.values()), len(TAGS) - 1))
    P('intervals with NO gate add/edit:', [t for t, r in rows.items() if r['g_add'] + r['g_mod'] == 0])
    json.dump({t: {k: v for k, v in r.items()} for t, r in rows.items()}, open(os.path.join(S, 'intervals.json'), 'w'), indent=1, default=str)

    # anchor history: spec@T-1 vs html@T-1 and html@T; spec@T vs html@T
    htmls = {t: git('show', t + ':index.html', binary=True).decode('utf-8') for t in TAGS}
    def specs(t):
        fs = [f for f in git('ls-tree', '--name-only', t, 'tests/sabotage/').split('\n') if f.endswith('.json')]
        o = {}
        for f in fs:
            try: o[os.path.basename(f)] = json.loads(git('show', t + ':' + f))
            except Exception as e: o[os.path.basename(f)] = 'PARSE ' + str(e)[:80]
        return o
    SP = {t: specs(t) for t in TAGS}
    def applies(m, h): return h.count(m['anchor']) == 1
    ev = []
    na_state = {}
    for i, t in enumerate(TAGS):
        na = []; tot = 0
        for f, ms in SP[t].items():
            if not isinstance(ms, list): na.append((f, 'PARSE')); continue
            for k, m in enumerate(ms):
                tot += 1
                if not applies(m, htmls[t]): na.append((f, m['name'][:60]))
        na_state[t] = (tot, len(SP[t]), na)
        P('STATE %s specs %d mutations %d not-applied(own spec on own html) %d: %s' % (t, len(SP[t]), tot, len(na), na))
        if i == 0: continue
        p = TAGS[i - 1]
        for f, ms in SP[p].items():
            if not isinstance(ms, list): continue
            for k, m in enumerate(ms):
                if applies(m, htmls[p]) and not applies(m, htmls[t]):
                    cur = SP[t].get(f)
                    same = None
                    if isinstance(cur, list):
                        same = next((x for x in cur if x['name'] == m['name']), cur[k] if k < len(cur) else None)
                    fixed = same is not None and applies(same, htmls[t])
                    r = rows[t]
                    ev.append(dict(tag=t, spec=f, name=m['name'][:70], count=htmls[t].count(m['anchor']), fixed_same_build=fixed,
                                   spec_changed=(same is not None and same.get('anchor') != m['anchor']),
                                   gates_changed=(r['g_add'] + r['g_mod']) > 0, gate_mod=r['g_mod'], harness=r['harn'],
                                   named_gate_changed=os.path.basename(m['gate']) in [os.path.basename(x) for x in r['mods']], gate=m['gate']))
    P('\nDRIFT EVENTS (mutation applied on T-1 html, NOT-APPLIED on T html with the T-1 spec): %d' % len(ev))
    for e in ev: P('DRIFT', json.dumps(e))
    c = collections.Counter((e['fixed_same_build'], e['gates_changed']) for e in ev)
    P('drift by (re-anchored in same build, gates added/edited same build):', dict(c))
    P('drift builds:', dict(collections.Counter(e['tag'] for e in ev)))
    json.dump(ev, open(os.path.join(S, 'drift.json'), 'w'), indent=1)
    # first tag each final-debt NOT-APPLIED mutation was not-applied, and its creation tag
    fin = na_state['V233'][2]
    P('\nV233 not-applied (own spec, own html): %d' % len(fin))
    for f, nm in fin:
        hist = []
        for t in TAGS:
            ms = SP[t].get(f)
            if not isinstance(ms, list): hist.append('.'); continue
            m = next((x for x in ms if x['name'][:60] == nm), None)
            hist.append('.' if m is None else ('A' if applies(m, htmls[t]) else 'N'))
        P('  %-34s %-60s %s' % (f, nm, ''.join(hist)))
    P('  (columns V190..V233; A applies, N not-applied, . absent)')
    # the dead gate's own file and the shared harness: edit history V218..V233
    for f in ['tests/gates/g219_d167_pairs.js', 'tests/harness.js']:
        P('EDITS %s: %s' % (f, git('log', '--format=%h %ad %s', '--date=short', 'V218..V233', '--', f).strip().replace(chr(10), ' || ')[:1500]))
    P('g219_d167_pairs requires:', re.findall(r"require\(([^)]+)\)", git('show', 'V219:tests/gates/g219_d167_pairs.js')))
    out.close()

def run():
    out = open(os.path.join(S, 'run.out'), 'a')
    P = lambda *a: (print(*a, file=out), out.flush())
    env = dict(os.environ, GIT_DIR=os.path.join(REPO, '.git'), TMPDIR=os.path.join(S, 'tmp'), SABOTAGE_JOBS=os.environ.get('SABOTAGE_JOBS', '3'))
    os.makedirs(env['TMPDIR'], exist_ok=True)
    def tree(t):
        d = os.path.join(S, 'tree_' + t)
        if not os.path.exists(os.path.join(d, 'index.html')):
            os.makedirs(d, exist_ok=True)
            subprocess.run('git -C "%s" archive %s tests index.html | tar -x -C "%s"' % (REPO, t, d), shell=True, check=True)
        return d
    cases = []
    # V221 trio + two g219 controls from v219.json, as each tag tree carries the spec
    for t in ['V219', 'V220', 'V221']:
        cases.append((t, t, 'v219.json', None))
    cases.append(('V220', 'V220', 'v219.json', 219))       # V220 html re-stamped 219: the version predicate alone
    cases.append(('V205', 'V205', 'v205_d122_threerun_v204.json', None))
    cases.append(('V205', 'V204', 'v205_d122_threerun_v204.json', None))
    only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
    for idx, (tt, ht, spec, stamp) in enumerate(cases):
        if only and str(idx) not in only: continue
        d = tree(tt); h = os.path.join(tree(ht), 'index.html')
        if stamp:
            src = open(h, encoding='utf-8').read()
            pat = re.compile(r'<meta name="ia-version" content="\d+">')
            assert len(pat.findall(src)) == 1
            h = os.path.join(S, 'stamp_%s_%d.html' % (ht, stamp))
            open(h, 'w', encoding='utf-8').write(pat.sub('<meta name="ia-version" content="%d">' % stamp, src))
        ms = json.load(open(os.path.join(d, 'tests', 'sabotage', spec)))
        if spec == 'v219.json':
            ms = [m for m in ms if re.match(r'S[1-5]-', m['name'])]
        sp = os.path.join(S, 'spec_%d_%s' % (idx, spec)); json.dump(ms, open(sp, 'w'))
        t0 = datetime.datetime.now()
        r = subprocess.run(['python3', os.path.join(d, 'tests', 'sabotage.py'), h, sp], capture_output=True, text=True, env=env, cwd=d)
        dt = (datetime.datetime.now() - t0).total_seconds()
        o = r.stdout + r.stderr
        open(os.path.join(S, 'run_%d.log' % idx), 'w').write(o)
        lines = [l for l in o.split('\n') if re.search(r'TRIPPED|SURVIVED|NOT-APPLIED|CRASH|SABOTAGE', l)]
        P('CASE %d tree %s html %s%s spec %s rc %d %.0fs' % (idx, tt, ht, ' stamped %d' % stamp if stamp else '', spec, r.returncode, dt))
        for l in lines: P('   ' + l[:230])
    out.close()

meta() if MODE == 'meta' else run()
