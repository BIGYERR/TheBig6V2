#!/usr/bin/env node
// Architecture migration phase C, before-picture (measure pass, Post-v0.239.1).
// Question: what must turning the app's classic-script source files into ES modules cut? Which top-level names cross
// files and which are written from another file, which names the engine (buildProgram) needs and where that reaches
// browser APIs, what the inline handlers call by global name, what a static graph cannot see, and which app names the
// feature tests reach through the harness.
//   node tests/measure/es-modules_module-graph.js            the report on stdout
// Oracles: acorn's parse of the inline script (the JS files of order.json joined, as build-index.mjs joins them),
// eslint-scope's references of every top-level name, the markup and string literals scanned for inline handlers, and the
// test files scanned for the names they use. No app code runs.
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const SRC = path.join(REPO, 'frontends', 'app', 'src', 'legacy', 'src');
const NM = path.join(REPO, 'frontends', 'app', 'node_modules');
const acorn = require(path.join(NM, 'acorn'));
const escope = require(path.join(NM, 'eslint-scope'));
const evk = require(path.join(NM, 'eslint-visitor-keys'));

// ── the inline script, file by file ───────────────────────────────────────────────────────────────────────────────
const order = JSON.parse(fs.readFileSync(path.join(SRC, 'order.json'), 'utf8'));
const jsFiles = order.filter((f) => f.endsWith('.js'));
const htmlFiles = order.filter((f) => f.endsWith('.html'));
let script = '';
const spans = [];
// Each JS file between its module blocks (phase C, step 1): what build-index.mjs puts into the page.
const IMPORTS_END = '// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)\n';
const EXPORTS_START = '\n// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)\n';
const classic = (text) => {
  const i = text.indexOf(IMPORTS_END);
  const j = text.indexOf(EXPORTS_START);
  return text.slice(i === -1 ? 0 : i + IMPORTS_END.length, j === -1 ? text.length : j);
};
for (const f of jsFiles) {
  const text = classic(fs.readFileSync(path.join(SRC, f), 'utf8'));
  spans.push({ file: path.basename(f, '.js'), from: script.length, to: script.length + text.length, bytes: Buffer.byteLength(text) });
  script += text;
}
const fileAt = (pos) => {
  let lo = 0, hi = spans.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (spans[mid].from <= pos) lo = mid; else hi = mid - 1;
  }
  return spans[lo].file;
};
const lineAt = (pos) => {
  const f = spans.find((s) => s.from <= pos && pos < s.to);
  return script.slice(f.from, pos).split('\n').length;
};
const ast = acorn.parse(script, { ecmaVersion: 'latest', sourceType: 'script', ranges: true });

// ── top-level declarations and the statement that owns each position ──────────────────────────────────────────────
const decl = new Map(); // name -> { file, kind, start, end }
const dupes = [];
const owners = []; // { start, end, name } per top-level statement; name is the declared name or '<init file>'
function idsOf(pattern, out = []) {
  if (!pattern) return out;
  if (pattern.type === 'Identifier') out.push(pattern.name);
  else if (pattern.type === 'ObjectPattern') pattern.properties.forEach((p) => idsOf(p.value ?? p.argument, out));
  else if (pattern.type === 'ArrayPattern') pattern.elements.forEach((e) => idsOf(e, out));
  else if (pattern.type === 'RestElement') idsOf(pattern.argument, out);
  else if (pattern.type === 'AssignmentPattern') idsOf(pattern.left, out);
  return out;
}
for (const st of ast.body) {
  const file = fileAt(st.start);
  let names = [];
  let kind = null;
  if (st.type === 'FunctionDeclaration') { names = [st.id.name]; kind = 'function'; }
  else if (st.type === 'ClassDeclaration') { names = [st.id.name]; kind = 'class'; }
  else if (st.type === 'VariableDeclaration') { kind = st.kind; for (const d of st.declarations) idsOf(d.id, names); }
  for (const n of names) {
    if (decl.has(n)) dupes.push(`${n} (${decl.get(n).file}, ${file})`);
    decl.set(n, { file, kind, start: st.start, end: st.end });
  }
  owners.push({ start: st.start, end: st.end, name: names.length === 1 ? names[0] : names.length ? names.join('+') : `<top-level code in ${file}>`, names, file });
}
const ownerAt = (pos) => {
  let lo = 0, hi = owners.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (owners[mid].start <= pos) lo = mid; else hi = mid - 1;
  }
  return owners[lo];
};

// ── references: who uses and who writes each top-level name ───────────────────────────────────────────────────────
const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script', ignoreEval: true, childVisitorKeys: evk.KEYS, fallback: 'iteration' });
const gs = sm.globalScope;
const uses = new Map(); // owner name -> Set(used top-level name)
const fileEdges = new Map(); // file -> Map(file -> count)
const crossWrites = new Map(); // name -> Map(writer file -> count)
let crossRefs = 0;
const crossNames = new Set();
for (const v of gs.variables) {
  const d = decl.get(v.name);
  if (!d) continue;
  for (const r of v.references) {
    const pos = r.identifier.range[0];
    const o = ownerAt(pos);
    const userFile = o.file;
    if (o.names.includes(v.name) && r.init) continue; // the declaration's own initializer
    for (const u of o.names.length ? o.names : [o.name]) {
      if (u === v.name) continue;
      if (!uses.has(u)) uses.set(u, new Set());
      uses.get(u).add(v.name);
    }
    if (userFile !== d.file) {
      crossRefs++;
      crossNames.add(v.name);
      if (!fileEdges.has(userFile)) fileEdges.set(userFile, new Map());
      fileEdges.get(userFile).set(d.file, (fileEdges.get(userFile).get(d.file) || 0) + 1);
      if (r.isWrite() && !r.init && (d.kind === 'let' || d.kind === 'var')) {
        if (!crossWrites.has(v.name)) crossWrites.set(v.name, new Map());
        crossWrites.get(v.name).set(userFile, (crossWrites.get(v.name).get(userFile) || 0) + 1);
      }
    }
  }
}
// Names the script uses but never declares: the browser's (and a few the harness or the page supply).
const BROWSER = new Set(['document', 'window', 'localStorage', 'sessionStorage', 'navigator', 'location', 'history', 'alert', 'confirm', 'prompt',
  'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'matchMedia', 'IntersectionObserver', 'ResizeObserver',
  'MutationObserver', 'Image', 'Audio', 'fetch', 'XMLHttpRequest', 'FileReader', 'Blob', 'screen', 'innerWidth', 'innerHeight',
  'scrollTo', 'scrollY', 'pageYOffset', 'addEventListener', 'removeEventListener', 'HTMLElement', 'Element', 'Event', 'CustomEvent', 'KeyboardEvent',
  'PointerEvent', 'getSelection', 'visualViewport', 'devicePixelRatio', 'open', 'print', 'cordova', 'Capacitor', 'webkit', 'caches',
  'indexedDB', 'Notification', 'FormData', 'DOMParser', 'CSS', 'self', 'top', 'parent', 'frames']);
const touches = new Map(); // owner name -> Set(browser global)
const undeclared = new Map();
for (const r of gs.through) {
  const n = r.identifier.name;
  undeclared.set(n, (undeclared.get(n) || 0) + 1);
  if (!BROWSER.has(n)) continue;
  const o = ownerAt(r.identifier.range[0]);
  for (const u of o.names.length ? o.names : [o.name]) {
    if (!touches.has(u)) touches.set(u, new Set());
    touches.get(u).add(n);
  }
}

// ── the file graph: strongly connected components (Tarjan) ────────────────────────────────────────────────────────
const files = spans.map((s) => s.file);
function sccs() {
  let index = 0;
  const idx = new Map(), low = new Map(), onStack = new Set(), stack = [], out = [];
  const strong = (v) => {
    idx.set(v, index); low.set(v, index); index++; stack.push(v); onStack.add(v);
    for (const w of (fileEdges.get(v) || new Map()).keys()) {
      if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
      out.push(comp);
    }
  };
  for (const f of files) if (!idx.has(f)) strong(f);
  return out;
}
const comps = sccs();
const big = comps.filter((c) => c.length > 1).sort((a, b) => b.length - a.length);
let edgeCount = 0, mutual = 0;
for (const [a, m] of fileEdges) for (const b of m.keys()) { edgeCount++; if (a < b && fileEdges.get(b)?.has(a)) mutual++; }

// ── the engine: everything buildProgram reaches, name by name ─────────────────────────────────────────────────────
function closure(roots) {
  const seen = new Map(roots.map((r) => [r, null]));
  const queue = [...roots];
  while (queue.length) {
    const n = queue.shift();
    for (const m of uses.get(n) || []) if (!seen.has(m)) { seen.set(m, n); queue.push(m); }
  }
  return seen;
}
const pathTo = (seen, n) => { const p = []; for (let x = n; x !== null && x !== undefined; x = seen.get(x)) p.unshift(x); return p.join(' > '); };
const engine = closure(['buildProgram']);
const engineFiles = new Map();
for (const n of engine.keys()) { const f = decl.get(n)?.file; if (f) engineFiles.set(f, (engineFiles.get(f) || 0) + 1); }
const namesPerFile = new Map();
for (const [n, d] of decl) namesPerFile.set(d.file, (namesPerFile.get(d.file) || 0) + 1);
const engineBrowser = [...engine.keys()].filter((n) => touches.has(n)).map((n) => ({ n, apis: [...touches.get(n)].sort(), path: pathTo(engine, n) }));

// ── inline handlers: what the markup and the HTML strings call by global name ─────────────────────────────────────
const HANDLER = /\bon[a-z]+\s*=\s*(?:"([^"]*)"|'([^']*)'|\\"((?:[^\\]|\\[^"])*)\\")/g;
const handlerNames = new Map(); // name -> Set(where)
let handlerAttrs = 0;
function scanHandlers(text, where) {
  for (const m of text.matchAll(HANDLER)) {
    handlerAttrs++;
    const code = m[1] ?? m[2] ?? m[3] ?? '';
    for (const id of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) {
      if (!decl.has(id[1])) continue;
      if (!handlerNames.has(id[1])) handlerNames.set(id[1], new Set());
      handlerNames.get(id[1]).add(where);
    }
  }
}
for (const f of htmlFiles) scanHandlers(fs.readFileSync(path.join(SRC, f), 'utf8'), path.basename(f));
const dynamic = [];
(function visit(node) {
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'Literal' && typeof node.value === 'string') scanHandlers(node.value, fileAt(node.start) + '.js');
  if (node.type === 'TemplateElement') scanHandlers(node.value.cooked ?? node.value.raw, fileAt(node.start) + '.js');
  const where = () => `${fileAt(node.start)}.js:${lineAt(node.start)}`;
  if (node.type === 'MemberExpression' && node.computed && node.object.type === 'Identifier' && ['window', 'globalThis', 'self'].includes(node.object.name)) dynamic.push(`${node.object.name}[...] at ${where()}`);
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'eval') dynamic.push(`eval at ${where()}`);
  if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && node.callee.name === 'Function') dynamic.push(`new Function at ${where()}`);
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && ['setTimeout', 'setInterval'].includes(node.callee.name) && node.arguments[0]?.type === 'Literal') dynamic.push(`${node.callee.name}('string') at ${where()}`);
  for (const key of evk.KEYS[node.type] || []) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach(visit); else visit(child);
  }
})(ast);

// ── the feature tests: which app names they reach ─────────────────────────────────────────────────────────────────
const H = require(path.join(REPO, 'tests', 'harness.js'));
const exported = new Set(H.EXPORT_NAMES);
const testDirs = ['unit', 'integration', 'sweeps', 'support'].map((d) => path.join(REPO, 'tests', d));
const testReach = new Map(); // name -> Set(how)
const listTs = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? listTs(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []);
let testFileCount = 0;
for (const dir of testDirs) for (const f of listTs(dir)) {
  testFileCount++;
  const text = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
  const add = (n, how) => { if (!decl.has(n)) return; if (!testReach.has(n)) testReach.set(n, new Set()); testReach.get(n).add(how); };
  for (const m of text.matchAll(/appFunction(?:<[^>]*>)?\(\s*['"]([\w$]+)['"]/g)) add(m[1], 'appFunction');
  for (const m of text.matchAll(/\.\s*([A-Za-z_$][\w$]*)/g)) add(m[1], exported.has(m[1]) ? 'IA (EXPORT_NAMES)' : 'property');
  for (const m of text.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) for (const id of m[2].matchAll(/(?<![\w$])([A-Za-z_$][\w$]*)/g)) add(id[1], 'string');
}

// ── load time: what runs when the script loads, and in what order modules would evaluate ───────────────────────────
// A reference runs at load when it sits in top-level code, or in a function that runs right away (an IIFE, or a
// callback handed to forEach, map and the like), or in a top-level function that load-time code calls (followed
// transitively). Callbacks handed to anything else (listeners, timers) do not run at load.
const parent = new Map();
(function link(node, up) {
  if (!node || typeof node.type !== 'string') return;
  parent.set(node, up);
  for (const key of evk.KEYS[node.type] || []) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => link(c, node)); else link(child, node);
  }
})(ast, null);
const ITER = new Set(['forEach', 'map', 'filter', 'reduce', 'reduceRight', 'some', 'every', 'find', 'findIndex', 'flatMap', 'sort', 'from']);
function runsNow(scope) {
  if (scope.type !== 'function') return true;
  const b = scope.block;
  if (b.type === 'FunctionDeclaration') return false;
  const up = parent.get(b);
  if (!up || up.type !== 'CallExpression') return false;
  if (up.callee === b) return true; // an IIFE
  return up.arguments.includes(b) && up.callee.type === 'MemberExpression' && !up.callee.computed && ITER.has(up.callee.property.name);
}
function refsRunning(scope, out = []) {
  out.push(...scope.references);
  for (const c of scope.childScopes) if (runsNow(c)) refsRunning(c, out);
  return out;
}
const isCallee = (id) => { const up = parent.get(id); return !!up && (up.type === 'CallExpression' || up.type === 'NewExpression') && up.callee === id; };
const fnScopeOf = new Map(); // top-level function name -> its function scope
for (const s of sm.scopes) if (s.type === 'function' && s.block.type === 'FunctionDeclaration' && s.upper === gs) fnScopeOf.set(s.block.id.name, s);
const loadRefs = []; // { file, name, kind, declFile, browser, via }
const calledAtLoad = new Map(); // fn name -> what called it at load
const pending = [];
function take(refs, fileOf, via) {
  for (const r of refs) {
    const n = r.identifier.name;
    const file = fileOf(r);
    const d = r.resolved && r.resolved.scope === gs ? decl.get(n) : null;
    if (d) {
      loadRefs.push({ file, name: n, kind: d.kind, declFile: d.file, via });
      // init() boots the app; as modules, the entry calls it once every module has evaluated, so its calls do not run
      // while modules load.
      if (d.kind === 'function' && isCallee(r.identifier) && !calledAtLoad.has(n) && n !== 'init') { calledAtLoad.set(n, via); pending.push(n); }
    } else if (!r.resolved && BROWSER.has(n)) loadRefs.push({ file, name: n, browser: true, via });
  }
}
// top-level code: the global scope's own references and those of blocks and run-now callbacks below it
take(refsRunning(gs), (r) => fileAt(r.identifier.range[0]), 'top level');
while (pending.length) {
  const fn = pending.shift();
  const s = fnScopeOf.get(fn);
  if (!s) continue;
  const refs = [];
  for (const c of s.childScopes) if (runsNow(c)) refsRunning(c, refs);
  take(s.references.concat(refs), () => decl.get(fn).file, `${fn}()`);
}
const iifes = ast.body.filter((st) => st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && /Function/.test(st.expression.callee.type)).map((st) => `${fileAt(st.start)}.js:${lineAt(st.start)}`);
// Module evaluation order if every file imported each file it references, listed in order.json order, from an entry
// that imports the files in order.json order: dependencies evaluate first, depth first; a file already being evaluated
// (a cycle) is skipped. A load-time read of another file's const, let or class that evaluates later is a TDZ error.
const depsOf = new Map(files.map((f) => [f, files.filter((g) => g !== f && fileEdges.get(f)?.has(g))]));
const evalOrder = [];
const state = new Map();
const evaluate = (f) => { if (state.has(f)) return; state.set(f, 'evaluating'); for (const g of depsOf.get(f)) evaluate(g); state.set(f, 'done'); evalOrder.push(f); };
files.forEach(evaluate);
const rank = new Map(evalOrder.map((f, i) => [f, i]));
const fileRank = new Map(files.map((f, i) => [f, i]));
const crossLoad = loadRefs.filter((l) => !l.browser && l.declFile !== l.file);
const tdz = crossLoad.filter((l) => l.kind !== 'function' && rank.get(l.declFile) > rank.get(l.file));
const classicLater = crossLoad.filter((l) => l.kind !== 'function' && fileRank.get(l.declFile) > fileRank.get(l.file));
const browserAtLoad = new Map();
for (const l of loadRefs.filter((x) => x.browser)) { const k = l.file; if (!browserAtLoad.has(k)) browserAtLoad.set(k, new Set()); browserAtLoad.get(k).add(`${l.name} (${l.via})`); }

// ── the report ────────────────────────────────────────────────────────────────────────────────────────────────────
const out = [];
const say = (s = '') => out.push(s);
const kinds = {};
for (const d of decl.values()) kinds[d.kind] = (kinds[d.kind] || 0) + 1;
say('ES MODULES: THE APP\'S MODULE GRAPH AND GLOBAL SURFACE (phase C before-picture)');
say(`source: ${jsFiles.length} JS files, ${script.length} chars; ${decl.size} top-level names (${Object.entries(kinds).map(([k, v]) => `${v} ${k}`).join(', ')})`);
say(`declared twice: ${dupes.length ? dupes.join('; ') : 'none'}`);
say();
say('1. CROSS-FILE NAMES');
say(`${crossNames.size} of ${decl.size} top-level names are used outside their file, in ${crossRefs} references; ${edgeCount} file-to-file edges, ${mutual} file pairs reference each other.`);
say('per file: declares / used elsewhere / in the engine closure / bytes');
for (const s of spans) {
  const mine = [...decl].filter(([, d]) => d.file === s.file).map(([n]) => n);
  say(`  ${s.file.padEnd(28)} ${String(mine.length).padStart(4)} ${String(mine.filter((n) => crossNames.has(n)).length).padStart(4)} ${String(engineFiles.get(s.file) || 0).padStart(4)} ${String(s.bytes).padStart(8)}`);
}
say();
say('2. SHARED MUTABLE STATE: top-level let/var written from another file (ES imports are read-only bindings)');
const cw = [...crossWrites].sort((a, b) => a[0].localeCompare(b[0]));
say(`${cw.length} names:`);
for (const [n, m] of cw) say(`  ${n.padEnd(26)} ${decl.get(n).kind} in ${decl.get(n).file}; written in ${[...m].map(([f, c]) => `${f} (${c})`).join(', ')}`);
const crossLets = [...decl].filter(([n, d]) => (d.kind === 'let' || d.kind === 'var') && crossNames.has(n));
say(`(${crossLets.length} let/var names are read across files in all; the rest are only read elsewhere, so a getter or a live export binding serves them)`);
say();
say('3. FILE CYCLES (strongly connected components of the file graph)');
say(`${big.length} component(s) with more than one file; sizes ${big.map((c) => c.length).join(', ') || '-'}; ${comps.filter((c) => c.length === 1).length} files stand alone`);
for (const c of big) say(`  [${c.length}] ${c.sort().join(', ')}`);
say(`  alone: ${comps.filter((c) => c.length === 1).map((c) => c[0]).sort().join(', ')}`);
say();
say('4. THE ENGINE: the closure of buildProgram over top-level names');
say(`${engine.size} names (of ${decl.size}) in ${engineFiles.size} files (of ${jsFiles.length}).`);
say('files, names in the closure / names the file declares:');
for (const s of spans) if (engineFiles.has(s.file)) say(`  ${s.file.padEnd(28)} ${engineFiles.get(s.file)} / ${namesPerFile.get(s.file)}`);
say(`${engineBrowser.length} names in the closure use a browser API directly (each is a cut, or a seam to inject):`);
for (const e of engineBrowser.sort((a, b) => a.n.localeCompare(b.n))) say(`  ${e.n.padEnd(26)} ${e.apis.join(', ').padEnd(30)} via ${e.path}`);
say();
say('5. INLINE HANDLERS: app names called by global name from markup and HTML strings (the globals.ts list)');
say(`${handlerAttrs} handler attributes; ${handlerNames.size} distinct app names:`);
say('  ' + [...handlerNames.keys()].sort().join(', '));
say(`of which in the engine closure: ${[...handlerNames.keys()].filter((n) => engine.has(n)).sort().join(', ') || 'none'}`);
say();
say('6. WHAT A STATIC GRAPH CANNOT SEE');
say(`${dynamic.length} dynamic lookups:`);
for (const d of dynamic) say('  ' + d);
say(`undeclared names used (browser and page globals), top 25 by references: ${[...undeclared].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, c]) => `${n} ${c}`).join(', ')}`);
say();
say('7. THE FEATURE TESTS\' REACH: app top-level names that appear in tests/{unit,integration,sweeps,support} (an upper bound)');
const byHow = {};
for (const [n, hows] of testReach) for (const h of hows) (byHow[h] = byHow[h] || []).push(n);
say(`${testReach.size} names over ${testFileCount} test files; EXPORT_NAMES lists ${exported.size}.`);
for (const [h, ns] of Object.entries(byHow)) say(`  ${h} (${ns.length}): ${ns.sort().join(', ')}`);
const reachOutsideEngine = [...testReach.keys()].filter((n) => !engine.has(n)).sort();
say(`not in the engine closure (${reachOutsideEngine.length}): ${reachOutsideEngine.join(', ')}`);
say();
say('8. LOAD TIME: what runs when the script loads');
say('init() is left out: as modules, the entry calls it after every module has evaluated (the boot is not module loading).');
say(`${iifes.length} top-level IIFEs${iifes.length ? ': ' + iifes.join(', ') : ''}; ${calledAtLoad.size} top-level functions run at load: ${[...calledAtLoad].map(([f, v]) => `${f} (from ${v})`).join(', ') || 'none'}`);
say(`${crossLoad.length} load-time references cross files; ${classicLater.length} of them read a const/let/var/class of a LATER file in today's order (a classic-script hazard).`);
say(`browser APIs touched at load, by file (${browserAtLoad.size} files):`);
for (const [f, s] of [...browserAtLoad].sort()) say(`  ${f.padEnd(28)} ${[...s].sort().join(', ')}`);
say(`module evaluation order (entry imports order.json in order; deps first): ${evalOrder.join(' > ')}`);
say(`${tdz.length} load-time reads of another file's const/let/var/class that would evaluate LATER as modules (TDZ):`);
for (const l of tdz) say(`  ${l.file} reads ${l.name} (${l.kind} in ${l.declFile}) via ${l.via}`);
console.log(out.join('\n'));

