#!/usr/bin/env python3
# Post-V239 semver pass, slice 2c: the exact-version lint reads the semver.js form (tests only, no build).
# Ruling: tests/measure/post_v239_semver/design.md R2/R3 and the slice 2c brief. An exact-version hit is the legacy form
# version_scope.js counted before OR `SV.cmp(A, B) === 0` (== 0, !== 0, != 0; 0 on either side) where one argument is a
# version expression and the other a 3-digit literal (or quoted), a dotted 'M.m.p' string literal, or an era identifier.
# Ordered SV.cmp(...) <op> 0 is not a hit. tooling_selftest.sh's planted rows (G5, V3, V4) plant the dotted form.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]

def apply(rel, pairs):
    p = ROOT / rel
    s = p.read_text(encoding='utf-8')
    for i, (old, new) in enumerate(pairs):
        n = s.count(old)
        if n != 1:
            sys.exit('ABORT %s anchor %d: count %d, want 1:\n%s' % (rel, i + 1, n, old))
        s = s.replace(old, new, 1)
    return p, s

VS = 'tests/version_scope.js'
vs_pairs = [
# 1. header: the semver.js form
("""// never bound from the candidate path. The comparison only chooses which pinned file a live row reads as its oracle
// (g208_d103a_readers' E3e and its V213 tree). --list prints each selector as a `# selector (not a hit)` line.
""",
"""// never bound from the candidate path. The comparison only chooses which pinned file a live row reads as its oracle
// (g208_d103a_readers' E3e and its V213 tree). --list prints each selector as a `# selector (not a hit)` line.
// Post-V239 semver (slice 2c): gates compare versions through tests/semver.js, so an exact-version predicate also reads
// `SV.cmp(A, B) === 0` (or == 0, !== 0, != 0; the 0 on either side). It is a HIT when one argument is a VERSION
// EXPRESSION and the other a 3-digit literal (or a quoted one), a dotted string literal ('0.239.1', 'v0.239.1'), or an
// era identifier as above; the selector exemption applies to it unchanged. SV is the name semver.js is bound to: SV, and
// any name the gate assigns a require of semver.js. An ordered SV.cmp(A, B) < 0 (<= > >=) is not a hit, as VER >= 240
// is not. SV.parse(x) reads as x, as +x does; a name assigned from SV.fromHtml(...) is a version binding, as one read
// from the ia-version meta is. So a converted gate counts what its unconverted original counted.
"""),
# 2. blanking keeps a dotted version body, as it keeps a 3-digit one
("""// ---- blanking: same length, newlines kept. code: comments, string, template and regex bodies blanked (a body
// that is exactly 3 digits is kept, so '233' still reads as a literal). nc: comments blanked, the rest kept.
""",
"""// ---- blanking: same length, newlines kept. code: comments, string, template and regex bodies blanked (a body
// that is exactly 3 digits, or a dotted version, is kept, so '233' and '0.239.1' still read as literals). nc: comments
// blanked, the rest kept.
const DOTTED = /^[vV]?\\d+\\.\\d+\\.\\d+$/;
"""),
("""  const body = (from, to) => { // blank code[from..to) unless it is exactly three digits
    if (/^\\d{3}$/.test(src.slice(from, to))) return; for (let k = from; k < to; k++) sp(code, k); };
""",
"""  const body = (from, to) => { // blank code[from..to) unless it is exactly three digits or a dotted version
    if (/^\\d{3}$/.test(src.slice(from, to)) || DOTTED.test(src.slice(from, to))) return; for (let k = from; k < to; k++) sp(code, k); };
"""),
# 3. stripWrap: <sv>.parse(x) reads as x (svs absent: the old wrapper list, unchanged)
("""function stripWrap(e) {
  let s = e.trim(), prev;
  do { prev = s;
    if (/^\\+\\s*/.test(s)) s = s.replace(/^\\+\\s*/, '');
    let m = /^(Number|parseInt|String|parseFloat)\\s*\\(/.exec(s);
""",
"""function stripWrap(e, svs) { // svs: the gate's semver.js names, so <sv>.parse(x) reads as x (Post-V239)
  let s = e.trim(), prev;
  const wrap = new RegExp('^(Number|parseInt|String|parseFloat' + [...(svs || [])].map(x => '|' + x.replace(/\\$/g, '\\\\$') + '\\\\s*\\\\.\\\\s*parse').join('') + ')\\\\s*\\\\(');
  do { prev = s;
    if (/^\\+\\s*/.test(s)) s = s.replace(/^\\+\\s*/, '');
    let m = wrap.exec(s);
"""),
# 4. analyse: semver.js names, version bindings from SV.fromHtml, isVer/isEra/selector read through svs
("""  const mentions = (rhs, set) => [...set].some(x => new RegExp('(^|[^\\\\w$.])' + x.replace(/\\$/g, '\\\\$') + '(?![\\\\w$])').test(rhs));
""",
"""  const mentions = (rhs, set) => [...set].some(x => new RegExp('(^|[^\\\\w$.])' + x.replace(/\\$/g, '\\\\$') + '(?![\\\\w$])').test(rhs));
  // semver.js (Post-V239, slice 2c; header): SV by name, and any name the gate assigns a require of semver.js
  const svs = new Set(['SV']);
  for (const a of asg) if (/\\brequire\\s*\\(/.test(a.rhs) && /semver(\\.js)?['"`]/.test(a.rhsNc)) svs.add(a.name);
  const SVA = '(?:' + [...svs].map(x => x.replace(/\\$/g, '\\\\$')).join('|') + ')';
  const FROMHTML = new RegExp('(^|[^\\\\w$.])' + SVA + '\\\\s*\\\\.\\\\s*fromHtml\\\\s*\\\\(');
"""),
("""  const isVer = e => { const s = stripWrap(e); let mm;
""",
"""  const isVer = e => { const s = stripWrap(e, svs); let mm;
"""),
("""  const isEra = e => { const s = stripWrap(e); let mm;
""",
"""  const isEra = e => { const s = stripWrap(e, svs); let mm;
"""),
("""    for (const a of asg) if (!vers.has(a.name) && (fromVer(a.rhs) || (/ia-version/.test(a.rhsNc) && /\\.\\s*(match|exec)\\s*\\(/.test(a.rhsNc)))) { vers.add(a.name); changed = true; } }
""",
"""    for (const a of asg) if (!vers.has(a.name) && (fromVer(a.rhs) || FROMHTML.test(a.rhs) || (/ia-version/.test(a.rhsNc) && /\\.\\s*(match|exec)\\s*\\(/.test(a.rhsNc)))) { vers.add(a.name); changed = true; } }
"""),
("""    const mm = new RegExp('^(' + ID + ')\\\\s*\\\\.\\\\s*(version|IA_VERSION)$').exec(stripWrap(verSide)); if (!mm || !baseObjs.has(mm[1])) return false;
""",
"""    const mm = new RegExp('^(' + ID + ')\\\\s*\\\\.\\\\s*(version|IA_VERSION)$').exec(stripWrap(verSide, svs)); if (!mm || !baseObjs.has(mm[1])) return false;
"""),
# 5. the equality scan: the legacy form as before, else <sv>.cmp(A, B) against 0
("""  // equality operands
  const hits = []; const eq = /[!=]==?/g;
  while ((m = eq.exec(code))) {
    const o = m.index, op = m[0], e = o + op.length;
    if (/[=!<>]/.test(code[o - 1] || '') || code[e] === '=' || code[e] === '>') continue;
    const L = operand(code, o, -1), R = operand(code, e, +1);
    if ((isVer(L) && isEra(R)) || (isVer(R) && isEra(L))) {
      const h = { line: lineAt(o), kind: op, expr: (L.trim() + ' ' + op + ' ' + R.trim()).replace(/\\s+/g, ' ') };
      if (selector(o, isVer(L) ? L : R)) selectors.push(h); else hits.push(h); }
  }
""",
"""  // the semver.js form (header): <sv>.cmp(A, B) on one side of the equality, 0 on the other; a HIT when one argument is
  // a version expression and the other a 3-digit literal, a quoted one, a dotted string literal or an era identifier
  const isExact = e => { const q = /^(['"])(.*)\\1$/.exec(stripWrap(e, svs)); return isEra(e) || (!!q && DOTTED.test(q[2])); };
  const svCmp = (side, zero) => { if (stripWrap(zero, svs) !== '0') return null;
    const s = stripWrap(side, svs), mm = new RegExp('^' + SVA + '\\\\s*\\\\.\\\\s*cmp\\\\s*\\\\(').exec(s);
    if (!mm || matchClose(s, mm[0].length - 1) !== s.length - 1) return null;
    const args = topSplit(s.slice(mm[0].length, -1), ','); return args.length === 2 ? args : null; };
  const svHit = (L, R) => { const c = svCmp(L, R) || svCmp(R, L); if (!c) return null;
    return (isVer(c[0]) && isExact(c[1])) ? c[0] : (isVer(c[1]) && isExact(c[0])) ? c[1] : null; };
  // equality operands
  const hits = []; const eq = /[!=]==?/g;
  while ((m = eq.exec(code))) {
    const o = m.index, op = m[0], e = o + op.length;
    if (/[=!<>]/.test(code[o - 1] || '') || code[e] === '=' || code[e] === '>') continue;
    const L = operand(code, o, -1), R = operand(code, e, +1);
    const vs = ((isVer(L) && isEra(R)) || (isVer(R) && isEra(L))) ? (isVer(L) ? L : R) : svHit(L, R);
    if (vs) {
      const h = { line: lineAt(o), kind: op, expr: (L.trim() + ' ' + op + ' ' + R.trim()).replace(/\\s+/g, ' ') };
      if (selector(o, vs)) selectors.push(h); else hits.push(h); }
  }
"""),
]

TS = 'tests/tooling_selftest.sh'
ts_pairs = [
# header: what the toys plant
("""# era_bump.py's dotted path (Post-V239 semver). The version_scope.js toys (G5, V2 to V5) plant CUR only: version_scope.js
# counts a compare against a 3-digit literal, and a dotted NEXT is neither a hit nor valid JS.
""",
"""# era_bump.py's dotted path (Post-V239 semver). The version_scope.js toys' base files (V2 to V5) compare CUR in the legacy
# form (VER === CUR, a bare 3-digit literal), which reads only while CUR is a bare integer; the planted rows (G5, V3, V4)
# plant SV.cmp(VER, 'NEXT') === 0, a dotted NEXT, so version_scope.js's semver path is exercised (post-V239 slice 2c).
"""),
# G5: e_pass.js plants the dotted semver form; at runtime it prints nothing, as VER !== CUR printed nothing
("""printf "const IA = { version: '%s' }, VER = +IA.version;\\nif (VER !== %s) console.log('planted exact-version row');\\nconsole.log('PASS 2 FAIL 0');\\n" "$CUR" "$CUR" > "$GA/tests/gates/e_pass.js"
""",
"""printf "const path = require('path'), SV = require(path.join(__dirname, '..', 'semver.js'));\\nconst IA = { version: '%s' }, VER = SV.parse(IA.version);\\nif (SV.cmp(VER, '%s') === 0) console.log('planted exact-version row');\\nconsole.log('PASS 2 FAIL 0');\\n" "$CUR" "$NEXT" > "$GA/tests/gates/e_pass.js"
"""),
# V3: the row planted in the clean gate
("""printf 'if (VER === %s) console.log("planted");\\n' "$CUR" >> "$VT/gates/clean.js"
""",
"""printf "if (SV.cmp(VER, '%s') === 0) console.log(\\"planted\\");\\n" "$NEXT" >> "$VT/gates/clean.js"
"""),
# V4: the row planted over debt1's count
("""printf 'if (VER === %s) console.log("planted");\\n' "$CUR" >> "$VT/gates/debt1.js"
""",
"""printf "if (SV.cmp(VER, '%s') === 0) console.log(\\"planted\\");\\n" "$NEXT" >> "$VT/gates/debt1.js"
"""),
]

# every anchor of both files is checked before either file is written
p1, s1 = apply(VS, vs_pairs)
p2, s2 = apply(TS, ts_pairs)
p1.write_text(s1, encoding='utf-8')
p2.write_text(s2, encoding='utf-8')
print('post_v239_semver_s2c: %s %d hunks, %s %d hunks' % (VS, len(vs_pairs), TS, len(ts_pairs)))
