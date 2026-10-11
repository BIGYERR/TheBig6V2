#!/usr/bin/env python3
# post_v239_semver_s2a.py: Post-V239 semver pass, slice 2a (tests only, no build; tests/measure/post_v239_semver/design.md).
#   1. tests/semver.js, tests/semver.py: CLI `bump <v> <patch|minor|major>` and `below <v>`, selftest rows S11 and S12.
#   2. tests/era_bump.py: <V> is dotted M.m.p or a legacy integer (legacy path unchanged); dotted rows reference the
#      table's greatest key strictly below V; --check and --era-only-diff read both key forms.
#   3. tests/chain.js: reach map v<N> or v<M.m.p>, the greatest through semver.js cmp; META_RE takes a dotted meta.
#   4. tests/tooling_selftest.sh: semver.js and semver.py copied into the toy trees; CUR through semver.js meta, NEXT through
#      semver.js bump CUR patch; era row expectations read the dotted NEXT. tests/sabotage/v203_nonartifact_proof.py copies
#      semver.js beside harness.js.
# Every base is read from the pinned commit BASE (slice 1), so the script re-runs; every anchor is asserted count==1 and
# the first miss aborts the whole script before any file is written.
#   python3 tests/edits/post_v239_semver_s2a.py      (from the repo root)
import subprocess, sys, os

BASE = '15ab830'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def base(rel):
    r = subprocess.run(['git', '-C', ROOT, 'show', BASE + ':' + rel], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        sys.exit('ABORT: git show %s:%s failed: %s' % (BASE, rel, r.stderr.decode('utf-8', 'replace')))
    return r.stdout.decode('utf-8')


EDITS = {}


def edit(rel, old, new):
    EDITS.setdefault(rel, []).append((old, new))


# ============================================================================================================== semver.js
edit('tests/semver.js',
'''//   node tests/semver.js str <v>            canonical M.m.p (239 prints 0.239.0)
''',
'''//   node tests/semver.js str <v>            canonical M.m.p (239 prints 0.239.0)
//   node tests/semver.js bump <v> <patch|minor|major>
//                                           canonical M.m.p of the bumped version (bump 239 patch prints 0.239.1)
//   node tests/semver.js below <v>          reads versions or tag names on stdin, one per line, and prints the greatest
//                                           one strictly below <v> exactly as written (V239 and v0.239.1 below 0.240.0
//                                           print v0.239.1); a line that does not parse is skipped; of two lines naming
//                                           one version the first wins; exit 1 when none is below <v>
''')

edit('tests/semver.js',
'''module.exports = { SemVer, parse, cmp, lookup, fromHtml, str, bump, isSemVer };
''',
'''// below: of the lines that parse, the greatest strictly below v, returned exactly as written (undefined when none).
// The previous version of a candidate is the greatest tag strictly below it, never N-1 (design.md, New names).
function below(lines, v){
  const want = parse(v);
  let hit, hitV;
  for (const line of lines){
    let x;
    try { x = parse(line); } catch (e) { continue; }
    if (cmp(x, want) >= 0) continue;
    if (hitV === undefined || cmp(x, hitV) > 0){ hit = line; hitV = x; }
  }
  return hit;
}

module.exports = { SemVer, parse, cmp, lookup, fromHtml, str, bump, below, isSemVer };
''')

edit('tests/semver.js',
'''  row('S10 bump with an unknown kind throws', throws(() => bump(239, 'build')) === true, throws(() => bump(239, 'build')));
  console.log('PASS ' + pass + ' FAIL ' + fail);
''',
'''  row('S10 bump with an unknown kind throws', throws(() => bump(239, 'build')) === true, throws(() => bump(239, 'build')));
  // below
  const TAGS = ['V237', 'V238', 'V239', 'v0.239.1', 'v0.240.0', 'junk'];
  for (const [cand, want] of [[239, 'V238'], ['0.239.1', 'V239'], ['0.240.0', 'v0.239.1'], [238, 'V237']])
    row('S11 below ' + cand + ' over V237 V238 V239 v0.239.1 v0.240.0 junk is ' + want, below(TAGS, cand) === want, below(TAGS, cand));
  row('S11 below 237 over the same list is none (undefined)', below(TAGS, 237) === undefined, below(TAGS, 237));
  const SHUF = ['v0.240.0', 'junk', 'V239', 'V237', 'v0.239.1', 'V238'];
  row('S11 below reads every line, not the last: the list shuffled still gives v0.239.1 below 0.240.0', below(SHUF, '0.240.0') === 'v0.239.1', below(SHUF, '0.240.0'));
  row('S11 of two lines naming one version the first wins, as written: V239 before v0.239.0', below(['V239', 'v0.239.0', '239'], '0.239.1') === 'V239', below(['V239', 'v0.239.0', '239'], '0.239.1'));
  row('S11 a line that does not parse is skipped, a padded number too', below([' 238', '238 ', 'V200'], 239) === 'V200', below([' 238', '238 ', 'V200'], 239));
  row('S11 below with a candidate that does not parse throws', throws(() => below(TAGS, '0.239')) === true, throws(() => below(TAGS, '0.239')));
  // CLI
  const cli = (args, input) => require('child_process').spawnSync(process.execPath, [__filename].concat(args), { input: input || '', encoding: 'utf8' });
  const got = r => JSON.stringify([r.status, r.stdout]);
  const LIST = TAGS.join('\\n') + '\\n';
  let r = cli(['bump', '239', 'patch']);
  row('S12 CLI bump 239 patch prints 0.239.1, exit 0', r.status === 0 && r.stdout === '0.239.1\\n', got(r));
  r = cli(['bump', 'v0.239.1', 'minor']);
  row('S12 CLI bump v0.239.1 minor prints 0.240.0', r.status === 0 && r.stdout === '0.240.0\\n', got(r));
  r = cli(['bump', '0.239.1', 'major']);
  row('S12 CLI bump 0.239.1 major prints 1.0.0', r.status === 0 && r.stdout === '1.0.0\\n', got(r));
  r = cli(['bump', '239', 'build']);
  row('S12 CLI bump with an unknown kind exits 2, nothing on stdout', r.status === 2 && r.stdout === '', got(r));
  r = cli(['below', '0.239.1'], LIST);
  row('S12 CLI below 0.239.1 prints V239 exactly as written, exit 0', r.status === 0 && r.stdout === 'V239\\n', got(r));
  r = cli(['below', '0.240.0'], 'V239\\r\\nv0.239.1\\r\\n');
  row('S12 CLI below reads CRLF lines: below 0.240.0 prints v0.239.1', r.status === 0 && r.stdout === 'v0.239.1\\n', got(r));
  r = cli(['below', '237'], LIST);
  row('S12 CLI below with nothing below exits 1, nothing on stdout', r.status === 1 && r.stdout === '', got(r));
  r = cli(['below', 'junk'], LIST);
  row('S12 CLI below with a candidate that does not parse exits 2, nothing on stdout', r.status === 2 && r.stdout === '', got(r));
  console.log('PASS ' + pass + ' FAIL ' + fail);
''')

edit('tests/semver.js',
'''  const usage = () => { console.error('usage: node tests/semver.js meta <file.html> | cmp <a> <b> | str <v> | --selftest'); process.exit(2); };
''',
'''  const usage = () => { console.error('usage: node tests/semver.js meta <file.html> | cmp <a> <b> | str <v> | bump <v> <patch|minor|major> | below <v> | --selftest'); process.exit(2); };
''')

edit('tests/semver.js',
'''    else if (argv[0] === 'str' && argv.length === 2) console.log(str(argv[1]));
''',
'''    else if (argv[0] === 'str' && argv.length === 2) console.log(str(argv[1]));
    else if (argv[0] === 'bump' && argv.length === 3) console.log(str(bump(argv[1], argv[2])));
    else if (argv[0] === 'below' && argv.length === 2){
      const want = parse(argv[1]);
      const lines = require('fs').readFileSync(0, 'utf8').split('\\n').map(l => l.endsWith('\\r') ? l.slice(0, -1) : l);
      const hit = below(lines, want);
      if (hit === undefined){ console.error('semver: no version below ' + str(want) + ' on stdin'); process.exit(1); }
      console.log(hit);
    }
''')

# ============================================================================================================== semver.py
edit('tests/semver.py',
'''#   python3 tests/semver.py --selftest   PASS n FAIL n, exit 1 on any FAIL
''',
'''#   python3 tests/semver.py cmp <a> <b>        -1, 0 or 1
#   python3 tests/semver.py str <v>            canonical M.m.p (239 prints 0.239.0)
#   python3 tests/semver.py bump <v> <patch|minor|major>
#                                              canonical M.m.p of the bumped version (bump 239 patch prints 0.239.1)
#   python3 tests/semver.py below <v>          the greatest stdin line strictly below <v>, printed exactly as written; a
#                                              line that does not parse is skipped; of two lines naming one version the
#                                              first wins; exit 1 when none (the same contract as tests/semver.js below)
#   python3 tests/semver.py --selftest   PASS n FAIL n, exit 1 on any FAIL
''')

edit('tests/semver.py',
'''fromHtml = from_html   # the name tests/semver.js uses; str_ is its str (a module-level str would shadow the builtin)
''',
'''def below(lines, v):
    """Of the lines that parse, the greatest strictly below v, returned exactly as written (None when none)."""
    want = parse(v)
    hit, hit_v = None, None
    for line in lines:
        try:
            x = parse(line)
        except TypeError:
            continue
        if cmp(x, want) >= 0:
            continue
        if hit_v is None or cmp(x, hit_v) > 0:
            hit, hit_v = line, x
    return hit


fromHtml = from_html   # the name tests/semver.js uses; str_ is its str (a module-level str would shadow the builtin)
''')

edit('tests/semver.py',
'''    row('S10 bump with an unknown kind throws', throws(lambda: bump(239, 'build')) is True)
    print('PASS %d FAIL %d' % (res['pass'], res['fail']))
''',
'''    row('S10 bump with an unknown kind throws', throws(lambda: bump(239, 'build')) is True)
    TAGS = ['V237', 'V238', 'V239', 'v0.239.1', 'v0.240.0', 'junk']
    for cand, want in [(239, 'V238'), ('0.239.1', 'V239'), ('0.240.0', 'v0.239.1'), (238, 'V237')]:
        row('S11 below %s over V237 V238 V239 v0.239.1 v0.240.0 junk is %s' % (cand, want), below(TAGS, cand) == want,
            below(TAGS, cand))
    row('S11 below 237 over the same list is none (None)', below(TAGS, 237) is None, below(TAGS, 237))
    SHUF = ['v0.240.0', 'junk', 'V239', 'V237', 'v0.239.1', 'V238']
    row('S11 below reads every line, not the last: the list shuffled still gives v0.239.1 below 0.240.0',
        below(SHUF, '0.240.0') == 'v0.239.1', below(SHUF, '0.240.0'))
    row('S11 of two lines naming one version the first wins, as written: V239 before v0.239.0',
        below(['V239', 'v0.239.0', '239'], '0.239.1') == 'V239', below(['V239', 'v0.239.0', '239'], '0.239.1'))
    row('S11 a line that does not parse is skipped, a padded number too', below([' 238', '238 ', 'V200'], 239) == 'V200',
        below([' 238', '238 ', 'V200'], 239))
    row('S11 below with a candidate that does not parse raises', throws(lambda: below(TAGS, '0.239')) is True)
    import os
    import subprocess

    def cli(args, inp=''):
        r = subprocess.run([sys.executable, os.path.abspath(__file__)] + args, input=inp.encode('utf-8'),
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return r.returncode, r.stdout.decode('utf-8')

    LIST = '\\n'.join(TAGS) + '\\n'
    got = cli(['bump', '239', 'patch'])
    row('S12 CLI bump 239 patch prints 0.239.1, exit 0', got == (0, '0.239.1\\n'), got)
    got = cli(['bump', 'v0.239.1', 'minor'])
    row('S12 CLI bump v0.239.1 minor prints 0.240.0', got == (0, '0.240.0\\n'), got)
    got = cli(['bump', '0.239.1', 'major'])
    row('S12 CLI bump 0.239.1 major prints 1.0.0', got == (0, '1.0.0\\n'), got)
    got = cli(['bump', '239', 'build'])
    row('S12 CLI bump with an unknown kind exits 2, nothing on stdout', got == (2, ''), got)
    got = cli(['below', '0.239.1'], LIST)
    row('S12 CLI below 0.239.1 prints V239 exactly as written, exit 0', got == (0, 'V239\\n'), got)
    got = cli(['below', '0.240.0'], 'V239\\r\\nv0.239.1\\r\\n')
    row('S12 CLI below reads CRLF lines: below 0.240.0 prints v0.239.1', got == (0, 'v0.239.1\\n'), got)
    got = cli(['below', '237'], LIST)
    row('S12 CLI below with nothing below exits 1, nothing on stdout', got == (1, ''), got)
    got = cli(['below', 'junk'], LIST)
    row('S12 CLI below with a candidate that does not parse exits 2, nothing on stdout', got == (2, ''), got)
    print('PASS %d FAIL %d' % (res['pass'], res['fail']))
''')

edit('tests/semver.py',
'''        elif len(a) == 2 and a[0] == 'str':
            print(str_(a[1]))
        else:
            sys.stderr.write('usage: python3 tests/semver.py cmp <a> <b> | str <v> | --selftest\\n')
''',
'''        elif len(a) == 2 and a[0] == 'str':
            print(str_(a[1]))
        elif len(a) == 3 and a[0] == 'bump':
            print(str_(bump(a[1], a[2])))
        elif len(a) == 2 and a[0] == 'below':
            want = parse(a[1])
            hit = below([ln[:-1] if ln.endswith('\\r') else ln for ln in sys.stdin.read().split('\\n')], want)
            if hit is None:
                sys.stderr.write('semver: no version below %s on stdin\\n' % str_(want))
                sys.exit(1)
            print(hit)
        else:
            sys.stderr.write('usage: python3 tests/semver.py cmp <a> <b> | str <v> | bump <v> <patch|minor|major> | '
                             'below <v> | --selftest\\n')
''')

# ============================================================================================================== era_bump.py
edit('tests/era_bump.py',
'''#   era_bump.py <N> --ruling <path> [--moved SYM,...] [--dry-run]
#       For every registered table not in --moved: row [N-1] must exist exactly once and start its line, row [N] must
#       be absent; then `SYM[N] = SYM[N-1];   // era_bump V<N>: ruled UNMOVED, reference to [N-1]; <ruling path>` is
#       inserted directly after row [N-1]. Every table in every file is checked before any file is written (all or
#       nothing); every refusal is printed by name. --moved names must be registered; for those nothing is written and
#       the script prints that builder writes that row from coach's printed digest (standing ruling 5).
#   era_bump.py --check <N>
#       One line per registered table, present or MISSING (exit 1 if any is missing). Also scans tests/harness.js and
#       tests/gates/*.js, comments and string bodies blanked, for any `NAME[<3 digits>] = ` row whose (file, NAME) is
#       not registered: `UNREGISTERED <file>:<line> <NAME>` (exit 1), so a new table cannot dodge the script.
#   era_bump.py --era-only-diff <git-ref>
#       Lists each file under tests/ whose diff against <git-ref> (working tree, untracked files included) consists only
#       of added `// era_bump V` rows, each directly after its own [N-1] row (era-only), and each file with any other
#       change (edited). The mechanical meaning of "a row written by the era script does not make a gate edited".
''',
'''#   era_bump.py <V> --ruling <path> [--moved SYM,...] [--dry-run]
#       <V> is the new ia-version: dotted M.m.p (Post-V239 semver, tests/measure/post_v239_semver/design.md), or a
#       legacy three-digit integer N, which keeps the pre-semver behaviour exactly.
#       Legacy N: for every registered table not in --moved, row [N-1] must exist exactly once and start its line, and no
#       row may name version N; then `SYM[N] = SYM[N-1];   // era_bump V<N>: ruled UNMOVED, reference to [N-1]; <ruling
#       path>` is inserted directly after row [N-1].
#       Dotted V: the reference row is the table's greatest key strictly below V, compared through tests/semver.py (a key
#       is a legacy integer like [239] or a dotted string like ['0.239.1']); it must exist exactly once and start its
#       line, and no row may name version V; then `SYM['V'] = SYM[<key as written>];   // era_bump vV: ruled UNMOVED,
#       reference to [<key as written>]; <ruling path>` is inserted directly after it.
#       Every table in every file is checked before any file is written (all or nothing); every refusal is printed by
#       name. --moved names must be registered; for those nothing is written and the script prints that builder writes
#       that row from coach's printed digest (standing ruling 5).
#   era_bump.py --check <V>
#       One line per registered table, present or MISSING (exit 1 if any is missing): a row whose key names version V
#       (semver.py cmp). Also scans tests/harness.js and tests/gates/*.js, comments and string bodies blanked, for any
#       `NAME[<3 digits>] = ` or `NAME['M.m.p'] = ` row whose (file, NAME) is not registered:
#       `UNREGISTERED <file>:<line> <NAME>` (exit 1), so a new table cannot dodge the script.
#   era_bump.py --era-only-diff <git-ref>
#       Lists each file under tests/ whose diff against <git-ref> (working tree, untracked files included) consists only
#       of added era_bump rows, each directly after its own reference row (era-only): a legacy `// era_bump V` row
#       [N] = [N-1], or a dotted `// era_bump v` row ['V'] = [<key>] whose key is below V; and each file with any other
#       change (edited). The mechanical meaning of "a row written by the era script does not make a gate edited".
''')

edit('tests/era_bump.py',
'''# Plain Python 3, no dependencies. Exit codes: 0 ok, 1 check failed, 2 refused / usage.
''',
'''# Plain Python 3; versions are read and compared only through tests/semver.py, beside this file. Exit codes: 0 ok,
# 1 check failed, 2 refused / usage.
''')

edit('tests/era_bump.py',
'''TESTS_REL = os.path.basename(HERE)              # 'tests'
''',
'''TESTS_REL = os.path.basename(HERE)              # 'tests'
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True                   # no tests/__pycache__ from the import below
import semver as SV                              # tests/semver.py (Post-V239): a legacy integer N reads as 0.N.0
''')

edit('tests/era_bump.py',
'''MARK = 'era_bump V'
''',
'''MARK = 'era_bump V'                              # a legacy row: [N] = [N-1]
MARK_DOTTED = 'era_bump v'                       # a dotted row: ['M.m.p'] = [<greatest key below it>]
''')

edit('tests/era_bump.py',
'''def row_re(sym, v):
    return re.compile(r'(?<![\\w$.])' + re.escape(sym) + r'\\[' + str(v) + r'\\]\\s*=(?![=>])')


ANY_ROW = re.compile(r'(?<![\\w$])([A-Za-z_$][\\w$]*)\\[(\\d{3})\\]\\s*=(?![=>])')
''',
'''# A row key, two forms (Post-V239 semver): a legacy integer [239], or a dotted version in quotes ['0.239.1']. strip_js
# blanks a string body to spaces, so a quoted key is found in the blanked code and read back from the raw text.
VER_TXT = r'(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*)'
DOTTED_KEY = re.compile(r"""(['"])(""" + VER_TXT + r""")\\1""")


def key_version(k):
    """The version a row key names, from its raw text: [239] is legacy 239, ['0.239.1'] is 0.239.1; None if neither."""
    if re.fullmatch(r'\\d+', k):
        return SV.parse(int(k))
    m = DOTTED_KEY.fullmatch(k)
    return SV.parse(m.group(2)) if m else None


def table_rows(raw, code, sym):
    """Every `SYM[<key>] =` row in code (strip_js of raw): [(offset, key as written, SemVer)], in file order."""
    out = []
    pat = r'(?<![\\w$.])' + re.escape(sym) + r"""\\[(\\d+|'[ ]+'|"[ ]+")\\]\\s*=(?![=>])"""
    for m in re.finditer(pat, code):
        k = raw[m.start(1):m.end(1)]
        kv = key_version(k)
        if kv is not None:
            out.append((m.start(), k, kv))
    return out


ANY_ROW = re.compile(r"""(?<![\\w$])([A-Za-z_$][\\w$]*)\\[(\\d{3}|'[ ]+'|"[ ]+")\\]\\s*=(?![=>])""")
''')

edit('tests/era_bump.py',
'''def era_row(sym, n, ruling_disp, indent=''):
    return '%s%s[%d] = %s[%d];   // %s%d: ruled UNMOVED, reference to [%d]; %s\\n' % (
        indent, sym, n, sym, n - 1, MARK, n, n - 1, ruling_disp)


ERA_ADDED = re.compile(r'^(\\s*)([A-Za-z_$][\\w$]*)\\[(\\d+)\\] = \\2\\[(\\d+)\\];   // ' + re.escape(MARK) +
                       r'(\\d+): ruled UNMOVED, reference to \\[(\\d+)\\]; \\S.*$')


def parse_version(s, what):
    if not re.fullmatch(r'\\d{3}', s or ''):
        die('REFUSED: %s must be a three-digit ia-version, got %r' % (what, s))
    v = int(s)
    if v < 101:
        die('REFUSED: %s %d has no previous three-digit version' % (what, v))
    return v
''',
'''def ver_text(v):
    """Version v as the command line and the summaries print it: 240 (legacy) or 0.239.1 (dotted)."""
    return '%d' % v.minor if v.legacy else SV.str_(v)


def ver_label(v):
    """The era_bump mark of version v: V240 (legacy, as before semver) or v0.239.1 (dotted, the tag form)."""
    return 'V%d' % v.minor if v.legacy else 'v' + SV.str_(v)


def key_text(v):
    """The row key era_bump writes for version v: 240 (legacy) or '0.239.1' (dotted, quoted)."""
    return '%d' % v.minor if v.legacy else "'%s'" % SV.str_(v)


def era_row(sym, v, ref_key, ruling_disp, indent=''):
    return '%s%s[%s] = %s[%s];   // era_bump %s: ruled UNMOVED, reference to [%s]; %s\\n' % (
        indent, sym, key_text(v), sym, ref_key, ver_label(v), ref_key, ruling_disp)


ERA_ADDED = re.compile(r'^(\\s*)([A-Za-z_$][\\w$]*)\\[(\\d+)\\] = \\2\\[(\\d+)\\];   // ' + re.escape(MARK) +
                       r'(\\d+): ruled UNMOVED, reference to \\[(\\d+)\\]; \\S.*$')
ERA_ADDED_DOTTED = re.compile(r"^(\\s*)([A-Za-z_$][\\w$]*)\\['(" + VER_TXT + r")'\\] = \\2\\[(\\d+|'" + VER_TXT + r"')\\];   // " +
                              re.escape(MARK_DOTTED) + r'(' + VER_TXT + r"): ruled UNMOVED, reference to \\[(\\d+|'" +
                              VER_TXT + r"')\\]; \\S.*$")


def parse_version(s, what):
    """<V> on the command line: a legacy three-digit integer N (N >= 101, as before semver), or a dotted M.m.p."""
    if re.fullmatch(r'\\d{3}', s or ''):
        v = int(s)
        if v < 101:
            die('REFUSED: %s %d has no previous three-digit version' % (what, v))
        return SV.parse(v)
    try:
        v = SV.parse(s)
    except TypeError:
        v = None
    if v is None or v.legacy:
        die('REFUSED: %s must be a dotted ia-version M.m.p or a three-digit legacy ia-version, got %r' % (what, s))
    return v
''')

edit('tests/era_bump.py',
'''def bump(n, ruling, moved_arg, dry):
    refusals = []
''',
'''def bump(v, ruling, moved_arg, dry):
    refusals = []
    lab, kt = ver_label(v), key_text(v)
''')

edit('tests/era_bump.py',
'''    plan = {}        # relpath -> list of (anchor line index 0-based, row text, sym)
''',
'''    plan = {}        # relpath -> list of (anchor line index 0-based, row text, sym, reference key as written)
''')

edit('tests/era_bump.py',
'''        raw, code = texts[relpath]
        prev_hits = [m.start() for m in row_re(sym, n - 1).finditer(code)]
        cur_hits = [m.start() for m in row_re(sym, n).finditer(code)]
        if len(prev_hits) != 1:
            refusals.append('REFUSED %s %s: row [%d] count %d, need exactly 1' % (relpath, sym, n - 1, len(prev_hits)))
        if len(cur_hits) != 0:
            refusals.append('REFUSED %s %s: row [%d] already exists (count %d, line %s)' % (
                relpath, sym, n, len(cur_hits), ','.join(str(line_of(code, h)) for h in cur_hits)))
''',
'''        raw, code = texts[relpath]
        rows = table_rows(raw, code, sym)
        if v.legacy:                 # the reference is row [N-1], as written
            ref_key = '%d' % (v.minor - 1)
            prev_hits = [o for o, k, _ in rows if k == ref_key]
        else:                        # the reference is the greatest key strictly below V (semver.py cmp)
            top = None
            for r in rows:
                if SV.cmp(r[2], v) < 0 and (top is None or SV.cmp(r[2], top[2]) > 0):
                    top = r
            ref_key = top[1] if top is not None else None
            prev_hits = [o for o, _, kv in rows if SV.cmp(kv, top[2]) == 0] if top is not None else []
        cur_hits = [o for o, _, kv in rows if SV.cmp(kv, v) == 0]
        if ref_key is None:
            refusals.append('REFUSED %s %s: no row below [%s], nothing to reference' % (relpath, sym, kt))
        elif len(prev_hits) != 1:
            refusals.append('REFUSED %s %s: row [%s] count %d, need exactly 1' % (relpath, sym, ref_key, len(prev_hits)))
        if len(cur_hits) != 0:
            refusals.append('REFUSED %s %s: row [%s] already exists (count %d, line %s)' % (
                relpath, sym, kt, len(cur_hits), ','.join(str(line_of(code, h)) for h in cur_hits)))
''')

edit('tests/era_bump.py',
'''            refusals.append('REFUSED %s %s: row [%d] at line %d does not start its line' % (
                relpath, sym, n - 1, line_of(code, h)))
''',
'''            refusals.append('REFUSED %s %s: row [%s] at line %d does not start its line' % (
                relpath, sym, ref_key, line_of(code, h)))
''')

edit('tests/era_bump.py',
'''        row = era_row(sym, n, disp, indent)
''',
'''        row = era_row(sym, v, ref_key, disp, indent)
''')

edit('tests/era_bump.py',
'''        plan.setdefault(relpath, []).append((line_of(code, h) - 1, row, sym))
''',
'''        plan.setdefault(relpath, []).append((line_of(code, h) - 1, row, sym, ref_key))
''')

edit('tests/era_bump.py',
'''        die('era_bump V%d: REFUSED, %d refusal(s); no file written' % (n, len(refusals)))
''',
'''        die('era_bump %s: REFUSED, %d refusal(s); no file written' % (lab, len(refusals)))
''')

edit('tests/era_bump.py',
'''        for idx, row, sym in items:
''',
'''        for idx, row, sym, _ in items:
''')

edit('tests/era_bump.py',
'''            print('MOVED     %-40s %s[%d]: not written; builder writes this row from coach\\'s printed digest '
                  '(standing ruling 5)' % (relpath, sym, n))
''',
'''            print('MOVED     %-40s %s[%s]: not written; builder writes this row from coach\\'s printed digest '
                  '(standing ruling 5)' % (relpath, sym, kt))
''')

edit('tests/era_bump.py',
'''        for idx, row, s in plan.get(relpath, []):
            if s == sym:
                count += 1
                print('%s %-40s %s[%d] = %s[%d]  after line %d' % (
                    'WOULD     ' if dry else 'WROTE     ', relpath, sym, n, sym, n - 1, idx + 1))
    if dry:
        print('era_bump V%d: DRY RUN, %d row(s) in %d file(s) would be written; %d moved; nothing written' % (
            n, count, len(new), len(moved)))
''',
'''        for idx, row, s, ref_key in plan.get(relpath, []):
            if s == sym:
                count += 1
                print('%s %-40s %s[%s] = %s[%s]  after line %d' % (
                    'WOULD     ' if dry else 'WROTE     ', relpath, sym, kt, sym, ref_key, idx + 1))
    if dry:
        print('era_bump %s: DRY RUN, %d row(s) in %d file(s) would be written; %d moved; nothing written' % (
            lab, count, len(new), len(moved)))
''')

edit('tests/era_bump.py',
'''    print('era_bump V%d: wrote %d row(s) in %d file(s); %d moved (ruling %s)' % (n, count, len(new), len(moved), disp))
''',
'''    print('era_bump %s: wrote %d row(s) in %d file(s); %d moved (ruling %s)' % (lab, count, len(new), len(moved), disp))
''')

edit('tests/era_bump.py',
'''def check(n):
    bad = 0
    cache = {}
    for relpath, sym in TABLES:
        if not os.path.isfile(absp(relpath)):
            print('MISSING   %-40s %s[%d] (file absent)' % (relpath, sym, n))
            bad += 1
            continue
        if relpath not in cache:
            cache[relpath] = strip_js(read(relpath))
        code = cache[relpath]
        hits = [m.start() for m in row_re(sym, n).finditer(code)]
        if len(hits) == 1:
            print('present   %-40s %s[%d] line %d' % (relpath, sym, n, line_of(code, hits[0])))
        elif not hits:
            print('MISSING   %-40s %s[%d]' % (relpath, sym, n))
            bad += 1
        else:
            print('DUPLICATE %-40s %s[%d] lines %s' % (relpath, sym, n, ','.join(str(line_of(code, h)) for h in hits)))
            bad += 1
''',
'''def check(v):
    kt = key_text(v)
    bad = 0
    cache = {}
    for relpath, sym in TABLES:
        if not os.path.isfile(absp(relpath)):
            print('MISSING   %-40s %s[%s] (file absent)' % (relpath, sym, kt))
            bad += 1
            continue
        if relpath not in cache:
            raw = read(relpath)
            cache[relpath] = (raw, strip_js(raw))
        raw, code = cache[relpath]
        hits = [o for o, _, kv in table_rows(raw, code, sym) if SV.cmp(kv, v) == 0]
        if len(hits) == 1:
            print('present   %-40s %s[%s] line %d' % (relpath, sym, kt, line_of(code, hits[0])))
        elif not hits:
            print('MISSING   %-40s %s[%s]' % (relpath, sym, kt))
            bad += 1
        else:
            print('DUPLICATE %-40s %s[%s] lines %s' % (relpath, sym, kt, ','.join(str(line_of(code, h)) for h in hits)))
            bad += 1
''')

edit('tests/era_bump.py',
'''    for relpath in scan_files():
        code = cache.get(relpath)
        if code is None:
            code = strip_js(read(relpath))
        for m in ANY_ROW.finditer(code):
            name, v = m.group(1), int(m.group(2))
            if (relpath, name) in REGISTERED:
                continue
            last = CLOSED.get((relpath, name))
            if last is not None and v <= last:
                continue
            extra = '' if last is None else ' (CLOSED table at [%d] took row [%d])' % (last, v)
''',
'''    for relpath in scan_files():
        if relpath in cache:
            raw, code = cache[relpath]
        else:
            raw = read(relpath)
            code = strip_js(raw)
        for m in ANY_ROW.finditer(code):
            name, k = m.group(1), raw[m.start(2):m.end(2)]
            kv = key_version(k)
            if kv is None:           # a quoted key that is not a dotted version: ordinary JS, not an era row
                continue
            if (relpath, name) in REGISTERED:
                continue
            last = CLOSED.get((relpath, name))
            if last is not None and SV.cmp(kv, last) <= 0:
                continue
            extra = '' if last is None else ' (CLOSED table at [%d] took row [%s])' % (last, k)
''')

edit('tests/era_bump.py',
'''    print('era_bump --check %d: %d present, %d missing or duplicate, %d unregistered' % (
        n, len(TABLES) - bad, bad, unreg))
''',
'''    print('era_bump --check %s: %d present, %d missing or duplicate, %d unregistered' % (
        ver_text(v), len(TABLES) - bad, bad, unreg))
''')

edit('tests/era_bump.py',
'''            m = ERA_ADDED.match(ln[1:])
            if not m:
                return False, 'non-era line at %d' % newno
            sym, v, ref_v, mark_v, ref2 = m.group(2), int(m.group(3)), int(m.group(4)), int(m.group(5)), int(m.group(6))
            if not (ref_v == v - 1 and mark_v == v and ref2 == v - 1):
                return False, 'era row with mismatched versions at %d' % newno
            if (relpath, sym) not in REGISTERED:
                return False, 'era row for unregistered table %s at %d' % (sym, newno)
            above = wlines[newno - 2] if newno >= 2 else ''
            if not re.match(r'^\\s*' + re.escape(sym) + r'\\[' + str(v - 1) + r'\\]\\s*=(?![=>])', above):
                return False, 'era row %s[%d] at %d is not directly after row [%d]' % (sym, v, newno, v - 1)
            rows.append('%s[%d]' % (sym, v))
            newno += 1
''',
'''            m = ERA_ADDED.match(ln[1:])
            if m:                    # legacy: [N] = [N-1], marked V<N>
                sym, v, ref_v, mark_v, ref2 = m.group(2), int(m.group(3)), int(m.group(4)), int(m.group(5)), int(m.group(6))
                key, ref = '%d' % v, '%d' % (v - 1)
                versions_ok = ref_v == v - 1 and mark_v == v and ref2 == v - 1
            else:                    # dotted: ['M.m.p'] = [<key below it, as written>], marked vM.m.p
                m = ERA_ADDED_DOTTED.match(ln[1:])
                if not m:
                    return False, 'non-era line at %d' % newno
                sym, new, ref, mark, ref2 = m.group(2), m.group(3), m.group(4), m.group(5), m.group(6)
                key = "'%s'" % new
                versions_ok = mark == new and ref2 == ref and SV.cmp(key_version(ref), new) < 0
            if not versions_ok:
                return False, 'era row with mismatched versions at %d' % newno
            if (relpath, sym) not in REGISTERED:
                return False, 'era row for unregistered table %s at %d' % (sym, newno)
            above = wlines[newno - 2] if newno >= 2 else ''
            if not re.match(r'^\\s*' + re.escape(sym) + r'\\[' + re.escape(ref) + r'\\]\\s*=(?![=>])', above):
                return False, 'era row %s[%s] at %d is not directly after row [%s]' % (sym, key, newno, ref)
            rows.append('%s[%s]' % (sym, key))
            newno += 1
''')

edit('tests/era_bump.py',
'''    ap.add_argument('version', nargs='?', help='the new ia-version N (rows [N] = [N-1])')
''',
'''    ap.add_argument('version', nargs='?', help='the new ia-version: dotted M.m.p (row [V] = [greatest key below V]), '
                    'or a legacy three-digit N (rows [N] = [N-1])')
''')

edit('tests/era_bump.py',
'''    ap.add_argument('--check', metavar='N', help='report each registered table present or MISSING at [N]')
''',
'''    ap.add_argument('--check', metavar='V', help='report each registered table present or MISSING at version V')
''')

edit('tests/era_bump.py',
'''        die('usage: era_bump.py <N> --ruling <path> [--moved SYM,...] [--dry-run] | --check <N> | '
            '--era-only-diff <git-ref>')
    if a.version is not None:
        if a.ruling is None:
            die('REFUSED: <N> needs --ruling <path>')
        return bump(parse_version(a.version, '<N>'), a.ruling, a.moved, a.dry_run)
    if a.ruling is not None or a.moved is not None or a.dry_run:
        die('REFUSED: --ruling, --moved and --dry-run belong to the <N> mode only')
''',
'''        die('usage: era_bump.py <V> --ruling <path> [--moved SYM,...] [--dry-run] | --check <V> | '
            '--era-only-diff <git-ref>')
    if a.version is not None:
        if a.ruling is None:
            die('REFUSED: <V> needs --ruling <path>')
        return bump(parse_version(a.version, '<V>'), a.ruling, a.moved, a.dry_run)
    if a.ruling is not None or a.moved is not None or a.dry_run:
        die('REFUSED: --ruling, --moved and --dry-run belong to the <V> mode only')
''')

# ============================================================================================================== chain.js
edit('tests/chain.js',
'''const H = require(path.join(__dirname, 'harness.js'));
''',
'''const H = require(path.join(__dirname, 'harness.js'));
const SV = require(path.join(__dirname, 'semver.js'));  // ia-version is M.m.p; a legacy integer N reads as 0.N.0
''')

edit('tests/chain.js',
'''const maps = fs.readdirSync(MD).map(f => [f, /^v(\\d+)_gate_reach\\.json$/.exec(f)]).filter(x => x[1])
  .sort((a, b) => (+b[1][1]) - (+a[1][1]));
if (!maps.length) die('no tests/measure/v<N>_gate_reach.json reach map');
const mapFile = path.join(MD, maps[0][0]), mapVer = +maps[0][1][1];
''',
'''// v<N>_gate_reach.json (legacy) or v<M.m.p>_gate_reach.json: the greatest version wins, through semver.js cmp.
const maps = fs.readdirSync(MD).map(f => [f, /^v(\\d+|\\d+\\.\\d+\\.\\d+)_gate_reach\\.json$/.exec(f)]).filter(x => x[1])
  .map(x => { try { SV.parse(x[1][1]); } catch (e) { die('reach map ' + x[0] + ': its version does not parse (' + e.message + ')'); } return x; })
  .sort((a, b) => SV.cmp(b[1][1], a[1][1]));
if (!maps.length) die('no tests/measure/v<N>_gate_reach.json or v<M.m.p>_gate_reach.json reach map');
const mapFile = path.join(MD, maps[0][0]), mapVer = maps[0][1][1];
const vlabel = t => (SV.parse(t).legacy ? 'V' : 'v') + t;   // V233 for a legacy integer, v0.240.0 (the tag form) for a dotted one
''')

edit('tests/chain.js',
'''console.log('map: ' + rel(mapFile) + '  built on V' + mapVer + ' (version from the file name; the map records none)  ' +
''',
'''console.log('map: ' + rel(mapFile) + '  built on ' + vlabel(mapVer) + ' (version from the file name; the map records none)  ' +
''')

edit('tests/chain.js',
'''// A hunk confined to the <meta name="ia-version" content="N"> line (one line each side, different, and equal
// once the number is masked) is the version bump: gate.sh step 0 proves it, so it is not OUTSIDE A FUNCTION and
// does not make the verdict CROSS-CUTTING. Any other markup hunk, including one that touches the meta line AND
// anything else, keeps the default.
const META_RE = /^\\s*<meta name="ia-version" content="(\\d+)">/;
const maskVer = s => s.replace(META_RE, m => m.replace(/content="\\d+"/, 'content="N"'));
const isBump = h => { const a = B.skel.slice(h.a0, h.a1), b = C.skel.slice(h.b0, h.b1);
  return a.length === 1 && b.length === 1 && META_RE.test(a[0]) && META_RE.test(b[0]) && a[0] !== b[0] && maskVer(a[0]) === maskVer(b[0]); };
const bumps = outsideAll.filter(isBump), outside = outsideAll.filter(h => !isBump(h));
console.log('VERSION BUMP hunks ' + bumps.length);
for (const h of bumps) console.log('  VERSION BUMP (gate.sh step 0)  base L' + (h.a0 + 1) + ' V' + META_RE.exec(B.skel[h.a0])[1] +
  '  cand L' + (h.b0 + 1) + ' V' + META_RE.exec(C.skel[h.b0])[1]);
''',
'''// A hunk confined to the <meta name="ia-version" content="..."> line (one line each side, the two contents naming
// different versions through semver.js cmp, a legacy N or a dotted M.m.p, and equal once the version is masked) is
// the version bump: gate.sh step 0 proves it, so it is not OUTSIDE A FUNCTION and does not make the verdict
// CROSS-CUTTING. Any other markup hunk, including one that touches the meta line AND anything else, keeps the default.
const META_RE = /^\\s*<meta name="ia-version" content="((?:0|[1-9]\\d*)(?:\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*))?)">/;
const maskVer = s => s.replace(META_RE, m => m.replace(/content="[^"]*"/, 'content="N"'));
const isBump = h => { const a = B.skel.slice(h.a0, h.a1), b = C.skel.slice(h.b0, h.b1);
  return a.length === 1 && b.length === 1 && META_RE.test(a[0]) && META_RE.test(b[0]) &&
    SV.cmp(META_RE.exec(a[0])[1], META_RE.exec(b[0])[1]) !== 0 && maskVer(a[0]) === maskVer(b[0]); };
const bumps = outsideAll.filter(isBump), outside = outsideAll.filter(h => !isBump(h));
console.log('VERSION BUMP hunks ' + bumps.length);
for (const h of bumps) console.log('  VERSION BUMP (gate.sh step 0)  base L' + (h.a0 + 1) + ' ' + vlabel(META_RE.exec(B.skel[h.a0])[1]) +
  '  cand L' + (h.b0 + 1) + ' ' + vlabel(META_RE.exec(C.skel[h.b0])[1]));
''')

# ============================================================================================================== tooling_selftest.sh
TS = 'tests/tooling_selftest.sh'
edit(TS,
'''# Rows scoped to a version read today's ia-version from index.html (CUR) and bump to CUR+1, never a typed version.
''',
'''# Rows scoped to a version read today's ia-version from index.html (CUR, the raw meta through tests/semver.js meta) and
# bump it a patch (NEXT, tests/semver.js bump CUR patch: 239 gives 0.239.1), never a typed version, so the era rows run
# era_bump.py's dotted path (Post-V239 semver). The version_scope.js toys (G5, V2 to V5) plant CUR only: version_scope.js
# counts a compare against a 3-digit literal, and a dotted NEXT is neither a hit nor valid JS.
''')
edit(TS,
'''CUR="$(grep -oE '<meta name="ia-version" content="[0-9]+"' "$R/index.html" | grep -oE '[0-9]+' | tail -1 || true)"
if [ -z "$CUR" ]; then echo "setup: index.html carries no ia-version meta (crash)"; exit 1; fi
NEXT=$((CUR + 1))
''',
'''CUR="$(node "$R/tests/semver.js" meta "$R/index.html" 2>/dev/null || true)"
if [ -z "$CUR" ]; then echo "setup: index.html carries no ia-version meta (crash)"; exit 1; fi
NEXT="$(node "$R/tests/semver.js" bump "$CUR" patch 2>&1)" || { echo "setup: index.html ia-version $CUR does not parse: $NEXT (crash)"; exit 1; }
# An era row key as era_bump.py writes it: a legacy integer bare ([239]), a dotted version quoted (['0.239.1']); *_KRE is
# the key as an ERE, NEXT_RE the bare version as an ERE.
key_of() { case "$1" in *.*) printf "'%s'" "$1" ;; *) printf '%s' "$1" ;; esac; }
ere() { printf '%s' "$1" | sed 's/[].[\\*^$]/\\\\&/g'; }
CUR_KEY="$(key_of "$CUR")"; NEXT_KEY="$(key_of "$NEXT")"
CUR_KRE="$(ere "$CUR_KEY")"; NEXT_KRE="$(ere "$NEXT_KEY")"; NEXT_RE="$(ere "$NEXT")"
''')
edit(TS,
'''  cp "$R/tests/harness.js" "$1/tests/"
''',
'''  cp "$R/tests/harness.js" "$R/tests/semver.js" "$1/tests/"   # harness.js and gate.sh require semver.js (Post-V239)
''')
edit(TS,
'''printf "const IA = { version: '%s' }, VER = +IA.version;\\nif (VER === %s) console.log('planted exact-version row');\\nconsole.log('PASS 2 FAIL 0');\\n" "$CUR" "$NEXT" > "$GA/tests/gates/e_pass.js"
''',
'''printf "const IA = { version: '%s' }, VER = +IA.version;\\nif (VER !== %s) console.log('planted exact-version row');\\nconsole.log('PASS 2 FAIL 0');\\n" "$CUR" "$CUR" > "$GA/tests/gates/e_pass.js"
''')
edit(TS,
'''printf '%s\\nif (VER === %s) console.log("first exact row");\\nif (VER !== %s) console.log("second exact row");\\n' "$HDR" "$CUR" "$NEXT" > "$VT/gates/debt2.js"
''',
'''printf '%s\\nif (VER === %s) console.log("first exact row");\\nif (VER !== %s) console.log("second exact row");\\n' "$HDR" "$CUR" "$CUR" > "$VT/gates/debt2.js"
''')
edit(TS,
'''printf 'if (VER === %s) console.log("planted");\\n' "$NEXT" >> "$VT/gates/clean.js"
''',
'''printf 'if (VER === %s) console.log("planted");\\n' "$CUR" >> "$VT/gates/clean.js"
''')
edit(TS,
'''printf 'if (VER === %s) console.log("planted");\\n' "$NEXT" >> "$VT/gates/debt1.js"
''',
'''printf 'if (VER === %s) console.log("planted");\\n' "$CUR" >> "$VT/gates/debt1.js"
''')
edit(TS,
'''printf '%s\\nif (VER === %s) console.log("first exact row");\\nif (VER >= %s) console.log("now a minimum");\\n' "$HDR" "$CUR" "$NEXT" > "$VT/gates/debt2.js"
''',
'''printf '%s\\nif (VER === %s) console.log("first exact row");\\nif (VER >= %s) console.log("now a minimum");\\n' "$HDR" "$CUR" "$CUR" > "$VT/gates/debt2.js"
''')
edit(TS,
'''echo "== era_bump.py: a scratch git tree of tests/harness.js + tests/gates (V$CUR rows present, V$NEXT written)"
''',
'''echo "== era_bump.py: a scratch git tree of tests/harness.js + tests/gates (rows [$CUR_KEY] present, [$NEXT_KEY] written)"
''')
edit(TS,
'''cp -R "$R/tests/gates" "$ER/tests/gates"; cp "$R/tests/harness.js" "$ER/tests/"; cp "$T/era_bump.py" "$ER/tests/"
''',
'''cp -R "$R/tests/gates" "$ER/tests/gates"; cp "$R/tests/harness.js" "$ER/tests/"; cp "$T/era_bump.py" "$ER/tests/"
cp "$R/tests/semver.js" "$R/tests/semver.py" "$ER/tests/"   # harness.js requires semver.js, era_bump.py imports semver.py
''')
edit(TS,
'''printf 'tooling self-test scratch ruling: V%s moves no table\\n' "$NEXT" > "$W/ruling.md"
''',
'''printf 'tooling self-test scratch ruling: v%s moves no table\\n' "$NEXT" > "$W/ruling.md"
''')
edit(TS, '''"^present +@F +@S\\[$CUR\\] line [0-9]+$"''', '''"^present +@F +@S\\[$CUR_KRE\\] line [0-9]+$"''')
edit(TS, '''"era_bump V$NEXT: DRY RUN, ''', '''"era_bump v$NEXT: DRY RUN, ''')
edit(TS, '''"^WOULD +@F +@S\\[$NEXT\\] = @S\\[$CUR\\]  after line [0-9]+$"''', '''"^WOULD +@F +@S\\[$NEXT_KRE\\] = @S\\[$CUR_KRE\\]  after line [0-9]+$"''')
edit(TS, '''"era_bump V$NEXT: wrote 10 row(s)''', '''"era_bump v$NEXT: wrote 10 row(s)''')
edit(TS, '''MANNY_DIGEST_BY_VERSION\\[$NEXT\\]: not written"''', '''MANNY_DIGEST_BY_VERSION\\[$NEXT_KRE\\]: not written"''')
edit(TS, '''lacks "$W/e_moved.diff" "MANNY_DIGEST_BY_VERSION\\[$NEXT\\]"''', '''lacks "$W/e_moved.diff" "MANNY_DIGEST_BY_VERSION\\[$NEXT_KRE\\]"''')
edit(TS, '''row "E4 $NEXT: writes 11 rows, each [$NEXT] = [$CUR] in its own file''', '''row "E4 $NEXT: writes 11 rows, each [$NEXT_KEY] = [$CUR_KEY] in its own file''')
edit(TS, '''"era_bump V$NEXT: wrote 11 row(s)''', '''"era_bump v$NEXT: wrote 11 row(s)''')
edit(TS, '''"^\\+[[:space:]]*@S\\[$NEXT\\] = @S\\[$CUR\\];   // era_bump V$NEXT: ruled UNMOVED, reference to \\[$CUR\\]; "''',
         '''"^\\+[[:space:]]*@S\\[$NEXT_KRE\\] = @S\\[$CUR_KRE\\];   // era_bump v$NEXT_RE: ruled UNMOVED, reference to \\[$CUR_KRE\\]; "''')
edit(TS, '''"era_bump V$NEXT: REFUSED, 11 refusal(s); no file written"''', '''"era_bump v$NEXT: REFUSED, 11 refusal(s); no file written"''')
edit(TS,
'''cp "$T/chain.js" "$T/era_bump.py" "$CL/tests/"
''',
'''cp "$T/chain.js" "$T/era_bump.py" "$R/tests/semver.js" "$R/tests/semver.py" "$CL/tests/"   # the copied tools' semver helpers
''')

# ============================================================================================================== v203 proof
edit('tests/sabotage/v203_nonartifact_proof.py',
'''    shutil.copy2(os.path.join(ROOT, 'tests', HARNESS_REL), os.path.join(td, HARNESS_REL))
''',
'''    shutil.copy2(os.path.join(ROOT, 'tests', HARNESS_REL), os.path.join(td, HARNESS_REL))
    shutil.copy2(os.path.join(ROOT, 'tests', 'semver.js'), os.path.join(td, 'semver.js'))   # harness.js requires it (Post-V239)
''')

# ============================================================================================================== apply
out = {}
for rel, pairs in EDITS.items():
    text = base(rel)
    for i, (old, new) in enumerate(pairs):
        c = text.count(old)
        if c != 1:
            sys.exit('ABORT: %s anchor %d count %d, need 1: %r' % (rel, i + 1, c, old[:120]))
        text = text.replace(old, new)
    out[rel] = text
for rel, text in out.items():
    p = os.path.join(ROOT, rel)
    mode = os.stat(p).st_mode
    with open(p, 'wb') as f:
        f.write(text.encode('utf-8'))
    os.chmod(p, mode & 0o7777)
    print('wrote %s (%d replacements)' % (rel, len(EDITS[rel])))
