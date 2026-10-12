// The log form over whole lattices of programs: every run or bike day opened, rolled and logged the way the athlete
// does it (tests/support/log-form.ts). The hand-driven cases and a sample of each lattice are in
// tests/integration/logging.test.ts; this file is slow (tens of seconds), so CI runs it and the 60-second check does not.
//
// Oracles are typed by hand: the faces from the plan (hmsFace, miFace), 0:00:00 and 0.00 on a free wheel, the stored
// 47.22 for a 0:47:13 roll, the ruled form shapes (runFormShape, bikeShape, bikeCopyBad). The floors are measure's hand
// counts of the classes each sweep must reach, so a sweep that silently shrinks fails.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures } from '../support/app.ts';
import {
  DAYS, mkCfg, cardioOf, sportOf, weeksOf, hmsFace, logForm, readForm, runFormShape, runOpenFaces, bikeShape, bikeCopyBad,
} from '../support/log-form.ts';
import type { SportSpec } from '../support/log-form.ts';
import type { Program } from '@ia/core';

const J = JSON.stringify;
const C = logForm('sweep');
const HALF_CFG = fixtures.HALF_MANNY;

test('every run day with a time or distance dose, over the run goals, opens on its plan in the ruled shape, writing nothing', () => {
  // HALF_MANNY plus 6 run goals x beginner, advanced (balanced, commercial, rest sun and wed, seed 24865)
  const GOALS: [string, Record<string, string>][] = [['run_5k', {}], ['run_10k', {}], ['run_half', {}], ['run_marathon', {}], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '30' }], ['run_base', {}]];
  const progs: [string, object][] = [['HALF_MANNY', HALF_CFG]];
  for (const g of GOALS) for (const ex of ['beginner', 'advanced']) progs.push([g[0] + ' ' + ex, mkCfg([['run', g[0], g[1]]], 'balanced', ex, 'commercial', 24865)]);
  const n: Record<string, number> = { time: 0, dist: 0 };
  for (const [name, cfg] of progs) {
    const p = C.build(cfg);
    C.use(p);
    for (const w of weeksOf(p)) {
      for (const d of DAYS) {
        const c = cardioOf(p.weeks[w][d]);
        if (!c || String(c.type).toLowerCase() !== 'run') continue;
        const dose = C.dose(c);
        if (!dose || (dose.k !== 'time' && dose.k !== 'dist')) continue;
        C.setLog(w, d, null);
        const before = C.logs();
        C.open(w, d);
        const tag = name + ' W' + w + ' ' + d + ' ' + dose.k;
        assert.deepEqual(runFormShape(dose.k, readForm(C.form()), dose), [], tag);
        const faces: Record<string, string> = {};
        C.wheels().forEach((wh) => { faces[wh.hid] = C.face(wh); });
        assert.deepEqual(faces, runOpenFaces(dose.k, dose), tag);
        assert.equal(C.inputs(), 0, tag);
        assert.equal(C.logs(), before, tag);
        n[dose.k]++;
      }
    }
  }
  assert.ok(n.time > 0 && n.dist > 0, 'both dose kinds reached ' + J(n));
});

test('every bike form, over the bike goals, injured multi-sport programs and swapped-in days, is one wheel that opens on 0:00:00 writing nothing', () => {
  const forms: Record<string, { tag: string; k: string; ct: boolean; shape: string[]; copy: string[]; face: string | null; inputs: number; same: boolean }[]> = { a: [], b: [], c: [] };
  const open = (grp: string, name: string, p: Program, pick: (x: any) => boolean, stored?: Record<string, string>) => {
    C.use(p);
    C.unforce();
    for (const w of weeksOf(p)) {
      for (const d of DAYS) {
        const x = p.weeks[w][d];
        const c = cardioOf(x);
        if (!c || !pick(x)) continue;
        const dose = stored ? null : C.dose(c);
        C.setLog(w, d, stored ? Object.assign({}, stored, { swapFrom: sportOf(x) }) : null);
        const before = C.logs();
        C.open(w, d);
        const fm = C.form();
        const wb = C.wheel('log_bike_mins');
        forms[grp].push({ tag: name + ' W' + w + ' ' + d, k: dose ? dose.k + (dose.parsed ? '(parsed)' : '') : 'null', ct: c.subtype === 'Cross-Train',
          shape: bikeShape(fm, !!dose), copy: bikeCopyBad(fm), face: wb ? C.face(wb) : null, inputs: C.inputs(), same: C.logs() === before });
      }
    }
  };
  // (a) the bike goals x focus x experience x equipment x seed
  for (const g of ['bike_century', 'bike_50', 'bike_base', 'bike_ftp', 'bike_cals']) for (const f of ['balanced', 'strength']) for (const ex of ['beginner', 'advanced']) {
    for (const eq of ['commercial', 'home_basic']) for (const sd of [76308, 24865]) open('a', [g, f, ex, eq, sd].join('|'), C.build(mkCfg([['bike', g]], f, ex, eq, sd)), (x) => sportOf(x) === 'bike');
  }
  // (b) four multi-sport pairs with a knee or a shoulder injury, where Cross-Train bike days appear
  const PAIRS: SportSpec[][] = [[['run', 'run_half'], ['bike', 'bike_base']], [['run', 'run_5k'], ['bike', 'bike_ftp']], [['swim', 'swim_mile'], ['bike', 'bike_base']], [['swim', 'swim_base'], ['bike', 'bike_50']]];
  for (const pr of PAIRS) {
    for (const inj of [{ region: 'knee', tier: 'protect' }, { region: 'shoulder', tier: 'protect' }]) {
      open('b', pr.map((s) => s[1]).join('+') + '|' + inj.region, C.build(Object.assign(mkCfg(pr, 'balanced', 'intermediate', 'commercial', 76308), { injury: inj })), (x) => sportOf(x) === 'bike');
    }
  }
  // (c) every run or swim day of HALF_MANNY and the four pairs uninjured, opened as a swapped-in bike
  const SWAPPED_IN = { swapTo: 'bike', bike_mins: '', run_mins: '', run_dist: '', swim_yards: '', rpe: '', notes: '' };
  open('c', 'HALF_MANNY', C.build(HALF_CFG), (x) => sportOf(x) === 'run' || sportOf(x) === 'swim', SWAPPED_IN);
  for (const pr of PAIRS) open('c', pr.map((s) => s[1]).join('+'), C.build(mkCfg(pr, 'balanced', 'intermediate', 'commercial', 76308)), (x) => sportOf(x) === 'run' || sportOf(x) === 'swim', SWAPPED_IN);
  for (const g of ['a', 'b', 'c']) {
    assert.ok(forms[g].length > 0, g);
    for (const x of forms[g]) {
      assert.deepEqual(x.shape, [], g + ' ' + x.tag + ' ' + x.k);
      assert.deepEqual(x.copy, [], g + ' ' + x.tag);
      assert.deepEqual([x.face, x.inputs, x.same], ['0:00:00', 0, true], g + ' ' + x.tag);
    }
  }
  const kinds = new Set(forms.a.map((x) => x.k));
  assert.ok(kinds.has('time') && kinds.has('reps_time') && kinds.has('null'), 'the bike goals reach every dose kind ' + J([...kinds]));
  const ct = forms.b.filter((x) => x.ct);
  assert.ok(ct.length > 0 && ct.every((x) => x.k === 'time(parsed)'), 'Cross-Train bike days read a parsed time dose');
});

test('every time wheel on a run or bike day opens on its plan or 0:00:00 writing nothing, and a free one rolled to 0:47:13 stores 47.22 through Done', () => {
  // HALF_MANNY plus 11 goals x 2 focus x 2 experience x 2 seeds (commercial). Floor: 1,755 free time wheels, measure's
  // count of the hms forms that opened on the dash before the zero face (D215).
  const GOALS: SportSpec[] = [['bike', 'bike_century'], ['bike', 'bike_50'], ['bike', 'bike_base'], ['bike', 'bike_ftp'], ['bike', 'bike_cals'],
    ['run', 'run_5k'], ['run', 'run_10k'], ['run', 'run_half'], ['run', 'run_marathon'], ['run', 'run_base'], ['run', 'run_pace_goal']];
  const progs: [string, object][] = [['HALF_MANNY', HALF_CFG]];
  for (const g of GOALS) for (const f of ['balanced', 'strength']) for (const ex of ['beginner', 'advanced']) for (const sd of [76308, 24865]) progs.push([g[1] + '|' + f + '|' + ex + '|' + sd, mkCfg([g], f, ex, 'commercial', sd)]);
  const field: Record<string, string> = { log_bike_mins: 'bike_mins', log_run_mins: 'run_mins' };
  const n = { open: 0, plan: 0, tail: 0 };
  for (const [name, cfg] of progs) {
    const p = C.build(cfg);
    C.use(p);
    for (const w of weeksOf(p)) {
      for (const d of DAYS) {
        const ct = sportOf(p.weeks[w][d]);
        if (ct !== 'run' && ct !== 'bike') continue;
        C.wipe();
        C.open(w, d);
        const wh = C.wheels().find((x) => x.kind === 'hms');
        if (!wh) continue;
        const tag = name + ' W' + w + ' ' + d + ' ' + wh.hid;
        assert.equal(C.face(wh), wh.plan == null ? '0:00:00' : hmsFace(+wh.plan), tag);
        assert.deepEqual([C.inputs(), C.entry(w, d), C.hist(w, d)], [0, null, false], tag + ' wrote nothing');
        n.open++;
        if (wh.plan != null) {
          assert.ok(!wh._cols[0].items.some((it) => it.v === ''), tag + ' no dash row on the planned hours');
          n.plan++;
          continue;
        }
        C.roll(wh, [[1, '47'], [2, '13']]);
        const ins = C.INPUTS[wh.hid] || 0;
        C.tap(d, 'complete');
        const e = C.entry(w, d) || {};
        assert.deepEqual([e[field[wh.hid]], ins, C.status(w, d), C.hist(w, d)], ['47.22', 1, 'complete', true], tag);
        n.tail++;
      }
    }
  }
  assert.ok(n.tail >= 1755 && n.plan > 0, J(n));
});

test('no miles or rep time wheel on any run day of the run-goal lattice carries a dash row', () => {
  // 6 run goals x 2 focus x 2 experience x 2 seeds, HALF_MANNY, a run + bike + swim program at both seeds, and three
  // injured run + bike programs: 54 programs. Floors: 1,908 miles wheels and 48 rep time wheels (measure's counts).
  const progs: [string, object][] = [['HALF_MANNY', HALF_CFG]];
  for (const g of ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal']) {
    for (const f of ['balanced', 'strength']) for (const ex of ['beginner', 'advanced']) for (const sd of [76308, 24865]) progs.push([g + '|' + f + '|' + ex + '|' + sd, mkCfg([['run', g]], f, ex, 'commercial', sd)]);
  }
  for (const sd of [76308, 24865]) progs.push(['multi|' + sd, mkCfg([['run', 'run_half'], ['bike', 'bike_base'], ['swim', 'swim_base']], 'balanced', 'intermediate', 'commercial', sd)]);
  for (const reg of ['knee', 'ankle', 'lowback']) {
    progs.push(['injury ' + reg, Object.assign(mkCfg([['run', 'run_10k'], ['bike', 'bike_base']], 'balanced', 'intermediate', 'commercial', 76308), { injury: { region: reg, tier: 'protect' } })]);
  }
  assert.equal(progs.length, 54);
  const n: Record<string, number> = { dist: 0, rept: 0 };
  for (const [name, cfg] of progs) {
    const p = C.build(cfg);
    C.use(p);
    C.unforce();
    for (const w of weeksOf(p)) {
      for (const d of DAYS) {
        if (sportOf(p.weeks[w][d]) !== 'run') continue;
        C.open(w, d);
        for (const wh of C.wheels()) {
          if (wh.kind !== 'dist' && wh.kind !== 'rept') continue;
          n[wh.kind]++;
          assert.ok(wh._cols[0] && !wh._cols[0].items.some((it) => it.v === ''), name + ' W' + w + ' ' + d + ' ' + wh.kind);
        }
      }
    }
  }
  assert.ok(n.dist >= 1908 && n.rept >= 48, J(n));
});
