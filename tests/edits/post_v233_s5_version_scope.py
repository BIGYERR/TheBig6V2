#!/usr/bin/env python3
# post_v233_s5_version_scope.py — Post-V233 tooling pass, slice 5. TESTS ONLY.
#
# THE DECISION (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md; CLAUDE.md Proof scope,
# Version scope): "No gate row is scoped to one exact `ia-version`. A row uses a range or a minimum, or it is an
# era row the era script bumps; a claim that one build moved nothing is an era row." Evidence: measure mE
# (tests/measure/v233_rulings/measure_exact_version_mE.md), 139 exact-version rows in 29 gates. Converting them
# is a later slice; THIS slice makes the rule enforceable so no new one lands.
#
# index.html is NOT touched and ia-version stays 233: no version bump, so no meta replacement to put last.
#
# Diff classes:
#   (T-g) NEW tests/version_scope.js (static scan of tests/gates/*.js, comments and string bodies blanked) and
#         NEW tests/version_scope_debt.txt (one line per gate with hits today; the list only shrinks).
#   (T-h) tests/gate.sh step 2b runs version_scope.js after step 2; a red is graded like a gate (slice 1's RED
#         accounting: RED=() now declared at 2b, `GATES RED k of m` counts the lint in m and prints outside the
#         step 4 block), the run goes on through step 5, and the script exits 1 at the end.
#   (T-i) tests/chain.js: a hunk confined to the <meta name="ia-version" content="N"> line prints VERSION BUMP
#         (gate.sh step 0), not OUTSIDE A FUNCTION, and does not make the verdict CROSS-CUTTING.
#
# Every anchor is asserted count==1 against the text it is applied to; ALL anchors in ALL files are checked, and
# the new files are checked absent, before ANY file is written. The script aborts on the first miss.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)

NEW = {}
EDITS = {}

# ── (T-g) new files ──────────────────────────────────────────────────────────
NEW[P('tests', 'version_scope.js')] = r'''#!/usr/bin/env node
// Version scope lint. Post-V233 decision (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md;
// CLAUDE.md Proof scope, Version scope): "No gate row is scoped to one exact `ia-version`. A row uses a range or a
// minimum, or it is an era row the era script bumps; a claim that one build moved nothing is an era row."
//
//   node tests/version_scope.js            check every tests/gates/*.js against tests/version_scope_debt.txt
//   node tests/version_scope.js --gates    print the gate files that still carry debt, one per line
//   node tests/version_scope.js --list     print every hit as file:line (no debt check)
//
// A static scan, comments and string bodies blanked. A HIT is an equality or inequality (=== == !== !=, or a
// `case` in a switch on a version) where one side is a VERSION EXPRESSION and the other a 3-digit literal (or a
// quoted one), or an identifier the gate assigns a 3-digit literal (ERA and the like). VERSION EXPRESSION: VER,
// CAND_VER, BASE_VER, IA_VERSION; <X>.version or <X>.IA_VERSION where X is IA, IB, or anything the gate binds one
// hop from the candidate path (process.argv[2]); any identifier the gate assigns from one of these (through +
// Number() parseInt() String(), a `|| fallback`, or a ternary branch) or from the ia-version meta.
// NOT hits: era-table lookups (T[+IA.version]); >= <= < >; arithmetic on the era side (STAMP === ERA - 1 is the
// IA_ASSUME_VERSION pre-bump licence); and the version of a fixture loaded from argv[3] or a pinned commit
// (+b.version === BASE_ERA is the fixture's provenance, not today's ia-version) unless the gate copies it into a
// version binding (BASE_VER, or a name read from the ia-version meta), which is a hit.
//
// The debt file holds one line per gate with hits today: `<gate file> <hit count>  # <comment>`. A gate with hits
// and no line, or more hits than its line, FAILs by name (a new exact-version row). Fewer hits than its line FAILs
// `stale debt: <gate> now <n>, lower the line`, so the list only shrinks and never rots. Prints PASS n FAIL n.
'use strict';
const fs = require('fs'), path = require('path');
const GD = path.join(__dirname, 'gates');
const DEBT = path.join(__dirname, 'version_scope_debt.txt');

// ---- blanking: same length, newlines kept. code: comments, string, template and regex bodies blanked (a body
// that is exactly 3 digits is kept, so '233' still reads as a literal). nc: comments blanked, the rest kept.
function blank(src) {
  const n = src.length, code = src.split(''), nc = src.split('');
  const sp = (a, i) => { if (a[i] !== '\n') a[i] = ' '; };
  const stack = [];                                        // template nesting: brace depth inside each ${
  let i = 0, lastSig = '';
  const regexOk = () => lastSig === '' || /[(,=:\[!&|?{};+\-*%<>~^]$/.test(lastSig) ||
    /\b(return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/.test(lastSig);
  const sigTail = (j) => { let k = j - 1; while (k >= 0 && /\s/.test(code[k])) k--; let s = ''; while (k >= 0 && s.length < 12 && !/\s/.test(code[k])) { s = code[k] + s; k--; } return s; };
  const body = (from, to) => { // blank code[from..to) unless it is exactly three digits
    if (/^\d{3}$/.test(src.slice(from, to))) return; for (let k = from; k < to; k++) sp(code, k); };
  function str(q) { const s = i + 1; let k = s; while (k < n && src[k] !== q && src[k] !== '\n') { if (src[k] === '\\') k++; k++; } body(s, Math.min(k, n)); i = k + 1; }
  function tmpl() { // at the char after ` or after the } closing a ${ }
    let k = i, s = i;
    while (k < n) { if (src[k] === '\\') { k += 2; continue; } if (src[k] === '`') { body(s, k); i = k + 1; return; }
      if (src[k] === '$' && src[k + 1] === '{') { body(s, k); stack.push(0); i = k + 2; return; } k++; }
    body(s, n); i = n;
  }
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') { sp(code, i); sp(nc, i); i++; } continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2), end = e < 0 ? n : e + 2; for (let k = i; k < end; k++) { sp(code, k); sp(nc, k); } i = end; continue; }
    if (c === '"' || c === "'") { str(c); lastSig = 'x'; continue; }
    if (c === '`') { i++; tmpl(); lastSig = 'x'; continue; }
    if (stack.length && c === '{') { stack[stack.length - 1]++; i++; lastSig = '{'; continue; }
    if (stack.length && c === '}') { if (stack[stack.length - 1] === 0) { stack.pop(); i++; tmpl(); lastSig = 'x'; continue; } stack[stack.length - 1]--; i++; lastSig = '}'; continue; }
    if (c === '/' && (lastSig = sigTail(i), regexOk())) {
      let k = i + 1, cls = false; while (k < n && src[k] !== '\n') { const ch = src[k]; if (ch === '\\') { k += 2; continue; } if (ch === '[') cls = true; else if (ch === ']') cls = false; else if (ch === '/' && !cls) break; k++; }
      body(i + 1, Math.min(k, n)); i = k + 1; while (i < n && /[a-z]/.test(src[i])) i++; lastSig = 'x'; continue;
    }
    if (!/\s/.test(c)) lastSig = c;
    i++;
  }
  return { code: code.join(''), nc: nc.join('') };
}

// ---- expression helpers over the blanked code ------------------------------------------------------------
const OPEN = '([{', CLOSE = ')]}';
function stripWrap(e) {
  let s = e.trim(), prev;
  do { prev = s;
    if (/^\+\s*/.test(s)) s = s.replace(/^\+\s*/, '');
    let m = /^(Number|parseInt|String|parseFloat)\s*\(/.exec(s);
    if (m && matchClose(s, m[0].length - 1) === s.length - 1) { s = s.slice(m[0].length, -1); s = topSplit(s, ',')[0].trim(); }
    if (s[0] === '(' && matchClose(s, 0) === s.length - 1) s = s.slice(1, -1).trim();
  } while (s !== prev);
  return s;
}
function matchClose(s, at) { let dep = 0; for (let k = at; k < s.length; k++) { if (OPEN.includes(s[k])) dep++; else if (CLOSE.includes(s[k])) { dep--; if (dep === 0) return k; } } return -1; }
function topSplit(s, sep) { const out = []; let dep = 0, last = 0; for (let k = 0; k < s.length; k++) { const c = s[k]; if (OPEN.includes(c)) dep++; else if (CLOSE.includes(c)) dep--; else if (dep === 0 && s.startsWith(sep, k)) { out.push(s.slice(last, k)); last = k + sep.length; k += sep.length - 1; } } out.push(s.slice(last)); return out; }
function ternaryBranches(s) { // [cond, a, b] at depth 0, or null
  let dep = 0, q = -1, nest = 0;
  for (let k = 0; k < s.length; k++) { const c = s[k];
    if (OPEN.includes(c)) dep++; else if (CLOSE.includes(c)) dep--;
    else if (dep === 0 && c === '?' && s[k + 1] !== '?' && s[k - 1] !== '?' && s[k + 1] !== '.') { if (q < 0) q = k; else nest++; }
    else if (dep === 0 && c === ':' && q >= 0) { if (nest) nest--; else return [s.slice(0, q), s.slice(q + 1, k), s.slice(k + 1)]; } }
  return null;
}
const ID = '[A-Za-z_$][\\w$]*';

function analyse(src) {
  const { code, nc } = blank(src);
  const lineAt = o => { let l = 1; for (let k = 0; k < o; k++) if (code[k] === '\n') l++; return l; };
  // assignments: NAME = RHS (declarator or plain), RHS to the first depth-0 , ; or closing bracket or newline
  const asg = []; const re = new RegExp('(^|[^\\w$.])(' + ID + ')\\s*=(?![=>])', 'g'); let m;
  while ((m = re.exec(code))) {
    const name = m[2]; if (/^(if|return|case|typeof|in|of|new)$/.test(name)) continue;
    const prevCh = code[m.index + m[1].length - 1 >= 0 ? m.index + m[1].length - 1 : 0];
    if (m[1] === '' && m.index > 0) continue;
    let k = re.lastIndex, dep = 0;
    for (; k < code.length; k++) { const c = code[k];
      if (OPEN.includes(c)) dep++; else if (CLOSE.includes(c)) { if (dep === 0) break; dep--; }
      else if (dep === 0 && (c === ',' || c === ';')) break;
      else if (dep === 0 && c === '\n') { const rest = code.slice(k + 1).match(/^\s*(\S)/); if (!rest || !/[?:.+\-*/|&]/.test(rest[1])) break; } }
    asg.push({ name, rhs: code.slice(re.lastIndex, k), rhsNc: nc.slice(re.lastIndex, k), prevCh });
  }
  // version objects: IA and IB by name, and anything bound one hop from the candidate path (process.argv[2], or the
  // first name destructured from process.argv.slice(2)). A fixture the gate loads from argv[3] or a pinned commit is
  // not one: comparing its version is provenance, unless the gate copies it into a version binding (BASE_VER).
  const objs = new Set(['IA', 'IB']), vers = new Set(['VER', 'CAND_VER', 'BASE_VER', 'IA_VERSION']), eras = new Set();
  const mentions = (rhs, set) => [...set].some(x => new RegExp('(^|[^\\w$.])' + x.replace(/\$/g, '\\$') + '(?![\\w$])').test(rhs));
  const candPath = new Set(); let dm;
  const dre = new RegExp('\\[\\s*(' + ID + ')[^\\]]*\\]\\s*=\\s*process\\s*\\.\\s*argv\\s*\\.\\s*slice\\s*\\(\\s*2\\s*\\)', 'g');
  while ((dm = dre.exec(code))) candPath.add(dm[1]);
  for (const a of asg) if (/\bprocess\s*\.\s*argv\s*\[\s*2\s*\]/.test(a.rhs)) candPath.add(a.name);
  for (const a of asg) if (mentions(a.rhs, candPath) || /\bprocess\s*\.\s*argv\s*\[\s*2\s*\]/.test(a.rhs)) objs.add(a.name);
  const isVer = e => { const s = stripWrap(e); let mm;
    if ((mm = new RegExp('^(' + ID + ')$').exec(s))) return vers.has(mm[1]);
    if ((mm = new RegExp('^(' + ID + ')\\s*\\.\\s*(version|IA_VERSION)$').exec(s))) return objs.has(mm[1]);
    return false; };
  const isEra = e => { const s = stripWrap(e); let mm;
    if (/^\d{3}$/.test(s) || /^(['"])\d{3}\1$/.test(s)) return true;
    if ((mm = new RegExp('^(' + ID + ')$').exec(s))) return eras.has(mm[1]);
    return false; };
  const fromVer = rhs => { const s = topSplit(topSplit(rhs, '||')[0], '??')[0];
    if (isVer(s)) return true;
    const t = ternaryBranches(rhs.trim()); return !!t && (isVer(t[1]) || isVer(t[2])); };
  for (const a of asg) if (/^\s*\(?\s*\d{3}\s*\)?\s*$/.test(a.rhs)) eras.add(a.name);
  for (let changed = true; changed;) { changed = false;
    for (const a of asg) if (!vers.has(a.name) && (fromVer(a.rhs) || (/ia-version/.test(a.rhsNc) && /\.\s*(match|exec)\s*\(/.test(a.rhsNc)))) { vers.add(a.name); changed = true; } }
  // equality operands
  const hits = []; const eq = /[!=]==?/g;
  while ((m = eq.exec(code))) {
    const o = m.index, op = m[0], e = o + op.length;
    if (/[=!<>]/.test(code[o - 1] || '') || code[e] === '=' || code[e] === '>') continue;
    const L = operand(code, o, -1), R = operand(code, e, +1);
    if ((isVer(L) && isEra(R)) || (isVer(R) && isEra(L))) hits.push({ line: lineAt(o), kind: op, expr: (L.trim() + ' ' + op + ' ' + R.trim()).replace(/\s+/g, ' ') });
  }
  // switch (version) { case NNN: }
  const sw = /\bswitch\s*\(/g;
  while ((m = sw.exec(code))) {
    const p = m.index + m[0].length - 1, pc = matchClose(code, p); if (pc < 0) continue;
    if (!isVer(code.slice(p + 1, pc))) continue;
    const b = code.indexOf('{', pc), bc = b < 0 ? -1 : matchClose(code, b); if (bc < 0) continue;
    const blk = code.slice(b + 1, bc); let dep = 0;
    for (let k = 0; k < blk.length; k++) { const c = blk[k]; if (OPEN.includes(c)) dep++; else if (CLOSE.includes(c)) dep--;
      else if (dep === 0 && /\bcase\b/.test(blk.slice(k, k + 5)) && !/[\w$]/.test(blk[k - 1] || '')) {
        const colon = blk.indexOf(':', k); const lab = blk.slice(k + 4, colon);
        if (isEra(lab)) hits.push({ line: lineAt(b + 1 + k), kind: 'case', expr: 'switch ' + code.slice(p, pc + 1).replace(/\s+/g, ' ') + ' case ' + lab.trim() }); } }
  }
  return { hits: hits.sort((a, b) => a.line - b.line), vers: [...vers], objs: [...objs], eras: [...eras] };
}
function operand(code, at, dir) { // the equality operand next to `at`, stopped at a depth-0 delimiter
  let k = dir < 0 ? at - 1 : at, dep = 0, got = '';
  const stopTok = /^(&&|\|\||\?\?)$/;
  for (; dir < 0 ? k >= 0 : k < code.length; k += dir) {
    const c = code[k], two = dir < 0 ? code.slice(k - 1, k + 1) : code.slice(k, k + 2);
    if ((dir < 0 ? CLOSE : OPEN).includes(c)) { if (c === '{' || c === '}') { if (dep === 0) break; } dep++; }
    else if ((dir < 0 ? OPEN : CLOSE).includes(c)) { if (dep === 0) break; dep--; }
    else if (dep === 0) {
      if (stopTok.test(two) || c === ',' || c === ';' || c === '?' || c === ':') break;
      if (c === '=' || (c === '!' && code[k + 1] === '=')) break;          // assignment or another (in)equality
      if (c === '>' && code[k - 1] === '=') break;                         // arrow
      if (c === '\n' && got.trim()) break;
      if (dir < 0 && /[\w$]/.test(c) && /\b(return|case|typeof|throw)$/.test(code.slice(Math.max(0, k - 6), k + 1)) && !/[\w$]/.test(code[k + 1] || '')) { got = got.replace(/^\s*\w*/, ''); break; }
    }
    got = dir < 0 ? c + got : got + c;
  }
  return got;
}

function scanAll(dir) {
  const out = {};
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js')).sort()) out[f] = analyse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
}
function readDebt() {
  const debt = {}, bad = [];
  if (!fs.existsSync(DEBT)) return { debt, bad: ['no debt file ' + path.relative(path.dirname(__dirname), DEBT) + ' (an empty list is a file with no gate lines, not a missing file)'] };
  fs.readFileSync(DEBT, 'utf8').split('\n').forEach((raw, k) => {
    const l = raw.replace(/#.*$/, '').trim(); if (!l) return;
    const m = /^(\S+\.js)\s+(\d+)$/.exec(l);
    if (!m) { bad.push('debt file line ' + (k + 1) + ' unreadable: ' + raw.trim()); return; }
    if (m[1] in debt) { bad.push('debt file line ' + (k + 1) + ' repeats ' + m[1]); return; }
    debt[m[1]] = +m[2];
  });
  return { debt, bad };
}

if (require.main === module) {
  const arg = process.argv[2] || '';
  if (arg && !/^--(gates|list)$/.test(arg)) { process.stderr.write('usage: node tests/version_scope.js [--gates|--list]\n'); process.exit(2); }
  if (arg === '--gates') { const { debt, bad } = readDebt(); if (bad.length) { bad.forEach(b => process.stderr.write(b + '\n')); process.exit(2); }
    Object.keys(debt).filter(g => debt[g] > 0).sort().forEach(g => console.log(g)); process.exit(0); }
  const S = scanAll(GD), files = Object.keys(S);
  if (arg === '--list') { let n = 0, g = 0;
    for (const f of files) { if (!S[f].hits.length) continue; g++; for (const h of S[f].hits) { n++; console.log(f + ':' + h.line + '\t' + h.expr); } }
    console.log('HITS ' + n + ' in ' + g + ' gates of ' + files.length); process.exit(0); }
  const { debt, bad } = readDebt(); let P = 0, F = 0;
  const showHits = f => S[f].hits.forEach(h => console.log('    ' + f + ':' + h.line + '  ' + h.expr));
  for (const b of bad) { F++; console.log('FAIL ' + b); }
  for (const f of files) {
    const n = S[f].hits.length, d = debt[f];
    if (n && d === undefined) { F++; console.log('FAIL new exact-version row: ' + f + ' has ' + n + ' exact-version hit' + (n > 1 ? 's' : '') + ' and no debt line (use a range, a minimum or an era row)'); showHits(f); }
    else if (d !== undefined && n > d) { F++; console.log('FAIL new exact-version row: ' + f + ' has ' + n + ' exact-version hits, its debt line says ' + d + ' (use a range, a minimum or an era row)'); showHits(f); }
    else if (d !== undefined && n < d) { F++; console.log('FAIL stale debt: ' + f + ' now ' + n + ', lower the line'); }
    else P++;
  }
  for (const g of Object.keys(debt)) if (!(g in S)) { F++; console.log('FAIL stale debt: ' + g + ' now 0, lower the line (no such gate in tests/gates)'); }
  const tot = Object.values(debt).reduce((a, b) => a + b, 0);
  console.log('version scope: ' + files.length + ' gates scanned; debt ' + Object.keys(debt).length + ' gates, ' + tot + ' hits (tests/version_scope_debt.txt)');
  console.log('PASS ' + P + ' FAIL ' + F);
  process.exit(F ? 1 : 0);
}
module.exports = { blank, analyse, scanAll, readDebt };
'''

NEW[P('tests', 'version_scope_debt.txt')] = r'''# Version scope debt, read by tests/version_scope.js (gate.sh step 2b).
# Post-V233 decision (Mario; CLAUDE.md Proof scope, Version scope): no gate row is scoped to one exact ia-version.
# One line per gate that still holds exact-version hits:  <gate file> <hit count>  # <comment>
# THIS LIST ONLY SHRINKS. A gate with hits and no line, or more hits than its line, FAILs by name (a new
# exact-version row). Fewer hits than its line FAILs as stale debt until the line is lowered (deleted at 0).
# A hit is a source predicate, not a row: one predicate gates many rows (g219: PAIR = VER === ERA gates 9).
# The comment carries measure mE's row count and classes i/ii/iii
# (tests/measure/v233_rulings/measure_exact_version_mE.md); "not in mE" marks a gate mE's dark-row census missed.
g193_budget_floor.js 8  # 0 rows (not in mE): baseline licences on BASE_VER === '192' / '197' / '198'
g206_d137_runbase_chi.js 1  # 1 rows, mE classes 0/1/0
g207_gk_trial_present.js 2  # 1 rows, mE classes 0/1/0
g207_test_week.js 3  # 5 rows, mE classes 0/5/0
g208_d103a_chip.js 3  # 3 rows, mE classes 0/3/0
g208_d103a_key.js 1  # 1 rows, mE classes 0/1/0
g208_d103a_readers.js 5  # 7 rows, mE classes 0/7/0
g208_d104a_runbase.js 3  # 2 rows, mE classes 0/2/0
g209_d140_tier.js 1  # 4 rows, mE classes 0/4/0
g210_equipment_denials.js 1  # 1 rows, mE classes 0/1/0
g211_d153_d155.js 1  # 15 rows, mE classes 0/15/0
g212_d110a_swim.js 1  # 10 rows, mE classes 2/6/2
g213_d113a.js 1  # 7 rows, mE classes 1/5/1
g214_d158_eve.js 4  # 3 rows, mE classes 0/3/0
g215_d149_ghd.js 2  # 2 rows, mE classes 0/2/0
g216_d154_swap_lens.js 1  # 4 rows, mE classes 0/4/0
g216_d156_longday.js 1  # 5 rows, mE classes 0/5/0
g217_d160_dedupe_view.js 1  # 17 rows, mE classes 0/17/0
g218_d157_swim_sizer.js 1  # 10 rows, mE classes 1/9/0
g219_d167_pairs.js 1  # 9 rows, mE classes 0/8/1
g220_d174_emoji.js 2  # 0 rows (not in mE): bver === '219', a baseline version read from the ia-version meta
g221_d177_swapfloor.js 5  # 6 rows, mE classes 2/3/1
g221_d178_active.js 5  # 8 rows, mE classes 0/7/1
g221_d179_donenav.js 5  # 3 rows, mE classes 0/2/1
g221_d180_blockopen.js 5  # 4 rows, mE classes 0/3/1
g222_d181_durable.js 4  # 3 rows, mE classes 0/3/0
g223_d184_testlen.js 1  # 4 rows, mE classes 0/2/2
g229_d194_lens.js 1  # 1 rows, mE classes 0/0/1
g230_d194_lens2.js 1  # 1 rows, mE classes 0/0/1
g232_d199_runwheel.js 2  # 1 rows, mE classes 0/1/0
g233_d207_bikewheel.js 2  # 1 rows, mE classes 0/1/0
'''

# ── (T-h) tests/gate.sh ──────────────────────────────────────────────────────
EDITS[P('tests', 'gate.sh')] = [
# 1. step 2b, right after step 2's last line
(r'''echo "   0 new duplicates"
''',
r'''echo "   0 new duplicates"

echo "== 2b. version scope (no gate row is scoped to one exact ia-version)"
# Post-V233 (Mario; CLAUDE.md Proof scope, Version scope): a row uses a range, a minimum, or an era row the era
# script bumps. version_scope.js scans tests/gates/*.js against tests/version_scope_debt.txt: a new exact-version
# row, or a debt line that no longer matches, is red. A red HERE is graded like a red gate, not like steps 0 to 3:
# its lines print, its name joins RED, the run goes on through step 5, and the script exits 1 at the end.
RED=()   # names of the red gates (and of this lint), in order; read after step 5 for the exit code
rm -f "$TMP/vscope.txt"   # delete artifacts before regenerating them
VSRC=0; node "$HERE/version_scope.js" > "$TMP/vscope.txt" 2>&1 || VSRC=$?
VSUM="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$TMP/vscope.txt" || true)"
if [ "$VSRC" = "0" ] && [ -n "$VSUM" ] && [ "$(echo "$VSUM" | awk '{print $4}')" = "0" ]; then
  echo "   version_scope.js: $VSUM"
elif [ -z "$VSUM" ]; then
  echo "FAIL: version_scope.js printed no PASS/FAIL summary (crash?, exit $VSRC)"; tail -20 "$TMP/vscope.txt" || true
  RED+=("version_scope.js")
else
  echo "FAIL: version_scope.js: $VSUM (exit $VSRC)"
  grep -E '^FAIL|^    ' "$TMP/vscope.txt" | head -60 || true
  RED+=("version_scope.js")
fi
'''),
# 2. RED is declared at step 2b now; step 4 must not reset it
(r'''RED=()   # names of the red gates, in glob order; read after step 5 for the exit code
''',
r'''# RED was declared at step 2b and may already hold version_scope.js; gate names append in glob order.
'''),
# 3. the step 4 invariant comment: 2b does not stop the run
(r'''  # then exits 1. Steps 0 to 3 still stop at once: nothing downstream of a bad
''',
r'''  # then exits 1. Steps 0, 1, 2 and 3 still stop at once (2b does not): nothing downstream of a bad
'''),
# 4. the RED summary prints outside the step 4 block (a lint red with zero gates still prints) and m counts the lint
(r'''  if [ ${#RED[@]} -gt 0 ]; then echo "GATES RED ${#RED[@]} of ${#GATES[@]}: ${RED[*]}"; fi
fi
''',
r'''fi
# m counts the version-scope lint (step 2b) with the gates: it is graded like one, and its red is in RED.
if [ ${#RED[@]} -gt 0 ]; then echo "GATES RED ${#RED[@]} of $(( ${#GATES[@]} + 1 )): ${RED[*]}"; fi
'''),
# 5. the closing comment names 2b as a source of reds
(r'''# Step 5 ran even if step 4 was red (its diff is still the blast radius to classify);
# the red gates decide the exit code here, and ALL GATES PASS prints only on zero reds.
''',
r'''# Step 5 ran even if step 2b or step 4 was red (its diff is still the blast radius to classify);
# the reds (gates and the version-scope lint) decide the exit code here, and ALL GATES PASS prints only on zero reds.
'''),
]

# ── (T-i) tests/chain.js ─────────────────────────────────────────────────────
EDITS[P('tests', 'chain.js')] = [
# 1. header: the meta hunk is named
(r'''// every changed line outside such a declaration (OUTSIDE A FUNCTION); the gate list (map reach of
''',
r'''// every changed line outside such a declaration (OUTSIDE A FUNCTION; a hunk confined to the ia-version meta
// line prints VERSION BUMP instead, proved by gate.sh step 0); the gate list (map reach of
'''),
# 2. classify the meta hunk before the OUTSIDE A FUNCTION listing; the verdict reads `outside`, which excludes it
(r'''const outside = diffLines(B.skel, C.skel).filter(h =>
  B.skel.slice(h.a0, h.a1).concat(C.skel.slice(h.b0, h.b1)).some(s => !isMark(s)));
console.log('OUTSIDE A FUNCTION hunks ' + outside.length);
''',
r'''const outsideAll = diffLines(B.skel, C.skel).filter(h =>
  B.skel.slice(h.a0, h.a1).concat(C.skel.slice(h.b0, h.b1)).some(s => !isMark(s)));
// A hunk confined to the <meta name="ia-version" content="N"> line (one line each side, different, and equal
// once the number is masked) is the version bump: gate.sh step 0 proves it, so it is not OUTSIDE A FUNCTION and
// does not make the verdict CROSS-CUTTING. Any other markup hunk, including one that touches the meta line AND
// anything else, keeps the default.
const META_RE = /^\s*<meta name="ia-version" content="(\d+)">/;
const maskVer = s => s.replace(META_RE, m => m.replace(/content="\d+"/, 'content="N"'));
const isBump = h => { const a = B.skel.slice(h.a0, h.a1), b = C.skel.slice(h.b0, h.b1);
  return a.length === 1 && b.length === 1 && META_RE.test(a[0]) && META_RE.test(b[0]) && a[0] !== b[0] && maskVer(a[0]) === maskVer(b[0]); };
const bumps = outsideAll.filter(isBump), outside = outsideAll.filter(h => !isBump(h));
console.log('VERSION BUMP hunks ' + bumps.length);
for (const h of bumps) console.log('  VERSION BUMP (gate.sh step 0)  base L' + (h.a0 + 1) + ' V' + META_RE.exec(B.skel[h.a0])[1] +
  '  cand L' + (h.b0 + 1) + ' V' + META_RE.exec(C.skel[h.b0])[1]);
console.log('OUTSIDE A FUNCTION hunks ' + outside.length);
'''),
]

# ── check everything, then write ─────────────────────────────────────────────
def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

out = {}
for f, content in NEW.items():
    if os.path.exists(f): die('new file already exists: ' + f)
    if '@@' + 'VERSION_SCOPE_JS@@' in content or '@@' + 'DEBT_TXT@@' in content: die('template not filled: ' + f)
    out[f] = content
for f, reps in EDITS.items():
    if not os.path.exists(f): die('missing ' + f)
    s = open(f, encoding='utf-8').read()
    for i, (a, b) in enumerate(reps):
        n = s.count(a)
        if n != 1: die('%s anchor %d count %d (want 1): %r' % (os.path.relpath(f, ROOT), i + 1, n, a[:90]))
        s = s.replace(a, b)
    out[f] = s
for f, s in out.items():
    with open(f, 'w', encoding='utf-8') as fh: fh.write(s)
    print('wrote', os.path.relpath(f, ROOT))
print('OK post_v233_s5_version_scope: %d new files, %d edited files' % (len(NEW), len(EDITS)))
