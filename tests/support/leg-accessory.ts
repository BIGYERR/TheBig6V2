// Helpers for the leg accessory tests (tests/integration/leg-accessory.test.js, tests/sweeps/leg-accessory.test.js,
// tests/sweeps/leg-accessory-trim-order.test.js). Built on tests/support/session-budget.js (pages, variants, clock).
//
// HAND ORACLES (typed here, never asked of the app): what a movement NEEDS and what a tier OWNS, written from the
// wizard copy the athlete reads, never from _gearOK or EQUIP_TOKENS; the four names D75 harvested, the three coach
// excluded and the five machines; the 25-second hold; the leg movement vocabulary for the bodyweight section; the
// posterior chain table and the budget cost rule D84's comparison reads.
import type { CardioGoalId, CardioType, Cfg, DayKey, Equipment, Experience, LiftingFocus, Program, TrainingDay } from '@ia/core';
import type { App } from './app.ts';
import { clone, clean, page, variant, appHtml, countIn } from './session-budget.ts';
// ── gear legality ───────────────────────────────────────────────────────────────────────────────────────────────
/** A kind of gear a movement needs. */
type Gear = 'machine' | 'cable' | 'barbell' | 'dumbbell' | 'kettlebell' | 'band' | 'medball' | 'pullbar' | 'loadobj';
const NEEDS: [Gear, RegExp][] = [
  ['machine', /\bmachine\b|hack squat|\bsmith\b|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|preacher/i],
  ['cable', /\bcable\b|pulldown|\brope\b|face pull/i],
  ['barbell', /\bbarbell\b|trap bar|power clean|hang clean|\brack pull\b|back squat|front squat|^bench press$|good morning|landmine|glute-ham/i],
  ['dumbbell', /\bdumbbell\b|\bdb\b|goblet/i],
  ['kettlebell', /kettlebell|\(kb\)|\bkb\b/i],
  ['band', /(?<!it )\bband(ed)?\b|resistance band|trx/i],
  ['medball', /med ball|medicine ball|wall ball|ball slams/i],
  ['pullbar', /hanging|toes-to-bar|garhammer|chinup|chin-up|pullup|pull-up|muscle-?up|\bl-sit\b/i],
  ['loadobj', /\bweighted\b|\bloaded\b|farmer carry|suitcase carry|overhead carry/i],
];
const needs = (n: unknown): Gear[] => { const s = String(n || ''); const o: Gear[] = []; for (const [g, r] of NEEDS) if (r.test(s)) o.push(g); return o; };
/** An equipment tier, and travel's Room-only, which builds on bodyweight with _travel set. */
type Tier = Equipment | 'travel_room_only';
const OWNS: Record<Tier, Set<Gear>> = {
  home_full: new Set(['barbell', 'dumbbell', 'kettlebell', 'band', 'pullbar', 'loadobj']),
  home_basic: new Set(['dumbbell', 'kettlebell', 'band', 'pullbar', 'loadobj']),
  commercial: new Set(['machine', 'cable', 'barbell', 'dumbbell', 'kettlebell', 'band', 'pullbar', 'medball', 'loadobj']),
  crossfit: new Set(['barbell', 'dumbbell', 'kettlebell', 'band', 'pullbar', 'medball', 'loadobj']),
  bodyweight: new Set(['pullbar']),
  minimal: new Set(['dumbbell', 'kettlebell', 'loadobj']),
  travel_room_only: new Set<Gear>([]),
};
const TIERS: Equipment[] = ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'];
const TIERS_PLUS: Tier[] = [...TIERS, 'travel_room_only'];
/** D75: the four gear-free names harvested into the pool, the three coach excluded, the five machines commercial keeps. */
const HARVESTED = ['Nordic hamstring curl (anchored)', 'Single-leg glute bridge', 'Single-leg hip thrust', 'Wall sit'];
const EXCLUDED = ['Spanish squat hold (KB)', 'Step-ups (KB)', 'Dumbbell Bulgarian split squat'];
const MACHINES = ['Leg extension', 'Lying leg curl', 'Seated leg curl', 'Leg press', 'Standing cable hamstring curl'];
const HOLD_DOSE_SEC = 25;
const SECTION = 'Leg isolation';
const LEG_WORDS = /squat|lunge|deadlift|hip thrust|glute|hamstring|quad|leg |leg$|calf|step-?up|bridge|wall sit|nordic|hinge|swing|back extension|split squat/i;

// ── the leg accessory lattice (the V197 measure pass) ───────────────────────────────────────────────────────────
// Six tiers plus travel Room-only (bodyweight with _travel) x seven foci x three experiences x four goals x three seeds
// x two rest patterns: 504 configs per tier, 3,528 in all.
const FOCUSES: LiftingFocus[] = ['strength', 'hypertrophy', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const EXPS: Experience[] = ['beginner', 'intermediate', 'advanced'];
const SEEDS = [11, 76308, 90210];
const RESTS: DayKey[][] = [['sun', 'wed'], ['sat', 'sun', 'wed']];
/** A goal row of the lattice: no cardio, or one run goal. */
interface GoalRow { k: string; cardioTypes: CardioType[]; goal: CardioGoalId | null }
const GOALS: GoalRow[] = [
  { k: 'liftonly', cardioTypes: [], goal: null }, { k: 'run_base', cardioTypes: ['run'], goal: 'run_base' },
  { k: 'run_5k', cardioTypes: ['run'], goal: 'run_5k' }, { k: 'run_half', cardioTypes: ['run'], goal: 'run_half' },
];
function mkCfg(tier: Equipment, focus: LiftingFocus, exp: Experience, g: GoalRow, seed: number, rest: DayKey[], travel: boolean): Cfg {
  const isRace = g.goal && /5k|10k|half|marathon/.test(g.goal);
  return {
    name: 'M', primaryPath: g.goal ? (isRace ? 'event' : 'cardio') : 'lift', cardioTypes: g.cardioTypes.slice(),
    cardioGoals: g.goal ? { run: { id: g.goal, label: g.goal, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' } } : {},
    eventTargeted: !!isRace, raceDate: isRace ? '2026-12-06' : null, liftingFocus: focus, experience: exp, ageBracket: '18-35',
    equipment: travel ? 'bodyweight' : tier, unit: 'lbs', restDays: rest.slice(), days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    bench: 135, squat: 155, deadlift: 185, seed, ...(travel ? { _travel: true } : {}),
  };
}
/** One config of a lattice, keyed, with the tier whose gear it is judged by. */
interface LatticeRow { key: string; tier: Tier; cfg: Cfg }
function lattice(tiers: Equipment[], travel: boolean): LatticeRow[] {
  const out: LatticeRow[] = [];
  for (const t of tiers) for (const f of FOCUSES) for (const e of EXPS) for (const g of GOALS) for (const s of SEEDS) for (let r = 0; r < RESTS.length; r++) {
    out.push({ key: `${travel ? 'travel_' : ''}${t}|${f}|${e}|${g.k}|${s}|r${r}`, tier: travel ? 'travel_room_only' : t, cfg: mkCfg(t, f, e, g, s, RESTS[r], travel) });
  }
  return out;
}
/** The whole lattice: 3,528 configs. */
const fullLattice = (): LatticeRow[] => lattice(TIERS, false).concat(lattice(['bodyweight'], true));
/** A trained day of a program, with its week number and day key. */
interface Cell { w: number; d: DayKey; day: TrainingDay }
function trainingDays(prog: Program): Cell[] {
  const out: Cell[] = [];
  const W = prog.weeks || {};
  Object.keys(W).sort((a, b) => +a - +b).forEach((w) => (Object.keys(W[w]!) as DayKey[]).forEach((d) => { const day = W[w]![d]; if (day && !day.rest) out.push({ w: +w, d, day }); }));
  return out;
}

/**
 * Builds every config and counts: items with no name, same-card duplicates (and how many are a harvested name), items a
 * tier does not own the gear for (machine and cable, by the hand table), the Leg isolation sections, whether each
 * carries a harvested name, every Wall sit in them and its dose, and the names the bodyweight section prints.
 */
/** What legSweep counts over a lattice. */
interface LegSweep {
  builds: number; threw: string[]; dayCells: number; undef: number; dup: number; harvestedDup: number;
  wallInSection: number; wallBadDose: number; secTotal: number; secWithHarvest: number;
  census: Record<string, { machine: number; cable: number; names: Record<string, number> }>; bwNames: Record<string, number>;
}
function legSweep(IA: App, rows: LatticeRow[]): LegSweep {
  const r: LegSweep = { builds: 0, threw: [], dayCells: 0, undef: 0, dup: 0, harvestedDup: 0, wallInSection: 0, wallBadDose: 0, secTotal: 0, secWithHarvest: 0, census: {}, bwNames: {} };
  TIERS_PLUS.forEach((t) => (r.census[t] = { machine: 0, cable: 0, names: {} }));
  const DOSE = new RegExp('^\\d+×' + HOLD_DOSE_SEC + ' sec$');
  for (const c of rows) {
    let p: Program;
    try { p = IA.buildProgram(clone(c.cfg)); } catch (e) { r.threw.push(c.key + ': ' + (e as Error).message); continue; }
    r.builds++;
    for (const cell of trainingDays(p)) {
      r.dayCells++;
      const seen: Record<string, 1> = Object.create(null);
      for (const sec of cell.day.sections || []) for (const it of sec.items || []) {
        if (!it || it.name == null) { r.undef++; continue; }
        const nm = String(it.name).trim(), k = nm.toLowerCase();
        if (seen[k]) { r.dup++; if (HARVESTED.some((h) => h.toLowerCase() === k)) r.harvestedDup++; } else seen[k] = 1;
        const nd = needs(nm);
        for (const kind of ['machine', 'cable'] as const) {
          if (nd.indexOf(kind) >= 0 && !OWNS[c.tier].has(kind)) { r.census[c.tier][kind]++; r.census[c.tier].names[nm] = (r.census[c.tier].names[nm] || 0) + 1; }
        }
      }
      for (const s of cell.day.sections || []) {
        if ((s.label || '') !== SECTION) continue;
        r.secTotal++;
        let hasH = false;
        for (const i of s.items || []) {
          if (!i || i.name == null) continue;
          const nm = String(i.name).trim();
          if (HARVESTED.indexOf(nm) >= 0) hasH = true;
          if (/^wall sit$/i.test(nm)) { r.wallInSection++; if (!DOSE.test(String(i.detail || ''))) r.wallBadDose++; }
          if (c.tier === 'bodyweight' || c.tier === 'travel_room_only') r.bwNames[nm] = (r.bwNames[nm] || 0) + 1;
        }
        if (hasH) r.secWithHarvest++;
      }
    }
  }
  return r;
}

// ── D84: Calves is pushed before Leg isolation ──────────────────────────────────────────────────────────────────
const CALF_PUSH = "        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO_PUSH = "        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
/** The app with the two pushes in the order before D84 (Leg isolation first). */
const isoFirst = () => variant('leg-isolation-pushed-first', [[CALF_PUSH + ISO_PUSH, ISO_PUSH + CALF_PUSH]]);
// The comparison lattice: every tier and four injury states (D84 must hold where a protected knee or low back bites).
// 6 tiers x 2 foci x 2 experiences x 3 goals x 4 injury states x 3 rests x 2 seeds = 1,728 configs.
const E_TIERS: Equipment[] = ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'];
const E_FOCUS: LiftingFocus[] = ['hypertrophy', 'balanced'];
const E_EXPS: Experience[] = ['beginner', 'advanced'];
interface EGoal { k: string; id: CardioGoalId | null }
interface EInjury { k: string; v: { region: string; tier: 'protect' } | null }
interface ERest { k: string; v: DayKey[] }
const E_GOALS: EGoal[] = [{ k: 'liftonly', id: null }, { k: 'pace', id: 'run_pace_goal' }, { k: 'half', id: 'run_half' }];
const E_INJ: EInjury[] = [{ k: 'healthy', v: null }, { k: 'shoulder/protect', v: { region: 'shoulder', tier: 'protect' } },
  { k: 'lowback/protect', v: { region: 'lowback', tier: 'protect' } }, { k: 'knee/protect', v: { region: 'knee', tier: 'protect' } }];
const E_RESTS: ERest[] = [{ k: 'sun', v: ['sun'] }, { k: 'sun+wed', v: ['sun', 'wed'] }, { k: 'sat+sun', v: ['sat', 'sun'] }];
const E_SEEDS = [1013, 3039];
function eCfg(tier: Equipment, focus: LiftingFocus, exp: Experience, g: EGoal, inj: EInjury, rest: ERest, seed: number): Cfg {
  const isRace = !!g.id && /5k|10k|half|marathon/.test(g.id);
  return {
    name: 'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift', cardioTypes: g.id ? ['run'] : [],
    cardioGoals: g.id ? { run: { id: g.id, label: g.k, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi', targetDist: '1.5', targetMins: '11', targetSecs: '0' } } : {},
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null, liftingFocus: focus, experience: exp, ageBracket: '18-35',
    equipment: tier, unit: 'lbs', restDays: rest.v.slice(), days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    bench: 135, squat: 155, deadlift: 185, seed, ...(inj.v ? { injury: { region: inj.v.region, tier: inj.v.tier } } : {}),
  };
}
/** One config of the trim lattice, with its tier and injury state. */
interface TrimRow { key: string; tier: Equipment; inj: string; cfg: Cfg }
function trimLattice(): TrimRow[] {
  const out: TrimRow[] = [];
  for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS) for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS) {
    out.push({ key: `${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`, tier: t, inj: i.k, cfg: eCfg(t, f, x, g, i, r, sd) });
  }
  return out;
}
// Posterior chain by name, the shipped lens {hinge, hip_ext}: leg_iso is a slot, not a muscle (it carries leg
// extensions and leg presses), so a leg isolation item is never posterior signal.
const E_PAT: [string, RegExp][] = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext', /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso', /leg curl|leg extension|hamstring curl/i],
  ['hinge', /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = (n: unknown): string | null => { const t = String(n || ''); for (const [p, r] of E_PAT) if (r.test(t)) return p; return null; };
const E_POSTERIOR = new Set(['hinge', 'hip_ext']);
/** One trained day as eScan reads it: its section labels, its item names, and each item's name and detail. */
interface ECell { labels: string[]; names: string[]; items: { n: string; d: string }[] }
const eLegCell = (o: ECell): boolean => o.labels.indexOf('Calves') >= 0 || o.labels.indexOf('Leg isolation') >= 0;
/** A leg cell (either leg accessory label) with no name that reads as hinge or hip extension. */
const eZeroP = (o: ECell): boolean => eLegCell(o) && !o.names.some((n) => E_POSTERIOR.has(ePat(n) ?? ''));
// The budget's cost rule by hand: stretch is free, holds and carries are half, everything else its set count, and a
// detail with no N× reads as three.
const eSets = (d: unknown): number => { const m = String(d || '').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1], 10)) : 3; };
const eStretch = (n: string): boolean => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n || '');
const eHalf = (n: string): boolean => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n || '');
const eCost = (cell: ECell): number => cell.items.reduce((a, it) => a + (eStretch(it.n) ? 0 : eHalf(it.n) ? eSets(it.d) * 0.5 : eSets(it.d)), 0);
/** Hand: hsets is 4 for an advanced athlete and 3 otherwise, so one Calves item costs at most 4 sets. */
const CALF_SLOT_MAX = 4;
const CAP = 20;
function eScan(X: App, cfg: Cfg): Record<string, ECell> {
  const p = X.buildProgram(clone(cfg)), out: Record<string, ECell> = {}, W = p.weeks || {};
  Object.keys(W).forEach((w) => (Object.keys(W[w]!) as DayKey[]).forEach((d) => {
    const day = W[w]![d];
    if (!day || day.rest) return;
    const labels: string[] = [], names: string[] = [], items: ECell['items'] = [];
    (day.sections || []).forEach((sec) => { labels.push(String(sec.label || '')); (sec.items || []).forEach((it) => { const n = String((it && it.name) || ''); names.push(n); items.push({ n, d: String((it && it.detail) || '') }); }); });
    out[w + '/' + d] = { labels, names, items };
  }));
  return out;
}
/**
 * Every config built on the app (A, Calves pushed first) and on the app with the pushes swapped back (B): where Calves
 * falls or rises, which labels move, what the changed cells cost, which cells sit over the cap, and which leg cells
 * carry no posterior chain (caused by the order, or present either way).
 */
/** What trimCompare finds between the two orders. */
interface TrimCompare {
  configs: number; cells: number; changed: number; fell: string[]; rose: number; threw: string[]; costOut: string[]; costDown: string[];
  costMax: number; overA: number; overUnchanged: number; overIntroduced: number; zeroAllCells: number;
  labelDelta: Record<string, number>; zeroNew: Record<string, number>; zeroAll: Record<string, number>;
  inj: Record<string, 1>; tiers: Record<string, 1>;
}
function trimCompare(rows: TrimRow[]): TrimCompare {
  const A = page(), B = page(isoFirst());
  const r: TrimCompare = { configs: 0, cells: 0, changed: 0, fell: [], rose: 0, threw: [], costOut: [], costDown: [], costMax: -Infinity, overA: 0, overUnchanged: 0, overIntroduced: 0,
    zeroAllCells: 0, labelDelta: {}, zeroNew: {}, zeroAll: {}, inj: {}, tiers: {} };
  for (const c of rows) {
    let a: Record<string, ECell>, b: Record<string, ECell>;
    try { a = eScan(A, c.cfg); b = eScan(B, c.cfg); } catch (e) { r.threw.push(c.key + ': ' + (e as Error).message); continue; }
    r.configs++; r.inj[c.inj] = 1; r.tiers[c.tier] = 1;
    for (const dk of Object.keys(a)) {
      const A1 = a[dk], B1 = b[dk];
      if (!B1) continue;
      r.cells++;
      const has = (o: ECell, l: string): boolean => o.labels.indexOf(l) >= 0;
      if (!has(A1, 'Calves') && has(B1, 'Calves')) r.fell.push(c.key + ' ' + dk);
      if (has(A1, 'Calves') && !has(B1, 'Calves')) r.rose++;
      const same = A1.labels.join('|') === B1.labels.join('|') && A1.names.join('|') === B1.names.join('|');
      const ca = eCost(A1), cb = eCost(B1);
      if (ca > CAP) { r.overA++; if (same) r.overUnchanged++; else if (cb <= CAP) r.overIntroduced++; }
      if (eZeroP(A1)) { r.zeroAllCells++; r.zeroAll[c.key] = (r.zeroAll[c.key] || 0) + 1; }
      if (same) continue;
      r.changed++;
      const la: Record<string, number> = {}, lb: Record<string, number> = {};
      A1.labels.forEach((l) => (la[l] = (la[l] || 0) + 1));
      B1.labels.forEach((l) => (lb[l] = (lb[l] || 0) + 1));
      new Set(Object.keys(la).concat(Object.keys(lb))).forEach((l) => { const d = (la[l] || 0) - (lb[l] || 0); if (d) r.labelDelta[l] = (r.labelDelta[l] || 0) + d; });
      const dc = ca - cb;
      if (dc > CALF_SLOT_MAX) r.costOut.push(c.key + ' ' + dk + ' Δ' + dc);
      if (dc < 0) r.costDown.push(c.key + ' ' + dk + ' Δ' + dc);
      if (dc > r.costMax) r.costMax = dc;
      if (eZeroP(A1) && !eZeroP(B1)) r.zeroNew[c.key] = (r.zeroNew[c.key] || 0) + 1;
    }
  }
  return r;
}

export {
  clone, clean, page, variant, appHtml, countIn, NEEDS, needs, OWNS, TIERS, TIERS_PLUS, HARVESTED, EXCLUDED, MACHINES, HOLD_DOSE_SEC,
  SECTION, LEG_WORDS, FOCUSES, EXPS, SEEDS, RESTS, GOALS, mkCfg, lattice, fullLattice, trainingDays, legSweep,
  CALF_PUSH, ISO_PUSH, isoFirst, trimLattice, ePat, eZeroP, eCost, CALF_SLOT_MAX, CAP, eScan, trimCompare,
};