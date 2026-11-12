// Before the fifth lift slice: which of the rules it moves do the stored-state records see? One break per rule on a
// copy of the built page (v0.261.5, the page's text before the move), the fast file, then the two sweeps for a break
// the fast file lets through. Run once on v0.261.5's build; its report is the .md beside it. After the move the same
// rules are broken in core's text by tests/measure/stored-state_red-on-break.mjs.
// Run from the repo root, after building v0.261.5: node tests/measure/stored-state_swaps-edits-gaps.mjs <scratch dir>
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.cwd();
const scratch = process.argv[2];
mkdirSync(scratch, { recursive: true });
const page = readFileSync(join(ROOT, 'dist-' + 'github-pages', 'index.html'), 'utf8');
const BREAKS = [
  ['swap record', 's[k]=list; saveSwaps(pid,s)', 'saveSwaps(pid,s)'],
  ['swap rx merge', 'ent.rx=(was?', 'ent.rx=(false?'],
  ['swap undo', 's[k]=s[k].filter(e=>e&&e.from!==from);', ''],
  ['swap count', 'cur.n=(cur.n||0)+1', 'cur.n=1'],
  ['nudge offered', 'c[from].offered=true;saveSwapCounts', 'saveSwapCounts'],
  ['skip record', 'if(e.skip.indexOf(name)<0) e.skip.push(name);', ''],
  ['skip undo', 's[k].skip=(s[k].skip||[]).filter(function(x){return x!==name;});', ''],
  ['add record', 'e.add.push({name:name,detail:detail,ts:Date.now()})', '0'],
  ['add undo', 's[k].add=(s[k].add||[]).filter(function(a){return a&&a.name!==name;});', ''],
  ['edits prune', 'if(m&&+m[1]<cutWeek){delete s[k];changed=true;}', ''],
  ['wildcard record', "function saveWildcardDone(a){iaStore.set(", "function saveWildcardDone(a){return;iaStore.set("],
  ['active id', "function setActiveProgId(id){iaStore.set(", "function setActiveProgId(id){return;iaStore.set("],
];
const run = (app, files) => {
  try { execFileSync('npx', ['vitest', 'run', ...files], { cwd: join(ROOT, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' }); return false; }
  catch { return true; }
};
for (const [name, from, to] of BREAKS) {
  const n = page.split(from).length - 1;
  if (n !== 1) { console.log(name + ': NOT RUN, occurs ' + n + ' times'); continue; }
  const app = join(scratch, 'gap-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  if (run(app, ['integration/stored-state.test.ts'])) { console.log(name + ': red (fast file)'); continue; }
  console.log(name + (run(app, ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts']) ? ': red (sweeps)' : ': GREEN, the records miss it'));
}
