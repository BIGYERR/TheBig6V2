// native-bugs-tab: the Bugs tab on today's page, piece by piece, before the Expo app draws it (MIGRATION.md phase 3,
// row 7, the second session). Read-only (measure). It runs today's page in the VM harness on the test phone of
// tests/support/stored-state.ts, on the ten seeded programs, each on its third week of the standard history. Stored
// keys are read before and after each tap. It follows tests/measure/native-row7_today.md, section E.
//
// A. The bug report: each way a send ends, and what the report carries.
// B. The Look row: the key, the mark on <html>, and the button drawn on.
// C. Save a backup: an empty phone, the share sheet, a failed share.
// D. Load a backup: the question, Cancel, Load it, a refused write, and where the page starts afresh.
// E. A file the beta would save, picked in today's app: in today's format, and under a kind of its own.
//
// Usage: cd tests && node measure/native-bugs-tab_today.ts   (writes tests/measure/native-bugs-tab_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, life } from '../support/stored-state.ts';
import { memoryStore } from '../../core/src/engine/state-store.ts';
import { takeBackup } from '../../core/src/engine/state-backup.ts';
import { VERSION } from '../../core/src/version.ts';
import {
  BUG_FORM_URL, BUG_SENT_TOAST, BUG_STATUS, bugContextText, bugPayload, submitBugReport,
} from '../../frontends/app/src/app/screens/bug-report/bug-report-model.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals && seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const CFGS = Object.values(PROGRAMS).map(walkable);
const J = JSON.stringify;
const bump = (T: Record<string, number>, k: string, n = 1): void => { T[k] = (T[k] || 0) + n; };
const table = (T: Record<string, number>, head: string): void => {
  say('| ' + head + ' | Count |'); say('|---|---|');
  for (const k of Object.keys(T).sort()) say('| ' + k + ' | ' + T[k] + ' |');
  say();
};
const fam = (k: string, id: string): string => k.split(id).join('<id>');
function diff(pre: Record<string, string>, post: Record<string, string>, id: string): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    rows.push('`' + fam(k, id) + '`' + (pre[k] == null ? ' new' : post[k] == null ? ' removed' : ' changed'));
  }
  return rows.join(', ') || 'nothing';
}
const pad = "function(n){return String(n).padStart(2,'0')}";
const nowIso = (P: Phone): string => P.ev(`(function(){var d=new Date();var p=${pad};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())+':00';})()`);
interface Snap { keys: Record<string, string>; iso: string }
function phoneOf(s: Snap): Phone {
  const P = new Phone();
  for (const [k, v] of Object.entries(s.keys)) P.damage(k, v);
  P.launch(s.iso);
  P.settle();
  return P;
}
const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const day = (s: string): string => s.replace(/Backup from [A-Z][a-z]+ \d+/, 'Backup from <day>').replace(/\d+ program/, 'N program');

/** The page's own Your data block, watched: each line it shows and whether the question is up; each reload. */
function watch(P: Phone): { shown: [string, boolean][]; reloads: number[] } {
  const w = { shown: [] as [string, boolean][], reloads: [] as number[] };
  P.IA.ctx['__w'] = w;
  P.ev('_backupShow=(function(o){return function(m,a){__w.shown.push([String(m),!!a]);return o.apply(this,arguments);};})(_backupShow);');
  P.ev('location.reload=function(){__w.reloads.push(1);};');
  return w;
}
const fileOf = (text: string): any => ({ files: [{ text: () => Promise.resolve(text) }] });
async function pick(P: Phone, text: string): Promise<void> { P.IA.ctx['__in'] = fileOf(text); P.ev('backupFileChosen(__in)'); await tick(); await tick(); }
const last = (w: { shown: [string, boolean][] }): string => { const l = w.shown[w.shown.length - 1]; return l ? (l[0] === '' ? '(no line)' : day(l[0])) + (l[1] ? ', the question up' : ', no question') : 'nothing shown'; };
/** A cold start over `keys`: the screen the page shows first, and the mark its launch puts on <html>. */
function afresh(keys: Record<string, string>, iso: string): string {
  const P = new Phone();
  for (const [k, v] of Object.entries(keys)) P.damage(k, v);
  P.launch(iso, { init: false });
  const seen: string[] = [];
  P.IA.ctx['__seen'] = seen;
  P.ev('showScreen=(function(o){return function(id){__seen.push(String(id));return o.apply(this,arguments);};})(showScreen);');
  P.ev('applyTheme();init();');
  P.settle();
  return (seen[seen.length - 1] || 'none') + ', look ' + (P.ev("document.documentElement.getAttribute('data-theme')") || 'auto (no mark)');
}

async function main(): Promise<void> {
  const thirds: Snap[] = [], ids: string[] = [];
  CFGS.forEach((cfg) => {
    life(cfg, CREATED, undefined, (stage, P) => {
      if (stage === '3 third week') { thirds.push({ keys: P.dump(), iso: nowIso(P) }); ids.push(P.ev('activeProgId')); }
    });
  });

  say('# The Bugs tab on today\'s page (measure, before the Expo app draws it)');
  say();
  say('Made by `tests/measure/native-bugs-tab_today.ts` on today\'s page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each on its third week of the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed. It follows `tests/measure/native-row7_today.md`, section E.');
  say();

  // ── A. The bug report ───────────────────────────────────────────────────────────────────────────────────────────
  say('## A. The bug report');
  say();
  say('Today\'s iOS app sends through `frontends/app/src/app/screens/bug-report/bug-report-model.ts` (the page\'s `submitBug` holds the same words). Each way a send can end, on a stand-in for the form (no report was sent):');
  say();
  const sends: Record<string, number> = {};
  const answers: [string, () => Promise<{ ok: boolean; json(): Promise<unknown> }>][] = [
    ['the form answers OK and success', async () => ({ ok: true, json: async () => ({ success: true }) })],
    ['the form answers OK, no success', async () => ({ ok: true, json: async () => ({ success: false }) })],
    ['the form refuses (not OK)', async () => ({ ok: false, json: async () => ({ success: true }) })],
    ['the form answers something that is not JSON', async () => ({ ok: true, json: async () => { throw new Error('x'); } })],
    ['the request never arrives', async () => { throw new Error('offline'); }],
  ];
  let posted: any = null;
  for (const [name, answer] of answers) {
    const outcome = await submitBugReport('It broke.', '', async (url, init) => { posted = { url, init }; return answer(); });
    const st = BUG_STATUS[outcome];
    bump(sends, name + ' → ' + outcome + ': "' + st.text + '" in ' + st.color + (outcome === 'sent' ? ', toast "' + BUG_SENT_TOAST + '", the text cleared' : ', the text kept'));
  }
  bump(sends, 'nothing typed → no request: "' + BUG_STATUS.empty.text + '" in ' + BUG_STATUS.empty.color);
  table(sends, 'Send');
  const body = JSON.parse(posted.init.body);
  say('The request: ' + posted.init.method + ' to `' + posted.url + '`' + (posted.url === BUG_FORM_URL ? '' : ' (not the model\'s address)') + ', headers ' + Object.keys(posted.init.headers).sort().join(', ') + '; its body holds ' + Object.keys(body).sort().join(', ') + '. While it is out the button reads Sending… at 0.6 and takes no tap.');
  say();
  const ctx: Record<string, number> = {};
  thirds.forEach((s) => {
    const P = phoneOf(s);
    const text = bugContextText({ build: P.ev('iaVersionLabel(IA_VERSION)'), time: 'T', ua: 'UA', width: 1, height: 2, standalone: false, url: 'URL', program: P.ev('activeProg'), week: P.ev('currentWeek') });
    bump(ctx, text.split('\n').filter(Boolean).map((l) => l.split(':')[0]).join(' / '));
    bump(ctx, 'the program line: ' + text.split('\n').pop()!.replace(/program: .* \/ goal [a-z]+ \/ wk \d+ \/ id .*/, 'program: <name> / goal <goal> / wk <n> / id <id>'));
  });
  bump(ctx, 'with no program: ' + bugPayload('', bugContextText({ build: '', time: '', ua: '', width: 0, height: 0, standalone: false, url: '', program: null, week: 0 })).message.split('\n').pop());
  say('What the report carries after the athlete\'s text (ten phones):'); say(); table(ctx, 'Context');

  // ── B. The Look row ─────────────────────────────────────────────────────────────────────────────────────────────
  say('## B. The Look row');
  say();
  const look: Record<string, number> = {}, launch: Record<string, number> = {};
  const ON: Record<string, string> = { auto: 'Auto', day: 'Day', night: 'Night' };
  thirds.forEach((s, n) => {
    const P = phoneOf(s), id = ids[n]!;
    for (const t of ['night', 'day', 'auto', 'night', 'night']) {
      const pre = P.dump(); P.ev(`setTheme(${J(t)});`);
      const mark = P.ev("document.documentElement.getAttribute('data-theme')");
      bump(look, ON[t] + ' → ' + diff(pre, P.dump(), id) + '; the mark on the page: ' + (mark || 'none') + '; drawn on: ' + ON[mark || 'auto']);
    }
    for (const stored of [null, 'day', 'night', 'dusk', '']) {
      P.damage('ia_theme', stored);
      P.ev('applyTheme();');
      const mark = P.ev("document.documentElement.getAttribute('data-theme')");
      bump(launch, 'stored ' + (stored === null ? 'nothing' : '"' + stored + '"') + ' → reads ' + P.ev('getTheme()') + ', drawn on: ' + ON[mark || 'auto']);
    }
  });
  say('Each tap, the stored keys it changed, and the button drawn on (the CSS reads the mark on `<html>`, `shell.css`). Ten phones, the taps in order Night, Day, Auto, Night, Night:'); say(); table(look, 'Tap');
  say('What a launch reads (`applyTheme`, run as the page loads and again when the phone\'s own look changes):'); say(); table(launch, 'Stored');

  // ── C. Save a backup ───────────────────────────────────────────────────────────────────────────────────────────
  say('## C. Save a backup');
  say();
  const save: Record<string, number> = {};
  for (const [n, s] of thirds.entries()) {
    const P = phoneOf(s), id = ids[n]!;
    const shared: [string, string][] = [];
    let fails = false;
    P.IA.window['iaIsland'] = { share: (name: string, text: string, ok: () => void, fail: () => void) => { shared.push([name, text]); (fails ? fail : ok)(); } };
    const pre = P.dump(); let t0 = P.toasts.length;
    const how = P.ev('saveBackup()');
    const f = JSON.parse(shared[0]![1]);
    bump(save, 'With the share sheet (the iOS app) → ' + how + ', one file handed over, ' + String(shared[0]![0]).replace(/\d{4}-\d{2}-\d{2}/, '<date>') + '; stored keys changed: ' + diff(pre, P.dump(), id) + '; toast: ' + (P.toasts.slice(t0).join(' | ') || 'none'));
    bump(save, 'The file: ' + Object.keys(f).sort().join(', ') + '; kind ' + f.kind + ', format ' + f.format + '; version ' + (f.version === VERSION ? 'the release\'s' : f.version) + '; its data is every ia_ key as stored: ' + (J(f.data) === J(pre) ? 'yes' : 'no'));
    fails = true; t0 = P.toasts.length;
    P.ev('saveBackup()');
    bump(save, 'The share sheet fails → toast: ' + (P.toasts.slice(t0).join(' | ') || 'none'));
    const E = new Phone().launch(s.iso);
    E.IA.window['iaIsland'] = { share: () => { shared.push(['empty', '']); } };
    const n0 = shared.length; t0 = E.toasts.length;
    bump(save, 'A phone with no program → ' + E.ev('saveBackup()') + ', ' + (shared.length - n0) + ' files handed over; toast: ' + (E.toasts.slice(t0).join(' | ') || 'none'));
  }
  table(save, 'Save a backup');

  // ── D. Load a backup ───────────────────────────────────────────────────────────────────────────────────────────
  say('## D. Load a backup');
  say();
  const load: Record<string, number> = {};
  for (const [n, s] of thirds.entries()) {
    const other = thirds[(n + 1) % thirds.length]!;
    const snap = JSON.parse(phoneOf(other).ev("setTheme('night');JSON.stringify(backupSnapshot())"));
    const text = J(snap);
    // The file picked: the line and the question, nothing stored.
    let P = phoneOf(s), w = watch(P), pre = P.dump(), id = ids[n]!;
    await pick(P, text);
    bump(load, '1. A good file picked → ' + last(w) + '; stored keys changed: ' + diff(pre, P.dump(), id) + '; reloads ' + w.reloads.length);
    P.ev('backupCancel()');
    bump(load, '2. Cancel → ' + last(w) + '; stored keys changed: ' + diff(pre, P.dump(), id) + '; reloads ' + w.reloads.length);
    P.ev('backupLoadIt()');
    bump(load, '3. Load it after Cancel (nothing waiting) → stored keys changed: ' + diff(pre, P.dump(), id) + '; reloads ' + w.reloads.length);
    await pick(P, text);
    const t0 = P.toasts.length;
    P.ev('backupLoadIt()');
    bump(load, '4. Load it → every key the file\'s, none of the phone\'s left: ' + (J(P.dump()) === J(snap.data) ? 'yes' : 'no') + '; reloads ' + w.reloads.length + '; toast: ' + (P.toasts.slice(t0).join(' | ') || 'none') + '; the line and the question left up until the reload: ' + (w.shown.length === 4 && w.shown[3]![1] ? 'yes' : 'no'));
    bump(load, '5. The page started afresh on the file → ' + afresh(P.dump(), other.iso));
    // A refused write: the third set throws, as a full phone does.
    P = phoneOf(s); w = watch(P); pre = P.dump();
    await pick(P, text);
    const ls = P.IA.localStorage, set = ls.setItem; let sets = 0;
    ls.setItem = (k: string, v: string) => { if (++sets === 3) throw new Error('full'); set.call(ls, k, v); };
    const t1 = P.toasts.length;
    P.ev('backupLoadIt()');
    ls.setItem = set;
    bump(load, '6. Load it, the phone refuses the third write → stored keys changed: ' + diff(pre, P.dump(), id) + '; reloads ' + w.reloads.length + '; toast: ' + (P.toasts.slice(t1).join(' | ') || 'none') + '; then ' + last(w));
    // The files the reader turns away.
    for (const [name, bad] of [['not JSON', 'nope'], ['another app\'s JSON', '{}'], ['a newer format', J({ ...snap, format: snap.format + 1 })], ['a value that is not text', J({ ...snap, data: { ...snap.data, ia_active: 1 } })], ['a key that is not the app\'s', J({ ...snap, data: { ...snap.data, other: 'x' } })], ['no program list', J({ ...snap, data: { ia_active: 'x' } })]] as [string, string][]) {
      P = phoneOf(s); w = watch(P); pre = P.dump();
      await pick(P, bad);
      P.ev('backupLoadIt()');
      bump(load, '7. Picked, ' + name + ', then Load it → ' + (w.shown[0] ? w.shown[0][0] + (w.shown[0][1] ? ', the question up' : ', no question') : 'nothing shown') + '; stored keys changed: ' + diff(pre, P.dump(), id) + '; reloads ' + w.reloads.length);
    }
    // A file with an empty program list is a backup: it loads, and the page starts on Programs.
    P = phoneOf(s); w = watch(P);
    const none = J({ ...snap, data: { ia_programs: '[]' } });
    await pick(P, none);
    const line = last(w);
    P.ev('backupLoadIt()');
    bump(load, '8. A file with an empty program list → ' + line + '; loaded, ' + Object.keys(P.dump()).length + ' key left; reloads ' + w.reloads.length + '; afresh → ' + afresh(P.dump(), s.iso));
    // No file chosen (the picker closed).
    P = phoneOf(s); w = watch(P);
    P.IA.ctx['__in'] = { files: [] }; P.ev('backupFileChosen(__in)'); await tick();
    bump(load, '9. The picker closed with no file → ' + (w.shown.length ? last(w) : 'nothing shown'));
  }
  say('Each phone is offered the next phone\'s backup, saved with the look set to Night. The line and the question are the page\'s own block (`_backupShow`); the iOS app\'s Angular block calls the same reader, message and loader.'); say(); table(load, 'Step');

  // ── E. A file the beta would save ──────────────────────────────────────────────────────────────────────────────
  say('## E. A file the beta would save, picked in today\'s app');
  say();
  say('The beta\'s store holds the same `ia_` keys, so core\'s `takeBackup` on it writes today\'s file. Each phone here is today\'s app; the file is made from the next phone\'s keys in a plain store, as the beta would make it, in three forms.');
  say();
  const cross: Record<string, number> = {};
  for (const [n, s] of thirds.entries()) {
    const other = thirds[(n + 1) % thirds.length]!, id = ids[n]!;
    const made = takeBackup(memoryStore(other.keys), VERSION, Date.parse('2026-11-27T12:00:00Z'));
    for (const [name, file] of [['in today\'s format (kind asylum-backup, format 1)', made], ['under a kind of its own (asylum-next-backup, format 1)', { ...made, kind: 'asylum-next-backup' }], ['under a format of its own (kind asylum-backup, format 2)', { ...made, format: 2 }]] as [string, any][]) {
      const P = phoneOf(s), w = watch(P), pre = P.dump();
      await pick(P, J(file));
      const line = w.shown[0] ? day(w.shown[0][0]) + (w.shown[0][1] ? ', the question up' : ', no question') : 'nothing shown';
      P.ev('backupLoadIt()');
      const post = P.dump();
      bump(cross, 'Saved ' + name + ' → ' + line + '; after Load it: ' + (J(post) === J(pre) ? 'today\'s keys untouched' : J(post) === J(other.keys) ? 'every key replaced by the beta\'s, none of today\'s left' : 'differs') + '; reloads ' + w.reloads.length);
    }
  }
  table(cross, 'The beta\'s file');

  // ── F. The reading ─────────────────────────────────────────────────────────────────────────────────────────────
  say('## F. What the beta\'s Bugs tab holds, and what is left');
  say();
  say('Read from the sources (`frontends/native/src/App.tsx` `Bugs`, `EngineCheck.tsx`, `BackupLoad.tsx`, `store/backup-import.ts`; today\'s `frontends/app/src/app/screens/bug-report/bug-report.ts`), not counted by this script.');
  say();
  say('| Piece, top to bottom on today\'s screen | Today\'s | The beta |');
  say('|---|---|---|');
  say('| The top bar | The Asylum, Report a Bug | A title of its own, Bugs |');
  say('| The bug report | The note, the text field, Send Bug Report, the status line, the context note (section A) | None |');
  say('| Look | Auto, Day, Night; `ia_theme` (section B) | None. The beta follows the phone alone (`useColorScheme`), and a look a loaded backup carries is stored and not read |');
  say('| Your data | The note, Save a backup, Load a backup, the line, Load it and Cancel (sections C and D) | A card of its own, Backup: Load a backup alone, which loads at once, checks every key against the file (D287) and stays on Bugs; D289\'s words; then how many keys it holds, each program, and each key with its size and its hash |');
  say('| Engine | The label, the note, Run the check, the line (D286) | Held: the same words and lines, in a card of its own |');
  say('| Run recorder | A row, in the iOS app alone | Phase 4 |');
  say('| The build label | Build v' + VERSION + ' | Two lines of its own: what it runs on with the version, and the Swift module\'s answer |');
  say();
  say('Left to build as today\'s: the top bar, the bug report, the Look row, the Your data block (Save a backup; Load a backup with its line and its question, and the start afresh after Load it), the Engine row in today\'s form, and the build label.');
  say();
  say('The beta\'s own, with no place on today\'s screen: the two lines under the title; the list of keys with sizes and hashes, the count of keys and the programs\' lines; the line a load prints (Loaded N of N keys. Every hash matches the file.); D289\'s words (Mario\'s own ruling: Bugs says so in words).');
  say();
  say('How today\'s Load differs from the beta\'s:');
  say();
  say('- Today\'s reads the file and changes nothing, prints what it is (Backup from <day>. N program. Loading it replaces everything on this phone.) and asks, Load it or Cancel. The beta loads as soon as the file is picked.');
  say('- After Load it today\'s page reloads: it starts on This Week under the file\'s look, or on Programs when the file holds no program (section D, steps 5 and 8). The beta stays on Bugs, and This Week reads the store again when it is next opened.');
  say('- A refused write: today\'s puts back what the phone held and says Loading failed. Nothing changed. The beta does the same and says The phone refused the write. Nothing was kept.');
  say('- The beta alone checks every key against the file after the load and puts everything back on a miss (D287: SQLite stores a lone surrogate as U+FFFD). Today\'s has no such check and needs none: its store is the browser\'s.');
  say();
  say('Not known until a report is sent: whether the form takes a request from the beta. The key is registered to the live page\'s address (handoff, Bugs tab), and a request from React Native carries no page address. No report was sent by this measure.');

  writeFileSync(join(REPO, 'tests', 'measure', 'native-bugs-tab_today.md'), out.join('\n') + '\n');
  console.log(out.join('\n'));
}
main().catch((e) => { console.error(e); process.exit(1); });
