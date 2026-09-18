// v198_g197_split — BEFORE-PICTURE for the ruled split of tests/gates/g197_leg_accessory.js.
// Read-only. Instruments a COPY of the gate in the scratch dir; the gate itself is untouched.
//
// What it measures, and where the expected values come from:
//   - wall time per labelled section: process.hrtime marks injected at the five section
//     banners the gate prints itself (A/B/C/D/E). The clock is the oracle, not the gate.
//   - buildProgram calls per section: counted by wrapping buildProgram on EVERY IA instance
//     the gate loads (candidate, D84 comparison artifact, baseline). Attribution is by the
//     mark that was current at call time, plus which artifact the call went to — so a build
//     shared across sections is visible as a build charged to one section and read by another.
//   - harness load() cost: counted and timed separately, because a per-file split pays it once
//     per new file and that is the irreducible floor.
//   - the runtime assertion roster: captured by wrapping the gate's own ok(), in emission order.
//
// Usage: node tests/measure/v198_g197_split.js [candidate.html] [baseline.html]
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT  = path.join(__dirname, '..', '..');
const GATE  = path.join(ROOT, 'tests', 'gates', 'g197_leg_accessory.js');
const CAND  = process.argv[2] || path.join(ROOT, 'index.html');
const BASE  = process.argv[3] || null;
const OUTDIR= process.env.V198_OUT || os.tmpdir();

let src = fs.readFileSync(GATE, 'utf8');
const HARNESS = path.join(ROOT, 'tests', 'harness.js');
const GATEDIR = path.join(ROOT, 'tests', 'gates');

function must(needle, repl){
  const n = src.split(needle).length - 1;
  if (n !== 1) { console.error('ANCHOR count=' + n + ' for: ' + needle.slice(0,70)); process.exit(3); }
  src = src.replace(needle, repl);
}

// 1. swap the harness require for an instrumented shim
must("const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));",
`const __H = require(${JSON.stringify(HARNESS)});
const __M = { marks: [], builds: {}, loads: [], names: [], cur: 'PRE' };
global.__M = __M;
const __now = () => Number(process.hrtime.bigint()) / 1e6;
function __mark(s){ __M.marks.push([s, __now()]); __M.cur = s; }
global.__mark = __mark;
function __wrap(ia, tag){
  const bp = ia.buildProgram;
  ia.buildProgram = function(){ const k = __M.cur + ' :: ' + tag; __M.builds[k] = (__M.builds[k]||0)+1; return bp.apply(this, arguments); };
  return ia;
}
const load = function(f){ const t0 = __now(); const ia = __H.load(f); const dt = __now()-t0;
  const tag = f === ${JSON.stringify(CAND)} ? 'CAND' : (/g197_d84_cmp/.test(f) ? 'CMP' : 'BASE');
  __M.loads.push({ tag: tag, sec: __M.cur, ms: +dt.toFixed(1) }); return __wrap(ia, tag); };
const fixtures = __H.fixtures, progDigest = __H.progDigest;
__mark('0_PREAMBLE');`);

// 2. record every ok() name, in order, with the section that was current
must("function ok(name, cond, detail) {\n  if (cond)",
     "function ok(name, cond, detail) {\n  __M.names.push({ sec: __M.cur, name: name, ok: !!cond });\n  if (cond)");

// 3. section marks, anchored on the gate's own banners
const MARKS = [
  ["console.log('\\n-- A. the pool", "A_STATIC"],
  ["console.log('\\n-- B. full lattice sweep --');", "B_SWEEP"],
  ["console.log('\\n-- B4. denial census", "B4_CENSUS_ASSERTS"],
  ["console.log('\\n-- C. render surfaces", "C_RENDER"],
  ["console.log('\\n-- D. HALF_MANNY --');", "D_FIXTURE"],
  ["console.log('\\n-- E. D84: Calves before Leg isolation --');", "E_STATIC"],
  ["  const cmpPath = path.join(os.tmpdir()", "E_CMP_SWEEP"],
  ["  console.log('   swept ' + E_L.length", "E_POST_CMP"],
  ["  let bFell = 0, bRose = 0, bCells = 0; const bEg = [];", "E_BASELINE_SWEEP"],
  ["{\n  const moved = Object.keys(eLabelDelta)", "E_TAIL_ASSERTS"],
];
MARKS.forEach(([a, tag]) => must(a, "__mark('" + tag + "'); " + a));

// 4. dump on exit
must("console.log('\\nPASS ' + pass + ' FAIL ' + fail);",
`__mark('9_END');
{ const o = { marks: __M.marks, builds: __M.builds, loads: __M.loads, names: __M.names, pass: pass, fail: fail };
  fs.writeFileSync(process.env.V198_DUMP, JSON.stringify(o, null, 1)); }
console.log('\\nPASS ' + pass + ' FAIL ' + fail);`);

// __dirname inside the copy must still resolve to tests/gates
src = src.split('__dirname').join(JSON.stringify(GATEDIR));

const COPY = path.join(OUTDIR, 'v198_g197_instrumented.js');
const DUMP = path.join(OUTDIR, 'v198_g197_dump.json');
try { fs.unlinkSync(DUMP); } catch(e) {}
fs.writeFileSync(COPY, src);

const { spawnSync } = require('child_process');
const args = [COPY, CAND]; if (BASE) args.push(BASE);
const t0 = Date.now();
const r = spawnSync('node', args, { env: Object.assign({}, process.env, { V198_DUMP: DUMP }), encoding: 'utf8', maxBuffer: 1 << 28 });
const wall = (Date.now() - t0) / 1000;
fs.writeFileSync(path.join(OUTDIR, 'v198_g197_stdout.txt'), r.stdout || '');
if (!fs.existsSync(DUMP)) { console.log('MEASUREMENT FAILED: no dump. exit=' + r.status + '\n' + (r.stderr||'').slice(0,4000)); process.exit(2); }
const D = JSON.parse(fs.readFileSync(DUMP, 'utf8'));

console.log('=== v198 g197 split before-picture ===');
console.log('candidate ' + path.basename(CAND) + (BASE ? '   baseline ' + path.basename(BASE) : '   (no baseline argv[3])'));
console.log('instrumented copy: ' + COPY);
console.log('gate exit=' + r.status + '  PASS ' + D.pass + ' FAIL ' + D.fail + '  wall(instrumented) ' + wall.toFixed(1) + 's');

// ---- per-section wall time
console.log('\n-- wall time per section (marks are the gate\'s own banners) --');
const M = D.marks, total = M[M.length-1][1] - M[0][1];
let rows = [];
for (let i = 0; i < M.length - 1; i++) rows.push({ sec: M[i][0], ms: M[i+1][1] - M[i][1] });
rows.forEach(x => console.log('   ' + x.sec.padEnd(20) + (x.ms/1000).toFixed(2).padStart(8) + 's   ' + (100*x.ms/total).toFixed(1).padStart(5) + '%'));
console.log('   ' + 'TOTAL(in-proc)'.padEnd(20) + (total/1000).toFixed(2).padStart(8) + 's');

// ---- buildProgram calls
console.log('\n-- buildProgram calls, by section :: artifact --');
let tb = 0; Object.keys(D.builds).sort().forEach(k => { tb += D.builds[k]; console.log('   ' + k.padEnd(40) + String(D.builds[k]).padStart(7)); });
console.log('   TOTAL'.padEnd(43) + String(tb).padStart(7));
console.log('\n-- harness load() calls (the per-file floor a split pays N times) --');
D.loads.forEach(l => console.log('   ' + l.tag.padEnd(6) + ' during ' + l.sec.padEnd(18) + l.ms.toFixed(1).padStart(8) + ' ms'));

// ---- assertions
console.log('\n-- assertions --');
const bySec = {}; D.names.forEach(n => bySec[n.sec] = (bySec[n.sec]||0)+1);
Object.keys(bySec).forEach(s => console.log('   ' + s.padEnd(20) + String(bySec[s]).padStart(5)));
console.log('   TOTAL'.padEnd(23) + String(D.names.length).padStart(5));
const seen = {}, dupes = {};
D.names.forEach(n => { seen[n.name] = (seen[n.name]||0)+1; });
Object.keys(seen).forEach(k => { if (seen[k] > 1) dupes[k] = seen[k]; });
console.log('   distinct names ' + Object.keys(seen).length + ' of ' + D.names.length
  + '; non-unique names ' + Object.keys(dupes).length
  + (Object.keys(dupes).length ? ': ' + JSON.stringify(dupes) : ''));
const ROSTER = path.join(__dirname, 'v198_g197_assertion_roster' + (BASE ? '_withbase' : '') + '.txt');
fs.writeFileSync(ROSTER, D.names.map((n,i) => String(i+1).padStart(3,'0') + '\t' + n.sec + '\t' + n.name).join('\n') + '\n');
console.log('   roster written: ' + ROSTER);
