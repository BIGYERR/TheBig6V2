// v227_d190_undo.js — MEASURE (read-only). Undo of the last hop on 3-hop and 4-hop chains, V226 vs the V227 working tree.
//   SCR=<scratch> node tests/measure/v227_d190_undo.js > tests/measure/v227_d190_undo.out.txt
// Trees (copies in SCR; index.html is read once, never written):
//   V226  = scratchpad/base_v226.html (git HEAD 637bc8e)      V227 = copy of the working index.html (ia-version 227, D190)
//   CF    = V227 with swapOriginOf taking the LAST record whose `to` matches instead of the first (counterfactual for Q4 only)
// Population: every hop3 chain (3 taps on one slot, each target in the sheet's own candidate list for the slot as it then
//   stands) on mario knee/wa, lowback/wa, elbow/wa, HALF_MANNY, mario uninjured, W3+W5; hop4 = a seeded sample of >= 2,000
//   per config (a 4th tap appended to a random hop3 chain). CF runs every revisit-shaped hop3 chain + every 20th other one.
// ORACLE: the undo of the last hop must leave the slot (name and detail) and the whole day (clock fields stripped) exactly as
//   the athlete saw them before that hop, read off the live page before the hop. The undo path is never asked.
// Act: a fresh page per batch (one chain per day per page), hops through applySwapChoice, then chip = swapOriginOf(<current
//   name>) and undoSwap(chip), both from the live code, as the card's chip does.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const START = '2026-08-24', CLOCK = '2026-09-24', WEEKS = [3, 5], DAYS = ['sun','mon','tue','wed','thu','fri','sat'], N4 = 2000;
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const wi = inj => Object.assign(JSON.parse(JSON.stringify(MARIO)), inj ? { injury:inj } : {});
const CFGS = { mario:wi({ region:'knee', tier:'workaround' }), lowback_wa:wi({ region:'lowback', tier:'workaround' }), elbow_wa:wi({ region:'elbow', tier:'workaround' }), manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), mario_noinj:wi(null) };
const TREES = { V226:F('u_v226.html'), V227:F('u_v227.html'), CF:F('u_cf.html') };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i; const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
const clone = x => JSON.parse(JSON.stringify(x));
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
let FILE = null; const stored = {};
function fresh(){ const T = load(FILE); pin(T); E(T, HELP); return T; }
function setup(IA, ck){ IA.localStorage.clear(); pin(IA); if(!stored[ck]){ const p = fresh().buildProgram(clone(CFGS[ck])); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[ck] = JSON.stringify(st); } IA.ctx.__SP = JSON.parse(stored[ck]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
const view = (IA, w, d) => E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';");
const dayOf = (IA, w, d) => E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d);
const slotOf = (dy, si, ii) => { const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n:clean(it.name), d:it.detail || '' } : { n:'(none)', d:'' }; };
function hop(IA, c, to){ view(IA, c.w, c.d); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections[c.si] && dy.sections[c.si].items[c.ii]; if(!it) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d; const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')')); const can = E(IA, '__canSwap(' + ex + ',' + c.si + ',' + c.ii + ')');
  IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:it.name, detail:it.detail }; IA.ctx.__to = to; E(IA, '_swapCtx=__c;applySwapChoice(__to);'); return (!can || !cands.includes(to)) ? 1 : 0; }
function shapeOf(pre, hops){ const seq = [pre].concat(hops), L = {}; let n = 0; return seq.map(x => L[x] || (L[x] = 'ABCDEFG'[n++])).join('>'); }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';

// ── WORKER tree:ck:w:kind ──
if(process.env.WORKER){
  const [tree, ck, w, kind] = process.env.WORKER.split(':'); FILE = TREES[tree];
  let chains = JSON.parse(fs.readFileSync(F('uc_' + kind + '_' + ck + '_' + w + '.json'), 'utf8'));
  if(tree === 'CF' && kind === 'h3') chains = chains.filter((c, i) => c.shape !== 'A>B>C>D' || i % 20 === 0);
  const byDay = {}; chains.forEach(c => (byDay[c.d] = byDay[c.d] || []).push(c)); const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length)); const out = [];
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); const A = fresh(); setup(A, ck); boot(A);
    for(const c of batch){ const r = { id:c.id, ck, w:c.w, d:c.d, shape:c.shape, pre:slotOf(dayOf(A, c.w, c.d), c.si, c.ii).n, hops:c.hops, unreach:0 };
      c.hops.forEach((to, k) => { if(k === c.hops.length - 1){ const dy = dayOf(A, c.w, c.d); r.prevJS = JS(dy.sections); r.prevSlot = slotOf(dy, c.si, c.ii); } r.unreach += hop(A, c, to); });
      view(A, c.w, c.d); const cur = slotOf(dayOf(A, c.w, c.d), c.si, c.ii); r.live = cur;
      r.storeBefore = ((JSON.parse(A.localStorage.getItem('ia_swaps_PM') || '{}')['w' + c.w + '_' + c.d]) || []).map(e => e.from + '->' + e.to);
      r.chip = E(A, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || '';
      if(r.chip){ E(A, 'undoSwap(' + JSON.stringify(r.chip) + ');'); }
      const dy = dayOf(A, c.w, c.d); r.undo = slotOf(dy, c.si, c.ii); r.dayEq = JS(dy.sections) === r.prevJS; delete r.prevJS;
      r.chipAfter = E(A, 'swapOriginOf(' + JSON.stringify(r.undo.n) + ')') || '';
      r.storeAfter = ((JSON.parse(A.localStorage.getItem('ia_swaps_PM') || '{}')['w' + c.w + '_' + c.d]) || []).map(e => e.from + '->' + e.to);
      out.push(r); } }
  fs.writeFileSync(F('ur_' + tree + '_' + ck + '_' + w + '_' + kind + '.json'), JSON.stringify(out)); process.exit(0);
}

// ── DRIVER ──
for(const f of Object.values(TREES)) try { fs.unlinkSync(f); } catch(e){}
fs.copyFileSync(path.join(path.dirname(SCR), 'base_v226.html'), TREES.V226);
const v227 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); fs.writeFileSync(TREES.V227, v227);
const A1 = 'const hit=list.filter(e=>e&&e.to===name)[0];'; const nA = v227.split(A1).length - 1; if(nA !== 1) throw new Error('CF anchor count ' + nA);
fs.writeFileSync(TREES.CF, v227.replace(A1, 'const hit=list.filter(e=>e&&e.to===name).pop();'));
const SRC = v227.split('\n'); const lineOf = re => SRC.findIndex(l => re.test(l)) + 1;
console.log('v227_d190_undo | V226 ia-version ' + load(TREES.V226).version + ' | V227 ia-version ' + load(TREES.V227).version + ' (working index.html) | CF = V227 + swapOriginOf last-match');
console.log('\n=== Q1 sites (V227 working tree)');
[[/^function swapOriginOf\(/, 'swapOriginOf'], [/const hit=list\.filter\(e=>e&&e\.to===name\)\[0\];/, '  chip lookup: FIRST record whose to == the current name'], [/^function undoSwap\(/, 'undoSwap'], [/const hit=list\.filter\(e=>e&&e\.from===from\)\[0\];/, '  undo lookup: first record whose from == chip'],
 [/const back=\{\}; back\[hit\.to\]=from;/, '  rename back: hit.to -> from via applySwapPrefs'], [/clearSwap\(activeProgId,currentWeek,currentDayKey,from\);/, '  clearSwap(from)'], [/^function recordSwap\(/, 'recordSwap'], [/const list=\(s\[k\]\|\|\[\]\)\.filter\(e=>e&&e\.from!==from\);/, '  same-from filter (D191 / U1)'], [/^function clearSwap\(/, 'clearSwap'],
 [/const _swappedFrom=_canSwap\?swapOriginOf\(i\.name\|\|''\):null;/, 'card chip render calls swapOriginOf']].forEach(([re, t]) => console.log('  :' + lineOf(re) + ' ' + t));
// hand trace of the store (oracle: recordSwap / swapOriginOf / undoSwap source text, applied by hand)
{ let st = []; const rec = (f, t) => { st = st.filter(e => e.from !== f); st.push({ from:f, to:t }); };
  rec('A', 'B'); rec('B', 'C'); rec('C', 'B'); const chip = (st.find(e => e.to === 'B') || {}).from; const hit = st.find(e => e.from === chip);
  console.log('  hand trace A>B>C>B: store ' + JSON.stringify(st) + ' | chip on B = first to==B -> ' + chip + ' | undoSwap(' + chip + ') renames ' + hit.to + ' back to ' + chip + ' (expected C) | last-match chip would be ' + st.filter(e => e.to === 'B').pop().from); }
// enumerate on V226: every hop3; hop4 seeded sample
FILE = TREES.V226;
function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const jobs = [];
for(const ck of Object.keys(CFGS)){ const IA = fresh(); setup(IA, ck); boot(IA); let h4tot = 0;
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')')); const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const per = {};
  for(const w of WEEKS){ const h3 = [], ext = []; let id = 0;
    for(const d of DAYS){ const live = dayOf(IA, w, d); if(!live || !live.sections) continue; const bs = clone(live); IA.ctx.__D = bs;
      const slots = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
      for(const sl of slots){ const memo = {}; const cn = n => { if(!(n in memo)){ const dd = clone(bs); dd.sections[sl.si].items[sl.ii].name = n; IA.ctx.__D = dd; memo[n] = (n === sl.n || can(sl.si, sl.ii)) ? cand(w, n) : []; } return memo[n]; };
        for(const B of cn(sl.n)) for(const C of cn(B)) for(const X of cn(C)){ const hops = [B, C, X]; const c = { id:ck + w + '#' + id++, w, d, si:sl.si, ii:sl.ii, hops, shape:shapeOf(sl.n, hops) }; h3.push(c); ext.push(cn(X)); } } }
    // shape families
    h3.forEach(c => { c.fam = c.hops[2] === c.hops[0] ? 'A>B>C>B' : c.hops[1] === undefined ? '?' : (c.shape.split('>')[2] === 'A' ? 'A>B>A>x' : c.shape.endsWith('>A') ? 'A>B>C>A' : 'other'); });
    fs.writeFileSync(F('uc_h3_' + ck + '_' + w + '.json'), JSON.stringify(h3));
    const rnd = mulberry(0x5eed + w * 7 + ck.length * 131); const h4 = []; const want = N4 / WEEKS.length;
    for(let t = 0; t < want * 3 && h4.length < want && h3.length; t++){ const k = Math.floor(rnd() * h3.length), c = h3[k], cs = ext[k]; if(!cs.length) continue; const Y = cs[Math.floor(rnd() * cs.length)];
      const hops = c.hops.concat([Y]); h4.push({ id:c.id + '+' + h4.length, w, d:c.d, si:c.si, ii:c.ii, hops, shape:shapeOf(null, []) && shapeOf(c.hops[0] && h3[k] ? '' : '', []) , fam:'' , _pre:null }); }
    fs.writeFileSync(F('uc_h4_' + ck + '_' + w + '.json'), JSON.stringify(h4)); h4tot += h4.length;
    per['W' + w] = h3.length + ' hop3 ' + JSON.stringify(tally(h3, c => c.fam)) + ', ' + h4.length + ' hop4';
    for(const t of ['V226', 'V227', 'CF']) for(const kind of ['h3', 'h4']) jobs.push(t + ':' + ck + ':' + w + ':' + kind); }
  console.log('  ENUM ' + ck.padEnd(12) + ' ' + JSON.stringify(per)); }
(async () => {
  jobs.forEach(j => { try { fs.unlinkSync(F('ur_' + j.replace(/:/g, '_') + '.json')); } catch(e){} });
  jobs.sort((a, b) => (a.endsWith('h3') && !a.startsWith('CF') ? 0 : 1) - (b.endsWith('h3') && !b.startsWith('CF') ? 0 : 1));
  let i = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length:7 }, async () => { while(i < jobs.length){ const j = jobs[i++]; await new Promise(res => { const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j }), stdio:['ignore', 'pipe', 'pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', c => { if(c) console.log('WORKER CRASH ' + j + ' ' + o.slice(-500)); res(); }); }); } }));
  console.log('\nworkers ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const R = {}; for(const j of jobs){ const f = F('ur_' + j.replace(/:/g, '_') + '.json'); if(!fs.existsSync(f)){ console.log('MISSING ' + j + ' (failed measurement)'); continue; } R[j] = JSON.parse(fs.readFileSync(f, 'utf8')); }
  const rows = (t, kind) => Object.keys(R).filter(k => k.startsWith(t + ':') && k.endsWith(':' + kind)).flatMap(k => R[k]);
  const bad = r => !r.chip || r.undo.n !== r.prevSlot.n || r.undo.d !== r.prevSlot.d;
  const famOf = r => { const s = r.shape.split('>'); if(r.hops.length === 3){ if(s[3] === s[1]) return 'A>B>C>B'; if(s[2] === 'A') return 'A>B>A>x'; if(s[3] === 'A') return 'A>B>C>A'; return 'other'; } return r.shape; };
  for(const kind of ['h3', 'h4']){ console.log('\n=== ' + (kind === 'h3' ? 'Q2 hop3 (full enumeration)' : 'Q3 hop4 (seeded sample)'));
    for(const t of ['V226', 'V227', 'CF']){ const rr = rows(t, kind).filter(r => !r.unreach); rr.forEach(r => { r.shape = shapeOf(r.pre, r.hops); r.fam = famOf(r); });
      const b = rr.filter(bad), nd = rr.filter(r => !r.dayEq);
      console.log('  ' + t.padEnd(4) + (t === 'CF' && kind === 'h3' ? ' (revisit shapes full + every 20th other)' : '') + ' reachable ' + rr.length + '/' + rows(t, kind).length + ' | slot != pre-hop ' + b.length + ' | whole day != pre-hop ' + nd.length + ' | no chip ' + rr.filter(r => !r.chip).length);
      const fams = tally(rr, r => r.ck + '|' + r.fam); console.log('    by config|shape (slot wrong / day wrong / n): ' + Object.keys(fams).sort().filter(k => kind === 'h3' || b.some(r => r.ck + '|' + r.fam === k) || nd.some(r => r.ck + '|' + r.fam === k)).map(k => k + ' ' + b.filter(r => r.ck + '|' + r.fam === k).length + '/' + nd.filter(r => r.ck + '|' + r.fam === k).length + '/' + fams[k]).join(' | '));
      if(kind === 'h4') console.log('    hop4 shapes wrong: ' + fmt(tally(b, r => r.fam)) + ' | of shapes present ' + Object.keys(tally(rr, r => r.fam)).length + ' (rows ' + rr.length + ')');
      if(t !== 'CF'){ const by = tally(b, r => r.ck); console.log('    wrong by config: ' + fmt(by)); } }
    const m = t => new Map(rows(t, kind).filter(r => !r.unreach).map(r => [r.id, r]));
    const V6 = m('V226'), V7 = m('V227'), C = m('CF');
    const ids = [...V6.keys()].filter(id => V7.has(id));
    console.log('  V226 -> V227: wrong both ' + ids.filter(id => bad(V6.get(id)) && bad(V7.get(id))).length + ' | healed ' + ids.filter(id => bad(V6.get(id)) && !bad(V7.get(id))).length + ' | created ' + ids.filter(id => !bad(V6.get(id)) && bad(V7.get(id))).length
      + ' | day-level: created ' + ids.filter(id => V6.get(id).dayEq && !V7.get(id).dayEq).length + ' healed ' + ids.filter(id => !V6.get(id).dayEq && V7.get(id).dayEq).length);
    const cid = [...C.keys()].filter(id => V7.has(id));
    console.log('  V227 -> CF (last-match chip) on ' + cid.length + ' chains: wrong on V227 ' + cid.filter(id => bad(V7.get(id))).length + ', fixed by CF ' + cid.filter(id => bad(V7.get(id)) && !bad(C.get(id))).length + ', created by CF ' + cid.filter(id => !bad(V7.get(id)) && bad(C.get(id))).length
      + ' | CF still wrong by shape ' + fmt(tally(cid.filter(id => bad(C.get(id))).map(id => C.get(id)), r => r.fam)) + ' | CF created by shape ' + fmt(tally(cid.filter(id => !bad(V7.get(id)) && bad(C.get(id))).map(id => C.get(id)), r => r.fam)));
    const wr = [...V7.values()].filter(bad);
    console.log('  V227 wrong rows: store had one record per hop (no collapse) ' + wr.filter(r => r.storeBefore.length === r.hops.length).length + '/' + wr.length + ' | store collapsed ' + wr.filter(r => r.storeBefore.length < r.hops.length).length + ' | undo landed on the original donor A ' + wr.filter(r => r.undo.n === r.pre).length + ' | landed on the chip ' + wr.filter(r => r.undo.n === r.chip).length);
    if(kind === 'h3'){ const ab = [...V7.values()].filter(r => r.fam === 'A>B>A>x'); console.log('  D191 class A>B>A>x on V227: n ' + ab.length + ', store collapsed ' + ab.filter(r => r.storeBefore.length < 3).length + ', undo wrong ' + ab.filter(bad).length + ', day wrong ' + ab.filter(r => !r.dayEq).length); }
    wr.filter((r, k, a) => a.findIndex(x => x.fam === r.fam && x.ck === r.ck) === k).slice(0, kind === 'h3' ? 3 : 4).forEach(r => console.log('  ROW ' + r.id + ' ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.shape + ' ' + r.pre + ' > ' + r.hops.join(' > ')
      + '\n    store before undo ' + JSON.stringify(r.storeBefore) + ' | chip ' + r.chip + '\n    pre-last-hop slot ' + r.prevSlot.n + ' ' + JSON.stringify(r.prevSlot.d) + ' | after undo ' + r.undo.n + ' ' + JSON.stringify(r.undo.d) + ' | store after ' + JSON.stringify(r.storeAfter) + ' | chip after undo ' + JSON.stringify(r.chipAfter)
      + (C.get(r.id) ? '\n    CF: chip ' + C.get(r.id).chip + ', after undo ' + C.get(r.id).undo.n + ' ' + JSON.stringify(C.get(r.id).undo.d) + ', ok ' + !bad(C.get(r.id)) : ''))); }
  // Q5: one row in full on V227, with the boot after the wrong undo
  const r = rows('V227', 'h3').find(x => !x.unreach && bad(x) && x.ck === 'mario');
  if(r){ FILE = TREES.V227; const c = JSON.parse(fs.readFileSync(F('uc_h3_' + r.ck + '_' + r.w + '.json'), 'utf8')).find(x => x.id === r.id); const A = fresh(); setup(A, r.ck); boot(A); const steps = [];
    for(const to of c.hops){ E(A, '__T.length=0;'); hop(A, c, to); const s = slotOf(dayOf(A, c.w, c.d), c.si, c.ii); steps.push(s.n + ' ' + JSON.stringify(s.d) + ' | chip ' + (E(A, 'swapOriginOf(' + JSON.stringify(s.n) + ')') || '-') + ' | toast ' + Array.from(E(A, '__T')).join(' / ')); }
    view(A, c.w, c.d); const cur = slotOf(dayOf(A, c.w, c.d), c.si, c.ii); const chip = E(A, 'swapOriginOf(' + JSON.stringify(cur.n) + ')'); E(A, '__T.length=0;'); E(A, 'undoSwap(' + JSON.stringify(chip) + ');');
    const after = slotOf(dayOf(A, c.w, c.d), c.si, c.ii); const tst = Array.from(E(A, '__T')).join(' / '); const chip2 = E(A, 'swapOriginOf(' + JSON.stringify(after.n) + ')') || '(none)';
    const sec = dayOf(A, c.w, c.d).sections[c.si]; const st = JSON.parse(A.localStorage.getItem('ia_swaps_PM') || '{}')['w' + c.w + '_' + c.d];
    const Bt = fresh(); Bt.localStorage.clear(); for(const [k, v] of A.localStorage._map) Bt.localStorage.setItem(k, v); boot(Bt); const bt = slotOf(dayOf(Bt, c.w, c.d), c.si, c.ii);
    console.log('\n=== Q5 one row in full (V227): ' + r.ck + ' W' + c.w + ' ' + c.d + ' slot [' + c.si + '][' + c.ii + '] section "' + clean(sec.label) + '"\n  grid: ' + r.pre + ' ' + JSON.stringify(r.prevSlot && '') );
    steps.forEach((s, k) => console.log('  tap ' + (k + 1) + ' -> ' + s));
    console.log('  chip on the card before undo: "' + chip + '" (the athlete expects ' + c.hops[1] + ')\n  undo toast: ' + tst + '\n  card after undo: ' + after.n + ' ' + JSON.stringify(after.d) + ' | chip after undo: ' + chip2 + ' | store after ' + JSON.stringify((st || []).map(e => e.from + '->' + e.to)) + '\n  next boot: ' + bt.n + ' ' + JSON.stringify(bt.d)); }
})();
