/**
 * A program as buildProgram returns it (engineD_synthesis in index.html), and as ia_programs stores it.
 *
 * Written from the engine's code and from real builds: HALF_MANNY, the program-output configs, the 864-config lattice
 * (tests/lattice193.js) and a sweep over every cardio goal and lifting focus, measured at v0.239.1. A field is optional
 * when the engine writes it on some objects only, and each one says when. tests/integration/program-shape.test.ts and
 * tests/sweeps/program-shape.test.ts walk real programs through the checks in shape.ts, which the compiler keeps in
 * step with these types, so a field the engine adds, drops or retypes turns a test red.
 */
import type { CardioGoalId, CardioType, DayKey, Goal, LiftingFocus, ProgramCfg } from './cfg.ts';

export interface Program {
  /** 'prog_' plus the clock at build time: not deterministic, so digests strip it. */
  id: string;
  name: string;
  goal: Goal;
  liftingFocus: LiftingFocus;
  primaryPath: string;
  /** An ISO date (YYYY-MM-DD) on race goals, null otherwise. */
  raceDate: string | null;
  /** Null in every measured build (it echoes cfg.raceDateWeeks, which the wizard does not write). */
  raceDateWeeks: number | null;
  /** The lift-placement note, null on a program with no lifting day. */
  legRecoveryNote: string | null;
  /** Week numbers of the lifting recovery (deload) weeks. */
  liftRecoveryWeeks: number[];
  /** Week numbers of the taper weeks. */
  taperWeeks: number[];
  seed: number;
  cfg: ProgramCfg;
  /** Keyed '1' to String(totalWeeks), every week present. */
  weeks: Weeks;
  totalWeeks: number;
  /** The clock at build time (ms): not deterministic, so digests strip it. */
  created: number;
  /** Null from buildProgram; the app writes the resolved start (YYYY-MM-DD) before it stores the program. */
  startDate: string | null;
  /** The exercise names this config may swap between. */
  _swapUniverse: string[];
  /** Empty in every measured build; filled later by the swap sheet. Its values are not typed yet. */
  _swapUniverseByKey: Record<string, unknown>;
}

export type Weeks = Record<string, Week>;

/** One week: all seven days, rest days included. */
export type Week = Record<DayKey, Day>;

/**
 * A rest day or a training day. Each side names the other's fields as absent (`?: never`), so `day.rest`, `day.cardio`
 * and `day.sections` read on any day without narrowing first, and the shape check refuses a day that mixes the two.
 */
export type Day = RestDay | TrainingDay;

export interface RestDay {
  title: string;
  dot: 'rest';
  tags: 'rest'[];
  rest: true;
  cardio?: never;
  sections?: never;
  note?: never;
  testLift?: never;
}

/** The dot the week view shows: the cardio's sport, or 'lift' on a day with no cardio. */
export type TrainingDot = 'lift' | CardioType;

/** 'test' and 'peak' mark the final week of a short strength or hypertrophy block. */
export const DAY_TAGS = ['lift', 'run', 'bike', 'swim', 'core', 'hip', 'test', 'peak'] as const;
export type DayTag = (typeof DAY_TAGS)[number];

export const TEST_LIFTS = ['bench', 'squat', 'deadlift'] as const;
export type TestLift = (typeof TEST_LIFTS)[number];

export interface TrainingDay {
  title: string;
  dot: TrainingDot;
  tags: DayTag[];
  cardio: Cardio | null;
  sections: Section[];
  /** Optional: only on a test or peak day (the final week of a short strength or hypertrophy block). */
  note?: string;
  /** Optional: only on a strength test day. */
  testLift?: TestLift;
  rest?: never;
}

export interface Section {
  label: string;
  items: Item[];
  /** Optional: written true or false on supersets and the sections the superset passes judged. */
  superset?: boolean;
  /** Optional: only on sections done in rounds. */
  rounds?: number;
  /** Optional, and true when present. */
  optional?: true;
  /** Optional, and true when present: a hip prehab section. */
  hip?: true;
  /** Optional, and true when present: a core finisher, which also carries pillar and coreHeader. */
  core?: true;
  /** Optional: only on core finishers ('anti_rotation', 'rotational_power', 'anti_extension', 'dynamic_bracing'). */
  pillar?: string;
  /** Optional: only on core finishers. */
  coreHeader?: string;
}

/** One exercise as prescribed: its name and its prescription text ('3×12 — RPE 6.5 ...'). */
export interface Item {
  name: string;
  detail: string;
}

export interface Cardio {
  type: CardioType;
  /** The session name ('Speed Run — Intervals', 'Long Run'); NRC names are Nike-verbatim. */
  subtype: string;
  detail: string;
  note: string;
  week: number;
  goalId: CardioGoalId;
  /** Whether the session loads the legs (the calendar keeps heavy legs off its eve). */
  legLoad: boolean;
  /** Optional: a structured dose on most sessions; the key can be present holding undefined. */
  dose?: CardioDose;
  /** Optional: measured on swim sessions only; the key can be present holding undefined. */
  segments?: CardioSegment[];
  /** Optional, and true when present: a Nike Run Club session. */
  isNRC?: true;
}

export const DOSE_KINDS = ['time', 'dist', 'reps_time', 'reps_dist'] as const;
export type DoseKind = (typeof DOSE_KINDS)[number];

/** What a session prescribes, in numbers the log form reads. Every field but `k` depends on the kind. */
export interface CardioDose {
  k: DoseKind;
  /** Optional: the target pace in seconds, read off the pace chart. */
  tgt?: number;
  /** Optional: the easy-day ceiling pace in seconds. */
  cap?: number;
  /** Optional: miles. */
  mi?: number;
  /** Optional: minutes. */
  mins?: number;
  /** Optional: the session family ('int', 'chi', 'easy', 'long', 'steady', 'bench'). */
  key?: string;
  /** Optional: repeats. */
  reps?: number;
  /** Optional: metres per repeat. */
  m?: number;
  /** Optional: the recovery range between repeats. */
  rec?: DoseRange;
}

export interface DoseRange {
  lo: number;
  hi: number;
}

export interface CardioSegment {
  label: string;
  yd: number;
  text: string;
}
