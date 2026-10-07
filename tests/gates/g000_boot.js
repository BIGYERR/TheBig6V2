// Gate G000 — boot & structure. The template every gate follows:
//   - takes candidate html (argv[2]) and optional baseline html (argv[3])
//   - assertions compute expectations INDEPENDENTLY of the engine under test
//     (hand tables, date arithmetic, the doctrine text) — never by calling the
//     candidate's own function and asserting it equals itself
//   - every row prints through tests/status.js (post-V233 V4; CLAUDE.md Proof scope, Row manifest): declared up
//     front, one status line per row, `PASS <id> <name>` or `FAIL <id> <name> — <why>`, never uncaught throws
//   - ALWAYS ends with the line `PASS n FAIL n` (the runner scrapes it; a
//     missing summary is scored as a crash, not a pass)
const path = require('path');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness'));

// ROWS: one id per check, G000-<the check's name>; the W1 sun / wed rest pair is one loop row. No candidate, or a
// candidate that does not boot, prints FAIL for every declared id by name; a row that cannot run because HALF MANNY did
// not build is named by summary() as a dark row. Exit 1 on any FAIL, else 0, as before.
const S = require('../status')('g000_boot');
const ROWS = [
  ['G000-exports-buildProgram', 'exports buildProgram'], ['G000-exports-refreshProgram', 'exports refreshProgram'],
  ['G000-exports-raceAlignment', 'exports raceAlignment'], ['G000-builds-HALF-MANNY', 'builds HALF MANNY'],
  ['G000-half-14-weeks', 'half = 14 weeks'], ['G000-seed-pinned', 'seed pinned'], ['G000-race-W14-SUN', 'race session on W14 SUN'],
  ['G000-W1-rest', 'W1 sun and wed are rest'], ['G000-self-stable', 'self-stable'] ];
S.declare(ROWS.map(r => r[0]));
const NAME = Object.fromEntries(ROWS);
const failAll = (why, detail) => { for(const [id, l] of ROWS) S.fail(id, l + ' (' + why + ')', detail); S.summary(); };
function check(id, ok, why){ S.check(id, ok, NAME[id], why); }
function tryCheck(id, fn){ try { check(id, fn()); } catch(e){ check(id, false, 'threw ' + e.message); } }

const cand = process.argv[2];
if(!cand){ console.log('usage: node g000_boot.js <candidate.html> [baseline.html]'); failAll('usage', 'no candidate html given'); }

let IA;
try { IA = load(cand); } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }

check('G000-exports-buildProgram', typeof IA.buildProgram === 'function');
check('G000-exports-refreshProgram', typeof IA.refreshProgram === 'function');
check('G000-exports-raceAlignment', typeof IA.raceAlignment === 'function');

let prog;
tryCheck('G000-builds-HALF-MANNY', () => { prog = IA.buildProgram(fixtures.HALF_MANNY); return !!prog && !!prog.weeks; });

if(prog){
  // Independent oracle: Nike's half plan is 14 weeks. That number comes from the
  // doctrine (doctrine/nikerunclubhalfmarathon.txt), not from the engine.
  check('G000-half-14-weeks', Object.keys(prog.weeks).length === 14, 'got ' + Object.keys(prog.weeks).length);
  check('G000-seed-pinned', prog.seed === 76308, 'got ' + prog.seed);
  // Race day pin (V188 D14a): race date 2026-12-06 is a Sunday → race session on W14 SUN.
  const raceDay = prog.weeks['14'] && prog.weeks['14'].sun;
  check('G000-race-W14-SUN', !!(raceDay && raceDay.cardio && /race/i.test(raceDay.cardio.subtype||'')), raceDay ? JSON.stringify(raceDay.cardio && raceDay.cardio.subtype) : 'no sun');
  // Rest days are rest days.
  { const L = S.loop('G000-W1-rest', NAME['G000-W1-rest']);
    ['sun','wed'].forEach(d => L.check(!!(prog.weeks['1'][d] && prog.weeks['1'][d].rest), 'W1 ' + d + ' is rest'));
    L.done(); }
  // Reproducibility (V182 lesson): a seeded build equals itself.
  tryCheck('G000-self-stable', () => progDigest(prog) === progDigest(IA.buildProgram(fixtures.HALF_MANNY)));
}

S.summary();
