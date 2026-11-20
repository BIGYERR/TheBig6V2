// native-rest-sheet: today's rest day sheet (Move a session here, Log cardio, Clear) and the coach's mile nudge
// (D274), before the Expo app draws them (MIGRATION.md phase 3, row 5, the second of three sessions). Read-only
// (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts, reads the
// sheet as the page writes it (rest-day-shell.ts: markup, there is no Angular model), and reads the stored keys, the
// keys asked for, the grid in hand and the page's own calls before and after each tap. The nudge is the Angular
// screen's own model (frontends/app/src/app/screens/mile-nudge) handed the page's readers, as its screen hands them.
//
// A. Where the sheet opens: the ten programs at each stretch of the standard history, every week up to the one in view.
// B. What the sheet draws: each kind of thing its three views can hold, counted off the markup of every draw.
// C. What each tap reads and writes, key family by key family.
// D. Move: what it changes, and the carried item (a session moved off a day that holds a snapshot).
// E. The coach's mile nudge: when it is judged, when it offers, what its answers write.
//
// Usage: cd tests && node measure/native-rest-sheet_today.ts   (writes tests/measure/native-rest-sheet_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { DAYS, Phone, at, life } from '../support/stored-state.ts';
import { judgeNudge, nudgeText, offerFields } from '../../frontends/app/src/app/screens/mile-nudge/mile-nudge-model.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const NAMES = Object.keys(PROGRAMS);
const CFGS = Object.values(PROGRAMS).map(walkable);
const J = JSON.stringify;
const bump = (T: Record<string, number>, k: string, n = 1): void => { T[k] = (T[k] || 0) + n; };

const fam = (k: string, id: string): string => k.split(id).join('<id>');
/** The stored keys that differ, by family. */
function diff(pre: Record<string, string>, post: Record<string, string>, id: string): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    rows.push('`' + fam(k, id) + '`' + (pre[k] == null ? ' new' : post[k] == null ? ' removed' : ' changed'));
  }
  return rows.join(', ') || 'nothing';
}
const nowIso = (P: Phone): string => P.ev("(function(){var d=new Date();var p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())+':00';})()");
interface Snap { keys: Record<string, string>; iso: string }
const snap = (P: Phone): Snap => ({ keys: P.dump(), iso: nowIso(P) });
function phoneOf(s: Snap, iso = s.iso): Phone {
  const P = new Phone();
  for (const [k, v] of Object.entries(s.keys)) P.damage(k, v);
  P.launch(iso);
  P.settle();
  return P;
}
const WATCHED = ['refreshProgram', 'buildProgram', 'savePrograms', 'saveLogs', 'renderWeekView', 'openDetail', 'applyRestDayMoves', 'closeRestSheet', 'renderRestSheet'];
/** Counts the page's own calls and the keys it asks the store for, from here on. */
function watch(P: Phone): void {
  P.IA.ctx['__n'] = {}; P.IA.ctx['__r'] = {};
  if (P.IA.ctx['__watched']) return;
  P.IA.ctx['__watched'] = true;
  for (const f of WATCHED) P.ev(`${f}=(function(o){return function(){__n.${f}=(__n.${f}||0)+1;return o.apply(this,arguments);};})(${f});`);
  P.ev('iaStore.get=(function(o){return function(k){__r[k]=1;return o.apply(this,arguments);};})(iaStore.get);');
}
const gridOf = (P: Phone): Record<string, string> => JSON.parse(P.ev("(function(){var o={};if(!activeProg||!activeProg.weeks)return '{}';Object.keys(activeProg.weeks).forEach(function(w){Object.keys(activeProg.weeks[w]).forEach(function(d){o['w'+w+'_'+d]=JSON.stringify(activeProg.weeks[w][d]);});});return JSON.stringify(o);})()"));
interface Tap { wrote: string; read: string; n: Record<string, number>; toasts: string[]; days: number; sheet: string }
function tap(P: Phone, code: string): Tap {
  P.settle();
  const id: string = P.ev('activeProgId');
  watch(P);
  const pre = P.dump(), t0 = P.toasts.length, g0 = gridOf(P);
  P.ev(code); P.settle();
  const g1 = gridOf(P);
  let days = 0;
  for (const k of new Set([...Object.keys(g0), ...Object.keys(g1)])) if (g0[k] !== g1[k]) days++;
  const read = Object.keys(JSON.parse(P.ev('JSON.stringify(__r)'))).map((k) => '`' + fam(k, id) + '`').sort().join(', ') || 'nothing';
  const n: Record<string, number> = JSON.parse(P.ev('JSON.stringify(__n)'));
  // The harness's class list holds nothing, so the sheet's state is read from the page's own calls.
  const sheet = n['closeRestSheet'] ? 'closes' : n['renderRestSheet'] ? 'drawn' : /^openRestSheet/.test(code) ? 'stays shut' : 'as it was';
  return { wrote: diff(pre, P.dump(), id), read, n, toasts: P.toasts.slice(t0), days, sheet };
}
const calls = (n: Record<string, number>): string => ['refreshProgram', 'buildProgram', 'applyRestDayMoves', 'savePrograms', 'saveLogs', 'renderWeekView', 'openDetail'].filter((f) => n[f]).map((f) => f + ' ' + n[f]).join(', ') || 'none';
const body = (P: Phone): string => String(P.ev("document.getElementById('restBody').innerHTML") || '');
const count = (s: string, re: RegExp): number => (s.match(re) || []).length;
const mondayIso = (P: Phone): string => String(P.ev("(function(){var m=getWeekMonday(activeProg.startDate);return m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0');})()"));

say('# Today\'s rest day sheet and the coach\'s mile nudge (measure, before the Expo app draws them)');
say();
say('Made by `tests/measure/native-rest-sheet_today.ts` on today\'s page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each through the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed.');
say();

// ── The ten programs through the standard history, a snapshot at each stretch ──
const STAGES = ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away'];
const snaps: Record<string, Record<string, Snap>> = {};
for (let i = 0; i < CFGS.length; i++) {
  const s: Record<string, Snap> = {};
  life(CFGS[i], CREATED, undefined, (stage, P) => { s[stage] = snap(P); });
  snaps[NAMES[i]!] = s;
}

// ── A. Where the sheet opens ────────────────────────────────────────────────
say('## A. Where the sheet opens');
say();
say('Today\'s app (the Angular screens) has two doors and the page a third:');
say();
say('- This Week, the rest card of the day picked: **Training anyway?** opens the sheet on Move (`openRestSheet(week, day, \'move\')`), and **Log cardio**, or **Edit cardio** once a jog line prints, opens it on Log cardio (`\'cardio\'`). Training anyway? is not drawn on a rest day whose session moved away (`week-view.ts` `restSheet`, `week-view-model.ts`).');
say('- The session sheet of a double day (a training day that holds a jog): the Also on the day block\'s **Edit cardio** (`\'cardio\'`).');
say('- The page alone (the PWA\'s week list, `openDayKey` on a rest day): the sheet with no view asked, which is the menu, **Not resting?**. No Angular screen calls it that way, so today\'s iOS app never draws the menu.');
say();
say('Counted on every week from the first to the one in view, at each stretch:');
say();
say('| Stretch | Rest days | The sheet opens (the day has come) | Refused: not come around yet | Before the start | Move offered | Log cardio alone (the session moved away) | Double days |');
say('|---|---|---|---|---|---|---|---|');
for (const stage of STAGES) {
  const T: Record<string, number> = {};
  for (const name of NAMES) {
    const P = phoneOf(snaps[name]![stage]!);
    const cur: number = Number(P.ev('calcCurrentWeek()'));
    for (let w = 1; w <= cur; w++) for (const d of DAYS) {
      const x = P.day(w, d); if (!x) continue;
      const jog = !!P.ev(`restJogEligible(${w},'${d}')`), mv = !!P.ev(`restDayEligible(${w},'${d}')`);
      if (!x.rest) { if (jog) bump(T, 'double'); continue; }
      bump(T, 'rest');
      if (P.ev(`dayBeforeStart(activeProg,${w},'${d}')`)) bump(T, 'before');
      else if (!jog) bump(T, 'future');
      if (jog) bump(T, 'opens');
      if (mv) bump(T, 'move');
      if (jog && !mv) bump(T, 'cardioOnly');
    }
  }
  const g = (k: string): number => T[k] || 0;
  say('| ' + stage + ' | ' + g('rest') + ' | ' + g('opens') + ' | ' + g('future') + ' | ' + g('before') + ' | ' + g('move') + ' | ' + g('cardioOnly') + ' | ' + g('double') + ' |');
}
say();
say('- The standard history logs no jog, so it makes no double day: a walk of its own makes one (section C).');
say();

// ── B and C. What the sheet draws, and what each tap reads and writes ───────
const K: Record<string, number> = {};
/** Counts each kind of thing one draw of the sheet holds, off the page's markup. */
function kinds(P: Phone): void {
  const h = body(P); if (!h) return;
  bump(K, 'draws');
  if (h.includes('Not resting?')) { bump(K, 'the menu'); return; }
  if (h.includes('Move a session here')) {
    bump(K, 'Move view');
    if (h.includes('Already logged here')) { bump(K, 'Move: Already logged here'); bump(K, 'Move: Already logged here, lines', count(h.split('Already logged here')[1]!.split('Move a session in')[0]!, /<br>/g)); }
    if (h.includes('Nothing left to move')) { bump(K, 'Move: Nothing left to move'); bump(K, 'Move: Log cardio instead'); return; }
    bump(K, 'Move: a session row', count(h, /class="ov-eq( sel)?" onclick="_rdSet\('pick'/g));
    bump(K, 'Move: a row picked', count(h, /class="ov-eq sel"/g));
    if (h.includes('reassess-card')) { bump(K, 'Move: the spacing warning'); bump(K, / and \w+day too/.test(h) ? 'Move: the warning names two days' : 'Move: the warning names one day'); }
    if (h.includes('Move it here')) bump(K, 'Move: Move it here');
    return;
  }
  bump(K, 'Log cardio view');
  bump(K, h.includes('What did you do?') ? 'Log cardio: What did you do?' : 'Log cardio: Your <jog> on <day>');
  const chips = h.split('Modality')[1]!.split('ov-eq-lbl')[0]!;
  bump(K, 'Log cardio: a sport chip', count(chips, /class="rd-chip/g));
  bump(K, 'Log cardio: a chip with a check', count(chips, / ✓<\/div>/g));
  const sel = /class="rd-chip sel"[^>]*>([A-Za-z]+)/.exec(chips);
  bump(K, 'Log cardio: face of ' + (sel ? sel[1] : 'none'));
  bump(K, 'Log cardio: a wheel', count(h, /class="iaw-wrap iaw-solo"/g));
  if (h.includes('placeholder="meters"')) bump(K, 'Log cardio: the meters box');
  if (h.includes('placeholder="yards"')) bump(K, 'Log cardio: the yards box');
  bump(K, 'Log cardio: an effort row', count(h, /class="rd-chip wide/g));
  bump(K, 'Log cardio: an effort row picked', count(h, /class="rd-chip wide sel"/g));
  if (h.includes('>Noted<')) bump(K, 'Log cardio: Noted');
  bump(K, /id="restLogBtn"[^>]*>Logged/.test(h) ? 'Log cardio: Logged ✓' : 'Log cardio: Log it');
  if (h.includes('id="restClearBtn"')) bump(K, h.includes('Tap again to clear') ? 'Log cardio: Tap again to clear' : 'Log cardio: Clear this <jog>');
}
interface Row { call: string; wrote: Set<string>; read: Set<string>; called: Set<string>; lo: number; hi: number; said: Set<string>; n: number; shut: Set<string> }
const rows: Record<string, Row> = {};
const note = (label: string, call: string, t: Tap): void => {
  const a = (rows[label] ||= { call, wrote: new Set(), read: new Set(), called: new Set(), lo: 1e9, hi: -1, said: new Set(), n: 0, shut: new Set() });
  a.wrote.add(t.wrote); a.read.add(t.read); a.called.add(calls(t.n)); a.lo = Math.min(a.lo, t.days); a.hi = Math.max(a.hi, t.days); a.n++; a.shut.add(t.sheet);
  t.toasts.forEach((x) => a.said.add(x.replace(/^Moved\. \w+ is/, 'Moved. <day> is').replace(/^[\d.]+ (min|mi|yd|m) \w+ logged ✓$/, '<the jog> logged ✓')));
};
const FACE: Record<string, [string, string]> = { run: ['25.50', '2.50'], bike: ['40.00', '10.00'], swim: ['20.00', '800'], row: ['15.00', '3000'], walk: ['30.00', ''] };
const setFace = (t: string, mins: string, dist: string): string => `_rdType('${t}');_restDraft.mins=${J(mins)};_restDraft.dist=${J(dist)};renderRestSheet();`;
const move = { rests: 0, picks: 0, warn1: 0, warn2: 0, moved: 0, relaunchKept: 0, snapCands: 0, cands: 0, stage1Cands: 0, stage1Snap: 0 };
const toastsSeen = new Set<string>();

for (const name of NAMES) {
  // The Sunday evening of the first whole week, nothing trained in it: every rest day of the week has come.
  const s0 = snaps[name]!['0 generated']!; const P0 = phoneOf(s0);
  const w: number = Math.max(1, Number(P0.ev('calcCurrentWeek()')) + 1);
  const mon = mondayIso(P0);
  const sunday = at(mon, 7 * (w - 1) + 6, '19:00');
  const base: Snap = { keys: s0.keys, iso: sunday };
  const P = phoneOf(base);
  const rests = DAYS.filter((d) => { const x = P.day(w, d); return x && x.rest; });
  const mv = rests.filter((d) => P.ev(`restDayEligible(${w},'${d}')`));
  const cands: any[] = JSON.parse(P.ev(`JSON.stringify(restMoveCandidates(${w}))`));
  const types: string[] = [...new Set([...(JSON.parse(P.ev('JSON.stringify((activeProg.cfg&&activeProg.cfg.cardioTypes)||[])')) as string[]), 'walk'])];

  // A future rest day, and the three doors.
  { const Pf = phoneOf({ keys: s0.keys, iso: at(mon, 7 * (w - 1), '07:00') }); const later = rests.find((d) => d !== 'mon');
    if (later) note('A rest day that has not come', 'openRestSheet(w, day, view)', tap(Pf, `openRestSheet(${w},'${later}','cardio')`)); }
  const r = mv[0]; if (!r) continue;
  { const Pm = phoneOf(base); note('The page\'s own door: the menu', 'openRestSheet(w, day)', tap(Pm, `openRestSheet(${w},'${r}')`)); kinds(Pm);
    note('The menu: Train a session here', '_rdSet(\'view\',\'move\')', tap(Pm, `_rdSet('view','move')`)); kinds(Pm); }

  // Move: every rest day, every session offered.
  for (const rest of mv) {
    move.rests++;
    for (const c of cands) {
      move.picks++;
      const Pm = phoneOf(base);
      note('Training anyway?', 'openRestSheet(w, day, \'move\')', tap(Pm, `openRestSheet(${w},'${rest}','move')`)); kinds(Pm);
      note('Move: a session picked', '_rdSet(\'pick\', day)', tap(Pm, `_rdSet('pick','${c.day}')`)); kinds(Pm);
      const hits = (JSON.parse(Pm.ev(`JSON.stringify(restMoveCollisions(${w},'${rest}',activeProg.weeks[${w}]['${c.day}']))`)) as any[]).length;
      if (hits === 1) move.warn1++; if (hits === 2) move.warn2++;
      const t = tap(Pm, 'applyRestMove()'); note('Move it here', 'applyRestMove()', t); move.moved++;
      const dst = Pm.day(w, rest as any), src = Pm.day(w, c.day);
      if (!(dst && !dst.rest && dst.movedFrom === c.day && src && src.rest && src.moved)) throw new Error(name + ': the move did not land as read: ' + rest + ' from ' + c.day);
      // The next morning: the launch lays the stored move over the rebuilt grid.
      const g = J(Pm.day(w, rest as any));
      const Pn = phoneOf(snap(Pm), at(mon, 7 * w, '07:00'));
      if (J(Pn.day(w, rest as any)) === g && Pn.day(w, c.day).moved) move.relaunchKept++;
      // The old day, now a rest day whose session moved away: Log cardio alone; the new day is no rest day.
      if (c === cands[0] && rest === mv[0]) {
        note('The old day after a move: Training anyway? asked anyway', 'openRestSheet(w, day, \'move\')', tap(Pm, `openRestSheet(${w},'${c.day}','move')`)); kinds(Pm);
        note('The new day after a move, no jog on it (no door leads here)', 'openRestSheet(w, day, \'cardio\')', tap(Pm, `openRestSheet(${w},'${rest}','cardio')`));
      }
    }
  }
  move.cands += cands.length;

  // Log cardio: each sport's face, then Edit cardio on it.
  for (const t of [...types, ...(types.includes('row') ? [] : ['row'])]) {
    const Pl = phoneOf(base);
    const offered = types.includes(t);
    note('Log cardio', 'openRestSheet(w, day, \'cardio\')', tap(Pl, `openRestSheet(${w},'${r}','cardio')`)); kinds(Pl);
    if (!offered) continue;   // a sport the program does not train has no chip until a record holds it
    note('Log cardio: a sport chip', '_rdType(sport)', tap(Pl, `_rdType('${t}')`)); kinds(Pl);
    note('Log it with an empty face' + (t === 'walk' ? ' (walk)' : ''), 'applyRestCardio()', tap(Pl, 'applyRestCardio()'));
    Pl.ev(setFace(t, FACE[t]![0], FACE[t]![1])); kinds(Pl);
    note('Log cardio: an effort row', '_rdRpe(5)', tap(Pl, '_rdRpe(5)')); kinds(Pl);
    note('Log cardio: the same effort row again (deselects)', '_rdRpe(5)', tap(Pl, '_rdRpe(5)')); kinds(Pl);
    note('Log cardio: RPE 9+', '_rdRpe(9)', tap(Pl, '_rdRpe(9)')); kinds(Pl);
    Pl.ev('_rdRpe(7)');
    note('Log it (' + (t === 'walk' ? 'a walk, time alone' : 'time and distance') + ')', 'applyRestCardio()', tap(Pl, 'applyRestCardio()'));
    const held = snap(Pl);
    { const Pe = phoneOf(held); note('Edit cardio', 'openRestSheet(w, day, \'cardio\')', tap(Pe, `openRestSheet(${w},'${r}','cardio')`)); kinds(Pe);
      note('Edit cardio: Logged ✓ with the face unchanged', 'applyRestCardio()', tap(Pe, 'applyRestCardio()')); }
    { const Pe = phoneOf(held); Pe.ev(`openRestSheet(${w},'${r}','cardio');` + setFace(t, '45.00', t === 'walk' ? '' : FACE[t]![1])); kinds(Pe);
      note('Edit cardio: the face changed, Log it', 'applyRestCardio()', tap(Pe, 'applyRestCardio()')); }
    { const Pe = phoneOf(held); Pe.ev(`openRestSheet(${w},'${r}','cardio');` + setFace(t, '', '')); kinds(Pe);
      note('Edit cardio: the face rolled to zero, Log it', 'applyRestCardio()', tap(Pe, 'applyRestCardio()')); }
    { const Pe = phoneOf(held); Pe.ev(`openRestSheet(${w},'${r}','cardio')`);
      note('Clear, first tap', 'clearRestCardio()', tap(Pe, 'clearRestCardio()')); kinds(Pe);
      note('Clear, second tap (the day holds nothing else)', 'clearRestCardio()', tap(Pe, 'clearRestCardio()')); }
    if (t === types[0]) {
      // A second sport on the same day; then Clear of one leaves the other.
      const Pe = phoneOf(held); Pe.ev(`openRestSheet(${w},'${r}','cardio');` + setFace('walk', '30.00', ''));
      note('Log it: a second sport on the day', 'applyRestCardio()', tap(Pe, 'applyRestCardio()'));
      const two = snap(Pe);
      Pe.ev(`openRestSheet(${w},'${r}','cardio')`); kinds(Pe);
      Pe.ev('clearRestCardio()');
      note('Clear, second tap (another jog stays)', 'clearRestCardio()', tap(Pe, 'clearRestCardio()'));
      // Move a session onto the day that holds the jogs: Already logged here, and a double day.
      const Pd = phoneOf(two);
      note('Training anyway? on a day that holds a jog', 'openRestSheet(w, day, \'move\')', tap(Pd, `openRestSheet(${w},'${r}','move')`)); kinds(Pd);
      if (cands[0]) {
        Pd.ev(`_rdSet('pick','${cands[0].day}');applyRestMove();`); Pd.settle();
        // The double day: its session sheet's Edit cardio, a changed face logged, then cleared.
        // The harness's class list holds nothing: the session sheet is marked open by hand, as the page marks it.
        Pd.ev(`currentWeek=${w};openDayKey('${r}');`); Pd.settle();
        Pd.ev("document.getElementById('detailOverlay').classList={add:function(){},remove:function(){},toggle:function(){},contains:function(c){return c==='open';}};");
        if (!Pd.ev("document.getElementById('detailOverlay').classList.contains('open')")) throw new Error('the session sheet could not be marked open');
        note('A double day: Edit cardio', 'openRestSheet(w, day, \'cardio\')', tap(Pd, `openRestSheet(${w},'${r}','cardio')`)); kinds(Pd);
        Pd.ev(setFace(types[0]!, '50.00', FACE[types[0]!]![1]));
        note('A double day: Log it', 'applyRestCardio()', tap(Pd, 'applyRestCardio()'));
        Pd.ev(`openRestSheet(${w},'${r}','move')`);
        note('A double day: Training anyway? asked anyway', 'openRestSheet(w, day, \'move\')', tap(Pd, `openRestSheet(${w},'${r}','move')`)); kinds(Pd);
        // The session trained on it, then its jog cleared: the day's entry keeps what the session logged.
        Pd.ev(`handleDayStatus('${r}','complete');`); Pd.settle();
        Pd.ev("document.getElementById('detailOverlay').classList.contains=function(){return false;};");
        Pd.ev(`openRestSheet(${w},'${r}','cardio');_rdType('walk');clearRestCardio();`);
        note('Clear, second tap (the day holds a session\'s log)', 'clearRestCardio()', tap(Pd, 'clearRestCardio()'));
      }
      // A sport the program does not train, held by a record: its chip is drawn ahead of walk.
      if (!types.includes('row')) {
        const Pr = phoneOf(base);
        Pr.ev(`(function(){var l=getLogs();l['w${w}_${r}']={restLog:{row:{mins:15,dist:3000}},week:${w},ts:1};saveLogs(l);})()`);
        const Pr2 = phoneOf(snap(Pr)); Pr2.ev(`openRestSheet(${w},'${r}','cardio')`); kinds(Pr2);
        bump(K, 'a record of a sport the program does not train', 1);
      }
    }
  }
  // Every session trained: nothing left to move.
  { const Pa = phoneOf(base); for (const c of cands) { Pa.ev(`currentWeek=${w};openDayKey('${c.day}');`); Pa.settle(); Pa.ev(`handleDayStatus('${c.day}','complete');`); Pa.settle(); }
    note('Training anyway? with every session done', 'openRestSheet(w, day, \'move\')', tap(Pa, `openRestSheet(${w},'${r}','move')`)); kinds(Pa);
    note('Nothing left to move: Log cardio instead', '_rdSet(\'view\',\'cardio\')', tap(Pa, `_rdSet('view','cardio')`)); kinds(Pa); }

  // The carried item: at the end of the first trained week, which sessions Move still offers, and which hold a snapshot.
  { const s1 = snaps[name]!['1 first week']!; const P1 = phoneOf({ keys: s1.keys, iso: at(mon, 7 * (w - 1) + 6, '19:00') });
    const c1: any[] = JSON.parse(P1.ev(`JSON.stringify(restMoveCandidates(${w}))`));
    const hist = JSON.parse(P1.ev('JSON.stringify(getDayHist())'));
    move.stage1Cands += c1.length; move.stage1Snap += c1.filter((c) => hist['w' + w + '_' + c.day]).length; }
}
for (const a of Object.values(rows)) a.said.forEach((x) => toastsSeen.add(x));

say('## B. What the sheet draws');
say();
say('Read off the page\'s builders (`renderRestSheet`, `_renderRestMove`, `_renderRestCardio`), then counted off the markup of every draw the walks of section C made (' + (K['draws'] || 0) + ' draws):');
say();
say('| Kind | Draws that held it, or how many |');
say('|---|---|');
for (const k of Object.keys(K).filter((x) => x !== 'draws').sort()) say('| ' + k + ' | ' + K[k] + ' |');
say();
say('- The Move view: the kicker (`<Day> · Training anyway`), the title, the sentence naming the day, then either Nothing left to move with Log cardio instead, or the label Not logged this week, one row a session (its title, `<Day> · not logged`, a check when picked), the spacing warning under the rows when the pick stacks a region on a neighbour, and Move it here once a row is picked. Already logged here stands above the rows when the day holds a jog, one line a sport.');
say('- The Log cardio view: the kicker (`<Day> · Log cardio`), one of two titles with its sentence, the sport chips (the program\'s sports, a sport a record holds, then Walk; a check on each that holds a record), the time wheel, then by sport the miles wheel (run, bike), a meters box (row), a yards box (swim) or nothing (walk), three effort rows (RPE 5, 7, 9+), Noted at RPE 9, the button (Log it, or Logged ✓ while the face is the record), and Clear this <jog> where the sport picked holds a record (Tap again to clear once armed).');
say('- Toasts the walks drew: ' + [...toastsSeen].sort().map((x) => '"' + x + '"').join('; ') + '. Read from the code and drawn by no walk here: "No active program. Tap Set Active or build a new one." (no program in hand), "Pick a session" (Move it here is not drawn until a row is picked).');
say();

say('## C. What each tap reads and writes');
say();
say('| Tap | The page\'s call | Keys written | Keys asked for | The page called | Days of the grid changed | The sheet | Toast | Taps |');
say('|---|---|---|---|---|---|---|---|---|');
for (const [label, a] of Object.entries(rows)) say('| ' + label + ' | `' + a.call + '` | ' + [...a.wrote].join(' or ') + ' | ' + [...a.read].join(' or ') + ' | ' + [...a.called].join(' or ') + ' | ' + (a.lo === a.hi ? a.lo : a.lo + ' to ' + a.hi) + ' | ' + [...a.shut].join(' or ') + ' | ' + ([...a.said].join(' / ') || 'none') + ' | ' + a.n + ' |');
say();

say('## D. Move, and the carried item');
say();
say('- On the ten first weeks, nothing trained: ' + move.rests + ' rest days offer Move and ' + move.cands + ' sessions are offered across the ten programs; every pair was moved, ' + move.moved + ' moves on ' + move.picks + ' picks. A pick stacked a region on one neighbour ' + move.warn1 + ' times and on both ' + move.warn2 + ' times (the warning; the move is never refused).');
say('- Every move changed two days of the grid in hand (the session lands with `movedFrom`, its old day becomes a rest day with `moved`), wrote `ia_moves_<id>` and the grid into `ia_programs`, and called no rebuild. At the next morning\'s launch the moved day read the same on ' + move.relaunchKept + ' of ' + move.moved + '.');
say('- **The carried item (MIGRATION.md section 7): Move meets it.** `restMoveCandidates` offers a day with no completion and no logged field; a lift log, a set draft and a part skipped alone are none of those, though each snapshots the day. At the end of the first trained week of the standard history Move still offers ' + move.stage1Cands + ' sessions across the ten programs, and ' + move.stage1Snap + ' of them hold a snapshot (the day whose last part was skipped alone). The Expo app\'s sheet, written from the page line for line, offers the same sessions and carries the item as it stands.');
say();

// ── E. The coach's mile nudge ───────────────────────────────────────────────
say('## E. The coach\'s mile nudge (D274)');
say();
say('- **When it is judged:** after every tap of the cardio card\'s Log (`logCardio`, which the Angular screen wraps), whatever the tap stored, on the card in view. Not after Mark the day done, not after the rest sheet\'s Log it (a jog is no run card), and the recorder is phase 4.');
say('- **What it reads:** `ia_programs` (the program\'s config, its length, the record a dismissal left), `ia_hist_<id>`, `ia_logs_<id>`, `ia_comp_<id>`, the week the calendar is in, and the pace chart\'s recovery column.');
say('- **When it rises:** when the card just logged and the easy card before it were both run a chart row (30 s of mile) or more off the plan the same way, the pencil is not locked, and no record names either card against this mile. It waits until This Week is on screen with the session sheet shut, then 700 ms, and rises over it.');
say('- **Update mile time** stores the record on the program (`mileNudge`: the two cards and the mile judged against), then opens the mile pencil with the offer in its two fields; nothing is rebuilt until the pencil\'s own Save. **Keep** stores the same record and closes.');
say();
say('| Program | Taps of Log judged (runs logged with a distance and a time) | Of them an easy card with a pace target | The judge offers | Offers that go slower | Offers that go faster |');
say('|---|---|---|---|---|---|');
const nudge = { runs: 0, easy: 0, offers: 0, slow: 0, fast: 0, answers: 0, wroteProgramsOnly: 0, silentAfter: 0 };
let sample: string[] = [];
for (const name of NAMES) {
  const P = phoneOf(snaps[name]!['3 third week']!); const p = (P.ev('getPrograms()') as any[])[0]; const id: string = p.id;
  const info = (P.ev('runAnchorInfo') as (x: unknown) => any)(p.cfg);
  const read = (): any => ({ logs: JSON.parse(P.ev('JSON.stringify(getLogs())')), hist: JSON.parse(P.ev('JSON.stringify(getDayHist())')), comp: JSON.parse(P.ev('JSON.stringify(getCompleted())')) });
  const judge = (week: number, day: string): any => { const x = read(); const pp = (P.ev('getPrograms()') as any[]).find((q) => q.id === id);
    return info ? judgeNudge({ week, day, ...x, anchor: info.anchorSec, curWeek: (P.ev('_goalCurWeek') as (x: unknown) => number)(pp), totalWeeks: pp.totalWeeks || 6, record: pp.mileNudge ?? null, implied: (pace) => (P.ev('paceChartLookup') as any)('recovery', pace).mile }) : null; };
  const { logs, hist } = read();
  let runs = 0, easy = 0, offers = 0, slow = 0, fast = 0;
  for (const k of Object.keys(logs)) {
    const m = /^w(\d+)_(\w+)$/.exec(k); if (!m || !(parseFloat(logs[k].run_dist) > 0) || !(parseFloat(logs[k].run_mins) > 0)) continue;
    runs++;
    const h = hist[k]; const list = h && h.cardio ? (Array.isArray(h.cardio) ? h.cardio : [h.cardio]) : []; if (list.some((c: any) => c && c.type === 'run' && c.dose && c.dose.tgt > 0)) easy++;
    const o = judge(+m[1]!, m[2]!);
    if (!o) continue;
    offers++; if (o.dir > 0) slow++; else fast++;
    if (!sample.length) { const t = nudgeText(o); sample = [t.label, t.title, t.body, t.update, t.keep, J(offerFields(o.offer))]; }
    // The answer, as the Angular screen writes it: the record on the program, saved.
    const pre = P.dump();
    P.ev(`(function(){var ps=getPrograms();var q=ps.find(function(x){return x.id===${J(id)};});q.mileNudge=${J({ cards: [o.cards[0].key, o.cards[1].key], anchor: o.anchor })};savePrograms(ps);})()`);
    nudge.answers++; if (diff(pre, P.dump(), id) === '`ia_programs` changed') nudge.wroteProgramsOnly++;
    if (!judge(+m[1]!, m[2]!)) nudge.silentAfter++;
  }
  nudge.runs += runs; nudge.easy += easy; nudge.offers += offers; nudge.slow += slow; nudge.fast += fast;
  say('| ' + name + ' | ' + runs + ' | ' + easy + ' | ' + offers + ' | ' + slow + ' | ' + fast + ' |');
}
say();
say('- Across the ten: ' + nudge.runs + ' runs logged, ' + nudge.easy + ' on a card with a pace target, ' + nudge.offers + ' offers (' + nudge.slow + ' slower, ' + nudge.fast + ' faster). Of ' + nudge.answers + ' answers, ' + nudge.wroteProgramsOnly + ' wrote `ia_programs` alone, and the judge stayed shut on the same card after ' + nudge.silentAfter + '.');
if (sample.length) say('- The one offer\'s words: label "' + sample[0] + '", title "' + sample[1] + '", body "' + sample[2] + '", buttons "' + sample[3] + '" and "' + sample[4] + '"; the pencil\'s fields ' + sample[5] + '.');
say('- The standard history draws ' + nudge.offers + ' offer, ' + nudge.slow + ' slower and ' + nudge.fast + ' faster, with no record in the way and no locked pencil: a walk of its own makes each kind it does not before a break list is written.');
say();

// ── F. Mario's backup, counts only ──────────────────────────────────────────
say('## F. On the simulator\'s copy of Mario\'s backup (counts only)');
say();
say('Read by a scratch script from a copy of the simulator\'s store (2026-11-19, the store\'s hash 278ba57f3f6a382b before and after, the hash the last session read; nothing was written to it), every tap on a phone of its own in the VM harness. Typed here by hand: no name, note, date or load.');
say();
say('- The store holds 36 `ia_` keys and 3 programs. The active program is inside its 14 weeks. No rest day move is stored.');
say('- From its first week to the one in view: 26 rest days; the sheet opens on 25 and offers Move on all 25; 1 has not come around. 1 day holds a jog, of 1 sport, and it is a rest day: no double day.');
say('- The week in view: 2 rest days, the sheet opens on 1 and offers Move there, with 3 sessions to move; none of the 3 picks draws the spacing warning. **1 of the 3 holds a snapshot: the carried item is live on his data this week.** Across all weeks to the one in view Move would offer 12 sessions, 1 of them holding a snapshot.');
say('- The Log cardio view draws 2 chips (his 1 sport, then Walk).');
say('- Move it here wrote `ia_moves_<id>` (new) and `ia_programs`, one toast. Log it (a walk, and his sport with a time, a distance and an effort) changed `ia_logs_<id>` alone, one toast each. Log it with an empty face wrote nothing, one toast.');
say('- On the day that holds his jog: Edit cardio with the face unchanged wrote nothing and said nothing; Clear in two taps changed `ia_logs_<id>` alone, one toast.');
say('- The nudge: 11 runs logged with a distance and a time, all 11 on an easy card with a pace target. Judged today it offers after 0 (the pencil is locked). Had each tap been judged in the week it was logged, 8 of the 11 would have offered. No record is stored on the program.');
say();

writeFileSync(join(REPO, 'tests/measure/native-rest-sheet_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
