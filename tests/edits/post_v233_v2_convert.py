#!/usr/bin/env python3
# Post-V233 tooling pass, conversion slice V2 (tests only; index.html untouched, ia-version stays 233).
# Ruling: Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 5; CLAUDE.md Proof scope,
# Row manifest and Version scope: "Every new gate, and every gate converted by hand, prints its rows through the
# shared status helper tests/status.js"; "a declared row with no status line is red". Evidence: measure mR
# (tests/measure/v233_rulings/measure_row_status_mR.md): g193_pool_overlay (223 rows) and g205_d129_tiebreak (111)
# print nothing for a passing row; g206_d109_copy (13) and g_fuzz_shard_equiv (13) print rows with no parseable id.
#
# Diff class (V-a): gate printing routed through tests/status.js; every assertion's logic, inputs, expected values
# and oracle unchanged. Each gate: S.declare([...]) up front, one status line per declared id, per-config families
# through S.loop (ONE line), S.summary() in place of the gate's own summary. Old ok()/pass()/fail()/row() helpers
# are deleted where nothing else reads them.
#
# Every anchor is asserted count==1 in the file's state at that step; the first miss aborts the whole script before
# any file is written.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'tests', 'gates')

EDITS = {}

# ---------------------------------------------------------------- g193_pool_overlay ----------------------------
EDITS['g193_pool_overlay.js'] = [
(r'''let PASS = 0, FAIL = 0;
const fail = m => { FAIL++; console.log('FAIL ' + m); };
const pass = m => { PASS++; if (process.env.VERBOSE) console.log('  ok ' + m); };
''',
r'''// ── ROWS (post-V233 V2: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest).
//   D52-chain   the injury pool-override chain is located in the source
//   D52-lens    ASSERTION A, one loop row: every named member of an injury-branch pool survives its own overlay
//   D44-floor   ASSERTION B, one loop row: at every gear tier a pool of two or more leaves two standing
//   D44-thin    ASSERTION B: a pool authored under two members at some tier is listed in the debt census
//   D52-lit, D52-lsit, D52-four, D52-whole, D52-single   ASSERTION C, the D52 literal and its draw site
//   D52-debt    the §12 census, one loop row: every listed debt entry still trips
// VERBOSE=1 prints each passing sub-result as an INFO line (not a row).
const S = require('../status')('g193_pool_overlay');
S.declare(['D52-chain', 'D52-lens', 'D44-floor', 'D44-thin', 'D52-lit', 'D52-lsit', 'D52-four', 'D52-whole',
  'D52-single', 'D52-debt']);
const verbose = m => { if (process.env.VERBOSE) S.info('ok ' + m); };
'''),
(r'''if (START < 0) fail('cannot find the injury pool-override chain (anchor "if(_R===\'knee\'){")');''',
 r'''S.check('D52-chain', START >= 0, 'the injury pool-override chain is located in the source',
  'cannot find the injury pool-override chain (anchor "if(_R===\'knee\'){")');'''),
(r'''const seenA = Object.create(null);
''',
r'''const seenA = Object.create(null);
const LA = S.loop('D52-lens', "Assertion A, same lens: every named member of an injury-branch pool survives that same plan's applyInjuryFilter");
'''),
(r'''    if (survives(nm, a.region, a.tier)){ pass('same-lens ' + k); continue; }''',
 r'''    if (survives(nm, a.region, a.tier)){ LA.pass('same-lens ' + k); verbose('same-lens ' + k); continue; }'''),
(r'''    else fail('same-lens: ' + a.region + '/' + a.tier + ' ' + a.name + " offers '" + nm +
              "' and that same plan's applyInjuryFilter removes it");''',
 r'''    else LA.fail('same-lens: ' + a.region + '/' + a.tier + ' ' + a.name + " offers '" + nm +
                 "' and that same plan's applyInjuryFilter removes it");'''),
(r'''

const thin = Object.create(null);
''',
r'''
LA.done();

const thin = Object.create(null);
const thinBad = [];
const LB = S.loop('D44-floor', "Assertion B, D44's floor: at every gear tier a pool of two or more members leaves two standing after its own overlay");
'''),
(r'''      else fail('thin-pool: ' + a.region + '/' + a.tier + ' ' + a.name + ' on ' + e +
                ' is authored with ' + r.length + ' member(s) and is not in the debt census');''',
 r'''      else thinBad.push('thin-pool: ' + a.region + '/' + a.tier + ' ' + a.name + ' on ' + e +
                ' is authored with ' + r.length + ' member(s) and is not in the debt census');'''),
(r'''    if (alive.length >= 2) pass('floor ' + a.region + '/' + a.tier + ' ' + a.name + ' ' + e);
    else fail('floor: ' + a.region + '/' + a.tier + ' ' + a.name + ' on ' + e + ' holds ' +
              r.length + ' members and the overlay leaves ' + alive.length +
              ' — below D44\'s floor of two [' + r.join(', ') + ']');''',
 r'''    const fk = 'floor ' + a.region + '/' + a.tier + ' ' + a.name + ' ' + e;
    if (alive.length >= 2){ LB.pass(fk); verbose(fk); }
    else LB.fail('floor: ' + a.region + '/' + a.tier + ' ' + a.name + ' on ' + e + ' holds ' +
              r.length + ' members and the overlay leaves ' + alive.length +
              ', below D44\'s floor of two [' + r.join(', ') + ']');'''),
(r'''

// ── ASSERTION C — the D52 literal itself''',
r'''
LB.done();
S.check('D44-thin', thinBad.length === 0,
  'Assertion B: every pool authored under two members at some gear tier is listed in the debt census',
  thinBad.length + ' unlisted: ' + thinBad.slice(0, 3).join('; ') + (thinBad.length > 3 ? '; and ' + (thinBad.length - 3) + ' more' : ''));

// ── ASSERTION C — the D52 literal itself'''),
(r'''if (!lit) fail('D52: the lowback/protect vertical-pull literal is gone or reshaped');
else {
  const members = JSON.parse(lit[1].replace(/'/g, '"'));
  if (members.indexOf('L-sit chinups') < 0) pass('D52 literal does not name L-sit chinups');
  else fail("D52: the lowback/protect vertical-pull literal names 'L-sit chinups', which " +
            'this same overlay nulls in SPINE_SWAP');
  if (members.length >= 4) pass('D52 literal holds ' + members.length + ' members');
  else fail('D52: the lowback/protect vertical-pull literal holds ' + members.length +
            ' members, under the four its derivation gives');
  if (/\.filter\(n=>backCompoundPool\.indexOf\(n\)<0\)/.test(SRC))
    fail('D52: the whole-pool subtraction of backCompoundPool is back; only the DRAWN ' +
         'backMain may be excluded, and it is excluded at the row-slot draw site');
  else pass('D52 no whole-pool backCompoundPool subtraction');
  if (/const _rowSrc0 = \(_inj&&rowPool!==_preInj\.row\)\?\(rowPool\|\|\[\]\)\.filter\(n=>n!==backMain\)/.test(SRC))
    pass('D52 single-name backMain exclusion present at the row-slot draw site');
  else fail('D52: the single-name backMain exclusion at the row-slot draw site is gone');
}''',
r'''// When the literal is gone the four rows under it do not run, as before; summary() names each as a dark row.
S.check('D52-lit', !!lit, 'D52: the lowback/protect vertical-pull literal is present in its ruled shape',
  'the lowback/protect vertical-pull literal is gone or reshaped');
if (lit){
  const members = JSON.parse(lit[1].replace(/'/g, '"'));
  S.check('D52-lsit', members.indexOf('L-sit chinups') < 0, 'D52 literal does not name L-sit chinups',
    "the lowback/protect vertical-pull literal names 'L-sit chinups', which this same overlay nulls in SPINE_SWAP");
  S.check('D52-four', members.length >= 4, 'D52 literal holds ' + members.length + ' members',
    'the lowback/protect vertical-pull literal holds ' + members.length + ' members, under the four its derivation gives');
  S.check('D52-whole', !/\.filter\(n=>backCompoundPool\.indexOf\(n\)<0\)/.test(SRC),
    'D52 no whole-pool backCompoundPool subtraction',
    'the whole-pool subtraction of backCompoundPool is back; only the DRAWN ' +
    'backMain may be excluded, and it is excluded at the row-slot draw site');
  S.check('D52-single', /const _rowSrc0 = \(_inj&&rowPool!==_preInj\.row\)\?\(rowPool\|\|\[\]\)\.filter\(n=>n!==backMain\)/.test(SRC),
    'D52 single-name backMain exclusion present at the row-slot draw site',
    'the single-name backMain exclusion at the row-slot draw site is gone');
}'''),
(r'''for (const d of DEBT){
  if (DEBT_HIT[d]) pass('debt still live: ' + d);
  else fail('stale debt: "' + d + '" is listed in g193_pool_overlay_debt.txt but no longer ' +
            'trips. If it was fixed, delete the line and drop the count in the §12 item.');
}''',
r'''// An empty census has nothing to go stale (as before: no row could fail); it still prints its one status line.
if (!DEBT.length) S.pass('D52-debt', '§12 census: no debt entry is listed for this artifact, so none can go stale');
else {
  const LD = S.loop('D52-debt', '§12 census: every entry listed in g193_pool_overlay_debt.txt still trips');
  for (const d of DEBT){
    if (DEBT_HIT[d]) LD.pass('debt still live: ' + d);
    else LD.fail('stale debt: "' + d + '"', 'listed in g193_pool_overlay_debt.txt but no longer ' +
              'trips. If it was fixed, delete the line and drop the count in the §12 item.');
  }
  LD.done();
}'''),
(r'''console.log('PASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);''',
 r'''S.summary();'''),
]

# ---------------------------------------------------------------- g205_d129_tiebreak ---------------------------
EDITS['g205_d129_tiebreak.js'] = [
(r'''const FILE = process.argv[2] || path.join(ROOT, 'index.html');
''',
r'''const FILE = process.argv[2] || path.join(ROOT, 'index.html');
// ROWS (post-V233 V2: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest). P0 and P0b are
// the licence and the source surgery; P1 is one loop row over the routed pace rows; every other id is one assertion
// below, named for its section. A row that cannot run because P0 or P0b failed is named by summary() as a dark row.
const S = require('../status')('g205_d129_tiebreak');
const ROWS = ['P0', 'P0b', 'P1', 'P1b', 'P2', 'P2c-pop', 'P2c-decl', 'P3', 'P4', 'P5-layout', 'P5-rank', 'P5-free',
  'P6', 'P7-resid', 'P7-hard', 'P7-span', 'P7-r8', 'P7-r9', 'P7-sum', 'P8-layout', 'P8-rest'];
S.declare(ROWS);
'''),
(r'''  if(!HAS_D129){
    console.log('FAIL P0 licence: ia-version ' + VER + ' is D129 era but the tiebreak surface (_evenKey, qualRest, qualFirst) is absent');
    console.log('PASS 0 FAIL 1');
    process.exit(1);
  }
  console.log('P0 licence: ia-version ' + VER + ' carries the D129 tiebreak surface');
} else if(!HAS_D129){
  console.log('SKIP g205_d129_tiebreak: ia-version ' + VER + ' predates D129 (NOT APPLICABLE)');
  console.log('PASS 0 FAIL 0');
  process.exit(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D129 surface present: pre-bump working artifact, rows RUN');
}''',
r'''  if(!HAS_D129){
    S.fail('P0', 'licence: ia-version ' + VER + ' is D129 era', 'the tiebreak surface (_evenKey, qualRest, qualFirst) is absent');
    S.summary();
  }
  S.pass('P0', 'licence: ia-version ' + VER + ' carries the D129 tiebreak surface');
} else if(!HAS_D129){
  for(const id of ROWS) S.skip(id, 'the D129 tiebreak surface (_evenKey, qualRest, qualFirst) is absent: ia-version ' + VER + ' predates D129 (NOT APPLICABLE)');
  S.summary();
} else {
  S.pass('P0', 'licence: ia-version ' + VER + ' with the D129 surface present: pre-bump working artifact, rows RUN');
}'''),
(r'''  console.log('FAIL P0b source surgery: ' + e.message + ' (the chooser cannot be extracted, so no row below can run)');
  console.log('PASS 0 FAIL 1');
  process.exit(1);
}
''',
r'''  S.fail('P0b', 'source surgery', e.message + ' (the chooser cannot be extracted, so no row below can run)');
  S.summary();
}
S.pass('P0b', 'source surgery: the chooser and its session type tables are extracted from the artifact');
'''),
(r'''let PASS=0,FAIL=0;
function ok(c,msg){ if(c) PASS++; else { FAIL++; console.log('  FAIL ' + msg); } }

''', ''),
(r'''let p1bad=0;
PACE_ROWS.forEach(r=>{''',
r'''const L1=S.loop('P1','pace arm lex-optimal under the corrected recBeforeLong, one sub-result per routed pace row');
PACE_ROWS.forEach(r=>{'''),
(r'''  if(!good){ p1bad++; if(p1bad<=5) console.log('  FAIL P1 rest '+r.nm+' cap'+r.cap+' engine '+lay(r.train,pick)+
    ' rank '+(got?got.rank.join(','):'ORPHAN')+' vs best '+best[0].rank.join(',')); }
  ok(good,'');  // counted per row
});''',
r'''  L1.check(good,'rest '+r.nm+' cap'+r.cap, good?'':'engine '+lay(r.train,pick)+
    ' rank '+(got?got.rank.join(','):'ORPHAN')+' vs best '+best[0].rank.join(','));   // one sub-result per row
});
L1.done();'''),
(r'''let p1b=0;
PACE_ROWS.forEach(r=>{''',
r'''let p1b=0; const p1bx=[];
PACE_ROWS.forEach(r=>{'''),
(r'''    if(!got){ p1b++; console.log('  FAIL P1b rest '+r.nm+' cap'+r.cap+' engine layout '+lay(r.train,pick)+' is not in the era type space'); return; }''',
 r'''    if(!got){ p1b++; p1bx.push('rest '+r.nm+' cap'+r.cap+' engine layout '+lay(r.train,pick)+' is not in the era type space'); return; }'''),
(r'''    if(better){ p1b++; console.log('  FAIL P1b rest '+r.nm+' cap'+r.cap+' kept a day-after pad over '+
      better.days.map(d=>d.toUpperCase()+':'+better.typeOf[d]).join(' ')); }''',
 r'''    if(better){ p1b++; p1bx.push('rest '+r.nm+' cap'+r.cap+' kept a day-after pad over '+
      better.days.map(d=>d.toUpperCase()+':'+better.typeOf[d]).join(' ')); }'''),
(r'''ok(p1b===0,'P1b: '+p1b+' rows kept a day-after pad over a true eve');''',
 r'''S.check('P1b',p1b===0,'P1b: no pace layout keeps a day-after pad over a true eve',
  p1b+' rows kept a day-after pad over a true eve; first: '+p1bx.slice(0,3).join(' ; '));'''),
(r'''let nrcRows=0,p2bad=0;''', r'''let nrcRows=0,p2bad=0; const p2x=[];'''),
(r'''      if(!good){ p2bad++; if(p2bad<=5) console.log('  FAIL P2 '+g+' rest '+(rest.join('+')||'none')+' cap'+cap+
        ' rank '+(got?got.ruled.join(','):'ORPHAN')+' vs '+best[0].ruled.join(',')); }''',
 r'''      if(!good){ p2bad++; if(p2x.length<3) p2x.push(g+' rest '+(rest.join('+')||'none')+' cap'+cap+
        ' rank '+(got?got.ruled.join(','):'ORPHAN')+' vs '+best[0].ruled.join(',')); }'''),
(r'''ok(p2bad===0,'P2: '+p2bad+'/'+nrcRows+' NRC rows are not five-term optimal');''',
 r'''S.check('P2',p2bad===0,'P2: every scored NRC row is lex-optimal under the five ruled terms ('+nrcRows+' rows)',
  p2bad+'/'+nrcRows+' NRC rows are not five-term optimal; first: '+p2x.join(' ; '));'''),
(r'''  ok(tieMulti===445 && evenInTie===357,
     'P2c population: '+tieMulti+' multi-subset ties (expected 445), even-spread subset in '+evenInTie+' (expected 357)');
  ok(takesOther===129 && takesEven===228,
     'P2c: the engine declined the even-spread subset on '+takesOther+' rows (expected 129) and took it on '+takesEven+' (expected 228). Zero declines means identity is scored on NRC');''',
 r'''  S.check('P2c-pop',tieMulti===445 && evenInTie===357,
     'P2c population: '+tieMulti+' multi-subset ties (expected 445), even-spread subset in '+evenInTie+' (expected 357)',
     'the population moved off the measure');
  S.check('P2c-decl',takesOther===129 && takesEven===228,
     'P2c: the engine declined the even-spread subset on '+takesOther+' rows (expected 129) and took it on '+takesEven+' (expected 228)',
     'Zero declines means identity is scored on NRC');'''),
(r'''let p3n=0,p3bad=0;''', r'''let p3n=0,p3bad=0; const p3x=[];'''),
(r'''  if(pick.idxs.join(',')!==ev){ p3bad++; console.log('  FAIL P3 rest '+r.nm+' cap'+r.cap+
    ' incumbent '+ev.split(',').map(i=>r.train[+i]).join(',')+' but picked '+pick.idxs.map(i=>r.train[i]).join(',')); }''',
 r'''  if(pick.idxs.join(',')!==ev){ p3bad++; p3x.push('rest '+r.nm+' cap'+r.cap+
    ' incumbent '+ev.split(',').map(i=>r.train[+i]).join(',')+' but picked '+pick.idxs.map(i=>r.train[i]).join(',')); }'''),
(r'''ok(p3bad===0,'P3: '+p3bad+'/'+p3n+' rows moved off the incumbent subset on a tie');''',
 r'''S.check('P3',p3bad===0,'P3 identity: no row moved off the incumbent subset on a tie ('+p3n+' rows)',
  p3bad+'/'+p3n+' rows moved off the incumbent subset on a tie; first: '+p3x.slice(0,3).join(' ; '));'''),
(r'''let p4n=0,p4bad=0;''', r'''let p4n=0,p4bad=0; const p4x=[];'''),
(r'''  if(!got||got.lf!==minLF){ p4bad++; if(p4bad<=5) console.log('  FAIL P4 rest '+r.nm+' cap'+r.cap+
    ' longest run-free '+(got?got.lf:'?')+' but '+minLF+' was available'); }''',
 r'''  if(!got||got.lf!==minLF){ p4bad++; if(p4x.length<3) p4x.push('rest '+r.nm+' cap'+r.cap+
    ' longest run-free '+(got?got.lf:'?')+' but '+minLF+' was available'); }'''),
(r'''ok(p4bad===0,'P4: '+p4bad+'/'+p4n+' rows took a looser week than the tie set allowed');''',
 r'''S.check('P4',p4bad===0,'P4 spread: no row took a looser week than the tie set allowed ('+p4n+' rows)',
  p4bad+'/'+p4n+' rows took a looser week than the tie set allowed; first: '+p4x.join(' ; '));'''),
(r'''  ok(lay(train,pick)===want,'P5 layout is "'+lay(train,pick)+'", hand table says "'+want+'"');
  ok(got&&got.ruled.join(',')==='0,1,2,1,1','P5 ruled rank is not 0,1,2,1,1');
  ok(got&&got.lf===2,'P5 longest run-free stretch is not 2');''',
 r'''  S.check('P5-layout',lay(train,pick)===want,'P5 layout is "'+lay(train,pick)+'", hand table says "'+want+'"','the layout is off the hand table');
  S.check('P5-rank',got&&got.ruled.join(',')==='0,1,2,1,1','P5 ruled rank is 0,1,2,1,1','P5 ruled rank is not 0,1,2,1,1: '+(got?got.ruled.join(','):'ORPHAN'));
  S.check('P5-free',got&&got.lf===2,'P5 longest run-free stretch is 2','P5 longest run-free stretch is not 2: '+(got?got.lf:'ORPHAN'));'''),
(r'''  ok(moved===24,'P6 eve correction displaced '+moved+' rows, after-grid says 24');''',
 r'''  S.check('P6',moved===24,'P6 eve correction displaced '+moved+' rows, after-grid says 24','the displacement count moved off the after-grid');'''),
(r'''  let resid=0, spanning=0, hardSplit=0;''', r'''  let resid=0, spanning=0, hardSplit=0; const p7x=[];'''),
(r'''    if(hards.length>1){ hardSplit++; console.log('  FAIL P7 rest '+r.nm+' cap'+r.cap+
      ' tie spans two hard-day placements: '+hards.join('  |  ')); }''',
 r'''    if(hards.length>1){ hardSplit++; p7x.push('rest '+r.nm+' cap'+r.cap+
      ' tie spans two hard-day placements: '+hards.join('  |  ')); }'''),
(r'''  ok(resid===2,'P7 residual tie count is '+resid+'/93, the measure pinned 2');
  ok(hardSplit===0,'P7: '+hardSplit+' residual ties put the hard days on different days');
  // the measured refutation of the literal wording, pinned so it cannot drift silently
  ok(spanning===2,'P7 day-set-spanning residual ties is '+spanning+', the measure pinned 2');''',
 r'''  S.check('P7-resid',resid===2,'P7 residual tie count is '+resid+'/93, the measure pinned 2','the residual tie count moved off the measure');
  S.check('P7-hard',hardSplit===0,'P7: '+hardSplit+' residual ties put the hard days on different days',p7x.slice(0,3).join(' ; ')||'a residual tie splits the hard days');
  // the measured refutation of the literal wording, pinned so it cannot drift silently
  S.check('P7-span',spanning===2,'P7 day-set-spanning residual ties is '+spanning+', the measure pinned 2','the spanning count moved off the measure');'''),
(r'''  ok(r8===5,'P7 rank 8 broke '+r8+' ties, the measure pinned 5');
  ok(r9===2,'P7 rank 9 broke '+r9+' ties, the measure pinned 2');
  ok(r8+r9+resid===9,'P7 rank-7 ties do not account: '+r8+'+'+r9+'+'+resid+' is not 9');''',
 r'''  S.check('P7-r8',r8===5,'P7 rank 8 broke '+r8+' ties, the measure pinned 5','the rank 8 count moved off the measure');
  S.check('P7-r9',r9===2,'P7 rank 9 broke '+r9+' ties, the measure pinned 2','the rank 9 count moved off the measure');
  S.check('P7-sum',r8+r9+resid===9,'P7 rank-7 ties account: '+r8+'+'+r9+'+'+resid+' is 9','P7 rank-7 ties do not account: '+r8+'+'+r9+'+'+resid+' is not 9');'''),
(r'''  ok(lay(train,pick)===want,'P8 layout is "'+lay(train,pick)+'", the ruling says "'+want+'"');''',
 r'''  S.check('P8-layout',lay(train,pick)===want,'P8 layout is "'+lay(train,pick)+'", the ruling says "'+want+'"','the layout is off the ruling');'''),
(r'''  ok(got&&got.qr===3,'P8 rest into the long run is '+(got?got.qr:'?')+' days, the ruling says 3');''',
 r'''  S.check('P8-rest',got&&got.qr===3,'P8 rest into the long run is '+(got?got.qr:'?')+' days, the ruling says 3','the rest into the long run is off the ruling');'''),
(r'''console.log('PASS '+PASS+' FAIL '+FAIL);''', r'''S.summary();'''),
]

# ---------------------------------------------------------------- g206_d109_copy -------------------------------
EDITS['g206_d109_copy.js'] = [
(r'''// SLICING. V206 lands D109''',
 r'''// IDS (post-V233 V2: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest). The rows
// above keyed to the ruling they defend (standing ruling 4): D109-S-<builder>, D109-T-<builder>, D109-R-<fixture>,
// the fixture tag with '_' written '-' (the id grammar has no '_'). Below the D109 era every row prints SCOPED OUT.
//
// SLICING. V206 lands D109'''),
(r'''let pass = 0, fail = 0, na = 0;
function row(label, cond, detail){
  const tail = detail ? ' (' + detail + ')' : '';
  if(!LIVE){ na++; console.log('NOT APPLICABLE ' + label + tail); return; }
  if(cond){ pass++; console.log('PASS ' + label + tail); }
  else { fail++; console.log('FAIL ' + label + tail); }
}
function summary(){
  console.log('\n' + (LIVE ? '' : 'ia-version ' + VER + ' predates D109 (V' + D109_ERA + '): '
    + na + ' rows NOT APPLICABLE\n') + 'PASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}''',
r'''const S = require('../status')('g206_d109_copy');
const rid = (kind, tag) => 'D109-' + kind + '-' + String(tag).replace(/_/g, '-');
const ROW_BUILDERS = ['run', 'nrc', 'bike', 'swim'];                                // the keys of BUILDERS below
const ROW_FIXTURES = ['HALF_MANNY', 'run_base', 'pace_goal', 'bike', 'swim'];       // the tags of FIX below
S.declare(ROW_BUILDERS.map(k => rid('S', k)).concat(ROW_BUILDERS.map(k => rid('T', k)), ROW_FIXTURES.map(t => rid('R', t))));
let na = 0;
function row(id, label, cond, detail){
  const tail = detail ? ' (' + detail + ')' : '';
  if(!LIVE){ na++; S.scoped(id, 'ia-version ' + VER + ' predates D109 (V' + D109_ERA + '), NOT APPLICABLE: ' + label + tail); return; }
  if(cond) S.pass(id, label + tail);
  else S.fail(id, label, detail);
}
function summary(){
  if(!LIVE) S.info('ia-version ' + VER + ' predates D109 (V' + D109_ERA + '): ' + na + ' rows NOT APPLICABLE');
  S.summary();
}'''),
(r'''  if(b.err){ row('S-' + key + ' ' + fn + ' body located', false, b.err); row('T-' + key + ' table text sited', false, b.err); continue; }''',
 r'''  if(b.err){ row(rid('S', key), fn + ' body located', false, b.err); row(rid('T', key), 'table text sited in ' + fn, false, b.err); continue; }'''),
(r'''  row('S-' + key + ' ' + fn + ' (' + lines.length''', r'''  row(rid('S', key), fn + ' (' + lines.length'''),
(r'''  if(!ents){ row('T-' + key + ' table text sited in ' + fn, false, tableErr); continue; }''',
 r'''  if(!ents){ row(rid('T', key), 'table text sited in ' + fn, false, tableErr); continue; }'''),
(r'''  row('T-' + key + ' entries ' + lo + '-' + hi''', r'''  row(rid('T', key), 'entries ' + lo + '-' + hi'''),
(r'''  if(!p){ row('R-' + f.tag + ' builds', false, err); continue; }''',
 r'''  if(!p){ row(rid('R', f.tag), f.tag + ' builds', false, err); continue; }'''),
(r'''  row('R-' + f.tag + ' (' + typed''', r'''  row(rid('R', f.tag), f.tag + ' (' + typed'''),
]

# ---------------------------------------------------------------- g_fuzz_shard_equiv ---------------------------
EDITS['g_fuzz_shard_equiv.js'] = [
(r'''let pass=0, fail=0;
const ok=m=>{pass++; console.log('   ok: '+m);};
const bad=m=>{fail++; console.log('FAIL: '+m);};
''',
r'''// ROWS (post-V233 V2: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest), numbered by
// the gate's sections: F0 the inputs, F1 the bare invocation, F2 the driver, F3 the raw counters (F3-sums one loop
// row over the 9 counters), F4 the partition. A row that cannot run after an early stop is named by summary().
// The helper is ST: S below is the sequential run's counters, as it always was.
const ST=require('../status')('g_fuzz_shard_equiv');
ST.declare(['F0-cand','F0-tools','F1-bare','F2-stdout','F2-rc','F2-total','F3-seq','F3-parts','F3-sums',
  'F4-walked','F4-order','F4-thin','F4-residue','F4-overlap','F4-union','F4-pre','F4-preran']);
'''),
(r'''  console.log('PASS '+pass+' FAIL '+fail); process.exit(fail?1:0);''', r'''  ST.summary();'''),
(r'''if(!CAND||!fs.existsSync(CAND)){ bad('no candidate html'); done(); }
for(const f of [JS,SH]) if(!fs.existsSync(f)){ bad('missing '+f); done(); }''',
 r'''if(!ST.check('F0-cand',CAND&&fs.existsSync(CAND),'the candidate html is given and exists','no candidate html')) done();
{ const miss=[JS,SH].filter(f=>!fs.existsSync(f));
  if(!ST.check('F0-tools',miss.length===0,'the fuzz script and the shard driver exist','missing '+miss[0])) done(); }'''),
(r'''if(bare.out===seq.out && bare.rc===seq.rc) ok('--shard 0/1 is byte-identical to the bare invocation');
else bad('--shard 0/1 differs from the bare invocation (rc '+seq.rc+' vs '+bare.rc+')');''',
 r'''ST.check('F1-bare',bare.out===seq.out && bare.rc===seq.rc,'--shard 0/1 is byte-identical to the bare invocation',
  '--shard 0/1 differs from the bare invocation (rc '+seq.rc+' vs '+bare.rc+')');'''),
(r'''if(drv.out===seq.out) ok('driver stdout is byte-identical to the sequential run ('+seq.out.split('\n').length+' lines)');
else {
  bad('driver stdout differs from the sequential run');
''',
 r'''if(!ST.check('F2-stdout',drv.out===seq.out,'driver stdout is byte-identical to the sequential run ('+seq.out.split('\n').length+' lines)',
  'driver stdout differs from the sequential run')){
'''),
(r'''if(drv.rc===seq.rc) ok('driver exit code matches the sequential run ('+seq.rc+')');
else bad('driver exit code '+drv.rc+' != sequential '+seq.rc);''',
 r'''ST.check('F2-rc',drv.rc===seq.rc,'driver exit code matches the sequential run ('+seq.rc+')','driver exit code '+drv.rc+' != sequential '+seq.rc);'''),
(r'''if(ft(seq.out) && ft(drv.out)===ft(seq.out)) ok('FUZZTOTAL line identical: '+ft(seq.out));
else bad('FUZZTOTAL mismatch: seq '+JSON.stringify(ft(seq.out))+' drv '+JSON.stringify(ft(drv.out)));''',
 r'''ST.check('F2-total',ft(seq.out) && ft(drv.out)===ft(seq.out),'FUZZTOTAL line identical: '+ft(seq.out),
  'FUZZTOTAL mismatch: seq '+JSON.stringify(ft(seq.out))+' drv '+JSON.stringify(ft(drv.out)));'''),
(r'''if(!S){ bad('sequential run wrote no counters'); done(); }''',
 r'''if(!ST.check('F3-seq',!!S,'the sequential run wrote its counters','sequential run wrote no counters')) done();'''),
(r'''if(parts.some(p=>!p)){ bad('a shard produced no result file: '+parts.map((p,i)=>p?'':(i?('fuzz_'+(i-1)):'pre')).filter(Boolean).join(' ')); done(); }
let sumsOk=true;
KEYS.forEach(k=>{
  const s=parts.reduce((n,p)=>n+p[k],0);
  if(s!==S[k]){ sumsOk=false; bad('counter '+k+': shards sum to '+s+', sequential says '+S[k]); }
});
if(sumsOk) ok('all 9 raw counters sum exactly: '+KEYS.map(k=>k+'='+S[k]).join(' '));''',
 r'''if(!ST.check('F3-parts',!parts.some(p=>!p),'the --pre stage and all '+NSH+' shards wrote a result file',
  'a shard produced no result file: '+parts.map((p,i)=>p?'':(i?('fuzz_'+(i-1)):'pre')).filter(Boolean).join(' '))) done();
const LS=ST.loop('F3-sums','all 9 raw counters sum exactly: '+KEYS.map(k=>k+'='+S[k]).join(' '));
KEYS.forEach(k=>{
  const s=parts.reduce((n,p)=>n+p[k],0);
  LS.check(s===S[k],'counter '+k,'shards sum to '+s+', sequential says '+S[k]);
});
LS.done();'''),
(r'''if(S.idx.length===M) ok('sequential walked '+M+' configs (hand arithmetic: 3x2x3x1x1x2x2)');
else bad('sequential walked '+S.idx.length+' configs, hand arithmetic says '+M);''',
 r'''ST.check('F4-walked',S.idx.length===M,'sequential walked '+M+' configs (hand arithmetic: 3x2x3x1x1x2x2)',
  'sequential walked '+S.idx.length+' configs, hand arithmetic says '+M);'''),
(r'''if(S.idx.join(',')===full.join(',')) ok('sequential index set is exactly 0..'+(M-1)+' in order');
else bad('sequential index set is not 0..'+(M-1));''',
 r'''ST.check('F4-order',S.idx.join(',')===full.join(','),'sequential index set is exactly 0..'+(M-1)+' in order',
  'sequential index set is not 0..'+(M-1));'''),
(r'''if(!thin) ok('every one of the '+NSH+' shards got more than one config (min '+Math.min.apply(null,parts.slice(1).map(p=>p.idx.length))+')');
else bad(thin+' shard(s) got fewer than 2 configs, the partition is trivial');
if(!wrongRes) ok('every config index lands in the shard its residue names');
else bad(wrongRes+' config indices are in the wrong shard');
if(!overlap) ok('no config index appears in two shards');
else bad(overlap+' config indices appear in more than one shard');''',
 r'''ST.check('F4-thin',!thin,'every one of the '+NSH+' shards got more than one config (min '+Math.min.apply(null,parts.slice(1).map(p=>p.idx.length))+')',
  thin+' shard(s) got fewer than 2 configs, the partition is trivial');
ST.check('F4-residue',!wrongRes,'every config index lands in the shard its residue names',wrongRes+' config indices are in the wrong shard');
ST.check('F4-overlap',!overlap,'no config index appears in two shards',overlap+' config indices appear in more than one shard');'''),
(r'''if(sorted.length===M && sorted.join(',')===full.join(',')) ok('union of the '+NSH+' shards is exactly 0..'+(M-1)+': no gap, no overlap');
else bad('union of the shards is '+sorted.length+' indices, not the full 0..'+(M-1)+' set');
if(parts[0].cells===0 && parts[0].idx.length===0) ok('the --pre stage walked no configs');
else bad('the --pre stage walked configs, its builds would be counted twice');''',
 r'''ST.check('F4-union',sorted.length===M && sorted.join(',')===full.join(','),'union of the '+NSH+' shards is exactly 0..'+(M-1)+': no gap, no overlap',
  'union of the shards is '+sorted.length+' indices, not the full 0..'+(M-1)+' set');
ST.check('F4-pre',parts[0].cells===0 && parts[0].idx.length===0,'the --pre stage walked no configs',
  'the --pre stage walked configs, its builds would be counted twice');'''),
(r'''if(ran.length===1 && ran[0]===0) ok('the pre-blocks ran in exactly one part of the fan-out (the --pre stage)');
else bad('the pre-blocks ran in '+ran.length+' parts of the fan-out ['+ran.join(',')+'], `pre` would be counted '+ran.length+' times');''',
 r'''ST.check('F4-preran',ran.length===1 && ran[0]===0,'the pre-blocks ran in exactly one part of the fan-out (the --pre stage)',
  'the pre-blocks ran in '+ran.length+' parts of the fan-out ['+ran.join(',')+'], `pre` would be counted '+ran.length+' times');'''),
]

# ---------------------------------------------------------------- apply ----------------------------------------
out = {}
for name, subs in EDITS.items():
    p = os.path.join(G, name)
    s = open(p, encoding='utf-8').read()
    for k, (a, b) in enumerate(subs):
        n = s.count(a)
        if n != 1:
            print(f'ABORT {name} edit #{k}: anchor count={n}: {a[:90]!r}')
            sys.exit(1)
        s = s.replace(a, b)
    out[name] = s
# the old helpers must be gone (nothing reads them after the conversion)
GONE = {
    'g193_pool_overlay.js': ['pass(', "fail('", 'PASS ++', 'FAIL ++', 'PASS++', 'FAIL++', 'process.exit('],
    'g205_d129_tiebreak.js': ['ok(', 'PASS++', 'FAIL++', 'p1bad', "console.log('  FAIL", 'process.exit('],
    'g206_d109_copy.js': ['pass++', 'fail++', "console.log('PASS", "console.log('FAIL", 'process.exit('],
    'g_fuzz_shard_equiv.js': [' ok(', 'bad(', 'pass++', 'fail++', 'sumsOk', 'process.exit('],
}
import re
for name, toks in GONE.items():
    code = re.sub(r'^\s*//.*$', '', out[name], flags=re.M)
    for t in toks:
        hits = [l for l in code.split('\n') if t in l and not re.search(r'\b(LA|LB|LD|L1|LS|ST|S)\.(pass|fail)\(', l)]
        if t in ('pass(', "fail('") and name == 'g193_pool_overlay.js':
            hits = [l for l in code.split('\n') if re.search(r'(?<![.\w])(pass|fail)\(', l)]
        if t == 'ok(' and name == 'g205_d129_tiebreak.js':
            hits = [l for l in code.split('\n') if re.search(r'(?<![.\w])ok\(', l)]
        if t == ' ok(' and name == 'g_fuzz_shard_equiv.js':
            hits = [l for l in code.split('\n') if re.search(r'(?<![.\w])ok\(', l)]
        if t == 'bad(' and name == 'g_fuzz_shard_equiv.js':
            hits = [l for l in code.split('\n') if re.search(r'(?<![.\w])bad\(', l)]
        if hits:
            print(f'ABORT {name}: old helper token {t!r} still present: {hits[0].strip()[:100]}')
            sys.exit(1)
for name, s in out.items():
    open(os.path.join(G, name), 'w', encoding='utf-8').write(s)
    print(f'wrote tests/gates/{name}: {len(EDITS[name])} replacements')
