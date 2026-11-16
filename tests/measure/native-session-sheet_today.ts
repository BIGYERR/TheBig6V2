// native-session-sheet: today's session sheet, before the Expo app draws one (MIGRATION.md phase 3, the session
// sheet's first session). Read-only (measure). It runs today's page in the VM harness on the test phone of
// tests/support/stored-state.ts and reads the stored keys before and after each step.
//
// A. What the Angular sheet's own files ask of the page: every page function and global they name, by file, and how
//    many of those the Expo app already holds a port of (the deck's, the pop-ups', the swap sheet's).
// B. What each tap only the sheet has writes, on one training day of HALF_MANNY: the effort slider, the notes, Done,
//    its undo, Skip, its undo, add, remove, Done over a skipped part, Done and its undo on the program's last day,
//    and the 1RM card's save on a test day.
// C. What the sheet has to draw: every training day of the ten programs as generated, by the blocks its body holds.
//
// Usage: cd tests && node measure/native-session-sheet_today.ts   (writes tests/measure/native-session-sheet_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { liftsFirst, rangeNudge } from '../../frontends/app/src/app/screens/day-detail/day-detail-model.ts';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek, training } from '../support/stored-state.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const say = (s = ''): void => { out.push(s); };
const bump = (m: Record<string, number>, k: string, n = 1): void => { m[k] = (m[k] || 0) + n; };
const list = (m: Record<string, number>): string => Object.keys(m).sort().map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';
function family(k: string, ids: string[]): string {
  let f = k;
  for (const id of ids) f = f.split(id).join('<id>');
  return f;
}
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};

say('# Today\'s session sheet, before the Expo app draws one');
say();
say('Written by `cd tests && node measure/native-session-sheet_today.ts` (read-only). Zone ' + process.env['TZ'] + '.');
say();

// ── A. What the sheet's files ask of the page ────────────────────────────────────────────────────────────────────
{
  const dir = join(REPO, 'frontends/app/src/app/screens/day-detail');
  const native = join(REPO, 'frontends/native/src');
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /\.tsx?$/.test(e.name) ? [join(d, e.name)] : []));
  const nativeText = walk(native).map((f) => readFileSync(f, 'utf8')).join('\n');
  const all = new Set<string>(), cardio = new Set<string>(), rest = new Set<string>();
  say('## A. What the sheet\'s Angular files ask of the page');
  say();
  say('| File | Page functions and globals it names |');
  say('|---|---|');
  let places = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts')).sort()) {
    const text = readFileSync(join(dir, f), 'utf8');
    const names = new Set<string>();
    let n = 0;
    for (const m of text.matchAll(/\b(?:call|global)\(\s*'([A-Za-z_]\w*)'/g)) { names.add(m[1]!); n++; }
    for (const m of text.matchAll(/\bprovide\(\s*'([A-Za-z_]\w*)'/g)) names.add(m[1]! + ' (taken over)');
    if (!names.size) continue;
    places += n;
    for (const x of names) { all.add(x); if (/^cardio-/.test(f)) cardio.add(x); else rest.add(x); }
    say('| `' + f + '` | ' + n + ' places, ' + names.size + ' names: ' + [...names].sort().join(', ') + ' |');
  }
  const plain = [...all].filter((x) => !x.endsWith('(taken over)'));
  const held = plain.filter((x) => new RegExp('\\b' + x + '\\b').test(nativeText));
  say();
  say('- Places that reach the page: **' + places + '**. Distinct names: **' + plain.length + '**, of which only the cardio files name ' + [...cardio].filter((x) => !rest.has(x)).length + '.');
  say('- Named somewhere in the Expo app\'s source already (a port, or its name in a comment): **' + held.length + '** of ' + plain.length + '.');
  say('- Not named there: ' + plain.filter((x) => !held.includes(x)).sort().join(', ') + '.');
  say();
}

// ── B. The taps only the sheet has ───────────────────────────────────────────────────────────────────────────────
function diff(pre: Record<string, string>, post: Record<string, string>, ids: string[]): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    const f = family(k, ids);
    let inside = '';
    try {
      const a = pre[k] == null ? {} : JSON.parse(pre[k]!), b = post[k] == null ? {} : JSON.parse(post[k]!);
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const parts: string[] = [];
        for (const e of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
          if (JSON.stringify(a[e]) === JSON.stringify(b[e])) continue;
          let sub = '';
          if (a[e] && b[e] && typeof a[e] === 'object' && typeof b[e] === 'object' && !Array.isArray(a[e])) {
            sub = ' {' + [...new Set([...Object.keys(a[e]), ...Object.keys(b[e])])].filter((x) => JSON.stringify(a[e][x]) !== JSON.stringify(b[e][x])).map((x) => (x in a[e] ? (x in b[e] ? '~' : '-') : '+') + x).join(' ') + '}';
          }
          parts.push((e in a ? (e in b ? '~' : '-') : '+') + e + sub);
        }
        inside = ' [' + parts.slice(0, 6).join(', ') + (parts.length > 6 ? ', and ' + (parts.length - 6) + ' more' : '') + ']';
      } else if (Array.isArray(a) && Array.isArray(b)) {
        // The stored programs: which fields of which program moved.
        const parts: string[] = [];
        b.forEach((p: any, i: number) => {
          const q = a[i] || {};
          for (const e of new Set([...Object.keys(p || {}), ...Object.keys(q)])) {
            if (JSON.stringify(p[e]) === JSON.stringify(q[e])) continue;
            if (p[e] && q[e] && typeof p[e] === 'object' && !Array.isArray(p[e])) parts.push(e + ' {' + [...new Set([...Object.keys(p[e]), ...Object.keys(q[e])])].filter((x) => JSON.stringify(p[e][x]) !== JSON.stringify(q[e][x])).map((x) => (x in q[e] ? (x in p[e] ? '~' : '-') : '+') + x).join(' ') + '}');
            else parts.push('~' + e);
          }
        });
        inside = ' [' + parts.join(', ') + ']';
      }
    } catch { /* not JSON */ }
    rows.push('`' + f + '`' + (pre[k] == null ? ' (new)' : post[k] == null ? ' (removed)' : '') + inside);
  }
  return rows.join('; ') || 'nothing';
}

say('## B. What each tap only the sheet has writes (the page\'s own functions)');
say();
say('`+` an entry added, `~` changed, `-` dropped.');
say();
say('| Step | On the page | Keys it changed | Toasts |');
say('|---|---|---|---|');
{
  const cfg = PROGRAMS['half-manny (Mario, NRC half, crossfit)']!;
  const P = new Phone().launch(CREATED);
  P.generate(cfg);
  const { first, start } = firstWeek(P, CREATED);
  const w = first;
  P.launch(at(start, 7 * (w - 1), '06:30'));
  const days = training(P, w);
  const lifts = days.filter((x) => ((P.day(w, x as never) || {}).sections || []).some((s: any) => (s.items || []).length));
  const d = lifts[0] || days[0]!;
  P.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d)));
  let ids = idsOf(P.dump());
  let Q = P;
  const step = (what: string, code: string, run: () => void): void => {
    const pre = Q.dump();
    const seen = Q.toasts.length;
    run();
    Q.settle();
    say('| ' + what + ' | `' + code + '` | ' + diff(pre, Q.dump(), ids) + ' | ' + (Q.toasts.slice(seen).join(' / ') || '') + ' |');
  };
  const D = JSON.stringify(d);
  const title = JSON.stringify(P.day(w, d as never).title || '');
  say('| | *' + 'week ' + w + ', ' + d + ', ' + (P.day(w, d as never).title || '') + (P.day(w, d as never).cardio ? ' (a day with a run beside the lift)' : '') + '* | | |');
  step('The sheet opens (a tap that reaches openDayKey)', 'openDayKey(day)', () => { P.open(w, d as never); });
  step('The effort slider moved to 7', 'updateRPEDisplay(7); persistLogFields(day)', () => { P.type('log_rpe', '7'); P.ev(`updateRPEDisplay(7);persistLogFields(${D});`); });
  step('Notes typed', 'persistLogFields(day)', () => { P.type('log_notes', 'Felt strong.'); P.ev(`persistLogFields(${D});`); });
  const add: string | null = P.ev(`(function(){var c=addCandidates(activeProg.weeks[${w}][${D}],${w},activeProg);return (c.gap||[])[0]||(c.more||[])[0]||(c.off||[])[0]||null;})()`);
  // An add redraws the sheet, which draws its log fields again from the store: the typed ones leave the page first.
  P.clearFields();
  step('The add button', 'openAddSheet()', () => { P.ev('openAddSheet();'); });
  if (add) {
    step('A move picked on the add sheet (' + add + ')', 'applyAddChoice(name)', () => { P.ev(`applyAddChoice(${JSON.stringify(add)});`); });
    step('The added move\'s remove', 'removeAddedExercise(name)', () => { P.ev(`removeAddedExercise(${JSON.stringify(add)});`); });
  }
  step('Back', 'closeDetail()', () => { P.ev('closeDetail();'); });
  // The sheet as drawn again holds the stored notes in its box, and an effort slider nobody has touched.
  P.type('log_notes', 'Felt strong.');
  step('Done', 'handleDayStatus(day, title, \'complete\')', () => { P.ev(`handleDayStatus(${D},${title},'complete');`); });
  step('Reopen, then Done ✓ tap to undo', 'openDayKey(day); handleDayStatus(day, title, \'complete\')', () => { P.clearFields(); P.ev(`openDayKey(${D});`); P.type('log_notes', 'Felt strong.'); P.ev(`handleDayStatus(${D},${title},'complete');`); });
  step('Skip', 'handleDayStatus(day, title, \'skipped\')', () => { P.ev(`handleDayStatus(${D},${title},'skipped');`); });
  step('Skipped ✕ tap to undo', 'handleDayStatus(day, title, \'skipped\')', () => { P.ev(`handleDayStatus(${D},${title},'skipped');`); });
  // A day of two parts: one skipped on This Week, then the sheet's Done takes the day whole.
  const two = days.find((x) => x !== d && (P.ev(`dayPartsOf(${w},${JSON.stringify(x)})`) as string[]).length > 1);
  if (two) {
    const T = JSON.stringify(two), tt = JSON.stringify(P.day(w, two as never).title || '');
    say('| | *a day of two parts: week ' + w + ', ' + two + '* | | |');
    step('This Week\'s Skip pill on its lift', 'skipPart(week, day, \'lift\')', () => { P.ev(`skipPart(${w},${T},'lift');`); });
    step('The sheet\'s Done on that day', 'handleDayStatus(day, title, \'complete\')', () => { P.ev(`currentWeek=${w};_setCurrentDayKey(${T});handleDayStatus(${T},${tt},'complete');`); });
  }
  // The program's last scheduled day: Done sets the season's latch, its undo lets it go.
  const fin = P.ev('finalScheduledDay()') as { week: number; d: string } | null;
  if (fin) {
    P.launch(at(start, 7 * (fin.week - 1) + DAYS.indexOf(fin.d)));
    P.settle();   // the launch's own timers (the day-after reminder) run before the step is read
    ids = idsOf(P.dump());
    const F = JSON.stringify(fin.d), ft = JSON.stringify((P.day(fin.week, fin.d as never) || {}).title || '');
    say('| | *the program\'s last scheduled day: week ' + fin.week + ', ' + fin.d + '* | | |');
    step('Done', 'handleDayStatus(day, title, \'complete\')', () => { P.ev(`currentWeek=${fin.week};_setCurrentDayKey(${F});handleDayStatus(${F},${ft},'complete');`); });
    step('Done ✓ tap to undo', 'handleDayStatus(day, title, \'complete\')', () => { P.ev(`handleDayStatus(${F},${ft},'complete');`); });
  }
  // The 1RM card: the first program of the ten that holds a test day.
  let tested = false;
  for (const [pname, c] of Object.entries(PROGRAMS)) {
    const T = new Phone().launch(CREATED);
    T.generate(walkable(c));
    const prog = T.prog;
    let hit: { w: number; d: string; lift: string } | null = null;
    for (const wk of Object.keys(prog.weeks)) for (const x of DAYS) { const day = prog.weeks[wk][x]; if (!hit && day && day.testLift) hit = { w: +wk, d: x, lift: String(day.testLift) }; }
    if (!hit) continue;
    tested = true;
    Q = T; ids = idsOf(T.dump());
    say('| | *the 1RM card: ' + pname + ', week ' + hit.w + ', ' + hit.d + ', test lift ' + hit.lift + '* | | |');
    // e1rm-card.ts save(): the estimate into the stored program's config and the active one's, then savePrograms.
    step('Save as new ' + hit.lift + ' max (225 for 3, so 248)', 'getPrograms; cfg[lift] = 248; savePrograms', () => {
      T.ev(`(function(){var ps=getPrograms();var p=ps.filter(function(x){return x&&x.id===activeProgId;})[0];if(p&&p.cfg){p.cfg[${JSON.stringify(hit!.lift)}]=248;if(activeProg&&activeProg.cfg)activeProg.cfg[${JSON.stringify(hit!.lift)}]=248;savePrograms(ps);}})()`);
    });
    break;
  }
  if (!tested) say('| | *the 1RM card: none of the ten programs holds a test day, so its save is not run here. `e1rm-card.ts` save() writes the estimate into the stored program\'s config and stores the programs (`ia_programs`).* | | |');
}
say();

// ── C. What the sheet has to draw ────────────────────────────────────────────────────────────────────────────────
{
  const tot: Record<string, number> = {}, mine: Record<string, number> = {};
  const addRows: number[] = [], moves: number[] = [];
  const kinds: Record<string, number> = {};
  for (const [pname, cfg] of Object.entries(PROGRAMS)) {
    const P = new Phone().launch(CREATED);
    P.generate(walkable(cfg));
    const prog = P.prog;
    const me = /half-manny/.test(pname);
    const count = (k: string): void => { bump(tot, k); if (me) bump(mine, k); };
    for (const wk of Object.keys(prog.weeks)) for (const d of DAYS) {
      const day = prog.weeks[wk][d];
      if (!day || day.rest) continue;
      count('training days');
      const secs = (day.sections || []) as any[];
      const lift = secs.some((s) => (s.items || []).length);
      if (lift) count('with lift work');
      if (lift && day.cardio) count('lift work and cardio together');
      if (!lift && day.cardio) count('cardio alone');
      if (day.testLift) count('with the 1RM card');
      if (day.note) count('with a note');
      if ((day.tags || []).filter((t: string) => t !== 'rest').length) count('with header tags');
      if (lift && !liftsFirst(secs.length > 0, prog.primaryPath, prog.liftingFocus)) count('cardio drawn above the lift work');
      if (secs.some((s) => s.superset || s.type === 'superset')) count('with a round');
      if (secs.some((s) => s.core)) count('with a core block');
      if (secs.some((s) => s.hip)) count('with a hip block');
      for (const s of secs) bump(kinds, s._added ? 'added' : s.superset || s.type === 'superset' ? 'round' : s.core ? 'core' : s.hip ? 'hip' : 'block');
      const items = secs.flatMap((s) => s.items || []);
      // The range nudge can only ever name a move whose dose reads "sets×lo–hi": every set at hi lights it.
      if (rangeNudge(items, (name: string) => { const m = /^(\d+)×(\d+)–(\d+)/.exec(String((items.find((i: any) => i.name === name) || {}).detail || '')); return m ? { setsDone: Array(+m[1]!).fill(+m[3]!) } : undefined; })) count('where the range nudge can show');
      if (lift) {
        P.IA.ctx['__d'] = day;
        const c = P.ev(`(function(){var c=addCandidates(__d,${+wk},activeProg);return [c.gap.length,c.more.length,c.off.length];})()`) as number[];
        addRows.push(c[0]! + c[1]! + c[2]!);
        if (c[0]! + c[1]! + c[2]! === 0) count('where the add sheet offers nothing');
        const pr = P.ev('sessionLogProgress(__d)') as { total: number };
        moves.push(pr.total);
      }
    }
  }
  const stat = (a: number[]): string => { const s = [...a].sort((x, y) => x - y); return s.length ? s[0] + ' to ' + s[s.length - 1] + ', middle ' + s[Math.floor(s.length / 2)] : 'none'; };
  say('## C. What the sheet has to draw (the ten programs as generated)');
  say();
  say('| The day\'s body | The ten programs | HALF_MANNY alone |');
  say('|---|---|---|');
  for (const k of ['training days', 'with lift work', 'lift work and cardio together', 'cardio alone', 'cardio drawn above the lift work', 'with the 1RM card', 'with a note', 'with header tags', 'with a round', 'with a core block', 'with a hip block', 'where the range nudge can show', 'where the add sheet offers nothing']) {
    say('| ' + k + ' | ' + (tot[k] || 0) + ' | ' + (mine[k] || 0) + ' |');
  }
  say();
  say('- Sections by kind, all days: ' + list(kinds) + '.');
  say('- Moves a day\'s counter counts (`sessionLogProgress`, days with lift work): ' + stat(moves) + '.');
  say('- Rows the add sheet offers (gap, more and off together, days with lift work): ' + stat(addRows) + '.');
}

say();
say('## D. Read from the code (not counted by this script)');
say();
say('- **How the sheet is reached today** (the Angular app, `week-view.ts` tap() and `cardio-sheet-model.ts` cardRoute): three taps. A done lift card\'s Reopen opens the whole day. A run, ride or swim card\'s Log button opens that cardio alone (D278). A done run\'s Reopen opens that cardio alone. Start lift and Start session open the deck, never the sheet. A rest day opens the rest sheet, which is another sheet.');
say('- **The sheet is also the redraw** of every edit made on it (`openDetail`): a skip, a put it back, a swap, its undo, an add, a remove, the nudge\'s yes, a status undo.');
say('- **The 1RM card** is drawn on a day the engine marks `testLift`: the last week of a strength program of six weeks or fewer (`budget-engine-d.ts`, `_twTag`). The day\'s note is set on the same days and on a hypertrophy program\'s peak week.');
say('- **Core\'s writers behind the sheet\'s own taps:** the effort slider and the notes: `recordDaySnapshot` (state-day-history), `writeDayLogs` (state-day-log), `settleDayParts` (state-day-status). Done, Skip and their undo: those three, then `clearDayParts`, `setDayStatus` or `clearDayStatus` (state-day-status), and on the last day\'s undo the season latch removed (`ia_season_shown_<id>`, the page\'s own `iaStore.remove`). Add and remove: `addAddEdit`, `dropAddEdit` (state-day-edits), then `refreshDaySnapshot` (state-day-history). The 1RM save: `writePrograms` (state-programs).');
say('- **Already called by the Expo app:** `recordDaySnapshot`, `refreshDaySnapshot`, `writeDayLogs`, `setDayStatus`, `clearDayParts`. **Not yet:** `clearDayStatus`, `settleDayParts`, `addAddEdit`, `dropAddEdit`, `writePrograms`.');
say('- **What the deck already covers** (same cards, same handlers, `session-sections.ts` drawn with `deck` on): the set rows and their plus and minus, the typed rep, the load field, one set\'s load, the reuse pill, fill every set, Log, skip and put it back for a move and a round, swap and its put it back, the swap nudge, Mark the day done with effort and notes (Call it), the completion pop-up.');
say('- **What only the sheet does:** the whole day on one page (every set shown, the prescription as one line of text, no folding); the header (week and day, title, tags, the travel tag, the logged counter, Back, RPE info, the add button); Done, Skip and each one\'s undo; the effort slider and the notes saved as they change; add and remove; the range nudge (Time to add weight); the logged but never marked nudge; the Wildcard tag; a double day\'s jog block; the 1RM card and the day\'s note; the cardio card, the cardio log and its wheels.');

writeFileSync(join(REPO, 'tests/measure/native-session-sheet_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
