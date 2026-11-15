// native-this-week: when one of core's four date readers is broken, which of the Expo screen's unit tests go red?
// Read-only on this checkout (measure). The Expo app held its own copies of weekOfDate, overlayWeekRange, _progDayDate
// and dayOverlayInfo, and tests/unit/native-this-week.test.ts typed tables for them. The copies gave way to core's
// (core/src/engine/state-overlays.ts) when the seam read core's launch, and the tables stayed, on core's readers and on
// the screen's own readers that call them (dayBeforeStart, scheduledDays, liveInjuryOverlay, dayIsTravel). This breaks
// each of core's four in a copy of the tree and lists the tests that turn red, so the replacement is shown to fire.
//
// The unit file alone: it boots no page. The page is built from core too, so a test that holds the Expo screen
// against the page (tests/integration/native-this-week.test.ts) breaks on both sides at once and cannot see this.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-this-week_readers-break.mjs <scratch>/tree
//        (writes tests/measure/native-this-week_readers-break.md here; the copy's core is put back after each break)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const tree = process.argv[2] && resolve(process.argv[2]);
if (!tree) { console.error('usage: node tests/measure/native-this-week_readers-break.mjs <a tools/tree-at.mjs --working copy>'); process.exit(2); }
const CORE = join(tree, 'core/src/engine/state-overlays.ts');
const TESTS = join(tree, 'tests');
const FILE = 'unit/native-this-week.test.ts';

/** [the reader, what the break does, the text it replaces (once in the file), its replacement] */
const BREAKS = [
  ['weekOfDate', 'every date reads one week late', '  return diff<0 ? 1 : Math.floor(diff/7)+1;\n}', '  return diff<0 ? 1 : Math.floor(diff/7)+2;\n}'],
  ['overlayWeekRange', 'no overlay covers any week', '  return hi<lo ? null : {fromWeek:lo, toWeek:hi};', '  return null;'],
  ['_progDayDate', 'every program day reads one day late', 'dt.setDate(mon.getDate()+(week-1)*7+off);', 'dt.setDate(mon.getDate()+(week-1)*7+off+1);'],
  ['dayOverlayInfo', 'no day says which overlay built it', 'return {type:k[0],patch:k[1]};', 'return null;'],
];

/** The unit file run in the copy: every test's full name and whether it passed. */
function run() {
  const out = join(tree, 'break-run.json');
  try { execFileSync('npx', ['vitest', 'run', FILE, '--reporter=json', '--outputFile=' + out], { cwd: TESTS, stdio: 'ignore' }); } catch { /* red is the point */ }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  const tests = r.testResults.flatMap((f) => f.assertionResults);
  if (!tests.length) throw new Error('the unit file registered no test in the copy: ' + JSON.stringify(r.testResults.map((f) => f.message)).slice(0, 400));
  return tests.map((t) => ({ name: t.fullName.replace(/^native This Week: /, ''), ok: t.status === 'passed' }));
}

const src = readFileSync(CORE, 'utf8');
const say = [];
const clean = run();
const cleanRed = clean.filter((t) => !t.ok);
say.push('# The Expo screen\'s unit tests against a break of each of core\'s date readers');
say.push('');
say.push('Written by `node tests/measure/native-this-week_readers-break.mjs <a copy of the tree>` (read-only here). Each');
say.push('break is one edit to `core/src/engine/state-overlays.ts` in the copy, then `tests/unit/native-this-week.test.ts` run there.');
say.push('');
say.push('- Unbroken: ' + clean.length + ' tests, ' + cleanRed.length + ' red.');
let silent = 0;
try {
  for (const [name, what, from, to] of BREAKS) {
    if (src.split(from).length !== 2) throw new Error(name + ': the text to break occurs ' + (src.split(from).length - 1) + ' times in state-overlays.ts, not once');
    writeFileSync(CORE, src.replace(from, to));
    const red = run().filter((t) => !t.ok && !cleanRed.some((c) => c.name === t.name));
    if (!red.length) silent++;
    say.push('- **`' + name + '`**, ' + what + ': **' + red.length + ' red**' + (red.length ? '' : ' (NOTHING SEES IT)') + '.');
    for (const t of red) say.push('  - ' + t.name);
  }
} finally {
  writeFileSync(CORE, src);
}
say.push('');
say.push(silent ? '**' + silent + ' of ' + BREAKS.length + ' breaks turn nothing red.**' : '**Every break turns a test red: ' + BREAKS.length + ' of ' + BREAKS.length + '.**');
writeFileSync(join(HERE, 'native-this-week_readers-break.md'), say.join('\n') + '\n');
console.log(say.join('\n'));
process.exit(silent || cleanRed.length ? 1 : 0);
