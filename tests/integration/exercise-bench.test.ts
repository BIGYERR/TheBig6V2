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
  assert.equal(E.hip_stability.length, 11);   // nine at D239; D241 adds the long-lever Copenhagen and the KB hip flexor raise
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
  // His leg day carries the foot & ankle block: Thursday since D243 (v0.243.0), Tuesday before.
  const block = (w: number, re: RegExp) => ((p.weeks as any)[w].thu.sections || []).find((s: any) => re.test(s.label || ''));
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

// ── D241 (P-BENCH-STRENGTH, v0.242.0): slice 2, with F1, F2 and Amendment 1 ─────────────────────────────────────────
// Oracles from the ruling: the pools, the prices (_POWER_COST rows: plyo push 0.5, seated box jump 1.0, split squat
// jump 1.5, box jump 2.0), the gear each name needs, the experience caps (beginner 1.0, intermediate 1.5, advanced 2.0),
// the drop lists, the half price of a core drill, and the wildcard as posted.
const PRICE: Record<string, number> = { 'Plyo pushups': 0.5, 'Seated box jumps': 1.0, 'Split-squat jumps': 1.5, 'Bulgarian split squat jumps': 1.5, 'Single-leg box jumps': 2.0 };
const CAP: Record<string, number> = { beginner: 1.0, intermediate: 1.5, advanced: 2.0 };
const S2 = ['Heel-elevated goblet squat', 'Barbell pin squat', 'Deficit reverse lunge (KB)', 'Goblet side lunge to knee drive', 'Dumbbell split-stance calf raise',
  'Single-arm dumbbell bench press', 'Seated dumbbell shoulder press', 'Plyo pushups', 'Wall-press dead bug', 'Overhead sit-up', 'V-ups', 'Farmer march',
  'Russian twist (heels down)', 'Hollow hold dumbbell press', 'Bulgarian split squat jumps', 'Copenhagen plank (long lever)', 'Single-leg box jumps',
  'Seated box jumps', 'Barbell reverse lunge', 'Step-downs (KB)', 'Kettlebell hip flexor raise'];
const S2_DOSE: Record<string, string> = { 'Wall-press dead bug': '3×8 each, slow', 'Overhead sit-up': '3×8', 'V-ups': '3×8', 'Farmer march': '3×20 marches',
  'Russian twist (heels down)': '3×8 each', 'Hollow hold dumbbell press': '3×30 sec', 'Copenhagen plank (long lever)': '2×20 sec each', 'Kettlebell hip flexor raise': '2×10 each' };
const LOADED = /KB|Kettlebell|Dumbbell|dumbbell|Barbell|Goblet|goblet|Farmer|box jump/;
const BAR = /Barbell|box jump/;
const liftCfg = (over: Partial<Cfg>): Cfg => ({ ...cfgOf(over), cardioTypes: [], cardioGoals: {}, eventTargeted: false, raceDate: null, primaryPath: 'body' } as Cfg);
const S2_LAT: { over: Partial<Cfg>; bike: boolean; tag: string }[] = [];
for (const equipment of TIERS) for (const liftingFocus of ['balanced', 'hypertrophy', 'support_athletic', 'fatloss'] as LiftingFocus[]) for (const experience of ['beginner', 'advanced'] as Cfg['experience'][]) for (const seed of [1013, 76308]) for (const bike of [false, true])
  S2_LAT.push({ over: { equipment, liftingFocus, experience, seed }, bike, tag: `${equipment} ${liftingFocus} ${experience} ${seed}${bike ? ' bike' : ''}` });
const S2_RUN = (() => {
  const prints: Record<string, Record<string, number>> = {}, bad: string[] = [];
  const pillar: Record<string, Set<string>> = {};
  for (const c of S2_LAT) {
    const p: any = IA.buildProgram(c.bike ? cfgOf({ ...c.over, primaryPath: 'body' }, true) : liftCfg(c.over));
    for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) for (const s of (p.weeks[w][d] && p.weeks[w][d].sections) || []) {
      if (s.core) { const k = s.pillar + '|' + c.over.equipment; (pillar[k] = pillar[k] || new Set()); for (const it of s.items || []) pillar[k].add(clean(it.name)); }
      for (const it of s.items || []) {
        const n = clean(it.name), eq = String(c.over.equipment);
        if (!S2.includes(n)) continue;
        ((prints[n] = prints[n] || {})[eq] = (prints[n][eq] || 0) + 1);
        if (S2_DOSE[n] && it.detail !== S2_DOSE[n]) bad.push(`dose ${n} '${it.detail}' ${c.tag}`);
        if (eq === 'bodyweight' && LOADED.test(n)) bad.push('bodyweight ' + n);
        if (BAR.test(n) && !['home_full', 'commercial', 'crossfit'].includes(eq)) bad.push('no bar ' + n + ' ' + eq);
        if (n === 'Copenhagen plank (long lever)' && c.over.experience !== 'advanced') bad.push('long lever ' + c.tag);
        if (n === 'Single-arm dumbbell bench press' && !/ each\b/.test(String(it.detail))) bad.push('no side ' + it.detail + ' ' + c.tag);
        if (n in PRICE && PRICE[n]! > CAP[String(c.over.experience)]!) bad.push('power over the experience cap ' + n + ' ' + c.tag);
      }
    }
  }
  return { prints, bad, pillar };
})();

test('every power-pool name has a price: the split squat row reads a space, so the Bulgarian jumps cost 1.5, not 0 (the latch)', () => {
  const cost = IA.eval('_powerCost');
  for (const [n, want] of Object.entries(PRICE)) assert.equal(cost(n), want, n);
});

test('the slice 2 names sit in the pools the ruling named, and the one-arm press is a per-side press', () => {
  const E = IA.EXLIB;
  assert.ok(!IA.EXLIB.squat_joint.includes('Heel-elevated goblet squat'), 'A2: not in the older lifter\'s joint-friendly pool');
  for (const [pool, names] of [['squat', ['Barbell pin squat']], ['calves', ['Dumbbell split-stance calf raise']],
    ['lunge', ['Deficit reverse lunge (KB)', 'Goblet side lunge to knee drive', 'Barbell reverse lunge', 'Step-downs (KB)']], ['chest_acc', ['Single-arm dumbbell bench press']],
    ['shoulder', ['Seated dumbbell shoulder press']], ['hip_stability', ['Copenhagen plank (long lever)', 'Kettlebell hip flexor raise']]] as [string, string[]][]) {
    for (const n of names) assert.ok(E[pool].includes(n), pool + ': ' + n);
  }
  const P = IA.eval('CORE_PILLARS');
  const names = (a: any[]) => Array.from(a, (i: any) => i.name);
  assert.ok(names(P.anti_extension.static).includes('Wall-press dead bug'));
  assert.ok(names(P.anti_extension.loaded).includes('Hollow hold dumbbell press'));
  for (const n of ['Overhead sit-up', 'V-ups', 'Farmer march']) assert.ok(names(P.dynamic_bracing.items).includes(n), n);
  assert.ok(names(P.rotational_power.items).includes('Russian twist (heels down)'));
  assert.equal(IA.eval("_isOneArmPress('Single-arm dumbbell bench press')"), true);
  assert.equal(IA.eval("REP_AFFINITY['Barbell pin squat'].maxReps"), 6);
  assert.equal(IA.eval("EX_MIN_EXP['Copenhagen plank (long lever)']"), 'advanced');
});

test('every slice 2 name prints, with its dose, only on tiers that own its gear, the long lever only for advanced, the one-arm press with a side, power under the experience cap', () => {
  assert.deepEqual(S2_RUN.bad, []);
  // the five power names print rarely (one power block a week, two picks); their pools are held by the next test
  for (const n of S2.filter((x) => !(x in PRICE))) assert.ok(Object.values(S2_RUN.prints[n] || {}).reduce((a, b) => a + b, 0) > 0, n + ' never printed');
});

test('the power pools hold the new names on the tiers that own them: every pool a program draws is in its swap universe', () => {
  const uni = (equipment: Equipment) => new Set(Array.from(IA.buildProgram(cfgOf({ equipment, liftingFocus: 'support_athletic', experience: 'advanced', seed: 3039, primaryPath: 'event' }))._swapUniverse || []));
  const cf = uni('crossfit'), hb = uni('home_basic'), bw = uni('bodyweight');
  for (const n of Object.keys(PRICE)) assert.ok(cf.has(n), 'crossfit ' + n);
  for (const n of ['Split-squat jumps', 'Bulgarian split squat jumps', 'Plyo pushups']) { assert.ok(hb.has(n), 'home_basic ' + n); }
  for (const n of ['Bulgarian split squat jumps', 'Plyo pushups']) assert.ok(bw.has(n), 'bodyweight ' + n);
  for (const n of ['Single-leg box jumps', 'Seated box jumps']) { assert.ok(!hb.has(n), 'no box on home_basic: ' + n); assert.ok(!bw.has(n), 'no box on bodyweight: ' + n); }
});

// The core rotations, by hand: getDynamicCoreBlock(R, role, hardRun, hotTomorrow, slot, equip) at each R where the branch
// fires. rotOn(T, arr, n) is arr[(T - 1 + n) mod len]. The loaded anti-extension branch fires at R ≡ 2 (mod 3), T = (R - 1) / 3
// floored, and draws [loaded at n = 0, static at n = 0]; with no legal loaded member, [static at 0, static at 1]. Dynamic
// bracing fires at R ≡ 1 (mod 3) and draws n = T and T + 1. Lists typed from the ruling's pillars.
const AE_STATIC = ['Plank hold', 'Bird dogs', 'McGill curl-up', 'Superman', 'RKC plank', 'Wall-press dead bug'];
const AE_LOADED = ['Ab wheel rollouts', 'Weighted dead bugs', 'Barbell rollouts', 'Hollow hold dumbbell press'];
const DB_BW = ['Hanging knee raises', 'Hanging leg raises', 'Garhammer raises', 'Toes-to-bar', 'Overhead sit-up', 'V-ups'];
const at = (arr: string[], T: number, n: number) => arr[(((T - 1 + n) % arr.length) + arr.length) % arr.length];
const coreAt = (R: number, equip: string) => {
  const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, false, 0, '${equip}')`);
  return { pillar: String(b.pillar), items: Array.from(b.items || [], (i: any) => clean(i.name)) };
};

test('F1 and F2: the loaded anti-extension tier walks every loaded member on its own clock, and bodyweight draws two static members', () => {
  for (const R of [2, 5, 8, 11, 14]) {
    const T = Math.floor((R - 1) / 3);
    const c = coreAt(R, 'commercial');
    assert.equal(c.pillar, 'anti_extension', 'R=' + R);
    assert.deepEqual(c.items, [at(AE_LOADED, T, 0), at(AE_STATIC, T, 0)], 'commercial R=' + R);
    assert.deepEqual(coreAt(R, 'bodyweight').items, [at(AE_STATIC, T, 0), at(AE_STATIC, T, 1)], 'bodyweight R=' + R);
  }
  const seen = new Set([2, 5, 8, 11].map((R) => coreAt(R, 'commercial').items[0]));
  assert.deepEqual([...seen].sort(), AE_LOADED.slice().sort(), 'four firings reach all four loaded members');
});

test('dynamic bracing walks all six bodyweight members on its own clock (R steps by 3, so six used to lock on two)', () => {
  const seen = new Set<string>();
  for (const R of [1, 4, 7, 10]) {
    const T = Math.floor((R - 1) / 3);
    const c = coreAt(R, 'bodyweight');
    assert.equal(c.pillar, 'dynamic_bracing', 'R=' + R);
    assert.deepEqual(c.items, [at(DB_BW, T, T), at(DB_BW, T, T + 1)], 'R=' + R);
    c.items.forEach((n) => seen.add(n));
  }
  assert.deepEqual([...seen].sort(), DB_BW.slice().sort());
  assert.ok(!coreAt(7, 'bodyweight').items.includes('Farmer march'));
});

// One item through the injury filter (applyInjuryFilter on a one-item section): DROPPED, or the name it keeps.
const filtered = (name: string, region: string, tier: string) => {
  const out = IA.applyInjuryFilter([{ label: 'T', items: [{ name, detail: '3×10' }] }], { injury: { region, tier } });
  const it = out && out[0] && out[0].items && out[0].items[0];
  return it ? clean(it.name) : 'DROPPED';
};

test('the injury plans drop what the ruling drops and keep what it keeps (hand table)', () => {
  const TABLE: [string, string, string, boolean][] = [
    ['Barbell reverse lunge', 'lowback', 'protect', true], ['Barbell reverse lunge', 'lowback', 'workaround', true], ['Farmer march', 'lowback', 'workaround', true],
    ['Farmer march', 'elbow', 'workaround', true], ['Seated dumbbell shoulder press', 'shoulder', 'workaround', true], ['Plyo pushups', 'shoulder', 'workaround', true],
    ['Hollow hold dumbbell press', 'shoulder', 'protect', true], ['Hollow hold dumbbell press', 'elbow', 'workaround', true], ['Plyo pushups', 'elbow', 'workaround', true],
    ['Wall-press dead bug', 'shoulder', 'protect', true], ['Wall-press dead bug', 'elbow', 'protect', true], ['Kettlebell hip flexor raise', 'hip', 'protect', true],
    ['Copenhagen plank (long lever)', 'hip', 'workaround', true], ['Bulgarian split squat jumps', 'knee', 'workaround', true], ['Step-downs (KB)', 'knee', 'protect', true],
    // kept where the ruling keeps them
    ['Wall-press dead bug', 'shoulder', 'workaround', false], ['Kettlebell hip flexor raise', 'hip', 'workaround', false], ['Russian twist (heels down)', 'knee', 'protect', false],
    ['Plyo pushups', 'knee', 'workaround', false], ['Farmer march', 'knee', 'protect', false],
  ];
  for (const [n, region, tier, drop] of TABLE) assert.equal(filtered(n, region, tier), drop ? 'DROPPED' : n, `${n} under ${region}/${tier}`);
  // Amendment 2: under either lowback plan the flexion and twist drills swap to spine-safe drills, so the core block keeps its count
  const SWAP: [string, string][] = [['Overhead sit-up', 'Dead bugs'], ['V-ups', 'Bird dogs'], ['Russian twist (heels down)', 'Standing torso rotations (slow)']];
  for (const tier of ['protect', 'workaround']) for (const [n, to] of SWAP) assert.equal(filtered(n, 'lowback', tier), to, `${n} under lowback/${tier}`);
});

test('the rehab day\'s trunk never draws the wall press under a shoulder or elbow protect plan (its drops leave before the draw)', () => {
  assert.ok(Array.from(IA.eval('CORE_PILLARS').anti_extension.static, (i: any) => i.name).includes('Wall-press dead bug'), 'the pillar the trunk draws from holds it');
  for (const region of ['shoulder', 'elbow']) for (const equipment of TIERS) for (const seed of [1013, 3039]) {
    const p: any = IA.buildProgram(liftCfg({ equipment, seed, liftingFocus: 'balanced', experience: 'advanced', injury: { region, tier: 'protect' } }));
    for (const [n, , lab] of items(p)) assert.ok(!(n === 'Wall-press dead bug'), `${region}/protect ${equipment} ${seed} ${lab}`);
    let trunk = 0;
    for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) for (const sec of (p.weeks[w][d] && p.weeks[w][d].sections) || []) if (/^Trunk — /.test(sec.label || '')) trunk++;
    assert.ok(trunk > 0, `${region}/protect ${equipment} ${seed} has a rehab trunk`);
  }
});

test('Amendment 1: under either lowback plan the lunge slots draw a held lunge, never print short (guards behaviour that must not change)', () => {
  assert.ok(IA.EXLIB.lunge.includes('Barbell reverse lunge'), 'the barbell lunge is in the pool the lowback plans filter');
  for (const tier of ['protect', 'workaround'] as const) for (const equipment of ['home_full', 'commercial', 'crossfit'] as Equipment[]) for (const seed of [1013, 3039]) {
    const p: any = IA.buildProgram(liftCfg({ equipment, liftingFocus: 'balanced', experience: 'advanced', seed, injury: { region: 'lowback', tier } }));
    for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) for (const s of (p.weeks[w][d] && p.weeks[w][d].sections) || []) {
      if (/^(Leg superset A|Lower strength)/.test(s.label || '') && s.superset) assert.equal(s.items.length, 2, `lowback/${tier} ${equipment} ${seed} W${w} ${d}`);
    }
  }
});

test('the new core drills cost half in the session budget, like their siblings (and the torso rotation, A2): a day at the cap with one is untouched', () => {
  const csb = IA.eval('capSessionBudget');
  // 12 + 3 + 3 working sets = 18; a 3-set core drill at half is 1.5, so 19.5 sits under the 20 cap. At full price it is 21.
  for (const n of ['Russian twist (heels down)', 'Overhead sit-up', 'V-ups', 'Farmer march', 'Standing torso rotations (slow)']) {
    const day = [
      { label: 'Main lift', items: [{ name: 'Back squat', detail: '12×5' }] },
      { label: 'Accessory', items: [{ name: 'Dumbbell curl', detail: '3×12' }, { name: 'Hammer curl', detail: '3×12' }] },
      { label: '', core: true, pillar: 'rotational_power', coreHeader: 'Core', items: [{ name: n, detail: '3×8' }] },
    ];
    assert.equal(csb(day, null), day, n + ': a day under the cap comes back as it went in');
  }
});

test('the lap and station circuit is a wildcard session in the fat loss and athletic pools, as posted', () => {
  const RAND = IA.eval('RAND_POOLS');
  const STATIONS = ['Jump squats 20 reps', 'Pushups 20 reps', 'Mountain climbers 20 each leg', 'Walking lunge 10 each leg', 'Burpees 10 reps', 'Sit-ups 20 reps',
    'Spiderman pushups 5 each side', 'Side lunge (bodyweight) 10 each side, moving'];
  for (const pool of ['fatloss', 'athletic']) {
    const w = Array.from(RAND[pool] as any[]).find((x: any) => x.title === 'Lap and Station');
    assert.ok(w, pool + ' holds it');
    assert.equal(w.cardio.type, 'run');
    assert.deepEqual(Array.from(w.sections[0].items, (i: any) => i.name + ' ' + i.detail), STATIONS);
  }
});
