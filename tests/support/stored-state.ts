// Golden records of what the app stores (MIGRATION.md, phase 1): a whole history driven through today's page in the VM
// harness, then every ia_ key exactly as stored, and the grid refreshProgram hands back at the last boot.
//
// The history is driven through the app's own entry points, the ones a tap reaches: doGenerate, init (a launch),
// openDayKey, autoSaveSets and saveExWeight (a lift), handleDayStatus (the run and the day), skipPart, applySwapChoice,
// skipExercise, applyAddChoice, applyInjuryDraft, imBackFromInjury, applyOverlayDraft (travel), applyRestMove,
// completeWildcard, backupSnapshot and loadBackupData. Nothing here writes a key itself, and nothing reimplements app
// logic: the walker only chooses which card to tap, from what the program holds.
//
// Every launch is a fresh VM that inherits only the storage, as a cold start does. The clock is pinned per launch, and
// the caller pins the time zone (process.env.TZ) before a history starts: a log's ts is an instant, so the same local
// morning is a different number in another zone, and the records are keyed by the zone they were made in.
// Math.random is pinned too, to one fixed sequence per launch: the completion pop-up picks its line with it and stores
// the pick (ia_pop_idx_, ia_pop_dismiss_), the one thing two runs of a history otherwise disagree on.
import { createHash } from 'node:crypto';
import type { Cfg, DayKey } from '@ia/core';
import { loadApp, pinClock, progDigest } from './app.ts';
import type { App } from './app.ts';

const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const pad = (n: number): string => String(n).padStart(2, '0');

/** One stored key: its exact size and hash, and its parsed value where a person can read a diff of it. */
export interface KeyRecord { bytes: number; sha256: string; value?: unknown }
/** What a history left behind. */
export interface StateRecord {
  /** Every ia_ key, sorted. ia_programs and ia_hist_ are held by size and hash alone (they are the grid, many KB). */
  keys: Record<string, KeyRecord>;
  /** Each stored program: its id, length, overlays and the digest of its stored grid. */
  programs: { id: string; totalWeeks: number; startDate: string | null; overlays: number; digest: string }[];
  /** The grid the last launch handed back (refreshProgram): its digest, and the hash of its weeks as JSON. */
  live: { week: number; digest: string; weeksSha256: string } | null;
}

/** A field of the stub page the app reads a value from. */
interface Field { id: string; value: string; placeholder: string; dataset: Record<string, string>; classList: { add(): void; remove(): void; contains(): boolean }; textContent: string }

/** One athlete's phone: storage that outlives launches, and the page of the current launch. */
export class Phone {
  IA!: App;
  private store = new Map<string, string>();
  private fields = new Map<string, Field>();
  /** Every toast this launch showed, in order (the walker reads refusals from it). */
  toasts: string[] = [];
  /** `file`: another body of the app (a past release's page), for the backup corpus. Default: the page under test. */
  private readonly file: string | undefined;
  constructor(file?: string) { this.file = file; }
  /**
   * Where every phone keeps its storage, when set: a fresh map per launch, which the stored keys are copied into, as
   * the harness's own map is. Null is the harness's plain map. support/sqlite-phone.ts sets it to the Expo app's SQLite
   * store, so the page's every localStorage call, and every record, goes through SQLite.
   */
  static storage: (() => Map<string, string>) | null = null;

  /** A cold start at `at` (a local date and time): a fresh page over the stored keys, then the app's own init. */
  launch(at: string, opts: { init?: boolean } = {}): this {
    const IA = loadApp(this.file ? { dom: true, file: this.file } : { dom: true });
    if (Phone.storage) {
      // The page asks for localStorage at every call (storageStore), so these stand in from its next call on.
      const m = Phone.storage(), ls = IA.localStorage;
      ls.getItem = (k) => { const v = m.get(String(k)); return v === undefined ? null : v; };
      ls.setItem = (k, v) => { m.set(String(k), String(v)); };
      ls.removeItem = (k) => { m.delete(String(k)); };
      ls.clear = () => { m.clear(); };
      ls.key = (i) => [...m.keys()][i] ?? null;
      Object.defineProperty(ls, 'length', { get: () => m.size, configurable: true });
      ls._map = m;
    }
    pinClock(IA, at);
    IA.eval('Math.random=(function(){var s=20261111;return function(){s=(s*1664525+1013904223)%4294967296;return s/4294967296;};})();');
    IA.localStorage.clear();
    for (const [k, v] of this.store) IA.localStorage.setItem(k, v);
    this.store = IA.localStorage._map;
    this.IA = IA;
    this.fields = new Map();
    this.toasts = [];
    const doc = IA.window['document'];
    const base = doc.getElementById;
    // A field the walker filled answers by its id. The set and weight inputs of a card exist only while the walker
    // has placed them: the app counts a card's sets by asking for the next one until none answers.
    // Any other element is the harness's stub; a part looked up inside it (a chip's button) is a stub too, so a
    // render that wires a handler onto it runs through instead of stopping the function that just wrote storage.
    const make = doc.createElement;
    const inner = (el: any) => { if (el && !el.__inner) { el.__inner = true; el.querySelector = () => make('div'); } return el; };
    doc.createElement = (tag: string) => inner(make(tag));
    const stub = (id: string) => inner(base(id));
    doc.getElementById = (id: string) => this.fields.get(id) ?? (/^(exset_|exsetw_|exw_)/.test(id) ? null : stub(id));
    doc.querySelectorAll = (sel: string) => {
      const m = /^input\[id\^="([^"]+)"\]$/.exec(sel);
      return m ? [...this.fields.values()].filter((f) => f.id.startsWith(m[1]!)) : [];
    };
    IA.ctx['__toasts'] = this.toasts;
    IA.eval('showToast=(function(o){return function(m){__toasts.push(String(m));return o.apply(this,arguments);};})(showToast);');
    if (opts.init !== false) IA.eval('init()');
    return this;
  }

  ev(code: string): any { return this.IA.eval(code); }
  /** Runs what the app queued (its timers and frames), as time passing does. */
  settle(): void { this.IA.flushTimers(200); }

  /** Places a field with a value, as a typed input holds one. */
  type(id: string, value: string, touched = false): void {
    this.fields.set(id, { id, value, placeholder: '', dataset: touched ? { touched: '1' } : {}, classList: { add() {}, remove() {}, contains: () => false }, textContent: '' });
  }
  clearFields(): void { this.fields.clear(); }

  /** The wizard's last tap: the app's own doGenerate over this config, its timers run. Returns the new program's id. */
  generate(cfg: Cfg): string {
    this.IA.ctx['__WD'] = JSON.parse(JSON.stringify(cfg));
    this.ev('Object.keys(WD).forEach(function(k){delete WD[k];});Object.assign(WD,__WD);doGenerate();');
    this.settle();
    const id = this.ev('activeProgId');
    if (!id) throw new Error('doGenerate stored no program: ' + this.toasts.join(' | '));
    return id;
  }

  get prog(): any { return this.ev('activeProg'); }
  day(w: number, d: DayKey): any { return this.ev(`activeProg&&activeProg.weeks&&activeProg.weeks[${w}]&&activeProg.weeks[${w}].${d}`); }
  /** Opens a day the way a tap on its card does. */
  open(w: number, d: DayKey): void { this.clearFields(); this.ev(`currentWeek=${w};openDayKey(${JSON.stringify(d)});`); this.settle(); }

  /** Logs one lift card: each set's reps and weight typed, the draft autosaved, then Log. */
  logLift(name: string, detail: string, reps: number[], weights: number[]): void {
    const key: string = this.ev(`exStoreKey(${JSON.stringify(name)})`);
    reps.forEach((r, i) => this.type(`exset_${key}_${i}`, String(r)));
    weights.forEach((w, i) => this.type(`exsetw_${key}_${i}`, String(w)));
    if (weights.length) this.type(`exw_${key}`, String(Math.max(...weights)));
    this.ev(`autoSaveSets(${JSON.stringify(key)});saveExWeight(${JSON.stringify(key)},${JSON.stringify(name)},${JSON.stringify(detail)},true);`);
    for (const id of [...this.fields.keys()]) if (id.includes(key)) this.fields.delete(id);
  }

  /** Marks the open day, with whatever log fields were typed first. */
  mark(d: DayKey, status: 'complete' | 'skipped'): void {
    const title = this.ev(`(function(){var x=activeProg.weeks[currentWeek][${JSON.stringify(d)}];return (x&&x.title)||null;})()`);
    this.ev(`handleDayStatus(${JSON.stringify(d)},${JSON.stringify(title)},${JSON.stringify(status)});`);
    this.settle();
  }

  /** The record: every ia_ key as stored, the stored programs, and the grid in hand. */
  record(): StateRecord {
    const keys: Record<string, KeyRecord> = {};
    for (const k of [...this.store.keys()].filter((x) => x.startsWith('ia_')).sort()) {
      const v = this.store.get(k)!;
      const rec: KeyRecord = { bytes: Buffer.byteLength(v, 'utf8'), sha256: sha256(v) };
      if (k !== 'ia_programs' && !k.startsWith('ia_hist_')) {
        try { rec.value = JSON.parse(v); } catch { rec.value = v; }
      }
      keys[k] = rec;
    }
    let programs: StateRecord['programs'] = [];
    try {
      programs = (JSON.parse(this.store.get('ia_programs') || '[]') as any[]).map((p) => ({
        id: p.id, totalWeeks: p.totalWeeks, startDate: p.startDate ?? null, overlays: Array.isArray(p.overlays) ? p.overlays.length : 0,
        digest: p.weeks ? progDigest(p) : 'no grid',
      }));
    } catch { programs = []; }
    const live = this.prog;
    return {
      keys, programs,
      live: live && live.weeks ? { week: this.ev('calcCurrentWeek()'), digest: progDigest(live), weeksSha256: sha256(JSON.stringify(live.weeks)) } : null,
    };
  }

  /** The stored keys as a plain object, for a test that compares two phones. */
  dump(): Record<string, string> { return Object.fromEntries([...this.store.entries()].filter(([k]) => k.startsWith('ia_')).sort()); }
  /** Writes a raw value under a key, for the hostile cases only (damage no code path of the app makes). */
  damage(key: string, value: string | null): void { if (value === null) this.store.delete(key); else this.store.set(key, value); }
}

/** `iso` plus `days`, at `hh:mm`, as the local date and time pinClock takes. */
export function at(iso: string, days: number, time = '18:00'): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const x = new Date(y, m - 1, d + days);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${time}:00`;
}
/** The Monday of the week `iso` falls in. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const x = new Date(y, m - 1, d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

interface Card { name: string; detail: string; secIdx: number; itemIdx: number; sets: number; reps: number }
/** The cards of a day that prescribe sets of reps (N×M), in order: what the walker can log, swap and skip. */
function cards(day: any): Card[] {
  const out: Card[] = [];
  (day?.sections || []).forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => {
    const m = /(\d+)\s*[×x]\s*(\d+)/.exec(String(it.detail || ''));
    if (m && it.name && !it._skipped) out.push({ name: it.name, detail: it.detail, secIdx: si, itemIdx: ii, sets: Math.min(+m[1]!, 6), reps: +m[2]! });
  }));
  return out;
}
const training = (P: Phone, w: number): DayKey[] => DAYS.filter((d) => { const x = P.day(w, d); return x && !x.rest && Array.isArray(x.sections) && x.sections.length; });
const resting = (P: Phone, w: number): DayKey[] => DAYS.filter((d) => { const x = P.day(w, d); return x && x.rest; });

/** One training day, opened and logged: up to two lifts, the run if the day carries one, then marked. */
function trainDay(P: Phone, w: number, d: DayKey, n: number, status: 'complete' | 'skipped' = 'complete'): void {
  P.open(w, d);
  const day = P.day(w, d);
  if (status === 'complete') {
    cards(day).slice(0, 2).forEach((c, i) => {
      const weights = Array.from({ length: c.sets }, (_, s) => 95 + 10 * i + 5 * s + 5 * n);
      P.logLift(c.name, c.detail, Array.from({ length: c.sets }, (_, s) => Math.max(1, c.reps - (s === c.sets - 1 ? 1 : 0))), weights);
    });
    // Only the fields the day's own sport shows.
    const sport = day.cardio && day.cardio.type;
    if (sport === 'run') { P.type('log_run_dist', (3 + n * 0.5).toFixed(1)); P.type('log_run_mins', String(28 + 4 * n)); }
    if (sport === 'bike') P.type('log_bike_mins', String(40 + 5 * n));
    if (sport === 'swim') P.type('log_swim_yards', String(800 + 100 * n));
    P.type('log_rpe', String(6 + (n % 3)), true);
  }
  P.type('log_notes', n === 1 ? 'Felt strong 💪, slept 7 h' : status === 'skipped' ? 'Travel day' : '');
  P.mark(d, status);
}

/** The first whole week a program created at `createdAt` can be trained in: its current week, or the next if that one has begun. */
export function firstWeek(P: Phone, createdAt: string): { first: number; start: string } {
  const start = mondayOf(P.prog.startDate || createdAt.slice(0, 10));
  const now: number = P.ev('calcCurrentWeek()');
  const begun = at(start, 7 * (now - 1), '00:00') < createdAt;   // this week's Monday is already behind the creation
  return { first: begun ? now + 1 : now, start };
}

export { cards, training, resting, trainDay, DAYS };

/**
 * The standard history, the same walk over any program: five stretches, a record after each, so a difference names
 * where it began. Weeks are counted from the first whole week after the program was made, and every launch is dated
 * from the program's own first Monday, so time only moves forward. `each` is called after each record, with the phone.
 */
export function life(cfg: Cfg, createdAt: string, file?: string, each?: (stage: string, P: Phone) => void): { records: Record<string, StateRecord>; phone: Phone } {
  const P = new Phone(file).launch(createdAt);
  P.generate(cfg);
  const { first, start } = firstWeek(P, createdAt);
  const A = first, B = first + 1, C = first + 2;
  const day0 = (w: number) => 7 * (w - 1);
  const records: Record<string, StateRecord> = {};
  // Each stretch's record, then `each`, for a test that reads the phone as that launch left it (This Week in the Expo app).
  const mark = (stage: string): void => { records[stage] = P.record(); if (each) each(stage, P); };
  mark('0 generated');

  // The first week: three days trained, one skipped, a swap, a skipped move and an added one, one part skipped alone.
  const wa = training(P.launch(at(start, day0(A), '06:30')), A);
  wa.slice(0, 5).forEach((d, i) => {
    P.launch(at(start, day0(A) + DAYS.indexOf(d)));
    if (i === 1) {
      P.open(A, d);
      const c = cards(P.day(A, d))[0];
      if (c) {
        P.IA.ctx['__c'] = { secIdx: c.secIdx, itemIdx: c.itemIdx, name: c.name, detail: c.detail };
        const to: string | null = P.ev(`(function(){var day=activeProg.weeks[${A}][${JSON.stringify(d)}];var r=swapCandidates(__c.name,day,${A},activeProg);var l=[].concat(r.tier1||[],r.tier2||[]);var x=l[0];return x?(x.name||x):null;})()`);
        if (to) P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(to)});`);
      }
    }
    if (i === 2) {
      P.open(A, d);
      const cs = cards(P.day(A, d));
      if (cs.length > 2) P.ev(`skipExercise(${JSON.stringify(cs[cs.length - 1]!.name)});`);
      // The first move the add sheet itself offers for this day.
      const add: string | null = P.ev(`(function(){var c=addCandidates(activeProg.weeks[${A}][${JSON.stringify(d)}],${A},activeProg);return (c.more||[])[0]||(c.gap||[])[0]||null;})()`);
      if (add) P.ev(`applyAddChoice(${JSON.stringify(add)});`);
    }
    if (i === 4) { P.open(A, d); P.ev(`(function(){var p=dayPartsOf(${A},${JSON.stringify(d)});if(p.length>1)skipPart(${A},${JSON.stringify(d)},p[p.length-1]);})()`); return; }
    trainDay(P, A, d, i, i === 3 ? 'skipped' : 'complete');
  });
  mark('1 first week');

  // The second week: an injury flagged, a day trained, a rest day's session moved, travel booked, a Wildcard done.
  P.launch(at(start, day0(B), '07:00'));
  P.ev(`_ovDraft.injRegion='knee';_ovDraft.injTier='workaround';_ovDraft.from=${JSON.stringify(at(start, day0(B)).slice(0, 10))};applyInjuryDraft();`);
  const wb = training(P, B);
  if (wb[0]) { P.launch(at(start, day0(B) + DAYS.indexOf(wb[0]))); trainDay(P, B, wb[0], 5); }
  // On the week's first rest day that has a session after it, that session is moved onto it (the rest sheet's Move).
  const rest = resting(P, B).find((r) => wb.some((d) => DAYS.indexOf(d) > DAYS.indexOf(r)));
  if (rest) {
    P.launch(at(start, day0(B) + DAYS.indexOf(rest), '10:00'));
    P.ev(`openRestSheet(${B},${JSON.stringify(rest)},'move');`);
    const later = wb.filter((d) => DAYS.indexOf(d) > DAYS.indexOf(rest));
    if (P.ev(`_restDraft.w===${B}&&_restDraft.view==='move'`)) { P.ev(`_rdSet('pick',${JSON.stringify(later[later.length - 1])});applyRestMove();`); P.settle(); }
  }
  P.ev(`_ovDraft.equipment='minimal';_ovDraft.from=${JSON.stringify(at(start, day0(C)).slice(0, 10))};_ovDraft.to=${JSON.stringify(at(start, day0(C) + 4).slice(0, 10))};applyOverlayDraft();`);
  P.ev(`completeWildcard('Golden record wildcard');`);
  mark('2 second week');

  // The third week: back from the injury, a day trained under travel, an earlier week's lift logged again.
  P.launch(at(start, day0(C) + 2, '19:15'));
  P.ev(`(function(){var o=(activeProg.overlays||[]).filter(function(x){return x.type==='injury'||x.injury||x.region;})[0];if(o)imBackFromInjury(o.id);})()`);
  const wc = training(P, C);
  if (wc[0]) trainDay(P, C, wc[0], 7);
  const past = wa[0] && cards(P.day(A, wa[0]))[0];
  if (past && wa[0]) { P.open(A, wa[0]); P.logLift(past.name, past.detail, [past.reps, past.reps], [185, 190]); }
  mark('3 third week');

  // Two weeks unopened, then a launch: the freeze catches up. A Wednesday, on purpose: on a Monday after the clocks
  // have gone forward the app reads the week before (the defect tests/integration/stored-state.test.ts holds), which
  // is Auckland's case here (2026-09-27), and this history is the same walk in every zone.
  P.launch(at(start, day0(C) + 23, '08:00'));
  mark('4 after two weeks away');
  return { records, phone: P };
}

/** Records with the readable values kept on the last stretch only; the earlier ones keep each key's size and hash. */
export function slim(records: Record<string, StateRecord>): Record<string, StateRecord> {
  const names = Object.keys(records);
  const out: Record<string, StateRecord> = {};
  names.forEach((n, i) => {
    const r = records[n]!;
    out[n] = i === names.length - 1 ? r : { ...r, keys: Object.fromEntries(Object.entries(r.keys).map(([k, v]) => [k, { bytes: v.bytes, sha256: v.sha256 }])) };
  });
  return out;
}
