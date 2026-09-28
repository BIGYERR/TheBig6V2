// g203_mile_pencil.js — the gate for D116, the mile pencil (V203 slice C).
//
// ORACLES, all independent of the engine:
//   * the lock popup body and header are typed here from the D116 ruling text,
//     character for character. The gate never reads the app's copy and compares
//     it to itself.
//   * the lock PREDICATE is a hand table. D116 says "three weeks out the work is
//     done", i.e. the last three weeks of a program are locked. For a 14-week
//     program that is weeks 12, 13 and 14 and no others; for a 6-week program it
//     is weeks 4, 5 and 6. The table below is written from that sentence, not
//     from the code.
//   * the days-out number is date arithmetic done here from the fixture's race
//     date and the harness clock, not read back from the app.
//   * the pencil table is the ruling's after-grid: a run goal that reads the
//     pace chart gets exactly one pencil, run_base gets none because it has no
//     runAnchor at all, and a beginner gets none because the beginner default is
//     not a number the athlete owns.
//   * the mile-validation strings are typed here, one pair per era: the V176 (D9)
//     literals at ia-version <= 222, D183's (P-SAFEPACE amendment 2 (e)) at >= 223.
//     D116 reuses the wizard's validator; if anyone rewords one, this trips.
//
// VERSION PREDICATE (standing ruling 4 — a gate is keyed to the RULING it defends,
// and its predicate must say so). D116 ships on ia-version 203.
//   * at 203 and above the D116 surface MUST exist. Its absence is a named FAIL,
//     never a skip, so a later version cannot quietly drop the pencil.
//   * below 203, an artifact WITHOUT the surface is NOT APPLICABLE: the gate reports
//     its rows as skipped and exits clean. gate.sh runs every gate against the
//     PREVIOUS artifact first, and a gate that hard-fails there makes that run
//     unreadable — the failure means "old build is old", which tests nothing.
//   * below 203 WITH the full surface present is the pre-bump working artifact
//     mid-slice. Every row RUNS: the surface is there to be tested and declining
//     would hide the only build that can exercise it.
// The teeth are not lost. Stamp a copy of the V202 artifact to content="203" and
// every D116 row fails on it, which is the proof that this predicate hides nothing.
//
// SECOND PREDICATE, the two race-date rows of section 3 (re-keyed V223 for D182 P-RACEDATE,
// tests/edits/v223_t1_d182_g203_rekey.py). D182 changed what the lock sheet's "Days out" and
// "Race day" rows print. The V203 rows are licensed at ia-version <= 222 (their era) and do not
// run above it; the D182 rows run at >= 223. The summary names the era that ran.
// The same predicate keys section 6's two refusal strings (re-keyed V223 for D183 P-SAFEPACE
// amendment 2 (e), tests/edits/v223_t2_d183_rekey_g207_g218_g203.py): the V176 (D9) strings at
// ia-version <= 222 (their era), D183's at >= 223. Both splits read one version, eraV:
// IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run; it is
// announced, ignored on any other stamp, and gate.sh never sets it.

const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');

let pass = 0, fail = 0;
function ok(name, cond, detail){
  if(cond){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
function eq(name, got, want){
  ok(name, got === want, 'got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));
}

// ── the ruled copy, typed from D116 ───────────────────────────────────────────
const LOCK_HEADER = 'THE ROW HOLDS';
const LOCK_BODY = 'You are too close to the race. Three weeks out the work is done. Changing your mile now would reset the pace of every session left, and those sessions have one job. Get you to the line fresh.';
const LOCK_BTN = 'Got it';
const COMMIT_TOAST = 'Mile updated. Every run still ahead of you now reads from your new row.';

// The mile validator's two refusal strings, one pair per era (the predicate is eraV, section 0).
// V176 (D9) literals, licensed at ia-version <= 222 (their era). Retyped.
const MSG_UNDER_3_D9 = 'Under 3:00 isn’t a mile time — the world record is 3:43. Check the entry.';
const MSG_OVER_25_D9 = 'Over 25:00 reads as a walk, not a run — leave it blank and the program anchors on your experience level instead.';
// D183 (P-SAFEPACE amendment 2 (e), tests/measure/v223_rulings/p_safepace_ruling.md) at ia-version >= 223. Typed from the ruling.
const MSG_UNDER_3_D183 = 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.';
const MSG_OVER_25_D183 = 'Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.';

// D116 lock predicate, hand table: {totalWeeks, week, locked}
const LOCK_TABLE = [
  { tw: 14, wk: 10, locked: false },
  { tw: 14, wk: 11, locked: false },
  { tw: 14, wk: 12, locked: true  },
  { tw: 14, wk: 13, locked: true  },
  { tw: 14, wk: 14, locked: true  },
  { tw:  6, wk:  3, locked: false },
  { tw:  6, wk:  4, locked: true  },
  { tw:  6, wk:  6, locked: true  },
];

// ── boot with a registry-backed DOM so innerHTML and classes are observable ───
const IA = H.load(FILE);
const doc = IA.window.document;
const reg = new Map();
const baseGet = doc.getElementById;
doc.getElementById = function(id){
  if(!reg.has(id)){
    const el = baseGet.call(doc, id);
    el.id = id;
    const cls = new Set();
    el.classList = {
      add: c => cls.add(c), remove: c => cls.delete(c),
      toggle: c => (cls.has(c) ? cls.delete(c) : cls.add(c)), contains: c => cls.has(c),
    };
    el._cls = cls;
    reg.set(id, el);
  }
  return reg.get(id);
};
const toasts = [];
IA.window.__gateToast = m => toasts.push(m);
IA.eval('showToast = function(m){ __gateToast(m); }');

const SEP = String.fromCharCode(1);
const textOf = h => String(h).replace(/<[^>]+>/g, SEP).split(SEP).map(s => s.trim()).filter(Boolean).join('\n');

// A Monday, so getWeekMonday is the identity and the week arithmetic below is exact.
const MS_DAY = 86400000;
function startDateForWeek(wk){
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(today.getTime() - (wk - 1) * 7 * MS_DAY);
  while(d.getDay() !== 1) d.setTime(d.getTime() - MS_DAY);   // walk back to Monday
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function seed(opts){
  opts = opts || {};
  reg.clear(); toasts.length = 0;
  const cfg = Object.assign({}, IA.fixtures.HALF_MANNY, opts.cfg || {});
  if(opts.noRace){ delete cfg.raceDate; cfg.primaryPath = 'test'; cfg.eventTargeted = false; }
  const p = {
    id: 'gP', name: 'THE HALF MANNY',
    totalWeeks: opts.tw || 14,
    startDate: startDateForWeek(opts.wk || 3),
    cfg: cfg,
  };
  IA.localStorage.setItem('ia_programs', JSON.stringify([p]));
  return p;
}
const isOpen = id => doc.getElementById(id)._cls.has('open');
const openSheet = () => IA.eval('openMileSheet')('gP');
const stored = () => JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg.cardioGoals.run;

console.log('g203_mile_pencil  (D116 — the mile pencil)  artifact ia-version ' + IA.version);

// ── 0. the version predicate ──────────────────────────────────────────────────
const RULING_V = 203;
const artifactV = +IA.version;
// ERA PREDICATE for the re-keyed rows (standing rulings 2 and 4): section 3's D182 race-date rows and
// section 6's D183 refusal strings read one version, eraV. IA_ASSUME_VERSION=223 lifts a file stamped
// exactly 222 to 223 for a discrimination run; it is announced and ignored on any other stamp. The D116
// predicate and the era-row digest read the stamp, never eraV.
const REKEY_ASSUME = 223;
const eraV = (process.env.IA_ASSUME_VERSION === String(REKEY_ASSUME) && artifactV === REKEY_ASSUME - 1) ? REKEY_ASSUME : artifactV;
if(eraV !== artifactV) console.log('ASSUMED ia-version ' + eraV + ' on a file stamped ' + artifactV + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
const D183_ERA = 223;
const MILE_MSG_TAG = eraV >= D183_ERA ? 'D183' : 'D9';
const MILE_MSG_ERA = eraV >= D183_ERA
  ? 'D183 era (ia-version ' + eraV + ' >= ' + D183_ERA + '): P-SAFEPACE amendment 2 (e) strings'
  : 'D9 era (ia-version ' + eraV + ' <= ' + (D183_ERA - 1) + '): V176 (D9) strings';
const MSG_UNDER_3 = eraV >= D183_ERA ? MSG_UNDER_3_D183 : MSG_UNDER_3_D9;
const MSG_OVER_25 = eraV >= D183_ERA ? MSG_OVER_25_D183 : MSG_OVER_25_D9;
const SURFACE = {
  'openMileSheet declared':      typeof IA.eval('typeof openMileSheet === "function" ? openMileSheet : undefined') === 'function',
  'commitMileChange declared':   typeof IA.eval('typeof commitMileChange === "function" ? commitMileChange : undefined') === 'function',
  'mileOverlay markup':          /id="mileOverlay"/.test(IA.html),
  'mileLockOverlay markup':      /id="mileLockOverlay"/.test(IA.html),
  'the D116 lock body copy':     IA.html.indexOf(LOCK_BODY) >= 0,
  'the D116 commit toast':       IA.html.indexOf(COMMIT_TOAST) >= 0,
};
const missing = Object.keys(SURFACE).filter(k => !SURFACE[k]);

console.log('\n0. version predicate (D116 ships on ia-version ' + RULING_V + ')');
if(artifactV >= RULING_V){
  Object.keys(SURFACE).forEach(k => ok('at ia-version ' + artifactV + ' the D116 surface MUST exist: ' + k, SURFACE[k]));
  if(missing.length){
    console.log('\nD116 surface is MISSING at or above its ruling version. Rows above are the report.');
    console.log('\nPASS ' + pass + ' FAIL ' + fail);
    process.exit(1);
  }
} else if(missing.length){
  ok('ia-version ' + artifactV + ' is below ' + RULING_V + ' and carries none of the D116 surface, so this gate declines', true);
  console.log('  n/a  NOT APPLICABLE at ia-version ' + artifactV + ': missing ' + missing.join('; '));
  console.log('\nNOT APPLICABLE: ia-version ' + artifactV + ' is below ' + RULING_V + ' and does not carry the D116 surface. All D116 rows skipped.');
  console.log('\nPASS ' + pass + ' FAIL ' + fail);
  process.exit(0);
} else {
  ok('ia-version ' + artifactV + ' is below ' + RULING_V + ' but the whole D116 surface is present (pre-bump working artifact), so every row RUNS', true);
}

// ── 1. the surface exists ─────────────────────────────────────────────────────
console.log('\n1. D116 surface');
ok('openMileSheet is a function',  typeof IA.eval('openMileSheet')   === 'function');
ok('closeMileSheet is a function', typeof IA.eval('closeMileSheet')  === 'function');
ok('commitMileChange is a function', typeof IA.eval('commitMileChange') === 'function');
ok('mileOverlay markup present',     /id="mileOverlay"/.test(IA.html));
ok('mileLockOverlay markup present', /id="mileLockOverlay"/.test(IA.html));
ok('minutes field present', /id="mileSheetMins"/.test(IA.html));
ok('seconds field present', /id="mileSheetSecs"/.test(IA.html));

// ── 2. the lock predicate, against the hand table ─────────────────────────────
console.log('\n2. lock predicate (hand table: the last three weeks lock)');
LOCK_TABLE.forEach(r => {
  seed({ tw: r.tw, wk: r.wk });
  const gotWk = IA.eval('_goalCurWeek')(JSON.parse(IA.localStorage.getItem('ia_programs'))[0]);
  eq('week ' + r.wk + '/' + r.tw + ' resolves to week ' + r.wk, gotWk, r.wk);
  openSheet();
  eq('week ' + r.wk + ' of ' + r.tw + ' locked=' + r.locked, isOpen('mileLockOverlay'), r.locked);
  eq('week ' + r.wk + ' of ' + r.tw + ' edit sheet open=' + !r.locked, isOpen('mileOverlay'), !r.locked);
});

// ── 3. lock popup contents ────────────────────────────────────────────────────
console.log('\n3. lock popup contents');
seed({ tw: 14, wk: 12 });
openSheet();
let lock = textOf(doc.getElementById('mileLockBody').innerHTML).split('\n');
ok('header is ' + JSON.stringify(LOCK_HEADER), lock[0] === LOCK_HEADER, JSON.stringify(lock[0]));
ok('body is the D116 text, verbatim', lock.indexOf(LOCK_BODY) >= 0, JSON.stringify(lock));
ok('button is ' + JSON.stringify(LOCK_BTN), lock[lock.length-1] === LOCK_BTN, JSON.stringify(lock[lock.length-1]));
ok('no re-paced draft wording survives', !/re-pace/i.test(doc.getElementById('mileLockBody').innerHTML));

// facts block. TWO ERAS, each licensed by a predicate on the artifact's ia-version (standing
// rulings 2 and 4):
//   pre-D182 (ia-version <= 222): the V203 rows, written when the sheet parsed the race date as
//     UTC midnight and printed a bare "Dec 6, 2026". Their oracle does the same parse because that
//     was the shipped behaviour of their era. Above 222 these two rows do not run.
//   D182 (ia-version >= 223, P-RACEDATE, tests/measure/v223_rulings/p_racedate_ruling.md (i), (ii)
//     and amendment (a) Q2): "Race day" prints the weekday date ("Sun, Dec 6, 2026") from a local
//     parse; "Days out" is the day count while days >= 1, "Race day" at 0, "Behind you" below. The
//     oracle is y/m/d integers only: weekday by Sakamoto's algorithm, month from a typed table, days
//     by days-from-civil. The host clock supplies today's local y/m/d and nothing else.
const raceDate = IA.fixtures.HALF_MANNY.raceDate;
const D182_ERA = 223;
const RACEDATE_ERA = eraV >= D182_ERA
  ? 'D182 era (ia-version ' + eraV + ' >= ' + D182_ERA + '): hand y/m/d oracle, weekday date, local-parse Days out'
  : 'pre-D182 era (ia-version ' + eraV + ' <= ' + (D182_ERA - 1) + '): UTC-parse oracle, bare month/day/year';
if(eraV < D182_ERA){
  const rd = new Date(raceDate); rd.setHours(0,0,0,0);
  const t0 = new Date(); t0.setHours(0,0,0,0);
  const wantDaysOut = String(Math.round((rd - t0) / MS_DAY));
  const wantRaceStr = new Date(raceDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  ok('pre-D182 era: days out line = ' + wantDaysOut, lock.indexOf(wantDaysOut) >= 0, JSON.stringify(lock));
  ok('pre-D182 era: race day line = ' + wantRaceStr, lock.indexOf(wantRaceStr) >= 0, JSON.stringify(lock));
} else {
  console.log('  n/a  the two pre-D182 race-date rows are licensed at ia-version <= ' + (D182_ERA - 1) + ' only; ia-version ' + eraV + ' runs the D182 rows in their place');
  const WD3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sakamoto = (y, m, d) => { const t = [0,3,2,5,0,3,5,1,4,6,2,4]; if(m < 3) y -= 1; return (y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) + t[m-1] + d) % 7; };
  const civ = (y, m, d) => { y -= m <= 2 ? 1 : 0; const era = Math.floor(y/400), yoe = y - era*400;
    const doy = Math.floor((153*(m + (m > 2 ? -3 : 9)) + 2)/5) + d - 1;
    return era*146097 + yoe*365 + Math.floor(yoe/4) - Math.floor(yoe/100) + doy - 719468; };
  const [ry, rm, rdd] = raceDate.split('-').map(Number);
  const now = new Date();
  const days = civ(ry, rm, rdd) - civ(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const wantDaysOut = days >= 1 ? String(days) : days === 0 ? 'Race day' : 'Behind you';
  const wantRaceStr = WD3[sakamoto(ry, rm, rdd)] + ', ' + MON3[rm - 1] + ' ' + rdd + ', ' + ry;
  ok('D182 era: days out line = ' + wantDaysOut + ' (' + days + ' days by hand)', lock[lock.indexOf('Days out') + 1] === wantDaysOut, JSON.stringify(lock));
  ok('D182 era: race day line = ' + wantRaceStr, lock[lock.lastIndexOf('Race day') + 1] === wantRaceStr, JSON.stringify(lock));
}
ok('week line reads "Week 12 of 14"', /Week[\s\S]{0,40}?12 of 14/.test(lock.join(' ')), JSON.stringify(lock));

console.log('\n3b. no raceDate omits the two date lines, keeps the week line');
seed({ tw: 14, wk: 12, noRace: true });
openSheet();
lock = textOf(doc.getElementById('mileLockBody').innerHTML);
ok('days-out line omitted',  !/Days out/.test(lock), lock);
ok('race-day line omitted',  !/Race day/.test(lock), lock);
ok('week line kept',         /Week[\s\S]{0,40}?12 of 14/.test(lock.replace(/\n/g,' ')), lock);
ok('body still present',     lock.indexOf(LOCK_BODY) >= 0);

// ── 4. the pencil, against the ruling's after-grid ────────────────────────────
console.log('\n4. pencil presence (ruling after-grid)');
const detail = IA.eval('progDetailHTML');
const mkProg = cfg => ({ id:'gQ', name:'n', totalWeeks:14, startDate:startDateForWeek(3),
                         cfg: Object.assign({}, IA.fixtures.HALF_MANNY, cfg) });
const PENCIL_GRID = [
  { label: 'run_half / intermediate (chart-reading anchor)', cfg: {}, pencils: 1 },
  { label: 'run_base (no runAnchor at all)', cfg: { cardioGoals:{ run:{ id:'run_base', label:'Build a Base' } } }, pencils: 0 },
  { label: 'beginner experience (beginner default anchor)', cfg: { experience:'beginner' }, pencils: 0 },
];
PENCIL_GRID.forEach(r => {
  const h = detail(mkProg(r.cfg));
  eq(r.label + ' -> ' + r.pencils + ' pencil(s)', (h.match(/openMileSheet\(/g) || []).length, r.pencils);
  if(r.pencils) ok(r.label + ' pencil carries the ruled aria-label', /aria-label="Change mile time"/.test(h));
});
ok('run_base renders no Run paces group at all', !/det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[1].cfg))));
ok('beginner still renders the Run paces group (chips, no pencil)', /det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[2].cfg))));

// ── 5. commit: from is ALWAYS emitted ─────────────────────────────────────────
console.log('\n5. commitMileChange writes kind:edited and ALWAYS writes from');
function commit(mm, ss, opts){
  seed(Object.assign({ tw: 14, wk: 3 }, opts || {}));
  openSheet();
  doc.getElementById('mileSheetMins').value = mm;
  doc.getElementById('mileSheetSecs').value = ss;
  toasts.length = 0;
  IA.eval('commitMileChange')();
  return stored();
}
// `from` is the object the ruling says is ALWAYS emitted. A gate that dereferences it
// blind cannot report its absence: it dies, and a dead gate is not a passing one.
const FROM = s => (s && s.from) || {};
const NO_PRIOR = { cfg: { cardioGoals: { run: { id:'run_half', label:'Half Marathon', baselineDist:'5', baseline:'5mi' } } } };
let g = commit('8', '12', NO_PRIOR);
eq('over a DEFAULT anchor: mins stored as typed', g.mileBestMins, '8');
eq('over a DEFAULT anchor: secs stored as typed', g.mileBestSecs, '12');
eq('over a DEFAULT anchor: kind', g.mileBestSrc.kind, 'edited');
eq('over a DEFAULT anchor: wk', g.mileBestSrc.wk, 3);
ok('over a DEFAULT anchor: from IS emitted', !!g.mileBestSrc.from, JSON.stringify(g.mileBestSrc));
eq('over a DEFAULT anchor: from.kind', FROM(g.mileBestSrc).kind, 'default');
eq('over a DEFAULT anchor: from.mins', FROM(g.mileBestSrc).mins, '');
ok('at is an ISO date', /^\d{4}-\d{2}-\d{2}$/.test(g.mileBestSrc.at), g.mileBestSrc.at);

g = commit('9', '45');
eq('over an ENTERED anchor: from.kind', FROM(g.mileBestSrc).kind, 'entered');
eq('over an ENTERED anchor: from.mins', FROM(g.mileBestSrc).mins, '10');
eq('over an ENTERED anchor: from.secs', FROM(g.mileBestSrc).secs, '30');
eq('over an ENTERED anchor: new value as typed', g.mileBestMins + ':' + g.mileBestSecs, '9:45');
eq('commit toast is the ruled sentence', toasts[0], COMMIT_TOAST);
ok('a pencil never un-anchors the goal', g.mileBestMins !== '' && g.mileBestMins !== undefined);

// the edited anchor must reach runAnchorSentence as an edit, not as a bare entry
const anchorAfter = IA.eval('runAnchorInfo')(JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg);
eq('runAnchorInfo reports kind edited', anchorAfter && anchorAfter.kind, 'edited');
ok('runAnchorSentence names what it replaced',
   /Before that it was/.test(IA.eval('runAnchorSentence')(anchorAfter)),
   IA.eval('runAnchorSentence')(anchorAfter));

// ── 6. validation, sharing the wizard's strings ───────────────────────────────
console.log('\n6. validation (one validator, the D9 strings)');
g = commit('8', '');
eq('blank seconds BLOCKS the commit', g.mileBestMins, '10');
ok('blank seconds toasts something', toasts.length === 1, JSON.stringify(toasts));
g = commit('', '30');
eq('blank minutes BLOCKS the commit', g.mileBestMins, '10');
g = commit('2', '30');
eq('2:30 rejected, value unchanged', g.mileBestMins + ':' + g.mileBestSecs, '10:30');
eq('2:30 uses the ' + MILE_MSG_TAG + ' under-3:00 string', toasts[0], MSG_UNDER_3);
g = commit('26', '00');
eq('26:00 rejected, value unchanged', g.mileBestMins + ':' + g.mileBestSecs, '10:30');
eq('26:00 uses the ' + MILE_MSG_TAG + ' over-25:00 string', toasts[0], MSG_OVER_25);
g = commit('4', '10');
eq('4:10 advises but COMMITS', g.mileBestMins + ':' + g.mileBestSecs, '4:10');
ok('4:10 toast leads with the ruled sentence', toasts[0].indexOf(COMMIT_TOAST) === 0, toasts[0]);
ok('4:10 toast carries the chart advisory', /fastest row/.test(toasts[0]), toasts[0]);
g = commit('13', '00');
eq('13:00 advises but COMMITS', String(+g.mileBestMins * 60 + +g.mileBestSecs), '780');
ok('13:00 toast carries the slowest-row advisory', /slowest/.test(toasts[0]), toasts[0]);

console.log('\n6b. the wizard call sites still work with no arguments');
IA.eval('WD = { experience:"intermediate", cardioGoals:{ run:{ mileBestMins:"2", mileBestSecs:"30" } } }');
eq('_mileEntryState() reads WD: 2:30 rejected', IA.eval('_mileEntryState()').msg, MSG_UNDER_3);
IA.eval('WD.cardioGoals.run.mileBestMins="10"; WD.cardioGoals.run.mileBestSecs="30"');
eq('_mileEntryState() reads WD: 10:30 clean', IA.eval('_mileEntryState()').ok, true);
IA.eval('WD.experience="beginner"');
eq('_mileEntryState() reads WD: beginner passes clean', IA.eval('_mileEntryState()').ok, true);
eq('_mileEntryState takes (g, exp)', IA.eval('_mileEntryState').length, 2);
eq('explicit args bypass WD entirely',
   IA.eval('_mileEntryState')({ mileBestMins:'26', mileBestSecs:'0' }, 'intermediate').msg, MSG_OVER_25);

// ── 7. the value interpolates, it does not snap to a chart row ────────────────
console.log('\n7. as typed, interpolated, never snapped');
const lookup = IA.eval('paceChartLookup');
const at = sec => JSON.stringify(lookup('mile', sec));
ok('8:30 is not the 8:00 row', at(510) !== at(480), at(510));
ok('8:30 is not the 9:00 row', at(510) !== at(540), at(510));
ok('an edited 8:30 anchor lands on the 8:30 lookup',
   at((function(){ const x = commit('8','30'); return (+x.mileBestMins)*60 + (+x.mileBestSecs); })()) === at(510));

// ── 8. copy rule ──────────────────────────────────────────────────────────────
console.log('\n8. copy rule on athlete-facing D116 strings');
const midDash = s => /[A-Za-z0-9,)]\s*[—-]\s*[A-Za-z0-9(]/.test(s.replace(/\d+–\d+/g,''));
ok('lock body carries no mid-sentence hyphen or em-dash', !midDash(LOCK_BODY), LOCK_BODY);
ok('commit toast carries no mid-sentence hyphen or em-dash', !midDash(COMMIT_TOAST), COMMIT_TOAST);
ok('lock body ships in the artifact verbatim', IA.html.indexOf(LOCK_BODY) >= 0);
ok('commit toast ships in the artifact verbatim', IA.html.indexOf(COMMIT_TOAST) >= 0);
ok('no user-facing Nike in the D116 strings', !/Nike/.test(LOCK_BODY + COMMIT_TOAST + LOCK_HEADER));

// ── 9. D116 moves no build ────────────────────────────────────────────────────
console.log('\n9. D116 is UI and cfg-write only: HALF_MANNY must not move');
// V203 slices A and B moved HALF_MANNY off the shipped V202 row by ruling
// (d4364dd3fa63a3a1 -> 7d4f7ed45cc5bd53); D116 is UI and cfg-write only and must move
// it no further. That post-A+B digest is now a LITERAL row in the era table
// (MANNY_DIGEST_BY_VERSION[203], standing ruling 5), so the pin reads the era row
// instead of carrying a second copy of the same sixteen bytes. Two copies of one
// digest is exactly the duplication the ceiling ruling exists to kill, and the copy
// that drifts is always the one a gate keeps privately. Row existence is a CONJUNCT
// below, so a missing row fails loudly rather than making this comparison vacuous.
const D116_ENTRY_DIGEST = H.MANNY_DIGEST_BY_VERSION[IA.version];
ok('MANNY_DIGEST_BY_VERSION has a row for ia-version ' + IA.version,
   !!H.MANNY_DIGEST_BY_VERSION[IA.version], String(H.MANNY_DIGEST_BY_VERSION[IA.version]));
eq('HALF_MANNY digest unmoved by D116 (pinned to the V' + IA.version + ' era row)',
   H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)), D116_ENTRY_DIGEST);

const cfgBefore = JSON.stringify(IA.fixtures.HALF_MANNY);
IA.buildProgram(IA.fixtures.HALF_MANNY);
eq('buildProgram left cfg byte-identical (no _racePin, no scratch)', JSON.stringify(IA.fixtures.HALF_MANNY), cfgBefore);

console.log('\nERA race-date rows: ' + RACEDATE_ERA);
console.log('ERA mile validator strings: ' + MILE_MSG_ERA);
console.log('PASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
