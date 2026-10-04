#!/usr/bin/env python3
# v230_s9_g230_postsweep_info.py — V230 slice 9 (no index.html edit). The INFO row D194 Amendment 4 rules
# (tests/measure/v229_rulings/d194_injlens_ruling.md, "D194 — Amendment 4", "What changes" and Mario's decisions 1 and 2),
# in tests/gates/g230_d194_lens2.js (slice 8's text, sha256 a60a6478ecd7…), plus two edits to
# tests/sabotage/v230_d194.json (sha256 39c240a5467c…).
# Figures: M13, tests/measure/v230_rulings/measure_postsweep_reject_m13.md; method lifted (never required) from
# tests/measure/v230_postsweep_reject.js.
# Edits (each anchor asserted count==1 on the running text before it is applied; the whole file aborts on the first miss):
#   E1  g230 header, two hunks: the VERSION PREDICATE block (d194-postsweep asserts at 230 only and REFUSES from 231; its
#       discrimination and baseline figures), and the ROWS block's d194-postsweep entry with the RUNTIME note.
#   E2  g230 code, four hunks: the typed table, the L432 grid and the two worker jobs (population `ps`, reach `reach`)
#       before JOBK and their JOBK entries; the R label and the FIG entry; the jobs queued (VER === 230 only); the merge,
#       which at 231 and up prints a column-0 REFUSED line and stores a FAIL by name.
#   E3  v230_d194.json, S22-D193's note: the stale side-trip sentence becomes what slice 8's gate printed. EXPECTED kept.
#   E4  v230_d194.json, S32-D194-A4 appended (the boot re-filter narrowed to the swapped items).
# No existing row, figure, population or oracle moves; the row count goes from 14 to 15.
# Each file is written only over its exact recorded text (BEFORE); on the recorded result it reports "already applied";
# on anything else it refuses. Each result is checked against its EXPECT sha256 before any write.
import hashlib, json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
GATE = ROOT / 'tests' / 'gates' / 'g230_d194_lens2.js'
SPEC = ROOT / 'tests' / 'sabotage' / 'v230_d194.json'
GATE_BEFORE = 'a60a6478ecd74aa36f86f27e852ab72aa6b1208d3d1058813fa8416eb7f0a610'
GATE_EXPECT = '4501f37888470e95717aacbd02b67ab160500fdd52d07ee6cd12d32ef3249eef'
SPEC_BEFORE = '39c240a5467c5c9484863f193130e9fee88df4bd807fa7822cc88786814ccf3c'
SPEC_EXPECT = '32463a8e5081b6c8324633e75f2ea34bfc18de7ece5533c47cce483d310bca9a'

GATE_EDITS = [
 # E1a: the version predicate
 (r'''//   below 230   REFUSED: every row FAILS by name.
//   230 and up  every row asserts.
//   IA_ASSUME_VERSION=230 lifts a file stamped exactly 229 to 230 for a discrimination run; it is announced, ignored on
//   any other file, and gate.sh never sets it. On V229 that way every figure row FAILS at its V229 figure (d193-e live
//   bwsets at RPE 8 196; d193-k″ hold toasts 0 of 196; d193-e′ live and boot above RPE 7 114; d193-k 0 hold variants,
//   1,243 false claims, INFO capped 728; d193-l G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0) while the three instrument
//   rows and the claim row d194-fixture pass.
//   Each figure row also requires the BASELINE to read its V229 figure on the same presentation in the same run (the
//   baseline shows the defect, g229's precedent): V229 OV1 bwsets at RPE 8 196, hold toasts 0 of 196, live above RPE 7
//   114; V229 STAMP 0 hold variants, 1,243 false claims, INFO capped 728, G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0.
''',
  r'''//   below 230   REFUSED: every row FAILS by name.
//   230         every row asserts.
//   231 and up  every row asserts except d194-postsweep (INFO, D194 Amendment 4, keyed VER === 230), which prints a
//               column-0 REFUSED line and FAILS by name: P-BWFALLBACK + P-FILTERLAST (V231) must re-key it.
//   IA_ASSUME_VERSION=230 lifts a file stamped exactly 229 to 230 for a discrimination run; it is announced, ignored on
//   any other file, and gate.sh never sets it. On V229 that way every figure row FAILS at its V229 figure (d193-e live
//   bwsets at RPE 8 196; d193-k″ hold toasts 0 of 196; d193-e′ live and boot above RPE 7 114; d193-k 0 hold variants,
//   1,243 false claims, INFO capped 728; d193-l G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0) while the three instrument
//   rows and the claim row d194-fixture pass; d194-postsweep FAILS on its (ii) (V229's overlay boot keeps the jump: 0 of
//   88 boots equal the hand oracle) while its (i) holds (the same 22 rejects).
//   Each figure row also requires the BASELINE to read its V229 figure on the same presentation in the same run (the
//   baseline shows the defect, g229's precedent): V229 OV1 bwsets at RPE 8 196, hold toasts 0 of 196, live above RPE 7
//   114; V229 STAMP 0 hold variants, 1,243 false claims, INFO capped 728, G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0;
//   V229 the same 22 post-sweep rejects, and V229 OV1 boot != V229 fixture boot on 88 of 88 swaps (d194-postsweep).
'''),
 # E1b: the ROWS entry and the RUNTIME note
 (r'''//               with no kept dose, no ph in the record and no hold toast; Leg press TEST9 with "Same job, same numbers.".
//
// RUNTIME. Jobs run in a pool of 4 worker processes (fixed; no environment knob): the 7 lattice enumerations first,
//   then the 7 L9 pair configs and 8 shards of the L1 sweep; each enumeration, when it lands, queues its config's
//   lattice in shards of at most 300 batches (whole batches, one chain per day per batch), ahead of the jobs not yet
//   started. The lattice's cost is the boots (every setup and every boot is a refreshProgram), so it scales with the
//   batch count, not the chain count. Each prints one result line on stdout and writes no file. A worker that dies
//   fails the rows it owed, by name.
''',
  r'''//               with no kept dose, no ph in the record and no hold toast; Leg press TEST9 with "Same job, same numbers.".
//   d194-postsweep  INFO, keyed to D194 Amendment 4 (tests/measure/v229_rulings/d194_injlens_ruling.md, "What changes":
//               "One INFO gate row ... predicate `VER === 230`, REFUSES at 231"). It pins a build defect the lens
//               surfaces at boot (P-POSTSWEEP: `bodyweightSweep` renames after the last in-build applyInjuryFilter), not
//               a fix. Figures M13 (tests/measure/v230_rulings/measure_postsweep_reject_m13.md); method lifted from
//               tests/measure/v230_postsweep_reject.js, never required. Population L432 (g229's grid() on commercial,
//               crossfit, home_full and bodyweight: 432 builds, 12,960 lifting days), OV1 and the fixture CFG1 (clock
//               2026-08-24), both trees. A post-sweep reject is a built card that applyInjuryFilter, re-applied to a clone
//               of the built day with the config's own injury (never read through _dayPlanCfg), drops, renames or
//               re-details, matched by positional tag; the re-applied filter selects the population only.
//               (i) the engine's reject set == PS_TABLE (typed, M13 [1]) on all four (candidate and V229, OV1 and fixture;
//               the build path is identical, R3′ "nothing else"): 22 on 22 days in 11 builds, 18 drops of `Burpees`
//               (ankle/protect bodyweight, every experience and support focus, W3 and W4 thu, sole item of `Main —
//               Burpees`) and 4 re-details of `Pushups (slow 3s eccentric)` (elbow/workaround bodyweight advanced,
//               support_strength and support_athletic, W3 and W4 mon, sole item of `Chest volume`, "4 sets — RPE 8 (stop 2
//               reps short of failure)" -> "4 sets — RPE 7 (leave 3 or more in reserve)"); every typed build's stored
//               record and reject rows re-read on fresh VMs equal the population job's (44/44).
//               (ii) one round per non-reject card on every typed reject day (one swap of an OTHER card, measure's
//               trySwap: the first of three candidates not on the day whose landing puts it in the slot), then boot,
//               reboot, undo of every swap, undo+boot: 144 tried, 88 landed on each presentation. On every landed swap the
//               OV1 boot day == the fixture boot day (J, stamp removed, sha1) and each == the hand oracle (that live day
//               with the typed reject names removed, emptied sections dropped, the typed Pushups detail substituted)
//               88/88, and undo+boot == the built day 88/88. The baseline must read V229 in the same run: the same 22,
//               and V229 OV1 boot != V229 fixture boot on 88 of 88 (V229's overlay boot keeps the jump).
//               Predicate VER === 230 only (standing ruling 2: the 22 is a direction already found wrong): from 231 the
//               row prints a column-0 REFUSED line and FAILS by name, naming P-BWFALLBACK + P-FILTERLAST. Mario's
//               decision 2 on Amendment 4 ("P-FILTERLAST SLOT: Fold into V231") puts P-BWFALLBACK, P-HIPEXT and
//               P-FILTERLAST in V231, so V231's gatekeeper re-keys this row with the after-figure, expected 0 on L432
//               (P-BWFALLBACK closes the 18 Burpees, P-FILTERLAST the 4 Pushups re-details), not the 4 the coach text
//               named before the fold.
//
// RUNTIME. Jobs run in a pool of 4 worker processes (fixed; no environment knob): the 7 lattice enumerations first,
//   then the 3 hand-route jobs, the 7 L9 pair configs and 8 shards of the L1 sweep, then (at ia-version 230 only)
//   d194-postsweep's 8 population shards (54 L432 configs each, both trees, OV1 and the fixture) and its 11 reach jobs
//   (one per typed reject build, both trees, OV1 and the fixture); each enumeration, when it lands, queues its config's
//   lattice in shards of at most 300 batches (whole batches, one chain per day per batch), ahead of the jobs not yet
//   started. The lattice's cost is the boots (every setup and every boot is a refreshProgram), so it scales with the
//   batch count, not the chain count. Each prints one result line on stdout and writes no file. A worker that dies
//   fails the rows it owed, by name.
'''),
 # E2a: the typed table, the grid and the two worker jobs, registered in JOBK
 (r'''const JOBK = { pairs:jobPairs, l1:jobL1, enum:jobEnum, lat:jobLat, hand:jobHand };
''',
  r'''// ── d194-postsweep: THE POST-SWEEP REJECT CLASS (D194 Amendment 4, INFO) ──────────────────────────────────────────
// Method lifted from tests/measure/v230_postsweep_reject.js (M13), never required. L432 is tests/gates/g229_d193_build.js
// grid(['commercial', 'crossfit', 'home_full', 'bodyweight']) verbatim: Mario's base config (rest sun,wed, seed 76308)
// with the injury, equipment, experience and focus set.
const PS_REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'], PS_TIERS = ['workaround', 'protect'], PS_EXPS = ['beginner', 'intermediate', 'advanced'],
  PS_FOCS = ['support_strength', 'support_athletic', 'support_prevention'];
const L432 = []; for(const g of PS_REGS) for(const t of PS_TIERS) for(const eq of ['commercial', 'crossfit', 'home_full', 'bodyweight']) for(const ex of PS_EXPS) for(const fo of PS_FOCS)
  L432.push({ k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
// TYPED (M13 [1]): one row per post-sweep reject, [region/tier, equipment, experience, focus, week, day, section, items in
// that section, kind, name, detail before, detail after]. The engine's set is compared against this table; the re-applied
// filter (PS_HELP) only selects the population and never supplies an expected value.
const PS_R8 = '4 sets — RPE 8 (stop 2 reps short of failure)', PS_R7 = '4 sets — RPE 7 (leave 3 or more in reserve)';
const PS_TABLE = [
  ['ankle/protect', 'bodyweight', 'beginner', 'support_strength', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'beginner', 'support_strength', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'beginner', 'support_athletic', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'beginner', 'support_athletic', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'beginner', 'support_prevention', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'beginner', 'support_prevention', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'intermediate', 'support_strength', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'intermediate', 'support_strength', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'intermediate', 'support_athletic', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'intermediate', 'support_athletic', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'intermediate', 'support_prevention', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'intermediate', 'support_prevention', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'advanced', 'support_strength', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'advanced', 'support_strength', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'advanced', 'support_athletic', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'advanced', 'support_athletic', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'advanced', 'support_prevention', 3, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['ankle/protect', 'bodyweight', 'advanced', 'support_prevention', 4, 'thu', 'Main — Burpees', 1, 'drop', 'Burpees'],
  ['elbow/workaround', 'bodyweight', 'advanced', 'support_strength', 3, 'mon', 'Chest volume', 1, 'redetail', 'Pushups (slow 3s eccentric)', PS_R8, PS_R7],
  ['elbow/workaround', 'bodyweight', 'advanced', 'support_strength', 4, 'mon', 'Chest volume', 1, 'redetail', 'Pushups (slow 3s eccentric)', PS_R8, PS_R7],
  ['elbow/workaround', 'bodyweight', 'advanced', 'support_athletic', 3, 'mon', 'Chest volume', 1, 'redetail', 'Pushups (slow 3s eccentric)', PS_R8, PS_R7],
  ['elbow/workaround', 'bodyweight', 'advanced', 'support_athletic', 4, 'mon', 'Chest volume', 1, 'redetail', 'Pushups (slow 3s eccentric)', PS_R8, PS_R7],
];
// the ruled counts (M13 [1] and [2])
const PS_N = { configs:432, days:12960, rej:22, drop:18, redetail:4, builds:11, tried:144, landed:88 };
const PS_COMBO = [['C', 'OV1'], ['C', 'CFG1'], ['B', 'OV1'], ['B', 'CFG1']], PS_SHARDS = 8;
const PS_REFUSE = 'D194 Amendment 4 pins V230\'s post-sweep reject class; P-BWFALLBACK + P-FILTERLAST (V231) must re-key this row (expected 0)';
const psBuild = r => r.slice(0, 4).join('|'), psLine = r => r.join('|');
// the re-applied filter, measure's __rej verbatim: positional tags, the config's own injury on the program's cfg, never _dayPlanCfg
const PS_HELP = "globalThis.__rej=function(sections,inj){var S=JSON.parse(JSON.stringify(sections||[]));S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(it)it.__k=si+'.'+ii;});});"
  + "var O=applyInjuryFilter(JSON.parse(JSON.stringify(S)),Object.assign({},activeProg?activeProg.cfg:{},{injury:inj}));var got={},neu=0;(O||[]).forEach(function(s){((s&&s.items)||[]).forEach(function(it){if(it.__k!=null)got[it.__k]=it;else neu++;});});"
  + "var r=[];S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var k=si+'.'+ii,g=got[k];var row={si:si,ii:ii,n:it.name,lab:s.label||'',nItems:s.items.length,bw:it.__bw||null};"
  + "if(!g){row.kind='drop';r.push(row);}else if(g.name!==it.name){row.kind='rename';row.to=g.name;r.push(row);}else if((g.detail||'')!==(it.detail||'')){row.kind='redetail';row.d0=it.detail;row.d1=g.detail;r.push(row);}});});return {r:r,neu:neu};};";
const psDays = W => { const o = []; Object.keys(W).forEach(w => Object.keys(W[w] || {}).forEach(d => { const dy = W[w][d]; if(dy && Array.isArray(dy.sections) && dy.sections.some(s => s && s.items && s.items.length)) o.push([+w, d]); })); return o; };
const psCards = dy => { const o = []; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name) o.push({ si, ii, n:it.name, d:it.detail || '', lab:s.label || '' }); })); return o; };
const psEng = (k, w, d, r) => k.split('|').concat([w, d, clean(r.lab), r.nItems, r.kind, r.n], r.kind === 'redetail' ? [r.d0, r.d1] : r.kind === 'rename' ? [r.to] : []).join('|');
const psRej = (X, k, inj, W) => { const o = { days:0, neu:0, rej:[] }; for(const [w, d] of psDays(W)){ o.days++; X.ctx.__S = W[w][d].sections;
  const R = JSON.parse(E(X, 'JSON.stringify(__rej(__S,' + JSON.stringify(inj) + '))')); o.neu += R.neu; R.r.forEach(r => o.rej.push(psEng(k, w, d, r))); } return o; };
const psSha = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 20);
const psH = dy => { const c = dy && typeof dy === 'object' ? clone(dy) : dy; if(c && typeof c === 'object') delete c._ovKey; return psSha(J(c)); };
const psVis = dy => JSON.stringify(((dy && dy.sections) || []).map(s => [clean(s.label), (s.items || []).map(it => [it.name, it.detail])]));
// the hand oracle for the boot: the live day with the typed reject names removed, emptied sections dropped, the typed detail substituted
function psOracle(live, rows){ const e = clone(live); delete e._ovKey;
  rows.forEach(r => (e.sections || []).forEach(s => { if(clean(s.label) !== r[6]) return;
    if(r[8] === 'drop') s.items = (s.items || []).filter(it => it.name !== r[9]); else (s.items || []).forEach(it => { if(it.name === r[9] && it.detail === r[10]) it.detail = r[11]; }); }));
  e.sections = (e.sections || []).filter(s => s.items && s.items.length); return e; }
// measure's trySwap: the first of three candidates not already on the day whose landing puts that name in the slot
function psTrySwap(X, w, d, card, used){ E(X, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); let cs = [];
  try { cs = JSON.parse(E(X, 'JSON.stringify(__cands(activeProg.weeks[' + w + '].' + d + ',' + w + ',' + JSON.stringify(card.n) + '))')); } catch(e){ return { err:'cands ' + e.message }; }
  cs = cs.map(x => typeof x === 'string' ? x : (x && x.name)).filter(Boolean).filter(x => !used.has(x.toLowerCase()));
  for(const to of cs.slice(0, 3)){ const before = JSON.parse(dayJ(X, w, d)); X.ctx.__c = { secIdx:card.si, itemIdx:card.ii, name:card.n, detail:card.d }; X.ctx.__to = to;
    try { E(X, '__T.length=0;_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ return { err:'apply ' + e.message }; }
    const after = JSON.parse(dayJ(X, w, d)); const slot = after.sections[card.si] && after.sections[card.si].items[card.ii];
    if(slot && slot.name === to) return { to, before, after };
    if(JSON.stringify(before) !== JSON.stringify(after)) return { to, before, after, landedOther:true }; }
  return { none:true }; }
// ps: a shard of L432, every config on the four presentations; the reject rows of every lifting day
function jobPS(spec){ const out = { R:{} };
  for(const [t, p] of PS_COMBO){ const file = t === 'C' ? spec.art : spec.base, clk = PRES[p].clock; const o = out.R[t + ':' + p] = { builds:0, days:0, neu:0, rej:[], sha:{}, crash:[] };
    for(const ci of spec.cis){ const x = L432[ci];
      try { const st = stored(fresh(file, clk), x.c, p); const X = fresh(file, clk); E(X, PS_HELP); setup(X, st); const W0 = JSON.parse(E(X, 'JSON.stringify(activeProg.weeks)'));
        const q = psRej(X, x.k, x.c.injury, W0); o.builds++; o.days += q.days; o.neu += q.neu; o.rej.push(...q.rej);
        if(PS_TABLE.some(r => psBuild(r) === x.k)) o.sha[x.k] = psSha(st);
      } catch(e){ o.crash.push(x.k + ': ' + String(e && e.message || e).slice(0, 120)); } } }
  return out; }
// reach: one typed reject build on the four presentations; one round per non-reject card on its typed reject days
function jobReach(spec){ const x = L432.find(z => z.k === spec.ck), T = PS_TABLE.filter(r => psBuild(r) === spec.ck), out = { ck:spec.ck, R:{} };
  for(const [t, p] of PS_COMBO){ const file = t === 'C' ? spec.art : spec.base, clk = PRES[p].clock; const o = out.R[t + ':' + p] = { sha:null, rej:[], miss:[], swaps:[] };
    const st = stored(fresh(file, clk), x.c, p); o.sha = psSha(st);
    const nw = () => { const Y = fresh(file, clk); E(Y, PS_HELP); return Y; }; const A = nw(), B1 = nw(), B2 = nw(), U = nw();
    setup(A, st); const W0 = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks)')); o.rej = psRej(A, x.k, x.c.injury, W0).rej;
    const DAYS = [...new Set(T.map(r => r[4] + ' ' + r[5]))].map(s => { const w = +s.split(' ')[0], d = s.split(' ')[1], rows = T.filter(r => r[4] === w && r[5] === d), cs = psCards(W0[w] && W0[w][d]); const rc = [];
      rows.forEach(r => { const at = cs.filter(c => clean(c.lab) === r[6] && c.n === r[9]); if(at.length !== 1) o.miss.push(psLine(r) + ' found ' + at.length); else rc.push(at[0]); });
      return { w, d, rows, oth:cs.filter(c => !rc.some(z => z.si === c.si && z.ii === c.ii)) }; });
    const maxR = Math.max(0, ...DAYS.map(z => z.oth.length));
    for(let q = 0; q < maxR; q++){ setup(A, st); const done = [];
      for(const z of DAYS){ const card = z.oth[q]; if(!card) continue; const used = new Set(psCards(JSON.parse(dayJ(A, z.w, z.d))).map(c => c.n.toLowerCase())); done.push({ z, card, s:psTrySwap(A, z.w, z.d, card, used), uerr:0 }); }
      bootFrom(A, B1); bootFrom(B1, B2);
      done.filter(y => y.s.to).forEach(y => { E(A, 'currentWeek=' + y.z.w + ";currentDayKey='" + y.z.d + "';"); try { E(A, 'undoSwap(' + JSON.stringify(y.card.n) + ');'); } catch(e){ y.uerr = 1; } });
      bootFrom(A, U);
      for(const y of done){ const w = y.z.w, d = y.z.d, key = x.k + '|W' + w + '|' + d + '|' + y.card.si + '.' + y.card.ii + '|' + y.card.n;
        if(!y.s.to){ o.swaps.push({ key, skip:y.s.err || 'no candidate' }); continue; }
        const live = y.s.after, boot = JSON.parse(dayJ(B1, w, d)), ora = psOracle(live, y.z.rows);
        o.swaps.push({ key, to:y.s.to, other:!!y.s.landedOther, uerr:y.uerr, vis:psVis(boot) === psVis(ora),
          h:{ live:psH(live), boot:psH(boot), ora:psH(ora), reboot:psH(JSON.parse(dayJ(B2, w, d))), undoLive:psH(JSON.parse(dayJ(A, w, d))), undoBoot:psH(JSON.parse(dayJ(U, w, d))), built:psH(W0[w][d]) },
          ex:{ live:psVis(live), boot:psVis(boot), ora:psVis(ora) } }); } } }
  return out; }
const JOBK = { pairs:jobPairs, l1:jobL1, enum:jobEnum, lat:jobLat, hand:jobHand, ps:jobPS, reach:jobReach };
'''),
 # E2b: the R label and the FIG entry
 (r'''};
const INST = ['inst-self', 'inst-stamp', 'inst-ov1'];   // the gating instruments: if one fails, every other row FAILS unread
const FIG = ['d194-fixture', 'd193-e', 'd193-k″', 'd193-e′', 'd193-k', 'd193-l', 'd193-i', 'd193-i-r', 'd193-i-u', 'd194-eq', 'd194-q′'];   // d194-fixture is a claim row: read like a figure row, gates nothing
''',
  r'''  'd194-postsweep': 'row d194-postsweep INFO (D194 Amendment 4; asserted at ia-version 230 only, REFUSED from 231 until P-BWFALLBACK + P-FILTERLAST re-key it, expected 0) L432 post-sweep rejects 22 (18 Burpees drops, 4 Pushups re-details) in 11 of 432 builds == the typed table, candidate and V229, OV1 and fixture; on every landed swap of a non-reject card on a reject day (88 of 144) OV1 boot == fixture boot == the hand oracle 88/88, undo+boot == the built day 88/88 (V229 OV1 boot != fixture boot 88 of 88)',
};
const INST = ['inst-self', 'inst-stamp', 'inst-ov1'];   // the gating instruments: if one fails, every other row FAILS unread
const FIG = ['d194-fixture', 'd193-e', 'd193-k″', 'd193-e′', 'd193-k', 'd193-l', 'd193-i', 'd193-i-r', 'd193-i-u', 'd194-eq', 'd194-q′', 'd194-postsweep'];   // d194-fixture is a claim row: read like a figure row, gates nothing
'''),
 # E2c: the jobs, queued at ia-version 230 only
 (r'''for(let s = 0; s < L1_SHARDS; s++) JOBS.push({ kind:'l1', shard:s, art:CF, base:BF, cis:L1.map((c, i) => i).filter(i => i % L1_SHARDS === s) });
''',
  r'''for(let s = 0; s < L1_SHARDS; s++) JOBS.push({ kind:'l1', shard:s, art:CF, base:BF, cis:L1.map((c, i) => i).filter(i => i % L1_SHARDS === s) });
if(VER === ERA){   // d194-postsweep (D194 Amendment 4) asserts at ia-version 230 only, so its jobs run only there
  for(let s = 0; s < PS_SHARDS; s++) JOBS.push({ kind:'ps', shard:s, art:CF, base:BF, cis:L432.map((c, i) => i).filter(i => i % PS_SHARDS === s) });
  [...new Set(PS_TABLE.map(psBuild))].forEach(k => JOBS.push({ kind:'reach', ck:k, art:CF, base:BF })); }
'''),
 # E2d: the merge
 (r'''  // print rows in order: instruments, then figures (unread when an instrument failed)
''',
  r'''  // d194-postsweep (D194 Amendment 4, INFO): asserted at ia-version 230 only; from 231 a column-0 REFUSED line and a FAIL by name
  if(VER !== ERA){ P('REFUSED: row d194-postsweep at ia-version ' + VER + ': ' + PS_REFUSE); RES['d194-postsweep'] = [false, 'REFUSED at ia-version ' + VER + ': ' + PS_REFUSE]; }
  else { const SJ = JOBS.map((j, i) => j.kind === 'ps' ? res[i] : undefined).filter(x => x !== undefined), RJ = JOBS.map((j, i) => j.kind === 'reach' ? res[i] : undefined).filter(x => x !== undefined);
    const N = PS_N, PB = [...new Set(PS_TABLE.map(psBuild))], TS = new Set(PS_TABLE.map(psLine)), K = PS_COMBO.map(([t, p]) => t + ':' + p);
    const NM = { 'C:OV1':'candidate OV1', 'C:CFG1':'candidate fixture', 'B:OV1':'V229 OV1', 'B:CFG1':'V229 fixture' };
    const psOK = SJ.length === PS_SHARDS && SJ.every(Boolean), rOK = RJ.length === PB.length && RJ.every(Boolean);
    const kinds = rows => ({ drop:rows.filter(x => x.split('|')[8] === 'drop').length, redetail:rows.filter(x => x.split('|')[8] === 'redetail').length, rename:rows.filter(x => x.split('|')[8] === 'rename').length,
      days:new Set(rows.map(x => x.split('|').slice(0, 6).join('|'))).size, builds:new Set(rows.map(x => x.split('|').slice(0, 4).join('|'))).size });
    // the typed table reads its own ruled counts (both typed: the oracle is consistent before anything is compared with it)
    const tq = kinds(PS_TABLE.map(psLine)), tableOK = PS_TABLE.length === N.rej && TS.size === N.rej && tq.drop === N.drop && tq.redetail === N.redetail && tq.days === N.rej && tq.builds === N.builds && PB.length === N.builds;
    // (i) the reject set, each presentation against the typed table
    const pop = {}; K.forEach(k => { const o = pop[k] = { builds:0, days:0, neu:0, rej:[], sha:{}, crash:[] };
      SJ.filter(Boolean).forEach(r => { const s = r.R[k]; o.builds += s.builds; o.days += s.days; o.neu += s.neu; o.rej.push(...s.rej); Object.assign(o.sha, s.sha); o.crash.push(...s.crash); }); });
    const setEq = o => { const s = new Set(o.rej); return o.rej.length === TS.size && s.size === TS.size && [...TS].every(x => s.has(x)); };
    const popOK = k => pop[k].builds === N.configs && pop[k].days === N.days && !pop[k].crash.length && setEq(pop[k]);
    K.forEach(k => { const o = pop[k], q = kinds(o.rej), s = new Set(o.rej), extra = o.rej.filter(x => !TS.has(x)), miss = [...TS].filter(x => !s.has(x));
      P('    d194-postsweep (i) ' + NM[k] + ': builds ' + o.builds + ', lifting days ' + o.days + ' | rejects ' + o.rej.length + ' (drops ' + q.drop + ', re-details ' + q.redetail + ', renames ' + q.rename + ') on ' + q.days + ' days in ' + q.builds + ' builds | == the typed table ' + setEq(o) + ' | new items ' + o.neu
        + (o.crash.length ? ' | CRASH ' + o.crash[0] : '') + (extra.length ? ' | e.g. not typed: ' + extra[0] : '') + (miss.length ? ' | e.g. typed, not found: ' + miss[0] : '')); });
    // self: every typed build re-read on fresh VMs (its reach job) == the population job, stored record and reject rows
    let selfN = 0, selfEq = 0, selfEx = '';
    RJ.filter(Boolean).forEach(r => K.forEach(k => { selfN++; const a = r.R[k], pr = pop[k].rej.filter(x => psBuild(x.split('|')) === r.ck).sort(), rr = a.rej.slice().sort();
      if(a.sha === pop[k].sha[r.ck] && JSON.stringify(pr) === JSON.stringify(rr) && !a.miss.length) selfEq++;
      else if(!selfEx) selfEx = r.ck + ' ' + NM[k] + (a.miss.length ? ': typed card not on the day, ' + a.miss[0] : a.sha !== pop[k].sha[r.ck] ? ': stored record differs' : ': reject rows differ'); }));
    P('    d194-postsweep typed table ' + PS_TABLE.length + ' rows (drops ' + tq.drop + ', re-details ' + tq.redetail + ', builds ' + tq.builds + ') consistent ' + tableOK + ' | typed builds re-read on fresh VMs == the population job ' + selfEq + '/' + selfN + (selfEx ? ' | e.g. ' + selfEx : ''));
    // (ii) the reach: every landed swap of a non-reject card on a typed reject day
    const SW = {}; K.forEach(k => { SW[k] = RJ.filter(Boolean).flatMap(r => r.R[k].swaps); });
    const land = k => SW[k].filter(s => s.to);
    const stat = k => { const L = land(k), c = f => L.filter(f).length; return { tried:SW[k].length, landed:L.length, other:c(s => s.other), uerr:c(s => s.uerr), ne:c(s => s.h.boot !== s.h.live),
      ora:c(s => s.h.boot === s.h.ora), vis:c(s => s.vis), reb:c(s => s.h.reboot === s.h.boot), ul:c(s => s.h.undoLive === s.h.built), ub:c(s => s.h.undoBoot === s.h.built) }; };
    const pair = (ka, kb) => { const A = new Map(land(ka).map(s => [s.key, s])), B = new Map(land(kb).map(s => [s.key, s])); let n = 0, to = 0, eq = 0;
      for(const [key, a] of A){ const b = B.get(key); if(!b) continue; n++; if(a.to === b.to) to++; if(a.h.boot === b.h.boot) eq++; } return { n, to, eq, a:A.size, b:B.size }; };
    const S = {}; K.forEach(k => { const s = S[k] = stat(k);
      P('    d194-postsweep (ii) ' + NM[k] + ': swaps tried ' + s.tried + ', landed ' + s.landed + ' (on another card ' + s.other + ') | boot != live ' + s.ne + ' | boot == the hand oracle ' + s.ora + ' (names and details ' + s.vis + ') | reboot == boot ' + s.reb + ' | undo errors ' + s.uerr + ', live after undo == built ' + s.ul + ', undo+boot == built ' + s.ub); });
    const pc = pair('C:OV1', 'C:CFG1'), pb = pair('B:OV1', 'B:CFG1');
    P('    d194-postsweep (ii) OV1 boot == fixture boot (day JSON, stamp removed): candidate ' + pc.eq + ' of ' + pc.n + ' paired (same swap ' + pc.to + ') | V229 ' + pb.eq + ' of ' + pb.n + ' paired (same swap ' + pb.to + ')');
    { const ex = land('C:OV1').find(s => s.h.boot !== s.h.ora) || land('C:OV1')[0]; if(ex) P('      e.g. ' + ex.key + ' -> ' + ex.to + '\n        live   ' + ex.ex.live + '\n        boot   ' + ex.ex.boot + '\n        oracle ' + ex.ex.ora); }
    const c1 = S['C:OV1'], cf = S['C:CFG1'], q = kinds(pop['C:OV1'].rej);
    const iOK = psOK && tableOK && K.every(popOK);
    const iiOK = rOK && [c1, cf].every(s => s.tried === N.tried && s.landed === N.landed && s.ora === N.landed && s.ub === N.landed) && pc.a === N.landed && pc.b === N.landed && pc.n === N.landed && pc.to === N.landed && pc.eq === N.landed;
    const okB = psOK && rOK && popOK('B:OV1') && popOK('B:CFG1') && S['B:OV1'].landed === N.landed && S['B:CFG1'].landed === N.landed && pb.n === N.landed && pb.to === N.landed && pb.eq === 0;
    const selfOK = rOK && selfN === PB.length * K.length && selfEq === selfN;
    RES['d194-postsweep'] = [iOK && iiOK && okB && selfOK,
      '(i) rejects ' + pop['C:OV1'].rej.length + ' (' + q.drop + ' + ' + q.redetail + ') in ' + q.builds + ' builds, == the typed table on ' + K.filter(popOK).length + ' of 4 presentations, self ' + selfEq + '/' + selfN
      + '; (ii) landed ' + c1.landed + ' of ' + c1.tried + ', OV1 boot == fixture boot ' + pc.eq + '/' + pc.n + ', == the hand oracle ' + c1.ora + '/' + c1.landed + ' (fixture ' + cf.ora + '/' + cf.landed + '), undo+boot == built ' + c1.ub + '/' + c1.landed + ' (fixture ' + cf.ub + '/' + cf.landed + ')'
      + (psOK && rOK ? '' : '; JOBS not usable (population ' + SJ.filter(Boolean).length + '/' + PS_SHARDS + ', reach ' + RJ.filter(Boolean).length + '/' + PB.length + ')') + (tableOK ? '' : '; TYPED TABLE inconsistent with its counts')
      + (okB ? '' : '; BASELINE not as ruled: V229 OV1 boot != fixture boot ' + (pb.n - pb.eq) + ' of ' + pb.n + ', V229 rejects == typed ' + popOK('B:OV1') + '/' + popOK('B:CFG1'))]; }

  // print rows in order: instruments, then figures (unread when an instrument failed)
'''),
]

S22_OLD = 'Side trips read on the run: (k) under S22 was not measured (M12 [5]); d193-i pins the hold-toast count 39,203. Cards do not move, so d194-eq (OV1 == CFG1) is not the trip.'
S22_NEW = ('Side trips printed under the slice-8 gate (tests/edits/v230_s8_g230_instfix_claim.py): d194-fixture (L1 149,997 of 150,068, toast 71; '
           'CFG1 pairs 128 of 324), d193-k″ (0 of 196, the NAMED trip), d193-k (hold variants 1,172 of 1,243, false claims 71, INFO capped 529), '
           'd193-i (hold toasts 9,497 vs 39,203), d194-eq\'s baseline clause, d194-q′ (Leg press toast). d194-postsweep (slice 9) reads day JSON, '
           'never a toast, and is not expected to trip.')
S32 = [
 ('name', 'S32-D194-A4 the boot re-filter judges only the swapped items (Amendment 4\'s rejected option 1, narrowing the boot to match the tap)'),
 ('anchor', '      day.sections=applyInjuryFilter(day.sections,_dayPlanCfg(prog,day));\n'),
 ('replacement', "      _renamed.forEach(it=>{ const _f=applyInjuryFilter([{label:'x',items:[{name:it.name,detail:it.detail}]}],_dayPlanCfg(prog,day)); const _g=_f&&_f[0]&&_f[0].items&&_f[0].items[0]; if(_g&&_g.name===it.name) it.detail=_g.detail; });\n"),
 ('gate', 'gates/g230_d194_lens2.js'),
 ('note', 'NAMED TRIP: row d194-postsweep (ii) (tests/measure/v229_rulings/d194_injlens_ruling.md D194 Amendment 4, "Why not fix it inside V230", '
          'the first rejected option: narrowing the boot to the swapped items makes the boot LESS right and reopens the handoff :523 hole on overlay '
          'programs). The boot replay judges only the items it renamed, in the tap\'s single-item form, and leaves every other card as replayed, so '
          'on the 22 post-sweep reject days the booted day keeps `Burpees` and the RPE 8 `Pushups (slow 3s eccentric)` on both presentations: OV1 '
          'boot == fixture boot still, but boot == the hand oracle 0 of 88 (boot == live). Figure: M13 (tests/measure/v230_rulings/'
          'measure_postsweep_reject_m13.md [2]), V229 OV1 boot == live 88 of 88, is this shape. EXPECTED: d194-postsweep (ii). Other rows: none '
          'expected (d194-eq compares OV1 with the fixture and both narrow together; the D190 lattice, the L9 pairs and the hand routes run '
          'commercial builds, where no post-sweep reject exists); read on the run.'),
]
def s32_text():
    return ',\n {\n' + ',\n'.join('  ' + json.dumps(k) + ': ' + json.dumps(v, ensure_ascii=False) for k, v in S32) + '\n }\n]\n'
SPEC_EDITS = [
 # E3: S22's note, the side-trip sentence only
 (S22_OLD, S22_NEW),
 # E4: S32 appended
 ('\n }\n]\n', None),
]

def transform(src, edits, tag):
    out = src
    for i, (a, n) in enumerate(edits):
        c = out.count(a)
        if c != 1:
            raise SystemExit('ABORT: ' + tag + ' edit ' + str(i + 1) + ' anchor count ' + str(c) + ' (want 1); nothing written')
        out = out.replace(a, n if n is not None else '\n }' + s32_text())
    return out
def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()
def plan(path, before, expect, edits, tag):
    if not path.exists():
        raise SystemExit('REFUSED: ' + str(path) + ' is missing')
    src = path.read_text(encoding='utf-8'); have = sha(src)
    if have == expect:
        return ('already', src, have)
    if have != before:
        raise SystemExit('REFUSED: ' + str(path) + ' is neither the recorded text (' + before[:12] + ') nor this record (' + expect[:12] + '): sha256 ' + have[:12])
    out = transform(src, edits, tag); got = sha(out)
    if got != expect:
        raise SystemExit('ABORT: ' + tag + ' result sha256 ' + got + ' is not the recorded ' + expect[:12] + '; nothing written')
    return ('write', out, got)
def main():
    P1 = plan(GATE, GATE_BEFORE, GATE_EXPECT, GATE_EDITS, 'gate')
    P2 = plan(SPEC, SPEC_BEFORE, SPEC_EXPECT, SPEC_EDITS, 'spec')
    if P2[0] == 'write':
        json.loads(P2[1])   # the spec must stay valid JSON
    for path, (mode, out, got), before in ((GATE, P1, GATE_BEFORE), (SPEC, P2, SPEC_BEFORE)):
        if mode == 'already':
            print('already applied: ' + str(path) + ' is byte-identical to this record (sha256 ' + got[:12] + ')'); continue
        with open(path, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(out)
        print('wrote ' + str(path) + ' (' + str(len(out.encode('utf-8'))) + ' bytes, sha256 ' + got[:12] + ', over ' + before[:12] + ')')
if __name__ == '__main__':
    main()
