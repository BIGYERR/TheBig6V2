/**
 * Runtime shape checks for the domain types: a value read from storage or from the engine, walked object by object
 * against the types in cfg.ts, program.ts and log.ts.
 *
 * Each check is bound to its type by the compiler: `object<T>` takes one rule for every key of T, required where T
 * requires it and optional where T makes it optional, and each rule's value check must have exactly the key's type.
 * So a type cannot change without its check changing, and the tests that walk real programs through these checks
 * (tests/integration/program-shape.test.ts, tests/sweeps/program-shape.test.ts) keep both in step with the engine. The
 * checks are closed: a key the type does not name is a problem, so a field the engine adds is never silently untyped.
 */
import {
  CARDIO_GOAL_IDS, CARDIO_TYPES, DAY_KEYS, EQUIPMENT, EXPERIENCES, GOALS, INJURY_TIERS, LIFTING_FOCUSES, UNITS,
} from './cfg.ts';
import type { CardioGoal, CardioGoals, Cfg, Injury, MileBestSource, ProgramCfg } from './cfg.ts';
import type { LogBook, LogEntry, LogKey, RestLogEntry, SetDraft } from './log.ts';
import { DAY_TAGS, DOSE_KINDS, TEST_LIFTS } from './program.ts';
import type {
  Cardio, CardioDose, CardioSegment, DoseRange, Item, Program, RestDay, Section, TrainingDay, Week,
} from './program.ts';

/** What a check found. */
export interface ShapeReport {
  /** Every problem as `<path>: <what>`, in walk order; empty when the value has the shape. */
  problems: string[];
  /** How many objects of each kind the walk checked: program, week, day, section, item and the rest. */
  walked: Record<string, number>;
}

/**
 * A runtime check for values of type T. `_type` is never set: it only ties the check to T for the compiler, both ways,
 * so a check for 'run' | 'bike' cannot stand in for one of string, nor the other way round.
 */
interface Check<T> {
  (value: unknown, at: string, report: ShapeReport): void;
  readonly _type?: (t: T) => T;
}

const make = <T>(fn: (value: unknown, at: string, report: ShapeReport) => void): Check<T> => fn;

/** How a problem names the value it found. */
function kindOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  if (typeof v === 'string') return 'the string ' + JSON.stringify(v.length > 40 ? v.slice(0, 40) + '...' : v);
  if (typeof v === 'number' || typeof v === 'boolean') return typeof v + ' ' + String(v);
  if (typeof v === 'object') return 'an object';
  return typeof v;
}

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

const str = make<string>((v, at, r) => {
  if (typeof v !== 'string') r.problems.push(`${at}: want a string, got ${kindOf(v)}`);
});
const num = make<number>((v, at, r) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) r.problems.push(`${at}: want a finite number, got ${kindOf(v)}`);
});
const int = make<number>((v, at, r) => {
  if (typeof v !== 'number' || !Number.isSafeInteger(v)) r.problems.push(`${at}: want an integer, got ${kindOf(v)}`);
});
const bool = make<boolean>((v, at, r) => {
  if (typeof v !== 'boolean') r.problems.push(`${at}: want a boolean, got ${kindOf(v)}`);
});
const anything = make<unknown>(() => {});
/** A field the type names as absent (`?: never`): any value there is a problem. */
const absent = (kind: string): Check<never> =>
  make<never>((_v, at, r) => {
    r.problems.push(`${at}: not a field of ${kind}`);
  });

function oneOf<const V extends readonly (string | number | boolean)[]>(...values: V): Check<V[number]> {
  return make<V[number]>((v, at, r) => {
    if (!values.includes(v as V[number])) {
      r.problems.push(`${at}: want one of ${values.map((x) => JSON.stringify(x)).join(', ')}, got ${kindOf(v)}`);
    }
  });
}

function nullable<T>(check: Check<T>): Check<T | null> {
  return make<T | null>((v, at, r) => {
    if (v !== null) check(v, at, r);
  });
}

function arrayOf<T>(check: Check<T>): Check<T[]> {
  return make<T[]>((v, at, r) => {
    if (!Array.isArray(v)) {
      r.problems.push(`${at}: want an array, got ${kindOf(v)}`);
      return;
    }
    v.forEach((x, i) => check(x, `${at}[${i}]`, r));
  });
}

/** An object used as a map: every key passes `keyOk` (described by `keyWant`), every value passes `check`. */
function recordOf<T, K extends string = string>(keyOk: (k: string) => boolean, keyWant: string, check: Check<T>): Check<Record<K, T>> {
  return make<Record<K, T>>((v, at, r) => {
    if (!isRecord(v)) {
      r.problems.push(`${at}: want an object, got ${kindOf(v)}`);
      return;
    }
    for (const [k, x] of Object.entries(v)) {
      if (!keyOk(k)) r.problems.push(`${at}: key ${JSON.stringify(k)} is not ${keyWant}`);
      check(x, `${at}[${k}]`, r);
    }
  });
}
const anyKey = (): boolean => true;

/** Either of two shapes. When both fail, the problems reported are those of the one that came closer. */
function either<A, B>(a: Check<A>, b: Check<B>): Check<A | B> {
  return make<A | B>((v, at, r) => {
    const tries = [a, b].map((check) => {
      const t: ShapeReport = { problems: [], walked: {} };
      check(v, at, t);
      return t;
    });
    const best = tries.find((t) => t.problems.length === 0) ?? tries.reduce((x, y) => (y.problems.length < x.problems.length ? y : x));
    r.problems.push(...best.problems);
    for (const [k, n] of Object.entries(best.walked)) r.walked[k] = (r.walked[k] ?? 0) + n;
  });
}

interface Field<T, O extends boolean> {
  readonly check: Check<T>;
  readonly optional: O;
}
/** One rule for every key of T: optional exactly where T makes the key optional, checking exactly the key's type. */
type Fields<T> = {
  readonly [K in keyof T]-?: {} extends Pick<T, K> ? Field<Exclude<T[K], undefined>, true> : Field<T[K], false>;
};
const req = <T>(check: Check<T>): Field<T, false> => ({ check, optional: false });
const opt = <T>(check: Check<T>): Field<T, true> => ({ check, optional: true });

/**
 * An object of type T, counted under `kind`. A required key that is absent or undefined is a problem; an optional one
 * may be absent or hold undefined (the engine writes `dose: undefined` on some sessions). A key T does not name is a
 * problem.
 */
function object<T>(kind: string, fields: Fields<T>): Check<T> {
  const rules = fields as unknown as Record<string, Field<unknown, boolean>>;
  return make<T>((v, at, r) => {
    if (!isRecord(v)) {
      r.problems.push(`${at}: want an object (${kind}), got ${kindOf(v)}`);
      return;
    }
    r.walked[kind] = (r.walked[kind] ?? 0) + 1;
    for (const [k, rule] of Object.entries(rules)) {
      const x = v[k];
      if (x === undefined) {
        if (!rule.optional) r.problems.push(`${at}.${k}: missing`);
        continue;
      }
      rule.check(x, `${at}.${k}`, r);
    }
    for (const k of Object.keys(v)) if (!(k in rules)) r.problems.push(`${at}.${k}: not a field of ${kind}`);
  });
}

// ── cfg ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const DAY_KEY = oneOf(...DAY_KEYS);
const CARDIO_TYPE = oneOf(...CARDIO_TYPES);
const GOAL = oneOf(...GOALS);

const MILE_BEST_SOURCE = object<MileBestSource>('mileBestSrc', { kind: req(str), prog: opt(str), n: opt(num) });

const CARDIO_GOAL = object<CardioGoal>('cardioGoal', {
  id: req(str), label: opt(str),
  mileBestMins: opt(str), mileBestSecs: opt(str), mileBestSrc: opt(MILE_BEST_SOURCE),
  baselineDist: opt(str), baseline: opt(str),
  targetDist: opt(str), paceUnit: opt(str), targetMins: opt(str), targetSecs: opt(str), targetTime: opt(str),
  swimUnit: opt(str), ftp: opt(str),
});
const CARDIO_GOALS = object<CardioGoals>('cardioGoals', { run: opt(CARDIO_GOAL), bike: opt(CARDIO_GOAL), swim: opt(CARDIO_GOAL) });

const INJURY = object<Injury>('injury', { region: req(str), tier: req(oneOf(...INJURY_TIERS)), bridge: opt(oneOf(true)), halfstep: opt(oneOf(true)) });

/** Every Cfg rule but goal and seed, which a program's cfg copy requires and an input cfg may leave out. */
const CFG_FIELDS = {
  name: req(str), primaryPath: req(str),
  cardioTypes: req(arrayOf(CARDIO_TYPE)), cardioGoals: req(CARDIO_GOALS), eventTargeted: req(bool),
  liftingFocus: req(oneOf(...LIFTING_FOCUSES)), experience: req(oneOf(...EXPERIENCES)), ageBracket: req(str),
  equipment: req(oneOf(...EQUIPMENT)), unit: req(oneOf(...UNITS)),
  restDays: req(arrayOf(DAY_KEY)), days: req(arrayOf(DAY_KEY)),
  bench: req(num), squat: req(num), deadlift: req(num),
  raceDate: opt(str), injury: opt(nullable(INJURY)),
  exSwapPrefs: opt(recordOf(anyKey, 'a name', str)), startDate: opt(str), raceDateWeeks: opt(nullable(num)),
  _testWeek: opt(nullable(int)), _raceDateCappedWeeks: opt(int),
  _paceShift: opt(recordOf(anyKey, 'a key', anything)), _travel: opt(bool),
} satisfies Omit<Fields<Cfg>, 'goal' | 'seed'>;

const CFG = object<Cfg>('cfg', { ...CFG_FIELDS, goal: opt(GOAL), seed: opt(int) });
const PROGRAM_CFG = object<ProgramCfg>('cfg', { ...CFG_FIELDS, goal: req(GOAL), seed: req(int) });

// ── program ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const ITEM = object<Item>('item', { name: req(str), detail: req(str) });

const SECTION = object<Section>('section', {
  label: req(str), items: req(arrayOf(ITEM)),
  superset: opt(bool), rounds: opt(int), optional: opt(oneOf(true)), hip: opt(oneOf(true)), core: opt(oneOf(true)),
  pillar: opt(str), coreHeader: opt(str),
});

const DOSE_RANGE = object<DoseRange>('doseRange', { lo: req(num), hi: req(num) });
const DOSE = object<CardioDose>('dose', {
  k: req(oneOf(...DOSE_KINDS)),
  tgt: opt(num), cap: opt(num), mi: opt(num), mins: opt(num), key: opt(str), reps: opt(int), m: opt(num), rec: opt(DOSE_RANGE),
});
const SEGMENT = object<CardioSegment>('segment', { label: req(str), yd: req(num), text: req(str) });

const CARDIO = object<Cardio>('cardio', {
  type: req(CARDIO_TYPE), subtype: req(str), detail: req(str), note: req(str), week: req(int),
  goalId: req(oneOf(...CARDIO_GOAL_IDS)), legLoad: req(bool),
  dose: opt(DOSE), segments: opt(arrayOf(SEGMENT)), isNRC: opt(oneOf(true)),
});

const REST_DAY = object<RestDay>('day', {
  title: req(str), dot: req(oneOf('rest')), tags: req(arrayOf(oneOf('rest'))), rest: req(oneOf(true)),
  cardio: opt(absent('day')), sections: opt(absent('day')), note: opt(absent('day')), testLift: opt(absent('day')),
});
const TRAINING_DAY = object<TrainingDay>('day', {
  title: req(str), dot: req(oneOf('lift', ...CARDIO_TYPES)), tags: req(arrayOf(oneOf(...DAY_TAGS))),
  cardio: req(nullable(CARDIO)), sections: req(arrayOf(SECTION)),
  note: opt(str), testLift: opt(oneOf(...TEST_LIFTS)), rest: opt(absent('day')),
});
const DAY = either(REST_DAY, TRAINING_DAY);

const WEEK = object<Week>('week', {
  sun: req(DAY), mon: req(DAY), tue: req(DAY), wed: req(DAY), thu: req(DAY), fri: req(DAY), sat: req(DAY),
});
const isWeekKey = (k: string): boolean => /^[1-9][0-9]*$/.test(k);

const PROGRAM = object<Program>('program', {
  id: req(str), name: req(str), goal: req(GOAL), liftingFocus: req(oneOf(...LIFTING_FOCUSES)), primaryPath: req(str),
  raceDate: req(nullable(str)), raceDateWeeks: req(nullable(num)), legRecoveryNote: req(nullable(str)),
  liftRecoveryWeeks: req(arrayOf(int)), taperWeeks: req(arrayOf(int)),
  seed: req(int), cfg: req(PROGRAM_CFG), weeks: req(recordOf(isWeekKey, 'a week number', WEEK)), totalWeeks: req(int),
  created: req(num), startDate: req(nullable(str)),
  _swapUniverse: req(arrayOf(str)), _swapUniverseByKey: req(recordOf(anyKey, 'a key', anything)),
});

// ── log ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SET_DRAFT = object<SetDraft>('setDraft', { r: req(arrayOf(str)), w: req(arrayOf(str)), L: req(str) });
const REST_LOG_ENTRY = object<RestLogEntry>('restLogEntry', { mins: opt(num), dist: opt(num), rpe: opt(num) });
const PARKED_SPORT = recordOf(anyKey, 'a field', str);

const LOG_ENTRY = object<LogEntry>('logEntry', {
  week: opt(int), ts: opt(num), rpe: opt(either(str, num)),
  run_dist: opt(str), run_pace: opt(str), run_mins: opt(str), run_reps: opt(str), run_rep_time: opt(str),
  bike_mins: opt(str), swim_yards: opt(str), notes: opt(str), swapFrom: opt(str), swapTo: opt(str),
  sets: opt(recordOf(anyKey, 'an exercise key', SET_DRAFT)),
  parked: opt(object<NonNullable<LogEntry['parked']>>('parked', { run: opt(PARKED_SPORT), bike: opt(PARKED_SPORT), swim: opt(PARKED_SPORT) })),
  restLog: opt(recordOf(anyKey, 'an activity', REST_LOG_ENTRY)),
});
const LOG_KEY_RE = new RegExp('^w[1-9][0-9]*_(' + DAY_KEYS.join('|') + ')$');
const LOG_BOOK = recordOf<LogEntry, LogKey>((k) => LOG_KEY_RE.test(k), 'w<week>_<day>', LOG_ENTRY);

// ── entry points ────────────────────────────────────────────────────────────────────────────────────────────────────
function run<T>(check: Check<T>, value: unknown, root: string): ShapeReport {
  const report: ShapeReport = { problems: [], walked: {} };
  check(value, root, report);
  return report;
}

/**
 * Walks a program: every week, day, cardio session, section and item. Beyond the field rules, its weeks must be keyed
 * '1' to String(totalWeeks) in order, every week present.
 */
export function checkProgram(value: unknown): ShapeReport {
  const report = run(PROGRAM, value, 'program');
  if (isRecord(value) && isRecord(value['weeks']) && typeof value['totalWeeks'] === 'number' && Number.isSafeInteger(value['totalWeeks'])) {
    const got = Object.keys(value['weeks']);
    const want = Array.from({ length: value['totalWeeks'] }, (_, i) => String(i + 1));
    if (got.join(',') !== want.join(',')) {
      report.problems.push(`program.weeks: want weeks 1 to ${value['totalWeeks']}, got ${got.length ? got.join(', ') : 'none'}`);
    }
  }
  return report;
}

/** True when `value` has the Program shape (checkProgram finds nothing). */
export function isProgram(value: unknown): value is Program {
  return checkProgram(value).problems.length === 0;
}

/** Checks a program config as the wizard writes it and buildProgram reads it. */
export function checkCfg(value: unknown): ShapeReport {
  return run(CFG, value, 'cfg');
}

/** Checks one session log entry. */
export function checkLogEntry(value: unknown): ShapeReport {
  return run(LOG_ENTRY, value, 'entry');
}

/** Checks a whole session log (`ia_logs_<program id>`): keys `w<week>_<day>`, every value a LogEntry. */
export function checkLogBook(value: unknown): ShapeReport {
  return run<LogBook>(LOG_BOOK, value, 'log');
}
