// v202_d96_gaps_and_render.js — companion to v202_d96_two_live_programs.js.
// (6) home-list render with two live programs, captured through a persistent DOM stub
//     (the default harness getElementById returns a FRESH element per call, so innerHTML
//      written by renderProgList is lost — a zero-length render is a failed measurement,
//      not an empty list).
// (7) the gap list: B's long-run ladder vs A's parked rung; what A tells the athlete about
//     weeks 4-7 on return (reminder, completion counting, blockOpen/behindWeeks copy);
//     any cross-program link field on a program row.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const IA=H.load(path.join(__dirname,'..','..','index.html'));
const L=IA.localStorage;const P=s=>console.log(s);
P('ia-version '+IA.version);

// persistent element registry
IA.eval(`(function(){
  var reg={};
  var mk=document.createElement;
  document.getElementById=function(id){ if(!reg[id]) { reg[id]=mk('div'); reg[id].id=id; } return reg[id]; };
  globalThis.__REG=reg;
})();`);

function mondayOf(d){const x=new Date(d);x.setHours(0,0,0,0);const dow=x.getDay();x.setDate(x.getDate()-(dow===0?6:dow-1));return x;}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const PACE_CFG={name:'PACE BLOCK',primaryPath:'event',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'1.5 Mile Time',mileBestMins:'10',mileBestSecs:'30',baselineDist:'1.5',baseline:'1.5mi'}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:76308};
function mk(cfg,id,start){const p=IA.buildProgram(cfg);p.id=id;p.name=id;p.cfg=JSON.parse(JSON.stringify(cfg));delete p.cfg.startDate;p.startDate=start;return p;}

// A parked at week 8 (startDate 7 weeks back), B starting this Monday.
const aStart=mondayOf(TODAY);aStart.setDate(aStart.getDate()-49);
const A=mk(IA.fixtures.HALF_MANNY,'PROG_A',iso(aStart));
const B=mk(PACE_CFG,'PROG_B',iso(mondayOf(TODAY)));
L.clear();
L.setItem('ia_programs',JSON.stringify([A,B]));
L.setItem('ia_active','PROG_A');
IA.eval('openProgIds=new Set();editProgId=null;confirmProgId=null;confirmTier=0;activeProgId="PROG_A";activeProg=getPrograms()[0];');

// ── [6] HOME LIST ────────────────────────────────────────────────────────────
IA.eval('renderProgList();');
const html=IA.eval('document.getElementById("progList").innerHTML');
P('\n[6] renderProgList innerHTML length='+html.length);
P('    prog-card divs: '+(html.match(/class="prog-card/g)||[]).length);
P('    active-prog marks: '+(html.match(/active-prog/g)||[]).length);
P('    setActive( occurrences: '+(html.match(/setActive\(/g)||[]).length);
P('    openProg( occurrences: '+(html.match(/openProg\(/g)||[]).length);
P('    toggleProgCard( occurrences: '+(html.match(/toggleProgCard\(/g)||[]).length);
P('    Active-checkmark (disabled) buttons: '+(html.match(/Active ✓/g)||[]).length);
// the card header line each program shows
const names=html.match(/class="prog-card-name">[^<]*/g)||[];
P('    card names: '+names.map(s=>s.split('>')[1]).join(' | '));
const metas=html.match(/class="prog-card-meta">[\s\S]*?<\/div>/g)||[];
metas.forEach((m,i)=>P('    meta['+i+']: '+m.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,160)));
// tap arithmetic: is the actions block inside the collapsed area?
P('    actions block rendered outside the collapsible prog-tap wrapper: '+/\/div>\s*$/.test('')+' (see _progActionsHTML @14 in index.html; it is appended after progDetailHTML)');
P('    is "prog-card-actions" present while card is COLLAPSED: '+html.includes('prog-card-actions'));
// CSS: does .prog-card-actions display depend on .open?
const css=IA.html.match(/\.prog-card-actions[^{]*\{[^}]*\}/g)||[];
P('    CSS rules for .prog-card-actions: '+css.length);
css.forEach(c=>P('      '+c.replace(/\s+/g,' ')));
const openCss=(IA.html.match(/\.prog-card\.open[^{]*\{[^}]*\}/g)||[]);
P('    CSS rules for .prog-card.open: '+openCss.length);
openCss.forEach(c=>P('      '+c.replace(/\s+/g,' ').slice(0,160)));

// ── [7a] LONG RUN LADDER: A's parked rung vs B's week 1 ──────────────────────
function satRun(prog,w){
  const d=prog.weeks[w]&&prog.weeks[w].sat;if(!d)return null;
  const c=d.cardio;const arr=Array.isArray(c)?c:(c?[c]:[]);
  return arr.map(x=>[x.subtype||x.type,x.distance!=null?x.distance:'',x.minutes!=null?x.minutes:'',x.label||x.name||''].join('/')).join(' + ')||'(no cardio) '+(d.title||'');
}
P('\n[7a] Saturday cardio, A (half) weeks 1-14:');
for(let w=1;w<=A.totalWeeks;w++)P('     A W'+String(w).padStart(2)+': '+satRun(A,w));
P('     Saturday cardio, B (1.5-mile pace block) weeks 1-'+B.totalWeeks+':');
for(let w=1;w<=B.totalWeeks;w++)P('     B W'+String(w).padStart(2)+': '+satRun(B,w));
// longest run anywhere in B, any day
let bMax=0,bWhere='';
Object.keys(B.weeks).forEach(w=>Object.keys(B.weeks[w]).forEach(d=>{
  const c=B.weeks[w][d].cardio;const arr=Array.isArray(c)?c:(c?[c]:[]);
  arr.forEach(x=>{const v=parseFloat(x.distance);if(!isNaN(v)&&v>bMax){bMax=v;bWhere='W'+w+' '+d+' '+(x.subtype||x.type);}});
}));
let aMax=0,aWhere='';
[4,5,6,7].forEach(w=>Object.keys(A.weeks[w]||{}).forEach(d=>{
  const c=A.weeks[w][d].cardio;const arr=Array.isArray(c)?c:(c?[c]:[]);
  arr.forEach(x=>{const v=parseFloat(x.distance);if(!isNaN(v)&&v>aMax){aMax=v;aWhere='W'+w+' '+d+' '+(x.subtype||x.type);}});
}));
P('     longest single run in B anywhere: '+bMax+' ('+bWhere+')');
P('     longest single run in A weeks 4-7 (the rung Mario would be holding): '+aMax+' ('+aWhere+')');

// ── [7b] WHAT A SAYS ABOUT WEEKS 4-7 ON RETURN ───────────────────────────────
// A is now at week 8; weeks 1-3 trained, 4-7 untouched.
const comp={},logs={};
['mon','tue','thu','fri','sat'].forEach(d=>{for(let w=1;w<=3;w++){comp['w'+w+'_'+d]={status:'complete'};logs['w'+w+'_'+d]={done:1};}});
L.setItem('ia_comp_PROG_A',JSON.stringify(comp));
L.setItem('ia_logs_PROG_A',JSON.stringify(logs));
IA.eval('activeProgId="PROG_A";activeProg=refreshProgram(getPrograms()[0]);currentWeek=calcCurrentWeek();');
P('\n[7b] A on return: currentWeek='+IA.eval('currentWeek')+' blockOpen='+IA.eval('activeProg.blockOpen')+' startDate='+IA.eval('activeProg.startDate'));
const sched=IA.eval('JSON.stringify(scheduledDays(new Date()).filter(x=>!statusOf(x.week,x.d)).map(x=>"w"+x.week+"_"+x.d))');
const pend=JSON.parse(sched);
P('     past scheduled days with NO status (i.e. read as outstanding): '+pend.length);
const byWk={};pend.forEach(k=>{const w=k.split('_')[0];byWk[w]=(byWk[w]||0)+1;});
P('     by week: '+JSON.stringify(byWk));
// reminder: which day does the app nag about?
L.removeItem('ia_remind_last_PROG_A');
let remHtml='';
try{ IA.eval('maybeShowReminder();'); remHtml=IA.eval('JSON.stringify(Object.keys(JSON.parse(localStorage.getItem("ia_reminded_PROG_A")||"{}")))'); }catch(e){remHtml='THREW '+e.message;}
P('     maybeShowReminder marked: '+remHtml);
// does any copy path mention skipped/behind weeks mid-program?
const behind=IA.js.split('\n').map((l,i)=>({l,i:i+1})).filter(o=>/behindWeeks|dayBeforeStart/.test(o.l));
P('     source sites handling "behind you" weeks: '+behind.length);
behind.forEach(o=>P('       @'+o.i+' '+o.l.trim().slice(0,110)));

// ── [7c] ANY CROSS-PROGRAM LINK FIELD ON A ROW? ──────────────────────────────
const row=JSON.parse(L.getItem('ia_programs'))[0];
P('\n[7c] top-level keys on a stored program row: '+Object.keys(row).sort().join(', '));
P('     keys on row.cfg: '+Object.keys(row.cfg).sort().join(', '));
const linkish=Object.keys(row).filter(k=>/parent|link|detour|from|prev|pause|suspend/i.test(k));
P('     link-ish fields present: '+(linkish.length?linkish.join(','):'NONE'));
P('     source mentions of a program-to-program link token: '+(IA.js.match(/parentProgId|detourOf|linkedProgId|resumesProg/g)||[]).length);
P('\nDONE');
