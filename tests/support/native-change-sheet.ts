// Hurt? and Traveling?, the chips with I'm back and the check in, This Week's race date and Program Start, and the
// Programs tab's copy button: the Expo app's against today's page (MIGRATION.md phase 3, row 5, its third session).
// Two apps over one stored state: the page in the VM harness (a Phone), and the Expo app's readers
// (frontends/native/src/change-sheet/overlay-readers.ts), writers (overlay-writes.ts, week-dates/week-dates.ts) and
// copy text (program-list/list-screen.ts copyText) over its own SQLite store, on the program its own launch handed
// back (liveProgram: the structure as the app holds it, never a copy). After every tap the two are held equal: the
// draft, every byte of the sheet's markup while it is open, every byte of the chips, each toast, each pop-up whole,
// whether the sheet closed, the program in hand whole (its grid, its overlays, its dates, its config), This Week
// under it, and every ia_ key, value for value.
//
// THE PAGE WRITES MARKUP. The page under the harness has no Angular screen: overlays.ts writes the sheet's body and
// the chips as strings. The Expo app's views are printed here as those strings (changeMarkup, chipMarkup, typed by
// hand from _renderTravelTab, _renderInjuryTab and renderOverlayChip) and compared with the page's own, byte for byte.
//
// The reference is today's page on purpose. No Angular screen provides a function this walk calls on the page bar
// popFire, which is the Angular PopUp's in the app (support/native-pop-ups.ts makes it as that component does).
// The page's clock is pinned for a launch, so two changes stored in one launch share an id (ov_ and the instant);
// a walk that stores two launches again between them, as a phone's clock moves between two taps.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import type { ChangeSheetView, ChoiceCard, DateField, DraftKey, Effect, OverlayDraft } from '../../frontends/native/src/change-sheet/change-sheet-model.ts';
import { type ChangeChip, type CheckIn, type OverlayProgram, newOverlayDraft, openInjury, openTravel, overlayChips, setDraft, sheetView } from '../../frontends/native/src/change-sheet/overlay-readers.ts';
import { type OverlayAct, type OverlayTap, applyInjuryDraft, applyOverlayDraft, imBackFromInjury, injReassess, injSnooze, removeOverlay } from '../../frontends/native/src/change-sheet/overlay-writes.ts';
import type { PopSession } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { COPIED } from '../../frontends/native/src/program-list/list-readers.ts';
import { copyText } from '../../frontends/native/src/program-list/list-screen.ts';
import { type DatedProgram, setProgRace, setProgStart, titleAfterDate } from '../../frontends/native/src/week-dates/week-dates.ts';
import { liveProgram, midnight } from '../../frontends/native/src/this-week/week-screen.ts';
import { iso } from './native-deck-swap.ts';
import { pops, sameView, seedBoth } from './native-pop-ups.ts';
import { launchNow, nativeView, pageShown, pageView } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(J(x)) as T;
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));

/** Two long texts held equal: a difference is named by where it starts, never handed whole to the assertion. */
function sameText(mine: string, theirs: string, what: string): void {
  if (mine === theirs) return;
  let i = 0;
  while (i < mine.length && i < theirs.length && mine[i] === theirs[i]) i++;
  assert.fail(what + ' (they part at ' + i + ' of ' + mine.length + ' and ' + theirs.length + ': here "' + mine.slice(Math.max(0, i - 50), i + 70) + '", today\'s "' + theirs.slice(Math.max(0, i - 50), i + 70) + '")');
}
/** Two stores held equal, key for key: the first key that differs is named. */
function sameStore(mine: Record<string, string>, theirs: Record<string, string>, what: string): void {
  for (const k of [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].sort()) {
    if (mine[k] === undefined || theirs[k] === undefined) assert.fail(what + ': ' + k + ' is held by ' + (mine[k] === undefined ? 'today\'s alone' : 'the Expo app alone'));
    sameText(mine[k]!, theirs[k]!, what + ': ' + k);
  }
}

/** What the walks compared so far, by kind: each is a thing the screens can draw, a toast, a pop-up or a write. */
export type ChangeTally = Record<string, number>;
export const changeTally = (): ChangeTally => ({});

// ── The views as the page's markup (typed by hand from overlays.ts) ──────────────────────────────────────────────
const cardMarkup = (c: ChoiceCard): string => '<div class="ov-eq' + (c.sel ? ' sel' : '') + '" onclick="_ovSet(\'' + c.key + '\',\'' + c.id + '\')"><div class="ov-eq-body"><div class="ov-eq-name">' + c.name + '</div>'
  + (c.desc !== null ? '<div class="ov-eq-desc">' + c.desc + '</div>' : '') + '</div>' + (c.sel ? '<span class="ov-eq-chk">✓</span>' : '') + '</div>';
const effectMarkup = (e: Effect): string => '<div class="ov-effect">' + (e.title !== null ? '<div class="ov-effect-ttl">' + e.title + '</div>' : '')
  + e.subs.map((s) => '<div class="ov-effect-sub"' + (s.style !== null ? ' style="' + s.style + '"' : '') + '>' + s.text + '</div>').join('') + '</div>';
const dateMarkup = (f: DateField): string => '<label class="ov-date"><span class="ov-date-lbl">' + f.label + '</span><span class="ov-date-val">' + f.shown + '</span><input type="date"'
  + (f.min !== null ? ' min="' + f.min + '"' : '') + ' value="' + f.value + '" onchange="_ovSet(\'' + f.key + '\',this.value)"></label>';
const footMarkup = (a: string): string => '<button class="ov-apply" onclick="' + (a === 'travel' ? 'applyOverlayDraft()' : a === 'injury' ? 'applyInjuryDraft()' : 'closeOverlaySheet()') + '">' + (a === 'close' ? 'Got it' : 'Apply change') + '</button>';
/** The Expo app's sheet as the markup today's page writes into #changeBody (renderOverlaySheet). */
export function changeMarkup(v: ChangeSheetView): string {
  let h = '<div class="ov-kicker">' + v.kicker + '</div><div class="ov-title">' + v.title + '</div><div class="ov-intro">' + v.intro + '</div>';
  if (v.travel) {
    const t = v.travel;
    h += (t.dates ? '<div class="ov-dates">' + t.dates.map(dateMarkup).join('') + '</div>' : '') + '<div class="ov-eq-lbl">What you’ll have</div>' + t.cards.map(cardMarkup).join('') + effectMarkup(t.effect) + footMarkup(t.action);
  }
  if (v.injury) {
    const i = v.injury;
    h += '<div class="ov-eq-lbl">Where’s the problem</div>' + i.regions.map(cardMarkup).join('')
      + (i.tiers ? '<div class="ov-eq-lbl" style="margin-top:12px">How bad is it</div>' + i.tiers.map(cardMarkup).join('') : '')
      + (i.effect ? effectMarkup(i.effect) : '')
      + (i.dates ? '<div class="ov-dates" style="margin-top:12px">' + i.dates.map(dateMarkup).join('') + '</div>' : '')
      + (i.action ? footMarkup(i.action) : '');
  }
  return h;
}
/** A chip or the check in as the element today's page appends to #changeActiveWrap (renderOverlayChip). */
export function chipMarkup(c: ChangeChip | CheckIn): { cls: string; html: string } {
  if (c.kind === 'checkin') {
    return {
      cls: 'change-chip reassess-card',
      html: '<div class="change-chip-body"><div class="change-chip-ttl">' + c.title + '</div><div class="change-chip-sub">' + c.sub + '</div><div class="reassess-acts">'
        + c.answers.map((a) => '<button data-ans="' + a.ans + '">' + a.label + '</button>').join('') + '</div></div>',
    };
  }
  return {
    cls: 'change-chip',
    html: '<div class="change-chip-body"><div class="change-chip-ttl">' + c.title + '</div><div class="change-chip-sub">' + c.sub + '</div>'
      + (c.back ? '<div class="change-chip-act" role="button" data-ovid="' + c.id + '">I’m back</div>' : '') + '</div><div class="change-chip-x" role="button" aria-label="Remove change" data-ovid="' + c.id + '">✕</div>',
  };
}

/** A phone holding another's keys, launched at a local date and time. */
export function phoneOn(P: Phone, when: string): Phone {
  const Q = new Phone();
  for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
  Q.launch(when);
  Q.settle();
  return Q;
}
/** A phone holding another's keys, launched `days` and `minutes` after it. */
export function phoneAfter(P: Phone, days: number, minutes = 0): Phone {
  P.settle();
  return phoneOn(P, iso(new Date(launchNow(P).getTime() + days * 86400000 + minutes * 60000)));
}

const SPANS: [RegExp, string][] = [
  [/^Week \d+$/, 'Week N'], [/^Weeks \d+–\d+$/, 'Weeks N–M'], [/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d+$/, 'one day'],
  [/^[A-Z][a-z]{2} \d+–\d+$/, 'days in one month'], [/^[A-Z][a-z]{2} \d+–[A-Z][a-z]{2} \d+$/, 'days across two months'], [/^From [A-Z][a-z]{2} \d+$/, 'From a day'],
];

/** Both apps on Hurt?, Traveling?, the chips, the two dates and the copy button, over one stored state. */
export class TwoChanges {
  readonly P: Phone;
  readonly store: StateStore;
  readonly T: ChangeTally;
  readonly what: string;
  readonly now: number;
  /** The program in hand in the Expo app: its launch's own, then whatever a rebuild handed back. */
  prog: OverlayProgram;
  /** The Expo app's draft, kept between sheets as the page keeps its own. */
  draft: OverlayDraft = newOverlayDraft();
  /** The sheet open in the Expo app, and what it shows. */
  open = false;
  view: ChangeSheetView | null = null;
  /** The chips the Expo app draws after the last tap. */
  chips: (ChangeChip | CheckIn)[] = [];
  /** The keys the last tap changed in the Expo app's store (the page's own are held equal to them). */
  wrote: string[] = [];
  /** The toast the last tap said, or null; the buttons of the pop-up it raised, when it has more than one. */
  said: string | null = null;
  acts: OverlayAct[] | null = null;
  /** The week the Expo app's screen holds as its own (week-dates.ts titleAfterDate), and whether the last date sent the title back. */
  own: number | null;
  reset = false;
  private readonly draw: () => number;
  private readonly failures: string[] = [];
  private readonly report = { overlay: () => { this.failures.push('overlay'); }, freeze: () => { this.failures.push('freeze'); }, rebuild: () => { this.failures.push('rebuild'); } };

  /** `P` is a phone just launched; the Expo app's store takes its keys, and makes its own launch on them. */
  constructor(P: Phone, T: ChangeTally, what: string) {
    this.P = P; this.T = T; this.what = what;
    P.settle();
    this.store = sqliteTestStore();
    for (const [k, v] of Object.entries(P.dump())) this.store.set(k, v);
    this.now = P.ev('Date.now()') as number;
    const prog = liveProgram(this.store, this.now, this.report);
    assert.ok(prog, what + ': the store holds an active program');
    this.prog = prog as unknown as OverlayProgram;
    sameStore(held(this.store), P.dump(), what + ': the Expo app\'s launch leaves the keys today\'s launch left');
    sameText(J(this.prog), P.ev('JSON.stringify(activeProg)') as string, what + ': the launch\'s program is today\'s, whole');
    this.draw = seedBoth(P, 11);
    pops(P);
    // The page's own calls the walk reads: the sheet drawn and the sheet closed. A plan change that failed to apply
    // is the page's toast; here it is counted, and the two are held equal after each tap.
    (P.IA.ctx as Record<string, unknown>)['__cs'] = { drawn: 0, closed: 0 };
    P.ev('renderOverlaySheet=(function(o){return function(){__cs.drawn++;return o.apply(this,arguments);};})(renderOverlaySheet);');
    P.ev('closeOverlaySheet=(function(o){return function(){__cs.closed++;return o.apply(this,arguments);};})(closeOverlaySheet);');
    assert.deepStrictEqual(this.draft, plain(P.ev('_ovDraft')), what + ': the draft a launch leaves is today\'s');
    this.own = P.ev('currentWeek') as number;
    this.same(what + ', the launch');
  }

  private n(k: string, by = 1): void { this.T[k] = (this.T[k] || 0) + by; }
  /** A walk's own count. */
  note(k: string): void { this.n(k); }
  private get session() { return { store: this.store, prog: this.prog }; }
  private calls(): { drawn: number; closed: number } { return JSON.parse(this.P.ev('JSON.stringify(__cs)')); }
  private pageChips(): { cls: string; html: string }[] {
    return JSON.parse(this.P.ev("(function(){var w=document.getElementById('changeActiveWrap');w.children.length=0;w.childNodes.length=0;renderOverlayChip();return JSON.stringify(w.children.map(function(c){return {cls:c.className,html:c.innerHTML};}));})()"));
  }

  /** Everything that stands after a tap, equal: the draft, the sheet, the chips, the program in hand, the store. */
  private same(what: string): void {
    assert.deepStrictEqual(plain(this.draft), plain(this.P.ev('_ovDraft')), what + ': the draft is not today\'s');
    if (this.open) {
      this.view = sheetView(this.draft, this.prog, new Date(this.now));
      this.P.ev('renderOverlaySheet()');
      const theirs = String(this.P.ev("document.getElementById('changeBody').innerHTML"));
      assert.ok(theirs.length > 300 && theirs.startsWith('<div class="ov-kicker">'), what + ': the page\'s sheet was read');
      sameText(changeMarkup(this.view), theirs, what + ': the sheet is not today\'s, byte for byte');
      this.n('sheet markup bytes compared', theirs.length);
      this.countSheet(this.view);
    } else this.view = null;
    this.chips = overlayChips(this.prog, this.now);
    const page = this.pageChips();
    assert.deepStrictEqual(this.chips.map(chipMarkup), page, what + ': the chips are not today\'s, byte for byte');
    this.n('chip draws compared'); this.n('chip markup bytes compared', page.reduce((a, c) => a + c.html.length, 0));
    this.countChips(this.chips);
    sameText(J(this.prog), this.P.ev('JSON.stringify(activeProg)') as string, what + ': the program in hand is not today\'s, whole');
    const mine = held(this.store), theirs = this.P.dump();
    sameStore(mine, theirs, what + ': the store is not today\'s, key for key');
    this.n('keys compared', Object.keys(theirs).length);
  }

  /**
   * One tap on both, then everything equal. `page` is today's call. `native` makes the same tap and hands back what
   * it left, or null when it does nothing; `opens` says what the tap does to the Expo app's sheet when it is not the
   * tap's own `closed`.
   */
  private tap(name: string, page: string, native: () => OverlayTap | null, opens?: boolean): OverlayTap | null {
    const what = this.what + ', ' + name;
    this.P.settle();
    const list = pops(this.P);
    const t0 = this.P.toasts.length, p0 = list.length, c0 = this.calls(), wasOpen = this.open, f0 = this.failures.length;
    const pre = held(this.store);
    this.P.ev(page); this.P.settle();
    const out = native();
    if (out && out.prog) this.prog = out.prog;
    if (opens !== undefined) this.open = opens; else if (out && out.closed) this.open = false;
    this.said = out ? out.toast : null;
    this.acts = out && out.acts ? out.acts : null;
    const c1 = this.calls();
    // A plan change that failed to apply is said by the page as a toast of its own, before the tap's.
    const failed = this.failures.slice(f0).filter((f) => f === 'overlay').map(() => 'A plan change failed to apply. Flag it in Bugs.');
    assert.deepStrictEqual(failed.concat(this.said ? [this.said] : []), this.P.toasts.slice(t0), what + ': the toast is not today\'s');
    if (this.said) this.n('toast: ' + this.said.replace(/[A-Z][a-z]{2}, [A-Z][a-z]{2} \d+/g, '<day>'));
    const raised = list.slice(p0);
    if (out && out.pop) {
      assert.equal(raised.length, 1, what + ': today\'s raises one pop-up');
      const v = sameView({ store: this.store, prog: this.prog } as unknown as PopSession, out.pop, new Date(this.now), this.draw, raised[0], what);
      this.n('pop-up: ' + v.kicker + ', ' + v.msg);
      if (/Your pace targets resume/.test(v.sub)) this.n(/Race day does not move/.test(v.sub) ? 'pop-up: the pace clock, race day does not move' : / 1 more week than/.test(v.sub) ? 'pop-up: the pace clock, one more week' : 'pop-up: the pace clock, more weeks');
      if (v.actions.length > 1) this.n('pop-up: two answers');
    } else assert.equal(raised.length, 0, what + ': today\'s raises no pop-up');
    const pageOpen = c1.closed > c0.closed ? false : c1.drawn > c0.drawn ? true : wasOpen;
    assert.equal(this.open, pageOpen, what + ': the sheet is ' + (pageOpen ? 'open' : 'shut') + ' on today\'s page');
    this.same(what);
    const mine = held(this.store);
    this.wrote = [...new Set([...Object.keys(pre), ...Object.keys(mine)])].filter((k) => pre[k] !== mine[k]).map((k) => k.split(this.prog.id).join('<id>')).sort();
    this.n('taps');
    return out;
  }

  // ── The sheet ──
  /** The Hurt? pill. */
  hurt(): void { this.tap('Hurt?', 'openInjurySheet()', () => { this.draft = openInjury(this.draft, this.prog, new Date(this.now)); return { toast: null, closed: false }; }, true); this.n('opened: Hurt?'); }
  /** Traveling? at the foot of This Week. */
  travel(): void { this.tap('Traveling?', 'openOverlaySheet()', () => { this.draft = openTravel(this.draft, new Date(this.now)); return { toast: null, closed: false }; }, true); this.n('opened: Traveling?'); }
  /** A card tapped, or a date box's change (a blank value is the box's Reset). */
  set(k: DraftKey, v: string): void {
    assert.ok(this.open, this.what + ': a choice is made on an open sheet');
    this.tap('set ' + k + ' to ' + (v || 'blank'), '_ovSet(' + J(k) + ',' + J(v) + ')', () => { this.draft = setDraft(this.draft, k, v, new Date(this.now)); return { toast: null, closed: false }; });
    this.n('set: ' + k + (v === '' ? ', blank' : ''));
  }
  /** The button at the sheet's foot: Apply change, or Got it. Returns whether the sheet closed. */
  foot(): boolean {
    assert.ok(this.view, this.what + ': the sheet is open');
    const a = this.view.travel ? this.view.travel.action : this.view.injury!.action;
    assert.ok(a, this.what + ': the sheet has a button');
    const now = this.now;
    if (a === 'close') { this.tap('Got it', 'closeOverlaySheet()', () => ({ toast: null, closed: true })); this.n('Got it'); return true; }
    const out = this.tap('Apply change', a === 'travel' ? 'applyOverlayDraft()' : 'applyInjuryDraft()', () => (a === 'travel' ? applyOverlayDraft(this.session, this.draft, now, this.report) : applyInjuryDraft(this.session, this.draft, now, this.report)))!;
    this.n(out.closed ? 'applied: ' + a : 'refused: ' + a);
    if (out.closed) this.wroteOnly('ia_programs', 'Apply change');
    else assert.deepStrictEqual(this.wrote, [], this.what + ': a refusal writes nothing');
    return out.closed;
  }
  /** Apply change asked of a draft the sheet shows no button for (the page's guards behind the button). */
  force(which: 'travel' | 'injury'): OverlayTap {
    const now = this.now;
    return this.tap('Apply change, forced', which === 'travel' ? 'applyOverlayDraft()' : 'applyInjuryDraft()', () => (which === 'travel' ? applyOverlayDraft(this.session, this.draft, now, this.report) : applyInjuryDraft(this.session, this.draft, now, this.report)))!;
  }
  /** The sheet's Back. */
  back(): void { this.tap('Back', 'closeOverlaySheet()', () => ({ toast: null, closed: true })); this.n('Back'); }

  // ── The chips ──
  /** A chip's ✕. */
  remove(id: string): void {
    this.tap('✕', 'removeOverlay(' + J(id) + ')', () => removeOverlay(this.session, id, this.now, this.report));
    this.n('removed'); this.wroteOnly('ia_programs', '✕');
  }
  /** I'm back on a chip. */
  imBack(id: string): void {
    this.tap('I’m back', 'imBackFromInjury(' + J(id) + ')', () => imBackFromInjury(this.session, id, this.now, this.report));
    this.n('I’m back'); this.wroteOnly('ia_programs', 'I’m back');
  }
  /** The check in's answer. */
  answer(id: string, ans: 'better' | 'same' | 'worse'): void {
    this.tap('check in, ' + ans, 'injReassess(' + J(id) + ',' + J(ans) + ')', () => injReassess(this.session, id, ans, this.now));
    this.n('check in: ' + ans);
    if (ans === 'better') assert.deepStrictEqual(this.wrote, [], this.what + ': Better writes nothing');
    else this.wroteOnly('ia_programs', 'the check in');
  }
  /** A button of the pop-up Better raised: I'm back (0), or More time (1). The page's is its handler code after popClose(). */
  popAct(index: number): void {
    const a = this.acts && this.acts[index];
    assert.ok(a, this.what + ': the pop-up has that button');
    if (a.kind === 'back') { this.imBack(a.id); this.n('Good sign: I’m back'); return; }
    this.tap('More time', 'injSnooze(' + J(a.id) + ')', () => injSnooze(this.session, a.id, this.now));
    this.n('Good sign: More time'); this.wroteOnly('ia_programs', 'More time');
  }

  // ── This Week's two dates ──
  /** A date picked in the row's box (blank is the box's Reset). Returns the toast, or null when the tap does nothing. */
  date(which: 'race' | 'start', value: string): string | null {
    let set = false;
    this.tap(which + ' date ' + (value || 'blank'), (which === 'race' ? 'setProgRace(' : 'setProgStart(') + J(value) + ')', () => {
      const r = which === 'race' ? setProgRace(this.store, this.prog as DatedProgram, value, this.now, this.report) : setProgStart(this.store, this.prog as DatedProgram, value, this.now, this.report);
      if (!r) return null;
      set = r.set;
      return { toast: r.toast, closed: false, prog: r.prog as OverlayProgram };
    });
    this.reset = false;
    if (set) {
      const t = titleAfterDate(this.own, this.prog as DatedProgram, midnight(new Date(this.now)));
      this.own = t.own; this.reset = t.reset;
      assert.equal(this.own, this.P.ev('currentWeek'), this.what + ': the week the screen holds after a date is the page\'s current week');
      // The day it already holds stores the same bytes; any other writes ia_programs alone.
      if (this.wrote.length) this.wroteOnly('ia_programs', 'a date'); else this.n(which + ' date set to the day it held: the same bytes');
      this.n(which + ' date set');
    } else {
      assert.deepStrictEqual(this.wrote, [], this.what + ': a date that sets nothing writes nothing');
      this.n(which + ' date: ' + (value === '' ? 'a blank box does nothing' : 'not set'));
    }
    return this.said;
  }

  // ── The copy button ──
  /** The copy button by the seed: the text handed to the clipboard, and the toast once the clipboard answers. */
  async copy(): Promise<string> {
    const what = this.what + ', copy';
    const ctx = this.P.IA.ctx as Record<string, unknown>;
    ctx['__clip'] = [];
    this.P.ev('Object.defineProperty(navigator,"clipboard",{value:{writeText:function(t){__clip.push(String(t));return Promise.resolve();}},configurable:true});');
    const t0 = this.P.toasts.length, pre = held(this.store);
    this.P.ev('copyProgSel(activeProgId)');
    assert.deepStrictEqual(this.P.toasts.slice(t0), [], what + ': the page says nothing before the clipboard answers');
    await new Promise((r) => setImmediate(r));
    const text = copyText(this.store, this.prog.id, new Date(this.now));
    assert.ok(text !== null, what + ': the program is stored');
    assert.deepStrictEqual([text], ctx['__clip'], what + ': the text handed to the clipboard is today\'s');
    assert.deepStrictEqual([COPIED], this.P.toasts.slice(t0), what + ': the toast is today\'s');
    sameStore(held(this.store), pre, what + ': the copy writes nothing');
    sameStore(held(this.store), this.P.dump(), what + ': the store is today\'s');
    this.n('copied'); this.n('copied lines', text.split('\n').length);
    for (const head of ['Run anchor: ', 'Event: ', 'Seed: ']) if (text.split('\n').some((l) => l.startsWith(head))) this.n('copied: a line of ' + head.trim());
    if (/\(est\. from experience\)/.test(text)) this.n('copied: 1RM from experience'); else this.n('copied: 1RM as entered');
    if (/Cardio: lift only/.test(text)) this.n('copied: lift only');
    return text;
  }

  /** This Week with the title holding today and one column picked: the Expo app's draw against today's. */
  week(col: number | null = null, title: number = pageShown(this.P)): ReturnType<typeof pageView> {
    const page = pageView(this.P, title, col, true);
    assert.deepStrictEqual(nativeView(this.store, this.prog as never, new Date(this.now), title, col, true), page, this.what + ': This Week is not today\'s (title ' + title + ', column ' + col + ')');
    this.n('This Week compared');
    this.n(page.hurt.injured ? 'This Week: the pill names a region' : 'This Week: the pill reads Hurt?');
    this.n(page.row.kind === 'race' ? 'This Week: the row is the race date' : page.row.shown ? 'This Week: the row is Program Start' : 'This Week: the row reads Set date');
    if (page.injuryWeek) this.n('This Week: an injury week');
    return page;
  }

  private wroteOnly(key: string, what: string): void {
    assert.deepStrictEqual(this.wrote, [key], this.what + ': ' + what + ' writes ' + key + ' and nothing else');
    this.n('wrote ' + key + ' alone');
  }

  /** Every kind of thing a draw of the sheet holds, counted off the model's view. */
  private countSheet(v: ChangeSheetView): void {
    this.n('sheet draws');
    if (v.travel) {
      const t = v.travel;
      this.n('Traveling? drawn');
      if (t.dates) {
        this.n('Traveling?: a date box', t.dates.length);
        for (const d of t.dates) if (d.shown === 'Set date') this.n('Traveling?: ' + d.label + ' reads Set date');
        if (t.dates[1]!.min) this.n('Traveling?: Through has an earliest day');
      } else this.n('Traveling?: no date boxes (Full gym)');
      this.n('Traveling?: a gear card', t.cards.length);
      for (const c of t.cards) if (c.sel) this.n('Traveling?: ' + c.name + ' picked');
      const e = t.effect;
      if (e.title === 'You’re set') this.n('Traveling?: effect, You’re set');
      else if (e.title === null) this.n('Traveling?: effect, the range falls outside the program');
      else {
        this.n(/onward\.$/.test(e.title) ? 'Traveling?: effect, onward (no Through)' : /One day\.$/.test(e.title) ? 'Traveling?: effect, one day' : /\d+ days\.$/.test(e.title) ? 'Traveling?: effect, days in figures' : 'Traveling?: effect, days in words');
        if (/end of your program/.test(e.subs[0]!.text)) this.n('Traveling?: back line, runs to the end of the program');
        else if (/picks your program back up/.test(e.subs[0]!.text)) this.n('Traveling?: back line, a day picks the program back up');
        else this.n('Traveling?: back line, none');
        this.n(/Reps are yours/.test(e.subs[1]!.text) ? 'Traveling?: holds line, Room only' : 'Traveling?: holds line, gear');
      }
      this.n(t.action === 'close' ? 'Traveling?: Got it' : 'Traveling?: Apply change');
    }
    if (v.injury) {
      const i = v.injury;
      this.n('Hurt? drawn');
      this.n('Hurt?: a region card', i.regions.length);
      for (const c of i.regions) if (c.sel) this.n('Hurt?: ' + c.id + ' picked');
      if (!i.regions.some((c) => c.sel)) this.n('Hurt?: no region picked');
      if (i.tiers) { this.n('Hurt?: a tier card', i.tiers.length); for (const c of i.tiers) if (c.sel) this.n('Hurt?: ' + c.id + ' tier picked'); }
      if (i.effect) {
        const kind = i.effect.title === 'That one’s above my pay grade' ? 'above my pay grade' : /^Protected/.test(i.effect.title || '') ? 'Protected' : 'Working around it';
        this.n('Hurt?: effect, ' + kind);
        if (kind !== 'above my pay grade') this.n('Hurt?: effect of ' + this.draft.injRegion + ', ' + (this.draft.injTier || 'workaround'));
      }
      if (i.dates) this.n(i.dates[0]!.shown === 'Set date' ? 'Hurt?: From reads Set date' : 'Hurt?: the From date box');
      if (i.action) this.n(i.action === 'close' ? 'Hurt?: Got it' : 'Hurt?: Apply change'); else this.n('Hurt?: no button');
    }
  }

  /** Every kind of thing a draw of the chips holds, counted off overlayChips' own view. */
  private countChips(list: (ChangeChip | CheckIn)[]): void {
    if (!list.length) { this.n('chips: none'); return; }
    for (const c of list) {
      if (c.kind === 'checkin') { this.n('chip: the check in'); this.n(/on the it plan/.test(c.sub) ? 'chip: the check in names no region' : 'chip: the check in names its region'); continue; }
      const [head, span] = c.title.split(' · ') as [string, string];
      this.n('chip: ' + head);
      const g = SPANS.find(([re]) => re.test(span || ''));
      this.n('chip span: ' + (g ? g[1] : span === '' ? 'none' : 'another (' + span + ')'));
      if (c.back) this.n('chip: I’m back');
      this.n('chip: the ✕');
      if (/One light week, then full send\.$/.test(c.sub)) this.n('chip line: a return week');
      else if (/Tap I’m back when it’s ready\.$/.test(c.sub)) this.n('chip line: an injury, tap I’m back');
      else if (/ Back to normal [A-Z][a-z]{2} [A-Z][a-z]{2} \d+\.$/.test(c.sub)) this.n('chip line: back to normal on a day');
      else if (/ Open-ended\.$/.test(c.sub)) this.n('chip line: open-ended');
      else this.n('chip line: another (' + c.sub + ')');
      if (/\(protected\)/.test(c.sub)) this.n('chip line: protected');
      if (/\(working around it\)/.test(c.sub)) this.n('chip line: working around it');
      for (const gear of ['Room only', 'Mini gym', 'Full gym', 'Home Full', 'CrossFit Box', 'Minimal / Travel', 'Modified']) if (c.sub.startsWith(gear + '.')) this.n('chip line: ' + gear);
      if (c.sub.startsWith('kettlebells.')) this.n('chip line: a gear with no name, as stored');
    }
  }
}

// ── The walks ────────────────────────────────────────────────────────────────────────────────────────────────────
const dayOf = (now: number, days: number): string => iso(new Date(now + days * 86400000)).slice(0, 10);
/** The id of the newest stored change of the Expo app's program. */
const newest = (two: TwoChanges): string => two.prog.overlays![two.prog.overlays!.length - 1]!.id;
/** The first chip that offers I'm back, or null. */
const backChip = (two: TwoChanges): ChangeChip | null => (two.chips.find((c) => c.kind === 'chip' && c.back) as ChangeChip | undefined) || null;
const checkIn = (two: TwoChanges): CheckIn | null => (two.chips.find((c) => c.kind === 'checkin') as CheckIn | undefined) || null;

/**
 * Hurt? drawn on every region and both tiers and applied once: the sheet with no region, each of the eight cards,
 * each tier, the one the app does not train around (Got it), a From outside the program refused, a blank From (which
 * is today), then Apply change. Where an injury is live already (the week after a return week counts, as today's),
 * Hurt? opens on it, and the sheet with no region is not drawn. Returns the walk, the injury live.
 */
export function hurtWalk(P: Phone, T: ChangeTally, what: string, region = 'knee', tier: 'workaround' | 'protect' = 'workaround'): TwoChanges {
  const two = new TwoChanges(phoneAfter(P, 0), T, what);
  two.week();
  two.hurt();
  const live = two.draft.injRegion !== null;
  if (live) two.note('Hurt? opened on a live injury');
  else {
    assert.equal(two.view!.injury!.action, null, what + ': no button before a region is picked');
    assert.equal(two.force('injury').toast, 'Pick a region', what);
  }
  for (const r of ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle', 'calf']) { two.set('injRegion', r); two.set('injTier', 'protect'); two.set('injTier', 'workaround'); }
  two.set('injRegion', 'other');
  assert.equal(two.force('injury').toast, 'Pick a region', what + ': a region the app does not train around is refused behind the button');
  assert.equal(two.foot(), true, what + ': Got it closes');
  two.hurt();
  assert.equal(two.draft.injRegion === null, !live, what + ': Hurt? opens with no region while none is live');
  two.set('injRegion', region);
  two.set('from', dayOf(two.now, 4000));
  assert.equal(two.foot(), false, what + ': a From past the program is refused');
  two.set('from', '');
  two.back();
  // A blank From is today: applied on a phone of its own, the stored change starts today.
  const blank = new TwoChanges(phoneAfter(P, 0, 3), T, what + ', a blank From');
  blank.hurt(); blank.set('injRegion', region); blank.set('from', '');
  assert.equal(blank.foot(), true, what + ': a blank From is applied');
  assert.equal(blank.prog.overlays![blank.prog.overlays!.length - 1]!.from, dayOf(blank.now, 0), what + ': and starts today');
  blank.note('applied: a blank From is today');
  two.hurt();
  two.set('injRegion', region);
  two.set('injTier', tier);
  assert.equal(two.foot(), true, what + ': Apply change closes');
  two.week();
  return two;
}

/**
 * Traveling? drawn on each gear and each span and applied once: the dates it opens on, Full gym (Got it, and the
 * guard behind Apply), Through before From carried, one day, a long trip, a blank Through (onward) and a blank From
 * refused, a Through before From refused behind the box, a span outside the program refused, then the trip applied.
 */
export function travelWalk(P: Phone, T: ChangeTally, what: string, gear = 'home_basic', from = 1, days = 5): TwoChanges {
  const two = new TwoChanges(phoneAfter(P, 0), T, what);
  two.travel();
  assert.equal(two.draft.equipment, 'home_basic', what + ': Traveling? opens on Mini gym');
  two.set('equipment', 'commercial');
  assert.equal(two.force('travel').closed, true, what + ': Apply change on a full gym only closes');
  assert.deepStrictEqual(two.wrote, [], what + ': a full gym stores nothing');
  two.travel();
  two.set('equipment', 'commercial');
  assert.equal(two.foot(), true, what + ': Got it closes');
  two.travel();
  two.set('equipment', 'bodyweight');
  two.set('to', two.draft.from!);
  two.set('from', dayOf(two.now, 3));
  assert.equal(two.draft.to, dayOf(two.now, 16), what + ': a From past Through carries Through thirteen days on');
  two.set('to', dayOf(two.now, 23));
  two.set('to', '');
  assert.equal(two.foot(), false, what + ': a blank Through is refused');
  two.set('from', '');
  assert.equal(two.foot(), false, what + ': two blank dates are refused');
  two.set('from', dayOf(two.now, 3));
  two.set('to', dayOf(two.now, 1));
  assert.equal(two.foot(), false, what + ': a Through before From is refused');
  two.set('from', dayOf(two.now, 4000)); two.set('to', dayOf(two.now, 4003));
  assert.equal(two.foot(), false, what + ': a span past the program is refused');
  two.set('from', dayOf(two.now, 3)); two.set('to', dayOf(two.now, 4000));
  two.back();
  two.travel();
  assert.equal(two.draft.from, dayOf(two.now, 3), what + ': Traveling? opens on the dates it last held');
  two.set('equipment', gear);
  two.set('from', dayOf(two.now, from));
  two.set('to', dayOf(two.now, from + days - 1));
  assert.equal(two.foot(), true, what + ': Apply change closes');
  two.week();
  return two;
}

/**
 * A whole injury: flagged, the chip, the check in two weeks on with each answer, I'm back and the return week's
 * chips, then each chip's ✕. `days` is how long the injury runs before I'm back. Returns how many chips I'm back left.
 */
export function injuryLife(P: Phone, T: ChangeTally, what: string, region: string, tier: 'workaround' | 'protect', days = 15): number {
  let two = new TwoChanges(phoneAfter(P, 0), T, what + ', flagged');
  two.hurt(); two.set('injRegion', region); two.set('injTier', tier);
  assert.equal(two.foot(), true, what + ': applied');
  assert.ok(backChip(two), what + ': the chip offers I’m back');
  assert.equal(checkIn(two), null, what + ': no check in on the day it is set');
  two.week();
  const id = newest(two);
  if (days >= 14) {
    two = new TwoChanges(phoneAfter(two.P, 13, 0), T, what + ', thirteen days on');
    assert.equal(checkIn(two), null, what + ': no check in at thirteen days');
    two = new TwoChanges(phoneAfter(two.P, 1, 1), T, what + ', fourteen days on');
    assert.ok(checkIn(two), what + ': the check in at fourteen days');
    two.answer(id, 'same');
    assert.equal(checkIn(two), null, what + ': Same puts the check in away');
    two = new TwoChanges(phoneAfter(two.P, 14, 1), T, what + ', asked again');
    assert.ok(checkIn(two), what + ': the check in two weeks after Same');
    two.answer(id, 'worse');
    assert.equal(checkIn(two), null, what + ': Worse puts the check in away');
    two = new TwoChanges(phoneAfter(two.P, 14, 1), T, what + ', asked a third time');
    two.answer(id, 'better');
    assert.ok(checkIn(two), what + ': the check in stays until Better\'s pop-up is answered');
    two.popAct(1);
    assert.equal(checkIn(two), null, what + ': More time puts the check in away');
    two = new TwoChanges(phoneAfter(two.P, days - 13 - 1 - 14 - 14 > 0 ? days - 42 : 1, 1), T, what + ', the day back');
  } else two = new TwoChanges(phoneAfter(two.P, days, 1), T, what + ', the day back');
  two.week();
  two.imBack(id);
  const left = two.chips.length;
  assert.ok(left === 1 || left === 2, what + ': I’m back leaves the return week, and the week after where running stopped');
  two.week();
  // The week after the return week still offers I'm back (carried as today's): tapped a week on, in that week, it
  // leaves a second return week after the first, and the pace clock counts both.
  const again = backChip(two);
  if (again) { const next = new TwoChanges(phoneAfter(two.P, 7, 2), T, what + ', I’m back on the week after'); next.imBack(again.id); next.week(); next.note('I’m back on the week after a return week'); }
  for (const c of two.chips.slice()) if (c.kind === 'chip' && two.chips.some((x) => x.id === c.id)) { two = new TwoChanges(phoneAfter(two.P, 0, 1), T, what + ', removed'); two.remove(c.id); }
  assert.equal(two.chips.length, 0, what + ': every chip removed');
  two.week();
  return left;
}

/** Better's pop-up answered I'm back: the check in's other way out. */
export function betterBackWalk(P: Phone, T: ChangeTally, what: string, region: string): void {
  let two = new TwoChanges(phoneAfter(P, 0), T, what + ', flagged');
  two.hurt(); two.set('injRegion', region);
  assert.equal(two.foot(), true);
  const id = newest(two);
  two = new TwoChanges(phoneAfter(two.P, 15, 1), T, what + ', fifteen days on');
  assert.ok(checkIn(two), what + ': the check in at fifteen days');
  two.answer(id, 'better');
  two.popAct(0);
  assert.equal(checkIn(two), null, what + ': I’m back ends the check in');
  assert.equal(backChip(two) !== null, two.chips.length === 2, what + ': the week after the return week alone still offers I’m back');
  two.week();
}

/** Hurt? applied again with an injury live: today's stores a second one, and Hurt? opens on the first. */
export function secondInjuryWalk(P: Phone, T: ChangeTally, what: string): void {
  let two = new TwoChanges(phoneAfter(P, 0), T, what + ', the first');
  two.hurt(); two.set('injRegion', 'shoulder'); two.set('injTier', 'protect');
  assert.equal(two.foot(), true);
  two = new TwoChanges(phoneAfter(two.P, 0, 1), T, what + ', the second');
  two.hurt();
  assert.deepStrictEqual([two.draft.injRegion, two.draft.injTier], ['shoulder', 'protect'], what + ': Hurt? opens on the live injury');
  two.set('injRegion', 'hip'); two.set('injTier', 'workaround');
  assert.equal(two.foot(), true);
  assert.equal(two.chips.filter((c) => c.kind === 'chip').length, 2, what + ': two injuries, two chips');
  two.week();
  // Changes stored in one launch share an id (the page's clock is pinned for a launch): the ✕ of one takes each of
  // them, on today's page and here. The hip above, this trip and this elbow are of one instant.
  two.travel(); two.set('from', dayOf(two.now, 1)); two.set('to', dayOf(two.now, 1));
  assert.equal(two.foot(), true);
  two.hurt(); two.set('injRegion', 'elbow');
  assert.equal(two.foot(), true);
  assert.equal(two.chips.length, 4, what + ': four chips, three of one instant');
  two.remove(newest(two));
  assert.equal(two.chips.length, 1, what + ': the three changes of one instant leave together, the first injury stays');
  two.note('changes of one instant removed together');
}

/** Trips of every span grammar, each on a phone of its own: a whole week, two whole weeks, one day, days in a month, days across two, and the three gears. */
export function spansWalk(P: Phone, T: ChangeTally, what: string): void {
  const base = new TwoChanges(phoneAfter(P, 0), T, what + ', the spans');
  const today = new Date(base.now); today.setHours(12, 0, 0, 0);
  const toMonday = (8 - today.getDay()) % 7 || 7;
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12).getTime();
  const lastDay = Math.round((monthEnd - today.getTime()) / 86400000);
  const trips: [string, number, number, string][] = [
    ['a whole week', toMonday, 7, 'home_basic'], ['two whole weeks', toMonday, 14, 'bodyweight'], ['one day', 2, 1, 'home_basic'],
    ['days across two months', lastDay - 1, 4, 'bodyweight'], ['days in one month', lastDay + 2, 3, 'home_basic'],
  ];
  let P1 = base.P;
  for (const [name, from, days, gear] of trips) {
    const two = new TwoChanges(phoneAfter(P1, 0, 1), T, what + ', ' + name);
    two.travel();
    two.set('equipment', gear);
    two.set('from', dayOf(two.now, from)); two.set('to', dayOf(two.now, from + days - 1));
    if (two.foot()) { two.week(); two.remove(newest(two)); }
    P1 = two.P;
  }
}

/** This Week's row: the date it shows set again, a week on, a week back, a blank box; and for a start date a Monday and a midweek day. */
export function datesWalk(P: Phone, T: ChangeTally, what: string): 'race' | 'start' {
  const two = new TwoChanges(phoneAfter(P, 0), T, what);
  const row = two.week().row;
  const which = row.kind === 'race' ? 'race' : 'start';
  assert.equal(two.date(which, ''), null, what + ': a blank box does nothing');
  const cur = row.iso || dayOf(two.now, 0);
  const d = new Date(cur + 'T12:00:00').getTime();
  two.date(which, cur);
  two.week();
  for (const days of [7, -7, 3, 0]) { two.date(which, dayOf(d, days)); two.week(); }
  if (which === 'start') {
    // The week holding today: its Monday, then each day of it, so a short first week with no training day left moves on.
    const mon = new Date(two.now); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) two.date('start', dayOf(mon.getTime(), i));
    two.week();
    two.date('start', cur);
  }
  return which;
}

/**
 * The changes a phone already holds, each on a phone of its own: Hurt? opened (on the live injury when there is
 * one), I'm back on each chip that offers it, and each chip's ✕. Returns how many chips the launch drew.
 */
export function storedWalk(P: Phone, T: ChangeTally, what: string): number {
  const base = new TwoChanges(phoneAfter(P, 0), T, what);
  base.week();
  base.hurt();
  base.back();
  base.travel();
  base.back();
  const chips = base.chips.filter((c): c is ChangeChip => c.kind === 'chip');
  for (const c of chips) {
    if (c.back) { const two = new TwoChanges(phoneAfter(P, 0, 1), T, what + ', I’m back on ' + c.title); two.imBack(c.id); two.week(); }
    const two = new TwoChanges(phoneAfter(P, 0, 1), T, what + ', ✕ on ' + c.title);
    two.remove(c.id);
    two.week();
  }
  return chips.length;
}

/**
 * Changes no tap of today's app stores, laid in the stored program of both apps and read at a launch: the kinds of
 * chip the page can draw from them (Less time, Suspended, a kind and a gear it has no name for, a trip with no end,
 * an injury in a region it has no name for and its check in, each gear's name), and the ones it hides (ended,
 * outside the program, no start). Then the taps the page offers on them. Returns how many chips the launch drew.
 */
export function strangeWalk(P: Phone, T: ChangeTally, what: string): number {
  P.settle();
  const at = launchNow(P), now = at.getTime(), day = 86400000;
  const keys = P.dump();
  const id: string = P.ev('activeProgId');
  const progs = JSON.parse(keys['ia_programs']!) as { id: string; overlays?: unknown[] }[];
  const p = progs.find((x) => x.id === id)!;
  const ov = (oid: string, type: string, from: number | null, to: number | null, patch: unknown, created = now): unknown =>
    ({ id: oid, type, from: from === null ? null : dayOf(now, from), to: to === null ? null : dayOf(now, to), patch, note: '', created });
  p.overlays = (p.overlays || []).concat([
    ov('s_reduce', 'reduce', 0, 2, {}), ov('s_suspend', 'suspend', 1, null, {}), ov('s_open', 'substitute', 0, null, { equipment: 'crossfit' }),
    ov('s_kind', 'pause', 1, 2, { equipment: 'kettlebells' }), ov('s_neck', 'injury', -20, null, { injury: { region: 'neck', tier: 'protect' } }, now - 20 * day),
    ov('s_ended', 'substitute', -9, -1, { equipment: 'bodyweight' }), ov('s_far', 'substitute', 4000, 4002, { equipment: 'bodyweight' }), ov('s_nofrom', 'substitute', null, 3, { equipment: 'home_full' }),
    ov('s_full', 'substitute', 2, 3, { equipment: 'home_full' }), ov('s_min', 'substitute', 3, 4, { equipment: 'minimal' }), ov('s_gym', 'substitute', 4, 5, { equipment: 'commercial' }),
  ]);
  const laid = (): Phone => {
    const Q = new Phone();
    for (const [k, v] of Object.entries(keys)) Q.damage(k, k === 'ia_programs' ? J(progs) : v);
    Q.launch(iso(at));
    Q.settle();
    return Q;
  };
  const base = new TwoChanges(laid(), T, what);
  base.week();
  const drawn = base.chips.filter((c) => c.kind === 'chip').length;
  assert.ok(checkIn(base), what + ': the check in of an injury in a region with no name');
  let two = new TwoChanges(laid(), T, what + ', the check in answered');
  two.answer('s_neck', 'worse');
  two = new TwoChanges(laid(), T, what + ', I’m back from a region with no name');
  two.imBack('s_neck');
  two.week();
  two = new TwoChanges(laid(), T, what + ', I’m back asked of a trip');
  two.imBack('s_open');
  assert.equal(two.said, 'Change removed ✓', what + ': I’m back on a change that is no injury only removes it');
  two = new TwoChanges(laid(), T, what + ', each removed');
  for (const c of ['s_reduce', 's_suspend', 's_open', 's_kind', 's_ended', 's_nofrom']) two.remove(c);
  two.week();
  return drawn;
}

/**
 * A stored program with no start date, which no tap of today's app leaves: the row reads Set date, and a date
 * picked there is its start. Returns whether the launch left the row unset (it may give the program a start).
 */
export function noStartWalk(P: Phone, T: ChangeTally, what: string): boolean {
  P.settle();
  const at = launchNow(P);
  const keys = P.dump();
  const id: string = P.ev('activeProgId');
  const progs = JSON.parse(keys['ia_programs']!) as { id: string; startDate?: string }[];
  delete progs.find((x) => x.id === id)!.startDate;
  const Q = new Phone();
  for (const [k, v] of Object.entries(keys)) Q.damage(k, k === 'ia_programs' ? J(progs) : v);
  Q.launch(iso(at));
  Q.settle();
  const two = new TwoChanges(Q, T, what);
  const row = two.week().row;
  if (row.kind !== 'start' || row.shown) return false;
  assert.equal(two.date('start', ''), null, what + ': a blank box does nothing');
  two.date('start', dayOf(two.now, 0));
  assert.equal(two.week().row.kind, 'start');
  return true;
}
