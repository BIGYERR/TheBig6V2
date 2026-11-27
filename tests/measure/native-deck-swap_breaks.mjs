// native-deck-swap: when one rule of the Expo deck's swap sheet is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of what the sheet
// lists (frontends/native/src/deck/deck-swaps.ts), of what a pick and put it back store and leave on the card
// (deck-writes.ts), of a move's summary as drawn (set-fields.ts), of the cover that hides a card's words
// (deck-screen.ts), or of the screen's wiring (Deck.tsx, swap-sheet/SwapSheet.tsx). The files that hold the deck are
// run on each, the ten-program sweep among them, and the files and tests that turn red are counted. A break no file
// turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-deck-swap_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-deck-swap_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-deck-swap_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-deck-swap_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-deck-swap_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-deck-swap_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FILES = ['unit/native-deck-swap.test.ts', 'integration/native-deck-swap.test.ts', 'sweeps/native-deck-swap.test.ts', 'unit/native-deck-logging.test.ts', 'integration/native-deck-logging.test.ts', 'unit/native-deck.test.ts', 'integration/native-deck.test.ts'];
const SWAPS = 'frontends/native/src/deck/deck-swaps.ts', WRITES = 'frontends/native/src/deck/deck-writes.ts', FIELDS = 'frontends/native/src/deck/set-fields.ts', SCREEN = 'frontends/native/src/deck/deck-screen.ts';
const DECK = 'frontends/native/src/deck/Deck.tsx', SHEET = 'frontends/native/src/swap-sheet/SwapSheet.tsx';

/**
 * [the file, the rule broken, the text it replaces (once in the file), its replacement]. A rule the code keeps in two
 * places is broken in both: its third entry is then a list of [text, replacement] pairs.
 */
const BREAKS = [
  // What the sheet lists.
  [SWAPS, 'the universe ignores the overlay the day was built under', '  if (Array.isArray(byKey) && byKey.length) return byKey as string[];\n', ''],
  // The lift going out is on the card, so the page's code keeps it off the list twice: by name and with the card's
  // other lifts. One of the two taken out changes nothing; the break takes out both.
  [SWAPS, 'the lift going out and the lifts on the card are offered', [
    ['if (!n || n === outName) return;', 'if (!n) return;'],
    ['    if (onCard[n.toLowerCase()]) return;\n    const p = _pattern(n);', '    const p = _pattern(n);'],
  ]],
  [SWAPS, 'a lift already on the card is offered', '    if (onCard[n.toLowerCase()]) return;\n    const p = _pattern(n);', '    const p = _pattern(n);'],
  [SWAPS, 'a lift the day\'s injury plan drops is offered', '    if (!_swapInjuryOK(n, cfg)) return;\n', ''],
  [SWAPS, 'a round\'s partner is not asked about the station', '    if (ssP && !_ssLegal(n, ssP)) return;\n', ''],
  [SWAPS, 'any lift of the region counts as the same job', 'if (outPat && p === outPat) { t1.push(n); return; }', 'if (outPat && outRegion && _PATTERN_REGION[p] === outRegion) { t1.push(n); return; }'],
  [SWAPS, 'no row of another job is listed', '    if (outRegion && _PATTERN_REGION[p] === outRegion) t2.push(n);\n', ''],
  [SWAPS, 'the list is not ranked by nearness in load', '    if (da !== db) return da - db;\n', ''],
  [SWAPS, 'among equals the heavier does not come first', '    if (ta !== tb) return tb - ta;\n', ''],
  [SWAPS, 'more than eight of the same job are listed', 't1.sort(rank).slice(0, 8)', 't1.sort(rank)'],
  [SWAPS, 'more than five of another job are listed', 't2.sort(rank).slice(0, 5)', 't2.sort(rank)'],
  [SWAPS, 'the lighter note is said at one step of difference', "if (d < 2) return '';", "if (d < 1) return '';"],
  [SWAPS, 'a lift with no pattern lists the pattern\'s list, not its family\'s', '  if (fam) { c.tier1 = auxSwapCandidates(item.name, day, prog); c.tier2 = []; }\n', ''],
  [SWAPS, 'the family\'s list ignores the kit', "    if (!_auxGearOK(n, cfg.equipment || 'home_full')) return false;\n", ''],
  [SWAPS, 'the family\'s list ignores the power doctrine', "    if (fam === 'power' && typeof _powerAllowed === 'function' && !_powerAllowed(n, cfg.experience, cfg.injury, cfg.ageBracket)) return false;\n", ''],
  [SWAPS, 'the family\'s list ignores the injury plan', '    return _swapInjuryOK(n, cfg);\n  }).sort();', '    return true;\n  }).sort();'],
  [SWAPS, 'the family\'s list offers a lift on the card', '    if (onCard[n.toLowerCase()]) return false;\n', ''],
  [SWAPS, 'the family\'s list does not ask a round\'s partner', '    if (ssP && !_ssLegal(n, ssP)) return false;\n', ''],
  [SWAPS, 'the family\'s list is not sorted', '  }).sort();\n}', '  });\n}'],
  [SWAPS, 'the family\'s name is not on the sheet', 'familyLabel: fam ? _AUX_FAMILY_LABEL[fam] ?? null : null,', 'familyLabel: null,'],
  [SWAPS, 'the sheet reads the program\'s plan, not the day\'s', [
    ['const cfg = _dayPlanCfg(prog ? asProgram(prog) : null, day);\n  const outPat', 'const cfg = _dayPlanCfg(prog ? asProgram(prog) : null, null);\n  const outPat'],
    ['const cfg = _dayPlanCfg(prog ? asProgram(prog) : null, day);\n  const onCard', 'const cfg = _dayPlanCfg(prog ? asProgram(prog) : null, null);\n  const onCard'],
  ]],
  [SWAPS, 'the sheet does not say what a pick keeps', "    detail: item.detail || '',\n    itemIdx,", "    detail: '',\n    itemIdx,"],
  [SWAPS, 'the heavy compound tag is never shown', 'compoundTier: _compoundTier(item.name),', 'compoundTier: 0,'],
  [SWAPS, 'the lift in hand keeps no prescription', "return { ctx: { secIdx, itemIdx, name: item.name, detail: item.detail || '' }, view };", "return { ctx: { secIdx, itemIdx, name: item.name, detail: '' }, view };"],
  // What a pick stores and leaves on the card.
  [WRITES, 'a pick keeps no place for put it back', 'addSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from, to, undoRx, now);', 'addSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from, to, [], now);'],
  [WRITES, 'a kept place holds no dose from before an injury\'s hold', "      if (typeof it['_preHold'] === 'string') e.ph = it['_preHold'];\n", ''],
  [WRITES, 'the dose carries with the plan\'s cue on it', "const base = _stripCapCue(typeof item['_preHold'] === 'string' ? (item['_preHold'] as string) : wasDetail) as string;", "const base = (typeof item['_preHold'] === 'string' ? (item['_preHold'] as string) : wasDetail) as string;"],
  [WRITES, 'the dose carries from the card, not from beneath the hold', "const base = _stripCapCue(typeof item['_preHold'] === 'string' ? (item['_preHold'] as string) : wasDetail) as string;", 'const base = _stripCapCue(wasDetail) as string;'],
  [WRITES, 'the dose carries verbatim onto any lift', 'item.detail = _swapDetailFor(to, base, rx);', 'item.detail = base;'],
  [WRITES, 'an injured day\'s plan is not asked', '  if (planOf(s, day).injury) {', '  if (planOf(s, day).injury && now < 0) {'],
  [WRITES, 'the dose before the plan\'s filter is not kept beside the card', "    item['_preHold'] = preF;\n", ''],
  [WRITES, 'the hold is said on every pick of an injured day', 'held = /RPE/.test(preF) && fi.detail !== preF;', 'held = true;'],
  [WRITES, 'the card keeps the dose from before the plan\'s filter', 'held = /RPE/.test(preF) && fi.detail !== preF; item.detail = fi.detail;', 'held = /RPE/.test(preF) && fi.detail !== preF;'],
  [WRITES, 'a label naming the lift keeps the old name', '  if (sec.label && sec.label.indexOf(from) >= 0) sec.label = sec.label.split(from).join(to);\n', ''],
  [WRITES, 'a pick is not counted', 'const nudge = wild ? false : !!countSwap(s.store, s.prog.id, from, to);', 'const nudge = false;'],
  [WRITES, 'a pick does not renew the day\'s snapshot', '  if (!wild) resnapshotDay(s);\n  const lead', '  const lead'],
  [WRITES, 'the toast names the lift going out as it is written', "const lead = to + ' in, ' + from.toLowerCase() + ' out. ';", "const lead = to + ' in, ' + from + ' out. ';"],
  [WRITES, 'the plain toast\'s words', "lead + 'Same job, same numbers.'", "lead + 'Same job.'"],
  [WRITES, 'the no load toast\'s words', "lead + 'No load to add here, so take the sets to the same effort.'", "lead + 'No load to add here.'"],
  [WRITES, 'the window toast\'s words', "lead + 'The load runs out before the reps do here. Same sets, same effort. Reps move to '", "lead + 'Reps move to '"],
  [WRITES, 'the held no load toast\'s words', "lead + 'No load to add here. Your injury plan holds this one at RPE 7.'", "lead + 'No load to add here.'"],
  [WRITES, 'the held window toast\'s words', "' + rx.win[1] + '. Your injury plan holds this one at RPE 7.'", "' + rx.win[1] + '.'"],
  [WRITES, 'the held plain toast\'s words', "lead + 'Same sets, same reps. Your injury plan holds this one at RPE 7.')", "lead + 'Same sets, same reps.')"],
  // Put it back.
  [WRITES, 'put it back reads another week\'s records', "readSwaps(s.store, s.prog.id)['w' + s.week + '_' + s.dayKey] || [];", "readSwaps(s.store, s.prog.id)['w' + (s.week + 1) + '_' + s.dayKey] || [];"],
  [WRITES, 'put it back does not give the name back', '  applySwapPrefs(day.sections as unknown as Section[], back);\n', ''],
  [WRITES, 'put it back does not give the lift its own dose back', '        got.detail = p.d;\n', ''],
  [WRITES, 'put it back leaves the dose kept before a hold on the card', "if (typeof p.ph === 'string') got['_preHold'] = p.ph; else delete got['_preHold'];", "if (typeof p.ph === 'string') got['_preHold'] = p.ph;"],
  [WRITES, 'put it back does not bring the dose kept before a hold', "if (typeof p.ph === 'string') got['_preHold'] = p.ph; else delete got['_preHold'];", "delete got['_preHold'];"],
  [WRITES, 'put it back gives a dose to a place that no longer holds the lift', 'let it: ExItem | null = at && at.name === from && put.indexOf(at) < 0 ? at : null;', 'let it: ExItem | null = at || null;'],
  [WRITES, 'put it back leaves the record', "  else { dropSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from); resnapshotDay(s); }", "  else { resnapshotDay(s); }"],
  [WRITES, 'put it back does not renew the day\'s snapshot', "  else { dropSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from); resnapshotDay(s); }", "  else { dropSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from); }"],
  [WRITES, 'put it back\'s words', "return from + ' is back on the card.';", "return from + ' is back.';"],
  // A move's summary as drawn.
  [FIELDS, 'the summary is restated from the cells at once', 'head: f.drawn ? f.drawn.head : setsSummary(rx, a, r),', 'head: setsSummary(rx, a, r),'],
  [FIELDS, 'the summary\'s words are restated at once', 'sub: f.drawn ? f.drawn.sub : setsSubLabel(rx, a, r, f.logged),', 'sub: setsSubLabel(rx, a, r, f.logged),'],
  [FIELDS, 'Varied is restated at once', 'varied: f.drawn ? f.drawn.varied : vary || setsVaried(r),', 'varied: vary || setsVaried(r),'],
  [FIELDS, 'the load\'s label is restated at once', "loadLabel: f.drawn ? f.drawn.label : vary ? 'Top set' : 'Load',", "loadLabel: vary ? 'Top set' : 'Load',"],
  [FIELDS, 'opening the sets restates nothing', 'export function openedSets(f: MoveFields): MoveFields {\n  return restated(f);', 'export function openedSets(f: MoveFields): MoveFields {\n  return f;'],
  [FIELDS, 'a move with no load cell is restated when a load changes or its sets open', '(f.loads.length && f.drawn ? { ...f, drawn: null } : f)', '(f.drawn ? { ...f, drawn: null } : f)'],
  [FIELDS, 'a step restates nothing', 'return { ...f, drawn: null, reps: at(f.reps, s, { ...el, value: String(v) }) };', 'return { ...f, reps: at(f.reps, s, { ...el, value: String(v) }) };'],
  [FIELDS, 'a typed rep restates nothing', 'return el ? { ...f, drawn: null, reps: at(f.reps, s, { ...el, value: text }) } : f;', 'return el ? { ...f, reps: at(f.reps, s, { ...el, value: text }) } : f;'],
  [FIELDS, 'a load typed restates nothing', 'return restated({ ...f, loads: f.loads.map((el) => (el.inherit ? { ...el, placeholder: v } : el)) });', 'return { ...f, loads: f.loads.map((el) => (el.inherit ? { ...el, placeholder: v } : el)) };'],
  [FIELDS, 'Log restates nothing', 'const drawn = f.reps.length ? null : f.drawn;', 'const drawn = f.drawn;'],
  // The cover that hides a card's words.
  [SCREEN, 'the top card wears a cover', 'if (k === top) return null;', "if (k === top) return k === peek ? null : 'rest';"],
  [SCREEN, 'the card behind is not raised by a drag', "return done ? 'rest' : 'drag';", "return 'rest';"],
  [SCREEN, 'the card behind does not come up as the top one leaves', "  if (done === 'leave') return 'leave';\n", ''],
  [SCREEN, 'a card of the fan is raised by a drag', "if (k !== peek) return 'rest';", "if (k !== peek) return 'drag';"],
  // The screen's wiring.
  [DECK, 'the swap mark opens no sheet', "if (sheet) setSwap(sheet); else say('Nothing to swap here');", "if (!sheet) say('Nothing to swap here');"],
  [DECK, 'a pick does not draw the day again', '    if (!r) return;\n    redraw();\n    say(r.toast);', '    if (!r) return;\n    say(r.toast);'],
  [DECK, 'a pick raises no toast', '    if (!r) return;\n    redraw();\n    say(r.toast);', '    if (!r) return;\n    redraw();'],
  [DECK, 'put it back does not draw the day again', '    if (!toast) return;\n    redraw();\n    say(toast);\n  }\n  /** A skip punches', '    if (!toast) return;\n    say(toast);\n  }\n  /** A skip punches'],
  [DECK, 'the sheet opens with a field still holding the keyboard', '  function openSwap(secIdx: number, itemIdx: number): void {\n    leave();\n', '  function openSwap(secIdx: number, itemIdx: number): void {\n'],
  [DECK, 'the words wear an opacity of their own again', '            <View style={s.face}>\n', '            <View style={[s.face, { opacity: k === i ? 1 : 0 }]}>\n'],
  [SHEET, 'a second tap on a row picks again', '    if (leaving.current) return;\n    leaving.current = true;', '    leaving.current = true;'],
  [SHEET, 'a row picks nothing', 'onPress={() => leave(() => onPick(r.name))}', 'onPress={() => leave()}'],
  [SHEET, 'the sheet stays under Reduce Motion', 'if (calm) { onClose(); return; }', 'if (calm) return;'],
];

/** The files run in the copy: per file, how many tests failed (a file that could not load counts as failed whole). */
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
  say.push('# The Expo deck\'s swap sheet: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-deck-swap_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-deck-swap_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-deck-swap_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
