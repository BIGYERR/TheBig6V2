// v226 measure (Mode B) — re-baseline P-PACEDISCLOSE (ruled at V209) on the current artifact.
// usage: node tests/measure/v226_rebase_pacedisclose.js [index.html]
// Oracles: the hand default table {beginner 690, intermediate 570, advanced 450}; the ruling file's
// §1 Before strings and §2 Call 4 strings typed below as literals; D187 R3's refusal text typed as a literal.
// The engine is only ever asked what it RENDERS; never what the anchor should be.
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const RD0 = Date, NOW = new RD0(2026, 8, 22, 21, 16, 0).getTime();
class FD extends RD0 { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
globalThis.Date = FD;
const IA = H.load(ART), els = new Map(), mk = IA.window.document.createElement;
IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); };
let TOAST = null; IA.window.__toast = m => { TOAST = m; }; IA.eval('showToast = function(m){ __toast(m); }');
console.log('ia-version', IA.version);
const HAND = { beginner:690, intermediate:570, advanced:450 };
const clk = s => Math.floor(Math.round(s) / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.;])/g, '$1').trim();
const GOALS = ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base'];
const EXPS = ['beginner', 'intermediate', 'advanced'];
const ORDER_MON = ['mon','tue','wed','thu','fri','sat','sun'], ORDER_SUN = ['sun','mon','tue','wed','thu','fri','sat'];
function goalObj(goal, mile, tgt){
  const g = { id:goal, label:goal, baselineDist:'', baseline:'' };
  if(goal === 'run_pace_goal'){ const t = tgt || { d:'1.5', s:720 }; Object.assign(g, { targetDist:t.d, paceUnit:'mi', targetMins:String(Math.floor(t.s / 60)), targetSecs:String(t.s % 60) }); }
  if(mile){ g.mileBestMins = String(Math.floor(mile / 60)); g.mileBestSecs = String(mile % 60); g.mileBestSrc = { kind:'entered' }; }
  return g;
}
function wdOf(goal, exp, mile, seed, rest, age, tgt){
  return { name:'M', primaryPath:'hybrid', cardioTypes:['run'], cardioGoals:{ run:goalObj(goal, mile, tgt) }, liftingFocus:'balanced', experience:exp,
    ageBracket:age || '18-35', equipment:'crossfit', unit:'lbs', restDays:rest || ['sun','wed'], eventTargeted:false, raceDate:'', seed };
}
function setWD(o){ IA.window.__O = o; IA.eval('WD = JSON.parse(JSON.stringify(__O))'); els.clear(); TOAST = null; }
function gen(){
  IA.localStorage._map.clear(); IA.eval('activeProg = null');
  try { IA.eval('doGenerate()'); } catch(e){ return { err:'threw ' + e.message }; }
  IA.flushTimers(Infinity);
  const p = IA.eval('activeProg'); if(!p) return { err:'no program', toast:TOAST };
  return { p };
}
function wizard(){
  IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
  const body = String(els.get('wizardBody').innerHTML);
  const t = txt(body);
  const hdr = t.match(/Program length: (\d+) weeks?/);
  const lab = body.match(/<div class="input-label">Current mile time <span[^>]*>([^<]*)<\/span><\/div>/);
  const adv = body.match(/<div id="mileAdvisory" style="([^"]*)">([^<]*)<\/div>/);
  const pf = txt((els.get('paceFeasLine') || {}).innerHTML), fb = txt((els.get('raceDateFeedback') || {}).innerHTML);
  return { hdr: hdr ? +hdr[1] : null, hasField: !!lab, label: lab ? 'Current mile time | ' + lab[1] : null,
    adv: adv ? { shown: /display:block/.test(adv[1]), color: (adv[1].match(/color:([^;"]+)/) || [])[1], text: adv[2] } : null, pf, fb };
}
const PACED = c => /\d{1,2}:\d\d\/mi/.test(String(c.detail || ''));
const EXCL = c => { const s = String(c.subtype || ''); return /benchmark/i.test(s) || (c.dose && c.dose.key === 'bench') ? 'benchmark' : /TIME TRIAL/i.test(s) ? 'tt' : /RACE/i.test(s) ? 'race' : null; };
function firstPaced(p, order){
  const w = p.weeks && p.weeks[1]; if(!w) return { why:'no W1' };
  let runs = 0, unpaced = 0, excl = {};
  for(const d of order){ const x = w[d]; if(!x) continue;
    const cs = [].concat(x.cardio || []).filter(c => c && c.type === 'run');
    const hits = [];
    for(const c of cs){ runs++; const e = EXCL(c); if(e){ excl[e] = (excl[e] || 0) + 1; continue; } if(!PACED(c)){ unpaced++; continue; } hits.push(c); }
    if(hits.length) return { d, c:hits[0], tie:hits.length };
  }
  return { why: runs === 0 ? 'no W1 run card' : 'W1 runs=' + runs + ' unpaced=' + unpaced + ' excluded=' + JSON.stringify(excl) };
}
const out = { strings:[] };
const addStr = (where, s) => { if(s) out.strings.push([where, String(s)]); };

// ── 1. reachability through doGenerate ─────────────────────────────────────────────────────────────
console.log('\n== 1. REACHABILITY: doGenerate, no mile vs mile 8:00, 3 seeds per cell, rest sun/wed, hybrid path ==');
const REACH = {};
for(const goal of GOALS) for(const exp of EXPS){
  const r = { none:0, noneN:0, mile:0, mileN:0, toast:new Set() };
  for(const seed of [1000, 1037, 1074]) for(const mile of [0, 480]){
    setWD(wdOf(goal, exp, mile, seed)); const g = gen();
    if(mile){ r.mileN++; if(g.p) r.mile++; } else { r.noneN++; if(g.p) r.none++; else r.toast.add(String(g.toast || g.err)); }
  }
  REACH[goal + '|' + exp] = r.none === r.noneN;
  console.log(goal.padEnd(14), exp.padEnd(12), 'no-mile builds', r.none + '/' + r.noneN, ' mile-8:00 builds', r.mile + '/' + r.mileN, r.toast.size ? ' refusal: ' + [...r.toast].join(' / ') : '');
}
// event path, undated, for the race goals and pace goal (the path Mario uses)
console.log('-- event path (eventTargeted, no race date), seed 1000, no mile:');
for(const goal of GOALS) for(const exp of EXPS){ const o = wdOf(goal, exp, 0, 1000); o.primaryPath = 'event'; o.eventTargeted = true; setWD(o); const g = gen();
  console.log('  ' + goal.padEnd(14) + exp.padEnd(12) + (g.p ? 'builds ' + g.p.totalWeeks + 'w' : 'REFUSED ' + (g.toast || g.err))); }

// ── 2. surfaces per reachable no-mile cell ─────────────────────────────────────────────────────────
console.log('\n== 2. SURFACES, reachable no-mile cells, seed 1000 ==');
const BEFORE = {
  'B1 card beginner': 'Anchored on an 11:30 mile, the beginner default. A mile time starts being used at intermediate.',
  'B2 card intermediate': 'Anchored on a 9:30 mile, estimated from experience; no mile time was entered. Every pace in this program comes from this row.',
  'B4 wizard label': 'Current mile time (optional — personalizes your training paces)',
  'B7a pace SI': "4x400m at 11:30/mi. This week's goal pace is 11:46/mi.",
  'B7b pace LSD': '1.5 mi at Recovery Pace: 14:18/mi',
  'B7c 5k intervals': '8 × 1:00 at 5K Pace (12:15/mi)',
  'B7e base easy': 'Around 14:05/mi is right for you. Do not run faster than 13:33/mi.',
};
const CALL4 = {
  W1: 'Current mile time (optional)', W2: 'Leave it blank and your paces come from a 9:30 mile, the intermediate default.',
  W2b: 'Leave it blank and your paces come from an 11:30 mile, the beginner default. If you have never timed a mile, leave it blank.',
  W3: 'Your paces start from an 11:30 mile, the beginner default. Every run also names the effort to hold. When pace and effort disagree, follow the effort.',
  C1: 'Anchored on a 9:30 mile, the intermediate default. No mile time was entered. Tap the pencil to enter one.',
  C1b: 'Anchored on an 11:30 mile, the beginner default. The beginner program does not read a mile time.',
  C3: 'Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.',
  S1: 'Paces here start from a 9:30 mile, the intermediate default. Enter your mile time on the program card and every run ahead of you updates.',
  S1b: 'Paces here start from an 11:30 mile, the beginner default. When pace and effort disagree, follow the effort.',
  K1: 'Run anchor: 9:30 mile (intermediate default, no mile time entered) →',
  D9: 'Over 25:00 reads as a walk, not a run. Leave it blank and your paces come from a 9:30 mile instead.',
};
const SEEN = [];   // every rendered string this pass, for the Before / Call 4 audit
for(const goal of GOALS) for(const exp of EXPS){
  const key = goal + '|' + exp; if(!REACH[key]) {
    setWD(wdOf(goal, exp, 0, 1000)); const wz = wizard();
    const d9 = IA.eval('_mileEntryState')(Object.assign(goalObj(goal, 0), { mileBestMins:'26', mileBestSecs:'0' }), exp), blank = IA.eval('_mileEntryState')(goalObj(goal, 0), exp);
    console.log('--', key, 'REFUSED at doGenerate with no mile; wizard as rendered before the refusal:');
    console.log('   wizard field:', wz.hasField ? JSON.stringify(wz.label) : 'NO FIELD', '| advisory:', JSON.stringify(wz.adv), '| header', wz.hdr);
    console.log('   paceFeasLine:', JSON.stringify(wz.pf));
    console.log('   D9 >25:00:', JSON.stringify(d9), '| blank:', JSON.stringify(blank));
    [['wizard label', wz.label], ['advisory', wz.adv && wz.adv.text], ['paceFeasLine', wz.pf], ['D9', d9.msg], ['blank', blank.msg]].forEach(([w, s]) => { if(s) addStr(key + ' ' + w, s); });
    continue; }
  // pace goal: an ambitious target (1.5 mi 12:00 = 8:00/mi) so the D183 ceiling sentence can render
  setWD(wdOf(goal, exp, 0, 1000)); const wz = wizard(); setWD(wdOf(goal, exp, 0, 1000)); const g = gen();
  const p = g.p, a = IA.eval('runAnchorInfo')(p.cfg);
  const det = String(IA.eval('progDetailHTML')(p));
  const rp = det.indexOf('Run paces') >= 0 ? txt(det.slice(det.indexOf('Run paces'), det.indexOf('<div class="det-label">Cardio'))) : null;
  const pencil = /aria-label="Change mile time"/.test(det);
  const lines = IA.eval('progSelLines')(p), kl = lines.find(l => /^Run anchor/.test(l)) || null;
  const sent = a ? txt(IA.eval('runAnchorSentence')(a)) : null;
  const d9 = IA.eval('_mileEntryState')(Object.assign(goalObj(goal, 0), { mileBestMins:'26', mileBestSecs:'0' }), exp);
  const blank = IA.eval('_mileEntryState')(goalObj(goal, 0), exp);
  const fp = firstPaced(p, ORDER_MON);
  console.log('--', key, '| weeks', p.totalWeeks, '| anchor kind', a ? a.kind : 'null', a ? 'anchorSec ' + clk(a.anchorSec) + ' hand ' + clk(HAND[exp]) + (a.anchorSec === HAND[exp] ? ' =' : ' DIFF') : '');
  console.log('   wizard field:', wz.hasField ? JSON.stringify(wz.label) : 'NO FIELD', '| advisory:', wz.adv ? JSON.stringify(wz.adv) : 'none', '| header', wz.hdr);
  if(wz.pf) console.log('   paceFeasLine:', JSON.stringify(wz.pf));
  console.log('   card Run paces block:', rp ? JSON.stringify(rp) : 'NONE (runAnchorInfo null)', '| pencil', pencil);
  console.log('   card sentence:', JSON.stringify(sent));
  console.log('   clipboard:', JSON.stringify(kl));
  console.log('   D9 >25:00 at', exp + ':', JSON.stringify(d9), '| blank:', JSON.stringify(blank));
  if(fp.c) console.log('   W1 first paced (' + fp.d + ', ' + (fp.c.isNRC ? 'NRC' : 'NSW') + ') ' + fp.c.subtype + '\n      detail: ' + JSON.stringify(fp.c.detail) + '\n      note:   ' + JSON.stringify(fp.c.note));
  else console.log('   W1 first paced: NONE', fp.why);
  [['wizard label', wz.label], ['advisory', wz.adv && wz.adv.text], ['paceFeasLine', wz.pf], ['card', sent], ['runpaces', rp], ['clipboard', kl], ['D9', d9.msg], ['blank', blank.msg], ['W1 note', fp.c && fp.c.note], ['W1 detail', fp.c && fp.c.detail]]
    .forEach(([w, s]) => { if(s){ SEEN.push(s); addStr(key + ' ' + w, s); } });
  // all run card strings, whole program, for the B7 audit and the disclosure-token count
  for(const w of Object.keys(p.weeks)) for(const d of ORDER_MON){ const x = p.weeks[w][d]; if(!x) continue; [].concat(x.cardio || []).forEach(c => { if(c && c.type === 'run'){ SEEN.push(String(c.detail || '')); } }); }
}
// mid-program pencil: the clipboard/card for a beginner WITH a mile (ignored today), and the static source scan
console.log('\n-- beginner WITH mile 8:00 (ignored today): card sentence per goal');
for(const goal of GOALS){ setWD(wdOf(goal, 'beginner', 480, 1000)); const g = gen(); if(!g.p){ console.log('  ', goal, 'REFUSED'); continue; }
  const a = IA.eval('runAnchorInfo')(g.p.cfg); console.log('  ', goal.padEnd(14), a ? a.kind + ' ' + clk(a.anchorSec) + ' | ' + txt(IA.eval('runAnchorSentence')(a)) : 'runAnchorInfo null'); }
const SRC = IA.js.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
console.log('\n-- AUDIT §1 Before strings vs V' + IA.version + ' (rendered this pass | present in comment-stripped source)');
for(const [k, s] of Object.entries(BEFORE)) console.log('  ' + k.padEnd(22), 'rendered', SEEN.some(x => x.includes(s)) ? 'YES' : 'no ', '| source', SRC.includes(s) ? 'YES' : 'no ');
console.log('-- AUDIT §2 Call 4 copy: shipped verbatim? nearest shipped fragment');
const FRAG = { W1:'(optional)', W2:'the intermediate default', W2b:'If you have never timed a mile', W3:'Your paces start from', C1:'Tap the pencil', C1b:'does not read a mile time', C3:'Benchmark runs prescribe no pace', S1:'Paces here start from', S1b:'follow the effort', K1:'intermediate default', D9:'Over 25:00 reads as a walk, not a run.' };
for(const [k, s] of Object.entries(CALL4)){ const f = FRAG[k];
  const hits = (SRC.match(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const line = SRC.split('\n').findIndex(l => l.includes(f));
  console.log('  ' + k.padEnd(4), 'verbatim', SRC.includes(s) ? 'YES' : 'no ', '| fragment ' + JSON.stringify(f) + ' in source x' + hits + (line >= 0 ? ' first js+' + (line + 1) + ': ' + SRC.split('\n')[line].trim().slice(0, 170) : ''));
}
// disclosure-token count on every run card of every reachable no-mile program (lattice §4 reuses this)

// ── 3. wizard length header on non-beginner no-mile run_pace_goal ──────────────────────────────────
console.log('\n== 3. WIZARD LENGTH HEADER, run_pace_goal non-beginner, no mile vs entered miles ==');
const TGTS = []; for(const s of [570, 660, 750, 855]) TGTS.push({ d:'1.5', s }); for(const s of [360, 420, 480, 570]) TGTS.push({ d:'1', s });
const MILES = []; for(let m = 360; m <= 720; m += 30) MILES.push(m);
let hN = 0, hShown = 0, hRefused = 0, hEqDef = 0, pairs = 0, pairsDiff = 0, cellsAnyDiff = 0; const byExp = {}; const ex = [];
for(const exp of ['intermediate', 'advanced']) for(const age of ['18-35', '36-54', '55+']) for(const t of TGTS){
  hN++; setWD(wdOf('run_pace_goal', exp, 0, 1000, null, age, t)); const w0 = wizard(); setWD(wdOf('run_pace_goal', exp, 0, 1000, null, age, t)); const g0 = gen();
  if(w0.hdr != null) hShown++; if(!g0.p) hRefused++;
  setWD(wdOf('run_pace_goal', exp, HAND[exp], 1000, null, age, t)); const wd = wizard(); if(wd.hdr === w0.hdr) hEqDef++;
  let diff = 0; const lens = [];
  for(const m of MILES){ setWD(wdOf('run_pace_goal', exp, m, 1000, null, age, t)); const w = wizard(); setWD(wdOf('run_pace_goal', exp, m, 1000, null, age, t)); const g = gen();
    pairs++; const built = g.p ? g.p.totalWeeks : null; lens.push(clk(m) + '=' + w.hdr + (built !== w.hdr ? '/built' + built : ''));
    if(w.hdr !== w0.hdr){ diff++; pairsDiff++; } }
  if(diff) cellsAnyDiff++;
  const b = byExp[exp] = byExp[exp] || { n:0, diff:0, pairs:0 }; b.n++; b.pairs += MILES.length; b.diff += diff;
  if(ex.length < 6 && diff) ex.push(exp + ' ' + age + ' ' + t.d + 'mi ' + clk(t.s) + ': no-mile header ' + w0.hdr + ' | ' + lens.join(' '));
}
console.log('cells', hN, '| no-mile header renders a length', hShown + '/' + hN, '| doGenerate refuses', hRefused + '/' + hN, '| no-mile header == header at hand default mile', hEqDef + '/' + hN);
console.log('entered-mile pairs where header != the no-mile header:', pairsDiff + '/' + pairs, '| cells with >=1 such mile', cellsAnyDiff + '/' + hN, JSON.stringify(byExp));
ex.forEach(e => console.log('  eg', e));

// ── 4. M2 lattice: first paced run of W1 ───────────────────────────────────────────────────────────
console.log('\n== 4. M2: buildProgram lattice, 6 goals x 3 exp x 20 seeds x rest {sun/wed, sat/sun} x mile {none, 8:00} ==');
const SEEDS = Array.from({ length:20 }, (_, i) => 1000 + i * 37);
const RESTS = { 'sun/wed':['sun','wed'], 'sat/sun':['sat','sun'] };
const seg = {}; let tot = { builds:0, crash:0, noMileReach:0, one:0, none:0, tie:0, orderDisagree:0, excl:0, nrcSel:0, noteEmpty:0, mileEntered:0, mileEnteredBegIgnored:0, discTok:0, runCards:0, unreachNoMile:0 };
const noneWhy = {}; const selBy = {};
const DISC = /(default|estimat|assum|guess|no mile|experience level|anchor|your mile|mile time)/i;
const selfA = JSON.stringify(IA.buildProgram(Object.assign(wdOf('run_5k', 'beginner', 0, 1000), { days:ORDER_SUN.slice() })).weeks);
const selfB = JSON.stringify(IA.buildProgram(Object.assign(wdOf('run_5k', 'beginner', 0, 1000), { days:ORDER_SUN.slice() })).weeks);
console.log('baseline self-equal', selfA === selfB);
for(const goal of GOALS) for(const exp of EXPS) for(const [rn, rest] of Object.entries(RESTS)) for(const mile of [0, 480]) for(const seed of SEEDS){
  const cfg = Object.assign(wdOf(goal, exp, mile, seed, rest), { days:ORDER_SUN.slice() }); delete cfg.eventTargeted;
  let p; try { p = IA.buildProgram(cfg); } catch(e){ tot.crash++; continue; } tot.builds++;
  if(mile){ tot.mileEntered++; if(exp === 'beginner') tot.mileEnteredBegIgnored++; continue; }
  if(!REACH[goal + '|' + exp]){ tot.unreachNoMile++; continue; }
  tot.noMileReach++;
  const s = seg[goal + '|' + exp] = seg[goal + '|' + exp] || { n:0, one:0, none:0 }; s.n++;
  const f = firstPaced(p, ORDER_MON), f2 = firstPaced(p, ORDER_SUN);
  for(const w of Object.keys(p.weeks)) for(const d of ORDER_MON){ const x = p.weeks[w][d]; if(!x) continue; [].concat(x.cardio || []).forEach(c => { if(c && c.type === 'run'){ tot.runCards++; if(DISC.test(String(c.detail || '') + ' ' + String(c.note || ''))) tot.discTok++; } }); }
  if(!f.c){ tot.none++; s.none++; noneWhy[goal + '|' + exp + ' ' + f.why] = (noneWhy[goal + '|' + exp + ' ' + f.why] || 0) + 1; continue; }
  tot.one++; s.one++; if(f.tie > 1) tot.tie++;
  if(EXCL(f.c)) tot.excl++;
  if(f.c.isNRC) tot.nrcSel++; if(!f.c.note) tot.noteEmpty++;
  if(!f2.c || f2.c !== f.c) tot.orderDisagree++;
  const k = (f.c.isNRC ? 'NRC ' : 'NSW ') + f.d + ' ' + f.c.subtype; selBy[goal + ' ' + k] = (selBy[goal + ' ' + k] || 0) + 1;
}
console.log(JSON.stringify(tot));
console.log('segment (reachable no-mile):'); Object.entries(seg).forEach(([k, v]) => console.log('  ' + k.padEnd(26), JSON.stringify(v)));
console.log('none, why:'); Object.entries(noneWhy).forEach(([k, v]) => console.log('  ' + v + '  ' + k));
console.log('selected card by goal (NRC/NSW, day, subtype):'); Object.entries(selBy).sort().forEach(([k, v]) => console.log('  ' + String(v).padStart(4) + '  ' + k));
const man = IA.buildProgram(H.fixtures.HALF_MANNY), man2 = IA.buildProgram(H.fixtures.HALF_MANNY);
console.log('HALF_MANNY digest', H.progDigest(man), 'self-equal', H.progDigest(man) === H.progDigest(man2), 'pinned 0ac7da6b1691a8e1', H.progDigest(man) === '0ac7da6b1691a8e1');

// ── 5. M3 dash / hyphen / Nike sweep ──────────────────────────────────────────────────────────────
console.log('\n== 5. M3: dash/hyphen/Nike sweep on current strings the ruling touches, and on the Call 4 copy ==');
const uniq = new Map(); out.strings.forEach(([w, s]) => { if(!uniq.has(s)) uniq.set(s, w); });
const sweep = (w, s) => { const hits = [];
  if(/—/.test(s)) hits.push('em-dash'); if(/–/.test(s)) hits.push('en-dash'); if(/\s-\s/.test(s)) hits.push('spaced hyphen'); if(/[A-Za-z]-[A-Za-z]/.test(s)) hits.push('word hyphen'); if(/\d-\d/.test(s)) hits.push('range hyphen'); if(/nike/i.test(s)) hits.push('NIKE');
  return hits; };
let sN = 0, sHit = 0;
for(const [s, w] of uniq){ sN++; const h = sweep(w, s); if(h.length){ sHit++; console.log('  HIT [' + h.join(',') + '] ' + w + ': ' + JSON.stringify(s.slice(0, 220))); } }
console.log('current strings swept', sN, 'with a hit', sHit);
let cN = 0, cHit = 0; for(const [k, s] of Object.entries(CALL4)){ cN++; const h = sweep(k, s); if(h.length){ cHit++; console.log('  CALL4 HIT [' + h.join(',') + '] ' + k); } }
console.log('Call 4 strings swept', cN, 'with a hit', cHit);
console.log('\nDONE');
