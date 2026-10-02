// v228_undokey_bootdiag.js — MEASURE instrument check: after undo, does an in-VM reboot (refreshProgram again in the same VM)
// equal a fresh-VM boot from a copy of the same localStorage? Which one equals the live day? Prints the differing item.
//   SCR=<dir with u_*.html and uc_*.json> TREE=CF CHUNKS=h3_elbow_wa_3_0,... MAXB=400 node tests/measure/v228_undokey_bootdiag.js
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'; const { load } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR, TREE = process.env.TREE || 'CF', MAXB = +(process.env.MAXB || 400);
const FILE = path.join(SCR, { V227:'u_v227.html', CF:'u_cf.html' }[TREE]); const START = '2026-08-24', CLOCK = '2026-09-24';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const wi = inj => { const c = JSON.parse(JSON.stringify(MARIO)); if(inj) c.injury = inj; return c; };
const CFGS = { mario:wi({ region:'knee', tier:'workaround' }), lowback_wa:wi({ region:'lowback', tier:'workaround' }), elbow_wa:wi({ region:'elbow', tier:'workaround' }), manny:JSON.parse(JSON.stringify(require(path.join(ROOT, 'tests', 'harness.js')).fixtures.HALF_MANNY)), mario_noinj:wi(null) };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim(); const CLK = /^_?(ts|at|time|stamp|clock|now)$/i; const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x); const clone = x => JSON.parse(JSON.stringify(x));
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c); const stored = {};
function fresh(){ const T = load(FILE); pin(T); E(T, 'globalThis.__T=[];showToast=function(m){__T.push(String(m));};'); return T; }
function setup(IA, ck){ IA.localStorage.clear(); pin(IA); if(!stored[ck]){ const p = fresh().buildProgram(clone(CFGS[ck])); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[ck] = JSON.stringify(st); } IA.ctx.__SP = JSON.parse(stored[ck]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
const dayOf = (IA, w, d) => E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d);
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const it = dayOf(IA, c.w, c.d).sections[c.si].items[c.ii]; IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:it.name, detail:it.detail }; IA.ctx.__to = to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); }
const firstDiff = (a, b) => { for(let si = 0; si < Math.max(a.length, b.length); si++){ const x = (a[si] || {}).items || [], y = (b[si] || {}).items || []; for(let ii = 0; ii < Math.max(x.length, y.length); ii++) if(JSON.stringify(x[ii]) !== JSON.stringify(y[ii])) return si + '.' + ii + ' ' + clean((x[ii] || {}).name) + ' | ' + (x[ii] || {}).detail + '  VS  ' + clean((y[ii] || {}).name) + ' | ' + (y[ii] || {}).detail; } return 'section-level'; };
const T = {}; const add = k => T[k] = (T[k] || 0) + 1; const ex = [];
for(const ch of (process.env.CHUNKS || '').split(',').filter(Boolean)){ const meta = JSON.parse(fs.readFileSync(path.join(SCR, 'uc_' + ch + '.json'), 'utf8')); const ck = meta.ck;
  const byDay = {}; meta.chains.forEach(c => (byDay[c.d] = byDay[c.d] || []).push(c)); const lists = Object.values(byDay); const nB = Math.min(MAXB, Math.max(...lists.map(l => l.length)));
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); const A = fresh(); setup(A, ck); boot(A); const rs = [];
    for(const c of batch){ c.hops.forEach(to => hop(A, c, to)); E(A, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = clean(dayOf(A, c.w, c.d).sections[c.si].items[c.ii].name); const chip = E(A, 'swapOriginOf(' + JSON.stringify(cur) + ')'); if(chip) E(A, 'undoSwap(' + JSON.stringify(chip) + ');'); rs.push({ c, live:JSON.parse(JS(dayOf(A, c.w, c.d).sections)) }); }
    const ls = []; for(const [k, v] of A.localStorage._map) ls.push([k, v]);
    const order = process.env.ORDER || 'inVMfirst';
    const doFresh = () => { const Bt = fresh(); Bt.localStorage.clear(); ls.forEach(([k, v]) => Bt.localStorage.setItem(k, v)); boot(Bt); return Bt; };
    let Bt = null; if(order !== 'inVMfirst') Bt = doFresh(); boot(A); if(!Bt) Bt = doFresh();
    for(const r of rs){ const iv = JSON.parse(JS(dayOf(A, r.c.w, r.c.d).sections)), fv = JSON.parse(JS(dayOf(Bt, r.c.w, r.c.d).sections)); const L = JSON.stringify(r.live), I = JSON.stringify(iv), Fr = JSON.stringify(fv);
      const k = 'inVM==live ' + (I === L) + ' | fresh==live ' + (Fr === L) + ' | inVM==fresh ' + (I === Fr); add(k);
      if(I !== Fr && ex.length < 6) ex.push(ck + ' W' + r.c.w + ' ' + r.c.d + ' ' + r.c.hops.join(' > ') + '\n    live vs inVM: ' + (I === L ? '=' : firstDiff(r.live, iv)) + '\n    live vs fresh: ' + (Fr === L ? '=' : firstDiff(r.live, fv))); } } }
console.log('bootdiag tree ' + TREE + ' chunks ' + process.env.CHUNKS + ' MAXB ' + MAXB + ' order ' + (process.env.ORDER || 'inVMfirst')); Object.keys(T).sort().forEach(k => console.log('  ' + k + '  ' + T[k])); ex.forEach(e => console.log('  EX ' + e));
