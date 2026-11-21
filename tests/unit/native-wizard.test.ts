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
  wizardAlignment, wizardStartSummary, wizardTestPin,
} from '../../frontends/native/src/wizard/wizard-readers.ts';
import {
  WIZARD_WORDS, cardioCards, copyRuns, dateFieldText, floorToastMarkup, landingTitle, liftOnly, repaintStart, setChoice, setName, setStart, setUnit, startWizard, titleLine, toggleCardioTypeSport, toggleRestDay,
  unbroken, wizardBack, wizardNext, wizardView,
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
    assert.deepEqual(readdirSync(join(NATIVE, 'wizard')).sort(), ['Generating.tsx', 'Wizard.tsx', 'cardio-goal-model.ts', 'generating-figure.ts', 'wizard-model.ts', 'wizard-readers.ts', 'wizard-screen.ts', 'wizard-writes.ts']);
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
  test('a goal in the draft is not read for its fields: those are the second session\'s', () => {
    const d = draft({ primaryPath: 'event', cardioTypes: ['run', 'swim'], cardioGoals: { run: { id: 'run_pace_goal', targetDist: '1.5', targetMins: '9' }, swim: { id: 'swim_100_time' } } });
    assert.doesNotThrow(() => cardioCards(d, NOW));
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
    assert.ok(wizard.includes('const render = (): void => setDrawn(wizardView(store, st, new Date()));'));
    assert.ok(wizard.includes("const picked = (iso: string): void => { setStart(st, iso); setDrawn((d) => (d.view.step === 'name' ? { shell: d.shell, view: { step: 'name', name: repaintStart(st, d.view.name, new Date()) } } : d)); };"));
    assert.ok(wizard.includes("onPress={() => onDate({ value: st.draft.startDate || '', min: null, onChange: picked })}"), 'the field opens the app\'s calendar on the draft\'s day, with no earliest day');
    assert.ok(wizard.includes('<TextInput testID="wizard-name" defaultValue={n.name} onChangeText={(t) => setName(st, t)} maxLength={40}'), 'the name is typed into the draft, forty letters at most, and draws nothing');
  });
  test('a rest day\'s toast carries its mark; Back on the first step closes; the last button asks the length first', () => {
    assert.ok(wizard.includes('const toast = (t: FloorToast | null): void => { if (t) say(t.text, t.icon); };'));
    assert.ok(wizard.includes('onPress={() => { toast(toggleRestDay(st, x.key)); render(); }}'));
    assert.ok(wizard.includes('const back = (): void => { if (wizardBack(st)) onClose(); else render(); };'));
    assert.match(wizard, /const next = \(\): void => \{\s*if \(!wizardNext\(st\)\) \{ render\(\); return; \}\s*const w = lengthWarning\(st\.draft\);\s*if \(w\) setWarn\(w\); else go\(\);\s*\};/);
    assert.match(wizard, /const go = \(\): void => \{\s*const no = refusal\(st\.draft\);\s*if \(no !== null\) \{ say\(no\); render\(\); return; \}\s*const b = beginGenerate\(st\.draft, new Date\(\)\);/);
    assert.ok(wizard.includes('onPress={() => { setWarn(null); render(); }}') && wizard.includes('onPress={() => { setWarn(null); go(); }}'), 'Go Back draws the wizard again; Build goes on');
  });
  test('a goal takes no press this session, and a sport\'s header does', () => {
    assert.ok(wizard.includes("<View key={g.id} testID={'wizard-goal-' + g.id}"), 'a goal is drawn, not pressed');
    assert.ok(wizard.includes("<Pressable testID={'wizard-sport-tap-' + sp.id} accessibilityRole=\"button\" accessibilityState={{ expanded: sp.sel }} onPress={() => { toggleCardioTypeSport(st, sp.id); render(); }}"));
    assert.doesNotMatch(wizard, /setCardioGoal|offerShorterPlan\(/, 'picking a goal and the shorter plan\'s switch are the second session\'s');
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
      ['a wrapping line\'s bold runs and link', '<Text key={i} style={[r.bold && bold, r.link !== null && [s.link, { color: p.text }]]}>{r.text}</Text>'],
      ['a line\'s icons', "? <SvgXml key={i} xml={r.icon.replace(/ style=\"[^\"]*\"/, '')} color={color} width={size} height={size} />"], ['a line\'s words', ': <Text key={i} style={[style, r.bold && bold]}>{r.text}</Text>))}'],
      // The pop-up.
      ['the pop-up\'s kicker', '{LENGTH_WORDS.kicker}</Text>'], ['the pop-up\'s title', '{LENGTH_WORDS.title(warn.weeks)}</Text>'],
      ['the pop-up\'s words', "{warn.msg + '\\n\\n' + LENGTH_WORDS.body(warn.weeks).before}<Text style={[s.bold, { color: p.text }]}>{LENGTH_WORDS.body(warn.weeks).bold}</Text>{LENGTH_WORDS.body(warn.weeks).after}"],
      ['Go Back\'s words', '{LENGTH_WORDS.back}</Text>'], ['Build\'s words', '{LENGTH_WORDS.build(warn.weeks)}</Text>'], ['the pop-up, only when the length warns', '{warn && ('], ['the generating screen, only once begun', '{gen && ('],
      ['the title\'s size', 'const titleSize = Math.min(28, Math.max(21, width * 0.065));'],
    ];
    const twice = new Set(['{W.name.startLabel}</Text>']);   // over the field, and over a start set by a race date
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
    const beside = ['count', 'check', 'sportCheck', 'advisory', 'fieldText', 'src', 'typeNameSmall'];
    for (const m of typed) assert.equal(/-PX| - PX/.test(m[2]!), !beside.includes(m[1]!), m[1] + (beside.includes(m[1]!) ? ' stands beside a taller thing and gives nothing back' : ' gives its pixel back'));
    assert.ok(styles.includes("  dateText: { textAlign: 'center', marginTop: -PX },") && styles.includes('  derivedText: { marginTop: -PX },'), 'the start\'s field and a start set by a race give theirs back too');
    // The title is 6.5% of the width between 21 and 28, bold: 393 wide is 25.545 and stands 32, 402 is 26.13 and 33, 430 is 27.95 and 36.
    assert.deepEqual([21, 22.1, 22.75, 23.4, 24.375, 25.545, 26.13, 26.91, 27.95, 28].map(titleLine), [27, 28, 29, 30, 31, 32, 33, 34, 36, 36]);
    const gen = generating.slice(generating.indexOf('const styles = StyleSheet.create({'));
    assert.ok(gen.includes("title: { fontFamily: DISPLAY, fontSize: 24, lineHeight: 31, fontWeight: '700', textAlign: 'center' },") && gen.includes("sub: { fontFamily: TEXT, fontSize: 13, lineHeight: 17, textAlign: 'center' },"));
    assert.ok(wizard.includes('const EDGE = Math.floor(1.5 * PixelRatio.get()) / PixelRatio.get();'), 'a 1.5 edge is cut down to whole device pixels, as WebKit draws it');
    assert.equal((styles.match(/borderWidth: EDGE/g) || []).length, 5, 'the cards, the row cards, the sports, the goals and the days');
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
    assert.ok(app.includes('<Wizard key={wizard} palette={p} store={phoneStore} say={say} report={report} onDate={openDate} onClose={() => setWizard(null)}'));
    const bar = app.indexOf('testID="tab-bar"'), wiz = app.indexOf('<Wizard key={wizard}'), date = app.indexOf('{dateAsk && <DateBox'), toast = app.indexOf('{toast && <Toast');
    assert.ok(bar > 0 && bar < wiz && wiz < date && date < toast, 'the wizard is drawn after the tab bar, the calendar after the wizard, the toast after both');
    assert.ok(app.includes('const say = (text: string, icon?: string): void => setToast((t) => ({ text, icon: icon || null, n: t ? t.n + 1 : 1 }));'), 'the toast keeps the mark it is said with');
    assert.ok(app.includes("{icon !== null && <SvgXml xml={asyIcon(icon, 13).replace(/ style=\"[^\"]*\"/, '')} color=\"#0a0a0a\" width={13} height={13} />}"), 'the toast draws the mark the page writes before its words');
  });
  test('after Generate the app shows This Week where the wizard lands, with no reminder for that launch', () => {
    assert.match(app, /hand\.land = landingTitle\(prog, midnight\(new Date\(\)\)\);\s*quiet\.current = true;\s*setWizard\(null\); setHeld\(null\); setTick\(\(n\) => n \+ 1\); setTab\('week'\);/);
    assert.ok(app.includes('if (quiet.current) { quiet.current = false; return; }'));
    assert.ok(week.includes('const land = useRef(hand.land || null).current;') && week.includes('const [shownPick, setShown] = useState<number | null>(land ? land.pick : null);'), 'the screen opens on the landing\'s title');
    assert.ok(week.includes('if (hand.land && prog) { hand.own = hand.land.own; hand.land = null; }'), 'takes the week as its own, and takes the landing once');
  });
});
