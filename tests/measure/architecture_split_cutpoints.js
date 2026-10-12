#!/usr/bin/env node
// Architecture migration phase B, before-picture (measure pass, Post-v0.239.1).
// Question: where to cut index.html's inline <script> (and <style>, and the body markup) into ordered source files
// that concatenate back to index.html byte for byte, and what each JS file depends on (phase C's imports).
//   node tests/measure/architecture_split_cutpoints.js [index.html] [scratchDir]
// Writes the pieces and the rebuilt file under scratchDir (never into the repo); prints the report on stdout.
// Oracles: the parser (acorn; each cut is proved by parsing the prefix with vm.Script and each piece alone), the CSS
// brace depth counted by hand, and the HTML bytes themselves (cmp). Dependencies come from eslint-scope's reference
// list, not from any app function. Cuts are anchored on the NAME of the first top-level statement of each file, so the
// script still runs when lines move; every anchor must match exactly one top-level statement.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.resolve(__dirname, '..', '..');
const acorn = require(path.join(REPO, 'app/node_modules/acorn'));
const escope = require(path.join(REPO, 'app/node_modules/eslint-scope'));
const evk = require(path.join(REPO, 'app/node_modules/eslint-visitor-keys'));

const SRC = process.argv[2] || path.join(REPO, 'index.html');
const OUT = process.argv[3] || path.join(REPO, 'temp', 'architecture_split');
const html = fs.readFileSync(SRC, 'utf8');
const buf = fs.readFileSync(SRC);
let fails = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
const lineOf = (off) => { let n = 1; for (let i = html.indexOf('\n'); i !== -1 && i < off; i = html.indexOf('\n', i + 1)) n++; return n; };
const firstLine = (off) => lineOf(html[off] === '\n' ? off + 1 : off);
const once = (needle, from = 0) => { const i = html.indexOf(needle, from); if (i < 0 || html.indexOf(needle, i + 1) !== -1 && needle !== '\n') {} return i; };

// ---------------------------------------------------------------- the four regions (sync-legacy's own rule)
const styleOpenEnd = html.indexOf('>', html.indexOf('<style')) + 1;
const styleClose = html.indexOf('</style>');
const bodyOpen = html.indexOf('<body');
const scriptOpen = html.indexOf('<script', bodyOpen);
const scriptOpenEnd = html.indexOf('>', scriptOpen) + 1;
const scriptClose = html.indexOf('</script>', scriptOpenEnd);
const css = html.slice(styleOpenEnd, styleClose);
const js = html.slice(scriptOpenEnd, scriptClose);
console.log(`SOURCE ${SRC}  bytes ${buf.length}  lines ${html.split('\n').length}  ia-version ${(html.match(/name="ia-version" content="([^"]+)"/) || [])[1]}`);
console.log(`style content lines ${lineOf(styleOpenEnd)}-${lineOf(styleClose)}  script content lines ${lineOf(scriptOpenEnd)}-${lineOf(scriptClose)}`);

// ---------------------------------------------------------------- JS: top-level statements
const comments = [];
const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', ranges: true, onComment: comments });
const stmtNames = (s) => {
  if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') return [s.id.name];
  if (s.type === 'VariableDeclaration') { const out = []; const pat = (p) => { if (!p) return; if (p.type === 'Identifier') out.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach((q) => pat(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(pat); else if (p.type === 'AssignmentPattern') pat(p.left); else if (p.type === 'RestElement') pat(p.argument); }; s.declarations.forEach((d) => pat(d.id)); return out; }
  return [];
};
const kindOf = (s) => s.type === 'FunctionDeclaration' ? 'function' : s.type === 'VariableDeclaration' ? s.kind : s.type === 'ClassDeclaration' ? 'class' : 'statement';
const stmts = ast.body.map((s, i) => ({ i, node: s, start: s.start, end: s.end, names: stmtNames(s), kind: kindOf(s) }));
const kinds = {}; stmts.forEach((s) => { kinds[s.kind] = (kinds[s.kind] || 0) + 1; });
const nBindings = stmts.filter((s) => /^(let|const|var)$/.test(s.kind)).length;
console.log(`top-level statements ${stmts.length}: ${JSON.stringify(kinds)}  (let/const/var statements ${nBindings}, names ${stmts.filter((s) => /^(let|const|var)$/.test(s.kind)).reduce((a, s) => a + s.names.length, 0)})`);
const dupNames = {}; stmts.forEach((s) => s.names.forEach((n) => { dupNames[n] = (dupNames[n] || 0) + 1; }));
const dups = Object.entries(dupNames).filter(([, c]) => c > 1);
console.log(`top-level names declared more than once: ${dups.length} ${JSON.stringify(dups)}`);

// The plan: [file, anchor] where anchor is the first name of the file's first top-level statement (null = script start).
const PLAN = [
  ['storage.js', null, 'icons, esc, ia_ program/log/history storage, set drafts, day-history snapshots'],
  ['rest-day.js', '_restDraft', 'rest-day sheet and rest-day moves (ia_moves_), collisions, eligibility'],
  ['shell.js', 'activeProgId', 'global UI state (activeProgId, currentWeek, ...), showScreen, tab bar, toast'],
  ['exercise-library.js', 'EXLIB', 'EXLIB, carry/press sides, REP_AFFINITY, min experience, station class, supersets, renames, exStoreKey/EX_KEY_ALIAS, seededRand, swap universe'],
  ['wizard.js', 'ALL_DAYS_ORDER', 'day constants, wizard state and steps, start date, race/goal tables, 1RM calc, pace inputs, renderWizardStep'],
  ['nsw-cardio.js', 'parseTimeToSecs', 'paceGoalTarget, calcProgramLength, run progressions, cutback weeks, NSW Table 6 INT/CHI, buildRunSession'],
  ['nrc-race.js', 'NRC_GOALS', 'NRC goals and tables, race countdown, raceAlignment, raceWeekPin, buildNRCSession'],
  ['bike-swim.js', 'buildBikeSession', 'buildBikeSession, buildSwimSession'],
  ['cardio-progression.js', 'runOnRampWeeks', 'on-ramp, PACE_CHART, row pace, performance predicates, taper, multi-sport targets, buildCardioProgression, spaceHardCardio'],
  ['prehab.js', 'buildHipSection', 'hip, foot/ankle and rehab sections, core pillars, gear lens, bodyweight subs'],
  ['power-accessory.js', '_STACK_LOADED', 'power/explosive dose and rest, bodyweight sets, accessory grammar, hinge clamp, prevention dose, bodyweight sweep'],
  ['core-legs.js', 'getDynamicCoreBlock', 'dynamic core, injectDynamicCore, NRC leg-lift placement, leg/adjacent/same-region deconfliction'],
  ['wizard-generate.js', 'generateProgram', 'generateProgram, length warning, mile/swim advisories, doGenerate'],
  ['engine-a.js', 'engineA_timeline', 'Engine A timeline and split router'],
  ['engine-b-calendar.js', 'engineB_cardio', 'Engine B cardio, injury cardio sweep, planCalendar'],
  ['injury.js', 'INJURY_REGIONS', 'injury regions, injuryPlan, applyInjuryFilter, injuryDayTitle'],
  ['engine-c.js', 'engineC_kinematics', 'Engine C kinematic pool filter'],
  ['region-caps.js', 'REGION_CEILING', 'regional fatigue/set/move caps, cardio interference, region and pattern lenses, aux swap families, rep floor'],
  ['swaps-edits.js', 'swapUniverseFor', 'exercise swap candidates, swap store, day edits (add/skip), swap counts (coach nudge store)'],
  ['budget-engine-d.js', '_PATTERN_REGION', 'compound tiers, deload, posterior-chain lens, session budget, regional fatigue, Engine D, long-run tiers, race eve, sweeps, buildProgram'],
  ['random-wildcard.js', 'RAND_POOLS', 'random workout, Wildcards'],
  ['week-view.js', 'allDaysList', 'day/date helpers, start-date partial week, tips, hero, day codes, week strip scoot, renderWeekView'],
  ['sections.js', 'liftRpeKeyHTML', 'RPE key, section rounds, buildSectionsHTML, parseRx'],
  ['set-logging.js', 'STALE_LOAD_DAYS', 'load recency, set auto-save, collapsed set bar, buildExItem, benchmark read-back, buildCardioHTML'],
  ['log-entries.js', 'isWeightedExercise', 'exercise kind predicates, ex weights, entry day, logExerciseWeight, RPE, cardio dose grammar'],
  ['wheel-log.js', '_IAW_ROW', 'the wheel, cardio log fields, buildLogHTML, export, session progress'],
  ['rest-timer.js', '_ruId', 'floating count-up rest stopwatch'],
  ['day-detail.js', '_epley', 'e1RM calculator, range-top nudge, openDetail, KB chips, ex weight steppers'],
  ['swap-sheet.js', '_swapCtx', 'swap sheet, add/skip handlers, undo swap'],
  ['day-status.js', '_nudgeCtx', 'swap nudge, closeDetail, RPE info, day status, cardio log, export copy'],
  ['programs.js', 'progAlignment', 'program race/start editing, run anchor, program detail, goal sheet, mile pencil, program list'],
  ['overlays.js', '_parseLocalDate', 'temporary overlays (injury, travel), pace shift, overlay chip and sheets'],
  ['program-manage.js', 'refreshProgram', 'refreshProgram, active program, rename, archive/purge/delete'],
  ['progress-data.js', 'showProgressScreen', 'progress screen entry, recovery pace trend, wizard seed, progress chips, ladder/class/easy/drift/ledger data'],
  ['progress-charts.js', '_iaCard', 'chart builders, easy-zone redesign'],
  ['lift-ledger.js', '_slotOfEntry', 'lift ledger model and cards'],
  ['progress-screen.js', 'renderProgressScreen', 'renderProgressScreen, dot charts'],
  ['bug-report-init.js', 'BUG_FORM_KEY', 'bug report, init'],
  ['popups.js', 'POP_POOLS', 'reinforcement pop-ups'],
  ['streaks-reminders.js', 'dayDateFor', 'streaks, stats, reminders'],
  ['update-check.js', 'IA_VERSION', 'version label, update banner and check, boot statements'],
];
// Resolve anchors to statements; cut = start of the line after the previous statement's last line,
// so the section banner comments travel with the file they introduce.
const cuts = [0];
for (let k = 1; k < PLAN.length; k++) {
  const hits = stmts.filter((s) => s.names[0] === PLAN[k][1]);
  if (hits.length !== 1) { fail(`anchor ${PLAN[k][1]} matches ${hits.length} statements`); cuts.push(cuts[k - 1]); continue; }
  const s = hits[0]; const prev = stmts[s.i - 1];
  const nl = js.indexOf('\n', prev.end);
  const cut = nl + 1;
  const between = js.slice(prev.end, nl);
  if (!/^\s*(\/\/.*)?$/.test(between)) fail(`${PLAN[k][0]}: text after previous statement on its line: ${JSON.stringify(between)}`);
  if (cut > s.start) fail(`${PLAN[k][0]}: cut ${cut} past statement start ${s.start}`);
  if (cut <= cuts[k - 1]) fail(`${PLAN[k][0]}: cuts out of order`);
  // a block comment must not straddle the cut
  for (const c of comments) if (c.start < cut && c.end > cut) fail(`${PLAN[k][0]}: cut inside a comment`);
  cuts.push(cut);
}
cuts.push(js.length);
const jsPieces = PLAN.map(([file, anchor, covers], k) => ({ file, anchor, covers, from: cuts[k], to: cuts[k + 1], text: js.slice(cuts[k], cuts[k + 1]) }));
jsPieces.forEach((p, k) => { p.stmts = stmts.filter((s) => s.start >= p.from && s.end <= p.to); p.k = k; });
const covered = jsPieces.reduce((a, p) => a + p.stmts.length, 0);
if (covered !== stmts.length) fail(`statements covered ${covered} of ${stmts.length}`);

// Proof 1: every prefix parses as complete statements (vm.Script compiles, never runs); every piece parses alone.
let prefixOK = 0, aloneOK = 0;
for (let k = 1; k < cuts.length - 1; k++) {
  try { new vm.Script(js.slice(0, cuts[k]), { filename: 'prefix' + k }); prefixOK++; } catch (e) { fail(`prefix before ${PLAN[k][0]} does not parse: ${e.message}`); }
  try { acorn.parse(js.slice(cuts[k], js.length), { ecmaVersion: 'latest', sourceType: 'script' }); } catch (e) { fail(`suffix from ${PLAN[k][0]} does not parse: ${e.message}`); }
}
for (const p of jsPieces) { try { new vm.Script(p.text, { filename: p.file }); acorn.parse(p.text, { ecmaVersion: 'latest', sourceType: 'script' }); aloneOK++; } catch (e) { fail(`${p.file} does not parse alone: ${e.message}`); } }
console.log(`\nJS CUT PROOF: ${prefixOK}/${cuts.length - 2} prefixes compile with vm.Script (suffixes parse with acorn); ${aloneOK}/${jsPieces.length} pieces compile alone`);

// ---------------------------------------------------------------- CSS cuts (brace depth 0, outside comments and strings)
const CSS_PLAN = [
  ['base.css', null, '@import, tokens, reset, light lock'],
  ['shell.css', '/* ── BOTTOM TAB BAR ── */', 'tab bar, top bar, program list'],
  ['wizard.css', '/* ── WIZARD ── */', 'wizard'],
  ['week-view.css', '/* ── WEEK VIEW (same as before) ── */', 'week view, injury state and week wash'],
  ['detail-sheet.css', '/* ── DETAIL OVERLAY ── */', 'detail overlay, wheel, dose log, day status, swap, add/skip, e1RM'],
  ['overlays-components.css', '/* ── RANDOM OVERLAY ── */', 'random overlay and filter, toast, update banner, generate screen, cards, summary, cardio blocks, overflow'],
  ['this-week.css', '/* ===== THIS WEEK', 'this-week redesign: pills, strip, hero, tiles, up next'],
  ['session-sheet.css', '/* ===== SESSION SHEET', 'session sheet, set bar, logged state, rest stopwatch'],
  ['motion.css', '/* ===== V18.7: MOTION', 'motion, enriched strip, session journal, RPE modal'],
];
const cssCuts = [0];
for (let k = 1; k < CSS_PLAN.length; k++) {
  const n = css.split(CSS_PLAN[k][1]).length - 1;
  if (n !== 1) { fail(`css anchor ${CSS_PLAN[k][1]} count ${n}`); cssCuts.push(cssCuts[k - 1]); continue; }
  cssCuts.push(css.lastIndexOf('\n', css.indexOf(CSS_PLAN[k][1])) + 1);
}
cssCuts.push(css.length);
// independent scan: depth and comment/string state at each cut
const cssState = (() => { const at = new Map(); let d = 0, inC = false, q = null; const want = new Set(cssCuts); for (let i = 0; i <= css.length; i++) { if (want.has(i)) at.set(i, { d, inC, q }); const c = css[i]; if (inC) { if (c === '*' && css[i + 1] === '/') { inC = false; i++; } continue; } if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; } if (c === '/' && css[i + 1] === '*') { inC = true; i++; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '{') d++; else if (c === '}') d--; } return { at, endDepth: d }; })();
let cssOK = 0; for (let k = 1; k < cssCuts.length - 1; k++) { const s = cssState.at.get(cssCuts[k]); if (s.d === 0 && !s.inC && !s.q) cssOK++; else fail(`css cut ${CSS_PLAN[k][0]} at depth ${s.d} comment ${s.inC} string ${s.q}`); }
console.log(`CSS CUT PROOF: ${cssOK}/${cssCuts.length - 2} cuts at brace depth 0 outside comments/strings; depth at end ${cssState.endDepth}`);
const cssPieces = CSS_PLAN.map(([file, , covers], k) => ({ file, covers, from: cssCuts[k], to: cssCuts[k + 1], text: css.slice(cssCuts[k], cssCuts[k + 1]) }));

// ---------------------------------------------------------------- markup partials (tags live in the partials)
const popMark = html.indexOf('<!-- REINFORCEMENT POPUP (celebration + day-after reminder) -->', scriptClose);
const detailMark = html.indexOf('<!-- DETAIL OVERLAY -->', bodyOpen);
const MARKUP = [
  ['head.html', 0, styleOpenEnd, 'doctype, <head> metas (ia-version), title, <style> open tag'],
  ['screens.html', styleClose, html.lastIndexOf('\n', detailMark) + 1, '</style></head><body>, update banner, screens 1-4 (home, wizard, generating, week)'],
  ['overlays.html', html.lastIndexOf('\n', detailMark) + 1, scriptOpenEnd, 'detail, add, swap nudge, RPE info, random, rest, change, goal, mile sheets, rest float, <script> open tag'],
  ['screens-late.html', scriptClose, html.lastIndexOf('\n', popMark) + 1, '</script>, progress and bug screens, tab bar'],
  ['popups.html', html.lastIndexOf('\n', popMark) + 1, html.length, 'reinforcement popup, confetti, </body></html>'],
];
// ---------------------------------------------------------------- write pieces in order, rebuild, compare
const ORDER = [];
ORDER.push({ dir: 'markup', ...{ file: MARKUP[0][0], text: html.slice(MARKUP[0][1], MARKUP[0][2]), covers: MARKUP[0][3] } });
cssPieces.forEach((p) => ORDER.push({ dir: 'css', ...p }));
ORDER.push({ dir: 'markup', file: MARKUP[1][0], text: html.slice(MARKUP[1][1], MARKUP[1][2]), covers: MARKUP[1][3] });
ORDER.push({ dir: 'markup', file: MARKUP[2][0], text: html.slice(MARKUP[2][1], MARKUP[2][2]), covers: MARKUP[2][3] });
jsPieces.forEach((p) => ORDER.push({ dir: 'js', ...p }));
ORDER.push({ dir: 'markup', file: MARKUP[3][0], text: html.slice(MARKUP[3][1], MARKUP[3][2]), covers: MARKUP[3][3] });
ORDER.push({ dir: 'markup', file: MARKUP[4][0], text: html.slice(MARKUP[4][1], MARKUP[4][2]), covers: MARKUP[4][3] });
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ['markup', 'css', 'js']) fs.mkdirSync(path.join(OUT, 'src', d), { recursive: true });
ORDER.forEach((p, i) => { p.path = path.join(OUT, 'src', p.dir, String(i).padStart(2, '0') + '-' + p.file); fs.writeFileSync(p.path, p.text, 'utf8'); });
fs.writeFileSync(path.join(OUT, 'src', 'ORDER.txt'), ORDER.map((p) => path.relative(path.join(OUT, 'src'), p.path)).join('\n') + '\n');
// rebuild from the files on disk only (the files, not the in-memory slices)
const rebuilt = Buffer.concat(fs.readFileSync(path.join(OUT, 'src', 'ORDER.txt'), 'utf8').trim().split('\n').map((r) => fs.readFileSync(path.join(OUT, 'src', r))));
const rebuiltPath = path.join(OUT, 'index.rebuilt.html');
fs.writeFileSync(rebuiltPath, rebuilt);
const ident = Buffer.compare(rebuilt, buf) === 0;
if (!ident) fail('rebuilt file differs from index.html');
console.log(`\nBYTE IDENTITY: ${ORDER.length} pieces (${MARKUP.length} markup, ${cssPieces.length} css, ${jsPieces.length} js) -> ${rebuilt.length} bytes vs ${buf.length}: ${ident ? 'IDENTICAL' : 'DIFFERENT'}  (rebuilt at ${rebuiltPath})`);

// ---------------------------------------------------------------- tables
console.log('\nJS FILE TABLE (lines are index.html lines; fn = top-level function declarations; b = top-level let/const/var statements)');
for (const p of jsPieces) {
  const f = p.stmts.filter((s) => s.kind === 'function').length, b = p.stmts.filter((s) => /^(let|const|var)$/.test(s.kind)).length, o = p.stmts.length - f - b;
  p.lines = [firstLine(scriptOpenEnd + p.from), lineOf(scriptOpenEnd + p.to - 1)];
  console.log(`  ${String(p.k + 1).padStart(2)} ${p.file.padEnd(24)} ${String(p.lines[0]).padStart(5)}-${String(p.lines[1]).padEnd(5)} ${String(p.lines[1] - p.lines[0] + 1).padStart(5)} lines  fn ${String(f).padStart(3)}  b ${String(b).padStart(2)}${o ? '  other ' + o : ''}  ${p.covers}`);
}
console.log('CSS FILE TABLE');
cssPieces.forEach((p, k) => console.log(`  ${String(k + 1).padStart(2)} ${p.file.padEnd(24)} ${firstLine(styleOpenEnd + p.from)}-${lineOf(styleOpenEnd + p.to - 1)}  ${p.covers}`));
console.log('MARKUP PARTIALS');
MARKUP.forEach(([f, a, b, c]) => console.log(`     ${f.padEnd(24)} ${lineOf(a)}-${lineOf(b - 1)}  ${c}`));

// ---------------------------------------------------------------- sync-legacy compatibility
(async () => {
  try {
    const { split } = await import(path.join(REPO, 'app/scripts/sync-legacy.mjs'));
    const s = split(rebuilt.toString('utf8'));
    const cssCat = cssPieces.map((p) => p.text).join(''), jsCat = jsPieces.map((p) => p.text).join('');
    const m = ORDER.filter((p) => p.dir === 'markup');
    const before = (m[1].text + m[2].text); const after = (m[3].text + m[4].text);
    const markupFromSources = before.slice(before.indexOf('<body>') + 6, before.lastIndexOf('<script>')) + after.slice('</script>'.length, after.lastIndexOf('</body>'));
    const headFromSources = m[0].text.slice(m[0].text.indexOf('<head>') + 6, m[0].text.lastIndexOf('<style')) + before.slice('</style>'.length, before.indexOf('</head>'));
    const checks = { css: s.css === cssCat, js: s.js === jsCat, markup: s.markup === markupFromSources, headRest: s.headRest === headFromSources, version: s.version };
    console.log(`\nSYNC-LEGACY: split(rebuilt) vs pieces read straight from the sources: ${JSON.stringify(checks)}`);
    if (!checks.css || !checks.js || !checks.markup || !checks.headRest) fail('sync-legacy pieces differ from the sources');
  } catch (e) { fail('sync-legacy import/split: ' + e.message); }
  deps();
})();

// ---------------------------------------------------------------- dependencies (eslint-scope)
function deps() {
  const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script', childVisitorKeys: evk.KEYS, fallback: 'iteration' });
  const g = sm.globalScope;
  const fileOfPos = (pos) => { for (const p of jsPieces) if (pos >= p.from && pos < p.to) return p.k; return -1; };
  const def = new Map(); // name -> {k, kind, stmt}
  for (const s of stmts) for (const n of s.names) if (!def.has(n)) def.set(n, { k: fileOfPos(s.start), kind: s.kind, stmt: s });
  const topOf = (pos) => { let lo = 0, hi = stmts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (stmts[mid].start <= pos) lo = mid; else hi = mid - 1; } return stmts[lo]; };
  const CB = new Set(['map', 'forEach', 'filter', 'reduce', 'reduceRight', 'some', 'every', 'find', 'findIndex', 'flatMap', 'sort', 'from', 'fromEntries', 'assign']);
  // a function scope runs at load time if it is an IIFE or a callback to an eager array method
  const eager = (sc) => { const n = sc.block; const par = n.__parent; if (!par) return false; if (par.type === 'CallExpression' && par.callee === n) return true; if (par.type === 'CallExpression' && par.arguments.includes(n) && par.callee.type === 'MemberExpression' && CB.has(par.callee.property.name)) return true; return false; };
  // parent links
  (function link(n, p) { if (!n || typeof n.type !== 'string') return; n.__parent = p; for (const key of evk.KEYS[n.type] || Object.keys(n)) { const v = n[key]; if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && link(c, n)); else if (v && typeof v.type === 'string') link(v, n); } })(ast, null);
  const refs = []; const refNodes = new Set();
  // eslint-scope 9 resolves references to global declarations (they leave g.through), so take every reference
  // that resolved to a global-scope variable, plus unresolved ones that name a top-level declaration.
  const allRefs = []; for (const sc of sm.scopes) for (const r of sc.references) allRefs.push(r);
  for (const r of allRefs) {
    const name = r.identifier.name; if (!def.has(name)) continue;
    if (r.resolved ? r.resolved.scope !== g : false) continue;
    let sc = r.from, load = true, fnTop = null;
    while (sc && sc !== g) { if (sc.type === 'function') { if (!eager(sc)) load = false; } sc = sc.upper; }
    const top = topOf(r.identifier.start);
    refs.push({ name, d: def.get(name), from: fileOfPos(r.identifier.start), pos: r.identifier.start, write: r.isWrite() && !r.init, init: !!r.init, load, top });
    refNodes.add(r.identifier);
  }
  const nameFile = (k) => (k >= 0 ? jsPieces[k].file : '?');
  // instrument self-check (independent of the result): buildProgram calls engineA_timeline, renderWeekView reads activeProg
  const seen = (a, b) => refs.some((r) => r.name === b && r.top.names[0] === a);
  console.log(`\nINSTRUMENT: ${refs.length} references to top-level names; self-check buildProgram->engineA_timeline ${seen('buildProgram', 'engineA_timeline')}, renderWeekView->activeProg ${seen('renderWeekView', 'activeProg')}`);
  if (refs.length < 1000 || !seen('buildProgram', 'engineA_timeline') || !seen('renderWeekView', 'activeProg')) fail('dependency instrument found too few references');
  // per-file defines and imports
  console.log('\nPER-FILE DEPENDENCIES (defines n; uses names from earlier files <, later files >)');
  const edges = jsPieces.map(() => new Map());
  for (const r of refs) if (r.from !== r.d.k && !r.init) { const m = edges[r.from]; if (!m.has(r.d.k)) m.set(r.d.k, new Set()); m.get(r.d.k).add(r.name); }
  for (const p of jsPieces) {
    const defs = p.stmts.flatMap((s) => s.names);
    const m = edges[p.k]; const earlier = [...m].filter(([k]) => k < p.k), later = [...m].filter(([k]) => k > p.k);
    const n = (a) => a.reduce((x, [, s]) => x + s.size, 0);
    console.log(`  ${p.file}: defines ${defs.length}; uses ${n(earlier)} names from ${earlier.length} earlier files, ${n(later)} names from ${later.length} later files; used by ${jsPieces.filter((q) => edges[q.k].has(p.k)).length} files`);
    console.log(`    defines: ${defs.join(' ')}`);
    for (const [k, s] of [...m].sort((a, b) => a[0] - b[0])) console.log(`    ${k < p.k ? '<' : '>'} ${jsPieces[k].file}: ${[...s].sort().join(' ')}`);
  }
  // file graph cycles (Tarjan)
  const idx = [], low = [], on = [], st = []; let c = 0; const sccs = [];
  const sconn = (v) => { idx[v] = low[v] = c++; st.push(v); on[v] = true; for (const w of edges[v].keys()) { if (idx[w] === undefined) { sconn(w); low[v] = Math.min(low[v], low[w]); } else if (on[w]) low[v] = Math.min(low[v], idx[w]); } if (low[v] === idx[v]) { const s = []; let w; do { w = st.pop(); on[w] = false; s.push(w); } while (w !== v); sccs.push(s); } };
  jsPieces.forEach((p) => idx[p.k] === undefined && sconn(p.k));
  const big = sccs.filter((s) => s.length > 1);
  const back = jsPieces.reduce((a, p) => a + [...edges[p.k].keys()].filter((k) => k > p.k).length, 0), fwd = jsPieces.reduce((a, p) => a + [...edges[p.k].keys()].filter((k) => k < p.k).length, 0);
  console.log(`\nFILE GRAPH: ${fwd + back} file->file edges (${fwd} to earlier files, ${back} to later files); strongly connected components with >1 file: ${big.length}; largest ${Math.max(0, ...big.map((s) => s.length))} files`);
  big.forEach((s) => console.log(`  cycle of ${s.length}: ${s.sort((a, b) => a - b).map(nameFile).join(' ')}`));

  // load-order hazards
  const direct = refs.filter((r) => r.load && !r.init);
  const laterDirect = direct.filter((r) => r.d.stmt.start > r.top.start);
  const crossLater = laterDirect.filter((r) => r.d.k > r.from);
  const sameLater = laterDirect.filter((r) => r.d.k === r.from);
  const fmt = (r) => `${r.name}[${r.d.kind} ${nameFile(r.d.k)}:${lineOf(scriptOpenEnd + r.d.stmt.start)}] used at ${nameFile(r.from)}:${lineOf(scriptOpenEnd + r.pos)} in ${r.top.names[0] || r.top.kind}`;
  console.log(`\nLOAD-TIME REFERENCES: ${direct.length} references to top-level names execute while the script loads (top level, IIFE or eager array callback)`);
  const byKind = (a) => { const o = {}; a.forEach((r) => { const kk = r.d.kind === 'function' ? 'function' : 'binding(' + r.d.kind + ')'; o[kk] = (o[kk] || 0) + 1; }); return JSON.stringify(o); };
  console.log(`  to a name declared LATER in the script: ${laterDirect.length} ${byKind(laterDirect)}; in a later FILE ${crossLater.length} ${byKind(crossLater)}; later in the same file ${sameLater.length}`);
  direct.forEach((r) => console.log('    load-time ' + fmt(r)));
  crossLater.forEach((r) => console.log('    direct ' + fmt(r)));
  // a name declared twice: in one script the LAST declaration serves every caller; in modules each file keeps its own
  for (const [n] of dups) { const ds = stmts.filter((s) => s.names.includes(n)); const callers = {}; refs.filter((r) => r.name === n).forEach((r) => { const f = nameFile(r.from); callers[f] = (callers[f] || 0) + 1; }); console.log(`  DUPLICATE ${n}: declared at ${ds.map((s) => nameFile(fileOfPos(s.start)) + ':' + lineOf(scriptOpenEnd + s.start)).join(' and ')} (the last one wins today); references by file ${JSON.stringify(callers)}`); }
  sameLater.forEach((r) => console.log('    same-file ' + fmt(r)));
  // transitive: a load-time call of a top-level function runs its body now
  const bodyRefs = new Map(); for (const r of refs) { if (r.top.kind === 'function') { const n = r.top.names[0]; if (!bodyRefs.has(n)) bodyRefs.set(n, []); bodyRefs.get(n).push(r); } }
  const trans = []; const seenT = new Set();
  for (const r of direct) {
    if (r.d.kind !== 'function') continue;
    const trigger = r.top; const stack = [r.name]; const seen = new Set([r.name]);
    while (stack.length) { const fn = stack.pop(); for (const q of bodyRefs.get(fn) || []) { if (q.d.kind === 'function') { if (!seen.has(q.name)) { seen.add(q.name); stack.push(q.name); } } else if (q.d.stmt.start > trigger.start) { const key = trigger.start + ':' + q.name; if (!seenT.has(key)) { seenT.add(key); trans.push({ q, trigger, via: r.name }); } } } }
  }
  console.log(`  TRANSITIVE: a load-time call reaches a let/const/var declared after the triggering statement: ${trans.length} (any depth, deferred inner closures included, so an upper bound)`);
  trans.slice(0, 40).forEach((t) => console.log(`    ${t.q.name}[${t.q.d.kind} ${nameFile(t.q.d.k)}] reached from ${nameFile(fileOfPos(t.trigger.start))}:${lineOf(scriptOpenEnd + t.trigger.start)} (${t.trigger.names[0] || t.trigger.kind}) via ${t.via}`));
  // phase C: load-time calls into a function defined in a later file (hoisting saves it today)
  const fnLater = crossLater.filter((r) => r.d.kind === 'function');
  console.log(`  PHASE C ONLY (hoisted today): load-time calls/refs to a function declared in a later file: ${fnLater.length}`);

  // shared mutable state
  console.log('\nMUTABLE TOP-LEVEL STATE (let/var) read or written outside its file');
  let nShared = 0, nWrittenElsewhere = 0;
  const mut = [...def].filter(([, d]) => d.kind === 'let' || d.kind === 'var');
  for (const [name, d] of mut) {
    const rs = refs.filter((r) => r.name === name && !r.init);
    const wf = new Set(rs.filter((r) => r.write).map((r) => r.from)), rf = new Set(rs.filter((r) => !r.write).map((r) => r.from));
    const outside = [...wf, ...rf].some((k) => k !== d.k);
    if (!outside) continue; nShared++;
    const wo = [...wf].some((k) => k !== d.k); if (wo) nWrittenElsewhere++;
    console.log(`  ${d.kind} ${name} (${nameFile(d.k)}): written in [${[...wf].map(nameFile).join(' ')}] read in [${[...rf].map(nameFile).join(' ')}]${wo ? '  WRITTEN OUTSIDE ITS FILE' : ''}`);
  }
  console.log(`  total let/var names ${mut.length}; used outside their file ${nShared}; written outside their file ${nWrittenElsewhere}`);
  // const objects mutated from another file
  const MUT = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'set', 'add', 'delete', 'clear', 'sort', 'reverse', 'fill']);
  const rootId = (e) => { while (e && e.type === 'MemberExpression') e = e.object; return e; };
  const cm = new Map();
  (function walk(n) { if (!n || typeof n.type !== 'string') return; let tgt = null;
    if ((n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression') ) tgt = n.left; else if (n.type === 'UpdateExpression' && n.argument.type === 'MemberExpression') tgt = n.argument; else if (n.type === 'UnaryExpression' && n.operator === 'delete' && n.argument.type === 'MemberExpression') tgt = n.argument; else if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && !n.callee.computed && MUT.has(n.callee.property.name)) tgt = n.callee.object;
    if (tgt) { const id = rootId(tgt); if (id && id.type === 'Identifier' && refNodes.has(id) && def.get(id.name) && def.get(id.name).kind === 'const') { const d = def.get(id.name); const f = fileOfPos(id.start); if (!cm.has(id.name)) cm.set(id.name, { d, files: new Set() }); cm.get(id.name).files.add(f); } }
    for (const key of evk.KEYS[n.type] || []) { const v = n[key]; if (Array.isArray(v)) v.forEach(walk); else walk(v); } })(ast);
  const cmx = [...cm].filter(([, v]) => [...v.files].some((f) => f !== v.d.k));
  console.log(`CONST OBJECTS MUTATED (member write or mutating call): ${cm.size} names; from outside their file ${cmx.length}`);
  cmx.forEach(([n, v]) => console.log(`  const ${n} (${nameFile(v.d.k)}) mutated in [${[...v.files].map(nameFile).join(' ')}]`));

  handlers(def, nameFile);
}

// ---------------------------------------------------------------- inline handlers -> global surface
function handlers(def, nameFile) {
  const fileOfName = (n) => def.has(n) ? nameFile(def.get(n).k) : null;
  // inline attributes, plus handler strings carried as data and spliced in later (popFire's actions: {onclick:"..."})
  const attrRe = /(^|[^.\w$])(on[a-z]+)(?:=|:)(\\?["'`])/g;
  const KW = new Set(['if', 'else', 'return', 'function', 'typeof', 'new', 'void', 'for', 'while', 'switch', 'catch', 'this']);
  const hs = []; let m;
  while ((m = attrRe.exec(html))) {
    const q = m[3]; let i = m.index + m[0].length, depth = 0, val = '';
    while (i < html.length) { if (html.startsWith('${', i)) { depth++; val += '\u0000'; i += 2; continue; } if (depth && html[i] === '{') { depth++; i++; continue; } if (depth && html[i] === '}') { depth--; i++; continue; } if (!depth && html.startsWith(q, i)) break; if (!depth) val += html[i]; i++; }
    const off = m.index + m[1].length; const where = off < scriptOpenEnd ? 'markup-before' : off < scriptClose ? 'script' : 'markup-after';
    const clean = val.replace(/\\'[^']*?\\'/g, "''").replace(/'[^']*'/g, "''").replace(/&quot;[^&]*&quot;/g, "''");
    const calls = []; const cr = /(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g; let c; while ((c = cr.exec(clean))) if (!KW.has(c[2])) calls.push(c[2]);
    const idents = []; const ir = /(^|[^.\w$'])([A-Za-z_$][\w$]*)(?![\w$]*\s*\()/g; let d; while ((d = ir.exec(clean))) if (!KW.has(d[2]) && def.has(d[2])) idents.push(d[2]);
    hs.push({ ev: m[2], where, line: lineOf(off), raw: val.slice(0, 80).split(String.fromCharCode(0)).join("${...}"), rawAll: html.slice(m.index + m[0].length, i), calls, idents });
  }
  const evs = {}; hs.forEach((h) => { evs[h.ev] = (evs[h.ev] || 0) + 1; });
  const wh = {}; hs.forEach((h) => { wh[h.where] = (wh[h.where] || 0) + 1; });
  console.log(`\nINLINE HANDLERS: ${hs.length} attributes ${JSON.stringify(evs)} by place ${JSON.stringify(wh)}`);
  const surface = new Map(); const builtin = new Map();
  for (const h of hs) for (const n of [...h.calls, ...h.idents]) { if (def.has(n)) { if (!surface.has(n)) surface.set(n, { file: fileOfName(n), uses: 0, kind: def.get(n).kind }); surface.get(n).uses++; } else builtin.set(n, (builtin.get(n) || 0) + 1); }
  const byFile = {}; for (const [n, v] of surface) (byFile[v.file] = byFile[v.file] || []).push(n + (v.kind !== 'function' ? '(' + v.kind + ')' : ''));
  console.log(`GLOBAL SURFACE: ${surface.size} distinct top-level names referenced from inline handlers, across ${Object.keys(byFile).length} files; non-app names called: ${JSON.stringify([...builtin])}`);
  for (const p of jsPieces) if (byFile[p.file]) console.log(`  ${p.file} (${byFile[p.file].length}): ${byFile[p.file].sort().join(' ')}`);
  // cross-check with a cruder reader: every identifier in the raw value (quotes not stripped) that names a top-level function
  const raw = new Set(); for (const h of hs) for (const t of h.rawAll.match(/[A-Za-z_$][\w$]*/g) || []) if (def.has(t) && def.get(t).kind === 'function') raw.add(t);
  const missed = [...raw].filter((n) => !surface.has(n));
  console.log(`CROSS-CHECK: raw identifier scan finds ${raw.size} top-level functions in handler values; not in the parsed surface: ${missed.length} ${JSON.stringify(missed.map((n) => n + '@' + fileOfName(n)))}`);
  const propH = (js.match(/\.on[a-z]+\s*=(?!=)/g) || []).length;
  console.log(`property handlers assigned in script (el.onX = fn, not inline, no global needed): ${propH}`);
  const empty = hs.filter((h) => !h.calls.length && !h.idents.length);
  console.log(`handlers naming no app function: ${empty.length}${empty.length ? ' e.g. ' + empty.slice(0, 7).map((h) => `${h.line}:${h.ev}="${h.raw}"`).join(' | ') : ''}`);
  // other string-to-global seams
  const other = [];
  const sre = /\b(setTimeout|setInterval)\(\s*['"`]/g; let s; while ((s = sre.exec(js))) other.push('string timer at ' + lineOf(scriptOpenEnd + s.index));
  const wre = /\bwindow\.([A-Za-z_$][\w$]*)/g; const wn = new Map(); while ((s = wre.exec(js))) wn.set(s[1], (wn.get(s[1]) || 0) + 1);
  const wApp = [...wn].filter(([n]) => def.has(n));
  console.log(`OTHER GLOBAL SEAMS: string timers ${other.length}; window.<app name> references ${wApp.length} ${JSON.stringify(wApp)}; window.<other> ${JSON.stringify([...wn].filter(([n]) => !def.has(n)))}`);
  console.log(`\nRESULT: ${fails ? 'FAIL ' + fails : 'all proofs held'}`);
  process.exitCode = fails ? 1 : 0;
}
