// The exercise bench: the movements Mario's screenshot harvest added, where they print and for whom.
// Rulings (docs/decisions/exercise-bench.md):
//   D239 (P-BENCH-PREHAB, v0.241.0) thirteen prehab movements join the leg day's two prehab blocks:
//     foot & ankle (runners only), seven drills, the two kettlebell ones on loaded tiers only;
//     hip stability, three drills on every tier; hip mobility, three pieces on every tier;
//     each prints its ruled dose, which no dose sweep rewrites; the mobility piece stays free in the session budget;
//     knee/protect drops the Cossack shift and the heel-raise hold, hip/protect the Copenhagen plank, the Cossack
//     shift and the bridge hold, hip/workaround the Copenhagen plank;
//     race week keeps its fixed foot & ankle pair, and the taper keeps drawing from the pool (V179, V180);
//   D239 Amendment 1: the drops leave the prehab pools before the draw, so an injured athlete's blocks stay full.
//
// Oracles are typed by hand from the ruling: the names, their pools and tiers, their doses, the injury drops and the
// session-budget arithmetic (20 sets, prehab rails at half, stretches and mobility pieces free). THE HALF MANNY's new
// digest (b7ca51befcf96a9e, coach's source-surgery copy) is held by tests/snapshots/program-output.json.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, fixtures } from '../support/app.ts';
import type { Cfg, Equipment, LiftingFocus } from '@ia/core';

const IA = loadApp();
const clean = (n: unknown): string => String(n || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

const DOSE: Record<string, string> = {
  'Single-leg balance hold (eyes closed)': '2×30 sec each',
  'Single-leg KB pass-around': '2×5 each direction, each leg',
  'Kettlebell tibialis raise (seated)': '2×15',
  'Split-squat heel-raise hold': '2×30 sec each',
  'Knee-to-wall ankle rocks': '2×10 each',
  'Towel scrunches': '2×20 each foot',
  'Tiptoe walks': '2×30 yards',
  'Copenhagen plank (bent knee)': '2×20 sec each',
  'Side plank (top leg raised)': '2×20 sec each',
  'Glute bridge hold': '2×30 sec',
  'Cossack squat shift': '2×6 each side, slow',
  'Half-kneeling hip flexor stretch': '2×45 sec each',
  'Pigeon lift-offs': '2×8 each',
};
const FOOT = Object.keys(DOSE).slice(0, 7);
const HIP_STAB = ['Copenhagen plank (bent knee)', 'Side plank (top leg raised)', 'Glute bridge hold'];
const HIP_MOB = ['Cossack squat shift', 'Half-kneeling hip flexor stretch', 'Pigeon lift-offs'];
const KB = ['Single-leg KB pass-around', 'Kettlebell tibialis raise (seated)'];
const TIERS: Equipment[] = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const FOCUSES: LiftingFocus[] = ['support_prevention', 'hypertrophy', 'balanced'];
const SEEDS = [1013, 3039, 76308];

const cfgOf = (over: Partial<Cfg>, bike = false): Cfg => {
  const c: Cfg = { ...JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), ...over };
  if (bike) Object.assign(c, { cardioTypes: ['bike'], cardioGoals: { bike: { id: 'bike_base', label: 'Base' } }, eventTargeted: false, raceDate: '' });
  return c;
};
/** Every item the program prints: [name, detail, section label]. */
const items = (prog: any): [string, string, string][] => {
  const out: [string, string, string][] = [];
  for (const w of Object.keys(prog.weeks)) for (const d of Object.keys(prog.weeks[w])) {
    for (const s of (prog.weeks[w][d] && prog.weeks[w][d].sections) || []) for (const it of s.items || []) out.push([clean(it.name), String(it.detail || ''), String(s.label || s.coreHeader || '')]);
  }
  return out;
};
/** How often each new name prints, per tier, over the runner lattice; and every print whose dose is not the ruled one. */
const census = (bike: boolean, injury: Cfg['injury'] = null) => {
  const prints: Record<string, Record<string, number>> = {};
  const wrongDose: string[] = [];
  for (const equipment of TIERS) for (const liftingFocus of FOCUSES) for (const seed of SEEDS) {
    const prog = IA.buildProgram(cfgOf({ equipment, liftingFocus, seed, experience: 'intermediate', injury }, bike));
    for (const [n, det, lab] of items(prog)) {
      if (!(n in DOSE)) continue;
      ((prints[n] = prints[n] || {})[equipment] = (prints[n][equipment] || 0) + 1);
      if (det !== DOSE[n]) wrongDose.push(`${n} '${det}' (${equipment} ${liftingFocus} ${seed}, ${lab})`);
    }
  }
  return { prints, wrongDose };
};
const RUN = census(false);
const sumOf = (r: Record<string, number> | undefined): number => Object.values(r || {}).reduce((a, b) => a + b, 0);

test('the thirteen names sit in the pools the ruling named, and the bodyweight foot list leaves out the two kettlebell drills', () => {
  const E = IA.EXLIB;
  for (const n of FOOT) assert.ok(E.foot_ankle.includes(n), 'foot_ankle: ' + n);
  for (const n of FOOT) assert.equal(E.foot_ankle_bw.includes(n), !KB.includes(n), 'foot_ankle_bw: ' + n);
  for (const n of HIP_STAB) assert.ok(E.hip_stability.includes(n), 'hip_stability: ' + n);
  for (const n of HIP_MOB) assert.ok(E.hip_mobility.includes(n), 'hip_mobility: ' + n);
  assert.equal(E.foot_ankle.length, 11);
  assert.equal(E.foot_ankle_bw.length, 8);
  assert.equal(E.hip_stability.length, 9);
  assert.equal(E.hip_mobility.length, 7);
});

test('on a runner every name prints with its ruled dose on every tier that owns it, and the kettlebell drills never on bodyweight', () => {
  assert.deepEqual(RUN.wrongDose, []);
  for (const n of Object.keys(DOSE)) for (const t of TIERS) {
    const got = (RUN.prints[n] || {})[t] || 0;
    if (KB.includes(n) && t === 'bodyweight') assert.equal(got, 0, n + ' on bodyweight');
    else assert.ok(got > 0, n + ' never printed on ' + t);
  }
});

test('a bike program prints the hip names and none of the foot drills (foot & ankle is for runners)', () => {
  const B = census(true);
  assert.deepEqual(B.wrongDose, []);
  for (const n of FOOT) assert.equal(sumOf(B.prints[n]), 0, n);
  for (const n of HIP_STAB.concat(HIP_MOB)) assert.ok(sumOf(B.prints[n]) > 0, n);
});

test('THE HALF MANNY: the taper week draws from the new pool, and race week keeps its fixed mobility pair', () => {
  const p = IA.buildProgram(fixtures.HALF_MANNY);
  const block = (w: number, re: RegExp) => ((p.weeks as any)[w].tue.sections || []).find((s: any) => re.test(s.label || ''));
  const w13 = block(13, /^Foot & ankle$/);
  assert.deepEqual(Array.from(w13.items, (i: any) => clean(i.name) + ' ' + i.detail), ['Split-squat heel-raise hold 2×30 sec each', 'Kettlebell tibialis raise (seated) 2×15']);
  let raceWeek: any = null;
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys((p.weeks as any)[w])) {
    for (const s of ((p.weeks as any)[w][d] && (p.weeks as any)[w][d].sections) || []) if (/mobility only/.test(s.label || '')) raceWeek = s;
  }
  assert.ok(raceWeek, 'race week has its foot & ankle block');
  assert.deepEqual(Array.from(raceWeek.items, (i: any) => clean(i.name)), ['Standing ankle CARs', 'Toe yoga (splay + big-toe lifts)']);
});

test('each injury drop takes the name out where the healthy twin prints it, and the workaround tiers keep what they keep', () => {
  const total = (c: ReturnType<typeof census>, n: string) => sumOf(c.prints[n]);
  const KP = census(false, { region: 'knee', tier: 'protect' }), KW = census(false, { region: 'knee', tier: 'workaround' });
  const HP = census(false, { region: 'hip', tier: 'protect' }), HW = census(false, { region: 'hip', tier: 'workaround' });
  for (const n of ['Cossack squat shift', 'Split-squat heel-raise hold']) {
    assert.ok(total(RUN, n) > 0, 'healthy prints ' + n);
    assert.equal(total(KP, n), 0, 'knee/protect drops ' + n);
    assert.ok(total(KW, n) > 0, 'knee/workaround keeps ' + n);
  }
  for (const n of ['Copenhagen plank (bent knee)', 'Cossack squat shift', 'Glute bridge hold']) assert.equal(total(HP, n), 0, 'hip/protect drops ' + n);
  assert.equal(total(HW, 'Copenhagen plank (bent knee)'), 0, 'hip/workaround drops the Copenhagen plank');
  for (const n of ['Cossack squat shift', 'Glute bridge hold']) assert.ok(total(HW, n) > 0, 'hip/workaround keeps ' + n);
  for (const c of [KP, KW, HP, HW]) assert.deepEqual(c.wrongDose, []);
});

test('an injured athlete\'s prehab blocks keep their full count: the drops leave the pool before the draw (D239 A1; guards behaviour that must not change)', () => {
  for (const injury of [{ region: 'knee', tier: 'protect' }, { region: 'hip', tier: 'protect' }, { region: 'hip', tier: 'workaround' }] as Cfg['injury'][]) {
    for (const equipment of TIERS) for (const seed of SEEDS) {
      const p = IA.buildProgram(cfgOf({ equipment, seed, liftingFocus: 'balanced', experience: 'intermediate', injury }));
      for (const w of Object.keys(p.weeks)) for (const d of Object.keys((p.weeks as any)[w])) {
        for (const s of ((p.weeks as any)[w][d] && (p.weeks as any)[w][d].sections) || []) {
          if (s.label === 'Hip stability') assert.equal(s.items.length, 3, `${injury!.region}/${injury!.tier} ${equipment} ${seed} W${w} ${d} hip`);
          if (s.label === 'Foot & ankle') assert.equal(s.items.length, 2, `${injury!.region}/${injury!.tier} ${equipment} ${seed} W${w} ${d} foot`);
        }
      }
    }
  }
});

test('the hip block\'s mobility piece costs nothing in the session budget: a day at the cap with the Cossack shift or the pigeon lift-offs is untouched', () => {
  const csb = IA.eval('capSessionBudget');
  // 12 + 3 + 3 = 18 working sets, two hip rail drills at half (1 + 1) = 20, the cap; the mobility piece adds nothing.
  const day = (mob: string) => [
    { label: 'Main lift', items: [{ name: 'Back squat', detail: '12×5' }] },
    { label: 'Accessory', items: [{ name: 'Dumbbell curl', detail: '3×12' }, { name: 'Hammer curl', detail: '3×12' }] },
    { label: 'Hip stability', hip: true, items: [{ name: 'Clamshells w/ band', detail: '2×15 each' }, { name: 'Banded side steps', detail: '2×20 each' }, { name: mob, detail: DOSE[mob] || '2×30 sec each' }] },
  ];
  for (const mob of ['IT band stretch', 'Cossack squat shift', 'Pigeon lift-offs', 'Half-kneeling hip flexor stretch']) {
    const at = day(mob);
    assert.equal(csb(at, null), at, mob + ': a day at the cap comes back as it went in');
  }
});
