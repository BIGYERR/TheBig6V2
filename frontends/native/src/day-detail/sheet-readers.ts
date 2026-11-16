// What the session sheet reads besides its cards (MIGRATION.md phase 3, the session sheet's first session): the
// page's own readers behind the Angular sheet's header, its cardio card and its log, ported line for line, with the
// page's globals (the store, the active program, the week and the day in hand) taken as arguments. Nothing here
// writes a key. tests/integration/native-session-sheet.test.ts holds the sheet they feed equal to today's, whole.
//
//   MOD_PAL, modTagsHTML's palette        wheel-log.ts          tagMeta                 week-view-sections.ts
//   sessionLogProgress                    wheel-log.ts          exLoggable              set-logging.ts
//   _IAW_SPEC                             wheel-log.ts          _benchmarkEntryFor      set-logging.ts
//   RPE_LABELS, cardioSwapNoteText,       log-entries.ts        cardioLogLabel          day-status.ts
//   _fmtPaceMi, _parseClock, doseFromCardio, doseDerived
import { _clkMS } from '@ia/core/engine/clock-format.ts';
import { isTrackableWeight } from '@ia/core/engine/exercise-kinds.ts';
import { exStoreKey } from '@ia/core/engine/exercise-library.ts';
import { readDayHistory } from '@ia/core/engine/state-day-history.ts';
import { CARDIO_PARK_FIELDS, readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { entryDay } from '@ia/core/engine/state-lift-log.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { isKBExercise, parseRx } from '../deck/deck-readers';
import type { Dose, WheelSpec } from './cardio-fields-model';
import type { ExEntry, ExSection } from './session-sections-model';
import type { BenchEntry } from './sheet-marks-model';

/** The page's MOD_PAL: a header tag's two colours, as the page writes them (the screen reads the token's name). */
export const MOD_PAL: Record<string, readonly [string, string]> = {
  test: ['var(--signal)', 'rgba(var(--signal-rgb),0.15)'], peak: ['var(--signal)', 'rgba(var(--signal-rgb),0.15)'], lift: ['var(--lift)', 'rgba(var(--lift-rgb),0.15)'],
  run: ['var(--run)', 'rgba(var(--run-rgb),0.15)'], bike: ['var(--bike)', 'rgba(var(--bike-rgb),0.15)'], swim: ['var(--swim)', 'rgba(var(--swim-rgb),0.15)'], hip: ['var(--hip)', 'rgba(var(--hip-rgb),0.15)'], core: ['var(--core)', 'rgba(var(--core-rgb),0.15)'],
};
/** The page's tagMeta: a tag's class and its words. */
export const TAG_META: Record<string, { cls: string; label: string }> = {
  test: { cls: 't-test', label: 'Test Week' }, peak: { cls: 't-peak', label: 'Peak Week' }, run: { cls: 't-run', label: 'Run' }, bike: { cls: 't-bike', label: 'Bike' },
  swim: { cls: 't-swim', label: 'Swim' }, lift: { cls: 't-lift', label: 'Lift' }, hip: { cls: 't-hip', label: 'Hip' }, core: { cls: 't-core', label: 'Core' },
};
/** The page's RPE_LABELS: the words beside the effort slider. */
export const RPE_LABELS: Record<number, string> = { 1: 'Very Easy', 2: 'Easy', 3: 'Moderate', 4: 'Somewhat Hard', 5: 'Hard', 6: 'Hard+', 7: 'Very Hard', 8: 'Very Hard+', 9: 'Max Effort', 10: 'All Out' };
/** The page's _IAW_SPEC: the wheels of the cardio log, by kind. */
export const IAW_SPEC: Record<string, WheelSpec> = {
  dist: { fmt: 'dec3', cap: 'Miles', cols: [{ min: 0, max: 99, wrap: false }, { min: 0, max: 9, dot: true }, { min: 0, max: 9 }] },
  pace: { fmt: 'clock', cap: 'Pace / mile', cols: [{ min: 4, max: 17, nil: true }, { min: 0, max: 59, pad: 2 }] },
  rept: { fmt: 'clock', cap: 'Typical rep', cols: [{ min: 0, max: 9, wrap: false }, { min: 0, max: 59, pad: 2 }] },
  hms: { fmt: 'hms', cap: 'Time', cols: [{ min: 0, max: 9, wrap: false }, { min: 0, max: 59, pad: 2 }, { min: 0, max: 59, pad: 2 }] },
};

/** The page's exLoggable: the card draws a log for the move. */
export function exLoggable(name: string, detail: string): boolean {
  if (parseRx(detail, name)) return true;
  if (isKBExercise(name)) return true;
  if (isTrackableWeight(name)) return true;
  return false;
}

/**
 * The page's sessionLogProgress: the day's loggable moves, and those the lift log holds an entry for on this week and
 * day. A skipped round or move is not part of the day's work, so it is in neither number.
 */
export function sessionLogProgress(day: { sections?: ExSection[] } | null | undefined, stored: Record<string, { entries?: ExEntry[] } | undefined>, week: number, dayKey: string): { done: number; total: number } {
  let total = 0, done = 0;
  ((day && day.sections) || []).forEach((sec) => {
    if (sec && sec._skipped) return;
    (sec.items || []).forEach((i) => {
      if (i && i._skipped) return;
      const name = i.name || '';
      if (!exLoggable(name, i.detail || '')) return;
      total++;
      const exKey = exStoreKey(name);
      const entries = (stored[exKey] && stored[exKey]!.entries) || [];
      if (entries.some((e) => +(e.week as number) === +week && entryDay(e as { day?: string; ts?: number }) === dayKey)) done++;
    });
  });
  return { done, total };
}

/** The page's cardioLogLabel. */
export function cardioLogLabel(live: boolean): string { return live ? 'Logged ✓' : 'Log'; }

const CARDIO_WORD: Record<string, string> = { run: 'Run', bike: 'Bike', swim: 'Swim' };
/** The page's cardioSwapNoteText (D214): the second sentence only when the planned sport has a parked set holding a number. */
export function cardioSwapNoteText(active: string, planned: string, e: { parked?: Record<string, Record<string, unknown> | undefined> } | null | undefined): string {
  const p = e && e.parked && e.parked[planned];
  const kept = !!p && (CARDIO_PARK_FIELDS[planned] || []).some((f) => p[f] != null && p[f] !== '');
  return `Counts toward ${CARDIO_WORD[active]}, not ${CARDIO_WORD[planned]}.` + (kept ? ` Your ${CARDIO_WORD[planned]} numbers are kept. Switch back and they return.` : '');
}

/** The page's _fmtPaceMi. */
export function fmtPaceMi(sec: number | undefined | null): string | null { if (!isFinite(sec as number) || (sec as number) <= 0) return null; return _clkMS(sec as number); }
/** The page's _parseClock: "2:04" or bare seconds, as seconds. */
export function parseClock(t: unknown): number | null {
  if (!t) return null;
  const x = String(t).trim();
  if (x.indexOf(':') >= 0) { const q = x.split(':'); if (q.length === 2 && q[0] !== '' && isFinite(+q[0]!) && isFinite(+q[1]!)) return (+q[0]!) * 60 + (+q[1]!); return null; }
  const n = +x; return isFinite(n) && n > 0 ? n : null;
}

/** A day's cardio, as far as its dose is read. */
export interface CardioDay { type?: string; subtype?: string; detail?: string; dose?: (Dose & { parsed?: boolean }) | null }

/**
 * The page's doseFromCardio: the dose the session carries, else a parse of its detail. Run and bike only; a bike
 * interval never parses; a progression run carries no target pace.
 */
export function doseFromCardio(c: CardioDay | null | undefined): (Dose & { parsed?: boolean }) | null {
  if (!c) return null;
  if (c.dose && c.dose.k) return c.dose;
  const t = (c.type || '').toLowerCase();
  if (t !== 'run' && t !== 'bike') return null;
  if (t === 'bike' && /interval/i.test(c.subtype || '')) return null;
  const d = String(c.detail || '');
  const tm = d.match(/(\d+):(\d{2})\/mi/);
  let tgt: number | null = tm ? ((+tm[1]!) * 60 + (+tm[2]!)) : null;
  if (/as a progression/i.test(d)) tgt = null;
  let m: RegExpMatchArray | null;
  if ((m = d.match(/(\d+)\s*x\s*(\d+)\s*m\b/i))) return { k: 'reps_dist', reps: +m[1]!, m: +m[2]!, tgt: tgt as number, parsed: true };
  if ((m = d.match(/(\d+)\s*x\s*(\d+)\s*min\b/i))) return { k: 'reps_time', reps: +m[1]!, mins: +m[2]!, tgt: tgt as number, parsed: true };
  if ((m = d.match(/(\d+(?:\.\d+)?)[-\s]*min(?:ute)?s?\b/i))) return { k: 'time', mins: +m[1]!, tgt: tgt as number, parsed: true };
  if ((m = d.match(/(\d+(?:\.\d+)?)\s*mi(?:les?)?\b/))) return { k: 'dist', mi: +m[1]!, tgt: tgt as number, parsed: true };
  return null;
}

/** What a logged form derives: the pace, and on a rep session the distance. */
export interface Derived { sec?: number; pace?: string; tgt?: number; dist?: number | null; assumed?: string | null; vol?: string; workMin?: number }

/**
 * The page's doseDerived: the fixed dimension falls back to the plan; the free one must have been entered, or
 * nothing derives.
 */
export function doseDerived(dose: Dose | null | undefined, v: { mins: string; dist: string; reps: string | null | undefined; rep: string }): Derived | null {
  if (!dose) return null;
  const dist = parseFloat(v.dist) || 0, mins = parseFloat(v.mins) || 0;
  const reps = (v.reps === '' || v.reps == null) ? null : (+v.reps || 0);
  const repS = parseClock(v.rep);
  if (dose.k === 'time') {
    if (!(dist > 0)) return {};
    const useM = mins > 0 ? mins : dose.mins!, sec = useM * 60 / dist;
    return { sec, pace: fmtPaceMi(sec) + '/mi', tgt: dose.tgt, assumed: mins > 0 ? null : ('assuming planned ' + dose.mins + ' min') };
  }
  if (dose.k === 'dist') {
    if (!(mins > 0)) return {};
    const useD = dist > 0 ? dist : dose.mi!, sec = mins * 60 / useD;
    return { sec, pace: fmtPaceMi(sec) + '/mi', tgt: dose.tgt, dist: (dist > 0 ? null : useD), assumed: dist > 0 ? null : ('assuming planned ' + dose.mi + ' mi') };
  }
  if (dose.k === 'reps_dist') {
    const out: Derived = {};
    if (reps != null && reps > 0) { out.dist = +((reps * dose.m!) / 1609.34).toFixed(2); out.vol = reps + ' × ' + dose.m + 'm'; }
    if (repS) { const sec = repS / (dose.m! / 1609.34); out.sec = sec; out.pace = fmtPaceMi(sec) + '/mi'; out.tgt = dose.tgt; }
    return out;
  }
  if (dose.k === 'reps_time') {
    if (!(dist > 0)) return {};
    const useR = (reps != null && reps > 0) ? reps : dose.reps!, wm = useR * dose.mins!, sec = wm * 60 / dist;
    return { sec, pace: fmtPaceMi(sec) + '/mi', tgt: dose.tgt, workMin: wm, assumed: (reps != null && reps > 0) ? null : ('assuming planned ' + dose.reps + ' reps') };
  }
  return null;
}

/**
 * The page's _benchmarkEntryFor: the benchmark run logged in a week, read from the day's log and the day as it was
 * snapshotted (the snapshot names the benchmark; a swapped session and a day with no snapshot are passed over).
 */
export function benchmarkEntryFor(store: StateStore, programId: string | null, weekWanted: number | undefined): BenchEntry | null {
  try {
    const logs = readDayLogs(store, programId) as unknown as Record<string, { swapTo?: string; run_dist?: string; run_mins?: string } | undefined>;
    const hist = readDayHistory(store, programId) as unknown as Record<string, { cardio?: CardioDay } | undefined>;
    let out: BenchEntry | null = null;
    Object.entries(logs || {}).forEach(([key, e]) => {
      if (!e || e.swapTo) return;
      const m = key.match(/^w(\d+)_(.+)$/); if (!m || +m[1]! !== weekWanted) return;
      const snap = hist && hist[key]; if (!snap || !snap.cardio) return;
      const c = snap.cardio;
      if (String(c.type || '').toLowerCase() !== 'run') return;
      if (!/^Benchmark Run/.test(String(c.subtype || ''))) return;
      const dist = parseFloat(e.run_dist as string); if (!(dist > 0)) return;
      const loggedMins = parseFloat(e.run_mins as string);
      const mins = (loggedMins > 0) ? loggedMins : ((c.dose && c.dose.mins! > 0) ? c.dose.mins! : 20);
      out = { dist: +dist.toFixed(2), mins, sec: mins * 60 / dist };
    });
    return out;
  } catch { return null; }
}
