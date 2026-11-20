// native-injury-travel: today's Hurt? and Traveling? (the change sheet, the chip, I'm back, the check in), This Week's
// start date and race date, and the Programs tab's copy button, before the Expo app draws them (MIGRATION.md phase 3,
// row 5, the third of three sessions). Read-only (measure). It runs today's page in the VM harness on the test phone
// of tests/support/stored-state.ts. The sheet is read through the Angular screen's own model
// (frontends/app/src/app/screens/change-sheet) handed the page's readers, as its screen hands them, and beside it the
// page's own markup; the chip and the check in are the page's markup alone (overlays.ts renderOverlayChip: there is no
// Angular model). Stored keys, the keys asked for, the grid in hand and the page's own calls are read before and after
// each tap.
//
// A. Where they open, and what stands on This Week at each stretch of the standard history.
// B. What the sheet, the chip, the check in and their pop-ups draw: each kind, counted.
// C. What each tap reads and writes, key family by key family.
// D. The check in: when it is drawn, what its answers write.
// E. This Week's start date and race date.
// F. The date box and the clipboard: where today's app uses them.
//
// Usage: cd tests && node measure/native-injury-travel_today.ts   (writes tests/measure/native-injury-travel_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, life } from '../support/stored-state.ts';
import { pops } from '../support/native-pop-ups.ts';
import { changeSheetView } from '../../frontends/app/src/app/screens/change-sheet/change-sheet-model.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
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
const snap = (P: Phone): Snap => ({ keys: P.dump(), iso: nowIso(P) });
function phoneOf(s: Snap, iso = s.iso): Phone {
  const P = new Phone();
  for (const [k, v] of Object.entries(s.keys)) P.damage(k, v);
  P.launch(iso);
  P.settle();
  return P;
}
const WATCHED = ['refreshProgram', 'buildProgram', 'savePrograms', 'renderWeekView', 'renderOverlaySheet', 'closeOverlaySheet'];
function watch(P: Phone): void {
  P.IA.ctx['__n'] = {}; P.IA.ctx['__r'] = {};
  if (P.IA.ctx['__watched']) return;
  P.IA.ctx['__watched'] = true;
  for (const f of WATCHED) P.ev(`${f}=(function(o){return function(){__n.${f}=(__n.${f}||0)+1;return o.apply(this,arguments);};})(${f});`);
  P.ev('iaStore.get=(function(o){return function(k){__r[k]=1;return o.apply(this,arguments);};})(iaStore.get);');
}
const gridOf = (P: Phone): Record<string, string> => JSON.parse(P.ev("(function(){var o={};if(!activeProg||!activeProg.weeks)return '{}';Object.keys(activeProg.weeks).forEach(function(w){Object.keys(activeProg.weeks[w]).forEach(function(d){o['w'+w+'_'+d]=JSON.stringify(activeProg.weeks[w][d]);});});return JSON.stringify(o);})()"));
interface Tap { wrote: string; read: string; calls: string; toasts: string; pops: string; days: number; overlays: string }
const overlaysOf = (P: Phone): string => String(P.ev("(function(){var o=(activeProg&&activeProg.overlays)||[];return o.length+' ('+o.map(function(x){var i=x.patch&&x.patch.injury;return x.type+(i?(i.bridge?' bridge':i.halfstep?' halfstep':' '+i.tier):'')+(x.lastAsk?' asked':'');}).join(', ')+')';})()"));
function tap(P: Phone, code: string): Tap {
  P.settle();
  const id: string = P.ev('activeProgId');
  const list = pops(P);
  watch(P);
  const pre = P.dump(), t0 = P.toasts.length, g0 = gridOf(P), p0 = list.length;
  P.ev(code); P.settle();
  const g1 = gridOf(P);
  let days = 0;
  for (const k of new Set([...Object.keys(g0), ...Object.keys(g1)])) if (g0[k] !== g1[k]) days++;
  const read = Object.keys(JSON.parse(P.ev('JSON.stringify(__r)'))).map((k) => '`' + fam(k, id) + '`').sort().join(', ') || 'nothing';
  const n: Record<string, number> = JSON.parse(P.ev('JSON.stringify(__n)'));
  const calls = WATCHED.filter((f) => n[f]).map((f) => f + ' ' + n[f]).join(', ') || 'none';
  const toasts = P.toasts.slice(t0).map((t) => '"' + t.replace(/[A-Z][a-z]{2} [A-Z][a-z]{2} \d+/g, '<day>') + '"').join(' ') || 'none';
  const raised = list.slice(p0).map((r) => '"' + (r.view as any).kicker + ': ' + (r.view as any).msg + '"').join(' ') || 'none';
  return { wrote: diff(pre, P.dump(), id), read, calls, toasts, pops: raised, days: days ? 1 : 0, overlays: overlaysOf(P) };
}
/** One row of section C: a tap on the ten programs, each distinct outcome with how many programs gave it. */
const ROWS: string[] = [];
function row(what: string, taps: Tap[]): void {
  const col = (f: (t: Tap) => string): string => {
    const m: Record<string, number> = {};
    for (const t of taps) bump(m, f(t));
    const ks = Object.keys(m);
    return ks.length === 1 ? ks[0]! : ks.map((k) => k + ' (' + m[k] + ')').join('; ');
  };
  const moved = taps.filter((t) => t.days).length;
  ROWS.push('| ' + what + ' | ' + taps.length + ' | ' + col((t) => t.wrote) + ' | ' + col((t) => t.read) + ' | ' + col((t) => t.calls) + ' | ' + moved + ' | ' + col((t) => t.toasts) + ' | ' + col((t) => t.pops) + ' |');
}

// ── The page's markup, kept ──────────────────────────────────────────────────
/** The chip wrap as the page fills it: each child's class and markup. */
function chips(P: Phone): { cls: string; html: string }[] {
  return JSON.parse(P.ev("(function(){var w=document.getElementById('changeActiveWrap');w.children.length=0;w.childNodes.length=0;renderOverlayChip();return JSON.stringify(w.children.map(function(c){return {cls:c.className,html:c.innerHTML};}));})()"));
}
const sheetHtml = (P: Phone): string => String(P.ev("document.getElementById('changeBody').innerHTML") || '');
/** The Angular screen's view of the draft, the page's readers handed to its model as change-sheet.ts hands them. */
function sheetView(P: Phone): any {
  const prog = P.ev('activeProg'), tw = (prog && prog.totalWeeks) || 0;
  const f = (n: string): any => P.ev(n);
  return changeSheetView(JSON.parse(P.ev('JSON.stringify(_ovDraft)')), JSON.parse(P.ev('JSON.stringify(INJURY_REGIONS)')), {
    fmtDate: (iso) => f('_fmtDate')(iso), fmtDateWd: (iso) => f('_fmtDateWd')(iso), dayCount: (a, b) => f('_dayCount')(a, b), dayCountWord: (n) => f('_dayCountWord')(n),
    inProgram: (ov) => !!f('overlayWeekRange')(prog, ov, tw), backCopy: (ov) => f('overlayBackCopy')(prog, ov),
  });
}
const text = (h: string): string => h.replace(/<[^>]+>/g, '\u0001').split('\u0001').map((x) => x.trim()).filter(Boolean).join(' | ');
/** Every string of a view, in order, as the Angular template prints them. */
function viewText(v: any): string {
  const o: string[] = [v.kicker, v.title, v.intro];
  const dates = (d: any[] | null): void => { if (d) for (const x of d) o.push(x.label, x.shown); };
  const cards = (c: any[]): void => { for (const x of c) { o.push(x.name); if (x.desc) o.push(x.desc); if (x.sel) o.push('✓'); } };
  const effect = (e: any): void => { if (!e) return; if (e.title !== null) o.push(e.title); for (const s of e.subs) if (s.text) o.push(s.text); };
  const foot = (a: string | null): void => { if (a) o.push(a === 'close' ? 'Got it' : 'Apply change'); };
  if (v.travel) { dates(v.travel.dates); o.push('What you’ll have'); cards(v.travel.cards); effect(v.travel.effect); foot(v.travel.action); }
  if (v.injury) { o.push('Where’s the problem'); cards(v.injury.regions); if (v.injury.tiers) { o.push('How bad is it'); cards(v.injury.tiers); } effect(v.injury.effect); dates(v.injury.dates); foot(v.injury.action); }
  return o.join(' | ');
}

const K: Record<string, number> = {};   // the sheet's kinds
const CK: Record<string, number> = {};  // the chip's kinds
const PK: Record<string, number> = {};  // the pop-ups' kinds
let sheetDraws = 0, sheetSame = 0;
/** Counts what one draw of the sheet holds, off the model's view, and holds the view's words against the page's markup. */
function kinds(P: Phone): void {
  const v = sheetView(P), h = sheetHtml(P);
  sheetDraws++;
  if (viewText(v) === text(h)) sheetSame++;
  if (v.travel) {
    const t = v.travel;
    bump(K, 'Traveling? drawn');
    if (t.dates) { bump(K, 'Traveling?: a date box', t.dates.length); if (t.dates.some((d: any) => d.shown === 'Set date')) bump(K, 'Traveling?: a date box that reads Set date'); }
    else bump(K, 'Traveling?: no date boxes (Full gym)');
    bump(K, 'Traveling?: a gear card', t.cards.length);
    const e = t.effect;
    if (e.title === 'You’re set') bump(K, 'Traveling?: effect, You’re set');
    else if (e.title === null) bump(K, 'Traveling?: effect, the range falls outside the program');
    else {
      bump(K, /onward\.$/.test(e.title) ? 'Traveling?: effect, onward (no Through)' : /One day\.$/.test(e.title) ? 'Traveling?: effect, one day' : 'Traveling?: effect, N days');
      if (/end of your program/.test(e.subs[0].text)) bump(K, 'Traveling?: back line, runs to the end of the program');
      else if (/picks your program back up/.test(e.subs[0].text)) bump(K, 'Traveling?: back line, a day picks the program back up');
      bump(K, /Reps are yours/.test(e.subs[1].text) ? 'Traveling?: holds line, Room only' : 'Traveling?: holds line, gear');
    }
    bump(K, t.action === 'close' ? 'Traveling?: Got it' : 'Traveling?: Apply change');
  }
  if (v.injury) {
    const i = v.injury;
    bump(K, 'Hurt? drawn');
    bump(K, 'Hurt?: a region card', i.regions.length);
    if (i.regions.some((c: any) => c.sel)) bump(K, 'Hurt?: a region picked');
    if (i.tiers) bump(K, 'Hurt?: a tier card', i.tiers.length);
    if (i.effect) bump(K, i.effect.title === 'That one’s above my pay grade' ? 'Hurt?: effect, above my pay grade' : /^Protected/.test(i.effect.title) ? 'Hurt?: effect, Protected' : 'Hurt?: effect, Working around it');
    if (i.dates) bump(K, 'Hurt?: the From date box');
    if (i.action) bump(K, i.action === 'close' ? 'Hurt?: Got it' : 'Hurt?: Apply change');
    else bump(K, 'Hurt?: no button (no region picked)');
  }
}
const SPANS: [RegExp, string][] = [
  [/^Week \d+$/, 'Week N'], [/^Weeks \d+–\d+$/, 'Weeks N–M'], [/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d+$/, 'one day (Tue Sep 1)'],
  [/^[A-Z][a-z]{2} \d+–\d+$/, 'days in one month (Sep 1–4)'], [/^[A-Z][a-z]{2} \d+–[A-Z][a-z]{2} \d+$/, 'days across months (Sep 29–Oct 2)'], [/^From [A-Z][a-z]{2} \d+$/, 'From a day'],
];
/** Counts what the chip wrap holds, off the page's markup. */
function chipKinds(list: { cls: string; html: string }[]): void {
  bump(CK, 'draws of the wrap');
  if (!list.length) bump(CK, 'draws with no chip');
  for (const c of list) {
    if (/reassess-card/.test(c.cls)) { bump(CK, 'check in card'); bump(CK, 'check in: an answer button', (c.html.match(/data-ans=/g) || []).length); continue; }
    const ttl = (/change-chip-ttl">([^<]*)</.exec(c.html) || [])[1] || '', sub = (/change-chip-sub">([^<]*)</.exec(c.html) || [])[1] || '';
    const [kind, span] = ttl.split(' · ');
    bump(CK, 'chip: ' + kind);
    bump(CK, 'chip span: ' + ((SPANS.find(([re]) => re.test(span || '')) || [])[1] || 'OTHER ' + span));
    bump(CK, 'chip tail: ' + (/Tap I’m back when it’s ready\.$/.test(sub) ? 'Tap I’m back when it’s ready.' : /Back to normal /.test(sub) ? 'Back to normal <day>.' : /Open-ended\.$/.test(sub) ? 'Open-ended.' : /full send\.$/.test(sub) ? 'One light week, then full send.' : 'OTHER ' + sub));
    if (/\(protected\)/.test(sub)) bump(CK, 'chip label: <region> (protected)');
    else if (/\(working around it\)/.test(sub)) bump(CK, 'chip label: <region> (working around it)');
    else if (/^Return week/.test(sub)) bump(CK, 'chip label: Return week · <region>');
    else bump(CK, 'chip label: gear, ' + sub.split('.')[0]);
    if (/change-chip-act/.test(c.html)) bump(CK, 'chip: I’m back button');
    if (/change-chip-x/.test(c.html)) bump(CK, 'chip: the ✕');
  }
}
function popKinds(P: Phone, from: number): void {
  for (const r of pops(P).slice(from)) {
    const v = r.view as any;
    bump(PK, v.kicker + ': ' + v.msg);
    if (/pace targets resume/.test(v.sub || '')) bump(PK, 'Back in: the pace clock line');
    if (/Race day does not move/.test(v.sub || '')) bump(PK, 'Back in: race day does not move');
    if (/more weeks? than this block has/.test(v.sub || '')) bump(PK, 'Back in: needs N more weeks');
    if (v.actions && v.actions.length) bump(PK, v.kicker + ': ' + v.msg + ' with ' + v.actions.length + ' answers');
  }
}

say('# Today\'s Hurt? and Traveling?, the chip and the check in, and This Week\'s two dates (measure, before the Expo app draws them)');
say();
say('Made by `tests/measure/native-injury-travel_today.ts` on today\'s page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each through the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed.');
say();

// ── The ten programs through the standard history, a snapshot at each stretch ──
const STAGES = ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away'];
const snaps: Record<string, Record<string, Snap>> = {};
for (let i = 0; i < CFGS.length; i++) {
  const s: Record<string, Snap> = {};
  life(CFGS[i], CREATED, undefined, (stage, P) => { s[stage] = snap(P); });
  snaps[NAMES[i]!] = s;
}
const REGIONS: string[] = JSON.parse(phoneOf(snaps[NAMES[0]!]!['1 first week']!).ev('JSON.stringify(Object.keys(INJURY_REGIONS))'));

// ── A. Where they open ──────────────────────────────────────────────────────
say('## A. Where they open, and what stands on This Week');
say();
say('Today\'s app (the Angular screens) has one door each, both on This Week (`week-view.ts`):');
say();
say('- **Hurt?**, the pill at the head\'s right (`openInjurySheet`). With a live injury it reads the region\'s name in red, and opens the same sheet on that region and tier.');
say('- **Traveling?**, the button at the foot beside Random Workout (`openOverlaySheet`).');
say('- Both refuse with no active program ("No active program. Tap Set Active or build a new one."); This Week is not reached without one, so no tap gets there.');
say('- The chip wrap sits under those two buttons. The page fills it (`renderOverlayChip`, called by the Angular screen at each draw): one chip per live overlay, and under an open injury\'s chip the check in card once two weeks have passed.');
say('- The sheet itself is an Angular screen with a model (`change-sheet-model.ts`); its draft and every write are the page\'s (`_ovDraft`, `_ovSet`, `applyInjuryDraft`, `applyOverlayDraft`).');
say();
say('What stands on This Week at each stretch of the standard history (ten programs):');
say();
say('| Stretch | Pill reads Hurt? | Pill reads a region | Chips | Travel | Injury | Return week | Chips with I’m back | Check in cards | Overlays stored | Stored and not drawn (ended, or outside the program) |');
say('|---|---|---|---|---|---|---|---|---|---|---|');
for (const stage of STAGES) {
  const T: Record<string, number> = {};
  for (const name of NAMES) {
    const P = phoneOf(snaps[name]![stage]!);
    const live = P.ev('(function(){var o=_liveInjuryOverlay();return o?o.patch.injury.region:null;})()');
    bump(T, live ? 'region' : 'hurt');
    const list = chips(P);
    chipKinds(list);
    for (const c of list) {
      if (/reassess-card/.test(c.cls)) { bump(T, 'ask'); continue; }
      bump(T, 'chips');
      const ttl = (/change-chip-ttl">([^<]*)</.exec(c.html) || [])[1] || '';
      bump(T, ttl.split(' · ')[0]!);
      if (/change-chip-act/.test(c.html)) bump(T, 'back');
    }
    const n = Number(P.ev('((activeProg&&activeProg.overlays)||[]).length'));
    bump(T, 'stored', n);
    bump(T, 'hidden', n - list.filter((c) => !/reassess-card/.test(c.cls)).length);
  }
  const g = (k: string): number => T[k] || 0;
  say('| ' + stage + ' | ' + g('hurt') + ' | ' + g('region') + ' | ' + g('chips') + ' | ' + g('Travel') + ' | ' + g('Injury') + ' | ' + g('Return week') + ' | ' + g('back') + ' | ' + g('ask') + ' | ' + g('stored') + ' | ' + g('hidden') + ' |');
}
say();

// ── B and C. The walks ──────────────────────────────────────────────────────
const S1 = (name: string): Snap => snaps[name]!['1 first week']!;
const today = (P: Phone): string => String(P.ev('_isoToday()'));
const lastDay = (P: Phone): string => String(P.ev(`(function(){var m=getWeekMonday(activeProg.startDate);m.setDate(m.getDate()+7*activeProg.totalWeeks-1);var p=${pad};return m.getFullYear()+'-'+p(m.getMonth()+1)+'-'+p(m.getDate());})()`));
const d10 = (iso: string, days: number): string => plus(iso + 'T12:00:00', days).slice(0, 10);

// The injury sheet: opened, every region at both tiers, the off-ramp, the From box.
{
  const open: Tap[] = [], pick: Tap[] = [], tier: Tap[] = [], from: Tap[] = [], other: Tap[] = [], apply: Tap[] = [], outside: Tap[] = [], again: Tap[] = [], open2: Tap[] = [], x: Tap[] = [], back: Tap[] = [], backHalf: Tap[] = [];
  for (const name of NAMES) {
    const P = phoneOf(S1(name));
    open.push(tap(P, 'openInjurySheet()')); kinds(P);
    for (const r of REGIONS) {
      const t = tap(P, `_ovSet('injRegion',${J(r)})`); kinds(P); if (r === REGIONS[0]) pick.push(t);
      const u = tap(P, "_ovSet('injTier','protect')"); kinds(P); if (r === REGIONS[0]) tier.push(u);
      P.ev("_ovSet('injTier','workaround')");
    }
    other.push(tap(P, "_ovSet('injRegion','other')")); kinds(P);
    P.ev(`_ovSet('injRegion',${J(REGIONS[0])})`);
    from.push(tap(P, `_ovSet('from',${J(d10(today(P), 3))})`)); kinds(P);
    outside.push(tap(P, `_ovSet('from',${J(d10(lastDay(P), 30))});applyInjuryDraft()`));
    P.ev(`_ovSet('from',${J(today(P))})`);
    apply.push(tap(P, 'applyInjuryDraft()')); chipKinds(chips(P));
    open2.push(tap(P, 'openInjurySheet()')); kinds(P);
    again.push(tap(P, "_ovSet('injTier','protect');applyInjuryDraft()")); chipKinds(chips(P));
  }
  // Every region at both tiers, each on a phone of its own: applied, the chip, the ✕; applied, I'm back, the chips.
  for (const name of NAMES) for (const r of REGIONS) for (const t of ['workaround', 'protect']) {
    const P = phoneOf(S1(name));
    P.ev(`openInjurySheet();_ovSet('injRegion',${J(r)});_ovSet('injTier',${J(t)});applyInjuryDraft()`); P.settle();
    chipKinds(chips(P));
    const id: string = P.ev('activeProg.overlays[activeProg.overlays.length-1].id');
    const Q = phoneOf(snap(P));
    const tx = tap(Q, `removeOverlay(${J(id)})`); if (r === REGIONS[0] && t === 'workaround') x.push(tx); chipKinds(chips(Q));
    const p0 = pops(P).length;
    const tb = tap(P, `imBackFromInjury(${J(id)})`); popKinds(P, p0); chipKinds(chips(P));
    (/halfstep/.test(tb.overlays) ? backHalf : back).push(tb);
  }
  row('Hurt? tapped (no live injury)', open);
  row('A region card', pick);
  row('A tier card', tier);
  row('Neck / something else', other);
  row('The From date box, three days on', from);
  row('Apply change (knee, work around it, from today)', apply);
  row('Apply change with From past the program\'s end', outside);
  row('Hurt? tapped again (the injury live)', open2);
  row('Apply change again, now Protect it', again);
  row('The chip\'s ✕', x);
  row('I’m back: a region whose runs never stopped (' + back.length + ' of ' + (back.length + backHalf.length) + ' region, tier and program walks)', back);
  row('I’m back: a region whose runs were held (' + backHalf.length + ')', backHalf);
  say('<!-- overlays after Apply again: ' + [...new Set(again.map((t) => t.overlays))].join(' ; ') + ' -->');
}

// The travel sheet.
{
  const open: Tap[] = [], gear: Tap[] = [], full: Tap[] = [], got: Tap[] = [], from: Tap[] = [], thru: Tap[] = [], apply: Tap[] = [], one: Tap[] = [], blank: Tap[] = [], before: Tap[] = [], outside: Tap[] = [], x: Tap[] = [], reopen: Tap[] = [];
  for (const name of NAMES) {
    const P = phoneOf(S1(name));
    open.push(tap(P, 'openOverlaySheet()')); kinds(P);
    gear.push(tap(P, "_ovSet('equipment','bodyweight')")); kinds(P);
    full.push(tap(P, "_ovSet('equipment','commercial')")); kinds(P);
    got.push(tap(P, 'closeOverlaySheet()'));
    P.ev("_ovSet('equipment','home_basic')");
    const t0 = today(P);
    from.push(tap(P, `_ovSet('from',${J(d10(t0, 20))})`)); kinds(P);          // past Through: Through moves to From + 13
    P.ev(`_ovSet('from',${J(t0)})`);
    thru.push(tap(P, `_ovSet('to',${J(d10(t0, 3))})`)); kinds(P);
    P.ev(`_ovSet('to',${J(t0)})`); kinds(P);                                     // one day
    P.ev(`_ovSet('to',${J(d10(t0, 40))})`); kinds(P);                            // across a month
    P.ev(`_ovSet('to',${J(lastDay(P))})`); kinds(P);                             // to the program's last day
    P.ev(`_ovSet('from',${J(d10(lastDay(P), 30))});_ovSet('to',${J(d10(lastDay(P), 40))})`); kinds(P);
    outside.push(tap(P, 'applyOverlayDraft()'));
    P.ev(`_ovSet('from',${J(t0)});_ovSet('to','')`); kinds(P);                   // the box cleared
    blank.push(tap(P, 'applyOverlayDraft()'));
    P.ev(`_ovDraft.to=${J(d10(t0, -2))};renderOverlaySheet()`); kinds(P);
    before.push(tap(P, 'applyOverlayDraft()'));
    // The whole weeks grammar: Monday to Sunday.
    const mon = String(P.ev(`(function(){var m=getWeekMonday(_isoToday());m.setDate(m.getDate()+7);var p=${pad};return m.getFullYear()+'-'+p(m.getMonth()+1)+'-'+p(m.getDate());})()`));
    for (const [a, b, eq] of [[mon, d10(mon, 6), 'home_basic'], [mon, d10(mon, 13), 'bodyweight'], [t0, t0, 'home_basic'], [t0, d10(t0, 3), 'home_basic'], [t0, d10(t0, 40), 'bodyweight']] as const) {
      const Q = phoneOf(snap(P));
      Q.ev(`openOverlaySheet();_ovSet('equipment',${J(eq)});_ovSet('from',${J(a)});_ovSet('to',${J(b)})`); kinds(Q);
      const t = tap(Q, 'applyOverlayDraft()'); chipKinds(chips(Q));
      if (a === t0 && b === t0) one.push(t);
      if (a === t0 && b === d10(t0, 3)) {
        apply.push(t);
        const id: string = Q.ev('activeProg.overlays[activeProg.overlays.length-1].id');
        reopen.push(tap(Q, 'openOverlaySheet()')); kinds(Q);
        x.push(tap(Q, `removeOverlay(${J(id)})`)); chipKinds(chips(Q));
      }
    }
  }
  row('Traveling? tapped', open);
  row('A gear card (Room only)', gear);
  row('Full gym', full);
  row('Got it, or ← Back', got);
  row('The From box moved past Through', from);
  row('The Through box', thru);
  row('Apply change (Mini gym, today and three days on)', apply);
  row('Apply change, one day', one);
  row('Apply change with the range past the program\'s end', outside);
  row('Apply change with Through cleared', blank);
  row('Apply change with Through before From', before);
  row('Traveling? tapped again after a trip is booked', reopen);
  row('The trip chip\'s ✕', x);
}

// ── D. The check in ─────────────────────────────────────────────────────────
const D: string[] = [];
{
  const better: Tap[] = [], more: Tap[] = [], same: Tap[] = [], worse: Tap[] = [], backFromAsk: Tap[] = [];
  const T: Record<string, number> = {};
  for (const name of NAMES) {
    const P = phoneOf(S1(name));
    P.ev("openInjurySheet();_ovSet('injRegion','knee');applyInjuryDraft()"); P.settle();
    const s = snap(P);
    const id: string = P.ev('activeProg.overlays[activeProg.overlays.length-1].id');
    const tw = Number(P.ev('activeProg.totalWeeks')), cur = Number(P.ev('calcCurrentWeek()'));
    for (const [days, label] of [[13, 'thirteen days on'], [14, 'fourteen days on'], [15, 'fifteen days on']] as const) {
      const Q = phoneOf(s, plus(s.iso, days));
      const list = chips(Q); chipKinds(list);
      const inside = Number(Q.ev('calcCurrentWeek()')) <= tw;
      bump(T, label + (list.some((c) => /reassess-card/.test(c.cls)) ? ': the card stands' : ': no card') + (inside ? '' : ' (past the program\'s end)'));
    }
    void cur;
    const at14 = (): Phone => phoneOf(s, plus(s.iso, 15));
    let Q = at14(); let p0 = pops(Q).length;
    better.push(tap(Q, `injReassess(${J(id)},'better')`)); popKinds(Q, p0);
    bump(T, 'after Better: ' + (chips(Q).some((c) => /reassess-card/.test(c.cls)) ? 'the card still stands' : 'the card is gone'));
    const Q2 = phoneOf(snap(Q), nowIso(Q)); p0 = pops(Q2).length;
    backFromAsk.push(tap(Q2, `imBackFromInjury(${J(id)})`)); popKinds(Q2, p0);
    more.push(tap(Q, `injSnooze(${J(id)})`));
    bump(T, 'after More time: ' + (chips(Q).some((c) => /reassess-card/.test(c.cls)) ? 'the card still stands' : 'the card is gone'));
    const again = phoneOf(snap(Q), plus(nowIso(Q), 14));
    bump(T, 'fourteen days after More time: ' + (chips(again).some((c) => /reassess-card/.test(c.cls)) ? 'the card stands again' : 'no card'));
    Q = at14(); same.push(tap(Q, `injReassess(${J(id)},'same')`));
    Q = at14(); p0 = pops(Q).length; worse.push(tap(Q, `injReassess(${J(id)},'worse')`)); popKinds(Q, p0);
    bump(T, 'after Worse: ' + (chips(Q).some((c) => /reassess-card/.test(c.cls)) ? 'the card still stands' : 'the card is gone'));
  }
  row('Check in: Better', better);
  row('Check in, Better: I’m back', backFromAsk);
  row('Check in, Better: More time', more);
  row('Check in: Same', same);
  row('Check in: Worse', worse);
  for (const k of Object.keys(T).sort()) D.push('| ' + k + ' | ' + T[k] + ' |');
}

// ── E. Start date and race date ─────────────────────────────────────────────
const E: string[] = [];
{
  const T: Record<string, number> = {};
  const startSame: Tap[] = [], startMon: Tap[] = [], startMid: Tap[] = [], startSun: Tap[] = [], startBlank: Tap[] = [], raceLater: Tap[] = [], raceSoon: Tap[] = [], raceBlank: Tap[] = [], raceSame: Tap[] = [];
  for (const stage of ['0 generated', '3 third week']) for (const name of NAMES) {
    const P0 = phoneOf(snaps[name]![stage]!);
    const race = !!P0.ev('progAlignment(activeProg)');
    bump(T, stage + ': the row is ' + (race ? 'the race date' : 'Program Start'));
    if (stage !== '3 third week') continue;
    const start = String(P0.ev('activeProg.startDate')), s = snap(P0);
    const mon = String(P0.ev(`(function(){var m=getWeekMonday(_isoToday());var p=${pad};return m.getFullYear()+'-'+p(m.getMonth()+1)+'-'+p(m.getDate());})()`));
    if (race) {
      const iso = String(P0.ev('activeProg.cfg.raceDate'));
      let P = phoneOf(s); raceSame.push(tap(P, `setProgRace(${J(iso)})`));
      P = phoneOf(s); raceLater.push(tap(P, `setProgRace(${J(d10(iso, 14))})`));
      P = phoneOf(s); raceSoon.push(tap(P, `setProgRace(${J(d10(today(P), 2))})`));
      P = phoneOf(s); raceBlank.push(tap(P, "setProgRace('')"));
    } else {
      let P = phoneOf(s); startSame.push(tap(P, `setProgStart(${J(start)})`));
      P = phoneOf(s); startMon.push(tap(P, `setProgStart(${J(mon)})`));
      P = phoneOf(s); startMid.push(tap(P, `setProgStart(${J(d10(mon, 2))})`));
      P = phoneOf(s); startSun.push(tap(P, `setProgStart(${J(d10(mon, 6))})`));
      P = phoneOf(s); startBlank.push(tap(P, "setProgStart('')"));
    }
  }
  // A dated test goal (none of the ten is one): the start date re-pins the test week, and a short week can hold the test.
  const tA: Tap[] = [], tB: Tap[] = [], tC: Tap[] = [];
  {
    const dated = { ...(PROGRAMS['1.5 mile test goal, commercial, balanced'] as any), primaryPath: 'event', eventTargeted: true, raceDate: '2026-10-25' };
    const P0 = new Phone().launch(CREATED); P0.generate(dated); P0.settle();
    const s = snap(P0);
    bump(T, 'a dated test goal (an eleventh program, made for this row): the row is ' + (P0.ev('progAlignment(activeProg)') ? 'the race date' : 'Program Start'));
    let P = phoneOf(s); tA.push(tap(P, `setProgStart(${J(String(P.ev('activeProg.startDate')))})`));
    P = phoneOf(s); tB.push(tap(P, "setProgStart('2026-09-14')"));
    P = phoneOf(s); tC.push(tap(P, "setProgStart('2026-10-25')"));
  }
  row('Start date: the same day again', startSame);
  row('Start date: this week\'s Monday', startMon);
  row('Start date: this week\'s Wednesday', startMid);
  row('Start date: this week\'s Sunday', startSun);
  row('Start date: the box cleared', startBlank);
  row('Start date, a dated test goal: the same day again', tA);
  row('Start date, a dated test goal: two Mondays on', tB);
  row('Start date, a dated test goal: the test\'s own Sunday', tC);
  row('Race date: the same day again', raceSame);
  row('Race date: two weeks later', raceLater);
  row('Race date: two days from today', raceSoon);
  row('Race date: the box cleared', raceBlank);
  for (const k of Object.keys(T).sort()) E.push('| ' + k + ' | ' + T[k] + ' |');
}

// ── The copy button ─────────────────────────────────────────────────────────
const F: Record<string, number> = {};
{
  const copy: Tap[] = [];
  for (const name of NAMES) {
    const P = phoneOf(snaps[name]!['3 third week']!);
    P.IA.ctx['__clip'] = [];
    P.ev('Object.defineProperty(navigator,"clipboard",{value:{writeText:function(t){__clip.push(String(t));return Promise.resolve();}},configurable:true});');
    const id: string = P.ev('activeProgId');
    const t0 = P.toasts.length;
    copy.push(tap(P, `copyProgSel(${J(id)})`));
    await new Promise((r) => setImmediate(r));
    for (const t of P.toasts.slice(t0)) bump(F, 'toast once the clipboard answers: "' + t + '"');
    const clip = P.IA.ctx['__clip'] as string[];
    bump(F, 'texts handed to the clipboard', clip.length);
    const lines = (clip[0] || '').split('\n');
    bump(F, 'a text of ' + lines.length + ' lines');
    for (const l of lines) bump(F, 'line: ' + (l.split(':')[0] || '').replace(/ \(est\. from experience\)/, '').replace(/^THE ASYLUM.*/, 'THE ASYLUM — Program selections'));
    if (lines.join('\n') === (P.ev(`progSelLines(getPrograms().find(function(x){return x.id===${J(id)};}))`) as string[]).join('\n')) bump(F, 'the text is progSelLines joined by new lines');
  }
  row('Programs tab: the copy button by the seed', copy);
}

say('## B. What they draw');
say();
say('The sheet\'s kinds are read off the Angular model\'s builders (`travelView`, `injuryView`), the chip\'s and the check in\'s off the page\'s (`renderOverlayChip`), the pop-ups\' off `imBackFromInjury` and `injReassess`; then counted off every draw the walks of section C and D made.');
say();
say('The sheet (' + sheetDraws + ' draws; in ' + sheetSame + ' of them the model\'s words, in the template\'s order, are the page\'s own markup\'s words):');
say();
table(K, 'Kind');
say('The chip wrap:');
say();
table(CK, 'Kind');
say('The pop-ups:');
say();
table(PK, 'Kind');

say('## C. What each tap reads and writes');
say();
say('Each tap on a phone at the end of the first week (the dates and the copy button: the third), the ten programs unless the row says otherwise. "Grid moved" is how many of those phones had a day of the grid in hand change. An outcome that differs between programs is followed by how many gave it.');
say();
say('| Tap | Phones | Stored keys that changed | Keys asked for | The page\'s calls | Grid moved | Toast | Pop-up |');
say('|---|---|---|---|---|---|---|---|');
for (const r of ROWS) say(r);
say();

say('## D. The check in');
say();
say('The card is drawn under the chip of an injury with no end date, once `Date.now()` is fourteen days past the overlay\'s `lastAsk`, or its `created` when it was never asked. It reads the clock in milliseconds, not the calendar day. Knee, work around it, flagged at the end of the first week on each of the ten programs:');
say();
say('| What | Phones |'); say('|---|---|');
for (const r of D) say(r);
say();

say('## E. This Week\'s start date and race date');
say();
say('One row under the header: the race date when the program has a race alignment (`progAlignment`: a run goal that counts back from a race), else Program Start. Each is a `<label>` over a native date box (`setProgRace`, `setProgStart`).');
say();
say('| What | Programs |'); say('|---|---|');
for (const r of E) say(r);
say();

say('## F. The copy button');
say();
table(F, 'What');

say('## G. On the simulator\'s copy of Mario\'s backup (counts only)');
say();
say('Read by a scratch script from a copy of the simulator\'s store (2026-11-20, the store\'s hash 278ba57f3f6a382b before and after, the hash the last session read; nothing was written to it), every tap on a phone of its own in the VM harness. Typed here by hand: no name, note, date or load.');
say();
say('- The store holds 36 `ia_` keys and 3 programs. 1 overlay is stored in all, on a program that is not the active one: a return week, long ended. The active program stores none.');
say('- The active program is inside its 14 weeks. This Week draws 0 chips and 0 check in cards, the pill reads Hurt?, and none of the grid\'s 98 days is built under travel.');
say('- Its date row is the race date, not Program Start.');
say('- Apply change on Hurt? (knee, work around it, today) changed `ia_programs` alone, moved the grid, one toast, and drew 1 chip. I’m back from it changed `ia_programs` alone, moved the grid, one pop-up, and drew 2 chips (the return week and the week after).');
say('- Apply change on Traveling? (Mini gym, the sheet\'s own dates) changed `ia_programs` alone, moved the grid, one toast, 1 chip. Its ✕ changed `ia_programs` alone, moved the grid, one toast, 0 chips.');
say('- The race date set to the day it already holds rewrote `ia_programs` (the program stored again), left the grid the same, one toast.');
say('- The copy button handed the clipboard a text of 10 lines and wrote nothing.');
say();

writeFileSync(join(REPO, 'tests/measure/native-injury-travel_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
