// Measure, before the sixth lift slice (what progress-data.ts reads and computes from the stored state, and what is
// left of day-status.ts's store logic): every function in scope, and who calls it. For each name: the legacy files that
// call it (calls counted outside comments and outside its own declaration), core, the Angular screens and services that
// name it (through the bridge), and the tests that name it.
// Run: node tests/measure/stored-state_progress-callers.mjs   (prints Markdown; the saved report is the .md beside it)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GROUPS = [
  ['progress-data.ts: the readers of the stores', ['seedFromPriorPrograms', 'SEED_WINDOW_DAYS', 'SEED_MIN_RUNS', '_purgeWarnsCrossProg']],
  ['progress-data.ts: what it computes from the stored logs and history', ['_recoveryPaceEntry', 'recoveryPaceWeekly', 'ladderWeekly', 'runsByClass',
    'RUN_CLASS_ORDER', 'easyEffortWeekly', 'EASY_RPE_LO', 'EASY_RPE_HI', 'plannedVsLogged', '_runClass', '_paceStrToSec',
    '_mileFromRecoverySec', '_halfFromMileSec', '_progWeekNow', '_cutWeek']],
  ['progress-data.ts: the lift ledger of V165, orphaned by V167', ['ledgerRows', '_entryBestE1RM', '_LEDGER_MAIN']],
  ['progress-data.ts: what draws', ['showProgressScreen', 'buildPaceChart', '_fmtPaceShort', '_progChipsHTML', '_restoreBarHTML',
    'askPurgeFromProgress', 'cancelProgressConfirm', 'setProgressView', 'RACE_DIST_MI', 'EASY_MIN_RUNS', 'RUN_CLASS_COLOR']],
  ['day-status.ts: what is left of its store logic', ['toggleComplete', 'acceptSwapNudge', 'cardioEntryLive', 'setCardioSwap', 'persistLogFields']],
];
const NAMES = GROUPS.flatMap((g) => g[1]);
const KEYS = ['getLogsFor', 'getDayHistFor', 'getExWeightsFor', 'getPrograms'];

function walk(dir, keep, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'www' || name === 'platforms' || name === 'plugins') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}
// Comments out, strings kept (an inline handler is a string that calls a function).
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(function (l) {
    const i = l.search(/(^|[^:'"`\\])\/\/ /);
    return i < 0 ? l : l.slice(0, i + (l[i] === '/' ? 0 : 1));
  }).join('\n');
}
function count(src, name) {
  const re = new RegExp('(^|[^A-Za-z0-9_$.])' + name + '(?![A-Za-z0-9_$])', 'g');
  let n = 0;
  for (const line of src.split('\n')) {
    if (/^\s*(import|export)\b/.test(line) || /^\s{2}[A-Za-z_$, ]+,?\s*$/.test(line)) continue; // import and export lists
    const m = line.match(re);
    if (!m) continue;
    n += m.length;
    if (new RegExp('(function\\s+' + name + '\\s*\\(|(const|var)\\s+' + name + '\\s*=)').test(line)) n -= 1; // its own declaration
  }
  return n;
}
function sweep(files, names) {
  const by = {};
  for (const f of files) {
    const src = strip(readFileSync(f, 'utf8'));
    for (const n of names) {
      const c = count(src, n);
      if (c) (by[n] = by[n] || []).push(relative(root, f).split('/').pop() + ' ' + c);
    }
  }
  return by;
}
const legacy = walk(join(root, 'frontends/app/src/legacy/src'), (p) => p.endsWith('.ts') || p.endsWith('.html'));
const core = walk(join(root, 'core/src'), (p) => p.endsWith('.ts'));
const angular = walk(join(root, 'frontends/app/src/app'), (p) => p.endsWith('.ts') || p.endsWith('.html'));
const tests = walk(join(root, 'tests'), (p) => /\.(ts|js|mjs)$/.test(p) && !p.includes('/measure/'))
  .concat(walk(join(root, 'frontends/app/test'), (p) => /\.(ts|js|mjs)$/.test(p)));

const L = sweep(legacy, NAMES), C = sweep(core, NAMES), A = sweep(angular, NAMES), T = sweep(tests, NAMES);
const out = [];
out.push('# Stored state: who calls what progress-data.ts reads and computes, and what is left of day-status.ts\'s store logic?', '',
  'Written by `tests/measure/stored-state_progress-callers.mjs`, before the sixth lift slice. Static counts over the',
  'working tree, comments stripped: calls in the legacy script and its HTML partials (a function\'s own declaration and',
  'the import and export lists left out), mentions in core and in the Angular screens (which reach the page by name',
  'through the bridge), and the number of test files that name it.', '');
for (const [title, names] of GROUPS) {
  out.push('## ' + title, '', '| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |', '|---|---|---|---|---|');
  for (const n of names) {
    out.push('| `' + n + '` | ' + ((L[n] || []).join(', ') || 'none') + ' | ' + ((C[n] || []).join(', ') || 'none') + ' | '
      + ((A[n] || []).join(', ') || 'none') + ' | ' + ((T[n] || []).length || 'none') + ' |');
  }
  out.push('');
}
out.push('## The page\'s store readers this slice\'s functions are handed through', '',
  '| Reader | Legacy callers (file, calls) | Angular (file, mentions) |', '|---|---|---|');
const LK = sweep(legacy, KEYS), AK = sweep(angular, KEYS);
for (const k of KEYS) out.push('| `' + k + '` | ' + ((LK[k] || []).join(', ') || 'none') + ' | ' + ((AK[k] || []).join(', ') || 'none') + ' |');
console.log(out.join('\n'));
