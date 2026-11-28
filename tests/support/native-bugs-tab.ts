// The Expo app's Bugs tab against today's (tests/integration/native-bugs-tab.test.ts and the sweep of that name;
// MIGRATION.md phase 3, row 7, the second session; D261, D264, D289 and D297, docs/decisions/data-backup.md and
// docs/decisions/night-mode.md). The tab on both apps over the same keys, then the same taps made on each:
//
//   the page   today's own handlers, run on the page of a test phone (support/stored-state.ts): setTheme and what a
//              launch reads of it, saveBackup with the iOS app's share sheet stood in for, backupFileChosen,
//              backupCancel and backupLoadIt with the page's own block watched, the reload counted, and submitBug
//              over a stand-in for the form (no report is ever sent). After a load the page is launched again on
//              the keys the load left, as its reload launches it.
//   the beta   the Expo app's own reads and writes (frontends/native/src/bugs), the ones its screen calls, over its
//              own SQLite store.
//
// After every tap: the two stores hold each ia_ key equal, value for value, no family left out; the toasts raised
// are the same; the look drawn on is the same; the line under Your data and whether its question is up are the same;
// the bug report's line, its colour, its text and its button are the same.
//
// Where the two differ, by ruling, the walk says so and holds each side to it:
//   D297  the file the beta saves is today's file, key for key, under a kind and a name of its own. Today's page
//         turns that file away and keeps every key. The beta reads it as today's page reads the same file under
//         today's kind.
//   The bug report's context names the app where today's names the browser (four of its eight lines); the other
//   four, and everything else the form is sent, are the same.
//
// Nothing here writes a key itself but to seed a look, and the expected value of every comparison is today's page,
// on purpose: the page stays the reference until the cutover. The hand-typed values are in
// tests/unit/native-bugs-tab.test.ts.
import assert from 'node:assert/strict';
import { VERSION } from '@ia/core';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { BUG_STATUS } from '../../frontends/app/src/app/screens/bug-report/bug-report-model.ts';
import { BUGS_WORDS, type DataBlock, NEXT_KIND, betaContext, cancelLoad, choose, newDataBlock, readBackup, readLook } from '../../frontends/native/src/bugs/bugs-screen.ts';
import { BACKUP_TOASTS, type BugForm, firstScreen, loadIt, newBugForm, saveBackup, sendBug, setLook } from '../../frontends/native/src/bugs/bugs-writes.ts';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { currentWeek } from '../../frontends/native/src/this-week/week-readers.ts';
import { liveProgram, midnight } from '../../frontends/native/src/this-week/week-screen.ts';
import { held } from './native-deck-logging.ts';
import { iso } from './native-deck-swap.ts';
import { launchNow } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone } from './stored-state.ts';

const J = JSON.stringify;
const bump = (m: Record<string, number>, k: string, n = 1): void => { m[k] = (m[k] || 0) + n; };
const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const TODAYS_KIND = 'asylum-backup';
const TURNED_AWAY = 'That file is not an Asylum backup.';

/** What a walk compared, so a test can say each kind of tap was made and each kind of thing drawn. */
export interface BugsTally {
  looks: number; launches: number; saves: number; shareFails: number; picks: number; cancels: number; loads: number; refused: number; restarts: number;
  sends: number; crossed: number; checks: number;
  /** Each kind of thing the screen drew, counted where it was compared. */
  kinds: Record<string, number>;
  /** The keys a tap changed, by tap and family. */
  wrote: Record<string, number>;
}
export const bugsTally = (): BugsTally => ({
  looks: 0, launches: 0, saves: 0, shareFails: 0, picks: 0, cancels: 0, loads: 0, refused: 0, restarts: 0, sends: 0, crossed: 0, checks: 0, kinds: {}, wrote: {},
});

/** An element of the page, as far as submitBug reads and changes one. */
interface PageEl { value: string; textContent: string; disabled: boolean; style: Record<string, string> }
const pageEl = (text = ''): PageEl => ({ value: '', textContent: text, disabled: false, style: {} });
/** One answer of the form's stand-in: what the page's fetch and the beta's are handed back. */
export type FormAnswer = () => Promise<{ ok: boolean; json(): Promise<unknown> }>;
export const ANSWERS: Record<string, FormAnswer> = {
  sent: async () => ({ ok: true, json: async () => ({ success: true }) }),
  'no success': async () => ({ ok: true, json: async () => ({ success: false }) }),
  'not OK': async () => ({ ok: false, json: async () => ({ success: true }) }),
  'not JSON': async () => ({ ok: true, json: async () => { throw new Error('not JSON'); } }),
  'never arrives': async () => { throw new Error('offline'); },
};
/** A store that refuses its `n`th write from here on, once, as a full phone does. */
function refusing(store: StateStore, n: number): StateStore {
  let sets = 0;
  return { get: (k) => store.get(k), remove: (k) => store.remove(k), keys: () => store.keys(), set: (k, v) => { if (++sets === n) throw new Error('full'); store.set(k, v); } };
}
/** The same file under the other kind, as text. */
const underKind = (text: string, kind: string): string => J({ ...(JSON.parse(text) as object), kind });

/** The Bugs tab, open on today's page and in the Expo app, over the same keys. */
export class TwoBugs {
  /** The beta's side: the Your data block and the bug report as its screen holds them. */
  readonly block: DataBlock = newDataBlock();
  readonly form: BugForm = newBugForm();
  /** The page's side: each line its block showed, each reload, each file handed to the share sheet, its elements. */
  private readonly shown: [string, boolean][] = [];
  private readonly reloads: number[] = [];
  private readonly shared: [string, string][] = [];
  private shareFails = false;
  private readonly els: Record<string, PageEl> = { bugText: pageEl(), bugStatus: pageEl(), bugSubmit: pageEl('Send Bug Report') };

  readonly P: Phone;
  readonly store: StateStore;
  /** The program the beta's launch handed back, or none. */
  readonly grid: DeckProgram | null;
  readonly T: BugsTally;
  readonly what: string;

  constructor(P: Phone, store: StateStore, grid: DeckProgram | null, T: BugsTally, what: string) {
    this.P = P; this.store = store; this.grid = grid; this.T = T; this.what = what;
    const ctx = P.IA.ctx as Record<string, unknown>;
    // Recorded by this file's own functions: an array made inside the page is the page's realm's, and never deeply
    // equal to one made here.
    ctx['__bugs'] = { show: (m: unknown, a: unknown) => { this.shown.push([String(m), !!a]); }, reload: () => { this.reloads.push(1); } };
    P.ev('_backupShow=(function(o){return function(m,a){__bugs.show(m,a);return o.apply(this,arguments);};})(_backupShow);');
    P.ev('location.reload=function(){__bugs.reload();};');
    // The iOS app's share sheet (window.iaIsland.share): the file it is handed, then its success or its failure.
    (P.IA.window as Record<string, unknown>)['iaIsland'] = {
      share: (name: string, text: string, ok: () => void, fail: () => void) => { this.shared.push([String(name), String(text)]); (this.shareFails ? fail : ok)(); },
    };
    const doc = (P.IA.window as { document: { getElementById(id: string): unknown } }).document, base = doc.getElementById;
    doc.getElementById = (id: string) => this.els[id] ?? base(id);
    this.same('as the tab opens');
    this.sameBlock('as the tab opens');
    this.sameLook('as the tab opens');
  }

  private get now(): Date { return launchNow(this.P); }
  private get pageBlock(): [string, boolean] { return this.shown[this.shown.length - 1] || ['', false]; }
  private say(what: string): string { return this.what + ': ' + what; }

  /** Every ia_ key of the two stores, equal. */
  same(what: string): void {
    const beta = held(this.store), page = this.P.dump();
    for (const k of new Set([...Object.keys(beta), ...Object.keys(page)])) assert.equal(beta[k], page[k], this.say(what) + ': ' + k + ' differs');
    this.T.checks++;
  }
  private sameBlock(what: string): void {
    const [msg, ask] = this.pageBlock;
    assert.equal(this.block.message, msg, this.say(what) + ': the line under Your data');
    assert.equal(this.block.pending !== null, ask, this.say(what) + ': whether the question is up');
    bump(this.T.kinds, 'block: ' + (msg === '' ? 'no line' : msg.replace(/^Backup from [A-Z][a-z]+ \d+\. /, 'Backup from a day. ').replace(/^\d+ programs?\./, 'N programs.').replace(/a day\. \d+ programs?\./, 'a day. N programs.')) + (ask ? ', asked' : ''));
  }
  /** The look drawn on: the page's mark on <html> (the CSS draws from it) against the beta's read of its store. */
  private sameLook(what: string): string {
    const mark = (this.P.ev("document.documentElement.getAttribute('data-theme')") as string | null) || 'auto';
    assert.equal(readLook(this.store), mark, this.say(what) + ': the look drawn on');
    assert.equal(readLook(this.store), this.P.ev('getTheme()'), this.say(what) + ': the look the page reads');
    bump(this.T.kinds, 'look on: ' + mark);
    return mark;
  }
  private wrote(tap: string, pre: Record<string, string>): void {
    const post = this.P.dump();
    const ids = Object.keys(post).concat(Object.keys(pre));
    const changed = [...new Set(ids)].filter((k) => (pre[k] ?? null) !== (post[k] ?? null)).map((k) => k.replace(/_prog_\d+$|_\d{6,}$/, '_<id>'));
    bump(this.T.wrote, tap + ' → ' + ([...new Set(changed)].sort().join(', ') || 'nothing'));
  }

  // ── Look ──────────────────────────────────────────────────────────────────────────────────────────────────
  /** A tap on a look's button (or any other value the page's setTheme might be handed). */
  look(to: string): void {
    const pre = this.P.dump();
    this.P.ev(`setTheme(${J(to)});`);
    setLook(this.store, to);
    this.same('look ' + to);
    this.sameLook('look ' + to);
    this.wrote('look ' + (to === 'day' || to === 'night' || to === 'auto' ? to : 'another word'), pre);
    this.T.looks++;
  }
  /** What a launch reads: the key as it might be stored, put on both, then the page's applyTheme against the beta's read. */
  launchLook(stored: string | null): void {
    this.P.damage('ia_theme', stored);
    if (stored === null) this.store.remove('ia_theme'); else this.store.set('ia_theme', stored);
    this.P.ev('applyTheme();');
    this.sameLook('a launch on a stored ' + J(stored));
    this.same('a launch on a stored ' + J(stored));
    this.T.launches++;
  }

  // ── Your data ────────────────────────────────────────────────────────────────────────────────────────────
  /**
   * Save a backup on both. Hands back the two files' texts, today's and the beta's, or null when the phone holds no
   * program and each says so. The beta's file is today's but for its kind and its name (D297), and each app is then
   * shown the other's file: today's turns the beta's away, the beta reads both.
   */
  save(): { page: string; beta: string } | null {
    const pre = this.P.dump(), t0 = this.P.toasts.length, n0 = this.shared.length;
    this.shareFails = false;
    const how = this.P.ev('saveBackup()') as string;
    const mine = saveBackup(this.store, VERSION, this.now);
    this.same('Save a backup');
    assert.deepStrictEqual(this.P.dump(), pre, this.say('Save a backup stores nothing'));
    this.T.saves++;
    if (how === 'empty') {
      assert.equal(mine.how, 'empty', this.say('a save with no program'));
      assert.deepStrictEqual(this.P.toasts.slice(t0), [mine.how === 'empty' ? mine.toast : ''], this.say('the toast of a save with no program'));
      assert.equal(this.shared.length, n0, this.say('no file is handed over'));
      bump(this.T.kinds, 'save: nothing to back up');
      return null;
    }
    assert.equal(how, 'native', this.say('today\'s save goes to the share sheet'));
    assert.equal(mine.how, 'file', this.say('the beta\'s save makes a file'));
    if (mine.how !== 'file') throw new Error('unreachable');
    assert.equal(this.shared.length, n0 + 1, this.say('one file is handed over'));
    assert.deepStrictEqual(this.P.toasts.slice(t0), [], this.say('a save that works is silent'));
    const [name, text] = this.shared[n0]!;
    assert.equal(mine.name, name.replace(TODAYS_KIND, NEXT_KIND), this.say('the file\'s name is today\'s under the beta\'s kind'));
    const page = JSON.parse(text) as Record<string, unknown>, beta = JSON.parse(mine.text) as Record<string, unknown>;
    assert.equal(page['kind'], TODAYS_KIND);
    assert.equal(beta['kind'], NEXT_KIND, this.say('the beta\'s file carries its own kind'));
    assert.deepStrictEqual({ ...beta, kind: page['kind'] }, page, this.say('the beta\'s file is today\'s, whole, but for its kind'));
    assert.equal(mine.text, underKind(text, NEXT_KIND), this.say('and as text, key for key in today\'s order'));
    // Each app shown the other's file (D297).
    assert.equal(this.P.ev(`backupMessage(readBackup(${J(mine.text)}))`), TURNED_AWAY, this.say('today\'s page turns the beta\'s file away'));
    const mineRead = readBackup(mine.text), theirs = readBackup(text);
    assert.ok(mineRead.ok && theirs.ok, this.say('the beta reads its own file and today\'s'));
    if (mineRead.ok && theirs.ok) assert.deepStrictEqual(mineRead, theirs, this.say('and reads the same from each'));
    this.T.crossed++;
    bump(this.T.kinds, 'save: a file');
    return { page: text, beta: mine.text };
  }
  /** The share sheet fails: today's toast, which is the beta's word for it. */
  saveFails(): void {
    const t0 = this.P.toasts.length;
    this.shareFails = true;
    this.P.ev('saveBackup()');
    this.shareFails = false;
    assert.deepStrictEqual(this.P.toasts.slice(t0), [BACKUP_TOASTS.failed], this.say('the toast of a share that failed'));
    this.T.shareFails++;
  }

  /**
   * A file picked on both: its text, or null for one that cannot be read. `own` says the text is of the beta's kind
   * (D297): today's page turns it away and changes nothing, and the beta reads it as the page reads the same file
   * under today's kind, which the page is then handed so its block stands where the beta's does.
   */
  async pick(text: string | null, what: string, own = false): Promise<void> {
    const pre = this.P.dump();
    const hand = async (t: string | null): Promise<void> => {
      (this.P.IA.ctx as Record<string, unknown>)['__in'] = { files: [{ text: () => (t === null ? Promise.reject(new Error('unreadable')) : Promise.resolve(t)) }] };
      this.P.ev('backupFileChosen(__in)');
      await tick(); await tick();
    };
    if (own) {
      await hand(text);
      assert.deepStrictEqual(this.pageBlock, [TURNED_AWAY, false], this.say(what) + ': today\'s page turns the beta\'s file away');
      assert.deepStrictEqual(this.P.dump(), pre, this.say(what) + ': and keeps every key');
      await hand(underKind(text!, TODAYS_KIND));
      bump(this.T.kinds, 'pick: the beta\'s own kind');
    } else await hand(text);
    choose(this.block, text);
    this.sameBlock('picked, ' + what);
    this.same('picked, ' + what);
    assert.deepStrictEqual(this.P.dump(), pre, this.say('picked, ' + what + ': nothing is stored'));
    this.T.picks++;
  }
  cancel(): void {
    this.P.ev('backupCancel()');
    cancelLoad(this.block);
    this.sameBlock('Cancel');
    this.same('Cancel');
    this.T.cancels++;
  }
  /**
   * Load it on both; `refuseAt` makes each phone refuse that write, once. Says whether the app starts afresh: the
   * page reloaded, the beta asked for its start. A refusal speaks the same toast on both and leaves every key.
   */
  loadIt(what: string, refuseAt = 0): boolean {
    const pre = this.P.dump(), t0 = this.P.toasts.length, r0 = this.reloads.length;
    const ls = this.P.IA.localStorage, set = ls.setItem;
    let sets = 0;
    if (refuseAt) ls.setItem = (k: string, v: string) => { if (++sets === refuseAt) throw new Error('full'); set.call(ls, k, v); };
    this.P.ev('backupLoadIt()');
    ls.setItem = set;
    const r = loadIt(this.block, refuseAt ? refusing(this.store, refuseAt) : this.store);
    assert.equal(r.afresh, this.reloads.length === r0 + 1, this.say(what) + ': whether the app starts afresh');
    assert.deepStrictEqual(r.toast ? [r.toast] : [], this.P.toasts.slice(t0), this.say(what) + ': the toast');
    this.sameBlock(what);
    this.same(what);
    if (refuseAt) {
      assert.deepStrictEqual(this.P.dump(), pre, this.say(what) + ': a refused load keeps every key');
      assert.ok(sets >= refuseAt, this.say(what) + ': the phone was asked for write ' + refuseAt);
      this.T.refused++;
    }
    this.wrote(r.afresh ? 'Load it' : refuseAt ? 'Load it, refused' : 'Load it, nothing waiting', pre);
    this.T.loads++;
    bump(this.T.kinds, 'load: ' + (r.afresh ? 'afresh' : r.toast ? 'refused' : 'nothing waiting'));
    return r.afresh;
  }
  /**
   * The start afresh: today's page launched again on the keys the load left, at the same instant, as its reload
   * launches it; the beta's start on its own store (the tab it opens on, then This Week's launch when it opens
   * there). The same first screen, the same look, the same keys after both launches. Hands back the two, open again.
   */
  restart(what: string): TwoBugs {
    const now = this.now;
    const Q = new Phone();
    for (const [k, v] of Object.entries(this.P.dump())) Q.damage(k, v);
    Q.launch(iso(now), { init: false });
    const seen: string[] = [];
    (Q.IA.ctx as Record<string, unknown>)['__seen'] = (id: unknown) => { seen.push(String(id)); };
    Q.ev('showScreen=(function(o){return function(id){__seen(id);return o.apply(this,arguments);};})(showScreen);');
    // The page's own start reads the look as it loads; here the keys arrive after the script has run.
    Q.ev('applyTheme();init();');
    const tab = firstScreen(this.store, true);
    const grid = tab === 'week' ? liveProgram(this.store, now.getTime(), { overlay: () => {}, freeze: () => {}, rebuild: () => {} }) as unknown as DeckProgram : null;
    assert.equal({ screenWeek: 'week', screenHome: 'home' }[seen[seen.length - 1]!], tab, this.say(what) + ': the first screen after the load');
    if (tab === 'week') assert.ok(grid && grid.id === (Q.prog as { id: string }).id, this.say(what) + ': the program This Week opens on');
    else assert.ok(!Q.prog, this.say(what) + ': today\'s page holds no program');
    this.T.restarts++;
    bump(this.T.kinds, 'afresh: ' + tab);
    return new TwoBugs(Q, this.store, grid, this.T, this.what + ', after ' + what);
  }

  // ── The bug report ────────────────────────────────────────────────────────────────────────────────────────
  /**
   * Send on both, the form stood in for by `answer` (none is asked when nothing is typed). The same line in the same
   * colour, the same text left in the field, the same toast, the same wait while it is out, and the same request but
   * for the four context lines that name the app.
   */
  async send(typed: string, answer: string): Promise<void> {
    const what = 'Send, ' + J(typed) + ', ' + answer;
    const reply = ANSWERS[answer]!;
    const pre = this.P.dump(), t0 = this.P.toasts.length;
    const asked: { body: Record<string, string>; url: string; init: { method: string; headers: Record<string, string> }; waiting: string }[] = [];
    const el = this.els;
    el['bugText']!.value = typed;
    (this.P.IA.ctx as Record<string, unknown>)['fetch'] = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
      asked.push({ url, init, body: JSON.parse(init.body) as Record<string, string>, waiting: J([el['bugSubmit']!.textContent, el['bugSubmit']!.disabled, el['bugSubmit']!.style['opacity'], el['bugStatus']!.textContent, el['bugStatus']!.style['color']]) });
      return reply();
    };
    await (this.P.ev('submitBug()') as Promise<void>);
    await tick();

    const mine: typeof asked = [];
    this.form.text = typed;
    const form = this.form, week = this.grid ? currentWeek(this.grid as never, midnight(this.now)) : 1;
    const toast = await sendBug(form,
      () => betaContext({ version: VERSION, time: 'T', os: '26.0', engine: 'Hermes', swift: 'Swift answers.', width: 402, height: 874, program: this.grid as { name?: string; goal?: string; id?: string } | null, week }),
      (url, init) => {
        mine.push({ url, init, body: JSON.parse(init.body) as Record<string, string>, waiting: J([form.sending ? BUGS_WORDS.sending : BUGS_WORDS.send, form.sending, form.sending ? '0.6' : '1', form.status.text, form.status.color]) });
        return reply();
      }, () => {});

    assert.deepStrictEqual([form.status.text, form.status.color], [el['bugStatus']!.textContent, el['bugStatus']!.style['color']], this.say(what) + ': the line and its colour');
    assert.equal(form.text, el['bugText']!.value, this.say(what) + ': the text left in the field');
    assert.deepStrictEqual(toast ? [toast] : [], this.P.toasts.slice(t0), this.say(what) + ': the toast');
    assert.deepStrictEqual([form.sending ? BUGS_WORDS.sending : BUGS_WORDS.send, form.sending], [el['bugSubmit']!.textContent, el['bugSubmit']!.disabled], this.say(what) + ': the button afterwards');
    assert.equal(mine.length, asked.length, this.say(what) + ': how many requests went out');
    if (asked.length) {
      const a = asked[0]!, b = mine[0]!;
      assert.equal(b.waiting, a.waiting, this.say(what) + ': the button and the line while the request is out');
      assert.equal(b.url, a.url, this.say(what) + ': where it is posted');
      assert.deepStrictEqual(J(b.init.method) + J(b.init.headers), J(a.init.method) + J(a.init.headers), this.say(what) + ': the method and the headers');
      assert.deepStrictEqual(Object.keys(b.body), Object.keys(a.body), this.say(what) + ': the body\'s fields');
      for (const k of ['access_key', 'subject', 'from_name']) assert.equal(b.body[k], a.body[k], this.say(what) + ': ' + k);
      const cut = (m: string): [string, string[]] => { const i = m.indexOf('\n\n— context —\n'); return [m.slice(0, i), m.slice(i + 2).split('\n')]; };
      const [text, lines] = cut(a.body['message']!), [myText, myLines] = cut(b.body['message']!);
      assert.equal(myText, text, this.say(what) + ': the athlete\'s words, trimmed');
      assert.deepStrictEqual(myLines.map((l) => l.split(':')[0]), lines.map((l) => l.split(':')[0]), this.say(what) + ': the context\'s lines, by name');
      // The same on both: the build and the program. The beta's own, by design: the time's stand-in aside, the three
      // lines where today's names the browser, its window and the page's address, and whether it is a browser's tab.
      for (const i of [1, 7]) assert.equal(myLines[i], lines[i], this.say(what) + ': the context line ' + lines[i]!.split(':')[0]);
      bump(this.T.kinds, 'report: ' + (lines[7]!.startsWith('program: none') ? 'no program' : 'a program'));
    }
    const s = Object.entries(BUG_STATUS).find(([, v]) => v.text === form.status.text && v.color === form.status.color);
    bump(this.T.kinds, 'status: ' + (s ? s[0] : 'unknown') + (asked.length ? '' : ', nothing sent'));
    this.same(what);
    assert.deepStrictEqual(this.P.dump(), pre, this.say(what) + ': a report stores nothing');
    this.T.sends++;
  }
}

/** A phone as a walk is handed one: its keys, and the instant it is launched at. */
export interface Keys { keys: Record<string, string>; at: Date }
export const keysOf = (P: Phone): Keys => ({ keys: P.dump(), at: launchNow(P) });

/** Both apps on one set of keys, the beta launched as its app launches when a program opens, or with none. */
export function twoBugs(from: Keys, T: BugsTally, what: string): TwoBugs {
  const pre = from.keys;
  const Q = new Phone();
  for (const [k, v] of Object.entries(pre)) Q.damage(k, v);
  Q.launch(iso(from.at));
  Q.ev('applyTheme();');
  const store = sqliteTestStore();
  for (const [k, v] of Object.entries(pre)) store.set(k, v);
  const grid = liveProgram(store, launchNow(Q).getTime(), { overlay: () => {}, freeze: () => {}, rebuild: () => {} }) as unknown as DeckProgram | null;
  return new TwoBugs(Q, store, grid, T, what);
}

/** A backup file's text with its data changed. */
export function withData(text: string, change: (data: Record<string, string>) => Record<string, unknown>): string {
  const f = JSON.parse(text) as { data: Record<string, string> };
  return J({ ...f, data: change({ ...f.data }) });
}

/**
 * The whole tab worked through on both apps, from a phone that holds a program: every look, each way a report ends,
 * a save, every file the reader turns away, the question with Cancel and with a refused write, then four loads, each
 * followed by its start afresh: another phone's backup (`other`, today's file), the beta's own file of it, a file
 * whose programs are all archived, and a file with no program at all.
 */
export async function walkBugs(from: Keys, other: string, T: BugsTally, what: string): Promise<void> {
  let B = twoBugs(from, T, what);
  for (const to of ['night', 'day', 'auto', 'night', 'night', 'dusk', 'day']) B.look(to);
  for (const stored of [null, 'day', 'night', 'dusk', '']) B.launchLook(stored);
  B.look('night');

  await B.send('', 'sent');
  await B.send('   \n ', 'sent');
  for (const answer of Object.keys(ANSWERS)) await B.send('  It broke.\nTwice.  ', answer);

  const saved = B.save();
  assert.ok(saved, what + ': a phone with a program saves a file');
  B.saveFails();

  const bad: [string, string | null][] = [
    ['not JSON', 'nope'], ['another app\'s JSON', '{}'], ['a list', '[]'], ['another kind', underKind(other, 'asylum')],
    ['a newer format', J({ ...(JSON.parse(other) as object), format: 2 })], ['an older format', J({ ...(JSON.parse(other) as object), format: 0 })],
    ['the beta\'s kind in a newer format', J({ ...(JSON.parse(other) as object), kind: NEXT_KIND, format: 2 })],
    ['a value that is not text', withData(other, (d) => ({ ...d, ia_active: 1 }))], ['a key that is not the app\'s', withData(other, (d) => ({ ...d, other: 'x' }))],
    ['no program list', withData(other, (d) => ({ ia_active: d['ia_active'] }))], ['a program list that is no list', withData(other, (d) => ({ ...d, ia_programs: '{}' }))],
    ['data that is a list', J({ ...(JSON.parse(other) as object), data: [] })], ['a file that cannot be read', null],
  ];
  for (const [name, text] of bad) {
    // The page of the "newer format under the beta's kind" is handed the same file under today's kind: the beta
    // reads its own kind through today's reader, so a newer file of its own is told apart as today's is.
    await B.pick(text, name, name.startsWith('the beta\'s kind'));
    assert.equal(B.loadIt('Load it after ' + name), false, what + ': nothing loads after ' + name);
  }

  await B.pick(other, 'another phone\'s backup');
  B.cancel();
  assert.equal(B.loadIt('Load it after Cancel'), false);
  await B.pick(other, 'another phone\'s backup, again');
  assert.equal(B.loadIt('Load it, the third write refused', 3), false);
  await B.pick(other, 'another phone\'s backup, a third time');
  await B.pick('nope', 'a bad file over a waiting one');
  assert.equal(B.loadIt('Load it after a bad file took the waiting one\'s place'), false);
  await B.pick(other, 'another phone\'s backup, a fourth time');
  assert.equal(B.loadIt('Load it'), true);
  B = B.restart('another phone\'s backup');

  // The beta's own file of what it now holds, loaded back: today's page turns it away, the beta asks and loads.
  B.look('day');
  const own = B.save();
  assert.ok(own);
  B.look('night');
  await B.pick(own.beta, 'the beta\'s own file', true);
  assert.equal(B.loadIt('Load it, the beta\'s own file'), true);
  B = B.restart('the beta\'s own file');
  await B.send('After a load.', 'sent');

  // A file whose every program is archived, its pointer still set: both open Programs, and both clear the pointer.
  const archived = withData(own.page, (d) => ({ ...d, ia_programs: J((JSON.parse(d['ia_programs']!) as object[]).map((p) => ({ ...p, archived: true }))) }));
  await B.pick(archived, 'a file whose programs are all archived');
  assert.equal(B.loadIt('Load it, all archived'), true);
  B = B.restart('a file whose programs are all archived');
  assert.equal(B.store.get('ia_active'), null, what + ': the pointer that led nowhere is gone');

  // A file with its programs and no pointer: both open Programs and write nothing.
  await B.pick(withData(own.page, (d) => { delete d['ia_active']; return d; }), 'a file with no pointer');
  assert.equal(B.loadIt('Load it, no pointer'), true);
  B = B.restart('a file with no pointer');

  // A file with an empty program list is a backup: one key left, Programs, nothing to save, a report with no program.
  await B.pick(J({ ...(JSON.parse(other) as object), data: { ia_programs: '[]' } }), 'a file with an empty program list');
  assert.equal(B.loadIt('Load it, an empty list'), true);
  B = B.restart('a file with an empty program list');
  assert.deepStrictEqual(Object.keys(held(B.store)), ['ia_programs']);
  assert.equal(B.save(), null);
  await B.send('Nothing here.', 'sent');
  B.look('night');
}

/**
 * Today's file of a phone, as today's page saves it with the look set to `look`: the file the walks load. The keys
 * are a copy's, so the phone it is made from is left as it was.
 */
export function todaysBackup(from: Keys, look: string): string {
  const Q = new Phone();
  for (const [k, v] of Object.entries(from.keys)) Q.damage(k, v);
  Q.launch(iso(from.at));
  return Q.ev(`setTheme(${J(look)});JSON.stringify(backupSnapshot())`) as string;
}

/**
 * A phone with nothing on it, on both apps: the looks, a report with no program, nothing to save, then another
 * phone's backup loaded, which opens This Week on its program under its look.
 */
export async function walkEmpty(at: Date, other: string, T: BugsTally, what: string): Promise<void> {
  let B = twoBugs({ keys: {}, at }, T, what);
  for (const to of ['night', 'auto', 'day']) B.look(to);
  await B.send('Nothing on this phone yet.', 'sent');
  assert.equal(B.save(), null);
  await B.pick(other, 'a backup onto an empty phone');
  assert.equal(B.loadIt('Load it onto an empty phone'), true);
  B = B.restart('a backup onto an empty phone');
  await B.send('Loaded.', 'not OK');
}
