// The Expo app's cardio sheet against today's page (MIGRATION.md phase 3, row 3): the walker of the session sheet
// (support/native-session-sheet.ts TwoSheets) with the cardio log's taps. Each tap is made on today's page, by the
// page's own handlers, and then on the Expo app, and the walker's check holds every ia_ key and the form equal after
// each one.
//
// A wheel is the page's own. Each wheel of the page's form is a stub holding its columns and rows as the Angular
// template writes them (cardio-fields.ts over cardio-fields-model.ts); the page's iaWheelInit seeds it, a rest is the
// page's own settle (its _iawRecenter and _iawCommit), and the field's input listener is the one the Angular sheet
// wires (day-detail.ts open()). The Expo app's side is wheels.ts and cardio-log.ts, with no element at all.
//
// The sport picker: in the app setCardioSwap is the Angular SessionLog's (session-log.ts, through
// LegacyBridge.provide); on the page the harness boots it is the legacy function, which that one ports line for line
// and which draws the fields as markup. The walker parses that markup into the page's fields as it is written, so the
// function's last save reads the arriving sport's fields, and then holds the markup's fields equal to the Angular
// model's for the same sport, entry and dose.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type CardioFields, type Dose, type WheelView, cardioFields } from '../../frontends/app/src/app/screens/day-detail/cardio-fields-model.ts';
import { fieldReads } from '../../frontends/app/src/app/screens/day-detail/cardio-fields-reads.ts';
import { type CardioOnly, cardioSheet, liftOnDay } from '../../frontends/app/src/app/screens/day-detail/cardio-sheet-model.ts';
import { type CardioLog, type ReadoutRow, cardioLogOf, doseReadout, logCardio, setNode, stepReps, swapSport, togglePicker } from '../../frontends/native/src/day-detail/cardio-log.ts';
import { cardioLogLabel } from '../../frontends/native/src/day-detail/sheet-readers.ts';
import { type SheetProgram, logOf, sheetDay, sheetFrame } from '../../frontends/native/src/day-detail/sheet-screen.ts';
import { cardioLive } from '../../frontends/native/src/day-detail/sheet-writes.ts';
import { WHEEL_ROW, type WheelMoved, wheelRecentre, wheelRest, wheelSeed, wheelSel } from '../../frontends/native/src/day-detail/wheels.ts';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { type SheetTally, TwoSheets } from './native-session-sheet.ts';
import type { Phone } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** What the cardio taps of a walk added up to. */
export interface CardioTally {
  sheets: number; alone: number; aloneWithFoot: number;
  rolls: number; rollsWritten: number; rollsHeld: number; recentres: number; steps: number;
  logs: number; logsEmpty: number; pickers: number; chips: number; chipsSame: number; parked: number; returned: number;
  readouts: number; forms: Record<string, number>; toasts: Record<string, number>;
}
export const cardioTally = (): CardioTally => ({ sheets: 0, alone: 0, aloneWithFoot: 0, rolls: 0, rollsWritten: 0, rollsHeld: 0, recentres: 0, steps: 0, logs: 0, logsEmpty: 0, pickers: 0, chips: 0, chipsSame: 0, parked: 0, returned: 0, readouts: 0, forms: {}, toasts: {} });

/** A page element of the cardio card, as far as today's handlers read and change one. */
interface Node {
  id: string; value: string; textContent: string; innerHTML: string; dataset: Record<string, string>; style: Record<string, string>;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean; toggle(c: string, on?: boolean): boolean };
  addEventListener(): void; dispatchEvent(e: unknown): boolean; querySelectorAll(sel: string): unknown[];
}
function node(id: string, value = '', onInput?: () => void): Node {
  const set = new Set<string>();
  // An input holds text: a number written to it reads back as a string, as the page's own fields do (doseRep writes one).
  let v = String(value);
  return {
    id, get value() { return v; }, set value(x: string) { v = String(x); }, textContent: '', innerHTML: '', dataset: {}, style: {},
    classList: { add: (c) => { set.add(c); }, remove: (c) => { set.delete(c); }, contains: (c) => set.has(c), toggle: (c, on) => { const want = on === undefined ? !set.has(c) : on; if (want) set.add(c); else set.delete(c); return want; } },
    addEventListener() {}, dispatchEvent() { if (onInput) onInput(); return true; }, querySelectorAll: () => [],
  };
}
/** A wheel of the page, as the template writes it and the page's wheel code reads it. */
interface PageCol { scrollTop: number; _iawSettle?: () => void; _iawT?: unknown; items: { v: string; style: Record<string, string> }[] }
interface PageWheel { cols: PageCol[]; stub: Record<string, unknown> }
function pageWheel(w: WheelView): PageWheel {
  const cols: PageCol[] = w.cols.map((c) => ({ scrollTop: 0, items: c.items.map((it) => ({ v: it.v, style: {} })) }));
  const stub: Record<string, unknown> = {
    getAttribute: (k: string) => (k === 'data-kind' ? w.kind : k === 'data-for' ? w.hiddenId : k === 'data-plan' ? w.plan : null),
    querySelectorAll: (sel: string) => (sel === '.iaw-col' ? cols.map((col, ci) => Object.assign(col, {
      getAttribute: (k: string) => (k === 'data-wrap' ? (w.cols[ci]!.wrap ? '1' : '') : k === 'data-len' ? String(w.cols[ci]!.len) : null),
      addEventListener() {},
      querySelectorAll: (s2: string) => (s2 === '.iaw-it' ? col.items.map((it) => Object.assign(it, { getAttribute: (k: string) => (k === 'data-v' ? it.v : null) })) : []),
    })) : []),
  };
  return { cols, stub };
}
const wheelsOf = (f: CardioFields): WheelView[] => (f.kind === 'time' || f.kind === 'dist' ? [f.first, f.second] : f.kind === 'reps_dist' || f.kind === 'reps_time' || f.kind === 'bike' ? [f.wheel] : f.kind === 'run' ? [f.dist, f.pace] : []);
const nodesOfFields = (f: CardioFields): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const w of wheelsOf(f)) out[w.hiddenId] = w.value;
  if (f.kind === 'reps_dist' || f.kind === 'reps_time') out['log_run_reps'] = f.stepper.stored;
  if (f.kind === 'swim') out['log_swim_yards'] = f.yards;
  return out;
};
/** Every input a markup holds, by id, with the value it was written with. */
function inputsOf(html: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const m of html.matchAll(/<input\b[^>]*>/g)) {
    const id = /\bid="([^"]+)"/.exec(m[0]), v = /\bvalue="([^"]*)"/.exec(m[0]);
    if (id) o[id[1]!] = v ? v[1]! : '';
  }
  return o;
}
/** The readout as the page's updateDoseDerived writes it, from the rows the Expo app draws. */
function readoutMarkup(rows: ReadoutRow[]): string {
  return rows.map((r) => {
    if (r.empty) return '<div class="derived"><span class="d-lbl">' + r.label + '</span><span class="d-val empty">' + r.value + '</span></div>';
    if (r.label === 'Work done') return '<div class="derived"><span class="d-lbl">Work done</span><span class="d-val">' + r.value + '<small>' + r.small + '</small></span></div>';
    return '<div class="derived"' + (r.joined ? ' style="border-top:none;padding-top:0"' : '') + '><span class="d-lbl">Your pace</span><span class="d-val">' + r.value + (r.small ? '<small>' + r.small + '</small>' : '') + '</span></div>';
  }).join('');
}

/** One day's sheet on both apps, with the cardio log's taps. */
export class TwoCards extends TwoSheets {
  /** The Expo app's side: the cardio card, and what each wheel remembers and where its columns stand. */
  cardio!: CardioLog;
  private wheels: Record<string, { w: WheelView; st: WheelMoved; offsets: number[] }> = {};
  /** The page's side: its wheels, and the fields on show. */
  private pageWheels: Record<string, PageWheel> = {};
  private pageFields!: CardioFields;
  readonly C: CardioTally;

  constructor(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, T: SheetTally, C: CardioTally, what: string) {
    super(P, store, grid, week, dayKey, T, what);
    this.C = C;
    const ctx = P.IA.ctx as Record<string, unknown>;
    if (!ctx['Event']) ctx['Event'] = function Event(this: { type: string }, type: string) { this.type = type; };
  }
  protected override doseNow(): Dose | null { return this.cardio ? this.cardio.dose : this.view.dose; }
  private get nodes(): Map<string, Node> { return this.els as unknown as Map<string, Node>; }
  private bridge() { const f = <T>(name: string): T => this.P.ev(name) as T; return { call: <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args), global: f }; }
  /** The listener the Angular sheet wires onto every cardio field (day-detail.ts open(), session-log.ts swap()). */
  private readonly input = (): void => { this.page(`if(cardioLive(${J(this.dayKey)})) persistLogFields(${J(this.dayKey)}); updateDoseDerived();`); };

  // ── Drawing ─────────────────────────────────────────────────────────────────────────────────────────�
  /** The page's fields placed with their listener, its wheels seeded by its own iaWheelInit, and the card's other elements. */
  private placeFields(f: CardioFields): void {
    const m = this.nodes;
    for (const id of [...m.keys()]) if (/^log_(run|bike|swim)_/.test(id)) m.delete(id);
    for (const [id, v] of Object.entries(nodesOfFields(f))) m.set(id, node(id, v, this.input));
    m.set('doseDerived', node('doseDerived'));
    if (f.kind === 'reps_dist' || f.kind === 'reps_time') { const n = node('doseRepVal'); n.textContent = f.stepper.shown; m.set('doseRepVal', n); } else m.delete('doseRepVal');
    this.pageFields = f;
    this.pageWheels = {};
    const stubs: unknown[] = [];
    for (const w of wheelsOf(f)) { const pw = pageWheel(w); this.pageWheels[w.hiddenId] = pw; stubs.push(pw.stub); }
    (this.P.IA.ctx as Record<string, unknown>)['__wheels'] = { querySelectorAll: (sel: string) => (sel === '.iaw' ? stubs : []) };
    this.page('iaWheelInit(__wheels);updateDoseDerived();');
    this.P.settle();
  }
  protected override pageDraw(): void {
    super.pageDraw();
    const log = logOf(this.pageView);
    if (!log.view.cardio) return;
    const m = this.nodes, c = log.view.cardio;
    const picker = node('cardioPicker'); picker.style['display'] = c.swapped ? 'block' : 'none'; m.set('cardioPicker', picker);
    const note = node('cardioSwapNote'); note.style['display'] = c.swapped ? 'block' : 'none'; note.textContent = c.note; m.set('cardioSwapNote', note);
    const wrap = m.get('cardioSwapWrap')!;
    wrap.querySelectorAll = () => [];
    // The legacy picker draws the new sport's fields as markup: its inputs replace the card's as they are written.
    const box = node('cardioFields');
    Object.defineProperty(box, 'innerHTML', { get: () => '', set: (html: string) => {
      for (const id of [...m.keys()]) if (/^log_(run|bike|swim)_/.test(id)) m.delete(id);
      for (const [id, v] of Object.entries(inputsOf(html))) m.set(id, node(id, v, this.input));
    } });
    m.set('cardioFields', box);
    this.placeFields(log.fields);
  }
  /** The Expo app's wheels as they open: each on its seed, nothing moved. */
  private seedWheels(f: CardioFields): void {
    this.wheels = {};
    for (const w of wheelsOf(f)) { const seed = wheelSeed(w); this.wheels[w.hiddenId] = { w, st: { moved: false, seedFace: seed.face }, offsets: seed.rows.map((r) => r * WHEEL_ROW) }; }
  }
  protected override nativeDraw(): void {
    super.nativeDraw();
    const day = sheetDay(this.s.prog as SheetProgram, this.week, this.dayKey);
    this.cardio = cardioLogOf(logOf(this.view), day && day.cardio, this.view.dose);
    this.seedWheels(this.cardio.fields);
    if (logOf(this.view).view.cardio) { this.C.sheets++; this.C.forms[this.cardio.fields.kind] = (this.C.forms[this.cardio.fields.kind] || 0) + 1; }
  }

  // ── The check, after every tap ─────────────────────────────────────────────────────────────────────────────────
  override check(tap: string): void {
    super.check(tap);
    if (!this.open_ || !this.form.wrap) return;
    const what = this.what + ', after ' + tap;
    const m = this.nodes, wrap = m.get('cardioSwapWrap')!;
    // Draft or logged, and the button's words (D218).
    const live = cardioLive(this.s, this.form);
    assert.equal(live, wrap.dataset['logged'] === '1', what + ': draft or logged');
    const btn = m.get('cardioLogBtn')!;
    if (btn.textContent !== '') assert.equal(cardioLogLabel(live), btn.textContent, what + ': the Log button');
    // The dose the fields were drawn with, the fields, the picker, the note, the stepper, the readout.
    assert.deepStrictEqual(plain(this.cardio.dose), plain(this.page('_curLogDose')) ?? null, what + ': the dose in hand');
    assert.deepStrictEqual(plain(this.cardio.fields), plain(this.pageFields), what + ': the fields on show');
    assert.equal(this.cardio.picker, m.get('cardioPicker')!.style['display'] === 'block', what + ': the picker');
    assert.equal(this.cardio.note, m.get('cardioSwapNote')!.style['display'] === 'block' ? m.get('cardioSwapNote')!.textContent : '', what + ': the note');
    if (m.has('doseRepVal')) assert.equal(this.cardio.repsShown, String(m.get('doseRepVal')!.textContent), what + ': the reps shown');
    assert.equal(readoutMarkup(doseReadout(this.cardio.dose, this.form.nodes)), m.get('doseDerived')!.innerHTML, what + ': the readout');
    this.C.readouts++;
    // Every wheel stands where the page's stands, and remembers what it remembers.
    for (const [id, bw] of Object.entries(this.wheels)) {
      const pw = this.pageWheels[id]!;
      assert.equal(bw.offsets.join(' '), pw.cols.map((c) => c.scrollTop).join(' '), what + ': where ' + id + ' stands');
      assert.equal(bw.st.seedFace, pw.stub['_iawSeedFace'], what + ': the face ' + id + ' opened on');
      assert.equal(bw.st.moved, !!pw.stub['_iawMoved'], what + ': whether ' + id + ' has left it');
    }
  }

  // ── The taps ─────────────────────────────────────────────────────────────────────────────────────────�
  /** The wheels on show, by their field. */
  wheelIds(): string[] { return Object.keys(this.wheels); }
  /** A wheel's columns: how many, one as drawn, and the row one stands on. */
  columns(id: string): number { return this.wheels[id]!.w.cols.length; }
  column(id: string, ci: number): WheelView['cols'][number] { return this.wheels[id]!.w.cols[ci]!; }
  rowOf(id: string, ci: number): number { return Math.round(this.wheels[id]!.offsets[ci]! / WHEEL_ROW); }
  /**
   * One column of a wheel brought to rest on a row (the row's index in the column as drawn, any of its copies): the
   * page's own settle, then the Expo app's rules on the same offset.
   */
  roll(id: string, ci: number, row: number): void {
    const bw = this.wheels[id]!, pw = this.pageWheels[id]!;
    const before = this.form.nodes[id];
    this.tap('wheel ' + id + ' column ' + ci + ' to row ' + row, () => {
      pw.cols[ci]!.scrollTop = row * WHEEL_ROW;
      pw.cols[ci]!._iawSettle!();
    }, () => {
      const y = row * WHEEL_ROW, back = wheelRecentre(bw.w.cols[ci]!, y);
      if (back !== y) this.C.recentres++;
      bw.offsets[ci] = back;
      const r = wheelRest(bw.w.kind, bw.st, bw.w.cols.map((c, i) => wheelSel(c, bw.offsets[i]!)), this.form.nodes[id] || '');
      bw.st = r.st;
      if (r.write !== null) this.form = setNode(this.s, this.form, this.cardio, id, r.write, this.now);
      return [];
    });
    this.C.rolls++;
    if (this.form.nodes[id] !== before) this.C.rollsWritten++; else this.C.rollsHeld++;
  }
  /** A wheel brought to a face: each column in turn to the first row from where it stands that holds the value. */
  face(id: string, vals: string[]): void {
    const bw = this.wheels[id]!;
    vals.forEach((v, ci) => {
      const col = bw.w.cols[ci]!, at = Math.round(bw.offsets[ci]! / WHEEL_ROW);
      let row = col.items.findIndex((it, i) => i >= at && it.v === v);
      if (row < 0) row = col.items.findIndex((it) => it.v === v);
      assert.ok(row >= 0, this.what + ': ' + id + ' column ' + ci + ' has no row ' + v);
      if (row !== at) this.roll(id, ci, row);
    });
  }
  /** The swim's box typed into. */
  yards(text: string): void {
    this.tap('yards typed', () => { this.nodes.get('log_swim_yards')!.value = text; this.input(); },
      () => { this.form = setNode(this.s, this.form, this.cardio, 'log_swim_yards', text, this.now); return []; });
  }
  /** The reps stepper, one rep fewer or more. */
  step(delta: number): void {
    this.tap('the stepper ' + delta, () => { this.page(`doseRep(${delta});`); },
      () => { const r = stepReps(this.s, this.form, this.cardio, delta, this.now); this.form = r.form; this.cardio = r.log; return []; });
    this.C.steps++;
  }
  /** Log. Returns the toast. */
  log(): string {
    let said = '';
    this.tap('Log', () => { this.page('logCardio();'); }, () => { const t = logCardio(this.s, this.form, this.cardio, this.now); said = t || ''; return t ? [t] : []; });
    this.C.logs++;
    if (said === 'Nothing to log yet.') this.C.logsEmpty++;
    this.C.toasts[said] = (this.C.toasts[said] || 0) + 1;
    return said;
  }
  /** Did a different activity? */
  picker(): void {
    this.tap('the picker', () => { this.page('toggleCardioPicker();'); }, () => { this.cardio = togglePicker(this.cardio); return []; });
    this.C.pickers++;
  }
  /** A sport chip. The page's fields are then the Angular model's for the sport, and its wheels start afresh on both. */
  chip(sport: string): void {
    const same = sport === (this.form.wrap!.active || this.form.wrap!.planned);
    const parkedBefore = J((this.entryNow() || {})['parked'] || {});
    this.tap('the ' + sport + ' chip', () => {
      this.page(`setCardioSwap(${J(sport)});`);
      // What the legacy markup left on the page is what the Angular template draws for the same sport, entry and dose.
      const b = this.bridge();
      const e = b.call<Record<string, Record<string, unknown>>>('getLogs')[b.call<string>('logKey', this.week, this.dayKey)] || {};
      const f = cardioFields(sport, e, b.global<Dose | null>('_curLogDose'), b.global<string>('_curLogSub'), fieldReads(b as never));
      const left: Record<string, string> = {};
      for (const [id, n] of this.nodes) if (/^log_(run|bike|swim)_/.test(id)) left[id] = String(n.value);
      assert.deepStrictEqual(left, nodesOfFields(f), this.what + ': the legacy picker\'s markup holds the Angular template\'s fields for ' + sport);
      this.placeFields(f);
    }, () => {
      const r = swapSport(this.s, this.form, this.cardio, sport, this.now);
      this.form = r.form; this.cardio = r.log;
      this.seedWheels(this.cardio.fields);
      return [];
    });
    this.C.chips++;
    if (same) this.C.chipsSame++;
    const parkedAfter = (this.entryNow() || {})['parked'] as Record<string, unknown> | undefined;
    if (!same && J(parkedAfter || {}) !== parkedBefore) { if (parkedAfter && Object.keys(parkedAfter).length) this.C.parked++; if (JSON.parse(parkedBefore)[sport]) this.C.returned++; }
  }
  private entryNow(): Record<string, unknown> | undefined { return this.entry(); }

  /**
   * The sheet as it draws when it is opened for one cardio alone (D278 item 3), on both: the Angular sheet's last
   * step over the page's day and the page's sheet, and the Expo app's frame.
   */
  frame(only: CardioOnly | null): ReturnType<typeof sheetFrame> {
    const day = this.P.day(this.week, this.dayKey as never) as { sections?: { items?: unknown[] }[] };
    const v = this.pageView;
    const page = cardioSheet(only, liftOnDay(day.sections || []), { over: v.over, title: v.title, tags: v.tags, counter: v.counter, body: v.body }, { chips: [], travel: false });
    const beta = sheetFrame(this.view, only, this.s.prog as SheetProgram);
    assert.deepStrictEqual(plain(beta), plain(page), this.what + ': the sheet\'s frame' + (only ? ', one cardio alone' : ''));
    if (only) { this.C.alone++; if (beta.foot) this.C.aloneWithFoot++; }
    return beta;
  }
}

/** The face a walk rolls a wheel to, by its field and the day's turn: never the zero face, and different each turn. */
function faceFor(id: string, turn: number): string[] {
  if (id === 'log_run_dist') return [String(2 + (turn % 5)), String(turn % 10), String((turn * 3) % 10)];
  if (id === 'log_run_pace') return [String(7 + (turn % 6)), String((turn * 11) % 60)];
  if (id === 'log_run_rep_time') return [String(1 + (turn % 3)), String((turn * 13) % 60)];
  return ['0', String(24 + (turn % 30)), String((turn * 7) % 60)];   // a clock with hours: the run's, the ride's
}

/**
 * One day's cardio log worked through on both apps, the taps chosen from the form the day draws and from `n` so each
 * kind falls on some day: Log on an empty card, a wrapped column turned to another copy of its face and far toward
 * its first copy (jumped back), each wheel rolled, the stepper, the slider and the notes over a draft, Log, each wheel
 * rolled again on the logged card, the picker, a chip and back with a number logged under the other sport, the chip
 * the card is on, and on some days Done over a rolled card that was never logged. False where the day draws no
 * cardio log.
 */
export function workCard(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, n: number, T: SheetTally, C: CardioTally): boolean {
  const S = new TwoCards(P, store, grid, week, dayKey, T, C, 'week ' + week + ', ' + dayKey);
  if (!S.open()) return false;
  if (!S.form.wrap) return false;
  T.days++;
  // The sheet opened for the cardio alone, and whole.
  S.frame({ over: 'Today', title: S.view.title });
  S.frame(null);
  const planned = S.form.wrap.planned;
  if (!cardioLive(S.s, S.form) && Object.values(S.form.nodes).every((v) => v === '')) assert.equal(S.log(), 'Nothing to log yet.');
  const rollAll = (turn: number): void => {
    for (const id of S.wheelIds()) S.face(id, faceFor(id, turn));
    if (S.cardio.fields.kind === 'swim') S.yards(String(600 + 25 * (turn % 20)));
  };
  if (n % 2 === 0) for (const id of S.wheelIds()) {
    const last = S.columns(id) - 1, col = S.column(id, last);
    if (col.wrap) {
      S.roll(id, last, S.rowOf(id, last) + col.len);    // the same face, a copy on: nothing left, nothing written
      S.roll(id, last, 2 + (n % 5));                     // inside the first copy: jumped half a span back
    }
  }
  rollAll(n);
  if (S.cardio.repsShown !== null) { S.step(-1); if (n % 3 === 0) S.step(-1); }
  if (n % 3 === 0) S.slide(3 + (n % 7));
  if (n % 3 === 1) S.notes('Run day ' + n);
  if (n % 5 === 4) {
    // Done over a card rolled and never logged: the status tap is the commit. Then the undo, and the day closed again.
    const closed = S.view.foot[0].undo ? S.view.foot[0].status : null;
    if (closed) S.status(closed);
    S.status('complete');
    S.reopen();
    S.status('complete');
  } else {
    const said = S.log();
    assert.ok(said === 'Run logged ✓' || said === 'Ride logged ✓' || said === 'Swim logged ✓', S.view.title + ': ' + said);
  }
  rollAll(n + 1);
  if (S.cardio.repsShown !== null) S.step(1);
  // The picker: another sport, a number logged under it, the chip the card is on, and back.
  S.picker();
  const others = ['run', 'bike', 'swim'].filter((x) => x !== planned);
  const other = others[(n >> 1) % 2]!;
  S.chip(other);
  if (n % 2) { rollAll(n + 2); S.log(); }
  S.chip(other);
  if (n % 4 === 0) { S.chip(others[(n + 1) % 2]!); rollAll(n + 3); if (n % 8 === 0) S.log(); }
  if (n % 3 !== 2) { S.chip(planned); if (S.cardio.repsShown !== null) S.step(1); rollAll(n + 4); }
  S.picker();
  if (n % 7 === 3) { const st = S.view.foot[0].undo ? S.view.foot[0].status : 'skipped'; S.status(st); if (!S.open_) { S.reopen(); S.status(st); } }
  return true;
}
