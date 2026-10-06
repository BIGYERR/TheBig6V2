// V233 P-BIKEWHEEL — code-side before-picture (measure, Mode B). Read-only.
// Usage: node tests/measure/v233_bikewheel_code.js index.html
// Oracles: reader list from an untruncated source scan (comments stripped); stored-value table and
// expected h:mm:ss faces are hand-computed here from decimal arithmetic, never from _iawParse.
const fs = require('fs'), path = require('path');
const H = require(path.resolve(__dirname, '../harness.js'));
const FILE = process.argv[2] || 'index.html';
const SRC = fs.readFileSync(FILE, 'utf8'), LINES = SRC.split('\n');
const IA = H.load(FILE); const E = IA.eval;
console.log('ia-version', IA.version);
const strip = l => l.replace(/\/\/.*$/, '');
// ── 1. every source line touching bike_mins / log_bike_mins (comments stripped) ──
console.log('\n== 1. READERS/WRITERS of bike_mins (code, comments stripped) ==');
let nb = 0; LINES.forEach((l, i) => { if (/bike_mins/.test(strip(l))) { nb++; console.log('  :' + (i + 1) + '  ' + l.trim().slice(0, 170)); } });
console.log('  total lines', nb);
const emit = LINES.map((l, i) => [i + 1, l]).filter(([, l]) => /id=["']log_bike_mins/.test(strip(l)));
console.log('  emitters of id="log_bike_mins":', emit.length, emit.map(x => ':' + x[0]).join(' '));
const arrs = LINES.map((l, i) => [i + 1, l]).filter(([, l]) => /\[[^\]]*'log_bike_mins'[^\]]*\]\.forEach/.test(strip(l)));
console.log('  listener arrays carrying log_bike_mins:', arrs.length, arrs.map(x => ':' + x[0]).join(' '));
// derived line / as-planned
const fnBody = name => { const m = SRC.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n}\\n')); return m ? m[0].replace(/\/\/[^\n]*/g, '') : ''; };
const cf = fnBody('cardioFieldHTML'); const bikeBranch = (cf.match(/if\(sport==='bike'\)[^\n]*\n[^\n]*/) || [''])[0];
console.log('  bike branch of cardioFieldHTML carries doseDerived:', /doseDerived/.test(bikeBranch), '| "as planned" text:', /as planned|planned/i.test(bikeBranch.replace(/_doseStripHTML/, '')));
console.log('  doseDerived reads bike fields:', /bike/.test(fnBody('doseDerived')), '| updateDoseDerived reads bike:', /bike/.test(fnBody('updateDoseDerived')));
const asPl = LINES.map((l, i) => [i + 1, l]).filter(([, l]) => /as planned|assuming planned|blank *= *as/i.test(strip(l)));
console.log('  lines with as-planned wording (code):', asPl.map(x => ':' + x[0] + ' ' + x[1].trim().slice(0, 90)).join(' | '));
// ── 2. render the bike form for each dose shape ──
console.log('\n== 2. BIKE FORM RENDER ==');
const CF = E('cardioFieldHTML');
const shapes = [['null dose (INT / swapped)', null, 'Intervals'], ['time lsd', { k: 'time', mins: 60 }, 'LSD Ride'], ['time chi 1 rep', { k: 'time', mins: 20 }, 'CHI'], ['reps_time chi', { k: 'reps_time', reps: 3, mins: 10 }, 'CHI'], ['parsed time (Cross-Train)', E(`doseFromCardio({type:'bike',subtype:'Cross-Train',detail:'Easy spin, 40 minutes at 5 to 6 out of 10.'})`), 'Cross-Train']];
for (const [lbl, dose, sub] of shapes) for (const e of [{}, { bike_mins: '45' }]) {
  const h = CF('bike', e, dose, sub).replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/\s+/g, ' ');
  console.log('  [' + lbl + '] dose=' + JSON.stringify(dose) + ' entry=' + JSON.stringify(e) + '\n    ' + h);
}
// ── 5. legacy stored values through the V232 hms parse ──
console.log('\n== 5. hms PARSE on stored bike_mins shapes ==');
// hand oracle: what a + / parseFloat reader means, and the h:mm:ss face that minutes value is.
const hand = { '': null, '0': 0, '45': 45, '45.5': 45.5, '.5': 0.5, '90': 90, '600': 600, '601': 601, '-1': -1, '1e1': 10, '3,5': null, '30': 30 };
const faceOf = m => { const t = Math.round(m * 60); return Math.floor(t / 3600) + ':' + String(Math.floor(t % 3600 / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
let ok = 0, bad = 0;
for (const v of ['', '0', '45', '45.5', '.5', '90', '600', '601', '-1', '1e1', '3,5', 30]) {
  const p = E(`_iawParse('hms', ${JSON.stringify(v)})`);
  const shown = p[0] === '' ? 'dash' : p[0] + ':' + String(p[1]).padStart(2, '0') + ':' + String(p[2]).padStart(2, '0');
  const fmt = p[0] === '' ? '' : E(`_iawFormat('hms', ${JSON.stringify(p)})`);
  const want = hand[String(v)]; const wf = want == null ? 'dash' : (want < 0 ? 'dash(neg)' : faceOf(want));
  const match = shown === wf || (wf === 'dash(neg)' && shown === 'dash');
  match ? ok++ : bad++;
  const valueAttr = E(`(function(e){return ''+(e.bike_mins||'');})(${JSON.stringify({ bike_mins: v })})`);
  console.log('  stored=' + JSON.stringify(v) + ' value-attr-today=' + JSON.stringify(valueAttr) + ' +reads=' + (+v) + ' parse=' + JSON.stringify(p) + ' face=' + shown + ' seedFace->' + JSON.stringify(fmt) + ' hand=' + wf + ' ' + (match ? 'OK' : 'MISMATCH'));
}
console.log('  parse summary: ' + ok + ' match / ' + bad + ' mismatch over 12 values');
// ── 6. is the wheel wiring run-specific? ──
console.log('\n== 6. WHEEL WIRING ==');
for (const fn of ['iaWheelInit', '_iawCommit', '_iawParse', '_iawFormat', 'iaWheelHTML', 'iaWheelFlush', 'persistLogFields', 'updateDoseDerived']) {
  const b = fnBody(fn); console.log('  ' + fn + ' chars=' + b.length + ' mentions log_run=' + (b.match(/log_run_\w+/g) || []).length + ' bike=' + (b.match(/bike/g) || []).length + ' data-plan=' + (b.match(/data-plan/g) || []).length + ' _curLogDose=' + (b.match(/_curLogDose/g) || []).length);
}
console.log('  iaw-solo CSS rules:', (SRC.match(/\.iaw-solo\{[^}]*\}/g) || []).join(' '));
console.log('  wheel call sites (iaWheelHTML(...)):'); LINES.forEach((l, i) => { const m = strip(l).match(/iaWheelHTML\('(\w+)','(\w+)'[^)]*\)/g); if (m) console.log('   :' + (i + 1) + ' ' + m.join(' ')); });
// persist path with a bike dose: does doseDerived write anything off a bike time dose?
const dd = E(`doseDerived({k:'time',mins:60},{mins:'',dist:'',reps:'',rep:''})`), dd2 = E(`doseDerived({k:'reps_time',reps:3,mins:10},{mins:'',dist:'',reps:'',rep:''})`);
console.log('  doseDerived(bike time dose, run fields blank)=' + JSON.stringify(dd) + ' | reps_time=' + JSON.stringify(dd2));
// ── 7. gate/sabotage pins ──
console.log('\n== 7. tests/ pins on the bike form ==');
const walk = d => fs.readdirSync(d).flatMap(f => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? walk(p) : [p]; });
const T = [...walk('tests/gates'), ...walk('tests/sabotage'), 'tests/harness.js', 'tests/gate.sh', 'tests/sabotage.py'];
let np = 0; for (const f of T) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/bike_mins|log_bike|Bike — actual|bike-strip|'bike', *(null|BK)|\['bike'/.test(l)) { np++; console.log('  ' + f + ':' + (i + 1) + ' ' + l.trim().slice(0, 160)); } });
console.log('  pin lines', np, 'over', T.length, 'files');
// rest-day sheet
console.log('\n== REST SHEET ==');
LINES.forEach((l, i) => { if (/rd-input" type="number"[^>]*max="600"/.test(l)) console.log('  :' + (i + 1) + ' rest-sheet TIME input min=1 max=600 inputmode=numeric'); });
console.log('  applyRestCardio bike write: e.bike_mins=(+e.bike_mins||0)+m (number, accumulates; 2 x 600 = ' + (0 + 600 + 600) + ' possible)');
console.log('  completedKey(1,"mon")=' + JSON.stringify(E('completedKey(1,"mon")')) + ' logKey(1,"mon")=' + JSON.stringify(E('logKey(1,"mon")')));
console.log('\nDONE');
