#!/usr/bin/env python3
# V193 slice 4 — D49 (two gear-free anti_rotation members) + the Pallof press gear gate.
# ia-version is NOT touched: this is the fourth slice of V193, already at 193.
import io, sys

P = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = io.open(P, encoding="utf-8").read()

reps = []

# ── EDIT 1 (D49) — anti_rotation grows two gear-free members ──────────────────
# Names are the file's EXISTING spellings, not new coinages:
#   'Bird dogs'          — EXLIB.core, CORE_PILLARS.anti_extension.static, _AUX_FAMILY,
#                          and EX_KEY_ALIAS already folds 'Bird dog' -> 'Bird dogs'.
#   'Plank shoulder taps' — the _BW_SUBS target for 'Dumbbell renegade rows'.
# Dose for both is inherited from 'Pallof press' inside this same pillar (3x12 each),
# per the ruling: nothing invented. Insert order follows coach's ladder
# (bird dog -> side plank -> plank shoulder taps -> Pallof press) WITHOUT reordering any
# existing member relative to another, so no tier's rotation is shifted by a move.
old1 = """  anti_rotation: { // Lateral stability — low fatigue, safe before anything
    name: 'Anti-Rotation',
    items: [
      {name:'Side plank', detail:'3×30–45 sec each'},           // NSW + McGill Big 3
      {name:'Pallof press', detail:'3×12 each'},
"""
new1 = """  anti_rotation: { // Lateral stability — low fatigue, safe before anything
    name: 'Anti-Rotation',
    // V193 (D49): D46-c's gear gate closed an unnamed leak (the two carries were printing
    // on the BODYWEIGHT tier through this pillar), which left the pillar with two legal
    // members there — so it emitted the identical pair {Side plank, Pallof press} on 45 of
    // 45 occurrences. NSW p.7 ("Choose different variations ... for the same basic movement
    // on different days") and p.7 item 7 ("For the trunk, use a variety of static as well as
    // dynamic exercises") both forbid that. A held position still needs a progression
    // ladder, and two members give none. Two gear-free members are added, both legal on
    // every tier, both taking the dose of 'Pallof press' from inside this same pillar.
    // The ladder reads bird dog (contralateral reach, the limb is the load) -> side plank ->
    // plank shoulder taps (the base narrows under a shifting load) -> Pallof press, and
    // 'Side plank' sits in three of the four-member pillar's six pairs, so a static hold
    // still appears in half of all blocks.
    items: [
      {name:'Bird dogs', detail:'3×12 each'},                   // NSW Table 3 + McGill Big 3
      {name:'Side plank', detail:'3×30–45 sec each'},           // NSW + McGill Big 3
      {name:'Plank shoulder taps', detail:'3×12 each'},         // V178 _BW_SUBS target, promoted to member; dose from the member it laddered into
      {name:'Pallof press', detail:'3×12 each'},
"""
reps.append(("D49 anti_rotation members", old1, new1))

# ── EDIT 2 — 'Pallof press' gets a gear tag ───────────────────────────────────
# A Pallof press is a band or cable anti-rotation press. It has no gear tag anywhere:
# _AUX_GEAR held only the three carries, _AUX_FAMILY gives it 'core' (a family, not gear),
# and the name matches no clause in _auxGearOK, so it fell through to `return true` and was
# legal on bodyweight. Same leak class D46-c closed for the carries, hidden because the name
# does not announce its implement — which is precisely what the V177 sidecar exists for.
# The band predicate is the correct one (a Pallof can be run off a band, so it is legal
# wherever bands live: not bodyweight, not minimal), so the sidecar gains a 'band' value
# that reuses the /\bband\b/ clause's exact tier set rather than widening a regex over
# implement keywords with a movement name.
old2 = """const _AUX_GEAR={'Farmer carry':'loaded','Suitcase carry':'loaded','Overhead carry':'loaded'};
function _auxGearOK(name,equip){
  if(_AUX_GEAR[String(name||'').trim()]==='loaded') return equip!=='bodyweight';
"""
new2 = """// V193 (D49): 'Pallof press' joins the sidecar with the BAND predicate. It is a band or
// cable anti-rotation press and is undoable with no equipment, but its name says neither
// word, so every regex below missed it and it fell through to `return true` — legal on a
// bodyweight athlete. Band, not cable, is the right tag: the band is the looser implement
// and the movement genuinely runs off one, so the tier set is the /\\bband\\b/ clause's
// (everything that owns bands: not bodyweight, not minimal).
const _AUX_GEAR={'Farmer carry':'loaded','Suitcase carry':'loaded','Overhead carry':'loaded','Pallof press':'band'};
function _auxGearOK(name,equip){
  const _g=_AUX_GEAR[String(name||'').trim()];
  if(_g==='loaded') return equip!=='bodyweight';
  if(_g==='band') return equip!=='bodyweight'&&equip!=='minimal';
"""
reps.append(("Pallof press gear tag", old2, new2))

# ── EDIT 3 — the D46-c arithmetic comment must state the post-D49 counts ──────
# That comment is the load-bearing note that says the filter can never empty a pillar.
# It currently reads 'anti_rotation 2 on bodyweight and 5 elsewhere', which D49 falsifies.
old3 = """  // (measured, all six tiers — rotational_power 3/3/4/5/7/6 for bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit; anti_rotation 2 on bodyweight and 5
  // elsewhere; dynamic_bracing 4 everywhere), so the filter cannot empty a pillar. If a
  // future member list would drop one below two, the pillar must GROW, not the gate soften."""
new3 = """  // (measured, all six tiers — rotational_power 3/3/4/5/7/6 for bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit; anti_rotation 3/4/6/6/7/6 after D49
  // added two gear-free members and tagged the Pallof press as band gear; dynamic_bracing 4
  // everywhere), so the filter cannot empty a pillar. If a
  // future member list would drop one below two, the pillar must GROW, not the gate soften."""
reps.append(("D46-c count comment", old3, new3))

for label, old, new in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write("ABORT: anchor %r matched %d times (need 1)\n" % (label, n))
        sys.exit(1)
    src = src.replace(old, new, 1)

io.open(P, "w", encoding="utf-8").write(src)
print("v193_d49_edit: %d replacements applied" % len(reps))
