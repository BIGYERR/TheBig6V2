// The power block: how many sets a power movement runs, and what its card says.
// Rulings (docs/decisions/power-block.md):
//   D260 (P-POWERSETS, v0.250.0) a max-intent power movement (priced above 0.5) runs 3 to 5 sets: share 12/110 of the
//        budget, clamped 3 to 5, where it ran 7×3 for an intermediate and 9×3 for an advanced athlete. The trap bar
//        jump's cue opens with "light bar". The 0.5 tier keeps V170 D3's density dose.
//
// Oracles are typed by hand from the ruling's formula: sets = round(budget × age mod × 12/110 ÷ (cost × reps)), with
// budgets 90/110/130 and age mods 1/0.92/0.82, clamped 3 to 5; a deload keeps max(2, round(0.6 × sets)). The swing
// rows guard behaviour that must not change (the 0.5 tier), so they pass on v0.249.1 too. HALF_MANNY does not move
// under D260; tests/snapshots/program-output.json holds it.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { Cfg, Experience } from '@ia/core';
import { loadApp, progDigest } from '../support/app.ts';
import { cfg, RUN } from '../support/programs.ts';

const IA = loadApp();
const rx = IA.eval('_powerPrescribe') as (name: string, roleReps: number, experience: string, ageBracket: string) => string;
const EXP: Experience[] = ['beginner', 'intermediate', 'advanced'];
const AGES = ['18-35', '36-54', '55+'];

// The screenshot's shape: a 1.5 mile test goal on commercial gear, Athletic Support, intermediate, rest Sunday and
// Wednesday. W2 Saturday leads with Trap bar jump and follows with Jump squats, as Mario's card did.
const SCREENSHOT: Cfg = cfg({ goals: { run: RUN.pace }, focus: 'support_athletic', experience: 'intermediate', equipment: 'commercial', rest: ['sun', 'wed'], seed: 24865 });

function powerItems(c: Cfg, week: string, day: 'sat'): string[] {
  const a = IA.buildProgram(c), b = IA.buildProgram(c);
  assert.equal(progDigest(a), progDigest(b), 'the program equals itself built twice');
  const sec = (a.weeks[week]?.[day]?.sections || []).find((s: { label?: string }) => /^power\b/i.test(s.label || ''));
  assert.ok(sec, `W${week} ${day} has a power block`);
  return Array.from(sec.items as { name: string; detail: string }[], i => i.name + ' ' + i.detail);   // a host array: the VM's fails deepEqual
}

test('the screenshot day: W2 Saturday prints Trap bar jump 4×3 with a light bar, then Jump squats 3×5', () => {
  assert.deepEqual(powerItems(SCREENSHOT, '2', 'sat'), [
    'Trap bar jump 4×3 — light bar, max intent, ~2 min rest',
    'Jump squats 3×5 — explosive, ~2 min rest',
  ]);
});

test('a deload week keeps 60 percent of the new dose: the same program\'s W8 Saturday prints Trap bar jump 2×3', () => {
  // max(2, round(0.6 × 4)) = 2. The swing beside it is 0.5-tier work: max(2, round(0.6 × 4)) = 2 before and after.
  assert.deepEqual(powerItems(SCREENSHOT, '8', 'sat'), [
    'Trap bar jump 2×3 — light bar, max intent, ~2 min rest',
    'Kettlebell swing 2×10 — fast and crisp, 60s rest',
  ]);
});

test('a lead double-leg jump triple runs 3 to 5 sets by experience and age, never the 6 to 9 it used to', () => {
  const want: Record<string, number[]> = { beginner: [3, 3, 3], intermediate: [4, 4, 3], advanced: [5, 4, 4] };
  for (const e of EXP) AGES.forEach((age, i) => {
    assert.equal(rx('Jump squats', 3, e, age), `${want[e]![i]}×3 — max intent, ~2 min rest`, `${e} ${age}`);
  });
});

test('every second-slot movement priced above 0.5 runs 3 sets of 5, at every experience and age', () => {
  for (const e of EXP) for (const age of AGES) assert.equal(rx('Jump squats', 5, e, age), '3×5 — explosive, ~2 min rest', `${e} ${age}`);
  for (const e of ['intermediate', 'advanced']) assert.equal(rx('Split-squat jumps', 5, e, '18-35'), '3×5 — explosive, ~2 min rest', e);
});

test('a one-leg landing triple and a box jump triple both run 3 sets', () => {
  assert.equal(rx('Split-squat jumps', 3, 'intermediate', '18-35'), '3×3 — max intent, ~2 min rest');
  assert.equal(rx('Box jumps', 3, 'advanced', '18-35'), '3×3 — max intent, ~3 min rest');
});

test('the trap bar jump says light bar in either slot, and no other movement does', () => {
  assert.equal(rx('Trap bar jump', 3, 'advanced', '18-35'), '5×3 — light bar, max intent, ~2 min rest');
  assert.equal(rx('Trap bar jump', 5, 'intermediate', '18-35'), '3×5 — light bar, explosive, ~2 min rest');
  assert.doesNotMatch(rx('Jump squats', 3, 'intermediate', '18-35'), /light bar/);
});

test('the 0.5 tier keeps its density dose: a swing lead is 4×10 for an intermediate and 5×10 for an advanced athlete', () => {
  // Guards behaviour D260 must not change: 110 × 0.20 ÷ (0.5 × 10) = 4.4, 130 × 0.20 ÷ 5 = 5.2.
  assert.equal(rx('Kettlebell swing', 3, 'intermediate', '18-35'), '4×10 — fast and crisp, 60s rest');
  assert.equal(rx('Kettlebell swing', 5, 'advanced', '18-35'), '5×10 — fast and crisp, 60s rest');
});

test('no max-intent or explosive power item prints more than 5 sets on any program in an NSW sweep', () => {
  let items = 0;
  for (const run of [RUN.pace, RUN.base]) for (const equipment of ['crossfit', 'commercial'] as const)
  for (const experience of EXP) for (const age of AGES) for (const seed of [3039, 24865]) {
    const p = IA.buildProgram(cfg({ goals: { run }, focus: 'support_athletic', experience, age, equipment, rest: ['sun', 'wed'], seed }));
    for (const wk of Object.values(p.weeks)) for (const day of Object.values(wk as Record<string, any>)) {
      for (const s of day?.sections || []) {
        if (!/^power\b/i.test(s.label || '')) continue;
        for (const it of s.items || []) {
          if (!/ — (light bar, )?(max intent|explosive),/.test(it.detail || '')) continue;
          items++;
          const sets = Number(/^(\d+)×/.exec(it.detail)?.[1]);
          assert.ok(sets >= 2 && sets <= 5, `${it.name} ${it.detail} (${run.id} ${equipment} ${experience} ${age} seed ${seed})`);
        }
      }
    }
  }
  assert.ok(items >= 100, `the sweep reached ${items} max-intent and explosive items (want at least 100)`);
});
