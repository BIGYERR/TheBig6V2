// The Expo app's Programs tab against today's page (MIGRATION.md phase 3, row 5): the list and each card's detail,
// the rename, Set Active, Archive, Delete Forever, the goal sheet and the mile pencil with its lock, on The Half
// Manny and on programs made for what it does not draw. After every tap every word and number of the list, what is
// kept between draws, the open sheet, each toast, the active program, the grid in hand after a switch or a rebuild
// and every ia_ key is equal to today's page, value for value, no family left out (support/native-program-list.ts).
// Every expected value here is today's page, on purpose; the ten programs are tests/sweeps/native-program-list.test.ts.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { runAnchorChips, runAnchorSentence } from '../../frontends/native/src/program-list/list-readers.ts';
import { TwoLists, goalWalk, listTally, listWalk, mileWalk, twinAt, twinOn, twoWalk } from '../support/native-program-list.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const names = Object.keys(PROGRAMS);
const HALF = PROGRAMS[names[0]!]!;

describe('native program list: The Half Manny through the standard history', () => {
  const T = listTally();
  test('the list, the goal sheet and the mile pencil at each stretch, then a second program beside it', () => {
    let stages = 0;
    const { phone } = life(HALF, CREATED, undefined, (stage, P) => {
      listWalk(P, T, 'half manny, ' + stage);
      if (stage === '0 generated' || stage === '3 third week') { goalWalk(P, T, 'half manny, ' + stage); assert.equal(mileWalk(P, T, 'half manny, ' + stage), 'edit'); }
      stages++;
    });
    assert.equal(stages, 5);
    twoWalk(phone, PROGRAMS[names[5]!]!, T, 'half manny and a second program');
  });
});

/** A phone with one program made the wizard's way at CREATED, then launched on the Wednesday of its first whole week. */
function made(cfg: unknown, edit = ''): Phone {
  const P = new Phone().launch(CREATED);
  P.generate(cfg as never);
  if (edit) P.ev(`(function(){var ps=getPrograms();var p=ps[0];${edit};savePrograms(ps);})()`);
  return twinOn(P, at('2026-08-31', 9, '08:00'));
}
const RUN_BASE = PROGRAMS['run base, bodyweight, balanced']!;
const TWO_SPORTS = PROGRAMS['run base and bike base, crossfit, balanced']!;
const SWIM = { ...PROGRAMS['swim 500, commercial, prevention support']!, cardioGoals: { swim: { id: 'swim_500_time', label: '500', targetMins: '9', targetSecs: '0', swimUnit: 'yd', baseMins: '10', baseSecs: '30' } } };

describe('native program list: what The Half Manny does not draw', () => {
  const T = listTally();
  const at0 = (k: string): number => T[k] || 0;

  test('a lifting program with no lift entered: the est. mark, Lift only twice, no pace group, no goal pencil', () => {
    const { bench: _b, squat: _s, deadlift: _d, ...rest } = PROGRAMS['1.5 mile test goal, commercial, balanced']! as unknown as Record<string, unknown>;
    const P = made({ ...rest, cardioTypes: [], cardioGoals: {}, primaryPath: 'body' });
    const two = listWalk(P, T, 'lifting only');
    const d = two.view.cards[0]!.detail;
    assert.equal(d.estimated, true);
    assert.equal(d.cardio, null);
    assert.equal(d.paces, null);
    assert.equal(mileWalk(P, T, 'lifting only'), 'none');
    assert.ok(at0('1RM marked est.') > 0 && at0('meta: Lift only') > 0 && at0('detail: Lift only') > 0 && at0('no pace group') > 0, JSON.stringify(T));
  });

  test('a run with no mile entered: the default sentence, the empty fields, a mile saved over the default', () => {
    const { mileBestMins: _m, mileBestSecs: _s, ...goal } = RUN_BASE.cardioGoals!.run as unknown as Record<string, unknown>;
    const P = made({ ...RUN_BASE, cardioGoals: { run: goal } });
    const two = new TwoLists(twinAt(P), T, 'no mile entered');
    const id: string = two.P.ev('activeProgId');
    assert.match(two.view.cards[0]!.detail.paces!.sentence, /the intermediate default\. No mile time was entered\. Tap the pencil to enter one\./);
    assert.deepEqual(two.openMile(id), { kind: 'edit', progId: id, mins: '', secs: '' });
    assert.equal(two.commitMile('10', '0'), true);
    assert.match(two.view.cards[0]!.detail.paces!.sentence, /the time you entered in week \d+\. Before that it was the intermediate default\./);
    // The mile's source rides a goal switch (D5): the sentence still names the week it was entered.
    two.openGoal(id, 'run'); two.pickGoal('run_5k');
    assert.equal(two.commitGoal(), true);
    assert.match(two.view.cards[0]!.detail.paces!.sentence, /the time you entered in week \d+\. Before that it was the intermediate default\./);
    assert.ok(at0('sentence: default') > 0 && at0('mile fields: empty') > 0 && at0('sentence: edited from the default') > 0, JSON.stringify(T));
  });

  test('a mile worked back from a past program\'s runs: the seeded sentence, one run and several', () => {
    for (const [n, prog] of [[1, 'Spring Block'], [4, ''], [0, 'Spring Block']] as const) {
      const P = made(RUN_BASE, `p.cfg.cardioGoals.run.mileBestSrc={kind:'seeded',n:${n},prog:${JSON.stringify(prog)}}`);
      const two = new TwoLists(twinAt(P), T, 'seeded from ' + n);
      const s = two.view.cards[0]!.detail.paces!.sentence;
      assert.match(s, n === 1 ? /worked back from 1 recovery run you logged in Spring Block\./ : n === 4 ? /worked back from 4 recovery runs you logged in your last program\./ : /worked back from the recovery runs you logged in Spring Block\./);
    }
    assert.equal(at0('sentence: seeded'), 3);
  });

  test('the lock: three weeks out with the race in days, on race day, past it, and with no race the week alone', () => {
    const { phone } = life(HALF, CREATED);
    const id: string = phone.ev('activeProgId');
    for (const [iso, days, out] of [['2026-11-17T09:00:00', 'a number', 'in days'], ['2026-12-02T09:00:00', 'a number', 'in days'], ['2026-12-06T09:00:00', 'words', 'Race day'], ['2026-12-08T09:00:00', 'words', 'Behind you']] as const) {
      const two = new TwoLists(twinOn(phone, iso), T, 'the half, ' + iso);
      const m = two.openMile(id);
      assert.ok(m && m.kind === 'lock', iso + ': the pencil shows the lock');
      assert.deepEqual(m.facts.map((f) => f.k), ['Days out', 'Race day', 'Week']);
      assert.equal(/^\d+$/.test(m.facts[0]!.v), days === 'a number', iso + ': days out as ' + days);
      assert.equal(two.view.cards[0]!.detail.event![1]!.v === 'Race day' || two.view.cards[0]!.detail.event![1]!.v === 'Behind you', out !== 'in days');
      two.closeMile();
    }
    // The last week it still edits: four weeks from the end.
    const open = new TwoLists(twinOn(phone, '2026-11-11T09:00:00'), T, 'the half, the week before the lock');
    assert.equal(open.openMile(id)!.kind, 'edit');
    const P = made(RUN_BASE);
    const two = new TwoLists(twinOn(P, at('2026-08-31', 7 * 5 + 1, '09:00')), T, 'run base, week 7 of 9');
    const m = two.openMile(two.P.ev('activeProgId'));
    assert.deepEqual(m, { kind: 'lock', facts: [{ k: 'Week', v: '7 of 9' }] });
    assert.ok(at0('mile lock: days out as a number') >= 2 && at0('mile lock: days out in words') >= 2 && at0('mile lock: the week alone') >= 1 && at0('event: Time out in days') >= 1 && at0('event: Time out Race day') >= 1 && at0('event: Time out Behind you') >= 1, JSON.stringify(T));
  });

  test('a race program with no date stored: No date set, and no Time out', () => {
    const P = made(PROGRAMS['5k race, commercial, strength, beginner']!, 'delete p.cfg.raceDate');
    const two = new TwoLists(twinAt(P), T, 'no race date');
    assert.deepEqual(two.view.cards[0]!.detail.event, [{ k: 'Race date', v: 'No date set' }]);
  });

  test('the hybrid path leaves the peaking goals out; a sport with no goal stored reads General fitness and Keep current', () => {
    const P = made({ ...TWO_SPORTS, primaryPath: 'both' }, 'p.cfg.cardioGoals.bike={}');
    const two = new TwoLists(twinAt(P), T, 'hybrid, no bike goal');
    const id: string = two.P.ev('activeProgId');
    assert.deepEqual(two.view.cards[0]!.detail.cardio!.map((c) => c.goal), ['Build Running Base', 'General fitness'].map((x, i) => (i === 0 ? two.view.cards[0]!.detail.cardio![0]!.goal : x)));
    assert.deepEqual(two.openGoal(id, 'run').options.map((o) => o.id), ['run_5k', 'run_10k', 'run_pace_goal', 'run_base']);
    two.closeGoal();
    const v = two.openGoal(id, 'bike');
    assert.deepEqual(v.options.map((o) => o.id), ['bike_50', 'bike_ftp', 'bike_cals', 'bike_base']);
    assert.equal(v.options.some((o) => o.current), false);
    assert.equal(two.pickGoal('bike_cals').decision!.keepLabel, 'Keep current');
    assert.equal(two.commitGoal(), true);
    assert.ok(at0('cardio row: General fitness') > 0 && at0('goal decision: Keep current') > 0, JSON.stringify(T));
  });

  test('a swim goal switched: the 500 time rides to the 100 goal and back, the unit with it, the typed target stored as typed', () => {
    const P = made(SWIM);
    const two = new TwoLists(twinAt(P), T, 'swim 500 to 100 and back');
    const id: string = two.P.ev('activeProgId');
    const goal = (): Record<string, unknown> => (JSON.parse(two.store.get('ia_programs')!) as { cfg: { cardioGoals: { swim: Record<string, unknown> } } }[])[0]!.cfg.cardioGoals.swim;
    two.openGoal(id, 'swim'); two.pickGoal('swim_100_time');
    assert.equal(two.typeGoal('targetMins', '1'), true);
    two.typeGoal('targetSecs', '25');
    assert.equal(two.commitGoal(), true);
    assert.deepEqual(goal(), { id: 'swim_100_time', label: 'Improve 100 Time', baseline: '', swimUnit: 'yd', base500Mins: '10', base500Secs: '30', targetMins: '1', targetSecs: '25', targetTime: '1:25' });
    two.openGoal(id, 'swim'); two.pickGoal('swim_500_time');
    two.typeGoal('targetSecs', '45');
    assert.equal(two.commitGoal(), true);
    assert.deepEqual(goal(), { id: 'swim_500_time', label: 'Improve 500 Time', baseline: '', swimUnit: 'yd', baseMins: '10', baseSecs: '30', targetSecs: '45', targetTime: '0:45' });
    two.openGoal(id, 'swim'); two.pickGoal('swim_mile');
    assert.equal(two.commitGoal(), true);
    assert.deepEqual(goal(), { id: 'swim_mile', label: 'Swim a Mile', baseline: '', swimUnit: 'yd' });
    assert.ok(at0('goal decision: time typed') >= 2, JSON.stringify(T));
  });

  test('the pace goal typed: the distance, the unit and the time stored as typed, the mile kept', () => {
    const P = made(RUN_BASE);
    const two = new TwoLists(twinAt(P), T, 'run base to the pace goal');
    const id: string = two.P.ev('activeProgId');
    two.openGoal(id, 'run'); two.pickGoal('run_pace_goal');
    assert.equal(two.typeGoal('targetDist', '2'), false);
    assert.equal(two.typeGoal('targetSecs', '30'), true);
    two.typeGoal('paceUnit', 'km'); two.typeGoal('targetMins', '9');
    assert.equal(two.commitGoal(), true);
    const g = (JSON.parse(two.store.get('ia_programs')!) as { cfg: { cardioGoals: { run: Record<string, unknown> } } }[])[0]!.cfg.cardioGoals.run;
    assert.deepEqual(g, { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', baseline: '', mileBestMins: '11', mileBestSecs: '0', targetMins: '9', targetSecs: '30', targetTime: '9:30', targetDist: '2', paceUnit: 'km' });
  });

  test('the sentence and the chips for every kind of anchor the builders read, the page\'s own beside this app\'s', () => {
    const P = made(RUN_BASE);
    const row = { mile: 510, fiveK: 545, tenK: 570, tempo: 590, half: 600, marathon: 640, recovery: 700 };
    const base = { anchorSec: 510, rawSec: 510, clamped: null, row, kind: 'entered', exp: 'intermediate', prog: '', n: 0, wk: 0, from: null, race: null, goalId: 'run_10k', goalT: null };
    const cases: Record<string, unknown>[] = [
      base, { ...base, goalId: 'run_base' }, { ...base, goalId: 'run_pace_goal', goalT: { dist: 1.5, sec: 720 } }, { ...base, goalId: 'run_half', race: 'half' }, { ...base, goalId: 'run_marathon', race: 'marathon' },
      { ...base, kind: 'default', exp: 'beginner' }, { ...base, kind: 'seeded', n: 1, prog: 'Spring' }, { ...base, kind: 'seeded', n: 3 }, { ...base, kind: 'seeded' },
      { ...base, kind: 'edited', wk: 4, from: { mins: '', secs: '', kind: 'default' } }, { ...base, kind: 'edited', wk: 2, from: { mins: '9', secs: '15', kind: 'entered' } }, { ...base, kind: 'edited' },
      { ...base, clamped: 'fast', rawSec: 250, anchorSec: 300 }, { ...base, clamped: 'slow', rawSec: 800, anchorSec: 720 }, { ...base, clamped: 'slow', rawSec: 0 }, { ...base, clamped: 'fast', rawSec: -5 },
      { ...base, anchorSec: 480 }, { ...base, anchorSec: 660 }, { ...base, anchorSec: 1080 }, { ...base, anchorSec: 540 },
    ];
    const seen = new Set<string>();
    for (const a of cases) {
      const mine = runAnchorSentence(a as never), theirs: string = (P.ev('runAnchorSentence') as (x: unknown) => string)(a);
      assert.equal(mine, theirs, 'the sentence for ' + JSON.stringify(a));
      assert.deepEqual(runAnchorChips(a as never), JSON.parse(JSON.stringify((P.ev('runAnchorChips') as (x: unknown) => unknown)(a))), 'the chips for ' + JSON.stringify(a));
      seen.add(mine);
    }
    assert.equal(seen.size, cases.length - 3, 'each case reads its own sentence, but four that share one: a race changes the chips alone (two), and an edit with nothing before it reads as entered');
    assert.match(runAnchorSentence(cases[14] as never), /the mile time you entered is not a valid time, so its slowest row is used\./);
    assert.match(runAnchorSentence(cases[16] as never), /^Anchored on an <b>8:00 mile<\/b>/);
    assert.match(runAnchorSentence(cases[19] as never), /^Anchored on a <b>9:00 mile<\/b>/);
  });
});

describe('native program list: an older program takes over', () => {
  const T = listTally();
  /** Two programs, the first an older one (its seed beside its config, not in it), the second active. */
  function older(): { phone: Phone; first: string; second: string; seed: number } {
    const Q = twinAt(made(RUN_BASE), 1);
    const first: string = Q.ev('activeProgId');
    const second = Q.generate(TWO_SPORTS as never);
    const seed: number = Q.ev(`(function(){var ps=getPrograms();var p=ps[0];var s=p.cfg.seed;p.seed=s;delete p.cfg.seed;savePrograms(ps);return s;})()`);
    return { phone: twinAt(Q), first, second, seed };
  }
  const cfgSeed = (two: TwoLists, id: string): unknown => (JSON.parse(two.store.get('ia_programs')!) as { id: string; cfg: { seed?: number } }[]).find((p) => p.id === id)!.cfg.seed;

  test('Set Active on it stores its repair: the seed put back into its config', () => {
    const o = older();
    const two = new TwoLists(o.phone, T, 'an older program set active');
    assert.equal(cfgSeed(two, o.first), undefined, 'the launch of the other program left it as it was');
    two.setActive(o.first);
    assert.equal(cfgSeed(two, o.first), o.seed);
    assert.ok(two.wrote.includes('ia_programs') && two.wrote.includes('ia_active'));
  });
  test('Delete Forever of the active program hands on to it, and the list as saved keeps its repair (D178: saved before the hand on)', () => {
    const o = older();
    const two = new TwoLists(o.phone, T, 'an older program takes over after a delete');
    two.deleteForever(o.second);
    assert.ok(two.prog && two.prog.id === o.first);
    assert.equal(cfgSeed(two, o.first), o.seed, 'the repair the switch stored is not written over');
    assert.equal((JSON.parse(two.store.get('ia_programs')!) as unknown[]).length, 1);
  });
  test('Archive of the active program hands on to it the same way', () => {
    const o = older();
    const two = new TwoLists(o.phone, T, 'an older program takes over after an archive');
    two.archive(o.second);
    assert.ok(two.prog && two.prog.id === o.first);
    assert.equal(cfgSeed(two, o.first), o.seed);
  });
});
