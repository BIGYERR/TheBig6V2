// The session log's cardio fields and wheels (src/app/screens/day-detail/cardio-fields-model.ts, architecture phase E),
// against the legacy cardioFieldHTML, _doseStripHTML and iaWheelHTML they replace. The wheel spec is typed here from
// the legacy _IAW_SPEC, and every expected value from the legacy builders.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cardioFields, type FieldReads, planStrip, wheelFace, wheelRows, wheelView, wheelWraps } from '../../src/app/screens/day-detail/cardio-fields-model.ts';

const SPEC = {
  dist: { fmt: 'dec3', cap: 'Miles', cols: [{ min: 0, max: 99, wrap: false }, { min: 0, max: 9, dot: true }, { min: 0, max: 9 }] },
  pace: { fmt: 'clock', cap: 'Pace / mile', cols: [{ min: 4, max: 17, nil: true }, { min: 0, max: 59, pad: 2 }] },
  rept: { fmt: 'clock', cap: 'Typical rep', cols: [{ min: 0, max: 9, wrap: false }, { min: 0, max: 59, pad: 2 }] },
  hms: { fmt: 'hms', cap: 'Time', cols: [{ min: 0, max: 9, wrap: false }, { min: 0, max: 59, pad: 2 }, { min: 0, max: 59, pad: 2 }] },
};
const READS: FieldReads = { spec: SPEC, sessionCode: (sub) => (/interval/i.test(sub) ? 'INT' : 'RUN'), pace: (s) => (s ? `<${s}>` : null) };

describe('the cardio fields', () => {
  it('lists a column\'s rows, the dash first where it has one, wraps a column without a dash unless it says not, and faces each row', () => {
    assert.deepEqual(wheelRows({ min: 4, max: 6, nil: true }), ['', '4', '5', '6']);
    assert.deepEqual([wheelWraps({ min: 0, max: 9, wrap: false }), wheelWraps({ min: 4, max: 17, nil: true }), wheelWraps({ min: 0, max: 59 })], [false, false, true]);
    assert.deepEqual([wheelFace({ min: 0, max: 9 }, ''), wheelFace({ min: 0, max: 9, dot: true }, '3'), wheelFace({ min: 0, max: 59, pad: 2 }, '7'), wheelFace({ min: 0, max: 9 }, '7')], ['—', '.3', '07', '7']);
  });

  it('draws a wheel: its caption, its plan, its hidden value, and a wrapping column five times over', () => {
    const w = wheelView(SPEC, 'hms', 'log_run_mins', 29.5, null, 25);
    assert.deepEqual([w.kind, w.hiddenId, w.value, w.cap, w.ncols, w.plan], ['hms', 'log_run_mins', '29.5', 'Time', 3, '25']);
    assert.deepEqual(w.cols.map((c) => [c.ci, c.wrap, c.len, c.items.length]), [[0, false, 10, 10], [1, true, 60, 300], [2, true, 60, 300]]);
    assert.deepEqual(w.cols[1]!.items.slice(59, 61), [{ v: '59', face: '59', nil: false }, { v: '0', face: '00', nil: false }]);
    const p = wheelView(SPEC, 'pace', 'log_run_pace', undefined, 'Pace');
    assert.deepEqual([p.value, p.cap, p.plan, p.cols[0]!.items[0], p.cols[0]!.len], ['', 'Pace', null, { v: '', face: '—', nil: true }, 15]);
  });

  it('heads a planned session with its strip: the sport and code, the planned amount, and a run\'s pace', () => {
    assert.deepEqual(planStrip('run', { k: 'time', mins: 25, tgt: 800 }, 'Recovery Run', READS), { bike: false, label: 'Run · Planned', value: '25 min @ <800>/mi' });
    assert.deepEqual(planStrip('run', { k: 'reps_dist', reps: 8, m: 400 }, 'Speed Run — Intervals', READS), { bike: false, label: 'Run — INT · Planned', value: '8 × 400m' });
    assert.deepEqual(planStrip('bike', { k: 'time', mins: 45, tgt: 800 }, '', READS), { bike: true, label: 'Bike · Planned', value: '45 min' });
  });

  it('gives a planned run the fixed dimension first showing the plan, the stamp of the plan read as blank, and a rep session its stepper', () => {
    const time = cardioFields('run', { run_mins: '26', run_dist: '' }, { k: 'time', mins: 25 }, '', READS);
    assert.ok(time.kind === 'time');
    assert.deepEqual([time.first.kind, time.first.value, time.first.plan, time.second.kind, time.second.plan], ['hms', '26', '25', 'dist', null]);
    const dist = cardioFields('run', { run_dist: '3.1' }, { k: 'dist', mi: 3.1 }, '', READS);
    assert.ok(dist.kind === 'dist');
    assert.deepEqual([dist.first.kind, dist.first.value, dist.first.plan, dist.second.kind], ['dist', '', '3.1', 'hms']);
    const reps = cardioFields('run', { run_reps: 5 }, { k: 'reps_time', reps: 6, mins: 3 }, '', READS);
    assert.ok(reps.kind === 'reps_time');
    assert.deepEqual([reps.stepper, reps.wheel.kind], [{ shown: '5', of: 'of 6 · 3 min each', stored: '5' }, 'dist']);
    const fresh = cardioFields('run', {}, { k: 'reps_dist', reps: 8, m: 400 }, '', READS);
    assert.ok(fresh.kind === 'reps_dist');
    assert.deepEqual([fresh.stepper, fresh.wheel.kind], [{ shown: '8', of: 'of 8', stored: '' }, 'rept']);
  });

  it('gives a plain run its distance and pace, a speed day its hint, a ride its time, a swim its yards, anything else nothing', () => {
    const run = cardioFields('run', { run_pace: '9:30' }, null, 'Speed Run — Fartlek', READS);
    assert.ok(run.kind === 'run');
    assert.deepEqual([run.speedHint, run.dist.kind, run.pace.value], [true, 'dist', '9:30']);
    const odd = cardioFields('run', {}, { k: 'mystery' }, '', READS);
    assert.deepEqual([odd.kind, odd.kind === 'run' && odd.speedHint], ['run', false]);
    const ride = cardioFields('bike', { bike_mins: '45' }, null, '', READS);
    assert.deepEqual([ride.kind, ride.kind === 'bike' && ride.strip, ride.kind === 'bike' && ride.wheel.value], ['bike', null, '45']);
    assert.deepEqual(cardioFields('swim', { swim_yards: 1500 }, null, '', READS), { kind: 'swim', yards: '1500' });
    assert.deepEqual(cardioFields('rower', {}, null, '', READS), { kind: 'none' });
  });
});
