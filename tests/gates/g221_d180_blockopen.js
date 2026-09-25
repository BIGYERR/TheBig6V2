// g221_d180_blockopen.js — GATE for D180 (P-BLOCKOPEN): refreshProgram's copy-back carries blockOpen, so the days
// between a race-aligned program's counted-back start and the day the athlete walked in stay behind them after a reboot.
//
//   node tests/gates/g221_d180_blockopen.js <candidate.html> [baseline_V220.html]
//   IA_ASSUME_VERSION=221 node tests/gates/g221_d180_blockopen.js <tree stamped 220> [baseline_V220.html]   (pre-bump dev only)
//
// THE RULING THIS DEFENDS: tests/measure/v221_rulings/p_active_ruling.md, "RE-RULING ON V220 (parked S4: blockOpen,
// boot)" subsections 1 and 2 (Changes, Does NOT change, Before / After, Gates (i) to (v)), and "MARIO DECISION ON
// P-BLOCKOPEN" (SHIP in V221, device read skipped). Evidence tests/measure/v221_blockopen.out.txt. D-code D180.
// The change: `rebuilt.blockOpen = prog.blockOpen;` in refreshProgram's copy-back. Nothing else.
//
// CLOCK. Pinned to 2026-09-24 12:00 local, a Thursday (the ruling's clock: HALF_MANNY blockOpen 2026-09-24). The host
// Date is swapped before any artifact loads; the harness hands that Date to the VM. Row C0 proves the pin reached the
// VM to the millisecond (the host clock reads the same calendar day, so a dead pin would otherwise pass silently).
//
// ORACLE. Hand-typed or date arithmetic, never asked of the engine:
//   TODAY_ISO     the pin, typed. Alignment writes blockOpen = today, so every aligned row's blockOpen is TODAY_ISO.
//   PLAN_WEEKS    race plan lengths (5K 8, 10K 8, half 14, marathon 18). A race row's start is the Monday of race week
//                 minus (plan - 1) weeks (D14a). The table is checked against the ruling's blast radius before use:
//                 the rows whose start falls before TODAY_ISO must count 5K 25/91, 10K 25/91, half 67/91,
//                 marathon 91/91, plus the fixture, 209 of 365 aligned (Blast radius; boot reminder 209/365).
//   PRE SET       a flag-moving row's pre-signup days are exactly the days of its weeks dated start <= d < TODAY_ISO.
//   FIXTURE       HALF_MANNY through the wizard's start: race 2026-12-06 (a Sunday), half plan 14 weeks, so start is
//                 Mon 2026-11-30 minus 13 weeks = 2026-08-31; blockOpen 2026-09-24. restDays wed and sun (the
//                 fixture's own input). W1 = 08-31..09-06, all before 09-24. W4 = 09-21..09-27: mon tue wed before,
//                 thu fri sat sun in block; training thu fri sat = 3. Pre-signup rest days W1..W3 wed+sun and W4 wed
//                 = 7. Scheduled days to today: W4 thu only = 1 (flag ignored: 5+5+5 plus W4 mon tue thu = 18).
//                 The After column of the ruling's table is typed from that arithmetic; the Before column is the
//                 ruling's own text, asserted on V220 as a pair row.
//   (iii)         the wizard landing is held to the wizard's OWN committed prog (the program the wizard just built and
//                 _applyWizardStart stamped, captured at the buildProgram call), to the post-reboot render, and on
//                 aligned rows to the date-arithmetic pre set. "Landing equals reboot" alone does not trip when the
//                 line is dropped (both sides lose the flag); the own-prog half does.
// OBSERVATION is the live path in the harness VM: buildProgram, _applyWizardStart, refreshProgram, init, doGenerate,
// setProgRace, setProgStart, renderWeekView, openDayKey, restDayEligible, scheduledDays, the boot reminder.
//
// VERSION PREDICATE (standing rulings 2 and 4). D180 ships at 221.
//   below 221      REFUSED, every assertion row FAILS by name.
//   221 and up     hand and class rows (C0 I1 I2 I3 I4 T*) assert.
//   pair rows      P1 P2 P3 assert only on D180's build pair: candidate 221 against baseline 220 (argv[3] when it
//                  reads 220, else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS.
//   I5 (HALF_MANNY digest) asserts on 221 only (standing ruling 5, no era row).
//   IA_ASSUME_VERSION=221 lifts a file stamped 220 to 221 for a pre-bump development run. It is announced, and it is
//   ignored on any file not stamped exactly 220. gate.sh never sets it.
//
// ROWS
//   C0   the pinned clock reached the VM: Date.now() is the pin, new Date() is a Thursday.
//   I1   lattice (402 rows, seeds 7000+: HALF_MANNY; 4 race goals x 13 weeks x 7 offsets; no race date, event off,
//        pace test dated and undated, base, lift), each built, stamped by _applyWizardStart, refreshed:
//        I1a aligned rows (hand: race rows and the fixture, 365) enter with blockOpen TODAY_ISO and refreshProgram
//            returns it, own key, serialised.
//        I1b non-aligned rows (hand: 37) enter without the key and refreshProgram's JSON carries no blockOpen key.
//        I1c on every row the days the flag holds outside (dayBeforeStart true with blockOpen, false without) are the
//            date-arithmetic pre set; 209 rows move, broken out per goal as the ruling's blast radius.
//   I2   stored blockOpen through reboots (wizard commit; chains HALF_MANNY and run_half race +45 d):
//        I2a after a reboot, setProgRace(same) leaves stored blockOpen TODAY_ISO and start unchanged.
//        I2b after a reboot, setProgStart(same) leaves stored blockOpen TODAY_ISO and start unchanged.
//        I2c after every reboot the in-memory flag equals the stored one (TODAY_ISO).
//   I3   wizard (46 rows, seeds 5000+, landing from an existing active program on W3 tue):
//        I3a the landing is week 1 and its render equals the post-reboot week 1 render.
//        I3b the landing equals a render of the wizard's own committed prog.
//        I3c activeProg against the wizard's own prog: the only differing key is overlays (loader normalisation, §5).
//        I3d aligned rows: stored blockOpen is TODAY_ISO and the landing's .pre cells are the date-arithmetic set;
//            the fixture row's landing tile reads 0 /0 DONE.
//   I4   fixture boot: no reminder pop, no ia_reminded_ key (past training days outside the block: 0).
//   I5   progDigest(buildProgram(HALF_MANNY)) = 0ac7da6b1691a8e1, self-stable.
//   T    the ruling's table, After column, on the fixture after a reboot:
//        T1 W1 strip 7/7 .pre, none tappable   T2 W1 DONE tile 0 /0 DONE   T3 W1 mon tap toasts Before your start date
//        T4 W4 mon tue wed .pre, thu fri sat sun in block   T5 W4 DONE tile 0 /3 DONE   T6 restDayEligible 0 of 7
//        T7 W4 hero is Today, Thursday   T8 scheduledDays(today) 1   T9 W1 hero offers no session   T10 streak 0
//   P    (pair) P1 V220 refreshProgram lattice equals itself; non-aligned JSON byte-identical to V220; aligned JSON
//        equal to V220 once blockOpen is dropped, and different with it (an empty diff is a failure).
//        P2 the wizard landing W1 render equals V220's landing (the :1964 picture), V220 equal to itself.
//        P3 the Before column reproduces on V220: W1 and W4 0 /5 DONE, no .pre cell, "More than a week off",
//        scheduledDays 18, 7 of 7 rest days eligible, W1 mon opens the day.
'use strict';
const RealDate = Date;
const PIN = new RealDate(2026, 8, 24, 12, 0, 0).getTime();          // Thu 2026-09-24 12:00 local
function PD(...a){ if(!new.target) return new RealDate(PIN).toString(); return a.length ? new RealDate(...a) : new RealDate(PIN); }
PD.prototype = RealDate.prototype; PD.now = () => PIN; PD.UTC = RealDate.UTC; PD.parse = RealDate.parse;
globalThis.Date = PD;

const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';
const MANNY = '0ac7da6b1691a8e1';
const T0 = process.hrtime.bigint(); const secs = () => (Number(process.hrtime.bigint() - T0) / 1e9).toFixed(1);
let pass = 0, fail = 0, skip = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : '  [' + g + ']')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };
const done = () => { console.log('  runtime ' + secs() + ' s\n\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
const TODAY_ISO = '2026-09-24';
const PLAN_WEEKS = { run_5k:8, run_10k:8, run_half:14, run_marathon:18 };
const RULING_MOVES = { run_5k:25, run_10k:25, run_half:67, run_marathon:91, fixture:1 };   // Blast radius, 209 of 365
const FIX_START = '2026-08-31', FIX_BO = '2026-09-24', FIX_WEEKS = 14;
const T_AFTER = { W1pre:'mon tue wed thu fri sat sun', W1tap:0, W1done:'0 /0 DONE', toast:'Before your start date',
  W4pre:'mon tue wed', W4tap:4, W4done:'0 /3 DONE', restPre:7, restEligible:0, sched:1, streak:0 };
const T_BEFORE = { W1done:'0 /5 DONE', W4done:'0 /5 DONE', remind:'More than a week off. Mark what happened, then ease back in.', sched:18, restEligible:7 };
const PRE_REST_DAYS = [[1,'wed'],[1,'sun'],[2,'wed'],[2,'sun'],[3,'wed'],[3,'sun'],[4,'wed']];

// date arithmetic, local calendar days as ISO strings (ISO strings order as dates)
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const pdate = s => { const [y, m, d] = s.split('-').map(Number); return new RealDate(y, m - 1, d); };
const addDays = (s, n) => { const x = pdate(s); x.setDate(x.getDate() + n); return isoOf(x); };
const monOf = s => { const x = pdate(s); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return isoOf(x); };
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const dayISO = (start, w, i) => addDays(monOf(start), (w - 1) * 7 + i);
const handStart = (goal, race) => addDays(monOf(race), -7 * (PLAN_WEEKS[goal] - 1));
const plus = n => addDays(TODAY_ISO, n);
const sha = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 16);

// oracle self-checks, engine-free: the fixture arithmetic and the ruling's blast radius from PLAN_WEEKS
const ORACLE_BAD = [];
if(handStart('run_half', '2026-12-06') !== FIX_START) ORACLE_BAD.push('fixture start ' + handStart('run_half', '2026-12-06'));
{ const w1 = DAYS.filter((d, i) => dayISO(FIX_START, 1, i) < FIX_BO).join(' '), w4 = DAYS.filter((d, i) => dayISO(FIX_START, 4, i) < FIX_BO).join(' ');
  const den4 = DAYS.filter((d, i) => !['wed','sun'].includes(d) && dayISO(FIX_START, 4, i) >= FIX_BO).length;
  const restPre = []; for(let w = 1; w <= FIX_WEEKS; w++) DAYS.forEach((d, i) => { if(['wed','sun'].includes(d) && dayISO(FIX_START, w, i) < FIX_BO) restPre.push(w + d); });
  let sched = 0, schedNo = 0; for(let w = 1; w <= FIX_WEEKS; w++) DAYS.forEach((d, i) => { if(['wed','sun'].includes(d)) return; const x = dayISO(FIX_START, w, i); if(x <= TODAY_ISO){ schedNo++; if(x >= FIX_BO) sched++; } });
  if(w1 !== T_AFTER.W1pre || w4 !== T_AFTER.W4pre || '0 /' + den4 + ' DONE' !== T_AFTER.W4done || restPre.length !== T_AFTER.restPre
     || restPre.join(',') !== PRE_REST_DAYS.map(x => x[0] + x[1]).join(',') || sched !== T_AFTER.sched || schedNo !== T_BEFORE.sched)
    ORACLE_BAD.push('fixture arithmetic ' + JSON.stringify({ w1, w4, den4, restPre, sched, schedNo }));
  if(new RealDate(PIN).getDay() !== 4 || isoOf(new RealDate(PIN)) !== TODAY_ISO) ORACLE_BAD.push('pin is not Thursday ' + TODAY_ISO); }

// ── ROWS ─────────────────────────────────────────────────────────────────────
const R = {
  C0:'C0 pinned clock reached the VM: Date.now() is the pin, new Date() is Thursday ' + TODAY_ISO,
  I1a:'I1a (i) aligned lattice rows enter with blockOpen ' + TODAY_ISO + ' and refreshProgram returns it (own key, in the JSON)',
  I1b:'I1b (i) non-aligned lattice rows: refreshProgram JSON carries no blockOpen key',
  I1c:'I1c (i) on every lattice row the days the flag holds outside are the date-arithmetic set start <= d < blockOpen; 209 rows move (5K 25, 10K 25, half 67, marathon 91, fixture 1)',
  I2a:'I2a (ii) after a reboot, setProgRace(same) leaves stored blockOpen ' + TODAY_ISO + ' and the start unchanged',
  I2b:'I2b (ii) after a reboot, setProgStart(same) leaves stored blockOpen ' + TODAY_ISO + ' and the start unchanged',
  I2c:'I2c (ii) after every reboot the in-memory blockOpen equals the stored ' + TODAY_ISO,
  I3a:'I3a (iii) wizard landing is week 1 and its render equals the post-reboot week 1 render, 46/46',
  I3b:'I3b (iii) wizard landing render equals a render of the wizard\'s own committed prog, 46/46',
  I3c:'I3c (iii) activeProg against the wizard\'s own prog: the only differing key is overlays, 46/46',
  I3d:'I3d (iii) aligned wizard rows: stored blockOpen ' + TODAY_ISO + ', landing .pre cells are the date-arithmetic set, fixture landing 0 /0 DONE',
  I4:'I4 (iv) fixture (start ' + FIX_START + ', blockOpen ' + FIX_BO + ') boot: no reminder pop, no ia_reminded_ key',
  I5:'I5 (v) progDigest(buildProgram(HALF_MANNY)) = ' + MANNY + ', self-stable (no era row)',
  T1:'T1 W1 strip 7/7 .pre, none tappable',
  T2:'T2 W1 DONE tile ' + T_AFTER.W1done,
  T3:'T3 W1 mon tap: toast "' + T_AFTER.toast + '", the day does not open',
  T4:'T4 W4 strip: mon tue wed .pre, thu fri sat sun in block and tappable',
  T5:'T5 W4 DONE tile ' + T_AFTER.W4done,
  T6:'T6 restDayEligible 0 of the 7 pre-signup rest days',
  T7:'T7 W4 hero is Today, Thursday (same as before)',
  T8:'T8 scheduledDays(today) = 1',
  T9:'T9 W1 hero offers no session (browse)',
  T10:'T10 streak 0 (same as before)',
  P1:'P1 (pair) refreshProgram lattice: V220 equals itself; non-aligned JSON byte-identical to V220; aligned JSON equals V220 once blockOpen is dropped and differs with it',
  P2:'P2 (pair) wizard landing W1 render equals V220\'s landing (the :1964 picture), V220 equal to itself, 46/46',
  P3:'P3 (pair) the Before column reproduces on V220: W1 and W4 0 /5 DONE, no .pre cell, reminder "More than a week off", scheduledDays 18, 7 of 7 rest days eligible, W1 mon opens',
};
const PAIR_ROWS = ['P1', 'P2', 'P3'];

// ── RUN ──────────────────────────────────────────────────────────────────────
let IA0, STAMP = NaN;
try { IA0 = load(ART); STAMP = +IA0.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a pre-bump development run, not a ship proof');
}
console.log('g221 D180 | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | clock pinned ' + isoOf(new RealDate(PIN)) + ' ' + new RealDate(PIN).toString().slice(0, 24));
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D180 P-BLOCKOPEN (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
if(ORACLE_BAD.length){ console.log('ORACLE INCONSISTENT: ' + ORACLE_BAD.join('; ')); Object.keys(R).forEach(k => ok(R[k] + ' (oracle inconsistent)', false)); done(); }
// Baseline for the pair rows: D180's build pair is 221 against 220.
let BASE = null, baseWhy = '';
if(VER === ERA){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) BASE = path.resolve(BASEFILE); else baseWhy = 'argv[3] reads ' + b.version + '; '; }
    if(!BASE){
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g221d180-')), f = path.join(tmp, 'v220.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V220_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      const b = load(f);
      if(+b.version === BASE_ERA){ BASE = f; baseWhy += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else baseWhy += 'git reads ' + b.version;
      process.on('exit', () => { try { fs.rmSync(tmp, { recursive:true, force:true }); } catch(e){} });
    }
  } catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); BASE = null; }
}
const PAIR = VER === ERA && !!BASE;
console.log('  pair rows: ' + (PAIR ? 'LIVE (candidate ' + VER + ' vs V' + BASE_ERA + (baseWhy ? ', ' + baseWhy : ', argv[3]') + ')' : VER === ERA ? 'SETUP FAILED (' + baseWhy + ')' : 'scoped out (candidate ' + VER + ' is not D180\'s pair)'));
const pairRow = (key, fn) => {
  if(PAIR){ let r; try { r = fn(); } catch(e){ r = [false, 'threw ' + e.message]; } return ok(R[key], r[0], r[1]); }
  if(VER === ERA) return ok(R[key] + ' (setup: ' + baseWhy + ')', false);
  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D180's build pair (221 vs 220)");
};
const row = (key, fn) => { let r; try { r = fn(); } catch(e){ r = [false, 'threw ' + (e && e.stack || e).toString().split('\n').slice(0, 2).join(' ')]; } ok(R[key], r[0], r[1]); };

// ── VM helpers ───────────────────────────────────────────────────────────────
// getElementById is memoised so a rendered container's innerHTML can be read back. showToast and popFire are
// wrapped, never replaced: the original runs after the record (neither takes a callback; popFire's actions are
// onclick strings).
const HOOKS = "(function(){const m={};const o=document.getElementById;document.getElementById=function(id){return m[id]||(m[id]=o(id));};globalThis.__els=m;})();"
  + "globalThis.__toasts=[];(function(){const f=showToast;showToast=function(t){__toasts.push(String(t));return f.apply(this,arguments);};})();"
  + "globalThis.__pops=[];(function(){const f=popFire;popFire=function(t,o){__pops.push(t+'::'+String((o&&o.msg)||''));return f.apply(this,arguments);};})();";
function boot(file, store){
  const IA = load(file); const LS = IA.localStorage; LS.clear();
  if(store) for(const [k, v] of Object.entries(store)) LS.setItem(k, v);
  IA.eval(HOOKS); IA.eval('activeProgId=null;activeProg=null;'); IA.eval('init()'); IA.flushTimers(30); return IA;
}
const dump = IA => Object.fromEntries(IA.localStorage._map);
const storedP = (IA, id) => (JSON.parse(IA.localStorage.getItem('ia_programs') || '[]')).find(x => x && x.id === id) || {};
const weekHTML = IA => { const els = IA.eval('Object.values(__els).map(e=>e.innerHTML).filter(h=>h&&h.indexOf("wk-stats")>=0)'); return els.sort((a, b) => b.length - a.length)[0] || ''; };
const render = (IA, w) => { IA.eval('currentWeek=' + w + ';renderWeekView()'); return weekHTML(IA); };
const text = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function wizard(IA, cfg){ IA.eval('WD=Object.assign(WD||{},' + JSON.stringify(cfg) + ')'); IA.eval('doGenerate()'); IA.flushTimers(60); return IA.eval('activeProgId'); }
function parseWeek(h){
  const hi = h.indexOf('wk-hero'), si = h.indexOf('wk-stats'); const strip = hi >= 0 ? h.slice(0, hi) : h;
  const cls = []; strip.replace(/<div class="wk-day((?:\s[^"]*)?)"/g, (m, c) => { cls.push(c); return m; });
  const pre = DAYS.filter((d, i) => cls[i] !== undefined && /\bpre\b/.test(cls[i]));
  const taps = (strip.match(/onclick="openDayKey\('/g) || []).length;
  const hero = hi >= 0 ? text(h.slice(h.lastIndexOf('<', hi), si > hi ? h.lastIndexOf('<', si) : undefined)) : '';
  const dm = text(h.slice(si >= 0 ? si : 0)).match(/(\d+) \/(\d+) DONE/);
  return { cells:cls.length, pre:pre.join(' '), taps, hero, heroHtml: hi >= 0 ? h.slice(hi, si > hi ? si : undefined) : '', done: dm ? dm[1] + ' /' + dm[2] + ' DONE' : '?' };
}

// C0
row('C0', () => { const now = IA0.eval('Date.now()'), dow = IA0.eval('new Date().getDay()'), d = IA0.eval('(function(){const t=new Date();return t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate();})()');
  return [now === PIN && dow === 4 && d === '2026-9-24', 'VM Date.now ' + now + ' pin ' + PIN + ', day ' + dow + ', ' + d]; });

// ── (i) the refreshProgram lattice ───────────────────────────────────────────
const HM = fixtures.HALF_MANNY;
const runG = (id, extra) => ({ run: Object.assign({ id, label:id, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' }, extra || {}) });
const PG = runG('run_pace_goal', { targetMins:'9', targetSecs:'00' });
const LROWS = []; { let seed = 7000; const add = (goal, kind, aligned, o) => LROWS.push({ goal, kind, aligned, cfg: Object.assign({}, HM, { seed: seed++, name:'M' }, o) });
  add('fixture', 'HALF_MANNY as-is', true, {});
  for(const g of ['run_5k','run_10k','run_half','run_marathon']) for(let w = 4; w <= 16; w++) for(let o = 0; o < 7; o++)
    add(g, 'race', true, { cardioTypes:['run'], cardioGoals:runG(g), eventTargeted:true, raceDate:plus(7 * w + o) });
  for(const g of ['run_5k','run_10k','run_half','run_marathon']){ add(g, 'no race date', false, { cardioTypes:['run'], cardioGoals:runG(g), eventTargeted:true, raceDate:undefined });
    for(const w of [4, 8, 12]) add(g, 'event off', false, { cardioTypes:['run'], cardioGoals:runG(g), eventTargeted:false, raceDate:plus(7 * w + 2) }); }
  for(let w = 1; w <= 16; w++) add('run_pace_goal', 'test dated', false, { cardioTypes:['run'], cardioGoals:PG, eventTargeted:true, raceDate:plus(7 * w + 3) });
  add('run_pace_goal', 'no test date', false, { cardioTypes:['run'], cardioGoals:PG, eventTargeted:true, raceDate:undefined });
  for(const w of [0, -10, 10]) add('run_base', 'base', false, { cardioTypes:['run'], cardioGoals:runG('run_base'), eventTargeted:false, raceDate:undefined, startDate: w ? plus(w) : undefined });
  add('lift', 'lift only', false, { cardioTypes:[], cardioGoals:{}, primaryPath:'lift', eventTargeted:false, raceDate:undefined }); }
// hand expectation per row: the start (aligned rows), the flag, the pre set is filled in once the row's weeks are known
for(const r of LROWS) if(r.aligned) r.hStart = handStart(r.goal === 'fixture' ? 'run_half' : r.goal, r.cfg.raceDate);
const LAT_JS = '(function(){const D=["mon","tue","wed","thu","fri","sat","sun"];const fl=[],days=[];'
  + 'for(let w=1;w<=__R.totalWeeks;w++)for(const d of D){if(!__R.weeks[w]||!__R.weeks[w][d])continue;days.push(w+":"+d);'
  + 'const q=Object.assign({},__R);delete q.blockOpen;if(dayBeforeStart(__R,w,d)&&!dayBeforeStart(q,w,d))fl.push("W"+w+d);}'
  + 'const noClock=(k,v)=>k==="created"?undefined:v,noBO=(k,v)=>(k==="created"||k==="blockOpen")?undefined:v;'
  + 'return JSON.stringify({inBO:__P.blockOpen===undefined?"absent":__P.blockOpen,inStart:__P.startDate,'
  + 'outBO:__R.blockOpen===undefined?"absent":__R.blockOpen,own:Object.prototype.hasOwnProperty.call(__R,"blockOpen"),'
  + 'json:JSON.stringify(__R,noClock),jnb:JSON.stringify(__R,noBO),flips:fl.join(" "),days});})()';
function lattice(file){
  const IA = boot(file); const out = [];
  for(const r of LROWS){ const c = JSON.stringify(JSON.parse(JSON.stringify(r.cfg)));
    IA.eval('__P=buildProgram(' + c + ');_applyWizardStart(__P,' + c + ');__P.id="PX";__P.name="M";__R=refreshProgram(JSON.parse(JSON.stringify(__P)));');
    const o = JSON.parse(IA.eval(LAT_JS));
    o.hasKey = o.json.indexOf('"blockOpen"') >= 0; o.jsonH = sha(o.json); o.jnbH = sha(o.jnb); delete o.json; delete o.jnb;
    out.push(o); }
  return out;
}
const tL = secs();
const LC = lattice(ART);
{ // I1a / I1b / I1c
  const al = LROWS.map((r, i) => [r, LC[i]]).filter(x => x[0].aligned), na = LROWS.map((r, i) => [r, LC[i]]).filter(x => !x[0].aligned);
  const carry = al.filter(([r, o]) => o.inBO === TODAY_ISO && o.outBO === TODAY_ISO && o.own && o.hasKey);
  row('I1a', () => [al.length === 365 && carry.length === 365, carry.length + '/' + al.length + (carry.length < al.length ? '; e.g. ' + al.filter(x => !carry.includes(x)).slice(0, 2).map(([r, o]) => r.goal + ' ' + r.cfg.raceDate + ' in ' + o.inBO + ' out ' + o.outBO).join(', ') : '')]);
  const clean = na.filter(([r, o]) => o.inBO === 'absent' && !o.hasKey);
  row('I1b', () => [na.length === 37 && clean.length === 37, clean.length + '/' + na.length + ' with no key' + (clean.length < na.length ? '; e.g. ' + na.filter(x => !clean.includes(x)).slice(0, 2).map(([r, o]) => r.goal + ' ' + r.kind + ' in ' + o.inBO + ' out ' + o.outBO + ' start ' + o.inStart).join(', ') : '')]);
  const moves = {}, bad = []; let startBad = 0;
  LROWS.forEach((r, i) => { const o = LC[i];
    let exp = '';
    if(r.aligned){ if(o.inStart !== r.hStart) startBad++;
      exp = o.days.map(x => x.split(':')).filter(([w, d]) => { const x = dayISO(r.hStart, +w, DAYS.indexOf(d)); return x >= r.hStart && x < TODAY_ISO; }).map(([w, d]) => 'W' + w + d).join(' ');
      if(exp) moves[r.goal] = (moves[r.goal] || 0) + 1; }
    if(o.flips !== exp) bad.push(r.goal + ' ' + (r.cfg.raceDate || r.kind) + ' want [' + exp.slice(0, 40) + '] got [' + o.flips.slice(0, 40) + ']'); });
  const movesOK = Object.keys(RULING_MOVES).every(k => moves[k] === RULING_MOVES[k]) && Object.keys(moves).length === Object.keys(RULING_MOVES).length;
  row('I1c', () => [movesOK && startBad === 0 && bad.length === 0, (LROWS.length - bad.length) + '/' + LROWS.length + ' rows match; moving rows ' + JSON.stringify(moves) + '; aligned starts off the hand table ' + startBad + (bad.length ? '; e.g. ' + bad.slice(0, 2).join(' | ') : '')]);
}
console.log('  lattice ' + LROWS.length + ' rows on the candidate in ' + (secs() - tL).toFixed(1) + ' s');

// ── (ii) stored blockOpen through reboots ────────────────────────────────────
{ const chains = [['HALF_MANNY', Object.assign({}, HM), FIX_START], ['run_half race +45 d', Object.assign({}, HM, { raceDate:plus(45) }), handStart('run_half', plus(45))]];
  const A = [], Bk = [], C = [];
  for(const [cn, cfg, hs] of chains){
    const IA = boot(ART); const id = wizard(IA, cfg); const s0 = storedP(IA, id); const D0 = dump(IA);
    const setup = s0.blockOpen === TODAY_ISO && s0.startDate === hs;
    const R1 = boot(ART, D0); const m1 = (R1.eval('activeProg') || {}).blockOpen;
    R1.eval('setProgRace(' + JSON.stringify(cfg.raceDate) + ')'); const sR = storedP(R1, id);
    const R2 = boot(ART, dump(R1)); const m2 = (R2.eval('activeProg') || {}).blockOpen;
    const R3 = boot(ART, D0); const st = R3.eval('activeProg.startDate'); R3.eval('setProgStart(' + JSON.stringify(st) + ')'); const sS = storedP(R3, id);
    const R4 = boot(ART, dump(R3)); const m4 = (R4.eval('activeProg') || {}).blockOpen;
    A.push([setup && sR.blockOpen === TODAY_ISO && sR.startDate === hs, cn + ': commit ' + s0.blockOpen + '/' + s0.startDate + ', after setProgRace ' + sR.blockOpen + '/' + sR.startDate]);
    Bk.push([setup && sS.blockOpen === TODAY_ISO && sS.startDate === hs, cn + ': after setProgStart ' + sS.blockOpen + '/' + sS.startDate]);
    C.push([setup && m1 === TODAY_ISO && m2 === TODAY_ISO && m4 === TODAY_ISO, cn + ': in memory reboot ' + m1 + ', after setProgRace+reboot ' + m2 + ', after setProgStart+reboot ' + m4]);
  }
  row('I2a', () => [A.every(x => x[0]), A.map(x => x[1]).join('; ')]);
  row('I2b', () => [Bk.every(x => x[0]), Bk.map(x => x[1]).join('; ')]);
  row('I2c', () => [C.every(x => x[0]), C.map(x => x[1]).join('; ')]);
}

// ── (iii) wizard landing ─────────────────────────────────────────────────────
const base0 = Object.assign({}, HM); delete base0.raceDate; delete base0.cardioGoals; delete base0.name;
const WROWS = []; { let ws = 5000; const wadd = (name, aligned, goal, o) => WROWS.push({ name, aligned, goal, cfg: Object.assign({}, base0, { seed: ws++ }, o) });
  wadd('lift only', false, null, { cardioTypes:[], cardioGoals:{}, primaryPath:'lift', eventTargeted:false });
  wadd('lift only, start +10d', false, null, { cardioTypes:[], cardioGoals:{}, primaryPath:'lift', eventTargeted:false, startDate:plus(10) });
  wadd('lift only, start -10d', false, null, { cardioTypes:[], cardioGoals:{}, primaryPath:'lift', eventTargeted:false, startDate:plus(-10) });
  wadd('run_base', false, null, { cardioTypes:['run'], cardioGoals:runG('run_base'), eventTargeted:false });
  wadd('run_base, start +3d', false, null, { cardioTypes:['run'], cardioGoals:runG('run_base'), eventTargeted:false, startDate:plus(3) });
  wadd('run_base, start -10d', false, null, { cardioTypes:['run'], cardioGoals:runG('run_base'), eventTargeted:false, startDate:plus(-10) });
  wadd('bike_base', false, null, { cardioTypes:['bike'], cardioGoals:{ bike:{ id:'bike_base', label:'Build Cycling Base' } }, eventTargeted:false });
  wadd('swim_base', false, null, { cardioTypes:['swim'], cardioGoals:{ swim:{ id:'swim_base', label:'Swim Base' } }, eventTargeted:false });
  wadd('HALF_MANNY fixture as-is', true, 'run_half', Object.assign({}, HM));
  const FL = { run_5k:4, run_10k:4, run_half:6, run_marathon:12 };
  for(const g of Object.keys(PLAN_WEEKS)){ const P = PLAN_WEEKS[g];
    wadd(g + ' no race date', false, null, { cardioTypes:['run'], cardioGoals:runG(g), eventTargeted:true });
    wadd(g + ' event off, date', false, null, { cardioTypes:['run'], cardioGoals:runG(g), eventTargeted:false, raceDate:plus(7 * P + 3) });
    for(const w of [...new Set([2, FL[g], Math.floor(P / 2), P - 1, P, P + 4])]) wadd(g + ' race +' + w + 'w', true, g, { cardioTypes:['run'], cardioGoals:runG(g), eventTargeted:true, raceDate:plus(7 * w + 3) }); }
  wadd('run_pace_goal no test date', false, null, { cardioTypes:['run'], cardioGoals:PG, eventTargeted:true });
  for(const w of [1, 4, 8, 20]) wadd('run_pace_goal test +' + w + 'w', false, null, { cardioTypes:['run'], cardioGoals:PG, eventTargeted:true, raceDate:plus(7 * w + 3) });
  wadd('run_pace_goal test +4w, start +10d', false, null, { cardioTypes:['run'], cardioGoals:PG, eventTargeted:true, raceDate:plus(31), startDate:plus(10) });
  wadd('run_half + bike_base, race +10w', true, 'run_half', { cardioTypes:['run','bike'], cardioGoals:Object.assign(runG('run_half'), { bike:{ id:'bike_base', label:'Build Cycling Base' } }), eventTargeted:true, raceDate:plus(73) }); }
const P0JSON = (() => { const p = IA0.buildProgram(Object.assign({}, HM, { seed:1000 })); p.id = 'P0'; p.name = 'Prog0'; p.startDate = '2026-09-07'; return JSON.stringify([p]); })();
function wizardRun(file, full){
  const res = [];
  for(const r of WROWS){
    const IA = boot(file, { ia_programs:P0JSON, ia_active:'P0' }); IA.eval('currentDayKey="tue";currentWeek=3;');
    const ctx = IA.ctx, ob = ctx.buildProgram; let cap = null;
    if(full) ctx.buildProgram = function(...a){ const x = ob.apply(this, a); if(!cap) cap = x; return x; };
    const id = wizard(IA, r.cfg); if(full) ctx.buildProgram = ob;
    const o = { cw: IA.eval('currentWeek'), landing: weekHTML(IA) };
    if(full){
      const ap = IA.eval('activeProg') || {};
      o.keysDiff = cap ? [...new Set([...Object.keys(ap), ...Object.keys(cap)])].filter(k => JSON.stringify(ap[k]) !== JSON.stringify(cap[k])).sort().join(',') : 'no capture';
      ctx.__cap = cap; IA.eval('globalThis.__ap=activeProg;activeProg=__cap;'); o.capW1 = cap ? render(IA, 1) : ''; IA.eval('activeProg=__ap;');
      o.stored = storedP(IA, id);
      const RB = boot(file, dump(IA)); o.rbW1 = render(RB, 1);
    }
    res.push(o);
  }
  return res;
}
const tW = secs();
const WC = wizardRun(ART, true);
{ const N = WROWS.length, c = f => WC.filter(f).length;
  row('I3a', () => { const n = c(o => o.cw === 1 && o.landing && o.landing === o.rbW1); return [N === 46 && n === N, n + '/' + N + ' (landing week 1: ' + c(o => o.cw === 1) + ')']; });
  row('I3b', () => { const n = c(o => o.landing && o.landing === o.capW1); return [N === 46 && n === N, n + '/' + N + (n < N ? '; e.g. ' + WROWS.filter((r, i) => WC[i].landing !== WC[i].capW1).slice(0, 3).map(r => r.name).join(', ') : '')]; });
  row('I3c', () => { const n = c(o => o.keysDiff === 'overlays'); const kinds = [...new Set(WC.map(o => o.keysDiff))].map(k => (k || 'none') + ' x' + c(o => o.keysDiff === k)).join('; '); return [N === 46 && n === N, n + '/' + N + ' (' + kinds + ')']; });
  row('I3d', () => { const bad = []; let al = 0, moved = 0;
    WROWS.forEach((r, i) => { if(!r.aligned) return; al++; const o = WC[i], hs = handStart(r.goal, r.cfg.raceDate), pw = parseWeek(o.landing);
      const exp = DAYS.filter((d, j) => { const x = dayISO(hs, 1, j); return x >= hs && x < TODAY_ISO; }).join(' ');
      if(exp) moved++;
      if(o.stored.blockOpen !== TODAY_ISO || o.stored.startDate !== hs || pw.pre !== exp) bad.push(r.name + ' bo ' + o.stored.blockOpen + ' start ' + o.stored.startDate + ' pre [' + pw.pre + '] want [' + exp + ']'); });
    const fx = parseWeek(WC[WROWS.findIndex(r => /HALF_MANNY/.test(r.name))].landing).done;
    return [al === 24 && moved > 0 && bad.length === 0 && fx === T_AFTER.W1done, (al - bad.length) + '/' + al + ' aligned rows, ' + moved + ' with W1 pre days; fixture landing ' + fx + (bad.length ? '; e.g. ' + bad.slice(0, 2).join(' | ') : '')]; });
}
console.log('  wizard ' + WROWS.length + ' rows on the candidate in ' + (secs() - tW).toFixed(1) + ' s');

// ── (iv) and the table: the fixture after a reboot ───────────────────────────
const FIX = (() => { const I = load(ART); I.eval('__F=buildProgram(' + JSON.stringify(HM) + ');_applyWizardStart(__F,' + JSON.stringify(HM) + ');__F.id="HM1";__F.name="THE HALF MANNY";'); return JSON.parse(JSON.stringify(I.eval('__F'))); })();
const FIX_OK = FIX.startDate === FIX_START && FIX.blockOpen === FIX_BO && FIX.totalWeeks === FIX_WEEKS
  && ['wed','sun'].every(d => [1, 2, 3, 4].every(w => FIX.weeks[w][d] && FIX.weeks[w][d].rest)) && ['mon','tue','thu','fri','sat'].every(d => [1, 2, 3, 4].every(w => FIX.weeks[w][d] && !FIX.weeks[w][d].rest));
console.log('  fixture: start ' + FIX.startDate + ' blockOpen ' + FIX.blockOpen + ' weeks ' + FIX.totalWeeks + ' rest wed+sun on W1..W4 ' + FIX_OK);
const FSTORE = { ia_programs: JSON.stringify([FIX]), ia_active:'HM1' };
function tableRead(file){
  const IA = boot(file, FSTORE); const t = {};
  t.pops = IA.eval('__pops.slice()').filter(p => /^reminder::/.test(p)); t.remindKey = IA.localStorage.getItem('ia_reminded_HM1');
  t.W1 = parseWeek(render(IA, 1)); t.W4 = parseWeek(render(IA, 4));
  IA.eval('__toasts.length=0;currentDayKey=null;currentWeek=1;openDayKey("mon")'); t.tap = { toasts: IA.eval('__toasts.slice()'), key: IA.eval('currentDayKey') };
  try { IA.eval('if(typeof closeDetail==="function")closeDetail()'); } catch(e){}
  IA.eval('currentWeek=4;');
  t.rest = PRE_REST_DAYS.filter(([w, d]) => IA.eval('restDayEligible(' + w + ',"' + d + '")')).length;
  t.sched = IA.eval('scheduledDays(new Date(' + pdate(TODAY_ISO).getTime() + ')).length');
  t.streak = IA.eval('computeStreak()');
  return t;
}
const TC = tableRead(ART);
row('I4', () => [FIX_OK && TC.pops.length === 0 && TC.remindKey === null, 'reminder pops ' + (TC.pops.join(' | ') || 'none') + ', ia_reminded_HM1 ' + (TC.remindKey || 'absent') + ', fixture ' + FIX_OK]);
if(VER === ERA) row('I5', () => { const I = load(ART), a = progDigest(I.buildProgram(fixtures.HALF_MANNY)), b = progDigest(I.buildProgram(fixtures.HALF_MANNY)); return [a === MANNY && a === b, a + ' / ' + b]; });
else skipRow(R.I5, 'scoped out, candidate ' + VER + ': a later ruling owns HALF_MANNY (standing ruling 5)');
row('T1', () => [FIX_OK && TC.W1.cells === 7 && TC.W1.pre === T_AFTER.W1pre && TC.W1.taps === T_AFTER.W1tap, 'cells ' + TC.W1.cells + ', .pre [' + TC.W1.pre + '], tappable ' + TC.W1.taps]);
row('T2', () => [FIX_OK && TC.W1.done === T_AFTER.W1done, TC.W1.done]);
row('T3', () => [FIX_OK && TC.tap.toasts.length === 1 && TC.tap.toasts[0] === T_AFTER.toast && TC.tap.key !== 'mon', 'toasts ' + JSON.stringify(TC.tap.toasts) + ', currentDayKey ' + TC.tap.key]);
row('T4', () => [FIX_OK && TC.W4.cells === 7 && TC.W4.pre === T_AFTER.W4pre && TC.W4.taps === T_AFTER.W4tap, 'cells ' + TC.W4.cells + ', .pre [' + TC.W4.pre + '], tappable ' + TC.W4.taps]);
row('T5', () => [FIX_OK && TC.W4.done === T_AFTER.W4done, TC.W4.done]);
row('T6', () => [FIX_OK && TC.rest === T_AFTER.restEligible, TC.rest + ' of ' + PRE_REST_DAYS.length + ' eligible']);
row('T7', () => [/^Today · Thursday\b/.test(TC.W4.hero), TC.W4.hero.slice(0, 50)]);
row('T8', () => [FIX_OK && TC.sched === T_AFTER.sched, String(TC.sched)]);
row('T9', () => [!!TC.W1.heroHtml && !/(START|OPEN) SESSION/.test(TC.W1.heroHtml) && !/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/.test(TC.W1.hero), TC.W1.hero.slice(0, 60)]);
row('T10', () => [TC.streak === T_AFTER.streak, String(TC.streak)]);

// ── PAIR rows: candidate 221 against V220 ────────────────────────────────────
if(PAIR){
  const tP = secs();
  const LB = lattice(BASE), LB2 = lattice(BASE);
  pairRow('P1', () => {
    const self = LB.every((o, i) => o.jsonH === LB2[i].jsonH);
    let naSame = 0, naN = 0, alSame = 0, alDiff = 0, alN = 0;
    LROWS.forEach((r, i) => { if(r.aligned){ alN++; if(LC[i].jnbH === LB[i].jnbH) alSame++; if(LC[i].jsonH !== LB[i].jsonH) alDiff++; } else { naN++; if(LC[i].jsonH === LB[i].jsonH) naSame++; } });
    return [self && naN === 37 && alN === 365 && naSame === naN && alSame === alN && alDiff === alN,
      'V220 self ' + (self ? 'OK' : 'NOT REPRODUCIBLE') + '; non-aligned byte-identical ' + naSame + '/' + naN + '; aligned equal without blockOpen ' + alSame + '/' + alN + ', differ with it ' + alDiff + '/' + alN];
  });
  const WB = wizardRun(BASE, false), WB2 = wizardRun(BASE, false);
  pairRow('P2', () => {
    const self = WB.every((o, i) => o.landing && o.landing === WB2[i].landing);
    const n = WC.filter((o, i) => o.landing === WB[i].landing).length;
    return [self && n === WROWS.length, 'V220 self ' + (self ? 'OK' : 'NOT REPRODUCIBLE') + '; landing == V220 landing ' + n + '/' + WROWS.length + (n < WROWS.length ? '; e.g. ' + WROWS.filter((r, i) => WC[i].landing !== WB[i].landing).slice(0, 3).map(r => r.name).join(', ') : '')];
  });
  const TB = tableRead(BASE);
  pairRow('P3', () => {
    const rem = (TB.pops[0] || '').replace(/^reminder::/, '');
    const c = TB.W1.done === T_BEFORE.W1done && TB.W4.done === T_BEFORE.W4done && TB.W1.pre === '' && TB.W4.pre === '' && TB.W1.taps === 7
      && rem.indexOf(T_BEFORE.remind) === 0 && TB.remindKey !== null && TB.sched === T_BEFORE.sched && TB.rest === T_BEFORE.restEligible
      && TB.tap.key === 'mon' && TB.tap.toasts.indexOf(T_AFTER.toast) < 0;
    return [c, 'V220: W1 ' + TB.W1.done + ' pre [' + TB.W1.pre + '] taps ' + TB.W1.taps + ', W4 ' + TB.W4.done + ' pre [' + TB.W4.pre + '], reminder "' + rem.slice(0, 40) + '", sched ' + TB.sched + ', rest ' + TB.rest + '/7, W1 mon opens ' + (TB.tap.key === 'mon')];
  });
  console.log('  pair rows in ' + (secs() - tP).toFixed(1) + ' s');
} else PAIR_ROWS.forEach(k => pairRow(k, () => [false, 'no pair']));
done();
