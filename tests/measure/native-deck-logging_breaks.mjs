// native-deck-logging: when one rule of the Expo deck's logging is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of a move's fields
// (frontends/native/src/deck/set-fields.ts), of what a tap stores (deck-writes.ts), of the day's draw
// (deck-screen.ts), or of the launch (this-week/week-screen.ts). The six test files that hold the deck and the
// launch are run on each, and the files and tests that turn red are counted. A break no file turns red on is a rule
// no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-deck-logging_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-deck-logging_breaks.md here; each file of the copy is put back after its break)
// The whole set takes about a quarter of an hour in one copy, so it runs in parts, each in a copy of its own, at once:
//        node tests/measure/native-deck-logging_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-deck-logging_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-deck-logging_breaks.mjs --check
//        (names every break whose text is not in its file once; exit 1 when there is one)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name) => (process.argv.indexOf(name) > 0 ? process.argv[process.argv.indexOf(name) + 1] : null);
const merging = process.argv[2] === '--merge';
const checking = process.argv[2] === '--check';
const tree = !merging && !checking && process.argv[2] ? resolve(process.argv[2]) : null;
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-deck-logging_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FILES = ['unit/native-deck-logging.test.ts', 'integration/native-deck-logging.test.ts', 'unit/native-deck.test.ts', 'integration/native-deck.test.ts', 'unit/native-this-week.test.ts', 'integration/native-this-week.test.ts'];
const FIELDS = 'frontends/native/src/deck/set-fields.ts', WRITES = 'frontends/native/src/deck/deck-writes.ts', SCREEN = 'frontends/native/src/deck/deck-screen.ts', LAUNCH = 'frontends/native/src/this-week/week-screen.ts';

/**
 * [the file, the rule broken, the text it replaces (once in the file), its replacement]. A rule the code keeps in two
 * places is broken in both: its third entry is then a list of [text, replacement] pairs.
 */
const BREAKS = [
  // A move's fields.
  [FIELDS, 'a step can go under zero', '  v += step;\n  if (v < 0) v = 0;\n', '  v += step;\n'],
  [FIELDS, 'a step on a blank set starts from nothing, not its placeholder', "  let v = parseInt((el.value !== '' ? el.value : el.placeholder) || '0', 10);\n  if (isNaN(v)) v = 0;\n  v += step;", "  let v = parseInt(el.value || '0', 10);\n  if (isNaN(v)) v = 0;\n  v += step;"],
  [FIELDS, 'a set\'s load cleared does not inherit again', "inherit: text === '' }", 'inherit: false }'],
  [FIELDS, 'the load field reaches every set, typed on its own or not', '(el.inherit ? { ...el, placeholder: v } : el)', '({ ...el, placeholder: v })'],
  [FIELDS, 'the reuse pill does not reach the sets', 'return f.load ? cascade({ ...f, load: { ...f.load, value: String(value) } }) : null;', 'return f.load ? { ...f, load: { ...f.load, value: String(value) } } : null;'],
  [FIELDS, 'Fill every set leaves the cells inheriting', '({ ...el, value: String(value), inherit: false })', '({ ...el, value: String(value) })'],
  [FIELDS, 'Log does not leave the load solid in its field', "load: { value: String(dispW), placeholder: String(dispW) }, reuse:", 'load: f.load, reuse:'],
  [FIELDS, 'Log does not restate the reuse pill', "reuse: { text: dispW + ' ' + unit, rec: 'earlier today' } };", 'reuse: null };'],
  [FIELDS, 'a blank set logs 0, not its placeholder', "    const v = parseInt((el.value !== '' ? el.value : el.placeholder) || '0', 10);\n    return isNaN(v) ? 0 : v;", "    const v = parseInt(el.value || '0', 10);\n    return isNaN(v) ? 0 : v;"],
  [FIELDS, 'a blank load cell logs 0, not the load it inherits', "const v = parseFloat(el.value !== '' ? el.value : el.placeholder);\n    return isNaN(v) ? 0 : v;", 'const v = parseFloat(el.value);\n    return isNaN(v) ? 0 : v;'],
  [FIELDS, 'a draft holds placeholders for untouched sets', 'return f.reps.map((el) => el.value);', 'return f.reps.map((el) => el.value || el.placeholder);'],
  [FIELDS, 'a draft holds the inherited load for untouched cells', 'return f.loads.map((el) => el.value);', 'return f.loads.map((el) => el.value || el.placeholder);'],
  [FIELDS, 'Varied reads the loads alone', 'f.drawn.varied : vary || setsVaried(r),', 'f.drawn.varied : vary,'],
  [FIELDS, 'the top set is marked while every set is the same', 'top: a.map((v) => vary && v === max),', 'top: a.map((v) => v === max),'],
  [FIELDS, 'a set shows no difference from its target', "return diff === 0 ? '' : diff < 0 ? String(diff) : '+' + diff;", "return '';"],
  // What a tap stores.
  [WRITES, 'Log stores the load field, not the heaviest set', 'if (top > 0) { storedW = top; hasW = true; dispW = Math.max(...dispSets); }', 'if (top > 0) { hasW = true; }'],
  [WRITES, 'a kilogram program stores each set\'s load unconverted', 'setsW = dispSets.map((x) => toStoreW(x, kg));', 'setsW = dispSets.slice();'],
  [WRITES, 'a kilogram program stores the load field unconverted', 'storedW = kg ? Math.round(v * 2.20462) : v; hasW = true;', 'storedW = v; hasW = true;'],
  [WRITES, 'Log leaves the draft in the day\'s log', "  dropSetDraft(s.store, s.prog.id, s.week, s.dayKey, exKey);\n  return { ok: true,", '  return { ok: true,'],
  [WRITES, 'Log does not snapshot the day', '    if (s.dayKey) snapshotDay(s);\n', ''],
  [WRITES, 'a draft does not snapshot the day', '  snapshotDay(s);\n  recordSetDraft(', '  recordSetDraft('],
  [WRITES, 'a draft stores the load field\'s placeholder', "L: f.load ? f.load.value : '' }", "L: f.load ? (f.load.value || f.load.placeholder) : '' }"],
  [WRITES, 'a change after Log is kept as a draft, not committed', '  if (f.logged) return commitSetsLive(s, exKey, f, now);\n', ''],
  [WRITES, 'a change after Log loses the prescription it was logged under', "(prev && prev.setsReps) || ''", "''"],
  [WRITES, 'Done, next one is not quiet', 'const r = saveLift(s, m.exKey, m.name, m.rxDetail, f, now, true);', 'const r = saveLift(s, m.exKey, m.name, m.rxDetail, f, now);'],
  [WRITES, 'Done, next one logs a logged move again', 'const open = moves.filter((m) => !m.logged);', 'const open = moves;'],
  [WRITES, 'a move with nothing to log is logged anyway', "  if (!setsDone.length && !hasW) return { ok: false, fields: f, toast: 'Nothing to log here' };\n", ''],
  [WRITES, 'the toast\'s words change', "' logged ✓' : 'Logged ✓'", "' saved' : 'Saved'"],
  [WRITES, 'Mark the day done stores an effort the slider never gave', 'logs[key] = callItLog(logs[key], rpe, notes, s.week, now);', 'logs[key] = callItLog(logs[key], rpe ?? 7, notes, s.week, now);'],
  [WRITES, 'Mark the day done drops the day\'s other fields', 'logs[key] = callItLog(logs[key], rpe, notes, s.week, now);', 'logs[key] = callItLog(null, rpe, notes, s.week, now);'],
  [WRITES, 'Mark the day done stores another status', "title, 'complete', now);", "title, 'skipped', now);"],
  // The deck's markDay snapshots the day, and so does the page's markDayComplete inside it: both go.
  [WRITES, 'Mark the day done does not snapshot the day', [
    ['export function markDay(s: Session, title: string, rpe: number | null, notes: string, now: number): void {\n  snapshotDay(s);\n', 'export function markDay(s: Session, title: string, rpe: number | null, notes: string, now: number): void {\n'],
    ['  snapshotDay(s);\n  setDayStatus(', '  setDayStatus('],
  ]],
  [WRITES, 'a skip does not store the edit', '  if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name); else dropSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);', '  if (!off) dropSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);'],
  [WRITES, 'a put back does not clear the edit', '  if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name); else dropSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);', '  if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);'],
  [WRITES, 'a skip does not renew the day\'s snapshot', "  resnapshotDay(s);\n  return off ? name + ' is off today.", "  return off ? name + ' is off today."],
  [WRITES, 'a put back leaves the move marked on the day', 'it._skipped = off ? true : (undefined as unknown as boolean); hit = true;', 'it._skipped = true; hit = true;'],
  [WRITES, 'a round is stored under another token', 'if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, ssSkipToken(secIdx));', "if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, 'round:' + secIdx);"],
  [WRITES, 'the skip\'s words change', "' is off today. Tap to put it back.' : name + ' is back on the card.'", "' is skipped.' : name + ' is back.'"],
  // The day's draw.
  [SCREEN, 'the stale warning speaks again after an edit', 'warnShown: () => warn.shown,', 'warnShown: () => false,'],
  [SCREEN, 'a card is logged once any move is', 'return { ...c, moves, logged: moves.every((m) => m.logged) };', 'return { ...c, moves, logged: moves.some((m) => m.logged) };'],
  // The launch.
  [LAUNCH, 'the launch loads an archived program the pointer names', 'all.find((x) => x && x.id === id && !x.archived) ||', 'all.find((x) => x && x.id === id) ||'],
  [LAUNCH, 'the launch falls back to no other program', '|| all.find((x) => x && !x.archived) || null;', '|| null;'],
  [LAUNCH, 'the launch does not write the pointer', '    writeActiveProgramId(store, stored.id);\n', ''],
  [LAUNCH, 'the launch leaves a pointer that leads nowhere', "  if (readActiveProgramId(store)) store.remove('ia_active');\n", ''],
  [LAUNCH, 'the launch folds the lift log and does not store it', 'if (foldExAliasKeys(log as never)) writeLiftLog(store, programId, log);', 'foldExAliasKeys(log as never);'],
  [LAUNCH, 'the launch does not fold the lift log', '  foldLiftLog(store, stored.id);\n', ''],
  [LAUNCH, 'the launch is handed a store that drops writes', 'return refreshStoredProgram(store, stored as unknown as StoredProgram, now, failed)', 'return refreshStoredProgram({ get: (k) => store.get(k), keys: () => store.keys(), set: () => {}, remove: () => {} }, stored as unknown as StoredProgram, now, failed)'],
];

/** The six files run in the copy: per file, how many tests failed (a file that could not load counts as failed whole). */
function run() {
  const out = join(tree, 'break-run.json');
  try { execFileSync('npx', ['vitest', 'run', ...FILES, '--reporter=json', '--outputFile=' + out], { cwd: TESTS, stdio: 'ignore' }); } catch { /* red is the point */ }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  if (r.testResults.length !== FILES.length) throw new Error('the copy ran ' + r.testResults.length + ' files of ' + FILES.length);
  const files = {};
  let tests = 0;
  for (const f of r.testResults) {
    const name = FILES.find((x) => f.name.endsWith(x));
    const failed = f.assertionResults.filter((t) => t.status !== 'passed' && t.status !== 'pending' && t.status !== 'skipped').length;
    const red = f.status !== 'passed' ? Math.max(failed, 1) : 0;
    tests += f.assertionResults.length;
    if (red) files[name] = red;
  }
  return { files, tests };
}

const FILES_LINE = FILES.map((f) => '`' + f + '`').join(', ');
/** The report from every break's row: [n, file, rule, {file: tests red}]. */
function report(rows, cleanTests) {
  const say = [];
  say.push('# The Expo deck\'s logging: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-deck-logging_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
  say.push('');
  say.push('- The files run on each break: ' + FILES_LINE + '. Unbroken, they hold ' + cleanTests + ' tests and all pass.');
  say.push('');
  say.push('| # | File | The rule broken | Files red | Tests red | Which |');
  say.push('|---|---|---|---|---|---|');
  let missed = 0;
  for (const [n, file, rule, files] of rows.sort((x, y) => x[0] - y[0])) {
    const names = Object.keys(files), tests = names.reduce((t, k) => t + files[k], 0);
    if (!names.length) missed++;
    say.push('| ' + n + ' | `' + file.split('/').pop() + '` | ' + rule + ' | **' + names.length + '** | ' + tests + ' | ' + (names.map((k) => k.replace('.test.ts', '') + ' ' + files[k]).join(', ') || '**none: let through**') + ' |');
  }
  say.push('');
  say.push('- Breaks made: **' + rows.length + '** of ' + BREAKS.length + '. Let through by every file: **' + missed + '**.');
  return say;
}

if (merging) {
  const parts = process.argv.slice(3).map((f) => JSON.parse(readFileSync(f, 'utf8')));
  // A break run again later replaces its earlier row (a part named after the others wins).
  const byN = new Map();
  for (const x of parts) for (const r of x.rows) byN.set(r[0], r);
  const rows = [...byN.values()];
  if (rows.length !== BREAKS.length) throw new Error('the parts hold ' + rows.length + ' breaks of ' + BREAKS.length);
  const say = report(rows, parts[0].clean);
  writeFileSync(join(HERE, 'native-deck-logging_breaks.md'), say.join('\n') + '\n');
  console.log(say.slice(-1)[0]);
  process.exit(0);
}

// --check: the whole list read against this checkout, every text that is not in its file once named, nothing run.
if (checking) {
  const root = resolve(HERE, '..', '..');
  let bad = 0;
  BREAKS.forEach(([file, rule, from, to], i) => {
    let text = readFileSync(join(root, file), 'utf8');
    for (const [a, b] of (Array.isArray(from) ? from : [[from, to]])) {
      const times = text.split(a).length - 1;
      if (times !== 1) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + times + ' times, not once'); }
      text = text.replace(a, b);
    }
  });
  console.log(BREAKS.length + ' breaks read against this checkout, ' + bad + ' with a text not found once');
  process.exit(bad ? 1 : 0);
}

const clean = run();
if (Object.keys(clean.files).length) throw new Error('the copy is red before any break: ' + JSON.stringify(clean.files));
const rows = [];
let n = 0;
for (const [file, rule, from, to] of BREAKS) {
  n++;
  if (only && !rule.includes(only)) continue;
  if (part && (n - 1) % part[1] !== part[0]) continue;
  const path = join(tree, file), src = readFileSync(path, 'utf8');
  let broken = src;
  for (const [a, b] of (Array.isArray(from) ? from : [[from, to]])) {
    if (broken.split(a).length !== 2) throw new Error('break ' + n + ' (' + rule + '): its text is in ' + file + ' ' + (broken.split(a).length - 1) + ' times, not once');
    broken = broken.replace(a, b);
  }
  let r;
  try {
    writeFileSync(path, broken);
    r = run();
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files');
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean: clean.tests, rows }));
const say = report(rows, clean.tests);
if (!only && !part) writeFileSync(join(HERE, 'native-deck-logging_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
