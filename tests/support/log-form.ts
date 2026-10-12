// The day card's log form, driven the way the athlete drives it on the phone, for tests/integration/logging.test.ts
// and tests/sweeps/logging.test.ts.
//
// The app boots in the VM harness (tests/support/app.ts loadApp, so IA_APP is honoured). On top of it:
//   - a virtual clock: new Date() and Date.now() read VNOW (Monday 2026-09-21 10:00 local until a test moves it), and
//     every setTimeout, setInterval and requestAnimationFrame is queued and RUN by advance(ms), in time order;
//   - a document whose getElementById keeps one node per id. Writing #detailBody's or #cardioFields' innerHTML parses
//     the markup: every element with an id becomes a node carrying its value and data-* attributes, and every wheel
//     (.iaw) becomes columns of rows. A column's scrollTop setter dispatches 'scroll', as a browser does for a scripted
//     scrollTop, so the wheels' seed frame, settle and commit run for real. A #cardioFields re-render (a sport chip)
//     drops the cardio nodes it replaced, as the real DOM does;
//   - doseFromCardio wrapped so a test can force a dose (null included) onto the open path; unforced it is the app's;
//   - buildDotChart wrapped so a test can read the Progress charts' series.
// Nothing here reimplements app logic: the app's own openDayKey, wheels, logCardio, handleDayStatus, rest sheet and
// readers run, and the test reads back what they rendered and stored.
import type * as VM from 'node:vm';
import type { DayKey, Program } from '@ia/core';
import { loadApp } from './app.ts';
import type { App, StorageStub } from './app.ts';

/** A node of the stub document: the app's untyped script reads and writes it freely. */
type Stub = any;

/** One row of a wheel column: its value and the face it shows. */
export interface WheelRow {
  v: string;
  face: string;
  style: Record<string, string>;
  getAttribute(k: string): string | null;
}
/** One column of a wheel; its scrollTop setter dispatches 'scroll', as a browser does. */
export interface WheelColumn {
  style: Record<string, string>;
  _lis: Record<string, (() => void)[]>;
  items: WheelRow[];
  wrap: string;
  len: string;
  getAttribute(k: string): string | null;
  querySelectorAll(s: string): WheelRow[];
  addEventListener(t: string, fn: () => void): void;
  scrollTop: number;
}
/** A wheel parsed out of the rendered form (.iaw): its columns, kind, hidden input and plan. */
export interface Wheel {
  _cols: WheelColumn[];
  kind: string;
  hid: string;
  plan: string | null;
  getAttribute(k: string): string | null;
  querySelectorAll(s: string): WheelColumn[];
}
/** A sport as mkCfg takes it: [type, goal id, extra goal fields]. */
export type SportSpec = [string, string, Record<string, string>?];
/** A column roll: [column index, the row value to land on]. */
export type Roll = [number, string];
/** A run dose as the hand oracles write it. */
export interface Dose {
  k: string;
  mins?: number;
  mi?: number;
  tgt?: number;
  key?: string;
  reps?: number;
}
/** What readForm reads off a rendered run form. */
export interface FormRead {
  numBox: number;
  hidden: (string | undefined)[];
  wheels: { kind: string; hid: string; plan: string | undefined }[];
  wraps: string[];
  labels: string[];
  subs: string[];
  caps: string[];
}

/** The log form world logForm() returns: the athlete's gestures and the readers. */
export interface LogForm {
  IA: App;
  ev: App['eval'];
  LS: StorageStub;
  els: Record<string, Stub>;
  advance(ms: number): void;
  errs: string[];
  ctx: VM.Context;
  INPUTS: Record<string, number>;
  id: string;
  wheels(): Wheel[];
  now(): number;
  setNow(t: number): void;
  /** Noon (or hour h) of day d in week w, the program starting Monday 2026-09-21 (hand date arithmetic). */
  at(w: number, d: string, h?: number): number;
  /** Forces doseFromCardio to return `dose` (null included) on the open path. */
  force(dose: unknown): void;
  unforce(): void;
  /** The app's own dose for a cardio session. */
  dose(c: unknown): any;
  build(cfg: object): Program;
  /** Stores `p` as the only program, active, starting Monday 2026-09-21, with an empty store, and shows This Week. */
  use(p: object): Program;
  logs(): string;
  /** The stored entry for week w, day d, read raw (no lens), or null. */
  entry(w: number, d: string): any;
  setLog(w: number, d: string, entry: unknown): void;
  histRaw(): string | null;
  hist(w: number, d: string): boolean;
  /** Empties the store but the program. */
  wipe(): void;
  /** Opens week w, day d on the day card and lets it settle. */
  open(w: number, d: string): void;
  back(): void;
  inputs(): number;
  resetInputs(): void;
  /** The rendered cardio form's markup on the open day card. */
  form(): string;
  face(wh: Wheel): string;
  faceText(wh: Wheel | null): string;
  colValue(wh: Wheel, ci: number): string;
  wheel(hid: string): Wheel | null;
  need(hid: string): Wheel;
  rollAt(wh: Wheel, pairs: Roll[], ms: number): void;
  roll(wh: Wheel, pairs: Roll[]): void;
  moveTo(hid: string, pairs: Roll[]): void;
  /** Done ('complete'), Skip ('skipped'), or the same status again to undo it. */
  tap(d: string, s: string): void;
  status(w: number, d: string): any;
  log(): void;
  tapLogButton(): void;
  toast(): string;
  clearToast(): void;
  label(): string;
  logged(): string | undefined;
  rpe(v: string | number): void;
  note(v: string): void;
  type(k: string, v: string): void;
  chip(sport: string): void;
  /** The chart's value for week w after a fresh render (the app's own number, untyped). */
  chart(title: string, w: number): { drawn: boolean; v: any };
  nudge(): boolean;
  derived(): string;
  hidden(k: string): string;
}

/** A queued callback on the virtual clock. */
interface Timer {
  fn: () => void;
  at: number;
  every: number;
}

const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const ROW_PX = 44; // one wheel row (the app's _IAW_ROW)
const START = '2026-09-21'; // a Monday: every program is stored as starting here
const J = JSON.stringify;
const RealDate = Date;

/** A config the way the wizard writes one: sports [[type, goal id, extra goal fields?]], focus, experience, equipment. */
function mkCfg(sports: SportSpec[], focus: string, experience: string, equipment: string, seed: number, restDays = ['sun', 'wed']) {
  const race = sports.some((s) => /^run_(5k|10k|half|marathon)$/.test(s[1]));
  const goals: Record<string, Record<string, string>> = {};
  for (const s of sports) {
    goals[s[0]] = s[0] === 'run'
      ? Object.assign({ id: s[1], label: s[1], mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, s[2] || {})
      : Object.assign({ id: s[1], label: s[1] }, s[2] || {});
  }
  return {
    name: 'L', primaryPath: /^support_/.test(focus) ? 'event' : 'goal', cardioTypes: sports.map((s) => s[0]), cardioGoals: goals,
    eventTargeted: race, raceDate: race ? '2026-12-20' : null, liftingFocus: focus, experience, ageBracket: '18-35', equipment,
    unit: 'lbs', restDays: restDays.slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed,
  };
}

/** The single (non-array) cardio session on a day, or null. */
const cardioOf = (x: any): any => (x && !x.rest && x.cardio && !Array.isArray(x.cardio) ? x.cardio : null);
/** The day's cardio type in lower case, or ''. */
const sportOf = (x: any) => String((cardioOf(x) || {}).type || '').toLowerCase();
/** Week numbers of a program in order. */
const weeksOf = (p: { weeks: object }) => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);

/** h:mm:ss for a number of minutes, by hand: round to the second. */
const hmsFace = (mins: number) => {
  const t = Math.round(mins * 60);
  return Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
};
/** w.hh for a number of miles, by hand: the dist wheel truncates past hundredths. */
const miFace = (mi: number) => {
  const hd = Math.floor(Math.round(mi * 1000) / 10);
  return Math.floor(hd / 100) + '.' + String(hd % 100).padStart(2, '0');
};
/** m:ss/mi from seconds over miles, by hand: whole seconds per mile, rounded. */
const paceHand = (sec: number, mi: number) => {
  const t = Math.round(sec / mi);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') + '/mi';
};

/** Boots the app with the log form environment. `id` is the stored program's id (ia_logs_<id>). */
function logForm(id = 'logging'): LogForm {
  const IA = loadApp();
  const ctx = IA.ctx;
  const ev = IA.eval;
  const LS = IA.localStorage;

  // ── the virtual clock ────────────────────────────────────────────────────────────────────────────────────────────
  let VNOW = new RealDate(2026, 8, 21, 10).getTime();
  class FD extends RealDate {
    constructor(...a: unknown[]) {
      if (a.length) super(...(a as [string]));
      else super(VNOW);
    }
    static override now() {
      return VNOW;
    }
  }
  ctx.Date = FD;
  ctx.performance = { now: () => VNOW };
  let tid = 1;
  const T = new Map<number, Timer>();
  const errs: string[] = [];
  const sched = (fn: () => void, ms: number, every: number) => {
    const t = tid++;
    T.set(t, { fn, at: VNOW + Math.max(0, +ms || 0), every });
    return t;
  };
  ctx.setTimeout = (fn: () => void, ms: number) => sched(fn, ms, 0);
  ctx.setInterval = (fn: () => void, ms: number) => sched(fn, ms, Math.max(1, +ms || 1));
  ctx.requestAnimationFrame = (fn: (t: number) => void) => sched(() => fn(VNOW), 16, 0);
  ctx.clearTimeout = (t: number) => T.delete(t);
  ctx.clearInterval = (t: number) => T.delete(t);
  ctx.cancelAnimationFrame = (t: number) => T.delete(t);
  if (ctx.window && ctx.window !== ctx) {
    Object.assign(ctx.window, {
      setTimeout: ctx.setTimeout, setInterval: ctx.setInterval, clearTimeout: ctx.clearTimeout, clearInterval: ctx.clearInterval,
      requestAnimationFrame: ctx.requestAnimationFrame, performance: ctx.performance, Date: FD,
    });
  }
  /** Runs every timer due in the next `ms` of virtual time, in time order. */
  const advance = (ms: number) => {
    const end = VNOW + ms;
    for (let n = 0; n < 200000; n++) {
      let b: [number, Timer] | null = null;
      for (const [k, t] of T) if (t.at <= end && (!b || t.at < b[1].at)) b = [k, t];
      if (!b) break;
      const [k, t] = b;
      VNOW = t.at;
      if (t.every) t.at += t.every;
      else T.delete(k);
      try {
        t.fn();
      } catch (e) {
        errs.push((e as Error).message);
      }
    }
    VNOW = end;
  };
  if (ev('typeof Event') === 'undefined') ctx.Event = class { type: string; constructor(t: string) { this.type = t; } };

  // ── the document ─────────────────────────────────────────────────────────────────────────────────────────────────
  const els: Record<string, Stub> = {};
  let WHEELS: Wheel[] = [];
  let parsedIds = new Set<string>();
  const INPUTS: Record<string, number> = {};
  const unq = (s: string) => s.replace(/&quot;/g, '"');
  function mk(nodeId: string): Stub {
    const cls = new Set<string>();
    const lis: Record<string, ((e: Stub) => void)[]> = {};
    const e: Stub = {
      id: nodeId, value: '', textContent: '', style: {}, dataset: {}, children: [], offsetWidth: 0, offsetHeight: 0, offsetTop: 0,
      offsetLeft: 0, scrollTop: 0, _html: '',
      classList: {
        add: (...c: string[]) => c.forEach((x) => cls.add(x)),
        remove: (...c: string[]) => c.forEach((x) => cls.delete(x)),
        toggle: (c: string, f?: boolean) => {
          const on = f === undefined ? !cls.has(c) : !!f;
          if (on) cls.add(c);
          else cls.delete(c);
          return on;
        },
        contains: (c: string) => cls.has(c),
      },
      addEventListener: (t: string, fn: (e: Stub) => void) => { (lis[t] = lis[t] || []).push(fn); },
      removeEventListener() {},
      dispatchEvent: (evt: { type: string }) => {
        if (evt.type === 'input') INPUTS[nodeId] = (INPUTS[nodeId] || 0) + 1;
        (lis[evt.type] || []).forEach((f) => f({ target: e, currentTarget: e, type: evt.type }));
        return true;
      },
      setAttribute() {}, getAttribute() { return null; }, appendChild() {}, removeChild() {}, remove() {}, insertAdjacentHTML() {},
      querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, setPointerCapture() {},
      getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; },
      scrollIntoView() {}, focus() {}, blur() {},
      get className() { return [...cls].join(' '); },
      set className(v: string) {
        cls.clear();
        String(v).split(/\s+/).filter(Boolean).forEach((x) => cls.add(x));
      },
    };
    if (nodeId === 'detailBody' || nodeId === 'cardioFields') {
      Object.defineProperty(e, 'innerHTML', {
        get() { return e._html; },
        set(v: unknown) {
          e._html = String(v);
          reparse(e._html, nodeId === 'detailBody');
        },
      });
    } else e.innerHTML = '';
    if (nodeId === 'detailOverlay') e.querySelectorAll = (s: string) => (s === '.iaw-col' ? ([] as WheelColumn[]).concat(...WHEELS.map((w) => w._cols)) : []);
    return e;
  }
  function reparse(html: string, full: boolean) {
    if (full) {
      for (const k of parsedIds) delete els[k];
      parsedIds = new Set();
    } else {
      // a #cardioFields re-render replaces the cardio nodes it held
      for (const k of [...parsedIds]) if (/^log_(run|bike|swim)_/.test(k)) { delete els[k]; parsedIds.delete(k); }
    }
    const re = /<(\w+)([^>]*?)\sid="([^"]+)"([^>]*)>/g;
    let m;
    while ((m = re.exec(html))) {
      const nodeId = m[3];
      const attrs = m[2] + ' ' + m[4];
      if (nodeId === 'detailBody' || nodeId === 'cardioFields') continue;
      const el = mk(nodeId);
      const vm = attrs.match(/\svalue="([^"]*)"/);
      if (vm) el.value = unq(vm[1] as string);
      let dm: RegExpExecArray | null;
      const dre = /\sdata-([a-z]+)="([^"]*)"/g;
      while ((dm = dre.exec(attrs))) el.dataset[dm[1] as string] = unq(dm[2] as string);
      els[nodeId] = el;
      parsedIds.add(nodeId);
    }
    WHEELS = parseWheels(html);
  }
  function parseWheels(html: string): Wheel[] {
    const out: Wheel[] = [];
    for (const p of html.split('<div class="iaw" ').slice(1)) {
      const head = p.match(/^data-kind="([^"]+)" data-for="([^"]+)"(?: data-plan="([^"]*)")?>/);
      if (!head) continue;
      const cut = p.indexOf('<input type="hidden"');
      const body = p.slice(0, cut < 0 ? p.length : cut);
      const cols: WheelColumn[] = [];
      const cre = /<div class="iaw-col" data-ci="(\d+)" data-wrap="(1?)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g;
      let c;
      while ((c = cre.exec(body))) {
        const items: WheelRow[] = [];
        const ire = /<div class="iaw-it(?: nil)?" data-v="([^"]*)">([^<]*)<\/div>/g;
        let it;
        while ((it = ire.exec(c[4]))) {
          const v = it[1] as string;
          items.push({ v, face: it[2] as string, style: {}, getAttribute: (k: string) => (k === 'data-v' ? v : null) });
        }
        const lis: Record<string, (() => void)[]> = {};
        let st = 0;
        const attrs: Record<string, string | undefined> = { 'data-ci': c[1], 'data-wrap': c[2], 'data-len': c[3] };
        cols.push({
          style: {}, _lis: lis, items, wrap: c[2] as string, len: c[3] as string,
          getAttribute: (k: string) => (attrs[k] == null ? null : (attrs[k] as string)),
          querySelectorAll: (s: string) => (s === '.iaw-it' ? items : []),
          addEventListener: (t: string, fn: () => void) => { (lis[t] = lis[t] || []).push(fn); },
          get scrollTop() { return st; },
          set scrollTop(v: number) {
            st = v;
            (lis.scroll || []).forEach((f) => f());
          },
        });
      }
      const a: Record<string, string | null> = { 'data-kind': head[1] as string, 'data-for': head[2] as string, 'data-plan': head[3] == null ? null : unq(head[3]) };
      out.push({
        _cols: cols, kind: head[1] as string, hid: head[2] as string, plan: a['data-plan'] as string | null,
        getAttribute: (k: string) => (a[k] == null ? null : (a[k] as string)),
        querySelectorAll: (s: string) => (s === '.iaw-col' ? cols : []),
      });
    }
    return out;
  }
  const doc = ctx.document;
  doc.getElementById = (k: string) => els[k] || (els[k] = mk(k));
  if (!doc.addEventListener) doc.addEventListener = function () {};
  const SCREENS = [...new Set((IA.html.match(/class="screen[^"]*" id="(\w+)"/g) || []).map((s) => (s.match(/id="(\w+)"/) as RegExpMatchArray)[1] as string))];
  SCREENS.forEach((s) => doc.getElementById(s).classList.add('screen'));
  doc.querySelectorAll = (sel: string) => {
    if (sel === '.screen') return SCREENS.map((s) => els[s]);
    if (sel === '.screen.with-tabbar') return SCREENS.map((s) => els[s]).filter((x) => x.classList.contains('with-tabbar'));
    if (sel === '.iaw') return WHEELS;
    if (sel === '.iaw-col') return ([] as WheelColumn[]).concat(...WHEELS.map((w) => w._cols));
    return [];
  };
  ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'detailStatusRow', 'rtMini', 'rtToggle', 'restFloat', 'screenWeek', 'daysList',
    'progressBody', 'restOverlay', 'restBody'].forEach((k) => doc.getElementById(k));
  ctx.popConfetti = function () {};
  ev('popConfetti=globalThis.popConfetti;');
  ev('var __dots=[]; var __realBDC=buildDotChart; buildDotChart=function(){ __dots.push(Array.prototype.slice.call(arguments,0,3)); return __realBDC.apply(this,arguments); };');
  ev('var __realDFC=doseFromCardio; doseFromCardio=function(c){ return globalThis.__FORCE_ON ? globalThis.__FORCE : __realDFC(c); };');

  // ── the athlete's gestures and the readers ───────────────────────────────────────────────────────────────────────
  const E = { IA, ev, LS, els, advance, errs, ctx, INPUTS, id } as LogForm;
  E.wheels = () => WHEELS;
  E.now = () => VNOW;
  E.setNow = (t) => { VNOW = t; };
  /** Noon (or hour h) of day d in week w, the program starting Monday 2026-09-21 (hand date arithmetic). */
  E.at = (w, d, h) => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d as DayKey), h == null ? 12 : h).getTime();
  /** Forces doseFromCardio to return `dose` (null included) on the open path. */
  E.force = (dose) => { ctx.__FORCE_ON = true; ctx.__FORCE = dose; };
  E.unforce = () => { ctx.__FORCE_ON = false; ctx.__FORCE = null; };
  /** The app's own dose for a cardio session. */
  E.dose = (c) => ev('__realDFC')(c);
  E.build = (cfg) => IA.buildProgram(JSON.parse(J(cfg)));
  /** Stores `p` as the only program, active, starting Monday 2026-09-21, with an empty store, and shows This Week. */
  E.use = (p) => {
    const q = JSON.parse(J(p));
    q.id = id;
    q.startDate = START;
    delete q.blockOpen;
    delete q.created;
    delete q.createdAt;
    [...LS._map.keys()].forEach((k) => LS.removeItem(k));
    LS.setItem('ia_programs', J([q]));
    LS.setItem('ia_active', id);
    ctx.__P = q;
    ev('activeProg=globalThis.__P; activeProgId=' + J(id) + '; currentWeek=1; progressViewId=null;');
    ev("showScreen('screenWeek')");
    return q;
  };
  E.logs = () => LS.getItem('ia_logs_' + id) || '{}';
  /** The stored entry for week w, day d, read raw (no lens), or null. */
  E.entry = (w, d) => JSON.parse(E.logs())['w' + w + '_' + d] || null;
  E.setLog = (w, d, entry) => {
    const L = JSON.parse(E.logs());
    if (entry == null) delete L['w' + w + '_' + d];
    else L['w' + w + '_' + d] = entry;
    LS.setItem('ia_logs_' + id, J(L));
  };
  E.histRaw = () => LS.getItem('ia_hist_' + id);
  E.hist = (w, d) => !!JSON.parse(E.histRaw() || '{}')['w' + w + '_' + d];
  /** Empties the store but the program. */
  E.wipe = () => { [...LS._map.keys()].filter((k) => k !== 'ia_programs' && k !== 'ia_active').forEach((k) => LS.removeItem(k)); };
  /** Opens week w, day d on the day card and lets it settle. */
  E.open = (w, d) => {
    ev('currentWeek=' + w + ';');
    els.detailOverlay.classList.remove('open');
    els.detailBody.innerHTML = '';
    for (const k in INPUTS) delete INPUTS[k];
    ev("openDayKey('" + d + "')");
    advance(500);
  };
  E.back = () => { ev('closeDetail()'); advance(200); };
  E.inputs = () => Object.values(INPUTS).reduce((a, b) => a + b, 0);
  E.resetInputs = () => { for (const k in INPUTS) delete INPUTS[k]; };
  /** The rendered cardio form's markup on the open day card. */
  E.form = () => {
    const b = els.detailBody.innerHTML;
    return (b.match(/<div id="cardioFields">([\s\S]*?)<\/div>\s*<button type="button" id="cardioSwapLink"/) || [])[1] || '';
  };
  /** The face a wheel shows: the row faces under the band, h:mm:ss for hms, joined for the others. */
  E.face = (wh) => {
    const f = wh._cols.map((c) => {
      const it = c.items[Math.round(c.scrollTop / ROW_PX)];
      return it ? it.face : '?';
    });
    return wh.kind === 'hms' ? f.join(':') : f.join('');
  };
  /** The face as the athlete reads it, from the row values: 3.10, 0:25:00, 0:45, —:00 ('' shows as the dash). */
  E.faceText = (wh) => {
    if (!wh) return '(no wheel)';
    const f = wh._cols.map((c) => {
      const it = c.items[Math.round(c.scrollTop / ROW_PX)];
      return it ? (it.v === '' ? '—' : it.v) : '?';
    });
    const p2 = (x: string) => (x === '—' ? x : String(x).padStart(2, '0'));
    if (wh.kind === 'dist') return f[0] + '.' + f[1] + f[2];
    if (wh.kind === 'hms') return f[0] + ':' + p2(f[1]) + ':' + p2(f[2]);
    return f[0] + ':' + p2(f[1]);
  };
  /** The row value under the band in column ci. */
  E.colValue = (wh, ci) => {
    const it = wh._cols[ci].items[Math.round(wh._cols[ci].scrollTop / ROW_PX)];
    return it ? it.v : '?';
  };
  E.wheel = (hid) => WHEELS.find((w) => w.hid === hid) || null;
  E.need = (hid) => {
    const w = E.wheel(hid);
    if (!w) throw new Error('no wheel for ' + hid + ' on the rendered form');
    return w;
  };
  /** Rolls each named column [[ci, value], ...] inside one settle window, then lets `ms` of the clock run. */
  E.rollAt = (wh, pairs, ms) => {
    for (const [ci, v] of pairs) {
      const c = wh._cols[ci];
      const cur = Math.round(c.scrollTop / ROW_PX);
      let best = -1;
      for (let k = 0; k < c.items.length; k++) if (c.items[k].v === v && (best < 0 || Math.abs(k - cur) < Math.abs(best - cur))) best = k;
      if (best < 0) throw new Error('no row ' + J(v) + ' in column ' + ci);
      c.scrollTop = best * ROW_PX;
    }
    advance(ms);
  };
  /** The athlete's roll and let go: the wheel settles and commits. */
  E.roll = (wh, pairs) => E.rollAt(wh, pairs, 500);
  /** Rolls only the columns not already on their value (a roll onto the shown row commits nothing). */
  E.moveTo = (hid, pairs) => {
    const wh = E.need(hid);
    const todo = pairs.filter(([ci, v]) => E.colValue(wh, ci) !== v);
    if (todo.length) E.roll(wh, todo);
  };
  /** Done ('complete'), Skip ('skipped'), or the same status again to undo it. */
  E.tap = (d, s) => { ev("handleDayStatus('" + d + "','x','" + s + "')"); advance(500); };
  E.status = (w, d) => ev('statusOf(' + w + ",'" + d + "')");
  /** The cardio card's Log tap. */
  E.log = () => { ev('logCardio()'); advance(50); };
  /** The rendered Log button's own onclick. */
  E.tapLogButton = () => {
    const b = (els.detailBody.innerHTML.match(/<button\b[^>]*\sid="cardioLogBtn"[^>]*>/) || [])[0];
    const oc = b && (b.match(/\sonclick="([^"]*)"/) || [])[1];
    if (!oc) throw new Error('no rendered #cardioLogBtn with an onclick');
    ev(oc);
    advance(500);
  };
  E.toast = () => els.toast.innerHTML;
  E.clearToast = () => { els.toast.innerHTML = ''; };
  /** The Log button's label: its text once the app relabels it, else the rendered markup's. */
  E.label = () => {
    const b = els.cardioLogBtn;
    const markup = (els.detailBody.innerHTML.match(/<button[^>]*\sid="cardioLogBtn"[^>]*>([^<]*)<\/button>/) || [])[1];
    return (b && b.textContent) || markup || '';
  };
  E.logged = () => (els.cardioSwapWrap ? els.cardioSwapWrap.dataset.logged : undefined);
  /** A slider move in the browser's order: the value, the range's own oninput, then the form's 'input' listener. */
  E.rpe = (v) => {
    els.log_rpe.value = v;
    ev('updateRPEDisplay')(v);
    els.log_rpe.dispatchEvent({ type: 'input' });
    advance(50);
  };
  E.note = (v) => { els.log_notes.value = v; els.log_notes.dispatchEvent({ type: 'input' }); advance(50); };
  E.type = (k, v) => { els[k].value = v; els[k].dispatchEvent({ type: 'input' }); advance(50); };
  E.chip = (sport) => { ev('setCardioSwap(' + J(sport) + ')'); advance(500); };
  /** The value of week w in the Progress chart titled `title` after a fresh render. */
  E.chart = (title, w) => {
    ctx.__dots.length = 0;
    ev('progressViewId=null; renderProgressScreen()');
    for (const a of ctx.__dots) {
      if (String(a[0]).indexOf(title) < 0) continue;
      const wk = Array.from(a[1]);
      const dat = Array.from(a[2]);
      return { drawn: true, v: dat[wk.indexOf(w)] };
    }
    return { drawn: false, v: undefined };
  };
  E.nudge = () => els.detailBody.innerHTML.includes(NUDGE);
  /** The derived readout's markup under the run form. */
  E.derived = () => (els.doseDerived && els.doseDerived.innerHTML) || '';
  /** The hidden node's value as a string ('(no node)' when the form has none). */
  E.hidden = (k) => (els[k] ? String(els[k].value) : '(no node)');
  return E;
}

const NUDGE = 'You logged this one but never marked it.';

/** Reads a rendered run form: number boxes, hidden inputs, wheels in order, wraps, labels, sub-labels, caps. */
function readForm(fm: string): FormRead {
  const inputs = fm.match(/<input\b[^>]*>/g) || [];
  return {
    numBox: inputs.filter((t) => /type="number"/.test(t) && /id="log_run_(mins|dist)"/.test(t)).length,
    hidden: inputs.filter((t) => /type="hidden"/.test(t)).map((t) => (t.match(/id="([^"]+)"/) || [])[1]),
    wheels: (fm.match(/<div class="iaw" data-kind="[^"]+" data-for="[^"]+"(?: data-plan="[^"]*")?>/g) || []).map((t) => ({
      kind: (t.match(/data-kind="([^"]+)"/) as RegExpMatchArray)[1] as string, hid: (t.match(/data-for="([^"]+)"/) as RegExpMatchArray)[1] as string, plan: (t.match(/data-plan="([^"]*)"/) || [])[1],
    })),
    wraps: (fm.match(/<div class="iaw-wrap[^"]*"/g) || []).map((t) => t.slice(12, -1)),
    labels: (fm.match(/<label>[\s\S]*?<\/label>/g) || []).map((s) => s.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim()),
    subs: (fm.match(/<div class="f-sub">([^<]*)<\/div>/g) || []).map((s) => s.replace(/<[^>]+>/g, '')),
    caps: (fm.match(/<div class="iaw-cap">([^<]*)<\/div>/g) || []).map((s) => s.replace(/<[^>]+>/g, '')),
  };
}

// ── hand oracles shared by the integration test and the sweep ────────────────────────────────────────────────────────
/** Hand-built run doses routed through the open path (doseFromCardio forced). */
const DOSES: Record<string, Dose> = { time: { k: 'time', mins: 15, tgt: 531, key: 'chi' }, dist: { k: 'dist', mi: 8, tgt: 570 }, reps_time: { k: 'reps_time', reps: 6, mins: 3, tgt: 480 } };
/** The run forms: [hidden id, wheel kind] in render order. The first wheel is the fixed dimension and carries the plan
 * (data-plan), except on reps_time, whose one wheel is free. */
const RUN_FORM: Record<string, { wheels: [string, string][]; fixed: boolean }> = {
  time: { wheels: [['log_run_mins', 'hms'], ['log_run_dist', 'dist']], fixed: true },
  dist: { wheels: [['log_run_dist', 'dist'], ['log_run_mins', 'hms']], fixed: true },
  reps_time: { wheels: [['log_run_dist', 'dist']], fixed: false },
};
/** What is wrong with a rendered run form (readForm) against RUN_FORM and its dose; [] when it has the ruled shape. */
function runFormShape(k: string, f: FormRead, dose: Dose) {
  const want = (RUN_FORM[k] as { wheels: [string, string][] }).wheels;
  const bad: string[] = [];
  if (f.numBox) bad.push(f.numBox + ' number box');
  for (const [hid] of want) if (!f.hidden.includes(hid)) bad.push('no hidden ' + hid);
  if (J(f.wheels.map((w) => [w.hid, w.kind])) !== J(want)) bad.push('wheels ' + J(f.wheels.map((w) => w.kind + ':' + w.hid)));
  const planWant = (RUN_FORM[k] as { fixed: boolean }).fixed ? String(k === 'time' ? dose.mins : dose.mi) : undefined;
  f.wheels.forEach((w, i) => {
    const pw = i === 0 ? planWant : undefined;
    if (w.plan !== pw) bad.push('data-plan ' + w.hid + '=' + w.plan + ' want ' + pw);
  });
  if (f.wraps.length !== want.length || !f.wraps.every((c) => c === 'iaw-wrap iaw-solo')) bad.push('wraps ' + J(f.wraps));
  return bad;
}
/** The faces a fresh run form opens on, by hand: the plan on the fixed wheel, 0:00:00 and 0.00 on the free ones. */
const runOpenFaces = (k: string, dose: Dose): Record<string, string> => (k === 'time' ? { log_run_mins: hmsFace(dose.mins!), log_run_dist: '0.00' }
  : k === 'dist' ? { log_run_dist: miFace(dose.mi!), log_run_mins: '0:00:00' } : { log_run_dist: '0.00' });

/** The bike wheel's markup head, typed: alone in its row, three columns, capped Time, no data-plan. */
const BIKE_WHEEL_HEAD = '<div class="iaw-wrap iaw-solo"><div class="iaw-cell iaw-f3"><div class="iaw-cap">Time</div><div class="iaw" data-kind="hms" data-for="log_bike_mins">';
const BIKE_WHEEL_TAG = '<div class="iaw" data-kind="hms" data-for="log_bike_mins">';
const BIKE_GLYPH = ['<circle cx="5.5" cy="17.5" r="3.5"/>', '<circle cx="18.5" cy="17.5" r="3.5"/>']; // the bike icon's two wheels
/** What is wrong with a rendered bike form; [] when it is one hms wheel for log_bike_mins in its own row, strip iff dose. */
function bikeShape(fm: string, hasDose: unknown, stored?: unknown) {
  const bad: string[] = [];
  const wheels = fm.match(/<div class="iaw" [^>]*>/g) || [];
  if (wheels.length !== 1) bad.push(wheels.length + ' wheels');
  else if (wheels[0] !== BIKE_WHEEL_TAG) bad.push('wheel ' + wheels[0]);
  const nPlan = (fm.match(/data-plan/g) || []).length;
  if (nPlan) bad.push(nPlan + ' data-plan');
  const nId = (fm.match(/id="log_bike_mins"/g) || []).length;
  const nHid = (fm.match(/<input type="hidden" id="log_bike_mins" value="[^"]*">/g) || []).length;
  if (nId !== 1 || nHid !== 1) bad.push('id log_bike_mins x' + nId + ', hidden x' + nHid);
  const nBox = (fm.match(/<input\b[^>]*>/g) || []).filter((t) => /type="number"/.test(t)).length;
  if (nBox) bad.push(nBox + ' number box');
  const wraps = fm.match(/<div class="iaw-wrap[^"]*"/g) || [];
  if (wraps.length !== 1 || wraps[0] !== '<div class="iaw-wrap iaw-solo"') bad.push('wraps ' + J(wraps));
  if (fm.indexOf(BIKE_WHEEL_HEAD) < 0) bad.push('no iaw-solo > iaw-f3 > Time > hms wheel head');
  const strip = /Planned/.test(fm);
  if (strip !== !!hasDose) bad.push('strip ' + strip + ' with dose ' + !!hasDose);
  if (stored !== undefined) {
    const hv = (fm.match(/<input type="hidden" id="log_bike_mins" value="([^"]*)">/) || [])[1];
    if (hv !== String(stored)) bad.push('hidden value ' + J(hv) + ' want ' + J(String(stored)));
  }
  return bad;
}
/** What is wrong with a bike form's copy: one label, the bike glyph then "Log the ride", no sub-label, no old string. */
function bikeCopyBad(fm: string) {
  const bad: string[] = [];
  const labels = fm.match(/<label>[\s\S]*?<\/label>/g) || [];
  if (labels.length !== 1) bad.push(labels.length + ' labels');
  const m = (labels[0] || '').match(/^<label>(<svg [^>]*>[\s\S]*?<\/svg>) ([^<]*)<\/label>$/);
  if (!m) bad.push('label shape ' + J((labels[0] || '').replace(/<svg[\s\S]*?<\/svg>/, '<svg/>')));
  else {
    if (m[2] !== 'Log the ride') bad.push('label ' + J(m[2]));
    if (!BIKE_GLYPH.every((s) => m[1].includes(s))) bad.push('icon is not the bike glyph');
    if (/—|–| - /.test(m[2])) bad.push('dash in label ' + J(m[2]));
  }
  const subs = (fm.match(/class="f-sub"/g) || []).length;
  if (subs) bad.push(subs + ' f-sub');
  for (const s of ['Bike — actual duration', 'Off the watch.', 'Whole ride']) if (fm.includes(s)) bad.push('carries ' + J(s));
  return bad;
}

/** The columns of one wheel kind as iaWheelHTML renders them: data-wrap, data-len, row values, nil count, faces. */
function renderedColumns(E: LogForm, kind: string) {
  const h = E.ev('iaWheelHTML')(kind, 'probe_' + kind, '');
  const out: { wrap: string; len: number; vals: string[]; faces: string[]; nils: number }[] = [];
  const re = /<div class="iaw-col" data-ci="(\d+)" data-wrap="([^"]*)" data-len="(\d+)"><div class="iaw-pad"><\/div>([\s\S]*?)<div class="iaw-pad"><\/div><\/div>/g;
  let m;
  while ((m = re.exec(h))) {
    const items = [...(m[4] as string).matchAll(/<div class="iaw-it( nil)?" data-v="([^"]*)">([^<]*)<\/div>/g)];
    out.push({ wrap: m[2] as string, len: +(m[3] as string), vals: items.map((x) => x[2] as string), faces: items.map((x) => x[3] as string), nils: items.filter((x) => x[1]).length });
  }
  return { html: h, cols: out };
}

/** Comment-stripped app text (block, HTML and // comments), for "is this string present" reads of the source. */
const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/gm, '$1');

export {
  DAYS, START, NUDGE, mkCfg, cardioOf, sportOf, weeksOf, hmsFace, miFace, paceHand, logForm, readForm, renderedColumns, stripComments,
  DOSES, RUN_FORM, runFormShape, runOpenFaces, BIKE_WHEEL_HEAD, BIKE_GLYPH, bikeShape, bikeCopyBad,
};
