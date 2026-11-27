// native-random-workout: when one rule of the Expo app's Random Workout is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the draw, the
// cards' reads or the counter (frontends/native/src/random-workout/random-screen.ts), of Complete, its pop-up or the
// reset (random-writes.ts), of the Wildcard source of the deck's writes (deck/deck-writes.ts, deck-swaps.ts), of what
// a day's open leaves behind (deck/deck-screen.ts, day-detail/sheet-screen.ts), of a file that is today's own
// (random-workout-model.ts, random-pools.ts), or of the screens' drawing and wiring (RandomWorkout.tsx, ThisWeek.tsx,
// SessionSheet.tsx, App.tsx). The fast files are run on each, and the ten program sweep only on a break they let
// through; the files and tests that turn red are counted. A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-random-workout_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-random-workout_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-random-workout_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-random-workout_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-random-workout_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-random-workout_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-random-workout.test.ts', 'integration/native-random-workout.test.ts'];
const SLOW = ['sweeps/native-random-workout.test.ts'];
const N = 'frontends/native/src/';
const RS = N + 'random-workout/random-screen.ts', RW = N + 'random-workout/random-writes.ts', MODEL = N + 'random-workout/random-workout-model.ts', POOLS = N + 'random-workout/random-pools.ts';
const RWX = N + 'random-workout/RandomWorkout.tsx', DW = N + 'deck/deck-writes.ts', DS = N + 'deck/deck-swaps.ts', DSC = N + 'deck/deck-screen.ts';
const SS = N + 'day-detail/sheet-screen.ts', SHEET = N + 'day-detail/SessionSheet.tsx', WEEK = N + 'this-week/ThisWeek.tsx', APP = N + 'App.tsx';

const ORIGIN = "const hit = (wild.swaps || []).filter((e) => e && e.to === name).pop();";
const READS = "const reads = deckReads(store, inUnit(prog, hand), week, hand.dayKey as string, nowMs, hand.warn);";
const SESSION = "return { store, prog, week, dayKey: hand.dayKey || '', label: hand.unit };";
const COUNTER = "return randCount(prog ? readWildcardDone(store, prog.id) : [], RAND_POOLS, goalOf(prog));";
const DIFF = "const diff = Math.round((d.getTime() - mon.getTime()) / 86400000);";
const PUSH = "if (!done.some((d) => d.title === title)) done.push({ title, ts: now.getTime(), week: slot ? slot.week : null, dayKey: slot ? slot.dayKey : null });";
const TRAIN = "return { toast: title + ' logged ✓', isTraining: !!(day && !day.rest) };";
const SUB = "sub: isTraining ? 'Streak: ' + computeStreak(store, prog as DatedProgram, prog.id, midnight(now)) + '.' : 'Streak holds.',";
const SKIP_DAY = "function skipMove(s: Session, name: string, off: boolean, wild?: WildDay | null): string | null {\n  const day = wild || dayOf(s);";
const ROUND_DAY = "function skipRound(s: Session, secIdx: number, off: boolean, wild?: WildDay | null): string | null {\n  const day = wild || dayOf(s);";
const SWAP_DAY = "  if (!ctx || !s.prog || !s.prog.id) return null;\n  const day = wild || dayOf(s);";
const UNDO_DAY = "  if (!s.prog || !s.prog.id) return null;\n  const day = wild || dayOf(s);";
const KEEP = "if (wild) wild.swaps.push({ from, to, rx: undoRx });";
const DROP = "if (wild) wild.swaps = (wild.swaps || []).filter((e) => e && e.from !== from);";
const HAND0 = "export const newDayInHand = (): DayInHand => ({ dayKey: null, unit: 'lbs', warn: { shown: false, src: '' } });";
const WARN_SHEET = "const warn: StaleWarn = hand ? openedDay(hand, prog, dayKey) : { shown: false, src: '' };";

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  // ── The draw (random-screen.ts) ──
  [RS, "the filter starts on See All", "({ filter: 'mine', lastIdx: -1 })", "({ filter: 'all', lastIdx: -1 })"],
  [RS, "the last draw starts on the first workout", "({ filter: 'mine', lastIdx: -1 })", "({ filter: 'mine', lastIdx: 0 })"],
  [RS, "a program with no goal draws from strength", "(prog && prog.goal) || 'balanced'", "(prog && prog.goal) || 'strength'"],
  [RS, "the draw forgets the filter", "const pool = randPool(RAND_POOLS, goal, st.filter);", "const pool = randPool(RAND_POOLS, goal, 'mine');"],
  [RS, "the draw may land on the last one", "const idx = randDraw(pool.length, st.lastIdx, random);", "const idx = randDraw(pool.length, -1, random);"],
  [RS, "the draw's index is not kept", "  st.lastIdx = idx;\n", ""],
  [RS, "the working day is the pool's own sections", "sections: JSON.parse(JSON.stringify(w.sections || [])) as ExSection[], swaps: []", "sections: (w.sections || []) as ExSection[], swaps: []"],
  [RS, "the head is read against no record", "head: randView(w, readWildcardDone(store, prog.id), goal)", "head: randView(w, [], goal)"],
  [RS, "the head's badge is the balanced goal's", "head: randView(w, readWildcardDone(store, prog.id), goal)", "head: randView(w, readWildcardDone(store, prog.id), 'balanced')"],
  [RS, "a fresh draw's cards are read a day late", "return { ...o, sections: wildSections(store, prog, hand, week, o.wild, nowMs) };", "return { ...o, sections: wildSections(store, prog, hand, week, o.wild, nowMs + 86400000 * 30) };"],
  // ── The cards' reads (random-screen.ts) ──
  [RS, "the swap chip names the oldest swap", ORIGIN, "const hit = (wild.swaps || []).filter((e) => e && e.to === name)[0];"],
  [RS, "the swap chip reads the lift swapped out", ORIGIN, "const hit = (wild.swaps || []).filter((e) => e && e.from === name).pop();"],
  [RS, "the swap chip names the lift swapped in", "return (hit && hit.from) || null;", "return (hit && hit.to) || null;"],
  [RS, "a card is read in the program's unit", "return { ...prog, cfg: { ...(prog.cfg || {}), unit: hand.unit } };", "return { ...prog, cfg: { ...(prog.cfg || {}) } };"],
  [RS, "a set's load is turned by the program's unit", SESSION, "return { store, prog, week, dayKey: hand.dayKey || '' };"],
  [RS, "the load field is turned by the last opened day's unit", SESSION, "return { store, prog: inUnit(prog, hand), week, dayKey: hand.dayKey || '', label: hand.unit };"],
  [RS, "a tap with no day opened writes under no day at all", SESSION, "return { store, prog, week, dayKey: hand.dayKey as string, label: hand.unit };"],
  [RS, "a tap writes under Monday", SESSION, "return { store, prog, week, dayKey: 'mon', label: hand.unit };"],
  [RS, "a tap writes under the first week", SESSION, "return { store, prog, week: 1, dayKey: hand.dayKey || '', label: hand.unit };"],
  [DW, "a Wildcard's set loads are turned by the program's unit", "setsW = dispSets.map((x) => toStoreW(x, s.label ? s.label === 'kg' : kg));", "setsW = dispSets.map((x) => toStoreW(x, kg));"],
  [RS, "the cards start the stale warning afresh", READS, "const reads = deckReads(store, inUnit(prog, hand), week, hand.dayKey as string, nowMs);"],
  [RS, "the cards are read under no day", READS, "const reads = deckReads(store, inUnit(prog, hand), week, null as unknown as string, nowMs, hand.warn);"],
  [RS, "the cards are read under the first week", READS, "const reads = deckReads(store, inUnit(prog, hand), 1, hand.dayKey as string, nowMs, hand.warn);"],
  [RS, "the cards are read in the program's unit", READS, "const reads = deckReads(store, prog, week, hand.dayKey as string, nowMs, hand.warn);"],
  // Not a break: which section a card is handed. The two flags a card reads (canSwap, canSkip) read the move alone
  // since D248, so handing the program's section, or none, changes nothing a card draws (the first whole run let
  // "a section is read off the program's day" through on every file, and it was read as that).
  [RS, "the swap chip reads the program's records", "    swapOrigin: (n) => wildOrigin(wild, n),\n", ""],
  [RS, "the cards are drawn from the pool's workout", "return sectionsView(wild.sections, undefined, {", "return sectionsView((wild.w.sections || []) as ExSection[], undefined, {"],
  [RS, "the fields leave out a round's cards", "return sections.flatMap((sec) => (sec.kind === 'section' ? sec.body.items : []))", "return sections.flatMap((sec) => (sec.kind === 'section' && sec.body.kind === 'block' ? sec.body.items : []))"],
  // ── The counter and the words (random-screen.ts) ──
  [RS, "the counter reads the balanced pool", COUNTER, "return randCount(prog ? readWildcardDone(store, prog.id) : [], RAND_POOLS, 'balanced');"],
  [RS, "the counter reads no record", COUNTER, "return randCount([], RAND_POOLS, goalOf(prog));"],
  [RS, "the reset reads Reset", "reset: '↺ Reset',", "reset: 'Reset',"],
  [RS, "the reset asks with Again", "again: 'Tap again',", "again: 'Again',"],
  [RS, "the reset's label", "resetLabel: 'Reset wildcard counter',", "resetLabel: 'Reset',"],
  [RS, "the badge reads Random", "badge: 'Wildcard',", "badge: 'Random',"],
  [RS, "the done badge", "badgeDone: 'Done Before ✓',", "badgeDone: 'Done ✓',"],
  [RS, "the done block's words", "doneBlock: '✓ You\\'ve done this one before',", "doneBlock: 'Done before',"],
  [RS, "Complete's words", "complete: ' Complete — Mark Done',", "complete: ' Complete',"],
  [RS, "Complete's mark", "completeIcon: '✅',", "completeIcon: 'flame',"],
  [RS, "Back's words", "back: '← Back',", "back: 'Back',"],
  [RS, "the reset asks for five seconds", "export const RESET_ASK_MS = 3000;", "export const RESET_ASK_MS = 5000;"],
  // ── The day a Wildcard lands on (random-writes.ts) ──
  [RW, "a program with no start date has a day", "if (!g || !g.startDate || !g.weeks) return null;", "if (!g || !g.weeks) return null;"],
  [RW, "the day count is a day short", DIFF, "const diff = Math.round((d.getTime() - mon.getTime()) / 86400000) - 1;"],
  [RW, "the day count is not rounded", DIFF, "const diff = Math.floor((d.getTime() - mon.getTime()) / 86400000);"],
  [RW, "the day is read from the clock's hour", "const d = new Date(now); d.setHours(0, 0, 0, 0);", "const d = new Date(now);"],
  [RW, "the weeks are counted from zero", "const week = Math.floor(diff / 7) + 1;", "const week = Math.floor(diff / 7);"],
  [RW, "a day past the last week is stamped", "if (week < 1 || week > tw) return null;", "if (week < 1) return null;"],
  [RW, "a program's stated length is not read", "const tw = g.totalWeeks || Object.keys(g.weeks).length;", "const tw = Object.keys(g.weeks).length;"],
  [RW, "a program with no stated length has no days", "const tw = g.totalWeeks || Object.keys(g.weeks).length;", "const tw = g.totalWeeks || 0;"],
  [RW, "the week starts on a Sunday", "const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][diff % 7]!;", "const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][diff % 7]!;"],
  [RW, "a day the grid does not hold is stamped", "  if (!wk || !wk[dayKey]) return null;\n", "  if (!wk) return null;\n"],
  [RW, "a day before the start is stamped", "  if (dayBeforeStart(g, week, dayKey)) return null;\n", ""],
  // ── Complete, its pop-up and the reset (random-writes.ts) ──
  [RW, "the same title is stored twice", PUSH, PUSH.replace("if (!done.some((d) => d.title === title)) ", "")],
  [RW, "a title is never stored", PUSH, PUSH.replace("if (!done.some((d) => d.title === title)) ", "if (done.some((d) => d.title === title)) ")],
  [RW, "the record carries no day", PUSH, PUSH.replace("dayKey: slot ? slot.dayKey : null", "dayKey: null")],
  [RW, "the record carries no week", PUSH, PUSH.replace("week: slot ? slot.week : null", "week: null")],
  [RW, "the record carries no time", PUSH, PUSH.replace("ts: now.getTime()", "ts: 0")],
  [RW, "the record is stamped with the week's day swapped for its week", PUSH, PUSH.replace("week: slot ? slot.week : null, dayKey: slot ? slot.dayKey : null", "week: slot ? 1 : null, dayKey: slot ? slot.dayKey : null")],
  [RW, "Complete stores nothing", "  writeWildcardDone(store, prog.id, done);\n", ""],
  [RW, "the toast leaves out the title", TRAIN, TRAIN.replace("title + ' logged ✓'", "'Logged ✓'")],
  [RW, "a rest day is a training day", TRAIN, TRAIN.replace("!!(day && !day.rest)", "!!day")],
  [RW, "no day is a training day", TRAIN, TRAIN.replace("!!(day && !day.rest)", "false")],
  [RW, "a day off the calendar is a training day", TRAIN, TRAIN.replace("!!(day && !day.rest)", "!(day && day.rest)")],
  [RW, "the pop-up follows at once", "export const WILD_POP_MS = 380;", "export const WILD_POP_MS = 0;"],
  [RW, "the pop-up is a streak's", "return { tier: 'workout', opts: {", "return { tier: 'streak', opts: {"],
  [RW, "the pop-up's kicker", "kicker: 'Wildcard done',", "kicker: 'Workout done',"],
  [RW, "the pop-up's line", "msg: 'You showed up. That is the whole game.',", "msg: 'You showed up.',"],
  [RW, "a rest day names the streak", SUB, SUB.replace("sub: isTraining ?", "sub: true ?")],
  [RW, "a training day's streak only holds", SUB, SUB.replace("sub: isTraining ?", "sub: false ?")],
  [RW, "the streak reads without its full stop", SUB, SUB.replace("+ '.' : 'Streak holds.'", ": 'Streak holds.'")],
  [RW, "the reset leaves the record", "  writeWildcardDone(store, prog.id, []);\n", ""],
  [RW, "the reset's words", "return 'Wildcard counter reset ✓';", "return 'Reset ✓';"],
  // ── The Wildcard source of the deck's writes (deck-writes.ts, deck-swaps.ts) ──
  [DW, "a Wildcard's minus lands on the program's day", SKIP_DAY, SKIP_DAY.replace("wild || dayOf(s)", "dayOf(s)")],
  [DW, "a Wildcard's minus is stored", "  if (!wild) {\n    if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);", "  if (true) {\n    if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);"],
  [DW, "a Wildcard's round minus lands on the program's day", ROUND_DAY, ROUND_DAY.replace("wild || dayOf(s)", "dayOf(s)")],
  [DW, "a Wildcard's round minus is stored", "  if (!wild) {\n    if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, ssSkipToken(secIdx));", "  if (true) {\n    if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, ssSkipToken(secIdx));"],
  [DW, "a card's minus forgets the Wildcard", "if (a.kind === 'exercise') return skipMove(s, a.name, off, wild);", "if (a.kind === 'exercise') return skipMove(s, a.name, off);"],
  [DW, "a round's minus forgets the Wildcard", "if (a.kind === 'round') return skipRound(s, a.secIdx, off, wild);", "if (a.kind === 'round') return skipRound(s, a.secIdx, off);"],
  [DW, "a Wildcard's swap lands on the program's day", SWAP_DAY, SWAP_DAY.replace("wild || dayOf(s)", "dayOf(s)")],
  [DW, "a Wildcard's swap is recorded in the store", KEEP + "\n  else addSwapRecord(", "addSwapRecord("],
  [DW, "a Wildcard's swap keeps no record", KEEP, "if (wild) { /* nothing kept */ }"],
  [DW, "a Wildcard's swap keeps no places", KEEP, "if (wild) wild.swaps.push({ from, to, rx: [] });"],
  [DW, "a Wildcard's swap keeps its names the wrong way round", KEEP, "if (wild) wild.swaps.push({ from: to, to: from, rx: undoRx });"],
  [DW, "a Wildcard's swap is counted toward the nudge", "const nudge = wild ? false : !!countSwap(s.store, s.prog.id, from, to);", "const nudge = !!countSwap(s.store, s.prog.id, from, to);"],
  [DW, "a Wildcard's swap renews the day's snapshot", "  if (!wild) resnapshotDay(s);\n  const lead", "  resnapshotDay(s);\n  const lead"],
  [DW, "a Wildcard's put back lands on the program's day", UNDO_DAY, UNDO_DAY.replace("wild || dayOf(s)", "dayOf(s)")],
  [DW, "a Wildcard's put back reads the store's records", "const list = wild ? wild.swaps || [] : readSwaps(s.store, s.prog.id)['w' + s.week + '_' + s.dayKey] || [];", "const list = readSwaps(s.store, s.prog.id)['w' + s.week + '_' + s.dayKey] || [];"],
  [DW, "a Wildcard's put back leaves its record", DROP, "if (wild) { /* kept */ }"],
  [DW, "a Wildcard's put back drops every other record", DROP, DROP.replace("e.from !== from", "e.from === from")],
  [DW, "a Wildcard's put back renews the day's snapshot", DROP + "\n  else { dropSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from); resnapshotDay(s); }", DROP + "\n  else dropSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from);\n  resnapshotDay(s);"],
  [DS, "the Wildcard's swap sheet lists for no day", "  const day = on as SwapDay | null | undefined;\n", "  const day = null as SwapDay | null | undefined;\n  void on;\n"],
  // ── What a day's open leaves behind (deck-screen.ts, sheet-screen.ts) ──
  [DSC, "the app starts in kilograms", HAND0, HAND0.replace("unit: 'lbs'", "unit: 'kg'")],
  [DSC, "the app starts with the warning spoken", HAND0, HAND0.replace("shown: false", "shown: true")],
  [DSC, "the app starts on Monday", HAND0, HAND0.replace("dayKey: null", "dayKey: 'mon'")],
  [DSC, "an open keeps the warning spoken", "  hand.warn.shown = false;\n", ""],
  [DSC, "an open keeps the warning's program", "  hand.warn.src = '';\n", ""],
  [DSC, "an open sets pounds", "hand.unit = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';", "hand.unit = 'lbs';"],
  [DSC, "an open forgets its day", "  hand.dayKey = dayKey;\n  return hand.warn;", "  return hand.warn;"],
  [DSC, "an open hands back a warning of its own", "  hand.dayKey = dayKey;\n  return hand.warn;", "  hand.dayKey = dayKey;\n  return { shown: false, src: '' };"],
  [SS, "a sheet's draw leaves the app's day alone", WARN_SHEET, "const warn: StaleWarn = { shown: false, src: '' };\n  void hand; void openedDay;"],
  // ── Today's own files (random-workout-model.ts, random-pools.ts) ──
  [MODEL, "a filter's label in the copied model", "{ id: 'all', label: 'See All' },", "{ id: 'all', label: 'All' },"],
  [MODEL, "the copied model may repeat the last draw", "while (idx === last && length > 1);", "while (false);"],
  [POOLS, "a workout's title in the copied pools", "{title:'Heavy 5x5',", "{title:'Heavy 5×5',"],
  [POOLS, "a card's prescription in the copied pools", "{name:'Deadlift',detail:'Build to heavy single — 3–4 warm-up sets, max 2 attempts'}", "{name:'Deadlift',detail:'Build to heavy single'}"],
  // ── The screen's wiring (RandomWorkout.tsx) ──
  [RWX, "the screen's taps write under the program's own session", "const session: Session = wildSession(store, prog, hand, week);", "const session: Session = { store, prog, week, dayKey: '' };"],
  [RWX, "a minus forgets the working day", "const toast = act(session, a, off, open.wild);", "const toast = act(session, a, off);"],
  [RWX, "a pick forgets the working day", "const r = swapMove(session, swap.ctx, to, Date.now(), open.wild);", "const r = swapMove(session, swap.ctx, to, Date.now());"],
  [RWX, "a put back forgets the working day", "const toast = undoSwap(session, from, open.wild);", "const toast = undoSwap(session, from);"],
  [RWX, "the swap sheet opens on no day", "const sheet = swapSheetOn(prog, open.wild, secIdx, itemIdx);", "const sheet = swapSheetOn(prog, null, secIdx, itemIdx);"],
  [RWX, "the cards are drawn in pounds", "unit={hand.unit} h={h} gap={SECTION_GAP} />", "unit=\"lbs\" h={h} gap={SECTION_GAP} />"],
  [RWX, "the sections stand as close as the session sheet's", "unit={hand.unit} h={h} gap={SECTION_GAP} />", "unit={hand.unit} h={h} />"],
  [RWX, "the sections stand 2 apart", "const SECTION_GAP = 16;", "const SECTION_GAP = 2;"],
  [RWX, "a filter's tap keeps the old filter", "    st.filter = f;\n    const o = openRandom(", "    const o = openRandom("],
  [RWX, "the first tap of the reset empties the record", "    if (!reset.pending) {\n      reset.pending = true;", "    if (false) {\n      reset.pending = true;"],
  [RWX, "the reset says nothing", "    onWrote();\n    say(toast);", "    onWrote();"],
  [RWX, "the reset leaves the counter as drawn", "    onWrote();\n    say(toast);", "    say(toast);"],
  [RWX, "the reset's ask is taken back when the sheet goes", "setTimeout(() => { reset.pending = false; if (alive.current) setAsked((n) => n + 1); }, RESET_ASK_MS);", "const t = setTimeout(() => { reset.pending = false; if (alive.current) setAsked((n) => n + 1); }, RESET_ASK_MS); void t; clearTimeout(undefined);"],
  [RWX, "Complete says nothing", "      say(r.toast);\n      onComplete(r);", "      onComplete(r);"],
  [RWX, "Complete does not tell the app", "      say(r.toast);\n      onComplete(r);", "      say(r.toast);"],
  [RWX, "Complete is offered on a workout done before", "{v.done ? (", "{false ? ("],
  [RWX, "the badge never reads Done Before", "{v.done ? RAND_WORDS.badgeDone : RAND_WORDS.badge}", "{RAND_WORDS.badge}"],
  [RWX, "a redraw keeps the old fields", "    setSections(next);\n    apply(wildFields(next));", "    setSections(next);"],
  // ── The wiring around it (ThisWeek.tsx, SessionSheet.tsx, App.tsx) ──
  [WEEK, "the button asks for Traveling?", "onPress={() => onAsk({ kind: 'random' })}", "onPress={() => onAsk({ kind: 'travel' })}"],
  [WEEK, "the button's words stay on one line", "<Text style={[s.actionText, s.randomText, { color: p.text }]}>Random Workout</Text>", "<Text style={[s.actionText, { color: p.text }]}>Random Workout</Text>"],
  [WEEK, "the button's words stand at the left", "randomText: { flex: 1, textAlign: 'center', lineHeight: 19.85 },", "randomText: { flex: 1, lineHeight: 19.85 },"],
  [WEEK, "the counter reads no program", "{randCounter(store, prog as unknown as RandProgram | null)}", "{randCounter(store, null)}"],
  [WEEK, "a deck's open leaves the app's day alone", "const warn = openedDay(inHand, grid, key);", "const warn = { shown: false, src: '' };"],
  [WEEK, "a sheet opened from This Week leaves the app's day alone", "const view = sheetView(store, grid, week, key, Date.now(), inHand);", "const view = sheetView(store, grid, week, key, Date.now());"],
  [SHEET, "a sheet's redraw leaves the app's day alone", "const next = sheetView(store, g, open.week, open.dayKey, Date.now(), inHand);", "const next = sheetView(store, g, open.week, open.dayKey, Date.now());"],
  [APP, "Random Workout opens under the first week", "const prog = s.prog as unknown as RandProgram, week = hand.own || 1;", "const prog = s.prog as unknown as RandProgram, week = 1;"],
  [APP, "the pop-up reads every day as a rest day", "fireWildcardPopup(phoneStore, prog, r.isTraining, now)", "fireWildcardPopup(phoneStore, prog, false, now)"],
  [APP, "the pop-up is raised at once", "            }, WILD_POP_MS));", "            }, 0));"],
  [APP, "Complete leaves This Week as drawn", "            const prog = random.prog;\n            setWrites((n) => n + 1);", "            const prog = random.prog;"],
  [APP, "the reset leaves This Week's counter as drawn", "onWrote={() => setWrites((n) => n + 1)}", "onWrote={() => {}}"],
  [APP, "a switch keeps the day last opened", "onSwitch={() => { inHand.dayKey = null; go('week'); }}", "onSwitch={() => { go('week'); }}"],
  [APP, "the active program gone keeps the day last opened", " if (hand.prog && hand.prog.id === id) inHand.dayKey = null; }}", " }}"],
  [APP, "Generate keeps the day last opened", "            quiet.current = true;\n            inHand.dayKey = null;", "            quiet.current = true;"],
  [APP, "the filter is made anew at each draw of the app", "const randState = useRef(newRandState()).current;", "const randState = newRandState();"],
  [APP, "the day in hand is made anew at each draw of the app", "const inHand = useRef(newDayInHand()).current;", "const inHand = newDayInHand();"],
];

/** The files run in the copy: per file, how many tests failed (a file that could not load counts as failed whole). */
function run(files) {
  const out = join(tree, 'break-run.json');
  try { execFileSync('npx', ['vitest', 'run', ...files, '--reporter=json', '--outputFile=' + out], { cwd: TESTS, stdio: 'ignore' }); } catch { /* red is the point */ }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  if (r.testResults.length !== files.length) throw new Error('the copy ran ' + r.testResults.length + ' files of ' + files.length);
  const red = {};
  let tests = 0;
  for (const f of r.testResults) {
    const name = files.find((x) => f.name.endsWith(x));
    const failed = f.assertionResults.filter((t) => t.status !== 'passed' && t.status !== 'pending' && t.status !== 'skipped').length;
    const n = f.status !== 'passed' ? Math.max(failed, 1) : 0;
    tests += f.assertionResults.length;
    if (n) red[name] = n;
  }
  return { files: red, tests };
}

const line = (list) => list.map((f) => '`' + f + '`').join(', ');
/** The report from every break's row: [n, file, rule, {file: tests red}, whether the sweep was run]. */
function report(rows, clean) {
  const say = [];
  say.push('# The Expo app\'s Random Workout: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-random-workout_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
  say.push('');
  say.push('- The fast files, run on each break: ' + line(FAST) + '. Unbroken, they hold ' + clean.fast + ' tests and all pass.');
  say.push('- The sweep, run only on a break the fast files let through: ' + line(SLOW) + ' (' + clean.slow + ' tests, all passing unbroken).');
  say.push('');
  say.push('| # | File | The rule broken | Files red | Tests red | Which |');
  say.push('|---|---|---|---|---|---|');
  let missed = 0, swept = 0;
  for (const [n, file, rule, files, slow] of rows.sort((x, y) => x[0] - y[0])) {
    const names = Object.keys(files), tests = names.reduce((t, k) => t + files[k], 0);
    if (!names.length) missed++;
    if (slow) swept++;
    say.push('| ' + n + ' | `' + file.split('/').pop() + '` | ' + rule + ' | **' + names.length + '** | ' + tests + ' | ' + (names.map((k) => k.replace('.test.ts', '') + ' ' + files[k]).join(', ') || '**none: let through**') + (slow ? ' (the sweep was run)' : '') + ' |');
  }
  say.push('');
  say.push('- Breaks made: **' + rows.length + '** of ' + BREAKS.length + '. Let through by the fast files, so swept: ' + swept + '. Let through by every file: **' + missed + '**.');
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
  writeFileSync(join(HERE, 'native-random-workout_breaks.md'), say.join('\n') + '\n');
  console.log(say.slice(-1)[0]);
  process.exit(0);
}

// --check: the whole list read against this checkout, every text that is not in its file once named, nothing run.
if (checking) {
  const root = resolve(HERE, '..', '..');
  let bad = 0;
  BREAKS.forEach(([file, rule, from, to], i) => {
    const text = readFileSync(join(root, file), 'utf8');
    const times = text.split(from).length - 1;
    if (times !== 1) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + times + ' times, not once'); }
    else if (from === to) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its replacement is its own text'); }
  });
  const names = new Set(BREAKS.map((b) => b[1]));
  if (names.size !== BREAKS.length) { bad++; console.log('two breaks share a name'); }
  console.log(BREAKS.length + ' breaks read against this checkout, ' + bad + ' with a text not found once');
  process.exit(bad ? 1 : 0);
}

// Every break's text is in its file once, before anything is run.
BREAKS.forEach(([file, rule, from], i) => {
  const text = readFileSync(join(tree, file), 'utf8');
  if (text.split(from).length !== 2) throw new Error('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + (text.split(from).length - 1) + ' times, not once');
});
const cleanFast = run(FAST), cleanSlow = run(SLOW);
if (Object.keys(cleanFast.files).length || Object.keys(cleanSlow.files).length) throw new Error('the copy is red before any break: ' + JSON.stringify({ ...cleanFast.files, ...cleanSlow.files }));
const clean = { fast: cleanFast.tests, slow: cleanSlow.tests };
const rows = [];
let n = 0;
for (const [file, rule, from, to] of BREAKS) {
  n++;
  if (only && !rule.includes(only)) continue;
  if (part && (n - 1) % part[1] !== part[0]) continue;
  const path = join(tree, file), src = readFileSync(path, 'utf8');
  let r, slow = false;
  try {
    writeFileSync(path, src.replace(from, to));
    r = run(FAST);
    if (!Object.keys(r.files).length) { slow = true; r = run(SLOW); }
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files, slow]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files' + (slow ? ' (swept)' : ''));
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean, rows }));
const say = report(rows, clean);
if (!only && !part) writeFileSync(join(HERE, 'native-random-workout_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
