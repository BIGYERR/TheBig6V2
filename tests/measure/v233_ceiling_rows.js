#!/usr/bin/env node
// Post-V233 measure mC: classify every NON-equality version predicate in tests/gates/*.js (comments and string bodies
// blanked with tests/version_scope.js's own blank()). Classes:
//   a   MINIMUM: the guarded rows run from an era upward (below-era exit/skip/REFUSED, a >= ERA conjunct, an era-table
//       floor clamp, a behaviour that switches on from an era).            a2 ERA SWITCH: both sides assert (if/else or
//       a ternary value), so the row is live at every version.              cos: label/log text only, switches no row.
//   fix FIXTURE version (argv[3]/pinned baseline), not today's ia-version (version_scope.js excludes these too).
//   b   LICENCE: above an era the row REFUSES or FAILs whatever the engine does (standing ruling 2).
//   c   SILENT CEILING: above a version the guarded rows SKIP / print SCOPED / never run, forever (the V221 class).
//       c-row: the whole row is dark. c-conj: a conjunct is dark, the row itself still asserts.
// The hand table below is keyed file:line on the tree measured (Post-V233 working tree, snapshot 2026-10-06). A
// predicate with no table row and no auto rule prints UNCLASSIFIED and the script exits 1: drift is loud.
//   node tests/measure/v233_ceiling_rows.js [repoRoot] [gateRunDir]   gateRunDir holds <gate>.out from single runs at 233.
'use strict';
const fs = require('fs'), path = require('path');
const root = process.argv[2] || path.join(__dirname, '..', '..'), RUNS = process.argv[3] || null;
const lint = fs.readFileSync(path.join(root, 'tests/version_scope.js'), 'utf8');
const blank = new Function(lint.slice(lint.indexOf('function blank'), lint.indexOf('// ---- expression helpers')) + '; return blank;')();
const GD = path.join(root, 'tests/gates');
const VERX = /^(\+?(VER|CAND_VER|BASE_VER|IA_VERSION|artifactV|STAMP|RATE_STAMP|GEAR_VER|v|[A-Za-z]+\.version|[A-Za-z]+\.IA\.version))$/;
const LIT = /^\(?\d{3}\)?$|^[A-Z0-9_]*(ERA|_V)[A-Z0-9_]*$|^RULING_V$/;
const P = [];
for(const f of fs.readdirSync(GD).filter(x => x.endsWith('.js')).sort()){
  const t = fs.readFileSync(path.join(GD, f), 'utf8'), { code, nc } = blank(t), L = code.split('\n'), N = nc.split('\n');
  const lids = new Set([...code.matchAll(/\b([A-Z][A-Z0-9_]*)\s*=\s*\d{3}\b/g)].map(m => m[1])), lit = x => LIT.test(x) || lids.has(x);
  L.forEach((l, i) => { const re = /([+\w.]+)\s*(<=|>=|<|>)\s*([+\w.(]+)/g; let m;
    while((m = re.exec(l))){ const a = m[1].replace(/^\(/, ''), b = m[3].replace(/^\(/, '');
      if(l[m.index - 1] === '<' || l[m.index - 1] === '>' || l[m.index + m[0].length] === '=') continue;
      if((VERX.test(a) && lit(b)) || (VERX.test(b) && lit(a))) P.push({ f, line: i + 1, pred: m[0], txt: N[i].trim(), ctx: N.slice(i + 1, i + 4).join(' ') }); } });
}
// ---- hand table: [class, note, rows switched, dark-at-233 rows, live row shares the branch, ruling]
const H = {
 'g190_rounds.js:414': ['c-row', 'else if(VER < D176_ERA) G11b; else SKIP', ['G11b'], 'yes', 'no (G11f is its own branch)', 'D176 P-BARERX (V220)'],
 'g190_rounds.js:453': ['a', 'G11f from D176'],
 'g192_landmine_rotpress.js:147': ['a', 'behaviour from 221'], 'g193_pool_overlay.js:74': ['a2', 'GHD station from 215'],
 'g199_deload_arbitration.js:134': ['a2', 'tier B exclusion from 211'],
 'g199_deload_arbitration.js:571': ['a2', 'F2/F3 value'], 'g199_deload_arbitration.js:572': ['a2', 'F2 value'], 'g199_deload_arbitration.js:573': ['a2', 'F3 value'], 'g199_deload_arbitration.js:574': ['a2', 'F3 label'],
 'g199_deload_arbitration.js:639': ['c-row', 'flag I2_V231: if(I2_V231) SKIP RETIRED else ok(I2c|I2d)', ['I2c', 'I2d'], 'yes', 'flag yes: I2_V231 also drives live row I2 (value switch 0/108)', 'V231 absorb ruling, D196 P-BWFALLBACK'],
 'g202_int_doctrine.js:156': ['a2', 'cap value'], 'g202_int_doctrine.js:163': ['a2', 'steps'], 'g202_int_doctrine.js:165': ['a2', 'real'], 'g202_int_doctrine.js:565': ['a2', 'R225 tables'],
 'g202_pace_anchor.js:203': ['a2', 'D188_ON: P1b / D188 successor'], 'g203_ceiling_and_anchor.js:68': ['a', 'surface MUST exist from RULING_V'],
 'g203_ceiling_and_anchor.js:423': ['a2', 'ERA_D189 copy rows if/else'], 'g203_mile_pencil.js:177': ['a', 'surface MUST exist from RULING_V'],
 'g204_clock_limb.js:59': ['a', 'below-era exit'], 'g204_clock_limb.js:164': ['a2', 'C5 value'], 'g204_clock_limb.js:180': ['a', 'C5b from 225'], 'g204_clock_limb.js:402': ['a2', 'swim rule if/else'], 'g204_clock_limb.js:537': ['a', 'C8 pace from 225'],
 'g205_bike_unmoved.js:44': ['a', 'below-era exit'], 'g205_chi_table6.js:58': ['a', 'below-era exit'], 'g205_d114_int_table6.js:49': ['a', 'below-era exit'],
 'g205_d125_ceiling.js:65': ['a', 'P0 from 205'], 'g205_d125_spaced.js:66': ['a', 'P0 from 205'], 'g205_d125_spaced.js:161': ['a', 'behaviour from 213'], 'g205_d125_spaced.js:218': ['a', 'behaviour from 213'],
 'g205_d125_spaced.js:462': ['a2', 'P8c count'], 'g205_d125_spaced.js:473': ['a2', 'P8c if/else'], 'g205_d129_tiebreak.js:77': ['a', 'P0 licence from 205'], 'g205_d132_walkweek.js:72': ['a', 'W0 from 205'], 'g205_pace_eve.js:54': ['a', 'P0 from 205'],
 'g206_d109_copy.js:43': ['a', 'LIVE from D109'], 'g206_d137_runbase_chi.js:50': ['a', 'below-era exit'],
 'g207_gk_trial_present.js:124': ['a', 'eve exclusion from 214'], 'g207_gk_trial_present.js:128': ['a2', 'P6 label'], 'g207_gk_trial_present.js:173': ['a', 'behaviour from 214'], 'g207_gk_trial_present.js:193': ['a2', 'Q3 label'], 'g207_gk_trial_present.js:252': ['a', 'Q9 SKIP below 214'],
 'g207_test_calendar.js:67': ['a', 'below-era exit'], 'g207_test_week.js:87': ['a', 'below-era exit'], 'g207_test_week.js:280': ['a2', 'Sunday test if/else'], 'g207_test_week.js:307': ['a', 'SKIP below 213'],
 'g208_d103a_readers.js:158': ['a', 'eve from 214'], 'g208_d103a_readers.js:196': ['a2', 'E3 label'],
 'g209_d140_tier.js:56': ['a', 'below-era exit'], 'g209_d140_tier.js:141': ['a2', 'value'], 'g209_d140_tier.js:144': ['a2', 'value'], 'g209_d140_tier.js:154': ['a2', 'value'], 'g209_d140_tier.js:158': ['a2', 'label'], 'g209_d140_tier.js:160': ['a', 'T1b from 225'], 'g209_d140_tier.js:227': ['a2', 'K1 if/else'],
 'g210_equipment_denials.js:102': ['a', 'EXPIRED: NOT YET BUILT hide allowed <= 210 only'], 'g210_equipment_denials.js:105': ['a', 'D154 SCOPED OUT <= 215 only'], 'g210_equipment_denials.js:106': ['a', 'D149 HELD < 215 only'], 'g210_equipment_denials.js:127': ['a', 'below-era exit'],
 'g212_d110a_swim.js:450': ['a', 'P1n from era'], 'g215_d149_ghd.js:270': ['a2', 'P1 if/else'],
 'g217_d160_dedupe_view.js:117': ['c-row', 'flag PAIR_SCOPE = VER <= 218; if(!PAIR_SCOPE){ K1 live; skipPair x10 }', ['K1 gk delta', 'K1 multi delta', 'K2 gk', 'K2 multi', 'K3', 'K4 gk', 'K4 multi', 'K5 gk', 'K5 multi', 'K6'], 'yes', 'yes: the !PAIR_SCOPE branch also runs K1 gk / K1 multi (candidate phantoms == 0)', 'D160 (V217/218), V219 rescope'],
 'g217_d160_dedupe_view.js:119': ['a2', 'CALPREV from 219'], 'g218_d157_swim_sizer.js:140': ['a', 'U2 from era, SKIP below'],
 'g221_d177_swapfloor.js:135': ['a', 'cueBlind from 227'], 'g221_d177_swapfloor.js:310': ['a', 'B4 setup from era'], 'g221_d177_swapfloor.js:324': ['a', 'from era'], 'g221_d177_swapfloor.js:408': ['a', 'D193 from 229'], 'g221_d177_swapfloor.js:433': ['a', 'D193 from 229'],
 'g221_d177_swapfloor.js:458': ['a2', 'D9 / ERA231 per-row if/else and pin table'],
 'g223_d183_safepace.js:110': ['a2', 'D188_STAMP value'], 'g223_d183_safepace.js:220': ['a2', 'IMPROVE value'], 'g223_d184_testlen.js:350': ['a2', 'R3 refusal population from 225'],
 'g224_d185_wctoday.js:64': ['a', 'n/a below 224'], 'g224_d185_wctoday.js:70': ['a', 'surface licence below 224'],
 'g224_d185_wctoday.js:98': ['c-row', 'artifactV <= POSITIONAL_MAX_V (231) else SKIP', ['line 643', 'line 644', 'line 645', 'line 646', 'line 647'], 'yes', 'no (rows 1b are separate)', 'D185 (V224) positional premise; V232 D199 session call 17'],
 'g225_d186_clockend.js:240': ['a2', 'COPY_GUARD PIN (a) pre-era / era branch'],
 'g225_d187_pacerate.js:188': ['c-row', 'if(VER >= 231) SKIP CONFINEMENT else { block }', ['CONFINEMENT (ROW_LABELS[9])'], 'yes', 'no', 'D187/D189 confinement; V231 absorb ruling section 3'],
 'g225_d187_pacerate.js:190': ['a2', 'inside the dark block'], 'g225_d187_pacerate.js:220': ['a2', 'inside the dark block'], 'g225_d187_pacerate.js:272': ['fix', 'BASE_VER: the baseline fixture'],
 'g226_d188_beginnermile.js:102': ['a2', 'D188 values / labels'],
 'g226_d188_beginnermile.js:301': ['c-row', 'if(VER >= 231) scopeSkip(G2) else ok(G2,false) [no-baseline branch]', ['G2'], 'yes', 'no', 'D188 (V226) same-program claim; V231 absorb ruling'],
 'g226_d188_beginnermile.js:314': ['c-row', 'if(VER >= 231) scopeSkip(G2) else ok(G2)', ['G2'], 'yes', 'no', 'D188 (V226); V231 absorb ruling'],
 'g226_d188_beginnermile.js:588': ['c-row', 'if(VER >= 231) scopeSkip(G1h-P2b) else ok', ['G1h-P2b'], 'yes', 'no', 'D188 A2 licence (V226); V231 absorb ruling'],
 'g226_d188_beginnermile.js:592': ['c-row', 'if(VER >= 231) scopeSkip(G1h-P5) else ok', ['G1h-P5'], 'yes', 'no', 'D188 (V226); V231 absorb ruling'],
 'g226_d189_pacedisclose.js:73': ['a2', 'D189 values / labels'],
 'g226_d189_pacedisclose.js:213': ['c-conj', 'flag V231: SKIP the whole-program byte-equality conjunct; G6b asserts the S1 half', ['G6b (byte-equality conjunct)'], 'conjunct yes', 'yes (G6b live)', 'D189 (V226); V231 absorb ruling section 3'],
 'g227_d190_cuecap.js:227': ['a2', 'CUE value'], 'g227_d190_cuecap.js:410': ['a', 'D193 from 229'], 'g227_d190_cuecap.js:465': ['a2', 'cUNINJ if/else'],
 'g227_d190_cuecap.js:496': ['a2', 'digest want'], 'g227_d190_cuecap.js:497': ['cos', 'log'], 'g227_d190_cuecap.js:499': ['cos', 'label'],
 'g227_d190_prefpath.js:165': ['a2', 'CUE value'], 'g227_d190_prefpath.js:272': ['a2', 'value'], 'g227_d190_seam.js:233': ['a2', 'CUE value'],
 'g228_d193_cueword.js:234': ['c-row', 'flag ONE_RETIRED = VER >= 229: prints "SKIP b-ONECLASS: REFUSED at" (a SKIP line, no FAIL)', ['b-ONECLASS'], 'yes', 'no (the build pass feeds f-STRIP/g-COUPLE, separate rows)', 'D193 (V228); D194 Amendment 1 (r)'],
 'g229_d193_build.js:456': ['c-conj', 'SKIP the two byte-identical-to-V228 conjuncts of row b', ['b (byte-identical conjuncts)'], 'conjunct yes', 'yes (row b live)', 'D193 (V229); V231 absorb ruling section 3'],
 'g229_d193_build.js:457': ['cos', 'row b label'], 'g229_d193_build.js:458': ['c-conj', 'row b condition drops the same conjuncts', ['b (byte-identical conjuncts)'], 'conjunct yes', 'yes (row b live)', 'D193 (V229); V231 absorb ruling'],
 'g229_d193_build.js:470': ['a2', 'dBW if/else'],
 'g229_d193_build.js:508': ['c-conj', 'SKIP the L1-uninjured byte-identical conjunct of row j', ['j (L1 uninjured conjunct)'], 'conjunct yes', 'yes (row j live)', 'D193 (V229); V231 absorb ruling'],
 'g229_d193_build.js:553': ['a2', 'NONCUE value'], 'g229_d193_build.js:570': ['cos', 'row f label'],
 'g229_d194_lens.js:492': ['c-conj', 'SKIP the HALF_MANNY W3/W5 == V228 conjunct of p-UNSTAMPED', ['p-UNSTAMPED (HALF_MANNY conjunct)'], 'conjunct yes', 'yes (p-UNSTAMPED live)', 'D194 (V229); V231 absorb ruling'],
 'g229_d194_lens.js:579': ['c-conj', 'SKIP the two == V228 conjuncts + row-set symmetry of p-SWAP / p-AUX / p-ADD', ['p-SWAP', 'p-AUX', 'p-ADD (== V228 conjuncts)'], 'conjunct yes', 'yes (3 rows live)', 'D194 (V229); V231 absorb ruling'],
 'g230_d194_lens2.js:820': ['a2', 'row text re-key from 231'], 'g230_d194_lens2.js:849': ['a', 'jobs from era'], 'g230_d194_lens2.js:958': ['a2', 'want table'], 'g230_d194_lens2.js:971': ['a2', 'want table'], 'g230_d194_lens2.js:1058': ['a', 'ps rows from 231'],
 'g230_d194_lens2.js:1128': ['c-row', 'if(k === d194-fixture && VER >= 231) SKIP CLAIM', ['d194-fixture CLAIM'], 'yes (static; gate not run)', 'no', 'D194 R3 prime (V230); V231 absorb ruling section 3'],
 'g232_d199_runwheel.js:117': ['a2', 'fixture value'],
};
const auto = r => { const l = r.txt;
  if(/_BY_VERSION\[|ERA\[VER <= 218|ROW \?/.test(l) && /<=/.test(r.pred)) return ['a', 'era-table floor clamp'];
  if(/(cj\.push|verCj|vcj)/.test(l)) return ['a', '>= ERA conjunct (FAILs below)'];
  if(/^\s*(if\s*\(\s*(VER < ERA|!\(\s*VER\s*>=\s*(ERA|\d+)\s*\)))/.test(l) && /(done\(\)|process\.exit|REFUSED|NOT APPLICABLE|skip)/.test(l + r.ctx)) return ['a', 'below-era exit / REFUSED'];
  if(/^(P\(|console\.log\()/.test(l) && /\?/.test(l)) return ['cos', 'header text'];
  return null; };
let uncl = 0; const tot = {}, byGate = {};
for(const r of P){ const k = r.f + ':' + r.line, h = H[k] || auto(r);
  if(!h){ uncl++; console.log('UNCLASSIFIED ' + k + ' [' + r.pred + '] ' + r.txt.slice(0, 140)); continue; }
  r.c = h[0]; r.h = h; tot[r.c] = (tot[r.c] || 0) + 1; }
console.log('PREDICATES ' + P.length + ' in ' + new Set(P.map(r => r.f)).size + ' gate files (of ' + fs.readdirSync(GD).filter(x => x.endsWith('.js')).length + ')');
console.log('BY CLASS ' + JSON.stringify(tot) + ' UNCLASSIFIED ' + uncl);
const C = P.filter(r => /^c-/.test(r.c || ''));
console.log('\n(c) SILENT CEILINGS: ' + C.length + ' predicates (c-row ' + C.filter(r => r.c === 'c-row').length + ', c-conj ' + C.filter(r => r.c === 'c-conj').length + ')');
const rowsOf = {}; C.forEach(r => { const g = r.f; rowsOf[g] = rowsOf[g] || { row: new Set(), conj: new Set() }; r.h[2].forEach(x => rowsOf[g][r.c === 'c-row' ? 'row' : 'conj'].add(x)); });
for(const r of C) console.log('  ' + r.f + ':' + r.line + ' [' + r.pred + '] ' + r.c + ' rows ' + r.h[2].join(', ') + ' | dark@233 ' + r.h[3] + ' | live shares ' + r.h[4] + ' | ' + r.h[5]);
let nRow = 0, nConj = 0; console.log('\n(c) rows per gate (distinct):');
for(const g of Object.keys(rowsOf)){ const o = rowsOf[g]; nRow += o.row.size; nConj += o.conj.size; console.log('  ' + g + ': dark rows ' + o.row.size + ', rows with a dark conjunct ' + o.conj.size); }
console.log('  TOTAL dark rows ' + nRow + ', rows with a dark conjunct ' + nConj + ', gates ' + Object.keys(rowsOf).length);
// ---- confirmation against single-gate runs at 233
if(RUNS){ console.log('\nRUN CONFIRMATION (' + RUNS + ')');
  const want = { g190_rounds: [/^SKIP G11b/], g199_deload_arbitration: [/^SKIP I2c/, /^SKIP I2d/], g217_d160_dedupe_view: [/SKIP.*K2 gk/, /SKIP.*K6/],
    g224_d185_wctoday: [/SKIP line 64[3-7]/], g225_d187_pacerate: [/^SKIP CONFINEMENT/], g226_d188_beginnermile: [/SKIP.*G2 /, /SKIP.*G1h-P2b/, /SKIP.*G1h-P5/],
    g226_d189_pacedisclose: [/^SKIP row G6b/], g228_d193_cueword: [/^SKIP .*REFUSED at ia-version/], g229_d193_build: [/^SKIP row b /, /^SKIP row j /], g229_d194_lens: [/SKIP row p-UNSTAMPED/, /SKIP row p-SWAP/, /SKIP row p-AUX/, /SKIP row p-ADD/] };
  for(const g of Object.keys(want)){ const f = path.join(RUNS, g + '.out'); if(!fs.existsSync(f)){ console.log('  ' + g + ': NOT RUN'); continue; }
    const t = fs.readFileSync(f, 'utf8'), sum = (t.match(/PASS \d+\s+FAIL \d+/g) || []).pop() || 'NO SUMMARY (crash)', sk = (t.match(/^\s*SKIP.*$/gm) || []).length;
    console.log('  ' + g + ': ' + sum + ' | SKIP lines ' + sk + ' | expected ceiling SKIPs ' + want[g].map(re => (t.split('\n').filter(x => re.test(x)).length)).join('/')); } }
// ---- static rule: can the text of the upper branch tell (b) from (c)?
console.log('\nSTATIC RULE PROBE');
const word = C.filter(r => /REFUSED|FAIL/.test(r.txt + ' ' + r.ctx));
console.log('  (c) predicates whose branch text carries REFUSED or FAIL (a word rule would call them (b)): ' + word.length + ' of ' + C.length + ': ' + word.map(r => r.f + ':' + r.line).join(', '));
const flag = C.filter(r => /flag/.test(r.h[1]));
console.log('  (c) predicates reached through a one-hop flag (the predicate line is an assignment, not the branch): ' + flag.length + ' of ' + C.length);
const elseSide = C.filter(r => /else SKIP|else \{/.test(r.h[1]) && /<|<=/.test(r.pred));
console.log('  (c) predicates where the dark side is the else of a < / <= test: ' + elseSide.length + ' of ' + C.length);
console.log('  (b) LICENCES among non-equality predicates: ' + (tot.b || 0));
process.exit(uncl ? 1 : 0);
