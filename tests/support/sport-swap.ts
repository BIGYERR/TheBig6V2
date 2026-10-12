// The sport chip on a cardio day (tests/integration/sport-swap.test.ts, tests/sweeps/swaps.test.ts). One app with its
// clock pinned to 2026-10-03, a Saturday (program start 2026-09-28, so W1 SAT is today), and a document whose
// getElementById keeps a registry: innerHTML is parsed for ids, so the log form's hidden inputs are real registry nodes.
// Typing is a write to the hidden node followed by the commit the Log tap makes (persistLogFields(day, true)).
import type { DayKey, Program } from '@ia/core';
import { loadApp, pinClock, fixtures } from './app.ts';
import type { App, StorageStub } from './app.ts';

/** A registry node standing in for a DOM element: the app's untyped script reads and writes it freely. */
type Stub = any;

/** The sport chip world sportWorld() returns. */
export interface SportWorld {
  IA: App;
  E: App['eval'];
  LS: StorageStub;
  REG: Map<string, Stub>;
  /** Runs `f`; what it threw comes back as { threw }. */
  tryv(f: () => unknown): any;
  logs(pid: string): Record<string, any>;
  entry(pid: string, k: string): any;
  comp(pid: string, k: string): string | null;
  install(cfg: Record<string, any>, pid: string): any;
  open(dk: string): any;
  swap(s: string): any;
  type(dk: string, vals: Record<string, string>): string;
  hid(f: string): string | null;
  fieldIds(): string[];
  fieldsHTML(): string;
  active(): string | undefined;
  /** The note as buildLogHTML rendered it (right after open). */
  renderNote(): { display: string; text: string } | null;
  liveNote(): { display: string; text: string } | null;
  weekStats(): { threw?: string; miles?: string; done?: string };
  markDone(dk: string, title?: string): any;
}

/** One row of the swap matrix: its name and the problems found ([] when right). */
export interface MatrixRow {
  name: string;
  bad: string[];
}

const CLOCK = '2026-10-03', START = '2026-09-28';
const SETS: Record<string, string[]> = { run: ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time'], bike: ['bike_mins'], swim: ['swim_yards'] };
const TYPED: Record<string, string> = { run_mins: '45', run_dist: '5', run_pace: '9:00', run_reps: '4', run_rep_time: '1:30', bike_mins: '40', swim_yards: '1000' };
const J = JSON.stringify;

function sportWorld(): SportWorld {
  const IA = loadApp(); pinClock(IA, new Date(CLOCK + 'T12:00:00'));
  const E = IA.eval, LS = IA.localStorage, REG = new Map();
  const NULL_IF_ABSENT = /^(log_|cardio|doseDerived|doseRepVal)/;
  function mk(id: string): Stub {
    return {
      id, value: '', dataset: {}, style: {}, _kids: [], _html: '', scrollTop: 0, textContent: '', children: [], childNodes: [], offsetLeft: 0, offsetWidth: 0, clientWidth: 0,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, removeEventListener() {},
      appendChild(c: Stub) { this.children.push(c); return c; }, removeChild(c: Stub) { return c; }, insertBefore(c: Stub) { return c; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; }, scrollTo() {}, scrollIntoView() {},
      querySelectorAll() { return []; }, querySelector() { return null; }, focus() {}, blur() {}, setAttribute() {}, getAttribute() { return null; },
      get innerHTML() { return this._html; }, set innerHTML(h) { setHTML(this, String(h)); },
    };
  }
  function setHTML(el: Stub, h: string) {
    const drop = (k: string): void => { const c = REG.get(k); if (c) { c._kids.forEach(drop); REG.delete(k); } };
    el._kids.forEach(drop); el._kids = []; el._html = h;
    const re = /<(input|textarea|div|button|span|select)\b([^>]*?)\bid="([^"]+)"([^>]*)>/g; let m;
    while ((m = re.exec(h))) {
      const id = m[3], attrs = m[2] + ' ' + m[4]; const c = mk(id);
      const v = /\bvalue="([^"]*)"/.exec(attrs); if (v) c.value = v[1].replace(/&quot;/g, '"');
      if (m[1] === 'textarea') c.value = h.slice(re.lastIndex, h.indexOf('</textarea>', re.lastIndex));
      attrs.replace(/\bdata-([a-z]+)="([^"]*)"/g, (a: string, k: string, val: string): any => { c.dataset[k] = val; });
      REG.set(id, c); el._kids.push(id);
      if (id === 'cardioFields') {
        const end = h.indexOf('id="cardioSwapLink"', re.lastIndex); const inner = h.slice(re.lastIndex, end < 0 ? undefined : end);
        c._html = inner; const re2 = /\bid="([^"]+)"/g; let m2; while ((m2 = re2.exec(inner))) c._kids.push(m2[1]);
      }
    }
  }
  IA.window.document.getElementById = (id: string) => { if (REG.has(id)) return REG.get(id); if (NULL_IF_ABSENT.test(id)) return null; const e = mk(id); REG.set(id, e); return e; };

  const tryv = (f: () => unknown): any => { try { return f(); } catch (e) { return { threw: String(e && (e as Error).message || e) }; } };
  const W: SportWorld = {
    IA, E, LS, REG, tryv,
    logs: pid => JSON.parse(LS.getItem('ia_logs_' + pid) || '{}'),
    entry: (pid, k) => W.logs(pid)[k] || null,
    comp: (pid, k) => (JSON.parse(LS.getItem('ia_comp_' + pid) || '{}')[k] || {}).status || null,
    install(cfg, pid) {
      const prog: Program & { overlays?: unknown[] } = IA.buildProgram(JSON.parse(J(cfg)));
      prog.id = pid; prog.name = pid; prog.created = 1; prog.startDate = START; prog.seed = cfg.seed; prog.cfg = prog.cfg || JSON.parse(J(cfg)); prog.overlays = [];
      ['ia_logs_', 'ia_comp_', 'ia_hist_', 'ia_moves_'].forEach(k => LS.removeItem(k + pid));
      LS.setItem('ia_programs', J([prog])); LS.setItem('ia_active', pid);
      IA.ctx.__P = prog; E('activeProgId="' + pid + '"; activeProg=__P; currentWeek=1;'); return prog;
    },
    open(dk) { REG.clear(); return tryv(() => E('openDetail("' + dk + '", activeProg.weeks[currentWeek]["' + dk + '"])')); },
    swap: s => tryv(() => E('setCardioSwap("' + s + '")')),
    type(dk, vals) {
      for (const f of Object.keys(vals)) { const el = REG.get('log_' + f); if (!el) return 'no input log_' + f; el.value = vals[f]; }
      tryv(() => E('persistLogFields("' + dk + '",true)')); return '';
    },
    hid: f => { const el = REG.get('log_' + f); return el ? el.value : null; },
    fieldIds: () => ((REG.get('cardioFields') || {})._kids || []).filter((id: string) => /^log_(run|bike|swim)_/.test(id)),
    fieldsHTML: () => (REG.get('cardioFields') || {})._html || '',
    active: () => ((REG.get('cardioSwapWrap') || {}).dataset || {}).active,
    /** The note as buildLogHTML rendered it (right after open). */
    renderNote() { for (const el of REG.values()) { const m = /id="cardioSwapNote"[^>]*display:(\w+)[^>]*>([^<]*)</.exec(el._html || ''); if (m) return { display: m[1], text: m[2] }; } return null; },
    liveNote() { const n = REG.get('cardioSwapNote'); return n ? { display: n.style.display, text: n.textContent || '' } : null; },
    weekStats() {
      const r = tryv(() => E('renderWeekView()')); const out: { threw?: string; miles?: string; done?: string } = { threw: r && r.threw };
      for (const el of REG.values()) {
        const h = el._html || '';
        const mi = /<div class="wk-stat-num" style="color:var\(--run\)">([^<]*)<\/div><div class="wk-stat-lbl">MILES<\/div>/.exec(h);
        const dn = /<div class="wk-stat-num">(\d+)<span class="den">\/(\d+)<\/span><\/div><div class="wk-stat-lbl">DONE<\/div>/.exec(h);
        if (mi) out.miles = mi[1]; if (dn) out.done = dn[1] + '/' + dn[2];
      }
      return out;
    },
    markDone: (dk, title) => tryv(() => E('handleDayStatus("' + dk + '","' + (title || 'Long Run') + '","complete")')),
  };
  return W;
}

const nonBlank = (o: Record<string, unknown> | null | undefined) => { const r: Record<string, unknown> = {}; Object.keys(o || {}).forEach(f => { if (o![f] !== '' && o![f] != null) r[f] = o![f]; }); return r; };
const topBlank = (L: Record<string, unknown> | null | undefined, sport: string) => !!L && SETS[sport].every(f => (L[f] == null ? '' : L[f]) === '');

/**
 * The swap matrix (measure m1's shape): one representative day per (planned sport, dose kind), for each: nothing saved
 * or saved first, every other sport as the target, and four ways back (straight back, a third sport between, a reopen
 * while swapped, typing on the target then back). Returns one result per row: the problems found, empty when right.
 */
function swapMatrix(W: SportWorld, filter?: (r: { kind: string; saved: boolean; T: string; hop: string }) => boolean): MatrixRow[] {
  const goalObj = (id: string, extra?: Record<string, string>) => Object.assign({ id, label: id }, { mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, extra || {});
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  function mkCfg(sports: [string, string, Record<string, string>][], seed: number) {
    const race = sports.some(s => /^run_(5k|10k|half|marathon)$/.test(s[1]));
    const cg: Record<string, object> = {}; sports.forEach(s => { cg[s[0]] = goalObj(s[1], s[2]); });
    return { name: 'L', primaryPath: 'goal', cardioTypes: sports.map(s => s[0]), cardioGoals: cg, eventTargeted: race, raceDate: race ? '2026-12-20' : null,
      liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed };
  }
  const SRC: [string, Record<string, any>][] = [['HALF_MANNY', JSON.parse(J(fixtures.HALF_MANNY))],
    ['run_10k+bike', mkCfg([['run', 'run_10k', {}], ['bike', 'bike_base', {}]], 76308)],
    ['run_pace', mkCfg([['run', 'run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '30' }]], 76308)],
    ['run_base', mkCfg([['run', 'run_base', {}]], 76308)],
    ['swim_base', mkCfg([['swim', 'swim_base', {}]], 76308)],
    ['bike_ftp', mkCfg([['bike', 'bike_ftp', {}]], 76308)]];
  const WANT = ['run:generic', 'run:time', 'run:dist', 'run:reps_dist', 'bike:dosed', 'swim:none'];
  const ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const ctOf = (d: any) => (d && d.cardio && !Array.isArray(d.cardio) && d.cardio.type || '').toLowerCase();
  const DF = W.E('doseFromCardio'); const cells: Record<string, { nm: string; cfg: Record<string, any>; w: number; d: DayKey }> = {};
  for (const [nm, cfg] of SRC) {
    const p = W.IA.buildProgram(JSON.parse(J(cfg)));
    for (const w of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for (const d of ORDER) {
      const x = p.weeks[w][d]; const ct = ctOf(x); if (!x || x.rest || !ct) continue;
      const dose = DF(x.cardio); const kind = ct + ':' + (ct === 'run' ? (dose ? dose.k : 'generic') : (dose ? 'dosed' : 'none'));
      if (!cells[kind]) cells[kind] = { nm, cfg, w, d };
    }
  }
  const rows: MatrixRow[] = []; let n = 0;
  for (const kind of WANT) {
    const c = cells[kind]; if (!c) { rows.push({ name: kind, bad: ['no ' + kind + ' day in the sources'] }); continue; }
    const P = kind.split(':')[0];
    for (const saved of [false, true]) for (const T of ['run', 'bike', 'swim'].filter(s => s !== P)) for (const hop of ['back', '3hop', 'reopen', 'typeT']) {
      const name = kind + ' ' + (saved ? 'saved' : 'typed') + ' ->' + T + ' ' + hop;
      if (filter && !filter({ kind, saved, T, hop })) continue;
      const pid = 'p_l' + (n++); W.install(c.cfg, pid); W.E('currentWeek=' + c.w); const key = 'w' + c.w + '_' + c.d; const bad = [];
      W.open(c.d);
      const typed = W.fieldIds().map(id => id.slice(4)).filter(f => TYPED[f] != null);
      const tv: Record<string, string> = {}; typed.forEach(f => { tv[f] = TYPED[f]; }); W.type(c.d, tv);
      if (!typed.length) bad.push('no typed field on the form');
      if (saved) { W.markDone(c.d); W.open(c.d); }
      W.swap(T); const sT = W.entry(pid, key) || {};
      typed.forEach(f => { if ((sT[f] || '') !== '') bad.push('on swap ' + f + ' still at top'); if (!(sT.parked && sT.parked[P] && sT.parked[P][f] === TYPED[f])) bad.push('on swap parked.' + P + '.' + f + ' = ' + J(sT.parked && sT.parked[P] && sT.parked[P][f])); });
      let tf: string | null = null;
      if (hop === 'typeT') {
        const ids = W.fieldIds().map(id => id.slice(4)).filter(f => TYPED[f] != null && SETS[T].includes(f)); tf = ids[0] || null;
        if (tf) W.type(c.d, { [tf]: TYPED[tf] }); else bad.push('no ' + T + ' field to type'); W.swap(P);
      } else if (hop === 'back') W.swap(P);
      else if (hop === '3hop') { const T2 = ['run', 'bike', 'swim'].find(s => s !== P && s !== T); W.swap(T2 as string); W.swap(P); }
      else if (hop === 'reopen') { W.open(c.d); if (W.active() !== T) bad.push('reopen while swapped shows ' + J(W.active())); W.swap(P); }
      const sB = W.entry(pid, key) || {};
      typed.forEach(f => { if (sB[f] !== TYPED[f]) bad.push('back: top ' + f + ' = ' + J(sB[f])); if (W.hid(f) !== TYPED[f]) bad.push('back: form ' + f + ' = ' + J(W.hid(f))); });
      if (sB.parked && P in sB.parked) bad.push('back: parked.' + P + ' left behind');
      if ((sB.swapTo || '') !== '') bad.push('back: swapTo ' + J(sB.swapTo));
      if (tf && !(sB.parked && sB.parked[T] && sB.parked[T][tf] === TYPED[tf])) bad.push('typed ' + T + ' ' + tf + ' not parked: ' + J(sB.parked));
      if (saved && W.comp(pid, key) !== 'complete') bad.push('saved day status ' + J(W.comp(pid, key)));
      rows.push({ name, bad });
    }
  }
  return rows;
}

export { CLOCK, START, SETS, TYPED, sportWorld, nonBlank, topBlank, swapMatrix };
