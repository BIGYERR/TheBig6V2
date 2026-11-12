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
// The fast file first (a few seconds); the sweeps only for a break the fast file lets through (half a minute each).
const FAST = ['integration/stored-state.test.ts'];
const SLOW = ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts'];

// name, what the break does, the exact text (once in the page), its replacement.
const BREAKS = [
  ['log key', 'a log is stored under w1-mon, not w1_mon', "function logKey(w,d){return dayStoreKey(w,d);}", "function logKey(w,d){return 'w'+w+'-'+d;}"],
  ['freeze, history', 'a touched day is not restored from its snapshot at launch', 'if(_snap){ _merged[d] = _snap; _histRestored.add(k); return; }', ''],
  ['freeze, piercing', 'an overlay no longer reaches the untouched days of the current week', 'const _pierce = w >= _curWk;', 'const _pierce = false;'],
  ['freeze, reach', 'the last frozen week is rebuilt instead', 'for(let w=1; w<_cut; w++){', 'for(let w=1; w<_cut-1; w++){'],
  ['freeze, injured week', 'a touched day in an injured week keeps its stored form', 'if(_injCovers(w) && _live[d]){ _merged[d] = _live[d]; return; }', ''],
  ['set draft', 'a logged card leaves its draft in the log', '  clearSetDraft(exKey);\n', '\n'],
  ['backup scan', 'the backup leaves out the last key', "iaStore.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});", "iaStore.keys().slice(0,-1).forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});"],
  ['completion status', 'a skipped day is stored as complete', "setDayStatus(iaStore,activeProgId,currentWeek,dayKey,title||null,status,Date.now());", "setDayStatus(iaStore,activeProgId,currentWeek,dayKey,title||null,'complete',Date.now());"],
  // v0.261.4: a break inside the rules that moved to core with the day's log, completion and parts.
  ['part skip', 'a skipped part is not stored', "  writePartSkips(store,programId,all);\n  settleDayParts(", "  settleDayParts("],
  // Post-v0.261.4: open until the records gained the case "a day's parts settle its status" (no history before it let a
  // day's parts write its completion).
  ['parts settle', 'the parts of a day never write its completion', "c[k]={title:(day&&day.title)||null,ts:now,status:want,parts:1};", ''],
  // v0.261.5: two breaks inside the rules that moved to core with the day history. The second was green until the
  // records gained the case "a touched day edited, then its session moved" (no history before it edited a day after
  // its first touch).
  ['history, kept', 'a touched day is never snapshotted', 'if(h[k]) return;', 'return;'],
  ['edit re-snapshot', 'an edit after the first touch is not folded into the day\'s snapshot', 'if(!h[k]) return;', 'return;'],
  // v0.261.6: a break inside each rule that moved to core with the swaps, the swap counts, the day edits, the program
  // list, the active program and the Wildcard's record. Seven of them were green on v0.261.5's records (the next launch
  // prunes a touched week's edits, and no history undid a swap or reached the nudge) until the records gained the case
  // "a day's swaps and edits, made and undone, and the nudge".
  ['swap record', 'a swap is not stored', 's[k]=list; writeSwaps(store,programId,s); return s;', 'return s;'],
  ['swap places', 'a swap is stored without where the lift stood', 'if(Array.isArray(rx)&&rx.length) ent.rx=', 'if(false) ent.rx='],
  ['swap places, merge', 'a pair swapped again forgets the places the earlier tap saw', 'ent.rx=(was?', 'ent.rx=(false?'],
  ['swap undo', 'an undone swap keeps its record', 's[k]=s[k].filter(e=>e&&e.from!==from);', ''],
  ['swap count', 'a run of one swap never counts past one', 'cur.n=(cur.n||0)+1', 'cur.n=1'],
  ['nudge offered', 'a nudge turned down is not marked offered', 'if(c[from]){c[from].offered=true;writeSwapCounts', 'if(c[from]){writeSwapCounts'],
  ['skip record', 'a skipped movement is not stored', 'if(e.skip.indexOf(name)<0) e.skip.push(name);', ''],
  ['skip undo', 'a movement put back stays skipped in the store', 's[k].skip=(s[k].skip||[]).filter(function(x){return x!==name;});', ''],
  ['add record', 'an added movement is not stored', 'e.add.push({name:name,detail:detail,ts:now})', '0'],
  ['add undo', 'a removed movement stays added in the store', 's[k].add=(s[k].add||[]).filter(function(a){return a&&a.name!==name;});', ''],
  ['edits prune', 'the edits of a frozen week are kept', 'if(m&&+m[1]<cutWeek){delete s[k];changed=true;}', ''],
  ['active id', 'the active program is not stored', "function writeActiveProgramId(store, id){store.set('ia_active',id);}", 'function writeActiveProgramId(store, id){}'],
  ['wildcard record', 'a Wildcard done is not stored', 'function writeWildcardDone(store, programId, a){store.set(', 'function writeWildcardDone(store, programId, a){return;store.set('],
  ['seed write back','an old program\'s seed is not written back to its config', '    prog.cfg.seed = prog.seed;\n', '\n'],
  ['purge', 'a deleted program keeps its logs', "['ia_logs_','ia_comp_',", "['ia_comp_',"],
  ['rest move key', 'a moved rest day is stored under the picked day', 'moves[completedKey(w,day)]={from:pick,ts:Date.now()};', 'moves[completedKey(w,pick)]={from:pick,ts:Date.now()};'],
  ['week count', 'the current week is counted one day late', 'const diff=Math.floor((today-weekMon)/86400000);', 'const diff=Math.floor((today-weekMon)/86400000)-1;'],
];

// Breaks that change no record. They are run and printed, and they do not fail the script: each is a line no history
// can reach an effect through, and the note says how that was shown.
const OPEN = [
  ['freeze cut, the touched term', 'the current week, when touched, is not frozen a week further', 'const _dateCut = _curWk + (_curTouched ? 1 : 0);', 'const _dateCut = _curWk;',
    'No effect is possible: the next line takes the larger of this and the highest touched week plus one, and a touched current week is at least that week. The term is redundant.'],
  ['history, first touch', 'a day\'s snapshot is overwritten on every touch', 'if(h[k]) return;', '',
    'No reachable effect, settled in v0.261.5 (docs/decisions/stored-state.md). The guard decides only when a day is snapshotted again after it changed. A launch gives every snapshotted day back from its snapshot, and an edit is folded into the snapshot as it is made. One tap changes a snapshotted day and leaves its snapshot alone, the rest sheet\'s Move of a day with a logged lift, and it leaves a moved rest day that nothing snapshots (tests/measure/stored-state_first-touch.md). In 180 random histories, 0 of 4,481 repeat snapshots met a changed day (stored-state_first-touch-walks.md). The rule itself is held by the unit tests.'],
];

const runFiles = (app, files) => {
  try {
    execFileSync('npx', ['vitest', 'run', ...files], { cwd: join(ROOT, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' });
    return { red: false, failed: [] };
  } catch (e) {
    const out = String(e.stdout || '') + String(e.stderr || '');
    const failed = [...new Set([...out.matchAll(/^\s*(?:×|✗)\s+(.+?)\s+\d+ms\s*$/gm)].map((m) => m[1]))];
    return { red: true, failed, out };
  }
};
/** Fast first; the sweeps only when the fast file stays green. `by` says which caught it. */
const run = (app, all = false) => {
  const f = runFiles(app, FAST);
  if (f.red && !all) return { ...f, by: 'the fast file' };
  const s = runFiles(app, SLOW);
  if (f.red) return { ...f, by: 'the fast file' };
  return s.red ? { ...s, by: 'the sweeps' } : { red: false, failed: [], by: '' };
};

const rows = [];
const clean = run(PAGE, true);
rows.push(['(no break)', 'the page as built', clean.red ? 'RED' : 'green', clean.red ? clean.failed.length : 0, 'all three files']);
let bad = clean.red ? 1 : 0;
for (const [name, what, from, to] of BREAKS) {
  const n = page.split(from).length - 1;
  if (n !== 1) { rows.push([name, what, 'NOT RUN: the text occurs ' + n + ' times in the page', '', '']); bad++; continue; }
  const app = join(scratch, 'break-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  const r = run(app);
  if (!r.red) bad++;
  if (r.red && !r.failed.length) writeFileSync(app + '.out.txt', r.out);
  rows.push([name, what, r.red ? 'red' : 'GREEN (the records miss it)', r.red ? (r.failed.length || (/differs from tests\/snapshots/.test(r.out) ? 'the golden file' : 'a file failed before its tests')) : 0, r.by]);
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
L.push('run against the copy (`IA_APP`): the fast file first, the sweeps only for a break it lets through. The page as built');
L.push('must be green on all three and every break red.');
L.push('');
L.push('| Break | What it does | Result | Tests red | Caught by |');
L.push('|---|---|---|---|---|');
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
