// v204 measure — ":60" in rendered pace/time strings.
// Oracle: a well-formed m:ss clock has seconds in [0,59] with two digits.
// Derived from the clock contract, NOT from any formatter in index.html.
// Usage: node tests/measure/v204_pace_sixty.js [artifact.html]
const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const R = n => { try { return IA.eval(`typeof ${n}!=='undefined'?${n}:undefined`); } catch(e){ return undefined; } };

// ── ORACLE ────────────────────────────────────────────────────────────────
// Any "<digits>:<digits>" token in athlete-facing text. Malformed if the
// seconds limb is not exactly two digits in 00..59.
const CLOCK = /(-?\d+):(\d+)(?::(\d+))?/g;
function scanClocks(str){
  const bad = [];
  if(typeof str !== 'string') return bad;
  const plain = str.replace(/<svg[\s\S]*?<\/svg>/g,'');
  let m;
  CLOCK.lastIndex = 0;
  while((m = CLOCK.exec(plain))){
    const limbs = m[3] !== undefined ? [m[2], m[3]] : [m[2]];
    let why = null;
    for(const L of limbs){
      if(L.length !== 2) why = 'pad:' + m[0];
      else if(+L > 59) why = (+L === 60 ? 'sixty' : 'over59') + ':' + m[0];
    }
    if(+m[1] < 0) why = 'negative:' + m[0];
    if(why) bad.push({tok:m[0], why});
  }
  if(/NaN|Infinity|undefined:/.test(plain)) bad.push({tok:'NaN/Infinity', why:'nan'});
  return bad;
}
// Reps/sets like "3 x 12" are not clocks. Rep ranges "8-12" have no colon.
// Excluded shapes: anything without ':' never enters CLOCK.

// ── PURE FORMATTER PROBE ──────────────────────────────────────────────────
// Reproduces the *idiom* only to bound its domain; every reported defect below
// is read out of a BUILT program string, not out of this probe.
function idiomDomain(){
  const f = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
  let n=0, bad=0, examples=[];
  for(let x=0; x<=1200; x+=0.1){
    const s=Math.round(x*10)/10; n++;
    if(/:(6\d|\d\d?)$/.test(f(s)) && +f(s).split(':')[1] > 59){ bad++; if(examples.length<6) examples.push(s+' -> '+f(s)); }
  }
  return {n, bad, examples};
}

// ── LATTICE ───────────────────────────────────────────────────────────────
const GOALS = [
  {id:'run_pace_goal', extra:{targetDist:'1.5', paceUnit:'mi', targetMins:'9', targetSecs:'30'}},
  {id:'run_pace_goal', extra:{targetDist:'2',  paceUnit:'mi', targetMins:'14', targetSecs:'0'}, tag:'2mi'},
  {id:'run_base', extra:{}},
  {id:'run_5k',  extra:{}},
  {id:'run_10k', extra:{}},
  {id:'run_half', extra:{}},
  {id:'run_marathon', extra:{}},
];
const EXPS = ['beginner','intermediate','advanced'];
const STEP = +(process.env.STEP || 1);          // seconds of mile anchor
const LO = 285, HI = 735;
const SEEDS = (process.env.SEEDS||'76308').split(',').map(Number);

function mkCfg(goal, exp, anchorSec, seed){
  const c = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  c.experience = exp; c.seed = seed;
  c.primaryPath = (goal.id==='run_5k'||goal.id==='run_10k'||goal.id==='run_half'||goal.id==='run_marathon') ? 'event' : 'goal';
  c.eventTargeted = c.primaryPath === 'event';
  if(!c.eventTargeted) delete c.raceDate;
  c.cardioGoals = { run: Object.assign({
    id: goal.id, label: goal.id,
    mileBestMins: String(Math.floor(anchorSec/60)),
    mileBestSecs: String(anchorSec%60),
    baselineDist:'5', baseline:'5mi'
  }, goal.extra) };
  return c;
}

const hits = [];          // {goal,exp,anchor,seed,surface,field,tok,why,str}
let cards = 0, builds = 0, crashes = 0, anchorInfoOk = 0, anchorInfoNull = 0, strNumMismatch = 0, doseSeen = 0;
function note(ctx, surface, field, str){
  const bad = scanClocks(str);
  for(const b of bad) hits.push(Object.assign({surface, field, tok:b.tok, why:b.why, str}, ctx));
}

for(const goal of GOALS){
  for(const exp of EXPS){
    for(let a = LO; a <= HI; a += STEP){
      for(const seed of SEEDS){
        const cfg = mkCfg(goal, exp, a, seed);
        const ctx = {goal:(goal.tag||goal.id), exp, anchor:a, seed};
        let prog;
        try { prog = IA.buildProgram(cfg); }
        catch(e){ crashes++; hits.push(Object.assign({surface:'CRASH', field:e.message, tok:'', why:'crash', str:''}, ctx)); continue; }
        builds++;
        const wks = prog.weeks || {};
        for(const wk of Object.keys(wks)){
          for(const d of Object.keys(wks[wk])){
            const day = wks[wk][d]; if(!day) continue;
            const cs = day.cardio ? (Array.isArray(day.cardio)?day.cardio:[day.cardio]) : [];
            for(const c of cs){
              cards++;
              note(ctx,'session.detail', wk+'/'+d, c.detail||'');
              note(ctx,'session.note',   wk+'/'+d, c.note||'');
              note(ctx,'session.subtype',wk+'/'+d, c.subtype||'');
              // does the malformed value reach a NUMERIC dose?
              const dose = c.dose || c._dose;
              if(dose && typeof dose.tgt === 'number'){ doseSeen++;
                const mm=Math.floor(dose.tgt/60), ss=dose.tgt%60;
                const want = mm+':'+String(ss).padStart(2,'0')+'/mi';
                const printed = (String(c.detail||'').match(/Tempo Pace: (\d+:\d+\/mi)/)||[])[1];
                if(printed && printed !== want) strNumMismatch++;
              }
              if(dose && dose.tgt !== undefined && !Number.isInteger(dose.tgt))
                hits.push(Object.assign({surface:'dose.tgt', field:wk+'/'+d, tok:String(dose.tgt), why:'nonint-tgt', str:''}, ctx));
              if(dose && dose.cap !== undefined && !Number.isInteger(dose.cap))
                hits.push(Object.assign({surface:'dose.cap', field:wk+'/'+d, tok:String(dose.cap), why:'nonint-cap', str:''}, ctx));
            }
            for(const sec of (day.sections||[])) for(const it of (sec.items||[])){
              cards++;
              note(ctx,'lift.name', wk+'/'+d, String(it.name||''));
              note(ctx,'lift.rx',   wk+'/'+d, String(it.rx||''));
              note(ctx,'lift.cue',  wk+'/'+d, String(it.cue||it.note||''));
            }
          }
        }
        // ── DISPLAY SURFACES (rendered off the same cfg) ──
        try {
          const ai = typeof R('runAnchorInfo')==='function' ? R('runAnchorInfo')(cfg) : null;
          if(ai){ anchorInfoOk++;
            const _ch=R('runAnchorChips'); if(typeof _ch==='function') for(const ch of _ch(ai)) note(ctx,'runAnchorChips', ch.k, String(ch.v));
            const _sn=R('runAnchorSentence'); if(typeof _sn==='function') note(ctx,'runAnchorSentence','-', String(_sn(ai)));
            const _ln=R('runAnchorLine'); if(typeof _ln==='function') note(ctx,'runAnchorLine','-', String(_ln(ai)));
          } else anchorInfoNull++;
        } catch(e){ hits.push(Object.assign({surface:'SURFACE-CRASH', field:e.message, tok:'', why:'crash', str:''}, ctx)); }
      }
    }
  }
}

// ── PROJECTION / CHART LABEL FORMATTERS, swept over the same anchor domain ──
const fnProbe = [];
for(const name of ['_fmtPaceShort','_fmtHMS','_fmtMileAnchor','_fmtPaceMi','_halfFromMileSec','_mileFromRecoverySec','steadyCapSec']){
  const fn = R(name); if(typeof fn !== 'function'){ fnProbe.push([name,'ABSENT',0,0,'']); continue; }
  let n=0,bad=0,ex='';
  for(let s=LO; s<=HI+0.0001; s+=0.25){
    let v; try { v = fn(s); } catch(e){ continue; }
    if(typeof v !== 'string') continue;
    n++; const b = scanClocks(v); if(b.length){ bad++; if(!ex) ex = s+' -> "'+v+'" ('+b[0].why+')'; }
  }
  // also feed chart-derived seconds (tempo*1.08, steady midpoints)
  for(const row of IA.PACE_CHART){
    for(const v0 of [row.tempo*1.08, (row.tempo+row.recovery)/2, row.recovery, row.fiveK]){
      let v; try { v = fn(v0); } catch(e){ continue; }
      if(typeof v!=='string') continue;
      n++; const b=scanClocks(v); if(b.length){ bad++; if(!ex) ex = v0+' -> "'+v+'" ('+b[0].why+')'; }
    }
  }
  fnProbe.push([name, 'present', n, bad, ex]);
}

// ── REPORT ────────────────────────────────────────────────────────────────
const id = idiomDomain();
console.log('ARTIFACT', ART, 'ia-version', IA.version);
console.log('LATTICE  goals=%d exps=%d anchors=%d step=%ds seeds=%d => %d builds (%d crashes)',
  GOALS.length, EXPS.length, Math.floor((HI-LO)/STEP)+1, STEP, SEEDS.length, builds, crashes);
console.log('CARDS    %d scanned', cards);
console.log('IDIOM    floor/round idiom over [0,1200] @0.1s: %d/%d inputs emit seconds>59  e.g. %s',
  id.bad, id.n, id.examples.slice(0,3).join(' | '));
console.log('ANCHORINFO ok=%d null=%d | doses with numeric tgt=%d | printed-tempo vs dose.tgt mismatches=%d', anchorInfoOk, anchorInfoNull, doseSeen, strNumMismatch);
console.log('HITS     %d', hits.length);
const by = (k)=>{const m={};for(const h of hits)m[h[k]]=(m[h[k]]||0)+1;return m;};
console.log('  by why     ', JSON.stringify(by('why')));
console.log('  by surface ', JSON.stringify(by('surface')));
console.log('  by goal    ', JSON.stringify(by('goal')));
console.log('  by exp     ', JSON.stringify(by('exp')));
const anchors = [...new Set(hits.filter(h=>h.why.startsWith('sixty')).map(h=>h.anchor))].sort((a,b)=>a-b);
console.log('  sixty anchors (%d distinct): %s', anchors.length, anchors.join(','));
console.log('FIRST 12 VERBATIM:');
for(const h of hits.slice(0,12)) console.log('  [%s/%s/%s anchor=%d seed=%d] %s %s :: %s', h.goal,h.exp,h.surface,h.anchor,h.seed,h.tok,h.why,String(h.str).slice(0,170));
console.log('FORMATTER PROBE (name, state, n, bad, example):');
for(const r of fnProbe) console.log('  %s\t%s\tn=%d\tbad=%d\t%s', r[0],r[1],r[2],r[3],r[4]);

// ── REPRO BLOCK: Mario's 1.5-mile pace goal ───────────────────────────────
if(process.env.REPRO){
  const g = GOALS[0];
  const cfg = mkCfg(g, 'intermediate', 480, 76308);
  const prog = IA.buildProgram(cfg);
  console.log('\nREPRO cfg:', JSON.stringify({exp:cfg.experience, seed:cfg.seed, goal:cfg.cardioGoals.run}));
  for(const wk of Object.keys(prog.weeks||{})) for(const d of Object.keys(prog.weeks[wk])){
    const day=prog.weeks[wk][d]; const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[];
    for(const c of cs){
      const s=[c.subtype,c.detail,c.note].join(' ');
      if(/\d:6\d/.test(s)) console.log('  W'+wk+' '+d.toUpperCase()+' ['+c.subtype+']\n    detail: '+c.detail+'\n    note:   '+c.note+'\n    dose:   '+JSON.stringify(c.dose||c._dose));
    }
  }
  // distinct affected builds
  const keys = new Set(hits.map(h=>[h.goal,h.exp,h.anchor,h.seed].join('|')));
  console.log('DISTINCT AFFECTED BUILDS %d / %d', keys.size, builds);
  const seg = {}; for(const h of hits){ const k=h.goal+'/'+h.exp; (seg[k]=seg[k]||new Set()).add(h.anchor); }
  for(const k of Object.keys(seg)) console.log('  %s: %d distinct anchors of 451', k, seg[k].size);
}
