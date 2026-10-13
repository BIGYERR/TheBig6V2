// A program card's detail (src/app/screens/program-list/program-detail-model.ts, architecture phase E), against the
// legacy progDetailHTML it replaces: the rows, the maxes, the paces, the cardio goals, the race and the seed. Every
// expected value is typed here from the legacy builder.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { programDetail, type ProgSel } from '../../src/app/screens/program-list/program-detail-model.ts';

const TABLES = { dayNames: { mon: 'Mon', tue: 'Tue', wed: 'Wed', sat: 'Sat' }, goalLabels: { balanced: 'Balanced' } };
const SEL: ProgSel = {
  goal: 'balanced', liftLabel: 'Strength Support', pathLabel: 'Race / Event', experience: 'advanced', ageBracket: '36-54', equipLabel: 'Commercial Gym', unit: 'lbs',
  lifts: { squat: 315, bench: 225, deadlift: 405, estimated: false },
  trainDays: ['mon', 'tue', 'sat'], restDays: ['wed', 'sun'], length: 14,
  cardio: [{ type: 'run', label: 'Running', goal: 'Half Marathon' }],
  eventTargeted: true, raceStr: 'Sun, Dec 6, 2026', raceOut: { card: '8 weeks' }, seed: 17, runAnchor: { any: 1 },
};
const PACES = { chips: [{ k: 'Mile', v: '7:30', u: '/mi' }], sentence: 'Anchored on a <b>7:30 mile</b>.' };

describe('the program detail', () => {
  it('lists the focus, profile and schedule rows, the days by name and an unknown day as itself', () => {
    const d = programDetail('p1', SEL, TABLES, PACES);
    assert.deepEqual(d.focus, [{ k: 'Goal', v: 'Balanced' }, { k: 'Lift emphasis', v: 'Strength Support' }, { k: 'Path', v: 'Race / Event' }]);
    assert.deepEqual(d.profile.map((r) => r.v), ['advanced', '36-54', 'Commercial Gym', 'lbs']);
    assert.deepEqual(d.schedule, [{ k: 'Train days', v: 'Mon · Tue · Sat' }, { k: 'Rest days', v: 'Wed · sun' }, { k: 'Length', v: '14 weeks' }]);
    assert.deepEqual(d.lifts, [{ k: 'Squat', v: '315', u: 'lbs' }, { k: 'Bench', v: '225', u: 'lbs' }, { k: 'Deadlift', v: '405', u: 'lbs' }]);
    assert.deepEqual([d.estimated, d.paces, d.seed], [false, PACES, 'seed 17']);
  });

  it('says what is missing: a dash for no goal or no training day, None for no rest day, no seed, estimated maxes', () => {
    const d = programDetail('p2', { ...SEL, goal: '', trainDays: [], restDays: [], seed: null, lifts: { ...SEL.lifts, estimated: true } }, TABLES, PACES);
    assert.deepEqual([d.focus[0]!.v, d.schedule[0]!.v, d.schedule[1]!.v, d.seed, d.estimated], ['—', '—', 'None', '', true]);
    assert.equal(programDetail('p3', { ...SEL, goal: 'mystery' }, TABLES, null).focus[0]!.v, 'mystery');
  });

  it('shows the paces only when the run reads the chart, a pencil per sport\'s goal or Lift only, and the race only on a race', () => {
    assert.equal(programDetail('p4', { ...SEL, runAnchor: null }, TABLES, PACES).paces, null);
    assert.deepEqual(programDetail('p5', { ...SEL, cardio: [{ type: 'bike', label: 'Cycling', goal: '' }] }, TABLES, null).cardio, [{ type: 'bike', label: 'Cycling', goal: 'General fitness' }]);
    assert.equal(programDetail('p6', { ...SEL, cardio: [] }, TABLES, null).cardio, null);
    assert.deepEqual(programDetail('p7', SEL, TABLES, null).event, [{ k: 'Race date', v: 'Sun, Dec 6, 2026' }, { k: 'Time out', v: '8 weeks' }]);
    assert.deepEqual(programDetail('p8', { ...SEL, raceStr: '', raceOut: null }, TABLES, null).event, [{ k: 'Race date', v: 'No date set' }]);
    assert.equal(programDetail('p9', { ...SEL, eventTargeted: false }, TABLES, null).event, null);
  });
});
