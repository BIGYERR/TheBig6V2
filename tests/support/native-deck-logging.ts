// The Expo deck's logging against today's (tests/integration/native-deck-logging.test.ts and the sweep of that name;
// D289, docs/decisions/data-backup.md). One day's deck opened on both apps over the same keys, then the same taps made
// on each:
//
//   the page   today's own handlers, run on the page of a test phone (support/stored-state.ts): stepSet, setDelta,
//              onSetWeight, cascadeSetWeights, reuseWeight, fillAllSetWeights, autoSaveSets, saveExWeight,
//              skipExercise and its three siblings, applySwapChoice and undoSwap, the nudge's two answers
//              (dismissSwapNudge, acceptSwapNudge), and the deck's markDay as deck.ts writes it, with the pop-up
//              that follows (support/native-pop-ups.ts: the Angular PopUp's own fire over the page). Its fields are placed from today's own card model as the
//              session sheet's template draws them (session-sections.ts), and placed again after an edit, as the
//              template draws the cards afresh. Its swap sheet is the Angular sheet's open() over the page's own
//              swapCandidates, auxSwapCandidates and swapLoadNote, through today's swap-sheet-model.ts.
//   the beta   the Expo app's own taps (frontends/native/src/deck/deck-writes.ts over set-fields.ts), the ones its
//              screen calls, over its own SQLite store (support/sqlite-kv.ts) and the grid its own launch handed back;
//              its swap sheet is deck-swaps.ts swapSheetOf.
//
// After every tap: the two stores hold each ia_ key equal, value for value; every field of every move holds the same
// text, placeholder and inherit mark; the set summary, its words, Varied and the load's label read the same; and the
// toast raised is the same. No key is left out: the pop-ups' five families were the one exception until the beta
// built its pop-ups (the deck's fourth session), and are now compared like every other. Mark the day done raises the
// same pop-up on both, whole; a nudge that comes due carries the same words on both and is answered on both, Make the
// change and Leave the plan alone in turn, after which the program in hand is the same program, whole.
//
// Nothing here writes a key itself, and the expected value of every comparison is today's page, on purpose: the
// page stays the reference until the cutover. The hand-typed values are in tests/unit/native-deck-logging.test.ts.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type CardAct, type DeckCard, callItLog, deckCards } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { type ExCard, type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { type SwapSheetView, swapSheetView } from '../../frontends/app/src/app/screens/swap-sheet/swap-sheet-model.ts';
import { parseRx } from '../../frontends/native/src/deck/deck-readers.ts';
import { type DeckProgram, type DeckView, type Fields, deckView, freshFields, loggedCards, movesOf } from '../../frontends/native/src/deck/deck-screen.ts';
import { type SwapOpen, swapSheetOf } from '../../frontends/native/src/deck/deck-swaps.ts';
import { type Session, acceptNudge, act, dismissNudge, leftField, nudgeWords, swapMove, tapDone, tapFill, tapLog, tapReuse, tapStep, undoSwap } from '../../frontends/native/src/deck/deck-writes.ts';
import type { PopSession } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { nudgeText } from '../../frontends/app/src/app/screens/swap-nudge/swap-nudge-model.ts';
import { PLAN_CHANGE_FAILED } from '../../frontends/native/src/this-week/week-screen.ts';
import { fieldsView, openedSets, typeLoad, typeRep, typeSetLoad } from '../../frontends/native/src/deck/set-fields.ts';
import { nativeDay, pageDay } from './native-deck.ts';
import { markBoth, seedBoth } from './native-pop-ups.ts';
import type { Phone } from './stored-state.ts';

/** The keys only the pop-ups write (popups-streaks-reminders.ts; the beta's pop-up/pop-ups.ts), to count what a pop-up stored. */
export const POPUP_KEYS = /^ia_(pop_idx|pop_dismiss|season_shown|remind_last|reminded)_/;

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
export const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));

/** An element of the page, as far as today's handlers read and change one. */
interface El {
  id: string; value: string; placeholder: string; textContent: string; dataset: Record<string, string>; style: Record<string, string>;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean; toggle(c: string, on?: boolean): boolean };
  getAttribute(n: string): string | null;
}
function el(id: string, value = '', placeholder = '', cls = '', rx: string | null = null, text = ''): El {
  const set = new Set(cls.split(' ').filter(Boolean));
  // An input holds text: whatever a handler assigns to its value or its placeholder is turned into a string, as the
  // browser turns it (reuseWeight assigns the pill's number).
  let v = String(value), ph = String(placeholder);
  return {
    id, textContent: text, dataset: {}, style: {},
    get value() { return v; }, set value(x: string) { v = String(x); },
    get placeholder() { return ph; }, set placeholder(x: string) { ph = String(x); },
    classList: {
      add: (c) => { set.add(c); }, remove: (c) => { set.delete(c); }, contains: (c) => set.has(c),
      toggle: (c, on) => { const want = on === undefined ? !set.has(c) : on; if (want) set.add(c); else set.delete(c); return want; },
    },
    getAttribute: (n) => (n === 'data-rx' ? rx : null),
  };
}

/** What a walk compared, so a test can say each kind of tap was made. */
export interface Tally {
  days: number; taps: number; checks: number; steps: number; typed: number; pills: number; logs: number; dones: number; commits: number;
  skips: number; undos: number; marks: number; drafts: number; loaded: number; toasts: number; popups: number;
  /** The swap sheet: sheets compared, their rows, sheets with no row, picks, put backs, nudges that came due, and each toast's kind. */
  sheets: number; rows: number; empty: number; picks: number; unswaps: number; nudges: number; swapToasts: Record<string, number>;
  /** The nudge answered on both apps: Make the change, Leave the plan alone, and the days of the grid a change moved. */
  accepted: number; declined: number; moved: number;
}
export const tally = (): Tally => ({ days: 0, taps: 0, checks: 0, steps: 0, typed: 0, pills: 0, logs: 0, dones: 0, commits: 0, skips: 0, undos: 0, marks: 0, drafts: 0, loaded: 0, toasts: 0, popups: 0,
  sheets: 0, rows: 0, empty: 0, picks: 0, unswaps: 0, nudges: 0, swapToasts: {}, accepted: 0, declined: 0, moved: 0 });

/**
 * Today's swap sheet for one lift of a day, as the Angular sheet's open() builds it (swap-sheet.ts): the page's own
 * swapCandidates (the aux family's list for a lift with no pattern), _compoundTier and swapLoadNote, through today's
 * swap-sheet-model.ts. Null where today's says "Nothing to swap here". Reads only.
 */
export function pageSheet(P: Phone, week: number, dayKey: string, secIdx: number, itemIdx: number): SwapSheetView | null {
  const ctx = P.IA.ctx as Record<string, unknown>;
  ctx['__sw'] = { week, dayKey, secIdx, itemIdx };
  const raw = P.ev(`(function(){var a=__sw;var day=activeProg&&activeProg.weeks&&activeProg.weeks[a.week]&&activeProg.weeks[a.week][a.dayKey];
    var sec=day&&day.sections&&day.sections[a.secIdx];var item=sec&&sec.items&&sec.items[a.itemIdx];
    if(!item||!item.name) return null;
    var c=swapCandidates(item.name,day,a.week,activeProg);var fam=!c.pattern?_auxFamily(item.name):null;
    if(fam){c.tier1=auxSwapCandidates(item.name,day,activeProg);c.tier2=[];}
    return JSON.stringify({name:item.name,detail:item.detail||'',sec:{label:sec.label,superset:sec.superset,type:sec.type,items:(sec.items||[]).map(function(x){return x?{name:x.name}:x;})},
      c:c,label:fam?(_AUX_FAMILY_LABEL[fam]==null?null:_AUX_FAMILY_LABEL[fam]):null,tier:_compoundTier(item.name)});})()`) as string | null;
  if (raw == null) return null;
  const r = JSON.parse(raw) as { name: string; detail: string; sec: { label?: string; superset?: boolean; type?: string; items?: { name: string }[] }; c: { tier1: string[]; tier2: string[]; pattern: string | null; region: string | null }; label: string | null; tier: number };
  const note = P.ev('swapLoadNote') as (o: string, c: string) => string;
  return plain(swapSheetView({ name: r.name, detail: r.detail, itemIdx, section: r.sec, candidates: r.c, familyLabel: r.label, compoundTier: r.tier, loadNote: (o, c) => note(o, c) }));
}
/** The kind of toast a pick raised, by its words (swap-sheet.ts applySwapChoice has six). */
export function swapToastKind(t: string): string {
  const hold = /Your injury plan holds this one at RPE 7\.$/.test(t);
  const kind = /The load runs out before the reps do here\./.test(t) ? 'window' : /No load to add here/.test(t) ? 'no load' : /Same job, same numbers\.$|Same sets, same reps\./.test(t) ? 'same' : 'other';
  return kind + (hold ? ', held' : '');
}

/** One day's deck, open on today's page and in the Expo app, over the same keys. */
export class TwoDecks {
  /** The beta's side: its session, the day as drawn, each move's fields, the once-per-open stale warning. */
  readonly s: Session;
  view!: DeckView;
  fields: Fields = {};
  private readonly warn = { shown: false, src: '' };
  /** The page's side: its cards as drawn, and the moves whose top set the page has marked. */
  pageCards: DeckCard[] = [];
  private readonly topped = new Set<string>();
  /** The moves whose sets stand open (the page's exset-open class), which a redraw closes again. */
  private readonly setsOpen = new Set<string>();
  /** Whether a nudge that comes due is answered (in turn: Make the change, Leave the plan alone). A measure that reads it unanswered sets this off. */
  answers = true;
  private readonly now: number;
  private readonly unit: string;

  private readonly P: Phone;
  readonly week: number;
  readonly dayKey: string;
  private readonly T: Tally;
  private readonly what: string;

  constructor(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, T: Tally, what: string) {
    this.P = P;
    this.week = week;
    this.dayKey = dayKey;
    this.T = T;
    this.what = what;
    this.s = { store, prog: grid, week, dayKey };
    this.now = P.ev('Date.now()') as number;
    this.unit = grid.cfg && grid.cfg.unit === 'kg' ? 'kg' : 'lbs';
    assert.deepStrictEqual(held(store), P.dump(), what + ': both apps start from the same keys');
  }

  private get els(): Map<string, El> { return (this.P as unknown as { fields: Map<string, El> }).fields; }
  private page(code: string): unknown { return this.P.ev(code); }

  // ── Drawing ────────────────────────────────────────────────────────────────────────────────────────────────────
  /** The page's cards for the day (deck.ts build()), which leaves the prescription cache as the app does. */
  private pageBuild(): DeckCard[] {
    const f = <T>(name: string): T => this.P.ev(name) as T;
    const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
    const secs = ((this.P.day(this.week, this.dayKey as never) || {}).sections || []) as ExSection[];
    return plain(deckCards(secs, sectionsView(secs, 0, sectionReads({ call, global: f })), (x) => call<number | null>('_secRounds', x)));
  }
  /** The page's cards drawn afresh: every field as the template writes it (session-sections.ts). */
  private pagePlace(): void {
    this.pageCards = this.pageBuild();
    const m = this.els;
    m.clear();
    this.topped.clear();
    this.setsOpen.clear();
    for (const x of movesOf(this.pageCards)) {
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
  private nativeDraw(): void {
    const v = deckView(this.s.store, this.s.prog, this.week, this.dayKey, this.now, this.warn);
    assert.ok(v, this.what + ': the Expo app opens a deck where today\'s does');
    this.view = v;
    this.fields = freshFields(v.cards);
  }

  /** Start session: both decks open, or false where today's opens none. */
  open(): boolean {
    const P = this.P;
    const day = pageDay(P, this.week, this.dayKey);
    if (!day.view) return false;
    // deck.ts open(): the stale warning once per open, the unit, the day in hand, the idle clock.
    P.ev(`currentWeek=${this.week};_setStaleWarnShown(false);_setStaleWarnSrc('');window._unitLabel=(activeProg.cfg&&activeProg.cfg.unit==='kg')?'kg':'lbs';_setCurrentDayKey(${J(this.dayKey)});ruResetIfIdle();`);
    // The two lookups today's handlers make by selector: a move's load label and its unit.
    const doc = (P.IA.window as unknown as { document: { querySelector: (sel: string) => unknown } }).document;
    const els = (): Map<string, El> => this.els;
    doc.querySelector = (sel: string) => els().get(sel) ?? null;
    this.pagePlace();
    this.nativeDraw();
    this.T.days++;
    this.sameCards('opened');
    this.check('opened');
    return true;
  }

  /** Right after both apps drew the day: every card whole, the once-per-open stale warning included. */
  private sameCards(when: string): void {
    assert.deepStrictEqual(plain(this.view.cards), this.pageCards, this.what + ', ' + when + ': the cards as drawn');
  }

  /** The beta's cards as its screen holds them: what this open has logged laid over the day as drawn. */
  cards(): DeckCard[] { return loggedCards(this.view.cards, this.fields); }
  card(key: string): DeckCard | undefined { return this.cards().find((c) => c.key === key); }
  moves(c: DeckCard): ExCard[] { return movesOf([c]); }

  // ── The check, after every tap ─────────────────────────────────────────────────────────────────────────────────
  check(tap: string): void {
    const what = this.what + ', after ' + tap;
    this.T.checks++;
    // 1. The stores, key for key.
    const beta = held(this.s.store), page = this.P.dump();
    for (const k of new Set([...Object.keys(beta), ...Object.keys(page)])) assert.equal(beta[k], page[k], what + ': ' + k + ' differs');
    // 2. The cards, whole, with what was logged since they were drawn.
    const drawn = plain(this.view.cards).map((c) => ({ ...c, moves: [], logged: false, views: [] }));
    assert.deepStrictEqual(drawn.map((c) => c.key), this.pageCards.map((c) => c.key), what + ': the cards');
    // 3. Every field of every move, and what the card says from them.
    const m = this.els;
    const pageMoves = movesOf(this.pageCards);
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
      const fv = fieldsView(f, parseRx(x.rxDetail, x.name), this.unit);
      if (x.log.sets) {
        assert.deepStrictEqual([fv.head, fv.sub, fv.varied], [m.get('exsum_' + k)!.textContent, m.get('exsumsub_' + k)!.textContent, m.get('exvary_' + k)!.style['display'] !== 'none'], what + ': the set summary of ' + k);
        assert.deepStrictEqual(fv.delta, f.reps.map((_r, s) => m.get('exset_' + k + '_' + s + '_d')!.textContent), what + ': the deltas of ' + k);
      }
      if (x.log.load) assert.equal(fv.loadLabel, m.get('#exlog_' + k + ' .ex-weight-lbl')!.textContent, what + ': the load\'s label of ' + k);
      if (this.topped.has(k) && m.has('extop_' + k)) {
        assert.deepStrictEqual([fv.footLabel, fv.footValue], [m.get('extoplbl_' + k)!.textContent, m.get('extop_' + k)!.textContent], what + ': the foot of ' + k);
        assert.deepStrictEqual(fv.top, f.loads.map((_c, s) => m.get('exsetrow_' + k + '_' + s)!.classList.contains('exset-top')), what + ': the top sets of ' + k);
      }
      // Log restates the pill's words where the card has a pill (the page finds none on a card without one).
      if (f.reuse && m.has('exreusenum_' + k)) assert.deepStrictEqual(f.reuse, { text: m.get('exreusenum_' + k)!.textContent, rec: m.get('exrec_' + k)!.textContent }, what + ': the reuse pill of ' + k);
    }
  }

  /** A tap: made on the page, then on the beta, then checked. Returns the toasts each raised. */
  private tap(name: string, page: () => void, beta: () => string[]): void {
    const before = this.P.toasts.length;
    page();
    this.P.settle();
    const said = beta();
    this.T.taps++;
    // The page's last toast is the one left on screen; the pop-up's own words are not toasts.
    const raised = this.P.toasts.slice(before);
    assert.deepStrictEqual(said, raised, this.what + ', after ' + name + ': the toasts');
    this.T.toasts += said.length;
    this.check(name);
  }

  // ── The taps ───────────────────────────────────────────────────────────────────────────────────────────────────
  /** A move's sets opened (today's toggleSets, which marks the top set): nothing is stored, the foot is then compared. */
  toggle(exKey: string): void {
    // The page's toggle opens and closes; the top set is marked, and the summary restated, as the sets open.
    const opening = !this.setsOpen.has(exKey);
    if (opening) this.setsOpen.add(exKey); else this.setsOpen.delete(exKey);
    this.tap('the sets of ' + exKey + (opening ? ' opened' : ' closed'), () => { this.page(`toggleSets(${J(exKey)});`); this.topped.add(exKey); },
      () => { if (opening) this.fields = { ...this.fields, [exKey]: openedSets(this.fields[exKey]!) }; return []; });
  }
  step(exKey: string, row: number, dir: 1 | -1): void {
    const f = this.fields[exKey]!, by = dir * f.reps[row]!.step;
    const logged = f.logged;
    this.tap('a step on ' + exKey, () => { this.page(`stepSet(${J('exset_' + exKey + '_' + row)},${by});`); }, () => { this.fields = tapStep(this.s, this.fields, exKey, row, by, this.now); return []; });
    this.T.steps++;
    if (logged) this.T.commits++; else this.T.drafts++;
  }
  /** A rep typed into a row. Nothing is saved until the field is left. */
  typeRep(exKey: string, row: number, text: string): void {
    const id = 'exset_' + exKey + '_' + row;
    this.tap('a rep typed on ' + exKey, () => { this.els.get(id)!.value = text; this.page(`setDelta(${J(id)});`); }, () => { this.fields = { ...this.fields, [exKey]: typeRep(this.fields[exKey]!, row, text) }; return []; });
    this.T.typed++;
  }
  typeSetLoad(exKey: string, row: number, text: string): void {
    this.tap('a set\'s load typed on ' + exKey, () => { this.els.get('exsetw_' + exKey + '_' + row)!.value = text; this.page(`onSetWeight(${J(exKey)},${row});`); this.topped.add(exKey); },
      () => { this.fields = { ...this.fields, [exKey]: typeSetLoad(this.fields[exKey]!, row, text) }; return []; });
    this.T.typed++;
  }
  typeLoad(exKey: string, text: string): void {
    this.tap('the load typed on ' + exKey, () => { this.els.get('exw_' + exKey)!.value = text; this.page(`cascadeSetWeights(${J(exKey)});`); this.topped.add(exKey); },
      () => { this.fields = { ...this.fields, [exKey]: typeLoad(this.fields[exKey]!, text) }; return []; });
    this.T.typed++;
  }
  /** The field is left (the page's blur): what the move's cells hold is saved. */
  leave(exKey: string): void {
    const logged = this.fields[exKey]!.logged;
    this.tap('a field of ' + exKey + ' left', () => { this.page(`autoSaveSets(${J(exKey)});`); }, () => { this.fields = leftField(this.s, this.fields, exKey, this.now); return []; });
    if (logged) this.T.commits++; else this.T.drafts++;
  }
  reuse(exKey: string, value: number): void {
    this.tap('the reuse pill of ' + exKey, () => { this.page(`reuseWeight(${J(exKey)},${value});`); this.topped.add(exKey); }, () => { this.fields = tapReuse(this.s, this.fields, exKey, value, this.now); return []; });
    this.T.pills++;
  }
  fill(exKey: string, value: number): void {
    this.tap('Fill every set on ' + exKey, () => { this.page(`fillAllSetWeights(${J(exKey)},${value});`); this.topped.add(exKey); }, () => { this.fields = tapFill(this.s, this.fields, exKey, value, this.now); return []; });
    this.T.pills++;
  }
  log(x: { exKey: string; name: string; rxDetail: string }): void {
    this.tap('Log on ' + x.exKey, () => { this.page(`saveExWeight(${J(x.exKey)},${J(x.name)},${J(x.rxDetail)});`); },
      () => { const r = tapLog(this.s, this.fields, x, this.now); this.fields = r.fields; return r.toast ? [r.toast] : []; });
    this.T.logs++;
  }
  /** Done, next one on a card: today's deck logs, quietly, each of its moves the store holds no entry for today. */
  done(cardKey: string): void {
    const pageCard = this.pageCards.find((c) => c.key === cardKey)!;
    this.tap('Done, next one on ' + cardKey, () => {
      for (const mv of pageCard.moves) {
        const today = this.page(`(function(){var r=getExWeights()[${J(mv.exKey)}];return ((r&&r.entries)||[]).some(function(e){return +e.week===+currentWeek&&entryDay(e)===currentDayKey;});})()`);
        if (!today) this.page(`saveExWeight(${J(mv.exKey)},${J(mv.name)},${J(mv.rxDetail)},true);`);
      }
    }, () => { const r = tapDone(this.s, this.fields, this.card(cardKey)!.moves, this.now); this.fields = r.fields; return r.toasts; });
    this.T.dones++;
  }
  /** A skip or its undo (deck.ts act): today's handlers, each redrawing the cards; the beta's, then its own redraw. */
  edit(a: CardAct, off: boolean): void {
    this.tap((off ? 'a skip' : 'a put back') + ' of ' + J(a), () => {
      if (a.kind === 'exercise') this.page(`${off ? 'skipExercise' : 'unskipExercise'}(${J(a.name)});`);
      else if (a.kind === 'round') this.page(`${off ? 'skipSuperset' : 'unskipSuperset'}(${a.secIdx});`);
      else for (const n of a.names) this.page(`${off ? 'skipExercise' : 'unskipExercise'}(${J(n)});`);
      this.pagePlace();
    }, () => {
      // The page raises a toast for each name; the beta shows the last, as the page's one toast line does.
      const said: string[] = [];
      if (a.kind === 'names') for (const n of a.names) { const t = act(this.s, { kind: 'exercise', name: n }, off); if (t) said.push(t); } else { const t = act(this.s, a, off); if (t) said.push(t); }
      this.nativeDraw();
      this.sameCards('drawn again after ' + (off ? 'a skip' : 'a put back'));
      return said;
    });
    if (off) this.T.skips++; else this.T.undos++;
  }
  // ── The swap sheet (swap-sheet.ts) ─────────────────────────────────────────────────────────────────────────────
  /**
   * An edit whose redraw lands on the deck. In the app, openDetail with the deck open is the deck's redraw
   * (day-detail.ts open(), D275), which leaves the stale warning's once-per-open marks alone. On the bare page
   * openDetail is the session sheet's own draw, which sets them afresh and speaks the warning itself. So the marks
   * are put back as they stood, and the deck's cards are then drawn from them, as the app draws them: a lift swapped
   * in whose last load is stale speaks the warning if none has spoken in this open.
   */
  private redrawn(edit: () => void): void {
    const was = this.page('[_staleWarnShown,_staleWarnSrc]') as [boolean, string];
    edit();
    (this.P.IA.ctx as Record<string, unknown>)['__warn'] = was;
    this.page('_setStaleWarnShown(__warn[0]);_setStaleWarnSrc(__warn[1]);');
  }
  /** The sheet for one lift, on both apps: the same sheet, whole. Nothing is stored by opening it. */
  sheet(secIdx: number, itemIdx: number): SwapOpen | null {
    const before = held(this.s.store);
    const page = pageSheet(this.P, this.week, this.dayKey, secIdx, itemIdx);
    const beta = swapSheetOf(this.s.prog, this.week, this.dayKey, secIdx, itemIdx);
    assert.deepStrictEqual(beta ? plain(beta.view) : null, page, this.what + ': the swap sheet of section ' + secIdx + ', item ' + itemIdx);
    assert.deepStrictEqual(held(this.s.store), before, this.what + ': opening the sheet stored something');
    this.T.sheets++;
    if (beta) { const rows = beta.view.sameJob.length + beta.view.otherJob.length; this.T.rows += rows; if (!rows) this.T.empty++; }
    return beta;
  }
  /**
   * A pick: today's sheet writes the lift in hand as the Angular sheet does (LegacyBridge.set of _swapCtx), then
   * applySwapChoice, which draws the cards afresh; the beta's swapMove, then its own redraw. The nudge that comes due
   * on the third pick running of one pair is due on both, and is then answered on both (answerNudge).
   */
  swap(open: SwapOpen, to: string): void {
    let due = false;
    this.tap('a swap of ' + open.ctx.name + ' for ' + to, () => {
      (this.P.IA.ctx as Record<string, unknown>)['__ctx'] = { ...open.ctx };
      this.redrawn(() => { this.page(`_nudgeCtx=null;_swapCtx=__ctx;applySwapChoice(${J(to)});`); this.P.settle(); });
      due = !!this.page('_nudgeCtx');
      this.page('_nudgeCtx=null;');
      this.pagePlace();
    }, () => {
      const r = swapMove(this.s, open.ctx, to, this.now);
      assert.ok(r, this.what + ': the beta swapped where today\'s did');
      assert.equal(r.nudge, due, this.what + ': the nudge is due on both, or on neither');
      const k = swapToastKind(r.toast);
      this.T.swapToasts[k] = (this.T.swapToasts[k] || 0) + 1;
      this.nativeDraw();
      this.sameCards('drawn again after a swap');
      return [r.toast];
    });
    this.T.picks++;
    if (!due) return;
    this.T.nudges++;
    if (!this.answers) return;
    // Make the change and Leave the plan alone in turn, whatever the lift: a core, trunk or carry move as any other
    // (D291: a preference that names one no longer reaches the engine's own table).
    this.answerNudge(open.ctx.name, to, (this.T.accepted + this.T.declined) % 2 === 0);
  }
  /**
   * The nudge, on both apps: the card's words (the Angular SwapNudge's nudgeText over the page's _pattern; the beta's
   * nudgeWords), then its answer. Leave the plan alone marks the pair offered. Make the change writes the preference
   * into the program, marks the pair offered and rebuilds the program: the page redraws the day (acceptSwapNudge's
   * openDetail, the deck's own redraw in the app), the beta takes the program handed back in place of the one it
   * holds, and the two programs in hand are then the same program, whole: the page the tap was made on is the
   * reference again (before D291 a swap made earlier in that launch on one of the engine's shared items was still in
   * the page's memory when the nudge rebuilt, and the reference had to be a fresh launch).
   */
  answerNudge(from: string, to: string, accept: boolean): void {
    assert.deepStrictEqual(nudgeWords(from, to), nudgeText(from, to, this.page(`_pattern(${J(from)})`) as string | null), this.what + ': the nudge\'s words');
    (this.P.IA.ctx as Record<string, unknown>)['__n'] = { from, to };
    const before = accept ? JSON.stringify(this.P.prog.weeks) : '';
    this.tap(accept ? 'Make the change' : 'Leave the plan alone', () => {
      if (!accept) { this.page('_nudgeCtx=__n;dismissSwapNudge();'); return; }
      this.redrawn(() => { this.page('_nudgeCtx=__n;acceptSwapNudge();'); this.P.settle(); });
      this.pagePlace();
    }, () => {
      if (!accept) { dismissNudge(this.s, from); return []; }
      const said: string[] = [];
      const r = acceptNudge(this.s, from, to, this.now, { overlay: () => { said.push(PLAN_CHANGE_FAILED); }, freeze: () => {}, rebuild: () => {} });
      assert.ok(r.prog, this.what + ': Make the change hands back the program');
      // The screen holds the new program in place of the old one. Here every holder of the grid has the one object
      // (the test that made it, the walk of the next day), so its contents are replaced where it stands, with the
      // program as the rebuild handed it back: the walk's grid is the grid the app holds, never a copy (D291).
      const g = this.s.prog as unknown as Record<string, unknown>;
      for (const k of Object.keys(g)) delete g[k];
      Object.assign(g, r.prog);
      this.nativeDraw();
      this.sameCards('drawn again after Make the change');
      assert.deepStrictEqual(plain(this.s.prog), plain(this.P.prog), this.what + ': the program in hand after Make the change');
      return [...said, r.toast];
    });
    if (accept) { this.T.accepted++; if (JSON.stringify(this.P.prog.weeks) !== before) this.T.moved++; } else this.T.declined++;
  }
  /** Put it back: today's undoSwap, which draws the cards afresh; the beta's, then its own redraw. */
  unswap(from: string): void {
    this.tap('a put back of ' + from, () => { this.redrawn(() => { this.page(`undoSwap(${J(from)});`); }); this.pagePlace(); }, () => {
      const t = undoSwap(this.s, from);
      this.nativeDraw();
      this.sameCards('drawn again after a put back');
      return t ? [t] : [];
    });
    this.T.unswaps++;
  }

  /** Mark the day done, as deck.ts markDay writes it, with the deck's close and the pop-up over This Week. */
  mark(rpe: number | null, notes: string): void {
    const before = this.P.dump(), toasts = this.P.toasts.length;
    // Both apps draw the pop-up's line from the start of one pinned sequence, another one for each day marked.
    const random = seedBoth(this.P, (this.T.marks * 69069 + 12345) % 4294967296);
    markBoth(this.P, { store: this.s.store, prog: this.s.prog } as unknown as PopSession, this.week, this.dayKey, this.view.title, rpe, notes, random, null, this.what);
    assert.equal(this.P.toasts.length, toasts, this.what + ': the pop-up stands where the toast would, and no toast is raised');
    this.T.taps++;
    this.check('Mark the day done');
    this.T.marks++;
    const after = this.P.dump();
    if (Object.keys(after).some((k) => POPUP_KEYS.test(k) && after[k] !== before[k])) this.T.popups++;
  }
  /** The deck closed: the day drawn again by both apps is the same day, whole. */
  close(): void {
    const page = pageDay(this.P, this.week, this.dayKey), beta = nativeDay(this.s.store, this.s.prog, this.week, this.dayKey, this.now);
    assert.deepStrictEqual(beta, page, this.what + ': the day drawn again after the deck closed');
  }
}

/**
 * One day worked through its deck on both apps, the taps chosen from what the day holds and from `n` so that each
 * kind of tap falls on some card: sets stepped and typed, a load typed, a set's load typed and cleared, the reuse
 * pill, Fill every set, Log, a change after Log, Done next one, a card skipped and put back, a move skipped inside a
 * card, drafts left unlogged, then Call it with the effort moved or left alone. False where no deck opens.
 */
export function workDay(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, n: number, T: Tally, mark = true): boolean {
  const D = new TwoDecks(P, store, grid, week, dayKey, T, 'week ' + week + ', ' + dayKey);
  if (!D.open()) return false;
  const keys = D.view.cards.map((c) => c.key);
  keys.forEach((key, ci) => {
    let c = D.card(key);
    if (!c || c.kind === 'finish' || c.skipped) return;
    D.moves(c).forEach((x, mi) => {
      if (!x.log) return;
      const k = x.exKey, f = D.fields[k]!, rows = f.reps.length;
      if (rows && (ci + mi + n) % 2 === 0) D.toggle(k);
      if (rows) D.step(k, 0, 1);
      if (rows >= 2) { D.typeRep(k, 1, String(5 + ((n + mi) % 4))); D.leave(k); }
      if (rows >= 3 && (mi + n) % 2) D.step(k, 2, -1);
      if (!f.load) return;
      T.loaded++;
      const ld = x.log.load!;
      const pick = (ci + mi + n) % 3;
      if (pick === 0) {
        D.typeLoad(k, String(95 + 10 * n + 5 * mi)); D.leave(k);
        if (f.loads.length >= 2) { D.typeSetLoad(k, 1, String(105 + 10 * n)); D.leave(k); }
      } else if (pick === 1) {
        if (ld.reuse) D.reuse(k, ld.reuse.value); else { D.typeLoad(k, '80.5'); D.leave(k); }
      } else {
        if (ld.fill) D.fill(k, ld.fill.value); else { D.typeLoad(k, '60'); D.leave(k); }
        if (f.loads.length >= 2) { D.typeSetLoad(k, 0, ''); D.leave(k); D.typeLoad(k, '70'); D.leave(k); }
      }
    });
    const first = D.moves(c).find((x) => x.log);
    const v = (ci + n) % 4;
    if (v === 0 && first) {
      D.log(first);
      const f = D.fields[first.exKey]!;
      if (f.reps.length) D.step(first.exKey, 0, 1);
      if (f.load) { D.typeLoad(first.exKey, '200'); D.leave(first.exKey); }
      D.done(key);
    } else if (v === 1) {
      D.done(key);
    } else if (v === 2) {
      if (c.skip) {
        D.edit(c.skip, true);
        c = D.card(key);
        if (c && c.undo) D.edit(c.undo, false);
      }
      D.done(key);
    } else {
      // Drafts left as they are; and inside a card of several moves, one skipped by its own minus, put back on odd days.
      const inner = c.kind !== 'lift' ? D.moves(c).filter((x) => x.skip).pop() : undefined;
      if (inner) {
        D.edit({ kind: 'exercise', name: inner.name }, true);
        if (n % 2) D.edit({ kind: 'exercise', name: inner.name }, false);
      }
    }
  });
  if (mark) { if (n % 2 === 0) D.mark(8 - (n % 3), 'Deck day ' + n + ' 💪'); else D.mark(null, ''); }
  D.close();
  return true;
}
