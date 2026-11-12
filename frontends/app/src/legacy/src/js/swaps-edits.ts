import { iaStore } from './storage.ts';
import { _ssLegal, _ssPartnerOf } from '../../../../../../core/src/engine/exercise-library.ts';
import {
  addSwapRecord, countSwap, dropSwapRecord, markSwapNudged, readSwaps,
} from '../../../../../../core/src/engine/state-swaps.ts';
import {
  addAddEdit, addSkipEdit, dropAddEdit, dropSkipEdit, pruneDayEditsBefore, readDayEdits,
} from '../../../../../../core/src/engine/state-day-edits.ts';
import { _powerAllowed } from '../../../../../../core/src/engine/power-accessory.ts';
import { applyInjuryFilter } from '../../../../../../core/src/engine/injury.ts';
import { _AUX_FAMILY, _auxFamily, _auxGearOK, _pattern } from '../../../../../../core/src/engine/region-caps.ts';
import { _swapInjuryOK, applySwapPrefs } from '../../../../../../core/src/engine/swap-prefs.ts';
import { _PATTERN_REGION, _compoundTier } from '../../../../../../core/src/engine/budget-engine-d.ts';
import { parseRx } from './week-view-sections.ts';
import { dayOverlayInfo } from './overlays.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// Which region a pattern belongs to (for ceiling bookkeeping + interference).
// ── EXERCISE SWAP ────────────────────────────────────────────────────────────
// Session-scoped substitution. The athlete trades one lift for another on the day
// in front of them; the program itself is untouched and next week says what it
// always said. Three tiers of judgment, in order:
//
//   1. SAME JOB     — identical movement pattern. The week keeps its shape: same
//                     region loaded, same spacing, same prescription carries over.
//   2. SAME DAY     — same region, different pattern. Volume holds, the specific
//                     quality (a heavy hinge, a vertical pull) is given up.
//   3. nothing else — deliberately not offered. A curl does not replace a main
//                     deadlift; that is abandoning the day, not swapping it.
//
// Candidates come from the harvested pick() universe. V210 (D150) passes that universe
// through the build's own gear lens (_gearOK, and on the bodyweight tier the sweep's own
// test) before anyone reads it, so they are equipment-legal; travel variants are built by
// the same buildProgram, so their keyed universes are too. They are then run through
// applyInjuryFilter so an active injury plan governs the swap sheet exactly as it
// governs generation.
function swapUniverseFor(prog: any,week: any,day: any){
  if(!prog) return [];
  // V175 (D27): keyed by the DAY's overlay stamp, not by week — a one-day trip leaves
  // the rest of the week on the rack. A base day, or a frozen day whose overlay has
  // since been removed, falls to the base universe.
  const _k=day&&day._ovKey;
  const byKey=_k&&prog._swapUniverseByKey&&prog._swapUniverseByKey[_k];
  if(Array.isArray(byKey)&&byKey.length) return byKey;
  return Array.isArray(prog._swapUniverse)?prog._swapUniverse:[];
}
// D194 R1 (P-INJLENS), measure CF4 reading: the plan that governs a card is the plan of the day the card is on.
// Outside buildProgram the injury is read off the day's own overlay stamp (_ovKey via dayOverlayInfo, the carrier
// swapUniverseFor already keys on). A day whose stamp carries no injury key (no stamp, or a travel stamp) keeps
// prog.cfg's injury, which is what that day's build used. Injury only: every other field is prog.cfg's.
function _dayPlanCfg(prog: any,day: any){
  const base=(prog&&prog.cfg)||{};
  const ov=dayOverlayInfo(day);
  if(!ov||!ov.patch||!Object.prototype.hasOwnProperty.call(ov.patch,'injury')) return base;
  return Object.assign({},base,{injury:ov.patch.injury});
}
// Candidates for the ADD picker (V109). Same legality machinery as swapCandidates —
// same universe harvest (travel-spliced, equipment-legal), same injury filter, same
// on-card dedupe — but cut into different tiers.
//
// Crucially this does NOT filter to the day's own region. "I want hip thrusts twice a
// week" is a real request, and a push day should still offer them; blocking the athlete
// is paternalistic, offering it silently is negligent. So off-region candidates appear,
// with what they actually collide with stated on the row.
function addCandidates(day: any,week: any,prog: any){
  const cfg=_dayPlanCfg(prog,day);   // D194 R1
  const onCard=Object.create(null), patsOnCard=Object.create(null);
  let dayRegion: any=null;
  ((day&&day.sections)||[]).forEach(function(s: any){((s&&s.items)||[]).forEach(function(it: any){
    if(!it||!it.name) return;
    onCard[it.name.toLowerCase()]=1;
    const p=_pattern(it.name);
    if(p){ patsOnCard[p]=(patsOnCard[p]||0)+1; if(!dayRegion) dayRegion=_PATTERN_REGION[p]; }
  });});
  const gap: any[]=[],more: any[]=[],off: any[]=[];
  swapUniverseFor(prog,week,day).forEach(function(n: any){
    if(!n) return;
    if(onCard[n.toLowerCase()]) return;
    const p=_pattern(n); if(!p) return;
    if(!_swapInjuryOK(n,cfg)) return;
    const r=_PATTERN_REGION[p];
    if(r&&dayRegion&&r!==dayRegion){ off.push(n); return; }
    if(patsOnCard[p]) more.push(n); else gap.push(n);
  });
  const rank=function(a: any,b: any){const ta=_compoundTier(a),tb=_compoundTier(b);if(ta!==tb)return tb-ta;return a.localeCompare(b);};
  return {gap:gap.sort(rank).slice(0,6),more:more.sort(rank).slice(0,5),off:off.sort(rank).slice(0,6),
          region:dayRegion,pats:patsOnCard};
}
// Dose for an added movement (V163, D1–D4): resolved by nearest TYPE match in the live
// week's own accessory prescriptions, never by textual position on the card. The V109 walk
// took whatever parseable detail sat last — on hybrid leg days that was the optional
// loaded-carry finisher, and parseRx reads its '3×40 yards heavy' as 40 REPS (the yd unit
// token matches 'yd', never 'yards'), so a barbell hip thrust shipped carrying a forty-rep
// prescription. Tiers: same pattern on today's card, then same pattern anywhere this week,
// then same region anywhere this week, then the conservative fallback. Main and primer
// sections never donate — added work is accessory by nature — and supersets, core and hip
// blocks keep their V109 exclusion. Deload-awareness survives by construction: every donor
// is read from the live week, so a lighter week donates lighter doses.
function _addRxKind(detail: any,name: any){
  // D2 type fence: a rep lift may only inherit a rep dose or an open RPE-set dose. Distance
  // and time shapes are refused by STRING as well as by parse — spelled-out units ('yards',
  // 'meters') defeat parseRx's unit token and come back dressed as reps.
  const d=(detail||'');
  if(/\byards?\b|\byd\b|\bmeters?\b|\bsec\b|\bmin\b|\bhold\b|max time/i.test(d)) return null;
  const rx=parseRx(d,name||'');
  if(!rx) return null;
  if(rx.kind==='dist'||rx.kind==='sec') return null;
  return rx.open?'open':'reps';
}
function addedDetailFor(day: any,name: any,week: any,prog: any){
  const pat=_pattern(name)||null;
  const region=pat?_PATTERN_REGION[pat]:null;
  const donors=function(d: any){
    const out: any[]=[];
    ((d&&d.sections)||[]).forEach(function(s: any){
      if(!s||s._added||s.core||s.hip||s.superset||s.type==='superset') return;
      if(/^(main|primer)/i.test(s.label||'')) return;
      (s.items||[]).forEach(function(it: any){
        if(!it||!it.name||!it.detail) return;
        if(!_addRxKind(it.detail,it.name)) return;
        out.push(it);
      });
    });
    return out;
  };
  const today=donors(day);
  // Tier 1: same pattern on today's card. Last match wins — accessories sit lowest.
  if(pat){
    for(let i=today.length-1;i>=0;i--) if(_pattern(today[i].name)===pat) return today[i].detail;
  }
  // Tiers 2 and 3 read the rest of the live week in calendar order, deterministically.
  const wk=(prog&&prog.weeks&&prog.weeks[week])||null;
  if(wk&&pat){
    const order=['mon','tue','wed','thu','fri','sat','sun'];
    const days: any[]=[]; order.forEach(function(k){if(wk[k])days.push(wk[k]);});
    for(let i=0;i<days.length;i++){
      const ds=donors(days[i]);
      for(let j=0;j<ds.length;j++) if(_pattern(ds[j].name)===pat) return ds[j].detail;
    }
    if(region) for(let i=0;i<days.length;i++){
      const ds=donors(days[i]);
      for(let j=0;j<ds.length;j++){
        const q=_pattern(ds[j].name);
        if(q&&_PATTERN_REGION[q]===region) return ds[j].detail;
      }
    }
  }
  // Nothing type-compatible anywhere in the week: conservative accessory dose, unchanged
  // since V109. Also the landing spot for a null-pattern name, which addCandidates never
  // offers — defensive, not reachable from the sheet.
  return '3\u00d710 \u2014 RPE 7';
}
function swapCandidates(outName: any,day: any,week: any,prog: any){
  const cfg=_dayPlanCfg(prog,day);   // D194 R1
  const outPat=_pattern(outName);
  const outRegion=outPat?_PATTERN_REGION[outPat]:null;
  // Already on today's card — never offer a duplicate movement.
  const onCard=Object.create(null);
  // @ts-expect-error TS7006 Parameter 's' implicitly has an 'any' type.
  ((day&&day.sections)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{if(it&&it.name)onCard[it.name.toLowerCase()]=1;}));
  const t1: any[]=[],t2: any[]=[];
  const _ssP=_ssPartnerOf(day,outName);   // V164 D5: superset members only offer station-legal partners
  // @ts-expect-error TS7006 Parameter 'n' implicitly has an 'any' type.
  swapUniverseFor(prog,week,day).forEach(n=>{
    if(!n||n===outName) return;
    if(onCard[n.toLowerCase()]) return;
    const p=_pattern(n);
    if(!p) return;                                    // holds and core are not lift swaps
    if(!_swapInjuryOK(n,cfg)) return;
    if(_ssP&&!_ssLegal(n,_ssP)) return;               // V164 D5
    if(outPat&&p===outPat){ t1.push(n); return; }
    if(outRegion&&_PATTERN_REGION[p]===outRegion) t2.push(n);
  });
  // Rank by how close the candidate is in LOAD to the lift being replaced, so the top
  // of the list is always the nearest like-for-like rather than whatever sorts first.
  const outTier=_compoundTier(outName);
  const rank=(a: any,b: any)=>{
    const da=Math.abs(_compoundTier(a)-outTier),db=Math.abs(_compoundTier(b)-outTier);
    if(da!==db) return da-db;
    const ta=_compoundTier(a),tb=_compoundTier(b);
    if(ta!==tb) return tb-ta;
    return a.localeCompare(b);
  };
  return {tier1:t1.sort(rank).slice(0,8),tier2:t2.sort(rank).slice(0,5),pattern:outPat,region:outRegion};
}
// Honest note when a candidate is materially lighter than what it replaces. Not a
// reason to hide it — an athlete with a tweaked shoulder may want exactly this — but
// it should not read as a like-for-like trade when it isn't.
function swapLoadNote(outName: any,candName: any){
  const d=_compoundTier(outName)-_compoundTier(candName);
  if(d<2) return '';
  return 'Much lighter than '+outName.toLowerCase()+'. Volume holds, top-end strength does not.';
}
// ── SESSION SWAPS, SWAP COUNTS AND DAY EDITS (ia_swaps_, ia_swapct_, ia_edits_) ──
// v0.261.6 (docs/decisions/stored-state.md): what a swap, an add, a skip and the nudge store lives in @ia/core, in
// core/src/engine/state-swaps.ts and state-day-edits.ts, with the reasons each store exists. These are the page's
// callers: the swap sheet passes the program, the week and the day, and they pass the store and the tap's instant.
// Laying the records onto a rebuilt grid (applySessionSwaps, applyDayEdits) stays here with refreshProgram.
function getDayEdits(pid: any): any{return readDayEdits(iaStore,pid);}
function recordSkip(pid: any,week: any,dayKey: any,name: any): any{return addSkipEdit(iaStore,pid,week,dayKey,name);}
function clearSkip(pid: any,week: any,dayKey: any,name: any): any{return dropSkipEdit(iaStore,pid,week,dayKey,name);}
function recordAdd(pid: any,week: any,dayKey: any,name: any,detail: any): any{return addAddEdit(iaStore,pid,week,dayKey,name,detail,Date.now());}
function clearAdd(pid: any,week: any,dayKey: any,name: any): any{return dropAddEdit(iaStore,pid,week,dayKey,name);}
// A skipped superset is stored as '__ss:<sectionIndex>' rather than by name, because the
// whole block goes: its items are interdependent (rounds with no rest between them), so
// pulling one movement changes the work:rest ratio, which IS the prescription.
function ssSkipToken(secIdx: any){return '__ss:'+secIdx;}
// Re-applied at the very end of refreshProgram beside moves and swaps. Idempotent by
// construction: skip marks a flag rather than splicing (so a second pass re-marks the
// same item), and add checks for the name before pushing.
function applyDayEdits(prog: any,store: any){
  if(!prog||!prog.weeks||!store) return;
  Object.keys(store).forEach(function(k){
    const m=/^w(\d+)_(.+)$/.exec(k); if(!m) return;
    const w=+m[1],d=m[2];
    const day=prog.weeks[w]&&prog.weeks[w][d];
    if(!day||!Array.isArray(day.sections)) return;
    const e=store[k]||{}, skips=e.skip||[], adds=e.add||[];
    // Skipped items are FLAGGED, never removed. The struck-through stub is what tells
    // the athlete the difference between "the engine never programmed this" and "I
    // bailed on this", and it is the only affordance for putting it back.
    day.sections.forEach(function(sec: any,si: any){
      // The athlete's own added block is never subject to skip flagging. Add and skip are
      // disjoint operations — an added movement is taken off with clearAdd, not skipped —
      // and enforcing that here is what makes this pass ORDER-INDEPENDENT. Without it, a
      // store holding both an add and a skip for the same name flags nothing on the first
      // pass (the item does not exist yet) and flags it on the second, so the function is
      // not idempotent and refreshProgram produces a different day on every boot.
      if(sec._added) return;
      const ssKilled=skips.indexOf(ssSkipToken(si))>=0;
      if(sec.superset) sec._skipped=ssKilled||undefined;
      (sec.items||[]).forEach(function(it: any){
        // V162 (ruling R2): members of a live round skip individually by name. The
        // block token above still kills the whole round; both survive a re-apply.
        it._skipped = (skips.indexOf(it.name)>=0) || undefined;
      });
    });
    if(adds.length){
      let bucket=day.sections.filter(function(s: any){return s._added;})[0];
      if(!bucket){ bucket={label:'Added by you',_added:true,items:[]}; day.sections.push(bucket); }
      adds.forEach(function(a: any){
        if(!a||!a.name) return;
        if(bucket.items.some(function(it: any){return it.name===a.name;})) return;
        bucket.items.push({name:a.name,detail:a.detail||'',_addedByUser:true});
      });
    }
  });
}
// Every week below the freeze cut gives up its edits (state-day-edits.ts has why). refreshProgram calls it.
function pruneDayEdits(pid: any,cutWeek: any){pruneDayEditsBefore(iaStore,pid,cutWeek);}
function getSwaps(pid: any): any{return readSwaps(iaStore,pid);}
function recordSwap(pid: any,week: any,dayKey: any,from: any,to: any,rx: any): any{return addSwapRecord(iaStore,pid,week,dayKey,from,to,rx,Date.now());}
function clearSwap(pid: any,week: any,dayKey: any,from: any): any{return dropSwapRecord(iaStore,pid,week,dayKey,from);}
// Re-applied at the very end of refreshProgram, after the freeze, alongside rest-day
// moves — both are the athlete's own edits, so nothing the engine does should undo
// them. V222 D181 (R4'): a day's records replay in recording order (array order, which
// recordSwap keeps by push) through the same _swapDetailFor the sheet used, so the booted
// card is the card the athlete built. Days the freeze restored from ia_hist_ never reach
// this function (R5).
function applySessionSwaps(prog: any,store: any){
  if(!prog||!prog.weeks||!store) return;
  Object.keys(store).forEach(k=>{
    const m=/^w(\d+)_(.+)$/.exec(k); if(!m) return;
    const w=+m[1],d=m[2];
    const day=prog.weeks[w]&&prog.weeks[w][d];
    if(!day||!Array.isArray(day.sections)) return;
    // V222 D181 (R4'). Records replay in recording order, one per pass, through the same
    // _swapDetailFor the sheet used, so each hop's detail comes from the hop before it.
    // @ts-expect-error TS7006 Parameter 'e' implicitly has an 'any' type.
    const list=(store[k]||[]).filter(e=>e&&e.from&&e.to);
    let hit=false;
    const _renamed: any[]=[];   // V229 D193 (A3 s4) / D194 R6: the items this replay renamed, by identity
    // @ts-expect-error TS7006 Parameter 'e' implicitly has an 'any' type.
    list.forEach(e=>{
      const m1=Object.create(null); m1[e.from]=e.to;
      // @ts-expect-error TS7006 Parameter 's' implicitly has an 'any' type.
      const _was: any[]=[]; day.sections.forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(it&&it.name===e.from) _was.push(it); }));
      if(applySwapPrefs(day.sections,m1)) hit=true;
      _was.forEach(it=>{ if(it.name!==e.from&&_renamed.indexOf(it)<0) _renamed.push(it); });
    });
    if(hit && _dayPlanCfg(prog,day).injury){
      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through
      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });
      day.sections=applyInjuryFilter(day.sections,_dayPlanCfg(prog,day));
    }
  });
}
// ── COACH NUDGE ──────────────────────────────────────────────────────────────
// Three swaps running of one lift to one replacement is a preference, and the app says so (state-swaps.ts has the
// count and its reasons). The swap sheet counts each swap; the nudge marks a lift offered when it is answered.
function bumpSwapCount(pid: any,from: any,to: any): any{return countSwap(iaStore,pid,from,to);}
function markSwapOffered(pid: any,from: any){markSwapNudged(iaStore,pid,from);}
// Candidates for a null-pattern swap: same family, not already on the card, gear-legal,
// injury-legal through the REAL filter (no second copy of the drop rules), and — for the
// power family — through _powerAllowed, so age/experience power doctrine cannot be
// bypassed through the side door of a swap.
function auxSwapCandidates(outName: any,day: any,prog: any){
  const fam=_auxFamily(outName); if(!fam) return [];
  const cfg=_dayPlanCfg(prog,day);   // D194 R1 (equipment unchanged: injury only)
  const onCard=Object.create(null);
  ((day&&day.sections)||[]).forEach(function(s: any){((s&&s.items)||[]).forEach(function(it: any){if(it&&it.name)onCard[it.name.toLowerCase()]=1;});});
  const _ssP=_ssPartnerOf(day,outName);   // V164 D5: same partner filter as swapCandidates
  return Object.keys(_AUX_FAMILY).filter(function(n){
    if(n===outName||_AUX_FAMILY[n]!==fam) return false;
    if(onCard[n.toLowerCase()]) return false;
    if(!_auxGearOK(n,cfg.equipment||'home_full')) return false;
    if(fam==='power'&&typeof _powerAllowed==='function'&&!_powerAllowed(n,cfg.experience,cfg.injury,cfg.ageBracket)) return false;
    if(_ssP&&!_ssLegal(n,_ssP)) return false;         // V164 D5
    return _swapInjuryOK(n,cfg);
  }).sort();
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  _dayPlanCfg, addCandidates, addedDetailFor, applyDayEdits, applySessionSwaps, auxSwapCandidates, bumpSwapCount,
  clearAdd, clearSkip, clearSwap, getDayEdits, getSwaps, markSwapOffered, pruneDayEdits, recordAdd, recordSkip,
  recordSwap, ssSkipToken, swapCandidates, swapLoadNote,
};
