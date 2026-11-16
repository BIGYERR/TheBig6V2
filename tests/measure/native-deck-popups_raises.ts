// native-deck-popups: what today's app does when a pop-up is raised (the completion pop-up, the day-after reminder,
// the swap nudge), which keys each writes, and whether the Expo app can do the nudge's rebuild with core as it stands.
// Read-only (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts.
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-deck-popups_raises.ts
//        (writes tests/measure/native-deck-popups_raises.md; the resolver finds the Expo app's imports, which carry no extension)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = join(import.meta.dirname, '../..');
const OUT = join(import.meta.dirname, 'native-deck-popups_raises.md');
const sup = async (f: string): Promise<any> => import(W + '/tests/support/' + f);
const { PROGRAMS } = await sup('programs.ts');
const SS = await sup('stored-state.ts');
const { Phone, at, firstWeek, life, training, DAYS } = SS;
const { both } = await sup('native-deck-swap.ts');
const { TwoDecks, tally, held } = await sup('native-deck-logging.ts');
const { sqliteTestStore } = await sup('sqlite-kv.ts');
const { launchNow } = await sup('native-this-week.ts');
const core = async (f: string): Promise<any> => import(W + '/core/src/engine/' + f);
const { recordSwapPreference, readPrograms } = await core('state-programs.ts');
const { markSwapNudged, countSwap, readSwapCounts } = await core('state-swaps.ts');
const { refreshStoredProgram } = await core('state-refresh.ts');

const out: string[] = [];
const say = (s = ''): void => { out.push(s); };
const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const bump = (m: Record<string, number>, k: string): void => { m[k] = (m[k] || 0) + 1; };
const list = (m: Record<string, number>): string => Object.keys(m).sort().map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';
const CREATED = '2026-08-29T09:00:00';
const fam = (k: string): string => k.replace(/prog_\d+.*$/, '<id>');

// ── The hooks: every pop-up raised, and every key written while one of the pop-up functions is running. ──
interface Raise { tier: string; kicker: string; msg: string; own: boolean; sub: string; actions: string[]; stats: string[]; via: string }
const raises: Raise[] = [];
const writes: Record<string, Record<string, number>> = {};
let hooked: any = null;
const launch0 = Phone.prototype.launch;
Phone.prototype.launch = function (this: any, when: string, opts: { init?: boolean } = {}): any {
  launch0.call(this, when, { init: false });
  const ctx = this.IA.ctx;
  ctx.__raise = (r: Raise) => { raises.push(plain(r)); };
  ctx.__wrote = (via: string, key: string) => { const f = fam(key); (writes[via] = writes[via] || {})[f] = ((writes[via] || {})[f] || 0) + 1; };
  this.ev(`(function(){
    var stack=[];
    ['fireCompletionPopup','maybeShowReminder','resolveReminder','markPastAsked','releaseSeasonShown','acceptSwapNudge','dismissSwapNudge','popDismissText','popPick'].forEach(function(n){
      var o=globalThis[n]; if(typeof o!=='function') throw new Error('no '+n);
      globalThis[n]=function(){ stack.push(n); try{ return o.apply(this,arguments); } finally { stack.pop(); } };
    });
    var s0=iaStore.set, r0=iaStore.remove;
    iaStore.set=function(k,v){ if(stack.length) __wrote(stack.join(' > '),String(k)); return s0.apply(this,arguments); };
    iaStore.remove=function(k){ if(stack.length) __wrote(stack.join(' > ')+' (remove)',String(k)); return r0.apply(this,arguments); };
    var p0=popFire;
    popFire=function(tier,opts){ var r=p0.apply(this,arguments); opts=opts||{}; var cfg=POP_CFG[tier]||POP_CFG.workout;
      __raise({tier:tier,kicker:opts.kicker||cfg.kicker,msg:document.getElementById('popMsg').textContent,own:!!opts.msg,sub:opts.sub||'',
        actions:(opts.actions||[]).map(function(a){return a.label+' => '+a.onclick;}),stats:(opts.stats||[]).map(function(s){return s.l.replace(/<[^>]+>/g,'').trim();}),via:stack.join(' > ')||'(direct)'});
      globalThis.__lastPop={tier:tier,actions:(opts.actions||[])};
      return r; };
  })()`);
  hooked = this;
  if (opts.init !== false) this.ev('init()');
  return this;
};
void hooked;

// ── A. The ten standard histories. ──
say('# The pop-ups in today\'s app: what raises each, and what it writes');
say();
say('Read-only measure, today\'s page in the VM harness, the clock and Math.random pinned, America/New_York.');
say();
say('## A. The ten standard histories (three weeks each, the walk of tests/support/stored-state.ts)');
say();
{
  const tiers: Record<string, number> = {};
  let n0 = raises.length;
  for (const [name, cfg] of Object.entries(PROGRAMS)) {
    const walkable = (c: any): any => (c.cardioGoals && c.cardioGoals.swim ? { ...c, cardioGoals: { ...c.cardioGoals, swim: { ...c.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : c);
    life(walkable(cfg), CREATED);
    void name;
  }
  for (const r of raises.slice(n0)) bump(tiers, r.tier + ' via ' + r.via + (r.own ? ' (its own words)' : ' (a line from the pool)'));
  say('Pop-ups raised, ' + (raises.length - n0) + ' in all: ' + list(tiers) + '.');
  say();
}

// ── B. One whole program: every training day of HALF_MANNY, some missed, one long gap. ──
say('## B. THE HALF MANNY, start to finish');
say();
say('Every training day marked done at 18:00 on its own date the way the deck marks it (snapshotDay, markDayComplete, fireCompletionPopup), except: every seventh training day is not opened (the reminder asks the next launch, answered Done and Skip in turn), and one whole week is not opened (the long gap).');
say();
{
  const n0 = raises.length;
  for (const k of Object.keys(writes)) delete writes[k];
  const P = new Phone().launch(CREATED);
  P.generate(PROGRAMS['half-manny (Mario, NRC half, crossfit)']);
  const { first, start } = firstWeek(P, CREATED);
  const total: number = P.ev('activeProg.totalWeeks');
  let g = 0, answered = 0;
  const rows: string[] = [];
  const gapWeek = first + 5;
  for (let w = first; w <= total; w++) {
    if (w === gapWeek) continue;
    const days: string[] = training(P.launch(at(start, 7 * (w - 1), '00:05')), w);
    for (const d of days) {
      g++;
      if (g % 7 === 5) continue;
      const before = raises.length;
      P.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d)));
      P.settle();
      const rem = raises.slice(before).find((r) => r.tier === 'reminder');
      if (rem) {
        const acts = P.ev('__lastPop.actions') as { label: string; onclick: string }[];
        const pick = acts[answered++ % 2]!;
        P.ev(pick.onclick);
        P.settle();
        rows.push('week ' + w + ' ' + d + ': reminder "' + rem.msg.slice(0, 60) + '" / "' + rem.sub + '", answered ' + pick.label);
      }
      const title = P.ev(`activeProg.weeks[${w}][${J(d)}].title`);
      P.ev(`snapshotDay(${w},${J(d)});markDayComplete(${w},${J(d)},${J(title)});fireCompletionPopup(${w},${J(d)});`);
      P.settle();
    }
  }
  const mine = raises.slice(n0);
  const tiers: Record<string, number> = {};
  for (const r of mine) bump(tiers, r.tier + ' via ' + r.via + (r.own ? ' (its own words)' : ' (a line from the pool)'));
  say('Weeks ' + first + ' to ' + total + ', ' + g + ' training days, week ' + gapWeek + ' not opened. Pop-ups raised, ' + mine.length + ': ' + list(tiers) + '.');
  say();
  say('The streak and season pop-ups, each as raised:');
  say();
  for (const r of mine.filter((x) => x.tier === 'streak' || x.tier === 'season')) say('- ' + r.tier + ': kicker "' + r.kicker + '", stats [' + r.stats.join(', ') + '], line "' + r.msg.slice(0, 70) + '"');
  say();
  say('The reminders, each as raised and answered:');
  say();
  for (const r of rows) say('- ' + r);
  say();
  say('Keys written while each pop-up function ran (the function chain, then each key family and how many writes):');
  say();
  for (const via of Object.keys(writes).sort()) say('- `' + via + '`: ' + list(writes[via]!));
  say();
  const keys = Object.keys(P.dump()).map(fam);
  say('The store at the end holds these pop-up families: ' + keys.filter((k) => /pop_|season|remind/.test(k)).join(', ') + '.');
  say();
}

// ── C. The nudge: three picks running of one pair, then each answer, on today's page and with core's own functions. ──
say('## C. The swap nudge');
say();
function nudgeCase(name: string, P: any): void {
  const { Q, store, grid } = both(P);
  const now = launchNow(Q).getTime();
  const cur: number = Q.ev('calcCurrentWeek()');
  const T = tally();
  let done = false;
  const weeks = Object.keys(grid.weeks).map(Number).sort((a: number, b: number) => a - b).filter((w: number) => w >= cur);
  for (const w of weeks) {
    for (const d of DAYS) {
      if (done) break;
      const day = (grid.weeks[w] || {})[d];
      if (!day || day.rest || !Array.isArray(day.sections) || !day.sections.length) continue;
      if (Q.ev(`statusOf(${w},${J(d)})`)) continue;
      const D = new TwoDecks(Q, store, grid, w, d, T, name + ' week ' + w + ' ' + d);
      D.answers = false;   // the measure reads the nudge unanswered, then answers it itself (the walk answers it since the pop-ups were built)
      if (!D.open()) continue;
      let spot: { secIdx: number; itemIdx: number } | null = null; let to: string | null = null; let from: string | null = null;
      for (const c of D.cards()) {
        for (const x of D.moves(c)) {
          if (!x.swap || spot) continue;
          const sh = D.sheet(x.swap.secIdx, x.swap.itemIdx);
          const rows = sh ? [...sh.view.sameJob, ...sh.view.otherJob].map((r: any) => r.name) : [];
          if (rows.length) { spot = { secIdx: x.swap.secIdx, itemIdx: x.swap.itemIdx }; to = rows[0]; from = x.name; }
        }
      }
      if (!spot || !to || !from) continue;
      const moveAt = (): any => D.cards().flatMap((c: any) => D.moves(c)).find((x: any) => x.swap && x.swap.secIdx === spot!.secIdx && x.swap.itemIdx === spot!.itemIdx);
      for (let i = 0; i < 3; i++) {
        const sh = D.sheet(spot.secIdx, spot.itemIdx);
        D.swap(sh, to);
        if (i < 2) D.unswap(moveAt().swappedFrom);
      }
      done = true;
      const id: string = Q.ev('activeProgId');
      say('### ' + name);
      say();
      say('Week ' + w + ', ' + d + ' (the launch is in week ' + cur + '): ' + from + ' traded for ' + to + ' three times running, put back between picks. ' + T.nudges + ' nudge came due, on both apps.');
      say();
      say('- The count both stores hold, the nudge not answered: `' + J(readSwapCounts(store, id)[from]) + '`.');
      // D: the next pick of the same pair on the beta's store, on a copy.
      const copy = sqliteTestStore();
      for (const [k, v] of Object.entries(held(store))) copy.set(k, v as string);
      say('- A fourth pick of the same pair, on a copy of the beta\'s store: countSwap gives back `' + J(countSwap(copy, id, from, to)) + '`, so the nudge is due again. A pick of another lift: `' + J(countSwap(copy, id, from, 'Some other lift')) + '` stored as `' + J(readSwapCounts(copy, id)[from]) + '`.');
      // Leave the plan alone, on copies.
      {
        const c2 = sqliteTestStore();
        for (const [k, v] of Object.entries(held(store))) c2.set(k, v as string);
        const before = held(c2);
        markSwapNudged(c2, id, from);
        const after = held(c2);
        say('- Leave the plan alone, with core\'s markSwapNudged on a copy: keys changed ' + J(Object.keys(after).filter((k) => after[k] !== before[k]).map(fam)) + ', the count now `' + J(readSwapCounts(c2, id)[from]) + '`.');
      }
      // Make the change: today's page.
      const pre = Q.dump(), gridPre = plain(Q.prog);
      const t0 = Q.toasts.length;
      Q.ev(`currentWeek=${w};currentDayKey=${J(d)};_nudgeCtx=${J({ from, to })};acceptSwapNudge();`);
      Q.settle();
      const post = Q.dump(), gridPost = plain(Q.prog);
      const changed = [...new Set([...Object.keys(pre), ...Object.keys(post)])].filter((k) => pre[k] !== post[k]);
      say('- Make the change, today\'s page (acceptSwapNudge): keys changed ' + J(changed.map((k) => fam(k) + ' ' + (pre[k] || '').length + ' to ' + (post[k] || '').length + ' bytes')) + '. Toast: "' + Q.toasts.slice(t0).join(' | ') + '".');
      const pPre = JSON.parse(pre['ia_programs']!).find((p: any) => p.id === id), pPost = JSON.parse(post['ia_programs']!).find((p: any) => p.id === id);
      say('  - In ia_programs: the stored grid is ' + (J(pPre.weeks) === J(pPost.weeks) ? 'the same, byte for byte' : 'CHANGED') + '; cfg.exSwapPrefs `' + J(pPre.cfg.exSwapPrefs || null) + '` to `' + J(pPost.cfg.exSwapPrefs) + '`; every other cfg field ' + (J({ ...pPre.cfg, exSwapPrefs: 0 }) === J({ ...pPost.cfg, exSwapPrefs: 0 }) ? 'the same' : 'CHANGED') + '.');
      say('  - ia_hist_ ' + (pre['ia_hist_' + id] === post['ia_hist_' + id] ? 'the same' : 'CHANGED') + ', ia_swaps_ ' + (pre['ia_swaps_' + id] === post['ia_swaps_' + id] ? 'the same' : 'CHANGED') + ', ia_edits_ ' + (pre['ia_edits_' + id] === post['ia_edits_' + id] ? 'the same' : 'CHANGED') + '.');
      const daysChanged: string[] = [];
      let trainedChanged = 0, pastChanged = 0;
      for (const ww of Object.keys(gridPost.weeks).map(Number).sort((a, b) => a - b)) for (const dd of DAYS) {
        const a = (gridPre.weeks[ww] || {})[dd], b = (gridPost.weeks[ww] || {})[dd];
        if (J(a) === J(b)) continue;
        const st = Q.ev(`statusOf(${ww},${J(dd)})`);
        const hist = !!(JSON.parse(post['ia_hist_' + id] || '{}')['w' + ww + '_' + dd]);
        daysChanged.push('w' + ww + ' ' + dd + (st ? ' [' + st + ']' : '') + (hist ? ' [has a snapshot]' : ''));
        if (st) trainedChanged++;
        if (ww < cur) pastChanged++;
      }
      say('  - The grid in hand: ' + daysChanged.length + ' days changed (' + trainedChanged + ' of them marked, ' + pastChanged + ' in a week before the launch\'s): ' + daysChanged.slice(0, 14).join(', ') + (daysChanged.length > 14 ? ', ...' : '') + '.');
      // Make the change: core's own functions over the beta's store.
      const told = { overlay: 0, freeze: 0, rebuild: 0 };
      const report = { overlay: () => { told.overlay++; }, freeze: () => { told.freeze++; }, rebuild: () => { told.rebuild++; } };
      const p = recordSwapPreference(store, id, from, to);
      if (p) markSwapNudged(store, id, from);
      const grid2 = p ? refreshStoredProgram(store, p, now, report) : null;
      const betaKeys = held(store);
      const diffKeys = [...new Set([...Object.keys(betaKeys), ...Object.keys(post)])].filter((k) => betaKeys[k] !== post[k]);
      say('- Make the change, core\'s own recordSwapPreference, markSwapNudged and refreshStoredProgram over the beta\'s SQLite store at the same instant: keys that differ from today\'s page ' + J(diffKeys.map(fam)) + '; the grid handed back is ' + (J(plain(grid2)) === J(gridPost) ? 'the page\'s, whole' : 'NOT the page\'s') + '; failures reported ' + J(told) + '.');
      void readPrograms;
      say();
    }
    if (done) break;
  }
  if (!done) { say('### ' + name); say(); say('No untrained day with a swap to pick from the launch\'s week on.'); say(); }
}
{
  const P = new Phone().launch(CREATED);
  P.generate(PROGRAMS['half-manny (Mario, NRC half, crossfit)']);
  const { first, start } = firstWeek(P, CREATED);
  P.launch(at(start, 7 * (first - 1), '06:30'));
  nudgeCase('THE HALF MANNY, its first week, nothing trained', P);
}
for (const name of ['half-manny (Mario, NRC half, crossfit)', '1.5 mile test goal, commercial, balanced', 'run base and bike base, crossfit, balanced']) {
  const { phone } = life(PROGRAMS[name], CREATED);
  nudgeCase(name + ', after the standard history (three weeks trained, an injury come and gone, travel, edits, two weeks away)', phone);
}

writeFileSync(OUT, out.join('\n') + '\n');
console.log('wrote ' + OUT + ', ' + out.length + ' lines');
