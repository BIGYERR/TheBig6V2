#!/usr/bin/env python3
# V213 slice 3b — era rows at ia-version >= 213 for D113a, in three existing gates. Every row at or
# below 212 is left as it was: each change is keyed on ia-version, and the <=212 branch runs the
# text that was there before.
#   (i)   tests/gates/g202_int_doctrine.js  D7 at >= 213 (coach's text): a two-quality three-run build
#         carries one INT and one CHI every week; the 7 spacer calendars carry INT weeks 1..cross-1 then
#         CHI weeks cross..tw, cross = max(3, ceil(tw x 0.55)). THE LICENCE IS RETIRED: the three-run
#         arm pinned to V212's artifact refused above 212, and from 213 the rule row replaces it. The
#         constant stays and is still read: above 212 with no D113a rule row it still refuses. The
#         population at >= 213 adds the 35 three-training-day solo pace calendars, and D7 fails loudly
#         unless it reaches 7 spacer and 28 two-quality builds.
#   (ii)  tests/gates/g205_d125_spaced.js  the hand NSW table becomes an era table (the 3-run row is
#         INT / CHI / long from 213, easy / INT / long through 212); the lifted-chooser oracle applies
#         the spacer fallback at three runs; P0b reads the engine's table with the pace flag at >= 213;
#         P8c at >= 213 allows a mid-week long run where the D125 objective ranks every long-last layout
#         below the one it chose.
#   (iii) tests/gates/g205_d129_tiebreak.js  P1, P1b, P3 and P4 (the rows that score the lifted chooser)
#         read the three-run type set through an era row, with the spacer fallback. P5..P8 are unchanged:
#         P6 and P7 pin D129's own after-grid on the type set it was ruled on and read no engine pick.
# No index.html change. No ia-version change.
import io, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

def apply(fname, reps):
    p = ROOT + fname
    src = io.open(p, encoding='utf-8').read()
    bad = False
    for tag, old, new in reps:
        c = src.count(old)
        print('%-34s %-44s count=%d' % (fname, tag, c))
        if c != 1: bad = True
    if bad:
        sys.exit('ABORT: an anchor in %s did not appear exactly once. Nothing written.' % fname)
    for tag, old, new in reps:
        if src.count(old) != 1:
            sys.exit('ABORT: %s anchor %s drifted after an earlier replacement. Nothing written.' % (fname, tag))
        src = src.replace(old, new, 1)
    return p, src

# ════════════════════════════════ (i) g202 ════════════════════════════════
G202 = [
("E1 era row 213",
"""    note: 'Table 6 on the calendar week through the cutback and taper branches; the '
        + 'three-run arm still runs the V115 crossover and is licensed to 212 (D142 renewal at V212; D113a builds at V213)' }
];""",
"""    note: 'Table 6 on the calendar week through the cutback and taper branches; the '
        + 'three-run arm still runs the V115 crossover and is licensed to 212 (D142 renewal at V212; D113a builds at V213)' },
  { upTo: Infinity, arm: 'd113a', reps: 'table6',
    // V213 (D113a, coach). ONE ROW, THREE SHAPES, and the shape is read off the build, never
    // assumed. A four-run build is unchanged from the 212 row. A three-run build on a calendar
    // that can space INT / CHI / long carries ONE INT AND ONE CHI EVERY WEEK. A three-run build
    // on one of the 7 SPACER calendars (typed below) keeps easy / INT / long and its one quality
    // slot crosses: INT in weeks 1..cross-1, CHI in weeks cross..tw. Reps are Table 6 on the
    // calendar week in every shape (measured on the D113a tree: the spacer INT weeks print
    // 4,4,5,3,6,6 at 11 weeks, which is Table 6, not the V115 ramp's 4,4,5,3,7,8).
    note: 'D113a: four-run as the 212 row; three-run two-quality = one INT + one CHI every week; '
        + 'three-run spacer = INT 1..cross-1 then CHI cross..tw; reps Table 6' }
];"""),
("E2 licence retired",
"""const THREE_RUN_LICENCE_TO = 212; // V212 renewal (D142): D113a builds at V213. Renew by one per build until D113a ships.
if(IAV > THREE_RUN_LICENCE_TO){""",
"""// V213 (D113a): THE LICENCE IS RETIRED, NOT RENEWED. D113a ships the rule this licence was
// waiting for, as the era row above, so from 213 the three-run arm is judged by the rule and the
// crossover pin lives only in the <=212 rows. The constant stays because it is still read: an
// artifact above 212 that no D113a rule row covers is refused exactly as before.
const THREE_RUN_LICENCE_TO = 212; // RETIRED at V213 by D113a: the refusal below now fires only when no D113a rule row covers the artifact.
if(IAV > THREE_RUN_LICENCE_TO && !(INT_ERA && INT_ERA.arm === 'd113a')){"""),
("E3 spacer set + 35-calendar population",
"""const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
""",
"""const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

// V213 (D113a): THE 7 SPACER CALENDARS, typed. They are the three-training-day calendars on which
// no order of INT / CHI / long avoids an untolerated hard pair under D130 (two hard runs on
// neighbouring days of the circular week; the one tolerated pair is CHI on the eve of the long).
// D7a re-derives the list from that sentence before D7b may use it.
const D7_WEEK = ['sun','mon','tue','wed','thu','fri','sat'];
const SPACER7 = ['sun+mon+tue','sun+mon+sat','sun+fri+sat','mon+tue+wed','tue+wed+thu','wed+thu+fri','thu+fri+sat'];
function d7combos(a, k){ if(k === 0) return [[]]; if(a.length < k) return []; const [h, ...t] = a; return d7combos(t, k - 1).map(c => [h, ...c]).concat(d7combos(t, k)); }
function d7untol(slots){
  const at = d => D7_WEEK.indexOf(d), nb = (a, b) => { const r = Math.abs(at(a) - at(b)); return Math.min(r, 7 - r) === 1; };
  const L = slots.find(s => s.t === 'long'); let u = 0;
  for(let i = 0; i < slots.length; i++) for(let j = i + 1; j < slots.length; j++){
    const x = slots[i], y = slots[j]; if(!nb(x.d, y.d)) continue;
    const eve = L ? D7_WEEK[(at(L.d) + 6) % 7] : null;
    if(!((x.t === 'chi' && y === L && x.d === eve) || (y.t === 'chi' && x === L && y.d === eve))) u++;
  }
  return u;
}
// The population that REACHES the three-run arm at >= 213: the 35 three-training-day solo pace
// calendars, PINNED's athlete on each. Below 213 it is not built, so the <=212 rows run unchanged.
const THREE35 = d7combos(D7_WEEK, 3).map(c => paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} }, { restDays: D7_WEEK.filter(d => c.indexOf(d) < 0) }));
"""),
("E4 armOf three-run shapes",
"""  if(per.every(n => n === 3)) return { arm:'three-run', tw, per,
    want: Array.from({length: handCrossover(tw) - 1}, (_,i) => i+1) };""",
"""  if(per.every(n => n === 3)){
    // V213 (D113a): the shape is read off the build's own week-1 run days against SPACER7.
    if(INT_ERA && INT_ERA.arm === 'd113a'){
      const run1 = runSessions(prog).filter(r => r.w === 1).map(r => r.d);
      const cal = D7_WEEK.filter(d => run1.indexOf(d) >= 0).join('+'), cr = handCrossover(tw);
      if(SPACER7.indexOf(cal) >= 0) return { arm:'three-run', shape:'spacer', cal, tw, per,
        want: Array.from({length: cr - 1}, (_,i) => i+1), wantChi: Array.from({length: tw - cr + 1}, (_,i) => cr + i) };
      return { arm:'three-run', shape:'two-quality', cal, tw, per,
        want: Array.from({length: tw}, (_,i) => i+1), wantChi: Array.from({length: tw}, (_,i) => i+1) };
    }
    return { arm:'three-run', tw, per,
      want: Array.from({length: handCrossover(tw) - 1}, (_,i) => i+1) };
  }"""),
]
# second batch in g202 (kept in the same file pass; each is a narrow era switch on the D7 loop)
G202 += [
("E5 counters",
"let d7bad = [], d7four = 0, d7three = 0, d7lens = {};",
"let d7bad = [], d7four = 0, d7three = 0, d7lens = {}, d7spacer = 0, d7twoq = 0;"),
("E6 D7a spacer self-check + population",
"""// D7b — THE RULE, on every build in the lattice plus the pinned cfg.
const D7_POP = LAT.concat([PINNED]);""",
"""// D7a (V213) — the typed spacer set is what the D130 sentence derives, before D7b may read it.
{ const P = [['int','chi','long'],['int','long','chi'],['chi','int','long'],['chi','long','int'],['long','int','chi'],['long','chi','int']];
  const got = d7combos(D7_WEEK, 3).filter(c => Math.min(...P.map(p => d7untol(c.map((d, i) => ({d, t:p[i]})))) ) > 0).map(c => c.join('+'));
  if(JSON.stringify(got) !== JSON.stringify(SPACER7)) d7bad.push(`the D130 enumeration derives spacer calendars ${got.join(' ')} but SPACER7 is typed ${SPACER7.join(' ')}`); }

// D7b — THE RULE, on every build in the lattice plus the pinned cfg (plus, from 213, the 35
// three-training-day calendars, so the three-run arm is actually reached).
const D7_POP = LAT.concat([PINNED]).concat(INT_ERA && INT_ERA.arm === 'd113a' ? THREE35 : []);"""),
("E7 era check three-run",
"""    if(INT_ERA && INT_ERA.arm !== 'three-run')
      d7bad.push(`${a.tw}wk build is three-run but""",
"""    if(INT_ERA && INT_ERA.arm !== 'three-run' && INT_ERA.arm !== 'd113a')
      d7bad.push(`${a.tw}wk build is three-run but"""),
("E8 era check four-run",
"""    if(INT_ERA && INT_ERA.arm !== 'four-run')
      d7bad.push(`${a.tw}wk build is four-run but""",
"""    if(INT_ERA && INT_ERA.arm !== 'four-run' && INT_ERA.arm !== 'd113a')
      d7bad.push(`${a.tw}wk build is four-run but"""),
("E9 CHI weeks",
"""  // reps, by the era's mechanism
  const span = handCrossover(a.tw) - 1;""",
"""  // V213 (D113a): the CHI weeks, where the era row names them.
  if(a.wantChi){
    if(a.shape === 'spacer') d7spacer++; else d7twoq++;
    const chiW = runSessions(prog).filter(r => LBL.chi.test(r.st)).map(r => r.w);
    if(JSON.stringify(chiW) !== JSON.stringify(a.wantChi))
      d7bad.push(`${a.tw}wk three-run ${a.shape} build on ${a.cal} carries CHI cards in weeks ${chiW.join(',') || '(none)'} `
        + `but the D113a rule says ${a.wantChi.join(',')}`
        + (a.shape === 'spacer' ? ` (tw - cross + 1 = ${a.wantChi.length}, cross = ${handCrossover(a.tw)})` : ' (one every week)'));
  }
  // reps, by the era's mechanism
  const span = handCrossover(a.tw) - 1;"""),
("E10 D7 population reach + message",
"""const d7arms = `${d7four} four-run and ${d7three} three-run of ${D7_POP.length}`;""",
"""// V213 (D113a): a population that reaches no three-run build proves nothing about the three-run
// arm, so from 213 it fails loudly unless all 35 calendars land where the rule says they must.
if(INT_ERA && INT_ERA.arm === 'd113a' && !(d7three === 35 && d7spacer === 7 && d7twoq === 28))
  d7bad.push(`the D113a population must reach 35 three-run builds, 7 spacer and 28 two-quality; it reached `
    + `${d7three} three-run, ${d7spacer} spacer, ${d7twoq} two-quality`);
const d7arms = `${d7four} four-run and ${d7three} three-run of ${D7_POP.length}`
  + (INT_ERA && INT_ERA.arm === 'd113a' ? ` (D113a: ${d7twoq} two-quality with one INT and one CHI every week, `
    + `${d7spacer} spacer with cross - 1 INT weeks then tw - cross + 1 CHI weeks)` : '');"""),
]

# ════════════════════════════════ (ii) g205_d125_spaced ════════════════════════════════
G125 = [
("E1 NSW table era rows",
"""const NSW_TYPES = { 2:['lsd_easy','lsd_long'], 3:['lsd_easy','int','lsd_long'], 4:['lsd_easy','int','chi','lsd_long'] };""",
"""// V213 (D113a) ERA ROWS (standing ruling 4). From 213 the pace family's three-run week is
// INT / CHI / long (D113a, coach): both qualities every week, the easy run is what yields. Where
// no layout of those three reaches zero untolerated adjacencies, the week keeps easy / INT / long
// (the spacer fallback), typed as NSW_FALLBACK3 and applied inside space() below. The <=212 row is
// the table exactly as it stood.
const NSW_TYPES_BY_ERA = [
  { hi: 212, t: { 2:['lsd_easy','lsd_long'], 3:['lsd_easy','int','lsd_long'], 4:['lsd_easy','int','chi','lsd_long'] } },
  { lo: 213, t: { 2:['lsd_easy','lsd_long'], 3:['int','chi','lsd_long'],      4:['lsd_easy','int','chi','lsd_long'] } }
];
const NSW_TYPES = (NSW_TYPES_BY_ERA.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi))[0] || {}).t;
const NSW_FALLBACK3 = ['lsd_easy','int','lsd_long'];"""),
("E2 P0b engine table read with the pace flag",
"""    const got = ctx.out.gs(Number(k), true, false, false);""",
"""    const got = ctx.out.gs(Number(k), true, false, false, VER >= 213 ? true : undefined);   // V213: the pace flag D113a added"""),
("E3 space -> spaceRaw",
"""function space(train, capDays, T, pinned){
  const types = T === TP ? NSW_TYPES[capDays] : GN(capDays, arguments[4]);""",
"""function spaceRaw(train, capDays, T, pinned, _g, _types){
  const types = _types || (T === TP ? NSW_TYPES[capDays] : GN(capDays, _g));"""),
("E4 space wrapper with the spacer fallback",
"""  return out;
}
const cmpRank =""",
"""  return out;
}
// V213 (D113a): THE SPACER FALLBACK, as the ruling states it: a three-run pace week whose best
// INT / CHI / long layout still carries an untolerated adjacency is laid out as easy / INT / long.
// Below 213 space() is spaceRaw() unchanged.
function space(train, capDays, T, pinned, g){
  const all = spaceRaw(train, capDays, T, pinned, g);
  if(VER >= 213 && T === TP && capDays === 3 && all.length && Math.min(...all.map(c => c.untol)) > 0)
    return spaceRaw(train, capDays, T, pinned, g, NSW_FALLBACK3);
  return all;
}
const cmpRank ="""),
("E5 P8c era",
"""    const p = CH(train, 3, 'run_pace_goal', true);
    const days = p.idxs.map(i => train[i]);
    if(days.find(d => p.typeOf[d] === 'lsd_long') !== days[days.length-1]) off++;
  });
  ok('P8c at the three-run ceiling the long run is still the last run of the week (' + rows + ' calendars)', off === 0, off + ' mid-week');""",
"""    const p = CH(train, 3, 'run_pace_goal', true);
    const days = p.idxs.map(i => train[i]);
    if(days.find(d => p.typeOf[d] === 'lsd_long') !== days[days.length-1]){
      mid++;
      if(VER < 213) off++;
      else {
        // V213 (D113a): the pace arm's long run is a PREFERENCE ranked under the adjacency terms
        // (D125). A mid-week long run is allowed only where the objective chose it: every layout
        // whose long run is the last run ranks below the best.
        const all = space(train, 3, TP, false);
        const lastL = all.filter(c => c.typeOf[c.days[c.days.length-1]] === 'lsd_long');
        if(lastL.length && cmpRank(maxRank(lastL), maxRank(all)) === 0) off++;
      }
    }
  });
  if(VER < 213) ok('P8c at the three-run ceiling the long run is still the last run of the week (' + rows + ' calendars)', off === 0, off + ' mid-week');
  else ok('P8c at the three-run ceiling (D113a, INT / CHI / long) a mid-week long run ships only where the D125 objective ranks every long-last layout below it (' + rows + ' calendars, ' + mid + ' mid-week)', off === 0, off + ' mid-week with a long-last layout tied at the top');"""),
("E6 P8c counter",
"""  let off = 0, rows = 0;
  CAL.forEach(({train}) => {
    if(train.length <= 3) return;""",
"""  let off = 0, rows = 0, mid = 0;
  CAL.forEach(({train}) => {
    if(train.length <= 3) return;"""),
]

# ════════════════════════════════ (iii) g205_d129_tiebreak ════════════════════════════════
G129 = [
("E1 era type set + fallback",
"""const TN={long:'nrc_long',rec:'nrc_recovery',s1:'nrc_speed1',s2:'nrc_speed2'};
""",
"""const TN={long:'nrc_long',rec:'nrc_recovery',s1:'nrc_speed1',s2:'nrc_speed2'};
// V213 (D113a) ERA ROWS (standing ruling 4) for the rows that score the lifted chooser (P1, P1b,
// P3, P4). Through 212 the three-run type set is the engine's own table read, as it always was.
// From 213 it is typed: INT / CHI / long, and where no layout of those three on the row's days
// avoids an untolerated pair under D130 (CHI on the eve of the long is the one tolerated pair),
// the spacer fallback's easy / INT / long. P6 and P7 pin D129's after-grid on the type set D129
// was ruled on and read no engine pick, so they keep the engine-table read at every version.
const PACE3_BY_ERA=[{hi:212,three:null},{lo:213,three:['int','chi','lsd_long'],fallback:['lsd_easy','int','lsd_long']}];
const PACE3=PACE3_BY_ERA.filter(r=>(r.lo===undefined||VER>=r.lo)&&(r.hi===undefined||VER<=r.hi))[0];
function d130untol(days,typeOf){
  const hd=days.filter(d=>['int','chi','lsd_long'].indexOf(typeOf[d])>=0), L=days.find(d=>typeOf[d]==='lsd_long'); let u=0;
  for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++){ const x=hd[a],y=hd[b]; if(circ(x,y)!==1) continue;
    const tol=!!L&&((typeOf[x]==='chi'&&y===L&&x===prevDay(L))||(typeOf[y]==='chi'&&x===L&&y===prevDay(L))); if(!tol) u++; }
  return u;
}
function paceTypes(train,cap){
  if(!PACE3.three||cap!==3) return E.gs(cap,E.sp('run_pace_goal'),false,false);
  const clean=combos(train,3).some(days=>perms(PACE3.three).some(p=>{ const t={}; days.forEach((d,i)=>t[d]=p[i]); return d130untol(days,t)===0; }));
  return clean?PACE3.three:PACE3.fallback;
}
"""),
("E2 P1 types",
"""  const types=E.gs(r.cap, E.sp('run_pace_goal'), false, false);
  const all=space(r.train,r.cap,types,TP,true);
  const pick=E.c(r.train,r.cap,'run_pace_goal',true);""",
"""  const types=paceTypes(r.train,r.cap);   // V213 era row
  const all=space(r.train,r.cap,types,TP,true);
  const pick=E.c(r.train,r.cap,'run_pace_goal',true);"""),
("E3 P1b types",
"""    const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
    const all=space(r.train,r.cap,types,TP,true);
    const got=engIn(all,pick,r.train);
    const better=""",
"""    const types=paceTypes(r.train,r.cap);   // V213 era row
    const all=space(r.train,r.cap,types,TP,true);
    const got=engIn(all,pick,r.train);
    const better="""),
("E4 P3 types",
"""  const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
  const all=space(r.train,r.cap,types,TP,true);
  const tied=topBy(all,'ruled');
  const ev=evenIdx(r.train.length,r.cap).join(',');
  if(!tied.some(c=>c.idxs.join(',')===ev)) return;
  p3n++;""",
"""  const types=paceTypes(r.train,r.cap);   // V213 era row
  const all=space(r.train,r.cap,types,TP,true);
  const tied=topBy(all,'ruled');
  const ev=evenIdx(r.train.length,r.cap).join(',');
  if(!tied.some(c=>c.idxs.join(',')===ev)) return;
  p3n++;"""),
("E5 P4 types",
"""  const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
  const all=space(r.train,r.cap,types,TP,true);
  const tied=topBy(all,'ruled');
  const ev=evenIdx(r.train.length,r.cap).join(',');
  if(tied.some(c=>c.idxs.join(',')===ev)) return;
  p4n++;""",
"""  const types=paceTypes(r.train,r.cap);   // V213 era row
  const all=space(r.train,r.cap,types,TP,true);
  const tied=topBy(all,'ruled');
  const ev=evenIdx(r.train.length,r.cap).join(',');
  if(tied.some(c=>c.idxs.join(',')===ev)) return;
  p4n++;"""),
]

out = [apply('g202_int_doctrine.js', G202), apply('g205_d125_spaced.js', G125), apply('g205_d129_tiebreak.js', G129)]
for p, s in out:
    io.open(p, 'w', encoding='utf-8').write(s)
    print('WROTE', p)
