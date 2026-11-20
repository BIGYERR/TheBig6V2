// native-program-list: today's program list and its sheets (the goal sheet, the mile pencil and its lock, the injury
// and travel sheet with its chip, the rest day sheet, the coach's mile nudge), before the Expo app draws them
// (MIGRATION.md phase 3, row 5). Read-only (measure). It runs today's page in the VM harness on the test phone of
// tests/support/stored-state.ts, draws each screen through the Angular screen's own models
// (frontends/app/src/app/screens/program-list, goal-sheet, mile-sheet, change-sheet, mile-nudge) handed the page's
// readers, and reads the stored keys, the grid in hand and the page's own calls before and after each tap.
//
// A. What the list draws on the ten programs, at each of the five stretches of the standard history.
// B. The list's taps (rename, Set Active, Archive, Delete Forever), a second program beside: keys, rebuilds, switches.
// C. The goal sheet: what it lists, and what each switch writes and rebuilds.
// D. The mile pencil: the lock, the refusals, and what a new mile writes and rebuilds.
// E. Injury and travel: what the sheet lists, and what Apply, Remove, I'm back and the check in write and rebuild.
// F. The rest day sheet: where it opens, what Move, Log and Clear write.
// G. The coach's mile nudge on the standard history.
//
// Usage: cd tests && node measure/native-program-list_today.ts   (writes tests/measure/native-program-list_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { DAYS, Phone, at, life } from '../support/stored-state.ts';
import { programList } from '../../frontends/app/src/app/screens/program-list/program-list-model.ts';
import { programDetail } from '../../frontends/app/src/app/screens/program-list/program-detail-model.ts';
import { goalSheetView } from '../../frontends/app/src/app/screens/goal-sheet/goal-sheet-model.ts';
import { mileLockFacts, mileLocked } from '../../frontends/app/src/app/screens/mile-sheet/mile-sheet-model.ts';
import { changeSheetView } from '../../frontends/app/src/app/screens/change-sheet/change-sheet-model.ts';
import { judgeNudge } from '../../frontends/app/src/app/screens/mile-nudge/mile-nudge-model.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};
const NAMES = Object.keys(PROGRAMS);
const CFGS = Object.values(PROGRAMS).map(walkable);

/** The stored keys that differ, by family, the program each belongs to named by its role. */
function diff(pre: Record<string, string>, post: Record<string, string>, roles: Record<string, string>): string {
  const ids = [...new Set([...idsOf(pre), ...idsOf(post), ...Object.keys(roles)])].sort((a, b) => b.length - a.length);
  const fam = (k: string): string => { let f = k; for (const id of ids) f = f.split(id).join('<' + (roles[id] || 'id') + '>'); return f; };
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    rows.push('`' + fam(k) + '`' + (pre[k] == null ? ' new' : post[k] == null ? ' removed' : ' changed'));
  }
  return rows.join(', ') || 'nothing';
}

const nowIso = (P: Phone): string => P.ev("(function(){var d=new Date();var p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())+':00';})()");
interface Snap { keys: Record<string, string>; iso: string }
const snap = (P: Phone): Snap => ({ keys: P.dump(), iso: nowIso(P) });
/** A phone holding a snapshot's keys, launched at its instant (or another). */
function phoneOf(s: Snap, iso = s.iso): Phone {
  const P = new Phone();
  for (const [k, v] of Object.entries(s.keys)) P.damage(k, v);
  P.launch(iso);
  P.settle();
  return P;
}

/** Counts the page's own calls from here on: a rebuild, a build, a switch, the past days marked as asked, a save. */
const WATCHED = ['refreshProgram', 'buildProgram', 'loadActiveProgram', 'markPastAsked', 'savePrograms', 'renderWeekView', 'renderProgList', 'popFire'];
function watch(P: Phone): void {
  P.IA.ctx['__n'] = {};
  if (P.IA.ctx['__watched']) return;
  P.IA.ctx['__watched'] = true;
  for (const f of WATCHED) P.ev(`${f}=(function(o){return function(){__n.${f}=(__n.${f}||0)+1;return o.apply(this,arguments);};})(${f});`);
  P.ev('showScreen=(function(o){return function(s){__n.screen=s;return o.apply(this,arguments);};})(showScreen);');
}
const counts = (P: Phone): Record<string, any> => JSON.parse(P.ev('JSON.stringify(__n)'));
const gridOf = (P: Phone): Record<string, string> => JSON.parse(P.ev("(function(){var o={};if(!activeProg||!activeProg.weeks)return '{}';Object.keys(activeProg.weeks).forEach(function(w){Object.keys(activeProg.weeks[w]).forEach(function(d){o['w'+w+'_'+d]=JSON.stringify(activeProg.weeks[w][d]);});});return JSON.stringify(o);})()"));
const trainedOf = (P: Phone): Set<string> => new Set(JSON.parse(P.ev("JSON.stringify(Object.keys(getLogs()).concat(Object.keys(getCompleted())))")) as string[]);

interface Tap { wrote: string; n: Record<string, number>; toasts: string[]; active: [string | null, string | null]; days: { changed: number; trained: number; of: number }; screen: string }
/** One tap on a phone: what it wrote, what it called, what it said, and what the grid in hand became. */
function tap(P: Phone, code: string, roles: Record<string, string>): Tap {
  P.settle();
  watch(P);
  const pre = P.dump(), t0 = P.toasts.length, a0: string | null = P.ev('activeProgId'), g0 = gridOf(P), trained = trainedOf(P);
  P.ev(code); P.settle();
  const g1 = gridOf(P);
  let changed = 0, tr = 0;
  const same = P.ev('activeProgId') === a0;
  if (same) for (const k of new Set([...Object.keys(g0), ...Object.keys(g1)])) if (g0[k] !== g1[k]) { changed++; if (trained.has(k)) tr++; }
  const n = counts(P), screen: string = n['screen'] || '';
  return { wrote: diff(pre, P.dump(), roles), n, toasts: P.toasts.slice(t0), active: [a0, P.ev('activeProgId')], days: { changed: same ? changed : -1, trained: tr, of: Object.keys(g1).length }, screen };
}
const calls = (n: Record<string, number>): string => ['refreshProgram', 'buildProgram', 'loadActiveProgram', 'markPastAsked', 'popFire'].filter((f) => n[f]).map((f) => f + ' ' + n[f]).join(', ') || 'none';
/** Rows that say the same thing on several programs, folded into one with its count. */
class Fold {
  rows = new Map<string, { n: number; first: string }>();
  add(key: string, who: string): void { const r = this.rows.get(key); if (r) r.n++; else this.rows.set(key, { n: 1, first: who }); }
  print(of: number): void { for (const [k, r] of this.rows) say(k + ' | ' + r.n + ' of ' + of + (r.n < of ? ' (first: ' + r.first + ')' : '') + ' |'); }
}

// ── The ten programs through the standard history, a snapshot at each stretch ──
const STAGES = ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away'];
const snaps: Record<string, Record<string, Snap>> = {};
for (let i = 0; i < CFGS.length; i++) {
  const mine: Record<string, Snap> = {};
  life(CFGS[i], CREATED, undefined, (stage, P) => { mine[stage] = snap(P); });
  snaps[NAMES[i]!] = mine;
}

/** The list as program-list.ts draws it, from the page's own readers. */
function listOf(P: Phone): { cards: any[]; details: any[]; empty: string | null } {
  const call = (name: string, ...a: unknown[]): any => (P.ev(name) as (...x: unknown[]) => unknown)(...a);
  const all = call('getPrograms');
  const v = programList(all, { activeId: call('getActiveProgId'), openIds: P.ev('openProgIds'), editId: P.ev('editProgId'), confirmId: P.ev('confirmProgId'), confirmTier: P.ev('confirmTier') }, (k, s) => call('asyIcon', k, s));
  const details = v.cards.map((c) => {
    const p = all.find((x: any) => x.id === c.id);
    const s = call('progSelData', p);
    const paces = s.runAnchor ? { chips: call('runAnchorChips', s.runAnchor), sentence: call('runAnchorSentence', s.runAnchor) } : null;
    return { view: programDetail(p.id, s, { dayNames: P.ev('_DAYF'), goalLabels: P.ev('_GOAL_LABELS') }, paces), anchor: s.runAnchor };
  });
  return { cards: v.cards, details, empty: v.empty };
}
const plain = (s: string): string => String(s).replace(/<svg[\s\S]*?<\/svg>/g, '▢').replace(/<br>/g, ' / ').replace(/<[^>]+>/g, '').trim();

// ── A. What the list draws ──────────────────────────────────────────────────
say('# Today\'s program list and its sheets (measure, before the Expo app draws them)');
say();
say('Written by `cd tests && node measure/native-program-list_today.ts` (read-only). Zone America/New_York.');
say();
say('## A. What the list draws: the ten programs, one stored, at each of the five stretches');
say();
say('| Program | The card\'s meta line | Detail rows (focus, profile, schedule) | 1RM chips (est.) | Pace chips, and where the mile comes from | Cardio rows (pencils) | Event rows | Changes across the stretches |');
say('|---|---|---|---|---|---|---|---|');
const kinds = { cards: 0, rows: 0, liftChips: 0, est: 0, paceGroups: 0, paceChips: 0, cardioRows: 0, liftOnly: 0, eventGroups: 0, eventRows: 0, seeds: 0, sentence: {} as Record<string, number>, chipNames: {} as Record<string, number>, chipUnits: {} as Record<string, number> };
for (const name of NAMES) {
  const per: string[] = []; let first: any = null;
  for (const st of STAGES) {
    const P = phoneOf(snaps[name]![st]!);
    const L = listOf(P);
    const c = L.cards[0], d = L.details[0];
    if (!c || !d) { per.push('none'); continue; }
    const v = d.view;
    kinds.cards++; kinds.rows += v.focus.length + v.profile.length + v.schedule.length; kinds.liftChips += v.lifts.length; if (v.estimated) kinds.est++;
    if (v.paces) { kinds.paceGroups++; kinds.paceChips += v.paces.chips.length; const k = d.anchor.clamped ? 'clamped' : d.anchor.kind; kinds.sentence[k] = (kinds.sentence[k] || 0) + 1; v.paces.chips.forEach((x: any) => { kinds.chipNames[x.k] = (kinds.chipNames[x.k] || 0) + 1; kinds.chipUnits[x.u] = (kinds.chipUnits[x.u] || 0) + 1; }); }
    if (v.cardio) kinds.cardioRows += v.cardio.length; else kinds.liftOnly++;
    if (v.event) { kinds.eventGroups++; kinds.eventRows += v.event.length; }
    if (v.seed) kinds.seeds++;
    per.push(JSON.stringify([c.metaHtml, v]));
    if (!first) first = { c, d };
  }
  const v = first.d.view;
  const varies = STAGES.filter((_, i) => i > 0 && per[i] !== per[i - 1]).length;
  say('| ' + name + ' | ' + plain(first.c.metaHtml) + ' | ' + v.focus.length + ', ' + v.profile.length + ', ' + v.schedule.length + ' | ' + v.lifts.length + (v.estimated ? ' (est.)' : '') + ' | ' + (v.paces ? v.paces.chips.length + ': ' + v.paces.chips.map((x: any) => x.k).join(' ') + '; ' + (first.d.anchor.clamped ? 'clamped' : first.d.anchor.kind) : 'none') + ' | ' + (v.cardio ? v.cardio.length : 'Lift only') + ' | ' + (v.event ? v.event.map((r: any) => r.k).join(', ') : 'none') + ' | ' + (varies ? varies + ' of 4 steps' : 'none') + ' |');
}
say();
say('- Cards drawn: ' + kinds.cards + ' (10 programs, five stretches). Detail rows ' + kinds.rows + ', 1RM chips ' + kinds.liftChips + ' (marked est. on ' + kinds.est + ' cards).');
say('- Run paces: ' + kinds.paceGroups + ' groups, ' + kinds.paceChips + ' chips. Chip names: ' + Object.entries(kinds.chipNames).map(([k, n]) => k + ' ' + n).join(', ') + '. Units: ' + Object.entries(kinds.chipUnits).map(([k, n]) => '`' + k + '` ' + n).join(', ') + '.');
say('- The sentence under the paces, by where the mile comes from: ' + (Object.entries(kinds.sentence).map(([k, n]) => k + ' ' + n).join(', ') || 'none') + '. (The kinds the builder has: default, entered, seeded, edited, clamped fast, clamped slow, clamped not a time.)');
say('- Cardio rows with a pencil: ' + kinds.cardioRows + '; Lift only cards: ' + kinds.liftOnly + '. Event groups: ' + kinds.eventGroups + ' (' + kinds.eventRows + ' rows). Seeds printed: ' + kinds.seeds + '.');
say('- Not drawn by any of these: the empty list (two lines), a card being renamed, the two confirm tiers, a second card, an archived program (it leaves the list). Section B makes them.');
say();

// ── B. The list's taps ──────────────────────────────────────────────────────
say('## B. The list\'s taps, on each of the ten programs at the end of the third week');
say();
say('"first" is the walked program (three weeks of history); "second" is a program made the wizard\'s way beside it, which the wizard leaves active. Each tap runs on a phone of its own.');
say();
say('| Tap | The page\'s call | Keys written | The page called | Toast | Active after | Screen after | Programs |');
say('|---|---|---|---|---|---|---|---|');
{
  const folds: Record<string, Fold> = {};
  const owned = { lo: 99, hi: 0 };
  const row = (label: string, callText: string, t: Tap, roles: Record<string, string>, who: string): void => {
    const gone = t.wrote.split(', ').filter((x) => /^`ia_[a-z_]+_<(first|second)>` removed$/.test(x));
    if (gone.length > 3) { owned.lo = Math.min(owned.lo, gone.length); owned.hi = Math.max(owned.hi, gone.length); t.wrote = t.wrote.split(', ').filter((x) => !gone.includes(x)).concat('every key the ' + (/<first>/.test(gone[0]!) ? 'first' : 'second') + ' owns removed').join(', '); }
    const act = t.active[1] == null ? 'none' : (roles[t.active[1]] || 'other');
    (folds[label] ||= new Fold()).add('| ' + label + ' | `' + callText + '` | ' + t.wrote + ' | ' + calls(t.n) + ' | ' + (t.toasts.join(' / ') || 'none') + ' | ' + act + ' | ' + (t.screen || 'as before'), who);
  };
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i]!, one = snaps[name]!['3 third week']!;
    // One program stored.
    {
      const P = phoneOf(one); const id: string = P.ev('activeProgId'); const roles = { [id]: 'first' };
      row('Open a card, close it', 'toggleProgCard(id) twice', tap(P, `openProgIds.add(${JSON.stringify(id)});renderProgList();openProgIds.delete(${JSON.stringify(id)});renderProgList();`, roles), roles, name);
      row('The pencil by the name', 'startRename(id)', tap(P, `try{startRename(${JSON.stringify(id)})}catch(e){}`, roles), roles, name);   // the harness's stub has no select()
      P.type('renameInput_' + id, '  A new name that runs past the forty characters allowed  ');
      row('Rename: Save', 'commitRename(id)', tap(P, `commitRename(${JSON.stringify(id)})`, roles), roles, name);
      row('Copy selections', 'copyProgSel(id)', tap(P, `copyProgSel(${JSON.stringify(id)})`, roles), roles, name);
      row('Archive (first tap)', 'askArchive(id)', tap(P, `askArchive(${JSON.stringify(id)})`, roles), roles, name);
      row('Delete forever… (the link)', 'askPurge(id)', tap(P, `askPurge(${JSON.stringify(id)})`, roles), roles, name);
      row('Cancel', 'cancelConfirm()', tap(P, 'cancelConfirm()', roles), roles, name);
      row('Archive the only program', 'archiveProg(id)', tap(P, `askArchive(${JSON.stringify(id)});archiveProg(${JSON.stringify(id)})`, roles), roles, name);
    }
    {
      const P = phoneOf(one); const id: string = P.ev('activeProgId'); const roles = { [id]: 'first' };
      row('Delete Forever, the only program', 'deleteProg(id)', tap(P, `deleteProg(${JSON.stringify(id)})`, roles), roles, name);
    }
    // Two programs: the second made on the phone, a day later.
    const Q = phoneOf(one); const first: string = Q.ev('activeProgId');
    const second = Q.generate(CFGS[i === 5 ? 0 : 5]);
    const two = snap(Q); const roles = { [first]: 'first', [second]: 'second' };
    const on = (label: string, callText: string, code: string, before = ''): void => { const P = phoneOf(two); if (before) { P.ev(before); P.settle(); } row(label, callText, tap(P, code, roles), roles, name); };
    on('Set Active on the first', 'setActive(first)', `setActive(${JSON.stringify(first)})`);
    on('Archive the first (not active)', 'archiveProg(first)', `archiveProg(${JSON.stringify(first)})`);
    on('Archive the second (active): the first takes over', 'archiveProg(second)', `archiveProg(${JSON.stringify(second)})`);
    on('Delete Forever the first (not active)', 'deleteProg(first)', `deleteProg(${JSON.stringify(first)})`);
    on('Delete Forever the second (active): the first takes over', 'deleteProg(second)', `deleteProg(${JSON.stringify(second)})`);
    on('Delete Forever the first while active: the second takes over', 'deleteProg(first)', `deleteProg(${JSON.stringify(first)})`, `setActive(${JSON.stringify(first)})`);
  }
  for (const f of Object.values(folds)) f.print(NAMES.length);
  say();
  say('- "Every key the program owns": the fifteen families of purgeProgData. A walked program held ' + owned.lo + ' to ' + owned.hi + ' of them.');
  say('- A rebuild is `refreshProgram` (core\'s refreshStoredProgram); `buildProgram` counts the engine builds inside it (one, and one more for each overlay it splices).');
}
say();

// ── C. The goal sheet ───────────────────────────────────────────────────────
say('## C. The goal sheet');
say();
function goalView(P: Phone, progId: string, sport: string, sel: string | null): any {
  const p = (P.ev('getPrograms()') as any[]).find((x) => x.id === progId);
  const week: number = (P.ev('_goalCurWeek') as (x: unknown) => number)(p);
  return goalSheetView({
    draft: { progId, sport, sel, inputs: {} }, sportLabel: P.ev('_CARDIO_LABELS')[sport] || sport, current: (p.cfg && p.cfg.cardioGoals && p.cfg.cardioGoals[sport]) || null,
    path: p.cfg && p.cfg.primaryPath, choices: P.ev('CARDIO_GOALS_BY_TYPE')[sport] || [], excluded: P.ev('HYBRID_EXCLUDED_GOALS'), rank: P.ev('_GOAL_RANK'), needsInputs: P.ev('_GOAL_REQ_INPUTS'), started: !!p.startDate && week > 1, week,
  });
}
say('| Program, sport | Options listed (a step up) | Need a target typed | Switches made | Keys written | The page called | Days of the grid changed (trained ones) | Toast |');
say('|---|---|---|---|---|---|---|---|');
const goalTally = { sheets: 0, options: 0, ups: 0, inputs: 0, switches: 0, moved: 0, trainedMoved: 0, decisions: { up: 0, plain: 0 }, started: 0 };
for (const name of NAMES) {
  const base = snaps[name]!['3 third week']!;
  const P0 = phoneOf(base); const id: string = P0.ev('activeProgId');
  const sports: string[] = JSON.parse(P0.ev('JSON.stringify((activeProg.cfg&&activeProg.cfg.cardioTypes)||[])'));
  for (const sport of sports) {
    const v0 = goalView(P0, id, sport, null);
    goalTally.sheets++; goalTally.options += v0.options.length;
    const picks = v0.options.filter((o: any) => !o.current);
    let ups = 0, needs = 0; const wrote = new Set<string>(), called = new Set<string>(), toasts = new Set<string>(); let lo = 1e9, hi = 0, tr = 0;
    for (const o of picks) {
      const P = phoneOf(base);
      const v = goalView(P, id, sport, o.id);
      if (v.decision.up) { ups++; goalTally.decisions.up++; } else goalTally.decisions.plain++;
      if (v.decision.inputs) needs++;
      if (/week \d+ of a bigger build|may finish mixed/.test(v.decision.body)) goalTally.started++;
      const inputs = v.decision.inputs === 'pace' ? "_goalSetInput('targetDist','1.5');_goalSetInput('targetMins','12');_goalSetInput('targetSecs','0');" : v.decision.inputs === 'time' ? "_goalSetInput('targetMins','9');_goalSetInput('targetSecs','30');" : '';
      const t = tap(P, `openGoalSheet(${JSON.stringify(id)},${JSON.stringify(sport)});selectGoalOpt(${JSON.stringify(o.id)});${inputs}commitGoalChange();`, { [id]: 'id' });
      wrote.add(t.wrote); called.add(calls(t.n)); t.toasts.forEach((x) => toasts.add(x));
      lo = Math.min(lo, t.days.changed); hi = Math.max(hi, t.days.changed); tr += t.days.trained;
      goalTally.switches++; if (t.days.changed > 0) goalTally.moved++; goalTally.trainedMoved += t.days.trained;
    }
    goalTally.ups += ups; goalTally.inputs += needs;
    say('| ' + name + ', ' + sport + ' | ' + v0.options.length + ' (' + ups + ') | ' + needs + ' | ' + picks.length + ' | ' + [...wrote].join(' or ') + ' | ' + [...called].join(' or ') + ' | ' + lo + ' to ' + hi + ' of ' + Object.keys(gridOf(P0)).length + ' (' + tr + ') | ' + [...toasts].join(' / ') + ' |');
  }
}
say();
say('- Sheets: ' + goalTally.sheets + ' (a sport of a program), ' + goalTally.options + ' options listed, ' + goalTally.switches + ' switches made (every option but the current one).');
say('- The decision panel: a step up ' + goalTally.decisions.up + ', a plain switch ' + goalTally.decisions.plain + '; a target typed on ' + goalTally.inputs + '; the started wording on ' + goalTally.started + '.');
say('- A switch changed the grid on ' + goalTally.moved + ' of ' + goalTally.switches + '; days already logged or marked that changed: ' + goalTally.trainedMoved + '.');
{
  // A program that is not the active one: the switch is a stored edit alone.
  const base = snaps[NAMES[0]!]!['3 third week']!; const Q = phoneOf(base); const first: string = Q.ev('activeProgId'); const second = Q.generate(CFGS[5]); const P = phoneOf(snap(Q));
  const t = tap(P, `openGoalSheet(${JSON.stringify(first)},'run');selectGoalOpt('run_10k');commitGoalChange();`, { [first]: 'first', [second]: 'second' });
  say('- On a program that is not active (' + NAMES[0] + ' beside a second): wrote ' + t.wrote + '; the page called ' + calls(t.n) + '.');
  const P2 = phoneOf(base);
  const t2 = tap(P2, `openGoalSheet(${JSON.stringify(first)},'run');selectGoalOpt('run_pace_goal');commitGoalChange();`, { [first]: 'id' });
  say('- Make the switch with a target missing (the pace goal, nothing typed): wrote ' + t2.wrote + '; toast ' + (t2.toasts.join(' / ') || 'none') + ' (the button is greyed and takes no tap).');
}
say();

// ── D. The mile pencil ──────────────────────────────────────────────────────
say('## D. The mile pencil');
say();
say('| Program | Pencil shown | Locked at each stretch (week of weeks) | A new mile (9:30): keys written | The page called | Days changed (trained ones) | Source after | Toast |');
say('|---|---|---|---|---|---|---|---|');
const mileTally = { shown: 0, commits: 0, trainedMoved: 0, locked: 0, opens: 0 };
for (const name of NAMES) {
  const locks: string[] = []; let shown = false;
  for (const st of STAGES) {
    const P = phoneOf(snaps[name]![st]!);
    const p = (P.ev('getPrograms()') as any[])[0]; const week: number = (P.ev('_goalCurWeek') as (x: unknown) => number)(p); const tw = p.totalWeeks || 6;
    shown = !!(P.ev('progSelData') as (x: unknown) => any)(p).runAnchor;
    if (shown) { mileTally.opens++; if (mileLocked(week, tw)) mileTally.locked++; }
    locks.push((mileLocked(week, tw) ? 'locked ' : 'open ') + week + '/' + tw);
  }
  if (!shown) { say('| ' + name + ' | no | | | | | | |'); continue; }
  mileTally.shown++;
  const P = phoneOf(snaps[name]!['1 first week']!); const id: string = P.ev('activeProgId');
  P.ev(`openMileSheet(${JSON.stringify(id)})`); P.type('mileSheetMins', '9'); P.type('mileSheetSecs', '30');
  const t = tap(P, 'commitMileChange()', { [id]: 'id' });
  mileTally.commits++; mileTally.trainedMoved += t.days.trained;
  const a = (P.ev('progSelData') as (x: unknown) => any)((P.ev('getPrograms()') as any[])[0]).runAnchor;
  say('| ' + name + ' | yes | ' + locks.join(', ') + ' | ' + t.wrote + ' | ' + calls(t.n) + ' | ' + t.days.changed + ' of ' + t.days.of + ' (' + t.days.trained + ') | ' + (a.clamped ? 'clamped' : a.kind) + ', from ' + JSON.stringify(a.from) + ' | ' + t.toasts.join(' / ') + ' |');
}
say();
say('- The pencil shows on ' + mileTally.shown + ' of 10 programs (a run goal that reads the pace chart). Opened at ' + mileTally.opens + ' stretches, the lock stood on ' + mileTally.locked + '. Trained days a new mile changed: ' + mileTally.trainedMoved + '.');
{
  const name = NAMES[0]!; const base = snaps[name]!['1 first week']!;
  const refuse = (label: string, m: string, s: string): void => {
    const P = phoneOf(base); const id: string = P.ev('activeProgId');
    P.ev(`openMileSheet(${JSON.stringify(id)})`); P.type('mileSheetMins', m); P.type('mileSheetSecs', s);
    const t = tap(P, 'commitMileChange()', { [id]: 'id' });
    say('- ' + label + ' (`' + m + '`:`' + s + '`): wrote ' + t.wrote + '; toast: ' + (t.toasts.join(' / ') || 'none') + '.');
  };
  refuse('A blank field', '', '30'); refuse('Not a time', '9', '75'); refuse('Faster than the chart', '3', '30'); refuse('Slower than the chart', '25', '0'); { const P = phoneOf(base); const g = P.ev('activeProg.cfg.cardioGoals.run'); refuse('The same mile again', String(g.mileBestMins), String(g.mileBestSecs)); }
  // The lock, three weeks from the end, with a race date and without.
  for (const n of [NAMES[0]!, NAMES[6]!]) {
    const s0 = snaps[n]!['3 third week']!; const P1 = phoneOf(s0); const p = (P1.ev('getPrograms()') as any[])[0]; const tw = p.totalWeeks || 6;
    const P = phoneOf(s0, at(String(p.startDate).slice(0, 10), 7 * (tw - 3) + 1, '09:00'));
    const q = (P.ev('getPrograms()') as any[])[0]; const week: number = (P.ev('_goalCurWeek') as (x: unknown) => number)(q);
    const facts = mileLockFacts(q.cfg && q.cfg.raceDate, week, tw, { countdown: (iso) => (P.ev('raceCountdown') as any)(iso), words: (cd) => (P.ev('raceCountdownWords') as any)(cd), day: (iso) => (P.ev('_fmtStartDay') as any)(iso, true) });
    const t = tap(P, `openMileSheet(${JSON.stringify(q.id)})`, { [q.id]: 'id' });
    say('- The lock on ' + n + ' in week ' + week + ' of ' + tw + ': locked ' + mileLocked(week, tw) + ', facts ' + facts.map((f) => f.k).join(', ') + '; the tap wrote ' + t.wrote + '.');
  }
}
say();

// ── E. Injury and travel ────────────────────────────────────────────────────
say('## E. Injury and travel (the sheet, the chip, the check in)');
say();
const deps = (P: Phone): any => { const prog = P.ev('activeProg'); const tw = (prog && prog.totalWeeks) || 0; const f = (n: string) => P.ev(n) as (...a: unknown[]) => any;
  return { fmtDate: (iso: any) => f('_fmtDate')(iso), fmtDateWd: (iso: any) => f('_fmtDateWd')(iso), dayCount: (a: any, b: any) => f('_dayCount')(a, b), dayCountWord: (n: any) => f('_dayCountWord')(n), inProgram: (ov: any) => !!f('overlayWeekRange')(prog, ov, tw), backCopy: (ov: any) => f('overlayBackCopy')(prog, ov) }; };
{
  const P = phoneOf(snaps[NAMES[0]!]!['1 first week']!);
  P.ev('openOverlaySheet()'); const tv = changeSheetView(JSON.parse(P.ev('JSON.stringify(_ovDraft)')), P.ev('INJURY_REGIONS'), deps(P));
  P.ev('openInjurySheet()'); const iv0 = changeSheetView(JSON.parse(P.ev('JSON.stringify(_ovDraft)')), P.ev('INJURY_REGIONS'), deps(P));
  P.ev("_ovSet('injRegion','knee')"); const iv1 = changeSheetView(JSON.parse(P.ev('JSON.stringify(_ovDraft)')), P.ev('INJURY_REGIONS'), deps(P));
  P.ev("_ovSet('injRegion','other')"); const iv2 = changeSheetView(JSON.parse(P.ev('JSON.stringify(_ovDraft)')), P.ev('INJURY_REGIONS'), deps(P));
  say('- Traveling? opens: "' + tv.kicker + '", "' + tv.title + '"; ' + tv.travel!.cards.length + ' cards (' + tv.travel!.cards.map((c) => c.name).join(', ') + '), ' + (tv.travel!.dates ? tv.travel!.dates.length : 0) + ' date boxes, an effect panel of ' + tv.travel!.effect.subs.length + ' lines, the button `' + tv.travel!.action + '`. Opening wrote nothing; the draft starts today through 13 days on, Mini gym.');
  say('- Hurt? opens: "' + iv0.kicker + '", "' + iv0.title + '"; ' + iv0.injury!.regions.length + ' region cards (' + iv0.injury!.regions.map((c) => c.name).join(', ') + '), no tiers, no button until a region is picked. A region picked: ' + (iv1.injury!.tiers ? iv1.injury!.tiers.length : 0) + ' tiers, an effect panel of ' + (iv1.injury!.effect ? iv1.injury!.effect.subs.length : 0) + ' lines, ' + (iv1.injury!.dates ? iv1.injury!.dates.length : 0) + ' date box, the button `' + iv1.injury!.action + '`. Neck / something else: ' + (iv2.injury!.effect ? iv2.injury!.effect.subs.length : 0) + ' line, the button `' + iv2.injury!.action + '`.');
}
say();
say('| Tap | The page\'s call | Keys written | The page called | Days changed (trained ones), least to most | Toast or pop-up | Programs |');
say('|---|---|---|---|---|---|---|');
{
  const acc: Record<string, { call: string; wrote: Set<string>; called: Set<string>; lo: number; hi: number; tr: number; said: Set<string>; n: number }> = {};
  const note = (label: string, call: string, t: Tap, pop = ''): void => {
    const a = (acc[label] ||= { call, wrote: new Set(), called: new Set(), lo: 1e9, hi: -1, tr: 0, said: new Set(), n: 0 });
    a.wrote.add(t.wrote); a.called.add(calls(t.n)); a.lo = Math.min(a.lo, t.days.changed); a.hi = Math.max(a.hi, t.days.changed); a.tr += t.days.trained; a.n++;
    t.toasts.forEach((x) => a.said.add(x)); if (pop) a.said.add(pop);
  };
  const popMsg = (P: Phone): string => { try { return String(P.ev("(function(){var e=document.getElementById('popMsg');return (typeof _popLast!=='undefined'&&_popLast&&_popLast.msg)||'';})()") || ''); } catch { return ''; } };
  for (const name of NAMES) {
    const base = snaps[name]!['1 first week']!;
    const P0 = phoneOf(base); const id: string = P0.ev('activeProgId'); const roles = { [id]: 'id' };
    const today: string = P0.ev('_isoToday()');
    for (const [region, tier] of [['knee', 'workaround'], ['knee', 'protect'], ['shoulder', 'workaround'], ['shoulder', 'protect'], ['lowback', 'protect'], ['elbow', 'workaround']] as const) {
      const P = phoneOf(base);
      note('Hurt? Apply change (' + tier + ')', 'applyInjuryDraft()', tap(P, `openInjurySheet();_ovSet('injRegion','${region}');_ovSet('injTier','${tier}');applyInjuryDraft();`, roles));
      if (region === 'knee' && tier === 'protect') {
        const ov: string = P.ev('activeProg.overlays[activeProg.overlays.length-1].id');
        const Pb = phoneOf(snap(P));
        note('The chip: I\'m back (run was held back: two return weeks)', 'imBackFromInjury(id)', tap(Pb, `imBackFromInjury(${JSON.stringify(ov)})`, roles), 'pop-up: Back in');
        const Pr = phoneOf(snap(P));
        note('The chip: ✕ (remove the change)', 'removeOverlay(id)', tap(Pr, `removeOverlay(${JSON.stringify(ov)})`, roles));
        // Fourteen days on, the check in card stands on This Week.
        const later = at(today, 15, '09:00');
        for (const ans of ['better', 'same', 'worse']) { const Pc = phoneOf(snap(P), later); note('The check in: ' + ans, `injReassess(id,'${ans}')`, tap(Pc, `injReassess(${JSON.stringify(ov)},'${ans}')`, roles), ans === 'same' ? '' : 'pop-up: Check in'); }
      }
      if (region === 'elbow') { const ov: string = P.ev('activeProg.overlays[activeProg.overlays.length-1].id'); const Pb = phoneOf(snap(P)); note('The chip: I\'m back (run never held back: one return week)', 'imBackFromInjury(id)', tap(Pb, `imBackFromInjury(${JSON.stringify(ov)})`, roles), 'pop-up: Back in'); }
    }
    for (const eq of ['bodyweight', 'home_basic']) {
      const P = phoneOf(base);
      note('Traveling? Apply change (' + (eq === 'bodyweight' ? 'Room only' : 'Mini gym') + ', today through 13 days on)', 'applyOverlayDraft()', tap(P, `openOverlaySheet();_ovSet('equipment','${eq}');applyOverlayDraft();`, roles));
      if (eq === 'bodyweight') { const ov: string = P.ev('activeProg.overlays[activeProg.overlays.length-1].id'); const Pr = phoneOf(snap(P)); note('The chip: ✕ on a travel change', 'removeOverlay(id)', tap(Pr, `removeOverlay(${JSON.stringify(ov)})`, roles)); }
    }
    { const P = phoneOf(base); note('Traveling? Full gym: Got it', 'applyOverlayDraft()', tap(P, "openOverlaySheet();_ovSet('equipment','commercial');applyOverlayDraft();", roles)); }
    { const P = phoneOf(base); note('Traveling? dates outside the program', 'applyOverlayDraft()', tap(P, "openOverlaySheet();_ovSet('from','2031-01-06');_ovSet('to','2031-01-10');applyOverlayDraft();", roles)); }
    { const P = phoneOf(base); note('Hurt? no region picked', 'applyInjuryDraft()', tap(P, 'openInjurySheet();applyInjuryDraft();', roles)); }
    void popMsg;
  }
  for (const [label, a] of Object.entries(acc)) say('| ' + label + ' | `' + a.call + '` | ' + [...a.wrote].join(' or ') + ' | ' + [...a.called].join(' or ') + ' | ' + a.lo + ' to ' + a.hi + ' (' + a.tr + ') | ' + ([...a.said].join(' / ') || 'none') + ' | ' + a.n + ' taps |');
}
say();

// ── F. The rest day sheet ───────────────────────────────────────────────────
say('## F. The rest day sheet');
say();
say('| Program | Rest days in the first week | Where the sheet opens (the day has come) | Where Move is offered | Sessions offered to move | A spacing warning on a pick |');
say('|---|---|---|---|---|---|');
const restTally = { days: 0, opens: 0, moves: 0, cands: 0, warns: 0 };
const restRows: Record<string, { call: string; wrote: Set<string>; called: Set<string>; lo: number; hi: number; said: Set<string>; n: number }> = {};
const restNote = (label: string, call: string, t: Tap): void => {
  const a = (restRows[label] ||= { call, wrote: new Set(), called: new Set(), lo: 1e9, hi: -1, said: new Set(), n: 0 });
  a.wrote.add(t.wrote); a.called.add(calls(t.n)); a.lo = Math.min(a.lo, t.days.changed); a.hi = Math.max(a.hi, t.days.changed); a.n++; t.toasts.forEach((x) => a.said.add(x.replace(/^Moved\. \w+ is/, 'Moved. <day> is').replace(/^\S.* logged ✓$/, '<the jog> logged ✓')));
};
for (const name of NAMES) {
  // The Sunday evening of the first whole week, nothing trained in it: every rest day of the week has come.
  const s0 = snaps[name]!['0 generated']!; const P0 = phoneOf(s0); const p = P0.ev('activeProg');
  const w: number = Math.max(1, Number(P0.ev('calcCurrentWeek()')) + 1);
  const sunday = at(String(P0.ev("(function(){var m=getWeekMonday(activeProg.startDate);return m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0');})()")), 7 * (w - 1) + 6, '19:00');
  const base: Snap = { keys: s0.keys, iso: sunday };
  const P = phoneOf(base); const id: string = P.ev('activeProgId'); const roles = { [id]: 'id' };
  const rests = DAYS.filter((d) => { const x = P.day(w, d); return x && x.rest; });
  const jog = rests.filter((d) => P.ev(`restJogEligible(${w},'${d}')`)), mv = rests.filter((d) => P.ev(`restDayEligible(${w},'${d}')`));
  const cands: any[] = JSON.parse(P.ev(`JSON.stringify(restMoveCandidates(${w}))`));
  let warns = 0;
  if (mv[0]) for (const c of cands) if ((JSON.parse(P.ev(`JSON.stringify(restMoveCollisions(${w},'${mv[0]}',activeProg.weeks[${w}]['${c.day}']))`)) as any[]).length) warns++;
  restTally.days += rests.length; restTally.opens += jog.length; restTally.moves += mv.length; restTally.cands += cands.length; restTally.warns += warns;
  say('| ' + name + ' | ' + rests.length + ' | ' + jog.length + ' | ' + mv.length + ' | ' + cands.length + ' | ' + warns + ' of ' + cands.length + ' |');
  void p;
  const r = mv[0]; if (!r) continue;
  if (cands[0]) { const Pm = phoneOf(base); restNote('Train a session here: Move it here', 'applyRestMove()', tap(Pm, `openRestSheet(${w},'${r}','move');_rdSet('pick','${cands[cands.length - 1].day}');applyRestMove();`, roles)); }
  const types: string[] = [...new Set([...(JSON.parse(P.ev('JSON.stringify((activeProg.cfg&&activeProg.cfg.cardioTypes)||[])')) as string[]), 'walk'])];
  for (const t of types) {
    const Pl = phoneOf(base);
    restNote('Log cardio: Log it (' + (t === 'walk' ? 'a walk, time alone' : 'the program\'s sport, time and distance') + ')', 'applyRestCardio()', tap(Pl, `openRestSheet(${w},'${r}','cardio');_rdType('${t}');_restDraft.mins='25';_restDraft.dist='${t === 'walk' ? '' : t === 'swim' ? '800' : '2.5'}';_rdRpe(5);applyRestCardio();`, roles));
    if (t === types[0]) {
      const Ps = phoneOf(snap(Pl));
      restNote('Edit cardio: Logged ✓ with the face unchanged', 'applyRestCardio()', tap(Ps, `openRestSheet(${w},'${r}','cardio');applyRestCardio();`, roles));
      const Pc1 = phoneOf(snap(Pl));
      restNote('Edit cardio: Clear, first tap', 'clearRestCardio()', tap(Pc1, `openRestSheet(${w},'${r}','cardio');clearRestCardio();`, roles));
      const Pc = phoneOf(snap(Pl));
      restNote('Edit cardio: Clear, second tap', 'clearRestCardio() twice', tap(Pc, `openRestSheet(${w},'${r}','cardio');clearRestCardio();clearRestCardio();`, roles));
    }
  }
  { const Pe = phoneOf(base); restNote('Log it with an empty face', 'applyRestCardio()', tap(Pe, `openRestSheet(${w},'${r}','cardio');applyRestCardio();`, roles)); }
}
say();
say('- Rest days across the ten first weeks: ' + restTally.days + '; the sheet opens on ' + restTally.opens + ', Move is offered on ' + restTally.moves + '; sessions offered to move ' + restTally.cands + ', a spacing warning on ' + restTally.warns + ' picks onto the first rest day.');
say();
say('| Tap | The page\'s call | Keys written | The page called | Days of the grid changed | Toast | Taps |');
say('|---|---|---|---|---|---|---|');
for (const [label, a] of Object.entries(restRows)) say('| ' + label + ' | `' + a.call + '` | ' + [...a.wrote].join(' or ') + ' | ' + [...a.called].join(' or ') + ' | ' + a.lo + ' to ' + a.hi + ' | ' + ([...a.said].join(' / ') || 'none') + ' | ' + a.n + ' |');
say();

// ── G. The coach's mile nudge ───────────────────────────────────────────────
say('## G. The coach\'s mile nudge (D274) on the standard history');
say();
say('| Program | Runs logged with a distance and a time | Of them an easy card with a pace target | The judge offers |');
say('|---|---|---|---|');
const nudgeTally = { runs: 0, easy: 0, offers: 0 };
for (const name of NAMES) {
  const P = phoneOf(snaps[name]!['3 third week']!); const p = (P.ev('getPrograms()') as any[])[0];
  const info = (P.ev('runAnchorInfo') as (x: unknown) => any)(p.cfg);
  const logs = JSON.parse(P.ev('JSON.stringify(getLogs())')), hist = JSON.parse(P.ev('JSON.stringify(getDayHist())')), comp = JSON.parse(P.ev('JSON.stringify(getCompleted())'));
  let runs = 0, easy = 0, offers = 0;
  for (const k of Object.keys(logs)) {
    const m = /^w(\d+)_(\w+)$/.exec(k); if (!m || !(parseFloat(logs[k].run_dist) > 0) || !(parseFloat(logs[k].run_mins) > 0)) continue;
    runs++;
    const h = hist[k]; const list = h && h.cardio ? (Array.isArray(h.cardio) ? h.cardio : [h.cardio]) : []; if (list.some((c: any) => c && c.type === 'run' && c.dose && c.dose.tgt > 0)) easy++;
    if (!info) continue;
    const o = judgeNudge({ week: +m[1]!, day: m[2]!, hist, logs, comp, anchor: info.anchorSec, curWeek: (P.ev('_goalCurWeek') as (x: unknown) => number)(p), totalWeeks: p.totalWeeks || 6, record: p.mileNudge ?? null, implied: (pace) => (P.ev('paceChartLookup') as any)('recovery', pace).mile });
    if (o) offers++;
  }
  nudgeTally.runs += runs; nudgeTally.easy += easy; nudgeTally.offers += offers;
  say('| ' + name + ' | ' + runs + ' | ' + easy + ' | ' + offers + ' |');
}
say();
say('- Across the ten: ' + nudgeTally.runs + ' runs logged, ' + nudgeTally.easy + ' on a card with a pace target, ' + nudgeTally.offers + ' offers. Either answer writes `ia_programs` (the two cards judged and the mile, on the program); Update mile time then opens the pencil with the offer in its fields.');
say();

// ── H. Mario's backup, counts only ──────────────────────────────────────────
say('## H. On the simulator\'s copy of Mario\'s backup (counts only)');
say();
say('Read by a scratch script from a copy of the simulator\'s store (2026-11-18, the store\'s hash 278ba57f3f6a382b before and after; nothing was written to it), every tap on a phone of its own in the VM harness. Typed here by hand: no name, note, date or load.');
say();
say('- The store holds 36 `ia_` keys and 3 programs, 1 of them archived. The list draws 2 cards.');
say('- All 3 programs mark their 1RM chips "(est.)": none has a lift entered. No seeded program draws that mark.');
say('- Run paces: 6 chips on each of the 3. The sentence reads the mile as entered on 2 and as edited on 1 (the standard history draws entered alone).');
say('- The mile pencil shows the lock on all 3: each stands in its last three weeks. The edit sheet opens on none of his programs today.');
say('- Goal sheets: 4 (three run sheets of 6 options, one second sport of 5).');
say('- Stored beside the programs: 1 overlay on 1 program, no rest day move, a jog on 2 days (1 on each of 2 programs), no nudge record.');
say('- The active program this week: 2 rest days; the rest sheet opens on 1 and offers Move there, with 3 sessions to move. No injury is live. Of its 11 runs logged with a distance and a time, the nudge would offer after 0.');
say('- Set Active on the other live program: `ia_active` and its `ia_reminded_<id>` changed; one rebuild (2 engine builds).');
say('- Archive: the one that is not active wrote `ia_programs` alone; the active one wrote `ia_active`, `ia_programs` and the other\'s `ia_reminded_<id>`, with one rebuild.');
say('- Delete Forever: 11 or 12 of the 15 families removed with the program\'s row; on the active one the other takes over, as Archive.');
say('- A goal switch on the active program (4 options that need nothing typed): `ia_programs` changed, one rebuild, 7 to 8 of 98 days changed, 0 of them logged or marked.');
say('- Hurt? (two regions, both tiers tried once each) and Traveling? (Room only): `ia_programs` changed, one rebuild (2 engine builds), 6 of 98 days changed, 0 of them logged or marked.');
say('- The rest sheet: Move wrote `ia_moves_<id>` (new) and `ia_programs`, 2 days of the grid changed, no rebuild; a walk logged changed `ia_logs_<id>` alone.');
say();

// ── I. Who reads and writes what (read from the code) ───────────────────────
say('## I. What each piece reads and writes, and through which of core\'s readers and writers (read from the code)');
say();
say('| Piece | Reads | Writes | Core\'s own | The page\'s code, not in core |');
say('|---|---|---|---|---|');
say('| The list and a card\'s detail | `ia_programs`, `ia_active` | nothing | readPrograms, readActiveProgramId; runAnchorInfo, raceCountdown, raceCountdownWords, NRC_GOALS, _fmtMileAnchor, DEFAULT_1RM, ALL_DAYS_ORDER | progSelData and its five label tables, runAnchorChips, runAnchorSentence (programs.ts); _fmtStartDay (wizard.ts, the beta has it); the list\'s state (open cards, the rename, the confirm tier) |');
say('| Rename | `ia_programs` | `ia_programs` | readPrograms, writePrograms | commitRename (program-manage.ts) |');
say('| Set Active (the one switch) | `ia_programs` and every key a launch reads | `ia_active`, the launch\'s own (an older program repaired, edits of frozen weeks dropped), `ia_reminded_<id>` | writeActiveProgramId, refreshStoredProgram | setActive, loadActiveProgram (program-manage.ts); markPastAsked (popups-streaks-reminders.ts). The beta has the launch (week-screen.ts) and markPastAsked\'s readers (pop-ups.ts) |');
say('| Archive | `ia_programs`, `ia_active` | `ia_programs`; on the active one the switch\'s, or `ia_active` removed | readPrograms, writePrograms | archiveProg, _handoffActiveFrom (program-manage.ts) |');
say('| Delete Forever | the same | `ia_programs`, the fifteen families removed; on the active one the switch\'s | the same | deleteProg, purgeProgData (the beta has both for Progress, without the switch) |');
say('| Copy selections | `ia_programs` | nothing (the clipboard) | none | progSelLines, runAnchorLine, copyProgSel (programs.ts) |');
say('| The goal sheet | `ia_programs` | `ia_programs`; on the active program a rebuild | readPrograms, writePrograms, refreshStoredProgram, getWeekMonday | commitGoalChange, _goalCurWeek, _goalInputsValid (programs.ts); CARDIO_GOALS_BY_TYPE, HYBRID_EXCLUDED_GOALS, _GOAL_RANK, _GOAL_REQ_INPUTS (wizard.ts, the wizard\'s own tables: row 6 reads them too) |');
say('| The mile pencil and its lock | `ia_programs` | `ia_programs`; on the active program a rebuild | the same; raceCountdown, raceCountdownWords | openMileSheet, commitMileChange (programs.ts); _mileEntryState (wizard-generate.ts, shared with the wizard) |');
say('| The coach\'s nudge | `ia_programs`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_comp_<id>` | `ia_programs` (the record) | runAnchorInfo, paceChartLookup, the day readers | nothing but the Angular screen\'s own model and its hook on the cardio log |');
say('| Hurt? and Traveling? | the program in hand | `ia_programs` (the overlay); a rebuild | overlayWeekRange, weekOfDate, INJURY_REGIONS, refreshStoredProgram | openOverlaySheet, openInjurySheet, _ovSet, applyOverlayDraft, applyInjuryDraft, the date words (_fmtDate, _fmtDateWd, _dayCount, _dayCountWord, _addDaysIso), overlayBackCopy (overlays.ts) |');
say('| The chip, I\'m back, the check in | the program in hand | `ia_programs` (overlays, lastAsk); a rebuild on ✕ and I\'m back | injuryPlan, paceShiftMap, overlayWeekRange | renderOverlayChip (the page writes the chip and the check in card itself: no Angular model), overlaySpanLabel, removeOverlay, imBackFromInjury, injReassess, injSnooze (overlays.ts); two pop-ups (popFire) |');
say('| The rest day sheet | the grid in hand, `ia_logs_<id>`, `ia_comp_<id>`, `ia_moves_<id>` | Move: `ia_moves_<id>`, `ia_programs` (the grid); Log and Clear: `ia_logs_<id>` | applyRestDayMoves, the day log\'s reader and writer, CARDIO_PARK_FIELDS, _pattern, _PATTERN_REGION | all of the sheet (rest-day-shell.ts: the page writes it as markup, no Angular model): the menu, Move with its candidates and its spacing warning, the cardio face on the wheels, Log, Clear, the two eligibility tests |');
say();
say('- A switch of the active program: Set Active, Archive of the active one, Delete Forever of the active one (the first program not archived takes over; with none, `ia_active` is removed).');
say('- A rebuild (core\'s refreshStoredProgram): every switch; a goal switch or a new mile on the active program; Hurt? and Traveling? Apply change; the chip\'s ✕; I\'m back.');
say('- No rebuild: rename; Archive or Delete Forever of a program that is not active; a goal or a mile on a program that is not active; the check in\'s answers; the rest sheet (Move lays the stored moves over the grid in hand with core\'s applyRestDayMoves and stores the grid); the nudge\'s answers.');
say('- Kinds the standard walks draw none of, each to be made by a walk of its own before a break list is written: the "(est.)" mark, a Lift only card, the sentence for a default, a seeded, an edited and each of three clamped miles, both empty lists, a second card, a card being renamed, both confirm tiers.');
say();
say('## J. What row 5 owes from earlier rows');
say();
say('- Archiving: Progress\'s walk archives on the page and carries the keys over (tests/support/native-progress.ts). The list\'s Archive is the beta\'s own.');
say('- The rest of a switch after Delete Forever: Progress\'s deleteProgram puts the pointer on the next program and stops (progress-writes.ts). The launch\'s writes and the past days marked as asked (D238) come with the list\'s switch.');
say('- The jog\'s Edit cardio on the session sheet is drawn and takes no press until the rest sheet is built (SessionSheet.tsx).');
say('- On This Week, drawn and taking no press: Hurt?, Traveling?, the rest card\'s Log cardio or Edit cardio and Training anyway?, the start date and the race date. The start date and the race date are named in no row of MIGRATION.md.');
say('- The beta has no Programs tab, no date box and no clipboard: a date box and a clipboard are each a native package.');
say();

writeFileSync(join(REPO, 'tests', 'measure', 'native-program-list_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
