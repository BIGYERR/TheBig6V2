// v0.240.0 m5 — before-picture for the rest sheet (P-RESTWHEEL widened) and P-SHEETCLOSE. Read-only. ia-version 238.
// Usage: node tests/measure/v0.240.0_restsheet_m5.js [index.html] > tests/measure/v0.240.0_restsheet_m5.out.txt
// HALF_MANNY seed 76308 (rest WED + SUN), start Mon 2026-09-28, clocks pinned (Thu 2026-10-08 noon = W2 THU unless stated).
// Oracles: hand calendar (dates below), hand constants (3.1 mi, 25 min, RPE 7), the CSS text, RPE_LABELS as printed.
// Every button is run through its own rendered onclick string where the sheet renders one.
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const SRC = require('fs').readFileSync(FILE, 'utf8');
let IA, E, LS, REG, CLS, CLOCK;
const T = s => new Date(s).getTime();
function boot(clockIso){
  CLOCK = T(clockIso); IA = H.load(FILE); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(CLOCK); } static now(){ return CLOCK; } }
  IA.ctx.Date = FD; E = code => require('vm').runInContext(code, IA.ctx, {timeout:3000}); LS = IA.localStorage; REG = new Map(); CLS = new Map();
  function mk(id, child){ const set = new Set(); if(!child) CLS.set(id, set); const el = { id, value:'', dataset:{}, style:{}, _html:'', scrollTop:0, textContent:'', onclick:null,
    classList:{ add(c){ set.add(c); }, remove(c){ set.delete(c); }, toggle(c,f){ (f===undefined?!set.has(c):f)?set.add(c):set.delete(c); }, contains(c){ return set.has(c); } },
    addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){}, insertBefore(){}, remove(){}, querySelectorAll(){ return []; },
    // instrument fix (m4's applyOverlayDraft threw on a null querySelector target): return a detached stub element
    querySelector(){ return child ? mk('__q', true) : null; }, closest(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; }, getBoundingClientRect(){ return {top:0,left:0,width:0,height:0}; },
    get innerHTML(){ return this._html; }, set innerHTML(h){ this._html = String(h); } }; return el; }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); const e = mk(id); REG.set(id, e); return e; };
  IA.window.document.querySelector = () => null; IA.window.document.createElement = t => mk('__ce_'+t, true); // instrument fix: m4's null onclick was a createElement stub whose querySelector returned null (renderChangeChips :15775)
  IA.window.document.querySelectorAll = () => [];
  IA.ctx.setTimeout = () => 0;
  E('var __T=[], __P=[]; showToast=function(m){__T.push(String(m));}; popFire=function(t,o){__P.push((o&&o.kicker)||t);};');
  return IA.version;
}
const PID = 'p_mario';
function install(o){ o = o||{}; const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); if(o.cardioTypes) cfg.cardioTypes = o.cardioTypes;
  const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  p.id=PID; p.name='HALF MANNY'; p.created=1; p.startDate=o.start||'2026-09-28'; p.seed=cfg.seed; p.cfg=p.cfg||cfg; if(o.cardioTypes) p.cfg.cardioTypes=o.cardioTypes; p.overlays=[];
  LS.clear(); LS.setItem('ia_programs', JSON.stringify([p])); LS.setItem('ia_active', p.id); if(o.logs) LS.setItem('ia_logs_'+PID, JSON.stringify(o.logs));
  IA.ctx.__Pg = p; E('activeProgId="'+PID+'"; activeProg=__Pg; currentWeek='+(o.week||2)+'; __T.length=0; __P.length=0;'); REG.forEach(v=>{ v._html=''; }); CLS.forEach(s=>s.clear()); }
const html = id => (REG.get(id)||{})._html||'';
const isOpen = id => !!(CLS.get(id) && (CLS.get(id).has('open')||CLS.get(id).has('show')));
const toasts = () => JSON.parse(E('JSON.stringify(__T)'));
const txt = h => h.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();
const snap = () => { const o={}; for(const [k,v] of LS._map) if(k.startsWith('ia_')) o[k]=v; return o; };
const diffKeys = (a,b) => { const ks = new Set([...Object.keys(a),...Object.keys(b)]); return [...ks].filter(k=>a[k]!==b[k]); };
const handlersIn = h => { const out = {}; const re = /\son(click|change|input)="([^"]*)"/g; let m; while((m=re.exec(h))){ const f = (/^\s*([A-Za-z_$][\w$.]*)\s*[(=]/.exec(m[2])||[,'?'])[1]; out[f]=(out[f]||0)+1; } return out; };
const sh = (title) => console.log('\n==== '+title);
const say = s => console.log('  '+s);
const logs = () => JSON.parse(LS.getItem('ia_logs_'+PID)||'{}');

console.log('m5 file '+FILE+' ia-version '+boot('2026-10-08T12:00:00'));

// ───────────────────────── A1: overlay inventory from the CSS/HTML text ─────────────────────────
sh('A1 overlays (static, from the file text)');
const ovEls = [...SRC.matchAll(/<div class="([^"]*(?:overlay|modal)[^"]*)" id="([^"]+)"/g)].map(m=>({cls:m[1], id:m[2], line:SRC.slice(0,m.index).split('\n').length}));
ovEls.forEach(o=>say(o.id+' class="'+o.cls+'" :'+o.line));
const cssRules = [...SRC.matchAll(/^[ \t]*(\.(?:overlay|rand-overlay|pop-overlay|rpe-overlay|pop-modal|toast)[^{\n]*)\{([^}]*)\}/gm)].map(m=>({sel:m[1].trim(), body:m[2].replace(/\s+/g,' ').trim(), line:SRC.slice(0,m.index).split('\n').length}));
cssRules.forEach(r=>say(':'+r.line+' '+r.sel+' { '+r.body.slice(0,230)+(r.body.length>230?' …':'')+' }'));
const closed = cssRules.find(r=>r.sel==='.overlay,.rand-overlay' && /visibility 0s linear/.test(r.body));
const vd = closed ? /visibility 0s linear ([\d.]+)s/.exec(closed.body)[1] : null; const td = closed ? /transform ([\d.]+)s/.exec(closed.body)[1] : null;
say('closing .overlay/.rand-overlay: transform '+td+'s, visibility hidden delayed '+vd+'s => hit-testable window '+(vd?Math.round(+vd*1000):'?')+' ms');
const pe = cssRules.filter(r=>/pointer-events/.test(r.body)).map(r=>r.sel);
say('pointer-events rules on any overlay selector: '+(pe.length?pe.join(' | '):'0')+' ; whole-file "pointer-events" count '+(SRC.match(/pointer-events/g)||[]).length);
say('reduced-motion rule present: '+/prefers-reduced-motion[\s\S]{0,200}\.overlay,\.rand-overlay,\.overlay\.open,\.rand-overlay\.open\{transition:none;\}/.test(SRC));

// ───────────────────────── A2: handlers per sheet (driven: rendered HTML) and second calls ─────────────────────────
sh('A2 handlers rendered inside each sheet (driven)');
install();
const wk2 = E('JSON.stringify(Object.fromEntries(Object.entries(activeProg.weeks[2]).map(([d,v])=>[d,{rest:!!v.rest,title:v.title,cardio:v.cardio&&v.cardio.type,sub:v.cardio&&v.cardio.subtype,secs:(v.sections||[]).length}])))');
say('W2 grid '+wk2);
const W2 = JSON.parse(wk2); const liftDay = Object.keys(W2).find(d=>!W2[d].rest&&W2[d].secs>0); const runDay = Object.keys(W2).find(d=>!W2[d].rest&&W2[d].cardio==='run');
say('lift day '+liftDay+' | run day '+runDay);
const inv = {};
function openAndCollect(label, code, bodies){ try{ E(code); }catch(e){ say(label+' OPEN THREW '+e.message); return; } const h = bodies.map(html).join(''); inv[label]=handlersIn(h); say(label+': '+JSON.stringify(inv[label])); }
openAndCollect('detailOverlay ('+liftDay+')', 'currentWeek=2; currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+')', ['detailBody','detailStatusRow','detailTags']);
openAndCollect('detailOverlay ('+runDay+')', 'currentWeek=2; currentDayKey="'+runDay+'"; openDetail("'+runDay+'", activeProg.weeks[2].'+runDay+')', ['detailBody','detailStatusRow','detailTags']);
const firstItem = JSON.parse(E('JSON.stringify((function(){const s=activeProg.weeks[2].'+liftDay+'.sections;for(let i=0;i<s.length;i++)for(let j=0;j<(s[i].items||[]).length;j++)if(s[i].items[j].name)return [i,j];return null;})())'));
E('currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+')');
openAndCollect('swapOverlay', 'openSwapSheet('+firstItem[0]+','+firstItem[1]+')', ['swapBody']);
openAndCollect('addOverlay', 'openAddSheet()', ['addBody']);
openAndCollect('randOverlay', 'openRandom()', ['randBody','randFilterBar']);
openAndCollect('restOverlay menu', 'openRestSheet(2,"wed")', ['restBody']);
openAndCollect('restOverlay move', '_rdSet("view","move"); _rdSet("pick","'+liftDay+'")', ['restBody']);
openAndCollect('restOverlay cardio', 'openRestSheet(2,"wed","cardio")', ['restBody']);
openAndCollect('changeOverlay travel', 'openOverlaySheet()', ['changeBody']);
const injKey = E('Object.keys(INJURY_REGIONS)[0]');
openAndCollect('changeOverlay injury', '_ovDraft.tab="injury"; _ovDraft.injRegion="'+injKey+'"; _ovDraft.injTier="workaround"; renderOverlaySheet()', ['changeBody']);
openAndCollect('goalOverlay', 'openGoalSheet("'+PID+'","run")', ['goalBody']);
openAndCollect('mileOverlay (static html)', '0', []); inv['mileOverlay (static html)'] = handlersIn((/<div class="rand-overlay" id="mileOverlay">[\s\S]*?<div class="rand-overlay" id="mileLockOverlay">/.exec(SRC)||[''])[0]); say('mileOverlay (static html): '+JSON.stringify(inv['mileOverlay (static html)']));
openAndCollect('swapNudgeOverlay', 'showSwapNudge("Back Squat","Front Squat")', ['swapNudgeBody']); inv['swapNudgeOverlay'] = handlersIn((/id="swapNudgeOverlay">[\s\S]*?<\/div>\s*<\/div>/.exec(SRC)||[''])[0]); say('swapNudgeOverlay (static): '+JSON.stringify(inv['swapNudgeOverlay']));

sh('A2 second call of every state-writing / closing handler (driven, same draft, no reopen between calls)');
const RES = [];
function twice(label, sheetId, setup, call, opts){ opts=opts||{};
  install(opts.inst); let r = {label}; try{ E(setup); }catch(e){ r.err='setup threw '+e.message; RES.push(r); say(label+': '+r.err); return; }
  const oc = typeof call==='function' ? call() : call; if(!oc){ r.err='no rendered onclick found'; RES.push(r); say(label+': '+r.err); return; }
  const s0 = snap(), m0 = opts.mem?E(opts.mem):null; E('__T.length=0;__P.length=0;');
  try{ E(oc); }catch(e){ r.err='call 1 threw '+e.message; }
  const s1 = snap(), m1 = opts.mem?E(opts.mem):null, open1 = sheetId?isOpen(sheetId):null, t1 = toasts().slice();
  E('__T.length=0;'); try{ E(oc); }catch(e){ r.err=(r.err?r.err+'; ':'')+'call 2 threw '+e.message; }
  const s2 = snap(), m2 = opts.mem?E(opts.mem):null, t2 = toasts().slice(), p = JSON.parse(E('JSON.stringify(__P)'));
  const d01 = diffKeys(s0,s1), d12 = diffKeys(s1,s2);
  let cls;
  if(opts.cls0) cls = opts.cls0(s0,s1,s2,m0,m1,m2);
  if(cls!==undefined){} else if(!d01.length && m0===m1) cls = 'writes nothing';
  else if(!d12.length && m1===m2) cls = 'idempotent';
  else if(JSON.stringify(s2)===JSON.stringify(s0) && m2===m0) cls = 'toggle (2nd call undoes 1st)';
  else cls = opts.cls ? opts.cls(s0,s1,s2,m0,m1,m2) : 'changes again';
  if(cls===undefined) cls='changes again';
  Object.assign(r, {onclick:oc, closesSheet: sheetId? !open1 : 'n/a', write1:d01, write2:d12, cls, t1, t2, pops:p, m:[m0,m1,m2]});
  RES.push(r);
  say(label+'\n     onclick '+JSON.stringify(oc)+' | closes sheet: '+r.closesSheet+' | call1 wrote '+JSON.stringify(d01)+' | call2 wrote '+JSON.stringify(d12)+' | toasts '+JSON.stringify(t1)+' then '+JSON.stringify(t2)+(p.length?' | pops '+JSON.stringify(p):'')+(opts.mem?' | mem '+JSON.stringify([m0,m1,m2]):'')+(r.err?' | ERR '+r.err:'')+'\n     => '+cls);
  if(opts.show) say('     '+opts.show(s0,s1,s2));
}
const btnIn = (id, re) => () => { const m = re.exec(html(id)); return m && m[1].replace(/&quot;/g,'"'); };
const restRun = k => (JSON.parse(LS.getItem('ia_logs_'+PID)||'{}')['w2_wed']||{});
twice('rest: Log it (applyRestCardio)', 'restOverlay', 'openDayKey("wed"); _rdSet("view","cardio"); _restDraft.dist="3.1"', btnIn('restBody', /onclick="(applyRestCardio\(\))"/),
  {cls:()=> 'sum', show:(a,b,c)=>'w2_wed after 1 '+JSON.stringify((JSON.parse(b['ia_logs_'+PID]||'{}').w2_wed||{}).restLog)+' after 2 '+JSON.stringify((JSON.parse(c['ia_logs_'+PID]||'{}').w2_wed||{}).restLog)});
twice('rest: Move it here (applyRestMove)', 'restOverlay', 'openDayKey("wed"); _rdSet("view","move"); _rdSet("pick","'+liftDay+'")', btnIn('restBody', /onclick="(applyRestMove\(\))"/));
twice('rest: Log cardio instead / menu rows (_rdSet)', 'restOverlay', 'openDayKey("wed")', btnIn('restBody', /onclick="(_rdSet\('view','cardio'\))"/));
twice('detail: Done (handleDayStatus complete)', 'detailOverlay', 'currentWeek=2; currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+')', btnIn('detailStatusRow', /onclick="(handleDayStatus\([^"]*'complete'\))"/), {cls0:(a,b,c)=> (c['ia_comp_'+PID]||'{}')===(a['ia_comp_'+PID]||'{}') ? 'toggle (2nd call deletes the completion; logs/hist kept)' : undefined});
twice('detail: Skip (handleDayStatus skipped)', 'detailOverlay', 'currentWeek=2; currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+')', btnIn('detailStatusRow', /onclick="(handleDayStatus\([^"]*'skipped'\))"/), {cls0:(a,b,c)=> (c['ia_comp_'+PID]||'{}')===(a['ia_comp_'+PID]||'{}') ? 'toggle (2nd call deletes the completion; logs/hist kept)' : undefined});
twice('detail: Mark Done nudge (handleDayStatus complete, logged-unmarked day)', 'detailOverlay', 'currentWeek=2; currentDayKey="'+runDay+'"; (function(){const l={}; l["w2_'+runDay+'"]={run_dist:"3.10",week:2,ts:Date.now()}; localStorage.setItem("ia_logs_'+PID+'",JSON.stringify(l));})(); openDetail("'+runDay+'", activeProg.weeks[2].'+runDay+')', btnIn('detailBody', /class="log-nudge-btn" onclick="([^"]*)"/), {cls0:(a,b,c)=> (c['ia_comp_'+PID]||'{}')===(a['ia_comp_'+PID]||'{}') ? 'toggle (2nd call deletes the completion; logs/hist kept)' : undefined});
twice('swap: candidate row (applySwapChoice)', 'swapOverlay', 'currentWeek=2; currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+'); openSwapSheet('+firstItem[0]+','+firstItem[1]+')', btnIn('swapBody', /onclick="(applySwapChoice\([^"]*\))"/), {mem:'JSON.stringify(activeProg.weeks[2].'+liftDay+'.sections['+firstItem[0]+'].items['+firstItem[1]+'].name)'});
twice('add: candidate row (applyAddChoice)', 'addOverlay', 'currentWeek=2; currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+'); openAddSheet()', btnIn('addBody', /onclick="(applyAddChoice\([^"]*\))"/), {mem:'JSON.stringify((activeProg.weeks[2].'+liftDay+'.sections.filter(s=>s._added)[0]||{items:[]}).items.length)', show:(a,b,c)=>'ia_edits_ after 1 '+(b['ia_edits_'+PID]||'').length+' bytes, after 2 '+(c['ia_edits_'+PID]||'').length+' bytes; '+JSON.stringify(c['ia_edits_'+PID]||'').slice(0,300)});
twice('rand: Complete — Mark Done (completeWildcard)', 'randOverlay', 'openRandom()', btnIn('randBody', /onclick="(completeWildcard\([^"]*\))"/));
twice('rand: Reset (resetWildcardCounter, two-tap confirm by design; one wildcard done)', null, 'saveWildcardDone([{title:"X",ts:1,week:2,dayKey:"thu"}]); openRandom()', 'resetWildcardCounter()', {cls0:(a,b,c)=>'two-tap confirm: call 1 arms, call 2 wipes ia_wild_ ('+(a['ia_wild_'+PID]||'')+' -> '+(c['ia_wild_'+PID]||'')+')'});
twice('change: Apply change travel (applyOverlayDraft)', 'changeOverlay', 'openOverlaySheet(); _ovDraft.from="2026-10-12"; _ovDraft.to="2026-10-18"; _ovDraft.equipment="home_basic"; renderOverlaySheet()', btnIn('changeBody', /onclick="(applyOverlayDraft\(\))"/), {mem:'String((activeProg.overlays||[]).length)', cls0:(a,b,c,m0,m1,m2)=> m2>m1 ? 'duplicate record (overlays '+m0+' -> '+m1+' -> '+m2+')' : undefined});
twice('change: Apply change injury (applyInjuryDraft)', 'changeOverlay', 'openOverlaySheet(); _ovDraft.tab="injury"; _ovDraft.injRegion="'+injKey+'"; _ovDraft.injTier="workaround"; renderOverlaySheet()', btnIn('changeBody', /onclick="(applyInjuryDraft\(\))"/), {mem:'String((activeProg.overlays||[]).length)', cls0:(a,b,c,m0,m1,m2)=> m2>m1 ? 'duplicate record (overlays '+m0+' -> '+m1+' -> '+m2+')' : undefined});
twice('goal: Make the switch (commitGoalChange)', 'goalOverlay', 'openGoalSheet("'+PID+'","run"); (function(){var m=/onclick="selectGoalOpt\\(\'([^\']+)\'\\)"/g, h=document.getElementById("goalBody").innerHTML, x, ids=[]; while((x=m.exec(h))) ids.push(x[1]); var ok=ids.filter(function(i){return !_GOAL_REQ_INPUTS.has(i);}); selectGoalOpt(ok[0]||ids[0]); })()', btnIn('goalBody', /onclick="(commitGoalChange\(\))"/), {mem:'JSON.stringify(activeProg.cfg.cardioGoals.run.id)'});
twice('mile: Update my mile (commitMileChange)', 'mileOverlay', 'openMileSheet("'+PID+'"); document.getElementById("mileSheetMins").value="9"; document.getElementById("mileSheetSecs").value="45"', 'commitMileChange()',
  {cls0:(a,b,c)=>{ const f=x=>JSON.parse(x['ia_programs'])[0].cfg.cardioGoals.run; return (f(b).mileBestMins===f(c).mileBestMins && JSON.stringify(f(b).mileBestSrc)!==JSON.stringify(f(c).mileBestSrc)) ? 'rewrite (same mile; mileBestSrc.from overwritten with the value call 1 wrote)' : undefined; }, show:(a,b,c)=>'mileBestSrc after 1 '+JSON.stringify(JSON.parse(b['ia_programs'])[0].cfg.cardioGoals.run.mileBestSrc)+' | after 2 '+JSON.stringify(JSON.parse(c['ia_programs'])[0].cfg.cardioGoals.run.mileBestSrc)});
twice('nudge (pop-overlay): Make the change (acceptSwapNudge)', 'swapNudgeOverlay', 'currentWeek=2; currentDayKey="'+liftDay+'"; showSwapNudge("Back Squat","Front Squat")', 'acceptSwapNudge()');
twice('nudge (pop-overlay): Leave the plan alone (dismissSwapNudge)', 'swapNudgeOverlay', 'showSwapNudge("Back Squat","Front Squat")', 'dismissSwapNudge()');
const tally = {}; RES.forEach(r=>{ const k = r.err&&!r.cls ? 'FAILED: '+r.err : r.cls; tally[k]=(tally[k]||0)+1; });
say('TALLY over '+RES.length+' driven handlers: '+JSON.stringify(tally));

// ───────────────────────── A3: outside a sheet ─────────────────────────
sh('A3 status foot after the undo tap (driven): the re-rendered foot puts a button back under the finger');
install(); E('currentWeek=2; currentDayKey="'+liftDay+'"; openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+')');
const foot0 = handlersIn(html('detailStatusRow')); E(btnIn('detailStatusRow', /onclick="(handleDayStatus\([^"]*'complete'\))"/)()); E('openDetail("'+liftDay+'", activeProg.weeks[2].'+liftDay+')');
const footDone = txt(html('detailStatusRow')); say('foot before: '+JSON.stringify(foot0)+' | foot on a Done day: "'+footDone+'"');

// ───────────────────────── B1/B2: the cardio view, per type ─────────────────────────
sh('B1 rest sheet cardio view per type (driven; cardioTypes set to all four so every chip renders)');
for(const t of ['run','bike','swim','row','walk']){
  install({cardioTypes:['run','bike','swim','row']}); E('openRestSheet(2,"wed","cardio"); _rdSet("type","'+t+'")');
  const h = html('restBody'); const chips = [...h.matchAll(/class="rd-chip( sel)?" onclick="_rdSet\('type','(\w+)'\)">(\w+)</g)].map(m=>m[3]+(m[1]?'*':''));
  const inputs = [...h.matchAll(/<input[^>]*>/g)].map(m=>{ const a=m[0]; const g=k=>(new RegExp(k+'="([^"]*)"').exec(a)||[,'-'])[1]; return '{ph '+g('placeholder')+' min '+g('min')+' max '+g('max')+' step '+g('step')+' mode '+g('inputmode')+' value "'+g('value')+'" onchange '+g('onchange')+'}'; });
  const lbls = [...h.matchAll(/class="ov-eq-lbl"[^>]*>([^<]*)/g)].map(m=>m[1].trim()); const units=[...h.matchAll(/class="rd-unit">([^<]*)/g)].map(m=>m[1]);
  E('_restDraft.mins=25; _restDraft.dist="3.1"; applyRestCardio()');
  say(t+': chips '+chips.join(',')+' | labels '+JSON.stringify(lbls)+' units '+JSON.stringify(units)+'\n     inputs '+inputs.join(' ')+'\n     typed 25 + 3.1 -> stored restLog '+JSON.stringify((logs().w2_wed||{}).restLog)+' toast '+JSON.stringify(toasts()));
}
sh('B2 RPE chips vs RPE_LABELS (driven)');
install(); E('openRestSheet(2,"wed","cardio")');
const rch = [...html('restBody').matchAll(/class="rd-chip wide( sel)?" onclick="_rdSet\('rpe',(\d+)\)"><b>([^<]*)<\/b> · ([^<]*)<span>([^<]*)</g)].map(m=>({v:+m[2], sel:!!m[1], b:m[3], word:m[4].trim(), desc:m[5]}));
const RL = JSON.parse(E('JSON.stringify(RPE_LABELS)'));
rch.forEach(c=>say('chip '+c.b+' "'+c.word+'" ('+c.desc+')'+(c.sel?' [default selected]':'')+' | RPE_LABELS['+c.v+'] = "'+RL[c.v]+'" | agree '+(c.word===RL[c.v])));
say('RPE_LABELS all: '+JSON.stringify(RL)+' | rpeInfoOverlay bands (static): '+txt((/<div class="rpe-info-scale">[\s\S]*?<\/div>\s*<\/div>/.exec(SRC)||[''])[0]));

// ───────────────────────── B3: wheels ─────────────────────────
sh('B3 wheels (driven where pure)');
for(const d of Object.keys(W2).filter(d=>W2[d].cardio==='run')){ install(); E('currentWeek=2; currentDayKey="'+d+'"; openDetail("'+d+'", activeProg.weeks[2].'+d+')');
  const dh = html('detailBody'); const hid = [...dh.matchAll(/<div class="iaw" data-kind="(\w+)" data-for="(\w+)"( data-plan="[^"]*")?/g)].map(m=>m[1]+'->'+m[2]+(m[3]||''));
  say('run day '+d+' ('+W2[d].sub+', dose.k '+E('(doseFromCardio(activeProg.weeks[2].'+d+'.cardio)||{}).k')+') wheels: '+JSON.stringify(hid)); }
E('closeDetail()'); say('after closeDetail: detailOverlay open '+isOpen('detailOverlay')+' | detailBody still holds hidden inputs: '+(html('detailBody').match(/id="log_run_\w+"/g)||[]).join(','));
say('iaWheelHTML pure call: hms 25 -> hidden value '+(/id="x" value="([^"]*)"/.exec(E('iaWheelHTML("hms","x","25")'))||[])[1]+' | dist 3.1 parse '+E('JSON.stringify(_iawParse("dist","3.1"))')+' | hms 800 parse (ceiling) '+E('JSON.stringify(_iawParse("hms","800"))')+' | dist 120 parse '+E('JSON.stringify(_iawParse("dist","120"))'));
say('DOM order: detailOverlay :'+ovEls.find(o=>o.id==='detailOverlay').line+' before restOverlay :'+ovEls.find(o=>o.id==='restOverlay').line+' (getElementById returns the first id in document order)');
say('swim card field (cardioFieldHTML swim): '+E('cardioFieldHTML("swim",{},null,"")').replace(/\s+/g,' ').slice(0,260));
say('bike card field: '+(/data-kind="(\w+)" data-for="(\w+)"/.exec(E('cardioFieldHTML("bike",{},null,"")'))||[]).slice(1).join('->'));

// ───────────────────────── B4: D226 sum vs max=600 ─────────────────────────
sh('B4 sum past max="600" (driven) and what each reader prints');
install(); E('openRestSheet(2,"wed","cardio"); _restDraft.mins=400; _restDraft.dist="3"; applyRestCardio(); openRestSheet(2,"wed","cardio"); _restDraft.mins=400; _restDraft.dist="3"; applyRestCardio();');
say('400 + 400 -> '+JSON.stringify(logs().w2_wed.restLog)+' toasts '+JSON.stringify(toasts()));
install(); E('openRestSheet(2,"wed","cardio")'); const minsOnchange = (/max="600" value="[^"]*" onchange="([^"]*)"/.exec(html('restBody'))||[])[1]; IA.ctx.__v='900'; E('(function(){'+minsOnchange+'}).call({value:__v})'); E('applyRestCardio()');
say('one typed 900 (the onchange "'+minsOnchange+'" does not clamp; max is an attribute, not a check) -> '+JSON.stringify(logs().w2_wed.restLog)+' toast '+JSON.stringify(toasts()));
say('in-file readers that compare a rest mins to 600 (comments stripped): '+(SRC.split('\n').filter(l=>!/^\s*\/\//.test(l)&&/600/.test(l)&&/(mins|restLog)/.test(l)).length));

// ───────────────────────── readers harness, used by B4/B5/C ─────────────────────────
function readers(clockNote){
  const o = {};
  E('renderWeekView()'); let all=''; REG.forEach(v=>{all+=v._html;});
  const mm = /color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(all); o.MILES = mm?mm[1]:null;
  const cell = /<div class="wk-day[^"]*"[^>]*onclick="openDayKey\('wed'\)"[\s\S]*?<\/div><\/div>/.exec(html('daysList')); o.wedCell = cell?txt(cell[0]):'(no wed cell w/ onclick)';
  const hero = /<div class="wk-hero">[\s\S]*?<div class="wk-tip">/.exec(all); o.hero = hero?txt(hero[0]).slice(0,170):null;
  E('progressViewId=null; renderProgressScreen()'); let ph=''; REG.forEach(v=>{ph+=v._html;}); const pt = txt(ph);
  o.progEmpty = /Start logging your sessions/.test(pt) ? 'empty (hasAnyData false)' : /Log sessions to see progress charts/.test(pt) ? 'empty (no section rendered)' : false; const mi = [...pt.matchAll(/([\d.]+) ?mi\b/g)].map(m=>m[1]); o.progMi = mi.slice(0,4);
  const ses = /(\d+)\s*(?:SESSIONS|Sessions|sessions)/.exec(pt) || /(?:SESSIONS|Sessions)\s*(\d+)/.exec(pt); o.progSessions = ses?ses[1]:null;
  const ji = pt.search(/journal/i); const jt = ji>=0 ? pt.slice(ji) : ''; const wi = jt.indexOf(' Wed '); o.journalWed = wi>=0 ? jt.slice(wi, wi+80) : '(no Wed row)';
  o.journalEmpty = ji<0 ? 'no journal heading' : null;
  o.seedMax0 = E('(function(){try{var s=seedFromPriorPrograms(Date.now()); return JSON.stringify(s&&{maxDist:s.maxDist,baselineDist:s.baselineDist,keys:Object.keys(s)});}catch(e){return "threw "+e.message;}})()');
  o.seedMax = E('(function(){var l=JSON.parse(localStorage.getItem("ia_logs_'+PID+'")||"{}"), h={}, n=0; for(var w=1;w<=6;w++) Object.keys(activeProg.weeks[w]).forEach(function(d){var c=activeProg.weeks[w][d].cardio; if(c&&/Recovery/.test(c.subtype||"")&&!l["w"+w+"_"+d]){ l["w"+w+"_"+d]={run_pace:"11:30",run_dist:"2",week:w,ts:Date.now()-86400000*(3+n)}; h["w"+w+"_"+d]=activeProg.weeks[w][d]; n++; }}); var sL=localStorage.getItem("ia_logs_'+PID+'"), sH=localStorage.getItem("ia_hist_'+PID+'"); localStorage.setItem("ia_logs_'+PID+'",JSON.stringify(l)); localStorage.setItem("ia_hist_'+PID+'",JSON.stringify(h)); var s; try{s=seedFromPriorPrograms(Date.now());}catch(e){s="threw "+e.message;} if(sL==null) localStorage.removeItem("ia_logs_'+PID+'"); else localStorage.setItem("ia_logs_'+PID+'",sL); if(sH==null) localStorage.removeItem("ia_hist_'+PID+'"); else localStorage.setItem("ia_hist_'+PID+'",sH); return "planted "+n+" recovery runs of 2 mi -> "+JSON.stringify(s&&s.maxDist!==undefined?{n:s.n,maxDist:s.maxDist}:s);})()');
  o.ladder = E('JSON.stringify(ladderWeekly(getLogs(), activeProg.totalWeeks))');
  o.moveCands = E('restMoveCandidates(2).map(c=>c.day).join(",")');
  o.restLines = E('JSON.stringify(restLogLines((getLogs()["w2_wed"]||{}).restLog))');
  return o;
}
function frozen(shape){ // plant a marker on the STORED W2 WED and see whether refreshProgram keeps it (frozen) or rebuilds it
  const ps = JSON.parse(LS.getItem('ia_programs')); ps[0].weeks[2].wed.__m5 = 1; LS.setItem('ia_programs', JSON.stringify(ps)); IA.ctx.__Pp = ps[0];
  return E('(function(){var r=refreshProgram(__Pp); return !!(r.weeks[2].wed&&r.weeks[2].wed.__m5);})()');
}
// B4 readers on a summed 800
install({logs:{w2_wed:{restLog:{run:{mins:800,dist:6,rpe:5},bike:{mins:800,rpe:5}},week:2,ts:CLOCK}}}); say('readers with run mins 800 + bike mins 800: '+JSON.stringify(readers()));

// ───────────────────────── B5: move sheet text ─────────────────────────
sh('B5 "Training anyway?" sheet (driven)');
install({logs:{w2_wed:{restLog:{run:{mins:30,dist:3.1,rpe:7}},week:2,ts:CLOCK}}}); E('openRestSheet(2,"wed","move")');
say('with a 30 min jog logged on WED, text: "'+txt(html('restBody'))+'"'); say('mentions the jog (min|logged|jog|mi): '+/\b(\d+ min|jog|3\.1)\b/.test(txt(html('restBody'))));
E('_rdSet("pick","'+liftDay+'")'); say('after a pick: "'+txt(html('restBody')).slice(-220)+'"');
install(); E('openRestSheet(2,"wed")'); say('menu text: "'+txt(html('restBody'))+'"');
install({logs:{w2_wed:{restLog:{run:{mins:30,dist:3.1,rpe:7}},week:2,ts:CLOCK}}}); E('openRestSheet(2,"wed")'); say('menu with a jog logged identical to menu without: '+(txt(html('restBody'))===(()=>{install();E('openRestSheet(2,"wed")');return txt(html('restBody'));})()));
install({logs:{w2_wed:{restLog:{run:{mins:30,dist:3.1,rpe:7}},week:2,ts:CLOCK}}}); E('openRestSheet(2,"wed","cardio")'); say('cardio view with a jog logged: inputs '+JSON.stringify([...html('restBody').matchAll(/placeholder="(\w+)"[^>]*|value="([^"]*)" onchange/g)].map(m=>m[0].slice(0,40)))+' | shows the log: '+/30 min|3\.1|logged/.test(txt(html('restBody'))));

// ───────────────────────── B6: who opens the sheet, hand calendar ─────────────────────────
sh('B6 restDayEligible / openDayKey across a hand calendar (driven; expected from date arithmetic)');
// Hand calendar, start Mon 2026-09-28: W1 WED 09-30, W1 SUN 10-04, W2 WED 10-07, W2 SUN 10-11, W3 WED 10-14, W3 SUN 10-18.
const CAL = {'1wed':'2026-09-30','1sun':'2026-10-04','2wed':'2026-10-07','2sun':'2026-10-11','3wed':'2026-10-14','3sun':'2026-10-18'};
const clocks = [['Thu 10-08 (today W2 THU, a training day)','2026-10-08T12:00:00'],['Wed 10-07 (today W2 WED, a rest day)','2026-10-07T12:00:00']];
let b6n=0, b6agree=0;
for(const [cl, iso] of clocks){ boot(iso); const today = iso.slice(0,10);
  for(const k of Object.keys(CAL)){ const w=+k[0], d=k.slice(1); install({week:w}); E('currentWeek='+w+'; openDayKey("'+d+'")');
    const opened = isOpen('restOverlay'), ts = toasts(); const exp = CAL[k] <= today; b6n++; if(exp===opened) b6agree++;
    const cls = CAL[k]===today?'today':(CAL[k]<today?(w===+(today>='2026-10-05'?2:1)?'past, this week':'past week'):(w===2?'future, this week':'future week'));
    say(cl+' | W'+w+' '+d.toUpperCase()+' '+CAL[k]+' ['+cls+'] -> sheet '+(opened?'OPENS':'no')+' | toast '+JSON.stringify(ts)+' | expected '+(exp?'open':'closed')+(exp===opened?'':' MISMATCH'));
  }
}
say('agree '+b6agree+'/'+b6n);
boot('2026-10-08T12:00:00');
install({start:'2026-10-01'}); E('currentWeek=1; openDayKey("wed")'); say('start Thu 10-01, W1 WED 09-30 (before start) -> open '+isOpen('restOverlay')+' toasts '+JSON.stringify(toasts()));
// the moved-today case: move today's (THU) session onto past WED; THU becomes rest+moved, the hero turns rest
install(); E('openDayKey("wed"); _rdSet("view","move"); _rdSet("pick","thu"); applyRestMove(); __T.length=0; renderWeekView();');
let allh=''; REG.forEach(v=>{allh+=v._html;}); const heroBtns = [...allh.matchAll(/class="wk-rest-act" onclick="([^"]*)">([^<]*)</g)].map(m=>[m[1],m[2]]);
say('after moving THU onto WED: thu = '+E('JSON.stringify({rest:activeProg.weeks[2].thu.rest,moved:activeProg.weeks[2].thu.moved})')+' | hero rest buttons '+JSON.stringify(heroBtns));
heroBtns.forEach(([oc,l])=>{ E('__T.length=0'); CLS.get('restOverlay')&&CLS.get('restOverlay').clear(); E(oc); say('  hero "'+l+'" -> sheet '+(isOpen('restOverlay')?'OPENS':'no')+' toast '+JSON.stringify(toasts())); });
E('__T.length=0; openDayKey("thu")'); say('  strip THU -> sheet '+isOpen('restOverlay')+' toast '+JSON.stringify(toasts()));
say('static: "has not come around yet" sites '+(SRC.match(/has not come around yet/g)||[]).length+'; openRestSheet callers (non-def) '+(SRC.match(/openRestSheet\(/g)||[]).length);

// ───────────────────────── C1: three entry shapes after a clear ─────────────────────────
sh('C1 W2 WED entry shapes through every reader (driven, clock Thu 10-08; hero rows from clock Wed 10-07)');
const SHAPES = {
  'S0 no key': null,
  'S1 logged jog {restLog:{run:{mins:30,dist:3.1,rpe:5}}}': {restLog:{run:{mins:30,dist:3.1,rpe:5}},week:2,ts:T('2026-10-07T18:00:00')},
  'S2 {restLog:{}, week, ts}': {restLog:{},week:2,ts:T('2026-10-07T18:00:00')},
  'S3 {week, ts}': {week:2,ts:T('2026-10-07T18:00:00')},
};
for(const [clabel, iso] of [['clock Thu','2026-10-08T12:00:00'],['clock Wed (WED is today)','2026-10-07T12:00:00']]){ boot(iso);
  for(const [lab, ent] of Object.entries(SHAPES)){ const l = ent?{w2_wed:ent}:{}; install({logs:l}); const r = readers(); install({logs:l}); r.frozenW2Wed = frozen();
    install({logs:l}); E('openRestSheet(2,"wed","cardio")'); r.sheetCardio = /logged|30 min|3\.1/.test(txt(html('restBody'))) ? 'shows a log' : 'blank (value '+(/max="600" value="([^"]*)"/.exec(html('restBody'))||[])[1]+')';
    say(clabel+' | '+lab+'\n     '+JSON.stringify(r)); } }
boot('2026-10-08T12:00:00');
say('static: getLogs/getLogsFor/raw ia_logs_ readers listed in the record; presence reads: Progress hasAnyData = Object.keys(logs).length>0; refreshProgram _touched merges raw ia_logs_ keys');

// ───────────────────────── C2: partial restLog[type] through every m3 SPREAD reader ─────────────────────────
sh('C2 partial jog records through the SPREAD readers (driven)');
const PART = {'T1 {dist:3.1, rpe:7} no mins':{dist:3.1,rpe:7}, 'T2 {mins:25} no rpe':{mins:25}, 'T3 {mins:0, dist:3.1, rpe:7}':{mins:0,dist:3.1,rpe:7}, 'T4 {mins:25, dist:3.1, rpe:7} control':{mins:25,dist:3.1,rpe:7}};
for(const [clabel, iso] of [['clock Thu','2026-10-08T12:00:00'],['clock Wed','2026-10-07T12:00:00']]){ boot(iso);
  for(const [lab, rec] of Object.entries(PART)){ install({logs:{w2_wed:{restLog:{run:rec},week:2,ts:T('2026-10-07T18:00:00')}}}); const r = readers();
    install({logs:{w2_wed:{restLog:{run:rec},week:2,ts:T('2026-10-07T18:00:00')}}}); E('openRestSheet(2,"wed","cardio"); applyRestCardio()'); r.relogDefaults = JSON.stringify(logs().w2_wed.restLog.run);
    say(clabel+' | '+lab+'\n     '+JSON.stringify(r)); } }
// D226 sum onto a partial: a later sheet log onto T1 (no mins) -> what mins/dist/rpe come out
sh('A2b detail-sheet writers that do NOT close the sheet: NOT DRIVEN');
say('toggleSets and stepSet each hit the 3 s vm timeout in this DOM stub (both calls), and skipSuperset ran the process out of heap (two attempts); the stub cannot run them, so A2b is code-read only and these rows are a failed measurement, not a clean result.');
console.log('\nDONE');
