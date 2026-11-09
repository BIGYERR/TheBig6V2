// This Week, kept apart from Angular so the app's node --test suite reads it as it is. The program, the logs, the
// overlays and every helper that reads them (the lift focus and run chips, the hero summary and time, the travel and
// Wildcard marks, the streak, the rest-day tip, the race alignment) stay the legacy script's; this decides what the
// screen shows. D276 P-WEEKSCREEN (docs/decisions/this-week.md): the week title strip, the day strip Sunday first with
// a last title, one word per day, the race row, and D272's run and lift cards (docs/decisions/gps-recording.md).

/** One scheduled day of a week, as far as the screen reads it. */
export interface WeekDay {
  rest?: boolean;
  title?: string;
  tags?: string[];
  movedFrom?: string;
  /** A day whose session moved away: a rest day that takes a jog and never a move (v0.240.0, D231). */
  moved?: boolean;
  sections?: { items?: unknown[]; core?: unknown; hip?: unknown }[];
  cardio?: Cardio | null;
}

/** A day's cardio, as far as the cards read it. */
export interface Cardio {
  type?: string;
  subtype?: string;
  detail?: string;
  note?: string;
  dose?: { k?: string; mins?: number; mi?: number; tgt?: number; cap?: number; key?: string } | null;
}

/** A stored overlay, as far as the screen reads it. */
export interface Overlay {
  type?: string;
  from?: string | null;
  to?: string | null;
  patch?: { injury?: { region: string; bridge?: boolean } };
}

/** The program, as far as the screen reads it. */
export interface WeekProgram {
  name: string;
  totalWeeks?: number;
  startDate?: string | null;
  taperWeeks?: number[];
  liftRecoveryWeeks?: number[];
  overlays?: Overlay[];
  primaryPath?: string;
  liftingFocus?: string;
  cfg?: { raceDate?: string | null };
  weeks: Record<number, Record<string, WeekDay | undefined> | undefined>;
}

/** A day's session log, as far as the cards, the tiles and the rest card read it. */
export interface DayLog {
  [field: string]: unknown;
  swapTo?: string;
  run_dist?: string | number;
  run_mins?: string | number;
  run_pace?: string;
  restLog?: Record<string, { dist?: string | number; mins?: string | number; rpe?: string | number } | null | undefined>;
}

/** The legacy helpers the screen reads, each called as the legacy screen called it. */
export interface WeekDeps {
  weekRange(ov: Overlay): { fromWeek: number; toWeek: number } | null;
  parseDate(iso: string): Date | null;
  isTravel(day: WeekDay | undefined): boolean;
  beforeStart(week: number, d: string): boolean;
  regionLabel(region: string): string | undefined;
  icon(name: string, size: number): string;
  /** The strip's lift focus word for a day title (liftFocusCode). */
  liftFocus(title: string | undefined): string;
  /** A run's chip (runSessionCode). */
  runChip(sub: string, key: string | undefined, type: string | undefined): string;
  wildcardOn(week: number, d: string): boolean;
  statusOf(week: number, d: string): string | undefined;
  heroSummary(day: WeekDay): string;
  sessionTime(day: WeekDay): number;
  restTip(): { label: string; text: string; src: string };
  restLines(rl: DayLog['restLog']): string[];
  streak(): number;
  /** The words under WILDCARD DONE for a day (sheet-marks-model's wildcardSub), or null with no Wildcard. */
  wildcardSub(week: number, key: string | null): string | null;
  liveInjury(): { region: string } | null;
  alignment(): { raceIso: string } | null;
  /** A date as the app prints a day: "Sun, Dec 6" (_fmtStartDay). */
  shortDay(iso: string): string;
  completedKey(week: number, d: string): string;
  logKey(week: number, d: string): string;
}

/** What the screen reads beside its helpers. */
export interface WeekInput {
  prog: WeekProgram;
  /** The week title in view: 1 to the program's weeks, or one past them for the last title. */
  shown: number;
  /** The column picked in that title, 0 (Sunday) to 6 (Saturday), or null for the title's default. */
  picked: number | null;
  /** The program week holding today (calcCurrentWeek). */
  actualWeek: number;
  /** Today at midnight. */
  today: Date;
  /** The Monday of the program's first week, when it has a start. */
  weekMon: Date | null;
  completed: Record<string, { status?: string } | undefined>;
  logs: Record<string, DayLog | undefined>;
  dayFull: Record<string, string>;
  /** Record run is offered: the iOS app with its GPS plugin (D272 item 6). */
  gps: boolean;
}

/** One column of the day strip: empty (before the program, or past its last Sunday), or a program day. */
export type Column =
  | { empty: true; letter: string; num: string }
  | {
    empty: false; letter: string; num: string; week: number; key: string; today: boolean; picked: boolean;
    /** The circle: a check once done, the Wildcard mark, a cross once skipped, else the date. */
    mark: 'check' | 'wild' | 'skip' | 'num';
    /** A filled circle: a session still to come. */
    filled: boolean;
    word: string; wordColor: string; label: string;
  };

/** A card's button: Record run, the hand log, or the deck. */
export interface CardButton { text: string; act: 'record' | 'log' | 'deck'; glow: boolean }

/** A done card's row: what was done, and Reopen. */
export interface DoneRow { title: string; line: string }

/** The run card or the lift card of the picked day. */
export interface DayCard {
  kind: 'run' | 'lift';
  week: number;
  key: string;
  /** The first card carries the day: its when line, and its title at the large size. */
  first: boolean;
  label: string;
  title: string;
  meta: string;
  blurb: string;
  button: CardButton | null;
  done: DoneRow | null;
}

/** The picked rest day: today's words, a jog logged, and its two links. */
export interface RestCard {
  week: number;
  key: string;
  when: string;
  lines: string[];
  logLabel: string;
  anyway: boolean;
}

/** The days below the strips: the day strip, the picked day's cards, the Wildcard tag and the tiles. */
export interface DaysView {
  strip: Column[];
  picked: number;
  cards: DayCard[];
  rest: RestCard | null;
  /** The rest day's tip, under today's rest card. */
  tip: { label: string; text: string; src: string } | null;
  /** The words under WILDCARD DONE, when a Wildcard stands in the picked day. */
  wildcard: string | null;
  stats: { done: number; of: number; miles: number; streak: number };
}

/** The race row on a race plan, else the Program start box. */
export type Row =
  | { kind: 'race'; big: string; small: string; iso: string }
  | { kind: 'start'; shown: string | null; iso: string };

/** The whole screen. */
export interface WeekView {
  overline: string;
  /** The phase pill: its markup and its modifier classes. */
  pill: { html: string; cls: string };
  /** The injury wash on the screen, and the Hurt? pill's state. */
  injuryWeek: boolean;
  hurt: { injured: boolean; label: string };
  titles: { n: number; title: string; active: boolean }[];
  row: Row;
  days: DaysView | null;
}

/** The day strip's columns, Sunday first. */
export const COLS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_MS = 86400000;
/** A week title's width in the strip, px. */
export const TITLE_W = 240;

/** The phase label by the program's length: thirds up to eight weeks, a four-part split past that. */
export function phaseLabel(week: number, totalWeeks: number, tapered: boolean): string {
  if (totalWeeks <= 6) return ['Phase 1 — Rebuild', 'Phase 2 — Load', 'Phase 3 — Peak'][Math.min(2, Math.floor((week - 1) / (totalWeeks / 3)))]!;
  if (totalWeeks <= 8) return ['Phase 1 — Base', 'Phase 2 — Build', 'Phase 3 — Peak'][Math.min(2, Math.floor((week - 1) / (totalWeeks / 3)))]!;
  const f = (week - 1) / totalWeeks;
  const p4 = tapered ? (totalWeeks > 12 ? 'Taper' : 'Race Prep') : 'Peak & Hold';
  return f < 0.3 ? 'Phase 1 — ' + (totalWeeks >= 16 ? 'Foundation' : 'Base') : f < 0.6 ? 'Phase 2 — Build' : f < 0.82 ? 'Phase 3 — Peak' : 'Phase 4 — ' + p4;
}

/** The title after the program's last week: the race on a race plan, else the last day. */
export function lastTitle(race: boolean): string {
  return race ? 'Race Day' : 'Last day';
}

/** The week titles: Week 1 to the last week, then the last title. */
export function weekTitles(totalWeeks: number, race: boolean): string[] {
  const t: string[] = [];
  for (let w = 1; w <= totalWeeks; w++) t.push('Week ' + w);
  t.push(lastTitle(race));
  return t;
}

/**
 * The title holding today. Sunday first, so a program week's Sunday sits in the next title: Monday to Saturday of
 * program week w are title w, its Sunday title w + 1. Before the program, title 1; past its last Sunday, the last title.
 * With no start date there are no dates, and the program's own count stands.
 */
export function liveTitle(weekMon: Date | null, today: Date, totalWeeks: number, actualWeek: number): number {
  if (!weekMon) return Math.min(Math.max(1, actualWeek), totalWeeks + 1);
  const diff = Math.round((today.getTime() - weekMon.getTime()) / DAY_MS);
  return Math.min(Math.max(1, Math.floor((diff + 1) / 7) + 1), totalWeeks + 1);
}

/** The program day under a title's column: Sunday is the week before's, Monday to Saturday the title's own. */
export function columnDay(title: number, col: number, totalWeeks: number): { week: number; key: string } | null {
  if (col === 0) return title - 1 >= 1 && title - 1 <= totalWeeks ? { week: title - 1, key: 'sun' } : null;
  return title <= totalWeeks ? { week: title, key: COLS[col]! } : null;
}

/** A column's date: the title's Monday plus its offset (Sunday the day before). */
export function columnDate(weekMon: Date | null, title: number, col: number): Date | null {
  if (!weekMon) return null;
  const d = new Date(weekMon);
  d.setDate(weekMon.getDate() + (title - 1) * 7 + (col - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The fields a logged session holds, by sport (log-entries.ts CARDIO_PARK_FIELDS). */
const SPORT_FIELDS: Record<string, string[]> = { run: ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time'], bike: ['bike_mins'], swim: ['swim_yards'] };

/** Whether the day's cardio is logged: any figure for the sport the entry is credited to (D213: the active sport only). */
export function cardioLogged(entry: DayLog | undefined | null, type: string | undefined): boolean {
  if (!entry) return false;
  const sport = String(entry.swapTo || type || 'run').toLowerCase();
  return (SPORT_FIELDS[sport] || []).some((f) => {
    const v = entry[f];
    return v !== undefined && v !== null && v !== '' && v !== 0 && v !== '0';
  });
}

/** Seconds as m:ss, or h:mm:ss past the hour. */
export function clock(sec: number): string {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const ss = (x < 10 ? '0' : '') + x;
  return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
}

/** A logged run in one line: its miles, its time and its pace, as far as the entry holds them. */
export function runLine(entry: DayLog | undefined | null): string {
  if (!entry) return '';
  const parts: string[] = [];
  const mi = parseFloat(String(entry.run_dist));
  if (mi > 0) parts.push(+mi.toFixed(2) + ' mi');
  const mins = parseFloat(String(entry.run_mins));
  if (mins > 0) parts.push(clock(mins * 60));
  const pace = String(entry.run_pace || '').trim();
  if (pace && /\d/.test(pace)) parts.push(pace.replace(/\s*\/\s*mi$/, '') + '/mi');
  return parts.join(' · ');
}

const isRace = (c: Cardio | null | undefined) => /RACE DAY/.test(String(c && c.subtype));
const sportOf = (c: Cardio | null | undefined) => String((c && c.type) || '').toLowerCase();

/**
 * The day's one word, never cut (D276, measure tests/measure/this-week_day-codes.md): a run day its run's, a ride or a
 * swim its sport, a lift only day its focus, a rest day REST.
 */
export function dayWord(day: WeekDay | undefined, d: Pick<WeekDeps, 'liftFocus' | 'runChip'>): string {
  if (!day || day.rest) return 'REST';
  const c = day.cardio;
  if (c) {
    const sub = String(c.subtype || '');
    const type = sportOf(c);
    if (type === 'run') {
      if (isRace(c)) return 'RACE';
      if (/^Speed Run/.test(sub)) return 'SPEED';
      if (/^Long Run/.test(sub)) return 'LONG';
      if (/^Recovery Run/.test(sub)) return /shakeout/i.test(day.title || '') ? 'SHAKE' : 'RECOV';
      if (/walk/i.test(sub)) return 'WALK';
      return d.runChip(sub, c.dose ? c.dose.key : undefined, c.type);
    }
    if (type === 'bike') return 'BIKE';
    if (type === 'swim') return 'SWIM';
  }
  const t = String(day.title || '');
  if (/^posterior chain/i.test(t)) return 'HINGE';
  if (/^recovery lift/i.test(t)) return 'LIGHT';
  return d.liftFocus(day.title);
}

/** The run's name on its card: the session's own name, the race as Race Day, the shakeout as a Shakeout Run. */
export function runName(day: WeekDay): string {
  const c = day.cardio || {};
  if (isRace(c)) return 'Race Day';
  if (/shakeout/i.test(day.title || '')) return 'Shakeout Run';
  const head = String(c.subtype || '').split(' — ')[0]!.trim();
  if (head) return head;
  const t = sportOf(c);
  return t === 'bike' ? 'Ride' : t === 'swim' ? 'Swim' : 'Run';
}

/** The run's meta line: its kind (Intervals, Peak), its dose (45 min, 12.5 mi, or the work of a speed session) and its target pace. */
export function runMeta(c: Cardio): string {
  const parts: string[] = [];
  const tag = String(c.subtype || '').split(' — ')[1];
  if (tag && !/RACE DAY/.test(tag)) parts.push(tag.trim());
  const dose = c.dose || null;
  if (dose && dose.k === 'time' && dose.mins) parts.push(dose.mins + ' min');
  else if (dose && dose.k === 'dist' && dose.mi) parts.push(dose.mi + ' mi');
  else {
    const work = /(\d+:\d\d) of work/.exec(String(c.detail || ''));
    if (work) parts.push(work[1] + ' of work');
  }
  if (dose && dose.tgt && sportOf(c) === 'run') parts.push(clock(dose.tgt) + '/mi');
  return parts.join(' · ');
}

/** The sentences of a text, each with its full stop. */
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);

/**
 * The coaching line: the note's first sentence (its LABEL: dropped), then the ceiling the session names ("Do not run
 * faster than", "Average no faster than"); with no note, the detail's first sentence.
 */
export function runBlurb(c: Cardio): string {
  const note = String(c.note || '').replace(/^[A-Z][A-Z0-9 &'’-]*:\s*/, '');
  const detail = sentences(String(c.detail || '').split('\n')[0]!);
  const ceiling = detail.find((s) => /^(Do not run faster than|Average no faster than)/.test(s)) || '';
  const lead = sentences(note)[0] || (ceiling ? '' : detail[0] || '');
  return [lead, ceiling].filter(Boolean).join(' ');
}

/** The lift's summary from the legacy hero summary: its first movement and how many more. */
export function liftSummary(heroSummary: string): string {
  return String(heroSummary || '').split('<br>')[0]!.replace(/<[^>]*>/g, '').trim();
}

/** Whether lifting goes first on a day with both: only when lifting is the program's priority (day-detail's liftsFirst). */
export function liftGoesFirst(p: WeekProgram): boolean {
  return !(p.primaryPath === 'event' || /^support_/.test(String(p.liftingFocus || '')));
}

/** The when line: Today, Tomorrow or Yesterday with the day's name, else the day and its date. */
export function whenText(date: Date | null, today: Date, dayName: string, week: number): string {
  if (!date) return 'Week ' + week + ' · ' + dayName;
  const diff = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  if (diff === 0) return 'Today · ' + dayName;
  if (diff === 1) return 'Tomorrow · ' + dayName;
  if (diff === -1) return 'Yesterday · ' + dayName;
  return dayName + ', ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** The race row's words, from today to race day. */
export function raceRow(daysOut: number, day: string): { big: string; small: string } {
  if (daysOut > 1) return { big: daysOut + ' days out', small: 'Race day ' + day };
  if (daysOut === 1) return { big: '1 day out', small: 'Race day ' + day };
  if (daysOut === 0) return { big: 'Race day today', small: day };
  return { big: 'Raced', small: day };
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** This Week, as a view. */
export function weekView(i: WeekInput, d: WeekDeps): WeekView {
  const p = i.prog;
  const totalWeeks = p.totalWeeks || 6;
  const shown = Math.min(Math.max(1, i.shown), totalWeeks + 1);
  const last = shown === totalWeeks + 1;
  // The program week the title's pill, overlays and injury read: its own, or the last week under the last title.
  const week = Math.min(shown, totalWeeks);
  const al = d.alignment();
  const race = !!al;
  const nm = p.name.length > 26 ? p.name.slice(0, 26) + '…' : p.name;
  const tapered = !!(p.taperWeeks && p.taperWeeks.length > 0);
  const isTaper = Array.isArray(p.taperWeeks) && p.taperWeeks.includes(week);
  const isRecov = Array.isArray(p.liftRecoveryWeeks) && p.liftRecoveryWeeks.includes(week);
  const live = (ov: Overlay | undefined, w: number) => {
    if (!ov || !ov.from) return false;
    const to = ov.to ? d.parseDate(ov.to) : null;
    if (to && to < i.today) return false;
    const r = d.weekRange(ov);
    return !!r && w >= r.fromWeek && w <= r.toWeek;
  };
  let travelWeek = false;
  let injury: { region: string } | null = null;
  try {
    if (Array.isArray(p.overlays)) {
      const inj = p.overlays.find((ov) => live(ov, week) && ov.type === 'injury' && ov.patch && ov.patch.injury);
      if (inj) injury = inj.patch!.injury!;
      if (!inj) {
        const wk = (p.weeks && p.weeks[week]) || {};
        const tds = ORDER.filter((x) => wk[x] && !wk[x]!.rest && !d.beforeStart(week, x));
        travelWeek = tds.length > 0 && tds.every((x) => d.isTravel(wk[x]));
      }
    }
  } catch {
    // The legacy screen swallowed a failure here and drew the week as healthy.
  }
  let pill: WeekView['pill'];
  if (last && race) pill = { html: 'Race Day', cls: ' phase-pill--recovery' };
  else if (injury) pill = { html: escapeHtml('Injury Week · ' + (d.regionLabel(injury.region) || 'Injury')), cls: ' phase-pill--injury' };
  else if (travelWeek) pill = { html: 'Maintenance Week', cls: ' phase-pill--recovery' };
  else if (isTaper) pill = { html: d.icon('🏁', 13) + (week === totalWeeks ? ' Race Week' : ' Race Taper'), cls: ' phase-pill--recovery' };
  else if (isRecov) pill = { html: '↓ Recovery Week', cls: ' phase-pill--recovery' };
  else pill = { html: escapeHtml(phaseLabel(week, totalWeeks, tapered) || ''), cls: '' };

  const liveInj = injury || d.liveInjury();
  const titles = weekTitles(totalWeeks, race).map((title, k) => ({ n: k + 1, title, active: k + 1 === shown }));
  let row: Row;
  if (al) {
    const rd = d.parseDate(al.raceIso);
    const out = rd ? Math.round((rd.getTime() - i.today.getTime()) / DAY_MS) : 0;
    row = { kind: 'race', ...raceRow(out, d.shortDay(al.raceIso)), iso: (p.cfg && p.cfg.raceDate) || al.raceIso };
  } else {
    row = {
      kind: 'start',
      shown: p.startDate ? new Date(p.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      iso: p.startDate || '',
    };
  }
  const view: WeekView = {
    overline: nm,
    pill,
    injuryWeek: !!injury,
    hurt: { injured: !!liveInj, label: liveInj ? (d.regionLabel(liveInj.region) || 'Injury') : 'Hurt?' },
    titles,
    row,
    days: null,
  };
  if (!p.weeks[week]) return view;

  // ── The day strip ──
  const today = i.today.getTime();
  const strip: Column[] = COLS.map((_, col) => {
    const at = columnDay(shown, col, totalWeeks);
    const date = columnDate(i.weekMon, shown, col);
    const num = date ? String(date.getDate()) : '';
    const day = at ? (p.weeks[at.week] || {})[at.key] : undefined;
    if (!at || !day || d.beforeStart(at.week, at.key)) return { empty: true, letter: LETTER[col]!, num };
    const isToday = !!date && date.getTime() === today;
    const isPast = !!date && date.getTime() < today;
    const comp = i.completed[d.completedKey(at.week, at.key)];
    const st = comp ? comp.status || 'complete' : null;
    const done = st === 'complete' || st === 'partial';
    let mark: 'check' | 'wild' | 'skip' | 'num' = 'num';
    if (done) mark = 'check';
    else if (d.wildcardOn(at.week, at.key)) mark = 'wild';
    else if (st === 'skipped') mark = 'skip';
    const rest = !!day.rest;
    const word = dayWord(day, d);
    let wordColor = 'var(--dim)';
    if (word === 'RACE') wordColor = 'var(--signal)';
    else if (!rest && !isPast && !done && st !== 'skipped') {
      const t = sportOf(day.cardio);
      wordColor = !day.cardio ? 'var(--lift)' : t === 'bike' ? 'var(--bike)' : t === 'swim' ? 'var(--swim)' : 'var(--run)';
    }
    return {
      empty: false, letter: LETTER[col]!, num, week: at.week, key: at.key, today: isToday, picked: false, mark,
      filled: !rest && !isPast && !done && st !== 'skipped' && mark === 'num',
      word, wordColor,
      label: (i.dayFull[at.key] || at.key) + (num ? ' ' + num : '') + ', ' + (rest ? 'rest' : day.title || 'Training') + (done ? ', done' : st === 'skipped' ? ', skipped' : ''),
    };
  });

  // ── The picked day ──
  const liveT = liveTitle(i.weekMon, i.today, totalWeeks, i.actualWeek);
  const pickable = (c: number) => !strip[c]!.empty;
  const dayAt = (c: number) => {
    const s = strip[c]!;
    return s.empty ? null : (p.weeks[s.week] || {})[s.key] || null;
  };
  // A session still to do: not rest, not ticked, crossed or stood in for by a Wildcard.
  const openDay = (c: number) => {
    const s = strip[c]!;
    const day = dayAt(c);
    return !s.empty && !!day && !day.rest && s.mark === 'num';
  };
  let pick = i.picked !== null && i.picked >= 0 && i.picked < 7 && pickable(i.picked) ? i.picked : -1;
  if (pick < 0) {
    const todayCol = strip.findIndex((s) => !s.empty && s.today);
    if (shown === liveT && todayCol >= 0) {
      // Today, when it is a rest day or its session is still to do; else the next session still to do this week.
      if (dayAt(todayCol)!.rest || openDay(todayCol)) pick = todayCol;
      else {
        let next = -1;
        for (let c = todayCol + 1; c < 7 && next < 0; c++) if (openDay(c)) next = c;
        pick = next >= 0 ? next : todayCol;
      }
    } else if (last) pick = 0;
    else if (shown < liveT) pick = 6;
    else pick = 1;
    if (!pickable(pick)) {
      const any = [1, 2, 3, 4, 5, 6, 0].find(pickable);
      pick = any === undefined ? -1 : any;
    }
  }
  if (pick >= 0) (strip[pick] as { picked: boolean }).picked = true;

  let cards: DayCard[] = [];
  let rest: RestCard | null = null;
  let tip: DaysView['tip'] = null;
  let wildcard: string | null = null;
  if (pick >= 0) {
    const s = strip[pick] as Extract<Column, { empty: false }>;
    const day = (p.weeks[s.week] || {})[s.key]!;
    const date = columnDate(i.weekMon, shown, pick);
    const dayName = i.dayFull[s.key] || s.key;
    const movedFrom = day.movedFrom ? i.dayFull[day.movedFrom] || day.movedFrom : null;
    const when = whenText(date, i.today, dayName, s.week) + (movedFrom ? ' · moved from ' + movedFrom : '');
    wildcard = d.wildcardSub(s.week, s.key);
    const entry = i.logs[d.logKey(s.week, s.key)] || null;
    if (day.rest) {
      const restLog = i.logs[d.completedKey(s.week, s.key)] || null;
      const lines = restLog && restLog.restLog ? d.restLines(restLog.restLog) : [];
      // v0.240.0: Edit cardio once a jog line prints (D228 item 8); no "Training anyway?" on a day whose session moved away (D231 item 3).
      rest = { week: s.week, key: s.key, when, lines, logLabel: lines.length ? 'Edit cardio' : 'Log cardio', anyway: !day.moved };
      if (s.today) tip = d.restTip();
    } else {
      const status = d.statusOf(s.week, s.key) || '';
      const closed = status === 'complete' || status === 'partial';
      const skipped = status === 'skipped';
      const c = day.cardio || null;
      const hasRun = !!c && !!sportOf(c);
      const hasLift = (day.sections || []).some((x) => (x.items || []).length > 0);
      const summary = liftSummary(d.heroSummary(day));
      const cool = day.title === 'Post-Run Mobility';
      const liftName = cool ? 'Stretch and roll' : day.title || 'Training';
      const travel = d.isTravel(day) ? ' · Travel' : '';
      const runDone = hasRun && (cardioLogged(entry, c!.type) || closed);
      const liftDone = closed;
      const order: ('run' | 'lift')[] = hasRun && hasLift ? (liftGoesFirst(p) && !cool ? ['lift', 'run'] : ['run', 'lift']) : hasRun ? ['run'] : ['lift'];
      const glowAt = skipped ? -1 : order.findIndex((k) => (k === 'run' ? !runDone : !liftDone));
      cards = order.map((k, n): DayCard => {
        const first = n === 0;
        if (k === 'run') {
          const sport = sportOf(c);
          const run = sport === 'run';
          const rec = run && i.gps;
          const logText = sport === 'bike' ? 'Log the ride' : sport === 'swim' ? 'Log the swim' : run ? 'Log the run' : 'Log it';
          const name = runName(day);
          return {
            kind: 'run', week: s.week, key: s.key, first,
            label: first ? when : 'Then run',
            title: name,
            meta: runMeta(c!) + travel,
            blurb: runBlurb(c!),
            button: runDone || skipped ? null : { text: rec ? (isRace(c) ? 'Record the race' : 'Record run') : logText, act: rec ? 'record' : 'log', glow: glowAt === n },
            done: skipped ? { title: name, line: 'Skipped' } : runDone ? { title: name, line: (cardioLogged(entry, c!.type) && sport === 'run' ? runLine(entry) : '') || 'Closed out' } : null,
          };
        }
        const solo = !hasRun;
        return {
          kind: 'lift', week: s.week, key: s.key, first,
          label: first ? when : cool ? 'After the run' : 'Then lift',
          title: liftName,
          meta: solo ? '~' + d.sessionTime(day) + ' min' + travel : '',
          blurb: summary,
          button: liftDone || skipped ? null : { text: solo ? 'Start session' : cool ? 'Start the cool down' : 'Start lift', act: 'deck', glow: glowAt === n },
          done: skipped ? { title: liftName, line: 'Skipped' } : liftDone ? { title: liftName, line: 'Closed out' } : null,
        };
      });
    }
  }

  // ── The tiles, over the seven days the strip shows ──
  let train = 0;
  let done = 0;
  let miles = 0;
  strip.forEach((s) => {
    if (s.empty) return;
    const day = (p.weeks[s.week] || {})[s.key]!;
    const e = i.logs[d.logKey(s.week, s.key)] || {};
    const v = parseFloat(String(e.run_dist));
    if (!isNaN(v)) miles += v;
    const j = +((e.restLog || {})['run'] || {}).dist!;
    if (j > 0) miles += j;
    if (day.rest) return;
    train++;
    const cp = i.completed[d.completedKey(s.week, s.key)];
    if (cp && (cp.status || 'complete') === 'complete') done++;
  });
  view.days = {
    strip,
    picked: pick,
    cards,
    rest,
    tip,
    wildcard,
    stats: { done, of: train, miles: Math.round(miles * 10) / 10, streak: d.streak() },
  };
  return view;
}
