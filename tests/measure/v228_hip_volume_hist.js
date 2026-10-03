const path='/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js';
const { load, DAYS } = require(path);
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const C1 = /hip thrust|glute bridge|frog pump|pull-?through/i;
const base = { primaryPath:'event', cardioTypes:['run'], eventTargeted:true, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185 };
const PRT = Object.assign({}, base, { name:'PRT TING', liftingFocus:'support_athletic', raceDate:'2026-10-20', seed:87747, cardioGoals:{ run:{ id:'run_pace_goal', label:'x', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30' } } });
const MANNY = Object.assign({}, base, { name:'M', liftingFocus:'support_prevention', raceDate:'2026-12-06', seed:76308, cardioGoals:{ run:{ id:'run_half', label:'Half Marathon', mileBestMins:'8', mileBestSecs:'0', baselineDist:'5', baseline:'5mi' } } });
for(const f of process.argv.slice(2)){
  let out = f.split('/').pop() + ': ';
  try { const IA = load(f); out += 'v' + IA.version + ' ';
    for(const [t, c] of [['PRT', PRT], ['MANNY', MANNY]]){
      try { const p = IA.buildProgram(JSON.parse(JSON.stringify(c))); const hits = [];
        Object.keys(p.weeks).forEach(w => DAYS.forEach(d => { const day = p.weeks[w][d]; (day && !day.rest && day.sections || []).forEach(s => (s.items||[]).forEach(it => { const n = clean(it.name); if(C1.test(n)) hits.push('W' + w + ' ' + d + ' ' + n); })); }));
        out += '| ' + t + ' C1 ' + hits.length + (hits.length ? ' [' + hits.join('; ') + ']' : '') + ' ';
      } catch(e){ out += '| ' + t + ' CRASH ' + e.message.slice(0, 80) + ' '; }
    }
  } catch(e){ out += 'LOAD CRASH ' + e.message.slice(0, 100); }
  console.log(out);
}
