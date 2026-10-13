// The session log's cardio fields and their wheels (the legacy cardioFieldHTML, _doseStripHTML and iaWheelHTML), kept
// apart from Angular so the app's node --test suite reads them as they are (architecture phase E: the fields move into
// the CardioFields component). Each word, class, id and data attribute is the legacy builders'. The wheels' motion is
// still the legacy iaWheelInit's, which finds them by their classes and data attributes, and the readouts the legacy
// updateDoseDerived's and doseRep's, by id.

/** A wheel column as the legacy _IAW_SPEC lists it. */
export interface WheelColSpec {
  min: number;
  max: number;
  wrap?: boolean;
  nil?: boolean;
  dot?: boolean;
  pad?: number;
}

/** A wheel kind as the legacy _IAW_SPEC lists it. */
export interface WheelSpec {
  fmt: string;
  cap: string;
  cols: WheelColSpec[];
}

/** One column: its index, whether it wraps, its row count, and every row drawn (a wrapping column five times over). */
export interface WheelCol {
  ci: number;
  wrap: boolean;
  len: number;
  items: { v: string; face: string; nil: boolean }[];
}

/** A wheel: its kind, the hidden field it drives and that field's value, its caption, the plan it shows, its columns. */
export interface WheelView {
  kind: string;
  hiddenId: string;
  value: string;
  cap: string;
  ncols: number;
  plan: string | null;
  cols: WheelCol[];
}

/** How many times a wrapping column repeats its rows (the legacy _IAW_REPS). */
export const WHEEL_REPS = 5;

/** The legacy _iawRows: the dash first on a column that has one, then every value. */
export function wheelRows(c: WheelColSpec): string[] {
  const out: string[] = c.nil ? [''] : [];
  for (let v = c.min; v <= c.max; v++) out.push(String(v));
  return out;
}

/** The legacy _iawWraps: a column wraps unless it says not, or it carries the dash. */
export function wheelWraps(c: WheelColSpec): boolean {
  return c.wrap === false ? false : !c.nil;
}

/** The legacy _iawFace: the dash, a decimal digit after its point, a two-digit pad, or the value. */
export function wheelFace(c: WheelColSpec, v: string): string {
  if (v === '') return '—';
  if (c.dot) return '.' + v;
  return c.pad === 2 ? ('00' + v).slice(-2) : v;
}

/** The legacy iaWheelHTML, as a view. */
export function wheelView(spec: Record<string, WheelSpec>, kind: string, hiddenId: string, val: unknown, capOverride?: string | null, plan?: unknown): WheelView {
  const sp = spec[kind]!;
  return {
    kind,
    hiddenId,
    value: String(val == null ? '' : val),
    cap: capOverride || sp.cap,
    ncols: sp.cols.length,
    plan: plan == null || plan === '' ? null : String(plan),
    cols: sp.cols.map((c, ci) => {
      const rows = wheelRows(c);
      const wrap = wheelWraps(c);
      let list = rows;
      if (wrap) {
        list = [];
        for (let r = 0; r < WHEEL_REPS; r++) list = list.concat(rows);
      }
      return { ci, wrap, len: rows.length, items: list.map((v) => ({ v, face: wheelFace(c, v), nil: v === '' })) };
    }),
  };
}

/** A logged session's planned dose, as far as the fields read it. */
export interface Dose {
  k: string;
  mins?: number;
  mi?: number;
  m?: number;
  reps?: number;
  tgt?: number;
  key?: string;
}

/** The plan strip over the fields: the sport and session, and the planned amount (with its pace on a run). */
export interface PlanStrip {
  bike: boolean;
  label: string;
  value: string;
}

/** The reps stepper of a rep session: the reps shown, the reps planned and what each one is, and the stored reps. */
export interface RepStepper {
  shown: string;
  of: string;
  stored: string;
}

export type CardioFields =
  | { kind: 'time' | 'dist'; strip: PlanStrip; first: WheelView; second: WheelView }
  | { kind: 'reps_dist'; strip: PlanStrip; stepper: RepStepper; wheel: WheelView }
  | { kind: 'reps_time'; strip: PlanStrip; stepper: RepStepper; wheel: WheelView }
  | { kind: 'run'; speedHint: boolean; dist: WheelView; pace: WheelView }
  | { kind: 'bike'; strip: PlanStrip | null; wheel: WheelView }
  | { kind: 'swim'; yards: string }
  | { kind: 'none' };

/** What the fields read from the legacy script. */
export interface FieldReads {
  spec: Record<string, WheelSpec>;
  /** The legacy runSessionCode: the session's short code ('RUN' for a plain one). */
  sessionCode: (sub: string, key: string | undefined, sport: string) => string;
  /** The legacy _fmtPaceMi. */
  pace: (sec: number | undefined) => string | null;
}

const WORD: Record<string, string> = { run: 'Run', bike: 'Bike', swim: 'Swim' };

/** The legacy _doseStripHTML. */
export function planStrip(sport: string, dose: Dose, sub: string, r: FieldReads): PlanStrip {
  const code = r.sessionCode(sub || '', dose && dose.key, sport);
  let v = '';
  if (dose.k === 'time') v = dose.mins + ' min';
  else if (dose.k === 'dist') v = dose.mi + ' mi';
  else if (dose.k === 'reps_dist') v = dose.reps + ' × ' + dose.m + 'm';
  else if (dose.k === 'reps_time') v = dose.reps + ' × ' + dose.mins + ' min';
  if (dose.tgt && sport === 'run') v += ' @ ' + r.pace(dose.tgt) + '/mi';
  return { bike: sport === 'bike', label: (WORD[sport] || sport) + (code && code !== 'RUN' ? ' — ' + code : '') + ' · Planned', value: v };
}

/** The legacy cardioFieldHTML: the fields for the sport the log holds, its dose and the session's subtype. */
export function cardioFields(sport: string, entry: Record<string, unknown> | null | undefined, dose: Dose | null, sub: string, r: FieldReads): CardioFields {
  const e = entry || {};
  const w = (kind: string, id: string, val: unknown, plan?: unknown) => wheelView(r.spec, kind, id, val, null, plan);
  const str = (x: unknown) => (x || '') as string;
  if (sport === 'run' && dose) {
    const strip = planStrip('run', dose, sub || '', r);
    const reps = e['run_reps'] !== '' && e['run_reps'] != null && e['run_reps'] !== undefined ? e['run_reps'] : dose.reps || 0;
    const stepper: RepStepper = { shown: String(reps), of: 'of ' + dose.reps + (dose.k === 'reps_time' ? ' · ' + dose.mins + ' min each' : ''), stored: String(str(e['run_reps'])) };
    if (dose.k === 'time') return { kind: 'time', strip, first: w('hms', 'log_run_mins', str(e['run_mins']), dose.mins), second: w('dist', 'log_run_dist', str(e['run_dist'])) };
    if (dose.k === 'dist') return { kind: 'dist', strip, first: w('dist', 'log_run_dist', e['run_dist'] === String(dose.mi) ? '' : str(e['run_dist']), dose.mi), second: w('hms', 'log_run_mins', str(e['run_mins'])) };
    if (dose.k === 'reps_dist') return { kind: 'reps_dist', strip, stepper, wheel: w('rept', 'log_run_rep_time', str(e['run_rep_time'])) };
    if (dose.k === 'reps_time') return { kind: 'reps_time', strip, stepper, wheel: w('dist', 'log_run_dist', str(e['run_dist'])) };
  }
  if (sport === 'run') return { kind: 'run', speedHint: /speed run/i.test(sub || ''), dist: w('dist', 'log_run_dist', str(e['run_dist'])), pace: w('pace', 'log_run_pace', str(e['run_pace'])) };
  if (sport === 'bike') return { kind: 'bike', strip: dose ? planStrip('bike', dose, sub || '', r) : null, wheel: w('hms', 'log_bike_mins', str(e['bike_mins'])) };
  if (sport === 'swim') return { kind: 'swim', yards: String(str(e['swim_yards'])) };
  return { kind: 'none' };
}
