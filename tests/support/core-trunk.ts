// Hand tables and readers for the core and trunk tests (tests/integration/core-trunk.test.js and
// tests/sweeps/core-trunk.test.js). Everything here is typed from the rulings (D46-a, D46-c, D49, D50) and the wizard
// copy; nothing is read back out of the engine to become an expected value.
import type { Cardio, Cfg, Day, DayKey, Equipment, Experience, Injury, Item, LiftingFocus, Program, Section } from '@ia/core';
import { fixtures } from './app.ts';
import type { App } from './app.ts';

const clean = (s: unknown): string => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
/** A host-realm copy of a value read out of the app's VM (deepStrictEqual compares prototypes across realms). */
const host = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const EQUIP: Equipment[] = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];

/** Calls fn(day, week, dayKey) for every day of a built program. */
function forEachDay(prog: Program, fn: (day: Day, week: number, dayKey: DayKey) => void): void {
  for (const w of Object.keys(prog.weeks || {})) for (const d of DAYS) {
    const day = prog.weeks[w]?.[d];
    if (day) fn(day, +w, d);
  }
}

// ── D46-a: the rotational power pillar ──────────────────────────────────────────────────────────────────────────────
// Declaration order, typed by hand. Pairs computed by hand from the ruling's rule: index by the pillar's own clock T,
// pair = (2T-1, 2T) mod k. Hot-tomorrow T = R/2; clear-runway T = floor((R-1)/3). Commercial owns every member (k = 7).
const ROT_ORDER = [
  'Windshield wipers', 'Medicine ball rotary toss', 'Cable woodchoppers', 'Landmine rotations',
  'Standing torso rotations (slow)', 'Side plank thread-the-needle', 'Band woodchopper (door anchor)',
];
const ROT_HOT_TABLE: Record<number, string[]> = {
  2: ['Medicine ball rotary toss', 'Cable woodchoppers'],
  4: ['Landmine rotations', 'Standing torso rotations (slow)'],
  6: ['Side plank thread-the-needle', 'Band woodchopper (door anchor)'],
  8: ['Windshield wipers', 'Medicine ball rotary toss'],
  10: ['Cable woodchoppers', 'Landmine rotations'],
  12: ['Standing torso rotations (slow)', 'Side plank thread-the-needle'],
};
const ROT_RUN_TABLE: Record<number, string[]> = {
  3: ['Band woodchopper (door anchor)', 'Windshield wipers'],
  6: ['Medicine ball rotary toss', 'Cable woodchoppers'],
  9: ['Landmine rotations', 'Standing torso rotations (slow)'],
  12: ['Side plank thread-the-needle', 'Band woodchopper (door anchor)'],
};
// The gear legal members per tier (D46-c), typed from the movement names and the wizard cards: cables commercial
// only, med balls commercial and crossfit, a landmine is a barbell, bands on every tier whose card names bands.
const ROT_LEGAL: Record<Equipment, string[]> = {
  bodyweight: ['Windshield wipers', 'Standing torso rotations (slow)', 'Side plank thread-the-needle'],
  minimal: ['Windshield wipers', 'Standing torso rotations (slow)', 'Side plank thread-the-needle'],
  home_basic: ['Windshield wipers', 'Standing torso rotations (slow)', 'Side plank thread-the-needle', 'Band woodchopper (door anchor)'],
  home_full: ['Windshield wipers', 'Landmine rotations', 'Standing torso rotations (slow)', 'Side plank thread-the-needle', 'Band woodchopper (door anchor)'],
  commercial: ROT_ORDER.slice(),
  crossfit: ['Windshield wipers', 'Medicine ball rotary toss', 'Landmine rotations', 'Standing torso rotations (slow)', 'Side plank thread-the-needle', 'Band woodchopper (door anchor)'],
};
/** Distinct pairs a stride-2 walk over a k-member list visits for T = 1..6 (arithmetic, not the engine). */
function expectedRotPairs(k: number): number {
  const seen = new Set<string>();
  for (let T = 1; T <= 6; T++) seen.add([(((2 * T - 1) % k) + k) % k, (((2 * T) % k) + k) % k].sort((a, b) => a - b).join('/'));
  return seen.size;
}

// ── D46-c third reader and D49: the protect-tier upper-limb trunk block ─────────────────────────────────────────────
const TIER_GEAR: Record<Equipment, { load: boolean; bands: boolean }> = {
  bodyweight: { load: false, bands: false },
  minimal: { load: true, bands: false },
  home_basic: { load: true, bands: true },
  home_full: { load: true, bands: true },
  commercial: { load: true, bands: true },
  crossfit: { load: true, bands: true },
};
const AR_MEMBERS: { name: string; need: 'load' | 'bands' | null }[] = [
  { name: 'Bird dogs', need: null },
  { name: 'Side plank', need: null },
  { name: 'Plank shoulder taps', need: null },
  { name: 'Pallof press', need: 'bands' },
  { name: 'Dumbbell renegade rows', need: 'load' },
  { name: 'Farmer carry', need: 'load' },
  { name: 'Suitcase carry', need: 'load' },
];
const AE_MEMBERS = ['Plank hold', 'Bird dogs', 'McGill curl-up', 'Superman', 'RKC plank'];
/** The anti-rotation names a protect-tier day may draw on a tier: the day strips carries, the gear gate the rest. */
const arLegal = (e: Equipment): string[] => AR_MEMBERS.filter((m) => !/carry/i.test(m.name)).filter((m) => m.need === null || TIER_GEAR[e][m.need]).map((m) => m.name);
/** The hand draw for week w: rotation index (w-1+k) mod len, anti-extension takes slots 0 and 2, anti-rotation re-draws past a collision. */
function derivedTrunk(equipment: Equipment, w: number): { ar: string[]; ae: string[]; plain: string[]; collided: boolean } {
  const rot = <T>(arr: readonly T[], k: number): T => arr[((((w - 1 + k) % arr.length) + arr.length) % arr.length)];
  const ae = [rot(AE_MEMBERS, 0), rot(AE_MEMBERS, 2)];
  const legal = arLegal(equipment);
  const taken: Record<string, number> = Object.fromEntries(ae.map((n) => [n, 1]));
  const ar: string[] = [];
  for (let k = 0; k < legal.length && ar.length < 2; k++) {
    const n = rot(legal, k);
    if (taken[n]) continue;
    taken[n] = 1;
    ar.push(n);
  }
  const plain = [rot(legal, 0), rot(legal, 1)];
  return { ar, ae, plain, collided: plain.some((n) => ae.includes(n)) };
}
/** Order-preserving containment: every printed name comes from the hand list, in that order. */
function isSub(small: readonly string[], big: readonly string[]): boolean {
  let i = 0;
  for (const n of small) {
    const j = big.indexOf(n, i);
    if (j < 0) return false;
    i = j + 1;
  }
  return true;
}
const AR_LABEL = 'Trunk — anti-rotation';
const AE_LABEL = 'Trunk — anti-extension';
/** Every protect-tier shoulder and elbow trunk block over 6 tiers x 5 seeds of HALF_MANNY. */
/** One protect-tier day's trunk block: which of the two sections it printed, their names, and every name of the day. */
interface TrunkRow {
  key: string; equipment: Equipment; seed: number; wk: number; d: DayKey;
  hasAR: boolean; hasAE: boolean; ar: string[]; ae: string[]; all: string[];
}
function protectTrunkRows(IA: App): { rows: TrunkRow[]; doubled: string[] } {
  const rows: TrunkRow[] = [];
  const doubled: string[] = [];
  const injuries: Injury[] = [{ region: 'shoulder', tier: 'protect' }, { region: 'elbow', tier: 'protect' }];
  for (const injury of injuries)
    for (const equipment of EQUIP)
      for (const seed of [1013, 3039, 6078, 10130, 76308]) {
        const prog = IA.buildProgram({ ...fixtures.HALF_MANNY, equipment, seed, injury });
        forEachDay(prog, (day, wk, d) => {
          const secs = day.sections || [];
          const ar = secs.filter((s) => clean(s.label) === AR_LABEL);
          const ae = secs.filter((s) => clean(s.label) === AE_LABEL);
          if (!ar.length && !ae.length) return;
          const key = `${injury.region}/protect ${equipment} seed=${seed} W${wk} ${d}`;
          if (ar.length > 1 || ae.length > 1) return void doubled.push(key);
          const names = (s?: Section): string[] => (s ? (s.items || []).map((i) => clean(i && i.name)) : []);
          rows.push({
            key, equipment, seed, wk, d, hasAR: ar.length === 1, hasAE: ae.length === 1, ar: names(ar[0]), ae: names(ae[0]),
            all: secs.reduce<string[]>((a, s) => a.concat((s.items || []).map((i) => clean(i && i.name))), []),
          });
        });
      }
  return { rows, doubled };
}

// ── D50: the trunk floor, with the session cost model typed by hand ─────────────────────────────────────────────────
const HALF = /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i;
const STRETCH = /stretch|mobility|90\/90|foam|worlds greatest/i;
const handSets = (det: unknown): number => {
  const m = String(det || '').match(/(\d+)\s*[×x]/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 3;
};
const handCost = (it: Item | null | undefined): number => (!it || STRETCH.test(it.name || '') ? 0 : HALF.test(it.name || '') ? handSets(it.detail) * 0.5 : handSets(it.detail));
const handTotal = (secs: readonly (Section | null | undefined)[]): number => secs.reduce((a, s) => a + ((s && s.items) || []).reduce((b, it) => b + handCost(it), 0), 0);
/** The day D50 is about, by hand: rehab, a cuff rail at rank 1, then two bare trunk sections. 26.5 sets against 20. */
function trunkDay(arItems: Item[], aeItems: Item[]): Section[] {
  return [
    { label: 'Rehab focus', items: [{ name: 'Shoulder day. Full range only where it is pain free.', detail: '' }] },
    { label: 'Cuff and scapula', items: [
      { name: 'Band external rotation', detail: '4×15 each side' }, { name: 'Prone Y raise', detail: '4×12' },
      { name: 'Scap pushup', detail: '4×12' }, { name: 'Band pull-apart', detail: '4×15' }] },
    { label: AR_LABEL, items: arItems },
    { label: AE_LABEL, items: aeItems },
  ];
}
const AR2 = (): Item[] => [{ name: 'Side plank', detail: '3×30 sec each side' }, { name: 'Plank shoulder taps', detail: '3×10 each' }];
const AE2 = (): Item[] => [{ name: 'Plank hold', detail: '3×45 sec' }, { name: 'McGill curl-up', detail: '3×8 each' }];
const trunkItems = (secs: readonly Section[]): number => secs.filter((s) => /^Trunk /.test((s && s.label) || '')).reduce((a, s) => a + (s.items || []).length, 0);
const trunkSecs = (secs: readonly Section[]): number => secs.filter((s) => /^Trunk /.test((s && s.label) || '')).length;
/** D18/D33 by hand: NRC long runs only; >= 75 min A, 45 to 75 B, under 45 C; a dress rehearsal is A; race day is never one. */
function handLongRunTier(c: Partial<Cardio> | null | undefined): 'A' | 'B' | 'C' | null {
  if (!c || !c.isNRC || !c.dose) return null;
  if (!/^long run/i.test(c.subtype || '')) return null;
  if (/race day|time trial/i.test(c.subtype || '')) return null;
  if (/rehearsal/i.test(c.detail || '')) return 'A';
  const d = c.dose;
  const m = d.k === 'time' ? Number(d.mins) || 0 : ((Number(d.mi) || 0) * (Number(d.tgt) || 0)) / 60;
  if (!m) return null;
  return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C';
}
/** D37/D38 by hand: race day found by subtype over the last two weeks flattened Monday to Sunday; k days out. */
function handRaceWindow(prog: Program): Map<string, number> {
  const win = new Map<string, number>();
  const tw = Object.keys(prog.weeks || {}).map(Number).filter(Boolean).sort((a, b) => a - b).pop();
  if (!tw) return win;
  const flat: string[] = [];
  [tw - 1, tw].forEach((w) => {
    if (prog.weeks[w]) ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((d) => flat.push(w + '|' + d));
  });
  const ri = flat.findIndex((k) => {
    const [w, d] = k.split('|');
    const day = prog.weeks[w!]?.[d as DayKey];
    return !!(day && day.cardio && /RACE DAY|TIME TRIAL/i.test(day.cardio.subtype || ''));
  });
  if (ri < 0) return win;
  for (let k = 0; k <= 2; k++) if (flat[ri - k]) win.set(flat[ri - k], k);
  return win;
}
/** The ruled 288-cell lattice: 4 injuries x 6 tiers x 2 foci x 2 experiences x 3 seeds (V193's WIDE floor). */
/** One cell of the lattice, tagged. */
interface LatticeCell { tag: string; cfg: Cfg }
function wideLattice(): LatticeCell[] {
  const INJ: (Injury | null)[] = [null, { region: 'shoulder', tier: 'protect' }, { region: 'lowback', tier: 'protect' }, { region: 'elbow', tier: 'protect' }];
  const FOCI: LiftingFocus[] = ['support_prevention', 'hypertrophy'];
  const EXPS: Experience[] = ['intermediate', 'advanced'];
  const out: LatticeCell[] = [];
  for (const injury of INJ) for (const equipment of EQUIP) for (const liftingFocus of FOCI)
    for (const experience of EXPS) for (const seed of [1013, 3039, 76308]) {
      out.push({ tag: [injury ? injury.region + '/protect' : 'healthy', equipment, liftingFocus, experience, seed].join('|'), cfg: { ...fixtures.HALF_MANNY, equipment, seed, liftingFocus, experience, injury } });
    }
  return out;
}
/** Scans built programs for the trunk floor's program-level claims (L1 to L4 of D50). */
/** What trunkFloorScan finds: the cells and days it read, and every day that breaks a claim. */
interface FloorScan {
  cells: number; days: number; zeroTrunk: string[]; emptySec: string[]; liftInWindow: string[]; tierALift: string[]; ruledElsewhere: number;
}
function trunkFloorScan(IA: App, cells: readonly LatticeCell[]): FloorScan {
  const s: FloorScan = { cells: 0, days: 0, zeroTrunk: [], emptySec: [], liftInWindow: [], tierALift: [], ruledElsewhere: 0 };
  for (const c of cells) {
    const prog = IA.buildProgram(c.cfg);
    s.cells++;
    const win = handRaceWindow(prog);
    const recov = new Set((prog.liftRecoveryWeeks || []).map(String));
    const taper = new Set((prog.taperWeeks || []).map(String));
    forEachDay(prog, (day, w, d) => {
      s.days++;
      const secs = day.sections || [];
      const tSecs = secs.filter((x) => /^Trunk /.test((x && x.label) || ''));
      const tItems = tSecs.reduce((a, x) => a + (x.items || []).length, 0);
      const where = `${c.tag} W${w} ${d}`;
      tSecs.forEach((x) => { if (!(x.items || []).length) s.emptySec.push(where); });
      const tier = handLongRunTier(day.cardio);
      const k = win.get(w + '|' + d) ?? -1;
      if (!day.rest && (k === 0 || k === 1) && secs.length) s.liftInWindow.push(where);
      if (!day.rest && k === 2 && secs.some((x) => !/post-run mobility/i.test(x.label || ''))) s.liftInWindow.push(where);
      if (tier === 'A' && tSecs.length) s.tierALift.push(where);
      if (/trunk/i.test(day.title || '') && tItems === 0 && !tier && k < 0) {
        if (recov.has(String(w)) || taper.has(String(w))) s.ruledElsewhere++;
        else s.zeroTrunk.push(`${where} "${day.title}"`);
      }
    });
  }
  return s;
}

// D89: the clause the core-off counterfactual removes (one line in _compoundTier).
const CORE_CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";

export {
  clean, host, DAYS, EQUIP, forEachDay,
  ROT_ORDER, ROT_HOT_TABLE, ROT_RUN_TABLE, ROT_LEGAL, expectedRotPairs,
  TIER_GEAR, AR_MEMBERS, AE_MEMBERS, arLegal, derivedTrunk, isSub, protectTrunkRows,
  handTotal, trunkDay, AR2, AE2, trunkItems, trunkSecs, handLongRunTier, handRaceWindow, wideLattice, trunkFloorScan,
  CORE_CLAUSE,
};
