// day-edits: does the engine hand back one item object on more than one day, and does an edit to it reach the others?
// Read-only (measure). Found while the Expo app's pop-ups were proved (Post-v0.262.3): after the nudge's rebuild, a
// launch in the same process handed back another program than a launch in a fresh one.
//
// A. The ten seeded programs, today's page in the VM harness: every item of the grid in hand (activeProg), counted by
//    identity. An item object that stands on two days is one object: a write to it on one day is a write on both.
// B. THE HALF MANNY on today's page: one such item skipped on its first day (skipExercise, as a tap does), then read
//    on its other days in the same launch, and again after a fresh launch on the keys the skip left.
// C. The same question of core in this process, as the Expo app holds it: two builds of one stored program, and the
//    items that are one object in both.
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/day-edits_shared-items.ts
//        (writes tests/measure/day-edits_shared-items.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { liveProgram } from '../../frontends/native/src/this-week/week-screen.ts';
import { PROGRAMS } from '../support/programs.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, at, firstWeek } from '../support/stored-state.ts';

const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const J = JSON.stringify;
const CREATED = '2026-08-29T09:00:00';
const walkable = (c: any): any => (c.cardioGoals && c.cardioGoals.swim ? { ...c, cardioGoals: { ...c.cardioGoals, swim: { ...c.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : c);

/** On the page: each item object that stands in more than one place of the grid in hand, with its places. */
const SHARED = `(function(){var seen=[],at=[];Object.keys(activeProg.weeks).forEach(function(w){Object.keys(activeProg.weeks[w]).forEach(function(d){((activeProg.weeks[w][d]||{}).sections||[]).forEach(function(s,si){(s.items||[]).forEach(function(it){var i=seen.indexOf(it);if(i<0){seen.push(it);at.push([]);i=seen.length-1;}at[i].push({w:+w,d:d,label:s.label||('section '+si),core:!!s.core,hip:!!s.hip});});});});});
  var out=[];seen.forEach(function(it,i){if(at[i].length>1)out.push({name:it.name,detail:it.detail,at:at[i]});});return JSON.stringify({items:seen.length,shared:out});})()`;

say('# One item object on several days: what the engine hands back, and what an edit to it reaches');
say();
say('Read-only measure, today\'s page in the VM harness and core in this process, America/New_York.');
say();
say('## A. The ten seeded programs, the grid in hand on today\'s page');
say();
say('| program | items | item objects on more than one day | the places they stand in | their sections |');
say('|---|---|---|---|---|');
let half: { name: string; detail: string; at: { w: number; d: string; label: string }[] }[] = [];
let progs = 0, objects = 0, places = 0;
for (const [name, cfg] of Object.entries(PROGRAMS)) {
  const P = new Phone().launch(CREATED);
  P.generate(walkable(cfg));
  const r = JSON.parse(P.ev(SHARED)) as { items: number; shared: typeof half };
  if (name.startsWith('half-manny')) half = r.shared;
  const labels: Record<string, number> = {};
  let n = 0;
  for (const x of r.shared) for (const a of x.at) { n++; labels[a.label] = (labels[a.label] || 0) + 1; }
  if (r.shared.length) progs++;
  objects += r.shared.length; places += n;
  say('| ' + name + ' | ' + r.items + ' | ' + r.shared.length + ' | ' + n + ' | ' + (Object.keys(labels).sort().map((l) => l + ' ' + labels[l]).join(', ') || 'none') + ' |');
}
say();
say(progs + ' of 10 programs hold one; ' + objects + ' item objects stand in ' + places + ' places.');
say();
say('THE HALF MANNY\'s, each with its places:');
say();
for (const x of half) say('- ' + x.name + ' (' + x.detail + '): ' + x.at.map((a) => 'week ' + a.w + ' ' + a.d).join(', '));
say();

say('## B. THE HALF MANNY on today\'s page: one of them skipped on its first day');
say();
{
  const P = new Phone().launch(CREATED);
  P.generate(PROGRAMS['half-manny (Mario, NRC half, crossfit)']!);
  const { start } = firstWeek(P, CREATED);
  const r = JSON.parse(P.ev(SHARED)) as { shared: typeof half };
  const x = r.shared[0];
  if (!x) say('No shared item on this program.');
  else {
    const a = x.at[0]!, rest = x.at.slice(1);
    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    P.launch(at(start, 7 * (a.w - 1) + DAYS.indexOf(a.d)));
    const read = (): string => rest.map((b) => 'week ' + b.w + ' ' + b.d + ': ' + J(P.ev(`(function(){var it=activeProg.weeks[${b.w}][${J(b.d)}].sections.reduce(function(f,s){return f||(s.items||[]).filter(function(i){return i.name===${J(x.name)};})[0];},null);return it?!!it._skipped:null;})()`))).join(', ');
    say('- ' + x.name + ' stands on week ' + a.w + ' ' + a.d + ' and on ' + rest.map((b) => 'week ' + b.w + ' ' + b.d).join(', ') + '. Before the skip, skipped there: ' + read() + '.');
    P.open(a.w, a.d as never);
    P.ev(`skipExercise(${J(x.name)});`);
    P.settle();
    say('- After `skipExercise` on week ' + a.w + ' ' + a.d + ', in the same launch, skipped on its other days: ' + read() + '. Toast: "' + P.toasts[P.toasts.length - 1] + '".');
    const edits = P.dump()['ia_edits_' + P.ev('activeProgId')];
    say('- What the skip stored: `ia_edits_` ' + edits + '.');
    P.launch(at(start, 7 * (a.w - 1) + DAYS.indexOf(a.d), '21:00'));
    say('- After a fresh launch on those keys, skipped on its other days: ' + read() + '.');
  }
  say();
}

say('## C. Core in one process, as the Expo app holds it: two builds of one stored program');
say();
{
  const P = new Phone().launch(CREATED);
  P.generate(PROGRAMS['half-manny (Mario, NRC half, crossfit)']!);
  const now = P.ev('Date.now()') as number;
  const report = { overlay: () => {}, freeze: () => {}, rebuild: () => {} };
  const fill = (): any => { const s = sqliteTestStore(); for (const [k, v] of Object.entries(P.dump())) s.set(k, v as string); return s; };
  const g1 = liveProgram(fill(), now, report) as any, g2 = liveProgram(fill(), now, report) as any;
  let total = 0, same = 0;
  for (const w of Object.keys(g1.weeks)) for (const d of Object.keys(g1.weeks[w])) {
    const s1 = (g1.weeks[w][d] || {}).sections || [], s2 = (g2.weeks[w][d] || {}).sections || [];
    s1.forEach((sec: any, i: number) => (sec.items || []).forEach((it: any, j: number) => { total++; if (s2[i] && s2[i].items && s2[i].items[j] === it) same++; }));
  }
  say('- ' + same + ' of ' + total + ' items are the same object in both builds. A grid the Expo app holds as the launch hands it back shares them with every later build in the process; the tests\' walks hold a copy (`tests/support/native-this-week.ts` `nativeGrid`), so none of them writes to a shared one.');
  say();
}

say('## D. Met by the proof of the Expo app\'s nudge (tests/support/native-deck-logging.ts), not measured here');
say();
say('- *A swap, then Make the change, in one launch of today\'s page.* The 1.5 mile commercial program, its first week: Bird dogs swapped for Farmer march on one day, then a nudge accepted on another lift two days on. The program the page then holds has Farmer march at 3×10–15 each @ RPE 8 on week 9 Tuesday, where a fresh launch on the same keys has Bird dogs at 3×12 each. Once in 40 nudges accepted over the ten programs (`leaked` in the walk\'s tally).');
say('- *A preference that names one of these items.* The bodyweight program, its third week: the nudge accepted for Bird dogs to Ab wheel rollouts. A build later in the same process has Ab wheel rollouts on week 8 Thursday, alone in its block; a fresh launch on the same keys has Bird dogs at 3×20 alternating with McGill curl-up beside it. The rebuild renamed the engine\'s own item, and a fresh build does not make the trade on that day. The walk answers such a nudge Leave the plan alone (4 of 87 over the ten programs, `spared`), so Make the change on a core, trunk or carry move is not proved equal.');
say();

writeFileSync(join(import.meta.dirname, 'day-edits_shared-items.md'), out.join('\n') + '\n');
console.log('wrote day-edits_shared-items.md, ' + out.length + ' lines');
