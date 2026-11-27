// The Expo app's wizard and Generate (MIGRATION.md phase 3, row 6, the first of two sessions), each rule by a hand
// table: the draft it opens with, the steps each path walks, each tap, the rest days' floor and its toast, the
// advisories' words, the start date's four sentences and a race plan's copy, the name step's defaults and rows, the
// swim times' validator, the length's pop-up, the refusals' order, the pins Generate writes, the start it applies,
// what it stores, where This Week lands, the generating figure's motion, and the wiring of the screens. Every
// expected value here is typed by hand from today's code and rulings, or worked out by date arithmetic; the two apps
// side by side are tests/integration/native-wizard.test.ts.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import { atInstant } from '../support/native-wizard.ts';
import { resolveStartDate, rsRace } from '../../frontends/native/src/week-dates/week-dates.ts';
import { FIGURE, along, ease, figureAt } from '../../frontends/native/src/wizard/generating-figure.ts';
import {
  type Draft, alignedStartCopy, getDayAdvisories, getMinTrainDays, getMinTrainDaysLabel, goalLabel, isoToday, nameView, nameWeeks, newDraft, startResolveCopy, startSummaryVal, swimEntryState,
  PACE_IMPROVE, SWIM_GOAL_DIST, assessRunPaceCeiling, mileFieldHelp, paceCeilingSentence, progLenLine, wizardAlignment, wizardStartSummary, wizardTestPin,
} from '../../frontends/native/src/wizard/wizard-readers.ts';
import { fieldValue, keptText } from '../../frontends/native/src/wizard/number-field.ts';
import {
  WIZARD_WORDS, applySeedData, cardParts, cardioDraw, copyRuns, dateFieldText, dismissSeedData, editCardioField, floorToastMarkup, landingTitle, liftOnly, offerShorterPlan, raceTargeted, repaintStart,
  setCardioGoal, setChoice, setName, setPaceUnit, setRaceDate, setStart, setSwimUnit, setUnit, startWizard, titleLine, toggleCardioTypeSport, toggleRestDay, unbroken, wizardBack, wizardNext, wizardView,
} from '../../frontends/native/src/wizard/wizard-screen.ts';
import { GENERATING, LENGTH_WORDS, applyWizardStart, beginGenerate, finishGenerate, lengthWarning, refusal } from '../../frontends/native/src/wizard/wizard-writes.ts';

process.env['TZ'] = 'America/New_York';
const NATIVE = join(REPO, 'frontends/native/src');
const TODAY = join(REPO, 'frontends/app/src/app/screens/wizard');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

// Now is Saturday 2026-08-29, 10:00: its week's Monday is 2026-08-24, the next Monday 2026-08-31.
const NOW = new Date(2026, 7, 29, 10, 0, 0);
const draft = (over: Partial<Draft> = {}): Draft => ({ ...newDraft(NOW), ...over });
const run = (id: string, label: string, more: object = {}): Draft['cardioGoals'] => ({ run: { id, label, baseline: '', ...more } });
const told: string[] = [];
const report = { overlay: () => { told.push('overlay'); }, freeze: () => { told.push('freeze'); }, rebuild: () => { told.push('rebuild'); } };
/** The sports' cards of a whole draw of the cardio goals, on a phone that stores nothing. */
const cardioCards = (d: Draft, now: Date) => cardioDraw(memoryStore(), d, now).cardio.sports;
const resolved = (d: Draft) => resolveStartDate(d.startDate, d.restDays, rsRace(d as never), NOW);

describe('native wizard: today\'s own models, to the byte', () => {
  for (const f of ['wizard-model.ts', 'cardio-goal-model.ts']) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(TODAY, f));
      assert.ok(today.length > 10000, 'today\'s file was read: ' + today.length + ' bytes');
      assert.ok(today.equals(readFileSync(join(NATIVE, 'wizard', f))));
    });
  }
  test('the wizard\'s folder holds its models, its readers, its taps, its one writer, the figure and three screens', () => {
    assert.deepEqual(readdirSync(join(NATIVE, 'wizard')).sort(), ['Generating.tsx', 'Wizard.tsx', 'cardio-goal-model.ts', 'generating-figure.ts', 'number-field.ts', 'wizard-model.ts', 'wizard-readers.ts', 'wizard-screen.ts', 'wizard-writes.ts']);
  });
});

describe('native wizard: the draft and the steps', () => {
  test('Build New Program opens a draft of its own: the strength path, lift only, intermediate, 18-35, a full home gym, pounds, no rest day, starting today', () => {
    const st = startWizard(NOW);
    assert.equal(st.step, 0);
    assert.deepEqual(st.draft, {
      primaryPath: 'body', cardioTypes: [], cardioGoals: {}, eventTargeted: true, liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs',
      restDays: [], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 0, squat: 0, deadlift: 0, name: '', startDate: '2026-08-29',
    });
    assert.notEqual(startWizard(NOW).draft, st.draft, 'each wizard has a draft of its own');
    assert.equal(isoToday(new Date(2026, 7, 29, 23, 59, 59)), '2026-08-29', 'today is the local day, late at night too');
  });
  test('the race and hybrid paths walk seven steps; the strength path six, skipping the cardio goals both ways', () => {
    const walk = (path: string): string[] => {
      const st = startWizard(NOW); st.draft.primaryPath = path;
      const seen = [wizardView(memoryStore(), st, NOW).view.step as string];
      while (!wizardNext(st)) seen.push(wizardView(memoryStore(), st, NOW).view.step);
      const back: string[] = [];
      while (!wizardBack(st)) back.push(wizardView(memoryStore(), st, NOW).view.step);
      assert.deepEqual(back, seen.slice(0, -1).reverse(), path + ': Back walks the same steps the other way');
      return seen;
    };
    assert.deepEqual(walk('event'), ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name']);
    assert.deepEqual(walk('both'), ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name']);
    assert.deepEqual(walk('body'), ['primary', 'profile', 'equipment', 'lifting_focus', 'days', 'name']);
  });
  test('Back on the first step leaves; Continue on the last asks for Generate and stays on it', () => {
    const st = startWizard(NOW);
    assert.equal(wizardBack(st), true);
    assert.equal(st.step, 0);
    st.step = 6;
    assert.equal(wizardNext(st), true);
    assert.equal(st.step, 6);
  });
  test('the bar counts the step of the path\'s steps, and the last button reads Generate Program', () => {
    const at = (path: string, step: number) => { const st = startWizard(NOW); st.draft.primaryPath = path; st.step = step; return wizardView(memoryStore(), st, NOW).shell; };
    assert.deepEqual(at('event', 0), { fill: (1 / 7) * 100 + '%', label: '1/7', next: 'Continue →' }, 'one seventh of the bar');
    assert.equal(at('event', 3).fill, (4 / 7) * 100 + '%');
    assert.deepEqual(at('body', 0).label, '1/6');
    assert.deepEqual(at('body', 2).label, '2/6', 'the strength path counts the step\'s own number once past About you, as today\'s does');
    assert.deepEqual(at('body', 4).label, '4/6');
    assert.deepEqual(at('body', 6), { fill: '100%', label: '6/6', next: 'Generate Program →' });
    assert.deepEqual(at('both', 6).label, '7/7');
  });
  test('a card writes its field; a unit already chosen changes nothing', () => {
    const st = startWizard(NOW);
    setChoice(st, 'primaryPath', 'event'); setChoice(st, 'experience', 'advanced'); setChoice(st, 'ageBracket', '55+'); setChoice(st, 'equipment', 'crossfit'); setChoice(st, 'liftingFocus', 'support_athletic');
    assert.deepEqual([st.draft.primaryPath, st.draft.experience, st.draft.ageBracket, st.draft.equipment, st.draft.liftingFocus], ['event', 'advanced', '55+', 'crossfit', 'support_athletic']);
    setUnit(st, 'kg'); assert.equal(st.draft.unit, 'kg');
    setUnit(st, 'kg'); assert.equal(st.draft.unit, 'kg');
    setName(st, ' A name '); assert.equal(st.draft.name, ' A name ', 'the name is kept as typed, its spaces too');
    setStart(st, ''); assert.equal(st.draft.startDate, '');
  });
  test('a sport opens and shuts, its goal going with it; Lift Only clears both', () => {
    const st = startWizard(NOW);
    toggleCardioTypeSport(st, 'run'); toggleCardioTypeSport(st, 'swim');
    assert.deepEqual(st.draft.cardioTypes, ['run', 'swim']);
    st.draft.cardioGoals = { run: { id: 'run_5k' }, swim: { id: 'swim_mile' } };
    toggleCardioTypeSport(st, 'run');
    assert.deepEqual(st.draft.cardioTypes, ['swim']);
    assert.deepEqual(Object.keys(st.draft.cardioGoals), ['swim']);
    liftOnly(st);
    assert.deepEqual([st.draft.cardioTypes, st.draft.cardioGoals], [[], {}]);
  });
});

describe('native wizard: the cardio goals, as far as this session draws them', () => {
  test('drawing the step gives a draft with a race date on and none picked today\'s date, on every path that draws it', () => {
    for (const path of ['event', 'both']) {
      const d = draft({ primaryPath: path });
      cardioCards(d, NOW);
      assert.equal(d.raceDate, '2026-08-29', path);
    }
    const kept = draft({ primaryPath: 'event', raceDate: '2026-12-06' });
    cardioCards(kept, NOW);
    assert.equal(kept.raceDate, '2026-12-06', 'a date already picked stays');
    const off = draft({ primaryPath: 'event', eventTargeted: false, raceDate: '', raceDateWeeks: 9 });
    cardioCards(off, NOW);
    assert.deepEqual([off.raceDate, off.raceDateWeeks], ['', null], 'with no race date asked for, none is written and the week count is cleared');
  });
  test('the hybrid path drops a taper goal picked on another path, and lists no taper goal', () => {
    const d = draft({ primaryPath: 'both', cardioTypes: ['run', 'bike', 'swim'], cardioGoals: { run: { id: 'run_half' }, bike: { id: 'bike_century' }, swim: { id: 'swim_base' } } });
    const cards = cardioCards(d, NOW);
    assert.deepEqual(Object.keys(d.cardioGoals), ['swim']);
    assert.deepEqual(cards.map((c) => c.goals.map((g) => g.id)), [['run_5k', 'run_10k', 'run_pace_goal', 'run_base'], ['bike_50', 'bike_ftp', 'bike_cals', 'bike_base'], ['swim_mile', 'swim_100_time', 'swim_500_time', 'swim_base']]);
    assert.deepEqual(cards[2]!.goals.filter((g) => g.sel).map((g) => g.id), ['swim_base'], 'the goal the draft holds is marked');
  });
  test('the race path lists each sport\'s whole table, only under an open sport, in today\'s words', () => {
    const cards = cardioCards(draft({ primaryPath: 'event', cardioTypes: ['run'] }), NOW);
    assert.deepEqual(cards.map((c) => [c.id, c.sel, c.name, c.desc, c.goals.length]), [
      ['run', true, 'Running', 'Outdoor or treadmill. Pace, distance and race goals.', 6],
      ['bike', false, 'Cycling / Spin', 'Spin bike or outdoor. Intervals, FTP and distance.', 0],
      ['swim', false, 'Swimming', 'Lap pool or open water. Structured sets.', 0],
    ]);
    assert.deepEqual(cards[0]!.goals[4], { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', desc: 'A distance and a time. 1.5 miles under 10 minutes. A mile under 6.', sel: false });
  });
  test('a goal in the draft draws its form: the pace goal\'s and the swim 100\'s, with what the draft holds in their fields', () => {
    const d = draft({ primaryPath: 'event', cardioTypes: ['run', 'swim'], cardioGoals: { run: { id: 'run_pace_goal', targetDist: '1.5', targetMins: '9' }, swim: { id: 'swim_100_time' } } });
    const cards = cardioCards(d, NOW);
    const run = cards[0]!.form!, swim = cards[2]!.form!;
    assert.ok(run.kind === 'pace' && run.dist === '1.5' && run.target.mins === '9' && run.target.secs === '' && run.unit === 'mi');
    assert.ok(swim.kind === 'swim' && swim.dist === 100 && swim.unit === 'yd' && swim.base500 !== null && swim.baseLabel === 'Your most recent timed 100yd' && swim.base500.label === 'Your most recent timed 500yd');
    assert.equal(cards[1]!.form, null, 'a sport that is shut draws none');
    assert.deepEqual(Object.keys(d.cardioGoals), ['run', 'swim'], 'and the draft keeps them');
  });
});

describe('native wizard: the rest days', () => {
  test('the floor is three, or what the draft\'s goals need', () => {
    const floor = (goals: Record<string, string>): number => getMinTrainDays(draft({ cardioTypes: Object.keys(goals), cardioGoals: Object.fromEntries(Object.entries(goals).map(([s, id]) => [s, { id }])) }));
    assert.equal(floor({}), 3);
    assert.deepEqual(['run_marathon', 'run_half', 'run_10k', 'run_5k', 'run_pace_goal', 'run_base'].map((id) => floor({ run: id })), [5, 4, 3, 3, 3, 3]);
    assert.deepEqual(['swim_tri', 'swim_mile', 'swim_500_time', 'swim_100_time', 'swim_base'].map((id) => floor({ swim: id })), [4, 4, 3, 3, 3]);
    assert.deepEqual(['bike_century', 'bike_50', 'bike_ftp', 'bike_cals', 'bike_base'].map((id) => floor({ bike: id })), [4, 3, 3, 3, 3]);
    assert.equal(floor({ run: 'run_5k', swim: 'swim_mile' }), 4, 'the highest of them');
    assert.equal(getMinTrainDays(draft({ cardioTypes: [], cardioGoals: { run: { id: 'run_marathon' } } })), 3, 'a goal of a sport not chosen does not count');
  });
  test('a day rests and comes back; a training day at the floor stays, with the toast that says why', () => {
    const st = startWizard(NOW);
    for (const d of ['sun', 'mon', 'tue', 'wed']) assert.equal(toggleRestDay(st, d), null);
    assert.deepEqual(st.draft.restDays, ['sun', 'mon', 'tue', 'wed']);
    assert.deepEqual(st.draft.days, ['thu', 'fri', 'sat'], 'the training days follow, Sunday first');
    const t = toggleRestDay(st, 'thu');
    assert.deepEqual(t, { icon: '⚠', text: 'Three days is the floor. Two gives you the same session twice.' });
    assert.equal(floorToastMarkup(t!), asyIcon('⚠', 13) + ' Three days is the floor. Two gives you the same session twice.', 'as the page hands it to its toast: the mark, a space, the words');
    assert.deepEqual(st.draft.restDays, ['sun', 'mon', 'tue', 'wed'], 'and nothing changed');
    assert.equal(toggleRestDay(st, 'mon'), null, 'a resting day comes back at the floor');
    assert.deepEqual([st.draft.restDays, st.draft.days], [['sun', 'tue', 'wed'], ['mon', 'thu', 'fri', 'sat']]);
  });
  test('the toast names the goals that set the floor', () => {
    const d = (goals: Draft['cardioGoals']): Draft => draft({ cardioTypes: Object.keys(goals), cardioGoals: goals });
    assert.equal(getMinTrainDaysLabel(d({ run: { id: 'run_marathon' } })), 'Full Marathon needs 5 training days — see why below');
    assert.equal(getMinTrainDaysLabel(d({ run: { id: 'run_5k' }, swim: { id: 'swim_mile' } })), 'Run a 5K + Swim a Mile needs 4 training days — see why below');
    assert.equal(getMinTrainDaysLabel(d({})), 'Three days is the floor. Two gives you the same session twice.');
    assert.equal(goalLabel('bike_ftp'), 'Improve FTP / Power');
    assert.equal(goalLabel('no_such_goal'), 'your');
    const st = { step: 5, draft: d({ run: { id: 'run_marathon' } }) };
    st.draft.restDays = ['sun', 'mon'];
    assert.deepEqual(toggleRestDay(st, 'tue'), { icon: '⚠', text: 'Full Marathon needs 5 training days — see why below' });
  });
  test('the step locks every training day at the floor and says why; above it nothing is locked', () => {
    const view = (d: Draft) => { const v = wizardView(memoryStore(), { step: 5, draft: d }, NOW).view; assert.equal(v.step, 'days'); return v.step === 'days' ? v.days : null!; };
    const open = view(draft({ restDays: ['sun'] }));
    assert.deepEqual([open.count, open.floor, open.days.filter((x) => x.blocked).length, open.days.find((x) => x.key === 'sun')!.rest], ['6 training days', null, 0, true]);
    const three = view(draft({ restDays: ['sun', 'mon', 'tue', 'wed'] }));
    assert.deepEqual([three.count, three.floor, three.days.filter((x) => x.blocked).map((x) => x.key)], ['3 training days', { reason: null, min: 3 }, ['thu', 'fri', 'sat']]);
    const mara = view(draft({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_marathon' } }, restDays: ['sun', 'mon'] }));
    assert.deepEqual(mara.floor, { reason: 'Full Marathon', min: 5 });
    assert.equal(view(draft({ restDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri'] })).count, '1 training day', 'one day is not days');
  });
  test('the advisories are today\'s sentences: lifting days, a cardio goal\'s days, interval days', () => {
    assert.deepEqual(getDayAdvisories(draft({ liftingFocus: 'hypertrophy', restDays: ['sun', 'mon', 'tue', 'wed'] })), [asyIcon('dumbbell', 14) + ' Hypertrophy training is most effective with <b>4+ days</b> — you have 3.']);
    assert.deepEqual(getDayAdvisories(draft({ liftingFocus: 'support_athletic', restDays: ['sun', 'mon', 'tue', 'wed'] })), [asyIcon('dumbbell', 14) + ' Athletic training is most effective with <b>4+ days</b> — you have 3.']);
    assert.deepEqual(getDayAdvisories(draft({ liftingFocus: 'strength', restDays: ['sun', 'mon', 'tue', 'wed'] })), [], 'strength asks for three');
    assert.deepEqual(getDayAdvisories(draft({ liftingFocus: 'strength', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_marathon' } }, restDays: ['sun', 'mon', 'tue'] })),
      [asyIcon('flag', 14) + ' Your <b>Full Marathon</b> goal trains best with <b>5+ days</b> for the weekly volume — you have 4.']);
    const none = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const one = getDayAdvisories(draft({ liftingFocus: 'strength', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal' } }, restDays: none }));
    assert.equal(one[one.length - 1], asyIcon('🏃', 14) + ' Your <b>Hit a Pace / Time Goal</b> goal needs <b>3+ running days</b> for interval (speed) work — you have 0 running days. Add a training day.');
    const two = getDayAdvisories(draft({ liftingFocus: 'strength', cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_pace_goal' }, bike: { id: 'bike_base' } }, restDays: none }));
    assert.equal(two[two.length - 1], asyIcon('🏃', 14) + ' Your <b>Hit a Pace / Time Goal</b> goal needs <b>3+ running days</b> for interval (speed) work — with 2 sports sharing the week, running gets 0 days. Add a training day or drop a sport.');
  });
  test('the step draws the advisories only above the floor (today\'s rule, which no draft a path offers meets)', () => {
    const src = read('wizard/wizard-model.ts');
    assert.ok(src.includes('advisories: i.advisories.length && !atFloor ? i.advisories : [],'));
    assert.ok(read('wizard/wizard-screen.ts').includes("{ step: 'days', days: daysView(m, { advisories: getDayAdvisories(d), minDays: getMinTrainDays(d), goalLabel }) }"), 'the step is handed the advisories, the floor and the goals\' names');
  });
});

describe('native wizard: the start date', () => {
  test('the sentence under the field: a whole week, a short one with each day named, a start moved to Monday, a week that holds the test', () => {
    const copy = (over: Partial<Draft>): string => startResolveCopy(resolved(draft(over)));
    assert.equal(copy({ startDate: '2026-08-31' }), 'Week 1 runs <b>Aug 31 – Sep 6</b>.');
    assert.equal(copy({ startDate: '2026-08-29' }), 'Week 1 is short — you’ll train <b>Sat, Aug 29</b> and <b>Sun, Aug 30</b>, then a full week from <b>Mon, Aug 31</b>.');
    assert.equal(copy({ startDate: '2026-08-30' }), 'Week 1 is short — you’ll train <b>Sun, Aug 30</b>, then a full week from <b>Mon, Aug 31</b>.');
    assert.equal(copy({ startDate: '2026-08-27', restDays: ['sat'] }), 'Week 1 is short — you’ll train <b>Thu, Aug 27</b>, <b>Fri, Aug 28</b> and <b>Sun, Aug 30</b>, then a full week from <b>Mon, Aug 31</b>.');
    assert.equal(copy({ startDate: '2026-08-29', restDays: ['sat', 'sun'] }), 'Nothing left to train that week, so this starts <b>Mon, Aug 31</b>. Week 1 runs <b>Aug 31 – Sep 6</b>.');
    assert.equal(copy({ startDate: '2026-08-29', restDays: ['sat', 'sun'], primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_pace_goal', 'Hit a Pace / Time Goal'), raceDate: '2026-08-30' }),
      'That week holds your test, so this starts <b>Sat, Aug 29</b>. Nothing is left to train before it. Week 1 is the test week.');
    assert.equal(copy({ startDate: '' }), copy({ startDate: '2026-08-29' }), 'a blank start reads as today');
  });
  test('the summary\'s start: the day with its year, and what is to be known of it', () => {
    assert.equal(startSummaryVal({ start: '2026-08-31' }), 'Mon, Aug 31, 2026');
    assert.equal(startSummaryVal({ start: '2026-08-29', partial: true }), 'Sat, Aug 29, 2026, short first week');
    assert.equal(startSummaryVal({ start: '2026-07-27', aligned: true, partial: true }), 'Mon, Jul 27, 2026, set by race date');
  });
  test('a race plan counts back from its race on the race and hybrid paths alone, and the summary reads its start', () => {
    const d = (path: string): Draft => draft({ primaryPath: path, cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-09-19' });
    // The race is Saturday 2026-09-19: race week's Monday is 09-14, and an 8 week plan starts seven Mondays before it.
    for (const path of ['event', 'both']) {
      const al = wizardAlignment(d(path), NOW)!;
      assert.deepEqual([al.start, al.tw, al.weeksOut, al.openWeek, al.behindWeeks, al.futureWeeks, al.raceDay, al.floor, al.underFloor], ['2026-07-27', 8, 3, 5, 4, 0, 'sat', 4, true], path);
      assert.equal(wizardStartSummary(d(path), resolved(d(path)), NOW), 'Mon, Jul 27, 2026, set by race date');
    }
    assert.equal(wizardAlignment(d('body'), NOW), null);
    assert.equal(wizardStartSummary(d('body'), resolved(d('body')), NOW), 'Sat, Aug 29, 2026, short first week');
    assert.equal(wizardAlignment({ ...d('event'), eventTargeted: false }, NOW), null, 'no race date asked for');
    assert.equal(wizardAlignment({ ...d('event'), cardioGoals: run('run_base', 'Build Running Base') }, NOW), null, 'not a race plan');
    assert.equal(wizardAlignment({ ...d('event'), cardioTypes: ['bike'] }, NOW), null, 'a run goal left in the draft with the run not chosen');
  });
  test('the copy under a start set by a race date: the plan opening weeks in, under its floor, the shorter plan offered, and a plan that starts later', () => {
    const d = (id: string, label: string, race: string): Draft => draft({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run(id, label), raceDate: race });
    const five = d('run_5k', 'Run a 5K', '2026-09-19');
    assert.equal(alignedStartCopy(five, wizardAlignment(five, NOW)!),
      'Your 5K is <b>Sat, Sep 19</b>, 3 weeks out. The 8-week plan starts <b>Mon, Jul 27</b> so race week is week 8. You open in <b>week 5</b>. Weeks 1–4 are behind you: shown, not counted, not missed. Race day pins to <b>Saturday</b>. I don’t recommend under 4 weeks for the 5K.');
    const ten = d('run_10k', 'Run a 10K', '2026-09-19');
    assert.ok(alignedStartCopy(ten, wizardAlignment(ten, NOW)!).endsWith(' I don’t recommend under 4 weeks for the 10K. The <a onclick="offerShorterPlan(\'run_5k\')">5K plan</a> fits this window better.'));
    // Saturday 2026-12-05 is 98 days on: 14 weeks. Its plan starts Monday 10-12, seven Mondays after this week's.
    const later = d('run_5k', 'Run a 5K', '2026-12-05');
    assert.equal(alignedStartCopy(later, wizardAlignment(later, NOW)!),
      'Your 5K is <b>Sat, Dec 5</b>, 14 weeks out. The 8-week plan starts <b>Mon, Oct 12</b>, 7 weeks from now, so it peaks on race week and not early. Until then: run easy three times a week, 30–45 minutes, nothing hard.');
    // Sunday 2026-10-18 is in the week of Monday 10-12, whose plan starts this week's Monday: week 1, nothing behind.
    const first = d('run_5k', 'Run a 5K', '2026-10-18');
    assert.equal(alignedStartCopy(first, wizardAlignment(first, NOW)!),
      'Your 5K is <b>Sun, Oct 18</b>, 7 weeks out. The 8-week plan starts <b>Mon, Aug 24</b> so race week is week 8. You open in <b>week 1</b>. Race day pins to <b>Sunday</b>.');
  });
  test('a dated test goal pins its test week from the resolved start; no other goal pins', () => {
    const test9 = draft({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_pace_goal', 'Hit a Pace / Time Goal'), raceDate: '2026-09-19' });
    // The start is today, in the week of Monday 08-24; the test is in the week of Monday 09-14, three weeks on: week 4.
    assert.equal(wizardTestPin(test9, NOW)!.tw, 4);
    assert.equal(nameWeeks(test9, NOW), 4, 'and the name step prints the test week as the length');
    assert.equal(wizardTestPin({ ...test9, startDate: '2026-09-21' }, NOW)!.tw, null, 'a test before the start pins nothing');
    assert.equal(wizardTestPin(draft(), NOW), null);
    assert.equal(nameWeeks(draft(), NOW), 6, 'a lift only program is six weeks');
    const held = { ...test9, raceDate: '2026-08-30', restDays: ['sat', 'sun'] };
    assert.deepEqual([wizardTestPin(held, NOW)!.tw, wizardTestPin(held, NOW)!.holdsTest], [1, true], 'the week that holds the test is week 1');
  });
  test('the calendar\'s pick repaints two lines; a blank from Reset stays blank in the field and reads as today', () => {
    const st = { step: 6, draft: draft({ name: 'X', restDays: ['sun'] }) };
    const drawn = wizardView(memoryStore(), st, NOW).view;
    assert.equal(drawn.step, 'name');
    if (drawn.step !== 'name') return;
    setStart(st, '2026-08-31');
    const picked = repaintStart(st, drawn.name, NOW);
    assert.deepEqual([picked.startDate, picked.resolveCopy, picked.rows.find((r) => r.k === 'Start date')!.v], ['2026-08-31', 'Week 1 runs <b>Aug 31 – Sep 6</b>.', '<span id="sumStartDate">Mon, Aug 31, 2026</span>']);
    assert.deepEqual(picked.rows.filter((r) => r.k !== 'Start date'), drawn.name.rows.filter((r) => r.k !== 'Start date'), 'every other row is as it was');
    setStart(st, '');
    const blank = repaintStart(st, picked, NOW);
    assert.deepEqual([blank.startDate, st.draft.startDate, blank.rows.find((r) => r.k === 'Start date')!.v], ['', '', '<span id="sumStartDate">Sat, Aug 29, 2026, short first week</span>']);
    const again = wizardView(memoryStore(), st, NOW).view;
    assert.ok(again.step === 'name' && again.name.startDate === '2026-08-29' && st.draft.startDate === '2026-08-29', 'the next whole draw writes today into the draft');
    // A dated test goal: a start picked in the week that holds the test keeps that day, and the sentence says so.
    const dated = { step: 6, draft: draft({ name: 'X', restDays: ['sat', 'sun'], startDate: '2026-08-24', primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_pace_goal', 'Hit a Pace / Time Goal'), raceDate: '2026-08-30' }) };
    const whole = wizardView(memoryStore(), dated, NOW).view;
    setStart(dated, '2026-08-29');
    assert.ok(whole.step === 'name' && repaintStart(dated, whole.name, NOW).resolveCopy === 'That week holds your test, so this starts <b>Sat, Aug 29</b>. Nothing is left to train before it. Week 1 is the test week.');
    const race = { step: 6, draft: draft({ name: 'X', primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-09-19' }) };
    const al = wizardView(memoryStore(), race, NOW).view;
    assert.ok(al.step === 'name' && repaintStart(race, al.name, NOW) === al.name, 'a start set by a race date has no field to repaint');
  });
  test('the field shows a day as WebKit\'s does, and nothing when blank', () => {
    assert.equal(dateFieldText('2026-11-21'), 'Nov 21, 2026');
    assert.equal(dateFieldText('2026-08-01'), 'Aug 1, 2026');
    assert.equal(dateFieldText(''), '');
    assert.equal(dateFieldText('not a day'), '');
  });
});

describe('native wizard: the name step', () => {
  const store2 = (): ReturnType<typeof memoryStore> => memoryStore({ ia_programs: JSON.stringify([{ id: 'a' }, { id: 'b', archived: true }]) });
  test('a draft with no name is named for its focus and the stored programs plus one, the archived counted', () => {
    const d = draft({ liftingFocus: 'hypertrophy' });
    assert.equal(nameView(memoryStore(), d, NOW).name, 'Size Block 1');
    assert.equal(d.name, 'Size Block 1', 'written into the draft');
    assert.equal(nameView(store2(), draft({ liftingFocus: 'support_prevention' }), NOW).name, 'Injury Prevention Block 3');
    assert.equal(nameView(store2(), draft({ name: 'Mine' }), NOW).name, 'Mine', 'a name typed is kept');
  });
  test('a lift only draft: ten rows in today\'s order and words, and the field with its sentence', () => {
    const v = nameView(memoryStore(), draft({ restDays: ['sun'], experience: 'advanced', ageBracket: '36-54', equipment: 'crossfit' }), NOW);
    assert.deepEqual(v.rows, [
      { k: 'Path', v: 'Strength / Physique' }, { k: 'Lifting', v: 'Balanced' }, { k: 'Cardio', v: 'Lift only' }, { k: 'Program length', v: '6 weeks' },
      { k: 'Start date', v: '<span id="sumStartDate">Sat, Aug 29, 2026, short first week</span>' }, { k: 'Training days', v: 'Mo · Tu · We · Th · Fr · Sa' }, { k: 'Rest days', v: 'Su' },
      { k: 'Experience', v: 'advanced' }, { k: 'Age range', v: '36-54' }, { k: 'Equipment', v: 'CrossFit Box' },
    ]);
    assert.deepEqual([v.aligned, v.startDate, v.resolveCopy], [null, '2026-08-29', 'Week 1 is short — you’ll train <b>Sat, Aug 29</b>, then a full week from <b>Mon, Aug 31</b>.']);
    assert.equal(nameView(memoryStore(), draft(), NOW).rows.find((r) => r.k === 'Rest days')!.v, 'None');
  });
  test('the race path adds the race date row: the weeks away, race day, behind you, or no date', () => {
    const row = (over: Partial<Draft>): string | undefined => nameView(memoryStore(), draft({ primaryPath: 'event', ...over }), NOW).rows.find((r) => r.k === 'Race date')?.v;
    assert.equal(row({ raceDate: '2026-09-19' }), 'Sat, Sep 19, 2026 (3 weeks away)');
    assert.equal(row({ raceDate: '2026-09-05' }), 'Sat, Sep 5, 2026 (1 week away)');
    assert.equal(row({ raceDate: '2026-09-01' }), 'Tue, Sep 1, 2026 (3 days away)');
    assert.equal(row({ raceDate: '2026-08-30' }), 'Sun, Aug 30, 2026 (1 day away)');
    assert.equal(row({ raceDate: '2026-08-29' }), 'Sat, Aug 29, 2026 (race day)');
    assert.equal(row({ raceDate: '2026-08-20' }), 'Thu, Aug 20, 2026 (behind you)');
    assert.equal(row({ raceDate: '' }), 'No date set — no taper');
    assert.equal(nameView(memoryStore(), draft({ primaryPath: 'both', raceDate: '2026-09-19' }), NOW).rows.length, 10, 'the hybrid path has no race date row');
    assert.equal(nameView(memoryStore(), draft({ primaryPath: 'event', raceDate: '2026-09-19' }), NOW).rows[1]!.k, 'Race date', 'it stands second, under the path');
  });
  test('a race plan: the start derived, its copy, its pips, and the cardio row with its mark', () => {
    const v = nameView(memoryStore(), draft({ name: 'R', primaryPath: 'event', liftingFocus: 'support_strength', cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-09-19' }), NOW);
    assert.deepEqual([v.aligned!.start, v.aligned!.warn, v.resolveCopy], ['Mon, Jul 27, 2026', true, '']);
    assert.deepEqual(v.aligned!.pips, ['behind', 'behind', 'behind', 'behind', 'open', '', '', 'race'], 'four weeks behind, the opening week, two more, race week');
    assert.equal(v.rows.find((r) => r.k === 'Cardio')!.v, asyIcon('🏃', 15) + ' Run: Run a 5K');
    assert.equal(v.rows.find((r) => r.k === 'Program length')!.v, '8 weeks');
    assert.equal(v.rows.find((r) => r.k === 'Lifting')!.v, 'Strength Support');
    const later = nameView(memoryStore(), draft({ name: 'R', primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-12-05' }), NOW);
    assert.deepEqual([later.aligned!.warn, later.aligned!.pips], [false, null], 'a plan that starts later draws no pips');
  });
  test('a line of markup is cut into runs: words, bold, the shorter plan\'s link, an icon', () => {
    assert.deepEqual(copyRuns('a <b>b</b> c'), [{ icon: null, text: 'a ', bold: false, link: null }, { icon: null, text: 'b', bold: true, link: null }, { icon: null, text: ' c', bold: false, link: null }]);
    assert.deepEqual(copyRuns('The <a onclick="offerShorterPlan(\'run_5k\')">5K plan</a> fits'), [{ icon: null, text: 'The ', bold: false, link: null }, { icon: null, text: '5K plan', bold: false, link: 'run_5k' }, { icon: null, text: ' fits', bold: false, link: null }]);
    assert.deepEqual(copyRuns(asyIcon('flag', 14) + ' x'), [{ icon: asyIcon('flag', 14), text: '', bold: false, link: null }, { icon: null, text: ' x', bold: false, link: null }]);
    assert.deepEqual(copyRuns('<span id="sumStartDate">Mon, Aug 31, 2026</span>'), [{ icon: null, text: 'Mon, Aug 31, 2026', bold: false, link: null }]);
  });
});

describe('native wizard: Generate', () => {
  test('the swim times: a 500 goal needs its 500, a 100 goal both, in real minutes and seconds, the 500 no faster than the 100', () => {
    assert.deepEqual(swimEntryState({ id: 'swim_base' }), { ok: true });
    assert.deepEqual(swimEntryState(undefined), { ok: true });
    assert.deepEqual(swimEntryState({ id: 'swim_500_time' }), { ok: false, blank: true, msg: 'Required. Enter your most recent timed 500yd.' });
    assert.deepEqual(swimEntryState({ id: 'swim_500_time', swimUnit: 'm' }), { ok: false, blank: true, msg: 'Required. Enter your most recent timed 500m.' });
    assert.deepEqual(swimEntryState({ id: 'swim_500_time', baseMins: '10', baseSecs: '30' }), { ok: true });
    assert.deepEqual(swimEntryState({ id: 'swim_500_time', baseMins: '1', baseSecs: '75' }), { ok: false, msg: 'That is not a real time. Check the minutes and seconds.' });
    assert.deepEqual(swimEntryState({ id: 'swim_500_time', baseMins: '9', baseSecs: '60' }), { ok: false, msg: 'That is not a real time. Check the minutes and seconds.' }, 'sixty seconds is not a count of seconds');
    assert.deepEqual(swimEntryState({ id: 'swim_500_time', baseMins: '9', baseSecs: '59' }), { ok: true });
    assert.deepEqual(swimEntryState({ id: 'swim_500_time', baseMins: '60', baseSecs: '0' }), { ok: true }, 'sixty minutes is');
    // A 500 in 10:00 is 2:00 a hundred: level with a 100 in 2:00, which passes; a second faster does not.
    assert.deepEqual(swimEntryState({ id: 'swim_100_time', baseMins: '2', baseSecs: '0', base500Mins: '10', base500Secs: '0' }), { ok: true });
    assert.equal(swimEntryState({ id: 'swim_100_time', baseMins: '2', baseSecs: '0', base500Mins: '9', base500Secs: '59' }).ok, false);
    assert.deepEqual(swimEntryState({ id: 'swim_100_time', base500Mins: '10', base500Secs: '30' }), { ok: false, blank: true, msg: 'Required. Enter your most recent timed 100yd.' });
    assert.deepEqual(swimEntryState({ id: 'swim_100_time', baseMins: '1', baseSecs: '50' }), { ok: false, blank: true, msg: 'Required. Enter your most recent timed 500yd.' });
    // A 500 in 9:00 is 1:48 a hundred, faster than a 100 in 2:30.
    assert.deepEqual(swimEntryState({ id: 'swim_100_time', baseMins: '2', baseSecs: '30', base500Mins: '9', base500Secs: '0' }), { ok: false, msg: 'Your 500 pace is faster than your 100 time. Check both entries.' });
    assert.deepEqual(swimEntryState({ id: 'swim_100_time', baseMins: '1', baseSecs: '40', base500Mins: '9', base500Secs: '0' }), { ok: true });
  });
  test('the mile is checked before the swim, and a draft with neither goes through', () => {
    assert.equal(refusal(draft()), null);
    const both = draft({ cardioTypes: ['run', 'swim'], cardioGoals: { run: { id: 'run_base', mileBestMins: '2', mileBestSecs: '30' }, swim: { id: 'swim_500_time' } } });
    assert.equal(refusal(both), 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.');
    both.cardioGoals['run'] = { id: 'run_base', mileBestMins: '8', mileBestSecs: '0' };
    assert.equal(refusal(both), 'Required. Enter your most recent timed 500yd.');
    assert.equal(refusal(draft({ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal' } } })), 'Required. Enter your most recent timed mile.');
    assert.equal(refusal(draft({ experience: 'beginner', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal' } } })), null, 'a beginner\'s mile stays optional');
  });
  test('the length\'s pop-up: none for a lift only program, today\'s words for a half marathon', () => {
    assert.equal(lengthWarning(draft()), null);
    assert.deepEqual(lengthWarning(draft({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_half', 'Half Marathon'), raceDate: '2026-12-06' })), { msg: 'Half Marathon plan — 14 weeks, fixed', weeks: 14 });
    assert.deepEqual([LENGTH_WORDS.kicker, LENGTH_WORDS.title(14), LENGTH_WORDS.back, LENGTH_WORDS.build(14)], ['Heads Up', '14-Week Program', 'Go Back', 'Build 14-Week Plan']);
    assert.deepEqual(LENGTH_WORDS.body(14), { before: 'The app will build you a ', bold: '14-week program', after: ' that safely progresses toward your goal. Stick to the plan and you will get there.' });
  });
  test('the generating screen opens: the pins are written on the draft, and the lines name the length that builds', () => {
    const d = draft({ _testWeek: 9, _raceDateCappedWeeks: 9 });
    const b = beginGenerate(d, NOW);
    assert.deepEqual([d._testWeek, d._raceDateCappedWeeks], [null, 6], 'a pin from an earlier try does not survive');
    assert.deepEqual(b, { weeks: 6, first: 'Building your 6-week program...', lines: ['Analyzing your goals...', 'Building cardio progressions...', 'Selecting exercises...', 'Calculating weights...', 'Assembling 6 weeks...', 'Almost done...'] });
    const test4 = draft({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: run('run_pace_goal', 'Hit a Pace / Time Goal', { targetDist: '1.5', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' }), raceDate: '2026-09-19' });
    const t = beginGenerate(test4, NOW);
    assert.deepEqual([test4._testWeek, test4._raceDateCappedWeeks, t.weeks, t.first, t.lines[4]], [4, 4, 4, 'Building your 4-week program...', 'Assembling 4 weeks...'], 'a dated test builds to its test week');
    assert.deepEqual([GENERATING.title, GENERATING.tickMs, GENERATING.buildMs, GENERATING.landMs, GENERATING.ready(1), GENERATING.error('x')], ['Building Your Program', 380, 2400, 600, 'Your 1-week program is ready!', 'Error: x']);
    assert.ok(t.lines.length * GENERATING.tickMs < GENERATING.buildMs, 'all six lines show before the build');
    // A start with nothing left to train moves to Monday 08-31, and the pin counts from there: the week of 09-14 is week 3.
    const moved = { ...test4, restDays: ['sat', 'sun'] };
    beginGenerate(moved, NOW);
    assert.equal(moved._testWeek, 3, 'the pin is taken from the resolved start, not the day entered');
    // A test tomorrow in a week with nothing left to train: the week holds the test, the start stays, and the test week is week 1.
    const held = { ...test4, restDays: ['sat', 'sun'], raceDate: '2026-08-30' };
    assert.deepEqual([beginGenerate(held, NOW).weeks, held._testWeek], [1, 1]);
  });
  test('the start a program is given: counted back from a race, with the day the block opened, or the resolver\'s; the wizard\'s field leaves the stored config', () => {
    const race = { id: 'p', totalWeeks: 8, cfg: { startDate: '2026-08-29', name: 'R' } as Record<string, unknown> };
    applyWizardStart(race, draft({ primaryPath: 'both', cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-09-19' }), NOW);
    assert.deepEqual(race, { id: 'p', totalWeeks: 8, cfg: { name: 'R' }, startDate: '2026-07-27', blockOpen: '2026-08-29' });
    const plain = { id: 'q', totalWeeks: 6, cfg: { startDate: '2026-08-29' } as Record<string, unknown> };
    applyWizardStart(plain, draft({ restDays: ['sat', 'sun'] }), NOW);
    assert.deepEqual(plain, { id: 'q', totalWeeks: 6, cfg: {}, startDate: '2026-08-31' }, 'a start with nothing left to train that week is the next Monday');
    const body: { id: string; totalWeeks: number; cfg: Record<string, unknown>; startDate?: string } = { id: 'r', totalWeeks: 6, cfg: {} };
    applyWizardStart(body, draft({ primaryPath: 'body', cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-09-19' }), NOW);
    assert.equal(body.startDate, '2026-07-27', 'the start is counted back whatever the path, as today\'s is (only the name step asks the path)');
    // A race date left in a draft that asks for none (Just building fitness): no race to count back from, the resolver's start.
    const none: { id: string; totalWeeks: number; cfg: Record<string, unknown>; startDate?: string; blockOpen?: string } = { id: 's', totalWeeks: 8, cfg: {} };
    applyWizardStart(none, draft({ primaryPath: 'event', eventTargeted: false, cardioTypes: ['run'], cardioGoals: run('run_5k', 'Run a 5K'), raceDate: '2026-09-19' }), NOW);
    assert.deepEqual([none.startDate, none.blockOpen], ['2026-08-29', undefined]);
  });
  test('the build stores the program last in the list and makes it the active one, writing two keys', () => {
    const store = memoryStore({ ia_programs: JSON.stringify([{ id: 'old', name: 'Old', cfg: {}, weeks: {} }]), ia_active: 'old', ia_logs_old: '{"w1_mon":{"ts":1}}' });
    const before = Object.fromEntries(store.keys().map((k) => [k, store.get(k)]));
    const d = draft({ name: 'New block' });
    beginGenerate(d, NOW);
    const out = atInstant(NOW.getTime(), () => finishGenerate(store, d, NOW.getTime(), report));
    const list = JSON.parse(store.get('ia_programs')!) as { id: string; name: string; startDate: string; totalWeeks: number; cfg: Record<string, unknown> }[];
    assert.deepEqual(list.map((p) => p.name), ['Old', 'New block']);
    assert.equal(list[1]!.id, 'prog_' + NOW.getTime(), 'the id is the instant it was built');
    assert.equal(store.get('ia_active'), list[1]!.id);
    assert.deepEqual([out.prog.id, out.ready, list[1]!.totalWeeks, list[1]!.startDate], [list[1]!.id, 'Your 6-week program is ready!', 6, '2026-08-29']);
    assert.equal('startDate' in list[1]!.cfg, false, 'the wizard\'s start is not in the stored config');
    assert.deepEqual([list[1]!.cfg['_testWeek'], list[1]!.cfg['_raceDateCappedWeeks']], [null, 6]);
    assert.equal(JSON.stringify(list[0]), JSON.stringify(JSON.parse(before['ia_programs']!)[0]), 'the program already stored is as it was');
    assert.deepEqual(store.keys().sort(), ['ia_active', 'ia_logs_old', 'ia_programs']);
    assert.equal(store.get('ia_logs_old'), before['ia_logs_old']);
    assert.deepEqual(told, []);
  });
  test('a build that throws stores nothing', () => {
    const store = memoryStore({ ia_programs: '[]' });
    const broken = draft({ restDays: null as unknown as string[] });
    assert.throws(() => finishGenerate(store, broken, NOW.getTime(), report));
    assert.deepEqual([store.get('ia_programs'), store.get('ia_active')], ['[]', null]);
  });
  test('This Week lands on the title holding today when that is week 1, and on the first title when today is a later week', () => {
    const today = new Date(2026, 7, 29);
    assert.deepEqual(landingTitle({ startDate: '2026-08-29', totalWeeks: 6 } as never, today), { own: 1, pick: null });
    assert.deepEqual(landingTitle({ startDate: '2026-08-31', totalWeeks: 6 } as never, today), { own: 1, pick: null }, 'a start still to come is week 1');
    assert.deepEqual(landingTitle({ startDate: '2026-07-27', totalWeeks: 8 } as never, today), { own: 1, pick: 1 }, 'a race plan opened in week 5 lands on its first title');
  });
});

describe('native wizard: the generating figure', () => {
  test('one squat every 1.5 s: standing, down 11 at the half, standing again', () => {
    assert.deepEqual([FIGURE.periodMs, FIGURE.size, FIGURE.box], [1500, 48, 64]);
    assert.deepEqual([figureAt(0).dy, figureAt(0).left, figureAt(0).right], [0, 'M32 36 L26 46 L24 56', 'M32 36 L38 46 L40 56']);
    assert.deepEqual([figureAt(750).dy, figureAt(750).left, figureAt(750).right], [11, 'M32 47 L20 49 L24 57', 'M32 47 L44 49 L40 57']);
    assert.deepEqual(figureAt(1500), figureAt(0));
    assert.deepEqual(figureAt(2250), figureAt(750));
    assert.equal(figureAt(375).dy, 5.5, 'half way down at the quarter: the ease is even about its middle');
    assert.ok(figureAt(100).dy < figureAt(200).dy && figureAt(900).dy > figureAt(1000).dy, 'down, then up');
    // An even speed would be a quarter of the way down (2.75) an eighth of the way through; the page's ease is well short of it there, and as far past it at three eighths.
    assert.ok(figureAt(187.5).dy > 0 && figureAt(187.5).dy < 2, 'slow off the top: ' + figureAt(187.5).dy);
    assert.ok(figureAt(562.5).dy > 9 && figureAt(562.5).dy < 11, 'and slow into the bottom: ' + figureAt(562.5).dy);
  });
  test('the ease is the page\'s spline, and a value moves straight between its key times', () => {
    assert.ok(Math.abs(ease(0)) < 1e-6 && Math.abs(ease(1) - 1) < 1e-6 && Math.abs(ease(0.5) - 0.5) < 1e-6);
    assert.ok(ease(0.25) < 0.25 && ease(0.75) > 0.75, 'slow at both ends');
    assert.equal(along(0.25, [0, 0.5, 1], [0, 10, 0]), 5);
    assert.equal(along(0.75, [0, 0.5, 1], [0, 10, 0]), 5);
    assert.equal(along(1, [0, 0.5, 1], [0, 10, 4]), 4);
  });
  test('the sparks leave the bar on the way up: unseen through the way down, whole at 0.6 and 0.65 of the squat, gone by its end', () => {
    for (const ms of [0, 300, 750]) assert.deepEqual(figureAt(ms).sparks.map((k) => k.opacity), [0, 0], 'at ' + ms);
    const a = figureAt(900).sparks[0]!, b = figureAt(975).sparks[1]!;
    assert.ok(Math.abs(a.opacity - 1) < 1e-9 && Math.abs(b.opacity - 1) < 1e-9);
    assert.deepEqual([figureAt(0).sparks[0]!.cx, figureAt(0).sparks[0]!.cy, figureAt(0).sparks[0]!.r, figureAt(0).sparks[1]!.cx, figureAt(0).sparks[1]!.cy, figureAt(0).sparks[1]!.r], [40, 24, 1.3, 24, 24, 1.1]);
    assert.deepEqual(figureAt(1400).sparks.map((k) => [k.cx, k.cy, k.opacity]), [[44, 31, 0], [20, 30, 0]], 'out and down, and gone');
  });
});

describe('native wizard: the screens\' words and wiring', () => {
  const wizard = strip(read('wizard/Wizard.tsx')), generating = strip(read('wizard/Generating.tsx')), app = strip(read('App.tsx')), week = strip(read('this-week/ThisWeek.tsx'));
  test('each step\'s own words are today\'s', () => {
    assert.deepEqual(WIZARD_WORDS.primary, { title: 'What are you training for?', subtitle: 'This shapes everything! Program length, lifting focus, and cardio structure.' });
    assert.deepEqual([WIZARD_WORDS.back, WIZARD_WORDS.profile.title, WIZARD_WORDS.equipment.title, WIZARD_WORDS.cardio.title, WIZARD_WORDS.lifting.title, WIZARD_WORDS.days.title, WIZARD_WORDS.name.title],
      ['← Back', 'About you', 'Your equipment', 'Cardio goals', 'Lifting focus', 'Rest days', 'Name your program']);
    assert.deepEqual([WIZARD_WORDS.lifting.addOn, WIZARD_WORDS.lifting.liftOnly, WIZARD_WORDS.name.derived, WIZARD_WORDS.name.summary, WIZARD_WORDS.days.lockTitle], ['Optional cardio add-on', 'Lift Only', 'set by race date', 'Program Summary', ' You\'re at your minimum training days']);
    assert.equal(WIZARD_WORDS.days.floorThree, 'Three days a week is the floor, cardio or no cardio. Two gives you the same session twice with nowhere to put the hard work. Three is where real training days start.');
  });
  test('no screen of the wizard, and neither its readers nor its taps, names a writer of the store: every write is wizard-writes.ts\'s', () => {
    for (const [name, text] of [['Wizard.tsx', wizard], ['Generating.tsx', generating], ['wizard-screen.ts', strip(read('wizard/wizard-screen.ts'))], ['wizard-readers.ts', strip(read('wizard/wizard-readers.ts'))], ['generating-figure.ts', strip(read('wizard/generating-figure.ts'))]] as const) {
      assert.doesNotMatch(text, /writePrograms|writeActiveProgramId|store\.set\(|store\.remove\(|refreshStoredProgram|loadActive\(/, name + ' writes nothing itself');
    }
    const writes = strip(read('wizard/wizard-writes.ts'));
    assert.equal((writes.match(/writePrograms\(/g) || []).length, 1, 'one write of the list');
    assert.equal((writes.match(/loadActive\(/g) || []).length, 1, 'one switch, the list\'s own');
    assert.doesNotMatch(writes, /store\.set\(|store\.remove\(/);
  });
  test('the screen draws a step when a tap asks, and a start date\'s pick repaints two lines alone', () => {
    assert.ok(wizard.includes('const render = (): void => { draws.current++; setDrawn(wizardView(store, st, new Date())); };'), 'a whole draw, counted so the number fields are made again');
    assert.match(wizard, /const repaint = \(lines: \(was: CardioPaint\) => CardioPaint\): void => \{\s*const d = cur\.current;\s*if \(d\.view\.step !== 'cardio_goal'\) return;\s*const now = \{ shell: d\.shell, view: \{ \.\.\.d\.view, paint: lines\(d\.view\.paint\) \} \};\s*cur\.current = now;\s*setDrawn\(now\);\s*\};/, 'a repaint in place keeps the step as it stood and replaces the lines alone');
    assert.ok(wizard.includes("const picked = (iso: string): void => { setStart(st, iso); setDrawn((d) => (d.view.step === 'name' ? { shell: d.shell, view: { step: 'name', name: repaintStart(st, d.view.name, new Date()) } } : d)); };"));
    assert.ok(wizard.includes("onPress={() => onDate({ value: st.draft.startDate || '', min: null, onChange: picked })}"), 'the field opens the app\'s calendar on the draft\'s day, with no earliest day');
    assert.ok(wizard.includes('<TextInput testID="wizard-name" defaultValue={n.name} onChangeText={(t) => setName(st, t)} maxLength={40}'), 'the name is typed into the draft, forty letters at most, and draws nothing');
  });
  test('a rest day\'s toast carries its mark; Back on the first step closes; the last button asks the length first', () => {
    assert.ok(wizard.includes('const toast = (t: FloorToast | null): void => { if (t) say(t.text, t.icon ?? undefined); };'));
    assert.ok(wizard.includes('onPress={() => { toast(toggleRestDay(st, x.key)); render(); }}'));
    assert.ok(wizard.includes('const back = (): void => { if (wizardBack(st)) onClose(); else render(); };'));
    assert.match(wizard, /const next = \(\): void => \{\s*if \(!wizardNext\(st\)\) \{ render\(\); return; \}\s*const w = lengthWarning\(st\.draft\);\s*if \(w\) setWarn\(w\); else go\(\);\s*\};/);
    assert.match(wizard, /const go = \(\): void => \{\s*const no = refusal\(st\.draft\);\s*if \(no !== null\) \{ say\(no\); render\(\); return; \}\s*const b = beginGenerate\(st\.draft, new Date\(\)\);/);
    assert.ok(wizard.includes('onPress={() => { setWarn(null); render(); }}') && wizard.includes('onPress={() => { setWarn(null); go(); }}'), 'Go Back draws the wizard again; Build goes on');
  });
  test('a sport\'s header, a goal, a unit, a race button, the seed\'s buttons and the shorter plan\'s link each take a press and draw the step whole; a typed field and a race day repaint in place', () => {
    assert.ok(wizard.includes("<Pressable testID={'wizard-sport-tap-' + sp.id} accessibilityRole=\"button\" accessibilityState={{ expanded: sp.sel }} onPress={() => { toggleCardioTypeSport(st, sp.id); render(); }}"));
    for (const press of ["onPress={() => { setCardioGoal(st, sp.id, g.id); render(); }}", 'onPress={() => { set(u); render(); }}', 'onPress={() => { raceTargeted(st, targeted, new Date()); render(); }}', 'onPress={() => { applySeedData(st); render(); }}',
      'onPress={() => { dismissSeedData(st); render(); }}', 'const shorter = (goal: string): void => { toast(offerShorterPlan(st, goal)); render(); };', "(u) => setSwimUnit(st, u))}", "(u) => setPaceUnit(st, u))}"]) assert.equal(wizard.split(press).length - 1, 1, press);
    assert.ok(wizard.includes('const typed = (field: CardioField, sport: string, key: string) => (val: string): void => repaint((was) => editCardioField(st, was, field, sport, key, val, new Date()));'));
    assert.ok(wizard.includes("onPress={() => onDate({ value: pt.raceField || '', min: race.min, reset: race.value, onChange: (iso) => repaint((was) => setRaceDate(st, was, iso, new Date())) })}"), 'the race date opens the calendar on the field\'s day, with the day it was drawn with for Reset');
  });
  test('the generating screen keeps the page\'s times and shows a failed build\'s words', () => {
    assert.ok(generating.includes('const tick = setInterval(() => { if (i < lines.length) setLine(lines[i++]!); }, GENERATING.tickMs);'));
    assert.match(generating, /const built = setTimeout\(\(\) => \{\s*clearInterval\(tick\);/);
    assert.ok(generating.includes('}, GENERATING.buildMs);') && generating.includes('land = setTimeout(() => calls.current.onLand(), GENERATING.landMs);'));
    assert.ok(generating.includes("setLine(GENERATING.error(err instanceof Error ? err.message : String(err)));\n        return;"), 'an error stays on the screen, and nothing lands');
    assert.ok(wizard.includes('build={() => { const r = finishGenerate(store, st.draft, Date.now(), report); done.current = r.prog; return r.ready; }}'));
    assert.ok(wizard.includes('onLand={() => { if (done.current) onDone(done.current); }} />'), 'the program built is handed to the app when the screen lands');
    assert.match(generating, /\}\n\s*setLine\(ready\);\n\s*land = setTimeout/, 'the ready line stands before the landing is timed');
  });
  test('the screen draws every line a step holds, from the step\'s view', () => {
    const lines: [string, string][] = [
      // The bar and the last button.
      ['Back\'s words', '<Text style={[s.backText, { color: p.text }]}>{W.back}</Text>'],
      ['the bar\'s fill', "width: drawn.shell.fill as `${number}%` }]} />"],
      ['the count', '<Text testID="wizard-count" style={[s.count, { color: p.muted }]}>{drawn.shell.label}</Text>'],
      ['the last button\'s words', '<Text style={[s.nextText, { color: p.onInk }]}>{drawn.shell.next}</Text>'],
      ['Back\'s press', '<Pressable testID="wizard-back" accessibilityRole="button" onPress={back}'],
      ['the last button\'s press', '<Pressable testID="wizard-next" accessibilityRole="button" onPress={next}'],
      // Each step's title and the line under it.
      ['the path step\'s title', '{title(W.primary.title, W.primary.subtitle)}'], ['About you\'s title', '{title(W.profile.title, W.profile.subtitle)}'], ['the equipment\'s title', '{title(W.equipment.title, W.equipment.subtitle)}'],
      ['the cardio goals\' title', '{title(W.cardio.title, W.cardio.subtitle)}'], ['the lifting focus\'s title, and the path\'s line under it', '{title(W.lifting.title, l.subtitle)}'], ['the rest days\' title', '{title(W.days.title, W.days.subtitle)}'],
      ['the name step\'s title', '{title(W.name.title, W.name.subtitle)}'],
      ['a title\'s words', '<Text accessibilityRole="header" style={[s.title, { fontSize: titleSize, lineHeight: titleLine(titleSize), color: p.text }]}>{t}</Text>'], ['the line under a title', '<Text style={[s.subtitle, { color: p.muted }]}>{sub}</Text>'],
      // A card with its icon beside its words.
      ['a card\'s icon', '<View style={s.noShrink}><Icon name={c.icon} size={icon} color={p.text} /></View>'], ['a card\'s name, in the ink when chosen', '<Text style={[s.optionLabel, { color: c.sel ? p.accent : p.text }]}>{c.label}</Text>'],
      ['a card\'s line', '<Text style={[s.optionDesc, { color: p.muted }]}>{unbroken(c.desc)}</Text>'], ['a path card\'s second line', '{c.detail ? <Text style={[s.optionDetail, { color: p.muted }]}>{unbroken(c.detail)}</Text> : null}'],
      ['a chosen card\'s edge and ground', "const sel = { borderColor: p.accent, backgroundColor: 'rgba(' + p.inkRgb + ',0.18)' };"],
      ['the paths', "v.choices.map((c) => optionRow(c, 'wizard-path-' + c.id, 30, s.optionWide, () => { setChoice(st, 'primaryPath', c.id); render(); }))"],
      // About you.
      ['the experiences', "f.experience.map((c) => optionRow(c, 'wizard-exp-' + c.id, 26, s.optionExp, () => { setChoice(st, 'experience', c.id); render(); }))"],
      ['an age\'s press', "onPress={() => { setChoice(st, 'ageBracket', a.id); render(); }}"], ['an age\'s icon', '<View style={s.ageIcon}><Icon name={a.icon} size={24} color={p.text} /></View>'],
      ['an age\'s name', '<Text style={[s.optionLabel, { color: a.sel ? p.accent : p.text }]}>{a.label}</Text>'],
      ['the three labels', '{W.profile.experience}</Text>'], ['the age label', '{W.profile.age}</Text>'], ['the units label', '{W.profile.units}</Text>'],
      ['the two units, the chosen one filled', "{unit('lbs', W.profile.lbs, !f.kg)}{unit('kg', W.profile.kg, f.kg)}"], ['a unit\'s press', 'onPress={() => { setUnit(st, id); render(); }}'],
      ['the experience\'s hint', "<Text style={[s.bold, { color: p.accent }]}>{W.profile.expLabel}</Text>{' ' + f.expHint}</Text>"], ['the age\'s hint', "<Text style={[s.bold, { color: p.accent }]}>{f.ageLabel}</Text>{' ' + f.ageHint}</Text>"],
      // The equipment, and the add-on's rows.
      ['the equipments', "v.choices.map((e) => typeCard('wizard-equipment-' + e.id, e.sel, e.icon, 26, e.label, e.desc, false, () => { setChoice(st, 'equipment', e.id); render(); }))"],
      ['a row card\'s name', '<Text style={[s.typeName, small && s.typeNameSmall, { color: on ? p.accent : p.text }]}>{name}</Text>'], ['a row card\'s line', '{desc !== null && <Text style={[s.typeDesc, { color: p.muted }]}>{unbroken(desc)}</Text>}'],
      ['a row card\'s check, seen when chosen', '<Text style={[s.check, { color: p.accent, opacity: on ? 1 : 0 }]}>✓</Text>'],
      // The cardio goals.
      ['a sport\'s name', '<Text style={[s.sportName, { color: sp.sel ? p.accent : p.text }]}>{sp.name}</Text>'], ['a sport\'s line', '<Text style={[s.sportDesc, { color: p.muted }]}>{sp.desc}</Text>'],
      ['a sport\'s check', '<Text style={[s.sportCheck, { color: p.accent, opacity: sp.sel ? 1 : 0 }]}>✓</Text>'], ['a sport\'s icon', '<Icon name={sp.icon} size={24} color={p.text} />'],
      ['an open sport\'s goals', '{sp.sel && ('], ['a goal\'s name', '<Text style={[s.optionLabel, { color: g.sel ? p.accent : p.text }]}>{g.label}</Text>'], ['a goal\'s line', '<Text style={[s.optionDesc, { color: p.muted }]}>{g.desc}</Text>'],
      // The lifting focus.
      ['the focuses', "l.choices.map((c) => optionRow(c, 'wizard-focus-' + c.id, 28, s.optionWide, () => { setChoice(st, 'liftingFocus', c.id); render(); }))"],
      ['the add-on, on the strength path alone', '{l.addOn && ('], ['the add-on\'s heading', '{W.lifting.addOn}</Text>'],
      ['the add-on\'s sports', "l.addOn.sports.map((t) => typeCard('wizard-add-' + t.id, t.sel, t.icon, 22, t.label, null, true, () => { toggleCardioTypeSport(st, t.id); render(); }))"],
      ['Lift Only', "{typeCard('wizard-lift-only', l.addOn.liftOnly, 'dumbbell', 22, W.lifting.liftOnly, null, true, () => { liftOnly(st); render(); })}"],
      // The rest days.
      ['a day\'s name', '{x.short}</Text>'], ['a resting day\'s mark', "{x.rest ? <Text style={[s.dayMark, { color: 'rgba(' + p.inkRgb + ',0.2)', opacity: 0.5 }]}>✕</Text>"],
      ['a locked day\'s lock', ': x.blocked ? <View style={[s.dayLock, { opacity: 0.6 }]}><Icon name="🔒" size={10} color={p.muted} /></View> : null}'], ['a locked day is dimmed', 'opacity: x.blocked ? 0.5 : 1 }]}>'],
      ['the count of training days', '{W.days.legend}<Text style={[s.bold, { color: p.text }]}>{d.count}</Text>{W.days.selected}</Text>'],
      ['the floor\'s box', '{f && ('], ['the floor\'s heading', '<View style={s.floorIcon}><Icon name="🔒" size={13} color={p.accent} /></View><Text style={[s.floorTitle, { color: p.accent }]}>{W.days.lockTitle}</Text>'],
      ['the floor\'s words, a goal named', '{W.days.floorGoal.before}<Text style={s.bold}>{f.reason}</Text>{W.days.floorGoal.mid}<Text style={s.bold}>{f.min + W.days.floorGoal.days}</Text>{W.days.floorGoal.after}</Text>'],
      ['the floor\'s words, three days', ': <Text style={[s.floorText, { color: p.text }]}>{W.days.floorThree}</Text>}'],
      ['the advisories', '{d.advisories.map((a, i) => iconLine(a, 14, p.accent, [s.advisory, { color: p.accent }], s.bold, s.left, String(i)))}'],
      // The name step.
      ['the name\'s label', '{W.name.nameLabel}</Text>'], ['a start set by a race: its day', '<Text style={[s.fieldText, s.derivedText, { color: p.text }]}>{n.aligned.start}</Text>'], ['a start set by a race: where it comes from', '<Text style={[s.src, { color: p.muted }]}>{W.name.derived}</Text>'],
      ['a start set by a race: its copy, in signal under the floor', '{copy(n.aligned.copy, [s.resolve, { color: n.aligned.warn ? p.signal : p.muted }], [s.resolveBold, { color: p.text }])}'],
      ['the pips, only when the plan has opened', '{n.aligned.pips && ('],
      ['the pips, each in its kind\'s colour', "backgroundColor: c === 'behind' ? p.border2 : c === 'open' ? p.signal : c === 'race' ? p.text : p.surface3 }]} />"],
      ['the start date\'s field', "<Text style={[s.fieldText, s.dateText, { color: p.text }]}>{dateFieldText(n.startDate) || ' '}</Text>"], ['the sentence under the field', '{copy(n.resolveCopy, [s.resolve, { color: p.muted }], [s.resolveBold, { color: p.text }])}'],
      ['the summary\'s heading', '{W.name.summary}</Text>'], ['a row\'s key', '<Text style={[s.rowKey, { color: p.muted }]}>{r.k}</Text>'], ['a row\'s value', '{iconLine(r.v, 15, p.text, [s.rowVal, { color: p.text }], s.bold, s.right)}'],
      ['which start the step shows', '{n.aligned ? ('], ['the start\'s label', '{W.name.startLabel}</Text>'],
      // A line of markup.
      ['a wrapping line\'s link', "? <Text key={i} testID={'wizard-shorter-' + r.link} accessibilityRole=\"link\" onPress={() => shorter(r.link!)} style={[s.link, { color: p.text }]}>{r.text}</Text>"],
      ['a wrapping line\'s bold runs', ': <Text key={i} style={r.bold && bold}>{r.text}</Text>))}'],
      // The cardio goals' forms.
      ['a goal\'s form', '{sp.form && form(sp.id, sp.form)}'], ['a pair\'s minutes', "{num(pair.field, sport, pair.minsKey, pair.mins, 'min', s.center)}<Text style={[s.caption, { color: p.muted }]}>minutes</Text>"],
      ['a pair\'s seconds', "{num(pair.field, sport, pair.secsKey, pair.secs, 'sec', s.center)}<Text style={[s.caption, { color: p.muted }]}>seconds</Text>"],
      ['the swim\'s current time', "{num('swimBase', 'swim', minsKey, mins, 'min', [s.grow, s.center])}{colon(false)}{num('swimBase', 'swim', secsKey, secs, 'sec', [s.grow, s.center])}"],
      ['a unit, filled when chosen', '{ backgroundColor: on === u ? p.accent : p.surface2 }]}>'], ['a unit\'s word', '<Text style={[s.unitBtnText, { color: on === u ? p.onInk : p.muted }]}>{u}</Text>'],
      ['an advisory, in signal when it refuses', "? <Text testID={id} style={[s.advisoryLine, { color: a.color === 'var(--signal)' ? p.signal : p.muted }]}>{a.text}</Text> : null);"],
      ['a pace line', "const paceLine = (id: string, html: string | null) => (html ? iconLine(html, 13, p.accent, [s.paceLine, { color: p.accent }], s.bold, [s.left, s.mt6], id) : null);"],
      ['a framed line\'s colour', "const col = f.hue === 'red' ? p.red : f.hue === 'signal' ? p.signal : f.hue === 'run' ? p.run : p.accent;"],
      ['a framed line\'s words', '{f.card ? copy(f.body, [s.frameText, { color: col }], s.bold) : iconLine(f.body, 13, col, [s.frameLine, { color: col }], s.bold, s.left)}'],
      ['the reach sentence', '{f.reach !== null && <Text style={[s.frameText, s.mt5, { color: col }]}>{f.reach}</Text>}'],
      ['the seed\'s applied line', "? iconLine(asyIcon('chart', 12) + ' Estimated from “' + sd.prog + '”. Edit if you know better.', 12, p.muted, [s.seedApplied, { color: p.muted }], s.bold, [s.left, s.seedAppliedRow], 'seed')"],
      ['the seed offer\'s heading', "{iconLine(asyIcon('chart', 13) + ' Seed from “' + sd.prog + '”?', 13, p.text, [s.seedHead, { color: p.text }], s.bold, [s.left, s.mb4])}"],
      ['what the seed found', '<Text style={[s.seedFound, { color: p.muted }]}>{sd.found}</Text>'], ['Use this data', '>Use this data</Text>'], ['Start fresh', '>Start fresh</Text>'],
      ['the mile\'s label and its help', "<Text style={[s.inputLabel, { color: p.muted }]}>{'Current mile time '}<Text style={s.plain}>{m.help}</Text></Text>"], ['the mile\'s pair', "{captioned(m.pair, 'run')}"],
      ['the mile\'s advisory', "{advisory('wizard-mile-advisory', pt.mileAdvisory)}"],
      ['the swim distance\'s label', "{label6('Distance')}"], ['the swim distance', '{String(f.dist)}</Text>'], ['yd and m', "{unitPair('swim-unit', 'yd', 'm', f.unit, (u) => setSwimUnit(st, u))}"],
      ['the swim target and its pace', "{label6('Target time')}{captioned(f.target, 'swim')}{paceLine('wizard-swim-pace', pt.swimPace)}"],
      ['the swim\'s current time and its advisory', "{label6(f.baseLabel)}{flat(f.baseMins, f.baseSecs, 'baseMins', 'baseSecs')}{advisory('wizard-swim-advisory', pt.swimAdvisory)}"],
      ['the 500 row, on the 100 goal alone', '{f.base500 && ('], ['the 500 row\'s label', '{label6(f.base500.label)}'], ['the 500 row\'s note', '>Your repeats key off your 500 pace. Your 100 time sets the goal.</Text>'],
      ['the 500 row\'s time', "{flat(f.base500.mins, f.base500.secs, 'base500Mins', 'base500Secs')}"],
      ['the target distance\'s label', "{label6('Target distance')}"], ['the target distance', "{num('runDist', 'run', 'targetDist', f.dist, 'e.g. 1.5', [s.grow, s.joinedField])}"], ['mi and km', "{unitPair('pace-unit', 'mi', 'km', f.unit, (u) => setPaceUnit(st, u))}"],
      ['the run target, its pace and its reach', "{label6('Target time')}{captioned(f.target, 'run')}{paceLine('wizard-pace', pt.pace)}{framed('wizard-reach', pt.feas)}"],
      ['the pace goal\'s baseline question', '>How far can you currently run? (optional)</Text>'],
      ['the pace goal\'s baseline', "{num('paceBaseline', 'run', 'baselineDist', f.baseline, 'e.g. 1.5', s.grow)}<Text style={[s.unitWord, { color: p.muted }]}>{f.unit}</Text>"], ['the pace goal\'s mile', '{mileBlock(f.mile)}'],
      ['a baseline\'s question', "{f.question + ' (optional)'}</Text>"], ['a baseline', "{num('baseline', sport, 'baselineDist', f.baseline, f.placeholder, s.grow)}<Text style={[s.unitWord, { color: p.muted }]}>{f.unitWord}</Text>"],
      ['a run goal\'s mile', '{f.mile && mileBlock(f.mile)}'], ['the seed banner', '{seedBanner(f.seed)}'],
      // The box under the cards.
      ['the box, only with a goal held', '{ft && ('],
      ['the program length, and the line for more than one sport', "{copy((pt.progLen || '') + (ft.multi ? '\\nSessions rotate across training days. Each sport gets its own days.' : ''), [s.lengthLine, { color: p.muted }], [s.bold, { color: p.accent }])}"],
      ['the race date, on the race path alone', '{race && ('], ['the two race buttons', "{raceBtn(race.targeted, true, '✓ I have a race date')}{raceBtn(!race.targeted, false, '✕ Just building fitness')}"],
      ['a race button, filled when chosen', "style={[s.raceBtn, { backgroundColor: on ? p.accent : 'transparent' }]}>"], ['a race button\'s words', '<Text style={[s.raceBtnText, { color: on ? p.onInk : p.muted }]}>{words}</Text>'],
      ['the date field or the copy', '{race.targeted ? ('], ['the race date\'s day', "<Text style={[s.raceFieldText, { color: p.text }]}>{dateFieldText(pt.raceField || '') || ' '}</Text>"],
      ['the card under the race date', "<View style={s.mt8}>{framed('wizard-race-card', pt.card)}</View>"], ['the note under it', '>Tap to open the calendar. The final weeks taper so you arrive fresh.</Text>'],
      ['the copy with no race date', '{race.copy}</Text>'], ['the two Race date labels', '>Race date</Text>'],
      ['a line\'s icons', "? <SvgXml key={i} xml={r.icon.replace(/ style=\"[^\"]*\"/, '')} color={color} width={size} height={size} />"], ['a line\'s words', ': <Text key={i} style={[style, r.bold && bold]}>{r.text}</Text>))}'],
      // The pop-up.
      ['the pop-up\'s kicker', '{LENGTH_WORDS.kicker}</Text>'], ['the pop-up\'s title', '{LENGTH_WORDS.title(warn.weeks)}</Text>'],
      ['the pop-up\'s words', "{warn.msg + '\\n\\n' + LENGTH_WORDS.body(warn.weeks).before}<Text style={[s.bold, { color: p.text }]}>{LENGTH_WORDS.body(warn.weeks).bold}</Text>{LENGTH_WORDS.body(warn.weeks).after}"],
      ['Go Back\'s words', '{LENGTH_WORDS.back}</Text>'], ['Build\'s words', '{LENGTH_WORDS.build(warn.weeks)}</Text>'], ['the pop-up, only when the length warns', '{warn && ('], ['the generating screen, only once begun', '{gen && ('],
      ['the title\'s size', 'const titleSize = Math.min(28, Math.max(21, width * 0.065));'],
    ];
    // Over the field, and over a start set by a race date; under the pace goal's target and over a run goal's baseline; over the buttons and over the field.
    const twice = new Set(['{W.name.startLabel}</Text>', '{seedBanner(f.seed)}', '>Race date</Text>']);
    for (const [what, text] of lines) assert.equal(wizard.split(text).length - 1, twice.has(text) ? 2 : 1, what + ': ' + text);
    assert.equal(new Set(lines.map((l) => l[1])).size, lines.length, 'each line is looked for once');
    // The generating screen.
    for (const text of ['<Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{GENERATING.title}</Text>', '<Text testID="generating-line" accessibilityLiveRegion="polite" style={[s.sub, { color: p.muted }]}>{line}</Text>',
      "<G transform={'translate(0 ' + f.dy + ')'}>", '<Path d={f.left} />', '<Path d={f.right} />', '{f.sparks.map((k, i) => <Circle key={i} cx={k.cx} cy={k.cy} r={k.r} opacity={k.opacity} />)}', 'const [line, setLine] = useState(first);',
      'const f = figureAt(ms);', 'const step = (at: number): void => { if (start < 0) start = at; setMs(at - start); frame = requestAnimationFrame(step); };', '<G stroke="none" fill={p.signal}>']) assert.ok(generating.includes(text), text);
  });
  test('every line of type stands where WebKit lays it: the face\'s line at its size, and a fractional line height cut down to a whole one', () => {
    // Measured in the simulator's Safari on today's own markup (iOS 26.5), Helvetica Neue with no line height of its
    // own: 9 stands 12, 11 stands 15, 12 stands 16, 13 stands 17, 14 bold 19, 15 stands 20, 16 stands 21, 20 stands 26,
    // 22 bold 28, 24 bold 31. With a line height: 12 at 1.4 is 16 (not 16.8), 11 at 1.5 is 16, 12 at 1.5 is 18, 12 at
    // 1.8 is 21, 13 at 1.5 is 19, 13 at 1.6 is 20, 14 at 1.5 is 21, and a line height of 1 is the size.
    const LINES: Record<string, [number, number]> = {
      backText: [14, 19], count: [11, 15], subtitle: [14, 21], label: [13, 17], optionLabel: [15, 20], optionDesc: [12, 16], optionDetail: [11, 16], unitText: [13, 17], hint: [12, 21],
      typeName: [16, 21], typeNameSmall: [14, 19], typeDesc: [12, 16], check: [16, 21], sportName: [16, 21], sportDesc: [11, 15], sportCheck: [20, 26], addOnHead: [11, 15], dayText: [12, 12], dayMark: [9, 12],
      legend: [12, 16], floorTitle: [13, 19], floorText: [12, 18], advisory: [12, 18], fieldText: [16, 21], src: [12, 16], resolve: [12, 18], summaryHead: [13, 17], rowKey: [12, 16], rowVal: [12, 16], nextText: [16, 21],
      warnKicker: [11, 15], warnTitle: [22, 28], warnBody: [13, 20], warnBtnText: [14, 19],
      // The cardio goals' forms, read beside today's own page in the simulator's Safari: 10 stands 14, 17 bold 22, 20 stands 26, 24 stands 31; 11 at 1.45 is 15 (15.95 cut down) and at 1.5 is 16, 12 at 1.55 and at 1.6 is 19.
      inputLabel: [13, 17], caption: [10, 14], colonBig: [24, 31], colon: [20, 26], unitBtnText: [12, 16], unitWord: [13, 18], advisoryLine: [11, 15], paceLine: [12, 16], note500: [11, 15], frameText: [12, 19], frameLine: [12, 16],
      seedHead: [12, 16], seedFound: [12, 18], seedBtnText: [13, 17], seedApplied: [11, 15], lengthLine: [12, 19], raceLabel: [11, 15], raceBtnText: [12, 16], raceFieldText: [17, 22], raceNote: [11, 16],
    };
    const styles = wizard.slice(wizard.indexOf('const styles = StyleSheet.create({'));
    const typed = [...styles.matchAll(/^  (\w+): \{([^\n]*fontSize: [^\n]*)\},$/gm)];
    assert.deepEqual(typed.map((m) => m[1]).sort(), Object.keys(LINES).sort(), 'every style that sets a size is in the table');
    for (const m of typed) {
      const size = /fontSize: ([\d.]+)/.exec(m[2]!), line = /lineHeight: ([\d.]+)/.exec(m[2]!);
      assert.deepEqual([+size![1]!, line ? +line[1]! : null], LINES[m[1]!], m[1] + ': its size and the line WebKit lays it at');
    }
    assert.ok(styles.includes("  title: { fontFamily: DISPLAY, fontWeight: '700', marginTop: -PX },"), 'the title\'s size and line come from the screen\'s width');
    // iOS lays a text one device pixel taller than its lines (read from the pixels of both apps on the simulator: a
    // card of two texts stood two pixels taller than today's, a card of three texts three). Each text that stacks
    // gives the pixel back in a margin; a text beside a taller thing in its row does not need to.
    assert.ok(wizard.includes('const PX = 1 / PixelRatio.get();'));
    const beside = ['count', 'check', 'sportCheck', 'advisory', 'fieldText', 'src', 'typeNameSmall', 'colonBig', 'colon', 'unitBtnText', 'unitWord', 'paceLine', 'frameLine', 'seedHead', 'seedApplied'];
    for (const m of typed) assert.equal(/-PX| - PX/.test(m[2]!), !beside.includes(m[1]!), m[1] + (beside.includes(m[1]!) ? ' stands beside a taller thing and gives nothing back' : ' gives its pixel back'));
    assert.ok(styles.includes("  dateText: { textAlign: 'center', marginTop: -PX },") && styles.includes('  derivedText: { marginTop: -PX },'), 'the start\'s field and a start set by a race give theirs back too');
    // The title is 6.5% of the width between 21 and 28, bold: 393 wide is 25.545 and stands 32, 402 is 26.13 and 33, 430 is 27.95 and 36.
    assert.deepEqual([21, 22.1, 22.75, 23.4, 24.375, 25.545, 26.13, 26.91, 27.95, 28].map(titleLine), [27, 28, 29, 30, 31, 32, 33, 34, 36, 36]);
    const gen = generating.slice(generating.indexOf('const styles = StyleSheet.create({'));
    assert.ok(gen.includes("title: { fontFamily: DISPLAY, fontSize: 24, lineHeight: 31, fontWeight: '700', textAlign: 'center' },") && gen.includes("sub: { fontFamily: TEXT, fontSize: 13, lineHeight: 17, textAlign: 'center' },"));
    assert.ok(wizard.includes('const EDGE = Math.floor(1.5 * PixelRatio.get()) / PixelRatio.get();'), 'a 1.5 edge is cut down to whole device pixels, as WebKit draws it');
    assert.equal((styles.match(/borderWidth: EDGE/g) || []).length, 6, 'the cards, the row cards, the sports, the goals, the days and the race date\'s field');
    assert.ok(styles.includes('  numField: { height: 47, paddingTop: 0, paddingBottom: 2.67 },'), 'a number field stands 47, its words a point lower than the name\'s, as read beside today\'s');
    assert.ok(styles.includes("  raceLabel: { fontFamily: DISPLAY, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: -PX, top: -2 * PX },"), 'the Race date labels stood two device pixels low beside today\'s');
    assert.ok(styles.includes("  warnTitle: { fontFamily: DISPLAY, fontSize: 22, lineHeight: 28, fontWeight: '700', marginBottom: 12 - PX, paddingBottom: 2 * PX },"), 'the pop-up\'s words stood a point high under its title');
    assert.doesNotMatch(styles, /borderWidth: 1\.5/);
  });
  test('a slash does not end a line in a card\'s words', () => {
    const j = String.fromCharCode(0x2060);
    assert.equal(unbroken('This puts your event/goal at the forefront'), 'This puts your event/' + j + 'goal at the forefront');
    assert.equal(unbroken('rower/bike, HYROX/CROSSFIT'), 'rower/' + j + 'bike, HYROX/' + j + 'CROSSFIT');
    assert.equal(unbroken('No slash here.'), 'No slash here.');
  });
  test('the boxes WebKit sizes otherwise: the name\'s field, a start set by a race date, the summary\'s edge, an add-on row\'s icon', () => {
    const styles = wizard.slice(wizard.indexOf('const styles = StyleSheet.create({'));
    assert.ok(styles.includes('  nameField: { height: 47, paddingTop: 0, paddingBottom: 4.67 },'), '12 and 12 around a line of 21, and its two edges; the letters let up 2.3, where WebKit sets them');
    assert.ok(styles.includes("fontWeight: '700', marginTop: -PX, top: 1 },") && styles.includes('  floorIcon: { top: 1 },'), 'a day\'s name and the floor\'s lock are let down a point, where WebKit sets them');
    assert.ok(styles.includes("  derived: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, paddingTop: 10, gap: 10 },"), 'detail-sheet.css\'s .derived reaches it too');
    assert.ok(styles.includes("  summary: { borderRadius: 24, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden', marginTop: 4 },"));
    assert.ok(styles.includes('  typeIconSmall: { height: 22.86 },') && wizard.includes('<View style={[s.noShrink, small && s.typeIconSmall]}><Icon name={icon} size={size} color={p.text} /></View>'));
  });
  test('the app opens a wizard of its own at each Build New Program, over the tab bar, under the calendar and the toast', () => {
    assert.ok(app.includes('onBuild={() => setWizard(++wizardN.current)}'));
    assert.ok(app.includes('<Wizard key={\'wizard\' + wizard} palette={p} store={phoneStore} say={say} report={report} onDate={openDate} onClose={() => setWizard(null)}'));
    const bar = app.indexOf('testID="tab-bar"'), wiz = app.indexOf('<Wizard key={\'wizard\' + wizard}'), date = app.indexOf('{dateAsk && <DateBox'), toast = app.indexOf('{toast && <Toast');
    assert.ok(bar > 0 && bar < wiz && wiz < date && date < toast, 'the wizard is drawn after the tab bar, the calendar after the wizard, the toast after both');
    assert.ok(app.includes('const say = (text: string, icon?: string): void => setToast((t) => ({ text, icon: icon || null, n: t ? t.n + 1 : 1 }));'), 'the toast keeps the mark it is said with');
    assert.ok(app.includes("{icon !== null && <SvgXml xml={asyIcon(icon, 13).replace(/ style=\"[^\"]*\"/, '')} color=\"#0a0a0a\" width={13} height={13} />}"), 'the toast draws the mark the page writes before its words');
  });
  test('after Generate the app shows This Week where the wizard lands, with no reminder for that launch', () => {
    assert.match(app, /hand\.land = landingTitle\(prog, midnight\(new Date\(\)\)\);\s*quiet\.current = true;\s*inHand\.dayKey = null;\s*setWizard\(null\); setHeld\(null\); setTick\(\(n\) => n \+ 1\); setTab\('week'\);/);
    assert.ok(app.includes('if (quiet.current) { quiet.current = false; return; }'));
    assert.ok(week.includes('const land = useRef(hand.land || null).current;') && week.includes('const [shownPick, setShown] = useState<number | null>(land ? land.pick : null);'), 'the screen opens on the landing\'s title');
    assert.ok(week.includes('if (hand.land && prog) { hand.own = hand.land.own; hand.land = null; }'), 'takes the week as its own, and takes the landing once');
  });
});

describe('native wizard: the cardio goals\' taps and repaints (the second session)', () => {
  const at = (path: string, more: Partial<Draft> = {}) => ({ step: 3, draft: draft({ primaryPath: path, ...more }) });
  const drawn = (st: { step: number; draft: Draft }) => cardioDraw(memoryStore(), st.draft, NOW);

  test('a goal\'s option writes its id and its name from the table and an empty baseline, and keeps every field the sport\'s goal held', () => {
    const st = at('event', { cardioTypes: ['run'] });
    setCardioGoal(st, 'run', 'run_pace_goal');
    assert.deepEqual(st.draft.cardioGoals['run'], { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', baseline: '' });
    Object.assign(st.draft.cardioGoals['run']!, { targetDist: '1.5', baseline: '2mi' });
    setCardioGoal(st, 'run', 'run_base');
    assert.deepEqual(st.draft.cardioGoals['run'], { id: 'run_base', label: 'Build Running Base', baseline: '2mi', targetDist: '1.5' });
    setCardioGoal(st, 'run', 'no_such_goal');
    assert.equal(st.draft.cardioGoals['run']!.label, '', 'a goal the table does not hold has no name');
  });

  test('each form draws its own fields: the pace goal six, a run goal three, a bike or swim goal one, the swim 500 four and the swim 100 six', () => {
    const fields = (sport: string, id: string): number => {
      const st = at('event', { cardioTypes: [sport] }); setCardioGoal(st, sport, id);
      const f = drawn(st).cardio.sports.find((s) => s.id === sport)!.form!;
      return f.kind === 'swim' ? (f.base500 ? 6 : 4) : f.kind === 'pace' ? 6 : f.mile ? 3 : 1;
    };
    assert.deepEqual([fields('run', 'run_pace_goal'), fields('run', 'run_5k'), fields('bike', 'bike_ftp'), fields('swim', 'swim_base'), fields('swim', 'swim_500_time'), fields('swim', 'swim_100_time')], [6, 3, 1, 1, 4, 6]);
  });

  test('a whole draw gives the race path a race date of today, and its repaint the weeks to it and the card under it', () => {
    const st = at('event', { cardioTypes: ['run'] }); setCardioGoal(st, 'run', 'run_5k');
    const v = drawn(st);
    assert.deepEqual([st.draft.raceDate, st.draft.raceDateWeeks], ['2026-08-29', 0]);
    assert.equal(v.paint.raceField, '2026-08-29');
    assert.match(v.paint.card!, /^<div style="color:var\(--red\);font-size:12px;margin-top:6px"><svg[\s\S]*<\/svg> Less than a week away\. Not enough time to train\.<\/div>$/);
    assert.equal(v.paint.progLen, '<b style="color:var(--accent)">Program length: 8 weeks.</b> Set by your longest cardio goal and your experience.');
    assert.deepEqual([v.paint.pace, v.paint.feas, v.paint.swimPace, v.paint.swimAdvisory], [null, null, null, null], 'the lines of forms that are not drawn are not on the step');
    assert.deepEqual(v.paint.mileAdvisory, { text: '', color: 'var(--muted)' });
  });

  test('the hybrid path draws no race date and no card, and still dates the draft today', () => {
    const st = at('both', { cardioTypes: ['run'] }); setCardioGoal(st, 'run', 'run_10k');
    const v = drawn(st);
    assert.deepEqual([v.cardio.footer!.race, v.paint.raceField, v.paint.card], [null, null, null]);
    assert.equal(st.draft.raceDate, '2026-08-29');
    assert.equal(st.draft.raceDateWeeks, undefined, 'the weeks are written only while the card is on the step');
  });

  test('a day from the race date\'s field is written at once and repaints the card: a race plan 16 weeks out starts later, in the run colour', () => {
    const st = at('event', { cardioTypes: ['run'] }); setCardioGoal(st, 'run', 'run_10k');
    const p = setRaceDate(st, drawn(st).paint, '2026-12-19', NOW);
    assert.deepEqual([st.draft.raceDate, st.draft.raceDateWeeks, p.raceField], ['2026-12-19', 16, '2026-12-19']);
    assert.match(p.card!, /^<div style="color:var\(--run\);[^"]*padding:9px 11px;background:var\(--run\)18;[^"]*">Your 10K is <b>Sat, Dec 19<\/b>, 16 weeks out\. The 8-week plan starts <b>Mon, Oct 26<\/b>, \d weeks from now, so it peaks on race week and not early\./);
    // A blank from the field writes a blank and empties the card; the weeks stay as the last pick left them.
    const blank = setRaceDate(st, p, '', NOW);
    assert.deepEqual([st.draft.raceDate, st.draft.raceDateWeeks, blank.card, blank.raceField], ['', 16, '', '']);
  });

  test('the race date\'s two buttons: Just building fitness clears the date and its weeks, I have a race date gives today back', () => {
    const st = at('event', { cardioTypes: ['run'], raceDate: '2026-12-19', raceDateWeeks: 16 });
    raceTargeted(st, false, NOW);
    assert.deepEqual([st.draft.eventTargeted, st.draft.raceDate, st.draft.raceDateWeeks], [false, '', null]);
    raceTargeted(st, true, NOW);
    assert.deepEqual([st.draft.eventTargeted, st.draft.raceDate], [true, '2026-08-29']);
    st.draft.raceDate = '2026-10-10'; raceTargeted(st, true, NOW);
    assert.equal(st.draft.raceDate, '2026-10-10', 'a date already picked stays');
  });

  test('a typed field writes the draft as handed back, and what its own handler writes beside it', () => {
    const st = at('event', { cardioTypes: ['run', 'bike', 'swim'] });
    setCardioGoal(st, 'run', 'run_pace_goal'); setCardioGoal(st, 'bike', 'bike_base'); setCardioGoal(st, 'swim', 'swim_500_time');
    let p = drawn(st).paint;
    const type = (field: Parameters<typeof editCardioField>[2], sport: string, key: string, v: string) => { p = editCardioField(st, p, field, sport, key, v, NOW); };
    type('runTarget', 'run', 'targetMins', '9');
    assert.deepEqual([st.draft.cardioGoals['run']!['targetMins'], st.draft.cardioGoals['run']!['targetTime']], ['9', '9:00'], 'the target as m:ss beside its fields');
    type('runTarget', 'run', 'targetSecs', '5');
    assert.equal(st.draft.cardioGoals['run']!['targetTime'], '9:05');
    type('paceBaseline', 'run', 'baselineDist', '2');
    assert.deepEqual([st.draft.cardioGoals['run']!['baselineDist'], st.draft.cardioGoals['run']!.baseline], ['2', '2mi']);
    type('mile', 'run', 'mileBestMins', '8');
    assert.deepEqual(st.draft.cardioGoals['run']!['mileBestSrc'], { kind: 'entered' });
    type('baseline', 'bike', 'baselineDist', '20');
    assert.deepEqual([st.draft.cardioGoals['bike']!['baselineDist'], st.draft.cardioGoals['bike']!.baseline], ['20', '20 min']);
    type('swimTarget', 'swim', 'targetMins', '8');
    assert.equal(st.draft.cardioGoals['swim']!['targetTime'], '8:00');
    type('swimBase', 'swim', 'baseMins', '10');
    assert.equal(st.draft.cardioGoals['swim']!['baseMins'], '10');
    assert.deepEqual(Object.keys(st.draft.cardioGoals['run']!), ['id', 'label', 'baseline', 'targetMins', 'targetTime', 'targetSecs', 'baselineDist', 'mileBestMins', 'mileBestSrc'], 'in the order the page writes them');
  });

  test('a typed field repaints what its handler repaints and no more: the pace line, the mile\'s advisory, the swim pace line, the swim\'s advisory', () => {
    const st = at('event', { cardioTypes: ['run', 'swim'] });
    setCardioGoal(st, 'run', 'run_pace_goal'); setCardioGoal(st, 'swim', 'swim_500_time');
    let p = drawn(st).paint;
    assert.deepEqual([p.pace, p.swimPace], ['', '']);
    assert.deepEqual(p.mileAdvisory, { text: 'Required. Enter your most recent timed mile.', color: 'var(--muted)' });
    assert.deepEqual(p.swimAdvisory, { text: 'Required. Enter your most recent timed 500yd.', color: 'var(--muted)' });
    p = editCardioField(st, p, 'runDist', 'run', 'targetDist', '1.5', NOW);
    p = editCardioField(st, p, 'runTarget', 'run', 'targetMins', '12', NOW);
    assert.match(p.pace!, /<\/svg> 12:00 is 8:00 per mile\.$/, '1.5 miles in 12:00 is 8:00 a mile');
    p = editCardioField(st, p, 'mile', 'run', 'mileBestMins', '2', NOW);
    assert.deepEqual(p.mileAdvisory, { text: 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.', color: 'var(--signal)' });
    p = editCardioField(st, p, 'mile', 'run', 'mileBestMins', '13', NOW);
    assert.deepEqual(p.mileAdvisory, { text: 'At 13:00 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.', color: 'var(--muted)' });
    p = editCardioField(st, p, 'swimTarget', 'swim', 'targetMins', '10', NOW);
    assert.match(p.swimPace!, /<\/svg> 10:00 is 2:00 per 100 yd\.$/, '500 yards in 10:00 is 2:00 a hundred');
    p = editCardioField(st, p, 'swimBase', 'swim', 'baseSecs', '75', NOW);
    assert.deepEqual(p.swimAdvisory, { text: 'That is not a real time. Check the minutes and seconds.', color: 'var(--signal)' });
    p = editCardioField(st, p, 'swimBase', 'swim', 'baseSecs', '30', NOW);
    assert.deepEqual(p.swimAdvisory, { text: '', color: 'var(--signal)' });
  });

  test('a typed swim time leaves the program length line as the last whole draw gave it, as the page does', () => {
    const st = at('both', { cardioTypes: ['swim'] }); setCardioGoal(st, 'swim', 'swim_500_time');
    Object.assign(st.draft.cardioGoals['swim']!, { targetMins: '8', targetSecs: '0', baseMins: '10', baseSecs: '30' });
    let p = drawn(st).paint;
    const before = p.progLen;
    p = editCardioField(st, p, 'swimTarget', 'swim', 'targetMins', '10', NOW);
    assert.equal(p.progLen, before, 'the swim target\'s handler repaints the swim pace line and not the length line');
    assert.match(p.swimPace!, /<\/svg> 10:00 is 2:00 per 100 yd\.$/);
    const whole = drawn(st).paint.progLen;
    assert.notEqual(whole, before, 'and the next whole draw does: from 10:30, 500 yards in 10:00 is a nearer goal than in 8:00 and asks for fewer weeks');
    assert.match(whole!, /^<b style="color:var\(--accent\)">Program length: \d+ weeks\.<\/b> Set by your longest cardio goal and your experience\.$/);
  });

  test('the pace reach frame is drawn only where no race date owns the pace\'s words, and names the mile it read', () => {
    const st = at('event', { cardioTypes: ['run'], eventTargeted: false, raceDate: '' }); setCardioGoal(st, 'run', 'run_pace_goal');
    let p = drawn(st).paint;
    for (const [field, key, v] of [['runDist', 'targetDist', '1.5'], ['runTarget', 'targetMins', '9'], ['mile', 'mileBestMins', '9']] as const) p = editCardioField(st, p, field, 'run', key, v, NOW);
    assert.match(p.feas!, /^<div style="color:var\(--accent\);[^"]*">Your mile is 9:00\. In \d+ weeks that reaches about 1\.5 mi in \d+:\d\d\. Your goal is 9:00\. Keep it or change it above\.<\/div>$/);
    raceTargeted(st, true, NOW);
    assert.equal(drawn(st).paint.feas, '', 'with a race date the card carries the sentence and the frame is hidden');
    assert.match(drawn(st).paint.card!, /Your test is this week\..*<div style="margin-top:5px">Your mile is 9:00\. In 1 week that reaches/);
  });

  test('what ten weeks reach, by hand: from the mile entered, and from each level\'s default when none is', () => {
    // 1.5 miles in 9:00 is 6:00 a mile. Ten weeks at 18-35: ((10 - 1) / 1 - 4) / 1.25 = 4 improving weeks at 3 s a mile a week.
    const pace = (exp: string, mile: object) => draft({ experience: exp, cardioGoals: { run: { id: 'run_pace_goal', targetDist: '1.5', targetMins: '9', targetSecs: '0', ...mile } } });
    const say = (d: Draft) => paceCeilingSentence(assessRunPaceCeiling(d, 10)!);
    // From a 9:00 mile: 540 - 12 = 528 s a mile, 792 s over 1.5 miles.
    assert.equal(say(pace('intermediate', { mileBestMins: '9', mileBestSecs: '0' })), 'Your mile is 9:00. In 10 weeks that reaches about 1.5 mi in 13:12. Your goal is 9:00. Keep it or change it above.');
    // A beginner with no mile: the 11:30 default, 690 - 12 = 678, 1017 s.
    assert.equal(say(pace('beginner', {})), 'You have not entered a mile time. The beginner default is 11:30 per mile. In 10 weeks that reaches about 1.5 mi in 16:57. Your goal is 9:00. Enter your mile above and this updates.');
    // A mile typed as 0 reads as none: the intermediate default, 9:30, 570 - 12 = 558, 837 s; the advanced, 7:30, 450 - 4 x 2 = 442, 663 s.
    assert.equal(say(pace('intermediate', { mileBestMins: '0' })), 'You have not entered a mile time. The intermediate default is 9:30 per mile. In 10 weeks that reaches about 1.5 mi in 13:57. Your goal is 9:00. Enter your mile above and this updates.');
    assert.equal(say(pace('advanced', { mileBestMins: '0' })), 'You have not entered a mile time. The advanced default is 7:30 per mile. In 10 weeks that reaches about 1.5 mi in 11:03. Your goal is 9:00. Enter your mile above and this updates.');
    // A target no faster than the mile, or within 45 s a mile of what the weeks reach, is not flagged: 12:15 over 1.5 miles is 8:10 a mile, 38 s under 528.
    assert.equal(assessRunPaceCeiling(pace('intermediate', { mileBestMins: '5', mileBestSecs: '30' }), 10), null);
    assert.equal(assessRunPaceCeiling(draft({ cardioGoals: { run: { id: 'run_pace_goal', targetDist: '1.5', targetMins: '12', targetSecs: '15', mileBestMins: '9' } } }), 10), null);
    assert.equal(assessRunPaceCeiling(draft({ cardioGoals: { run: { id: 'run_base', targetDist: '1.5', targetMins: '9' } } }), 10), null, 'only the pace goal has a ceiling');
    // A target at the mile itself, or slower, is never flagged, even where the 4:00 a mile floor on what the weeks reach stands 45 s or more behind it:
    // a 3:10 mile reaches no faster than 4:00, which is 50 s behind a 3:10 target and 45 s behind a 3:15 one.
    const fast = (secs: string) => draft({ cardioGoals: { run: { id: 'run_pace_goal', targetDist: '1', targetMins: '3', targetSecs: secs, mileBestMins: '3', mileBestSecs: '10' } } });
    assert.equal(assessRunPaceCeiling(fast('10'), 10), null, 'a target at the mile');
    assert.equal(assessRunPaceCeiling(fast('15'), 10), null, 'a target slower than the mile');
    assert.equal(paceCeilingSentence(assessRunPaceCeiling(fast('9'), 10)!), 'Your mile is 3:10. In 10 weeks that reaches about 1 mi in 4:00. Your goal is 3:09. Keep it or change it above.', 'a second faster than the mile is read against the floor');
  });

  test('the shorter plan\'s link switches the run goal and answers with its toast, with no mark; it does nothing for a goal the table does not hold or with no run goal', () => {
    const st = at('event', { cardioTypes: ['run'] }); setCardioGoal(st, 'run', 'run_half');
    const t = offerShorterPlan(st, 'run_10k');
    assert.deepEqual(t, { icon: null, text: 'Switched to the Run a 10K plan ✓' });
    assert.equal(floorToastMarkup(t!), 'Switched to the Run a 10K plan ✓', 'the page hands this toast its words alone');
    assert.deepEqual([st.draft.cardioGoals['run']!.id, st.draft.cardioGoals['run']!.label], ['run_10k', 'Run a 10K']);
    assert.equal(offerShorterPlan(st, 'run_nothing'), null);
    assert.equal(offerShorterPlan(at('event'), 'run_5k'), null);
  });

  test('the units, and the seed\'s two buttons', () => {
    const st = at('event', { cardioTypes: ['run', 'swim'] });
    setPaceUnit(st, 'km'); setSwimUnit(st, 'm');
    assert.deepEqual([st.draft.cardioGoals['run'], st.draft.cardioGoals['swim']], [{ paceUnit: 'km' }, { swimUnit: 'm' }], 'a unit makes the sport\'s goal when it holds none, as the page does');
    assert.equal(applySeedData(st), false, 'with no seed read there is nothing to apply');
    (st.draft as Draft & { _seed: object })._seed = { progName: 'Block', n: 4, mileSec: 497.4, maxDist: 7.4, avgRecSec: 600 };
    assert.equal(applySeedData(st), true);
    assert.deepEqual(st.draft.cardioGoals['run'], { paceUnit: 'km', mileBestMins: '8', mileBestSecs: '17', mileBestSrc: { kind: 'seeded', prog: 'Block', n: 4 }, baselineDist: '7.4', baseline: '7.4km' }, '497.4 s is 8:17; the longest run is the baseline, in the goal\'s unit');
    assert.equal(st.draft['_seedApplied'], true);
    (st.draft as Draft & { _seed: object })._seed = { progName: 'Block', n: 4, mileSec: 479.6 };
    applySeedData(st);
    assert.deepEqual([st.draft.cardioGoals['run']!['mileBestMins'], st.draft.cardioGoals['run']!['mileBestSecs']], ['8', '0'], '479.6 s rounds its seconds to 60 and carries the minute');
    dismissSeedData(st);
    assert.equal(st.draft['_seedDismissed'], true);
  });

  test('the readers\' two tables are the page\'s', () => {
    assert.deepEqual(SWIM_GOAL_DIST, { swim_500_time: 500, swim_100_time: 100 });
    assert.deepEqual(PACE_IMPROVE, { beginner: 3, intermediate: 3, advanced: 2 });
    const page = readFileSync(join(REPO, 'frontends/app/src/legacy/src/js/wizard.ts'), 'utf8');
    assert.ok(page.includes('const SWIM_GOAL_DIST: Record<string, any> = { swim_500_time: 500, swim_100_time: 100 };'));
    assert.ok(readFileSync(join(REPO, 'core/src/engine/nrc-race-bike-swim.ts'), 'utf8').includes('const PACE_IMPROVE: Record<string, number> = {beginner:3, intermediate:3, advanced:2};'));
  });

  test('the mile\'s help by level, and the length line with no mile on the pace goal', () => {
    const help = (exp: string, id: string) => mileFieldHelp(draft({ experience: exp, cardioGoals: { run: { id } } }));
    assert.equal(help('intermediate', 'run_pace_goal'), 'Required. Your paces and your program length start from it.');
    assert.equal(help('intermediate', 'run_5k'), 'Optional. Leave it blank and your paces come from a 9:30 mile, the intermediate default. Enter a mile only if you have timed one.');
    assert.match(help('beginner', 'run_pace_goal'), /^Optional\. Leave it blank and your paces come from an 11:\d\d mile, the beginner default\./, 'a beginner\'s mile stays optional, and 11 takes an');
    const d = draft({ primaryPath: 'event', eventTargeted: false, raceDate: '', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal' } } });
    assert.equal(progLenLine(d, NOW), '<b style="color:var(--accent)">Program length: your mile time sets it.</b> Enter your current mile time and the length appears.');
  });

  test('a framed line is cut into its colour, its words and the reach sentence under them', () => {
    assert.equal(cardParts(''), null);
    assert.deepEqual(cardParts('<div style="color:var(--red);font-size:12px;margin-top:6px"><svg></svg> That date has already passed.</div>'), { hue: 'red', card: false, body: '<svg></svg> That date has already passed.', reach: null });
    const framed = '<div style="color:var(--accent);font-size:12px;line-height:1.55;margin-top:6px;padding:9px 11px;background:var(--accent)18;border-radius:16px;border:1px solid var(--accent)44">';
    assert.deepEqual(cardParts(framed + 'Your test is in week 6.<div style="margin-top:5px">Your mile is 9:00.</div></div>'), { hue: 'accent', card: true, body: 'Your test is in week 6.', reach: 'Your mile is 9:00.' });
    assert.deepEqual(cardParts(framed.replace(/accent/g, 'signal') + 'The <a onclick="offerShorterPlan(\'run_5k\')">5K plan</a> fits.</div>'), { hue: 'signal', card: true, body: 'The <a onclick="offerShorterPlan(\'run_5k\')">5K plan</a> fits.', reach: null });
    assert.deepEqual(copyRuns('<b style="color:var(--accent)">Program length: 8 weeks.</b> Set.').map((r) => [r.text, r.bold]), [['Program length: 8 weeks.', true], [' Set.', false]], 'a bold run that carries its own colour is still a bold run');
  });
});

describe('native wizard: a number field, as WebKit\'s was seen to keep and hand back', () => {
  // Typed key by key in the simulator's Safari (iOS 26.5) into fields set as the wizard sets its own, and the value
  // handed to the handler read after each key (tests/measure/native-wizard_cardio-goals.md, section J). Typed by hand.
  const SEEN: [string, string[]][] = [
    ['1.5', ['1', '1', '1.5']], ['.5', ['', '.5']], ['-5', ['', '-5']], ['+5', ['', '5']], ['0012', ['0', '00', '001', '0012']], ['5..2', ['5', '5', '5', '5.2']], ['1e2', ['1', '', '1e2']],
    ['9,5', ['9', '9', '95']], [' 5', ['', '5']], ['1.50', ['1', '1', '1.5', '1.50']], ['5-3', ['5', '5', '53']], ['5e-2', ['5', '', '', '5e-2']], ['abc', ['', '', '']],
    ['007.0', ['0', '00', '007', '007', '007.0']], ['1.', ['1', '1']], ['99999', ['9', '99', '999', '9999', '99999']], ['e5', ['', '']], ['5 5', ['5', '5', '55']], ['1.5.5', ['1', '1', '1.5', '1.5', '1.55']],
    ['05', ['0', '05']], ['.', ['']], ['-', ['']], ['0', ['0']], ['1e2.5', ['1', '', '1e2', '1e2', '1e25']], ['5e+2', ['5', '', '', '5e+2']], ['-.5', ['', '', '-.5']], ['1ee2', ['1', '', '', '1e2']],
    ['+.5', ['', '', '.5']], ['1.e2', ['1', '1', '', '1.e2']], ['-0', ['', '-0']], ['5e2e', ['5', '', '5e2', '5e2']], ['1E2', ['1', '', '1E2']], ['.5.', ['', '.5', '.5']], ['5.e', ['5', '5', '']],
    ['12/3', ['1', '12', '12', '123']], ['1:30', ['1', '1', '13', '130']], ['5\'', ['5', '5']], ['-5-', ['', '-5', '-5']], ['e-e', ['', '', '']], ['1e+', ['1', '', '']], ['30', ['3', '30']], ['59', ['5', '59']],
    ['60', ['6', '60']], ['12a.5-e3', ['1', '12', '12', '12', '12.5', '12.5', '', '12.5e3']],
    // Two read after the break list's whole run let a second sign in the exponent through: the sign is dropped after the exponent's digits and after its own sign.
    ['1e2-3', ['1', '', '1e2', '1e2', '1e23']], ['1e+-2', ['1', '', '', '', '1e+2']],
  ];
  test('forty six texts typed key by key hand back what Safari handed back after each key', () => {
    assert.equal(SEEN.length, 46);
    for (const [typed, seen] of SEEN) {
      let text = '';
      const got = [...typed].map((ch) => { text = keptText(text, text + ch); return fieldValue(text); });
      assert.deepEqual(got, seen, 'typed ' + JSON.stringify(typed));
    }
  });
  test('deleting hands back the text that is left: 1.5, then 1. reads 1, then 1, then nothing', () => {
    let text = '1.5';
    const got = ['1.', '1', ''].map((next) => { text = keptText(text, next); return fieldValue(text); });
    assert.deepEqual(got, ['1', '1', '']);
  });
  test('a key the field does not keep leaves the text as it stood', () => {
    assert.deepEqual([keptText('12', '12a'), keptText('5.', '5..'), keptText('1e2', '1e2.'), keptText('5', '5-'), keptText('', 'x'), keptText('1e', '1e-'), keptText('', '+')], ['12', '5.', '1e2', '5', '', '1e-', '+']);
  });
  test('the limits on today\'s tag change nothing handed back: a minute under its floor, a second over its ceiling, leading zeros', () => {
    assert.deepEqual(['1', '99999', '12.5', '0012', '1.50'].map(fieldValue), ['1', '99999', '12.5', '0012', '1.50']);
  });
  test('the wizard\'s fields are that field', () => {
    const wizard = strip(read('wizard/Wizard.tsx'));
    assert.ok(wizard.includes('onChangeText={(t) => { held.current = keptText(held.current, t); setText(held.current); onValue(fieldValue(held.current)); }}'), 'each key is kept or dropped, and the handler is called either way');
    assert.ok(wizard.includes('keyboardType="numbers-and-punctuation"'));
    assert.ok(wizard.includes("<NumField key={draws.current + sport + key} id={'wizard-field-' + sport + '-' + key} initial={value} placeholder={placeholder}"), 'a field is made again at each whole draw, with the draft\'s value');
  });
  test('the keys can be put away: a number field\'s return key says done and closes them, and so does a drag on the page', () => {
    // Mario's phone, IA Next 128: a mile time typed, and no way he could find to close the keys. WebKit draws a bar
    // with Done over today's; this keyboard has none, its return key was an unlabelled arrow and a drag did nothing.
    const wizard = strip(read('wizard/Wizard.tsx'));
    const field = wizard.slice(wizard.indexOf('function NumField('), wizard.indexOf('export function Wizard('));
    const input = field.slice(field.indexOf('<TextInput'), field.indexOf('/>'));
    assert.ok(input.includes(' returnKeyType="done" '), 'the return key says done');
    assert.ok(!/multiline|submitBehavior|blurOnSubmit/.test(input), 'and a one line field with none of these set lets go of the keys on return');
    const scroll = wizard.slice(wizard.indexOf('<ScrollView testID="wizard-scroll"'));
    assert.ok(scroll.slice(0, scroll.indexOf('>')).includes(' keyboardDismissMode="on-drag" '), 'a drag on the wizard\'s page closes the keys');
    assert.ok(scroll.slice(0, scroll.indexOf('>')).includes(' keyboardShouldPersistTaps="handled" '), 'and a tap on a card still lands with the keys up');
  });
});

describe('native app: the root\'s keyed children', () => {
  test('each names its kind in its key, so no two that are counted from one share a key', () => {
    // Keyed by the bare count, the first wizard and the first calendar were both "1": closing the calendar made React
    // build the wizard again, on its first step with a new draft (seen on the simulator after the race date's check).
    const app = strip(read('App.tsx'));
    const keys = [...app.matchAll(/<(\w+) key=\{([^}]*)\}/g)].map((m) => [m[1]!, m[2]!]);
    assert.deepEqual(keys.map((k) => k[0]).sort(), ['ChangeSheet', 'DateBox', 'PopUp', 'Programs', 'Progress', 'RandomWorkout', 'RestSheet', 'Toast', 'Wizard']);
    const kinds = keys.map((k) => (/^'(\w+)' \+ /.exec(k[1]!) || [])[1]);
    assert.deepEqual(kinds.sort(), ['change', 'date', 'pop', 'programs', 'progress', 'random', 'rest', 'toast', 'wizard'], 'every key starts with its own kind: ' + JSON.stringify(keys));
  });
});
