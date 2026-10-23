// Helpers for the swap and undo tests (tests/integration/swaps.test.ts, tests/sweeps/swaps.test.ts). Built on
// tests/support/app.ts.
//
// THE BOOT MODEL. A boot in the app is a fresh page. The harness VM is not: HALF_MANNY's build shares items by reference
// with module-level tables, so an in-place rename on one page leaks into the next build on the same page. So every act
// starts on a fresh page (page()) with the device storage it needs, and every boot is a fresh page loaded with the
// storage the act left (reboot()). Each page's clock is pinned to 2026-09-24 noon; every stored program starts
// 2026-08-24 (a Monday), so week 5 Thursday is today.
//
// THE SHEET. A hop is taken exactly as the swap sheet takes it (hop()): the card must carry the hop's `from`, the slot's
// canSwap flag must be on and the target must be in the sheet's own candidate list for the item as it then stands
// (swapCandidates tier1 + tier2, or auxSwapCandidates for a null-pattern aux-family item); then applySwapChoice.
// A chain with a hop the sheet did not offer is counted as unreachable and left out of every claim.
//
// HAND ORACLES (typed here, never asked of the app): the D177 floor table and window rewrite, the toast sentences, the
// D193 hold (the cue, the held test text, the RPE 7 gloss by shape), the workaround cap table per region.
import type { Cfg } from '@ia/core';
import { loadApp, pinClock, fixtures } from './app.ts';
import type { App } from './app.ts';

/** A day as the app renders and stores it, read through the VM and edited in place by the swap sheet: untyped app data. */
type AppDay = any;
/** A config as these tests write it (Mario's swap config and its variants), stored and rebuilt by the app. */
type SwapCfg = Record<string, any>;
/** One hop through the swap sheet: the slot, the name the card must carry, the target. */
export interface Hop {
  si: number;
  ii: number;
  from: string;
  to: string;
}
/** A hop as hop() takes it: `from` is optional (a hop with none skips the card check). */
export type HopArg = Omit<Hop, 'from'> & { from?: string };
/** A chain of hops on one day of one config. */
export interface Chain {
  id: string;
  ck: string;
  cls: string;
  w: number;
  d: string;
  hops: Hop[];
}
/** Where the D177 floor table puts a swap's target: no row (null), unloadable (zero), off the wave grammar, below the window (win, with the rewritten card), or at it. */
type HandKind =
  | { k: 'null'; W: null }
  | { k: 'zero' | 'offgram' | 'atfloor'; W: number[] }
  | { k: 'win'; W: number[]; out: string };
/** A slot as a card shows it: the item's name and its detail. */
export interface Slot {
  n: string;
  d: string;
}
/** What runChains records for one chain. */
export interface ChainRun {
  pre: string;
  unreach: number;
  steps: Slot[];
  toasts: string[];
  prevJ?: string;
  live: Slot[];
  liveSig: string;
  liveJ: string;
  rec: any[];
  histJ: string | null;
  boot: Slot[];
  bootSig: string;
  bootJ: string;
  dup: string | null;
  chip?: string;
  afterJ?: string;
  undoEq?: boolean;
  recAfter?: string[];
  slotAfter?: string;
  bootAfterUndoJ?: string;
  eq: boolean;
}
/** One card of a built program, keyed w|d|si|ii. */
export interface Card {
  k: string;
  w: number;
  d: string;
  si: number;
  ii: number;
  label: string;
  n: string;
  det: string;
}
/** A target and the card it lands on in the D181 durability world. */
interface DurPair {
  to: string;
  det: string;
}
/** The durability world's constants (W5 Thu's box squat on Mario's config). */
export interface Dur {
  W: number;
  D: string;
  KEY: string;
  DONOR_M: string;
  EXPG: string;
  CLOCKS: Record<string, string>;
  ORD: string[][];
  M3_SEQS: string[][];
  DONOR: string;
  GOB: string;
  FRONT: string;
  LP: string;
  EXPLP: string;
  PAIRS: Record<string, DurPair>;
  ADDN: string;
  ADDSWAP: string;
}
/** One cell of the durability lattice. */
export interface DurCell {
  dated: boolean;
  clock: string;
  pair: string;
  other: boolean;
  touch: string;
  order: string;
  reboot: string | null;
}
/** What a durability cell read (err set, and nothing else, when the cell could not run). */
export interface DurCellResult {
  err?: string;
  live: string;
  card: string;
  want: string;
  hist: string;
  rec: string;
  durable: boolean;
  orphan: string[];
  exwEq: boolean;
}

// ── fixtures ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
const clone = (x: unknown) => JSON.parse(JSON.stringify(x));
const clean = (s: unknown) => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
/** JSON with the clock fields stripped. */
const JS = (v: unknown) => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Mario's swap config: commercial, support_strength, beginner, lift only, knee workaround, seed 76308. */
const MARIO = (): SwapCfg => ({
  name: 'M', primaryPath: 'lift', cardioTypes: [], cardioGoals: {}, eventTargeted: false, raceDate: null, liftingFocus: 'support_strength',
  experience: 'beginner', ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(),
  bench: 135, squat: 155, deadlift: 185, seed: 76308, injury: { region: 'knee', tier: 'workaround' },
});
const withInj = (region: string | null) => { const c = MARIO(); if (region) c.injury = { region, tier: 'workaround' }; else delete c.injury; return c; };
/** The chain lattice: MARIO under each workaround region, HALF_MANNY, and MARIO uninjured. */
const CFGS: Record<string, SwapCfg> = {
  knee_wa: withInj('knee'), ankle_wa: withInj('ankle'), hip_wa: withInj('hip'), lowback_wa: withInj('lowback'),
  shoulder_wa: withInj('shoulder'), elbow_wa: withInj('elbow'), manny: clone(fixtures.HALF_MANNY), mario_noinj: withInj(null),
};
const REGION = (ck: string) => (CFGS[ck].injury && CFGS[ck].injury.tier === 'workaround') ? CFGS[ck].injury.region : null;

// ── pages ────────────────────────────────────────────────────────────────────────────────────────────────────────
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
/** A fresh page: the app booted, its clock pinned to CLOCK noon, the sheet helpers and a toast recorder installed. */
function page(at?: string): App {
  const IA = loadApp();
  pinClock(IA, new Date((at || CLOCK) + 'T12:00:00'));
  IA.eval(HELP);
  return IA;
}
const E = (IA: App, c: string) => IA.eval(c);
const storedCache: Record<string, string> = {};
/** Clears the page's storage and stores `cfg` as program PM, built on its own fresh page (cached by key). */
function setup(IA: App, key: string, cfg: SwapCfg) {
  IA.localStorage.clear();
  if (!storedCache[key]) {
    const P = page(); const st = clone(P.buildProgram(clone(cfg)));
    Object.assign(st, { id: 'PM', name: 'M', created: 1, startDate: START, cfg: clone(cfg) });
    storedCache[key] = JSON.stringify(st);
  }
  IA.ctx.__SP = JSON.parse(storedCache[key]); E(IA, 'savePrograms([__SP]);');
}
/** The boot: refreshProgram on the stored program, the current week from the clock. */
function boot(IA: App) { return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA: App, w: number, d: string) { E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA: App, w: number, d: string): AppDay { return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
/** One line per section: label, then each item's name, detail and skip mark. */
function sig(dy: AppDay): string { if (!dy || !dy.sections) return '(none)'; return dy.sections.map((s: any) => clean(s.label) + '{' + (s.items || []).map((it: any) => clean(it.name) + '|' + (it.detail || '') + (it._skipped ? '[x]' : '')).join(';') + '}').join(' '); }
function slotOf(dy: AppDay, si: number, ii: number): Slot { const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n: clean(it.name), d: it.detail || '' } : { n: '(none)', d: '' }; }
const Jget = (IA: App, k: string) => JSON.parse(IA.localStorage.getItem(k) || '{}');
function putLS(IA: App, m: Map<string, string>) { IA.localStorage.clear(); for (const [k, v] of m) IA.localStorage.setItem(k, v); }
/** A fresh page on the same device: the storage `from` left, booted. */
function reboot(from: App): App { const T = page(); putLS(T, new Map(from.localStorage._map)); boot(T); return T; }
function dupName(dy: AppDay): string | null { const m: Record<string, number> = {}; ((dy && dy.sections) || []).forEach((s: any) => (s.items || []).forEach((it: any) => { const n = clean(it && it.name); if (n) m[n] = (m[n] || 0) + 1; })); return Object.keys(m).find(n => m[n] > 1) || null; }

/** One hop through the sheet; 1 when the card does not carry the hop's `from` or the sheet does not offer the target. */
function hop(IA: App, w: number, d: string, h: HopArg): number {
  view(IA, w, d); const dy = dayOf(IA, w, d); const it = dy && dy.sections && dy.sections[h.si] && dy.sections[h.si].items && dy.sections[h.si].items[h.ii];
  if (!it || (h.from && it.name !== h.from)) return 1;
  const ex = 'activeProg.weeks[' + w + '].' + d;
  const cands = Array.from(E(IA, '__cands(' + ex + ',' + w + ',' + JSON.stringify(it.name) + ')'));
  const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx: h.si, itemIdx: h.ii, name: it.name, detail: it.detail }; IA.ctx.__to = h.to;
  E(IA, '_swapCtx=__c;applySwapChoice(__to);');
  return (!can || !cands.includes(h.to)) ? 1 : 0;
}

// ── seeded sampling ──────────────────────────────────────────────────────────────────────────────────────────────
function mulberry(a: number): () => number { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; }
function shuffled<T>(arr: T[], key: string): T[] { const a = arr.slice(), r = mulberry(hstr(key)); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ── the chain walk ───────────────────────────────────────────────────────────────────────────────────────────────
// Classes: hop1 (A->B), hop2 (A->B->C), cyc2 (A->B->A), hop3 (three hops on one slot, off a hop2 and off a cyc2), cyc3
// (A->B->C->A), collide2 (slot i A->X, then slot j B->A), exch3 (collide2, then slot i X->B). Every hop carries its
// `from`, read off the card the walk renamed, so membership is computed by hand from the chain tuple.
const CLASSES = ['hop1', 'hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
/**
 * Every chain the sheet offers on (ck, weeks, days), sampled per (week, day, class) at a fixed seed: at most n[cls]
 * chains of each class (Infinity for all). Hop3 and cyc3 come from a seeded walk off the day's two-hop chains.
 */
function enumerate(ck: string, weeks: number[], days: string[], n: Record<string, number>): Chain[] {
  const IA = page(); setup(IA, ck, CFGS[ck]); boot(IA);
  const cand = (w: number, nm: string): string[] => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(nm) + ')'));
  const can = (si: number, ii: number) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const out: Chain[] = []; let id = 0;
  const take = (cls: string, w: number, d: string, list: Hop[][]) => { const k = n[cls] === undefined ? 0 : n[cls]; shuffled(list, ck + '|' + w + '|' + d + '|' + cls).slice(0, k).forEach(hops => out.push({ id: ck + '#' + id++, ck, cls, w, d, hops })); };
  for (const w of weeks) for (const d of days) {
    const live = dayOf(IA, w, d); if (!live || !live.sections) continue;
    const base = clone(live); IA.ctx.__D = base;
    const slots: { si: number; ii: number; n: string }[] = []; base.sections.forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => { if (it && it.name && can(si, ii)) slots.push({ si, ii, n: it.name }); }));
    if (!slots.length) continue;
    const lat: Record<string, Hop[][]> = { hop1: [], hop2: [], cyc2: [] }, two: { sl: { si: number; ii: number; n: string }; d1: AppDay; C: string; hops: Hop[] }[] = [], col: Hop[][] = [], exc: Hop[][] = [];
    for (const sl of slots) {
      IA.ctx.__D = base; const c1 = cand(w, sl.n);
      for (const Bn of c1) {
        const h1: Hop = { si: sl.si, ii: sl.ii, from: sl.n, to: Bn }; lat.hop1.push([h1]);
        const d1 = clone(base); d1.sections[sl.si].items[sl.ii].name = Bn; IA.ctx.__D = d1; if (!can(sl.si, sl.ii)) continue;
        for (const C of cand(w, Bn)) { const hops = [h1, { si: sl.si, ii: sl.ii, from: Bn, to: C }]; lat[C === sl.n ? 'cyc2' : 'hop2'].push(hops); two.push({ sl, d1, C, hops }); }
      }
    }
    if (n.collide2 || n.exch3) {
      for (const si of slots) for (const sj of slots) {
        if (si === sj) continue;
        IA.ctx.__D = base;
        for (const X of cand(w, si.n)) {
          const d1 = clone(base); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
          if (!cand(w, sj.n).includes(si.n)) continue;
          const h2: Hop[] = [{ si: si.si, ii: si.ii, from: si.n, to: X }, { si: sj.si, ii: sj.ii, from: sj.n, to: si.n }]; col.push(h2);
          const d2 = clone(d1); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
          if (can(si.si, si.ii) && cand(w, X).includes(sj.n)) exc.push(h2.concat([{ si: si.si, ii: si.ii, from: X, to: sj.n }]));
        }
      }
    }
    // hop3 off a hop2 (A>B>C>D, A>B>C>B) and off a cyc2 (A>B>A>B, A>B>A>C: the revisit stratum, where a `from`
    // repeats) are kept apart, so each is sampled.
    const h3: Hop[][] = [], h3r: Hop[][] = [], c3: Hop[][] = [];
    if (n.hop3 || n.cyc3) {
      const N3 = Math.min(40, Math.max(n.hop3 || 0, n.cyc3 || 0)), rnd = mulberry(hstr(ck + '|' + w + '|' + d + '|h3'));
      for (const t of shuffled(two, ck + '|' + w + '|' + d + '|two').slice(0, 160)) {
        const rv = t.C === t.sl.n;
        if (h3.length >= N3 && h3r.length >= N3 && c3.length >= N3) break;
        const d2 = clone(t.d1); d2.sections[t.sl.si].items[t.sl.ii].name = t.C; IA.ctx.__D = d2; if (!can(t.sl.si, t.sl.ii)) continue;
        const nx = cand(w, t.C); if (!nx.length) continue;
        if (!rv && nx.includes(t.sl.n) && c3.length < N3) { c3.push(t.hops.concat([{ si: t.sl.si, ii: t.sl.ii, from: t.C, to: t.sl.n }])); continue; }
        const others = nx.filter(x => x !== t.sl.n), tgt = rv ? h3r : h3; if (!others.length || tgt.length >= N3) continue;
        tgt.push(t.hops.concat([{ si: t.sl.si, ii: t.sl.ii, from: t.C, to: others[Math.floor(rnd() * others.length)] }]));
      }
    }
    take('hop1', w, d, lat.hop1); take('hop2', w, d, lat.hop2); take('cyc2', w, d, lat.cyc2);
    take('hop3', w, d, h3); take('hop3', w, d, h3r); take('cyc3', w, d, c3); take('collide2', w, d, col); take('exch3', w, d, exc);
  }
  return out;
}

// hand predicates, off the chain tuple only
const froms = (c: Chain) => c.hops.map(h => h.from), tos = (c: Chain) => c.hops.map(h => h.to);
/** U: the hop `from` names are pairwise distinct, so the day's store keeps one record per hop. */
const inU = (c: Chain) => new Set(froms(c)).size === c.hops.length;
/** U_d: the hop `to` names are pairwise distinct. */
const inUd = (c: Chain) => new Set(tos(c)).size === c.hops.length;
const handChip = (c: Chain) => c.hops[c.hops.length - 1].from;
/** On U, the store after one undo: the chain's first n-1 hops in recording order. */
const handStore = (c: Chain) => c.hops.slice(0, -1).map(h => h.from + '->' + h.to);
const storeU = (c: Chain, rec: any[]) => rec.length === c.hops.length && c.hops.every(h => rec.filter(e => e && e.from === h.from && e.to === h.to).length === 1);
const slotsOf = (c: Chain): Hop[] => { const seen = new Set<string>(), o: Hop[] = []; c.hops.forEach(h => { const k = h.si + ':' + h.ii; if (!seen.has(k)) { seen.add(k); o.push(h); } }); return o; };

/**
 * Runs chains of one config the way the athlete makes them, one chain per day per batch, each batch a fresh page and a
 * fresh store. mode: 'u' untouched, 't1' a touch (a set draft) before the chain, 't2' a touch after it. Records per chain:
 * each hop's slot and toast, the day before the last hop, the live day, the store and ia_hist_ record as written, a
 * fresh-page boot of that storage; with undo, the chip the card reads, the day after one undo, the store after it, and a
 * fresh-page boot of the storage after the undo.
 */
function runChains(chains: Chain[], mode: string, withUndo?: boolean): Map<string, ChainRun> {
  const out = new Map<string, ChainRun>();
  if (!chains.length) return out;
  const ck = chains[0].ck;
  const byDay: Record<string, Chain[]> = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length));
  const touch = (A: App, c: Chain) => { view(A, c.w, c.d); E(A, "writeSetDraft('zz_touch',['1'],['1'],'');"); };
  for (let b = 0; b < nB; b++) {
    const batch = lists.map(l => l[b]).filter(Boolean);
    const A = page(); setup(A, ck, CFGS[ck]); boot(A);
    const st: Record<string, ChainRun> = {};
    for (const c of batch) {
      const s = st[c.id] = { pre: sig(dayOf(A, c.w, c.d)), unreach: 0, steps: [], toasts: [] } as unknown as ChainRun;
      if (mode === 't1') touch(A, c);
      c.hops.forEach((h, k) => {
        if (k === c.hops.length - 1) s.prevJ = JS(dayOf(A, c.w, c.d).sections);
        E(A, '__T.length=0;'); s.unreach += hop(A, c.w, c.d, h);
        s.steps.push(slotOf(dayOf(A, c.w, c.d), h.si, h.ii)); s.toasts.push(Array.from(E(A, '__T')).join(' / '));
      });
    }
    if (mode === 't2') batch.forEach(c => touch(A, c));
    batch.forEach(c => { const dy = dayOf(A, c.w, c.d); Object.assign(st[c.id], { live: slotsOf(c).map(h => slotOf(dy, h.si, h.ii)), liveSig: sig(dy), liveJ: JS(dy) }); });
    const store = Jget(A, 'ia_swaps_PM'), hist = Jget(A, 'ia_hist_PM');
    const R = reboot(A);
    batch.forEach(c => {
      const k = 'w' + c.w + '_' + c.d, dy = dayOf(R, c.w, c.d);
      Object.assign(st[c.id], { rec: store[k] || [], histJ: hist[k] ? JS(hist[k]) : null, boot: slotsOf(c).map(h => slotOf(dy, h.si, h.ii)), bootSig: sig(dy), bootJ: JS(dy), dup: dupName(dy) });
    });
    if (withUndo) {
      batch.forEach(c => {
        const s = st[c.id], hl = c.hops[c.hops.length - 1]; view(A, c.w, c.d);
        const it = dayOf(A, c.w, c.d).sections[hl.si].items[hl.ii];
        s.chip = (it && E(A, 'swapOriginOf(' + JSON.stringify(it.name) + ')')) || '';
        if (s.chip) E(A, 'undoSwap(' + JSON.stringify(s.chip) + ');');
        s.afterJ = JS(dayOf(A, c.w, c.d).sections);
        s.undoEq = !!s.chip && s.afterJ === s.prevJ;
        s.recAfter = ((Jget(A, 'ia_swaps_PM')['w' + c.w + '_' + c.d]) || []).map((e: any) => e.from + '->' + e.to);
        s.slotAfter = slotOf(dayOf(A, c.w, c.d), hl.si, hl.ii).n;
      });
      const R2 = reboot(A);
      batch.forEach(c => { st[c.id].bootAfterUndoJ = JS(dayOf(R2, c.w, c.d).sections); });
    }
    batch.forEach(c => { const s = st[c.id]; s.eq = s.live.every((x, i) => x.n === s.boot[i].n && x.d === s.boot[i].d); out.set(c.id, s); });
  }
  return out;
}

// ── the cue and the cap (D190, D193) ─────────────────────────────────────────────────────────────────────────────
const CUE = ' — hold RPE 7, three in the tank';
/** The workaround cap table, typed from the D190 ruling header. */
const CAP: Record<string, string[]> = {
  knee: ['squat', 'lunge', 'leg_iso'], ankle: ['squat', 'lunge'], hip: ['hinge', 'lunge', 'hip_ext', 'squat'],
  lowback: ['hinge', 'squat', 'row', 'hip_ext'], shoulder: ['hpress', 'vpress', 'delt_iso'], elbow: ['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'],
};
const stripCue = (s: string) => s.endsWith(CUE) ? s.slice(0, s.length - CUE.length) : s;
/** A swapped card is right when it ends with the cue exactly when the plan caps its pattern and the cue-free dose is non-empty and names no RPE. */
function cueIff(region: string | null, pattern: string, detail: unknown) {
  const d = String(detail || ''), has = d.endsWith(CUE), n = d.split(CUE).length - 1, base = stripCue(d);
  const want = !!region && CAP[region].includes(pattern) && !!base && !/RPE/.test(base);
  return { ok: has === want && n === (has ? 1 : 0), want, has };
}

// ── the swap floor (D177) and the hold beneath it (D193) ─────────────────────────────────────────────────────────
// The floor table as ruled, first match wins. null: the wave's own barbell compounds carry verbatim. [0,0]: unloadable
// (V119). Otherwise the load-ceilinged window.
const HAND_FLOOR: [RegExp, number[] | null][] = [
  [/^(barbell bench press|incline barbell press|close-grip bench press|barbell row|pendlay row|deadlift|sumo deadlift|trap bar deadlift|romanian deadlift|back squat|front squat|paused back squat|box squat|overhead press|push press|good mornings)$/i, null],
  [/foot on chair|hands on bed|shoulders on bed|under a table|\(anchored\)|partner\/anchor/i, [0, 0]],
  [/banded|resistance band|band pull-apart/i, [0, 0]],
  [/glute bridge|bodyweight back extension|45° back extension/i, [0, 0]],
  [/nordic|glute-ham|\bghr\b/i, [0, 0]],
  [/inverted row|prone y-t-w|reverse snow angel/i, [0, 0]],
  [/wall sit|wall walk|assisted pistol|spanish squat/i, [0, 0]],
  [/\bdips\b|pushup|push-up|pike pushup/i, [0, 0]],
  [/squat \(slow/i, [0, 0]],
  [/goblet/i, [8, 12]],
  [/pull-through|pull through/i, [8, 12]],
  [/straight-arm pulldown/i, [8, 12]],
  [/kettlebell swing|\bswing\b/i, [10, 15]],
  [/hip thrust/i, [6, 10]],
  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6, 10]],
  [/\brow\b/i, [6, 10]],
  [/dumbbell|kettlebell|\bdb\b|\bkb\b/i, [5, 8]],
  [/leg press|hack squat|machine|pulldown/i, [5, 8]],
  [/cable|crossover|pec deck|\bfly\b|flye/i, [8, 12]],
];
const handFloor = (n: unknown): number[] | null => { for (const [re, w] of HAND_FLOOR) if (re.test(String(n || ''))) return w; return null; };
const GRAM = /^(\d+)×(\d+)(?:–(\d+))? — RPE /;   // the wave Main grammar
const REP_TOKEN = /^(\d+)×\d+(?:–\d+)?/;
const handRewrite = (d: string, w: number[]) => d.replace(REP_TOKEN, (m, s) => s + '×' + w[0] + '–' + w[1]);
const stripRep = (s: unknown) => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');
function handKind(n: string, D: string): HandKind {
  const W = handFloor(n);
  if (W === null) return { k: 'null', W };
  if (W[1] === 0) return { k: 'zero', W };
  const m = GRAM.exec(D || '');
  if (!m) return { k: 'offgram', W };
  if (+m[2] < W[0]) return { k: 'win', W, out: handRewrite(D, W) };
  return { k: 'atfloor', W };
}
const T3 = (to: string, from: string, w: number[]) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Same sets, same effort. Reps move to ' + w[0] + ' to ' + w[1] + '.';
const T119 = (to: string, from: string) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here, so take the sets to the same effort.';
const TSAME = (to: string, from: string) => to + ' in, ' + from.toLowerCase() + ' out. Same job, same numbers.';
const HOLD = ' Your injury plan holds this one at RPE 7.';
const T3H = (to: string, from: string, w: number[]) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Reps move to ' + w[0] + ' to ' + w[1] + '.' + HOLD;
const T119H = (to: string, from: string) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here.' + HOLD;
const TSAMEH = (to: string, from: string) => to + ' in, ' + from.toLowerCase() + ' out. Same sets, same reps.' + HOLD;
// The plan's cap per region and tier on the L1 lattice (an injury with no row throws, so a missing row fails loudly).
const CAP_L1: Record<string, Record<string, string[]>> = { knee: { workaround: ['squat', 'lunge', 'leg_iso'] }, lowback: { workaround: ['hinge', 'squat', 'row', 'hip_ext'] }, shoulder: { protect: [] } };
const CUE_ANY = / — hold RPE 7, (?:two|three) in the tank$/;
const TEST_RX = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7_TEXT = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TEST_SHAPE = /^Work up to one heavy set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
const R7_SHAPE = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
/** The donor read beneath its hold: either cue wording off, the held test text back to the strength test text. */
const stripHold = (d: string): string => typeof d !== 'string' ? d : R7_SHAPE.test(d) ? TEST_RX : d.replace(CUE_ANY, '');
/** The hold on a capped target: no RPE named -> the cue; the test text -> R7's text; a named RPE above 7 -> 7, glossed by shape. */
function holdHand(d: string): string {
  if (typeof d !== 'string' || !d) return d;
  if (!/RPE/.test(d)) return d + CUE;
  if (TEST_SHAPE.test(d)) return R7_TEXT;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if (!(Math.max(+a, b ? +b : 0) > 7)) return t;
    if (!g) return 'RPE 7';
    return /^stop/.test(gl) ? 'RPE 7 (leave 3 or more in reserve)' : /^heaviest/.test(gl) ? 'RPE 7 (leave ~3 in reserve)' : 'RPE 7 (leave ~3 reps in reserve)';
  });
}
const rpeHand = (d: unknown): number | null => { const re = /RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/g; let m: RegExpExecArray | null, best: number | null = null; while ((m = re.exec(String(d || '')))) { const v = Math.max(+m[1], m[2] ? +m[2] : 0); if (best === null || v > best) best = v; } return best; };
const CONVERTS = /^\s*\d+\s*[×x]\s*\d/;
const bucketHand = (d: unknown) => /rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8;
function capHand(cfg: SwapCfg, to: string, pattern: (n: string) => string) {
  if (!cfg || !cfg.injury) return false;
  const r = CAP_L1[cfg.injury.region], c = r && r[cfg.injury.tier];
  if (!c) throw new Error('no hand cap row for ' + cfg.injury.region + '/' + cfg.injury.tier);
  return c.indexOf(pattern(clean(to))) >= 0;
}

// ── the D177 lattice: every Main and Power swap pair, swapped live and undone ──────────────────────────────────
/** An L1 config: tier, focus, experience, goal (lift only or half), injury, seed. */
function l1Cfg(t: string, f: string, x: string, g: string, inj: { region: string; tier: string } | null, seed?: number): SwapCfg {
  const race = g === 'half';
  return {
    name: 'M', primaryPath: g === 'half' ? 'event' : 'lift', cardioTypes: g === 'half' ? ['run'] : [],
    cardioGoals: g === 'half' ? { run: { id: 'run_half', label: 'half', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi', targetDist: '1.5', targetMins: '11', targetSecs: '0' } } : {},
    eventTargeted: race, raceDate: race ? '2026-12-06' : null, liftingFocus: f, experience: x, ageBracket: '18-35', equipment: t, unit: 'lbs',
    restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: seed || 76308, ...(inj ? { injury: inj } : {}),
  };
}
const L1_TIERS = ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'];
const L1_FOCUS = ['support_prevention', 'support_strength', 'hypertrophy', 'strength'];
const L1_INJ: ({ region: string; tier: string } | null)[] = [null, { region: 'knee', tier: 'workaround' }, { region: 'lowback', tier: 'workaround' }, { region: 'shoulder', tier: 'protect' }];
/** The full L1 lattice: 6 tiers x 4 focuses x 2 experiences x 2 goals x 4 injury states, seed 76308 (384 configs). */
function l1All(): SwapCfg[] {
  const out: SwapCfg[] = [];
  for (const t of L1_TIERS) for (const f of L1_FOCUS) for (const x of ['beginner', 'advanced']) for (const g of ['liftonly', 'half'])
    for (const i of L1_INJ) out.push(l1Cfg(t, f, x, g, i));
  return out;
}
const BED_DONOR = 'Single-leg hip thrust (shoulders on bed)';
/** One page with the screens stubbed out, so applySwapChoice and undoSwap run on a program the test hands them. */
function floorPage(): App {
  const IA = loadApp();
  pinClock(IA, new Date(CLOCK + 'T12:00:00'));
  IA.eval("globalThis.__T=null;showToast=function(m){globalThis.__T=m;};openDetail=function(){};closeSwapSheet=function(){};"
    + "renderWeekView=function(){};showScreen=function(){};bumpSwapCount=function(){return false;};activeProgId='P1';");
  return IA;
}
/**
 * Every Main and Power swap pair of every config: the pair is swapped live and undone, then the day is put back. Per
 * pair, the card and toast are judged by hand: D177's window on the card beneath the hold, D193's hold on a capped
 * target, the toast for its kind and its hold variant. Counts are returned; examples of any miss are kept.
 */
function floorLattice(cfgs: SwapCfg[]) {
  const IA = floorPage();
  const sdE = IA.eval('_swapDetailFor'), patE = IA.eval('_pattern'), scE = IA.eval('swapCandidates');
  const pat = (n: string) => patE(n);
  const mainIdx = (day: AppDay) => (day.sections || []).findIndex((s: any) => /^main/i.test(clean(s && s.label)));
  const S = { cfgs: 0, crash: [] as string[], days: 0, pairs: 0, main: 0, pow: 0, powChg: 0, offN: 0, offChg: 0, winN: 0, nullN: 0, nullChg: 0, atN: 0, atChg: 0, zeroN: 0, zeroChg: 0,
    outside: 0, winChg: 0, under: 0, underN: 0, idBad: 0, throws: 0, t3: 0, lr: 0, lrMoved: 0, rr: 0, rrMoved: 0, cgbp: null as null | { where: string; ok: boolean; D: string; O: any },
    capPairs: 0, bA: 0, bOff: 0, bAt: 0, bNull: 0, bWin: 0, mvT: 0, bT: 0, missT: 0, clampT: 0, bed: { out: 0, off: 0, nul: 0, t: 0 }, ex: {} as Record<string, string[]> };
  const note = (k: string, s: string) => { (S.ex[k] = S.ex[k] || []).length < 3 && S.ex[k].push(s); };
  for (const cfg of cfgs) {
    let p: any; try { p = IA.buildProgram(clone(cfg)); } catch (e) { S.crash.push(cfg.equipment + '|' + cfg.liftingFocus + ': ' + (e as Error).message); continue; }
    S.cfgs++; const prog = Object.assign({}, p, { cfg }); IA.ctx.__P = prog;
    const tag = [cfg.equipment, cfg.liftingFocus, cfg.experience, cfg.primaryPath, cfg.injury ? cfg.injury.region + '/' + cfg.injury.tier : 'healthy'].join('|');
    for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
      const day = p.weeks[w][d]; if (!day || day.rest || !Array.isArray(day.sections)) continue;
      S.days++;
      day.sections.forEach((s: any) => ((s && s.items) || []).forEach((it: any) => {
        if (!it || !it.name || typeof it.detail !== 'string' || pat(it.name) != null) return;
        const n = clean(it.name);
        if (n === 'Landmine rotations') { S.lr++; if (sdE(it.name, it.detail) !== it.detail) S.lrMoved++; }
        if (n === 'Dumbbell renegade rows') { S.rr++; if (sdE(it.name, it.detail) !== it.detail) S.rrMoved++; }
      }));
      IA.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';localStorage.removeItem('ia_swaps_P1');");
      for (let si = 0; si < day.sections.length; si++) {
        const L = clean(day.sections[si] && day.sections[si].label);
        const isMain = /^main/i.test(L), isPow = /^power|explosive finisher/i.test(L);
        if (!isMain && !isPow) continue;
        const nItems = (day.sections[si].items || []).length;
        for (let ii = 0; ii < nItems; ii++) {
          const it0 = day.sections[si].items[ii]; if (!it0 || !it0.name || typeof it0.detail !== 'string') continue;
          let c: any = null; try { c = scE(clean(it0.name), day, w, prog); } catch (e) { /* no candidates */ } if (!c) continue;
          const cands = ([] as any[]).concat(c.tier1 || [], c.tier2 || []).map((z: any) => typeof z === 'string' ? z : z.name);
          for (const to of cands) {
            const it = day.sections[si].items[ii], from = it.name, D = it.detail;
            const before = JS(day.sections), raw = JSON.stringify(day.sections);
            const H = handKind(to, D), where = tag + ' W' + w + ' ' + d + ' ' + clean(from) + ' -> ' + to;
            let O: any = null, toast: any = null, after: string | null = null;
            try {
              IA.ctx.__c = { secIdx: si, itemIdx: ii, name: from, detail: D };
              IA.eval('globalThis.__T=null;_swapCtx=__c;applySwapChoice(' + JSON.stringify(to) + ')');
              O = day.sections[si].items[ii].detail; toast = IA.eval('globalThis.__T');
              IA.eval('undoSwap(' + JSON.stringify(from) + ')');
              after = JS(day.sections);
            } catch (e) { S.throws++; note('throw', where + ' ' + (e as Error).message); }
            S.pairs++;
            if (after !== before) { S.idBad++; note('id', where + ' [' + H.k + ']'); }
            if (from === 'Close-grip bench press' && to === 'Dips' && !S.cgbp) S.cgbp = { where, ok: after === before, D, O };
            day.sections = JSON.parse(raw); IA.eval("localStorage.removeItem('ia_swaps_P1')");
            if (/The load runs out before the reps do here/.test(String(toast))) S.t3++;
            // the toast (D177 R5, D193 R8): the V119 "changed [0,0] pair" is judged on the donor read beneath its hold
            const Db = stripHold(D), capd = capHand(cfg, to, pat);
            const conv = H.k === 'zero' && CONVERTS.test(Db);
            const pre = conv ? bucketHand(Db) : rpeHand(H.k === 'win' ? handRewrite(Db, H.W) : Db);
            const clamp = capd && pre !== null && pre > 7;
            const wantH = H.k === 'win' ? T3H(to, from, H.W) : conv ? T119H(to, from) : TSAMEH(to, from);
            const wantT = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== Db) ? T119(to, from) : TSAME(to, from);
            if (clamp) S.clampT++;
            if (toast !== wantT) {
              S.mvT++; if (clean(from) === BED_DONOR) S.bed.t++;
              if (!(clamp && toast === wantH && String(toast).endsWith(HOLD))) { S.bT++; note('t', where + ' [' + H.k + (clamp ? ', clamp' : '') + '] ' + toast + ' | want ' + (clamp ? wantH : wantT)); }
            } else if (clamp) { S.missT++; note('miss', where + ' [' + H.k + '] ' + toast + ' | want ' + wantH); }
            if (isPow) {
              if (H.k === 'zero') continue;
              S.pow++; if (O.replace(CUE_ANY, '') !== D.replace(CUE_ANY, '')) { S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }
              continue;
            }
            S.main++;
            if (H.k === 'zero') { S.zeroN++; if (O !== D) S.zeroChg++; continue; }
            if (O !== D && stripRep(O) !== stripRep(D)) { S.outside++; if (clean(from) === BED_DONOR) S.bed.out++; }
            if (H.k === 'offgram') { S.offN++; if (O.replace(CUE_ANY, '') !== D.replace(CUE_ANY, '')) { S.offChg++; if (clean(from) === BED_DONOR) S.bed.off++; } }
            if (H.k === 'null') { S.nullN++; if (O !== D) { S.nullChg++; if (clean(from) === BED_DONOR) S.bed.nul++; } }
            if (H.k === 'atfloor') { S.atN++; if (O !== D) S.atChg++; }
            if (H.k === 'win') { S.winN++; if (O !== H.out) S.winChg++; }
            // the card (D193 (l)): an uncapped target is D177's card on the donor read beneath its hold; a capped target
            // is the hold applied to that card
            const E9 = H.k === 'win' ? handRewrite(Db, H.W) : Db, X9 = capd ? holdHand(E9) : E9;
            if (capd) S.capPairs++;
            if (stripRep(O) !== stripRep(X9)) { S.bA++; note('A', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if (H.k === 'offgram' && O.replace(CUE_ANY, '') !== X9.replace(CUE_ANY, '')) { S.bOff++; note('off', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if (H.k === 'null' && O !== X9) { S.bNull++; note('null', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if (H.k === 'atfloor' && O !== X9) { S.bAt++; note('at', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if (H.k === 'win' && O !== X9) { S.bWin++; note('win', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if (H.k === 'win' || H.k === 'atfloor') { S.underN++; const m = GRAM.exec(O || ''); if (!m || +m[2] < H.W[0]) { S.under++; note('under', where + ' :: ' + O); } }
          }
        }
      }
    }
  }
  return S;
}

// ── the build-time swap preference (cfg.exSwapPrefs through applySwapPrefs, D190 build path) ─────────────────────
const PREF_REGIONS = ['knee', 'ankle', 'lowback', 'hip', 'elbow', 'shoulder'];
/** MARIO with a workaround region (or none) and a swap preference. */
const prefCfg = (reg?: string | null, pref?: Record<string, string>) => { const c = withInj(reg || null); if (pref) c.exSwapPrefs = clone(pref); return c; };
/** Every card of a program built on its own fresh page: key w|d|si|ii -> {w, d, si, ii, label, n, det}. */
function cards(cfg: SwapCfg): Map<string, Card> {
  const p: any = page().buildProgram(clone(cfg)), m = new Map<string, Card>();
  Object.keys(p.weeks || {}).forEach((w: string) => Object.keys(p.weeks[w] || {}).forEach((d: string) => {
    const dy = p.weeks[w][d];
    ((dy && Array.isArray(dy.sections)) ? dy.sections : []).forEach((s: any, si: number) => ((s && s.items) || []).forEach((it: any, ii: number) => {
      if (!it) return; const k = w + '|' + d + '|' + si + '|' + ii;
      m.set(k, { k, w: +w, d, si, ii, label: clean(s.label), n: clean(it.name), det: typeof it.detail === 'string' ? it.detail : '' });
    }));
  }));
  return m;
}
/**
 * The preference population: per region, every natively cued source on the injured build with no preference (a card
 * ending with the cue), and its targets: the sheet's own candidates on the first day it is cued. `limit` caps the
 * targets per source and `srcLimit` the sources per region (a seeded sample); Infinity takes them all.
 */
function prefPopulation(regions: string[], limit?: number, srcLimit?: number) {
  const out: { reg: string; src: string; tgt: string }[] = [];
  for (const reg of regions) {
    const cfg = prefCfg(reg), nat = [...cards(cfg).values()], cued = nat.filter(c => c.det.endsWith(CUE));
    const P = page(); P.localStorage.clear(); const st = clone(P.buildProgram(clone(cfg)));
    Object.assign(st, { id: 'PM', name: 'M', created: 1, startDate: START, cfg: clone(cfg) });
    P.ctx.__SP = st; E(P, 'savePrograms([__SP]);'); boot(P);
    for (const s of shuffled([...new Set(cued.map(c => c.n))], reg).slice(0, srcLimit === undefined ? Infinity : srcLimit)) {
      const c0 = cued.find(c => c.n === s) as Card; P.ctx.__D = E(P, 'activeProg.weeks[' + c0.w + '].' + c0.d);
      const tg = Array.from(E(P, '__cands(__D,' + c0.w + ',' + JSON.stringify(s) + ')') as string[]).filter(t => t !== s);
      shuffled(tg, reg + '|' + s).slice(0, limit).forEach(t => out.push({ reg, src: s, tgt: t }));
    }
  }
  return out;
}

// ── a swap stays made until undone (D181) ────────────────────────────────────────────────────────────────────────
// One page, Mario's config, the stored program starting 2026-08-24 (or dateless), W5 Thu's box squat. The clocks are
// date arithmetic: 2026-08-24 is a Monday, so W5 Thu is 2026-09-24, and a day's program week is floor(days / 7) + 1.
// The freeze cut is read where the engine hands it on, by wrapping pruneDayEdits (the one reader of _swapCut).
const DUR = {
  W: 5, D: 'thu', KEY: 'w5_thu',
  DONOR_M: '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest',
  EXPG: '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest',
  CLOCKS: { future_prevwk: '2026-09-17', future_samewk: '2026-09-21', today: '2026-09-24', past_samewk: '2026-09-26', past_nextwk: '2026-09-29' },
  ORD: [['none', '-'], ['draft', 'swap_then_touch'], ['draft', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['done', 'swap_then_touch'], ['done', 'touch_then_swap']],
  M3_SEQS: [['swap', 'add'], ['add', 'swap'], ['swap', 'skipslot'], ['skipslot', 'swap'], ['swap', 'skipother'], ['skipother', 'swap'], ['add', 'swapadded']],
} as Partial<Dur> as Dur;
DUR.DONOR = 'Barbell box squat'; DUR.GOB = 'Dumbbell goblet squat'; DUR.FRONT = 'Front squat'; DUR.LP = 'Leg press';
DUR.EXPLP = DUR.EXPG;   // goblet -> leg press: "Same job, same numbers." carries the goblet's dose
DUR.PAIRS = { goblet: { to: DUR.GOB, det: DUR.EXPG }, verbatim: { to: DUR.FRONT, det: DUR.DONOR_M } };   // Front squat: the null row
DUR.ADDN = 'Dumbbell hammer curl'; DUR.ADDSWAP = 'Dumbbell biceps curl';

function durableWorld() {
  const { W, D, KEY, DONOR, GOB, LP, DONOR_M, EXPG, EXPLP, PAIRS, ADDN, ADDSWAP, CLOCKS } = DUR;
  const X = loadApp();
  const pin = (iso: string) => pinClock(X, new Date(iso + 'T12:00:00'));
  const ev = (c: string) => X.eval(c);
  ev("showToast=function(){};globalThis.__cut=null;(function(){var f=pruneDayEdits;pruneDayEdits=function(p,c){globalThis.__cut=c;return f(p,c);};})();");
  pin(CLOCKS.today);
  const built = JSON.stringify(X.buildProgram(MARIO() as Cfg));
  function setup(dated: boolean) {
    X.localStorage.clear(); pin(CLOCKS.today);
    const st = JSON.parse(built); Object.assign(st, { id: 'PM', name: 'M', created: 1, startDate: dated ? START : null, cfg: MARIO() });
    X.ctx.__SP = st; ev('savePrograms([__SP]);'); return st;
  }
  const bootX = () => ev("globalThis.__cut=null;activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek");
  const cutNow = () => ev('globalThis.__cut');
  const viewX = (w?: number, d?: string) => ev('currentWeek=' + (w || W) + ";currentDayKey='" + (d || D) + "';");
  const day = (w?: number, d?: string): AppDay => ev('activeProg.weeks[' + (w || W) + '].' + (d || D));
  const loc = (dy: AppDay, name: string): { si: number; ii: number } | null => { const ss = dy.sections || []; for (let si = 0; si < ss.length; si++) { const it = ss[si].items || []; for (let ii = 0; ii < it.length; ii++) if (clean(it[ii].name) === name) return { si, ii }; } return null; };
  const L0 = loc(JSON.parse(built).weeks[W][D], DONOR) as { si: number; ii: number };
  if (!L0) throw new Error('fixture moved: no ' + DONOR + ' on W5 Thu');
  const cardAt = (): { name: string; detail: string; skip?: boolean } => { const dy = day(); const it = dy && dy.sections && dy.sections[L0.si] && dy.sections[L0.si].items[L0.ii]; return it ? { name: clean(it.name), detail: clean(it.detail), skip: !!it._skipped } : { name: '(none)', detail: '' }; };
  const fullOf = (c: { name: string; detail: string }) => c.name + ' :: ' + c.detail;
  const swapAt = (to: string) => { viewX(); const it = day().sections[L0.si].items[L0.ii]; X.ctx.__c = { secIdx: L0.si, itemIdx: L0.ii, name: it.name, detail: it.detail }; X.ctx.__to = to; ev('_swapCtx=__c;applySwapChoice(__to);'); };
  function touch(kind: string) {
    viewX(); const c = cardAt(); X.ctx.__n = c.name; X.ctx.__det = day().sections[L0.si].items[L0.ii].detail; X.ctx.__title = day().title || 'T';
    if (kind === 'draft') ev("writeSetDraft(exStoreKey(__n),['5','5'],['95','95'],'');");
    if (kind === 'tick') ev('logExerciseWeight(__n,95,__det,' + W + ",[5,5,5,5],[95,95,95,95],'" + D + "');");
    if (kind === 'done') ev("handleDayStatus('" + D + "',__title,'complete');");
  }
  const otherTouch = () => { const wk = bootX(); ev('currentWeek=' + wk + ";currentDayKey='mon';writeSetDraft('zz_other',['1'],['1'],'');"); };
  const JSs = (k: string) => JSON.parse(X.localStorage.getItem(k) || '{}');
  const recs = () => { const sw = JSs('ia_swaps_PM')[KEY]; return sw ? sw.map((e: any) => e.from + '->' + e.to).join(',') : 'none'; };
  const histSlot = () => { const hs = JSs('ia_hist_PM')[KEY]; const it = hs && hs.sections && hs.sections[L0.si] && hs.sections[L0.si].items[L0.ii]; return it ? clean(it.name) + ' :: ' + clean(it.detail) : 'none'; };
  const chipFor = (name: string) => { viewX(); return ev('swapOriginOf(' + JSON.stringify(name) + ')') || '-'; };
  const dayKeys = () => { const s = new Set<string>(); (day().sections || []).forEach((sec: any) => (sec.items || []).forEach((it: any) => { if (it && it.name) { X.ctx.__n = clean(it.name); s.add(ev('exStoreKey(__n)')); } })); return s; };
  const exwAt = () => { const exw = JSs('ia_exw_PM'), keys = Object.keys(exw); return { keys: keys.length, entries: keys.reduce((a, k) => a + ((exw[k] && exw[k].entries) || []).length, 0), here: keys.filter(k => ((exw[k] && exw[k].entries) || []).some((e: any) => +e.week === W && e.day === D)) }; };

  /** Rows 1, 1c, 3, 3d: one lattice cell. */
  function cell(o: DurCell): DurCellResult {
    setup(o.dated);
    pin(CLOCKS[o.clock]); bootX(); if (o.other) otherTouch(); bootX();
    const P = PAIRS[o.pair]; viewX(); if (cardAt().name !== DONOR) return { err: 'donor not on card' } as DurCellResult;
    if (o.touch === 'none') swapAt(P.to);
    else if (o.order === 'swap_then_touch') { swapAt(P.to); touch(o.touch); } else { touch(o.touch); swapAt(P.to); }
    viewX(); const live = fullOf(cardAt()), liveKeys = dayKeys(), ex0 = exwAt();
    pin(CLOCKS[o.reboot || o.clock]); bootX(); viewX();
    const c = cardAt(), bootKeys = dayKeys(), ex1 = exwAt(), hist = histSlot(), want = P.to + ' :: ' + P.det;
    return { live, card: fullOf(c), want, hist, rec: recs(),
      durable: fullOf(c) === want && (o.touch === 'none' || hist === want),
      orphan: ex0.here.filter(k => liveKeys.has(k) && !bootKeys.has(k)),
      exwEq: ex0.keys === ex1.keys && ex0.entries === ex1.entries };
  }
  /** The whole lattice, or the cells `keep` selects: dated/dateless x five clocks x two pairs x other-day touch x seven orderings x two reboots. */
  function lattice(keep?: (o: DurCell) => boolean) {
    const out: { o: DurCell; r: DurCellResult }[] = [];
    for (const dated of [true, false]) for (const clock of Object.keys(CLOCKS)) for (const pair of Object.keys(PAIRS))
      for (const other of [false, true]) for (const [touchK, order] of DUR.ORD) for (const rb of [null, 'past_nextwk']) {
        if (rb === clock) continue; const o = { dated, clock, pair, other, touch: touchK, order, reboot: rb };
        if (keep && !keep(o)) continue;
        let r: DurCellResult; try { r = cell(o); } catch (e) { r = { err: 'CRASH ' + (e as Error).message } as DurCellResult; }
        out.push({ o, r });
      }
    return out;
  }
  /** Row 2: undo after a reboot, per ordering. */
  function undoAfterReboot(t: string, ord: string) {
    setup(true); pin(CLOCKS.today); bootX(); viewX();
    if (t === 'none') swapAt(GOB); else if (ord === 'swap_then_touch') { swapAt(GOB); touch(t); } else { touch(t); swapAt(GOB); }
    bootX(); viewX(); const b1 = fullOf(cardAt()), chip = chipFor(GOB);
    ev('undoSwap(' + JSON.stringify(DONOR) + ');'); viewX(); const u = fullOf(cardAt()), recU = recs(), histU = histSlot();
    bootX(); viewX(); const b2 = fullOf(cardAt()); bootX(); viewX(); const b3 = fullOf(cardAt());
    return { b1, chip, u, recU, histU, b2, b3 };
  }
  /** Rows 4, 4d: add and skip with a swap on a frozen day; live, boot and next-week boot signatures. */
  function addSkip(tk: string, seq: string[], tpos: number) {
    const daySig = () => {
      const ss = day().sections || [], main = cardAt(), skipped: string[] = [], added: string[] = []; let gobN = 0, donN = 0;
      ss.forEach((s: any) => { if (s._skipped) skipped.push('ss'); (s.items || []).forEach((it: any) => { const nm = clean(it.name); if (nm === GOB) gobN++; if (nm === DONOR) donN++; if (it._skipped) skipped.push(nm); if (s._added) added.push(nm); }); });
      return main.name + ' ' + main.detail.split(' — ')[0] + (main.skip ? '[x]' : '') + ' | skip=' + (skipped.join(',') || '-') + ' | add=' + (added.join(',') || '-') + ' | nGob=' + gobN + ' nDonor=' + donN;
    };
    setup(true); pin(CLOCKS.today); bootX(); viewX();
    const other = (() => { for (const s of day().sections) for (const it of (s.items || [])) if (clean(it.name) !== DONOR && it.name && !s.superset) return it.name; })();
    const ops = seq.slice(); ops.splice(tpos, 0, 'touch');
    for (const op of ops) {
      viewX();
      if (op === 'touch') touch(tk);
      else if (op === 'swap') swapAt(GOB);
      else if (op === 'add') ev('applyAddChoice(' + JSON.stringify(ADDN) + ');');
      else if (op === 'skipslot') ev('skipExercise(' + JSON.stringify(ev('activeProg.weeks[5].thu.sections[' + L0.si + '].items[' + L0.ii + '].name')) + ');');
      else if (op === 'skipother') ev('skipExercise(' + JSON.stringify(other) + ');');
      else if (op === 'swapadded') {
        const dy = day(); const si = dy.sections.findIndex((s: any) => s._added); if (si < 0) continue;
        const ii = dy.sections[si].items.findIndex((it: any) => it.name === ADDN);
        X.ctx.__c = { secIdx: si, itemIdx: ii, name: ADDN, detail: dy.sections[si].items[ii].detail }; ev('_swapCtx=__c;applySwapChoice(' + JSON.stringify(ADDSWAP) + ');');
      }
    }
    viewX(); const live = daySig(); bootX(); viewX(); const b1 = daySig(); pin(CLOCKS.past_nextwk); bootX(); viewX(); const b2 = daySig();
    const dbl = /nGob=[2-9]/.test(b1 + b2) || (/add=[^|]*,/.test(b1 + b2) && !/add=[^|]*,/.test(live));
    return { ops: tk + '|' + ops.join('>'), live, b1, b2, dbl };
  }
  /** Row 5s: box -> goblet -> leg press on a snapshotted day, the touch first, between or last. */
  function secondSwap(pos: string) {
    setup(true); pin(CLOCKS.today); bootX(); viewX();
    if (pos === 'first') touch('draft'); swapAt(GOB); if (pos === 'between') touch('draft');
    swapAt(LP); if (pos === 'last') touch('draft');
    viewX(); const live = fullOf(cardAt());
    bootX(); viewX(); const b1 = fullOf(cardAt()), c1 = chipFor(LP);
    ev('undoSwap(' + JSON.stringify(GOB) + ');'); viewX(); const u1 = fullOf(cardAt());
    bootX(); viewX(); const b2 = fullOf(cardAt()), c2 = chipFor(GOB);
    ev('undoSwap(' + JSON.stringify(DONOR) + ');'); viewX(); const u2 = fullOf(cardAt());
    bootX(); viewX(); const b3 = fullOf(cardAt()), r3 = recs();
    return { live, b1, c1, u1, b2, c2, u2, b3, r3 };
  }
  /** Row 6a: a swap and an undo on an untouched day write no ia_hist_ and leave the freeze cut alone. */
  function untouched(dated: boolean, clock: string, pair: string) {
    setup(dated); pin(CLOCKS[clock]); bootX(); bootX(); const cut0 = cutNow();
    const h0 = X.localStorage.getItem('ia_hist_PM');
    swapAt(PAIRS[pair].to); viewX(); const sw = cardAt().name === PAIRS[pair].to; const h1 = X.localStorage.getItem('ia_hist_PM');
    ev('undoSwap(' + JSON.stringify(DONOR) + ');'); viewX(); const un = cardAt().name === DONOR; const h2 = X.localStorage.getItem('ia_hist_PM');
    bootX(); const cut1 = cutNow();
    swapAt(PAIRS[pair].to); const h3 = X.localStorage.getItem('ia_hist_PM'); bootX(); const cut2 = cutNow();
    return { sw, un, histSame: h1 === h0 && h2 === h0 && h3 === h0, cuts: [cut0, cut1, cut2] };
  }
  /** Row 10: the record on a hist-restored day survives the boot byte for byte and the chip is offered. */
  function recordKept(t: string, ord: string) {
    setup(true); pin(CLOCKS.today); bootX(); viewX();
    if (ord === 'swap_then_touch') { swapAt(GOB); touch(t); } else if (ord === 'touch_then_swap') { touch(t); swapAt(GOB); } else { touch(t); swapAt(GOB); swapAt(LP); }
    const raw0 = X.localStorage.getItem('ia_swaps_PM'), snap = !!JSs('ia_hist_PM')[KEY], shown = ord === 'chain_lp' ? LP : GOB, origin = ord === 'chain_lp' ? GOB : DONOR;
    bootX(); viewX(); const raw1 = X.localStorage.getItem('ia_swaps_PM');
    return { snap, raw0, raw1, kept: !!JSON.parse(raw1 || '{}')[KEY], chip: chipFor(shown), card: cardAt().name, shown, origin };
  }
  return { cell, lattice, undoAfterReboot, addSkip, secondSwap, untouched, recordKept, DONOR_M, EXPG, EXPLP };
}

export {
  START, CLOCK, DAYS, clone, clean, JS, MARIO, withInj, CFGS, REGION,
  l1Cfg, l1All, BED_DONOR, floorPage, floorLattice,
  PREF_REGIONS, prefCfg, cards, prefPopulation,
  DUR, durableWorld,
  page, E, setup, boot, view, dayOf, sig, slotOf, Jget, putLS, reboot, dupName, hop,
  mulberry, hstr, shuffled,
  CLASSES, enumerate, runChains, inU, inUd, handChip, handStore, storeU, slotsOf,
  CUE, CAP, stripCue, cueIff,
  HAND_FLOOR, handFloor, GRAM, handRewrite, stripRep, handKind, T3, T119, TSAME, HOLD, T3H, T119H, TSAMEH,
  stripHold, holdHand, rpeHand, CONVERTS, bucketHand, capHand,
};
