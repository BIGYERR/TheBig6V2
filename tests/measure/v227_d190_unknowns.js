// v227_d190_unknowns.js — MEASURE (read-only). Two unknowns for the D190 re-ruling.
//   SCR=<scratch> node tests/measure/v227_d190_unknowns.js > tests/measure/v227_d190_unknowns.out.txt
// Needs the trees v227_d190_premises.js wrote in SCR (base_v226.html, d190_226.html).
// U1 the hop3 residue (A > B unloadable > A > C): full hop3/cyc3 enumeration on mario knee/wa, lowback/wa, elbow/wa W3+W5,
//    both trees; stored ia_swaps_ records printed for two rows. Oracle: live = what the athlete last saw; the boot is measured.
// U2 the exSwapPrefs build path: every natively cued source x every sheet candidate, one pref per build, V226 vs D190;
//    independent reference = the engine's native print of the same target movement with no pref (uninjured and knee/wa builds).
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const H = require(path.join(ROOT, 'tests', 'harness.js')); const { load, fixtures } = H;
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const F = n => path.join(SCR, n);
const CUE = ' — hold RPE 7, two in the tank';
const START = '2026-08-24', CLOCK = '2026-09-24', DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = inj => { const c = JSON.parse(JSON.stringify(MARIO)); if(inj) c.injury = inj; else delete c.injury; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), mario_noinj:withInj(null), lowback_wa:withInj({ region:'lowback', tier:'workaround' }),
  elbow_wa:withInj({ region:'elbow', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }),
  knee_protect:withInj({ region:'knee', tier:'protect' }) };
const TREES = { BASE:F('base_v226.html'), D190:F('d190_226.html') };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const clone = x => JSON.parse(JSON.stringify(x));
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
let FILE = null; const stored = {};
function fresh(){ const T = load(FILE); pin(T); E(T, HELP); return T; }
function setup(IA, ck){ IA.localStorage.clear(); pin(IA);
  if(!stored[ck]){ const P = fresh(); const p = P.buildProgram(clone(CFGS[ck])); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[ck] = JSON.stringify(st); }
  IA.ctx.__SP = JSON.parse(stored[ck]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
const dayOf = (IA, w, d) => E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d);
const sig = dy => (!dy || !dy.sections) ? '(none)' : dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '')).join(';') + '}').join(' ');
const slotOf = (dy, si, ii) => { const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n:clean(it.name), d:it.detail || '' } : { n:'(none)', d:'' }; };
function hop(IA, c, h){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections[h.si] && dy.sections[h.si].items[h.ii]; if(!it) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d; const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')')); const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); return (!can || !cands.includes(h.to)) ? 1 : 0; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const U1CK = ['mario', 'lowback_wa', 'elbow_wa'], U1W = [3, 5];

// ── U1 WORKER (tree:ck:w) ──
if(process.env.WORKER){
  const [tree, ck, w] = process.env.WORKER.split(':'); FILE = TREES[tree];
  const chains = JSON.parse(fs.readFileSync(F('u1chains_' + ck + '_' + w + '.json'), 'utf8'));
  const byDay = {}; chains.forEach(c => (byDay[c.d] = byDay[c.d] || []).push(c));
  const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length)); const out = [];
  for(let b = 0; b < nB; b++){
    const batch = lists.map(l => l[b]).filter(Boolean);
    const A = fresh(); setup(A, ck); boot(A); const st = {};
    batch.forEach(c => { const h = c.hops[0]; st[c.id] = { pre:slotOf(dayOf(A, c.w, c.d), h.si, h.ii), steps:[], unreach:0 }; });
    for(const c of batch) for(const h of c.hops){ st[c.id].unreach += hop(A, c, h); st[c.id].steps.push(slotOf(dayOf(A, c.w, c.d), h.si, h.ii)); }
    batch.forEach(c => { const h = c.hops[0], dy = dayOf(A, c.w, c.d); Object.assign(st[c.id], { liveSig:sig(dy), live:slotOf(dy, h.si, h.ii) }); });
    const swaps = JSON.parse(A.localStorage.getItem('ia_swaps_PM') || '{}');
    batch.forEach(c => { st[c.id].store = JSON.stringify((swaps['w' + c.w + '_' + c.d] || []).map(e => ({ from:e.from, to:e.to }))); });
    const R = fresh(); R.localStorage.clear(); for(const [k, v] of A.localStorage._map) R.localStorage.setItem(k, v); boot(R);
    batch.forEach(c => { const h = c.hops[0], dy = dayOf(R, c.w, c.d); Object.assign(st[c.id], { bootSig:sig(dy), boot:slotOf(dy, h.si, h.ii) });
      out.push(Object.assign({ id:c.id, ck, cls:c.cls, w:c.w, d:c.d, hops:c.hops.map(x => x.to) }, st[c.id])); });
  }
  fs.writeFileSync(F('u1res_' + tree + '_' + ck + '_' + w + '.json'), JSON.stringify(out)); process.exit(0);
}

// ── DRIVER ──
for(const f of Object.values(TREES)) if(!fs.existsSync(f)) throw new Error('missing tree ' + f + ' (run v227_d190_premises.js first)');
const SRC = fs.readFileSync(TREES.BASE, 'utf8').split('\n');
const lineOf = (re, from) => { for(let i = from || 0; i < SRC.length; i++) if(re.test(SRC[i])) return i + 1; return -1; };
console.log('v227_d190_unknowns | BASE ' + TREES.BASE + ' (ia-version ' + load(TREES.BASE).version + ') | D190 ' + TREES.D190);
// ── U1 mechanism, by code (lines read off the V226 tree) ──
console.log('\n=== U1 mechanism sites (V226)');
const lRS = lineOf(/^function recordSwap\(/);
console.log('  recordSwap :' + lRS + ' | same-from filter :' + lineOf(/const list=\(s\[k\]\|\|\[\]\)\.filter\(e=>e&&e\.from!==from\);/, lRS) + ' ' + SRC[lineOf(/const list=\(s\[k\]\|\|\[\]\)\.filter\(e=>e&&e\.from!==from\);/, lRS) - 1].trim());
console.log('  applySessionSwaps :' + lineOf(/^function applySessionSwaps\(/) + ' replays records in array order, one per pass, via applySwapPrefs :' + lineOf(/^function applySwapPrefs\(/) + ' -> _swapDetailFor :' + lineOf(/^function _swapDetailFor\(/));
console.log('  applySwapChoice live hop :' + lineOf(/item\.detail=_swapDetailFor\(to,item\.detail,_rx\);/) + ' (carries the current card detail, whatever B left on it)');
// U1 hand trace of the store for A>B>A>C (oracle: the recordSwap source text above, applied by hand)
{ let st = []; const rec = (f, t) => { st = st.filter(e => e.from !== f); st.push({ from:f, to:t }); };
  rec('A', 'B'); rec('B', 'A'); rec('A', 'C'); console.log('  hand trace of the filter on A>B, B>A, A>C: ' + JSON.stringify(st) + ' (the A>B record is gone; boot replays B>A (no B on the card: no-op) then A>C from the grid dose)'); }
// ── U1 enumeration: every hop3/cyc3 on the 3 configs x W3,W5 (enumerated on BASE) ──
FILE = TREES.BASE;
let total = 0;
for(const ck of U1CK){ const IA = fresh(); setup(IA, ck); boot(IA);
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')')); const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  for(const w of U1W){ const chains = []; let id = 0; const cc = {};
    for(const d of DAYS){ const live = dayOf(IA, w, d); if(!live || !live.sections) continue; const bs = clone(live); IA.ctx.__D = bs;
      const slots = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
      for(const sl of slots){ IA.ctx.__D = bs; const c1 = cand(w, sl.n); const memo = {};
        const cn = (dd, n) => { if(!(n in memo)){ IA.ctx.__D = dd; memo[n] = can(sl.si, sl.ii) ? cand(w, n) : []; } return memo[n]; };
        for(const Bn of c1){ const d1 = clone(bs); d1.sections[sl.si].items[sl.ii].name = Bn; const c2 = cn(d1, Bn);
          for(const C of c2){ const d2 = clone(bs); d2.sections[sl.si].items[sl.ii].name = C; const c3 = cn(d2, C);
            for(const Dn of c3){ const cls = Dn === sl.n ? 'cyc3' : 'hop3'; const shape = C === sl.n ? 'A>B>A>C' : 'A>B>C>D';
              chains.push({ id:ck + w + '#' + id++, cls, shape, w, d, hops:[Bn, C, Dn].map(to => ({ si:sl.si, ii:sl.ii, to })) }); cc[cls + '|' + shape] = (cc[cls + '|' + shape] || 0) + 1; } } } } }
    fs.writeFileSync(F('u1chains_' + ck + '_' + w + '.json'), JSON.stringify(chains)); total += chains.length;
    console.log('  U1 ENUM ' + ck + ' W' + w + ': ' + chains.length + ' ' + JSON.stringify(cc)); } }
console.log('  U1 ENUM total ' + total + ' chains per tree (memo note: a candidate list is computed per (slot, current name), as the sheet would, on the untouched day)');

// ── U2 (synchronous, before the U1 workers) ──
console.log('\n=== U2 the build pass');
{ const lA = lineOf(/^function accessoryGrammarSweep\(/), lM = lineOf(/const m=\/\^\(\\d\+\)×\(\\d\+\)\(–\\d\+\)\?\( each\)\?\$\/\.exec\(it\.detail\|\|''\);/, lA), lC = lineOf(/unloadableRxSweep\(weeks, cfg\); accessoryGrammarSweep\(weeks, cfg\);/), lP = lineOf(/if\(cfg\.exSwapPrefs && Object\.keys\(cfg\.exSwapPrefs\)\.length\)\{/), lF = lineOf(/applyInjuryFilter\(buildSections\(role,w,/);
  console.log('  accessoryGrammarSweep :' + lA + ' | predicate :' + lM + ' ' + SRC[lM - 1].trim() + ' | exemptions _BW_KEEP_FIXED / _GRAMMAR_BALLISTIC on the NAME');
  console.log('  build order: native applyInjuryFilter :' + lF + ' (cue written) -> exSwapPrefs block :' + lP + ' (applySwapPrefs, then applyInjuryFilter on a hit) -> grammar sweep call :' + lC + ' (LAST)');
  for(const [t, f] of Object.entries(TREES)){ const X = load(f);
    X.ctx.__W = { 3:{ thu:{ sections:[{ label:'x', items:[{ name:'Dumbbell split-stance deadlift', detail:'2×10 each' }, { name:'Dumbbell split-stance deadlift', detail:'2×10 each' + CUE }] }] } } };
    X.eval("accessoryGrammarSweep(__W,{experience:'beginner',liftingFocus:'support_strength'})");
    console.log('  ' + t + ' accessoryGrammarSweep on W3 beginner: "2×10 each" -> ' + JSON.stringify(X.ctx.__W[3].thu.sections[0].items[0].detail) + ' | "2×10 each' + CUE + '" -> ' + JSON.stringify(X.ctx.__W[3].thu.sections[0].items[1].detail)); }
}
// reference: native print of each target movement, no pref, uninjured and knee/wa
const builds = {}; const bld = (t, cfg) => { const X = load(TREES[t]); pin(X); return X.buildProgram(clone(cfg)); };
const cards = p => { const m = []; Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => m.push({ k:w + '|' + d + '|' + si + '|' + ii, w, d, label:clean(s.label), n:clean(it.name), det:it.detail || '' }))); })); return m; };
const NAT = {}; for(const ck of ['mario_noinj', 'mario']) NAT[ck] = cards(bld('BASE', CFGS[ck]));
const natOf = (ck, name) => { const t = tally(NAT[ck].filter(c => c.n === name), c => c.label.replace(/ — .*/, '') + ': ' + c.det); return fmt(t); };
// population
console.log('\n=== U2 population: one exSwapPrefs pref per natively cued source x every sheet candidate of it (taken on a day it is on)');
const PCK = ['mario', 'lowback_wa', 'hip_wa', 'elbow_wa', 'shoulder_wa']; const agg = []; const detail = [];
for(const ck of PCK){
  const base = cards(bld('BASE', CFGS[ck])); const cued = base.filter(c => c.det.endsWith(CUE)); const srcs = [...new Set(cued.map(c => c.n))];
  FILE = TREES.BASE; const IA = fresh(); setup(IA, ck); boot(IA);
  let pairs = 0, moved = 0, cardsMoved = 0, cardsTot = 0; const kinds = {};
  for(const s of srcs){ const c0 = cued.find(c => c.n === s); const dy = dayOf(IA, +c0.w, c0.d); IA.ctx.__D = dy; const tg = dy ? Array.from(E(IA, '__cands(__D,' + c0.w + ',' + JSON.stringify(s) + ')')) : [];
    for(const t of tg){ pairs++; const cfg = clone(CFGS[ck]); cfg.exSwapPrefs = { [s]:t };
      const a = cards(bld('BASE', cfg)), b = cards(bld('D190', cfg)); const bm = new Map(b.map(x => [x.k, x])); let mv = 0;
      a.forEach(x => { if(x.n !== t) return; cardsTot++; const y = bm.get(x.k); if(!y || y.n !== x.n || y.det !== x.det){ mv++;
        const k = !y ? 'gone' : x.det === y.det + CUE ? '(ii) cue dropped only' : (x.det.endsWith(CUE) && /@ RPE/.test(y.det) && !/@ RPE/.test(x.det)) ? '(ii+g) cue dropped, grammar sweep rewrote' : 'other';
        kinds[k] = (kinds[k] || 0) + 1; detail.push(ck + ' {' + s + ': ' + t + '} W' + x.w + ' ' + x.d + ' ' + x.label + ' :: ' + JSON.stringify(x.det) + ' => ' + JSON.stringify(y && y.det) + ' [' + k + '] | native ' + t + ' (no pref) noinj: ' + natOf('mario_noinj', t) + ' || knee/wa: ' + natOf('mario', t)); } });
      a.forEach((x, i) => { if(x.n === t) return; const y = bm.get(x.k); if(!y || y.det !== x.det || y.n !== x.n){ mv++; kinds['non-target card'] = (kinds['non-target card'] || 0) + 1; } });
      if(mv){ moved++; cardsMoved += mv; } } }
  agg.push([ck, srcs.length, pairs, moved, cardsMoved, cardsTot, kinds]);
  console.log('  ' + ck.padEnd(12) + ' natively cued sources ' + srcs.length + ' ' + JSON.stringify(srcs) + ' | prefs ' + pairs + ' | builds moved ' + moved + '/' + pairs + ' | cards moved ' + cardsMoved + ' of ' + cardsTot + ' target cards | ' + JSON.stringify(kinds));
}
fs.writeFileSync(F('u2_moved_cards.txt'), detail.join('\n') + '\n'); console.log('  every moved card (with the native reference): ' + F('u2_moved_cards.txt') + ' (' + detail.length + ' lines). First 8:'); detail.slice(0, 8).forEach(x => console.log('    ' + x.slice(0, 600)));
{ const ref = detail.filter(x => /\(ii\+g\)/.test(x)); const eqNat = ref.filter(x => { const m = /=> "([^"]*)"/.exec(x), n = /noinj: (.*) \|\| knee/.exec(x); return m && n && n[1].includes(m[1]); });
  console.log('  (ii+g) cards whose D190 detail appears among the native no-pref prints of the same movement (uninjured build): ' + eqNat.length + '/' + ref.length); }
console.log('  HALF_MANNY exSwapPrefs: ' + JSON.stringify(fixtures.HALF_MANNY.exSwapPrefs || null));
console.log('  exSwapPrefs writers in V226 (non-comment lines): ' + SRC.map((l, i) => [i + 1, l]).filter(([i, l]) => /exSwapPrefs\s*(\[[^\]]*\])?\s*=[^=]/.test(l) && !/^\s*\/\//.test(l)).map(([i, l]) => ':' + i + ' ' + l.trim()).join(' || '));
console.log('  acceptSwapNudge :' + lineOf(/^function acceptSwapNudge\(/) + ' <- button onclick :' + lineOf(/onclick="acceptSwapNudge\(\)"/) + ' <- showSwapNudge :' + lineOf(/^function showSwapNudge\(/) + ' <- applySwapChoice nudge :' + lineOf(/if\(nudge\) setTimeout\(\(\)=>showSwapNudge\(from,to\),1400\);/) + ' <- bumpSwapCount :' + lineOf(/^function bumpSwapCount\(/) + ' (SWAP_NUDGE_AT ' + (SRC.find(l => /SWAP_NUDGE_AT\s*=/.test(l)) || '').trim() + ')');

// ── U1 workers ──
(async () => {
  const jobs = []; for(const t of ['BASE', 'D190']) for(const ck of U1CK) for(const w of U1W){ const j = t + ':' + ck + ':' + w; try { fs.unlinkSync(F('u1res_' + j.replace(/:/g, '_') + '.json')); } catch(e){} jobs.push(j); }
  let i = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length:7 }, async () => { while(i < jobs.length){ const j = jobs[i++]; await new Promise(res => { const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j }), stdio:['ignore', 'pipe', 'pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', c => { if(c) console.log('WORKER CRASH ' + j + ' ' + o.slice(-400)); res(); }); }); } }));
  console.log('\n=== U1 results (workers ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  const R = {}; for(const j of jobs){ const f = F('u1res_' + j.replace(/:/g, '_') + '.json'); if(!fs.existsSync(f)){ console.log('MISSING ' + j + ' (failed measurement)'); continue; } R[j] = JSON.parse(fs.readFileSync(f, 'utf8')); }
  const all = t => Object.keys(R).filter(k => k.startsWith(t + ':')).flatMap(k => R[k]);
  const B = new Map(all('BASE').map(r => [r.id, r]));
  const cueIn = r => [r.pre.d, r.live.d, r.boot.d].concat(r.steps.map(s => s.d)).some(x => x.endsWith(CUE));
  const unl = r => /^\d+ sets — RPE/.test(r.steps[0].d);
  for(const t of ['BASE', 'D190']){ const rr = all(t).filter(r => !r.unreach); const res = rr.filter(r => r.live.d !== r.boot.d || r.live.n !== r.boot.n || r.liveSig !== r.bootSig);
    console.log('  ' + t + ': reachable ' + rr.length + '/' + all(t).length + ' | residue (slot or whole day live != boot) ' + res.length + '/' + rr.length);
    console.log('    by config|week: ' + Object.entries(tally(rr, r => r.ck + '|W' + r.w)).map(([k, n]) => k + ' ' + res.filter(r => r.ck + '|W' + r.w === k).length + '/' + n).join(' | '));
    console.log('    by shape: ' + Object.entries(tally(rr, r => r.cls + ' ' + (r.hops[1] === r.pre.n ? 'A>B>A>x' : 'A>B>C>x'))).map(([k, n]) => k + ' ' + res.filter(r => r.cls + ' ' + (r.hops[1] === r.pre.n ? 'A>B>A>x' : 'A>B>C>x') === k).length + '/' + n).join(' | '));
    console.log('    residue split: (a) cue anywhere in the chain ' + res.filter(cueIn).length + ' | (b) no cue anywhere ' + res.filter(r => !cueIn(r)).length);
    console.log('    residue x first hop to an unloadable (B left "N sets — RPE"): ' + fmt(tally(res, r => (r.hops[1] === r.pre.n ? 'revisit' : 'no-revisit') + '|' + (unl(r) ? 'B unloadable' : 'B loaded') + '|' + (cueIn(r) ? 'a' : 'b'))));
    console.log('    residue store shape: ' + fmt(tally(res, r => { const s = JSON.parse(r.store); return s.length + ' records' + (s.some(e => e.from === r.pre.n && e.to === r.hops[0]) ? ', A>B kept' : ', A>B gone'); })) + ' | non-residue revisit chains with A>B gone: ' + rr.filter(r => !res.includes(r) && r.hops[1] === r.pre.n).filter(r => !JSON.parse(r.store).some(e => e.from === r.pre.n && e.to === r.hops[0])).length + '/' + rr.filter(r => !res.includes(r) && r.hops[1] === r.pre.n).length);
    console.log('    residue kinds (live -> boot): ' + fmt(tally(res, r => (/^\d+ sets — RPE/.test(r.live.d) ? 'live bw-sets form' : r.live.d.endsWith(CUE) ? 'live cued' : 'live loaded') + ' -> ' + (/^\d+ sets — RPE/.test(r.boot.d) ? 'boot bw-sets form' : r.boot.d.endsWith(CUE) ? 'boot cued' : 'boot loaded')))); }
  const D = all('D190'); const Dm = new Map(D.map(r => [r.id, r]));
  const resOf = r => r && !r.unreach && (r.live.d !== r.boot.d || r.live.n !== r.boot.n || r.liveSig !== r.bootSig);
  const ids = [...B.keys()];
  console.log('  V226 -> D190: residue both ' + ids.filter(id => resOf(B.get(id)) && resOf(Dm.get(id))).length + ' | healed by D190 ' + ids.filter(id => resOf(B.get(id)) && !resOf(Dm.get(id))).length + ' | created by D190 ' + ids.filter(id => !resOf(B.get(id)) && resOf(Dm.get(id))).length
    + ' | healed by kind ' + fmt(tally(ids.filter(id => resOf(B.get(id)) && !resOf(Dm.get(id))).map(id => B.get(id)), r => r.ck + '|' + (cueIn(r) ? 'a' : 'b'))) + ' | created ' + fmt(tally(ids.filter(id => !resOf(B.get(id)) && resOf(Dm.get(id))).map(id => Dm.get(id)), r => r.ck + '|' + (cueIn(r) ? 'a' : 'b'))));
  // two rows printed with the stored records
  const pick = [...B.values()].filter(r => resOf(r) && !cueIn(r)).slice(0, 1).concat([...B.values()].filter(r => resOf(r) && cueIn(r) && r.hops[1] === r.pre.n).slice(0, 1));
  pick.forEach(r => { const d = Dm.get(r.id); console.log('  ROW ' + r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' ' + r.pre.n + ' (' + r.pre.d + ') > ' + r.hops.join(' > ') + '\n    V226 steps ' + r.steps.map(s => JSON.stringify(s.d)).join(' , ') + ' | boot ' + JSON.stringify(r.boot.d) + '\n    V226 ia_swaps_PM[w' + r.w + '_' + r.d + '] ' + r.store
    + '\n    D190 steps ' + d.steps.map(s => JSON.stringify(s.d)).join(' , ') + ' | boot ' + JSON.stringify(d.boot.d) + ' | store ' + d.store); });
  // the 6 sampled rows from the premises pass, re-run on V226 with the store printed
  const prem = { knee_protect:'knee_protect#1946', lowback_wa:'lowback_wa#1209' };
  for(const [ck, id] of Object.entries(prem)){ const ch = JSON.parse(fs.readFileSync(F('chains_' + ck + '.json'), 'utf8')).find(c => c.id === id); if(!ch){ console.log('  ' + id + ' not found'); continue; }
    for(const t of ['BASE', 'D190']){ FILE = TREES[t]; const A = fresh(); setup(A, ck); boot(A); const steps = []; for(const h of ch.hops){ hop(A, ch, h); steps.push(slotOf(dayOf(A, ch.w, ch.d), h.si, h.ii).d); }
      const st = JSON.parse(A.localStorage.getItem('ia_swaps_PM') || '{}')['w' + ch.w + '_' + ch.d]; const Rb = fresh(); Rb.localStorage.clear(); for(const [k, v] of A.localStorage._map) Rb.localStorage.setItem(k, v); boot(Rb);
      console.log('  PREMISES ROW ' + id + ' on ' + t + ': ' + ch.hops.map(h => h.to).join(' > ') + ' | steps ' + steps.map(s => JSON.stringify(s)).join(' , ') + ' | boot ' + JSON.stringify(slotOf(dayOf(Rb, ch.w, ch.d), ch.hops[0].si, ch.hops[0].ii).d)
        + '\n    stored ' + JSON.stringify((st || []).map(e => ({ from:e.from, to:e.to, rx:e.rx })))); } }
})();
