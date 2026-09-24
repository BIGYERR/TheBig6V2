#!/usr/bin/env python3
# V214 slice 1 — D158 (coach, V213 session): THE TEST EVE CARRIES A SHAKEOUT.
# Ruling (handoff §12 D158, §11f V213): a training-day eve (T-1, read across the week boundary)
# before an NSW test carries a shakeout built by the easy-run builder at the eve's own week
# (buildRunSession(..., 'lsd_easy') at _ev.w, so its distance is prog.easy[week]) and REPLACES
# whatever sat there, bike and swim included. A rest-day eve stays rest. INT at T-3 or earlier is
# legal primer. B4's T-2 step is unchanged. When the eve holds the shakeout it leaves _pin.rest
# (the trial's move off its origin day can put that day there), as the NRC D37 mover does.
# Source: measure's proven surgery, tests/measure/v213_d113a_full3.js (EREPL), applied verbatim
# to the code; only the comment is rewritten to name the ruling instead of the surgery.
# ONE edit. No ia-version change (Mario bumps).
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

EANCH = """      break;
    }
  }
  return schedule;
}

// ── V115: HARD CARDIO DAYS GET SPACED"""

EREPL = """      break;
    }
    // V214 (D158): THE TEST EVE CARRIES A SHAKEOUT. A training-day eve before an NSW test, read
    // across the week boundary, gets a shakeout from the easy-run builder at the eve's own week,
    // so it is that week's easy run and dose. It replaces whatever sat there, a bike or a swim
    // included. A rest-day eve stays rest. B4's T-2 step above is unchanged. It runs last in the
    // pin block, after the trial has moved, and clears the eve from _pin.rest, because the trial's
    // origin day enters _pin.rest and the lift layer rests every day listed there (as D37 does).
    if(_pin.test && cardioGoals.run){
      const _efl = []; [_pin.w - 1, _pin.w].forEach(w => { if(schedule[w]) _ISO_ORDER.forEach(d => _efl.push({w, d})); });
      const _eti = _efl.findIndex(x => x.w === _pin.w && x.d === _pin.race); const _ev = _eti >= 1 ? _efl[_eti - 1] : null;
      if(_ev && trainDays.includes(_ev.d)){
        const _g = cardioGoals.run, _pg = paceGoalTarget(_g);
        const _rbm = parseFloat((_g.baselineDist||'').toString()) || parseFloat((_g.baseline||'').match(/([0-9.]+)/)?.[1]) || ({beginner:1, intermediate:2, advanced:4}[cfg.experience||'intermediate'] || 2);
        const _mbs = (_g.mileBestMins !== undefined && _g.mileBestMins !== '') ? (+_g.mileBestMins||0)*60 + (+_g.mileBestSecs||0) : null;
        const _sh = buildRunSession(_g.id, _ev.w, Math.max(0, cardioTrainDays.indexOf(_ev.d)), tw, _rbm, cfg.experience||'intermediate', null, cfg.eventTargeted !== false, 'lsd_easy',
          _pg.tDist, _pg.tTotalSecs, cfg.ageBracket||'18-35', _mbs, isBaseCardio, null, _taperFor(_ev.w), cfg._paceShift || null, false, false, null);
        if(_sh){ _sh.legLoad = false; schedule[_ev.w][_ev.d] = _sh; if(_ev.w === _pin.w) _pin.rest = (_pin.rest||[]).filter(d => d !== _ev.d); }
      }
    }
  }
  return schedule;
}

// ── V115: HARD CARDIO DAYS GET SPACED"""

REPS = [("D158 eve shakeout at the end of the pin block", EANCH, EREPL)]

bad = False
for tag, old, new in REPS:
    c = src.count(old)
    print('%-48s count=%d' % (tag, c))
    if c != 1: bad = True
if bad:
    sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for tag, old, new in REPS:
    src = src.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE', P)
