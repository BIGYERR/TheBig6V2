#!/usr/bin/env python3
# V214 slice 1b — coach's D158 re-pins in tests/gates/g207_gk_trial_present.js, era >= 214.
#   Q3 (T-1 half only): a long LSD dealt at T-1 becomes the shakeout from the easy-run builder at the
#       week's easy duration, and a training-day eve never rests. T-2 keeps the V208 assertion byte for
#       byte (B4's T-2 step is unchanged by D158).
#   P6: bike and swim cards before the test day untouched EXCEPT the eve, which D158 replaces.
# Below 214 every row reads exactly as before. The new gate for D158 itself is
# tests/gates/g214_d158_eve.js (written directly, not by this script). No index.html change.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g207_gk_trial_present.js'
src = io.open(P, encoding='utf-8').read()

REPS = [
("E1 ERA214 constant",
"""const VER = +IA.version, ERA = 207;
""",
"""const VER = +IA.version, ERA = 207;
// V214 (D158, coach re-pins; standing ruling 4): from ia-version 214 the test eve (T-1) carries a
// shakeout from the easy-run builder at the week's easy duration and replaces whatever sat there.
// P6 then reads every day before the test except the eve, and Q3's T-1 half asserts the shakeout.
// Below 214 both rows read exactly as they did. D158's own rows live in g214_d158_eve.js.
const ERA214 = 214;
"""),
("E2 P6 skips the eve from 214",
"""  flat.slice(0, ti).forEach(x => { const a = pre.weeks[x.w] && pre.weeks[x.w][x.d] && pre.weeks[x.w][x.d].cardio;
    if(a && a.type !== 'run'){ const b = p.weeks[x.w][x.d] && p.weeks[x.w][x.d].cardio; if(canon(a) !== canon(b)) moved.push('W' + x.w + ' ' + x.d + ' ' + a.type); } });
  const notRest = DAYS.slice(wd + 1).filter(d => !(p.weeks[tw][d] && p.weeks[tw][d].rest));
  ok(`P6 ${tag}: bike and swim cards before the test day untouched, every day after it rests`, moved.length === 0 && notRest.length === 0,""",
"""  flat.slice(0, ti).forEach((x, i) => { if(VER >= ERA214 && i === ti - 1) return;   // D158: the eve is the shakeout's
    const a = pre.weeks[x.w] && pre.weeks[x.w][x.d] && pre.weeks[x.w][x.d].cardio;
    if(a && a.type !== 'run'){ const b = p.weeks[x.w][x.d] && p.weeks[x.w][x.d].cardio; if(canon(a) !== canon(b)) moved.push('W' + x.w + ' ' + x.d + ' ' + a.type); } });
  const notRest = DAYS.slice(wd + 1).filter(d => !(p.weeks[tw][d] && p.weeks[tw][d].rest));
  ok(`P6 ${tag}: bike and swim cards before the test day untouched${VER >= ERA214 ? ' except the eve (D158)' : ''}, every day after it rests`, moved.length === 0 && notRest.length === 0,"""),
("E3 Q3 T-1 half from 214",
"""      if(c){ A.repl++; if(!ez.includes(canon(c))) A.replBad.push(lab + ' got ' + c.subtype + ' ' + canon(c.dose) + ' want one of ' + ez.length + ' pre-pin easy LSD'); }
      else { A.rest++;""",
"""      if(VER >= ERA214 && k === 1){
        // D158: the eve is the shakeout from the easy-run builder at the week's easy duration. The pre-pin
        // long card proves the eve is a training day, so it never rests. Oracle: the card text (plain LSD,
        // legLoad false, a distance dose keyed easy) and the pre-pin week's easy LSD distance when that
        // week dealt one; the dose on weeks that dealt none is g214_d158_eve.js D2's.
        const ezMi = [...new Set(DAYS.map(d => runOf(pre.weeks[x.w][d])).filter(EASY).map(e => e.dose && e.dose.mi))];
        if(c){ A.repl++; if(!(EASY(c) && c.subtype === 'Long Slow Distance (LSD)' && !!c.dose && c.dose.k === 'dist' && c.dose.key === 'easy' && (ezMi.length === 0 || (ezMi.length === 1 && c.dose.mi === ezMi[0]))))
          A.replBad.push(lab + ' got ' + c.subtype + ' ' + canon(c.dose) + ' legLoad ' + c.legLoad + ', want the shakeout at ' + (ezMi.join('/') || "the week's easy") + ' mi'); }
        else { A.rest++; A.replBad.push(lab + ' rests, but D158 puts the shakeout on a training-day eve'); }
      }
      else if(c){ A.repl++; if(!ez.includes(canon(c))) A.replBad.push(lab + ' got ' + c.subtype + ' ' + canon(c.dose) + ' want one of ' + ez.length + ' pre-pin easy LSD'); }
      else { A.rest++;"""),
("E4 Q3 label from 214",
"""  ok(`Q3 ${L}: a long LSD dealt at T-1 or T-2 became the week's pre-pin easy LSD card, dose and all (${A.repl} replaced, ${A.rest} rest, of ${A.reach})`,""",
"""  ok(`Q3 ${L}: ${VER >= ERA214 ? "a long LSD dealt at T-1 became the shakeout from the easy-run builder at the week's easy duration; at T-2 it became" : 'a long LSD dealt at T-1 or T-2 became'} the week's pre-pin easy LSD card, dose and all (${A.repl} replaced, ${A.rest} rest, of ${A.reach})`,"""),
]

bad = False
for tag, old, new in REPS:
    c = src.count(old)
    print('%-36s count=%d' % (tag, c))
    if c != 1: bad = True
if bad:
    sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for tag, old, new in REPS:
    src = src.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE', P)
