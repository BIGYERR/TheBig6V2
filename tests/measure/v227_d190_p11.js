// v227_d190_p11.js — MEASURE (read-only). D190 RE-RULING 2 premise P11: row (d) on the seam gate's own walk, split by the
// hand rule U_d (hop `to` names pairwise distinct across the day) vs U_d'; plus the named trip (drop undoSwap's hit.rx block).
//   SCR=<scratch> node tests/measure/v227_d190_p11.js > tests/measure/v227_d190_p11.out.txt
// Enumerator: copied from tests/gates/g227_d190_seam.js (read, not edited): same N/N3/NC, same hstr/mulberry/shuffled seeds,
//   same FULL days, same classes. Configs: the gate's six workaround regions (knee ankle hip lowback shoulder elbow) PLUS
//   HALF_MANNY and mario_noinj (not in the gate's CFGS; added here to answer the brief), W3+W5.
// Trees: V227 = copy of the working index.html; V226 = scratchpad/base_v226.html; SAB = V227 with the `if(Array.isArray(hit.rx)){…}`
//   block in undoSwap removed (anchor count 1).
// ORACLE: hand chip = the last hop's `from` as carried on the chain tuple (the card the enumerator read); expected day after
//   undo = the whole day (clock fields stripped) the live page showed before the last hop. The chip itself is read exactly as
//   the card renders it: swapOriginOf(<name now on the last hop's slot>), with currentWeek/currentDayKey on the chain's day.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const N = 40, N3 = 6, NC = 8;
const START = '2026-08-24', CLOCK = '2026-09-24';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const wa = region => { const c = JSON.parse(JSON.stringify(MARIO)); c.injury = { region, tier:'workaround' }; return c; };
const noinj = (() => { const c = JSON.parse(JSON.stringify(MARIO)); delete c.injury; return c; })();
const CFGS = { knee_wa:wa('knee'), ankle_wa:wa('ankle'), hip_wa:wa('hip'), lowback_wa:wa('lowback'), shoulder_wa:wa('shoulder'), elbow_wa:wa('elbow'),
  manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), mario_noinj:noinj };
const FULL = { knee_wa:['tue', 'thu', 'sat'], ankle_wa:['tue', 'thu', 'sat'] };
const WEEKS = [3, 5], DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], LAT = ['hop1', 'hop2', 'cyc2'];
const CLS = ['hop1', 'hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
const clone = x => JSON.parse(JSON.stringify(x));
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i; const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};showToast=function(){};";
const TREES = { V227:F('p11_v227.html'), V226:F('p11_v226.html'), SAB:F('p11_sab_norx.html') };
let FILE = null; const stored = {};
function fresh(){ const T = load(FILE); pin(T); E(T, HELP); return T; }
function setup(IA, ck){ IA.localStorage.clear(); pin(IA); const key = FILE + ck; if(!stored[key]){ const P = fresh(); const p = P.buildProgram(clone(CFGS[ck])); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[key] = JSON.stringify(st); } IA.ctx.__SP = JSON.parse(stored[key]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
function view(IA, w, d){ E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA, w, d){ return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
function hop(IA, c, h){ view(IA, c.w, c.d); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections[h.si] && dy.sections[h.si].items[h.ii]; if(!it) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d; const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')')); const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); return (!can || !cands.includes(h.to)) ? 1 : 0; }
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; }
function shuffled(arr, key){ const a = arr.slice(), r = mulberry(hstr(key)); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const inUd = c => new Set(c.hops.map(h => h.to)).size === c.hops.length;

// ── trees ──
for(const f of Object.values(TREES)) try { fs.unlinkSync(f); } catch(e){}
const v227 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); fs.writeFileSync(TREES.V227, v227);
fs.copyFileSync(path.join(path.dirname(SCR), 'base_v226.html'), TREES.V226);
{ const a = '  if(Array.isArray(hit.rx)){\n', b = '\n  clearSwap(activeProgId,currentWeek,currentDayKey,from);';
  const na = v227.split(a).length - 1, nb = v227.split(b).length - 1; if(na !== 1 || nb !== 1) throw new Error('SAB anchors ' + na + '/' + nb);
  const i = v227.indexOf(a), j = v227.indexOf(b); if(!(i < j && j - i < 1200)) throw new Error('SAB span');
  const l0 = v227.slice(0, i).split('\n').length, l1 = v227.slice(0, j).split('\n').length;
  fs.writeFileSync(TREES.SAB, v227.slice(0, i) + v227.slice(j + 1));
  console.log('v227_d190_p11 | V227 ia-version ' + load(TREES.V227).version + ' (working index.html) | V226 ' + load(TREES.V226).version + ' | SAB = V227 minus index.html:' + l0 + '–' + l1 + ' (the hit.rx restore block in undoSwap):\n' + v227.slice(i, j).split('\n').map(x => '    - ' + x).join('\n'));
  const S = v227.split('\n'); const ln = re => S.findIndex(l => re.test(l)) + 1;
  console.log('  sites: swapOriginOf :' + ln(/^function swapOriginOf\(/) + ' (first to-match :' + ln(/const hit=list\.filter\(e=>e&&e\.to===name\)\[0\];/) + ') | card chip :' + ln(/const _swappedFrom=_canSwap\?swapOriginOf/) + ' | undoSwap :' + ln(/^function undoSwap\(/) + ' (first from-match :' + ln(/const hit=list\.filter\(e=>e&&e\.from===from\)\[0\];/) + ', rename back :' + ln(/const back=\{\}; back\[hit\.to\]=from;/) + ')'); }

// ── ENUMERATE on V227 (the gate's enumerator) ──
FILE = TREES.V227; const POP = {};
for(const ck of Object.keys(CFGS)){
  const IA = fresh(); setup(IA, ck); boot(IA); const pop = []; let id = 0;
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const mk = (cls, w, d, hops, full) => ({ id:ck + '#' + id++, ck, cls, w, d, hops, full:!!full });
  for(const w of WEEKS) for(const d of DAYS){
    const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
    const base = clone(live); IA.ctx.__D = base;
    const slots = []; base.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
    if(!slots.length) continue;
    const full = (FULL[ck] || []).includes(d);
    const lat = { hop1:[], hop2:[], cyc2:[] }, two = [], col = [], exc = [];
    for(const sl of slots){ IA.ctx.__D = base; const c1 = cand(w, sl.n);
      for(const Bn of c1){ const h1 = { si:sl.si, ii:sl.ii, from:sl.n, to:Bn }; lat.hop1.push([h1]);
        const d1 = clone(base); d1.sections[sl.si].items[sl.ii].name = Bn; IA.ctx.__D = d1; if(!can(sl.si, sl.ii)) continue;
        for(const C of cand(w, Bn)){ const hops = [h1, { si:sl.si, ii:sl.ii, from:Bn, to:C }]; lat[C === sl.n ? 'cyc2' : 'hop2'].push(hops); two.push({ sl, d1, C, hops }); } } }
    for(const si of slots) for(const sj of slots){ if(si === sj) continue;
      IA.ctx.__D = base; for(const X of cand(w, si.n)){ const d1 = clone(base); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
        if(!cand(w, sj.n).includes(si.n)) continue;
        const h2 = [{ si:si.si, ii:si.ii, from:si.n, to:X }, { si:sj.si, ii:sj.ii, from:sj.n, to:si.n }]; col.push(h2);
        const d2 = clone(d1); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
        if(can(si.si, si.ii) && cand(w, X).includes(sj.n)) exc.push(h2.concat([{ si:si.si, ii:si.ii, from:X, to:sj.n }])); } }
    const h3 = [], h3r = [], c3l = []; const rnd = mulberry(hstr(ck + '|' + w + '|' + d + '|h3'));
    for(const t of shuffled(two, ck + '|' + w + '|' + d + '|two').slice(0, 160)){
      const rv = t.C === t.sl.n;
      if(h3.length >= N3 && h3r.length >= N3 && c3l.length >= N3) break;
      const d2 = clone(t.d1); d2.sections[t.sl.si].items[t.sl.ii].name = t.C; IA.ctx.__D = d2; if(!can(t.sl.si, t.sl.ii)) continue;
      const c3 = cand(w, t.C); if(!c3.length) continue;
      if(!rv && c3.includes(t.sl.n) && c3l.length < N3){ c3l.push(t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, from:t.C, to:t.sl.n }])); continue; }
      const others = c3.filter(x => x !== t.sl.n); if(!others.length) continue;
      const tgt = rv ? h3r : h3; if(tgt.length < N3) tgt.push(t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, from:t.C, to:others[Math.floor(rnd() * others.length)] }]));
    }
    for(const cls of LAT){ const take = full ? lat[cls] : shuffled(lat[cls], ck + '|' + w + '|' + d + '|' + cls).slice(0, N); take.forEach(h => pop.push(mk(cls, w, d, h, full))); }
    shuffled(col, ck + w + d + 'col').slice(0, NC).forEach(h => pop.push(mk('collide2', w, d, h)));
    shuffled(exc, ck + w + d + 'exc').slice(0, NC).forEach(h => pop.push(mk('exch3', w, d, h)));
    h3.concat(h3r).forEach(h => pop.push(mk('hop3', w, d, h))); c3l.forEach(h => pop.push(mk('cyc3', w, d, h)));
  }
  POP[ck] = pop; console.log('  ENUM ' + ck.padEnd(11) + ' ' + pop.length + ' ' + fmt(tally(pop, c => c.cls)));
}
// ── RUN (fresh page per batch, one chain per day per batch; undo only, as the chip does) ──
function run(tree){ FILE = TREES[tree]; const out = [];
  for(const ck of Object.keys(CFGS)){ const byDay = {}; POP[ck].forEach(c => (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c));
    const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length));
    for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); const A = fresh(); setup(A, ck); boot(A);
      for(const c of batch){ const s = { c, unreach:0 }; const L = c.hops.length - 1;
        c.hops.forEach((h, k) => { if(k === L) s.prevJ = JS(dayOf(A, c.w, c.d).sections); s.unreach += hop(A, c, h); });
        const hl = c.hops[L]; view(A, c.w, c.d); const nm = dayOf(A, c.w, c.d).sections[hl.si].items[hl.ii].name;
        s.card = clean(nm); s.store = ((JSON.parse(A.localStorage.getItem('ia_swaps_PM') || '{}')['w' + c.w + '_' + c.d]) || []).map(e => e.from + '->' + e.to);
        s.chip = E(A, 'swapOriginOf(' + JSON.stringify(nm) + ')') || '';
        if(s.chip) E(A, 'undoSwap(' + JSON.stringify(s.chip) + ');');
        const after = JS(dayOf(A, c.w, c.d).sections); s.undoEq = !!s.chip && after === s.prevJ;
        if(!s.undoEq){ const P = JSON.parse(s.prevJ), Q = JSON.parse(after); s.diff = []; P.forEach((sec, si) => (sec.items || []).forEach((it, ii) => { const q = Q[si] && Q[si].items && Q[si].items[ii]; if(!q || JSON.stringify(q) !== JSON.stringify(it)) s.diff.push('[' + si + '][' + ii + '] ' + clean(it.name) + ' ' + JSON.stringify(it.detail) + ' => ' + (q ? clean(q.name) + ' ' + JSON.stringify(q.detail) : '(none)')); })); if(!s.diff.length) s.diff.push('non-item field (label or order)'); }
        delete s.prevJ; out.push(s); } } }
  return out; }
const RES = {}; for(const t of ['V227', 'V226', 'SAB']){ const t0 = Date.now(); RES[t] = run(t); console.log('  ran ' + t + ' ' + RES[t].length + ' chains in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
const by = t => new Map(RES[t].map(s => [s.c.id, s]));
const M7 = by('V227'), M6 = by('V226'), MS = by('SAB');
const R7 = RES.V227.filter(s => !s.unreach);
console.log('\n=== P11 row (d) on the seam walk (V227) | reachable ' + R7.length + '/' + RES.V227.length);
const Ud = R7.filter(s => inUd(s.c)), Udp = R7.filter(s => !inUd(s.c));
const handChip = s => s.c.hops[s.c.hops.length - 1].from;
console.log('  class      |U_d|   chip found  chip==hand  undo byte-identical  wrong   ||  |U_d\'|  undo wrong  V226 wrong  created  healed');
let allOK = true;
for(const cls of CLS){ const u = Ud.filter(s => s.c.cls === cls), up = Udp.filter(s => s.c.cls === cls);
  const found = u.filter(s => s.chip).length, eqh = u.filter(s => s.chip === handChip(s)).length, ok = u.filter(s => s.undoEq).length;
  const upw = up.filter(s => !s.undoEq).length, up6 = up.filter(s => M6.get(s.c.id) && !M6.get(s.c.id).unreach && !M6.get(s.c.id).undoEq).length;
  const cr = up.filter(s => { const b = M6.get(s.c.id); return b && !b.unreach && b.undoEq && !s.undoEq; }).length, he = up.filter(s => { const b = M6.get(s.c.id); return b && !b.unreach && !b.undoEq && s.undoEq; }).length;
  if(u.length === 0 || ok !== u.length || eqh !== u.length) allOK = false;
  console.log('  ' + cls.padEnd(9) + String(u.length).padStart(7) + String(found).padStart(12) + String(eqh).padStart(12) + String(ok).padStart(20) + String(u.length - ok).padStart(8) + '   ||' + String(up.length).padStart(7) + String(upw).padStart(12) + String(up6).padStart(12) + String(cr).padStart(9) + String(he).padStart(8)); }
const udCr = Ud.filter(s => { const b = M6.get(s.c.id); return b && !b.unreach && b.undoEq && !s.undoEq; }).length;
console.log('  TOTAL U_d ' + Ud.length + ', wrong ' + Ud.filter(s => !s.undoEq).length + ', chip != hand ' + Ud.filter(s => s.chip !== handChip(s)).length + ' | U_d created vs V226 ' + udCr + ' | U_d\' ' + Udp.length + ' wrong ' + Udp.filter(s => !s.undoEq).length + ' | P11 ' + (allOK && udCr === 0 && Udp.length > 0 ? 'PASS' : 'FAIL') + ' (each class non-empty, 0 wrong, chip == hand chip on every U_d chain; U_d\' non-empty, created 0)');
console.log('  U_d by config: ' + Object.keys(CFGS).map(ck => ck + ' ' + Ud.filter(s => s.c.ck === ck && s.undoEq).length + '/' + Ud.filter(s => s.c.ck === ck).length).join(' | '));
console.log('  U_d\' wrong by shape: ' + fmt(tally(Udp.filter(s => !s.undoEq), s => s.c.cls + '|' + (s.c.hops.length === 3 && s.c.hops[1].to === s.c.hops[0].from ? 'A>B>A>B' : 'A>B>C>B')))
  + ' | right ' + fmt(tally(Udp.filter(s => s.undoEq), s => s.c.cls + '|' + (s.c.hops.length === 3 && s.c.hops[1].to === s.c.hops[0].from ? 'A>B>A>B' : 'A>B>C>B'))));
Ud.filter(s => !s.undoEq).slice(0, 4).forEach(s => console.log('    WRONG ' + s.c.ck + ' W' + s.c.w + ' ' + s.c.d + ' ' + s.c.cls + ' ' + s.c.hops.map(h => '[' + h.si + '][' + h.ii + '] ' + h.from + '->' + h.to).join(', ') + ' | chip ' + s.chip + ' | ' + s.diff.join('; ')));
// cross-slot rows printed: one collide2, one exch3
for(const cls of ['collide2', 'exch3']){ const s = Ud.find(x => x.c.cls === cls && x.c.ck === 'knee_wa'); if(!s) continue;
  console.log('  e.g. ' + cls + ' ' + s.c.ck + ' W' + s.c.w + ' ' + s.c.d + ' ' + s.c.hops.map(h => '[' + h.si + '][' + h.ii + '] ' + h.from + '->' + h.to).join(', ') + '\n      last hop card [' + s.c.hops[s.c.hops.length - 1].si + '][' + s.c.hops[s.c.hops.length - 1].ii + '] ' + s.card + ' | store ' + JSON.stringify(s.store) + ' | chip ' + s.chip + ' (hand ' + handChip(s) + ') | undo whole day byte-identical ' + s.undoEq); }
// ── named trip ──
console.log('\n=== Named trip: SAB (no hit.rx restore) on U_d');
const RS = RES.SAB.filter(s => !s.unreach && inUd(s.c));
for(const cls of CLS){ const u = RS.filter(s => s.c.cls === cls); console.log('  ' + cls.padEnd(9) + ' wrong ' + u.filter(s => !s.undoEq).length + '/' + u.length); }
const sw = RS.filter(s => !s.undoEq);
console.log('  TOTAL U_d wrong on SAB ' + sw.length + '/' + RS.length + ' | by config ' + fmt(tally(sw, s => s.c.ck)) + ' | lattice (hop1/hop2/cyc2, the current gate row d) ' + sw.filter(s => LAT.includes(s.c.cls)).length + '/' + RS.filter(s => LAT.includes(s.c.cls)).length);
const kind = s => (s.diff[0] || '').replace(/^\[\d+\]\[\d+\] /, '').replace(/^.*?"(.*?)" => .*? "(.*?)"$/, (m, a, b) => (/—|@|RPE/.test(a) && !/—|@|RPE/.test(b)) ? 'donor dose lost' : a.includes('×') && b.includes('×') ? 'rep token differs' : 'other');
console.log('  SAB wrong kind (first differing item): ' + fmt(tally(sw, kind)));
sw.slice(0, 3).forEach(s => console.log('    ' + s.c.ck + ' W' + s.c.w + ' ' + s.c.d + ' ' + s.c.cls + ' ' + s.c.hops.map(h => h.from + '->' + h.to).join(', ') + ' | ' + s.diff.slice(0, 2).join('; ')));
// gates on SAB
for(const g of ['g221_d177_swapfloor.js', 'g227_d190_seam.js']){ const out = F('p11_' + g + '_SAB.out'); try { fs.unlinkSync(out); } catch(e){}
  let txt = ''; try { txt = cp.execFileSync(process.execPath, [path.join(ROOT, 'tests', 'gates', g), TREES.SAB, TREES.V226], { cwd:ROOT, maxBuffer:1 << 26 }).toString(); } catch(e){ txt = String(e.stdout || '') + String(e.stderr || ''); }
  fs.writeFileSync(out, txt); const sm = (txt.match(/PASS (\d+) FAIL (\d+)\s*$/) || [])[0] || 'NO SUMMARY (crash)';
  console.log('  gate ' + g + ' on SAB: ' + sm); txt.split('\n').filter(l => /^FAIL|^PASS .*(G7-1a|G5a|row d )/.test(l)).forEach(l => console.log('    ' + l.slice(0, 500))); }
