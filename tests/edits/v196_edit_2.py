#!/usr/bin/env python3
# V196 slice 2 — D58 footer copy, D56 surfaces, and the ia-version bump (last).
import io, sys

P = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = io.open(P, encoding="utf-8").read()

EDITS = []

# ── 1. Main Lifts card: trimmed opening line, D56 disambiguation, D58 two clauses ──
OLD1 = """    const hidden=model.mains.reduce((a,m)=>a+m.hidden,0);
    html+=_iaCard(asyIcon('🏋',15)+' Main Lifts','var(--lift)',
      model.mains.map(m=>buildMainLiftBlock(m,unit)).join(''),
      'The heaviest set you actually did, and the working weight behind it. No estimated maxes: a formula that '
      +'inflates with reps would rank a heavy single below a lighter double.'
      +(hidden?' '+hidden+' session'+(hidden===1?'':'s')+' where these ran as accessories are kept out of the line so it reads clean.':''));"""

NEW1 = """    // V196 D58: the footer must account for every session, in TWO clauses and never one
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
        +(noLoad===1?'it joins':'they join')+' the line.':''));"""
EDITS.append(("main card footer", OLD1, NEW1))

# ── 2. D56: the ladder is not "Accessories" ───────────────────────────────
OLD2 = """    html+=_iaCard(asyIcon('🏋',15)+' Accessories — Range Ladder','var(--lift)',"""
NEW2 = """    html+=_iaCard(asyIcon('🏋',15)+' Range Ladder','var(--lift)',"""
EDITS.append(("ladder card title", OLD2, NEW2))

# ── 3. D56: the ladder head line stops calling them accessories ───────────
OLD3 = """+' time'+(ups===1?'':'s')+'</b> across your accessories this block. '"""
NEW3 = """+' time'+(ups===1?'':'s')+'</b> across these lifts this block. '"""
EDITS.append(("ladder head line", OLD3, NEW3))

# ── 4. D56: the swap sheet tier arm is a caution, not a classification ────
OLD4 = """  const isMain=(itemIdx===0&&!(sec.superset||sec.type==='superset')&&/^main/i.test(sec.label||''))||_compoundTier(item.name)>=3;"""
NEW4 = """  // V196 D56: two arms, two meanings. MAIN LIFT is reserved for the SLOT test — item 0
  // of a /^main/i section, the same test _slotOfEntry freezes into the ledger. The tier
  // arm is a heavy compound caution and says so. With the Progress card keeping the name
  // MAIN LIFTS, one tag for both tests made the app contradict itself in the athlete's hand.
  const isMainSlot=(itemIdx===0&&!(sec.superset||sec.type==='superset')&&/^main/i.test(sec.label||''));
  const isHeavyCompound=!isMainSlot&&_compoundTier(item.name)>=3;"""
EDITS.append(("swap tag flags", OLD4, NEW4))

OLD5 = """    +(isMain?'<span class="swap-tag">MAIN LIFT</span>':'')"""
NEW5 = """    +(isMainSlot?'<span class="swap-tag">MAIN LIFT</span>':(isHeavyCompound?'<span class="swap-tag">HEAVY COMPOUND</span>':''))"""
EDITS.append(("swap tag render", OLD5, NEW5))

# ── 5. version bump — ALWAYS LAST ─────────────────────────────────────────
EDITS.append(("ia-version 195 to 196",
              '<meta name="ia-version" content="195">',
              '<meta name="ia-version" content="196">'))

fail = False
for label, old, new in EDITS:
    n = src.count(old)
    print("anchor %-26s count=%d" % (label, n))
    if n != 1:
        fail = True
if fail:
    sys.exit("ABORT: anchor count != 1, nothing written")

for label, old, new in EDITS:
    src = src.replace(old, new, 1)

io.open(P, "w", encoding="utf-8").write(src)
print("WROTE", P)
