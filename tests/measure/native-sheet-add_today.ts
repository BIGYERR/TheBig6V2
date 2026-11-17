// native-sheet-add: today's add sheet and remove, the Wildcard tag, a double day's jog, the 1RM card and the day's
// note, before the Expo app's session sheet draws them (MIGRATION.md phase 3, the session sheet's second session).
// Read-only (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts
// and reads the stored keys before and after each step.
//
// A. The add sheet over the ten programs as generated: its rows by tier, its tags, and the dose every row would add.
// B. What add and remove write, step by step, on one training day of HALF_MANNY: a pick, a second, the added move
//    logged, its remove, a launch with an add standing, an add on a day already done, an add in a week gone by.
// C. Where the other four show: the Wildcard tag, the jog, the 1RM card and the note, in the ten programs' standard
//    histories and across every goal and focus.
// D. What the 1RM card's save writes, and what the next launch then does.
//
// Usage: cd tests && node measure/native-sheet-add_today.ts   (writes tests/measure/native-sheet-add_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS, RUN } from '../support/programs.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const say = (s = ''): void => { out.push(s); };
const bump = (m: Record<string, number>, k: string, n = 1): void => { m[k] = (m[k] || 0) + n; };
const list = (m: Record<string, number>): string => Object.keys(m).sort().map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';
const span = (xs: number[]): string => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[0] + ' to ' + s[s.length - 1] + ', middle ' + s[Math.floor(s.length / 2)] : 'none'; };
function family(k: string, ids: string[]): string {
  let f = k;
  for (const id of ids) f = f.split(id).join('<id>');
  return f;
}
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};
/** Which entries of which keys moved between two reads of the store. */
function diff(pre: Record<string, string>, post: Record<string, string>, ids: string[]): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    let inside = '';
    try {
      const a = pre[k] == null ? {} : JSON.parse(pre[k]!), b = post[k] == null ? {} : JSON.parse(post[k]!);
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const parts: string[] = [];
        for (const e of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
          if (JSON.stringify(a[e]) === JSON.stringify(b[e])) continue;
          let sub = '';
          if (a[e] && b[e] && typeof a[e] === 'object' && typeof b[e] === 'object' && !Array.isArray(a[e])) sub = ' {' + [...new Set([...Object.keys(a[e]), ...Object.keys(b[e])])].filter((x) => JSON.stringify(a[e][x]) !== JSON.stringify(b[e][x])).map((x) => (x in a[e] ? (x in b[e] ? '~' : '-') : '+') + x).join(' ') + '}';
          parts.push((e in a ? (e in b ? '~' : '-') : '+') + e + sub);
        }
        inside = ' [' + parts.slice(0, 6).join(', ') + (parts.length > 6 ? ', and ' + (parts.length - 6) + ' more' : '') + ']';
      } else if (Array.isArray(a) && Array.isArray(b)) {
        const parts: string[] = [];
        b.forEach((p: any, i: number) => {
          const q = a[i] || {};
          for (const e of new Set([...Object.keys(p || {}), ...Object.keys(q)])) {
            if (JSON.stringify(p[e]) === JSON.stringify(q[e])) continue;
            if (e === 'weeks' && p[e] && q[e]) {
              let days = 0;
              for (const w of Object.keys(p[e])) for (const d of DAYS) if (JSON.stringify((p[e][w] || {})[d]) !== JSON.stringify((q[e][w] || {})[d])) days++;
              parts.push('weeks {' + days + ' days differ}');
            } else if (p[e] && q[e] && typeof p[e] === 'object' && !Array.isArray(p[e])) parts.push(e + ' {' + [...new Set([...Object.keys(p[e]), ...Object.keys(q[e])])].filter((x) => JSON.stringify(p[e][x]) !== JSON.stringify(q[e][x])).map((x) => '~' + x).join(' ') + '}');
            else parts.push('~' + e);
          }
        });
        inside = ' [' + parts.join(', ') + ']';
      }
    } catch { /* not JSON */ }
    rows.push('`' + family(k, ids) + '`' + (pre[k] == null ? ' (new)' : post[k] == null ? ' (removed)' : '') + inside);
  }
  return rows.join('; ') || 'nothing';
}

say('# Today\'s add sheet, remove, the Wildcard tag, the jog, the 1RM card and the note');
say();
say('Written by `cd tests && node measure/native-sheet-add_today.ts` (read-only). Zone ' + process.env['TZ'] + '.');
say();

// The add sheet of one day, read on the page: its tiers, its tags, and the dose each row would add.
const SHEET = `(function(w,d){
  var day=activeProg.weeks[w][d]; var c=addCandidates(day,w,activeProg);
  var setCount=0; (day.sections||[]).forEach(function(s){(s.items||[]).forEach(function(it){ if(!it||it._skipped) return; var rx=parseRx(it.detail||'',it.name||''); if(rx&&!rx.open) setCount+=rx.sets; });});
  var rows=[]; ['gap','more','off'].forEach(function(t){ c[t].forEach(function(n){ var donor=addedDetailFor(day,n,w,activeProg); var detail=_swapDetailFor(n,donor); var rx=parseRx(donor,n);
    rows.push({tier:t,name:n,donor:donor,detail:detail,sets:(rx&&rx.sets)||null}); }); });
  return JSON.stringify({region:c.region||null,setCount:setCount,rows:rows,sections:Array.isArray(day.sections)});
})`;

// ── A. The add sheet over the ten programs ───────────────────────────────────────────────────────────
{
  const tiers: Record<string, number> = {}, regions: Record<string, number> = {}, doses: Record<string, number> = {}, perProg: string[] = [];
  const rowsPer: number[] = [], setTags: number[] = [];
  let days = 0, lifting = 0, cardioOnly = 0, cardioOnlyNoList = 0, empty = 0, rows = 0, fallback = 0, reshaped = 0, noSets = 0;
  const names = new Set<string>();
  for (const [pname, c] of Object.entries(PROGRAMS)) {
    const P = new Phone().launch(CREATED);
    P.generate(walkable(c));
    const prog = P.prog;
    let mine = 0;
    for (const w of Object.keys(prog.weeks).map(Number)) for (const d of DAYS) {
      const day = prog.weeks[w][d];
      if (!day || day.rest) continue;
      days++;
      const has = (day.sections || []).some((s: any) => (s.items || []).length);
      if (!has) { cardioOnly++; if (!Array.isArray(day.sections)) cardioOnlyNoList++; continue; }
      lifting++;
      const v = JSON.parse(P.ev(SHEET + `(${w},${JSON.stringify(d)})`));
      bump(regions, v.region || 'none (Today)');
      setTags.push(v.setCount);
      rowsPer.push(v.rows.length);
      if (!v.rows.length) empty++;
      for (const r of v.rows) {
        rows++; mine++;
        bump(tiers, r.tier);
        names.add(r.name);
        bump(doses, r.detail);
        if (r.donor === '3×10 — RPE 7') fallback++;
        if (r.detail !== r.donor) reshaped++;
        if (r.tier === 'more' && !r.sets) noSets++;
      }
    }
    perProg.push(pname + ' ' + mine);
  }
  say('## A. The add sheet over the ten programs as generated');
  say();
  say('- Training days: **' + days + '**. With lift work, where the whole day\'s sheet carries the add button: **' + lifting + '**. Cardio alone: ' + cardioOnly + ' (' + cardioOnlyNoList + ' of them with no list of sections for a pick to push onto).');
  say('- Rows the sheet offers, all days: **' + rows + '** (' + list(tiers) + '). Per sheet: ' + span(rowsPer) + '. Sheets that offer nothing: ' + empty + '.');
  say('- Distinct moves offered: ' + names.size + '. The region tag: ' + list(regions) + '. The sets tag: ' + span(setTags) + '.');
  say('- The dose a pick would add (`_swapDetailFor(name, addedDetailFor(...))`), every row: ' + Object.keys(doses).length + ' distinct. The fallback `3×10 — RPE 7` as the donor: ' + fallback + ' rows. Reshaped by `_swapDetailFor` (a lift with no load to move): ' + reshaped + ' rows.');
  say('- A "more" row whose dose reads no set count (its note then says 3): ' + noSets + '.');
  say('- The most common doses: ' + Object.entries(doses).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => '`' + k + '` ' + n).join(', ') + '.');
  say('- Rows by program: ' + perProg.join('; ') + '.');
  say();
}

// ── B. What add and remove write ─────────────────────────────────────────────────────────────────────
say('## B. What add and remove write (the page\'s own functions, HALF_MANNY)');
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
  const d = days[0]!;
  P.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d)));
  const ids = idsOf(P.dump());
  const step = (what: string, code: string, run: () => void): void => {
    const pre = P.dump();
    const seen = P.toasts.length;
    run();
    P.settle();
    say('| ' + what + ' | `' + code + '` | ' + diff(pre, P.dump(), ids) + ' | ' + (P.toasts.slice(seen).join(' / ') || '') + ' |');
  };
  const D = JSON.stringify(d);
  const sheet = (ww = w, dd = d): any => JSON.parse(P.ev(SHEET + `(${ww},${JSON.stringify(dd)})`));
  const pick = (v: any, tier: string, n = 0): any => v.rows.filter((r: any) => r.tier === tier)[n] || null;
  const edits = (): string => { const k = Object.keys(P.dump()).find((x) => x.startsWith('ia_edits_')); return k ? P.dump()[k]! : '(no key)'; };
  const addedOn = (ww = w, dd = d): string => JSON.stringify(((P.day(ww, dd as never) || {}).sections || []).filter((s: any) => s._added).map((s: any) => ({ label: s.label, items: s.items.map((it: any) => it.name + ' · ' + it.detail) })));
  say('| | *week ' + w + ', ' + d + ', ' + (P.day(w, d as never).title || '') + '* | | |');
  P.open(w, d as never);
  step('The add button', 'openAddSheet()', () => { P.ev('openAddSheet();'); });
  const v0 = sheet();
  const a = pick(v0, 'gap') || pick(v0, 'more') || pick(v0, 'off');
  step('A pick (' + a.name + ', "' + a.tier + '")', 'applyAddChoice(name)', () => { P.ev(`applyAddChoice(${JSON.stringify(a.name)});`); });
  const rec1 = edits(), blk1 = addedOn();
  const v1 = sheet();
  const b = pick(v1, 'more') || pick(v1, 'off') || pick(v1, 'gap');
  step('A second pick (' + b.name + ', "' + b.tier + '")', 'applyAddChoice(name)', () => { P.ev('openAddSheet();'); P.ev(`applyAddChoice(${JSON.stringify(b.name)});`); });
  const blk2 = addedOn();
  const m = /(\d+)\s*[×x]\s*(\d+)/.exec(a.detail);
  const sets = m ? Math.min(+m[1]!, 6) : 2, reps = m ? +m[2]! : 8;
  step('The first added move logged (its card\'s Log)', 'autoSaveSets; saveExWeight', () => { P.logLift(a.name, a.detail, Array.from({ length: sets }, () => reps), Array.from({ length: sets }, () => 95)); });
  const exKey: string = P.ev(`exStoreKey(${JSON.stringify(a.name)})`);
  step('Its remove (the chip\'s button)', 'removeAddedExercise(name)', () => { P.ev(`removeAddedExercise(${JSON.stringify(a.name)});`); });
  const kept = Object.keys(P.dump()).filter((k) => k.startsWith('ia_exw_')).map((k) => { try { const e = JSON.parse(P.dump()[k]!); return e[exKey] ? ((e[exKey].entries || []).length + ' entry') : null; } catch { return null; } }).filter(Boolean)[0] || 'none';
  step('The second one\'s remove', 'removeAddedExercise(name)', () => { P.ev(`removeAddedExercise(${JSON.stringify(b.name)});`); });
  const recEmpty = edits();
  step('The first move added again', 'applyAddChoice(name)', () => { P.ev('openAddSheet();'); P.ev(`applyAddChoice(${JSON.stringify(a.name)});`); });
  step('Back, and the next launch the morning after', 'closeDetail(); a cold start', () => { P.ev('closeDetail();'); P.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d) + 1, '06:30')); });
  const blkLaunch = addedOn();
  P.open(w, d as never);
  const title = JSON.stringify(P.day(w, d as never).title || '');
  step('Done', 'handleDayStatus(day, title, \'complete\')', () => { P.ev(`handleDayStatus(${D},${title},'complete');`); });
  step('Reopen the done day, and a pick', 'openDayKey(day); applyAddChoice(name)', () => { P.clearFields(); P.ev(`currentWeek=${w};openDayKey(${D});`); P.ev(`applyAddChoice(${JSON.stringify(b.name)});`); });
  step('That pick\'s remove, on the done day', 'removeAddedExercise(name)', () => { P.ev(`removeAddedExercise(${JSON.stringify(b.name)});`); });
  // A week gone by: three weeks on, the first week's second lifting day, never touched.
  const d2 = days[1];
  let blkPast = '', blkPastLaunch = '';
  if (d2) {
    P.launch(at(start, 7 * (w + 2), '06:30'));
    P.settle();
    say('| | *three weeks on: week ' + w + ', ' + d2 + ', a day never touched* | | |');
    P.open(w, d2 as never);
    const vp = sheet(w, d2);
    const c = pick(vp, 'gap') || pick(vp, 'more') || pick(vp, 'off');
    if (c) {
      step('A pick (' + c.name + ')', 'applyAddChoice(name)', () => { P.ev(`applyAddChoice(${JSON.stringify(c.name)});`); });
      blkPast = addedOn(w, d2);
      step('The next launch', 'a cold start', () => { P.ev('closeDetail();'); P.launch(at(start, 7 * (w + 2) + 1, '06:30')); });
      blkPastLaunch = addedOn(w, d2);
    }
  }
  // This week, a day never touched but for the pick: a phone of its own, so nothing above stands in its store.
  let blkFresh = '', blkFreshLaunch = '', blkFreshWeek = '';
  {
    const F = new Phone().launch(CREATED);
    F.generate(cfg);
    F.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d), '06:30'));
    F.settle();
    const fids = idsOf(F.dump());
    const fstep = (what: string, code: string, run: () => void): void => {
      const pre = F.dump();
      const seen = F.toasts.length;
      run();
      F.settle();
      say('| ' + what + ' | `' + code + '` | ' + diff(pre, F.dump(), fids) + ' | ' + (F.toasts.slice(seen).join(' / ') || '') + ' |');
    };
    const fAdded = (): string => JSON.stringify(((F.day(w, d as never) || {}).sections || []).filter((s: any) => s._added).map((s: any) => s.items.map((it: any) => it.name)));
    say('| | *another phone, this week: week ' + w + ', ' + d + ', nothing touched but the pick* | | |');
    F.open(w, d as never);
    fstep('A pick (' + a.name + ')', 'applyAddChoice(name)', () => { F.ev(`applyAddChoice(${JSON.stringify(a.name)});`); });
    blkFresh = fAdded();
    fstep('The next launch, the morning after', 'a cold start', () => { F.ev('closeDetail();'); F.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d) + 1, '06:30')); });
    blkFreshLaunch = fAdded();
    fstep('The launch a week on', 'a cold start', () => { F.launch(at(start, 7 * w + DAYS.indexOf(d), '06:30')); });
    blkFreshWeek = fAdded();
  }
  say();
  say('- This week, nothing touched but the pick: after it `' + blkFresh + '`; after the next morning\'s launch `' + blkFreshLaunch + '`; after the launch a week on `' + blkFreshWeek + '`.');
  say('- The record after the first pick (`ia_edits_<id>`): `' + rec1.split(ids[0] || '\u0000').join('<id>') + '`.');
  say('- The day\'s added block after it: `' + blk1 + '`; after the second: `' + blk2 + '`.');
  say('- After the logged move\'s remove, its lift log entry: ' + kept + ' (remove does not take a logged lift back).');
  say('- After both removes the record reads: `' + recEmpty + '`.');
  say('- After the next launch the day still holds: `' + blkLaunch + '`.');
  if (d2) say('- The week gone by: after the pick `' + blkPast + '`; after the next launch `' + blkPastLaunch + '`.');
  say();
}

// ── C. Where the other four show ─────────────────────────────────────────────────────────────────────
say('## C. Where the Wildcard tag, the jog, the 1RM card, the note and an added move show');
say();
{
  const T = { days: 0, added: 0, removable: 0, wildcard: 0, jog: 0, e1rm: 0, note: 0 };
  const where: string[] = [];
  for (const [pname, c] of Object.entries(PROGRAMS)) {
    const { phone: P } = life(walkable(c), CREATED);
    const prog = P.prog;
    const logs = P.ev('getLogs()') || {};
    const mine: string[] = [];
    for (const w of Object.keys(prog.weeks).map(Number)) for (const d of DAYS) {
      const day = prog.weeks[w][d];
      if (!day || day.rest) continue;
      T.days++;
      const added = (day.sections || []).filter((s: any) => s._added);
      if (added.length) { T.added++; T.removable += added.reduce((n: number, s: any) => n + (s.items || []).length, 0); mine.push('added w' + w + ' ' + d); }
      if (P.ev(`wildcardOn(${w},${JSON.stringify(d)})`)) { T.wildcard++; mine.push('wildcard w' + w + ' ' + d); }
      const e = logs[P.ev(`completedKey(${w},${JSON.stringify(d)})`)];
      if ((P.ev('restLogLines')(e && e.restLog) || []).length) { T.jog++; mine.push('jog w' + w + ' ' + d); }
      if (day.testLift) T.e1rm++;
      if (day.note) T.note++;
    }
    if (mine.length) where.push(pname + ': ' + mine.join(', '));
  }
  say('The ten programs at the end of the standard history (`tests/support/stored-state.ts` `life`), every training day:');
  say();
  say('| What the sheet would draw | Days of ' + T.days + ' |');
  say('|---|---|');
  say('| an added block (with ' + T.removable + ' moves that carry a remove) | ' + T.added + ' |');
  say('| the Wildcard tag | ' + T.wildcard + ' |');
  say('| a double day\'s jog | ' + T.jog + ' |');
  say('| the 1RM card | ' + T.e1rm + ' |');
  say('| the day\'s note | ' + T.note + ' |');
  say();
  for (const x of where) say('- ' + x);
  say();
}

// Every goal the wizard offers, crossed with every focus (the cross of tests/sweeps/program-shape.test.ts).
const GOALS: Record<string, any> = {
  run_5k: RUN.k5, run_10k: RUN.k10, run_half: { id: 'run_half', label: 'Half', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' },
  run_marathon: RUN.marathon, run_pace_goal: RUN.pace, run_base: RUN.base,
  bike_century: { id: 'bike_century' }, bike_50: { id: 'bike_50' }, bike_ftp: { id: 'bike_ftp', ftp: '200' }, bike_cals: { id: 'bike_cals' }, bike_base: { id: 'bike_base' },
  swim_tri: { id: 'swim_tri' }, swim_mile: { id: 'swim_mile' }, swim_100_time: { id: 'swim_100_time', targetMins: '1', targetSecs: '45', swimUnit: 'yd' },
  swim_500_time: { id: 'swim_500_time', targetMins: '9', targetSecs: '0', swimUnit: 'yd' }, swim_base: { id: 'swim_base' },
};
const RACES: Record<string, string> = { run_5k: '2026-11-15', run_10k: '2026-11-29', run_half: '2026-12-06', run_marathon: '2027-02-28', bike_century: '2027-03-01', swim_tri: '2027-01-10' };
const FOCUSES = ['strength', 'hypertrophy', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const TIERS = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
let testCfg: any = null;
{
  const P = new Phone().launch(CREATED);
  const goalSets: string[][] = [[], ...Object.keys(GOALS).map((g) => [g]), ['run_base', 'bike_base'], ['run_5k', 'swim_base'], ['run_base', 'bike_ftp', 'swim_base']];
  let n = 0, progs = 0, withTest = 0, withNote = 0, testDays = 0, noteDays = 0, allDays = 0;
  const lens: Record<string, number> = {}, testIn: string[] = [], notes: Record<string, number> = {}, lifts: Record<string, number> = {};
  for (const set of goalSets) for (const focus of FOCUSES) {
    n++;
    const cardioGoals: Record<string, any> = {};
    for (const g of set) cardioGoals[g.split('_')[0]!] = GOALS[g];
    const race = set.map((g) => RACES[g]).find(Boolean);
    const cfg: any = {
      name: 'SWEEP', primaryPath: race ? 'event' : 'body', cardioTypes: Object.keys(cardioGoals), cardioGoals,
      eventTargeted: !!race, liftingFocus: focus, experience: LEVELS[n % 3], ageBracket: '18-35',
      equipment: TIERS[n % 6], unit: n % 2 ? 'lbs' : 'kg', restDays: ['sun'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      bench: 135, squat: 155, deadlift: 185, seed: 1000 + n,
    };
    if (race) cfg.raceDate = race;
    if (n % 3 === 1) cfg.injury = { region: 'knee', tier: 'protect' };
    P.IA.ctx['__cfg'] = cfg;
    const prog = P.ev('buildProgram(JSON.parse(JSON.stringify(__cfg)))');
    progs++;
    const tw = Object.keys(prog.weeks).length;
    bump(lens, tw <= 6 ? 'six weeks or fewer' : 'longer');
    let t = 0, nn = 0;
    for (const w of Object.keys(prog.weeks)) for (const d of DAYS) {
      const day = prog.weeks[w][d];
      if (!day || day.rest) continue;
      allDays++;
      if (day.testLift) { t++; bump(lifts, String(day.testLift)); }
      if (day.note) { nn++; bump(notes, String(day.note)); }
    }
    if (t) { withTest++; testDays += t; testIn.push((set.join('+') || 'no cardio') + ' / ' + focus + ' (' + tw + ' wk, ' + t + ' days)'); if (!testCfg) { testCfg = { ...cfg, unit: 'lbs' }; delete testCfg.injury; } }
    if (nn) { withNote++; noteDays += nn; }
  }
  say('Every goal the wizard offers crossed with every focus (' + progs + ' programs as built, ' + allDays + ' training days; the cross of `tests/sweeps/program-shape.test.ts`):');
  say();
  say('- Program length: ' + list(lens) + '.');
  say('- Programs with a 1RM card: **' + withTest + '** of ' + progs + ', ' + testDays + ' days (' + list(lifts) + ').');
  say('- Programs with a day\'s note: **' + withNote + '** of ' + progs + ', ' + noteDays + ' days.');
  for (const [k, v] of Object.entries(notes)) say('  - ' + v + ' days: "' + k + '"' + (/[<&]/.test(k) ? ' (holds markup)' : ' (plain words, no markup)'));
  say('- The programs with a 1RM card: ' + (testIn.join('; ') || 'none') + '.');
  say();
}

// ── D. The 1RM card's save ───────────────────────────────────────────────────────────────────────────
say('## D. The 1RM card\'s save');
say();
if (!testCfg) say('No program of the cross holds a test day, so the save is not run.');
else {
  const P = new Phone().launch(CREATED);
  P.generate(testCfg);
  const { start } = firstWeek(P, CREATED);
  const prog = P.prog;
  const tw = Object.keys(prog.weeks).length;
  const hits: { w: number; d: string; lift: string }[] = [];
  for (const w of Object.keys(prog.weeks).map(Number)) for (const d of DAYS) { const day = prog.weeks[w][d]; if (day && day.testLift) hits.push({ w, d, lift: String(day.testLift) }); }
  const hit = hits[0]!;
  P.launch(at(start, 7 * (hit.w - 1) + DAYS.indexOf(hit.d)));
  P.settle();
  const ids = idsOf(P.dump());
  const day = P.day(hit.w, hit.d as never);
  const main = day.sections[0].items[0];
  say('The first program of the cross with a test day, in pounds and with its injury taken off: `' + (Object.keys(testCfg.cardioGoals).join('+') || 'no cardio') + ' / ' + testCfg.liftingFocus + '`, ' + tw + ' weeks, seed ' + testCfg.seed + '. Its test days: ' + hits.map((h) => 'week ' + h.w + ' ' + h.d + ' (' + h.lift + ')').join(', ') + '.');
  say();
  say('- The day: "' + day.title + '", tags ' + JSON.stringify(day.tags) + ', its first move `' + main.name + ' · ' + main.detail + '`. The card stands between the first section and the rest.');
  say('- The note under the work: "' + day.note + '"');
  say();
  say('| Step | On the page | Keys it changed | Toasts |');
  say('|---|---|---|---|');
  const step = (what: string, code: string, run: () => void): void => {
    const pre = P.dump();
    const seen = P.toasts.length;
    run();
    P.settle();
    say('| ' + what + ' | `' + code + '` | ' + diff(pre, P.dump(), ids) + ' | ' + (P.toasts.slice(seen).join(' / ') || '') + ' |');
  };
  P.open(hit.w, hit.d as never);
  const cfgBefore = JSON.stringify({ bench: P.prog.cfg.bench, squat: P.prog.cfg.squat, deadlift: P.prog.cfg.deadlift });
  step('The test set logged (225 for 3, the first move\'s card)', 'autoSaveSets; saveExWeight', () => { P.logLift(main.name, main.detail, [3], [225]); });
  const L = JSON.stringify(hit.lift);
  // e1rm-card.ts save(): the estimate into the stored program's config and the active one's, then savePrograms.
  step('Save as new ' + hit.lift + ' max (225 for 3: 248)', 'getPrograms; cfg[lift] = 248; savePrograms', () => {
    P.ev(`(function(){var ps=getPrograms();var p=ps.filter(function(x){return x&&x.id===activeProgId;})[0];if(p&&p.cfg){p.cfg[${L}]=248;if(activeProg&&activeProg.cfg)activeProg.cfg[${L}]=248;savePrograms(ps);}})()`);
  });
  const cfgAfter = JSON.stringify({ bench: P.prog.cfg.bench, squat: P.prog.cfg.squat, deadlift: P.prog.cfg.deadlift });
  step('The next launch, the morning after', 'a cold start', () => { P.launch(at(start, 7 * (hit.w - 1) + DAYS.indexOf(hit.d) + 1, '06:30')); });
  say();
  say('- The config\'s maxes before: `' + cfgBefore + '`; after the save: `' + cfgAfter + '`.');
  say('- The save raises no toast: the card itself says "Saved. Your next block anchors off 248 lbs." and hides its button.');
  say();
}

writeFileSync(join(REPO, 'tests/measure/native-sheet-add_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
