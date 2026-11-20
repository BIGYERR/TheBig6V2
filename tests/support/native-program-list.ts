// The Programs tab, the Expo app's against today's page (MIGRATION.md phase 3, row 5). Two apps over one stored
// state: the page in the VM harness (a Phone), its list, goal sheet and mile pencil drawn through the Angular
// screens' own models handed the page's readers, as program-list.ts, goal-sheet.ts and mile-sheet.ts hand them; and
// the Expo app's views (frontends/native/src/program-list/list-screen.ts) and writers (list-writes.ts) over its own
// SQLite store. After every tap the two are held equal: every word and number of the list (each card, its meta line
// and its detail), what the page keeps between draws, the open sheet, each toast, the active program, the grid in
// hand after a switch or a rebuild, and every ia_ key, value for value.
//
// The reference is today's page on purpose, as in every native-* walker. In the app three page functions this walk
// calls are an Angular screen's (CLAUDE.md, Engineering invariants): toggleProgCard is the list's own toggle, which
// the walk makes as that component does (the open set, then a draw); openMileSheet is the mile sheet's own open,
// made here as that component makes it (the lock judged by the model, else the draft set and the stored mile in the
// two fields); startRename ends in a focus the harness's field does not have, so the walk makes its first two steps.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type GoalDraft, type GoalSheetView, goalSheetView } from '../../frontends/app/src/app/screens/goal-sheet/goal-sheet-model.ts';
import { mileField, mileLockFacts, mileLocked } from '../../frontends/app/src/app/screens/mile-sheet/mile-sheet-model.ts';
import { programDetail } from '../../frontends/app/src/app/screens/program-list/program-detail-model.ts';
import { programList } from '../../frontends/app/src/app/screens/program-list/program-list-model.ts';
import {
  type ListState, type ListView, type MileOpen, activeId, askArchive, askPurge, cancelConfirm, endRename, goalView, listView, markupLines, newListState,
  openGoal, openMile, selectGoal, startRename, tabRefused, toggleCard, typeGoal,
} from '../../frontends/native/src/program-list/list-screen.ts';
import { type Outcome, archiveProgram, commitGoalChange, commitMileChange, deleteProgram, renameProgram, setActive } from '../../frontends/native/src/program-list/list-writes.ts';
import type { ScreenProgram } from '../../frontends/native/src/this-week/week-screen.ts';
import { iso } from './native-deck-swap.ts';
import { launchNow } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(J(x)) as T;
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));

/** What the walks compared so far, by kind: each is a thing the screens can draw or a write they can make. */
export type ListTally = Record<string, number>;
export const listTally = (): ListTally => ({});

/** The list as the Angular ProgramList reads it from the page. */
function pageList(P: Phone): ListView {
  const call = (name: string, ...a: unknown[]): any => (P.ev(name) as (...x: unknown[]) => unknown)(...a);
  const all = call('getPrograms') as any[];
  const v = programList(all, { activeId: call('getActiveProgId'), openIds: P.ev('openProgIds'), editId: P.ev('editProgId'), confirmId: P.ev('confirmProgId'), confirmTier: P.ev('confirmTier') }, (k, s) => call('asyIcon', k, s));
  return plain({
    empty: v.empty,
    cards: v.cards.map((c) => {
      const p = all.find((x) => x.id === c.id);
      const s = call('progSelData', p);
      const paces = s.runAnchor ? { chips: call('runAnchorChips', s.runAnchor), sentence: call('runAnchorSentence', s.runAnchor) } : null;
      return { ...c, detail: programDetail(p.id, s, { dayNames: P.ev('_DAYF'), goalLabels: P.ev('_GOAL_LABELS') }, paces) };
    }),
  }) as ListView;
}

/** The goal sheet as the Angular GoalSheet draws it from the page's draft, and whether its switch takes a tap. */
function pageGoal(P: Phone): { view: GoalSheetView; ok: boolean } | null {
  const draft = plain(P.ev('_goalDraft')) as GoalDraft;
  const p = (P.ev('getPrograms()') as any[]).find((x) => x.id === draft.progId);
  if (!p) return null;
  const sport = draft.sport || '';
  const week: number = (P.ev('_goalCurWeek') as (x: unknown) => number)(p);
  const view = goalSheetView({
    draft, sportLabel: (P.ev('_CARDIO_LABELS') as Record<string, string>)[sport] || sport, current: (p.cfg && p.cfg.cardioGoals && p.cfg.cardioGoals[sport]) || null,
    path: p.cfg && p.cfg.primaryPath, choices: P.ev('CARDIO_GOALS_BY_TYPE')[sport] || [], excluded: P.ev('HYBRID_EXCLUDED_GOALS'), rank: P.ev('_GOAL_RANK'), needsInputs: P.ev('_GOAL_REQ_INPUTS'),
    started: !!p.startDate && week > 1, week,
  });
  return plain({ view, ok: !!P.ev('_goalInputsValid()') });
}

/** The mile pencil's tap as the Angular MileSheet makes it on the page: the lock's facts, or the draft set and the stored mile. */
function pageMile(P: Phone, progId: string): MileOpen | null {
  const p = (P.ev('getPrograms()') as any[]).find((x) => x.id === progId);
  if (!p) return null;
  const tw = p.totalWeeks || 6;
  const week: number = (P.ev('_goalCurWeek') as (x: unknown) => number)(p);
  if (mileLocked(week, tw)) {
    return plain({ kind: 'lock', facts: mileLockFacts(p.cfg?.raceDate, week, tw, {
      countdown: (iso) => (P.ev('raceCountdown') as (x: string) => any)(iso), words: (cd) => (P.ev('raceCountdownWords') as (x: unknown) => any)(cd), day: (iso) => (P.ev('_fmtStartDay') as (x: string, y: boolean) => string)(iso, true),
    }) }) as MileOpen;
  }
  const g = p.cfg?.cardioGoals?.run || {};
  P.IA.ctx['__mileDraft'] = { progId };
  P.ev('_mileDraft=__mileDraft');
  return { kind: 'edit', progId, mins: mileField(g.mileBestMins), secs: mileField(g.mileBestSecs) };
}

/** Both apps on the Programs tab over one stored state. */
export class TwoLists {
  readonly P: Phone;
  readonly store: StateStore;
  readonly st: ListState = newListState();
  readonly T: ListTally;
  readonly what: string;
  view!: ListView;
  /** The goal sheet open in the beta, its draft; and the mile pencil's sheet. */
  goal: GoalDraft | null = null;
  mile: MileOpen | null = null;
  /** The keys the last tap changed in the beta's store (the page's own are held equal to them). */
  wrote: string[] = [];
  /** The program the last switch or rebuild handed back in the beta, or undefined when it made none. */
  prog: ScreenProgram | null | undefined;
  private readonly now: number;
  private readonly failures: string[] = [];
  private readonly failed = { overlay: (): void => { this.failures.push('overlay'); }, freeze: (): void => { this.failures.push('freeze'); }, rebuild: (): void => { this.failures.push('rebuild'); } };

  /** `P` is a phone just launched; the beta's store takes its keys as that launch left them. */
  constructor(P: Phone, T: ListTally, what: string) {
    this.P = P; this.T = T; this.what = what;
    this.store = sqliteTestStore();
    // What the launch queued (the day-after reminder, 600 ms on) is the launch's own, in both apps: it runs first.
    P.settle();
    for (const [k, v] of Object.entries(P.dump())) this.store.set(k, v);
    this.now = P.ev('Date.now()') as number;
    this.tap('the Programs tab', "tabGo('screenHome')", () => null);
  }

  private n(k: string, by = 1): void { this.T[k] = (this.T[k] || 0) + by; }

  /** One tap on both, then everything equal. `page` is today's call; `native` makes the same tap and hands back its toast. */
  private tap(name: string, page: string, native: () => string | null | Outcome): ListView {
    const what = this.what + ', ' + name;
    this.P.settle();
    const t0 = this.P.toasts.length;
    const pre = held(this.store);
    this.P.ev(page); this.P.settle();
    const out = native();
    const o: Outcome = out && typeof out === 'object' ? out : { toast: out as string | null };
    this.prog = o.prog;
    const now = new Date(this.now);
    const view = plain(listView(this.store, this.st, now));
    assert.deepStrictEqual(view, pageList(this.P), what + ': the list is not today\'s');
    assert.deepStrictEqual([[...this.st.openIds].sort(), this.st.editId, this.st.confirmId, this.st.confirmTier],
      [[...(this.P.ev('openProgIds') as Set<string>)].sort(), this.P.ev('editProgId'), this.P.ev('confirmProgId'), this.P.ev('confirmTier')], what + ': what is kept between draws is not today\'s');
    assert.deepStrictEqual(o.toast ? [o.toast] : [], this.P.toasts.slice(t0), what + ': the toast is not today\'s');
    const mine = held(this.store), theirs = this.P.dump();
    assert.deepStrictEqual(mine, theirs, what + ': the store is not today\'s, key for key');
    assert.equal(activeId(this.store), this.P.ev('activeProgId'), what + ': the active program is not today\'s');
    if (o.prog !== undefined) {
      const live = this.P.prog;
      assert.equal(o.prog ? o.prog.id : null, live ? live.id : null, what + ': the program in hand is not today\'s');
      if (o.prog) assert.equal(J(o.prog.weeks), J(live.weeks), what + ': the grid in hand is not today\'s');
      this.n(o.prog ? 'a program in hand compared' : 'no program left in hand');
    }
    assert.deepStrictEqual(this.failures, [], what + ': a part of a rebuild failed');
    if (this.goal) assert.deepStrictEqual(plain(goalView(this.store, this.goal, now)), pageGoal(this.P), what + ': the goal sheet is not today\'s');
    this.wrote = [...new Set([...Object.keys(pre), ...Object.keys(mine)])].filter((k) => pre[k] !== mine[k]).sort();
    this.n('taps'); this.n('keys compared', Object.keys(theirs).length);
    this.view = view;
    this.count(view);
    return view;
  }

  /** Every kind of thing a draw of the list holds, counted. */
  private count(v: ListView): void {
    this.n('draws');
    if (v.empty) this.n('empty: ' + v.empty);
    for (const c of v.cards) {
      this.n('card');
      this.n(c.isActive ? 'card: active' : 'card: not active');
      if (/ open$/.test(c.cardClass)) this.n('card: open');
      if (c.editing) this.n('card: being renamed');
      if (c.confirm) this.n('card: confirm tier ' + c.confirm);
      this.n('card: goal badge ' + (c.goalLabel || 'none'));
      const meta = markupLines(c.metaHtml);
      assert.equal(meta.length, 3, this.what + ': the meta line is three lines');
      this.n('meta icon', meta.flat().filter((r) => r.icon).length);
      this.n(/Lift only/.test(c.metaHtml) ? 'meta: Lift only' : 'meta: cardio');
      const d = c.detail;
      this.n('detail row', d.focus.length + d.profile.length + d.schedule.length);
      this.n('1RM chip', d.lifts.length);
      if (d.estimated) this.n('1RM marked est.');
      if (d.paces) {
        this.n('pace group'); this.n('pace chip', d.paces.chips.length);
        for (const ch of d.paces.chips) { this.n('pace chip ' + ch.k); if (/\/10$/.test(ch.u)) this.n('pace chip with an effort'); }
        const s = d.paces.sentence;
        const kind = /so its fastest row is used/.test(s) ? 'clamped fast' : /is not a valid time/.test(s) ? 'clamped, not a time' : /so its slowest row is used/.test(s) ? 'clamped slow'
          : /worked back from/.test(s) ? 'seeded' : /Before that it was the \w+ default/.test(s) ? 'edited from the default' : /Before that it was/.test(s) ? 'edited from a time'
          : /the time you entered\./.test(s) ? 'entered' : /No mile time was entered/.test(s) ? 'default' : 'unread';
        assert.notEqual(kind, 'unread', this.what + ': the sentence under the paces is one of the builder\'s: ' + s);
        this.n('sentence: ' + kind);
        this.n(/Week 1 runs off this row/.test(s) ? 'sentence tail: the pace goal' : /Benchmark runs prescribe no pace/.test(s) ? 'sentence tail: the base' : 'sentence tail: every pace');
        const runs = markupLines(s).flat();
        assert.ok(runs.some((r) => r.bold && / mile$/.test(r.text)), this.what + ': the mile is the sentence\'s bold run');
      } else this.n('no pace group');
      if (d.cardio) { this.n('cardio row', d.cardio.length); if (d.cardio.some((x) => x.goal === 'General fitness')) this.n('cardio row: General fitness'); } else this.n('detail: Lift only');
      if (d.event) { this.n('event group'); this.n('event row', d.event.length); if (d.event.some((r) => r.v === 'No date set')) this.n('event: No date set'); if (d.event.length > 1) this.n('event: Time out ' + (/^\d+ weeks?$/.test(d.event[1]!.v) ? 'in weeks' : /^\d+ days?$/.test(d.event[1]!.v) ? 'in days' : d.event[1]!.v)); }
      if (d.seed) this.n('seed printed');
    }
  }

  // ── The list's taps ──
  toggle(id: string): ListView { return this.tap('a card tapped', `(function(){var o=openProgIds;if(o.has(${J(id)}))o.delete(${J(id)});else o.add(${J(id)});renderProgList();})()`, () => { toggleCard(this.st, id); return null; }); }
  pencil(id: string): ListView { return this.tap('the pencil by the name', `_setEditProgId(${J(id)});renderProgList();`, () => { startRename(this.st, id); return null; }); }
  cancelRename(): ListView { return this.tap('the rename\'s X', 'cancelRename()', () => { endRename(this.st); return null; }); }
  rename(id: string, typed: string): ListView {
    this.P.type('renameInput_' + id, typed);
    const v = this.tap('Save on a rename', `commitRename(${J(id)})`, () => { const t = renameProgram(this.store, id, typed); endRename(this.st); return t; });
    this.n(this.wrote.length ? 'rename stored' : 'rename left as it was');
    return v;
  }
  askArchive(id: string): ListView { return this.tap('Archive, the first tap', `askArchive(${J(id)})`, () => { askArchive(this.st, id); return null; }); }
  askPurge(id: string): ListView { return this.tap('Delete forever…', `askPurge(${J(id)})`, () => { askPurge(this.st, id); return null; }); }
  cancel(): ListView { return this.tap('Cancel', 'cancelConfirm()', () => { cancelConfirm(this.st); return null; }); }
  setActive(id: string): ListView {
    const v = this.tap('Set Active', `setActive(${J(id)})`, () => setActive(this.store, id, this.now, this.failed));
    this.n(this.prog ? 'switch: Set Active' : 'Set Active refused');
    if (this.wrote.some((k) => k.startsWith('ia_reminded_'))) this.n('switch: past days marked as asked');
    return v;
  }
  archive(id: string): ListView {
    const v = this.tap('Archive', `archiveProg(${J(id)})`, () => { const o = archiveProgram(this.store, id, activeId(this.store), this.now, this.failed); cancelConfirm(this.st); return o ? o : null; });
    this.n(this.prog === undefined ? 'archive: not the active program' : this.prog ? 'archive: the active one hands on' : 'archive: the last one, no active program left');
    return v;
  }
  deleteForever(id: string): ListView {
    const before = this.store.keys().filter((k) => k.endsWith(id)).length;
    const v = this.tap('Delete Forever', `deleteProg(${J(id)})`, () => { const o = deleteProgram(this.store, id, activeId(this.store), this.now, this.failed); cancelConfirm(this.st); return o; });
    assert.equal(this.store.keys().filter((k) => k.endsWith(id)).length, 0, this.what + ': no key of the deleted program is left');
    this.n('delete: keys removed', before);
    this.n(this.prog === undefined ? 'delete: not the active program' : this.prog ? 'delete: the active one hands on' : 'delete: the last one, no active program left');
    return v;
  }

  /** A tab of the bar tapped, then Programs again: This Week and Progress refuse with no active program. Returns whether it opened. */
  tab(to: 'week' | 'progress'): boolean {
    let opened = false;
    this.tap('the ' + to + ' tab', `tabGo(${J(to === 'week' ? 'screenWeek' : 'screenProgress')})`, () => { const t = tabRefused(this.store, to); opened = !t; return t; });
    this.n(opened ? 'tab opened' : 'tab refused: no active program');
    if (opened) this.tap('the Programs tab again', "tabGo('screenHome')", () => tabRefused(this.store, 'home'));
    return opened;
  }

  // ── The goal sheet ──
  openGoal(progId: string, sport: string): GoalSheetView {
    this.tap('a goal\'s pencil', `openGoalSheet(${J(progId)},${J(sport)})`, () => { this.goal = openGoal(this.store, progId, sport); return null; });
    assert.ok(this.goal, this.what + ': the goal sheet opened');
    const v = goalView(this.store, this.goal, new Date(this.now))!.view;
    this.n('goal sheet'); this.n('goal option', v.options.length); this.n('goal option: current', v.options.filter((o) => o.current).length); this.n('goal option: a bigger goal', v.options.filter((o) => o.up && !o.current).length);
    return v;
  }
  pickGoal(id: string): GoalSheetView {
    this.tap('a goal picked', `selectGoalOpt(${J(id)})`, () => { this.goal = selectGoal(this.goal!, id); return null; });
    const g = goalView(this.store, this.goal!, new Date(this.now))!, d = g.view.decision!;
    assert.ok(d, this.what + ': a pick draws the decision');
    this.n(d.up ? 'goal decision: a step up' : 'goal decision: a plain switch');
    this.n(d.inputs ? 'goal decision: ' + d.inputs + ' typed' : 'goal decision: nothing typed');
    this.n(/week \d+ of a bigger build|may finish mixed/.test(d.body) ? 'goal decision: started' : 'goal decision: not started');
    this.n(/^Keep current$/.test(d.keepLabel) ? 'goal decision: Keep current' : d.up ? 'goal decision: Stay the course' : 'goal decision: Keep the goal by name');
    this.n(g.ok ? 'goal switch ready' : 'goal switch greyed');
    return g.view;
  }
  typeGoal(key: 'targetDist' | 'paceUnit' | 'targetMins' | 'targetSecs', value: string): boolean {
    this.tap('a target typed', `_goalSetInput(${J(key)},${J(value)})`, () => { this.goal = typeGoal(this.goal!, key, value); return null; });
    return goalView(this.store, this.goal!, new Date(this.now))!.ok;
  }
  /** Make the switch (or Switch anyway). Returns whether it switched. */
  commitGoal(): boolean {
    let done = false;
    this.tap('Make the switch', 'commitGoalChange()', () => {
      const o = commitGoalChange(this.store, this.goal!, activeId(this.store), this.now, this.failed);
      if (!o) return null;
      done = true; this.goal = null;
      return o;
    });
    this.n(done ? (this.prog ? 'goal switched: rebuilt' : 'goal switched: stored alone') : 'goal switch: the tap did nothing');
    return done;
  }
  closeGoal(): void { this.tap('the goal sheet closed', 'closeGoalSheet()', () => { this.goal = null; return null; }); }

  // ── The mile pencil ──
  openMile(progId: string): MileOpen | null {
    let theirs: MileOpen | null = null;
    this.tap('the mile\'s pencil', 'void 0', () => { this.mile = openMile(this.store, progId, new Date(this.now)); return null; });
    theirs = pageMile(this.P, progId);
    assert.deepStrictEqual(plain(this.mile), theirs, this.what + ': the mile pencil\'s sheet is not today\'s');
    if (this.mile && this.mile.kind === 'lock') { this.n('mile: the lock'); this.n('mile lock fact', this.mile.facts.length); this.n(this.mile.facts.length > 1 ? 'mile lock: with the race' : 'mile lock: the week alone'); if (this.mile.facts[0] && this.mile.facts[0].k === 'Days out') this.n(/^\d+$/.test(this.mile.facts[0].v) ? 'mile lock: days out as a number' : 'mile lock: days out in words'); }
    if (this.mile && this.mile.kind === 'edit') { this.n('mile: the edit sheet'); this.n(this.mile.mins === '' ? 'mile fields: empty' : 'mile fields: the stored mile'); }
    return this.mile;
  }
  /** Update my mile, the two fields as typed. Returns whether it saved. */
  commitMile(mins: string, secs: string): boolean {
    assert.ok(this.mile && this.mile.kind === 'edit', this.what + ': the edit sheet is open');
    const progId = (this.mile as { progId: string }).progId;
    this.P.type('mileSheetMins', mins); this.P.type('mileSheetSecs', secs);
    let saved = false, adv = false, toast: string | null = null;
    this.tap('Update my mile', 'commitMileChange()', () => {
      const o = commitMileChange(this.store, progId, mins, secs, activeId(this.store), this.now, this.failed);
      saved = o.saved; toast = o.toast; adv = !!o.toast && /chart/.test(o.toast);
      if (saved) this.mile = null;
      return saved ? o : o.toast;
    });
    this.n(saved ? (this.prog ? 'mile saved: rebuilt' : 'mile saved: stored alone') : 'mile refused: ' + toast);
    if (saved && adv) this.n('mile saved with the chart\'s advice');
    return saved;
  }
  closeMile(): void { this.tap('the mile sheet closed', 'closeMileSheet()', () => { this.mile = null; return null; }); }
}

// ── The walks ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The program the last tap handed back, read through a call (an assertion on the field itself would narrow it for the rest of a walk). */
const handed = (two: TwoLists): ScreenProgram | null | undefined => two.prog;

/** A phone holding another's keys, launched at the same instant, or `days` later. */
export function twinAt(P: Phone, days = 0): Phone {
  const Q = new Phone();
  for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
  return Q.launch(iso(new Date(launchNow(P).getTime() + days * 86400000)));
}

/** A phone holding another's keys, launched at a local date and time. */
export function twinOn(P: Phone, at: string): Phone {
  const Q = new Phone();
  for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
  return Q.launch(at);
}

/** The list with one program: the tab, the card opened and shut, the rename (cancelled, saved, saved unchanged, saved blank), the two confirm tiers and Cancel. */
export function listWalk(P: Phone, T: ListTally, what: string): TwoLists {
  const two = new TwoLists(twinAt(P), T, what);
  const id: string = two.P.ev('activeProgId');
  assert.equal(two.view.cards.length, 1, what + ': one card');
  two.toggle(id);
  assert.match(two.view.cards[0]!.cardClass, / open$/, what + ': the card is open');
  two.pencil(id);
  assert.equal(two.view.cards[0]!.editing, true);
  two.cancelRename();
  two.pencil(id);
  const name = two.view.cards[0]!.nameValue;
  two.rename(id, '  ' + name + ', renamed, and a tail that runs well past the forty characters a name may hold  ');
  assert.equal(two.view.cards[0]!.nameValue.length, 40, what + ': a name is cut to forty');
  two.pencil(id);
  two.rename(id, two.view.cards[0]!.nameValue);
  two.pencil(id);
  two.rename(id, '   ');
  two.toggle(id);
  two.askArchive(id);
  assert.equal(two.view.cards[0]!.confirm, 1);
  two.askPurge(id);
  assert.equal(two.view.cards[0]!.confirm, 2);
  two.cancel();
  assert.equal(two.view.cards[0]!.confirm, 0);
  return two;
}

const TARGETS: Record<string, [('targetDist' | 'paceUnit' | 'targetMins' | 'targetSecs'), string][]> = {
  pace: [['targetMins', '12'], ['targetDist', '1.5'], ['paceUnit', 'km'], ['paceUnit', 'mi'], ['targetSecs', '0']],
  time: [['targetSecs', '30'], ['targetMins', '9']],
};
/**
 * The goal sheet on every sport of the phone's program: opened, then every option but the current one switched to
 * on a phone of its own, its targets typed one at a time where it needs them (the switch does nothing until they
 * stand); the first option of each sheet is also picked and let go (Keep). Returns how many switches.
 */
export function goalWalk(P: Phone, T: ListTally, what: string): number {
  const id: string = P.ev('activeProgId');
  const sports: string[] = JSON.parse(P.ev('JSON.stringify((activeProg.cfg&&activeProg.cfg.cardioTypes)||[])'));
  let switches = 0;
  for (const sport of sports) {
    const first = new TwoLists(twinAt(P), T, what + ', ' + sport);
    first.toggle(id);
    const v0 = first.openGoal(id, sport);
    const picks = v0.options.filter((o) => !o.current);
    if (picks[0]) { first.pickGoal(picks[0].id); first.closeGoal(); }
    for (const o of picks) {
      const two = new TwoLists(twinAt(P), T, what + ', ' + sport + ' to ' + o.id);
      two.openGoal(id, sport);
      const v = two.pickGoal(o.id);
      const need = v.decision!.inputs;
      if (need) {
        assert.equal(two.commitGoal(), false, what + ': a switch with its target missing does nothing');
        const steps = TARGETS[need]!;
        steps.forEach(([k, val], i) => { const ok = two.typeGoal(k, val); if (i === 0) assert.equal(ok, need === 'time', what + ': a time alone readies a swim goal, never the pace goal'); });
      }
      assert.equal(two.commitGoal(), true, what + ': the switch to ' + o.id);
      assert.ok(two.prog, what + ': a switch on the active program hands back the rebuilt program');
      assert.deepEqual(two.wrote, ['ia_programs'], what + ': a switch writes the program list alone');
      switches++;
    }
  }
  return switches;
}

/**
 * The mile pencil on the phone's program: the tap (the lock, or the edit sheet), and where it edits: each refusal
 * (a field blank, not a time, under 3:00, over 25:00), then a mile saved, then on phones of their own a mile the
 * chart clamps fast and one it clamps slow, and the pencil tapped again on the saved mile. Returns what the tap opened.
 */
export function mileWalk(P: Phone, T: ListTally, what: string): 'lock' | 'edit' | 'none' {
  const id: string = P.ev('activeProgId');
  const two = new TwoLists(twinAt(P), T, what);
  if (!two.view.cards[0]!.detail.paces) return 'none';
  const m = two.openMile(id);
  if (!m || m.kind === 'lock') { two.closeMile(); return 'lock'; }
  for (const [mm, ss] of [['', '30'], ['9', ''], ['9', '75'], ['2', '30'], ['26', '0']] as const) assert.equal(two.commitMile(mm, ss), false, what + ': ' + mm + ':' + ss + ' is refused');
  assert.equal(two.commitMile(' 9', '5 '), true, what + ': a mile saved');
  assert.deepEqual(two.wrote, ['ia_programs']);
  assert.ok(two.prog, what + ': a new mile on the active program hands back the rebuilt program');
  const again = two.openMile(id);
  assert.deepEqual(again, { kind: 'edit', progId: id, mins: '9', secs: '5' }, what + ': the pencil opens on the mile just saved');
  two.closeMile();
  for (const [mm, ss] of [['4', '30'], ['13', '0']] as const) {
    const t = new TwoLists(twinAt(P), T, what + ', ' + mm + ':' + ss);
    t.openMile(id);
    assert.equal(t.commitMile(mm, ss), true, what + ': a mile outside the chart is saved, and told what the chart does');
  }
  return 'edit';
}

/**
 * A second program beside the phone's own, made the wizard's way a day later (it is left active): the goal and the
 * mile of the program that is not active (stored alone); Set Active on the first; then on phones of their own:
 * Archive of the one not active and then of the other, Archive of the active one (the other takes over), and Delete
 * Forever the same ways, down to the two empty lists.
 */
export function twoWalk(P: Phone, second: unknown, T: ListTally, what: string): TwoLists {
  const Q = twinAt(P, 1);
  const first: string = Q.ev('activeProgId');
  Q.generate(second as never);
  const other: string = Q.ev('activeProgId');
  assert.notEqual(other, first, what + ': a second program was made');
  const fresh = (name: string): TwoLists => new TwoLists(twinAt(Q), T, what + ', ' + name);

  const two = fresh('the first set active');
  assert.equal(two.view.cards.length, 2, what + ': two cards');
  assert.deepEqual(two.view.cards.map((c) => c.isActive), [false, true], what + ': the wizard leaves the new program active');
  // The program that is not active: its goal and its mile are a stored edit alone.
  const sport: string = (two.P.ev('getPrograms()') as any[]).find((x) => x.id === first).cfg.cardioTypes[0];
  const opts = two.openGoal(first, sport).options.filter((o) => !o.current);
  const plainPick = opts.find((o) => !['run_pace_goal', 'swim_100_time', 'swim_500_time'].includes(o.id))!;
  two.pickGoal(plainPick.id);
  assert.equal(two.commitGoal(), true);
  assert.equal(handed(two), undefined, what + ': a goal on a program that is not active rebuilds nothing');
  if (two.view.cards[0]!.detail.paces) {
    const m = two.openMile(first);
    if (m && m.kind === 'edit') { assert.equal(two.commitMile('8', '40'), true); assert.equal(handed(two), undefined, what + ': a mile on a program that is not active rebuilds nothing'); } else two.closeMile();
  }
  assert.equal(two.tab('week'), true, what + ': This Week opens on the active program');
  assert.equal(two.tab('progress'), true);
  two.setActive(first);
  assert.ok(two.prog && two.prog.id === first, what + ': Set Active hands back the first program');
  assert.deepEqual(two.view.cards.map((c) => c.isActive), [true, false]);
  two.setActive(first);

  let t = fresh('the one not active archived');
  t.askArchive(first); t.archive(first);
  assert.equal(t.view.cards.length, 1);
  assert.equal(handed(t), undefined);
  t.setActive(first);
  assert.equal(handed(t), undefined, what + ': an archived program is not set active');
  t.archive(other);
  assert.equal(t.view.empty, 'archived', what + ': every program archived');
  assert.equal(handed(t), null);
  assert.equal(t.store.get('ia_active'), null, what + ': no active program is left');
  assert.equal(t.tab('week'), false, what + ': with every program archived This Week does not open');
  assert.equal(t.tab('progress'), false);
  t.setActive('no such program');

  t = fresh('the active one archived');
  t.askArchive(other); t.archive(other);
  assert.ok(t.prog && t.prog.id === first, what + ': the first takes over');
  assert.deepEqual(t.view.cards.map((c) => c.isActive), [true]);

  t = fresh('the one not active deleted');
  t.askArchive(first); t.askPurge(first); t.deleteForever(first);
  assert.equal(handed(t), undefined);
  assert.equal(t.view.cards.length, 1);
  t.deleteForever(other);
  assert.equal(t.view.empty, 'none', what + ': no program left');
  assert.equal(handed(t), null);

  t = fresh('the active one deleted');
  t.askArchive(other); t.askPurge(other); t.deleteForever(other);
  assert.ok(t.prog && t.prog.id === first, what + ': the first takes over');
  return two;
}
