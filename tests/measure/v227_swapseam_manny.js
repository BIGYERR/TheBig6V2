// v227_swapseam_manny.js — MEASURE (read-only). Isolates the "manny 77" residue of the V222 measure
// (tests/measure/v222_swapdurable_chain.out.txt, STEP u|manny W5 40/3018, W7 25/2472, + hop3) from the §12 (C) cause.
//   SCR=<scratch> node tests/measure/v227_swapseam_manny.js     (needs chains_manny.json + t_base.html from v227_swapseam.js)
// Same chains, same act, two boot models: IN-VM (the V222 measure's: the boot runs in the VM that made the swaps) and
// FRESH (a new page loaded with the device storage the act left, the gate's model). Oracle: the live slot after the last hop.
'use strict';
const path = require('path'), fs = require('fs');
const { load } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const FILE = path.join(SCR, 't_base.html'), CLOCK = '2026-09-24', START = '2026-08-24';
const { fixtures } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const CFG = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__T=[];showToast=function(m){__T.push(String(m));};globalThis.__BF=[];";
let SP = null;
function fresh(){ const T = load(FILE); pin(T); E(T, HELP); return T; }
function setup(IA){ IA.localStorage.clear(); pin(IA); if(!SP){ const p = fresh().buildProgram(JSON.parse(JSON.stringify(CFG))); const st = JSON.parse(JSON.stringify(p)); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:JSON.parse(JSON.stringify(CFG)) }); SP = JSON.stringify(st); } IA.ctx.__SP = JSON.parse(SP); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
const dayOf = (IA, w, d) => E(IA, 'activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d);
const slot = (dy, si, ii) => { const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items[ii]; return it ? clean(it.name) + ' | ' + (it.detail || '') : '(none)'; };
function hop(IA, c, h){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const it = dayOf(IA, c.w, c.d).sections[h.si].items[h.ii]; IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); }
const chains = JSON.parse(fs.readFileSync(path.join(SCR, 'chains_manny.json'), 'utf8')).filter(c => c.cls === 'hop2' || c.cls === 'cyc2');
const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
const lists = Object.values(byDay), nB = Math.max(...lists.map(l => l.length));
const seg = {}, ex = [];
for(let b = 0; b < nB; b++){
  const batch = lists.map(l => l[b]).filter(Boolean);
  const A = fresh(); setup(A); boot(A);
  for(const c of batch) for(const h of c.hops) hop(A, c, h);
  const live = {}; batch.forEach(c => { live[c.id] = slot(dayOf(A, c.w, c.d), c.hops[0].si, c.hops[0].ii); });
  const dev = new Map(A.localStorage._map);
  const F = fresh(); F.localStorage.clear(); for(const [k, v] of dev) F.localStorage.setItem(k, v); boot(F);
  boot(A);                                                   // IN-VM: the same page boots again
  batch.forEach(c => { const k = 'W' + c.w + '|' + c.cls; const o = seg[k] = seg[k] || { n:0, inVM:0, fresh:0 }; o.n++;
    const iv = slot(dayOf(A, c.w, c.d), c.hops[0].si, c.hops[0].ii), fr = slot(dayOf(F, c.w, c.d), c.hops[0].si, c.hops[0].ii);
    if(iv !== live[c.id]){ o.inVM++; if(ex.length < 6) ex.push(c.id + ' W' + c.w + ' ' + c.d + ' ' + c.hops.map(h => h.to).join('>') + '\n    live  ' + live[c.id] + '\n    inVM  ' + iv + '\n    fresh ' + fr); }
    if(fr !== live[c.id]) o.fresh++; });
}
let N = 0, I = 0, Fr = 0; Object.keys(seg).sort().forEach(k => { const o = seg[k]; N += o.n; I += o.inVM; Fr += o.fresh; console.log('  manny ' + k.padEnd(9) + ' slot != live: IN-VM boot ' + o.inVM + '/' + o.n + '   FRESH-page boot ' + o.fresh + '/' + o.n); });
console.log('  TOTAL manny hop2+cyc2: IN-VM ' + I + '/' + N + '  FRESH ' + Fr + '/' + N);
ex.forEach(x => console.log('  ' + x));
