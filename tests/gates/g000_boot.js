// Gate G000 — boot & structure. The template every gate follows:
//   - takes candidate html (argv[2]) and optional baseline html (argv[3])
//   - assertions compute expectations INDEPENDENTLY of the engine under test
//     (hand tables, date arithmetic, the doctrine text) — never by calling the
//     candidate's own function and asserting it equals itself
//   - defects surface as `FAIL <name>: <why>` lines, never uncaught throws
//   - ALWAYS ends with the line `PASS n FAIL n` (the runner scrapes it; a
//     missing summary is scored as a crash, not a pass)
const path = require('path');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness'));

let pass = 0, fail = 0;
function check(name, ok, why){ if(ok){ pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (why ? ': ' + why : '')); } }
function tryCheck(name, fn){ try { check(name, fn()); } catch(e){ check(name, false, 'threw ' + e.message); } }

const cand = process.argv[2];
if(!cand){ console.log('usage: node g000_boot.js <candidate.html> [baseline.html]'); console.log('PASS 0 FAIL 1'); process.exit(1); }

let IA;
try { IA = load(cand); } catch(e){ console.log('FAIL boot: ' + e.message); console.log('PASS 0 FAIL 1'); process.exit(1); }

check('exports buildProgram', typeof IA.buildProgram === 'function');
check('exports refreshProgram', typeof IA.refreshProgram === 'function');
check('exports raceAlignment', typeof IA.raceAlignment === 'function');

let prog;
tryCheck('builds HALF MANNY', () => { prog = IA.buildProgram(fixtures.HALF_MANNY); return !!prog && !!prog.weeks; });

if(prog){
  // Independent oracle: Nike's half plan is 14 weeks. That number comes from the
  // doctrine (doctrine/nikerunclubhalfmarathon.txt), not from the engine.
  check('half = 14 weeks', Object.keys(prog.weeks).length === 14, 'got ' + Object.keys(prog.weeks).length);
  check('seed pinned', prog.seed === 76308, 'got ' + prog.seed);
  // Race day pin (V188 D14a): race date 2026-12-06 is a Sunday → race session on W14 SUN.
  const raceDay = prog.weeks['14'] && prog.weeks['14'].sun;
  check('race session on W14 SUN', !!(raceDay && raceDay.cardio && /race/i.test(raceDay.cardio.subtype||'')), raceDay ? JSON.stringify(raceDay.cardio && raceDay.cardio.subtype) : 'no sun');
  // Rest days are rest days.
  ['sun','wed'].forEach(d => check('W1 ' + d + ' is rest', !!(prog.weeks['1'][d] && prog.weeks['1'][d].rest)));
  // Reproducibility (V182 lesson): a seeded build equals itself.
  tryCheck('self-stable', () => progDigest(prog) === progDigest(IA.buildProgram(fixtures.HALF_MANNY)));
}

console.log(`PASS ${pass} FAIL ${fail}`);
process.exit(fail ? 1 : 0);
