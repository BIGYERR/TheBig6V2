// Race dates: the date and the countdown every surface prints, and the days a race-aligned program keeps behind the
// athlete. Rulings: D180 (P-BLOCKOPEN: refreshProgram's copy-back carries blockOpen, so the days between a race
// program's counted-back start and the day the athlete walked in stay behind them after a reboot) and D182
// (P-RACEDATE, with amendment (a): the race date is parsed once as a local date, and the countdown is live: days
// rounded before weeks are floored, nothing stored is read). The record is in the handoff and
// tests/measure/v221_rulings/p_active_ruling.md, tests/measure/v223_rulings/p_racedate_ruling.md.
//
// The countdown claims run under TZ=America/New_York and TZ=UTC (the phone's zone and CI's): the old UTC parse
// printed the day before in New York. The block open claims run in New York on a sample of the 402-config lattice and
// of the 46 wizard rows; tests/sweeps/race-date.test.js runs both whole.
//
// Oracles, typed by hand: "Sun, Dec 6, 2026" built from integers (Sakamoto's weekday, a typed month table) and checked
// against a typed weekday table; day counts as integer civil day differences, checked against the ruling's printed
// numbers; the Time out state table typed row by row from the ruling's table and the amendment's review phrases; the
// Nike plan lengths (5K 8, 10K 8, half 14, marathon 18 weeks) and Monday arithmetic for a race program's start; the
// After column of the D180 ruling's table, typed from the fixture's arithmetic.
process.env.TZ = 'America/New_York';
import { test, describe, beforeAll } from 'vitest';
import assert from 'node:assert/strict';
import type { Cfg } from '@ia/core';
import * as X from '../support/test-week.ts';
import * as R from '../support/race-date.ts';
import { loadApp, pinClock } from '../support/app.ts';
// ── the block open (D180), the clock on Thu 2026-09-24 12:00 ─────────────────────────────────────────────────────
const FIX_START = '2026-08-31', FIX_WEEKS = 14;
const AFTER = { W1pre: 'mon tue wed thu fri sat sun', W1done: '0 /0 DONE', toast: 'Before your start date', W4pre: 'mon tue wed', W4taps: 4, W4done: '0 /3 DONE', sched: 1, streak: 0 };
const PRE_REST_DAYS = [[1, 'wed'], [1, 'sun'], [2, 'wed'], [2, 'sun'], [3, 'wed'], [3, 'sun'], [4, 'wed']];

test('the fixture arithmetic: HALF_MANNY starts Mon 2026-08-31, so W1 and W4 Mon to Wed are before Thu 2026-09-24, and one training day is due', () => {
  // The oracle's own check, engine free: race Sun 2026-12-06, half plan 14 weeks.
  assert.equal(R.handStart('run_half', '2026-12-06'), FIX_START);
  assert.equal(X.dayKey(R.TODAY_ISO), 'thu');
  const before = (w: number) => X.ISO7.filter((d, i) => R.dayISO(FIX_START, w, i) < R.TODAY_ISO).join(' ');
  assert.equal(before(1), AFTER.W1pre);
  assert.equal(before(4), AFTER.W4pre);
  assert.equal(X.ISO7.filter((d, i) => !['wed', 'sun'].includes(d) && R.dayISO(FIX_START, 4, i) >= R.TODAY_ISO).length, 3, 'W4 training days in the block');
  const restPre: [number, string][] = []; let due = 0;
  for (let w = 1; w <= FIX_WEEKS; w++) X.ISO7.forEach((d, i) => {
    const x = R.dayISO(FIX_START, w, i);
    if (['wed', 'sun'].includes(d)) { if (x < R.TODAY_ISO) restPre.push([w, d]); } else if (x === R.TODAY_ISO) due++;
  });
  assert.deepEqual(restPre, PRE_REST_DAYS);
  assert.equal(due, AFTER.sched);
});

test('the pinned clock reaches the app: Date.now() is the pin and today is Thursday 2026-09-24', () => {
  // C0
  const IA = R.boot();
  assert.equal(IA.eval('Date.now()'), R.PIN.getTime());
  assert.equal(IA.eval('new Date().getDay()'), 4);
  assert.equal(IA.eval('(function(){const t=new Date();return t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate();})()'), '2026-9-24');
});

test('a race program keeps blockOpen through refreshProgram, and the days it holds outside are the days before today from its counted-back start', () => {
  // I1a, I1b, I1c on a sample: HALF_MANNY and every eleventh row of the lattice
  const rows = [R.LROWS[0]].concat(R.LROWS.filter((r, i) => i > 0 && i % 11 === 0));
  const L = R.lattice(rows);
  assert.ok(L.aligned > 10 && L.plain > 0 && Object.keys(L.moves).length >= 3, JSON.stringify({ aligned: L.aligned, plain: L.plain, moves: L.moves }));
  assert.equal(L.carry, L.aligned, 'aligned rows carry blockOpen ' + R.TODAY_ISO + ' in and out');
  assert.equal(L.clean, L.plain, 'other rows carry no blockOpen key');
  assert.deepEqual(L.startOff, [], 'race starts are the Monday of race week minus (plan - 1) weeks');
  assert.deepEqual(L.flips, []);
});

test('after a reboot, setting the same race date or the same start leaves the stored blockOpen and the start alone, and memory agrees with storage', () => {
  // I2a, I2b, I2c: HALF_MANNY, and a half marathon 45 days out
  for (const [name, cfg] of [['HALF_MANNY', Object.assign({}, R.HM)], ['half +45 d', Object.assign({}, R.HM, { raceDate: R.plus(45) })]] satisfies [string, Cfg][]) {
    const hs = R.handStart('run_half', cfg.raceDate!);
    const IA = R.boot(); const id = R.wizard(IA, cfg); const s0 = R.storedP(IA, id), D0 = R.dump(IA);
    assert.deepEqual([s0.blockOpen, s0.startDate], [R.TODAY_ISO, hs], name + ' commit');
    const R1 = R.boot(D0); const m1 = (R1.eval('activeProg') || {}).blockOpen;
    R1.eval('setProgRace(' + JSON.stringify(cfg.raceDate) + ')');
    const sR = R.storedP(R1, id), m2 = (R.boot(R.dump(R1)).eval('activeProg') || {}).blockOpen;
    const R3 = R.boot(D0); R3.eval('setProgStart(' + JSON.stringify(R3.eval('activeProg.startDate')) + ')');
    const sS = R.storedP(R3, id), m4 = (R.boot(R.dump(R3)).eval('activeProg') || {}).blockOpen;
    assert.deepEqual([sR.blockOpen, sR.startDate], [R.TODAY_ISO, hs], name + ' after setProgRace');
    assert.deepEqual([sS.blockOpen, sS.startDate], [R.TODAY_ISO, hs], name + ' after setProgStart');
    assert.deepEqual([m1, m2, m4], [R.TODAY_ISO, R.TODAY_ISO, R.TODAY_ISO], name + ' in memory after each reboot');
  }
});

test('the wizard lands on week 1 as it renders after a reboot and as its own program renders; a race program lands with its days before today greyed', () => {
  // I3a, I3b, I3c, I3d on a sample of the 46 rows (every fifth, and the fixture)
  const rows = R.WROWS.filter((r, i) => i % 5 === 0 || /HALF_MANNY/.test(r.name));
  const out = R.wizardRun(rows);
  assert.ok(out.some(o => o.row.aligned && o.hPre) && out.some(o => !o.row.aligned), 'the sample holds a race row with days before today, and a row that does not align');
  for (const o of out) {
    assert.equal(o.cw, 1, o.row.name);
    assert.ok(o.landing && o.landing === o.rbW1, o.row.name + ': the landing equals week 1 after a reboot');
    assert.equal(o.landing, o.capW1, o.row.name + ": the landing equals the wizard's own program");
    assert.equal(o.keysDiff, 'overlays', o.row.name + ': activeProg differs from it only by the overlays the loader adds');
    if (o.row.aligned) {
      assert.deepEqual([o.stored.blockOpen, o.stored.startDate, R.parseWeek(o.landing).pre], [R.TODAY_ISO, o.hStart, o.hPre], o.row.name);
    }
  }
  assert.equal(R.parseWeek(out.find(o => /HALF_MANNY/.test(o.row.name))!.landing).done, AFTER.W1done);
});

test("HALF_MANNY's boot after signing up on Thu 2026-09-24 shows no reminder, and its weeks read as the ruling's After column", () => {
  // I4, T1 to T10
  const { fix, store } = R.fixtureStore();
  assert.deepEqual([fix.startDate, fix.blockOpen, fix.totalWeeks], [FIX_START, R.TODAY_ISO, FIX_WEEKS]);
  for (let w = 1; w <= 4; w++) for (const d of X.ISO7) assert.equal(!!fix.weeks[w][d].rest, ['wed', 'sun'].includes(d), 'W' + w + ' ' + d);
  const IA = R.boot(store);
  assert.deepEqual(JSON.parse(IA.eval('JSON.stringify(__pops)')).filter((p: string) => /^reminder::/.test(p)), [], 'no reminder pop');
  assert.equal(IA.localStorage.getItem('ia_reminded_HM1'), null);
  const W1 = R.parseWeek(R.render(IA, 1)), W4 = R.parseWeek(R.render(IA, 4));
  assert.deepEqual([W1.cells, W1.pre, W1.taps, W1.done], [7, AFTER.W1pre, 0, AFTER.W1done], 'W1: every day before signup, none opens');
  assert.ok(!!W1.heroHtml && !/(START|OPEN) SESSION/.test(W1.heroHtml) && !/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/.test(W1.hero), 'W1 hero offers no session: ' + W1.hero.slice(0, 60));
  assert.deepEqual([W4.cells, W4.pre, W4.taps, W4.done], [7, AFTER.W4pre, AFTER.W4taps, AFTER.W4done], 'W4: Mon to Wed before signup');
  assert.match(W4.hero, /^Today · Thursday\b/);
  IA.eval('__toasts.length=0;currentDayKey=null;currentWeek=1;openDayKey("mon")');
  assert.deepEqual(JSON.parse(IA.eval('JSON.stringify(__toasts)')), [AFTER.toast]);
  assert.notEqual(IA.eval('currentDayKey'), 'mon', 'the day does not open');
  IA.eval('currentWeek=4;');
  assert.equal(PRE_REST_DAYS.filter(([w, d]) => IA.eval('restDayEligible(' + w + ',"' + d + '")')).length, 0, 'no rest day before signup can be logged');
  assert.equal(IA.eval('scheduledDays(new Date(' + R.PIN.getTime() + ')).length'), AFTER.sched);
  assert.equal(IA.eval('computeStreak()'), AFTER.streak);
});

// ── the countdown (D182), in both zones ──────────────────────────────────────────────────────────────────────────
const WEEKDAY_TABLE = { '2026-12-06': 'Sun', '2026-12-05': 'Sat', '2026-11-01': 'Sun', '2026-12-31': 'Thu', '2027-01-01': 'Fri', '2027-03-14': 'Sun',
  '2027-03-15': 'Mon', '2027-06-30': 'Wed', '2028-02-29': 'Tue', '2026-10-10': 'Sat', '2026-09-22': 'Tue', '2026-11-16': 'Mon', '2026-08-31': 'Mon' };
const RULING_DAYS: [string, string, number][] = [['2026-09-22', '2026-12-06', 75], ['2026-08-31', '2026-12-06', 97], ['2026-11-20', '2026-12-06', 16], ['2026-11-16', '2027-03-15', 119], ['2026-09-22', '2026-12-13', 82]];
const RACE_DATES = ['2026-12-06', '2026-12-05', '2026-11-01', '2026-12-31', '2027-01-01', '2027-03-14', '2027-03-15', '2027-06-30', '2028-02-29', '2026-10-10'];
const STATE = [
  { clock: '2026-08-31', race: '2026-12-06', days: 97, card: '13 weeks', copy: '13 weeks out', sheet: '97', review: '13 weeks away' },
  { clock: '2026-09-22', race: '2026-12-06', days: 75, card: '10 weeks', copy: '10 weeks out', sheet: '75', review: '10 weeks away' },
  { clock: '2026-11-20', race: '2026-12-06', days: 16, card: '2 weeks', copy: '2 weeks out', sheet: '16', review: '2 weeks away' },
  { clock: '2026-11-29', race: '2026-12-06', days: 7, card: '1 week', copy: '1 week out', sheet: '7', review: '1 week away' },
  { clock: '2026-11-30', race: '2026-12-06', days: 6, card: '6 days', copy: '6 days out', sheet: '6', review: '6 days away' },
  { clock: '2026-12-05', race: '2026-12-06', days: 1, card: '1 day', copy: '1 day out', sheet: '1', review: '1 day away' },
  { clock: '2026-12-06', race: '2026-12-06', days: 0, card: 'Race day', copy: 'race day', sheet: 'Race day', review: 'race day' },
  { clock: '2026-12-07', race: '2026-12-06', days: -1, card: 'Behind you', copy: 'behind you', sheet: 'Behind you', review: 'behind you' },
  { clock: '2026-12-20', race: '2026-12-06', days: -14, card: 'Behind you', copy: 'behind you', sheet: 'Behind you', review: 'behind you' },
  { clock: '2026-11-16', race: '2027-03-15', days: 119, card: '17 weeks', copy: '17 weeks out', sheet: '119', review: '17 weeks away' },   // spans the spring-forward
  { clock: '2027-03-08', race: '2027-03-15', days: 7, card: '1 week', copy: '1 week out', sheet: '7', review: '1 week away' },          // spans the spring-forward
  { clock: '2027-03-07', race: '2027-03-14', days: 7, card: '1 week', copy: '1 week out', sheet: '7', review: '1 week away' },          // race on the spring-forward day
  { clock: '2026-11-01', race: '2026-11-08', days: 7, card: '1 week', copy: '1 week out', sheet: '7', review: '1 week away' },          // the fall-back day
];
const ALIGN: [string, string, string, number][] = [['2026-11-16', '2027-03-15', 'run_half', 17], ['2027-03-08', '2027-03-15', 'run_5k', 1], ['2027-03-01', '2027-03-15', 'run_10k', 2],
  ['2027-02-15', '2027-03-15', 'run_half', 4], ['2026-11-16', '2027-03-14', 'run_marathon', 16], ['2026-09-22', '2026-12-06', 'run_half', 10], ['2026-10-25', '2026-11-08', 'run_half', 2]];
const TEST_GOAL = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' };

for (const [zone, tz, offsets] of [['New York', 'America/New_York', [300, 240]], ['UTC', 'UTC', [0, 0]]] satisfies [string, string, number[]][]) {
  describe('in ' + zone, () => {
    let C: R.CountdownVM;
    beforeAll(() => { process.env.TZ = tz; C = R.countdownVM(); });

    test('the zone is the one asked for, the clock pin reaches the app, and the hand date oracle agrees with itself and the ruling', () => {
      // Z0, Z1, Z2
      assert.deepEqual([new Date(2027, 2, 13, 12).getTimezoneOffset(), new Date(2027, 2, 15, 12).getTimezoneOffset()], offsets);
      for (const [iso, w] of Object.entries(WEEKDAY_TABLE)) {
        assert.equal(X.WD3[X.sakamoto(...X.ymd(iso))], w, iso);
        assert.equal(X.WD3[((X.civI(iso) % 7) + 11) % 7], w, iso + ' by day count');
        assert.equal(X.fromCiv(X.civI(iso)), iso);
      }
      for (const [a, b, n] of RULING_DAYS) assert.equal(X.daysBetween(a, b), n, a + ' to ' + b);
      for (const s of STATE) assert.equal(X.daysBetween(s.clock, s.race), s.days, s.clock + ' to ' + s.race);
      for (const [t, r, , w] of ALIGN) assert.equal(Math.floor(X.daysBetween(t, r) / 7), w);
      assert.equal(X.handDate('2026-12-06'), 'Sun, Dec 6, 2026');
      for (const s of ['2026-09-22', '2026-12-06', '2027-03-14']) {
        C.pin(s);
        assert.equal(C.IA.eval('(function(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })()'), s);
      }
    });

    test('a program with no race date: the card says "No date set" with no Time out row, and the copy says "Event: no date"', () => {
      // Z3
      C.pin('2026-09-22');
      const cfg = R.cfgOf(); delete cfg.raceDate;
      assert.deepEqual(R.card(C, R.progOf(cfg)), { race: 'No date set', out: null });
      assert.equal(R.copyLine(C, R.progOf(cfg)), 'Event: no date');
    });

    test('the Programs card, the copy text, the mile lock sheet and the wizard review print the race date as the calendar has it, for 10 dates', () => {
      // R1a, R1b, R1c, R1d: a Sunday, month and year ends, both DST days, a leap day
      C.pin('2026-09-22');
      for (const r of RACE_DATES) {
        const want = X.handDate(r), p = R.progOf(R.cfgOf({ raceDate: r }));
        assert.equal(R.card(C, p).race, want, 'card ' + r);
        assert.equal(R.eventParts(R.copyLine(C, p)).date, want, 'copy ' + r);
        assert.equal(R.sheet(C, R.cfgOf({ raceDate: r }), '2026-09-22').race, want, 'sheet ' + r);
        assert.equal(R.review(C, r, '2026-09-22').date, want, 'review ' + r);
      }
    });

    test('the countdown is live on all four surfaces: weeks, 1 week, days, 1 day, race day, behind you, across both DST changes', () => {
      // R2a, R2b, R2c, R2d, and a dated test goal's card and copy (no NRC alignment) at 10 weeks
      for (const s of STATE) {
        C.pin(s.clock);
        const p = R.progOf(R.cfgOf({ raceDate: s.race })), tag = s.clock + ' to ' + s.race;
        assert.equal(R.card(C, p).out, s.card, 'card ' + tag);
        assert.equal(R.eventParts(R.copyLine(C, p)).words, s.copy, 'copy ' + tag);
        assert.equal(R.sheet(C, R.cfgOf({ raceDate: s.race }), s.clock).out, s.sheet, 'sheet ' + tag);
        assert.equal(R.review(C, s.race, s.clock).phrase, s.review, 'review ' + tag);
      }
      C.pin('2026-09-22');
      const tg = R.progOf(R.cfgOf({ raceDate: '2026-12-06', cardioGoals: { run: TEST_GOAL }, _raceDateCappedWeeks: 11 }));
      assert.equal(R.card(C, tg).out, '10 weeks');
      assert.equal(R.eventParts(R.copyLine(C, tg)).words, '10 weeks out');
    });

    test('raceAlignment counts whole weeks out from rounded days, across the spring-forward, given today or reading the clock', () => {
      // R3
      const ra = C.IA.eval('raceAlignment');
      for (const [t, r, g, w] of ALIGN) assert.equal(ra(g, r, true, t).weeksOut, w, t + ' to ' + r);
      C.pin('2026-11-16');
      assert.equal(ra('run_half', '2027-03-15', true).weeksOut, 17);
    });

    test('nothing stored is read: a wrong stored week count, a moved race with a stale top-level date, and a stale wizard count all print the live countdown', () => {
      // R4
      C.pin('2026-09-22');
      const p1 = R.progOf(R.cfgOf({ raceDateWeeks: 3 }), { raceDateWeeks: 3 });
      assert.equal(R.card(C, p1).out, '10 weeks');
      assert.equal(R.copyLine(C, p1), 'Event: Sun, Dec 6, 2026 (10 weeks out)');
      const p2 = R.progOf(R.cfgOf({ raceDate: '2026-12-13', raceDateWeeks: 13 }), { raceDate: '2026-12-06', raceDateWeeks: 13 });   // after setProgRace(2026-12-13)
      assert.deepEqual(R.card(C, p2), { race: 'Sun, Dec 13, 2026', out: '11 weeks' });
      assert.equal(R.copyLine(C, p2), 'Event: Sun, Dec 13, 2026 (11 weeks out)');
      assert.equal(R.sheet(C, R.cfgOf({ raceDateWeeks: 3 }), '2026-09-22').out, '75');
      assert.equal(R.review(C, '2026-12-06', '2026-09-22', { raceDateWeeks: 99 }).raw, 'Sun, Dec 6, 2026 (10 weeks away)');
    });
  });
}

// ── the name step's start date (D242), the clock on Sat 2026-10-24 12:00 ─────────────────────────────────────────────
// Oracle, typed by hand: the half plan is 14 weeks, so a race on Sun 2027-01-31 (race week's Monday 2027-01-25) starts
// 13 weeks earlier, on Mon 2026-10-26. The wizard's default start is today, Sat 2026-10-24.
describe('the wizard name step prints one start date (D242)', () => {
  const HALF = {
    name: 'X', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: true,
    cardioGoals: { run: { id: 'run_half', label: 'Half Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '5', baseline: '5mi' } },
    liftingFocus: 'support_strength', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full',
    restDays: ['sun', 'wed'], startDate: '2026-10-24',
  };
  const nameStep = (wd: Record<string, unknown>) => {
    const IA = loadApp({ dom: true });
    pinClock(IA, '2026-10-24T12:00:00');
    IA.eval('Object.assign(WD,' + JSON.stringify(wd) + ");wizardStep=WIZARD_STEPS.indexOf('name');renderWizardStep();");
    const html = String(IA.els['wizardBody'].innerHTML);
    return {
      derived: (html.match(/<div class="input-field derived"><span>([^<]*)<\/span>/) || [])[1] ?? null,
      input: (html.match(/id="wizStartDate" value="([^"]*)"/) || [])[1] ?? null,
      row: (html.match(/<span id="sumStartDate">([^<]*)<\/span>/) || [])[1] ?? null,
    };
  };

  test('with a race date the summary row prints the Monday the race sets, the date the field shows, not today', () => {
    const r = nameStep({ ...HALF, raceDate: '2027-01-31' });
    assert.equal(r.derived, 'Mon, Oct 26, 2026');
    assert.equal(r.row, 'Mon, Oct 26, 2026 \u2014 set by race date');
  });

  test('with no race date the row still reads the entered start, a short first week from a Saturday (unchanged: guards the resolver arm)', () => {
    const r = nameStep({ ...HALF, raceDate: null });
    assert.equal(r.derived, null);
    assert.equal(r.input, '2026-10-24');
    assert.equal(r.row, 'Sat, Oct 24, 2026 \u2014 short first week');
  });
});
