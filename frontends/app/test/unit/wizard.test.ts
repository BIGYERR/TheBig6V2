// The new-program wizard (src/app/screens/wizard/wizard-model.ts, architecture phase E step 19), against the legacy
// renderWizardStep it replaces: the shell's progress and count (a lifting-only program skips the cardio step), and the
// first three steps' cards and hints. Every expected value is typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { equipmentChoices, MOVED_STEPS, primaryChoices, profileView, unitStyle, wizardShell, WIZARD_STEPS } from '../../src/app/screens/wizard/wizard-model.ts';

describe('the wizard', () => {
  it('fills the bar by seven steps, counts six on a lifting-only program, and generates on the last', () => {
    assert.deepEqual(wizardShell(0, 'event'), { fill: (1 / 7) * 100 + '%', label: '1/7', next: 'Continue →' });
    assert.deepEqual(wizardShell(0, 'body'), { fill: (1 / 7) * 100 + '%', label: '1/6', next: 'Continue →' });
    // A lifting-only program jumps from equipment (2) to lifting focus (4), which counts as its fourth of six.
    assert.deepEqual([wizardShell(1, 'body').label, wizardShell(2, 'body').label, wizardShell(4, 'body').label, wizardShell(4, 'both').label], ['2/6', '2/6', '4/6', '5/7']);
    assert.deepEqual(wizardShell(6, 'body'), { fill: '100%', label: '6/6', next: 'Generate Program →' });
    assert.deepEqual([...WIZARD_STEPS], ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name']);
    assert.deepEqual([...MOVED_STEPS], ['primary', 'profile', 'equipment']);
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
});
