// native-program-list: when one rule of the Expo app's Programs tab is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of what the list,
// the goal sheet and the mile pencil read (frontends/native/src/program-list/list-readers.ts), of the views and of
// what is kept between draws (list-screen.ts), of the writes (list-writes.ts: the switch, the rename, Archive, Delete
// Forever, the goal switch, the new mile), of the screens' wiring (Programs.tsx, SheetFrame.tsx, GoalSheet.tsx,
// MileSheet.tsx, App.tsx), or of a model that is today's file. The fast files are run on each, and the ten program
// sweep only on a break they let through; the files and tests that turn red are counted. A break no file turns red
// on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-program-list_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-program-list_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-program-list_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-program-list_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-program-list_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-program-list_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-program-list.test.ts', 'integration/native-program-list.test.ts'];
const SLOW = ['sweeps/native-program-list.test.ts'];
const N = 'frontends/native/src/';
const READ = N + 'program-list/list-readers.ts', SCREEN = N + 'program-list/list-screen.ts', WRITES = N + 'program-list/list-writes.ts';
const LIST = N + 'program-list/Programs.tsx', FRAME = N + 'program-list/SheetFrame.tsx', GOAL = N + 'goal-sheet/GoalSheet.tsx', MILE = N + 'mile-sheet/MileSheet.tsx', APP = N + 'App.tsx';
const M_LIST = N + 'program-list/program-list-model.ts', M_DETAIL = N + 'program-list/program-detail-model.ts', M_GOAL = N + 'goal-sheet/goal-sheet-model.ts', M_MILE = N + 'mile-sheet/mile-sheet-model.ts';

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  // ── The readers the page keeps (list-readers.ts) ──
  [READ, "a base run gets the race plan's five chips", "a.goalId === 'run_base' ? [['Mile', r['mile']!]] :", "a.goalId === 'run_bass' ? [['Mile', r['mile']!]] :"],
  [READ, "the race's chip is named for the other race", "list.push([a.race === 'half' ? 'Half' : 'Marathon', r[a.race]!]);", "list.push([a.race === 'half' ? 'Marathon' : 'Half', r[a.race]!]);"],
  [READ, "the Recovery chip is dropped", "  list.push(['Recovery', r['recovery']!]);\n", ""],
  [READ, "the effort is printed off a race plan too", "u: (nrc && eff[k]) ? '/mi · ' + eff[k] : '/mi' }", "u: (eff[k]) ? '/mi · ' + eff[k] : '/mi' }"],
  [READ, "the goal's chip goes last", "chips.unshift({ k: 'Goal'", "chips.push({ k: 'Goal'"],
  [READ, "the goal's chip is in kilometres", "u: a.goalT.dist + ' mi' }", "u: a.goalT.dist + ' km' }"],
  [READ, "18 reads a, not an", "/^(8|11|18):/.test(m) ? 'an' : 'a'", "/^(8|11):/.test(m) ? 'an' : 'a'"],
  [READ, "a base run's sentence ends as a race plan's", ": (a.goalId === 'run_base') ? ' Your easy runs", ": (a.goalId === 'run_bass') ? ' Your easy runs"],
  [READ, "the pace goal's sentence ends as a race plan's", "const tail = (a.goalId === 'run_pace_goal')", "const tail = (a.goalId === 'run_pace_gaol')"],
  [READ, "a clamped mile is not said", "  if (a.clamped) {", "  if (a.clamped && false) {"],
  [READ, "faster and slower swap in a clamped sentence", "(a.clamped === 'fast' ? 'is faster than the chart goes' : 'is slower than the chart goes')", "(a.clamped === 'slow' ? 'is faster than the chart goes' : 'is slower than the chart goes')"],
  [READ, "the clamped row is named for the other end", "so its ${a.clamped === 'fast' ? 'fastest' : 'slowest'} row is used.", "so its ${a.clamped === 'slow' ? 'fastest' : 'slowest'} row is used."],
  [READ, "an entry of no time is printed as a time", "const raw = a.rawSec > 0 ?", "const raw = a.rawSec >= 0 ?"],
  [READ, "no count of seeded runs reads as one run", "recovery run${a.n === 1 ? '' : 's'} you logged", "recovery run${a.n <= 1 ? '' : 's'} you logged"],
  [READ, "the seeding program's name is dropped", "you logged in ${a.prog || 'your last program'}.", "you logged in ${'your last program'}."],
  [READ, "an edit over the default names a time", "const from = a.from.kind === 'default' ? 'the ' + a.exp + ' default'", "const from = a.from.kind === 'entered' ? 'the ' + a.exp + ' default'"],
  [READ, "an edit with nothing before it reads what is not there", "if (a.kind === 'edited' && a.from) {", "if (a.kind === 'edited') {"],
  [READ, "an entered mile reads as the default", "if (a.kind === 'entered' || a.kind === 'edited') return", "if (a.kind === 'edited') return"],
  [READ, "a squat of zero is kept as entered", "squat: (c.squat! > 0 ? c.squat! : d1.squat) || 0,", "squat: (c.squat! >= 0 ? c.squat! : d1.squat) || 0,"],
  [READ, "one lift entered still reads as estimated", "estimated: !(c.squat! > 0 || c.bench! > 0 || c.deadlift! > 0),", "estimated: !(c.squat! > 0 && c.bench! > 0 && c.deadlift! > 0),"],
  [READ, "no experience stored reads as a beginner", "const exp = c.experience || 'intermediate';", "const exp = c.experience || 'beginner';"],
  [READ, "no unit stored reads as kilograms", "const unit = c.unit || 'lbs';", "const unit = c.unit || 'kg';"],
  [READ, "the rest days are listed as training days", "trainDays: order.filter((d) => !rest.includes(d)),", "trainDays: order.filter((d) => rest.includes(d)),"],
  [READ, "no length stored reads as eight weeks", "length: (p.totalWeeks || c.totalWeeks || 6),", "length: (p.totalWeeks || c.totalWeeks || 8),"],
  [READ, "a sport's goal is its id, not its label", "c.cardioGoals[t]!.label) || '' }", "c.cardioGoals[t]!.id) || '' }"],
  [READ, "the hybrid path is the one with an event", "eventTargeted: (c.primaryPath === 'event'),", "eventTargeted: (c.primaryPath === 'both'),"],
  [READ, "the time out is counted from the machine's own day", "raceCountdown(c.raceDate, _isoOf(now))", "raceCountdown(c.raceDate)"],
  [READ, "an older program's seed is not printed", "seed: (c.seed != null ? c.seed : (p.seed != null ? p.seed : null)),", "seed: (c.seed != null ? c.seed : null),"],
  [READ, "the race date loses its year", "raceStr = String(fmtStartDay(c.raceDate, true));", "raceStr = String(fmtStartDay(c.raceDate));"],
  [READ, "a goal's label is not today's", "label: 'Run a 5K',", "label: 'Run 5K',"],
  [READ, "a goal's description is not today's", "desc: 'Mid-distance swim performance'", "desc: 'Mid distance swim performance'"],
  [READ, "the pace goal ranks under the base", "run_pace_goal: 2, run_base: 1,", "run_pace_goal: 1, run_base: 2,"],
  [READ, "the triathlon swim is offered on the hybrid path", "new Set(['run_half', 'run_marathon', 'bike_century', 'swim_tri'])", "new Set(['run_half', 'run_marathon', 'bike_century'])"],
  [READ, "the 100 time needs no target", "new Set(['run_pace_goal', 'swim_100_time', 'swim_500_time'])", "new Set(['run_pace_goal', 'swim_500_time'])"],
  [READ, "a time needs both its minutes and its seconds", "const hasTime = (+i.targetMins! > 0) || (+i.targetSecs! > 0);", "const hasTime = (+i.targetMins! > 0) && (+i.targetSecs! > 0);"],
  [READ, "the pace goal takes a distance or a time", "return (parseFloat(i.targetDist!) > 0) && hasTime;", "return (parseFloat(i.targetDist!) > 0) || hasTime;"],
  [READ, "a goal picked with no target needed is not ready", "if (!sel || !GOAL_REQ_INPUTS.has(sel)) return true;", "if (!sel) return true;"],
  [READ, "the blank mile is required of a beginner", "if (g.id === 'run_pace_goal' && exp !== 'beginner') return", "if (g.id === 'run_pace_goal' && exp === 'beginner') return"],
  [READ, "sixty seconds is a time", "!(ss >= 0) || ss >= 60 ||", "!(ss >= 0) || ss > 60 ||"],
  [READ, "a mile under three minutes is taken", "if (sec < 180) return", "if (sec < 120) return"],
  [READ, "a mile over twenty five minutes is taken", "if (sec > 1500) return", "if (sec > 1600) return"],
  [READ, "five minutes flat is told the chart tops out", "if (sec < 300) return", "if (sec <= 300) return"],
  [READ, "twelve minutes flat is told to base first", "if (sec > 720) return", "if (sec >= 720) return"],
  [READ, "the week a program is in is one on", "  return currentWeek(p, today);", "  return currentWeek(p, today) + 1;"],
  // ── The views (list-screen.ts) ──
  [SCREEN, "a second tap on a card leaves it open", "st.openIds.has(id) ? [...st.openIds].filter((x) => x !== id) : [...st.openIds, id]", "false ? [...st.openIds].filter((x) => x !== id) : [...st.openIds, id]"],
  [SCREEN, "Archive arms the delete's tier", "export function askArchive(st: ListState, id: string): void { st.confirmId = id; st.confirmTier = 1; }", "export function askArchive(st: ListState, id: string): void { st.confirmId = id; st.confirmTier = 2; }"],
  [SCREEN, "Delete forever… arms the archive's tier", "export function askPurge(st: ListState, id: string): void { st.confirmId = id; st.confirmTier = 2; }", "export function askPurge(st: ListState, id: string): void { st.confirmId = id; st.confirmTier = 1; }"],
  [SCREEN, "Cancel leaves the card named", "export function cancelConfirm(st: ListState): void { st.confirmId = null; st.confirmTier = 0; }", "export function cancelConfirm(st: ListState): void { st.confirmTier = 0; }"],
  [SCREEN, "the rename never ends", "export function endRename(st: ListState): void { st.editId = null; }", "export function endRename(st: ListState): void { void st; }"],
  [SCREEN, "the pencil names no card", "export function startRename(st: ListState, id: string): void { st.editId = id; }", "export function startRename(st: ListState, id: string): void { st.editId = null; void id; }"],
  [SCREEN, "the active program is the stored pointer, whatever it names", "  const a = storedProgram(store);\n  return a ? a.id : null;", "  const a = storedProgram(store);\n  return a ? a.id : 'none';"],
  [SCREEN, "no card is the active one", "activeId: activeId(store), openIds: st.openIds", "activeId: null, openIds: st.openIds"],
  [SCREEN, "the days of the schedule lose their names", "{ dayNames: DAYF, goalLabels: GOAL_LABELS }", "{ dayNames: {}, goalLabels: GOAL_LABELS }"],
  [SCREEN, "the goal in Focus loses its label", "{ dayNames: DAYF, goalLabels: GOAL_LABELS }", "{ dayNames: DAYF, goalLabels: {} }"],
  [SCREEN, "the paces are not drawn", "const paces = s.runAnchor ? { chips: runAnchorChips(s.runAnchor), sentence: runAnchorSentence(s.runAnchor) } : null;", "const paces = null; void runAnchorChips; void runAnchorSentence;"],
  [SCREEN, "the bold words are not marked", "if (m[1] !== undefined) words(m[1], true);", "if (m[1] !== undefined) words(m[1], false);"],
  [SCREEN, "a break does not end a line", "html.split(/<br\\s*\\/?>/)", "html.split(/<hr\\s*\\/?>/)"],
  [SCREEN, "an ampersand is left as its entity", ".replace(/&#39;/g, \"'\").replace(/&amp;/g, '&');", ".replace(/&#39;/g, \"'\");"],
  [SCREEN, "an icon is read as words", "if (m[1] !== undefined) words(m[1], true); else runs.push({ icon: m[0], text: '', bold: false });", "if (m[1] !== undefined) words(m[1], true); else runs.push({ icon: null, text: m[0], bold: false });"],
  [SCREEN, "the goal sheet opens on a program that is gone", "return p ? { progId, sport, sel: null, inputs: {} } : null;", "return { progId, sport, sel: null, inputs: {} };"],
  [SCREEN, "a pick keeps what was typed for the last one", "return { ...draft, sel: id, inputs: {} }; }", "return { ...draft, sel: id }; }"],
  [SCREEN, "a typed target forgets the others", "inputs: { ...draft.inputs, [key]: value } }", "inputs: { [key]: value } }"],
  [SCREEN, "a program in its first week has started", "started: !!p.startDate && week > 1,", "started: !!p.startDate && week > 0,"],
  [SCREEN, "the hybrid path is not read", "path: (p.cfg && p.cfg.primaryPath) || undefined,", "path: undefined,"],
  [SCREEN, "the current goal is not marked", "current: (p.cfg && p.cfg.cardioGoals && p.cfg.cardioGoals[sport]) || null,", "current: null,"],
  [SCREEN, "the switch always takes a tap", "return { view, ok: goalInputsValid(draft) };", "return { view, ok: true };"],
  [SCREEN, "the lock stands a week early", "  if (mileLocked(week, tw)) {", "  if (mileLocked(week + 1, tw)) {"],
  [SCREEN, "the lock's days out are counted from the machine's own day", "countdown: (iso) => raceCountdown(iso, _isoOf(now)),", "countdown: (iso) => raceCountdown(iso),"],
  [SCREEN, "the seconds field opens on the minutes", "secs: mileField(g.mileBestSecs) };", "secs: mileField(g.mileBestMins) };"],
  [SCREEN, "a program with no length stored locks as one of nine weeks", "  const tw = p.totalWeeks || 6;\n  const week = goalCurWeek(p, midnight(now));\n  if (mileLocked", "  const tw = p.totalWeeks || 9;\n  const week = goalCurWeek(p, midnight(now));\n  if (mileLocked"],
  [SCREEN, "a plan change that did not apply is not said", "log('overlay apply failed', ov && ov.id, e); say(PLAN_CHANGE_FAILED); },", "log('overlay apply failed', ov && ov.id, e); },"],
  [SCREEN, "the archive's note is reworded", "archiveNote: 'It leaves your program list but its history stays.", "archiveNote: 'It leaves your list but its history stays."],
  [SCREEN, "the archive's question loses its quotes", "'Archive “' + name + '”?'", "'Archive ' + name + '?'"],
  [SCREEN, "the delete's warning is reworded", "'”. It cannot be undone.'", "'”. This cannot be undone.'"],
  [SCREEN, "the goal sheet's intro is reworded", "GOAL_INTRO = 'Weeks you already trained stay on the books.", "GOAL_INTRO = 'Weeks you trained stay on the books."],
  [SCREEN, "This Week opens with no active program", "  return storedProgram(store) ? null : NO_ACTIVE;", "  return null;"],
  [SCREEN, "Programs is refused with no active program", "  if (tab === 'home' || tab === 'bugs') return null;\n", "  if (tab === 'bugs') return null;\n"],
  [SCREEN, "the refusal's words are not today's", "NO_ACTIVE = 'No active program. Tap Set Active or build a new one.';", "NO_ACTIVE = 'No active program.';"],
  // ── The writes (list-writes.ts) ──
  [WRITES, "today is marked as asked too", "if (x.date < today && !dayStatus(", "if (x.date <= today && !dayStatus("],
  [WRITES, "a marked day is recorded as asked", "x.date < today && !dayStatus(store, prog.id, x.week, x.d) && !m[k]", "x.date < today && !m[k]"],
  [WRITES, "the record is stored when nothing was added", "  if (n) try { store.set('ia_reminded_'", "  if (n >= 0) try { store.set('ia_reminded_'"],
  [WRITES, "the asked days go under the reminder's day", "store.set('ia_reminded_' + prog.id, JSON.stringify(m));", "store.set('ia_remind_last_' + prog.id, JSON.stringify(m));"],
  [WRITES, "an archived program is set active", "  if (p.archived) return { refused: RESTORE_FIRST };\n", ""],
  [WRITES, "a switch does not write the pointer", "  writeActiveProgramId(store, id);\n", ""],
  [WRITES, "Set Active does not mark the past days as asked", "  markPastAsked(store, r.prog, new Date(now));\n  return { toast: 'Active program updated'", "  return { toast: 'Active program updated'"],
  [WRITES, "Set Active's toast is reworded", "toast: 'Active program updated'", "toast: 'Active program changed'"],
  [WRITES, "a name is cut before it is trimmed", "(typed || '').trim().slice(0, 40)", "(typed || '').slice(0, 40).trim()"],
  [WRITES, "a name may run to forty one", "(typed || '').trim().slice(0, 40)", "(typed || '').trim().slice(0, 41)"],
  [WRITES, "the same name is stored again", "if (nn && nn !== p.name) {", "if (nn) {"],
  [WRITES, "a blank name is stored", "if (nn && nn !== p.name) {", "if (nn !== p.name) {"],
  [WRITES, "the hand on reads the pointer alone", "if (!(readActiveProgramId(store) === id || activeId === id)) return undefined;", "if (!(readActiveProgramId(store) === id)) return undefined;"],
  [WRITES, "the hand on reads the program in hand alone", "if (!(readActiveProgramId(store) === id || activeId === id)) return undefined;", "if (!(activeId === id)) return undefined;"],
  [WRITES, "an archived program takes over", "const nx = programs.find((p) => p.id !== id && !p.archived);", "const nx = programs.find((p) => p.id !== id);"],
  [WRITES, "the hand on does not mark the past days as asked", "if ('prog' in r) { markPastAsked(store, r.prog, new Date(now)); return r.prog; }", "if ('prog' in r) { return r.prog; }"],
  [WRITES, "with no program left the pointer stays", "  store.remove('ia_active');\n  return null;", "  return null;"],
  [WRITES, "an archive is not stamped", "p.archived = true; p.archivedAt = now; save(store, programs);", "p.archived = true; save(store, programs);"],
  [WRITES, "an archive does not hand on", "  p.archived = true; p.archivedAt = now; save(store, programs);\n  const prog = handOff(store, id, programs, activeId, now, failed);", "  p.archived = true; p.archivedAt = now; save(store, programs);\n  const prog = undefined as ReturnType<typeof handOff>;"],
  [WRITES, "the list is saved after the hand on, over the next program's repair", "programs = programs.filter((p) => p.id !== id); save(store, programs);\n  const prog = handOff(store, id, programs, activeId, now, failed);", "programs = programs.filter((p) => p.id !== id);\n  const prog = handOff(store, id, programs, activeId, now, failed); save(store, programs);"],
  [WRITES, "a deleted program keeps its keys", "  PURGE_FAMILIES.forEach((f) => store.remove(f + id));\n", ""],
  [WRITES, "a deleted program stays in the list", "programs = programs.filter((p) => p.id !== id); save(store, programs);", "programs = programs.filter((p) => p.id !== id);"],
  [WRITES, "Delete Forever's toast is reworded", "? { toast: 'Program deleted' } : { toast: 'Program deleted', prog };", "? { toast: 'Program removed' } : { toast: 'Program removed', prog };"],
  [WRITES, "a run goal switch drops the mile", "...(sport === 'run' && prev.mileBestMins !== undefined && prev.mileBestMins !== ''", "...(sport === 'swim' && prev.mileBestMins !== undefined && prev.mileBestMins !== ''"],
  [WRITES, "any sport's switch carries a mile", "...(sport === 'run' && prev.mileBestMins !== undefined && prev.mileBestMins !== ''", "...(prev.mileBestMins !== undefined && prev.mileBestMins !== ''"],
  [WRITES, "an empty mile is carried", "prev.mileBestMins !== undefined && prev.mileBestMins !== ''\n", "prev.mileBestMins !== undefined\n"],
  [WRITES, "where the mile came from is not carried", "...(prev.mileBestSrc ? { mileBestSrc: prev.mileBestSrc } : {}) } : {}),", "} : {}),"],
  [WRITES, "the new goal keeps no blank baseline", "id: g.id, label: g.label, baseline: '',", "id: g.id, label: g.label,"],
  [WRITES, "the swim unit is not carried", "    if (prev.swimUnit) next.swimUnit = prev.swimUnit;\n", ""],
  [WRITES, "a 500 time lands on the 100 goal's own base", "if (g.id === 'swim_100_time' && t500) put('base500', t500);", "if (g.id === 'swim_100_time' && t500) put('base', t500);"],
  [WRITES, "the 100 goal hands its 100 time on as a 500", "t500 = [prev.base500Mins, prev.base500Secs];", "t500 = [prev.baseMins, prev.baseSecs];"],
  [WRITES, "the 500 goal's time is not carried", "if (prev.id === 'swim_500_time' && has(prev.baseMins, prev.baseSecs)) t500 = [prev.baseMins, prev.baseSecs];", "if (prev.id === 'swim_500_time' && has(prev.baseMins, prev.baseSecs)) t500 = null;"],
  [WRITES, "a time of zero is carried", "((+(m as number) || 0) * 60 + (+(s as number) || 0)) > 0;", "((+(m as number) || 0) * 60 + (+(s as number) || 0)) >= 0;"],
  [WRITES, "the target's clock is not padded", "next.targetTime = mins + ':' + String(secs).padStart(2, '0');", "next.targetTime = mins + ':' + String(secs);"],
  [WRITES, "no unit picked is kilometres", "next.paceUnit = i.paceUnit || 'mi';", "next.paceUnit = i.paceUnit || 'km';"],
  [WRITES, "a swim time gets a distance", "if (g.id === 'run_pace_goal') { next.targetDist", "if (g.id !== 'run_base') { next.targetDist"],
  [WRITES, "the typed minutes are stored as a number", "next.targetMins = i.targetMins; next.targetSecs = i.targetSecs;", "next.targetMins = String(mins); next.targetSecs = i.targetSecs;"],
  [WRITES, "a switch with its target missing is made", "  if (!goalInputsValid(draft)) return null;\n", ""],
  [WRITES, "a goal switch rebuilds the program that is not active", "return activeId === draft.progId ? { toast, prog: refresh(store, p, now, failed) } : { toast };", "return activeId !== draft.progId ? { toast, prog: refresh(store, p, now, failed) } : { toast };"],
  [WRITES, "a goal switch on the active program rebuilds nothing", "return activeId === draft.progId ? { toast, prog: refresh(store, p, now, failed) } : { toast };", "return { toast };"],
  [WRITES, "the goal's toast is reworded", "const toast = 'Goal switched. Program rebuilt from this week.';", "const toast = 'Goal switched.';"],
  [WRITES, "one blank field is let through", "if (mRaw === '' || sRaw === '') return { toast: MILE_BOTH, saved: false };", "if (mRaw === '' && sRaw === '') return { toast: MILE_BOTH, saved: false };"],
  [WRITES, "the fields are not trimmed", "const mRaw = String(mins).trim(), sRaw = String(secs).trim();", "const mRaw = String(mins), sRaw = String(secs);"],
  [WRITES, "the mile is stored as typed", "mileBestMins: String(mm), mileBestSecs: String(ss),", "mileBestMins: mRaw, mileBestSecs: sRaw,"],
  [WRITES, "the mile's day is cut to its month", "at: new Date(now).toISOString().slice(0, 10)", "at: new Date(now).toISOString().slice(0, 7)"],
  [WRITES, "the mile's week is always the first", "wk: goalCurWeek(p, midnight(new Date(now))),", "wk: 1,"],
  [WRITES, "the mile replaced loses its seconds", "secs: prev.mileBestSecs || '', kind:", "secs: prev.mileBestMins || '', kind:"],
  [WRITES, "the mile replaced is never named by its own kind", "kind: (prev.mileBestSrc && prev.mileBestSrc.kind) || (prev.mileBestMins ? 'entered' : 'default') },", "kind: (prev.mileBestMins ? 'entered' : 'default') },"],
  [WRITES, "no mile before reads as entered", "(prev.mileBestMins ? 'entered' : 'default') },", "(prev.mileBestMins ? 'default' : 'entered') },"],
  [WRITES, "the chart's advice is dropped from the toast", "+ (st.adv ? ' ' + st.adv : '');", ";"],
  [WRITES, "a mile that is no time is saved", "  if (!st.ok) return { toast: st.msg || null, saved: false };\n", ""],
  [WRITES, "a new mile rebuilds the program that is not active", "return activeId === progId ? { toast, prog: refresh(store, p, now, failed), saved: true } : { toast, saved: true };", "return activeId !== progId ? { toast, prog: refresh(store, p, now, failed), saved: true } : { toast, saved: true };"],
  [WRITES, "the other goals are dropped by a new mile", "p.cfg = { ...cfg, cardioGoals: { ...(cfg.cardioGoals || {}), run: next } };", "p.cfg = { ...cfg, cardioGoals: { run: next } };"],
  [WRITES, "the other goals are dropped by a goal switch", "p.cfg = { ...cfg, cardioGoals: { ...(cfg.cardioGoals || {}), [sport]: next } };", "p.cfg = { ...cfg, cardioGoals: { [sport]: next } };"],
  // ── The screens' wiring ──
  [LIST, "a card's tap is not drawn", "toggle: (id: string): void => { toggleCard(st, id); redraw(); },", "toggle: (id: string): void => { toggleCard(st, id); },"],
  [LIST, "Save leaves the rename box up", "const toast = renameProgram(store, id, typed.current); endRename(st); redraw();", "const toast = renameProgram(store, id, typed.current); redraw();"],
  [LIST, "the pencil forgets the name in the box", "pencil: (c: ListCard): void => { typed.current = c.nameValue; startRename(st, c.id); redraw(); },", "pencil: (c: ListCard): void => { startRename(st, c.id); redraw(); },"],
  [LIST, "Set Active stays on the list", "if (o.toast) say(o.toast); if (o.switched) onSwitch(); },", "if (o.toast) say(o.toast); },"],
  [LIST, "Archive leaves its question up", "cancelConfirm(st); onGone(id); redraw(); if (o && o.toast) say(o.toast); },", "onGone(id); redraw(); if (o && o.toast) say(o.toast); },"],
  [LIST, "Delete Forever does not tell Progress", "cancelConfirm(st); onGone(id); redraw(); if (o.toast) say(o.toast); },", "cancelConfirm(st); redraw(); if (o.toast) say(o.toast); },"],
  [LIST, "a sheet's outcome is not drawn", "const done = (o: Outcome): void => { redraw(); if (o.toast) say(o.toast); };", "const done = (o: Outcome): void => { if (o.toast) say(o.toast); };"],
  [LIST, "the active card offers Set Active", "{LIST_WORDS.active}</Text></View>", "{LIST_WORDS.setActive}</Text></View>"],
  [LIST, "a shut card draws its detail", "{/ open$/.test(c.cardClass) && detail(c)}", "{detail(c)}"],
  [LIST, "the edge marks the cards that are not active", "borderColor: c.isActive ? p.signal : 'transparent'", "borderColor: c.isActive ? 'transparent' : p.signal"],
  [LIST, "the est. mark is not drawn", "{d.estimated && <Text style={[s.est, { color: p.muted }]}>{' (est.)'}</Text>}", ""],
  [LIST, "the event is not drawn", "{d.event && rows('Event target', d.event)}", ""],
  [LIST, "a goal's pencil opens the mile", "() => on.goal(c.id, x.type))}", "() => on.mile(c.id))}"],
  [LIST, "the mile's pencil opens the rename", "'Change mile time', 14, () => on.mile(c.id))}", "'Change mile time', 14, () => on.pencil(c))}"],
  [LIST, "a name may be typed past forty", "maxLength={40}", "maxLength={60}"],
  [LIST, "the copy button takes no press", "onPress={() => { const text = copyText(store, c.id, new Date()); if (text !== null) Clipboard", "onLongPress={() => { const text = copyText(store, c.id, new Date()); if (text !== null) Clipboard"],
  [LIST, "Build New Program takes a press", "<View testID=\"build-new\" style", "<Pressable testID=\"build-new\" style"],
  [LIST, "the list jumps to its top at every draw", "<ScrollView testID=\"programs-body\"", "<ScrollView key={drawn.n} testID=\"programs-body\""],
  [LIST, "the empty list's break is drawn as markup", "EMPTY_HTML[v.empty].replace('<br>', '\\n')", "EMPTY_HTML[v.empty]"],
  [LIST, "a badge takes the wrong colour", "{ strength: p.lift, hypertrophy: p.hip, fatloss: p.run, athletic: p.bike, balanced: p.accent }", "{ strength: p.hip, hypertrophy: p.lift, fatloss: p.run, athletic: p.bike, balanced: p.accent }"],
  [LIST, "the purge link archives", "onPress={() => on.askPurge(c.id)}", "onPress={() => on.archive(c.id)}"],
  [LIST, "the mile sheet is opened on yesterday", "const open = openMile(store, id, new Date());", "const open = openMile(store, id, new Date(0));"],
  [GOAL, "the current goal takes a press", "disabled={o.current}", "disabled={false}"],
  [GOAL, "the current goal can be picked", "onPress={() => { if (!o.current) setDraft(selectGoal(draft, o.id)); }}", "onPress={() => { setDraft(selectGoal(draft, o.id)); }}"],
  [GOAL, "the switch takes a tap with its target missing", "disabled={!g.ok} onPress={commit}", "onPress={commit}"],
  [GOAL, "the sheet stays up after the switch", "if (o) leave(() => onDone(o));", "if (o) onDone(o);"],
  [GOAL, "the safer button is not first on a step up", "{d.up ? [keepBtn, commitBtn] : [commitBtn, keepBtn]}", "{[commitBtn, keepBtn]}"],
  [GOAL, "a unit's button types the distance", "onPress={() => setDraft(typeGoal(draft, 'paceUnit', u))}", "onPress={() => setDraft(typeGoal(draft, 'targetDist', u))}"],
  [GOAL, "the current goal is marked as a bigger one", "{!o.current && o.up && <Text", "{o.up && <Text"],
  [GOAL, "Keep makes the switch", "<Pressable key=\"keep\" testID=\"goal-keep\" accessibilityRole=\"button\" onPress={() => leave()}", "<Pressable key=\"keep\" testID=\"goal-keep\" accessibilityRole=\"button\" onPress={commit}"],
  [MILE, "a refused mile closes the sheet", "if (o.saved) leave(() => onDone(o)); else if (o.toast) say(o.toast);", "leave(() => onDone(o));"],
  [MILE, "the minutes open empty", "const [mins, setMins] = useState(open.kind === 'edit' ? open.mins : '');", "const [mins, setMins] = useState('');"],
  [MILE, "the lock draws the edit sheet", "{(leave) => (open.kind === 'lock' ? lock(leave) : edit(leave))}", "{(leave) => (open.kind === 'edit' ? lock(leave) : edit(leave))}"],
  [MILE, "Keep what I have saves", "<Pressable testID=\"mile-keep\" accessibilityRole=\"button\" onPress={() => leave()}", "<Pressable testID=\"mile-keep\" accessibilityRole=\"button\" onPress={() => leave(() => onDone({ toast: null }))}"],
  [MILE, "the lock's facts are not drawn", "{open.facts.map((f) => (", "{[].map((f: { k: string; v: string }) => ("],
  [FRAME, "a sheet leaves twice", "    if (leaving.current) return;\n", ""],
  [FRAME, "Reduce Motion still slides", "    if (calm) { onClose(); return; }\n", ""],
  [APP, "the Programs tab is named Home", "<TabButton id=\"tab-home\" label=\"Programs\"", "<TabButton id=\"tab-home\" label=\"Home\""],
  [APP, "a sheet is not drawn", "      {cover}\n      {rest && (", "      {rest && ("],
  [APP, "Set Active ends on Progress", "onSwitch={() => go('week')}", "onSwitch={() => go('progress')}"],
  [APP, "the list forgets what it kept at every draw of the app", "const list = useRef(newListState()).current;", "const list = newListState();"],
  [APP, "a long toast is cut to one line", "<Text numberOfLines={2} style={styles.toastText}>", "<Text numberOfLines={1} style={styles.toastText}>"],
  [APP, "a refused tab opens all the same", "    if (refused) { say(refused); return; }\n", "    if (refused) { say(refused); }\n"],
  [APP, "a tap on the tab does not draw the list afresh", "    if (t === 'home') setHomeTaps((n) => n + 1);\n", ""],
  // ── The models are today's files: a change to any is a difference from today's ──
  [M_LIST, "the list's model is changed", "' wks cardio · 6 wks lift<br>'", "' wks cardio · 8 wks lift<br>'"],
  [M_DETAIL, "the detail's model is changed", "'General fitness'", "'General'"],
  [M_GOAL, "the goal sheet's model is changed", "'Switch anyway'", "'Switch'"],
  [M_MILE, "the mile sheet's model is changed", "return week >= totalWeeks - 2;", "return week >= totalWeeks - 3;"],
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
  say.push('# The Expo app\'s Programs tab: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-program-list_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-program-list_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-program-list_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
