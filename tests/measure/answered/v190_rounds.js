// Measure pass — V190 / D39: "the round count is a field, not a substring" (handoff §5r,
// rulings D39-i..v). Mode B, before-picture, run against BOTH builds.
//
//   node tests/measure/v190_rounds.js index.html /tmp/base_V187.html
//
// Four rates, each with a numerator and a denominator:
//   1. FABRICATED     — the displayed round count is a number the section never states.
//   2. CONTRADICTED   — the displayed round count disagrees with its own members' set counts.
//   3. DESYNCED       — members of one superset section disagree with EACH OTHER.
//   4. WRONG-DURATION — sessionTimeEst(day) differs from an independently recomputed duration.
//
// ORACLE INDEPENDENCE (the whole point of this file):
//   * `_secRounds` is NEVER called. It does not exist on V187 at all, which is the forcing
//     function: every oracle below is written once and runs byte-identically on both builds.
//   * The DISPLAYED number is taken from the SHIPPED ARTIFACT, not from a reimplementation of
//     the renderer: each superset section is rendered through the build's own
//     buildSectionsHTML() and the banner is scraped out of the HTML. That is what the athlete
//     reads. Neither build is asked "what do you think the answer is".
//   * The EXPECTED number is derived from the AUTHORING CONTRACT — the section's own authored
//     `rounds` field (written at the call site from the same expression as the members), a
//     round count stated in the label, and the set counts the member detail strings state —
//     parsed HERE by _oItemSets, this file's own parser, covering both grammars.
//   * The duration oracle re-implements the DOCUMENTED cost model (8 min warmup, per-item
//     minute weights by movement class, cardio off the printed dose, +4 transition, round to
//     5, floor 5). Those weights are a coaching constant, byte-identical on V187 and V190,
//     and are not what is under measurement; the only thing that varies is the SET COUNT,
//     which the oracle takes from the contract: the item's own stated count in either
//     grammar, else the section's honest round count, else 3 (D39-iii).
//
// Standing traps honoured: cfg.seed is ALWAYS pinned (never null — engineA falls back to
// Date.now() and the build stops being reproducible, V182); every denominator is printed; a
// crash is reported as a failed measurement, never as an absence of findings.

const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness'));

// ─────────────────────────────────────────────────────────────────────────────
// Oracle primitives — this file's own parsers. Nothing below calls the engine.
// ─────────────────────────────────────────────────────────────────────────────

// Both accessory grammars: 'N×reps ...' / 'Nx reps ...' and 'N sets — RPE x'.
function _oItemSets(detail){
  const s = String(detail || '');
  let m = s.match(/^(\d+)\s*[x×]/);
  if(m) return parseInt(m[1], 10);
  m = s.match(/^(\d+)\s*sets?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function _oLabelRounds(sec){
  const m = String((sec && sec.label) || '').match(/(\d+)\s*round/i);
  return m ? parseInt(m[1], 10) : null;
}

// What the section AUTHORS about its own round count.
//   {kind:'number', n}  authored count written at the call site
//   {kind:'none'}       authored `rounds: null` — "this is not a round block"
//   {kind:'absent'}     no field at all — legacy / pre-V190 shape (every V187 section)
function _oAuthored(sec){
  if(!sec || !('rounds' in sec)) return { kind:'absent' };
  if(sec.rounds === null) return { kind:'none' };
  if(typeof sec.rounds === 'number' && sec.rounds > 0) return { kind:'number', n: sec.rounds };
  return { kind:'absent' };
}

function _oMemberSets(sec){
  return ((sec && sec.items) || [])
    .map(it => _oItemSets(it && it.detail))
    .filter(v => v != null);
}

// The honest round count the section states, in contract order:
//   authored number → authored `null` (no count) → a count in the label → min across members.
// MIN, never items[0]: min can only under-state, and inflating above a capped member is the
// dangerous direction (D39-i).
function _oRounds(sec){
  const a = _oAuthored(sec);
  if(a.kind === 'number') return a.n;
  if(a.kind === 'none') return null;
  const lr = _oLabelRounds(sec);
  if(lr != null) return lr;
  const ms = _oMemberSets(sec);
  return ms.length ? Math.min.apply(null, ms) : null;
}

// Everything the section states about a round count, as a set of numbers. A displayed
// number outside this set was invented by the renderer.
function _oSupport(sec){
  const out = new Set();
  const a = _oAuthored(sec);
  if(a.kind === 'number') out.add(a.n);
  const lr = _oLabelRounds(sec);
  if(lr != null) out.add(lr);
  _oMemberSets(sec).forEach(v => out.add(v));
  return out;
}

function isSuperset(sec){
  return !!(sec && (sec.superset || sec.type === 'superset') && (sec.items || []).length > 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Independent duration oracle (D39-iii contract + the documented cost model).
// ─────────────────────────────────────────────────────────────────────────────
function oracleDuration(day){
  let mins = 8; // warmup
  (day.sections || []).forEach(sec => {
    const L = ((sec && sec.label) || '').toLowerCase();
    const isMain  = /^main\b|^primer|^power\b|^strength\b/.test(L);
    const isSuper = !!(sec && sec.superset) || /superset|rounds|circuit|conditioning/.test(L);
    const secR = _oRounds(sec);
    ((sec && sec.items) || []).forEach(it => {
      let sets = _oItemSets(it && it.detail);
      if(sets == null) sets = (secR != null ? secR : 3);
      const n = ((it && it.name) || '').toLowerCase();
      if(/stretch|mobility|90\/90|foam|worlds greatest/.test(n)) mins += sets * 0.75;
      else if(/carry/.test(n)) mins += sets * 1.2;
      else if(/plank|pallof|dead bug|bird dog|wall sit|\bhold\b|hang|wiper|hollow|clamshell|side steps|side-lying|leg raises/.test(n)) mins += sets * 1.0;
      else if(isMain) mins += sets * 3.2;
      else if(isSuper) mins += sets * 1.4;
      else mins += sets * 2.0;
    });
  });
  if(day.cardio){
    const d = (day.cardio.detail || '');
    const mn = d.match(/(\d+)\s*min/i), mi = d.match(/(\d+(?:\.\d+)?)\s*mi\b/i), pace = d.match(/(\d+):(\d\d)\s*\/\s*mi/);
    if(mn) mins += parseInt(mn[1], 10);
    else if(mi && pace) mins += parseFloat(mi[1]) * (parseInt(pace[1], 10) + parseInt(pace[2], 10) / 60);
    else if(mi) mins += parseFloat(mi[1]) * 10;
    else mins += 20;
    mins += 4; // transition
  }
  mins = Math.round(mins / 5) * 5;
  return Math.max(5, mins);
}

// SECONDARY DIAGNOSTIC ONLY — NOT the instrument.
// `sessionTimeEst` rounds to the nearest 5 minutes, so every error the athlete can see is a
// multiple of 5 and a "mean 4.3 min / worst 6.4 min" cannot be a difference of two shipped
// estimates. To test whether a quoted pre-D39 duration figure came from an UNROUNDED
// comparison, the two models below are run against each other with no rounding. `_preD39Sets`
// is the pre-D39 set-count rule read off the baseline source (V187 sessionTimeEst: per-item
// `^(\d+)×`, else the hardcoded 3) — it is a reimplementation of the SUSPECT and is used for
// nothing except this comparability line.
function _preD39Sets(detail){
  const m = String(detail || '').match(/^(\d+)\s*[x×]/);
  return m ? parseInt(m[1], 10) : 3;
}
function durationRaw(day, setsOf){
  let mins = 8;
  (day.sections || []).forEach(sec => {
    const L = ((sec && sec.label) || '').toLowerCase();
    const isMain  = /^main\b|^primer|^power\b|^strength\b/.test(L);
    const isSuper = !!(sec && sec.superset) || /superset|rounds|circuit|conditioning/.test(L);
    const secR = _oRounds(sec);
    ((sec && sec.items) || []).forEach(it => {
      const sets = setsOf(it, secR);
      const n = ((it && it.name) || '').toLowerCase();
      if(/stretch|mobility|90\/90|foam|worlds greatest/.test(n)) mins += sets * 0.75;
      else if(/carry/.test(n)) mins += sets * 1.2;
      else if(/plank|pallof|dead bug|bird dog|wall sit|\bhold\b|hang|wiper|hollow|clamshell|side steps|side-lying|leg raises/.test(n)) mins += sets * 1.0;
      else if(isMain) mins += sets * 3.2;
      else if(isSuper) mins += sets * 1.4;
      else mins += sets * 2.0;
    });
  });
  if(day.cardio){
    const d = (day.cardio.detail || '');
    const mn = d.match(/(\d+)\s*min/i), mi = d.match(/(\d+(?:\.\d+)?)\s*mi\b/i), pace = d.match(/(\d+):(\d\d)\s*\/\s*mi/);
    if(mn) mins += parseInt(mn[1], 10);
    else if(mi && pace) mins += parseFloat(mi[1]) * (parseInt(pace[1], 10) + parseInt(pace[2], 10) / 60);
    else if(mi) mins += parseFloat(mi[1]) * 10;
    else mins += 20;
    mins += 4;
  }
  return mins;
}
const SETS_CONTRACT = (it, secR) => { const s = _oItemSets(it && it.detail); return s == null ? (secR != null ? secR : 3) : s; };
const SETS_PRE_D39  = (it) => _preD39Sets(it && it.detail);

// Also secondary. The pre-D39 BANNER rule, read off /tmp/base_V187.html:10073-10077:
// a round count in the label, else `^(\d+)[x×]` on items[0].detail ONLY, else the constant 3.
// Counts how often the constant was the source — irrespective of whether it happened to land
// on the right number. A stricter reading of "fabricated" than the primary metric, kept here
// because it is a reimplementation of the suspect and must not be mistaken for the instrument.
function _preD39BannerFromConstant(sec){
  if(_oLabelRounds(sec) != null) return false;
  const first = ((sec.items || [])[0] || {}).detail || '';
  return !/^(\d+)\s*[x×]/.test(first);
}

// ─────────────────────────────────────────────────────────────────────────────
// The lattice. Full cross product, pinned seeds, printed denominator.
// ─────────────────────────────────────────────────────────────────────────────
const FOCUSES   = ['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS      = ['beginner','intermediate','advanced'];
const EQUIPS    = ['home_full','home_basic','commercial','crossfit','bodyweight'];
const RESTS     = [['sun','wed'], ['sat','sun'], ['wed']];
const SEEDS     = [76308, 13337, 90210];

const GOALS = [
  { key:'body_only',      cfg:{ primaryPath:'body',  cardioTypes:[],        cardioGoals:{},                                                                                              eventTargeted:false, raceDate:null } },
  { key:'run_5k',         cfg:{ primaryPath:'event', cardioTypes:['run'],   cardioGoals:{ run:{ id:'run_5k',    label:'5K',        mileBestMins:'8',  mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } },  eventTargeted:true,  raceDate:'2026-12-06' } },
  { key:'run_10k',        cfg:{ primaryPath:'event', cardioTypes:['run'],   cardioGoals:{ run:{ id:'run_10k',   label:'10K',       mileBestMins:'9',  mileBestSecs:'00', baselineDist:'4', baseline:'4mi' } },  eventTargeted:true,  raceDate:'2026-12-06' } },
  { key:'run_half',       cfg:{ primaryPath:'event', cardioTypes:['run'],   cardioGoals:{ run:{ id:'run_half',  label:'Half',      mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } },  eventTargeted:true,  raceDate:'2026-12-06' } },
  { key:'run_marathon',   cfg:{ primaryPath:'event', cardioTypes:['run'],   cardioGoals:{ run:{ id:'run_marathon', label:'Full',   mileBestMins:'10', mileBestSecs:'00', baselineDist:'8', baseline:'8mi' } },  eventTargeted:true,  raceDate:'2027-03-07' } },
  { key:'run_pace_goal',  cfg:{ primaryPath:'event', cardioTypes:['run'],   cardioGoals:{ run:{ id:'run_pace_goal', label:'Pace',  mileBestMins:'10', mileBestSecs:'30', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'9', targetSecs:'30' } }, eventTargeted:false, raceDate:null } },
  { key:'run_base',       cfg:{ primaryPath:'event', cardioTypes:['run'],   cardioGoals:{ run:{ id:'run_base',  label:'Base',      mileBestMins:'11', mileBestSecs:'00', baselineDist:'2', baseline:'2mi' } },  eventTargeted:false, raceDate:null } },
  { key:'bike_50',        cfg:{ primaryPath:'event', cardioTypes:['bike'],  cardioGoals:{ bike:{ id:'bike_50',  label:'50 mile',   baselineDist:'20', baseline:'20mi' } },                                      eventTargeted:false, raceDate:null } },
  { key:'bike_ftp',       cfg:{ primaryPath:'event', cardioTypes:['bike'],  cardioGoals:{ bike:{ id:'bike_ftp', label:'FTP',       baselineDist:'25', baseline:'25mi' } },                                      eventTargeted:false, raceDate:null } },
  { key:'swim_mile',      cfg:{ primaryPath:'event', cardioTypes:['swim'],  cardioGoals:{ swim:{ id:'swim_mile',label:'Swim mile', baseline:'800 yd' } },                                                       eventTargeted:false, raceDate:null } },
];

function buildLattice(limit){
  const out = [];
  for(const g of GOALS){
    for(const focus of FOCUSES){
      for(const exp of EXPS){
        for(const equip of EQUIPS){
          for(let ri = 0; ri < RESTS.length; ri++){
            for(const seed of SEEDS){
              out.push({
                key: [g.key, focus, exp, equip, 'r' + ri, seed].join('/'),
                goal: g.key, focus: focus, exp: exp, equip: equip, rest: 'r' + ri, seed: seed,
                cfg: Object.assign({}, fixtures.HALF_MANNY, g.cfg, {
                  name: 'MEASURE', liftingFocus: focus, experience: exp, equipment: equip,
                  restDays: RESTS[ri].slice(), days: ['sun','mon','tue','wed','thu','fri','sat'],
                  ageBracket: '18-35', unit: 'lbs', bench: 135, squat: 155, deadlift: 185,
                  seed: seed,
                }),
              });
            }
          }
        }
      }
    }
  }
  return limit ? out.slice(0, limit) : out;
}

// ─────────────────────────────────────────────────────────────────────────────
function pct(n, d){ return d ? (100 * n / d).toFixed(1) + '%' : 'n/a'; }
function row(label, n, d){ return `    ${String(label).padEnd(22)} ${String(n).padStart(7)} / ${String(d).padEnd(7)} ${pct(n, d).padStart(7)}`; }

function bump(map, k, field){ const r = map[k] || (map[k] = { den:0, fab:0, con:0, des:0, des2den:0 }); r[field]++; return r; }

function measure(file, limit){
  const t0 = Date.now();
  let IA;
  try { IA = load(file); }
  catch(e){ return { file, crash: 'load failed: ' + e.message }; }

  const hasSecRounds = /function\s+_secRounds\s*\(/.test(IA.js);
  const lattice = buildLattice(limit);

  const T = {
    builds:0, buildErr:0, renderErr:0, estErr:0,
    secs:0, ss:0, ssRendered:0,
    authNum:0, authNone:0, authAbsent:0, labelStated:0, membersParsed:0,
    dispNum:0, dispNull:0,
    fab:0, fabNoEvidence:0, fabOverAuthoredNull:0,
    con:0, conCleanDisagree:0,
    des:0, des2den:0,
    fabAndCon:0,
    days:0, wrongDur:0, durErrSum:0, durErrWorst:0, durErrWorstAt:'',
    itemsNoCount:0, items:0, itemSetsMismatch:0,
    memberVsSecMismatch:0,
    rawBad:0, rawErrSum:0, rawWorst:0,
    constBanner:0,
  };
  const byFocus = {}, byEquip = {}, byGoal = {}, byExp = {};
  const dayByFocus = {}, dayByGoal = {};
  const examples = [], desExamples = [];

  lattice.forEach(L => {
    let prog;
    try { prog = IA.buildProgram(L.cfg); }
    catch(e){ T.buildErr++; if(examples.length < 400) examples.push('BUILDERR ' + L.key + ' :: ' + e.message); return; }
    T.builds++;

    Object.keys(prog.weeks || {}).forEach(wk => {
      const week = prog.weeks[wk] || {};
      Object.keys(week).forEach(d => {
        const day = week[d];
        if(!day || day.rest) return;
        const secs = day.sections || [];
        if(!secs.length && !day.cardio) return;

        // ── 4. WRONG-DURATION (denominator: training days)
        T.days++;
        const dk = { den:0 };
        (dayByFocus[L.focus] || (dayByFocus[L.focus] = { den:0, bad:0, sum:0, worst:0 })).den++;
        (dayByGoal[L.goal]  || (dayByGoal[L.goal]  = { den:0, bad:0, sum:0, worst:0 })).den++;
        let est = null;
        try { IA.ctx.__measDay = day; est = IA.eval('sessionTimeEst(__measDay)'); }
        catch(e){ T.estErr++; }
        if(est != null){
          const want = oracleDuration(day);
          const err = Math.abs(est - want);
          if(err > 0){
            T.wrongDur++; T.durErrSum += err;
            dayByFocus[L.focus].bad++; dayByFocus[L.focus].sum += err;
            dayByGoal[L.goal].bad++;   dayByGoal[L.goal].sum += err;
            if(err > dayByFocus[L.focus].worst) dayByFocus[L.focus].worst = err;
            if(err > dayByGoal[L.goal].worst)   dayByGoal[L.goal].worst = err;
            if(err > T.durErrWorst){ T.durErrWorst = err; T.durErrWorstAt = `${L.key} W${wk} ${d} est=${est} oracle=${want}`; }
          }
        }
        void dk;

        // secondary diagnostic: same two models, no 5-minute rounding
        const rawA = durationRaw(day, SETS_CONTRACT), rawB = durationRaw(day, SETS_PRE_D39);
        const rawErr = Math.abs(rawA - rawB);
        if(rawErr > 1e-9){ T.rawBad++; T.rawErrSum += rawErr; if(rawErr > T.rawWorst) T.rawWorst = rawErr; }

        secs.forEach(sec => {
          T.secs++;
          const _secROracle = _oRounds(sec);
          ((sec.items) || []).forEach(it => {
            T.items++;
            if(_oItemSets(it && it.detail) == null) T.itemsNoCount++;
            if(SETS_CONTRACT(it, _secROracle) !== SETS_PRE_D39(it)) T.itemSetsMismatch++;
          });
          if(!isSuperset(sec)) return;
          T.ss++;
          bump(byFocus, L.focus, 'den'); bump(byEquip, L.equip, 'den');
          bump(byGoal, L.goal, 'den');   bump(byExp, L.exp, 'den');

          // ── displayed number: scraped out of the SHIPPED renderer, per section.
          let disp = null, hdr = null;
          try {
            IA.ctx.__measSec = sec;
            const html = IA.eval('buildSectionsHTML([__measSec],0)');
            const m = String(html).match(/class="sshdr-txt">([\s\S]*?)<\/span>/);
            hdr = m ? m[1] : null;
            if(hdr != null){
              T.ssRendered++;
              const syn = hdr.match(/^(\d+)\s*Rounds\b/);
              if(syn) disp = parseInt(syn[1], 10);
              else { const lab = hdr.match(/(\d+)\s*round/i); disp = lab ? parseInt(lab[1], 10) : null; }
            }
          } catch(e){ T.renderErr++; return; }
          if(hdr == null) { T.renderErr++; return; }

          const support = _oSupport(sec);
          const members = _oMemberSets(sec);
          const auth = _oAuthored(sec);
          const secR = _oRounds(sec);

          if(disp == null) T.dispNull++; else T.dispNum++;
          if(auth.kind === 'number') T.authNum++; else if(auth.kind === 'none') T.authNone++; else T.authAbsent++;
          if(_oLabelRounds(sec) != null) T.labelStated++;
          if(_preD39BannerFromConstant(sec)) T.constBanner++;
          if(members.length === (sec.items || []).length) T.membersParsed++;

          // ── 1. FABRICATED
          let fab = false;
          if(disp != null && !support.has(disp)){ fab = true; T.fab++; bump(byFocus, L.focus, 'fab'); bump(byEquip, L.equip, 'fab'); bump(byGoal, L.goal, 'fab'); bump(byExp, L.exp, 'fab');
            if(support.size === 0) T.fabNoEvidence++;
          }
          if(disp != null && auth.kind === 'none') T.fabOverAuthoredNull++;

          // ── 2. CONTRADICTED
          let con = false;
          if(disp != null && members.length && !members.every(v => v === disp)){
            con = true; T.con++; bump(byFocus, L.focus, 'con'); bump(byEquip, L.equip, 'con'); bump(byGoal, L.goal, 'con'); bump(byExp, L.exp, 'con');
            if(members.every(v => v === members[0])) T.conCleanDisagree++;
          }
          if(fab && con) T.fabAndCon++;

          // ── 3. DESYNCED
          if(members.length >= 2){
            T.des2den++; bump(byFocus, L.focus, 'des2den'); bump(byEquip, L.equip, 'des2den'); bump(byGoal, L.goal, 'des2den'); bump(byExp, L.exp, 'des2den');
            if(!members.every(v => v === members[0])){
              T.des++; bump(byFocus, L.focus, 'des'); bump(byEquip, L.equip, 'des'); bump(byGoal, L.goal, 'des'); bump(byExp, L.exp, 'des');
              if(desExamples.length < 6){
                desExamples.push(`${L.key} W${wk} ${d} | hdr="${hdr}" disp=${disp} label="${sec.label}" :: `
                  + (sec.items || []).map(it => `${it.name} => "${it.detail}"`).join(' | '));
              }
            }
          }
          // members that disagree with the section's own honest count
          if(secR != null && members.some(v => v !== secR)) T.memberVsSecMismatch++;

          if((fab || con) && examples.length < 12){
            examples.push(`${L.key} W${wk} ${d} | hdr="${hdr}" disp=${disp} authored=${JSON.stringify(sec.rounds)} label="${sec.label}" members=${JSON.stringify(members)} oracle=${secR} ${fab?'FAB':''}${con?' CON':''}`);
          }
        });
      });
    });
  });

  return { file, version: IA.version, hasSecRounds, latticeSize: lattice.length, T, byFocus, byEquip, byGoal, byExp, dayByFocus, dayByGoal, examples, desExamples, ms: Date.now() - t0 };
}

function report(R){
  console.log('');
  console.log('='.repeat(96));
  if(R.crash){ console.log(`CRASH  ${R.file}: ${R.crash}`); console.log('MEASUREMENT FAILED — this is a failed measurement, not an absence of findings.'); return; }
  const T = R.T;
  console.log(`BUILD  ${R.file}  (ia-version ${R.version})   _secRounds present: ${R.hasSecRounds ? 'YES' : 'no'}`);
  console.log(`LATTICE ${R.latticeSize} configs = ${GOALS.length} goals x ${FOCUSES.length} focuses x ${EXPS.length} experience x ${EQUIPS.length} equipment x ${RESTS.length} rest patterns x ${SEEDS.length} pinned seeds`);
  console.log(`        built ${T.builds}  (build errors ${T.buildErr}, render errors ${T.renderErr}, sessionTimeEst errors ${T.estErr})   ${(R.ms/1000).toFixed(1)}s`);
  console.log(`        ${T.secs} sections, ${T.ss} superset sections (${T.ssRendered} rendered), ${T.days} training days, ${T.items} items`);
  console.log(`        banner shows a number on ${T.dispNum}/${T.ss}; suppressed (label only) on ${T.dispNull}/${T.ss}`);
  console.log('  0. AUTHORING CONTRACT COVERAGE (what the section itself states, superset sections)');
  console.log(row('authored rounds: number', T.authNum, T.ss));
  console.log(row('authored rounds: null', T.authNone, T.ss));
  console.log(row('no rounds field (legacy)', T.authAbsent, T.ss));
  console.log(row('round count in label', T.labelStated, T.ss));
  console.log(row('ALL members parse a count', T.membersParsed, T.ss));
  console.log('');
  console.log('  1. FABRICATED   displayed round count is a number the section never states');
  console.log(row('all superset sections', T.fab, T.ss));
  console.log(`        of which the section stated NOTHING at all: ${T.fabNoEvidence}`);
  console.log(`        displayed a number over an authored rounds:null: ${T.fabOverAuthoredNull}`);
  console.log('  2. CONTRADICTED displayed round count disagrees with its own members');
  console.log(row('all superset sections', T.con, T.ss));
  console.log(`        of which members agree with each other but not the banner: ${T.conCleanDisagree}`);
  console.log(`        overlap FABRICATED and CONTRADICTED: ${T.fabAndCon}`);
  console.log('  3. DESYNCED     members of one superset disagree with each other');
  console.log(row('all superset sections', T.des, T.ss));
  console.log(row('>=2 counted members', T.des, T.des2den));
  console.log(`        members disagreeing with the section's own honest count: ${T.memberVsSecMismatch}/${T.ss}`);
  console.log('  4. WRONG-DURATION  sessionTimeEst(day) != independently recomputed duration');
  console.log(row('training days', T.wrongDur, T.days));
  console.log(`        mean error over WRONG days: ${T.wrongDur ? (T.durErrSum / T.wrongDur).toFixed(1) : '0.0'} min`);
  console.log(`        mean error over ALL days:   ${T.days ? (T.durErrSum / T.days).toFixed(1) : '0.0'} min`);
  console.log(`        worst: ${T.durErrWorst} min  ${T.durErrWorstAt || ''}`);
  console.log(`        items whose detail states no set count at all: ${T.itemsNoCount}/${T.items} (${pct(T.itemsNoCount, T.items)})`);
  console.log('  4b. SECONDARY DIAGNOSTIC (not the instrument): contract model vs pre-D39 model,');
  console.log('      both UNROUNDED — tests whether a quoted sub-5-minute error is a rounding artifact');
  console.log(row('training days differ', T.rawBad, T.days));
  console.log(`        mean unrounded error over differing days: ${T.rawBad ? (T.rawErrSum / T.rawBad).toFixed(1) : '0.0'} min`);
  console.log(`        worst unrounded error: ${T.rawWorst.toFixed(1)} min`);
  console.log(row('items counted with wrong sets', T.itemSetsMismatch, T.items));
  console.log(row('banner from the constant 3', T.constBanner, T.ss));

  const seg = (title, map, fields) => {
    console.log('');
    console.log('  SEGMENT by ' + title);
    Object.keys(map).sort().forEach(k => {
      const r = map[k];
      console.log('    ' + String(k).padEnd(20)
        + fields.map(f => `${f[0]} ${String(r[f[1]]).padStart(6)}/${String(r[f[2]]).padEnd(6)} ${pct(r[f[1]], r[f[2]]).padStart(7)}`).join('  '));
    });
  };
  const SEGF = [['fab','fab','den'],['con','con','den'],['des','des','den']];
  seg('lifting focus (superset sections)', R.byFocus, SEGF);
  seg('equipment (superset sections)',     R.byEquip, SEGF);
  seg('goal (superset sections)',          R.byGoal,  SEGF);
  seg('experience (superset sections)',    R.byExp,   SEGF);

  console.log('');
  console.log('  SEGMENT by lifting focus (WRONG-DURATION, training days)');
  Object.keys(R.dayByFocus).sort().forEach(k => {
    const r = R.dayByFocus[k];
    console.log(`    ${k.padEnd(20)} ${String(r.bad).padStart(6)}/${String(r.den).padEnd(6)} ${pct(r.bad, r.den).padStart(7)}   mean ${r.bad ? (r.sum/r.bad).toFixed(1) : '0.0'} min   worst ${r.worst}`);
  });
  console.log('  SEGMENT by goal (WRONG-DURATION, training days)');
  Object.keys(R.dayByGoal).sort().forEach(k => {
    const r = R.dayByGoal[k];
    console.log(`    ${k.padEnd(20)} ${String(r.bad).padStart(6)}/${String(r.den).padEnd(6)} ${pct(r.bad, r.den).padStart(7)}   mean ${r.bad ? (r.sum/r.bad).toFixed(1) : '0.0'} min   worst ${r.worst}`);
  });

  if(R.examples.length){
    console.log('');
    console.log('  WITNESSES — fabricated / contradicted (first ' + R.examples.length + ')');
    R.examples.forEach(e => console.log('    ' + e));
  }
  if(R.desExamples.length){
    console.log('');
    console.log('  WITNESSES — desynced members (first ' + R.desExamples.length + ')');
    R.desExamples.forEach(e => console.log('    ' + e));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
const files = process.argv.slice(2).filter(a => !/^--/.test(a));
const limArg = (process.argv.find(a => /^--limit=/.test(a)) || '').split('=')[1];
const limit = limArg ? parseInt(limArg, 10) : 0;
if(!files.length){
  console.log('usage: node tests/measure/v190_rounds.js <candidate.html> [baseline.html] [--limit=N]');
  process.exit(2);
}
const results = files.map(f => measure(f, limit));
results.forEach(report);

console.log('');
console.log('='.repeat(96));
console.log('SIDE BY SIDE');
console.log('  metric                       ' + results.map(r => (r.crash ? 'CRASH' : 'V' + r.version).padStart(20)).join(''));
const lines = [
  ['superset sections (den)', r => r.T.ss],
  ['FABRICATED',              r => `${r.T.fab}/${r.T.ss} ${pct(r.T.fab, r.T.ss)}`],
  ['CONTRADICTED',            r => `${r.T.con}/${r.T.ss} ${pct(r.T.con, r.T.ss)}`],
  ['DESYNCED',                r => `${r.T.des}/${r.T.ss} ${pct(r.T.des, r.T.ss)}`],
  ['training days (den)',     r => r.T.days],
  ['WRONG-DURATION',          r => `${r.T.wrongDur}/${r.T.days} ${pct(r.T.wrongDur, r.T.days)}`],
  ['  mean err (wrong days)', r => (r.T.wrongDur ? (r.T.durErrSum / r.T.wrongDur).toFixed(1) : '0.0') + ' min'],
  ['  worst err',             r => r.T.durErrWorst + ' min'],
  ['4b unrounded diff days',  r => `${r.T.rawBad}/${r.T.days} ${pct(r.T.rawBad, r.T.days)}`],
  ['  mean unrounded err',    r => (r.T.rawBad ? (r.T.rawErrSum / r.T.rawBad).toFixed(1) : '0.0') + ' min'],
  ['  worst unrounded err',   r => r.T.rawWorst.toFixed(1) + ' min'],
  ['  items wrong set count', r => `${r.T.itemSetsMismatch}/${r.T.items} ${pct(r.T.itemSetsMismatch, r.T.items)}`],
  ['  banner from constant 3',  r => `${r.T.constBanner}/${r.T.ss} ${pct(r.T.constBanner, r.T.ss)}`],
];
lines.forEach(([lab, fn]) => {
  console.log('  ' + lab.padEnd(28) + results.map(r => String(r.crash ? 'CRASH' : fn(r)).padStart(20)).join(''));
});
console.log('');
const anyCrash = results.some(r => r.crash);
console.log(anyCrash ? 'MEASUREMENT INCOMPLETE — a build failed to load.' : 'MEASURED ' + results.length + ' build(s).');
process.exit(anyCrash ? 1 : 0);
