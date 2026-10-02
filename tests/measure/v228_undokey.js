// v228_undokey.js — MEASURE (read-only), D192 P-UNDOKEY P12 on V227 (HEAD 5ce31e8). Mode B.
//   SCR=<scratch> node tests/measure/v228_undokey.js > tests/measure/v228_undokey.out.txt
// Trees (copies in SCR; index.html is read, never written):
//   V227 = copy of index.html (ia-version 227)
//   CF   = V227 with swapOriginOf's lookup `.filter(e=>e&&e.to===name)[0]` -> `.pop()` (the ruling's one line)
//   CF2  = CF plus undoSwap's lookup `.filter(e=>e&&e.from===from)[0]` -> `.pop()` (the `from` side, to show no-op or not)
// Population: hop3 = every 3-tap chain on one slot (each target in the sheet's own candidate list for the slot as it then
//   stands) on mario knee/wa, lowback/wa, elbow/wa, HALF_MANNY, mario uninjured, W3+W5 (the v227_d190_undo.js lattice);
//   hop4 = every 4-tap chain on lowback_wa (enumerated); hop5 = seeded sample (mulberry, fixed seeds) of 1,000 per config per week.
// ORACLE (independent of swapOriginOf/undoSwap): the chip must name the name the slot carried before the last tap (read off the
//   chain tuple), and undo must leave the slot and the whole day (clock fields stripped) exactly as the live page showed them
//   before the last tap. Boot oracle: after every undo in a batch, refreshProgram from the same localStorage must reproduce the
//   live day (and the pre-last-tap day) byte for byte.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest, weekGrid } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const START = '2026-08-24', CLOCK = '2026-09-24', WEEKS = [3, 5], DAYS = ['sun','mon','tue','wed','thu','fri','sat'], N5 = 1000, CHUNK = 6000, H4MAX = 450000;
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const wi = inj => { const c = JSON.parse(JSON.stringify(MARIO)); if(inj) c.injury = inj; return c; };
const CFGS = { mario:wi({ region:'knee', tier:'workaround' }), lowback_wa:wi({ region:'lowback', tier:'workaround' }), elbow_wa:wi({ region:'elbow', tier:'workaround' }), manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), mario_noinj:wi(null) };
const L9 = { mario:wi({ region:'knee', tier:'workaround' }), manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), mario_noinj:wi(null), knee_protect:wi({ region:'knee', tier:'protect' }), ankle_wa:wi({ region:'ankle', tier:'workaround' }), hip_wa:wi({ region:'hip', tier:'workaround' }), lowback_wa:wi({ region:'lowback', tier:'workaround' }), shoulder_wa:wi({ region:'shoulder', tier:'workaround' }), elbow_wa:wi({ region:'elbow', tier:'workaround' }) };
if(process.env.ONLYH4){ for(const k of Object.keys(CFGS)) if(k!=="lowback_wa") delete CFGS[k]; WEEKS.length=1; }
if(process.env.SMOKE){ for(const k of Object.keys(CFGS)) if(k!=="lowback_wa") delete CFGS[k]; WEEKS.length=1; DAYS.splice(0,DAYS.length,"mon","tue"); }
const TREES = { V227:F('u_v227.html'), CF:F('u_cf.html'), CF2:F('u_cf2.html') };
const A_TO = 'const hit=list.filter(e=>e&&e.to===name)[0];', A_FROM = 'const hit=list.filter(e=>e&&e.from===from)[0];';
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i; const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
const H = s => crypto.createHash('md5').update(String(s)).digest('hex').slice(0, 12);
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
const famOf = (shape, n) => { const s = shape.split('>'); if(n === 3){ if(s[3] === s[1]) return 'A>B>C>B'; if(s[2] === 'A') return 'A>B>A>x'; if(s[3] === 'A') return 'A>B>C>A'; return 'other'; } return shape; };
const storeOf = (IA, w, d) => ((JSON.parse(IA.localStorage.getItem('ia_swaps_PM') || '{}')['w' + w + '_' + d]) || []);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';

// ── WORKER tree:chunk ──
if(process.env.WORKER){
  const [tree, chunk] = process.env.WORKER.split(':'); FILE = TREES[tree];
  const meta = JSON.parse(fs.readFileSync(F('uc_' + chunk + '.json'), 'utf8')); const ck = meta.ck; let chains = meta.chains;
  if(tree === 'CF2') chains = chains.filter(c => c.cf2);
  const byDay = {}; chains.forEach(c => (byDay[c.d] = byDay[c.d] || []).push(c)); const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length)); const out = []; let freshChk = 0, freshAgree = 0;
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); const A = process.env.REUSE ? (globalThis.__RA = globalThis.__RA || fresh()) : fresh(); setup(A, ck); boot(A); const rs = [];
    for(const c of batch){ const pre = slotOf(dayOf(A, c.w, c.d), c.si, c.ii).n; const n = c.hops.length; let prevJS = null, prevSlot = null, unreach = 0;
      c.hops.forEach((to, k) => { if(k === n - 1){ const dy = dayOf(A, c.w, c.d); prevJS = JS(dy.sections); prevSlot = slotOf(dy, c.si, c.ii); } unreach += hop(A, c, to); });
      view(A, c.w, c.d); const cur = slotOf(dayOf(A, c.w, c.d), c.si, c.ii); const sb = storeOf(A, c.w, c.d);
      const froms = sb.map(e => e.from); const dupFrom = new Set(froms).size < froms.length ? 1 : 0;
      const chip = E(A, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || '';
      E(A, '__T.length=0;'); if(chip) E(A, 'undoSwap(' + JSON.stringify(chip) + ');'); const toast = Array.from(E(A, '__T')).join(' / ');
      const dy = dayOf(A, c.w, c.d); const aJS = JS(dy.sections); const u = slotOf(dy, c.si, c.ii);
      const chipAfter = E(A, 'swapOriginOf(' + JSON.stringify(u.n) + ')') || '';
      const seq = [pre].concat(c.hops);
      const r = { id:c.id, kind:c.kind, ck, w:c.w, d:c.d, si:c.si, ii:c.ii, shape:shapeOf(pre, c.hops), n, unreach, chip, handChip:seq[n - 1], ok:!!chip && u.n === prevSlot.n && u.d === prevSlot.d ? 1 : 0, dayEq:aJS === prevJS ? 1 : 0,
        aH:H(aJS), sb:sb.map(e => e.from + '->' + e.to), sa:storeOf(A, c.w, c.d).map(e => e.from + '->' + e.to), chipAfter, handAfter:n >= 2 ? seq[n - 2] : '', toast, dupFrom, toRep:new Set(c.hops).size < n ? 1 : 0, pre, hops:c.hops, prev:prevSlot, undo:u };
      r._prevJS = prevJS; r._aJS = aJS; rs.push(r); }
    // reboot in the same VM from the same localStorage; compare every chain day to the live day after undo and to the pre-last-tap day
    const lsCopy = []; for(const [k, v] of A.localStorage._map) lsCopy.push([k, v]);
    boot(A); for(const r of rs){ const bd = dayOf(A, r.w, r.d); const bj = JS(bd.sections); r.bootEq = bj === r._aJS ? 1 : 0; r.bootPre = bj === r._prevJS ? 1 : 0; r.bH = H(bj); const bs_ = slotOf(bd, r.si, r.ii); r.bootSlotEq = bs_.n === r.undo.n && bs_.d === r.undo.d ? 1 : 0;
      if(!r.bootEq){ const L = JSON.parse(r._aJS), Bo = JSON.parse(bj); let df = null; for(let si = 0; si < Math.max(L.length, Bo.length) && !df; si++){ const ls = L[si] || {}, bs2 = Bo[si] || {}; const li = ls.items || [], bi = bs2.items || []; for(let ii = 0; ii < Math.max(li.length, bi.length) && !df; ii++){ if(JSON.stringify(li[ii]) !== JSON.stringify(bi[ii])){ const a = li[ii] || {}, b = bi[ii] || {}; df = { where:(si === r.si && ii === r.ii) ? 'slot' : (si === r.si ? 'same-section item' : 'other section item'), si, ii, live:clean(a.name) + ' | ' + (a.detail || ''), boot:clean(b.name) + ' | ' + (b.detail || ''), keys:Object.keys(Object.assign({}, a, b)).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).join(',') }; } } if(!df){ const la = Object.assign({}, ls, { items:0 }), ba = Object.assign({}, bs2, { items:0 }); if(JSON.stringify(la) !== JSON.stringify(ba)) df = { where:'section field', si, keys:Object.keys(Object.assign({}, la, ba)).filter(k => JSON.stringify(la[k]) !== JSON.stringify(ba[k])).join(','), live:'', boot:'' }; } } r.bootDiff = df || { where:'unlocated' }; } }
    if(b === 0 || b === nB - 1){ const Bt = fresh(); Bt.localStorage.clear(); lsCopy.forEach(([k, v]) => Bt.localStorage.setItem(k, v)); boot(Bt);
      for(const r of rs){ freshChk++; if(H(JS(dayOf(Bt, r.w, r.d).sections)) === r.bH) freshAgree++; } }
    rs.forEach(r => { delete r._prevJS; delete r._aJS; out.push(r); }); }
  fs.writeFileSync(F('ur_' + tree + '_' + chunk + '.json'), JSON.stringify({ rows:out, freshChk, freshAgree })); process.exit(0);
}

// ── DRIVER ──
for(const f of Object.values(TREES)) try { fs.unlinkSync(f); } catch(e){}
const v227 = fs.readFileSync(process.env.SRCHTML || path.join(ROOT, 'index.html'), 'utf8'); fs.writeFileSync(TREES.V227, v227);
const cnt = (s, a) => s.split(a).length - 1; const nTo = cnt(v227, A_TO), nFrom = cnt(v227, A_FROM);
const SRC = v227.split('\n'); const lineOf = a => SRC.findIndex(l => l.includes(a)) + 1;
console.log('v228_undokey | V227 ia-version ' + load(TREES.V227).version + ' (copy of index.html)');
console.log('  CF anchor  :' + lineOf(A_TO) + ' count ' + nTo + ' | ' + A_TO + '  ->  .pop()');
console.log('  CF2 anchor :' + lineOf(A_FROM) + ' count ' + nFrom + ' | ' + A_FROM + '  ->  .pop()  (CF2 = CF + this)');
if(nTo !== 1 || nFrom !== 1) throw new Error('anchor count not 1');
const cfSrc = v227.replace(A_TO, A_TO.replace('[0];', '.pop();')); fs.writeFileSync(TREES.CF, cfSrc);
fs.writeFileSync(TREES.CF2, cfSrc.replace(A_FROM, A_FROM.replace('[0];', '.pop();')));
// source diff + string literals on changed lines (no athlete-facing string may move)
for(const t of ['CF', 'CF2']){ const a = v227.split('\n'), b = fs.readFileSync(TREES[t], 'utf8').split('\n'); const dl = []; for(let i = 0; i < Math.max(a.length, b.length); i++) if(a[i] !== b[i]) dl.push(i + 1);
  const lits = s => (s.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || []).join(' ');
  console.log('  ' + t + ' vs V227: lines ' + a.length + '/' + b.length + ', changed ' + dl.length + ' at :' + dl.join(',:') + ' | string literals on changed lines equal ' + dl.every(i => lits(a[i - 1]) === lits(b[i - 1]))); }
// blast radius: build path
{ const out = {}; for(const t of ['V227', 'CF', 'CF2']){ FILE = TREES[t]; const IA = fresh(); out[t] = {}; out[t].MANNY = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY))); out[t].MANNY2 = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));
    for(const k of Object.keys(L9)) out[t][k] = progDigest(IA.buildProgram(clone(L9[k]))); for(const k of Object.keys(fixtures)) out[t]['fx_' + k] = progDigest(IA.buildProgram(clone(fixtures[k])));
    out[t].grid = H(weekGrid(IA.buildProgram(clone(fixtures.HALF_MANNY)))); }
  console.log('\n=== BLAST (build path)\n  HALF_MANNY digest V227 ' + out.V227.MANNY + ' (self-stable ' + (out.V227.MANNY === out.V227.MANNY2) + ') | CF ' + out.CF.MANNY + ' | CF2 ' + out.CF2.MANNY + ' | weekGrid hash ' + out.V227.grid + '/' + out.CF.grid + '/' + out.CF2.grid);
  const keys = Object.keys(out.V227).filter(k => !/^MANNY|grid/.test(k)); console.log('  lattice+fixtures digests: ' + keys.length + ' configs, CF differs ' + keys.filter(k => out.CF[k] !== out.V227[k]).length + ', CF2 differs ' + keys.filter(k => out.CF2[k] !== out.V227[k]).length + ' | ' + keys.map(k => k + ' ' + out.V227[k]).join(' | ')); }
// hand trace
{ let st = []; const rec = (f, t) => { st = st.filter(e => e.from !== f); st.push({ from:f, to:t }); };
  rec('A', 'B'); rec('B', 'C'); rec('C', 'B'); console.log('\n  hand trace A>B>C>B store ' + JSON.stringify(st) + ' | first to==B ' + st.find(e => e.to === 'B').from + ' | last to==B ' + st.filter(e => e.to === 'B').pop().from + ' | max records per from under recordSwap: 1 (filter e.from!==from before push)'); }
// enumerate on V227
FILE = TREES.V227;
function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const chunks = []; const writeChunks = (kind, ck, w, arr) => { for(let p = 0; p * CHUNK < arr.length; p++){ const name = kind + '_' + ck + '_' + w + '_' + p; fs.writeFileSync(F('uc_' + name + '.json'), JSON.stringify({ ck, chains:arr.slice(p * CHUNK, (p + 1) * CHUNK) })); chunks.push(name); } };
for(const ck of Object.keys(CFGS)){ const IA = fresh(); setup(IA, ck); boot(IA); const per = {};
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')')); const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const h4w = {};
  for(const w of WEEKS){ const h3 = [], h4 = [], slots = []; let id = 0;
    for(const d of DAYS){ const live = dayOf(IA, w, d); if(!live || !live.sections) continue; const bs = clone(live); IA.ctx.__D = bs;
      const sl0 = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) sl0.push({ si, ii, n:it.name }); }));
      for(const sl of sl0){ const memo = {}; const cn = nm => { if(!(nm in memo)){ const dd = clone(bs); dd.sections[sl.si].items[sl.ii].name = nm; IA.ctx.__D = dd; memo[nm] = (nm === sl.n || can(sl.si, sl.ii)) ? cand(w, nm) : []; } return memo[nm]; };
        const sk = slots.push(cn) - 1;
        for(const B of cn(sl.n)) for(const C of cn(B)) for(const X of cn(C)){ const hops = [B, C, X]; const sh = shapeOf(sl.n, hops); if(process.env.FAMONLY && famOf(sh, 3) !== process.env.FAMONLY){ id++; continue; } const c = { id:ck + w + '#' + id++, kind:'h3', w, d, si:sl.si, ii:sl.ii, hops, sk };
          c.cf2 = famOf(sh, 3) !== 'other' || id % 20 === 0; h3.push(c);
          if(ck === 'lowback_wa' && !(process.env.H4SKIP||'').split(',').includes(d)) for(const Y of cn(X)){ h4.push({ id:c.id + '+' + Y, kind:'h4', w, d, si:sl.si, ii:sl.ii, hops:[B, C, X, Y], cf2:h4.length % 10 === 0 }); } } } }
    const rnd = mulberry(0xC0FFEE + w * 7 + ck.length * 131); const h5 = [];
    for(let t = 0; !process.env.NOH5 && t < N5 * 5 && h5.length < N5 && h3.length; t++){ const c = h3[Math.floor(rnd() * h3.length)]; const cn = slots[c.sk]; const c4 = cn(c.hops[2]); if(!c4.length) continue; const Y = c4[Math.floor(rnd() * c4.length)]; const c5 = cn(Y); if(!c5.length) continue; const Z = c5[Math.floor(rnd() * c5.length)];
      h5.push({ id:c.id + '+' + Y + '+' + Z + '@' + t, kind:'h5', w, d:c.d, si:c.si, ii:c.ii, hops:c.hops.concat([Y, Z]), cf2:true }); }
    h3.forEach(c => delete c.sk);
    writeChunks('h3', ck, w, h3); writeChunks('h5', ck, w, h5); if(ck === 'lowback_wa') h4w[w] = h4;
    per['W' + w] = h3.length + ' hop3, ' + h5.length + ' hop5' + (ck === 'lowback_wa' ? ', ' + h4.length + ' hop4 enumerated' : ''); }
  if(ck === 'lowback_wa'){ const tot = WEEKS.reduce((s, w) => s + h4w[w].length, 0); const use = tot <= H4MAX ? WEEKS : [WEEKS[0]];
    console.log('  hop4 lowback_wa total ' + tot + ' (cap ' + H4MAX + ') -> enumerated weeks run: ' + use.join(',')); use.forEach(w => writeChunks('h4', ck, w, h4w[w])); }
  console.log('  ENUM ' + ck.padEnd(12) + ' ' + JSON.stringify(per)); }
if(process.env.ONLYH4) chunks.splice(0, chunks.length, ...chunks.filter(c => c.startsWith('h4_')));
const jobs = []; for(const ch of chunks) for(const t of (process.env.NOCF2 ? ['V227', 'CF'] : ['V227', 'CF', 'CF2'])) jobs.push(t + ':' + ch);
(async () => {
  if(process.env.RESUME){ const keep = jobs.filter(j => fs.existsSync(F('ur_' + j.replace(':', '_') + '.json'))); console.log('RESUME: kept ' + keep.length + ' finished jobs of ' + jobs.length); keep.forEach(j => jobs.splice(jobs.indexOf(j), 1)); } else jobs.forEach(j => { try { fs.unlinkSync(F('ur_' + j.replace(':', '_') + '.json')); } catch(e){} });
  let i = 0; const t0 = Date.now(); let crash = 0;
  await Promise.all(Array.from({ length:8 }, async () => { while(i < jobs.length){ const j = jobs[i++]; await new Promise(res => { const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j }), stdio:['ignore', 'pipe', 'pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', c => { if(c){ crash++; console.log('WORKER CRASH ' + j + ' ' + o.slice(-600)); } res(); }); }); } }));
  console.log('\nworkers ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s, jobs ' + jobs.length + ', crashed ' + crash);
  // aggregate chunk by chunk (paired by chain id)
  const S = {}; const ex = [], bex = [], BF = {}; let fC = 0, fA = 0, missing = 0;
  const add = (key, f, v) => { const s = S[key] = S[key] || {}; s[f] = (s[f] || 0) + (v ? 1 : 0); };
  for(const ch of chunks){ const R = {}; for(const t of ['V227', 'CF', 'CF2']){ const f = F('ur_' + t + '_' + ch + '.json'); if(!fs.existsSync(f)){ missing++; console.log('MISSING ' + t + ':' + ch + ' (failed measurement)'); continue; } const o = JSON.parse(fs.readFileSync(f, 'utf8')); fC += o.freshChk; fA += o.freshAgree; R[t] = new Map(o.rows.map(r => [r.id, r])); }
    if(!R.V227 || !R.CF) continue;
    for(const [id, v] of R.V227){ const c = R.CF.get(id); if(!c) { add('LOST', 'n', 1); continue; } if(v.unreach || c.unreach){ add(v.kind + '|unreach', 'n', 1); continue; }
      const fam = famOf(v.shape, v.n); const keys = [v.kind + '|ALL', v.kind + '|' + v.ck + '|' + fam, v.kind + '|fam|' + fam, v.kind + '|' + (v.toRep ? "U_d'" : 'U_d')];
      for(const k of keys){ add(k, 'n', 1); add(k, 'V_wrong', !v.ok); add(k, 'C_wrong', !c.ok); add(k, 'fixed', !v.ok && c.ok); add(k, 'created', v.ok && !c.ok); add(k, 'V_dayNe', !v.dayEq); add(k, 'C_dayNe', !c.dayEq);
        add(k, 'V_chipHand', v.chip === v.handChip); add(k, 'C_chipHand', c.chip === c.handChip); add(k, 'V_noChip', !v.chip); add(k, 'C_noChip', !c.chip);
        add(k, 'V_bootEq', v.bootEq); add(k, 'C_bootEq', c.bootEq); add(k, 'C_bootPre', c.bootPre); add(k, 'V_bootPre', v.bootPre); add(k, 'dupFrom', v.dupFrom || c.dupFrom); add(k, 'bootCreated', v.bootEq && !c.bootEq); add(k, 'bootHealed', !v.bootEq && c.bootEq); add(k, 'V_bootSlotEq', v.bootSlotEq); add(k, 'C_bootSlotEq', c.bootSlotEq);
        add(k, 'C_chipAfterHand', c.chipAfter === c.handAfter); add(k, 'V_chipAfterHand', v.chipAfter === v.handAfter); add(k, 'C_noChipAfter', !c.chipAfter); add(k, 'V_noChipAfter', !v.chipAfter);
        const c2 = R.CF2 && R.CF2.get(id); if(c2){ add(k, 'cf2_n', 1); add(k, 'cf2_same', c2.aH === c.aH && c2.bH === c.bH && JSON.stringify(c2.sa) === JSON.stringify(c.sa) && c2.chip === c.chip && c2.chipAfter === c.chipAfter && c2.toast === c.toast); } }
      if(!v.ok && ex.filter(x => x.v.ck === v.ck && x.v.kind === v.kind).length < 1 && (v.kind !== 'h3' || fam === 'A>B>C>B')) ex.push({ v, c });
      if(!c.bootEq){ const bk = v.kind + '|' + v.ck + '|W' + v.w + '|' + fam + '|' + c.bootDiff.where + '|' + (c.bootDiff.keys || '') + '|V227 ' + (v.bootEq ? 'eq' : 'ne'); BF[bk] = (BF[bk] || 0) + 1; if(bex.filter(x => x.c.bootDiff.where === c.bootDiff.where && x.v.kind === v.kind).length < 2) bex.push({ v, c }); }
      if(v.ok && !c.ok && ex.filter(x => x.tag === 'created').length < 3) ex.push({ v, c, tag:'created' }); } }
  const P = k => { const s = S[k] || {}; const g = f => s[f] || 0; return 'n ' + g('n') + ' | wrong V227 ' + g('V_wrong') + ' -> CF ' + g('C_wrong') + ' (fixed ' + g('fixed') + ', CREATED ' + g('created') + ') | day!=pre V227 ' + g('V_dayNe') + ' CF ' + g('C_dayNe')
    + ' | chip==hand V227 ' + g('V_chipHand') + ' CF ' + g('C_chipHand') + ' | no chip V227 ' + g('V_noChip') + ' CF ' + g('C_noChip') + ' | boot==live V227 ' + g('V_bootEq') + ' CF ' + g('C_bootEq') + ' | boot==pre V227 ' + g('V_bootPre') + ' CF ' + g('C_bootPre')
    + ' | chip after undo==hand V227 ' + g('V_chipAfterHand') + ' CF ' + g('C_chipAfterHand') + ' (none: ' + g('V_noChipAfter') + '/' + g('C_noChipAfter') + ') | dup-from stores ' + g('dupFrom') + ' | boot slot==live slot V227 ' + g('V_bootSlotEq') + ' CF ' + g('C_bootSlotEq') + ' | boot!=live CREATED by CF ' + g('bootCreated') + ' healed ' + g('bootHealed') + ' | CF2==CF ' + g('cf2_same') + '/' + g('cf2_n'); };
  console.log('fresh-VM boot agrees with in-VM reboot: ' + fA + '/' + fC + ' | missing result files ' + missing + ' | lost ids ' + ((S.LOST || {}).n || 0));
  for(const kind of ['h3', 'h4', 'h5']){ console.log('\n=== ' + kind + (kind === 'h4' ? ' (lowback_wa, enumerated)' : kind === 'h5' ? ' (seeded sample)' : ' (full enumeration, 5 configs x W3,W5)') + ' | unreachable ' + ((S[kind + '|unreach'] || {}).n || 0));
    console.log('  ALL   ' + P(kind + '|ALL')); console.log('  U_d   ' + P(kind + '|U_d')); console.log("  U_d'  " + P(kind + "|U_d'"));
    Object.keys(S).filter(k => k.startsWith(kind + '|fam|')).sort().forEach(k => { const s = S[k]; if(kind === 'h3' || s.V_wrong || s.C_wrong) console.log('  FAM ' + k.slice(kind.length + 5).padEnd(14) + P(k)); });
    if(kind !== 'h4') Object.keys(S).filter(k => k.startsWith(kind + '|') && k.split('|').length === 3 && !k.includes('|fam|') && (kind === 'h5' || k.endsWith('A>B>C>B'))).sort().forEach(k => console.log('  CFG ' + k.padEnd(28) + P(k))); }
  console.log('\n=== CF boot != live after undo, by kind|config|week|shape|where|differing keys|V227 same chain (n)'); Object.keys(BF).sort().forEach(k => console.log('  ' + k + '  ' + BF[k]));
  bex.forEach(({ v, c }) => console.log('  BOOTEX ' + v.kind + ' ' + v.ck + ' W' + v.w + ' ' + v.d + ' ' + v.shape + ' : ' + v.pre + ' > ' + v.hops.join(' > ') + '\n    CF store before ' + JSON.stringify(c.sb) + ' after ' + JSON.stringify(c.sa) + ' | undo ok ' + c.ok + '\n    diff ' + JSON.stringify(c.bootDiff) + ' | V227 boot==live ' + v.bootEq));
  console.log('\n=== EXAMPLES (V227 wrong rows; chip text before -> after)');
  ex.forEach(({ v, c, tag }) => console.log('  ' + (tag || '') + ' ' + v.kind + ' ' + v.ck + ' W' + v.w + ' ' + v.d + ' ' + v.shape + ' : ' + v.pre + ' > ' + v.hops.join(' > ')
    + '\n    store ' + JSON.stringify(v.sb) + '\n    V227: chip "SWAPPED IN for ' + v.chip + '" -> undo lands ' + v.undo.n + ' ' + JSON.stringify(v.undo.d) + ' | toast "' + v.toast + '" | chip after "' + v.chipAfter + '" | store after ' + JSON.stringify(v.sa) + ' | boot==live ' + v.bootEq
    + '\n    CF:   chip "SWAPPED IN for ' + c.chip + '" -> undo lands ' + c.undo.n + ' ' + JSON.stringify(c.undo.d) + ' | toast "' + c.toast + '" | chip after "' + c.chipAfter + '" | store after ' + JSON.stringify(c.sa) + ' | boot==live ' + c.bootEq + ' boot==pre ' + c.bootPre
    + '\n    expected (chain tuple): card ' + v.prev.n + ' ' + JSON.stringify(v.prev.d) + ', chip on it ' + v.handAfter));
})();
