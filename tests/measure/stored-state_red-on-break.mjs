// Do the stored-state golden records fail when the code they guard is broken? (MIGRATION.md, constraint 5 and 3.4.)
// Each break below changes one line of the built page, in a copy; the three test files run against that copy
// (IA_APP); the break counts only if a test goes red. Nothing in the working tree is changed.
//
// Run from the repo root, after a build:
//   node tests/measure/stored-state_red-on-break.mjs <scratch dir> > tests/measure/stored-state_red-on-break.md
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const scratch = resolve(process.argv[2] || '');
if (!process.argv[2]) { console.error('usage: node tests/measure/stored-state_red-on-break.mjs <scratch dir>'); process.exit(2); }
mkdirSync(scratch, { recursive: true });
const PAGE = join(ROOT, 'dist-' + 'github-pages', 'index.html');
const page = readFileSync(PAGE, 'utf8');
const FILES = ['integration/stored-state.test.ts', 'sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts'];

// name, what the break does, the exact text (once in the page), its replacement.
const BREAKS = [
  ['log key', 'a log is stored under w1-mon, not w1_mon', "function logKey(w,d){return 'w'+w+'_'+d;}", "function logKey(w,d){return 'w'+w+'-'+d;}"],
  ['freeze, history', 'a touched day is not restored from its snapshot at launch', 'if(_snap){ _merged[d] = _snap; _histRestored.add(k); return; }', ''],
  ['freeze, piercing', 'an overlay no longer reaches the untouched days of the current week', 'const _pierce = w >= _curWk;', 'const _pierce = false;'],
  ['freeze, reach', 'the last frozen week is rebuilt instead', 'for(let w=1; w<_cut; w++){', 'for(let w=1; w<_cut-1; w++){'],
  ['freeze, injured week', 'a touched day in an injured week keeps its stored form', 'if(_injCovers(w) && _live[d]){ _merged[d] = _live[d]; return; }', ''],
  ['set draft', 'a logged card leaves its draft in the log', '  clearSetDraft(exKey);\n', '\n'],
  ['backup scan', 'the backup leaves out the last key', "iaStore.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});", "iaStore.keys().slice(0,-1).forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});"],
  ['completion status', 'a skipped day is stored as complete', "c[k]={title:title||null,ts:Date.now(),status};", "c[k]={title:title||null,ts:Date.now(),status:'complete'};"],
  ['seed write back', 'an old program\'s seed is not written back to its config', '    prog.cfg.seed = prog.seed;\n', '\n'],
  ['purge', 'a deleted program keeps its logs', "['ia_logs_','ia_comp_',", "['ia_comp_',"],
  ['rest move key', 'a moved rest day is stored under the picked day', 'moves[completedKey(w,day)]={from:pick,ts:Date.now()};', 'moves[completedKey(w,pick)]={from:pick,ts:Date.now()};'],
  ['week count', 'the current week is counted one day late', 'const diff=Math.floor((today-weekMon)/86400000);', 'const diff=Math.floor((today-weekMon)/86400000)-1;'],
];

// Breaks that changed no record on 2026-11-11. They are run and printed, and they do not fail the script: each is
// either dead weight in the code or a gap in the histories, and the note says which the session could show.
const OPEN = [
  ['freeze cut, the touched term', 'the current week, when touched, is not frozen a week further', 'const _dateCut = _curWk + (_curTouched ? 1 : 0);', 'const _dateCut = _curWk;',
    'No effect is possible: the next line takes the larger of this and the highest touched week plus one, and a touched current week is at least that week. The term is redundant.'],
  ['history, first touch', 'a day\'s snapshot is overwritten on every touch', 'if(h[k]) return;', '',
    'Not shown either way. In every history here a touched day is restored from its snapshot at each launch, so a second snapshot writes the same bytes. Whether any tap can change a touched day before its next snapshot (a moved rest day, a sport swap) was not traced. To settle before the freeze slice.'],
];

const run = (app) => {
  try {
    execFileSync('npx', ['vitest', 'run', ...FILES], { cwd: join(ROOT, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' });
    return { red: false, failed: [] };
  } catch (e) {
    const out = String(e.stdout || '') + String(e.stderr || '');
    const failed = [...new Set([...out.matchAll(/^\s*(?:×|✗)\s+(.+?)\s+\d+ms\s*$/gm)].map((m) => m[1]))];
    return { red: true, failed, out };
  }
};

const rows = [];
const clean = run(PAGE);
rows.push(['(no break)', 'the page as built', clean.red ? 'RED' : 'green', clean.red ? clean.failed.length : 0]);
let bad = clean.red ? 1 : 0;
for (const [name, what, from, to] of BREAKS) {
  const n = page.split(from).length - 1;
  if (n !== 1) { rows.push([name, what, 'NOT RUN: the text occurs ' + n + ' times in the page', '']); bad++; continue; }
  const app = join(scratch, 'break-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  const r = run(app);
  if (!r.red) bad++;
  if (r.red && !r.failed.length) writeFileSync(app + '.out.txt', r.out);
  rows.push([name, what, r.red ? 'red' : 'GREEN (the records miss it)', r.red ? (r.failed.length || (/differs from tests\/snapshots/.test(r.out) ? 'the golden file' : 'a file failed before its tests')) : 0]);
}

const open = [];
for (const [name, what, from, to, note] of OPEN) {
  const n = page.split(from).length - 1;
  if (n !== 1) { open.push([name, what, 'NOT RUN: the text occurs ' + n + ' times', note]); continue; }
  const app = join(scratch, 'open-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  const r = run(app);
  open.push([name, what, r.red ? 'red now (' + r.failed.length + ' tests): move it to the list above' : 'no record changed', note]);
}

const L = [];
L.push('# Stored state: do the golden records go red when the code is broken on purpose?');
L.push('');
L.push('Written by `tests/measure/stored-state_red-on-break.mjs`. Each break changes one line of a copy of the built page;');
L.push('`tests/integration/stored-state.test.ts`, `tests/sweeps/stored-state.test.ts` and `tests/sweeps/data-backup.test.ts`');
L.push('run against the copy (`IA_APP`). The page as built must be green and every break red.');
L.push('');
L.push('| Break | What it does | Result | Tests red |');
L.push('|---|---|---|---|');
for (const r of rows) L.push('| ' + r.join(' | ') + ' |');
L.push('');
L.push(bad ? '**' + bad + ' row(s) not as required.**' : '**The page as built is green, and all ' + BREAKS.length + ' breaks turn the records red.**');
L.push('');
L.push('## Breaks that change no record');
L.push('');
L.push('| Break | What it does | Result | Why |');
L.push('|---|---|---|---|');
for (const r of open) L.push('| ' + r.join(' | ') + ' |');
process.stdout.write(L.join('\n') + '\n');
process.exit(bad ? 1 : 0);
