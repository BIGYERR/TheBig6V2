#!/usr/bin/env node
// Proof scope, dependency chain (local). Post-V233 decision, CLAUDE.md "Proof scope".
//   node tests/chain.js <base.html> <cand.html> [--ref <git-ref>]
// Prints: every column-0 `function NAME` declaration whose text changed, was added or removed;
// every changed line outside such a declaration (OUTSIDE A FUNCTION; a hunk confined to the ia-version meta
// line prints VERSION BUMP instead, proved by gate.sh step 0); the gate list (map reach of
// each changed function, the gates the map cannot see, new or edited gates vs --ref, boot), one per
// line with its reasons; and the mechanical verdict. Exit 0 on a printed list, 2 on bad input.
// Verdict: tests/harness.js differing from --ref by era rows only (era_bump.py --era-only-diff lists it era-only) is not cross-cutting (Mario, Post-V235); edited, or any tests/gate.sh diff, still is.
//
// Function extents come from V8, not from a hand tokenizer: the inline script (harness
// extractInlineJS) is wrapped in a function whose first statement returns every column-0
// declaration (each renamed to a unique slot, so duplicates are kept apart). Declarations are
// hoisted, so no top-level statement runs; Function.prototype.toString gives each declaration's
// exact source text. A column-0 match that is not hoisted (nested, or inside a string) is not a
// function here, and its text counts as outside.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.dirname(__dirname);
const H = require(path.join(__dirname, 'harness.js'));
const GD = path.join(__dirname, 'gates');
const MD = path.join(__dirname, 'measure');
const THRESHOLD = 20;                                   // more than this many gates => CROSS-CUTTING
const DECL_RE = /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm;   // same rule as the map
const OWN_VM_RE = /runInNewContext|runInContext|createContext|compileFunction|new Function\b|vm\.Script\b|require\(\s*['"](?:node:)?vm['"]\s*\)/;
const MARK = '\u0000FN ';

function die(msg) { process.stderr.write('chain.js: ' + msg + '\n'); process.exit(2); }

// ---- args ----------------------------------------------------------------------------------------
const argv = process.argv.slice(2);
let ref = 'HEAD'; const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--ref') { if (i + 1 >= argv.length) die('--ref needs a git ref'); ref = argv[++i]; }
  else if (argv[i].startsWith('--')) die('unknown option ' + argv[i]);
  else pos.push(argv[i]);
}
if (pos.length !== 2) die('usage: node tests/chain.js <base.html> <cand.html> [--ref <git-ref>]');
const [baseP, candP] = pos.map(p => path.resolve(p));
for (const p of [baseP, candP]) if (!fs.existsSync(p) || !fs.statSync(p).isFile()) die('no such file ' + p);

function git(args, okCodes) {
  const r = cp.spawnSync('git', ['-C', ROOT, '-c', 'core.quotepath=off'].concat(args), { encoding: 'utf8' });
  if (!(okCodes || [0]).includes(r.status)) die('git ' + args.join(' ') + ' failed: ' + (r.stderr || '').trim());
  return r;
}
git(['rev-parse', '--verify', '--quiet', ref + '^{commit}']);

// ---- map -----------------------------------------------------------------------------------------
const maps = fs.readdirSync(MD).map(f => [f, /^v(\d+)_gate_reach\.json$/.exec(f)]).filter(x => x[1])
  .sort((a, b) => (+b[1][1]) - (+a[1][1]));
if (!maps.length) die('no tests/measure/v<N>_gate_reach.json reach map');
const mapFile = path.join(MD, maps[0][0]), mapVer = +maps[0][1][1];
let MAP;
try { MAP = JSON.parse(fs.readFileSync(mapFile, 'utf8')); } catch (e) { die('reach map unreadable: ' + e.message); }
if (!MAP || typeof MAP.gates !== 'object') die('reach map has no gates object: ' + mapFile);
const mapMtime = fs.statSync(mapFile).mtimeMs;
const reachOf = {};                                    // fn name -> [gates]
for (const [g, v] of Object.entries(MAP.gates)) for (const n of (v.executed || [])) (reachOf[n] = reachOf[n] || []).push(g);

// ---- per-file analysis ---------------------------------------------------------------------------
function analyse(file) {
  const html = fs.readFileSync(file, 'utf8');
  // the script blocks extractInlineJS keeps, with their content offsets in the HTML
  const blocks = []; const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/\btype\s*=\s*["'](?!(text\/javascript|module|application\/javascript))/.test(attrs)) continue;
    blocks.push({ h: m.index + m[0].length - '</script>'.length - m[2].length, text: m[2] });
  }
  let js;
  try { js = H.extractInlineJS(html); } catch (e) { die(path.basename(file) + ': ' + e.message); }
  let j = 0; for (const b of blocks) { b.j = j; j += b.text.length + 2; }
  if (blocks.map(b => b.text).join(';\n') !== js) die('block split disagrees with harness extractInlineJS (chain.js is out of date with tests/harness.js)');
  const toHtml = o => { for (let k = blocks.length - 1; k >= 0; k--) if (o >= blocks[k].j) return blocks[k].h + (o - blocks[k].j); return o; };

  const decls = []; DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(js))) decls.push({ o: m.index, name: m[1], nameAt: m.index + m[0].length - m[1].length });
  let parts = [], last = 0;
  decls.forEach((d, i) => { parts.push(js.slice(last, d.nameAt), '__ia_chain_' + i); last = d.nameAt + d.name.length; });
  parts.push(js.slice(last));
  const wrap = '(function(){return [' + decls.map((d, i) => { const s = '__ia_chain_' + i;
    return '(typeof ' + s + '==="function"?Function.prototype.toString.call(' + s + '):null)'; }).join(',') +
    '];\n' + parts.join('') + '\n})';
  let texts;
  try { texts = new vm.Script(wrap, { filename: path.basename(file) + '.chain.js' }).runInNewContext({})(); }
  catch (e) { die(path.basename(file) + ': inline script does not compile (' + e.message + '); run the syntax check first'); }
  const fns = [], notHoisted = [];
  decls.forEach((d, i) => {
    const line = js.slice(0, d.o).split('\n').length;
    if (texts[i] === null) { notHoisted.push(d.name + ' (script line ' + line + ')'); return; }
    const t = texts[i].replace('__ia_chain_' + i, d.name);
    if (js.slice(d.o, d.o + t.length) !== t) { process.stderr.write('chain.js: extent check failed for ' + d.name + '\n'); process.exit(3); }
    fns.push({ name: d.name, text: t, hs: toHtml(d.o), he: toHtml(d.o) + t.length });
  });
  const byName = {};
  for (const f of fns) byName[f.name] = (byName[f.name] || '') + f.text + '\n\u0000\n';
  // skeleton: each function's text replaced line for line by its marker, so line numbers hold
  let sk = '', at = 0;
  for (const f of fns.slice().sort((a, b) => a.hs - b.hs)) {
    const n = html.slice(f.hs, f.he).split('\n').length;
    sk += html.slice(at, f.hs) + Array(n).fill(MARK + f.name).join('\n'); at = f.he;
  }
  sk += html.slice(at);
  return { file, lines: html.split('\n'), skel: sk.split('\n'), fns, byName, notHoisted };
}

// ---- line diff (Myers, common prefix and suffix trimmed) -----------------------------------------
function diffLines(a, b) {
  let pre = 0; while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0; while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const A = a.slice(pre, a.length - suf), B = b.slice(pre, b.length - suf), N = A.length, M = B.length;
  if (!N && !M) return [];
  const whole = [{ a0: pre, a1: pre + N, b0: pre, b1: pre + M }];
  if (!N || !M) return whole;
  const CAP = Math.min(N + M, 3000), off = N + M + 1, V = new Int32Array(2 * off + 2), trace = [];
  let done = false;
  for (let d = 0; d <= CAP && !done; d++) {
    trace.push(V.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && V[off + k - 1] < V[off + k + 1])) ? V[off + k + 1] : V[off + k - 1] + 1;
      let y = x - k;
      while (x < N && y < M && A[x] === B[y]) { x++; y++; }
      V[off + k] = x;
      if (x >= N && y >= M) { done = true; break; }
    }
  }
  if (!done) return whole;                              // too far apart: one hunk, classified by hand
  const ops = []; let x = N, y = M;
  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d], at = k => v[k + d + 1], k = x - y;
    const pk = (k === -d || (k !== d && at(k - 1) < at(k + 1))) ? k + 1 : k - 1;
    const px = at(pk), py = px - pk;
    while (x > px && y > py) { x--; y--; ops.push(['=', x, y]); }
    if (d > 0) { if (x === px) ops.push(['+', x, py]); else ops.push(['-', px, y]); }
    x = px; y = py;
  }
  ops.reverse();
  const hunks = []; let h = null, ai = 0, bi = 0;
  for (const [op] of ops) {
    if (op === '=') { if (h) { hunks.push(h); h = null; } ai++; bi++; continue; }
    if (!h) h = { a0: pre + ai, a1: pre + ai, b0: pre + bi, b1: pre + bi };
    if (op === '-') { ai++; h.a1 = pre + ai; } else { bi++; h.b1 = pre + bi; }
  }
  if (h) hunks.push(h);
  return hunks;
}

// ---- run -----------------------------------------------------------------------------------------
const B = analyse(baseP), C = analyse(candP);
const rel = p => { const r = path.relative(ROOT, p); return !r ? p : (r.startsWith('..') ? p : r); };
console.log('chain: base ' + rel(baseP) + ' -> cand ' + rel(candP) + '  ref ' + ref);
console.log('map: ' + rel(mapFile) + '  built on V' + mapVer + ' (version from the file name; the map records none)  ' +
  'candidate ' + MAP.candidate + '  decls ' + MAP.topLevelDecls + '  gates ' + Object.keys(MAP.gates).length +
  '  |  decls now: base ' + (B.fns.length + B.notHoisted.length) + ' cand ' + (C.fns.length + C.notHoisted.length));
for (const [X, tag] of [[B, 'base'], [C, 'cand']]) if (X.notHoisted.length)
  console.log('note (' + tag + '): column-0 match not hoisted, its text counts as outside: ' + X.notHoisted.join(', '));

const changed = [];
for (const n of Object.keys(C.byName)) if (!(n in B.byName)) changed.push(['ADDED', n]); else if (B.byName[n] !== C.byName[n]) changed.push(['CHANGED', n]);
for (const n of Object.keys(B.byName)) if (!(n in C.byName)) changed.push(['REMOVED', n]);
console.log('FUNCTIONS changed ' + changed.filter(c => c[0] === 'CHANGED').length + ', added ' +
  changed.filter(c => c[0] === 'ADDED').length + ', removed ' + changed.filter(c => c[0] === 'REMOVED').length);
for (const [k, n] of changed) console.log('  ' + k.padEnd(8) + ' ' + n + '  executed by ' + (reachOf[n] || []).length + ' gates in the map');

const isMark = s => s.startsWith(MARK) && s.indexOf(MARK, 1) < 0 && /^[A-Za-z_$][\w$]*$/.test(s.slice(MARK.length));
const show = s => { s = s.split(MARK).join('<fn '); return s.length > 180 ? s.slice(0, 180) + ' ...' : s; };
const outsideAll = diffLines(B.skel, C.skel).filter(h =>
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
for (const h of outside) {
  console.log('  OUTSIDE A FUNCTION: classify by hand (default CROSS-CUTTING)  base L' + (h.a0 + 1) + (h.a1 - h.a0 > 1 ? '-' + h.a1 : '') +
    (h.a1 === h.a0 ? ' (none)' : '') + '  cand L' + (h.b0 + 1) + (h.b1 - h.b0 > 1 ? '-' + h.b1 : '') + (h.b1 === h.b0 ? ' (none)' : ''));
  for (let i = h.a0; i < h.a1; i++) if (!isMark(B.skel[i])) console.log('    - L' + (i + 1) + ' ' + show(B.skel[i]));
  for (let i = h.b0; i < h.b1; i++) if (!isMark(C.skel[i])) console.log('    + L' + (i + 1) + ' ' + show(C.skel[i]));
}
const unmapped = changed.filter(c => !(reachOf[c[1]] || []).length).map(c => c[1]);
console.log('functions not in map (new, or executed by 0 gates): ' + (unmapped.length ? unmapped.join(', ') : 'none'));

// ---- gates ---------------------------------------------------------------------------------------
const gateFiles = fs.readdirSync(GD).filter(f => f.endsWith('.js')).sort();
const order = [], why = {};
const add = (g, r) => { if (!why[g]) { why[g] = []; order.push(g); } if (!why[g].includes(r)) why[g].push(r); };
for (const [k, n] of changed) for (const g of (reachOf[n] || []).slice().sort()) add(g, 'reach ' + n);
for (const [g, v] of Object.entries(MAP.gates).sort()) {
  if (!v.files) add(g, 'unseen: map has no coverage for it');
  else if (!v.scripts) add(g, 'unseen: map saw 0 candidate scripts');
}
for (const g of gateFiles) {
  const src = fs.readFileSync(path.join(GD, g), 'utf8');
  if (OWN_VM_RE.test(src)) add(g, 'unseen: runs its own vm or new Function, map may undercount');
  if (!(g in MAP.gates)) add(g, 'unseen: not in the map');
  else if (fs.statSync(path.join(GD, g)).mtimeMs > mapMtime) add(g, 'unseen: file newer than the map');
}
const eb = cp.spawnSync('python3', [path.join(__dirname, 'era_bump.py'), '--era-only-diff', ref], { cwd: ROOT, encoding: 'utf8' });
if (eb.status !== 0) die('era_bump.py --era-only-diff ' + ref + ' failed: ' + ((eb.stderr || '') + (eb.stdout || '')).trim());
const eraOnly = [], otherEdits = [];
let harnessEraOnly = false;   // Mario, Post-V235: era rows era_bump.py wrote do not make tests/harness.js cross-cutting
for (const ln of eb.stdout.split('\n')) {
  const x = /^(edited|era-only)\s+(\S+)\s+\((.*)\)\s*$/.exec(ln); if (!x) continue;
  if (x[2] === 'tests/harness.js') { harnessEraOnly = x[1] === 'era-only'; continue; }
  const gm = /^tests\/gates\/([^/]+)$/.exec(x[2]); if (!gm) continue;
  if (!gm[1].endsWith('.js')) { if (x[1] === 'edited') otherEdits.push(gm[1]); continue; }
  if (x[1] === 'era-only') { eraOnly.push(gm[1]); continue; }
  if (!fs.existsSync(path.join(GD, gm[1]))) { otherEdits.push(gm[1] + ' (deleted)'); continue; }
  add(gm[1], 'edited vs ' + ref + ' (' + x[3] + ')');
}
add('g000_boot.js', 'boot');
console.log('era-only gates vs ' + ref + ' (not counted as edited): ' + (eraOnly.length ? eraOnly.join(', ') : 'none'));
if (otherEdits.length) console.log('edited under tests/gates, not a runnable gate (classify by hand): ' + otherEdits.join(', '));
const missing = order.filter(g => !fs.existsSync(path.join(GD, g)));
console.log('GATES ' + (order.length - missing.length) + (missing.length ? '  (map names absent from tests/gates, not listed: ' + missing.join(', ') + ')' : ''));
for (const g of order) if (!missing.includes(g)) console.log('GATE ' + g + '  [' + why[g].join('; ') + ']');

// ---- verdict (mechanical part only) --------------------------------------------------------------
const cross = [];
for (const [k, n] of changed) { const r = (reachOf[n] || []).length; if (r > THRESHOLD) cross.push(n + ' executed by ' + r + ' gates (> ' + THRESHOLD + ')'); }
const infra = git(['diff', '--name-only', ref, '--', 'tests/harness.js', 'tests/gate.sh']).stdout.split('\n').filter(Boolean);
for (const f of infra) {
  if (f === 'tests/harness.js' && harnessEraOnly) { console.log('tests/harness.js differs from ' + ref + ' by era rows only (era_bump.py --era-only-diff): not cross-cutting'); continue; }
  cross.push(f + ' differs from ' + ref);
}
if (outside.length) cross.push(outside.length + ' OUTSIDE A FUNCTION hunk(s)');
if (cross.length) console.log('VERDICT CROSS-CUTTING: ' + cross.join('; '));
else console.log('VERDICT LOCAL (mechanical); stored format? program output? — the session confirms before proof');
process.exit(0);
