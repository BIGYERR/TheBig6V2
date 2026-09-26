// v222_swapdurable_chain.js — MEASURE (read-only). D181 (P-SWAPDURABLE) R4 chain / snapshot-rewrite pass.
//   SCR=<scratch> BASE=<base_v221.html> node tests/measure/v222_swapdurable_chain.js      (driver)
// Trees: BASE = V221; MAP = working-tree index.html (R1+R2+R3'+R4 composed map); STEP = MAP with the map build replaced
// by one applySwapPrefs call per record in array order; SKIPHIST = MAP with session swaps not applied to any day the
// freeze restored from ia_hist_. STEP and SKIPHIST are source-surgery copies written to SCR. index.html is never written.
// ORACLE: what the athlete last saw live. Each hop is driven through applySwapChoice exactly as the sheet does, and a
// hop is only taken when its target is in the sheet's own candidate list for the current item (openSwapSheet's logic:
// swapCandidates tier1+tier2, or auxSwapCandidates for a null-pattern aux-family item) and the item's canSwap flag is on.
// "live" = the day's names+details+labels after the last gesture, before any boot. "hist" = the ia_hist_ record.
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const START = '2026-08-24', CLOCK = '2026-09-24';
const CFGS = {
  mario: { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
    experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } },
  manny: JSON.parse(JSON.stringify(fixtures.HALF_MANNY)) };
const WEEKS = [3, 5, 7];   // past (dead, stored grid), current (pierced), future (pierced) at CLOCK
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA, iso){ const T = new Date(iso + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};";
const stored = {};
function setup(IA, ck, tag){
  IA.localStorage.clear(); pin(IA, CLOCK);
  const key = tag + ck;
  if(!stored[key]){ const p = IA.buildProgram(JSON.parse(JSON.stringify(CFGS[ck]))); const st = JSON.parse(JSON.stringify(p));
    Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:JSON.parse(JSON.stringify(CFGS[ck])) }); stored[key] = JSON.stringify(st); }
  IA.ctx.__SP = JSON.parse(stored[key]); E(IA, 'savePrograms([__SP]);'); E(IA, HELP); }
function boot(IA){ return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA, w, d){ E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA, w, d){ return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
function sig(dy){ if(!dy || !dy.sections) return '(none)'; return dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '') + (it._skipped ? '[x]' : '')).join(';') + '}').join(' '); }
function slotOf(dy, si, ii){ const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n:clean(it.name), d:it.detail || '' } : { n:'(none)', d:'' }; }
const J = (IA, k) => JSON.parse(IA.localStorage.getItem(k) || '{}');

// ── surgery ──
function surg(src, edits, tag){ let s = src; for(const [a, b] of edits){ const n = s.split(a).length - 1; if(n !== 1) throw new Error(tag + ' anchor count ' + n + ': ' + a.slice(0, 70)); s = s.replace(a, b); } return s; }
const STEP_ED = [["    list.forEach(r=>{let cur=r.from;list.forEach(e=>{if(e.from===cur)cur=e.to;});map[r.from]=cur;});\n    if(applySwapPrefs(day.sections,map) && prog.cfg && prog.cfg.injury){",
  "    let __hitS=false; list.forEach(r=>{const m1=Object.create(null);m1[r.from]=r.to;if(applySwapPrefs(day.sections,m1))__hitS=true;});\n    if(__hitS && prog.cfg && prog.cfg.injury){"]];
const SKIP_ED = [["  let _swapCut=null;\n", "  let _swapCut=null; const __histDays={};\n"],
  ["            if(_snap){ _merged[d] = _snap; return; }", "            if(_snap){ _merged[d] = _snap; __histDays[k]=1; return; }"],
  ["      if(_sw&&Object.keys(_sw).length) applySessionSwaps(rebuilt,_sw);", "      if(_sw) Object.keys(__histDays).forEach(function(k){ delete _sw[k]; });\n      if(_sw&&Object.keys(_sw).length) applySessionSwaps(rebuilt,_sw);"]];
const TREES = { BASE:process.env.BASE, MAP:path.join(ROOT, 'index.html'), STEP:path.join(SCR, 'tree_step.html'), SKIPHIST:path.join(SCR, 'tree_skiphist.html') };

// ── worker ──
if(process.env.WORKER){
  const [ck, tree, mode] = process.env.WORKER.split(':');
  const chains = JSON.parse(fs.readFileSync(path.join(SCR, 'chains_' + ck + '.json'), 'utf8'));
  const IA = load(TREES[tree]); const up = mode.startsWith('up_'); const V = up ? load(TREES.BASE) : IA;
  const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const nB = Math.min(+(process.env.LIMITB || 1e9), Math.max(...Object.values(byDay).map(l => l.length))); const res = [];
  for(let b = 0; b < nB; b++){
    const batch = Object.values(byDay).map(l => l[b]).filter(Boolean);
    setup(V, ck, up ? 'B' : tree); boot(V);
    const touch = c => { view(V, c.w, c.d); E(V, "writeSetDraft('zz_touch',['1'],['1'],'');"); };
    if(mode === 't1' || mode === 'up_ts') batch.forEach(touch);
    const st = {};
    for(const c of batch){ let unreach = 0;
      for(const h of c.hops){ view(V, c.w, c.d); const dy = dayOf(V, c.w, c.d); const it = dy.sections[h.si].items[h.ii];
        const cands = E(V, '__cands(activeProg.weeks[' + c.w + '].' + c.d + ',' + c.w + ',' + JSON.stringify(it.name) + ')');
        const ok = E(V, '__canSwap(activeProg.weeks[' + c.w + '].' + c.d + ',' + h.si + ',' + h.ii + ')');
        if(!ok || !Array.from(cands).includes(h.to)) unreach++;
        V.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; V.ctx.__to = h.to; E(V, '_swapCtx=__c;applySwapChoice(__to);'); }
      st[c.id] = { unreach }; }
    if(mode === 't2' || mode === 'up_st') batch.forEach(touch);
    if(mode === 'up_bt'){ boot(V); }
    batch.forEach(c => { const dy = dayOf(V, c.w, c.d); st[c.id].live = sig(dy); const h0 = c.hops[c.hops.length - 1]; st[c.id].slotLive = slotOf(dy, h0.si, h0.ii); });
    if(mode === 'up_bt') batch.forEach(touch);
    let R = V;
    if(up){ IA.localStorage.clear(); for(const [k, v] of V.localStorage._map) IA.localStorage.setItem(k, v); pin(IA, CLOCK); E(IA, HELP); R = IA; }
    const recAll = J(R, 'ia_swaps_PM');
    boot(R);
    const hist = J(R, 'ia_hist_PM');
    batch.forEach(c => { const k = 'w' + c.w + '_' + c.d, dy = dayOf(R, c.w, c.d), h0 = c.hops[c.hops.length - 1];
      res.push(Object.assign({ id:c.id, cls:c.cls, w:c.w, d:c.d, boot:sig(dy), slotBoot:slotOf(dy, h0.si, h0.ii), hist:hist[k] ? sig(hist[k]) : null,
        rec:(recAll[k] || []).map(e => e.from + '->' + e.to).join(','), recAfter:(J(R, 'ia_swaps_PM')[k] || []).length }, st[c.id])); });
  }
  fs.writeFileSync(path.join(SCR, 'res_' + ck + '_' + tree + '_' + mode + '.json'), JSON.stringify(res));
  console.log('worker ' + process.env.WORKER + ' batches ' + nB + ' rows ' + res.length); process.exit(0);
}

// ── driver ──
const out = []; const P = s => { out.push(s); console.log(s); };
const MAPsrc = fs.readFileSync(TREES.MAP, 'utf8');
fs.writeFileSync(TREES.STEP, surg(MAPsrc, STEP_ED, 'STEP')); fs.writeFileSync(TREES.SKIPHIST, surg(MAPsrc, SKIP_ED, 'SKIPHIST'));
const ctx = {}; for(const t in TREES){ ctx[t] = load(TREES[t]); }
P('versions: ' + Object.keys(ctx).map(t => t + '=' + ctx[t].version).join(' ') + ' | STEP/SKIPHIST surgery anchors 1/1 each');
P('pruneSwaps call tokens (comments stripped): ' + Object.keys(ctx).map(t => t + '=' + (ctx[t].js.replace(/\/\/.*$/mg, '').match(/pruneSwaps\(prog/g) || []).length).join(' '));
// self-check: a boot equals itself
{ const IA = ctx.MAP; setup(IA, 'mario', 'MAP'); boot(IA); const a = sig(dayOf(IA, 5, 'thu')); boot(IA); P('SELFCHECK MAP boot==boot W5 thu: ' + (a === sig(dayOf(IA, 5, 'thu')) && a !== '(none)')); }
// ── enumerate reachable record sets (MAP ctx, fresh program, no records) ──
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const NS3 = +(process.env.NS3 || 400);
const enumStats = {};
for(const ck of Object.keys(CFGS)){
  const IA = ctx.MAP; setup(IA, ck, 'MAP'); boot(IA); const chains = []; let id = 0; const st = { days:0, slots:0, hop1:0, hop2:0, cyc2:0, hop3all:0, collide2:0, exch3:0, dup1:0, dupDays:0 };
  const cand = (dy, w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const nameAt = (dy, si, ii) => dy.sections[si].items[ii].name;
  for(const w of WEEKS){ for(const d of ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']){
    const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
    const base = JSON.parse(JSON.stringify(live)); IA.ctx.__D = base;
    const slots = []; base.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && E(IA, '__canSwap(__D,' + si + ',' + ii + ')')) slots.push({ si, ii, n:it.name }); }));
    if(!slots.length) continue; st.days++; st.slots += slots.length;
    const hop3 = [];
    for(const sl of slots){
      IA.ctx.__D = base; const c1 = cand(base, w, sl.n); st.hop1 += c1.length;
      for(const B of c1){ const d1 = JSON.parse(JSON.stringify(base)); d1.sections[sl.si].items[sl.ii].name = B; IA.ctx.__D = d1;
        if(!E(IA, '__canSwap(__D,' + sl.si + ',' + sl.ii + ')')) continue; const c2 = cand(d1, w, B);
        for(const C of c2){ const cls = (C === sl.n) ? 'cyc2' : 'hop2'; st.hop2++; if(cls === 'cyc2') st.cyc2++;
          chains.push({ id:id++, cls, w, d, hops:[{ si:sl.si, ii:sl.ii, to:B }, { si:sl.si, ii:sl.ii, to:C }] });
          const d2 = JSON.parse(JSON.stringify(d1)); d2.sections[sl.si].items[sl.ii].name = C; IA.ctx.__D = d2;
          if(E(IA, '__canSwap(__D,' + sl.si + ',' + sl.ii + ')')) cand(d2, w, C).forEach(D3 => { st.hop3all++; hop3.push({ w, d, hops:[{ si:sl.si, ii:sl.ii, to:B }, { si:sl.si, ii:sl.ii, to:C }, { si:sl.si, ii:sl.ii, to:D3 }] }); }); } } }
    // cross-slot: slot i A->X, slot j B->A (collide2), then slot i X->B (exch3)
    for(const si of slots) for(const sj of slots){ if(si === sj) continue;
      IA.ctx.__D = base; for(const X of cand(base, w, si.n)){ const d1 = JSON.parse(JSON.stringify(base)); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
        if(!cand(d1, w, sj.n).includes(si.n)) continue; st.collide2++;
        chains.push({ id:id++, cls:'collide2', w, d, hops:[{ si:si.si, ii:si.ii, to:X }, { si:sj.si, ii:sj.ii, to:si.n }] });
        const d2 = JSON.parse(JSON.stringify(d1)); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
        if(E(IA, '__canSwap(__D,' + si.si + ',' + si.ii + ')') && cand(d2, w, X).includes(sj.n)){ st.exch3++;
          chains.push({ id:id++, cls:'exch3', w, d, hops:[{ si:si.si, ii:si.ii, to:X }, { si:sj.si, ii:sj.ii, to:si.n }, { si:si.si, ii:si.ii, to:sj.n }] }); } } }
    // same name twice on the card: one swap on one instance
    const cnt = {}; slots.forEach(s => cnt[s.n] = (cnt[s.n] || 0) + 1); let dd = false;
    slots.filter(s => cnt[s.n] > 1).forEach(s => { dd = true; IA.ctx.__D = base; const c1 = cand(base, w, s.n); if(c1.length){ st.dup1++; chains.push({ id:id++, cls:'dup1', w, d, hops:[{ si:s.si, ii:s.ii, to:c1[0] }] }); } });
    if(dd) st.dupDays++;
    const rnd = mulberry(w * 31 + d.charCodeAt(0) * 7 + ck.length); const take = Math.min(hop3.length, Math.ceil(NS3 / 15));
    for(let k = 0; k < take; k++){ const j = Math.floor(rnd() * hop3.length); const h = hop3.splice(j, 1)[0]; const c3 = h.hops[2].to === base.sections[h.hops[0].si].items[h.hops[0].ii].name;
      chains.push(Object.assign({ id:id++, cls:c3 ? 'cyc3' : 'hop3' }, h)); }
  } }
  fs.writeFileSync(path.join(SCR, 'chains_' + ck + '.json'), JSON.stringify(chains)); enumStats[ck] = st;
  const cc = {}; chains.forEach(c => cc[c.cls] = (cc[c.cls] || 0) + 1);
  P('ENUM ' + ck + ' weeks ' + WEEKS.join(',') + ': ' + JSON.stringify(st) + ' | chains by class ' + JSON.stringify(cc));
}
if(process.env.ENUM_ONLY){ fs.writeFileSync(process.env.OUT || path.join(SCR, 'chain.out'), out.join('\n') + '\n'); process.exit(0); }
// ── spawn workers ──
const MODES = ['u', 't1', 't2'], UPM = ['up_ts', 'up_st', 'up_bt'];
const jobs = []; for(const ck of Object.keys(CFGS)) for(const t of Object.keys(TREES)) for(const m of MODES.concat(UPM)) jobs.push(ck + ':' + t + ':' + m);
const PAR = +(process.env.PAR || 7);
(async () => {
  let i = 0; const run = () => new Promise(res => { if(i >= jobs.length) return res(); const j = jobs[i++];
    const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j }), stdio:['ignore', 'pipe', 'pipe'] });
    let e = ''; p.stderr.on('data', x => e += x); p.stdout.on('data', () => {});
    p.on('close', code => { if(code !== 0) P('WORKER FAIL ' + j + ' code ' + code + ' ' + e.slice(0, 400)); res(run()); }); });
  await Promise.all(Array.from({ length:PAR }, run));
  // ── aggregate ──
  const R = {}; for(const j of jobs){ const f = path.join(SCR, 'res_' + j.split(':').join('_') + '.json'); R[j] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; }
  const missing = jobs.filter(j => !R[j]); P('\nworkers ' + (jobs.length - missing.length) + '/' + jobs.length + ' wrote results' + (missing.length ? ' MISSING ' + missing.join(' ') : ''));
  const agg = (rows, f) => rows.filter(f).length;
  const CL = ['hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3', 'dup1'];
  P('\n== C1/C4: boot vs last live card (u = untouched, t1 = touched then chain, t2 = chain then touched) ==');
  P('   cell: slot detail != live / slot name != live / whole day != live   over n (unreach = hops not offered at replay)');
  for(const m of MODES) for(const cls of CL){ const line = [];
    for(const t of Object.keys(TREES)){ let rows = []; for(const ck of Object.keys(CFGS)) rows = rows.concat((R[ck + ':' + t + ':' + m] || []).filter(r => r.cls === cls));
      if(!rows.length){ line.push(t + ' -'); continue; }
      line.push(t + ' ' + agg(rows, r => r.slotBoot.d !== r.slotLive.d) + '/' + agg(rows, r => r.slotBoot.n !== r.slotLive.n) + '/' + agg(rows, r => r.boot !== r.live) + ' of ' + rows.length + (agg(rows, r => r.unreach) ? ' unreach ' + agg(rows, r => r.unreach) : '')); }
    P('  ' + (m + '|' + cls).padEnd(14) + line.join('   ')); }
  P('\n== C1 segmented (whole day != live), by config x week, class hop2+cyc2 ==');
  for(const m of MODES) for(const ck of Object.keys(CFGS)) for(const w of WEEKS){ P('  ' + (m + '|' + ck + '|W' + w).padEnd(16) + Object.keys(TREES).map(t => { const rows = (R[ck + ':' + t + ':' + m] || []).filter(r => r.w === w && (r.cls === 'hop2' || r.cls === 'cyc2')); return t + ' ' + agg(rows, r => r.boot !== r.live) + '/' + rows.length; }).join('   ')); }
  P('\n== C2: snapshot rewrite at boot (whole day != ia_hist_ record), snapshot modes ==');
  for(const m of ['t1', 't2'].concat(UPM)) for(const cls of CL){ P('  ' + (m + '|' + cls).padEnd(14) + Object.keys(TREES).map(t => { let rows = []; for(const ck of Object.keys(CFGS)) rows = rows.concat((R[ck + ':' + t + ':' + m] || []).filter(r => r.cls === cls && r.hist));
      return t + ' ' + agg(rows, r => r.boot !== r.hist) + '/' + rows.length + ' (hist!=live ' + agg(rows, r => r.hist !== r.live) + ')'; }).join('   ')); }
  P('\n== C3 upgrade: V221 device state booted by each tree; boot vs last card seen live on V221 (whole day) ==');
  P('   up_ts = V221 touch, chain, no V221 boot; up_st = V221 chain, touch, no boot; up_bt = V221 chain, V221 boot, touch');
  for(const m of UPM) for(const cls of ['hop2', 'cyc2', 'collide2', 'exch3', 'dup1']){ P('  ' + (m + '|' + cls).padEnd(15) + Object.keys(TREES).map(t => { let rows = []; for(const ck of Object.keys(CFGS)) rows = rows.concat((R[ck + ':' + t + ':' + m] || []).filter(r => r.cls === cls));
      return t + ' boot!=live ' + agg(rows, r => r.boot !== r.live) + '/' + rows.length + ' (days carrying a record at upgrade ' + agg(rows, r => r.rec) + ')'; }).join('   ')); }
  // examples
  P('\n== EXAMPLES (first 2 per tree x mode x class where boot != live) ==');
  for(const m of MODES.concat(UPM)) for(const cls of CL) for(const t of Object.keys(TREES)){ let rows = []; for(const ck of Object.keys(CFGS)) rows = rows.concat((R[ck + ':' + t + ':' + m] || []).filter(r => r.cls === cls && r.boot !== r.live).map(r => Object.assign({ ck }, r)));
    rows.slice(0, 2).forEach(r => P('  ' + t + '|' + m + '|' + cls + ' ' + r.ck + ' W' + r.w + ' ' + r.d + ' rec=' + r.rec + '\n      live slot ' + r.slotLive.n + ' :: ' + r.slotLive.d.slice(0, 40) + '\n      boot slot ' + r.slotBoot.n + ' :: ' + r.slotBoot.d.slice(0, 40)
      + (r.hist ? '\n      hist==live ' + (r.hist === r.live) + ' boot==hist ' + (r.boot === r.hist) : ''))); }
  // detail-only path dependence, untouched, hop2: engine-side classification
  P('\n== C1 detail cause, u|hop2+cyc2, MAP rows with slot detail != live: live detail != direct-hop detail ==');
  { let rows = []; for(const ck of Object.keys(CFGS)) rows = rows.concat((R[ck + ':MAP:u'] || []).filter(r => (r.cls === 'hop2' || r.cls === 'cyc2') && r.slotBoot.d !== r.slotLive.d));
    const ex = {}; rows.forEach(r => { const k = r.cls + ' live ' + (r.slotLive.d.match(/^\S+/) || [''])[0] + ' boot ' + (r.slotBoot.d.match(/^\S+/) || [''])[0]; ex[k] = (ex[k] || 0) + 1; });
    Object.entries(ex).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => P('  ' + String(v).padStart(5) + '  ' + k)); }
  // ── premise lattice under the four trees ──
  const prem = fs.readFileSync(path.join(ROOT, 'tests/measure/v222_swapdurable_premise.js'), 'utf8');
  const a = prem.indexOf('const V221src'), bTok = 'const ctxs = {}; for(const k in TREES) ctxs[k] = load(TREES[k]);', b = prem.indexOf(bTok);
  if(a < 0 || b < 0) throw new Error('premise anchors');
  let p2 = prem.slice(0, a) + 'const TREES = JSON.parse(process.env.TREES_JSON);\n' + prem.slice(b);
  const rep = [["path.join(__dirname, '..', 'harness.js')", JSON.stringify(path.join(ROOT, 'tests', 'harness.js'))], ["x.o.tree === 'COPY' &&", "x.o.tree === 'SKIPHIST' &&"],
    ["for(const t of ['V221', 'COPY', 'COPYa'])", 'for(const t of Object.keys(TREES))'], ["for(const t of ['V221','COPY'])", 'for(const t of Object.keys(TREES))'], ["for(const tree of ['V221', 'COPY'])", "for(const tree of ['V221', 'SKIPHIST'])"]];
  for(const [x, y] of rep){ const n = p2.split(x).length - 1; if(n !== 1) throw new Error('premise rep count ' + n + ' ' + x); p2 = p2.replace(x, y); }
  const pf = path.join(SCR, 'premise_4trees.js'), po = path.join(SCR, 'premise_4trees.out'); try{ fs.unlinkSync(po); }catch(e){}
  fs.writeFileSync(pf, p2);
  const r = cp.spawnSync(process.execPath, [pf], { env:Object.assign({}, process.env, { OUT:po, TREES_JSON:JSON.stringify({ V221:TREES.BASE, MAP:TREES.MAP, STEP:TREES.STEP, SKIPHIST:TREES.SKIPHIST }) }), encoding:'utf8', maxBuffer:1 << 28 });
  P('\n== C3 PREMISE LATTICE on V221 / MAP / STEP / SKIPHIST (full output ' + po + ', exit ' + r.status + ') ==');
  if(r.status !== 0) P('PREMISE CRASH ' + (r.stderr || '').slice(0, 800));
  const po_t = fs.existsSync(po) ? fs.readFileSync(po, 'utf8') : ''; if(!po_t) P('PREMISE PRINTED NOTHING');
  po_t.split('\n').filter(l => /DURABLE|live==boot|double-apply|neg-control|orphan|exw slug|SELFCHECK|versions|second-swap|\|none\|-|\|draft\|(first|between|last)|BOOT1|BOOT2|undo\(|hist=|stale=|\|draft\|swap_then_touch|\|tick\|/.test(l) && !/^\s{4}\S+\|(draft|tick)\|.*>.*/.test(l)).forEach(l => P(l));
  fs.writeFileSync(process.env.OUT || path.join(SCR, 'chain.out'), out.join('\n') + '\n'); console.log('DONE');
})().catch(e => { P('DRIVER CRASH ' + e.stack); fs.writeFileSync(process.env.OUT || path.join(SCR, 'chain.out'), out.join('\n') + '\n'); process.exit(1); });
