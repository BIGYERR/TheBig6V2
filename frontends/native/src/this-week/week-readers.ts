// What This Week reads beside the stored state, for the Expo app (MIGRATION.md phase 2, session 4). Today's Angular
// screen reaches these in the legacy page through its bridge (tests/measure/native-this-week_reads.md: 16 readers still
// in the page, none of them in core). Each one here is the page's own function, line for line, with the page's globals
// (the active program, its id, the store, the clock) taken as arguments. The page keeps its own until the cutover
// deletes it; tests/integration/native-this-week.test.ts holds every one equal to the page's over whole histories,
// so a change to either turns red until the other follows. Nothing here writes: no store call but a read.
import { ALL_DAYS_ORDER, _parseLocalDate, getWeekMonday } from '@ia/core/engine/calendar.ts';
import { raceAlignment } from '@ia/core/engine/nrc-race-bike-swim.ts';
import { dayStoreKey } from '@ia/core/engine/state-day-log.ts';
import { dayStatus } from '@ia/core/engine/state-day-status.ts';
import { readWildcardDone } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { NUTRITION_TIPS, STRETCH_TIPS } from './week-tips';

/** One item of a section, as far as the readers go. */
export interface ReadItem { name?: string; detail?: string }
/** One section of a day. */
export interface ReadSection { label?: string; superset?: unknown; rounds?: number | null; items?: ReadItem[] }
/** One day of the grid. */
export interface ReadDay {
  rest?: boolean;
  title?: string;
  _ovKey?: unknown;
  sections?: ReadSection[];
  cardio?: { type?: string; subtype?: string; detail?: string } | null;
}
/** A stored overlay. */
export interface ReadOverlay {
  type?: string;
  from?: string | null;
  to?: string | null;
  patch?: { injury?: { region: string; bridge?: boolean } };
}
/** The program, as far as the readers go. */
export interface ReadProgram {
  startDate?: string | null;
  blockOpen?: string | null;
  totalWeeks?: number;
  overlays?: ReadOverlay[];
  cfg?: { raceDate?: string | null; eventTargeted?: boolean; cardioTypes?: string[]; cardioGoals?: { run?: { id?: string } | null } } | null;
  weeks?: Record<string, Record<string, ReadDay | undefined> | undefined>;
}

const DAY_MS = 86400000;

/** The page's DAY_FULL (wizard.ts). */
export const DAY_FULL: Record<string, string> = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
/** The page's dayOffset: days from Monday to each day. */
const DAY_OFFSET: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

// ── Dates ────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The page's _progDayDate: the calendar date of a program day, or null with no start. */
export function progDayDate(prog: ReadProgram | null | undefined, week: number, d: string): Date | null {
  if (!prog || !prog.startDate) return null;
  const off = DAY_OFFSET[d];
  if (off == null) return null;
  const mon = getWeekMonday(prog.startDate);
  const dt = new Date(mon);
  dt.setDate(mon.getDate() + (week - 1) * 7 + off);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** The page's dayBeforeStart (V174 D24, V188 D14a): a day before the start, or before the block opened. */
export function dayBeforeStart(prog: ReadProgram | null | undefined, week: number, d: string): boolean {
  if (!prog || !prog.startDate) return false;
  const dt = progDayDate(prog, week, d);
  if (!dt) return false;
  const sd = _parseLocalDate(prog.startDate);
  if (!sd) return false;
  if (dt < sd) return true;
  if (prog.blockOpen) {
    const bo = _parseLocalDate(prog.blockOpen);
    if (bo && dt < bo) return true;
  }
  return false;
}

/** The page's calcCurrentWeek, with today (at midnight) given: the program week holding today. */
export function currentWeek(prog: ReadProgram | null | undefined, today: Date): number {
  if (!prog?.startDate) return 1;
  const weekMon = getWeekMonday(prog.startDate);
  const diff = Math.floor((today.getTime() - weekMon.getTime()) / DAY_MS);
  if (diff < 0) return 1;
  const totalWeeks = prog.totalWeeks || 6;
  return Math.min(totalWeeks, Math.floor(diff / 7) + 1);
}

/** The page's _fmtStartDay: a date as the app prints a day, "Sun, Dec 6". */
export function fmtStartDay(iso: string, withYear?: boolean): string {
  const d = _parseLocalDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString('en-US', withYear ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Overlays ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** The page's weekOfDate: the program week a date falls in. */
export function weekOfDate(prog: ReadProgram | null | undefined, dateStr: string | null | undefined): number | null {
  if (!prog || !prog.startDate) return null;
  const d = _parseLocalDate(dateStr);
  if (!d) return null;
  const mon = getWeekMonday(prog.startDate);
  const diff = Math.floor((d.getTime() - mon.getTime()) / DAY_MS);
  return diff < 0 ? 1 : Math.floor(diff / 7) + 1;
}

/** The page's overlayWeekRange: the weeks an overlay covers, open ended to the program's end. */
export function overlayWeekRange(prog: ReadProgram | null | undefined, ov: ReadOverlay | null | undefined, totalWeeks: number): { fromWeek: number; toWeek: number } | null {
  if (!ov || !ov.from || !totalWeeks) return null;
  const fw = weekOfDate(prog, ov.from);
  if (fw == null) return null;
  const tw = ov.to ? weekOfDate(prog, ov.to) : totalWeeks;
  if (tw == null) return null;
  const lo = Math.max(1, fw), hi = Math.min(totalWeeks, tw);
  return hi < lo ? null : { fromWeek: lo, toWeek: hi };
}

/** The page's dayOverlayInfo: the overlay a day was built under, read off its _ovKey. */
export function dayOverlayInfo(day: ReadDay | null | undefined): { type: unknown; patch: { equipment?: unknown } } | null {
  if (!day || typeof day._ovKey !== 'string') return null;
  try {
    const k: unknown = JSON.parse(day._ovKey);
    if (!Array.isArray(k) || !k[1]) return null;
    return { type: k[0], patch: k[1] };
  } catch {
    return null;
  }
}

/** The page's dayIsTravel: a day built under a travel overlay (any equipment but a commercial gym). */
export function dayIsTravel(day: ReadDay | null | undefined): boolean {
  const i = dayOverlayInfo(day);
  return !!(i && i.type === 'substitute' && i.patch.equipment !== 'commercial');
}

/** The page's _liveInjuryOverlay, with today (at midnight) given: the injury overlay still open. */
export function liveInjuryOverlay(prog: ReadProgram | null | undefined, today: Date): ReadOverlay | null {
  if (!prog || !Array.isArray(prog.overlays)) return null;
  const tw = prog.totalWeeks || 0;
  return prog.overlays.find((ov) => {
    if (!ov || ov.type !== 'injury' || !ov.patch || !ov.patch.injury || ov.patch.injury.bridge) return false;
    if (!ov.from) return false;
    const to = ov.to ? _parseLocalDate(ov.to) : null;
    if (to && to < today) return false;
    return !!overlayWeekRange(prog, ov, tw);
  }) || null;
}

/** The page's progAlignment: the race a run program is aligned to, or null. */
export function progAlignment(p: ReadProgram | null | undefined): { raceIso: string } | null {
  const c = p && p.cfg;
  if (!c || !c.cardioTypes || !c.cardioTypes.includes('run') || !c.cardioGoals || !c.cardioGoals.run) return null;
  return raceAlignment(c.cardioGoals.run.id, c.raceDate, c.eventTargeted !== false);
}

// ── The day's words ──────────────────────────────────────────────────────────────────────────────────────────────
/** The page's heroSummary: the first movement and how many more, then the cardio's line. */
export function heroSummary(day: ReadDay): string {
  const names: string[] = [];
  (day.sections || []).forEach((sec) => { (sec.items || []).forEach((it) => { if (it.name) names.push(it.name); }); });
  const parts: string[] = [];
  if (names.length) parts.push(names.length > 1 ? names[0] + ' + ' + (names.length - 1) + ' more' : names[0]!);
  if (day.cardio) {
    const ct = (day.cardio.type || '').toLowerCase();
    const tn = ({ run: 'run', bike: 'bike', swim: 'swim' } as Record<string, string>)[ct] || ct || 'cardio';
    const d = (day.cardio.detail || '').split('\n')[0]!.replace(/<[^>]+>/g, '');
    const mn = d.match(/(\d+(?:\.\d+)?)[\s-]*min(?:ute)?s?\b/i);
    const mi = d.match(/(\d+(?:\.\d+)?)[\s-]*mi(?:le)?s?\b/i);
    const sub = day.cardio.subtype ? day.cardio.subtype.replace(/_/g, ' ') : '';
    const cstr = mn ? mn[1] + ' min ' + (sub || tn) : mi ? mi[1] + ' mi ' + (sub || tn) : (sub ? sub + ' ' + tn : tn);
    parts.push(cstr);
  }
  return parts.join('<br>');
}

/** The page's _itemSets: the set count an item's detail opens with ("4×5", "3 sets"), or null. */
export function itemSets(d: unknown): number | null {
  const s = String(d || '');
  let m = s.match(/^(\d+)\s*[x×]/);
  if (m) return parseInt(m[1]!, 10);
  m = s.match(/^(\d+)\s*sets?\b/i);
  return m ? parseInt(m[1]!, 10) : null;
}

/** The page's _secRounds: a section's rounds, from its field, its label, or its items' smallest count. */
export function secRounds(sec: ReadSection | null | undefined): number | null {
  if (!sec) return null;
  if (sec.rounds === null) return null;
  if (typeof sec.rounds === 'number' && sec.rounds > 0) return sec.rounds;
  const lr = String(sec.label || '').match(/(\d+)\s*round/i);
  if (lr) return parseInt(lr[1]!, 10);
  const c = (sec.items || []).map((it) => itemSets(it && it.detail)).filter((v): v is number => v != null);
  return c.length ? Math.min.apply(null, c) : null;
}

/** The page's sessionTimeEst: the session's minutes, to the nearest five. */
export function sessionTimeEst(day: ReadDay): number {
  let mins = 8;
  (day.sections || []).forEach((sec) => {
    const L = ((sec && sec.label) || '').toLowerCase();
    const isMain = /^main\b|^primer|^power\b|^strength\b/.test(L);
    const isSuper = !!(sec && sec.superset) || /superset|rounds|circuit|conditioning/.test(L);
    const secR = secRounds(sec);
    ((sec && sec.items) || []).forEach((it) => {
      let sets = itemSets(it.detail);
      if (sets == null) sets = secR != null ? secR : 3;
      const n = (it.name || '').toLowerCase();
      if (/stretch|mobility|90\/90|foam|worlds greatest/.test(n)) mins += sets * 0.75;
      else if (/carry/.test(n)) mins += sets * 1.2;
      else if (/plank|pallof|dead bug|bird dog|wall sit|\bhold\b|hang|wiper|hollow|clamshell|side steps|side-lying|leg raises/.test(n)) mins += sets * 1.0;
      else if (isMain) mins += sets * 3.2;
      else if (isSuper) mins += sets * 1.4;
      else mins += sets * 2.0;
    });
  });
  if (day.cardio) {
    const d = day.cardio.detail || '';
    const mn = d.match(/(\d+)\s*min/i), mi = d.match(/(\d+(?:\.\d+)?)\s*mi\b/i), pace = d.match(/(\d+):(\d\d)\s*\/\s*mi/);
    if (mn) mins += parseInt(mn[1]!);
    else if (mi && pace) mins += parseFloat(mi[1]!) * (parseInt(pace[1]!) + parseInt(pace[2]!) / 60);
    else if (mi) mins += parseFloat(mi[1]!) * 10;
    else mins += 20;
    mins += 4;
  }
  mins = Math.round(mins / 5) * 5;
  return Math.max(5, mins);
}

/** The page's liftFocusCode: the day strip's word for a lift day's title. */
export function liftFocusCode(title: string | null | undefined): string {
  const t = (title || '').toLowerCase();
  if (/full body|full upper|full lower|\bfull\b/.test(t)) return 'FULL';
  if (/upper/.test(t)) return 'UPPER';
  if (/lower/.test(t)) return 'LOWER';
  if (/legs?|squat|quad|lunge/.test(t)) return 'LEGS';
  if (/deadlift|\bpull\b|\brow\b|\bback\b|snatch/.test(t)) return 'PULL';
  if (/bench|press|push|chest|shoulder|overhead/.test(t)) return 'PUSH';
  const w = t.replace(/[^a-z ]/g, ' ').trim().split(/\s+/)[0] || 'lift';
  return w.slice(0, 5).toUpperCase();
}

/** The page's runSessionCode (D103a): a run's chip, by its key first, then its label. */
export function runSessionCode(sub: string | null | undefined, key: string | null | undefined, type: string | null | undefined): string {
  const K: Record<string, string> = { int: 'SI', chi: 'LI', steady: 'STDY', bench: 'TEST', trial: 'TEST' };
  if (key && K[key]) return K[key]!;
  const s = (sub || '').toLowerCase(), run = !type || type === 'run';
  if (s.indexOf('long interval') >= 0 || s.indexOf('(li)') >= 0) return 'LI';
  if (s.indexOf('short interval') >= 0 || s.indexOf('(si)') >= 0) return 'SI';
  if (s.indexOf('continuous high') >= 0) return run ? 'LI' : 'CHI';
  if (s.indexOf('(int)') >= 0) return run ? 'SI' : 'INT';
  if (s.indexOf('interval') >= 0) return 'INT';
  if (s.indexOf('steady aerobic') >= 0) return 'STDY';
  if (s.indexOf('easy run') >= 0) return 'EASY';
  if (s.indexOf('benchmark') >= 0) return 'TEST';
  if (s.indexOf('long slow') >= 0 || /\blsd\b/.test(s)) return 'LSD';
  return 'RUN';
}

// ── The rest day ─────────────────────────────────────────────────────────────────────────────────────────────────
/** A rest day's logged cardio, by sport. */
export type RestLog = Record<string, { dist?: string | number; mins?: string | number; rpe?: string | number } | null | undefined>;
const REST_WORD: Record<string, string> = { run: 'run', bike: 'ride', swim: 'swim', row: 'row', walk: 'walk' };
const REST_UNIT: Record<string, string> = { run: 'mi', bike: 'mi', swim: 'yd', row: 'm' };

/** The page's restDist: a record's distance in its sport's unit, or 0. */
function restDist(t: string, r: RestLog[string]): number {
  return REST_UNIT[t] && r && +r.dist! > 0 ? Math.round(+r.dist! * 100) / 100 : 0;
}
/** The page's restLogHead: the time when the record holds one, else the distance. */
function restLogHead(t: string, r: RestLog[string]): string {
  const m = r && +r.mins! > 0 ? Math.round(+r.mins!) : 0, d = restDist(t, r);
  return m > 0 ? m + ' min ' + (REST_WORD[t] || t) : d + ' ' + REST_UNIT[t] + ' ' + (REST_WORD[t] || t);
}
/** The page's restLogLines (D229 item 4): one line per sport that holds a time or a distance. */
export function restLogLines(rl: RestLog | null | undefined): string[] {
  if (!rl || typeof rl !== 'object') return [];
  return Object.keys(rl).filter((t) => rl[t] && (+rl[t]!.mins! > 0 || restDist(t, rl[t]) > 0)).map((t) => {
    const r = rl[t]!, d = restDist(t, r);
    return restLogHead(t, r) + ' logged' + (+r.mins! > 0 && d > 0 ? ' · ' + d + ' ' + REST_UNIT[t] : '') + ' · RPE ' + (r.rpe || '—');
  });
}

/** The page's restDayTip, with the time given (the page reads the clock itself): the day's tip, a stretch one day, fuel the next. */
export function restDayTip(nowMs: number): { label: string; text: string; src: string } {
  const dayIx = Math.floor(nowMs / DAY_MS);
  const useStretch = dayIx % 2 === 0;
  const pool = useStretch ? STRETCH_TIPS : NUTRITION_TIPS;
  const tip = pool[Math.floor(dayIx / 2) % pool.length]!;
  return { label: useStretch ? 'Mobility · rest-day stretch' : 'Fuel · recovery nutrition', text: tip, src: 'NSW Physical Fitness Guide' };
}

// ── The Wildcard and the streak (stored state, read only) ────────────────────────────────────────────────────────
/** The page's wildcardOn: the Wildcard done in a day's place, or null. */
export function wildcardOn(store: StateStore, programId: string | null, week: number, dayKey: string | null | undefined): unknown {
  if (!week || !dayKey) return null;
  const m: Record<string, unknown> = {};
  readWildcardDone(store, programId).forEach((x) => { if (x && x.week && x.dayKey) m[dayStoreKey(x.week, x.dayKey)] = x; });
  return m[dayStoreKey(week, dayKey)] || null;
}

/** The page's scheduledDays: every training day inside the block up to a date, oldest first. */
export function scheduledDays(prog: ReadProgram | null | undefined, cutoff?: Date): { week: number; d: string; date: Date }[] {
  const out: { week: number; d: string; date: Date }[] = [];
  if (!prog?.weeks) return out;
  const tw = prog.totalWeeks || Object.keys(prog.weeks).length;
  for (let w = 1; w <= tw; w++) {
    const wk = prog.weeks[w];
    if (!wk) continue;
    ALL_DAYS_ORDER.forEach((d) => {
      const day = wk[d];
      if (!day || day.rest) return;
      const dt = progDayDate(prog, w, d);
      if (!dt) return;
      if (dayBeforeStart(prog, w, d)) return;
      if (cutoff && dt > cutoff) return;
      out.push({ week: w, d, date: dt });
    });
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

/** The page's computeStreak (V195 D71): the trailing run of scheduled days done, a Wildcard rescuing a skip. */
export function computeStreak(store: StateStore, prog: ReadProgram | null | undefined, programId: string | null, today: Date): number {
  const days = scheduledDays(prog, today);
  let n = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const st = dayStatus(store, programId, days[i]!.week, days[i]!.d);
    if (st === 'complete' || st === 'partial') { n++; continue; }
    if (wildcardOn(store, programId, days[i]!.week, days[i]!.d)) { n++; continue; }
    if (st === 'skipped') break;
  }
  return n;
}
