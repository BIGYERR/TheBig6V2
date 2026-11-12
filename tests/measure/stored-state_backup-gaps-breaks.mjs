// Measure, before the seventh lift slice: are the golden records blind to the backup's rules? A break inside each rule
// of the snapshot, the reader and the loader (data-backup.ts as v0.261.7 built it) is made in a copy of the built page,
// and two sets of tests run against it: the stored-state records (the fast file first, the sweeps only for a break it
// lets through), and the backup's own feature tests (tests/unit/data-backup.test.ts, tests/integration/data-backup.test.ts).
// The tests run from a tree of v0.261.7 (tools/tree-at.mjs), so the records are that release's, whatever the working tree
// holds. The first row is a control: the log key break, which the records turn red, shows the instrument can fire. Read-only.
//   node tools/tree-at.mjs v0.261.7 <scratch>/tree
//   node tests/measure/stored-state_backup-gaps-breaks.mjs <scratch>/tree <scratch dir> > tests/measure/stored-state_backup-gaps.md
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

if (!process.argv[3]) { console.error('usage: node tests/measure/stored-state_backup-gaps-breaks.mjs <tree of v0.261.7> <scratch dir>'); process.exit(2); }
const tree = resolve(process.argv[2]), scratch = resolve(process.argv[3]);
mkdirSync(scratch, { recursive: true });
const page = readFileSync(join(tree, 'index.html'), 'utf8');
const version = (page.match(/name="ia-version" content="([^"]+)"/) || [])[1];

// name, what the break does, the exact text (once in the page), its replacement.
const BREAKS = [
  ['log key (control)', 'a log is stored under w1-mon', "function logKey(w,d){return dayStoreKey(w,d);}", "function logKey(w,d){return 'w'+w+'-'+d;}"],
  ['backup scan', 'the backup leaves out the last key', "iaStore.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});", "iaStore.keys().slice(0,-1).forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});"],
  ['backup scan, prefix', 'the backup takes every key, not only the app\'s', "iaStore.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});", "iaStore.keys().forEach(k=>{keys.push(k);});"],
  ['backup order', 'the backup keeps storage order', 'return keys.sort();', 'return keys;'],
  ['snapshot null', 'a key with no value goes into the file', 'if(v!=null) data[k]=v;', 'data[k]=v;'],
  ['snapshot kind', 'the file is not marked as a backup', 'return {kind:BACKUP_KIND,format:BACKUP_FORMAT,', "return {kind:'x',format:BACKUP_FORMAT,"],
  ['snapshot format', 'the file carries no format', 'return {kind:BACKUP_KIND,format:BACKUP_FORMAT,', 'return {kind:BACKUP_KIND,format:0,'],
  ['snapshot version', 'the file does not name its release', 'version:String(IA_VERSION),', "version:'0',"],
  ['snapshot made', 'the file does not carry when it was made', 'made:new Date().toISOString(),data};', "made:'',data};"],
  ['reader kind', 'a file of another kind is read', 'f.kind!==BACKUP_KIND) return', 'false) return'],
  ['reader newer', 'a newer file reads as not a backup', "return {ok:false,why:'newer'};", "return {ok:false,why:'bad'};"],
  ['reader format', 'a file with no format is read', "if(f.format!==BACKUP_FORMAT) return {ok:false,why:'bad'};", ''],
  ['reader data', 'a file whose data is not an object is read', "if(!d||typeof d!=='object'||Array.isArray(d)) return {ok:false,why:'bad'};", ''],
  ['reader keys', 'a file with a key not the app\'s, or a value not a string, is read', "if(!Object.keys(d).every(k=>k.indexOf('ia_')===0&&typeof d[k]==='string')) return {ok:false,why:'bad'};", ''],
  ['reader programs', 'a file with no program list is read', "if(programs<0) return {ok:false,why:'bad'};", ''],
  ['program count', 'every program list counts one', 'return Array.isArray(a)?a.length:-1;', 'return Array.isArray(a)?1:-1;'],
  ['reader made', 'the file\'s time is not read', "made:typeof f.made==='string'?f.made:''}", "made:''}"],
  ['load clears', 'a load keeps the phone\'s keys the file does not hold', 'keys.forEach(k=>iaStore.remove(k));', ''],
  ['load writes', 'a load writes nothing', 'Object.keys(data).forEach(k=>iaStore.set(k,data[k]));', ''],
  ['load rollback, clear', 'a refused load keeps what it wrote', '_backupKeys().forEach(k=>{try{iaStore.remove(k);}catch{}});', ''],
  ['load rollback, restore', 'a refused load does not put back what the phone held', 'Object.keys(before).forEach(k=>{try{iaStore.set(k,before[k]);}catch{}});', ''],
  ['load result', 'a refused load reports success', 'catch{}});\n    return false;', 'catch{}});\n    return true;'],
];

const runFiles = (app, files) => {
  try {
    execFileSync('npx', ['vitest', 'run', ...files], { cwd: join(tree, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' });
    return false;
  } catch { return true; }
};
const out = ['| Break | What it does | The records | The backup\'s own tests |', '|---|---|---|---|'];
let blind = 0;
for (const [name, what, from, to] of BREAKS) {
  const n = page.split(from).length - 1;
  if (n !== 1) { out.push(`| ${name} | ${what} | NOT RUN: the text occurs ${n} times | |`); continue; }
  const app = join(scratch, 'gap-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, to));
  const fast = runFiles(app, ['integration/stored-state.test.ts']);
  const rec = fast ? 'red (the fast file)' : runFiles(app, ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts']) ? 'red (the sweeps)' : 'GREEN (blind)';
  if (rec.startsWith('GREEN')) blind++;
  const own = runFiles(app, ['unit/data-backup.test.ts', 'integration/data-backup.test.ts']) ? 'red' : 'green';
  out.push(`| ${name} | ${what} | ${rec} | ${own} |`);
}
console.log(`# Stored state: the backup's rules, are the records blind to them? (on ${version})\n`);
console.log(`Written by \`tests/measure/stored-state_backup-gaps-breaks.mjs\`. ${BREAKS.length - 1} breaks and the control; ${blind} green on the records (the control must be red).\n`);
console.log(out.join('\n'));
