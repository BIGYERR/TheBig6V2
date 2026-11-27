// native-progress: when one rule of the Expo app's Progress is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the page's
// readers ported with the screen (frontends/native/src/progress/progress-readers.ts: the Lift Ledger's rows, the easy
// zone's runs, the short first week), of what is kept between draws and of the view (progress-screen.ts), of the
// three writes (progress-writes.ts), of the paint (paint.ts), of a model's copy, or of the screens' wiring and words
// (Progress.tsx, ChartCards.tsx, SvgPicture.tsx, App.tsx). The fast files are run on each; the ten-program sweep is
// run only on a break the fast files let through. A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-progress_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-progress_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-progress_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-progress_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-progress_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-progress_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-progress.test.ts', 'integration/native-progress.test.ts', 'unit/native-cardio-sheet.test.ts'];
const SLOW = ['sweeps/native-progress.test.ts'];
const P = 'frontends/native/src/progress/';
const READ = P + 'progress-readers.ts', SCREEN = P + 'progress-screen.ts', WRITES = P + 'progress-writes.ts', PAINT = P + 'paint.ts';
const PROG = P + 'Progress.tsx', CARDS = P + 'ChartCards.tsx', PIC = P + 'SvgPicture.tsx', APP = 'frontends/native/src/App.tsx';
const MARKUP = P + 'card-markup.ts';
const MODEL = P + 'progress-model.ts', CHIPS = P + 'program-chips-model.ts';
const DOT = P + 'charts/dot-chart-model.ts', CARD = P + 'charts/chart-card-model.ts', LEDGER = P + 'charts/ledger-model.ts', RUN = P + 'charts/run-charts-model.ts';

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  [READ, "any lift of a Main section is the main lift", "if (isMain && ii === 0) seen = 'main';", "if (isMain) seen = 'main';"],
  [READ, "a section named Main is not read as one", "const isMain = /^main/i.test(sec.label || '');", "const isMain = /^primary/i.test(sec.label || '');"],
  [READ, "a later accessory set unmakes the main slot", "else if (seen !== 'main') seen = 'accessory';", "else seen = 'accessory';"],
  [READ, "the slot is read off the other lifts of the card", "      if (exStoreKey(it.name) !== key) return;\n", "      if (exStoreKey(it.name) === key) return;\n"],
  [READ, "the slot is read off Monday's card whatever the day", "hist['w' + en.week + '_' + en.day];\n  if (!snap || !snap.sections) return null;\n  const key = exStoreKey(name);\n  let seen", "hist['w' + en.week + '_mon'];\n  if (!snap || !snap.sections) return null;\n  const key = exStoreKey(name);\n  let seen"],
  [READ, "a range whose top is its bottom counts as a range", "if (!(hi > lo)) return null;", "if (!(hi >= lo)) return null;"],
  [READ, "the range is the first item's of the day", "if (it && it.name && exStoreKey(it.name) === key && !det) det = it.detail || '';", "if (it && it.name && !det) det = it.detail || '';"],
  [READ, "a set of no reps is kept", "const out = sd.map(Number).filter((v) => v > 0);", "const out = sd.map(Number).filter((v) => v >= 0);"],
  [READ, "an entry with no reps done has no sets", "  return m ? [+m[1]!] : [];\n}\n\n// v0.249.0", "  return [];\n}\n\n// v0.249.0"],
  [READ, "the Romanian deadlift keeps a block of its own", ", 'Barbell Romanian deadlift': 'RDL' };", " };"],
  [READ, "the heaviest hinge set loses its tag", "heavy = { ...m.heavy, tag: t };", "heavy = { ...m.heavy };"],
  [READ, "the opening hinge set loses its tag", "first = { ...m.first, tag: t };", "first = { ...m.first };"],
  [READ, "a tie in load goes to the later week", "if (!heavy || m.heavy.v > heavy.v || (m.heavy.v === heavy.v && m.heavy.week < heavy.week)) heavy", "if (!heavy || m.heavy.v > heavy.v) heavy"],
  [READ, "the opening hinge set is the first stored, not the first week's", "if (!first || m.first.week < first.week) first", "if (!first) first"],
  [READ, "the Deadlift line is in the store's order", ".sort((a, b) => a.w - b.w);\n  const sum", ";\n  const sum"],
  [READ, "the Deadlift block forgets its accessory days", "plotted: sum('plotted'), accessoryDay: sum('accessoryDay'),", "plotted: sum('plotted'), accessoryDay: 0,"],
  [READ, "the Deadlift block counts one hinge's entries", "noLoad: sum('noLoad'), entries: sum('entries') }]);", "noLoad: sum('noLoad'), entries: hinge[0]!.entries }]);"],
  [READ, "an unloaded hinge is folded into the load line", "mains.filter((m) => m.mode === 'load' && Object.prototype.hasOwnProperty.call(HINGE_TAG, m.name));", "mains.filter((m) => Object.prototype.hasOwnProperty.call(HINGE_TAG, m.name));"],
  [READ, "the Deadlift block is named for its first hinge", "concat([{ name: 'Deadlift', mode: 'load', series,", "concat([{ name: hinge[0]!.name, mode: 'load', series,"],
  [READ, "any day on the card makes a main session", "const mainEns = all.filter((en) => slotOfEntry(hist, name, en) === 'main');", "const mainEns = all.filter((en) => slotOfEntry(hist, name, en) !== null);"],
  [READ, "a blank load is plotted", "const loaded = mainEns.filter((en) => +en.weight! > 0);", "const loaded = mainEns;"],
  [READ, "accessory days are not counted off the line", "const accessoryDay = all.length - mainEns.length;", "const accessoryDay = 0;"],
  [READ, "the lightest set heads a main lift", "(+b.weight! > +a.weight! ? b : a), loaded[0]!);", "(+b.weight! < +a.weight! ? b : a), loaded[0]!);"],
  [READ, "a main lift opens at its last session", "        const first = loaded[0]!;\n", "        const first = loaded[loaded.length - 1]!;\n"],
  [READ, "the top set is the last set, not the best", "return s.length ? Math.max.apply(null, s) : 0; };", "return s.length ? s[s.length - 1]! : 0; };"],
  [READ, "sessions with no load are not counted", "noLoad: mainEns.length - loaded.length, entries: all.length });", "noLoad: 0, entries: all.length });"],
  [READ, "an unloaded main lift is charted as a load", "mains.push({ name, mode: 'reps', series:", "mains.push({ name, mode: 'load', series:"],
  [READ, "a reps block heads with its first session", "(topOf(b) > topOf(a) ? b : a), repEns[0]!);", "(topOf(b) > topOf(a) ? a : b), repEns[0]!);"],
  [READ, "an unloaded lift counts no reps", "reps: all.reduce((s, en) => s + setsOf(en).reduce((a, b) => a + b, 0), 0) }); return; }", "reps: 0 }); return; }"],
  [READ, "the range is the last session's alone", "for (let i = all.length - 1; i >= 0 && !rng; i--) rng = rxRangeFor(hist, name, all[i]);", "rng = rxRangeFor(hist, name, last);"],
  [READ, "one set at the top is ready", "ready: sets.length > 0 && sets.every((r) => r >= hi),", "ready: sets.length > 0 && sets.some((r) => r >= hi),"],
  [READ, "a held weight counts as a step up", "if (prev !== null && w > prev) ups++;", "if (prev !== null && w >= prev) ups++;"],
  [READ, "the ladder's weight is the first session's", "    const wt = +last.weight! || 0;\n", "    const wt = +all[0]!.weight! || 0;\n"],
  [READ, "a lift's lightest load counts a blank as zero", ".filter((v) => v > 0).concat([wt])),", ".concat([wt])),"],
  [READ, "the longest line goes last", ".sort((a, b) => b.series.length - a.series.length);", ".sort((a, b) => a.series.length - b.series.length);"],
  [READ, "the ready lifts are not put first", "ladder.sort((a, b) => (b.ready ? 1 : 0) - (a.ready ? 1 : 0) || b.sessions - a.sessions);", "ladder.sort((a, b) => b.sessions - a.sessions);"],
  [READ, "a lift's entries are read in the store's order", ".slice().sort((a, b) => (a.week - b.week) || ((a.ts || 0) - (b.ts || 0)));\n    if (!all.length) return;", ".slice();\n    if (!all.length) return;"],
  [READ, "the other lifts are in the store's order", "  plain.sort((a, b) => b.sessions - a.sessions);\n", ""],
  [READ, "a run credited to another sport is placed", "if (!e || !e.run_pace || e.swapTo) return;", "if (!e || !e.run_pace) return;"],
  [READ, "a run past the program's last week is placed", "if (!(w >= 1 && w <= totalWeeks)) return;", "if (!(w >= 1)) return;"],
  [READ, "a ride is placed as a run", "    if (String(c.type || '').toLowerCase() !== 'run') return;\n", ""],
  [READ, "an easy run is not placed", "if (cls !== 'Recovery' && cls !== 'Easy') return;", "if (cls !== 'Recovery') return;"],
  [READ, "a run with no target is placed", "    if (!tgt) return;                                  // no anchor -> excluded\n", ""],
  [READ, "slower than the ceiling is hot", "hot: sec < cap! });", "hot: sec > cap! });"],
  [READ, "the frozen ceiling is not read", "const cap = (+d.cap! > 0) ? +d.cap! : steadyCeilingFor(tgt);", "const cap = steadyCeilingFor(tgt);"],
  [READ, "below the table the recovery pace is not clamped", "if (recSec <= rows[0]!.recovery) { tempo = rows[0]!.tempo; rec = rows[0]!.recovery; }", "if (recSec <= rows[0]!.recovery) { tempo = rows[0]!.tempo; }"],
  [READ, "above the table the tempo is the first row's", "{ tempo = rows[rows.length - 1]!.tempo; rec = rows[rows.length - 1]!.recovery; }", "{ tempo = rows[0]!.tempo; rec = rows[rows.length - 1]!.recovery; }"],
  [READ, "between rows the tempo is not read across", "tempo = a.tempo + f * (b.tempo - a.tempo);", "tempo = a.tempo;"],
  [READ, "the ceiling is the tempo alone", "return Math.round((tempo + rec) / 2);", "return Math.round(tempo);"],
  [READ, "the placed runs are in the store's order", "  runs.sort((a, b) => a.w - b.w);\n", ""],
  [READ, "a Monday start is a short first week", "return getWeekMonday(prog.startDate).getTime() !== sd.getTime();", "return getWeekMonday(prog.startDate).getTime() === sd.getTime();"],
  [READ, "the easy effort gate is five runs", "export const EASY_MIN_RUNS = 6;", "export const EASY_MIN_RUNS = 5;"],
  [READ, "the zone chart's gate is three runs", "export const EASY_ZONE_MIN_RUNS = 4;", "export const EASY_ZONE_MIN_RUNS = 3;"],
  [READ, "a half marathon is 13 miles", "run_half: 13.1,", "run_half: 13,"],
  [SCREEN, "the tab opens with the delete still armed", "{ st.confirmId = null; st.confirmTier = 0; st.viewId = null; }", "{ st.viewId = null; }"],
  [SCREEN, "the tab opens on the program last shown", "{ st.confirmId = null; st.confirmTier = 0; st.viewId = null; }", "{ st.confirmId = null; st.confirmTier = 0; }"],
  [SCREEN, "the trash arms the first tier", "{ st.confirmId = id; st.confirmTier = 2; }", "{ st.confirmId = id; st.confirmTier = 1; }"],
  [SCREEN, "Cancel leaves the tier armed", "export function cancelConfirm(st: ProgressState): void { st.confirmId = null; st.confirmTier = 0; }", "export function cancelConfirm(st: ProgressState): void { st.confirmId = null; }"],
  [SCREEN, "after the delete the view keeps the deleted program", " if (st.viewId === id) st.viewId = null; }", " }"],
  [SCREEN, "after the delete the view lets go of any program", " if (st.viewId === id) st.viewId = null; }", " st.viewId = null; }"],
  [SCREEN, "the estimator opens on Squat", "calcLift: 'Deadlift' }; }", "calcLift: 'Squat' }; }"],
  [SCREEN, "a chip shows nothing", "export function showProgram(st: ProgressState, id: string): void { st.viewId = id; }", "export function showProgram(st: ProgressState, id: string): void { void id; }"],
  [SCREEN, "the estimator's lift is not kept", "export function setCalcLift(st: ProgressState, lift: string): void { st.calcLift = lift; }", "export function setCalcLift(st: ProgressState, lift: string): void { void lift; }"],
  [SCREEN, "no program is the active one", "  const activeId = active ? active.id : null;\n", "  const activeId = null as string | null;\n"],
  [SCREEN, "the screen opens on the first live program, not the active one", "viewedProgram(all, st.viewId, activeId, !!active);", "viewedProgram(all, st.viewId, activeId, false);"],
  [SCREEN, "a view id that names no program is kept", "  if (reset) st.viewId = null;\n", ""],
  [SCREEN, "the delete never warns of the loads", "warnsCrossProg: (id) => liftLogFeedsOthers(store, id),", "warnsCrossProg: () => false,"],
  [SCREEN, "the bar never shows the confirmation", "activeId, confirmId: st.confirmId, confirmTier: st.confirmTier,", "activeId, confirmId: st.confirmId, confirmTier: 0,"],
  [SCREEN, "the open does not clean the lift log", "  cleanLiftLog(store, vid);\n", ""],
  [SCREEN, "a program with no length is read as twelve weeks", "const totalWeeks = prog.totalWeeks || 6;", "const totalWeeks = prog.totalWeeks || 12;"],
  [SCREEN, "nothing logged still shows the estimator", "empty: 'none', charts: [], journal: null, estimator: false };", "empty: 'none', charts: [], journal: null, estimator: true };"],
  [SCREEN, "nothing logged reads the second empty state", "return { vid, chips, empty: 'none', charts: [],", "return { vid, chips, empty: 'charts', charts: [],"],
  [SCREEN, "the week in progress is not held back", "    cut: progressCutWeek(prog as never, now),\n", "    cut: 0,\n"],
  [SCREEN, "a short first week is not left out", "    skip1: partialWeek1(prog),\n", "    skip1: false,\n"],
  [SCREEN, "the ladder has no race line", "    raceMi: RACE_DIST_MI[goalId] || 0,\n", "    raceMi: 0,\n"],
  [SCREEN, "no program has a sport", "    cardioTypes: cfg.cardioTypes || [],\n", "    cardioTypes: [],\n"],
  [SCREEN, "the charts read no history", "logs: logs as unknown as Record<string, DayLog>, hist, sums, totalWeeks, cfg,", "logs: logs as unknown as Record<string, DayLog>, hist: {}, sums, totalWeeks, cfg,"],
  [SCREEN, "the ladder ignores the held back week", "ladderWeekly: (l, tw, cut, skip1) => longestRunByWeek(L(l), tw, cut, skip1),", "ladderWeekly: (l, tw, _cut, skip1) => longestRunByWeek(L(l), tw, 0, skip1),"],
  [SCREEN, "the zone chart is handed no runs", "easyVsPrescribed: (l, h, tw) => easyVsPrescribed(l as never, h as Hist, tw),", "easyVsPrescribed: () => [],"],
  [SCREEN, "the easy bands are handed the easy effort's runs", "runsByClass: (l, h, tw) => runPacesByClass(L(l), H(h), tw),", "runsByClass: () => ({}),"],
  [SCREEN, "the easy effort chart is handed the recovery trend", "easyEffortWeekly: (l, h, tw) => easyPaceByWeek(L(l), H(h), tw),", "easyEffortWeekly: (l, h, tw) => ({ ...recoveryPaceByWeek(L(l), H(h), tw), nRuns: 0 }),"],
  [SCREEN, "the recovery trend is handed no weeks", "recoveryPaceWeekly: (l, h, tw) => recoveryPaceByWeek(L(l), H(h), tw),", "recoveryPaceWeekly: () => ({ weekly: {}, tgt: null, nWeeks: 0 }),"],
  [SCREEN, "the drift counts the short first week", "plannedVsLogged: (l, h, tw, cut, skip1) => plannedAndLoggedMiles(L(l), H(h), tw, cut, skip1),", "plannedVsLogged: (l, h, tw, cut) => plannedAndLoggedMiles(L(l), H(h), tw, cut, false),"],
  [SCREEN, "the ledger reads an empty lift log", "    exWeights: () => readLiftLog(store, vid),\n", "    exWeights: () => ({}),\n"],
  [SCREEN, "the ledger reads no frozen card", "ledgerModel: (exw, h) => ledgerModel(exw as LedgerLog, h as Hist),", "ledgerModel: (exw) => ledgerModel(exw as LedgerLog, {} as Hist),"],
  [SCREEN, "a pace is printed as seconds", "      pace: (sec) => _clkMS(sec),\n", "      pace: (sec) => String(sec),\n"],
  [SCREEN, "the mile is the recovery pace itself", "mileFromRecovery: (sec) => mileFromRecoveryPace(sec),", "mileFromRecovery: (sec) => sec,"],
  [SCREEN, "the half is the mile itself", "halfFromMile: (sec) => halfFromMilePace(sec),", "halfFromMile: (sec) => sec,"],
  [SCREEN, "the easy band starts at RPE 1", "      easyRpeLo: EASY_RPE_LO,\n", "      easyRpeLo: 1,\n"],
  [SCREEN, "the easy band ends at RPE 9", "      easyRpeHi: EASY_RPE_HI,\n", "      easyRpeHi: 9,\n"],
  [SCREEN, "one easy run is enough for the chart", "      easyMinRuns: EASY_MIN_RUNS,\n", "      easyMinRuns: 1,\n"],
  [SCREEN, "one run is enough for the zone chart", "      easyZoneMinRuns: EASY_ZONE_MIN_RUNS,\n", "      easyZoneMinRuns: 1,\n"],
  [SCREEN, "the journal names no effort", "    rpeLabel: (r) => RPE_LABELS[r],\n", "    rpeLabel: () => undefined,\n"],
  [SCREEN, "the journal shows no jog", "    jogLines: (rl) => restLogLines(rl),\n", "    jogLines: () => [],\n"],
  [SCREEN, "an empty journal is drawn", "const journal = weeks.length ? weeks : null;", "const journal = weeks;"],
  [SCREEN, "a journal alone still reads the empty state", "c.view.other) && !journal ? 'charts' : null;", "c.view.other) ? 'charts' : null;"],
  [SCREEN, "a ledger with rows still reads the empty state", "!charts.some((c) => c.kind !== 'ledger' || c.view.mains || c.view.ladder || c.view.other)", "!charts.some((c) => c.kind !== 'ledger')"],
  [SCREEN, "the estimator is hidden once logs exist", "return { vid, chips, empty, charts, journal, estimator: true };", "return { vid, chips, empty, charts, journal, estimator: false };"],
  [SCREEN, "the logs shown are the active program's", "  const logs = readDayLogs(store, vid);\n", "  const logs = readDayLogs(store, activeId);\n"],
  [SCREEN, "the journal is the active program's", "journalWeeks(readDayLogs(store, vid) as unknown", "journalWeeks(readDayLogs(store, activeId) as unknown"],
  [SCREEN, "the history read is the active program's", "  const hist = readDayHistory(store, vid);\n", "  const hist = readDayHistory(store, activeId);\n"],
  [SCREEN, "the estimate is always said in pounds", "return (active && active.cfg && active.cfg.unit) || 'lbs';", "return 'lbs';"],
  [SCREEN, "the estimate always names the deadlift", "'Estimated ' + st.calcLift + ' 1RM: '", "'Estimated Deadlift 1RM: '"],
  [SCREEN, "the estimate's unit is always pounds", "+ est + ' ' + unit, rest:", "+ est + ' lbs', rest:"],
  [SCREEN, "an estimate with a number missing still draws", "  if (est === null) return null;\n", "  if (est === null) return { bold: '', rest: ' ' };\n"],
  [SCREEN, "the estimate's closing words are dropped", "rest: ' — for your reference; the app coaches by RPE.' };", "rest: '' };"],
  [SCREEN, "an ampersand in a note is drawn as its entity", ".replace(/&#39;/g, \"'\").replace(/&amp;/g, '&');", ".replace(/&#39;/g, \"'\");"],
  [SCREEN, "an angle bracket in a note is drawn as its entity", ".replace(/&lt;/g, '<').replace(/&gt;/g, '>')", ""],
  [SCREEN, "a title keeps the space after its icon", "text: m ? text.replace(/^ /, '') : text };", "text: text };"],
  [SCREEN, "a title's icon is dropped", "return { icon: m ? m[1]! : null,", "return { icon: null,"],
  [SCREEN, "run card: the run cards are in the view and not drawn", "DRAWN: readonly ChartBlock['kind'][] = ['dot', 'card', 'ledger'];", "DRAWN: readonly ChartBlock['kind'][] = ['dot', 'ledger'];"],
  [MODEL, "the model's copy: the estimate rounds to the nearest ten", "return r === 1 ? w : Math.round((w * (1 + r / 30)) / 5) * 5;", "return r === 1 ? w : Math.round((w * (1 + r / 30)) / 10) * 10;"],
  [CHIPS, "the model's copy: archived programs come before live ones", "(p.id === c.activeId ? 0 : p.archived ? 2 : 1)", "(p.id === c.activeId ? 0 : p.archived ? 1 : 2)"],
  [DOT, "the model's copy: the dot chart is 130 tall", "const W = 320, H = 120,", "const W = 320, H = 130,"],
  [CARD, "the model's copy: a card's title sits 10 above", "    titleGap: 12,\n", "    titleGap: 10,\n"],
  [LEDGER, "the model's copy: kilograms to the nearest whole", "Math.round(w * 0.453592 * 2) / 2", "Math.round(w * 0.453592)"],
  [RUN, "the model's copy: the bands' footer loses a word", "The two bars should not touch.", "The bars should not touch."],
  [WRITES, "Restore leaves the archive date", "delete p.archived; delete p.archivedAt;", "delete p.archived;"],
  [WRITES, "Restore leaves the program archived", "delete p.archived; delete p.archivedAt;", "delete p.archivedAt;"],
  [WRITES, "Restore is not saved", "  writePrograms(store, programs as never);\n  return 'Program restored';", "  return 'Program restored';"],
  [WRITES, "Restore's toast reads Restored", "return 'Program restored';", "return 'Restored';"],
  [WRITES, "Restore of a program that is gone says it restored", "  if (!p) return null;\n", "  if (!p) return 'Program restored';\n"],
  [WRITES, "Delete Forever saves the list after the keys go", "  programs = programs.filter((p) => p.id !== id); writePrograms(store, programs as never);\n  if (readActiveProgramId(store) === id) pickActive(store);\n  PURGE_FAMILIES.forEach((p) => store.remove(p + id));\n", "  programs = programs.filter((p) => p.id !== id);\n  if (readActiveProgramId(store) === id) pickActive(store);\n  PURGE_FAMILIES.forEach((p) => store.remove(p + id));\n  writePrograms(store, programs as never);\n"],
  [WRITES, "Delete Forever leaves the program in the list", "programs = programs.filter((p) => p.id !== id); writePrograms", "writePrograms"],
  [WRITES, "Delete Forever leaves the day logs", "['ia_logs_', 'ia_comp_',", "['ia_comp_',"],
  [WRITES, "Delete Forever leaves the lift log", "'ia_wild_', 'ia_exw_', 'ia_moves_',", "'ia_wild_', 'ia_moves_',"],
  [WRITES, "Delete Forever leaves the frozen days", "'ia_parts_', 'ia_hist_', 'ia_wild_',", "'ia_parts_', 'ia_wild_',"],
  [WRITES, "Delete Forever leaves the last reminder", "'ia_reminded_', 'ia_remind_last_'] as const;", "'ia_reminded_'] as const;"],
  [WRITES, "Delete Forever removes the done days before the logs", "['ia_logs_', 'ia_comp_', 'ia_parts_',", "['ia_comp_', 'ia_logs_', 'ia_parts_',"],
  [WRITES, "Delete Forever removes every program's keys of a family", "PURGE_FAMILIES.forEach((p) => store.remove(p + id));", "PURGE_FAMILIES.forEach((p) => store.keys().filter((k) => k.startsWith(p)).forEach((k) => store.remove(k)));"],
  [WRITES, "a pointer on the deleted program is left dangling", "  if (readActiveProgramId(store) === id) pickActive(store);\n", ""],
  [WRITES, "Delete Forever's toast reads Deleted", "return 'Program deleted';", "return 'Deleted';"],
  [WRITES, "the open always writes the lift log", "  if (folded || deduped) writeLiftLog(store, programId, exw);\n", "  writeLiftLog(store, programId, exw);\n"],
  [WRITES, "the open never writes the lift log", "  if (folded || deduped) writeLiftLog(store, programId, exw);\n", "  void folded; void deduped;\n"],
  [WRITES, "a fold alone is not saved", "if (folded || deduped) writeLiftLog", "if (deduped) writeLiftLog"],
  [WRITES, "the open does not fold the old keys", "const folded = foldExAliasKeys(exw as never);", "const folded = false;"],
  [WRITES, "the open does not drop a same day pair", "const deduped = dedupeExDayEntries(exw);", "const deduped = false;"],
  [WRITES, "the pair is dropped before the fold makes it", "  const folded = foldExAliasKeys(exw as never);\n  const deduped = dedupeExDayEntries(exw);\n", "  const deduped = dedupeExDayEntries(exw);\n  const folded = foldExAliasKeys(exw as never);\n"],
  [PAINT, "a tint loses its strength", "'rgba(' + rgb + ',' + tint[2] + ')'", "'rgba(' + rgb + ',1)'"],
  [PAINT, "a token with a dash is not found", ".replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase());", ";"],
  [PAINT, "a token the palette lacks is handed on as written", "  return typeof v === 'string' ? v : p.muted;\n}\n\nconst NAMES", "  return typeof v === 'string' ? v : css;\n}\n\nconst NAMES"],
  [PAINT, "a plain colour reads as muted", "  if (!token) return css;\n", "  if (!token) return p.muted;\n"],
  [PAINT, "a text's anchor keeps the web's name", " 'text-anchor': 'textAnchor',", ""],
  [PAINT, "a line's width keeps the web's name", "  'stroke-width': 'strokeWidth',", " "],
  [PAINT, "a text keeps the web's list of faces", "    if (k === 'font-family') { out['fontFamily'] = face; continue; }\n", ""],
  [PAINT, "an empty weight is handed on", "    if (k === 'font-weight' && !v) continue;\n", ""],
  [PAINT, "a stroke is not painted", "k === 'fill' || k === 'stroke' ?", "k === 'fill' ?"],
  [PAINT, "a fixed picture is clipped at its edge", "export const OVERFLOW = 6;", "export const OVERFLOW = 0;"],
  [PAINT, "a fixed picture is drawn at its height's scale", "const scale = Math.min(width / w, height / h),", "const scale = height / h,"],
  [PAINT, "a full width picture stands on its side", "const ratio = (w + 2 * OVERFLOW) / (h + 2 * OVERFLOW),", "const ratio = (h + 2 * OVERFLOW) / (w + 2 * OVERFLOW),"],
  [PAINT, "a fixed picture is not put back in place", "margin: -grow,", "margin: 0,"],
  [PAINT, "a fixed picture keeps the page's viewBox", "  return { viewBox: grown, width: width + 2 * grow,", "  return { viewBox, width: width + 2 * grow,"],
  [APP, "a tap on the Progress tab does not open the screen afresh", "    if (t === 'progress') setProgressTaps((n) => n + 1);\n", ""],
  [APP, "what Progress keeps is lost at each redraw of the app", "const progress = useRef(newProgressState()).current;", "const progress = newProgressState();"],
  [APP, "the Progress screen is not opened anew by its tab", "<Progress key={'progress' + progressTaps} palette={p}", "<Progress palette={p}"],
  [APP, "the Progress tab is after Bugs", "        <TabButton id=\"tab-progress\" label=\"Progress\" on={tab === 'progress'} palette={p} onPress={() => go('progress')} icon={(c) => <Bars color={c} />} />\n", ""],
  [APP, "the Progress tab opens Bugs", ": tab === 'progress' ? <Progress", ": tab === 'week' ? <Progress"],
  [PROG, "a chip does not redraw", "show: (id: string): void => { showProgram(st, id); redraw(); },", "show: (id: string): void => { showProgram(st, id); },"],
  [PROG, "Restore raises no toast", "redraw(); if (toast) say(toast); },", "redraw(); },"],
  [PROG, "Restore does not redraw", "const toast = restoreProgram(store, id); redraw(); if (toast)", "const toast = restoreProgram(store, id); if (toast)"],
  [PROG, "after Delete Forever the confirmation stays", "afterDelete(st, id); redraw(); say(toast); },", "redraw(); say(toast); },"],
  [PROG, "Delete Forever raises no toast", "afterDelete(st, id); redraw(); say(toast); },", "afterDelete(st, id); redraw(); },"],
  [PROG, "Cancel stands nothing down", "cancel: (): void => { cancelConfirm(st); redraw(); },", "cancel: (): void => { redraw(); },"],
  [PROG, "the trash arms nothing", "askPurge: (id: string): void => { askPurge(st, id); redraw(); },", "askPurge: (id: string): void => { redraw(); },"],
  [PROG, "Delete Forever is wired to Cancel", "onPress={() => on.purge(b.id)}", "onPress={on.cancel}"],
  [PROG, "Restore is wired to the delete", "onPress={() => on.restore(b.id)}", "onPress={() => on.purge(b.id)}"],
  [PROG, "the trash deletes at once", "onPress={() => on.askPurge(b.id)}", "onPress={() => on.purge(b.id)}"],
  [PROG, "a chip is wired to nothing", "onPress={() => on.show(c.id)}", "onPress={() => {}}"],
  [PROG, "the screen opens as it was left", "useState(() => { openProgress(st); return {", "useState(() => { return {"],
  [PROG, "a draw keeps the last body", "<ScrollView key={drawn.n} testID=\"progress-body\"", "<ScrollView testID=\"progress-body\""],
  [PROG, "every journal week opens unfolded", "weeks.map((w) => [w.week, w.open])", "weeks.map((w) => [w.week, true])"],
  [PROG, "the estimator opens unfolded", "  const [open, setOpen] = useState(false);\n  const [lift, setLift] = useState(st.calcLift);", "  const [open, setOpen] = useState(true);\n  const [lift, setLift] = useState(st.calcLift);"],
  [PROG, "the estimator opens on Deadlift whatever was picked", "const [lift, setLift] = useState(st.calcLift);", "const [lift, setLift] = useState('Deadlift');"],
  [PROG, "a picked lift is forgotten at the next visit", "onPress={() => { setCalcLift(st, n); setLift(n); }}", "onPress={() => { setLift(n); }}"],
  [PROG, "the estimate is drawn from numbers of its own", "const line = estimateLine(st, weight, reps, unit);", "const line = estimateLine(st, reps, weight, unit);"],
  [PROG, "the estimator is said in pounds whatever the program", "<Estimator palette={p} state={st} unit={estimatorUnit(store)} />", "<Estimator palette={p} state={st} unit=\"lbs\" />"],
  [PROG, "every chart in the view is handed to a drawer", "v.charts.filter((c) => DRAWN.includes(c.kind)).map(", "v.charts.map("],
  [PROG, "the confirmation always warns of the loads", "{b.warn && <Text style={{ color: p.muted }}>", "{<Text style={{ color: p.muted }}>"],
  [PROG, "the first empty sentence is the second's", "{v.empty === 'none' ? 'Start logging", "{v.empty !== 'none' ? 'Start logging"],
  [PROG, "the confirmation names no program", "for “' + b.name + '”. It cannot be undone.'", "for this program. It cannot be undone.'"],
  [PROG, "the empty state reads Nothing yet", ">No data yet</Text>", ">Nothing yet</Text>"],
  [PROG, "the archived bar loses its words", ">This program is archived — history only.</Text>", ">Archived.</Text>"],
  [PROG, "Restore reads Bring back", ">Restore</Text>", ">Bring back</Text>"],
  [PROG, "Delete Forever reads Delete", ">Delete Forever</Text>", ">Delete</Text>"],
  [PROG, "the journal's head reads Journal", "' Session Journal'", "' Journal'"],
  [PROG, "a journal entry is headed by its week", "{e.day}</Text>", "{wk.week}</Text>"],
  [PROG, "a journal entry's effort is drawn muted", "color: paint(e.rpe.color, p) }]}>{e.rpe.text}", "color: p.muted }]}>{e.rpe.text}"],
  [PROG, "a journal entry's note is drawn as markup", "{markupParts(e.notes).text}", "{e.notes}"],
  [PROG, "a journal week shows no count", "{wk.count}</Text>", "{''}</Text>"],
  [PROG, "a folded journal week still shows its entries", "          {open[wk.week] && (\n", "          {(\n"],
  [PROG, "the estimator's say is cut", "Optional — estimate a one-rep max from any recent set, just for your own records. Your training still runs on RPE.", "Estimate a one-rep max."],
  [PROG, "the estimator's head reads Estimator", "' 1RM Estimator'", "' Estimator'"],
  [CARDS, "a main lift is headed by its opening set", "<Text style={[s.blockTop, { color: p.lift }]}>{b.top}</Text>", "<Text style={[s.blockTop, { color: p.lift }]}>{b.opened}</Text>"],
  [CARDS, "a main lift's gain is not drawn", "{b.gain && <><Text style={[s.bold, { color: p.lift }]}>{b.gain}</Text>{b.afterGain}</>}", ""],
  [CARDS, "a main lift draws no line", "{b.chart && <SvgPicture viewBox={b.chart.viewBox} style={b.chart.style} els={b.chart.els} palette={p} />}", ""],
  [CARDS, "the ladder's head counts its rows", "<Text style={[s.readyNum, { color: l.ready ? p.signal : p.muted }]}>{l.ready}</Text>", "<Text style={[s.readyNum, { color: l.ready ? p.signal : p.muted }]}>{l.rows.length}</Text>"],
  [CARDS, "the ladder's head is always live", "color: l.ready ? p.signal : p.muted", "color: p.signal"],
  [CARDS, "every ladder row reads Add weight", "{r.ready\n                  ? <Text", "{true\n                  ? <Text"],
  [CARDS, "a ladder row draws no track", "              <SvgPicture viewBox={r.track.viewBox} style={r.track.style} els={r.track.els} palette={p} />\n", ""],
  [CARDS, "a ladder row shows no detail", "{r.weight}</Text>{r.detail}</Text>", "{r.weight}</Text></Text>"],
  [CARDS, "the steps up are always plural", "{l.ups + ' time' + (l.ups === 1 ? '' : 's')}", "{l.ups + ' times'}"],
  [CARDS, "an other row shows no load", "<Text style={[s.otherMeta, { color: p.muted }]}>{r.meta}</Text>", ""],
  [CARDS, "the dot chart's total is its peak", "{c.total + ' ' + c.unit}", "{c.peak + ' ' + c.unit}"],
  [CARDS, "the dot chart draws no line", "        <Path d={c.path} stroke={color} strokeWidth={1.5} strokeDasharray=\"3,3\" fill=\"none\" opacity={0.6} />\n", ""],
  [CARDS, "the dot chart draws no week labels", "{l.text}</SvgText>", "{''}</SvgText>"],
  [CARDS, "a card draws no footer", "      {foot && <Text style={[s.foot, { color: p.muted }]}>{markupParts(foot).text}</Text>}\n", ""],
  [CARDS, "a card's title is drawn as markup", "<Text style={[s.titleText, { color }]}>{t.text}</Text>", "<Text style={[s.titleText, { color }]}>{html}</Text>"],
  [PIC, "a picture keeps the page's viewBox", "<Svg viewBox={box.viewBox} style={size}>", "<Svg viewBox={viewBox} style={size}>"],
  [PIC, "a fixed picture is not put back in place on the screen", "{ width: box.width, height: box.height, margin: box.margin }", "{ width: box.width, height: box.height }"],
  [PIC, "a circle is drawn as a line", "case 'circle': return <Circle key={i} {...a} />;", "case 'circle': return <Line key={i} {...a} />;"],
  [PIC, "a picture's words are not drawn", "default: return <SvgText key={i} {...a}>{e.text}</SvgText>;", "default: return <SvgText key={i} {...a} />;"],
  [PIC, "a picture is painted in the web's own words", "const a = svgProps(e, p, DISPLAY);", "const a = e.a;"],
  [READ, "the lifts with no load are in the store's order", "  unloaded.sort((a, b) => b.sessions - a.sessions);\n", ""],
  // The run cards' drawing (the row's second session): the markup's reader, the block's type, the picture's face and
  // its room past the edge, and the drawer. Both faces are Helvetica Neue today, so no test can tell the display face
  // from the text face and no break is written for which of the two a block takes.
  [MARKUP, "run card: an entity is drawn as the page wrote it", ".replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '\"').replace(/&#39;/g, \"'\").replace(/&amp;/g, '&');", ";"],
  [MARKUP, "run card: any face named is the display face", "display: d['font-family'] === 'var(--font-display)',", "display: 'font-family' in d,"],
  [MARKUP, "run card: a size in any unit is read as points", "size: num(d['font-size'], 'px'),", "size: num(d['font-size'], '[a-z]*'),"],
  [MARKUP, "run card: a block's weight is not read", "weight: d['font-weight'] || null,", "weight: null,"],
  [MARKUP, "run card: a tracking in points is read as a share of the size", "spacing: num(d['letter-spacing'], 'em'),", "spacing: num(d['letter-spacing'], '[a-z]*'),"],
  [MARKUP, "run card: a block's colour is not read", "    color: d['color'] || null,\n    line:", "    color: null,\n    line:"],
  [MARKUP, "run card: a line height in points is read as a multiple", "line: num(d['line-height'], ''),", "line: num(d['line-height'], '[a-z]*'),"],
  [MARKUP, "run card: the room under a block is not read", "gap: num(d['margin-bottom'], 'px'),", "gap: null,"],
  [MARKUP, "run card: a number loses its sign", "new RegExp('^(-?[0-9.]+)' + unit + '$')", "new RegExp('^-?([0-9.]+)' + unit + '$')"],
  [MARKUP, "run card: a property is found with the spaces around its name", "out[d.slice(0, i).trim()] = d.slice(i + 1).trim();", "out[d.slice(0, i)] = d.slice(i + 1).trim();"],
  [MARKUP, "run card: a value keeps the spaces around it", "out[d.slice(0, i).trim()] = d.slice(i + 1).trim();", "out[d.slice(0, i).trim()] = d.slice(i + 1);"],
  [MARKUP, "run card: a block's size is not said", "  if (b.size !== null) t.fontSize = b.size;\n", ""],
  [MARKUP, "run card: a block's weight is not said", "  if (b.weight !== null) t.fontWeight = b.weight as '700';\n", ""],
  [MARKUP, "run card: the tracking is said in em, not in points", "t.letterSpacing = b.spacing * b.size;", "t.letterSpacing = b.spacing;"],
  [MARKUP, "run card: a tracking is said where no size is", "if (b.size !== null && b.spacing !== null) t.letterSpacing", "if (b.spacing !== null) t.letterSpacing"],
  [MARKUP, "run card: a block's colour is said as the web writes it", "t.color = paint(b.color, p);", "t.color = b.color;"],
  [MARKUP, "run card: the line height is said as a multiple, not in points", "t.lineHeight = b.line * b.size;", "t.lineHeight = b.line;"],
  [MARKUP, "run card: a line height is said where no size is", "if (b.size !== null && b.line !== null) t.lineHeight", "if (b.line !== null) t.lineHeight"],
  [MARKUP, "run card: no room under a block is left unsaid", "if (b.gap !== null) t.marginBottom", "if (b.gap) t.marginBottom"],
  [MARKUP, "run card: the room under a block is not said", "  if (b.gap !== null) t.marginBottom = b.gap;\n", ""],
  [MARKUP, "run card: a bold run is read as plain words", "say(m[2]!, true, declarations(styleOf(m[1]!))['color'] || null);", "say(m[2]!, false, declarations(styleOf(m[1]!))['color'] || null);"],
  [MARKUP, "run card: a bold run loses its colour", "say(m[2]!, true, declarations(styleOf(m[1]!))['color'] || null);", "say(m[2]!, true, null);"],
  [MARKUP, "run card: the words before a bold run are lost", "    say(html.slice(at, m.index), false, null);\n    say(m[2]!", "    say(m[2]!"],
  [MARKUP, "run card: the words after the last bold run are lost", "  say(html.slice(at), false, null);\n  return out;", "  return out;"],
  [MARKUP, "run card: a run with no words is kept", "if (t) out.push({ text: t, bold, color });", "out.push({ text: t, bold, color });"],
  [MARKUP, "run card: another tag is drawn as the page wrote it", "const t = decode(text.replace(/<[^>]*>/g, ''));", "const t = decode(text);"],
  [MARKUP, "run card: a block with no words is kept", "if (runs.length) out.push({ style, runs });", "out.push({ style, runs });"],
  [MARKUP, "run card: a block loses its style", "add(blockStyle(styleOf(m[1]!)), m[2]!);", "add(null, m[2]!);"],
  [MARKUP, "run card: the words between blocks are lost", "    add(null, html.slice(at, m.index));\n    add(blockStyle", "    add(blockStyle"],
  [MARKUP, "run card: the words after the last block are lost", "  add(null, html.slice(at));\n  return out;", "  return out;"],
  [PAINT, "run card: a text that names no face is left to the phone's", "  if (el.el === 'text' && !('font-family' in el.a)) out['fontFamily'] = face;\n", ""],
  [PAINT, "run card: every element takes a face", "if (el.el === 'text' && !('font-family' in el.a)) out", "if (!('font-family' in el.a)) out"],
  [PAINT, "run card: a full width picture is clipped at its edge", "return { viewBox: grown, width: null, height: null,", "return { viewBox, width: null, height: null,"],
  [PAINT, "run card: a full width picture is not put back in place", "pull = -100 * OVERFLOW / w;", "pull = 0;"],
  [PAINT, "run card: a full width picture is its card wide with its edges grown", "wide = 100 * (w + 2 * OVERFLOW) / w,", "wide = 100,"],
  [PIC, "run card: a full width picture takes no room past its edge on the screen", "{ width: (box.wide + '%') as `${number}%`, aspectRatio: box.ratio, margin: (box.pull + '%') as `${number}%` }", "{ width: '100%' as const, aspectRatio: box.ratio }"],
  [CARDS, "run card: the title is in the ink whatever the card", "color={paint(c.color, p)} gap={c.titleGap}", "color={p.text} gap={c.titleGap}"],
  [CARDS, "run card: every title stands twelve over what follows", "gap={c.titleGap} />", "gap={12} />"],
  [CARDS, "run card: a card draws no head", "      {c.head && <Markup html={c.head} palette={p} />}\n", ""],
  [CARDS, "run card: a card draws no picture", "      {c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style=\"width:100%;height:auto;overflow:visible\" els={c.svg.els} palette={p} />}\n", ""],
  [CARDS, "run card: a card draws no body", "      {c.body && <Markup html={c.body} palette={p} />}\n", ""],
  [CARDS, "run card: a card with a spec's footer draws none", "      {c.foot && <Markup html={c.foot} base={[s.foot, { color: p.muted }]} palette={p} />}\n", ""],
  [CARDS, "run card: the picture is drawn under the body", "      {c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style=\"width:100%;height:auto;overflow:visible\" els={c.svg.els} palette={p} />}\n      {c.body && <Markup html={c.body} palette={p} />}\n", "      {c.body && <Markup html={c.body} palette={p} />}\n      {c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style=\"width:100%;height:auto;overflow:visible\" els={c.svg.els} palette={p} />}\n"],
  [CARDS, "run card: the head is drawn under the picture", "      {c.head && <Markup html={c.head} palette={p} />}\n      {c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style=\"width:100%;height:auto;overflow:visible\" els={c.svg.els} palette={p} />}\n", "      {c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style=\"width:100%;height:auto;overflow:visible\" els={c.svg.els} palette={p} />}\n      {c.head && <Markup html={c.head} palette={p} />}\n"],
  [CARDS, "run card: a block is drawn in the type of where it stands", "style={b.style ? blockType(b.style, p) : base}", "style={base}"],
  [CARDS, "run card: a bold run is drawn as plain words", "{b.runs.map((r, j) => (r.bold ? <Text key={j} style={[s.bold, r.color !== null && { color: paint(r.color, p) }]}>{r.text}</Text> : r.text))}", "{b.runs.map((r) => r.text)}"],
  [CARDS, "run card: a bold run is in the colour of the words around it", "style={[s.bold, r.color !== null && { color: paint(r.color, p) }]}", "style={s.bold}"],
  [CARDS, "run card: the footer has no type of its own", " base={[s.foot, { color: p.muted }]} palette={p} />}", " palette={p} />}"],
  [CARDS, "run card: the card stands on no ground", "<View testID=\"run-card\" style={[s.card, { backgroundColor: p.surface }]}>", "<View testID=\"run-card\">"],
  [PROG, "run card: a run card is handed to the ledger's drawer", "                : c.kind === 'card' ? <RunCard key={i} spec={c.spec} palette={p} />\n", ""],
  [MARKUP, "run card: reading a card's markup writes a key", "  const out: MarkupBlock[] = [];\n  const add", "  const out: MarkupBlock[] = [];\n  localStorage.setItem('ia_card', html);\n  const add"],
  [CARDS, "run card: drawing a card writes a key", "  return (\n    <View testID=\"run-card\"", "  phoneStore.set('ia_card', c.title);\n  return (\n    <View testID=\"run-card\""],
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
  say.push('# The Expo app\'s Progress: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-progress_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-progress_breaks.md'), say.join('\n') + '\n');
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

// Every break's text is in its file once, before anything is run.
BREAKS.forEach(([file, rule, from, to], i) => {
  let text = readFileSync(join(tree, file), 'utf8');
  for (const [a, b] of (Array.isArray(from) ? from : [[from, to]])) {
    if (text.split(a).length !== 2) throw new Error('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + (text.split(a).length - 1) + ' times, not once');
    text = text.replace(a, b);
  }
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
  let broken = src;
  for (const [a, b] of (Array.isArray(from) ? from : [[from, to]])) broken = broken.replace(a, b);
  let r, slow = false;
  try {
    writeFileSync(path, broken);
    r = run(FAST);
    if (!Object.keys(r.files).length) { slow = true; r = run(SLOW); }
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files, slow]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files' + (slow ? ' (swept)' : ''));
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean, rows }));
const say = report(rows, clean);
if (!only && !part) writeFileSync(join(HERE, 'native-progress_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
