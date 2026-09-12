# V193 slice 5 — the four registered same-card duplicate classes, closed with the mechanism
# this build already established twice: THE LATER SECTION YIELDS.
#
#   Dumbbell lateral raise   Main shoulder slot + Delt finisher   V192 396 -> pre 636 -> 0
#   Dumbbell bench press     Main + Accessory / Chest + knee      V192  48 -> pre  63 -> 0
#   Dumbbell decline press   Main + Accessory                     V192  64 -> pre  64 -> 0
#   Pushups (slow tempo)     Main + Pump                          V192  16 -> pre  16 -> 0
#
# Not a new ruling: precedent is slice 4's `_taken` walk (Bird dogs) and the `onCard`
# subtraction in the earlier same-card repair (Farmer carry). One shape, three seams.
# ia-version stays 193 — same release, later slice. No version replacement in this script.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

reps = []
def rep(tag, old, new):
    reps.append((tag, old, new))

# ── 1. hoist the chest-accessory pool so the slot and the sections share ONE lens ─────
rep('1 chestAccPool hoisted',
"""  const shoulderAccPool = _gear(hasBarbell?EXLIB.shoulder:['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press']);
  const bicepsAccPool   = _gear(EXLIB.biceps);
""",
"""  const shoulderAccPool = _gear(hasBarbell?EXLIB.shoulder:['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press']);
  // V193 (same-card, slice 5): the chest-accessory pool was an inline literal at its ONE
  // draw site, so buildSections had no legal way to re-walk it when the name it was handed
  // turned out to be the name the day's Main lift already held. It is a named pool now, on
  // the same line of sight as shoulderAccPool, and it has exactly two readers: the chestAcc
  // slot in buildEx and the push day's two later sections. Same pool, same lens, same
  // bodyweight branch — the standing rule is that the pool and the post-filter must reason
  // about a movement through the same lens, and a second copy of this literal inside
  // buildSections would have broken that on the bodyweight tier only, which is the tier
  // where it is hardest to see. No _gear() call: EXLIB.chest_acc names no cable and no
  // machine, dumbbells are legal on every tier except bodyweight, and bodyweight takes the
  // _bw branch — so a _gear() here would be a no-op that added the V127 empty-pool latch
  // for nothing. The chestAcc slot's behaviour is unchanged: _bw and _bwRung are pure.
  const chestAccPool    = _bw(['Incline pushups (hands on bed)','Wide-stance pushups','Pushups (slow 3s eccentric)','Close-grip pushups','Decline pushups (feet elevated)'],EXLIB.chest_acc);
  const bicepsAccPool   = _gear(EXLIB.biceps);
""")

# ── 2. the slot draws from the named pool ─────────────────────────────────────────────
rep('2 chestAcc slot reads the named pool',
"""    const chestAcc  = _slot(_bw(['Incline pushups (hands on bed)','Wide-stance pushups','Pushups (slow 3s eccentric)','Close-grip pushups','Decline pushups (feet elevated)'],EXLIB.chest_acc),2,bs+1,'upper');
""",
"""    const chestAcc  = _slot(chestAccPool,2,bs+1,'upper');
""")

# ── 3. seam C — the light-press fallback obeys the guard it was written to obey ────────
rep('3 light-press terminal fallback guarded',
"""        // The fallback has to obey the SAME guard as the pool: a hard-coded incline here
        // walked straight back into the duplicate the filter just removed whenever the
        // filtered pool emptied (acc0=DB bench evicting both bench copies + acc1=incline
        // left nothing). Slow-tempo pushups is the terminal light-press stimulus every
        // tier owns, so the chain cannot end empty.
        const _lpFallback=['Dumbbell incline press','Dumbbell bench press','Pushups (slow tempo)']
          .filter(x=>x!==ex.chestMain&&x!==ex.chestAcc[0]&&x!==ex.chestAcc[1])[0]||'Pushups (slow tempo)';
""",
"""        // The fallback has to obey the SAME guard as the pool: a hard-coded incline here
        // walked straight back into the duplicate the filter just removed whenever the
        // filtered pool emptied (acc0=DB bench evicting both bench copies + acc1=incline
        // left nothing).
        //
        // V193 (same-card, slice 5): the chain still ended in a name the guard was not
        // allowed to see. '||' after a filtered lookup is a fallback to an UNFILTERED value,
        // which is the V122 _gear trap written small: whenever the three-name chain filtered
        // to nothing it handed back 'Pushups (slow tempo)' unconditionally, and on the tiers
        // where that happens chestAcc[1] IS 'Pushups (slow tempo)' — so the day printed it as
        // the Main press and again in the Pump, 16 day-builds of 59,781, home_full and
        // crossfit on the two lowback paths. The fix is arithmetic, not a new rule: the guard
        // can remove at most THREE distinct names, so a chain of five leaves at least two,
        // and the terminal '||' is deleted rather than replaced. The first three entries are
        // untouched and in the same order, so every case where the old chain resolved at all
        // resolves to the same name; only the empty case moves, and it moves to a pushup that
        // is legal on every tier. On bodyweight the guard holds three pushup names and can
        // never evict a dumbbell press, so entry 0 survives there exactly as before and this
        // tier's output is byte-identical.
        const _lpFallback=['Dumbbell incline press','Dumbbell bench press','Pushups (slow tempo)','Close-grip pushups','Diamond pushups']
          .filter(x=>x!==ex.chestMain&&x!==ex.chestAcc[0]&&x!==ex.chestAcc[1])[0];
""")

# ── 4. seam A — the Delt finisher is the later section, so it yields ──────────────────
rep('4 delt finisher subtracts the card',
"""        else
          s.push({label:'Delt finisher',optional:true,items:[{name:pick(_bw(EXLIB.shoulder_iso_bw,_gear(EXLIB.shoulder_iso)),1,blockSeed(w)+42)[0],detail:vsets(3)+'×20'}]});
""",
"""        else {
          // V193 (same-card, slice 5): the LATER SECTION YIELDS, third use of the shape.
          // ex.shoulder[1] is printed in the Main pairing two lines up and is drawn from
          // shoulderAccPool, which shares exactly one name with EXLIB.shoulder_iso —
          // 'Dumbbell lateral raise'. So the day could headline a lateral raise and then
          // prescribe it again underneath at a different dose: 636 day-builds of 59,781,
          // up from 396 on V192 because D47 unprotected the 2-item optional core block and
          // moved budget-trim pressure off this 1-item section, letting a duplicate the cap
          // used to hide survive 240 more times. D47 was ruled; this consequence was not.
          // The pool is registered with the swap universe BEFORE the subtraction, the way
          // _slot does it, so the swap sheet still offers the full delt inventory — the
          // subtraction is about what this card prints, not about what the athlete may pick.
          // Floor after subtracting every name already on the card: 2 on bodyweight (1 on
          // bodyweight/advanced, the only window that reaches 'Prone Y-T-W raises'), 2 on
          // minimal / home_basic / home_full / crossfit, 4 on commercial. Never 0, so the
          // guard below is a crash guard and not a filler — there is no fallback to the
          // unfiltered pool. If a future pool edit ever did empty it, this OPTIONAL section
          // is omitted rather than filled illegally.
          //
          // OPEN (deferred to §12, Mario's call): the better answer here may be that this
          // finisher MERGES into the Main block instead of re-drawing. Six sets of lateral
          // raises is defensible training; the real defect is two headings carrying two
          // contradictory prescriptions for one movement (3×10–15 @ RPE 8 above, then
          // 3×15–20 @ RPE 8 here). That is a design question, not a draw question, and this
          // slice deliberately takes only the mechanical fix.
          const _dfPool=_bw(EXLIB.shoulder_iso_bw,_gear(EXLIB.shoulder_iso));
          _swapUniverseAdd(_dfPool);
          const _dfTaken=Object.create(null);
          s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)_dfTaken[it.name]=1;});});
          const _dfFree=_dfPool.filter(function(n){return !_dfTaken[n];});
          if(_dfFree.length)
            s.push({label:'Delt finisher',optional:true,items:[{name:pick(_dfFree,1,blockSeed(w)+42)[0],detail:vsets(3)+'×20'}]});
        }
""")

# ── 5. seam B — Accessory and Chest + knee are both later than Main, so both yield ────
rep('5 push accessory sections subtract the card',
"""      s.push({label:'Main — '+ex.chestMain,items:[{name:ex.chestMain,detail:det},{name:ex.shoulder[0],detail:vsets(3)+'×8'+(_isOneArmPress(ex.shoulder[0])?' each':'')}]});
      if((goal==='fatloss'||goal==='athletic')&&!strengthSupport)s.push({label:'Conditioning',optional:true,superset:true,rounds:vsets(3),items:[{name:ex.cond[0],detail:vsets(3)+'×12'},{name:ex.cond[1],detail:vsets(3)+'×10'}]});
      else {
        // V164 station rule: b-walk over the unselected shoulder pool (shoulder[0] is
        // the Main pairing at the site above — protected); chestAcc[0..1] are both
        // consumed on this day, so there is no legal a-alternative — demote if pure.
        const _sp=_ssPair(ex.chestAcc[0],ex.shoulder[1],[],shoulderAccPool.filter(n=>n!==ex.shoulder[0]));
        s.push({label:'Accessory',superset:_sp.ok,rounds:vsets(3),items:[{name:_sp.a,detail:vsets(3)+'×10'},{name:_sp.b,detail:vsets(3)+'×15'+(_isOneArmPress(_sp.b)?' each':'')}]});
      }
      if(!isBeginner)s.push({label:'Chest + knee',superset:true,rounds:vsets(3),items:[{name:ex.chestAcc[1],detail:vsets(3)+'×12'},{name:ex.kneeStab,detail:vsets(3)+'×25 sec'}]});
""",
"""      // V193 (same-card, slice 5): the LATER SECTION YIELDS, fourth use of the shape, and
      // the only one that needs a helper because TWO later sections on this card draw from
      // the same pool. chestAccPool and chestCompoundPool overlap by name on every loaded
      // tier — 'Dumbbell bench press' and 'Dumbbell decline press' are in both — and _slot's
      // _took guard is deliberately inert on healthy programs, so nothing stopped chestAcc
      // from being handed the day's own Main lift. 64 day-builds printed 'Dumbbell decline
      // press' as Main and again as Accessory, 60 did the same with 'Dumbbell bench press',
      // and 3 more printed 'Dumbbell bench press' as Main and again in 'Chest + knee'.
      //
      // The card is read, not re-derived: whatever is already in `s` is taken, which is why
      // the Conditioning branch and the Accessory branch need no separate handling and why
      // 'Chest + knee' can never collide with the Accessory the line above just pushed.
      // Preference order keeps an uncontested day byte-identical — the Accessory still asks
      // for chestAcc[0] first, 'Chest + knee' still asks for chestAcc[1] first, and only a
      // day that would have duplicated walks past them into the pool.
      //
      // Floors, hand counted. Non-bodyweight: chest_acc holds 7 names, the Main can take at
      // most 1 of them and the shoulder slot none, so the Accessory sees at least 6 and
      // 'Chest + knee' at least 5. Bodyweight: _bwRung narrows to a 3-name window, the Main
      // can take at most 1 and the pike/wall shoulder slot none, so the Accessory sees at
      // least 2 and 'Chest + knee' at least 1. Never 0, so the omission branches are crash
      // guards and not fillers. There is no fallback to an unfiltered pool: if a future pool
      // edit ever did empty this, the section is dropped rather than printed illegally.
      const _accFresh=function(prefs){
        const t=Object.create(null);
        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)t[it.name]=1;});});
        for(let i=0;i<prefs.length;i++){ if(prefs[i]&&!t[prefs[i]]) return prefs[i]; }
        for(let i=0;i<chestAccPool.length;i++){ if(chestAccPool[i]&&!t[chestAccPool[i]]) return chestAccPool[i]; }
        return null;
      };
      s.push({label:'Main — '+ex.chestMain,items:[{name:ex.chestMain,detail:det},{name:ex.shoulder[0],detail:vsets(3)+'×8'+(_isOneArmPress(ex.shoulder[0])?' each':'')}]});
      if((goal==='fatloss'||goal==='athletic')&&!strengthSupport)s.push({label:'Conditioning',optional:true,superset:true,rounds:vsets(3),items:[{name:ex.cond[0],detail:vsets(3)+'×12'},{name:ex.cond[1],detail:vsets(3)+'×10'}]});
      else {
        // V164 station rule: b-walk over the unselected shoulder pool (shoulder[0] is
        // the Main pairing at the site above — protected); chestAcc[0..1] are both
        // consumed on this day, so there is no legal a-alternative — demote if pure.
        const _accA=_accFresh([ex.chestAcc[0],ex.chestAcc[1]]);
        if(_accA){
          const _sp=_ssPair(_accA,ex.shoulder[1],[],shoulderAccPool.filter(n=>n!==ex.shoulder[0]));
          s.push({label:'Accessory',superset:_sp.ok,rounds:vsets(3),items:[{name:_sp.a,detail:vsets(3)+'×10'},{name:_sp.b,detail:vsets(3)+'×15'+(_isOneArmPress(_sp.b)?' each':'')}]});
        }
      }
      if(!isBeginner){
        const _ckA=_accFresh([ex.chestAcc[1],ex.chestAcc[0]]);
        if(_ckA) s.push({label:'Chest + knee',superset:true,rounds:vsets(3),items:[{name:_ckA,detail:vsets(3)+'×12'},{name:ex.kneeStab,detail:vsets(3)+'×25 sec'}]});
      }
""")

for tag, old, new in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (want 1)\n' % (tag, n))
        sys.exit(1)

for tag, old, new in reps:
    src = src.replace(old, new, 1)
    sys.stdout.write('ok %s\n' % tag)

io.open(P, 'w', encoding='utf-8').write(src)
sys.stdout.write('WROTE %s\n' % P)
