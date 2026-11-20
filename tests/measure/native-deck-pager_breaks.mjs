// native-deck-pager: when one rule of the Expo deck's double tap, its up and down pager or its opening out of the
// card is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the tap, of
// where a card stands up and down, of which drag the pager takes (frontends/native/src/deck/deck-screen.ts), of the
// opening's numbers (grow-motion.ts), or of the screens' wiring (Deck.tsx, DeckOpening.tsx, this-week/ThisWeek.tsx,
// App.tsx). The files that hold the deck's screen are run on each, and the files and tests that turn red are
// counted. A break no file turns red on is a rule no test holds.
//
// None of these rules stores anything, so the walks that hold every ia_ key equal to today's page are not run here:
// they are the integration and sweep files of native-deck-logging, native-deck-swap and native-pop-ups.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-deck-pager_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-deck-pager_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-deck-pager_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-deck-pager_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-deck-pager_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-deck-pager_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FILES = ['unit/native-deck.test.ts', 'unit/native-deck-logging.test.ts', 'unit/native-pop-ups.test.ts', 'unit/native-shell.test.ts', 'integration/native-deck.test.ts'];
const SCREEN = 'frontends/native/src/deck/deck-screen.ts', GROW = 'frontends/native/src/deck/grow-motion.ts';
const DECK = 'frontends/native/src/deck/Deck.tsx', OPEN = 'frontends/native/src/deck/DeckOpening.tsx';
const WEEK = 'frontends/native/src/this-week/ThisWeek.tsx', APP = 'frontends/native/src/App.tsx';

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  // The double tap.
  [SCREEN, 'a press that moved ten points is a tap', 'export const TAP_SLOP = 6;', 'export const TAP_SLOP = 10;'],
  [SCREEN, 'two taps a second apart turn the deck', 'export const DOUBLE_TAP = 320;', 'export const DOUBLE_TAP = 1000;'],
  [SCREEN, 'a tap is judged across only', 'return Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP;', 'return Math.abs(dx) < TAP_SLOP;'],
  [SCREEN, 'a turn keeps the clock, so a third tap turns the deck back', '? { turn: true, last: null }', '? { turn: true, last: now }'],
  [DECK, 'a tap is read while a card is on its way out', 'if (busy.current || !isTap(', 'if (!isTap('],
  [DECK, 'the deck opens up and down', 'const [vert, setVert] = useState(false);', 'const [vert, setVert] = useState(true);'],
  [DECK, 'a double tap turns the deck up and down and never back', 'setVert((v) => !v);', 'setVert(() => true);'],
  [DECK, 'the tap\'s clock is the date', 'tapped(lastTap.current, performance.now())', 'tapped(lastTap.current, Date.now())'],
  [DECK, 'a tap leaves the keyboard on its field', 'return;\n    leave();\n    const t = tapped(', 'return;\n    const t = tapped('],
  [DECK, 'the card\'s body is one element to a screen reader', 'accessible={false} style={{ flexGrow: 1,', 'style={{ flexGrow: 1,'],
  // Where a card stands up and down.
  [SCREEN, 'the card coming in stands a card height away with no gap', 'export const PAGER_GAP = 14;', 'export const PAGER_GAP = 0;'],
  [SCREEN, 'going back the card comes from below', 'return { y: (dy < 0 ? h + PAGER_GAP : -(h + PAGER_GAP)) + dy, shown: true };', 'return { y: h + PAGER_GAP + dy, shown: true };'],
  [SCREEN, 'the card coming in does not follow the finger', 'return { y: (dy < 0 ? h + PAGER_GAP : -(h + PAGER_GAP)) + dy, shown: true };', 'return { y: (dy < 0 ? h + PAGER_GAP : -(h + PAGER_GAP)), shown: true };'],
  [SCREEN, 'a fan is drawn up and down', 'if (k !== peek) return { y: 0, shown: false };', 'if (k !== peek) return { y: 0, shown: pos <= 3 };'],
  [SCREEN, 'one point of drag brings the next card in', 'Math.abs(dy) > 2 ? (top', 'Math.abs(dy) > 0 ? (top'],
  [SCREEN, 'a slot forgets the drag', 'return slots * (h + PAGER_GAP) + drag;', 'return slots * (h + PAGER_GAP);'],
  [SCREEN, 'up and down a card is covered', 'if (vert) return null;', "if (vert) return k === peek ? null : 'rest';"],
  [SCREEN, 'the card before stands two slots on, not one back', 'return o > n / 2 ? o - n : o;', 'return o;'],
  [SCREEN, 'a deck of two keeps its other card below whichever way the finger goes', 'if (n === 2) return two;', 'if (n === 2) return 1;'],
  [DECK, 'the stride is the stage alone', 'const stride = stageH + PAGER_GAP;', 'const stride = stageH;'],
  [DECK, 'every card stands on the top card\'s slot', 'pagerAt(slot + slotsFrom(k, i, n, dir))', 'pagerAt(slot)'],
  [DECK, 'a jump does not move the page', '        pageV.setValue(s);\n        setSlot(s);\n      }', '        setSlot(s);\n      }'],
  [DECK, 'a jump moves the page after a slide has', '      if (!slid.current) {', '      if (true) {'],
  [DECK, 'a slide does not say it has moved the page', '    slid.current = true;\n', ''],
  [DECK, 'a pull the other way draws the deck again', 'if (!vertNow.current || n === 2) setDir(d);', 'setDir(d);'],
  [DECK, 'up and down the stage keeps 20 points at its right', 'stageV: { marginRight: 34 },', 'stageV: { marginRight: 20 },'],
  [DECK, 'up and down the cards are not cut off at the stage\'s head and foot', "clipV: { overflow: 'hidden' },", 'clipV: {},'],
  [DECK, 'the dots stay in a row up and down', '{vert && <View testID="deck-dots" style={s.dotsV}>{dots}</View>}', '{vert && <View testID="deck-dots" style={s.dots}>{dots}</View>}'],
  [DECK, 'the lit dot is long across up and down', 'k === i && (vert ? { height: 22 } : { width: 22 })', 'k === i && { width: 22 }'],
  [DECK, 'up and down a card grows from its left foot', "transformOrigin: vert ? 'center bottom' : 'left bottom'", "transformOrigin: 'left bottom'"],
  // Which drag the pager takes, and the slide.
  [SCREEN, 'the pager pages at 80 points, not past them', 'return d < -line ? 1 : d > line ? -1 : 0;', 'return d <= -line ? 1 : d >= line ? -1 : 0;'],
  [SCREEN, 'the pager takes a drag of any length', 'if (Math.abs(dy) <= 8 || Math.abs(dy) <= Math.abs(dx) * 1.2) return false;', 'if (Math.abs(dy) <= Math.abs(dx) * 1.2) return false;'],
  [SCREEN, 'the pager takes a drag more across than down', 'if (Math.abs(dy) <= 8 || Math.abs(dy) <= Math.abs(dx) * 1.2) return false;', 'if (Math.abs(dy) <= 8) return false;'],
  [SCREEN, 'a tall body never scrolls first', 'return dy < 0 ? body.y >= body.max - 1 : body.y <= 1;', 'return true;'],
  [SCREEN, 'a tall body pages at the wrong end', 'return dy < 0 ? body.y >= body.max - 1 : body.y <= 1;', 'return dy > 0 ? body.y >= body.max - 1 : body.y <= 1;'],
  [SCREEN, 'a body two points taller than its box scrolls first', 'if (body.max <= 2) return true;', 'if (body.max <= 0) return true;'],
  [DECK, 'the pager does not ask the card\'s body', 'if (vertNow.current) return pagerTakes(g.dx, g.dy, bodyOf(topKey.current));', 'if (vertNow.current) return pagerTakes(g.dx, g.dy, { y: 0, max: 0 });'],
  [DECK, 'a body that fits its box scrolls and bounces up and down', 'scrollEnabled={!vert || !!tall[c.key] || keys} bounces={!vert}', 'scrollEnabled bounces'],
  [DECK, 'a body is tall as soon as it is taller', 'const is = b.box > 0 && b.content > b.box + 2;', 'const is = b.box > 0 && b.content > b.box;'],
  [DECK, 'the page slides on the fan\'s curve', 'Animated.timing(pageV, { toValue: slotNow.current + to, ...SETTLE_TOP,', 'Animated.timing(pageV, { toValue: slotNow.current + to, ...SETTLE_FAN,'],
  [DECK, 'the slide leaves the drag where it was let go', '      Animated.timing(dy, { toValue: 0, ...SETTLE_TOP, useNativeDriver: true }),\n    ]).start(() => {', '    ]).start(() => {'],
  [DECK, 'the slide does not move the deck on a slot', '      landed(slotNow.current + to);\n      go(at.current + to);', '      go(at.current + to);'],
  [DECK, 'the page is not said again where it came to rest', '    pageV.setValue(s);\n    setSlot(s);\n  };', '    setSlot(s);\n  };'],
  [DECK, 'the slide plays under Reduce Motion', '    if (calmNow.current) {\n      dy.setValue(0);\n      go(at.current + to);\n      return;\n    }\n    busy.current = true;', '    busy.current = true;'],
  [DECK, 'a press inside the slide is taken', '      return;\n    }\n    busy.current = true;\n    Animated.parallel([', '      return;\n    }\n    Animated.parallel(['],
  [DECK, 'a drag let go short stays where it is', 'else Animated.timing(dy, { toValue: 0, ...SETTLE_TOP, useNativeDriver: true }).start(rest);', 'else rest();'],
  [DECK, 'a dot eases its card in up and down', 'if (letGo !== undefined && !vertNow.current && !calmNow.current', 'if (letGo !== undefined && !calmNow.current'],
  // Done, next one, up and down.
  [DECK, 'up and down the card leaves in the tuck\'s first part', 'Animated.timing(pageV, { toValue: slotNow.current + 1, duration: PAGER_LEAVE,', 'Animated.timing(pageV, { toValue: slotNow.current + 1, duration: TUCK_OUT,'],
  [DECK, 'up and down the card leaving keeps its lift', '          Animated.timing(liftV, { toValue: 0, duration: PAGER_LEAVE, easing: TUCK, useNativeDriver: true }),\n', ''],
  [DECK, 'up and down the done motion does not move the deck on a slot', '          landed(slotNow.current + 1);\n          go(at.current + 1);', '          go(at.current + 1);'],
  [DECK, 'up and down the top card wears no lift', 'if (vert) return { zIndex: 20, transform: lifted };', 'if (vert) return { zIndex: 20, transform: [{ translateY: pagerAt(slot) }] };'],
  [DECK, 'up and down the glow stays on as the card leaves', '      later(() => {\n        glowV.setValue(0);', '      later(() => {'],
  [DECK, 'up and down the deck is drawn again as the card lifts', '      glowV.setValue(marking ? 1 : 0);\n', "      glowV.setValue(marking ? 1 : 0);\n      setDone({ phase: 'lift', glow: marking, tucked: false });\n"],
  [DECK, 'up and down the glow is not a layer of its own', '{vert && top && <Animated.View testID="deck-glow"', '{false && top && <Animated.View testID="deck-glow"'],
  [DECK, 'sideways the lift is kept after the card has gone', '          busy.current = false;\n          liftV.setValue(0);\n          setDone(null);', '          busy.current = false;\n          setDone(null);'],
  // The deck of two cards, sideways.
  [DECK, 'a deck of two: the card behind rises by the way the finger goes', '(peek - i + n) % n === 1 ?', 'dir > 0 ?'],
  // The opening's numbers.
  [GROW, 'the card lifts by 20 points', 'lifted: { t: o.t - 10, l: o.l - 8, w: o.w + 16, h: o.h + 20, r: 28 },', 'lifted: { t: o.t - 20, l: o.l - 8, w: o.w + 16, h: o.h + 40, r: 28 },'],
  [GROW, 'the card\'s corners stay 24 as it lifts', 'h: o.h + 20, r: 28 },', 'h: o.h + 20, r: 24 },'],
  [GROW, 'the scrim lifts to 55% at once', "step('scrim', 0.3, M.lift, 'ease'),", "step('scrim', 0.55, M.lift, 'ease'),"],
  [GROW, 'the copy does not grow as it lifts', "step('copyScale', 1.04, M.lift, 'lift'),", "step('copyScale', 1, M.lift, 'lift'),"],
  [GROW, 'This Week keeps its size under the deck', "step('week', 0.96, M.open, 'open'),", "step('week', 1, M.open, 'open'),"],
  [GROW, 'the deck fades in with no wait', "step('deckFade', 1, M.deckFadeIn, 'ease', M.deckFadeDelay),", "step('deckFade', 1, M.deckFadeIn, 'ease'),"],
  [GROW, 'the copy comes back at once as the deck closes', "step('copyFade', 1, M.copyBackTo - M.copyBackFrom, 'ease', M.copyBackFrom),", "step('copyFade', 1, M.copyBackTo - M.copyBackFrom, 'ease'),"],
  [GROW, 'the close runs at the open\'s speed', "step('shut', 1, M.close, 'close'),", "step('shut', 1, M.open, 'close'),"],
  [GROW, 'the deck keeps its size as it closes', "step('deckScale', 0.94, M.close, 'close'),", "step('deckScale', 1, M.close, 'close'),"],
  [GROW, 'the deck starts at full size', 'copyFill: 0, deckFade: 0, deckScale: 0.94 };', 'copyFill: 0, deckFade: 0, deckScale: 1 };'],
  [GROW, 'every curve is CSS ease', "if (ease === 'ease') return [0.25, 0.1, 0.25, 1];", 'if (ease) return [0.25, 0.1, 0.25, 1];'],
  [GROW, 'the frame\'s box is handed to the phone to move', "['frame', 'shut', 'copyFill'];", "['copyFill'];"],
  // The opening's screens.
  [OPEN, 'the lift starts on the first frame', 'requestAnimationFrame(() => requestAnimationFrame(lift))', 'requestAnimationFrame(lift)'],
  [OPEN, 'the lift does not wait for the frame to be on the screen', 'onLayout={drawn} ', ''],
  [OPEN, 'the deck is drawn again at every stage', '), [palette, store, open, onProgram, onOver, say]);', '), [palette, store, open, onProgram, onOver, say, stage]);'],
  [OPEN, 'a close begins while the deck opens', "if (stageNow.current !== 'open') return;", "if (stageNow.current === 'out') return;"],
  [OPEN, 'Back takes the deck away before it closes', 'onClose={() => way.current.close(way.current.onClose)}', 'onClose={() => way.current.onClose()}'],
  [OPEN, 'the pop-up does not wait for the close', 'onDone={(prog, week, dayKey) => way.current.close(() => way.current.onDone(prog, week, dayKey))}', 'onDone={(prog, week, dayKey) => way.current.onDone(prog, week, dayKey)}'],
  [OPEN, 'the opening plays under Reduce Motion', 'useState(!calm && !!from)', 'useState(!!from)'],
  [OPEN, 'the deck takes a press while it opens', "pointerEvents={stage === 'open' ? 'auto' : 'none'}", 'pointerEvents="auto"'],
  [OPEN, 'the copy stays over the open deck', "{stage !== 'open' && (", '{true && ('],
  [OPEN, 'the close leaves the keyboard up', '    Keyboard.dismiss();\n', ''],
  [OPEN, 'the close goes by way of the lift', "const shut = stage === 'out';", 'const shut = false;'],
  [OPEN, 'the opening moves no part of This Week', '  v.week = under;\n', ''],
  [DECK, 'the deck paints a ground of its own', 'style={[StyleSheet.absoluteFill, { paddingTop:', 'style={[StyleSheet.absoluteFill, { backgroundColor: p.bg, paddingTop:'],
  [WEEK, 'the copy keeps its button', '{bt && !copy && (', '{bt && ('],
  [WEEK, 'the copy keeps its skip pill', '{k.skip && !copy && (', '{k.skip && ('],
  [WEEK, 'the copy keeps a card\'s ground', "backgroundColor: copy ? 'transparent' : off ? p.cardOff : p.surface", 'backgroundColor: off ? p.cardOff : p.surface'],
  [WEEK, 'Start hands on no place for the card', 'w > 0 && h > 0 ? { box: { t: y, l: x, w, h }, card: k } : null', 'null'],
  [APP, 'This Week wears no size under the deck', 'transform: [{ scale: under }]', 'transform: []'],
  [APP, 'the app forgets the card the deck opens out of', 'onDeck={(open, from) => setDeck({ open, from })}', 'onDeck={(open) => setDeck({ open, from: null })}'],
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
  say.push('# The Expo deck\'s double tap, pager and opening: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-deck-pager_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-deck-pager_breaks.md'), say.join('\n') + '\n');
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
  if (src.split(from).length !== 2) throw new Error('break ' + n + ' (' + rule + '): its text is in ' + file + ' ' + (src.split(from).length - 1) + ' times, not once');
  let r;
  try {
    writeFileSync(path, src.replace(from, to));
    r = run();
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files');
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean: clean.tests, rows }));
const say = report(rows, clean.tests);
if (!only && !part) writeFileSync(join(HERE, 'native-deck-pager_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
