// native-wizard: when one rule of the Expo app's wizard or of its Generate is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the readers
// (frontends/native/src/wizard/wizard-readers.ts), of the taps and views (wizard-screen.ts), of Generate
// (wizard-writes.ts), of the generating figure (generating-figure.ts), of a model that is today's file
// (wizard-model.ts, cardio-goal-model.ts), of a number field (number-field.ts), of the date box's Reset (date-box.ts,
// DateBox.tsx), or of the screens' drawing and wiring (Wizard.tsx, Generating.tsx, App.tsx, ThisWeek.tsx, Programs.tsx). The fast files are run on each, and the sweep only on a break they let through; the
// files and tests that turn red are counted. A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-wizard_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-wizard_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-wizard_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-wizard_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-wizard_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-wizard_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-wizard.test.ts', 'integration/native-wizard.test.ts', 'unit/native-program-list.test.ts', 'unit/native-change-sheet.test.ts', 'unit/native-look.test.ts'];
const SLOW = ['sweeps/native-wizard.test.ts'];
const N = 'frontends/native/src/';
const READ = N + 'wizard/wizard-readers.ts', SCREEN = N + 'wizard/wizard-screen.ts', WRITE = N + 'wizard/wizard-writes.ts', FIG = N + 'wizard/generating-figure.ts';
const M1 = N + 'wizard/wizard-model.ts', M2 = N + 'wizard/cardio-goal-model.ts';
const WIZ = N + 'wizard/Wizard.tsx', GEN = N + 'wizard/Generating.tsx', NUM = N + 'wizard/number-field.ts';
const BOX = N + 'date-box/date-box.ts', BOXC = N + 'date-box/DateBox.tsx';
const APP = N + 'App.tsx', WEEK = N + 'this-week/ThisWeek.tsx', LIST = N + 'program-list/Programs.tsx';

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  // ── The draft and its day (wizard-readers.ts) ──
  [READ, "today is the day after", "t.setHours(0, 0, 0, 0);", "t.setHours(24, 0, 0, 0);"],
  [READ, "the draft opens on the race path", "primaryPath: 'body', cardioTypes: [], cardioGoals: {}, eventTargeted: true,", "primaryPath: 'event', cardioTypes: [], cardioGoals: {}, eventTargeted: true,"],
  [READ, "the draft opens with no race date asked for", "cardioGoals: {}, eventTargeted: true,\n    liftingFocus", "cardioGoals: {}, eventTargeted: false,\n    liftingFocus"],
  [READ, "the draft opens as a beginner's", "liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35',", "liftingFocus: 'balanced', experience: 'beginner', ageBracket: '18-35',"],
  [READ, "the draft opens in kilos", "equipment: 'home_full', unit: 'lbs', restDays: [],", "equipment: 'home_full', unit: 'kg', restDays: [],"],
  [READ, "the draft opens with no start", "    startDate: isoToday(now),\n  };", "    startDate: '',\n  };"],
  [READ, "the draft opens with a bench number", "bench: 0, squat: 0, deadlift: 0, name: '',", "bench: 135, squat: 0, deadlift: 0, name: '',"],
  [READ, "the draft's training days leave Sunday out", "days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],", "days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],"],
  [READ, "a lifting focus is named otherwise", "{ id: 'hypertrophy', icon: '💪', label: 'Size',", "{ id: 'hypertrophy', icon: '💪', label: 'Hypertrophy',"],
  [READ, "a support focus loses a word", "desc: 'Power, explosiveness, sport-specific strength' }", "desc: 'Power, explosiveness, strength' }"],
  [READ, "a focus draws another icon", "{ id: 'balanced', icon: '⚖️',", "{ id: 'balanced', icon: '🔥',"],
  // ── The rest days' numbers and words (wizard-readers.ts) ──
  [READ, "size training is most effective with three days", "strength: 3, hypertrophy: 4, fatloss: 3,", "strength: 3, hypertrophy: 3, fatloss: 3,"],
  [READ, "a marathon trains best with four days", "run_half: 4, run_marathon: 5, swim_mile: 4,", "run_half: 4, run_marathon: 4, swim_mile: 4,"],
  [READ, "a half marathon's floor is three", "run_marathon: 5, run_half: 4, run_10k: 3,", "run_marathon: 5, run_half: 3, run_10k: 3,"],
  [READ, "a swum mile's floor is three", "swim_tri: 4, swim_mile: 4, swim_500_time: 3,", "swim_tri: 4, swim_mile: 3, swim_500_time: 3,"],
  [READ, "a century's floor is three", "bike_century: 4, bike_50: 3,", "bike_century: 3, bike_50: 3,"],
  [READ, "a goal no table holds has no name", "  return 'your';", "  return '';"],
  [READ, "a goal is looked up by its name", ".find((g) => g.id === goalId);", ".find((g) => g.label === goalId);"],
  [READ, "the lifting advisory fires at its own number", "if (nDays < liftMin) {", "if (nDays <= liftMin) {"],
  [READ, "the lifting advisory's focus has no capital", "const labelCap = label.charAt(0).toUpperCase() + label.slice(1);", "const labelCap = label;"],
  [READ, "the lifting advisory keeps support_ in the name", "(d.liftingFocus || '').replace('support_', '').replace('_', ' ')", "(d.liftingFocus || '').replace('_', ' ')"],
  [READ, "the lifting advisory's words", "' training is most effective with <b>'", "' training works best with <b>'"],
  [READ, "the cardio advisory fires at its own number", "if (rec && nDays < rec) {", "if (rec && nDays <= rec) {"],
  [READ, "the cardio advisory's words", "+ days</b> for the weekly volume — you have '", "+ days</b> for the volume — you have '"],
  [READ, "the interval advisory asks for two days", "if (slots < 3) {", "if (slots < 2) {"],
  [READ, "the interval advisory for any goal", "if (!goal || !isSpeedGoal(goal.id as never)) return;", "if (!goal) return;"],
  [READ, "the interval advisory reads two sports as one", "const multi = cardioTypes.length > 1;", "const multi = cardioTypes.length > 2;"],
  [READ, "the interval advisory's fixes are swapped", "const fix = multi ? 'Add a training day or drop a sport' : 'Add a training day';", "const fix = multi ? 'Add a training day' : 'Add a training day or drop a sport';"],
  [READ, "the interval advisory says 1 running days", ": 'you have ' + slots + ' ' + word + ' day' + (slots === 1 ? '' : 's');", ": 'you have ' + slots + ' ' + word + ' days';"],
  [READ, "the interval advisory's icon size", "out.push(asyIcon(sportIcon[sport] || '⏱', 14)", "out.push(asyIcon(sportIcon[sport] || '⏱', 13)"],
  [READ, "the floor is two", "  let floor = 3;", "  let floor = 2;"],
  [READ, "the floor is the lowest of the goals'", "floor = Math.max(floor, CARDIO_FLOORS[goal.id as string]!);", "floor = Math.min(floor, CARDIO_FLOORS[goal.id as string]!);"],
  [READ, "the floor counts a goal of a sport not chosen", "  cardioTypes.forEach((sport) => {\n    const goal = cardioGoals[sport];\n    if (goal && CARDIO_FLOORS[goal.id as string])", "  Object.keys(cardioGoals).forEach((sport) => {\n    const goal = cardioGoals[sport];\n    if (goal && CARDIO_FLOORS[goal.id as string])"],
  [READ, "the floor's toast joins goals with and", "return goalLabels.join(' + ') + ' needs '", "return goalLabels.join(' and ') + ' needs '"],
  [READ, "the floor's toast with a goal loses its tail", "' training days — see why below';", "' training days';"],
  [READ, "the floor's toast with no goal", "  return 'Three days is the floor. Two gives you the same session twice.';", "  return 'Three days is the floor.';"],
  // ── The start date (wizard-readers.ts) ──
  [READ, "a span's dash", "{ month: 'short', day: 'numeric' }) + ' – ' + b.toLocaleDateString", "{ month: 'short', day: 'numeric' }) + ' - ' + b.toLocaleDateString"],
  [READ, "a week ends on its Saturday", "s.setDate(m.getDate() + 6); return _isoOf(s);", "s.setDate(m.getDate() + 5); return _isoOf(s);"],
  [READ, "the week that holds the test is not said", "  if (r.holdsTest) {\n    return 'That week holds", "  if (false) {\n    return 'That week holds"],
  [READ, "the week that holds the test loses its last sentence", "'</b>. Nothing is left to train before it. Week 1 is the test week.';", "'</b>. Nothing is left to train before it.';"],
  [READ, "a moved start is not said", "  if (r.snapped) {\n    return 'Nothing left", "  if (false) {\n    return 'Nothing left"],
  [READ, "a moved start's words", "return 'Nothing left to train that week, so this starts <b>'", "return 'Nothing to train that week, so this starts <b>'"],
  [READ, "a short week is not said", "  if (r.partial) {\n    const days", "  if (false) {\n    const days"],
  [READ, "a short week's days are a day late", "x.setDate(m.getDate() + _ISO_ORDER.indexOf(k as never)); return x;", "x.setDate(m.getDate() + _ISO_ORDER.indexOf(k as never) + 1); return x;"],
  [READ, "a short week of one day is listed as several", "const list = days.length === 1 ? days[0] :", "const list = days.length === 0 ? days[0] :"],
  [READ, "a short week's last day joins with a comma", "days.slice(0, -1).join(', ') + ' and ' + days[days.length - 1];", "days.slice(0, -1).join(', ') + ', ' + days[days.length - 1];"],
  [READ, "a short week's full week starts this Monday", "', then a full week from <b>' + fmtStartDay(r.nextMon) + '</b>.';", "', then a full week from <b>' + fmtStartDay(r.mon) + '</b>.';"],
  [READ, "a whole week's words", "  return 'Week 1 runs <b>' + fmtSpan(r.start, sunOf(r.start)) + '</b>.';\n}", "  return 'Week one runs <b>' + fmtSpan(r.start, sunOf(r.start)) + '</b>.';\n}"],
  [READ, "the summary's start set by a race says nothing of it", "return fmtStartDay(r.start, true) + ', set by race date';", "return fmtStartDay(r.start, true);"],
  [READ, "the summary's start never says short first week", "(r.partial ? ', short first week' : '');", "'';"],
  [READ, "the summary's start has no year", "  return fmtStartDay(r.start, true) + (r.partial", "  return fmtStartDay(r.start) + (r.partial"],
  [READ, "a race plan is not counted back on the hybrid path", "if (d.primaryPath !== 'event' && d.primaryPath !== 'both') return null;", "if (d.primaryPath !== 'event') return null;"],
  [READ, "a race plan is counted back on the strength path too", "if (d.primaryPath !== 'event' && d.primaryPath !== 'both') return null;\n  return raceAlignment", "if (!d.primaryPath) return null;\n  return raceAlignment"],
  [READ, "a race plan is counted back with no race date asked for", "d.raceDate, d.eventTargeted !== false, isoToday(now));\n}\n/** The page's wizardStartSummary", "d.raceDate, true, isoToday(now));\n}\n/** The page's wizardStartSummary"],
  [READ, "a race plan without the run chosen", "if (!d || !d.cardioTypes || !d.cardioTypes.includes('run') || !d.cardioGoals || !d.cardioGoals['run']) return null;\n  if (d.primaryPath", "if (!d || !d.cardioGoals || !d.cardioGoals['run']) return null;\n  if (d.primaryPath"],
  [READ, "the summary reads the resolver's start under a race date", "return startSummaryVal(al ? { start: al.start, aligned: true } : sr);", "return startSummaryVal(sr);"],
  [READ, "the test pin forgets the week that holds the test", "return (p && r.holdsTest) ? { ...p, holdsTest: true } : p;", "return p;"],
  [READ, "the test pin counts from the day entered", "const p = progTestPin(d as never, r.start);", "const p = progTestPin(d as never, r.entered);"],
  [READ, "the test pin's resolver is not told the test date", "const r = resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now);\n  const p = progTestPin", "const r = resolveStartDate(d.startDate, d.restDays || [], null, now);\n  const p = progTestPin"],
  // ── A race plan's copy (wizard-readers.ts) ──
  [READ, "the half is called Half", "run_10k: '10K', run_half: 'half', run_marathon: 'marathon' };", "run_10k: '10K', run_half: 'Half', run_marathon: 'marathon' };"],
  [READ, "the shorter plan's name is its id", "'\\')\">' + RACE_GOAL_LBL[sh] + '</a> fits this window better.';", "'\\')\">' + sh + '</a> fits this window better.';"],
  [READ, "1 weeks out", "al.weeksOut + ' week' + (al.weeksOut === 1 ? '' : 's') + ' out';", "al.weeksOut + ' weeks out';"],
  [READ, "a plan that starts later is not said", "  if (al.futureWeeks) {\n    return 'Your '", "  if (false) {\n    return 'Your '"],
  [READ, "1 weeks from now", "al.futureWeeks + ' week' + (al.futureWeeks === 1 ? '' : 's') + ' from now", "al.futureWeeks + ' weeks from now"],
  [READ, "a plan that starts later loses its advice", "so it peaks on race week and not early. Until then: run easy three times a week, 30–45 minutes, nothing hard.';", "so it peaks on race week and not early.';"],
  [READ, "the opening week is the plan's last", "'. You open in <b>week ' + al.openWeek + '</b>.';", "'. You open in <b>week ' + al.tw + '</b>.';"],
  [READ, "race week's number is the opening week's", "'</b> so race week is week ' + al.tw + '. You open", "'</b> so race week is week ' + al.openWeek + '. You open"],
  [READ, "the weeks behind are not said", "if (al.behindWeeks) t += ' Weeks 1", "if (false) t += ' Weeks 1"],
  [READ, "race day pins to its key", "t += ' Race day pins to <b>' + dayName + '</b>.';", "t += ' Race day pins to <b>' + al.raceDay + '</b>.';"],
  [READ, "under the floor is not said", "  if (al.underFloor) {\n    const sh", "  if (false) {\n    const sh"],
  [READ, "under the floor names the plan's weeks", "' I don’t recommend under ' + al.floor + ' weeks for the '", "' I don’t recommend under ' + al.tw + ' weeks for the '"],
  [READ, "the shorter plan is not offered", "    if (sh) t += ' The <a", "    if (false) t += ' The <a"],
  // ── The swim times (wizard-readers.ts) ──
  [READ, "the 100 goal's times are not checked", "if (!g || (g.id !== 'swim_500_time' && g.id !== 'swim_100_time')) return { ok: true };", "if (!g || g.id !== 'swim_500_time') return { ok: true };"],
  [READ, "sixty seconds is a count of seconds", "(/Secs$/.test(k) && v >= 60)", "(/Secs$/.test(k) && v > 60)"],
  [READ, "sixty minutes is refused", "(/Secs$/.test(k) && v >= 60)) return { ok: false, msg: 'That is not a real time.", "(v >= 60)) return { ok: false, msg: 'That is not a real time."],
  [READ, "the swim's not a time words", "msg: 'That is not a real time. Check the minutes and seconds.' }; }", "msg: 'That is not a real time.' }; }"],
  [READ, "the 100 goal reads its 100 as its 500", "const t500 = is100 ? tot('base500Mins', 'base500Secs') : tot('baseMins', 'baseSecs');", "const t500 = tot('baseMins', 'baseSecs');"],
  [READ, "the 500 required loses its unit", "msg: 'Required. Enter your most recent timed 500' + unit + '.' };", "msg: 'Required. Enter your most recent timed 500.' };"],
  [READ, "the swim unit is metres unless said", "const unit = (g['swimUnit'] as string) || 'yd', is100", "const unit = (g['swimUnit'] as string) || 'm', is100"],
  [READ, "the 100 is not required", "if (!(t100 > 0)) return { ok: false, blank: true,", "if (false) return { ok: false, blank: true,"],
  [READ, "a 500 pace level with the 100 is refused", "if (t500 / 5 < t100) return", "if (t500 / 5 <= t100) return"],
  [READ, "a slower 500 pace is refused", "if (t500 / 5 < t100) return { ok: false, msg: 'Your 500 pace", "if (t500 / 5 > t100) return { ok: false, msg: 'Your 500 pace"],
  // ── The name step (wizard-readers.ts) ──
  [READ, "a lift only program is four weeks", ".weeks : 6);\n}", ".weeks : 4);\n}"],
  [READ, "the name step's length forgets the test week", "return (pin || ({} as { tw?: number | null })).tw || (types.length", "return (types.length"],
  [READ, "the default name counts the stored programs alone", "' Block ' + (readPrograms(store).length + 1);", "' Block ' + readPrograms(store).length;"],
  [READ, "a draft with no name stays unnamed", "  if (!d.name) d.name = liftLabel", "  if (false) d.name = liftLabel"],
  [READ, "the default name carries the focus's id", "const liftLabel = LIFT_LABELS[d.liftingFocus || ''] || d.liftingFocus;", "const liftLabel = d.liftingFocus;"],
  [READ, "a draft with no start stays without one", "  if (!d.startDate) d.startDate = isoToday(now);", "  if (false) d.startDate = isoToday(now);"],
  [READ, "the cardio row's Lift only", "    : 'Lift only';", "    : 'Lift Only';"],
  [READ, "the cardio row joins sports with a comma", "(goals[t] && goals[t]!.label ? ': ' + goals[t]!.label : '')).join(' + ')", "(goals[t] && goals[t]!.label ? ': ' + goals[t]!.label : '')).join(', ')"],
  [READ, "the cardio row leaves the goal out", "+ sport[t]![1] + (goals[t] && goals[t]!.label ? ': ' + goals[t]!.label : ''))", "+ sport[t]![1])"],
  [READ, "the cardio row's icon size", "types.map((t) => asyIcon(sport[t]![0], 15)", "types.map((t) => asyIcon(sport[t]![0], 14)"],
  [READ, "the race date row on any path", "  if (d.primaryPath === 'event' && d.raceDate) {", "  if (d.raceDate) {"],
  [READ, "race day reads as away", "cd!.days <= 0 ? ' (' + w.copy + ')' : ' (' + w.card + ' away)'", "cd!.days < 0 ? ' (' + w.copy + ')' : ' (' + w.card + ' away)'"],
  [READ, "the race date row has no year", "raceRow = fmtStartDay(d.raceDate, true) +", "raceRow = fmtStartDay(d.raceDate) +"],
  [READ, "no date set's words", "    raceRow = 'No date set — no taper';", "    raceRow = 'No date set';"],
  [READ, "no date set on any path", "  } else if (d.primaryPath === 'event') {\n    raceRow", "  } else {\n    raceRow"],
  [READ, "a start under the floor is not marked", "warn: !!al.underFloor,", "warn: false,"],
  [READ, "a start set by a race has no year", "aligned: al ? { start: fmtStartDay(al.start, true),", "aligned: al ? { start: fmtStartDay(al.start),"],
  [READ, "a start set by a race keeps the field's sentence", "    resolveCopy: al ? '' : startResolveCopy(sr),", "    resolveCopy: startResolveCopy(sr),"],
  [READ, "a start set by a race draws no pips", "copy: alignedStartCopy(d, al), pips: alignedPips(al) }", "copy: alignedStartCopy(d, al), pips: null }"],
  [READ, "the summary's start row reads the resolver's", "startSummary: wizardStartSummary(d, sr, now),", "startSummary: startSummaryVal(sr),"],
  // ── The taps (wizard-screen.ts) ──
  [SCREEN, "the wizard opens on its second step", "return { step: 0, draft: newDraft(now) };", "return { step: 1, draft: newDraft(now) };"],
  [SCREEN, "Back leaves from the second step", "  if (st.step === 0) return true;", "  if (st.step <= 1) return true;"],
  [SCREEN, "Back does not skip the cardio goals on the strength path", "=== 'body') st.step--;", "=== 'body') st.step -= 0;"],
  [SCREEN, "Continue does not skip the cardio goals on the strength path", "=== 'body') st.step++;", "=== 'body') st.step += 0;"],
  [SCREEN, "Continue walks past the last step", "  if (st.step < WIZARD_STEPS.length - 1) {", "  if (st.step < WIZARD_STEPS.length) {"],
  [SCREEN, "the hybrid path skips the cardio goals too", "if (WIZARD_STEPS[st.step] === 'cardio_goal' && st.draft.primaryPath === 'body') st.step++;", "if (WIZARD_STEPS[st.step] === 'cardio_goal' && st.draft.primaryPath !== 'event') st.step++;"],
  [SCREEN, "a unit writes nothing", "  if (u === st.draft.unit) return;\n  st.draft.unit = u;", "  if (u === st.draft.unit) return;"],
  [SCREEN, "a training day rests below the floor", "    if (trainingLeft <= minDays) return { icon:", "    if (trainingLeft < minDays) return { icon:"],
  [SCREEN, "the floor's toast carries a lock", "return { icon: '⚠', text: getMinTrainDaysLabel(d) };", "return { icon: '🔒', text: getMinTrainDaysLabel(d) };"],
  [SCREEN, "a resting day at the floor stays resting", "  if (wouldRest) {\n    const minDays", "  if (true) {\n    const minDays"],
  [SCREEN, "a resting day does not come back", "if (d.restDays.includes(day)) d.restDays = d.restDays.filter((x) => x !== day);", "if (d.restDays.includes(day)) d.restDays = d.restDays.filter((x) => x === day || x !== day);"],
  [SCREEN, "a rested day goes to the front of the list", "  else d.restDays.push(day);", "  else d.restDays.unshift(day);"],
  [SCREEN, "the training days do not follow the rest days", "  d.days = ALL_DAYS_ORDER.filter((x) => !d.restDays.includes(x));\n  return null;", "  return null;"],
  [SCREEN, "the floor's toast mark is a size up", "(t.icon ? asyIcon(t.icon, 13) + ' ' + t.text : t.text);", "(t.icon ? asyIcon(t.icon, 14) + ' ' + t.text : t.text);"],
  [SCREEN, "a sport shut keeps its goal", "    d.cardioTypes = d.cardioTypes.filter((x) => x !== t);\n    delete d.cardioGoals[t];", "    d.cardioTypes = d.cardioTypes.filter((x) => x !== t);"],
  [SCREEN, "a sport opened goes to the front", "    d.cardioTypes.push(t);", "    d.cardioTypes.unshift(t);"],
  [SCREEN, "Lift Only keeps the goals", "  st.draft.cardioTypes = [];\n  st.draft.cardioGoals = {};", "  st.draft.cardioTypes = [];"],
  [SCREEN, "Lift Only keeps the sports", "  st.draft.cardioTypes = [];\n  st.draft.cardioGoals = {};\n}", "  st.draft.cardioGoals = {};\n}"],
  [SCREEN, "the name is trimmed as typed", "  st.draft.name = v;", "  st.draft.name = v.trim();"],
  [SCREEN, "a blank start is not written", "  st.draft.startDate = v;", "  if (v) st.draft.startDate = v;"],
  // ── Where the wizard lands, the repaint and a line's runs (wizard-screen.ts) ──
  [SCREEN, "the landing always shows the launch's title", "return { own: 1, pick: currentWeek(prog, today) === 1 ? null : 1 };", "return { own: 1, pick: null };"],
  [SCREEN, "the landing always shows the first title", "return { own: 1, pick: currentWeek(prog, today) === 1 ? null : 1 };\n}", "return { own: 1, pick: 1 };\n}"],
  [SCREEN, "the landing holds the week holding today as its own", "return { own: 1, pick: currentWeek", "return { own: currentWeek(prog, today), pick: currentWeek"],
  [SCREEN, "a start set by a race is repainted", "  if (wizardAlignment(st.draft, now)) return name;", "  if (false) return name;"],
  [SCREEN, "the repaint leaves the field's day as it was", "...name, startDate: d.startDate || '', resolveCopy: startResolveCopy(sr),", "...name, resolveCopy: startResolveCopy(sr),"],
  [SCREEN, "the repaint leaves the sentence as it was", "startDate: d.startDate || '', resolveCopy: startResolveCopy(sr),\n", "startDate: d.startDate || '',\n"],
  [SCREEN, "the repaint leaves the start row as it was", "rows: name.rows.map((r) => (r.k === 'Start date' ?", "rows: name.rows.map((r) => (r.k === 'Start' ?"],
  [SCREEN, "the repainted row loses its span", "{ k: r.k, v: '<span id=\"sumStartDate\">' + startSummaryVal(sr) + '</span>' }", "{ k: r.k, v: startSummaryVal(sr) }"],
  [SCREEN, "the repaint's resolver is not told the test date", "const sr = resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now);\n  return {\n    ...name", "const sr = resolveStartDate(d.startDate, d.restDays || [], null, now);\n  return {\n    ...name"],
  [SCREEN, "the date field shows no year", "{ month: 'short', day: 'numeric', year: 'numeric' }) : '';", "{ month: 'short', day: 'numeric' }) : '';"],
  [SCREEN, "a bold run is not bold", "    if (m[1] !== undefined) words(m[1], true, null);", "    if (m[1] !== undefined) words(m[1], false, null);"],
  [SCREEN, "the shorter plan's link is plain words", "    else if (m[2] !== undefined) words(m[3]!, false, m[2]);", "    else if (m[2] !== undefined) words(m[3]!, false, null);"],
  [SCREEN, "an icon is dropped from a line", "    else runs.push({ icon: m[0], text: '', bold: false, link: null });", "    else void 0;"],
  [SCREEN, "a line keeps its tags as words", "const x = t.replace(/<[^>]*>/g, ''); if (x)", "const x = t; if (x)"],
  [SCREEN, "the words after the last run are dropped", "  words(html.slice(at), false, null);\n  return runs;", "  return runs;"],
  // ── The cardio goals and the views (wizard-screen.ts) ──
  [SCREEN, "the cardio goals do not prepare the draft", "  prepareCardioDraft(cd, HYBRID_EXCLUDED_GOALS, today);", "  void 0;"],
  [M2, "the goal the draft holds is not marked", ".map((go) => ({ ...go, sel: g?.id === go.id }));", ".map((go) => ({ ...go, sel: false }));"],
  [SCREEN, "the hybrid path lists the taper goals", "goalsByType: CARDIO_GOALS_BY_TYPE, hybridExcluded: HYBRID_EXCLUDED_GOALS,", "goalsByType: CARDIO_GOALS_BY_TYPE, hybridExcluded: new Set<string>(),"],
  [M2, "every sport is drawn shut", "    const sel = d.cardioTypes.includes(s.id);", "    const sel = false;"],
  [SCREEN, "the equipment step draws the paths", "name === 'equipment' ? { step: 'equipment', choices: equipmentChoices(m) }", "name === 'equipment' ? { step: 'equipment', choices: primaryChoices(m) }"],
  [SCREEN, "the lifting step reads no path's focuses", "{ step: 'lifting_focus', lifting: liftingView(m, LIFTING_OPTIONS) }", "{ step: 'lifting_focus', lifting: liftingView(m, { body: LIFTING_OPTIONS.event, event: LIFTING_OPTIONS.body }) }"],
  [SCREEN, "the rest days' floor is always three", "minDays: getMinTrainDays(d), goalLabel })", "minDays: 3, goalLabel })"],
  [SCREEN, "the rest days are handed no advisories", "advisories: getDayAdvisories(d), minDays", "advisories: [], minDays"],
  [SCREEN, "the bar counts every path as seven steps", "return { shell: wizardShell(st.step, d.primaryPath), view };", "return { shell: wizardShell(st.step, 'event'), view };"],
  [SCREEN, "a path step's line loses its mark", "subtitle: 'This shapes everything! Program length, lifting focus, and cardio structure.' },", "subtitle: 'This shapes everything. Program length, lifting focus, and cardio structure.' },"],
  [SCREEN, "the experience's label", "experience: 'Training experience', age: 'Age range',", "experience: 'Experience', age: 'Age range',"],
  [SCREEN, "the equipment's line", "subtitle: 'The program only prescribes exercises you can actually do.' },", "subtitle: 'The program only prescribes exercises you can do.' },"],
  [SCREEN, "the cardio goals' line", "subtitle: 'Select all sports you want to train. Set a goal for each.' },", "subtitle: 'Select all sports you want to train.' },"],
  [SCREEN, "Lift Only's words", "addOn: 'Optional cardio add-on', liftOnly: 'Lift Only' },", "addOn: 'Optional cardio add-on', liftOnly: 'Lift only' },"],
  [SCREEN, "the add-on's heading", "addOn: 'Optional cardio add-on',", "addOn: 'Optional cardio',"],
  [SCREEN, "the rest days' legend", "legend: 'Gold = training · Grey = rest · ', selected: ' selected',", "legend: 'Gold = training · Grey = rest ', selected: ' selected',"],
  [SCREEN, "the floor's heading", "lockTitle: ' You\\'re at your minimum training days',", "lockTitle: ' You are at your minimum training days',"],
  [SCREEN, "the floor's words with a goal", "after: ' to build the volume safely and avoid injury. To add more rest, ease your goal or pick a shorter distance.' },", "after: ' to build the volume safely and avoid injury.' },"],
  [SCREEN, "the floor's words with no goal", "Three is where real training days start.',", "Three is where training starts.',"],
  [SCREEN, "the name step's line", "subtitle: 'Give it something you will recognize, and tell it when to begin.',", "subtitle: 'Give it something you will recognize.',"],
  [SCREEN, "the derived start's source", "startLabel: 'Start date', derived: 'set by race date', summary: 'Program Summary',", "startLabel: 'Start date', derived: 'from race date', summary: 'Program Summary',"],
  [SCREEN, "the summary's heading", "derived: 'set by race date', summary: 'Program Summary',", "derived: 'set by race date', summary: 'Summary',"],
  [SCREEN, "Back's words", "  back: '← Back',", "  back: 'Back',"],
  // ── Generate (wizard-writes.ts) ──
  [WRITE, "the length never warns", "  return r.warning ? { msg: r.warning, weeks: r.weeks } : null;", "  return null;"],
  [WRITE, "the pop-up's length is a week long", "  return r.warning ? { msg: r.warning, weeks: r.weeks } : null;\n}", "  return r.warning ? { msg: r.warning, weeks: r.weeks + 1 } : null;\n}"],
  [WRITE, "the pop-up's kicker", "  kicker: 'Heads Up',", "  kicker: 'Heads up',"],
  [WRITE, "the pop-up's title", "title: (weeks: number): string => weeks + '-Week Program',", "title: (weeks: number): string => weeks + ' Week Program',"],
  [WRITE, "the pop-up's first words", "before: 'The app will build you a ',", "before: 'The app builds you a ',"],
  [WRITE, "the pop-up's bold run", "bold: weeks + '-week program',", "bold: weeks + ' week program',"],
  [WRITE, "the pop-up's last words", "after: ' that safely progresses toward your goal. Stick to the plan and you will get there.' }),", "after: ' that safely progresses toward your goal.' }),"],
  [WRITE, "Go Back's words", "  back: 'Go Back',", "  back: 'Back',"],
  [WRITE, "Build's words", "build: (weeks: number): string => 'Build ' + weeks + '-Week Plan',", "build: (weeks: number): string => 'Build ' + weeks + '-Week Program',"],
  [WRITE, "the mile is not checked", "  if (!mv.ok) return mv.msg as string;", "  if (false) return mv.msg as string;"],
  [WRITE, "the swim times are not checked", "  if (!sv.ok) return sv.msg as string;", "  if (false) return sv.msg as string;"],
  [WRITE, "the mile is checked as a beginner's", "(d.cardioGoals ? d.cardioGoals['run'] : null) as never, d.experience as string);", "(d.cardioGoals ? d.cardioGoals['run'] : null) as never, 'beginner');"],
  [WRITE, "the swim is checked before the mile", "  const mv = mileEntryState", "  const early = swimEntryState(d.cardioGoals && d.cardioGoals['swim']);\n  if (!early.ok) return early.msg as string;\n  const mv = mileEntryState"],
  [WRITE, "the generating screen's title", "  title: 'Building Your Program',", "  title: 'Building your program',"],
  [WRITE, "a line every 400 ms", "  tickMs: 380,", "  tickMs: 400,"],
  [WRITE, "the build at two seconds", "  buildMs: 2400,", "  buildMs: 2000,"],
  [WRITE, "This Week half a second after", "  landMs: 600,", "  landMs: 500,"],
  [WRITE, "the ready line", "'-week program is ready!',", "'-week program is ready.',"],
  [WRITE, "the error line", "error: (message: string): string => 'Error: ' + message,", "error: (message: string): string => 'Error ' + message,"],
  [WRITE, "the test week is not written on the draft", "  d._testWeek = (tp && tp.tw) || null;", "  d._testWeek = null;"],
  [WRITE, "a pin from an earlier try survives", "  d._testWeek = (tp && tp.tw) || null;\n", "  d._testWeek = (tp && tp.tw) || d._testWeek || null;\n"],
  [WRITE, "the length that builds forgets the test week", "  d._raceDateCappedWeeks = d._testWeek || weeks;", "  d._raceDateCappedWeeks = weeks;"],
  [WRITE, "the lines name the goals' length under a test", "  weeks = d._raceDateCappedWeeks;\n", "  void 0;\n"],
  [WRITE, "the pin counts from the day entered", "rsRace(d as never), now).start);\n  d._testWeek", "rsRace(d as never), now).entered);\n  d._testWeek"],
  [WRITE, "the pin's resolver is not told the test date", "resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now).start);\n  d._testWeek", "resolveStartDate(d.startDate, d.restDays || [], null, now).start);\n  d._testWeek"],
  [WRITE, "the first line's words", "    first: 'Building your ' + weeks + '-week program...',", "    first: 'Building a ' + weeks + '-week program...',"],
  [WRITE, "the first of the six lines", "lines: ['Analyzing your goals...',", "lines: ['Reading your goals...',"],
  [WRITE, "the third of the six lines", "'Selecting exercises...',", "'Picking exercises...',"],
  [WRITE, "the fifth line leaves the length out", "'Assembling ' + weeks + ' weeks...',", "'Assembling weeks...',"],
  [WRITE, "five lines", ", 'Almost done...'],", "],"],
  [WRITE, "a race plan starts on race week's Monday", "    prog.startDate = al.start;", "    prog.startDate = al.raceMon;"],
  [WRITE, "a race plan has no day it opened", "    prog.blockOpen = _isoOf(today);", "    void 0;"],
  [WRITE, "a race plan's start is counted back with no race date asked for", "d.raceDate, d.eventTargeted !== false, _isoOf(today)) : null;", "d.raceDate, true, _isoOf(today)) : null;"],
  [WRITE, "any other start is the day entered", "rsRace(d as never), now).start;\n  }\n  if (prog.cfg", "rsRace(d as never), now).entered;\n  }\n  if (prog.cfg"],
  [WRITE, "the start's resolver is not told the test date", "(d && d.restDays) || [], rsRace(d as never), now).start;", "(d && d.restDays) || [], null, now).start;"],
  [WRITE, "the wizard's start stays in the stored config", "if (prog.cfg && Object.prototype.hasOwnProperty.call(prog.cfg, 'startDate')) delete prog.cfg['startDate'];", "void 0;"],
  [WRITE, "the start is not applied", "  applyWizardStart(prog, d, new Date(now));", "  void 0;"],
  [WRITE, "the new program goes first in the list", "  programs.push(prog);", "  programs.unshift(prog);"],
  [WRITE, "the list is not stored", "  writePrograms(store, programs as never);\n  const r = loadActive", "  const r = loadActive"],
  [WRITE, "the ready line names six weeks", "ready: GENERATING.ready(prog.totalWeeks) };", "ready: GENERATING.ready(6) };"],
  [WRITE, "the program handed back is the one built, not the one loaded", "  return { prog: r.prog, ready:", "  return { prog: prog as unknown as ScreenProgram, ready:"],
  // ── The figure (generating-figure.ts) ──
  [FIG, "a squat every 1.2 s", "periodMs: 1500,", "periodMs: 1200,"],
  [FIG, "the bar sinks 10", "    dy: +(11 * k).toFixed(2),", "    dy: +(10 * k).toFixed(2),"],
  [FIG, "the squat moves at one speed", "const k = t <= 0.5 ? ease(t / 0.5) : 1 - ease((t - 0.5) / 0.5);", "const k = t <= 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;"],
  [FIG, "the figure never comes back up", "const k = t <= 0.5 ? ease(t / 0.5) : 1 - ease((t - 0.5) / 0.5);\n", "const k = t <= 0.5 ? ease(t / 0.5) : 1;\n"],
  [FIG, "the left knee folds less", "left: leg([32, 36, 26, 46, 24, 56], [32, 47, 20, 49, 24, 57]),", "left: leg([32, 36, 26, 46, 24, 56], [32, 47, 22, 49, 24, 57]),"],
  [FIG, "the right leg stands otherwise", "right: leg([32, 36, 38, 46, 40, 56],", "right: leg([32, 36, 38, 46, 40, 55],"],
  [FIG, "the first spark shows on the way down", "opacity: along(t, [0, 0.5, 0.6, 0.78, 1], [0, 0, 1, 0, 0]) },", "opacity: along(t, [0, 0.3, 0.6, 0.78, 1], [0, 0, 1, 0, 0]) },"],
  [FIG, "the second spark is the first's size", "{ r: 1.1, cx:", "{ r: 1.3, cx:"],
  [FIG, "the second spark flies the other way", "cx: along(t, [0, 0.55, 0.85, 1], [24, 24, 20, 20]),", "cx: along(t, [0, 0.55, 0.85, 1], [24, 24, 28, 28]),"],
  [FIG, "the ease is not the page's", "const x1 = 0.45, y1 = 0, x2 = 0.55, y2 = 1;", "const x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1;"],
  [FIG, "a value jumps to its next key", "return values[i - 1]! + (values[i]! - values[i - 1]!) * f;", "return values[i]!;"],
  // ── Today's own models ──
  [M1, "wizard-model.ts is not today's: the count is spaced", "label: displayStep + '/' + displayTotal,", "label: displayStep + ' / ' + displayTotal,"],
  [M2, "cardio-goal-model.ts is not today's: no race date is written", "  if (d.eventTargeted && !d.raceDate) d.raceDate = today;", "  void today;"],
  // ── The screen's drawing (Wizard.tsx) ──
  [WIZ, "Back's words are not drawn", "<Text style={[s.backText, { color: p.text }]}>{W.back}</Text>", "<Text style={[s.backText, { color: p.text }]}>{'Back'}</Text>"],
  [WIZ, "the bar does not fill", "width: drawn.shell.fill as `${number}%` }]} />", "width: '0%' }]} />"],
  [WIZ, "the count is not drawn", "{drawn.shell.label}</Text>", "{''}</Text>"],
  [WIZ, "the last button's words are not the shell's", "{drawn.shell.next}</Text>", "{'Continue →'}</Text>"],
  [WIZ, "Back's press goes on", "<Pressable testID=\"wizard-back\" accessibilityRole=\"button\" onPress={back}", "<Pressable testID=\"wizard-back\" accessibilityRole=\"button\" onPress={next}"],
  [WIZ, "the last button's press goes back", "<Pressable testID=\"wizard-next\" accessibilityRole=\"button\" onPress={next}", "<Pressable testID=\"wizard-next\" accessibilityRole=\"button\" onPress={back}"],
  [WIZ, "Back on the first step stays", "const back = (): void => { if (wizardBack(st)) onClose(); else render(); };", "const back = (): void => { wizardBack(st); render(); };"],
  [WIZ, "Continue draws nothing", "    if (!wizardNext(st)) { render(); return; }", "    if (!wizardNext(st)) return;"],
  [WIZ, "Generate skips the length's pop-up", "    if (w) setWarn(w); else go();", "    go();"],
  [WIZ, "Generate skips the refusals", "    if (no !== null) { say(no); render(); return; }", "    if (no !== null) render();"],
  [WIZ, "a refusal is not said", "    if (no !== null) { say(no); render(); return; }\n", "    if (no !== null) { render(); return; }\n"],
  [WIZ, "the floor's toast loses its mark", "if (t) say(t.text, t.icon ?? undefined); };", "if (t) say(t.text); };"],
  [WIZ, "a draw is made on every React draw, not when a tap asks", "const render = (): void => { draws.current++; setDrawn(wizardView(store, st, new Date())); };", "const render = (): void => { draws.current++; setDrawn((d) => d); };"],
  [WIZ, "the title's size is fixed", "const titleSize = Math.min(28, Math.max(21, width * 0.065));", "const titleSize = 28;"],
  [WIZ, "a title's words are not drawn", "lineHeight: titleLine(titleSize), color: p.text }]}>{t}</Text>", "lineHeight: titleLine(titleSize), color: p.text }]}>{sub}</Text>"],
  [WIZ, "the title has no line of WebKit's", "{ fontSize: titleSize, lineHeight: titleLine(titleSize), color: p.text }", "{ fontSize: titleSize, color: p.text }"],
  [WIZ, "the line under a title is not drawn", "<Text style={[s.subtitle, { color: p.muted }]}>{sub}</Text>", "<Text style={[s.subtitle, { color: p.muted }]}>{t}</Text>"],
  [WIZ, "the path step's title and line are swapped", "{title(W.primary.title, W.primary.subtitle)}", "{title(W.primary.subtitle, W.primary.title)}"],
  [WIZ, "About you's title is the path step's", "{title(W.profile.title, W.profile.subtitle)}", "{title(W.primary.title, W.profile.subtitle)}"],
  [WIZ, "the equipment's title is not drawn", "{title(W.equipment.title, W.equipment.subtitle)}", "{title('', W.equipment.subtitle)}"],
  [WIZ, "the cardio goals' line is not drawn", "{title(W.cardio.title, W.cardio.subtitle)}", "{title(W.cardio.title, '')}"],
  [WIZ, "the lifting focus's line is not the path's", "{title(W.lifting.title, l.subtitle)}", "{title(W.lifting.title, W.cardio.subtitle)}"],
  [WIZ, "the rest days' title is not drawn", "{title(W.days.title, W.days.subtitle)}", "{title('', W.days.subtitle)}"],
  [WIZ, "the name step's title is not drawn", "{title(W.name.title, W.name.subtitle)}", "{title('', W.name.subtitle)}"],
  [WIZ, "a card's icon is not drawn", "<View style={s.noShrink}><Icon name={c.icon} size={icon} color={p.text} /></View>", "<View style={s.noShrink} />"],
  [WIZ, "a chosen card's name stays in the text colour", "<Text style={[s.optionLabel, { color: c.sel ? p.accent : p.text }]}>{c.label}</Text>", "<Text style={[s.optionLabel, { color: p.text }]}>{c.label}</Text>"],
  [WIZ, "a card's line is not drawn", "<Text style={[s.optionDesc, { color: p.muted }]}>{unbroken(c.desc)}</Text>", "<Text style={[s.optionDesc, { color: p.muted }]}>{unbroken(c.label)}</Text>"],
  [WIZ, "a card's line breaks at a slash", "<Text style={[s.optionDesc, { color: p.muted }]}>{unbroken(c.desc)}</Text>\n        {c.detail", "<Text style={[s.optionDesc, { color: p.muted }]}>{c.desc}</Text>\n        {c.detail"],
  [WIZ, "a path card's second line is not drawn", "{c.detail ? <Text style={[s.optionDetail, { color: p.muted }]}>{unbroken(c.detail)}</Text> : null}", "{null}"],
  [WIZ, "a chosen card has no edge", "const sel = { borderColor: p.accent, backgroundColor: 'rgba(' + p.inkRgb + ',0.18)' };", "const sel = { backgroundColor: 'rgba(' + p.inkRgb + ',0.18)' };"],
  [WIZ, "a path's tap draws nothing", "optionRow(c, 'wizard-path-' + c.id, 30, s.optionWide, () => { setChoice(st, 'primaryPath', c.id); render(); })", "optionRow(c, 'wizard-path-' + c.id, 30, s.optionWide, () => { setChoice(st, 'primaryPath', c.id); })"],
  [WIZ, "an experience's tap writes the age", "() => { setChoice(st, 'experience', c.id); render(); }", "() => { setChoice(st, 'ageBracket', c.id); render(); }"],
  [WIZ, "an experience's icon is the path's size", "optionRow(c, 'wizard-exp-' + c.id, 26, s.optionExp,", "optionRow(c, 'wizard-exp-' + c.id, 30, s.optionExp,"],
  [WIZ, "an age's tap writes the experience", "onPress={() => { setChoice(st, 'ageBracket', a.id); render(); }}", "onPress={() => { setChoice(st, 'experience', a.id); render(); }}"],
  [WIZ, "an age's icon is not drawn", "<View style={s.ageIcon}><Icon name={a.icon} size={24} color={p.text} /></View>", "<View style={s.ageIcon} />"],
  [WIZ, "an age's name is not drawn", "<Text style={[s.optionLabel, { color: a.sel ? p.accent : p.text }]}>{a.label}</Text>", "<Text style={[s.optionLabel, { color: a.sel ? p.accent : p.text }]}>{a.id.length}</Text>"],
  [WIZ, "the experience's label is the age's", "{W.profile.experience}</Text>", "{W.profile.age + ' '}</Text>"],
  [WIZ, "the age's label is not drawn", "{W.profile.age}</Text>", "{''}</Text>"],
  [WIZ, "the units' label is not drawn", "{W.profile.units}</Text>", "{''}</Text>"],
  [WIZ, "both units are filled alike", "{unit('lbs', W.profile.lbs, !f.kg)}{unit('kg', W.profile.kg, f.kg)}", "{unit('lbs', W.profile.lbs, f.kg)}{unit('kg', W.profile.kg, f.kg)}"],
  [WIZ, "a unit's tap draws nothing", "onPress={() => { setUnit(st, id); render(); }}", "onPress={() => { setUnit(st, id); }}"],
  [WIZ, "the experience's hint is not drawn", "<Text style={[s.bold, { color: p.accent }]}>{W.profile.expLabel}</Text>{' ' + f.expHint}</Text>", "<Text style={[s.bold, { color: p.accent }]}>{W.profile.expLabel}</Text></Text>"],
  [WIZ, "the age's hint is the experience's", "<Text style={[s.bold, { color: p.accent }]}>{f.ageLabel}</Text>{' ' + f.ageHint}</Text>", "<Text style={[s.bold, { color: p.accent }]}>{f.ageLabel}</Text>{' ' + f.expHint}</Text>"],
  [WIZ, "an equipment's tap writes the path", "() => { setChoice(st, 'equipment', e.id); render(); }", "() => { setChoice(st, 'primaryPath', e.id); render(); }"],
  [WIZ, "an equipment's line is not handed on", "typeCard('wizard-equipment-' + e.id, e.sel, e.icon, 26, e.label, e.desc, false,", "typeCard('wizard-equipment-' + e.id, e.sel, e.icon, 26, e.label, null, false,"],
  [WIZ, "a row card's name is not drawn", "<Text style={[s.typeName, small && s.typeNameSmall, { color: on ? p.accent : p.text }]}>{name}</Text>", "<Text style={[s.typeName, small && s.typeNameSmall, { color: on ? p.accent : p.text }]}>{id}</Text>"],
  [WIZ, "a row card's line is always drawn", "{desc !== null && <Text style={[s.typeDesc, { color: p.muted }]}>{unbroken(desc)}</Text>}", "{<Text style={[s.typeDesc, { color: p.muted }]}>{unbroken(desc || '')}</Text>}"],
  // ── The look: WebKit's lines and boxes (Wizard.tsx, Generating.tsx, wizard-screen.ts) ──
  [WIZ, "a card's name stands at iOS's own line", "optionLabel: { fontFamily: DISPLAY, fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: -PX },", "optionLabel: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', marginTop: -PX },"],
  [WIZ, "a card's name keeps the pixel iOS adds", "optionLabel: { fontFamily: DISPLAY, fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: -PX },\n", "optionLabel: { fontFamily: DISPLAY, fontSize: 15, lineHeight: 20, fontWeight: '700' },\n"],
  [WIZ, "the pixel given back is a whole point", "const PX = 1 / PixelRatio.get();", "const PX = 1;"],
  [WIZ, "a summary row's value keeps its pixel", "fontWeight: '500', textAlign: 'right', marginTop: -PX },", "fontWeight: '500', textAlign: 'right' },"],
  [WIZ, "the start's field keeps its pixel", "  dateText: { textAlign: 'center', marginTop: -PX },", "  dateText: { textAlign: 'center' },"],
  [WIZ, "a day's name is not let down", "fontWeight: '700', marginTop: -PX, top: 1 },", "fontWeight: '700', marginTop: -PX },"],
  [WIZ, "the floor's lock is not let down", "  floorIcon: { top: 1 },", "  floorIcon: { top: 0 },"],
  [WIZ, "the name's letters sit low in the field", "  nameField: { height: 47, paddingTop: 0, paddingBottom: 4.67 },", "  nameField: { height: 47, paddingTop: 0, paddingBottom: 0 },"],
  [WIZ, "a card's line keeps its fraction", "optionDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 3 - PX },", "optionDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16.8, marginTop: 3 - PX },"],
  [WIZ, "Back's words stand a point low", "backText: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: -PX },", "backText: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 18, fontWeight: '700', marginTop: -PX },"],
  [WIZ, "a hint keeps its fraction", "hint: { fontFamily: TEXT, fontSize: 12, lineHeight: 21, marginBottom: -PX },", "hint: { fontFamily: TEXT, fontSize: 12, lineHeight: 21.6, marginBottom: -PX },"],
  [WIZ, "the last button's words are a size up", "nextText: { fontFamily: DISPLAY, fontSize: 16, lineHeight: 21, fontWeight: '700', marginTop: -PX },", "nextText: { fontFamily: DISPLAY, fontSize: 17, lineHeight: 21, fontWeight: '700', marginTop: -PX },"],
  [WIZ, "a 1.5 edge is drawn at 1.5", "const EDGE = Math.floor(1.5 * PixelRatio.get()) / PixelRatio.get();", "const EDGE = 1.5;"],
  [WIZ, "a card's edge is a whole point", "  option: { borderWidth: EDGE, borderRadius: 16, padding: 14 },", "  option: { borderWidth: 1, borderRadius: 16, padding: 14 },"],
  [WIZ, "the name's field takes its own height", "  nameField: { height: 47, paddingTop: 0, paddingBottom: 4.67 },\n", "  nameField: { paddingTop: 0, paddingBottom: 4.67 },\n"],
  [WIZ, "a start set by a race date sits as a plain field", "alignItems: 'center', marginTop: 2, paddingTop: 10, gap: 10 },", "alignItems: 'center' },"],
  [WIZ, "the summary has no edge", "summary: { borderRadius: 24, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden', marginTop: 4 },", "summary: { borderRadius: 24, overflow: 'hidden', marginTop: 4 },"],
  [WIZ, "an add-on row's icon stands in no line", "<View style={[s.noShrink, small && s.typeIconSmall]}>", "<View style={s.noShrink}>"],
  [GEN, "the generating screen's title stands at iOS's own line", "fontSize: 24, lineHeight: 31, fontWeight: '700', textAlign: 'center' },", "fontSize: 24, fontWeight: '700', textAlign: 'center' },"],
  [SCREEN, "a slash ends a line", "  return text.replace(/\\//g, '/' + String.fromCharCode(0x2060));", "  return text;"],
  [SCREEN, "the widest title stands 34", "  return 36;\n}", "  return 34;\n}"],
  [SCREEN, "a 402 wide title stands 32", "[25.7, 32], [26.7, 33], [27.5, 34]];", "[25.7, 32], [26.7, 32], [27.5, 34]];"],
  [SCREEN, "the title's line is the first row's whatever its size", "  for (const [upTo, line] of TITLE_LINES) if (size < upTo) return line;", "  for (const [upTo, line] of TITLE_LINES) if (size < 99 || upTo) return line;"],
  [WIZ, "a row card's check is always seen", "<Text style={[s.check, { color: p.accent, opacity: on ? 1 : 0 }]}>✓</Text>", "<Text style={[s.check, { color: p.accent, opacity: 1 }]}>✓</Text>"],
  [WIZ, "a sport's tap draws nothing", "onPress={() => { toggleCardioTypeSport(st, sp.id); render(); }}", "onPress={() => { toggleCardioTypeSport(st, sp.id); }}"],
  [WIZ, "a sport's name is not drawn", "<Text style={[s.sportName, { color: sp.sel ? p.accent : p.text }]}>{sp.name}</Text>", "<Text style={[s.sportName, { color: sp.sel ? p.accent : p.text }]}>{sp.id}</Text>"],
  [WIZ, "a sport's line is not drawn", "<Text style={[s.sportDesc, { color: p.muted }]}>{sp.desc}</Text>", "<Text style={[s.sportDesc, { color: p.muted }]}>{sp.name}</Text>"],
  [WIZ, "a sport's check is always seen", "<Text style={[s.sportCheck, { color: p.accent, opacity: sp.sel ? 1 : 0 }]}>✓</Text>", "<Text style={[s.sportCheck, { color: p.accent, opacity: 1 }]}>✓</Text>"],
  [WIZ, "a sport's icon is a size down", "<Icon name={sp.icon} size={24} color={p.text} />", "<Icon name={sp.icon} size={22} color={p.text} />"],
  [WIZ, "a shut sport lists its goals", "              {sp.sel && (", "              {true && ("],
  [WIZ, "a goal's name is not drawn", "<Text style={[s.optionLabel, { color: g.sel ? p.accent : p.text }]}>{g.label}</Text>", "<Text style={[s.optionLabel, { color: g.sel ? p.accent : p.text }]}>{g.id}</Text>"],
  [WIZ, "a goal's line is not drawn", "<Text style={[s.optionDesc, { color: p.muted }]}>{g.desc}</Text>", "<Text style={[s.optionDesc, { color: p.muted }]}>{g.label}</Text>"],
  [WIZ, "a focus's tap writes the equipment", "() => { setChoice(st, 'liftingFocus', c.id); render(); }", "() => { setChoice(st, 'equipment', c.id); render(); }"],
  [WIZ, "the add-on is drawn on every path", "        {l.addOn && (", "        {(l.addOn || true) && ("],
  [WIZ, "the add-on's heading is not drawn", "{W.lifting.addOn}</Text>", "{''}</Text>"],
  [WIZ, "an add-on sport's tap draws nothing", "() => { toggleCardioTypeSport(st, t.id); render(); }", "() => { toggleCardioTypeSport(st, t.id); }"],
  [WIZ, "Lift Only clears nothing", "() => { liftOnly(st); render(); })}", "() => { render(); })}"],
  [WIZ, "Lift Only is marked while a sport is chosen", "typeCard('wizard-lift-only', l.addOn.liftOnly, 'dumbbell', 22,", "typeCard('wizard-lift-only', true, 'dumbbell', 22,"],
  [WIZ, "a day's tap says no toast", "onPress={() => { toast(toggleRestDay(st, x.key)); render(); }}", "onPress={() => { toggleRestDay(st, x.key); render(); }}"],
  [WIZ, "a day's name is not drawn", "{x.short}</Text>", "{x.key}</Text>"],
  [WIZ, "a resting day has no mark", "{x.rest ? <Text style={[s.dayMark, { color: 'rgba(' + p.inkRgb + ',0.2)', opacity: 0.5 }]}>✕</Text>", "{false ? <Text style={[s.dayMark, { color: 'rgba(' + p.inkRgb + ',0.2)', opacity: 0.5 }]}>✕</Text>"],
  [WIZ, "a locked day has no lock", ": x.blocked ? <View style={[s.dayLock, { opacity: 0.6 }]}><Icon name=\"🔒\" size={10} color={p.muted} /></View> : null}", ": null}"],
  [WIZ, "a locked day is not dimmed", "opacity: x.blocked ? 0.5 : 1 }]}>", "opacity: 1 }]}>"],
  [WIZ, "the count of training days is not drawn", "{W.days.legend}<Text style={[s.bold, { color: p.text }]}>{d.count}</Text>{W.days.selected}</Text>", "{W.days.legend}{W.days.selected}</Text>"],
  [WIZ, "the floor's box is never drawn", "        {f && (\n          <View testID=\"wizard-floor\"", "        {false && f && (\n          <View testID=\"wizard-floor\""],
  [WIZ, "the floor's heading has no lock", "<View style={s.floorIcon}><Icon name=\"🔒\" size={13} color={p.accent} /></View><Text style={[s.floorTitle, { color: p.accent }]}>{W.days.lockTitle}</Text>", "<Text style={[s.floorTitle, { color: p.accent }]}>{W.days.lockTitle}</Text>"],
  [WIZ, "the floor's goal is not named", "{W.days.floorGoal.before}<Text style={s.bold}>{f.reason}</Text>{W.days.floorGoal.mid}", "{W.days.floorGoal.before}{W.days.floorGoal.mid}"],
  [WIZ, "the floor's number is not drawn", "<Text style={s.bold}>{f.min + W.days.floorGoal.days}</Text>{W.days.floorGoal.after}</Text>", "{W.days.floorGoal.after}</Text>"],
  [WIZ, "the floor's words with no goal are the goal's", ": <Text style={[s.floorText, { color: p.text }]}>{W.days.floorThree}</Text>}", ": <Text style={[s.floorText, { color: p.text }]}>{W.days.floorGoal.after}</Text>}"],
  [WIZ, "the advisories are not drawn", "{d.advisories.map((a, i) => iconLine(a, 14, p.accent, [s.advisory, { color: p.accent }], s.bold, s.left, String(i)))}", "{null}"],
  [WIZ, "the name's label is not drawn", "{W.name.nameLabel}</Text>", "{''}</Text>"],
  [WIZ, "the name is not typed into the draft", "onChangeText={(t) => setName(st, t)} maxLength={40}", "onChangeText={() => {}} maxLength={40}"],
  [WIZ, "the name takes fifty letters", "onChangeText={(t) => setName(st, t)} maxLength={40} returnKeyType", "onChangeText={(t) => setName(st, t)} maxLength={50} returnKeyType"],
  [WIZ, "the field shows the name as it was when the step opened, typed over", "<TextInput testID=\"wizard-name\" defaultValue={n.name}", "<TextInput testID=\"wizard-name\" defaultValue={''}"],
  [WIZ, "the start's field is drawn under a race date", "        {n.aligned ? (\n          <View style={s.group}>", "        {!n.aligned ? (\n          <View style={s.group}>"],
  [WIZ, "the start's label is not drawn", "<Text style={[s.label, { color: p.muted }]}>{W.name.startLabel}</Text>\n            <View testID=\"wizard-start-derived\"", "<Text style={[s.label, { color: p.muted }]}>{''}</Text>\n            <View testID=\"wizard-start-derived\""],
  [WIZ, "a start set by a race: its day is not drawn", "<Text style={[s.fieldText, s.derivedText, { color: p.text }]}>{n.aligned.start}</Text>", "<Text style={[s.fieldText, s.derivedText, { color: p.text }]}>{''}</Text>"],
  [WIZ, "a start set by a race: where it comes from is not drawn", "<Text style={[s.src, { color: p.muted }]}>{W.name.derived}</Text>", "<Text style={[s.src, { color: p.muted }]}>{''}</Text>"],
  [WIZ, "a start under the floor is not in signal", "{copy(n.aligned.copy, [s.resolve, { color: n.aligned.warn ? p.signal : p.muted }], [s.resolveBold, { color: p.text }])}", "{copy(n.aligned.copy, [s.resolve, { color: p.muted }], [s.resolveBold, { color: p.text }])}"],
  [WIZ, "the opening week's pip is not in signal", "backgroundColor: c === 'behind' ? p.border2 : c === 'open' ? p.signal : c === 'race' ? p.text : p.surface3 }]} />", "backgroundColor: c === 'behind' ? p.border2 : c === 'race' ? p.text : p.surface3 }]} />"],
  [WIZ, "the pips are not drawn", "            {n.aligned.pips && (", "            {false && n.aligned.pips && ("],
  [WIZ, "the start date's field shows the stored day", "<Text style={[s.fieldText, s.dateText, { color: p.text }]}>{dateFieldText(n.startDate) || ' '}</Text>", "<Text style={[s.fieldText, s.dateText, { color: p.text }]}>{n.startDate || ' '}</Text>"],
  [WIZ, "the sentence under the field is not drawn", "{copy(n.resolveCopy, [s.resolve, { color: p.muted }], [s.resolveBold, { color: p.text }])}", "{null}"],
  [WIZ, "the calendar opens on today whatever the draft holds", "onPress={() => onDate({ value: st.draft.startDate || '', min: null, onChange: picked })}", "onPress={() => onDate({ value: '', min: null, onChange: picked })}"],
  [WIZ, "the calendar has an earliest day", "min: null, onChange: picked })}", "min: n.startDate, onChange: picked })}"],
  [WIZ, "a picked day draws the whole step", "setDrawn((d) => (d.view.step === 'name' ? { shell: d.shell, view: { step: 'name', name: repaintStart(st, d.view.name, new Date()) } } : d)); };", "render(); };"],
  [WIZ, "a picked day is not written", "const picked = (iso: string): void => { setStart(st, iso); setDrawn", "const picked = (iso: string): void => { void iso; setDrawn"],
  [WIZ, "the summary's heading is not drawn", "{W.name.summary}</Text>", "{''}</Text>"],
  [WIZ, "a row's key is not drawn", "<Text style={[s.rowKey, { color: p.muted }]}>{r.k}</Text>", "<Text style={[s.rowKey, { color: p.muted }]}>{''}</Text>"],
  [WIZ, "a row's value is not drawn", "{iconLine(r.v, 15, p.text, [s.rowVal, { color: p.text }], s.bold, s.right)}", "{null}"],
  [WIZ, "a wrapping line's bold runs are plain", ": <Text key={i} style={r.bold && bold}>{r.text}</Text>))}", ": <Text key={i}>{r.text}</Text>))}"],
  [WIZ, "a line's icons are not drawn", "? <SvgXml key={i} xml={r.icon.replace(/ style=\"[^\"]*\"/, '')} color={color} width={size} height={size} />", "? null"],
  [WIZ, "a line's words are not drawn", ": <Text key={i} style={[style, r.bold && bold]}>{r.text}</Text>))}", ": null))}"],
  [WIZ, "the pop-up is always up", "      {warn && (\n        <View testID=\"length-warning\"", "      {(warn || true) && (\n        <View testID=\"length-warning\""],
  [WIZ, "the pop-up's kicker is not drawn", "{LENGTH_WORDS.kicker}</Text>", "{''}</Text>"],
  [WIZ, "the pop-up's title is not drawn", "{LENGTH_WORDS.title(warn.weeks)}</Text>", "{''}</Text>"],
  [WIZ, "the pop-up's warning is not drawn", "{warn.msg + '\\n\\n' + LENGTH_WORDS.body(warn.weeks).before}", "{LENGTH_WORDS.body(warn.weeks).before}"],
  [WIZ, "the pop-up's length is not bold", "<Text style={[s.bold, { color: p.text }]}>{LENGTH_WORDS.body(warn.weeks).bold}</Text>{LENGTH_WORDS.body(warn.weeks).after}", "{LENGTH_WORDS.body(warn.weeks).bold}{LENGTH_WORDS.body(warn.weeks).after}"],
  [WIZ, "Go Back builds", "onPress={() => { setWarn(null); render(); }}", "onPress={() => { setWarn(null); go(); }} "],
  [WIZ, "Build goes back", "onPress={() => { setWarn(null); go(); }} style={[s.warnBtn, s.warnBuild", "onPress={() => { setWarn(null); render(); }} style={[s.warnBtn, s.warnBuild"],
  [WIZ, "Go Back's words are not drawn", "{LENGTH_WORDS.back}</Text>", "{''}</Text>"],
  [WIZ, "Build's words are not drawn", "{LENGTH_WORDS.build(warn.weeks)}</Text>", "{''}</Text>"],
  [WIZ, "the generating screen is up from the start", "      {gen && (\n        <Generating", "      {(gen || { first: '', lines: [] }) && (\n        <Generating"],
  [WIZ, "the build stamps no instant", "const r = finishGenerate(store, st.draft, Date.now(), report); done.current = r.prog; return r.ready;", "const r = finishGenerate(store, st.draft, 0, report); done.current = r.prog; return r.ready;"],
  [WIZ, "the program built is not handed on", "done.current = r.prog; return r.ready; }}", "return r.ready; }}"],
  [WIZ, "landing hands nothing to the app", "onLand={() => { if (done.current) onDone(done.current); }} />", "onLand={() => {}} />"],
  // ── The generating screen (Generating.tsx) ──
  [GEN, "the lines never change", "const tick = setInterval(() => { if (i < lines.length) setLine(lines[i++]!); }, GENERATING.tickMs);", "const tick = setInterval(() => { i++; }, GENERATING.tickMs);"],
  [GEN, "the lines go on after the build", "    const built = setTimeout(() => {\n      clearInterval(tick);", "    const built = setTimeout(() => {"],
  [GEN, "the build waits for nothing", "    }, GENERATING.buildMs);", "    }, 0);"],
  [GEN, "a failed build lands", "setLine(GENERATING.error(err instanceof Error ? err.message : String(err)));\n        return;", "setLine(GENERATING.error(err instanceof Error ? err.message : String(err)));"],
  [GEN, "a failed build says nothing", "setLine(GENERATING.error(err instanceof Error ? err.message : String(err)));", "void err;"],
  [GEN, "the ready line is not shown", "      setLine(ready);", "      void ready;"],
  [GEN, "This Week shows at once", "land = setTimeout(() => calls.current.onLand(), GENERATING.landMs);", "land = setTimeout(() => calls.current.onLand(), 0);"],
  [GEN, "the screen's title is not drawn", "{GENERATING.title}</Text>", "{''}</Text>"],
  [GEN, "the line is not drawn", "style={[s.sub, { color: p.muted }]}>{line}</Text>", "style={[s.sub, { color: p.muted }]}>{first}</Text>"],
  [GEN, "the line opens blank", "const [line, setLine] = useState(first);", "const [line, setLine] = useState('');"],
  [GEN, "the bar does not sink", "<G transform={'translate(0 ' + f.dy + ')'}>", "<G transform={'translate(0 0)'}>"],
  [GEN, "both legs are the left", "<Path d={f.right} />", "<Path d={f.left} key=\"r\" />"],
  [GEN, "the sparks are not drawn", "{f.sparks.map((k, i) => <Circle key={i} cx={k.cx} cy={k.cy} r={k.r} opacity={k.opacity} />)}", "{null}"],
  [GEN, "the sparks are in the text colour", "<G stroke=\"none\" fill={p.signal}>", "<G stroke=\"none\" fill={p.text}>"],
  [GEN, "the figure stands still", "const step = (at: number): void => { if (start < 0) start = at; setMs(at - start); frame = requestAnimationFrame(step); };", "const step = (at: number): void => { if (start < 0) start = at; frame = requestAnimationFrame(step); };"],
  // ── The app, This Week and the Programs tab ──
  [LIST, "Build New Program takes no press", "<Pressable testID=\"build-new\" accessibilityRole=\"button\" onPress={onBuild}", "<Pressable testID=\"build-new\" accessibilityRole=\"button\""],
  [APP, "Build New Program opens no wizard", "onBuild={() => setWizard(++wizardN.current)}", "onBuild={() => {}}"],
  [APP, "a second Build New Program keeps the first's draft", "<Wizard key={'wizard' + wizard} palette={p}", "<Wizard palette={p}"],
  [APP, "Back on the first step leaves the wizard up", "onDate={openDate} onClose={() => setWizard(null)}", "onDate={openDate} onClose={() => {}}"],
  [APP, "the wizard's field opens no calendar", "report={report} onDate={openDate} onClose", "report={report} onDate={() => {}} onClose"],
  [APP, "the landing is not handed to This Week", "            hand.land = landingTitle(prog, midnight(new Date()));", "            void prog;"],
  [APP, "the launch after Generate raises the reminder", "            quiet.current = true;", "            void 0;"],
  [APP, "the reminder stays quiet for good", "    if (quiet.current) { quiet.current = false; return; }", "    if (quiet.current) return;"],
  [APP, "after Generate the app stays on the Programs tab", "setWizard(null); setHeld(null); setTick((n) => n + 1); setTab('week');", "setWizard(null); setHeld(null); setTick((n) => n + 1);"],
  [APP, "after Generate the wizard stays up", "            setWizard(null); setHeld(null); setTick", "            setHeld(null); setTick"],
  [APP, "after Generate This Week does not launch again", "setHeld(null); setTick((n) => n + 1); setTab('week');", "setHeld(null); setTab('week');"],
  [APP, "the toast draws no mark", "{icon !== null && <SvgXml xml={asyIcon(icon, 13).replace(/ style=\"[^\"]*\"/, '')} color=\"#0a0a0a\" width={13} height={13} />}", "{null}"],
  [APP, "the toast drops its mark when said", "setToast((t) => ({ text, icon: icon || null, n: t ? t.n + 1 : 1 }));", "setToast((t) => ({ text, icon: null, n: t ? t.n + 1 : 1 }));"],
  [WEEK, "This Week does not read where the wizard landed", "  const land = useRef(hand.land || null).current;", "  const land = useRef<{ pick: number | null; own: number } | null>(null).current;"],
  [WEEK, "This Week opens on the launch's title after Generate", "useState<number | null>(land ? land.pick : null);", "useState<number | null>(null);"],
  [WEEK, "a new program resets the landing's title", "    if (shownPick !== null && !hand.land) setShown(null);", "    if (shownPick !== null) setShown(null);"],
  [WEEK, "This Week does not take the landing's week as its own", "  if (hand.land && prog) { hand.own = hand.land.own; hand.land = null; }", "  if (hand.land && prog) { hand.land = null; }"],
  [WEEK, "the landing is taken at every mount", "  if (hand.land && prog) { hand.own = hand.land.own; hand.land = null; }\n", "  if (hand.land && prog) { hand.own = hand.land.own; }\n"],
  // ── The cardio goals (the second session): the readers (wizard-readers.ts) ──
  [READ, "the swim 500 goal is 400 long", "{ swim_500_time: 500, swim_100_time: 100 }", "{ swim_500_time: 400, swim_100_time: 100 }"],
  [READ, "an intermediate runner improves two seconds a week", "{ beginner: 3, intermediate: 3, advanced: 2 }", "{ beginner: 3, intermediate: 2, advanced: 2 }"],
  [READ, "the length line asks for the mile when one is entered", "if (!(p && p.tw) && draftMileState(d).blank) return '<b", "if (!(p && p.tw) && !draftMileState(d).blank) return '<b"],
  [READ, "the length line says 1 weeks", "n + (n === 1 ? ' week.' : ' weeks.')", "n + ' weeks.'"],
  [READ, "the length line's test words lose their full stop", "'Your test sets it.'", "'Your test sets it'"],
  [READ, "a beginner's mile is required on the pace goal", "if (g.id === 'run_pace_goal' && exp !== 'beginner') return 'Required. Your paces", "if (g.id === 'run_pace_goal') return 'Required. Your paces"],
  [READ, "an 11 minute mile takes a", "/^(8|11|18):/", "/^(8|18):/"],
  [READ, "a kilometre is 0.6 of a mile", "rawDist * 0.621", "rawDist * 0.6"],
  [READ, "the intermediate default pace is 9:20", "{ beginner: 690, intermediate: 570, advanced: 450 }", "{ beginner: 690, intermediate: 560, advanced: 450 }"],
  [READ, "the reach is flagged only a minute off", "if (achievable - tPacePerMile < 45) return null;", "if (achievable - tPacePerMile < 60) return null;"],
  [READ, "a runner of 55 or over improves faster", "{ '55+': 0.65, '36-54': 0.85, '18-35': 1.0 }", "{ '55+': 0.7, '36-54': 0.85, '18-35': 1.0 }"],
  [READ, "a target at the current pace is flagged", "if (tPacePerMile >= currentPace) return null;", "if (tPacePerMile > currentPace) return null;"],
  [READ, "the reach sentence reads the level default when a mile is entered", "if (f.fromMile) return 'Your mile is '", "if (!f.fromMile) return 'Your mile is '"],
  [READ, "the reach sentence says 1 weeks", "const wk = f.L + (f.L === 1 ? ' week' : ' weeks');", "const wk = f.L + ' weeks';"],
  [READ, "the pace line shows with no distance", "if (!g || g['targetMins'] === undefined || g['targetMins'] === '' || !g['targetDist']) return '';\n  const t = paceGoalTarget", "if (!g || g['targetMins'] === undefined || g['targetMins'] === '') return '';\n  const t = paceGoalTarget"],
  [READ, "the swim pace is per 50", "_clkMS(totalSecs / (dist / 100))", "_clkMS(totalSecs / (dist / 50))"],
  [READ, "the swim pace line shows at zero", "if (!(totalSecs > 0)) return '';", "if (totalSecs < 0) return '';"],
  [READ, "the swim pace line's unit is metres unless said", "const unit = (g['swimUnit'] as string) || 'yd';\n  return asyIcon", "const unit = (g['swimUnit'] as string) || 'm';\n  return asyIcon"],
  [READ, "the weeks to the race are not written", "  d.raceDateWeeks = cd.weeks;", "  void 0;"],
  [READ, "yesterday's date has not passed", "  if (cd.days < 0) {", "  if (cd.days < -1) {"],
  [READ, "the pace frame shows beside a race date", "((d.primaryPath === 'event' && d.eventTargeted && d.raceDate) || !f)", "(!f)"],
  [READ, "the card drops the reach sentence", "const reach = f ? '<div style=\"margin-top:5px\">'", "const reach = !f ? '<div style=\"margin-top:5px\">'"],
  [READ, "a test weeks out is drawn in the run colour whatever its reach", "card(f ? 'var(--accent)' : 'var(--run)', 'Your test is in week '", "card('var(--run)', 'Your test is in week '"],
  [READ, "a week that holds the test reads as any test week", "else if (p.tw === 1 && p.holdsTest) out.card", "else if (p.tw === 1 && !p.holdsTest) out.card"],
  [READ, "a test before the first training day is drawn in the ink", "else if (p.week === null) out.card = card('var(--signal)'", "else if (p.week === null) out.card = card('var(--accent)'"],
  [READ, "a race two weeks out is too soon", "  if (cd.weeks < 1) {", "  if (cd.weeks < 2) {"],
  [READ, "a race plan under its floor is drawn in the run colour", "card(al.underFloor ? 'var(--signal)' : 'var(--run)', alignedStartCopy(d, al));", "card('var(--run)', alignedStartCopy(d, al));"],
  [READ, "a program a week short of race day peaks on it", "  if (diff > 0) {", "  if (diff > 1) {"],
  [READ, "one week before race day reads weeks", "diff + ' week' + (diff > 1 ? 's' : '')", "diff + ' weeks'"],
  [READ, "a program that peaks on race day is short for it", "  if (diff === 0) {", "  if (diff === 99) {"],
  [READ, "three weeks short is drawn in the ink", "const color = diff >= -2 ? 'var(--accent)' : 'var(--red)';", "const color = diff >= -3 ? 'var(--accent)' : 'var(--red)';"],
  [READ, "the pace line is painted on a form that has none", "  if (paint.pace !== null) out.pace = paceDisplay(d);", "  out.pace = paceDisplay(d);"],
  [READ, "the card is painted on a step that has none", "  if (paint.card === null) return out;", "  if (paint.card === undefined) return out;"],
  [READ, "the length line is not repainted", "  if (paint.progLen !== null) out.progLen = progLenLine(d, now, p, len);", "  void 0;"],
  // ── The cardio goals: the whole draw and the taps (wizard-screen.ts) ──
  [SCREEN, "the race date's field is not held", "    raceField: race ? race.value : null,", "    raceField: null,"],
  [SCREEN, "the swim pace line is drawn hidden", "(swim.paceShown ? swim.paceLine : '') : null,", "(swim.paceShown ? '' : '') : null,"],
  [SCREEN, "the mile's advisory is not held", "    mileAdvisory: mile ? mile.advisory : null,", "    mileAdvisory: null,"],
  [SCREEN, "the swim's advisory is not held", "    swimAdvisory: swim && swim.kind === 'swim' ? swim.advisory : null,", "    swimAdvisory: null,"],
  [SCREEN, "a whole draw skips the step's repaint", "  return { cardio, paint: raceFeedback(d, now, paint) };", "  return { cardio, paint };"],
  [SCREEN, "the model reads no swim distance", "hybridExcluded: HYBRID_EXCLUDED_GOALS, swimDist: SWIM_GOAL_DIST,", "hybridExcluded: HYBRID_EXCLUDED_GOALS, swimDist: {},"],
  [SCREEN, "the model's mile help is blank", "    mileHelp: () => mileFieldHelp(d),", "    mileHelp: () => '',"],
  [SCREEN, "the model's length line is blank", "    progLen: () => progLenLine(d, now),", "    progLen: () => '',"],
  [SCREEN, "the seed reader is never run", "() => seedFromStoredPrograms(store, now.getTime()) as Seed | null,", "() => null,"],
  [SCREEN, "a goal picked over another drops its baseline", "  g.baseline = g.baseline || '';", "  g.baseline = '';"],
  [SCREEN, "a goal is named by its id", "  g.label = goalData ? goalData.label : '';", "  g.label = id;"],
  [SCREEN, "the pace unit is written as the swim's", "st.draft.cardioGoals['run']!['paceUnit'] = unit;", "st.draft.cardioGoals['run']!['swimUnit'] = unit;"],
  [SCREEN, "the swim unit is written as the pace's", "st.draft.cardioGoals['swim']!['swimUnit'] = unit;", "st.draft.cardioGoals['swim']!['paceUnit'] = unit;"],
  [SCREEN, "the seed's mile keeps sixty seconds", "    if (ss === 60) { mm++; ss = 0; }", "    if (ss === 61) { mm++; ss = 0; }"],
  [SCREEN, "the seed's mile is marked as entered", "{ kind: 'seeded', prog: s.progName || '', n: s.n || 0 }", "{ kind: 'entered', prog: s.progName || '', n: s.n || 0 }"],
  [SCREEN, "the seed's baseline is always in miles", "g.baseline = s.maxDist + ((g['paceUnit'] as string) || 'mi'); }", "g.baseline = s.maxDist + 'mi'; }"],
  [SCREEN, "Use this data does not mark the seed applied", "  d._seedApplied = true;", "  d._seedApplied = false;"],
  [SCREEN, "Start fresh does not turn the seed down", "._seedDismissed = true;", "._seedDismissed = false;"],
  [SCREEN, "Just building fitness keeps the race date", "    d.raceDate = '';\n    d.raceDateWeeks = null;", "    d.raceDateWeeks = null;"],
  [SCREEN, "Just building fitness keeps the weeks", "    d.raceDate = '';\n    d.raceDateWeeks = null;\n", "    d.raceDate = '';\n"],
  [SCREEN, "I have a race date sets today over a date picked", "    if (!d.raceDate) d.raceDate = localIso(now);\n  } else {", "    d.raceDate = localIso(now);\n  } else {"],
  [SCREEN, "the shorter plan's toast loses its check", "'Switched to the ' + def.label + ' plan ✓'", "'Switched to the ' + def.label + ' plan'"],
  [SCREEN, "the shorter plan keeps the longer one's name", "  run.id = def.id; run.label = def.label;", "  run.id = def.id;"],
  [SCREEN, "a target's seconds are not padded", "mins + ':' + String(secs).padStart(2, '0');", "mins + ':' + String(secs);"],
  [SCREEN, "a swim target does not write its m:ss", "    updatePaceTime(g);\n    return paint.swimPace === null", "    return paint.swimPace === null"],
  [SCREEN, "a swim target repaints nothing", "    return paint.swimPace === null ? paint : { ...paint, swimPace: swimPaceDisplay(d) };", "    return paint;"],
  [SCREEN, "a swim time repaints nothing", "  if (field === 'swimBase') return paint.swimAdvisory === null ? paint : { ...paint, swimAdvisory: swimAdvisory(swimEntryState(d.cardioGoals['swim'])) };", "  if (field === 'swimBase') return paint;"],
  [SCREEN, "the target distance repaints nothing", "  if (field === 'runDist') return raceFeedback(d, now, paint);", "  if (field === 'runDist') return paint;"],
  [SCREEN, "a run target does not write its m:ss", "  if (field === 'runTarget') {\n    updatePaceTime(g);", "  if (field === 'runTarget') {"],
  [SCREEN, "the pace goal's baseline is always in miles", "    g.baseline = v + ((g['paceUnit'] as string) || 'mi');\n    return raceFeedback", "    g.baseline = v + 'mi';\n    return raceFeedback"],
  [SCREEN, "a typed mile is not marked as entered", "    g['mileBestSrc'] = { kind: 'entered' };", "    void 0;"],
  [SCREEN, "a typed mile does not repaint its advisory", "    return out.mileAdvisory === null ? out : { ...out, mileAdvisory: mileAdvisory(draftMileState(d)) };", "    return out;"],
  [SCREEN, "a baseline is stored with no unit", "  g.baseline = v + baselineSuffix(sport);", "  g.baseline = v;"],
  [SCREEN, "a typed bike or swim baseline repaints the length line", "  return sport === 'run' ? raceFeedback(d, now, paint) : paint;", "  return raceFeedback(d, now, paint);"],
  [SCREEN, "a run baseline repaints nothing", "  return sport === 'run' ? raceFeedback(d, now, paint) : paint;\n", "  return paint;\n"],
  [SCREEN, "a picked race day is not held by the field", "  return raceFeedback(st.draft, now, { ...paint, raceField: v });", "  return raceFeedback(st.draft, now, paint);"],
  [SCREEN, "a blank from the race date's field is not written", "  st.draft.raceDate = v;\n  return raceFeedback", "  if (v) st.draft.raceDate = v;\n  return raceFeedback"],
  [SCREEN, "a framed line's reach sentence is not cut out", "body: r ? r[1]! : m[3]!, reach: r ? r[2]! : null };", "body: m[3]!, reach: null };"],
  [SCREEN, "the red line is read as a card", "card: /padding:9px 11px/.test(m[2]!),", "card: true,"],
  [SCREEN, "a bold run that carries a colour is plain", "<b(?: [^>]*)?>([\\s\\S]*?)<\\/b>", "<b>([\\s\\S]*?)<\\/b>"],
  [SCREEN, "a toast with no mark draws the warning", "(t.icon ? asyIcon(t.icon, 13) + ' ' + t.text : t.text);", "asyIcon(t.icon || '⚠', 13) + ' ' + t.text;"],
  // ── A number field (number-field.ts) ──
  [NUM, "a second point is kept", "const KEPT = /^[+-]?\\d*(\\.\\d*)?([eE][+-]?\\d*)?$/;", "const KEPT = /^[+-]?[\\d.]*([eE][+-]?\\d*)?$/;"],
  [NUM, "any key is kept", "const KEPT = /^[+-]?\\d*(\\.\\d*)?([eE][+-]?\\d*)?$/;", "const KEPT = /^.*$/;"],
  [NUM, "an e is not kept", "const KEPT = /^[+-]?\\d*(\\.\\d*)?([eE][+-]?\\d*)?$/;", "const KEPT = /^[+-]?\\d*(\\.\\d*)?$/;"],
  [NUM, "a sign is kept anywhere after the e", "([eE][+-]?\\d*)?$/;\n/** A text that is a whole number", "([eE][+-\\d]*)?$/;\n/** A text that is a whole number"],
  [NUM, "a plus at the start is handed back", ".replace(/^\\+/, '').replace(/\\.$/, '')", ".replace(/\\.$/, '')"],
  [NUM, "a point at the end is handed back", ".replace(/^\\+/, '').replace(/\\.$/, '')", ".replace(/^\\+/, '')"],
  [NUM, "a half typed number is handed back", "  return WHOLE.test(text) ?", "  return KEPT.test(text) ?"],
  [NUM, "a point with no digit before it is not a number", "(\\d+\\.?\\d*|\\.\\d+)", "(\\d+\\.?\\d*)"],
  [NUM, "a key that is not kept changes the text", "  return KEPT.test(next) ? next : prev;", "  return next;"],
  // ── The date box's Reset on a field drawn with its value as an attribute (date-box.ts, DateBox.tsx) ──
  [BOX, "Reset blanks a field drawn with a day", "  return ask.reset === undefined ? RESET_VALUE : ask.reset;", "  return RESET_VALUE;"],
  [BOX, "Reset leaves the calendar on the day it opened on, whatever the field was drawn with", "  return ask.reset === undefined ? opened : calendarDay(ask.reset, now);", "  return opened;"],
  [BOX, "a pressed button of the box does not dim", "export const PRESSED_DIM = 0.55;", "export const PRESSED_DIM = 1;"],
  [BOXC, "Reset does not dim under the finger", "{ backgroundColor: p.surface2 }, pressed && { opacity: PRESSED_DIM }]}", "{ backgroundColor: p.surface2 }]}"],
  [BOXC, "the check does not dim under the finger", "{ backgroundColor: p.signal }, pressed && { opacity: PRESSED_DIM }]}", "{ backgroundColor: p.signal }]}"],
  // ── The app's keyed children (App.tsx) ──
  [APP, "the wizard is keyed by its bare count", "<Wizard key={'wizard' + wizard}", "<Wizard key={wizard}"],
  [APP, "the calendar is keyed by its bare count", "<DateBox key={'date' + dateAsk.n}", "<DateBox key={dateAsk.n}"],
  [APP, "the toast is keyed as the wizard", "<Toast key={'toast' + toast.n}", "<Toast key={'wizard' + toast.n}"],
  // ── The cardio goals' drawing and wiring (Wizard.tsx) ──
  [WIZ, "a goal takes no press", "onPress={() => { setCardioGoal(st, sp.id, g.id); render(); }}", "onPress={() => { render(); }}"],
  [WIZ, "a goal's press draws nothing", "onPress={() => { setCardioGoal(st, sp.id, g.id); render(); }}", "onPress={() => { setCardioGoal(st, sp.id, g.id); }}"],
  [WIZ, "a typed field writes nothing", "repaint((was) => editCardioField(st, was, field, sport, key, val, new Date()));", "repaint((was) => was);"],
  [WIZ, "a number field keeps its text through a whole draw", "<NumField key={draws.current + sport + key}", "<NumField key={sport + key}"],
  [WIZ, "a whole draw is not counted", "const render = (): void => { draws.current++; setDrawn(wizardView(store, st, new Date())); };", "const render = (): void => { setDrawn(wizardView(store, st, new Date())); };"],
  [WIZ, "a key that is not kept does not call the handler", "onChangeText={(t) => { held.current = keptText(held.current, t); setText(held.current); onValue(fieldValue(held.current)); }}", "onChangeText={(t) => { const k = keptText(held.current, t); if (k === held.current) return; held.current = k; setText(k); onValue(fieldValue(k)); }}"],
  [WIZ, "a number field hands back its text", "onValue(fieldValue(held.current)); }}", "onValue(held.current); }}"],
  [WIZ, "a number field shows the number pad", "keyboardType=\"numbers-and-punctuation\"", "keyboardType=\"number-pad\""],
  [WIZ, "a number field's return key does not say done", " returnKeyType=\"done\" autoCorrect={false}", " autoCorrect={false}"],
  [WIZ, "a number field keeps the keys up on return", " returnKeyType=\"done\" autoCorrect={false}", " returnKeyType=\"done\" submitBehavior=\"submit\" autoCorrect={false}"],
  [WIZ, "a drag on the wizard's page leaves the keys up", " keyboardDismissMode=\"on-drag\" automaticallyAdjustKeyboardInsets>", " automaticallyAdjustKeyboardInsets>"],
  [WIZ, "a unit's press draws nothing", "onPress={() => { set(u); render(); }}", "onPress={() => { set(u); }}"],
  [WIZ, "a race button writes nothing", "onPress={() => { raceTargeted(st, targeted, new Date()); render(); }}", "onPress={() => { render(); }}"],
  [WIZ, "Use this data applies nothing", "onPress={() => { applySeedData(st); render(); }}", "onPress={() => { render(); }}"],
  [WIZ, "Start fresh turns nothing down", "onPress={() => { dismissSeedData(st); render(); }}", "onPress={() => { render(); }}"],
  [WIZ, "the race date's Reset blanks the field", "min: race.min, reset: race.value, onChange:", "min: race.min, onChange:"],
  [WIZ, "a picked race day writes nothing", "onChange: (iso) => repaint((was) => setRaceDate(st, was, iso, new Date())) })}", "onChange: () => repaint((was) => was) })}"],
  [WIZ, "the shorter plan's link says nothing", "const shorter = (goal: string): void => { toast(offerShorterPlan(st, goal)); render(); };", "const shorter = (goal: string): void => { offerShorterPlan(st, goal); render(); };"],
  [WIZ, "the shorter plan's link takes no press", "accessibilityRole=\"link\" onPress={() => shorter(r.link!)} style", "accessibilityRole=\"link\" style"],
  [WIZ, "a repaint draws the step whole", "const now = { shell: d.shell, view: { ...d.view, paint: lines(d.view.paint) } };", "const now = wizardView(store, st, new Date());"],
  [WIZ, "an advisory that refuses is drawn muted", "a.color === 'var(--signal)' ? p.signal : p.muted", "a.color === 'var(--signal)' ? p.muted : p.muted"],
  [WIZ, "the red line is drawn in the ink", "const col = f.hue === 'red' ? p.red :", "const col = f.hue === 'red' ? p.accent :"],
  [WIZ, "the reach sentence is not drawn", "{f.reach !== null && <Text style={[s.frameText, s.mt5, { color: col }]}>{f.reach}</Text>}", "{null}"],
  [WIZ, "the mile's help is not drawn", "{'Current mile time '}<Text style={s.plain}>{m.help}</Text></Text>", "{'Current mile time '}</Text>"],
  [WIZ, "the mile's advisory is not drawn", "{advisory('wizard-mile-advisory', pt.mileAdvisory)}", "{null}"],
  [WIZ, "the swim's advisory is not drawn", "{flat(f.baseMins, f.baseSecs, 'baseMins', 'baseSecs')}{advisory('wizard-swim-advisory', pt.swimAdvisory)}", "{flat(f.baseMins, f.baseSecs, 'baseMins', 'baseSecs')}"],
  [WIZ, "the 500 row is never drawn", "{f.base500 && (", "{f.base500 && false && ("],
  [WIZ, "the pace reach frame is not drawn", "{paceLine('wizard-pace', pt.pace)}{framed('wizard-reach', pt.feas)}", "{paceLine('wizard-pace', pt.pace)}"],
  [WIZ, "the swim pace line is not drawn", "{captioned(f.target, 'swim')}{paceLine('wizard-swim-pace', pt.swimPace)}", "{captioned(f.target, 'swim')}"],
  [WIZ, "the line for more than one sport is not drawn", "(ft.multi ? '\\nSessions rotate across training days. Each sport gets its own days.' : '')", "''"],
  [WIZ, "the card under the race date is not drawn", "<View style={s.mt8}>{framed('wizard-race-card', pt.card)}</View>", "<View style={s.mt8} />"],
  [WIZ, "the race date's field shows the day as stored", "{dateFieldText(pt.raceField || '') || ' '}", "{pt.raceField || ' '}"],
  [WIZ, "the box under the cards is always drawn", "        {ft && (", "        {(ft || true) && ("],
  [WIZ, "the seed banner is drawn under the pace goal alone", "          {seedBanner(f.seed)}\n          <View style={[s.group, s.mt10]}>", "          <View style={[s.group, s.mt10]}>"],
  [WIZ, "a form's goal draws no form", "{sp.form && form(sp.id, sp.form)}", "{null}"],
  [WIZ, "the Race date labels stand as measured before", "marginTop: -PX, top: -2 * PX },", "marginTop: -PX },"],
  [WIZ, "the pop-up's words stand a point high", "marginBottom: 12 - PX, paddingBottom: 2 * PX },", "marginBottom: 12 - PX },"],
  [WIZ, "a framed line stands at 18", "frameText: { fontFamily: TEXT, fontSize: 12, lineHeight: 19,", "frameText: { fontFamily: TEXT, fontSize: 12, lineHeight: 18,"],
  [WIZ, "a number field's words stand a point high", "numField: { height: 47, paddingTop: 0, paddingBottom: 2.67 },", "numField: { height: 47, paddingTop: 0, paddingBottom: 4.67 },"],
  [WIZ, "a caption stands at 13", "caption: { fontFamily: DISPLAY, fontSize: 10, lineHeight: 14,", "caption: { fontFamily: DISPLAY, fontSize: 10, lineHeight: 13,"],
  [WIZ, "an advisory stands at 16", "advisoryLine: { fontFamily: TEXT, fontSize: 11, lineHeight: 15,", "advisoryLine: { fontFamily: TEXT, fontSize: 11, lineHeight: 16,"],
  [WIZ, "the colon is drawn in the regular face", "colon: { fontFamily: TEXT, fontSize: 20, lineHeight: 26, fontWeight: '300' },", "colon: { fontFamily: TEXT, fontSize: 20, lineHeight: 26, fontWeight: '400' },"],
  [WIZ, "the race date's field has a whole 1.5 edge", "raceField: { borderWidth: EDGE,", "raceField: { borderWidth: 1.5,"],
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
  say.push('# The Expo app\'s wizard and Generate: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-wizard_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
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
  writeFileSync(join(HERE, 'native-wizard_breaks.md'), say.join('\n') + '\n');
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
if (!only && !part) writeFileSync(join(HERE, 'native-wizard_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
