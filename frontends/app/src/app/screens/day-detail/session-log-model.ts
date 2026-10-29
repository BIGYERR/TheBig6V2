// The session sheet's log (the legacy buildLogHTML), kept apart from Angular so the app's node --test suite reads it as
// it is (architecture phase E: the log moves into the SessionLog component). Each word and style is the legacy
// builder's. The cardio fields (the dose form and the wheels) are cardio-fields-model's since step 32; the legacy
// toggleCardioPicker, cardioLive and updateRPEDisplay still change the section in place, and the sport picker's
// setCardioSwap is the SessionLog component's since step 32.
import type { CardioFields } from './cardio-fields-model.ts';

/** A day's log entry, as far as the section reads it. */
export interface LogEntry {
  rpe?: string | number;
  notes?: string;
  swapTo?: string;
  [field: string]: unknown;
}

/** Which sport the day plans, which the log holds, and whether they differ. */
export interface LogPlan {
  /** The planned sport ('' on a day with no run, ride or swim). */
  planned: string;
  hasCardio: boolean;
  /** The sport the log holds: a recorded swap, else the planned one. */
  active: string;
  swapped: boolean;
}

/** One sport chip under "Logged as". */
export interface SwapChip {
  sport: string;
  style: string;
  /** The chip's words: the sport, and " · planned" on the planned one. */
  label: string;
}

export interface SessionLogView {
  /** The RPE slider's value and the words beside it. */
  rpeValue: string;
  rpeText: string;
  cardio: {
    planned: string;
    active: string;
    logged: boolean;
    swapped: boolean;
    chips: SwapChip[];
    note: string;
    logLabel: string;
  } | null;
  /** The notes as the legacy builder wrote them into the box (as markup). */
  notes: string;
}

/** One draw of the log: the section's view, and the cardio fields for the sport the log holds. */
export interface SessionLogData {
  view: SessionLogView;
  fields: CardioFields;
}

/** What the section reads from the legacy script, and the legacy dose it sets for the fields' live readouts. */
export interface SessionLogReads {
  rpeLabels: Record<number, string | undefined>;
  /** The legacy doseFromCardio: the planned session's dose. */
  dose: (cardio: unknown) => unknown;
  /** The legacy _setCurLogDoseFull, _setCurLogSub and _setCurLogDose. */
  setDoseFull: (dose: unknown) => void;
  setSub: (sub: string) => void;
  setDose: (dose: unknown) => void;
  /** The fields for a sport, its dose and subtype (cardio-fields-model's cardioFields over the legacy reads). */
  fields: (sport: string, e: LogEntry, dose: unknown, sub: string) => CardioFields;
  /** The legacy cardioEntryLive: whether the entry holds a number for the sport. */
  live: (e: LogEntry, sport: string) => boolean;
  /** The legacy cardioSwapNoteText. */
  noteText: (active: string, planned: string, e: LogEntry) => string;
  /** The legacy cardioLogLabel. */
  logLabel: (live: boolean) => string;
}

const CARDIO_WORD: Record<string, string> = { run: 'Run', bike: 'Bike', swim: 'Swim' };

/** The day's cardio against its log: only a run, ride or swim gets a field, and a recorded swap reopens on that sport. */
export function logPlan(entry: LogEntry, cardioType: string | undefined): LogPlan {
  const planned = (cardioType || '').toLowerCase();
  const hasCardio = planned === 'run' || planned === 'bike' || planned === 'swim';
  const active = (entry.swapTo as string) || planned;
  return { planned, hasCardio, active, swapped: hasCardio && active !== planned };
}

/** A sport chip's style: orange edged when it is the sport logged. */
export function chipStyle(on: boolean): string {
  return 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:4px;cursor:pointer;border:1px solid ' +
    (on ? 'var(--accent)' : 'var(--border2)') + ';background:' + (on ? 'rgba(var(--ink-rgb),0.12)' : 'var(--surface2)') + ';color:' + (on ? 'var(--accent)' : 'var(--muted)') +
    ';font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.02em';
}

/**
 * The legacy buildLogHTML: the dose set (the planned sport's in full, none for a swapped one), the section's view, and
 * the fields for the sport the log holds.
 */
export function sessionLog(entry: LogEntry, cardio: { type?: string; subtype?: string } | null | undefined, r: SessionLogReads): SessionLogData {
  const plan = logPlan(entry, cardio?.type);
  const dose = plan.hasCardio ? r.dose(cardio) : null;
  const sub = (cardio && cardio.subtype) || '';
  r.setDoseFull(dose);
  r.setSub(sub);
  r.setDose(plan.swapped ? null : dose);
  return { view: sessionLogView(entry, plan, r), fields: plan.hasCardio ? r.fields(plan.active, entry, plan.swapped ? null : dose, sub) : { kind: 'none' } };
}

/** The section's words and states, as the legacy buildLogHTML drew them. */
export function sessionLogView(entry: LogEntry, plan: LogPlan, r: Pick<SessionLogReads, 'rpeLabels' | 'live' | 'noteText' | 'logLabel'>): SessionLogView {
  const rpe = entry.rpe || '';
  const logged = plan.hasCardio && r.live(entry, plan.active);
  return {
    rpeValue: String(rpe || 5),
    rpeText: rpe ? rpe + ' — ' + (r.rpeLabels[+rpe] || '') : 'Move slider',
    cardio: !plan.hasCardio ? null : {
      planned: plan.planned,
      active: plan.active,
      logged,
      swapped: plan.swapped,
      chips: ['run', 'bike', 'swim'].map((s) => ({ sport: s, style: chipStyle(s === plan.active), label: CARDIO_WORD[s] + (s === plan.planned ? ' · planned' : '') })),
      note: plan.swapped ? r.noteText(plan.active, plan.planned, entry) : '',
      logLabel: r.logLabel(logged),
    },
    notes: String(entry.notes || ''),
  };
}
