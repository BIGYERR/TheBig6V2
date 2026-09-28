// v212 measure — the race-date "USE THIS PACE INSTEAD" offer on a dated run_pace_goal (Mario, 2026-09-22 21:16/21:17).
// Usage: node tests/measure/v223_safe_pace_offer.js <artifact.html> [todayIso]
// Drives the real wizard functions (updateRaceDateFeedback, applySuggestedPace, renderWizardStep, the
// mile-field oninput string lifted from the rendered HTML, doGenerate) inside the harness VM with the
// clock pinned and an id-keyed DOM stub (so #raceDateFeedback persists between calls).
// ORACLES (independent of the suspect): day counts by Date.UTC arithmetic; the screenshot's own numbers
// (6 / 11 / 4 weeks, 14:15, 9:30); WCAG 2.x relative luminance from the :root hex table read out of CSS text.
const path=require('path'), fs=require('fs');
const ART=path.resolve(process.argv[2]); const TODAY=process.argv[3]||'2026-09-22';
const R=Date; const [ty,tm_,td]=TODAY.split('-').map(Number); let NOW=new R(ty,tm_-1,td,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const H=require(path.resolve(__dirname,'..','harness.js'));
function boot(){
  const IA=H.load(ART); const els=new Map();
  const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk('div'); e.id=id; els.set(id,e);} return els.get(id); };
  IA.els=els; return IA;
}
const strip=h=>String(h||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<button[^>]*>/g,'[BTN:').replace(/<\/button>/g,']').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const dUTC=s=>{const[y,m,d]=s.split('-').map(Number);return R.UTC(y,m-1,d);};
function setup(IA,o){
  IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal")');
  IA.window.__O=o;
  IA.eval(`Object.assign(WD,{primaryPath:'event',cardioTypes:__O.types,experience:__O.exp,ageBracket:__O.age,eventTargeted:true,raceDate:__O.race,liftingFocus:'support_prevention',equipment:'crossfit',restDays:['sun','wed'],unit:'lbs',seed:4242,name:'M'});
    WD.cardioGoals={run:Object.assign({id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',paceUnit:'mi'},__O.run)};`);
  IA.els.clear();
}
function state(IA){
  IA.eval('renderWizardStep()'); // header + fresh DOM (what the athlete sees on arrival / after tap)
  return snap(IA,true);
}
function snap(IA,rerun){
  if(rerun) IA.eval('updateRaceDateFeedback()');
  const body=IA.els.get('wizardBody')?IA.els.get('wizardBody').innerHTML:'';
  const fb=IA.els.get('raceDateFeedback')?IA.els.get('raceDateFeedback').innerHTML:'';
  const hdr=(body.match(/Program length: (\d+) weeks/)||[])[1];
  const rec=(fb.match(/Recommended: at least (\d+) weeks/)||[])[1];
  const wk=(fb.match(/(\d+) weeks isn't enough/)||[])[1];
  const btn=(fb.match(/<button onclick="applySuggestedPace\((\d+),(\d+)\)" style="([^"]*)"/)||[]);
  const bg=(btn[3]||'').match(/background:([^;]+)/), fg=(btn[3]||'').match(/;color:([^;]+)/);
  const cardColor=(fb.match(/^<div style="color:([^;]+)/)||[])[1];
  const g=IA.eval('JSON.stringify(WD.cardioGoals.run)');
  return {hdr:+hdr||null,rec:+rec||null,weeksUntil:+wk||null,offer:btn[1]!=null?btn[1]+':'+String(btn[2]).padStart(2,'0'):null,btnBg:bg&&bg[1],btnFg:fg&&fg[1],cardColor,intact:/stays intact/.test(fb),endsOnTest:/ends on your test/.test(fb),goal:JSON.parse(g),fbText:strip(fb),bodyHTML:body,fbHTML:fb};
}
function build(IA){
  try{IA.eval('doGenerate()');}catch(e){return {err:'doGenerate threw '+e.message};}
  let p; try{p=IA.eval('(function(){var c=JSON.parse(JSON.stringify(WD));var pr=buildProgram(c);_applyWizardStart(pr,c);return pr;})()');}catch(e){return {err:'build threw '+e.message};}
  let pace=[]; for(const w of Object.keys(p.weeks)) for(const d of Object.keys(p.weeks[w])){const c=p.weeks[w][d]&&p.weeks[w][d].cardio; const cs=Array.isArray(c)?c:(c?[c]:[]); for(const x of cs){const s=JSON.stringify(x).match(/\d{1,2}:\d{2}\/mi/g); if(s&&w==='1') pace.push(d+':'+x.subtype+':'+[...new Set(s)].join('|'));}}
  return {totalWeeks:p.totalWeeks,testWeek:IA.eval('WD._testWeek'),digest:H.progDigest(p),w1paces:pace.slice(0,4),finalWeekTypes:Object.keys(p.weeks[p.totalWeeks]||{}).map(d=>{const c=p.weeks[p.totalWeeks][d].cardio;return c?(Array.isArray(c)?c.map(x=>x.subtype).join('+'):c.subtype):null}).filter(Boolean)};
}
const IA=boot();
console.log('artifact',path.basename(ART),'ia-version',IA.version,'today',TODAY,'21:16 local','TZ',Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('oracle daysUntil(2026-10-20)=',(dUTC('2026-10-20')-dUTC(TODAY))/864e5,'-> floor/7 =',Math.floor((dUTC('2026-10-20')-dUTC(TODAY))/864e5/7));

// ---- PART 0: which goal time reproduces 21:16 (hdr 6, rec 6, 4 weeks, offer 14:15, accent card)?
console.log('\n== PART 0  goal-time sweep, 1.5mi, mile 8:00, intermediate 18-35, run only');
const goals=[null];for(let s=540;s<=960;s+=15)goals.push(s);
const rows0=[];
for(const gs of goals){ setup(IA,{types:['run'],exp:'intermediate',age:'18-35',race:'2026-10-20',run:Object.assign({mileBestMins:'8',mileBestSecs:'00'},gs?{targetMins:String(Math.floor(gs/60)),targetSecs:String(gs%60),targetTime:Math.floor(gs/60)+':'+String(gs%60).padStart(2,'0')}:{})});
  const a=state(IA); rows0.push([gs?Math.floor(gs/60)+':'+String(gs%60).padStart(2,'0'):'blank',a.hdr,a.rec,a.weeksUntil,a.offer,a.cardColor].join(' '));
  IA.eval('applySuggestedPace('+(a.offer?a.offer.replace(':',','):'0,0')+')'); const b=snap(IA,false);
  rows0[rows0.length-1]+=' | after tap: hdr '+b.hdr+' rec '+b.rec+' '+b.cardColor+' offer '+b.offer;}
console.log(rows0.join('\n'));

// ---- PART 1: the lattice. goal time x mile x exp x age x cardioTypes x today
console.log('\n== PART 1  lattice');
const L={n:0,offer:0,worse:0,hdrMismatch:0,sameOffer:0,seg:{}};
const bump=(k)=>{L.seg[k]=(L.seg[k]||0)+1;};
const days=['2026-09-16','2026-09-19','2026-09-22','2026-09-23'];
const miles=[null,420,480,540,600,660];
const gset=[null,600,660,720,780,840];
for(const today of days){ const[y,m,d]=today.split('-').map(Number); NOW=new R(y,m-1,d,21,16).getTime();
 for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','36-54','55+']) for(const mb of miles) for(const gs of gset) for(const types of [['run'],['run','bike']]){
  setup(IA,{types,exp,age,race:'2026-10-20',run:Object.assign({},mb?{mileBestMins:String(Math.floor(mb/60)),mileBestSecs:String(mb%60)}:{},gs?{targetMins:String(Math.floor(gs/60)),targetSecs:String(gs%60)}:{})});
  if(types.includes('bike')) IA.eval("WD.cardioGoals.bike={id:'bike_endurance',label:'x'}");
  let a; try{a=state(IA);}catch(e){bump('CRASH '+e.message.slice(0,60));continue;} L.n++;
  if(!a.offer) continue; L.offer++;
  IA.eval('applySuggestedPace('+a.offer.replace(':',',')+')'); const b=snap(IA,false);
  const k=exp+'/'+age+'/mile'+(mb||'none');
  if(b.rec>a.rec){L.worse++;bump('worse:'+exp);bump('worse:mile'+(mb||'none'));}
  if(b.hdr!==b.rec) L.hdrMismatch++;
  if(b.offer===a.offer) L.sameOffer++;
  bump('offer:'+exp); bump('offerMile:'+(mb||'none'));
  const cur=mb||{beginner:690,intermediate:570,advanced:450}[exp]; const offPace=(+a.offer.split(':')[0]*60+ +a.offer.split(':')[1])/1.5;
  if(offPace>cur) {bump('offerSlowerThanCurrentMile:'+exp);}
 }}
NOW=new R(ty,tm_-1,td,21,16).getTime();
console.log('builds (screens)',L.n,'| offer shown',L.offer,'| rec weeks RISE after tap',L.worse+'/'+L.offer,'| header!=callout after tap',L.hdrMismatch+'/'+L.offer,'| offer identical after tap',L.sameOffer+'/'+L.offer);
Object.keys(L.seg).sort().forEach(k=>console.log('  '+k+' '+L.seg[k]));

// ---- PART 2: the reporter's screen, before / tap / after, WD and build
console.log('\n== PART 2  reporter screen (goal 12:00 = 8:00/mi, mile 8:00)');
setup(IA,{types:['run'],exp:'intermediate',age:'18-35',race:'2026-10-20',run:{mileBestMins:'8',mileBestSecs:'00',targetMins:'12',targetSecs:'00',targetTime:'12:00'}});
const s1=state(IA); const wd1=IA.eval('JSON.stringify(WD)'); const b1=build(IA);
setup(IA,{types:['run'],exp:'intermediate',age:'18-35',race:'2026-10-20',run:{mileBestMins:'8',mileBestSecs:'00',targetMins:'12',targetSecs:'00',targetTime:'12:00'}});
state(IA); IA.eval('applySuggestedPace('+s1.offer.replace(':',',')+')'); const s2=snap(IA,false); const wd2=IA.eval('JSON.stringify(WD)');
IA.flushTimers(5); const s2t=snap(IA,false);
const b2=build(IA);
const o1=JSON.parse(wd1),o2=JSON.parse(wd2); const diff=[];
const walk=(x,y,p)=>{const ks=new Set([...Object.keys(x||{}),...Object.keys(y||{})]);for(const k of ks){const a=x&&x[k],b=y&&y[k];if(a&&b&&typeof a==='object'&&typeof b==='object')walk(a,b,p+'.'+k);else if(JSON.stringify(a)!==JSON.stringify(b))diff.push(p+'.'+k+': '+JSON.stringify(a)+' -> '+JSON.stringify(b));}};
walk(o1,o2,'WD');
console.log('S1',JSON.stringify({hdr:s1.hdr,rec:s1.rec,wk:s1.weeksUntil,offer:s1.offer,card:s1.cardColor,btnBg:s1.btnBg,btnFg:s1.btnFg,intact:s1.intact,endsOnTest:s1.endsOnTest}));
console.log('S1 text:',s1.fbText);
console.log('S2',JSON.stringify({hdr:s2.hdr,rec:s2.rec,wk:s2.weeksUntil,offer:s2.offer,card:s2.cardColor,btnBg:s2.btnBg,btnFg:s2.btnFg,intact:s2.intact,endsOnTest:s2.endsOnTest}));
console.log('S2 text:',s2.fbText);
console.log('S2 after 80ms timer flush: rec',s2t.rec,'offer',s2t.offer);
console.log('WD diff across tap:',diff.join(' ; ')||'(none)');
const origKept=JSON.stringify(o2).includes('"12:00"')||/"targetMins":"?12"?[,}]/.test(JSON.stringify(o2));
console.log('original 12:00 still anywhere in WD after tap:',origKept, '| localStorage keys holding "12:00":',[...IA.localStorage._map.entries()].filter(([k,v])=>v.includes('12:00')).map(([k])=>k).join(',')||'none');
console.log('build before tap',JSON.stringify(b1)); console.log('build after tap ',JSON.stringify(b2));

// ---- PART 3: un-click — tap again, re-render, flip race toggle
console.log('\n== PART 3  un-click paths');
IA.eval('applySuggestedPace('+(s2.offer||'0:0').replace(':',',')+')'); const s3=snap(IA,false); console.log('tap again: goal',s3.goal.targetTime,'rec',s3.rec,'offer',s3.offer);
const s3r=state(IA); console.log('renderWizardStep: goal',s3r.goal.targetTime,'rec',s3r.rec);
const undoFns=IA.js.match(/function\s+\w*(undo|revert|restore)\w*Pace\w*\s*\(/gi)||[]; console.log('functions named *undo/revert/restore*Pace*:',undoFns.length, '| writers of targetMins in source:',(IA.js.match(/\.targetMins\s*=/g)||[]).length);
IA.js.split('\n').forEach((l,i)=>{if(/\.targetMins\s*=[^=]/.test(l)) console.log('  js:'+(i+1)+' '+l.trim().slice(0,160));});

// ---- PART 4: re-entering the mile time (the oninput string from the rendered HTML, run verbatim)
console.log('\n== PART 4  mile re-entry');
const body=IA.els.get('wizardBody').innerHTML; const oi=(body.match(/oninput="(WD\.cardioGoals\['run'\]\.mileBestMins=this\.value;[^"]*)"/)||[])[1];
console.log('mile-min oninput:',oi);
const fbBefore=IA.els.get('raceDateFeedback').innerHTML;
for(const v of ['7','10','','8']){ IA.els.get('raceDateFeedback').innerHTML=fbBefore; IA.eval('(function(){var t={value:'+JSON.stringify(v)+'};'+oi.replace(/this\./g,'t.')+'})()'); const s=snap(IA,false);
  const same=IA.els.get('raceDateFeedback').innerHTML===fbBefore; const rc=snap(IA,true).rec;
  console.log(' mile='+JSON.stringify(v)+': callout byte-identical after oninput:',same,'| goal still',s.goal.targetTime,'| hdr',s.hdr,'| rec shown',s.rec,'| rec the date-field recompute would show',rc);}
IA.eval("WD.cardioGoals.run.mileBestMins='8'");
console.log('callers of updateRaceDateFeedback in source:'); IA.js.split('\n').forEach((l,i)=>{if(/updateRaceDateFeedback\(\)/.test(l)&&!/^\s*function/.test(l)) console.log('  js:'+(i+1)+' '+l.trim().slice(0,150));});
const goi=(body.match(/oninput="(WD\.cardioGoals\['run'\]\.targetMins=this\.value;[^"]*)"/)||[])[1]; console.log('goal-min oninput:',goi);

// ---- PART 4b: which single-field edit AFTER the tap, then any updateRaceDateFeedback-only repaint, gives hdr 6 / rec 11 / red?
console.log('\n== PART 4b  post-tap edit -> callout-only repaint, search for the 21:17 screen (hdr 6, rec 11, red, offer 14:15)');
const hits4=[]; let n4=0;
for(const base of [null,'12:00','13:00']) for(const field of ['mileBestMins','mileBestSecs','targetMins','targetSecs']) for(const val of ['','0','1','5','7','8','9','10','11','12','13','14','30','45']){
  setup(IA,{types:['run'],exp:'intermediate',age:'18-35',race:'2026-10-20',run:Object.assign({mileBestMins:'8',mileBestSecs:'00'},base?{targetMins:base.split(':')[0],targetSecs:base.split(':')[1],targetTime:base}:{})});
  const a=state(IA); if(a.hdr!==6||a.rec!==6) continue; IA.eval('applySuggestedPace('+a.offer.replace(':',',')+')');
  IA.eval('WD.cardioGoals.run.'+field+'='+JSON.stringify(val)); n4++;
  const b=snap(IA,true); if(b.hdr===6&&b.rec===11&&b.cardColor==='var(--red)'&&b.offer==='14:15') hits4.push((base||'blank')+' then '+field+'='+JSON.stringify(val)+' -> goal '+b.goal.targetMins+':'+b.goal.targetSecs+' mile '+b.goal.mileBestMins+':'+b.goal.mileBestSecs);}
console.log('sequences',n4,'| reproduce 21:17:',hits4.length); hits4.forEach(h=>console.log('  '+h));

// ---- PART 5: contrast
console.log('\n== PART 5  button colours');
const css=IA.html.match(/:root\{[\s\S]*?\}/)[0]; const v=n=>(css.match(new RegExp('--'+n+':(#[0-9A-Fa-f]{6})'))||[])[1];
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(x=>x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const A=lum(a),B=lum(b);return ((Math.max(A,B)+.05)/(Math.min(A,B)+.05)).toFixed(2);};
console.log('--accent',v('accent'),'--red',v('red'),'--signal',v('signal'),'--on-ink',v('on-ink'));
console.log('S1 btn bg',s1.btnBg,'fg',s1.btnFg,'contrast',cr('#0a0a0a',v('accent')),': 1');
console.log('S2 (post-tap, same screen) btn bg',s2.btnBg,'fg',s2.btnFg,'| red-card button (diff<=-3) #0a0a0a on --red contrast',cr('#0a0a0a',v('red')),': 1');
console.log('paceCeilingOffer btn bg var(--accent) fg var(--on-ink) contrast',cr(v('on-ink'),v('accent')),': 1');

// ---- PART 6: em-dashes on the cardio_goal screen (text only, comments cannot reach rendered HTML)
console.log('\n== PART 6  em-dashes in athlete-visible text of this screen');
setup(IA,{types:['run'],exp:'intermediate',age:'18-35',race:'2026-10-20',run:{mileBestMins:'8',mileBestSecs:'00',targetMins:'12',targetSecs:'00',targetTime:'12:00'}});
const sc=state(IA); const txt=strip(sc.bodyHTML.replace(/<div id="raceDateFeedback"[^>]*><\/div>/,'<div>'+sc.fbHTML+'</div>')); const hits=[];
let re=/—/g,mm; while((mm=re.exec(txt))) hits.push(txt.slice(Math.max(0,mm.index-45),mm.index+35));
console.log('count',hits.length); hits.forEach((h,i)=>console.log(' '+(i+1)+'. …'+h+'…'));
console.log('(for the 4-weeks NSW sentence pre-D106a see "stays intact" in S1 text above)');
