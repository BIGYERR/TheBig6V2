// g221_d178_active.js — GATE for D178 (P-ACTIVE): one program is active, one place says so, one button makes it so.
//
//   node tests/gates/g221_d178_active.js <candidate.html> [baseline_V220.html]
//   IA_ASSUME_VERSION=221 node tests/gates/g221_d178_active.js <tree stamped 220> [baseline_V220.html]   (pre-bump dev only)
//
// THE RULING THIS DEFENDS: tests/measure/v221_rulings/p_active_ruling.md: Mario's calls 1 to 5, "What changes",
// "Before / After", MARIO DECISION (2026-09-24), AMENDMENT ON V220 (stale Open copy), RE-RULING ON V220 sections 3 to 5,
// MARIO DECISION ON P-BLOCKOPEN. D-code D178, ships on ia-version 221. D180 (the blockOpen copy-back) is NOT gated
// here: no row reads blockOpen, and the wizard identity row drops it from both sides.
//
// ORACLE. Hand-typed, never asked of the engine:
//   INVARIANT    the ruling's own sentence: localStorage.ia_active === activeProgId === activeProg.id, or all null,
//                after every path. Each census path also names the id it must land on, typed from the after-grid
//                ("setActive(P1): ... P1", "reboot after: P1", "setActive(P2 archived): refused ... nothing moves",
//                "openProg: absent") and the V156 handoff rule (the first non-archived program, or none).
//   COPY         T_GUARD, T_RESTORE, T_SET, EXP_CARD, EXP_WIZ and the Set Active button markup, typed from the ruling.
//   DATES        the week a switch lands on and the stored test week are local date math on the fixture's start.
//   IDENTITY     rows that say "my build changed nothing here" take V220 (proven equal to itself first) as the oracle.
// OBSERVATION is the live path inside the harness VM: init, setActive, archiveProg, deleteProg, unarchiveProg, tabGo,
// doGenerate, renderProgList, renderWizardStep and the six guarded functions.
//
// VERSION PREDICATE (standing rulings 2 and 4). D178 ships at 221.
//   below 221      REFUSED, every assertion row FAILS by name.
//   221 and up     hand rows (A S K Y B L W1) assert.
//   pair rows      Bnp W2 W3 H1 to H4 assert only on D178's build pair: candidate 221 against baseline 220 (argv[3] when
//                  it reads 220, else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS. M1 asserts on 221
//                  only (standing ruling 5, no era row).
//   IA_ASSUME_VERSION=221 lifts a file stamped 220 to 221 for a pre-bump development run. It is announced, and it is
//   ignored on any file not stamped exactly 220. gate.sh never sets it.
//
// ROWS
//   A01..A17  invariant census, the measure's 17 paths (tests/measure/v221_rebase_active.js PART B): the three stores
//             agree and name the ruled id; the four openProg paths find openProg ABSENT.
//   S1a/b/c   setActive(P1): persisted and loaded (a); lands on screenWeek, renders with P1 loaded, toast (b); This Week
//             is P1's grid at the date-math week (c).   S2 setActive(archived): the exact toast, nothing moves.
//             S3 setActive(unknown id): refused silently, nothing moves.
//   K1        no Open button on the rendered card, no openProg token in comment-stripped code.
//   K2a/b     the non-active card offers Set Active as primary; the active card keeps its "Active ✓" label.
//   Y1/Y2     card goal line and wizard review line for a run + bike program.   Y3a..f the six guards print T_GUARD.
//   Y4a/b     comment-stripped code: 'Open a program' 0, 'Open or build' 0.
//   Ba..Be    boot with a stale pointer (re-ruling 3): a cleared, Home; a2 unarchive offers Set Active; a3 This Week
//             guarded until tapped; b and b2 all null; c and d fall back and write back; e control.
//   Bnp       (pair) no pointer: storage, globals, screen, toasts identical to V220.
//   L1/L2     legacy-delete backfill survives in storage (re-ruling 4): seed 4242; seed 4343 with the test week.
//   W1        wizard commit: the invariant names the new program, week 1, screenWeek.
//   W2/W3     (pair) wizard landing (screen, week, render order) and the loaded program (overlays normalised,
//             blockOpen dropped, clock and id fields stripped) identical to V220.
//   H1..H4    (pair) archive and delete of the active program, next arm and null arm: landing, calls, stored programs
//             and the reboot after identical to V220. The invariant for these four paths is A10..A13.
//   M1        HALF_MANNY digest 0ac7da6b1691a8e1 on the candidate, self-stable.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';
const MANNY = '0ac7da6b1691a8e1';
let pass = 0, fail = 0, skip = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };
const done = () => { console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
const T_GUARD = 'No active program. Tap Set Active or build a new one.';   // AMENDMENT, ruling 2
const T_RESTORE = 'Restore this program first';                            // Mario's call 3
const T_SET = 'Active program updated';                                    // "toast ... stays"
const RUN_L = 'Hit a Pace / Time Goal', BIKE_L = 'Build Cycling Base';    // Mario's call 5, the ruling's example
const EXP_CARD = '[icon] ' + RUN_L + ' + [icon] ' + BIKE_L;
const EXP_WIZ = '[icon] Run: ' + RUN_L + ' + [icon] Bike: ' + BIKE_L;
const SET_BTN = id => '<button class="prog-action-btn primary" onclick="setActive(\'' + id + '\')">Set Active</button>';
const ACTIVE_LBL = '>Active ✓</button>';
const GONE = [['Y4a', 'Open a program'], ['Y4b', 'Open or build']];
const GUARDS = [['Y3a', 'tabGo("screenWeek")'], ['Y3b', 'openRestSheet(0,"mon","week")'], ['Y3c', 'openOverlaySheet()'],
  ['Y3d', 'openInjurySheet()'], ['Y3e', 'applyInjuryDraft()'], ['Y3f', 'applyOverlayDraft()']];
const START = '2026-09-07';   // a Monday; every fixture program starts here unless named otherwise
// local date math
const pad = n => String(n).padStart(2, '0');
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monOf = s => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
const dayDiff = (a, b) => Math.round((a - b) / 86400000);
const DATE_WEEK = (startIso, tw) => { const diff = dayDiff(TODAY, monOf(startIso)); return diff < 0 ? 1 : Math.min(tw, Math.floor(diff / 7) + 1); };
const MON_NOW = monOf(iso(TODAY));
const T2_START = iso(MON_NOW), T2_RACE = iso(addDays(MON_NOW, 43));        // the test sits on Tuesday of week 7, any weekday
const T2_WEEK = Math.floor(dayDiff(monOf(T2_RACE), monOf(T2_START)) / 7) + 1;
const plusD = n => iso(addDays(TODAY, n));

// comment stripper: lifted verbatim from tests/gates/g220_d173_recovbanner.js
const BS = String.fromCharCode(92);
function stripComments(src){
  const out = [], n = src.length, tpl = [];
  let i = 0, depth = 0, prevSig = '', prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return','typeof','case','do','else','in','of','new','delete','void','throw','instanceof','yield','await']);
  const readTemplate = () => {
    while(i < n){ const c = src[i];
      if(c === BS){ out.push(src.substr(i, 2)); i += 2; continue; }
      if(c === '`'){ out.push(c); i++; return; }
      if(c === '$' && src[i + 1] === '{'){ out.push('${'); i += 2; tpl.push(depth); depth++; return; }
      out.push(c); i++; } };
  while(i < n){
    const c = src[i], d = src[i + 1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; out.push(' '); continue; }
    if(c === "'" || c === '"'){ let j = i + 1; while(j < n && src[j] !== c && src[j] !== '\n'){ if(src[j] === BS) j++; j++; }
      out.push(src.slice(i, j + 1)); i = j + 1; prevSig = c; prevWord = ''; continue; }
    if(c === '`'){ out.push(c); i++; readTemplate(); prevSig = '`'; prevWord = ''; continue; }
    if(c === '{'){ depth++; out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if(c === '}'){ depth--; out.push(c); i++; prevWord = '';
      if(tpl.length && tpl[tpl.length - 1] === depth){ tpl.pop(); readTemplate(); prevSig = '`'; } else prevSig = '}'; continue; }
    if(c === '/'){
      if(prevSig === '' || prevSig === '}' || RX_PREV.has(prevSig) || RX_WORDS.has(prevWord)){
        let j = i + 1, cls = false;
        while(j < n && src[j] !== '\n'){ const x = src[j]; if(x === BS){ j += 2; continue; }
          if(cls){ if(x === ']') cls = false; } else if(x === '[') cls = true; else if(x === '/') break; j++; }
        j++; while(j < n && /[a-z]/i.test(src[j])) j++;
        out.push(src.slice(i, j)); i = j; prevSig = 'r'; prevWord = ''; continue; }
      out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if(/[A-Za-z0-9_$]/.test(c)){ let j = i; while(j < n && /[A-Za-z0-9_$]/.test(src[j])) j++; const w = src.slice(i, j);
      out.push(w); i = j; prevWord = w; prevSig = 'w'; continue; }
    out.push(c); i++; if(!/\s/.test(c)){ prevSig = c; prevWord = ''; }
  }
  return out.join('');
}

// ── ROWS (static, so a refused era fails every one by name) ──────────────────
const R = {
  A01:'A01 census boot, ia_active=P0 live: the three stores name P0',
  A02:'A02 census boot, ia_active missing: all null',
  A03:'A03 census boot, ia_active=PX stale: the fallback P0 is loaded and written back',
  A04:'A04 census boot, ia_active=P2 archived: the fallback P0 is loaded and written back',
  A05:'A05 census wizard commit (doGenerate, flushed): the three stores name the new program',
  A06:'A06 census setActive(P1): the three stores name P1',
  A07:'A07 census openProg(P1): ABSENT, the three stores still name P0',
  A08:'A08 census openProg(P2 archived): ABSENT, the three stores still name P0',
  A09:'A09 census setActive(P2 archived): refused, the three stores still name P0',
  A10:'A10 census archive active P0: handoff, the three stores name P1',
  A11:'A11 census delete active P0: handoff, the three stores name P1',
  A12:'A12 census archive active P0, none left (null arm): all null',
  A13:'A13 census delete active P0, none left (null arm): all null',
  A14:'A14 census setActive(P1) then reboot: the three stores name P1',
  A15:'A15 census openProg(P1) ABSENT, then reboot: the three stores name P0',
  A16:'A16 census setActive(P1) then archive P1: handoff, the three stores name P0',
  A17:'A17 census openProg(P1) ABSENT, then archive P0: handoff, the three stores name P1',
  S1a:'S1a setActive(P1) from Home: ia_active, activeProgId and activeProg.id are P1, currentDayKey null',
  S1b:'S1b setActive(P1) lands on screenWeek: showScreen(screenWeek), renderWeekView with P1 loaded, toast "' + T_SET + '" once',
  S1c:'S1c setActive(P1): This Week is P1\'s stored grid (not P0\'s) at the date-math week',
  S2:'S2 setActive(P2 archived): exactly one toast "' + T_RESTORE + '", nothing moves (stores, week, day, screen, stored programs), no render',
  S3:'S3 setActive(PX unknown): refused silently, no toast, nothing moves, no render',
  K1:'K1 card: no Open button rendered, no openProg token in comment-stripped code',
  K2a:'K2a card: the non-active program offers `' + SET_BTN('P1') + '`',
  K2b:'K2b card: the active program keeps its "Active ✓" label and offers no Set Active; the other card carries no label',
  Y1:'Y1 card goal line, run + bike: `' + EXP_CARD + '`',
  Y2:'Y2 wizard review line, run + bike: `' + EXP_WIZ + '`',
  Y3a:'Y3a tabGo("screenWeek") with no active program prints "' + T_GUARD + '" and stays on Home',
  Y3b:'Y3b openRestSheet with no active program prints "' + T_GUARD + '"',
  Y3c:'Y3c openOverlaySheet with no active program prints "' + T_GUARD + '"',
  Y3d:'Y3d openInjurySheet with no active program prints "' + T_GUARD + '"',
  Y3e:'Y3e applyInjuryDraft with no active program prints "' + T_GUARD + '"',
  Y3f:'Y3f applyOverlayDraft with no active program prints "' + T_GUARD + '"',
  Y4a:"Y4a comment-stripped code: 'Open a program' 0",
  Y4b:"Y4b comment-stripped code: 'Open or build' 0",
  Ba:'Ba boot (a) all archived, ia_active=A1: ia_active cleared, all null, Home',
  Ba2:'Ba2 boot (a) then unarchive A1: the card offers Set Active, no Active label',
  Ba3:'Ba3 boot (a) then unarchive A1: This Week guarded (Home, "' + T_GUARD + '") until Set Active is tapped, then screenWeek on A1',
  Bb:'Bb boot (b) programs empty, ia_active=GONE: all null, Home',
  Bb2:'Bb2 boot (b2) programs key missing, ia_active=GONE: all null, Home',
  Bc:'Bc boot (c) ia_active deleted, live L1: the three stores name L1, screenWeek',
  Bd:'Bd boot (d) ia_active archived, live L1: the three stores name L1, screenWeek',
  Be:'Be boot (e) control ia_active=L1: the three stores name L1, screenWeek',
  Bnp:'Bnp (pair) boot with no pointer (live, empty, no key, all archived): storage, globals, screen, toasts identical to V220',
  L1:'L1 deleteProg with a legacy successor (cfg.seed missing, prog.seed 4242): stored cfg.seed 4242 survives, successor active',
  L2:'L2 deleteProg with a legacy dated test successor (seed 4343, no _testWeek): stored cfg.seed 4343 and _testWeek ' + T2_WEEK + ' survive, successor active',
  W1:'W1 wizard commit, 6 goal shapes: the three stores name the new program, currentWeek 1, screenWeek',
  W2:'W2 (pair) wizard landing, 6 goal shapes: screen, currentWeek and showScreen/renderWeekView/renderProgList order identical to V220',
  W3:'W3 (pair) wizard landing, 6 goal shapes: the loaded program identical to V220 (overlays normalised, blockOpen dropped, clock and id fields stripped)',
  H1:'H1 (pair) archive active P0, next arm: landing, calls, stored programs and reboot identical to V220',
  H2:'H2 (pair) delete active P0, next arm: landing, calls, stored programs and reboot identical to V220',
  H3:'H3 (pair) archive active P0, null arm: landing, calls, stored programs and reboot identical to V220',
  H4:'H4 (pair) delete active P0, null arm: landing, calls, stored programs and reboot identical to V220',
  M1:'M1 HALF_MANNY digest ' + MANNY + ' on the candidate, self-stable (no era row)',
};
const PAIR_ROWS = ['Bnp', 'W2', 'W3', 'H1', 'H2', 'H3', 'H4'];

// ── RUN ──────────────────────────────────────────────────────────────────────
const t0 = Date.now();
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a pre-bump development run, not a ship proof');
}
console.log('g221 D178 | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D178 P-ACTIVE (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
let BASEART = null, baseWhy = '', TMP = null;
if(VER === ERA){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) BASEART = BASEFILE; else baseWhy = 'argv[3] reads ' + b.version + '; '; }
    if(!BASEART){
      TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g221d178-')); const f = path.join(TMP, 'v220.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V220_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      const b = load(f);
      if(+b.version === BASE_ERA){ BASEART = f; baseWhy += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else baseWhy += 'git reads ' + b.version;
    }
  } catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); BASEART = null; }
}
const PAIR = VER === ERA && !!BASEART;
console.log('  pair rows: ' + (PAIR ? 'LIVE (candidate ' + VER + ' vs V' + BASE_ERA + (baseWhy ? ', ' + baseWhy : ', argv[3]') + ')' : VER === ERA ? 'SETUP FAILED (' + baseWhy + ')' : 'scoped out (candidate ' + VER + ' is not D178\'s pair)'));
const safe = fn => { try { return fn(); } catch(e){ return [false, 'threw ' + (e && e.message)]; } };
const row = (key, fn) => { const r = safe(fn); ok(R[key], r[0], r[0] ? undefined : r[1]); };
const pairRow = (key, fn) => {
  if(PAIR) return row(key, fn);
  if(VER === ERA) return ok(R[key] + ' (setup: ' + baseWhy + ')', false);
  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D178's build pair (221 vs 220)");
};

// ── FIXTURES (built once on the candidate; the same bytes go to V220 in every pair row) ──
const HMF = IA.fixtures.HALF_MANNY;
const bld = (over, id, extra) => { const p = IA.buildProgram(Object.assign({}, HMF, over)); p.id = id; p.name = id; p.startDate = START; return Object.assign(p, extra || {}); };
const LIFT = { cardioTypes:[], cardioGoals:{}, eventTargeted:false, primaryPath:'lift', raceDate:undefined };
const cP = [bld({ seed:1000 }, 'P0'), bld({ seed:1001 }, 'P1'), bld({ seed:1002 }, 'P2', { archived:true })];   // the measure's census world
const C_JSON = JSON.stringify(cP), C_JSON_P1A = JSON.stringify(cP.map(p => p.id === 'P1' ? Object.assign({}, p, { archived:true }) : p));
const sP = [cP[0], bld(Object.assign({ seed:1001 }, LIFT), 'P1'), cP[2]];                                        // P1 lift only: its grid differs from P0's
const S_JSON = JSON.stringify(sP);
const A1 = bld({ seed:4242 }, 'A1', { archived:true, archivedAt:1 }), L1P = bld({ seed:4242 }, 'L1'), D1 = bld({ seed:4242 }, 'D1');
const LG = (() => { const p = bld({ seed:4242 }, 'L2'); p.seed = p.cfg.seed; delete p.cfg.seed; return p; })();
const runG = (id, extra) => ({ run:Object.assign({ id, label:id, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' }, extra || {}) });
const PG = runG('run_pace_goal', { targetMins:'9', targetSecs:'00' });
const T2 = (() => { const p = IA.buildProgram(Object.assign({}, HMF, { seed:4343, cardioTypes:['run'], cardioGoals:PG, eventTargeted:true, raceDate:T2_RACE }));
  p.id = 'T2'; p.name = 'T2'; p.startDate = T2_START; p.seed = 4343; delete p.cfg.seed; delete p.cfg._testWeek; return p; })();
const W_P0 = JSON.stringify([cP[0]]);
const ELS = '(function(){var m={};var g=document.getElementById;document.getElementById=function(id){if(!m[id]){m[id]=g(id);m[id].id=id;}return m[id];};globalThis.__els=m;})()';
const TOASTS = 'globalThis.__toasts=[];(function(){var o=showToast;showToast=function(m){__toasts.push(String(m));return o(m);};})()';
const triple = (LS, ev) => ({ ia:LS.getItem('ia_active'), id:ev('activeProgId'), pid:ev('activeProg?activeProg.id:null') });
const holds = s => [s.ia, s.id, s.pid].every(v => v === null) || (s.ia !== null && s.ia === s.id && s.id === s.pid);
const tstr = s => 'ia_active=' + s.ia + ' activeProgId=' + s.id + ' activeProg.id=' + s.pid;
const STRIPK = /^(id|created|createdAt|ts|archivedAt)$/;
const canon = o => JSON.stringify(o, (k, v) => STRIPK.test(k) ? undefined : (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const normP = o => { const q = JSON.parse(JSON.stringify(o)); if(!Array.isArray(q.overlays)) q.overlays = []; delete q.blockOpen; return canon(q); };
const lsDump = I => JSON.stringify([...I.localStorage._map.entries()].sort());
const seg = (html, id) => { const i = html.indexOf('id="pcard_' + id + '"'); if(i < 0) return ''; const j = html.indexOf('id="pcard_', i + 1); return html.slice(i, j < 0 ? html.length : j); };
const ICON = s => s.replace(/<svg[^>]*>[\s\S]*?<\/svg>/g, '[icon]');
const titles = o => Object.keys(o || {}).map(k => k + ':' + (o[k] && o[k].title)).join('|');

// ── A: invariant census, the measure's 17 paths ─────────────────────────────
function cWorld(art, json, active){
  const I = load(art), LS = I.localStorage, ev = I.eval;
  LS.setItem('ia_programs', json); if(active === null) LS.removeItem('ia_active'); else LS.setItem('ia_active', active);
  ev('activeProgId=null;activeProg=null;');
  const run = s => { try { ev(s); return ''; } catch(e){ return /openProg is not defined/.test(e.message) ? 'ABSENT' : 'THREW ' + e.message; } };
  return { I, LS, ev, run };
}
const reboot = w => { w.ev('activeProgId=null;activeProg=null;'); return w.run('init()'); };
const WIZ_CFG = JSON.stringify(Object.assign({}, HMF, { seed:4242 }));
const CENSUS = [
  ['A01', C_JSON, 'P0', w => w.run('init()'), 'P0'],
  ['A02', C_JSON, null, w => w.run('init()'), null],
  ['A03', C_JSON, 'PX', w => w.run('init()'), 'P0'],
  ['A04', C_JSON, 'P2', w => w.run('init()'), 'P0'],
  ['A05', C_JSON, 'P0', w => { const a = w.run('init()'); w.ev('WD=Object.assign(WD||{},' + WIZ_CFG + ')'); const b = w.run('doGenerate()'); w.I.flushTimers(50); return a + b; }, 'NEW'],
  ['A06', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P1")'), 'P1'],
  ['A07', C_JSON, 'P0', w => w.run('init()') + w.run('openProg("P1")'), 'P0', true],
  ['A08', C_JSON, 'P0', w => w.run('init()') + w.run('openProg("P2")'), 'P0', true],
  ['A09', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P2")'), 'P0'],
  ['A10', C_JSON, 'P0', w => w.run('init()') + w.run('archiveProg("P0")'), 'P1'],
  ['A11', C_JSON, 'P0', w => w.run('init()') + w.run('deleteProg("P0")'), 'P1'],
  ['A12', C_JSON_P1A, 'P0', w => w.run('init()') + w.run('archiveProg("P0")'), null],
  ['A13', C_JSON_P1A, 'P0', w => w.run('init()') + w.run('deleteProg("P0")'), null],
  ['A14', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P1")') + reboot(w), 'P1'],
  ['A15', C_JSON, 'P0', w => { const a = w.run('init()'), b = w.run('openProg("P1")'), c = reboot(w); return a + b + c; }, 'P0', true],
  ['A16', C_JSON, 'P0', w => w.run('init()') + w.run('setActive("P1")') + w.run('archiveProg("P1")'), 'P0'],
  ['A17', C_JSON, 'P0', w => { const a = w.run('init()'), b = w.run('openProg("P1")'), c = w.run('archiveProg("P0")'); return a + b + c; }, 'P1', true],
];
for(const [key, json, active, act, want, absent] of CENSUS) row(key, () => {
  const w = cWorld(ART, json, active), note = act(w), s = triple(w.LS, w.ev);
  let wantId = want;
  if(want === 'NEW'){ const ids = JSON.parse(w.LS.getItem('ia_programs') || '[]').map(p => p.id).filter(x => !/^P[012]$/.test(x)); wantId = ids.length === 1 ? ids[0] : '(no new program stored)'; }
  const noteOk = absent ? note === 'ABSENT' : note === '';
  return [noteOk && holds(s) && s.id === wantId, 'note ' + (note || '-') + ', ' + tstr(s) + ', want ' + wantId];
});

// ── S / K: setActive and the card ───────────────────────────────────────────
function sWorld(art){
  const I = load(art), LS = I.localStorage, ev = I.eval, ctx = I.ctx;
  LS.setItem('ia_programs', S_JSON); LS.setItem('ia_active', 'P0'); ev(ELS);
  const calls = [];
  ['renderProgList', 'renderWeekView', 'showScreen', 'showToast'].forEach(n => { const f = ctx[n]; if(typeof f !== 'function') return;
    ctx[n] = function(...a){ let t = n + '(' + (a.length ? String(a[0]) : '') + ')'; if(n === 'renderWeekView') t += '@' + ev('activeProg?activeProg.id:null'); calls.push(t); return f.apply(this, a); }; });
  ev('activeProgId=null;activeProg=null;'); ev('init()'); I.flushTimers(20); calls.length = 0;
  const snap = () => JSON.stringify({ ia:LS.getItem('ia_active'), id:ev('activeProgId'), pid:ev('activeProg?activeProg.id:null'), cw:ev('currentWeek'), dk:ev('currentDayKey'), scr:ev('_curScreen'), stored:LS.getItem('ia_programs') });
  return { I, LS, ev, calls, snap };
}
{
  let S1 = null;
  try {
    const w = sWorld(ART); w.ev('currentDayKey="mon";showScreen("screenHome")'); w.calls.length = 0; w.ev('setActive("P1")');
    const cw = w.ev('currentWeek');
    S1 = { s:triple(w.LS, w.ev), dk:w.ev('currentDayKey'), scr:w.ev('_curScreen'), cw, calls:w.calls.slice(), grid:titles(w.ev('activeProg&&activeProg.weeks[currentWeek]')) };
  } catch(e){ S1 = { err:e.message }; }
  const has = () => S1 && !S1.err;
  row('S1a', () => [has() && S1.s.ia === 'P1' && S1.s.id === 'P1' && S1.s.pid === 'P1' && S1.dk === null, S1.err || tstr(S1.s) + ' currentDayKey=' + S1.dk]);
  row('S1b', () => {
    if(!has()) return [false, S1.err];
    const c = S1.calls, iS = c.indexOf('showScreen(screenWeek)'), iR = c.indexOf('renderWeekView()@P1');
    return [S1.scr === 'screenWeek' && iS >= 0 && iR > iS && c.filter(x => x === 'showToast(' + T_SET + ')').length === 1, 'screen ' + S1.scr + ', calls ' + c.join(' ')];
  });
  row('S1c', () => {
    if(!has()) return [false, S1.err];
    const tw = sP[1].totalWeeks || Object.keys(sP[1].weeks).length, wk = DATE_WEEK(START, tw);
    const own = titles(sP[1].weeks[wk]), p0 = titles(sP[0].weeks[wk]);
    return [S1.cw === wk && own !== '' && own !== p0 && S1.grid === own, 'currentWeek ' + S1.cw + ' vs date math ' + wk + '; grid ' + S1.grid.slice(0, 90) + ' | P1 ' + own.slice(0, 90)];
  });
  for(const [key, id, toast] of [['S2', 'P2', T_RESTORE], ['S3', 'PX', null]]) row(key, () => {
    const w = sWorld(ART); w.ev('currentWeek=2;currentDayKey="tue";showScreen("screenHome")'); w.calls.length = 0;
    const b = w.snap(); w.ev('setActive(' + JSON.stringify(id) + ')'); const a = w.snap();
    const toasts = w.calls.filter(c => /^showToast/.test(c)), other = w.calls.filter(c => !/^showToast/.test(c));
    const tOk = toast ? toasts.length === 1 && toasts[0] === 'showToast(' + toast + ')' : toasts.length === 0;
    return [a === b && tOk && !other.length, (a === b ? 'nothing moved' : 'moved: ' + a.slice(0, 160)) + '; calls ' + w.calls.join(' ')];
  });
  let K = null;
  try { const w = sWorld(ART); w.ev('renderProgList()'); K = { html:String(w.ev('__els.progList&&__els.progList.innerHTML') || '') }; } catch(e){ K = { err:e.message, html:'' }; }
  row('K1', () => {
    const code = stripComments(IA.js), n = (code.match(/\bopenProg\b/g) || []).length;
    const btn = />Open<\/button>/.test(K.html), h = K.html.indexOf('openProg(') >= 0;
    return [!K.err && K.html.length > 0 && !btn && !h && n === 0, (K.err || '') + ' Open button ' + btn + ', openProg( in card ' + h + ', openProg tokens in code ' + n];
  });
  row('K2a', () => { const s1 = seg(K.html, 'P1'); return [s1.indexOf(SET_BTN('P1')) >= 0, (K.err || '') + (s1.match(/<button[^>]*setActive[^<]*<\/button>/) || ['no Set Active button'])[0]]; });
  row('K2b', () => { const s0 = seg(K.html, 'P0'), s1 = seg(K.html, 'P1');
    return [s0.indexOf(ACTIVE_LBL) >= 0 && s0.indexOf("setActive('P0')") < 0 && s1.indexOf(ACTIVE_LBL) < 0, 'P0 label ' + (s0.indexOf(ACTIVE_LBL) >= 0) + ', P0 Set Active ' + (s0.indexOf("setActive('P0')") >= 0) + ', P1 label ' + (s1.indexOf(ACTIVE_LBL) >= 0)]; });
}

// ── Y: copy ─────────────────────────────────────────────────────────────────
{
  let Y = null;
  try {
    const I = load(ART), ev = I.eval; ev(ELS);
    const hm = JSON.parse(JSON.stringify(HMF)), goals = Object.assign({}, hm.cardioGoals || {});
    goals.run = Object.assign({}, goals.run || {}, { label:RUN_L }); goals.bike = Object.assign({}, goals.bike || {}, { label:BIKE_L });
    const cfg = Object.assign({}, hm, { seed:4242, cardioTypes:['run', 'bike'], cardioGoals:goals });
    const p = I.buildProgram(cfg); p.id = 'P0'; p.name = 'Prog0'; p.cfg = p.cfg || cfg; p.cfg.cardioTypes = ['run', 'bike']; p.cfg.cardioGoals = goals;
    I.localStorage.setItem('ia_programs', JSON.stringify([p])); I.localStorage.setItem('ia_active', 'P0');
    ev('renderProgList()');
    const meta = (String(ev('__els.progList.innerHTML')).match(/<div class="prog-card-meta">([\s\S]*?)<\/div>/) || [])[1] || '';
    const card = ICON(meta.split('<br>').pop()).trim();
    ev('Object.assign(WD,' + JSON.stringify(Object.assign({}, cfg, { primaryPath:'both', name:'X', startDate:plusD(7) })) + ");wizardStep=WIZARD_STEPS.indexOf('name');renderWizardStep();");
    const m = String(ev('__els.wizardBody.innerHTML')).match(/<span class="summary-key">Cardio<\/span><span class="summary-val">([\s\S]*?)<\/span><\/div>/);
    Y = { card, wiz:m ? ICON(m[1]).trim() : 'NOT FOUND' };
  } catch(e){ Y = { card:'THREW ' + e.message, wiz:'THREW ' + e.message }; }
  row('Y1', () => [Y.card === EXP_CARD, JSON.stringify(Y.card)]);
  row('Y2', () => [Y.wiz === EXP_WIZ, JSON.stringify(Y.wiz)]);
  for(const [key, call] of GUARDS) row(key, () => {
    const I = load(ART), ev = I.eval;
    ev('globalThis.__t=[];showToast=function(m){globalThis.__t.push(String(m));};activeProg=null;activeProgId=null;');
    const scr0 = ev('_curScreen'); ev(call); const got = ev('globalThis.__t.slice()'), scr = ev('_curScreen');
    return [got.length === 1 && got[0] === T_GUARD && (key !== 'Y3a' || (scr === scr0 && scr0 === 'screenHome')), JSON.stringify(got) + ' screen ' + scr0 + '->' + scr];
  });
  const code = stripComments(IA.js);
  for(const [key, tok] of GONE) row(key, () => { const n = code.split(tok).length - 1; return [n === 0, n]; });
}

// ── B: boot with a stale pointer (re-ruling 3), and no pointer ──────────────
function bootM(art, store){
  const I = load(art), LS = I.localStorage; LS.clear();
  if(store) for(const [k, v] of Object.entries(store)) LS.setItem(k, v);
  I.eval(ELS); I.eval(TOASTS); I.eval('activeProgId=null;activeProg=null;'); I.eval('init()'); I.flushTimers(30); return I;
}
const bsnap = I => { const s = triple(I.localStorage, I.eval); return Object.assign(s, { scr:I.eval('_curScreen'), cw:I.eval('currentWeek'), dk:I.eval('currentDayKey') }); };
const bstr = s => tstr(s) + ' screen=' + s.scr;
{
  let BA = null;
  try {
    const I = bootM(ART, { ia_programs:JSON.stringify([A1]), ia_active:'A1' }); BA = { s0:bsnap(I) };
    I.eval("unarchiveProg('A1')"); const html = String(I.eval('__els.progList&&__els.progList.innerHTML') || ''), sA = seg(html, 'A1');
    BA.offers = sA.indexOf(SET_BTN('A1')) >= 0; BA.label = sA.indexOf(ACTIVE_LBL) >= 0;
    I.eval('__toasts.length=0'); I.eval("tabGo('screenWeek')"); BA.t1 = I.eval('__toasts.slice()'); BA.s1 = bsnap(I);
    I.eval('__toasts.length=0'); I.eval("setActive('A1')"); BA.s2 = bsnap(I);
  } catch(e){ BA = { err:e.message }; }
  row('Ba', () => [!BA.err && BA.s0.ia === null && BA.s0.id === null && BA.s0.pid === null && BA.s0.scr === 'screenHome', BA.err || bstr(BA.s0)]);
  row('Ba2', () => [!BA.err && BA.offers && !BA.label, BA.err || 'offers Set Active ' + BA.offers + ', Active label ' + BA.label]);
  row('Ba3', () => [!BA.err && BA.s1.scr === 'screenHome' && BA.s1.pid === null && BA.t1.length === 1 && BA.t1[0] === T_GUARD
      && BA.s2.scr === 'screenWeek' && holds(BA.s2) && BA.s2.id === 'A1',
    BA.err || 'tabGo: ' + bstr(BA.s1) + ' toasts ' + JSON.stringify(BA.t1) + ' | setActive(A1): ' + bstr(BA.s2)]);
  const BC = [['Bb', { ia_programs:'[]', ia_active:'GONE' }, null, 'screenHome'], ['Bb2', { ia_active:'GONE' }, null, 'screenHome'],
    ['Bc', { ia_programs:JSON.stringify([L1P]), ia_active:'GONE' }, 'L1', 'screenWeek'],
    ['Bd', { ia_programs:JSON.stringify([A1, L1P]), ia_active:'A1' }, 'L1', 'screenWeek'],
    ['Be', { ia_programs:JSON.stringify([L1P]), ia_active:'L1' }, 'L1', 'screenWeek']];
  for(const [key, st, want, scr] of BC) row(key, () => { const s = bsnap(bootM(ART, st)); return [holds(s) && s.id === want && s.scr === scr, bstr(s)]; });
  pairRow('Bnp', () => {
    const V = [['live L1', { ia_programs:JSON.stringify([L1P]) }], ['programs empty', { ia_programs:'[]' }], ['no programs key', {}], ['all archived', { ia_programs:JSON.stringify([A1]) }]];
    const pic = I => lsDump(I) + '|' + JSON.stringify(bsnap(I)) + '|' + JSON.stringify(I.eval('__toasts.slice()'));
    const bad = [];
    for(const [nm, st] of V){ const b1 = pic(bootM(BASEART, st)), b2 = pic(bootM(BASEART, st)), c = pic(bootM(ART, st));
      if(b1 !== b2) bad.push(nm + ': V220 differs from itself'); else if(c !== b1) bad.push(nm + ': ' + c.slice(-160)); }
    return [!bad.length, bad.join('; ')];
  });
}

// ── L: legacy-delete backfill (re-ruling 4) ─────────────────────────────────
for(const [key, succ, wantSeed, wantTW] of [['L1', LG, 4242, undefined], ['L2', T2, 4343, T2_WEEK]]) row(key, () => {
  const I = bootM(ART, { ia_programs:JSON.stringify([D1, succ]), ia_active:'D1' }); I.eval("deleteProg('D1')");
  const st = JSON.parse(I.localStorage.getItem('ia_programs') || '[]').find(x => x.id === succ.id), s = bsnap(I);
  const c = (st && st.cfg) || {};
  return [c.seed === wantSeed && c._testWeek === wantTW && (wantTW === undefined || wantTW === 7) && holds(s) && s.id === succ.id,
    'stored cfg.seed=' + c.seed + ' _testWeek=' + c._testWeek + ' (date math ' + T2_WEEK + '), ' + tstr(s)];
});

// ── W: wizard landing ────────────────────────────────────────────────────────
const WB = (() => { const b = Object.assign({}, HMF); delete b.raceDate; delete b.cardioGoals; delete b.name; return b; })();
const WROWS = [
  ['lift only', Object.assign({}, WB, { seed:5000, cardioTypes:[], cardioGoals:{}, primaryPath:'lift', eventTargeted:false })],
  ['run_base, start -10d', Object.assign({}, WB, { seed:5005, cardioTypes:['run'], cardioGoals:runG('run_base'), eventTargeted:false, startDate:plusD(-10) })],
  ['HALF_MANNY as-is', Object.assign({}, HMF, { seed:5008 })],
  ['run_half, race +6w', Object.assign({}, WB, { seed:5020, cardioTypes:['run'], cardioGoals:runG('run_half'), eventTargeted:true, raceDate:plusD(45) })],
  ['run_pace_goal test +4w, start +10d', Object.assign({}, WB, { seed:5040, cardioTypes:['run'], cardioGoals:PG, eventTargeted:true, raceDate:plusD(31), startDate:plusD(10) })],
  ['run_half + bike_base, race +10w', Object.assign({}, WB, { seed:5045, cardioTypes:['run', 'bike'], cardioGoals:Object.assign(runG('run_half'), { bike:{ id:'bike_base', label:BIKE_L } }), eventTargeted:true, raceDate:plusD(73) })],
];
function wizardRun(art, cfg){
  const I = load(art), LS = I.localStorage, ev = I.eval, ctx = I.ctx;
  LS.setItem('ia_programs', W_P0); LS.setItem('ia_active', 'P0'); ev('activeProgId=null;activeProg=null;'); ev('init()'); I.flushTimers(20);
  ev('currentDayKey="tue";currentWeek=3;');
  const calls = [];
  ['showScreen', 'renderWeekView', 'renderProgList'].forEach(n => { const f = ctx[n]; ctx[n] = function(...a){ calls.push(n + '(' + (a.length ? String(a[0]) : '') + ')'); return f.apply(this, a); }; });
  ev('WD=Object.assign(WD||{},' + JSON.stringify(cfg) + ')'); ev('doGenerate()'); I.flushTimers(60);
  const progs = JSON.parse(LS.getItem('ia_programs') || '[]'), ap = ev('activeProg');
  return { s:triple(LS, ev), newId:progs.length === 2 ? progs[1].id : null, cw:ev('currentWeek'), scr:ev('_curScreen'), landing:calls.join(' '), prog:ap ? normP(ap) : null };
}
{
  const WC = WROWS.map(([nm, cfg]) => { try { return Object.assign({ nm }, wizardRun(ART, cfg)); } catch(e){ return { nm, err:e.message }; } });
  row('W1', () => { const bad = WC.filter(r => r.err || !(holds(r.s) && r.newId && r.s.id === r.newId && r.cw === 1 && r.scr === 'screenWeek'));
    return [!bad.length, bad.map(r => r.nm + ': ' + (r.err || tstr(r.s) + ' new ' + r.newId + ' week ' + r.cw + ' ' + r.scr)).join('; ')]; });
  let WBS = null;
  const wBase = () => { if(!WBS) WBS = WROWS.map(([nm, cfg]) => { const a = wizardRun(BASEART, cfg), b = wizardRun(BASEART, cfg); return { nm, a, self:a.scr === b.scr && a.cw === b.cw && a.landing === b.landing && a.prog === b.prog }; }); return WBS; };
  pairRow('W2', () => { const B = wBase(), bad = [];
    WC.forEach((r, i) => { const b = B[i]; if(!b.self) bad.push(r.nm + ': V220 differs from itself'); else if(r.err || r.landing.indexOf('showScreen(screenWeek)') < 0 || r.scr !== b.a.scr || r.cw !== b.a.cw || r.landing !== b.a.landing)
      bad.push(r.nm + ': ' + (r.err || r.scr + '/w' + r.cw + ' [' + r.landing + '] vs V220 ' + b.a.scr + '/w' + b.a.cw + ' [' + b.a.landing + ']')); });
    return [!bad.length, bad.join('; ')]; });
  pairRow('W3', () => { const B = wBase(), bad = [];
    WC.forEach((r, i) => { const b = B[i]; if(!b.self) bad.push(r.nm + ': V220 differs from itself'); else if(r.err || !r.prog || r.prog !== b.a.prog) bad.push(r.nm + (r.err ? ': ' + r.err : '')); });
    return [!bad.length, bad.join('; ')]; });
}

// ── H: archive / delete handoff, both arms (pair) ───────────────────────────
function hWorld(art, json, action){
  const I = load(art), LS = I.localStorage, ev = I.eval, ctx = I.ctx;
  LS.setItem('ia_programs', json); LS.setItem('ia_active', 'P0'); ev(ELS); ev('activeProgId=null;activeProg=null;'); ev('init()'); I.flushTimers(20);
  ev('showScreen("screenHome");currentWeek=2;currentDayKey="tue";');
  const calls = [];
  ['showScreen', 'renderWeekView', 'renderProgList', 'showToast'].forEach(n => { const f = ctx[n]; ctx[n] = function(...a){ calls.push(n + '(' + (a.length ? String(a[0]) : '') + ')'); return f.apply(this, a); }; });
  ev(action);
  const ap = ev('activeProg'), st = Object.assign(triple(LS, ev), { dig:ap ? progDigest(ap) : null, cw:ev('currentWeek'), dk:ev('currentDayKey'), scr:ev('_curScreen'),
    calls:calls.join(' '), stored:canon(JSON.parse(LS.getItem('ia_programs') || 'null')) });
  ev('activeProgId=null;activeProg=null;currentWeek=1;currentDayKey=null;'); ev('init()');
  const ap2 = ev('activeProg'); st.reboot = Object.assign(triple(LS, ev), { dig:ap2 ? progDigest(ap2) : null, cw:ev('currentWeek'), scr:ev('_curScreen') });
  return JSON.stringify(st);
}
for(const [key, json, action] of [['H1', C_JSON, 'archiveProg("P0")'], ['H2', C_JSON, 'deleteProg("P0")'], ['H3', C_JSON_P1A, 'archiveProg("P0")'], ['H4', C_JSON_P1A, 'deleteProg("P0")']])
  pairRow(key, () => { const b1 = hWorld(BASEART, json, action), b2 = hWorld(BASEART, json, action), c = hWorld(ART, json, action);
    if(b1 !== b2) return [false, 'V220 differs from itself'];
    const cj = JSON.parse(c), bj = JSON.parse(b1), diff = Object.keys(bj).filter(k => JSON.stringify(cj[k]) !== JSON.stringify(bj[k]));
    if(!cj.calls || !cj.stored) return [false, 'vacuous: no calls or no stored programs observed'];
    return [c === b1, 'differs on ' + diff.join(',') + ': ' + diff.map(k => k + ' ' + JSON.stringify(cj[k]).slice(0, 120) + ' vs V220 ' + JSON.stringify(bj[k]).slice(0, 120)).join(' | ')]; });

// ── M: HALF_MANNY ────────────────────────────────────────────────────────────
if(VER === ERA) row('M1', () => { const a = progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)), b = progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
  return [a === MANNY && a === b, a + ' / ' + b]; });
else skipRow(R.M1, 'scoped out, candidate ' + VER + ': a later ruling owns HALF_MANNY (standing ruling 5)');

if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
done();
