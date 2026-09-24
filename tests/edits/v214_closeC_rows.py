#!/usr/bin/env python3
# V214 close C — RULING-LEVEL rows for three sabotage mutations that survived on V214 because the rows
# guarding them were pair-scoped (213/212) and expired (gatekeeper, V214 proof). Tests only, 5 edits.
#   g213_d113a.js  R8 / R8n / R8v (from 213 up): under the exclusion-key modes (noimpact,
#                  noimpact_swim, easy, reduce) the multi-sport week is not routed through the chooser.
#                  Oracle: the day-by-day SPORT LAYOUT equals V212's for the same cfg (the ruling's own
#                  words, "those builds keep the V212 layout"; V212 frozen at git 169537c). Card content
#                  is not compared. R8v: the same cfgs without the injury ARE routed (layout differs from
#                  V212), so the rows can fail. Guards v213_d113a S5 (pace) and S6 (NRC).
#   g207_gk_trial_present.js  Q9 / Q9x (from 214 up): B4's T-2 limb. From 214 the eve is D158's, so B4
#                  acts only at T-2; Q9 reaches calendars where the pre-pin week dealt an INT or CHI at
#                  T-2 and asserts no hard run there. Q9x is gatekeeper's example, typed. Guards
#                  v208_shakeout S3.
# No index.html change. No ia-version change.
import io, sys
G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

G213 = [
("E1 header R8 rows",
"""//   R4   the 7 spacer calendars at tw 6/9/11/15: three runs a week, one quality a week, INT weeks
""",
"""//   R8   RULING-LEVEL, from 213 up (V214 close C): pace multi-sport under the four excluded modes keeps
//        V212's day-by-day sport layout (the chooser does not route). R8n: the same on NRC multi-sport.
//        R8v: the lattice reaches every excluded mode, and the uninjured twins ARE routed (their layout
//        differs from V212), so R8 and R8n can fail. Not a pair row: V212 is the ruling's named oracle.
//   R4   the 7 spacer calendars at tw 6/9/11/15: three runs a week, one quality a week, INT weeks
"""),
("E2 skip list names R8",
"""  ['HF','R0','R1','R1v','R2','R2v','R3','R3v','R3n','R4','R4p','R5','R6','R7','R7v','HM'].forEach(""",
"""  ['HF','R0','R1','R1v','R2','R2v','R3','R3v','R3n','R8','R8n','R8v','R4','R4p','R5','R6','R7','R7v','HM'].forEach("""),
("E3 R8 block before R4",
"""// ── R4 / R5: the 35 three-day solo pace calendars at tw 6 / 9 / 11 / 15 ──────────────────
""",
"""// ── R8 / R8n / R8v: the exclusion key keeps the chooser off (RULING-LEVEL, from 213 up) ─────────
// D113a amended and D146 slice 2c: under noimpact, noimpact_swim, easy and reduce the multi-sport week
// is not routed through the spacing chooser; it keeps the layout V212 dealt it. R3 / R3n proved that
// as byte identity for the 213/212 pair only, so from 214 nothing guarded the two exclusion conjuncts
// (sabotage v213_d113a S5 and S6 survived the V214 proof). These rows are the ruling's own claim:
// every week's day-by-day SPORT LAYOUT (which days carry a run, bike or swim card, by type and goal)
// equals V212's for the same cfg. Card content is not compared, so a later ruling that rewrites
// injured cards does not trip them; one that re-sites injured multi-sport days must re-pin them.
// The candidate's own injuryPlan picks the population. Calendars with 0 to 2 rest days: the ones with
// enough runs to route (pace from three runs, NRC from two).
{
  const MODES = new Set(['noimpact','noimpact_swim','easy','reduce']);
  const INJ = [{region:'knee',tier:'protect'},{region:'hip',tier:'protect'},{region:'knee',tier:'workaround'},{region:'ankle',tier:'workaround'}];
  const C02 = CALS.filter(r => r.length <= 2);
  const lay = p => Object.keys(p.weeks).map(w => DAYS.map(d => cards(p.weeks[w][d]).map(c => c.type + ':' + (c.goalId || '')).sort().join('+') || '-').join(',')).join('|');
  const POP = { R8: [['run_pace_goal', {bike:'bike_base'}], ['run_pace_goal', {swim:'swim_base'}], ['run_pace_goal', {bike:'bike_ftp', swim:'swim_mile'}]],
                R8n: [['run_5k', {bike:'bike_base'}], ['run_half', {swim:'swim_base'}]] };
  if(!BASE){ ['R8','R8n','R8v'].forEach(r => ok(r + ' the exclusion-key layout rows need V212, the ruling\\'s named oracle', false, baseWhy)); }
  else {
    const plan = IA.eval('injuryPlan'); const R = {};
    Object.keys(POP).forEach(row => {
      const A = {n:0, mv:0, ex:null, crash:0, reach:{}, twins:0, twinMoved:0};
      POP[row].forEach(([g, e], j) => C02.forEach((rest, i) => {
        const foc = FOCI[(i + j) % 3];
        const twin = mkCfg(g, e, rest, foc);
        try { A.twins++; if(lay(build(IA, twin)) !== lay(build(BASE, twin))) A.twinMoved++; } catch(err) { A.crash++; }
        INJ.forEach(inj => {
          const cfg = mkCfg(g, e, rest, foc, {injury:inj});
          const mode = (plan(cl(cfg)) || {}).cardioMode || 'none'; if(!MODES.has(mode)) return;
          let a, b; try { a = build(IA, cfg); b = build(BASE, cfg); } catch(err) { A.crash++; return; }
          A.n++; A.reach[mode] = (A.reach[mode] || 0) + 1;
          if(lay(a) !== lay(b)){ A.mv++; if(!A.ex) A.ex = g + ' ' + JSON.stringify(e) + ' ' + mode + ' ' + inj.region + '/' + inj.tier + ' rest=' + (rest.join('') || 'none'); }
        });
      }));
      R[row] = A;
    });
    ok('R8 pace multi-sport under the excluded modes keeps V212\\'s day-by-day sport layout, every week (' + R.R8.n + ' builds)', R.R8.n > 0 && R.R8.crash === 0 && R.R8.mv === 0, R.R8.mv + ' re-sited, first ' + R.R8.ex + ', crash ' + R.R8.crash);
    ok('R8n NRC multi-sport under the excluded modes keeps V212\\'s day-by-day sport layout, every week (' + R.R8n.n + ' builds)', R.R8n.n > 0 && R.R8n.crash === 0 && R.R8n.mv === 0, R.R8n.mv + ' re-sited, first ' + R.R8n.ex + ', crash ' + R.R8n.crash);
    ok('R8v reach: every excluded mode (pace ' + JSON.stringify(R.R8.reach) + ', NRC ' + JSON.stringify(R.R8n.reach) + '), and the uninjured twins are routed (pace ' + R.R8.twinMoved + '/' + R.R8.twins + ', NRC ' + R.R8n.twinMoved + '/' + R.R8n.twins + ' differ from V212), so R8 and R8n can fail',
      [...MODES].every(m => R.R8.reach[m] > 0 && R.R8n.reach[m] > 0) && R.R8.twinMoved > 0 && R.R8n.twinMoved > 0, JSON.stringify({pace:R.R8.twinMoved, nrc:R.R8n.twinMoved}));
  }
}

// ── R4 / R5: the 35 three-day solo pace calendars at tw 6 / 9 / 11 / 15 ──────────────────
"""),
]

G207 = [
("E4 QROWS names Q9",
"""const ERA208 = 208, QROWS = ['Q0','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8'];""",
"""const ERA208 = 208, QROWS = ['Q0','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q9x'];"""),
("E5 Q9 block before the final done",
"""  ok('Q7 HALF_MANNY digest is 0ac7da6b1691a8e1 (ruled unmoved: no NRC card moves)', hm === '0ac7da6b1691a8e1', hm); }
done();""",
"""  ok('Q7 HALF_MANNY digest is 0ac7da6b1691a8e1 (ruled unmoved: no NRC card moves)', hm === '0ac7da6b1691a8e1', hm); }
// ══ V214 close C: Q9 / Q9x, B4's T-2 limb (from ia-version 214) ═══════════════════════════════
// From 214 the eve is D158's shakeout, so B4 (D106a) acts only at T-2, and no row from 214 up reached
// a calendar where B4 fires there (sabotage v208_shakeout S3, B4 keeping only its long-LSD limb,
// survived the V214 proof). Q9: wherever the pre-pin week dealt an INT or CHI at T-2 (read across the
// week boundary), the pinned T-2 carries no hard run (INT or CHI by the era label, an LSD with legLoad
// true, a TIME TRIAL). The lattice adds week-1 tests and a Wed/Thu/Fri rest calendar, where B4 fires.
// Q9x: gatekeeper's example, typed: training Mon, Tue, Sat, Sun; test Thursday of week 1; T-2 is W1
// Tue, dealt an INT or CHI before the pin; it prints the week's easy LSD and nothing hard.
if(VER < ERA214) ['Q9','Q9x'].forEach(r => console.log('SKIP ' + r + ' ia-version ' + VER + ' predates D158 (V' + ERA214 + '); B4 owned T-1 as well there'));
else {
  const HARDC = c => !!c && c.type === 'run' && (HARD.test(c.subtype || '') || /TIME TRIAL/.test(c.subtype || '') || (!!c.legLoad && /^Long Slow Distance/.test(c.subtype || '')));
  const cardsOf = x => [].concat((x && x.cardio) || []).filter(Boolean);
  const B4REST = [[], ['sun'], ['sun','wed'], ['sat','sun'], ['mon','thu'], ['sun','tue','thu','sat'], ['fri'], ['wed','thu','fri']];
  const mkQ = (mk, rest, tw, wd) => ({name:'GK', primaryPath:'event', eventTargeted:true, raceDate:isoOff(7 * (tw - 1) + wd), _testWeek:tw, _raceDateCappedWeeks:tw,
    cardioTypes:MIX[mk].types.slice(), cardioGoals:clone(MIX[mk].goals), liftingFocus:'balanced', experience:'intermediate',
    ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:185, squat:255, deadlift:315, startDate:isoOff(0), seed:24865});
  let n = 0, reach = 0; const bad = [], crash = [];
  for(const mk of Object.keys(MIX)) for(const rest of B4REST) for(const tw of [1, 2, 5]) for(let wd = 0; wd < 7; wd++){
    const cfg = mkQ(mk, rest, tw, wd), tag = `${mk} rest ${rest.join('') || 'none'} tw ${tw} test ${cfg.raceDate} (${DAYS[wd]})`;
    let p, pre; try { p = clone(IA.buildProgram(clone(cfg))); const pc = clone(cfg); delete pc._testWeek; pre = clone(IA.buildProgram(pc)); } catch(e){ crash.push(tag + ': ' + e.message); continue; }
    const flat = []; [tw - 1, tw].forEach(w => { if(p.weeks[w]) DAYS.forEach(d => flat.push({w, d})); });
    const ti = flat.findIndex(x => x.w === tw && x.d === DAYS[wd]); const x = ti >= 2 ? flat[ti - 2] : null; if(!x) continue;
    n++;
    if(cardsOf(pre.weeks[x.w] && pre.weeks[x.w][x.d]).some(c => c.type === 'run' && HARD.test(c.subtype || ''))) reach++;
    const h = cardsOf(p.weeks[x.w][x.d]).filter(HARDC);
    if(h.length) bad.push(tag + ' T-2 W' + x.w + ' ' + x.d + ': ' + h.map(c => c.subtype + ' legLoad ' + c.legLoad).join(' + '));
  }
  ok(`Q9 B4 at T-2: ${n} dated programs (3 mixes x ${B4REST.length} rest sets x tw 1,2,5 x 7 test weekdays), ${reach} with an INT or CHI dealt at T-2 before the pin: no hard run at T-2`,
     crash.length === 0 && reach > 0 && bad.length === 0, 'crash ' + crash.length + ', reach ' + reach + ', ' + bad.length + ': ' + bad.slice(0, 3).join('; '));
  const cfg = mkQ('run', ['wed','thu','fri'], 1, 3);
  let p, pre; try { p = clone(IA.buildProgram(clone(cfg))); const pc = clone(cfg); delete pc._testWeek; pre = clone(IA.buildProgram(pc)); } catch(e){ p = null; ok('Q9x example builds', false, e.message); }
  if(p){
    const preTue = cardsOf(pre.weeks[1] && pre.weeks[1].tue), tue = p.weeks[1] && p.weeks[1].tue, cs = cardsOf(tue);
    ok('Q9x gatekeeper\\'s example (train Mon Tue Sat Sun, test Thu of week 1): W1 Tue held an INT or CHI before the pin, and now carries one run card, the easy LSD, nothing hard',
       preTue.some(c => c.type === 'run' && HARD.test(c.subtype || '')) && !!tue && cs.length === 1 && EASY(cs[0]) && !HARDC(cs[0]),
       'pre-pin ' + (preTue.map(c => c.subtype).join('|') || 'none') + ' / pinned ' + (tue ? tue.title + ' ' + cs.map(c => c.subtype + ' legLoad ' + c.legLoad).join('|') : 'no day'));
  }
}
done();"""),
]

def plan(fname, reps):
    p = G + fname; src = io.open(p, encoding='utf-8').read(); bad = False
    for tag, old, new in reps:
        c = src.count(old); print('%-26s %-34s count=%d' % (fname, tag, c)); bad |= (c != 1)
    return p, src, bad
jobs = [plan('g213_d113a.js', G213), plan('g207_gk_trial_present.js', G207)]
if any(b for _, _, b in jobs):
    sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for (p, src, _), reps in zip(jobs, [G213, G207]):
    for tag, old, new in reps: src = src.replace(old, new, 1)
    io.open(p, 'w', encoding='utf-8').write(src); print('WROTE', p)
