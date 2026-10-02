// V228 measure: g227 c-DIGEST values on the final tree, with an independent oracle.
// Mirrors g227_d190_cuecap.js c-DIGEST exactly: CFGS (MARIO seed 76308 x six workaround regions, HALF_MANNY, mario_noinj),
// fresh page per build, Date pinned to 2026-09-24T12:00 via IA.ctx.Date (after load), progDigest(buildProgram(clone(cfg))).
// Oracle: V227 build output, deep-walked; every `detail` string has the V227 cue literal replaced by the V228 literal
// (the literals are typed here from the ruling, never read off either artifact); hashed with the harness progDigest.
// usage: node tests/measure/v228_cdigest.js <v228 index.html> <base_v227.html>
'use strict';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load, fixtures, progDigest } = H;
const ART = process.argv[2], BASE = process.argv[3];
const OLD = ' — hold RPE 7, two in the tank', NEW = ' — hold RPE 7, three in the tank';
const CLOCK = '2026-09-24';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = r => { const c = clone(MARIO); if(r) c.injury = { region:r, tier:'workaround' }; else delete c.injury; return c; };
const CFGS = { mario:withInj('knee'), ankle_wa:withInj('ankle'), hip_wa:withInj('hip'), lowback_wa:withInj('lowback'), shoulder_wa:withInj('shoulder'),
  elbow_wa:withInj('elbow'), manny:clone(fixtures.HALF_MANNY), mario_noinj:withInj(null) };
const UNINJ = ['manny', 'mario_noinj'];
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
function fresh(f){ const T = load(f); pin(T); return T; }
const build = (f, ck) => fresh(f).buildProgram(clone(CFGS[ck]));
// walk: substitute in detail strings, count every occurrence of either literal anywhere (detail or not)
function walk(o, st){
  if(Array.isArray(o)) return o.map(x => walk(x, st));
  if(o && typeof o === 'object'){ const r = {}; for(const k of Object.keys(o)){ let v = o[k];
    if(typeof v === 'string'){ const no = v.split(OLD).length - 1, nn = v.split(NEW).length - 1;
      if(k === 'detail'){ st.dOld += no; st.dNew += nn; if(no) st.dStr++; v = v.split(OLD).join(NEW); } else { st.xOld += no; st.xNew += nn; } r[k] = v; }
    else r[k] = walk(v, st); } return r; }
  return o;
}
let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + l); };
const v = f => load(f).version;
console.log('candidate ' + ART + ' ia-version ' + v(ART) + ' | baseline ' + BASE + ' ia-version ' + v(BASE));
ok('baseline reads ia-version 227', v(BASE) === '227'); ok('candidate reads ia-version 228', v(ART) === '228');
for(const ck of Object.keys(CFGS)){
  const b1 = build(BASE, ck), b2 = build(BASE, ck), c1 = build(ART, ck), c2 = build(ART, ck);
  const d227 = progDigest(b1), d227b = progDigest(b2), d228 = progDigest(c1), d228b = progDigest(c2);
  ok(ck + ' V227 self-stable ' + d227 + '/' + d227b, d227 === d227b);
  ok(ck + ' V228 self-stable ' + d228 + '/' + d228b, d228 === d228b);
  const st = { dOld:0, dNew:0, dStr:0, xOld:0, xNew:0 }; const orc = progDigest(walk(b1, st));
  const sc = { dOld:0, dNew:0, dStr:0, xOld:0, xNew:0 }; walk(c1, sc);
  console.log('  ' + ck.padEnd(12) + ' V227 ' + d227 + '  V228 ' + d228 + '  ORACLE ' + orc
    + ' | V227 detail strings substituted ' + st.dStr + ' (old ' + st.dOld + ', new ' + st.dNew + ', non-detail old ' + st.xOld + ')'
    + ' | V228 detail old ' + sc.dOld + ' new ' + sc.dNew + ' non-detail new ' + sc.xNew);
  ok(ck + ' V228 == oracle', d228 === orc);
  ok(ck + ' V227 carries no literal outside detail, V228 none old', st.xOld === 0 && sc.dOld === 0 && sc.xOld === 0);
  if(UNINJ.includes(ck)){ ok(ck + ' uninjured: V227 == V228', d227 === d228); ok(ck + ' uninjured: zero substitutions', st.dStr === 0); }
  else ok(ck + ' injured: substitution non-vacuous (>0 detail strings) and V227 != V228', st.dStr > 0 && d227 !== d228);
}
console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0);
