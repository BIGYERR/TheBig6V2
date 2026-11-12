// Measure, before the fifth lift slice (the swap and edit stores, ia_swaps_, ia_swapct_, ia_edits_, and what is left of
// storage.ts: ia_programs, ia_active, ia_wild_): every function in scope, and who calls it. For each name: the legacy
// files that call it (calls counted outside comments and outside its own declaration), core, the Angular screens and
// services that name it (through the bridge), and the tests that name it.
// Run: node tests/measure/stored-state_swaps-edits-callers.mjs   (prints Markdown; the saved report is the .md beside it)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GROUPS = [
  ['Swaps (ia_swaps_)', ['swapStoreKey', 'getSwaps', 'saveSwaps', 'recordSwap', 'clearSwap', 'applySessionSwaps']],
  ['Swap counts (ia_swapct_)', ['SWAP_NUDGE_AT', 'swapCountKey', 'getSwapCounts', 'saveSwapCounts', 'bumpSwapCount', 'markSwapOffered']],
  ['Day edits (ia_edits_)', ['editStoreKey', 'getDayEdits', 'saveDayEdits', '_editEntry', 'recordSkip', 'clearSkip', 'recordAdd', 'clearAdd', 'ssSkipToken', 'pruneDayEdits', 'applyDayEdits']],
  ['What is left of storage.ts', ['getPrograms', 'savePrograms', 'getActiveProgId', 'setActiveProgId', 'getWildcardDone', 'saveWildcardDone', 'saveDayHist']],
];
const NAMES = GROUPS.flatMap((g) => g[1]);
const KEYS = ['ia_swaps_', 'ia_swapct_', 'ia_edits_', 'ia_programs', 'ia_active', 'ia_wild_'];

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
    if (new RegExp('(function\\s+' + name + '\\s*\\(|const\\s+' + name + '\\s*=)').test(line)) n -= 1; // its own declaration
  }
  return n;
}
function sweep(files) {
  const by = {};
  for (const f of files) {
    const src = strip(readFileSync(f, 'utf8'));
    for (const n of NAMES) {
      const c = count(src, n);
      if (c) (by[n] = by[n] || []).push(relative(root, f).split('/').pop() + ' ' + c);
    }
  }
  return by;
}
const legacy = walk(join(root, 'frontends/app/src/legacy/src/js'), (p) => p.endsWith('.ts'));
const core = walk(join(root, 'core/src'), (p) => p.endsWith('.ts'));
const angular = walk(join(root, 'frontends/app/src/app'), (p) => p.endsWith('.ts') || p.endsWith('.html'));
const tests = walk(join(root, 'tests'), (p) => /\.(ts|js|mjs)$/.test(p) && !p.includes('/measure/'))
  .concat(walk(join(root, 'frontends/app/test'), (p) => /\.(ts|js|mjs)$/.test(p)));

const L = sweep(legacy), C = sweep(core), A = sweep(angular), T = sweep(tests);
const out = [];
out.push('# Stored state: who reads and writes the swap and edit stores, and what is left of storage.ts?', '',
  'Written by `tests/measure/stored-state_swaps-edits-callers.mjs`, before the fifth lift slice. Static counts over the',
  'working tree, comments stripped: calls in the legacy script (a function\'s own declaration and the import and export',
  'lists left out), mentions in core and in the Angular screens (which reach the page by name through the bridge), and',
  'the number of test files that name it.', '');
for (const [title, names] of GROUPS) {
  out.push('## ' + title, '', '| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |', '|---|---|---|---|---|');
  for (const n of names) {
    out.push('| `' + n + '` | ' + ((L[n] || []).join(', ') || 'none') + ' | ' + ((C[n] || []).join(', ') || 'none') + ' | '
      + ((A[n] || []).join(', ') || 'none') + ' | ' + ((T[n] || []).length || 'none') + ' |');
  }
  out.push('');
}
out.push('| Key | Files that name it outside comments (file, mentions) |', '|---|---|');
for (const k of KEYS) {
  const hits = [];
  for (const f of legacy.concat(core, angular)) {
    const c = strip(readFileSync(f, 'utf8')).split(k).length - 1;
    if (c) hits.push(relative(root, f).split('/').pop() + ' ' + c);
  }
  out.push('| `' + k + '` | ' + (hits.join(', ') || 'none') + ' |');
}
console.log(out.join('\n'));
