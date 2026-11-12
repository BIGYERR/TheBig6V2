// Measure, in the sixth lift slice: were v0.261.6's golden records blind to the rules that moved? Each break of
// stored-state_red-on-break.mjs added for v0.261.7 is made in a copy of the built page (the moved code, where the break's
// text is), and v0.261.6's own stored-state files run against it: its tests and its golden file, from a tree of that
// release (tools/tree-at.mjs). The fast file first, the sweeps only for a break it lets through. Read-only.
//   node tests/measure/stored-state_progress-gaps-breaks.mjs <tree of v0.261.6> <scratch dir> > <scratch>/gaps-breaks.md
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const [treeArg, scratchArg] = process.argv.slice(2);
if (!treeArg || !scratchArg) { console.error('usage: node tests/measure/stored-state_progress-gaps-breaks.mjs <tree of v0.261.6> <scratch dir>'); process.exit(2); }
const tree = resolve(treeArg), scratch = resolve(scratchArg);
mkdirSync(scratch, { recursive: true });
const page = readFileSync(join(ROOT, 'dist-' + 'github-pages', 'index.html'), 'utf8');
const src = readFileSync(join(ROOT, 'tests', 'measure', 'stored-state_red-on-break.mjs'), 'utf8');
// The rows after the v0.261.7 marker in the BREAKS list (it ends on a line of its own: a rule's text may hold "];").
// The first row is a control: the log key break, which v0.261.6's records turn red, shows the instrument can fire.
const tail = "  ['log key (control)', '', \"function logKey(w,d){return dayStoreKey(w,d);}\", \"function logKey(w,d){return 'w'+w+'-'+d;}\"],\n"
  + src.slice(src.indexOf('// v0.261.7:'), src.indexOf('\n];', src.indexOf('// v0.261.7:')));
const rows = [...tail.matchAll(/^\s*\[('(?:[^'\\]|\\.)*'), ('(?:[^'\\]|\\.)*'), ('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"), ('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\],$/gm)]
  .map((m) => m.slice(1).map((s) => (0, eval)(s)));
const runFiles = (app, files) => {
  try {
    execFileSync('npx', ['vitest', 'run', ...files], { cwd: join(tree, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' });
    return false;
  } catch { return true; }
};
const out = ['| Break | On v0.261.6\'s records |', '|---|---|'];
let blind = 0;
for (const [name, , from, to] of rows) {
  const n = page.split(from).length - 1;
  if (n !== 1) { out.push(`| ${name} | NOT RUN: the text occurs ${n} times |`); continue; }
  const app = join(scratch, 'gap-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  const red = runFiles(app, ['integration/stored-state.test.ts']) || runFiles(app, ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts']);
  if (!red) blind++;
  out.push(`| ${name} | ${red ? 'red' : 'green (blind)'} |`);
}
console.log(`${rows.length - 1} breaks and the control, ${blind} green on v0.261.6's records (the control must be red).\n\n` + out.join('\n'));
