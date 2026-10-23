/**
 * The session log: `ia_logs_<program id>` in localStorage, one entry per day, keyed `w<week>_<day>` (logKey in
 * index.html). Written from its writers there: persistLogFields (the log form), writeSetDraft (set drafts, V131),
 * setCardioSwap (parked sport fields, V234) and the rest-day jog (restLog, V238), as read through restNorm.
 *
 * Every field but `week` and `ts` belongs to one writer only, so it is optional. `week` and `ts` are optional too: every
 * writer since V131 stamps both, but restNorm keeps an older entry as it finds it and invents neither. The form fields
 * hold what the athlete typed, as text, '' meaning untouched.
 */
import type { CardioType, DayKey } from './cfg.ts';

/** `w<week>_<day>`, as logKey builds it. */
export type LogKey = `w${number}_${DayKey}`;

/** One exercise's set draft: reps and weights per set as typed ('' untouched), and the load label. */
export interface SetDraft {
  r: string[];
  w: string[];
  L: string;
}

/** One sport's rest-day record, in numbers. Each field is optional: the jog records only what was entered. */
export interface RestLogEntry {
  mins?: number;
  dist?: number;
  rpe?: number;
}

export interface LogEntry {
  week?: number;
  /** When the entry was last written (ms). */
  ts?: number;
  /** The RPE slider as text once touched ('' untouched); an older entry can hold a number. */
  rpe?: string | number;
  run_dist?: string;
  run_pace?: string;
  run_mins?: string;
  run_reps?: string;
  run_rep_time?: string;
  bike_mins?: string;
  swim_yards?: string;
  notes?: string;
  /** The planned sport when the athlete logged another one, else ''. */
  swapFrom?: string;
  /** The sport actually logged when it differs from the plan, else ''. */
  swapTo?: string;
  /** Set drafts, by exercise key. */
  sets?: Record<string, SetDraft>;
  /** A swapped-away sport's fields, kept so switching back restores them. */
  parked?: Partial<Record<CardioType, Record<string, string>>>;
  /** The rest-day jog's record, by activity: a sport, or 'walk' (applyRestCardio). */
  restLog?: Record<string, RestLogEntry>;
}

/** One program's whole session log. */
export type LogBook = Record<LogKey, LogEntry>;
