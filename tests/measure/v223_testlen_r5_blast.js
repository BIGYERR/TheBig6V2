// v223_testlen_r5_blast.js — ONE-TIME blast-radius proof for D184 (c') row R5, build 3, V223. Not a gate row.
//
//   node tests/measure/v223_testlen_r5_blast.js <candidate.html> <pre-(c) tree.html>
//
// WHY A MEASURE AND NOT A GATE ROW. The (c') ruling's R5 compares the candidate against the PRE-(c) TREE (the D184
// tree with (a)(b) landed and (c) not, stamped 223). That tree existed only in the V223 build session's scratch, so a
// standing row could never run again (it would read UNRUNNABLE at 223 forever, and gate.sh passes no such file). The
// session ruled the comparison a one-time proof for this build. It ran once on the V223 candidate; its output is kept
// in tests/measure/v223_testlen_r5_blast.out.txt. The parts of R5 with a permanent baseline stay in
// tests/gates/g223_d184_testlen.js (R5: HALF_MANNY and g203; NRC0: the 210 NRC builds against V222, git 2694374).
//
// THE COMPARISON, exactly as g223_d184_testlen.js R5 ran it before the split:
//   M9's lattice (tests/measure/v223_testlen_m9.js): 2 goals (1.5 mi 12:00 mile 8:00; 1 mi 6:00 no mile) x 3 experience
//   x today Mon..Sun 2026-09-21..27 x test 0..7 days out x the 7 rest patterns = 2,352 builds, start = today, the clock
//   pinned to 21:16 local on each today. The (c) ORACLE is integer date arithmetic, never the resolver: the entered day
//   is not a Monday, every weekday from it through its Sunday is rest, and the test falls from it through that Sunday.
//   It splits M9 into the ruling's typed counts: 371 non-(c) on M8's cell (1.5 mi, intermediate) + 1,855 non-(c) wide,
//   21 + 105 (c).
//   M9N   every non-(c) build (2,226) is digest-identical (harness progDigest) to the pre-(c) tree's build of the same
//         cfg; the pre-(c) tree equals itself on every build first, and its digests are input-sensitive (>= 2 distinct).
//   NRC   M7's 210 dated race and run_base builds (run_5k, run_10k, run_half, run_marathon, run_base x 3 experience x
//         2 mile states x test Thursday of weeks 4,8,12,16,20,26,30 from Mon 2026-09-21, clock Tue 2026-09-22 21:16)
//         digest-identical to the pre-(c) tree, self-equal first, input-sensitive.
//   Controls: PAIR  both files read ia-version 223; the pre-(c) tree snaps cell A (today Thu 2026-09-24, rest thu..sun,
//         test Sat 2026-09-26) to Mon 2026-09-28 with no holdsTest, and the candidate keeps it at Thu 2026-09-24 with
//         holdsTest true (the ruling's R6 cell A), so the pair really is (c) against pre-(c).
//         SEE   every one of the 126 (c) builds differs from the pre-(c) tree (the digest can see (c): an empty diff
//         proves nothing).
// Seed pinned (4242), clock pinned, no clock field enters progDigest. Runs once under TZ=America/New_York and once under
// TZ=UTC (the gate's two zones); a child that dies or prints no CHILD summary is a FAIL. Prints PASS n FAIL n.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ERA = 223;
const ZONES = [['NY', 'America/New_York'], ['UTC', 'UTC']];
const ROWS = ['Z0', 'PAIR', 'COUNT', 'M9N', 'SEE', 'NRC'];
const stampOf = f => +((fs.readFileSync(f, 'utf8').match(/<meta name="ia-version" content="(\d+)"/) || [])[1]);

// ═════════════════════════════════════════════ PARENT ═════════════════════════════════════════════
if(!process.env.R5B_ZONE){
  let pass = 0, fail = 0;
  const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
  const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
  const CAND = process.argv[2] ? path.resolve(process.argv[2]) : '', PREC = process.argv[3] ? path.resolve(process.argv[3]) : '';
  if(!CAND || !PREC || !fs.existsSync(CAND) || !fs.existsSync(PREC)){ ok('usage: <candidate.html> <pre-(c) tree.html>, both present', false, J2([CAND, PREC])); done(); }
  const sha = f => require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  console.log('v223 R5 blast radius | candidate ' + CAND + ' ia-version ' + stampOf(CAND) + ' sha256 ' + sha(CAND));
  console.log('                     | pre-(c)   ' + PREC + ' ia-version ' + stampOf(PREC) + ' sha256 ' + sha(PREC));
  ok('both files read ia-version ' + ERA + ' (the build pair this proof is scoped to)', stampOf(CAND) === ERA && stampOf(PREC) === ERA, stampOf(CAND) + '/' + stampOf(PREC));
  if(stampOf(CAND) !== ERA || stampOf(PREC) !== ERA) done();
  for(const [tag, tz] of ZONES){
    console.log('\n-- TZ=' + tz + ' [' + tag + '] --');
    const t0 = Date.now();
    const r = cp.spawnSync(process.execPath, [__filename, CAND, PREC], { env: Object.assign({}, process.env, { TZ: tz, R5B_ZONE: tag }), encoding: 'utf8', maxBuffer: 1 << 26 });
    const out = r.stdout || '';
    for(const line of out.split('\n')){
      const m = /^(PASS|FAIL) \[(\w+)\] (\w+) /.exec(line);
      if(m){ if(m[2] === tag && ROWS.includes(m[3])) (m[1] === 'PASS' ? pass++ : fail++); console.log(line); }
      else if(line.trim() && !/^CHILD /.test(line)) console.log('  ' + line);
    }
    if(r.stderr && r.stderr.trim()) console.log('  stderr: ' + r.stderr.trim().split('\n').slice(-4).join(' | '));
    const s = /^CHILD (\w+) PASS (\d+) FAIL (\d+)\s*$/m.exec(out);
    const seen = ROWS.filter(k => new RegExp('^(PASS|FAIL) \\[' + tag + '\\] ' + k + ' ', 'm').test(out));
    ok('[' + tag + '] child under TZ=' + tz + ' ran every row and printed its CHILD summary (exit ' + r.status + ', ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)',
       !!s && s[1] === tag && seen.length === ROWS.length && +s[2] + +s[3] === ROWS.length,
       (s ? s[0] : 'no CHILD summary') + '; rows seen ' + seen.length + '/' + ROWS.length);
  }
  done();
}
function J2(v){ return JSON.stringify(v); }

// ═════════════════════════════════════════════ CHILD ══════════════════════════════════════════════
const TAG = process.env.R5B_ZONE, CAND = process.argv[2], PREC = process.argv[3];
let cpass = 0, cfail = 0;
function row(key, label, bad, total, note){
  const good = bad.length === 0 && total > 0, l = '[' + TAG + '] ' + key + ' ' + label;
  if(good){ cpass++; console.log('PASS ' + l + ' (' + total + '/' + total + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + l + ' (' + (total - bad.length) + '/' + total + (note ? '; ' + note : '') + '; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}
const J = v => JSON.stringify(v);

// ── the hand oracle: integers only (the gate's, verbatim) ──
const ymd = s => String(s).split('-').map(Number);
function sakamoto(y, m, d){ const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]; if(m < 3) y -= 1; return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7; }
function civ(y, m, d){
  y -= m <= 2 ? 1 : 0; const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
}
function fromCiv(z){
  z += 719468; const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)), mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
  return (yoe + era * 400 + (m <= 2 ? 1 : 0)) + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
const civI = s => civ(...ymd(s));
const W1MON = '2026-09-21';
const thuOfWeek = k => fromCiv(civI(W1MON) + (k - 1) * 7 + 3);
const ORD7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const offOf = iso => (sakamoto(...ymd(iso)) + 6) % 7;
const addDays = (iso, n) => fromCiv(civI(iso) + n);
const isC = (start, rest, race) => { const off = offOf(start), sun = civI(start) + 6 - off;
  return off > 0 && ORD7.slice(off).every(d => rest.includes(d)) && civI(race) >= civI(start) && civI(race) <= sun; };
const RESTS = { none:[], sun:['sun'], 'sun,wed':['sun','wed'], 'sat,sun':['sat','sun'], 'fri,sat,sun':['fri','sat','sun'], 'mon,wed,fri':['mon','wed','fri'], 'thu..sun':['thu','fri','sat','sun'] };
const G15 = '1.5mi 12:00 mile 8:00';
const GOALS_C = { [G15]: { id:'run_pace_goal', label:'x', targetDist:'1.5', paceUnit:'mi', mileBestMins:'8', mileBestSecs:'00', targetMins:'12', targetSecs:'0', targetTime:'12:00' },
  '1mi 6:00 no mile': { id:'run_pace_goal', label:'x', targetDist:'1', paceUnit:'mi', targetMins:'6', targetSecs:'0', targetTime:'6:00' } };

// ── clock pin, then the VMs (the gate's) ──
const RD0 = Date, NOW0 = new RD0(2026, 8, 22, 21, 16, 0).getTime();
let NOW = NOW0;
const setToday = iso => { const [y, m, d] = ymd(iso); NOW = new RD0(y, m - 1, d, 21, 16, 0).getTime(); };
class FD extends RD0 { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
globalThis.Date = FD;
function mkVM(file){
  const IA = H.load(file), els = new Map(), mk = IA.window.document.createElement;
  IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); };
  IA.eval('showToast = function(){}');
  return { IA, els };
}
function setWD(V, o){ V.IA.window.__O = o; V.IA.eval('WD = JSON.parse(JSON.stringify(__O))'); V.els.clear(); }
function gen(V){
  const IA = V.IA; IA.localStorage._map.clear(); IA.eval('activeProg = null');
  try { IA.eval('doGenerate()'); } catch(e){ return { err: 'doGenerate threw ' + e.message }; }
  IA.flushTimers(Infinity);
  const p = IA.eval('activeProg'); if(!p) return { err: 'no program' };
  return { p };
}
const one = (VM, o) => { setWD(VM, o); const g = gen(VM); return g.err ? 'ERR ' + g.err : H.progDigest(g.p); };
const V = mkVM(CAND), P = mkVM(PREC);

// ── Z0 zone ──
{ const off = (y, m, d) => new RD0(y, m - 1, d, 12).getTimezoneOffset(), bad = [];
  if(TAG === 'NY'){ if(!(off(2027, 3, 13) === 300 && off(2027, 3, 15) === 240)) bad.push('NY offsets ' + off(2027, 3, 13) + '/' + off(2027, 3, 15)); }
  else if(!(off(2027, 3, 13) === 0 && off(2027, 3, 15) === 0)) bad.push('UTC offsets ' + off(2027, 3, 13) + '/' + off(2027, 3, 15));
  row('Z0', 'CONTROL: the child runs in the zone the parent asked for', bad, 1, 'TZ=' + process.env.TZ); }

// ── PAIR: the pre-(c) tree snaps cell A, the candidate holds it ──
{ const bad = [], call = VM => JSON.parse(VM.IA.eval('JSON.stringify(resolveStartDate("2026-09-24", ["thu","fri","sat","sun"], "2026-09-26"))'));
  if(!isC('2026-09-24', RESTS['thu..sun'], '2026-09-26')) bad.push('oracle: cell A is not a (c) cell');
  setToday('2026-09-24');
  const a = call(P), c = call(V); NOW = NOW0;
  if(a.start !== '2026-09-28' || 'holdsTest' in a) bad.push('pre-(c) tree resolves cell A ' + J(a) + ' (a pre-(c) tree snaps it to 2026-09-28): UNRUNNABLE');
  if(c.start !== '2026-09-24' || c.holdsTest !== true) bad.push('candidate resolves cell A ' + J(c) + ' (a (c) tree keeps 2026-09-24 with holdsTest)');
  row('PAIR', 'CONTROL: cell A snaps to Mon 2026-09-28 on the pre-(c) tree and holds Thu 2026-09-24 on the candidate', bad, 2); }

// ── M9 lattice and the ruling's counts ──
const M9 = [];
for(const gl of Object.keys(GOALS_C)) for(const exp of ['intermediate', 'beginner', 'advanced']) for(let wd = 0; wd < 7; wd++) for(let du = 0; du <= 7; du++) for(const rk of Object.keys(RESTS)){
  const today = addDays(W1MON, wd), race = addDays(today, du);
  M9.push({ gl, exp, today, rk, race, m8: gl === G15 && exp === 'intermediate', c: isC(today, RESTS[rk], race) });   // start = today
}
const cnt = (m8, c) => M9.filter(x => x.m8 === m8 && x.c === c).length;
const N8 = cnt(true, false), NW = cnt(false, false), C8 = cnt(true, true), CW = cnt(false, true);
{ const bad = [];
  if(!(M9.length === 2352 && N8 === 371 && NW === 1855 && C8 === 21 && CW === 105))   // the ruling's typed counts
    bad.push('oracle vs the ruling: M9 ' + M9.length + ' non-(c) ' + N8 + ' + ' + NW + ' (c) ' + C8 + ' + ' + CW);
  row('COUNT', 'the (c) oracle splits M9 into the ruling\'s typed counts (2,352 = 371 + 1,855 non-(c) + 21 + 105 (c))', bad, 1,
    'M9 ' + M9.length + ': non-(c) ' + N8 + ' + ' + NW + ', (c) ' + C8 + ' + ' + CW); }

const cfgM9 = x => ({ primaryPath:'event', cardioTypes:['run'], experience:x.exp, ageBracket:'18-35', eventTargeted:true, raceDate:x.race, liftingFocus:'support_prevention',
  equipment:'crossfit', restDays:RESTS[x.rk], unit:'lbs', seed:4242, name:'M', cardioGoals:{ run:GOALS_C[x.gl] } });
const tagM9 = x => x.gl + ' ' + x.exp + ' today ' + x.today + ' rest ' + x.rk + ' test ' + x.race;

// ── M9N every non-(c) build digest-identical to the pre-(c) tree ──
{ const bad = [], NONC = M9.filter(x => !x.c); let eq8 = 0, eqW = 0, self = 0; const seen = new Set();
  for(const x of NONC){
    setToday(x.today);
    const o = cfgM9(x), b1 = one(P, o), b2 = one(P, o), c = one(V, o), tag = tagM9(x);
    if(!/^[0-9a-f]{16}$/.test(b1) || b1 !== b2){ bad.push(tag + ': the pre-(c) tree does not equal itself ' + b1 + '/' + b2); continue; }
    self++; seen.add(b1);
    if(c === b1) x.m8 ? eq8++ : eqW++; else bad.push(tag + ': ' + c + ' vs pre-(c) ' + b1);
  }
  NOW = NOW0;
  if(seen.size < 2) bad.push('the M9 pre-(c) digests are not input-sensitive (' + seen.size + ' distinct): an empty diff proves nothing');
  row('M9N', 'every non-(c) M9 build (371 on M8\'s cell + 1,855 wide) is digest-identical to the pre-(c) tree', bad, NONC.length,
    'M8 cell ' + eq8 + '/' + N8 + ', wide ' + eqW + '/' + NW + '; pre-(c) self-equal ' + self + '/' + NONC.length + ', ' + seen.size + ' distinct digests'); }

// ── SEE every (c) build differs from the pre-(c) tree ──
{ const bad = [], CS = M9.filter(x => x.c); let diff = 0;
  for(const x of CS){
    setToday(x.today);
    const o = cfgM9(x), b1 = one(P, o), c = one(V, o);
    if(!/^[0-9a-f]{16}$/.test(b1) || !/^[0-9a-f]{16}$/.test(c)) bad.push(tagM9(x) + ': ' + c + ' / pre-(c) ' + b1);
    else if(c !== b1) diff++; else bad.push(tagM9(x) + ': (c) build equals the pre-(c) build ' + c);
  }
  NOW = NOW0;
  row('SEE', 'CONTROL: every (c) M9 build (21 + 105) differs from the pre-(c) tree, so the digest sees (c)', bad, CS.length, 'differ ' + diff + '/' + CS.length); }

// ── NRC M7's 210 builds unmoved against the pre-(c) tree ──
{ const bad = []; let nEq = 0, nSelf = 0, n = 0; const seenN = new Set();
  NOW = NOW0;
  for(const gid of ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base']) for(const exp of ['beginner', 'intermediate', 'advanced']) for(const mile of [null, 480]) for(const k of [4, 8, 12, 16, 20, 26, 30]){
    n++;
    const o = { primaryPath:'event', cardioTypes:['run'], experience:exp, ageBracket:'18-35', eventTargeted:true, raceDate:thuOfWeek(k), liftingFocus:'support_prevention',
      equipment:'crossfit', restDays:['sun','wed'], unit:'lbs', seed:4242, name:'M', cardioGoals:{ run:Object.assign({ id:gid, label:'x', paceUnit:'mi' }, mile ? { mileBestMins:'8', mileBestSecs:'00' } : {}) } };
    const b1 = one(P, o), b2 = one(P, o), c = one(V, o), tag = gid + ' ' + exp + ' mile ' + (mile ? '8:00' : 'none') + ' k' + k;
    if(!/^[0-9a-f]{16}$/.test(b1) || b1 !== b2){ bad.push(tag + ': the pre-(c) tree does not equal itself ' + b1 + '/' + b2); continue; }
    nSelf++; seenN.add(b1);
    if(c === b1) nEq++; else bad.push(tag + ': ' + c + ' vs pre-(c) ' + b1);
  }
  if(n !== 210) bad.push('lattice ' + n + ' builds, want 210');
  if(seenN.size < 2) bad.push('the 210 NRC pre-(c) digests are not input-sensitive (' + seenN.size + ' distinct)');
  row('NRC', 'M7\'s 210 race and run_base builds are digest-identical to the pre-(c) tree', bad, n,
    'identical ' + nEq + '/210; pre-(c) self-equal ' + nSelf + '/210, ' + seenN.size + ' distinct digests'); }

console.log('CHILD ' + TAG + ' PASS ' + cpass + ' FAIL ' + cfail);
