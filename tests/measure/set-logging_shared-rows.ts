// set-logging: does Log store another move's sets, how often, and who else reads the rows that way? Read-only (measure).
//
// saveExWeight (frontends/app/src/legacy/src/js/day-detail.ts) reads a move's rep rows with
//     document.querySelectorAll('input[id^="exset_'+exKey+'_"]')
// A row's id is exset_<key>_<set>. A move whose key is `<key>_<more>` has rows whose ids start the same way, and the
// session sheet and the swipe deck both hold every card of the day on the page at once.
//
// 1. The proof, at the seed that showed it: the bodyweight run base program of tests/support/programs.ts, the first
//    day holding such a pair, every card's fields placed as the Angular template draws them (session-sections.ts),
//    typed numbers in both moves' rows, Log on the shorter key. The stored entry, and how the card then draws.
// 2. How often: every training day of every week of the 864 programs of the shared lattice (tests/lattice193.js FULL,
//    over HALF_MANNY) and of the ten seeded programs, counting the days that hold a move with a Log button beside a
//    move with set rows whose key starts with the first one's key and an underscore. HALF_MANNY alone, too.
// 3. Who else reads rows by the start of an id: every `id^=` in the app's sources.
//
// Usage: node tests/measure/set-logging_shared-rows.ts   (writes tests/measure/set-logging_shared-rows.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { type ExCard, type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { REPO, fixtures, loadApp, pinClock } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone } from '../support/stored-state.ts';

const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const CREATED = '2026-08-29T09:00:00';
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);

// ── 2. How often ─────────────────────────────────────────────────────────────────────────────────────────────────
const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));
const exKey = IA.eval('exStoreKey') as (n: string) => string;
const parseRx = IA.eval('parseRx') as (d: string, n: string) => unknown;
const isKB = IA.eval('isKBExercise') as (n: string) => boolean;
const isTrackable = IA.eval('isTrackableWeight') as (n: string) => boolean;

interface Tally { programs: number; hitPrograms: number; days: number; hitDays: number; pairs: Record<string, number>; first: string }
const tally = (): Tally => ({ programs: 0, hitPrograms: 0, days: 0, hitDays: 0, pairs: {}, first: '' });
/** The pairs on a day: a move with a Log button (rows or a load) beside a move with rows whose key starts `<key>_`. */
function pairsOf(day: any): [string, string][] {
  const moves = new Map<string, { log: boolean; rows: boolean }>();
  for (const s of (day.sections || [])) {
    if ((s.superset || s.type === 'superset') && s._skipped) continue;
    for (const it of (s.items || [])) {
      if (!it || !it.name || it._skipped) continue;
      const rows = !!parseRx(it.detail || '', it.name), loaded = isKB(it.name) || isTrackable(it.name);
      const k = exKey(it.name), was = moves.get(k);
      moves.set(k, { log: (was ? was.log : false) || rows || loaded, rows: (was ? was.rows : false) || rows });
    }
  }
  const found: [string, string][] = [];
  for (const [a, x] of moves) for (const [b, y] of moves) if (a !== b && x.log && y.rows && b.startsWith(a + '_')) found.push([a, b]);
  return found;
}
function sweep(T: Tally, name: string, prog: any): void {
  T.programs++;
  let any = false;
  for (const w of Object.keys(prog.weeks)) for (const d of DAYS7) {
    const day = prog.weeks[w][d];
    if (!day || day.rest) continue;
    T.days++;
    const found = pairsOf(day);
    if (!found.length) continue;
    T.hitDays++; any = true;
    if (!T.first) T.first = name + ', week ' + w + ', ' + d;
    for (const [a, b] of found) T.pairs[a + ' / ' + b] = (T.pairs[a + ' / ' + b] || 0) + 1;
  }
  if (any) T.hitPrograms++;
}
const row = (what: string, T: Tally): string => '| ' + what + ' | ' + T.programs + ' | ' + T.hitPrograms + ' | ' + T.days + ' | ' + T.hitDays + ' | '
  + (Object.keys(T.pairs).sort().map((k) => '`' + k + '` ' + T.pairs[k]).join(', ') || 'none') + ' |';

const LATTICE: { FULL: { tag: string; over: object }[] } = createRequire(import.meta.url)('../lattice193.js');
const L = tally(), H = tally(), S = tally();
for (const { tag, over } of LATTICE.FULL) sweep(L, tag, IA.buildProgram({ ...fixtures.HALF_MANNY, ...over }));
sweep(H, 'HALF_MANNY', IA.buildProgram({ ...fixtures.HALF_MANNY }));
const seeded: Record<string, any> = {};
for (const [name, cfg] of Object.entries(PROGRAMS)) { seeded[name] = IA.buildProgram(walkable(cfg)); sweep(S, name, seeded[name]); }

// ── 1. The proof ─────────────────────────────────────────────────────────────────────────────────────────────────
function field(id: string, value: string, placeholder: string, cls: string, rx: string | null): any {
  const set = new Set(cls.split(' ').filter(Boolean));
  return {
    id, value, placeholder, dataset: {}, textContent: '', style: {},
    classList: { add: (c: string) => { set.add(c); }, remove: (c: string) => { set.delete(c); }, contains: (c: string) => set.has(c), toggle: (c: string, on?: boolean) => { const want = on === undefined ? !set.has(c) : on; if (want) set.add(c); else set.delete(c); return want; } },
    getAttribute: (n: string) => (n === 'data-rx' ? rx : null),
  };
}
function cardsOf(P: Phone, w: number, d: string): ExCard[] {
  const f = <T>(name: string): T => P.ev(name) as T;
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  const secs = ((P.day(w, d as never) || {}).sections || []) as ExSection[];
  return JSON.parse(JSON.stringify(sectionsView(secs, 0, sectionReads({ call, global: f })).flatMap((v) => (v.kind === 'section' ? v.body.items : [])).filter((x) => x.kind === 'card'))) as ExCard[];
}
function place(P: Phone, cards: ExCard[]): void {
  const fields = (P as any).fields as Map<string, any>;
  fields.clear();
  for (const x of cards) {
    fields.set('excard_' + x.exKey, field('excard_' + x.exKey, '', '', 'exercise-item' + (x.logged ? ' logged' : ''), null));
    if (!x.log) continue;
    if (x.log.sets) for (const r of x.log.sets.rows) {
      fields.set(r.rowId, field(r.rowId, r.value, r.placeholder, r.cls, r.rx));
      if (r.weight) fields.set(r.weight.id, field(r.weight.id, r.weight.value, '', r.weight.cls, null));
    }
    if (x.log.load) fields.set('exw_' + x.exKey, field('exw_' + x.exKey, x.log.load.value, '', 'ex-winput', null));
  }
}

const proof: string[] = [];
{
  const hit = Object.entries(PROGRAMS).find(([name]) => { const T = tally(); sweep(T, name, seeded[name]); return T.hitDays > 0; });
  if (hit) {
    const [name, cfg] = hit;
    const P = new Phone().launch(CREATED);
    P.generate(walkable(cfg));
    const prog = P.prog;
    let at: { w: number; d: string; a: string; b: string } | null = null;
    for (const w of Object.keys(prog.weeks)) { for (const d of DAYS7) { const day = prog.weeks[w][d]; const f = day && !day.rest ? pairsOf(day) : []; if (f.length && !at) at = { w: +w, d, a: f[0]![0], b: f[0]![1] }; } }
    if (at) {
      P.ev(`currentWeek=${at.w};_setCurrentDayKey(${JSON.stringify(at.d)});window._unitLabel='lbs';`);
      const cards = cardsOf(P, at.w, at.d);
      place(P, cards);
      const x = cards.find((c) => c.exKey === at!.a)!, y = cards.find((c) => c.exKey === at!.b)!;
      const fields = (P as any).fields as Map<string, any>;
      // Typed numbers, so each stored set says whose row it came from: 8, 8, 7 on the first move, 31 and 32 on the other.
      const typedA = ['8', '8', '7', '6', '5', '4'], typedB = ['31', '32', '33', '34', '35', '36'];
      x.log!.sets!.rows.forEach((r, i) => { fields.get(r.rowId).value = typedA[i]; });
      y.log!.sets!.rows.forEach((r, i) => { fields.get(r.rowId).value = typedB[i]; });
      P.ev(`saveExWeight(${JSON.stringify(x.exKey)},${JSON.stringify(x.name)},${JSON.stringify(x.rxDetail)},true);`);
      const entry = P.ev(`(function(){var r=getExWeights()[${JSON.stringify(x.exKey)}];return r&&r.entries&&JSON.parse(JSON.stringify(r.entries[r.entries.length-1]));})()`);
      const after = cardsOf(P, at.w, at.d).find((c) => c.exKey === at!.a)!;
      proof.push('- The program: **' + name + '**, as the wizard generates it. The day: week ' + at.w + ', ' + at.d + ', ' + ((P.day(at.w, at.d as never) || {}).title || '') + '.');
      proof.push('- `' + x.exKey + '`: ' + x.name + ', "' + x.rxDetail + '", **' + x.log!.sets!.rows.length + ' rows**, typed ' + typedA.slice(0, x.log!.sets!.rows.length).join(', ') + '.');
      proof.push('- `' + y.exKey + '`: ' + y.name + ', "' + y.rxDetail + '", **' + y.log!.sets!.rows.length + ' rows**, typed ' + typedB.slice(0, y.log!.sets!.rows.length).join(', ') + '.');
      proof.push('- Log on ' + x.name + ' stores `setsDone` **' + JSON.stringify(entry && entry.setsDone) + '**: ' + (entry && entry.setsDone ? entry.setsDone.length : 0) + ' sets for a move of ' + x.log!.sets!.rows.length + '.');
      proof.push('- The card drawn again from that entry: the summary reads "**' + after.log!.sets!.head + '**"' + (after.log!.sets!.sub ? ' with "' + after.log!.sets!.sub + '"' : '') + (after.log!.sets!.varied ? ', marked Varied' : '') + '; its rows hold ' + after.log!.sets!.rows.map((r) => r.value).join(', ') + '.');
      // The other move's own Log reads its own rows only: its key is no other key's start.
      P.ev(`saveExWeight(${JSON.stringify(y.exKey)},${JSON.stringify(y.name)},${JSON.stringify(y.rxDetail)},true);`);
      const other = P.ev(`(function(){var r=getExWeights()[${JSON.stringify(y.exKey)}];return r&&r.entries&&JSON.parse(JSON.stringify(r.entries[r.entries.length-1]));})()`);
      proof.push('- Log on ' + y.name + ' stores `setsDone` ' + JSON.stringify(other && other.setsDone) + ', its own rows.');
    }
  }
}

// ── 3. Who else reads rows by the start of an id ─────────────────────────────────────────────────────────────────
const readers: string[] = [];
function walk(dir: string): void {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === 'node_modules' || n === 'dist' || n === 'www' || n === 'platforms' || n === 'plugins') continue;
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(ts|tsx|js|mjs|html)$/.test(n)) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => { if (/\[id(\^|\*|\$)=/.test(line)) readers.push('`' + p.slice(REPO.length + 1) + ':' + (i + 1) + '` ' + line.trim().slice(0, 150)); });
  }
}
for (const d of ['frontends/app/src', 'frontends/native/src', 'core/src']) walk(join(REPO, d));

say('# Set logging: does Log store another move\'s sets?');
say();
say('Written by `node tests/measure/set-logging_shared-rows.ts` (read-only). The page: `dist-github-pages/index.html`, ia-version ' + IA.eval('IA_VERSION') + '.');
say();
say('## 1. The proof, at the seed');
say();
for (const p of proof) say(p);
say();
say('## 2. How often');
say();
say('A day counts when it holds a move with a Log button beside a move with set rows whose key starts with the first one\'s key and an underscore.');
say();
say('| Programs | Built | Holding such a day | Training days | Days with a pair | The pairs, by day |');
say('|---|---|---|---|---|---|');
say(row('The shared lattice (`tests/lattice193.js` FULL, over HALF_MANNY)', L));
say(row('HALF_MANNY alone (Mario\'s config, as built)', H));
say(row('The ten seeded programs (`tests/support/programs.ts`)', S));
say();
say('- First on the lattice: ' + (L.first || 'none') + '. First of the ten: ' + (S.first || 'none') + '.');
say('- A program as built holds no swap and no added move. A swap or an add on the phone can make a pair the build did not.');
say();
say('## 3. Who else reads rows by the start of an id');
say();
say('Every `[id^=`, `[id*=` or `[id$=` in `frontends/app/src`, `frontends/native/src` and `core/src`: **' + readers.length + '**.');
say();
for (const r of readers) say('- ' + r);
say();
say('`setRepVals`, `setWeightVals` and `rawSetVals` (`set-logging.ts`) walk `exset_<key>_<set>` and `exsetw_<key>_<set>` one id at a time until none answers, so each reads its own move only.');

writeFileSync(join(REPO, 'tests/measure/set-logging_shared-rows.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
