// v231_s32.js — MEASURE (read-only). V231 M20: sabotage survivor S32-D194-A4 (tests/sabotage/v230_d194.json), "the boot
//   re-filter judges only the swapped items" (D194 Amendment 4 rejected option 1). Is it an equivalent mutant on the states
//   the app can reach, and is the built program idempotent under its own day plan (the property that would make it one)?
//   SCR=<scratch with cand.html + mut.html> PART=<prep|run|report> [CELLS=<filter>] node tests/measure/v231_s32.js
// Reach (M13 shape, tests/measure/v230_postsweep_reject.js): stored program (FIX = cfg.injury; OV1/OV5 = overlay written by
//   applyInjuryDraft from W1 Monday / W5 Monday; UNINJ = no injury; MIX = cfg.injury + a different-region overlay from W1,
//   INFO, no app writer). Round r swaps the r-th card on every pierced lifting day in ONE live session on the clean tree
//   (applySwapChoice, first legal candidate not already on the day), then the SAME localStorage boots on the clean tree
//   and on the mutant: boot, reboot, undo-all + boot. Oracle for (2): the clean candidate's own boot of the identical
//   stored state (equivalence is the question). Oracle for (3) "hand" column: the injury this script set for that
//   presentation and week, never read back through _dayPlanCfg; the _dayPlanCfg column is printed beside it.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PART = process.env.PART || 'none';
const TREES = { C:F('cand.html'), M:F(process.env.MUTFILE || 'mut.html') };   // MUTFILE=ctl.html: positive control (re-filter line deleted)
const START = '2026-08-24', FROMS = { OV1:'2026-08-24', OV5:'2026-09-21', MIX:'2026-08-24', PRE1:'2026-08-24', PRE5:'2026-09-21', OVOV:'2026-08-24', OVT:'2026-08-24' }, CLOCKS = { OV1:START, FIX:START, UNINJ:START, MIX:START, OV5:'2026-09-24', PRE1:START, PRE5:'2026-09-24', OVOV:START, OVT:START };
// LATE presentations (D194 Amendment 4's named hole: a swap recorded BEFORE the injury plan that now governs the day). The swap is
//   made on the stored state of LATE[p].base, then applyInjuryDraft writes LATE[p].inj from FROMS[p] in the same live session, then
//   the SAME localStorage boots on clean and mutant. PRE1/PRE5: uninjured program, overlay from W1/W5. OVOV: OV1 program, second
//   overlay on a different region. OVT: OV1 program, second overlay same region other tier. All four are written by app code.
const LATE = { PRE1:{ base:'UNINJ', inj:c => c.injury }, PRE5:{ base:'UNINJ', inj:c => c.injury }, OVOV:{ base:'OV1', inj:c => ({ region:OTHER(c.injury.region), tier:c.injury.tier }) }, OVT:{ base:'OV1', inj:c => ({ region:c.injury.region, tier:c.injury.tier === 'workaround' ? 'protect' : 'workaround' }) } };
function late(X, c, pres){ const L = LATE[pres]; if(!L) return; const oi = L.inj(c); const n0 = +E(X, 'JSON.stringify((activeProg.overlays||[]).length)'); E(X, "_ovDraft.injRegion=" + JSON.stringify(oi.region) + ";_ovDraft.injTier=" + JSON.stringify(oi.tier) + ";_ovDraft.from='" + FROMS[pres] + "';applyInjuryDraft();"); if(+E(X, 'JSON.stringify((activeProg.overlays||[]).length)') !== n0 + 1) throw new Error('late overlay not written ' + pres); }
const clone = x => JSON.parse(JSON.stringify(x)); const P = s => console.log(s);
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort((a, b) => m[b] - m[a] || (a < b ? -1 : 1)).map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const CLK = /^_?(ts|at|time|stamp|clock|now|created)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], TIERS = ['workaround','protect'], EXPS = ['beginner','intermediate','advanced'];
const OTHER = r => REGS[(REGS.indexOf(r) + 1) % REGS.length];
function lattices(){ const out = [];
  for(const g of REGS) for(const t of TIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of EXPS) for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({ L:'L432', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
  for(const g of REGS) for(const t of TIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBW', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|' + rd.join(','), c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  // M13 UNKNOWN cells: crossfit/home_full on LBW's focus x rest shape; fatloss; NRC paths
  for(const g of REGS) for(const t of TIERS) for(const eq of ['crossfit','home_full']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBWX', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|' + rd.join(','), c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  for(const g of REGS) for(const t of TIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight','home_basic']) for(const ex of EXPS)
    out.push({ L:'FAT', k:g + '/' + t + '|' + eq + '|' + ex + '|fatloss|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:'fatloss' }) });
  const LAB = { run_5k:'5K', run_10k:'10K', run_half:'Half Marathon', run_marathon:'Marathon' };
  for(const g of REGS) for(const t of TIERS) for(const goal of Object.keys(LAB)) for(const [eq, fo] of [['crossfit','support_prevention'],['commercial','support_strength']]){ const c = clone(fixtures.HALF_MANNY); c.cardioGoals.run.id = goal; c.cardioGoals.run.label = LAB[goal]; c.equipment = eq; c.liftingFocus = fo; c.injury = { region:g, tier:t };
    out.push({ L:'NRC', k:g + '/' + t + '|' + eq + '|intermediate|' + fo + '|' + goal, c }); }
  // the D190 lattice the g227/g228 gates use (six workaround regions on Mario; manny and mario_noinj are the uninjured two)
  for(const g of REGS) out.push({ L:'D190', k:g + '/workaround|commercial|beginner|support_strength|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:g, tier:'workaround' } }) });
  out.push({ L:'D190', k:'none|crossfit|intermediate|support_prevention|manny', c:clone(fixtures.HALF_MANNY) });
  out.push({ L:'D190', k:'none|commercial|beginner|support_strength|mario_noinj', c:clone(MARIO) });
  out.push({ L:'MARIO', k:'knee/workaround|commercial|beginner|support_strength|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:'knee', tier:'workaround' } }) });
  return out; }
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}"
  + "globalThis.__idem=function(w,d,inj){var day=activeProg.weeks[w][d];var S=JSON.parse(JSON.stringify(day.sections));var pc=_dayPlanCfg(activeProg,day);var A=applyInjuryFilter(JSON.parse(JSON.stringify(S)),pc);"
  + "var H=inj?applyInjuryFilter(JSON.parse(JSON.stringify(S)),Object.assign({},activeProg.cfg,{injury:inj})):S;return JSON.stringify({pinj:pc.injury||null,a:A,h:H,s:S});};";
const E = (X, c) => X.eval(c);
function fresh(t, pres){ const X = load(TREES[t]); const T = new Date(CLOCKS[pres] + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } X.ctx.Date = FD; E(X, HELP); return X; }
function setup(X, st){ X.localStorage.clear(); X.ctx.__SP = JSON.parse(st); E(X, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
// presentation -> cfg stored + overlay written by the app's own applyInjuryDraft
function presCfg(c, pres){ if(LATE[pres]) pres = LATE[pres].base; const base = clone(c); delete base.injury; if(pres === 'FIX' || pres === 'MIX') return clone(c); return base; }
function ovInj(c, pres){ if(LATE[pres]) pres = LATE[pres].base; if(pres === 'OV1' || pres === 'OV5') return c.injury; if(pres === 'MIX') return { region:OTHER(c.injury.region), tier:c.injury.tier }; return null; }
function stored(t, c, pres){ const X = fresh(t, pres); const _late = LATE[pres]; if(_late && _late.base === 'OV1') pres = 'OV1'; const cfg = presCfg(c, pres);
  const s = clone(X.buildProgram(clone(cfg))); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); let j = JSON.stringify(s); const oi = ovInj(c, pres);
  if(oi){ setup(X, j); E(X, "_ovDraft.injRegion=" + JSON.stringify(oi.region) + ";_ovDraft.injTier=" + JSON.stringify(oi.tier) + ";_ovDraft.from='" + FROMS[pres] + "';applyInjuryDraft();");
    const o = JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM'); if(!(o.overlays || []).length) throw new Error('overlay not written ' + pres); (o.overlays || []).forEach(v => { v.id = 'ov_fixed'; v.created = 1; }); j = JSON.stringify(o); }
  return j; }
// the injury this script set for (pres, week): hand, never _dayPlanCfg
function handInj(c, pres, w){ if(pres === 'UNINJ') return null; if(pres === 'FIX') return c.injury; if(pres === 'OV1') return c.injury; if(pres === 'OV5') return w >= 5 ? c.injury : null; if(pres === 'MIX') return ovInj(c, 'MIX'); if(pres === 'PRE1') return c.injury; if(pres === 'PRE5') return w >= 5 ? c.injury : null; if(LATE[pres]) return LATE[pres].inj(c); }
const weeksOf = X => JSON.parse(E(X, 'JSON.stringify(activeProg.weeks)'));
const dayKeys = W => { const o = []; Object.keys(W).forEach(w => Object.keys(W[w] || {}).forEach(d => { const dy = W[w][d]; if(dy && Array.isArray(dy.sections) && dy.sections.some(s => s && s.items && s.items.length)) o.push([+w, d]); })); return o; };
const cardsOf = dy => { const o = []; (dy && dy.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name) o.push({ si, ii, n:it.name, d:it.detail || '', lab:s.label || '' }); })); return o; };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const sig = dy => !dy || !dy.sections ? '(none)' : dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '')).join(';') + '}').join(' ');
const WBCx = (X, x) => { const dy = dayJ(X, x.w, x.d); const s = dy && dy.sections && dy.sections[x.card.si]; return s && s.items && s.items[x.card.ii]; };
const dayJ = (X, w, d) => JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')'));
function trySwap(X, w, d, card, used){ E(X, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); let cs = [];
  try { cs = JSON.parse(E(X, "JSON.stringify(__cands(activeProg.weeks[" + w + "]." + d + "," + w + "," + JSON.stringify(card.n) + "))")); } catch(e){ return { err:'cands' }; }
  cs = cs.map(x => typeof x === 'string' ? x : (x && x.name)).filter(Boolean).filter(x => !used.has(x.toLowerCase()));
  for(const to of cs.slice(0, 2)){ const before = JSON.stringify(dayJ(X, w, d)); X.ctx.__c = { secIdx:card.si, itemIdx:card.ii, name:card.n, detail:card.d }; X.ctx.__to = to;
    try { E(X, '__T.length=0;_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ return { err:'apply' }; }
    const after = dayJ(X, w, d); if(JSON.stringify(after) !== before) return { to, after }; }
  return { none:true }; }
function worker(spec){ const [pres, L, i0, i1] = spec.split(':'); const all = lattices().filter(x => x.L === L).slice(+i0, +i1); const out = [];
  for(const cell of all){ const injured = !!cell.c.injury; if(!injured && pres !== 'UNINJ') continue; const c = pres === 'UNINJ' ? (x => { delete x.injury; return x; })(clone(cell.c)) : cell.c;
    const rec = { k:cell.k, L, pres, tier:injured ? cell.c.injury.tier : 'none', region:injured ? cell.c.injury.region : 'none', err:null, days:0, idem:{ n:0, pinjN:0, dpcNon:0, handNon:0, dpcNonSig:0, handNonSig:0, pinjMismatch:0, ex:[] }, swaps:0, skips:0, boots:0, diff:{ boot:0, bootSig:0, reboot:0, undo:0 }, rounds:0, persist:0, swDays:0, swInj:0, ex:[], buildCM:null };
    try {
      const st = stored('C', c, pres), stM = stored('M', c, pres); rec.buildCM = JS(JSON.parse(st)) === JS(JSON.parse(stM));
      const X = fresh('C', pres); setup(X, st); const W0 = weeksOf(X); const DK = dayKeys(W0); rec.days = DK.length; if(LATE[pres]) late(X, c, pres);
      // (3) idempotence of every built (booted, unswapped) day under its own day plan, and under the hand injury
      for(const [w, d] of DK){ const hi = handInj(c, pres, w); const R = JSON.parse(E(X, '__idem(' + w + ",'" + d + "'," + JSON.stringify(hi) + ')')); rec.idem.n++;
        if(R.pinj) rec.idem.pinjN++; if(JSON.stringify(R.pinj) !== JSON.stringify(hi || null)) rec.idem.pinjMismatch++;
        const s0 = JS(R.s), sg0 = sig(R.s); const dn = JS(R.a) !== s0, hn = JS(R.h) !== s0;
        if(dn) rec.idem.dpcNon++; if(hn) rec.idem.handNon++; if(sig(R.a) !== sg0) rec.idem.dpcNonSig++; if(sig(R.h) !== sg0) rec.idem.handNonSig++;
        if((dn || hn) && rec.idem.ex.length < 2) rec.idem.ex.push({ w, d, pinj:R.pinj, built:sg0, dpc:sig(R.a), hand:sig(R.h) }); }
      if(pres === 'UNINJ' && !process.env.UNINJ_SWAP){}
      const SD = DK.filter(([w]) => (pres !== 'OV5' && pres !== 'PRE5') || w >= 5); const maxR = Math.max(0, ...SD.map(([w, d]) => cardsOf(W0[w][d]).length)); const RMAX = +(process.env.RMAX || 99);
      for(let r = 0; r < Math.min(maxR, RMAX); r++){ const Y = fresh('C', pres); setup(Y, st); const done = []; rec.rounds++;
        for(const [w, d] of SD){ const cs = cardsOf(W0[w][d]); const card = cs[r]; if(!card) continue; const used = new Set(cardsOf(dayJ(Y, w, d)).map(x => x.n.toLowerCase()));
          const s = trySwap(Y, w, d, card, used); if(!s.to){ rec.skips++; continue; } rec.swaps++; done.push({ w, d, card, to:s.to, live:s.after }); }
        if(!done.length) continue;
        if(LATE[pres]) late(Y, c, pres);
        const BC = fresh('C', pres), BM = fresh('M', pres); bootFrom(Y, BC); bootFrom(Y, BM); const RC = fresh('C', pres), RM = fresh('M', pres); bootFrom(BC, RC); bootFrom(BM, RM);
        done.forEach(x => { E(Y, 'currentWeek=' + x.w + ";currentDayKey='" + x.d + "';"); try { E(Y, 'undoSwap(' + JSON.stringify(x.card.n) + ');'); } catch(e){} });
        const UC = fresh('C', pres), UM = fresh('M', pres); bootFrom(Y, UC); bootFrom(Y, UM);
        // compare every booted day, not only the swapped ones
        done.forEach(x => { rec.swDays++; const it = WBCx(BC, x); if(it && it.name === x.to) rec.persist++; if(JSON.parse(E(BC, 'JSON.stringify(!!_dayPlanCfg(activeProg,activeProg.weeks[' + x.w + '].' + x.d + ').injury)'))) rec.swInj++; });
        const WBC = weeksOf(BC), WBM = weeksOf(BM), WRC = weeksOf(RC), WRM = weeksOf(RM), WUC = weeksOf(UC), WUM = weeksOf(UM);
        for(const w of Object.keys(WBC)) for(const d of Object.keys(WBC[w] || {})){ rec.boots++; const a = WBC[w][d], b = WBM[w] && WBM[w][d];
          if(JS(a) !== JS(b)){ rec.diff.boot++; const sw = done.find(x => x.w === +w && x.d === d);
            if(sig(a) !== sig(b)) rec.diff.bootSig++;
            if(rec.ex.length < 3) rec.ex.push({ w:+w, d, swap:sw ? sw.card.n + ' -> ' + sw.to + ' @' + sw.card.si + '.' + sw.card.ii : '(no swap on day)', pinj:JSON.parse(E(BC, 'JSON.stringify(_dayPlanCfg(activeProg,activeProg.weeks[' + w + '].' + d + ').injury||null)')), built:sig(W0[w] && W0[w][d]), live:sw ? sig(sw.live) : null, clean:sig(a), mut:sig(b), jsonOnly:sig(a) === sig(b), keysC:a && JSON.stringify(a).length, keysM:b && JSON.stringify(b).length,
              fieldDiff:(() => { const o = []; (a && a.sections || []).forEach((s, si) => { const t = b && b.sections && b.sections[si]; if(!t){ o.push('sec' + si + ' missing'); return; } if(s.label !== t.label) o.push('label' + si); (s.items || []).forEach((it, ii) => { const u = t.items && t.items[ii]; if(JS(it) !== JS(u)) o.push(si + '.' + ii + ' C=' + String(JS(it)).slice(0, 220) + ' M=' + String(JS(u)).slice(0, 220)); }); }); return o.slice(0, 4); })() }); }
          if(JS(WRC[w][d]) !== JS(WRM[w] && WRM[w][d])) rec.diff.reboot++;
          if(JS(WUC[w][d]) !== JS(WUM[w] && WUM[w][d])) rec.diff.undo++; } }
    } catch(e){ rec.err = String(e && e.stack || e).slice(0, 400); }
    out.push(rec); }
  fs.writeFileSync(F('res_' + spec.replace(/:/g, '_') + '.json'), JSON.stringify(out)); P('worker ' + spec + ' cells ' + out.length); }
if(process.env.WORKER){ worker(process.env.WORKER); }
else if(PART === 'prep'){
  P('PREP cand sha ' + sha(TREES.C).slice(0, 16) + ' mut sha ' + sha(TREES.M).slice(0, 16));
  const ver = f => (fs.readFileSync(f, 'utf8').match(/<meta name="ia-version" content="(\d+)"/) || [])[1]; P('PREP ia-version cand ' + ver(TREES.C) + ' mut ' + ver(TREES.M));
  const cells = lattices().filter((_, i) => i % 97 === 0); let self = 0, cm = 0, n = 0;
  for(const cell of cells){ n++; const a = fresh('C', 'FIX'), b = fresh('C', 'FIX'), m = fresh('M', 'FIX');
    const pa = JS(a.buildProgram(clone(cell.c)).weeks), pb = JS(b.buildProgram(clone(cell.c)).weeks), pm = JS(m.buildProgram(clone(cell.c)).weeks); if(pa === pb) self++; if(pa === pm) cm++; }
  P('PREP clean self-identity ' + self + '/' + n + ' | clean build == mutant build ' + cm + '/' + n);
  // baseline equals itself through the reach path: the same stored state booted twice on the clean tree
  const c0 = lattices().find(x => x.L === 'MARIO').c; let same = 0, tot = 0;
  for(const pres of ['FIX','OV1','OV5','MIX']){ const st = stored('C', c0, pres), st2 = stored('C', c0, pres); const A = fresh('C', pres), B = fresh('C', pres); setup(A, st); setup(B, st2); tot++; if(JS(weeksOf(A)) === JS(weeksOf(B)) && st === st2) same++; }
  P('PREP stored+boot self-identity (MARIO, FIX/OV1/OV5/MIX) ' + same + '/' + tot);
  P('PREP lattice sizes ' + JSON.stringify(tally(lattices(), x => x.L)));
}
else if(PART === 'run'){
  if(!process.env.NOCLEAR) fs.readdirSync(SCR).filter(f => /^res_/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  const jobs = []; const LS = tally(lattices(), x => x.L); const CH = +(process.env.CH || 12); const only = process.env.CELLS ? new RegExp(process.env.CELLS) : null;
  const LATEP = process.env.LATEP ? process.env.LATEP.split(',') : null;
  const add = (pres, L) => { if(LATEP && !LATEP.includes(pres)) return; for(let i = 0; i < LS[L]; i += CH){ const j = [pres, L, i, Math.min(LS[L], i + CH)].join(':'); if(!only || only.test(j)) jobs.push(j); } };
  for(const L of Object.keys(LS)) for(const pres of (LATEP || ['FIX','OV1','OV5','MIX'])) add(pres, L);
  if(!LATEP) for(const L of ['D190','MARIO']) add('UNINJ', L);
  // uninjured: one cell per distinct non-injury shape of the main lattices (region knee/workaround picks each shape once)
  if(!LATEP) for(const L of ['L432','LBW','LBWX','FAT','NRC']){ const idx = lattices().filter(x => x.L === L).map((x, i) => [x, i]).filter(([x]) => /^knee\/workaround/.test(x.k)).map(([, i]) => i); idx.forEach(i => { const j = ['UNINJ', L, i, i + 1].join(':'); if(!only || only.test(j)) jobs.push(j); }); }
  const par = +(process.env.PAR || 8); let i = 0; const t0 = Date.now(); P('jobs ' + jobs.length);
  const one = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { WORKER:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log((code ? 'WORKER CRASH ' + j + ' ' + o.slice(-800) : o.trim()) + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  Promise.all(Array.from({ length:par }, async () => { while(i < jobs.length) await one(jobs[i++]); })).then(() => P('jobs done ' + jobs.length));
}
else if(PART === 'report'){
  const R = []; fs.readdirSync(SCR).filter(f => /^res_.*\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(F(f), 'utf8')).forEach(x => R.push(x)));
  const sum = (A, f) => A.reduce((a, x) => a + (f(x) || 0), 0);
  P('cells loaded ' + R.length + ' | errors ' + R.filter(x => x.err).length + ' | build clean==mutant ' + R.filter(x => x.buildCM).length + '/' + R.length);
  R.filter(x => x.err).slice(0, 5).forEach(x => P('  ERR ' + x.pres + ' ' + x.L + ' ' + x.k + ' ' + x.err));
  const SEG = [['pres', x => x.pres], ['pres|L', x => x.pres + '|' + x.L], ['pres|tier', x => x.pres + '|' + x.tier], ['pres|region', x => x.pres + '|' + x.region], ['pres|equip', x => x.pres + '|' + x.k.split('|')[1]]];
  P('\n=== (2) REACH: booted days where mutant boot != clean boot (full JSON, clock fields stripped) / booted days compared');
  for(const [nm, f] of SEG){ const g = {}; R.forEach(x => { (g[f(x)] = g[f(x)] || []).push(x); }); P('\n-- by ' + nm);
    Object.keys(g).sort().forEach(k => { const A = g[k]; P('  ' + k.padEnd(34) + ' cells ' + String(A.length).padStart(4) + ' | swaps ' + String(sum(A, x => x.swaps)).padStart(6) + ' (skipped ' + sum(A, x => x.skips) + ') persisted at boot ' + sum(A, x => x.persist) + '/' + sum(A, x => x.swDays) + ' on injured-plan days ' + sum(A, x => x.swInj) + ' rounds ' + sum(A, x => x.rounds) + ' | boot diff ' + sum(A, x => x.diff.boot) + '/' + sum(A, x => x.boots) + ' (names/details/labels differ ' + sum(A, x => x.diff.bootSig) + ') | reboot diff ' + sum(A, x => x.diff.reboot) + ' | undo+boot diff ' + sum(A, x => x.diff.undo)); }); }
  const REACH = ['FIX','OV1','OV5','UNINJ','PRE1','PRE5','OVOV','OVT']; const reach = R.filter(x => REACH.includes(x.pres));
  P('\nREACHABLE TOTAL (FIX+OV1+OV5+UNINJ+PRE1+PRE5+OVOV+OVT): boot diff ' + sum(reach, x => x.diff.boot) + '/' + sum(reach, x => x.boots) + ' booted days over ' + sum(reach, x => x.swaps) + ' swaps in ' + reach.length + ' cell-runs | reboot ' + sum(reach, x => x.diff.reboot) + ' | undo+boot ' + sum(reach, x => x.diff.undo));
  const mix = R.filter(x => x.pres === 'MIX'); P('MIX (INFO): boot diff ' + sum(mix, x => x.diff.boot) + '/' + sum(mix, x => x.boots) + ' over ' + sum(mix, x => x.swaps) + ' swaps in ' + mix.length + ' cell-runs');
  for(const pres of ['FIX','OV1','OV5','UNINJ','MIX','PRE1','PRE5','OVOV','OVT']){ const ex = R.filter(x => x.pres === pres && x.ex.length); P('\n-- examples ' + pres + ': ' + ex.length + ' cells with a diff' + (ex.length ? ' | by swap-in ' + fmt(tally(ex.flatMap(x => x.ex), e => e.swap.replace(/ @.*/, ''))).slice(0, 600) : ''));
    ex.slice(0, 3).forEach(x => x.ex.slice(0, 1).forEach(e => { P('  ' + x.L + ' ' + x.k + ' W' + e.w + ' ' + e.d + ' plan ' + JSON.stringify(e.pinj) + ' swap ' + e.swap + ' jsonOnly ' + e.jsonOnly); ['built','live','clean','mut'].forEach(f => P('     ' + f.padEnd(5) + ' ' + String(e[f]).slice(0, 700))); (e.fieldDiff || []).forEach(z => P('     field ' + z)); })); }
  P('\n=== (3) IDEMPOTENCE: built (booted, unswapped) lifting days where applyInjuryFilter(day) != day');
  for(const [nm, f] of [['pres', x => x.pres], ['pres|tier', x => x.pres + '|' + x.tier], ['pres|L', x => x.pres + '|' + x.L]]){ const g = {}; R.forEach(x => { (g[f(x)] = g[f(x)] || []).push(x); }); P('-- by ' + nm);
    Object.keys(g).sort().forEach(k => { const A = g[k]; P('  ' + k.padEnd(28) + ' days ' + String(sum(A, x => x.idem.n)).padStart(6) + ' | day plan has injury ' + sum(A, x => x.idem.pinjN) + ' | _dayPlanCfg injury != hand injury ' + sum(A, x => x.idem.pinjMismatch) + ' | non-idempotent under _dayPlanCfg ' + sum(A, x => x.idem.dpcNon) + ' (sig ' + sum(A, x => x.idem.dpcNonSig) + ') | under hand injury ' + sum(A, x => x.idem.handNon) + ' (sig ' + sum(A, x => x.idem.handNonSig) + ')'); }); }
  const ie = R.filter(x => x.idem.ex.length); P('-- non-idempotent examples: ' + ie.length + ' cells');
  ie.slice(0, 6).forEach(x => { const e = x.idem.ex[0]; P('  ' + x.pres + ' ' + x.L + ' ' + x.k + ' W' + e.w + ' ' + e.d + ' plan ' + JSON.stringify(e.pinj)); P('     built ' + e.built.slice(0, 600)); P('     dpc   ' + e.dpc.slice(0, 600)); P('     hand  ' + e.hand.slice(0, 600)); });
}
// PART=gatecmp: (1) every gate in tests/gates/ was run on SCR/cand.html and SCR/mut.html (V230 baseline as argv[3]) by a
//   worker into SCR/gout/{C,M}/<gate>.out; this reads both, grades each (summary / REFUSED / crash) and diffs every line
//   with timings normalised.
if(PART === 'gatecmp'){
  const G = fs.readdirSync(path.join(ROOT, 'tests', 'gates')).filter(f => /\.js$/.test(f)).sort();
  const norm = s => s.replace(/\b\d+(\.\d+)?\s*(s|ms|sec|secs)\b/g, '<t>').replace(/\(\s*<t>\s*\)/g, '').replace(/\/(private\/)?tmp\/[^\s'"]+/g, '<path>').replace(/\s+$/,'');
  const grade = t => { if(t == null) return 'MISSING'; const m = t.match(/^PASS (\d+) FAIL (\d+)/m); const ref = (t.match(/^REFUSED/mg) || []).length; return m ? ('PASS ' + m[1] + ' FAIL ' + m[2] + (ref ? ' REFUSED ' + ref : '')) : 'CRASH (no summary)'; };
  let differ = 0, same = 0, redC = 0, redM = 0; const rows = [];
  for(const g of G){ const rd = T => { try { return fs.readFileSync(F(path.join('gout', T, g + '.out')), 'utf8'); } catch(e){ return null; } };
    const c = rd('C'), m = rd('M'); const gc = grade(c), gm = grade(m); if(!/FAIL 0$/.test(gc)) redC++; if(!/FAIL 0$/.test(gm)) redM++;
    const lc = (c || '').split('\n').map(norm), lm = (m || '').split('\n').map(norm); const sc = new Set(lc), sm = new Set(lm);
    const onlyC = lc.filter(x => !sm.has(x)), onlyM = lm.filter(x => !sc.has(x));
    if(gc !== gm || onlyC.length || onlyM.length){ differ++; rows.push([g, gc, gm, onlyC, onlyM]); } else same++;
    P(g.padEnd(36) + ' clean: ' + gc.padEnd(26) + ' mutant: ' + gm + (gc !== gm || onlyC.length || onlyM.length ? '   << DIFFERS' : '')); }
  P('\nGATES ' + G.length + ' | identical output (timings normalised) ' + same + ' | differ ' + differ + ' | not green on clean ' + redC + ' | not green on mutant ' + redM);
  rows.forEach(([g, gc, gm, a, b]) => { P('\n-- ' + g + ' clean ' + gc + ' / mutant ' + gm + ' | lines only in clean ' + a.length + ', only in mutant ' + b.length); a.slice(0, 8).forEach(x => P('   C< ' + x.slice(0, 300))); b.slice(0, 8).forEach(x => P('   M> ' + x.slice(0, 300))); });
}
// PART=classify: the sampled diff examples (<=3 per cell) of the LATE presentations, by mechanism: the mutant keeps a name the
//   clean boot does not print (a swapped-in card the new plan drops or renames), or prints a duplicate name in one section that
//   the clean boot does not (the whole-day pass dedupes), or differs in detail/label only. Sample, not census: denominators printed.
if(PART === 'classify'){
  const R = []; fs.readdirSync(SCR).filter(f => /^res_.*\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(F(f), 'utf8')).forEach(x => R.push(x)));
  const secs = s => (s || '').split(/\} ?/).filter(Boolean).map(x => { const m = x.split('{'); return { lab:m[0].trim(), items:(m[1] || '').split(';').filter(Boolean).map(y => y.split('|')[0]) }; });
  for(const pres of ['PRE1','PRE5','OVOV','OVT']){ const E2 = R.filter(x => x.pres === pres).flatMap(x => x.ex.map(e => Object.assign({ k:x.k, L:x.L }, e))); const cls = {};
    E2.forEach(e => { const c = secs(e.clean), m = secs(e.mut); const cn = new Set(c.flatMap(s => s.items)); const extra = m.flatMap(s => s.items).filter(n => !cn.has(n));
      const dupM = m.some(s => new Set(s.items).size < s.items.length), dupC = c.some(s => new Set(s.items).size < s.items.length); const swapTo = (e.swap.split(' -> ')[1] || '').replace(/ @.*/, '');
      const k = extra.length ? ('mutant keeps a card the clean boot removed' + (extra.includes(swapTo) ? ' (the swapped-in card)' : ' (another card)')) : (dupM && !dupC) ? 'mutant prints a duplicate name in one section' : 'detail/label/order only'; cls[k] = (cls[k] || 0) + 1; });
    P(pres + ' sampled diffs ' + E2.length + ' | ' + fmt(cls)); }
}
// PART=dupprobe: the reach rounds skip any candidate already on the day (M13's `used` filter, an instrument choice). This counts
//   how often the app's own candidate list (swapCandidates/auxSwapCandidates, the sheet's source) offers a name already on the
//   day, and in the SAME section, on FIX for every 9th cell of every lattice, every card of every lifting day.
if(PART === 'dupprobe'){
  const cells = lattices().filter(x => x.c.injury).filter((_, i) => i % 9 === 0); let cards = 0, offered = 0, onDay = 0, sameSec = 0, cardsWith = 0; const ex = [];
  for(const cell of cells){ const st = stored('C', cell.c, 'FIX'); const X = fresh('C', 'FIX'); setup(X, st); const W = weeksOf(X);
    for(const [w, d] of dayKeys(W)){ const dy = W[w][d]; const cs = cardsOf(dy); const names = new Set(cs.map(c => c.n.toLowerCase()));
      for(const c of cs){ cards++; let L = []; try { L = JSON.parse(E(X, "JSON.stringify(__cands(activeProg.weeks[" + w + "]." + d + "," + w + "," + JSON.stringify(c.n) + "))")).map(x => typeof x === 'string' ? x : (x && x.name)).filter(Boolean); } catch(e){}
        offered += L.length; const hit = L.filter(n => names.has(n.toLowerCase())); onDay += hit.length; const ss = hit.filter(n => (dy.sections[c.si].items || []).some(it => it.name.toLowerCase() === n.toLowerCase())); sameSec += ss.length; if(hit.length) cardsWith++;
        if(ss.length && ex.length < 4) ex.push(cell.k + ' W' + w + ' ' + d + ' ' + c.n + ' offers ' + ss.join(',')); } } }
  P('DUPPROBE FIX ' + cells.length + ' cells | cards ' + cards + ' | candidates offered ' + offered + ' | offered names already on the day ' + onDay + ' (same section ' + sameSec + ') | cards with any ' + cardsWith); ex.forEach(x => P('  ' + x));
}
