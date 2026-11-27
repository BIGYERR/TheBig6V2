// The Expo app's Random Workout against today's (tests/integration/native-random-workout.test.ts and the sweep of
// that name; MIGRATION.md phase 3, row 7; D289, docs/decisions/data-backup.md). The sheet opened on both apps over the
// same keys, then the same taps made on each:
//
//   the page   today's own handlers, run on the page of a test phone (support/stored-state.ts): completeWildcard with
//              the pop-up that follows, saveWildcardDone, skipExercise, skipSuperset and their undos, applySwapChoice
//              and undoSwap, each with the source 'wild', and stepSet, autoSaveSets and saveExWeight on a Wildcard's
//              card. The sheet itself is the Angular screen's (random-workout.ts): its draw is made here step for
//              step through today's own random-workout-model.ts, from the page's own Math.random and pools; its
//              cards are today's sectionsView over the Angular sectionReads with the source 'wild', each bridge call
//              made on the page. The page's renderRand and updateRandCounter do nothing here, as in the app, where
//              the Angular screen provides both.
//   the beta   the Expo app's own view and taps (frontends/native/src/random-workout and the deck's writes handed
//              the Wildcard's working day), the ones its screen calls, over its own SQLite store and the grid its
//              own launch handed back.
//
// After every tap: the two stores hold each ia_ key equal, value for value, no family left out; the toasts raised
// are the same; what a day's open leaves behind (the day, the unit, the stale warning's two marks) is the same; the
// counter on This Week's button is the same; every field of every card holds the same value. After every draw the
// two sheets are the same sheet, whole: the head, and every section and card. Complete raises the same pop-up, whole.
//
// Nothing here writes a key itself, and the expected value of every comparison is today's page, on purpose: the page
// stays the reference until the cutover. The hand-typed values are in tests/unit/native-random-workout.test.ts.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type ExCard, type ExSection, type SectionView, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { type RandFilter, type RandView, type RandWorkout, dayKeyOf, randCount, randDraw, randPool, randView } from '../../frontends/app/src/app/screens/random-workout/random-workout-model.ts';
import { type SwapSheetView, swapSheetView } from '../../frontends/app/src/app/screens/swap-sheet/swap-sheet-model.ts';
import { sheetView } from '../../frontends/native/src/day-detail/sheet-screen.ts';
import type { CardAct } from '../../frontends/native/src/deck/deck-model.ts';
import { parseRx } from '../../frontends/native/src/deck/deck-readers.ts';
import { type DayInHand, type Fields, newDayInHand } from '../../frontends/native/src/deck/deck-screen.ts';
import { type SwapOpen, swapSheetOn } from '../../frontends/native/src/deck/deck-swaps.ts';
import { type Session, act, leftField, swapMove, tapLog, tapStep, undoSwap } from '../../frontends/native/src/deck/deck-writes.ts';
import { fieldsView, typeLoad, typeRep } from '../../frontends/native/src/deck/set-fields.ts';
import { type PopSession } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { RAND_POOLS } from '../../frontends/native/src/random-workout/random-pools.ts';
import { type RandProgram, type RandSheet, type RandState, type WildDraw, newRandState, openRandom, randCounter, wildFields, wildMoves, wildSections, wildSession } from '../../frontends/native/src/random-workout/random-screen.ts';
import { completeWildcard, fireWildcardPopup, resetWildcards, wildcardDayFor } from '../../frontends/native/src/random-workout/random-writes.ts';
import { currentWeek } from '../../frontends/native/src/this-week/week-readers.ts';
import { midnight } from '../../frontends/native/src/this-week/week-screen.ts';
import { type El, el, held } from './native-deck-logging.ts';
import { pops, sameView, seedBoth } from './native-pop-ups.ts';
import { pageSheet as pageDaySheet } from './native-session-sheet.ts';
import { nativeView, pageShown, pageView } from './native-this-week.ts';
import type { Phone } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const bump = (m: Record<string, number>, k: string, n = 1): void => { m[k] = (m[k] || 0) + n; };

/** What a walk compared, so a test can say each kind of tap was made and each kind of thing drawn. */
export interface RandTally {
  opens: number; draws: number; filters: number; shown: number; daysOpened: number; sheets: number; rows: number; picks: number; unswaps: number;
  skips: number; undos: number; steps: number; typed: number; drafts: number; logs: number; resets: number; completes: number; weeks: number;
  checks: number; taps: number; toasts: number;
  /** Each kind of thing a draw held, counted at every draw: the head's, the sections', the cards'. */
  kinds: Record<string, number>;
  /** Complete, by the day it landed on and the pop-up's sub line. */
  landed: Record<string, number>;
  /** The keys a tap changed, by tap and family. */
  wrote: Record<string, number>;
}
export const randTally = (): RandTally => ({
  opens: 0, draws: 0, filters: 0, shown: 0, daysOpened: 0, sheets: 0, rows: 0, picks: 0, unswaps: 0, skips: 0, undos: 0, steps: 0, typed: 0, drafts: 0, logs: 0, resets: 0, completes: 0, weeks: 0,
  checks: 0, taps: 0, toasts: 0, kinds: {}, landed: {}, wrote: {},
});

/** Random Workout, open on today's page and in the Expo app, over the same keys. */
export class TwoRandoms {
  /** The beta's side: what outlives the sheet, what a day's open left behind, the sheet as drawn, each move's fields. */
  readonly st: RandState = newRandState();
  readonly hand: DayInHand = newDayInHand();
  sheet!: RandSheet;
  fields: Fields = {};
  /** The page's side: the Angular screen's filter signal, and the sheet as it drew it. */
  private pageFilter: RandFilter = 'mine';
  pageHead!: RandView;
  pageSecs: SectionView[] = [];
  /** The week in hand on both (the page's currentWeek; the week This Week holds as its own). */
  week: number;
  private readonly random: () => number;
  private readonly now: number;

  private readonly P: Phone;
  readonly store: StateStore;
  readonly grid: RandProgram;
  private readonly T: RandTally;
  private readonly what: string;

  constructor(P: Phone, store: StateStore, grid: RandProgram, seed: number, T: RandTally, what: string) {
    this.P = P;
    this.store = store;
    this.grid = grid;
    this.T = T;
    this.what = what;
    this.now = P.ev('Date.now()') as number;
    pops(P);
    this.random = seedBoth(P, seed);
    // In the app the Angular screen provides both (LegacyBridge.provide): the cards are drawn by its drawSections,
    // made here after each tap, and the counter by its updateCounter, read here at each check.
    P.ev('renderRand=function(){};updateRandCounter=function(){};');
    // The two lookups today's handlers make by selector: a move's load label and its unit.
    const doc = (P.IA.window as unknown as { document: { querySelector: (sel: string) => unknown } }).document;
    doc.querySelector = (sel: string) => this.els.get(sel) ?? null;
    this.week = P.ev('currentWeek') as number;
    assert.equal(currentWeek(grid as never, midnight(new Date(this.now))), this.week, what + ': the week in hand at a launch');
    assert.deepStrictEqual(held(store), P.dump(), what + ': both apps start from the same keys');
  }

  private get els(): Map<string, El> { return (this.P as unknown as { fields: Map<string, El> }).fields; }
  private page(code: string): unknown { return this.P.ev(code); }
  private get bridge() {
    const f = <T>(name: string): T => this.P.ev(name) as T;
    const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
    return { call, global: f };
  }
  private get goal(): string { return ((this.P.prog || {}).goal as string) || 'balanced'; }
  get session(): Session { return wildSession(this.store, this.grid, this.hand, this.week); }
  get wild(): WildDraw { return this.sheet.wild; }
  moves(): ExCard[] { return wildMoves(this.sheet.sections); }

  // ── Drawing ────────────────────────────────────────────────────────────────────────────────────────────────────
  /** The Angular drawSections(): the working day's cards through today's own reads, then every field as the template writes it. */
  private pageDraw(): void {
    const draw = this.page('_wildDraw') as { sections?: ExSection[] } | null;
    this.pageSecs = plain(sectionsView(draw ? draw.sections : [], undefined, sectionReads(this.bridge, 'wild')));
    const m = this.els;
    m.clear();
    for (const x of wildMoves(this.pageSecs as never)) {
      const k = x.exKey;
      m.set('excard_' + k, el('excard_' + k, '', '', 'exercise-item' + (x.logged ? ' logged' : '')));
      m.set('exbadge_' + k, el('exbadge_' + k, '', '', '', null, x.logged ? '✓' : ''));
      if (!x.log) continue;
      m.set('exlog_' + k, el('exlog_' + k, '', '', 'ex-log'));
      if (x.log.sets) {
        const st = x.log.sets;
        m.set('exsum_' + k, el('exsum_' + k, '', '', '', null, st.head));
        m.set('exsumsub_' + k, el('exsumsub_' + k, '', '', '', null, st.sub));
        const vary = el('exvary_' + k);
        vary.style['display'] = st.varied ? '' : 'none';
        m.set('exvary_' + k, vary);
        if (st.foot) { m.set('extoplbl_' + k, el('extoplbl_' + k, '', '', '', null, st.foot)); m.set('extop_' + k, el('extop_' + k, '', '', '', null, '—')); }
        for (const r of st.rows) {
          m.set(r.rowId, el(r.rowId, r.value, r.placeholder, r.cls, r.rx));
          m.set(r.rowId + '_d', el(r.rowId + '_d', '', '', r.deltaCls, null, r.deltaText));
          m.set('exsetrow_' + k + '_' + r.s, el('exsetrow_' + k + '_' + r.s, '', '', 'exset-row'));
          if (r.weight) m.set(r.weight.id, el(r.weight.id, r.weight.value, '', r.weight.cls));
        }
      }
      if (x.log.load) {
        const ld = x.log.load;
        m.set('exw_' + k, el('exw_' + k, ld.value, '', 'ex-winput'));
        m.set('#exlog_' + k + ' .ex-weight-lbl', el('', '', '', '', null, ld.label));
        m.set('#exlog_' + k + ' .ex-wunit', el('', '', '', '', null, ld.unit));
        if (ld.reuse) { m.set('exreusenum_' + k, el('exreusenum_' + k, '', '', '', null, ld.reuse.text)); m.set('exrec_' + k, el('exrec_' + k, '', '', '', null, ld.reuse.rec)); }
      }
    }
  }
  private betaDraw(): void {
    this.sheet = { ...this.sheet, sections: wildSections(this.store, this.grid, this.hand, this.week, this.sheet.wild, this.now) };
    this.fields = wildFields(this.sheet.sections);
  }
  /** After a draw on both: the same sheet, whole, and the same working day under it. */
  private sameSheet(when: string): void {
    const what = this.what + ', ' + when;
    assert.deepStrictEqual(plain(this.sheet.head), this.pageHead, what + ': the head');
    assert.deepStrictEqual(plain(this.sheet.sections), this.pageSecs, what + ': the sections and their cards');
    const draw = plain(this.page('_wildDraw')) as { w: RandWorkout; sections: ExSection[]; swaps: unknown[] };
    assert.deepStrictEqual(plain({ w: this.wild.w, sections: this.wild.sections, swaps: this.wild.swaps }), draw, what + ': the working day');
    assert.equal(this.st.lastIdx, this.page('lastRandIdx'), what + ': the last draw');
    this.T.draws++;
    // The kinds this draw held, read off the model's builders (randView, sectionsView).
    const K = this.T.kinds, h = this.sheet.head;
    bump(K, h.done ? 'head: done before' : 'head: not done');
    bump(K, h.cardio ? 'cardio: ' + h.cardio.blockCls : 'cardio: none');
    if (h.note) bump(K, 'note');
    for (const sec of this.sheet.sections) {
      bump(K, sec.kind === 'skippedRound' ? 'section: a skipped round' : 'section: ' + sec.body.kind);
      if (sec.kind !== 'section') continue;
      for (const x of sec.body.items) {
        bump(K, 'item: ' + x.kind);
        if (x.kind !== 'card') continue;
        if (x.swap) bump(K, 'card: offers a swap');
        if (x.skip) bump(K, 'card: offers a minus');
        if (x.swappedFrom) bump(K, 'card: swapped in');
        if (x.logged) bump(K, 'card: logged on the day in hand');
        if (x.log) bump(K, 'card: a log');
        if (x.log && x.log.sets) bump(K, 'card: set rows');
        if (x.log && x.log.load) bump(K, 'card: a load field');
        if (x.log && x.log.load && x.log.load.reuse) bump(K, x.log.load.reuse.stale ? 'card: a stale reuse pill' : 'card: a reuse pill');
        if (x.log && x.log.load && x.log.load.warn) bump(K, 'card: the stale warning spoken');
      }
    }
  }

  // ── The check, after every tap ─────────────────────────────────────────────────────────────────────────────────
  check(tap: string): void {
    const what = this.what + ', after ' + tap;
    this.T.checks++;
    // 1. The stores, key for key.
    const beta = held(this.store), page = this.P.dump();
    for (const k of new Set([...Object.keys(beta), ...Object.keys(page)])) assert.equal(beta[k], page[k], what + ': ' + k + ' differs');
    // 2. What a day's open left behind, which a Wildcard's cards read.
    const win = this.P.IA.window as Record<string, unknown>;
    assert.deepStrictEqual([this.hand.dayKey, this.hand.unit, this.hand.warn.shown, this.hand.warn.src],
      [this.page('currentDayKey'), (win['_unitLabel'] as string) || 'lbs', this.page('_staleWarnShown'), this.page('_staleWarnSrc')], what + ': the day in hand, the unit and the stale warning');
    assert.equal(this.week, this.page('currentWeek'), what + ': the week in hand');
    // 3. The counter on This Week's button (the Angular updateCounter).
    assert.equal(randCounter(this.store, this.grid), randCount(this.page('getWildcardDone()') as { title: string }[], this.page('RAND_POOLS') as never, this.goal), what + ': the counter');
    // 4. Every field of every card, and what the card says from them.
    if (!this.sheet) return;
    const m = this.els, unit = this.hand.unit;
    const pageMoves = wildMoves(this.pageSecs as never);
    assert.deepStrictEqual(Object.keys(this.fields).sort(), [...new Set(pageMoves.map((x) => x.exKey))].sort(), what + ': the moves');
    for (const x of pageMoves) {
      const k = x.exKey, f = this.fields[k]!;
      const reps: { value: string; placeholder: string }[] = [], loads: { value: string; placeholder: string; inherit: boolean }[] = [];
      for (let s = 0; m.has('exset_' + k + '_' + s); s++) { const e = m.get('exset_' + k + '_' + s)!; reps.push({ value: String(e.value), placeholder: e.placeholder }); }
      for (let s = 0; m.has('exsetw_' + k + '_' + s); s++) { const e = m.get('exsetw_' + k + '_' + s)!; loads.push({ value: String(e.value), placeholder: String(e.placeholder), inherit: e.classList.contains('exw-inherit') }); }
      const w = m.get('exw_' + k);
      assert.deepStrictEqual(
        { reps: f.reps.map((r) => ({ value: r.value, placeholder: r.placeholder })), loads: f.loads, load: f.load, logged: f.logged },
        { reps, loads, load: w ? { value: String(w.value), placeholder: String(w.placeholder) } : null, logged: m.get('excard_' + k)!.classList.contains('logged') },
        what + ': the fields of ' + k);
      if (!x.log) continue;
      const fv = fieldsView(f, parseRx(x.rxDetail, x.name), unit);
      if (x.log.sets) {
        assert.deepStrictEqual([fv.head, fv.sub, fv.varied], [m.get('exsum_' + k)!.textContent, m.get('exsumsub_' + k)!.textContent, m.get('exvary_' + k)!.style['display'] !== 'none'], what + ': the set summary of ' + k);
        assert.deepStrictEqual(fv.delta, f.reps.map((_r, s) => m.get('exset_' + k + '_' + s + '_d')!.textContent), what + ': the deltas of ' + k);
      }
      if (x.log.load) assert.equal(fv.loadLabel, m.get('#exlog_' + k + ' .ex-weight-lbl')!.textContent, what + ': the load\'s label of ' + k);
      if (f.reuse && m.has('exreusenum_' + k)) assert.deepStrictEqual(f.reuse, { text: m.get('exreusenum_' + k)!.textContent, rec: m.get('exrec_' + k)!.textContent }, what + ': the reuse pill of ' + k);
    }
  }

  /** A tap: made on the page, then on the beta, then checked. `kind` names it in the record of what each tap stored. */
  private tap(name: string, kind: string, page: () => void, beta: () => string[]): void {
    const before = this.P.toasts.length, pre = this.P.dump();
    page();
    const said = beta();
    this.T.taps++;
    assert.deepStrictEqual(said, this.P.toasts.slice(before), this.what + ', after ' + name + ': the toasts');
    this.T.toasts += said.length;
    this.check(name);
    const post = this.P.dump(), id = this.grid.id;
    const fams = [...new Set([...Object.keys(pre), ...Object.keys(post)])].filter((k) => pre[k] !== post[k]).map((k) => k.split(id).join('<id>')).sort();
    bump(this.T.wrote, kind + ': ' + (fams.join(', ') || 'nothing'));
  }

  // ── A day opened before the Wildcard: what its open leaves behind ──────────────────────────────────────────────
  /** A day's session sheet drawn on both apps (today's open(), the beta's sheetView with the app's day in hand): the same sheet. */
  openDay(week: number, dayKey: string): boolean {
    const page = pageDaySheet(this.P, week, dayKey);
    const beta = sheetView(this.store, this.grid as never, week, dayKey, this.now, this.hand);
    assert.deepStrictEqual(beta ? plain(beta) : null, page, this.what + ': the session sheet of week ' + week + ', ' + dayKey);
    if (!page) return false;
    this.week = week;
    this.T.daysOpened++;
    this.check('week ' + week + ', ' + dayKey + ' opened');
    return true;
  }

  // ── The sheet ──────────────────────────────────────────────────────────────────────────────────────────────────
  /** The Angular reroll(): made on the page step for step, from the page's own Math.random and pools; then the beta's. */
  private drawBoth(when: string): void {
    const P = this.P, goal = this.goal;
    const pools = this.page('RAND_POOLS') as Record<string, RandWorkout[]>;
    const pool = randPool(pools, goal, this.pageFilter);
    const idx = randDraw(pool.length, this.page('lastRandIdx') as number, this.page('Math.random') as () => number);
    (P.IA.ctx as Record<string, unknown>)['__w'] = pool[idx];
    this.page(`_setLastRandIdx(${idx});_setCurrentRandIdx(${idx});_setWildDraw(__w);_setCurrentRandDayKey(${J(dayKeyOf(new Date(this.now)))});`);
    this.pageHead = plain(randView(pool[idx]!, this.page('getWildcardDone()') as { title: string }[], goal));
    this.pageDraw();
    this.sheet = openRandom(this.st, this.store, this.grid, this.hand, this.week, this.random, this.now);
    this.fields = wildFields(this.sheet.sections);
    this.sameSheet(when);
  }
  /** The button on This Week: a fresh draw on both. */
  open(): void {
    this.tap('Random Workout opened', 'open', () => { this.drawBoth('opened'); }, () => []);
    this.T.opens++;
  }
  /** A filter's tap (the Angular setFilter): the filter kept, then a fresh draw. */
  filter(f: RandFilter): void {
    this.tap('the filter ' + f, 'a filter', () => { this.pageFilter = f; this.st.filter = f; this.drawBoth('drawn again on ' + f); }, () => []);
    this.T.filters++;
  }
  /**
   * One workout of See All shown on both without a draw: its head and its cards, the same. For reading every
   * workout the pools hold; the last draw's index is left where it stood.
   */
  show(i: number): void {
    const pools = this.page('RAND_POOLS') as Record<string, RandWorkout[]>;
    this.showWorkout(randPool(pools, this.goal, 'all')[i]!, randPool(RAND_POOLS, this.goal, 'all')[i]!, 'workout ' + i + ' of See All');
  }
  /** A workout handed to both as the draw in hand: the page's own object, and the beta's. */
  showWorkout(w: RandWorkout, mine: RandWorkout, which: string): void {
    const goal = this.goal;
    (this.P.IA.ctx as Record<string, unknown>)['__w'] = w;
    this.page('_setWildDraw(__w);');
    this.pageHead = plain(randView(w, this.page('getWildcardDone()') as { title: string }[], goal));
    this.pageDraw();
    const wild: WildDraw = { w: mine, sections: plain(mine.sections || []) as ExSection[], swaps: [] };
    this.sheet = { wild, head: randView(mine, this.page('getWildcardDone()') as { title: string }[], goal), sections: wildSections(this.store, this.grid, this.hand, this.week, wild, this.now) };
    this.fields = wildFields(this.sheet.sections);
    assert.equal(this.st.lastIdx, this.page('lastRandIdx'), this.what + ': the last draw');
    const was = this.T.draws;
    this.sameSheet(which + ', ' + w.title);
    this.T.draws = was;
    this.T.shown++;
    this.check(which + ' shown');
  }

  // ── A card's taps (the session sheet's own handlers, under the week in hand and the day last opened) ───────────
  step(exKey: string, row: number, dir: 1 | -1): void {
    const f = this.fields[exKey]!, by = dir * f.reps[row]!.step;
    this.tap('a step on ' + exKey, f.logged ? 'a step on a logged card' : 'a step', () => { this.page(`stepSet(${J('exset_' + exKey + '_' + row)},${by});`); }, () => { this.fields = tapStep(this.session, this.fields, exKey, row, by, this.now); return []; });
    this.T.steps++;
  }
  /** A rep typed into a row, then the field left (the page's blur): what the move's cells hold is saved. */
  typeRep(exKey: string, row: number, text: string): void {
    const id = 'exset_' + exKey + '_' + row;
    this.tap('a rep typed on ' + exKey, 'a rep typed and left', () => { this.els.get(id)!.value = text; this.page(`setDelta(${J(id)});autoSaveSets(${J(exKey)});`); },
      () => { this.fields = { ...this.fields, [exKey]: typeRep(this.fields[exKey]!, row, text) }; this.fields = leftField(this.session, this.fields, exKey, this.now); return []; });
    this.T.typed++;
  }
  /** The load typed, then the field left. */
  typeLoad(exKey: string, text: string): void {
    this.tap('the load typed on ' + exKey, 'a load typed and left', () => { this.els.get('exw_' + exKey)!.value = text; this.page(`cascadeSetWeights(${J(exKey)});autoSaveSets(${J(exKey)});`); },
      () => { this.fields = { ...this.fields, [exKey]: typeLoad(this.fields[exKey]!, text) }; this.fields = leftField(this.session, this.fields, exKey, this.now); return []; });
    this.T.typed++;
  }
  log(x: { exKey: string; name: string; rxDetail: string }): void {
    this.tap('Log on ' + x.exKey, 'Log', () => { this.page(`saveExWeight(${J(x.exKey)},${J(x.name)},${J(x.rxDetail)});`); },
      () => { const r = tapLog(this.session, this.fields, x, this.now); this.fields = r.fields; return r.toast ? [r.toast] : []; });
    this.T.logs++;
  }
  /** A minus or its put back, on a card or a round: today's handlers with the source 'wild', each drawing the cards again. */
  edit(a: CardAct, off: boolean): void {
    this.tap((off ? 'a minus' : 'a put back') + ' of ' + J(a), off ? 'a minus' : 'a put back', () => {
      if (a.kind === 'exercise') this.page(`${off ? 'skipExercise' : 'unskipExercise'}(${J(a.name)},'wild');`);
      else if (a.kind === 'round') this.page(`${off ? 'skipSuperset' : 'unskipSuperset'}(${a.secIdx},'wild');`);
      this.pageDraw();
    }, () => {
      const t = act(this.session, a, off, this.wild);
      this.betaDraw();
      this.sameSheet('drawn again after ' + (off ? 'a minus' : 'a put back'));
      return t ? [t] : [];
    });
    if (off) this.T.skips++; else this.T.undos++;
  }

  // ── The swap sheet over the Wildcard (swap-sheet.ts with the source 'wild') ────────────────────────────────────
  /** Today's swap sheet for a lift of the working day, as the Angular sheet's open() builds it. Reads only. */
  private pageSwapSheet(secIdx: number, itemIdx: number): SwapSheetView | null {
    const ctx = this.P.IA.ctx as Record<string, unknown>;
    ctx['__sw'] = { secIdx, itemIdx };
    const raw = this.page(`(function(){var a=__sw;var day=_wildDraw;
      var sec=day&&day.sections&&day.sections[a.secIdx];var item=sec&&sec.items&&sec.items[a.itemIdx];
      if(!item||!item.name) return null;
      var c=swapCandidates(item.name,day,currentWeek,activeProg);var fam=!c.pattern?_auxFamily(item.name):null;
      if(fam){c.tier1=auxSwapCandidates(item.name,day,activeProg);c.tier2=[];}
      return JSON.stringify({name:item.name,detail:item.detail||'',sec:{label:sec.label,superset:sec.superset,type:sec.type,items:(sec.items||[]).map(function(x){return x?{name:x.name}:x;})},
        c:c,label:fam?(_AUX_FAMILY_LABEL[fam]==null?null:_AUX_FAMILY_LABEL[fam]):null,tier:_compoundTier(item.name)});})()`) as string | null;
    if (raw == null) return null;
    const r = JSON.parse(raw) as { name: string; detail: string; sec: { label?: string; superset?: boolean; type?: string; items?: { name: string }[] }; c: { tier1: string[]; tier2: string[]; pattern: string | null; region: string | null }; label: string | null; tier: number };
    const note = this.page('swapLoadNote') as (o: string, c: string) => string;
    return plain(swapSheetView({ name: r.name, detail: r.detail, itemIdx, section: r.sec, candidates: r.c, familyLabel: r.label, compoundTier: r.tier, loadNote: (o, c) => note(o, c) }));
  }
  /** The sheet for one lift, on both apps: the same sheet, whole. Nothing is stored by opening it. */
  swapSheet(secIdx: number, itemIdx: number): SwapOpen | null {
    const before = held(this.store);
    const page = this.pageSwapSheet(secIdx, itemIdx);
    const beta = swapSheetOn(this.grid, this.wild, secIdx, itemIdx);
    assert.deepStrictEqual(beta ? plain(beta.view) : null, page, this.what + ': the swap sheet of ' + secIdx + ',' + itemIdx);
    assert.deepStrictEqual(held(this.store), before, this.what + ': opening the swap sheet stored something');
    if (beta) { this.T.sheets++; this.T.rows += beta.view.sameJob.length + beta.view.otherJob.length; }
    return beta;
  }
  /** A move picked in the sheet (applySwapChoice with the source 'wild'). */
  pick(open: SwapOpen, to: string): void {
    this.tap('a swap of ' + open.ctx.name + ' for ' + to, 'a swap', () => {
      (this.P.IA.ctx as Record<string, unknown>)['__c'] = { ...open.ctx, src: 'wild' };
      this.page(`_swapCtx=__c;applySwapChoice(${J(to)});`);
      this.pageDraw();
    }, () => {
      const r = swapMove(this.session, open.ctx, to, this.now, this.wild);
      assert.ok(r, this.what + ': the beta made the swap');
      assert.equal(r.nudge, false, this.what + ': a Wildcard\'s swap never comes due for the coach\'s nudge');
      this.betaDraw();
      this.sameSheet('drawn again after a swap');
      return [r.toast];
    });
    this.T.picks++;
  }
  unswap(from: string): void {
    this.tap('put it back, ' + from, 'a swap put back', () => { this.page(`undoSwap(${J(from)},'wild');`); this.pageDraw(); }, () => {
      const t = undoSwap(this.session, from, this.wild);
      this.betaDraw();
      this.sameSheet('drawn again after a swap put back');
      return t ? [t] : [];
    });
    this.T.unswaps++;
  }

  // ── The counter's reset, and Complete ──────────────────────────────────────────────────────────────────────────
  /** The reset's second tap, as the Angular reset() makes it: the record emptied, the toast. The first tap stores nothing. */
  reset(): void {
    this.tap('the reset, tapped twice', 'the reset', () => { this.page("saveWildcardDone([]);showToast('Wildcard counter reset ✓');"); }, () => [resetWildcards(this.store, this.grid)]);
    this.T.resets++;
  }
  /** Complete on the workout in hand: the record, the toast, the sheet gone, then the pop-up 380 ms on, the same on both. */
  complete(): void {
    const title = this.sheet.head.title, now = new Date(this.now);
    const list = pops(this.P), n0 = list.length;
    let isTraining = false;
    this.tap('Complete on ' + title, 'Complete', () => { this.page(`completeWildcard(${J(title)});`); }, () => {
      const r = completeWildcard(this.store, this.grid, title, now);
      isTraining = r.isTraining;
      return [r.toast];
    });
    assert.equal(this.page('_wildDraw'), null, this.what + ': today\'s closes the sheet');
    assert.equal(list.length, n0, this.what + ': no pop-up before its 380 ms');
    this.P.settle();
    const raised = list.slice(n0);
    assert.equal(raised.length, 1, this.what + ': Complete raises one pop-up');
    const ps = { store: this.store, prog: this.grid } as unknown as PopSession;
    const v = sameView(ps, fireWildcardPopup(this.store, this.grid, isTraining, now), now, this.random, raised[0], this.what + ', the Wildcard\'s pop-up');
    const slot = wildcardDayFor(this.grid, now);
    bump(this.T.landed, (slot ? (isTraining ? 'a training day' : 'a rest day') : 'no day of the program') + ' → ' + String(v.sub).replace(/\d+/, 'N'));
    this.T.completes++;
    this.sheet = undefined as unknown as RandSheet;
    this.fields = {};
    this.pageSecs = [];
    this.els.clear();
    this.check('the pop-up after Complete');
  }
  /** This Week under the sheet, drawn again on both: the same screen, whole (the Wildcard's tag, its mark, the streak). */
  weekAfter(): void {
    const P = this.P, shown = pageShown(P), now = new Date(this.now);
    assert.deepStrictEqual(nativeView(this.store, this.grid as never, now, shown, null, false), pageView(P, shown, null, false), this.what + ': This Week after the Wildcard');
    this.T.weeks++;
  }
}

const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const rowsOf = (sh: SwapOpen): string[] => [...sh.view.sameJob, ...sh.view.otherJob].map((r) => r.name);

/**
 * Random Workout worked through on both apps over one phone's keys. The taps are chosen from what the draw holds and
 * from `n`, so each kind falls on some draw across a history. With `day`, the first training day of the week in hand
 * is opened first, so the Wildcard's cards are read and logged under a day last opened; without, under none.
 */
export function walkRandom(Q: Phone, store: StateStore, grid: RandProgram, n: number, T: RandTally, what: string, opts: { day?: boolean } = {}): TwoRandoms {
  const R = new TwoRandoms(Q, store, grid, 7001 + n * 131, T, what);
  if (opts.day) DAYS7.some((d) => R.openDay(R.week, d));
  R.open();
  for (let i = 0; i < 3; i++) R.filter((i + n) % 2 ? 'mine' : 'all');
  // A swap on the first card whose sheet lists a move, put back on every other walk.
  for (const x of R.moves().filter((m) => m.swap).slice(0, 3)) {
    const sh = R.swapSheet(x.swap!.secIdx, x.swap!.itemIdx);
    const rows = sh ? rowsOf(sh) : [];
    if (!sh || !rows.length) continue;
    R.pick(sh, rows[n % rows.length]!);
    if (n % 2 === 0) R.unswap(x.name);
    break;
  }
  // A minus on a card and on a round, each put back on some walks.
  const off = R.moves().filter((m) => m.skip)[1];
  if (off) { R.edit({ kind: 'exercise', name: off.name }, true); if (n % 2 === 0) R.edit({ kind: 'exercise', name: off.name }, false); }
  const round = R.sheet.sections.find((s) => s.kind === 'section' && s.body.kind === 'round');
  if (round && round.kind === 'section' && round.body.kind === 'round') {
    const secIdx = round.body.secIdx;
    R.edit({ kind: 'round', secIdx }, true);
    if (n % 3 !== 0) R.edit({ kind: 'round', secIdx }, false);
  }
  // Set logging on the cards left: a step, a rep and a load typed, Log, then a step on the logged card.
  const lg = R.moves().filter((m) => m.log);
  const a = lg[0];
  if (a && a.log) {
    if (a.log.sets) { R.step(a.exKey, 0, 1); R.typeRep(a.exKey, 0, '6'); }
    if (a.log.load) R.typeLoad(a.exKey, '135');
    R.log(a);
    if (a.log.sets) R.step(a.exKey, 0, -1);
  }
  if (lg[1]) R.log(lg[1]);
  if (n % 2) R.reset();
  if (!R.sheet.head.done) { R.complete(); R.weekAfter(); R.open(); }
  return R;
}
