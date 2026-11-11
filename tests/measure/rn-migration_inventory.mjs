// The React Native migration's inventory (MIGRATION.md, section 1): what exists today, counted from the tree.
// Run from the repo root: node tests/measure/rn-migration_inventory.mjs > tests/measure/rn-migration_inventory.md
// It also writes the per-file test ledger: tests/measure/rn-migration_test-ledger.md
// Every number is a static count over the files in the working tree. A test or an assertion inside a loop counts once.
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', 'dist', 'platforms', 'plugins', 'www', '.angular', 'generated', 'temp', 'coverage', '.git', 'dist-github-pages', 'app-web']);
function walk(dir, exts, out = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    if (SKIP.has(name)) continue;
    const p = join(abs, name), st = statSync(p);
    if (st.isDirectory()) walk(relative(ROOT, p), exts, out);
    else if (!exts || exts.includes(extname(name))) out.push(relative(ROOT, p));
  }
  return out;
}
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const count = (s, re) => (s.match(re) || []).length;
const size = (files) => files.reduce((a, f) => { const s = read(f); a.lines += s.split('\n').length; a.bytes += Buffer.byteLength(s); return a; }, { files: files.length, lines: 0, bytes: 0 });
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
const out = [];
const P = (s = '') => out.push(s);
const table = (head, rows) => { P('| ' + head.join(' | ') + ' |'); P('|' + head.map(() => '---').join('|') + '|'); for (const r of rows) P('| ' + r.join(' | ') + ' |'); P(); };

P('# React Native migration: the inventory');
P();
P('Written by `tests/measure/rn-migration_inventory.mjs`. Static counts over the working tree; generated and vendored folders are left out.');
P();

// ── 1. Source by area ─────────────────────────────────────────────────────────────────────────────────────────────
P('## 1. Source by area');
P();
const AREAS = [
  ['The engine (`core/src/engine`)', 'core/src/engine', ['.ts'], 'stays, unchanged'],
  ['The rest of core (`core/src`: domain, format, gps, semver, version)', null, null, 'stays'],
  ['The legacy script (`frontends/app/src/legacy/src/js`)', 'frontends/app/src/legacy/src/js', ['.ts'], 'its logic lifts into core (phase 1); its screens are rewritten'],
  ['The legacy CSS (`.../legacy/src/css`)', 'frontends/app/src/legacy/src/css', ['.css'], 'becomes React Native styles; the Track tokens carry over'],
  ['The legacy HTML (`.../legacy/src/html`)', 'frontends/app/src/legacy/src/html', ['.html'], 'rewritten as components'],
  ['The Angular app (`frontends/app/src/app`), TypeScript', 'frontends/app/src/app', ['.ts'], 'screens rewritten; pure models reused'],
  ['The Angular app, CSS', 'frontends/app/src/app', ['.css'], 'becomes React Native styles'],
  ['Native plugins, Swift (`frontends/app/plugins-src`)', 'frontends/app/plugins-src', ['.swift'], 'reused inside Expo modules'],
  ['Native plugins, JavaScript and hooks', 'frontends/app/plugins-src', ['.js'], 'replaced by Expo module definitions and a config plugin'],
  ['App build scripts (`frontends/app/scripts`)', 'frontends/app/scripts', ['.mjs', '.js', '.ts'], 'the Cordova ones retire at cutover'],
];
const rows1 = [];
for (const [label, dir, exts, fate] of AREAS) {
  let files;
  if (dir === null) files = walk('core/src', ['.ts']).filter((f) => !f.startsWith('core/src/engine/'));
  else files = walk(dir, exts);
  files = files.filter((f) => !/\.(spec|test)\.ts$/.test(f));
  const s = size(files);
  rows1.push([label, s.files, s.lines, kb(s.bytes), fate]);
}
table(['Area', 'Files', 'Lines', 'Size', 'In the move'], rows1);

// ── 2. Screens ────────────────────────────────────────────────────────────────────────────────────────────────────
P('## 2. Screens');
P();
const html = walk('frontends/app/src/legacy/src/html', ['.html']).map(read).join('\n');
const legacyScreens = [...html.matchAll(/<div[^>]*class="screen[^"]*"[^>]*id="([^"]+)"|<div[^>]*id="([^"]+)"[^>]*class="screen[^"]*"/g)].map((m) => m[1] || m[2]);
const overlays = [...html.matchAll(/<div[^>]*class="((?:rand-|pop-|rpe-)?overlay)"[^>]*id="([^"]+)"/g)].map((m) => m[2] + ' (' + m[1] + ')');
const tabs = [...html.matchAll(/tabGo\('([^']+)'\)/g)].map((m) => m[1]);
P('- Legacy page: **' + legacyScreens.length + ' screens** (`' + legacyScreens.join('`, `') + '`), **' + overlays.length + ' sheets and pop-ups** (`' + overlays.join('`, `') + '`), **' + new Set(tabs).size + ' tabs** (`' + [...new Set(tabs)].join('`, `') + '`).');
const screenDir = 'frontends/app/src/app/screens';
const folders = readdirSync(join(ROOT, screenDir)).filter((n) => statSync(join(ROOT, screenDir, n)).isDirectory());
const rows2 = [];
let comps = 0;
for (const f of folders) {
  const files = walk(join(screenDir, f), ['.ts']).filter((x) => !/\.(spec|test)\.ts$/.test(x));
  const text = files.map(read).join('\n');
  const c = count(text, /@Component\(/g);
  comps += c;
  const s = size(files.concat(walk(join(screenDir, f), ['.css'])));
  const inputs = count(text, /<(input|textarea|select)\b/g);
  const bridge = count(stripComments(text), /\b(?:bridge|b)\.(?:call|get|set|read|provide)\(|\bcall\('/g);
  rows2.push([f, c, files.length, s.lines, kb(s.bytes), inputs, bridge]);
}
P('- Angular app: **' + folders.length + ' screen folders, ' + comps + ' components** under `' + screenDir + '`. "Bridge calls" counts the places a component reaches into the legacy script: each is logic that has to exist in core, or in the new screen, before that screen can be rewritten.');
P();
table(['Folder', 'Components', 'TS files', 'Lines', 'Size', 'Fields', 'Bridge calls'], rows2.sort((a, b) => b[3] - a[3]));

// ── 3. Storage ────────────────────────────────────────────────────────────────────────────────────────────────────
P('## 3. Storage');
P();
const CODE = [
  ['legacy script', walk('frontends/app/src/legacy/src/js', ['.ts'])],
  ['engine', walk('core/src/engine', ['.ts'])],
  ['core (other)', walk('core/src', ['.ts']).filter((f) => !f.startsWith('core/src/engine/'))],
  ['Angular app', walk('frontends/app/src/app', ['.ts']).filter((f) => !/\.(spec|test)\.ts$/.test(f))],
];
const rows3 = [];
const perFile = [];
for (const [label, files] of CODE) {
  const t = { get: 0, set: 0, remove: 0, other: 0 };
  for (const f of files) {
    const s = stripComments(read(f));
    const g = count(s, /localStorage\.getItem\(/g), w = count(s, /localStorage\.setItem\(/g), r = count(s, /localStorage\.removeItem\(/g);
    const o = count(s, /localStorage\.(key|clear)\(|localStorage\.length|localStorage\[|Object\.keys\(localStorage\)/g) + count(s, /sessionStorage\./g);
    t.get += g; t.set += w; t.remove += r; t.other += o;
    if (g + w + r + o) perFile.push([f.replace('frontends/app/src/', ''), g, w, r, o]);
  }
  rows3.push([label, t.get, t.set, t.remove, t.other, t.get + t.set + t.remove + t.other]);
}
P('Direct `localStorage` calls (comments stripped). "Other" is `key`, `clear`, `length`, index access and `sessionStorage`.');
P();
table(['Where', 'getItem', 'setItem', 'removeItem', 'Other', 'Total'], rows3);
table(['File', 'getItem', 'setItem', 'removeItem', 'Other'], perFile.sort((a, b) => (b[1] + b[2] + b[3] + b[4]) - (a[1] + a[2] + a[3] + a[4])));
const keyUse = new Map();
for (const [label, files] of CODE) for (const f of files) {
  const s = stripComments(read(f));
  for (const m of s.matchAll(/['"`](ia_[a-zA-Z0-9]+_?)/g)) {
    const k = m[1];
    if (!keyUse.has(k)) keyUse.set(k, new Set());
    keyUse.get(k).add(f.split('/').pop());
  }
}
P('**The `ia_` key families: ' + keyUse.size + '** (every string literal that starts `ia_`, with the files that name it). A trailing underscore is a per-program or per-item key.');
P();
table(['Key', 'Files that name it'], [...keyUse.entries()].sort().map(([k, v]) => ['`' + k + '`', [...v].sort().join(', ')]));

// ── 4. Tests ──────────────────────────────────────────────────────────────────────────────────────────────────────
P('## 4. Tests and assertions');
P();
const TEST_RE = /(^|\n)\s*(?:test|it)(?:\.(?:each|skip|only|todo|skipIf|runIf)(?:\([^\n]*?\))?)?\(/g;
const ASSERT_RE = /\bassert(?:\.[a-zA-Z]+)?\(|\bexpect\(/g;
const SUITES = [
  ['tests/unit', 'tests/unit', 'Vitest'],
  ['tests/integration', 'tests/integration', 'Vitest'],
  ['tests/sweeps', 'tests/sweeps', 'Vitest (CI only)'],
  ['tests/e2e', 'tests/e2e', 'Docker, Puppeteer'],
  ['frontends/app/test/unit', 'frontends/app/test/unit', 'node:test'],
  ['frontends/app/test/integration', 'frontends/app/test/integration', 'node:test'],
  ['backend/test', 'backend/test', 'node:test'],
];
const ledger = [];
const rows4 = [];
let T = { files: 0, tests: 0, asserts: 0 };
for (const [label, dir, runner] of SUITES) {
  let files = walk(dir, ['.ts', '.js', '.mjs']).filter((f) => /\.(test|spec)\.(ts|js|mjs)$/.test(f));
  if (dir === 'frontends') files = files.filter((f) => !f.startsWith('frontends/app/'));
  if (dir === 'tests/e2e') files = walk(dir, ['.ts']);
  let tests = 0, asserts = 0, lines = 0;
  for (const f of files) {
    const raw = read(f), s = stripComments(raw);
    const t = count(s, TEST_RE), a = count(s, ASSERT_RE);
    tests += t; asserts += a; lines += raw.split('\n').length;
    if (dir !== 'tests/e2e') ledger.push({ f, suite: label, t, a, s });
  }
  rows4.push([label, runner, files.length, tests, asserts, lines]);
  if (dir !== 'tests/e2e') { T.files += files.length; T.tests += tests; T.asserts += asserts; }
}
rows4.push(['**Total, without the e2e**', '', '**' + T.files + '**', '**' + T.tests + '**', '**' + T.asserts + '**', '']);
P('"Tests" is `test(` and `it(` calls; "assertions" is `assert…(` and `expect(` calls. A test or assertion inside a loop counts once, so the run-time numbers are higher (the lattice sweeps run hundreds of programs through one assertion). The e2e row counts its TypeScript files; its journeys are in section 7.');
P();
table(['Suite', 'Runner', 'Files', 'Tests', 'Assertions', 'Lines'], rows4);
const snaps = walk('tests/snapshots', ['.json']);
P('Golden files: **' + snaps.length + '** in `tests/snapshots/` (' + kb(size(snaps).bytes) + ').');
P();

// What each test file drives decides what happens to it.
// A test file plus every tests/support helper it imports, followed through: most tests boot the page through a helper.
const supportText = new Map();
function withHelpers(f, text, seen = new Set()) {
  let all = text;
  for (const m of text.matchAll(/from ['"](\.\.?\/[^'"]*support\/[a-z0-9-]+\.ts|\.\/[a-z0-9-]+\.ts)['"]/g)) {
    const name = m[1].split('/').pop();
    const h = 'tests/support/' + name;
    if (seen.has(h) || !existsSync(join(ROOT, h))) continue;
    seen.add(h);
    if (!supportText.has(h)) supportText.set(h, stripComments(read(h)));
    all += '\n' + (name === 'app.ts' || name === 'snapshot.ts' || name === 'programs.ts' ? '' : withHelpers(h, supportText.get(h), seen));
  }
  return all;
}
function classify(r) {
  const s = r.f.startsWith('tests/') ? withHelpers(r.f, r.s) : r.s;
  const vm = /\bloadApp\(/.test(s), dom = /loadApp\(\s*\{[^}]*dom:\s*true/.test(s), lift = /\bappFunction\b/.test(s);
  const script = /\bappScript\(|\bappCopy\(/.test(s), src = /readFileSync\(/.test(s), css = /\.css['"`]/.test(s);
  const core = /from ['"]@ia\/core/.test(s) && /import\s+\{[^}]*\}\s+from ['"]@ia\/core/.test(s.replace(/import\s+type[^;]*;/g, ''));
  const engMod = /engine-modules/.test(s);
  const domWords = /getElementById|innerHTML|classList|querySelector|\.els\b|\bIA\.els|document\./.test(s);
  const ngModel = /frontends\/app\/src\/app\//.test(s);
  const drives = [vm && (dom ? 'page+DOM' : 'page'), ngModel && 'Angular source', lift && 'lifted fn', script && 'script text', core && '@ia/core', engMod && 'engine modules', (src || css) && 'source read'].filter(Boolean).join(', ') || 'own code';
  let fate;
  if (r.suite.startsWith('backend')) fate = 'KEEP: the server, not the app';
  else if (r.suite.startsWith('frontends/app/test')) {
    if (/native-|release-signing|legacy-bundle/.test(r.f)) fate = 'RETIRE at cutover: Cordova and legacy tooling, replaced by the Expo build checks';
    else if (/-model\.ts|from '..\/..\/src\/app\/screens\/[^']*-model/.test(s) && !/\.ts'\)|src\('/.test(s)) fate = 'KEEP: a pure model the new screen reuses';
    else fate = 'REPLACE by a React Native screen test (phase 2 or 3): model assertions kept, template reads rewritten';
  }
  else if (/tests\/unit\/(landing|claims|tree-at|semver|e2e-|worktree|run-log|check|deploy|build-index|module-blocks|engine-move|same-script|app-at|logs)/.test(r.f)) fate = 'KEEP: repo tooling, while the tool exists';
  else if (css || /tab-bar|keyboard|viewport|webkit/i.test(r.f)) fate = 'RETIRE at cutover: the web view or stylesheet it tests is gone; behaviour that survives gets a screen test';
  else if (dom || (vm && domWords) || (lift && domWords)) fate = 'REPLACE by a React Native screen test (phase 3): logic assertions move with the logic to core';
  else if (core || engMod) fate = 'KEEP: already runs on core alone';
  else if (vm || lift || script) fate = 'RE-POINT at `@ia/core`: same assertions, no page booted';
  else fate = 'KEEP: drives no page';
  return { drives, fate };
}
const classTotals = new Map();
const lrows = [];
for (const r of ledger) {
  const c = classify(r);
  const key = c.fate.split(':')[0].replace(/ by a React Native screen test.*| at cutover| at `@ia\/core`/, '');
  const t = classTotals.get(key) || { files: 0, tests: 0, asserts: 0 };
  t.files++; t.tests += r.t; t.asserts += r.a; classTotals.set(key, t);
  lrows.push([r.f, r.t, r.a, c.drives, c.fate, '', '']);
}
P('**What happens to them** (a first pass by rule, from what each file drives; the ledger has every file, and each row is confirmed by hand in the phase that touches it):');
P();
const MEAN = { KEEP: 'stays as it is (engine and core tests, pure models, the server, repo tools)', 'RE-POINT': 'same assertions, the program built by `@ia/core` with no page booted', REPLACE: 'a React Native screen test takes its place; logic assertions move with the logic', RETIRE: 'what it tests is gone at cutover (the web view, a stylesheet, Cordova tooling)' };
table(['Plan', 'What it means', 'Files', 'Tests', 'Assertions'], [...classTotals.entries()].sort((a, b) => b[1].asserts - a[1].asserts).map(([k, v]) => [k, MEAN[k] || '', v.files, v.tests, v.asserts]));

const L = [];
L.push('# React Native migration: the test ledger');
L.push('');
L.push('Written by `tests/measure/rn-migration_inventory.mjs`. One row per test file as of the commit it was run on. "Tests" and "Assertions" are static counts (a loop counts once). "Plan" is a first pass made by rule from what the file drives; the phase that touches a file confirms or corrects its row, then fills "Replacement" and "After" (the replacement\'s own counts). No row\'s file is deleted until its replacement passes and has been shown red on a deliberate break (MIGRATION.md, section 3).');
L.push('');
L.push('| File | Tests | Assertions | Drives | Plan | Replacement | After (tests / assertions) |');
L.push('|---|---|---|---|---|---|---|');
for (const r of lrows) L.push('| `' + r[0] + '` | ' + r[1] + ' | ' + r[2] + ' | ' + r[3] + ' | ' + r[4] + ' | | |');
L.push('');
L.push('**Total: ' + T.files + ' files, ' + T.tests + ' tests, ' + T.asserts + ' assertions.**');
writeFileSync(join(ROOT, 'tests/measure/rn-migration_test-ledger.md'), L.join('\n') + '\n');

// ── 5. Dates and locale ───────────────────────────────────────────────────────────────────────────────────────────
P('## 5. Dates, locale and other engine-dependent calls');
P();
P('Calls whose result can differ between JavaScript engines or device settings (V8 in Node, JavaScriptCore in today\'s web view, Hermes in React Native). Comments stripped.');
P();
const PATS = [
  ['`new Date("…")` or `new Date(x)` with one argument (parses a string or a number)', /new Date\(\s*[^)\s,][^),]*\)/g],
  ['`new Date(y, m, d…)` (local time, safe)', /new Date\(\s*[^),]+,/g],
  ['`new Date()` (the clock)', /new Date\(\s*\)/g],
  ['`Date.parse(`', /Date\.parse\(/g],
  ['`Date.now(`', /Date\.now\(/g],
  ['`toISOString(`', /\.toISOString\(/g],
  ['`toLocaleDateString(` / `toLocaleTimeString(` / `toLocaleString(`', /\.toLocale(Date|Time)?String\(/g],
  ['`Intl.`', /\bIntl\./g],
  ['`localeCompare(`', /\.localeCompare\(/g],
  ['`toLowerCase(` / `toUpperCase(` (locale-free, safe) ', /\.to(Lower|Upper)Case\(/g],
  ['`toLocaleLowerCase(` / `toLocaleUpperCase(`', /\.toLocale(Lower|Upper)Case\(/g],
  ['`getTimezoneOffset(`', /\.getTimezoneOffset\(/g],
  ['`.sort()` with no comparator', /\.sort\(\s*\)/g],
  ['`.sort(` with a comparator', /\.sort\(\s*[^)\s]/g],
  ['`toFixed(`', /\.toFixed\(/g],
  ['`Math.random(`', /Math\.random\(/g],
  ['`parseFloat(` / `parseInt(` / `Number(`', /\b(parseFloat|parseInt|Number)\(/g],
  ['`structuredClone(`', /\bstructuredClone\(/g],
  ['`JSON.stringify(`', /JSON\.stringify\(/g],
  ['Regex lookbehind `(?<=` or `(?<!`', /\(\?<[=!]/g],
  ['`normalize(` (Unicode)', /\.normalize\(/g],
];
const rows5 = [];
const text = CODE.map(([label, files]) => [label, files.map((f) => stripComments(read(f))).join('\n')]);
for (const [label, re] of PATS) rows5.push([label, ...text.map(([, s]) => count(s, re))]);
table(['Call', ...CODE.map(([l]) => l)], rows5);
P('Every single-argument `new Date(…)`, `Date.parse(`, `toLocale…String(` and `Intl.` call, by file (the ones to read by hand):');
P();
const risky = /new Date\(\s*[^)\s,][^),]*\)|Date\.parse\(|\.toLocale(Date|Time)?String\([^)]*\)|\bIntl\.[A-Za-z]+|\.localeCompare\(|\.sort\(\s*\)/g;
const rrows = [];
for (const [label, files] of CODE) for (const f of files) {
  const s = stripComments(read(f));
  const hits = {};
  for (const m of s.matchAll(risky)) { const k = m[0].replace(/\s+/g, ' ').slice(0, 60); hits[k] = (hits[k] || 0) + 1; }
  const ks = Object.entries(hits);
  if (ks.length) rrows.push([label, f.split('/').pop(), ks.reduce((a, [, n]) => a + n, 0), ks.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => '`' + k.replace(/\|/g, '\\|') + '`' + (n > 1 ? ' ×' + n : '')).join(', ')]);
}
table(['Where', 'File', 'Calls', 'What (up to 8 forms)'], rrows.sort((a, b) => a[0].localeCompare(b[0]) || b[2] - a[2]));

// ── 6. What the app asks of the device ────────────────────────────────────────────────────────────────────────────
P('## 6. What the app asks of the browser or the device');
P();
const APIS = [
  ['`iaIsland` (the rest timer Live Activity)', /\biaIsland\b/g], ['`iaGps` (the run recorder)', /\biaGps\b/g], ['`cordova`', /\bcordova\b/g],
  ['`navigator.share` / `canShare`', /navigator\.(share|canShare)/g], ['`navigator.vibrate`', /navigator\.vibrate/g], ['`Notification`', /\bNotification\b/g],
  ['`fetch(`', /\bfetch\(/g], ['`FileReader` / `Blob` / `URL.createObjectURL`', /\bFileReader\b|\bnew Blob\(|createObjectURL/g],
  ['`<input type="file"`', /type=["']file["']/g], ['`AudioContext` / `Audio(`', /AudioContext|new Audio\(/g], ['`wakeLock`', /wakeLock/g],
  ['`matchMedia(`', /matchMedia\(/g], ['`visualViewport`', /visualViewport/g], ['`requestAnimationFrame(`', /requestAnimationFrame\(/g],
  ['`MutationObserver` / `IntersectionObserver` / `ResizeObserver`', /(Mutation|Intersection|Resize)Observer/g],
  ['`innerHTML`', /innerHTML/g], ['`getElementById(`', /getElementById\(/g], ['inline handlers written into markup (`onclick="`)', /on(click|change|input|blur|focus|touchstart|pointerdown)=\\?["']/g],
  ['`<svg`', /<svg/g], ['`<canvas`', /<canvas|getContext\(/g],
];
table(['API', ...CODE.map(([l]) => l)], APIS.map(([label, re]) => [label, ...text.map(([, s]) => count(s, re))]));

// ── 7. CI and the e2e ─────────────────────────────────────────────────────────────────────────────────────────────
P('## 7. The pipeline and the e2e');
P();
const yml = read('.github/workflows/pipeline.yml');
const jobs = [];
{
  const lines = yml.split('\n');
  let inJobs = false, cur = null;
  for (const ln of lines) {
    if (/^jobs:\s*$/.test(ln)) { inJobs = true; continue; }
    if (!inJobs) continue;
    const j = ln.match(/^  ([a-zA-Z0-9_-]+):\s*$/);
    if (j) { cur = { id: j[1], name: '', runs: '', timeout: '' }; jobs.push(cur); continue; }
    if (!cur) continue;
    const n = ln.match(/^    name:\s*(.+)$/); if (n) cur.name = n[1].trim();
    const r = ln.match(/^    runs-on:\s*(.+)$/); if (r) cur.runs = r[1].trim();
    const t = ln.match(/^    timeout-minutes:\s*(.+)$/); if (t) cur.timeout = t[1].trim();
  }
}
table(['Job id', 'Name', 'Runs on', 'Timeout (min)'], jobs.map((j) => [j.id, j.name, j.runs, j.timeout]));
const e2e = walk('tests/e2e', ['.ts']);
const e2eText = e2e.map((f) => stripComments(read(f))).join('\n');
const flow = stripComments(read('tests/e2e/flow.ts')), pages = stripComments(read('tests/e2e/pages.ts'));
const journeys = [...flow.matchAll(/const ([A-Z_]+): readonly Step\[\] = \[/g)].map((m) => m[1]);
P('e2e (`tests/e2e`): ' + e2e.length + ' TypeScript files, ' + size(e2e).lines + ' lines. The app: **' + journeys.length + ' journeys** (`' + journeys.join('`, `') + '`), **' + count(flow, /\n\s+id: '/g) + ' steps**, each photographed in both builds and compared (parity), then laid out on one collage. The website and the admin: ' + count(pages, /\n\s+id: '/g) + ' step ids in `pages.ts`.');
P();

process.stdout.write(out.join('\n') + '\n');
