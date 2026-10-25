// Injury and travel overlays: what the injury filter renames, drops and holds, and what reaches the athlete through an
// overlay, the swap sheet and a reboot.
//   D43 and the heading sync: a renamed item carries its section heading with it.
//   D52 and D44: an injury pool never offers what the same plan's filter removes, and leaves two members standing.
//   D154: the injury renamer reads the gear lens.
//   D54: the travel overlay's holds copy names no implement.
//   D193: a capped pattern holds at RPE 7 (the cue, the clamp's four shapes, the held test) and the stripper reads both.
//   D194: the plan that governs a card is the plan of its day, in the sheets, at the tap and at boot.
//   D197: on bodyweight with an injury, every day is filtered once more after the sweep.
// The parity table is docs/test-migration/13-injury-overlays.md. The lattices (2,160 renamer builds, L432, the D177
// lite lattice, the late-plan presentations, the post-sweep population) run in tests/sweeps/injury-overlays.test.js.
//
// Oracles are typed here or in tests/support/injury-overlays.js: the cap table, the hold shapes, the cue, the held-test
// text, the toasts, the tier inventories, the doctrine of each overlay. The engine's _pattern names a movement's
// pattern (the classifier is not under test); the expected answer is never read off the engine. Seeds are pinned,
// clocks are pinned, and every stored record is shown to equal itself before records are compared.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { loadApp, appScript, fixtures } from '../support/app.ts';
import * as I from '../support/injury-overlays.ts';
import type { DayKey, Equipment, Item, Section } from '@ia/core';

const IA = loadApp();
const { clean, host, E } = I;

// ── D43 follow-on: the heading follows the item the filter renamed ──────────────────────────────────────────────────
// Every key of an in-place rename map an overlay reaches, typed; and the movements shoulder/workaround DELETES outright
// (overhead range, dips, pike and handstand, lateral raise), a parked class that may leave a heading behind.
const SWAP_KEYS = ['Dumbbell bench press', 'Dumbbell skullcrushers', 'Barbell curl', 'Preacher curl', 'Ab wheel rollouts', 'Hanging knee raises', 'L-sit hold', 'L-sit chinups', 'Hanging leg raises'];
const SHOULDER_WORKAROUND_DELETED = /overhead|arnold|push press|military|pike pushup|handstand|wall walk|\bdips\b|lateral raise/i;
const EQUIP6: Equipment[] = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const sectionsOf = (prog: any) => {
  const out: { wk: number; lastWk: number; d: DayKey; label: string; names: string[] }[] = [];
  const total = Object.keys(prog.weeks || {}).length;
  for (const wk of Object.keys(prog.weeks || {})) for (const d of I.DAYS) {
    const day = prog.weeks[wk][d];
    if (day) for (const s of day.sections || []) out.push({ wk: +wk, lastWk: total, d, label: String(s.label || ''), names: (s.items || []).map((i: Item) => clean(i.name)) });
  }
  return out;
};
const HEAD = (() => {
  const vocab = new Set(SWAP_KEYS);
  const healthyBench: Record<string, number> = {};
  let healthySections = 0;
  for (const equipment of EQUIP6) {
    healthyBench[equipment] = 0;
    for (const seed of [1013, 3039, 6078, 10130]) {
      for (const s of sectionsOf(IA.buildProgram({ ...fixtures.HALF_MANNY, equipment, seed }))) {
        healthySections++;
        s.names.forEach((x) => x && vocab.add(x));
        healthyBench[equipment] += s.names.filter((x) => x === 'Dumbbell bench press').length;
      }
    }
  }
  const r = { vocab, healthySections, healthyBench, injSections: 0, claims: 0, primer: 0, raceWeekPrimer: 0, latch: [] as string[], unexplained: [] as string[], floor: {} as Record<string, number>, bench: {} as Record<string, number> };
  for (const equipment of EQUIP6) {
    r.floor[equipment] = 0;
    r.bench[equipment] = 0;
    for (const seed of [1013, 3039, 6078, 10130]) {
      const prog = IA.buildProgram({ ...fixtures.HALF_MANNY, equipment, seed, injury: { region: 'shoulder', tier: 'workaround' } });
      for (const s of sectionsOf(prog)) {
        r.injSections++;
        r.floor[equipment] += s.names.filter((x) => x === 'Dumbbell floor press').length;
        r.bench[equipment] += s.names.filter((x) => x === 'Dumbbell bench press').length;
        const i = s.label.lastIndexOf(' — ');
        if (i < 0) continue;
        const prefix = s.label.slice(0, i);
        const tail = s.label.slice(i + 3).trim();
        if (!vocab.has(tail)) continue;
        r.claims++;
        if (prefix === 'Primer') { r.primer++; if (s.wk === s.lastWk) r.raceWeekPrimer++; }
        if (s.names.includes(tail)) continue;
        const where = `${equipment} seed=${seed} W${s.wk} ${s.d} "${s.label}" :: ${s.names.join(', ')}`;
        if (SWAP_KEYS.includes(tail)) r.latch.push(where);
        else if (!SHOULDER_WORKAROUND_DELETED.test(tail)) r.unexplained.push(where);
      }
    }
  }
  return r;
})();

test('the heading lattice is thick enough: a healthy vocabulary, injured headings that name movements, race-week primers', () => {
  assert.ok(HEAD.healthySections > 500 && HEAD.vocab.size > 100, `${HEAD.healthySections} healthy sections, ${HEAD.vocab.size} names`);
  assert.ok(HEAD.injSections > 500, `${HEAD.injSections} injured sections`);
  assert.ok(HEAD.claims > 200 && HEAD.primer > 0 && HEAD.raceWeekPrimer > 0, JSON.stringify({ claims: HEAD.claims, primer: HEAD.primer, raceWeek: HEAD.raceWeekPrimer }));
});

test('no heading names a movement the overlay renamed away: the heading follows the item', () => {
  assert.deepEqual(HEAD.latch.slice(0, 4), []);
});

test('every heading claim holds, or names a movement the shoulder workaround deletes outright (the parked class)', () => {
  assert.deepEqual(HEAD.unexplained.slice(0, 4), []);
});

test('D43 fires on every tier that owns dumbbells: the floor press in, the bench press out, and only on the injured program', () => {
  for (const e of EQUIP6.filter((x) => x !== 'bodyweight')) {
    assert.ok(HEAD.floor[e] > 0, `${e} prescribes Dumbbell floor press`);
    assert.equal(HEAD.bench[e], 0, `${e} prescribes no Dumbbell bench press`);
  }
  assert.ok(EQUIP6.some((e) => e !== 'bodyweight' && HEAD.healthyBench[e] > 0), 'a healthy program on some dumbbell tier prescribes the bench press');
});

const filterOne = (label: any, name: any, detail: any, injury: any, extra?: any) => {
  const cfg = { ...fixtures.HALF_MANNY, ...(extra || {}), ...(injury ? { injury } : {}) };
  const out = IA.applyInjuryFilter([{ label, items: [{ name, detail: detail || '3×10' }] }], cfg);
  return out && out.length ? { label: String(out[0].label || ''), name: clean((out[0].items[0] || {}).name), detail: (out[0].items[0] || {}).detail } : null;
};

test('the shoulder workaround renames the bench press to the floor press, and its heading follows', () => {
  const r = filterOne('Main — Dumbbell bench press', 'Dumbbell bench press', '4×5', { region: 'shoulder', tier: 'workaround' })!;
  assert.deepEqual([r.name, r.label], ['Dumbbell floor press', 'Main — Dumbbell floor press']);
});

test('the spine-safe swap renames ab wheel rollouts to dead bugs, and its heading follows', () => {
  const r = filterOne('Core — Ab wheel rollouts', 'Ab wheel rollouts', '3×10', { region: 'lowback', tier: 'workaround' })!;
  assert.deepEqual([r.name, r.label], ['Dead bugs', 'Core — Dead bugs']);
});

test('the rename leaves a healthy card alone, leaves a generic heading as written, and is idempotent', () => {
  const h = filterOne('Main — Dumbbell bench press', 'Dumbbell bench press', '4×5', null)!;
  assert.deepEqual([h.name, h.label], ['Dumbbell bench press', 'Main — Dumbbell bench press']);
  const g = filterOne('Pump', 'Dumbbell bench press', '4×5', { region: 'shoulder', tier: 'workaround' })!;
  assert.deepEqual([g.name, g.label], ['Dumbbell floor press', 'Pump']);
  const cfg = { ...fixtures.HALF_MANNY, injury: { region: 'shoulder', tier: 'workaround' } };
  const once = IA.applyInjuryFilter([{ label: 'Main — Dumbbell bench press', items: [{ name: 'Dumbbell bench press', detail: '4×5' }] }], cfg);
  const twice = IA.applyInjuryFilter(once, cfg);
  assert.deepEqual([twice[0].label, clean(twice[0].items[0].name)], ['Main — Dumbbell floor press', 'Dumbbell floor press']);
});

// ── D52 and D44: pool and post-filter read a movement through the same lens ─────────────────────────────────────────
const SRC = appScript();
const ASSIGNS = I.injuryPoolAssignments(SRC);
const survives = (() => {
  const memo: Record<string, boolean> = {};
  return (nm: string, region: string, tier: string) => {
    const k = `${region}|${tier}|${nm}`;
    if (!(k in memo)) {
      const out = IA.applyInjuryFilter([{ label: 'Probe', items: [{ name: nm, detail: '3×5' }] }], { ...fixtures.HALF_MANNY, seed: 76308, injury: { region, tier } });
      memo[k] = ((out[0] || {}).items || []).length === 1;
    }
    return memo[k];
  };
})();
const POOL = (() => {
  const r = { lens: 0, lensBad: [] as string[], floor: 0, floorBad: [] as string[], thinBad: [] as string[], hit: new Set<string>() };
  for (const a of ASSIGNS || []) {
    if (!a.region || !a.tier) continue;
    const names = new Set<string>();
    for (const e of EQUIP6) { const v = I.resolvePool(a.expr, e); if (v) v.forEach((n) => names.add(n)); }
    if (!names.size) (a.expr.match(/'[^']*'/g) || []).forEach((q) => { const nm = q.slice(1, -1); if (/[a-z]/i.test(nm) && nm.length > 3) names.add(nm); });
    for (const nm of names) {
      r.lens++;
      if (survives(nm, a.region, a.tier)) continue;
      const dk = `same-lens ${a.region}/${a.tier} ${a.name} ${nm}`;
      if (I.POOL_DEBT.includes(dk)) r.hit.add(dk);
      else r.lensBad.push(dk);
    }
    for (const e of EQUIP6) {
      const v = I.resolvePool(a.expr, e);
      if (!v) continue;
      if (v.length < 2) {
        const dk = `thin-pool ${a.region}/${a.tier} ${a.name}`;
        if (I.POOL_DEBT.includes(dk)) r.hit.add(dk);
        else r.thinBad.push(`${dk} on ${e}`);
        continue;
      }
      r.floor++;
      const alive = v.filter((nm) => survives(nm, a.region!, a.tier!));
      if (alive.length < 2) r.floorBad.push(`${a.region}/${a.tier} ${a.name} on ${e}: ${alive.length} of [${v.join(', ')}]`);
    }
  }
  return r;
})();

test('the injury pool-override chain is in the source and its pools resolve per tier', () => {
  assert.ok(Array.isArray(ASSIGNS) && ASSIGNS.length > 20, `${ASSIGNS && ASSIGNS.length} pool assignments`);
  assert.ok(POOL.lens > 50 && POOL.floor > 50, JSON.stringify({ lens: POOL.lens, floor: POOL.floor }));
});

test('an injury pool never offers a movement the same plan\'s filter removes (outside the named debt)', () => {
  assert.deepEqual(POOL.lensBad, []);
});

test('every injury pool of two or more members leaves two standing on every tier after its own filter', () => {
  assert.deepEqual(POOL.floorBad, []);
});

test('a pool authored with fewer than two members is one the named debt lists, and every listed debt still trips', () => {
  assert.deepEqual(POOL.thinBad, []);
  assert.deepEqual(I.POOL_DEBT.filter((d) => !POOL.hit.has(d)), [], 'a debt entry that no longer trips is stale');
});

test('the lowback/protect vertical pull holds four or more members, no L-sit chinups, and excludes only the drawn main', () => {
  const lit = SRC.match(/rowPool = hasCables\?\['Straight-arm pulldown'\]:(\[[^\]]*\])/);
  assert.ok(lit, 'the literal is in its ruled shape');
  const members = JSON.parse(lit[1].replace(/'/g, '"'));
  assert.ok(!members.includes('L-sit chinups'));
  assert.ok(members.length >= 4, `${members.length} members`);
  assert.doesNotMatch(SRC, /\.filter\(n=>backCompoundPool\.indexOf\(n\)<0\)/, 'no whole-pool subtraction of backCompoundPool');
  assert.match(SRC, /const _rowSrc0 = \(_inj&&rowPool!==_preInj\.row\)\?\(rowPool\|\|\[\]\)\.filter\(n=>n!==backMain\)/, 'the row slot excludes the drawn main by name');
});

// ── D154: the injury renamer reads the gear lens ────────────────────────────────────────────────────────────────────
const OWNS: Record<string, Record<string, number>> = {   // the inventory per tier, typed from the tier copy the athlete reads
  commercial: { BARBELL: 1, DUMBBELL: 1, CABLE: 1, MACHINE: 1, GHD: 1, KETTLEBELL: 1 },
  crossfit: { BARBELL: 1, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 1, KETTLEBELL: 1 },
  home_full: { BARBELL: 1, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 1 },
  home_basic: { BARBELL: 0, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 1 },
  bodyweight: { BARBELL: 0, DUMBBELL: 0, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 0 },
};
function implementsOf(name: any): Set<string> {
  const N = String(name).toLowerCase();
  const c = new Set<string>();
  if (/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/.test(N)) c.add('GHD');
  if (/\bbarbell\b|^back squat|^front squat|^bench press|close-grip bench|trap bar|power clean|hang clean|rack pull|landmine|\bez[- ]?bar|^good mornings?\b|^deadlift|^pendlay|^hip thrust$/.test(N)) c.add('BARBELL');
  if (/dumbbell|\bdb\b/.test(N) || (/goblet/.test(N) && !/kettlebell|\bkb\b/.test(N))) c.add('DUMBBELL');
  if (/cable|face pull|pull-?down|rope tricep|tricep rope/.test(N) && !/band/.test(N)) c.add('CABLE');
  if (/machine|leg press|leg extension|lying leg curl|seated leg curl|hack squat|smith|pec deck|preacher/.test(N)) c.add('MACHINE');
  if (/kettlebell|\bkb\b/.test(N)) c.add('KETTLEBELL');
  return c;
}
const gearLegal = (t: any, n: any) => [...implementsOf(n)].every((c) => OWNS[t][c] !== 0);
const SWAPS: Record<string, Record<string, string>> = { shoulder: { 'Dumbbell bench press': 'Dumbbell floor press' },
  elbow: { 'Dumbbell skullcrushers': 'Cable pushdown', 'Barbell curl': 'Dumbbell hammer curl', 'Preacher curl': 'Cable curl' } };
const FALLBACK: Record<string, string> = { 'Cable pushdown': 'Close-grip pushups' };
const EXPECT = (t: any, s: any, to: any) => (gearLegal(t, s) ? (gearLegal(t, to) ? to : FALLBACK[to] || to) : s);
const ELBOW_COPY = 'Straight bar work moves to neutral grips. Skullcrushers become pushdowns, or close grip pushups where there is no cable. Dips and carries are out. Pressing holds RPE 7.';

test('the renamer hand table: the fallback lands on the no-cable tiers, and the cells the ruling names agree with the rule', () => {
  for (const t of ['crossfit', 'home_full', 'home_basic', 'bodyweight']) assert.ok(!gearLegal(t, 'Cable pushdown'), t);
  assert.ok(gearLegal('commercial', 'Cable pushdown'));
  for (const t of Object.keys(OWNS)) assert.ok(gearLegal(t, 'Close-grip pushups'), t);
  const LIT: [string, string, string][] = [['commercial', 'Dumbbell skullcrushers', 'Cable pushdown'], ['crossfit', 'Dumbbell skullcrushers', 'Close-grip pushups'],
    ['home_full', 'Dumbbell skullcrushers', 'Close-grip pushups'], ['home_basic', 'Dumbbell skullcrushers', 'Close-grip pushups'],
    ['bodyweight', 'Dumbbell skullcrushers', 'Dumbbell skullcrushers'], ['bodyweight', 'Dumbbell bench press', 'Dumbbell bench press'],
    ['home_basic', 'Dumbbell bench press', 'Dumbbell floor press'], ['crossfit', 'Preacher curl', 'Preacher curl'],
    ['commercial', 'Preacher curl', 'Cable curl'], ['home_basic', 'Barbell curl', 'Barbell curl'], ['home_full', 'Barbell curl', 'Dumbbell hammer curl']];
  for (const [t, s, want] of LIT) {
    const r = Object.keys(SWAPS).find((k) => SWAPS[k][s])!;
    assert.equal(EXPECT(t, s, SWAPS[r][s]), want, `${t} ${s}`);
  }
});

test('only the shoulder and elbow workaround plans rename, and they rename exactly the ruled pairs', () => {
  const plan = IA.eval('injuryPlan');
  const got: Record<string, unknown> = {};
  for (const r of Object.keys(SWAPS)) got[r] = host((plan({ injury: { region: r, tier: 'workaround' } }) || {}).swapNames);
  assert.deepEqual(got, SWAPS);
  const others: string[] = [];
  for (const r of ['lowback', 'hip', 'knee', 'ankle', 'shoulder', 'elbow']) for (const ti of ['workaround', 'protect']) {
    if (ti === 'workaround' && SWAPS[r]) continue;
    const P = plan({ injury: { region: r, tier: ti } });
    if (P && P.swapNames) others.push(`${r}/${ti}`);
  }
  assert.deepEqual(others, []);
});

test('on every tier each swap source prints as the gear lens rule says, the heading follows, and a legal source never renames illegally', () => {
  for (const t of Object.keys(OWNS)) for (const r of Object.keys(SWAPS)) for (const s of Object.keys(SWAPS[r])) {
    const o = IA.applyInjuryFilter([{ label: 'Main — ' + s, items: [{ name: s, detail: '3×10' }] }], { equipment: t, injury: { region: r, tier: 'workaround' } });
    const it = o && o[0] && o[0].items && o[0].items[0];
    const want = EXPECT(t, s, SWAPS[r][s]);
    assert.equal(it && it.name, want, `${t} ${s}`);
    assert.equal(o[0].label, 'Main — ' + want, `${t} ${s} heading`);
    if (gearLegal(t, s)) assert.ok(gearLegal(t, it.name), `${t}: ${s} -> ${it.name} is gear legal`);
  }
});

test('the elbow workaround copy is the ruled sentence, with no hyphen or dash', () => {
  const s = IA.eval('_INJ_EFFECT').elbow.workaround;
  assert.equal(s, ELBOW_COPY);
  assert.doesNotMatch(s, /[-‐‑–—]/);
});

test('elbow and shoulder workaround programs print no item the tier does not own, and the elbow swap lands (sample)', () => {
  // a sample of the 2,160-build renamer lattice, one seed; the whole lattice runs in tests/sweeps/injury-overlays.test.js
  for (const eq of ['crossfit', 'home_full', 'home_basic', 'bodyweight', 'commercial']) {
    let pushups = 0;
    let skull = 0;
    let pushdown = 0;
    for (const focus of ['hypertrophy', 'strength', 'support_strength']) for (const region of ['elbow', 'shoulder']) {
      const p = IA.buildProgram({ ...I.MARIO, equipment: eq, liftingFocus: focus, experience: 'intermediate', seed: 4242, injury: { region, tier: 'workaround' } });
      for (const c of I.cardsOf(p)) {
        assert.ok(gearLegal(eq, c.n), `${eq} ${region}/workaround W${c.w} ${c.d} prints ${c.n}`);
        if (region !== 'elbow') continue;
        if (c.n === 'Close-grip pushups') pushups++;
        if (c.n === 'Dumbbell skullcrushers') skull++;
        if (c.n === 'Cable pushdown') pushdown++;
      }
    }
    assert.equal(skull, 0, `${eq}: no skullcrushers under the elbow plan`);
    if (eq === 'commercial') assert.ok(pushdown > 0, 'commercial keeps Cable pushdown');
    else if (eq !== 'bodyweight') assert.ok(pushups > 0 && pushdown === 0, `${eq}: Close-grip pushups ${pushups}, Cable pushdown ${pushdown}`);
  }
});

// ── D54: the travel overlay's holds copy asserts no implement ───────────────────────────────────────────────────────
const IMPLEMENT_WORDS = ['on the bar', 'the bar', 'barbell', 'dumbbell', 'kettlebell', 'plates', 'pair they have', 'machine', 'bands', 'sandbag'];
function travelHolds(equipment: any) {
  const { X } = I.progAt(I.L9.mario_noinj, 'CFG', '2026-09-24');
  E(X, `Object.assign(_ovDraft,{tab:'travel',equipment:${JSON.stringify(equipment)},from:'2026-09-22',to:'2026-09-24'});`);
  const html = String(E(X, '_renderTravelTab()'));
  const subs = [...html.matchAll(/<div class="ov-effect-sub"[^>]*>([^<]*)<\/div>/g)].map((m) => m[1]);
  return subs[subs.length - 1] || '';
}

test('the travel holds copy names no implement on any tier, keeps the single arm progression, and has no mid-sentence dash', () => {
  const GEAR_HOLDS = 'Lifting holds steady while you’re away. Grab the heaviest load you can control and work in the 8 to 12 range. If that still feels easy, go single arm. Your running keeps building. That only needs shoes.';
  const bw = travelHolds('bodyweight');
  assert.match(bw, /^Lifting holds steady while you’re away\./);
  for (const eq of ['minimal', 'home_basic', 'home_full', 'crossfit']) assert.equal(travelHolds(eq), GEAR_HOLDS, eq);
  for (const s of [bw, GEAR_HOLDS]) {
    assert.deepEqual(IMPLEMENT_WORDS.filter((w) => s.toLowerCase().includes(w)), [], s);
    assert.ok(!/\w-\w/.test(s) && !s.includes('—'), s);
  }
});

// ── D197: on bodyweight with an injury, every day is filtered once more after the sweep ────────────────────────────
const PUSHUPS = 'Pushups (slow 3s eccentric)';
const A_AFTER = '4 sets — RPE 7 (leave 3 or more in reserve)';
const cellCfg = (o: any) => Object.assign(I.clone(I.MARIO), { injury: { region: 'elbow', tier: 'workaround' }, equipment: 'bodyweight', experience: 'advanced' }, o);
const card = (d: any): [string, [string, string][]][] => host((d && d.sections) || []).map((s: Section): [string, [string, string][]] => [clean(s.label), (s.items || []).map((i: Item): [string, string] => [clean(i.name), clean(i.detail)])]);

test('elbow workaround on bodyweight: the swept chest volume pushups hold at RPE 7 on the W3 and W4 Mondays of all ten programs', () => {
  const CELLS = [{ liftingFocus: 'support_strength', seed: 76308 }, { liftingFocus: 'support_athletic', seed: 76308 },
    { liftingFocus: 'balanced', restDays: ['sun', 'wed'], seed: 76308 }, { liftingFocus: 'balanced', restDays: ['sat', 'sun'], seed: 76308 },
    { liftingFocus: 'support_strength', seed: 90210 }, { liftingFocus: 'support_athletic', seed: 90210 },
    { liftingFocus: 'balanced', restDays: ['sun', 'wed'], seed: 90210 }, { liftingFocus: 'balanced', restDays: ['sat', 'sun'], seed: 90210 },
    { liftingFocus: 'fatloss', restDays: ['sun', 'wed'], seed: 76308 }, { liftingFocus: 'fatloss', restDays: ['sat', 'sun'], seed: 76308 }];
  const X = I.appAt('2026-08-24');
  for (const o of CELLS) {
    const p = X.buildProgram(cellCfg(o));
    assert.equal(JSON.stringify(X.buildProgram(cellCfg(o))), JSON.stringify(p), `${JSON.stringify(o)} is self-stable`);
    for (const w of [3, 4]) {
      const vol = card(p.weeks[w].mon).find(([l]) => l === 'Chest volume');
      assert.deepEqual(vol, ['Chest volume', [[PUSHUPS, A_AFTER]]], `${JSON.stringify(o)} W${w} mon`);
    }
  }
});

test('ankle workaround on bodyweight: the chest volume burpees are gone from every Monday, and no burpee prints anywhere', () => {
  // the ruled D197-2 cell: bodyweight | hypertrophy | ankle/workaround | intermediate | 55+ | seed 4242 | sun,wed (the D149
  // lattice's mk(): goal run_half, cardioTypes run)
  const cfg = { name: 'M', primaryPath: 'goal', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half', label: 'run_half', mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' } },
    eventTargeted: false, liftingFocus: 'hypertrophy', experience: 'intermediate', ageBracket: '55+', equipment: 'bodyweight', unit: 'lbs',
    restDays: ['sun', 'wed'], days: I.DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 4242, injury: { region: 'ankle', tier: 'workaround' } };
  const p = IA.buildProgram(cfg);
  assert.equal(Object.keys(p.weeks).length, 11);
  for (const w of [1, 2, 3, 5, 6, 7, 9, 10, 11]) {
    const labels = card(p.weeks[w].mon).map(([l]) => l);
    assert.ok(labels.includes('Main — Pushups (slow 3s eccentric)') && !labels.includes('Chest volume'), `W${w} mon: ${labels.join(' | ')}`);
  }
  assert.deepEqual(I.cardsOf(p).filter((c) => /burpee/i.test(c.n)).map((c) => `W${c.w} ${c.d} ${c.n}`), []);
});

test('the post-sweep re-filter sits inside the bodyweight branch, once, guarded by the injury, so no loaded tier moves (source)', () => {
  const body = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = body.indexOf('bodyweightSweep(weeks, cfg.experience');
  assert.ok(at > 0, 'the one bodyweight sweep call');
  const open = body.lastIndexOf("if(cfg.equipment==='bodyweight'){", at);
  assert.ok(open > 0 && at - open < 40, 'the call opens the braced bodyweight block');
  const els = body.indexOf('else { unloadableRxSweep(weeks, cfg)', at);
  const block = body.slice(at, els).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.equal(block.split('_day.sections=applyInjuryFilter(_day.sections,cfg)').length - 1, 1, 'one whole-day re-filter before the else');
  assert.match(block, /if\(cfg\.injury\) Object\.keys\(weeks\)\.forEach/, 'guarded by the injury, walking every week');
  assert.match(block, /\}\s*$/, 'the bodyweight block closes right before the loaded tiers\' else');
});

// ── D193: the cap cue says three in the tank, and the stripper knows both wordings (R1, R4, R5, R6) ─────────────────
const NUMWORD: Record<number, string> = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
const RIR = (rpe: any) => Math.round(10 - rpe);   // the hand rule: reps in reserve = 10 − RPE
const TSAME = (to: any, from: any) => `${to} in, ${from.toLowerCase()} out. Same job, same numbers.`;

test('the cap cue is "hold RPE 7, three in the tank": three is 10 − 7, the rule the RPE card states', () => {
  const lit = E(IA, 'INJ_CAP_CUE');
  const m = /^ — hold RPE (\d+), (\w+) in the tank$/.exec(String(lit));
  assert.ok(m, String(lit));
  assert.equal(m[1], '7');
  assert.equal(m[2], NUMWORD[RIR(7)]);
  assert.equal(lit, I.NEWC);
  const html = IA.html.replace(/<!--[\s\S]*?-->/g, '');
  const cards = [...html.matchAll(/<div class="rpe-info-note">[^<]*?RPE (\d+) ≈ (\d+) reps? left in the tank[^<]*<\/div>/g)];
  assert.equal(cards.length, 1);
  assert.equal(RIR(+cards[0][1]), +cards[0][2], 'RPE 8 ≈ 2 reps left: the same rule');
});

const STRIP_HAND = [
  ['3×10' + I.OLDC, '3×10'], ['3×10' + I.NEWC, '3×10'], ['2×10 each' + I.OLDC, '2×10 each'], ['2×10 each' + I.NEWC, '2×10 each'],
  [I.R7_T, I.TEST_T], [I.R7_T.replace('RPE 7', 'RPE 6'), I.TEST_T],
  [I.TEST_T, null], [I.R7_T + ' ', null], ['3×10 — hold RPE 7, four in the tank', null], ['3×10' + I.OLDC + ', 2 min rest', null], ['3×10' + I.NEWC + ', 2 min rest', null],
  ['RPE 6 (recovery — leave 4+ reps in the tank)', null], ['RPE 6 (leave plenty in the tank)', null],
  ['3×13 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest', null], ['2 sets — RPE 6 (leave plenty in the tank)', null],
  ['4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest', null], ['3×10', null], ['', null],
];
const strip = (X: any, arr: any) => { X.ctx.__arr = arr; return host(E(X, '__arr.map(function(d){return _stripCapCue(d);})')); };
const L9VM = I.appAt('2026-09-24');
const L9CARDS = Object.fromEntries(Object.entries(I.L9).map(([k, c]) => [k, I.cardsOf(L9VM.buildProgram(I.clone(c)))]));

test('the stripper takes either cue wording and the held-test text back to the bare dose, and leaves everything else alone', () => {
  const outs = strip(IA, STRIP_HAND.map((r) => r[0]));
  STRIP_HAND.forEach(([d, w], i) => assert.equal(outs[i], w === null ? d : w, JSON.stringify(d)));
  const pop: string[] = [];
  Object.values(L9CARDS).forEach((cs) => cs.forEach((c) => { if (!I.CUE_RE.test(c.det) && c.det !== I.R7_T) pop.push(c.det); }));
  assert.ok(pop.length > 1000, `${pop.length} non-cue cards`);
  const po = strip(IA, pop);
  assert.equal(pop.filter((d, i) => po[i] !== d).length, 0, 'no false strip on the nine programs');
  const tank = L9CARDS.manny.filter((c) => /tank/.test(c.det)).map((c) => c.det);
  assert.equal(tank.length, 9, 'Mario\'s program carries nine "tank" glosses that are not the cue');
  assert.deepEqual(strip(IA, tank), tank);
});

test('the held-test text and the strength test text are the ruled sentences, and the stripper maps one to the other', () => {
  assert.equal(E(IA, 'INJ_HELD_TEST'), I.R7_T);
  assert.equal(E(IA, 'TEST_RX_TEXT'), I.TEST_T);
  assert.deepEqual(strip(IA, [I.R7_T, I.TEST_T]), [I.TEST_T, I.TEST_T]);
});

test('a card stored with the old "two" cue keeps it on a past week, and a live swap re-cues the capped target and undoes to the stored words', () => {
  // Mario at knee/workaround, stored with W5 thu Step-ups (KB) carrying the retired wording, booted in W6 (W5 is past)
  const st0 = I.clone(I.appAt('2026-09-24').buildProgram(I.clone(I.L9.mario)));
  let n = 0;
  st0.weeks[5].thu.sections!.forEach((s) => s.items.forEach((it) => {
    if (it.name === 'Step-ups (KB)' && it.detail === '2×10 each' + I.NEWC) { it.detail = '2×10 each' + I.OLDC; n++; }
  }));
  assert.equal(n, 1, 'W5 thu Leg superset A carries Step-ups (KB) under the cue');
  Object.assign(st0, { id: 'PM', name: 'M', created: 1, startDate: I.START, cfg: I.clone(I.L9.mario) });
  const pat = I.patternOf(IA);
  assert.deepEqual(['Step-ups (KB)', 'Reverse lunge (KB)', 'Barbell good mornings'].map(pat), ['lunge', 'lunge', 'hinge']);
  const WANT: Record<string, string> = { 'Reverse lunge (KB)': '2×10 each' + I.NEWC, 'Barbell good mornings': '2×10 each' };
  for (const to of Object.keys(WANT)) {
    const X = I.appAt('2026-10-01');
    I.setup(X, JSON.stringify(st0));
    assert.equal(E(X, 'calcCurrentWeek()'), 6);
    const L = I.findSlot(X, 5, 'thu', 'Leg superset A', 'Step-ups (KB)')!;
    assert.equal(I.slotOf(X, 5, 'thu', L.si, L.ii).d, '2×10 each' + I.OLDC, 'the stored words show on the past week');
    const h = I.hop(X, L, to);
    assert.ok(h.offered && h.landed, `${to} offered and landed`);
    assert.equal(h.d, WANT[to], to);
    assert.equal(h.t, TSAME(to, 'Step-ups (KB)'));
    const rec = JSON.parse(E(X, "localStorage.getItem('ia_swaps_PM')")).w5_thu;
    assert.equal(rec[rec.length - 1].rx[0].d, '2×10 each' + I.OLDC, 'the swap record keeps the stored string');
    const u = I.undoLast(X, L);
    assert.deepEqual([u.chip, u.slot.n, u.slot.d], ['Step-ups (KB)', 'Step-ups (KB)', '2×10 each' + I.OLDC]);
  }
});

// ── D193 build half (R2 clamp, R7 held test, R6 coupling) ───────────────────────────────────────────────────────────
test('the clamp writes each of the four hold shapes and R7\'s held test on a capped lift, and leaves an uncapped lift alone', () => {
  const ins = [
    ['Barbell box squat', '3 sets — RPE 8 (stop 2 reps short of failure), 60 sec rest', '3 sets — RPE 7 (leave 3 or more in reserve), 60 sec rest'],
    ['Barbell box squat', '3×8–12 @ RPE 8', '3×8–12 @ RPE 7'],
    ['Barbell box squat', '3 sets of 8 to 12 — RPE 8 (heaviest pair you can find), 90 sec rest', '3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve), 90 sec rest'],
    ['Barbell box squat', '4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest', '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest'],
    ['Barbell box squat', '4×3 — RPE 9 (leave ~1 rep in reserve), ramp up with 2–3 warmup sets, 3 min rest', '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest'],
    ['Barbell box squat', I.TEST_T, I.R7_T],
    ['Barbell box squat', '3×8–12 @ RPE 7', '3×8–12 @ RPE 7'],
    ['Barbell box squat', '3×10', '3×10' + I.NEWC],
    ['Barbell Romanian deadlift', '3×8–12 @ RPE 8', '3×8–12 @ RPE 8'],
    ['Barbell Romanian deadlift', '4×3 — RPE 9 (leave ~1 rep in reserve), ramp up with 2–3 warmup sets, 3 min rest', '4×3 — RPE 9 (leave ~1 rep in reserve), ramp up with 2–3 warmup sets, 3 min rest'],
    ['Barbell Romanian deadlift', I.TEST_T, I.TEST_T],
  ];
  const pat = I.patternOf(IA);
  assert.equal(pat('Barbell box squat'), 'squat');
  assert.equal(pat('Barbell Romanian deadlift'), 'hinge');
  for (const [name, d, want] of ins) {
    if (name === 'Barbell box squat' && I.rpeMax(d)! > 7) assert.equal(I.handHold(d), want, `the hand hold of ${d}`);
    const out = IA.applyInjuryFilter([{ label: 'x', items: [{ name, detail: d }] }], I.clone(I.L9.mario));
    assert.deepEqual([clean(out[0].items[0].name), out[0].items[0].detail], [name, want], `${name} ${d}`);
  }
});

/** The filter-lens census of a set of injured builds: cards in U (the judged name's pattern is capped) by what they print. */
function lensCensus(cfgs: any) {
  const X = I.lensApp();
  const pat = I.patternOf(I.appAt('2026-09-24'));
  const r = { U: 0, hi: [] as string[], forbid: [] as string[], loadHead: 0, power: 0, powerCued: [] as string[], r7: 0, test: 0, r7Uncapped: [] as string[], testCapped: [] as string[], numOnly: [] as string[] };
  for (const c of cfgs) {
    const cap = I.capOf(c);
    for (const k of I.lensCards(X, c)) {
      const inU = cap.includes(pat(k.pre));
      const where = `${c.injury ? c.injury.region + '/' + c.injury.tier : 'healthy'} ${c.equipment} W${k.w} ${k.d} ${k.n} :: ${k.det}`;
      if (inU) {
        r.U++;
        if (I.rpeMax(k.det)! > 7) r.hi.push(where);
        if (I.FORBID.some((f) => k.det.includes(f))) r.forbid.push(where);
        if (k.det.startsWith('3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)')) r.loadHead++;
      }
      if (I.POWER.test(k.det) || /^Power/.test(k.label)) { r.power++; if (I.CUE_RE.test(k.det)) r.powerCued.push(where); }
      if (k.det === I.R7_T) { r.r7++; if (!inU) r.r7Uncapped.push(where); }
      if (I.TEST_SHAPE.test(k.det)) { r.test++; if (inU) r.testCapped.push(where); }
      if (/at RPE 7\..*new baseline\./.test(k.det)) r.numOnly.push(where);
    }
  }
  return r;
}

test('no card on a capped pattern prints above RPE 7 or keeps a pre-hold gloss; no power card carries the cue (L9 and a slice of L432)', () => {
  const cfgs = Object.values(I.L9).filter((c) => c.injury).concat(I.grid(I.L432_EQ).filter((_, i) => i % 17 === 0).map((x) => x.c));
  const r = lensCensus(cfgs);
  assert.ok(r.U > 100, `${r.U} cards in U`);
  assert.deepEqual(r.hi.slice(0, 3), []);
  assert.deepEqual(r.forbid.slice(0, 3), []);
  assert.ok(r.power > 0);
  assert.deepEqual(r.powerCued.slice(0, 3), []);
});

test('on the travel overlay a capped load-limited card holds as "3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)"', () => {
  const hb = lensCensus([{ ...I.clone(I.L9.mario), equipment: 'home_basic', _travel: true }]);
  const mn = lensCensus([{ ...I.clone(I.L9.mario), equipment: 'minimal', _travel: true }]);
  assert.deepEqual(hb.hi.concat(mn.hi), []);
  assert.deepEqual(hb.forbid.concat(mn.forbid), [], 'no "heaviest pair" on a capped card');
  assert.ok(hb.loadHead > 0, 'the load-limited hold prints');
});

test('a held pattern does not test: capped strength test cards read R7\'s text, uncapped ones the test, never a number-only blend', () => {
  const lite = I.liteLattice().filter((x) => x.c.liftingFocus === 'strength' && x.c.equipment === 'commercial');
  const r = lensCensus(lite.map((x) => x.c));
  assert.ok(r.r7 > 0 && r.test > 0, JSON.stringify({ r7: r.r7, test: r.test }));
  assert.deepEqual(r.r7Uncapped, []);
  assert.deepEqual(r.testCapped, []);
  assert.deepEqual(r.numOnly, []);
  const healthy = lensCensus(lite.filter((x) => !x.c.injury).map((x) => x.c));
  assert.equal(healthy.r7, 0, 'no R7 text on an uninjured build');
});

test('an uninjured program keeps no pre-hold dose: not after a build, two live swaps, a boot replay, or an undo', () => {
  for (const c of [I.L9.mario_noinj, I.L9.manny]) assert.doesNotMatch(JSON.stringify(I.appAt('2026-09-24').buildProgram(I.clone(c))), /"_preHold"/);
  const { X, st } = I.progAt(I.L9.mario_noinj, 'CFG', '2026-09-24');
  const Y = I.appAt('2026-09-24');
  const W5 = I.weekOf(X, 5)!;
  let slots = 0;
  for (const d of Object.keys(W5) as DayKey[]) ((W5[d] && W5[d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => {
    if (!it || !it.name) return;
    I.setup(X, st);
    const c = { w: 5, d, si, ii };
    const tg = host(E(X, `__cands(activeProg.weeks[5].${d},5,${JSON.stringify(it.name)})`));
    if (!tg.length) return;
    slots++;
    tg.slice(0, 2).forEach((to: string) => I.hop(X, c, to));
    I.bootFrom(X, Y);
    I.undoLast(X, c);
    const blobs = [JSON.stringify(I.dayOf(X, 5, d)), JSON.stringify(I.dayOf(Y, 5, d))]
      .concat(['ia_programs', 'ia_hist_PM', 'ia_swaps_PM'].map((k) => E(X, `localStorage.getItem('${k}')`) || ''));
    assert.ok(!blobs.some((b) => /_preHold|"ph"/.test(b)), `W5 ${d} ${it.name}: a kept dose on an uninjured program`);
  }));
  assert.ok(slots > 20, `${slots} swappable W5 slots`);
});

test('the add path refuses a cued detail and R7\'s held-test prose, and a loaded-to-loaded swap carries the donor dose live and at boot', () => {
  for (const d of ['3×10' + I.OLDC, '3×10' + I.NEWC, '2×10 each' + I.OLDC, '2×10 each' + I.NEWC]) assert.equal(E(IA, `_addRxKind(${JSON.stringify(d)},'Step-ups (KB)')`), null, d);
  assert.notEqual(E(IA, "_addRxKind('3×10','Step-ups (KB)')"), null, 'the bare dose is a rep dose');
  assert.equal(I.patternOf(IA)('Leg press'), 'squat');
  assert.equal(E(IA, `_addRxKind(${JSON.stringify(I.R7_T)},'Leg press')`), null);
  const SUMO_D = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest';
  const L2L = [{ w: 5, d: 'thu', sec: 'Leg superset B', from: 'Kettlebell swing', d0: '2×8', to: 'Dumbbell split-stance deadlift' },
    { w: 5, d: 'tue', sec: 'Main', from: 'Sumo deadlift', d0: SUMO_D, to: 'Barbell Romanian deadlift' }];
  const { st } = I.progAt(I.L9.mario, 'CFG', '2026-09-24');
  for (const p of L2L) {
    const X = I.appAt('2026-09-24');
    I.setup(X, st);
    const L = I.findSlot(X, p.w, p.d, p.sec, p.from);
    assert.ok(L, `${p.from} on W${p.w} ${p.d} ${p.sec}`);
    assert.equal(I.slotOf(X, p.w, p.d, L.si, L.ii).d, p.d0);
    const h = I.hop(X, L, p.to);
    assert.ok(h.offered && h.landed);
    assert.deepEqual([h.n, h.d, h.t], [p.to, p.d0, TSAME(p.to, p.from)]);
    const Y = I.appAt('2026-09-24');
    I.bootFrom(X, Y);
    const b = I.slotOf(Y, p.w, p.d, L.si, L.ii);
    assert.deepEqual([clean(b.n), b.d], [p.to, p.d0], 'after a boot');
  }
});

// ── D245: the calf region ────────────────────────────────────────────────────────────────────────────────────────────
// Oracles, typed by hand from the ruling: the calf-loading names (every calf_iso raise by pattern, and by name the soleus
// raise, the heel-raise hold and tiptoe walks), the jump names, the two drills the athlete keeps, the protected run, and
// "protected, it is the ankle plan" as the ankle program itself. The reported half: intermediate, Home Full, Strength
// Support, rest Sunday and Wednesday, seed 1013.
const CALF_CFG = (tier: 'workaround' | 'protect', region = 'calf') => ({
  name: 'CALF', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: true, raceDate: '2027-01-31',
  cardioGoals: { run: { id: 'run_half', label: 'Half Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '5', baseline: '5mi' } },
  liftingFocus: 'support_strength', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs',
  restDays: ['sun', 'wed'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185, seed: 1013,
  injury: { region, tier },
});
const CALF_LOAD = /soleus raise|heel-raise hold|tiptoe walk/i;
const JUMP_NAMES = /jump|burpee|broad|bound|box jump|high knees|tuck/i;
const allItems = (p: any) => Object.keys(p.weeks).flatMap((w) => Object.keys(p.weeks[w]).flatMap((d) =>
  ((p.weeks[w][d] && p.weeks[w][d].sections) || []).flatMap((s: Section) => (s.items || []).map((i: Item) => ({ w, d, s: clean(s.label || ''), n: clean(i.name) })))));

test('Calf is on the HURT? sheet, after the ankle, and its plan is none of the others (D245)', () => {
  const regions = IA.eval('INJURY_REGIONS');
  assert.deepEqual(Object.keys(regions), ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle', 'calf']);
  assert.equal(regions.calf.label, 'Calf');
  const w = IA.eval('injuryPlan')(CALF_CFG('workaround')), p = IA.eval('injuryPlan')(CALF_CFG('protect'));
  assert.deepEqual([w.region, w.tier, [...w.drop], [...w.cap], w.noJumps, w.cardioMode], ['calf', 'workaround', ['calf_iso'], [], true, 'reduce']);
  assert.deepEqual([p.region, p.tier, [...p.drop].sort(), [...p.cap], p.noJumps, p.cardioMode], ['calf', 'protect', ['calf_iso', 'lunge'], ['squat'], true, 'noimpact']);
});

test('working around a calf: no calf raise and no jump anywhere in the block, every run easy and shorter, and the tibialis raises and dorsiflexion stay (D245)', () => {
  const p: any = IA.buildProgram(CALF_CFG('workaround') as any);
  const pat = IA.eval('_pattern');
  const items = allItems(p);
  assert.deepEqual(items.filter((x) => pat(x.n) === 'calf_iso' || CALF_LOAD.test(x.n)).map((x) => x.w + ' ' + x.d + ' ' + x.n), []);
  assert.deepEqual(items.filter((x) => JUMP_NAMES.test(x.n)).map((x) => x.w + ' ' + x.d + ' ' + x.n), []);
  const runs = Object.keys(p.weeks).flatMap((w) => Object.values(p.weeks[w]).flatMap((day: any) => ([] as any[]).concat((day && day.cardio) || []).filter((c) => c && c.type === 'run')));
  assert.ok(runs.length >= 50, 'runs ' + runs.length);
  assert.deepEqual([...new Set(runs.map((c) => c.subtype))], ['Easy Run (protected)']);
  assert.ok(runs.every((c) => c.legLoad === false));
  // Week 9 keeps its days (one speed day, D243 and D244) and every run on them is the protected easy run.
  const wk9 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => {
    const day = p.weeks['9'][d]; if (!day || day.rest) return d + ':x';
    const r = ([] as any[]).concat(day.cardio || []).find((c) => c && c.type === 'run'); return d + ':' + (r ? r.subtype : '-');
  }).join(' | ');
  assert.equal(wk9, 'mon:Easy Run (protected) | tue:Easy Run (protected) | wed:x | thu:- | fri:Easy Run (protected) | sat:Easy Run (protected) | sun:x');
  const kept = items.filter((x) => /^Foot & ankle/.test(x.s)).map((x) => x.n);
  assert.ok(kept.some((n) => /tibialis raise/i.test(n)) && kept.some((n) => /dorsiflexion|ankle rocks/i.test(n)), kept.join(', '));
});

test('a protected calf builds the protected ankle program, day for day (D245)', () => {
  const a = IA.buildProgram(CALF_CFG('protect') as any), b = IA.buildProgram(CALF_CFG('protect', 'ankle') as any);
  assert.equal(JSON.stringify(a.weeks), JSON.stringify(b.weeks));
});
