// The Lift Ledger on the Progress screen, for tests/integration/ledger.test.ts and tests/integration/progress.test.ts.
//
// The app boots with a document that keeps its elements (tests/support/app.ts loadApp, so IA_APP is honoured) and its
// clock pinned. A store is built from a hand table of sessions, never from buildProgram: each session writes an ia_exw_
// entry and an ia_hist_ snapshot, a 'main' session as item 0 of a "Main — <name>" section (the slot rule: item 0 of a
// section whose label starts with Main, not a superset), an 'acc' session into an "Accessory" section. The one app
// function used to build a store is exStoreKey, the single writer of ia_exw_ keys, and only to key it.
// renderProgressScreen and openSwapSheet are called and what they wrote is read back.
import { loadApp, pinClock } from './app.ts';
import type { App, StorageStub } from './app.ts';
import type { Program } from '@ia/core';

const J = JSON.stringify;
export const PID = 'ledger';
/** The day every render sees as today (local noon, a Monday). */
export const TODAY = new Date(2026, 8, 14, 12, 0, 0);

/** One logged session of a hand table. */
export interface Session {
  week: number;
  day: string;
  slot: 'main' | 'acc';
  weight?: number;
  /** Reps per set. */
  sets?: number[];
  setsReps?: string;
  /** The prescription the session's snapshot carries. */
  detail?: string;
}
/** One movement of a hand table and its sessions. */
export interface Movement {
  name: string;
  sessions: Session[];
}
/** An ia_exw_ entry as the app stores it. */
export interface ExEntry {
  weight: number;
  setsReps: string;
  setsDone: number[];
  setsW: number[];
  week: number;
  day: string;
  ts: number;
}
/** An ia_hist_ snapshot: the day's sections as the athlete saw them. */
export interface HistDay {
  sections: { label: string; items: { name: string; detail: string }[] }[];
}
/** A built store: the ia_exw_ and ia_hist_ values and the store keys exStoreKey gave. */
export interface Store {
  exw: Record<string, { name: string; entries: ExEntry[] }>;
  hist: Record<string, HistDay>;
  keys: string[];
}
/** One row of ledgerModel's output, as plain data: its fields differ by bucket. */
export type LedgerRow = Record<string, any>;
/** ledgerModel's four buckets, as plain data. */
export interface LedgerModel {
  mains: LedgerRow[];
  ladder: LedgerRow[];
  plain: LedgerRow[];
  unloaded: LedgerRow[];
}

/** The ledger world ledgerBench() returns. */
export interface LedgerBench {
  IA: App;
  ev: App['eval'];
  LS: StorageStub;
  buildStore(table: Movement[]): Store;
  renderProgress(store: Store, unit?: string): string;
  model(store: Store): LedgerModel;
  swapTags(prog: Program, week: number | string, dayKey: string, secIdx: number, itemIdx: number): string;
}

export function ledgerBench(): LedgerBench {
  const IA = loadApp({ dom: true });
  pinClock(IA, TODAY);
  const ev = IA.eval;
  const LS = IA.localStorage;
  const resetDom = () => {
    for (const k of Object.keys(IA.els)) delete IA.els[k];
  };
  const html = (id: string): string => (IA.els[id] ? String(IA.els[id].innerHTML || '') : '');

  /**
   * A table in, an ia_exw_ and ia_hist_ pair out. A movement is {name, sessions}; a session is
   * {week, day, slot: 'main' | 'acc', weight, sets: [reps per set], setsReps, detail}.
   */
  function buildStore(table: Movement[]): Store {
    const exw: Store['exw'] = {};
    const hist: Store['hist'] = {};
    table.forEach((mv) => {
      const key: string = ev('exStoreKey(' + J(mv.name) + ')');
      const ex = exw[key] || (exw[key] = { name: mv.name, entries: [] });
      mv.sessions.forEach((s, i) => {
        ex.entries.push({
          weight: s.weight || 0, setsReps: s.setsReps || '', setsDone: (s.sets || []).slice(), setsW: [],
          week: s.week, day: s.day, ts: s.week * 1000 + i,
        });
        const hk = 'w' + s.week + '_' + s.day;
        const snap = hist[hk] || (hist[hk] = { sections: [] });
        if (s.slot === 'main') {
          snap.sections.unshift({ label: 'Main — ' + mv.name, items: [{ name: mv.name, detail: s.detail || '3×10' }] });
        } else {
          let acc = snap.sections.find((x) => x.label === 'Accessory');
          if (!acc) {
            acc = { label: 'Accessory', items: [] };
            snap.sections.push(acc);
          }
          acc.items.push({ name: mv.name, detail: s.detail || '3×8–12 @ RPE 8' });
        }
      });
    });
    return { exw, hist, keys: Object.keys(exw) };
  }

  /** Renders the real Progress screen against a store and returns what the athlete sees in #progressBody. */
  function renderProgress(store: Store, unit?: string): string {
    LS.clear();
    resetDom();
    const prog = {
      id: PID, name: 'LEDGER', archived: false, totalWeeks: 10, startDate: '2026-01-05', liftingFocus: 'balanced',
      cfg: { name: 'LEDGER', unit: unit || 'lbs', cardioTypes: [], liftingFocus: 'balanced', experience: 'intermediate' },
      weeks: {},
    };
    LS.setItem('ia_programs', J([prog]));
    LS.setItem('ia_exw_' + PID, J(store.exw));
    LS.setItem('ia_hist_' + PID, J(store.hist));
    // the screen shows an empty state unless something was logged
    LS.setItem('ia_logs_' + PID, J({ w1_mon: { rpe: 7, ts: 1 } }));
    ev("activeProgId='" + PID + "'");
    ev('activeProg=' + J(prog));
    ev('progressViewId=null');
    ev('renderProgressScreen()');
    return html('progressBody');
  }

  /** ledgerModel over a store, as plain data. */
  const model = (store: Store): LedgerModel => JSON.parse(ev('JSON.stringify(ledgerModel(' + J(store.exw) + ',' + J(store.hist) + '))'));

  /** Opens the swap sheet on one item of `prog` and returns the tags it printed. */
  function swapTags(prog: Program, week: number | string, dayKey: string, secIdx: number, itemIdx: number): string {
    resetDom();
    ev("activeProgId='" + PID + "'");
    ev('activeProg=' + J(prog));
    ev('currentWeek=' + week);
    ev("currentDayKey='" + dayKey + "'");
    ev('openSwapSheet(' + secIdx + ',' + itemIdx + ')');
    return html('swapTags');
  }

  return { IA, ev, LS, buildStore, renderProgress, model, swapTags };
}

// ── readers of the rendered Progress screen ──────────────────────────────────────────────────────────────────────────
// A card opens on its surface fill and its padding; its outline and corner are the look's and may change (D263 moved both).
const CARD_OPEN = /<div style="background:var\(--surface\);border:[^;"]*;border-radius:[^;"]*;padding:14px 16px">/;
const BLOCK_OPEN = '<div style="padding:12px 0;border-bottom:1px solid var(--border)">';
const FOOT_OPEN = '<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">';
export const cards = (h: string): string[] => h.split(CARD_OPEN).slice(1);
/** The card whose title is `title`, or ''. */
export const cardTitled = (h: string, title: string): string => cards(h).find((c) => c.slice(0, 900).includes(title + '</div>')) || '';
export const blocks = (card: string): string[] => card.split(BLOCK_OPEN).slice(1);
/** The block of the movement `name` on a card, or ''. */
export const blockFor = (card: string, name: string): string => blocks(card).find((b) => b.includes('>' + name + '</div>')) || '';
/** The card's footer, from its last footer opener. */
export const footerOf = (card: string): string => {
  const k = card.lastIndexOf(FOOT_OPEN);
  return k < 0 ? '' : card.slice(k);
};
export const countOf = (s: string, needle: string): number => s.split(needle).length - 1;
export const textOf = (h: unknown): string => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
/** The week labels a chart printed on its x axis, in order. */
export const weekLabels = (block: string): number[] => (block.match(/>W(\d+)</g) || []).map((s) => +s.replace(/\D/g, ''));
/** The two numbers a footer discloses: [accessory-day sessions, sessions with no load], read from its words. */
export function disclosed(foot: string): [number, number] {
  const a = foot.match(/(\d+) sessions? where this ran as an accessory/);
  const b = foot.match(/(\d+) sessions? had no load written down/);
  return [a ? +(a[1] ?? 0) : 0, b ? +(b[1] ?? 0) : 0];
}

/** One hand row of a Range Ladder log. */
export interface LadderRow {
  name: string;
  week: number;
  day: string;
  ts: number;
  weight: number;
  sets: number[];
  detail: string;
}
/**
 * A Range Ladder log from hand rows {name, week, day, ts, weight, sets, detail}: the entries for one movement and the
 * ia_hist_ snapshots that carry each session's prescription in an "Accessory" section.
 */
export function ladderLog(rows: LadderRow[]): { hist: Record<string, HistDay>; entries: Record<string, unknown>[] } {
  const hist: Record<string, HistDay> = {};
  const entries: Record<string, unknown>[] = [];
  rows.forEach((r) => {
    hist['w' + r.week + '_' + r.day] = { sections: [{ label: 'Accessory', items: [{ name: r.name, detail: r.detail }] }] };
    entries.push({ week: r.week, day: r.day, ts: r.ts, weight: r.weight, setsDone: r.sets });
  });
  return { hist, entries };
}
