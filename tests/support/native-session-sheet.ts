// The Expo session sheet against today's (tests/integration/native-session-sheet.test.ts and the sweep of that name;
// MIGRATION.md phase 3, the session sheet's first session; D289, docs/decisions/data-backup.md). One day's sheet
// opened on both apps over the same keys, then the same taps made on each:
//
//   the page   today's own handlers, run on the page of a test phone (support/stored-state.ts): updateRPEDisplay,
//              persistLogFields, handleDayStatus with the pop-up that follows a Done, skipExercise and
//              unskipExercise with the redraw they ask for, applyAddChoice and removeAddedExercise (the sheet's
//              second session), and the Angular 1RM card's save() made on the page's own getPrograms and
//              savePrograms. Its add sheet is the Angular add sheet's open() over the page, through today's own
//              add-sheet-model.ts. Its sheet is the Angular sheet's open() over the page
//              (day-detail.ts), each bridge call made on the page, through today's own models; its log's form is
//              placed as the Angular templates draw it (session-log.ts, cardio-fields.ts), and placed again after
//              a redraw, as the template draws the sheet anew.
//   the beta   the Expo app's own view and taps (frontends/native/src/day-detail/sheet-screen.ts and
//              sheet-writes.ts), the ones its screen calls, over its own SQLite store (support/sqlite-kv.ts) and
//              the grid its own launch handed back.
//
// After every tap: the two stores hold each ia_ key equal, value for value, no family left out; the toast raised is
// the same; a Done raises the same pop-up on both, whole. After every draw: the two sheets are the same sheet, whole
// (the header, the counter, every block of the body in order, the log, the foot), and the form each draw leaves
// holds the same value in every field.
//
// Nothing here writes a key itself, and the expected value of every comparison is today's page, on purpose: the page
// stays the reference until the cutover. The hand-typed values are in tests/unit/native-session-sheet.test.ts.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type AddSheetView, addSheetView, workingSets } from '../../frontends/app/src/app/screens/add-sheet/add-sheet-model.ts';
import { cardioCard, type CardioRx } from '../../frontends/app/src/app/screens/day-detail/cardio-card-model.ts';
import { type CardioFields, type Dose, cardioFields } from '../../frontends/app/src/app/screens/day-detail/cardio-fields-model.ts';
import { fieldReads } from '../../frontends/app/src/app/screens/day-detail/cardio-fields-reads.ts';
import { type E1rmCard, alsoJog, detailBody, e1rmCard, epley, hasLogged, liftsFirst, logNudge, loggedCount, rangeNudge, statusFoot } from '../../frontends/app/src/app/screens/day-detail/day-detail-model.ts';
import { type SessionLogData, sessionLog } from '../../frontends/app/src/app/screens/day-detail/session-log-model.ts';
import { type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { benchNotes, modTags, wildcardSub } from '../../frontends/app/src/app/screens/day-detail/sheet-marks-model.ts';
import { addSheetOf } from '../../frontends/native/src/day-detail/sheet-adds.ts';
import { type SheetProgram, type SheetView, footOf, logOf, sheetView } from '../../frontends/native/src/day-detail/sheet-screen.ts';
import { type LogForm, addMove, formOf, moveRpe, persistLog, removeAdded, saveTestMax, tapStatus, typeNotes } from '../../frontends/native/src/day-detail/sheet-writes.ts';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { type Session, act } from '../../frontends/native/src/deck/deck-writes.ts';
import { type PopSession, fireCompletionPopup } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { DAYS7 } from './native-deck.ts';
import { held } from './native-deck-logging.ts';
import { pops, sameView, seedBoth } from './native-pop-ups.ts';
import { launchNow, nativeGrid, phoneStore } from './native-this-week.ts';
import type { Phone } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** An element of the page, as far as today's handlers read and change one. */
interface El {
  id: string; value: string; textContent: string; dataset: Record<string, string>; style: Record<string, string>;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean; toggle(c: string, on?: boolean): boolean };
}
function el(id: string, value = '', cls = '', text = ''): El {
  const set = new Set(cls.split(' ').filter(Boolean));
  let v = String(value);
  return {
    id, textContent: text, dataset: {}, style: {},
    get value() { return v; }, set value(x: string) { v = String(x); },
    classList: {
      add: (c) => { set.add(c); }, remove: (c) => { set.delete(c); }, contains: (c) => set.has(c),
      toggle: (c, on) => { const want = on === undefined ? !set.has(c) : on; if (want) set.add(c); else set.delete(c); return want; },
    },
  };
}

/** The cardio nodes the Angular template puts on the page for a draw of the fields (cardio-fields.ts), by id. */
function pageNodes(f: CardioFields): Record<string, string> {
  const out: Record<string, string> = {};
  const wheel = (w: { hiddenId: string; value: string }): void => { out[w.hiddenId] = w.value; };
  switch (f.kind) {
    case 'time': case 'dist': wheel(f.first); wheel(f.second); break;
    case 'reps_dist': case 'reps_time': out['log_run_reps'] = f.stepper.stored; wheel(f.wheel); break;
    case 'run': wheel(f.dist); wheel(f.pace); break;
    case 'bike': wheel(f.wheel); break;
    case 'swim': out['log_swim_yards'] = f.yards; break;
    default: break;
  }
  return out;
}

/**
 * Today's sheet for a day, made on the page itself: the Angular sheet's open() (day-detail.ts), each bridge call
 * made on the page, through today's own models. What open() sets before it draws is set and left set, as a sheet
 * left open leaves it: the stale warning afresh, the unit, the week and the day in hand, the idle clock.
 */
export function pageSheet(P: Phone, week: number, dayKey: string): SheetView | null {
  const f = <T>(name: string): T => P.ev(name) as T;
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  const b = { call, global: f };
  const prog = P.prog;
  const day = (prog && prog.weeks && prog.weeks[week] && prog.weeks[week][dayKey]) || null;
  if (!day || day.rest) return null;
  const win = P.IA.window as Record<string, unknown>;
  call('_setCurrentWeek', week);
  call('_setStaleWarnShown', false);
  call('_setStaleWarnSrc', '');
  win['_unitLabel'] = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
  call('_setCurrentDayKey', dayKey);
  const safe = <T>(read: () => T, fallback: T): T => { try { return read(); } catch { return fallback; } };
  const comp = call<Record<string, { status?: string; title?: string } | undefined>>('getCompleted')[call<string>('completedKey', week, dayKey)];
  const progress = call<{ done: number; total: number }>('sessionLogProgress', day);
  const tags = { chips: modTags(day.tags, f('MOD_PAL'), f('tagMeta')), travel: !!call('dayIsTravel', day) };
  call('ruResetIfIdle');

  const secs = (day.sections || []) as ExSection[];
  const status = comp ? comp.status || 'complete' : null;
  const le = call<Record<string, Record<string, unknown> | undefined>>('getLogs')[call<string>('logKey', week, dayKey)];
  const store = safe(() => call<Record<string, { entries?: unknown[] } | undefined>>('getExWeights'), {});
  const lastOf = (name: string | undefined): unknown => {
    const row = store[call<string>('exStoreKey', name)];
    return ((row && row.entries) || []).slice(-1)[0];
  };
  const mainName = safe(() => (secs[0] as { items: { name?: string }[] }).items[0]!.name, undefined);
  const unit = (win['_unitLabel'] as string) || 'lbs';
  const items = secs.flatMap((sec) => ((sec as { items?: { name?: string; detail?: string }[] }).items || []));
  // The legacy buildLogHTML's reads (day-detail.ts log()).
  const entry = call<Record<string, Record<string, unknown> | undefined>>('getLogs')[call<string>('logKey', week, dayKey)] || {};
  const log: SessionLogData = sessionLog(entry, day.cardio, {
    rpeLabels: f('RPE_LABELS'),
    dose: (c) => call('doseFromCardio', c),
    setDoseFull: (d) => call('_setCurLogDoseFull', d),
    setSub: (s) => call('_setCurLogSub', s),
    setDose: (d) => call('_setCurLogDose', d),
    fields: (sport, e, dose, sub) => cardioFields(sport, e, dose as Dose | null, sub, fieldReads(b)),
    live: (e, sport) => call('cardioEntryLive', e, sport),
    noteText: (active, planned, e) => call('cardioSwapNoteText', active, planned, e),
    logLabel: (live) => call('cardioLogLabel', live),
  });
  const body = detailBody({
    main: secs.length ? sectionsView([secs[0]!], 0, sectionReads(b)) : [],
    e1rm: day.testLift ? e1rmCard(String(day.testLift), unit, safe(() => lastOf(mainName) as never, undefined)) : null,
    rest: secs.length ? sectionsView(secs.slice(1), 1, sectionReads(b)) : [],
    cardio: cardioCard(day.cardio as CardioRx | undefined, day.cardio ? benchNotes(day.cardio, (wk) => call('_benchmarkEntryFor', wk), (s) => call('_clkMS', s)) : []),
    note: day.note,
    nudge: safe(() => rangeNudge(items, lastOf as never), null),
    wildcard: wildcardSub(call('wildcardOn', week, dayKey), safe(() => prog.weeks[week][dayKey] ?? null, null)),
    log,
    logNudge: !status && hasLogged(le) ? logNudge(dayKey, day.title) : null,
    also: safe(() => alsoJog((f<Record<string, string>>('DAY_FULL'))[dayKey] || dayKey, call<string[]>('restLogLines', call<Record<string, { restLog?: unknown } | undefined>>('getLogs')[call<string>('completedKey', week, dayKey)]?.restLog), week, dayKey), null),
  }, liftsFirst(secs.length > 0, prog.primaryPath, prog.liftingFocus), secs.length > 0);
  return plain({
    week, dayKey,
    over: 'Week ' + week + ' · ' + (f<Record<string, string>>('DAY_FULL'))[dayKey],
    title: (comp && comp.title) || day.title || 'Training',
    tags,
    counter: loggedCount(progress),
    body,
    foot: statusFoot(call<string | null>('statusOf', week, dayKey)),
    footTitle: day.title || '',
    dose: (f<Dose | null>('_curLogDose')) || null,
  }) as SheetView;
}

/**
 * Today's add sheet for a day, made on the page itself: the Angular add sheet's open() (add-sheet.ts), each bridge
 * call made on the page, through today's own add-sheet-model.ts. The day is the one in hand, as the sheet's add
 * button opens it. Null where today's says "Nothing to add to here".
 */
export function pageAddSheet(P: Phone, week: number, dayKey: string): AddSheetView | null {
  const f = <T>(name: string): T => P.ev(name) as T;
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  call('_setCurrentWeek', week);
  call('_setCurrentDayKey', dayKey);
  const day = call<{ title?: string; sections?: { items?: ({ name?: string; detail?: string; _skipped?: boolean } | null)[] }[] } | null>('_liveDay');
  const prog = f<unknown>('activeProg');
  if (!day || !prog) return null;
  const c = call<{ gap: string[]; more: string[]; off: string[]; region: string | null }>('addCandidates', day, week, prog);
  const parseRx = (detail: string, name: string): { sets: number; open?: boolean } | null => call('parseRx', detail, name);
  const PATTERN_REGION = f<Record<string, string | undefined>>('_PATTERN_REGION');
  return plain(addSheetView({
    title: day.title,
    week,
    setCount: workingSets(day.sections, parseRx),
    candidates: c,
    addedSets: (n) => parseRx(call<string>('addedDetailFor', day, n, week, prog), n)?.sets ?? null,
    regionOf: (n) => PATTERN_REGION[call<string>('_pattern', n)] ?? null,
  }));
}

/** What a walk compared, so a test can say each kind of tap was made and each kind of sheet drawn. */
export interface SheetTally {
  days: number; draws: number; checks: number; taps: number; slides: number; notes: number; dones: number; skips: number; undone: number; popups: number; toasts: number;
  edits: number; reopens: number;
  /** Sheets drawn by what they held: a run beside the lift, a cardio entry that is live, a counter, each nudge, a day done, a day skipped, drafts carried by a save. */
  cardio: number; live: number; counters: number; rangeNudges: number; logNudges: number; drawnDone: number; drawnSkipped: number; carried: number;
  /** Saves that wrote the derived pace or distance, and status taps that cleared a day's skipped parts or let the season's pop-up go. */
  parts: number; seasons: number;
  /** The sheet's second session: add sheets compared and the rows they held by tier, picks, removes, sheets drawn holding an added block, 1RM saves. */
  addSheets: number; addRows: Record<string, number>; adds: number; removes: number; addedDrawn: number; maxSaves: number;
  /** Picks by what the dose was: the conservative fallback, open sets on a lift with no load to move, anything else. */
  addDoses: Record<string, number>;
  kinds: Record<string, number>;
}
export const sheetTally = (): SheetTally => ({ days: 0, draws: 0, checks: 0, taps: 0, slides: 0, notes: 0, dones: 0, skips: 0, undone: 0, popups: 0, toasts: 0, edits: 0, reopens: 0,
  cardio: 0, live: 0, counters: 0, rangeNudges: 0, logNudges: 0, drawnDone: 0, drawnSkipped: 0, carried: 0, parts: 0, seasons: 0,
  addSheets: 0, addRows: {}, adds: 0, removes: 0, addedDrawn: 0, maxSaves: 0, addDoses: {}, kinds: {} });

/** One day's sheet, open on today's page and in the Expo app, over the same keys. */
export class TwoSheets {
  /** The beta's side: its session, the sheet as drawn, the form the draw left. */
  readonly s: Session;
  view!: SheetView;
  form!: LogForm;
  /** The page's side: the sheet as drawn. */
  pageView!: SheetView;
  open_ = false;
  private readonly now: number;
  private readonly P: Phone;
  readonly week: number;
  readonly dayKey: string;
  private readonly T: SheetTally;
  private readonly what: string;
  private marks = 0;

  constructor(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, T: SheetTally, what: string) {
    this.P = P;
    this.week = week;
    this.dayKey = dayKey;
    this.T = T;
    this.what = what;
    this.s = { store, prog: grid, week, dayKey };
    this.now = P.ev('Date.now()') as number;
    assert.deepStrictEqual(held(store), P.dump(), what + ': both apps start from the same keys');
    // In the app openDetail is the Angular sheet's (LegacyBridge.provide): an edit's redraw lands there. Here it is
    // counted, and the walk draws the page's sheet again itself, as the component would.
    (P.IA.ctx as Record<string, unknown>)['__redraws'] = [];
    P.ev('openDetail=function(d){__redraws.push(d);};');
    // The pop-up shown stands where the toast would (handleDayStatus reads the overlay's class): the recorder that
    // stands in for popFire (support/native-pop-ups.ts) marks the overlay shown, as the app's pop-up does.
    pops(P);
    P.ev('popFire=(function(o){return function(t,x){document.getElementById("popOverlay").classList.add("show");return o(t,x);};})(popFire);');
  }

  private get els(): Map<string, El> { return (this.P as unknown as { fields: Map<string, El> }).fields; }
  private page(code: string): unknown { return this.P.ev(code); }
  private get redraws(): string[] { return (this.P.IA.ctx as Record<string, unknown>)['__redraws'] as string[]; }

  // ── Drawing ────────────────────────────────────────────────────────────────────────────────────────────────────
  /** The page's sheet drawn afresh, and its log's form placed as the templates write it. */
  private pageDraw(): void {
    const v = pageSheet(this.P, this.week, this.dayKey);
    assert.ok(v, this.what + ': today\'s opens a sheet');
    this.pageView = v;
    const m = this.els;
    m.clear();
    const log = logOf(v);
    m.set('log_rpe', el('log_rpe', log.view.rpeValue));
    m.set('rpeDisplay', el('rpeDisplay', '', '', log.view.rpeText));
    m.set('log_notes', el('log_notes', log.view.notes));
    m.set('popOverlay', el('popOverlay'));
    if (log.view.cardio) {
      const c = log.view.cardio;
      const wrap = el('cardioSwapWrap');
      wrap.dataset['planned'] = c.planned; wrap.dataset['active'] = c.active; wrap.dataset['logged'] = c.logged ? '1' : '0';
      m.set('cardioSwapWrap', wrap);
      m.set('cardioLogBtn', el('cardioLogBtn', '', 'ex-logbtn' + (c.logged ? ' logged' : ''), c.logLabel));
      for (const [id, value] of Object.entries(pageNodes(log.fields))) m.set(id, el(id, value));
    }
  }
  private nativeDraw(): void {
    const v = sheetView(this.s.store, this.s.prog as SheetProgram, this.week, this.dayKey, this.now);
    assert.ok(v, this.what + ': the Expo app opens a sheet where today\'s does');
    this.view = v;
    this.form = formOf(logOf(v));
  }
  /** Both apps draw the day: the same sheet, whole, and the same form. */
  private draw(when: string): void {
    this.pageDraw();
    this.nativeDraw();
    this.T.draws++;
    assert.deepStrictEqual(plain(this.view), this.pageView, this.what + ', ' + when + ': the sheet as drawn');
    this.sameForm(when);
    this.count();
  }
  /** What the sheet just drawn held, for the tally. */
  private count(): void {
    const T = this.T, log = logOf(this.view);
    if (log.view.cardio) { T.cardio++; if (log.view.cardio.logged) T.live++; }
    if (this.view.counter !== null) T.counters++;
    for (const b of this.view.body) { T.kinds[b.kind] = (T.kinds[b.kind] || 0) + 1; if (b.kind === 'nudge') T.rangeNudges++; if (b.kind === 'logNudge') T.logNudges++; }
    if (this.view.foot[0].undo) { if (this.view.foot[0].status === 'complete') T.drawnDone++; else T.drawnSkipped++; }
    if (removable(this.view)) T.addedDrawn++;
  }
  /** Every field of the log's form holds the same value on both, and the slider's mark is the same. */
  private sameForm(when: string): void {
    const m = this.els, f = this.form;
    const page: Record<string, string> = {};
    for (const id of Object.keys(f.nodes)) page[id] = m.has(id) ? String(m.get(id)!.value) : '(no such node)';
    assert.deepStrictEqual(f.nodes, page, this.what + ', ' + when + ': the cardio nodes of the form');
    assert.deepStrictEqual(
      { rpe: f.rpe, touched: f.touched, notes: f.notes, wrap: f.wrap },
      { rpe: String(m.get('log_rpe')!.value), touched: m.get('log_rpe')!.dataset['touched'] === '1', notes: String(m.get('log_notes')!.value),
        wrap: m.has('cardioSwapWrap') ? { planned: m.get('cardioSwapWrap')!.dataset['planned'], active: m.get('cardioSwapWrap')!.dataset['active'] } : null },
      this.what + ', ' + when + ': the form');
  }

  /** The sheet opened on both (a tap that reaches the day's sheet). False where today's opens none. */
  open(): boolean {
    const day = this.P.day(this.week, this.dayKey as never);
    if (!day || day.rest) return false;
    this.draw('opened');
    this.open_ = true;
    this.check('opened');
    return true;
  }

  // ── The check, after every tap ─────────────────────────────────────────────────────────────────────────────────
  check(tap: string): void {
    const what = this.what + ', after ' + tap;
    this.T.checks++;
    const beta = held(this.s.store), page = this.P.dump();
    for (const k of new Set([...Object.keys(beta), ...Object.keys(page)])) assert.equal(beta[k], page[k], what + ': ' + k + ' differs');
    if (this.open_) this.sameForm('after ' + tap);
  }
  /** A tap: made on the page, then on the beta, then checked. */
  private tap(name: string, page: () => void, beta: () => string[]): void {
    const before = this.P.toasts.length;
    page();
    this.P.settle();
    const said = beta();
    this.T.taps++;
    assert.deepStrictEqual(said, this.P.toasts.slice(before), this.what + ', after ' + name + ': the toasts');
    this.T.toasts += said.length;
    this.check(name);
  }
  private entry(): Record<string, unknown> | undefined {
    return (JSON.parse(this.s.store.get('ia_logs_' + this.s.prog.id) || '{}') as Record<string, Record<string, unknown>>)['w' + this.week + '_' + this.dayKey];
  }

  // ── The taps ───────────────────────────────────────────────────────────────────────────────────────────────────
  /** The effort slider moved: its words, the mark that it was moved, and the save its input raises. */
  slide(v: number): void {
    const had = this.entry();
    this.tap('the slider to ' + v, () => {
      this.els.get('log_rpe')!.value = String(v);
      this.page(`updateRPEDisplay(${J(String(v))});persistLogFields(${J(this.dayKey)});updateDoseDerived();`);
    }, () => { this.form = moveRpe(this.form, v); persistLog(this.s, this.form, this.view.dose, false, this.now); return []; });
    this.T.slides++;
    if (had && had['sets']) this.T.carried++;
  }
  /** The notes typed: saved as they change. */
  notes(text: string): void {
    const had = this.entry();
    this.tap('notes typed', () => {
      this.els.get('log_notes')!.value = text;
      this.page(`persistLogFields(${J(this.dayKey)});updateDoseDerived();`);
    }, () => { this.form = typeNotes(this.form, text); persistLog(this.s, this.form, this.view.dose, false, this.now); return []; });
    this.T.notes++;
    if (had && had['sets']) this.T.carried++;
  }
  /**
   * Done or Skip at the foot (or their undo, which is the same tap on the status the day carries). A status set
   * closes the sheet on both, and Done raises the same pop-up on both; an undo leaves it open, its foot drawn again.
   */
  status(status: 'complete' | 'skipped', title: string = this.view.footTitle): void {
    const P = this.P, list = pops(P), n0 = list.length;
    const before = P.dump();
    const random = seedBoth(P, ((this.T.dones + this.marks++) * 69069 + 54321) % 4294967296);
    const pop = { store: this.s.store, prog: this.s.prog } as unknown as PopSession;
    let closed = false;
    this.tap((status === 'complete' ? 'Done' : 'Skip') + ' at the foot', () => {
      this.page(`handleDayStatus(${J(this.dayKey)},${J(title)},${J(status)});`);
    }, () => {
      const r = tapStatus(this.s, this.form, this.view.dose, title, status, this.now);
      closed = r.closed;
      const raised = list.slice(n0);
      assert.equal(raised.length, r.popup ? 1 : 0, this.what + ': a Done that sets the status raises one pop-up, anything else none');
      if (r.popup) {
        const now = new Date(this.now);
        sameView(pop, fireCompletionPopup(pop, this.week, this.dayKey, now), now, random, raised[0], this.what + ', Done');
        this.T.popups++;
      }
      return r.toast ? [r.toast] : [];
    });
    // The pop-up is dismissed before the next tap, as the athlete dismisses it.
    this.els.get('popOverlay')?.classList.remove('show');
    const after = P.dump();
    const fam = (k: string): boolean => Object.keys({ ...before, ...after }).some((x) => x.startsWith(k) && before[x] !== after[x]);
    if (fam('ia_parts_')) this.T.parts++;
    if (fam('ia_season_shown_') && !closed) this.T.seasons++;
    if (closed) {
      if (status === 'complete') this.T.dones++; else this.T.skips++;
      this.open_ = false;
    } else {
      this.T.undone++;
      // The page draws the foot again and nothing else (renderStatusFoot); so does the beta.
      this.view = { ...this.view, foot: footOf(this.s.store, this.s.prog as SheetProgram, this.week, this.dayKey) };
      assert.deepStrictEqual(plain(this.view.foot), plain(statusFoot(this.page(`statusOf(${this.week},${J(this.dayKey)})`) as string | null)), this.what + ': the foot after an undo');
    }
  }
  /** The sheet opened again after a status closed it (Reopen): the same sheet on both. */
  reopen(): void {
    assert.equal(this.open_, false, 'reopen after a close');
    this.draw('reopened');
    this.open_ = true;
    this.T.reopens++;
    this.check('reopened');
  }
  /** A move's minus, or its Put it back: today's handler, whose redraw draws the whole sheet anew; the beta's, then its own redraw. */
  edit(name: string, off: boolean): void {
    const n0 = this.redraws.length;
    this.tap((off ? 'a skip of ' : 'a put back of ') + name, () => {
      this.page(`${off ? 'skipExercise' : 'unskipExercise'}(${J(name)});`);
      assert.equal(this.redraws.length, n0 + 1, this.what + ': the edit asks the sheet to draw again');
      this.pageDraw();
    }, () => {
      const t = act(this.s, { kind: 'exercise', name }, off);
      this.nativeDraw();
      assert.deepStrictEqual(plain(this.view), this.pageView, this.what + ': the sheet drawn again after ' + (off ? 'a skip' : 'a put back'));
      this.count();
      return t ? [t] : [];
    });
    this.T.edits++;
    this.T.draws++;
  }

  // ── The sheet's second session: the add sheet, a pick, a remove, the 1RM card's save ───────────────────────────
  /** The add button: the add sheet both apps open for the day in hand is the same sheet, whole. It writes nothing. */
  addSheet(): AddSheetView {
    const before = this.P.dump();
    const page = pageAddSheet(this.P, this.week, this.dayKey);
    const beta = addSheetOf(this.s.prog, this.week, this.dayKey);
    assert.ok(page && beta, this.what + ': both open an add sheet');
    assert.deepStrictEqual(plain(beta), page, this.what + ': the add sheet as drawn');
    assert.deepStrictEqual(this.P.dump(), before, this.what + ': opening the add sheet wrote no key');
    this.T.addSheets++;
    for (const t of ['gap', 'more', 'off'] as const) this.T.addRows[t] = (this.T.addRows[t] || 0) + page[t].length;
    this.check('the add sheet opened');
    return page;
  }
  /** A row picked: today's applyAddChoice, whose redraw draws the whole sheet anew; the beta's addMove, then its own redraw. */
  add(name: string): void {
    const n0 = this.redraws.length;
    this.tap('an add of ' + name, () => {
      this.page(`applyAddChoice(${J(name)});`);
      assert.equal(this.redraws.length, n0 + 1, this.what + ': the add asks the sheet to draw again');
      this.pageDraw();
    }, () => {
      const t = addMove(this.s, name, this.now);
      this.nativeDraw();
      assert.deepStrictEqual(plain(this.view), this.pageView, this.what + ': the sheet drawn again after an add');
      this.count();
      return t ? [t] : [];
    });
    assert.equal(removable(this.view, name), name, this.what + ': the added move carries its remove');
    const said = this.P.toasts[this.P.toasts.length - 1] || '';
    const kind = / added at 3×10 — RPE 7\.$/.test(said) ? 'fallback' : / added at \d+ sets? — /.test(said) ? 'open sets' : 'a donor\'s';
    this.T.addDoses[kind] = (this.T.addDoses[kind] || 0) + 1;
    this.T.adds++;
    this.T.draws++;
  }
  /** An added move's remove: today's removeAddedExercise and its redraw; the beta's removeAdded and its own. */
  remove(name: string): void {
    const n0 = this.redraws.length;
    this.tap('a remove of ' + name, () => {
      this.page(`removeAddedExercise(${J(name)});`);
      assert.equal(this.redraws.length, n0 + 1, this.what + ': the remove asks the sheet to draw again');
      this.pageDraw();
    }, () => {
      const t = removeAdded(this.s, name);
      this.nativeDraw();
      assert.deepStrictEqual(plain(this.view), this.pageView, this.what + ': the sheet drawn again after a remove');
      this.count();
      return t ? [t] : [];
    });
    assert.equal(removable(this.view, name), null, this.what + ': the move is off the card');
    this.T.removes++;
    this.T.draws++;
  }
  /** The 1RM card of the sheet as drawn, or null: both apps hold the same card (the sheet was compared whole). */
  maxCard(): E1rmCard | null {
    const b = this.view.body.find((x) => x.kind === 'e1rm') as { card: E1rmCard } | undefined;
    return b ? b.card : null;
  }
  /**
   * The 1RM card's save with these two fields: today's is the Angular card's save() (e1rm-card.ts), made here on the
   * page's own getPrograms and savePrograms through today's own epley; the beta's is saveTestMax. The line each card
   * then shows is the same, and so is the max the program in hand carries. No toast on either, no redraw.
   */
  saveMax(weight: string, reps: string): string | null {
    const card = this.maxCard();
    assert.ok(card, this.what + ': the sheet holds a 1RM card');
    const P = this.P, lift = card.lift;
    let pageSaid: string | null = null, betaSaid: string | null = null;
    this.tap('the 1RM card saved', () => {
      const v = epley(parseFloat(weight) || 0, parseInt(reps) || 1);
      if (!(v > 0)) return;
      const programs = (P.ev('getPrograms') as () => { id?: string; cfg?: Record<string, unknown> }[])();
      const id = P.ev('activeProgId') as string | null;
      const p = programs.filter((x) => x && x.id === id)[0];
      if (p && p.cfg) {
        p.cfg[lift] = v;
        const active = P.ev('activeProg') as { cfg?: Record<string, unknown> } | null;
        if (active && active.cfg) active.cfg[lift] = v;
        (P.ev('savePrograms') as (ps: unknown) => void)(programs);
      }
      pageSaid = 'Saved. Your next block anchors off ' + v + ' ' + card.unit + '.';
    }, () => { betaSaid = saveTestMax(this.s, lift, card.unit, weight, reps).saved; return []; });
    assert.equal(betaSaid, pageSaid, this.what + ': the line the card shows after its save');
    assert.equal((this.s.prog.cfg as Record<string, unknown>)[lift], (P.ev('activeProg') as { cfg: Record<string, unknown> }).cfg[lift], this.what + ': the max the program in hand carries');
    this.T.maxSaves++;
    return betaSaid;
  }
}

/** The first added move of a sheet (one that carries a remove), or the named one where it is added; null when there is none. */
export function removable(v: SheetView, name?: string): string | null {
  for (const b of v.body) if (b.kind === 'sections') for (const sec of b.sections) if (sec.kind === 'section') for (const x of sec.body.items) if (x.kind === 'card' && x.added && (name === undefined || x.name === name)) return x.name;
  return null;
}

/** The first move of a day that carries a minus, for an edit, or null. */
export function skippable(v: SheetView): string | null {
  for (const b of v.body) if (b.kind === 'sections') for (const sec of b.sections) if (sec.kind === 'section') for (const x of sec.body.items) if (x.kind === 'card' && x.skip) return x.name;
  return null;
}

/**
 * One day worked through its sheet on both apps, the taps chosen from the day's status and from `n` so that each kind
 * falls on some day: the slider moved or left alone, notes typed, a move skipped and put back with the slider moved
 * before it (the redraw forgets the move, the store keeps it), Done, Skip, each one's undo, Done over Skipped and
 * Skip over Done, and the sheet opened again after each close. False where no sheet opens.
 */
export function workSheet(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, n: number, T: SheetTally): boolean {
  const S = new TwoSheets(P, store, grid, week, dayKey, T, 'week ' + week + ', ' + dayKey);
  if (!S.open()) return false;
  T.days++;
  if (n % 3 === 0) { S.slide(4 + (n % 6)); S.notes('Sheet day ' + n + ' 💪'); }
  else if (n % 3 === 1) S.notes('Notes alone, day ' + n);
  const name = n % 2 ? skippable(S.view) : null;
  if (name) {
    S.slide(9 - (n % 4));
    S.edit(name, true);
    S.notes('After a skip, day ' + n);
    S.edit(name, false);
  }
  // The sheet's second session. A move the history itself added (the page's own applyAddChoice, weeks back) is
  // removed on every other day that holds one. On two days of five the add sheet is opened and a row picked, the tier
  // and the row chosen from `n`: on one the move is removed again after notes typed (the redraw forgets the form,
  // the store keeps the notes); on the other a second move joins the block and the first is removed, so the block
  // outlives its first move and the day goes on to its status holding an added move.
  const old = removable(S.view);
  if (old && n % 2 === 0) S.remove(old);
  if (n % 5 === 1 || n % 5 === 3) {
    const a = S.addSheet();
    const rows = [...a.gap, ...a.more, ...a.off];
    const row = rows[(n * 7) % (rows.length || 1)];
    if (row) {
      S.slide(3 + (n % 5));
      S.add(row.name);
      if (n % 5 === 3) { S.notes('Before a remove, day ' + n); S.remove(row.name); }
      else {
        const b = S.addSheet();
        assert.ok(![...b.gap, ...b.more, ...b.off].some((r) => r.name === row.name), 'week ' + week + ', ' + dayKey + ': a move on the card is offered no more');
        const next = [...b.off, ...b.more, ...b.gap][(n * 3) % ((b.gap.length + b.more.length + b.off.length) || 1)];
        if (next) { S.add(next.name); S.remove(row.name); }
      }
    }
  }
  const cur = S.view.foot[0].undo ? S.view.foot[0].status : null;
  const other = (st: 'complete' | 'skipped'): 'complete' | 'skipped' => (st === 'complete' ? 'skipped' : 'complete');
  if (cur) {
    // A day already closed: undone, then closed again one way or the other; or closed the other way straight over.
    if (n % 3 === 0) { S.status(cur); S.slide(7); S.status(n % 2 ? cur : other(cur)); }
    else if (n % 3 === 1) { S.status(other(cur)); S.reopen(); S.status(other(cur)); S.status(cur); }
    else { S.status(cur); }
  } else {
    const v = n % 4;
    if (v === 0) { S.status('complete'); S.reopen(); S.status('complete'); S.status('complete'); }
    else if (v === 1) { S.status('skipped'); S.reopen(); S.status('skipped'); }
    else if (v === 2) { S.status('complete'); }
    else { S.status('skipped'); S.reopen(); S.status('complete'); }
  }
  if (!S.open_) S.reopen();
  // On a day already closed and opened again: a pick, and on every other such day its remove.
  if (n % 6 === 2) {
    const a = S.addSheet();
    const row = [...a.more, ...a.gap, ...a.off][n % ((a.gap.length + a.more.length + a.off.length) || 1)];
    if (row) { S.add(row.name); if (n % 4 === 0) S.remove(row.name); }
  }
  return true;
}

/** What a read of every sheet held. */
export interface SheetsSeen {
  days: number; rests: number; kinds: Record<string, number>; cardio: number; live: number; done: number; skipped: number; counters: number;
  /** The add sheets compared, the rows they held, and the sheets that held an added move. */
  addSheets: number; addRows: number; added: number;
}
export const sheetsSeen = (): SheetsSeen => ({ days: 0, rests: 0, kinds: {}, cardio: 0, live: 0, done: 0, skipped: 0, counters: 0, addSheets: 0, addRows: 0, added: 0 });

/**
 * Every training day of every week the phone's program holds: the two sheets, compared whole, and the form each
 * leaves. The Expo app draws over its own launch's grid, from a store holding the phone's keys. Nothing is tapped.
 */
export function everySheetDrawn(P: Phone, tally: SheetsSeen = sheetsSeen()): SheetsSeen {
  const store = phoneStore(P);
  const grid = nativeGrid(P, store) as unknown as SheetProgram;
  const now = launchNow(P).getTime();
  const was = { week: P.ev('currentWeek') as number, day: P.ev('currentDayKey') as string | null, shown: P.ev('_staleWarnShown') as boolean, src: P.ev('_staleWarnSrc') as string, unit: (P.IA.window as Record<string, unknown>)['_unitLabel'] };
  const before = P.dump(), mine = held(store);
  const cache = P.ev('_rxCache') as Record<string, unknown>, cached = JSON.stringify(cache);
  for (const w of Object.keys(P.prog.weeks).map(Number).sort((a, b) => a - b)) for (const d of DAYS7) {
    const day = P.prog.weeks[w][d];
    if (!day) continue;
    const what = 'week ' + w + ', ' + d;
    const page = pageSheet(P, w, d), beta = sheetView(store, grid, w, d, now);
    if (day.rest) { assert.equal(page, null, what); assert.equal(beta, null, what + ': a rest day opens no sheet'); tally.rests++; continue; }
    assert.ok(page && beta, what + ': both draw a sheet');
    assert.deepStrictEqual(plain(beta), page, what + ': the sheet, whole');
    assert.deepStrictEqual(formOf(logOf(beta)).nodes, pageNodes(logOf(page).fields), what + ': the form\'s cardio nodes');
    tally.days++;
    for (const b of page.body) tally.kinds[b.kind] = (tally.kinds[b.kind] || 0) + 1;
    const c = logOf(page).view.cardio;
    if (c) { tally.cardio++; if (c.logged) tally.live++; }
    if (page.counter !== null) tally.counters++;
    if (page.foot[0].undo) { if (page.foot[0].status === 'complete') tally.done++; else tally.skipped++; }
    if (removable(page)) tally.added++;
    // The add sheet the day's add button opens, on both: the same sheet, whole.
    const addPage = pageAddSheet(P, w, d), addBeta = addSheetOf(grid, w, d);
    assert.ok(addPage && addBeta, what + ': both open an add sheet');
    assert.deepStrictEqual(plain(addBeta), addPage, what + ': the add sheet');
    tally.addSheets++;
    tally.addRows += addPage.gap.length + addPage.more.length + addPage.off.length;
  }
  (P.IA.ctx as Record<string, unknown>)['__was'] = was;
  P.ev('_setCurrentWeek(__was.week);_setCurrentDayKey(__was.day);_setStaleWarnShown(__was.shown);_setStaleWarnSrc(__was.src);');
  (P.IA.window as Record<string, unknown>)['_unitLabel'] = was.unit;
  assert.deepStrictEqual(P.dump(), before, 'reading every sheet wrote no key on the page');
  for (const k of Object.keys(cache)) delete cache[k];
  Object.assign(cache, JSON.parse(cached));
  assert.deepStrictEqual(held(store), mine, 'reading every sheet wrote no key in the beta');
  return tally;
}
