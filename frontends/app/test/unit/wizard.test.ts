// The new-program wizard (src/app/screens/wizard/wizard-model.ts, architecture phase E step 19), against the legacy
// renderWizardStep it replaces: the shell's progress and count (a lifting-only program skips the cardio step), and the
// first three steps' cards and hints. Every expected value is typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  daysView, equipmentChoices, liftingView, nameSummary, primaryChoices, profileView, unitStyle, wizardShell, WIZARD_STEPS,
} from '../../src/app/screens/wizard/wizard-model.ts';

describe('the wizard', () => {
  it('fills the bar by seven steps, counts six on a lifting-only program, and generates on the last', () => {
    assert.deepEqual(wizardShell(0, 'event'), { fill: (1 / 7) * 100 + '%', label: '1/7', next: 'Continue →' });
    assert.deepEqual(wizardShell(0, 'body'), { fill: (1 / 7) * 100 + '%', label: '1/6', next: 'Continue →' });
    // A lifting-only program jumps from equipment (2) to lifting focus (4), which counts as its fourth of six.
    assert.deepEqual([wizardShell(1, 'body').label, wizardShell(2, 'body').label, wizardShell(4, 'body').label, wizardShell(4, 'both').label], ['2/6', '2/6', '4/6', '5/7']);
    assert.deepEqual(wizardShell(6, 'body'), { fill: '100%', label: '6/6', next: 'Generate Program →' });
    assert.deepEqual([...WIZARD_STEPS], ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name']);
  });

  it('offers the three paths and marks the draft\'s', () => {
    const c = primaryChoices({ primaryPath: 'both' });
    assert.deepEqual(c.map((x) => [x.id, x.label, x.sel]), [['event', 'Race / Event', false], ['body', 'Strength / Physique', false], ['both', 'Hybrid', true]]);
    assert.equal(c[1]!.detail, 'Full-intensity lifting toward your goal · easy optional cardio that won\'t sap your lifts.');
  });

  it('marks the experience and age chosen, and explains each, defaulting to intermediate and 18 to 35', () => {
    const p = profileView({ experience: 'advanced', ageBracket: '55+', unit: 'kg' });
    assert.deepEqual(p.experience.map((e) => [e.id, e.sel]), [['beginner', false], ['intermediate', false], ['advanced', true]]);
    assert.deepEqual(p.age.map((a) => [a.label, a.icon, a.sel]), [['18-35', '⚡', false], ['36-54', '💡', false], ['55+', '🧠', true]]);
    assert.deepEqual([p.kg, p.expHint, p.ageLabel, p.ageHint], [true, 'Higher intensity, more volume, shorter rest. Progressions push harder.', 'Age 55+:', 'More deload frequency, conservative volume increases, joint-friendly emphasis.']);
    const blank = profileView({});
    assert.deepEqual([blank.kg, blank.expHint, blank.ageLabel, blank.ageHint], [false, 'Balanced volume and intensity. Standard progressions with room to push.', 'Age 18-35:', 'Standard progressions. Peak recovery.']);
    assert.match(unitStyle(true), /background:var\(--accent\);color:var\(--on-ink\)$/);
    assert.match(unitStyle(false), /background:transparent;color:var\(--muted\)$/);
  });

  it('lists the five equipment setups and marks the draft\'s', () => {
    assert.deepEqual(equipmentChoices({ equipment: 'crossfit' }).map((e) => [e.id, e.label, e.sel]), [
      ['home_full', 'Home Gym — Full', false], ['home_basic', 'Home Gym — Basic', false], ['commercial', 'Commercial Gym', false],
      ['crossfit', 'CrossFit Box', true], ['bodyweight', 'Bodyweight only', false],
    ]);
  });

  it('offers the focuses for the path, and the cardio add-on only on a lifting-first program', () => {
    const opts = { body: [{ id: 'strength', icon: 'a', label: 'Strength', desc: 'x' }, { id: 'balanced', icon: 'b', label: 'Balanced', desc: 'y' }], event: [{ id: 'support_strength', icon: 'c', label: 'Strength Support', desc: 'z' }] };
    const body = liftingView({ primaryPath: 'body', liftingFocus: 'balanced', cardioTypes: ['swim'] }, opts);
    assert.equal(body.subtitle, 'This is your primary focus. Cardio is optional and added next.');
    assert.deepEqual(body.choices.map((c) => [c.id, c.sel]), [['strength', false], ['balanced', true]]);
    assert.deepEqual([body.addOn!.sports.map((t) => [t.label, t.sel]), body.addOn!.liftOnly], [[['Running', false], ['Cycling', false], ['Swimming', true]], false]);
    assert.equal(liftingView({ primaryPath: 'body' }, opts).addOn!.liftOnly, true);
    const event = liftingView({ primaryPath: 'event', liftingFocus: 'support_strength' }, opts);
    assert.deepEqual([event.subtitle, event.choices.map((c) => c.sel), event.addOn], ['Lifting supports your cardio goal — it should not compete with it.', [true], null]);
    assert.equal(liftingView({ primaryPath: 'both' }, opts).addOn, null);
  });

  it('marks the rest days, locks the training days at the floor, and says whose goal sets it', () => {
    const v = daysView({ restDays: ['wed', 'sun'], cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_half' } } }, { advisories: ['<b>x</b>'], minDays: 4, goalLabel: (id) => `goal(${id})` });
    assert.deepEqual(v.days.map((x) => [x.short, x.rest, x.blocked]), [['Su', true, false], ['Mo', false, false], ['Tu', false, false], ['We', true, false], ['Th', false, false], ['Fr', false, false], ['Sa', false, false]]);
    assert.deepEqual([v.count, v.floor, v.advisories], ['5 training days', null, ['<b>x</b>']]);
    const floor = daysView({ restDays: ['mon', 'wed', 'fri', 'sun'], cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half' } } }, { advisories: ['hidden at the floor'], minDays: 3, goalLabel: (id) => `goal(${id})` });
    assert.deepEqual([floor.count, floor.floor, floor.advisories], ['3 training days', { reason: 'goal(run_half)', min: 3 }, []]);
    assert.deepEqual(floor.days.filter((x) => x.blocked).map((x) => x.key), ['tue', 'thu', 'sat']);
    assert.deepEqual(daysView({ restDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri'] }, { advisories: [], minDays: 3, goalLabel: () => '' }).floor, { reason: null, min: 3 });
    assert.equal(daysView({ restDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri'] }, { advisories: [], minDays: 3, goalLabel: () => '' }).count, '1 training day');
  });

  it('summarises the program, the race row only on a race, the start row in its own span', () => {
    const rows = nameSummary(
      { primaryPath: 'event', liftingFocus: 'support_prevention', restDays: ['mon'], experience: 'beginner', ageBracket: '55+', equipment: 'minimal' },
      { weeks: 1, cardio: '[run] Run: 10K', raceRow: 'Sun, Nov 29, 2026 (7 weeks away)', startSummary: 'Mon, Oct 12, 2026', aligned: null, resolveCopy: '' },
    );
    assert.deepEqual(rows.map((r) => [r.k, r.v]), [
      ['Path', 'Race / Event'], ['Race date', 'Sun, Nov 29, 2026 (7 weeks away)'], ['Lifting', 'Injury Prevention'], ['Cardio', '[run] Run: 10K'],
      ['Program length', '1 week'], ['Start date', '<span id="sumStartDate">Mon, Oct 12, 2026</span>'], ['Training days', 'Su · Tu · We · Th · Fr · Sa'],
      ['Rest days', 'Mo'], ['Experience', 'beginner'], ['Age range', '55+'], ['Equipment', 'Minimal / Travel'],
    ]);
    const body = nameSummary({ primaryPath: 'body', liftingFocus: 'balanced', restDays: [], experience: 'intermediate', ageBracket: '18-35', equipment: 'commercial' },
      { weeks: 6, cardio: 'Lift only', raceRow: null, startSummary: 's', aligned: null, resolveCopy: '' });
    assert.deepEqual(body.map((r) => r.k), ['Path', 'Lifting', 'Cardio', 'Program length', 'Start date', 'Training days', 'Rest days', 'Experience', 'Age range', 'Equipment']);
    assert.deepEqual([body[3]!.v, body[6]!.v], ['6 weeks', 'None']);
  });
});

