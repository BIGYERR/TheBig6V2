// The Expo app's Programs tab (MIGRATION.md phase 3, row 5): the list, the goal sheet and the mile pencil, each rule
// by a hand table. The models are today's files, byte for byte. What the page keeps between draws, the readers the
// page keeps (the pace chips and their sentence, a card's selections, the goal tables, the mile's validator), the
// views, the writes to this app's own store, and the words and the wiring of the three screens. Every expected value
// here is typed by hand from today's code and rulings (D5 the goal switch, D110a the swim carry, D116 the mile
// pencil, D178 the one switch, D182 the countdown, D238 the past days marked as asked); the two apps side by side
// are tests/integration/native-program-list.test.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { type StateStore, memoryStore } from '@ia/core/engine/state-store.ts';
import { writeActiveProgramId, writePrograms } from '@ia/core/engine/state-programs.ts';
import { REPO } from '../support/app.ts';
import {
  CARDIO_GOALS_BY_TYPE, GOAL_RANK, GOAL_REQ_INPUTS, HYBRID_EXCLUDED_GOALS, goalInputsValid, mileEntryState, progSelData, runAnchorChips, runAnchorSentence,
} from '../../frontends/native/src/program-list/list-readers.ts';
import {
  activeId, archiveQuestion, askArchive, askPurge, cancelConfirm, endRename, goalView, listView, markupLines, newListState, openGoal, openMile, purgeWarning, refreshReport,
  selectGoal, startRename, tabRefused, toggleCard, typeGoal,
} from '../../frontends/native/src/program-list/list-screen.ts';
import {
  MILE_BOTH, RESTORE_FIRST, archiveProgram, commitGoalChange, commitMileChange, deleteProgram, loadActive, markPastAsked, renameProgram, setActive,
} from '../../frontends/native/src/program-list/list-writes.ts';
import { PURGE_FAMILIES } from '../../frontends/native/src/progress/progress-writes.ts';

process.env['TZ'] = 'America/New_York';
const NATIVE = join(REPO, 'frontends/native/src');
const TODAY = join(REPO, 'frontends/app/src/app/screens');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const J = JSON.stringify;
/** 2026-10-06 08:00, a Tuesday: the sixth week of a program that starts on Monday 2026-08-31. */
const NOW = new Date(2026, 9, 6, 8, 0, 0);
const NEVER = { overlay: (): never => { throw new Error('a rebuild was made'); }, freeze: (): never => { throw new Error('a rebuild was made'); }, rebuild: (): never => { throw new Error('a rebuild was made'); } };
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** A stored program as the wizard writes one, as far as the list reads it: lifting only unless `cfg` says more. */
const prog = (id: string, cfg: Record<string, unknown> = {}, over: Record<string, unknown> = {}): Record<string, any> => ({
  id, name: 'Block ' + id, goal: 'strength', totalWeeks: 9, startDate: '2026-08-31', seed: 7,
  cfg: { days: DAYS, restDays: ['sun', 'wed'], equipment: 'commercial', experience: 'advanced', ageBracket: '36-45', unit: 'kg', liftingFocus: 'strength', primaryPath: 'body', squat: 140, bench: 100, deadlift: 180, cardioTypes: [], cardioGoals: {}, seed: 7, ...cfg },
  ...over,
});
const RUN = { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_10k', label: 'Run a 10K', mileBestMins: '8', mileBestSecs: '30' } } };
function phone(programs: Record<string, any>[], active: string | null = programs[0] ? programs[0]['id'] : null): StateStore {
  const s = memoryStore();
  writePrograms(s, programs as never);
  if (active) writeActiveProgramId(s, active);
  return s;
}
const stored = (s: StateStore): Record<string, any>[] => JSON.parse(s.get('ia_programs') || '[]');

describe('native program list: the models are today\'s files', () => {
  for (const [dir, f] of [['program-list', 'program-list-model.ts'], ['program-list', 'program-detail-model.ts'], ['goal-sheet', 'goal-sheet-model.ts'], ['mile-sheet', 'mile-sheet-model.ts']] as const) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(TODAY, dir, f));
      const copy = readFileSync(join(NATIVE, dir, f));
      assert.ok(today.length > 1000, 'today\'s file was read');
      assert.ok(today.equals(copy), dir + '/' + f + ' differs from today\'s');
    });
  }
});

describe('native program list: what the page keeps between draws', () => {
  test('a launch leaves nothing open, nothing being renamed and nothing armed', () => {
    const st = newListState();
    assert.deepEqual([[...st.openIds], st.editId, st.confirmId, st.confirmTier], [[], null, null, 0]);
  });
  test('a tap on a card opens it and a second shuts it; two cards open apart', () => {
    const st = newListState();
    toggleCard(st, 'a'); toggleCard(st, 'b');
    assert.deepEqual([...st.openIds].sort(), ['a', 'b']);
    toggleCard(st, 'a');
    assert.deepEqual([...st.openIds], ['b']);
    toggleCard(st, 'b');
    assert.deepEqual([...st.openIds], []);
  });
  test('the pencil names the card being renamed; its end names none', () => {
    const st = newListState();
    startRename(st, 'a'); assert.equal(st.editId, 'a');
    startRename(st, 'b'); assert.equal(st.editId, 'b');
    endRename(st); assert.equal(st.editId, null);
  });
  test('Archive arms tier 1, Delete forever… tier 2 on the same card, Cancel stands both down', () => {
    const st = newListState();
    askArchive(st, 'a'); assert.deepEqual([st.confirmId, st.confirmTier], ['a', 1]);
    askPurge(st, 'a'); assert.deepEqual([st.confirmId, st.confirmTier], ['a', 2]);
    cancelConfirm(st); assert.deepEqual([st.confirmId, st.confirmTier], [null, 0]);
  });
});

describe('native program list: the readers the page keeps', () => {
  const row = { mile: 510, fiveK: 545, tenK: 570, tempo: 590, half: 600, marathon: 640, recovery: 700 };
  const a = (over: Record<string, unknown> = {}): never => ({ anchorSec: 510, rawSec: 510, clamped: null, row, kind: 'entered', exp: 'intermediate', prog: '', n: 0, wk: 0, from: null, race: null, goalId: 'run_10k', goalT: null, ...over }) as never;

  test('the pace chips: five on a race plan with the effort beside each, the race\'s own before Recovery, two on a base, the goal first on a pace goal', () => {
    assert.deepEqual(runAnchorChips(a()), [{ k: 'Mile', v: '8:30', u: '/mi · 9/10' }, { k: '5K', v: '9:05', u: '/mi · 7–8/10' }, { k: '10K', v: '9:30', u: '/mi · 6–7/10' }, { k: 'Tempo', v: '9:50', u: '/mi · 6/10' }, { k: 'Recovery', v: '11:40', u: '/mi · 4–5/10' }]);
    assert.deepEqual(runAnchorChips(a({ goalId: 'run_half', race: 'half' })).map((c) => c.k + ' ' + c.v + ' ' + c.u), ['Mile 8:30 /mi · 9/10', '5K 9:05 /mi · 7–8/10', '10K 9:30 /mi · 6–7/10', 'Tempo 9:50 /mi · 6/10', 'Half 10:00 /mi', 'Recovery 11:40 /mi · 4–5/10']);
    assert.deepEqual(runAnchorChips(a({ goalId: 'run_marathon', race: 'marathon' }))[4], { k: 'Marathon', v: '10:40', u: '/mi' });
    assert.deepEqual(runAnchorChips(a({ goalId: 'run_base' })), [{ k: 'Mile', v: '8:30', u: '/mi' }, { k: 'Recovery', v: '11:40', u: '/mi' }]);
    assert.deepEqual(runAnchorChips(a({ goalId: 'run_pace_goal', goalT: { dist: 1.5, sec: 720 } })).map((c) => c.k + ' ' + c.v + ' ' + c.u), ['Goal 12:00 1.5 mi', 'Mile 8:30 /mi', '5K 9:05 /mi', '10K 9:30 /mi', 'Tempo 9:50 /mi', 'Recovery 11:40 /mi']);
  });

  test('the sentence under the paces: where the mile comes from, each kind in its own words', () => {
    const tail = ' Every pace in this program comes from this row.';
    assert.equal(runAnchorSentence(a()), 'Anchored on an <b>8:30 mile</b>, the time you entered.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'default', exp: 'beginner' })), 'Anchored on an <b>8:30 mile</b>, the beginner default. No mile time was entered. Tap the pencil to enter one.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'seeded', n: 1, prog: 'Spring' })), 'Anchored on an <b>8:30 mile</b>, worked back from 1 recovery run you logged in Spring.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'seeded', n: 3 })), 'Anchored on an <b>8:30 mile</b>, worked back from 3 recovery runs you logged in your last program.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'seeded' })), 'Anchored on an <b>8:30 mile</b>, worked back from the recovery runs you logged in your last program.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'edited', wk: 4, from: { mins: '', secs: '', kind: 'default' } })), 'Anchored on an <b>8:30 mile</b>, the time you entered in week 4. Before that it was the intermediate default.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'edited', wk: 2, from: { mins: '9', secs: '15', kind: 'entered' } })), 'Anchored on an <b>8:30 mile</b>, the time you entered in week 2. Before that it was 9:15.' + tail);
    assert.equal(runAnchorSentence(a({ kind: 'edited' })), 'Anchored on an <b>8:30 mile</b>, the time you entered.' + tail);
  });
  test('the sentence when the chart clamps the mile: the fastest row, the slowest, and an entry that is no time', () => {
    const tail = ' Every pace in this program comes from this row.';
    assert.equal(runAnchorSentence(a({ clamped: 'fast', rawSec: 250, anchorSec: 300 })), 'Anchored on a <b>5:00 mile</b>, the 4:10 you entered is faster than the chart goes, so its fastest row is used.' + tail);
    assert.equal(runAnchorSentence(a({ clamped: 'slow', rawSec: 800, anchorSec: 720 })), 'Anchored on a <b>12:00 mile</b>, the 13:20 you entered is slower than the chart goes, so its slowest row is used.' + tail);
    assert.equal(runAnchorSentence(a({ clamped: 'slow', rawSec: 0 })), 'Anchored on an <b>8:30 mile</b>, the mile time you entered is not a valid time, so its slowest row is used.' + tail);
  });
  test('the sentence\'s article and its tail: an before 8, 11 and 18, a before the rest; the pace goal and the base each say what reads the row', () => {
    for (const [sec, art] of [[480, 'an <b>8:00'], [510, 'an <b>8:30'], [660, 'an <b>11:00'], [1080, 'an <b>18:00'], [540, 'a <b>9:00'], [600, 'a <b>10:00'], [720, 'a <b>12:00'], [300, 'a <b>5:00']] as const) {
      assert.ok(runAnchorSentence(a({ anchorSec: sec })).startsWith('Anchored on ' + art + ' mile</b>'), sec + ' reads ' + art);
    }
    assert.ok(runAnchorSentence(a({ goalId: 'run_pace_goal' })).endsWith('the time you entered. Week 1 runs off this row. Every week after it moves toward your goal.'));
    assert.ok(runAnchorSentence(a({ goalId: 'run_base' })).endsWith('the time you entered. Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.'));
  });

  test('a card\'s selections: the lifts entered, or the experience\'s defaults marked as estimated', () => {
    const s = progSelData(prog('p1') as never, NOW);
    assert.deepEqual(s.lifts, { squat: 140, bench: 100, deadlift: 180, estimated: false });
    assert.deepEqual(progSelData(prog('p1', { squat: 0, bench: undefined, deadlift: null }) as never, NOW).lifts, { squat: 275, bench: 225, deadlift: 315, estimated: true });
    assert.deepEqual(progSelData(prog('p1', { squat: 0, bench: 0, deadlift: 0, experience: 'beginner' }) as never, NOW).lifts, { squat: 75, bench: 65, deadlift: 95, estimated: true });
    assert.deepEqual(progSelData(prog('p1', { squat: 0, bench: 90, deadlift: 0, experience: undefined }) as never, NOW).lifts, { squat: 155, bench: 90, deadlift: 185, estimated: false });
  });
  test('a card\'s selections: the days in the week\'s order, the labels, the length, the seed, and what stands in for each that is missing', () => {
    const s = progSelData(prog('p1') as never, NOW);
    assert.deepEqual([s.name, s.goal, s.liftLabel, s.pathLabel, s.experience, s.ageBracket, s.equipLabel, s.unit, s.length, s.seed], ['Block p1', 'strength', 'Strength', 'Strength / Physique', 'advanced', '36-45', 'Commercial Gym', 'kg', 9, 7]);
    assert.deepEqual([s.trainDays, s.restDays], [['mon', 'tue', 'thu', 'fri', 'sat'], ['sun', 'wed']]);
    assert.deepEqual([s.cardio, s.eventTargeted, s.raceStr, s.raceOut, s.runAnchor], [[], false, '', null, null]);
    const bare = progSelData({ id: 'x', cfg: { liftingFocus: 'mystery', primaryPath: 'odd', equipment: 'shed' } } as never, NOW);
    assert.deepEqual([bare.name, bare.goal, bare.liftLabel, bare.pathLabel, bare.experience, bare.ageBracket, bare.equipLabel, bare.unit, bare.length, bare.seed], ['My Program', '', 'mystery', 'odd', 'intermediate', '18-35', 'shed', 'lbs', 6, null]);
    const none = progSelData({ id: 'x' } as never, NOW);
    assert.deepEqual([none.liftLabel, none.pathLabel, none.equipLabel, none.restDays, none.trainDays.length], ['—', '—', '—', [], 7]);
    assert.equal(progSelData({ id: 'x', seed: 3, cfg: {} } as never, NOW).seed, 3, 'an older program keeps its seed beside its config');
    assert.equal(progSelData({ id: 'x', totalWeeks: 0, cfg: { totalWeeks: 11, goal: 'balanced' } } as never, NOW).length, 11);
    assert.equal(progSelData({ id: 'x', cfg: { goal: 'balanced' } } as never, NOW).goal, 'balanced');
  });
  test('a card\'s selections: the race date as a day, and the time out counted from the day of the draw (D182)', () => {
    const race = (now: Date): { raceStr: string; out: string | undefined; ev: boolean } => { const s = progSelData(prog('p1', { primaryPath: 'event', raceDate: '2026-12-06' }) as never, now); return { raceStr: s.raceStr, out: s.raceOut?.card, ev: s.eventTargeted }; };
    assert.deepEqual(race(new Date(2026, 10, 18, 9)), { raceStr: 'Sun, Dec 6, 2026', out: '2 weeks', ev: true });
    assert.equal(race(new Date(2026, 10, 29, 23, 59)).out, '1 week');
    assert.equal(race(new Date(2026, 10, 30, 0, 1)).out, '6 days');
    assert.equal(race(new Date(2026, 11, 5, 9)).out, '1 day');
    assert.equal(race(new Date(2026, 11, 6, 9)).out, 'Race day');
    assert.equal(race(new Date(2026, 11, 7, 9)).out, 'Behind you');
    assert.equal(progSelData(prog('p1', { primaryPath: 'event', raceDate: 'not a date' }) as never, NOW).raceStr, 'not a date');
  });
  test('a card\'s selections: each sport with its label and its goal, the run\'s anchor where the goal reads the chart', () => {
    const s = progSelData(prog('p1', { cardioTypes: ['run', 'bike', 'row'], cardioGoals: { run: { id: 'run_10k', label: 'Run a 10K', mileBestMins: '8', mileBestSecs: '30' }, bike: {} } }) as never, NOW);
    assert.deepEqual(s.cardio, [{ type: 'run', label: 'Run', goal: 'Run a 10K' }, { type: 'bike', label: 'Bike', goal: '' }, { type: 'row', label: 'row', goal: '' }]);
    assert.deepEqual([s.runAnchor!.anchorSec, s.runAnchor!.kind, s.runAnchor!.goalId], [510, 'entered', 'run_10k']);
  });

  test('the goal tables: five or six goals a sport in today\'s order, the four peaking goals the hybrid path leaves out, the three that need a target', () => {
    assert.deepEqual(Object.fromEntries(Object.entries(CARDIO_GOALS_BY_TYPE).map(([k, v]) => [k, v.map((g) => g.id)])), {
      run: ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_pace_goal', 'run_base'],
      bike: ['bike_century', 'bike_50', 'bike_ftp', 'bike_cals', 'bike_base'],
      swim: ['swim_tri', 'swim_mile', 'swim_100_time', 'swim_500_time', 'swim_base'],
    });
    assert.deepEqual([...HYBRID_EXCLUDED_GOALS].sort(), ['bike_century', 'run_half', 'run_marathon', 'swim_tri']);
    assert.deepEqual([...GOAL_REQ_INPUTS].sort(), ['run_pace_goal', 'swim_100_time', 'swim_500_time']);
    assert.deepEqual(CARDIO_GOALS_BY_TYPE['run']![4], { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', desc: 'A distance and a time. 1.5 miles under 10 minutes. A mile under 6.' });
    for (const list of Object.values(CARDIO_GOALS_BY_TYPE)) for (const g of list) assert.ok(g.label && g.desc && !/[—–]/.test(g.label + g.desc), g.id + ' has its words, with no dash');
  });
  test('the goal ranks (D5): strict within a sport, the biggest build highest', () => {
    const order = (sport: string): string[] => CARDIO_GOALS_BY_TYPE[sport]!.map((g) => g.id).sort((x, y) => GOAL_RANK[y]! - GOAL_RANK[x]!);
    assert.deepEqual(order('run'), ['run_marathon', 'run_half', 'run_10k', 'run_5k', 'run_pace_goal', 'run_base']);
    assert.deepEqual(order('bike'), ['bike_century', 'bike_50', 'bike_ftp', 'bike_base', 'bike_cals']);
    assert.deepEqual(order('swim'), ['swim_tri', 'swim_mile', 'swim_500_time', 'swim_100_time', 'swim_base']);
    for (const sport of ['run', 'bike', 'swim']) assert.equal(new Set(CARDIO_GOALS_BY_TYPE[sport]!.map((g) => GOAL_RANK[g.id])).size, CARDIO_GOALS_BY_TYPE[sport]!.length, sport + ': no two goals share a rank');
    assert.deepEqual([GOAL_RANK['run_base'], GOAL_RANK['bike_cals'], GOAL_RANK['swim_base'], GOAL_RANK['run_pace_goal']], [1, 1, 1, 2]);
  });
  test('a goal\'s typed targets: none needed, a time for the swim goals, a distance and a time for the pace goal', () => {
    const d = (sel: string | null, inputs: Record<string, string> = {}) => ({ progId: 'p', sport: 'run', sel, inputs });
    assert.equal(goalInputsValid(d(null)), true);
    assert.equal(goalInputsValid(d('run_10k')), true);
    assert.equal(goalInputsValid(d('swim_500_time')), false);
    assert.equal(goalInputsValid(d('swim_500_time', { targetMins: '0', targetSecs: '0' })), false);
    assert.equal(goalInputsValid(d('swim_500_time', { targetSecs: '45' })), true);
    assert.equal(goalInputsValid(d('swim_100_time', { targetMins: '1' })), true);
    assert.equal(goalInputsValid(d('run_pace_goal', { targetMins: '12' })), false);
    assert.equal(goalInputsValid(d('run_pace_goal', { targetDist: '1.5' })), false);
    assert.equal(goalInputsValid(d('run_pace_goal', { targetDist: '0', targetMins: '12' })), false);
    assert.equal(goalInputsValid(d('run_pace_goal', { targetDist: 'far', targetMins: '12' })), false);
    assert.equal(goalInputsValid(d('run_pace_goal', { targetDist: '1.5', targetSecs: '30' })), true);
    assert.equal(goalInputsValid(d('run_pace_goal', { targetDist: '1.5', targetMins: '12', targetSecs: '0' })), true);
  });
  test('the mile\'s validator (D116, D183, D187): what it refuses, what it takes, and what it says at the chart\'s two edges', () => {
    const m = (mins: string, secs: string, exp = 'intermediate', id = 'run_10k') => mileEntryState({ id, mileBestMins: mins, mileBestSecs: secs }, exp);
    assert.deepEqual(mileEntryState(null, 'advanced'), { ok: true });
    assert.deepEqual(mileEntryState({ id: 'run_10k' }, 'advanced'), { ok: true });
    assert.deepEqual(m('', '30'), { ok: true });
    assert.deepEqual(m('', '', 'intermediate', 'run_pace_goal'), { ok: false, blank: true, msg: 'Required. Enter your most recent timed mile.' });
    assert.deepEqual(m('', '', 'beginner', 'run_pace_goal'), { ok: true });
    const NOT = { ok: false, msg: 'That mile time is not a real time. Check the minutes and seconds.' };
    assert.deepEqual(m('9', '60'), NOT); assert.deepEqual(m('9', '75'), NOT); assert.deepEqual(m('-9', '0'), NOT); assert.deepEqual(m('9', '-1'), NOT); assert.deepEqual(m('nine', '0'), NOT); assert.deepEqual(m('9', 'x'), NOT);
    assert.deepEqual(m('2', '59'), { ok: false, msg: 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.' });
    assert.deepEqual(m('25', '1'), { ok: false, msg: 'Over 25:00 reads as a walk, not a run. Check the entry.' });
    assert.deepEqual(m('3', '0'), { ok: true, adv: 'At 3:00 your paces come from the chart’s fastest row, 5:00. It tops out there.' });
    assert.deepEqual(m('4', '59'), { ok: true, adv: 'At 4:59 your paces come from the chart’s fastest row, 5:00. It tops out there.' });
    assert.deepEqual(m('5', '0'), { ok: true });
    assert.deepEqual(m('9', ''), { ok: true });
    assert.deepEqual(m('12', '0'), { ok: true });
    assert.deepEqual(m('12', '1'), { ok: true, adv: 'At 12:01 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.' });
    assert.deepEqual(m('25', '0'), { ok: true, adv: 'At 25:00 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.' });
  });
});

describe('native program list: the list as drawn (renderProgList)', () => {
  test('no program stored, and every program archived: the two empty lists', () => {
    assert.deepEqual(listView(memoryStore(), newListState(), NOW), { empty: 'none', cards: [] });
    assert.deepEqual(listView(phone([prog('p1', {}, { archived: true })]), newListState(), NOW), { empty: 'archived', cards: [] });
  });
  test('a card: its name, its goal\'s badge, its class, and the three lines under the name', () => {
    const v = listView(phone([prog('p1'), prog('p2', { equipment: 'bodyweight', ...RUN }, { goal: 'fatloss', archived: true }), prog('p3', { equipment: 'minimal', cardioTypes: ['run', 'bike'], cardioGoals: { run: { label: 'Base' }, bike: {} } }, { goal: 'endurance', totalWeeks: 0 })]), newListState(), NOW);
    assert.equal(v.empty, null);
    assert.deepEqual(v.cards.map((c) => [c.id, c.name, c.nameValue, c.goal, c.goalLabel, c.cardClass, c.isActive, c.editing, c.confirm]), [
      ['p1', 'Block p1', 'Block p1', 'strength', 'Strength', 'prog-card active-prog', true, false, 0],
      ['p3', 'Block p3', 'Block p3', 'endurance', 'endurance', 'prog-card', false, false, 0],
    ]);
    const lines = markupLines(v.cards[0]!.metaHtml);
    assert.deepEqual(lines.map((l) => l.map((r) => (r.icon ? '[icon]' : r.text)).join('')), ['Mo · Tu · Th · Fr · Sa · 9 wks cardio · 6 wks lift', '[icon] Gym · advanced · 36-45', 'Lift only']);
    assert.deepEqual(markupLines(v.cards[1]!.metaHtml).map((l) => l.map((r) => (r.icon ? '[icon]' : r.text)).join('')), ['Mo · Tu · Th · Fr · Sa · 6 wks cardio · 6 wks lift', '[icon] Minimal · advanced · 36-45', '[icon] Base + [icon]']);
  });
  test('the active card is the one a launch loads: the stored pointer, or the first program not archived when it names an archived one, none without a pointer', () => {
    const two = [prog('p1', {}, { archived: true }), prog('p2')];
    assert.deepEqual(listView(phone(two, 'p1'), newListState(), NOW).cards.map((c) => [c.id, c.isActive]), [['p2', true]]);
    assert.equal(activeId(phone(two, 'p1')), 'p2');
    assert.deepEqual(listView(phone(two, null), newListState(), NOW).cards.map((c) => c.isActive), [false]);
    assert.equal(activeId(phone(two, null)), null);
  });
  test('what is kept between draws shows on its card alone: open, being renamed, each confirm tier', () => {
    const s = phone([prog('p1'), prog('p2')]);
    const st = newListState();
    toggleCard(st, 'p2'); startRename(st, 'p1'); askArchive(st, 'p2');
    let v = listView(s, st, NOW);
    assert.deepEqual(v.cards.map((c) => [c.cardClass, c.editing, c.confirm]), [['prog-card active-prog', true, 0], ['prog-card open', false, 1]]);
    askPurge(st, 'p2'); toggleCard(st, 'p1');
    v = listView(s, st, NOW);
    assert.deepEqual(v.cards.map((c) => [c.cardClass, c.confirm]), [['prog-card active-prog open', 0], ['prog-card open', 2]]);
  });
  test('a card\'s detail: Focus, Profile, Schedule, the three lifts in the program\'s unit, no paces and Lift only on a lifting program, the seed', () => {
    const d = listView(phone([prog('p1')]), newListState(), NOW).cards[0]!.detail;
    assert.deepEqual(d, {
      id: 'p1',
      focus: [{ k: 'Goal', v: 'Strength' }, { k: 'Lift emphasis', v: 'Strength' }, { k: 'Path', v: 'Strength / Physique' }],
      profile: [{ k: 'Experience', v: 'advanced' }, { k: 'Age range', v: '36-45' }, { k: 'Equipment', v: 'Commercial Gym' }, { k: 'Units', v: 'kg' }],
      schedule: [{ k: 'Train days', v: 'Mon · Tue · Thu · Fri · Sat' }, { k: 'Rest days', v: 'Sun · Wed' }, { k: 'Length', v: '9 weeks' }],
      estimated: false,
      lifts: [{ k: 'Squat', v: '140', u: 'kg' }, { k: 'Bench', v: '100', u: 'kg' }, { k: 'Deadlift', v: '180', u: 'kg' }],
      paces: null, cardio: null, event: null, seed: 'seed 7',
    });
  });
  test('a card\'s detail on a race program: the paces and their source, each sport\'s goal, the race date and the time out', () => {
    const d = listView(phone([prog('p1', { ...RUN, primaryPath: 'event', raceDate: '2026-12-06', restDays: [] }, { totalWeeks: 14 })]), newListState(), new Date(2026, 10, 18, 9)).cards[0]!.detail;
    assert.deepEqual(d.paces!.chips.map((c) => c.k), ['Mile', '5K', '10K', 'Tempo', 'Recovery']);
    assert.deepEqual(d.paces!.chips[0], { k: 'Mile', v: '8:30', u: '/mi · 9/10' });
    assert.equal(d.paces!.sentence, 'Anchored on an <b>8:30 mile</b>, the time you entered. Every pace in this program comes from this row.');
    assert.deepEqual(d.cardio, [{ type: 'run', label: 'Run', goal: 'Run a 10K' }]);
    assert.deepEqual(d.event, [{ k: 'Race date', v: 'Sun, Dec 6, 2026' }, { k: 'Time out', v: '2 weeks' }]);
    assert.deepEqual(d.schedule, [{ k: 'Train days', v: 'Sun · Mon · Tue · Wed · Thu · Fri · Sat' }, { k: 'Rest days', v: 'None' }, { k: 'Length', v: '14 weeks' }]);
  });
  test('the page\'s markup as lines of runs: a break ends a line, an icon is a run of its own, bold words are marked, entities are read', () => {
    assert.deepEqual(markupLines('a · b<br><svg x="1"><path d="M0"/></svg> Gym &amp; more<br>Lift only'), [
      [{ icon: null, text: 'a · b', bold: false }],
      [{ icon: '<svg x="1"><path d="M0"/></svg>', text: '', bold: false }, { icon: null, text: ' Gym & more', bold: false }],
      [{ icon: null, text: 'Lift only', bold: false }],
    ]);
    assert.deepEqual(markupLines('Anchored on an <b>8:30 mile</b>, the time.'), [[{ icon: null, text: 'Anchored on an ', bold: false }, { icon: null, text: '8:30 mile', bold: true }, { icon: null, text: ', the time.', bold: false }]]);
    assert.deepEqual(markupLines('<i>Block</i> &lt;one&gt; &quot;x&quot; &#39;y&#39;<br/>two'), [[{ icon: null, text: 'Block <one> "x" \'y\'', bold: false }], [{ icon: null, text: 'two', bold: false }]]);
    assert.deepEqual(markupLines(''), [[]]);
  });
  test('the archive\'s question and the delete\'s warning name the program, in today\'s words', () => {
    assert.equal(archiveQuestion('Block One'), 'Archive “Block One”?');
    assert.equal(purgeWarning('Block One'), 'This erases all logs, weights, and history for “Block One”. It cannot be undone.');
  });
  test('with no active program This Week and Progress do not open, and say why; Programs and Bugs always open', () => {
    const none = memoryStore(), archived = phone([prog('p1', {}, { archived: true })]), noPointer = phone([prog('p1')], null), live = phone([prog('p1')]);
    for (const s of [none, archived, noPointer]) {
      assert.deepEqual([tabRefused(s, 'week'), tabRefused(s, 'progress')], ['No active program. Tap Set Active or build a new one.', 'No active program. Tap Set Active or build a new one.']);
      assert.deepEqual([tabRefused(s, 'home'), tabRefused(s, 'bugs')], [null, null]);
    }
    assert.deepEqual(['home', 'week', 'progress', 'bugs'].map((t) => tabRefused(live, t as 'home')), [null, null, null, null]);
    // The pointer names an archived program and another is live: the launch loads that one, so the tabs open.
    assert.equal(tabRefused(phone([prog('x', {}, { archived: true }), prog('p1')], 'x'), 'week'), null);
  });
  test('a failed part of a rebuild is logged in the page\'s words, and a plan change that did not apply is said', () => {
    const said: string[] = [], logged: unknown[][] = [];
    const r = refreshReport((t) => said.push(t), (...x) => logged.push(x));
    r.overlay({ id: 'ov_1' } as never, 'boom'); r.freeze('f'); r.rebuild('r');
    assert.deepEqual(said, ['A plan change failed to apply. Flag it in Bugs.']);
    assert.deepEqual(logged, [['overlay apply failed', 'ov_1', 'boom'], ['week freeze failed; showing fully rebuilt weeks', 'f'], ['refreshProgram failed; using stored program', 'r']]);
  });
});

describe('native program list: the goal sheet and the mile pencil as opened', () => {
  test('the goal sheet opens on a stored program with nothing picked; a pick clears what was typed; typing keeps the pick', () => {
    const s = phone([prog('p1', RUN)]);
    assert.equal(openGoal(s, 'gone', 'run'), null);
    let d = openGoal(s, 'p1', 'run')!;
    assert.deepEqual(d, { progId: 'p1', sport: 'run', sel: null, inputs: {} });
    d = typeGoal(selectGoal(d, 'run_pace_goal'), 'targetDist', '1.5');
    assert.deepEqual(d, { progId: 'p1', sport: 'run', sel: 'run_pace_goal', inputs: { targetDist: '1.5' } });
    d = typeGoal(d, 'targetMins', '12');
    assert.deepEqual(d.inputs, { targetDist: '1.5', targetMins: '12' });
    assert.deepEqual(selectGoal(d, 'run_5k'), { progId: 'p1', sport: 'run', sel: 'run_5k', inputs: {} });
  });
  test('the goal sheet\'s view: the heading, the current goal marked, a bigger goal marked, the decision with its week once the program has started', () => {
    const s = phone([prog('p1', RUN)]);
    assert.equal(goalView(s, { progId: 'gone', sport: 'run', sel: null, inputs: {} }, NOW), null);
    const g = goalView(s, { progId: 'p1', sport: 'run', sel: null, inputs: {} }, NOW)!;
    assert.equal(g.view.heading, 'Change run goal');
    assert.deepEqual(g.view.options.map((o) => [o.id, o.current, o.up]), [['run_5k', false, false], ['run_10k', true, false], ['run_half', false, true], ['run_marathon', false, true], ['run_pace_goal', false, false], ['run_base', false, false]]);
    assert.equal(g.view.decision, null);
    assert.equal(g.ok, true);
    const up = goalView(s, { progId: 'p1', sport: 'run', sel: 'run_half', inputs: {} }, NOW)!.view.decision!;
    assert.deepEqual([up.up, up.title, up.commitLabel, up.keepLabel, up.inputs], [true, 'Half Marathon is a step up', 'Switch anyway', 'Stay the course', null]);
    assert.equal(up.body, 'You would drop into week 6 of a bigger build without the early weeks under you. That is a real jump in training load. If the goal matters, a fresh program builds it right.');
    const down = goalView(s, { progId: 'p1', sport: 'run', sel: 'run_pace_goal', inputs: { targetMins: '12' } }, NOW)!;
    assert.deepEqual([down.view.decision!.up, down.view.decision!.title, down.view.decision!.commitLabel, down.view.decision!.keepLabel, down.view.decision!.inputs, down.ok], [false, 'Switch to Hit a Pace / Time Goal', 'Make the switch', 'Keep Run a 10K', 'pace', false]);
    assert.equal(down.view.decision!.body, 'Past weeks stand as trained. Your run work rebuilds from this week forward. This week may finish mixed. Next week is fully on the new goal.');
    assert.deepEqual(down.view.decision!.values, { targetDist: '', paceUnit: 'mi', targetMins: '12', targetSecs: '' });
    // In its first week, or before its start, a program has not started.
    const early = goalView(s, { progId: 'p1', sport: 'run', sel: 'run_half', inputs: {} }, new Date(2026, 8, 3, 8))!.view.decision!;
    assert.equal(early.body, 'You would drop into a bigger build without the early weeks under you. That is a real jump in training load. If the goal matters, a fresh program builds it right.');
    assert.equal(goalView(s, { progId: 'p1', sport: 'run', sel: 'run_5k', inputs: {} }, new Date(2026, 7, 20, 8))!.view.decision!.body, 'Past weeks stand as trained. Your run work rebuilds from this week forward.');
  });
  test('the goal sheet on the hybrid path leaves the peaking goals out; another sport reads its own table and label', () => {
    const s = phone([prog('p1', { ...RUN, primaryPath: 'both', cardioTypes: ['run', 'swim'], cardioGoals: { ...RUN.cardioGoals, swim: { id: 'swim_base', label: 'Build Swim Base' } } })]);
    assert.deepEqual(goalView(s, { progId: 'p1', sport: 'run', sel: null, inputs: {} }, NOW)!.view.options.map((o) => o.id), ['run_5k', 'run_10k', 'run_pace_goal', 'run_base']);
    const swim = goalView(s, { progId: 'p1', sport: 'swim', sel: 'swim_500_time', inputs: {} }, NOW)!;
    assert.equal(swim.view.heading, 'Change swim goal');
    assert.deepEqual(swim.view.options.map((o) => o.id), ['swim_mile', 'swim_100_time', 'swim_500_time', 'swim_base']);
    assert.deepEqual([swim.view.decision!.inputs, swim.ok, swim.view.decision!.up], ['time', false, true]);
    assert.equal(goalView(s, { progId: 'p1', sport: 'row', sel: null, inputs: {} }, NOW)!.view.heading, 'Change row goal');
  });
  test('the mile pencil: the edit sheet with the stored mile until four weeks from the end, the lock in the last three, judged on the day of the tap', () => {
    const s = phone([prog('p1', RUN), prog('p2', { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base' } } })]);
    assert.equal(openMile(s, 'gone', NOW), null);
    assert.deepEqual(openMile(s, 'p1', NOW), { kind: 'edit', progId: 'p1', mins: '8', secs: '30' });
    assert.deepEqual(openMile(s, 'p2', NOW), { kind: 'edit', progId: 'p2', mins: '', secs: '' });
    assert.deepEqual(openMile(s, 'p1', new Date(2026, 9, 11, 23, 59)), { kind: 'edit', progId: 'p1', mins: '8', secs: '30' }, 'the Sunday of week 6 of 9');
    assert.deepEqual(openMile(s, 'p1', new Date(2026, 9, 12, 0, 1)), { kind: 'lock', facts: [{ k: 'Week', v: '7 of 9' }] }, 'the Monday of week 7 of 9');
    assert.deepEqual(openMile(s, 'p1', new Date(2027, 0, 5, 9)), { kind: 'lock', facts: [{ k: 'Week', v: '9 of 9' }] }, 'past its end a program stands in its last week');
    // A program with no length stored is one of six weeks.
    const six = phone([prog('p1', RUN, { totalWeeks: undefined })]);
    assert.equal(openMile(six, 'p1', new Date(2026, 8, 16, 9))!.kind, 'edit', 'week 3 of 6');
    assert.deepEqual(openMile(six, 'p1', new Date(2026, 8, 22, 9)), { kind: 'lock', facts: [{ k: 'Week', v: '4 of 6' }] });
  });
  test('the lock\'s facts on a race program: the days out counted from the day of the tap, in the countdown\'s words on race day and after', () => {
    const s = phone([prog('p1', { ...RUN, primaryPath: 'event', raceDate: '2026-12-06' }, { totalWeeks: 14 })]);
    assert.equal(openMile(s, 'p1', new Date(2026, 10, 15, 9))!.kind, 'edit', 'week 11 of 14');
    assert.deepEqual(openMile(s, 'p1', new Date(2026, 10, 18, 9)), { kind: 'lock', facts: [{ k: 'Days out', v: '18' }, { k: 'Race day', v: 'Sun, Dec 6, 2026' }, { k: 'Week', v: '12 of 14' }] });
    assert.deepEqual((openMile(s, 'p1', new Date(2026, 11, 5, 9)) as { facts: { v: string }[] }).facts.map((f) => f.v), ['1', 'Sun, Dec 6, 2026', '14 of 14']);
    assert.deepEqual((openMile(s, 'p1', new Date(2026, 11, 6, 9)) as { facts: { v: string }[] }).facts.map((f) => f.v), ['Race day', 'Sun, Dec 6, 2026', '14 of 14']);
    assert.deepEqual((openMile(s, 'p1', new Date(2026, 11, 9, 9)) as { facts: { v: string }[] }).facts.map((f) => f.v), ['Behind you', 'Sun, Dec 6, 2026', '14 of 14']);
    const bad = phone([prog('p1', { ...RUN, raceDate: 'soon' }, { totalWeeks: 6 })]);
    assert.deepEqual(openMile(bad, 'p1', NOW), { kind: 'lock', facts: [{ k: 'Week', v: '6 of 6' }] }, 'a date that does not read lists no race');
  });
});

describe('native program list: the writes, to this app\'s own store (D289)', () => {
  test('a rename is trimmed, cut to forty, and stored only when it is a name and a new one', () => {
    const s = phone([prog('p1'), prog('p2')]);
    const before = s.get('ia_programs');
    assert.equal(renameProgram(s, 'gone', 'x'), null);
    assert.equal(renameProgram(s, 'p1', '   '), null);
    assert.equal(renameProgram(s, 'p1', ''), null);
    assert.equal(renameProgram(s, 'p1', '  Block p1 '), null);
    assert.equal(s.get('ia_programs'), before, 'nothing was stored');
    assert.equal(renameProgram(s, 'p2', '  Winter base, the long one that runs past forty characters  '), 'Renamed ✓');
    assert.deepEqual(stored(s).map((p) => p['name']), ['Block p1', 'Winter base, the long one that runs past']);
    assert.equal(stored(s)[1]!['name'].length, 40);
    assert.equal(J(stored(s)[0]), J(JSON.parse(before!)[0]), 'the other program is as it was');
  });
  test('a switch is refused in silence for a program that is gone and with words for an archived one, and writes nothing', () => {
    const s = phone([prog('p1'), prog('p2', {}, { archived: true })]);
    const keys = J(s.keys().sort().map((k) => [k, s.get(k)]));
    assert.deepEqual(loadActive(s, 'gone', NOW.getTime(), NEVER), { refused: null });
    assert.deepEqual(loadActive(s, 'p2', NOW.getTime(), NEVER), { refused: 'Restore this program first' });
    assert.equal(RESTORE_FIRST, 'Restore this program first');
    assert.deepEqual(setActive(s, 'gone', NOW.getTime(), NEVER), { toast: null, switched: false });
    assert.deepEqual(setActive(s, 'p2', NOW.getTime(), NEVER), { toast: 'Restore this program first', switched: false });
    assert.equal(J(s.keys().sort().map((k) => [k, s.get(k)])), keys);
  });
  test('the past days marked as asked (D238): every training day before today with no mark and not yet asked about, stored only when one is added', () => {
    const day = { sections: [{ label: 'Main Lift', items: [{ name: 'Squat', detail: '3×5' }] }] };
    const grid = { id: 'p1', startDate: '2026-08-31', totalWeeks: 2, weeks: { 1: { mon: day, tue: { rest: true }, wed: day, thu: day, fri: day, sat: { rest: true }, sun: { rest: true } }, 2: { mon: day, tue: day } } };
    const s = phone([prog('p1')]);
    s.set('ia_comp_p1', J({ w1_mon: { title: 'A', ts: 1, status: 'complete' }, w1_thu: { title: 'B', ts: 2, status: 'skipped' } }));
    s.set('ia_reminded_p1', J({ w1_fri: true }));
    // The Tuesday of week 2: Monday of week 2 is past and unmarked; today is not past.
    markPastAsked(s, grid as never, new Date(2026, 8, 8, 9));
    assert.deepEqual(JSON.parse(s.get('ia_reminded_p1')!), { w1_fri: true, w1_wed: true, w2_mon: true });
    let sets = 0;
    const spy = { ...s, set: (k: string, v: string) => { sets++; s.set(k, v); } } as StateStore;
    markPastAsked(spy, grid as never, new Date(2026, 8, 8, 9));
    assert.equal(sets, 0, 'nothing new to mark, nothing stored');
    const fresh = phone([prog('p1')]);
    markPastAsked(fresh, grid as never, new Date(2026, 7, 31, 9));
    assert.equal(fresh.get('ia_reminded_p1'), null, 'on the program\'s first day nothing is past');
    fresh.set('ia_reminded_p1', 'not json');
    markPastAsked(fresh, grid as never, new Date(2026, 8, 2, 9));
    assert.deepEqual(JSON.parse(fresh.get('ia_reminded_p1')!), { w1_mon: true }, 'a record that does not read starts again');
  });
  test('Archive of a program that is not active: archived and stamped, every key kept, the active program as it was', () => {
    const s = phone([prog('p1'), prog('p2')]);
    for (const f of PURGE_FAMILIES) s.set(f + 'p2', '{}');
    assert.equal(archiveProgram(s, 'gone', 'p1', NOW.getTime(), NEVER), null);
    const o = archiveProgram(s, 'p2', 'p1', NOW.getTime(), NEVER);
    assert.deepEqual(o, { toast: 'Program archived' });
    assert.equal('prog' in o!, false, 'the active program did not change');
    assert.deepEqual(stored(s).map((p) => [p['id'], p['archived'], p['archivedAt']]), [['p1', undefined, undefined], ['p2', true, NOW.getTime()]]);
    assert.equal(s.get('ia_active'), 'p1');
    assert.equal(s.keys().filter((k) => k.endsWith('p2')).length, PURGE_FAMILIES.length);
  });
  test('Archive of the last program that is not archived: no active program is left', () => {
    const s = phone([prog('p1'), prog('p2', {}, { archived: true })]);
    assert.deepEqual(archiveProgram(s, 'p1', 'p1', NOW.getTime(), NEVER), { toast: 'Program archived', prog: null });
    assert.equal(s.get('ia_active'), null);
    assert.deepEqual(stored(s).map((p) => p['archived']), [true, true]);
    // The pointer alone naming it is enough: the page reads both its pointer and its global.
    const t = phone([prog('p1')], 'p1');
    assert.deepEqual(archiveProgram(t, 'p1', null, NOW.getTime(), NEVER), { toast: 'Program archived', prog: null });
    assert.equal(t.get('ia_active'), null);
    // And the program in hand alone: the pointer still names an archived program the launch passed over.
    const u = phone([prog('x', {}, { archived: true }), prog('p1')], 'x');
    assert.equal(activeId(u), 'p1');
    assert.deepEqual(archiveProgram(u, 'p1', activeId(u), NOW.getTime(), NEVER), { toast: 'Program archived', prog: null });
    assert.equal(u.get('ia_active'), null);
  });
  test('Delete Forever of a program that is not active: its row and each of the fifteen families gone, another program\'s keys untouched', () => {
    const s = phone([prog('p1'), prog('p2')]);
    for (const f of PURGE_FAMILIES) { s.set(f + 'p1', '{"mine":1}'); s.set(f + 'p2', '{"theirs":1}'); }
    assert.equal(PURGE_FAMILIES.length, 15);
    const o = deleteProgram(s, 'p2', 'p1', NOW.getTime(), NEVER);
    assert.deepEqual(o, { toast: 'Program deleted' });
    assert.deepEqual(stored(s).map((p) => p['id']), ['p1']);
    assert.deepEqual(s.keys().filter((k) => k.endsWith('p2')), []);
    assert.deepEqual(s.keys().filter((k) => k.endsWith('p1')).sort(), PURGE_FAMILIES.map((f) => f + 'p1').sort());
    assert.equal(s.get('ia_active'), 'p1');
  });
  test('Delete Forever of the last program: nothing of it is left, and no active program', () => {
    const s = phone([prog('p1')]);
    for (const f of PURGE_FAMILIES) s.set(f + 'p1', '{}');
    assert.deepEqual(deleteProgram(s, 'p1', 'p1', NOW.getTime(), NEVER), { toast: 'Program deleted', prog: null });
    assert.deepEqual(s.keys().sort(), ['ia_programs']);
    assert.equal(s.get('ia_programs'), '[]');
  });

  const goalOf = (s: StateStore, sport: string): Record<string, unknown> => stored(s)[0]!['cfg'].cardioGoals[sport];
  const draft = (sport: string, sel: string, inputs: Record<string, string> = {}) => ({ progId: 'p1', sport, sel, inputs });
  test('a goal switch on a program that is not active: the goal replaced in the stored config, nothing rebuilt', () => {
    const s = phone([prog('p1', { ...RUN, cardioTypes: ['run', 'bike'], cardioGoals: { ...RUN.cardioGoals, bike: { id: 'bike_base', label: 'Build Cycling Base' } } })]);
    const o = commitGoalChange(s, draft('run', 'run_5k'), null, NOW.getTime(), NEVER);
    assert.deepEqual(o, { toast: 'Goal switched. Program rebuilt from this week.' });
    assert.deepEqual(goalOf(s, 'run'), { id: 'run_5k', label: 'Run a 5K', baseline: '', mileBestMins: '8', mileBestSecs: '30' });
    assert.deepEqual(goalOf(s, 'bike'), { id: 'bike_base', label: 'Build Cycling Base' }, 'the other sport is as it was');
    assert.equal(J(Object.keys(stored(s)[0]!['cfg'])), J(Object.keys(prog('p1')['cfg'])), 'the config keeps its keys in their order');
    commitGoalChange(s, draft('bike', 'bike_ftp'), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'bike'), { id: 'bike_ftp', label: 'Improve FTP / Power', baseline: '' }, 'a bike goal carries nothing');
    // A mile is the run's alone: one stored on another sport's goal is not carried.
    const b = phone([prog('p1', { cardioTypes: ['bike'], cardioGoals: { bike: { id: 'bike_base', label: 'Base', mileBestMins: '8', mileBestSecs: '30' } } })]);
    commitGoalChange(b, draft('bike', 'bike_50'), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(b, 'bike'), { id: 'bike_50', label: '50-Mile Ride', baseline: '' });
  });
  test('a run goal switch carries the mile and where it came from; a goal with no mile carries none', () => {
    const src = { kind: 'edited', at: '2026-09-20', wk: 3, from: { mins: '9', secs: '0', kind: 'entered' } };
    const s = phone([prog('p1', { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_10k', label: 'Run a 10K', mileBestMins: '8', mileBestSecs: '30', mileBestSrc: src, baselineDist: '4', targetTime: 'x' } } })]);
    commitGoalChange(s, draft('run', 'run_half'), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'run'), { id: 'run_half', label: 'Half Marathon', baseline: '', mileBestMins: '8', mileBestSecs: '30', mileBestSrc: src });
    const none = phone([prog('p1', { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base', mileBestMins: '', mileBestSecs: '15' } } })]);
    commitGoalChange(none, draft('run', 'run_5k'), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(none, 'run'), { id: 'run_5k', label: 'Run a 5K', baseline: '' });
    const bare = phone([prog('p1', { cardioTypes: ['run'] })]);
    bare.set('ia_programs', J([{ ...prog('p1'), cfg: { cardioTypes: ['run'] } }]));
    commitGoalChange(bare, draft('run', 'run_base'), null, NOW.getTime(), NEVER);
    assert.deepEqual(stored(bare)[0]!['cfg'].cardioGoals, { run: { id: 'run_base', label: 'Build Running Base', baseline: '' } }, 'a config with no goals stored gets its first');
  });
  test('the pace goal stores its targets as typed, the time as a clock, the unit as picked or miles', () => {
    const s = phone([prog('p1', RUN)]);
    assert.equal(commitGoalChange(s, draft('run', 'run_pace_goal', { targetDist: '1.5' }), null, NOW.getTime(), NEVER), null, 'a target missing: the tap does nothing');
    assert.deepEqual(goalOf(s, 'run'), RUN.cardioGoals.run);
    commitGoalChange(s, draft('run', 'run_pace_goal', { targetDist: '1.5', targetMins: '9', targetSecs: '5' }), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'run'), { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', baseline: '', mileBestMins: '8', mileBestSecs: '30', targetMins: '9', targetSecs: '5', targetTime: '9:05', targetDist: '1.5', paceUnit: 'mi' });
    const km = phone([prog('p1', RUN)]);
    commitGoalChange(km, draft('run', 'run_pace_goal', { targetDist: '2.4', paceUnit: 'km', targetSecs: '45' }), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(km, 'run'), { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', baseline: '', mileBestMins: '8', mileBestSecs: '30', targetSecs: '45', targetTime: '0:45', targetDist: '2.4', paceUnit: 'km' });
  });
  test('a swim goal switch (D110a): the unit rides, a 500 time rides to wherever a 500 lives, a 100 time is dropped by a goal that has no place for it', () => {
    const swim = (goal: Record<string, unknown>): StateStore => phone([prog('p1', { cardioTypes: ['swim'], cardioGoals: { swim: goal } })]);
    let s = swim({ id: 'swim_500_time', label: '500', swimUnit: 'm', baseMins: '10', baseSecs: '30', targetMins: '9' });
    commitGoalChange(s, draft('swim', 'swim_100_time', { targetMins: '1', targetSecs: '25' }), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'swim'), { id: 'swim_100_time', label: 'Improve 100 Time', baseline: '', swimUnit: 'm', base500Mins: '10', base500Secs: '30', targetMins: '1', targetSecs: '25', targetTime: '1:25' });
    s = swim({ id: 'swim_100_time', label: '100', swimUnit: 'yd', baseMins: '1', baseSecs: '40', base500Mins: '9', base500Secs: '50' });
    commitGoalChange(s, draft('swim', 'swim_500_time', { targetMins: '9' }), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'swim'), { id: 'swim_500_time', label: 'Improve 500 Time', baseline: '', swimUnit: 'yd', baseMins: '9', baseSecs: '50', targetMins: '9', targetTime: '9:00' });
    s = swim({ id: 'swim_500_time', label: '500', baseMins: '0', baseSecs: '0' });
    commitGoalChange(s, draft('swim', 'swim_100_time', { targetSecs: '59' }), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'swim'), { id: 'swim_100_time', label: 'Improve 100 Time', baseline: '', targetSecs: '59', targetTime: '0:59' }, 'a 500 time of zero is no time, and no unit stored is none carried');
    s = swim({ id: 'swim_100_time', label: '100', swimUnit: 'yd', baseMins: '1', baseSecs: '40' });
    commitGoalChange(s, draft('swim', 'swim_mile'), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'swim'), { id: 'swim_mile', label: 'Swim a Mile', baseline: '', swimUnit: 'yd' });
    s = swim({ id: 'swim_500_time', label: '500', swimUnit: 'yd', baseMins: '10' });
    commitGoalChange(s, draft('swim', 'swim_100_time', { targetMins: '2' }), null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'swim'), { id: 'swim_100_time', label: 'Improve 100 Time', baseline: '', swimUnit: 'yd', base500Mins: '10', targetMins: '2', targetTime: '2:00' }, 'the seconds were never stored, so none are written');
  });
  test('a goal switch that names a program or a goal that is gone does nothing', () => {
    const s = phone([prog('p1', RUN)]);
    const before = s.get('ia_programs');
    assert.equal(commitGoalChange(s, { progId: 'gone', sport: 'run', sel: 'run_5k', inputs: {} }, null, NOW.getTime(), NEVER), null);
    assert.equal(commitGoalChange(s, draft('run', 'run_ultra'), null, NOW.getTime(), NEVER), null);
    assert.equal(commitGoalChange(s, draft('row', 'run_5k'), null, NOW.getTime(), NEVER), null);
    assert.equal(s.get('ia_programs'), before);
  });

  test('a new mile on a program that is not active: the fields as numbers, the day, the week, and the mile it replaced, always', () => {
    const s = phone([prog('p1', { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_10k', label: 'Run a 10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4' } } })]);
    const o = commitMileChange(s, 'p1', ' 09 ', '05', null, NOW.getTime(), NEVER);
    assert.deepEqual(o, { toast: 'Mile updated. Every run still ahead of you now reads from your new row.', saved: true });
    assert.deepEqual(goalOf(s, 'run'), { id: 'run_10k', label: 'Run a 10K', mileBestMins: '9', mileBestSecs: '5', baselineDist: '4', mileBestSrc: { kind: 'edited', at: '2026-10-06', wk: 6, from: { mins: '8', secs: '30', kind: 'entered' } } });
    // A second edit names the first as what it replaced, by its kind.
    commitMileChange(s, 'p1', '8', '45', null, new Date(2026, 9, 7, 21, 30).getTime(), NEVER);
    assert.deepEqual((goalOf(s, 'run') as any).mileBestSrc, { kind: 'edited', at: '2026-10-08', wk: 6, from: { mins: '9', secs: '5', kind: 'edited' } }, 'the day is the instant\'s, read as the page reads it (UTC)');
  });
  test('a new mile over no mile names the default; over a seeded one, the seed', () => {
    const s = phone([prog('p1', { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base' } } })]);
    commitMileChange(s, 'p1', '10', '0', null, NOW.getTime(), NEVER);
    assert.deepEqual(goalOf(s, 'run'), { id: 'run_base', mileBestMins: '10', mileBestSecs: '0', mileBestSrc: { kind: 'edited', at: '2026-10-06', wk: 6, from: { mins: '', secs: '', kind: 'default' } } });
    const seeded = phone([prog('p1', { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base', mileBestMins: '9', mileBestSecs: '20', mileBestSrc: { kind: 'seeded', n: 3, prog: 'Spring' } } } })]);
    commitMileChange(seeded, 'p1', '9', '0', null, NOW.getTime(), NEVER);
    assert.deepEqual((goalOf(seeded, 'run') as any).mileBestSrc.from, { mins: '9', secs: '20', kind: 'seeded' });
    const bare = phone([{ ...prog('p1'), cfg: { cardioTypes: ['run'] } }]);
    commitMileChange(bare, 'p1', '7', '30', null, NOW.getTime(), NEVER);
    assert.deepEqual(stored(bare)[0]!['cfg'].cardioGoals.run.mileBestMins, '7', 'a config with no goals stored gets the run\'s');
    const two = phone([prog('p1', { cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_base' }, bike: { id: 'bike_base', label: 'Base' } } })]);
    commitMileChange(two, 'p1', '9', '0', null, NOW.getTime(), NEVER);
    assert.deepEqual(stored(two)[0]!['cfg'].cardioGoals.bike, { id: 'bike_base', label: 'Base' }, 'the other sport\'s goal is as it was');
  });
  test('a mile is refused blank in either field, and when it is no mile time, in the validator\'s words; nothing is stored', () => {
    const s = phone([prog('p1', RUN)]);
    const before = s.get('ia_programs');
    assert.equal(MILE_BOTH, 'Put in both the minutes and the seconds.');
    assert.deepEqual(commitMileChange(s, 'gone', '9', '0', null, NOW.getTime(), NEVER), { toast: null, saved: false });
    for (const [m, sec] of [['', '30'], ['9', ''], ['  ', '0'], ['9', ' ']] as const) assert.deepEqual(commitMileChange(s, 'p1', m, sec, null, NOW.getTime(), NEVER), { toast: MILE_BOTH, saved: false });
    assert.deepEqual(commitMileChange(s, 'p1', '9', '75', null, NOW.getTime(), NEVER), { toast: 'That mile time is not a real time. Check the minutes and seconds.', saved: false });
    assert.deepEqual(commitMileChange(s, 'p1', '2', '0', null, NOW.getTime(), NEVER), { toast: 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.', saved: false });
    assert.deepEqual(commitMileChange(s, 'p1', '26', '0', null, NOW.getTime(), NEVER), { toast: 'Over 25:00 reads as a walk, not a run. Check the entry.', saved: false });
    assert.equal(s.get('ia_programs'), before);
  });
  test('a mile outside the chart is saved, and the toast adds what the chart does with it', () => {
    const s = phone([prog('p1', RUN)]);
    assert.deepEqual(commitMileChange(s, 'p1', '4', '30', null, NOW.getTime(), NEVER), { toast: 'Mile updated. Every run still ahead of you now reads from your new row. At 4:30 your paces come from the chart’s fastest row, 5:00. It tops out there.', saved: true });
    assert.deepEqual(commitMileChange(s, 'p1', '13', '0', null, NOW.getTime(), NEVER), { toast: 'Mile updated. Every run still ahead of you now reads from your new row. At 13:00 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.', saved: true });
    assert.equal((goalOf(s, 'run') as any).mileBestMins, '13');
  });
});

describe('native program list: the screens\' words and wiring', () => {
  const list = strip(read('program-list/Programs.tsx')), goal = strip(read('goal-sheet/GoalSheet.tsx')), mile = strip(read('mile-sheet/MileSheet.tsx')), frame = strip(read('program-list/SheetFrame.tsx')), app = strip(read('App.tsx'));
  const screen = strip(read('program-list/list-screen.ts'));
  const today = (f: string): string => readFileSync(join(TODAY, f), 'utf8');

  test('the words the screens write around their models are today\'s', () => {
    const page = today('program-list/program-list.ts') + today('program-list/program-detail.ts') + today('goal-sheet/goal-sheet.ts') + today('mile-sheet/mile-sheet.ts') + today('mile-sheet/mile-lock.ts');
    for (const w of ['>Set Active<', 'Active ✓', '>Archive<', '>Cancel<', '>Delete forever…<', '>Delete Forever<', '>Save<', 'It leaves your program list but its history stays. View it anytime under Progress.', 'Archive “${name}”?',
      'This erases all logs, weights, and history for “${name}”. It cannot be undone.', '>Focus<', '>Profile<', '>Schedule<', "'Starting 1RM'", '(est.)', 'Run paces<', '>Cardio<', '>Lift only<', '>Event target<',
      'Weeks you already trained stay on the books. The rest of the program rebuilds around the new goal.', '>Current<', 'Bigger goal than your current build.', 'Target distance and time. The engine will not guess these for you.',
      'Target time. The engine will not guess this for you.', 'placeholder="dist e.g. 1.5"', 'placeholder="min"', 'placeholder="sec"', '>Your mile<', '>Update my mile<', '>Keep what I have<', '>The row holds<', '>Got it<', '← Back']) assert.ok(page.includes(w), 'today\'s screens write ' + w);
    for (const w of ["title: 'Your Programs'", "build: '+ Build New Program'", "setActive: 'Set Active'", "active: 'Active ✓'", "archive: 'Archive'", "cancel: 'Cancel'", "save: 'Save'", "purgeLink: 'Delete forever…'", "purge: 'Delete Forever'",
      "archiveNote: 'It leaves your program list but its history stays. View it anytime under Progress.'", "'Archive “' + name + '”?'", "'This erases all logs, weights, and history for “' + name + '”. It cannot be undone.'",
      "GOAL_INTRO = 'Weeks you already trained stay on the books. The rest of the program rebuilds around the new goal.'", "current: 'Current'", "bigger: 'Bigger goal than your current build.'",
      "pace: 'Target distance and time. The engine will not guess these for you.'", "time: 'Target time. The engine will not guess this for you.'", "dist: 'dist e.g. 1.5'", "min: 'min'", "sec: 'sec'",
      "title: 'Your mile'", "update: 'Update my mile'", "keep: 'Keep what I have'", "lockTitle: 'The row holds'", "gotIt: 'Got it'"]) assert.ok(screen.includes(w), 'this app\'s words hold ' + w);
    assert.ok(read('../../app/src/legacy/src/html/screens.html').includes('<div class="app-subtitle" id="homeSubtitle">Your Programs</div>') && read('../../app/src/legacy/src/html/screens.html').includes('>+ Build New Program</button>'));
    for (const w of ["rows('Focus', d.focus)", "rows('Profile', d.profile)", "rows('Schedule', d.schedule)", "{'Starting 1RM'}{d.estimated && <Text style={[s.est, { color: p.muted }]}>{' (est.)'}</Text>}", '>Run paces</Text>', '>Cardio</Text>', '>Lift only</Text>', "d.event && rows('Event target', d.event)", '← Back']) {
      assert.ok((list + frame).includes(w), 'the list draws ' + w);
    }
  });
  test('the list draws every field of today\'s models', () => {
    for (const f of ['c.isActive ? p.signal', '{c.goalLabel}', 'markupLines(c.name)', 'markupLines(c.metaHtml)', 'defaultValue={c.nameValue}', 'c.editing ?', 'c.confirm === 1 ?', 'c.confirm === 2 ?', '/ open$/.test(c.cardClass) && detail(c)', 'EMPTY_HTML[v.empty]',
      '{r.k}', '{r.v}', '{c.k}', '{c.v}', '{c.u}', 'd.lifts.map(', 'd.paces.chips.map(', 'markupLines(d.paces.sentence)', '{x.label}', '{x.goal}', '{d.seed}', 'archiveQuestion(c.name)', 'purgeWarning(c.name)']) assert.ok(list.includes(f), 'the list draws ' + f);
    for (const f of ['{v.heading}', '{GOAL_INTRO}', '{o.label}', '{o.desc}', 'o.current && <Text', '!o.current && o.up &&', '{d.title}', '{d.body}', "d.inputs === 'pace'", "d.inputs === 'time'", 'd.values.targetDist', 'd.values.targetMins', 'd.values.targetSecs', 'd.values.paceUnit === u', '{d.commitLabel}', '{d.keepLabel}', 'd.up ? [keepBtn, commitBtn] : [commitBtn, keepBtn]']) assert.ok(goal.includes(f), 'the goal sheet draws ' + f);
    for (const f of ['{MILE_WORDS.lockTitle}', 'open.facts.map(', '{f.k}', '{f.v}', '{MILE_LOCK_TEXT}', '{MILE_WORDS.gotIt}', '{MILE_WORDS.title}', '{MILE_INTRO}', "open.kind === 'edit' ? open.mins : ''", "open.kind === 'edit' ? open.secs : ''", '{MILE_WORDS.update}', '{MILE_WORDS.keep}']) assert.ok(mile.includes(f), 'the mile sheets draw ' + f);
  });
  test('each tap of the list is the page\'s: what is kept, the write, the draw, then the toast', () => {
    for (const line of [
      'toggle: (id: string): void => { toggleCard(st, id); redraw(); },',
      'pencil: (c: ListCard): void => { typed.current = c.nameValue; startRename(st, c.id); redraw(); },',
      'save: (id: string): void => { const toast = renameProgram(store, id, typed.current); endRename(st); redraw(); if (toast) say(toast); },',
      'cancelRename: (): void => { endRename(st); redraw(); },',
      'askArchive: (id: string): void => { askArchive(st, id); redraw(); },',
      'askPurge: (id: string): void => { askPurge(st, id); redraw(); },',
      'cancel: (): void => { cancelConfirm(st); redraw(); },',
      'setActive: (id: string): void => { const o = setActive(store, id, Date.now(), report); redraw(); if (o.toast) say(o.toast); if (o.switched) onSwitch(); },',
      'archive: (id: string): void => { const o = archiveProgram(store, id, activeId(store), Date.now(), report); cancelConfirm(st); onGone(id); redraw(); if (o && o.toast) say(o.toast); },',
      'purge: (id: string): void => { const o = deleteProgram(store, id, activeId(store), Date.now(), report); cancelConfirm(st); onGone(id); redraw(); if (o.toast) say(o.toast); },',
      'const done = (o: Outcome): void => { redraw(); if (o.toast) say(o.toast); };',
      'const report = refreshReport(say);',
      'const [drawn, setDrawn] = useState(() => ({ view: listView(store, st, new Date()), n: 0 }));',
      'const redraw = (): void => setDrawn((d) => ({ view: listView(store, st, new Date()), n: d.n + 1 }));',
    ]) assert.ok(list.includes(line), 'the list holds ' + line);
    for (const [id, tap] of [["'card-tap-' + c.id", 'onPress={() => on.toggle(c.id)}'], ["'rename-' + c.id", '() => on.pencil(c)'], ["'rename-save-' + c.id", '() => on.save(c.id)'], ["'rename-cancel-' + c.id", 'onPress={on.cancelRename}'],
      ["'set-active-' + c.id", '() => on.setActive(c.id)'], ["'archive-ask-' + c.id", '() => on.askArchive(c.id)'], ["'archive-' + c.id", '() => on.archive(c.id)'], ["'purge-link-' + c.id", 'onPress={() => on.askPurge(c.id)}'], ["'purge-' + c.id", '() => on.purge(c.id)'],
      ["'confirm-cancel'", 'on.cancel'], ["'mile-pencil-' + c.id", '() => on.mile(c.id)'], ["'goal-pencil-' + c.id + '-' + x.type", '() => on.goal(c.id, x.type)']] as const) {
      const at = list.indexOf(id);
      assert.ok(at > 0 && list.slice(at, at + 420).includes(tap), id + ' is wired to ' + tap);
    }
    assert.ok(list.includes('<ScrollView testID="programs-body"') && !/key=\{drawn\.n\}/.test(list), 'the list is one body through every draw, so it keeps its place');
    assert.ok(list.includes("EMPTY_HTML[v.empty].replace('<br>', '\\n')"), 'the empty list\'s break is a line break');
    assert.ok(list.includes('{ strength: p.lift, hypertrophy: p.hip, fatloss: p.run, athletic: p.bike, balanced: p.accent }'), 'each goal\'s badge in its own colour (screens.css)');
    assert.ok(list.includes('onSubmitEditing={() => on.save(c.id)}') && list.includes('maxLength={40}') && list.includes('onChangeText={(t) => { typed.current = t; }}'), 'the rename box: forty at most, Return saves');
  });
  test('the active card has no Set Active, and the copy button and Build New Program take no press', () => {
    assert.ok(list.includes("? <View testID={'active-' + c.id} style={[s.action, s.isActive, { borderColor: p.border2 }]}><Text style={[s.actionText, { color: p.muted }]}>{LIST_WORDS.active}</Text></View>"));
    assert.ok(list.includes('<View accessibilityLabel="Copy program selections for troubleshooting" style={[s.copy, { backgroundColor: p.surface, borderColor: p.border2 }]}><Icon name="copy" size={15} color={p.muted} /></View>'));
    assert.ok(list.includes('<View testID="build-new" style={[s.build, { borderColor: p.border2 }]}><Text style={[s.buildText, { color: p.text }]}>{LIST_WORDS.build}</Text></View>'));
    assert.equal((list.match(/onPress=/g) || []).length, 5, 'the list\'s five presses: a button and a pencil (one helper each), the rename\'s X, the card, the purge link');
  });
  test('the pencils open their sheets over the whole screen, each handed the store and what the tap read', () => {
    assert.ok(list.includes('const draft = openGoal(store, id, sport);') && list.includes('if (draft) onCover(<GoalSheet palette={p} store={store} draft={draft} calm={calm} report={report} onClose={() => onCover(null)} onDone={done} />);'));
    assert.ok(list.includes('const open = openMile(store, id, new Date());') && list.includes('if (open) onCover(<MileSheet palette={p} store={store} open={open} calm={calm} report={report} say={say} onClose={() => onCover(null)} onDone={done} />);'));
  });
  test('the goal sheet: a pick, a typed target, the switch through the one writer, greyed until its targets stand, then away', () => {
    assert.ok(goal.includes('const [draft, setDraft] = useState(opened);') && goal.includes('const g = goalView(store, draft, new Date());'));
    assert.ok(goal.includes('onPress={() => { if (!o.current) setDraft(selectGoal(draft, o.id)); }}') && goal.includes('disabled={o.current}'));
    assert.ok(goal.includes('onChangeText={(t) => setDraft(typeGoal(draft, key, t))}') && goal.includes("onPress={() => setDraft(typeGoal(draft, 'paceUnit', u))}"));
    assert.ok(goal.includes('const o = commitGoalChange(store, draft, activeId(store), Date.now(), report);') && goal.includes('if (o) leave(() => onDone(o));'));
    assert.ok(goal.includes('disabled={!g.ok} onPress={commit}') && goal.includes('{ opacity: g.ok ? 1 : 0.4 }'));
    assert.ok(goal.includes('<Pressable key="keep" testID="goal-keep" accessibilityRole="button" onPress={() => leave()}'));
  });
  test('the mile sheets: Update my mile through the one writer, a refusal said with the sheet still up, a save handed on as it leaves', () => {
    assert.ok(mile.includes('const o = commitMileChange(store, open.progId, mins, secs, activeId(store), Date.now(), report);'));
    assert.ok(mile.includes('if (o.saved) leave(() => onDone(o)); else if (o.toast) say(o.toast);'));
    assert.ok(mile.includes('value={mins} onChangeText={setMins}') && mile.includes('value={secs} onChangeText={setSecs}'));
    assert.ok(mile.includes('<Pressable testID="mile-keep" accessibilityRole="button" onPress={() => leave()}') && mile.includes('<Pressable testID="mile-got-it" accessibilityRole="button" onPress={() => leave()}'));
    assert.ok(mile.includes("{(leave) => (open.kind === 'lock' ? lock(leave) : edit(leave))}"));
    assert.ok(frame.includes('if (leaving.current) return;') && frame.includes('if (calm) { onClose(); return; }') && frame.includes("onPress={() => leave()}"), 'a sheet leaves once, at once under Reduce Motion');
  });
  test('the app holds a Programs tab first, draws its sheets over the tab bar and under the toast, and Set Active ends on This Week', () => {
    assert.ok(app.includes("type Tab = 'home' | 'week' | 'progress' | 'bugs';"));
    assert.ok(app.includes('const refused = tabRefused(phoneStore, t);\n    if (refused) { say(refused); return; }\n    if (t === \'week\' && tab !== \'week\')'), 'a tab that is refused says why and does not open');
    assert.ok(app.includes('<Text numberOfLines={2} style={styles.toastText}>{text}</Text>') && app.includes("color: '#0a0a0a', textAlign: 'center' },"), 'a long toast takes a second line, so the refusal is read whole');
    assert.ok(app.includes('const list = useRef(newListState()).current;') && app.includes("if (t === 'home') setHomeTaps((n) => n + 1);"));
    assert.ok(app.includes("<Programs key={homeTaps} palette={p} store={phoneStore} state={list} calm={calm} say={say} onSwitch={() => go('week')} onGone={(id) => { if (progress.viewId === id) progress.viewId = null; }} onCover={setCover} />"));
    const home = app.indexOf('id="tab-home" label="Programs"'), week = app.indexOf('id="tab-week"'), bar = app.indexOf('testID="tab-bar"'), cover = app.indexOf('{cover}'), toast = app.indexOf('{toast && <Toast');
    assert.ok(home > 0 && home < week, 'Programs is the first tab');
    assert.ok(bar < cover && cover < toast, 'a sheet is drawn after the tab bar and before the toast');
  });
  test('no screen of the three names the store\'s writers: every write is list-writes.ts\'s', () => {
    for (const [name, text] of [['Programs.tsx', list], ['GoalSheet.tsx', goal], ['MileSheet.tsx', mile], ['SheetFrame.tsx', frame], ['list-screen.ts', screen], ['list-readers.ts', strip(read('program-list/list-readers.ts'))]] as const) {
      assert.doesNotMatch(text, /writePrograms|writeActiveProgramId|store\.set\(|store\.remove\(|refreshStoredProgram/, name + ' writes nothing itself');
    }
    const writes = strip(read('program-list/list-writes.ts'));
    assert.equal((writes.match(/refreshStoredProgram\(/g) || []).length, 1, 'one rebuild, core\'s');
    assert.equal((writes.match(/writeActiveProgramId\(/g) || []).length, 1, 'one place writes the pointer: the switch');
  });
});
