// The wizard's cardio goal step (src/app/screens/wizard/cardio-goal-model.ts, architecture phase E), against the legacy
// renderWizardStep branch it replaces: the draft prepared before drawing, the sport cards and their goals, each goal's
// fields, and the box under the cards. The legacy helpers are stand-ins that name what was asked for, so every
// expected value is typed here from the legacy template.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  alignedPips, baselineSuffix, type CardioDraft, type CardioReads, cardioStep, localIso, mileAdvisory, prepareCardioDraft, raceButtonStyle, seedView, swimAdvisory,
  unitButtonStyle,
} from '../../src/app/screens/wizard/cardio-goal-model.ts';

const SEED = { applied: false as const, prog: 'Old', found: 'found' };
const SWIM = { text: 'swim adv', color: 'var(--signal)' };
const MILE = { text: 'mile adv', color: 'var(--muted)' };
const EXCLUDED = new Set(['run_half', 'run_marathon', 'bike_century', 'swim_tri']);
const READS: CardioReads = {
  goalsByType: {
    run: [{ id: 'run_10k', label: 'Run a 10K', desc: '6.2 miles.' }, { id: 'run_half', label: 'Half Marathon', desc: '13.1 miles.' }, { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', desc: 'A distance and a time.' }],
    bike: [{ id: 'bike_ftp', label: 'Improve FTP / Power', desc: 'Power.' }],
    swim: [{ id: 'swim_100_time', label: 'Improve 100 Time', desc: 'Speed.' }, { id: 'swim_500_time', label: 'Improve 500 Time', desc: 'Mid.' }],
  },
  hybridExcluded: EXCLUDED,
  swimDist: { swim_500_time: 500, swim_100_time: 100 },
  icon: (key, size) => `[${key}/${size}]`,
  clock: (secs) => `<${secs}>`,
  paceTarget: (g) => (g?.targetDist ? { tTotalSecs: 630, tPacePerMile: 420 } : {}),
  seed: () => SEED,
  swimAdvisory: () => SWIM,
  mileHelp: () => '[help]',
  mileAdvisory: () => MILE,
  progLen: () => '[len]',
  today: '2026-10-12',
};
const draft = (d: Partial<CardioDraft>): CardioDraft => ({ primaryPath: 'event', cardioTypes: [], cardioGoals: {}, ...d });

describe('the cardio goal step', () => {
  it('prepares the draft as the legacy step did: today when a race date is wanted, no weeks without one, no taper goal on hybrid', () => {
    const a = draft({ eventTargeted: true, raceDate: '' });
    prepareCardioDraft(a, EXCLUDED, '2026-10-12');
    assert.equal(a.raceDate, '2026-10-12');
    const b = draft({ eventTargeted: false, raceDateWeeks: 9 });
    prepareCardioDraft(b, EXCLUDED, '2026-10-12');
    assert.deepEqual([b.raceDate, b.raceDateWeeks], [undefined, null]);
    const c = draft({ primaryPath: 'both', cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_half' }, bike: { id: 'bike_ftp' } } });
    prepareCardioDraft(c, EXCLUDED, '2026-10-12');
    assert.deepEqual(Object.keys(c.cardioGoals), ['bike']);
    const d = draft({ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half' } } });
    prepareCardioDraft(d, EXCLUDED, '2026-10-12');
    assert.deepEqual(Object.keys(d.cardioGoals), ['run']);
  });

  it('draws the three sports in order, the chosen ones open with their goals, and hides the taper goals on hybrid', () => {
    const v = cardioStep(draft({ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_10k' } } }), READS);
    assert.deepEqual(v.sports.map((s) => [s.id, s.icon, s.name, s.sel]), [['run', '🏃', 'Running', true], ['bike', '🚴', 'Cycling / Spin', false], ['swim', '🏊', 'Swimming', false]]);
    assert.deepEqual(v.sports[0]!.goals.map((g) => [g.id, g.sel]), [['run_10k', true], ['run_half', false], ['run_pace_goal', false]]);
    assert.deepEqual([v.sports[1]!.goals, v.sports[1]!.form], [[], null]);
    const hybrid = cardioStep(draft({ primaryPath: 'both', cardioTypes: ['run'] }), READS);
    assert.deepEqual(hybrid.sports[0]!.goals.map((g) => g.id), ['run_10k', 'run_pace_goal']);
    assert.equal(hybrid.sports[0]!.form, null);
  });

  it('asks a goal with no fields of its own for the baseline, per sport, and a run for the mile', () => {
    const v = cardioStep(draft({ cardioTypes: ['run', 'bike', 'swim'], cardioGoals: { run: { id: 'run_10k', baselineDist: 3, mileBestMins: '8', mileBestSecs: 0 }, bike: { id: 'bike_ftp' }, swim: { id: 'swim_mile' } } }), READS);
    assert.deepEqual(v.sports[0]!.form, {
      kind: 'other', seed: SEED, question: 'How far can you currently run?', placeholder: 'e.g. 3', step: '0.5', unitWord: 'mi', baseline: '3',
      mile: { help: '[help]', pair: { field: 'mile', minsKey: 'mileBestMins', secsKey: 'mileBestSecs', mins: '8', secs: '', lo: '3', hi: '20' }, advisory: MILE },
    });
    assert.deepEqual(v.sports[1]!.form, { kind: 'other', seed: null, question: 'How long can you currently ride?', placeholder: 'e.g. 20', step: '0.5', unitWord: 'min', baseline: '', mile: null });
    assert.deepEqual(v.sports[2]!.form, { kind: 'other', seed: null, question: 'How far can you currently swim?', placeholder: 'e.g. 400', step: '50', unitWord: 'yards', baseline: '', mile: null });
    assert.deepEqual(['run', 'bike', 'swim', 'row'].map(baselineSuffix), [' mi', ' min', ' yd', '']);
  });

  it('draws a pace goal with its distance, unit, target, pace line, baseline and mile', () => {
    const run = { id: 'run_pace_goal', paceUnit: 'km', targetDist: '5', targetMins: '19', targetSecs: '' };
    const v = cardioStep(draft({ cardioTypes: ['run'], cardioGoals: { run } }), READS);
    assert.deepEqual(v.sports[0]!.form, {
      kind: 'pace', unit: 'km', dist: '5',
      target: { field: 'runTarget', minsKey: 'targetMins', secsKey: 'targetSecs', mins: '19', secs: '', lo: '0', hi: '99' },
      paceShown: true, paceLine: '[🎯/13] <630> is <420> per mile.', seed: SEED, baseline: '',
      mile: { help: '[help]', pair: { field: 'mile', minsKey: 'mileBestMins', secsKey: 'mileBestSecs', mins: '', secs: '', lo: '3', hi: '20' }, advisory: MILE },
    });
    // No target minutes typed, or no distance: the pace line is hidden, and with no distance it says nothing after the icon.
    const blank = cardioStep(draft({ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal', targetMins: '' , targetDist: '2' } } }), READS);
    assert.equal((blank.sports[0]!.form as { paceShown: boolean }).paceShown, false);
    const noDist = cardioStep(draft({ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal', targetMins: '9' } } }), READS);
    assert.deepEqual([(noDist.sports[0]!.form as { paceShown: boolean }).paceShown, (noDist.sports[0]!.form as { paceLine: string }).paceLine, (noDist.sports[0]!.form as { unit: string }).unit], [false, '[🎯/13] ', 'mi']);
  });

  it('draws a swim time goal with its fixed distance, unit, target and pace per 100, and the 500 for a 100 goal', () => {
    const v = cardioStep(draft({ cardioTypes: ['swim'], cardioGoals: { swim: { id: 'swim_100_time', swimUnit: 'm', targetMins: '1', targetSecs: '25', baseMins: '1', base500Secs: '30' } } }), READS);
    assert.deepEqual(v.sports[2]!.form, {
      kind: 'swim', dist: 100, unit: 'm',
      target: { field: 'swimTarget', minsKey: 'targetMins', secsKey: 'targetSecs', mins: '1', secs: '25', lo: '0', hi: '99' },
      paceShown: true, paceLine: '[🎯/13] <85> is <85> per 100 m.', baseLabel: 'Your most recent timed 100m', baseMins: '1', baseSecs: '', advisory: SWIM,
      base500: { label: 'Your most recent timed 500m', mins: '', secs: '30' },
    });
    const five = cardioStep(draft({ cardioTypes: ['swim'], cardioGoals: { swim: { id: 'swim_500_time' } } }), READS).sports[2]!.form as { paceShown: boolean; paceLine: string; baseLabel: string; base500: unknown; unit: string };
    assert.deepEqual([five.paceShown, five.paceLine, five.baseLabel, five.base500, five.unit], [false, '[🎯/13] <0> is <0> per 100 yd.', 'Your most recent timed 500yd', null, 'yd']);
  });

  it('draws the box under the cards only with a sport and a goal, with the race date on the race path', () => {
    assert.equal(cardioStep(draft({ cardioTypes: ['run'] }), READS).footer, null);
    assert.equal(cardioStep(draft({ cardioTypes: [], cardioGoals: { run: { id: 'run_10k' } } }), READS).footer, null);
    const fit = cardioStep(draft({ cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_10k' } }, eventTargeted: false }), READS).footer;
    assert.deepEqual(fit, { progLen: '[len]', multi: true, race: { targeted: false, value: '2026-10-12', min: '2026-10-12', copy: 'Runs the full 8-week 10K plan and finishes with a 10K time trial in place of race day.' } });
    const dated = cardioStep(draft({ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal' } }, eventTargeted: true, raceDate: '2026-11-14' }), READS).footer;
    assert.deepEqual(dated, { progLen: '[len]', multi: false, race: { targeted: true, value: '2026-11-14', min: '2026-10-12', copy: 'Program builds to peak fitness and holds. Pick a race when ready.' } });
    assert.equal(cardioStep(draft({ primaryPath: 'both', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_10k' } } }), READS).footer!.race, null);
  });

  it('styles the unit and race date buttons as the legacy step did, and writes today as the local date', () => {
    assert.equal(unitButtonStyle(true, false), 'font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;cursor:pointer;background:var(--accent);color:var(--on-ink)');
    assert.equal(unitButtonStyle(false, true), 'font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;border-left:1px solid var(--border2);cursor:pointer;background:var(--surface2);color:var(--muted)');
    assert.equal(raceButtonStyle(false), 'flex:1;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:9px;border:none;cursor:pointer;background:transparent;color:var(--muted)');
    assert.equal(localIso(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  });

  it('words the mile and swim advisories: a refusal in signal orange, a required blank and a note muted, nothing hidden', () => {
    assert.deepEqual(mileAdvisory({ ok: true }), { text: '', color: 'var(--muted)' });
    assert.deepEqual(mileAdvisory({ ok: false, msg: 'Not a real time.' }), { text: 'Not a real time.', color: 'var(--signal)' });
    assert.deepEqual(mileAdvisory({ ok: false, blank: true, msg: 'Required.' }), { text: 'Required.', color: 'var(--muted)' });
    assert.deepEqual(mileAdvisory({ ok: true, adv: 'From the 12:00 row.' }), { text: 'From the 12:00 row.', color: 'var(--muted)' });
    assert.deepEqual(swimAdvisory({ ok: true, msg: 'ignored' }), { text: '', color: 'var(--signal)' });
    assert.deepEqual(swimAdvisory({ ok: false, blank: true, msg: 'Required.' }), { text: 'Required.', color: 'var(--muted)' });
    assert.deepEqual(swimAdvisory({ ok: false, msg: 'Check both.' }), { text: 'Check both.', color: 'var(--signal)' });
  });

  it('offers the seed once read and kept on the draft, says where applied numbers came from, and says nothing once dismissed', () => {
    const seed = { progName: 'Old', n: 4, avgRecSec: 600, maxDist: 4 };
    const pace = (s: number | undefined) => (s ? '10:00' : null);
    const d: { _seedDismissed?: boolean; _seed?: typeof seed | null; _seedApplied?: boolean } = {};
    let reads = 0;
    const find = () => { reads++; return seed; };
    assert.deepEqual(seedView(d, find, pace), { applied: false, prog: 'Old', found: 'Recent logs found: 4 recovery runs, avg 10:00/mi, longest run 4 mi over your last 3 weeks.' });
    seedView(d, find, pace);
    assert.equal(reads, 1, 'read once per wizard');
    assert.deepEqual(seedView({ _seed: { ...seed, maxDist: 0, avgRecSec: 0 } }, find, pace), { applied: false, prog: 'Old', found: 'Recent logs found: 4 recovery runs, avg /mi over your last 3 weeks.' });
    assert.deepEqual(seedView({ _seed: seed, _seedApplied: true }, find, pace), { applied: true, prog: 'Old' });
    assert.equal(seedView({ _seed: seed, _seedDismissed: true }, find, pace), null);
    const failed: { _seed?: unknown } = {};
    assert.equal(seedView(failed as never, () => { throw new Error('no'); }, pace), null);
    assert.equal(failed._seed, null, 'a failed read is kept as none');
  });

  it('pips each week of a race plan: behind the opening week, the opening week, the race; none when the plan starts later', () => {
    assert.deepEqual(alignedPips({ tw: 5, openWeek: 3 }), ['behind', 'behind', 'open', '', 'race']);
    assert.deepEqual(alignedPips({ tw: 2, openWeek: 2 }), ['behind', 'open']);
    assert.equal(alignedPips({ tw: 8, openWeek: 1, futureWeeks: 2 }), null);
  });
});
