# V202 slice 6 — the rewritten E9 mutation gets a UNIQUE label. tests/sabotage/v202.json
# already reuses M8..M13 twice, so "M10" selected two different mutations by name.
import io, json, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v202.json'
spec = json.load(io.open(P, encoding='utf-8'))
hits = [m for m in spec if m['anchor'].startswith('        const weekPace   = pp ?')]
print('anchor-selected mutations: %d' % len(hits))
if len(hits) != 1: sys.exit('ABORT')
m = hits[0]
if not m['name'].startswith('M10 -> the cutback hold'): sys.exit('ABORT: unexpected name ' + m['name'][:40])
m['name'] = 'M17 -> ' + m['name'][7:]
m['note'] = ("NAMED TRIP: g202_int_doctrine D3, the cutback limb: 48 cutback cards across the lattice log a "
             "target their own sentence says is unchanged from the week before. D1 stays GREEN (the printed "
             "gap is still 16 s/mi on non-cutback cards, and a cutback card prints no goal pace), which is why "
             "D3 and not D1 is the declared target. D7 goes red with it on W4 (483 -> 478) and g202_pace_anchor "
             "Q8 stays GREEN: the two pinned cards are W1 and W6, neither a cutback week, so a suite pinned only "
             "on those two would ship this mutant. Labelled M17 because this file already reuses M8..M13 twice.")
io.open(P, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('WROTE ' + P)
