// native-deck-popups, second part: where the season pop-up can be reached, the long gap's words, the other callers of
// the pop-up, and the accept read before the page's timers run. Read-only (measure).
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-deck-popups_reach.ts
//        (writes tests/measure/native-deck-popups_reach.md; the resolver finds the Expo app's imports, which carry no extension)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = join(import.meta.dirname, '../..');
const OUT = join(import.meta.dirname, 'native-deck-popups_reach.md');
const sup = async (f: string): Promise<any> => import(W + '/tests/support/' + f);
const { PROGRAMS } = await sup('programs.ts');
const { Phone, at, firstWeek, life, training, DAYS } = await sup('stored-state.ts');
const { both } = await sup('native-deck-swap.ts');
const { launchNow } = await sup('native-this-week.ts');
const { deckView } = await import(W + '/frontends/native/src/deck/deck-screen.ts');

const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const J = JSON.stringify;
const CREATED = '2026-08-29T09:00:00';
const fam = (k: string): string => k.replace(/prog_\d+.*$/, '<id>');
const walkable = (c: any): any => (c.cardioGoals && c.cardioGoals.swim ? { ...c, cardioGoals: { ...c.cardioGoals, swim: { ...c.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : c);

const raises: any[] = [];
const launch0 = Phone.prototype.launch;
Phone.prototype.launch = function (this: any, when: string, opts: { init?: boolean } = {}): any {
  launch0.call(this, when, { init: false });
  this.IA.ctx.__raise = (r: any) => { raises.push(JSON.parse(JSON.stringify(r))); };
  this.ev(`(function(){var p0=popFire;popFire=function(tier,opts){var r=p0.apply(this,arguments);opts=opts||{};var cfg=POP_CFG[tier]||POP_CFG.workout;
    __raise({tier:tier,kicker:opts.kicker||cfg.kicker,msg:document.getElementById('popMsg').textContent,own:!!opts.msg,sub:opts.sub||'',stats:(opts.stats||[]).map(function(s){return s.n+' '+s.l.replace(/<[^>]+>/g,'').trim();}),actions:(opts.actions||[]).map(function(a){return a.label;})});
    globalThis.__lastPop={tier:tier,actions:(opts.actions||[])};return r;};})()`);
  if (opts.init !== false) this.ev('init()');
  return this;
};

say('## D. Where each tier of the completion pop-up can be reached');
say();
say('| program | weeks | scheduled days | days with a deck | the final scheduled day | a deck there |');
say('|---|---|---|---|---|---|');
let withDeck = 0, sched = 0, finalDeck = 0;
for (const [name, cfg] of Object.entries(PROGRAMS)) {
  const P = new Phone().launch(CREATED);
  P.generate(walkable(cfg));
  const { store, grid, Q } = both(P);
  const now = launchNow(Q).getTime();
  const days = JSON.parse(Q.ev('JSON.stringify(scheduledDays().map(function(x){return {week:x.week,d:x.d};}))')) as { week: number; d: string }[];
  const f = JSON.parse(Q.ev('JSON.stringify((function(){var f=finalScheduledDay();return f?{week:f.week,d:f.d,title:activeProg.weeks[f.week][f.d].title}:null;})())'));
  const decks = days.filter((x) => !!deckView(store, grid, x.week, x.d, now)).length;
  const fd = f ? !!deckView(store, grid, f.week, f.d, now) : false;
  withDeck += decks; sched += days.length; if (fd) finalDeck++;
  say('| ' + name + ' | ' + Q.ev('activeProg.totalWeeks') + ' | ' + days.length + ' | ' + decks + ' | ' + (f ? 'week ' + f.week + ' ' + f.d + ', ' + f.title : 'none') + ' | ' + (fd ? 'yes' : 'no') + ' |');
}
say();
say('Over the ten programs: ' + withDeck + ' of ' + sched + ' scheduled days open a deck; the final scheduled day opens one on ' + finalDeck + ' of 10.');
say();

say('## E. The season pop-up and the long gap, THE HALF MANNY');
say();
{
  const P = new Phone().launch(CREATED);
  P.generate(PROGRAMS['half-manny (Mario, NRC half, crossfit)']);
  const { first, start } = firstWeek(P, CREATED);
  const total: number = P.ev('activeProg.totalWeeks');
  // Two days trained in the first week, then two whole weeks away.
  const wa: string[] = training(P.launch(at(start, 7 * (first - 1), '00:05')), first);
  for (const d of wa.slice(0, 2)) {
    P.launch(at(start, 7 * (first - 1) + DAYS.indexOf(d))); P.settle();
    const title = P.ev(`activeProg.weeks[${first}][${J(d)}].title`);
    P.ev(`snapshotDay(${first},${J(d)});markDayComplete(${first},${J(d)},${J(title)});fireCompletionPopup(${first},${J(d)});`); P.settle();
  }
  let n0 = raises.length;
  const pre = P.dump();
  P.launch(at(start, 7 * (first + 2), '07:00')); P.settle();
  const post = P.dump();
  const r = raises.slice(n0).find((x) => x.tier === 'reminder');
  say('- A launch after two weeks away: ' + (r ? 'the reminder, "' + r.msg + '" / "' + r.sub + '", buttons ' + J(r.actions) : 'no reminder') + '. Keys it wrote: ' + J(Object.keys(post).filter((k) => post[k] !== pre[k]).map(fam)) + '.');
  // The same launch again that day, and the next day.
  n0 = raises.length;
  P.launch(at(start, 7 * (first + 2), '19:00')); P.settle();
  say('- A second launch the same day, the first not answered: ' + (raises.length - n0) + ' pop-ups raised.');
  n0 = raises.length;
  P.launch(at(start, 7 * (first + 2) + 1, '07:00')); P.settle();
  const r2 = raises.slice(n0).find((x) => x.tier === 'reminder');
  say('- A launch the next day: ' + (r2 ? 'the reminder, "' + r2.msg.slice(0, 50) + '..." / "' + r2.sub + '"' : 'no reminder') + '.');
  // The final scheduled day: launch the day after it, answer the reminder Done.
  const f = JSON.parse(P.ev('JSON.stringify((function(){var f=finalScheduledDay();return {week:f.week,d:f.d};})())'));
  n0 = raises.length;
  const pre2 = P.dump();
  P.launch(at(start, 7 * (f.week - 1) + DAYS.indexOf(f.d) + 1, '09:00')); P.settle();
  const r3 = raises.slice(n0).find((x) => x.tier === 'reminder');
  if (r3) { const acts = P.ev('__lastPop.actions') as { onclick: string }[]; P.ev(acts[0]!.onclick); P.settle(); }
  const post2 = P.dump();
  const s = raises.slice(n0).find((x) => x.tier === 'season');
  say('- The day after the final scheduled day (week ' + f.week + ' ' + f.d + ' of ' + total + '): ' + (r3 ? 'the reminder asks about "' + r3.sub + '"; answered Done: ' : 'no reminder; ') + (s ? 'the season pop-up, kicker "' + s.kicker + '", stats ' + J(s.stats) + ', line "' + s.msg + '", button ' + J(s.actions) : 'no season pop-up') + '. Keys written: ' + J(Object.keys(post2).filter((k) => post2[k] !== pre2[k]).map(fam)) + '.');
  say();
}

say('## F. The other callers of the pop-up in the ten standard histories');
say();
{
  const n0 = raises.length;
  for (const cfg of Object.values(PROGRAMS)) life(walkable(cfg), CREATED);
  const kinds: Record<string, number> = {};
  for (const r of raises.slice(n0)) { const k = r.tier + ' / ' + r.kicker.replace(/^\d+/, 'N') + (r.own ? ' / its own words' : ' / a pool line') + (r.actions.length ? ' / buttons ' + r.actions.join(', ') : ''); kinds[k] = (kinds[k] || 0) + 1; }
  for (const k of Object.keys(kinds).sort()) say('- ' + kinds[k] + ' × ' + k);
  say();
}

say('## G. Make the change, read before the page\'s timers run');
say();
{
  const { phone } = life(PROGRAMS['1.5 mile test goal, commercial, balanced'], CREATED);
  const { Q } = both(phone);
  const id: string = Q.ev('activeProgId');
  const cur: number = Q.ev('calcCurrentWeek()');
  const pre = Q.dump();
  Q.ev(`currentWeek=${cur};currentDayKey='mon';_nudgeCtx={from:'Deadlift',to:'Barbell Romanian deadlift'};acceptSwapNudge();`);
  const mid = Q.dump();
  Q.settle();
  const post = Q.dump();
  say('- Right after acceptSwapNudge: keys changed ' + J(Object.keys(mid).filter((k) => mid[k] !== pre[k]).map(fam)) + ' (the count is untouched where the pair was never counted: `' + (JSON.parse(mid['ia_swapct_' + id] || '{}')['Deadlift'] ? 'counted' : 'not counted') + '`).');
  say('- After the page\'s queued timers ran (the launch\'s reminder, 600 ms): further keys changed ' + J(Object.keys(post).filter((k) => post[k] !== mid[k]).map(fam)) + '.');
  say();
}

writeFileSync(OUT, out.join('\n') + '\n');
console.log('wrote ' + OUT + ', ' + out.length + ' lines');
