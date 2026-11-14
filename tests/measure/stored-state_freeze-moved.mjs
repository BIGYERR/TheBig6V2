// The ninth lift slice as a move, checked on the built pages (v0.262.2): each moved function's text in the new page is
// its text in the old page with the named substitutions and nothing else (blank lines, which the stripped comments
// leave, aside). Then what is left of the two pages once the moved functions are taken out of both is printed as a
// diff: every hunk of the page outside the moved code. Read-only: the two residues go in the scratch folder.
//
//   node tools/app-at.mjs v0.262.1 <scratch>/base_v0.262.1.html
//   node tests/measure/stored-state_freeze-moved.mjs <scratch>/base_v0.262.1.html dist-github-pages/index.html <scratch> --rest > tests/measure/stored-state_freeze-moved.md
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
const [oldFile, newFile, scratchArg] = process.argv.slice(2);
if (!oldFile || !newFile || !scratchArg || scratchArg.startsWith('--')) { console.error('usage: node tests/measure/stored-state_freeze-moved.mjs <old page> <new page> <scratch dir> [--rest]'); process.exit(2); }
const OLD = readFileSync(oldFile, 'utf8'), NEW = readFileSync(newFile, 'utf8');
const span = (page, name) => {
  const a = page.lastIndexOf('\nfunction ' + name + '(');
  if (a < 0) return null;
  const eol = page.indexOf('\n', a + 1);
  if (page.slice(a + 1, eol).trimEnd().endsWith('}')) return [a + 1, eol + 1];
  const b = page.indexOf('\n}\n', a);
  return [a + 1, b + 3];
};
const body = (page, name) => { const s = span(page, name); return s ? page.slice(s[0], s[1]) : null; };
const tidy = (t) => t.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l !== '').join('\n');
// old name, new name, the substitutions: [old text, new text, times]
const MOVES = [
  ['refreshProgram', 'refreshStoredProgram', [
    ['function refreshProgram(prog){', 'function refreshStoredProgram(store, prog, now, failed){', 1],
    ['const _ps=getPrograms();', 'const _ps=readPrograms(store);', 2],
    ['savePrograms(_ps);', 'writePrograms(store,_ps);', 2],
    ['_td = _parseLocalDate(_isoToday());', '_td = _parseLocalDate(_isoOf(new Date(now)));', 1],
    ['const _psm=paceShiftMap(prog);', 'const _psm=paceShiftMap(prog, now);', 1],
    ['applyOverlays(prog, rebuilt);', 'spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);', 1],
    ['const _today = new Date(); _today.setHours(0,0,0,0);', 'const _today = new Date(now); _today.setHours(0,0,0,0);', 1],
    ["iaStore.get('ia_", "store.get('ia_", 6],
    ["}catch(e){ console.error('week freeze failed; showing fully rebuilt weeks', e); }", '}catch(e){ failed.freeze(e); }', 1],
    ['const _sw=getSwaps(prog.id)||{}, _swLive={};', 'const _sw=readSwaps(store,prog.id)||{}, _swLive={};', 1],
    ["pruneDayEdits(prog.id,_swapCut);", 'pruneDayEditsBefore(store,prog.id,_swapCut);', 1],
    ['const _ed=getDayEdits(prog.id);', 'const _ed=readDayEdits(store,prog.id);', 1],
    ["console.error('refreshProgram failed; using stored program', e);", 'failed.rebuild(e);', 1],
  ]],
  ['paceShiftMap', 'paceShiftMap', [
    ['function paceShiftMap(prog){', 'function paceShiftMap(prog, now){', 1],
    ['const today=new Date(); today.setHours(0,0,0,0);', 'const today=new Date(now); today.setHours(0,0,0,0);', 1],
  ]],
  ...['progTestPin', 'applyRestDayMoves', '_progDayDate', 'weekOfDate', 'overlayWeekRange', 'dayOverlayInfo', '_dayPlanCfg', 'ssSkipToken', 'applyDayEdits', 'applySessionSwaps'].map((n) => [n, n, []]),
];
const ver = (t) => (t.match(/name="ia-version" content="([^"]+)"/) || [])[1];
console.log('# Stored state: the ninth lift slice as a move, ' + ver(OLD) + ' to ' + ver(NEW) + '\n');
console.log('Written by `tests/measure/stored-state_freeze-moved.mjs` from the two built pages.\n');
console.log('## Each moved function against its text in ' + ver(OLD) + '\n');
let bad = 0;
for (const [was, now, subs] of MOVES) {
  let a = body(OLD, was);
  const b = body(NEW, now);
  if (a === null || b === null) { bad++; console.log('MISSING ' + was + ' -> ' + now + (a === null ? ' (old)' : ' (new)')); continue; }
  for (const [x, y, n] of subs) {
    const c = a.split(x).length - 1;
    if (c !== n) { bad++; console.log('  ' + was + ': the old text holds ' + c + ' of ' + JSON.stringify(x.slice(0, 50)) + ', expected ' + n); }
    a = a.split(x).join(y);
  }
  const same = a === b ? 'the same to the byte' : tidy(a) === tidy(b) ? 'the same but for blank lines' : 'DIFFERENT';
  if (same === 'DIFFERENT') {
    bad++;
    const A = tidy(a).split('\n'), B = tidy(b).split('\n');
    const i = A.findIndex((l, k) => l !== B[k]);
    console.log('DIFFERENT ' + was + ' -> ' + now + ' at line ' + i + '\n  old: ' + JSON.stringify(A[i]) + '\n  new: ' + JSON.stringify(B[i]));
  } else console.log('- `' + was + '`' + (was === now ? '' : ' to `' + now + '`') + ': ' + same + (subs.length ? ' with ' + subs.reduce((t, s) => t + s[2], 0) + ' named substitutions' : '') + ' (' + tidy(b).split('\n').length + ' lines)');
}
// One declaration of each moved name in the new page, and the deleted ones gone.
for (const [, now] of MOVES) { const n = NEW.split('\nfunction ' + now + '(').length - 1; if (n !== 1) { bad++; console.log('declared ' + n + ' times in the new page: ' + now); } }
for (const gone of ['applyOverlays', 'pruneDayEdits']) { if (new RegExp('(?<![.\\w$])' + gone + '\\b').test(NEW)) { bad++; console.log('still named in the new page: ' + gone); } }
// What is left: both pages with the moved functions taken out.
const without = (page, names) => {
  let out = page;
  for (const n of names) { const s = span(out, n); if (s) out = out.slice(0, s[0]) + out.slice(s[1]); }
  return tidy(out) + '\n';
};
const dir = resolve(scratchArg);
const fa = join(dir, 'rest-old.txt'), fb = join(dir, 'rest-new.txt');
writeFileSync(fa, without(OLD, MOVES.map((m) => m[0])));
writeFileSync(fb, without(NEW, MOVES.map((m) => m[1])));
let diff = '';
try { execFileSync('diff', ['-U0', fa, fb], { encoding: 'utf8' }); } catch (e) { diff = String(e.stdout || ''); }
const lines = diff.split('\n').filter((l) => /^[-+]/.test(l) && !/^(---|\+\+\+)/.test(l));
console.log('\n## The rest of the page\n');
console.log('Both pages with the moved functions taken out and blank lines dropped: ' + lines.filter((l) => l[0] === '-').length + ' lines gone, ' + lines.filter((l) => l[0] === '+').length + ' lines new.\n');
if (process.argv.includes('--rest')) console.log('```diff\n' + lines.map((l) => l.slice(0, 260)).join('\n') + '\n```\n');
console.log(bad ? '**' + bad + ' NOT AS MOVED**' : '**Every moved function is its old text with the named substitutions, and the rest of the page differs by the lines above alone.**');
process.exit(bad ? 1 : 0);
