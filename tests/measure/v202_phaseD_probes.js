// V202 PHASE D probes — (1) injury shift x note class, (2) HALF_MANNY era table.
'use strict';
const path = require('path'), crypto = require('crypto');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const IB = H.load('/tmp/base_V201.html'), IC = H.load(path.join(ROOT,'index.html'));
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const APPENDIX = ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';
const GOALMET = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';

const PG = [
  ['fast_1.5mi', {targetDist:'1.5',targetMins:'9', targetSecs:'0',paceUnit:'mi'}, {mileBestMins:'11',mileBestSecs:'30'}],
  ['fast_1mi',   {targetDist:'1',  targetMins:'6', targetSecs:'0',paceUnit:'mi'}, {mileBestMins:'9', mileBestSecs:'0'}],
  ['met_3mi',    {targetDist:'3',  targetMins:'30',targetSecs:'0',paceUnit:'mi'}, {mileBestMins:'7', mileBestSecs:'30'}],
  ['met_2km',    {targetDist:'2',  targetMins:'16',targetSecs:'0',paceUnit:'km'}, {mileBestMins:'8', mileBestSecs:'0'}],
  ['mild_2mi',   {targetDist:'2',  targetMins:'16',targetSecs:'0',paceUnit:'mi'}, {mileBestMins:'8', mileBestSecs:'30'}],
];
const SHIFTS = [ null,
  {2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1,11:1,12:1},
  {3:2,4:2,5:2,6:2,7:2,8:2,9:2,10:2,11:2,12:2},
  {4:3,5:3,6:3,7:3,8:3,9:3,10:3,11:3,12:3} ];
const rows = [];
let ci = 0;
for (const [tg, g, anc] of PG) for (const exp of ['beginner','intermediate','advanced'])
  for (const age of ['18-35','36-54','55+']) for (let si = 0; si < SHIFTS.length; si++) {
    const cfg = { name:'PROBE', primaryPath:'event', cardioTypes:['run'],
      cardioGoals:{ run: Object.assign({id:'run_pace_goal', label:'Hit a Pace / Time Goal', baselineDist:'3', baseline:'3mi'}, g, anc) },
      eventTargeted:true, raceDate:['2026-10-19','2026-12-06','2027-01-25'][ci%3],
      liftingFocus:'support_prevention', experience:exp, ageBracket:age, equipment:'full_gym',
      unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(), bench:185, squat:245, deadlift:315,
      seed:[24865,76308,11111][ci%3] };
    if (SHIFTS[si]) cfg._paceShift = SHIFTS[si];
    rows.push({tag:tg+'|'+exp+'|'+age+'|sh'+si, cfg, shiftMap:SHIFTS[si]});
    ci++;
  }

const tally = {};   // class -> {shift_app, shift_noapp, nosh_app, nosh_noapp}
const bump = (cls, shifted, hasApp) => {
  tally[cls] = tally[cls] || {shift_app:0, shift_noapp:0, nosh_app:0, nosh_noapp:0};
  tally[cls][(shifted?'shift_':'nosh_') + (hasApp?'app':'noapp')]++;
};
let intCells = 0;
for (const r of rows) {
  const prog = IC.buildProgram(JSON.parse(JSON.stringify(r.cfg)));
  Object.keys(prog.weeks).forEach(w => DAYS.forEach(d => {
    const day = prog.weeks[w][d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if (!/^Interval \(INT\)/.test(c.subtype||'')) return;
      intCells++;
      const note = c.note || '';
      const hasApp = note.endsWith(APPENDIX);
      const body = hasApp ? note.slice(0, -APPENDIX.length) : note;
      const cls = /^CUTBACK WEEK:/.test(body) ? 'cutback'
                : body === GOALMET ? 'goal-met'
                : /^INT — Interval: Pace moves/.test(body) ? 'dampened'
                : /^INT — Interval: Zone 5/.test(body) ? 'undampened'
                : 'OTHER:' + body.slice(0,40);
      const shifted = !!(r.shiftMap && (r.shiftMap[+w] || 0) > 0);
      bump(cls, shifted, hasApp);
    });
  }));
}
console.log('PROBE 1 — injury shift x INT note class  (' + rows.length + ' cfgs, ' + intCells + ' INT cells)');
console.log('  class        shift>0:appendix  shift>0:NO-appendix   shift=0:appendix  shift=0:NO-appendix');
let p1fail = 0;
Object.keys(tally).sort().forEach(c => {
  const t = tally[c];
  console.log('  ' + c.padEnd(12) + String(t.shift_app).padStart(12) + String(t.shift_noapp).padStart(20) + String(t.nosh_app).padStart(20) + String(t.nosh_noapp).padStart(20));
  p1fail += t.shift_noapp + t.nosh_app;
});
console.log('  VIOLATIONS (shift>0 missing appendix, or shift=0 carrying it): ' + p1fail);

// PROBE 2 — HALF_MANNY digest + era table provenance
const db = H.progDigest(IB.buildProgram(IB.fixtures.HALF_MANNY));
const dc = H.progDigest(IC.buildProgram(IC.fixtures.HALF_MANNY));
const row = H.MANNY_DIGEST_BY_VERSION;
const src = require('fs').readFileSync(path.join(ROOT,'tests','harness.js'),'utf8');
const isRef = /MANNY_DIGEST_BY_VERSION\[202\]\s*=\s*MANNY_DIGEST_BY_VERSION\[201\]\s*;/.test(src);
const litRow = /^\s*202:\s*'/m.test(src);
console.log('\nPROBE 2 — HALF_MANNY');
console.log('  V201 digest ' + db + '   V202 digest ' + dc + '   equal=' + (db===dc));
console.log('  MANNY_DIGEST_BY_VERSION[202] = ' + row[202] + '  [201] = ' + row[201] + '  [200] = ' + row[200]);
console.log('  matches d4364dd3fa63a3a1 on both: ' + (db==='d4364dd3fa63a3a1' && dc==='d4364dd3fa63a3a1'));
console.log('  digest === table row: ' + (dc === row[202]));
console.log('  [202] written as a REFERENCE to [201]: ' + isRef + '   (literal 202: row present: ' + litRow + ')');
console.log('  deload-off [202] reference: ' + /MANNY_DELOAD_OFF_DIGEST_BY_VERSION\[202\]\s*=\s*MANNY_DELOAD_OFF_DIGEST_BY_VERSION\[201\]\s*;/.test(src));
