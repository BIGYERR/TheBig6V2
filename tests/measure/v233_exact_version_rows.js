// v233_exact_version_rows.js — Post-V233 measure mE: inventory gate code switched by equality to ONE ia-version.
// Usage: node tests/measure/v233_exact_version_rows.js scan   -> prints every comment-stripped line with an exact-version selector
'use strict';
const fs = require('fs'), path = require('path');
const GD = path.join(__dirname, '..', 'gates');
function strip(src) { // char-level: drop // and /* */ outside strings, template literals and regex-ish contexts (approximate: regex after ( , = : [ ! & | ? { } ; return)
  let out = '', i = 0, n = src.length, q = null, prev = '';
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (q) { out += c; if (c === '\\') { out += d || ''; i += 2; continue; } if (c === q || (q !== '`' && c === '\n')) q = null; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const chunk = src.slice(i, e < 0 ? n : e + 2); out += chunk.replace(/[^\n]/g, ''); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; }
    if (c === '/' && /[(,=:\[!&|?{};]$/.test(out.replace(/\s+$/, '')) ) { // regex literal
      out += c; i++; let cls = false;
      while (i < n && src[i] !== '\n') { const ch = src[i]; out += ch; i++; if (ch === '\\') { out += src[i]; i++; continue; } if (ch === '[') cls = true; else if (ch === ']') cls = false; else if (ch === '/' && !cls) break; }
      continue;
    }
    out += c; i++;
  }
  return out;
}
// selectors: literal 2xx equality either side, ===/!== against an ERA-ish/BASE-ish constant, PAIR-ish flags, IB.version equality
const PATS = [
  ['lit',   /(?:[!=]==?)\s*\(?\s*2\d\d\b|\b2\d\d\s*[!=]==?/],
  ['era',   /[!=]==?\s*[A-Z_]*ERA\b|\b[A-Z_]*ERA\s*[!=]==?/],
  ['pairflag', /\b(PAIR|isPair|IS_PAIR|PAIRSELF|BASE_OK|PAIR_OK)\b/],
  ['ver==', /\b(VER|version|IA_VERSION)\s*[!=]==?\s*[A-Za-z_(+]/],
];
function scan() {
  const rows = [];
  for (const f of fs.readdirSync(GD).filter(x => x.endsWith('.js')).sort()) {
    const L = strip(fs.readFileSync(path.join(GD, f), 'utf8')).split('\n');
    L.forEach((l, k) => { const hit = PATS.filter(p => p[1].test(l)).map(p => p[0]); if (hit.length) rows.push({ f, line: k + 1, kind: hit.join('+'), text: l.trim().slice(0, 220) }); });
  }
  return rows;
}
if (require.main === module) {
  const mode = process.argv[2] || 'scan';
  if (mode === 'scan') { const r = scan(); for (const x of r) console.log(`${x.f}:${x.line}\t[${x.kind}]\t${x.text}`); const byF = {}; r.forEach(x => byF[x.f] = (byF[x.f] || 0) + 1); console.log('SCAN lines', r.length, 'files', Object.keys(byF).length, 'of', fs.readdirSync(GD).filter(x => x.endsWith('.js')).length); }
}
module.exports = { strip, scan };

// ---- runner: node v233_exact_version_rows.js run <repoClone> <outDir> <tag> <jobs> <gate,gate,...|ALL> <stamp:N|ERA> <base:N|ERA-1>
// Runs each gate (from the CLONE's tests/gates, never the working tree) on a copy of the clone's index.html whose
// <meta ia-version> is restamped (the engine reads IA_VERSION only for the update banner and the bug-report line, so a
// restamp moves no card). stamp ERA = the gate's own build era, parsed from its source (forces every `VER === ERA` true).
function gateEra(src) {
  const s = strip(src); let m;
  if ((m = s.match(/\bERA\s*=\s*(2\d\d)\b/))) return +m[1];
  if ((m = s.match(/\bD\d+[A-Z]?_ERA\s*=\s*(2\d\d)\b/))) return +m[1];
  if ((m = s.match(/\bERA2\d\d\s*=\s*(2\d\d)\b/))) return +m[1];
  if ((m = s.match(/\bVER\s*===\s*(2\d\d)\b/))) return +m[1];
  if ((m = s.match(/\bPAIR\s*=\s*VER\s*===\s*(2\d\d)/))) return +m[1];
  return null;
}
function run(argv) {
  const [repo, out, tag, jobsS, list, stampS, baseS] = argv;
  const cp = require('child_process'), os = require('os');
  fs.mkdirSync(out, { recursive: true });
  const gdir = path.join(repo, 'tests', 'gates');
  const all = fs.readdirSync(gdir).filter(x => /^g.*\.js$/.test(x)).sort();
  const gates = list === 'ALL' ? all : list.split(',');
  const head = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
  const art = v => { const f = path.join(out, 'art_' + v + '.html'); if (!fs.existsSync(f)) { const t = head.replace(/(<meta name="ia-version" content=")\d+(")/, '$1' + v + '$2'); if (t === head && v !== 233) throw new Error('restamp no-op'); fs.writeFileSync(f, t); } return f; };
  const base = v => { const f = path.join(out, 'base_' + v + '.html'); if (!fs.existsSync(f)) fs.writeFileSync(f, cp.execFileSync('git', ['-C', repo, 'show', 'V' + v + ':index.html'], { maxBuffer: 1 << 27 })); return f; };
  const plan = gates.map(g => { const era = gateEra(fs.readFileSync(path.join(gdir, g), 'utf8'));
    const sv = stampS === 'ERA' ? era : +stampS, bv = baseS === 'ERA-1' ? (era ? era - 1 : null) : +baseS;
    return { g, era, sv, bv }; }).filter(p => p.sv);
  plan.forEach(p => { p.a = art(p.sv); p.b = p.bv ? base(p.bv) : null; });
  let i = 0, live = 0; const jobs = +jobsS, t0 = Date.now(), res = [];
  return new Promise(done => { const next = () => {
    while (live < jobs && i < plan.length) { const p = plan[i++]; live++; const st = Date.now();
      const args = [path.join(gdir, p.g), p.a].concat(p.b ? [p.b] : []);
      cp.execFile('node', args, { cwd: repo, maxBuffer: 1 << 28, timeout: 2400e3 }, (err, so, se) => {
        fs.writeFileSync(path.join(out, tag + '__' + p.g + '.out'), String(so) + String(se) + (err ? '\nEXIT ' + (err.code || err.signal) : ''));
        res.push(p.g + '\t' + p.sv + '\t' + (p.bv || '-') + '\t' + ((Date.now() - st) / 1000).toFixed(1)); live--;
        if (i >= plan.length && live === 0) { fs.writeFileSync(path.join(out, tag + '__index.tsv'), res.join('\n') + '\n'); console.log(tag, 'done', plan.length, 'gates', ((Date.now() - t0) / 1000).toFixed(0) + 's'); done(); } else next(); }); } };
    if (!plan.length) { console.log(tag, 'empty plan'); done(); } else next(); });
}
if (require.main === module && process.argv[2] === 'run') run(process.argv.slice(3));
if (require.main === module && process.argv[2] === 'eras') { const d = process.argv[3]; for (const g of fs.readdirSync(d).filter(x => /^g.*\.js$/.test(x)).sort()) console.log(g, gateEra(fs.readFileSync(path.join(d, g), 'utf8'))); }

// ---- compare: node v233_exact_version_rows.js cmp <dirA> <tagA> <dirB> <tagB>
// Per gate: summary (PASS n FAIL n SKIP n) for each run, then every row whose status differs between the runs.
// Row key = first two words after the status, digits folded to '#'; statuses: PASS FAIL SKIP SCOPED REFUSED.
function rowsOf(txt) {
  const out = [];
  for (const raw of txt.split('\n')) { const l = raw.trim(); let m;
    if ((m = l.match(/^(PASS|FAIL|SKIP|SCOPED OUT|REFUSED|REFUSE)\b:?\s+(.*)$/))) {
      if (/^\d+(\s+FAIL\s+\d+)?$/.test(m[2])) continue; // summary lines
      const key = m[2].replace(/\d+/g, '#').split(/\s+/).slice(0, 2).join(' ');
      out.push({ st: m[1].split(' ')[0], key, text: m[2].slice(0, 160) }); } }
  return out;
}
function summ(txt) { const m = txt.match(/PASS (\d+) FAIL (\d+)\s*$/m) || [...txt.matchAll(/PASS (\d+) FAIL (\d+)/g)].pop(); const r = rowsOf(txt);
  const c = s => r.filter(x => x.st === s).length; return (m ? 'P' + m[1] + ' F' + m[2] : 'NO-SUMMARY') + ' skip' + c('SKIP') + ' scoped' + c('SCOPED') + ' refused' + (c('REFUSED') + c('REFUSE')); }
function cmp([dA, tA, dB, tB]) {
  const gs = fs.readdirSync(dA).filter(f => f.startsWith(tA + '__g')).map(f => f.slice(tA.length + 2, -4));
  for (const g of gs.sort()) {
    const fb = path.join(dB, tB + '__' + g + '.out'); if (!fs.existsSync(fb)) continue;
    const a = fs.readFileSync(path.join(dA, tA + '__' + g + '.out'), 'utf8'), b = fs.readFileSync(fb, 'utf8');
    const ra = rowsOf(a), rb = rowsOf(b), sa = summ(a), sb = summ(b);
    const ms = r => { const M = {}; r.forEach(x => (M[x.key] = M[x.key] || []).push(x)); return M; };
    const A = ms(ra), B = ms(rb), diffs = [];
    for (const k of new Set(Object.keys(A).concat(Object.keys(B)))) {
      const x = (A[k] || []).map(r => r.st).sort().join(','), y = (B[k] || []).map(r => r.st).sort().join(',');
      if (x !== y) diffs.push('    ' + (x || '-') + ' -> ' + (y || '-') + '  | ' + ((B[k] || A[k])[0].text)); }
    if (diffs.length || sa.replace(/P\d+ F\d+ /, '') !== sb.replace(/P\d+ F\d+ /, '') || /F[1-9]|NO-SUM/.test(sa + sb))
      console.log(g + '\n  ' + tA + ' ' + sa + '\n  ' + tB + ' ' + sb + '\n' + diffs.join('\n'));
  }
}
if (require.main === module && process.argv[2] === 'cmp') cmp(process.argv.slice(3));

// ---- detail: node v233_exact_version_rows.js detail <R0dir> <R1dir> <R2dir>
// For every gate: each row DARK at 233 (SKIP / SCOPED in R0) or dark at 234 (live in R0, SKIP in R1), with the
// R2 lines (stamp = the gate's own era) sharing its row id. Row id = first token (after "pair row" / "(D... held)").
function rid(t) { const s = t.replace(/^\[(NY|UTC)\]\s*/, '$1:').replace(/^pair row\s+/, '').replace(/^row\s+/, '').replace(/^\(.*?\)\s*/, '');
  const m = s.match(/^(NY:|UTC:)?([^\s:(]+)/); return m ? (m[1] || '') + m[2] : s.slice(0, 10); }
function detail([d0, d1, d2]) {
  const rd = (d, t, g) => { const f = path.join(d, t + '__' + g + '.out'); return fs.existsSync(f) ? rowsOf(fs.readFileSync(f, 'utf8')) : null; };
  const gs = fs.readdirSync(d0).filter(f => /^R0__g.*\.out$/.test(f)).map(f => f.slice(4, -4)).sort();
  let nDark = 0, nNext = 0;
  for (const g of gs) {
    const r0 = rd(d0, 'R0', g), r1 = rd(d1, 'R1', g), r2 = d2 ? rd(d2, 'R2', g) : null;
    const dark = r0.filter(x => x.st === 'SKIP' || x.st === 'SCOPED');
    const live0 = new Set(r0.filter(x => x.st === 'PASS' || x.st === 'FAIL').map(x => rid(x.text)));
    const next = (r1 || []).filter(x => (x.st === 'SKIP' || x.st === 'SCOPED') && live0.has(rid(x.text)) && !dark.some(y => rid(y.text) === rid(x.text)));
    if (!dark.length && !next.length) continue;
    console.log('== ' + g + '  dark@233 ' + dark.length + '  newly-dark@234 ' + next.length + (r2 ? '' : '  (no R2 run)'));
    nDark += dark.length; nNext += next.length;
    const ids = [...new Set(dark.concat(next).map(x => rid(x.text)))];
    for (const id of ids) {
      const a = dark.concat(next).filter(x => rid(x.text) === id), b = (r2 || []).filter(x => rid(x.text) === id && x.st !== 'SKIP' && x.st !== 'SCOPED');
      const c = (r1 || []).filter(x => rid(x.text) === id).map(x => x.st).join(',');
      console.log('  [' + id + '] R0 ' + a.map(x => x.st).join(',') + ' | R1 ' + (c || '-') + ' | R2 ' + (b.map(x => x.st).join(',') || '-') + '   :: ' + a[0].text.slice(0, 130));
      b.forEach(x => console.log('      R2 ' + x.st + ' ' + x.text.slice(0, 200)));
    }
  }
  console.log('TOTAL dark-at-233 row lines ' + nDark + ', newly dark at 234 ' + nNext);
}
if (require.main === module && process.argv[2] === 'detail') detail(process.argv.slice(3));

// ---- cost: node v233_exact_version_rows.js cost <timeFile> <gate,gate,...>
// Mutations across tests/sabotage/*.json naming each listed gate, x that gate's wall time from the timing run (8 jobs);
// per-build wall at 8 jobs = longest-processing-time packing of the mutation runs onto 8 slots (and sum/8 as the floor).
function cost([tf, list]) {
  const T = {}; for (const l of fs.readFileSync(tf, 'utf8').split('\n')) { const m = l.match(/^\s+([\d.]+)s\s+(g\S+\.js)/); if (m) T[m[2]] = +m[1]; }
  const SD = path.join(__dirname, '..', 'sabotage'), M = {}; let all = 0;
  for (const f of fs.readdirSync(SD).filter(x => x.endsWith('.json'))) for (const m of JSON.parse(fs.readFileSync(path.join(SD, f), 'utf8'))) { all++; const g = path.basename(m.gate); M[g] = (M[g] || 0) + 1; }
  const gs = list.split(','); let n = 0, sum = 0; const runs = [];
  for (const g of gs) { const k = M[g] || 0, t = T[g]; n += k; sum += k * (t || 0); for (let i = 0; i < k; i++) runs.push(t || 0);
    console.log(g.padEnd(30) + ' mutations ' + String(k).padStart(3) + '  gate ' + (t == null ? 'NO TIME' : t.toFixed(1) + 's').padStart(8) + '  subtotal ' + (k * (t || 0)).toFixed(0) + 's'); }
  runs.sort((a, b) => b - a); const slot = Array(8).fill(0); runs.forEach(r => { slot[slot.indexOf(Math.min(...slot))] += r; });
  console.log('COST gates ' + gs.length + ' mutations ' + n + ' of ' + all + ' total; serial sum ' + sum.toFixed(0) + 's; 8-job LPT wall ' + Math.max(...slot).toFixed(0) + 's; floor sum/8 ' + (sum / 8).toFixed(0) + 's');
}
if (require.main === module && process.argv[2] === 'cost') cost(process.argv.slice(3));
