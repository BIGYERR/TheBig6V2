// native-this-week: when the Expo screen's seam calls core's launch, is its grid today's page's, and what does it write?
// Read-only (measure), before the seam is changed (MIGRATION.md phase 2's last build session). The seam is liveProgram
// in frontends/native/src/this-week/week-screen.ts, which returns the stored grid today; core holds
// refreshStoredProgram(store, prog, now, failed) (core/src/engine/state-refresh.ts, v0.262.2). This runs the two side
// by side on the test phone of tests/support/stored-state.ts:
//
//   the page    a launch of today's page over the phone's keys (init, loadActiveProgram, refreshProgram): activeProg.
//   the seam    the same keys in the Expo app's SQLite store (support/sqlite-kv.ts), the active program read as
//               liveProgram reads it, handed to refreshStoredProgram at the same instant.
//
// 1. At every launch a history makes, the seam run over the keys as they stood BEFORE the page launched.
// 2. At every record (the 50 launches tests/measure/native-this-week_reads.md counted), the seam run over the keys as
//    they stand, against the grid the page holds in session, and against a second phone launched on those keys.
// 3. What the seam writes: each key it changed, and whether it left that key as the page's own launch left it; and
//    the same launch through a store that drops every write.
// 4. The failure reports each side made.
// 5. With a backup file named on the command line (never committed, never copied): the same on that phone's own
//    keys, as counts and key families only, no value printed.
//
// 6. The cases of tests/integration/stored-state.test.ts (older and damaged programs, the dated pace test, the trip,
//    the laid back swaps and edits): the same hooks over every phone that file launches. They need Vitest, so they
//    run apart and this reads their tallies: a scratch file tests/integration/zz-measure-launch.test.ts, never
//    committed, holding
//        import '../measure/native-this-week_launch.ts';
//        import './stored-state.test.ts';
//        import { writeFileSync } from 'node:fs';
//        import { afterAll, beforeEach } from 'vitest';
//        beforeEach((ctx) => { (globalThis as any).__launchLabel = ctx.task.name.slice(0, 70); });
//        afterAll(() => { writeFileSync(process.env['IA_MEASURE_OUT']!, JSON.stringify((globalThis as any).__launchTally)); });
//    run as  cd tests && IA_MEASURE_HOOK_ONLY=1 IA_MEASURE_OUT=<scratch>/cases.json npx vitest run integration/zz-measure-launch
//    and then this script with IA_MEASURE_CASES=<scratch>/cases.json.
//
// Usage: node tests/measure/native-this-week_launch.ts [backup.json]   (writes tests/measure/native-this-week_launch.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { readActiveProgramId, readPrograms } from '@ia/core/engine/state-programs.ts';
import { refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, life } from '../support/stored-state.ts';

const out: string[] = [];
const say = (s = '') => { out.push(s); };
const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const family = (k: string) => k.replace(/^(ia_[a-z]+_).+$/, '$1<id>');

interface Seam { grid: any; wrote: Record<string, string | null>; reports: { overlay: number; freeze: number; rebuild: number }; ms: number; none: boolean }
/** The seam over a set of keys: the SQLite store, the active program as liveProgram finds it, core's launch. */
function seam(keys: Record<string, string>, now: number, dropWrites = false): Seam {
  const sql = sqliteTestStore();
  for (const [k, v] of Object.entries(keys)) sql.set(k, v);
  const store: StateStore = dropWrites ? { get: sql.get, keys: sql.keys, set: () => {}, remove: () => {} } : sql;
  const reports = { overlay: 0, freeze: 0, rebuild: 0 };
  const id = readActiveProgramId(store);
  const stored = id ? (readPrograms(store) as any[]).find((x) => x && x.id === id) : null;
  if (!stored || !stored.weeks) return { grid: null, wrote: {}, reports, ms: 0, none: true };
  const t0 = performance.now();
  const grid = refreshStoredProgram(store, stored, now, { overlay: () => { reports.overlay++; }, freeze: () => { reports.freeze++; }, rebuild: () => { reports.rebuild++; } });
  const ms = performance.now() - t0;
  const wrote: Record<string, string | null> = {};
  for (const k of new Set([...Object.keys(keys), ...sql.keys()])) {
    const a = keys[k] ?? null, b = sql.get(k);
    if (a !== b) wrote[k] = b;
  }
  return { grid, wrote, reports, ms, none: false };
}

interface Diff { total: number; differ: number; thisWeek: number; thisWeekOf: number; whole: boolean }
/** Day by day over every day either grid holds, and the programs whole (every field, as JSON). */
function compare(a: any, b: any, week: number): Diff {
  let total = 0, differ = 0, thisWeek = 0, thisWeekOf = 0;
  const weeks = new Set([...Object.keys((a && a.weeks) || {}), ...Object.keys((b && b.weeks) || {})]);
  for (const w of weeks) for (const d of DAYS7) {
    const x = ((a && a.weeks) || {})[w]?.[d], y = ((b && b.weeks) || {})[w]?.[d];
    if (x === undefined && y === undefined) continue;
    total++;
    if (+w === week) thisWeekOf++;
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    differ++;
    if (+w === week) thisWeek++;
  }
  return { total, differ, thisWeek, thisWeekOf, whole: JSON.stringify(a) === JSON.stringify(b) };
}

interface Tally {
  launches: number; noneBoth: number; noneSeamOnly: number; whole: number; days: number; daysDiffer: number; thisWeekOf: number; thisWeek: number;
  wroteLaunches: number; wroteFamilies: Record<string, number>; wroteAsPage: number; wroteNotAsPage: string[]; pageOnly: Record<string, number>;
  dropSame: number; dropDiffer: number; seamReports: { overlay: number; freeze: number; rebuild: number }; pageToasts: number; pageErrors: number; ms: number[]; firstDiff: string[]; seamThrew: string[]; pageStopped: number;
}
const tally = (): Tally => ({ launches: 0, noneBoth: 0, noneSeamOnly: 0, whole: 0, days: 0, daysDiffer: 0, thisWeekOf: 0, thisWeek: 0, wroteLaunches: 0, wroteFamilies: {}, wroteAsPage: 0, wroteNotAsPage: [], pageOnly: {}, dropSame: 0, dropDiffer: 0, seamReports: { overlay: 0, freeze: 0, rebuild: 0 }, pageToasts: 0, pageErrors: 0, ms: [], firstDiff: [], seamThrew: [], pageStopped: 0 });

/** One launch: the seam over `pre`, against the page `P` launched on those keys. */
function launchRow(T: Tally, pre: Record<string, string>, P: Phone, what: string): void {
  const now: number = P.ev('Date.now()');
  const page = P.prog ? JSON.parse(JSON.stringify(P.prog)) : null;
  T.launches++;
  let s: Seam;
  try { s = seam(pre, now); } catch (e) { T.seamThrew.push(what + ': ' + String(e)); return; }
  if (!page && s.none) { T.noneBoth++; return; }
  if (page && s.none) { T.noneSeamOnly++; if (T.firstDiff.length < 6) T.firstDiff.push(what + ': the page holds a program, the seam none'); return; }
  const week: number = P.ev('calcCurrentWeek()');
  const c = compare(s.grid, page, week);
  if (c.whole) T.whole++; else if (T.firstDiff.length < 6) T.firstDiff.push(what + ': ' + c.differ + ' of ' + c.total + ' days differ');
  T.days += c.total; T.daysDiffer += c.differ; T.thisWeekOf += c.thisWeekOf; T.thisWeek += c.thisWeek;
  T.ms.push(s.ms);
  for (const k of ['overlay', 'freeze', 'rebuild'] as const) T.seamReports[k] += s.reports[k];
  T.pageToasts += P.toasts.filter((t) => t.indexOf('A plan change failed to apply') === 0).length;
  // What the seam wrote, against what the page's own launch left under the same key.
  const post = P.dump();
  const wk = Object.keys(s.wrote);
  if (wk.length) T.wroteLaunches++;
  for (const k of wk) {
    T.wroteFamilies[family(k)] = (T.wroteFamilies[family(k)] || 0) + 1;
    if ((post[k] ?? null) === s.wrote[k]) T.wroteAsPage++; else T.wroteNotAsPage.push(what + ' ' + family(k));
  }
  for (const k of new Set([...Object.keys(pre), ...Object.keys(post)])) {
    if ((pre[k] ?? null) !== (post[k] ?? null) && !(k in s.wrote)) T.pageOnly[family(k)] = (T.pageOnly[family(k)] || 0) + 1;
  }
  // The same launch through a store that drops every write.
  const d = seam(pre, now, true);
  if (JSON.stringify(d.grid) === JSON.stringify(s.grid)) T.dropSame++; else T.dropDiffer++;
}

// ── The hooks: every launch a history makes, and every record ──────────────────────────────────────────────────────
const L = tally();           // every launch
const R = tally();           // every record: the seam against the grid in session
const R2 = tally();          // every record: the seam against a second phone launched on the same keys
const C = tally();           // the control: every record, the STORED grid against the grid in session (the earlier report's count)
let hooking = true, lastAt = '', label = '';
const launch0 = Phone.prototype.launch, record0 = Phone.prototype.record;
Phone.prototype.launch = function (this: Phone, at: string, opts: { init?: boolean } = {}) {
  if (!hooking || opts.init === false) return launch0.call(this, at, opts);
  const pre = this.dump();
  launch0.call(this, at, opts);
  lastAt = at;
  launchRow(L, pre, this, label + ' launch ' + at);
  return this;
};
Phone.prototype.record = function (this: Phone) {
  const r = record0.call(this);
  if (!hooking) return r;
  const keys = this.dump();
  // The grid in session: the seam over the keys as they stand.
  const now: number = this.ev('Date.now()');
  let s: Seam;
  try { s = seam(keys, now); } catch (e) { R.launches++; R.seamThrew.push(label + ' record: ' + String(e)); return r; }
  if (!this.prog || s.none) { R.launches++; if (!this.prog && s.none) R.noneBoth++; else R.noneSeamOnly++; return r; }
  (globalThis as any).__p = this;
  const week: number = this.ev('calcCurrentWeek()');
  const c = compare(s.grid, JSON.parse(JSON.stringify(this.prog)), week);
  R.launches++; if (c.whole) R.whole++; else if (R.firstDiff.length < 6) R.firstDiff.push(((globalThis as any).__launchLabel || label) + ' record ' + R.launches + ' at ' + lastAt + ': ' + c.differ + ' of ' + c.total + ' days differ' + (function(){ const g=s.grid, q=JSON.parse(JSON.stringify((globalThis as any).__p.prog)); const o: string[]=[]; for (const w of Object.keys(g.weeks)) for (const d of DAYS7) if (JSON.stringify(g.weeks[w][d]) !== JSON.stringify((q.weeks[w]||{})[d])) o.push('w'+w+'_'+d+' seam title '+JSON.stringify((g.weeks[w][d]||{}).title)+' moved '+JSON.stringify([(g.weeks[w][d]||{}).movedFrom,(g.weeks[w][d]||{}).movedTo])+' session title '+JSON.stringify(((q.weeks[w]||{})[d]||{}).title)+' moved '+JSON.stringify([((q.weeks[w]||{})[d]||{}).movedFrom,((q.weeks[w]||{})[d]||{}).movedTo])); return ' ['+o.join('; ')+']'; })());
  R.days += c.total; R.daysDiffer += c.differ; R.thisWeekOf += c.thisWeekOf; R.thisWeek += c.thisWeek;
  const aid = this.ev('activeProgId');
  const k = compare((JSON.parse(keys['ia_programs'] || '[]') as any[]).find((p) => p && p.id === aid), JSON.parse(JSON.stringify(this.prog)), week);
  C.launches++; if (k.whole) C.whole++; C.days += k.total; C.daysDiffer += k.differ; C.thisWeekOf += k.thisWeekOf; C.thisWeek += k.thisWeek;
  // A second phone, launched on those keys at the same instant.
  hooking = false;
  try {
    const twin = new Phone();
    for (const [k, v] of Object.entries(keys)) twin.damage(k, v);
    // The page's own launch can stop on damaged data (its program list throws); the seam is then not compared.
    let up = true;
    try { launch0.call(twin, lastAt, {}); } catch (e) { up = false; R2.pageStopped++; }
    if (up) launchRow(R2, keys, twin, label + ' record ' + R.launches);
  } finally { hooking = true; }
  return r;
};

// Under Vitest with IA_MEASURE_HOOK_ONLY set, a test file imports this for its hooks alone and reads the tallies.
(globalThis as any).__launchTally = { L, R, R2, C };
if (!process.env['IA_MEASURE_HOOK_ONLY']) main();

function main(): void {
const CREATED = '2026-08-29T09:00:00';
for (const [name, seeded] of Object.entries(PROGRAMS)) {
  // The seeded swim goal gets a timed 500, as tests/sweeps/stored-state.test.ts gives it: the wizard requires one.
  const cfg: any = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
  label = name.split(',')[0]!;
  life(cfg, CREATED);
}
hooking = false;

// ── The backup corpus: each release's backup, loaded and launched on the day it was made ───────────────────────────
const B = tally();
const BK = join(REPO, 'tests/snapshots/backups');
const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (t: Date) => t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':00';
function fromBackup(T: Tally, data: Record<string, string>, when: string, what: string): Phone {
  const P = new Phone();
  for (const [k, v] of Object.entries(data)) P.damage(k, v);
  const pre = P.dump();
  launch0.call(P, when, {});
  launchRow(T, pre, P, what);
  return P;
}
const corpus = readdirSync(BK).filter((x) => x.endsWith('.json.gz')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
for (const f of corpus) {
  const file = JSON.parse(gunzipSync(readFileSync(join(BK, f))).toString('utf8'));
  fromBackup(B, file.data, stamp(new Date(file.made)), f.replace('.json.gz', ''));
}

// ── The report ────────────────────────────────────────────────────────────────────────────────────────────────────
const med = (a: number[]) => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(s[Math.floor(s.length / 2)]!) : 0; };
const fam = (o: Record<string, number>) => Object.keys(o).sort().map((k) => '`' + k + '` ' + o[k]).join(', ') || 'none';
function block(T: Tally, title: string): void {
  say('### ' + title);
  say();
  say('- Launches: **' + T.launches + '** (' + T.noneBoth + ' with no program on either side, ' + T.noneSeamOnly + ' where the page holds a program and the seam none).');
  say('- The whole program equal, every field: **' + T.whole + ' of ' + (T.launches - T.noneBoth - T.noneSeamOnly) + '**. Days that differ: **' + T.daysDiffer + ' of ' + T.days + '**, in the week holding today **' + T.thisWeek + ' of ' + T.thisWeekOf + '**.');
  if (T.firstDiff.length) say('- The first differences: ' + T.firstDiff.join('; ') + '.');
  if ('wroteLaunches' in T && T.ms.length) {
    say('- The seam wrote a key on **' + T.wroteLaunches + '** launches: ' + fam(T.wroteFamilies) + '. Left as the page\'s own launch left the same key: **' + T.wroteAsPage + ' of ' + (T.wroteAsPage + T.wroteNotAsPage.length) + '**' + (T.wroteNotAsPage.length ? ' (not: ' + T.wroteNotAsPage.slice(0, 6).join('; ') + ')' : '') + '.');
    say('- Keys the page\'s launch changed and the seam did not: ' + fam(T.pageOnly) + '.');
    say('- Through a store that drops every write, the grid is the writing store\'s on **' + T.dropSame + ' of ' + (T.dropSame + T.dropDiffer) + '** launches.');
    say('- Failure reports the seam made: overlay ' + T.seamReports.overlay + ', freeze ' + T.seamReports.freeze + ', rebuild ' + T.seamReports.rebuild + '. The page\'s toast "A plan change failed to apply. Flag it in Bugs.": ' + T.pageToasts + '.');
    say('- The seam\'s launch under Node, median: ' + med(T.ms) + ' ms (largest ' + Math.round(Math.max(...T.ms)) + ' ms). Hermes is timed on the simulator, apart from this.');
  }
  say();
}
say('# This Week in the Expo app: the seam on core\'s launch, against the page\'s');
say();
say('Written by `node tests/measure/native-this-week_launch.ts` (read-only). The seam is not changed yet: this runs');
say('`refreshStoredProgram` as `liveProgram` would call it, over the Expo app\'s SQLite store, beside today\'s page.');
say();
say('## 1. The standard history, the ten seeded programs');
say();
block(L, '1a. Every launch the histories make, the seam over the keys as they stood before the page launched');
block(R2, '1b. Every record (the 50 of native-this-week_reads.md), against a second phone launched on the same keys');
say('### 1c. Every record, against the grid the page holds in session (what native-this-week_reads.md compared the stored grid to)');
say();
say('- Records: **' + R.launches + '**. The whole program equal: **' + R.whole + ' of ' + R.launches + '**. Days that differ: **' + R.daysDiffer + ' of ' + R.days + '**, in the week holding today **' + R.thisWeek + ' of ' + R.thisWeekOf + '** (the stored grid: 806 of 3745, and 127 of 350).');
if (R.firstDiff.length) say('- The first differences: ' + R.firstDiff.join('; ') + '.');
say('- The control, so the zero above is read off an instrument that fires: the same comparison with the STORED grid in the seam\'s place counts **' + C.daysDiffer + ' of ' + C.days + '** days, in the week holding today **' + C.thisWeek + ' of ' + C.thisWeekOf + '**, whole on ' + C.whole + ' of ' + C.launches + '.');
say();
say('## 2. The backup corpus (' + corpus.length + ' backups), each loaded and launched on the day it was made');
say();
block(B, 'Every backup');

if (process.env['IA_MEASURE_CASES']) {
  const t = JSON.parse(readFileSync(process.env['IA_MEASURE_CASES'], 'utf8')) as { L: Tally; R: Tally; R2: Tally; C: Tally };
  say('## 2b. The cases of tests/integration/stored-state.test.ts (25 tests: older and damaged programs, the dated pace test, a trip, swaps and edits laid back)');
  say();
  block(t.L, 'Every launch those tests make, the seam over the keys as they stood before the page launched');
  block(t.R2, 'Every record, against a second phone launched on the same keys');
  say('- The page\'s own launch stopped on ' + t.R2.pageStopped + ' of those second phones (a stored config whose sports are not a list: its program list throws, the finding not yet ruled), so the seam was not compared there; the seam itself threw on ' + (t.L.seamThrew.length + t.R2.seamThrew.length + t.R.seamThrew.length) + '.');
  say('- Every record, against the grid the page holds in session: whole on **' + t.R.whole + ' of ' + t.R.launches + '**, days that differ **' + t.R.daysDiffer + ' of ' + t.R.days + '**' + (t.R.firstDiff.length ? ' (' + t.R.firstDiff.join('; ') + ')' : '') + '. Where it differs, the second phone above shows the page\'s own next launch is the seam\'s grid: the difference is between the page in session and the page relaunched.');
  say('- The control there: the stored grid differs from the session\'s on ' + t.C.daysDiffer + ' of ' + t.C.days + ' days.');
  say();
}

// ── A backup named on the command line: counts and key families only ──────────────────────────────────────────────
const mine = process.argv[2];
if (mine) {
  const file = JSON.parse(readFileSync(mine, 'utf8'));
  const data: Record<string, string> = file.data;
  const M = tally();
  const when = stamp(new Date());
  const P = fromBackup(M, data, when, 'the backup');
  say('## 3. A phone\'s own backup (the file is not in the repo; nothing of its values is printed)');
  say();
  say('Saved by version ' + (file.version || file.v || 'unknown') + ', ' + Object.keys(data).length + ' keys, launched at ' + when + '.');
  say();
  block(M, 'The active program');
  const now: number = P.ev('Date.now()');
  const s = seam(data, now);
  const id = readActiveProgramId({ get: (k: string) => data[k] ?? null, set() {}, remove() {}, keys: () => Object.keys(data) });
  const prog = (JSON.parse(data['ia_programs'] || '[]') as any[]).find((p) => p && p.id === id) || {};
  const ovs: any[] = Array.isArray(prog.overlays) ? prog.overlays : [];
  const kinds = new Set(ovs.filter((o) => o && (o.type === 'substitute' || o.type === 'injury') && o.patch).map((o) => JSON.stringify([o.type, o.patch])));
  say('- The active program: ' + (prog.totalWeeks || '?') + ' weeks, week ' + P.ev('calcCurrentWeek()') + ' today, its config ' + (prog.cfg && prog.cfg.seed != null ? 'holds' : 'does not hold') + ' its seed, `_testWeek` ' + (prog.cfg && prog.cfg._testWeek != null ? 'set' : 'not set') + ', ' + ovs.length + ' overlays stored (' + kinds.size + ' distinct kinds, so at most ' + kinds.size + ' variant builds beside the rebuild).');
  for (const k of Object.keys(s.wrote)) {
    const before = data[k], after = s.wrote[k];
    let detail = '';
    if (/^ia_edits_/.test(k)) { const a = Object.keys(JSON.parse(before || '{}')), b = Object.keys(JSON.parse(after || '{}')); detail = ': ' + a.length + ' days of edits before, ' + b.length + ' after (weeks dropped: ' + [...new Set(a.filter((x) => !b.includes(x)).map((x) => x.replace(/_.*/, '')))].join(', ') + ')'; }
    if (k === 'ia_programs') { const a = JSON.parse(before || '[]') as any[], b = JSON.parse(after || '[]') as any[]; detail = ': ' + b.filter((p, i) => JSON.stringify(p.cfg) !== JSON.stringify((a[i] || {}).cfg)).length + ' program configs changed, every grid ' + (b.every((p, i) => JSON.stringify(p.weeks) === JSON.stringify((a[i] || {}).weeks)) ? 'unchanged' : 'CHANGED'); }
    say('- The seam writes `' + family(k) + '` (' + (before || '').length + ' characters before, ' + (after || '').length + ' after)' + detail + '.');
  }
  if (!Object.keys(s.wrote).length) say('- The seam writes no key on this data today.');
  // Ten runs, for a steadier time under Node.
  const runs: number[] = [];
  for (let i = 0; i < 10; i++) runs.push(seam(data, now).ms);
  say('- The launch under Node, ten runs: median ' + med(runs) + ' ms.');
  const fams: Record<string, number> = {};
  for (const k of Object.keys(data)) fams[family(k)] = (fams[family(k)] || 0) + 1;
  say('- Its keys by family: ' + fam(fams) + '.');
  say();
  say('### The same backup opened later, never saved again (the beta\'s copy as the weeks pass)');
  say();
  say('| Opened | Week | Grid the page\'s | The seam writes |');
  say('|---|---|---|---|');
  for (const days of [0, 1, 2, 7, 14, 21, 28]) {
    const t = new Date(); t.setDate(t.getDate() + days);
    const T = tally();
    const Q = fromBackup(T, data, stamp(t), 'later');
    say('| ' + (days ? 'in ' + days + ' days' : 'today') + ' | ' + Q.ev('calcCurrentWeek()') + ' | ' + (T.whole === 1 ? 'yes, whole' : 'NO: ' + T.daysDiffer + ' of ' + T.days + ' days differ') + ' | ' + fam(T.wroteFamilies) + (T.wroteNotAsPage.length ? ' (NOT as the page leaves it)' : '') + ' |');
  }
  say();
}

// Hermes: read off the simulator once, by hand (2026-11-14), and typed here so a rerun keeps it.
say('## 4. The launch under Hermes (the iOS simulator, iPhone 17 Pro, iOS 26.5, the Release build of the Expo app)');
say();
say('Timed by a probe added to the app for this measure and never committed: at start it read the active program from');
say('the app\'s own SQLite store and called `refreshStoredProgram` through a store that drops writes, seven times, on');
say('`performance.now()`, then one plain `buildProgram` of the same config. The store held a copy of the phone\'s backup');
say('of section 3 (36 keys, three programs, the active one 14 weeks with no overlay), written into the simulator\'s');
say('database file with `node:sqlite`.');
say();
say('- Reading `ia_active` and `ia_programs` (three stored grids parsed): 1.7 to 3.1 ms.');
say('- The launch: **54.3 to 57.6 ms** over seven runs (57.6, 56.1, 54.8, 55.1, 56.0, 54.3, 56.0), no failure reported.');
say('- One `buildProgram` of the same config: 52.6 to 55.1 ms. So the rebuild is the launch; the freeze, the reads of');
say('  the other keys and the moves, swaps and edits laid back are 1 to 4 ms of it.');
say('- The corpus backup of v0.261.0 (one program) read the same: launch 51.8 to 58.2 ms, build 51.2 to 52.3 ms.');
say('- No overlay is stored on that program, so no variant was built. Each distinct overlay kind in range adds one more');
say('  build, about 53 ms here. The engine check ran about 1.5 times faster on the phone than on this simulator (106 ms');
say('  a build against 155 ms, docs/decisions/engine-check.md), which is not a timing of this launch on the phone.');
say();
writeFileSync(join(REPO, 'tests/measure/native-this-week_launch.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
}
