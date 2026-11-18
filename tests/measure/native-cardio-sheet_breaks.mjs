// native-cardio-sheet: when one rule of the Expo app's cardio sheet or rest timer is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the wheels
// (frontends/native/src/day-detail/wheels.ts), of what a rolled wheel, the stepper, Log and the sport picker hold and
// write (cardio-log.ts, and the picker's park in sheet-writes.ts), of the sheet drawn for one cardio alone
// (sheet-screen.ts and the model's copy), of the screens' wiring and words (SessionSheet.tsx, CardioLogBlock.tsx,
// Wheel.tsx, this-week/ThisWeek.tsx, App.tsx), or of the rest timer (rest-timer/). The fast files are run on each; the
// ten-program sweep is run only on a break the fast files let through. A break no file turns red on is a rule no
// test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-cardio-sheet_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-cardio-sheet_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-cardio-sheet_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-cardio-sheet_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-cardio-sheet_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-cardio-sheet_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-cardio-sheet.test.ts', 'integration/native-cardio-sheet.test.ts', 'unit/native-session-sheet.test.ts', 'unit/native-deck.test.ts', 'unit/native-shell.test.ts'];
const SLOW = ['sweeps/native-cardio-sheet.test.ts'];
const D = 'frontends/native/src/day-detail/';
const WHEELS = D + 'wheels.ts', LOG = D + 'cardio-log.ts', WRITES = D + 'sheet-writes.ts', SCREEN = D + 'sheet-screen.ts', MODEL = D + 'cardio-sheet-model.ts';
const SHEET = D + 'SessionSheet.tsx', BLOCK = D + 'CardioLogBlock.tsx', WHEEL = D + 'Wheel.tsx';
const WEEK = 'frontends/native/src/this-week/ThisWeek.tsx', APP = 'frontends/native/src/App.tsx';
const R = 'frontends/native/src/rest-timer/';
const CLOCK = R + 'rest-clock.ts', TIMER = R + 'RestTimer.tsx', RMODEL = R + 'rest-timer-model.ts';

/**
 * [the file, the rule broken, the text it replaces (once in the file), its replacement]. A rule the code keeps in two
 * places is broken in both: its third entry is then a list of [text, replacement] pairs.
 */
const BREAKS = [
  // ── The wheels' rules ──
  [WHEELS, 'a wheel row is 40 points', "export const WHEEL_ROW = 44;", "export const WHEEL_ROW = 40;"],
  [WHEELS, 'a wheel is read 200 ms after it last moved', "export const WHEEL_SETTLE_MS = 90;", "export const WHEEL_SETTLE_MS = 200;"],
  [WHEELS, 'a blank time lands on a dash', "    if (!mh || mh[0] === '') return ['0', '0', '0'];", "    if (!mh || mh[0] === '') return ['', '', ''];"],
  [WHEELS, 'a stored time is read to the minute, its seconds dropped', "let t = Math.round(parseFloat(mh[0]) * 60);", "let t = Math.round(parseFloat(mh[0])) * 60;"],
  [WHEELS, 'a time over the dial is not pegged at its ceiling', "    t = Math.min(t, sp.cols[0]!.max * 3600 + sp.cols[1]!.max * 60 + sp.cols[2]!.max);\n", ""],
  [WHEELS, 'a blank pace lands on 4:00', "if (!s) return kind === 'pace' ? ['', ''] : ", "if (!s) return kind === 'pace' ? ['4', '0'] : "],
  [WHEELS, 'blank miles land on a dash', "(sp.fmt === 'dec3' ? ['0', '0', '0'] : ['0', '0']);", "(sp.fmt === 'dec3' ? ['', '', ''] : ['0', '0']);"],
  [WHEELS, 'whole miles are not held to 99', "const a3 = Math.max(sp.cols[0]!.min, Math.min(sp.cols[0]!.max, +m3[1]!));", "const a3 = +m3[1]!;"],
  [WHEELS, 'the hundredths of stored miles are dropped', "c3 = m3[3] == null ? 0 : +m3[3];", "c3 = 0;"],
  [WHEELS, 'a malformed rep time lands on a dash', "if (!m) return kind === 'rept' ? ['0', '0'] : ['', ''];", "if (!m) return ['', ''];"],
  [WHEELS, 'a pace is not held to its dial', "  a = Math.max(c0.min, Math.min(c0.max, a));\n", ""],
  [WHEELS, 'seconds are not held to 59', "  b = Math.max(c1.min, Math.min(c1.max, b));\n", ""],
  [WHEELS, 'the dash stores a clock with no minutes', "  if (vals[0] === '') return '';\n", ""],
  [WHEELS, 'the zero clock stores 0.00', "    if ((+vals[0]!) * 3600 + (+b!) * 60 + (+sx) === 0) return '';\n", ""],
  [WHEELS, 'a time stores one decimal place', ".toFixed(2);\n  }\n  if (sp.fmt === 'dec3')", ".toFixed(1);\n  }\n  if (sp.fmt === 'dec3')"],
  [WHEELS, 'zero miles store 0.00', "    if ((+vals[0]!) * 100 + (+b!) * 10 + (+c) === 0) return '';\n", ""],
  [WHEELS, 'the zero rep clock stores 0:00', "  if (kind === 'rept' && (+vals[0]!) * 60 + (+b!) === 0) return '';\n", ""],
  [WHEELS, 'a clock does not pad its seconds', "(vals[0] + ':' + ('00' + b).slice(-2))", "(vals[0] + ':' + b)"],
  [WHEELS, 'a wrapped column opens from its first copy', "return wheelWraps(c) ? Math.floor(WHEEL_REPS / 2) * wheelRows(c).length : 0;", "return 0;"],
  [WHEELS, 'a blank wheel does not open on the plan', "w.value !== '' ? w.value : (w.plan || '')", "w.value"],
  [WHEELS, 'a wheel looks for its value from the first row', "for (let k = home; k < col.items.length; k++)", "for (let k = 0; k < col.items.length; k++)"],
  [WHEELS, 'the face a wheel opens on is its stored string, not what it shows', "return { rows, face: wheelFormat(w.kind, landed) };", "return { rows, face: w.value };"],
  [WHEELS, 'a rest reads the row above its offset', "let i = Math.round(offset / WHEEL_ROW);\n  if (i < 0) i = 0;", "let i = Math.floor(offset / WHEEL_ROW);\n  if (i < 0) i = 0;"],
  [WHEELS, 'a rest past the last row reads no row', "  if (i > col.items.length - 1) i = col.items.length - 1;\n", ""],
  [WHEELS, 'a wrapped column is never jumped back', "  if (!col.wrap) return offset;\n", "  if (col.wrap || !col.wrap) return offset;\n"],
  [WHEELS, 'a column in its first copy is not jumped forward', "  if (i < len) return offset + half;\n", ""],
  [WHEELS, 'a column in its last copy is not jumped back', "  if (i > len * (WHEEL_REPS - 1)) return offset - half;\n", ""],
  [WHEELS, 'opening a day writes the face it opened on', "    if (next === st.seedFace) return { write: null, st };\n", ""],
  [WHEELS, 'a wheel never counts as moved', "    st = { moved: true, seedFace: st.seedFace };\n", ""],
  [WHEELS, 'a rest on the face the field holds writes it again', "  if (held === next) return { write: null, st };\n", ""],
  // ── The cardio card: what it holds ──
  [LOG, 'the stepper shows its stored count at the draw, not the plan', "? f.stepper.shown : null);", "? f.stepper.stored : null);"],
  [LOG, 'the planned dose is not kept for the way back', "    doseFull: c ? doseFromCardio(cardio) : null,\n", "    doseFull: null,\n"],
  [LOG, 'the picker is shut at the draw of a swapped sport', "    picker: !!c && c.swapped,\n", "    picker: false,\n"],
  [LOG, 'the note is not drawn at the open', "    note: c ? c.note : '',\n", "    note: '',\n"],
  // ── A rolled wheel, the readout, the stepper ──
  [LOG, 'a rolled wheel is saved on a draft card', "  if (cardioLive(s, next)) persistLog(s, next, c.dose, false, now);\n  return next;", "  persistLog(s, next, c.dose, false, now);\n  return next;"],
  [LOG, 'a rolled wheel is never saved', "  if (cardioLive(s, next)) persistLog(s, next, c.dose, false, now);\n  return next;", "  return next;"],
  [LOG, 'the readout ignores the reps', "reps: g('log_run_reps'), rep: g('log_run_rep_time') });\n  if (!d) return [];", "reps: '', rep: g('log_run_rep_time') });\n  if (!d) return [];"],
  [LOG, 'the work done row is dropped', "  if (d.vol) rows.push({ label: 'Work done', value: d.dist != null ? d.dist + ' mi' : '', small: d.vol, empty: false, joined: false });\n", ""],
  [LOG, 'a gap reads on target inside ten seconds', "delta = ad < 5 ? 'on target'", "delta = ad < 10 ? 'on target'"],
  [LOG, 'a gap over a minute prints seconds', "const mag = ad < 60 ? (ad + 's/mi')", "const mag = ad < 600 ? (ad + 's/mi')"],
  [LOG, 'faster and slower are swapped', "(df < 0 ? 'faster than target' : 'slower than target')", "(df > 0 ? 'faster than target' : 'slower than target')"],
  [LOG, 'the readout leaves out what it assumed', "const note = [d.assumed, delta,", "const note = [delta,"],
  [LOG, 'the readout leaves out the work minutes', "(d.workMin ? ('over ' + d.workMin + ' work min') : null)].filter(Boolean)", "null].filter(Boolean)"],
  [LOG, 'the pace is never joined to the work done', "empty: false, joined: !!d.vol });", "empty: false, joined: false });"],
  [LOG, 'the empty row asks for distance on a distance run', "value: dose.k === 'dist' ? 'enter minutes' : ", "value: dose.k === 'dist' ? 'enter distance' : "],
  [LOG, 'a rep session\'s empty row reads Your pace', "label: dose.k === 'reps_dist' ? 'Your rep pace' : 'Your pace', value", "label: 'Your pace', value"],
  [LOG, 'the stepper starts from zero, not the plan', "const base = h === '' ? (c.dose.reps || 0) : (+h || 0);", "const base = +h || 0;"],
  [LOG, 'the stepper goes past thirty', "Math.max(0, Math.min(30, base + delta))", "Math.max(0, base + delta)"],
  [LOG, 'the stepper goes under zero', "Math.max(0, Math.min(30, base + delta))", "Math.min(30, base + delta)"],
  [LOG, 'a step on a draft card is saved', "  if (cardioLive(s, form)) persistLog(s, form, c.dose, false, now);\n  return { form, log: { ...c, repsShown: String(v) } };", "  persistLog(s, form, c.dose, false, now);\n  return { form, log: { ...c, repsShown: String(v) } };"],
  [LOG, 'a step on a logged card is not saved', "  if (cardioLive(s, form)) persistLog(s, form, c.dose, false, now);\n  return { form, log: { ...c, repsShown: String(v) } };", "  return { form, log: { ...c, repsShown: String(v) } };"],
  [LOG, 'the stepper does not show its new count', "log: { ...c, repsShown: String(v) } };", "log: c };"],
  // ── Log ──
  [LOG, 'a ride\'s toast reads Run logged', "bike: 'Ride logged ✓'", "bike: 'Run logged ✓'"],
  [LOG, 'Log on an empty card writes and says logged', "  if ((CARDIO_PARK_FIELDS[sport] || []).every((fld) => g('log_' + fld) === '')) return 'Nothing to log yet.';\n", ""],
  [LOG, 'the empty card\'s words are shorter', "return 'Nothing to log yet.';", "return 'Nothing to log.';"],
  [LOG, 'Log saves as a draft does, with no commit', "  persistLog(s, f, c.dose, true, now);\n  return CARDIO_LOGGED_TOAST[sport]!;", "  persistLog(s, f, c.dose, false, now);\n  return CARDIO_LOGGED_TOAST[sport]!;"],
  [LOG, 'Log reads the planned sport, not the one the card is on', "const sport = f.wrap.active || f.wrap.planned || '';\n  const g = (v: string): string => f.nodes[v] || '';", "const sport = f.wrap.planned || '';\n  const g = (v: string): string => f.nodes[v] || '';"],
  // ── The sport picker ──
  [LOG, 'the picker never opens', "return { ...c, picker: !c.picker };", "return { ...c, picker: false };"],
  [WRITES, 'a chip parks nothing', "    if (Object.keys(out).some((f) => out[f] !== '')) P[leaving] = out; else delete P[leaving];\n", "    delete P[leaving];\n"],
  [WRITES, 'a chip parks a sport with no number in it', "    if (Object.keys(out).some((f) => out[f] !== '')) P[leaving] = out; else delete P[leaving];\n", "    P[leaving] = out;\n"],
  [WRITES, 'a chip leaves the leaving sport\'s numbers at the top level', "out[f] = (e[f] == null ? '' : String(e[f])); e[f] = ''; });", "out[f] = (e[f] == null ? '' : String(e[f])); });"],
  [WRITES, 'the way back does not return the parked numbers', "e[f] = (back && back[f] != null) ? back[f] : ''; });", "e[f] = ''; });"],
  [WRITES, 'a returned sport stays in the park', "    delete P[sport];\n", ""],
  [WRITES, 'an empty park is stored', "    if (Object.keys(P).length) e['parked'] = P; else delete e['parked'];\n", "    e['parked'] = P;\n"],
  [WRITES, 'the park is not stored', "    logs[key] = e;\n    writeDayLogs(s.store, s.prog.id, logs as never);\n  }\n  return e;", "    logs[key] = e;\n  }\n  return e;"],
  [LOG, 'the new sport is drawn with the planned dose', "const dose = sport === planned ? c.doseFull : null;", "const dose = c.doseFull;"],
  [LOG, 'the way back draws the planned sport with no dose', "const dose = sport === planned ? c.doseFull : null;", "const dose = null;"],
  [LOG, 'the form keeps the leaving sport\'s fields', "nodes: nodesOf(fields), wrap:", "nodes: { ...f.nodes, ...nodesOf(fields) }, wrap:"],
  [LOG, 'the card stays on the leaving sport', "wrap: { planned: f.wrap.planned, active: sport } };", "wrap: { planned: f.wrap.planned, active: leaving } };"],
  [LOG, 'the note shows on the planned sport too', "const note = sport !== planned ? cardioSwapNoteText(sport, planned, e as never) : '';", "const note = cardioSwapNoteText(sport, planned, e as never);"],
  [LOG, 'a chip does not save the new form', "  persistLog(s, form, dose, false, now);\n  return { form, log: { ...c, fields, dose, note, repsShown: repsOf(fields) } };", "  return { form, log: { ...c, fields, dose, note, repsShown: repsOf(fields) } };"],
  [LOG, 'a chip keeps the old fields on show', "log: { ...c, fields, dose, note, repsShown: repsOf(fields) } };", "log: { ...c, dose, note, repsShown: repsOf(fields) } };"],
  [LOG, 'a chip keeps the old note', "log: { ...c, fields, dose, note, repsShown: repsOf(fields) } };", "log: { ...c, fields, dose, repsShown: repsOf(fields) } };"],
  // ── One cardio alone ──
  [MODEL, 'the model\'s copy: one cardio alone keeps the whole day\'s body', "    body: whole.body.filter((b) => b.kind === 'cardio' || b.kind === 'log'),\n", "    body: whole.body,\n"],
  [MODEL, 'the model\'s copy: a day with a lift keeps Done and Skip on the cardio\'s sheet', "    foot: !lift,\n", "    foot: true,\n"],
  [SCREEN, 'the frame is always the whole day', "return cardioSheet(only || null, liftOnDay(", "return cardioSheet(null, liftOnDay("],
  [SCREEN, 'the frame reads no lift on any day', "liftOnDay((day && day.sections) || [])", "liftOnDay([])"],
  [SCREEN, 'the frame drops the whole day\'s counter', "counter: v.counter, body: v.body }, { chips: [], travel: false });", "counter: null, body: v.body }, { chips: [], travel: false });"],
  [SCREEN, 'one cardio alone keeps a travel tag', "body: v.body }, { chips: [], travel: false });", "body: v.body }, { chips: [], travel: true });"],
  // ── This Week's taps ──
  [WEEK, 'the hand log opens the whole day', "else if (onCardio) onCardio(k.week, k.key, r.to === 'cardio' ? r.sheet : { over: when || '', title: k.title });", "else if (onReopen) onReopen(k.week, k.key);"],
  [WEEK, 'Reopen on a done run opens nothing', "onPress={() => tap('reopen')}", "onPress={k.kind === 'lift' ? () => tap('reopen') : undefined}"],
  [WEEK, 'the sheet is opened without the cardio it was asked for', "if (view) onSheet({ prog: grid, week, dayKey: key, view, only });", "if (view) onSheet({ prog: grid, week, dayKey: key, view });"],
  [WEEK, 'a sunk button presses', "const starts = !!bt && !bt.sunk;", "const starts = !!bt;"],
  [WEEK, 'the when line is the card\'s own label', "when={first ? first.label : ''}", "when={k.label}"],
  [WEEK, 'a card\'s cardio tap has nowhere to go', "onStart={startDeck} onReopen={openSheet} onCardio={openSheet} />}", "onStart={startDeck} onReopen={openSheet} onCardio={() => {}} />}"],
  // ── The sheet's wiring ──
  [SHEET, 'the cardio log is not drawn', "{log.view.cardio && form.wrap && (", "{log.view.cardio && !form.wrap && ("],
  [SHEET, 'the add button stands on one cardio alone', "{!frame.cardio && (\n            <Pressable testID=\"sheet-add\"", "{(\n            <Pressable testID=\"sheet-add\""],
  [SHEET, 'Done and Skip stand on every sheet', "{frame.foot && (\n          <View testID=\"sheet-foot\"", "{(\n          <View testID=\"sheet-foot\""],
  [SHEET, 'the frame is the whole day', "const frame = sheetFrame(view, open.only, prog);", "const frame = sheetFrame(view, null, prog);"],
  [SHEET, 'the header keeps the whole day\'s title', "{frame.title}</Text>", "{view.title}</Text>"],
  [SHEET, 'the body draws the whole day', "{drawnBlocks(frame).map((blk, k) => {", "{drawnBlocks(view).map((blk, k) => {"],
  [SHEET, 'Log does not rest the wheels', "      flush();\n      const toast = logCardio(", "      const toast = logCardio("],
  [SHEET, 'Log\'s toast is not raised', "      if (toast) say(toast);\n      // The Log tap", "      // The Log tap"],
  [SHEET, 'a chip does not rest the wheels', "      flush();\n      const r = swapSport(", "      const r = swapSport("],
  [SHEET, 'a chip does not start the wheels afresh', "      holdCardio(r.log);\n      setDrawn((n) => n + 1);\n    },\n  };", "      holdCardio(r.log);\n    },\n  };"],
  [SHEET, 'a chip does not hold the new form', "      hold(r.form);\n      holdCardio(r.log);\n      setDrawn((n) => n + 1);\n    },", "      holdCardio(r.log);\n      setDrawn((n) => n + 1);\n    },"],
  [SHEET, 'the slider saves with the draw\'s dose', "    const next = moveRpe(f, v);\n    hold(next);\n    persistLog(session, next, cardioNow.current.dose, false, Date.now());", "    const next = moveRpe(f, v);\n    hold(next);\n    persistLog(session, next, view.dose, false, Date.now());"],
  [SHEET, 'a status tap saves with the draw\'s dose', "tapStatus(session, formNow.current, cardioNow.current.dose, title, st, Date.now());", "tapStatus(session, formNow.current, view.dose, title, st, Date.now());"],
  [SHEET, 'an undo rests the wheels too', "    if (dayStatus(store, prog.id, open.week, open.dayKey) !== st) flush();\n", "    flush();\n"],
  [SHEET, 'a status set does not rest the wheels', "    if (dayStatus(store, prog.id, open.week, open.dayKey) !== st) flush();\n", ""],
  [SHEET, 'the Log button keeps the draw\'s flag', "logged={cardioLive(session, form)}", "logged={log.view.cardio.logged}"],
  [SHEET, 'a redraw keeps the old cardio card', "    holdCardio(cardioOf(next, g));\n", ""],
  [SHEET, 'a wheel reads the draw\'s form, not the form in hand', "held: (id) => formNow.current.nodes[id] || '',", "held: (id) => form.nodes[id] || '',"],
  [SHEET, 'the stepper does not hold its new card', "hold(r.form); holdCardio(r.log); },", "hold(r.form); },"],
  // ── The block and the wheel ──
  [BLOCK, 'the free wheel\'s line reads From the watch', "sub('Off the watch.')", "sub('From the watch.')"],
  [BLOCK, 'the ride\'s label reads Log the bike', "label('bike', 'Log the ride')", "label('bike', 'Log the bike')"],
  [BLOCK, 'the picker\'s link reads Did something else', ">Did a different activity?</Text>", ">Did something else?</Text>"],
  [BLOCK, 'the chips\' heading reads Logged under', ">Logged as</Text>", ">Logged under</Text>"],
  [BLOCK, 'the stepper\'s label reads Reps done', ">Reps completed</Text>", ">Reps done</Text>"],
  [BLOCK, 'the swim\'s box asks for yds', "placeholder=\"yards\"", "placeholder=\"yds\""],
  [BLOCK, 'a chip reads its sport, not its words', "{ch.label}</Text>", "{ch.sport}</Text>"],
  [BLOCK, 'the Log button\'s words are its own', "{cardioLogLabel(logged)}", "{logged ? 'Logged' : 'Log'}"],
  [BLOCK, 'the wheels do not start afresh at a draw', "key={w.hiddenId + ':' + drawn}", "key={w.hiddenId}"],
  [BLOCK, 'a wheel\'s rest is not handed to the form', "onWrite={on.set} flushers", "onWrite={() => {}} flushers"],
  [BLOCK, 'the speed day\'s hint is dropped', "{f.speedHint && <Text style={[s.sub, s.hint, { color: p.muted }]}>Whole session off the watch. Warm up, efforts and recoveries all count.</Text>}\n", ""],
  [WHEEL, 'a wheel waits 250 ms of its own', "timers.current[ci] = setTimeout(() => settle(ci), WHEEL_SETTLE_MS);", "timers.current[ci] = setTimeout(() => settle(ci), 250);"],
  [WHEEL, 'a wheel writes whatever it rests on, past the rule', "if (r.write !== null) now.current.onWrite(w.hiddenId, r.write);", "now.current.onWrite(w.hiddenId, r.write || '');"],
  [WHEEL, 'a wheel forgets that it moved', "    moved.current = r.st;\n", ""],
  [WHEEL, 'a wheel opens at its first row', "contentOffset={{ x: 0, y: seed.rows[ci]! * WHEEL_ROW }}", "contentOffset={{ x: 0, y: 0 }}"],
  [WHEEL, 'a wheel does not snap to a row', "            snapToInterval={WHEEL_ROW}\n", ""],
  [WHEEL, 'a wheel asked to rest clears its timer and reads nothing', "if (t) { clearTimeout(t); settle(ci); }", "if (t) { clearTimeout(t); }"],
  [WHEEL, 'a wrapped column is not jumped back on the screen', "const y = offsets.current[ci]!, back = wheelRecentre(col, y);", "const y = offsets.current[ci]!, back = y;"],
  // ── The rest timer ──
  [APP, 'the rest clock is the monotonic one', "new RestClock(NO_ISLAND, performance, () => Date.now())", "new RestClock(undefined, performance, () => Date.now())"],
  [APP, 'Mark the day done leaves the rest clock running', "onDone={(prog, week, dayKey) => { rest.reset(); setDeck(null);", "onDone={(prog, week, dayKey) => { setDeck(null);"],
  [APP, 'the rest timer shows with no program', "showsOn(hasProg, tab === 'week'", "showsOn(true, tab === 'week'"],
  [APP, 'a launch does not say whether a program is held', "    setHasProg(!!prog);\n", ""],
  [SHEET, 'the open does not zero the idle rest clock', "  useEffect(() => { rest.resetIfIdle(); }, [rest]);\n", ""],
  [SHEET, 'a redraw does not zero the idle rest clock', "    setDrawn((n) => n + 1);\n    rest.resetIfIdle();\n", "    setDrawn((n) => n + 1);\n"],
  [SHEET, 'a status set does not stop the rest clock', "    if (r.closed) rest.reset();\n", ""],
  [CLOCK, 'Reset leaves the time held', "    this.pause();\n    this.watch.reset();\n    this.changed();", "    this.pause();\n    this.changed();"],
  [CLOCK, 'Reset does not tell the held time before the end', "    this.pause();\n    this.watch.reset();", "    this.watch.reset();"],
  [CLOCK, 'a listener let go still hears', "return () => { this.heard = this.heard.filter((f) => f !== fn); };", "return () => {};"],
  [CLOCK, 'the screen hears no change', "    this.heard.forEach((fn) => fn());\n", ""],
  [CLOCK, 'the Live Activity is told nothing', "    syncIsland(this.island, this.watch);\n", ""],
  [CLOCK, 'the button only ever starts', "if (this.watch.running) this.pause(); else this.start();", "this.start();"],
  [CLOCK, 'an idle reset is not heard', "if (this.watch.resetIfIdle()) this.changed();", "this.watch.resetIfIdle();"],
  [CLOCK, 'the stand-in Live Activity is none at all', "new Stopwatch(stopwatchClock(island, perf, wall))", "new Stopwatch(stopwatchClock(undefined, perf, wall))"],
  [RMODEL, 'the model\'s copy: the timer shows on This Week alone', "(screen === 'screenWeek' || screen === 'screenProgress' || screen === 'screenBugs')", "(screen === 'screenWeek')"],
  [TIMER, 'the timer stands 100 points down', "const TOP = 200;", "const TOP = 100;"],
  [TIMER, 'a running clock is drawn twice a second', "const TICK_MS = 33;", "const TICK_MS = 500;"],
  [TIMER, 'the button reads Pause', "{running ? 'Stop' : 'Start'}", "{running ? 'Pause' : 'Start'}"],
  [TIMER, 'the card\'s heading reads Rest', ">Rest Timer</Text>", ">Rest</Text>"],
  [TIMER, 'a tap on the tab does not open the card', "if (tap && isTab) setOpen(true);", "if (tap && !isTab) setOpen(true);"],
  [TIMER, 'a drag always docks to the right', "if (x !== null) setSide(snapSide(x, size.current.w, width));", "if (x !== null) setSide('right');"],
  [TIMER, 'a jitter under 5 points moves the timer', "if (Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD) moved = true;\n        if (!moved) return;", "moved = true;\n        if (!moved) return;"],
  [TIMER, 'Reset on the card starts the clock', "onPress={() => clock.reset()}", "onPress={() => clock.toggle()}"],
  [TIMER, 'the readout reads a clock of its own', "const face = clockFace(clock.watch.now());", "const face = clockFace(0);"],
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
  say.push('# The Expo app\'s cardio sheet and rest timer: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-cardio-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-cardio-sheet_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-cardio-sheet_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
