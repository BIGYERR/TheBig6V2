#!/usr/bin/env node
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
// Also NOT a hit (post-V233 A2), a SELECTOR: `(B && +B.version === NNN) ? B : null`, the equality inside the condition
// of a ternary assigned to a name that is not a version binding, whose consequent is that same object B and whose
// alternate is null or undefined, where B is loaded (load(...)) from argv[3], directly or through one binding, and is
// never bound from the candidate path. The comparison only chooses which pinned file a live row reads as its oracle
// (g208_d103a_readers' E3e and its V213 tree). --list prints each selector as a `# selector (not a hit)` line.
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
    asg.push({ name, rhs: code.slice(re.lastIndex, k), rhsNc: nc.slice(re.lastIndex, k), prevCh, from: re.lastIndex, to: k });
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
  // SELECTOR (post-V233 A2; header): a baseline object B loaded from argv[3] (directly or through one binding) and never
  // bound from the candidate path, its version compared to an era in the condition of `cond ? B : null`.
  const ARGV3 = /\bprocess\s*\.\s*argv\s*\[\s*3\s*\]/, ARGV2 = /\bprocess\s*\.\s*argv\s*\[\s*2\s*\]/;
  const argv3 = new Set(asg.filter(a => ARGV3.test(a.rhs)).map(a => a.name));
  const baseObjs = new Set(asg.filter(a => /\bload\s*\(/.test(a.rhs) && (ARGV3.test(a.rhs) || mentions(a.rhs, argv3))).map(a => a.name));
  for (const a of asg) if (mentions(a.rhs, candPath) || ARGV2.test(a.rhs)) baseObjs.delete(a.name);
  baseObjs.delete('IA'); for (const c of candPath) baseObjs.delete(c);
  const selectors = [];
  const selector = (o, verSide) => {
    const mm = new RegExp('^(' + ID + ')\\s*\\.\\s*(version|IA_VERSION)$').exec(stripWrap(verSide)); if (!mm || !baseObjs.has(mm[1])) return false;
    const a = asg.filter(z => z.from <= o && o < z.to).sort((x, y) => (x.to - x.from) - (y.to - y.from))[0];
    if (!a || vers.has(a.name)) return false;
    const lead = a.rhs.length - a.rhs.replace(/^\s+/, '').length, t = ternaryBranches(a.rhs.trim());
    return !!t && o - a.from < lead + t[0].length && t[1].trim() === mm[1] && /^(null|undefined)$/.test(t[2].trim()); };
  // equality operands
  const hits = []; const eq = /[!=]==?/g;
  while ((m = eq.exec(code))) {
    const o = m.index, op = m[0], e = o + op.length;
    if (/[=!<>]/.test(code[o - 1] || '') || code[e] === '=' || code[e] === '>') continue;
    const L = operand(code, o, -1), R = operand(code, e, +1);
    if ((isVer(L) && isEra(R)) || (isVer(R) && isEra(L))) {
      const h = { line: lineAt(o), kind: op, expr: (L.trim() + ' ' + op + ' ' + R.trim()).replace(/\s+/g, ' ') };
      if (selector(o, isVer(L) ? L : R)) selectors.push(h); else hits.push(h); }
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
  return { hits: hits.sort((a, b) => a.line - b.line), selectors, vers: [...vers], objs: [...objs], eras: [...eras] };
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
    for (const f of files) for (const h of S[f].selectors) console.log('# selector (not a hit) ' + f + ':' + h.line + '\t' + h.expr);
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
