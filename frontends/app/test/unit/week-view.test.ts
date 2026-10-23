// This Week (src/app/screens/week-view/week-view-model.ts, architecture phase E step 18), against the legacy
// renderWeekView it replaces: the phase label by program length, the phase pill's priority, the week buttons, the day
// strip's cells, the hero for a rest day, a session today and a browsed week, and the stat tiles. The legacy helpers
// are stood in by stubs that name what they were given; every expected value is typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { phaseLabel, type WeekDeps, type WeekInput, type WeekProgram, weekView } from '../../src/app/screens/week-view/week-view-model.ts';

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
  dayCode: (day) => (!day || day.rest ? { top: '', topColor: '#5f5f62', bot: 'REST', botColor: '#5f5f62' } : { top: 'RUN', topColor: '#5e8c54', bot: 'PUSH', botColor: '#bc6a43' }),
  onGold: (hex) => `gold(${hex})`, wildcardOn: () => false, statusOf: () => undefined,
  heroSummary: (day) => `${day.title}<br>summary`, sessionTime: () => 45, restTip: () => ({ label: 'Fuel', text: 'Eat.', src: 'NSW' }),
  restLines: (rl) => Object.keys(rl || {}).map((t) => `20 min ${t} logged`), streak: () => 3, wildcardSub: (w, k) => `sub ${w} ${k}`,
  liveInjury: () => null, alignment: () => null, raceDay: (iso) => `day(${iso})`, completedKey: (w, d) => `w${w}_${d}`, logKey: (w, d) => `w${w}_${d}`,
  ...over,
});
const input = (over: Partial<WeekInput> = {}): WeekInput => ({
  prog: PROG, week: 1, actualWeek: 1, today: new Date(2026, 9, 7), weekMon: new Date(2026, 9, 5), completed: {}, logs: {}, dayFull: DAY_FULL, ...over,
});

describe('This Week', () => {
  it('labels the phase by thirds up to eight weeks and by a four-part split past that', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6].map((w) => phaseLabel(w, 6, false)), ['Phase 1 — Rebuild', 'Phase 1 — Rebuild', 'Phase 2 — Load', 'Phase 2 — Load', 'Phase 3 — Peak', 'Phase 3 — Peak']);
    // Eight weeks in thirds of 8/3: week 6 is (6 − 1) ÷ 2.67 → 1, still Build; week 7 → 2, Peak.
    assert.deepEqual([1, 3, 4, 6, 7].map((w) => phaseLabel(w, 8, false)), ['Phase 1 — Base', 'Phase 1 — Base', 'Phase 2 — Build', 'Phase 2 — Build', 'Phase 3 — Peak']);
    // Ten weeks: (w − 1)/10 against 0.30, 0.60 and 0.82, so weeks 4, 7 and 10 open Build, Peak and the last phase.
    assert.deepEqual([3, 4, 7, 9, 10].map((w) => phaseLabel(w, 10, true)), ['Phase 1 — Base', 'Phase 2 — Build', 'Phase 3 — Peak', 'Phase 3 — Peak', 'Phase 4 — Race Prep']);
    assert.deepEqual([phaseLabel(1, 16, false), phaseLabel(16, 16, true), phaseLabel(16, 16, false)], ['Phase 1 — Foundation', 'Phase 4 — Taper', 'Phase 4 — Peak & Hold']);
  });

  it('heads the week with the program name cut at 26 and the week number, and the phase in the pill', () => {
    const v = weekView(input(), deps());
    assert.deepEqual([v.overline, v.bigNum, v.pill], ['STRENGTH BLOCK WITH A LONG…', 'WEEK 1', { html: 'Phase 1 — Rebuild', cls: '' }]);
    assert.deepEqual(v.hurt, { icon: '[bandage/17]', injured: false, label: 'HURT?' });
    assert.deepEqual(v.start, { shown: 'Oct 5, 2026', iso: '2026-10-05' });
    assert.deepEqual(v.race, { aligned: false, iso: '', day: null });
  });

  it('puts an injury before travel, the taper and a recovery week in the pill, and washes the screen only for an injury', () => {
    const knee = { ...PROG, overlays: [{ type: 'injury', from: '2026-10-01', patch: { injury: { region: 'knee' } } }] };
    const hurt = weekView(input({ prog: knee }), deps({ weekRange: () => ({ fromWeek: 1, toWeek: 2 }) }));
    assert.deepEqual([hurt.pill, hurt.injuryWeek, hurt.hurt.label, hurt.hurt.injured], [{ html: 'Injury Week · Knee', cls: ' phase-pill--injury' }, true, 'KNEE', true]);
    assert.deepEqual(hurt.weeks.map((w) => w.label), ['Wk 1 ● ✦', 'Wk 2 ✦', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6']);
    assert.deepEqual(weekView(input({ prog: { ...PROG, overlays: [] } }), deps({ isTravel: (day) => !!day && !day.rest })).pill, { html: 'Maintenance Week', cls: ' phase-pill--recovery' });
    assert.deepEqual(weekView(input({ week: 6, prog: { ...PROG, taperWeeks: [5, 6] } }), deps()).pill, { html: '[🏁/13] Race Week', cls: ' phase-pill--recovery' });
    assert.deepEqual(weekView(input({ week: 5, prog: { ...PROG, taperWeeks: [5, 6] } }), deps()).pill.html, '[🏁/13] Race Taper');
    assert.deepEqual(weekView(input({ prog: { ...PROG, liftRecoveryWeeks: [1] } }), deps()).pill, { html: '↓ Recovery Week', cls: ' phase-pill--recovery' });
    const ended = { ...PROG, overlays: [{ type: 'injury', from: '2026-09-01', to: '2026-10-06', patch: { injury: { region: 'knee' } } }] };
    assert.equal(weekView(input({ prog: ended }), deps({ weekRange: () => ({ fromWeek: 1, toWeek: 1 }) })).injuryWeek, false, 'an overlay that ended yesterday is over');
  });

  it('draws the strip: today in its gold codes, the past and rest days dim, a done day ticked, a Wildcard marked, a skipped day crossed', () => {
    const v = weekView(input({ completed: { w1_mon: { status: 'complete' }, w1_thu: { status: 'skipped' } } }), deps({ wildcardOn: (w, d) => d === 'tue' }));
    const cells = v.days!.strip;
    assert.deepEqual(cells.map((c) => (c.pre ? 'pre' : [c.key, c.cls, c.center])), [
      ['mon', 'wk-day dim', { kind: 'check' }], ['tue', 'wk-day dim', { kind: 'wild' }], ['wed', 'wk-day today', { kind: 'num', text: '7' }],
      ['thu', 'wk-day', { kind: 'skip' }], ['fri', 'wk-day', { kind: 'num', text: '9' }], ['sat', 'wk-day', { kind: 'num', text: '10' }], ['sun', 'wk-day dim', { kind: 'num', text: '11' }],
    ]);
    const wed = cells[2]!, fri = cells[4]!, mon = cells[0]!;
    assert.ok(!wed.pre && !fri.pre && !mon.pre);
    assert.deepEqual([wed.top, wed.topColor, wed.bot, wed.botColor], ['—', 'gold(#5f5f62)', 'REST', 'gold(#5f5f62)']);
    assert.deepEqual([fri.top, fri.topColor, fri.botColor, mon.topColor], ['RUN', '#5e8c54', '#bc6a43', '#5f5f62']);
    const pre = weekView(input(), deps({ beforeStart: (w, d) => d === 'mon' })).days!.strip[0]!;
    assert.deepEqual(pre, { pre: true, label: 'MON', num: '5' });
  });

  it('makes today\'s rest day the hero, with its jog lines, Edit cardio and the tip', () => {
    const v = weekView(input({ logs: { w1_wed: { restLog: { walk: { mins: 20 } } } } }), deps());
    // v0.240.0 (D228 item 8): Edit cardio once a jog line prints (V238: Log more).
    assert.deepEqual(v.days!.hero, { kind: 'rest', key: 'wed', over: 'Today · Wednesday', lines: ['20 min walk logged'], logLabel: 'Edit cardio', anyway: true, tip: { label: 'Fuel', text: 'Eat.', src: 'NSW' } });
    assert.equal(v.days!.wildcard, 'sub 1 wed');
  });

  it('offers no "Training anyway?" on a rest day whose session moved away, and Log cardio with no jog (v0.240.0, D231)', () => {
    const moved: WeekProgram = { ...PROG, weeks: { ...PROG.weeks, 1: { ...PROG.weeks[1]!, wed: { rest: true, moved: true } } } };
    const v = weekView(input({ prog: moved }), deps());
    assert.deepEqual(v.days!.hero, { kind: 'rest', key: 'wed', over: 'Today · Wednesday', lines: [], logLabel: 'Log cardio', anyway: false, tip: { label: 'Fuel', text: 'Eat.', src: 'NSW' } });
  });

  it('makes today\'s session the hero with START SESSION, and a closed day OPEN SESSION with its status', () => {
    const today = weekView(input({ today: new Date(2026, 9, 9) }), deps());
    const h = today.days!.hero;
    assert.ok(h.kind === 'day');
    assert.deepEqual([h.key, h.today, h.over, h.title, h.time, h.summary, h.cta], ['fri', true, 'Today · Friday', 'Push', '~45 MIN', 'Push<br>summary', 'START SESSION']);
    const closed = weekView(input({ today: new Date(2026, 9, 9) }), deps({ statusOf: () => 'complete' })).days!.hero;
    assert.ok(closed.kind === 'day');
    assert.deepEqual([closed.status, closed.cta], ['Done ✓ Closed out. Open the session to undo.', 'OPEN SESSION']);
    assert.equal(h.travel, false);
    const away = weekView(input({ today: new Date(2026, 9, 9) }), deps({ isTravel: (day) => !!day && day.title === 'Push' })).days!.hero;
    assert.ok(away.kind === 'day' && away.travel, 'a travel day carries the travel tag');
  });

  it('browses another week from its first training day, with its tags and where it moved from', () => {
    const moved = { ...PROG, weeks: { ...PROG.weeks, 2: { ...PROG.weeks[2], mon: { ...lift('Upper', ['lift', 'run', 'mystery']), movedFrom: 'sun' } } } };
    const h = weekView(input({ week: 2, prog: moved }), deps()).days!.hero;
    assert.ok(h.kind === 'day');
    assert.deepEqual([h.key, h.today, h.over, h.cta], ['mon', false, 'Week 2 · Monday · moved from Sunday', 'OPEN SESSION']);
    assert.deepEqual(h.tags, [
      { label: 'Lift', style: 'color:#bc6a43;background:rgba(188,106,67,0.15)' },
      { label: 'Run', style: 'color:#5e8c54;background:rgba(94,140,84,0.15)' },
      { label: 'mystery', style: 'color:#181712;background:rgba(24,23,18,0.15)' },
    ]);
    assert.equal(weekView(input({ week: 3 }), deps()).days, null, 'a week with no days draws no list');
  });

  it('counts the training days done, the miles with the rest-day jog, and the streak', () => {
    const v = weekView(input({
      completed: { w1_mon: { status: 'complete' }, w1_thu: {}, w1_fri: { status: 'skipped' } },
      logs: { w1_mon: { run_dist: '3.25' }, w1_tue: { restLog: { run: { dist: 1.1 }, walk: { dist: 2 } } }, w1_sat: { run_dist: 'x' } },
    }), deps());
    assert.deepEqual(v.days!.stats, { done: 2, of: 4, miles: 4.4, streak: 3 });
  });
});
