// The Progress screen's arrangement (src/app/screens/progress/progress-model.ts, architecture phase E step 13), against
// the legacy renderProgressScreen it replaces: which program is shown, the weekly sums, the charts in the legacy order
// with the legacy arguments (the builders stood in by stubs that record each call), the Session Journal and the 1RM
// estimate. Every expected value is typed here from the legacy code, the estimate by hand.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dotChart } from '../../src/app/screens/progress/charts/dot-chart-model.ts';
import { type ChartBlock, type ChartDeps, type ChartInput, chartChunks, estimate1RM, journalWeeks, rpeColor, viewedProgram, weeklySums } from '../../src/app/screens/progress/progress-model.ts';

const A = { id: 'a' }, B = { id: 'b', archived: true }, C = { id: 'c' };

/** Stub builders: each returns a tag naming its call, so the chart list reads as the legacy call order. */
function stubs(over: Partial<ChartDeps> = {}): { deps: ChartDeps; calls: string[] } {
  const calls: string[] = [];
  const tag = (name: string) => (..._a: unknown[]) => (calls.push(name), `<${name}>`);
  const deps: ChartDeps = {
    icon: (n) => `[${n}]`,
    dotChart,
    ladderWeekly: () => 'LW', ladderChart: tag('ladder'), easyVsPrescribed: () => 'EZ', easyZoneChart: () => '',
    runsByClass: () => 'RC', easyBandsFallback: tag('bands'),
    easyEffortWeekly: () => ({ nRuns: 0, nWeeks: 0 }), easyMinRuns: 6, easyEffortChart: tag('effort'), projectionCard: tag('projection'),
    recoveryPaceWeekly: () => ({ nWeeks: 0, weekly: {}, tgt: null }), paceChart: tag('pace'), easyEffortEmpty: tag('effortEmpty'),
    plannedVsLogged: () => 'PVL', driftChart: tag('drift'), exWeights: () => ({}), ledgerModel: () => 'LM', ledgerCards: tag('ledger'),
    ...over,
  };
  return { deps, calls };
}
/** A block as a line: a dot chart by its title, a legacy builder by its markup. */
const line = (b: ChartBlock) => (b.kind === 'dot' ? 'dot ' + b.spec.title : b.html);

function input(over: Partial<ChartInput> = {}): ChartInput {
  const sums = weeklySums({}, {}, 3);
  return { logs: {}, hist: {}, sums, totalWeeks: 3, cardioTypes: [], cut: 0, skip1: false, raceMi: 0, cfg: {}, ...over };
}

describe('the Progress screen', () => {
  it('shows the program asked for, else the active one, else the first unarchived, else the first', () => {
    assert.deepEqual(viewedProgram([A, B, C], 'b', 'c', true), { prog: B, reset: false });
    assert.deepEqual(viewedProgram([A, B, C], 'gone', 'c', true), { prog: C, reset: true });
    assert.deepEqual(viewedProgram([B, C], null, 'c', false), { prog: C, reset: true });
    assert.deepEqual(viewedProgram([B], null, null, false), { prog: B, reset: true });
  });

  it('sums each week: run, bike and swim with the rest-day jog, the running mean RPE, sessions, and the best big-three load', () => {
    const sums = weeklySums({
      w1_mon: { run_dist: '3', rpe: '6', notes: 'ok' },
      w1_wed: { rpe: 8, restLog: { run: { dist: 1.5, rpe: 4 }, walk: { mins: 20, rpe: 2 } } },
      w2_tue: { bike_mins: '40', swim_yards: 500 },
      w9_sat: { run_dist: 5 },
      junk: { run_dist: 2 },
    }, {
      a: { name: 'Back squat', entries: [{ week: 1, weight: 225 }, { week: 1, weight: '245' }, { week: 2, weight: 0 }] },
      b: { name: 'Goblet squat', entries: [{ week: 1, weight: 90 }] },
      c: { name: 'Bench dip', entries: [{ week: 1, weight: 45 }] },
    }, 2);
    // w1: RPE 6, then (6+8)/2 = 7, then the run jog's 4: (7+4)/2 = 5.5, then the walk's 2: (5.5+2)/2 = 3.75.
    assert.deepEqual(sums[1], { run: 4.5, bike: 0, swim: 0, bench: null, squat: 245, dead: null, rpe: 3.75, sessions: 2 });
    assert.deepEqual(sums[2], { run: 0, bike: 40, swim: 500, bench: null, squat: null, dead: null, rpe: null, sessions: 1 });
    assert.equal(sums[9], undefined);
  });

  it('charts a run program in the legacy order: mileage, ladder, the zone or its fallback, then the effort trend or its stand-ins, drift', () => {
    const { deps, calls } = stubs();
    const sums = weeklySums({ w1_mon: { run_dist: 3 }, w2_mon: { run_dist: 4, rpe: 6 } }, {}, 3);
    const out = chartChunks(input({ sums, cardioTypes: ['run'], skip1: true }), deps);
    assert.deepEqual(out.map(line), ['dot [🏃] Weekly Running Mileage', '<ladder>', '<bands>', '<drift>', 'dot [💡] Average Session RPE', '<ledger>']);
    assert.deepEqual(calls, ['ladder', 'bands', 'drift', 'ledger']);
    const [mileage, , , , rpe] = out;
    assert.ok(mileage?.kind === 'dot' && rpe?.kind === 'dot');
    assert.deepEqual([mileage.spec.points.length, mileage.spec.total, mileage.spec.unit, mileage.spec.color], [1, '4.0', 'mi', 'var(--run)'], 'the short first week withheld');
    assert.deepEqual([rpe.spec.total, rpe.spec.unit, rpe.spec.color, rpe.spec.grid.map((g) => g.label)], ['6.0', '', '#7e5e96', [0, 5, 10]], 'RPE on a scale of 10');
  });

  it('draws the effort chart and the projection once there are enough easy runs over two weeks, and the pace chart or its empty state below that', () => {
    const run = (o: Partial<ChartDeps>) => {
      const s = stubs(o);
      chartChunks(input({ cardioTypes: ['run'] }), s.deps);
      return s.calls.slice(2, -1);
    };
    assert.deepEqual(run({ easyEffortWeekly: () => ({ nRuns: 6, nWeeks: 2 }) }), ['effort', 'projection', 'drift']);
    assert.deepEqual(run({ easyEffortWeekly: () => ({ nRuns: 5, nWeeks: 3 }), recoveryPaceWeekly: () => ({ nWeeks: 2, weekly: { 2: 540 }, tgt: 600 }) }), ['pace', 'drift']);
    assert.deepEqual(run({ easyEffortWeekly: () => ({ nRuns: 2, nWeeks: 1 }) }), ['effortEmpty', 'drift']);
    assert.deepEqual(run({}), ['drift']);
  });

  it('charts swim and bike when there is something to chart, planned or not, and only the ledger with nothing else', () => {
    const { deps, calls } = stubs();
    const planned = chartChunks(input({ sums: weeklySums({ w3_fri: { bike_mins: 30 } }, {}, 3), cardioTypes: ['swim'] }), deps);
    assert.deepEqual(planned.map(line), ['dot [🚴] Weekly Cycling Time', '<ledger>'], 'a planned swim with nothing logged draws nothing, as before');
    const logged = chartChunks(input({ sums: weeklySums({ w2_sat: { swim_yards: 800 } }, {}, 3) }), deps);
    assert.deepEqual(logged.map(line), ['dot [🏊] Weekly Swimming Volume', '<ledger>'], 'a logged swim charts without a plan');
    assert.deepEqual(calls, ['ledger', 'ledger']);
    assert.deepEqual(chartChunks(input(), stubs().deps), [{ kind: 'html', html: '<ledger>' }]);
  });

  it('groups the journal by week in time, opens only the latest week, and keeps markup as markup', () => {
    const weeks = journalWeeks({
      w2_tue: { rpe: '9', ts: 5 },
      w1_fri: { notes: 'Tired <b>legs</b>', ts: 2 },
      w1_mon: { swapFrom: 'run', swapTo: 'row', ts: 9, restLog: { walk: { mins: 20, rpe: 3 } } },
      w1_sat: { ts: 1 },
      'w3-mon': { rpe: 5 },
    }, { rpeLabel: (r) => ({ 9: 'Near max' })[r], jogLines: (rl) => (rl ? ['20 min walk logged · RPE 3'] : []), icon: (n) => `[${n}]` });
    assert.deepEqual(weeks.map((w) => [w.week, w.open, w.count]), [[1, false, '2 entries'], [2, true, '1 entry']]);
    assert.deepEqual(weeks[0]!.entries[0], { day: 'Fri', headMb: 6, rpe: null, swap: null, jogLines: [], jogMb: 6, notes: '"Tired <b>legs</b>"' });
    assert.deepEqual(weeks[0]!.entries[1], {
      day: 'Mon', headMb: 6, rpe: null, swap: { html: '[history] Swapped Run → row', mb: 6 }, jogLines: ['20 min walk logged · RPE 3'], jogMb: 0, notes: null,
    });
    assert.deepEqual(weeks[1]!.entries[0]!.rpe, { text: 'RPE 9 — Near max', color: 'var(--red)' });
  });

  it('colours an RPE by its band', () => {
    assert.deepEqual([undefined, '', 10, 9, 8, 7, 6, 5, 4, 1].map((r) => rpeColor(r)), [
      'var(--muted)', 'var(--muted)', 'var(--red)', 'var(--red)', 'var(--lift)', 'var(--lift)', 'var(--accent)', 'var(--accent)', 'var(--run)', 'var(--run)',
    ]);
  });

  it('estimates a one-rep max: a single is itself, else Epley to the nearest 5, nothing without both numbers', () => {
    // 225 × (1 + 5/30) = 262.5 → 265; 100 × (1 + 3/30) = 110 → 110; 135 × (1 + 8/30) = 171 → 170.
    assert.deepEqual([estimate1RM('225', '5'), estimate1RM('100', '3'), estimate1RM('135', '8'), estimate1RM('315', '1')], [265, 110, 170, 315]);
    assert.deepEqual([estimate1RM('', '5'), estimate1RM('225', ''), estimate1RM('0', '5'), estimate1RM('abc', '5')], [null, null, null, null]);
  });
});
