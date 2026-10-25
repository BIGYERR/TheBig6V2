/**
 * The program config: what the wizard writes (WD in index.html) and buildProgram reads. buildProgram never mutates it.
 *
 * Written from the app's code (startWizard, doGenerate, the cfg reads in the engines) and from real configs. The word
 * lists are the app's own (LIFTING_OPTIONS, LIFTING_FOCUS_TO_GOAL, CARDIO_GOALS_BY_TYPE); a value outside them fails
 * the shape check in tests/integration/program-shape.test.ts, so a new one is added here on purpose.
 */

/** Week day keys, in the app's order (Sunday first, as prog.weeks and cfg.days hold them). */
export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const CARDIO_TYPES = ['run', 'bike', 'swim'] as const;
export type CardioType = (typeof CARDIO_TYPES)[number];

/** Every cardio goal the wizard offers (CARDIO_GOALS_BY_TYPE). */
export const CARDIO_GOAL_IDS = [
  'run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_pace_goal', 'run_base',
  'bike_century', 'bike_50', 'bike_ftp', 'bike_cals', 'bike_base',
  'swim_tri', 'swim_mile', 'swim_100_time', 'swim_500_time', 'swim_base',
] as const;
export type CardioGoalId = (typeof CARDIO_GOAL_IDS)[number];

/** The wizard's lifting focus choices: four on the body path, three support focuses on the event path. */
export const LIFTING_FOCUSES = [
  'strength', 'hypertrophy', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention',
] as const;
export type LiftingFocus = (typeof LIFTING_FOCUSES)[number];

/** The internal goal a lifting focus maps to (LIFTING_FOCUS_TO_GOAL). */
export const GOALS = ['strength', 'hypertrophy', 'fatloss', 'balanced', 'athletic', 'endurance'] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCES = ['beginner', 'intermediate', 'advanced'] as const;
export type Experience = (typeof EXPERIENCES)[number];

/** The six equipment tiers, in the order the wizard lists them. */
export const EQUIPMENT = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const UNITS = ['lbs', 'kg'] as const;
export type Unit = (typeof UNITS)[number];

export const INJURY_TIERS = ['workaround', 'protect'] as const;
export type InjuryTier = (typeof INJURY_TIERS)[number];

/** cfg.injury: a region and how it behaves. Overlays add one of the two flags. */
export interface Injury {
  /** 'knee', 'shoulder', 'lowback', 'elbow', 'hip', 'ankle', 'calf' (v0.245.0) and the rest of the injury plan's regions. */
  region: string;
  tier: InjuryTier;
  /** Optional: only the bridge overlay sets it. */
  bridge?: true;
  /** Optional: only the half-step overlay sets it. */
  halfstep?: true;
}

/**
 * Where a mile best came from: seeded from a finished program (V172 D7b: prog, n), or edited on the goal sheet (at, wk,
 * and the time it replaced in from). Optional throughout.
 */
export interface MileBestSource {
  kind: string;
  prog?: string;
  n?: number;
  /** Optional: an edit's date (YYYY-MM-DD). */
  at?: string;
  /** Optional: the program week an edit was made in. */
  wk?: number;
  /** Optional: the mile best an edit replaced, and where that one came from. */
  from?: { mins: string; secs: string; kind: string };
}

/**
 * One sport's goal. The wizard stores what the athlete typed, as text. Every field but `id` is optional: which ones a
 * goal carries depends on the goal (a pace goal has a target, a race has a mile best and a baseline, FTP has ftp).
 */
export interface CardioGoal {
  /** A CardioGoalId; a stored program can carry an older id (run_mile_time), which the engine maps on read. */
  id: string;
  label?: string;
  mileBestMins?: string;
  mileBestSecs?: string;
  mileBestSrc?: MileBestSource;
  baselineDist?: string;
  baseline?: string;
  targetDist?: string;
  paceUnit?: string;
  targetMins?: string;
  targetSecs?: string;
  targetTime?: string;
  swimUnit?: string;
  /** Swim time goals: the current 500 (the 500 goal) or the current 100 (the 100 goal), minutes and seconds. */
  baseMins?: string;
  baseSecs?: string;
  /** The 100 goal: the current 500, the clock's anchor. */
  base500Mins?: string;
  base500Secs?: string;
  ftp?: string;
}

export type CardioGoals = Partial<Record<CardioType, CardioGoal>>;

export interface Cfg {
  name: string;
  /** The wizard writes 'body', 'event' or 'both'; the engine only asks whether it is 'event'. Older configs carry other words. */
  primaryPath: string;
  cardioTypes: CardioType[];
  cardioGoals: CardioGoals;
  eventTargeted: boolean;
  liftingFocus: LiftingFocus;
  experience: Experience;
  /** The wizard writes '18-35', '36-54' or '55+'; older configs carry other brackets ('36-45'), which the tables default. */
  ageBracket: string;
  equipment: Equipment;
  unit: Unit;
  restDays: DayKey[];
  days: DayKey[];
  bench: number;
  squat: number;
  deadlift: number;
  /** Optional: without one the engine seeds from the clock, so a test always pins it. */
  seed?: number;
  /** Optional: an ISO date (YYYY-MM-DD), only on race goals. The wizard writes '' for none; null reads the same. */
  raceDate?: string | null;
  /** Optional: only on an injured program. */
  injury?: Injury | null;
  /** Optional: written into prog.cfg by buildProgram (LIFTING_FOCUS_TO_GOAL of liftingFocus). */
  goal?: Goal;
  /** Optional: permanent swaps the athlete accepted, old exercise name to new. */
  exSwapPrefs?: Record<string, string>;
  /** Optional: the wizard's start date (YYYY-MM-DD); moved onto the program and deleted from cfg before storing. */
  startDate?: string;
  /** Optional and uncertain: read once by buildProgram; the wizard's "no race" button writes null. */
  raceDateWeeks?: number | null;
  /** Optional: a test goal's pinned test week (doGenerate), null when nothing pins. */
  _testWeek?: number | null;
  /** Optional: the program length doGenerate settled on. */
  _raceDateCappedWeeks?: number;
  /** Optional and uncertain: the pace-shift map refreshProgram derives (paceShiftMap); its shape is not typed yet. */
  _paceShift?: Record<string, unknown>;
  /** Optional: set on the travel overlay's variant builds only. */
  _travel?: boolean;
}

/** The cfg copy a program carries: the input with its goal, seed, cardio types and goals filled in. */
export interface ProgramCfg extends Cfg {
  goal: Goal;
  seed: number;
}
