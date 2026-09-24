#!/usr/bin/env python3
# V214 slice 1c rows (coach ruling, V214 proof) in tests/gates/g214_d158_eve.js. 4 edits.
#   D7  PAIR (214 vs 213, the build's own claim): 0 lift-role changes on T-2, T-1 and the test day across
#       an injured dated lattice (lift-role re-deal is accepted at T-3 and earlier ONLY).
#   D8  RULING-LEVEL (from 214 up): under the exclusion-key modes a training-day eve is handled as V213's
#       rule handles it (same card types and subtypes, same lift presence, same rest flag): no shakeout
#       card and no new lift on an excluded-mode eve. V213 is the oracle the ruling names.
#   V213 is now read for every candidate from 214 up (D8 needs it); D5, D6 and D7 stay pair-scoped.
# Pre-existing lifts at T-1 / T-2 under a parked test are ruled NOT a defect and are not asserted.
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g214_d158_eve.js'
src = io.open(P, encoding='utf-8').read()
REPS = [
("E1 header D7 D8",
"""//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved: an NRC fixture, no test pin).
""",
"""//   D7   PAIR (V214 fix, coach). Across an injured dated lattice (7 injury modes), the lift role of T-2,
//        T-1 and the test day equals V213's. Lift-role re-deal is accepted at T-3 and earlier only.
//   D8   RULING-LEVEL, from 214 up (V214 fix, coach): D158 skips the protect-park modes (the D113a
//        exclusion key: noimpact, noimpact_swim, easy, reduce). Under them a training-day eve is handled
//        as V213 handles it: same card types and subtypes, same lift presence, same rest flag. V213 (git
//        bc3cccc) is the oracle the ruling names. Pre-existing lifts at T-1 / T-2 under a parked test are
//        ruled not a defect and are not asserted anywhere in this file.
//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved: an NRC fixture, no test pin).
"""),
("E2 ROWS names D7 D8",
"""const ROWS = ['D0','D1','D2','D2v','D3','D4','D5','D6','HM'];""",
"""const ROWS = ['D0','D1','D2','D2v','D3','D4','D5','D6','D7','D8','HM'];"""),
("E3 V213 read from 214 up",
"""if(VER === ERA){
  if(BASEFILE && fs.existsSync(BASEFILE)){""",
"""{   // V214 fix: read for every candidate from 214 up, because D8 (ruling-level) needs it; D5-D7 stay pair-scoped
  if(BASEFILE && fs.existsSync(BASEFILE)){"""),
("E4 D7 D8 block before HM",
"""{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }""",
"""// ── D7 / D8: the protect-park modes (V214 fix, coach; see header) ──────────────────────────────
{
  const INJ7 = {none:null, easy:{region:'lowback',tier:'workaround'}, noimpact:{region:'knee',tier:'protect'}, noimpact_swim:{region:'lowback',tier:'protect'},
                reduce:{region:'ankle',tier:'workaround'}, swimout:{region:'shoulder',tier:'protect'}, halfstep:{region:'knee',halfstep:true}};
  const EXCL = new Set(['noimpact','noimpact_swim','easy','reduce']);
  const R7 = [[], ['sun'], ['sun','wed'], ['sat','sun'], ['mon','thu'], ['sun','tue','thu','sat'], ['fri'], ['wed','thu','fri']];
  const PLACE = [[1, 3], [2, 5], [3, 6], [4, 0]];   // test on tw 1 Thu, tw 2 Sat, tw 3 Sun, tw 4 Mon (gatekeeper's placements)
  const isLift = s => !!s && (s.items || []).length && !/mobility|stretch|taper/i.test(s.label || '');
  const role = x => { const L = (x && !x.rest ? x.sections || [] : []).filter(isLift);
    return L.length ? (x.title || '') + ' [' + L.map(s => (s.label || '') + ':' + (s.items || []).map(i => String(i.name || '').replace(/<svg[\\s\\S]*?<\\/svg>\\s*/g, '')).join('/')).join('; ') + ']' : '-'; };
  const eveSig = x => canon({rest: !x || !!x.rest, lift: role(x) !== '-', cards: cards(x).map(c => c.type + ':' + (c.subtype || '')).sort()});
  if(!BASE){
    ok('D8 the excluded-mode eve row needs V213, the ruling\\'s named oracle', false, baseWhy);
    if(VER === ERA) ok('D7 the lift-role pair row needs V213', false, baseWhy); else console.log('SKIP D7 scoped to the build pair candidate 214 against baseline 213');
  } else {
    const plan = IA.eval('injuryPlan'); let n = 0, crash = 0, d8n = 0; const d7 = [], d8 = [], reach = {};
    for(const mk of ['run','run+bike','run+swim']) for(const rest of R7) for(const [tw, wd] of PLACE) for(const ik of Object.keys(INJ7)){
      const cfg = mkCfg('pace', mk, rest, tw, wd); if(INJ7[ik]) cfg.injury = clone(INJ7[ik]);
      const mode = (plan(clone(cfg)) || {}).cardioMode || 'none';
      const test = addDays(START, 7 * (tw - 1) + wd);
      const T = [0, 1, 2].map(k => { const d = addDays(test, -k); return {k, w:weekOf(d), d:JSDAY[d.getDay()]}; });
      const tag = `${mk} rest ${rest.join('') || 'none'} ${ik} (${mode}) test ${cfg.raceDate}`;
      let a, b; try { a = clone(IA.buildProgram(clone(cfg))); b = clone(BASE.buildProgram(clone(cfg))); } catch(e){ crash++; continue; }
      n++;
      const at = (p, x) => p.weeks[x.w] ? p.weeks[x.w][x.d] : undefined;
      T.forEach(x => { const ra = role(at(a, x)), rb = role(at(b, x)); if(ra !== rb) d7.push(tag + ' T-' + x.k + ' W' + x.w + ' ' + x.d + ': ' + rb.slice(0, 60) + ' -> ' + ra.slice(0, 60)); });
      if(EXCL.has(mode) && !cfg.restDays.includes(T[1].d)){
        d8n++; reach[mode] = (reach[mode] || 0) + 1;
        const sa = eveSig(at(a, T[1])), sb = eveSig(at(b, T[1]));
        if(sa !== sb) d8.push(tag + ' eve W' + T[1].w + ' ' + T[1].d + ': V213 ' + sb + ' now ' + sa);
      }
    }
    if(VER === ERA) ok(`D7 PAIR: ${n} injured dated programs (3 mixes x ${R7.length} rest sets x 4 test placements x 7 injury modes): 0 lift-role changes against V213 on T-2, T-1 and the test day`,
                       n > 0 && crash === 0 && d7.length === 0, 'crash ' + crash + ', ' + d7.length + ': ' + d7.slice(0, 3).join(' || '));
    else console.log('SKIP D7 scoped to the build pair candidate 214 against baseline 213; this pair is ' + VER + ' vs 213');
    ok(`D8 under the protect-park modes the training-day eve is handled as V213 handles it: no shakeout card, no new lift, same rest flag (${d8n} eves, ${JSON.stringify(reach)})`,
       crash === 0 && [...EXCL].every(m => reach[m] > 0) && d8.length === 0, 'crash ' + crash + ', ' + d8.length + '/' + d8n + ': ' + d8.slice(0, 2).join(' || '));
  }
}
{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }"""),
]
bad = False
for tag, old, new in REPS:
    c = src.count(old); print('%-28s count=%d' % (tag, c)); bad |= (c != 1)
if bad: sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for tag, old, new in REPS: src = src.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(src); print('WROTE', P)
