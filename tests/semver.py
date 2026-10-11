#!/usr/bin/env python3
# tests/semver.py: ia-version as MAJOR.MINOR.PATCH for Python tooling (era_bump.py), the same rules as tests/semver.js.
# Legacy rule: an integer meta N (every build through V239, every artifact in git history) reads as 0.N.0, so 239 == 0.239.0.
# Compare versions only through cmp: SemVer refuses <, <=, >, >= (TypeError), so an unconverted compare is loud.
#
#   import semver as SV          (with tests/ on sys.path)
#   SV.cmp('0.239.1', 239)       1
#   SV.str(239)                  '0.239.0'
#   SV.bump(239, 'patch')        SemVer 0.239.1
#
#   python3 tests/semver.py cmp <a> <b>        -1, 0 or 1
#   python3 tests/semver.py str <v>            canonical M.m.p (239 prints 0.239.0)
#   python3 tests/semver.py bump <v> <patch|minor|major>
#                                              canonical M.m.p of the bumped version (bump 239 patch prints 0.239.1)
#   python3 tests/semver.py below <v>          the greatest stdin line strictly below <v>, printed exactly as written; a
#                                              line that does not parse is skipped; of two lines naming one version the
#                                              first wins; exit 1 when none (the same contract as tests/semver.js below)
#   python3 tests/semver.py --selftest   PASS n FAIL n, exit 1 on any FAIL
import math
import re
import sys

LEGACY_RE = re.compile(r'[Vv]?(0|[1-9][0-9]*)')
DOTTED_RE = re.compile(r'[Vv]?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)')
META_RE = re.compile(r'<meta name="ia-version" content="([^"]*)"')


class SemVer(object):
    __slots__ = ('major', 'minor', 'patch', 'legacy')

    def __init__(self, major, minor, patch, legacy):
        object.__setattr__(self, 'major', major)
        object.__setattr__(self, 'minor', minor)
        object.__setattr__(self, 'patch', patch)
        object.__setattr__(self, 'legacy', legacy)

    def __setattr__(self, k, v):
        raise AttributeError('semver: a SemVer is frozen')

    def __delattr__(self, k):
        raise AttributeError('semver: a SemVer is frozen')

    def __str__(self):
        if self.major == math.inf:
            return 'Infinity'
        if self.major == -math.inf:
            return '-Infinity'
        return str(self.minor) if self.legacy else '%d.%d.%d' % (self.major, self.minor, self.patch)

    def __repr__(self):
        return 'SemVer(%s)' % str(self)

    def _refuse(self, other):
        raise TypeError('semver: compare versions with SV.cmp, not an ordering operator (%s)' % self)

    __lt__ = __le__ = __gt__ = __ge__ = _refuse

    def __eq__(self, other):
        raise TypeError('semver: compare versions with SV.cmp, not == (%s)' % self)

    __ne__ = __eq__
    __hash__ = None

    def __int__(self):
        raise TypeError('semver: compare versions with SV.cmp, not a numeric conversion (%s)' % self)

    __float__ = __index__ = __int__


INF = SemVer(math.inf, math.inf, math.inf, False)
NINF = SemVer(-math.inf, -math.inf, -math.inf, False)


def _bad(v):
    return TypeError('semver: cannot parse %r as a version (want N, VN, M.m.p or vM.m.p)' % (v,))


def parse(v):
    if isinstance(v, SemVer):
        return v
    if isinstance(v, float) and math.isinf(v):
        return INF if v > 0 else NINF
    if isinstance(v, int) and not isinstance(v, bool):
        if v >= 0:
            return SemVer(0, v, 0, True)
        raise _bad(v)
    if isinstance(v, str):
        m = LEGACY_RE.fullmatch(v)
        if m:
            return SemVer(0, int(m.group(1)), 0, True)
        m = DOTTED_RE.fullmatch(v)
        if m:
            return SemVer(int(m.group(1)), int(m.group(2)), int(m.group(3)), False)
    raise _bad(v)


def cmp(a, b):
    x, y = parse(a), parse(b)
    for k in ('major', 'minor', 'patch'):
        p, q = getattr(x, k), getattr(y, k)
        if p < q:
            return -1
        if p > q:
            return 1
    return 0


def lookup(table, v):
    want = parse(v)
    hit_key, hit = None, None
    for k in table:
        try:
            kv = parse(k)
        except TypeError as e:
            raise TypeError('semver: lookup table key %r does not parse as a version (%s)' % (k, e))
        if cmp(kv, want) != 0:
            continue
        if hit_key is not None:
            raise TypeError('semver: lookup table keys %r and %r name one version (%s)' % (hit_key, k, str_(want)))
        hit_key, hit = k, table[k]
    return hit


def from_html(html):
    m = META_RE.search(html)
    if not m:
        raise ValueError('semver: no <meta name="ia-version" content="..."> in the html')
    return parse(m.group(1))


def str_(v):
    x = parse(v)
    if math.isinf(x.major):
        return str(x)
    return '%d.%d.%d' % (x.major, x.minor, x.patch)


def bump(v, kind):
    x = parse(v)
    if math.isinf(x.major):
        raise TypeError('semver: cannot bump a range sentinel (%s)' % x)
    if kind == 'patch':
        return SemVer(x.major, x.minor, x.patch + 1, False)
    if kind == 'minor':
        return SemVer(x.major, x.minor + 1, 0, False)
    if kind == 'major':
        return SemVer(x.major + 1, 0, 0, False)
    raise TypeError('semver: bump kind must be patch, minor or major, got %r' % (kind,))


def below(lines, v):
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


def selftest():
    import builtins
    S = builtins.str
    res = {'pass': 0, 'fail': 0}

    def row(name, ok, got=''):
        if ok:
            res['pass'] += 1
            print('PASS ' + name)
        else:
            res['fail'] += 1
            print('FAIL ' + name + ' — got ' + S(got))

    def throws(fn, pat=None):
        try:
            fn()
            return 'no throw'
        except TypeError as e:
            return True if (pat is None or re.search(pat, S(e))) else 'threw TypeError: ' + S(e)
        except Exception as e:
            return 'threw %s: %s' % (type(e).__name__, e)

    def shape(v, M, m, p, L):
        x = parse(v)
        return (x.major, x.minor, x.patch, x.legacy) == (M, m, p, L)

    for v, M, m, p, L in [(239, 0, 239, 0, True), (0, 0, 0, 0, True), ('239', 0, 239, 0, True), ('V239', 0, 239, 0, True),
                          ('v239', 0, 239, 0, True), ('0.239.1', 0, 239, 1, False), ('v0.239.1', 0, 239, 1, False),
                          ('V1.0.0', 1, 0, 0, False), ('0.0.0', 0, 0, 0, False), ('10.20.30', 10, 20, 30, False)]:
        row('S1 parse %r is %d.%d.%d%s' % (v, M, m, p, ' legacy' if L else ''), shape(v, M, m, p, L), repr(parse(v)))
    row('S2 parse inf is the open upper end', parse(math.inf).major == math.inf and parse(math.inf).patch == math.inf)
    row('S2 parse -inf is the open lower end', parse(-math.inf).major == -math.inf and parse(-math.inf).patch == -math.inf)
    sv = parse('0.239.1')
    row('S3 parse of a SemVer returns it as is', parse(sv) is sv)
    for v in [math.nan, None, '', '1.2', '0.239.1-rc1', -1, '-1', 1.5, '1.5', '0239', '0.0239.0', '1.2.3.4', 'x239',
              ' 239', '239 ', '239\n', 'Infinity', True, {}, [239]]:
        row('S4 parse %r throws a TypeError naming the input' % (v,), throws(lambda: parse(v), re.escape('cannot parse %r' % (v,))) is True,
            throws(lambda: parse(v)))
    row('S5 legacy prints its integer: str(239) is "239"', S(parse(239)) == '239' and S(parse('V239')) == '239', S(parse(239)))
    row('S5 semver prints M.m.p', S(parse('v0.239.1')) == '0.239.1', S(parse('v0.239.1')))
    row('S5 str_ is canonical: 239 gives 0.239.0, v1.2.3 gives 1.2.3', str_(239) == '0.239.0' and str_('V239') == '0.239.0' and str_('v1.2.3') == '1.2.3',
        str_(239))
    chain = [-math.inf, 0, 220, '0.239.0', '0.239.1', 'v0.240.0', '1.0.0', '1.0.1', '1.1.0', math.inf]
    ordered = all(cmp(chain[i], chain[j]) == ((i > j) - (i < j)) for i in range(len(chain)) for j in range(len(chain)))
    row('S6 cmp orders -inf < 0 < 220 < 0.239.0 < 0.239.1 < 0.240.0 < 1.0.0 < 1.0.1 < 1.1.0 < inf both ways', ordered)
    row('S6 cmp(239, "0.239.0") is 0: the legacy rule', cmp(239, '0.239.0') == 0 and cmp('V239', 'v0.239.0') == 0)
    row('S6 cmp(239, "0.239.1") is -1 and cmp("0.239.1", 240) is -1', cmp(239, '0.239.1') == -1 and cmp('0.239.1', 240) == -1)
    row('S6 cmp(10, 9) is 1: components compare as integers, never as text', cmp(10, 9) == 1 and cmp('0.10.0', '0.9.0') == 1 and cmp('0.0.10', '0.0.9') == 1)
    row('S6 cmp of an unparseable side throws', throws(lambda: cmp('0.239', 239)) is True)
    T = {200: 'a', 238: 'b', 239: 'c'}
    row('S7 lookup over integer keys: 239, "239" and "0.239.0" all find the [239] row',
        lookup(T, 239) == 'c' and lookup(T, '239') == 'c' and lookup(T, '0.239.0') == 'c' and lookup(T, parse('V239')) == 'c')
    row('S7 lookup of an absent version is None: 0.239.1 and 240', lookup(T, '0.239.1') is None and lookup(T, 240) is None)
    D = {'0.239.0': 'x', '0.239.1': 'y', '1.0.0': 'z'}
    row('S7 lookup over dotted string keys', lookup(D, 239) == 'x' and lookup(D, '0.239.1') == 'y' and lookup(D, 'v1.0.0') == 'z')
    row('S7 a table key that does not parse throws', throws(lambda: lookup({239: 'c', '23 9': 'd'}, 239), 'does not parse') is True)
    row('S7 two table keys naming one version throw', throws(lambda: lookup({239: 'c', '0.239.0': 'd'}, 239), 'name one version') is True)
    v, w = parse(239), parse('0.239.1')
    row('S8 v >= w raises TypeError', throws(lambda: v >= w, 'SV.cmp') is True, throws(lambda: v >= w))
    row('S8 v < w raises TypeError', throws(lambda: v < w, 'SV.cmp') is True, throws(lambda: v < w))
    row('S8 v > 220 raises TypeError', throws(lambda: v > 220, 'SV.cmp') is True, throws(lambda: v > 220))
    row('S8 v == w raises TypeError (equality goes through cmp too)', throws(lambda: v == w, 'SV.cmp') is True, throws(lambda: v == w))
    row('S8 int(v) raises TypeError', throws(lambda: int(v), 'SV.cmp') is True, throws(lambda: int(v)))
    row('S8 "x" + str(v) is "x239"', 'x' + S(v) == 'x239' and '%s' % w == '0.239.1')
    row('S8 a SemVer is frozen', isinstance(throws(lambda: setattr(v, 'minor', 240)), S) and v.minor == 239)
    row('S9 from_html reads a legacy meta', S(from_html('<meta name="ia-version" content="239"><!-- x -->')) == '239')
    row('S9 from_html reads a dotted meta', str_(from_html('<head><meta name="ia-version" content="0.239.1"></head>')) == '0.239.1')
    try:
        from_html('<head></head>')
        absent = False
    except ValueError as e:
        absent = 'no <meta' in S(e)
    row('S9 from_html raises on an absent meta', absent)
    row('S9 from_html raises on a meta that does not parse', throws(lambda: from_html('<meta name="ia-version" content="0.239">'), "cannot parse '0.239'") is True)
    row('S10 bump(239, patch) is 0.239.1, non-legacy', str_(bump(239, 'patch')) == '0.239.1' and bump(239, 'patch').legacy is False)
    row('S10 bump(0.239.1, minor) is 0.240.0 and bump(0.239.1, major) is 1.0.0',
        str_(bump('0.239.1', 'minor')) == '0.240.0' and str_(bump('0.239.1', 'major')) == '1.0.0')
    row('S10 bump with an unknown kind throws', throws(lambda: bump(239, 'build')) is True)
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

    LIST = '\n'.join(TAGS) + '\n'
    got = cli(['bump', '239', 'patch'])
    row('S12 CLI bump 239 patch prints 0.239.1, exit 0', got == (0, '0.239.1\n'), got)
    got = cli(['bump', 'v0.239.1', 'minor'])
    row('S12 CLI bump v0.239.1 minor prints 0.240.0', got == (0, '0.240.0\n'), got)
    got = cli(['bump', '0.239.1', 'major'])
    row('S12 CLI bump 0.239.1 major prints 1.0.0', got == (0, '1.0.0\n'), got)
    got = cli(['bump', '239', 'build'])
    row('S12 CLI bump with an unknown kind exits 2, nothing on stdout', got == (2, ''), got)
    got = cli(['below', '0.239.1'], LIST)
    row('S12 CLI below 0.239.1 prints V239 exactly as written, exit 0', got == (0, 'V239\n'), got)
    got = cli(['below', '0.240.0'], 'V239\r\nv0.239.1\r\n')
    row('S12 CLI below reads CRLF lines: below 0.240.0 prints v0.239.1', got == (0, 'v0.239.1\n'), got)
    got = cli(['below', '237'], LIST)
    row('S12 CLI below with nothing below exits 1, nothing on stdout', got == (1, ''), got)
    got = cli(['below', 'junk'], LIST)
    row('S12 CLI below with a candidate that does not parse exits 2, nothing on stdout', got == (2, ''), got)
    print('PASS %d FAIL %d' % (res['pass'], res['fail']))
    return 1 if res['fail'] else 0


if __name__ == '__main__':
    a = sys.argv[1:]
    try:
        if a == ['--selftest']:
            sys.exit(selftest())
        elif len(a) == 3 and a[0] == 'cmp':
            print(cmp(a[1], a[2]))
        elif len(a) == 2 and a[0] == 'str':
            print(str_(a[1]))
        elif len(a) == 3 and a[0] == 'bump':
            print(str_(bump(a[1], a[2])))
        elif len(a) == 2 and a[0] == 'below':
            want = parse(a[1])
            hit = below([ln[:-1] if ln.endswith('\r') else ln for ln in sys.stdin.read().split('\n')], want)
            if hit is None:
                sys.stderr.write('semver: no version below %s on stdin\n' % str_(want))
                sys.exit(1)
            print(hit)
        else:
            sys.stderr.write('usage: python3 tests/semver.py cmp <a> <b> | str <v> | bump <v> <patch|minor|major> | '
                             'below <v> | --selftest\n')
            sys.exit(2)
    except (TypeError, ValueError) as e:
        sys.stderr.write('%s\n' % e)
        sys.exit(2)
