// Queue item (not a build): LSD / long-run pace + "(Zone 2)" before-picture.
// Usage: node tests/measure/queue_lsd_pace.js <artifact.html> <doctrineDir>
// Oracle: PACE_CHART mile->recovery pairs transcribed by hand below (authoring contract table),
// interpolated here, never by asking paceChartLookup. Render strings read off the render functions.
'use strict';
const fs = require('fs'), path = require('path');
const H = require('../harness');
const file = process.argv[2], DOC = process.argv[3];
const IA = H.load(file);
const out = s => console.log(s);
out('artifact ia-version ' + IA.version);

// ---- hand table: mile best (s) -> recovery (s/mi), from the PACE_CHART literal rows
const HAND = [[300,420],[330,455],[360,490],[390,525],[420,560],[450,595],[480,630],[510,660],[540,695],[570,730],[600,765],[630,800],[660,825],[690,845],[720,870]];
const HAND_TEMPO = [365,395,425,460,495,530,565,595,630,660,695,720,755,780,815];
function handRow(mile){ if(mile<=300) return {rec:420,tempo:365}; if(mile>=720) return {rec:870,tempo:815};
  for(let i=0;i<HAND.length-1;i++){ const a=HAND[i],b=HAND[i+1]; if(mile>=a[0]&&mile<=b[0]){ const f=(mile-a[0])/(b[0]-a[0]);
    return {rec:Math.round(a[1]+(b[1]-a[1])*f), tempo:Math.round(HAND_TEMPO[i]+(HAND_TEMPO[i+1]-HAND_TEMPO[i])*f)}; } } }
const clk = s => Math.floor(s/60)+':'+String(Math.round(s)%60).padStart(2,'0');
const secOf = m => (+m[1])*60+(+m[2]);

// ---- lattice
const EXP_DEFAULT = {beginner:690, intermediate:570, advanced:450};
const GOALS = [
  {tag:'NSW pace 1.5mi 12:00', fam:'NSW', id:'run_pace_goal', extra:{targetDist:'1.5',targetMins:'12',targetSecs:'0'}},
  {tag:'NSW pace 1.5mi 10:30', fam:'NSW', id:'run_pace_goal', extra:{targetDist:'1.5',targetMins:'10',targetSecs:'30'}},
  {tag:'NSW pace 1mi 8:00',    fam:'NSW', id:'run_pace_goal', extra:{targetDist:'1',targetMins:'8',targetSecs:'0'}},
  {tag:'NSW run_mile_time',    fam:'NSW', id:'run_mile_time', extra:{targetMins:'8',targetSecs:'0'}},
  {tag:'NSW run_15_under10',   fam:'NSW', id:'run_15_under10', extra:{targetMins:'10',targetSecs:'0'}},
  {tag:'NSW run_base',         fam:'NSW', id:'run_base', extra:{}},
  {tag:'NRC run_5k',  fam:'NRC', id:'run_5k', extra:{}},
  {tag:'NRC run_10k', fam:'NRC', id:'run_10k', extra:{}},
  {tag:'NRC run_half', fam:'NRC', id:'run_half', extra:{}},
  {tag:'NRC run_marathon', fam:'NRC', id:'run_marathon', extra:{}},
];
const EXPS = ['beginner','intermediate','advanced'];
const MILES = [0, 420, 540, 630];
const RESTS = [['sun'],['sun','wed'],['sun','tue','thu'],['sun','tue','thu','sat']];
const EVENTS = [true,false];
const SEEDS = [76308, 1234];
const base = H.fixtures.HALF_MANNY;

const ev = n => { try { return IA.eval(n); } catch(e){ return undefined; } };
const buildCardioHTML = ev('buildCardioHTML'), doseStrip = ev('_doseStripHTML'), heroPrev = ev('buildHeroPreview');
const runClass = ev('_runClass'), lrTier = ev('_longRunTier'), interf = ev('_cardioInterference'), sTime = ev('sessionTimeEst');
out('render fns exported via eval: buildCardioHTML ' + typeof buildCardioHTML + ', _doseStripHTML ' + typeof doseStrip + ', buildHeroPreview ' + typeof heroPrev + ', _runClass ' + typeof runClass);

const seg = {};   // key -> counters
const bump = (k, f) => { const o = seg[k] || (seg[k] = {sess:0, z2:0, pace:0, z2pace:0, hr:0, tgt:0, cap:0, k:{}, oracleEq:0, oracleN:0, fasterThanOwn:0, fasterMax:0, fasterSum:0, rc:{}, tier:{}}); f(o); };
const examples = {}; let builds = 0, crashes = 0, crashMsg = {};
const longPerBuild = {NSW:[0,0], NRC:[0,0]};
for(const g of GOALS) for(const exp of EXPS) for(const mile of MILES) for(const rest of RESTS) for(const evt of EVENTS) for(const seed of SEEDS){
  if(g.fam==='NSW' && evt===true && g.id!=='run_pace_goal') { /* events on NSW only matter for taper; keep one arm */ }
  const run = Object.assign({id:g.id, label:g.tag, baselineDist:'5', baseline:'5mi'}, g.extra);
  if(mile){ run.mileBestMins = String(Math.floor(mile/60)); run.mileBestSecs = String(mile%60); }
  const cfg = Object.assign({}, base, {cardioGoals:{run}, experience:exp, restDays:rest.slice(), seed, eventTargeted:evt});
  if(!evt) delete cfg.raceDate;
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ crashes++; crashMsg[g.tag+': '+String(e.message).slice(0,80)] = 1; continue; }
  builds++;
  const anchor = mile || EXP_DEFAULT[exp];
  const own = handRow(anchor);
  let sawLong = false;
  for(const wk of Object.keys(prog.weeks||{})) for(const d of Object.keys(prog.weeks[wk])){
    const day = prog.weeks[wk][d]; if(!day || day.rest) continue;
    for(const c of [].concat(day.cardio||[])){
      if(!c || c.type!=='run') continue;
      const key = c.dose && c.dose.key;
      const isLsd = c.isNRC ? /^long run/i.test(c.subtype||'') : (key==='long' || key==='easy' || /LSD|Long Slow|Easy Run/i.test(c.subtype||''));
      if(!isLsd) continue;
      const cls = c.isNRC ? 'NRC long run' : (key==='long' ? 'NSW lsd_long' : 'NSW lsd_easy');
      if(/long/.test(cls)) sawLong = true;
      const det = String(c.detail||'');
      const pm = det.match(/(\d+):(\d\d)\/mi/);
      const z2 = /\(zone 2\)|zone 2|\bZ2\b/i.test(det);
      const sub0 = String(c.subtype||'').replace(/ — .*/,'');
      const K = g.tag + ' | ' + cls;
      bump(K, o => {
        o.sess++; if(z2) o.z2++; if(pm) o.pace++; if(z2&&pm) o.z2pace++; if(/max HR/i.test(det)) o.hr++;
        if(c.dose && c.dose.tgt) o.tgt++; if(c.dose && c.dose.cap) o.cap++;
        const dk = c.dose ? c.dose.k : 'none'; o.k[dk]=(o.k[dk]||0)+1;
        const rcv = runClass ? String(runClass(c.subtype)) : '?'; o.rc[rcv]=(o.rc[rcv]||0)+1;
        const t = lrTier ? String(lrTier(c)) : '?'; o.tier[t]=(o.tier[t]||0)+1;
        // oracle: first printed pace vs hand-table recovery at the athlete's own mile anchor
        const pr = det.match(/Recovery Pace:? \(?(\d+):(\d\d)\/mi|Around (\d+):(\d\d)\/mi/);
        if(pr){ const s = pr[1] ? (+pr[1])*60+(+pr[2]) : (+pr[3])*60+(+pr[4]); o.oracleN++;
          if(Math.abs(s-own.rec)<=1) o.oracleEq++; else if(s < own.rec){ o.fasterThanOwn++; o.fasterSum += own.rec-s; o.fasterMax = Math.max(o.fasterMax, own.rec-s); } }
      });
      const exk = K;
      if(!examples[exk] && mile===540 && exp==='intermediate'){
        let strip='', html='';
        try { html = buildCardioHTML(c).replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<br>/g,' / ').replace(/<[^>]+>/g,' | ').replace(/(\s*\|\s*)+/g,' | '); } catch(e){ html='CRASH '+e.message; }
        try { strip = c.dose ? doseStrip('run', c.dose, c.subtype).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() : '(no dose)'; } catch(e){ strip='CRASH '+e.message; }
        let hero=''; try { hero = JSON.stringify(heroPrev(day)).replace(/<[^>]+>/g,'').slice(0,220); } catch(e){ hero='CRASH '+e.message; }
        examples[exk] = {wk, d, sub:c.subtype, html: html.slice(0,520), strip, hero, dose: JSON.stringify(c.dose)};
      }
    }
  }
  longPerBuild[g.fam][1]++; if(sawLong) longPerBuild[g.fam][0]++;
}
out('\n== LATTICE: ' + builds + ' builds (' + GOALS.length + ' goals x ' + EXPS.length + ' exp x ' + MILES.length + ' mile anchors {none,7:00,9:00,10:30} x ' + RESTS.length + ' rest patterns x 2 event x 2 seeds), crashes ' + crashes);
Object.keys(crashMsg).forEach(m => out('  CRASH ' + m));
out('builds with >=1 long run: NSW ' + longPerBuild.NSW.join('/') + ', NRC ' + longPerBuild.NRC.join('/'));
out('\n== Q3 per goal x class: sessions | (Zone 2) | pace printed | Z2+pace | "max HR" | dose.tgt | dose.cap | dose.k | _runClass | _longRunTier | oracle(own-row recovery) eq/N | faster-than-own n, mean s, max s');
const tot = {NSW:{s:0,z2p:0,p:0}, NRC:{s:0,z2p:0,p:0}};
for(const K of Object.keys(seg).sort()){ const o = seg[K]; const fam = K.slice(0,3);
  tot[fam].s += o.sess; tot[fam].z2p += o.z2pace; tot[fam].p += o.pace;
  out(K + ' :: ' + o.sess + ' | ' + o.z2 + ' | ' + o.pace + ' | ' + o.z2pace + ' | ' + o.hr + ' | ' + o.tgt + ' | ' + o.cap + ' | ' + JSON.stringify(o.k) + ' | ' + JSON.stringify(o.rc) + ' | ' + JSON.stringify(o.tier) + ' | ' + o.oracleEq + '/' + o.oracleN + ' | ' + (o.oracleN - o.oracleEq - o.fasterThanOwn) + ' slower; faster ' + o.fasterThanOwn + ', ' + (o.fasterThanOwn? (o.fasterSum/o.fasterThanOwn).toFixed(1):'-') + ', ' + o.fasterMax); }
out('TOTAL NSW LSD/easy/long sessions ' + tot.NSW.s + ': pace printed ' + tot.NSW.p + ', pace+(Zone 2) ' + tot.NSW.z2p);
out('TOTAL NRC long-run sessions ' + tot.NRC.s + ': pace printed ' + tot.NRC.p + ', pace+(Zone 2) ' + tot.NRC.z2p);

out('\n== Q1 rendered examples (intermediate, mile 9:00), buildCardioHTML / _doseStripHTML / buildHeroPreview');
for(const K of Object.keys(examples).sort()){ const e = examples[K]; out('-- ' + K + ' W' + e.wk + ' ' + e.d + ' subtype=' + e.sub); out('   card : ' + e.html); out('   strip: ' + e.strip); out('   hero : ' + e.hero); out('   dose : ' + e.dose); }

// ---- Mario's fixture
out('\n== HALF_MANNY (harness fixture, comment says "Mario\'s live program")');
const pm = IA.buildProgram(H.fixtures.HALF_MANNY); const pm2 = IA.buildProgram(H.fixtures.HALF_MANNY);
out('self-stable ' + (H.progDigest(pm)===H.progDigest(pm2)) + ' digest ' + H.progDigest(pm) + ' weeks ' + Object.keys(pm.weeks).length);
let mc = {long:0, z2:0, pace:0}; const mlines=[];
for(const wk of Object.keys(pm.weeks)) for(const d of Object.keys(pm.weeks[wk])){ const day=pm.weeks[wk][d]; if(!day||day.rest) continue;
  for(const c of [].concat(day.cardio||[])){ if(!c||c.type!=='run'||!/^long run/i.test(c.subtype||'')) continue; mc.long++;
    if(/zone 2/i.test(c.detail||'')) mc.z2++; if(/\d:\d\d\/mi/.test(c.detail||'')) mc.pace++; mlines.push('W'+wk+' '+d+' '+c.subtype+' :: '+String(c.detail).slice(0,170)); } }
out('long runs ' + mc.long + ', with pace ' + mc.pace + ', with zone 2 ' + mc.z2); mlines.forEach(l => out('  ' + l));

// ---- Q2 / Q6 static scans (comment-stripped code)
const code = IA.js.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l => l.replace(/(^|[^:'"\\])\/\/.*$/,'$1'));
const raw = IA.html.split('\n'); const jsL = IA.js.split('\n'); const rawIdx = i => { const k = raw.indexOf(jsL[i]); return k >= 0 ? k + 1 : '?' + (i + 1); };
function enclosing(i){ for(let j=i;j>=0;j--){ const m = code[j].match(/^\s*function\s+([\w$]+)\s*\(/); if(m) return m[1]; } return '?'; }
function scan(label, re){ const hits=[]; code.forEach((l,i)=>{ if(re.test(l)) hits.push(rawIdx(i)+':'+enclosing(i)); }); out(label + ' — ' + hits.length + ' code lines: ' + hits.join(', ')); }
out('\n== static scans (comments stripped; line = index.html line)');
scan('"(Zone 2)" with pace token', /Recovery Pace: ' \+ recPace \+ ' \(Zone 2\)/);
scan('"Zone 2" anywhere in code', /zone 2/i);
scan('max HR / heart rate token in code', /max HR|heart ?rate|maxHR|\bbpm\b|hrMax/i);
scan('cfg/wizard HR input field', /cfg\.(hr|maxHr|restingHr|age)\b|id=["']?w?_?(hr|maxhr|heartrate)/i);
scan('reads dose.tgt', /dose\.tgt|d\.tgt|\.dose && c\.dose\.tgt|dose&&c\.dose\.tgt/);
scan('reads dose.cap / steadyCapSec', /dose\.cap|d\.cap|steadyCapSec\(/);
scan('reads chartRow/_row .recovery', /(_row|chartRow|_chartRow|row)\.recovery/);
scan('parses a pace out of detail text', /\\d\+\):\(\\d\\d\)\\s\*\\\/\\s\*mi|\(\\d\+\):\(\\d\{2\}\)\\\/mi|\\d:\\d\\d\\\/mi/);
scan('_runClass callers', /_runClass\(/);
scan('_longRunTier callers', /_longRunTier\(/);
scan('buildCardioHTML callers', /buildCardioHTML\(/);
scan('runSessionCode callers', /runSessionCode\(/);
scan('journal-ish render functions touching cardio.detail', /function\s+\w*(journal|Journal|hist|Hist)\w*\s*\(/);

// ---- tests readers
const TD = path.join(path.dirname(require.resolve('../harness')));
const tfiles = []; (function walk(d){ for(const f of fs.readdirSync(d)){ const p=path.join(d,f); const st=fs.statSync(p); if(st.isDirectory()){ if(!/measure|edits|node_modules/.test(f)) walk(p); } else if(/\.(js|json|py|sh)$/.test(f)) tfiles.push(p); } })(TD);
const tre = [['Zone 2', /Zone 2/], ['Recovery Pace', /Recovery Pace/], ['steadyCapSec|dose.cap', /steadyCapSec|dose\.cap|\.cap\b/], ['dose.tgt', /\.tgt\b/], ['Long Slow Distance|LSD', /Long Slow Distance|\bLSD\b/], ['max HR', /max HR/], ['PACE_CHART|recovery col', /PACE_CHART|\.recovery\b/]];
out('\n== Q6 tests/ (gates, sabotage, harness; measure/ and edits/ excluded) files mentioning each token');
for(const [n,re] of tre){ const hit = tfiles.filter(p => re.test(fs.readFileSync(p,'utf8'))).map(p => path.relative(TD,p)); out(n + ' — ' + hit.length + ' files: ' + hit.join(', ')); }

// ---- Q5 doctrine
out('\n== Q5 doctrine (file:line [page] first 110 chars)');
if(!DOC || !fs.existsSync(DOC)) out('doctrine dir MISSING');
else for(const f of fs.readdirSync(DOC).filter(f => /\.txt$/.test(f))){
  const L = fs.readFileSync(path.join(DOC,f),'utf8').split('\n'); let page='?'; const hits=[];
  L.forEach((l,i)=>{ const pm = l.match(/===== PAGE (\d+) =====/) || l.match(/Physical Training Guide Page (\d+)/); if(pm) page = pm[1];
    if(/zone ?2|max HR|heart rate|% ?of max|conversational|Long Slow Distance \(LSD\) work|LSD workouts, focus|RECOVERY PACE \(|average your Recovery|should be run as Progression|LONG RUNS$|LONG RUNS\s*$|pace should feel|talk test/i.test(l)) hits.push(f+':'+(i+1)+' [p'+page+'] '+l.trim().slice(0,110)); });
  out(f + ' — ' + hits.length + ' hits'); hits.slice(0,12).forEach(h => out('  ' + h));
}
out('\nDONE');

// Nike pace chart presence: does the plan print numeric paces per mile-best row?
if(DOC && fs.existsSync(DOC)) for(const f of fs.readdirSync(DOC).filter(f => /^nikerunclub/.test(f))){
  const L = fs.readFileSync(path.join(DOC,f),'utf8').split('\n'); let page='?', n=0, pages={};
  L.forEach(l => { const pm = l.match(/===== PAGE (\d+) =====/); if(pm) page = pm[1]; if(/\d{1,2}:\d\d.*\d{1,2}:\d\d.*\d{1,2}:\d\d.*\d{1,2}:\d\d/.test(l)){ n++; pages[page]=1; } });
  out('Nike lines with >=4 m:ss values ' + f + ': ' + n + ' on pages ' + Object.keys(pages).join(','));
}
