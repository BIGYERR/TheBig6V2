// What a move's fields hold between a typed set and Log, for the Expo deck (MIGRATION.md phase 3, the deck's second
// session). On today's page these are the inputs of an exercise card, drawn by the session sheet's template
// (session-sections.ts) and then read and changed in place by the legacy set handlers (set-logging.ts: stepSet,
// onSetWeight, cascadeSetWeights, reuseWeight, fillAllSetWeights; day-detail.ts: saveExWeight). Here they are one
// plain value per move, and each handler is a function from that value to the next, the page's own rule line for
// line. Nothing here reads or writes the store; deck-writes.ts does, from these.
//
// A field is its text and its placeholder, as an input holds them. A set's load cell also knows whether it still
// inherits the load field (the page's exw-inherit class): the load field's number reaches only the cells that do.
// tests/integration/native-deck-logging.test.ts holds every reader below equal to the page's own, tap for tap.
import type { ExCard, Rx } from '../day-detail/session-sections-model';
import { setsSubLabel, setsSummary, setsVaried } from './deck-readers';

/** A set's rep cell: its text, its placeholder ('max' on an open set), the rung's target and the stepper's step. */
export interface RepField { value: string; placeholder: string; rx: string | null; step: number }
/** A set's load cell: its text, the load it shows while blank, and whether it still inherits the load field. */
export interface LoadCell { value: string; placeholder: string; inherit: boolean }
/** A move's fields. `loads` is empty on a move with no load or no set rows; `load` is null on a move with no load. */
export interface MoveFields {
  reps: RepField[];
  loads: LoadCell[];
  load: { value: string; placeholder: string } | null;
  /** The move holds an entry for this day (the page's `logged` class on the card). */
  logged: boolean;
  /** The reuse pill's words once Log has rewritten them in place, or null while they are the card's own. */
  reuse: { text: string; rec: string } | null;
  /**
   * The set summary and the load's label as the card drew them, until the page would restate them from the cells
   * (refreshSetSummary: after a step or a typed rep, after Log, and, on a move with a load cell per set, after its
   * sets open or a load changes). The two differ where today's entry holds other sets than the card has rows: the
   * card draws the entry's, the cells give the rows'. Null once restated. A move with no set rows is never restated.
   */
  drawn: { head: string; sub: string; varied: boolean; label: string } | null;
}

/** The fields as the template draws them from a card (session-sections.ts): each input's value and placeholder. */
export function fieldsOf(card: ExCard): MoveFields {
  const sets = card.log ? card.log.sets : null;
  const rows = sets ? sets.rows : [];
  const ld = card.log ? card.log.load : null;
  return {
    reps: rows.map((r) => ({ value: r.value, placeholder: r.placeholder, rx: r.rx, step: r.step })),
    loads: rows.filter((r) => r.weight).map((r) => ({ value: r.weight!.value, placeholder: '', inherit: r.weight!.cls === 'exw-inherit' })),
    load: ld ? { value: ld.value, placeholder: '' } : null,
    logged: card.logged,
    reuse: null,
    drawn: card.log ? { head: sets ? sets.head : '', sub: sets ? sets.sub : '', varied: sets ? sets.varied : false, label: ld ? ld.label : 'Load' } : null,
  };
}

/** The page's markTopSet ends in refreshSetSummary only on a move with a load cell per set. */
const restated = (f: MoveFields): MoveFields => (f.loads.length && f.drawn ? { ...f, drawn: null } : f);

/** A move's sets opened (the page's toggleSets, which marks the top set as they open). */
export function openedSets(f: MoveFields): MoveFields {
  return restated(f);
}

const at = <T>(list: T[], i: number, next: T): T[] => list.map((x, k) => (k === i ? next : x));

// ── The handlers (set-logging.ts), each the fields after it ──────────────────────────────────────────────────────
/** The page's stepSet: the row's number, or its placeholder's, moved by a step and never under 0. */
export function stepRep(f: MoveFields, s: number, step: number): MoveFields {
  const el = f.reps[s];
  if (!el) return f;
  let v = parseInt((el.value !== '' ? el.value : el.placeholder) || '0', 10);
  if (isNaN(v)) v = 0;
  v += step;
  if (v < 0) v = 0;
  return { ...f, drawn: null, reps: at(f.reps, s, { ...el, value: String(v) }) };
}

/** A rep typed into a row. */
export function typeRep(f: MoveFields, s: number, text: string): MoveFields {
  const el = f.reps[s];
  return el ? { ...f, drawn: null, reps: at(f.reps, s, { ...el, value: text }) } : f;
}

/** A set's load typed (the page's onSetWeight): the cell inherits the load field again only while it is blank. */
export function typeSetLoad(f: MoveFields, s: number, text: string): MoveFields {
  const el = f.loads[s];
  return el ? restated({ ...f, loads: at(f.loads, s, { ...el, value: text, inherit: text === '' }) }) : f;
}

/** The page's cascadeSetWeights: the load field's number shows in every set's cell that still inherits it. */
function cascade(f: MoveFields): MoveFields {
  if (!f.load) return f;
  const v = (f.load.value !== '' ? f.load.value : f.load.placeholder) || '';
  return restated({ ...f, loads: f.loads.map((el) => (el.inherit ? { ...el, placeholder: v } : el)) });
}

/** The load typed into the load field. */
export function typeLoad(f: MoveFields, text: string): MoveFields {
  return f.load ? cascade({ ...f, load: { ...f.load, value: text } }) : f;
}

/** The page's reuseWeight: the pill's number into the load field. A move with no load field takes nothing. */
export function reuseLoad(f: MoveFields, value: number): MoveFields | null {
  return f.load ? cascade({ ...f, load: { ...f.load, value: String(value) } }) : null;
}

/** The page's fillAllSetWeights: the pill's number into every set's cell, none of them inheriting any longer. */
export function fillLoads(f: MoveFields, value: number): MoveFields {
  return restated({ ...f, loads: f.loads.map((el) => ({ ...el, value: String(value), inherit: false })) });
}

/** What saveExWeight leaves on the card once it has logged: the card logged, the load solid in its field, the pill restated. */
export function afterLog(f: MoveFields, hasW: boolean, dispW: number, unit: string): MoveFields {
  const drawn = f.reps.length ? null : f.drawn;
  if (!f.load || !hasW) return { ...f, logged: true, drawn };
  return { ...f, logged: true, drawn, load: { value: String(dispW), placeholder: String(dispW) }, reuse: { text: dispW + ' ' + unit, rec: 'earlier today' } };
}

// ── What the handlers read (set-logging.ts) ──────────────────────────────────────────────────────────────────────
/** The page's rawSetVals over the rep rows: each cell's text, '' when untouched. */
export function rawReps(f: MoveFields): string[] {
  return f.reps.map((el) => el.value);
}
/** The page's rawSetVals over the load cells. */
export function rawLoads(f: MoveFields): string[] {
  return f.loads.map((el) => el.value);
}
/** The page's setRepVals: each set's number, a blank cell reading its placeholder, and 0 where that is no number. */
export function repVals(f: MoveFields): number[] {
  return f.reps.map((el) => {
    const v = parseInt((el.value !== '' ? el.value : el.placeholder) || '0', 10);
    return isNaN(v) ? 0 : v;
  });
}
/** The page's setWeightVals: each set's load as shown, a blank cell reading the load it inherits. */
export function loadVals(f: MoveFields): number[] {
  return f.loads.map((el) => {
    const v = parseFloat(el.value !== '' ? el.value : el.placeholder);
    return isNaN(v) ? 0 : v;
  });
}

// ── What the card shows from its fields (refreshSetSummary, markTopSet, setDelta) ────────────────────────────────
/** A move's lines as the page keeps them while its fields change. */
export interface FieldsView {
  /** The set summary and the words after it. */
  head: string;
  sub: string;
  varied: boolean;
  /** The load field's label: Top set while the sets' loads differ, else Load. */
  loadLabel: string;
  /** Under the rows: Top set or Every set, and the heaviest load with its unit, a dash when there is none. */
  footLabel: string;
  footValue: string;
  /** Per set: whether its load cell is marked Top (only while the loads differ). */
  top: boolean[];
  /** Per set: the difference from the rung's target, '' when there is none to show. */
  delta: string[];
}

/** The page's refreshSetSummary, markTopSet and setDelta over a move's fields. */
export function fieldsView(f: MoveFields, rx: Rx | null, unit: string): FieldsView {
  const a = loadVals(f), r = repVals(f);
  const vary = setsVaried(a);
  const max = a.length ? Math.max(...a) : 0;
  return {
    head: f.drawn ? f.drawn.head : setsSummary(rx, a, r),
    sub: f.drawn ? f.drawn.sub : setsSubLabel(rx, a, r, f.logged),
    varied: f.drawn ? f.drawn.varied : vary || setsVaried(r),
    loadLabel: f.drawn ? f.drawn.label : vary ? 'Top set' : 'Load',
    footLabel: vary ? 'Top set' : 'Every set',
    footValue: max > 0 ? max + ' ' + unit : '—',
    top: a.map((v) => vary && v === max),
    delta: f.reps.map((el) => {
      if (el.rx === null || el.rx === '') return '';
      let v = parseInt(el.value || '0', 10);
      if (isNaN(v)) v = 0;
      const diff = v - +el.rx;
      return diff === 0 ? '' : diff < 0 ? String(diff) : '+' + diff;
    }),
  };
}
