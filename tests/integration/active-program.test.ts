// The active program: one program is active, one place says so, one button makes it so. Ruling D178 (P-ACTIVE, V221,
// with its amendment and re-ruling: a stale pointer at boot, the legacy delete backfill). The record is in the handoff
// and tests/measure/v221_rulings/p_active_ruling.md. D238 (P-REMINDSWITCH, v0.240.1, docs/decisions/active-program.md): a
// switch marks the new program's past unmarked training days as asked, so the reminder never asks about a day spent on
// another program; the record is not written. Two tests below guard what must not change (they say so in their names).
//
// Oracle, typed by hand: the invariant "ia_active === activeProgId === activeProg.id, or all three null" after every
// path, and the id each path must land on; the toast and card copy; the week a switch lands on and the stored test
// week by date arithmetic on the pinned clock. Every path is the app's own (init, setActive, archiveProg, deleteProg,
// unarchiveProg, tabGo, doGenerate, renderProgList, renderWizardStep and the six guarded functions) in the VM harness,
// each on a fresh app whose clock is pinned before the boot under test.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { Cfg, Program, ProgramCfg } from '@ia/core';
import { loadApp, pinClock, appScript, fixtures } from '../support/app.ts';
import type { App, StorageStub } from '../support/app.ts';
import { stripComments } from '../support/week-view.ts';

/** The three places that name the active program: ia_active, activeProgId, activeProg.id. */
interface Triple {
  ia: string | null;
  id: unknown;
  pid: unknown;
}

// ── hand oracle ──────────────────────────────────────────────────────────────────────────────────────────────────
const T_GUARD = 'No active program. Tap Set Active or build a new one.';
const T_RESTORE = 'Restore this program first';
const T_SET = 'Active program updated';
const RUN_L = 'Hit a Pace / Time Goal', BIKE_L = 'Build Cycling Base';
const EXP_CARD = '[icon] ' + RUN_L + ' + [icon] ' + BIKE_L;
const EXP_WIZ = '[icon] Run: ' + RUN_L + ' + [icon] Bike: ' + BIKE_L;
const SET_BTN = (id: string) => '<button class="prog-action-btn primary" onclick="setActive(\'' + id + '\')">Set Active</button>';
const ACTIVE_LBL = '>Active ✓</button>';
const START = '2026-09-07';   // a Monday; every fixture program starts here unless named otherwise

// Local date math on the pinned clock: Sunday 2026-10-11, noon.
const TODAY = new Date(2026, 9, 11, 12, 0, 0);
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monOf = (s: string) => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
const DAY0 = (() => { const d = new Date(TODAY); d.setHours(0, 0, 0, 0); return d; })();
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
const DATE_WEEK = (startIso: string, tw: number) => { const diff = dayDiff(DAY0, monOf(startIso)); return diff < 0 ? 1 : Math.min(tw, Math.floor(diff / 7) + 1); };
const MON_NOW = monOf(iso(DAY0));
const T2_START = iso(MON_NOW), T2_RACE = iso(addDays(MON_NOW, 43));   // the test sits on Tuesday of week 7
const T2_WEEK = Math.floor(dayDiff(monOf(T2_RACE), monOf(T2_START)) / 7) + 1;
const plusD = (n: number) => iso(addDays(DAY0, n));

test('the date oracle agrees with itself: 2026-09-07 is a Monday, today sits in its week 5, the test lands in week 7', () => {
  assert.equal(new Date(2026, 8, 7).getDay(), 1);
  assert.equal(DATE_WEEK(START, 99), 5);
  assert.equal(T2_START, '2026-10-05');
  assert.equal(T2_RACE, '2026-11-17');
  assert.equal(T2_WEEK, 7);
});

// ── fixtures, built once ─────────────────────────────────────────────────────────────────────────────────────────
function app() { const IA = loadApp(); pinClock(IA, TODAY); return IA; }
const IA0 = app();
const HMF = fixtures.HALF_MANNY;
const bld = (over: Partial<Cfg>, id: string, extra?: Record<string, unknown>) => { const p = IA0.buildProgram(Object.assign({}, HMF, over)); p.id = id; p.name = id; p.startDate = START; return Object.assign(p, extra || {}); };
const LIFT = { cardioTypes: [], cardioGoals: {}, eventTargeted: false, primaryPath: 'lift', raceDate: undefined };
const cP = [bld({ seed: 1000 }, 'P0'), bld({ seed: 1001 }, 'P1'), bld({ seed: 1002 }, 'P2', { archived: true })];
const C_JSON = JSON.stringify(cP), C_JSON_P1A = JSON.stringify(cP.map(p => p.id === 'P1' ? Object.assign({}, p, { archived: true }) : p));
const sP = [cP[0], bld(Object.assign({ seed: 1001 }, LIFT), 'P1'), cP[2]];   // P1 lift only: its grid differs from P0's
const S_JSON = JSON.stringify(sP);
const A1 = bld({ seed: 4242 }, 'A1', { archived: true, archivedAt: 1 }), L1P = bld({ seed: 4242 }, 'L1'), D1 = bld({ seed: 4242 }, 'D1');
const LG = (() => { const p = bld({ seed: 4242 }, 'L2'); p.seed = p.cfg.seed; delete (p.cfg as Partial<ProgramCfg>).seed; return p; })();
const runG = (id: string, extra?: Record<string, string>) => ({ run: Object.assign({ id, label: id, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' }, extra || {}) });
const PG = runG('run_pace_goal', { targetMins: '9', targetSecs: '00' });
const T2 = (() => {
  const p = IA0.buildProgram(Object.assign({}, HMF, { seed: 4343, cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true, raceDate: T2_RACE }));
  p.id = 'T2'; p.name = 'T2'; p.startDate = T2_START; p.seed = 4343; delete (p.cfg as Partial<ProgramCfg>).seed; delete p.cfg._testWeek; return p;
})();
const W_P0 = JSON.stringify([cP[0]]);
const ELS = '(function(){var m={};var g=document.getElementById;document.getElementById=function(id){if(!m[id]){m[id]=g(id);m[id].id=id;}return m[id];};globalThis.__els=m;})()';
const TOASTS = 'globalThis.__toasts=[];(function(){var o=showToast;showToast=function(m){__toasts.push(String(m));return o(m);};})()';
const triple = (LS: StorageStub, ev: App['eval']) => ({ ia: LS.getItem('ia_active'), id: ev('activeProgId'), pid: ev('activeProg?activeProg.id:null') });
const holds = (s: Triple) => [s.ia, s.id, s.pid].every(v => v === null) || (s.ia !== null && s.ia === s.id && s.id === s.pid);
const seg = (html: string, id: string) => { const i = html.indexOf('id="pcard_' + id + '"'); if (i < 0) return ''; const j = html.indexOf('id="pcard_', i + 1); return html.slice(i, j < 0 ? html.length : j); };
const ICON = (s: string) => s.replace(/<svg[^>]*>[\s\S]*?<\/svg>/g, '[icon]');
const titles = (o: any) => Object.keys(o || {}).map(k => k + ':' + (o[k] && o[k].title)).join('|');
const assertTriple = (s: Triple, want: string | null, msg: string) => {
  assert.ok(holds(s), msg + ': the three stores agree (' + JSON.stringify(s) + ')');
  assert.equal(s.id, want, msg + ': they name ' + want);
};

// ── the invariant census: every path the athlete can take ────────────────────────────────────────────────────────
function cWorld(json: string, active: string | null) {
  const I = app(), LS = I.localStorage, ev = I.eval;
  LS.setItem('ia_programs', json); if (active === null) LS.removeItem('ia_active'); else LS.setItem('ia_active', active);
  ev('activeProgId=null;activeProg=null;');
  const run = (s: string) => { try { ev(s); return ''; } catch (e) { return /openProg is not defined/.test((e as Error).message) ? 'ABSENT' : 'THREW ' + (e as Error).message; } };
  return { I, LS, ev, run };
}
type World = ReturnType<typeof cWorld>;
const reboot = (w: World) => { w.ev('activeProgId=null;activeProg=null;'); return w.run('init()'); };
const WIZ_CFG = JSON.stringify(Object.assign({}, HMF, { seed: 4242 }));
const CENSUS: [string, string, string, string | null, (w: World) => string, string | null, boolean?][] = [
  ['A01', 'boot with the pointer on a live program loads it', C_JSON, 'P0', w => w.run('init()'), 'P0'],
  ['A02', 'boot with no pointer loads nothing', C_JSON, null, w => w.run('init()'), null],
  ['A03', 'boot with a pointer to a missing program falls back to the first live one and writes it back', C_JSON, 'PX', w => w.run('init()'), 'P0'],
  ['A04', 'boot with a pointer to an archived program falls back to the first live one and writes it back', C_JSON, 'P2', w => w.run('init()'), 'P0'],
  ['A05', 'building a program in the wizard makes it the active one', C_JSON, 'P0', w => { const a = w.run('init()'); w.ev('WD=Object.assign(WD||{},' + WIZ_CFG + ')'); const b = w.run('doGenerate()'); w.I.flushTimers(50); return a + b; }, 'NEW'],
  ['A06', 'Set Active on another program makes it the active one', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P1")'), 'P1'],
  ['A07', 'there is no openProg: the old Open path is gone and nothing moves', C_JSON, 'P0', w => w.run('init()') + w.run('openProg("P1")'), 'P0', true],
  ['A08', 'there is no openProg on an archived program either', C_JSON, 'P0', w => w.run('init()') + w.run('openProg("P2")'), 'P0', true],
  ['A09', 'Set Active on an archived program is refused and nothing moves', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P2")'), 'P0'],
  ['A10', 'archiving the active program hands off to the next live one', C_JSON, 'P0', w => w.run('init()') + w.run('archiveProg("P0")'), 'P1'],
  ['A11', 'deleting the active program hands off to the next live one', C_JSON, 'P0', w => w.run('init()') + w.run('deleteProg("P0")'), 'P1'],
  ['A12', 'archiving the active program with none left clears all three', C_JSON_P1A, 'P0', w => w.run('init()') + w.run('archiveProg("P0")'), null],
  ['A13', 'deleting the active program with none left clears all three', C_JSON_P1A, 'P0', w => w.run('init()') + w.run('deleteProg("P0")'), null],
  ['A14', 'Set Active survives a reboot', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P1")') + reboot(w), 'P1'],
  ['A15', 'a reboot after the absent Open path still names the first program', C_JSON, 'P0', w => { const a = w.run('init()'), b = w.run('openProg("P1")'), c = reboot(w); return a + b + c; }, 'P0', true],
  ['A16', 'Set Active then archiving that program hands back to the other', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P1")') + w.run('archiveProg("P1")'), 'P0'],
  ['A17', 'the absent Open path then archiving the active program hands off to the next', C_JSON, 'P0', w => { const a = w.run('init()'), b = w.run('openProg("P1")'), c = w.run('archiveProg("P0")'); return a + b + c; }, 'P1', true],
];
for (const [key, name, json, active, act, want, absent] of CENSUS) {
  test(name, () => {
    // key: A01..A17
    const w = cWorld(json, active), note = act(w), s = triple(w.LS, w.ev);
    let wantId = want;
    if (want === 'NEW') {
      const ids = JSON.parse(w.LS.getItem('ia_programs') || '[]').map((p: Program) => p.id).filter((x: string) => !/^P[012]$/.test(x));
      assert.equal(ids.length, 1, key + ': one new program stored');
      wantId = ids[0];
    }
    assert.equal(note, absent ? 'ABSENT' : '', key + ': the path ran as expected');
    assertTriple(s, wantId, key);
  });
}

// ── Set Active and the program card ──────────────────────────────────────────────────────────────────────────────
function sWorld() {
  const I = app(), LS = I.localStorage, ev = I.eval, ctx = I.ctx;
  LS.setItem('ia_programs', S_JSON); LS.setItem('ia_active', 'P0'); ev(ELS);
  const calls: string[] = [];
  ['renderProgList', 'renderWeekView', 'showScreen', 'showToast'].forEach(n => {
    const f = ctx[n]; if (typeof f !== 'function') return;
    ctx[n] = function (this: unknown, ...a: unknown[]) { let t = n + '(' + (a.length ? String(a[0]) : '') + ')'; if (n === 'renderWeekView') t += '@' + ev('activeProg?activeProg.id:null'); calls.push(t); return f.apply(this, a); };
  });
  ev('activeProgId=null;activeProg=null;'); ev('init()'); I.flushTimers(20); calls.length = 0;
  const snap = () => JSON.stringify({ ia: LS.getItem('ia_active'), id: ev('activeProgId'), pid: ev('activeProg?activeProg.id:null'), cw: ev('currentWeek'), dk: ev('currentDayKey'), scr: ev('_curScreen'), stored: LS.getItem('ia_programs') });
  return { I, LS, ev, calls, snap };
}
const S1 = (() => {
  const w = sWorld(); w.ev('currentDayKey="mon";showScreen("screenHome")'); w.calls.length = 0; w.ev('setActive("P1")');
  return { s: triple(w.LS, w.ev), dk: w.ev('currentDayKey'), scr: w.ev('_curScreen'), cw: w.ev('currentWeek'), calls: w.calls.slice(), grid: titles(w.ev('activeProg&&activeProg.weeks[currentWeek]')) };
})();

test('Set Active from Home persists and loads the program and clears the open day', () => {
  // S1a
  assert.deepEqual(S1.s, { ia: 'P1', id: 'P1', pid: 'P1' });
  assert.equal(S1.dk, null);
});

test('Set Active lands on This Week, renders the new program and says so once', () => {
  // S1b
  assert.equal(S1.scr, 'screenWeek');
  const iS = S1.calls.indexOf('showScreen(screenWeek)'), iR = S1.calls.indexOf('renderWeekView()@P1');
  assert.ok(iS >= 0 && iR > iS, 'showScreen then renderWeekView with P1 loaded: ' + S1.calls.join(' '));
  assert.equal(S1.calls.filter(x => x === 'showToast(' + T_SET + ')').length, 1);
});

test("Set Active shows the new program's own week at the week today's date falls in", () => {
  // S1c
  const tw = sP[1].totalWeeks || Object.keys(sP[1].weeks).length, wk = DATE_WEEK(START, tw);
  const own = titles(sP[1].weeks[wk]), p0 = titles(sP[0].weeks[wk]);
  assert.equal(S1.cw, wk);
  assert.ok(own !== '' && own !== p0, 'the fixture weeks differ');
  assert.equal(S1.grid, own);
});

for (const [key, name, id, toast] of [
  ['S2', 'Set Active on an archived program says "Restore this program first" once and moves nothing', 'P2', T_RESTORE],
  ['S3', 'Set Active on an unknown id is refused silently and moves nothing', 'PX', null],
] as const) {
  test(name, () => {
    // key: S2, S3
    const w = sWorld(); w.ev('currentWeek=2;currentDayKey="tue";showScreen("screenHome")'); w.calls.length = 0;
    const b = w.snap(); w.ev('setActive(' + JSON.stringify(id) + ')'); const a = w.snap();
    const toasts = w.calls.filter(c => /^showToast/.test(c)), other = w.calls.filter(c => !/^showToast/.test(c));
    assert.equal(a, b, key + ': nothing moved');
    assert.deepEqual(toasts, toast ? ['showToast(' + toast + ')'] : []);
    assert.deepEqual(other, [], key + ': no render');
  });
}

const CARDS = (() => { const w = sWorld(); w.ev('renderProgList()'); return String(w.ev('__els.progList&&__els.progList.innerHTML') || ''); })();
const CODE = stripComments(appScript());

test('the program card has no Open button and the code has no openProg', () => {
  // K1
  assert.ok(CARDS.length > 0);
  assert.ok(!/>Open<\/button>/.test(CARDS));
  assert.ok(!CARDS.includes('openProg('));
  assert.equal((CODE.match(/\bopenProg\b/g) || []).length, 0);
});

test('a program that is not active offers Set Active as its primary button', () => {
  // K2a
  assert.ok(seg(CARDS, 'P1').includes(SET_BTN('P1')));
});

test('the active program keeps its "Active ✓" label and offers no Set Active; the other card has no label', () => {
  // K2b
  const s0 = seg(CARDS, 'P0'), s1 = seg(CARDS, 'P1');
  assert.ok(s0.includes(ACTIVE_LBL));
  assert.ok(!s0.includes("setActive('P0')"));
  assert.ok(!s1.includes(ACTIVE_LBL));
});

// ── copy ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const Y = (() => {
  const I = app(), ev = I.eval; ev(ELS);
  const hm = JSON.parse(JSON.stringify(HMF)), goals = Object.assign({}, hm.cardioGoals || {});
  goals.run = Object.assign({}, goals.run || {}, { label: RUN_L }); goals.bike = Object.assign({}, goals.bike || {}, { label: BIKE_L });
  const cfg = Object.assign({}, hm, { seed: 4242, cardioTypes: ['run', 'bike'], cardioGoals: goals });
  const p = I.buildProgram(cfg); p.id = 'P0'; p.name = 'Prog0'; p.cfg = p.cfg || cfg; p.cfg.cardioTypes = ['run', 'bike']; p.cfg.cardioGoals = goals;
  I.localStorage.setItem('ia_programs', JSON.stringify([p])); I.localStorage.setItem('ia_active', 'P0');
  ev('renderProgList()');
  const meta = (String(ev('__els.progList.innerHTML')).match(/<div class="prog-card-meta">([\s\S]*?)<\/div>/) || [])[1] || '';
  const card = ICON(meta.split('<br>').pop() as string).trim();
  ev('Object.assign(WD,' + JSON.stringify(Object.assign({}, cfg, { primaryPath: 'both', name: 'X', startDate: plusD(7) })) + ");wizardStep=WIZARD_STEPS.indexOf('name');renderWizardStep();");
  const m = String(ev('__els.wizardBody.innerHTML')).match(/<span class="summary-key">Cardio<\/span><span class="summary-val">([\s\S]*?)<\/span><\/div>/);
  return { card, wiz: m ? ICON(m[1]).trim() : 'NOT FOUND' };
})();

test('the card goal line for a run and bike program joins the two goals with a plus, no dash', () => {
  // Y1
  assert.equal(Y.card, EXP_CARD);
});

test('the wizard review line for a run and bike program names each sport, no dash', () => {
  // Y2
  assert.equal(Y.wiz, EXP_WIZ);
});

for (const [key, call] of [['Y3a', 'tabGo("screenWeek")'], ['Y3b', 'openRestSheet(0,"mon","week")'], ['Y3c', 'openOverlaySheet()'],
  ['Y3d', 'openInjurySheet()'], ['Y3e', 'applyInjuryDraft()'], ['Y3f', 'applyOverlayDraft()']]) {
  test('with no active program, ' + call.replace(/\(.*$/, '') + ' says "' + T_GUARD + '"' + (key === 'Y3a' ? ' and stays on Home' : ''), () => {
    // key: Y3a..Y3f
    const I = app(), ev = I.eval;
    ev('globalThis.__t=[];showToast=function(m){globalThis.__t.push(String(m));};activeProg=null;activeProgId=null;');
    const scr0 = ev('_curScreen'); ev(call); const got = ev('globalThis.__t.slice()'), scr = ev('_curScreen');
    assert.deepEqual(Array.from(got), [T_GUARD]);
    if (key === 'Y3a') { assert.equal(scr0, 'screenHome'); assert.equal(scr, 'screenHome'); }
  });
}

test('the old Open copy is gone from the code', () => {
  // Y4a, Y4b
  assert.equal(CODE.split('Open a program').length - 1, 0);
  assert.equal(CODE.split('Open or build').length - 1, 0);
});

// ── boot with a stale pointer ────────────────────────────────────────────────────────────────────────────────────
function bootM(store: Record<string, string>) {
  const I = app(), LS = I.localStorage; LS.clear();
  if (store) for (const [k, v] of Object.entries(store)) LS.setItem(k, v);
  I.eval(ELS); I.eval(TOASTS); I.eval('activeProgId=null;activeProg=null;'); I.eval('init()'); I.flushTimers(30); return I;
}
const bsnap = (I: App) => Object.assign(triple(I.localStorage, I.eval), { scr: I.eval('_curScreen'), cw: I.eval('currentWeek'), dk: I.eval('currentDayKey') });
type Snap = ReturnType<typeof bsnap>;
const BA = (() => {
  const I = bootM({ ia_programs: JSON.stringify([A1]), ia_active: 'A1' }); const out = { s0: bsnap(I) } as { s0: Snap; offers: boolean; label: boolean; t1: string[]; s1: Snap; s2: Snap };
  I.eval("unarchiveProg('A1')"); const sA = seg(String(I.eval('__els.progList&&__els.progList.innerHTML') || ''), 'A1');
  out.offers = sA.includes(SET_BTN('A1')); out.label = sA.includes(ACTIVE_LBL);
  I.eval('__toasts.length=0'); I.eval("tabGo('screenWeek')"); out.t1 = Array.from(I.eval('__toasts.slice()')); out.s1 = bsnap(I);
  I.eval('__toasts.length=0'); I.eval("setActive('A1')"); out.s2 = bsnap(I);
  return out;
})();

test('boot with every program archived and the pointer on one clears the pointer and stays on Home', () => {
  // Ba
  assert.deepEqual([BA.s0.ia, BA.s0.id, BA.s0.pid], [null, null, null]);
  assert.equal(BA.s0.scr, 'screenHome');
});

test('restoring that program offers Set Active and no Active label', () => {
  // Ba2
  assert.ok(BA.offers);
  assert.ok(!BA.label);
});

test('a restored program is not active until Set Active is tapped: This Week stays guarded, then opens on it', () => {
  // Ba3
  assert.equal(BA.s1.scr, 'screenHome');
  assert.equal(BA.s1.pid, null);
  assert.deepEqual(BA.t1, [T_GUARD]);
  assert.equal(BA.s2.scr, 'screenWeek');
  assertTriple(BA.s2, 'A1', 'Ba3');
});

for (const [key, name, st, want, scr] of [
  ['Bb', 'boot with no programs and a pointer to a gone one clears all three and stays on Home', { ia_programs: '[]', ia_active: 'GONE' }, null, 'screenHome'],
  ['Bb2', 'boot with no programs key and a pointer to a gone one clears all three and stays on Home', { ia_active: 'GONE' }, null, 'screenHome'],
  ['Bc', 'boot with a pointer to a deleted program loads the live one and opens This Week', { ia_programs: JSON.stringify([L1P]), ia_active: 'GONE' }, 'L1', 'screenWeek'],
  ['Bd', 'boot with a pointer to an archived program loads the live one and opens This Week', { ia_programs: JSON.stringify([A1, L1P]), ia_active: 'A1' }, 'L1', 'screenWeek'],
  ['Be', 'boot with the pointer on the live program loads it and opens This Week', { ia_programs: JSON.stringify([L1P]), ia_active: 'L1' }, 'L1', 'screenWeek'],
] as const) {
  test(name, () => {
    // key: Bb, Bb2, Bc, Bd, Be
    const s = bsnap(bootM(st));
    assertTriple(s, want, key);
    assert.equal(s.scr, scr);
  });
}

// ── the legacy delete backfill ───────────────────────────────────────────────────────────────────────────────────
for (const [key, name, succ, wantSeed, wantTW] of [
  ['L1', 'deleting the active program keeps a legacy successor\'s seed in storage and makes it active', LG, 4242, undefined],
  ['L2', 'deleting the active program keeps a legacy dated test successor\'s seed and test week in storage', T2, 4343, T2_WEEK],
] as const) {
  test(name, () => {
    // key: L1, L2
    const I = bootM({ ia_programs: JSON.stringify([D1, succ]), ia_active: 'D1' }); I.eval("deleteProg('D1')");
    const st = JSON.parse(I.localStorage.getItem('ia_programs') || '[]').find((x: Program) => x.id === succ.id);
    const c = (st && st.cfg) || {};
    assert.equal(c.seed, wantSeed);
    assert.equal(c._testWeek, wantTW);
    assertTriple(bsnap(I), succ.id, key);
  });
}

// ── the wizard landing ───────────────────────────────────────────────────────────────────────────────────────────
test('building a program in the wizard makes it active, on week 1 of This Week, for six goal shapes', () => {
  // W1
  const WB = (() => { const b: Partial<Cfg> = Object.assign({}, HMF); delete b.raceDate; delete b.cardioGoals; delete b.name; return b; })();
  const ROWS = [
    ['lift only', Object.assign({}, WB, { seed: 5000, cardioTypes: [], cardioGoals: {}, primaryPath: 'lift', eventTargeted: false })],
    ['run_base, start -10d', Object.assign({}, WB, { seed: 5005, cardioTypes: ['run'], cardioGoals: runG('run_base'), eventTargeted: false, startDate: plusD(-10) })],
    ['HALF_MANNY as-is', Object.assign({}, HMF, { seed: 5008 })],
    ['run_half, race +6w', Object.assign({}, WB, { seed: 5020, cardioTypes: ['run'], cardioGoals: runG('run_half'), eventTargeted: true, raceDate: plusD(45) })],
    ['run_pace_goal test +4w, start +10d', Object.assign({}, WB, { seed: 5040, cardioTypes: ['run'], cardioGoals: PG, eventTargeted: true, raceDate: plusD(31), startDate: plusD(10) })],
    ['run_half + bike_base, race +10w', Object.assign({}, WB, { seed: 5045, cardioTypes: ['run', 'bike'], cardioGoals: Object.assign(runG('run_half'), { bike: { id: 'bike_base', label: BIKE_L } }), eventTargeted: true, raceDate: plusD(73) })],
  ] as const;
  for (const [nm, cfg] of ROWS) {
    const I = app(), LS = I.localStorage, ev = I.eval;
    LS.setItem('ia_programs', W_P0); LS.setItem('ia_active', 'P0'); ev('activeProgId=null;activeProg=null;'); ev('init()'); I.flushTimers(20);
    ev('currentDayKey="tue";currentWeek=3;');
    ev('WD=Object.assign(WD||{},' + JSON.stringify(cfg) + ')'); ev('doGenerate()'); I.flushTimers(60);
    const progs = JSON.parse(LS.getItem('ia_programs') || '[]');
    assert.equal(progs.length, 2, nm + ': the new program is stored');
    assertTriple(triple(LS, ev), progs[1].id, nm);
    assert.equal(ev('currentWeek'), 1, nm + ': week 1');
    assert.equal(ev('_curScreen'), 'screenWeek', nm + ': This Week');
  }
});

// ── D238 (P-REMINDSWITCH): a switch marks the new program's past unmarked days as asked ─────────────────────────────
// Oracle, typed by hand: the clock is Sunday 2026-10-11 and both programs start Monday 2026-09-07, so the past is weeks
// 1 to 5 up to Saturday 2026-10-10. A training day is a non-rest day of the stored grid (the program's input, not the
// reminder's reading of it); its date is the start plus (week - 1) * 7 plus its offset in the week.
const RDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const pastTraining = (p: Program) => {
  assert.equal(p.startDate, START);
  assert.equal((p as unknown as { blockOpen?: string }).blockOpen, undefined, p.id + ': no block-open date to exclude');
  const out: string[] = [];
  for (let w = 1; w <= 5; w++) RDAYS.forEach((d, i) => {
    const day = (p.weeks as any)[w] && (p.weeks as any)[w][d];
    if (!day || day.rest) return;
    if (addDays(monOf(START), (w - 1) * 7 + i) < DAY0) out.push('w' + w + '_' + d);
  });
  return out;
};
const P1_PAST = pastTraining(cP[1]);
const asked = (LS: StorageStub, id: string) => { const s = LS.getItem('ia_reminded_' + id); return s === null ? null : Object.keys(JSON.parse(s)).sort(); };

test('the reminder oracle agrees with itself: P1 has past training days in each of weeks 1 to 5, none dated today', () => {
  assert.ok(P1_PAST.length >= 20, String(P1_PAST.length));
  [1, 2, 3, 4, 5].forEach(w => assert.ok(P1_PAST.some(k => k.startsWith('w' + w + '_')), 'week ' + w));
  assert.ok(!P1_PAST.includes('w5_sun'), 'Sunday 2026-10-11 is today, not the past');
});

test('Set Active marks every past unmarked training day of the program it switches to as asked, and writes no record', () => {
  const w = cWorld(C_JSON, 'P0');
  const done = P1_PAST[3], skip = P1_PAST[7];
  const comp = JSON.stringify({ [done]: { title: 'X', ts: 1, status: 'complete' }, [skip]: { title: 'Y', ts: 2, status: 'skipped' } });
  w.LS.setItem('ia_comp_P1', comp);
  assert.equal(w.run('init()'), '');
  assert.equal(w.run('setActive("P1")'), '');
  assert.deepEqual(asked(w.LS, 'P1'), P1_PAST.filter(k => k !== done && k !== skip).sort());
  assert.equal(w.LS.getItem('ia_comp_P1'), comp, 'the record is byte for byte what it was');
  assert.equal(asked(w.LS, 'P0'), null, 'the program switched away from is not touched');
});

test('after Set Active the reminder asks nothing that day, then asks about the first day missed after the switch', () => {
  const w = cWorld(C_JSON, 'P0');
  assert.equal(w.run('init()') + w.run('setActive("P1")'), '');
  assert.equal(w.run('maybeShowReminder()'), '');
  assert.equal(w.LS.getItem('ia_remind_last_P1'), null, 'no reminder on Sunday 2026-10-11');
  pinClock(w.I, new Date(2026, 9, 13, 10, 0, 0));   // Tuesday 2026-10-13: Monday 2026-10-12 (W6 Monday) went unmarked
  assert.equal(w.run('maybeShowReminder()'), '');
  assert.equal(w.LS.getItem('ia_remind_last_P1'), '2026-10-13', 'a reminder on Tuesday');
  assert.deepEqual(asked(w.LS, 'P1'), P1_PAST.concat(['w6_mon']).sort(), 'it asked about Monday, Wk 6');
});

test('archiving the active program marks the past unmarked days of the program it hands active to', () => {
  const w = cWorld(C_JSON, 'P0');
  assert.equal(w.run('init()') + w.run('archiveProg("P0")'), '');
  assertTriple(triple(w.LS, w.ev), 'P1', 'the handoff');
  assert.deepEqual(asked(w.LS, 'P1'), P1_PAST.slice().sort());
});

test('guard, must not change: opening the app marks nothing, and its reminder still asks about the last unmarked day', () => {
  const w = cWorld(C_JSON, 'P0');
  assert.equal(w.run('init()'), '');
  assert.equal(asked(w.LS, 'P0'), null, 'boot marks nothing');
  const last = pastTraining(cP[0]).filter(k => k.startsWith('w5_')).pop();
  assert.equal(last, 'w5_sat', 'Saturday 2026-10-10 is P0\'s last training day before today');
  assert.equal(w.run('maybeShowReminder()'), '');
  assert.deepEqual(asked(w.LS, 'P0'), ['w5_sat']);
});

test('guard, must not change: Set Active on an archived program is refused and marks nothing', () => {
  const w = cWorld(C_JSON, 'P0');
  assert.equal(w.run('init()') + w.run('setActive("P2")'), '');
  assert.equal(asked(w.LS, 'P2'), null);
  assert.equal(asked(w.LS, 'P0'), null);
});

// ── D240 (P-REMINDGAP): the reminder never reaches back past a day the athlete marked ──────────────────────────────
// Oracle, typed by hand: P0 is the program already active (no switch). The clock is Sunday 2026-10-11, so week 5 is
// Monday 2026-10-05 to Saturday 2026-10-10; HALF_MANNY rests Wednesday and Sunday, so its week 5 training days are
// Monday, Tuesday, Thursday, Friday and Saturday.
const P0_PAST = pastTraining(cP[0]);
const markAll = (keys: string[]) => JSON.stringify(Object.fromEntries(keys.map(k => [k, { title: 'X', ts: 1, status: 'complete' }])));
const P0_W1_4 = P0_PAST.filter(k => !k.startsWith('w5_'));
function gapWorld(marked: string[]) {
  const w = cWorld(W_P0, 'P0');
  w.LS.setItem('ia_comp_P0', markAll(marked));
  assert.equal(w.run('init()'), '');
  return w;
}

test('the reminder oracle agrees with itself: P0 trains Monday, Tuesday, Thursday, Friday and Saturday of week 5', () => {
  assert.deepEqual(P0_PAST.filter(k => k.startsWith('w5_')), ['w5_mon', 'w5_tue', 'w5_thu', 'w5_fri', 'w5_sat']);
});

test('the reminder stops at the last marked day: a gap behind it is never asked about', () => {
  // Friday marked, Saturday not: it asks about Saturday, the newest unmarked day after the mark
  const a = gapWorld(P0_W1_4.concat(['w5_fri']));
  assert.equal(a.run('maybeShowReminder()'), '');
  assert.deepEqual(asked(a.LS, 'P0'), ['w5_sat']);
  // Friday and Saturday marked, Monday to Thursday not: nothing to ask (before D240 it asked about Thursday, Wk 5)
  const b = gapWorld(P0_W1_4.concat(['w5_fri', 'w5_sat']));
  assert.equal(b.run('maybeShowReminder()'), '');
  assert.equal(b.LS.getItem('ia_remind_last_P0'), null, 'no reminder');
  assert.equal(asked(b.LS, 'P0'), null, 'nothing asked');
});

test('guard, must not change: within an unmarked stretch the reminder still asks newest first, once a day', () => {
  const w = gapWorld(P0_W1_4);
  assert.equal(w.run('maybeShowReminder()'), '');
  assert.deepEqual(asked(w.LS, 'P0'), ['w5_sat'], 'Sunday 2026-10-11 asks about Saturday, Wk 5');
  assert.equal(w.run('maybeShowReminder()'), '');
  assert.deepEqual(asked(w.LS, 'P0'), ['w5_sat'], 'once a day');
  pinClock(w.I, new Date(2026, 9, 12, 10, 0, 0));
  assert.equal(w.run('maybeShowReminder()'), '');
  assert.deepEqual(asked(w.LS, 'P0'), ['w5_fri', 'w5_sat'], 'Monday 2026-10-12 asks about Friday, Wk 5');
});
