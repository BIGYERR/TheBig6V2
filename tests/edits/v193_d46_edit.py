# -*- coding: utf-8 -*-
# V193 slice 1 of 3 — coach D46 (pillar depth + one gear lens + swap family).
# ia-version is ALREADY 193 (D44 is in the working tree, unreverted). This script
# does NOT touch the version meta. Slice 2 = D46-a draw/parity fix, slice 3 = D47.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = io.open(P, encoding='utf-8').read()
orig = s

def rep(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        sys.stderr.write('ABORT [%s]: anchor count==%d, expected 1\n' % (label, n))
        sys.exit(1)
    s = s.replace(old, new, 1)
    print('ok  %s' % label)

# ── EDIT 1: three new members in CORE_PILLARS.rotational_power ────────────────
rep(
"""      {name:'Landmine rotations', detail:'3×10 each'}
    ]
  }
};""",
"""      {name:'Landmine rotations', detail:'3×10 each'},
      // V193 (D46): three of the four members above name an implement, so an honest per-tier
      // gear gate would leave home_basic / minimal / bodyweight holding ONE member, and a
      // one-member pillar cannot fill a pair. NSW p.6 rec 2 and p.7 item 2 require movement in
      // all three planes unconditionally, and p.8 item 7 names the torso rotators a problem
      // area — so the pillar may not shrink on exactly the tiers with the least other
      // rotational exposure. Each addition is DERIVED from a member already here, not invented.
      {name:'Standing torso rotations (slow)', detail:'3×10 each'},  // V178 _BW_SUBS target for Landmine rotations, promoted from substitution target to member; dose from the member it stands in for
      {name:'Side plank thread-the-needle', detail:'3×10 each'},     // NSW p.7 item 7 asks static AND dynamic trunk work; dynamic rotational form of Side plank, already prescribed from the NSW trunk table
      {name:'Band woodchopper (door anchor)', detail:'3×12 each'}    // band form of Cable woodchoppers; dose copied from that member exactly
    ]
  }
};""",
'E1 rotational_power members')

# ── EDIT 2: _auxGearOK — a landmine is barbell tier ───────────────────────────
# D42 closed this in shoulderAccPool, D44 in the core injector; the swap sheet is the
# third lens and still answered true for _auxGearOK('Landmine rotations','bodyweight').
rep(
"""  if(/barbell|trap bar|power clean/.test(N)) return equip==='home_full'||equip==='commercial'||equip==='crossfit';""",
"""  if(/barbell|trap bar|power clean|landmine/.test(N)) return equip==='home_full'||equip==='commercial'||equip==='crossfit';  // V193 (D46): 'landmine' — this clause could not see the word, so a landmine read bodyweight legal on the swap sheet""",
'E2 _auxGearOK landmine')

# ── EDIT 3: _auxGearOK — bands are not a bodyweight or minimal implement ──────
# Placed LAST, immediately before the catch-all `return true`, so it can shadow nothing:
# checked that no name matching /\bband\b/ is answered by an earlier clause (it holds no
# 'cable', 'pec deck', 'ball slams', 'wall ball', 'medicine ball', 'barbell', 'trap bar',
# 'power clean', 'landmine', 'kettlebell', 'kb' or 'dumbbell' token), and that no name
# answered by an earlier clause matches /\bband\b/ ('barbell' has no 'band' at a word
# boundary). Tier truth from the wizard equipment copy: home_full, home_basic and crossfit
# all list bands.
rep(
"""  if(/kettlebell|\\(kb|\\bkb\\b|dumbbell|\\(db\\b/.test(N)) return equip!=='bodyweight';
  return true;
}""",
"""  if(/kettlebell|\\(kb|\\bkb\\b|dumbbell|\\(db\\b/.test(N)) return equip!=='bodyweight';
  if(/\\bband\\b/.test(N)) return equip!=='bodyweight'&&equip!=='minimal';   // V193 (D46): wizard equipment copy gives bands to home_full, home_basic and crossfit
  return true;
}""",
'E3 _auxGearOK band')

# ── EDIT 4: _AUX_FAMILY — a swap out of a rotation lands on a rotation ────────
rep(
"""  'Lateral bounds':'power','Medicine ball rotary toss':'power','Power clean (light & explosive)':'power',""",
"""  'Lateral bounds':'power','Power clean (light & explosive)':'power',""",
'E4a drop rotary toss from power')

rep(
"""  'Side plank':'core','Superman':'core','Toes-to-bar':'core','Windshield wipers':'core',""",
"""  'Side plank':'core','Superman':'core','Toes-to-bar':'core','Windshield wipers':'core',
  // V193 (D46): every rotational pillar member is family 'core'. Cable woodchoppers and
  // Landmine rotations were absent from this map entirely, which made them skip-only with
  // zero swap candidates. Medicine ball rotary toss read 'power', so its only swap candidates
  // were jumps and olympic derivatives: a swap out of a transverse-plane finisher converted it
  // into a jump, an exit from the pillar rather than a substitution.
  'Cable woodchoppers':'core','Landmine rotations':'core','Medicine ball rotary toss':'core',
  'Standing torso rotations (slow)':'core','Side plank thread-the-needle':'core',
  'Band woodchopper (door anchor)':'core',""",
'E4b add rotational members to core')

assert s != orig
io.open(P, 'w', encoding='utf-8').write(s)
print('WROTE %s (+%d bytes)' % (P, len(s) - len(orig)))
