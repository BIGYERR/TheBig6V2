#!/usr/bin/env python3
# V220 slice 6 of ~14. No version bump in this slice.
#   D175 (P-POPCOND) logic part 1 of 2: popContext / popEligible / popPick read the TRAINED day.
# Ruling: tests/measure/v220_rulings/p_popcond_ruling.md s1c (two lenses), s2a (predicates),
#         s3 (what does not change), s6 (Mario's decisions).
# Session call (coordinator, no-day edge only): no resolvable trained day -> context unknown ->
#   every tagged entry (any when or type) is ineligible; untagged entries stay eligible.
# Unchanged: popText, the rotation (last-index exclusion, ia_pop_idx_), pools, POP_CFG, popFire.
# Callers are threaded in slice 7; until then popFire calls popPick(tier) and the context is
# unknown, which is expected on this intermediate tree.
# No backslashes and no non-ASCII in this script.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, 'rb').read().decode('utf-8')

A1_OLD = """// Pool entries may be a plain string, or {t, when} where `when` gates eligibility
// by context ('weekend' = Sat/Sun, 'morning' = before 9am, evaluated at fire time).
"""
A1_NEW = """// Pool entries may be a plain string, or {t, when, type}; a tag gates eligibility on the
// TRAINED day, read from activeProg.weeks the way maybeShowReminder reads it. V220 (D175):
//   when:'weekend'  the trained day is a Saturday or Sunday (dayDateFor, not the tap clock)
//   when:'morning'  before 9am on the clock AND the trained day is today; a past-day mark
//                   never draws a morning line (the record carries the tap time, not the hour)
//   type:'cardio'   the day has cardio (!!day.cardio, the dayCode lens)
//   type:'lift'     dayCode's lift-section test minus sections labelled mobility or taper
//                   (D18's vocabulary: a Post-run mobility day is not lifting, a Primer is)
// Both tags must pass. With no resolvable day (no week/dayKey, no startDate, no day object)
// the context is unknown: every tagged entry sits out, untagged entries stay eligible.
"""

A2_OLD = """function popContext(){
  const now=new Date(); const dow=now.getDay();
  return { weekend:(dow===0||dow===6), morning:(now.getHours()<9) };
}
"""
A2_NEW = """function popContext(week,dayKey){
  const day=(week!=null&&dayKey&&activeProg?.weeks)?activeProg.weeks[week]?.[dayKey]:null;
  const dt=day?dayDateFor(week,dayKey):null;
  if(!dt) return { known:false };
  const now=new Date(); const today=new Date(now); today.setHours(0,0,0,0);
  const dow=dt.getDay();
  return {
    known:true,
    weekend:(dow===0||dow===6),
    morning:(now.getHours()<9&&dt.getTime()===today.getTime()),
    cardio:!!day.cardio,
    lift:(day.sections||[]).some(s=>!s.core&&!s.hip&&(s.items||[]).length&&!/mobility|taper/i.test(s.label||''))
  };
}
"""

A3_OLD = """function popEligible(e,ctx){
  const when=(e&&typeof e==='object')?e.when:null;
  if(!when) return true;
  if(when==='weekend') return ctx.weekend;
  if(when==='morning') return ctx.morning;
  return true;
}
"""
A3_NEW = """function popEligible(e,ctx){
  const tag=(e&&typeof e==='object')?e:null;
  const when=tag?tag.when:null, type=tag?tag.type:null;
  if(!when&&!type) return true;
  if(!ctx||!ctx.known) return false;
  if(when==='weekend'&&!ctx.weekend) return false;
  if(when==='morning'&&!ctx.morning) return false;
  if(type==='cardio'&&!ctx.cardio) return false;
  if(type==='lift'&&!ctx.lift) return false;
  return true;
}
"""

A4_OLD = """function popPick(tier){
  const pool=POP_POOLS[tier]; if(!pool||!pool.length) return '';
  const ctx=popContext();
"""
A4_NEW = """function popPick(tier,week,dayKey){
  const pool=POP_POOLS[tier]; if(!pool||!pool.length) return '';
  const ctx=popContext(week,dayKey);
"""

EDITS = [
    ('D175-LENS header comment', A1_OLD, A1_NEW),
    ('D175-LENS popContext', A2_OLD, A2_NEW),
    ('D175-LENS popEligible', A3_OLD, A3_NEW),
    ('D175-LENS popPick head', A4_OLD, A4_NEW),
]

for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (name, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('ok   %s' % name)

open(P, 'wb').write(src.encode('utf-8'))
print('wrote', P)
