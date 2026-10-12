
// ── V167: LIFT LEDGER REBUILD (D7 revised / D10-A / D11) ────────────────────
// V165's ledger led with e1RM. Two things were wrong with that. First, the app
// prescribes purely by RPE — `scheme()` ignores 1RM by design and says so — so the
// ledger headlined a number the engine refuses to program from. Second, e1RM error
// scales with reps and the row took max() across mixed rep ranges, so on a normal wave
// a 295×1 in W12 scores BELOW a 285×2 in W10: the ledger reported a PR single as a
// regression. Replaced with the set the athlete actually did.
//
// D11 (ruled): main vs accessory is resolved by SLOT, not by name, and a lift lands in
// exactly one tier. Measured over 1,080 builds: 27 names ever occupy a main slot and 26
// of them also appear as accessories, so no name list can ever be right — close-grip
// bench and DB bench press are legitimately both, and inside a single program the split
// is often an exact tie (4 main days / 4 accessory days). The engine already decides at
// build time (V162 D0: item 0 of a /^main/i section) and freezes that decision into
// ia_hist_, so the ledger reads the athlete's own card instead of guessing.
// Tie-break is main-if-ever, per Mario: if the app ever made it your main lift, it was
// one. The MAIN CHART then reads only main-slot sessions — blending the lighter
// accessory-day sets into the same line makes the progression jump for no reason.
function _slotOfEntry(hist, name, en){
  if(!en||!en.week||!en.day) return null;
  const snap=hist&&hist['w'+en.week+'_'+en.day];
  if(!snap||!snap.sections) return null;
  const key=exStoreKey(name);
  let seen=null;
  snap.sections.forEach(sec=>{
    const isMain=/^main/i.test(sec.label||'');
    (sec.items||[]).forEach((it,ii)=>{
      if(!it||!it.name) return;
      if(exStoreKey(it.name)!==key) return;
      if(isMain&&ii===0) seen='main';
      else if(seen!=='main') seen='accessory';
    });
  });
  return seen;
}
// The frozen prescription for one logged entry: rep range and per-set reps. V137's
// double-progression grammar is "3×8–12 @ RPE 8". Rows the V137 sweep left as plain
// fixed reps, timed holds, and the open-set bodyweight form all correctly yield no
// range — measured at ~50% of accessory rows carrying one, so the no-range path is the
// common case and degrades to a plain row rather than an empty card.
function _rxRangeFor(hist, name, en){
  if(!en||!en.week||!en.day) return null;
  const snap=hist&&hist['w'+en.week+'_'+en.day];
  if(!snap||!snap.sections) return null;
  const key=exStoreKey(name);
  let det=null;
  snap.sections.forEach(sec=>(sec.items||[]).forEach(it=>{
    if(it&&it.name&&exStoreKey(it.name)===key&&!det) det=it.detail||'';
  }));
  if(!det) return null;
  const m=det.match(/(\d+)\s*[×x]\s*(\d+)\s*[–-]\s*(\d+)/);
  if(!m) return null;
  const lo=+m[2], hi=+m[3];
  if(!(hi>lo)) return null;
  return {sets:+m[1], lo:lo, hi:hi};
}
function _setsOf(en){
  const sd=(en&&en.setsDone)||[];
  const out=sd.map(Number).filter(v=>v>0);
  if(out.length) return out;
  const m=String((en&&en.setsReps)||'').match(/(\d+)\s*$/);
  return m?[+m[1]]:[];
}
function ledgerModel(exw, hist){
  const mains=[], ladder=[], plain=[], unloaded=[];
  Object.values(exw||{}).forEach(ex=>{
    const name=ex.name||'';
    const all=(ex.entries||[]).slice().sort((a,b)=>(a.week-b.week)||((a.ts||0)-(b.ts||0)));
    if(!all.length) return;
    const mainEns=all.filter(en=>_slotOfEntry(hist,name,en)==='main');
    if(mainEns.length){
      // V196 D57: an unloaded main lift is still a main lift. The old code returned
      // here whenever no main-slot session carried a weight, which dropped the movement
      // out of EVERY card — measured at 30,018 of 105,280 (config, movement) pairs, and
      // on a bodyweight program it dropped the whole ledger to zero characters from a
      // fully populated store. The slot is never reclassified: the chart is a load chart
      // only in its UNIT, and with no loads written it plots the top set in reps.
      // V196 D58: every session this key owns lands in exactly one of three numbers —
      // plotted + accessoryDay + noLoad == entries — so the footer can account for all
      // of them. `hidden: all.length-mainEns.length` could not see the sessions the
      // return above had already discarded.
      const loaded=mainEns.filter(en=>+en.weight>0);
      const accessoryDay=all.length-mainEns.length;
      const topOf=en=>{const s=_setsOf(en); return s.length?Math.max.apply(null,s):0;};
      if(loaded.length){
        // V196 D59: a blank Load box costs the POINT, not the session. Nothing is
        // carried forward — a repeated weight draws a flat segment the athlete never
        // earned and makes a missed entry read as a plateau (V167 killed e1RM off this
        // card for the same reason). The blank sessions are disclosed in the footer.
        const first=loaded[0];
        const heavy=loaded.reduce((a,b)=>(+b.weight>+a.weight?b:a),loaded[0]);
        mains.push({name, mode:'load', series:loaded.map(en=>({w:en.week, v:+en.weight})),
          heavy:{v:+heavy.weight, reps:topOf(heavy)||null, week:heavy.week},
          first:{v:+first.weight, reps:topOf(first)||null, week:first.week},
          plotted:loaded.length, accessoryDay:accessoryDay,
          noLoad:mainEns.length-loaded.length, entries:all.length});
        return;
      }
      const repEns=mainEns.filter(en=>topOf(en)>0);
      if(repEns.length){
        const first=repEns[0];
        const heavy=repEns.reduce((a,b)=>(topOf(b)>topOf(a)?b:a),repEns[0]);
        mains.push({name, mode:'reps', series:repEns.map(en=>({w:en.week, v:topOf(en)})),
          heavy:{v:topOf(heavy), reps:null, week:heavy.week},
          first:{v:topOf(first), reps:null, week:first.week},
          plotted:repEns.length, accessoryDay:accessoryDay,
          noLoad:mainEns.length-repEns.length, entries:all.length});
        return;
      }
      // Main-slot sessions carrying neither a load nor a rep count have nothing to
      // plot in either unit. They fall through to the routing below rather than
      // returning, so a populated store key always lands in exactly one bucket.
    }
    const last=all[all.length-1];
    const sets=_setsOf(last);
    const wt=+last.weight||0;
    if(!(wt>0)){ unloaded.push({name, sessions:all.length,
      reps: all.reduce((s,en)=>s+_setsOf(en).reduce((a,b)=>a+b,0),0)}); return; }
    // V194 D55: the range that decides Range Ladder vs Other Accessory Work is read from
    // the most recent session that CARRIES one, not strictly the last. A primer or taper
    // week is prescribed fixed low reps, so reading only `last` let the least
    // representative session in the block silently move a lift between two cards and
    // back again, on nothing but which session was logged most recently.
    let rng=null;
    for(let i=all.length-1;i>=0&&!rng;i--) rng=_rxRangeFor(hist,name,all[i]);
    if(rng&&sets.length){
      // step-ups: how many times the working weight rose across the block
      let ups=0, prev=null;
      all.forEach(en=>{ const w=+en.weight||0; if(prev!==null&&w>prev) ups++; if(w>0) prev=w; });
      ladder.push({name, wt, lo:rng.lo, hi:rng.hi, sets,
        ready: sets.length>0 && sets.every(r=>r>=rng.hi), ups, sessions:all.length});
    } else {
      plain.push({name, wt, sets, sessions:all.length,
        range:[Math.min.apply(null,all.map(e=>+e.weight||0).filter(v=>v>0).concat([wt])),
               Math.max.apply(null,all.map(e=>+e.weight||0).concat([wt]))]});
    }
  });
  mains.sort((a,b)=>b.series.length-a.series.length);
  ladder.sort((a,b)=>(b.ready?1:0)-(a.ready?1:0) || b.sessions-a.sessions);
  plain.sort((a,b)=>b.sessions-a.sessions);
  unloaded.sort((a,b)=>b.sessions-a.sessions);
  return {mains, ladder, plain, unloaded};
}

// ── main lift block: the top set, in whichever unit was written down ───────
// V196 D57: one block, one geometry, two units. `m.mode` decides whether the y axis
// carries load or the top set in reps; the padding, the gridline step and the
// series>=2 rule are the SAME expressions in both modes. Reps are never unit
// converted — `disp` is the identity on a reps block.
function buildMainLiftBlock(m, unit){
  const isReps=(m.mode==='reps');
  const disp=w=>isReps?w:((unit==='kg')?Math.round(w*0.453592*2)/2:Math.round(w));
  const u=isReps?'reps':((unit==='kg')?'kg':'lbs');
  const hv=m.heavy, fs=m.first;
  const lblOf=p=>isReps?(p.v+' reps'):(disp(p.v)+(p.reps?'×'+p.reps:''));
  const hLbl=lblOf(hv);
  const fLbl=lblOf(fs);
  let chart='';
  if(m.series.length>=2){
    const W=320,H=108,padL=34,padR=10,padT=14,padB=20;
    const plotW=W-padL-padR, plotH=H-padT-padB;
    const ws=m.series.map(p=>p.v);
    let lo=Math.min.apply(null,ws), hi=Math.max.apply(null,ws);
    const pad=Math.max((hi-lo)*0.25,10); lo-=pad; hi+=pad;
    const xs=plotW/(m.series.length-1);
    const yof=v=>padT+plotH-((v-lo)/(hi-lo))*plotH;
    let s='', step=(hi-lo)>90?25:10;
    for(let v=Math.ceil(lo/step)*step; v<=hi; v+=step){
      const cy=yof(v);
      s+='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+cy.toFixed(1)+'" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>';
      s+=_axTx(padL-5, cy+3, disp(v));
    }
    let d='';
    m.series.forEach((p,i)=>{ d+=(i?' L':'M')+(padL+i*xs).toFixed(1)+','+yof(p.v).toFixed(1); });
    s+='<path d="'+d+'" stroke="var(--lift)" stroke-width="1.5" fill="none" opacity="0.55"/>';
    m.series.forEach((p,i)=>{
      const top=(p.v===hv.v&&p.w===hv.week);
      s+='<circle cx="'+(padL+i*xs).toFixed(1)+'" cy="'+yof(p.v).toFixed(1)+'" r="'+(top?4.5:3.2)+'" fill="var(--lift)" opacity="'+(top?1:0.72)+'"/>';
    });
    const lblStep=Math.max(1,Math.ceil(m.series.length/6));
    m.series.forEach((p,i)=>{ if(i%lblStep===0) s+=_axTx(padL+i*xs, H-4, 'W'+p.w, 8, 'middle'); });
    chart='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>';
  }
  const gain=disp(hv.v)-disp(fs.v);
  // V196 D59 honesty rider: "Opened at" names the week of the FIRST PLOTTED session.
  // An athlete who trained from week 1 and first wrote a weight in week 6 must not be
  // told they opened in week 6 with no week on the number to say otherwise.
  return '<div style="padding:12px 0;border-bottom:1px solid var(--border)">'
    +'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">'
    +'<div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.3">'+m.name+'</div>'
    +'<div style="font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--lift);white-space:nowrap">'+hLbl+'</div></div>'
    +'<div style="font-size:11px;color:var(--muted);margin:2px 0 8px">Opened at <b style="color:var(--text)">'+fLbl+'</b> in week '+fs.week
    +(gain>0?' · up <b style="color:var(--lift)">'+gain+' '+u+'</b>':'')
    +' · '+(isReps?'best':'heaviest')+' in week '+hv.week+'</div>'+chart+'</div>';
}

// ── accessory range ladder ─────────────────────────────────────────────────
function _ladderTrack(r){
  const track=140, H=26, span=(r.hi-r.lo)||1;
  const xof=v=>(Math.max(Math.min(v,r.hi),r.lo)-r.lo)/span*track;
  const col=r.ready?'var(--signal)':'var(--lift)';
  let s='';
  for(let k=r.lo;k<=r.hi;k++)
    s+='<line x1="'+xof(k).toFixed(1)+'" y1="9" x2="'+xof(k).toFixed(1)+'" y2="15" stroke="var(--border2)" stroke-width="1" opacity="0.55"/>';
  s+='<line x1="0" y1="12" x2="'+track+'" y2="12" stroke="var(--border2)" stroke-width="1" opacity="0.55"/>';
  const fill=xof(Math.min.apply(null,r.sets));
  if(fill>0) s+='<rect x="0" y="10" width="'+fill.toFixed(1)+'" height="4" fill="'+col+'" opacity="0.5" rx="2"/>';
  if(r.ready) s+='<rect x="0" y="10" width="'+track+'" height="4" fill="'+col+'" opacity="0.75" rx="2"/>';
  // sets that landed on the same rep count are nudged apart so three dots never read as one
  const seen={};
  r.sets.forEach(v=>{
    const x=xof(v); const n=(seen[v]=(seen[v]||0)+1);
    const off=(n-1)*5.5;
    s+='<circle cx="'+(x-off).toFixed(1)+'" cy="12" r="3.6" fill="'+col+'" opacity="0.92"/>';
  });
  s+=_axTx(0, 25, r.lo, 8, 'start');
  s+=_axTx(track, 25, r.hi, 8, 'end', r.ready?'var(--signal)':'rgba(24,23,18,0.3)', r.ready?'700':'');
  return '<svg viewBox="-8 0 '+(track+16)+' '+H+'" style="width:'+track+'px;height:'+H+'px;overflow:visible">'+s+'</svg>';
}
function _ladderRow(r, unit){
  const disp=w=>(unit==='kg')?Math.round(w*0.453592*2)/2:Math.round(w);
  const u=(unit==='kg')?'kg':'lbs';
  const status=r.ready
    ? '<span style="font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--signal)">Add weight</span>'
    : '<span style="font-size:10px;color:var(--muted)">'+(r.hi-Math.min.apply(null,r.sets))+' to go</span>';
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:12px;color:var(--text);font-weight:500;line-height:1.3">'+r.name+'</div>'
    +'<div style="font-size:10px;color:var(--muted);margin-top:2px"><b style="color:var(--text)">'+disp(r.wt)+' '+u+'</b> · '
    +r.sets.join('/')+' reps'+(r.ups?' · ↑'+r.ups+' this block':'')+'</div>'
    +'<div style="margin-top:3px">'+status+'</div></div>'
    +'<div style="flex-shrink:0">'+_ladderTrack(r)+'</div></div>';
}
function buildLedgerCards(model, unit){
  const disp=w=>(unit==='kg')?Math.round(w*0.453592*2)/2:Math.round(w);
  const u=(unit==='kg')?'kg':'lbs';
  let html='';
  if(model.mains.length){
    // V196 D58: the footer must account for every session, in TWO clauses and never one
    // number. They ask different things of the athlete. The first is the app's own
    // decision and is unactionable; the second is the athlete's gap and one tap fixes
    // it. plotted + accessoryDay + noLoad == entries, per movement and in the sum.
    // V196 D56: the title keeps the name MAIN LIFTS (Mario: "Top Lifts" is misleading),
    // so the disambiguation line in this footer does that work alone.
    const accDay=model.mains.reduce((a,m)=>a+m.accessoryDay,0);
    const noLoad=model.mains.reduce((a,m)=>a+m.noLoad,0);
    html+=_iaCard(asyIcon('🏋',15)+' Main Lifts','var(--lift)',
      model.mains.map(m=>buildMainLiftBlock(m,unit)).join(''),
      'The top set you actually did. No estimated maxes: a formula that '
      +'inflates with reps would rank a heavy single below a lighter double.'
      +' This is the lift each day was built around. Everything else you loaded is in the ladder below.'
      +(accDay?' '+accDay+(accDay===1?' session':' sessions')+' where this ran as an accessory '+(accDay===1?'is':'are')
        +' kept off the line. The lighter sets would make the climb look like something it was not.':'')
      +(noLoad?' '+noLoad+(noLoad===1?' session':' sessions')+' had no load written down. Add the weight and '
        +(noLoad===1?'it joins':'they join')+' the line.':''));
  }
  const L=model.ladder;
  if(L.length){
    const ready=L.filter(r=>r.ready).length;
    const ups=L.reduce((a,r)=>a+r.ups,0);
    const head='<div style="display:flex;align-items:baseline;gap:9px;margin-bottom:2px">'
      +'<div style="font-family:var(--font-display);font-size:30px;font-weight:700;letter-spacing:-0.02em;color:'
      +(ready?'var(--signal)':'var(--muted)')+';line-height:1.05">'+ready+'</div>'
      +'<div style="font-size:13px;color:var(--text);font-weight:600">ready to move up</div></div>'
      +'<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">'
      +(ups?'You have stepped the weight up <b style="color:var(--text)">'+ups+' time'+(ups===1?'':'s')+'</b> across these lifts this block. ':'')
      +'Hit the top of the range on every set, then add weight and start back at the bottom.</div>';
    html+=_iaCard(asyIcon('🏋',15)+' Range Ladder','var(--lift)',
      head+L.map(r=>_ladderRow(r,unit)).join(''),
      'Each track is the rep range your session was written with. Dots are that session’s sets. When every set '
      +'reaches the top, the movement is ready for more weight.');
  }
  if(model.plain.length||model.unloaded.length){
    let rows='';
    model.plain.forEach(r=>{
      const lo=disp(r.range[0]), hi=disp(r.range[1]);
      rows+='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'
        +'<div style="font-size:12px;color:var(--text)">'+r.name+'</div>'
        +'<div style="font-size:10px;color:var(--muted);white-space:nowrap">'+(hi>lo?lo+'–'+hi:lo)+' '+u+' · '+r.sessions+' sessions</div></div>';
    });
    model.unloaded.forEach(r=>{
      rows+='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'
        +'<div style="font-size:12px;color:var(--text)">'+r.name+'</div>'
        +'<div style="font-size:10px;color:var(--muted);white-space:nowrap">'+(r.reps?r.reps.toLocaleString()+' reps · ':'')+r.sessions+' sessions</div></div>';
    });
    html+=_iaCard(asyIcon('🏋',15)+' Other Accessory Work','var(--muted)', rows,
      'These were written without a rep range — timed holds, effort-based bodyweight sets, and plain fixed-rep '
      +'rows — so there is no ladder to climb. Shown as a record of what you did.');
  }
  return html;
}

function renderProgressScreen() {
  const body = document.getElementById('progressBody');
  const _allProgs = getPrograms();
  if(!body || !_allProgs.length) return;
  // V156: Progress is per-program (G1 ruling). progressViewId picks which program's
  // charts render; null means the active program. Every store read below goes through
  // the *For(_vid) accessors so a viewed program can NEVER leak the active one's data.
  let _vprog = progressViewId ? _allProgs.find(p=>p.id===progressViewId) : null;
  if(!_vprog){ progressViewId=null; _vprog = (activeProg && _allProgs.find(p=>p.id===activeProgId)) || _allProgs.find(p=>!p.archived) || _allProgs[0]; }
  if(!_vprog) return;
  const _vid = _vprog.id;
  const _chips = _progChipsHTML(_allProgs, _vid);

  // One-time cleanup: collapse any legacy duplicate weight entries (same exercise,
  // same week, SAME DAY) down to one point each before rendering the charts.
  const _exwClean = getExWeightsFor(_vid);
  const _folded = foldExAliasKeys(_exwClean);          // old-key rows -> canonical (V151)
  const _deduped = dedupeExDayEntries(_exwClean);      // fold first: a fold can CREATE a same-day pair
  if(_folded || _deduped) saveExWeightsFor(_vid, _exwClean);

  const logs = getLogsFor(_vid);
  const cfg = _vprog.cfg || {};
  const totalWeeks = _vprog.totalWeeks || 6;
  const cardioTypes = cfg.cardioTypes || [];
  const liftingFocus = _vprog.liftingFocus || cfg.liftingFocus || 'balanced';
  const isStrength = liftingFocus === 'strength' || liftingFocus === 'hypertrophy';

  // Build weekly data arrays
  const weeklyData = {};
  for(let w = 1; w <= totalWeeks; w++) {
    weeklyData[w] = {run:0, bike:0, swim:0, bench:null, squat:null, dead:null, rpe:null, sessions:0};
  }

  // Parse logs
  Object.entries(logs).forEach(([key, entry]) => {
    const match = key.match(/^w(\d+)_/);
    if(!match) return;
    const w = parseInt(match[1]);
    if(!weeklyData[w]) return;
    if(entry.run_dist && +entry.run_dist > 0) weeklyData[w].run += +entry.run_dist;
    if(entry.bike_mins && +entry.bike_mins > 0) weeklyData[w].bike += +entry.bike_mins;
    if(entry.swim_yards && +entry.swim_yards > 0) weeklyData[w].swim += +entry.swim_yards;
    if(entry.rpe && +entry.rpe > 0) {
      weeklyData[w].rpe = weeklyData[w].rpe ? (+weeklyData[w].rpe + +entry.rpe)/2 : +entry.rpe;
    }
    // V238 (D224, Amendment 1 A4): the rest-day jog (restLog) is its own record on the day and the
    // weekly sums credit it: run adds restLog.run.dist, bike adds restLog.bike.mins, swim adds
    // restLog.swim.dist (yards). Walk and row credit no total. Each jog type with an RPE is one
    // more effort in the average, after the day's session RPE when that is set.
    const _rl = (entry.restLog && typeof entry.restLog === 'object') ? entry.restLog : {};
    if(_rl.run && +_rl.run.dist > 0) weeklyData[w].run += +_rl.run.dist;
    if(_rl.bike && +_rl.bike.mins > 0) weeklyData[w].bike += +_rl.bike.mins;
    if(_rl.swim && +_rl.swim.dist > 0) weeklyData[w].swim += +_rl.swim.dist;
    Object.keys(_rl).forEach(t => {
      const r = _rl[t] ? +_rl[t].rpe : 0;
      if(r > 0) weeklyData[w].rpe = weeklyData[w].rpe ? (+weeklyData[w].rpe + r)/2 : r;
    });
    // Count session if ANY meaningful data was logged
    if(entry.rpe||entry.run_dist||entry.bike_mins||entry.swim_yards||entry.notes) {
      weeklyData[w].sessions++;
    }
  });

  // Track best big-3 weight per week from the inline exercise log (ia_exw_),
  // which now owns lift logging (the session-form lift fields were removed).
  // Same name-matching as saveExWeight's 1RM derivation. Stored weight is already in lbs.
  const exwStore = (typeof getExWeightsFor==='function') ? getExWeightsFor(_vid) : {};
  Object.values(exwStore).forEach(ex => {
    const n = (ex.name||'').toLowerCase();
    const isBench = n.includes('bench') && !n.includes('db') && !n.includes('dumbbell') && !n.includes('bench dip');
    const isSquat = (n.includes('back squat')||n.includes('front squat')||n.includes('box squat')) && !n.includes('goblet') && !n.includes('jump');
    const isDead  = n.includes('deadlift') && !n.includes('single-leg') && !n.includes('romanian');
    if(!(isBench||isSquat||isDead)) return;
    const lift = isBench ? 'bench' : isSquat ? 'squat' : 'dead';
    (ex.entries||[]).forEach(en => {
      const w = en.week;
      if(!weeklyData[w]) return;
      const wt = +en.weight || 0;
      if(wt > 0) weeklyData[w][lift] = Math.max(weeklyData[w][lift]||0, wt);
    });
  });

  const weeks = Array.from({length:totalWeeks}, (_,i) => i+1);
  const hasAnyData = Object.keys(logs).length > 0;

  if(!hasAnyData) {
    body.innerHTML = _chips + `<div style="text-align:center;padding:60px 20px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:16px">${asyIcon('📊',44)}</div>
      <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px">No data yet</div>
      <div style="font-size:13px;line-height:1.6">Start logging your sessions and your progress will appear here as dotted line charts.</div>
    </div>`;
    return;
  }

  let html = '';

  // Show a cardio chart if the sport is in the plan OR any volume was logged for it
  // (a swapped-in activity surfaces its own chart even when it isn't part of the plan).
  const loggedAny = s => weeks.some(w => (weeklyData[w][s]||0) > 0);

  // ── V165 endurance stack (D7) ──
  // Order is the athlete's own question order: will I be ready → am I doing it right
  // → am I getting fitter → where is this heading → did I do the work.
  const _hist = getDayHistFor(_vid);
  const _cut  = _cutWeek(_vprog);                    // D6: 0 when nothing to withhold
  const _skip1 = _partialWeek1(_vprog);              // V174 D26: short first week withheld from sums/maxes
  const _goalId = (cfg.cardioGoals && cfg.cardioGoals.run && cfg.cardioGoals.run.id) || '';
  const _raceMi = RACE_DIST_MI[_goalId] || 0;

  if(cardioTypes.includes('run') || loggedAny('run')) {
    // Weekly volume retained from V164. D7 selected NEW modules; it never ruled this
    // one out, and nothing else on the screen reports total mileage — the ladder is a
    // single-run metric and drift covers distance-prescribed runs only.
    const runData = weeks.map(w => (_skip1 && w===1) ? null : (weeklyData[w].run || null));   // V174 D26
    html += buildDotChart(asyIcon('🏃',15)+' Weekly Running Mileage', weeks, runData, 'var(--run)', 'miles', 'mi');
    html += buildLadderChart(ladderWeekly(logs, totalWeeks, _cut, _skip1), totalWeeks, _raceMi, _cut, _skip1);
    // V166 (ruled C): the prescribed-zone chart is the primary. It can only place runs
    // whose freeze carries an anchor, so the V165 class comparison survives as the
    // fallback — a program with thin dose coverage still gets an answer.
    const _ez = easyVsPrescribed(logs, _hist, totalWeeks);
    const _zoneHtml = buildEasyZoneChart(_ez);
    html += _zoneHtml || buildEasyBandsFallback(runsByClass(logs, _hist, totalWeeks));
  }

  // Same Effort supersedes the V155 recovery-pace chart when RPE coverage allows —
  // it is that chart with effort pinned, and stacking both would be two charts of the
  // same number. Below the gate the V155 chart still carries the slot, so thin RPE
  // logging costs nothing that shipped before. Flagged for ruling: this softens V155.
  if(cardioTypes.includes('run')) {
    const _ee = easyEffortWeekly(logs, _hist, totalWeeks);
    if(_ee.nRuns >= EASY_MIN_RUNS && _ee.nWeeks >= 2) {
      html += buildEasyEffortChart(_ee, totalWeeks);
      const _mg = cfg.cardioGoals && cfg.cardioGoals.run;
      const _mile = _mg ? ((+_mg.mileBestMins||0)*60 + (+_mg.mileBestSecs||0)) : 0;
      html += buildProjectionCard(_ee, totalWeeks, _mile);
    } else {
      const _rp = recoveryPaceWeekly(logs, _hist, totalWeeks);
      if(_rp.nWeeks >= 2) {
        const rpData = weeks.map(w => _rp.weekly[w] != null ? _rp.weekly[w] : null);
        html += buildPaceChart(asyIcon('🏃',15)+' Recovery Pace — Easy-Effort Trend', weeks, rpData, _rp.tgt, 'var(--run)');
      } else if(_ee.nRuns > 0) {
        html += buildEasyEffortEmpty(_ee);
      }
    }
    html += buildDriftChart(plannedVsLogged(logs, _hist, totalWeeks, _cut, _skip1), totalWeeks, _cut, _skip1);
  }

  // ── Swimming yardage chart ──
  if(cardioTypes.includes('swim') || loggedAny('swim')) {
    const swimData = weeks.map(w => weeklyData[w].swim || null);
    html += buildDotChart(asyIcon('🏊',15)+' Weekly Swimming Volume', weeks, swimData, '#3f6e96', 'yards', 'yd');
  }

  // ── Bike minutes chart ──
  if(cardioTypes.includes('bike') || loggedAny('bike')) {
    const bikeData = weeks.map(w => weeklyData[w].bike || null);
    html += buildDotChart(asyIcon('🚴',15)+' Weekly Cycling Time', weeks, bikeData, '#f0a050', 'minutes', 'min');
  }

  // ── RPE trend ──
  if(hasAnyData) {
    const rpeData = weeks.map(w => weeklyData[w].rpe || null);
    if(rpeData.some(v => v !== null)) {
      html += buildDotChart(asyIcon('💡',15)+' Average Session RPE', weeks, rpeData, '#7e5e96', 'RPE', '', 10);
    }
  }

  // ── Lifting: superseded by the V165 Lift Ledger below (D7). The top-weight
  // multi-dot ranked every main lift flat and could not distinguish a working
  // triple from a single; the ledger reads e1RM against the athlete's own baseline.

  // ── Lift Ledger (V165, D7 + D10-A) ──
  // Replaces Exercise History. Same store, same sparkline grammar; what changed is
  // ranking (mains surface with a delta, accessories collapse) and the baseline.
  html += buildLedgerCards(ledgerModel(getExWeightsFor(_vid), _hist), cfg.unit || 'lbs');

  // ── Session Journal ──
  const allLogs = getLogsFor(_vid);
  const journalEntries = [];
  Object.entries(allLogs).forEach(([key, entry]) => {
    // V236 (D219 item 3): a swap with no RPE and no note keeps its row, the isSwap line below.
    // V238 (D224 journal, Amendment 1 A4): a day with a rest-day jog (restLog) keeps its row too, so a walk
    // or row jog alone still reaches the journal and Progress does not fall back to its empty state.
    if(!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo) && !(entry.restLog && Object.keys(entry.restLog).length)) return;
    const match = key.match(/^w(\d+)_(\w+)$/);
    if(!match) return;
    const w = parseInt(match[1]);
    const dayKey = match[2];
    journalEntries.push({w, dayKey, entry, ts: entry.ts||0});
  });
  journalEntries.sort((a,b) => a.w - b.w || a.ts - b.ts);

  if(journalEntries.length) {
    // Group entries by week so each week collapses independently. Past weeks stay
    // collapsed to keep the page short; only the most recent logged week is open by
    // default (tap any week to read its entries, tap again to fold it back).
    const byWeek = {};
    const weekOrder = [];
    journalEntries.forEach(je => {
      if(!byWeek[je.w]) { byWeek[je.w] = []; weekOrder.push(je.w); }
      byWeek[je.w].push(je);
    });
    const openWeek = weekOrder[weekOrder.length - 1];

    const journalHtml = weekOrder.map(w => {
      const entriesHtml = byWeek[w].map(({dayKey, entry}) => {
        const rpeColor = !entry.rpe ? 'var(--muted)' : +entry.rpe >= 9 ? 'var(--red)' : +entry.rpe >= 7 ? 'var(--lift)' : +entry.rpe >= 5 ? 'var(--accent)' : 'var(--run)';
        const dayName = ({sun:'Sun',mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat'})[dayKey]||dayKey;
        const isSwap = entry.swapFrom && entry.swapTo;
        const swapWord = s => ({run:'Run',bike:'Bike',swim:'Swim'})[s]||s;
        // V238 (D224 journal, A3): each jog type with mins prints one line, the rest hero's own sentence
        // (restLogLines), never an RPE_LABELS word: the sheet's effort words are not the label table's.
        const jogLines = restLogLines(entry.restLog);
        const headMb = (entry.notes||isSwap||jogLines.length) ? 6 : 0;
        return `<div style="background:var(--surface2);border-radius:4px;padding:10px 12px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${headMb}px">
            <div style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--text)">${dayName}</div>
            ${entry.rpe ? `<div style="font-family:var(--font-display);font-size:12px;font-weight:700;color:${rpeColor}">RPE ${entry.rpe} — ${RPE_LABELS[+entry.rpe]||''}</div>` : ''}
          </div>
          ${isSwap ? `<div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--accent);background:rgba(24,23,18,0.06);border-radius:3px;padding:3px 7px;margin-bottom:${(entry.notes||jogLines.length)?6:0}px">${asyIcon('history',12)} Swapped ${swapWord(entry.swapFrom)} → ${swapWord(entry.swapTo)}</div>` : ''}
          ${jogLines.length ? `<div style="margin-bottom:${entry.notes?6:0}px">${jogLines.map(s => `<div style="font-size:12px;font-weight:500;color:var(--run);line-height:1.5">${s}</div>`).join('')}</div>` : ''}
          ${entry.notes ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;font-style:italic">"${entry.notes}"</div>` : ''}
        </div>`;
      }).join('');
      const n = byWeek[w].length;
      return `<details class="journal-week"${w===openWeek?' open':''}>
        <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted)">
          <span>Week ${w}</span>
          <span style="display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:0.04em;opacity:0.75">${n} ${n===1?'entry':'entries'}<span class="journal-caret" style="display:inline-flex">${asyIcon('chevronDown',14)}</span></span>
        </summary>
        <div style="padding:2px 0 8px">${entriesHtml}</div>
      </details>`;
    }).join('');

    html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">
      <div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">${asyIcon('📓',15)} Session Journal</div>
      ${journalHtml}
    </div>`;
  }

  const _liftBtns=['Deadlift','Squat','Bench'].map((n,i)=>{
    const on=(calcLift===n);
    return `<button type="button" id="calcLift_${n}" onclick="setCalcLift('${n}')" style="flex:1;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:9px;border:none;${i?'border-left:1px solid var(--border2);':''}cursor:pointer;background:${on?'var(--accent)':'transparent'};color:${on?'var(--on-ink)':'var(--muted)'}">${n}</button>`;
  }).join('');
  const estimatorHtml = `<details style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:0 16px;margin-top:4px">
      <summary style="cursor:pointer;padding:14px 0;font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted)">${asyIcon('🧮',15)} 1RM Estimator</summary>
      <div style="padding-bottom:14px">
        <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:10px">Optional — estimate a one-rep max from any recent set, just for your own records. Your training still runs on RPE.</div>
        <div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;overflow:hidden;margin-bottom:10px">${_liftBtns}</div>
        <div class="input-row" style="margin-bottom:10px">
          <div class="input-group"><div class="input-label">Weight</div><input type="number" class="input-field" id="calc_weight" placeholder="e.g. 185" oninput="runCalc()"></div>
          <div class="input-group"><div class="input-label">Reps</div><input type="number" class="input-field" id="calc_reps" placeholder="e.g. 5" oninput="runCalc()"></div>
        </div>
        <div id="calc_result" style="font-size:13px;color:var(--muted);min-height:20px;line-height:1.5"></div>
      </div>
    </details>`;

  body.innerHTML = _chips + (html || `<div style="text-align:center;padding:60px 20px;color:var(--muted)">
    <div style="font-size:48px;margin-bottom:16px">${asyIcon('📊',44)}</div>
    <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px">No data yet</div>
    <div style="font-size:13px;line-height:1.6">Log sessions to see progress charts, exercise history, and your training journal here.</div>
  </div>`) + estimatorHtml;
}

function parseLiftEntry(str) {
  if(!str) return null;
  const m = str.match(/([0-9.]+)\s*[x×]\s*([0-9]+)/);
  if(m) {
    // Epley estimate: weight * (1 + reps/30)
    return Math.round(parseFloat(m[1]) * (1 + parseInt(m[2])/30));
  }
  const m2 = str.match(/([0-9.]+)/);
  return m2 ? parseFloat(m2[1]) : null;
}

function buildDotChart(title, weeks, data, color, label, unit, maxY) {
  const validData = data.filter(v => v !== null);
  if(!validData.length) return '';
  const max = maxY || Math.max(...validData) * 1.2 || 10;
  const min = 0;
  const W = 320, H = 120, padL = 36, padR = 12, padT = 16, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = weeks.length;
  const xStep = plotW / Math.max(n-1, 1);

  // Build points
  const points = data.map((v, i) => {
    if(v === null) return null;
    const x = padL + i * xStep;
    const y = padT + plotH - ((v - min) / (max - min)) * plotH;
    return {x, y, v, w: weeks[i]};
  }).filter(Boolean);

  // Build dotted line path
  let pathD = '';
  let prevPt = null;
  data.forEach((v, i) => {
    if(v === null) { prevPt = null; return; }
    const x = padL + i * xStep;
    const y = padT + plotH - ((v - min) / (max - min)) * plotH;
    if(prevPt) pathD += ` M${prevPt.x},${prevPt.y} L${x},${y}`;
    prevPt = {x, y};
  });

  // Y axis labels
  const yLabels = [0, Math.round(max*0.5), Math.round(max)];

  // X axis labels (show every few weeks)
  const xLabelStep = n <= 8 ? 1 : n <= 16 ? 2 : 4;

  return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">
    <div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${color};margin-bottom:10px">${title}</div>
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;overflow:visible">
      <!-- Grid lines -->
      ${yLabels.map(yv => {
        const cy = padT + plotH - ((yv - min)/(max-min))*plotH;
        return `<line x1="${padL}" y1="${cy}" x2="${W-padR}" y2="${cy}" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>
        <text x="${padL-4}" y="${cy+4}" fill="rgba(24,23,18,0.3)" font-size="8" text-anchor="end" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">${yv}</text>`;
      }).join('')}
      <!-- Dotted connecting lines -->
      <path d="${pathD}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.6"/>
      <!-- Data points -->
      ${points.map(pt => `
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${color}" opacity="0.9"/>
        <circle cx="${pt.x}" cy="${pt.y}" r="7" fill="${color}" opacity="0.15"/>
      `).join('')}
      <!-- X axis week labels -->
      ${weeks.map((w,i) => i%xLabelStep===0 ? `<text x="${padL+i*xStep}" y="${H-4}" fill="rgba(24,23,18,0.3)" font-size="8" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">W${w}</text>` : '').join('')}
    </svg>
    <div style="font-size:11px;color:var(--muted);margin-top:4px">
      Total logged: <b style="color:${color}">${validData.reduce((a,b)=>a+b,0).toFixed(1)} ${unit}</b>
      · Peak week: <b style="color:${color}">${Math.max(...validData).toFixed(1)} ${unit}</b>
    </div>
  </div>`;
}

function buildMultiDotChart(title, weeks, series) {
  const allVals = series.flatMap(s => s.data.filter(v=>v!==null));
  if(!allVals.length) return '';
  const max = Math.max(...allVals) * 1.15;
  const min = 0;
  const W = 320, H = 140, padL = 40, padR = 12, padT = 16, padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = weeks.length;
  const xStep = plotW / Math.max(n-1, 1);
  const xLabelStep = n <= 8 ? 1 : n <= 16 ? 2 : 4;
  const yLabels = [0, Math.round(max*0.5), Math.round(max)];

  let svgContent = '';

  // Grid
  svgContent += yLabels.map(yv => {
    const cy = padT + plotH - ((yv-min)/(max-min))*plotH;
    return `<line x1="${padL}" y1="${cy}" x2="${W-padR}" y2="${cy}" stroke="rgba(24,23,18,0.06)" stroke-width="1"/>
    <text x="${padL-4}" y="${cy+4}" fill="rgba(24,23,18,0.3)" font-size="8" text-anchor="end" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">${yv}</text>`;
  }).join('');

  // Each series
  series.forEach(({label, data, color}) => {
    let pathD = '';
    let prevPt = null;
    data.forEach((v,i) => {
      if(v===null){prevPt=null;return;}
      const x = padL + i*xStep;
      const y = padT + plotH - ((v-min)/(max-min))*plotH;
      if(prevPt) pathD += ` M${prevPt.x},${prevPt.y} L${x},${y}`;
      prevPt={x,y};
    });
    svgContent += `<path d="${pathD}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,3" fill="none" opacity="0.7"/>`;
    data.forEach((v,i) => {
      if(v===null) return;
      const x = padL + i*xStep;
      const y = padT + plotH - ((v-min)/(max-min))*plotH;
      svgContent += `<circle cx="${x}" cy="${y}" r="3.5" fill="${color}" opacity="0.9"/>`;
    });
  });

  // X axis
  svgContent += weeks.map((w,i) => i%xLabelStep===0
    ? `<text x="${padL+i*xStep}" y="${H-padB+14}" fill="rgba(24,23,18,0.3)" font-size="8" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">W${w}</text>`
    : '').join('');

  // Legend
  const legendY = H - 8;
  const legendItems = series.map((s,i) =>
    `<circle cx="${padL+i*80+4}" cy="${legendY}" r="3" fill="${s.color}"/>
     <text x="${padL+i*80+11}" y="${legendY+4}" fill="${s.color}" font-size="8" font-family="Helvetica Neue,Helvetica,Geist,sans-serif">${s.label}</text>`
  ).join('');

  return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">
    <div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--lift);margin-bottom:10px">${title}</div>
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;overflow:visible">
      ${svgContent}${legendItems}
    </svg>
  </div>`;
}
