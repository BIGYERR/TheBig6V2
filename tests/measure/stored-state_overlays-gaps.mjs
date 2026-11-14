// Measure, before the eighth lift slice: applyOverlays (the page's overlays.ts), what it reaches, who calls it, which
// ia_ keys it names, and whether the golden records of stored state are blind to its rules. A break inside each rule is
// made in a copy of the built page and the records run against it: the fast file first, the sweeps only for a break it
// lets through. The first row is a control: the log key break, which the records turn red, shows the instrument can
// fire. Read-only: nothing in the working tree is changed.
//
// Run from the repo root, after a build:
//   node tests/measure/stored-state_overlays-gaps.mjs <scratch dir> > tests/measure/stored-state_overlays-gaps.md
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
if (!process.argv[2]) { console.error('usage: node tests/measure/stored-state_overlays-gaps.mjs <scratch dir>'); process.exit(2); }
const scratch = resolve(process.argv[2]);
mkdirSync(scratch, { recursive: true });
const page = readFileSync(join(ROOT, 'dist-' + 'github-pages', 'index.html'), 'utf8');
const version = (page.match(/name="ia-version" content="([^"]+)"/) || [])[1];

// ── 1. The reach: every name of the page or of core the function's code uses, comments stripped. ─────────────────────
const PAGE_JS = join(ROOT, 'frontends', 'app', 'src', 'legacy', 'src', 'js');
const CORE = join(ROOT, 'core', 'src', 'engine');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const decl = new Map();   // name -> where it is declared
for (const [dir, label] of [[PAGE_JS, 'page'], [CORE, 'core']]) {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const src = strip(readFileSync(join(dir, f), 'utf8'));
    for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) {
      const n = m[1] || m[2];
      if (!decl.has(n)) decl.set(n, label + ' `' + f + '`');
    }
  }
}
/** The text of a top-level function of the built page, from its `function name(` to the closing brace at column 0. */
const body = (name) => {
  const a = page.indexOf('\nfunction ' + name + '(');
  if (a < 0) return '';
  const eol = page.indexOf('\n', a + 1);
  if (page.slice(a + 1, eol).trimEnd().endsWith('}')) return page.slice(a + 1, eol);   // a function written on one line
  const b = page.indexOf('\n}\n', a);
  return page.slice(a + 1, b + 2);
};
const uses = (name) => {
  const text = body(name).replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
  const ids = new Set([...text.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  ids.delete(name);
  return [...ids].filter((n) => decl.has(n)).sort();
};
const lines = (name) => body(name).split('\n').filter((l) => l.trim()).length;
const reach = [];
const seen = new Set(['applyOverlays']);
const walk = (name, depth) => {
  for (const n of uses(name)) {
    if (seen.has(n)) continue;
    seen.add(n);
    const where = decl.get(n);
    const keys = [...new Set((body(n).match(/ia_[a-z_]+/g) || []))];
    reach.push([n, where, depth, lines(n) || '', uses(n).join(', ') || 'none', keys.join(', ') || 'none']);
    if (where.startsWith('page')) walk(n, depth + 1);   // a core name is already where it must be
  }
};
walk('applyOverlays', 1);

// ── 2. The callers: every call of the function in the built page, and every outside reader of its name. ─────────────
const callsIn = (name) => {
  const out = [];
  const re = new RegExp('(?<![.\\w$])' + name.replace('$', '\\$') + '\\(', 'g');
  for (const m of page.matchAll(re)) {
    if (page.slice(m.index - 9, m.index) === 'function ') continue;
    const before = page.lastIndexOf('\nfunction ', m.index);
    const fn = (page.slice(before + 10, before + 80).match(/^([\w$]+)/) || [])[1] || '(top level)';
    out.push(fn);
  }
  return out;
};
const tally = (a) => { const t = {}; a.forEach((x) => { t[x] = (t[x] || 0) + 1; }); return Object.keys(t).sort().map((k) => (t[k] > 1 ? k + ' ×' + t[k] : k)); };

// ── 3. The breaks: one line of the function changed, in a copy of the page. ─────────────────────────────────────────
// name, the rule, what the break does, the exact text (once in the page), its replacement.
const BREAKS = [
  ['log key (control)', 'the control', 'a log is stored under w1-mon', "function logKey(w,d){return dayStoreKey(w,d);}", "function logKey(w,d){return 'w'+w+'-'+d;}"],
  ['order', 'later made wins: overlays are applied oldest first', 'the newest overlay is applied first, so the oldest wins', '.sort((a,b)=>((a&&a.created)||0)-((b&&b.created)||0)).forEach(ov=>{', '.sort((a,b)=>((b&&b.created)||0)-((a&&a.created)||0)).forEach(ov=>{'],
  ['kinds, injury', 'an injury overlay is applied', 'an injury overlay is skipped', "if(!ov || (ov.type!=='substitute' && ov.type!=='injury') || !ov.patch) return;", "if(!ov || (ov.type!=='substitute') || !ov.patch) return;"],
  ['kinds, travel', 'a travel overlay is applied', 'a travel overlay is skipped', "if(!ov || (ov.type!=='substitute' && ov.type!=='injury') || !ov.patch) return;", "if(!ov || (ov.type!=='injury') || !ov.patch) return;"],
  ['window, last week', 'every week of the span is searched', 'the last week of the span is not searched', 'for(let w=range.fromWeek; w<=range.toWeek; w++){', 'for(let w=range.fromWeek; w<range.toWeek; w++){'],
  ['window, first week', 'every week of the span is searched', 'the first week of the span is not searched', 'for(let w=range.fromWeek; w<=range.toWeek; w++){', 'for(let w=range.fromWeek+1; w<=range.toWeek; w++){'],
  ['key', 'a day is stamped with its overlay\'s kind and patch', 'the stamp and the cache key hold the kind only', 'const ck = JSON.stringify([ov.type, ov.patch]);', 'const ck = JSON.stringify([ov.type]);'],
  ['travel mark', 'a travel variant builds as a temporary setup', 'a travel variant builds as the athlete\'s own gym', '{...prog.cfg, ...ov.patch, _travel:true}', '{...prog.cfg, ...ov.patch}'],
  ['patch, travel', 'a travel variant builds from the patched config', 'a travel variant builds without its patch', '{...prog.cfg, ...ov.patch, _travel:true}', '{...prog.cfg, _travel:true}'],
  ['patch, injury', 'an injury variant builds from the patched config', 'an injury variant builds without its patch', ': {...prog.cfg, ...ov.patch});', ': {...prog.cfg});'],
  ['clean injury build', 'an injury variant builds without the travel mark', 'an injury variant builds as a temporary setup', ': {...prog.cfg, ...ov.patch});', ': {...prog.cfg, ...ov.patch, _travel:true});'],
  ['day unit, from', 'a day before the span keeps the base', 'a day before the span, in its first week, takes the variant', 'if(dt < _from || (_to && dt > _to)) return;', 'if((_to && dt > _to)) return;'],
  ['day unit, to', 'a day after the span keeps the base', 'a day after the span, in its last week, takes the variant', 'if(dt < _from || (_to && dt > _to)) return;', 'if(dt < _from) return;'],
  ['day unit, first day', 'the span\'s first day takes the variant', 'the span\'s first day keeps the base', 'if(dt < _from || (_to && dt > _to)) return;', 'if(dt <= _from || (_to && dt > _to)) return;'],
  ['day unit, last day', 'the span\'s last day takes the variant', 'the span\'s last day keeps the base', 'if(dt < _from || (_to && dt > _to)) return;', 'if(dt < _from || (_to && dt >= _to)) return;'],
  ['rest days', 'a rest day of the variant leaves the base day alone', 'a rest day of the variant replaces the base day', 'const vd = vw[d]; if(!vd || vd.rest) return;', 'const vd = vw[d]; if(!vd) return;'],
  ['stamp', 'a spliced day carries its overlay key', 'a spliced day carries no key', 'rebuilt.weeks[w][d] = Object.assign({}, vd, {_ovKey: ck});', 'rebuilt.weeks[w][d] = Object.assign({}, vd);'],
  ['splice', 'a day in the span takes the variant\'s day', 'no day takes the variant', 'rebuilt.weeks[w][d] = Object.assign({}, vd, {_ovKey: ck});', ''],
  ['swap universe', 'the variant\'s legal swaps ride on the program by overlay key', 'no variant\'s legal swaps are kept', 'if(Array.isArray(variant._swapUniverse)) rebuilt._swapUniverseByKey[ck] = variant._swapUniverse;', ''],
  ['failure', 'an overlay that fails is reported and the others still apply', 'a failing overlay stops every later one', "console.error('overlay apply failed', ov && ov.id, e);", 'throw e;'],
  ['cache', 'one build per distinct kind and patch', 'a build per overlay', 'if(!_variantCache[ck]) _variantCache[ck] = buildProgram(', '_variantCache[ck] = buildProgram('],
  ['length', 'the span is clamped to the rebuilt program\'s length', 'the span is clamped to the stored length only', 'const totalWeeks = rebuilt.totalWeeks || prog.totalWeeks || 0;', 'const totalWeeks = prog.totalWeeks || 0;'],
];

const runFiles = (app, files) => {
  try {
    execFileSync('npx', ['vitest', 'run', ...files], { cwd: join(ROOT, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' });
    return { red: false, failed: [] };
  } catch (e) {
    const out = String(e.stdout || '') + String(e.stderr || '');
    const failed = [...new Set([...out.matchAll(/^\s*(?:×|✗)\s+(.+?)\s+\d+ms\s*$/gm)].map((m) => m[1].replace(/^.*? > /, '')))];
    return { red: true, failed, golden: /differs from tests\/snapshots/.test(out), out };
  }
};
// A break's result is kept in the scratch folder, so the report can be written again without running the tests again.
const KEPT = join(scratch, 'results.json');
const kept = existsSync(KEPT) ? JSON.parse(readFileSync(KEPT, 'utf8')) : {};
const rows = [];
let blind = 0;
for (const [name, rule, what, from, to] of BREAKS) {
  if (kept[name]) { if (kept[name].blind) blind++; rows.push(kept[name].row); continue; }
  const n = page.split(from).length - 1;
  if (n !== 1) { rows.push(`| ${name} | ${rule} | ${what} | NOT RUN: the text occurs ${n} times | |`); continue; }
  const app = join(scratch, 'ov-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  let r = runFiles(app, ['integration/stored-state.test.ts']);
  let by = 'the fast file';
  if (!r.red) { r = runFiles(app, ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts']); by = 'the sweeps'; }
  if (!r.red) blind++;
  if (r.red) writeFileSync(app + '.out.txt', r.out);
  const which = r.red ? (r.failed.length ? r.failed.length + ': ' + r.failed.slice(0, 4).join('; ') + (r.failed.length > 4 ? '; …' : '') : r.golden ? 'the golden file' : 'a file failed before its tests') : '';
  rows.push(`| ${name} | ${rule} | ${what} | ${r.red ? 'red (' + by + ')' : 'GREEN (blind)'} | ${which} |`);
  kept[name] = { blind: !r.red, row: rows[rows.length - 1] };
  writeFileSync(KEPT, JSON.stringify(kept));
}

const L = [];
L.push(`# Stored state: applyOverlays, its reach, its callers, and are the records blind to its rules? (on ${version})`);
L.push('');
L.push('Written by `tests/measure/stored-state_overlays-gaps.mjs` (read-only), from the built page and the source files.');
L.push('');
L.push('## 1. What the function reaches');
L.push('');
L.push(`\`applyOverlays\` is ${lines('applyOverlays')} lines of the built page. It uses these names of the page and of core; a page name's own reach is followed, a core name's is not.`);
L.push('');
L.push('| Name | Declared in | Depth | Lines | Names it uses | ia_ keys it names |');
L.push('|---|---|---|---|---|---|');
for (const r of reach) L.push('| `' + r[0] + '` | ' + r.slice(1).join(' | ') + ' |');
L.push('');
L.push('ia_ keys named in `applyOverlays` itself: ' + ([...new Set(body('applyOverlays').match(/ia_[a-z_]+/g) || [])].join(', ') || '**none**') + '. Store calls in it (`iaStore`): ' + (body('applyOverlays').split('iaStore').length - 1) + '.');
L.push('');
L.push('## 2. Who calls it, and who calls what it reaches');
L.push('');
L.push('| Name | Calls in the built page | From |');
L.push('|---|---|---|');
for (const n of ['applyOverlays', ...reach.filter((r) => r[1].startsWith('page')).map((r) => r[0])]) {
  const c = callsIn(n);
  L.push('| `' + n + '` | ' + c.length + ' | ' + tally(c).join(', ') + ' |');
}
L.push('');
L.push('## 3. A break inside each rule, against the records');
L.push('');
L.push(`${BREAKS.length - 1} breaks and the control; **${blind} green on the records** (the control must be red).`);
L.push('');
L.push('| Break | The rule | What the break does | The records | Tests red |');
L.push('|---|---|---|---|---|');
L.push(...rows);
process.stdout.write(L.join('\n') + '\n');
