// native-session-sheet: when one rule of the Expo app's session sheet is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of what the sheet
// reads (frontends/native/src/day-detail/sheet-readers.ts), of how it draws the day (sheet-screen.ts), of what its
// log, its Done and its Skip write (sheet-writes.ts, pop-up/pop-ups.ts), of a model's copy, or of the screens' wiring
// (day-detail/SessionSheet.tsx, this-week/ThisWeek.tsx, App.tsx). The sheet's second session added the rules of what
// the add sheet lists and the dose an added move takes (sheet-adds.ts), of add, remove and the 1RM card's save
// (sheet-writes.ts), and of the add sheet's own screen and model (add-sheet/). The fast files are run on each; the ten-program
// sweep is run only on a break the fast files let through. A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-session-sheet_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-session-sheet_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-session-sheet_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-session-sheet_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-session-sheet_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-session-sheet_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-session-sheet.test.ts', 'integration/native-session-sheet.test.ts', 'unit/native-pop-ups.test.ts', 'unit/native-deck.test.ts', 'unit/native-deck-logging.test.ts', 'unit/native-shell.test.ts'];
const SLOW = ['sweeps/native-session-sheet.test.ts'];
const D = 'frontends/native/src/day-detail/';
const READERS = D + 'sheet-readers.ts', SCREEN = D + 'sheet-screen.ts', WRITES = D + 'sheet-writes.ts', SHEET = D + 'SessionSheet.tsx', ADDS = D + 'sheet-adds.ts';
const ADDSHEET = 'frontends/native/src/add-sheet/AddSheet.tsx', ADDMODEL = 'frontends/native/src/add-sheet/add-sheet-model.ts';
const POPS = 'frontends/native/src/pop-up/pop-ups.ts', APP = 'frontends/native/src/App.tsx', WEEK = 'frontends/native/src/this-week/ThisWeek.tsx';

/**
 * [the file, the rule broken, the text it replaces (once in the file), its replacement]. A rule the code keeps in two
 * places is broken in both: its third entry is then a list of [text, replacement] pairs.
 */
const BREAKS = [
  // ── What the sheet reads ──
  [READERS, 'the Core tag wears the hip colour', "core: ['var(--core)', 'rgba(var(--core-rgb),0.15)']", "core: ['var(--hip)', 'rgba(var(--hip-rgb),0.15)']"],
  [READERS, 'the Lift tag reads Lifting', "lift: { cls: 't-lift', label: 'Lift' }", "lift: { cls: 't-lift', label: 'Lifting' }"],
  [READERS, 'effort 7 reads Hard', "7: 'Very Hard',", "7: 'Hard',"],
  [READERS, 'the pace wheel starts at 5 minutes', "cols: [{ min: 4, max: 17, nil: true }", "cols: [{ min: 5, max: 17, nil: true }"],
  [READERS, 'a move with a prescription is not counted as loggable', "  if (parseRx(detail, name)) return true;\n", ''],
  [READERS, 'a skipped round is counted in the day\'s moves', "    if (sec && sec._skipped) return;\n", ''],
  [READERS, 'a skipped move is counted in the day\'s moves', "      if (i && i._skipped) return;\n", ''],
  [READERS, 'a lift logged in any week counts as done today', "+(e.week as number) === +week && ", ''],
  [READERS, 'a lift logged on any day of the week counts as done today', " && entryDay(e as { day?: string; ts?: number }) === dayKey", ''],
  [READERS, 'a logged run\'s button reads Logged', "return live ? 'Logged ✓' : 'Log';", "return live ? 'Logged' : 'Log';"],
  [READERS, 'the swap note never says the numbers are kept', "+ (kept ? ` Your ${CARDIO_WORD[planned]} numbers are kept. Switch back and they return.` : '')", ''],
  [READERS, 'a pace of nothing is written 0:00', "|| (sec as number) <= 0) return null;", ") return null;"],
  [READERS, 'a clock with three parts is read', "if (q.length === 2 && q[0] !== ''", "if (q.length >= 2 && q[0] !== ''"],
  [READERS, 'the dose a session carries is passed over for its words', "  if (c.dose && c.dose.k) return c.dose;\n", ''],
  [READERS, 'a swim\'s words are read for a dose', "  if (t !== 'run' && t !== 'bike') return null;\n", ''],
  [READERS, 'a bike interval\'s warm up is read as its dose', "  if (t === 'bike' && /interval/i.test(c.subtype || '')) return null;\n", ''],
  [READERS, 'a progression run keeps its first pace as the target', "  if (/as a progression/i.test(d)) tgt = null;\n", ''],
  [READERS, 'reps of a distance are not read', "  if ((m = d.match(/(\\d+)\\s*x\\s*(\\d+)\\s*m\\b/i))) return { k: 'reps_dist', reps: +m[1]!, m: +m[2]!, tgt: tgt as number, parsed: true };\n", ''],
  [READERS, 'a timed run is not read', "  if ((m = d.match(/(\\d+(?:\\.\\d+)?)[-\\s]*min(?:ute)?s?\\b/i))) return { k: 'time', mins: +m[1]!, tgt: tgt as number, parsed: true };\n", ''],
  [READERS, 'a timed run\'s pace is always worked from the planned time', "const useM = mins > 0 ? mins : dose.mins!, sec = useM * 60 / dist;", "const useM = dose.mins!, sec = useM * 60 / dist;"],
  [READERS, 'a run by distance hands back no distance to stamp', "dist: (dist > 0 ? null : useD), assumed: dist > 0", "dist: null, assumed: dist > 0"],
  [READERS, 'reps of a distance give their miles to the tenth', "out.dist = +((reps * dose.m!) / 1609.34).toFixed(2);", "out.dist = +((reps * dose.m!) / 1609.34).toFixed(1);"],
  [READERS, 'reps of a time always count the planned reps', "const useR = (reps != null && reps > 0) ? reps : dose.reps!, wm", "const useR = dose.reps!, wm"],
  [READERS, 'a swapped session counts as the benchmark', "      if (!e || e.swapTo) return;\n", "      if (!e) return;\n"],
  [READERS, 'any run counts as the benchmark', "if (!/^Benchmark Run/.test(String(c.subtype || ''))) return;", "if (!/Run/.test(String(c.subtype || ''))) return;"],
  [READERS, 'a benchmark with no time logged or planned is taken as 30 minutes', "? c.dose.mins! : 20);", "? c.dose.mins! : 30);"],
  // ── How the sheet draws the day ──
  [SCREEN, 'a rest day draws a sheet', "  return day && !day.rest ? day : null;", "  return day;"],
  [SCREEN, 'the title a day was closed under is passed over', "title: (comp && comp.title) || day.title || 'Training',", "title: day.title || 'Training',"],
  [SCREEN, 'a day with no title reads Session', "day.title || 'Training',\n    tags,", "day.title || 'Session',\n    tags,"],
  [SCREEN, 'the week and day are joined by a comma', "over: 'Week ' + week + ' · ' + DAY_FULL[dayKey],", "over: 'Week ' + week + ', ' + DAY_FULL[dayKey],"],
  [SCREEN, 'no logged counter is drawn', "counter: loggedCount(progress),", "counter: null,"],
  [SCREEN, 'a travel day wears no travel tag', "travel: !!dayIsTravel(day as unknown as ReadDay) };", "travel: false };"],
  [SCREEN, 'lifting comes first whatever the program is for', "liftsFirst(secs.length > 0, prog.primaryPath, prog.liftingFocus)", "liftsFirst(secs.length > 0, undefined, undefined)"],
  [SCREEN, 'only the main section is drawn', "rest: secs.length ? sectionsView(secs.slice(1), 1, reads()) : [],", "rest: [],"],
  [SCREEN, 'the sections after the main one are numbered from the start', "sectionsView(secs.slice(1), 1, reads())", "sectionsView(secs.slice(1), 0, reads())"],
  [SCREEN, 'a test day has no 1RM card in its view', "e1rm: day.testLift ? e1rmCard(String(day.testLift), unit, safe(() => lastOf(mainName) as never, undefined)) : null,", "e1rm: null,"],
  [SCREEN, 'the 1RM card starts blank whatever was logged', "e1rmCard(String(day.testLift), unit, safe(() => lastOf(mainName) as never, undefined))", "e1rmCard(String(day.testLift), unit, undefined)"],
  [SCREEN, 'the day\'s note is left out of the view', "    note: day.note,\n", "    note: undefined,\n"],
  [SCREEN, 'the range nudge is never drawn', "nudge: safe(() => rangeNudge(items, lastOf as never), null),", "nudge: null,"],
  [SCREEN, 'the Wildcard tag is left out of the view', "wildcard: wildcardSub(wildcardOn(store, id, week, dayKey),", "wildcard: wildcardSub(null,"],
  [SCREEN, 'the never marked nudge shows on a day already closed', "logNudge: !status && hasLogged(le) ? logNudge(dayKey, day.title) : null,", "logNudge: hasLogged(le) ? logNudge(dayKey, day.title) : null,"],
  [SCREEN, 'a double day\'s jog is left out of the view', "also: safe(() => alsoJog(DAY_FULL[dayKey] || dayKey, restLogLines(le && le.restLog), week, dayKey), null),", "also: null,"],
  [SCREEN, 'the foot is drawn as pending whatever the day\'s status', "    foot: statusFoot(dayStatus(store, id, week, dayKey)),", "    foot: statusFoot(null),"],
  [SCREEN, 'the foot closes a day with no title as Training', "footTitle: day.title || '',", "footTitle: day.title || 'Training',"],
  [SCREEN, 'a swapped sport keeps the planned dose', [["setDoseFull: () => {},", "setDoseFull: (d) => { dose = (d as Dose | null) || null; },"], ["setDose: (d) => { dose = (d as Dose | null) || null; },", "setDose: () => {},"]]],
  [SCREEN, 'the run is never read as logged', "live: (e, sport) => cardioEntryLogged(e as never, sport),", "live: () => false,"],
  [SCREEN, 'the retest strip is left off the cardio card', "day.cardio ? benchNotes(day.cardio, (wk) => benchmarkEntryFor(store, id, wk), (s) => _clkMS(s)) : []", "[]"],
  [SCREEN, 'the foot drawn again after an undo ignores the status', "  return statusFoot(dayStatus(store, prog.id, week, dayKey));", "  return statusFoot(null);"],
  [SCREEN, 'the day\'s note is left undrawn', "'cardio', 'note', 'log', 'logNudge'];", "'cardio', 'log', 'logNudge'];"],
  [SCREEN, 'the screen draws only the blocks its list leaves out', "export function drawnBlocks(v: { body: BodyBlock[] }): BodyBlock[] { return v.body.filter((b) => SHEET_DRAWS.includes(b.kind)); }", "export function drawnBlocks(v: { body: BodyBlock[] }): BodyBlock[] { return v.body.filter((b) => !SHEET_DRAWS.includes(b.kind)); }"],
  [SCREEN, 'a tint is read as a solid colour', "return tint ? { name: tint[1]!, alpha: +tint[2]! } : null;", "return tint ? { name: tint[1]!, alpha: 1 } : null;"],
  [SCREEN, 'the RPE reference reads otherwise', "['7–8', 'Hard — a few words at a time']", "['7–8', 'Hard — a few words']"],
  // Not broken here: the fold of the lift log's old keys as the sheet reads it. The launch folds the log and stores
  // it before any sheet is drawn (week-screen.ts), so the sheet's own fold is the rule's second keeping and taking
  // it out changes nothing (the first run let it through; the deck's breaks hold the launch's fold).
  // ── What the log, Done and Skip write ──
  [WRITES, 'a draw leaves the slider marked as moved', "return { rpe: log.view.rpeValue, touched: false,", "return { rpe: log.view.rpeValue, touched: true,"],
  [WRITES, 'a draw leaves the notes blank', "notes: log.view.notes, nodes:", "notes: '', nodes:"],
  [WRITES, 'a draw leaves the slider at 5 whatever was stored', "return { rpe: log.view.rpeValue,", "return { rpe: '5',"],
  [WRITES, 'a timed run\'s second wheel is not on the form', "return { [f.first.hiddenId]: f.first.value, [f.second.hiddenId]: f.second.value };", "return { [f.first.hiddenId]: f.first.value };"],
  [WRITES, 'the reps on the form are the reps shown, not the reps stored', "return { log_run_reps: f.stepper.stored,", "return { log_run_reps: f.stepper.shown,"],
  [WRITES, 'the plain run form holds no pace', "return { [f.dist.hiddenId]: f.dist.value, [f.pace.hiddenId]: f.pace.value };", "return { [f.dist.hiddenId]: f.dist.value };"],
  [WRITES, 'a ride\'s time is not on the form', "if (f.kind === 'bike') return { [f.wheel.hiddenId]: f.wheel.value };", "if (f.kind === 'bike') return {};"],
  [WRITES, 'a swim\'s yards are not on the form', "if (f.kind === 'swim') return { log_swim_yards: f.yards };", "if (f.kind === 'swim') return {};"],
  [WRITES, 'the card is always on its planned sport', "wrap: c ? { planned: c.planned, active: c.active } : null };", "wrap: c ? { planned: c.planned, active: c.planned } : null };"],
  [WRITES, 'the slider moved is not marked as moved', "return { ...f, rpe: String(value), touched: true };", "return { ...f, rpe: String(value) };"],
  // A save's own snapshot is the only one a slider move or a typed note takes.
  [WRITES, 'a save does not snapshot the day', "  snapshotDay(s);\n  const logs = readDayLogs", "  const logs = readDayLogs"],
  [WRITES, 'a commit tap does not read a draft card\'s form', "const _live = !!commit || cardioLive(s, f);", "const _live = cardioLive(s, f);"],
  [WRITES, 'every save reads the cardio form, draft or not', "const _live = !!commit || cardioLive(s, f);", "const _live = true;"],
  [WRITES, 'the card is live by its planned sport\'s numbers', "const sport = f.wrap.active || f.wrap.planned || '';", "const sport = f.wrap.planned || '';"],
  [WRITES, 'a swapped sport is not named on the entry', "const swapped = planned && active && active !== planned;", "const swapped = false;"],
  [WRITES, 'a save drops the set drafts', "  if (_keepSets) logs[key]!['sets'] = _keepSets;\n", ''],
  [WRITES, 'a save drops the parked sports', "  if (_keepParked) logs[key]!['parked'] = _keepParked;\n", ''],
  [WRITES, 'a save drops a rest day\'s jog', "  if (_keepRest) logs[key]!['restLog'] = _keepRest;\n", ''],
  [WRITES, 'a slider nobody moved stores its 5', "const _rpe = f.touched ? g('log_rpe') : ((logs[key] && logs[key]!['rpe'] != null) ? logs[key]!['rpe'] : '');", "const _rpe = g('log_rpe');"],
  [WRITES, 'a slider nobody moved wipes the entry\'s effort', "const _rpe = f.touched ? g('log_rpe') : ((logs[key] && logs[key]!['rpe'] != null) ? logs[key]!['rpe'] : '');", "const _rpe = f.touched ? g('log_rpe') : '';"],
  [WRITES, 'the entry does not carry its week', "    week: s.week, ts: now,\n", "    ts: now,\n"],
  [WRITES, 'the entry is stamped with nothing', "    week: s.week, ts: now,\n", "    week: s.week, ts: 0,\n"],
  [WRITES, 'the entry\'s two swap fields are written the other way round', "swapFrom: swapped ? planned : '', swapTo: swapped ? active : '',", "swapTo: swapped ? active : '', swapFrom: swapped ? planned : '',"],
  [WRITES, 'the notes are not stored', "    notes: g('log_notes'),\n", "    notes: '',\n"],
  [WRITES, 'a ride\'s minutes are not stored', "bike_mins: gc('log_bike_mins'),", "bike_mins: '',"],
  [WRITES, 'the miles are stored from a draft card', "run_dist: gc('log_run_dist'),", "run_dist: g('log_run_dist'),"],
  [WRITES, 'the derived pace writes over the form\'s own', "if (_dd.pace && !logs[key]!['run_pace']) logs[key]!['run_pace'] = _dd.pace;", "if (_dd.pace) logs[key]!['run_pace'] = _dd.pace;"],
  [WRITES, 'the derived distance is not stamped', "      if (_dd.dist != null && !logs[key]!['run_dist']) logs[key]!['run_dist'] = String(_dd.dist);\n", ''],
  [WRITES, 'a draft card derives its pace too', "  if (_live) {\n    const _dd", "  if (commit !== null) {\n    const _dd"],
  [WRITES, 'a save does not settle the day\'s skipped parts', "  settleDayParts(s.store, s.prog.id, s.week, s.dayKey, dayOf(s), now);\n", ''],
  // Not broken alone: the snapshot a status tap takes first. The save inside the same tap takes it too, as the
  // page's does (a first touch wins, so the second call is a no-op); the first run let the half through. Both halves:
  [WRITES, 'a status tap snapshots the day nowhere', [["  snapshotDay(s);\n  const _was", "  const _was"], ["  snapshotDay(s);\n  const logs = readDayLogs", "  const logs = readDayLogs"]]],
  [WRITES, 'a status set by hand leaves the day\'s skipped parts', "  clearDayParts(s.store, s.prog.id, s.week, s.dayKey);\n", ''],
  [WRITES, 'a status tap never commits the form', "  persistLog(s, f, dose, _commit, now);\n", "  persistLog(s, f, dose, false, now);\n"],
  [WRITES, 'the undo tap commits the form', "  persistLog(s, f, dose, _commit, now);\n", "  persistLog(s, f, dose, true, now);\n"],
  [WRITES, 'a status tap does not save the log', "  persistLog(s, f, dose, _commit, now);\n", ''],
  [WRITES, 'the undo leaves the day\'s status', "    clearDayStatus(s.store, s.prog.id, s.week, s.dayKey);\n", ''],
  [WRITES, 'any day\'s undo lets the season\'s pop-up go', "if (fin && fin.week === s.week && fin.d === s.dayKey) releaseSeasonShown(pop);", "if (fin) releaseSeasonShown(pop);"],
  [WRITES, 'the last day\'s undo keeps the season\'s mark', "      if (fin && fin.week === s.week && fin.d === s.dayKey) releaseSeasonShown(pop);\n", ''],
  [WRITES, 'the undo of a Skip lets the season\'s pop-up go', "    if (status === 'complete') {\n      const pop", "    if (status !== null) {\n      const pop"],
  [WRITES, 'the undo\'s toast reads Undone', "return { toast: 'Unmarked', closed: false, popup: false };", "return { toast: 'Undone', closed: false, popup: false };"],
  [WRITES, 'the undo closes the sheet', "return { toast: 'Unmarked', closed: false, popup: false };", "return { toast: 'Unmarked', closed: true, popup: false };"],
  [WRITES, 'a day with no title is closed under an empty title', "s.dayKey, title || null, status, now);", "s.dayKey, title, status, now);"],
  [WRITES, 'the status is stamped with nothing', "s.dayKey, title || null, status, now);", "s.dayKey, title || null, status, 0);"],
  [WRITES, 'Skip marks the day done', "s.dayKey, title || null, status, now);", "s.dayKey, title || null, 'complete', now);"],
  [WRITES, 'Done raises no pop-up', "? { toast: null, closed: true, popup: true }", "? { toast: null, closed: true, popup: false }"],
  [WRITES, 'Done raises its toast under the pop-up', "? { toast: null, closed: true, popup: true }", "? { toast: 'Done ✓', closed: true, popup: true }"],
  [WRITES, 'Done leaves the sheet open', "? { toast: null, closed: true, popup: true }", "? { toast: null, closed: false, popup: true }"],
  [WRITES, 'Skip\'s toast reads Skipped', "skipped: 'Skipped ✕ The week moves on' };", "skipped: 'Skipped' };"],
  [WRITES, 'Skip raises the pop-up', ": { toast: labels[status] || 'Updated ✓', closed: true, popup: false };", ": { toast: labels[status] || 'Updated ✓', closed: true, popup: true };"],
  [POPS, 'the season\'s release removes the reminder\'s day instead', "try { s.store.remove('ia_season_shown_' + s.prog.id); }", "try { s.store.remove('ia_remind_last_' + s.prog.id); }"],
  // ── A model's copy ──
  [D + 'day-detail-model.ts', 'the copy of the sheet\'s model words a done day otherwise', "label: done ? 'Done ✓ ' : 'Done'", "label: done ? 'Done ' : 'Done'"],
  [D + 'session-log-model.ts', 'the copy of the log\'s model words the still slider otherwise', "'Move slider'", "'Slide'"],
  [D + 'cardio-fields-model.ts', 'the copy of the fields\' model seeds the stamped distance', "e['run_dist'] === String(dose.mi) ? '' : str(e['run_dist'])", "str(e['run_dist'])"],
  [D + 'cardio-card-model.ts', 'the copy of the cardio card\'s model joins its name otherwise', "(c.subtype ? ' — ' + c.subtype.replace(/_/g, ' ') : '')", "(c.subtype ? ' - ' + c.subtype.replace(/_/g, ' ') : '')"],
  [D + 'sheet-marks-model.ts', 'the copy of the marks\' model colours an unknown tag otherwise', "pal[t] || ['var(--mark)', 'rgba(var(--mark-rgb),0.12)']", "pal[t] || ['var(--muted)', 'rgba(var(--mark-rgb),0.12)']"],
  // ── The screens' wiring ──
  [SHEET, 'the slider moved saves nothing', "    const next = moveRpe(f, v);\n    hold(next);\n    persistLog(session, next, cardioNow.current.dose, false, Date.now());\n", "    const next = moveRpe(f, v);\n    hold(next);\n"],
  [SHEET, 'the notes typed save nothing', "    const next = typeNotes(formNow.current, text);\n    hold(next);\n    persistLog(session, next, cardioNow.current.dose, false, Date.now());\n", "    const next = typeNotes(formNow.current, text);\n    hold(next);\n"],
  [SHEET, 'a drag that stays on its number saves again and again', "    if (f.touched && f.rpe === String(v)) return;\n", ''],
  [SHEET, 'the slider\'s save is a commit', "persistLog(session, next, cardioNow.current.dose, false, Date.now());\n  };\n  const noted", "persistLog(session, next, cardioNow.current.dose, true, Date.now());\n  };\n  const noted"],
  [SHEET, 'an undo draws nothing again', "    if (!r.closed) { setView((v) => ({ ...v, foot: footOf(store, prog, open.week, open.dayKey) })); return; }\n", "    if (!r.closed) return;\n"],
  [SHEET, 'Done closes the sheet with no pop-up', "    if (r.popup) away(() => onDone(prog, open.week, open.dayKey)); else away(onClose);\n", "    away(onClose);\n"],
  [SHEET, 'a status tap raises no toast', "    if (r.toast) say(r.toast);\n    if (!r.closed)", "    if (!r.closed)"],
  [SHEET, 'Mark Done marks the day skipped', "onPress={() => status('complete', blk.title)}", "onPress={() => status('skipped', blk.title)}"],
  [SHEET, 'the foot closes the day under the title in the header', "onPress={() => status(btn.status, view.footTitle)}", "onPress={() => status(btn.status, view.title)}"],
  [SHEET, 'a redraw keeps the old form', "    hold(formOf(logOf(next)));\n", ''],
  [SHEET, 'a redraw keeps the old fields', "    apply(sheetFields(next));\n", ''],
  [SHEET, 'a redraw leaves the sets open', "    setSetsOpen({});\n  };", "  };"],
  [SHEET, 'the sheet draws every block of the view', "{drawnBlocks(frame).map((blk, k) => {", "{frame.body.map((blk, k) => {"],
  [SHEET, 'a set\'s minus steps up', "onPress={() => h.step(x.exKey, r.s, -r.step)}", "onPress={() => h.step(x.exKey, r.s, +r.step)}"],
  [SHEET, 'a move\'s minus puts it back', "onPress={() => h.edit({ kind: 'exercise', name: x.name }, true)}", "onPress={() => h.edit({ kind: 'exercise', name: x.name }, false) }"],
  [SHEET, 'a round\'s minus puts it back', "onPress={() => h.edit({ kind: 'round', secIdx: b.secIdx }, true)}", "onPress={() => h.edit({ kind: 'round', secIdx: b.secIdx }, false) }"],
  [SHEET, 'the swap mark opens the sheet on another place', "onPress={() => h.swap(x.swap!.secIdx, x.swap!.itemIdx)}", "onPress={() => h.swap(x.swap!.itemIdx, x.swap!.secIdx)}"],
  [SHEET, 'Log on a card reads fields a tap ago', "const r = tapLog(session, fieldsNow.current, x, Date.now());", "const r = tapLog(session, fields, x, Date.now());"],
  [SHEET, 'a field left saves nothing', "blur: (exKey) => { if (focused.current === exKey) { focused.current = null; save(exKey); } },", "blur: (exKey) => { if (focused.current === exKey) { focused.current = null; } },"],
  [SHEET, 'the sets opening do not mark the top set', "      if (opened && f) apply({ ...fieldsNow.current, [exKey]: openedSets(f) });\n", ''],
  [SHEET, 'the sheet shows the load field with the sets open', "{load && !open && (", "{load && ("],
  [SHEET, 'Back leaves the sheet open', "onPress={() => { leave(); away(onClose); }}", "onPress={() => { leave(); }}"],
  [SHEET, 'the log section reads otherwise', ">Log This Session</Text>", ">Log this session</Text>"],
  [SHEET, 'the never marked nudge reads otherwise', "You logged this one but never marked it.", "You logged this one but did not mark it."],
  [SHEET, 'the nudge comes at once after a pick', "setTimeout(() => setNudge({ from, to }), 1400)", "setTimeout(() => setNudge({ from, to }), 0)"],
  [WEEK, 'a done run\'s Reopen opens the whole day', "else if (r.to === 'day') { if (onReopen) onReopen(k.week, k.key); }", "else if (r.to === 'day' || r.to === 'cardio') { if (onReopen) onReopen(k.week, k.key); }"],
  [WEEK, 'Start opens nothing where the day opens no deck', "from); else openSheet(week, key);", "from);"],
  [WEEK, 'This Week does not hand the sheet its day', "    if (view) onSheet({ prog: grid, week, dayKey: key, view, only });\n", ''],
  [APP, 'Done on the sheet raises no pop-up', "setSheet(null); complete(", "setSheet(null); void ("],
  [APP, 'the sheet\'s Back does not close it', "open={sheet} calm={calm} onClose={() => setSheet(null)}", "open={sheet} calm={calm} onClose={() => {}}"],
  [APP, 'This Week\'s Reopen reaches no sheet', "onSheet={setSheet} onLaunch", "onSheet={() => {}} onLaunch"],
  // ── The sheet's second session: what the add sheet lists (sheet-adds.ts) ──
  [ADDS, 'a move already on the card is offered again', "    if (onCard[n.toLowerCase()]) return;\n", ''],
  [ADDS, 'the card\'s names are matched to the kit\'s by their exact case', "onCard[it.name.toLowerCase()] = 1;", "onCard[it.name] = 1;"],
  [ADDS, 'a move with no pattern is offered', "    if (!p) return;\n    if (!_swapInjuryOK(n, cfg)) return;", "    if (!_swapInjuryOK(n, cfg)) return;"],
  [ADDS, 'the injury plan does not filter the add sheet', "    if (!_swapInjuryOK(n, cfg)) return;\n", ''],
  [ADDS, 'another region\'s work is listed with the day\'s own', "    if (r && dayRegion && r !== dayRegion) { off.push(n); return; }\n", ''],
  [ADDS, 'a pattern the day already trains is listed as work it has none of', "if (patsOnCard[p]) more.push(n); else gap.push(n);", "gap.push(n);"],
  [ADDS, 'the day\'s region is its last move\'s, not its first', "if (!dayRegion) dayRegion = _PATTERN_REGION[p] as string;", "dayRegion = _PATTERN_REGION[p] as string;"],
  [ADDS, 'the lighter move is listed first', "if (ta !== tb) return tb - ta; return a.localeCompare(b); };", "if (ta !== tb) return ta - tb; return a.localeCompare(b); };"],
  [ADDS, 'moves of one tier are not put in order by name', "if (ta !== tb) return tb - ta; return a.localeCompare(b); };", "if (ta !== tb) return tb - ta; return b.localeCompare(a); };"],
  [ADDS, 'seven rows of work the day has none of', "gap: gap.sort(rank).slice(0, 6)", "gap: gap.sort(rank).slice(0, 7)"],
  [ADDS, 'six rows of more of the same', "more: more.sort(rank).slice(0, 5)", "more: more.sort(rank).slice(0, 6)"],
  [ADDS, 'seven rows of another region\'s work', "off: off.sort(rank).slice(0, 6)", "off: off.sort(rank).slice(0, 7)"],
  // ── The dose an added move takes ──
  [ADDS, 'a dose in yards donates to a rep lift', "if (/\\byards?\\b|\\byd\\b|", "if (/\\byd\\b|"],
  [ADDS, 'a dose in meters donates to a rep lift', "|\\bmeters?\\b|\\bsec\\b|", "|\\bsec\\b|"],
  [ADDS, 'a dose in minutes donates to a rep lift', "|\\bsec\\b|\\bmin\\b|\\bhold\\b|", "|\\bsec\\b|\\bhold\\b|"],
  [ADDS, 'a hold donates to a rep lift', "|\\bmin\\b|\\bhold\\b|max time/i", "|\\bmin\\b|max time/i"],
  [ADDS, 'a max time donates to a rep lift', "|\\bhold\\b|max time/i", "|\\bhold\\b/i"],
  [ADDS, 'a time or a distance the parse reads donates to a rep lift', "  if (rx['kind'] === 'dist' || rx['kind'] === 'sec') return null;\n", ''],
  [ADDS, 'a Main or a primer section donates its dose', "      if (/^(main|primer)/i.test(s.label || '')) return;\n", ''],
  [ADDS, 'a round donates its dose', "s.hip || s.superset || s.type === 'superset') return;", "s.hip || s.type === 'superset') return;"],
  [ADDS, 'a round named by its type donates its dose', "s.superset || s.type === 'superset') return;", "s.superset) return;"],
  [ADDS, 'a core block donates its dose', "if (!s || s._added || s.core || s.hip ||", "if (!s || s._added || s.hip ||"],
  [ADDS, 'a hip block donates its dose', "s.core || s.hip || s.superset", "s.core || s.superset"],
  [ADDS, 'the athlete\'s own added work donates its dose', "if (!s || s._added || s.core", "if (!s || s.core"],
  [ADDS, 'the first match on today\'s card donates, not the last', "for (let i = today.length - 1; i >= 0; i--) if", "for (let i = 0; i < today.length; i++) if"],
  [ADDS, 'the week is read from its last day back', "order.forEach((k) => { if (wk[k]) days.push(wk[k] as AddDay); });", "order.forEach((k) => { if (wk[k]) days.unshift(wk[k] as AddDay); });"],
  [ADDS, 'the same pattern elsewhere in the week is never tried', "      for (let j = 0; j < ds.length; j++) if (_pattern(ds[j]!.name as string) === pat) return ds[j]!.detail as string;\n", ''],
  [ADDS, 'the same region is never tried', "    if (region) for (let i = 0; i < days.length; i++) {", "    if (!region) for (let i = 0; i < days.length; i++) {"],
  [ADDS, 'the conservative dose is three sets of twelve', "  return '3×10 — RPE 7';", "  return '3×12 — RPE 7';"],
  // ── The add sheet as drawn (addSheetOf) ──
  [ADDS, 'a day the grid does not hold still opens an add sheet', "  if (!day || !prog) return null;\n  const c = addCandidates(day, prog);", "  if (!prog) return null;\n  const c = addCandidates(day, prog);"],
  [ADDS, 'a row of another region is named by its pattern', "regionOf: (n) => (_PATTERN_REGION[_pattern(n) as string] as string | undefined) ?? null,", "regionOf: (n) => (_pattern(n) as string | undefined) ?? null,"],
  [ADDS, 'a row of more of the same always says three sets', "addedSets: (n) => parseRx(addedDetailFor(day, n, week, prog), n)?.sets ?? null,", "addedSets: () => null,"],
  [ADDS, 'the sets tag counts the week, not the day', "    week,\n    setCount:", "    week: week + 1,\n    setCount:"],
  // ── Add and remove (sheet-writes.ts) ──
  [WRITES, 'an added move takes its donor\'s dose unshaped', "const detail = _swapDetailFor(name, addedDetailFor(day, name, s.week, s.prog));", "const detail = addedDetailFor(day, name, s.week, s.prog);"],
  [WRITES, 'every add makes a block of its own', "let bucket = (day.sections || []).filter((x) => x._added)[0];", "let bucket = (day.sections || []).filter(() => false)[0];"],
  [WRITES, 'a move is put in the added block twice', "if (!bucket.items.some((it) => it.name === name)) bucket.items.push(", "bucket.items.push("],
  [WRITES, 'the added block is not marked as added', "bucket = { label: 'Added by you', _added: true, items: [] };", "bucket = { label: 'Added by you', items: [] };"],
  [WRITES, 'the added block reads Added', "bucket = { label: 'Added by you', _added: true, items: [] };", "bucket = { label: 'Added', _added: true, items: [] };"],
  [WRITES, 'an added move is not marked as the athlete\'s', "bucket.items.push({ name, detail, _addedByUser: true });", "bucket.items.push({ name, detail });"],
  [WRITES, 'an add stores no record', "  addAddEdit(s.store, s.prog.id, s.week, s.dayKey, name, detail, now);\n", ''],
  [WRITES, 'an add is stamped a millisecond late', "name, detail, now);", "name, detail, now + 1);"],
  [WRITES, 'an add is stored under the day before its week', "addAddEdit(s.store, s.prog.id, s.week, s.dayKey, name, detail, now);", "addAddEdit(s.store, s.prog.id, s.week - 1, s.dayKey, name, detail, now);"],
  [WRITES, 'an add does not renew the day\'s snapshot', "name, detail, now);\n  resnapshotDay(s);", "name, detail, now);"],
  [WRITES, 'an add\'s toast leaves out the dose', "return name + ' added at ' + detail + '.';", "return name + ' added.';"],
  [WRITES, 'remove takes the move out of the plan too', "    if (!sec._added) return;\n", ''],
  [WRITES, 'remove empties the added block', "sec.items = (sec.items || []).filter((it) => !(it && it.name === name));", "sec.items = [];"],
  [WRITES, 'a block left empty stays on the card', "  day.sections = (day.sections || []).filter((sec) => !(sec._added && !(sec.items || []).length));\n", ''],
  [WRITES, 'remove drops no record', "  dropAddEdit(s.store, s.prog.id, s.week, s.dayKey, name);\n", ''],
  [WRITES, 'remove does not renew the day\'s snapshot', "name);\n  resnapshotDay(s);\n  return name + ' removed.';", "name);\n  return name + ' removed.';"],
  [WRITES, 'remove says the move is off the card', "return name + ' removed.';", "return name + ' is off the card.';"],
  // ── The 1RM card's estimate and its save ──
  [WRITES, 'no reps is read as three', "parseInt(reps) || 1);", "parseInt(reps) || 3);"],
  [WRITES, 'the weight is read as a whole number', "return epley(parseFloat(weight) || 0,", "return epley(parseInt(weight) || 0,"],
  [WRITES, 'a save of nothing still writes and says so', "  if (!(v > 0)) return { estimate: v, saved: null };\n", ''],
  [WRITES, 'the save leaves the stored program\'s max alone', "    p.cfg[lift] = v;\n", ''],
  [WRITES, 'the save leaves the program in hand alone', "    if (active && active.cfg) active.cfg[lift] = v;\n", ''],
  [WRITES, 'the save does not store the programs', "    writePrograms(s.store, programs as never);\n", ''],
  [WRITES, 'the save writes the first stored program, whichever is in hand', "const p = programs.filter((x) => x && x.id === s.prog.id)[0];", "const p = programs[0];"],
  [WRITES, 'the saved line always says lbs', "' ' + unit + '.' };", "' lbs.' };"],
  [WRITES, 'the saved line reads starts from', "saved: 'Saved. Your next block anchors off '", "saved: 'Saved. Your next block starts from '"],
  // ── The blocks the screen draws (sheet-screen.ts) ──
  [SCREEN, 'the jog is left undrawn', "['also', 'wildcard', 'nudge',", "['wildcard', 'nudge',"],
  [SCREEN, 'the Wildcard tag is left undrawn', "['also', 'wildcard', 'nudge',", "['also', 'nudge',"],
  [SCREEN, 'the 1RM card is left undrawn', "'sections', 'e1rm', 'cardio',", "'sections', 'cardio',"],
  // ── The second session's wiring (SessionSheet.tsx) ──
  [SHEET, 'the add button opens nothing', "hitSlop={8} onPress={openAdd}", "hitSlop={8} onPress={() => {}}"],
  [SHEET, 'the add button reads Add', ">Exercise</Text>", ">Add</Text>"],
  [SHEET, 'a day with nothing to add to says nothing', "if (sheet) setAdd(sheet); else say('Nothing to add to here');", "if (sheet) setAdd(sheet);"],
  [SHEET, 'a pick does not draw the sheet again', "const toast = addMove(session, name, Date.now());\n    if (toast === null) return;\n    redraw();\n", "const toast = addMove(session, name, Date.now());\n    if (toast === null) return;\n"],
  [SHEET, 'a pick raises no toast', "    redraw();\n    say(toast);\n  };\n  const saveMax", "    redraw();\n  };\n  const saveMax"],
  [SHEET, 'a pick is stamped with no instant of its own', "addMove(session, name, Date.now());", "addMove(session, name, 0);"],
  [SHEET, 'no add sheet is drawn over the sheet', "      {add && <AddSheet palette={p} view={add} calm={calm} onPick={added} onClose={() => setAdd(null)} />}\n", ''],
  [SHEET, 'the add sheet\'s pick is handed nowhere', "onPick={added} onClose={() => setAdd(null)}", "onPick={() => {}} onClose={() => setAdd(null)}"],
  [SHEET, 'the add sheet never closes', "onPick={added} onClose={() => setAdd(null)}", "onPick={added} onClose={() => {}}"],
  [SHEET, 'an added move\'s remove calls nothing', "onPress={() => h.remove(x.name)}", "onPress={() => {}}"],
  [SHEET, 'a remove does not draw the sheet again', "const toast = removeAdded(session, name);\n      if (toast === null) return;\n      redraw();\n", "const toast = removeAdded(session, name);\n      if (toast === null) return;\n"],
  [SHEET, 'an added move\'s remove reads delete', ">remove</Text>", ">delete</Text>"],
  [SHEET, 'an added move no longer says the athlete added it', "<Text style={[s.bold, { color: p.signal }]}>You added this</Text>{' · not in the plan'}</Text>", "<Text style={[s.bold, { color: p.signal }]}>Added</Text></Text>"],
  [SHEET, 'the jog\'s Edit cardio takes a press', "<View style={[s.alsoBtn, { borderColor: p.border2 }]}><Text style={[s.alsoBtnText, { color: p.text }]}>Edit cardio</Text></View>", "<Pressable onPress={() => {}} style={[s.alsoBtn, { borderColor: p.border2 }]}><Text style={[s.alsoBtnText, { color: p.text }]}>Edit cardio</Text></Pressable>"],
  [SHEET, 'the jog\'s lines are not drawn', "                {blk.lines.map((l, i) => <Text key={i} style={[s.alsoLine, { color: p.run }]}>{l}</Text>)}\n", ''],
  [SHEET, 'the jog\'s label is not drawn', "                <Text style={[s.alsoLbl, { color: p.muted }]}>{blk.label}</Text>\n", ''],
  [SHEET, 'the Wildcard tag reads Wildcard', ">Wildcard done</Text>", ">Wildcard</Text>"],
  [SHEET, 'the Wildcard tag\'s words are not drawn', "                  <Text style={[s.wcSub, { color: p.muted }]}>{blk.sub}</Text>\n", ''],
  [SHEET, 'the day\'s note is drawn with its markup', "{plain(blk.html)}</Text>;", "{blk.html}</Text>;"],
  [SHEET, 'the 1RM card saves the bench, whatever the day tests', "saveMax(blk.card.lift, weight, reps)", "saveMax('bench', weight, reps)"],
  [SHEET, 'the 1RM card\'s save says pounds on a kilogram program', "return saveTestMax(session, lift, unit, weight, reps); };", "return saveTestMax(session, lift, 'lbs', weight, reps); };"],
  [SHEET, 'the 1RM card\'s estimate starts at the logged set\'s', "const [estimate, setEstimate] = useState(0);", "const [estimate, setEstimate] = useState(1);"],
  [SHEET, 'the 1RM card opens on three reps, whatever was logged', "const [reps, setReps] = useState(c.reps);", "const [reps, setReps] = useState(3);"],
  [SHEET, 'the 1RM card opens with no weight, whatever was logged', "const [weight, setWeight] = useState(c.weight);", "const [weight, setWeight] = useState('');"],
  [SHEET, 'a weight typed does not move the estimate', "{ setWeight(t); setEstimate(e1rmEstimate(t, String(reps))); };", "{ setWeight(t); };"],
  [SHEET, 'reps picked do not move the estimate', "{ setReps(n); setEstimate(e1rmEstimate(weight, String(n))); };", "{ setReps(n); };"],
  [SHEET, 'the card shows its saved line when nothing was saved', "if (r.saved !== null) setSaved(r.saved);", "setSaved(r.saved || 'Saved.');"],
  [SHEET, 'the save button stays after a save', "{saved\n        ? <Text testID=\"sheet-max-saved\"", "{false\n        ? <Text testID=\"sheet-max-saved\""],
  [SHEET, 'the 1RM card offers six reps', "{[1, 2, 3, 4, 5].map((n) => (", "{[1, 2, 3, 4, 5, 6].map((n) => ("],
  [SHEET, 'the save button reads Save max', "{'Save as new ' + c.liftLabel + ' max'}", "{'Save ' + c.liftLabel + ' max'}"],
  [SHEET, 'the 1RM card\'s hint says RPE 9', "A single at RPE 9.5 works too.", "A single at RPE 9 works too."],
  [SHEET, 'the 1RM card reads One rep max', ">Estimated 1RM</Text><Text style={[s.e1rmSmall", ">One rep max</Text><Text style={[s.e1rmSmall"],
  [SHEET, 'the 1RM card\'s number is labelled Estimate', "<Text style={[s.e1rmOutLbl, { color: p.muted }]}>Estimated 1RM</Text>", "<Text style={[s.e1rmOutLbl, { color: p.muted }]}>Estimate</Text>"],
  // ── The add sheet's screen (add-sheet/AddSheet.tsx) and its model's copy ──
  [ADDSHEET, 'a row tapped hands no pick on', "onPress={() => leave(() => onPick(r.name))}", "onPress={() => leave()}"],
  [ADDSHEET, 'a second tap while the add sheet leaves picks again', "    if (leaving.current) return;\n    leaving.current = true;\n    if (before) before();", "    if (before) before();\n    if (leaving.current) return;\n    leaving.current = true;"],
  [ADDSHEET, 'the add sheet\'s Back does not leave', "hitSlop={12} onPress={() => leave()}>", "hitSlop={12} onPress={() => {}}>"],
  [ADDSHEET, 'work the day has none of is drawn under more of the same too', "{v.more.map((r, k) => row(r, k, 'more'))}", "{v.gap.map((r, k) => row(r, k, 'more'))}"],
  [ADDSHEET, 'another region\'s rows are not drawn', "            {v.off.map((r, k) => row(r, k, 'off'))}\n", ''],
  [ADDSHEET, 'the foot stands on a sheet with nothing to offer in its first list', "const none = !v.gap.length && !v.more.length && !v.off.length;", "const none = !v.gap.length;"],
  [ADDSHEET, 'the empty words and the foot change places', "{none\n          ? <Text testID=\"add-empty\"", "{!none\n          ? <Text testID=\"add-empty\""],
  [ADDSHEET, 'a row\'s note is not drawn', "      {!!r.note && <Text style={[s.candNote, { color: p.signal }]}>{r.note}</Text>}\n", ''],
  [ADDSHEET, 'the add sheet is headed Add a move', ">Add an exercise</Text>", ">Add a move</Text>"],
  [ADDSHEET, 'the add sheet\'s title is not the day\'s', "{v.title}</Text>", "{v.weekTag}</Text>"],
  [ADDSHEET, 'the sets tag is not drawn', "          <Text style={tag}>{v.setsTag}</Text>\n", ''],
  [ADDSHEET, 'the region tag is not drawn', "          <Text style={tag}>{v.regionTag}</Text>\n", ''],
  [ADDSHEET, 'the line under the tags is gone', ">Added work matches the closest thing to it in your week.</Text>", "></Text>"],
  [ADDSHEET, 'the first list is headed New work', ">Today isn't training these</Text>", ">New work</Text>"],
  [ADDSHEET, 'the first list\'s line is gone', "            <Text style={[s.secSub, { color: p.muted }]}>Work your day has no movement for yet.</Text>\n", ''],
  [ADDSHEET, 'the second list is headed More', "{caution(\"More of what you're already doing\")}", "{caution('More')}"],
  [ADDSHEET, 'the second list no longer warns of stacked fatigue', "Adding here stacks fatigue on the same tissue.</Text>", "</Text>"],
  [ADDSHEET, 'the third list is headed Other work', "{caution('Not what today is for')}", "{caution('Other work')}"],
  [ADDSHEET, 'the third list no longer says what to watch', "Fine once, but watch what it lands next to.</Text>", "</Text>"],
  [ADDSHEET, 'the empty words are shorter', ">Nothing left in your kit that isn't already on this card.</Text>", ">Nothing left in your kit.</Text>"],
  [ADDSHEET, 'the foot no longer says next week is unchanged', " Next week says what it always said.</Text>", "</Text>"],
  [ADDMODEL, 'the add sheet model\'s copy says Sets rise to', "'Your day already has this pattern. Sets go to '", "'Your day already has this pattern. Sets rise to '"],
  [ADDMODEL, 'the add sheet model\'s copy counts a skipped move\'s sets', "      if (!it || it._skipped) return;\n", "      if (!it) return;\n"],
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
  say.push('# The Expo app\'s session sheet: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-session-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-session-sheet_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-session-sheet_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
