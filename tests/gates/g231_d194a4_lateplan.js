// g231_d194a4_lateplan.js — D194 Amendment 5: the whole-day boot re-filter on a LATE plan change gets its own live row.
//   node tests/gates/g231_d194a4_lateplan.js <candidate.html> [baseline]   (the baseline argument is ignored: one tree)
//
// RULING   tests/measure/v231_rulings/d194_amendment5_s32.md §2 (this file) and §3 (S32's spec entry). Gate scope only, no
//          new D-code. KEYED (standing ruling 4) to D194 R1 ("the plan that governs a card is the plan of the day the card
//          is on") and D194 Amendment 4 (tests/measure/v229_rulings/d194_injlens_ruling.md :356–:430: "`applySessionSwaps`'
//          whole-day re-filter" deliberately unchanged), the rulings that own the behaviour.
// VERSION  `VER >= 230` (VER = the candidate's ia-version meta) is the first conjunct of every row. Below 230 the file
//          REFUSES: a column-0 REFUSED line and every row FAILS by name. The whole-day re-filter under `_dayPlanCfg`
//          shipped at V230 and V231 changed no byte of `applySessionSwaps`, so V230 as candidate PASSES every row; the
//          discrimination is row a4-ctl (an in-gate counterfactual, presence-checked: the g231_d198_hepdraw D198-c
//          precedent), not a V230 failure. No `VER === 231` literal: nothing here is a direction found wrong.
//
// PRESENTATION  the D190 lattice's six injured cells (the g227/g228/g230 fixture): Mario's shape commercial | beginner |
//          support_strength | sun,wed | seed 76308 (cfg.seed pinned), startDate 2026-08-24, region in knee, ankle, hip,
//          lowback, shoulder, elbow. Four late-plan presentations; every overlay written by the app's `applyInjuryDraft`
//          (_ovDraft.injRegion/injTier/from), every swap by the app's `applySwapChoice`; clock pinned per presentation
//          (FD Date class):
//            PRE1  uninjured program; swaps; overlay <region>/workaround from 2026-08-24; clock 2026-08-24.
//            PRE5  uninjured program; swaps on W>=5 only; overlay from 2026-09-21 (W5 Monday); clock 2026-09-24.
//            OVOV  OV1 program (overlay <region>/workaround from W1, id/created normalised); swaps; then a second overlay
//                  OTHER(region)/workaround from 2026-08-24 (OTHER typed below, wrapping).
//            OVT   OV1 program; swaps; then <region>/protect from 2026-08-24.
//          Round r swaps the r-th card (cardsOf order) of every pierced lifting day in ONE live session (first offered
//          candidate not already on the day, up to two tries), max 8 rounds; after the late overlay the SAME localStorage
//          boots a fresh VM (refreshProgram), and that VM's store boots a second fresh VM (reboot).
// METHOD   tests/measure/v231_s32.js :60–:87 (fresh, setup, bootFrom, stored, trySwap, the HELP shim without __idem, the
//          FD Date class), carried here with the coach6 prototype's `want` argument on trySwap
//          (tests/measure/v231_coach6_lateplan_proto.js :30–:33). Each (tree, presentation, cell) runs in its own node
//          worker; the parent only aggregates.
// ORACLES  Nothing below asks the engine what the answer should be. `_dayPlanCfg` is read only for an INFO column printed
//          beside the hand plan (M20's pinjMismatch); `applyInjuryFilter` is never called by this file.
//            HAND PLAN     per (presentation, week), typed from the ruling (handPlan below).
//            HAND NOJUMPS  knee, ankle (both tiers), typed from injuryPlan :7974 and :7988.
//            HAND JUMPS    the eight names on these grids and their swap universes that JUMPS :8122 matches (the
//                          ruling's printed list). A typed list, not the regex.
//            TYPED CARDS   M20's three examples, verbatim from the ruling (format Label{name|detail;…}, SVG stripped).
//            TYPED FIGURES the ruling's denominators and mutant figures: INFO, printed with an `== typed` flag, never
//                          asserted (a later ruling that moves the D190 swap lists must not read as a regression here).
// ROWS     a4-dedupe   no section carries one item name twice on any booted day under a hand plan.
//          a4-nojumps  no hand-jump-list name on a booted day whose hand plan region is knee or ankle.
//          a4-cards    T1, T2, T3 boot to the typed literal (the `to` must be in the app's offered list).
//          a4-reach    every presentation lands > 0 swaps and judges > 0 days; the stored state is self-identical (clock
//                      fields stripped); reboot == boot on every booted day.
//          a4-ctl      S32's replacement applied in-gate to this file's own copy of the candidate (anchor count must be 1)
//                      and the shard re-run on it: a4-dedupe >= 1, a4-nojumps >= 1, a4-cards < 3.
// SABOTAGE S32-D194-A4 (tests/sabotage/v230_d194.json): EXPECTED a4-dedupe 18, a4-nojumps 26, a4-cards 0 of 3; a4-ctl also
//          fails on the mutant (its anchor is gone). Mutant summary PASS 1 FAIL 4.
// Temp files: the in-gate S32 copy goes under os.tmpdir() (run with TMPDIR set to the scratch path) and is removed on exit.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const { load } = require(path.join(ROOT, 'tests', 'harness.js'));

const ERA = 230, RMAX = 8, POOL = 4, WORKER_TIMEOUT_MS = 300000;
const START = '2026-08-24';
const PRES = ['PRE1', 'PRE5', 'OVOV', 'OVT'];
const FROMS = { PRE1:START, PRE5:'2026-09-21', OVOV:START, OVT:START };
const CLOCKS = { PRE1:START, PRE5:'2026-09-24', OVOV:START, OVT:START };
const BASE = { PRE1:'UNINJ', PRE5:'UNINJ', OVOV:'OV1', OVT:'OV1' };
const REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'];
const OTHER = { knee:'ankle', ankle:'hip', hip:'lowback', lowback:'shoulder', shoulder:'elbow', elbow:'knee' };

// ── LITERALS FROM THE RULING ──────────────────────────────────────────────────────────────────────────────────────
// the late overlay each presentation writes, and the HAND PLAN per (presentation, week)
const lateInj = (pres, region) => pres === 'OVOV' ? { region:OTHER[region], tier:'workaround' } : pres === 'OVT' ? { region, tier:'protect' } : { region, tier:'workaround' };
const handPlan = (pres, region, w) => (pres === 'PRE5' && w < 5) ? null : lateInj(pres, region);
const HAND_NOJUMPS = new Set(['knee', 'ankle']);
const HAND_JUMPS = new Set(['Broad jumps', 'Burpees', 'High knees', 'Jump squats', 'Lateral bounds', 'Skater bounds', 'Trap bar jump', 'Tuck jumps']);
const TYPED = [
  { id:'T1', pres:'PRE1', region:'knee', w:3, d:'sat', from:'Mountain climbers', to:'High knees',
    boot:'Strength{Decline pushups|2 sets — RPE 7 (leave 3 or more in reserve);Feet-elevated inverted rows|2 sets — RPE 7 (leave 3 or more in reserve)}' },
  { id:'T2', pres:'OVOV', region:'ankle', w:5, d:'tue', from:'Incline dumbbell curl', to:'Barbell curl',
    boot:'Main — Sumo deadlift{Sumo deadlift|4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest} Pull superset A{Barbell row|2×6–10 @ RPE 8;L-sit chinups|2 sets — RPE 8 (stop 2 reps short of failure)} Pull{Dumbbell row|2×8–12 each @ RPE 8} Biceps{Barbell curl|3×10–12 @ RPE 8}' },
  { id:'T3', pres:'OVT', region:'hip', w:5, d:'sat', from:'Mountain climbers', to:'Burpees',
    boot:'Strength{Decline pushups|2 sets — RPE 7 (leave 3 or more in reserve);Inverted rows (rings)|2 sets — RPE 8 (stop 2 reps short of failure)} Explosive finisher{Burpees|2×15}' },
];
// S32-D194-A4's anchor and replacement (tests/sabotage/v230_d194.json), typed
const S32_ANCHOR = '      day.sections=applyInjuryFilter(day.sections,_dayPlanCfg(prog,day));\n';
const S32_REPL = "      _renamed.forEach(it=>{ const _f=applyInjuryFilter([{label:'x',items:[{name:it.name,detail:it.detail}]}],_dayPlanCfg(prog,day)); const _g=_f&&_f[0]&&_f[0].items&&_f[0].items[0]; if(_g&&_g.name===it.name) it.detail=_g.detail; });\n";
// the era's typed denominators and mutant figures (INFO only, `== typed`)
const TYPED_DEN = { PRE1:{ swaps:996, skips:120, boots:1764, judged:1260, persist:755 }, PRE5:{ swaps:330, skips:42, boots:1764, judged:420, persist:252 },
  OVOV:{ swaps:952, skips:132, boots:1764, judged:1260, persist:694 }, OVT:{ swaps:952, skips:132, boots:1764, judged:1260, persist:641 } };
const TYPED_MUT = { dup:{ PRE1:4, PRE5:4, OVOV:2, OVT:8 }, jump:{ PRE1:16, PRE5:4, OVOV:6, OVT:0 }, persist:{ PRE1:813, PRE5:272, OVOV:742, OVT:641 }, cards:0 };
const TYPED_REBOOT = 7056, TYPED_JUDGED = 4200;

const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const clone = x => JSON.parse(JSON.stringify(x));
const CELLS = REGS.map(g => ({ k:g + '/workaround|commercial|beginner|support_strength|sun,wed', region:g, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:'workaround' } }) }));

// ── HELPERS (method: tests/measure/v231_s32.js) ───────────────────────────────────────────────────────────────────
const CLK = /^_?(ts|at|time|stamp|clock|now|created)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const sig = dy => !dy || !dy.sections ? '(none)' : dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '')).join(';') + '}').join(' ');
const cardsOf = dy => { const o = []; (dy && dy.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name) o.push({ si, ii, n:it.name, d:it.detail || '' }); })); return o; };
const dayKeys = W => { const o = []; Object.keys(W).forEach(w => Object.keys(W[w] || {}).forEach(d => { const dy = W[w][d]; if(dy && Array.isArray(dy.sections) && dy.sections.some(s => s && s.items && s.items.length)) o.push([+w, d]); })); return o; };
const cnt = (t, s) => t.split(s).length - 1;
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}";
// INFO only: the engine's day plan beside the hand plan (never asserted)
const PLAN_INFO = "JSON.stringify((function(){var o={};Object.keys(activeProg.weeks).forEach(function(w){Object.keys(activeProg.weeks[w]||{}).forEach(function(d){var dy=activeProg.weeks[w][d];if(dy&&dy.sections){var pc=_dayPlanCfg(activeProg,dy);o[w+'|'+d]=(pc&&pc.injury)||null;}});});return o;})())";
const E = (X, c) => X.eval(c);

// hand judgement of one booted day under the hand plan
function judge(dy, hi){ const r = { dup:0, jump:0, dupEx:null, jumpEx:null };
  (dy && dy.sections || []).forEach(s => { const names = (s.items || []).map(it => clean(it && it.name)); const seen = new Set();
    names.forEach(n => { if(seen.has(n)){ r.dup++; r.dupEx = r.dupEx || (clean(s.label) + '{' + names.join(';') + '}'); } seen.add(n);
      if(HAND_NOJUMPS.has(hi.region) && HAND_JUMPS.has(n)){ r.jump++; r.jumpEx = r.jumpEx || (clean(s.label) + ':' + n); } }); });
  return r; }

// ── WORKER: one (tree, presentation, cell) ────────────────────────────────────────────────────────────────────────
function worker(TREE, pres, ri){
  const cell = CELLS[ri], c = cell.c, region = cell.region, t0 = Date.now();
  const rec = { k:cell.k, region, pres, err:null, rounds:0, swaps:0, skips:0, boots:0, judged:0, judgedNJ:0, dup:0, jump:0, dupEx:[], jumpEx:[], rebootNe:0, rebootEx:null, persist:0, swDays:0, planN:0, planMis:0, selfSt:false, typed:[] };
  const fresh = () => { const X = load(TREE); const T = new Date(CLOCKS[pres] + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } X.ctx.Date = FD; E(X, HELP); return X; };
  const setup = (X, st) => { X.localStorage.clear(); X.ctx.__SP = JSON.parse(st); E(X, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); };
  const bootFrom = (src, dst) => { const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); };
  const weeksOf = X => JSON.parse(E(X, 'JSON.stringify(activeProg.weeks)'));
  const dayJ = (X, w, d) => JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')'));
  const writeOverlay = (X, oi, from) => { const n0 = +E(X, 'JSON.stringify((activeProg.overlays||[]).length)');
    E(X, "_ovDraft.injRegion=" + JSON.stringify(oi.region) + ";_ovDraft.injTier=" + JSON.stringify(oi.tier) + ";_ovDraft.from='" + from + "';applyInjuryDraft();");
    if(+E(X, 'JSON.stringify((activeProg.overlays||[]).length)') !== n0 + 1) throw new Error('overlay not written ' + oi.region + '/' + oi.tier + ' from ' + from); };
  const stored = () => { const X = fresh(); const cfg = clone(c); delete cfg.injury; const s = clone(X.buildProgram(clone(cfg))); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); let j = JSON.stringify(s);
    if(BASE[pres] === 'OV1'){ setup(X, j); writeOverlay(X, { region, tier:'workaround' }, START);
      const o = JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM'); if(!(o.overlays || []).length) throw new Error('OV1 overlay not stored');
      o.overlays.forEach(v => { v.id = 'ov_fixed'; v.created = 1; }); j = JSON.stringify(o); }
    return j; };
  const trySwap = (X, w, d, card, used, want) => { E(X, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); let cs = [];
    try { cs = JSON.parse(E(X, "JSON.stringify(__cands(activeProg.weeks[" + w + "]." + d + "," + w + "," + JSON.stringify(card.n) + "))")); } catch(e){ return { err:'cands' }; }
    cs = cs.map(x => typeof x === 'string' ? x : (x && x.name)).filter(Boolean).filter(x => !used.has(x.toLowerCase()));
    if(want){ if(!cs.includes(want)) return { notOffered:true, offered:cs.slice(0, 6) }; cs = [want]; }
    for(const to of cs.slice(0, 2)){ const before = JSON.stringify(dayJ(X, w, d)); X.ctx.__c = { secIdx:card.si, itemIdx:card.ii, name:card.n, detail:card.d }; X.ctx.__to = to;
      try { E(X, '__T.length=0;_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ return { err:'apply' }; }
      const after = dayJ(X, w, d); if(JSON.stringify(after) !== before) return { to, after }; }
    return { none:true }; };
  try {
    const st = stored(), st2 = stored(); rec.selfSt = JS(JSON.parse(st)) === JS(JSON.parse(st2));
    const X = fresh(); setup(X, st); const W0 = weeksOf(X); const DK = dayKeys(W0); const SD = DK.filter(([w]) => pres !== 'PRE5' || w >= 5);
    const maxR = Math.max(0, ...SD.map(([w, d]) => cardsOf(W0[w][d]).length));
    for(let r = 0; r < Math.min(maxR, RMAX); r++){ const Y = fresh(); setup(Y, st); const done = []; rec.rounds++;
      for(const [w, d] of SD){ const card = cardsOf(W0[w][d])[r]; if(!card) continue; const used = new Set(cardsOf(dayJ(Y, w, d)).map(x => x.n.toLowerCase()));
        const s = trySwap(Y, w, d, card, used); if(!s.to){ rec.skips++; continue; } rec.swaps++; done.push({ w, d, card, to:s.to }); }
      if(!done.length) continue;
      writeOverlay(Y, lateInj(pres, region), FROMS[pres]);
      const B = fresh(); bootFrom(Y, B); const R = fresh(); bootFrom(B, R); const WB = weeksOf(B), WR = weeksOf(R);
      let PI = null; try { PI = JSON.parse(E(B, PLAN_INFO)); } catch(e){ PI = null; }
      done.forEach(x => { rec.swDays++; const dy = WB[x.w] && WB[x.w][x.d]; const it = dy && dy.sections && dy.sections[x.card.si] && dy.sections[x.card.si].items[x.card.ii]; if(it && it.name === x.to) rec.persist++; });
      for(const w of Object.keys(WB)) for(const d of Object.keys(WB[w] || {})){ rec.boots++; const a = WB[w][d];
        if(JS(a) !== JS(WR[w] && WR[w][d])){ rec.rebootNe++; if(!rec.rebootEx) rec.rebootEx = 'W' + w + ' ' + d + ' boot ' + sig(a).slice(0, 200) + ' | reboot ' + sig(WR[w] && WR[w][d]).slice(0, 200); }
        const hi = handPlan(pres, region, +w);
        if(PI && a && a.sections){ rec.planN++; if(JSON.stringify(PI[w + '|' + d] || null) !== JSON.stringify(hi || null)) rec.planMis++; }
        if(!hi || !a || !a.sections) continue;
        rec.judged++; if(HAND_NOJUMPS.has(hi.region)) rec.judgedNJ++;
        const j = judge(a, hi); rec.dup += j.dup; rec.jump += j.jump;
        if(j.dupEx && rec.dupEx.length < 2) rec.dupEx.push('W' + w + ' ' + d + ' ' + j.dupEx);
        if(j.jumpEx && rec.jumpEx.length < 2) rec.jumpEx.push('W' + w + ' ' + d + ' ' + j.jumpEx); } }
    // typed cells for this (presentation, cell): one explicit swap, then the late plan, then boot
    for(const T of TYPED.filter(t => t.pres === pres && t.region === region)){ const out = { id:T.id };
      try { const Y = fresh(); setup(Y, st); const W = weeksOf(Y); const dy = W[T.w] && W[T.w][T.d]; const card = cardsOf(dy).find(x => x.n === T.from);
        if(!card) out.err = 'from `' + T.from + '` not on W' + T.w + ' ' + T.d + ': ' + sig(dy).slice(0, 300);
        else { const used = new Set(cardsOf(dy).map(x => x.n.toLowerCase())); const s = trySwap(Y, T.w, T.d, card, used, T.to);
          if(s.notOffered) out.err = 'not offered: `' + T.to + '` (offered ' + JSON.stringify(s.offered) + ')';
          else if(!s.to) out.err = 'swap not landed ' + JSON.stringify(s).slice(0, 200);
          else { writeOverlay(Y, lateInj(pres, region), FROMS[pres]); const B = fresh(); bootFrom(Y, B); out.boot = sig(dayJ(B, T.w, T.d));
            try { out.plan = E(B, 'JSON.stringify(_dayPlanCfg(activeProg,activeProg.weeks[' + T.w + '].' + T.d + ').injury||null)'); } catch(e){ out.plan = '(n/a)'; } } }
      } catch(e){ out.err = 'crash ' + String(e && e.message || e).slice(0, 200); }
      rec.typed.push(out); }
  } catch(e){ rec.err = String(e && e.stack || e).slice(0, 400); }
  rec.secs = (Date.now() - t0) / 1000;
  return rec; }

if(process.argv[2] === '--worker'){
  let rec; try { rec = worker(process.argv[3], process.argv[4], +process.argv[5]); } catch(e){ rec = { err:'worker ' + String(e && e.stack || e).slice(0, 400) }; }
  process.stdout.write('@@REC ' + JSON.stringify(rec) + '\n');
  process.exit(0);
}

// ── PLUMBING ──────────────────────────────────────────────────────────────────────────────────────────────────────
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const info = s => P('    INFO ' + s);
const eqT = (a, b) => a + (a === b ? ' == typed' : ' != typed ' + b);
const R = {
  'a4-dedupe': 'row a4-dedupe (D194 Amendment 4, the whole-day boot re-filter; VER >= 230) D190 injured cells, PRE1/PRE5/OVOV/OVT late plans after app-written swaps: no section carries one item name twice on any booted day under the hand plan (candidate and V230 0 of 4,200 judged days; S32 18)',
  'a4-nojumps': 'row a4-nojumps (D194 R1; VER >= 230) no hand-jump-list name on any booted day whose hand plan region is knee or ankle (candidate and V230 0; S32 26)',
  'a4-cards': 'row a4-cards (D194 R1 + Amendment 4; VER >= 230) typed cards T1 PRE1 knee W3 sat, T2 OVOV ankle then hip W5 tue, T3 OVT hip then hip/protect W5 sat boot to the typed literal (candidate and V230 3 of 3; S32 0 of 3)',
  'a4-reach': 'row a4-reach (vacuity and self-stability; VER >= 230) every presentation lands swaps and judges days, the stored state is self-identical, reboot == boot on every booted day (7,056 of 7,056 at this era)',
  'a4-ctl': 'row a4-ctl (the discriminator, D198-c precedent; VER >= 230) S32\'s replacement applied in-gate to the candidate (anchor presence-checked, count 1) reads a4-dedupe >= 1, a4-nojumps >= 1, a4-cards < 3 (ruled 18 / 26 / 0 of 3)',
};
const ORDER = ['a4-dedupe', 'a4-nojumps', 'a4-cards', 'a4-reach', 'a4-ctl'];
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }

const TMPS = [];
process.on('exit', () => TMPS.forEach(f => { try { fs.unlinkSync(f); } catch(e){} }));

function runJob(job){ return new Promise(res => {
  const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename, '--worker', job.file, job.pres, String(job.ri)], { stdio:['ignore', 'pipe', 'pipe'] });
  let o = '', e = ''; const kill = setTimeout(() => { try { p.kill('SIGKILL'); } catch(_){} }, WORKER_TIMEOUT_MS);
  p.stdout.on('data', x => o += x); p.stderr.on('data', x => e += x);
  p.on('close', code => { clearTimeout(kill); const ln = o.split('\n').filter(l => l.startsWith('@@REC ')).pop();
    let rec = null; if(ln){ try { rec = JSON.parse(ln.slice(6)); } catch(_){ rec = null; } }
    if(!rec) rec = { err:'worker produced no record (exit ' + code + '): ' + (e || o).slice(-300) };
    rec.tree = job.tree; rec.pres = rec.pres || job.pres; rec.ri = job.ri; res(rec); }); }); }
async function runPool(jobs){ const out = new Array(jobs.length); let i = 0;
  await Promise.all(Array.from({ length:Math.min(POOL, jobs.length) }, async () => { while(i < jobs.length){ const k = i++; out[k] = await runJob(jobs[k]); } }));
  return out; }

const sum = (A, f) => A.reduce((a, x) => a + (f(x) || 0), 0);
function shard(recs){ const by = {}; PRES.forEach(p => { const A = recs.filter(x => x.pres === p);
    by[p] = { n:A.length, err:A.filter(x => x.err).length, swaps:sum(A, x => x.swaps), skips:sum(A, x => x.skips), boots:sum(A, x => x.boots), judged:sum(A, x => x.judged), judgedNJ:sum(A, x => x.judgedNJ),
      dup:sum(A, x => x.dup), jump:sum(A, x => x.jump), rebootNe:sum(A, x => x.rebootNe), persist:sum(A, x => x.persist), swDays:sum(A, x => x.swDays), planN:sum(A, x => x.planN), planMis:sum(A, x => x.planMis),
      selfSt:A.filter(x => x.selfSt).length }; });
  const T = {}; recs.forEach(x => (x.typed || []).forEach(t => { T[t.id] = t; }));
  const tot = f => sum(PRES, p => by[p][f]);
  const cards = TYPED.filter(t => T[t.id] && !T[t.id].err && T[t.id].boot === t.boot).length;
  return { recs, by, T, cards, n:recs.length, err:recs.filter(x => x.err), dup:tot('dup'), jump:tot('jump'), judged:tot('judged'), judgedNJ:tot('judgedNJ'), boots:tot('boots'), rebootNe:tot('rebootNe'), selfSt:tot('selfSt') }; }
const NJOBS = PRES.length * CELLS.length;

async function main(){
  // ── LOAD + VERSION ──
  let VER = NaN, TEXT = '';
  try { const IA = load(ART); VER = +IA.version; TEXT = fs.readFileSync(ART, 'utf8'); }
  catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); return; }
  P('g231 D194 Amendment 5 late-plan boot | candidate ' + ART + ' sha256 ' + sha(TEXT) + ' ia-version ' + VER);
  if(!(VER >= ERA)){ P('REFUSED: ia-version ' + VER + ' predates the whole-day boot re-filter under _dayPlanCfg (V' + ERA + ', D194 part 2). No row may pass on it.');
    ORDER.forEach(k => ok(R[k] + ' (REFUSED)', false)); return; }
  // ── THE IN-GATE S32 TREE (a4-ctl) ──
  const CTL = { file:null, ok:false, why:'' };
  { const nA = cnt(TEXT, S32_ANCHOR), nR = cnt(TEXT, S32_REPL);
    if(nA !== 1) CTL.why = 'S32 anchor occurs ' + nA + ' times in the candidate (expected 1: presence check)';
    else { const t = TEXT.replace(S32_ANCHOR, () => S32_REPL); const a2 = cnt(t, S32_ANCHOR), r2 = cnt(t, S32_REPL);
      if(a2 !== 0 || r2 !== nR + 1) CTL.why = 'mutated text: anchor ' + a2 + ', replacement ' + r2 + ' (candidate ' + nR + ')';
      else { try { const f = path.join(os.tmpdir(), 'g231_d194a4_s32_' + process.pid + '.html'); fs.writeFileSync(f, t); TMPS.push(f); CTL.file = f; CTL.ok = true; CTL.why = 'anchor 1 -> 0, replacement ' + nR + ' -> ' + r2 + ', sha256 ' + sha(t); }
        catch(e){ CTL.why = 'write failed: ' + String(e && e.message || e).slice(0, 120); } } } }
  P('  in-gate S32 tree: ' + (CTL.ok ? 'BUILT (' + CTL.why + ')' : 'NOT BUILT (' + CTL.why + ')'));
  // ── SHARDS ──
  const jobs = []; const add = (tree, file) => PRES.forEach(pres => CELLS.forEach((_, ri) => jobs.push({ tree, file, pres, ri })));
  add('C', ART); if(CTL.ok) add('Q', CTL.file);
  P('  jobs ' + jobs.length + ' (' + NJOBS + ' per tree), pool ' + POOL + ', rounds <= ' + RMAX);
  const recs = await runPool(jobs);
  const C = shard(recs.filter(x => x.tree === 'C')), Q = CTL.ok ? shard(recs.filter(x => x.tree === 'Q')) : null;
  P('  shard wall ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  C.err.slice(0, 4).forEach(x => P('    ERR C ' + x.pres + ' ' + x.k + ' ' + x.err));
  if(Q) Q.err.slice(0, 4).forEach(x => P('    ERR ctl ' + x.pres + ' ' + x.k + ' ' + x.err));
  const vcj = k => [k + '-ver', VER >= ERA, 'ia-version ' + VER + ' >= ' + ERA];
  const complete = (S, k, tag) => [k + '-complete', S.n === NJOBS && S.err.length === 0, (tag || 'candidate') + ' shard ' + (S.n - S.err.length) + '/' + NJOBS + ' (presentation, cell) jobs without error'];
  const rows = {
    'a4-dedupe': () => { const cj = [vcj('a4-dedupe'), complete(C, 'a4-dedupe'), ['a4-dedupe-judged', C.judged > 0, C.judged + ' judged days (' + eqT(C.judged, TYPED_JUDGED) + ', INFO)']];
      const ex = C.recs.flatMap(x => (x.dupEx || []).map(e => x.pres + ' ' + x.region + ' ' + e)).slice(0, 4);
      cj.push(['a4-dedupe-zero', C.dup === 0, 'duplicate names in one section ' + C.dup + ' (' + PRES.map(p => p + ' ' + C.by[p].dup).join(', ') + ')' + (ex.length ? ' | e.g. ' + ex.join(' || ') : '')]);
      row('a4-dedupe', cj); },
    'a4-nojumps': () => { const cj = [vcj('a4-nojumps'), complete(C, 'a4-nojumps'), ['a4-nojumps-judged', C.judgedNJ > 0, C.judgedNJ + ' judged days under a knee or ankle hand plan']];
      const ex = C.recs.flatMap(x => (x.jumpEx || []).map(e => x.pres + ' ' + x.region + ' ' + e)).slice(0, 4);
      cj.push(['a4-nojumps-zero', C.jump === 0, 'hand-jump-list names on knee/ankle days ' + C.jump + ' (' + PRES.map(p => p + ' ' + C.by[p].jump).join(', ') + ')' + (ex.length ? ' | e.g. ' + ex.join(' || ') : '')]);
      row('a4-nojumps', cj); },
    'a4-cards': () => { const cj = [vcj('a4-cards')];
      TYPED.forEach(t => { const r = C.T[t.id]; const good = !!(r && !r.err && r.boot === t.boot);
        cj.push(['a4-cards-' + t.id, good, t.id + ' ' + t.pres + ' ' + t.region + ' W' + t.w + ' ' + t.d + ' `' + t.from + '` -> `' + t.to + '`: ' + (!r ? 'no record (worker failed)' : r.err ? r.err : good ? 'boot == typed (plan ' + r.plan + ', INFO)' : 'boot ' + r.boot + ' | typed ' + t.boot)]); });
      row('a4-cards', cj); },
    'a4-reach': () => { const cj = [vcj('a4-reach'), complete(C, 'a4-reach'), ['a4-reach-selfst', C.selfSt === NJOBS, 'stored state self-identical (built twice, clock fields stripped) ' + C.selfSt + '/' + NJOBS]];
      PRES.forEach(p => { const b = C.by[p]; cj.push(['a4-reach-' + p, b.swaps > 0 && b.judged > 0, p + ' swaps ' + b.swaps + ' judged ' + b.judged]); });
      cj.push(['a4-reach-reboot', C.boots > 0 && C.rebootNe === 0, 'reboot == boot ' + (C.boots - C.rebootNe) + '/' + C.boots + ' (' + eqT(C.boots, TYPED_REBOOT) + ', INFO)' + (C.rebootNe ? ' | e.g. ' + (C.recs.find(x => x.rebootEx) || {}).rebootEx : '')]);
      PRES.forEach(p => { const b = C.by[p], t = TYPED_DEN[p];
        info(p + ' swaps landed ' + eqT(b.swaps, t.swaps) + ' (skipped ' + eqT(b.skips, t.skips) + ') | persisted at boot ' + eqT(b.persist, t.persist) + '/' + b.swDays + ' | booted days ' + eqT(b.boots, t.boots) + ' | judged ' + eqT(b.judged, t.judged) + ' | _dayPlanCfg injury != hand plan ' + b.planMis + '/' + b.planN); });
      row('a4-reach', cj); },
    'a4-ctl': () => { const cj = [vcj('a4-ctl'), ['a4-ctl-anchor', CTL.ok, CTL.why]];
      if(!Q){ cj.push(['a4-ctl-shard', false, 'not run: the in-gate S32 tree was not built']); row('a4-ctl', cj); return; }
      cj.push(complete(Q, 'a4-ctl', 'in-gate S32'));
      cj.push(['a4-ctl-dedupe', Q.dup >= 1, 'in-gate S32 a4-dedupe ' + Q.dup + ' (' + PRES.map(p => p + ' ' + Q.by[p].dup).join(', ') + ')']);
      cj.push(['a4-ctl-nojumps', Q.jump >= 1, 'in-gate S32 a4-nojumps ' + Q.jump + ' (' + PRES.map(p => p + ' ' + Q.by[p].jump).join(', ') + ')']);
      cj.push(['a4-ctl-cards', Q.cards < TYPED.length, 'in-gate S32 a4-cards ' + Q.cards + ' of ' + TYPED.length + ' (' + TYPED.map(t => t.id + ' ' + (Q.T[t.id] ? (Q.T[t.id].err || Q.T[t.id].boot) : 'no record')).join(' || ') + ')']);
      info('in-gate S32 figures: a4-dedupe ' + eqT(Q.dup, sum(PRES, p => TYPED_MUT.dup[p])) + ' (' + PRES.map(p => p + ' ' + eqT(Q.by[p].dup, TYPED_MUT.dup[p])).join(', ') + ') | a4-nojumps ' + eqT(Q.jump, sum(PRES, p => TYPED_MUT.jump[p])) + ' (' + PRES.map(p => p + ' ' + eqT(Q.by[p].jump, TYPED_MUT.jump[p])).join(', ') + ') | a4-cards ' + eqT(Q.cards, TYPED_MUT.cards) + ' of ' + TYPED.length);
      info('in-gate S32 persisted at boot ' + PRES.map(p => p + ' ' + eqT(Q.by[p].persist, TYPED_MUT.persist[p]) + '/' + Q.by[p].swDays).join(', ') + ' | reboot == boot ' + (Q.boots - Q.rebootNe) + '/' + Q.boots);
      row('a4-ctl', cj); },
  };
  for(const k of ORDER){ try { rows[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
}
main().catch(e => { P('    CRASH ' + String(e && e.stack || e).slice(0, 400)); const seen = pass + fail; ORDER.slice(Math.max(0, seen)).forEach(k => ok(R[k] + ' (crashed)', false)); }).then(done);
