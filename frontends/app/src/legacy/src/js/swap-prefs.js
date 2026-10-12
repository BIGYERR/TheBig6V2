import { isTrackableWeight } from './exercise-kinds.js';
import { _BW_KEEP_FIXED, _bwSetsFromDetail } from './power-accessory.js';
import { _stripCapCue, applyInjuryFilter } from './injury.js';
import { _repFloor } from './region-caps.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── Swap preferences: a swap the athlete made, carried into every build (applySwapPrefs) with its detail and injury check. ──
// Survives the athlete's injury plan? Wrapped as a throwaway section so the real
// filter does the judging — no second copy of the drop rules.
function _swapInjuryOK(name,cfg){
  if(!cfg||!cfg.injury) return true;
  try{
    const out=applyInjuryFilter([{label:'x',items:[{name:name,detail:'3×5'}]}],cfg);
    return !!(out&&out[0]&&out[0].items&&out[0].items.length&&out[0].items[0].name===name);
  }catch(e){ return true; }
}
// Name-level substitution over a day's sections. Returns true when anything changed.
// Section labels embed the exercise name ("Main — Deadlift"), so they move too, the
// same way bodyweightSweep handles it.
// A swap or an add can land on a movement that has no load to move. Between two loaded
// movements the prescription carries verbatim and stays honest, because pure RPE
// self-corrects — "4×5 @ RPE 8" means something on any bar. It does not survive the jump
// to bodyweight: "3×10–12 at RPE 7" on a pushup is a guess at the athlete's capacity, not
// an instruction, and the sheet's own promise ("whatever you pick keeps 3×10–12 at RPE 7")
// is then false for anyone who can do thirty of them.
//
// No new dialect for this. The three pieces already exist and are already tested:
// _repFloor knows which movements are unloadable, _BW_KEEP_FIXED protects the ones that
// legitimately carry a number anyway (timed holds, plyos, carries, core bracing), and
// _bwSetsFromDetail writes the copy the bodyweight tier has shipped since V94. This is
// the same conversion bodyweightSweep runs, reached from the swap sheet instead of from
// the config. (V119. §12 records the general case: 58.7% of unloadable-movement
// prescriptions still arrive from generation with a fixed rep target on every other tier.)
function _swapDetailFor(name,detail,out){
  if(!name||!detail) return detail;
  const fl=(typeof _repFloor==='function')?_repFloor(name):null;
  // V221 D177 (R1, R2). A swapped Main is prescribed the way the engine would have
  // prescribed the candidate in that slot: scheme()'s floor branch, on the wave Main
  // grammar and nothing else. The detail must start `S×R — RPE ` with R a number or a
  // lo–hi range, and the low end is compared exactly as scheme() compares it. Under the
  // window's low end the rep token becomes the window; sets, RPE, note, ramp-up and rest
  // carry byte for byte. At or above it the donor carries verbatim. The null row never
  // gets here with a window, so barbell compounds carry verbatim too.
  // This sits BEFORE the _BW_KEEP_FIXED test on purpose: that regex holds `rotational`,
  // which would shut out Landmine rotational press, a loaded lift the unilateral row windows.
  // `out` is optional. A caller that passes one learns the window fired (the swap toast).
  if(fl&&fl[1]!==0){
    const m=/^(\d+×)(\d+(?:–\d+)?)( — RPE )/.exec(detail);
    if(m){
      const lo=parseInt(m[2],10);
      if(!(lo>=fl[0])){
        if(out) out.win=[fl[0],fl[1]];
        return m[1]+fl[0]+'–'+fl[1]+detail.slice(m[1].length+m[2].length);
      }
    }
    return detail;
  }
  if(!(fl&&fl[1]===0)) return detail;                 // movement can express a rep target
  if(_BW_KEEP_FIXED.test(name)) return detail;        // holds, plyos, carries, core
  // TWO SYSTEMS HAVE TO AGREE. _repFloor's unloadable clause is a broad regex
  // (/\bdips\b|pushup/), so it also catches five movements the LOG side is about to hand
  // a weight field to: Bench dips, Weighted dips, Glute-ham raise, Pushup variation
  // (weighted), Single-leg glute bridge (weighted). If the app will show you somewhere to
  // write a number, a rep target is a real instruction and must not be taken away.
  // Harvested from the file, not hand-listed — five of 217 names disagree.
  try{ if(typeof isTrackableWeight==='function' && isTrackableWeight(name,detail)) return detail; }catch(e){}
  if(!/^\s*\d+\s*[×x]\s*\d/.test(detail)) return detail;  // already open-ended
  return _bwSetsFromDetail(detail);
}
function applySwapPrefs(sections,map){
  if(!Array.isArray(sections)||!map) return false;
  let hit=false;
  sections.forEach(sec=>{
    if(!sec||!Array.isArray(sec.items)) return;
    sec.items.forEach(it=>{
      if(!it||!it.name) return;
      const to=map[it.name];
      if(!to||to===it.name) return;
      const was=it.name;
      it.name=to; hit=true;
      it.detail=_swapDetailFor(to,_stripCapCue(it.detail));
      if(sec.label&&sec.label.indexOf(was)>=0) sec.label=sec.label.split(was).join(to);
    });
  });
  return hit;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _swapDetailFor, _swapInjuryOK, applySwapPrefs };
