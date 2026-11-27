// native-row7: what is left of the migration's row 7 (MIGRATION.md phase 3: swap, add, Random Workout, the pop-ups,
// the toast, the Bugs tab, backup, theme), measured on today's page before the Expo app draws it. Read-only
// (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts, on the ten
// seeded programs, each through the standard history. Stored keys are read before and after each tap.
//
// A. Random Workout's pools: what there is to draw.
// B. Its door on This Week: the counter, per program and stretch.
// C. What each tap in it reads and writes.
// D. Complete, by the kind of day it lands on.
// E. The Bugs tab: the Look row and the backup, key by key.
// F. The pop-ups and the toasts: today's callers, counted from the sources.
//
// Usage: cd tests && node measure/native-row7_today.ts   (writes tests/measure/native-row7_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, life } from '../support/stored-state.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals && seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const NAMES = Object.keys(PROGRAMS);
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
const plus = (iso: string, days: number, time?: string): string => {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + days);
  const p = (n: number): string => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + (time || iso.slice(11));
};
interface Snap { keys: Record<string, string>; iso: string }
function phoneOf(s: Snap, iso = s.iso): Phone {
  const P = new Phone();
  for (const [k, v] of Object.entries(s.keys)) P.damage(k, v);
  P.launch(iso);
  P.settle();
  return P;
}
/** Every pop-up the page raises from here on: the tier and the caller's options, kept in place of the draw. */
function pops(P: Phone): { tier: string; opts: any }[] {
  const list: { tier: string; opts: any }[] = [];
  P.IA.ctx['__popped'] = list;
  P.ev('popFire=function(t,o){__popped.push({tier:t,opts:o?JSON.parse(JSON.stringify(o)):null});};');
  return list;
}
const COUNTER = `(function(){var done=getWildcardDone();var goal=(activeProg&&activeProg.goal)||'balanced';var pool=RAND_POOLS[goal]||RAND_POOLS.balanced;return goal+'|'+(RAND_POOLS[goal]?'its own':'balanced, no pool of its own')+'|'+done.filter(function(d){return pool.some(function(w){return w.title===d.title;});}).length+'/'+pool.length+'|'+done.length;})()`;

// ── The walks: ten programs through the standard history, the third week kept as a phone to tap on ────────────────
const thirds: Snap[] = [], ids: string[] = [];
const door: Record<string, Record<string, string>> = {};
const goals: Record<string, number> = {};
NAMES.forEach((name, i) => {
  door[name] = {};
  life(CFGS[i], CREATED, undefined, (stage, P) => {
    const c: string = P.ev(COUNTER);
    door[name]![stage] = c.split('|')[2]! + (c.split('|')[3] !== c.split('|')[2]!.split('/')[0] ? ' (' + c.split('|')[3] + ' stored)' : '');
    if (stage === '0 generated') bump(goals, c.split('|')[0] + ': ' + c.split('|')[1]);
    if (stage === '3 third week') { thirds.push({ keys: P.dump(), iso: nowIso(P) }); ids.push(P.ev('activeProgId')); }
  });
});

say('# What is left of row 7, on today\'s page (measure, before the Expo app draws it)');
say();
say('Made by `tests/measure/native-row7_today.ts` on today\'s page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each through the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed.');
say();

// ── A. The pools ────────────────────────────────────────────────────────────────────────────────────────────────
const P0 = phoneOf(thirds[0]!);
const POOLS: Record<string, any[]> = JSON.parse(P0.ev('JSON.stringify(RAND_POOLS)'));
say('## A. Random Workout: what there is to draw');
say();
say('The pools are the page\'s own table (`random-wildcard.ts` `RAND_POOLS`), not the engine\'s and not core\'s. My Goal draws from the pool named for the program\'s goal, or from `balanced` when the goal has none. See All draws from every pool laid end to end.');
say();
say('| Pool | Workouts | With a cardio block | With a note | Sections | Cards |');
say('|---|---|---|---|---|---|');
let all = 0; const titles: Record<string, number> = {};
const secKeys: Record<string, number> = {}, itemKeys: Record<string, number> = {};
for (const [k, pool] of Object.entries(POOLS)) {
  let secs = 0, items = 0;
  pool.forEach((w) => {
    bump(titles, w.title);
    (w.sections || []).forEach((s: any) => {
      secs++; bump(secKeys, Object.keys(s).sort().join(', '));
      (s.items || []).forEach((it: any) => { items++; bump(itemKeys, typeof it === 'string' ? '(a plain string)' : Object.keys(it).sort().join(', ')); });
    });
  });
  all += pool.length;
  say('| ' + k + ' | ' + pool.length + ' | ' + pool.filter((w) => w.cardio).length + ' | ' + pool.filter((w) => w.note).length + ' | ' + secs + ' | ' + items + ' |');
}
say();
say('See All draws from ' + all + ' workouts. Titles used by more than one workout: ' + Object.values(titles).filter((n) => n > 1).length + '. Workouts with no section: ' + Object.values(POOLS).flat().filter((w) => !(w.sections || []).length).length + '.');
say();
say('A section\'s fields, by how many sections carry that set:'); say(); table(secKeys, 'Fields');
say('A card\'s fields:'); say(); table(itemKeys, 'Fields');

// What the page draws for every workout: the cards' markup, its classes and its handlers, counted.
const classes: Record<string, number> = {}, handlers: Record<string, number> = {};
let drew = 0, threw = 0;
Object.values(POOLS).flat().forEach((_, i) => {
  try {
    const h: string = P0.ev(`(function(){var w=Object.values(RAND_POOLS).flat()[${i}];_setWildDraw(w);var h=buildSectionsHTML(_wildDraw.sections,0,'wild');_setWildDraw(null);return h;})()`);
    drew++;
    for (const m of h.matchAll(/class="([^"]+)"/g)) m[1]!.split(/\s+/).forEach((c) => bump(classes, c));
    for (const m of h.matchAll(/on(?:click|input|change|blur)="([a-zA-Z_]+)\(/g)) bump(handlers, m[1]!);
  } catch { threw++; }
});
say('The cards are the session sheet\'s own (`buildSectionsHTML` with the source `wild`; the Angular screen draws them with the session sheet\'s `SessionSections`). Drawn for each of the ' + drew + ' workouts on one phone (' + threw + ' threw), the handlers their markup carries:');
say(); table(handlers, 'Handler');
say('Classes drawn at least once: ' + Object.keys(classes).length + '. The ones that are a control or a field:');
say(); table(Object.fromEntries(Object.entries(classes).filter(([c]) => /btn|input|chip|minus|skip|swap|log|wheel|stepper|undo/.test(c))), 'Class');

// ── B. The door ─────────────────────────────────────────────────────────────────────────────────────────────────
say('## B. The door on This Week, and its counter');
say();
say('One door: the Random Workout button at This Week\'s foot, beside Traveling? (`week-view.ts`, `openRandom`). It carries a counter, the goal\'s own Wildcards done out of how many the goal\'s pool holds (`updateRandCounter`). The beta draws the button with no counter and no press.');
say();
say('The ten programs\' goals and the pool My Goal draws from:'); say(); table(goals, 'Goal: pool');
const STAGES = Object.keys(door[NAMES[0]!]!);
say('The counter at each stretch (the standard history completes one Wildcard in the second week, by a title no pool holds, so it is stored and not counted):');
say();
say('| Program | ' + STAGES.join(' | ') + ' |'); say('|---|' + STAGES.map(() => '---|').join(''));
NAMES.forEach((n, i) => say('| ' + (i + 1) + ' | ' + STAGES.map((s) => door[n]![s]).join(' | ') + ' |'));
say();

// ── C. The taps ─────────────────────────────────────────────────────────────────────────────────────────────────
say('## C. What each tap reads and writes');
say();
const taps: Record<string, Record<string, number>> = {};
const tap = (name: string, what: string): void => { taps[name] = taps[name] || {}; bump(taps[name]!, what); };
const toasts: Record<string, number> = {}, popKinds: Record<string, number> = {};
let rerolls = 0, repeats = 0, swapsDone = 0, skipsDone = 0, roundsSkipped = 0;
thirds.forEach((s, n) => {
  const P = phoneOf(s), id = ids[n]!, raised = pops(P);
  const step = (name: string, code: string): void => {
    const pre = P.dump(), t0 = P.toasts.length;
    P.ev(code); P.settle();
    tap(name, diff(pre, P.dump(), id));
    P.toasts.slice(t0).forEach((t) => bump(toasts, name + ': ' + t.replace(/^.* logged ✓$/, '<title> logged ✓')));
  };
  step('Random Workout (open)', 'openRandom();');
  let last: number = P.ev('lastRandIdx');
  for (let i = 0; i < 20; i++) { P.ev('reroll();'); const now: number = P.ev('lastRandIdx'); rerolls++; if (now === last) repeats++; last = now; }
  step('See All', "setRandFilter('all');");
  step('My Goal', "setRandFilter('mine');");
  // A card that carries a swap mark, and the first move the swap sheet offers for it.
  const find = (re: RegExp): RegExpExecArray | null => {
    for (let i = 0; i < 40; i++) {
      const h: string = P.ev("buildSectionsHTML(_wildDraw.sections,0,'wild')");
      const m = re.exec(h); if (m) return m;
      P.ev('reroll();');
    }
    return null;
  };
  const sw = find(/openSwapSheet\((\d+),(\d+),'wild'\)/);
  if (sw) {
    step('Swap mark on a card', `openSwapSheet(${sw[1]},${sw[2]},'wild');`);
    const to: string | null = P.ev(`(function(){var it=_wildDraw.sections[${sw[1]}].items[${sw[2]}];var r=swapCandidates(it.name,_wildDraw,currentWeek,activeProg);var l=[].concat(r.tier1||[],r.tier2||[]);var x=l[0];return x?(x.name||x):null;})()`);
    if (to) {
      const from: string = P.ev(`_wildDraw.sections[${sw[1]}].items[${sw[2]}].name`);
      step('A move picked in the swap sheet', `applySwapChoice(${J(to)});`);
      swapsDone += P.ev('_wildDraw.swaps.length');
      step('Put it back (a swap)', `undoSwap(${J(from)},'wild');`);
    }
  }
  const sk = find(/skipExercise\('((?:[^'\\]|\\.)*)','wild'\)/);
  if (sk) {
    const name = sk[1]!.replace(/\\'/g, "'");
    step('Minus on a card', `skipExercise(${J(name)},'wild');`); skipsDone++;
    step('Put it back (a card)', `unskipExercise(${J(name)},'wild');`);
  }
  const ss = find(/skipSuperset\((\d+),'wild'\)/);
  if (ss) {
    step('Minus on a round', `skipSuperset(${ss[1]},'wild');`); roundsSkipped++;
    step('Put it back (a round)', `unskipSuperset(${ss[1]},'wild');`);
  }
  // A Wildcard's card carries the session sheet's log: two sets typed on the first card of the draw, then Log.
  {
    const c: { name: string; detail: string } = JSON.parse(P.ev('JSON.stringify(_wildDraw.sections[0].items[0])'));
    const pre = P.dump(), t0 = P.toasts.length;
    P.logLift(c.name, c.detail, [5, 5], [100, 100]); P.settle();
    const post = P.dump();
    tap('Log on a card (two sets typed)', diff(pre, post, id));
    const key: string = P.ev(`exStoreKey(${J(c.name)})`);
    const e = (JSON.parse(post['ia_exw_' + id] || '{}')[key] || { entries: [] }).entries.slice(-1)[0];
    tap('The entry a Wildcard card\'s Log stores', e ? 'fields ' + Object.keys(e).sort().join(', ') + '; the week being viewed ' + (e.week === P.ev('currentWeek') ? 'yes' : 'no') + '; its day ' + (e.day === '' && P.ev('currentDayKey') === null ? 'blank (the day last opened, `currentDayKey`, and none was opened this launch)' : e.day === P.ev('currentDayKey') ? 'the day last opened' : 'another') + '; today\'s weekday (`currentRandDayKey`, which the draw sets and nothing reads) ' + (e.day === P.ev('currentRandDayKey') ? 'yes' : 'no') : 'none');
    P.toasts.slice(t0).forEach((t) => bump(toasts, 'Log on a card: ' + t.replace(c.name, '<move>')));
  }
  step('Reset, the first tap', 'resetWildcardCounter();');
  const title: string = P.ev('_wildDraw.w.title');
  step('Complete', `completeWildcard(${J(title)});`);
  raised.forEach((r) => bump(popKinds, r.tier + ': ' + r.opts.kicker + ' / ' + r.opts.msg + ' / ' + String(r.opts.sub).replace(/\d+/, 'N')));
  tap('After Complete: the sheet\'s working day', P.ev('_wildDraw') === null ? 'cleared' : 'kept');
  tap('After Complete: This Week\'s tag for today', P.ev(`(function(){var s=wildcardDayFor(new Date());return s?(wildcardTagHTML(s.week,s.dayKey)?'drawn':'not drawn'):'no day of the program today';})()`));
  P.ev(`(function(){var p=getActivePool();var i=p.findIndex(function(w){return w.title===${J(title)};});_setWildDraw(p[i]);renderRand();})()`);
  tap('The same workout drawn again', (P.ev("(function(){var d=getWildcardDone();return d.some(function(x){return x.title===_wildDraw.w.title;});})()") as boolean) ? 'Done Before, no Complete button' : 'Complete offered');
  step('Reset, tapped twice', 'resetWildcardCounter();resetWildcardCounter();');
  step('Back', 'closeRandom();');
});
say('Ten phones, each on its third week. Every tap, and the stored keys it changed (the count is how many of the ten):');
say();
say('| Tap | Stored keys changed | Phones |'); say('|---|---|---|');
for (const [name, T] of Object.entries(taps)) for (const [what, c] of Object.entries(T)) say('| ' + name + ' | ' + what + ' | ' + c + ' |');
say();
say('Draws made by tapping a filter ' + rerolls + ' times in a row: ' + repeats + ' repeated the workout before it (the draw is made again while it lands on the last one).');
say('Swaps made on a Wildcard card: ' + swapsDone + '. Cards taken off: ' + skipsDone + '. Rounds taken off: ' + roundsSkipped + '. None is stored: they live on the sheet\'s own copy of the draw, which a new draw, a filter or Back throws away.');
say();
say('The toasts those taps spoke:'); say(); table(toasts, 'Tap: toast');
say('The pop-up Complete raises 380 ms on (its own dispatcher, never the season banner):'); say(); table(popKinds, 'Tier: kicker / line / sub line');

// ── D. Complete by the kind of day ──────────────────────────────────────────────────────────────────────────────
say('## D. Complete, by the day it lands on');
say();
say('The record is `ia_wild_<id>` alone: the title, the time, and the program\'s week and day read from today\'s date (never the week being viewed). Off the program\'s calendar it stores no day.');
say();
const kinds: Record<string, number> = {};
thirds.forEach((s, n) => {
  for (let d = 0; d < 7; d++) {
    const P = phoneOf(s, plus(s.iso, d, '12:00:00')), raised = pops(P);
    P.ev("openRandom();completeWildcard(_wildDraw.w.title);"); P.settle();
    const rec = JSON.parse(P.dump()['ia_wild_' + ids[n]] || '[]').pop();
    const day = rec && rec.week ? P.ev(`activeProg.weeks[${rec.week}][${J(rec.dayKey)}]`) : null;
    const r = raised[raised.length - 1];
    bump(kinds, (rec && rec.week ? (day && day.rest ? 'a rest day' : 'a training day') : 'no day of the program') + ' → ' + (r ? String(r.opts.sub).replace(/\d+/, 'N') : 'no pop-up'));
  }
  const far = phoneOf(s, plus(s.iso, 400, '12:00:00')), raised = pops(far);
  far.ev("openRandom();completeWildcard(_wildDraw.w.title);"); far.settle();
  const rec = JSON.parse(far.dump()['ia_wild_' + ids[n]] || '[]').pop();
  bump(kinds, 'after the program\'s last week (' + (rec && rec.week ? 'a day stored' : 'no day stored') + ') → ' + (raised.length ? String(raised[raised.length - 1]!.opts.sub).replace(/\d+/, 'N') : 'no pop-up'));
});
say('Ten phones, Complete on each of the seven days from the third week\'s launch, and once 400 days on:'); say(); table(kinds, 'The day → the pop-up\'s sub line');

// ── E. The Bugs tab ─────────────────────────────────────────────────────────────────────────────────────────────
say('## E. The Bugs tab: the Look row and the backup');
say();
const look: Record<string, number> = {}, backup: Record<string, number> = {};
let keysIn = 0, keysMin = 1e9, keysMax = 0;
thirds.forEach((s, n) => {
  const P = phoneOf(s), id = ids[n]!;
  const step = (name: string, code: string): void => { const pre = P.dump(); P.ev(code); bump(look, name + ' → ' + diff(pre, P.dump(), id)); };
  step('Night', "setTheme('night');"); step('Day', "setTheme('day');"); step('Auto', "setTheme('auto');"); step('Night, then a backup', "setTheme('night');");
  const snap = JSON.parse(P.ev('JSON.stringify(backupSnapshot())'));
  const n0 = Object.keys(snap.data).length; keysIn += n0; keysMin = Math.min(keysMin, n0); keysMax = Math.max(keysMax, n0);
  bump(backup, 'The file: ' + Object.keys(snap).sort().join(', '));
  bump(backup, 'The file holds every ia_ key the phone holds: ' + (J(Object.keys(snap.data).sort()) === J(Object.keys(P.dump()).sort()) ? 'yes' : 'no'));
  bump(backup, 'The look is in the file (ia_theme): ' + ('ia_theme' in snap.data ? 'yes' : 'no'));
  bump(backup, 'File name: ' + String(P.ev('backupFileName()')).replace(/\d{4}-\d{2}-\d{2}/, '<date>'));
  const t0 = P.toasts.length;
  bump(backup, 'Save a backup in the harness (no share sheet, no plugin) → ' + P.ev('saveBackup()') + (P.toasts.length > t0 ? ', toast: ' + P.toasts.slice(t0).join(' | ') : ''));
  bump(backup, 'Its message: ' + String(P.ev(`backupMessage(readBackup(${J(J(snap))}))`)).replace(/Backup from [A-Z][a-z]+ \d+/, 'Backup from <day>').replace(/\d+ program/, 'N program'));
  bump(backup, 'Not a backup: ' + P.ev("backupMessage(readBackup('{}'))"));
  bump(backup, 'A newer format: ' + P.ev(`backupMessage(readBackup(${J(J({ ...snap, format: snap.format + 1 }))}))`));
  // Load it on an empty phone: every key the file holds, and nothing else.
  const E = new Phone().launch(s.iso);
  E.IA.ctx['__data'] = snap.data;
  const ok: boolean = E.ev('loadBackupData(__data)');
  bump(backup, 'Load it on an empty phone → ' + (ok && J(E.dump()) === J(snap.data) ? 'every key equal to the file' : 'differs'));
  const O = phoneOf(thirds[(n + 1) % thirds.length]!);
  O.IA.ctx['__data'] = snap.data;
  const ok2: boolean = O.ev('loadBackupData(__data)');
  bump(backup, 'Load it over another program\'s phone → ' + (ok2 && J(O.dump()) === J(snap.data) ? 'every key equal to the file, none of the other phone\'s left' : 'differs'));
});
say('The Look row (D261): three buttons, one stored key, read at launch and at each tap. Ten phones:'); say(); table(look, 'Tap → stored keys changed');
say('The backup (D264). Ten phones on their third week, ' + keysMin + ' to ' + keysMax + ' keys each (' + keysIn + ' in all):'); say(); table(backup, 'What');

// ── F. Callers, from the sources ────────────────────────────────────────────────────────────────────────────────
say('## F. The pop-ups and the toasts: today\'s callers');
say();
const LEG = join(REPO, 'frontends', 'app', 'src', 'legacy', 'src', 'js');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const popCallers: Record<string, number> = {}, toastCallers: Record<string, number> = {};
for (const f of readdirSync(LEG).filter((x) => x.endsWith('.ts'))) {
  const t = strip(readFileSync(join(LEG, f), 'utf8'));
  const p = (t.match(/popFire\(/g) || []).length - (t.includes('function popFire(') ? 1 : 0);
  if (p) popCallers[f] = p;
  const c = (t.match(/showToast\(/g) || []).length - (t.includes('function showToast(') ? 1 : 0);
  if (c) toastCallers[f] = c;
}
say('Calls that raise a pop-up (`popFire`), by the page\'s file:'); say(); table(popCallers, 'File');
say('Calls that speak a toast (`showToast`), by the page\'s file (the Angular screens speak through the same function):'); say(); table(toastCallers, 'File');

// ── G. The reading ──────────────────────────────────────────────────────────────────────────────────────────────
say('## G. What the beta holds of row 7, and what is left');
say();
say('Read from the sources (`frontends/native/src`, `frontends/app/src/app/screens`), not counted by this script.');
say();
say('Held already:');
say();
say('- The swap sheet and the add sheet on a program\'s day (phase 3, sessions 3 and 7), and the RPE card.');
say('- The pop-up card and eight of the nine callers above: the four of `popups-streaks-reminders.ts` and the four of `overlays.ts`.');
say('- The toast (`App.tsx`), which every screen built so far speaks through.');
say('- The Engine row (D286) and a backup loaded and checked key by key (D287), on a Bugs tab written in the beta\'s own words.');
say();
say('Left:');
say();
say('1. **Random Workout.** The counter on its door; the sheet (two filters, the two tap reset, the badge and title, the cardio block, the note); its cards, which are the session sheet\'s with the source `wild` (swap, minus, a round\'s minus, put it back, and the log); Complete, the ninth pop-up caller, and This Week after it.');
say('2. **The Bugs tab as today draws it.** The bug report (the text, Send to Web3Forms, five status lines, one toast); the Look row (`ia_theme`; the beta follows the phone alone); Your data (Save a backup, which the beta has none of; Load a backup, which today asks about before it replaces anything and the beta does at once); the build label. The Run recorder row is phase 4\'s.');
say();
say('Not in row 7, and not proposed: the update banner (`update-check.ts` fetches the page and compares its version; the beta\'s updates come through TestFlight).');
say();
say('Found, today\'s own, not ruled:');
say();
say('- A Log on a Wildcard card writes the lift history (`ia_exw_<id>`) under the week being viewed and the day last opened, blank when none was. The draw sets `currentRandDayKey` to today\'s weekday and nothing reads it.');
say('- A goal with no pool of its own draws from `balanced` (endurance, 2 of the 10 programs; known since V195, D66).');

writeFileSync(join(REPO, 'tests', 'measure', 'native-row7_today.md'), out.join('\n') + '\n');
console.log('wrote tests/measure/native-row7_today.md, ' + out.length + ' lines');
