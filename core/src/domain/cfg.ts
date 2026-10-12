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
  /** 'knee', 'shoulder', 'lowback', 'elbow', 'hip', 'ankle' and the rest of the injury plan's regions. */
  region: string;
  tier: InjuryTier;
  /** Optional: only the bridge overlay sets it. */
  bridge?: true;
  /** Optional: only the half-step overlay sets it. */
  halfstep?: true;
}

/** Where a seeded mile best came from (V172 D7b). Optional throughout: only the wizard's seed path writes it. */
export interface MileBestSource {
  kind: string;
  prog?: string;
  n?: number;
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
  /** '18-35', '36-45', '46-55' and up. */
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
