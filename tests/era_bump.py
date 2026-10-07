#!/usr/bin/env python3
# era_bump.py: the era rows of a build whose ruling does not move a table, written by script, never by hand.
#
# Decision (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md: "script the 'nothing moved' version
# rows"); CLAUDE.md Proof scope, "Era rows": "A table the ruling does not move gets its reference row from
# `tests/era_bump.py <N>`, never by hand. A table the ruling moves is written by builder from coach's printed digest
# (standing ruling 5)." and "Previous version": "A row written by the era script does not make a gate edited."
# Table list: measure mT (tests/measure/v233_rulings/measure_tooling_inventory_mT.md section 1), verified against the
# V233 rows and tests/edits/v233_e1_era_harness_g193.py, v233_e2_era_g197b_g200_g219.py, v233_e3_era_g199.py.
#
# Modes
#   era_bump.py <N> --ruling <path> [--moved SYM,...] [--dry-run]
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
#
# The tree operated on is the one this file sits in: ROOT = the parent of the directory holding era_bump.py.
# Plain Python 3, no dependencies. Exit codes: 0 ok, 1 check failed, 2 refused / usage.
import sys, os, re, subprocess, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TESTS_REL = os.path.basename(HERE)              # 'tests'

# Row-per-version tables (mT section 1: edited on every build V224..V233, 10/10). Order is the order of the report.
TABLES = [
    ('tests/harness.js', 'MANNY_DIGEST_BY_VERSION'),
    ('tests/harness.js', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION'),
    ('tests/harness.js', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'),
    ('tests/gates/g193_samecard.js', 'OPEN_UNRULED_BY_VERSION'),
    ('tests/gates/g197b_sweep.js', 'HF_LEAK_BY_VERSION'),
    ('tests/gates/g197b_sweep.js', 'B5C_BY_VERSION'),
    ('tests/gates/g199_deload_arbitration.js', 'DELOAD_ARB_BY_VERSION'),
    ('tests/gates/g199_deload_arbitration.js', 'E6_BY_VERSION'),
    ('tests/gates/g199_deload_arbitration.js', 'DELOAD_HINGE_BY_VERSION'),
    ('tests/gates/g200_pull_arbitration.js', 'SWAP_BY_VERSION'),
    ('tests/gates/g219_samecard_draws.js', 'ERA'),
]
# Closed tables: era rows that are NOT row-per-version (mT section 1, "Not row-per-version": g217 pair-scoped,
# `PAIR_SCOPE = VER <= 218`, 0/10 edits V224..V233). Registered so the scan does not call them unregistered; bound to
# their file and their last row, so a row above it is UNREGISTERED (the table has become row-per-version).
CLOSED = {
    ('tests/gates/g217_d160_dedupe_view.js', 'D160_MULTI_BY_VERSION'): 218,
}
REGISTERED = set(TABLES)
NAMES = [s for _, s in TABLES]

MARK = 'era_bump V'
JS_LINE_TERMINATORS = ('\n', '\r', chr(0x2028), chr(0x2029))


def rel(path):
    return os.path.relpath(path, ROOT)


def absp(relpath):
    return os.path.join(ROOT, relpath)


def die(msg, code=2):
    print(msg)
    sys.exit(code)


# ---- JS scanning: comments and string/template/regex bodies blanked, length and newlines preserved ----------------
REGEX_PREV = set('(,=:[!&|?{};+-*%<>~^')
REGEX_KW = {'return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof',
            'yield', 'await'}


def is_ident(ch):
    return ch.isalnum() or ch in '_$' or ord(ch) > 127


def strip_js(src):
    out = list(src)
    n = len(src)

    def blank(a, b):
        for k in range(a, min(b, n)):
            if out[k] != '\n':
                out[k] = ' '

    def template_from(j):          # j = first char of a template body; returns (next index, opened a ${ )
        k = j
        while k < n:
            ch = src[k]
            if ch == chr(92):
                k += 2
                continue
            if ch == '`':
                blank(j, k)
                return k + 1, False
            if ch == '$' and k + 1 < n and src[k + 1] == '{':
                blank(j, k)
                return k + 2, True
            k += 1
        blank(j, n)
        return n, False

    i = 0
    depth = 0
    tstack = []
    prev = ''
    word = ''
    while i < n:
        c = src[i]
        nx = src[i + 1] if i + 1 < n else ''
        if c == '/' and nx == '/':
            j = src.find('\n', i)
            j = n if j < 0 else j
            blank(i, j)
            i = j
            continue
        if c == '/' and nx == '*':
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            blank(i, j)
            i = j
            continue
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c and src[j] != '\n':
                j += 2 if src[j] == chr(92) else 1
            blank(i + 1, j)
            i = j + 1
            prev, word = 'a', ''
            continue
        if c == '`':
            i, opened = template_from(i + 1)
            if opened:
                tstack.append(depth)
            prev, word = 'a', ''
            continue
        if c == '/':
            if prev == '' or prev in REGEX_PREV or word in REGEX_KW:
                j = i + 1
                in_class = False
                while j < n and src[j] != '\n':
                    ch = src[j]
                    if ch == chr(92):
                        j += 2
                        continue
                    if ch == '[':
                        in_class = True
                    elif ch == ']':
                        in_class = False
                    elif ch == '/' and not in_class:
                        break
                    j += 1
                if j < n and src[j] == '/':
                    blank(i + 1, j)
                    i = j + 1
                    prev, word = 'a', ''
                    continue
            prev, word = '/', ''
            i += 1
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            if tstack and tstack[-1] == depth:
                tstack.pop()
                i, opened = template_from(i + 1)
                if opened:
                    tstack.append(depth)
                prev, word = 'a', ''
                continue
            depth -= 1
        if c.isspace():
            i += 1
            continue
        if is_ident(c):
            j = i
            while j < n and is_ident(src[j]):
                j += 1
            word = src[i:j]
            prev = 'a'
            i = j
            continue
        prev, word = c, ''
        i += 1
    return ''.join(out)


def row_re(sym, v):
    return re.compile(r'(?<![\w$.])' + re.escape(sym) + r'\[' + str(v) + r'\]\s*=(?![=>])')


ANY_ROW = re.compile(r'(?<![\w$])([A-Za-z_$][\w$]*)\[(\d{3})\]\s*=(?![=>])')


def line_of(text, idx):
    return text.count('\n', 0, idx) + 1


def read(relpath):
    with open(absp(relpath), 'rb') as f:
        return f.read().decode('utf-8')


def era_row(sym, n, ruling_disp, indent=''):
    return '%s%s[%d] = %s[%d];   // %s%d: ruled UNMOVED, reference to [%d]; %s\n' % (
        indent, sym, n, sym, n - 1, MARK, n, n - 1, ruling_disp)


ERA_ADDED = re.compile(r'^(\s*)([A-Za-z_$][\w$]*)\[(\d+)\] = \2\[(\d+)\];   // ' + re.escape(MARK) +
                       r'(\d+): ruled UNMOVED, reference to \[(\d+)\]; \S.*$')


def parse_version(s, what):
    if not re.fullmatch(r'\d{3}', s or ''):
        die('REFUSED: %s must be a three-digit ia-version, got %r' % (what, s))
    v = int(s)
    if v < 101:
        die('REFUSED: %s %d has no previous three-digit version' % (what, v))
    return v


# ---- mode: bump ------------------------------------------------------------------------------------------------------
def bump(n, ruling, moved_arg, dry):
    refusals = []
    rp = os.path.abspath(ruling)
    if not os.path.isfile(rp):
        die('REFUSED: --ruling %r is not an existing file' % ruling)
    if os.path.getsize(rp) == 0:
        die('REFUSED: --ruling %r is empty' % ruling)
    disp = os.path.relpath(rp, ROOT) if (rp + os.sep).startswith(ROOT + os.sep) or rp.startswith(ROOT + os.sep) else rp
    if any(t in disp for t in JS_LINE_TERMINATORS) or any(ord(ch) < 32 for ch in disp):
        die('REFUSED: --ruling path carries a line terminator or control character; it cannot sit in a line comment')
    moved = []
    if moved_arg is not None:
        for m in moved_arg.split(','):
            m = m.strip()
            if not m:
                refusals.append('REFUSED --moved: empty name in %r' % moved_arg)
            elif m not in NAMES:
                closed = [s for (_, s) in CLOSED if s == m]
                refusals.append('REFUSED --moved %s: not a registered row-per-version table%s' % (
                    m, ' (it is a CLOSED table)' if closed else ''))
            elif m not in moved:
                moved.append(m)
    plan = {}        # relpath -> list of (anchor line index 0-based, row text, sym)
    texts = {}
    for relpath, sym in TABLES:
        if sym in moved:
            continue
        if not os.path.isfile(absp(relpath)):
            refusals.append('REFUSED %s %s: file absent' % (relpath, sym))
            continue
        if relpath not in texts:
            raw = read(relpath)
            texts[relpath] = (raw, strip_js(raw))
        raw, code = texts[relpath]
        prev_hits = [m.start() for m in row_re(sym, n - 1).finditer(code)]
        cur_hits = [m.start() for m in row_re(sym, n).finditer(code)]
        if len(prev_hits) != 1:
            refusals.append('REFUSED %s %s: row [%d] count %d, need exactly 1' % (relpath, sym, n - 1, len(prev_hits)))
        if len(cur_hits) != 0:
            refusals.append('REFUSED %s %s: row [%d] already exists (count %d, line %s)' % (
                relpath, sym, n, len(cur_hits), ','.join(str(line_of(code, h)) for h in cur_hits)))
        if len(prev_hits) != 1 or cur_hits:
            continue
        h = prev_hits[0]
        ls = code.rfind('\n', 0, h) + 1
        if code[ls:h].strip():
            refusals.append('REFUSED %s %s: row [%d] at line %d does not start its line' % (
                relpath, sym, n - 1, line_of(code, h)))
            continue
        indent = raw[ls:h]
        row = era_row(sym, n, disp, indent)
        if raw.count(row.strip()) != 0:
            refusals.append('REFUSED %s %s: the era_bump row text is already present' % (relpath, sym))
            continue
        plan.setdefault(relpath, []).append((line_of(code, h) - 1, row, sym))
    if refusals:
        for r in refusals:
            print(r)
        die('era_bump V%d: REFUSED, %d refusal(s); no file written' % (n, len(refusals)))
    new = {}
    for relpath, items in plan.items():
        lines = texts[relpath][0].splitlines(True)
        anchors = {}
        for idx, row, sym in items:
            if idx in anchors:
                die('REFUSED %s: two tables anchor on line %d; no file written' % (relpath, idx + 1))
            anchors[idx] = (row, sym)
        out = []
        for k, ln in enumerate(lines):
            out.append(ln)
            if k in anchors:
                if not ln.endswith('\n'):
                    out[-1] = ln + '\n'
                out.append(anchors[k][0])
        new[relpath] = ''.join(out)
    count = 0
    for relpath, sym in TABLES:
        if sym in moved:
            print('MOVED     %-40s %s[%d]: not written; builder writes this row from coach\'s printed digest '
                  '(standing ruling 5)' % (relpath, sym, n))
            continue
        for idx, row, s in plan.get(relpath, []):
            if s == sym:
                count += 1
                print('%s %-40s %s[%d] = %s[%d]  after line %d' % (
                    'WOULD     ' if dry else 'WROTE     ', relpath, sym, n, sym, n - 1, idx + 1))
    if dry:
        print('era_bump V%d: DRY RUN, %d row(s) in %d file(s) would be written; %d moved; nothing written' % (
            n, count, len(new), len(moved)))
        return 0
    for relpath, text in new.items():
        p = absp(relpath)
        tmp = p + '.era_bump.tmp'
        mode = os.stat(p).st_mode
        with open(tmp, 'wb') as f:
            f.write(text.encode('utf-8'))
        os.chmod(tmp, mode & 0o7777)
        os.replace(tmp, p)
    print('era_bump V%d: wrote %d row(s) in %d file(s); %d moved (ruling %s)' % (n, count, len(new), len(moved), disp))
    return 0


# ---- mode: check -----------------------------------------------------------------------------------------------------
def scan_files():
    files = ['tests/harness.js']
    gd = absp('tests/gates')
    if os.path.isdir(gd):
        files += sorted('tests/gates/' + f for f in os.listdir(gd) if f.endswith('.js'))
    return files


def check(n):
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
    for (relpath, sym), last in sorted(CLOSED.items()):
        print('closed    %-40s %s (not row-per-version; rows end at [%d])' % (relpath, sym, last))
    unreg = 0
    for relpath in scan_files():
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
            print('UNREGISTERED %s:%d %s%s' % (relpath, line_of(code, m.start()), name, extra))
            unreg += 1
    print('era_bump --check %d: %d present, %d missing or duplicate, %d unregistered' % (
        n, len(TABLES) - bad, bad, unreg))
    return 1 if (bad or unreg) else 0


# ---- mode: era-only-diff ---------------------------------------------------------------------------------------------
def git(*args):
    r = subprocess.run(['git', '-C', ROOT, '-c', 'core.quotepath=off'] + list(args),
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        die('REFUSED: git %s failed: %s' % (' '.join(args), r.stderr.decode('utf-8', 'replace').strip()))
    return r.stdout.decode('utf-8', 'replace')


def classify(relpath, ref):
    """Return (era_only: bool, detail: str)."""
    d = git('diff', '--no-ext-diff', '--no-textconv', '--no-color', '--no-renames', '-U0', ref, '--', relpath)
    if not d.strip():
        return None, ''
    head, hunks = [], []
    cur = None
    for ln in d.split('\n'):
        if ln.startswith('@@'):
            m = re.match(r'^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@', ln)
            if not m:
                return False, 'unparsed hunk header'
            cur = [int(m.group(1)), []]
            hunks.append(cur)
        elif cur is None:
            head.append(ln)
        else:
            cur[1].append(ln)
    for h in head:
        if h.startswith(('old mode', 'new mode', 'deleted file', 'new file', 'Binary files', 'similarity', 'rename')):
            return False, h.strip()
    if not hunks:
        return False, 'no text hunks'
    worktree = absp(relpath)
    if not os.path.isfile(worktree):
        return False, 'deleted'
    wlines = read(relpath).split('\n')
    rows = []
    for start, body in hunks:
        newno = start
        for ln in body:
            if ln == '' or ln.startswith(chr(92)):
                continue
            if ln.startswith('-'):
                return False, 'removed line'
            if not ln.startswith('+'):
                return False, 'unexpected diff line'
            m = ERA_ADDED.match(ln[1:])
            if not m:
                return False, 'non-era line at %d' % newno
            sym, v, ref_v, mark_v, ref2 = m.group(2), int(m.group(3)), int(m.group(4)), int(m.group(5)), int(m.group(6))
            if not (ref_v == v - 1 and mark_v == v and ref2 == v - 1):
                return False, 'era row with mismatched versions at %d' % newno
            if (relpath, sym) not in REGISTERED:
                return False, 'era row for unregistered table %s at %d' % (sym, newno)
            above = wlines[newno - 2] if newno >= 2 else ''
            if not re.match(r'^\s*' + re.escape(sym) + r'\[' + str(v - 1) + r'\]\s*=(?![=>])', above):
                return False, 'era row %s[%d] at %d is not directly after row [%d]' % (sym, v, newno, v - 1)
            rows.append('%s[%d]' % (sym, v))
            newno += 1
    return True, ', '.join(rows)


def era_only_diff(ref):
    git('rev-parse', '--verify', '--quiet', ref + '^{commit}')
    names = [p for p in git('diff', '--name-only', '--no-renames', '-z', ref, '--', TESTS_REL).split('\0') if p]
    untracked = [p for p in git('ls-files', '--others', '--exclude-standard', '-z', '--', TESTS_REL).split('\0') if p]
    era, edited = [], []
    for p in sorted(set(names)):
        ok, detail = classify(p, ref)
        if ok is None:
            continue
        (era if ok else edited).append((p, detail))
    for p in sorted(untracked):
        edited.append((p, 'untracked, new file'))
    for p, d in era:
        print('era-only  %s  (%s)' % (p, d))
    for p, d in edited:
        print('edited    %s  (%s)' % (p, d))
    print('era_bump --era-only-diff %s: %d era-only, %d edited' % (ref, len(era), len(edited)))
    return 0


def main():
    ap = argparse.ArgumentParser(prog='era_bump.py', description='Write the era rows of tables a ruling does not move.')
    ap.add_argument('version', nargs='?', help='the new ia-version N (rows [N] = [N-1])')
    ap.add_argument('--ruling', help='path of the ruling the rows cite (must exist)')
    ap.add_argument('--moved', help='comma list of registered tables the ruling moves (not written)')
    ap.add_argument('--dry-run', action='store_true', help='print the plan, write nothing')
    ap.add_argument('--check', metavar='N', help='report each registered table present or MISSING at [N]')
    ap.add_argument('--era-only-diff', metavar='REF', dest='era_only_diff', help='classify tests/ diffs against REF')
    a = ap.parse_args()
    modes = [x for x in (a.version, a.check, a.era_only_diff) if x is not None]
    if len(modes) != 1:
        die('usage: era_bump.py <N> --ruling <path> [--moved SYM,...] [--dry-run] | --check <N> | '
            '--era-only-diff <git-ref>')
    if a.version is not None:
        if a.ruling is None:
            die('REFUSED: <N> needs --ruling <path>')
        return bump(parse_version(a.version, '<N>'), a.ruling, a.moved, a.dry_run)
    if a.ruling is not None or a.moved is not None or a.dry_run:
        die('REFUSED: --ruling, --moved and --dry-run belong to the <N> mode only')
    if a.check is not None:
        return check(parse_version(a.check, '--check'))
    return era_only_diff(a.era_only_diff)


if __name__ == '__main__':
    sys.exit(main())
