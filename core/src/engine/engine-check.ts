import { ENGINE_CHECK_LATTICE_DIGESTS, ENGINE_CHECK_MANNY_DIGEST } from './engine-check-digests.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── The engine check (D286 P-ENGINECHECK, docs/decisions/engine-check.md; MIGRATION.md phase 1 step 2). ──
// Builds the programs CI pins (HALF_MANNY, then the 864 lattice configs) with the engine as shipped, on the device
// itself, and counts how many digests equal the pinned ones. The engine is handed in (build), so the page runs it on
// JavaScriptCore today and the React Native app on Hermes later, with the same cases and the same lines. It reads and
// writes no stored key: the result lives in the run object only. The pinned digests are engine-check-digests.ts,
// written from the golden files by tools/engine-check-digests.mjs; tests/unit/engine-check.test.ts keeps them equal.
import type { Program } from '../domain/index.ts';
import type { EngineCfg } from './cardio-progression.ts';

// ── SHA-256 (FIPS 180-4) over a string's UTF-8 bytes, as lowercase hex. Plain code: a web view on the app's own
// scheme may have no crypto.subtle, and Hermes has none. ──
const SHA256_K=[
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
];
function utf8Bytes(s: string): number[]{
  const out: number[]=[];
  for(let i=0;i<s.length;i++){
    let c=s.charCodeAt(i);
    if(c>=0xd800&&c<0xdc00&&i+1<s.length){
      const d=s.charCodeAt(i+1);
      if(d>=0xdc00&&d<0xe000){c=0x10000+((c-0xd800)<<10)+(d-0xdc00);i++;}
    }
    if(c>=0xd800&&c<0xe000) c=0xfffd;   // a lone surrogate encodes as U+FFFD, as Node's UTF-8 does
    if(c<0x80) out.push(c);
    else if(c<0x800) out.push(0xc0|(c>>6),0x80|(c&63));
    else if(c<0x10000) out.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));
    else out.push(0xf0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));
  }
  return out;
}
function sha256Hex(text: string): string{
  const bytes=utf8Bytes(text);
  const bitLen=bytes.length*8;
  bytes.push(0x80);
  while(bytes.length%64!==56) bytes.push(0);
  const hi=Math.floor(bitLen/0x100000000),lo=bitLen>>>0;
  bytes.push((hi>>>24)&255,(hi>>>16)&255,(hi>>>8)&255,hi&255,(lo>>>24)&255,(lo>>>16)&255,(lo>>>8)&255,lo&255);
  const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const w=new Array<number>(64);
  for(let off=0;off<bytes.length;off+=64){
    for(let t=0;t<16;t++){
      const j=off+t*4;
      w[t]=((bytes[j]!<<24)|(bytes[j+1]!<<16)|(bytes[j+2]!<<8)|bytes[j+3]!)>>>0;
    }
    for(let t=16;t<64;t++){
      const a=w[t-15]!,b=w[t-2]!;
      const s0=((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3);
      const s1=((b>>>17)|(b<<15))^((b>>>19)|(b<<13))^(b>>>10);
      w[t]=(w[t-16]!+s0+w[t-7]!+s1)>>>0;
    }
    let a=h[0]!,b=h[1]!,c=h[2]!,d=h[3]!,e=h[4]!,f=h[5]!,g=h[6]!,k=h[7]!;
    for(let t=0;t<64;t++){
      const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));
      const ch=(e&f)^(~e&g);
      const t1=(k+S1+ch+SHA256_K[t]!+w[t]!)>>>0;
      const S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));
      const maj=(a&b)^(a&c)^(b&c);
      const t2=(S0+maj)>>>0;
      k=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    h[0]=(h[0]!+a)>>>0;h[1]=(h[1]!+b)>>>0;h[2]=(h[2]!+c)>>>0;h[3]=(h[3]!+d)>>>0;
    h[4]=(h[4]!+e)>>>0;h[5]=(h[5]!+f)>>>0;h[6]=(h[6]!+g)>>>0;h[7]=(h[7]!+k)>>>0;
  }
  return h.map(x=>('00000000'+x.toString(16)).slice(-8)).join('');
}

// The tests' progDigest (tests/harness.js): the program without its clock fields and its swap universe, as JSON,
// SHA-256, the first 16 hex characters.
function engineCheckDigest(prog: Program): string{
  const clone: unknown=JSON.parse(JSON.stringify(prog,(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v));
  return sha256Hex(JSON.stringify(clone)).slice(0,16);
}

// HALF_MANNY as the tests pin it (tests/harness.js fixtures.HALF_MANNY), typed again: the check may not read the tests.
function engineCheckBase(): EngineCfg{
  return {
    name:'THE HALF MANNY',primaryPath:'event',cardioTypes:['run'],
    cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},
    eventTargeted:true,raceDate:'2026-12-06',
    liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',equipment:'crossfit',unit:'lbs',
    restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135,squat:155,deadlift:185,seed:76308,
  } as EngineCfg;
}

// The 864 config lattice (tests/lattice193.js FULL), typed again in its order: injury, equipment, focus, level, seed.
const ENGINE_CHECK_INJURIES: {tag:string;injury:{region:string;tier:string}|null}[]=[
  {tag:'healthy',injury:null},
  {tag:'shoulder/protect',injury:{region:'shoulder',tier:'protect'}},
  {tag:'lowback/protect',injury:{region:'lowback',tier:'protect'}},
  {tag:'elbow/protect',injury:{region:'elbow',tier:'protect'}},
  {tag:'knee/protect',injury:{region:'knee',tier:'protect'}},
  {tag:'hip/workaround',injury:{region:'hip',tier:'workaround'}},
  {tag:'ankle/workaround',injury:{region:'ankle',tier:'workaround'}},
  {tag:'lowback/workaround',injury:{region:'lowback',tier:'workaround'}},
];
const ENGINE_CHECK_EQUIPMENT=['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const ENGINE_CHECK_FOCUSES=['support_prevention','hypertrophy'];
const ENGINE_CHECK_LEVELS=['beginner','intermediate','advanced'];
const ENGINE_CHECK_SEEDS=[1013,3039,76308];

export interface EngineCheckCase {tag:string;cfg:EngineCfg;digest:string;manny:boolean}
/** HALF_MANNY first, then the lattice in its order, each with the digest CI pins for it. */
function engineCheckCases(): EngineCheckCase[]{
  const cases: EngineCheckCase[]=[{tag:'Half Manny',cfg:engineCheckBase(),digest:ENGINE_CHECK_MANNY_DIGEST,manny:true}];
  let n=0;
  for(const inj of ENGINE_CHECK_INJURIES) for(const equipment of ENGINE_CHECK_EQUIPMENT) for(const liftingFocus of ENGINE_CHECK_FOCUSES)
  for(const experience of ENGINE_CHECK_LEVELS) for(const seed of ENGINE_CHECK_SEEDS){
    const over={equipment,seed,liftingFocus,experience,injury:inj.injury};
    cases.push({
      tag:inj.tag+' '+equipment+' '+liftingFocus+' '+experience+' seed='+seed,
      cfg:{...engineCheckBase(),...over} as EngineCfg,
      digest:ENGINE_CHECK_LATTICE_DIGESTS[n]??'',
      manny:false,
    });
    n++;
  }
  return cases;
}

/** One check in flight or done: where it stands and what it found. */
export interface EngineCheckRun {
  cases:EngineCheckCase[];next:number;latticeTotal:number;latticeMatched:number;mannyMatched:boolean|null;
  firstMiss:string|null;startedAt:number;endedAt:number|null;
}
function engineCheckBegin(cases: EngineCheckCase[],now: number): EngineCheckRun{
  return {cases,next:0,latticeTotal:cases.filter(c=>!c.manny).length,latticeMatched:0,mannyMatched:null,firstMiss:null,startedAt:now,endedAt:null};
}

const ENGINE_CHECK_SLICE_MS=40;
/** Builds cases until budgetMs have passed (at least one), then stops so the screen can draw. True once all are built. */
function engineCheckSlice(run: EngineCheckRun,build: (cfg: EngineCfg)=>Program,now: ()=>number,budgetMs: number=ENGINE_CHECK_SLICE_MS): boolean{
  const from=now();
  while(run.next<run.cases.length){
    const c=run.cases[run.next]!;
    let got: string|null=null;
    try{got=engineCheckDigest(build(c.cfg));}catch{got=null;}
    const ok=got!==null&&got===c.digest;
    if(c.manny) run.mannyMatched=ok;
    else if(ok) run.latticeMatched++;
    if(!ok&&run.firstMiss===null) run.firstMiss=c.tag;
    run.next++;
    if(now()-from>=budgetMs) break;
  }
  if(run.next>=run.cases.length&&run.endedAt===null) run.endedAt=now();
  return run.endedAt!==null;
}

/** The line under the button: the progress while it runs, then the counts, the first miss and the time. */
function engineCheckLine(run: EngineCheckRun): string{
  if(run.endedAt===null) return 'Built '+run.next+' of '+run.cases.length+'.';
  const parts=['Lattice '+run.latticeMatched+' of '+run.latticeTotal+' match.'];
  if(run.mannyMatched!==null) parts.push(run.mannyMatched?'Half Manny matches.':'Half Manny does not match.');
  if(run.firstMiss!==null) parts.push('First miss: '+run.firstMiss+'.');
  parts.push('Took '+Math.round((run.endedAt-run.startedAt)/1000)+' s.');
  return parts.join(' ');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  engineCheckBase, engineCheckBegin, engineCheckCases, engineCheckDigest, engineCheckLine, engineCheckSlice, sha256Hex,
};
