#!/usr/bin/env python3
"""V205 slice 7e, part 2 of 2 — the two coverage gaps. TESTS ONLY.

index.html is NOT touched. ia-version stays at 204.

MEASURED FIRST (tests/measure/v205_d130_slice7e_subset_gap.js and
tests/measure/v205_d130_slice7e_nrc_identity.js), because a row written to make a
survivor trip must be aimed at the live behaviour, not at the behaviour the brief
assumed. The two gaps turned out to have different shapes:

  GAP A (v205_d125.json S1, the subset pin restored). The brief's premise does not
  survive the measure: the subset half of the D125 relaxation rescues ZERO calendars.
  At a four-run ceiling the collision floor reaches 0 on 50 of 64 calendars shipped,
  on 50 of 64 with the SUBSET pin alone restored (it costs nothing), on 48 with the
  PERMUTATION pin alone, and on 45 with both, which is P3b's control. 45 -> 50 is the
  JOINT relaxation. The subset half's only observable anywhere is ONE pace row, rest
  wed+thu at a four-run ceiling, and it is decided at RANK 9 (qualFirst), a term
  g205_d125_spaced.js does not score and never claimed to. So S1 cannot be made to
  trip its named gate by any honest row; it already trips g205_d129_tiebreak.js P1,
  measured, naming that exact row. S1 is re-pointed at the gate that owns rank 9, and
  the attribution is written into g205_d125_spaced.js as P3c so no future reader
  re-credits 45 -> 50 to the wrong half.

  GAP B (v205_d129.json S2, identity live on the NRC arm). NOT inert: 129 of 800 NRC
  rows move. P2 could not see it because identity only reorders layouts INSIDE the
  five-term maximum P2 asserts. P2c is added, and it asserts the ruling's own claim.

Four edits. Every anchor asserted count==1 before anything is written.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tests/
REPO = os.path.dirname(ROOT)
SPACED = os.path.join(ROOT, 'gates', 'g205_d125_spaced.js')
TIE    = os.path.join(ROOT, 'gates', 'g205_d129_tiebreak.js')
S_D125 = os.path.join(ROOT, 'sabotage', 'v205_d125.json')
S_D129 = os.path.join(ROOT, 'sabotage', 'v205_d129.json')

def die(m): sys.exit('ABORT: ' + m)

def read(p): return open(p, encoding='utf-8').read()

def load(p):
    raw = read(p); rows = json.loads(raw)
    if json.dumps(rows, indent=2, ensure_ascii=False) + '\n' != raw:
        die(p + ' does not round-trip; structural editing would reformat it')
    return rows

def one(rows, tag):
    h = [i for i, r in enumerate(rows) if r['name'].startswith(tag + ' ')]
    if len(h) != 1: die('row %s: count==%d, expected 1' % (tag, len(h)))
    return h[0]

# ── anchors ───────────────────────────────────────────────────────────────────
A_P3B = ("ok('P3b relaxing the long-run pin rescues exactly the five ruled calendars',\n"
         "   rescued.length === 5 && RESCUED.every(r => rescued.indexOf(r) >= 0), rescued.join(' '));")
A_P2  = ("ok(p2bad===0,'P2: '+p2bad+'/'+nrcRows+' NRC rows are not five-term optimal');\n"
         "console.log('  NRC rows scored: '+nrcRows);")

spaced, tie = read(SPACED), read(TIE)
for src, anc, nm in ((spaced, A_P3B, 'g205_d125_spaced P3b'), (tie, A_P2, 'g205_d129_tiebreak P2')):
    n = src.count(anc)
    if n != 1: die('%s anchor count==%d, expected 1' % (nm, n))
for src, tok, nm in ((spaced, 'P3c', 'spaced'), (tie, 'P2c', 'tiebreak')):
    if tok in src: die('%s already carries a %s row; refusing to double-insert' % (nm, tok))

d125, d129 = load(S_D125), load(S_D129)
i_s1 = one(d125, 'S1'); i_s2 = one(d129, 'S2'); i_s3 = one(d129, 'S3')
if d125[i_s1]['gate'] != 'gates/g205_d125_spaced.js':
    die('v205_d125 S1 is not pointed at the spaced gate; the premise of edit 1 is wrong')
print('ASSERT: both gate anchors count==1, neither row exists yet, S1/S2/S3 each count==1')

# ── EDIT 1: g205_d125_spaced.js gains P3c, the attribution row ────────────────
P3C = A_P3B + """

// ── P3c ATTRIBUTION: which HALF of the relaxation buys the five? ───────────────
// P3 and P3b relax BOTH pins at once. `pinned` in space() above gates the SUBSET rule
// (the chosen day set must END on the last training day) and the PERMUTATION rule (the
// long run must BE that last day) together, so P3b's five are the joint delta and the
// row's own label, "the long-run pin", reads as if one pin did the work. Split them and
// the credit does not divide the way it has been read. Restoring the SUBSET pin alone
// still reaches 50 of 64: it rescues NOTHING. Restoring the PERMUTATION pin alone drops
// to 48 and names two calendars. Both together drop to 45, which is P3b's control, so
// three of the five rescues need both pins relaxed and belong to neither half alone.
// Recorded here because the subset half's only observable anywhere in the build is ONE
// pace row -- rest wed+thu at a four-run ceiling -- and that row is decided at RANK 9,
// which g205_d129_tiebreak.js scores and this file does not. v205_d125.json S1 is
// pointed there for that reason. No engine value enters this row: it is this file's own
// exhaustive search filtered four ways.
{
  const mc = l => l.reduce((m,c)=>Math.min(m,c.coll), 99);
  const z = { free:0, subsetPin:0, permPin:0, both:0 }; const permRescue = [], subsetRescue = [];
  CAL.forEach(({rest, train}) => {
    const last = train[train.length-1];
    const all = space(train, 4, TP, false);
    const endOnly  = all.filter(c => c.days[c.days.length-1] === last);
    const permOnly = all.filter(c => { const L = c.days.find(d=>c.typeOf[d]===TP.long); return !L || L === c.days[c.days.length-1]; });
    const f = mc(all), s = mc(endOnly), p = mc(permOnly), b = mc(permOnly.filter(c=>c.days[c.days.length-1]===last));
    if(f === 0) z.free++;
    if(s === 0) z.subsetPin++;
    if(p === 0) z.permPin++;
    if(b === 0) z.both++;
    if(f === 0 && s > 0) subsetRescue.push(rest.join('+') || 'none');
    if(f === 0 && p > 0) permRescue.push(rest.join('+') || 'none');
  });
  ok('P3c the SUBSET half of the relaxation rescues no calendar at all (50 of 64 either way)',
     z.free === 50 && z.subsetPin === 50 && subsetRescue.length === 0,
     'free=' + z.free + ' subsetPin=' + z.subsetPin + ' rescued=[' + subsetRescue.join(' ') + ']');
  ok('P3d the PERMUTATION half alone rescues two (48 of 64), both pins together leave 45, and P3b\\'s five is the JOINT delta',
     z.permPin === 48 && z.both === 45 && permRescue.slice().sort().join(' ') === 'mon+tue+thu mon+wed+thu',
     'permPin=' + z.permPin + ' both=' + z.both + ' permRescue=[' + permRescue.join(' ') + ']');
}"""
spaced = spaced.replace(A_P3B, P3C)

# ── EDIT 2: g205_d129_tiebreak.js gains P2c, NRC's freedom from identity ──────
P2C = A_P2 + """

// ── P2c: IDENTITY IS NOT CONSULTED ON THE NRC ARM ────────────────────────────
// P2 proves NRC picks a MAXIMUM of the five ruled terms. Identity only ever reorders
// layouts INSIDE that maximum, so P2 cannot see it and never claimed to: letting the
// term off its paceFam leash moves 129 of 800 NRC rows with P2 still green. This row
// asserts the ruling's own words -- ranks 6 to 9 are pace-family-only, NRC identical on
// 804/804 -- in a form that scoring identity on NRC makes FALSE.
// THE ORACLE is the definition of rank 6 plus this file's exhaustive search, with no
// engine value in it. If identity were live on NRC then on EVERY row whose five-term tie
// set spans more than one day set AND contains the even-spread subset, the engine would
// be FORCED to return the even-spread subset; that is what the term does. So one NRC row
// that is offered the even-spread subset at the top of the ruled objective and walks away
// from it is a proof that identity is not scored there. Measured: 445 rows carry a
// multi-subset tie, the even-spread subset sits in 357 of them, and the engine declines
// it on 129. That 129 is the same population counted from the other side -- it is exactly
// the number of NRC rows that move when the leash comes off.
console.log('P2c identity is pace-family-only: NRC declines the even-spread subset it is offered');
{
  let tieMulti=0, evenInTie=0, takesEven=0, takesOther=0; const ex=[];
  ['run_5k','run_10k','run_half','run_marathon'].forEach(g=>{
    [0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
      const train=DAYS.filter(d=>rest.indexOf(d)<0), n=train.length;
      for(let cap=2;cap<n;cap++){
        const all=space(train,cap,E.gn(cap,g),TN,false); if(!all.length) continue;
        const subs={}; topBy(all,'ruled').forEach(c=>subs[c.idxs.join(',')]=1);
        if(Object.keys(subs).length<2) continue;
        tieMulti++;
        const evk=evenIdx(n,cap).join(',');
        if(!subs[evk]) continue;
        evenInTie++;
        const pick=E.c(train,cap,g,false);
        if(pick.idxs.join(',')===evk) takesEven++;
        else { takesOther++; if(ex.length<3) ex.push(g+' rest '+(rest.join('+')||'none')+' cap'+cap+' even='+evk+' engine='+pick.idxs.join(',')); }
      }
    }));
  });
  ok(tieMulti===445 && evenInTie===357,
     'P2c population: '+tieMulti+' multi-subset ties (expected 445), even-spread subset in '+evenInTie+' (expected 357)');
  ok(takesOther===129 && takesEven===228,
     'P2c: the engine declined the even-spread subset on '+takesOther+' rows (expected 129) and took it on '+takesEven+' (expected 228). Zero declines means identity is scored on NRC');
  console.log('  NRC declined it on '+takesOther+'/'+evenInTie+' offered rows; e.g. '+ex.join(' | '));
}"""
tie = tie.replace(A_P2, P2C)

# ── EDIT 3: v205_d125.json S1 is re-pointed at the gate that owns rank 9 ──────
d125[i_s1]['gate'] = 'gates/g205_d129_tiebreak.js'
d125[i_s1]['note'] += (
    " RE-POINTED AT SLICE 7E, and the row's own premise corrected with it. This row used to "
    "name gates/g205_d125_spaced.js and it SURVIVED there at PASS 19 FAIL 0, which is not a gate "
    "hole and not a no-op either. Measured: restoring the subset pin moves the engine on exactly "
    "ONE of 157 pace rows, rest wed+thu at a four-run ceiling, and that row TIES on all six terms "
    "the spaced gate scores and loses at RANK 9 (qualFirst, -2 against 0). The spaced gate's oracle "
    "stops at rank 6 by design, so it cannot see the difference and no honest row in that file can "
    "be made to. g205_d129_tiebreak.js carries all nine terms and already catches it: measured "
    "PASS 108 FAIL 1, P1 naming rest wed+thu cap4. NAMED TRIP: P1, one row. The claim in this "
    "row's name that the subset relaxation is what buys the five-training-day calendars is WRONG "
    "and is corrected by P3c/P3d in g205_d125_spaced.js: the subset half rescues ZERO calendars "
    "(50 of 64 either way), the permutation half alone rescues two (48 of 64), and 45 -> 50 is the "
    "two pins relaxed together. The subset half buys a tiebreak, not a calendar."
)

# ── EDIT 4: v205_d129.json S2 and S3 notes reconciled with the measured trips ─
d129[i_s2]['note'] += (
    " CLOSED AT SLICE 7E. This row SURVIVED at PASS 109 FAIL 0 and the reason was a real coverage "
    "hole, not a no-op: P2 asserts NRC picks a MAXIMUM of the five ruled terms, and identity only "
    "ever reorders layouts INSIDE that maximum, so P2 stays green while 129 of 800 NRC rows move. "
    "P2c now owns the claim. Its oracle is the definition of rank 6 plus the gate's own exhaustive "
    "search: with identity live on NRC, every row whose five-term tie set spans more than one day "
    "set and contains the even-spread subset must return that subset, so the 129 rows where the "
    "engine declines it become 0. NAMED TRIP: P2c (the second of its two assertions; the 445/357 "
    "population assertion is pure oracle and stays green, which is how the row shows it is the "
    "engine that moved and not the population)."
)
d129[i_s3]['note'] += (
    " MEASURED AT SLICE 7E after the re-anchor: PASS 94 FAIL 15 against a baseline of PASS 109 "
    "FAIL 0. EXPECTED, corrected from the pre-D130 note above: P1 on 14 of the pace rows (the "
    "engine's own pick loses the identity term it used to win on, so it stops being a lexicographic "
    "maximum of the hand-scored vector) AND P3, the identity row itself, on 15 named calendars "
    "including rest fri cap3 (incumbent sun,wed,sat, engine picked mon,wed,sat). The original note "
    "named P3 alone."
)

open(SPACED, 'w', encoding='utf-8').write(spaced)
open(TIE,    'w', encoding='utf-8').write(tie)
open(S_D125, 'w', encoding='utf-8').write(json.dumps(d125, indent=2, ensure_ascii=False) + '\n')
open(S_D129, 'w', encoding='utf-8').write(json.dumps(d129, indent=2, ensure_ascii=False) + '\n')
print('WROTE tests/gates/g205_d125_spaced.js   (+P3c, +P3d attribution)')
print('WROTE tests/gates/g205_d129_tiebreak.js (+P2c, NRC freedom from identity)')
print('WROTE tests/sabotage/v205_d125.json     (S1 re-pointed at gates/g205_d129_tiebreak.js)')
print('WROTE tests/sabotage/v205_d129.json     (S2 and S3 notes reconciled)')
