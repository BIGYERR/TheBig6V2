#!/usr/bin/env python3
# V193 — D50: the trunk floor is a floor on the DAY, not on the labelled section.
#
# ONE predicate inside capSessionBudget. No new constant, no new table, no version bump
# (D50 is the last code change inside V193; ia-version stays 193 and is NOT touched here).
#
# Every anchor is asserted count==1 before a single byte is written; the first miss aborts
# the whole script and leaves index.html untouched. Literal bytes throughout (real em
# dashes, real arrows) — never escapes.

import io, sys, os

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
PATH = os.path.normpath(PATH)

with io.open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

edits = []

# ── EDIT 1 ─────────────────────────────────────────────────────────────────────
# The predicate itself, plus both carve-out guards, wedged between the working-copy
# construction and _protected. Placed here because it must close over `out`: the floor is
# a statement about the DAY's current state, re-read on every pass of the trim loop, not a
# property of the section object.
A1 = """  const out=sections.map(s=>({...s, items:((s&&s.items)||[]).map(it=>({...it}))}));
  const _protected=s=>{
    // V193 (D47): an OPTIONAL section is never protected."""

B1 = """  const out=sections.map(s=>({...s, items:((s&&s.items)||[]).map(it=>({...it}))}));
  // ── V193 (D50): THE TRUNK FLOOR IS A FLOOR ON THE DAY, NOT ON THE SECTION ────
  // D48 ruled one thing unconditionally: zero trunk is not a coachable prescription. It
  // was implemented one level too low — as a floor on the ITEMS INSIDE an optional core
  // section — so the budget could still delete the whole section out from under the floor
  // and land the day on zero. The sections that fall through it are the ones the builder
  // emits WITHOUT optional:true: the protect-tier 'Trunk — anti-rotation' /
  // 'Trunk — anti-extension' pair on the Rehab + Trunk day is ordinary rank-1 fodder, so
  // the budget empties it, splices it out, and prints a day named for trunk with no trunk
  // on it. Nothing about a shoulder restricts anti-rotation, a dead bug or a hollow hold,
  // and overlay doctrine pierces at DAY level to remove what the INJURY forbids, not what
  // the budget happens to reach next. D50 is not a new rule. It is D48 applied at the
  // level D48 was ruled at.
  //
  // THE FLOOR IS ONE ITEM ON THE DAY, counted across the `Trunk — *` family with the same
  // /^Trunk / taxonomy injectDynamicCore already uses to decide a day owns its own trunk
  // block. Two consequences fall straight out of counting ITEMS instead of SECTION LABELS:
  //   * Carve-out 1, trunk relocated. Fewer labelled trunk sections with trunk still
  //     present elsewhere on the card is not a defect and needs no special case. While two
  //     trunk sections live the count is 2 or more, nothing is protected, and the budget
  //     trims exactly as it did before. Only the last surviving ITEM is held, wherever it
  //     ended up sitting.
  //   * Carve-out 4, the floor is not raised. <=1 is the boundary between nonempty and
  //     empty, not a chosen number. One hard trunk piece is the target; the second item of
  //     a pair stays budget fodder, which is why the D51 thin-core share barely moves.
  const _isTrunkSec=s=>/^Trunk /.test((s&&s.label)||'');
  const _trunkItems=()=>out.reduce((a,s)=>a+(_isTrunkSec(s)?((s&&s.items)||[]).length:0),0);
  // CARVE-OUT 2 — THE RUN IS THE DAY. d18LongRunDayPass owns a long-run day (tier A post
  // run mobility only, tier B upper and trunk capped at 8 sets, tier C carry ban). Tier B
  // keeps sections that still have items, so a floor that held a trunk section alive here
  // would hand tier B one more section to spend its eight sets on and rewrite a day the
  // run already decided. No long-run tier gets the floor. _longRunTier is the same
  // predicate that pass uses, so the two can never disagree about what a long run is.
  // CARVE-OUT 3 — RACE WEEK BELONGS TO D37/D38. raceEveLiftPass replaces day.sections
  // wholesale on the race day, the eve and two days out, and it runs after this pass, so
  // ordering already makes the window unreachable. Leaning on that alone is the latch
  // shape §10b bans (a claim that only holds while a LATER pass keeps cleaning up), so the
  // one day of that window this function can see from its own cardio is refused here by
  // name. A trunk floor does not outrank the race.
  const _trunkFloor = !_longRunTier(cardio)
    && !/race day|time trial/i.test((cardio&&cardio.subtype)||'');
  const _protected=s=>{
    // V193 (D50): the day's LAST trunk item is not budget fodder. Tested before the D47
    // optional clause because the floor is a fact about the day, not about who owns the
    // section — an optional trunk block down to its last item is held for the same reason.
    if(_trunkFloor && _isTrunkSec(s) && _trunkItems()<=1) return true;
    // V193 (D47): an OPTIONAL section is never protected."""

edits.append(('D50 predicate + carve-outs 2/3 in capSessionBudget', A1, B1))

# ── EDIT 2 ─────────────────────────────────────────────────────────────────────
# D48's own comment block claimed the floor's reach. It is now one level up; say so where
# the next reader lands, so the two comments cannot drift into disagreeing.
A2 = """    // Thin core is an acceptable outcome: one hard trunk piece done properly on a tight
    // day is a coachable prescription. Zero trunk is not.
    if(s && s.optional && ((s.items||[]).length>1)) return false;"""

B2 = """    // Thin core is an acceptable outcome: one hard trunk piece done properly on a tight
    // day is a coachable prescription. Zero trunk is not.
    // V193 (D50): "zero trunk is not" is enforced ABOVE this line now, on the day rather
    // than on the section, because this clause only ever reached sections carrying
    // optional:true and the builder's own trunk sections do not carry it.
    if(s && s.optional && ((s.items||[]).length>1)) return false;"""

edits.append(('D48 comment points at the day-level floor', A2, B2))

for name, old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (need exactly 1). Nothing written.\n' % (name, n))
        sys.exit(1)

for name, old, new in edits:
    src = src.replace(old, new, 1)
    sys.stdout.write('applied: %s\n' % name)

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

sys.stdout.write('wrote %s\n' % PATH)
