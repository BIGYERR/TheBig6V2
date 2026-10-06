// Post-V233 measure T (tooling inventory): era rows, brittle source pins, throw-on-missing-row shape.
// Read-only. Usage: node tests/measure/v233_tooling_inventory.js <outdir>
// Oracle: git history between release tags (rows added per build), the gate source text itself.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), OUT = process.argv[2];
if (!OUT) { console.error('usage: <outdir>'); process.exit(2); }
const git = a => cp.execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const GD = path.join(ROOT, 'tests', 'gates');
const gates = fs.readdirSync(GD).filter(f => f.endsWith('.js')).sort();
const files = ['tests/harness.js'].concat(gates.map(g => 'tests/gates/' + g));
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
const W = (n, s) => fs.writeFileSync(path.join(OUT, n), s);

// ---- 1. era tables: any identifier with >=2 `ID[NNN] =` rows or a `ID = { NNN:` declaration
const tables = {};
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8'), lines = src.split('\n');
  lines.forEach((l, i) => {
    let m = l.match(/^\s*([A-Za-z_$][\w$]*)\[(2\d\d)\]\s*=/);
    if (m) { const k = f + '|' + m[1]; (tables[k] = tables[k] || { rows: [], decl: null }).rows.push([+m[2], i + 1]); }
    m = l.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{\s*(2\d\d)\s*:/);
    if (m) { const k = f + '|' + m[1]; (tables[k] = tables[k] || { rows: [], decl: null }).decl = i + 1; tables[k].rows.push([+m[2], i + 1]); }
    m = l.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*_BY_VERSION|ERA)\s*=\s*\{/);
    if (m) { const k = f + '|' + m[1]; (tables[k] = tables[k] || { rows: [], decl: null }).decl = i + 1; }
  });
}
// literal keys inside a multi-line declaration: scan from decl to the matching close
for (const k of Object.keys(tables)) {
  const [f, id] = k.split('|'); const t = tables[k]; if (!t.decl) continue;
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  let depth = 0;
  for (let i = t.decl - 1; i < lines.length; i++) {
    const l = lines[i];
    if (depth === 1 || i === t.decl - 1) { const mm = [...l.matchAll(/(?:^|[{,]\s*)(2\d\d)\s*:/g)]; mm.forEach(x => { if (!t.rows.some(r => r[0] === +x[1])) t.rows.push([+x[1], i + 1]); }); }
    for (const c of l.replace(/'[^']*'|"[^"]*"/g, '')) { if (c === '{') depth++; else if (c === '}') depth--; }
    if (depth <= 0 && i >= t.decl - 1) break;
  }
}
// rows added between consecutive release tags
const builds = []; for (let n = 224; n <= 233; n++) builds.push(n);
const diffs = {}; for (const n of builds) diffs[n] = git(['diff', '-U0', 'V' + (n - 1), 'V' + n, '--', 'tests/harness.js', 'tests/gates']);
const fileDiff = (d, f) => { const parts = d.split(/^diff --git /m); const p = parts.find(x => x.startsWith('a/' + f + ' ')); return p || ''; };
let o = 'ERA TABLES (identifier with numeric 2xx rows)\n';
const eraRows = [];
for (const k of Object.keys(tables).sort()) {
  const [f, id] = k.split('|'), t = tables[k];
  const keys = t.rows.map(r => r[0]).sort((a, b) => a - b);
  const edits = builds.filter(n => { const fd = fileDiff(diffs[n], f); return new RegExp('^\\+\\s*' + id.replace(/\$/g, '\\$') + '\\[' + n + '\\]\\s*=', 'm').test(fd) || new RegExp('^\\+.*\\b' + n + '\\s*:', 'm').test(fd) && new RegExp(id).test(fd); });
  const r233 = t.rows.find(r => r[0] === 233), r232 = t.rows.find(r => r[0] === 232);
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  const shape = r233 ? src[r233[1] - 1].split('//')[0].trim() : '(none)';
  const rec = { f, id, decl: t.decl, nrows: keys.length, min: keys[0], max: keys[keys.length - 1], r232: r232 && r232[1], r233: r233 && r233[1], shape, edits };
  eraRows.push(rec);
  o += `${f}:${t.decl || '?'} ${id} rows=${keys.length} [${keys[0]}..${keys[keys.length - 1]}] [232]@${rec.r232 || '-'} [233]@${rec.r233 || '-'} shape233="${shape}" editedIn=${edits.length}/10 {${edits.join(',')}}\n`;
}
W('era_tables.out', o); console.log(o);

// ---- exact-version predicates outside tables (VER/ia-version compared with === / !== a literal 2xx)
let pv = '';
for (const f of files) {
  const s = strip(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
  s.forEach((l, i) => { if (/(VER|version|IA\.version|IP\.version|eraV)\s*(===|!==|==|!=)\s*2\d\d\b|\b2\d\d\s*(===|!==)\s*\+?(VER|IA\.version)/.test(l)) pv += `${f}:${i + 1}: ${l.trim().slice(0, 200)}\n`; });
}
W('exact_predicates.out', pv); console.log('EXACT-VERSION PREDICATES lines: ' + pv.split('\n').filter(Boolean).length);

// ---- 3. throw shape: `throw` at top level (not inside try) near a version lookup
let th = '';
for (const f of files) {
  const s = strip(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
  s.forEach((l, i) => { if (/\bthrow\b/.test(l) && /version|VER|ROW|row|ERA|era/.test(l)) th += `${f}:${i + 1}: ${l.trim().slice(0, 220)}\n`; });
}
W('throws.out', th); console.log('THROW-ON-VERSION lines:\n' + th);

// ---- 2. source-text reads: sites per gate
const pats = {
  readHtml: /readFileSync\([^)]*\)/,
  extractInlineJS: /extractInlineJS\s*\(/,
  fnToString: /\.toString\(\)/,
  srcIndexOf: /\b(src|SRC|html|HTML|js|JS|text|txt|body|fnSrc|fsrc|code|raw|source|S)\b\s*\.\s*(indexOf|includes|match|matchAll|split|search|lastIndexOf|count)\s*\(/,
  regexTestSrc: /\.test\(\s*(src|SRC|html|HTML|js|JS|body|fnSrc|fsrc|code|raw|source)\b/,
  lineNumber: /split\(['"]\\n['"]\)/,
  literalDigest: /['"][0-9a-f]{16}['"]/,
};
let bs = 'gate | ' + Object.keys(pats).join(' | ') + '\n'; const tot = {}; let gatesWithSrc = 0;
for (const f of files) {
  const s = strip(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
  const c = {}; Object.keys(pats).forEach(p => { c[p] = s.filter(l => pats[p].test(l)).length; tot[p] = (tot[p] || 0) + c[p]; });
  const srcSites = c.extractInlineJS + c.fnToString + c.srcIndexOf + c.regexTestSrc;
  if (srcSites) gatesWithSrc++;
  bs += `${f} | ` + Object.keys(pats).map(p => c[p]).join(' | ') + '\n';
}
bs += 'TOTAL | ' + Object.keys(pats).map(p => tot[p]).join(' | ') + `\ngates with >=1 source-text site: ${gatesWithSrc}/${files.length}\n`;
W('source_sites.out', bs); console.log(bs.split('\n').slice(-3).join('\n'));
// literal digests listing
let ld = '';
for (const f of files) { const s = strip(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n'); s.forEach((l, i) => { const m = l.match(/['"]([0-9a-f]{16})['"]/g); if (m) ld += `${f}:${i + 1}: ${m.join(',')}\n`; }); }
W('literal_digests.out', ld);
const mannyNow = require(path.join(ROOT, 'tests', 'harness.js')).MANNY_DIGEST_BY_VERSION[233];
console.log('literal 16-hex lines: ' + ld.split('\n').filter(Boolean).length + '; lines carrying the current MANNY digest ' + mannyNow + ': ' + ld.split('\n').filter(l => l.includes(mannyNow)).length);

// ---- 2b. assertion-level source-text count (heuristic, disclosed): an assertion statement
// (ok( / eq( / bad( / check( at statement start) whose own line names a source-derived identifier.
// Source-derived = assigned from .html / readFileSync / extractInlineJS / .toString() / a body-grab helper,
// transitively one hop. Tokenizer gates (a RX_WORDS/KW keyword set = string-literal lexer) are flagged COPY.
const SRCX = /(\.html\b|readFileSync\(|extractInlineJS\(|\.toString\(\)|\bgrab\(|\bfnOf\(|\bbodyOf\(|\bsliceOf\(|\bfnBody\(|census\()/;
let ac = 'gate | assertions | srcAssertions | copyLexer\n'; let A = 0, B = 0, Bcopy = 0, Bpos = 0; const perGate = [];
for (const f of files.slice(1)) {
  const s = strip(fs.readFileSync(path.join(ROOT, f), 'utf8')); const L = s.split('\n');
  const ids = new Set(['RAW', 'SRC', 'HTML', 'html', 'src']);
  for (let pass = 0; pass < 2; pass++) L.forEach(l => { const m = l.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.*)$/); if (m && (SRCX.test(m[2]) || [...ids].some(id => new RegExp('\\b' + id + '\\b').test(m[2]) && /split|slice|match|indexOf|substring|replace|exec/.test(m[2])))) ids.add(m[1]); });
  const idRe = new RegExp('\\b(' + [...ids].map(x => x.replace(/\$/g, '\\$')).join('|') + ')\\b|\\.html\\.(indexOf|includes|match|split)');
  const asserts = L.filter(l => /^\s*(?:\}\s*)?(?:if\s*\([^)]*\)\s*)?(ok|eq|bad|check|okRow|assert)\s*\(/.test(l));
  const srcA = asserts.filter(l => idRe.test(l));
  const posA = srcA.filter(l => /lines\[|line\s*===|lineOf|\bline\s*[<>=]/.test(l));
  const copy = /RX_WORDS|const KW = new Set|REGEX_WORDS|const kw = \/\(\?:return/.test(s);
  A += asserts.length; B += srcA.length; if (copy) Bcopy += srcA.length; Bpos += posA.length;
  if (srcA.length) perGate.push([f, asserts.length, srcA.length, copy ? 'COPY' : '']);
  ac += `${f} | ${asserts.length} | ${srcA.length} | ${copy ? 'COPY' : ''}\n`;
}
ac += `TOTAL assertion statements ${A}; naming a source-derived identifier ${B} in ${perGate.length} gates; of those in copy-lexer gates ${Bcopy}; positional (line index) ${Bpos}\n`;
W('source_assertions.out', ac); console.log(ac.split('\n').slice(-2).join('\n'));
