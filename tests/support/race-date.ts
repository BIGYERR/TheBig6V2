// Helpers for the race date tests (tests/integration/race-date.test.js, tests/sweeps/race-date.test.js). Built on
// tests/support/app.js, tests/support/test-week.js (the hand calendar) and tests/support/test-length.js (the document
// that keeps its elements).
//
//   the countdown (D182)  countdownVM() boots the app with a keeping document; pin(iso) sets its clock to local noon
//                         of a date. card(p), copyLine(p), sheet(cfg, clock), review(race, clock) read the four
//                         surfaces that print a race date and its countdown: the Programs card, the copy text, the
//                         mile lock sheet and the wizard review.
//   the block open (D180) the clock is Thu 2026-09-24 12:00. boot(store) boots the app on a store the way the phone
//                         does (init, timers run), with the toasts and pop-ups recorded. The lattice of 402 configs and
//                         the 46 wizard rows, each with its hand expectation: an aligned race goal's start is the
//                         Monday of race week minus (plan - 1) weeks, and the days its flag holds outside are its
//                         days dated start <= d < 2026-09-24.
import type { CardioGoal, CardioGoals, Cfg, DayKey, Program } from '@ia/core';
import { loadApp, pinClock, fixtures } from './app.ts';
import type { App } from './app.ts';
import * as T from './test-week.ts';
import { registryDom } from './test-length.ts';
// ── the countdown (D182) ────────────────────────────────────────────────────────────────────────────────────────
/** The app booted with a keeping document, its element registry, and its clock pin. */
export interface CountdownVM { IA: App; els: ReturnType<typeof registryDom>; pin: (iso: string) => number }
function countdownVM(): CountdownVM {
  const IA = loadApp();
  const els = registryDom(IA);
  IA.eval('showToast = function(){}');
  return { IA, els, pin: (iso: string) => pinClock(IA, T.localAt(iso)) };
}
/** key/value rows of a card: <span class="k">key</span><span class="v">value</span> (or summary-key / summary-val). */
function kv(html: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {}, re = /<span class="(?:k|summary-key)">([^<]*)<\/span><span class="(?:v|summary-val)"[^>]*>([^<]*)<\/span>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(String(html)))) (out[m[1]] = out[m[1]] || []).push(m[2]);
  return out;
}
const one = (o: Record<string, string[]>, k: string): string | null => (o[k] && o[k].length === 1 ? o[k][0] : o[k] ? 'x' + o[k].length + ':' + o[k].join('/') : null);
const cfgOf = (over?: Partial<Cfg> | null): Cfg => Object.assign(T.clone(fixtures.HALF_MANNY), over || {});
const progOf = (cfg: Cfg, extra?: Record<string, unknown> | null) => Object.assign({ id: 'rdC', name: 'THE HALF MANNY', totalWeeks: 14, startDate: '2026-08-31', cfg }, extra || {});
/** The Programs card: its "Race date" and "Time out" rows. */
function card(C: CountdownVM, p: unknown): { race: string | null; out: string | null } { const o = kv(C.IA.eval('progDetailHTML')(p)); return { race: one(o, 'Race date'), out: one(o, 'Time out') }; }
/** The copy text's one "Event:" line. */
function copyLine(C: CountdownVM, p: unknown): string { const l: string[] = C.IA.eval('progSelLines')(p).filter((x: string) => /^Event: /.test(x)); return l.length === 1 ? l[0] : 'x' + l.length; }
const eventParts = (l: unknown): { date: string | null; words: string | null } => { const m = /^Event: (.*?)(?: \(([^()]*)\))?$/.exec(typeof l === 'string' ? l : ''); return m ? { date: m[1], words: m[2] === undefined ? null : m[2] } : { date: null, words: null }; };
/** The mile lock sheet of a 14-week program on its week 14 (locked): its "Days out" and "Race day" rows. */
/** The lock sheet's rows, or why it did not open. */
export type SheetRead = { err: string; out?: undefined; race?: undefined } | { err?: undefined; out: string | null; race: string | null };
function sheet(C: CountdownVM, cfg: Cfg, clockIso: string): SheetRead {
  const start = T.addDays(T.fromCiv(T.monOf(clockIso)), -91);   // the clock's Monday minus 13 weeks: the clock is in week 14
  const p = { id: 'rdP', name: 'THE HALF MANNY', totalWeeks: 14, startDate: start, cfg };
  C.els.clear();
  C.IA.localStorage.setItem('ia_programs', JSON.stringify([p]));
  C.IA.eval('openMileSheet')('rdP');
  if (!C.IA.window.document.getElementById('mileLockOverlay').classList.contains('open')) return { err: 'the lock sheet did not open' };
  const o = kv(C.IA.window.document.getElementById('mileLockBody').innerHTML);
  return { out: one(o, 'Days out'), race: one(o, 'Race day') };
}
/** The wizard review's "Race date" row: the date and its phrase in brackets. */
function review(C: CountdownVM, raceIso: string, clockIso: string, extra?: Record<string, unknown> | null): { raw: string | null; date: string | null; phrase: string | null } {
  const wd = Object.assign({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half', label: 'Half Marathon', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' } },
    eventTargeted: true, raceDate: raceIso, liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
    restDays: ['sun', 'wed'], days: T.JS7.slice(), bench: 135, squat: 155, deadlift: 185, name: 'THE HALF MANNY', startDate: clockIso }, extra || {});
  C.els.clear();
  C.IA.eval('WD = ' + JSON.stringify(wd) + '; wizardStep = WIZARD_STEPS.indexOf("name"); renderWizardStep();');
  const v = one(kv(C.IA.window.document.getElementById('wizardBody').innerHTML), 'Race date');
  const m = /^(.*?)(?: \(([^()]*)\))?$/.exec(v || '');
  return { raw: v, date: m ? m[1] : null, phrase: m && m[2] !== undefined ? m[2] : null };
}

// ── the block open (D180) ───────────────────────────────────────────────────────────────────────────────────────
const TODAY_ISO = '2026-09-24';   // a Thursday
const PIN = T.localAt(TODAY_ISO, 12, 0);
const PLAN_WEEKS: Record<string, number> = { run_5k: 8, run_10k: 8, run_half: 14, run_marathon: 18 };   // the four Nike plans
const handStart = (goal: string, race: string): string => T.addDays(T.fromCiv(T.monOf(race)), -7 * (PLAN_WEEKS[goal] - 1));
const plus = (n: number): string => T.addDays(TODAY_ISO, n);
/** The ISO date of week w, day i (0 Monday) of a program that starts on `start`. */
const dayISO = (start: string, w: number, i: number): string => T.addDays(T.fromCiv(T.monOf(start)), (w - 1) * 7 + i);
// Toasts and pop-ups are wrapped, never replaced: the original runs after the record. getElementById is memoised so a
// rendered container can be read back.
const HOOKS = '(function(){const m={};const o=document.getElementById;document.getElementById=function(id){return m[id]||(m[id]=o(id));};globalThis.__els=m;})();'
  + 'globalThis.__toasts=[];(function(){const f=showToast;showToast=function(t){__toasts.push(String(t));return f.apply(this,arguments);};})();'
  + "globalThis.__pops=[];(function(){const f=popFire;popFire=function(t,o){__pops.push(t+'::'+String((o&&o.msg)||''));return f.apply(this,arguments);};})();";
function boot(store?: Record<string, string> | null): App {
  const IA = loadApp();
  pinClock(IA, PIN);
  IA.localStorage.clear();
  if (store) for (const [k, v] of Object.entries(store)) IA.localStorage.setItem(k, v);
  IA.eval(HOOKS); IA.eval('activeProgId=null;activeProg=null;'); IA.eval('init()'); IA.flushTimers(30);
  return IA;
}
const dump = (IA: App): Record<string, string> => Object.fromEntries(IA.localStorage._map);
/** A program as the app stores it in ia_programs: _applyWizardStart adds the day the block opened. */
export type StoredProgram = Program & { blockOpen?: string };
const storedP = (IA: App, id: string | null): Partial<StoredProgram> => (JSON.parse(IA.localStorage.getItem('ia_programs') || '[]') as StoredProgram[]).find(x => x && x.id === id) || {};
const weekHTML = (IA: App): string => IA.eval('Object.values(__els).map(e=>e.innerHTML).filter(h=>h&&h.indexOf("wk-stats")>=0)').sort((a: string, b: string) => b.length - a.length)[0] || '';
const render = (IA: App, w: number): string => { IA.eval('currentWeek=' + w + ';renderWeekView()'); return weekHTML(IA); };
const text = (h: string): string => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function wizard(IA: App, cfg: Partial<Cfg>): string | null { IA.eval('WD=Object.assign(WD||{},' + JSON.stringify(cfg) + ')'); IA.eval('doGenerate()'); IA.flushTimers(60); return IA.eval('activeProgId'); }
/** A rendered week: its seven cells, the ones before signup (.pre), how many open a day, the hero, the Done tile. */
/** A rendered week read back (parseWeek). */
export interface ParsedWeek { cells: number; pre: string; taps: number; hero: string; heroHtml: string; done: string }
function parseWeek(h: string): ParsedWeek {
  const hi = h.indexOf('wk-hero'), si = h.indexOf('wk-stats'), strip = hi >= 0 ? h.slice(0, hi) : h;
  const cls: string[] = []; strip.replace(/<div class="wk-day((?:\s[^"]*)?)"/g, (m, c) => { cls.push(c); return m; });
  const pre = T.ISO7.filter((d, i) => cls[i] !== undefined && /\bpre\b/.test(cls[i]));
  const taps = (strip.match(/onclick="openDayKey\('/g) || []).length;
  const hero = hi >= 0 ? text(h.slice(h.lastIndexOf('<', hi), si > hi ? h.lastIndexOf('<', si) : undefined)) : '';
  const dm = text(h.slice(si >= 0 ? si : 0)).match(/(\d+) \/(\d+) Done/);
  return { cells: cls.length, pre: pre.join(' '), taps, hero, heroHtml: hi >= 0 ? h.slice(hi, si > hi ? si : undefined) : '', done: dm ? dm[1] + ' /' + dm[2] + ' Done' : '?' };
}

const HM: Cfg = fixtures.HALF_MANNY;
const runG = (id: string, extra?: Partial<CardioGoal> | null): CardioGoals => ({ run: Object.assign({ id, label: id, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' }, extra || {}) });
const PG = runG('run_pace_goal', { targetMins: '9', targetSecs: '00' });
/** The refreshProgram lattice: HALF_MANNY; 4 race goals x race 4..16 weeks out x 7 offsets; and 37 configs that do not align. */
/** A refreshProgram lattice row: its goal, its kind, whether its start aligns to a race, its config, and (aligned) the hand start. */
export interface LRow { goal: string; kind: string; aligned: boolean; cfg: Cfg; hStart?: string }
const LROWS: LRow[] = [];
{
  let seed = 7000;
  const add = (goal: string, kind: string, aligned: boolean, o: Partial<Cfg>) => LROWS.push({ goal, kind, aligned, cfg: Object.assign({}, HM, { seed: seed++, name: 'M' }, o) });
  add('fixture', 'HALF_MANNY as-is', true, {});
  for (const g of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) for (let w = 4; w <= 16; w++) for (let o = 0; o < 7; o++) add(g, 'race', true, { cardioTypes: ['run'], cardioGoals: runG(g), eventTargeted: true, raceDate: plus(7 * w + o) });
  for (const g of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) {
    add(g, 'no race date', false, { cardioTypes: ['run'], cardioGoals: runG(g), eventTargeted: true, raceDate: undefined });
    for (const w of [4, 8, 12]) add(g, 'event off', false, { cardioTypes: ['run'], cardioGoals: runG(g), eventTargeted: false, raceDate: plus(7 * w + 2) });
  }
  for (let w = 1; w <= 16; w++) add('run_pace_goal', 'test dated', false, { cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true, raceDate: plus(7 * w + 3) });
  add('run_pace_goal', 'no test date', false, { cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true, raceDate: undefined });
  for (const w of [0, -10, 10]) add('run_base', 'base', false, { cardioTypes: ['run'], cardioGoals: runG('run_base'), eventTargeted: false, raceDate: undefined, startDate: w ? plus(w) : undefined });
  add('lift', 'lift only', false, { cardioTypes: [], cardioGoals: {}, primaryPath: 'lift', eventTargeted: false, raceDate: undefined });
  for (const r of LROWS) if (r.aligned) r.hStart = handStart(r.goal === 'fixture' ? 'run_half' : r.goal, r.cfg.raceDate!);
}
const LAT_JS = '(function(){const D=["mon","tue","wed","thu","fri","sat","sun"];const fl=[],days=[];'
  + 'for(let w=1;w<=__R.totalWeeks;w++)for(const d of D){if(!__R.weeks[w]||!__R.weeks[w][d])continue;days.push(w+":"+d);'
  + 'const q=Object.assign({},__R);delete q.blockOpen;if(dayBeforeStart(__R,w,d)&&!dayBeforeStart(q,w,d))fl.push("W"+w+d);}'
  + 'return JSON.stringify({inBO:__P.blockOpen===undefined?"absent":__P.blockOpen,inStart:__P.startDate,'
  + 'outBO:__R.blockOpen===undefined?"absent":__R.blockOpen,own:Object.prototype.hasOwnProperty.call(__R,"blockOpen"),'
  + 'hasKey:JSON.stringify(__R,(k,v)=>k==="created"?undefined:v).indexOf(\'"blockOpen"\')>=0,flips:fl.join(" "),days});})()';
/**
 * Each row built, stamped by _applyWizardStart, refreshed. Aligned rows enter with blockOpen today and refreshProgram
 * returns it (own key, in the JSON); others carry no key; on every row the days the flag holds outside are the
 * date-arithmetic set. `moves` counts the rows with such days, per goal.
 */
/** lattice's counts (see there). */
export interface LatticeTally { aligned: number; carry: number; plain: number; clean: number; moves: Record<string, number>; startOff: string[]; flips: string[] }
/** One lattice row as LAT_JS reads it back. */
interface LatRead { inBO: string; inStart: string; outBO: string; own: boolean; hasKey: boolean; flips: string; days: string[] }
function lattice(rows: LRow[]): LatticeTally {
  const IA = boot(), R: LatticeTally = { aligned: 0, carry: 0, plain: 0, clean: 0, moves: {}, startOff: [], flips: [] };
  for (const r of rows) {
    const c = JSON.stringify(JSON.parse(JSON.stringify(r.cfg)));
    IA.eval('__P=buildProgram(' + c + ');_applyWizardStart(__P,' + c + ');__P.id="PX";__P.name="M";__R=refreshProgram(JSON.parse(JSON.stringify(__P)));');
    const o: LatRead = JSON.parse(IA.eval(LAT_JS));
    let exp = '';
    if (r.aligned) {
      R.aligned++;
      if (o.inBO === TODAY_ISO && o.outBO === TODAY_ISO && o.own && o.hasKey) R.carry++;
      if (o.inStart !== r.hStart) R.startOff.push(r.goal + ' ' + r.cfg.raceDate + ' start ' + o.inStart + ' want ' + r.hStart);
      exp = o.days.map(x => x.split(':')).filter(([w, d]) => { const x = dayISO(r.hStart!, +w, T.ISO7.indexOf(d as DayKey)); return x >= r.hStart! && x < TODAY_ISO; }).map(([w, d]) => 'W' + w + d).join(' ');
      if (exp) R.moves[r.goal] = (R.moves[r.goal] || 0) + 1;
    } else {
      R.plain++;
      if (o.inBO === 'absent' && !o.hasKey) R.clean++;
    }
    if (o.flips !== exp) R.flips.push(r.goal + ' ' + (r.cfg.raceDate || r.kind) + ' want [' + exp.slice(0, 40) + '] got [' + o.flips.slice(0, 40) + ']');
  }
  return R;
}

/** The wizard rows: lift only, base goals, HALF_MANNY, each race goal undated, event off and at six race distances, pace goals. */
/** A wizard row: its name, whether its start aligns to a race, its race goal, and the wizard data it sets. */
export interface WRow { name: string; aligned: boolean; goal: string | null; cfg: Partial<Cfg> }
const WROWS: WRow[] = [];
{
  const base0: Partial<Cfg> = Object.assign({}, HM); delete base0.raceDate; delete base0.cardioGoals; delete base0.name;
  let ws = 5000;
  const wadd = (name: string, aligned: boolean, goal: string | null, o: Partial<Cfg>) => WROWS.push({ name, aligned, goal, cfg: Object.assign({}, base0, { seed: ws++ }, o) });
  wadd('lift only', false, null, { cardioTypes: [], cardioGoals: {}, primaryPath: 'lift', eventTargeted: false });
  wadd('lift only, start +10d', false, null, { cardioTypes: [], cardioGoals: {}, primaryPath: 'lift', eventTargeted: false, startDate: plus(10) });
  wadd('lift only, start -10d', false, null, { cardioTypes: [], cardioGoals: {}, primaryPath: 'lift', eventTargeted: false, startDate: plus(-10) });
  wadd('run_base', false, null, { cardioTypes: ['run'], cardioGoals: runG('run_base'), eventTargeted: false });
  wadd('run_base, start +3d', false, null, { cardioTypes: ['run'], cardioGoals: runG('run_base'), eventTargeted: false, startDate: plus(3) });
  wadd('run_base, start -10d', false, null, { cardioTypes: ['run'], cardioGoals: runG('run_base'), eventTargeted: false, startDate: plus(-10) });
  wadd('bike_base', false, null, { cardioTypes: ['bike'], cardioGoals: { bike: { id: 'bike_base', label: 'Build Cycling Base' } }, eventTargeted: false });
  wadd('swim_base', false, null, { cardioTypes: ['swim'], cardioGoals: { swim: { id: 'swim_base', label: 'Swim Base' } }, eventTargeted: false });
  wadd('HALF_MANNY fixture as-is', true, 'run_half', Object.assign({}, HM));
  const FL: Record<string, number> = { run_5k: 4, run_10k: 4, run_half: 6, run_marathon: 12 };
  for (const g of Object.keys(PLAN_WEEKS)) {
    const P = PLAN_WEEKS[g];
    wadd(g + ' no race date', false, null, { cardioTypes: ['run'], cardioGoals: runG(g), eventTargeted: true });
    wadd(g + ' event off, date', false, null, { cardioTypes: ['run'], cardioGoals: runG(g), eventTargeted: false, raceDate: plus(7 * P + 3) });
    for (const w of [...new Set([2, FL[g], Math.floor(P / 2), P - 1, P, P + 4])]) wadd(g + ' race +' + w + 'w', true, g, { cardioTypes: ['run'], cardioGoals: runG(g), eventTargeted: true, raceDate: plus(7 * w + 3) });
  }
  wadd('run_pace_goal no test date', false, null, { cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true });
  for (const w of [1, 4, 8, 20]) wadd('run_pace_goal test +' + w + 'w', false, null, { cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true, raceDate: plus(7 * w + 3) });
  wadd('run_pace_goal test +4w, start +10d', false, null, { cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true, raceDate: plus(31), startDate: plus(10) });
  wadd('run_half + bike_base, race +10w', true, 'run_half', { cardioTypes: ['run', 'bike'], cardioGoals: Object.assign(runG('run_half'), { bike: { id: 'bike_base', label: 'Build Cycling Base' } }), eventTargeted: true, raceDate: plus(73) });
}
/**
 * Each wizard row from an existing active program on its W3 Tuesday: the landing week, the wizard's own committed
 * program (captured at the buildProgram call) rendered, the keys activeProg differs from it on, what was stored, and
 * week 1 after a reboot.
 */
/** One wizard row's run (wizardRun). */
export interface WizardRead { row: WRow; cw: number; landing: string; keysDiff: string; capW1: string; stored: Partial<StoredProgram>; rbW1: string; hStart?: string; hPre?: string }
function wizardRun(rows: WRow[]): WizardRead[] {
  const I0 = loadApp(); pinClock(I0, PIN);
  const p0 = I0.buildProgram(Object.assign({}, HM, { seed: 1000 })); p0.id = 'P0'; p0.name = 'Prog0'; p0.startDate = '2026-09-07';
  const P0JSON = JSON.stringify([p0]);
  return rows.map(r => {
    const IA = boot({ ia_programs: P0JSON, ia_active: 'P0' }); IA.eval('currentDayKey="tue";currentWeek=3;');
    const ctx = IA.ctx, ob = ctx.buildProgram; let cap = null as Record<string, unknown> | null; // set inside the wrapper below
    ctx.buildProgram = function (this: unknown, ...a: unknown[]) { const x = ob.apply(this, a); if (!cap) cap = x; return x; };
    const id = wizard(IA, r.cfg); ctx.buildProgram = ob;
    const cw = IA.eval('currentWeek'), landing = weekHTML(IA);
    const ap = IA.eval('activeProg') || {};
    const keysDiff = cap ? [...new Set([...Object.keys(ap), ...Object.keys(cap)])].filter(k => JSON.stringify(ap[k]) !== JSON.stringify(cap![k])).sort().join(',') : 'no capture';
    ctx.__cap = cap; IA.eval('globalThis.__ap=activeProg;activeProg=__cap;'); const capW1 = cap ? render(IA, 1) : ''; IA.eval('activeProg=__ap;');
    const stored = storedP(IA, id);
    const rbW1 = render(boot(dump(IA)), 1);
    const o: WizardRead = { row: r, cw, landing, keysDiff, capW1, stored, rbW1 };
    if (r.aligned) {
      const hs = handStart(r.goal!, r.cfg.raceDate!);
      o.hStart = hs;
      o.hPre = T.ISO7.filter((d, j) => { const x = dayISO(hs, 1, j); return x >= hs && x < TODAY_ISO; }).join(' ');
    }
    return o;
  });
}
/** HALF_MANNY through the wizard's start: race Sun 2026-12-06, so start Mon 2026-11-30 minus 13 weeks = 2026-08-31. */
function fixtureStore(): { fix: StoredProgram; store: Record<string, string> } {
  const I = loadApp(); pinClock(I, PIN);
  I.eval('__F=buildProgram(' + JSON.stringify(HM) + ');_applyWizardStart(__F,' + JSON.stringify(HM) + ');__F.id="HM1";__F.name="THE HALF MANNY";');
  const fix = JSON.parse(JSON.stringify(I.eval('__F')));
  return { fix, store: { ia_programs: JSON.stringify([fix]), ia_active: 'HM1' } };
}

export {
  countdownVM, kv, one, cfgOf, progOf, card, copyLine, eventParts, sheet, review,
  TODAY_ISO, PIN, PLAN_WEEKS, handStart, plus, dayISO, boot, dump, storedP, weekHTML, render, text, wizard, parseWeek,
  HM, runG, LROWS, lattice, WROWS, wizardRun, fixtureStore,
};