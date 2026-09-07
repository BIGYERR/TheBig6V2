# V192 slice 4 — D42-b (shoulderAccPool equipment gate) + D43 (Dumbbell floor press).
# No ia-version bump in this slice (a later slice owns it).
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

reps = []

# ── EDIT 1 — D42-b: hasBarbell gate on shoulderAccPool ──────────────────────
# A landmine is a barbell with one end anchored, so it is barbell-tier equipment.
# _gearOK has no landmine token, so the name passes on all five tiers today.
# The non-barbell branch is the current EXLIB.shoulder list minus the landmine,
# so no other tier's shoulder content changes by a single byte.
reps.append((
"  const shoulderAccPool = _gear(EXLIB.shoulder);",
"""  // V192 (D42-b): a landmine is a barbell with one end anchored, so it is
  // barbell-tier equipment. _gearOK has no landmine token, so the name walked
  // through on every tier including bodyweight. Gated here the way lungePool is
  // gated one screen above. The no-barbell branch is EXLIB.shoulder minus the
  // landmine, member for member, so no other tier's shoulder content moves.
  const shoulderAccPool = _gear(hasBarbell?EXLIB.shoulder:['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press']);"""
))

# ── EDIT 2 — D43: chest_acc gains the floor press ───────────────────────────
reps.append((
"  chest_acc:['Dumbbell incline press','Dumbbell bench press','Dips','Pushups (slow tempo)','Diamond pushups','Dumbbell decline press'],",
"  chest_acc:['Dumbbell incline press','Dumbbell bench press','Dips','Pushups (slow tempo)','Diamond pushups','Dumbbell decline press','Dumbbell floor press'],"
))

# ── EDIT 3 — D43: chest_acc_joint gains the same ────────────────────────────
# Deliberate, not a copy-paste: the humerus never travels past the torso, which is
# exactly the joint-friendly argument this pool exists to make.
reps.append((
"  chest_acc_joint:['Dumbbell incline press','Dumbbell bench press','Machine chest press','Cable crossover','Pec deck','Dumbbell decline press'],",
"  chest_acc_joint:['Dumbbell incline press','Dumbbell bench press','Machine chest press','Cable crossover','Pec deck','Dumbbell decline press','Dumbbell floor press'],"
))

# ── EDIT 4 — D43: shoulder/workaround gains swapNames ───────────────────────
# Same shape elbow/workaround uses. The floor stops the elbow at torso depth,
# which is the impingement-adjacent range this tier's dropNames already avoids.
# The hpress cap at RPE 7 still applies on top.
reps.append((
"""      P.dropNames=/overhead|arnold|push press|military|pike pushup|pike pushups|handstand|wall walk|\\bdips\\b|bench dips|lateral raise/i;
      P.cardioMode='swimout';""",
"""      P.dropNames=/overhead|arnold|push press|military|pike pushup|pike pushups|handstand|wall walk|\\bdips\\b|bench dips|lateral raise/i;
      // V192 (D43): the workaround tier's job is to substitute, not just subtract.
      // The floor stops the elbow at torso depth — the impingement-adjacent range
      // the dropNames above already avoid. Runs after dropNames, so nothing here
      // resurrects a dropped name. The hpress cap adds RPE 7 on top.
      P.swapNames={'Dumbbell bench press':'Dumbbell floor press'};
      P.cardioMode='swimout';"""
))

for old, new in reps:
    n = src.count(old)
    label = old.strip().split('\n')[0][:70]
    if n != 1:
        sys.stderr.write('ABORT anchor count=%d (expected 1): %s\n' % (n, label))
        sys.exit(1)
    sys.stdout.write('anchor count=1 OK: %s\n' % label)
    src = src.replace(old, new, 1)

io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s' % P)
