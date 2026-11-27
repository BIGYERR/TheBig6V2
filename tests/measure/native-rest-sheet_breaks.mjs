// native-rest-sheet: when one rule of the Expo app's rest day sheet or of its mile nudge is broken, which test
// files go red? Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of
// where the sheet opens, what Move offers and warns of, the face and the record, and the words of the two views
// (frontends/native/src/rest-sheet/rest-sheet-model.ts), of the three writes (rest-writes.ts), of the nudge between
// the store and the screen (mile-nudge/nudge-screen.ts), of a model that is today's file (mile-nudge-model.ts), or of
// the screens' drawing and wiring (RestSheet.tsx, MileNudge.tsx, App.tsx, ThisWeek.tsx, SessionSheet.tsx). The fast
// files are run on each, and the ten program sweep only on a break they let through; the files and tests that turn
// red are counted. A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-rest-sheet_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-rest-sheet_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-rest-sheet_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-rest-sheet_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-rest-sheet_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-rest-sheet_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-rest-sheet.test.ts', 'unit/native-look.test.ts', 'integration/native-rest-sheet.test.ts'];
const SLOW = ['sweeps/native-rest-sheet.test.ts'];
const N = 'frontends/native/src/';
const MODEL = N + 'rest-sheet/rest-sheet-model.ts', WRITES = N + 'rest-sheet/rest-writes.ts', SHEET = N + 'rest-sheet/RestSheet.tsx';
const NSCREEN = N + 'mile-nudge/nudge-screen.ts', NUDGE = N + 'mile-nudge/MileNudge.tsx', NMODEL = N + 'mile-nudge/mile-nudge-model.ts';
const APP = N + 'App.tsx', WEEK = N + 'this-week/ThisWeek.tsx', SESSION = N + 'day-detail/SessionSheet.tsx';

const TAIL = "const d = new Date(mon); d.setDate(mon.getDate() + (w - 1) * 7 + idx); d.setHours(0, 0, 0, 0);\n  const today = new Date(now); today.setHours(0, 0, 0, 0);\n  return d <= today;\n}\n";
const JOG_END = TAIL + "/** The page's restDayEligible", DAY_END = TAIL + '/** One session Move offers. */';
const NUDGE_LINE = "      {nudge && <MileNudge palette={p} text={nudgeText(nudge.offer)} calm={calm} onUpdate={() => answered(true)} onKeep={() => answered(false)} />}\n";

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  // ── The record and the face (rest-sheet-model.ts) ──
  [MODEL, "a record needs a time and a distance", "(+r.mins! > 0 || +r.dist! > 0));\n}\n/** The page's _restRec", "(+r.mins! > 0 && +r.dist! > 0));\n}\n/** The page's _restRec"],
  [MODEL, "the face is seeded with no time", "mins: r && +r.mins! > 0 ? String(r.mins) : '',", "mins: '',"],
  [MODEL, "the face shows a walk's distance", "dist: r && d.type !== 'walk' && +r.dist! > 0 ? String(r.dist) : '',", "dist: r && +r.dist! > 0 ? String(r.dist) : '',"],
  [MODEL, "the face is seeded with no effort", "rpe: r && r.rpe != null && r.rpe !== '' && isFinite(+r.rpe) ? +r.rpe : null,", "rpe: null,"],
  [MODEL, "an effort stored empty reads as zero", "rpe: r && r.rpe != null && r.rpe !== '' && isFinite(+r.rpe) ? +r.rpe : null,", "rpe: r && r.rpe != null && isFinite(+r.rpe) ? +r.rpe : null,"],
  [MODEL, "a number below zero counts", "  return n > 0 ? n : 0;", "  return n ? n : 0;"],
  [MODEL, "the face is the record whatever its time", "  return restNum(d.mins) === restNum(r.mins)\n", "  return true\n"],
  [MODEL, "the face is the record whatever its distance", "&& (d.type === 'walk' || restNum(d.dist) === restNum(r.dist))", "&& (d.type !== '' || restNum(d.dist) === restNum(r.dist))"],
  [MODEL, "a walk compares its distance", "&& (d.type === 'walk' || restNum(d.dist) === restNum(r.dist))", "&& (restNum(d.dist) === restNum(r.dist))"],
  [MODEL, "the face is the record whatever its effort", "    && rp(d.rpe) === rp(r.rpe);", "    && true;"],
  // ── Where the sheet opens ──
  [MODEL, "a day before the start takes a jog", "  if (dayBeforeStart(prog as ReadProgram, w, dayKey)) return false;\n  const day = dayOf(prog, w, dayKey);\n  if (!day) return false;", "  const day = dayOf(prog, w, dayKey);\n  if (!day) return false;"],
  [MODEL, "a day before the start takes a move", "  if (dayBeforeStart(prog as ReadProgram, w, dayKey)) return false;\n  const day = dayOf(prog, w, dayKey);\n  if (!day || !day.rest", "  const day = dayOf(prog, w, dayKey);\n  if (!day || !day.rest"],
  [MODEL, "a training day with no jog opens", "  if (!day.rest && !Object.keys(restHeld(logs, w, dayKey)).length) return false;\n", ""],
  [MODEL, "a training day never opens, jog or none", "  if (!day.rest && !Object.keys(restHeld(logs, w, dayKey)).length) return false;\n", "  if (!day.rest) return false;\n"],
  [MODEL, "a rest day that has not come takes a jog", JOG_END, JOG_END.replace('return d <= today;', 'return true;')],
  [MODEL, "today's rest day takes no jog", JOG_END, JOG_END.replace('return d <= today;', 'return d < today;')],
  [MODEL, "a jog's day is counted a week late", JOG_END, JOG_END.replace('(w - 1) * 7', 'w * 7')],
  [MODEL, "a rest day that has not come takes a move", DAY_END, DAY_END.replace('return d <= today;', 'return true;')],
  [MODEL, "today's rest day takes no move", DAY_END, DAY_END.replace('return d <= today;', 'return d < today;')],
  [MODEL, "a move's day is counted a week late", DAY_END, DAY_END.replace('(w - 1) * 7', 'w * 7')],
  [MODEL, "a move lands on a training day", "  if (!day || !day.rest || day.moved) return false;", "  if (!day || day.moved) return false;"],
  [MODEL, "a move lands on a day a session left", "  if (!day || !day.rest || day.moved) return false;", "  if (!day || !day.rest) return false;"],
  [MODEL, "with no program the door says the day has not come", "  if (!prog) return { toast: REST_TOASTS.none };", "  if (!prog) return { toast: REST_TOASTS.future };"],
  [MODEL, "a day that has not come opens", "  if (!restJogEligible(prog, logs, w, dayKey, now)) return { toast: REST_TOASTS.future };\n", ""],
  [MODEL, "a day that takes no move opens on Move", "view: canMove ? view : 'cardio',", "view: view,"],
  [MODEL, "Move is opened whatever was asked", "view: canMove ? view : 'cardio',", "view: canMove ? 'move' : 'cardio',"],
  [MODEL, "the sport is the program's first whatever holds a record", "  const type = Object.keys(held).find((t) => restIsRec(held[t])) || types[0] || 'run';", "  const type = types[0] || 'run';"],
  [MODEL, "an emptied record names the sport", "Object.keys(held).find((t) => restIsRec(held[t])) || types[0] || 'run';", "Object.keys(held).find((t) => !!held[t]) || types[0] || 'run';"],
  [MODEL, "with no sport the face is a walk", "|| types[0] || 'run';", "|| types[0] || 'walk';"],
  [MODEL, "the sheet opens with a face not seeded", "  return { draft: restSeed({ w, day: dayKey,", "  return { draft: ((x: RestDraft, _h: unknown): RestDraft => x)({ w, day: dayKey,"],
  [MODEL, "the sheet opens with Clear armed", "pick: null, armed: false, type,", "pick: null, armed: true, type,"],
  // ── What Move offers ──
  [MODEL, "a rest day is offered as a session", "    if (!day || day.rest || day.moved || day.movedFrom) return;", "    if (!day || day.moved || day.movedFrom) return;"],
  [MODEL, "a day a session moved onto is offered again", "    if (!day || day.rest || day.moved || day.movedFrom) return;", "    if (!day || day.rest || day.moved) return;"],
  [MODEL, "a day marked done is offered", "    if (comp[k]) return;\n", ""],
  [MODEL, "a day with an effort logged is offered", "if (lg && (lg['rpe'] || lg['notes']", "if (lg && (lg['notes']"],
  [MODEL, "a day with a note is offered", "lg['notes'] || lg['swapTo']", "lg['swapTo']"],
  [MODEL, "a swapped day is offered", "lg['swapTo'] || lg['parked']", "lg['parked']"],
  [MODEL, "a day with parked numbers is offered", "lg['parked'] || Object.keys(CARDIO_PARK_FIELDS)", "Object.keys(CARDIO_PARK_FIELDS)"],
  [MODEL, "a day with a logged field is offered", "CARDIO_PARK_FIELDS[s]!.some((f) => !!lg[f])", "CARDIO_PARK_FIELDS[s]!.some((f) => !!lg[f] && false)"],
  [MODEL, "only a run's fields count as logged", "Object.keys(CARDIO_PARK_FIELDS).some((s)", "['run'].some((s)"],
  [MODEL, "a session with no title is not named Training", "title: day.title || 'Training' });", "title: day.title || 'Session' });"],
  [MODEL, "a session's day is printed as its key", "out.push({ day: d, label: DAY_FULL[d] || d, title: day.title || 'Training' });", "out.push({ day: d, label: d, title: day.title || 'Training' });"],
  // ── The spacing warning ──
  [MODEL, "one stray move makes a region day", "  return n >= 2 ? best : null;", "  return n >= 1 ? best : null;"],
  [MODEL, "a rest day has a region", "  if (!day || day.rest || !Array.isArray(day.sections)) return null;", "  if (!day || !Array.isArray(day.sections)) return null;"],
  [MODEL, "a tie goes to the last region met", "if (tally[r]! > n) { n = tally[r]!; best = r; }", "if (tally[r]! >= n) { n = tally[r]!; best = r; }"],
  [MODEL, "the day before is not read", "  [-1, 1].forEach((off) => {", "  [1].forEach((off) => {"],
  [MODEL, "the day after is not read", "  [-1, 1].forEach((off) => {", "  [-1].forEach((off) => {"],
  [MODEL, "a neighbour of another region collides", "    if (dayRegion(d) === reg) out.push(", "    if (dayRegion(d) !== null) out.push("],
  [MODEL, "a neighbour with no title is not named", "title: d.title || 'that session' });", "title: d.title || 'the session' });"],
  // ── The taps that write nothing ──
  [MODEL, "a picked row is not held", "export function pickSession(d: RestDraft, day: string): RestDraft { return { ...d, pick: day }; }", "export function pickSession(d: RestDraft, day: string): RestDraft { void day; return { ...d }; }"],
  [MODEL, "Log cardio instead stays on Move", "export function toCardio(d: RestDraft): RestDraft { return { ...d, view: 'cardio' }; }", "export function toCardio(d: RestDraft): RestDraft { return { ...d }; }"],
  [MODEL, "a chip keeps the last sport's face", "return restSeed({ ...d, type: t, armed: false }, held); }", "void held; return { ...d, type: t, armed: false }; }"],
  [MODEL, "a chip leaves Clear armed", "return restSeed({ ...d, type: t, armed: false }, held); }", "return restSeed({ ...d, type: t }, held); }"],
  [MODEL, "the selected effort stays on a second tap", "return { ...d, rpe: d.rpe != null && +d.rpe === v ? null : v }; }", "return { ...d, rpe: v }; }"],
  [MODEL, "a wheel's time is dropped", "  if (id === 'rest_mins') return { ...d, mins: value };", "  if (id === 'rest_mins') return { ...d };"],
  [MODEL, "a wheel's distance lands on the time", "  if (id === 'rest_dist') return { ...d, dist: value };", "  if (id === 'rest_dist') return { ...d, mins: value };"],
  // ── Move a session here, its words ──
  [MODEL, "Move's line over its name", "kicker: dayName + ' · Training anyway',", "kicker: dayName + ' · Training',"],
  [MODEL, "Move's name", "title: 'Move a session here',", "title: 'Move a session',"],
  [MODEL, "Move's sentence", "intro: 'Nothing gets added. Whatever you pick moves to '", "intro: 'Nothing is added. Whatever you pick moves to '"],
  [MODEL, "Nothing left to move, its name", "none: { title: 'Nothing left to move',", "none: { title: 'Nothing to move',"],
  [MODEL, "Nothing left to move, its words", "sub: 'Every session this week is logged or done. Take the rest, or log some cardio instead.',", "sub: 'Every session this week is logged or done.',"],
  [MODEL, "Log cardio instead, its words", "button: 'Log cardio instead' },", "button: 'Log cardio' },"],
  [MODEL, "nothing left to move is drawn with sessions left", "  if (!cands.length) {\n    return {", "  if (cands.length > 9) {\n    return {"],
  [MODEL, "Already logged here is not drawn", "  const already = jog.length\n", "  const already = false\n"],
  [MODEL, "Already logged here, its name", "{ title: 'Already logged here',", "{ title: 'Already logged',"],
  [MODEL, "a jog's line keeps its logged", "lines: jog.map((l) => l.replace(' logged', '')),", "lines: jog,"],
  [MODEL, "Already logged here, its sentence", "tail: 'Move a session in and ' + dayName + ' is a double day. Your call.' }", "tail: 'Move a session in and ' + dayName + ' is a double day.' }"],
  [MODEL, "the rows' label", "label: 'Not logged this week', rows,", "label: 'Not logged', rows,"],
  [MODEL, "a row's second line", "desc: c.label + ' · not logged',", "desc: c.label + ' · open',"],
  [MODEL, "no row is marked picked", "sel: d.pick === c.day }));", "sel: false }));"],
  [MODEL, "the warning is never drawn", "    if (hits.length) {", "    if (hits.length > 9) {"],
  [MODEL, "the warning names one neighbour of two", "const names = hits.map((h) => h.label).join(' and ');", "const names = hits[0]!.label;"],
  [MODEL, "the warning's name", "title: 'That’s ' + reg + ' on top of ' + reg,", "title: 'That’s ' + reg + ' over ' + reg,"],
  [MODEL, "the warning's words", "' too. Stack it here and something gives. Your call.' };", "' too. Stack it and something gives. Your call.' };"],
  [MODEL, "the warning reads the rest day as the session", "    const src = dayOf(prog, w, d.pick);", "    const src = dayOf(prog, w, dk);"],
  [MODEL, "Move it here is drawn before a pick", "apply: d.pick ? 'Move it here' : null };", "apply: 'Move it here' };"],
  [MODEL, "Move it here, its words", "apply: d.pick ? 'Move it here' : null };", "apply: d.pick ? 'Move here' : null };"],
  // ── Log cardio, its words ──
  [MODEL, "Walk is not offered", "  if (!types.includes('walk')) types.push('walk');\n", ""],
  [MODEL, "a record's sport has no chip", "  Object.keys(held).forEach((x) => { if (restIsRec(held[x]) && !types.includes(x)) types.splice(types.length - 1, 0, x); });\n", ""],
  [MODEL, "a record's chip stands after Walk", "types.splice(types.length - 1, 0, x); });", "types.push(x); });"],
  [MODEL, "no chip carries a check", "label: (LBL[x] || x) + (restIsRec(held[x]) ? ' ✓' : ''),", "label: (LBL[x] || x),"],
  [MODEL, "a check on a chip whose record is emptied", "label: (LBL[x] || x) + (restIsRec(held[x]) ? ' ✓' : ''),", "label: (LBL[x] || x) + (held[x] ? ' ✓' : ''),"],
  [MODEL, "no chip is marked selected", "sel: t === x }));", "sel: false }));"],
  [MODEL, "the bike's chip", "bike: 'Bike', swim: 'Swim'", "bike: 'Ride', swim: 'Swim'"],
  [MODEL, "the 9 row reads RPE 9", "head: 'RPE ' + v + (v === 9 ? '+' : ''),", "head: 'RPE ' + v,"],
  [MODEL, "an effort's name", "[7, 'Steady', 'Working, sentences getting short']", "[7, 'Moderate', 'Working, sentences getting short']"],
  [MODEL, "an effort's words", "[5, 'Easy', 'Conversational, full sentences']", "[5, 'Easy', 'Conversational']"],
  [MODEL, "no effort is marked selected", "sel: d.rpe != null && +d.rpe === v }));", "sel: false }));"],
  [MODEL, "a bike has no miles wheel", "  if (t === 'run' || t === 'bike') dist =", "  if (t === 'run') dist ="],
  [MODEL, "a swim has no box", "  else if (t === 'row' || t === 'swim') dist =", "  else if (t === 'row') dist ="],
  [MODEL, "the row's box is labelled yards", "label: t === 'row' ? 'Distance (meters)' : 'Distance (yards)',", "label: t === 'swim' ? 'Distance (meters)' : 'Distance (yards)',"],
  [MODEL, "the row's box asks for yards", "placeholder: t === 'row' ? 'meters' : 'yards',", "placeholder: t === 'swim' ? 'meters' : 'yards',"],
  [MODEL, "the row's box steps by 25", "step25: t === 'swim' } };", "step25: t === 'row' } };"],
  [MODEL, "the box does not show the face", "box: { value: d.dist, placeholder:", "box: { value: '', placeholder:"],
  [MODEL, "the miles wheel's label", "dist = { label: 'Distance', wheel:", "dist = { label: 'Miles', wheel:"],
  [MODEL, "the time wheel is a miles wheel", "time: wheelView(IAW_SPEC, 'hms', 'rest_mins', d.mins),", "time: wheelView(IAW_SPEC, 'dist', 'rest_mins', d.mins),"],
  [MODEL, "the time wheel does not show the face", "time: wheelView(IAW_SPEC, 'hms', 'rest_mins', d.mins),", "time: wheelView(IAW_SPEC, 'hms', 'rest_mins', ''),"],
  [MODEL, "the miles wheel writes to the time", "wheelView(IAW_SPEC, 'dist', 'rest_dist', d.dist) };", "wheelView(IAW_SPEC, 'dist', 'rest_mins', d.dist) };"],
  [MODEL, "Noted from RPE 7", "  const note = d.rpe != null && d.rpe >= 9\n", "  const note = d.rpe != null && d.rpe >= 7\n"],
  [MODEL, "Noted, its name", "? { title: 'Noted', sub:", "? { title: 'Note', sub:"],
  [MODEL, "Noted, its words", "Logging it as it happened. Keep an eye on how tomorrow feels.' }", "Logging it as it happened.' }"],
  [MODEL, "Log cardio's line over its name", "kicker: dayName + ' · Log cardio',", "kicker: dayName + ' · Cardio',"],
  [MODEL, "the name with no record", ": 'What did you do?',", ": 'What did you do',"],
  [MODEL, "the name with a record", "title: rec ? 'Your ' + word + ' on ' + dayName :", "title: rec ? 'Your ' + word + ', ' + dayName :"],
  [MODEL, "the name is the record's whatever the day holds", "title: rec ? 'Your ' + word + ' on ' + dayName :", "title: true ? 'Your ' + word + ' on ' + dayName :"],
  [MODEL, "the sentence with a record", "? 'This is what you logged. Roll it to fix it, or clear it if it did not happen.'", "? 'This is what you logged. Roll it to fix it.'"],
  [MODEL, "the sentence with no record", ": 'Easy work on a rest day is recovery, not extra load. This will not touch your program.',", ": 'Easy work on a rest day is recovery, not extra load.',"],
  [MODEL, "the chips' label", "chipsLabel: 'Modality', chips,", "chipsLabel: 'Sport', chips,"],
  [MODEL, "the time's label", "timeLabel: 'Time', time:", "timeLabel: 'Minutes', time:"],
  [MODEL, "the efforts' label", "effortLabel: 'How hard', efforts,", "effortLabel: 'Effort', efforts,"],
  [MODEL, "the button reads Logged with any record", "log: rec && restSame(d, rec) ? 'Logged ✓' : 'Log it',", "log: rec ? 'Logged ✓' : 'Log it',"],
  [MODEL, "the button never reads Logged", "log: rec && restSame(d, rec) ? 'Logged ✓' : 'Log it',", "log: 'Log it',"],
  [MODEL, "Clear is drawn with no record", "clear: rec ? (d.armed ?", "clear: true ? (d.armed ?"],
  [MODEL, "Clear never reads armed", "(d.armed ? 'Tap again to clear' : 'Clear this ' + word)", "(false ? 'Tap again to clear' : 'Clear this ' + word)"],
  [MODEL, "Clear names the sport, not the jog", "  const word = REST_WORD[t] || t;\n  return {\n    kind: 'cardio',", "  const word = t;\n  return {\n    kind: 'cardio',"],
  [MODEL, "Log cardio is drawn for Move", "return d.view === 'move' ? moveView(d, prog, comp, logs) : cardioView(d, prog, logs);", "return d.view === 'cardio' ? moveView(d, prog, comp, logs) : cardioView(d, prog, logs);"],
  [MODEL, "the toast with no program", "none: 'No active program. Tap Set Active or build a new one.',", "none: 'No active program.',"],
  [MODEL, "the toast on a day that has not come", "future: 'That rest day has not come around yet',", "future: 'That rest day has not come yet',"],
  [MODEL, "the toast with no row picked", "pick: 'Pick a session',", "pick: 'Pick a session first',"],
  [MODEL, "the toast on a record rolled to zero", "useClear: 'To remove it, use Clear.',", "useClear: 'Use Clear to remove it.',"],
  [MODEL, "the toast on an empty walk", "emptyWalk: 'Nothing to log yet. Add a time.',", "emptyWalk: 'Nothing to log yet.',"],
  [MODEL, "the toast on an empty face", "empty: 'Nothing to log yet. Add a time or a distance.',", "empty: 'Nothing to log yet. Add a time.',"],
  // ── Move it here (rest-writes.ts) ──
  [WRITES, "a move with no row picked is made", "  if (!pick) return { toast: REST_TOASTS.pick, closed: false };\n", ""],
  [WRITES, "the move is stored under the day it came from", "  moves[dayStoreKey(w, day)] = { from: pick, ts: now };", "  moves[dayStoreKey(w, pick!)] = { from: day, ts: now };"],
  [WRITES, "the move carries no stamp", "  moves[dayStoreKey(w, day)] = { from: pick, ts: now };", "  moves[dayStoreKey(w, day)] = { from: pick };"],
  [WRITES, "the move is not stored", "  s.store.set('ia_moves_' + s.prog.id, JSON.stringify(moves));\n", ""],
  [WRITES, "earlier moves are forgotten", "  const moves = readRestMoves(s.store, s.prog.id);", "  const moves: Record<string, RestMove | null | undefined> = {};"],
  [WRITES, "a moves key that does not read stops the move", "  try { return JSON.parse(store.get('ia_moves_' + programId) || '{}'); } catch { return {}; }", "  return JSON.parse(store.get('ia_moves_' + programId) || '{}');"],
  [WRITES, "the grid in hand is not moved", "  applyRestDayMoves(s.prog as never, moves);\n", ""],
  [WRITES, "the grid is not stored", "  if (i >= 0) { progs[i]!.weeks = s.prog.weeks; writePrograms(s.store, progs as never); }", "  if (i >= 0) { progs[i]!.weeks = s.prog.weeks; }"],
  [WRITES, "the grid is stored on the list's first program", "  const i = progs.findIndex((p) => p.id === s.prog.id);", "  const i = 0;"],
  [WRITES, "the moved toast names the day moved onto", "'Moved. ' + (DAY_FULL[pick] || pick) + ' is your rest now ✓'", "'Moved. ' + (DAY_FULL[day] || day) + ' is your rest now ✓'"],
  [WRITES, "the moved toast's words", "+ ' is your rest now ✓', closed: true };", "+ ' is your rest day now ✓', closed: true };"],
  [WRITES, "a move leaves the sheet open", "+ ' is your rest now ✓', closed: true };", "+ ' is your rest now ✓', closed: false };"],
  // ── Log it ──
  [WRITES, "Logged ✓ unchanged writes again", "  if (rec && restSame(d, rec)) return { toast: null, closed: true };\n", ""],
  [WRITES, "Logged ✓ unchanged leaves the sheet open", "  if (rec && restSame(d, rec)) return { toast: null, closed: true };", "  if (rec && restSame(d, rec)) return { toast: null, closed: false };"],
  [WRITES, "a walk stores its distance", "dd = type === 'walk' ? 0 : restNum(d.dist);", "dd = restNum(d.dist);"],
  [WRITES, "an empty face is logged", "  if (m <= 0 && dd <= 0) return {", "  if (m < 0 && dd < 0) return {"],
  [WRITES, "a distance alone is refused", "  if (m <= 0 && dd <= 0) return {", "  if (m <= 0) return {"],
  [WRITES, "a record rolled to zero says to add a time", "toast: rec ? REST_TOASTS.useClear : (type", "toast: false ? REST_TOASTS.useClear : (type"],
  [WRITES, "an empty walk is told a time or a distance", "(type === 'walk' ? REST_TOASTS.emptyWalk : REST_TOASTS.empty)", "(type === '' ? REST_TOASTS.emptyWalk : REST_TOASTS.empty)"],
  [WRITES, "a refused log closes the sheet", "REST_TOASTS.emptyWalk : REST_TOASTS.empty), closed: false };", "REST_TOASTS.emptyWalk : REST_TOASTS.empty), closed: true };"],
  [WRITES, "the time is stored at zero", "  if (m > 0) o.mins = m;", "  o.mins = m;"],
  [WRITES, "the time is not stored", "  if (m > 0) o.mins = m;\n", ""],
  [WRITES, "the distance is not stored", "  if (dd > 0) o.dist = dd;\n", ""],
  [WRITES, "the effort is not stored", "  if (d.rpe != null && isFinite(+d.rpe)) o.rpe = +d.rpe;\n", ""],
  [WRITES, "another sport's record is dropped", "Object.assign({}, (e['restLog'] as Record<string, unknown>) || {})", "Object.assign({}, {})"],
  [WRITES, "the day's other fields are dropped", "const e: Record<string, unknown> = Object.assign({}, logs[k] || {}),", "const e: Record<string, unknown> = Object.assign({}, {}),"],
  [WRITES, "the face is merged into the record", "  rl[type] = o; e['restLog'] = rl;", "  rl[type] = Object.assign({}, rl[type], o); e['restLog'] = rl;"],
  [WRITES, "the week is not stamped", "e['week'] = w; e['ts'] = now;", "e['ts'] = now;"],
  [WRITES, "the instant is not stamped", "e['week'] = w; e['ts'] = now;", "e['week'] = w;"],
  [WRITES, "the jog is not written", "  (logs as Record<string, unknown>)[k] = e;\n  writeDayLogs(s.store, s.prog.id, logs as never);\n", "  (logs as Record<string, unknown>)[k] = e;\n"],
  [WRITES, "the logged toast's words", "restLogHead(type, o) + ' logged ✓', closed: true };", "restLogHead(type, o) + ' saved ✓', closed: true };"],
  [WRITES, "a log leaves the sheet open", "restLogHead(type, o) + ' logged ✓', closed: true };", "restLogHead(type, o) + ' logged ✓', closed: false };"],
  // ── Clear ──
  [WRITES, "Clear removes on its first tap", "  if (!d.armed) return { toast: null, closed: false, draft: { ...d, armed: true } };\n", ""],
  [WRITES, "Clear never arms", "  if (!d.armed) return { toast: null, closed: false, draft: { ...d, armed: true } };", "  if (!d.armed) return { toast: null, closed: false, draft: { ...d } };"],
  [WRITES, "Clear's first tap closes the sheet", "  if (!d.armed) return { toast: null, closed: false, draft: { ...d, armed: true } };", "  if (!d.armed) return { toast: null, closed: true, draft: { ...d, armed: true } };"],
  [WRITES, "Clear leaves the record", "    delete rl[type];\n", ""],
  [WRITES, "an emptied restLog is kept", "    if (Object.keys(rl).length) n['restLog'] = rl; else delete n['restLog'];", "    n['restLog'] = rl;"],
  [WRITES, "the day's entry is kept with only its week and stamp", "    if (Object.keys(n).every((x) => x === 'week' || x === 'ts')) delete logs[k]; else logs[k] = n;", "    logs[k] = n;"],
  [WRITES, "the day's entry goes whatever else it holds", "    if (Object.keys(n).every((x) => x === 'week' || x === 'ts')) delete logs[k]; else logs[k] = n;", "    delete logs[k];"],
  [WRITES, "Clear writes with no record of that sport", "  if (e && held && held[type]) {", "  if (e && held) {"],
  [WRITES, "the clear is not written", "else logs[k] = n;\n    writeDayLogs(s.store, s.prog.id, logs as never);\n", "else logs[k] = n;\n"],
  [WRITES, "the cleared toast is lower case", "toast: word.charAt(0).toUpperCase() + word.slice(1) + ' cleared',", "toast: word + ' cleared',"],
  [WRITES, "the cleared toast names the sport, not the jog", "  const word = REST_WORD[type] || type;\n  return { toast: word.charAt(0)", "  const word = type;\n  return { toast: word.charAt(0)"],
  [WRITES, "a clear leaves the sheet open", "' cleared', closed: true, draft:", "' cleared', closed: false, draft:"],
  [WRITES, "a clear leaves the draft armed", "closed: true, draft: { ...d, armed: false } };", "closed: true, draft: { ...d } };"],
  // ── The nudge between the store and the screen (nudge-screen.ts) ──
  [NSCREEN, "the wait is not 700 ms", "export const NUDGE_DELAY_MS = 700;", "export const NUDGE_DELAY_MS = 900;"],
  [NSCREEN, "the judge reads no frozen day", "hist: readDayHistory(store, p.id) as unknown as Record<string, DayLike | undefined>,", "hist: {} as unknown as Record<string, DayLike | undefined>,"],
  [NSCREEN, "the judge reads no log", "logs: readDayLogs(store, p.id) as unknown as Record<string, LogLike | undefined>,", "logs: {} as unknown as Record<string, LogLike | undefined>,"],
  [NSCREEN, "the mile judged against is a minute off", "    anchor: info.anchorSec,", "    anchor: info.anchorSec + 60,"],
  [NSCREEN, "the week is the first whatever the date", "    curWeek: Number(goalCurWeek(p, midnight(now))),", "    curWeek: 1,"],
  [NSCREEN, "the program's length is not read", "    totalWeeks: p.totalWeeks || 6,", "    totalWeeks: 99,"],
  [NSCREEN, "a dismissal's record is not read", "    record: p.mileNudge ?? null,", "    record: null,"],
  [NSCREEN, "the implied mile is read off the marathon column", "paceChartLookup('recovery', pace).mile,", "paceChartLookup('marathon', pace).mile,"],
  [NSCREEN, "no offer is handed on", "  return offer ? { offer, progId: p.id } : null;", "  return null;"],
  [NSCREEN, "a program with no run is judged", "  if (!info) return null;\n", ""],
  [NSCREEN, "the record names one card", "cards: [n.offer.cards[0].key, n.offer.cards[1].key],", "cards: [n.offer.cards[0].key],"],
  [NSCREEN, "the record holds the offer, not the mile judged against", "anchor: n.offer.anchor };", "anchor: n.offer.offer };"],
  [NSCREEN, "the record is not stored", "  writePrograms(store, progs as never);\n}", "}"],
  [NSCREEN, "the pencil opens on the stored mile", "  return open && open.kind === 'edit' ? { ...open, ...offerFields(n.offer.offer) } : open;", "  return open;"],
  [NSCREEN, "the pencil holds the mile judged against", "...offerFields(n.offer.offer) }", "...offerFields(n.offer.anchor) }"],
  [NSCREEN, "the lock is given the offer's fields", "  return open && open.kind === 'edit' ? { ...open,", "  return open ? { ...open,"],
  [NMODEL, "the nudge's model is not today's file", "title: 'Two easy runs in a row off the plan.',", "title: 'Two easy runs off the plan.',"],
  // ── The screens (RestSheet.tsx, MileNudge.tsx) ──
  [SHEET, "a closing tap says its toast before what is under the sheet is drawn", "leave(() => { onWrote(); if (r.toast) say(r.toast); });", "leave(() => { if (r.toast) say(r.toast); onWrote(); });"],
  [SHEET, "what is under the sheet is not drawn again", "leave(() => { onWrote(); if (r.toast) say(r.toast); });", "leave(() => { if (r.toast) say(r.toast); });"],
  [SHEET, "a refusal says nothing", "if (!r.closed) { if (r.toast) say(r.toast); return; }", "if (!r.closed) { return; }"],
  [SHEET, "Clear's arming is not held", "    if (r.draft) hold(r.draft);\n", ""],
  [SHEET, "Log reads the face before a wheel has rested", "apply('rest-log', v.log, () => { flush(); done(", "apply('rest-log', v.log, () => { done("],
  [SHEET, "an effort tap does not rest the wheels", "onPress={() => { flush(); hold(tapRpe(", "onPress={() => { hold(tapRpe("],
  [SHEET, "the wheels are not started afresh after an effort", "hold(tapRpe(now.current, e.v)); setDrawn((n) => n + 1); }}", "hold(tapRpe(now.current, e.v)); }}"],
  [SHEET, "the wheels are not started afresh after a chip", "c.type)); setDrawn((n) => n + 1); }}", "c.type)); }}"],
  [SHEET, "a wheel keeps its place across sports", "<Wheel key={w.hiddenId + ':' + draft.type + ':' + drawn}", "<Wheel key={w.hiddenId}"],
  [SHEET, "a row's tap picks nothing", "onPress={() => hold(pickSession(now.current, r.day))}", "onPress={() => {}}"],
  [SHEET, "Move it here moves nothing", "apply('rest-move', v.apply, () => done(applyRestMove(session, now.current, Date.now()), leave))", "apply('rest-move', v.apply, () => {})"],
  [SHEET, "Log cardio instead does nothing", "apply('rest-instead', v.none.button, () => hold(toCardio(now.current)))", "apply('rest-instead', v.none.button, () => {})"],
  [SHEET, "the warning is not drawn", "      {v.warn && note(v.warn, p.red, s.warn)}\n", ""],
  [SHEET, "Already logged here is not drawn by the screen", "      {v.already && note({ title: v.already.title, sub: v.already.lines.concat(v.already.tail).join('\\n') })}\n", ""],
  [SHEET, "nothing left to move is not drawn by the screen", "      {v.none && note(v.none)}\n", ""],
  [SHEET, "Noted is not drawn by the screen", "      {v.note && note(v.note, p.accent)}\n", ""],
  [SHEET, "Clear is not drawn by the screen", "      {v.clear && (\n", "      {false && (\n"],
  [SHEET, "Clear's tap clears nothing", "onPress={() => done(clearRestCardio(session, now.current), leave)}", "onPress={() => {}}"],
  [SHEET, "the box's keys are not held", "onChangeText={(t) => hold(faceInput(now.current, 'rest_dist', t))}", "onChangeText={() => {}}"],
  [SHEET, "a wheel's rest is not held", "onWrite={(id, value) => hold(faceInput(now.current, id, value))}", "onWrite={() => {}}"],
  [SHEET, "the miles wheel is told the time is what its field holds", "held={() => (w.hiddenId === 'rest_mins' ? now.current.mins : now.current.dist)}", "held={() => now.current.mins}"],
  [SHEET, "the screen draws Log cardio for Move", "{view.kind === 'move' ? move(view, leave) : cardio(view, leave)}", "{view.kind !== 'move' ? move(view as never, leave) : cardio(view as never, leave)}"],
  [SHEET, "a note's words are not drawn", "<Text style={[s.effectSub, { color: p.muted }]}>{n.sub}</Text>", "<Text style={[s.effectSub, { color: p.muted }]}>{n.title}</Text>"],
  [SHEET, "an effort's name is not drawn", "{' · ' + e.name}</Text>", "</Text>"],
  [SHEET, "the sheet's pieces stand 12 apart", "  body: { gap: 16 },", "  body: { gap: 12 },"],
  [SHEET, "a row keeps the component sheet's corners", "gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 6 },", "gap: 10, borderWidth: 1, borderRadius: 4, padding: 12, marginBottom: 6 },"],
  [SHEET, "the button is not a pill", "  apply: { borderRadius: 999, padding: 15,", "  apply: { borderRadius: 4, padding: 15,"],
  [SHEET, "a chip is not a pill", "  chip: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999,", "  chip: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 2,"],
  [SHEET, "the line over the name is 11", "  kicker: { fontFamily: DISPLAY, fontSize: 13,", "  kicker: { fontFamily: DISPLAY, fontSize: 11,"],
  [SHEET, "the name asks for a weight the face lacks", "  title: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '700',", "  title: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '800',"],
  [SHEET, "a 13 line is iOS's own height", "  kicker: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },", "  kicker: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },"],
  [NUDGE, "Keep answers as Update mile time", 'testID="mile-nudge-keep" accessibilityRole="button" onPress={onKeep}', 'testID="mile-nudge-keep" accessibilityRole="button" onPress={onUpdate}'],
  [NUDGE, "the nudge's words are not drawn", "{text.body}</Text>", "{text.title}</Text>"],
  [NUDGE, "the nudge's label is not drawn", "{text.label}</Text>", "{''}</Text>"],
  [NUDGE, "Keep reads as Update", "{text.keep}</Text>", "{text.update}</Text>"],
  [NUDGE, "the nudge moves under Reduce Motion", "    if (calm) return;\n    Animated.timing(scrim,", "    Animated.timing(scrim,"],
  [NUDGE, "the nudge rises over a second", "Animated.timing(rise, { toValue: 0, duration: 360,", "Animated.timing(rise, { toValue: 0, duration: 1000,"],
  [NUDGE, "the nudge's name is 26", "  title: { fontFamily: DISPLAY, fontSize: 28,", "  title: { fontFamily: DISPLAY, fontSize: 26,"],
  [NUDGE, "the nudge's sheet has square corners", "borderTopLeftRadius: 24, borderTopRightRadius: 24,", "borderTopLeftRadius: 0, borderTopRightRadius: 0,"],
  [NUDGE, "the nudge's scrim is the swap nudge's", "scrim: { backgroundColor: 'rgba(0,0,0,0.42)' },", "scrim: { backgroundColor: 'rgba(0,0,0,0.78)' },"],
  // ── The wiring (App.tsx, ThisWeek.tsx, SessionSheet.tsx) ──
  [APP, "a refused door says nothing", "    if ('toast' in r) { say(r.toast); return; }", "    if ('toast' in r) { return; }"],
  [APP, "This Week is not drawn again after the rest sheet wrote", "onWrote={() => { setWrites((n) => n + 1); if (rest.wrote) rest.wrote(); }}", "onWrote={() => { if (rest.wrote) rest.wrote(); }}"],
  [APP, "the session sheet under the rest sheet is not drawn again", "onWrote={() => { setWrites((n) => n + 1); if (rest.wrote) rest.wrote(); }}", "onWrote={() => { setWrites((n) => n + 1); }}"],
  [APP, "the rest sheet keeps the last one's face", "<RestSheet key={'rest' + rest.n}", "<RestSheet key={0}"],
  [APP, "the rest sheet is drawn over the toast", [["      {rest && (\n        <RestSheet", "      {false && rest && (\n        <RestSheet"], ["      {over}\n", "      {over}\n      {rest && <RestSheet key={'rest' + rest.n} palette={p} session={{ store: phoneStore, prog: rest.prog }} draft={rest.draft} calm={calm} say={say} onClose={() => setRest(null)} onWrote={() => {}} />}\n"]]],
  [APP, "the nudge is not judged after a Log", "onLogged={(week, dayKey) => logged(sheet.prog.id, week, dayKey)}", "onLogged={() => {}}"],
  [APP, "an offer is not kept for This Week", "    pending.current = offer;\n", ""],
  [APP, "the nudge rises at once", "}, NUDGE_DELAY_MS);", "}, 0);"],
  [APP, "the nudge rises under the session sheet", "  const onWeek = tab === 'week' && (!sheet || going);", "  const onWeek = tab === 'week';"],
  [APP, "the nudge rises on any tab", "  const onWeek = tab === 'week' && (!sheet || going);", "  const onWeek = (!sheet || going);"],
  [APP, "the nudge waits for the sheet to be gone, not going", "  const onWeek = tab === 'week' && (!sheet || going);", "  const onWeek = tab === 'week' && !sheet;"],
  [APP, "a sheet opened in the wait does not stop the wait", "    return () => clearTimeout(t);\n  }, [waits, onWeek]);", "  }, [waits, onWeek]);"],
  [APP, "a sheet opened later still reads as going", "onSheet={(s) => { setGoing(false); setSheet(s); }}", "onSheet={(s) => { setSheet(s); }}"],
  [APP, "an offer rises twice", "const p = pending.current; pending.current = null; if (p) setNudge(p);", "const p = pending.current; if (p) setNudge(p);"],
  [APP, "an answer stores no record", "    answerNudge(phoneStore, n);\n", ""],
  [APP, "the pencil opens before the record is stored", "    answerNudge(phoneStore, n);\n    if (open) setMile(nudgeMile(phoneStore, n, new Date()));", "    if (open) setMile(nudgeMile(phoneStore, n, new Date()));\n    answerNudge(phoneStore, n);"],
  [APP, "Keep opens the pencil", "onKeep={() => answered(false)}", "onKeep={() => answered(true)}"],
  [APP, "Update mile time only closes", "onUpdate={() => answered(true)}", "onUpdate={() => answered(false)}"],
  [APP, "the pencil's rebuilt program is not held by This Week", "onDone={(o) => { if (o.prog) setHeld(o.prog as unknown as DeckProgram); if (o.toast) say(o.toast); }} />", "onDone={(o) => { if (o.toast) say(o.toast); }} />"],
  [APP, "the nudge is drawn over the pop-ups", [[NUDGE_LINE, ""], ["      {pop && <PopUp key={'pop' + pop.n} palette={p} view={pop.view} calm={calm} onAct={answer} onClose={() => setPop(null)} />}\n", "      {pop && <PopUp key={'pop' + pop.n} palette={p} view={pop.view} calm={calm} onAct={answer} onClose={() => setPop(null)} />}\n" + NUDGE_LINE]]],
  [APP, "the nudge is drawn under the toast", [[NUDGE_LINE, ""], ["      {toast && <Toast", NUDGE_LINE + "      {toast && <Toast"]]],
  [WEEK, "Training anyway? asks for Log cardio", "onRest(d.rest!.week, d.rest!.key, 'move')", "onRest(d.rest!.week, d.rest!.key, 'cardio')"],
  [WEEK, "the log link asks for Move", "onRest(d.rest!.week, d.rest!.key, 'cardio')", "onRest(d.rest!.week, d.rest!.key, 'move')"],
  [WEEK, "Training anyway? is drawn on a day a session left", '{d.rest.anyway && <Text testID="rest-anyway"', '{true && <Text testID="rest-anyway"'],
  [WEEK, "the rest card's links reach no sheet", "onRest={(week, key, view) => { if (prog) { hand.own = week; onRest({ prog: prog as unknown as RestProgram, week, dayKey: key, view }); } }}", "onRest={() => {}}"],
  [SESSION, "Edit cardio asks for Move", "dayKey: open.dayKey, view: 'cardio' }, () => redraw());", "dayKey: open.dayKey, view: 'move' }, () => redraw());"],
  [SESSION, "the session sheet is not drawn again after the rest sheet wrote", "view: 'cardio' }, () => redraw()); }}", "view: 'cardio' }, () => {}); }}"],
  [SESSION, "the app is not told of a Log", "      onLogged(open.week, open.dayKey);\n", ""],
  [SESSION, "the app is told of a Log before it is stored", [["      onLogged(open.week, open.dayKey);\n", ""], ["      const toast = logCardio(session, formNow.current, cardioNow.current, Date.now());\n", "      onLogged(open.week, open.dayKey);\n      const toast = logCardio(session, formNow.current, cardioNow.current, Date.now());\n"]]],
  [SESSION, "the sheet does not say it is going", "    onGoing();\n", ""],
  // ── Found by the first part (a wiring line, or a piece's condition, that no test read) ──
  [APP, "This Week's links reach no sheet in the app", "onRest={(ask) => askRest(ask)} onLaunch", "onRest={() => {}} onLaunch"],
  [APP, "the session sheet's Edit cardio reaches no sheet in the app", "onRest={askRest} onLogged=", "onRest={() => {}} onLogged="],
  [APP, "an opened door draws no sheet", "    setRest((was) => ({ prog: ask.prog, draft: r.draft, wrote, n: was ? was.n + 1 : 1 }));\n", ""],
  [APP, "what to draw again under the sheet is dropped at the door", "draft: r.draft, wrote, n: was ? was.n + 1 : 1 }));", "draft: r.draft, wrote: null, n: was ? was.n + 1 : 1 }));"],
  [APP, "the sheet is handed the launch's draft, not the door's", "prog: rest.prog }} draft={rest.draft} calm", "prog: rest.prog }} draft={{ ...rest.draft, view: 'cardio' }} calm"],
  [APP, "the nudge's pencil never closes", "open={mile} calm={calm} say={say} onClose={() => setMile(null)}", "open={mile} calm={calm} say={say} onClose={() => {}}"],
  [SHEET, "Log cardio instead is drawn with sessions left", "{v.none && apply('rest-instead',", "{apply('rest-instead',"],
  [SHEET, "the rows' label is drawn with nothing to move", "{!v.none && <Text style={[s.label,", "{<Text style={[s.label,"],
  [SHEET, "Move it here is drawn before a pick by the screen", "{v.apply && apply('rest-move',", "{apply('rest-move',"],
  [SHEET, "the box is drawn as a wheel", "{v.dist && ('wheel' in v.dist ? wheel(v.dist.wheel) : (", "{v.dist && ('box' in v.dist ? wheel(v.dist.wheel) : ("],
  [SHEET, "a picked row carries no check", "{r.sel && <Text style={[s.eqChk,", "{false && <Text style={[s.eqChk,"],
  [WEEK, "the day's cards are handed no rest link", "function Days({ d, p, onPick, onStart, onReopen, onCardio, onRest }: {", "function Days({ d, p, onPick, onStart, onReopen, onCardio }: {"],
  // ── Found by the measure beside today's own sheet in the simulator's Safari (the look) ──
  [N + 'day-detail/Wheel.tsx', "a wheel's caption is the component sheet's 10", "cap: { fontFamily: DISPLAY, fontSize: 12,", "cap: { fontFamily: DISPLAY, fontSize: 10,"],
  [N + 'program-list/SheetFrame.tsx', "a sheet's Back is iOS's own height", "fontWeight: '700', paddingBottom: 2.3 },", "fontWeight: '700' },"],
  [SHEET, "the sentence under the name keeps 19.5", "fontSize: 13, lineHeight: 19, marginTop: 6,", "fontSize: 13, lineHeight: 19.5, marginTop: 6,"],
  [SHEET, "the name's line keeps 26.4", "lineHeight: 26, marginTop: 4, marginBottom: -1.4 },", "lineHeight: 26.4, marginTop: 4 },"],
  [SHEET, "a note's words sit 0.7 low", "paddingBottom: 1.5, marginBottom: 2.3 },", "paddingBottom: 1.5, marginBottom: 3 },"],
  [NUDGE, "the nudge's words keep 21.75", "fontSize: 15, lineHeight: 21, marginTop: 4", "fontSize: 15, lineHeight: 21.75, marginTop: 4"],
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
  say.push('# The Expo app\'s rest day sheet and mile nudge: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-rest-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-rest-sheet_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-rest-sheet_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
