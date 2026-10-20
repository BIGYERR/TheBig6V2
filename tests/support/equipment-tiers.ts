// Helpers for the equipment-tier tests (tests/integration/equipment-tiers.test.js, tests/sweeps/equipment-tiers.test.js):
// what a tier does not own never prints on it, and a ruling that selects never deletes. Rulings: D42 (the landmine
// rotational press and the shoulder slot's side), D43 (the dumbbell floor press), D44, D46-c, D47, D49 (the gear
// gates on the core pillars, the lowback pull, the wizard copy, the trim order), D70c and D150 (the inventory's denial
// binds, the swap universe passes the lens), D149 (the GHD is a station), D196 (a band hip thrust falls to the plan's
// bodyweight hip extension).
//
// Every inventory below is typed by hand from the rulings and the tier copy the athlete reads; the engine's own gear
// lenses (_gearOK, _auxGearOK, hasBarbell) are never consulted except where a test asks a lens directly and the hand
// table is the answer. Lattices are config input with cfg.seed pinned.
import { DAY_KEYS } from '@ia/core';
import type { Cfg, Day, DayKey, Equipment, Experience, Injury, InjuryTier, Item, LiftingFocus, Program, Section } from '@ia/core';
import { fixtures, progDigest } from './app.ts';
import type { App } from './app.ts';
import * as D from './duplicate-movements.ts';
const DAYS: readonly DayKey[] = DAY_KEYS;

const { clone, clean } = D;
const live = (d: Day | null | undefined): Section[] => ((d && !d.rest && d.sections) || []).filter((s) => (s.items || []).length);
const bump = (o: Record<string, number>, k: string, n = 1): void => { o[k] = (o[k] || 0) + n; };
/** Every item of a program: { wk, d, label, name }, plus a count of item slots that came back empty. */
/** An item where it sits: its week, its day, its section's label, its name and detail. */
export interface ItemAt { wk: number; d: DayKey; label: string; name: string; detail: string }
/** One build's items, tagged with its cell. */
export interface TaggedItems { tag: string; items: ItemAt[] }
function itemsOf(prog: Program): { items: ItemAt[]; holes: number } {
  const out: ItemAt[] = [];
  let holes = 0;
  for (const wk of Object.keys(prog.weeks || {}))
    for (const d of DAYS) {
      const day = prog.weeks[wk][d];
      if (!day) continue;
      for (const s of day.sections || [])
        for (const it of s.items || []) {
          if (!it || !it.name) { holes++; continue; }
          out.push({ wk: +wk, d, label: String(s.label || s.coreHeader || ''), name: clean(it.name), detail: String(it.detail || '') });
        }
    }
  return { items: out, holes };
}
/** swapCandidates' answer as a flat list of names, whatever its shape. */
const candNames = (r: unknown): string[] => {
  const out: string[] = [];
  if (!r) return out;
  (Array.isArray(r) ? [r] : Object.values(r as object).filter(Array.isArray)).forEach((a) => a.forEach((c) => { const n = clean(typeof c === 'string' ? c : c && c.name); if (n) out.push(n); }));
  return out;
};

// ══ D44 / D46-c / D47 / D49: the gear gates on the core pillars ═════════════════════════════════════════════════
// What each tier owns, typed from the wizard copy and the ruling. 'minimal' is the retired travel tier (no card).
/** What a tier owns, by implement, and whether the wizard shows it as a card. */
export interface Gear { barbell: boolean; cables: boolean; medball: boolean; bands: boolean; load: boolean; card: boolean }
const GEAR_TIERS: Record<string, Gear> = {
  bodyweight: { barbell: false, cables: false, medball: false, bands: false, load: false, card: true },
  minimal: { barbell: false, cables: false, medball: false, bands: false, load: true, card: false },
  home_basic: { barbell: false, cables: false, medball: false, bands: true, load: true, card: true },
  home_full: { barbell: true, cables: false, medball: false, bands: true, load: true, card: true },
  commercial: { barbell: true, cables: true, medball: true, bands: true, load: true, card: true },
  crossfit: { barbell: true, cables: false, medball: true, bands: true, load: true, card: true },
};
const GEAR_EQUIP = Object.keys(GEAR_TIERS) as Equipment[];
// Every implement-named movement the core injector can put on a card, and the implement it needs.
const GATED: { name: string; need: keyof Gear }[] = [
  { name: 'Landmine rotations', need: 'barbell' }, { name: 'Cable woodchoppers', need: 'cables' },
  { name: 'Medicine ball rotary toss', need: 'medball' }, { name: 'Band woodchopper (door anchor)', need: 'bands' },
  { name: 'Dumbbell renegade rows', need: 'load' }, { name: 'Farmer carry', need: 'load' }, { name: 'Suitcase carry', need: 'load' },
  { name: 'Pallof press', need: 'bands' },
];
const UNGATED_CORE = ['Windshield wipers', 'Standing torso rotations (slow)', 'Side plank thread-the-needle', 'Bird dogs', 'Plank shoulder taps', 'Side plank'];
// Legal rotational_power members per tier, counted by hand off the table above.
const ROT_LEGAL: Record<string, number> = { bodyweight: 4, minimal: 4, home_basic: 5, home_full: 6, commercial: 8, crossfit: 7 };   // D241: the bodyweight Russian twist is legal on every tier
const AR_MEMBERS: { name: string; need: keyof Gear | null }[] = [
  { name: 'Bird dogs', need: null }, { name: 'Side plank', need: null }, { name: 'Plank shoulder taps', need: null },
  { name: 'Pallof press', need: 'bands' }, { name: 'Dumbbell renegade rows', need: 'load' },
  { name: 'Farmer carry', need: 'load' }, { name: 'Suitcase carry', need: 'load' },
];
const AR_LEGAL: Record<string, number> = { bodyweight: 3, minimal: 6, home_basic: 7, home_full: 7, commercial: 7, crossfit: 7 };
const GEAR_INJ: { tag: string; injury: Injury | null }[] = [
  { tag: 'healthy', injury: null }, { tag: 'shoulder/protect', injury: { region: 'shoulder', tier: 'protect' } },
  { tag: 'lowback/protect', injury: { region: 'lowback', tier: 'protect' } }, { tag: 'elbow/protect', injury: { region: 'elbow', tier: 'protect' } },
];
/** The gear-gate WIDE lattice: 4 injury paths x 6 tiers x 2 foci x 2 experience levels x the given seeds (288 with three). */
/** A gear lattice cell: its tag, its injury path, its tier and its config. */
export interface GearCell { tag: string; inj: string; equipment: Equipment; cfg: Cfg }
function gearLattice(seeds: number[]): GearCell[] {
  const out: GearCell[] = [];
  for (const i of GEAR_INJ)
    for (const equipment of GEAR_EQUIP)
      for (const liftingFocus of ['support_prevention', 'hypertrophy'] as const)
        for (const experience of ['intermediate', 'advanced'] as const)
          for (const seed of seeds)
            out.push({ tag: i.tag + ' ' + equipment + ' ' + liftingFocus + ' ' + experience + ' seed=' + seed, inj: i.tag, equipment,
              cfg: Object.assign({}, fixtures.HALF_MANNY, { equipment, seed, liftingFocus, experience, injury: i.injury }) });
  return out;
}
/**
 * Two passes over the cells: the shipped items (budget live) on `IA`, and the core blocks as drawn (set budget
 * bypassed) on `IAoff`, a second boot of the app with __BUDGET_OFF set.
 */
/** The gear survey (see surveyGear). */
export interface GearSurvey {
  built: number; errors: string[]; holes: number; byInj: Record<string, { total: number; per: Record<string, TaggedItems[]> }>;
  core: { blocks: number; empty: string[]; one: number; rot: Record<string, Set<string>>; ar: Record<string, { blocks: number; seen: Set<string>; pairs: Set<string>; statik: number }> };
  all: Record<string, TaggedItems[]>;
}
function surveyGear(IA: App, IAoff: App, cells: GearCell[]): GearSurvey {
  const S: GearSurvey = { built: 0, errors: [], holes: 0, byInj: {}, core: { blocks: 0, empty: [], one: 0, rot: {}, ar: {} }, all: {} };
  for (const c of cells) {
    let prog: Program;
    try {
      prog = IA.buildProgram(clone(c.cfg));
      S.built++;
    } catch (e) {
      S.errors.push(c.tag + ': ' + (e as Error).message);
      continue;
    }
    const { items, holes } = itemsOf(prog);
    S.holes += holes;
    const slot = S.byInj[c.inj] || (S.byInj[c.inj] = { total: 0, per: {} });
    slot.total += items.length;
    (slot.per[c.equipment] = slot.per[c.equipment] || []).push({ tag: c.tag, items });
    let off: Program;
    try {
      off = IAoff.buildProgram(clone(c.cfg));
    } catch (e) {
      S.errors.push(c.tag + ' (budget off): ' + (e as Error).message);
      continue;
    }
    const rot = S.core.rot[c.equipment] || (S.core.rot[c.equipment] = new Set<string>());
    const ar = S.core.ar[c.equipment] || (S.core.ar[c.equipment] = { blocks: 0, seen: new Set<string>(), pairs: new Set<string>(), statik: 0 });
    for (const wk of Object.keys(off.weeks || {}))
      for (const d of DAYS) {
        const day = (off.weeks[wk] || ({} as Partial<Record<DayKey, Day>>))[d];
        if (!day) continue;
        for (const s of day.sections || []) {
          if (!s || !s.core) continue;
          S.core.blocks++;
          const names = (s.items || []).filter(Boolean).map((i) => clean(i && i.name));
          if (names.length < 1) S.core.empty.push(c.tag + ' W' + wk + ' ' + d);
          if (names.length === 1) S.core.one++;
          if (s.pillar === 'rotational_power') names.forEach((n) => rot.add(n));
          if (s.pillar === 'anti_rotation') {
            ar.blocks++;
            names.forEach((n) => ar.seen.add(n));
            ar.pairs.add(names.slice().sort().join(' + '));
            if (names.includes('Side plank')) ar.statik++;
          }
        }
      }
  }
  // the union over injury paths, per tier
  S.all = {};
  for (const e of GEAR_EQUIP) S.all[e] = ([] as TaggedItems[]).concat(...Object.values(S.byInj).map((x) => x.per[e] || []));
  return S;
}
const countEq = (rows: TaggedItems[], nm: string): number => rows.reduce((n, r) => n + r.items.filter((x) => x.name === nm).length, 0);
const countBy = (rows: TaggedItems[], re: RegExp): number => rows.reduce((n, r) => n + r.items.filter((x) => re.test(x.name)).length, 0);
const firstBy = (rows: TaggedItems[], re: RegExp): string => { for (const r of rows) for (const x of r.items) if (re.test(x.name)) return r.tag + ' W' + x.wk + ' ' + x.d + ' ' + x.label + ' :: ' + x.name; return ''; };
// The wizard's equipment cards, read straight out of the app's HTML.
function wizardCards(html: string): Record<string, string> {
  const re = /\{id:'([a-z_]+)',\s*icon:'[^']*',\s*label:'[^']*',\s*desc:'([^']*)'\}/g;
  const cards: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) if (GEAR_TIERS[m[1]] && GEAR_TIERS[m[1]].card) cards[m[1]] = m[2];
  return cards;
}

// ══ D70c / D150 / D149: the inventory's denial binds ═══════════════════════════════════════════════════════════
// 1 owns, 0 denied, null unruled (medicine ball and added weight on the home tiers).
/** A tier's inventory: 1 owns, 0 denied, null unruled. */
export type Inventory = Record<string, 0 | 1 | null>;
const OWNS: Record<string, Inventory> = {
  commercial: { BARBELL: 1, DUMBBELL: 1, CABLE: 1, MACHINE: 1, GHD: 1, KETTLEBELL: 1, BAND: 1, MEDBALL: 1, WEIGHTED: 1 },
  crossfit: { BARBELL: 1, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 1, KETTLEBELL: 1, BAND: 1, MEDBALL: 1, WEIGHTED: 1 },
  home_full: { BARBELL: 1, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 1, BAND: 1, MEDBALL: null, WEIGHTED: null },
  home_basic: { BARBELL: 0, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 1, BAND: 1, MEDBALL: null, WEIGHTED: null },
  bodyweight: { BARBELL: 0, DUMBBELL: 0, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 0, BAND: 0, MEDBALL: 0, WEIGHTED: 0 },
};
const INV_TIERS = Object.keys(OWNS) as Equipment[];
const denies = (t: string, c: string): boolean => OWNS[t][c] === 0;
const DENYING_TIERS = INV_TIERS.filter((t) => Object.keys(OWNS[t]).some((c) => denies(t, c)));
/** The implement classes a movement needs, read from its name (GHR, glute-ham and 45° back extension are the GHD station). */
function implementClass(name: unknown): Set<string> {
  const N = String(name).toLowerCase(), c = new Set<string>();
  if (/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/.test(N)) c.add('GHD');
  if (/\bbarbell\b|^back squat|^front squat|^paused (back|front) squat|^bench press|close-grip bench|trap bar|power clean|hang clean|^hang power|^power snatch|^snatch|rack pull|landmine|\bez[- ]?bar|^good mornings?\b|^overhead squat|^deadlift|^sumo deadlift|^romanian deadlift$|^conventional deadlift|^push press$|^overhead press$|^pin press|^bent[- ]over row$|^pendlay|^zercher|^hip thrust$/.test(N)) c.add('BARBELL');
  if (/dumbbell|\bdb\b/.test(N) || (/goblet/.test(N) && !/kettlebell|\bkb\b/.test(N))) c.add('DUMBBELL');
  if (/cable|face pull|pull-?down|rope tricep|tricep rope/.test(N) && !/band/.test(N)) c.add('CABLE');
  if (/machine|leg press|leg extension|lying leg curl|seated leg curl|hack squat|smith|pec deck|belt squat|reverse hyper|preacher/.test(N)) c.add('MACHINE');
  if (/kettlebell|\bkb\b/.test(N)) c.add('KETTLEBELL');
  if (/\bbands?\b|banded/.test(N) && !/band stretch|\bit band/.test(N)) c.add('BAND');
  if (/med(icine)? ?ball|wall ball|ball slam|slam ball/.test(N)) c.add('MEDBALL');
  if (/\bweighted\b|weight vest|sandbag|rucksack|\bsled\b|\bplate\b/.test(N)) c.add('WEIGHTED');
  return c;
}
const classOf = (n: string): string => [...implementClass(n)].sort().join('+');
const deniedOn = (t: string, n: string): string[] => [...implementClass(n)].filter((c) => denies(t, c));
const INV_GOALS: [string, Record<string, string>][] = [['run_5k', {}], ['run_half', {}], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '0' }], ['run_base', {}], ['run_10k', {}], ['run_marathon', {}]];
const INV_FOC: LiftingFocus[] = ['hypertrophy', 'strength', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const INV_EXPS: Experience[] = ['beginner', 'intermediate', 'advanced'], INV_AGES = ['18-35', '36-54', '55+'], INV_RESTS: DayKey[][] = [['sun', 'wed'], ['sat', 'sun']];
const INV_SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle'], ITIER: InjuryTier[] = ['workaround', 'protect'];
/** A config the way the inventory lattices write one: goal by gi, rest pattern and seed by si. */
function invCfg(eq: Equipment, gi: number, f: LiftingFocus, exp: Experience, age: string, si: number, inj?: Injury | null): Cfg {
  const [g, x] = INV_GOALS[gi % INV_GOALS.length];
  const c: Cfg = { name: 'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: ['run'],
    cardioGoals: { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, x) },
    eventTargeted: false, liftingFocus: f, experience: exp, ageBracket: age, equipment: eq, unit: 'lbs',
    restDays: INV_RESTS[si % 2].slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: INV_SEEDS[si] };
  if (inj) c.injury = inj;
  return c;
}
/** The D70c lattice: 5 tiers x 8 seeds x (7 foci x 3 experience levels x 3 ages + 6 regions x 2 injury tiers) = 3,000. */
/** An inventory lattice cell: tier, focus, age, seed index, injury and config. */
export interface InvCell { eq: Equipment; f: LiftingFocus; a: string; si: number; inj?: Injury; cfg: Cfg }
function inventoryLattice(): InvCell[] {
  const cells: InvCell[] = [];
  for (const eq of INV_TIERS)
    for (let si = 0; si < INV_SEEDS.length; si++) {
      for (const f of INV_FOC) for (const e of INV_EXPS) for (const a of INV_AGES)
        cells.push({ eq, f, a, si, cfg: invCfg(eq, si + INV_FOC.indexOf(f), f, e, a, si, null) });
      for (const r of REG) for (const t of ITIER)
        cells.push({ eq, f: 'hypertrophy', a: INV_AGES[si % 3], si, inj: { region: r, tier: t }, cfg: invCfg(eq, si + INV_FOC.indexOf('hypertrophy'), 'hypertrophy', INV_EXPS[si % 3], INV_AGES[si % 3], si, { region: r, tier: t }) });
    }
  return cells;
}
const IMPL_TOKEN = /barbell|dumbbell|cable|machine|pec deck|leg press|hack squat|glute-ham|preacher|pulldown|face pull|smith/i;
/** Every printed name, every universe entry and every swap-sheet offer checked against the inventory. */
/** A universe check's tally: universe sizes, entries a tier denies, and one example each. */
export interface UniverseAcc { size: Record<string, number>; bad: Record<string, number>; ex: Record<string, string> }
/** The inventory survey (see surveyInventory). */
export interface InvSurvey {
  built: number; errors: string[]; undefinedNames: number; unclassed: Record<string, number>; names: Record<string, number>; denied: Record<string, number>; deniedEx: Record<string, string>;
  universe: UniverseAcc; sheet: { calls: Record<string, number>; cands: Record<string, number>; bad: Record<string, number>; ex: Record<string, string>; crash: number };
  olderHyp: Record<string, Record<string, number>>; hbSecond: { n: number; bad: string[] };
}
function surveyInventory(IA: App, cells: InvCell[], { swapSeeds = 2 }: { swapSeeds?: number } = {}): InvSurvey {
  const swapCandidates = IA.swapCandidates || IA.eval('swapCandidates');
  const S: InvSurvey = { built: 0, errors: [], undefinedNames: 0, unclassed: {}, names: {}, denied: {}, deniedEx: {},
    universe: { size: {}, bad: {}, ex: {} }, sheet: { calls: {}, cands: {}, bad: {}, ex: {}, crash: 0 },
    olderHyp: { crossfit: {}, home_full: {} }, hbSecond: { n: 0, bad: [] } };
  for (const C of cells) {
    let p: Program;
    try {
      p = IA.buildProgram(clone(C.cfg));
      S.built++;
    } catch (e) {
      S.errors.push(C.eq + ' ' + C.f + ': ' + (e as Error).message);
      continue;
    }
    const swapThis = !C.inj && C.si < swapSeeds, asked = new Set();
    for (const w of Object.keys(p.weeks || {}))
      for (const d of DAYS) {
        const day = p.weeks[w][d];
        for (const s of (day && day.sections) || [])
          for (const it of s.items || []) {
            const raw = it && it.name, n = clean(raw);
            if (raw == null || !n || /\bundefined\b|\bnull\b|\bNaN\b/.test(n)) { S.undefinedNames++; continue; }
            bump(S.names, C.eq + '|' + n);
            if (IMPL_TOKEN.test(n) && !implementClass(n).size && !/bodyweight|band/i.test(n)) bump(S.unclassed, n);
            const lab = String(s.label || s.coreHeader || '');
            if ((C.eq === 'crossfit' || C.eq === 'home_full') && C.f === 'hypertrophy' && C.a !== '18-35' && !C.inj) bump(S.olderHyp[C.eq], n);
            if (C.eq === 'home_basic' && C.f === 'hypertrophy' && C.a === '18-35' && !C.inj && /^Secondary compound/i.test(lab)) {
              S.hbSecond.n++;
              if (!/^Dumbbell (bench|incline) press$/.test(n)) S.hbSecond.bad.push(n);
            }
            for (const c of deniedOn(C.eq, n)) {
              bump(S.denied, C.eq + '|' + c);
              bump(S.denied, C.eq + '|*|' + n);
              if (!S.deniedEx[C.eq]) S.deniedEx[C.eq] = n + ' W' + w + ' ' + d + ' [' + lab + ']';
            }
            if (swapThis && !asked.has(n)) {
              asked.add(n);
              let cs: string[];
              try {
                cs = candNames(swapCandidates(raw, day, w, p));
              } catch (e) {
                S.sheet.crash++;
                continue;
              }
              bump(S.sheet.calls, C.eq);
              bump(S.sheet.cands, C.eq, cs.length);
              for (const cn of cs) if (deniedOn(C.eq, cn).length) { bump(S.sheet.bad, C.eq); S.sheet.ex[C.eq] = S.sheet.ex[C.eq] || n + ' -> ' + cn; }
            }
          }
      }
    universeCheck(p, C.eq, S.universe);
  }
  return S;
}
function universeCheck(p: Program, eq: string, acc: UniverseAcc): void {
  const u = p._swapUniverse || [];
  bump(acc.size, eq, u.length);
  for (const n0 of u) { const n = clean(n0); if (deniedOn(eq, n).length) { bump(acc.bad, eq); acc.ex[eq] = acc.ex[eq] || n; } }
}
/** Travel variants (cfg._travel): 5 tiers x 8 seeds x 2 foci, each universe checked against the inventory. */
function surveyTravel(IA: App): { acc: UniverseAcc; built: number; errors: string[] } {
  const acc: UniverseAcc = { size: {}, bad: {}, ex: {} };
  let built = 0;
  const errors: string[] = [];
  for (const eq of INV_TIERS)
    for (let si = 0; si < INV_SEEDS.length; si++)
      for (const f of ['hypertrophy', 'balanced'] as const) {
        const cfg = invCfg(eq, si + INV_FOC.indexOf(f), f, INV_EXPS[si % 3], INV_AGES[si % 3], si, null);
        cfg._travel = true;
        try {
          universeCheck(IA.buildProgram(cfg), eq, acc);
          built++;
        } catch (e) {
          errors.push(eq + ' ' + f + ': ' + (e as Error).message);
        }
      }
  return { acc, built, errors };
}
const SQ = /squat|leg press/i;
/** Squat mains read off the card: a Main or Primer whose first item is a squat or leg press, counted by name. */
const squatMains = (p: Program): Record<string, number> => {
  const per: Record<string, number> = {};
  Object.keys(p.weeks || {}).forEach((w) => DAYS.forEach((d) => ((p.weeks[w][d] && p.weeks[w][d].sections) || []).forEach((s) => {
    const it = (s.items || [])[0], n = clean(it && it.name);
    if (/^(Main|Primer) — /.test(s.label || '') && SQ.test(n)) bump(per, n);
  })));
  return per;
};
/** A D70c config at an explicit seed (rest pattern and goal of seed index 0). */
const seedCfg = (eq: Equipment, f: LiftingFocus, e: Experience, a: string, seed: number, inj?: Injury | null): Cfg => Object.assign(invCfg(eq, INV_FOC.indexOf(f), f, e, a, 0, inj), { seed });

// ══ D149: the GHD is a station ══════════════════════════════════════════════════════════════════════════════════
const GHD_OWNS: Record<string, Record<string, number>> = {
  commercial: { BARBELL: 1, CABLE: 1, GHD: 1 }, crossfit: { BARBELL: 1, CABLE: 0, GHD: 1 }, home_full: { BARBELL: 1, CABLE: 0, GHD: 0 },
  home_basic: { BARBELL: 0, CABLE: 0, GHD: 0 }, bodyweight: { BARBELL: 0, CABLE: 0, GHD: 0 },
};
const GHD_TIERS = Object.keys(GHD_OWNS) as Equipment[], GHD_DENIED = GHD_TIERS.filter((t) => !GHD_OWNS[t].GHD), GHD_HAS = GHD_TIERS.filter((t) => GHD_OWNS[t].GHD);
const isGHD = (n: string): boolean => /glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/i.test(n);
// The ruled literals, each name's implement typed by hand (null: nothing to own).
const KP_SQUAT_BAR: [string, string][] = [['Barbell hip thrust', 'BARBELL'], ['45° back extension', 'GHD'], ['Cable pull-through', 'CABLE']];
const KP_SQUAT_NOBAR = ['Banded hip thrust', 'Single-leg glute bridge', 'Bodyweight back extension'];
const HIPEXT_INV: Record<string, [string, string | null][]> = {
  bar: [['Barbell hip thrust', 'BARBELL'], ['Glute-ham raise', 'GHD'], ['45° back extension', 'GHD'], ['Cable pull-through', 'CABLE'], ['Single-leg hip thrust', null]],
  home_basic: [['Banded hip thrust', null], ['Single-leg glute bridge (weighted)', null], ['Nordic hamstring curl (anchored)', null], ['Bodyweight back extension', null]],
  bodyweight: [['Single-leg glute bridge', null], ['Bodyweight back extension', null], ['Single-leg hip thrust (shoulders on bed)', null], ['Nordic hamstring curl (anchored)', null]],
};
const ownedOf = (t: string, list: [string, string | null][]): string[] => list.filter(([, c]) => c === null || GHD_OWNS[t][c] === 1).map(([n]) => n);
/** Floor (a): the knee/protect squat pool on a barbell tier gets the bridge only when it holds fewer than two names. */
const floorA = (t: string): { set: string[]; fires: boolean } => {
  if (!GHD_OWNS[t].BARBELL) return { set: KP_SQUAT_NOBAR, fires: false };
  const s = ownedOf(t, KP_SQUAT_BAR);
  return s.length < 2 ? { set: s.concat(['Single-leg glute bridge']), fires: true } : { set: s, fires: false };
};
/** Floor (b): the knee/protect hip-extension reservation gets Bodyweight back extension when it empties. */
const floorB = (t: string): { set: string[]; fires: boolean } => {
  const inv = ownedOf(t, GHD_OWNS[t].BARBELL ? HIPEXT_INV.bar : HIPEXT_INV[t]);
  const left = inv.filter((n) => !/nordic|glute-ham|\bghr\b/i.test(n)).filter((n) => !/hip thrust|glute bridge/i.test(n));
  return left.length ? { set: left, fires: false } : { set: ['Bodyweight back extension'], fires: true };
};
const FLOOR_A_FROM = "_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge')";
const FLOOR_A_TO = "_gear(['Barbell hip thrust','45° back extension','Cable pull-through'])";
const FLOOR_B_FROM = "(_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left";
const FLOOR_B_TO = '_left';
const PROBE_AT = '    const hipExtSel= hipExtPool.length?(_slot(hipExtPool,1,bs+15,\'lower\',true)[0]||null):null;';
const PROBE_LOG = '\n    if(globalThis.__ET_HX) globalThis.__ET_HX.push([hipExtPool.length, hipExtSel===null?0:1]);';
/** The GHD lattice: 5 tiers x 8 seeds x (7 healthy foci + 6 regions x 2 injury tiers) = 760. */
/** A GHD lattice cell: tier, seed index, injury and config. */
export interface GhdCell { eq: Equipment; si: number; inj: Injury | null; cfg: Cfg }
/** A tier and a config. */
export interface EqCfg { eq: Equipment; cfg: Cfg }
function ghdLattice(): GhdCell[] {
  const out: GhdCell[] = [];
  for (const eq of GHD_TIERS)
    for (let si = 0; si < INV_SEEDS.length; si++) {
      INV_FOC.forEach((f, fi) => out.push({ eq, si, inj: null, cfg: invCfg(eq, si + fi, f, INV_EXPS[(si + fi) % 3], INV_AGES[(si + 2 * fi) % 3], si, null) }));
      REG.forEach((r, ri) => ITIER.forEach((t, ti) => out.push({ eq, si, inj: { region: r, tier: t },
        cfg: invCfg(eq, si + ri, INV_FOC[(si + ri + ti) % 7], INV_EXPS[(si + ri) % 3], INV_AGES[(si + ti) % 3], si, { region: r, tier: t }) })));
    }
  return out;
}
/** The knee/protect lattice: 5 tiers x 6 goals x 7 foci x 3 experience levels = 630 (seed, age and rest alternate). */
function kneeLattice(): EqCfg[] {
  const out: EqCfg[] = [];
  for (const eq of GHD_TIERS) INV_GOALS.forEach((_, gi) => INV_FOC.forEach((f, fi) => INV_EXPS.forEach((e, ei) => {
    const si = (gi + fi + ei) % 2;
    out.push({ eq, cfg: invCfg(eq, gi, f, e, si ? '55+' : '18-35', si, { region: 'knee', tier: 'protect' }) });
  })));
  return out;
}
/** Travel for the station: 5 tiers x 8 seeds x 2 foci healthy, plus seeds 0 and 1 under ankle, hip and knee protect. */
function ghdTravelLattice(): EqCfg[] {
  const out: EqCfg[] = [];
  for (const eq of GHD_TIERS) {
    for (let si = 0; si < INV_SEEDS.length; si++) (['hypertrophy', 'balanced'] as const).forEach((f, fi) => out.push({ eq, cfg: invCfg(eq, si + fi, f, INV_EXPS[si % 3], INV_AGES[si % 3], si, null) }));
    for (let si = 0; si < 2; si++) ['ankle', 'hip', 'knee'].forEach((r) => out.push({ eq, cfg: invCfg(eq, si, 'hypertrophy', INV_EXPS[si], INV_AGES[si], si, { region: r, tier: 'protect' }) }));
  }
  out.forEach((x) => { x.cfg._travel = true; });
  return out;
}
/** Station survey: GHD names printed, in the universe, on the swap sheet (seeds 0 and 1 unless `sheet` says), and the hip/protect universe. */
/** The station survey (see surveyStation). */
export interface StationSurvey {
  built: number; errors: string[]; items: Record<string, number>; ex: Record<string, string>; uni: Record<string, number>; uniSize: Record<string, number>;
  sheet: Record<string, number>; calls: Record<string, number>; cands: Record<string, number>; sheetCrash: number; hip: Record<string, number>;
  tItems: Record<string, number>; tUni: Record<string, number>; tUniSize: Record<string, number>; tBuilt: number;
}
function surveyStation(IA: App, cells: GhdCell[], travel?: EqCfg[] | null, { sheet = (x: GhdCell) => x.si < 2 }: { sheet?: (x: GhdCell) => boolean } = {}): StationSurvey {
  const swapCandidates = IA.swapCandidates || IA.eval('swapCandidates');
  const S: StationSurvey = { built: 0, errors: [], items: {}, ex: {}, uni: {}, uniSize: {}, sheet: {}, calls: {}, cands: {}, sheetCrash: 0, hip: {}, tItems: {}, tUni: {}, tUniSize: {}, tBuilt: 0 };
  const scan = (p: Program, eq: string, into: Record<string, number>) => Object.keys(p.weeks || {}).forEach((w) => DAYS.forEach((d) => live(p.weeks[w][d]).forEach((s) => s.items.forEach((it) => {
    const n = clean(it.name);
    if (isGHD(n)) { bump(into, eq); if (!GHD_OWNS[eq].GHD && !S.ex[eq]) S.ex[eq] = n + ' W' + w + ' ' + d; }
  }))));
  for (const x of cells) {
    let p: Program;
    try {
      p = IA.buildProgram(clone(x.cfg));
      S.built++;
    } catch (e) {
      S.errors.push(x.eq + ': ' + (e as Error).message);
      continue;
    }
    scan(p, x.eq, S.items);
    const u = p._swapUniverse || [];
    bump(S.uniSize, x.eq, u.length);
    u.forEach((n) => { if (isGHD(clean(n))) bump(S.uni, x.eq); });
    if (x.inj && x.inj.region === 'hip' && x.inj.tier === 'protect') u.forEach((n) => { n = clean(n); if (/back extension/i.test(n)) bump(S.hip, x.eq + '|' + n); });
    if (sheet(x)) {
      const asked = new Set();
      Object.keys(p.weeks || {}).forEach((w) => DAYS.forEach((d) => { const day = p.weeks[w][d]; live(day).forEach((s) => s.items.forEach((it) => {
        const n = clean(it.name);
        if (asked.has(n)) return;
        asked.add(n);
        let cs: string[];
        try { cs = candNames(swapCandidates(it.name, day, w, p)); } catch (e) { S.sheetCrash++; return; }
        bump(S.calls, x.eq);
        bump(S.cands, x.eq, cs.length);
        cs.forEach((c) => { if (isGHD(c)) bump(S.sheet, x.eq); });
      })); }));
    }
  }
  for (const x of travel || []) {
    let p: Program;
    try {
      p = IA.buildProgram(clone(x.cfg));
      S.tBuilt++;
    } catch (e) {
      S.errors.push('travel ' + x.eq + ': ' + (e as Error).message);
      continue;
    }
    scan(p, x.eq, S.tItems);
    const u = p._swapUniverse || [];
    bump(S.tUniSize, x.eq, u.length);
    u.forEach((n) => { if (isGHD(clean(n))) bump(S.tUni, x.eq); });
  }
  return S;
}
/**
 * Knee/protect survey on the app, the two copies with one floor written out each, and the probe copy that logs every
 * read of the hip-extension reservation.
 */
/** The app and its D149 counterfactuals: without floor (a), without floor (b), and the reservation probe. */
export interface KneeTrees { IA: App; noFloorA?: App | null; noFloorB?: App | null; probe?: App | null }
/** The knee survey (see surveyKnee). */
export interface KneeSurvey {
  cfg: Record<string, number>; crash: string[]; fa: Record<string, number>; fb: Record<string, number>; probeMismatch: number; reads: Record<string, number>;
  dup: Record<string, number>; dupEx: string[]; main: Record<string, number>; mainBad: string[]; lsb: Record<string, number>; lsbBad: string[];
}
function surveyKnee(trees: KneeTrees, cells: EqCfg[]): KneeSurvey {
  const { IA, noFloorA, noFloorB, probe } = trees;
  const K: KneeSurvey = { cfg: {}, crash: [], fa: {}, fb: {}, probeMismatch: 0, reads: {}, dup: {}, dupEx: [], main: {}, mainBad: [], lsb: {}, lsbBad: [] };
  for (const x of cells) {
    const t = x.eq;
    bump(K.cfg, t);
    let p: Program;
    try {
      p = IA.buildProgram(clone(x.cfg));
    } catch (e) {
      K.crash.push(t + ': ' + (e as Error).message);
      continue;
    }
    const dg = progDigest(p);
    if (noFloorA) { try { if (progDigest(noFloorA.buildProgram(clone(x.cfg))) !== dg) bump(K.fa, t); } catch (e) { bump(K.fa, t + '|crash'); } }
    if (noFloorB) { try { if (progDigest(noFloorB.buildProgram(clone(x.cfg))) !== dg) bump(K.fb, t); } catch (e) { bump(K.fb, t + '|crash'); } }
    if (probe) {
      probe.window.__ET_HX = [];
      let q: Program | null = null;
      try { q = probe.buildProgram(clone(x.cfg)); } catch (e) { q = null; }
      if (!q || progDigest(q) !== dg) K.probeMismatch++;
      const foc = x.cfg.liftingFocus === 'support_prevention' ? 'prev' : 'other';
      for (const [len] of probe.window.__ET_HX || []) {
        bump(K.reads, t + '|' + foc);
        if (!len) bump(K.reads, t + '|empty|' + foc);
      }
      probe.window.__ET_HX = [];
    }
    Object.keys(p.weeks || {}).forEach((w) => DAYS.forEach((d) => {
      const secs = live(p.weeks[w][d]), names: string[] = [];
      secs.forEach((s) => s.items.forEach((it) => names.push(clean(it.name))));
      const seen: Record<string, number> = {};
      const dn = names.find((n) => { const r = seen[n]; seen[n] = 1; return r; });
      if (dn) { bump(K.dup, t); if (K.dupEx.length < 3) K.dupEx.push(t + ' W' + w + ' ' + d + ' ' + dn); }
      const lsb = secs.find((s) => s.label === 'Leg superset B');
      if (!lsb) return;   // the legs day: Leg superset B carries the hip-extension item, its Main the squat pool
      bump(K.lsb, t + '|' + lsb.items.length);
      if (lsb.items[1]) { const n = clean(lsb.items[1].name); if (!floorB(t).set.includes(n)) K.lsbBad.push(t + ' ' + n); }
      if (GHD_OWNS[t].BARBELL) {
        const mn = secs.find((s) => /^Main — /.test(s.label || ''));
        if (mn) { const n = clean(mn.items[0].name); bump(K.main, t + '|' + n); if (!floorA(t).set.includes(n)) K.mainBad.push(t + ' ' + n); }
      }
    }));
  }
  return K;
}
/** The app, the two copies with one D149 floor written out each, and the reservation probe. */
function kneeTrees(IA: App): KneeTrees {
  const text = D.appText();
  return {
    IA,
    noFloorA: D.loadText(D.replaceOnce(text, FLOOR_A_FROM, FLOOR_A_TO, 'D149 floor (a)'), 'no-floor-a'),
    noFloorB: D.loadText(D.replaceOnce(text, FLOOR_B_FROM, FLOOR_B_TO, 'D149 floor (b)'), 'no-floor-b'),
    probe: D.loadText(D.replaceOnce(text, PROBE_AT, PROBE_AT + PROBE_LOG, 'the hip-extension reservation read'), 'hipext-probe'),
  };
}

// ══ D42-c: the shoulder slot prints a side for a one-hand press ═══════════════════════════════════════════════
const ONE_HAND = ['Kettlebell single-arm press', 'Landmine rotational press'];
const TWO_HAND = ['Barbell overhead press', 'Dumbbell shoulder press', 'Dumbbell Arnold press', 'Dumbbell lateral raise', 'Barbell push press', 'Seated dumbbell press', 'Pike pushups', 'Cable lateral raise', 'Machine shoulder press'];
const hasEach = (d: unknown): boolean => /\beach\b/.test(String(d || ''));
/** The shoulder-side lattice: 6 tiers x 4 foci x the given seeds (40 seeds give 960 builds). */
function shoulderLattice(nSeeds: number): Cfg[] {
  const out: Cfg[] = [];
  for (const equipment of ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'])
    for (const liftingFocus of ['support_prevention', 'hypertrophy', 'strength', 'general'])
      for (let i = 1; i <= nSeeds; i++) out.push(Object.assign({}, fixtures.HALF_MANNY, { equipment, liftingFocus, seed: i * 1013 }));
  return out;
}
/** Per site (S1 heavy push Main, S2 light push Main, S3 push Accessory), per name: details with and without a side. */
/** Per shoulder site, per name: details with and without a side. */
export type SideSeen = Record<'S1' | 'S2' | 'S3', Record<string, { each: number; plain: number }>>;
function surveyShoulderSide(IA: App, cfgs: Cfg[]): { seen: SideSeen; builds: number; errors: string[] } {
  const seen: SideSeen = { S1: {}, S2: {}, S3: {} };
  let builds = 0;
  const errors: string[] = [];
  for (const cfg of cfgs) {
    let prog: Program;
    try {
      prog = IA.buildProgram(cfg);
      builds++;
    } catch (e) {
      errors.push(cfg.equipment + ' ' + cfg.liftingFocus + ' ' + cfg.seed + ': ' + (e as Error).message);
      continue;
    }
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS) {
        const day = prog.weeks[wk][d];
        if (!day) continue;
        for (const sec of day.sections || []) {
          const label = String(sec.label || ''), items = sec.items || [];
          if (items.length !== 2) continue;
          const site = /^Main — /.test(label) ? (/leave 3\+ in reserve/.test(String(items[0].detail || '')) ? 'S2' : 'S1') : label === 'Accessory' ? 'S3' : null;
          if (!site) continue;
          const n = clean(items[1].name);
          const m = (seen[site][n] = seen[site][n] || { each: 0, plain: 0 });
          if (hasEach(items[1].detail)) m.each++;
          else m.plain++;
        }
      }
  }
  return { seen, builds, errors };
}

// ══ D196: a band hip thrust falls to the plan's bodyweight hip extension ════════════════════════════════════════
const D196_CLOCK = '2026-08-24T12:00:00';
const D196_PLANS = ['ankle/protect', 'knee/protect', 'lowback/protect', 'lowback/workaround'];
const LANDING: Record<string, string> = { 'ankle/protect': D.BRIDGE, 'knee/protect': D.BRIDGE, 'lowback/protect': D.BED, 'lowback/workaround': D.BED };
// The D193 cap table (which patterns each plan caps), typed by hand from that ruling.
const CAP: Record<string, Record<string, string[]>> = { knee: { workaround: ['squat', 'lunge', 'leg_iso'], protect: ['hinge'] }, ankle: { workaround: ['squat', 'lunge'], protect: ['squat'] },
  hip: { workaround: ['hinge', 'lunge', 'hip_ext', 'squat'], protect: ['squat'] }, lowback: { workaround: ['hinge', 'squat', 'row', 'hip_ext'], protect: ['squat', 'hip_ext'] },
  shoulder: { workaround: ['hpress', 'vpress', 'delt_iso'], protect: [] }, elbow: { workaround: ['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect: ['row', 'vpull'] } };
// Stamps each item's name as bodyweightSweep receives it (records names, changes nothing).
const PRE_SWEEP_WRAP = "var __BUILD=0;var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; ((dy&&dy.sections)||[]).forEach(function(s){ (s.items||[]).forEach(function(it){ if(it&&it.name) it.__pre={n:it.name,b:__BUILD}; }); }); }); }); }catch(e){} return __origBWS.apply(this,arguments); };";
// The five replacement texts D196 put into the app (slices 4 and 5), each present exactly once.
const D196_TEXTS = [
  "  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';\n  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';\n",
  "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):[_bwHTak,'Single-leg glute bridge','Bodyweight back extension'];\n",
  "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):[_bwHTak,'Single-leg glute bridge'];\n",
  "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):[_bwHTlb,'Single-leg glute bridge'];\n        hingePool = [_bwHTlb,'Single-leg glute bridge'];\n",
  "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):[_bwHTlb,'Single-leg hip thrust'];\n",
];
const MARIO: Cfg = { name: 'M', primaryPath: 'lift', cardioTypes: [], cardioGoals: {}, eventTargeted: false, raceDate: null, liftingFocus: 'support_strength', experience: 'beginner', ageBracket: '18-35',
  equipment: 'commercial', unit: 'lbs', restDays: ['sun', 'wed'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185, seed: 76308 };
const BW_REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'], BW_EXPS: Experience[] = ['beginner', 'intermediate', 'advanced'];
/** The bodyweight cells of the post-sweep lattices: L432 (108) and LBW (216), seed 76308. */
/** A bodyweight lattice cell: its lattice, its key and its config. */
export interface BwCell { L: string; k: string; c: Cfg }
function bwLattice(): BwCell[] {
  const out: BwCell[] = [];
  for (const g of BW_REGS) for (const t of ITIER) for (const ex of BW_EXPS) for (const fo of ['support_strength', 'support_athletic', 'support_prevention'] as const)
    out.push({ L: 'L432', k: g + '/' + t + '|bodyweight|' + ex + '|' + fo + '|sun,wed', c: Object.assign(clone(MARIO), { injury: { region: g, tier: t }, equipment: 'bodyweight', experience: ex, liftingFocus: fo }) });
  for (const g of BW_REGS) for (const t of ITIER) for (const ex of BW_EXPS) for (const fo of ['balanced', 'strength', 'hypertrophy'] as const) for (const rd of [['sun', 'wed'], ['sat', 'sun']] satisfies DayKey[][])
    out.push({ L: 'LBW', k: g + '/' + t + '|bodyweight|' + ex + '|' + fo + '|' + rd.join(','), c: Object.assign(clone(MARIO), { injury: { region: g, tier: t }, equipment: 'bodyweight', experience: ex, liftingFocus: fo, restDays: rd }) });
  return out;
}
/** The race family of the injury attribution lattice (1,008 builds, 168 bodyweight). */
/** A race lattice cell: its tier, its key and its config. */
export interface RaceCell { eq: Equipment; k: string; c: Cfg }
function raceLattice(): RaceCell[] {
  const SEEDS = [87747, 76308, 1234, 4242], RESTS: DayKey[][] = [['sun', 'wed'], ['sat', 'sun']];
  const FAM: { race: [string, Record<string, string>][]; test: [string, Record<string, string>][]; none: [null, Record<string, string>][] } = { race: [['run_5k', {}], ['run_10k', {}], ['run_half', {}], ['run_marathon', {}]], test: [['run_pace_goal', {}], ['run_base', {}]], none: [[null, {}]] };
  const out: RaceCell[] = [];
  let k = 0;
  for (const r of BW_REGS) for (const t of ITIER) for (const f of INV_FOC) for (const fam of Object.keys(FAM)) for (const eq of ['commercial', 'crossfit', 'home_full', 'home_basic', 'minimal', 'bodyweight'] as const) for (let ri = 0; ri < 2; ri++) {
    const ei = k % 3, si = (k >> 1) % 4;
    k++;
    if (fam !== 'race') continue;
    const g = FAM.race[(si + ei) % 4];
    out.push({ eq, k: r + '/' + t + '|' + eq + '|' + BW_EXPS[ei] + '|' + f + '|race|s' + SEEDS[si] + '|' + RESTS[ri].join(','),
      c: { name: 'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: ['run'], cardioGoals: { run: Object.assign({ id: g[0], label: g[0], mileBestMins: '8', mileBestSecs: '0', baselineDist: '3', baseline: '3mi' }, g[1]) },
        eventTargeted: false, liftingFocus: f, experience: BW_EXPS[ei], ageBracket: '18-35', equipment: eq, unit: 'lbs', restDays: RESTS[ri].slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: SEEDS[si], injury: { region: r, tier: t } } });
  }
  return out;
}
// The 82 both-thrust days that predate D196 (all in plans D196 never touches; parked as P-BWTHRUSTDOUBLE). D196 adds
// none and removes none.
const W16 = (d: string): string[] => ['1', '2', '3', '4', '5', '6'].map((w) => 'W' + w + ' ' + d);
const W1x = (d: string): string[] => ['1', '2', '4', '5', '6'].map((w) => 'W' + w + ' ' + d);
const THRUST82: Record<string, string[]> = {
  'ankle/workaround|bodyweight|beginner|hypertrophy|sat,sun': W16('wed'), 'ankle/workaround|bodyweight|beginner|hypertrophy|sun,wed': W16('thu'),
  'ankle/workaround|bodyweight|intermediate|hypertrophy|sat,sun': W1x('wed'), 'ankle/workaround|bodyweight|intermediate|hypertrophy|sun,wed': W1x('thu'),
  'elbow/protect|bodyweight|beginner|hypertrophy|sat,sun': W16('wed'), 'elbow/protect|bodyweight|beginner|hypertrophy|sun,wed': W16('thu'),
  'elbow/workaround|bodyweight|beginner|hypertrophy|sat,sun': W16('wed'), 'elbow/workaround|bodyweight|beginner|hypertrophy|sun,wed': W16('thu'),
  'knee/workaround|bodyweight|beginner|hypertrophy|sat,sun': W16('wed'), 'knee/workaround|bodyweight|beginner|hypertrophy|sun,wed': W16('thu'),
  'shoulder/protect|bodyweight|beginner|hypertrophy|sat,sun': W16('wed'), 'shoulder/protect|bodyweight|beginner|hypertrophy|sun,wed': W16('thu'),
  'shoulder/workaround|bodyweight|beginner|hypertrophy|sat,sun': W16('wed'), 'shoulder/workaround|bodyweight|beginner|hypertrophy|sun,wed': W16('thu'),
};
const THRUST82_SET = ([] as string[]).concat(...Object.keys(THRUST82).map((k) => THRUST82[k].map((x) => k + ' ' + x))).sort();
// D196's typed Mains (label, then [name, detail] per item), two weeks each.
const D_AP = '3 sets — RPE 7 (leave ~3 in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const D_LB = '3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 3 min rest';
const D_I8 = '3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest';
/** A Main card: its label and its items as [name, detail]. */
export interface MainCard { label: string; items: [string, string][] }
const mainOf = (n: string, d: string): MainCard => ({ label: 'Main — ' + n, items: [[n, d]] });
const D196_CARDS: { tag: string; k: string; seed?: number; at: [string, DayKey][]; want: MainCard }[] = [
  { tag: 'ankle/protect beginner', k: 'ankle/protect|bodyweight|beginner|support_strength|sun,wed', at: [['3', 'thu'], ['4', 'thu']], want: mainOf(D.BRIDGE, D_AP) },
  { tag: 'lowback/protect beginner', k: 'lowback/protect|bodyweight|beginner|support_strength|sun,wed', at: [['1', 'tue'], ['2', 'tue']], want: mainOf(D.BED, D_LB) },
  { tag: 'lowback/workaround beginner', k: 'lowback/workaround|bodyweight|beginner|support_strength|sun,wed', at: [['1', 'tue'], ['2', 'tue']], want: mainOf(D.BED, D_LB) },
  { tag: 'ankle/protect intermediate balanced', k: 'ankle/protect|bodyweight|intermediate|balanced|sat,sun', at: [['3', 'wed'], ['4', 'wed']], want: mainOf(D.BRIDGE, D_I8) },
  { tag: 'knee/protect intermediate, seed 11', k: 'knee/protect|bodyweight|intermediate|support_strength|sun,wed', seed: 11, at: [['3', 'thu'], ['4', 'thu']], want: mainOf(D.BRIDGE, D_I8) },
];
const secOf = (p: Program | null | undefined, w: string | number, d: DayKey): Section[] => { const dy = p && p.weeks && p.weeks[w] && p.weeks[w][d]; return (dy && !dy.rest && dy.sections) || []; };
const mainCard = (p: Program | null | undefined, w: string | number, d: DayKey): MainCard | null => {
  const s = secOf(p, w, d).find((x) => /^Main —/.test(clean(x && x.label)));
  return s ? { label: clean(s.label), items: (s.items || []).map((i): [string, string] => [clean(i.name), String(i.detail == null ? '' : i.detail)]) } : null;
};
/** The app with the clock pinned and the pre-sweep stamp installed. */
function d196App(): App {
  const IA = D.pinDate(D.loadText(D.appText(), 'd196'), D196_CLOCK);
  IA.eval(PRE_SWEEP_WRAP);
  return IA;
}
/** Main and Primer burpees, capped-to-uncapped renames (D193 cap table, frozen lens), both-thrust days, adjacent bridges. */
/** The bodyweight survey (see surveyBodyweight). */
export interface BwSurvey {
  mains: number; mainsEx: string[]; a2: string[]; thrust: Record<string, number>; thrustDays: Record<string, string[]>; adj: string[]; land: Record<string, number>;
  primer: string[]; built: number; thrustSet: string[];
}
/** An item as bodyweightSweep received it, stamped by the pre-sweep wrapper: the build it was stamped in and its name then. */
type StampedItem = Item & { __pre?: { b: number; n: string } };
function surveyBodyweight(IA: App, cells: BwCell[], race?: RaceCell[] | null): BwSurvey {
  const S: BwSurvey = { mains: 0, mainsEx: [], a2: [], thrust: {}, thrustDays: {}, adj: [], land: {}, primer: [], built: 0, thrustSet: [] };
  for (const cell of cells) {
    IA.eval('__BUILD++');
    const b = IA.eval('__BUILD');
    IA.ctx.__C = clone(cell.c);
    const p: Program = IA.eval('buildProgram(__C)');
    S.built++;
    const plan = cell.k.split('|')[0], [rg, tr] = plan.split('/'), cap = CAP[rg][tr];
    const names = (w: string, d: DayKey): Set<string> => { const o = new Set<string>(); secOf(p, w, d).forEach((s) => (s.items || []).forEach((i) => { if (i && i.name) o.add(clean(i.name)); })); return o; };
    Object.keys(p.weeks || {}).forEach((w) => D.ORDER.forEach((d, di) => {
      secOf(p, w, d).forEach((s) => {
        const lab = clean(s.label);
        (s.items || []).forEach((it) => {
          if (!it || !it.name) return;
          const nm = clean(it.name);
          if (/^Main —/.test(lab) && nm === 'Burpees') { S.mains++; if (S.mainsEx.length < 3) S.mainsEx.push(cell.k + ' W' + w + ' ' + d); }
          const st = it as StampedItem, pre = clean(st.__pre && st.__pre.b === b ? st.__pre.n : it.name);
          if (cap.includes(D.frozenPattern(pre) || '-') && !cap.includes(D.frozenPattern(nm) || '-')) S.a2.push(cell.k + ' W' + w + ' ' + d + ' ' + pre + ' > ' + nm);
        });
      });
      const N = names(w, d);
      if (LANDING[plan] && N.has(LANDING[plan])) bump(S.land, plan);
      if (N.has(D.BED) && N.has(D.SLHT)) { bump(S.thrust, plan); (S.thrustDays[cell.k] = S.thrustDays[cell.k] || []).push('W' + w + ' ' + d); }
      const nw = di < 6 ? w : String(+w + 1), nd = di < 6 ? D.ORDER[di + 1] : 'mon';
      if (N.has(D.BRIDGE) && names(nw, nd).has(D.BRIDGE)) S.adj.push(cell.k + ' W' + w + ' ' + d + ' > W' + nw + ' ' + nd);
    }));
  }
  for (const cell of race || []) {
    const p = IA.buildProgram(clone(cell.c));
    Object.keys(p.weeks || {}).forEach((w) => D.ORDER.forEach((d) => secOf(p, w, d).forEach((s) => {
      if (!/^Primer —/.test(clean(s.label))) return;
      (s.items || []).forEach((i) => { if (i && clean(i.name) === 'Burpees') S.primer.push(cell.k + ' W' + w + ' ' + d); });
    })));
  }
  S.thrustSet = ([] as string[]).concat(...Object.keys(S.thrustDays).map((k) => S.thrustDays[k].map((x) => k + ' ' + x))).sort();
  return S;
}

export {
  live, itemsOf, candNames, countEq, countBy, firstBy,
  GEAR_TIERS, GEAR_EQUIP, GATED, UNGATED_CORE, ROT_LEGAL, AR_MEMBERS, AR_LEGAL, GEAR_INJ, gearLattice, surveyGear, wizardCards,
  OWNS, INV_TIERS, DENYING_TIERS, denies, implementClass, classOf, deniedOn, invCfg, inventoryLattice, surveyInventory, surveyTravel, squatMains, seedCfg,
  INV_SEEDS, INV_EXPS,
  GHD_OWNS, GHD_TIERS, GHD_DENIED, GHD_HAS, isGHD, floorA, floorB, ghdLattice, kneeLattice, ghdTravelLattice, surveyStation, surveyKnee, kneeTrees,
  ONE_HAND, TWO_HAND, hasEach, shoulderLattice, surveyShoulderSide,
  D196_PLANS, LANDING, CAP, D196_TEXTS, bwLattice, raceLattice, THRUST82_SET, D196_CARDS, mainCard, d196App, surveyBodyweight, D196_CLOCK,
};