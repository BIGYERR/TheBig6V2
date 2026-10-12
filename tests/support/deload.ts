// Hand oracles, the stage recorder and the lattices for the deload tests (tests/integration/deload.test.js and
// tests/sweeps/deload.test.js). D91: recoveryDeload keeps its one accessory block by PATTERN, not by push order. D93 and
// D94: the pull side, where a deload pull day keeps Pull superset A (its vertical pull) because its Main is already a
// deadlift variant.
//
// ORACLES. "Posterior chain" is the hand table E_PAT, typed from the doctrine movement names and proved by a blindness
// probe; the engine's _isPostChain is never the oracle. The engine's _pattern is read for one narrow thing, whether a
// section is an accessory CANDIDATE at all (the deload loop's own four tests, re-run here from the ruling text by
// cls()). Outcomes are read off the stage snapshots and the shipped card.
//
// THE STAGES. buildProgram assembles each lifting day in one statement: p1 = applyInjuryFilter(buildSections(...)),
// p2 = recoveryDeload(p1) on a recovery week (p1 otherwise), p3 = capRegionalFatigue(p2). A copy of the app under test
// (tests/support/app-copy.js) splits that statement in three and records a snapshot of each stage. The copy is inert:
// the integration test proves it builds the same programs as the app.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { CardioGoalId, Cfg, DayKey, Equipment, Experience, Injury, LiftingFocus, Program } from '@ia/core';
import { loadApp } from './app.ts';
import type { App } from './app.ts';
import { appCopy } from './app-copy.ts';
import { updating, SNAPSHOT_DIR } from './snapshot.ts';

// ── hand oracle: posterior chain ────────────────────────────────────────────────────────────────────────────────────
const E_PAT: [string, RegExp][] = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext', /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso', /leg curl|leg extension|hamstring curl/i],
  ['hinge', /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = (n: unknown): string | null => {
  const t = String(n || '');
  for (const [p, r] of E_PAT) if (r.test(t)) return p;
  return null;
};
/** {hinge, hip_ext} and nothing else. */
const isPost = (n: unknown): boolean => ['hinge', 'hip_ext'].includes(ePat(n) ?? '');
/** 17 names, expected column typed from the doctrine names: ten negatives (four pull-side) and seven positives. */
const POST_PROBE: [string, number][] = [['Back squat', 0], ['Leg extension', 0], ['Lying leg curl', 0], ['Leg press', 0],
  ['Dumbbell standing calf raise', 0], ['Wall sit', 0], ['Barbell row', 0], ['Lat pulldown', 0], ['Chin-up', 0], ['Face pull', 0],
  ['Nordic hamstring curl (anchored)', 1], ['Single-leg glute bridge', 1], ['Barbell Romanian deadlift', 1],
  ['45° back extension', 1], ['Kettlebell swing', 1], ['Dumbbell split-stance deadlift', 1], ['Barbell hip thrust', 1]];

// ── hand oracle: vertical pull (bar, ring or rope above the shoulder); rows, face pulls and pullovers are not ──────
const V_PULL = /pull-?down|pull-?up|pullup|chin-?up|chinup|lat prayer|muscle-?up|\bhang(ing)? row\b(?!)|kneeling.*pulldown|straight-?arm pulldown|\bpull-?ups?\b/i;
const isVPull = (n: unknown): boolean => V_PULL.test(String(n || ''));
const VPULL_PROBE: [string, number][] = [['Lat pulldown', 1], ['Neutral-grip pulldown', 1], ['Chinups', 1], ['Pull-ups', 1], ['Assisted pull-up', 1],
  ['Kneeling band pulldown', 1], ['Straight-arm pulldown', 1], ['Barbell row', 0], ['Pendlay row', 0], ['Chest-supported row', 0],
  ['Face pull', 0], ['Dumbbell pullover', 0], ['Inverted row (supinated, under a table)', 0], ['Kettlebell swing', 0]];

// ── the deload loop's four candidacy tests, re-implemented from the ruling text ─────────────────────────────────────
const KMAIN = /^main\b|^primer|^power\b|^strength\b/;
const KPREHAB = /hip|mobility|stretch/;
const KFLUFF = /carry|finisher|conditioning|explosive/;
/**
 * One section as the stage recorder snapshots it (SNAP_FN): its label, its hip and optional flags, its item names and
 * each item's _pattern. The probes below write only the fields the candidacy test reads.
 */
interface SnapSection { l: string; hip?: boolean; opt?: boolean; n?: string[]; p?: (string | null)[] }
/** One lifting day's three stages, as the staged copy records them. */
interface Stage { w: string; d: string; dl: boolean; p1: SnapSection[]; p2: SnapSection[]; p3: SnapSection[] }
type Klass = 'main' | 'prehab' | 'fluff' | 'none' | 'cand';
function cls(s: SnapSection): Klass {
  const L = String(s.l || '').toLowerCase();
  if (KMAIN.test(L)) return 'main';
  if (s.hip || KPREHAB.test(L)) return 'prehab';
  if (s.opt || KFLUFF.test(L)) return 'fluff';
  if (!(s.p || []).some((p) => p)) return 'none';
  return 'cand';
}
/** Hand-typed sections and their class: every one of the four tests both ways, the pull family lands on cand. */
const CLS_PROBE: [SnapSection, Klass][] = [
  [{ l: 'Pull superset A', p: ['pull'] }, 'cand'], [{ l: 'Pull superset B', p: ['pull', 'hinge'] }, 'cand'], [{ l: 'Pull', p: ['hinge'] }, 'cand'],
  [{ l: 'Main strength', p: ['squat'] }, 'main'], [{ l: 'Primer', p: ['power'] }, 'main'], [{ l: 'Power block', p: ['power'] }, 'main'],
  [{ l: 'Strength block', p: ['press'] }, 'main'], [{ l: 'Hip mobility', p: ['hinge'] }, 'prehab'],
  [{ l: 'Pull superset A', hip: true, p: ['pull'] }, 'prehab'], [{ l: 'Explosive finisher', p: ['power'] }, 'fluff'],
  [{ l: 'Loaded carry', p: ['carry'] }, 'fluff'], [{ l: 'Pull superset B', opt: true, p: ['pull'] }, 'fluff'],
  [{ l: 'Pull superset A', p: [null, null] }, 'none'], [{ l: 'Pull superset B', p: [] }, 'none']];

// ── the stage recorder ──────────────────────────────────────────────────────────────────────────────────────────────
const ASSEMBLY = "      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s,cardio):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const ASSEMBLY_STAGED = [
  '      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);',
  '      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1,cardio):__p1;',
  '      var __p3=capRegionalFatigue(__p2,role,cardio,goal);',
  "      if(typeof globalThis!=='undefined'&&globalThis.__STAGES)globalThis.__STAGES.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
  "      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join('\n');
// a section's label, flags, item names and (for the candidacy test only) each item's _pattern
const SNAP_FN = 'globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {'
  + "l:String((s&&s.label)||''),hip:!!(s&&s.hip),opt:!!(s&&s.optional),"
  + "n:it.map(function(i){return String((i&&i.name)||'');}),"
  + 'p:it.map(function(i){var q=null;try{q=_pattern(i&&i.name);}catch(e){q=null;}return q?String(q):null;})};});};';
/** Boots the staged copy of the app under test. stagedBuild(IA, cfg, off) returns { prog, stages }. */
function loadStaged(): App {
  const IA = loadApp({ file: appCopy('deload-stages', [[ASSEMBLY, ASSEMBLY_STAGED]]) });
  IA.eval(SNAP_FN + 'globalThis.__STAGES=null;globalThis.__DELOAD_OFF=false;');
  return IA;
}
function stagedBuild(IA: App, cfg: Cfg, deloadOff: boolean): { prog: Program; stages: Stage[] } {
  IA.eval('globalThis.__STAGES=[];globalThis.__DELOAD_OFF=' + !!deloadOff + ';');
  const prog: Program = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const stages: Stage[] = JSON.parse(JSON.stringify(IA.eval('globalThis.__STAGES')));
  IA.eval('globalThis.__STAGES=null;globalThis.__DELOAD_OFF=false;');
  return { prog, stages };
}

// ── D91's lattice: 6 tiers x 2 foci x 2 experiences x 3 goals x 4 injuries x 3 rest patterns x 2 seeds = 1,728 ────
/** One config of a lattice, keyed. */
interface LatticeRow { key: string; cfg: Cfg }
function deloadLattice(): LatticeRow[] {
  const TIERS: Equipment[] = ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'];
  const GOALS: { k: string; id: CardioGoalId | null }[] = [{ k: 'liftonly', id: null }, { k: 'pace', id: 'run_pace_goal' }, { k: 'half', id: 'run_half' }];
  const INJ: { k: string; v: Injury | null }[] = [{ k: 'healthy', v: null }, { k: 'shoulder/protect', v: { region: 'shoulder', tier: 'protect' } },
    { k: 'lowback/protect', v: { region: 'lowback', tier: 'protect' } }, { k: 'knee/protect', v: { region: 'knee', tier: 'protect' } }];
  const RESTS: { k: string; v: DayKey[] }[] = [{ k: 'sun', v: ['sun'] }, { k: 'sun+wed', v: ['sun', 'wed'] }, { k: 'sat+sun', v: ['sat', 'sun'] }];
  const FOCI: LiftingFocus[] = ['hypertrophy', 'balanced'];
  const EXPS: Experience[] = ['beginner', 'advanced'];
  const out: LatticeRow[] = [];
  for (const t of TIERS) for (const f of FOCI) for (const x of EXPS) for (const g of GOALS)
    for (const i of INJ) for (const r of RESTS) for (const seed of [1013, 3039]) {
      const race = !!g.id && /half/.test(g.id);
      const cfg: Cfg = { name: 'M', primaryPath: g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes: g.id ? ['run'] : [],
        cardioGoals: g.id ? { run: { id: g.id, label: g.k, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi', targetDist: '1.5', targetMins: '11', targetSecs: '0' } } : {},
        eventTargeted: race, raceDate: race ? '2026-12-06' : null, liftingFocus: f, experience: x, ageBracket: '18-35', equipment: t, unit: 'lbs',
        restDays: r.v.slice(), days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185, seed };
      if (i.v) cfg.injury = { ...i.v };
      out.push({ key: [t, f, x, g.k, i.k, r.k, seed].join('|'), cfg });
    }
  return out;
}

// ── D93's mini lattice: 5 tiers (no bodyweight) x balanced x 2 experiences x {half, marathon} x 3 rests x seed 1 = 60 ─
/** One config of the pull lattice, with its tier, experience, goal and rest pattern. */
interface PullRow extends LatticeRow { t: Equipment; x: Experience; g: 'half' | 'marathon'; r: string }
function pullLattice(): PullRow[] {
  const out: PullRow[] = [];
  const GOAL: Record<'half' | 'marathon', CardioGoalId> = { half: 'run_half', marathon: 'run_marathon' };
  const REST: Record<string, DayKey[]> = { sun: ['sun'], 'sun+wed': ['sun', 'wed'], 'sat+sun': ['sat', 'sun'] };
  const TIERS: Equipment[] = ['commercial', 'home_full', 'crossfit', 'home_basic', 'minimal'];
  const EXPS: Experience[] = ['beginner', 'advanced'];
  for (const t of TIERS) for (const x of EXPS)
    for (const g of ['half', 'marathon'] as const) for (const r of ['sun', 'sun+wed', 'sat+sun']) {
      out.push({ key: [t, x, g, r].join('|'), t, x, g, r, cfg: { name: 'M', primaryPath: 'event', cardioTypes: ['run'],
        cardioGoals: { run: { id: GOAL[g], label: g, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi', targetDist: '1.5', targetMins: '11', targetSecs: '0' } },
        eventTargeted: true, raceDate: '2026-12-06', liftingFocus: 'balanced', experience: x, ageBracket: '18-35', equipment: t, unit: 'lbs',
        restDays: REST[r]!.slice(), days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185, seed: 1 } });
    }
  return out;
}

// ── the D91 census over a lattice, both arms (deload on, and the __DELOAD_OFF counterfactual) ──────────────────────
const secPost = (s: SnapSection): number => (s.n || []).reduce((a, n) => a + (isPost(n) ? 1 : 0), 0);
const cardPost = (c: SnapSection[] | undefined): number => (c || []).reduce((a, s) => a + secPost(s), 0);
const hasLab = (c: SnapSection[] | undefined, lab: string): boolean => (c || []).some((s) => s.l === lab && (s.n || []).length);
const sha = (s: string): string => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
/** Counts by key. */
type Tally = Record<string, number>;
const bump = (o: Tally, k: string): void => { o[k] = (o[k] || 0) + 1; };
const LABELS = ['Leg superset A', 'Leg superset B', 'Leg isolation', 'Explosive finisher'];
const PLABELS = ['Pull superset A', 'Pull superset B', 'Pull'];
function blankArm() {
  return { configs: 0, weeks: 0, dayCells: 0, dlDayBuilds: 0, deloadWeeks: 0, nonDeloadWeeks: 0, zeroWeeks: 0, zeroWeeksDeload: 0,
    zeroWeeksNonDeload: 0, postInP1: 0, postOutP2: 0, killedByDeload: 0, killedHeldByFinisher: 0, killedKeepsMain: 0,
    postInP1X: 0, postOutP2X: 0, killedByDeloadX: 0, killHoldX: {} as Tally, tierBDl: 0,
    lblP1: {} as Tally, lblP2: {} as Tally, lblP1all: {} as Tally, lblP2all: {} as Tally, dropped: {} as Tally, droppedPost: {} as Tally, killHold: {} as Tally,
    survCandViol: 0, survCandGt1: 0, trapAny: 0, trapCand: 0, trapNoCand: 0, trapSurvViol: 0, trapNoCandSurvViol: 0,
    trapAnyE: 0, trapCandE: 0, trapNoCandE: 0, trapSurvViolE: 0, trapNoCandSurvViolE: 0,
    swapPop: 0, swapBoth: 0, swapReCap: 0, swapReBudget: 0, swapReBudgetWeekZero: 0, capLSBin: 0, capLSBkilled: 0,
    pullP1all: {} as Tally, pullP2all: {} as Tally, pullBothP1: 0, pullSwapCensus: {} as Tally, orderViol: 0, orderNonVac: 0, legAfterHipViol: 0, trapAndSwap: 0 };
}
/** Runs the D91 census over `lattice` on a staged app. Returns { on, off, wrongWay, endToEnd, dlIdentical, dlTotal, ndIdentical, ndTotal }. */
/** One arm's census (deload on, or the counterfactual off). */
type Arm = ReturnType<typeof blankArm>;
/** What one arm shipped, per week and per day, for the comparison between the arms. */
interface Shipped { wkShip: Tally; wkDeload: Record<string, boolean>; wkSha: Record<string, string>; shipPost: Tally }
interface Census { on: Arm; off: Arm; wrongWay: number; endToEnd: number; ndIdentical: number; ndTotal: number; dlIdentical: number; dlTotal: number }
function deloadCensus(IA: App, lattice: readonly LatticeRow[]): Census {
  const LT = IA.eval("typeof _longRunTier==='function'?_longRunTier:null");
  const R: Census = { on: blankArm(), off: blankArm(), wrongWay: 0, endToEnd: 0, ndIdentical: 0, ndTotal: 0, dlIdentical: 0, dlTotal: 0 };
  for (const L of lattice) {
    const arms: Partial<Record<'on' | 'off', Shipped>> = {};
    for (const m of ['on', 'off'] as const) {
      const { prog, stages } = stagedBuild(IA, L.cfg, m === 'off');
      const S = R[m];
      S.configs++;
      const W = prog.weeks || {};
      const shipPost: Tally = {};
      const wkShip: Tally = {};
      const wkDeload: Record<string, boolean> = {};
      const wkSha: Record<string, string> = {};
      Object.keys(W).forEach((w) => {
        let tot = 0;
        (Object.keys(W[w]!) as DayKey[]).forEach((d) => {
          let n = 0;
          ((W[w]![d] && W[w]![d].sections) || []).forEach((sec) => ((sec && sec.items) || []).forEach((it) => { if (isPost(it && it.name)) n++; }));
          shipPost[w + '|' + d] = n;
          tot += n;
        });
        wkShip[w] = tot;
        wkSha[w] = sha(JSON.stringify(W[w]));
      });
      for (const r of stages) {
        S.dayCells++;
        if (r.dl) wkDeload[r.w] = true;
        const a1 = cardPost(r.p1);
        const a2 = cardPost(r.p2);
        const a3 = cardPost(r.p3);
        if (hasLab(r.p2, 'Leg superset B')) { S.capLSBin++; if (!hasLab(r.p3, 'Leg superset B')) S.capLSBkilled++; }
        LABELS.forEach((lb) => { if (hasLab(r.p1, lb)) bump(S.lblP1all, lb); if (hasLab(r.p2, lb)) bump(S.lblP2all, lb); });
        PLABELS.forEach((lb) => { if (hasLab(r.p1, lb)) bump(S.pullP1all, lb); if (hasLab(r.p2, lb)) bump(S.pullP2all, lb); });
        if (!r.dl) continue;
        if (hasLab(r.p1, 'Pull superset A') && hasLab(r.p1, 'Pull superset B')) {
          S.pullBothP1++;
          const pst = (lb: string): boolean => (r.p1 || []).some((s) => s.l === lb && secPost(s) > 0);
          const srv = (lb: string): boolean => hasLab(r.p2, lb);
          bump(S.pullSwapCensus, 'enterPost=' + ((pst('Pull superset A') ? 'A' : '') + (pst('Pull superset B') ? 'B' : '') || 'none')
            + ' surv=' + ((srv('Pull superset A') ? 'A' : '') + (srv('Pull superset B') ? 'B' : '') || 'none'));
        }
        S.dlDayBuilds++;
        S.postInP1 += a1;
        S.postOutP2 += a2;
        LABELS.forEach((lb) => {
          if (hasLab(r.p1, lb)) bump(S.lblP1, lb);
          if (hasLab(r.p2, lb)) bump(S.lblP2, lb);
          if (hasLab(r.p1, lb) && !hasLab(r.p2, lb)) {
            bump(S.dropped, lb);
            if ((r.p1 || []).some((s) => s.l === lb && secPost(s) > 0)) bump(S.droppedPost, lb);
          }
        });
        const killed = a1 > 0 && a2 === 0;
        // D155: on a tier B long-run day the hinge leaves by the long-run ruling, not the deload's; X counts exclude it
        const day = W[r.w]?.[r.d as DayKey];
        const tb = !!(LT && day && LT(day.cardio) === 'B');
        S.tierBDl += tb ? 1 : 0;
        S.postInP1X += tb ? 0 : a1;
        S.postOutP2X += tb ? 0 : a2;
        if (killed && !tb) { S.killedByDeloadX++; (r.p1 || []).forEach((s) => { if (secPost(s) > 0) bump(S.killHoldX, s.l || '(nolabel)'); }); }
        if (killed) {
          S.killedByDeload++;
          if ((r.p1 || []).filter((s) => secPost(s) > 0).every((s) => s.l === 'Explosive finisher')) S.killedHeldByFinisher++;
          if ((r.p2 || []).some((s) => KMAIN.test(String(s.l || '').toLowerCase()))) S.killedKeepsMain++;
          (r.p1 || []).forEach((s) => { if (secPost(s) > 0) bump(S.killHold, s.l || '(nolabel)'); });
        }
        const c1 = (r.p1 || []).map(cls);
        const c2 = (r.p2 || []).map(cls);
        const cand = c1.filter((x) => x === 'cand').length;
        const surv = c2.filter((x) => x === 'cand').length;
        const postCand = (r.p1 || []).filter((s, i) => c1[i] === 'cand' && secPost(s) > 0).length;
        const mainPost = (r.p1 || []).some((s, i) => c1[i] === 'main' && secPost(s) > 0);
        if (surv > 1) S.survCandGt1++;
        if (surv !== (cand > 0 ? 1 : 0)) S.survCandViol++;
        const inTrap = mainPost && postCand === 0;
        if (inTrap) {
          S.trapAny++;
          if (cand > 0) { S.trapCand++; if (surv !== 1) S.trapSurvViol++; } else { S.trapNoCand++; if (surv !== 0) S.trapNoCandSurvViol++; }
        }
        const inSwap = hasLab(r.p1, 'Leg superset A') && hasLab(r.p1, 'Leg superset B') && hasLab(r.p2, 'Leg superset B') && !hasLab(r.p2, 'Leg superset A');
        if (hasLab(r.p1, 'Leg superset A') && hasLab(r.p1, 'Leg superset B')) S.swapBoth++;
        if (inSwap) {
          S.swapPop++;
          if (a2 > 0 && a3 === 0) S.swapReCap++;
          if (a3 > 0 && (shipPost[r.w + '|' + r.d] || 0) === 0) { S.swapReBudget++; if ((wkShip[r.w] || 0) === 0) S.swapReBudgetWeekZero++; }
        }
        if (inTrap && inSwap) S.trapAndSwap++;
        // the same trap predicate through the ENGINE's lens ({hinge, hip_ext} per _pattern)
        const secPostE = (s: SnapSection): number => (s.p || []).reduce((a, q) => a + (q === 'hinge' || q === 'hip_ext' ? 1 : 0), 0);
        const postCandE = (r.p1 || []).filter((s, i) => c1[i] === 'cand' && secPostE(s) > 0).length;
        const mainPostE = (r.p1 || []).some((s, i) => c1[i] === 'main' && secPostE(s) > 0);
        if (mainPostE && postCandE === 0) {
          S.trapAnyE++;
          if (cand > 0) { S.trapCandE++; if (surv !== 1) S.trapSurvViolE++; } else { S.trapNoCandE++; if (surv !== 0) S.trapNoCandSurvViolE++; }
        }
        // p2's labels are a subsequence of p1's: nothing reordered, nothing appended
        let pi = 0;
        let okSub = true;
        (r.p2 || []).forEach((s) => {
          let f = -1;
          for (let i = pi; i < (r.p1 || []).length; i++) if (r.p1[i]!.l === s.l) { f = i; break; }
          if (f < 0) okSub = false; else pi = f + 1;
        });
        if (!okSub) S.orderViol++;
        if ((r.p2 || []).length < (r.p1 || []).length) S.orderNonVac++;
        const idx = (c: SnapSection[] | undefined, re: RegExp): number => { for (let i = 0; i < (c || []).length; i++) if (re.test(String(c![i]!.l || ''))) return i; return -1; };
        const RLEG = /^Leg superset|^Leg isolation/i;
        const RHIP = /Hip stability|Foot & ankle/i;
        const l1 = idx(r.p1, RLEG), h1 = idx(r.p1, RHIP), l2 = idx(r.p2, RLEG), h2 = idx(r.p2, RHIP);
        if (l2 >= 0 && h2 >= 0 && l1 >= 0 && h1 >= 0 && l1 < h1 && l2 > h2) S.legAfterHipViol++;
      }
      Object.keys(W).forEach((w) => {
        S.weeks++;
        if (wkDeload[w]) S.deloadWeeks++; else S.nonDeloadWeeks++;
        if (wkShip[w] === 0) { S.zeroWeeks++; if (wkDeload[w]) S.zeroWeeksDeload++; else S.zeroWeeksNonDeload++; }
      });
      arms[m] = { wkShip, wkDeload, wkSha, shipPost };
    }
    const { on, off } = arms as Record<'on' | 'off', Shipped>;
    Object.keys(on.wkShip).forEach((w) => {
      if (on.wkShip[w] === 0 && (off.wkShip[w] || 0) > 0) R.wrongWay++;
      if (on.wkDeload[w]) { R.dlTotal++; if (on.wkSha[w] === off.wkSha[w]) R.dlIdentical++; } else { R.ndTotal++; if (on.wkSha[w] === off.wkSha[w]) R.ndIdentical++; }
    });
    Object.keys(on.shipPost).forEach((k) => {
      if (on.wkDeload[k.split('|')[0]] && (off.shipPost[k] || 0) > 0 && on.shipPost[k] === 0) R.endToEnd++;
    });
  }
  return R;
}

// ── the D93/D94 pull census over the mini lattice ───────────────────────────────────────────────────────────────────
const FAM = ['Pull superset A', 'Pull superset B', 'Pull'];
function pullCensus(IA: App, lattice: readonly LatticeRow[]) {
  const S = { configs: 0, dayCells: 0, dlDayBuilds: 0, famP2: 0, famP1: 0, famP2ByLabel: {} as Tally, bothEnter: 0, mainPostCards: 0, swapCards: 0,
    swapItems: {} as Tally, census: {} as Tally, viol: 0, mainPostSwap: 0, p7VPull: 0, p4Survive: 0 };
  const secOf = (c: SnapSection[] | undefined, lb: string): SnapSection[] => (c || []).filter((s) => s.l === lb && (s.n || []).length);
  const labPost = (c: SnapSection[] | undefined, lb: string): boolean => secOf(c, lb).some((s) => (s.n || []).some(isPost));
  for (const L of lattice) {
    const { prog, stages } = stagedBuild(IA, L.cfg, false);
    const W = prog.weeks || {};
    S.configs++;
    for (const r of stages) {
      S.dayCells++;
      const day = W[r.w]?.[r.d as DayKey];
      const ship = ((day && day.sections) || []).map((s) => ({ l: String((s && s.label) || ''), n: ((s && s.items) || []).map((i) => String((i && i.name) || '')) }));
      FAM.forEach((lb) => {
        const n2 = secOf(r.p2, lb).length;
        if (n2) { S.famP2 += n2; S.famP2ByLabel[lb] = (S.famP2ByLabel[lb] || 0) + n2; }
        S.famP1 += secOf(r.p1, lb).length;
      });
      if (!r.dl) continue;
      S.dlDayBuilds++;
      const aPost = labPost(r.p1, 'Pull superset A');
      const bPost = labPost(r.p1, 'Pull superset B');
      const mainPost = (r.p1 || []).some((s) => cls(s) === 'main' && (s.n || []).some(isPost));
      if (!(secOf(r.p1, 'Pull superset A').length && secOf(r.p1, 'Pull superset B').length)) continue;
      S.bothEnter++;
      if (mainPost) S.mainPostCards++;
      // D93 narrowed by D94: B survives iff B holds posterior AND no Main-class section holds posterior; else A
      const exp = bPost && !mainPost ? 'B' : 'A';
      const ep = (aPost ? 'A' : '') + (bPost ? 'B' : '') || 'none';
      const act = (secOf(r.p2, 'Pull superset A').length ? 'A' : '') + (secOf(r.p2, 'Pull superset B').length ? 'B' : '') || 'none';
      bump(S.census, 'enterPost=' + ep + (ep === 'none' ? '' : ' mainPost=' + (mainPost ? 'yes' : 'no')) + ' exp=' + exp + ' surv=' + act);
      if (act !== exp) S.viol++;
      if (!bPost) continue;
      S.swapCards++;
      secOf(r.p1, 'Pull superset B').forEach((s) => s.n!.forEach((n) => { if (isPost(n)) bump(S.swapItems, n); }));
      if (mainPost) S.mainPostSwap++;
      if (([] as string[]).concat(...ship.map((s) => s.n)).some(isVPull)) S.p7VPull++;
      const aItems = ([] as string[]).concat(...secOf(r.p1, 'Pull superset A').map((s) => s.n!));
      if (ship.some((s) => s.l === 'Pull superset A' || (s.l === 'Pull' && s.n.length && s.n.every((n) => aItems.includes(n))))) S.p4Survive++;
    }
  }
  return S;
}

// ── a golden file with several keyed entries (one per test that owns a part of it) ──────────────────────────────────
// tests/support/snapshot.js compares a whole file; the deload feature has two owners of its golden values (the
// integration file and the CI sweep), so each compares and rewrites only its own key. UPDATE_SNAPSHOTS=1 rewrites it.
function matchSnapshotKey(feature: string, key: string, actual: unknown): void {
  const file = path.join(SNAPSHOT_DIR, feature + '.json');
  const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const value = JSON.parse(JSON.stringify(actual));
  if (updating()) {
    cur[key] = value;
    const sorted = Object.fromEntries(Object.keys(cur).sort().map((k) => [k, cur[k]]));
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
    return;
  }
  assert.ok(Object.prototype.hasOwnProperty.call(cur, key), `tests/snapshots/${feature}.json has no "${key}"; write it with UPDATE_SNAPSHOTS=1 and commit it`);
  assert.deepStrictEqual(value, cur[key], `"${key}" differs from tests/snapshots/${feature}.json. If a ruling moved it, rerun with UPDATE_SNAPSHOTS=1 and review the git diff.`);
}

export {
  E_PAT, isPost, POST_PROBE, V_PULL, isVPull, VPULL_PROBE, cls, CLS_PROBE, KMAIN,
  ASSEMBLY, loadStaged, stagedBuild, deloadLattice, pullLattice, deloadCensus, pullCensus, matchSnapshotKey,
};
