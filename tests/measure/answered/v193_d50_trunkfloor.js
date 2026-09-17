// MEASURE v193 D50 — the trunk floor moved from the section to the day.
//
// Runs the ruled 288-cell lattice (tests/lattice193.js WIDE) against a baseline artifact
// and the candidate, and prints every number D50's bar is stated in:
//   B1b   cells whose core-section count REGRESSED vs the baseline           (must be 0)
//   Z     days that print zero `Trunk —` items outside the long-run tiers
//         and the D37/D38 race window                                        (must be 0)
//   LR    long-run tier days byte-identical to the baseline                  (must be all)
//   RW    race-window days byte-identical to the baseline                    (must be all)
//   thin  share of one-item trunk sections (D51, REPORT ONLY)
//
// The long-run tier and the race window are re-derived BY HAND here from the doctrine
// numbers (75 / 45 minutes; race day and the two days before it), never by calling the
// engine's own _longRunTier or raceEveLiftPass. A measure that classifies with the code it
// is measuring cannot see a classifier bug.
//
//   node tests/measure/v193_d50_trunkfloor.js <baseline.html> <candidate.html>

const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '..', 'lattice193.js'));

const BASE_FILE = process.argv[2];
const CAND_FILE = process.argv[3] || 'index.html';
if (!BASE_FILE){ console.error('usage: node tests/measure/v193_d50_trunkfloor.js <baseline.html> [candidate.html]'); process.exit(2); }

const BASE = load(BASE_FILE);
const CAND = load(CAND_FILE);

const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const isTrunkSec = s => /^Trunk /.test((s && s.label) || '');
const isCoreSec  = s => !!(s && (s.core || isTrunkSec(s)));

// HAND ORACLE 1 — the long-run tier. D18/D33: NRC long runs only, keyed off the session's
// own dose. >=75 min tier A, 45-75 tier B, under 45 tier C. Race day / time trial is not a
// long run; a dress rehearsal is tier A on every row.
function handLongRunTier(c){
  if (!c || !c.isNRC || !c.dose) return null;
  if (!/^long run/i.test(c.subtype || '')) return null;
  if (/race day|time trial/i.test(c.subtype || '')) return null;
  if (/rehearsal/i.test(c.detail || '')) return 'A';
  const d = c.dose;
  const m = d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60;
  if (!m) return null;
  return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C';
}
// HAND ORACLE 2 — the D37/D38 race window: race day and the two days before it, over the
// last two weeks flattened Monday to Sunday. Race day is found BY SUBTYPE, never position.
// MONDAY TO SUNDAY, per D38. harness DAYS starts on Sunday and rotates the flattening by a
// day, which puts a Sunday race at the FRONT of its week and lands two-days-out on the wrong
// Friday. Typed from the doctrine sentence.
const ISO = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function handRaceWindow(prog){
  const win = new Set();
  const tw = Object.keys(prog.weeks || {}).map(Number).filter(n => n).sort((a,b) => a-b).pop();
  if (!tw) return win;
  const flat = [];
  [tw - 1, tw].forEach(w => { if (prog.weeks[w]) ISO.forEach(d => flat.push(w + '|' + d)); });
  const ri = flat.findIndex(k => {
    const [w, d] = k.split('|');
    const day = (prog.weeks[w] || {})[d];
    return !!(day && day.cardio && /RACE DAY|TIME TRIAL/i.test(day.cardio.subtype || ''));
  });
  if (ri < 0) return win;
  for (let k = 0; k <= 2; k++) if (flat[ri - k]) win.add(flat[ri - k]);
  return win;
}

function scan(IA, cell){
  const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, cell.over));
  const win = handRaceWindow(prog);
  // Recovery and taper weeks are ruled elsewhere and BOTH legitimately clear the trunk
  // block: recoveryDeload cuts the day to main + one accessory + hip prehab, and the taper
  // strips to the primer. D50 is a rule about BUDGET deletion, so those weeks are counted
  // separately rather than folded into the bar.
  const recov = new Set((prog.liftRecoveryWeeks || []).map(String));
  // prog.taperWeeks is the LIST of taper week numbers, not a count. Reading it as a number
  // yields NaN and silently classifies every taper week as an ordinary one.
  const taper = new Set((prog.taperWeeks || []).map(String));
  const isTaper = w => taper.has(String(w));
  // TWO core-section axes, because they answer different questions and B1b was reported on
  // the narrow one. `flagSecs` counts ONLY the optional finisher injectDynamicCore pushes
  // (s.core). `coreSecs` is that plus the builder's own `Trunk — *` block. A budget floor
  // can only ever move a section the budget deleted, so a gap that shows up on BOTH axes
  // with the budget bypassed is not a budget defect at all.
  const out = { coreSecs: 0, flagSecs: 0, trunkSecs: 0, thinTrunk: 0, zeroTrunkDays: 0, zeroWho: '',
                zRecov: 0, zTaper: 0, days: Object.create(null) };
  for (const w of Object.keys(prog.weeks || {})){
    for (const d of DAYS){
      const day = (prog.weeks[w] || {})[d]; if (!day) continue;
      const secs = day.sections || [];
      const tier = handLongRunTier(day.cardio);
      const inWin = win.has(w + '|' + d);
      const trunkSecs = secs.filter(isTrunkSec);
      const trunkItems = trunkSecs.reduce((a, s) => a + ((s.items || []).length), 0);
      out.coreSecs  += secs.filter(isCoreSec).length;
      out.flagSecs  += secs.filter(s => s && s.core).length;
      out.trunkSecs += trunkSecs.length;
      trunkSecs.forEach(s => { if ((s.items || []).length === 1) out.thinTrunk++; });
      // Only a day the builder MEANT to carry trunk can print zero trunk. `Rehab + Trunk`
      // is that day and it names itself: the title is written by injuryDayTitle before any
      // trim runs, so it is an independent witness to what the card claims to be.
      const claimsTrunk = /trunk/i.test(day.title || '');
      if (claimsTrunk && trunkItems === 0 && !tier && !inWin){
        if (recov.has(String(w))) out.zRecov++;
        else if (isTaper(w)) out.zTaper++;
        else {
          out.zeroTrunkDays++;
          if (!out.zeroWho) out.zeroWho = `${cell.tag} W${w} ${d.toUpperCase()} "${day.title}"`;
        }
      }
      // Fingerprint every day so LR / RW byte-identity is a comparison, not a claim.
      out.days[w + '|' + d] = JSON.stringify({
        t: day.title || '', tier, inWin,
        s: secs.map(s => [s.label || '', (s.items || []).map(i => clean(i && i.name))]),
      });
    }
  }
  return out;
}

const cells = LAT.WIDE;
console.log(`lattice cells ${cells.length} (WIDE_N ${LAT.WIDE_N})`);
if (cells.length !== LAT.WIDE_N) { console.log('LATTICE SHRANK'); process.exit(2); }

let regressed = 0, regressedWho = [], zero = 0, zeroWho = '', zeroBase = 0, zRecov = 0, zTaper = 0;
let lrDays = 0, lrDiff = 0, lrWho = '', rwDays = 0, rwDiff = 0, rwWho = '';
let otherDiffDays = 0, thinB = 0, thinC = 0, secB = 0, secC = 0, coreB = 0, coreC = 0;
let flagRegressed = 0, flagWho = [], flagB = 0, flagC = 0;
const repro = 'shoulder/protect|commercial|support_prevention|intermediate|1013';

for (const c of cells){
  const b = scan(BASE, c), a = scan(CAND, c);
  coreB += b.coreSecs; coreC += a.coreSecs;
  secB  += b.trunkSecs; secC += a.trunkSecs;
  thinB += b.thinTrunk; thinC += a.thinTrunk;
  zero  += a.zeroTrunkDays; if (!zeroWho && a.zeroWho) zeroWho = a.zeroWho;
  zeroBase += b.zeroTrunkDays; zRecov += a.zRecov; zTaper += a.zTaper;
  flagB += b.flagSecs; flagC += a.flagSecs;
  if (a.coreSecs < b.coreSecs){ regressed++; if (regressedWho.length < 5) regressedWho.push(`${c.tag} ${b.coreSecs} -> ${a.coreSecs}`); }
  if (a.flagSecs < b.flagSecs){ flagRegressed++; if (flagWho.length < 5) flagWho.push(`${c.tag} ${b.flagSecs} -> ${a.flagSecs}`); }
  for (const k of Object.keys(b.days)){
    const same = b.days[k] === a.days[k];
    const meta = JSON.parse(b.days[k]);
    if (meta.tier){ lrDays++; if (!same){ lrDiff++; if (!lrWho) lrWho = `${c.tag} ${k} tier ${meta.tier}`; } }
    else if (meta.inWin){ rwDays++; if (!same){ rwDiff++; if (!rwWho) rwWho = `${c.tag} ${k}`; } }
    else if (!same) otherDiffDays++;
  }
  if (c.key === repro) console.log(`  REPRO ${repro}: core sections (s.core + Trunk) ${b.coreSecs} -> ${a.coreSecs} ; s.core finishers only ${b.flagSecs} -> ${a.flagSecs}`);
}

console.log(`B1b  cells with a core-section regression (s.core + Trunk): ${regressed}/${cells.length}` + (regressedWho.length ? '  e.g. ' + regressedWho.join(' ; ') : ''));
console.log(`B1b' cells with an s.core FINISHER regression: ${flagRegressed}/${cells.length}` + (flagWho.length ? '  e.g. ' + flagWho.join(' ; ') : '') + `   totals base ${flagB} cand ${flagC}`);
console.log(`Z    days claiming trunk that print zero Trunk items (outside long-run tiers, the race window, recovery and taper weeks): base ${zeroBase} -> cand ${zero}` + (zeroWho ? '  first ' + zeroWho : ''));
console.log(`Z*   same, inside the separately ruled weeks: recovery ${zRecov} (recoveryDeload), taper ${zTaper} (taper strips to the primer)`);
console.log(`LR   long-run tier days ${lrDays}, changed vs baseline ${lrDiff}` + (lrWho ? '  first ' + lrWho : ''));
console.log(`RW   race-window days   ${rwDays}, changed vs baseline ${rwDiff}` + (rwWho ? '  first ' + rwWho : ''));
console.log(`OTH  other days changed vs baseline: ${otherDiffDays}`);
console.log(`SEC  Trunk sections printed  base ${secB}  cand ${secC}   (delta ${secC - secB})`);
console.log(`CORE core sections printed   base ${coreB}  cand ${coreC}  (delta ${coreC - coreB})`);
console.log(`THIN one-item Trunk sections base ${thinB}/${secB} (${secB ? (100*thinB/secB).toFixed(2) : '0'}%)  cand ${thinC}/${secC} (${secC ? (100*thinC/secC).toFixed(2) : '0'}%)  [D51, report only]`);
