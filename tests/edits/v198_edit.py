#!/usr/bin/env python3
# V198 (D85) — THE BUDGET MAY NOT SPEND THE DAY'S LAST POSTERIOR CHAIN ITEM.
# Anchor-asserted edit script. Every anchor count==1 before any write; first miss aborts.
# Literal bytes only (real em-dashes, real arrows). Version meta bump is LAST.
import io, sys, os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
SRC = os.path.normpath(SRC)
with io.open(SRC, 'r', encoding='utf-8') as f:
    s = f.read()

EDITS = []

# ── EDIT 1: the posterior floor, inside capSessionBudget's trim loop ───────────────
A1 = """  const _itemRank=n=>/carry/i.test(n||'')?2:(/wall sit|\\bhold\\b/i.test(n||'')?1:0);
  let guard=0;
  while(_total(out)>cap && guard++<16){
    let best=null;
"""
B1 = """  const _itemRank=n=>/carry/i.test(n||'')?2:(/wall sit|\\bhold\\b/i.test(n||'')?1:0);
  // ── V198 (D85): THE BUDGET MAY NOT SPEND THE DAY'S LAST POSTERIOR CHAIN ITEM ────
  // Same shape as D50's trunk floor, same boundary, different training quality. The
  // three regional guards and the lowback/protect pool override do their work correctly
  // and hand this function a card that loads the posterior chain; the budget then trims
  // the last hinge or hip_ext off it and prints a leg day that never extends a hip.
  // An earlier diagnosis blamed applyInjuryFilter and was RETRACTED: at lowback/protect
  // hinge is dropped and hip_ext is CAPPED, and the pool override deliberately refills
  // the rail with the spine-safe names. The filter is correct. The budget was eating it.
  //
  // UNCONDITIONAL, by ruling. Not scoped to cfg.injury, not to a region, not to an
  // equipment tier — scoping it would encode "the budget may spend a HEALTHY athlete's
  // last posterior item", which is exactly the encoding D84 refused when it declined to
  // scope the Calves reorder to knee/protect. Measured healthy + shoulder cost: 226
  // zero-posterior weeks.
  //
  // THE SET IS {hinge, hip_ext} AND NOTHING ELSE. Both are _PATTERN_REGION 'legs'.
  // _pattern already routes hip thrust / glute bridge / glute-ham / GHR / nordic / back
  // extension / hyperextension / reverse hyper / pull-through to hip_ext, which covers
  // every name the budget was deleting. leg_iso is DELIBERATELY EXCLUDED: EXLIB
  // .leg_accessory holds 'Leg extension' and 'Leg press' alongside 'Lying leg curl', so
  // leg_iso is not a posterior signal — counting it would call a pure quad movement
  // posterior chain. _pattern is called directly so this guard and the region caps can
  // never disagree about what a hinge is.
  //
  // <=1 IS NOT A TUNING CONSTANT. It is the boundary between nonempty and empty, the
  // same boundary D50 used. One hinge done properly on a tight day is a coachable
  // prescription; zero is not. The second item of a pair stays budget fodder.
  //
  // COUNTED LIVE. The count is taken on `out` at the top of each trim iteration, never
  // precomputed before the loop: the loop mutates `out`, and a stale count would let the
  // last item through on a later pass.
  //
  // NOTHING IS EVER ADDED. The floor only refuses to REMOVE something already on the
  // card, so it cannot resurrect anything applyInjuryFilter dropped — which is precisely
  // why it is safe to run after the refilter.
  //
  // THE DAY MAY END OVER CAP, by ruling. When every remaining candidate is ineligible
  // (the last hinge/hip_ext plus the tier-3 barbell skip) a skipped candidate simply
  // never becomes `best`, and `if(!best) break` below exits with the day over cap rather
  // than spinning. guard++<16 is the backstop, not the mechanism. §10b already records
  // that this cap has never been hard, and 63 of the affected cells were over cap before
  // this change. Follow-ons, not this build: D88 (draw-side zero-posterior weeks) and
  // D89 (re-sourcing the tier-3 skip).
  const _isPost=n=>{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; };
  const _postItems=()=>out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPost(it&&it.name)?1:0),0),0);
  let guard=0;
  while(_total(out)>cap && guard++<16){
    const _postLeft=_postItems();                          // live, re-read every iteration
    let best=null;
"""
EDITS.append((A1, B1, 'D85 posterior floor helpers + per-iteration live count'))

# ── EDIT 2: the candidate skip itself, beside the tier-3 skip ──────────────────────
A2 = """        if(_compoundTier(it.name)===3) return;            // barbell compounds are never budget fodder
"""
B2 = """        if(_compoundTier(it.name)===3) return;            // barbell compounds are never budget fodder
        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder
"""
EDITS.append((A2, B2, 'D85 candidate skip beside the tier-3 skip'))

# ── EDIT 3: version meta bump (LAST) ──────────────────────────────────────────────
A3 = '<meta name="ia-version" content="197">'
B3 = '<meta name="ia-version" content="198">'
EDITS.append((A3, B3, 'ia-version 197 -> 198'))

# assert every anchor exactly once BEFORE writing anything
fail = False
for a, b, why in EDITS:
    c = s.count(a)
    print('anchor count=%d  %s' % (c, why))
    if c != 1:
        fail = True
        break
if fail:
    sys.stderr.write('ABORT: anchor not unique. Nothing written.\n')
    sys.exit(1)

for a, b, why in EDITS:
    assert s.count(a) == 1, why
    s = s.replace(a, b, 1)

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)
print('WROTE %s' % SRC)
