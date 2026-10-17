'use strict';
// lsd-pace: P-LSDPACE-6 items (c), (d) and (e) on the current page. Read-only (measure). Feature: docs/decisions/lsd-pace.md.
// Usage: node tests/measure/lsd-pace_recount.js [page] > <scratch>/lsd-pace_recount.out 2>&1
// (c) every NSW LSD card: what it prints, dose.tgt against the athlete's own mile row, the long-run tier now and with
//     tgt on the own row (coach r2 P-LSDPACE-4), and the hero estimate's run minutes now, with the pace gone from the
//     detail under today's sessionTimeEst, and read off the dose (r2's rule).
// (d) default-anchor builds: which W1 run carries the D189 note, and where it goes once LSD details print no pace.
// (e) HALF_MANNY: digest twice, against the snapshot, and its NSW LSD card count.
// Oracles: HAND is the PACE_CHART mile -> recovery rows typed by hand (coach r1's table); the engine's own lookup is
// printed beside it and their agreement counted. Expected card copy is coach r2's text, typed. Lattice: r1's, 960 builds.
const path = require('path');
const fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'dist-github-pages', 'index.html');
const IA = H.load(FILE);
const out = s => console.log(s);
const ev = n => { try { return IA.eval(n); } catch (e) { return undefined; } };
const lrTier = ev('_longRunTier'), est = ev('sessionTimeEst'), lookup = ev('paceChartLookup');
out('page ' + FILE + ' ia-version ' + IA.version);
out('functions: _longRunTier ' + typeof lrTier + ', sessionTimeEst ' + typeof est + ', paceChartLookup ' + typeof lookup);

const HAND = [[300,420,365],[330,455,395],[360,490,425],[390,525,460],[420,560,495],[450,595,530],[480,630,565],[510,660,595],[540,695,630],[570,730,660],[600,765,695],[630,800,720],[660,825,755],[690,845,780],[720,870,815]];
function handRec(mile) {
  if (mile <= 300) return 420;
  if (mile >= 720) return 870;
  for (let i = 0; i < HAND.length - 1; i++) {
    const a = HAND[i], b = HAND[i + 1];
    if (mile >= a[0] && mile <= b[0]) return Math.round(a[1] + (b[1] - a[1]) * (mile - a[0]) / (b[0] - a[0]));
  }
  return null;
}
const clk = s => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');
const EXP_DEFAULT = { beginner: 690, intermediate: 570, advanced: 450 };
const base = H.fixtures.HALF_MANNY;
function mk(goal, extra, exp, mile, evt, seed, rest) {
  const run = Object.assign({ id: goal, label: goal, baselineDist: '5', baseline: '5mi' }, extra);
  if (mile) { run.mileBestMins = String(Math.floor(mile / 60)); run.mileBestSecs = String(mile % 60); }
  const cfg = Object.assign({}, base, { cardioGoals: { run }, experience: exp, restDays: rest.slice(), seed, eventTargeted: evt });
  if (!evt) delete cfg.raceDate;
  return cfg;
}
const isLsd = c => !!c && !c.isNRC && c.type === 'run' && !!c.dose && (c.dose.key === 'long' || c.dose.key === 'easy');
const GOALS = [['run_pace_goal', { targetDist: '1.5', targetMins: '12', targetSecs: '0' }], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '30' }], ['run_pace_goal', { targetDist: '1', targetMins: '8', targetSecs: '0' }], ['run_mile_time', { targetMins: '8', targetSecs: '0' }], ['run_15_under10', { targetMins: '10', targetSecs: '0' }]];
const RESTS = [['sun'], ['sun', 'wed'], ['sun', 'tue', 'thu'], ['sun', 'tue', 'thu', 'sat']];
const R2_LONG = /^\d+(\.\d+)? mi at Zone 2 effort\./;

let builds = 0, crashes = 0, cards = 0, withTgt = 0, recPace = 0, zone2 = 0, maxHR = 0, lookupAgree = 0, lookupN = 0;
let faster = 0, equal = 0, slower = 0, maxFast = 0, longCards = 0;
const tierMove = {}, perGoal = {}, seg = {}, gap = {}, estNow = [], estStrip = [], estR2 = [];
let heroChangeStrip = 0, heroChangeR2 = 0, estDays = 0;
let defBuilds = 0, noteOnLsd = 0, noteOnOther = 0, noteNone = 0, moveTo = {}, vanish = 0;
const examples = [];
for (const [g, ex] of GOALS) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const mile of [0, 420, 540, 630]) for (const rest of RESTS) for (const evt of [false, true]) for (const seed of [76308, 1234]) {
  let prog;
  try { prog = IA.buildProgram(mk(g, ex, exp, mile, evt, seed, rest)); } catch (e) { crashes++; continue; }
  builds++;
  const tag = g + (ex.targetDist ? ' ' + ex.targetDist + 'mi' : '');
  const pg = perGoal[tag] = perGoal[tag] || { cards: 0, faster: 0, tierMoves: 0, longCards: 0 };
  const anchor = mile || EXP_DEFAULT[exp];
  const own = handRec(anchor);
  let engOwn = null;
  if (lookup) { try { engOwn = lookup('mile', anchor).recovery; } catch (e) { engOwn = null; } }
  if (engOwn != null) { lookupN++; if (Math.abs(engOwn - own) <= 1) lookupAgree++; }
  const ownRec = engOwn != null ? engOwn : own;
  for (const w of Object.keys(prog.weeks)) for (const d of Object.keys(prog.weeks[w])) {
    const day = prog.weeks[w][d];
    if (!day || day.rest) continue;
    for (const c of [].concat(day.cardio || [])) {
      if (!isLsd(c)) continue;
      cards++; pg.cards++;
      const det = String(c.detail || '');
      if (c.dose.tgt) withTgt++;
      if (/Recovery Pace: \d+:\d\d\/mi/.test(det)) recPace++;
      if (/\(Zone 2\)/.test(det)) zone2++;
      if (/max HR/.test(det)) maxHR++;
      const t = c.dose.tgt;
      // whole seconds both sides: the engine's row interpolates to fractions, the card prints whole seconds
      const dt = Math.round(t) - Math.round(ownRec);
      if (dt < 0) { const b = -dt >= 20 ? '20+' : -dt >= 10 ? '10-19' : -dt >= 5 ? '5-9' : '1-4'; gap[b] = (gap[b] || 0) + 1; faster++; pg.faster++; maxFast = Math.max(maxFast, -dt); if (pg.ex == null) pg.ex = exp + ' mile ' + (mile ? clk(mile) : 'default') + ' evt ' + evt + ' W' + w + ' ' + d + ' tgt ' + clk(t) + ' own ' + clk(ownRec); } else if (dt > 0) slower++; else equal++;
      const sk = tag + ' evt=' + evt; seg[sk] = seg[sk] || { n: 0, f: 0 }; seg[sk].n++; if (dt < 0) seg[sk].f++;
      if (c.dose.key === 'long') {
        longCards++; pg.longCards++;
        const now = lrTier(c);
        const c2 = JSON.parse(JSON.stringify(c)); c2.dose.tgt = ownRec;
        const aft = lrTier(c2);
        if (now !== aft) { const k = now + '>' + aft; tierMove[k] = (tierMove[k] || 0) + 1; pg.tierMoves++; if (examples.length < 6) examples.push(tag + ' ' + exp + ' mile ' + (mile ? clk(mile) : 'default') + ' rest ' + rest.join('/') + ' evt ' + evt + ' seed ' + seed + ' W' + w + ' ' + d + ' ' + c.dose.mi + ' mi tgt ' + clk(t) + ' -> ' + clk(ownRec) + ' tier ' + k); }
      }
      // hero estimate: same sections, only the cardio detail differs (tier-driven section changes are not modelled here)
      if (est && Array.isArray(day.cardio) === false) {
        estDays++;
        const a = est(day);
        const stripped = Object.assign({}, day, { cardio: Object.assign({}, c, { detail: det.replace(/ at Recovery Pace: \d+:\d\d\/mi \(Zone 2\)\./, ' at Zone 2 effort.') }) });
        const b = est(stripped);
        const r2 = Object.assign({}, day, { cardio: Object.assign({}, c, { detail: c.dose.mi + ' mi @ ' + clk(ownRec) + '/mi' }) });
        const cc = est(r2);
        estNow.push(a); estStrip.push(b - a); estR2.push(cc - a);
        if (b !== a) heroChangeStrip++;
        if (cc !== a) heroChangeR2++;
      }
    }
  }
  // (d) default anchor: the D189 note
  if (!mile) {
    defBuilds++;
    const w1 = prog.weeks['1'] || prog.weeks[1];
    let holder = null;
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (const d of order) { const day = w1 && w1[d]; if (!day || day.rest) continue; for (const c of [].concat(day.cardio || [])) if (c && /Paces here start from/.test(c.note || '')) holder = { d, c }; }
    if (!holder) noteNone++;
    else if (isLsd(holder.c)) {
      noteOnLsd++;
      let next = null;
      for (const d of order) { const day = w1[d]; if (!day || day.rest) continue; for (const c of [].concat(day.cardio || [])) { if (next || !c || c.type !== 'run' || isLsd(c)) continue; if (/RACE DAY|TIME TRIAL|^Benchmark Run/i.test(c.subtype || '') || (c.dose && c.dose.key === 'bench')) continue; if (/\d:\d\d\/mi/.test(c.detail || '')) next = d + ' ' + String(c.subtype || '').replace(/\s*\(.*$/, '').slice(0, 24); } }
      if (next) { const k = next.replace(/^\w+ /, ''); moveTo[k] = (moveTo[k] || 0) + 1; } else vanish++;
    } else noteOnOther++;
  }
}
const dist = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return Object.keys(m).sort((x, y) => +x - +y).map(k => k + ':' + m[k]).join(' '); };
out('\n== (c) NSW LSD cards, ' + builds + ' builds, ' + crashes + ' crashes, ' + cards + ' cards (' + longCards + ' long)');
out('dose.tgt present ' + withTgt + '/' + cards + '; "Recovery Pace: m:ss/mi" ' + recPace + '/' + cards + '; "(Zone 2)" ' + zone2 + '/' + cards + '; "max HR" ' + maxHR + '/' + cards);
out('engine own-row lookup agrees with the hand table (+-1 s) on ' + lookupAgree + '/' + lookupN + ' builds');
out('tgt vs own row: faster ' + faster + ', equal ' + equal + ', slower ' + slower + ' (of ' + cards + '); max faster ' + maxFast + ' s/mi');
out('faster by (s/mi): ' + JSON.stringify(gap));
out('long-run tier moves with tgt on the own row: ' + JSON.stringify(tierMove) + ' of ' + longCards + ' long cards');
for (const k of Object.keys(perGoal)) out('  ' + k + ': cards ' + perGoal[k].cards + ', faster ' + perGoal[k].faster + ', long ' + perGoal[k].longCards + ', tier moves ' + perGoal[k].tierMoves + '; first faster: ' + perGoal[k].ex);
for (const k of Object.keys(seg)) out('  faster by goal and event: ' + k + ' ' + seg[k].f + '/' + seg[k].n);
out('examples:'); examples.forEach(e => out('  ' + e));
out('hero estimate (rounded to 5 min) on ' + estDays + ' LSD days: changes if the pace leaves the detail under today\'s code ' + heroChangeStrip + '/' + estDays + ', deltas ' + dist(estStrip));
out('  read off the dose with the own-row tgt (r2): changes ' + heroChangeR2 + '/' + estDays + ', deltas ' + dist(estR2));
out('\n== (d) default-anchor builds ' + defBuilds + ': D189 note on an LSD ' + noteOnLsd + ', on another run ' + noteOnOther + ', on none ' + noteNone);
out('  of the ' + noteOnLsd + ' on an LSD: moves to ' + JSON.stringify(moveTo) + '; no other paced W1 run, so it vanishes: ' + vanish);
// (e) HALF_MANNY
const hm1 = IA.buildProgram(H.fixtures.HALF_MANNY), hm2 = IA.buildProgram(H.fixtures.HALF_MANNY);
let hmLsd = 0, hmRuns = 0;
for (const w of Object.keys(hm1.weeks)) for (const d of Object.keys(hm1.weeks[w])) { const day = hm1.weeks[w][d]; if (!day || day.rest) continue; for (const c of [].concat(day.cardio || [])) { if (c && c.type === 'run') hmRuns++; if (isLsd(c)) hmLsd++; } }
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'snapshots', 'program-output.json'), 'utf8'));
const hmKey = Object.keys(snap.programs).find(k => /half-manny/i.test(k));
const snapHm = snap.programs[hmKey];
out('\n== (e) HALF_MANNY digest ' + H.progDigest(hm1) + ' twice-equal ' + (H.progDigest(hm1) === H.progDigest(hm2)) + '; NSW LSD cards ' + hmLsd + ' of ' + hmRuns + ' runs; snapshot entry keys ' + (snapHm && typeof snapHm === 'object' ? Object.keys(snapHm).slice(0, 6).join(',') : typeof snapHm));
if (snapHm && snapHm.digest) out('  snapshot digest ' + snapHm.digest + ' equal ' + (snapHm.digest === H.progDigest(hm1)));
const nswSnap = Object.keys(snap.programs).filter(k => /test goal/i.test(k));
out('  snapshot programs that are NSW test goals (their LSD cards would move): ' + nswSnap.length + ' of ' + Object.keys(snap.programs).length + ': ' + nswSnap.join(' | '));
