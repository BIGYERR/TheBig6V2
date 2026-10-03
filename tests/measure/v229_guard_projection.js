// v229_guard_projection.js — MEASURE driver (read-only), M11 for D194 Amendment 2 (R8).
//   Builds a SCRATCH copy of tests/gates/g228_d192_undokey.js whose GUARD row and D191 INFO line compare U' chains on
//   R8's projection (section label; item {name, detail, base}, base = hand _stripCapCue(_preHold ?? detail)); every other
//   row keeps whole-day JSON. Builds CF5+M1. Runs the copy on CF5, V228 and CF5+M1 with argv[3] = V227.
//   SCR=<scratch>/m11 node tests/measure/v229_guard_projection.js
// The hand stripper's shapes are typed from D193 R4 (cue) and Amendment 3 §2 (held test -> TEST_RX_TEXT). The tree is asked
// only in the INFO cross-check (hand vs tree agreement), never as the oracle.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'; const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const M3 = path.dirname(SCR); const CF5 = path.join(M3, 'cf5', 'cf5.html'), V228 = path.join(M3, 'v228.html'), V227 = path.join(M3, 'cf5', 'v227.html');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12); const P = s => console.log(s);
const cnt = (s, a) => s.split(a).length - 1; const must1 = (s, a, nm) => { const n = cnt(s, a); P('anchor ' + nm + ' count ' + n); if(n !== 1) throw new Error('anchor ' + nm + ' count ' + n); };
// (3) CF5 byte for byte
P('CF5 sha ' + sha(CF5) + ' (M10 5ff9119afd7e) equal ' + (sha(CF5) === '5ff9119afd7e') + ' | V228 sha ' + sha(V228) + ' | V227 sha ' + sha(V227) + ' ia-version ' + (fs.readFileSync(V227, 'utf8').match(/ia-version" content="(\d+)"/) || [])[1]);
// ── the gate copy ──
const GSRC = path.join(ROOT, 'tests', 'gates', 'g228_d192_undokey.js'); let g = fs.readFileSync(GSRC, 'utf8'); P('gate source sha ' + sha(GSRC));
const HAND = [
  "// D194 Amendment 2 (R8): the projection the athlete and the next tap read. Hand stripper, typed from D193 R4's cue shape and",
  "// Amendment 3 section 2's held-test shape (-> the TEST_RX_TEXT literal, typed here); the tree is never asked.",
  "const _CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/;",
  "const _TEST_RX_HAND = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';",
  "const _HELD_TEST_HAND = /^Work up to one working set of 3 to 5 reps at RPE \\d+(?:\\.\\d+)?\\. Technique stays crisp\\. No grinding\\. Log the weight and the reps\\. Your injury plan holds this lift, so there is no new baseline here\\.$/;",
  "const _stripHand = d => { const s = String(d == null ? '' : d); return _HELD_TEST_HAND.test(s) ? _TEST_RX_HAND : s.replace(_CUE_HAND, ''); };",
  "const PROJ = j => JSON.stringify((JSON.parse(j) || []).map(s => ({ label:(s && s.label) || null, items:((s && s.items) || []).map(it => ({ name:it && it.name, detail:it && it.detail, base:_stripHand(it && (it._preHold ?? it.detail)) })) })));",
  "const PHN = j => (j.match(/\"_preHold\"/g) || []).length;" ].join('\n') + '\n';
// E0 (copy-location only, not part of the gate edit): the copy lives in scratch, so its two __dirname paths point at the repo
const R0a = "require(path.join(__dirname, '..', 'harness.js'))", R0b = "const ROOT = path.join(__dirname, '..', '..');";
must1(g, R0a, 'E0a harness path'); must1(g, R0b, 'E0b ROOT'); g = g.replace(R0a, "require(" + JSON.stringify(path.join(ROOT, 'tests', 'harness.js')) + ")").replace(R0b, "const ROOT = " + JSON.stringify(ROOT) + ";");
// E1 GUARD row text (Amendment 2, verbatim) + the projection helpers
const G0 = "const GUARD = 'GUARD D192 refutation (ruling §5): created above 2 on the hop5 seed, created on the walk or hop4, or a created chain with no repeated `from`';";
must1(g, G0, 'E1 GUARD text'); g = g.replace(G0, "const GUARD = 'GUARD D192 refutation (ruling §5, projection per D194 Amendment 2: section label, item name, detail and the dose beneath the hold _stripCapCue(_preHold ?? detail) by hand shape): created above 2 on the hop5 seed, created on the walk or hop4, or a created chain with no repeated from';\n" + HAND);
// E2 act(): the projection beside the whole JSON (bootEq unchanged; d2-BOOT-U still reads bootEq)
const A0 = "  return { un:0, chip, undoEq:!!chip && afterJ === prevJ, recBefore, recAfter, slotAfter, bootSlot, bootEq:bootJ === afterJ, diff };";
must1(g, A0, 'E2 act return'); g = g.replace(A0, "  return { un:0, chip, undoEq:!!chip && afterJ === prevJ, recBefore, recAfter, slotAfter, bootSlot, bootEq:bootJ === afterJ, diff,\n    projEq:PROJ(bootJ) === PROJ(afterJ), phLive:PHN(afterJ), phBoot:PHN(bootJ) };   // D194 Amendment 2 (R8)");
// E3 the INFO/GUARD block
const B0 = "  const created = both.filter(c => c.rb.bootEq && !c.r.bootEq), healed = both.filter(c => !c.rb.bootEq && c.r.bootEq);";
const B1 = "  else console.log('  INFO GUARD clear (ruling §5 refutation, FAIL-only): hop5 created ' + c5 + ' <= 2, walk+hop4 created ' + cw + ', every created chain has a repeated `from`');";
must1(g, B0, 'E3 block start'); must1(g, B1, 'E3 block end'); const i0 = g.indexOf(B0), i1 = g.indexOf(B1) + B1.length;
const NEWB = [
"  // D194 Amendment 2 (R8): GUARD and this INFO line compare U' on the projection; the whole-JSON counts print beside it.",
"  const created = both.filter(c => c.rb.projEq && !c.r.projEq), healed = both.filter(c => !c.rb.projEq && c.r.projEq);",
"  const createdW = both.filter(c => c.rb.bootEq && !c.r.bootEq), healedW = both.filter(c => !c.rb.bootEq && c.r.bootEq);",
"  const shadow = createdW.filter(c => created.indexOf(c) < 0), shadowPH = shadow.filter(c => c.r.phLive > c.r.phBoot);",
"  const P = ['walk', 'hop4', 'hop5', 'pin'];",
"  const line = P.map(p => { const g = UP.filter(c => c.pop === p), gb = both.filter(c => c.pop === p); return p + \" |U'| \" + g.length",
"    + ' boot != live whole JSON candidate ' + g.filter(c => !c.r.bootEq).length + ' / V227 ' + (B ? gb.filter(c => !c.rb.bootEq).length : 'n/a')",
"    + ', projection candidate ' + g.filter(c => !c.r.projEq).length + ' / V227 ' + (B ? gb.filter(c => !c.rb.projEq).length : 'n/a') + ' (on both ' + gb.length + ')'",
"    + ', created projection ' + created.filter(c => c.pop === p).length + ' (whole JSON ' + createdW.filter(c => c.pop === p).length + ')'",
"    + ', healed projection ' + healed.filter(c => c.pop === p).length + ' (whole JSON ' + healedW.filter(c => c.pop === p).length + ')'; }).join(' | ');",
"  console.log(\"  INFO D191 P-SWAPREVISIT (never asserted, never licensed; no pair row on U' boot, ruling §3; projection per D194 Amendment 2): \" + line + ' | ' + sec());",
"  console.log(\"       U' boot != live on the candidate by group, projection: \" + byGrp(UP, c => !c.r.projEq) + \"\\n       whole JSON: \" + byGrp(UP, c => !c.r.bootEq));",
"  console.log('  INFO D191 kept-dose shadow (boot carries no `_preHold` where live does, projection equal): ' + shadow.length + ' of ' + createdW.length + ' created on whole JSON (' + P.map(p => p + ' ' + shadow.filter(c => c.pop === p).length).join(', ') + '); live carries more _preHold keys than boot on ' + shadowPH.length + ' of ' + shadow.length);",
"  created.forEach(c => console.log('       created ' + tag(c) + ' | repeated from ' + JSON.stringify(repFrom(c)) + ' | store before undo ' + JSON.stringify(c.r.recBefore)",
"    + ' after ' + JSON.stringify(c.r.recAfter) + ' | ' + c.r.diff));",
"  const c5 = created.filter(c => c.pop === 'hop5').length, cw = created.filter(c => c.pop !== 'hop5').length, noRep = created.filter(c => repFrom(c).length === 0).length;",
"  if(!B) ok(GUARD + ' (setup: no V227 tree: ' + baseWhy + ')', false);",
"  else if(c5 > 2 || cw > 0 || noRep > 0) ok(GUARD, false, 'hop5 created ' + c5 + ', walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ': stop and re-measure');",
"  else console.log('  INFO GUARD clear on the projection (ruling §5 refutation, FAIL-only, D194 Amendment 2): hop5 created ' + c5 + ' <= 2, walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ' | whole JSON beside it: hop5 ' + createdW.filter(c => c.pop === 'hop5').length + ', walk+hop4 ' + createdW.filter(c => c.pop !== 'hop5').length);" ].join('\n');
g = g.slice(0, i0) + NEWB + g.slice(i1);
const GC = F('g228_d192_undokey_proj.js'); if(fs.existsSync(GC)) fs.unlinkSync(GC); fs.writeFileSync(GC, g); cp.execSync('node --check ' + GC);
const DF = F('gate_copy.diff'); if(fs.existsSync(DF)) fs.unlinkSync(DF); fs.writeFileSync(DF, cp.spawnSync('diff', ['-u', GSRC, GC], { encoding:'utf8' }).stdout);
P('gate copy ' + GC + ' sha ' + sha(GC) + ' | diff vs shipped: hunks ' + (fs.readFileSync(DF, 'utf8').match(/^@@/mg) || []).length + ' -> ' + DF);
// ── M1 on CF5 ──
let c5 = fs.readFileSync(CF5, 'utf8'); const M1a = "const hit=list.filter(e=>e&&e.to===name).pop();"; must1(c5, M1a, 'M1'); const MF = F('cf5_m1.html'); if(fs.existsSync(MF)) fs.unlinkSync(MF);
fs.writeFileSync(MF, c5.replace(M1a, "const hit=list.filter(e=>e&&e.to===name)[0];")); P('CF5+M1 sha ' + sha(MF));
// ── INFO: hand stripper vs the tree's _stripCapCue on every detail of the gate's fixtures (cross-check only) ──
{ const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js')); const X = load(CF5); const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
  const _CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/, _TEST = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.', _HELD = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
  const hand = s => _HELD.test(s) ? _TEST : s.replace(_CUE_HAND, ''); const D = new Set();
  const cfgs = ['knee','ankle','hip','lowback','shoulder','elbow'].map(r => Object.assign(JSON.parse(JSON.stringify(MARIO)), { injury:{ region:r, tier:'workaround' } })).concat([JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), MARIO, Object.assign(JSON.parse(JSON.stringify(MARIO)), { liftingFocus:'strength', injury:{ region:'knee', tier:'workaround' } })]);
  cfgs.forEach(c => { const p = X.buildProgram(c); Object.values(p.weeks).forEach(w => Object.values(w || {}).forEach(d => ((d && d.sections) || []).forEach(s => (s.items || []).forEach(it => { if(it && typeof it.detail === 'string') D.add(it.detail); })))); });
  let agree = 0, cue = 0, held = 0; const bad = []; D.forEach(s => { X.ctx.__s = s; const t = X.eval('_stripCapCue(__s)'); if(t === hand(s)) agree++; else if(bad.length < 3) bad.push(JSON.stringify(s) + ' tree ' + JSON.stringify(t) + ' hand ' + JSON.stringify(hand(s))); if(_CUE_HAND.test(s)) cue++; if(_HELD.test(s)) held++; });
  P('INFO hand stripper == CF5 _stripCapCue on ' + agree + ' of ' + D.size + ' distinct details (cue-shaped ' + cue + ', held-test-shaped ' + held + ')' + (bad.length ? ' | disagree e.g. ' + bad.join(' ; ') : '')); }
// ── run the copy: CF5, V228, CF5+M1, argv[3] = V227 ──
const jobs = [['CF5', CF5], ['V228', V228], ['CF5_M1', MF]]; let left = jobs.length;
jobs.forEach(([t, f]) => { const out = F('gate_proj_' + t + '.out'); if(fs.existsSync(out)) fs.unlinkSync(out); const p = cp.spawn(process.execPath, ['--max-old-space-size=6144', GC, f, V227], { cwd:ROOT }); const ws = fs.createWriteStream(out); p.stdout.pipe(ws); p.stderr.pipe(ws);
  p.on('exit', code => ws.end(() => { const o = fs.readFileSync(out, 'utf8'); P('\n== ' + t + ' exit ' + code + ' | ' + ((o.match(/^PASS \d+ FAIL \d+$/m) || ['NO SUMMARY (crash)'])[0]));
    o.split('\n').filter(l => /^(PASS|FAIL) row|^FAIL GUARD|INFO GUARD|INFO D191|kept-dose shadow|^       created /.test(l)).forEach(l => P('  ' + l.trim().slice(0, 700)));
    if(!--left) P('\nruns done'); })); });
