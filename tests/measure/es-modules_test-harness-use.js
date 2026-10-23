#!/usr/bin/env node
// Architecture migration phase C, step 4, before-picture (measure pass, Post-v0.239.2).
// Question: which test files reach the app through the VM harness only for engine code (so they can import the engine
// modules instead), which need the page (UI names, a document), and which read or edit the app's text (source
// surgery, static scans)? Per test file, counted through the support files it imports.
//   node tests/measure/es-modules_test-harness-use.js            the report on stdout
// Oracles: acorn's parse of every JS source file (top-level names and the file each lives in), the engine's file list
// typed in tests/support/engine-modules.ts, and the test and support files scanned as text: the code strings handed to
// .eval( and E(, the harness's exported names read off an app handle, and the text and DOM helpers called. No app code
// runs.
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const SRC = path.join(REPO, 'frontends', 'app', 'src', 'legacy', 'src');
const TESTS = path.join(REPO, 'tests');
const NM = path.join(REPO, 'frontends', 'app', 'node_modules');
const acorn = require(path.join(NM, 'acorn'));

// ── the app's top-level names, by file ──────────────────────────────────────────────────────────────────────────
const ENGINE_FILES = /export const ENGINE_FILES = \[([\s\S]*?)\]/.exec(fs.readFileSync(path.join(TESTS, 'support', 'engine-modules.ts'), 'utf8'))[1]
  .match(/'([a-z0-9-]+)'/g).map((s) => s.slice(1, -1));
const order = JSON.parse(fs.readFileSync(path.join(SRC, 'order.json'), 'utf8'));
const jsFiles = order.filter((f) => /\.js$/.test(f)).map((f) => f.replace(/^js\//, '').replace(/\.js$/, ''));
const owner = new Map(); // name -> file
for (const f of jsFiles) {
  const code = fs.readFileSync(path.join(SRC, 'js', f + '.js'), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  for (const st of ast.body) {
    const add = (n) => n && owner.set(n, f);
    if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') add(st.id.name);
    else if (st.type === 'VariableDeclaration') for (const d of st.declarations) { if (d.id.type === 'Identifier') add(d.id.name); }
  }
}
const isEngine = (n) => ENGINE_FILES.includes(owner.get(n));
const H = fs.readFileSync(path.join(TESTS, 'harness.js'), 'utf8');
const EXPORT_NAMES = /EXPORT_NAMES\s*=\s*\[([\s\S]*?)\]/.exec(H)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));

// ── each test and support file, scanned ──────────────────────────────────────────────────────────────────────────
const list = (dir) => fs.readdirSync(path.join(TESTS, dir)).filter((f) => /\.ts$/.test(f)).map((f) => dir + '/' + f);
const SUPPORT = list('support');
const TEST_FILES = [...list('unit'), ...list('integration'), ...list('sweeps')];
const BOOT = /\b(loadApp|loadAppAt|loadText|page|appAt|sharedApp|lensApp|wizardVM|wizardApp|wizardBench|wildcardBench|ledgerBench|engine|countdownVM|boot|d196App|instrumentedApp|legacyWalkApp|swappedApp|fresh)\s*\(/;
const TEXT = /\b(appScript|appText|appHtml|countIn|variant|replaceOnce|stripComments|appCopy|fnSrc|liftFunction|code|flat|occurrences)\s*\(|\.(html|js)\b(?!\s*\()/;
const DOM = /dom:\s*true|registryDom|domRegistry|getElementById|\.document\b|innerHTML|renderWeekView|renderWizardStep|openDetail|doGenerate/;
function scan(rel) {
  const t = fs.readFileSync(path.join(TESTS, rel), 'utf8');
  const names = new Set();
  const take = (code) => { for (const m of code.matchAll(/[A-Za-z_$][\w$]*/g)) if (owner.has(m[0])) names.add(m[0]); };
  for (const m of t.matchAll(/\.eval\(\s*(['"`])([\s\S]*?)\1/g)) take(m[2]);
  for (const m of t.matchAll(/\bE\(\s*[\w.]+\s*,\s*(['"`])([\s\S]*?)\1/g)) take(m[2]);
  for (const n of EXPORT_NAMES) if (new RegExp('\\.' + n.replace(/\$/g, '\\$') + '\\b').test(t)) names.add(n);
  // The harness wrapper and the snapshot and fixture helpers are infrastructure every test imports: not counted.
  const INFRA = ['support/app.ts', 'support/snapshot.ts', 'support/programs.ts'];
  const imports = [...t.matchAll(/from '\.\.?\/(?:support\/)?([a-z0-9-]+)\.ts'/g)].map((m) => 'support/' + m[1] + '.ts').filter((f) => SUPPORT.includes(f) && !INFRA.includes(f));
  return { boots: BOOT.test(t), text: TEXT.test(t), dom: DOM.test(t), names, imports };
}
const S = new Map([...SUPPORT, ...TEST_FILES].map((f) => [f, scan(f)]));
function closure(f, seen = new Set()) {
  if (seen.has(f)) return seen;
  seen.add(f);
  for (const g of S.get(f).imports) closure(g, seen);
  return seen;
}
const rows = TEST_FILES.map((f) => {
  const all = [...closure(f)].map((g) => S.get(g));
  const names = new Set(all.flatMap((x) => [...x.names]));
  const engine = [...names].filter(isEngine), ui = [...names].filter((n) => !isEngine(n));
  const boots = all.some((x) => x.boots), text = all.some((x) => x.text), dom = all.some((x) => x.dom);
  const kind = !boots && !names.size ? 'no app' : ui.length || dom ? 'page' : text ? 'engine + text' : 'engine';
  return { f, kind, engine: engine.length, ui: ui.length, uiNames: ui, text, dom };
});

// ── report ───────────────────────────────────────────────────────────────────────────────────────────────────────
const by = (k) => rows.filter((r) => r.kind === k);
console.log(`# Phase C, step 4: how the tests reach the app (measured ${new Date().toISOString().slice(0, 10)})\n`);
console.log(`App: ${owner.size} top-level names in ${jsFiles.length} JS files; the engine is ${ENGINE_FILES.length} files and ${[...owner.keys()].filter(isEngine).length} names. The harness exports ${EXPORT_NAMES.length} names.\n`);
console.log('| Kind | Files | Meaning |');
console.log('|---|---|---|');
console.log(`| no app | ${by('no app').length} | never boots the app (pure helpers, \`@ia/core\`, the e2e code) |`);
console.log(`| engine | ${by('engine').length} | only engine names, no document, no app text: can import the engine modules |`);
console.log(`| engine + text | ${by('engine + text').length} | engine names, and reads or edits the app's text (variants, static scans) |`);
console.log(`| page | ${by('page').length} | UI names or a document: stays on the VM until its screen moves (phase E) |`);
console.log(`| total | ${rows.length} | |\n`);
for (const k of ['engine', 'engine + text', 'page', 'no app']) {
  console.log(`## ${k}\n`);
  for (const r of by(k)) console.log(`- \`${r.f}\`: ${r.engine} engine names, ${r.ui} UI names${r.text ? ', reads app text' : ''}${r.dom ? ', a document' : ''}${r.ui ? ' (' + r.uiNames.slice(0, 8).join(', ') + (r.ui > 8 ? ', …' : '') + ')' : ''}`);
  console.log('');
}
const uiCount = new Map();
for (const r of rows) for (const n of r.uiNames) uiCount.set(n, (uiCount.get(n) || 0) + 1);
console.log('## UI names the tests reach, by how many test files reach each\n');
console.log([...uiCount].sort((a, b) => b[1] - a[1]).map(([n, c]) => `\`${n}\` ${c} (${owner.get(n) || 'harness'})`).join(', '));
