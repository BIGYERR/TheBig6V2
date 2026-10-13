// The session sheet's log (src/app/screens/day-detail/session-log-model.ts, architecture phase E), against the legacy
// buildLogHTML it replaces: which sport the log holds, the slider's words, the chips and the swap note, the dose it
// sets for the fields, and the fields asked for. The legacy helpers are stand-ins that name what was asked for, so
// every expected value is typed here from the legacy builder.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chipStyle, logPlan, sessionLog, type SessionLogReads } from '../../src/app/screens/day-detail/session-log-model.ts';

function reads(calls: string[]): SessionLogReads {
  return {
    rpeLabels: { 7: 'Hard', 10: 'Max' },
    dose: (c) => ({ dose: (c as { type: string }).type }),
    setDoseFull: (d) => calls.push('full ' + JSON.stringify(d)),
    setSub: (s) => calls.push('sub ' + s),
    setDose: (d) => calls.push('dose ' + JSON.stringify(d)),
    fields: (sport, _e, dose, sub) => ({ kind: 'swim', yards: `[fields ${sport} ${JSON.stringify(dose)} ${sub}]` }),
    live: (e, sport) => sport === 'run' ? !!e['run_dist'] : !!e[sport + '_mins'],
    noteText: (active, planned) => `[note ${active} over ${planned}]`,
    logLabel: (live) => (live ? 'Logged ✓' : 'Log'),
  };
}

describe('the session log', () => {
  it('gives a field only to a run, ride or swim, and reopens on the sport a swap recorded', () => {
    assert.deepEqual(logPlan({}, 'Run'), { planned: 'run', hasCardio: true, active: 'run', swapped: false });
    assert.deepEqual(logPlan({ swapTo: 'bike' }, 'run'), { planned: 'run', hasCardio: true, active: 'bike', swapped: true });
    assert.deepEqual(logPlan({}, 'Rower'), { planned: 'rower', hasCardio: false, active: 'rower', swapped: false });
    assert.deepEqual(logPlan({ swapTo: 'bike' }, undefined), { planned: '', hasCardio: false, active: 'bike', swapped: false });
  });

  it('draws a lifting day: the slider at 5 saying "Move slider" until an RPE is logged, no cardio, the notes as written', () => {
    const calls: string[] = [];
    const blank = sessionLog({}, null, reads(calls));
    assert.deepEqual(blank, { view: { rpeValue: '5', rpeText: 'Move slider', cardio: null, notes: '' }, fields: { kind: 'none' } });
    assert.deepEqual(calls, ['full null', 'sub ', 'dose null']);
    const logged = sessionLog({ rpe: 7, notes: 'Good &amp; <b>fast</b>' }, null, reads([]));
    assert.deepEqual([logged.view.rpeValue, logged.view.rpeText, logged.view.notes], ['7', '7 — Hard', 'Good &amp; <b>fast</b>']);
    assert.equal(sessionLog({ rpe: '3' }, null, reads([])).view.rpeText, '3 — ', 'an RPE with no label keeps its dash');
  });

  it('draws a planned run: the dose set in full, the fields for the run, the chips with the run planned, the picker shut', () => {
    const calls: string[] = [];
    const d = sessionLog({ run_dist: '3.1' }, { type: 'run', subtype: 'Long Run' }, reads(calls));
    assert.deepEqual(calls, ['full {"dose":"run"}', 'sub Long Run', 'dose {"dose":"run"}']);
    assert.deepEqual(d.fields, { kind: 'swim', yards: '[fields run {"dose":"run"} Long Run]' });
    assert.deepEqual(d.view.cardio, {
      planned: 'run', active: 'run', logged: true, swapped: false,
      chips: [
        { sport: 'run', style: chipStyle(true), label: 'Run · planned' },
        { sport: 'bike', style: chipStyle(false), label: 'Bike' },
        { sport: 'swim', style: chipStyle(false), label: 'Swim' },
      ],
      note: '', logLabel: 'Logged ✓',
    });
  });

  it('draws a run logged as a ride: no dose for the fields, the ride chip on, the note shown, logged by the ride\'s minutes', () => {
    const calls: string[] = [];
    const d = sessionLog({ swapTo: 'bike', bike_mins: '40', run_dist: '2' }, { type: 'run' }, reads(calls));
    assert.deepEqual(calls, ['full {"dose":"run"}', 'sub ', 'dose null']);
    assert.deepEqual(d.fields, { kind: 'swim', yards: '[fields bike null ]' });
    const c = d.view.cardio!;
    assert.deepEqual([c.active, c.swapped, c.logged, c.note, c.logLabel], ['bike', true, true, '[note bike over run]', 'Logged ✓']);
    assert.deepEqual(c.chips.map((ch) => [ch.label, ch.style === chipStyle(true)]), [['Run · planned', false], ['Bike', true], ['Swim', false]]);
  });

  it('styles a chip orange edged when it is the sport logged', () => {
    assert.equal(chipStyle(true), 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:4px;cursor:pointer;border:1px solid var(--accent);background:rgba(24,23,18,0.12);color:var(--accent);font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.02em');
    assert.equal(chipStyle(false), 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:4px;cursor:pointer;border:1px solid var(--border2);background:var(--surface2);color:var(--muted);font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.02em');
  });
});
