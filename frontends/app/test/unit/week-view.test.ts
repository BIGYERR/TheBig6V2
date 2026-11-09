// This Week (src/app/screens/week-view/week-view-model.ts): D276 P-WEEKSCREEN, Mario's redesign
// (docs/decisions/this-week.md), with D272's run and lift cards (docs/decisions/gps-recording.md). The phase label and
// the pill's order are the legacy renderWeekView's; the week titles, the Sunday first day strip, the picked day and its
// cards are the redesign's. The legacy helpers are stood in by stubs that name what they were given; every expected
// value is typed here from the ruling and the calendar: the program starts Monday Oct 5, 2026, so title 1 runs Sunday
// Oct 4 (before the program, empty) to Saturday Oct 10, and title 2 opens on week 1's Sunday, Oct 11.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type Column, phaseLabel, type WeekDeps, type WeekInput, type WeekProgram, weekView } from '../../src/app/screens/week-view/week-view-model.ts';

const DAY_FULL = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
const lift = (title: string, tags: string[] = ['lift']) => ({ title, tags, sections: [] });
const PROG: WeekProgram = {
  name: 'Strength Block With A Long Name Over 26', totalWeeks: 6, startDate: '2026-10-05',
  weeks: {
    1: { mon: lift('Upper', ['lift', 'run', 'mystery']), tue: { rest: true }, wed: { rest: true }, thu: lift('Lower'), fri: lift('Push'), sat: lift('Pull'), sun: { rest: true } },
    2: { mon: lift('Upper'), tue: lift('Lower'), wed: { rest: true }, thu: lift('Push'), fri: lift('Pull'), sat: { rest: true }, sun: { rest: true } },
  },
};
const deps = (over: Partial<WeekDeps> = {}): WeekDeps => ({
  weekRange: () => null, parseDate: (iso) => new Date(iso + 'T00:00:00'), isTravel: () => false, beforeStart: () => false,
  regionLabel: (r) => ({ knee: 'Knee' })[r], icon: (n, s) => `[${n}/${s}]`,
  liftFocus: (t) => String(t).toUpperCase().slice(0, 5), runChip: (s) => `chip(${s})`,
  wildcardOn: () => false, statusOf: () => undefined,
  heroSummary: (day) => `${day.title}<br>summary`, sessionTime: () => 45, restTip: () => ({ label: 'Fuel', text: 'Eat.', src: 'NSW' }),
  restLines: (rl) => Object.keys(rl || {}).map((t) => `20 min ${t} logged`), streak: () => 3, wildcardSub: (w, k) => `sub ${w} ${k}`,
  liveInjury: () => null, alignment: () => null, shortDay: (iso) => `day(${iso})`, completedKey: (w, d) => `w${w}_${d}`, logKey: (w, d) => `w${w}_${d}`,
  ...over,
});
const input = (over: Partial<WeekInput> = {}): WeekInput => ({
  prog: PROG, shown: 1, picked: null, actualWeek: 1, today: new Date(2026, 9, 7), weekMon: new Date(2026, 9, 5), completed: {}, logs: {}, dayFull: DAY_FULL, gps: false, ...over,
});
const live = (c: Column) => (c.empty ? null : c);

describe('This Week', () => {
  it('labels the phase by thirds up to eight weeks and by a four-part split past that', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6].map((w) => phaseLabel(w, 6, false)), ['Phase 1 — Rebuild', 'Phase 1 — Rebuild', 'Phase 2 — Load', 'Phase 2 — Load', 'Phase 3 — Peak', 'Phase 3 — Peak']);
    // Eight weeks in thirds of 8/3: week 6 is (6 − 1) ÷ 2.67 → 1, still Build; week 7 → 2, Peak.
    assert.deepEqual([1, 3, 4, 6, 7].map((w) => phaseLabel(w, 8, false)), ['Phase 1 — Base', 'Phase 1 — Base', 'Phase 2 — Build', 'Phase 2 — Build', 'Phase 3 — Peak']);
    // Ten weeks: (w − 1)/10 against 0.30, 0.60 and 0.82, so weeks 4, 7 and 10 open Build, Peak and the last phase.
    assert.deepEqual([3, 4, 7, 9, 10].map((w) => phaseLabel(w, 10, true)), ['Phase 1 — Base', 'Phase 2 — Build', 'Phase 3 — Peak', 'Phase 3 — Peak', 'Phase 4 — Race Prep']);
    assert.deepEqual([phaseLabel(1, 16, false), phaseLabel(16, 16, true), phaseLabel(16, 16, false)], ['Phase 1 — Foundation', 'Phase 4 — Taper', 'Phase 4 — Peak & Hold']);
  });

  it('heads the screen with the program name cut at 26, the week titles ending on Last day, the phase pill and the Program start box', () => {
    const v = weekView(input(), deps());
    assert.deepEqual([v.overline, v.pill], ['Strength Block With A Long…', { html: 'Phase 1 — Rebuild', cls: '' }]);
    assert.deepEqual(v.titles.map((t) => (t.active ? '[' + t.title + ']' : t.title)), ['[Week 1]', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Last day']);
    assert.deepEqual(v.hurt, { injured: false, label: 'Hurt?' });
    assert.deepEqual(v.row, { kind: 'start', shown: 'Oct 5, 2026', iso: '2026-10-05' });
  });

  it('puts an injury before travel, the taper and a recovery week in the pill, and washes the screen only for an injury', () => {
    const knee = { ...PROG, overlays: [{ type: 'injury', from: '2026-10-01', patch: { injury: { region: 'knee' } } }] };
    const hurt = weekView(input({ prog: knee }), deps({ weekRange: () => ({ fromWeek: 1, toWeek: 2 }) }));
    assert.deepEqual([hurt.pill, hurt.injuryWeek, hurt.hurt.label, hurt.hurt.injured], [{ html: 'Injury Week · Knee', cls: ' phase-pill--injury' }, true, 'Knee', true]);
    assert.deepEqual(weekView(input({ prog: { ...PROG, overlays: [] } }), deps({ isTravel: (day) => !!day && !day.rest })).pill, { html: 'Maintenance Week', cls: ' phase-pill--recovery' });
    assert.deepEqual(weekView(input({ shown: 6, prog: { ...PROG, taperWeeks: [5, 6] } }), deps()).pill, { html: '[🏁/13] Race Week', cls: ' phase-pill--recovery' });
    assert.deepEqual(weekView(input({ shown: 5, prog: { ...PROG, taperWeeks: [5, 6] } }), deps()).pill.html, '[🏁/13] Race Taper');
    assert.deepEqual(weekView(input({ prog: { ...PROG, liftRecoveryWeeks: [1] } }), deps()).pill, { html: '↓ Recovery Week', cls: ' phase-pill--recovery' });
    const ended = { ...PROG, overlays: [{ type: 'injury', from: '2026-09-01', to: '2026-10-06', patch: { injury: { region: 'knee' } } }] };
    assert.equal(weekView(input({ prog: ended }), deps({ weekRange: () => ({ fromWeek: 1, toWeek: 1 }) })).injuryWeek, false, 'an overlay that ended yesterday is over');
  });

  it('on a race plan ends the titles on Race Day, counts down to it, and reads Race Day in the pill under that title', () => {
    const race = deps({ alignment: () => ({ raceIso: '2026-11-15' }) });
    const v = weekView(input({ prog: { ...PROG, cfg: { raceDate: '2026-11-15' } } }), race);
    assert.equal(v.titles[6]!.title, 'Race Day');
    // Wednesday Oct 7 to Sunday Nov 15 is 39 days.
    assert.deepEqual(v.row, { kind: 'race', big: '39 days out', small: 'Race day day(2026-11-15)', iso: '2026-11-15' });
    assert.deepEqual(weekView(input({ shown: 7, prog: { ...PROG, cfg: { raceDate: '2026-11-15' } } }), race).pill, { html: 'Race Day', cls: ' phase-pill--recovery' });
  });

  it('draws the day strip Sunday first: week 1\'s Sunday empty, a done day ticked, a Wildcard marked, a skipped day crossed, sessions to come filled', () => {
    const v = weekView(input({ completed: { w1_mon: { status: 'complete' }, w1_thu: { status: 'skipped' } } }), deps({ wildcardOn: (w, d) => d === 'tue' }));
    const cells = v.days!.strip;
    assert.deepEqual(cells[0], { empty: true, letter: 'S', num: '4' });
    assert.deepEqual(cells.slice(1).map((c) => { const l = live(c)!; return [l.key, l.mark, l.filled, l.word, l.wordColor, l.today]; }), [
      ['mon', 'check', false, 'UPPER', 'var(--dim)', false], ['tue', 'wild', false, 'REST', 'var(--dim)', false], ['wed', 'num', false, 'REST', 'var(--dim)', true],
      ['thu', 'skip', false, 'LOWER', 'var(--dim)', false], ['fri', 'num', true, 'PUSH', 'var(--lift)', false], ['sat', 'num', true, 'PULL', 'var(--lift)', false],
    ]);
    assert.equal(live(cells[1]!)!.label, 'Monday 5, Upper, done');
    assert.deepEqual(weekView(input({ shown: 2 }), deps()).days!.strip.map((c) => (c.empty ? 'empty' : c.week + c.key + c.num)), ['1sun11', '2mon12', '2tue13', '2wed14', '2thu15', '2fri16', '2sat17']);
    assert.deepEqual(weekView(input(), deps({ beforeStart: (w, d) => d === 'mon' })).days!.strip[1], { empty: true, letter: 'M', num: '5' });
  });

  it('picks today\'s rest day into a rest card with its jog lines, Edit cardio, both links and the tip', () => {
    const v = weekView(input({ logs: { w1_wed: { restLog: { walk: { mins: 20 } } } } }), deps());
    assert.equal(v.days!.picked, 3);
    // v0.240.0 (D228 item 8): Edit cardio once a jog line prints (V238: Log more).
    assert.deepEqual(v.days!.rest, { week: 1, key: 'wed', when: 'Today · Wednesday', lines: ['20 min walk logged'], logLabel: 'Edit cardio', anyway: true });
    assert.deepEqual(v.days!.tip, { label: 'Fuel', text: 'Eat.', src: 'NSW' });
    assert.deepEqual(v.days!.cards, []);
    assert.equal(v.days!.wildcard, 'sub 1 wed');
  });

  it('offers no "Training anyway?" on a rest day whose session moved away, and Log cardio with no jog (v0.240.0, D231)', () => {
    const moved: WeekProgram = { ...PROG, weeks: { ...PROG.weeks, 1: { ...PROG.weeks[1]!, wed: { rest: true, moved: true } } } };
    assert.deepEqual(weekView(input({ prog: moved }), deps()).days!.rest, { week: 1, key: 'wed', when: 'Today · Wednesday', lines: [], logLabel: 'Log cardio', anyway: false });
  });

  it('picks today\'s session into its card with Start session, a closed day into a done row, and the next session when today is done', () => {
    const fri = new Date(2026, 9, 9);
    const v = weekView(input({ today: fri }), deps());
    assert.equal(v.days!.picked, 5);
    assert.deepEqual(v.days!.cards, [{ kind: 'lift', week: 1, key: 'fri', first: true, label: 'Today · Friday', title: 'Push', meta: '~45 min', blurb: 'Push', button: { text: 'Start session', act: 'deck', glow: true }, done: null }]);
    const closed = weekView(input({ today: fri }), deps({ statusOf: () => 'complete' })).days!.cards[0]!;
    assert.deepEqual([closed.button, closed.done], [null, { title: 'Push', line: 'Closed out' }]);
    assert.equal(weekView(input({ today: fri }), deps({ isTravel: (day) => !!day && day.title === 'Push' })).days!.cards[0]!.meta, '~45 min · Travel');
    // Monday done, so a Monday at the screen picks the next session still to do: Thursday (Tuesday and Wednesday rest).
    assert.equal(weekView(input({ today: new Date(2026, 9, 5), completed: { w1_mon: { status: 'complete' } } }), deps()).days!.picked, 4);
  });

  it('opens a title to come on its Monday, with where a session moved from; a title with no program week draws no days', () => {
    const moved = { ...PROG, weeks: { ...PROG.weeks, 2: { ...PROG.weeks[2], mon: { ...lift('Upper'), movedFrom: 'sun' } } } };
    const v = weekView(input({ shown: 2, prog: moved }), deps());
    assert.equal(v.days!.picked, 1);
    assert.equal(v.days!.cards[0]!.label, 'Monday, Oct 12 · moved from Sunday');
    assert.equal(weekView(input({ shown: 2, picked: 0 }), deps()).days!.rest!.key, 'sun', 'a picked Sunday is the week before\'s');
    assert.equal(weekView(input({ shown: 3 }), deps()).days, null);
  });

  it('puts the lift first only when lifting is the program\'s priority, Record run on the run card with the plugin, and a ride\'s own hand log', () => {
    const both = { title: 'Upper', sections: [{ items: [1] }], cardio: { type: 'run', subtype: 'Easy Run', dose: { k: 'time', mins: 30, tgt: 600 } } };
    const strength: WeekProgram = { ...PROG, liftingFocus: 'strength', weeks: { 1: { ...PROG.weeks[1]!, fri: both } } };
    const today = new Date(2026, 9, 9);
    const s = weekView(input({ prog: strength, today, gps: true }), deps()).days!.cards;
    assert.deepEqual(s.map((k) => [k.kind, k.label, k.button && k.button.text, k.button && k.button.glow]), [['lift', 'Today · Friday', 'Start lift', true], ['run', 'Then run', 'Record run', false]]);
    assert.equal(s[1]!.meta, '30 min · 10:00/mi');
    const event = weekView(input({ prog: { ...strength, primaryPath: 'event' }, today, gps: true }), deps()).days!.cards;
    assert.deepEqual(event.map((k) => [k.kind, k.label]), [['run', 'Today · Friday'], ['lift', 'Then lift']]);
    const ride: WeekProgram = { ...PROG, weeks: { 1: { ...PROG.weeks[1]!, fri: { title: 'Ride', cardio: { type: 'bike', subtype: 'Sweet Spot (CHI)' } } } } };
    assert.deepEqual(weekView(input({ prog: ride, today, gps: true }), deps()).days!.cards[0]!.button, { text: 'Log the ride', act: 'log', glow: true });
  });

  it('counts the training days done and the miles over the seven days the strip shows, the week before\'s Sunday jog included, and the streak', () => {
    const v = weekView(input({
      shown: 2,
      completed: { w2_mon: { status: 'complete' }, w2_tue: {}, w2_thu: { status: 'skipped' } },
      logs: { w1_sun: { restLog: { run: { dist: 1 }, walk: { dist: 2 } } }, w2_mon: { run_dist: '3.5' }, w2_fri: { run_dist: 'x' } },
    }), deps());
    assert.deepEqual(v.days!.stats, { done: 2, of: 4, miles: 4.5, streak: 3 });
  });
});
