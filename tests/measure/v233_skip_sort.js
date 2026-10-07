// tests/measure/v233_skip_sort.js — Post-V233 measure mSK: sort the first Version-scope skip reds.
// usage: node tests/measure/v233_skip_sort.js <candidate index.html> <baseline.html> <scratch dir>
// 1. reruns the two gates whose skip lines are not bare tallies (g205_pace_eve, g212_d110a_swim), serially,
//    and prints every skip-status line rows.js classifies, with its key;
// 2. statically finds every gate whose closing summary prints a skip COUNT ('SKIP ' + <var>), and the key
//    rows.js gives that count line (fallbackKey of the number-normalised label), independent of any run;
// 3. evaluates g205's P4b/P4c guard (ON_SCREEN) on the comment-stripped candidate source by its own regex;
// 4. lists sabotage specs that name each red gate.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const rows = require(path.join(ROOT, 'tests', 'rows.js'));
const [cand, base, scratch] = process.argv.slice(2);
if(!cand || !base || !scratch) { console.log('usage: cand base scratch'); process.exit(2); }
let n = 0; const P = s => { n++; console.log(s); };
// 1
for(const g of ['g205_pace_eve.js', 'g212_d110a_swim.js']){
  const r = cp.spawnSync('node', [path.join(ROOT, 'tests', 'gates', g), cand, base], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const out = (r.stdout || '') + (r.stderr || '');
  fs.writeFileSync(path.join(scratch, 'rerun_' + g + '.out'), out);
  const pr = rows.parseText(out);
  const sk = pr.rows.concat(pr.unkeyed).filter(w => rows.SKIP_STATUS.has(w.status));
  P('RERUN ' + g + ' exit ' + r.status + ' summary ' + ((out.match(/PASS \d+ FAIL \d+/g) || []).pop() || 'NONE') + ' skip-status lines ' + sk.length);
  for(const w of sk) P('  ' + w.key + ' L' + w.line + ' ' + w.status + ' :: ' + w.text.trim());
}
// 2
const GD = path.join(ROOT, 'tests', 'gates');
const tallyRe = /['"`]\\n(SKIP|SCOPED OUT) ['"`]\s*\+\s*\w+|['"`]\\nSCOPED OUT ['"`]\s*\+\s*\w+\s*\+\s*['"`]\s*SKIP/;
const tallies = [];
for(const f of fs.readdirSync(GD).filter(f => /\.js$/.test(f)).sort()){
  const src = fs.readFileSync(path.join(GD, f), 'utf8');
  if(tallyRe.test(src)) tallies.push(f);
}
P('TALLY gates whose summary prints a skip COUNT line: ' + tallies.length + ' of ' + fs.readdirSync(GD).filter(f => /\.js$/.test(f)).length);
P('  ' + tallies.join(' '));
for(const t of ['SKIP 0', 'SKIP 3', 'SCOPED OUT 0  SKIP 0  NOT YET BUILT 0', 'SCOPED OUT 2  SKIP 1  NOT YET BUILT 0']){
  const c = rows.classify(t); const lab = rows.fallbackLabel(c.rest.trim());
  P('  classify(' + JSON.stringify(t) + ') -> status ' + c.status + ' label ' + JSON.stringify(lab) + ' key ' + rows.fallbackKey(lab));
}
// 3
const raw = fs.readFileSync(cand, 'utf8');
const SRC = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
P('GUARD g205 ON_SCREEN (/activeProg\\.legRecoveryNote/ on stripped source) = ' + /activeProg\.legRecoveryNote/.test(SRC) + '; raw-source hits ' + (raw.match(/activeProg\.legRecoveryNote/g) || []).length + '; engine writes legRecoveryNote ' + (SRC.match(/legRecoveryNote/g) || []).length + ' tokens');
// 4
const SD = path.join(ROOT, 'tests', 'sabotage');
const red = ['g205_pace_eve', 'g212_d110a_swim', 'g215_d149_ghd', 'g216_d154_swap_lens', 'g216_d156_longday', 'g217_d160_dedupe_view', 'g218_d157_swim_sizer', 'g219_d167_pairs', 'g221_d177_swapfloor', 'g221_d178_active', 'g221_d179_donenav', 'g221_d180_blockopen', 'g222_d181_durable', 'g232_d199_runwheel', 'g233_d207_bikewheel'];
const specs = fs.readdirSync(SD).filter(f => /\.json$/.test(f)).map(f => [f, fs.readFileSync(path.join(SD, f), 'utf8')]);
for(const g of red){ const hit = specs.filter(([f, s]) => s.includes(g)).map(([f]) => f); P('SABOTAGE ' + g + ': ' + (hit.join(' ') || 'none')); }
const p4 = specs.filter(([f, s]) => /g205_pace_eve/.test(s) || /pace_eve/.test(f)).map(([f, s]) => f + (/P4[bc]/.test(s) ? ' mentions P4b/P4c' : ''));
P('SABOTAGE naming g205_pace_eve or P4b/P4c: ' + (p4.join('; ') || 'none'));
console.log('MEASURE lines ' + n);
