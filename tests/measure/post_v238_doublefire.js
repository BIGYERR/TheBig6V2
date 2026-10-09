// Post-V238 m4 — can one tap on the rest sheet's "Log it" store the jog twice? Read-only. VM drive of the code-read.
// Usage: node tests/measure/post_v238_doublefire.js <v238.html> <v237.html>
// A: his gesture (Run, Steady chip = RPE 7, miles 1, minutes left at the 30 prefill) -> Log it once, then the same
//    button's onclick a second time (what a second click on the still-visible, sliding sheet would run). Plus the
//    one-tap shapes that would also give mins 60: minutes typed 60.
// B: after the first call, is the button still in the DOM, the draft unreset, the overlay still class-open?
// C: second call of other sheet-closing buttons: applyRestMove, handleDayStatus (Done), applyOverlayDraft.
// Oracle: hand constants (1 mi, 30 / 60 min, RPE 7); expected sums by hand arithmetic.
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILES = { V238: process.argv[2] || 'index.html', V237: process.argv[3] };
const CLOCK = new Date('2026-10-08T12:00:00').getTime();
let IA, E, LS, REG, CLS;
function boot(file){ IA = H.load(file); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(CLOCK); } static now(){ return CLOCK; } }
  IA.ctx.Date = FD; E = IA.eval; LS = IA.localStorage; REG = new Map(); CLS = new Map();
  function mk(id){ const set = new Set(); CLS.set(id, set); return { id, value:'', dataset:{}, style:{}, _html:'', scrollTop:0, textContent:'',
    classList:{ add(c){ set.add(c); }, remove(c){ set.delete(c); }, toggle(c,f){ (f===undefined?!set.has(c):f)?set.add(c):set.delete(c); }, contains(c){ return set.has(c); } },
    addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){}, querySelectorAll(){ return []; }, querySelector(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; },
    get innerHTML(){ return this._html; }, set innerHTML(h){ this._html = String(h); } }; }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); const e = mk(id); REG.set(id, e); return e; };
  IA.ctx.setTimeout = () => 0; return IA.version; }
function install(){ const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  p.id='p_mario'; p.name='HALF MANNY'; p.created=1; p.startDate='2026-09-28'; p.seed=cfg.seed; p.cfg=p.cfg||cfg; p.overlays=[];
  LS.clear(); LS.setItem('ia_programs', JSON.stringify([p])); LS.setItem('ia_active', p.id); IA.ctx.__P = p; E('activeProgId="p_mario"; activeProg=__P; currentWeek=2;'); }
const html = id => (REG.get(id)||{})._html||'';
const onchangeOf = ph => { const t = (html('restBody').match(/<input[^>]*>/g)||[]).find(x => x.includes('placeholder="'+ph+'"')); return /onchange="([^"]*)"/.exec(t)[1]; };
const type = (ph, v) => { IA.ctx.__v = v; E('(function(){'+onchangeOf(ph)+'}).call({value:__v})'); };
const btn = lbl => { const m = new RegExp('onclick="([^"]*)">'+lbl+'<').exec(html('restBody')); return m && m[1]; };
const wed = () => JSON.stringify((JSON.parse(LS.getItem('ia_logs_p_mario')||'{}')).w2_wed||null);
const miles = () => { E('renderWeekView()'); let h=''; REG.forEach(v=>{h+=v._html;}); const m=/color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(h); return m?m[1]:null; };
const journal = () => { E('progressViewId=null; renderProgressScreen()'); let h=''; REG.forEach(v=>{h+=v._html;}); const t=h.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '); const i=t.indexOf('Week 2'); const j=t.indexOf('Session Journal'); return j<0?'(none)':t.slice(j, j+90); };
for(const [ver, file] of Object.entries(FILES)){ if(!file) continue; console.log('\n######## '+ver+' (ia-version '+boot(file)+')');
  for(const [lbl, mins, taps] of [['his gesture, one call', null, 1], ['his gesture, the Log it onclick run twice', null, 2], ['minutes typed 60, one call', '60', 1], ['minutes typed 60, run twice', '60', 2]]){
    install(); E("openDayKey('wed')"); E("_rdSet('view','cardio')"); E("_rdSet('rpe',7)"); type('miles','1'); if(mins) type('minutes', mins);
    const oc = btn('Log it'); const out = [];
    for(let k=0;k<taps;k++){ E(oc); out.push('after call '+(k+1)+': stored '+wed()+' | overlay class open '+CLS.get('restOverlay').has('open')+' | "Log it" still in restBody '+/>Log it</.test(html('restBody'))+' | _restDraft '+E('JSON.stringify({mins:_restDraft.mins,dist:_restDraft.dist,rpe:_restDraft.rpe,view:_restDraft.view})')); }
    console.log('  '+lbl+' (button onclick "'+oc+'")\n    '+out.join('\n    ')+'\n    week MILES '+miles()+' | journal '+journal());
  }
  // C: other sheet-closing buttons, second call
  install(); E("openDayKey('wed')"); E("_rdSet('view','move')"); E("_rdSet('pick','tue')"); const mv = btn('Move it here'); E(mv); const m1 = LS.getItem('ia_moves_p_mario'); let t2=''; try{ E(mv); t2 = LS.getItem('ia_moves_p_mario'); }catch(e){ t2 = 'threw '+e.message; }
  console.log('  applyRestMove x2: after 1 '+m1+' | after 2 '+t2+' | identical '+(m1===t2));
  install(); E('currentWeek=2; openDetail("thu", activeProg.weeks[2].thu)'); E('handleDayStatus("thu","x","complete")'); const c1 = LS.getItem('ia_comp_p_mario'); E('handleDayStatus("thu","x","complete")'); const c2 = LS.getItem('ia_comp_p_mario');
  console.log('  handleDayStatus(Done) x2: after 1 '+c1+' | after 2 '+c2);
  install(); let ovr = ''; try { E('_ovDraft.equipment="home_basic"; _ovDraft.from="2026-10-12"; _ovDraft.to="2026-10-18"; applyOverlayDraft();'); const o1 = E('activeProg.overlays.length'); E('applyOverlayDraft()'); ovr = 'overlays after 1: '+o1+' | after 2: '+E('activeProg.overlays.length'); } catch(e){ ovr = 'threw '+e.message; }
  console.log('  applyOverlayDraft x2: '+ovr);
}
console.log('\nDONE');
