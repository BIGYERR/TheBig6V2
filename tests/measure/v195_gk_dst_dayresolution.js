// GATEKEEPER independent probe: wildcardDayFor arithmetic across DST, edges, wrap.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const IA=load(process.argv[2]);
let P=0,F=0;
const ok=(n,c,d)=>{ if(c){P++;} else {F++;console.log('FAIL '+n+(d!==undefined?'  -> '+d:''));} };
const DK=['mon','tue','wed','thu','fri','sat','sun'];
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const add=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);x.setHours(0,0,0,0);return x;};
const mid=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const monIdx=d=>(d.getDay()+6)%7;
const monOf=d=>add(d,-monIdx(d));
const PID='gkdate';
function mkProg(startIso,tw,rest){
  const weeks={};
  for(let w=1;w<=tw;w++){weeks[w]={};DK.forEach(d=>{weeks[w][d]=rest.includes(d)?{title:'Rest',rest:true}:{title:'Session',sections:[]};});}
  return {id:PID,name:'D',totalWeeks:tw,startDate:startIso,weeks,goal:'balanced',cfg:{seed:1}};
}
function install(prog){
  IA.localStorage.clear();
  IA.eval("activeProgId='"+PID+"'"); IA.eval('activeProg='+JSON.stringify(prog)); IA.eval('currentWeek=1');
}
const call=d=>IA.eval('JSON.stringify(wildcardDayFor(new Date('+d.getFullYear()+','+d.getMonth()+','+d.getDate()+',12,0,0)))');

console.log('# gk_dates on v'+IA.version+' TZ='+(process.env.TZ||'(system)')+' offsetNow='+new Date().getTimezoneOffset());

// Program windows chosen to straddle DST both ways and to start ON a DST boundary.
const CASES=[
  ['spring-forward inside window','2026-02-16',12,'2026-03-08'],
  ['fall-back inside window',     '2026-10-05',12,'2026-11-01'],
  ['EU spring inside window',     '2026-03-09',8, '2026-03-29'],
  ['EU autumn inside window',     '2026-10-05',8, '2026-10-25'],
  ['AU autumn inside window',     '2026-03-16',8, '2026-04-05'],
  ['start ON US spring-forward',  '2026-03-08',10,'2026-03-08'],
  ['start ON US fall-back',       '2026-11-01',10,'2026-11-01'],
  ['start ON EU spring-forward',  '2026-03-29',10,'2026-03-29'],
  ['start mid-week (Thu)',        '2026-04-02',6, null],
  ['start on a Sunday',           '2026-04-05',6, null],
  ['start on a Saturday',         '2026-04-04',6, null],
  ['year boundary',               '2025-12-15',8, null],
  ['leap-ish Feb',                '2028-02-14',6, null],
];
CASES.forEach(([name,start,tw])=>{
  const prog=mkProg(start,tw,['sun']);
  install(prog);
  const SD=new Date(+start.slice(0,4),+start.slice(5,7)-1,+start.slice(8,10));
  const SMON=monOf(SD);
  let bad=[];
  // every day of the whole block + 10 days before + 10 days after
  for(let off=-10; off<tw*7+10; off++){
    const d=add(SMON,off);
    const got=JSON.parse(call(d));
    // HAND EXPECTATION, pure calendar arithmetic, no ms division:
    const w=Math.floor(off/7)+1, dk=DK[((off%7)+7)%7];
    let exp=null;
    if(off>=0 && w>=1 && w<=tw && d>=mid(SD)) exp={week:w,dayKey:dk};
    const g=got?got.week+'/'+got.dayKey:'null', e=exp?exp.week+'/'+exp.dayKey:'null';
    if(g!==e) bad.push(iso(d)+' got '+g+' exp '+e);
    // ROUND TRIP through the app's own forward function
    if(got){
      IA.eval('currentWeek='+got.week);
      const fwd=IA.eval("(function(){var x=dayDateFor("+got.week+",'"+got.dayKey+"');return x?x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2):null;})()");
      if(fwd!==iso(d)) bad.push('roundtrip '+iso(d)+' -> '+got.week+'/'+got.dayKey+' -> '+fwd);
    }
  }
  ok('dates ['+name+' start '+start+']', bad.length===0, bad.slice(0,6).join(' | ')+(bad.length>6?' ...+'+(bad.length-6):''));
});

// Sunday wrap (index 6) explicitly
{
  const prog=mkProg('2026-04-06',4,['wed']); install(prog);   // Mon start
  const sun=new Date(2026,3,12);   // first Sunday
  const got=JSON.parse(call(sun));
  ok('sunday wrap: index 6 resolves to sun of week 1', !!got&&got.week===1&&got.dayKey==='sun', JSON.stringify(got));
}
// rest-day Wildcard still resolves (scheduledDays would have dropped it)
{
  const prog=mkProg('2026-04-06',4,['wed','sun']); install(prog);
  const wed=new Date(2026,3,8);
  const got=JSON.parse(call(wed));
  ok('rest day resolves (scheduledDays would drop it)', !!got&&got.week===1&&got.dayKey==='wed', JSON.stringify(got));
  const sched=IA.eval("JSON.stringify(scheduledDays(new Date(2026,3,30)).filter(function(x){return x.d==='wed';}))");
  ok('confirm scheduledDays really drops rest days (builder reasoning holds)', sched==='[]', sched);
}
// day before start / day after final week / first + last day
{
  const prog=mkProg('2026-04-08',4,['sun']); install(prog);   // Wed start, week 1 is short
  ok('day before start -> null', call(new Date(2026,3,7))==='null', call(new Date(2026,3,7)));
  ok('mon of week 1 (before start) -> null', call(new Date(2026,3,6))==='null', call(new Date(2026,3,6)));
  ok('first day of program (the start itself) resolves', JSON.parse(call(new Date(2026,3,8))||'null')?.dayKey==='wed', call(new Date(2026,3,8)));
  const lastDay=new Date(2026,3,6+27);  // Monday of wk1 + 27 = sun of wk4
  ok('last day of the block resolves', (JSON.parse(call(lastDay))||{}).week===4, call(lastDay));
  ok('day after the final week -> null', call(new Date(2026,3,6+28))==='null', call(new Date(2026,3,6+28)));
}
// missing day object / missing weeks / no startDate
{
  const prog=mkProg('2026-04-06',4,['sun']); delete prog.weeks[2].thu; install(prog);
  ok('missing day object -> null', call(new Date(2026,3,16))==='null', call(new Date(2026,3,16)));
  const p2=mkProg('2026-04-06',4,['sun']); delete p2.startDate; install(p2);
  ok('no startDate -> null', call(new Date(2026,3,8))==='null', call(new Date(2026,3,8)));
  IA.eval('activeProg=null');
  ok('no activeProg -> null', call(new Date(2026,3,8))==='null', call(new Date(2026,3,8)));
}
console.log('PASS '+P+' FAIL '+F);
process.exit(F?1:0);
