// Post-V238 m3 — Mario's device report: rest sheet "Log cardio" on a NON-today rest day; "went back in, it didn't save
// what I entered, and I can't undo it". Mode A (prove), V238 vs V237. Read-only.
// Usage: node tests/measure/post_v238_restsheet.js <v238.html> <v237.html>
// Gesture driven through the real chain: week-strip cell onclick -> openDayKey -> restDayEligible -> openRestSheet ->
// renderRestSheet markup; menu row onclick (_rdSet view cardio); chip onclick; the inputs' own onchange attribute text run
// with this.value = the typed string; the "Log it" button's onclick. No planted entries.
// Oracle: hand constants typed (3.1 mi, 25 min); calendar by hand (Mon 2026-09-28 start -> Thu 2026-10-08 = W2 THU;
// Mon 2026-10-05 start -> W1 THU). "Kept" = the typed string's number in the stored entry.
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILES = { V238: process.argv[2] || 'index.html', V237: process.argv[3] };
const CLOCK = new Date('2026-10-08T12:00:00').getTime();
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
let IA, E, LS, REG, CLS;
function boot(file){
  IA = H.load(file); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(CLOCK); } static now(){ return CLOCK; } }
  IA.ctx.Date = FD; E = IA.eval; LS = IA.localStorage; REG = new Map(); CLS = new Map();
  function mk(id){ const set = new Set(); CLS.set(id, set); const el = { id, value:'', dataset:{}, style:{}, _kids:[], _html:'', scrollTop:0, textContent:'',
      classList:{ add(c){ set.add(c); }, remove(c){ set.delete(c); }, toggle(c,f){ (f===undefined?!set.has(c):f) ? set.add(c) : set.delete(c); }, contains(c){ return set.has(c); } },
      addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){}, querySelectorAll(){ return []; }, querySelector(){ return null; }, focus(){}, blur(){}, setAttribute(){}, getAttribute(){ return null; },
      get innerHTML(){ return this._html; }, set innerHTML(h){ this._html = String(h); } }; return el; }
  IA.window.document.getElementById = id => { if(REG.has(id)) return REG.get(id); const e = mk(id); REG.set(id, e); return e; };
  IA.ctx.setTimeout = () => 0;   // the toast's auto-hide timer: not run, so the toast text stays readable
  return IA.version;
}
const html = id => (REG.get(id)||{})._html || '';
const text = h => h.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const toast = () => { const t = html('toast'); if(REG.get('toast')) REG.get('toast')._html = ''; return t; };
const sheetOpen = () => CLS.has('restOverlay') && CLS.get('restOverlay').has('open');
function install(start){
  const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  p.id = 'p_mario'; p.name = 'HALF MANNY'; p.created = 1; p.startDate = start; p.seed = cfg.seed; p.cfg = p.cfg || cfg; p.overlays = [];
  LS.clear(); LS.setItem('ia_programs', JSON.stringify([p])); LS.setItem('ia_active', p.id);
  IA.ctx.__P = p; const wk = E('(function(){activeProgId="p_mario"; activeProg=__P; var w=calcCurrentWeek? calcCurrentWeek() : 1; currentWeek=w; return w;})()');
  return { p, wk };
}
function stripCellOnclick(dk){ const h = allHtml(); const m = new RegExp('<div class="wk-day[^"]*"[^>]*onclick="([^"]*)"[^>]*>\\s*<div class="wk-day-lbl">'+dk.toUpperCase()+'<').exec(h)
  || new RegExp('onclick="([^"]*\''+dk+'\'[^"]*)"[^>]*>(?:(?!onclick).)*?wk-day-lbl">'+dk.toUpperCase()+'<').exec(h); return m ? m[1] : null; }
function stripCell(dk){ const h = allHtml(); const i = h.indexOf('wk-day-lbl">'+dk.toUpperCase()+'<'); if(i<0) return null; const s = h.lastIndexOf('<div class="wk-day', i); return h.slice(s, h.indexOf('</div></div>', i)+12); }
function allHtml(){ let h=''; REG.forEach(v => { h += v._html; }); return h; }
function week(){ REG.forEach(v => { v._html=''; }); E('renderWeekView()'); const h = allHtml();
  const mi = /color:var\(--run\)">([\d.]+)<\/div><div class="wk-stat-lbl">MILES/.exec(h); const hero = (h.match(/class="wk-rest-logged">[^<]*/g)||[]).map(x=>x.slice(23));
  const ho = /wk-hero-over">([^<]*)</.exec(h); const ta = /Training anyway\?/.test(h); return { miles: mi?mi[1]:null, heroOver: ho?ho[1]:null, heroRestLines: hero, trainingAnyway: ta }; }
function progress(){ REG.forEach(v => { v._html=''; }); E('progressViewId=null; renderProgressScreen()'); const t = text(allHtml());
  const run = /Weekly Running Mileage.{0,40}?Total logged: ([^·]*)/.exec(t); const j = t.indexOf('Session Journal');
  return { runTotal: run?run[1].trim():'(no mileage card)', journal: j<0?'(no journal)':t.slice(j, j+160), noData: /No data yet/.test(t) }; }
function runOnchange(inputTag, val){ const m = /onchange="([^"]*)"/.exec(inputTag); if(!m) return false; IA.ctx.__v = val; E('(function(){'+m[1].replace(/&quot;/g,'"')+'}).call({value:__v})'); return true; }
function inputs(){ const h = html('restBody'); return (h.match(/<input[^>]*>/g)||[]).map(t => ({ tag:t, ph:(/placeholder="([^"]*)"/.exec(t)||[])[1], value:(/value="([^"]*)"/.exec(t)||[])[1] })); }
function sheetSummary(){ const h = html('restBody'); const t = text(h); const ins = inputs().map(i => i.ph+'='+JSON.stringify(i.value)).join(' ');
  return t.slice(0, 120)+(ins?' | inputs '+ins:'')+(/Log more/.test(t)?' | "Log more"':'')+(/logged/.test(t)?' | has "logged" text':' | no "logged" text'); }
function clickRow(label){ const h = html('restBody'); const re = new RegExp('onclick="([^"]*)"[^>]*>(?:(?!onclick=).)*?'+label); const m = re.exec(h); if(!m) return false; E(m[1].replace(/&#39;/g,"'")); return true; }
const OUT = []; const log = s => { console.log(s); };
for(const [ver, file] of Object.entries(FILES)){
  if(!file) continue; const v = boot(file);
  log('\n######## '+ver+' (ia-version '+v+') clock Thu 2026-10-08 noon ########');
  for(const start of ['2026-09-28','2026-10-05']){
    const { p, wk } = install(start);
    const tKey = "thu";   // hand calendar: 2026-10-08 is a Thursday; the hero line printed below confirms it
    log('\n== start '+start+' | currentWeek '+wk+' | today key '+tKey+' ('+(p.weeks[wk][tKey]&&p.weeks[wk][tKey].title)+') | rest days W'+wk+': '+ORDER.filter(d=>p.weeks[wk][d].rest).join(','));
    // 1. the tap
    const w0 = week(); log('  week view: hero "'+w0.heroOver+'" | "Training anyway?" on screen '+w0.trainingAnyway+' | MILES '+w0.miles);
    for(const dk of ['wed','sun']){ const oc = stripCellOnclick(dk); toast(); E('closeRestSheet()');
      if(oc) E(oc); const t = toast();
      log('  tap '+dk.toUpperCase()+' cell (onclick '+oc+'): restDayEligible '+E('restDayEligible(currentWeek,"'+dk+'")')+' | sheet open '+sheetOpen()+' | toast '+JSON.stringify(t)+(sheetOpen()?' | sheet: '+sheetSummary():'')); }
    // 2. his entry, every variant, fresh store each
    const CASES = [ ['run','a1 distance only (minutes box left at its prefill)', null, '3.1'], ['run','a2 distance only, minutes box cleared', '', '3.1'],
      ['run','b minutes + distance', '25', '3.1'], ['run','c minutes only', '25', null],
      ['walk','a1 walk, distance n/a, minutes prefill', null, null], ['walk','c walk minutes 25', '25', null] ];
    for(const [type, lbl, mins, dist] of CASES){
      install(start); week(); E('closeRestSheet()'); toast(); E(stripCellOnclick('wed'));
      clickRow('Log cardio'); if(type!=='run') E("_rdSet('type','"+type+"')");
      const ins = inputs(); const minIn = ins.find(i => i.ph==='minutes'), distIn = ins.find(i => i.ph==='miles' || i.ph==='yards');
      const pre = 'prefill mins='+JSON.stringify(minIn&&minIn.value)+' dist='+(distIn?JSON.stringify(distIn.value):'(no box)');
      if(mins!=null && minIn) runOnchange(minIn.tag, mins); if(dist!=null && distIn) runOnchange(distIn.tag, dist);
      const draft = E('JSON.stringify(_restDraft)');
      const logBtn = /onclick="(applyRestCardio\(\))">Log it/.exec(html('restBody')); toast(); E(logBtn[1]);
      const t1 = toast(), open1 = sheetOpen(); const raw = LS.getItem('ia_logs_p_mario');
      const wv = week(); const pr = progress();
      // go back in
      E('closeRestSheet()'); week(); const oc2 = stripCellOnclick('wed'); if(!oc2) throw new Error('no WED onclick on re-entry'); E(oc2); const menu = sheetSummary(); clickRow('Log cardio'); const back = sheetSummary();
      const typedDist = dist!=null ? (raw||'').includes(dist) : null;
      log('\n  ['+type+'] '+lbl+' | '+pre+' | typed mins='+JSON.stringify(mins)+' dist='+JSON.stringify(dist)+' | _restDraft at Log '+draft);
      log('    Log it -> toast '+JSON.stringify(t1)+' | sheet still open '+open1+' | stored ia_logs_ '+raw+' | typed distance in store: '+typedDist);
      log('    readers: MILES '+wv.miles+' | WED cell '+text(stripCell('wed')||'')+' (cell html has jog mark: '+/logged|min|mi\b/.test(stripCell('wed')||'')+') | hero rest lines '+JSON.stringify(wv.heroRestLines)+' | Progress run total '+pr.runTotal+' | no-data '+pr.noData+' | journal '+JSON.stringify(pr.journal));
      log('    back in: menu -> '+menu+'\n             Log cardio -> '+back);
    }
    // 3. Sunday: the coming rest day
    // 2d. he goes back in and logs the same thing again (the sheet showed him nothing): distance only, twice
    { install(start); for(let k=0;k<2;k++){ week(); E('closeRestSheet()'); E(stripCellOnclick('wed')); clickRow('Log cardio'); const ins = inputs(); const distIn = ins.find(i => i.ph==='miles'); runOnchange(distIn.tag, '3.1'); toast(); E('applyRestCardio()');
        const t = toast(); const wv = week(); log('  [run] d re-entry #'+(k+1)+' distance only 3.1 -> toast '+JSON.stringify(t)+' | stored '+LS.getItem('ia_logs_p_mario')+' | MILES '+wv.miles); } }
  }
}
// 4. undo / edit: static, comments stripped
for(const [ver, file] of Object.entries(FILES)){ if(!file) continue;
  const src = fs.readFileSync(path.resolve(file),'utf8').split('\n'); const strip = l => l.replace(/(^|[^:'"\\])\/\/.*$/, '$1');
  const pats = { 'delete of a logs entry': /delete\s+logs\[|delete\s+\w+\[\s*k\s*\]/, 'restLog cleared/deleted': /delete\s+[\w.]*restLog|restLog\s*=\s*(\{\}|null|undefined)/, 'rest_* cleared': /delete\s+[\w.]*rest_(cardio|type|mins)|rest_cardio\s*=\s*false/,
    'removeItem ia_logs_': /removeItem\([^)]*ia_logs_/, 'ia_logs_ key list (purge)': /\['ia_logs_'/, 'rest sheet reads stored entry': /_renderRestCardio[\s\S]*/ };
  console.log('\n== static '+ver+' ('+file+')');
  Object.entries(pats).forEach(([k,re]) => { if(k==='rest sheet reads stored entry') return; const h=[]; src.forEach((l,i)=>{ if(re.test(strip(l))) h.push(i+1); }); console.log('  '+k.padEnd(28)+' '+h.length+' '+h.join(',')); });
  // does the sheet (openRestSheet/_renderRestCardio/renderRestSheet) read getLogs at all?
  const body = src.join('\n'); ['openRestSheet','renderRestSheet','_renderRestCardio','_renderRestMove'].forEach(fn => { const i = body.indexOf('function '+fn+'('); const j = body.indexOf('\nfunction ', i+10); const b = body.slice(i, j).split('\n').map(strip).join('\n');
    console.log('  '+fn.padEnd(18)+' reads getLogs '+/getLogs\(/.test(b)+' | resets _restDraft.mins/dist '+/_restDraft\.mins=30;\s*_restDraft\.dist=''/.test(b)); });
}
console.log('\nDONE');
