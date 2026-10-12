// The pop-ups: what they say, which icon they show, and which line the draw may pick. Rulings D174 (P-EMOJI: emoji
// stay on the celebration tiers, workout, streak, season and Wildcard; reminders and injury calls show the notebook,
// shield and warning icons; the chrome outside the pop-up shows icons; the dash fixes in the copy) and D175
// (P-POPCOND: the pop-up judges the day the athlete trained, not the minute he tapped).
//
// D174 reads the app's source through the emoji scanner (tests/support/pop-ups.ts) and renders popFire and four chrome
// sites in the VM. D175 draws from the real popPick, fireCompletionPopup and maybeShowReminder with the clock pinned and
// Math.random pinned to (k + 0.5) / 64 for k = 0..63 with the rotation memory cleared before each draw, so the eligible
// set is read exactly (the pool has at most 27 lines).
//
// Oracles are typed by hand: the ruled copy, the tag table (which workout lines need a weekend, a morning, a cardio day
// or a lift day), its eligible-size table, and a calendar (2026-09-14 is a Monday). Every emoji and typographic mark the
// D174 tests look for is built in code from its code point (CP), so a glyph typed here can never satisfy a scan.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { DayKey } from '@ia/core';
import { loadApp } from '../support/app.ts';
import * as P from '../support/pop-ups.ts';

/** What the trained day was, as the D175 tag table reads it. */
interface Cell {
  known: boolean;
  weekend: boolean;
  hour: number;
  today: boolean;
  cardio: boolean;
  lift: boolean;
}
/** A hand-built program for the draws: weeks of days the app reads (rest days, cardio, sections). */
interface HandProg {
  id: string;
  name: string;
  startDate: string | null;
  totalWeeks: number;
  weeks: Record<number, Record<string, any>>;
}

const { CP, BS, MD, LQ, RQ, cnt } = P;
const J = JSON.stringify;

// ── D174: emoji and icons ────────────────────────────────────────────────────────────────────────────────────────────
const IA = loadApp();
const SRC = IA.html;
const S = P.scan(SRC);
const A = P.classify(S);
const T = (s: string, ...cps: number[]) => s + (cps.length ? ' ' + CP(...cps) : '');

test('the emoji scanner reads the whole app: over 10,000 literals, both icon tables, no pictograph in code', () => {
  const literals = S.toks.filter((t) => t.type !== 'code').length;
  assert.ok(literals > 10000, literals + ' literals');
  assert.ok(S.PATHS && Object.keys(S.PATHS).length > 20, 'ASY_ICON_PATHS parsed');
  assert.ok(S.EMAP, 'ASY_EMOJI parsed');
  assert.equal(S.codeHits, 0, 'pictographs in code tokens');
});

test('no emoji appears outside the celebration pop-ups and the icon tables', () => {
  assert.deepEqual(A.offenders.map((h) => 'L' + h.line + ' ' + h.cp + ' | ' + h.ctx), []);
});

test('every allowance resolves its anchor once and allows at least one emoji', () => {
  assert.deepEqual(A.errs, []);
});

test('the emoji allowlist lets a celebration line through and catches the nudge and the reminder pool', () => {
  const firstStr = (ext: [number, number] | null | undefined) => {
    if (!ext) return null;
    for (let i = P.tokIdxFrom(S, ext[0]); i < S.toks.length && S.toks[i].a < ext[1]; i++) if (S.toks[i].type === 'str') return S.toks[i];
    return null;
  };
  // an extra emoji inside POP_POOLS.season stays allowed
  const t1 = firstStr(A.tierExt.season);
  assert.ok(t1, 'POP_POOLS.season has a line');
  let R = P.classify(P.scan(SRC.slice(0, t1.b) + ' ' + CP(0x1F984) + SRC.slice(t1.b)));
  assert.ok(R.pass && R.allow[P.MECHS[0]] === A.allow[P.MECHS[0]] + 1, 'offenders ' + R.offenders.length + ', errs ' + R.errs.length);
  // the clipboard escape put back in the log nudge is caught on that line
  const NUDGE = "'<div class=\"log-nudge\"><span>'+asyIcon('notebook',14)+' You logged this one";
  assert.equal(cnt(SRC, NUDGE), 1);
  R = P.classify(P.scan(SRC.replace(NUDGE, "'<div class=\"log-nudge\"><span>" + BS + 'ud83d' + BS + "udccb You logged this one")));
  assert.ok(!R.pass && R.offenders.some((h) => /You logged this one/.test(h.ctx) && h.seq === CP(0x1F4CB)));
  // an emoji inside POP_POOLS.reminder is caught
  const t3 = firstStr(A.tierExt.reminder);
  assert.ok(t3, 'POP_POOLS.reminder has a line');
  R = P.classify(P.scan(SRC.slice(0, t3.b) + ' ' + CP(0x1F440) + SRC.slice(t3.b)));
  assert.ok(!R.pass && R.offenders.some((h) => h.seq === CP(0x1F440)));
});

// The edited pop-up lines: [pool, index, the line as ruled, the line before it]
const EDITED = [
  ['workout', 0, T('Congrats... you actually showed up. Just, you know, faster next time.', 0x1F389)],
  ['workout', 2, T('Look at you. Vertical, sweaty, and useful. Goddamn miracle.', 0x1FAE1)],
  ['workout', 7, T('Sweat now or be wheezing up eight flights of stairs later.', 0x1F6B6, 0x1F624)],
  ['workout', 18, T("Quit looking for a medal. It's under your tetas, find it later.", 0x1F947)],
  ['workout', 25, T('You did the whole thing. Looked dead ugly on that last set, but you finished.', 0x1F480)],
  ['workout', 26, T('Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay, "workout complete."', 0x1F3A7)],
  ['reminder', 4, 'You disappeared on a workout. Your record, your call. Fix it.'],
  ['season', 3, T('You saw it through. Rare as fuck. Most quit at week two like little bitches.', 0x1F414)],
  ['season', 7, T('You outlasted every weak ass excuse your brain coughed up. Respect, animal.', 0x1F9E0, 0x274C)],
] as const;
const strs: string[] = [];
S.toks.forEach((t, ti) => { if (t.type === 'str') strs.push(S.tokText(ti)); });
const nTok = (s: string) => strs.filter((x) => x === s).length;

test('the nine edited pop-up lines read exactly as ruled, once each, and the reminder line carries no emoji', () => {
  for (const [pool, i, line] of EDITED) {
    assert.equal(nTok(line), 1, pool + '[' + i + '] ' + J(line));
    if (pool === 'reminder') assert.deepEqual(P.pictos(line), []);
  }
});

test('the re-entry message after a week off reads as ruled', () => {
  assert.equal(nTok('More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.'), 1);
});

test('the old dashed and hyphenated copy is gone, raw and escape-decoded', () => {
  const OLD = ['you know ' + MD + ' faster', 'Look at you ' + MD, '8-story walk-up', 'medal ' + MD, 'whole thing ' + MD, 'But okay ' + MD,
    'your call ' + MD, 'Rare as fuck ' + MD, 'weak-ass', 'ease back in ' + MD, MD + ' edit if you know better'];
  const dec = P.decodeEsc(S.stripped);
  assert.deepEqual(OLD.filter((o) => cnt(S.stripped, o) + cnt(dec, o) > 0), []);
});

test('the short-gap reminder line "This one got away from you" is gone', () => {
  assert.equal(cnt(S.stripped, 'This one got away from you') + cnt(P.decodeEsc(S.stripped), 'This one got away from you'), 0);
});

test('the wizard seed caption reads Estimated from "the program". Edit if you know better., with no em-dash', () => {
  const L = P.lineOfNeedle(S, 'Estimated from ');
  assert.ok(!L.err, L.err as string);
  const a = L.line.indexOf('`');
  const b = L.line.lastIndexOf('`');
  const tpl = a >= 0 && b > a ? L.line.slice(a, b + 1) : '';
  const d = P.decodeEsc(tpl);
  assert.equal(cnt(d, 'Estimated from ' + LQ + '${s.progName}' + RQ + '. Edit if you know better.'), 1, d.slice(0, 200));
  assert.equal(cnt(d, MD), 0);
  assert.equal(cnt(tpl, BS + 'u2014'), 0);
});

test('the reminder pool is five plain ASCII lines', () => {
  const pools = P.literalAt(S, 'const POP_POOLS=');
  assert.ok(pools);
  assert.equal(pools.reminder.length, 5);
  assert.deepEqual(pools.reminder.map(P.popText).filter((s: unknown) => [...String(s)].some((ch) => (ch.codePointAt(0) as number) > 0x7F)), []);
});

test('the reminder pop-up shows the notebook icon', () => {
  assert.equal(IA.eval('POP_CFG.reminder.icon'), 'notebook');
  assert.ok(Object.prototype.hasOwnProperty.call(S.PATHS, 'notebook'));
});

test('the injury check-ins show the shield, or the warning when trending worse', () => {
  const INJURY = [['Good. One week to prove it.', 'shield'], ['Good. Two weeks to full send.', 'shield'], ['Good sign.', 'shield'], ['Two weeks and trending worse.', 'warning']];
  for (const [msg, want] of INJURY) {
    const re = new RegExp('popFire' + BS + "('workout'," + BS + "{icon:'([^']*)',kicker:'(BACK IN|CHECK IN)',msg:'" + P.reEsc(msg) + "'", 'g');
    const ms = [...S.stripped.matchAll(re)];
    assert.equal(ms.length, 1, msg);
    assert.equal(ms[0][1], want, msg);
  }
});

/** popFire with #popIcon recording every innerHTML and textContent write, and asyIcon spied (not replaced). */
function popIconWrites() {
  let els: Record<string, any> = {};
  const mk = (id: string) => {
    const w: [string, string][] = [];
    let html = '';
    let text = '';
    const e = { id, className: '', style: {}, offsetWidth: 0, writes: w, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      appendChild(c: unknown) { return c; }, removeChild(c: unknown) { return c; }, remove() {}, setAttribute() {}, addEventListener() {} };
    Object.defineProperty(e, 'innerHTML', { get() { return html; }, set(v) { html = String(v); w.push(['html', html]); } });
    Object.defineProperty(e, 'textContent', { get() { return text; }, set(v) { text = String(v); w.push(['text', text]); } });
    return e;
  };
  const doc = IA.window.document;
  const orig = doc.getElementById;
  doc.getElementById = (id: string) => (els[id] = els[id] || mk(id));
  IA.eval('(function(){ if(globalThis.__popSpy) return; globalThis.__popSpy=1; var real = asyIcon; globalThis.__popCalls = []; asyIcon = function(k, s){ globalThis.__popCalls.push([String(k), s]); return real(k, s); }; })()');
  const popFire = IA.eval('popFire');
  const fire = (tier: string, opts: Record<string, string>) => {
    els = {};
    IA.eval('__popCalls.length = 0');
    popFire(tier, opts);
    return { w: (els.popIcon ? els.popIcon.writes : []).slice(), calls: JSON.parse(JSON.stringify(IA.eval('__popCalls'))) };
  };
  return { fire, restore: () => { doc.getElementById = orig; } };
}
const svgOnly = (r: { w: [string, string][] }) => r.w.length === 1 && r.w[0][0] === 'html' && r.w[0][1].indexOf('<svg') === 0;

test('a reminder pop-up writes the notebook SVG into its icon, not text', () => {
  const p = popIconWrites();
  const r = p.fire('reminder', { msg: 'm', sub: 's', dismiss: 'ok' });
  p.restore();
  assert.ok(svgOnly(r), J(r.w).slice(0, 120));
  assert.ok(r.calls.some((c: [string, unknown]) => c[0] === 'notebook' && c[1] === 52), J(r.calls));
});

test('an injury pop-up writes the shield or warning SVG into its icon', () => {
  const p = popIconWrites();
  const r2 = p.fire('workout', { icon: 'shield', kicker: 'BACK IN', msg: 'm', dismiss: 'ok' });
  const r3 = p.fire('workout', { icon: 'warning', kicker: 'CHECK IN', msg: 'm', dismiss: 'ok' });
  p.restore();
  assert.ok(svgOnly(r2) && svgOnly(r3), J([r2.w, r3.w]).slice(0, 200));
});

test('the workout, streak and season pop-ups show the party popper, fire and trophy as text, never through asyIcon', () => {
  const p = popIconWrites();
  for (const [tier, e] of [['workout', CP(0x1F389)], ['streak', CP(0x1F525)], ['season', CP(0x1F3C6)]]) {
    const r = p.fire(tier, { msg: 'm', dismiss: 'ok' });
    assert.deepEqual(r.w, [['text', e]], tier);
    assert.ok(!r.calls.some((c: [string, unknown]) => P.pictos(c[0]).length), tier + ' ' + J(r.calls));
  }
  p.restore();
});

test('the chrome shows icons where it had emoji: the seed caption and header, the log nudge, the archived chip', () => {
  const clean = (r: string) => P.pictos(r).length === 0;
  const Q = LQ + 'Old Program' + RQ;
  const cases: [string, string, string, (L: string) => string, (r: string) => boolean][] = [
    ['seed caption', 'Estimated from ', "asyIcon('chart',",
      (L) => { const a = L.indexOf('`'); const b = L.lastIndexOf('`'); return '(function(s){ return ' + L.slice(a, b + 1) + '; })({progName:"Old Program"})'; },
      (r) => { const k = r.indexOf('</svg> Estimated from ' + Q + '. Edit if you know better.</div>'); return k > 0 && r.lastIndexOf('<svg', k) > 0 && clean(r); }],
    ['seed header', 'Seed from ' + BS + 'u201C${s.progName}', "asyIcon('chart',",
      (L) => '(function(s){ return `' + L.trim() + '`; })({progName:"Old Program"})',
      (r) => { const k = r.indexOf('</svg> Seed from ' + Q + '?</div>'); return k > 0 && r.lastIndexOf('<svg', k) > 0 && clean(r); }],
    ['log nudge', 'You logged this one but never marked it.', "asyIcon('notebook',",
      (L) => { const a = L.indexOf('html+='); const b = L.lastIndexOf(';'); return '(function(dayKey, escTitle){ return (' + L.slice(a + 6, b) + '); })("mon", "Leg day")'; },
      (r) => { const k = r.indexOf('</svg> You logged this one but never marked it.'); return r.indexOf('<div class="log-nudge">') === 0 && k > 0 && r.lastIndexOf('<svg', k) > 0 && clean(r); }],
    ['archived chip', 'const label=(p.archived?', "asyIcon('history',",
      (L) => {
        const a = L.indexOf('const label='); const b = L.lastIndexOf(';'); const ex = L.slice(a + 12, b);
        return 'JSON.stringify([(function(p){ return ' + ex + '; })({archived:true, name:"Old Program"}), (function(p){ return ' + ex + '; })({archived:false, name:"New"})])';
      },
      (r) => { const v = JSON.parse(r); return /^<svg[\s\S]*<\/svg> Old Program$/.test(v[0]) && v[1] === 'New' && clean(v[0]); }],
  ];
  for (const [name, needle, icon, mkExpr, good] of cases) {
    const L = P.lineOfNeedle(S, needle);
    assert.ok(!L.err, name + ': ' + L.err);
    assert.equal(cnt(L.line, icon), 1, name + ' names ' + icon);
    const r = String(IA.eval(mkExpr(L.line)));
    assert.ok(good(r), name + ' rendered ' + J(r.slice(0, 160)));
  }
});

// ── D175: which workout line the pop-up may draw ─────────────────────────────────────────────────────────────────────
// The tag table: workout pool index -> what the trained day must be. The other 21 lines are untagged and always open.
const HAND_TAGS: Record<number, { when?: string; type?: string }> = { 1: { when: 'weekend' }, 3: { when: 'morning' }, 8: { when: 'weekend', type: 'cardio' }, 15: { when: 'weekend' }, 25: { type: 'lift' }, 26: { type: 'lift' } };
const TAGGED = [1, 3, 8, 15, 25, 26];
const UNTAGGED = [...Array(27).keys()].filter((i) => !TAGGED.includes(i));
const TAG_ANCHOR: Record<number, string> = { 1: 'hangover said stay down', 3: "half the city's still asleep", 8: 'talk all the shit you want at brunch',
  15: "showed up hungover, didn't die", 25: 'dead ugly on that last set', 26: 'ten minutes lifting' };
// The day shapes as the ruling's lens reads them: cardio = the day has a cardio session; lift = a section that is not
// core, hip, mobility or taper and has items.
const SHAPE: Record<string, { cardio: boolean; lift: boolean }> = { liftOnly: { cardio: false, lift: true }, runLift: { cardio: true, lift: true }, runMob: { cardio: true, lift: false }, runOnly: { cardio: true, lift: false } };
const SHAPES = Object.keys(SHAPE);
// Eligible lines per shape, typed: weekday >= 9h, weekday < 9h, weekend >= 9h, weekend < 9h (the trained day is today).
const COUNT_1C: Record<string, number[]> = { liftOnly: [23, 24, 25, 26], runLift: [23, 24, 26, 27], runMob: [21, 22, 24, 25], runOnly: [21, 22, 24, 25] };
function handElig(i: number, cell: Cell) {
  const t = HAND_TAGS[i];
  if (!t) return true;
  if (!cell.known) return false;
  if (t.when === 'weekend' && !cell.weekend) return false;
  if (t.when === 'morning' && !(cell.hour < 9 && cell.today)) return false;
  if (t.type === 'cardio' && !cell.cardio) return false;
  if (t.type === 'lift' && !cell.lift) return false;
  return true;
}
const handSet = (cell: Cell) => [...Array(27).keys()].filter((i) => handElig(i, cell));

// The hand calendar. 2026-09-14 is a Monday. Week k (1..4) holds one shape on wed, sat and sun.
const HAND_WEEK: Record<string, number> = { liftOnly: 1, runLift: 2, runMob: 3, runOnly: 4 };
const DATES: Record<string, Record<string, number[]>> = { 1: { wed: [2026, 9, 16], sat: [2026, 9, 19], sun: [2026, 9, 20] }, 2: { wed: [2026, 9, 23], sat: [2026, 9, 26], sun: [2026, 9, 27] },
  3: { wed: [2026, 9, 30], sat: [2026, 10, 3], sun: [2026, 10, 4] }, 4: { wed: [2026, 10, 7], sat: [2026, 10, 10], sun: [2026, 10, 11] } };
// A later tap: wed + 3 = a Saturday, sat + 2 and sun + 1 = a Monday (a tap-clock weekend points the wrong way both ways).
const PAST: Record<string, Record<string, number[]>> = { 1: { wed: [2026, 9, 19], sat: [2026, 9, 21], sun: [2026, 9, 21] }, 2: { wed: [2026, 9, 26], sat: [2026, 9, 28], sun: [2026, 9, 28] },
  3: { wed: [2026, 10, 3], sat: [2026, 10, 5], sun: [2026, 10, 5] }, 4: { wed: [2026, 10, 10], sat: [2026, 10, 12], sun: [2026, 10, 12] } };
const WEEKEND_KEY: Record<string, boolean> = { wed: false, sat: true, sun: true };
const DOW: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const OFF: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
const WEEKDAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const PID = 'popups';
const cl = (o: unknown) => JSON.parse(JSON.stringify(o));

const CORE = { label: 'Core', core: true, coreHeader: 'Core', items: [{ name: 'Plank', rx: '3×30s' }] };
const HIP = { label: 'Hip', hip: true, items: [{ name: 'Clamshell', rx: '2×15' }] };
const RUN = (sub: string) => ({ type: 'run', subtype: sub, label: 'Run' });
const DAY: Record<string, unknown> = {
  liftOnly: { title: 'Upper Strength', sections: [{ label: 'Main', items: [{ name: 'Bench press', rx: '4×5' }] }, CORE] },
  runLift: { title: 'Easy Run + Primer', cardio: RUN('easy'), sections: [{ label: 'Race-week Primer', items: [{ name: 'Goblet squat', rx: '2×8' }] }, CORE] },
  runMob: { title: 'Long Run', cardio: RUN('long'), sections: [{ label: 'Post-run mobility', items: [{ name: 'Couch stretch', rx: '2×45s' }] }, CORE, HIP, { label: 'Main', items: [] }] },
  runOnly: { title: 'Shakeout', cardio: RUN('shakeout'), sections: [] },
};
function handProg(): HandProg {
  const weeks: HandProg['weeks'] = {};
  for (let w = 1; w <= 5; w++) { weeks[w] = {}; WEEKDAYS.forEach((d) => { weeks[w][d] = { rest: true, title: 'Rest', sections: [] }; }); }
  SHAPES.forEach((sh) => ['wed', 'sat', 'sun'].forEach((d) => { weeks[HAND_WEEK[sh]][d] = cl(DAY[sh]); }));
  weeks[5].sat = cl(DAY.runOnly);
  weeks[5].sat.title = 'Final Run';
  return { id: PID, name: 'POP', startDate: '2026-09-14', totalWeeks: 5, weeks };
}
// The reminder program: every day an Easy Run + Lower from Monday 2026-09-14; the clock Thursday 2026-10-01 (W3 thu).
const REM_TITLE = 'Easy Run + Lower';
function remProg(): HandProg {
  const weeks: HandProg['weeks'] = {};
  for (let w = 1; w <= 4; w++) { weeks[w] = {}; WEEKDAYS.forEach((d) => { weeks[w][d] = cl(DAY.runLift); weeks[w][d].title = REM_TITLE; }); }
  return { id: PID, name: 'POPR', startDate: '2026-09-14', totalWeeks: 4, weeks };
}
const comp = (keys: string[]) => { const c: Record<string, { title: string; ts: number; status: string }> = {}; keys.forEach((k) => { c[k] = { title: REM_TITLE, ts: 1, status: 'complete' }; }); return c; };
const WK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const COMP_GAP3 = comp(WK.map((d) => 'w1_' + d).concat(WK.map((d) => 'w2_' + d))); // W3 mon, tue, wed unresolved
const COMP_GAP8 = comp(WK.map((d) => 'w1_' + d).concat(['w2_mon', 'w2_tue'])); // W2 wed .. W3 wed unresolved
const REM_SUB = 'Wednesday, Wk 3 · ' + REM_TITLE;
const REM_DOCTRINE = '. The week ahead stays as written.';
const REM_FIXED = 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.';
const REM_ANCHOR = ['you ghosted a session', 'left a day hanging unmarked', 'unfinished business sitting on your calendar', "that day didn't log itself", 'you disappeared on a workout'];

// The ruling's lens, typed, for the real HALF_MANNY days.
function lens(day: any) {
  const c = !!day.cardio;
  const raw = (day.sections || []).filter((s: any) => !s.core && !s.hip && (s.items || []).length);
  const lift = raw.filter((s: any) => !/mobility|taper/i.test(s.label || ''));
  if (c && lift.length) return 'runLift';
  if (c && raw.length) return 'runMob';
  if (c) return 'runOnly';
  if (lift.length) return 'liftOnly';
  return 'UNPLACEABLE';
}
function monOf(iso: string) {
  const p = iso.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  const w = d.getDay();
  d.setDate(d.getDate() - (w === 0 ? 6 : w - 1));
  return d;
}
const tup = (d: Date): number[] => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
const addDays = (t: number[], n: number) => { const d = new Date(t[0], t[1] - 1, t[2]); d.setDate(d.getDate() + n); return tup(d); };

// The VM: a retaining DOM stub for #popMsg, #popSub, #popKicker; a pinned clock (new Date() and Date.now() read
// __pcNow); Math.random pinned to __pcFix when set, else a seeded Park-Miller LCG on a fresh Math object.
const Q = loadApp();
const LS = Q.localStorage;
const DOM_STUB = "__pcMk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',className:'',style:{},dataset:{},children:[],"
  + 'classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},'
  + 'setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},'
  + 'appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},'
  + 'replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},'
  + 'addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},'
  + 'closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},'
  + 'offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};'
  + '__pcEls={};document.getElementById=function(id){if(!__pcEls[id])__pcEls[id]=__pcMk(id);return __pcEls[id];};';
Q.eval('(function(){ var RD=Date; globalThis.__pcRD=RD; globalThis.__pcNow=RD.now();'
  + ' function FD(){ if(!(this instanceof FD)) return new RD(globalThis.__pcNow).toString();'
  + ' if(!arguments.length) return new RD(globalThis.__pcNow);'
  + ' return new (Function.prototype.bind.apply(RD,[null].concat([].slice.call(arguments))))(); }'
  + ' FD.prototype=RD.prototype; FD.now=function(){return globalThis.__pcNow;}; FD.parse=RD.parse; FD.UTC=RD.UTC;'
  + ' globalThis.Date=FD; })();');
const setNow = (t: number[], h: number) => Q.eval('globalThis.__pcNow=new __pcRD(' + t[0] + ',' + (t[1] - 1) + ',' + t[2] + ',' + h + ',0,0).getTime()');
setNow([2026, 9, 24], 10);
const WTXT = JSON.parse(Q.eval("JSON.stringify(POP_POOLS.workout.map(function(e){return (e&&typeof e==='object')?e.t:e;}))"));
// The real HALF_MANNY days: the first day of each shape by the lens, never the final scheduled day. buildProgram leaves
// startDate to the wizard, so week 1's Monday is back-dated by hand so Race Day (found by subtype) lands on raceDate.
const REAL = (() => {
  const prog = Q.buildProgram(cl(Q.fixtures.HALF_MANNY));
  let race = null as 'many' | { w: number; d: DayKey } | null;
  Object.keys(prog.weeks).forEach((w) => WEEKDAYS.forEach((d) => {
    const y = prog.weeks[w][d];
    const c = y && !y.rest && y.cardio;
    const sub = c ? (Array.isArray(c) ? c.map((x) => x.subtype || '').join(' ') : c.subtype || '') : '';
    if (/race day/i.test(sub)) race = race ? 'many' : { w: +w, d };
  }));
  if (race && race !== 'many') {
    const rd = (Q.fixtures.HALF_MANNY.raceDate as string).split('-').map(Number);
    const m = new Date(rd[0], rd[1] - 1, rd[2]);
    m.setDate(m.getDate() - ((race.w - 1) * 7 + OFF[race.d]));
    prog.startDate = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-' + String(m.getDate()).padStart(2, '0');
  }
  const all: { w: number; d: DayKey; date: number[]; t: number; k: string }[] = [];
  if (prog.startDate) {
    const mon = monOf(prog.startDate);
    Object.keys(prog.weeks).map(Number).sort((a, b) => a - b).forEach((w) => WEEKDAYS.forEach((d) => {
      const y = prog.weeks[w][d];
      if (!y || y.rest) return;
      const dt = new Date(mon);
      dt.setDate(mon.getDate() + (w - 1) * 7 + OFF[d]);
      all.push({ w, d, date: tup(dt), t: dt.getTime(), k: lens(y) });
    }));
  }
  all.sort((a, b) => a.t - b.t);
  const pick: Record<string, (typeof all)[number]> = {};
  const body = all.slice(0, -1);
  SHAPES.forEach((s) => { const x = body.find((z) => z.k === s); if (x) pick[s] = x; });
  return { prog, pick, race };
})();
Q.eval("(function(){ var M=Object.create(Math); globalThis.__pcFix=null; globalThis.__pcSeed=76308;"
  + ' M.random=function(){ if(globalThis.__pcFix!==null) return globalThis.__pcFix;'
  + ' globalThis.__pcSeed=(globalThis.__pcSeed*16807)%2147483647; return globalThis.__pcSeed/2147483647; };'
  + ' globalThis.Math=M; })();');

const MEMKEY = 'ia_pop_idx_' + PID;
function install(prog: unknown, c?: unknown) {
  LS.clear();
  Q.eval("activeProgId='" + PID + "'");
  Q.eval('activeProg=' + JSON.stringify(prog));
  if (c) LS.setItem('ia_comp_' + PID, JSON.stringify(c));
  Q.eval(DOM_STUB);
}
const el = (id: string) => Q.eval('__pcEls.' + id + ' ? __pcEls.' + id + '.textContent : null');
/** The exact eligible set: 64 draws at r = (k + 0.5) / 64, the rotation memory reset (or preset to `mem`) before each. */
function sweep(drawExpr: string, mem?: Record<string, number> | null, readMsg?: boolean) {
  const got = new Set();
  for (let k = 0; k < 64; k++) {
    if (mem) LS.setItem(MEMKEY, JSON.stringify(mem));
    else LS.removeItem(MEMKEY);
    Q.eval('globalThis.__pcFix=' + (k + 0.5) / 64);
    const r = Q.eval(drawExpr);
    got.add(readMsg ? el('popMsg') : r);
    Q.flushTimers();
  }
  Q.eval('globalThis.__pcFix=null');
  return [...got].map((t) => WTXT.indexOf(t)).sort((a, b) => a - b);
}

test('the hand calendar agrees with the host clock: 2026-09-14 is a Monday, and the taps fall where typed', () => {
  assert.equal(new Date(2026, 8, 14).getDay(), 1);
  for (const w of Object.keys(DATES)) {
    for (const d of Object.keys(DATES[w])) {
      const t = DATES[w][d];
      const p = PAST[w][d];
      assert.equal(new Date(t[0], t[1] - 1, t[2]).getDay(), DOW[d], 'W' + w + ' ' + d);
      assert.equal(new Date(p[0], p[1] - 1, p[2]).getDay(), d === 'wed' ? 6 : 1, 'later tap W' + w + ' ' + d);
    }
  }
  assert.equal(new Date(2026, 8, 30).getDay(), 3);
  assert.equal(new Date(2026, 9, 1).getDay(), 4);
});

test('HALF_MANNY reads 14 lift-only, 45 run and lift, 9 run and mobility and 2 run-only days, and its long run is a Saturday with mobility', () => {
  const n: Record<string, number> = { liftOnly: 0, runLift: 0, runMob: 0, runOnly: 0, UNPLACEABLE: 0 };
  Object.keys(REAL.prog.weeks).forEach((w) => WEEKDAYS.forEach((d) => { const y = REAL.prog.weeks[w][d]; if (y && !y.rest) n[lens(y)]++; }));
  assert.deepEqual(n, { liftOnly: 14, runLift: 45, runMob: 9, runOnly: 2, UNPLACEABLE: 0 });
  assert.deepEqual(REAL.race, { w: 14, d: 'sun' }, 'one Race Day, W14 sun');
  const sd = (REAL.prog.startDate as string).split('-').map(Number);
  assert.equal(new Date(sd[0], sd[1] - 1, sd[2]).getDay(), 1, 'week 1 starts on a Monday');
  assert.ok(SHAPES.every((s) => REAL.pick[s]), J(Object.keys(REAL.pick)));
  const m = REAL.pick.runMob;
  assert.equal(m.d, 'sat');
  assert.ok((REAL.prog.weeks[m.w][m.d].sections || []).some((s) => s.label === 'Post-run mobility'));
});

test('the hand rule reproduces the eligible-size table, and a later tap reads like a tap after 9', () => {
  for (const sh of SHAPES) {
    for (const we of [false, true]) {
      for (const h of [10, 7]) {
        for (const today of [true, false]) {
          const col = (we ? 2 : 0) + (today && h < 9 ? 1 : 0);
          assert.equal(handSet(Object.assign({ known: true, weekend: we, hour: h, today }, SHAPE[sh])).length, COUNT_1C[sh][col], [sh, we, h, today].join(' '));
        }
      }
    }
  }
});

test('the workout line is drawn from what the trained day was: its weekday, the morning only when it is today, cardio or lifting', () => {
  for (const sh of SHAPES) {
    for (const d of ['wed', 'sat', 'sun']) {
      for (const [when, TAB] of [['today', DATES], ['later', PAST]] as const) {
        for (const h of [7, 10]) {
          const w = HAND_WEEK[sh];
          const exp = handSet(Object.assign({ known: true, weekend: WEEKEND_KEY[d], hour: h, today: when === 'today' }, SHAPE[sh]));
          install(handProg());
          setNow(TAB[w][d], h);
          assert.deepEqual(sweep("popPick('workout'," + w + ",'" + d + "')"), exp, [sh, d, when, h + 'h'].join(' '));
        }
      }
    }
  }
});

test('on real HALF_MANNY days of each shape the draw matches the hand rule, today and later, before and after 9', () => {
  for (const sh of SHAPES) {
    for (const when of ['today', 'later']) {
      for (const h of [7, 10]) {
        const p = REAL.pick[sh];
        const exp = handSet(Object.assign({ known: true, weekend: p.d === 'sat' || p.d === 'sun', hour: h, today: when === 'today' }, SHAPE[sh]));
        install(REAL.prog);
        setNow(when === 'today' ? p.date : addDays(p.date, 2), h);
        assert.deepEqual(sweep("popPick('workout'," + p.w + ",'" + p.d + "')"), exp, [sh, 'W' + p.w, p.d, when, h + 'h'].join(' '));
      }
    }
  }
});

test('marking a run-only weekday done draws only untagged lines', () => {
  install(handProg());
  setNow(DATES[4].wed, 10);
  assert.deepEqual(sweep("fireCompletionPopup(4,'wed')", null, true), UNTAGGED);
  assert.equal(el('popKicker'), 'WORKOUT COMPLETE');
});

test('marking Saturday\'s long run done on Monday can draw the weekend lines, never the morning or lifting ones', () => {
  const p = REAL.pick.runMob;
  install(REAL.prog);
  setNow(addDays(p.date, 2), 10);
  const got = sweep('fireCompletionPopup(' + p.w + ",'" + p.d + "')", null, true);
  assert.ok([1, 8, 15].every((i) => got.includes(i)) && ![3, 25, 26].some((i) => got.includes(i)), J(got));
  assert.deepEqual(got, handSet(Object.assign({ known: true, weekend: true, hour: 10, today: false }, SHAPE.runMob)));
});

test('a lift-only Saturday never draws the weekend cardio line, and can draw the weekend and lifting ones', () => {
  install(handProg());
  setNow(DATES[1].sat, 10);
  const got = sweep("fireCompletionPopup(1,'sat')", null, true);
  assert.ok(!got.includes(8) && [1, 15, 25, 26].every((i) => got.includes(i)), J(got));
  assert.deepEqual(got, handSet(Object.assign({ known: true, weekend: true, hour: 10, today: true }, SHAPE.liftOnly)));
});

function reminder(c: Record<string, unknown>) {
  install(remProg(), c);
  setNow([2026, 10, 1], 10);
  Q.eval('maybeShowReminder()');
  Q.flushTimers();
  return { msg: el('popMsg'), sub: el('popSub'), kick: el('popKicker') };
}

test('a reminder after a short gap draws a reminder line and says the week ahead stays as written', () => {
  const r = reminder(COMP_GAP3);
  const pool = JSON.parse(Q.eval('JSON.stringify(POP_POOLS.reminder)'));
  assert.equal(REM_ANCHOR.filter((a) => String(r.msg).toLowerCase().includes(a)).length, 1, J(r));
  assert.ok(pool.includes(r.msg));
  assert.equal(r.sub, REM_SUB + REM_DOCTRINE);
});

test('the short-gap reminder rotates: no line twice in a row, and the draw is remembered', () => {
  install(remProg(), COMP_GAP3);
  setNow([2026, 10, 1], 10);
  Q.eval('globalThis.__pcSeed=76308');
  const seen: string[] = [];
  for (let k = 0; k < 12; k++) {
    LS.removeItem('ia_remind_last_' + PID);
    LS.removeItem('ia_reminded_' + PID);
    Q.eval(DOM_STUB);
    Q.eval('maybeShowReminder()');
    Q.flushTimers();
    seen.push(el('popMsg'));
  }
  const mem = JSON.parse(LS.getItem(MEMKEY) || '{}');
  assert.ok(!seen.some((m, i) => i && m === seen[i - 1]), J(seen));
  assert.ok(new Set(seen).size >= 2);
  assert.equal(typeof mem.reminder, 'number');
  assert.ok(seen.every((m) => m && !/week off/.test(m)));
});

test('a reminder after more than a week off shows the fixed re-entry message under the bare day name', () => {
  const r = reminder(COMP_GAP8);
  assert.deepEqual([r.msg, r.sub], [REM_FIXED, REM_SUB]);
});

test('with no trained day to read, only the untagged lines are drawn, even at a Saturday 07:00 tap', () => {
  install(handProg());
  setNow(DATES[1].sat, 7);
  assert.deepEqual(sweep("popPick('workout')"), UNTAGGED, 'no week or day');
  const noStart = handProg();
  noStart.startDate = null;
  install(noStart);
  setNow(DATES[1].sat, 7);
  assert.deepEqual(sweep("popPick('workout',1,'sat')"), UNTAGGED, 'no start date');
  install(handProg());
  setNow(DATES[1].sat, 7);
  assert.deepEqual(sweep("popPick('workout',9,'sat')"), UNTAGGED, 'no such week');
});

test('the pools hold 27 workout, 5 reminder, 5 streak and 9 season lines', () => {
  assert.equal(Q.eval('[POP_POOLS.workout.length,POP_POOLS.reminder.length,POP_POOLS.streak.length,POP_POOLS.season.length].join("/")'), '27/5/5/9');
});

test('each tagged workout line sits at its index', () => {
  for (const i of TAGGED) {
    assert.ok(String(WTXT[i] || '').toLowerCase().includes(TAG_ANCHOR[i]), i + ' ' + WTXT[i]);
    assert.equal(WTXT.filter((t: unknown) => String(t).toLowerCase().includes(TAG_ANCHOR[i])).length, 1, TAG_ANCHOR[i]);
  }
});

test('the reminder, streak and season pools carry no tags', () => {
  assert.equal(Q.eval("['reminder','streak','season'].map(function(k){return POP_POOLS[k].filter(function(e){return typeof e!=='string';}).length;}).join('/')"), '0/0/0');
});

test('the draw never repeats the last line, and remembers the one it drew', () => {
  install(handProg());
  setNow(DATES[2].sat, 7);
  assert.deepEqual(sweep("popPick('workout',2,'sat')", { workout: 4 }), [...Array(27).keys()].filter((i) => i !== 4));
  LS.setItem(MEMKEY, JSON.stringify({ workout: 4 }));
  Q.eval('globalThis.__pcFix=0.5');
  const t = Q.eval("popPick('workout',2,'sat')");
  Q.eval('globalThis.__pcFix=null');
  const mem = JSON.parse(LS.getItem(MEMKEY) || '{}');
  assert.equal(mem.workout, WTXT.indexOf(t));
  assert.notEqual(mem.workout, 4);
});

test('the Wildcard pop-up says its own line under WILDCARD DONE', () => {
  install(handProg());
  setNow(DATES[1].sat, 7);
  Q.eval('fireWildcardPopup(true)');
  Q.flushTimers();
  assert.deepEqual([el('popKicker'), el('popMsg')], ['WILDCARD DONE', 'You showed up. That is the whole game.']);
});

test('the streak and season pop-ups draw from their own pools', () => {
  install(handProg());
  setNow(DATES[1].sat, 7);
  const pools = JSON.parse(Q.eval('JSON.stringify({s:POP_POOLS.streak,z:POP_POOLS.season})'));
  Q.eval('fireStreakPopup(7)');
  const s = el('popMsg');
  Q.eval('fireSeasonPopup()');
  const z = el('popMsg');
  Q.flushTimers();
  assert.ok(pools.s.includes(s) && pools.z.includes(z), s + ' / ' + z);
});
