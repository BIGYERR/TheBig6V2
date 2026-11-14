// native-this-week: what does This Week read, and how much of it does core already hold?
// Read-only (measure). The question before the Expo app draws This Week (MIGRATION.md phase 2, session 4): every place
// today's Angular screen (frontends/app/src/app/screens/week-view) reaches into the legacy script, where that name is
// declared (core, or the page), and what else in the page it needs. Then the one that decides the cut: the grid the
// screen draws is the one refreshProgram hands back, not the one ia_programs stores. How often do the two differ?
//
// Usage: node tests/measure/native-this-week_reads.ts     (writes tests/measure/native-this-week_reads.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, relative } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, life } from '../support/stored-state.ts';

const out: string[] = [];
const say = (s = '') => { out.push(s); };
const SCREEN = join(REPO, 'frontends/app/src/app/screens/week-view');
const PAGE = join(REPO, 'frontends/app/src/legacy/src/js');
const CORE = join(REPO, 'core/src/engine');

// ── Part 1: the reaches ────────────────────────────────────────────────────────────────────────────────────────────
const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const stripStrings = (t: string) => t.replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

interface Decl { name: string; file: string; where: 'core' | 'page'; body: string; lines: number; shared: boolean }
const decls = new Map<string, Decl>();
const START = /^(?:export\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([^;=]+?)\s*[=;:])/;
const EDGE = /^(?:export|import|async function|function|const|let|var|class)\b/;
/** The names `a=1,b: any={k:2},c` declares: the identifier that opens each comma part outside every bracket. */
function declared(text: string): string[] {
  const names: string[] = [];
  let depth = 0, open = true;
  const t = stripStrings(text);
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if ('([{<'.includes(ch)) depth++;
    else if (')]}'.includes(ch) || (ch === '>' && t[i - 1] !== '=')) depth--;
    else if (depth === 0 && ch === ';') break;
    else if (depth === 0 && ch === ',') open = true;
    else if (depth === 0 && open && /[A-Za-z_$]/.test(ch)) {
      const m = /^[A-Za-z_$][\w$]*/.exec(t.slice(i))!;
      names.push(m[0]);
      i += m[0].length - 1;
      open = false;
    } else if (depth === 0 && open && !/\s/.test(ch)) open = false;
  }
  return names;
}
function scan(dir: string, where: 'core' | 'page'): void {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts')).sort()) {
    const lines = stripComments(readFileSync(join(dir, f), 'utf8')).split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = START.exec(lines[i]!);
      if (!m) continue;
      let j = i + 1;
      while (j < lines.length && !EDGE.test(lines[j]!)) j++;
      const body = lines.slice(i, j).join('\n');
      // `let a=1,b=2,c: any=null` declares several names on one line.
      const names = m[1] ? [m[1]] : declared(body.replace(/^(?:export\s+)?(?:const|let|var)\s+/, ''));
      for (const name of names) {
        // The page resolves a name declared twice to the later file; core's own declaration wins over neither here,
        // since no name is declared in both (the lift deletes the page's body).
        decls.set(name, { name, file: relative(REPO, join(dir, f)), where, body, lines: body.split('\n').filter((l) => l.trim()).length, shared: names.length > 1 });
      }
    }
  }
}
scan(CORE, 'core');
const coreNames = new Set(decls.keys());
scan(PAGE, 'page');
const both = [...coreNames].filter((n) => decls.get(n)!.where === 'page');

/** The page names a declaration reaches, itself included, each once. */
function closure(name: string): Decl[] {
  const seen = new Map<string, Decl>();
  const walk = (n: string) => {
    const d = decls.get(n);
    if (!d || d.where !== 'page' || seen.has(n)) return;
    seen.set(n, d);
    if (d.shared) return;
    for (const m of stripStrings(d.body).matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)(?!\s*:(?!:))/g)) if (m[2] !== n) walk(m[2]!);
  };
  walk(name);
  return [...seen.values()];
}
const flags = (ds: Decl[]) => {
  const t = stripStrings(ds.map((d) => d.body).join('\n'));
  return [
    /\biaStore\b/.test(t) ? 'store' : '',
    /\bdocument\b|\bwindow\b|getElementById|innerHTML|classList/.test(t) ? 'DOM' : '',
    /\bactiveProg(?:Id)?\b|\bcurrentWeek\b/.test(t) ? 'the active program' : '',
    /Date\.now\(\)|new Date\(\)/.test(t) ? 'clock' : '',
  ].filter(Boolean).join(', ') || 'pure';
};

// Every reach, as the inventory counts them (rn-migration_inventory.mjs), and the bridge's `global` reads beside them.
const COUNTED = /\b(?:bridge|b)\.(?:call|get|set|read|provide)\(|\bcall\('/g;
const NAMED = /\b(?:bridge|b)\.(call|global|provide|set)\(\s*'([A-Za-z_$][\w$]*)'|\b(call)\('([A-Za-z_$][\w$]*)'|setDate\('(setProgStart|setProgRace)'/g;
let counted = 0;
const reaches = new Map<string, { how: Set<string>; n: number }>();
for (const f of readdirSync(SCREEN).filter((x) => x.endsWith('.ts'))) {
  const text = stripComments(readFileSync(join(SCREEN, f), 'utf8'));
  counted += (text.match(COUNTED) || []).length;
  for (const m of text.matchAll(NAMED)) {
    const how = m[1] || m[3] || 'call', name = m[2] || m[4] || m[5]!;
    const r = reaches.get(name) || { how: new Set<string>(), n: 0 };
    r.how.add(how); r.n++;
    reaches.set(name, r);
  }
}
// What each reach is for, read off week-view.ts by hand: a value the screen draws, or a tap's action.
const ACTS = new Set(['openInjurySheet', 'openRandom', 'openOverlaySheet', 'setProgStart', 'setProgRace', '_setCurrentWeek', 'openDayKey', 'openRestSheet', 'skipPart', 'updateRandCounter', 'renderOverlayChip', 'renderWeekView']);

say('# This Week in the Expo app: what the screen reads, and what core holds');
say();
say('Written by `node tests/measure/native-this-week_reads.ts` (read-only). The tree it read: the working copy.');
say();
if (both.length) { say('Declared in core and in the page: ' + both.map((n) => '`' + n + '`').join(', ') + '.'); say(); }
say('## 1. The reaches');
say();
say('- Bridge calls in `frontends/app/src/app/screens/week-view`, counted as the inventory counts them: **' + counted + '**.');
say('- Distinct legacy names reached (calls, `global` reads, the takeover): **' + reaches.size + '**.');
say();
const row = (name: string) => {
  const d = decls.get(name);
  if (!d) return '| `' + name + '` | not found | | | |';
  if (d.where === 'core') return '| `' + name + '` | **core** `' + d.file.replace('core/src/engine/', '') + '` | ' + d.lines + ' | | |';
  const c = closure(name);
  const others = c.filter((x) => x.name !== name);
  return '| `' + name + '` | page `' + d.file.replace('frontends/app/src/legacy/src/js/', '') + '` | ' + d.lines + ' | ' + (others.length ? others.length + ' more (' + c.reduce((s, x) => s + x.lines, 0) + ' lines in all): ' + others.map((x) => '`' + x.name + '`').slice(0, 9).join(', ') + (others.length > 9 ? ', …' : '') : 'none') + ' | ' + flags(c) + ' |';
};
const reads = [...reaches.keys()].filter((n) => !ACTS.has(n)).sort((a, b) => a.localeCompare(b));
const acts = [...reaches.keys()].filter((n) => ACTS.has(n)).sort((a, b) => a.localeCompare(b));
say('### 1a. What the screen draws from (' + reads.length + ' names)');
say();
say('| Name | Declared in | Lines | Page names it reaches | It touches |');
say('|---|---|---|---|---|');
reads.forEach((n) => say(row(n)));
say();
const inCore = reads.filter((n) => decls.get(n)?.where === 'core'), inPage = reads.filter((n) => decls.get(n)?.where === 'page');
say('In core already: **' + inCore.length + ' of ' + reads.length + '** (' + inCore.map((n) => '`' + n + '`').join(', ') + '). In the page: **' + inPage.length + '**.');
say();
say('### 1b. What a tap does (' + acts.length + ' names): out of this session, each a write or another screen');
say();
say('| Name | Declared in | Lines | Page names it reaches | It touches |');
say('|---|---|---|---|---|');
acts.forEach((n) => say(row(n)));
say();
say('### 1c. The grid itself');
say();
say('`activeProg` is not a stored value: `loadActiveProgram` sets it to `refreshProgram(stored program)`.');
say();
say('| Name | Declared in | Lines | Page names it reaches | It touches |');
say('|---|---|---|---|---|');
['refreshProgram', 'applyOverlays', 'applyRestDayMoves', 'applySessionSwaps', 'applyDayEdits', 'pruneDayEdits', 'paceShiftMap', 'progTestPin', 'loadActiveProgram'].forEach((n) => say(row(n)));
say();

// ── Part 2: the stored grid against the grid in hand ───────────────────────────────────────────────────────────────
say('## 2. The stored grid against the grid the screen draws');
say();
say('For each launch: the days of `ia_programs`\' stored grid whose JSON differs from the same day of `activeProg`');
say('(what `refreshProgram` handed back), over every day either holds; and the same count inside the week holding today.');
say();
const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function compare(P: Phone): { total: number; differ: number; thisWeek: number; thisWeekOf: number; week: number; why: string[] } {
  const id = P.ev('activeProgId');
  const stored = (JSON.parse(P.dump()['ia_programs'] || '[]') as any[]).find((p) => p.id === id) || {};
  const live = P.prog || {};
  const week: number = P.ev('calcCurrentWeek()');
  let total = 0, differ = 0, thisWeek = 0, thisWeekOf = 0;
  const why = new Set<string>();
  const weeks = new Set([...Object.keys(stored.weeks || {}), ...Object.keys(live.weeks || {})]);
  for (const w of weeks) for (const d of DAYS7) {
    const a = (stored.weeks || {})[w]?.[d], b = (live.weeks || {})[w]?.[d];
    if (a === undefined && b === undefined) continue;
    total++;
    if (+w === week) thisWeekOf++;
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    differ++;
    if (+w === week) thisWeek++;
    if (!a || !b) { why.add('a day only one grid holds'); continue; }
    if ((a.title || '') !== (b.title || '')) why.add('title');
    if (!!a.rest !== !!b.rest) why.add('rest or training');
    if (JSON.stringify(a.cardio || null) !== JSON.stringify(b.cardio || null)) why.add('cardio');
    if (JSON.stringify(a.sections || null) !== JSON.stringify(b.sections || null)) why.add('sections');
  }
  return { total, differ, thisWeek, thisWeekOf, week, why: [...why] };
}
say('### 2a. The standard history (tests/support/stored-state.ts `life`), the ten seeded programs');
say();
say('| Program | Launch | Week | Days that differ | Of them in the week holding today | What differs |');
say('|---|---|---|---|---|---|');
const CREATED = '2026-08-29T09:00:00';
let sumDiffer = 0, sumTotal = 0, sumThis = 0, sumThisOf = 0, launches = 0, launchesDiffer = 0, launchesThis = 0;
for (const [name, seeded] of Object.entries(PROGRAMS)) {
  // The seeded swim goal gets a timed 500, as tests/sweeps/stored-state.test.ts gives it: the wizard requires one.
  const cfg: any = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
  // The walk again, comparing at each record: life() returns the records, and the phone only at its end.
  const marks: string[] = [];
  const orig = Phone.prototype.record;
  Phone.prototype.record = function (this: Phone) {
    const r = orig.call(this);
    const c = compare(this);
    launches++; if (c.differ) launchesDiffer++; if (c.thisWeek) launchesThis++;
    sumDiffer += c.differ; sumTotal += c.total; sumThis += c.thisWeek; sumThisOf += c.thisWeekOf;
    marks.push('| ' + name.split(',')[0] + ' | ' + (marks.length) + ' | ' + c.week + ' | ' + c.differ + ' of ' + c.total + ' | ' + c.thisWeek + ' of ' + c.thisWeekOf + ' | ' + (c.why.join(', ') || 'nothing') + ' |');
    return r;
  };
  try { life(cfg, CREATED); } finally { Phone.prototype.record = orig; }
  marks.forEach((m) => say(m));
}
say();
say('Launch 0 is the program just generated; 1 to 3 the first three weeks trained (a swap, a skipped move, an added one, an injury, a moved rest day, travel, a Wildcard); 4 a launch after two weeks away.');
say();
say('**Over ' + launches + ' launches: ' + launchesDiffer + ' hold a day that differs, ' + launchesThis + ' hold one in the week holding today. Days: ' + sumDiffer + ' of ' + sumTotal + ' differ, ' + sumThis + ' of ' + sumThisOf + ' in the week holding today.**');
say();

say('### 2b. The backup corpus: each release\'s backup, loaded and launched on the day it was made');
say();
say('| Backup | Made | Week | Days that differ | Of them in the week holding today | What differs |');
say('|---|---|---|---|---|---|');
const BK = join(REPO, 'tests/snapshots/backups');
for (const f of readdirSync(BK).filter((x) => x.endsWith('.json.gz')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).slice(-3)) {
  const file = JSON.parse(gunzipSync(readFileSync(join(BK, f))).toString('utf8'));
  const P = new Phone();
  for (const [k, v] of Object.entries(file.data as Record<string, string>)) P.damage(k, v);
  const made = new Date(file.made);
  const pad = (n: number) => String(n).padStart(2, '0');
  const when = made.getFullYear() + '-' + pad(made.getMonth() + 1) + '-' + pad(made.getDate()) + 'T' + pad(made.getHours()) + ':' + pad(made.getMinutes()) + ':00';
  P.launch(when);
  const c = compare(P);
  say('| ' + f.replace('.json.gz', '') + ' | ' + when.slice(0, 10) + ' | ' + c.week + ' | ' + c.differ + ' of ' + c.total + ' | ' + c.thisWeek + ' of ' + c.thisWeekOf + ' | ' + (c.why.join(', ') || 'nothing') + ' |');
}
say();

writeFileSync(join(REPO, 'tests/measure/native-this-week_reads.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
