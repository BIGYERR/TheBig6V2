// gatekeeper PASS A V220: engine identity + render differential + week-view differential. usage: node v220_gatekeeper_fuzz.js <base> <cand> [lattice]
"use strict";
const H=require("/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js");
const [BF,CF,WHICH]=process.argv.slice(2);
const A=H.load(BF), A2=H.load(BF), C=H.load(CF);
console.log("base",A.version,"base2",A2.version,"cand",C.version);
const clone=v=>JSON.parse(JSON.stringify(v));
const J=p=>JSON.stringify(p,(k,v)=>(k==='id'||k==='created')?undefined:v);
const strip=s=>String(s||"").replace(/<svg[\s\S]*?<\/svg>\s*/g,"").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").trim();
const RULE=/^\d+(\s*[–-]\s*\d+)?$/;
const DOM_STUB="__gkmk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};__gkels={};document.getElementById=function(id){if(!__gkels[id])__gkels[id]=__gkmk(id);return __gkels[id];};document.querySelectorAll=function(){return[];};";
[A,A2,C].forEach(X=>X.eval(DOM_STUB));
function setP(X,p,w,d){X.ctx.__P=p; X.eval("activeProg=__P; activeProgId="+JSON.stringify(p.id||'m')+"; currentWeek="+JSON.stringify(w)+"; currentDayKey="+JSON.stringify(d)+";");}
function cards(X,p,w,d,s){X.ctx.__S=clone([s]); const h=X.eval("buildSectionsHTML(__S,0)");
  return {h, c:h.split(/class="exercise-item/).slice(1).map(b=>({nm:strip((b.match(/class="ex-name">([\s\S]*?)<\/span>/)||[])[1]), det:(b.match(/class="ex-detail">([\s\S]*?)<\/div>/)||[null,null])[1]}))};}
function week(X,p,w){X.localStorage.clear(); X.eval("__gkels={}"); setP(X,p,w,null); X.eval("renderWeekView()"); return X.eval("__gkels.daysList?__gkels.daysList.innerHTML:''")||'';}
const T={cfgs:0,crash:0,selfDiff:0,engDiff:0,engEx:[],secs:0,cardRows:0,selfRender:0,renderSecDiff:0,rx:0,unclassified:0,uEx:[],rxByName:{},
  weekViews:0,weekSelf:0,weekDiff:0,weekBanner:0,weekUncl:0,wEx:[],baseBannerSeen:0,candBannerSeen:0,bareNoRx:0};
const BANNER=/<div style="background:var\(--surface\);border:1px solid var\(--border2\);border-left:3px solid var\(--accent\)[^>]*>♻️ <b[^>]*>Recovery spacing:<\/b> [\s\S]*?<\/div>/;
function one(cfg,tag,opts){
  T.cfgs++; let pa,pa2,pc;
  try{pa=A.buildProgram(clone(cfg)); pa2=A2.buildProgram(clone(cfg)); pc=C.buildProgram(clone(cfg));}catch(e){T.crash++; if(T.crash<4)console.log("CRASH",tag,e.message); return;}
  const ja=J(pa), jc=J(pc);
  if(ja!==J(pa2)) T.selfDiff++;
  if(ja!==jc){T.engDiff++; if(T.engEx.length<5)T.engEx.push(tag);}
  if(opts.render){const W=pa.weeks||{};
    for(const w of Object.keys(W)) for(const d of Object.keys(W[w])){const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections))continue;
      const dc=pc.weeks[w][d];
      setP(A,pa,w,d); setP(A2,pa2,w,d); setP(C,pc,w,d);
      day.sections.forEach((s,si)=>{T.secs++; const ra=cards(A,pa,w,d,s), ra2=cards(A2,pa2,w,d,pa2.weeks[w][d].sections[si]), rc=cards(C,pc,w,d,dc.sections[si]);
        if(ra.h!==ra2.h) T.selfRender++;
        const occ={};
        ra.c.forEach((b,k)=>{T.cardRows++; const cc=rc.c[k]; const key=[w,d,strip(s.label),b.nm]; const ok_=JSON.stringify(key); occ[ok_]=(occ[ok_]||0)+1;
          if(!cc||cc.nm!==b.nm){T.unclassified++; if(T.uEx.length<5)T.uEx.push(tag+" "+key.join("|")+" card missing/renamed"); return;}
          const isRounds=s.rounds!=null||/round/i.test(ra.h.slice(0,400));
          if(cc.det===b.det){ if(opts.hm===undefined){} if(isRounds&&RULE.test(strip(b.det))) T.bareNoRx++; return;}
          if(RULE.test(strip(b.det)) && cc.det===b.det+" reps"){T.rx++; if(!(/[^0-9]0*[1-9][0-9]* rounds?\b/i.test(strip(ra.h))||/round/i.test(strip(ra.h)))) T.rxNoRoundText=(T.rxNoRoundText||0)+1; const nk=b.nm; T.rxByName[nk]=(T.rxByName[nk]||0)+1; if(opts.print)console.log("   HM W"+w+" "+d+" ["+strip(s.label)+"] "+b.nm+" #"+occ[ok_]+": "+JSON.stringify(strip(b.det))+" -> "+JSON.stringify(strip(cc.det)));}
          else {T.unclassified++; if(T.uEx.length<5)T.uEx.push(tag+" "+key.join("|")+" "+JSON.stringify(b.det)+" -> "+JSON.stringify(cc.det));}
        });
        if(rc.c.length!==ra.c.length){T.unclassified++; if(T.uEx.length<5)T.uEx.push(tag+" card count "+ra.c.length+"->"+rc.c.length);}
        // whole-section HTML: substitute the classified detail changes into base; must equal cand byte for byte
        if(ra.h!==rc.h){T.renderSecDiff++; let hb=ra.h; ra.c.forEach((b,k)=>{const cc=rc.c[k]; if(cc&&cc.det!==b.det&&b.det!=null) hb=hb.replace('class="ex-detail">'+b.det+'</div>','class="ex-detail">'+cc.det+'</div>');});
          if(hb!==rc.h){T.unclassified++; if(T.uEx.length<5)T.uEx.push(tag+" W"+w+" "+d+" section html differs beyond ex-detail");}}
      });
    }}
  if(opts.weeks){ for(const w of opts.weeks(Object.keys(pa.weeks||{}))){ T.weekViews++;
      let ha,ha2,hc; try{ha=week(A,pa,w); ha2=week(A2,pa2,w); hc=week(C,pc,w);}catch(e){T.weekUncl++; if(T.wEx.length<5)T.wEx.push(tag+" W"+w+" threw "+e.message); continue;}
      if(!ha){T.weekUncl++; if(T.wEx.length<5)T.wEx.push(tag+" W"+w+" empty base render"); continue;}
      if(ha!==ha2) T.weekSelf++;
      if(/Recovery spacing/.test(ha)) T.baseBannerSeen++; if(/Recovery spacing|♻/.test(hc)) T.candBannerSeen++;
      if(ha===hc) continue; T.weekDiff++;
      const hb=ha.replace(BANNER,'');
      if(hb===hc && hb!==ha) T.weekBanner++; else {T.weekUncl++; if(T.wEx.length<5){let i=0; while(hb[i]===hc[i])i++; T.wEx.push(tag+" W"+w+" @"+i+" base:"+JSON.stringify(hb.slice(i-40,i+120))+" cand:"+JSON.stringify(hc.slice(i-40,i+120)));}}
  }}
}
const t0=Date.now();
// 0. HALF_MANNY: full render + every week view, print D176 changes
console.log("== HALF_MANNY digest base",H.progDigest(A.buildProgram(clone(H.fixtures.HALF_MANNY))),"cand",H.progDigest(C.buildProgram(clone(H.fixtures.HALF_MANNY))));
const rx0=T.rx; one(H.fixtures.HALF_MANNY,"HALF_MANNY",{render:true,print:true,weeks:ks=>ks});
console.log("HALF_MANNY D176 changes:",T.rx-rx0,"rounds-block card rows total",T.cardRows);
// 1. P-RECOVBANNER lattice (2,970)
const mb={mileBestMins:"8",mileBestSecs:"15",mileBestSrc:{kind:"entered"}};
const GOALS=[{k:"pace",types:["run"],goals:{run:{id:"run_pace_goal",...mb,targetDist:"1.5",targetMins:"11",targetSecs:"0",paceUnit:"mi"}}},{k:"mile",types:["run"],goals:{run:{id:"run_mile_time",...mb,targetDist:"1",targetMins:"7",targetSecs:"0",paceUnit:"mi"}}},{k:"u10",types:["run"],goals:{run:{id:"run_15_under10",...mb,targetDist:"1.5",targetMins:"9",targetSecs:"59",paceUnit:"mi"}}},{k:"base",types:["run"],goals:{run:{id:"run_base",...mb}}},{k:"5k",types:["run"],goals:{run:{id:"run_5k",...mb}}},{k:"10k",types:["run"],goals:{run:{id:"run_10k",...mb}}},{k:"half",types:["run"],goals:{run:{id:"run_half",...mb,baselineDist:"5",baseline:"5mi"}}},{k:"mara",types:["run"],goals:{run:{id:"run_marathon",...mb,baselineDist:"8",baseline:"8mi"}}},{k:"bike",types:["bike"],goals:{bike:{id:"bike_base"}}},{k:"swim",types:["swim"],goals:{swim:{id:"swim_base"}}},{k:"lift",types:[],goals:{},over:{primaryPath:"body"}}];
const FOCUS=["balanced","strength","support_prevention"],EXP=["beginner","intermediate","advanced"],EQUIP=["home_full","commercial","bodyweight"],RESTS=[["sun","wed"],["sat","sun"],["mon","thu","sun"],["sun"],["wed","sat","sun"]],SEEDS=[24865,76308];
const L1=WHICH!=="2";
if(L1){const c0=T.cfgs; for(const G of GOALS)for(const f of FOCUS)for(const e of EXP)for(const q of EQUIP)for(const rs of RESTS)for(const seed of SEEDS){
  const cfg=Object.assign({name:"M",primaryPath:"event",eventTargeted:false,raceDate:"",cardioTypes:G.types.slice(),cardioGoals:clone(G.goals),liftingFocus:f,experience:e,ageBracket:"18-35",equipment:q,unit:"lbs",restDays:rs.slice(),days:["sun","mon","tue","wed","thu","fri","sat"],bench:185,squat:255,deadlift:315,seed,startDate:"2026-09-21"},G.over||{});
  one(cfg,[G.k,f,e,q,rs.join("/"),seed].join("|"),{render:true,weeks:ks=>[ks[0],ks[ks.length-1]]});}
  console.log("== L1 recovbanner lattice cfgs",T.cfgs-c0,"elapsed",((Date.now()-t0)/1000).toFixed(0)+"s");}
// 2. P-EMOJI lattice (5 tiers x 6 focus x 3 exp x 7 goals x 2 inj x 2 seeds = 2,520; contains 378-config lifting populations)
if(WHICH!=="1"){const c0=T.cfgs; const TIERS=["commercial","home_full","crossfit","home_basic","bodyweight"],FOC=["support_prevention","support_strength","hypertrophy","strength","fatloss","balanced"],EXPS=["beginner","intermediate","advanced"];
 const G2=[{k:"liftonly",id:null},{k:"pace",id:"run_pace_goal"},{k:"half",id:"run_half"},{k:"5k",id:"run_5k"},{k:"10k",id:"run_10k"},{k:"mar",id:"run_marathon"},{k:"base",id:"run_base"}];
 for(const t of TIERS)for(const f of FOC)for(const x of EXPS)for(const g of G2)for(const inj of [null,{region:"knee",tier:"protect"}])for(const sd of [76308,1013]){const isRace=!!g.id&&/half|5k|10k|marathon/.test(g.id);
  const cfg={name:"M",primaryPath:g.id?(isRace?"event":"cardio"):"lift",cardioTypes:g.id?["run"]:[],cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:"10",mileBestSecs:"30",baselineDist:"5",baseline:"5mi",targetDist:"1.5",targetMins:"11",targetSecs:"0"}}:{},eventTargeted:isRace,raceDate:isRace?"2026-12-06":null,liftingFocus:f,experience:x,ageBracket:"18-35",equipment:t,unit:"lbs",restDays:["sun","wed"],days:["sun","mon","tue","wed","thu","fri","sat"],bench:135,squat:155,deadlift:185,seed:sd,startDate:"2026-09-21",...(inj?{injury:inj}:{})};
  one(cfg,[t,f,x,g.k,inj?"knee":"ok",sd].join("|"),{render:true,weeks:ks=>[ks[0]]});}
 console.log("== L2 emoji lattice cfgs",T.cfgs-c0,"elapsed",((Date.now()-t0)/1000).toFixed(0)+"s");}
const {engEx,uEx,wEx,rxByName,...rest}=T; console.log("TOTALS",JSON.stringify(rest)); console.log("rxByName",JSON.stringify(rxByName));
console.log("engEx",JSON.stringify(engEx)); console.log("uEx",JSON.stringify(uEx)); console.log("wEx",JSON.stringify(wEx));
