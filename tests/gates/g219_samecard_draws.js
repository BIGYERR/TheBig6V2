// g219_samecard_draws.js — GATE for the four V219 draw-site twin rulings: D159, D164 (both slices), D165, D166.
//
//   node tests/gates/g219_samecard_draws.js [candidate]
//   env G219_SHARDS  worker count (default 4; empty/unset means 4). Internal: --shard i/N --out <json>.
//
// THE RULINGS THIS DEFENDS (coach, verbatim core):
//   D159  "A one-item Leg isolation is honest volume; a two-item one holding the day's superset A movement is a doubled
//         prescription under an isolation label. Ruled cfA. A name printed twice on one card is a defect in all four
//         classes found (D159, D164, D165, D166); none is deliberate volume. Fix each at its draw site. The cfB
//         day-level oracle becomes a ratchet gate on the wide lattice (2,840 duplicate days, may only fall)."
//   D164  "The chest accessory draws see the plan's name. Duplicates -> 0 (1,121 swap-target dup days on
//         shoulder/workaround). Shoulder/workaround Chest + knee sections with no chest movement 821 -> 891 (+70,
//         4 sections lost whole), pinned as an equality that expires on D169. Slice 2: the elbow Biceps draw (68 days)."
//   D165  "The unilateral slot must differ from the Main; twins 907 -> 0."
//   D166  "When cond[2] is the Main, Pull superset B prints the row alone; 800 twin days become a one-item Pull [row]."
//
// ORACLES. The day card is its own oracle; no engine function is asked what a card should be. The card classifiers
// and twin definitions are LIFTED VERBATIM from measure's instrument, tests/measure/v219_chain_rebaseline.js
// (cardInfo, clean, stem, live, CHEST), so these counts are measure's counts, not a new instrument:
//   DUP   a name (clean, lower-cased) on 2 or more items of one live card.
//   LI    D159: a "Leg isolation" section holds a name that is on 2 or more items of the card.
//   TGT   D164 slice 1: a DUP name that is a shoulder/workaround swap target. The target set is HAND-TYPED here
//         ({dumbbell floor press}); measure derived the same set from V218's injuryPlan().swapNames over the six
//         tiers (SWAP_GEAR_FALLBACK is empty), printed identically on V218 and on the chain.
//   CK    D164 slice 1: shoulder/workaround sections labelled "Chest + knee"; CKNO those with no item matching
//         /press|pushup|dips|crossover|pec deck|fly/i.
//   C165  D165: the Main's name inside Leg superset A or Leg circuit.
//   C166  D166: the Main's name inside Pull superset B.
//   BIC1  D164 slice 2: elbow/workaround live days whose "Biceps" section holds exactly one item. Lifted verbatim
//         from tests/measure/v220_d164_ck_link.js --blast (s2resid). On V218 the Biceps draw can pick two names the
//         elbow plan renames to one; the injury pass keeps one and the section prints alone. BIC1 is NOT in
//         /tmp/v219_merge.txt: its two pins were observed by this instrument on /tmp/base_V218.html and on
//         /tmp/v219_cf_chain.html (the V219 candidate): 456 -> 412, and flagged for measure to confirm. The fall of 44 is
//         measure's own number: "single4 | WIDE | days with more items: 44" (slice 2 alone on V218, 68 days moved).
// LATTICE. WIDE, 13,104 configs, copied verbatim from v219_chain_rebaseline.js (lat 'W'); CK = its 1,008
//   shoulder/workaround configs; BIC1 reads its 1,008 elbow/workaround configs.
// PINS. Every WIDE value below is measure's (/tmp/v219_merge.txt, rows "base | WIDE" and "s7 | WIDE"; an absent s7 row
//   is 0), except BIC1 (above).
//
// VERSION PREDICATE (standing rulings 2 and 4). Era rows keyed on ia-version; row existence is a conjunct:
//   <=218  the V218 picture (every twin class still present).
//   219    the four rulings shipped. A version with no row FAILS every era row until a ruling adds one.
// ROWS
//   S0  lattice is 13,104 WIDE configs (1,008 CK, 1,008 elbow/workaround); every shard walked; no build crashed.
//   S1  the D164 repro config is on the lattice exactly once and builds identically twice (self-equality).
//   R1  DUP days <= row (RATCHET: 2,840 on V218, 0 at V219; may only fall).
//   R2  D159: LI days == row.
//   R3  D164 slice 1: TGT days on shoulder/workaround == row.
//   R4  D164 slice 1: CK sections == row.
//   R5  D164 slice 1: CKNO sections == row (EQUALITY; the V219 value expires on D169).
//   R6  D164 slice 2: BIC1 days == row.
//   R7  D165: C165 days == row.
//   R8  D166: C166 days == row.
//   F1  D164 repro, W1 mon "Chest volume": the era row's text (V218 the doubled floor press, V219 Pec deck).
//   F2  D164 repro, W1 mon: no name prints twice on the card (219 row only; V218's row expects the twin).
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

let SHARD_I = null, SHARD_N = 0, OUT = '', ART = path.join(__dirname, '..', '..', 'index.html');
{ const a = process.argv.slice(2); const pos = [];
  for(let i = 0; i < a.length; i++){
    if(a[i] === '--shard'){ const m = String(a[++i] || '').split('/'); SHARD_I = parseInt(m[0], 10); SHARD_N = parseInt(m[1], 10); }
    else if(a[i] === '--out') OUT = a[++i];
    else pos.push(a[i]); }
  if(pos[0]) ART = pos[0]; }
const WORKER = SHARD_I !== null;
if(WORKER) console.log = function(){};   // a worker writes counters, never a verdict
const cl = o => JSON.parse(JSON.stringify(o));

// ── WIDE lattice (verbatim, v219_chain_rebaseline.js lat 'W') ─────────────────
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS2 = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, gi, f, exp, age, si, inj){ const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs', restDays: RESTS2[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj; return c; }
const TIERS6 = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const INJ = [null]; REG.forEach(r => ITIER.forEach(t => INJ.push({ region:r, tier:t })));
const U = [];
for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj); c.restDays = RESTS2[ri].slice();
  U.push({ lat:'W', eq, ik: inj ? inj.region + '/' + inj.tier : 'healthy', f, c }); })))));

// ── card oracles (verbatim, v219_chain_rebaseline.js; the posterior counter is not read here) ──
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const CHEST = /press|pushup|dips|crossover|pec deck|fly/i;
function cardInfo(day){ const L = live(day); const o = { live:L.length > 0, dup:[], li:0, c165:0, c166:0, ck:0, ckNo:0, items:0, secs:L.length };
  if(!L.length) return o; const where = {};
  L.forEach(s => s.items.forEach(it => { o.items++; const k = clean(it.name).toLowerCase(); if(k) (where[k] = where[k] || []).push(stem(s)); }));
  o.dup = Object.keys(where).filter(k => where[k].length >= 2).map(k => [k, where[k].slice().sort().join(' + ')]);
  if(L.some(s => /^Leg isolation/.test(String(s.label || '')) && s.items.some(i => where[clean(i.name).toLowerCase()].length >= 2))) o.li = 1;
  const main = L.find(s => stem(s) === 'Main'); const mn = main ? clean(main.items[0].name).toLowerCase() : null;
  if(mn){ if(L.some(s => /^(Leg superset A|Leg circuit)$/.test(stem(s)) && s.items.some(i => clean(i.name).toLowerCase() === mn))) o.c165 = 1;
    if(L.some(s => stem(s) === 'Pull superset B' && s.items.some(i => clean(i.name).toLowerCase() === mn))) o.c166 = 1; }
  L.forEach(s => { if(/^Chest \+ knee/.test(String(s.label || ''))){ o.ck++; if(!s.items.some(i => CHEST.test(clean(i.name)))) o.ckNo++; } });
  return o; }
// HAND-TYPED swap-target set (see header). Lower-case, as DUP keys are.
const TGT = { 'shoulder/workaround': new Set(['dumbbell floor press']) };
const tag = x => (x.eq + ' ' + x.ik + ' ' + x.f + ' ' + x.c.experience + ' ' + x.c.ageBracket + ' seed ' + x.c.seed + ' rest ' + x.c.restDays.join('/') + ' goal ' + x.c.cardioGoals.run.id);

// ── worker ────────────────────────────────────────────────────────────────────
function runShard(){
  const T = { n:0, crash:0, dup:0, li:0, tgt:0, ck:0, ckNo:0, bic1:0, c165:0, c166:0, nCK:0, nEW:0 }, EX = { crash:[], dup:[] };
  try {
    const X = load(ART);
    for(let i = 0; i < U.length; i++){ if(i % SHARD_N !== SHARD_I) continue;
      const x = U[i]; T.n++; if(x.ik === 'shoulder/workaround') T.nCK++; if(x.ik === 'elbow/workaround') T.nEW++;
      let P; try { P = X.buildProgram(cl(x.c)); } catch(e){ T.crash++; if(EX.crash.length < 3) EX.crash.push(tag(x) + ' :: ' + e.message); continue; }
      Object.keys(P.weeks).forEach(w => DAYS.forEach(d => { if(!P.weeks[w] || P.weeks[w][d] === undefined) return;
        const y = P.weeks[w][d], c = cardInfo(y);
        if(x.ik === 'elbow/workaround'){ const b = live(y).find(z => z.label === 'Biceps'); if(b && b.items.length === 1) T.bic1++; }
        if(!c.live) return;
        if(c.dup.length){ T.dup++; if(EX.dup.length < 3) EX.dup.push(tag(x) + ' W' + w + ' ' + d + ' :: ' + c.dup.map(z => z.join(' @ ')).join('; ')); }
        if(c.li) T.li++;
        if(TGT[x.ik] && c.dup.some(([n]) => TGT[x.ik].has(n))) T.tgt++;
        if(x.ik === 'shoulder/workaround' && c.ck){ T.ck += c.ck; T.ckNo += c.ckNo; }
        if(c.c165) T.c165++; if(c.c166) T.c166++; })); }
    fs.writeFileSync(OUT, JSON.stringify({ ok:true, T, EX }));
  } catch(e){ try { fs.writeFileSync(OUT, JSON.stringify({ ok:false, err:String((e && e.message) || e), T })); } catch(e2){} }
  process.exit(0);   // ALWAYS 0. The parent grades the FILE, never the exit code.
}

// ── parent ────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0, SCRATCH = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
// ERA ROWS. Values from /tmp/v219_merge.txt ("base | WIDE" = V218, "s7 | WIDE" = the V219 candidate), BIC1 excepted.
const ERA = {
  218: { dup:2840, li:12, tgt:1121, ck:4774, ckNo:821, bic1:456, c165:907, c166:800,
         fx:{ start:'Dumbbell floor press 3×15', noDup:false } },   // V218: the Chest volume draw repeats the Main
  219: { dup:0, li:0, tgt:0,
         ck:4770, ckNo:891,   // D164 EQUALITY, EXPIRES ON D169: +70 no-chest sections, 4 Chest + knee sections lost whole
         bic1:412,            // D164 slice 2: 456 -> 412, the 44 days measure printed as "single4 | WIDE | days with more items: 44"
         c165:0, c166:0,
         fx:{ exact:'Pec deck 3×12–15 @ RPE 6–7', noDup:true } } };
ERA[220] = ERA[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; the D164 R4/R5 EQUALITY still expires on D169, not shipped here)
ERA[221] = ERA[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 adds a _REP_FLOOR row read by scheme(), and 0 engine cards change: measure 0/1,201,231, builder 0/903,969; D178/D179/D180 are zero-engine: Programs/loader, day-close UI, refreshProgram copy-back of a display flag; gatekeeper pre-flight 2026-09-24: g219 15/0 on the candidate stamped 220)
ERA[222] = ERA[221];   // V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only: nothing in buildProgram, 0 engine cards change; the ruling states HALF_MANNY 0ac7da6b1691a8e1 unchanged)
function shardCount(){ const raw = process.env.G219_SHARDS === undefined ? '' : String(process.env.G219_SHARDS);
  if(raw === '') return 4;
  if(!/^[0-9]+$/.test(raw) || parseInt(raw, 10) < 1){ fail++; console.log("FAIL: CONFIG: G219_SHARDS must be a positive integer, or empty/unset which means 4; got '" + raw + "'"); return 0; }
  return parseInt(raw, 10); }
function done(){ if(SCRATCH) try { fs.rmSync(SCRATCH, { recursive:true, force:true }); } catch(e){}
  console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }

function runParent(){
  const IA = load(ART), VER = +IA.version, ROW = ERA[VER <= 218 ? 218 : VER];
  const noRow = ROW ? '' : ' (NO ERA ROW for ia-version ' + VER + ')';
  console.log('g219_samecard_draws: candidate ' + ART + ' ia-version ' + VER + ' era row ' + (ROW ? (VER <= 218 ? '<=218' : VER) : 'NONE'));
  // S1 + F1/F2: the D164 repro fixture, the lattice's own config.
  const FX = U.filter(x => x.eq === 'commercial' && x.ik === 'shoulder/workaround' && x.f === 'hypertrophy' && x.c.experience === 'beginner'
    && x.c.seed === 4242 && x.c.restDays.join('/') === 'sun/wed');
  ok('S1a D164 repro (commercial, shoulder/workaround, hypertrophy, beginner, 55+, seed 4242, rest sun/wed) is on the lattice exactly once',
     FX.length === 1 && FX[0].c.ageBracket === '55+', FX.length);
  let card = null;
  if(FX.length === 1){ const p1 = IA.buildProgram(cl(FX[0].c)), p2 = IA.buildProgram(cl(FX[0].c));
    ok('S1b the repro builds identically twice (self-equality before any pin is read)', progDigest(p1) === progDigest(p2));
    card = p1.weeks[1] && p1.weeks[1].mon; }
  const cv = card ? live(card).filter(s => s.label === 'Chest volume') : [];
  const cvTxt = cv.length === 1 ? cv[0].items.map(i => clean(i.name) + ' ' + i.detail).join(' / ') : '(Chest volume sections: ' + cv.length + ')';
  console.log('   repro W1 mon Chest volume: ' + cvTxt);
  const fx = ROW && ROW.fx, fxOk = !!fx && cv.length === 1 && cv[0].items.length === 1 &&
    (fx.exact ? cvTxt === fx.exact : cvTxt.indexOf(fx.start) === 0);
  ok('F1 D164 repro W1 mon Chest volume reads the era row (' + (fx ? (fx.exact || fx.start + '…') : '-') + ')' + noRow, fxOk, cvTxt);
  if(card){ const ci = cardInfo(card);
    ok('F2 D164 repro W1 mon: a name printed twice on the card is ' + (fx && fx.noDup ? 'absent' : 'present (the V218 twin)') + noRow,
       !!fx && (fx.noDup ? ci.dup.length === 0 : ci.dup.some(([n]) => n === 'dumbbell floor press')), JSON.stringify(ci.dup)); }
  else ok('F2 D164 repro W1 mon card exists', false);

  const N = shardCount(); if(!N) return done();
  SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'g219sc-'));
  const outs = [], errs = []; let left = N; const t0 = Date.now();
  for(let i = 0; i < N; i++){ const of = path.join(SCRATCH, 'shard_' + i + '.json'); outs.push(of); errs.push('');
    const ch = cp.spawn(process.execPath, [__filename, ART, '--shard', i + '/' + N, '--out', of], { stdio:['ignore','ignore','pipe'] });
    let fired = false; const fin = () => { if(fired) return; fired = true; if(--left === 0) merge(); };
    ch.stderr.on('data', d => { errs[i] += String(d); }); ch.on('error', e => { errs[i] += String((e && e.message) || e); fin(); }); ch.on('close', fin); }
  function merge(){
    const T = { n:0, crash:0, dup:0, li:0, tgt:0, ck:0, ckNo:0, bic1:0, c165:0, c166:0, nCK:0, nEW:0 }; let EXd = [], EXc = [], shardsOk = true;
    for(let i = 0; i < N; i++){ let j = null; try { const t = fs.readFileSync(outs[i], 'utf8'); if(t) j = JSON.parse(t); } catch(e){}
      if(!j || j.ok !== true || !j.T.n){ shardsOk = false; console.log('   shard ' + i + '/' + N + ' unusable' + (j && j.err ? ' -> ' + j.err : '') + (errs[i] ? ' | stderr: ' + errs[i].slice(-400).trim() : '')); continue; }
      Object.keys(T).forEach(k => { T[k] += j.T[k]; }); EXd = EXd.concat(j.EX.dup); EXc = EXc.concat(j.EX.crash); }
    console.log('   sweep ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s on ' + N + ' workers; counters ' + JSON.stringify(T));
    if(EXd.length) console.log('   dup examples: ' + EXd.slice(0, 3).join(' | '));
    if(EXc.length) console.log('   crash examples: ' + EXc.slice(0, 3).join(' | '));
    ok('S0a WIDE lattice enumerates 13,104 configs (1,008 shoulder/workaround, 1,008 elbow/workaround)',
       U.length === 13104 && U.filter(x => x.ik === 'shoulder/workaround').length === 1008 && U.filter(x => x.ik === 'elbow/workaround').length === 1008, U.length);
    ok('S0b every shard produced counters and the union walked the whole lattice', shardsOk && T.n === U.length && T.nCK === 1008 && T.nEW === 1008, T.n + '/' + T.nCK + '/' + T.nEW);
    ok('S0c no config crashed', T.crash === 0, T.crash);
    const R = ROW || {};
    ok('R1 D159 cfB RATCHET: duplicate days (a name on 2+ items of one card) <= ' + R.dup + ' (V218 2,840; V219 0; may only fall)' + noRow, !!ROW && T.dup <= R.dup, T.dup);
    ok('R2 D159: Leg isolation holding an on-card name == ' + R.li + ' days (V218 12)' + noRow, !!ROW && T.li === R.li, T.li);
    ok('R3 D164 slice 1: shoulder/workaround swap-target duplicate days == ' + R.tgt + ' (V218 1,121)' + noRow, !!ROW && T.tgt === R.tgt, T.tgt);
    ok('R4 D164 slice 1: shoulder/workaround Chest + knee sections == ' + R.ck + ' (V218 4,774; V219 4,770 expires on D169)' + noRow, !!ROW && T.ck === R.ck, T.ck);
    ok('R5 D164 slice 1: Chest + knee sections with no chest movement == ' + R.ckNo + ' (V218 821; V219 891 EQUALITY, expires on D169)' + noRow, !!ROW && T.ckNo === R.ckNo, T.ckNo);
    ok('R6 D164 slice 2: elbow/workaround days whose Biceps prints one item == ' + R.bic1 + ' (builder-observed pin, see header)' + noRow, !!ROW && T.bic1 === R.bic1, T.bic1);
    ok('R7 D165: Main echoed in Leg superset A or Leg circuit == ' + R.c165 + ' days (V218 907)' + noRow, !!ROW && T.c165 === R.c165, T.c165);
    ok('R8 D166: Main echoed in Pull superset B == ' + R.c166 + ' days (V218 800)' + noRow, !!ROW && T.c166 === R.c166, T.c166);
    done(); }
}
if(WORKER) runShard(); else runParent();
