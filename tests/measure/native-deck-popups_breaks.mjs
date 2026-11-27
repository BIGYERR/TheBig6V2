// native-deck-popups: when one rule of the Expo app's pop-ups is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the lines and who
// may draw one, of what a day marked done raises, of the reminder and its answer (frontends/native/src/pop-up/
// pop-ups.ts), of the nudge's two answers (deck/deck-writes.ts), of a model's copy, or of the screens' wiring
// (pop-up/PopUp.tsx, swap-nudge/SwapNudge.tsx, App.tsx, deck/Deck.tsx, this-week/ThisWeek.tsx). The files that hold
// the pop-ups are run on each, the ten-program sweep among them, and the files and tests that turn red are counted.
// A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-deck-popups_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-deck-popups_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-deck-popups_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-deck-popups_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-deck-popups_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-deck-popups_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FILES = ['unit/native-pop-ups.test.ts', 'integration/native-pop-ups.test.ts', 'sweeps/native-pop-ups.test.ts', 'unit/native-deck-logging.test.ts', 'integration/native-deck-logging.test.ts', 'integration/native-deck-swap.test.ts', 'unit/native-deck.test.ts', 'unit/native-shell.test.ts'];
const POPS = 'frontends/native/src/pop-up/pop-ups.ts', WRITES = 'frontends/native/src/deck/deck-writes.ts', CARD = 'frontends/native/src/pop-up/PopUp.tsx', NUDGE = 'frontends/native/src/swap-nudge/SwapNudge.tsx';
const APP = 'frontends/native/src/App.tsx', DECK = 'frontends/native/src/deck/Deck.tsx', WEEK = 'frontends/native/src/this-week/ThisWeek.tsx';
const MODEL = 'frontends/native/src/pop-up/pop-up-model.ts', NMODEL = 'frontends/native/src/swap-nudge/swap-nudge-model.ts';

/**
 * [the file, the rule broken, the text it replaces (once in the file), its replacement]. A rule the code keeps in two
 * places is broken in both: its third entry is then a list of [text, replacement] pairs.
 */
const BREAKS = [
  // The lines, and who may draw one.
  [POPS, 'a line of the reminder\'s pool reads otherwise', '"Yo, you ghosted a session. Mark it or own the skip.",', '"You ghosted a session. Mark it or own the skip.",'],
  [POPS, 'the workout pop-up drops 70 pieces of confetti', 'confetti:72', 'confetti:70'],
  [POPS, 'the button\'s words are drawn afresh at every pop-up', "  if (st.date === today && typeof st.idx === 'number' && POP_DISMISS[st.idx]) return POP_DISMISS[st.idx]!;\n", ''],
  [POPS, 'the button\'s words may be yesterday\'s again', 'while (POP_DISMISS.length > 1 && i === st.idx);', 'while (i < 0);'],
  [POPS, 'the button\'s words are not kept', "  try { s.store.set(key, JSON.stringify({ date: today, idx: i })); } catch { /* a full store keeps the line */ }\n", ''],
  [POPS, 'the day is stamped with leading zeros', "return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();", "return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');"],
  [POPS, 'a weekend is read off the clock, not the trained day', 'const dow = dt.getDay();', 'const dow = now.getDay();'],
  [POPS, 'a morning is any day marked before nine', 'morning: (now.getHours() < 9 && dt.getTime() === today.getTime()),', 'morning: (now.getHours() < 9),'],
  [POPS, 'a day with a run is not read as cardio', 'cardio: !!day!.cardio,', 'cardio: false,'],
  [POPS, 'a mobility block counts as lifting', " && !/mobility|taper/i.test(x.label || '')", ''],
  [POPS, 'a tagged line is drawn on a day that cannot be read', '  if (!ctx || !ctx.known) return false;\n', ''],
  [POPS, 'a weekend\'s line is drawn on any day', "  if (when === 'weekend' && !ctx.weekend) return false;\n", ''],
  [POPS, 'a morning\'s line is drawn at any hour', "  if (when === 'morning' && !ctx.morning) return false;\n", ''],
  [POPS, 'a cardio line is drawn on a day with no run', "  if (type === 'cardio' && !ctx.cardio) return false;\n", ''],
  [POPS, 'a lift line is drawn on a day with no lift', "  if (type === 'lift' && !ctx.lift) return false;\n", ''],
  [POPS, 'the tier\'s last line may be drawn again', 'let choices = elig.filter((i) => i !== last); if (!choices.length) choices = elig;', 'let choices = elig; if (!choices.length) choices = elig;'],
  [POPS, 'the pick is not kept', "  mem[tier] = i; try { s.store.set(memKey, JSON.stringify(mem)); } catch { /* a full store keeps the line */ }\n", ''],
  // What a day marked done raises.
  [POPS, 'the workout pop-up\'s streak carries no flame', "l: 'Day Streak ' + asyIcon('🔥', 12), cls: 'streak' },", "l: 'Day Streak', cls: 'streak' },"],
  [POPS, 'the workout pop-up forgets the trained day', "return { tier: 'workout', opts: { week, dayKey, stats: [", "return { tier: 'workout', opts: { stats: ["],
  [POPS, 'the streak under the workout line counts tomorrow too', "    { n: String(computeStreak(s.store, s.prog, s.prog.id, midnight(now))), l:", "    { n: String(computeStreak(s.store, s.prog, s.prog.id, new Date(midnight(now).getTime() + 3 * 86400000))), l:"],
  [POPS, 'a streak of five is a milestone', 'return n === 3 || n === 7', 'return n === 3 || n === 5 || n === 7'],
  [POPS, 'a streak of sixty is not a milestone', '|| (n > 30 && n % 30 === 0); }', '; }'],
  [POPS, 'the streak pop-up\'s kicker reads otherwise', "kicker: streak + '-day streak 🔥',", "kicker: streak + ' day streak 🔥',"],
  [POPS, 'the workout line stands where a milestone would', '  if (streakMilestone(streak)) return fireStreakPopup(streak);\n', ''],
  [POPS, 'the season is raised every time the last day is marked', 'if (f && f.week === week && f.d === dayKey && !seasonShown(s)) {', 'if (f && f.week === week && f.d === dayKey) {'],
  [POPS, 'the season\'s mark is not stored', '    markSeasonShown(s);\n', ''],
  [POPS, 'the season counts a skip as a workout', "if (st === 'complete' || st === 'partial') n++; });", 'n++; });'],
  [POPS, 'the season counts no skip', "if ((v?.status) === 'skipped') n++; });", 'void v; });'],
  // The reminder and its answer.
  [POPS, 'the reminder asks more than once a calendar day', '  if (s.store.get(lastKey) === todayStamp(now)) return null; // once per calendar day\n', ''],
  [POPS, 'the reminder asks about today', 'const days = scheduledDays(s.prog, today).filter((x) => x.date < today); // strictly past', 'const days = scheduledDays(s.prog, today); // strictly past'],
  [POPS, 'the reminder walks on past a marked day (D240)', '    if (statusOf(s, x.week, x.d)) break;               // already resolved\n', '    if (statusOf(s, x.week, x.d)) continue;               // already resolved\n'],
  [POPS, 'the reminder asks again about a day already asked about', '    if (rem[dayStoreKey(x.week, x.d)]) continue;       // already reminded\n', ''],
  [POPS, 'the reminder\'s day is not stored', '  s.store.set(lastKey, todayStamp(now));\n', ''],
  [POPS, 'the day asked about is not marked as asked', '  markReminded(s, target.week, target.d);\n', ''],
  [POPS, 'the long gap begins at six days', 'const _remMsg = _gap >= 7', 'const _remMsg = _gap >= 6'],
  [POPS, 'the long gap keeps the doctrine tail', "sub: _gap >= 7 ? _remSub : _remSub + '. The week ahead stays as written.',", "sub: _remSub + '. The week ahead stays as written.',"],
  [POPS, 'the reminder\'s sub line reads otherwise', "', Wk ' + target.week", "', Week ' + target.week"],
  [POPS, 'the reminder\'s Done button reads otherwise', "label: '✓ Done'", "label: 'Done'"],
  [POPS, 'the reminder\'s Skip button carries Done\'s handler', "onclick: `resolveReminder(${target.week},'${target.d}','${esc}','skipped')`", "onclick: `resolveReminder(${target.week},'${target.d}','${esc}','complete')`"],
  [POPS, 'a title\'s apostrophe is not escaped in the handler code', "(day.title || 'Workout').replace(/'/g, \"\\\\'\")", "(day.title || 'Workout')"],
  [POPS, 'the answer does not snapshot the day', '    if (s.prog && s.prog.weeks && week && dayKey) recordDaySnapshot(s.store, s.prog.id, week, dayKey, (s.prog.weeks[week] && s.prog.weeks[week]![dayKey]) as unknown as Day | null | undefined);\n', ''],
  [POPS, 'the answer leaves the day\'s skipped parts (D284)', '  clearDayParts(s.store, s.prog.id, week, dayKey);\n', ''],
  [POPS, 'the answer stores no title', 'title || null, status, now);', 'null, status, now);'],
  [POPS, 'the answer does not mark the day as asked', '  markReminded(s, week, dayKey);\n', ''],
  [POPS, 'Done\'s toast reads otherwise', "complete: 'Locked in ✓'", "complete: 'Done ✓'"],
  [POPS, 'Skip\'s toast reads otherwise', "skipped: 'Skipped ✕ — the week moves on'", "skipped: 'Skipped ✕'"],
  // The nudge's two answers.
  [WRITES, 'a swap never says the nudge is due', 'const nudge = wild ? false : !!countSwap(s.store, s.prog.id, from, to);', 'countSwap(s.store, s.prog.id, from, to);\n  const nudge = false;'],
  [WRITES, 'the nudge\'s words name no job', 'return nudgeText(from, to, _pattern(from));', 'return nudgeText(from, to, null);'],
  [WRITES, 'Leave the plan alone does not mark the pair offered', '  if (s.prog && s.prog.id) markSwapNudged(s.store, s.prog.id, from);\n', ''],
  [WRITES, 'Make the change writes the preference the wrong way round', 'recordSwapPreference(s.store, s.prog.id, from, to);', 'recordSwapPreference(s.store, s.prog.id, to, from);'],
  [WRITES, 'Make the change does not mark the pair offered', '      markSwapNudged(s.store, s.prog.id, from);\n', ''],
  [WRITES, 'Make the change hands back the program as stored, not rebuilt', 'prog = refreshStoredProgram(s.store, stored as unknown as StoredProgram, now, failed) as unknown as DeckProgram;', 'prog = stored as unknown as DeckProgram;'],
  [WRITES, 'Make the change\'s toast names no job', "' is your ' + nudgeSlot(_pattern(from)) + ' from here.'", "' is yours from here.'"],
  // The models' copies.
  [MODEL, 'the copy of today\'s pop-up model drifts', "const sub = o.sub || '';", "const sub = o.sub || ' ';"],
  [NMODEL, 'the copy of today\'s nudge model drifts', "'That is three sessions running you have traded '", "'That is three times running you have traded '"],
  // The screens' wiring.
  [CARD, 'the card\'s brand reads otherwise', '>The Asylum<', '>Iron Asylum<'],
  [CARD, 'the card comes in over half a second', 'duration: 280, easing: Easing.bezier(0.34, 1.56, 0.64, 1)', 'duration: 500, easing: Easing.bezier(0.34, 1.56, 0.64, 1)'],
  [CARD, 'the card comes in under Reduce Motion', 'const card = useRef(new Animated.Value(calm ? 1 : 0)).current;', 'const card = useRef(new Animated.Value(0)).current;'],
  [CARD, 'the confetti is not in the page\'s colours', 'confetti(view.confetti, Math.random, POP_KNICKS)', "confetti(view.confetti, Math.random, ['#ffffff'])"],
  [CARD, 'a button of the card does nothing', 'onPress={() => onAct(k)}', 'onPress={() => {}}'],
  [CARD, 'a tap on the scrim does not close the card', 'onPress={onClose} style={StyleSheet.absoluteFill}', 'style={StyleSheet.absoluteFill}'],
  [CARD, 'the reminder\'s two buttons stand one over the other', "const triple = view.actionsClass.includes('triple');", 'const triple = false;'],
  [NUDGE, 'the nudge\'s head reads otherwise', '>Noticed something<', '>Heads up<'],
  [NUDGE, 'Make the change leaves the plan alone', 'onPress={onYes}', 'onPress={onNo}'],
  [NUDGE, 'Leave the plan alone does nothing', 'onPress={onNo} style', 'onPress={() => {}} style'],
  [APP, 'the reminder is raised at once at a launch', '    }, 600));', '    }, 0));'],
  [APP, 'the reminder is never raised', '      if (ask) raise(s, popOf(s, ask.call, now, Math.random), ask);\n', '      void ask;\n'],
  [APP, 'the reminder\'s Done raises no completion pop-up', '    if (done) timers.current.push(setTimeout(() => complete(was.s, ask.week, ask.dayKey), 380));\n', ''],
  [APP, 'the reminder\'s Skip is stored as Done', "done ? 'complete' : 'skipped', Date.now()", "'complete', Date.now()"],
  [APP, 'the reminder\'s second button is its Done', 'const done = index === 0, ask = was.ask;', 'const done = index === 1, ask = was.ask;'],
  [APP, 'Mark the day done raises no pop-up', 'setDeck(null); complete({ store: phoneStore, prog } as unknown as PopSession, week, dayKey);', 'setDeck(null); void prog; void week; void dayKey;'],
  [APP, 'the pop-up is drawn under the toast', [["      {toast && <Toast key={'toast' + toast.n} text={toast.text} icon={toast.icon} palette={p} bottom={96 + insets.bottom} onDone={() => setToast((t) => (t && t.n === toast.n ? null : t))} />}\n", ""], ["      {pop && <PopUp key={'pop' + pop.n} palette={p} view={pop.view} calm={calm} onAct={answer} onClose={() => setPop(null)} />}\n", "      {pop && <PopUp key={'pop' + pop.n} palette={p} view={pop.view} calm={calm} onAct={answer} onClose={() => setPop(null)} />}\n      {toast && <Toast key={'toast' + toast.n} text={toast.text} icon={toast.icon} palette={p} bottom={96 + insets.bottom} onDone={() => setToast((t) => (t && t.n === toast.n ? null : t))} />}\n"]]],
  [APP, 'the completion pop-up\'s line is not drawn from the real draw', 'raise(s, popOf(s, fireCompletionPopup(s, week, dayKey, now), now, Math.random), null);', 'raise(s, popOf(s, fireCompletionPopup(s, week, dayKey, now), now, () => 0), null);'],
  [DECK, 'the nudge is raised at once after the pick', 'later(() => setNudge({ from, to }), 1400);', 'later(() => setNudge({ from, to }), 0);'],
  [DECK, 'the nudge is never raised', '    if (r.nudge) later(() => setNudge({ from, to }), 1400);\n', ''],
  [DECK, 'the nudge is not handed to the app to draw', "    onOver(nudge ? <SwapNudge palette={p} text={nudgeWords(nudge.from, nudge.to)} calm={calm} onYes={changePlan} onNo={leavePlan} /> : null);\n", '    onOver(null);\n'],
  [DECK, 'Leave the plan alone stores nothing', '    if (nudge) dismissNudge(session, nudge.from);\n', ''],
  [DECK, 'Make the change keeps the old program in the deck', '      setProg(r.prog);\n', ''],
  [DECK, 'Make the change does not hand the program to This Week', '      onProgram(r.prog);\n', ''],
  [DECK, 'Make the change does not draw the day again', '      redraw(r.prog);\n', ''],
  [DECK, 'Make the change raises no toast', '      redraw(r.prog);\n    }\n    say(r.toast);', '      redraw(r.prog);\n    }'],
  [DECK, 'Mark the day done closes with the toast and no pop-up', '    onDone(prog, open.week, open.dayKey);\n', "    onClose();\n    say('Done ✓');\n"],
  [WEEK, 'This Week does not tell the app of a launch', '  useEffect(() => { onLaunch(launched.prog as unknown as DeckProgram | null); }, [launched]);\n', ''],
  [WEEK, 'This Week keeps the launch\'s program after Make the change', 'const prog = held && launched.prog && held.id === launched.prog.id ? (held as unknown as typeof launched.prog) : launched.prog;', 'const prog = launched.prog;'],
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
  say.push('# The Expo app\'s pop-ups: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-deck-popups_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-deck-popups_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-deck-popups_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
