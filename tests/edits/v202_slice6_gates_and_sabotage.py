# V202 slice 6 — gate pins move BACK with the E9 revert, and the E9 sabotage mutation is
# rewritten onto a live behaviour. Anchor-asserted; aborts on the first miss.
import io, json, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
def rd(p): return io.open(ROOT + p, encoding='utf-8').read()
def wr(p, s): io.open(ROOT + p, 'w', encoding='utf-8').write(s)

def rep(s, old, new, label):
    n = s.count(old)
    print('anchor %-6s count=%d' % (label, n))
    if n != 1: sys.exit('ABORT: %s count==%d, want 1' % (label, n))
    return s.replace(old, new)

def cut(s, start, end, new, label):
    for frag, tag in ((start, label + 'a'), (end, label + 'b')):
        n = s.count(frag)
        print('anchor %-6s count=%d' % (tag, n))
        if n != 1: sys.exit('ABORT: %s count==%d, want 1' % (tag, n))
    i = s.index(start); i = s.rindex('\n', 0, i) + 1
    j = s.index(end) + len(end)
    j = s.index('\n', j) + 1
    if j <= i: sys.exit('ABORT: %s end precedes start' % label)
    print('       %s replacing %d bytes' % (label, j - i))
    return s[:i] + new + s[j:]

# ══════════════════════════════════════════════════════════════════════════════
# g202_pace_anchor.js — W6 INT moves off the flat pin
# ══════════════════════════════════════════════════════════════════════════════
P = 'tests/gates/g202_pace_anchor.js'
s = rd(P)
OLDC = """  // V202 slice 3 re-pin, by RULING not by drift. D111 (A 251-252) makes the interval pace
  // the base pace LESS 16 s/mi instead of x0.95, and D105 (A 259-263) holds the pace index at
  // the start pace until reps first reach 8. On this cfg reps run 4,4,5,3,7,8 and first reach 8
  // in week 6, the LAST INT week, so the index never leaves 0: every INT week reads
  // PIN.arr[0] 509.3 less 16 = 493.3 s/mi, which the dose rounds to 493 and the card prints as
  // 8:13/mi. Both rows are hand arithmetic on the array above, not a reading of the artifact.
  // The doctrine derivation and the recovery band live in tests/gates/g202_int_doctrine.js.
  cards: [ { w:1,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },
           { w:6,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },
"""
NEWC = """  // V202 slice 6 re-pin, by RULING not by drift. D111 (A 251-252) makes the interval pace the
  // base pace LESS 16 s/mi instead of x0.95. D105's sequencing (E9) was REVERTED in slice 6:
  // its walk limb fired on 0 of 54 blocks, so it was a pin that could not trip, and it moves to
  // D114/D115. The INT clock therefore walks with the array again, at D101's 5 s/mi/wk:
  //   W1 reads PIN.arr[0] 509.3 less 16 = 493.3 s/mi -> dose 493, printed 8:13/mi
  //   W6 reads PIN.arr[5] 484.3 less 16 = 468.3 s/mi -> dose 468, printed 7:48/mi
  // PIN.arr[5] is PIN.arr[0] less five weeks of the 5 s/mi/wk gain: 509.3 - 25 = 484.3.
  // Both rows are hand arithmetic on the array above, not a reading of the artifact.
  // The doctrine derivation and the recovery band live in tests/gates/g202_int_doctrine.js.
  cards: [ { w:1,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },
           { w:6,  st:/Interval/,                tgt:468, pace:'7:48/mi'  },
"""
s = rep(s, OLDC, NEWC, 'A1')
OLDQ = """ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 493 (8:13/mi), W6 INT 493 (8:13/mi) — both held at `
  + `509.3 less D111's 16 s/mi because D105 keeps the pace clock parked until reps reach 8 — `
  + `W10 CHI 501 (8:21/mi), W1 LSD 659 (10:59/mi), each printed pace equal to its own prescribed seconds`"""
NEWQ = """ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 493 (8:13/mi) and W6 INT 468 (7:48/mi), `
  + `which are array weeks 1 and 6 (509.3 and 484.3) each less D111's 16 s/mi, `
  + `W10 CHI 501 (8:21/mi), W1 LSD 659 (10:59/mi), each printed pace equal to its own prescribed seconds`"""
s = rep(s, OLDQ, NEWQ, 'A2')
wr(P, s)
print('WROTE ' + P)

# ══════════════════════════════════════════════════════════════════════════════
# g202_int_doctrine.js — D1 regex to the ruled copy, D3 re-pointed to D111's identity,
# D6 sweeps the rendered cards, D7 walks
# ══════════════════════════════════════════════════════════════════════════════
P = 'tests/gates/g202_int_doctrine.js'
s = rd(P)
s = rep(s,
  '// g202_int_doctrine.js — V202 slice 3: D111 (E8) and D105 (E9, E10) and E11.\n',
  '// g202_int_doctrine.js — V202 slice 3 (D111 = E8, E10, E11) as amended by slice 6.\n'
  '// E9 (D105 sequencing) was REVERTED by ruling in slice 6 and its rows are gone: the walk\n'
  '// limb fired on 0 of 54 blocks, so it was a rule that could not trip. D105 moves to D114/D115.\n',
  'B1')
s = rep(s,
  '//              little faster each week."                              -> E9\n',
  '//              little faster each week."                              -> D114/D115, not here\n',
  'B2')
s = rep(s,
  "    'A0b guide A still says build progressively toward completing 8 intervals (A 259-263) — the source of E9');",
  "    'A0b guide A still says build progressively toward completing 8 intervals (A 259-263) — the source of D114/D115');",
  'B3')
# D1 reads the ruled sentence
s = rep(s,
  "// printed goal pace it was derived from\n",
  "// printed goal pace it was derived from\n", 'noop') if False else s
s = rep(s,
  '''    const m = /at (\\d+:\\d\\d)\\/mi \\(week \\d+ interval target — slightly faster than this week's goal of (\\d+:\\d\\d)\\/mi\\)/.exec(r.detail);''',
  '''    const m = /at (\\d+:\\d\\d)\\/mi\\. This week's goal pace is (\\d+:\\d\\d)\\/mi\\./.exec(r.detail);''',
  'B4')
s = rep(s,
  '''// ("slightly faster than this week's goal of M:SS/mi"). The gap between those two''',
  '''// ("This week's goal pace is M:SS/mi", the sentence coach ruled in slice 6). The gap between those two''',
  'B5')
s = rep(s,
  "  `D8b W1 LSD still reads 659 s/mi (10:59/mi): the recovery clock is unshifted by E9 `",
  "  `D8b W1 LSD still reads 659 s/mi (10:59/mi): the recovery clock is INT-branch business only `",
  'B6')

D3 = '''// ═════════════════════════════════════════════════════════════════════════════
// D3 — D111's identity, on the card AND in the log
// ═════════════════════════════════════════════════════════════════════════════
// E9 (D105's sequencing) was REVERTED in V202 slice 6 by ruling: its walk limb fired on
// 0 of 54 blocks, because getINTReps first returns 8 at w === the INT span, so the 8-rep
// week is always the LAST INT week and there was nothing after it to walk. A rule that
// cannot trip is a pin that defends nothing (standing ruling 3). D105 is re-sited on
// D114/D115, where a table puts the 8-rep week in the phase INTERIOR.
// What this row asserts instead is D111's identity, which D1 proves on the two PRINTED
// numbers and this row proves between the printed number and the LOGGED one:
//   * a non-cutback card's dose.tgt is the goal pace it prints, less A's 16 s/mi;
//   * a cutback card holds the PRIOR card's target, which is the sentence it prints;
//   * inside a block the target never gets slower.
// One second of slack, and no more: both surfaces round the same fractional second.
let d3bad = [], d3blocks = 0, d3cards = 0, d3cut = 0, d3steps = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  const cards = ints(prog).filter(r => r.dose && r.dose.tgt != null);
  if(!cards.length) continue;
  d3blocks++;
  for(let i = 0; i < cards.length; i++){
    const c = cards[i]; d3cards++;
    const m = /This week's goal pace is (\\d+:\\d\\d)\\/mi/.exec(c.detail);
    if(m){
      const goal = toSec(m[1]);
      if(Math.abs(c.dose.tgt - (goal - INT_SUB)) > 1)
        d3bad.push(`W${c.w} logged ${c.dose.tgt} but prints goal ${m[1]}: gap ${goal - c.dose.tgt}s, want ${INT_SUB}s`);
    } else if(/Cutback week\\. Same target as last week, fewer reps\\./.test(c.detail)){
      d3cut++;
      if(i > 0 && c.dose.tgt !== cards[i-1].dose.tgt)
        d3bad.push(`W${c.w} says "same target as last week" but logs ${c.dose.tgt} against ${cards[i-1].dose.tgt}`);
    } else {
      d3bad.push(`W${c.w} INT card prints neither the goal-pace sentence nor the cutback sentence: ${c.detail.slice(0,70)}`);
    }
    if(i > 0 && c.dose.tgt > cards[i-1].dose.tgt)
      d3bad.push(`W${c.w} target got SLOWER inside the block (${cards[i-1].dose.tgt} -> ${c.dose.tgt})`);
    if(i > 0 && c.dose.tgt < cards[i-1].dose.tgt) d3steps++;
  }
}
ok(d3blocks > 0 && d3cards > 0 && d3cut > 0 && d3bad.length === 0,
  `D3 across ${d3blocks} pace-goal blocks and ${d3cards} INT cards the LOGGED target is the goal pace the card `
  + `PRINTS less ${INT_SUB} s/mi, and each of ${d3cut} cutback cards logs the same target as the week before it, `
  + `exactly as its sentence claims (${d3steps} walking steps observed, never a step backwards)`
  + (d3bad.length ? ' — first miss: ' + d3bad[0] : ''));
'''
s = cut(s, '// D3 — sequencing: the pace clock holds until reps first reach 8',
        'not asserted: it is a property of the ramp, not of D105, and it is the number to hand back to coach.`);',
        D3, 'B7')

D7 = '''// ═════════════════════════════════════════════════════════════════════════════
// D7 — the pinned after-grid, as literals
// ═════════════════════════════════════════════════════════════════════════════
// The PRT TING cfg of g202_pace_anchor.js. Hand route: the pinned progression array is
// [509.3, 504.3, 499.3, 494.3, 489.3, 484.3, ...] at D101's 5 s/mi/wk. The rep grid is
// 4,4,5,3,7,8 and week 4 is the cutback, which holds the PRIOR week's array entry. Each
// week's interval target is its array entry less D111's 16 s/mi:
//   W1 509.3-16=493.3 -> 493 (8:13)   W2 504.3-16=488.3 -> 488 (8:08)
//   W3 499.3-16=483.3 -> 483 (8:03)   W4 cutback, holds W3's entry -> 483 (8:03)
//   W5 489.3-16=473.3 -> 473 (7:53)   W6 484.3-16=468.3 -> 468 (7:48)
// The recovery band is that week's own target: tgt x 400 / 1609.344, x2 and x2.5.
// Both ruled sentences are typed out here verbatim from coach's ruling and compared whole.
const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
const PIN_GRID = [ {w:1,reps:4,tgt:493,pace:'8:13',goal:'8:29'}, {w:2,reps:4,tgt:488,pace:'8:08',goal:'8:24'},
                   {w:3,reps:5,tgt:483,pace:'8:03',goal:'8:19'}, {w:4,reps:3,tgt:483,pace:'8:03',cb:true},
                   {w:5,reps:7,tgt:473,pace:'7:53',goal:'8:09'}, {w:6,reps:8,tgt:468,pace:'7:48',goal:'8:04'} ];
const ruledDetail = g => g.cb
  ? `${g.reps}x400m at ${g.pace}/mi. Cutback week. Same target as last week, fewer reps. ` + handRecTxt(g.tgt) + ' ' + WARMUP
  : `${g.reps}x400m at ${g.pace}/mi. This week's goal pace is ${g.goal}/mi. ` + handRecTxt(g.tgt) + ' ' + WARMUP;
const pCards = ints(IA.buildProgram(PINNED));
let d7bad = [];
if(pCards.length !== PIN_GRID.length) d7bad.push(`${pCards.length} INT cards, want ${PIN_GRID.length}`);
PIN_GRID.forEach((g, i) => {
  const c = pCards[i]; if(!c){ d7bad.push(`W${g.w} missing`); return; }
  if(c.w !== g.w) d7bad.push(`card ${i} is W${c.w} want W${g.w}`);
  if(!c.dose) { d7bad.push(`W${g.w} no dose`); return; }
  if(c.dose.reps !== g.reps) d7bad.push(`W${g.w} reps ${c.dose.reps} want ${g.reps}`);
  if(c.dose.tgt !== g.tgt) d7bad.push(`W${g.w} tgt ${c.dose.tgt} want ${g.tgt}`);
  const hr = handRec(g.tgt);
  if(!c.dose.rec || c.dose.rec.lo !== hr.lo || c.dose.rec.hi !== hr.hi)
    d7bad.push(`W${g.w} rec ${JSON.stringify(c.dose.rec)} want {lo:${hr.lo},hi:${hr.hi}}`);
  if(c.detail !== ruledDetail(g)) d7bad.push(`W${g.w} detail\\n     got  |${c.detail}|\\n     want |${ruledDetail(g)}|`);
});
ok(d7bad.length === 0,
  `D7 the PRT TING after-grid: six INT weeks at ${PIN_GRID.map(g=>g.tgt).join(', ')} s/mi on reps `
  + `${PIN_GRID.map(g=>g.reps).join(',')}, the cutback week holding W3's target, each card's whole sentence `
  + `byte-identical to the ruling and each recovery band that week's own 2 to 2.5x`
  + (d7bad.length ? ' — first miss: ' + d7bad[0] : ''));
'''
s = cut(s, '// D7 — the pinned after-grid, as literals',
        "+ (d7bad.length ? ' — first miss: ' + d7bad[0] : ''));", D7, 'B8')

# D6 — the copy rule, swept over what is actually rendered
OLDD6 = """ok(newSentences.every(s => !MID_DASH.test(s)),
  `D6 neither new sentence carries a mid-sentence hyphen or dash (Mario's standing copy rule); `
  + `sample recovery line: "${handRecTxt(493)}"`);"""
NEWD6 = """ok(newSentences.every(s => !MID_DASH.test(s)),
  `D6 neither new sentence carries a mid-sentence hyphen or dash (Mario's standing copy rule); `
  + `sample recovery line: "${handRecTxt(493)}"`);
// and the rule is checked on what is RENDERED, not only on the fragments: slice 6 rewrote both
// INT detail sentences and both em-dashes they carried are gone.
let d6bad = [], d6n = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  for(const r of ints(prog)){
    d6n++;
    if(MID_DASH.test(r.detail)) d6bad.push(`W${r.w} |${r.detail}|`);
  }
}
ok(d6n > 0 && d6bad.length === 0,
  `D6b no INT card as rendered carries a mid-sentence hyphen or dash across ${d6n} cards: the two the old `
  + `copy carried ("(cutback — holding last week's target)" and "(week N interval target — slightly faster...)") `
  + `are both gone with the slice 6 rewrite`
  + (d6bad.length ? ' — first miss: ' + d6bad[0] : ''));"""
s = rep(s, OLDD6, NEWD6, 'B9')
wr(P, s)
print('WROTE ' + P)

# ══════════════════════════════════════════════════════════════════════════════
# sabotage — the E9 mutation targets code that no longer exists; re-aim it
# ══════════════════════════════════════════════════════════════════════════════
P = 'tests/sabotage/v202.json'
spec = json.loads(rd(P))
hits = [m for m in spec if '_intIdx' in (m.get('anchor') or '')]
print('E9 mutations found: %d' % len(hits))
if len(hits) != 1: sys.exit('ABORT: want exactly 1 E9 mutation, found %d' % len(hits))
m = hits[0]
m['name'] = ("M10 -> the cutback hold is dropped from the INT pace index: a cutback week reads its OWN week "
             "in the progression instead of the PRIOR one, so the card still prints \"Cutback week. Same target "
             "as last week, fewer reps.\" while prescribing a target five seconds per mile faster than the week "
             "it claims to be repeating. The reduced rep count hides it: the session looks easier while the pace "
             "clock quietly tightened on the one week that is supposed to absorb the block. (This mutation "
             "replaces slice 3's E9 mutation, which after the slice 6 revert had no code left to mutate.)")
m['anchor'] = '        const weekPace   = pp ? pp[(_cb && _ppIdx > 0) ? _ppIdx - 1 : _ppIdx] : null;  // D2b: effective index'
m['replacement'] = '        const weekPace   = pp ? pp[_ppIdx] : null;  // D2b: effective index'
wr(P, json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('WROTE ' + P)
