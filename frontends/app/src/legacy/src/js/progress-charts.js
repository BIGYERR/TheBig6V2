import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { PACE_CHART } from './cardio-progression.js';
import { weeklyBest } from './log-entries.js';
import {
  EASY_MIN_RUNS, EASY_RPE_HI, EASY_RPE_LO, RUN_CLASS_COLOR, RUN_CLASS_ORDER, _fmtPaceShort, _halfFromMileSec,
  _mileFromRecoverySec, _paceStrToSec, _runClass,
} from './progress-data.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// ── V165 chart builders ─────────────────────────────────────────────────────
// D2 (ruled): static SVG, no interaction layer. D5: bars where composition or a
// zero line carries the meaning, dot-and-dash where the existing grammar holds.
function _iaCard(title, color, inner, footer){
  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">'
    + '<div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;'
    + 'text-transform:uppercase;color:'+(color||'var(--accent)')+';margin-bottom:12px">'+title+'</div>'
    + inner
    + (footer?'<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">'+footer+'</div>':'')
    + '</div>';
}
function _axTx(x,y,s,size,anchor,fill,weight){
  return '<text x="'+(+x).toFixed(1)+'" y="'+(+y).toFixed(1)+'" fill="'+(fill||'rgba(24,23,18,0.3)')
    +'" font-size="'+(size||8)+'" text-anchor="'+(anchor||'end')+'" font-family="Helvetica Neue,Helvetica,Geist,sans-serif"'
    +(weight?' font-weight="'+weight+'"':'')+'>'+s+'</text>';
}

// 1 — LONG RUN LADDER
function buildLadderChart(wk, totalWeeks, raceMi, cut, skip1){
  const vals=Object.keys(wk).map(Number);
  if(vals.length<2) return '';
  const best=Math.max.apply(null, vals.map(w=>wk[w]));
  const mx=Math.max(best, raceMi||0)*1.12 || 1;
  const W=320,H=152,padL=26,padR=10,padT=20,padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const slot=plotW/totalWeeks, barW=slot*0.6;
  let s='';
  const step=mx>20?10:5;
  for(let yv=0; yv<=mx; yv+=step){
    const cy=padT+plotH-(yv/mx)*plotH;
    s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
    s+=_axTx(padL-5, cy+3, yv);
  }
  if(raceMi>0&&raceMi<=mx){
    const hy=padT+plotH-(raceMi/mx)*plotH;
    s+='<line x1="'+padL+'" y1="'+hy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+hy.toFixed(1)+'" stroke="var(--signal)" stroke-width="1.2" stroke-dasharray="4,3"/>';
    s+=_axTx(W-padR, hy-5, 'RACE — '+raceMi+' mi', 8, 'end', 'var(--signal)', '700');
  }
  for(let i=0;i<totalWeeks;i++){
    const w=i+1, x=padL+i*slot+(slot-barW)/2, v=wk[w];
    if(!(v>0)){
      s+='<rect x="'+x.toFixed(1)+'" y="'+(padT+plotH-8).toFixed(1)+'" width="'+barW.toFixed(1)+'" height="8" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,2"/>';
      continue;
    }
    const h=(v/mx)*plotH;
    s+='<rect x="'+x.toFixed(1)+'" y="'+(padT+plotH-h).toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+h.toFixed(1)+'" fill="var(--run)" opacity="'+(v===best?0.95:0.62)+'"/>';
  }
  const lblStep=Math.ceil(totalWeeks/7);
  for(let i=0;i<totalWeeks;i++) if(i%lblStep===0) s+=_axTx(padL+i*slot+slot/2, H-8, 'W'+(i+1), 8, 'middle');
  const bestW=vals.filter(w=>wk[w]===best)[0];
  let foot='Furthest so far <b style="color:var(--run)">'+best.toFixed(1)+' mi</b> in W'+bestW;
  if(raceMi>0) foot += (best>=raceMi)
    ? ' — you have already covered race distance.'
    : ' — <b style="color:var(--text)">'+(raceMi-best).toFixed(1)+' mi</b> from race distance.';
  if(cut) foot+=' Week '+cut+' is still in progress and is not counted yet.';
  if(skip1) foot+=' Week 1 was a short first week and is not counted here or in the mileage above.';   // V174 D26
  return _iaCard(asyIcon('🏃',15)+' Long Run Ladder','var(--run)',
    '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>', foot);
}

// 2 — IS YOUR EASY ACTUALLY EASY?
function buildClassBandsChart(byClass){
  const active=RUN_CLASS_ORDER.filter(c=>(byClass[c]||[]).length>0);
  if(active.length<2) return '';
  let all=[]; active.forEach(c=>{ all=all.concat(byClass[c].map(r=>r.sec)); });
  if(all.length<4) return '';
  let lo=Math.min.apply(null,all), hi=Math.max.apply(null,all);
  const pad=Math.max(20,(hi-lo)*0.12); lo-=pad; hi+=pad;
  const W=320,H=178,padL=40,padR=10,padT=12,padB=40;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const colW=plotW/active.length;
  const yof=p=>padT+((p-lo)/(hi-lo))*plotH;      // slower = lower
  let s='';
  const tickStep=(hi-lo)>420?120:60;
  const first=Math.ceil(lo/tickStep)*tickStep;
  for(let pv=first; pv<=hi; pv+=tickStep){
    const cy=yof(pv);
    s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
    s+=_axTx(padL-5, cy+3, _fmtPaceShort(pv));
  }
  active.forEach((c,ci)=>{
    const cx=padL+ci*colW+colW/2, pts=byClass[c].map(r=>r.sec), col=RUN_CLASS_COLOR[c]||'var(--accent)';
    s+='<line x1="'+cx.toFixed(1)+'" y1="'+yof(Math.min.apply(null,pts)).toFixed(1)+'" x2="'+cx.toFixed(1)+'" y2="'+yof(Math.max.apply(null,pts)).toFixed(1)+'" stroke="'+col+'" stroke-width="1" opacity="0.28"/>';
    pts.forEach((p,k)=>{
      const jx=cx+((k%5)-2)*4.2;
      s+='<circle cx="'+jx.toFixed(1)+'" cy="'+yof(p).toFixed(1)+'" r="2.6" fill="'+col+'" opacity="0.72"/>';
    });
    s+=_axTx(cx, H-padB+16, c, 8, 'middle', col, '700');
    s+=_axTx(cx, H-padB+26, pts.length+(pts.length===1?' run':' runs'), 7, 'middle');
  });
  let foot='Each dot is one logged run, placed by pace and grouped by the intensity the plan asked for.';
  const easy=(byClass.Easy||[]).concat(byClass.Recovery||[]).map(r=>r.sec);
  const hard=(byClass.Tempo||[]).concat(byClass.Interval||[]).map(r=>r.sec);
  if(easy.length&&hard.length){
    const gap=Math.min.apply(null,easy)-Math.max.apply(null,hard);
    foot += (gap>0)
      ? ' Your easy and hard work sit <b style="color:var(--text)">'+_fmtPaceShort(gap)+'/mi</b> apart — clean separation.'
      : ' <b style="color:var(--red)">Your easy and hard bands overlap.</b> Easy days are being run too hard, hard days too soft — the most common and most correctable error in endurance training.';
  }
  return _iaCard(asyIcon('🏃',15)+' Is Your Easy Actually Easy?','var(--accent)',
    '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>', foot);
}

// 3 — SAME EFFORT, MORE SPEED  (coverage-gated)
function buildEasyEffortChart(ee, totalWeeks){
  const ws=Object.keys(ee.weekly).map(Number).sort((a,b)=>a-b);
  if(ws.length<2) return '';
  const vals=ws.map(w=>ee.weekly[w]);
  let lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
  const pad=Math.max(12,(hi-lo)*0.25); lo-=pad; hi+=pad;
  const W=320,H=136,padL=40,padR=12,padT=18,padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const xs=plotW/Math.max(1,totalWeeks-1);
  const yof=p=>padT+((p-lo)/(hi-lo))*plotH;
  let s='';
  const tickStep=(hi-lo)>240?60:30;
  const first=Math.ceil(lo/tickStep)*tickStep;
  for(let pv=first; pv<=hi; pv+=tickStep){
    const cy=yof(pv);
    s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
    s+=_axTx(padL-5, cy+3, _fmtPaceShort(pv));
  }
  s+=_axTx(padL, padT-6, '↑ faster', 7, 'start');
  let path='', prev=null;
  ws.forEach(w=>{
    const x=padL+(w-1)*xs, y=yof(ee.weekly[w]);
    if(prev) path+=' M'+prev[0].toFixed(1)+','+prev[1].toFixed(1)+' L'+x.toFixed(1)+','+y.toFixed(1);
    prev=[x,y];
  });
  s+='<path d="'+path+'" stroke="var(--run)" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.6"/>';
  ws.forEach(w=>{
    const x=padL+(w-1)*xs, y=yof(ee.weekly[w]);
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" fill="var(--run)" opacity="0.9"/>';
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="7" fill="var(--run)" opacity="0.15"/>';
  });
  const lblStep=Math.ceil(totalWeeks/7);
  for(let i=0;i<totalWeeks;i++) if(i%lblStep===0) s+=_axTx(padL+i*xs, H-8, 'W'+(i+1), 8, 'middle');
  const d=ee.weekly[ws[0]]-ee.weekly[ws[ws.length-1]];
  let foot='Easy and recovery runs at RPE '+EASY_RPE_LO+'–'+EASY_RPE_HI+' only, so effort is held and pace is the one free variable. ';
  foot += (d>0)
    ? 'Pace fell <b style="color:var(--run)">'+Math.round(d)+' sec/mi</b> at the same effort — that is aerobic fitness.'
    : 'Pace has not moved yet at this effort. Aerobic change is slow; keep the easy days easy.';
  return _iaCard(asyIcon('🏃',15)+' Same Effort, More Speed','var(--run)',
    '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>', foot);
}
function buildEasyEffortEmpty(ee){
  const need=EASY_MIN_RUNS-ee.nRuns;
  return _iaCard(asyIcon('🏃',15)+' Same Effort, More Speed','var(--muted)',
    '<div style="font-size:12px;color:var(--muted);line-height:1.6">This chart holds effort constant so pace is the only thing that can move — it needs '
    +'<b style="color:var(--text)">'+EASY_MIN_RUNS+'</b> easy or recovery runs logged with an RPE of '+EASY_RPE_LO+'–'+EASY_RPE_HI+'. '
    +'You have <b style="color:var(--text)">'+ee.nRuns+'</b>'+(need>0?', so '+need+' to go':'')+'. Adding the RPE slider on easy days is all it takes.</div>');
}

// 4 — WHERE THIS IS HEADING  (D8: forward claim, intake number plotted alongside)
function buildProjectionCard(ee, totalWeeks, intakeMileSec){
  const ws=Object.keys(ee.weekly).map(Number).sort((a,b)=>a-b);
  if(ws.length<2) return '';
  const proj={}; let any=false;
  ws.forEach(w=>{
    const mile=_mileFromRecoverySec(ee.weekly[w]);
    const half=mile?_halfFromMileSec(mile):null;
    if(half){ proj[w]=half; any=true; }
  });
  if(!any) return '';
  const pws=Object.keys(proj).map(Number).sort((a,b)=>a-b);
  if(pws.length<2) return '';
  const claimed=(intakeMileSec>0)?_halfFromMileSec(intakeMileSec):null;
  let vals=pws.map(w=>proj[w]); if(claimed) vals=vals.concat([claimed]);
  let lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
  const pad=Math.max(180,(hi-lo)*0.25); lo-=pad; hi+=pad;
  const W=320,H=146,padL=46,padR=12,padT=16,padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const xs=plotW/Math.max(1,totalWeeks-1);
  const yof=v=>padT+((v-lo)/(hi-lo))*plotH;
  let s='';
  for(let tv=Math.ceil(lo/600)*600; tv<=hi; tv+=600){
    const cy=yof(tv);
    s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
    s+=_axTx(padL-5, cy+3, Math.floor(tv/3600)+':'+String(Math.floor((tv%3600)/60)).padStart(2,'0'));
  }
  if(claimed){
    const cy=yof(claimed);
    s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="var(--text)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.55"/>';
    s+=_axTx(W-padR, cy-5, 'your '+_fmtPaceShort(intakeMileSec)+' mile', 8, 'end', 'var(--muted)', '700');
  }
  let up='', dn='';
  pws.forEach(w=>{ up+=(padL+(w-1)*xs).toFixed(1)+','+yof(proj[w]*0.975).toFixed(1)+' '; });
  for(let i=pws.length-1;i>=0;i--){ const w=pws[i]; dn+=(padL+(w-1)*xs).toFixed(1)+','+yof(proj[w]*1.025).toFixed(1)+' '; }
  s+='<polygon points="'+up+dn+'" fill="var(--hip)" opacity="0.13"/>';
  let path='', prev=null;
  pws.forEach(w=>{
    const x=padL+(w-1)*xs, y=yof(proj[w]);
    if(prev) path+=' M'+prev[0].toFixed(1)+','+prev[1].toFixed(1)+' L'+x.toFixed(1)+','+y.toFixed(1);
    prev=[x,y];
  });
  s+='<path d="'+path+'" stroke="var(--hip)" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.7"/>';
  pws.forEach(w=>{ s+='<circle cx="'+(padL+(w-1)*xs).toFixed(1)+'" cy="'+yof(proj[w]).toFixed(1)+'" r="3.2" fill="var(--hip)" opacity="0.9"/>'; });
  const lblStep=Math.ceil(totalWeeks/7);
  for(let i=0;i<totalWeeks;i++) if(i%lblStep===0) s+=_axTx(padL+i*xs, H-8, 'W'+(i+1), 8, 'middle');
  const last=proj[pws[pws.length-1]], firstP=proj[pws[0]];
  const big='<div style="font-family:var(--font-display);font-size:26px;font-weight:700;letter-spacing:-0.02em;color:var(--hip);line-height:1.1">'
    +_fmtHMS(last*0.975)+' – '+_fmtHMS(last*1.025)+'</div>'
    +'<div style="font-size:11px;color:var(--muted);margin-bottom:12px">projected half finish, on current easy-run fitness</div>';
  let foot='Read off the app’s own pace table: easy pace → mile equivalent → half finish. An estimate from training pace, not a promise — and never a reason to race a recovery run. Opened the block at <b>'+_fmtHMS(firstP)+'</b>.';
  if(claimed) foot+=' The dashed line is the '+_fmtPaceShort(intakeMileSec)+' mile you entered at signup, read through the same table.';
  return _iaCard(asyIcon('🏁',15)+' Where This Is Heading','var(--hip)',
    big+'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>', foot);
}
function _fmtHMS(sec){
  sec=Math.round(sec);
  return Math.floor(sec/3600)+':'+String(Math.floor((sec%3600)/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}

// 5 — DRIFT FROM PLAN
function buildDriftChart(pv, totalWeeks, cut, skip1){
  const ws=Object.keys(pv).map(Number).sort((a,b)=>a-b);
  if(ws.length<2) return '';
  const deltas=ws.map(w=>pv[w].act-pv[w].presc);
  let lo=Math.min.apply(null,deltas.concat([0])), hi=Math.max.apply(null,deltas.concat([0]));
  const pad=Math.max(1,(hi-lo)*0.18); lo-=pad; hi+=pad;
  const W=320,H=128,padL=36,padR=10,padT=12,padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const slot=plotW/totalWeeks, barW=slot*0.58;
  const yof=v=>padT+plotH-((v-lo)/(hi-lo))*plotH;
  let s='';
  const span=hi-lo, step=span>16?5:(span>6?2:1);
  for(let yv=Math.ceil(lo/step)*step; yv<=hi; yv+=step){
    if(Math.abs(yv)<1e-9) continue;
    const cy=yof(yv);
    s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
    s+=_axTx(padL-5, cy+3, (yv>0?'+':'')+yv);
  }
  const zy=yof(0);
  s+='<line x1="'+padL+'" y1="'+zy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+zy.toFixed(1)+'" stroke="var(--border2)" stroke-width="1.2"/>';
  s+=_axTx(padL-5, zy+3, 'as written', 7, 'end', 'var(--muted)');
  ws.forEach(w=>{
    const d=pv[w].act-pv[w].presc;
    const x=padL+(w-1)*slot+(slot-barW)/2, y0=yof(0), y1=yof(d);
    s+='<rect x="'+x.toFixed(1)+'" y="'+Math.min(y0,y1).toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+Math.max(Math.abs(y1-y0),1.2).toFixed(1)
      +'" fill="'+(d>=0?'var(--run)':'var(--red)')+'" opacity="0.85"/>';
  });
  const lblStep=Math.ceil(totalWeeks/7);
  for(let i=0;i<totalWeeks;i++) if(i%lblStep===0) s+=_axTx(padL+i*slot+slot/2, H-8, 'W'+(i+1), 8, 'middle');
  let tp=0, ta=0; ws.forEach(w=>{ tp+=pv[w].presc; ta+=pv[w].act; });
  const net=ta-tp;
  let foot='Written <b>'+tp.toFixed(1)+' mi</b> · logged <b style="color:var(--run)">'+ta.toFixed(1)+' mi</b> across '+ws.length
    +(ws.length===1?' week':' weeks')+' — <b style="color:'+(net>=0?'var(--run)':'var(--red)')+'">'+(net>=0?'+':'')+net.toFixed(1)+' mi</b> net. '
    +'Distance-prescribed runs only; time-based runs carry no written mileage to compare against.';
  if(cut) foot+=' Week '+cut+' is still in progress and is not counted yet.';
  if(skip1) foot+=' Week 1 was a short first week and is not counted.';   // V174 D26
  return _iaCard(asyIcon('🏃',15)+' Mileage — Drift From Plan','var(--run)',
    '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>', foot);
}

// 6 — LIFT LEDGER
function _ledgerSpark(entries, unit){
  const pts=weeklyBest(entries);
  if(pts.length<2) return '';
  const disp=w=>(unit==='kg')?Math.round(w*0.453592*2)/2:w;
  const vs=pts.map(e=>disp(+e.weight||0));
  const lo=Math.min.apply(null,vs), hi=Math.max.apply(null,vs), rng=(hi-lo)||1;
  const W=132,H=24, xs=W/(pts.length-1);
  let d='';
  vs.forEach((v,i)=>{ d+=(i?' L':'M')+(i*xs).toFixed(1)+','+(H-((v-lo)/rng)*H).toFixed(1); });
  return '<svg viewBox="0 0 '+W+' '+(H+2)+'" style="width:132px;height:24px;overflow:visible">'
    +'<path d="'+d+'" fill="none" stroke="var(--lift)" stroke-width="1.4" opacity="0.7"/>'
    +'<circle cx="'+((pts.length-1)*xs).toFixed(1)+'" cy="'+(H-((vs[vs.length-1]-lo)/rng)*H).toFixed(1)+'" r="2.6" fill="var(--lift)"/></svg>';
}
function buildLedgerCard(led, unit){
  if(!led.mains.length&&!led.accessories.length) return '';
  const u=(unit==='kg')?'kg':'lbs';
  const disp=w=>(unit==='kg')?Math.round(w*0.453592*2)/2:Math.round(w);
  let rows='';
  led.mains.forEach(r=>{
    const d=r.cur-r.base;
    const pct=r.base>0?Math.round(d/r.base*100):0;
    const en=r.curEn||{};
    const setStr=(+en.weight>0)?('best set '+disp(+en.weight)+'×'+((en.setsDone&&en.setsDone.length?Math.max.apply(null,en.setsDone.map(Number)):null)||(String(en.setsReps||'').match(/(\d+)\s*$/)||[0,1])[1])):'';
    rows+='<div style="padding:10px 0;border-bottom:1px solid var(--border)">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'
      +'<div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.3">'+r.name+'</div>'
      +'<div style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--lift);white-space:nowrap">'+(d>=0?'+':'')+disp(d)+' '+u+'</div></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:3px">'
      +'<div style="font-size:11px;color:var(--muted);line-height:1.45">'
      +disp(r.base)+' <span style="opacity:0.65">('+r.baseSrc+')</span> → <b style="color:var(--text)">'+disp(r.cur)+' e1RM</b>'
      +(setStr?'<br><span style="opacity:0.8">'+setStr+' · '+(pct>=0?'+':'')+pct+'%</span>':'')
      +'</div>'+_ledgerSpark(r.entries, unit)+'</div></div>';
  });
  let acc='';
  if(led.accessories.length){
    acc='<details style="margin-top:4px"><summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:11px 0 2px;font-size:12px;color:var(--muted)">'
      +'<span>'+led.accessories.length+' accessory movement'+(led.accessories.length===1?'':'s')+'</span>'
      +'<span style="font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text)">Show</span></summary>'
      +'<div style="padding-top:4px">'
      +led.accessories.map(r=>'<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">'
        +'<div style="font-size:12px;color:var(--text)">'+r.name+'</div>'
        +'<div style="font-size:11px;color:var(--muted);white-space:nowrap">best <b style="color:var(--text)">'+disp(r.cur)+' e1RM</b></div></div>').join('')
      +'</div></details>';
  }
  const foot='Both sides of every comparison are estimated maxes through the same calculator, so a working set is never measured against a single. '
    +'Where you never entered a starting number, the baseline is your first logged set and the row says so.';
  return _iaCard(asyIcon('🏋',15)+' Lift Ledger','var(--lift)', rows+acc, foot);
}

// ── V166: "Is Your Easy Actually Easy?" — the prescribed-zone redesign ──────
// V165 shipped this as a class-scatter and Mario's device verdict was that it does not
// communicate: a strip scatter asks a yes/no question in its title and answers with a
// distribution. Ruled (variant C): drop the hard-run columns and compare easy runs to
// the number the PLAN asked for. "Actually easy" means "at or slower than the ceiling
// the session was written with" — not "slower than my own hard days", which still made
// the athlete do the interpreting.
//
// Direction, verified against the log form's own copy (`df<0` renders "faster than
// target"): pace is seconds/mile, so FEWER seconds = faster. `cap` = (tempo+recovery)/2
// sits at fewer seconds than `tgt` = recovery. The ceiling is therefore the FAST edge
// and the violation is coming in UNDER it.
//
// Ceiling coverage: this is a FALLBACK for history, not a second source of truth.
// steadyCapSec() is the single owner of the steady ceiling for anything the engine
// builds — every easy and recovery card, NSW and NRC, distance-dosed and time-dosed,
// writes `dose.cap` from it. The only doses that reach this function are `ia_hist_`
// snapshots frozen before V203 landed that writer: they carry `tgt` alone and would
// otherwise render with no ceiling, the one element the chart exists for. That makes
// the fallback self-expiring — no snapshot written from V203 on lacks a `cap`, so the
// set of rows needing it is closed and only shrinks as old history ages out.
// It reproduces steadyCapSec's own formula off PACE_CHART's tempo column rather than
// inventing a constant: the number the engine itself would have written at the time.
function _steadyCeilingFor(recSec){
  const rows=(typeof PACE_CHART!=='undefined')?PACE_CHART:null;
  if(!rows||!rows.length||!(recSec>0)) return null;
  // tempo and recovery must stay a MATCHED PAIR — the engine's formula reads both from
  // one table row. Clamping tempo to an edge while keeping a raw out-of-range recSec
  // breaks that pairing: a corrupt tgt of 1s/mi yielded a 3:03/mi ceiling, which would
  // mark every run on the chart "too fast". Clamp the recovery term with it.
  let tempo, rec=recSec;
  if(recSec<=rows[0].recovery){ tempo=rows[0].tempo; rec=rows[0].recovery; }
  else if(recSec>=rows[rows.length-1].recovery){ tempo=rows[rows.length-1].tempo; rec=rows[rows.length-1].recovery; }
  else {
    tempo=rows[rows.length-1].tempo;
    for(let i=1;i<rows.length;i++){
      const a=rows[i-1], b=rows[i];
      if(recSec<=b.recovery){
        const f=(recSec-a.recovery)/(b.recovery-a.recovery);
        tempo=a.tempo+f*(b.tempo-a.tempo);
        break;
      }
    }
  }
  return Math.round((tempo+rec)/2);
}
// Every easy/recovery run that carries a prescribed anchor, with its own ceiling.
// A run with no `tgt` in its freeze CANNOT be placed and is excluded, never guessed —
// same discipline as V155/V156. That is correct behaviour and it shrinks the sample,
// which is why the B-variant band chart stays behind this one as a fallback.
function easyVsPrescribed(logs, hist, totalWeeks){
  const runs=[];
  Object.entries(logs||{}).forEach(([key,e])=>{
    if(!e||!e.run_pace||e.swapTo) return;
    const m=key.match(/^w(\d+)_(.+)$/); if(!m) return;
    const w=+m[1]; if(!(w>=1&&w<=totalWeeks)) return;
    const snap=hist&&hist[key]; if(!snap||!snap.cardio) return;
    const c=snap.cardio;
    if(String(c.type||'').toLowerCase()!=='run') return;
    const cls=_runClass(c.subtype);
    if(cls!=='Recovery'&&cls!=='Easy') return;
    const d=c.dose||{};
    const tgt=(+d.tgt>0)?+d.tgt:0;
    if(!tgt) return;                                  // no anchor -> excluded
    const sec=_paceStrToSec(e.run_pace); if(!sec) return;
    const cap=(+d.cap>0)?+d.cap:_steadyCeilingFor(tgt);
    if(!(cap>0)) return;
    runs.push({w, sec, tgt, cap, hot:sec<cap});       // fewer seconds = too fast
  });
  runs.sort((a,b)=>a.w-b.w);
  return runs;
}
var EASY_ZONE_MIN_RUNS = 4;   // below this the zone chart has nothing to say

// Variant C — easy runs against the plan's own ceiling and aim.
function buildEasyZoneChart(runs){
  if(runs.length<EASY_ZONE_MIN_RUNS) return '';
  const hot=runs.filter(r=>r.hot);
  const ok=hot.length===0;
  const col=ok?'var(--run)':'var(--red)';
  const tgt=Math.round(runs.reduce((a,r)=>a+r.tgt,0)/runs.length);
  const cap=Math.round(runs.reduce((a,r)=>a+r.cap,0)/runs.length);
  const head=ok?'Yes — every one':(hot.length+' of '+runs.length+' were too fast');
  const sub=ok
    ? 'Every easy run came in at or below the ceiling the plan set. Nothing to fix.'
    : ('The plan asks for '+_fmtPaceShort(tgt)+'/mi and sets a ceiling at '+_fmtPaceShort(cap)+'/mi. '
       +hot.length+' run'+(hot.length>1?'s':'')+' came in under it — faster than easy is meant to be, which '
       +'costs the recovery those days exist for.');
  const W=320,H=150,padL=40,padR=10,padT=22,padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  let lo=Math.min.apply(null,runs.map(r=>Math.min(r.sec,r.cap)))-40;
  let hi=Math.max.apply(null,runs.map(r=>Math.max(r.sec,r.tgt)))+45;
  if(hi-lo<90){ const mid=(hi+lo)/2; lo=mid-45; hi=mid+45; }
  const n=runs.length, xs=plotW/Math.max(1,n-1);
  const yof=p=>padT+((p-lo)/(hi-lo))*plotH;
  const capY=Math.max(yof(cap),padT), tgtY=yof(tgt);
  let s='';
  s+='<rect x="'+padL+'" y="'+padT+'" width="'+plotW+'" height="'+Math.max(capY-padT,0).toFixed(1)+'" fill="var(--red)" opacity="0.07"/>';
  s+='<rect x="'+padL+'" y="'+capY.toFixed(1)+'" width="'+plotW+'" height="'+Math.max(padT+plotH-capY,0).toFixed(1)+'" fill="var(--run)" opacity="0.07"/>';
  s+='<line x1="'+padL+'" y1="'+capY.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+capY.toFixed(1)+'" stroke="var(--red)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.75"/>';
  s+=_axTx(padL+2, padT+9, 'too fast', 8, 'start', 'var(--red)', '700');
  s+=_axTx(W-padR, capY-5, 'CEILING '+_fmtPaceShort(cap), 8, 'end', 'var(--red)', '700');
  if(tgtY>capY+14&&tgtY<padT+plotH){
    s+='<line x1="'+padL+'" y1="'+tgtY.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+tgtY.toFixed(1)+'" stroke="var(--run)" stroke-width="1" stroke-dasharray="2,3" opacity="0.7"/>';
    s+=_axTx(W-padR, tgtY+12, 'aim '+_fmtPaceShort(tgt), 8, 'end', 'var(--run)', '700');
  }
  for(let pv=Math.ceil(lo/60)*60; pv<=hi; pv+=60) s+=_axTx(padL-5, yof(pv)+3, _fmtPaceShort(pv));
  runs.forEach((r,i)=>{
    const x=padL+i*xs, y=yof(r.sec), c=r.hot?'var(--red)':'var(--run)';
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" fill="'+c+'" opacity="0.9"/>';
    s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="7.5" fill="'+c+'" opacity="0.16"/>';
  });
  const lblStep=Math.max(1,Math.ceil(n/6));
  runs.forEach((r,i)=>{ if(i%lblStep===0) s+=_axTx(padL+i*xs, H-8, 'W'+r.w, 8, 'middle'); });
  const headHtml='<div style="font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-0.02em;color:'
    +col+';line-height:1.15;margin-bottom:4px">'+head+'</div>'
    +'<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">'+sub+'</div>';
  return _iaCard(asyIcon('🏃',15)+' Is Your Easy Actually Easy?', col,
    headHtml+'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>',
    'Each dot is one easy or recovery run. The ceiling and the aim are the plan’s own numbers for that session, not a rule invented for this chart.');
}

// Variant B — fallback when too few runs carry a prescribed anchor. Ranges on one pace
// axis; the rule is a sentence a runner already owns: these two bars should not touch.
function buildEasyBandsFallback(byClass){
  const easy=(byClass.Easy||[]).concat(byClass.Recovery||[]).map(r=>r.sec);
  const hard=(byClass.Tempo||[]).concat(byClass.Interval||[]).map(r=>r.sec);
  if(easy.length<2||hard.length<2) return '';
  const gap=Math.min.apply(null,easy)-Math.max.apply(null,hard);
  const ok=gap>=60, col=ok?'var(--run)':'var(--red)';
  const head=ok?'Yes — comfortably':'Not really';
  const sub=ok
    ? ('Your easiest run is '+_fmtPaceShort(gap)+'/mi slower than your hardest. That separation is what lets easy days rebuild you while hard days push.')
    : ('Only '+_fmtPaceShort(Math.abs(gap))+'/mi separates your easiest run from your hardest. Everything is landing at one medium speed — too fast to recover from, too slow to build speed.');
  const W=320,H=108,padL=10,padR=10,padT=26;
  const plotW=W-padL-padR;
  const all=easy.concat(hard);
  const lo=Math.min.apply(null,all)-40, hi=Math.max.apply(null,all)+40;
  const xof=p=>padL+((p-lo)/(hi-lo))*plotW;
  let s='';
  for(let pv=Math.ceil(lo/60)*60; pv<=hi; pv+=60){
    s+='<line x1="'+xof(pv).toFixed(1)+'" y1="'+(padT-6)+'" x2="'+xof(pv).toFixed(1)+'" y2="'+(padT+58)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
    s+=_axTx(xof(pv), padT+74, _fmtPaceShort(pv), 8, 'middle');
  }
  s+=_axTx(padL, padT-12, '\u2190 faster', 7, 'start');
  s+=_axTx(W-padR, padT-12, 'slower \u2192', 7, 'end');
  [['HARD',hard,'var(--lift)'],['EASY',easy,'var(--run)']].forEach((row,i)=>{
    const y=padT+i*30, x1=xof(Math.min.apply(null,row[1])), x2=xof(Math.max.apply(null,row[1]));
    s+='<rect x="'+x1.toFixed(1)+'" y="'+y+'" width="'+Math.max(x2-x1,3).toFixed(1)+'" height="18" fill="'+row[2]+'" opacity="0.82" rx="1"/>';
    s+=_axTx(x1-4, y+13, row[0], 9, 'end', row[2], '700');
  });
  const g1=xof(Math.max.apply(null,hard)), g2=xof(Math.min.apply(null,easy));
  s+='<rect x="'+Math.min(g1,g2).toFixed(1)+'" y="'+(padT-2)+'" width="'+Math.max(Math.abs(g2-g1),2).toFixed(1)+'" height="64" fill="'+col+'" opacity="0.09"/>';
  s+=_axTx((g1+g2)/2, padT+61, _fmtPaceShort(Math.abs(gap))+' gap', 8, 'middle', col, '700');
  const headHtml='<div style="font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-0.02em;color:'
    +col+';line-height:1.15;margin-bottom:4px">'+head+'</div>'
    +'<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">'+sub+'</div>';
  return _iaCard(asyIcon('🏃',15)+' Is Your Easy Actually Easy?', col,
    headHtml+'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>',
    'The two bars should not touch. The space between them is the whole point of running two different speeds.');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  _axTx, _iaCard, _steadyCeilingFor, buildDriftChart, buildEasyBandsFallback, buildEasyEffortChart,
  buildEasyEffortEmpty, buildEasyZoneChart, buildLadderChart, buildProjectionCard, easyVsPrescribed,
};
