// Helpers for the duplicate-movement tests: one card, one movement (tests/integration/duplicate-movements.test.ts,
// tests/sweeps/duplicate-movements.test.ts), and the source-surgery loader the adjacent-day dedupe and equipment-tier
// tests share. Rulings: D52 slice 5 (one card, one movement), D159, D164, D165, D166 (the draw-site twins), D198 (the
// full-lower hip-extension pick never repeats the day's hinge).
//
// Every lattice here is config input typed by hand with cfg.seed pinned. Every oracle is a hand table, a typed card,
// or a counterfactual copy of the app with one ruled line written out; none asks the engine what a card should be.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP, fixtures, loadApp } from './app.ts';
import type { DayKey } from '@ia/core';
import type { App } from './app.ts';

/** A config as these tests write it, built by the app: untyped app input. */
export type CfgRec = Record<string, any>;
/** A program, day, section or item as the app builds it: untyped app data. */
export type AppData = any;

/** The weekdays in the harness's order (Sunday first). */
export const DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** The weekdays in the order a week renders (Monday first). */
export const ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ── shared plumbing ─────────────────────────────────────────────────────────────────────────────────────────────
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));
export const clean = (n: unknown): string => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
export const count = (text: string, s: string): number => text.split(s).length - 1;
/** The app under test as text (IA_APP or the repo's index.html). */
export const appText = (): string => readFileSync(APP, 'utf8');

/** Replaces `from` with `to` in `text`; `from` must occur exactly once, or the copy is not the one the test means. */
export function replaceOnce(text: string, from: string, to: string, what?: string): string {
  const n = count(text, from);
  if (n !== 1) throw new Error((what || 'surgery') + ': the anchor occurs ' + n + ' times (want 1): ' + JSON.stringify(from.slice(0, 80)));
  return text.replace(from, () => to);
}

/** Boots a copy of the app from its text (the harness reads a file, so the copy lives in a temp folder only while it loads). */
export function loadText(html: string, tag?: string): App {
  const dir = mkdtempSync(join(tmpdir(), 'ia-feature-'));
  const file = join(dir, (tag || 'copy') + '.html');
  writeFileSync(file, html);
  try {
    return loadApp({ file });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Pins `new Date()` and `Date.now()` inside a booted app to a local date and time. */
export function pinDate(IA: App, at: string): App {
  const t = new Date(at).getTime();
  const Real = Date;
  class Pinned extends Real {
    constructor(...a: unknown[]) {
      if (a.length) super(...(a as [string | number]));
      else super(t);
    }
    static override now(): number {
      return t;
    }
  }
  IA.ctx['Date'] = Pinned;
  return IA;
}

/**
 * The movement-pattern lens, FROZEN as it shipped on V218 (and unchanged through V230): an independent classifier the
 * tests read instead of the live _pattern, so a change to the app's lens can never move the oracle with it.
 */
export function frozenPattern(name: string | null | undefined): string | null {
  const N = (name || '').toLowerCase();
  if (/wall sit|spanish squat|terminal knee/.test(N)) return null;
  if (/l-sit chin|l-sit pull/.test(N)) return 'vpull';
  if (/^landmine rotational press$/.test(N)) return 'hpress';
  if (/plank|pallof|dead bug|ab wheel|bird dog|l-sit|hanging|hollow|rotation|curl-up/.test(N)) return null;
  if (/wrist|forearm|grip squeeze|scapular|serratus/.test(N)) return null;
  if (/renegade|hip airplane|hip flexion|tibialis|dorsiflex|soleus raise|ankle car|90\/90/.test(N)) return null;
  if (/wall slide|y-t-w/.test(N)) return 'delt_iso';
  if (/handstand|wall walk/.test(N)) return 'vpress';
  if (/incline/.test(N) && /push-?up/.test(N)) return 'hpress';
  if (/incline|overhead|arnold|pike|push press|shoulder press|military/.test(N) && /press|pushup/.test(N)) return 'vpress';
  if (/\bsingle-?arm press\b|^kettlebell press$|\blog press\b/.test(N)) return 'vpress';
  if (/lateral raise|front raise|rear delt|face pull|reverse fly/.test(N)) return 'delt_iso';
  if (/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-through|pull through/.test(N)) return 'hip_ext';
  if (/leg press/.test(N)) return 'squat';
  if (/leg curl|leg extension|hamstring curl/.test(N)) return 'leg_iso';
  if (/bench|chest press|flat press|decline press|dip|diamond|pushup/.test(N)) return 'hpress';
  if (/press/.test(N)) return 'hpress';
  if (/tricep|pushdown|skullcrush|extension/.test(N) && !/leg/.test(N)) return 'tri_iso';
  if (/pulldown|straight-arm/.test(N)) return 'vpull';
  if (/row/.test(N)) return 'row';
  if (/chinup|pullup|pull-up|chin-up|lat pull/.test(N)) return 'vpull';
  if (/curl/.test(N)) return 'bi_iso';
  if (/back squat|front squat|box squat|hack squat|leg press|goblet squat/.test(N)) return 'squat';
  if (/deadlift|romanian|good morning|swing|hinge/.test(N)) return 'hinge';
  if (/lunge|split squat|step-up|step up/.test(N)) return 'lunge';
  if (/leg extension|leg curl|leg iso/.test(N)) return 'leg_iso';
  if (/calf|calves/.test(N)) return 'calf_iso';
  if (/squat/.test(N)) return 'squat';
  return null;
}

// ══ one card, one movement (D52 slice 5) ═══════════════════════════════════════════════════════════════════════
/** What a tier owns, for the lowback/protect row slot. load = something to hang off a belt. */
export interface RowTier {
  load: boolean;
  barbell: boolean;
  cables: boolean;
}
// O4: what each tier owns, hand typed.
export const TIERS: Record<string, RowTier> = {
  bodyweight: { load: false, barbell: false, cables: false },
  minimal: { load: true, barbell: false, cables: false },
  home_basic: { load: true, barbell: false, cables: false },
  home_full: { load: true, barbell: true, cables: false },
  commercial: { load: true, barbell: true, cables: true },
  crossfit: { load: true, barbell: true, cables: false },
};
export const EQUIP = Object.keys(TIERS);
// The cable-free vertical pulls the lowback/protect row slot may offer, and what each needs.
export const VPULL: { name: string; need: 'load' | null }[] = [
  { name: 'Assisted pullups', need: null },
  { name: 'Neutral-grip chinups', need: null },
  { name: 'Chinups', need: null },
  { name: 'Weighted chinups', need: 'load' },
];
const tierOf = (e: string): RowTier => {
  const t = TIERS[e];
  if (!t) throw new Error('no hand row for tier ' + e);
  return t;
};
export const LB_ROWPOOL = (e: string): string[] =>
  tierOf(e).cables ? ['Straight-arm pulldown'] : VPULL.filter((m) => m.need === null || tierOf(e)[m.need]).map((m) => m.name);

const SAMECARD_INJ = [
  { tag: 'healthy', injury: null },
  { tag: 'shoulder/protect', injury: { region: 'shoulder', tier: 'protect' } },
  { tag: 'lowback/protect', injury: { region: 'lowback', tier: 'protect' } },
  { tag: 'elbow/protect', injury: { region: 'elbow', tier: 'protect' } },
  { tag: 'knee/protect', injury: { region: 'knee', tier: 'protect' } },
  { tag: 'hip/workaround', injury: { region: 'hip', tier: 'workaround' } },
  { tag: 'ankle/workaround', injury: { region: 'ankle', tier: 'workaround' } },
  { tag: 'lowback/workaround', injury: { region: 'lowback', tier: 'workaround' } },
];
/** One cell of the same-card lattice. */
export interface SamecardCell {
  inj: string;
  equipment: string;
  liftingFocus: string;
  experience: string;
  seed: number;
  cfg: CfgRec;
}
/** The same-card lattice: 8 injury paths x 6 tiers x 2 foci x 3 experience levels x the given seeds (864 with three). */
export function samecardLattice(seeds: number[]): SamecardCell[] {
  const out: SamecardCell[] = [];
  for (const inj of SAMECARD_INJ)
    for (const equipment of EQUIP)
      for (const liftingFocus of ['support_prevention', 'hypertrophy'])
        for (const experience of ['beginner', 'intermediate', 'advanced'])
          for (const seed of seeds)
            out.push({ inj: inj.tag, equipment, liftingFocus, experience, seed,
              cfg: Object.assign({}, fixtures.HALF_MANNY, { equipment, seed, liftingFocus, experience, injury: inj.injury }) });
  return out;
}

/** What surveySamecard counts. */
export interface SamecardSurvey {
  builds: number;
  errors: string[];
  days: number;
  dupByName: Record<string, number>;
  mainDupByName: Record<string, number>;
  dupExamples: string[];
  lbPullDays: number;
  lbPullBeyondMain: number;
  lbRowSlots: number;
  lbRowOffTable: string[];
  lbRowEqualsMain: number;
  carryFinishers: number;
  deltFinishers: number;
  accessories: number;
  chestKnees: number;
  mainOnlyPush: string[];
}
/** Walks every training card of every build and counts what the one-card-one-movement claims read. */
export function surveySamecard(IA: App, cells: SamecardCell[]): SamecardSurvey {
  const S: SamecardSurvey = { builds: 0, errors: [], days: 0, dupByName: {}, mainDupByName: {}, dupExamples: [],
    lbPullDays: 0, lbPullBeyondMain: 0, lbRowSlots: 0, lbRowOffTable: [], lbRowEqualsMain: 0,
    carryFinishers: 0, deltFinishers: 0, accessories: 0, chestKnees: 0, mainOnlyPush: [] };
  for (const c of cells) {
    let prog: AppData;
    try {
      prog = IA.buildProgram(c.cfg);
      S.builds++;
    } catch (e) {
      S.errors.push(c.inj + ' ' + c.equipment + ' ' + c.seed + ': ' + (e as Error).message);
      continue;
    }
    const tag = c.inj + ' ' + c.equipment + ' ' + c.liftingFocus + ' ' + c.experience + ' seed=' + c.seed;
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS) {
        const day = prog.weeks[wk][d];
        if (!day || day.rest) continue;
        const secs: AppData[] = (day.sections || []).filter((s: AppData) => s && (s.items || []).length);
        if (!secs.length) continue;
        S.days++;
        const where: Record<string, string[]> = {};
        for (const s of secs) {
          const lbl = clean(s.label) || clean(s.coreHeader) || '(unlabelled)';
          for (const it of s.items || []) {
            const n = it && clean(it.name);
            if (n) (where[n] = where[n] || []).push(lbl);
          }
        }
        for (const [n, labels] of Object.entries(where)) {
          if (labels.length < 2) continue;
          S.dupByName[n] = (S.dupByName[n] || 0) + 1;
          if (labels.some((l) => /^Main —/.test(l))) S.mainDupByName[n] = (S.mainDupByName[n] || 0) + 1;
          if (S.dupExamples.length < 4) S.dupExamples.push(tag + ' W' + wk + ' ' + d + ' ' + n + ' in ' + labels.join(' + '));
        }
        const mainSec = secs.find((s) => /^Main —/.test(clean(s.label)));
        const mainName = mainSec ? clean((mainSec.items[0] || {}).name) : null;
        if (c.inj === 'lowback/protect' && secs.some((s) => /^Pull superset/.test(clean(s.label)))) {
          const table = LB_ROWPOOL(c.equipment);
          for (const s of secs.filter((x) => /^Pull superset A|^Pull superset B/.test(clean(x.label)))) {
            const a = clean((s.items[0] || {}).name);
            if (!a) continue;
            S.lbRowSlots++;
            if (VPULL.some((m) => m.name === a) && !table.includes(a)) S.lbRowOffTable.push(tag + ' W' + wk + ' ' + d + ' drew ' + a);
            if (mainName && a === mainName) S.lbRowEqualsMain++;
          }
        }
        if (c.inj === 'lowback/protect' && mainSec && /chinup|pullup|pulldown/i.test(mainName || '')) {
          S.lbPullDays++;
          if (secs.some((s) => !/^Main —/.test(clean(s.label)) && (s.items || []).some((it: AppData) => it && it.name))) S.lbPullBeyondMain++;
        }
        const labs = secs.map((s) => clean(s.label));
        if (labs.some((l) => /^Loaded carry finisher/.test(l))) S.carryFinishers++;
        if (labs.includes('Delt finisher')) S.deltFinishers++;
        if (labs.some((l) => l === 'Accessory' || l === 'Pump')) S.accessories++;
        if (labs.includes('Chest + knee')) S.chestKnees++;
        if (mainName && /press|pushup|dips/i.test(mainName)) {
          const others = secs.filter((s) => !/^Main —/.test(clean(s.label)) && !s.core && !s.optional);
          if (!others.length) S.mainOnlyPush.push(tag + ' W' + wk + ' ' + d + ' main ' + mainName);
        }
      }
  }
  return S;
}

// ══ the draw-site twins (D159, D164, D165, D166) on the WIDE lattice ═════════════════════════════════════════════
const W_GOALS: [string, Record<string, string>][] = [['run_5k', {}], ['run_half', {}], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '0' }], ['run_base', {}], ['run_10k', {}], ['run_marathon', {}]];
const W_FOC = ['hypertrophy', 'strength', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const W_EXPS = ['beginner', 'intermediate', 'advanced'], W_AGES = ['18-35', '36-54', '55+'], W_RESTS = [['sun', 'wed'], ['sat', 'sun']];
const W_SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const W_TIERS = ['commercial', 'crossfit', 'home_full', 'home_basic', 'minimal', 'bodyweight'];
const at = <T>(a: T[], i: number): T => {
  const v = a[i % a.length];
  if (v === undefined) throw new Error('empty table');
  return v;
};
function wideCfg(eq: string, gi: number, f: string, exp: string, age: string, si: number, inj: CfgRec | null): CfgRec {
  const [g, x] = at(W_GOALS, gi);
  const c: CfgRec = { name: 'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: ['run'],
    cardioGoals: { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, x) },
    eventTargeted: false, liftingFocus: f, experience: exp, ageBracket: age, equipment: eq, unit: 'lbs',
    restDays: at(W_RESTS, si).slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: at(W_SEEDS, si) };
  if (inj) c['injury'] = inj;
  return c;
}
/** One cell of the WIDE lattice. */
export interface WideCell {
  eq: string;
  ik: string;
  f: string;
  c: CfgRec;
}
/** The WIDE lattice: 6 tiers x 13 injury paths x 7 foci x 3 experience levels x 4 seeds x 2 rest patterns (13,104). */
export function wideLattice(): WideCell[] {
  const INJ: (CfgRec | null)[] = [null];
  for (const r of ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle']) for (const t of ['workaround', 'protect']) INJ.push({ region: r, tier: t });
  const U: WideCell[] = [];
  for (const eq of W_TIERS)
    INJ.forEach((inj, ii) => W_FOC.forEach((f, fi) => W_EXPS.forEach((e, ei) => [0, 1, 2, 3].forEach((si) => [0, 1].forEach((ri) => {
      const c = wideCfg(eq, ii + fi + ei + si, f, e, at(W_AGES, fi + si), si, inj);
      c['restDays'] = at(W_RESTS, ri).slice();
      U.push({ eq, ik: inj ? inj['region'] + '/' + inj['tier'] : 'healthy', f, c });
    })))));
  return U;
}
const stem = (s: AppData): string => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
/** The sections of a training day that print at least one item. */
export const live = (d: AppData): AppData[] => ((d && !d.rest && d.sections) || []).filter((s: AppData) => (s.items || []).length);
const CHEST = /press|pushup|dips|crossover|pec deck|fly/i;
/** What cardInfo reads off one card. */
export interface CardInfo {
  live: boolean;
  dup: [string, string][];
  li: number;
  c165: number;
  c166: number;
  ck: number;
  ckNo: number;
}
/** What one card holds that the twin rulings read: names on 2+ items, and the four ruled twin classes. */
export function cardInfo(day: AppData): CardInfo {
  const L = live(day);
  const o: CardInfo = { live: L.length > 0, dup: [], li: 0, c165: 0, c166: 0, ck: 0, ckNo: 0 };
  if (!L.length) return o;
  const where: Record<string, string[]> = {};
  L.forEach((s) => s.items.forEach((it: AppData) => { const k = clean(it.name).toLowerCase(); if (k) (where[k] = where[k] || []).push(stem(s)); }));
  o.dup = Object.entries(where).filter(([, v]) => v.length >= 2).map(([k, v]) => [k, v.slice().sort().join(' + ')]);
  const times = (n: AppData): number => (where[clean(n).toLowerCase()] || []).length;
  if (L.some((s) => /^Leg isolation/.test(String(s.label || '')) && s.items.some((i: AppData) => times(i.name) >= 2))) o.li = 1;
  const main = L.find((s) => stem(s) === 'Main');
  const mn = main ? clean(main.items[0].name).toLowerCase() : null;
  if (mn) {
    if (L.some((s) => /^(Leg superset A|Leg circuit)$/.test(stem(s)) && s.items.some((i: AppData) => clean(i.name).toLowerCase() === mn))) o.c165 = 1;
    if (L.some((s) => stem(s) === 'Pull superset B' && s.items.some((i: AppData) => clean(i.name).toLowerCase() === mn))) o.c166 = 1;
  }
  L.forEach((s) => { if (/^Chest \+ knee/.test(String(s.label || ''))) { o.ck++; if (!s.items.some((i: AppData) => CHEST.test(clean(i.name)))) o.ckNo++; } });
  return o;
}
// D164 slice 1: the shoulder/workaround swap target, hand typed (lower case, as the twin keys are).
const SWAP_TARGET: Record<string, Set<string>> = { 'shoulder/workaround': new Set(['dumbbell floor press']) };
/** What surveyDraws counts. */
export interface DrawSurvey {
  n: number;
  crash: string[];
  dup: number;
  li: number;
  tgt: number;
  ck: number;
  ckNo: number;
  bic1: number;
  c165: number;
  c166: number;
  nCK: number;
  nEW: number;
  dupEx: string[];
}
/** Counts every twin class over the given WIDE cells. */
export function surveyDraws(IA: App, cells: WideCell[]): DrawSurvey {
  const T: DrawSurvey = { n: 0, crash: [], dup: 0, li: 0, tgt: 0, ck: 0, ckNo: 0, bic1: 0, c165: 0, c166: 0, nCK: 0, nEW: 0, dupEx: [] };
  for (const x of cells) {
    T.n++;
    if (x.ik === 'shoulder/workaround') T.nCK++;
    if (x.ik === 'elbow/workaround') T.nEW++;
    let P: AppData;
    try {
      P = IA.buildProgram(clone(x.c));
    } catch (e) {
      T.crash.push(x.eq + ' ' + x.ik + ' ' + x.f + ': ' + (e as Error).message);
      continue;
    }
    for (const w of Object.keys(P.weeks))
      for (const d of DAYS) {
        if (!P.weeks[w] || P.weeks[w][d] === undefined) continue;
        const y = P.weeks[w][d], c = cardInfo(y);
        if (x.ik === 'elbow/workaround') { const b = live(y).find((z) => z.label === 'Biceps'); if (b && b.items.length === 1) T.bic1++; }
        if (!c.live) continue;
        if (c.dup.length) { T.dup++; if (T.dupEx.length < 3) T.dupEx.push(x.eq + ' ' + x.ik + ' ' + x.f + ' W' + w + ' ' + d + ' ' + c.dup.map((z) => z.join(' @ ')).join('; ')); }
        if (c.li) T.li++;
        const tgt = SWAP_TARGET[x.ik];
        if (tgt && c.dup.some(([n]) => tgt.has(n))) T.tgt++;
        if (x.ik === 'shoulder/workaround' && c.ck) { T.ck += c.ck; T.ckNo += c.ckNo; }
        if (c.c165) T.c165++;
        if (c.c166) T.c166++;
      }
  }
  return T;
}
/** The D164 repro: commercial, shoulder/workaround, hypertrophy, beginner, 55+, seed 4242, rest sun/wed. */
export const isD164Repro = (x: WideCell): boolean => x.eq === 'commercial' && x.ik === 'shoulder/workaround' && x.f === 'hypertrophy' && x.c['experience'] === 'beginner' && x.c['seed'] === 4242 && x.c['restDays'].join('/') === 'sun/wed';

// ══ D198: the full-lower hip-extension pick never repeats the day's hinge ═══════════════════════════════════════
export const HEP_CLOCK = '2026-08-24T12:00:00';
export const D198_LINE = "const _lhe0=pick(hipExtBW,1,blockSeed(w)+20)[0];const lowerHipExt=(_lhe0===lowerHinge)?(pick(hipExtBW.filter(x=>x!==lowerHinge),1,blockSeed(w)+20)[0]||_lhe0):_lhe0;";
export const PRE_D198_LINE = 'const lowerHipExt=pick(hipExtBW,1,blockSeed(w)+20)[0];';
export const HIPEXT_LITERAL = "const hipExtBW=_bw(['Single-leg hip thrust (shoulders on bed)','Single-leg glute bridge','Nordic hamstring curl (anchored)','Bodyweight back extension'],['Single-leg hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension','Banded hip thrust']);";
export const HIPEXT_BW = ['Single-leg hip thrust (shoulders on bed)', 'Single-leg glute bridge', 'Nordic hamstring curl (anchored)', 'Bodyweight back extension'];
export const HIPEXT_LOADED = ['Single-leg hip thrust', 'Single-leg glute bridge (weighted)', 'Nordic hamstring curl (anchored)', 'Bodyweight back extension', 'Banded hip thrust'];
export const hipExtFor = (eq: string): string[] => (eq === 'bodyweight' ? HIPEXT_BW : HIPEXT_LOADED);
export const LS = 'Lower strength', HEP = 'Hip extension + push';
export const SLHT = 'Single-leg hip thrust', BRIDGE = 'Single-leg glute bridge', BED = 'Single-leg hip thrust (shoulders on bed)';

/** One `sun` cell of the deload lattice. */
export interface HepCell {
  key: string;
  cfg: CfgRec;
}
/** The deload-arbitration lattice's `sun` rest cells (576): the only cells that build a full-lower day. */
export function hepLattice(): HepCell[] {
  const out: HepCell[] = [];
  for (const t of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'])
    for (const f of ['hypertrophy', 'balanced'])
      for (const x of ['beginner', 'advanced'])
        for (const g of [{ k: 'liftonly', id: null }, { k: 'pace', id: 'run_pace_goal' }, { k: 'half', id: 'run_half' }])
          for (const i of [{ k: 'healthy', v: null }, { k: 'shoulder/protect', v: { region: 'shoulder', tier: 'protect' } },
            { k: 'lowback/protect', v: { region: 'lowback', tier: 'protect' } }, { k: 'knee/protect', v: { region: 'knee', tier: 'protect' } }])
            for (const seed of [1013, 3039]) {
              const isRace = !!g.id && /5k|10k|half|marathon/.test(g.id);
              const cfg: CfgRec = { name: 'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift', cardioTypes: g.id ? ['run'] : [],
                cardioGoals: g.id ? { run: { id: g.id, label: g.k, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi', targetDist: '1.5', targetMins: '11', targetSecs: '0' } } : {},
                eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null, liftingFocus: f, experience: x, ageBracket: '18-35', equipment: t,
                unit: 'lbs', restDays: ['sun'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185, seed };
              if (i.v) cfg['injury'] = { region: i.v.region, tier: i.v.tier };
              out.push({ key: [t, f, x, g.k, i.k, 'sun', seed].join('|'), cfg });
            }
  return out;
}
/** The app with the clock pinned to the D198 measure's clock, and the same app with the D198 line put back to the plain pick. */
export function hepTrees(): { text: string; cand: App; pre: App } {
  const text = appText();
  const cand = pinDate(loadText(text, 'cand'), HEP_CLOCK);
  const pre = pinDate(loadText(replaceOnce(text, D198_LINE, PRE_D198_LINE, 'the D198 line'), 'pre-d198'), HEP_CLOCK);
  return { text, cand, pre };
}
/** A named section of a training day that prints at least one item, or null. */
export const liveSec = (p: AppData, w: string, d: string, lab: string): AppData => {
  const dy = p && p.weeks && p.weeks[w] && p.weeks[w][d];
  return ((dy && !dy.rest && dy.sections) || []).find((s: AppData) => clean(s && s.label) === lab && (s.items || []).length) || null;
};
export const namesOf = (s: AppData): string[] => (s ? (s.items || []).map((i: AppData) => clean(i && i.name)) : []);
/** One section in the D198 measure's card format: label, ` (SS n)` for a superset, ` :: `, `name detail` joined by ` | `. */
export const cardOf = (s: AppData): string => (s ? clean(s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: ' + (s.items || []).map((it: AppData) => clean(it.name) + ' ' + clean(it.detail || '')).join(' | ') : '(absent)');
/** The hinge of a full-lower day: the second item of a two-item Lower strength (a lone item is taken as the hinge). */
export const hingeOf = (ln: string[]): string => (ln.length === 2 ? ln[1] : ln[ln.length - 1]) ?? '';
/** One full-lower day the D198 survey flags. */
export interface HepDay {
  key: string;
  eq: string;
  inj: string;
  w: string;
  d: string;
  hinge?: string;
}
/** What surveyHep reads off the cells. */
export interface HepSurvey {
  progs: Record<string, AppData>;
  hepDays: number;
  doubled: HepDay[];
  oneItem: HepDay[];
}
/** Every full-lower day of every cell: the hinge-slot repeats and the one-item hip-extension days with a hipExtBW hinge. */
export function surveyHep(IA: App, cells: HepCell[]): HepSurvey {
  const S: HepSurvey = { progs: {}, hepDays: 0, doubled: [], oneItem: [] };
  for (const cell of cells) {
    const p = IA.buildProgram(clone(cell.cfg));
    S.progs[cell.key] = p;
    for (const w of Object.keys(p.weeks || {}))
      for (const d of ORDER) {
        const ls = liveSec(p, w, d, LS), he = liveSec(p, w, d, HEP);
        if (!ls || !he) continue;
        S.hepDays++;
        const ln = namesOf(ls), hn = namesOf(he);
        const id: HepDay = { key: cell.key, eq: cell.cfg['equipment'], inj: cell.key.split('|')[4] ?? '', w, d };
        if (ln.length === 2 && hn.includes(ln[1] ?? '')) S.doubled.push(id);
        if (he.items.length === 1 && hipExtFor(cell.cfg['equipment']).includes(hingeOf(ln))) S.oneItem.push(Object.assign({ hinge: hingeOf(ln) }, id));
      }
  }
  return S;
}
// The 21 days the pre-D198 tree collapses to a one-item `Hip extension + push` while V230 printed two items there
// (derived once, Post-v0.239.1, from V230's own cards; the ruling's figure is 21 days on 5 programs, all bodyweight
// lowback/protect Saturdays with the bed thrust as the hinge).
export const COLLAPSE_21 = [
  'bodyweight|balanced|beginner|liftonly|lowback/protect|sun|1013 W3 sat', 'bodyweight|balanced|beginner|liftonly|lowback/protect|sun|1013 W4 sat',
  'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W3 sat', 'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W4 sat',
  'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W7 sat', 'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W8 sat',
  'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W9 sat', 'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W10 sat',
  'bodyweight|balanced|beginner|pace|lowback/protect|sun|1013 W11 sat', 'bodyweight|balanced|beginner|pace|lowback/protect|sun|3039 W9 sat',
  'bodyweight|balanced|beginner|pace|lowback/protect|sun|3039 W10 sat', 'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W3 sat',
  'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W4 sat', 'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W7 sat',
  'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W8 sat', 'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W9 sat',
  'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W10 sat', 'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W11 sat',
  'bodyweight|balanced|beginner|half|lowback/protect|sun|1013 W12 sat', 'bodyweight|balanced|beginner|half|lowback/protect|sun|3039 W9 sat',
  'bodyweight|balanced|beginner|half|lowback/protect|sun|3039 W10 sat',
];
/** One of D198's typed cells: the weeks, and the two sections after D198 and on the pre-D198 copy. */
export interface HepCard {
  tag: string;
  key: string;
  at: [string, string][];
  after: string[];
  pre: string[];
}
// D198's typed cards (coach's prints, the measure's card format).
const R7_2 = '2 sets — RPE 7 (leave 3 or more in reserve)';
const R7_4 = '4 sets — RPE 7 (leave 3 or more in reserve)', R8_4 = '4 sets — RPE 8 (stop 2 reps short of failure)';
export const HEP_CARDS: HepCard[] = [
  { tag: 'bodyweight balanced beginner, W3 and W4 Saturday', key: 'bodyweight|balanced|beginner|liftonly|lowback/protect|sun|1013', at: [['3', 'sat'], ['4', 'sat']],
    after: ['Lower strength (SS 2) :: Reverse lunge ' + R7_2 + ' | ' + BED + ' ' + R7_2,
      'Hip extension + push (SS 2) :: ' + BRIDGE + ' ' + R7_2 + ' | Pushups (slow 3s eccentric) ' + R7_2],
    pre: ['Lower strength (SS 2) :: Reverse lunge ' + R7_2 + ' | ' + BED + ' ' + R7_2, 'Hip extension + push :: Pushups (slow 3s eccentric) ' + R7_2] },
  { tag: 'commercial balanced beginner pace, W9 Saturday', key: 'commercial|balanced|beginner|pace|lowback/protect|sun|1013', at: [['9', 'sat']],
    after: ['Lower strength (SS 2) :: Reverse lunge (KB) 2×8–12 each @ RPE 8 | Banded hip thrust ' + R7_2,
      'Hip extension + push (SS 2) :: ' + SLHT + ' 2×10 — hold RPE 7, three in the tank | Diamond pushups ' + R7_2],
    pre: ['Lower strength (SS 2) :: Reverse lunge (KB) 2×8–12 each @ RPE 8 | Banded hip thrust ' + R7_2,
      'Hip extension + push (SS 2) :: Banded hip thrust ' + R7_2 + ' | Diamond pushups ' + R7_2] },
  { tag: 'bodyweight hypertrophy advanced, W1 Saturday', key: 'bodyweight|hypertrophy|advanced|liftonly|lowback/protect|sun|1013', at: [['1', 'sat']],
    after: ['Lower strength (SS 4) :: Bulgarian split squat (foot on chair) ' + R8_4 + ' | ' + BRIDGE + ' ' + R7_4,
      'Hip extension + push (SS 4) :: Nordic hamstring curl (anchored) ' + R7_4 + ' | Pike pushups ' + R7_4],
    pre: ['Lower strength (SS 4) :: Bulgarian split squat (foot on chair) ' + R8_4 + ' | ' + BRIDGE + ' ' + R7_4, 'Hip extension + push :: Pike pushups ' + R7_4] },
];
