#!/usr/bin/env python3
# V196 slice 1 — D57 / D58 / D59 core: ledgerModel main branch + buildMainLiftBlock.
# No version bump here (slice 2 owns the meta bump, last replacement).
import io, sys

P = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = io.open(P, encoding="utf-8").read()

EDITS = []

# ── 1. ledgerModel: the unconditional drop ────────────────────────────────
OLD1 = """    const mainEns=all.filter(en=>_slotOfEntry(hist,name,en)==='main');
    if(mainEns.length){
      const loaded=mainEns.filter(en=>+en.weight>0);
      if(!loaded.length) return;
      const first=loaded[0];
      const heavy=loaded.reduce((a,b)=>(+b.weight>+a.weight?b:a),loaded[0]);
      const hs=_setsOf(heavy), fs=_setsOf(first);
      mains.push({name, series:loaded.map(en=>({w:en.week, wt:+en.weight})),
        heavy:{wt:+heavy.weight, reps:hs.length?Math.max.apply(null,hs):null, week:heavy.week},
        first:{wt:+first.weight, reps:fs.length?Math.max.apply(null,fs):null},
        hidden: all.length-mainEns.length});
      return;
    }
"""

NEW1 = """    const mainEns=all.filter(en=>_slotOfEntry(hist,name,en)==='main');
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
"""
EDITS.append(("ledgerModel main branch", OLD1, NEW1))

# ── 2. buildMainLiftBlock: same geometry, two units ───────────────────────
OLD2 = """// ── main lift block: heaviest set, then real working weight ────────────────
function buildMainLiftBlock(m, unit){
  const disp=w=>(unit==='kg')?Math.round(w*0.453592*2)/2:Math.round(w);
  const u=(unit==='kg')?'kg':'lbs';
  const hv=m.heavy, fs=m.first;
  const hLbl=disp(hv.wt)+(hv.reps?'×'+hv.reps:'');
  const fLbl=disp(fs.wt)+(fs.reps?'×'+fs.reps:'');
  let chart='';
  if(m.series.length>=2){
    const W=320,H=108,padL=34,padR=10,padT=14,padB=20;
    const plotW=W-padL-padR, plotH=H-padT-padB;
    const ws=m.series.map(p=>p.wt);
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
    m.series.forEach((p,i)=>{ d+=(i?' L':'M')+(padL+i*xs).toFixed(1)+','+yof(p.wt).toFixed(1); });
    s+='<path d="'+d+'" stroke="var(--lift)" stroke-width="1.5" fill="none" opacity="0.55"/>';
    m.series.forEach((p,i)=>{
      const top=(p.wt===hv.wt&&p.w===hv.week);
      s+='<circle cx="'+(padL+i*xs).toFixed(1)+'" cy="'+yof(p.wt).toFixed(1)+'" r="'+(top?4.5:3.2)+'" fill="var(--lift)" opacity="'+(top?1:0.72)+'"/>';
    });
    const lblStep=Math.max(1,Math.ceil(m.series.length/6));
    m.series.forEach((p,i)=>{ if(i%lblStep===0) s+=_axTx(padL+i*xs, H-4, 'W'+p.w, 8, 'middle'); });
    chart='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'+s+'</svg>';
  }
  const gain=disp(hv.wt)-disp(fs.wt);
  return '<div style="padding:12px 0;border-bottom:1px solid var(--border)">'
    +'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">'
    +'<div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.3">'+m.name+'</div>'
    +'<div style="font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--lift);white-space:nowrap">'+hLbl+'</div></div>'
    +'<div style="font-size:11px;color:var(--muted);margin:2px 0 8px">Opened at <b style="color:var(--text)">'+fLbl+'</b>'
    +(gain>0?' · up <b style="color:var(--lift)">'+gain+' '+u+'</b>':'')
    +' · heaviest in week '+hv.week+'</div>'+chart+'</div>';
}"""

NEW2 = """// ── main lift block: the top set, in whichever unit was written down ───────
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
}"""
EDITS.append(("buildMainLiftBlock", OLD2, NEW2))

fail = False
for label, old, new in EDITS:
    n = src.count(old)
    print("anchor %-28s count=%d" % (label, n))
    if n != 1:
        fail = True
if fail:
    sys.exit("ABORT: anchor count != 1, nothing written")

for label, old, new in EDITS:
    src = src.replace(old, new, 1)

io.open(P, "w", encoding="utf-8").write(src)
print("WROTE", P)
