// The cardio's hand log in the Expo app (MIGRATION.md phase 3, row 3: the cardio sheet; D289 P-NATIVEWRITES): what a
// rolled wheel, the reps stepper, Log and the sport picker hold and write. Every write ends in core's own writers
// through sheet-writes.ts (persistLog, and parkSport for the picker), the one file that calls them. What stands here is the page's code around them,
// line for line, with the page's elements read from LogForm and the dose the page keeps in three globals
// (_curLogDose, _curLogDoseFull, _curLogSub) held in CardioLog:
//
//   logCardio, toggleCardioPicker, setCardioSwap (the Angular session-log.ts's swap)     day-status.ts
//   updateDoseDerived, doseRep                                                           log-entries.ts
//   the fields' input listener (the Angular day-detail.ts open() and session-log.ts)     day-detail.ts
//
// Each rule keeps its ruling: the dose grammar V148, the park and the note V234 (D213, D214), draft and logged V236
// (D218), the readout's gap V191 (D40). tests/integration/native-cardio-sheet.test.ts holds the store equal to today's
// page, key for key, after the same taps.
import { CARDIO_PARK_FIELDS } from '@ia/core/engine/state-day-log.ts';

import type { Session } from '../deck/deck-writes';
import { runSessionCode } from '../this-week/week-readers';
import { type CardioFields, type Dose, cardioFields } from './cardio-fields-model';
import type { SessionLogData } from './session-log-model';
import { type CardioDay, IAW_SPEC, cardioSwapNoteText, doseDerived, doseFromCardio, fmtPaceMi } from './sheet-readers';
import { type LogForm, cardioLive, nodesOf, parkSport, persistLog } from './sheet-writes';

/**
 * The cardio card of the log between a draw and a write: the fields on show, the dose they were drawn with (none on a
 * swapped sport), the planned sport's dose in full and its subtype (so the planned sport's form comes back), whether
 * the picker is open, the note under the chips, and the reps the stepper shows.
 */
export interface CardioLog {
  fields: CardioFields;
  dose: Dose | null;
  doseFull: Dose | null;
  sub: string;
  picker: boolean;
  note: string;
  repsShown: string | null;
}

const repsOf = (f: CardioFields): string | null => (f.kind === 'reps_dist' || f.kind === 'reps_time' ? f.stepper.shown : null);

/** The card a draw leaves (session-log-model's sessionLog, and the picker open on a swapped sport). */
export function cardioLogOf(log: SessionLogData, cardio: CardioDay | null | undefined, dose: Dose | null): CardioLog {
  const c = log.view.cardio;
  return {
    fields: log.fields,
    dose,
    doseFull: c ? doseFromCardio(cardio) : null,
    sub: (cardio && cardio.subtype) || '',
    picker: !!c && c.swapped,
    note: c ? c.note : '',
    repsShown: repsOf(log.fields),
  };
}

/** The fields' input listener: the node holds the new value, and the form is saved once the card is logged (D218). */
export function setNode(s: Session, f: LogForm, c: CardioLog, id: string, value: string, now: number): LogForm {
  const next: LogForm = { ...f, nodes: { ...f.nodes, [id]: value } };
  if (cardioLive(s, next)) persistLog(s, next, c.dose, false, now);
  return next;
}

/** One row of the readout under the fields. */
export interface ReadoutRow {
  label: string;
  value: string;
  small: string;
  /** Nothing derived yet: the row says what to enter. */
  empty: boolean;
  /** The pace under the work done, with no rule between them. */
  joined: boolean;
}

/**
 * The page's updateDoseDerived, as a view: nothing on the generic form; the work done on a rep session; the pace with
 * what it assumed, its gap to the target (seconds under a minute, m:ss from there, on target inside five seconds) and
 * the work minutes; or the one row that says what to enter.
 */
export function doseReadout(dose: Dose | null, nodes: Record<string, string>): ReadoutRow[] {
  if (!dose) return [];
  const g = (id: string): string => nodes[id] || '';
  const d = doseDerived(dose, { mins: g('log_run_mins'), dist: g('log_run_dist'), reps: g('log_run_reps'), rep: g('log_run_rep_time') });
  if (!d) return [];
  const rows: ReadoutRow[] = [];
  if (d.vol) rows.push({ label: 'Work done', value: d.dist != null ? d.dist + ' mi' : '', small: d.vol, empty: false, joined: false });
  if (d.pace) {
    let delta = '';
    if (d.tgt && d.sec) {
      const df = Math.round(d.sec - d.tgt), ad = Math.abs(df);
      const mag = ad < 60 ? (ad + 's/mi') : (Math.floor(ad / 60) + ':' + String(ad % 60).padStart(2, '0') + '/mi');
      delta = ad < 5 ? 'on target' : (mag + ' ' + (df < 0 ? 'faster than target' : 'slower than target'));
    }
    const note = [d.assumed, delta, (d.workMin ? ('over ' + d.workMin + ' work min') : null)].filter(Boolean).join(' · ');
    rows.push({ label: 'Your pace', value: d.pace, small: note, empty: false, joined: !!d.vol });
  }
  if (!rows.length) rows.push({ label: dose.k === 'reps_dist' ? 'Your rep pace' : 'Your pace', value: dose.k === 'dist' ? 'enter minutes' : (dose.k === 'reps_dist' ? 'enter a rep time' : 'enter distance'), small: '', empty: true, joined: false });
  return rows;
}

/**
 * The page's doseRep: the stepper starts from the plan while its field is blank, moves one rep inside 0 to 30, and
 * shows what it holds. On a draft card it is form only; the Log tap commits it (D218).
 */
export function stepReps(s: Session, f: LogForm, c: CardioLog, delta: number, now: number): { form: LogForm; log: CardioLog } {
  if (!('log_run_reps' in f.nodes) || !c.dose) return { form: f, log: c };
  const h = f.nodes['log_run_reps']!;
  const base = h === '' ? (c.dose.reps || 0) : (+h || 0);
  const v = Math.max(0, Math.min(30, base + delta));
  const form: LogForm = { ...f, nodes: { ...f.nodes, log_run_reps: String(v) } };
  if (cardioLive(s, form)) persistLog(s, form, c.dose, false, now);
  return { form, log: { ...c, repsShown: String(v) } };
}

/** The toast a logged card raises, by the sport the chip credits. */
export const CARDIO_LOGGED_TOAST: Record<string, string> = { run: 'Run logged ✓', bike: 'Ride logged ✓', swim: 'Swim logged ✓' };

/**
 * The page's logCardio: the commit for a draft card. A card with every field of its sport blank writes nothing and
 * says so. Otherwise the form is saved as a commit, and the toast names the sport the chip credits. Null where the
 * day has no run, ride or swim. A wheel still settling is rested by the screen first (the page's iaWheelFlush).
 */
export function logCardio(s: Session, f: LogForm, c: CardioLog, now: number): string | null {
  if (!f.wrap) return null;
  const sport = f.wrap.active || f.wrap.planned || '';
  const g = (v: string): string => f.nodes[v] || '';
  if ((CARDIO_PARK_FIELDS[sport] || []).every((fld) => g('log_' + fld) === '')) return 'Nothing to log yet.';
  persistLog(s, f, c.dose, true, now);
  return CARDIO_LOGGED_TOAST[sport]!;
}

/** The page's toggleCardioPicker: Did a different activity? opens the picker, and closes it. */
export function togglePicker(c: CardioLog): CardioLog {
  return { ...c, picker: !c.picker };
}

/**
 * The page's setCardioSwap (V234 D213): the chip credits the sport, it never erases. The store is brought level with
 * the form under the leaving sport; its numbers park on the entry and the arriving sport's come back; the fields are
 * drawn for the new sport, with the planned dose only for the planned sport; the note follows; and the new form is
 * saved. A tap on the sport the card is on moves nothing and saves the form twice, as the page does.
 */
export function swapSport(s: Session, f: LogForm, c: CardioLog, sport: string, now: number): { form: LogForm; log: CardioLog } {
  if (!f.wrap) return { form: f, log: c };
  const planned = f.wrap.planned || '';
  const leaving = f.wrap.active || planned;
  persistLog(s, f, c.dose, false, now);
  const e = parkSport(s, leaving, sport);
  const dose = sport === planned ? c.doseFull : null;
  const fields = cardioFields(sport, e, dose, c.sub, { spec: IAW_SPEC, sessionCode: (sub, k, t) => runSessionCode(sub, k, t), pace: (sec) => fmtPaceMi(sec) });
  const form: LogForm = { ...f, nodes: nodesOf(fields), wrap: { planned: f.wrap.planned, active: sport } };
  const note = sport !== planned ? cardioSwapNoteText(sport, planned, e as never) : '';
  persistLog(s, form, dose, false, now);
  return { form, log: { ...c, fields, dose, note, repsShown: repsOf(fields) } };
}
