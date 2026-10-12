// This Week, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase E, step 18:
// the screen moves from the legacy renderWeekView to the WeekView component). The program, the logs, the overlays and
// every helper that reads them (the day codes, the hero summary and time, the travel and Wildcard marks, the streak,
// the rest-day tip, the race alignment) stay the legacy script's; this decides what the screen shows, each word and
// colour the legacy renderWeekView's.

/** One scheduled day of a week, as far as the screen reads it. */
export interface WeekDay {
  rest?: boolean;
  title?: string;
  tags?: string[];
  movedFrom?: string;
  sections?: unknown[];
  cardio?: unknown;
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
  cfg?: { raceDate?: string | null };
  weeks: Record<number, Record<string, WeekDay | undefined> | undefined>;
}

/** A day's session log, as far as the stat tiles and the rest hero read it. */
export interface DayLog {
  run_dist?: string | number;
  restLog?: Record<string, { dist?: string | number; mins?: string | number; rpe?: string | number } | null | undefined>;
}

/** The legacy helpers the screen reads, each called as the legacy renderWeekView called it. */
export interface WeekDeps {
  weekRange(ov: Overlay): { fromWeek: number; toWeek: number } | null;
  parseDate(iso: string): Date | null;
  isTravel(day: WeekDay | undefined): boolean;
  beforeStart(week: number, d: string): boolean;
  regionLabel(region: string): string | undefined;
  icon(name: string, size: number): string;
  dayCode(day: WeekDay | undefined): { top: string; topColor: string; bot: string; botColor: string };
  onGold(hex: string): string;
  wildcardOn(week: number, d: string): boolean;
  wildcardMark(size: number): string;
  statusOf(week: number, d: string): string | undefined;
  heroSummary(day: WeekDay): string;
  sessionTime(day: WeekDay): number;
  travelTag(day: WeekDay): string;
  restTip(): { label: string; text: string; src: string };
  restLines(rl: DayLog['restLog']): string[];
  streak(): number;
  wildcardTag(week: number, heroKey: string | null): string;
  liveInjury(): { region: string } | null;
  alignment(): { raceIso: string } | null;
  raceDay(iso: string): string;
  completedKey(week: number, d: string): string;
  logKey(week: number, d: string): string;
}

/** What the screen reads beside its helpers. */
export interface WeekInput {
  prog: WeekProgram;
  week: number;
  actualWeek: number;
  /** Today at midnight. */
  today: Date;
  /** The Monday of the program's first week, when it has a start. */
  weekMon: Date | null;
  completed: Record<string, { status?: string } | undefined>;
  logs: Record<string, DayLog | undefined>;
  dayFull: Record<string, string>;
}

/** One cell of the day strip. */
export type StripCell =
  | { pre: true; label: string; num: string }
  | { pre: false; key: string; cls: string; label: string; top: string; topColor: string; center: string; bot: string; botColor: string };

/** The big card under the strip: today's rest, a session today or a week browsed, or none. */
export type Hero =
  | { kind: 'rest'; key: string; over: string; lines: string[]; logLabel: string; tip: { label: string; text: string; src: string } }
  | {
    kind: 'day'; key: string; today: boolean; over: string; title: string; time: string;
    tags: { label: string; style: string }[]; travelTag: string; summary: string; status: string; cta: string;
  }
  | { kind: 'none' };

/** The days list: the strip, the hero, the Wildcard tag and the stat tiles. */
export interface DaysView {
  strip: StripCell[];
  hero: Hero;
  wildcardTag: string;
  stats: { done: number; of: number; miles: number; streak: number };
}

/** The whole screen. */
export interface WeekView {
  overline: string;
  bigNum: string;
  /** The phase pill: its markup and its modifier classes. */
  pill: { html: string; cls: string };
  /** The injury wash on the screen, and the HURT? button's state. */
  injuryWeek: boolean;
  hurt: { icon: string; injured: boolean; label: string };
  weeks: { w: number; label: string; active: boolean }[];
  start: { shown: string | null; iso: string };
  race: { aligned: boolean; iso: string; day: string | null };
  days: DaysView | null;
}

const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_OFFSET: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
const MOD: Record<string, [string, string]> = {
  lift: ['#bc6a43', 'rgba(188,106,67,0.15)'], run: ['#5e8c54', 'rgba(94,140,84,0.15)'], bike: ['#3f6e96', 'rgba(63,110,150,0.15)'],
  swim: ['#3f6e96', 'rgba(63,110,150,0.15)'], hip: ['#7e5e96', 'rgba(126,94,150,0.15)'], core: ['#a6822f', 'rgba(166,130,47,0.15)'],
  rest: ['#2c2c2e', 'rgba(24,23,18,0.05)'],
};
const TAG_LABEL: Record<string, string> = { test: 'Test Week', peak: 'Peak Week', run: 'Run', bike: 'Bike', swim: 'Swim', lift: 'Lift', hip: 'Hip', core: 'Core' };
const HERO_STATUS: Record<string, string> = {
  complete: 'Done ✓ Closed out. Open the session to undo.',
  skipped: 'Skipped ✕ The week moves on. Open the session to undo.',
};

/** The phase label by the program's length: thirds up to eight weeks, a four-part split past that. */
export function phaseLabel(week: number, totalWeeks: number, tapered: boolean): string {
  if (totalWeeks <= 6) return ['Phase 1 — Rebuild', 'Phase 2 — Load', 'Phase 3 — Peak'][Math.min(2, Math.floor((week - 1) / (totalWeeks / 3)))]!;
  if (totalWeeks <= 8) return ['Phase 1 — Base', 'Phase 2 — Build', 'Phase 3 — Peak'][Math.min(2, Math.floor((week - 1) / (totalWeeks / 3)))]!;
  const f = (week - 1) / totalWeeks;
  const p4 = tapered ? (totalWeeks > 12 ? 'Taper' : 'Race Prep') : 'Peak & Hold';
  return f < 0.3 ? 'Phase 1 — ' + (totalWeeks >= 16 ? 'Foundation' : 'Base') : f < 0.6 ? 'Phase 2 — Build' : f < 0.82 ? 'Phase 3 — Peak' : 'Phase 4 — ' + p4;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The legacy renderWeekView, as a view. */
export function weekView(i: WeekInput, d: WeekDeps): WeekView {
  const p = i.prog;
  const week = i.week;
  const totalWeeks = p.totalWeeks || 6;
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
  if (injury) pill = { html: escapeHtml('Injury Week · ' + (d.regionLabel(injury.region) || 'Injury')), cls: ' phase-pill--injury' };
  else if (travelWeek) pill = { html: 'Maintenance Week', cls: ' phase-pill--recovery' };
  else if (isTaper) pill = { html: d.icon('🏁', 13) + (week === totalWeeks ? ' Race Week' : ' Race Taper'), cls: ' phase-pill--recovery' };
  else if (isRecov) pill = { html: '↓ Recovery Week', cls: ' phase-pill--recovery' };
  else pill = { html: escapeHtml(phaseLabel(week, totalWeeks, tapered) || ''), cls: '' };

  const liveInj = injury || d.liveInjury();
  const weeks: WeekView['weeks'] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const mark = Array.isArray(p.overlays) && p.overlays.some((ov) => live(ov, w)) ? ' ✦' : '';
    weeks.push({ w, label: 'Wk ' + w + (w === i.actualWeek ? ' ●' : '') + mark, active: w === week });
  }
  const al = d.alignment();
  const view: WeekView = {
    overline: nm.toUpperCase(),
    bigNum: 'WEEK ' + week,
    pill,
    injuryWeek: !!injury,
    hurt: { icon: d.icon('bandage', 17), injured: !!liveInj, label: liveInj ? (d.regionLabel(liveInj.region) || 'INJURY').toUpperCase() : 'HURT?' },
    weeks,
    start: {
      shown: p.startDate ? new Date(p.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      iso: p.startDate || '',
    },
    race: { aligned: !!al, iso: (p.cfg && p.cfg.raceDate) || '', day: al ? d.raceDay(al.raceIso) : null },
    days: null,
  };
  const wkData = p.weeks[week];
  if (!wkData) return view;

  const dayDateOf = (x: string) => {
    if (!i.weekMon) return null;
    const dd = new Date(i.weekMon);
    dd.setDate(i.weekMon.getDate() + (week - 1) * 7 + DAY_OFFSET[x]!);
    dd.setHours(0, 0, 0, 0);
    return dd;
  };
  const isTodayKey = (x: string) => {
    const dd = dayDateOf(x);
    return !!(dd && dd.getTime() === i.today.getTime());
  };
  const strip: StripCell[] = ORDER.map((x) => {
    const day = wkData[x];
    const dd = dayDateOf(x);
    const isToday = isTodayKey(x);
    const isPast = !!(dd && dd < i.today);
    const dnum = dd ? String(dd.getDate()) : '';
    if (d.beforeStart(week, x)) return { pre: true, label: x.toUpperCase(), num: dnum };
    const comp = i.completed[d.completedKey(week, x)];
    const st = comp ? comp.status || 'complete' : null;
    let center = dnum;
    if (st === 'complete' || st === 'partial') center = '<span class="chk">✓</span>';
    else if (d.wildcardOn(week, x)) center = d.wildcardMark(14);
    else if (st === 'skipped') center = '✕';
    const dim = !isToday && (isPast || !day || !!day.rest);
    const code = d.dayCode(day);
    return {
      pre: false,
      key: x,
      cls: 'wk-day' + (isToday ? ' today' : '') + (dim ? ' dim' : '') + (d.isTravel(day) ? ' away' : ''),
      label: x.toUpperCase(),
      top: code.top || '—',
      topColor: isToday ? d.onGold(code.topColor) : dim ? '#5f5f62' : code.topColor,
      center,
      bot: code.bot,
      botColor: isToday ? d.onGold(code.botColor) : dim ? '#5f5f62' : code.botColor,
    };
  });

  const onLiveWeek = week === i.actualWeek && !!i.weekMon;
  let todayKey: string | null = null;
  if (onLiveWeek) ORDER.forEach((x) => {
    if (isTodayKey(x)) todayKey = x;
  });
  if (todayKey && d.beforeStart(week, todayKey)) todayKey = null;
  const firstTrain = ORDER.find((x) => wkData[x] && !wkData[x]!.rest && !d.beforeStart(week, x));
  let heroKey: string | null;
  let mode: 'rest' | 'today' | 'browse';
  const tk = todayKey as string | null;
  if (onLiveWeek && tk && wkData[tk] && wkData[tk]!.rest) {
    mode = 'rest';
    heroKey = tk;
  } else if (onLiveWeek && tk && wkData[tk]) {
    mode = 'today';
    heroKey = tk;
  } else {
    mode = 'browse';
    heroKey = firstTrain || null;
  }
  const heroDay = heroKey ? wkData[heroKey] : undefined;
  const movedFrom = heroDay && heroDay.movedFrom ? i.dayFull[heroDay.movedFrom] || heroDay.movedFrom : null;
  const restLog = heroKey && heroDay && heroDay.rest ? i.logs[d.completedKey(week, heroKey)] || null : null;
  const lines = restLog && restLog.restLog ? d.restLines(restLog.restLog) : [];
  let hero: Hero;
  if (mode === 'rest') {
    hero = { kind: 'rest', key: heroKey!, over: 'Today · ' + i.dayFull[heroKey!], lines, logLabel: lines.length ? 'Log more' : 'Log cardio', tip: d.restTip() };
  } else if (heroKey) {
    const day = heroDay!;
    const status = HERO_STATUS[d.statusOf(week, heroKey) || ''] || '';
    hero = {
      kind: 'day',
      key: heroKey,
      today: mode === 'today',
      over: (mode === 'today' ? 'Today · ' : 'Week ' + week + ' · ') + i.dayFull[heroKey] + (movedFrom ? ' · moved from ' + movedFrom : ''),
      title: day.title || 'Training',
      time: '~' + d.sessionTime(day) + ' MIN',
      tags: (day.tags || []).filter((t) => t !== 'rest').map((t) => ({
        label: TAG_LABEL[t] || t,
        style: 'color:' + (MOD[t] ? MOD[t][0] : '#181712') + ';background:' + (MOD[t] ? MOD[t][1] : 'rgba(24,23,18,0.15)'),
      })),
      travelTag: d.travelTag(day),
      summary: d.heroSummary(day),
      status,
      cta: mode === 'today' && !status ? 'START SESSION' : 'OPEN SESSION',
    };
  } else {
    hero = { kind: 'none' };
  }

  const trainDays = ORDER.filter((x) => wkData[x] && !wkData[x]!.rest && !d.beforeStart(week, x));
  const done = trainDays.filter((x) => {
    const cp = i.completed[d.completedKey(week, x)];
    return cp && (cp.status || 'complete') === 'complete';
  }).length;
  let miles = 0;
  ORDER.forEach((x) => {
    const e = i.logs[d.logKey(week, x)] || {};
    const v = parseFloat(String(e.run_dist));
    if (!isNaN(v)) miles += v;
    const j = +((e.restLog || {})['run'] || {}).dist!;
    if (j > 0) miles += j;
  });
  view.days = {
    strip,
    hero,
    wildcardTag: d.wildcardTag(week, heroKey),
    stats: { done, of: trainDays.length, miles: Math.round(miles * 10) / 10, streak: d.streak() },
  };
  return view;
}
