// g208_d103a_readers.js — D103a slice 2: the readers go key-first.
//
// RULING (D103a, coach V206; slice 2 re-ruled at V208): a keyed NSW session (dose.key, stamped
// by slice 1) is read by its KEY; an unkeyed one (NRC, bike, swim, a frozen pre-V208 day) keeps
// today's label scan or legLoad exactly.
//   * _nrcRunShape, pace arm: speed = key int|chi; the long run stays legLoad (D127); a `trial`
//     never enters the shape (it is neither the speed day nor the long run).
//   * _cardioInterference: key int -> 1.4, chi -> 1.05 (today's numbers). No other key has a
//     row: long, easy, steady, bench and trial fall through to the scan (unruled).
//   * injurySweepCardio, two NAMED sets. Halfstep cuts _HALFSTEP_HARD_KEYS {int, chi, long,
//     steady}: the test and the benchmark are measurements and are never halved. The easy and
//     reduce sweep parks _PROTECT_PARK_KEYS {int, chi, long, steady, bench, trial}: an injured
//     athlete in easy mode does not run a max-effort test. The "Easy Run (protected)" rewrite
//     stamps key `easy` (E4): the key describes the card it now is.
//
// ORACLES (independent of the readers under test):
//   R  rename safety, by source surgery on THIS artifact: the run builder's two quality labels
//      (the CHI and INT literals, found structurally) are swapped to a scan-loaded label (the
//      slice 4 names) and to a scan-neutral one. Every program, label-normalised, must equal the
//      unswapped build: a reader that still keys on the label moves roles or sections.
//   H  halfstep: the ruling's set as a hand table, card by card (touched iff key is in the set),
//      plus today's counts from the baseline for the classes the ruling holds unchanged.
//   E  easy mode: each card paired with the SAME cfg built without the injury (the deal before
//      the sweep); the ruling's park set as a hand table.
//   I  interference: the V176 rule restated by hand (base 1.0 x 1.4 or 1.05, plus miles past 3
//      at 0.08 or minutes past 45 at 0.01, capped 0.5), and the baseline's own function on the
//      same card with the key stripped (the unkeyed path is today's code).
//   S  shape: hand-built week-1 grids; the no-injury population against the pre-slice tree.
//   N  NRC, bike and swim programs, with and without injuries, byte-identical to the baseline.
//
// NOTE ON BENCH (builder, V208): coach's hand table said "bench protected in easy mode unchanged".
// Under the ruled park set that cannot hold for any key set: today the Benchmark Run is parked only
// when it sits on the CHI day (legLoad true); on an easy day its copy carries no hard word and it
// runs. The ruled set parks every keyed Benchmark Run. E1 asserts the SET and prints today's count.
//
// SLICE 2b (coach, V208): in easy mode an easy run keeps its minutes, but its strides finisher is
// parked: the block from the line break before "Finish with 4 x 20 sec strides" through "while the
// engine builds." goes whole and " + Strides" leaves the subtype; note, key and dose unchanged. The
// oracle is that text rule applied by hand to the card as dealt (E3, E5, E6); E7 holds strides
// unchanged outside the injury modes.
//
// VERSION PREDICATE (standing ruling 4): D103a slice 2 ships on ia-version 208. Below 208 every
// row prints SKIP. Rows reading a baseline (argv[3]) run when the baseline is V207 or the V208
// pre-slice tree; S3 runs only against the pre-slice tree (same ia-version as the candidate).
// SLICE 4f: after the LI/SI rename (slice 4a) the baseline no longer prints the candidate's label.
// I2 compares a keyed INT or CHI with the baseline's reading of the card V207 printed for that KEY
// (the key's V207 head, suffix kept); I3 also strips the key from that V207 card, the frozen path.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
const { load, progDigest, extractInlineJS } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 208;
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skip = l => console.log('SKIP ' + l);
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ ['R','H','E','I','S','N','M'].forEach(r => skip(r + ' rows: ia-version ' + VER + ' predates D103a slice 2 (V' + ERA + ')')); done(); }
const IB = BASEFILE ? load(BASEFILE) : null;
const BASE_OK = !!IB && VER === ERA && (+IB.version === 207 || +IB.version === 208);
const BASE_WHY = !IB ? 'no baseline passed as argv[3]' : 'baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree';
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const clone = v => JSON.parse(JSON.stringify(v));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const HALFSTEP_SET = new Set(['int','chi','long','steady']);                  // ruling, hand table
const PARK_SET = new Set(['int','chi','long','steady','bench','trial']);      // ruling, hand table
const NSW = new Set(['run_base','run_pace_goal','run_mile_time','run_15_under10']);
// label -> class, for unkeyed (baseline) cards. First match wins.
function labelKey(c){
  const s = String(c.subtype || '');
  if(/TIME TRIAL/.test(s)) return 'trial'; if(/^Interval \(INT\)/.test(s)) return 'int'; if(/^Continuous High Intensity \(CHI\)/.test(s)) return 'chi';
  if(/^Steady Aerobic Run/.test(s)) return 'steady'; if(/^Benchmark Run/.test(s)) return 'bench'; if(/^Easy Run — Long/.test(s)) return 'long';
  if(/^Easy Run \(protected\)/.test(s)) return 'protected'; if(/^Easy Run/.test(s)) return 'easy'; if(/^Long Slow Distance \(LSD\)/.test(s)) return c.legLoad ? 'long' : 'easy';
  return null;
}
const keyOf = c => (c && c.dose && c.dose.key) || null;
const nswRun = c => !!c && c.type === 'run' && !c.isNRC && NSW.has(c.goalId);
const cardsOf = p => { const o = []; Object.keys(p.weeks).forEach(w => DAYS.forEach(d => { const x = p.weeks[w][d]; if(x && x.cardio && !Array.isArray(x.cardio)) o.push({w, d, c:x.cardio}); })); return o; };
const touchedH = c => /RE-ENTRY WEEK/.test(c.note || '');
const bump = o => { const n = {}; o.forEach(k => n[k] = (n[k] || 0) + 1); return n; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(', ') || 'none';
// ── lattice ──────────────────────────────────────────────────────────────────────
const START = new Date(2026, 9, 5);   // Mon 2026-10-05
const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const LIFT = {liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', days:ALL, bench:185, squat:255, deadlift:315, name:'R', startDate:isoOff(0)};
const PACE = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
const MILE = {id:'run_mile_time', label:'Mile', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};
const INJ = {none:null, halfstep:{region:'knee', tier:'workaround', halfstep:true}, easy:{region:'knee', tier:'workaround'}, reduce:{region:'ankle', tier:'workaround'}};
const withInj = (c, inj) => { const x = clone(c); if(INJ[inj]) x.injury = clone(INJ[inj]); else delete x.injury; return x; };
const BASECFG = [];
for(const g of [PACE, MILE]) for(const mix of ['', 'bike']) for(const rest of [['sun'], ['sun','wed'], ['sat','sun']]) for(const tw of [0, 1, 3]) for(const wd of (tw ? [0, 3] : [0])){
  const cg = {run:clone(g)}; if(mix) cg.bike = {id:'bike_base', label:'Bike base'};
  const c = Object.assign({}, LIFT, {primaryPath:'event', eventTargeted:true, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:rest, seed:24865});
  if(tw){ c.raceDate = isoOff(7 * (tw - 1) + wd); c._testWeek = tw; c._raceDateCappedWeeks = tw; }
  BASECFG.push({fam:'pace', dated:tw, cfg:c});
}
for(const mix of ['', 'bike']) for(const exp of ['beginner','advanced']) for(const rest of [[], ['sun','wed'], ['sat','sun']]) for(const seed of [24865, 7]){
  const cg = {run:{id:'run_base', label:'Build Running Base', mileBestMins:'8', mileBestSecs:'15', baseline:'2.5 miles'}}; if(mix) cg.bike = {id:'bike_base', label:'Bike base'};
  BASECFG.push({fam:'run_base freq', dated:0, cfg:Object.assign({}, LIFT, {primaryPath:'event', eventTargeted:true, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, experience:exp, restDays:rest, seed})});
}
for(const pp of ['fitness','event']) for(const bd of ['0.1','1']) for(const rest of [['sun','wed'], [], ['sat','sun']]){
  BASECFG.push({fam:'run_base 55+', dated:0, cfg:Object.assign({}, clone(IA.fixtures.HALF_MANNY), {name:'RB', primaryPath:pp, cardioTypes:['run'],
    cardioGoals:{run:{id:'run_base', label:'Build Running Base', baselineDist:bd, baseline:bd + 'mi'}}, eventTargeted:pp === 'event', raceDate:pp === 'event' ? '2027-06-01' : '', ageBracket:'55+', restDays:rest, seed:76308})});
}
const NRCCFG = [];
for(const g of ['run_5k','run_half']) for(const mix of ['', 'bike', 'swim']) for(const inj of Object.keys(INJ)){
  const cg = {run:{id:g, label:g}}; if(mix === 'bike') cg.bike = {id:'bike_base', label:'Bike'}; if(mix === 'swim') cg.swim = {id:'swim_base', label:'Swim'};
  NRCCFG.push(withInj(Object.assign({}, clone(IA.fixtures.HALF_MANNY), {cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:['sun'], seed:76308, raceDate:g === 'run_5k' ? '2026-11-19' : '2026-12-26'}), inj));
}
const build = (A, cfg) => { const p = clone(A.buildProgram(clone(cfg))); delete p.created; delete p.id; return p; };
const cache = new Map(); const get = (fam, i, inj) => { const k = i + '|' + inj; if(!cache.has(k)) cache.set(k, build(IA, withInj(BASECFG[i].cfg, inj))); return cache.get(k); };
// ── R: rename safety by source surgery ──────────────────────────────────────────────
{
  const html = fs.readFileSync(ART, 'utf8');
  const RX = /    subtype = '([^']+)' \+ \(isTaperWeek \? ' — Taper' : ''\);\n/g;
  const found = [...html.matchAll(RX)].map(m => m[1]);
  if(found.length !== 2){ ok('R0 the run builder prints exactly two quality labels with a Taper suffix (CHI then INT)', false, found.length + ': ' + found.join(' | ')); }
  else {
    const [chiL, intL] = found;
    const loaded = (cur, want, alt) => cur === want ? alt : want;
    const SW = [['CHI', chiL, loaded(chiL, 'Long Interval (LI)', 'Continuous High Intensity (CHI)')], ['CHI', chiL, 'Zqx Session (ZQX)'],
                ['INT', intL, loaded(intL, 'Short Interval (SI)', 'Interval (INT)')], ['INT', intL, 'Zqy Session (ZQY)']];
    const RCFG = []; BASECFG.forEach((b, i) => { if(b.fam === 'pace') ['none','halfstep','easy'].forEach(inj => RCFG.push([i, inj])); });
    for(const [slot, from, to] of SW){
      const anchor = "    subtype = '" + from + "' + (isTaperWeek ? ' — Taper' : '');\n";
      const tmp = path.join(os.tmpdir(), 'g208r_' + process.pid + '_' + slot + '_' + to.replace(/\W+/g, '') + '.html');
      let moved = [], nChanged = 0;
      try {
        if(html.split(anchor).length !== 2) throw new Error('anchor count != 1');
        fs.writeFileSync(tmp, html.replace(anchor, anchor.replace("'" + from + "'", "'" + to + "'")));
        const V = load(tmp);
        for(const [i, inj] of RCFG){
          const a = get('pace', i, inj);
          const q = JSON.parse(JSON.stringify(V.buildProgram(clone(withInj(BASECFG[i].cfg, inj)))).split(to).join(from)); delete q.created; delete q.id;
          if(canon(a) !== canon(q)){ nChanged++; let days = 0; Object.keys(a.weeks).forEach(w => DAYS.forEach(d => { if(canon(a.weeks[w][d]) !== canon(q.weeks[w] && q.weeks[w][d])) days++; })); moved.push(inj + ' #' + i + ' (' + days + ' days)'); }
        }
      } catch(e){ moved = ['CRASH ' + e.message]; nChanged = -1; }
      finally { try { fs.unlinkSync(tmp); } catch(e){} }
      ok(`R ${slot} label "${from}" swapped to "${to}": 0 of ${RCFG.length} pace programs (none, halfstep, easy) move, label-normalised`, nChanged === 0, nChanged + ': ' + moved.slice(0, 3).join('; '));
    }
  }
}
// ── H: halfstep ─────────────────────────────────────────────────────────────────────
{
  const byKey = {}, hit = {}, bad = [];
  BASECFG.forEach((b, i) => cardsOf(get(b.fam, i, 'halfstep')).forEach(({w, d, c}) => { if(!nswRun(c)) return; const k = keyOf(c) || 'NONE';
    byKey[k] = (byKey[k] || 0) + 1; if(touchedH(c)) hit[k] = (hit[k] || 0) + 1;
    if(touchedH(c) !== HALFSTEP_SET.has(k)) bad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k + (touchedH(c) ? ' half-stepped' : ' not half-stepped')); }));
  let before = null;
  // before: the baseline's cuts by label class. H4 compares UNDATED programs only: slice 0 (the D106a fix-forward, same
  // version) turned long LSDs at T-1/T-2 of a dated test into easy runs, which V207 still counts as long.
  let before4 = null, after4 = {};
  BASECFG.forEach((b, i) => { if(!b.dated) cardsOf(get(b.fam, i, 'halfstep')).forEach(({c}) => { if(nswRun(c) && touchedH(c)){ const k = keyOf(c); after4[k] = (after4[k] || 0) + 1; } }); });
  if(BASE_OK){ before = {}; before4 = {}; BASECFG.forEach(b => cardsOf(build(IB, withInj(b.cfg, 'halfstep'))).forEach(({c}) => { if(nswRun(c) && touchedH(c)){ const k = keyOf(c) || labelKey(c); before[k] = (before[k] || 0) + 1; if(!b.dated) before4[k] = (before4[k] || 0) + 1; } })); }
  const bf = k => before ? (before[k] || 0) : 'n/a';
  ok(`H1 halfstep cuts a keyed NSW run iff its key is in {int, chi, long, steady} (${BASECFG.length} programs; cut/total: ${Object.keys(byKey).sort().map(k => k + ' ' + (hit[k] || 0) + '/' + byKey[k]).join(', ')})`, bad.length === 0 && Object.keys(byKey).length > 0, bad.length + ': ' + bad.slice(0, 3).join('; '));
  ok(`H2 NSW easy runs half-stepped: ${bf('easy')} before -> ${hit.easy || 0} after (of ${byKey.easy || 0})`, (byKey.easy || 0) > 0 && !(hit.easy || 0), hit.easy);
  ok(`H3 the test and the benchmark are never halved: trial ${bf('trial')} -> ${hit.trial || 0} (of ${byKey.trial || 0}), bench ${bf('bench')} -> ${hit.bench || 0} (of ${byKey.bench || 0})`, (byKey.trial || 0) > 0 && (byKey.bench || 0) > 0 && !(hit.trial || 0) && !(hit.bench || 0), (hit.trial || 0) + ' / ' + (hit.bench || 0));
  if(!BASE_OK) skip('H4 ' + BASE_WHY + '; the unchanged-class counts did not run');
  else { const cls = ['int','chi','long','steady'], diff = cls.filter(k => (before4[k] || 0) !== (after4[k] || 0));
    ok(`H4 halfstep counts unchanged vs the baseline for the classes the ruling keeps, undated programs (${cls.map(k => k + ' ' + (before4[k] || 0) + '->' + (after4[k] || 0)).join(', ')})`, diff.length === 0 && cls.every(k => (after4[k] || 0) > 0), diff.join(',')); }
}
// ── E: easy and reduce ──────────────────────────────────────────────────────────────
{
  const parked = {}, total = {}, bad = [], keptBad = [], e4 = [], trialsLeft = []; let datedProgs = 0;
  // slice 2b text rule, by hand: the strides block goes whole, " + Strides" leaves the subtype, nothing else moves
  const STRIDES_BLOCK = '\nFinish with 4 x 20 sec strides. Fast but relaxed, about 90% speed, walk back for full recovery. Strides keep your legs fast while the engine builds.';
  const ruled2b = c => { const x = clone(c); x.detail = String(x.detail || '').split(STRIDES_BLOCK).join(''); x.subtype = String(x.subtype || '').split(' + Strides').join(''); return x; };
  let stridesDealt = 0, stridesLeft = [], plusLeft = [], doseBad = [];
  BASECFG.forEach((b, i) => {
    const pre = get(b.fam, i, 'none'), p = get(b.fam, i, 'easy');
    if(b.dated) datedProgs++;
    cardsOf(p).forEach(({w, d, c}) => { if(/TIME TRIAL/.test(c.subtype || '')) trialsLeft.push(b.fam + ' #' + i + ' W' + w + ' ' + d); });
    cardsOf(pre).forEach(({w, d, c}) => { if(!nswRun(c)) return; const k = keyOf(c) || 'NONE'; const after = p.weeks[w] && p.weeks[w][d] && p.weeks[w][d].cardio;
      total[k] = (total[k] || 0) + 1; const isP = !!after && /^Easy Run \(protected\)/.test(after.subtype || '');
      if(isP) parked[k] = (parked[k] || 0) + 1;
      if(PARK_SET.has(k) !== isP) bad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k + (isP ? ' parked' : ' not parked'));
      if(!PARK_SET.has(k) && canon(after) !== canon(ruled2b(c))) keptBad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k);
      if(!PARK_SET.has(k) && String(c.detail || '').includes(STRIDES_BLOCK)){ stridesDealt++; const m0 = /(\d+) min/.exec(c.detail || ''), m1 = after && /(\d+) min/.exec(after.detail || '');
        if(!after || canon(after.dose) !== canon(c.dose) || !m0 || !m1 || m0[1] !== m1[1]) doseBad.push(b.fam + ' #' + i + ' W' + w + ' ' + d); } });
    cardsOf(p).forEach(({w, d, c}) => { if(c.type !== 'run') return; if(/strides/i.test((c.subtype || '') + ' ' + (c.detail || ''))) stridesLeft.push(b.fam + ' #' + i + ' W' + w + ' ' + d); if(/ \+ Strides$/.test(c.subtype || '')) plusLeft.push(b.fam + ' #' + i + ' W' + w + ' ' + d); });
    ['easy','reduce'].forEach(m => cardsOf(m === 'easy' ? p : get(b.fam, i, 'reduce')).forEach(({w, d, c}) => { if(/^Easy Run \(protected\)/.test(c.subtype || '') && c.dose && c.dose.key !== undefined && c.dose.key !== 'easy') e4.push(m + ' ' + b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + c.dose.key); }));
  });
  let benchBefore = 'n/a';
  if(BASE_OK){ let pb = 0, tb = 0; BASECFG.forEach(b => { const pre = build(IB, withInj(b.cfg, 'none')), p = build(IB, withInj(b.cfg, 'easy'));
    cardsOf(pre).forEach(({w, d, c}) => { if(nswRun(c) && (keyOf(c) || labelKey(c)) === 'bench'){ tb++; const a = p.weeks[w] && p.weeks[w][d] && p.weeks[w][d].cardio; if(a && /^Easy Run \(protected\)/.test(a.subtype || '')) pb++; } }); });
    benchBefore = pb + '/' + tb; }
  ok(`E1 easy mode parks a keyed NSW run iff its key is in {int, chi, long, steady, bench, trial} (parked/total: ${Object.keys(total).sort().map(k => k + ' ' + (parked[k] || 0) + '/' + total[k]).join(', ')}; bench parked before: ${benchBefore})`,
     bad.length === 0 && ['int','chi','long','steady','bench','trial','easy'].every(k => (total[k] || 0) > 0), bad.length + ': ' + bad.slice(0, 3).join('; '));
  ok(`E2 an injured athlete in easy mode runs no test: 0 TIME TRIAL cards survive across ${datedProgs} dated programs (${parked.trial || 0}/${total.trial || 0} tests parked)`, datedProgs > 0 && trialsLeft.length === 0 && (total.trial || 0) > 0, trialsLeft.length + ': ' + trialsLeft.slice(0, 3).join('; '));
  ok(`E5 easy mode parks the strides finisher: ${stridesDealt} easy runs left standing carried it, 0 run cards mention strides and 0 subtypes end " + Strides"`, stridesDealt > 0 && stridesLeft.length === 0 && plusLeft.length === 0, stridesLeft.length + ' mention strides, ' + plusLeft.length + ' end + Strides: ' + stridesLeft.concat(plusLeft).slice(0, 3).join('; '));
  ok(`E6 an easy run whose strides were parked keeps its minutes and its dose (${stridesDealt} cards)`, stridesDealt > 0 && doseBad.length === 0, doseBad.length + ': ' + doseBad.slice(0, 3).join('; '));
  ok(`E3 every keyed easy run is left exactly as dealt in easy mode, strides finisher aside (the 2b text rule) (${(total.easy || 0) - (parked.easy || 0)}/${total.easy || 0})`, keptBad.length === 0 && (total.easy || 0) > 0, keptBad.length + ': ' + keptBad.slice(0, 3).join('; '));
  ok('E4 every "Easy Run (protected)" card that carries a key carries `easy` (easy and reduce)', e4.length === 0, e4.length + ': ' + e4.slice(0, 3).join('; '));
  // E7: outside the injury modes the strides are untouched
  let sN = 0; const sBad = []; BASECFG.forEach((b, i) => cardsOf(get(b.fam, i, 'none')).forEach(({w, d, c}) => { if(!/ \+ Strides$/.test(c.subtype || '')) return; sN++; if(!String(c.detail || '').endsWith(STRIDES_BLOCK)) sBad.push(b.fam + ' #' + i + ' W' + w + ' ' + d); }));
  ok(`E7a without an injury every " + Strides" run still carries the whole finisher (${sN} cards)`, sN > 0 && sBad.length === 0, sBad.length + ': ' + sBad.slice(0, 3).join('; '));
  if(!BASE_OK) skip('E7b ' + BASE_WHY);
  else { let sB = 0; BASECFG.forEach(b => cardsOf(build(IB, withInj(b.cfg, 'none'))).forEach(({c}) => { if(/ \+ Strides$/.test(c.subtype || '') && String(c.detail || '').endsWith(STRIDES_BLOCK)) sB++; }));
    ok(`E7b without an injury the strides count equals the baseline's (${sB} -> ${sN})`, sB === sN && sN > 0, sB + ' vs ' + sN); }
}
// ── I: interference ─────────────────────────────────────────────────────────────────
{
  const CI = IA.eval('_cardioInterference'), CB = BASE_OK ? IB.eval('_cardioInterference') : null;
  const hand = c => { const s = ((c.subtype || '') + ' ' + (c.detail || '')).toLowerCase();
    const mi = parseFloat((s.match(/([\d.]+)\s*(?:mi\b|mile)/) || [])[1]) || 0, mn = parseFloat((s.match(/([\d.]+)[\s-]*min/) || [])[1]) || 0;
    const b = mi > 3 ? Math.min(0.5, (mi - 3) * 0.08) : mn > 45 ? Math.min(0.5, (mn - 45) * 0.01) : 0;
    return +(1.0 * (keyOf(c) === 'int' ? 1.4 : 1.05) + b).toFixed(2); };
  // the card V207 printed for this key: the key's V207 head, every suffix kept (hand table, slice 4a)
  const HEAD207 = {chi:'Continuous High Intensity (CHI)', int:'Interval (INT)'};
  const as207 = c => { const r = clone(c); r.subtype = String(r.subtype || '').replace(/^(Long Interval \(LI\)|Short Interval \(SI\))/, m => HEAD207[keyOf(c)] || m); return r; };
  let n = 0; const bad = [], badB = [], badR = []; let nu = 0, nu7 = 0; const badU = [];
  BASECFG.forEach((b, i) => cardsOf(get(b.fam, i, 'none')).forEach(({c}) => { if(!nswRun(c)) return; const k = keyOf(c);
    if(k === 'int' || k === 'chi'){ n++; const v = CI(c); if(v !== hand(c)) bad.push(k + ' ' + v + ' want ' + hand(c)); if(CB && v !== CB(as207(c))) badB.push(k + ' ' + v + ' baseline ' + CB(as207(c)) + ' on "' + as207(c).subtype + '"');
      // relabelled to a name the scan reads as ANOTHER class (a CHI named like an interval, an INT named like a recovery run)
      const r = clone(c); r.subtype = k === 'chi' ? 'Long Interval (LI)' : 'Recovery Zqy'; if(CI(r) !== hand(c)) badR.push(k + ' as "' + r.subtype + '" ' + CI(r) + ' want ' + hand(c)); }
    if(CB){ nu++; const u = clone(c); delete u.dose.key; if(CI(u) !== CB(u)) badU.push(String(c.subtype) + ' ' + CI(u) + ' baseline ' + CB(u));
      if(k === 'int' || k === 'chi'){ nu7++; const u7 = as207(c); delete u7.dose.key; if(CI(u7) !== CB(u7)) badU.push('as V207 "' + u7.subtype + '" ' + CI(u7) + ' baseline ' + CB(u7)); } } }));
  ok(`I1 keyed INT and CHI read 1.4 and 1.05 plus the distance bump, by hand (${n} cards)`, n > 0 && bad.length === 0, bad.length + ': ' + bad.slice(0, 3).join('; '));
  ok(`I4 a keyed INT or CHI relabelled to a name the scan reads as another class still reads its key's value (${n} cards)`, n > 0 && badR.length === 0, badR.length + ': ' + badR.slice(0, 3).join('; '));
  if(!CB){ skip('I2 ' + BASE_WHY); skip('I3 ' + BASE_WHY); }
  else { ok(`I2 keyed INT and CHI equal the baseline's value on the card V207 printed for the same key (${n} cards)`, n > 0 && badB.length === 0, badB.length + ': ' + badB.slice(0, 3).join('; '));
         ok(`I3 unkeyed path: with dose.key stripped, every NSW run card reads the baseline's value as printed today (${nu} cards) and every INT and CHI reads it under its V207 label, the frozen path (${nu7} cards)`, nu > 0 && nu7 > 0 && badU.length === 0, badU.length + ': ' + badU.slice(0, 3).join('; ')); }
}
// ── S: shape ────────────────────────────────────────────────────────────────────────
{
  const SH = IA.eval('_nrcRunShape');
  const card = (sub, key, legLoad) => ({type:'run', subtype:sub, goalId:'run_pace_goal', legLoad, dose:{k:'dist', mi:1.5, key}});
  // the test sits AFTER the long run: a label reader lets the last legLoad card win and takes the test as the long run
  const wk = {mon:card('Long Slow Distance (LSD) — Taper', 'long', true), wed:card('Interval (INT)', 'int', true), fri:card('Long Slow Distance (LSD)', 'easy', false), sat:card('1.5 Mile Test — TIME TRIAL', 'trial', true)};
  const td = ['mon','wed','fri','sat'];
  const s = SH(clone(wk), td);
  ok('S1 a keyed test never enters the week-1 shape: long is the long LSD, speed is the INT, the test is in no role',
     !!s && s.long === 'mon' && [...s.speed].join() === 'wed' && [...s.easy].join() === 'fri', s ? JSON.stringify({long:s.long, speed:[...s.speed], easy:[...s.easy]}) : 'null');
  const s2 = SH(clone({fri:wk.fri, sat:wk.sat}), ['fri','sat']);
  ok('S1b a week whose only legLoad card is the test has no long run (null shape)', s2 === null, s2 && JSON.stringify({long:s2.long}));
  const lb = {mon:card('Long Interval (LI)', 'chi', true), thu:card('Zqy Session (ZQY)', 'int', true), sat:card('Long Slow Distance (LSD)', 'long', true), sun:card('Long Slow Distance (LSD)', 'easy', false)};
  const s3 = SH(clone(lb), ['mon','thu','sat','sun']);
  ok('S1c renamed quality labels still read as the speed days by key', !!s3 && s3.long === 'sat' && [...s3.speed].sort().join() === 'mon,thu', s3 && JSON.stringify({long:s3.long, speed:[...s3.speed]}));
  if(!BASE_OK) skip('S2 ' + BASE_WHY);
  else { const u = x => { const y = clone(x); Object.values(y).forEach(c => delete c.dose.key); return y; };
    const sa = SH(u(wk), td), sb = IB.eval('_nrcRunShape')(u(wk), td), sc = SH(u(lb), ['mon','thu','sat','sun']), sd = IB.eval('_nrcRunShape')(u(lb), ['mon','thu','sat','sun']);
    const ser = x => x ? JSON.stringify({long:x.long, eve:x.eve, after:x.after, speed:[...x.speed].sort(), easy:[...x.easy].sort()}) : 'null';
    ok('S2 unkeyed path: with the keys stripped, the shape equals the baseline\'s on both hand grids', ser(sa) === ser(sb) && ser(sc) === ser(sd), ser(sa) + ' vs ' + ser(sb)); }
  if(!(IB && +IB.version === VER)) skip('S3 runs only against the pre-slice tree at the same ia-version; ' + (IB ? 'this pair is ' + VER + ' vs ' + IB.version : 'no baseline'));
  else { const moved = [], expect = [];
    // Non-vacuity only for the slice 2 pair: a baseline whose shape reader still takes the test as the long run.
    const bLabel = (() => { const x = IB.eval('_nrcRunShape')(clone(wk), td); return !!x && x.long === 'sat'; })();
    BASECFG.forEach((b, i) => { if(b.fam === 'pace' && b.dated === 1) expect.push(i); if(canon(get(b.fam, i, 'none')) !== canon(build(IB, withInj(b.cfg, 'none')))) moved.push(i); });
    ok(`S3 without an injury, the only programs that move against the pre-slice tree are the dated ones with the test in week 1 (the test leaves the shape): ${moved.length} moved, ${expect.length} such programs${bLabel ? '' : '; the baseline already reads the key, so none need move'}`,
       moved.every(i => expect.includes(i)) && (!bLabel || moved.length > 0), 'moved outside the class: ' + moved.filter(i => !expect.includes(i)).map(i => BASECFG[i].fam + ' #' + i).join(', ')); }
}
// ── N: NRC, bike and swim ───────────────────────────────────────────────────────────
if(!BASE_OK) skip('N1 ' + BASE_WHY);
else { const moved = []; NRCCFG.forEach((c, i) => { let a, b; try { a = canon(build(IA, c)); } catch(e){ a = 'CRASH ' + e.message; } try { b = canon(build(IB, c)); } catch(e){ b = 'CRASH ' + e.message; } if(a !== b || /^CRASH/.test(a)) moved.push('#' + i + ' ' + c.cardioGoals.run.id + ' ' + c.cardioTypes.join('+') + ' ' + (c.injury ? JSON.stringify(c.injury) : 'no injury')); });
  ok(`N1 ${NRCCFG.length} NRC programs (5K, half x run, +bike, +swim x no injury, halfstep, easy, reduce) are byte-identical to the baseline`, moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
// ── M: HALF_MANNY ───────────────────────────────────────────────────────────────────
{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('M1 HALF_MANNY digest is 0ac7da6b1691a8e1 (NRC: no reader change reaches it)', hm === '0ac7da6b1691a8e1', hm); }
done();
