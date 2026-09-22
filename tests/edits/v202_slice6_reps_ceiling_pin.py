# V202 slice 6 — standing ruling 3: REPS_CEILING was left declared and unread when the E9
# rows went. Its CLAIM (A 259-263, build to 8 repeats) is still live in getINTReps, so the
# constant gets its assertion wired rather than deleted.
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g202_int_doctrine.js'
s = io.open(P, encoding='utf-8').read()
def rep(s, old, new, label):
    n = s.count(old); print('anchor %-4s count=%d' % (label, n))
    if n != 1: sys.exit('ABORT: %s count==%d' % (label, n))
    return s.replace(old, new)

s = rep(s,
  '//              little faster each week."                              -> D114/D115, not here\n',
  '//              little saster each week."                              -> D3b (the 4-to-8 ramp)\n'.replace('saster','faster'),
  'C1')
s = rep(s,
  "    'A0b guide A still says build progressively toward completing 8 intervals (A 259-263) — the source of D114/D115');",
  "    'A0b guide A still says build progressively toward completing 8 intervals (A 259-263) — the source of the 4-to-8 ramp D3b pins');",
  'C2')

OLD = """// ═════════════════════════════════════════════════════════════════════════════
// D4 — recovery is 2 to 2.5 x the work interval, and it is printed as time"""
NEW = """// D3b — the rep ramp itself, which is the OTHER half of A 259-263 and IS built.
// Rep counts are not this slice's work, so this row reads a quantity the build did not
// write and holds it against A's own numbers: the first Short Interval workout is 4
// repeats and the build tops out at 8. The SEQUENCING A also implies (speed only after
// 8 reps are complete) shipped as E9 and was reverted in slice 6 as unreachable; it is
// re-sited on a phase whose interior contains the 8-rep week. Until that is built this
// is the whole of A 259-263 that the engine claims, and REPS_CEILING says so here.
let d3bBad = [], d3bBlocks = 0, d3bTop = 0, d3bMax = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  const cards = ints(prog).filter(r => r.dose && r.dose.reps != null);
  if(!cards.length) continue;
  d3bBlocks++;
  if(cards[0].dose.reps !== 4)
    d3bBad.push(`first INT week prescribes ${cards[0].dose.reps} repeats, A 259-263 says 4`);
  for(const c of cards){
    d3bMax = Math.max(d3bMax, c.dose.reps);
    if(c.dose.reps > REPS_CEILING) d3bBad.push(`W${c.w} prescribes ${c.dose.reps} repeats, above A's ${REPS_CEILING}`);
  }
  if(cards.some(c => c.dose.reps === REPS_CEILING)) d3bTop++;
}
ok(d3bBlocks > 0 && d3bTop > 0 && d3bBad.length === 0,
  `D3b every one of ${d3bBlocks} blocks opens on A's 4 repeats and none exceeds A's ${REPS_CEILING} `
  + `(highest seen ${d3bMax}); ${d3bTop} blocks reach ${REPS_CEILING}, so the ceiling is a live bound and not a vacuous one`
  + (d3bBad.length ? ' — first miss: ' + d3bBad[0] : ''));

// ═════════════════════════════════════════════════════════════════════════════
// D4 — recovery is 2 to 2.5 x the work interval, and it is printed as time"""
s = rep(s, OLD, NEW, 'C3')
io.open(P, 'w', encoding='utf-8').write(s)
print('WROTE ' + P)
