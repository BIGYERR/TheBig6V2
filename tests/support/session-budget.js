'use strict';
// Helpers for the session budget tests: tests/integration/session-budget.test.js and tests/sweeps/session-budget.test.js,
// and the variant and clock helpers that leg-accessory, compound-tier and runner-armor-circuit share. Built on
// tests/support/app.js.
//
// VARIANTS. A counterfactual is the app under test with named source lines replaced (variant()). Every text replaced
// must occur exactly once in the app, or the helper throws by name; the copy is written to a temporary folder that is
// removed when the process exits. A variant is the app as it stands with one ruled clause taken out, never an older
// release.
//
// CLOCK. Every page is pinned to 2026-08-24 noon (the coach's surgery clock for D195). The digests and censuses here do
// not depend on it; pinning keeps them so.
//
// HAND ORACLES (typed here, never asked of the app): the census lattice axes, the prehab name list, the V192 and V197
// census transcriptions the floors stand on, the hand sessions and their hand-derived trims, the D195-B cost line.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { APP, loadApp, pinClock, fixtures, progDigest } = require('./app.js');

const CLOCK = new Date(2026, 7, 24, 12, 0, 0);
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const clone = (x) => JSON.parse(JSON.stringify(x));
const clean = (s) => String(s == null ? '' : s).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const sha16 = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

// ── variants and pages ───────────────────────────────────────────────────────────────────────────────────────────
let html;
/** The app under test (index.html, or IA_APP) as text. */
function appHtml() {
  if (html === undefined) html = fs.readFileSync(APP, 'utf8');
  return html;
}
/** How many times `t` occurs in the app's text. */
const countIn = (t) => appHtml().split(t).length - 1;
/** `text` with each [from, to] replaced; every `from` must occur exactly once. */
function edit(text, reps) {
  let t = text;
  for (const [from, to] of reps) {
    const n = t.split(from).length - 1;
    if (n !== 1) throw new Error(`variant: the text to replace occurs ${n} times (want 1): ${from.slice(0, 120)}`);
    t = t.replace(from, () => to);
  }
  return t;
}
/** Every [from, to] turned round: the app with the ruled text taken back out. */
const reversed = (reps) => reps.map(([from, to]) => [to, from]);
let tmp = '';
function tmpDir() {
  if (!tmp) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-session-budget-'));
    process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
  }
  return tmp;
}
const variants = {};
/** The app with `reps` applied, written once per tag; returns the file's path. */
function variant(tag, reps) {
  if (!variants[tag]) {
    const f = path.join(tmpDir(), tag.replace(/[^A-Za-z0-9_-]/g, '_') + '.html');
    fs.writeFileSync(f, edit(appHtml(), reps));
    variants[tag] = f;
  }
  return variants[tag];
}
/** A fresh page of `file` (the app under test by default), its clock pinned to CLOCK. */
function page(file) {
  const IA = loadApp(file ? { file } : {});
  pinClock(IA, CLOCK);
  return IA;
}
/** `cfg` built on two fresh pages of `file`: { prog, dig, self }. A program must equal itself before it is compared. */
function twice(file, cfg) {
  const p1 = page(file).buildProgram(clone(cfg));
  const p2 = page(file).buildProgram(clone(cfg));
  const d1 = progDigest(p1);
  return { prog: p1, dig: d1, self: d1 === progDigest(p2) };
}
/** The day's sections that carry items, as the athlete reads them. */
const liveSecs = (day) => Array.from((day && !day.rest && day.sections) || []).filter((s) => (s.items || []).length);
/** One line per live section: label (and superset rounds) then each item's name and detail. */
const cardLines = (day) =>
  liveSecs(day).map((s) => clean(s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: '
    + s.items.map((it) => clean(it.name) + ' ' + clean(it.detail || '')).join(' | '));
/** A day's JSON with the clock fields stripped. */
const dayJ = (day) => JSON.stringify(day || null, (k, v) => (k === 'id' || k === 'created' ? undefined : v));
const weekKeys = (p) => Object.keys((p && p.weeks) || {}).sort((a, b) => a - b);

// ── D195-B: the budget prices the prehab rails at half ──────────────────────────────────────────────────────────
// The cost line before and after the ruling (tests/edits/v231_s1_d195b_cost.py). The app carries the second text;
// reversed([COST_LENS]) is the app without the ruling.
const COST_LENS = [
  "  const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
  "  const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };",
];
/** The test-only switch at capSessionBudget's head that hands a day back untouched. */
const BUDGET_OFF_SWITCH = "if(typeof globalThis!=='undefined' && (globalThis.__CAP_OFF || globalThis.__BUDGET_OFF)) return sections;";
// D195-A (Amendment 2): the runner armor circuit's fourth item. Seven replacements, before and after
// (tests/edits/v231_s2_d195_a3c_a5.py, v231_s3_d195_a1x_a2r_a6.py): the circuit's fourth item ranks 3 in the regional
// trim (A5) and in the budget (A6), the four-item allowance in the regional move cap (A3c), the prevention hip extension
// subset registering the whole pool (A1x), and the fourth item itself (A2r). reversed(HIPEXT_A) takes A back out.
const RANK2 = "    if(/superset b|biceps|triceps|leg isolation|calves|accessory|pump|chest \\+ knee/.test(L)) return 2;\n";
const CAPFOR = "  const _capFor = r => Math.max(6, _setCap(r) - (r==='legs' ? _legCut : _uppCut));\n";
const HIPEXT_A = [
  [RANK2, "    if(/^leg circuit/.test(L)) return (itemIdx>=3) ? 3 : 2;\n" + RANK2],
  [CAPFOR, CAPFOR + "  const _moveCapFor = r => _moveCap(r) + ((role==='legs' && r==='legs' && out.some(s=>/^leg circuit/i.test((s&&s.label)||'')&&((s&&s.items)||[]).length>=4)) ? 1 : 0);\n"],
  ["      ((regionMoves[r]||0)-_moveCap(r))*4\n", "      ((regionMoves[r]||0)-_moveCapFor(r))*4\n"],
  ["      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCap(r))\n",
    "      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCapFor(r))\n"],
  ["    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n  };\n",
    "    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n  };\n"
    + "  if(preventionSupport){ _swapUniverseAdd(hipExtPool); hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through'); }\n"],
  ["        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[\n"
    + "          {name:ex.lunge[0],detail:'2×10 each'},\n"
    + "          {name:ex.kneeStab,detail:'2×25 sec'},\n"
    + "          {name:ex.hinge[0],detail:'2×8'}]});\n",
  "        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[\n"
    + "          {name:ex.lunge[0],detail:'2×10 each'},\n"
    + "          {name:ex.kneeStab,detail:'2×25 sec'},\n"
    + "          {name:ex.hinge[0],detail:'2×8'}].concat((_isRunner&&ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});\n"],
  ["        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder\n"
    + "        const score=sr*10+_itemRank(it.name);\n",
  "        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder\n"
    + "        const score=(((ii>=3)&&/^leg circuit/i.test((s&&s.label)||''))?3:sr)*10+_itemRank(it.name);\n"],
];
/** The app without D195-B's cost lens, without D195-A, and without both: the three counterfactuals the rulings printed. */
const noCostLens = () => variant('no-cost-lens', reversed([COST_LENS]));
const noHipExtA = () => variant('no-hipext-a', reversed(HIPEXT_A));
const noD195 = () => variant('no-d195', reversed(HIPEXT_A.concat([COST_LENS])));

// ── D195-B's shard (M15's FULL lattice constructor) ─────────────────────────────────────────────────────────────
const SH_FAM = { race: [['run_5k', {}], ['run_10k', {}], ['run_half', {}], ['run_marathon', {}]], test: [['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '30' }], ['run_base', {}]], none: [[null, {}]] };
const SH_TIERS = ['commercial', 'crossfit', 'home_full', 'home_basic', 'minimal', 'bodyweight'];
const SH_EXPS = ['beginner', 'intermediate', 'advanced'];
const SH_SEEDS = [87747, 76308, 1234, 4242];
const SH_RESTS = [['sun', 'wed'], ['sat', 'sun']];
/** Coach's lattice constructor: focus, family, tier, experience index, seed index, rest index, injury. */
function shMk(f, fam, eq, ei, si, ri, inj) {
  const g = SH_FAM[fam][(si + ei) % SH_FAM[fam].length];
  const c = {
    name: 'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [],
    cardioGoals: g[0] ? { run: Object.assign({ id: g[0], label: g[0], mileBestMins: '8', mileBestSecs: '0', baselineDist: '3', baseline: '3mi' }, g[1]) } : {},
    eventTargeted: false, liftingFocus: f, experience: SH_EXPS[ei], ageBracket: '18-35', equipment: eq, unit: 'lbs',
    restDays: SH_RESTS[ri].slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: SH_SEEDS[si],
  };
  if (inj) c.injury = inj;
  return c;
}
/** 648 configs: three foci x three families x six tiers x three experiences x two seeds x two rests. */
function costLensShard() {
  const out = [];
  for (const f of ['support_prevention', 'support_athletic', 'balanced']) for (const fam of Object.keys(SH_FAM)) for (const eq of SH_TIERS)
    for (let ei = 0; ei < 3; ei++) for (const si of [0, 1]) for (let ri = 0; ri < 2; ri++)
      out.push({ tag: [f, fam, eq, SH_EXPS[ei], 's' + SH_SEEDS[si], SH_RESTS[ri].join(',')].join('|'), c: shMk(f, fam, eq, ei, si, ri, null) });
  return out;
}
/** B-3: a superset member the lens restores crosses a fixed station, so its partner is re-picked (same label, a hinge). */
const B3 = { tag: 'knee/workaround|commercial|balanced|race|intermediate|s1234|sat,sun', c: shMk('balanced', 'race', 'commercial', 1, 2, 1, { region: 'knee', tier: 'workaround' }),
  w: '7', d: 'wed', label: 'Leg superset B', gone: 'Barbell good mornings', partner: 'Dumbbell split-stance deadlift', restored: 'Glute-ham raise' };
/** B-2: on loaded prevention W3, the landmine rotational press drops a set. */
const B2 = { tag: 'support_prevention|race|commercial|intermediate|s1234|sun,wed', c: shMk('support_prevention', 'race', 'commercial', 1, 2, 0, null), w: '3', d: 'tue',
  name: 'Landmine rotational press', from: '3×15 each', to: '2×15 each' };
/** M15's hand hinge classifier (v228_hip_volume.js C2), never _pattern. */
const HINGE_HAND = /deadlift|\brdl\b|good morning|swing|back extension|glute-ham|\bghr\b|ghd|hip hinge|kettlebell clean|power clean|hang clean|snatch|nordic/i;
const itemsOf = (day) => { const o = []; liveSecs(day).forEach((s) => s.items.forEach((it) => { if (it && it.name) o.push([clean(it.name), clean(it.detail || ''), clean(s.label || s.coreHeader || '')]); })); return o; };
const daySig = (day) => JSON.stringify(liveSecs(day).map((s) => [s.label || '', s.coreHeader || '', s.rounds || '', !!s.superset, s.items.map((it) => [clean(it.name), clean(it.detail || '')])]));
const msetMinus = (a, b) => { const m = {}; a.forEach((x) => (m[x] = (m[x] || 0) + 1)); b.forEach((x) => { if (m[x]) m[x]--; }); const o = []; Object.keys(m).forEach((k) => { for (let i = 0; i < m[k]; i++) o.push(k); }); return o; };
/**
 * D195-B on `rows` ({tag, c}): each config built without the lens (the app with D195-A and D195-B both taken out),
 * with it (D195-A taken out: B alone, as the ruling measured it), and without the lens with the budget switched off.
 * Every day the lens changes is classified: items removed, items added (and whether the budget-off card carries them),
 * detail changes, and anything else.
 */
function costLensDiff(rows) {
  const XV = page(noD195()), XO = page(noD195()), XB = page(noHipExtA());
  XO.eval('globalThis.__BUDGET_OFF=true;');
  const r = { built: 0, crashed: [], cells: 0, changed: 0, added: 0, addedOff: 0, boDiff: 0, removed: [], novel: [], details: [], other: [], b3: null, b2: 0 };
  for (const row of rows) {
    let a, o, b;
    try { a = XV.buildProgram(clone(row.c)); o = XO.buildProgram(clone(row.c)); b = XB.buildProgram(clone(row.c)); } catch (e) { r.crashed.push(row.tag + ': ' + e.message); continue; }
    r.built++;
    for (const w of weekKeys(a)) for (const d of DAYS) {
      const da = a.weeks[w][d], db = b.weeks[w] && b.weeks[w][d], dbo = o.weeks[w] && o.weeks[w][d];
      r.cells++;
      if (daySig(da) !== daySig(dbo)) r.boDiff++;
      if (daySig(da) === daySig(db)) continue;
      r.changed++;
      const ia = itemsOf(da), ib = itemsOf(db), na = ia.map((x) => x[0]), nb = ib.map((x) => x[0]), nbo = itemsOf(dbo).map((x) => x[0]);
      const rem = msetMinus(na, nb), add = msetMinus(nb, na);
      rem.forEach((n) => r.removed.push({ row, w, d, n, lab: (ia.find((x) => x[0] === n) || [])[2] }));
      add.forEach((n) => { r.added++; if (nbo.includes(n)) r.addedOff++; else r.novel.push(row.tag + ' W' + w + ' ' + d + ': ' + n); });
      let dd = 0;
      [...new Set(na.filter((n) => nb.includes(n)))].forEach((n) => {
        const x = ia.filter((z) => z[0] === n).map((z) => z[1]).sort(), y = ib.filter((z) => z[0] === n).map((z) => z[1]).sort();
        if (JSON.stringify(x) === JSON.stringify(y)) return;
        dd++;
        const isB2 = n === B2.name && JSON.stringify(x) === JSON.stringify([B2.from]) && JSON.stringify(y) === JSON.stringify([B2.to]) && w === '3'
          && row.c.liftingFocus === 'support_prevention' && row.c.equipment !== 'bodyweight';
        r.details.push({ s: row.tag + ' W' + w + ' ' + d + ': ' + n + ' ' + JSON.stringify(x) + ' -> ' + JSON.stringify(y), isB2 });
        if (isB2 && row === B2 && w === B2.w && d === B2.d) r.b2++;
      });
      if (!rem.length && !add.length && !dd) r.other.push(row.tag + ' W' + w + ' ' + d);
      if (row === B3 && w === B3.w && d === B3.d) r.b3 = { a: ia, b: ib, bo: itemsOf(dbo), rem, add };
    }
  }
  return r;
}

// ── the census lattice (D47, D48, D50; the V193 widening) ──────────────────────────────────────────────────────
// HALF_MANNY with five axes moved: {healthy, shoulder, low back, elbow protect} x six tiers x two foci x two experiences
// x three seeds = 288 cells. NARROW is the older healthy sweep (six tiers x five seeds), kept because two V192 censuses
// were transcribed against it.
const EQUIP = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const INJ = [
  { tag: 'healthy', injury: null },
  { tag: 'shoulder/protect', injury: { region: 'shoulder', tier: 'protect' } },
  { tag: 'lowback/protect', injury: { region: 'lowback', tier: 'protect' } },
  { tag: 'elbow/protect', injury: { region: 'elbow', tier: 'protect' } },
];
const FOCUS = ['support_prevention', 'hypertrophy'];
const EXPER = ['intermediate', 'advanced'];
const SEEDS_WIDE = [1013, 3039, 76308];
const SEEDS_NARROW = [1013, 3039, 6078, 10130, 76308];
function latticeCells(inj, equip, focus, exper, seeds) {
  const out = [];
  for (const i of inj) for (const equipment of equip) for (const liftingFocus of focus) for (const experience of exper) for (const seed of seeds) {
    out.push({
      tag: [i.tag, equipment, liftingFocus, experience, 'seed=' + seed].join(' '),
      key: [i.tag, equipment, liftingFocus, experience, seed].join('|'),
      inj: i.tag, equipment, over: { equipment, seed, liftingFocus, experience, injury: i.injury },
    });
  }
  return out;
}
const WIDE = latticeCells(INJ, EQUIP, FOCUS, EXPER, SEEDS_WIDE);
const NARROW = latticeCells([INJ[0]], EQUIP, ['support_prevention'], ['intermediate'], SEEDS_NARROW)
  .map((c) => ({ ...c, over: { equipment: c.over.equipment, seed: c.over.seed } }));
/** The integration sample: seed 76308, every injury and tier, focus and experience paired (48 cells). */
const SAMPLE = WIDE.filter((c) => c.over.seed === 76308 && (c.over.liftingFocus === 'hypertrophy') === (c.over.experience === 'advanced'));

// ── hand oracles for the census ─────────────────────────────────────────────────────────────────────────────────
/** HALF_MANNY on the healthy path carries 18 core sections per build (14 weeks; the ruling's after-grid). */
const CORE_PER_BUILD = 18;
/** The knee-stability and cuff and scap pools D47 measured as the raided rail (from EXLIB by hand). */
const PREHAB_NAMES = ['Spanish squat hold (KB)', 'Wall sit', 'Terminal knee extension (band)', 'Single-leg wall sit',
  'Dumbbell lateral raise', 'Cable lateral raise', 'Dumbbell front raise', 'Dumbbell rear delt fly', 'Face pull',
  'Prone Y-T-W raises', 'Wall slides'];
const isPrehabItem = (secHip, name) => !!secHip || PREHAB_NAMES.indexOf(name) >= 0;
// V192 transcriptions (git show V192:index.html), each fenced to the lattice it was typed on. They are floors.
const V192_PREHAB = {
  wide: { bodyweight: 3775, minimal: 3867, home_basic: 3824, home_full: 3747, commercial: 3747, crossfit: 3711 },
  narrow: { bodyweight: 425, minimal: 470, home_basic: 470, home_full: 444, commercial: 444, crossfit: 444 },
};
const V192_PREHAB_SUM = { wide: 22671, narrow: 2697 };
/** Core sections off the long-run days, per injury path, on WIDE (V192). */
const V192_CORE_OFF_LONG_RUN = { healthy: 1296, 'shoulder/protect': 648, 'lowback/protect': 1224, 'elbow/protect': 576 };
/** Non-optional sections the budget deleted per tier on WIDE (V192). */
const V192_NONOPT = { bodyweight: 1022, minimal: 1045, home_basic: 1106, home_full: 1127, commercial: 1127, crossfit: 1100 };
/** Every non-optional class V192 emptied on WIDE, with its count. Anything outside it is new budget fodder. */
const V192_NONOPT_CLASSES = {
  Accessory: 136, Triceps: 643, 'Leg isolation': 432, Calves: 1296, 'Leg superset B': 1104, Delts: 318, Biceps: 267,
  'Chest volume': 11, 'Leg superset A': 478, 'Chest + knee': 18, 'Trunk — anti-extension': 1232, 'Calf — achilles armor': 514,
  'Trunk — anti-rotation': 16, Leg: 8, 'Delts finisher': 36, 'Arms finisher': 18,
};
/** D81: the budget may trim the isolation band; the class is excluded from the per-tier ceiling on both sides. */
const RULED_DELETABLE = ['Leg isolation'];
/** V192's 'Leg isolation' deletions per tier (432 over six tiers of a balanced lattice whose pool was tier-invariant). */
const V192_RULED_DEL = { bodyweight: 72, minimal: 72, home_basic: 72, home_full: 72, commercial: 72, crossfit: 72 };
/** D85: prehab whose name is on the list, outside the four displaced names, per tier on WIDE (V197). A floor. */
const D85_DISPLACED_NAMES = ['Spanish squat hold (KB)', 'Terminal knee extension (band)', 'Wall sit', 'Single-leg wall sit'];
const V197_PREHAB_OTHER = { bodyweight: 330, minimal: 426, home_basic: 394, home_full: 333, commercial: 333, crossfit: 291 };
const V197_PREHAB_OTHER_SUM = 2107;
/** D47: items inside hip:true sections, per tier on WIDE. The budget cannot reach a protected section. */
const D47_RAIL_PER_TIER = 3072;
/** D81: leg compound section emptyings may not rise above V197's census (41 + 855; the same 896 D85's leg family read). */
const LEG_COMPOUND_CLASSES = ['Leg superset A', 'Leg superset B'];
const V197_LEG_COMPOUND = { 'Leg superset A': 41, 'Leg superset B': 855 };
const V197_LEG_COMPOUND_SUM = 896;

const secKey = (s) => [clean(s.label), clean(s.coreHeader), s.pillar || '', s.core ? 'C' : '', s.hip ? 'H' : '', s.optional ? 'O' : ''].join('|');

/**
 * Builds HALF_MANNY on every cell with the budget on (or off, through the app's own test switch) and counts sections,
 * items, core sections, empty sections and prehab items, per tier, per injury path and per cell. Long-run days are
 * classified with the app's own _longRunTier (the predicate the trunk floor's carve-out uses).
 */
function census(IA, budgetOff, cells) {
  IA.eval('globalThis.__BUDGET_OFF = ' + (budgetOff ? 'true' : 'false') + ';');
  const lrt = IA.eval('_longRunTier');
  const out = { tiers: {}, cells: {}, byDay: {}, byInj: {}, cellsSwept: 0, dayBuilds: 0, lrDays: 0, lrCore: 0, lrTiers: { A: 0, B: 0, C: 0 } };
  for (const e of EQUIP) out.tiers[e] = { coreSec: 0, thinCore: 0, emptySec: 0, sections: 0, items: 0, prehab: 0, prehabHip: 0, prehabName: {} };
  try {
    for (const c of cells) {
      const T = out.tiers[c.equipment];
      const I = out.byInj[c.inj] || (out.byInj[c.inj] = { coreSec: 0, thinCore: 0, coreOffLongRun: 0 });
      const C = (out.cells[c.key] = { coreSec: 0, coreOffLongRun: 0 });
      out.cellsSwept++;
      const prog = IA.buildProgram(Object.assign({}, clone(fixtures.HALF_MANNY), clone(c.over)));
      for (const wk of Object.keys(prog.weeks || {})) for (const d of DAYS) {
        const day = (prog.weeks[wk] || {})[d];
        if (!day) continue;
        out.dayBuilds++;
        const lr = lrt(day.cardio) || null;
        if (lr) { out.lrDays++; out.lrTiers[lr]++; }
        const keys = [];
        for (const s of day.sections || []) {
          if (!s) continue;
          const n = (s.items || []).length;
          T.sections++; T.items += n;
          keys.push(secKey(s));
          if (s.core) {
            T.coreSec++; I.coreSec++; C.coreSec++;
            if (lr) out.lrCore++; else { C.coreOffLongRun++; I.coreOffLongRun++; }
            if (n === 1) { T.thinCore++; I.thinCore++; }
          }
          if (n === 0) T.emptySec++;
          for (const it of s.items || []) {
            const nm = clean(it.name);
            if (!isPrehabItem(s.hip, nm)) continue;
            T.prehab++;
            if (s.hip) T.prehabHip++; else T.prehabName[nm] = (T.prehabName[nm] || 0) + 1;
          }
        }
        out.byDay[c.key + '|' + wk + '|' + d] = keys;
      }
    }
  } finally {
    IA.eval('globalThis.__BUDGET_OFF = false;');
  }
  return out;
}
const tally0 = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
/**
 * What the budget deleted, read off the same cells built with the budget off and on (a within-version measurement: a
 * section present before the budget and absent after it was deleted by the budget). Per tier: optional, non-optional,
 * non-optional outside the ruled-deletable class; per class; and sections that appeared after the budget.
 */
function tally(offC, onC) {
  const perTier = {};
  const kinds = {};
  let added = 0, days = 0;
  for (const e of EQUIP) perTier[e] = { opt: 0, non: 0, nonEx: 0, ruled: 0 };
  for (const dk of Object.keys(offC.byDay)) {
    days++;
    const tier = dk.split('|')[1];
    const A = tally0(offC.byDay[dk]), B = tally0(onC.byDay[dk] || []);
    for (const k of Object.keys(A)) {
      const d = A[k] - (B[k] || 0);
      if (d <= 0) continue;
      if (/\|O$/.test(k)) { perTier[tier].opt += d; continue; }
      const lbl = k.split('|')[0] || k.split('|')[1] || '(no label)';
      perTier[tier].non += d;
      if (RULED_DELETABLE.indexOf(lbl) < 0) perTier[tier].nonEx += d; else perTier[tier].ruled += d;
      kinds[lbl] = (kinds[lbl] || 0) + d;
    }
    for (const k of Object.keys(B)) if (B[k] - (A[k] || 0) > 0) added += B[k] - (A[k] || 0);
  }
  return { perTier, kinds, added, days };
}

// ── hand sessions (D48 and the plain order) ─────────────────────────────────────────────────────────────────────
// Costs by the documented model: stretches 0; carries, holds, planks and pallof 0.5x sets; everything else 1x sets.
// Cap with no cardio 20. Section rank: protected -1; optional or carry/finisher/conditioning/explosive 3; superset B,
// isolation, calves, pump, accessory 2; everything else 1. Item rank: carry 2, wall sit or hold 1, else 0. Score =
// rank x 10 + item rank; ties break to the LATER position.
//   Main lift    Back squat 6x5                          6.0  protected (/^main/)
//   Accessory A  DB walking lunge 3x10, Leg curl 3x12     3+3  rank 2 -> 20, 20
//   Chest + knee DB lateral raise 3x12, Wall sit 3x25 sec 3+1.5 rank 1 -> 10, 11
//   Core         Pallof press 4x10, Side plank 4x30 sec   2+2  (optional in the D48 case)
//   Isolation    Dumbbell curl 4x12                       4    rank 2 -> 20
// 24.5 against 20. D48: the optional core block has two items, so it ranks 3; Side plank (later) goes, 22.5; the block
// is down to one item and protected; the latest 20 is the Dumbbell curl, the section empties, 18.5, stop.
// Plain (no optional flag): the core block is protected from the start; the curl goes (20.5), then the Leg curl
// (17.5), stop.
function handSession(withOptional) {
  const s = [
    { label: 'Main lift', items: [{ name: 'Back squat', detail: '6×5' }] },
    { label: 'Accessory A', items: [{ name: 'Dumbbell walking lunge', detail: '3×10' }, { name: 'Leg curl', detail: '3×12' }] },
    { label: 'Chest + knee', superset: true, items: [{ name: 'Dumbbell lateral raise', detail: '3×12' }, { name: 'Wall sit', detail: '3×25 sec' }] },
    { label: '', core: true, pillar: 'anti_rotation', coreHeader: 'Core — Anti-rotation', items: [{ name: 'Pallof press', detail: '4×10' }, { name: 'Side plank', detail: '4×30 sec' }] },
    { label: 'Isolation', items: [{ name: 'Dumbbell curl', detail: '4×12' }] },
  ];
  if (withOptional) s[3].optional = true;
  return s;
}
const shape = (out) => out.map((s) => (clean(s.label) || clean(s.coreHeader)) + '[' + (s.items || []).map((i) => clean(i.name)).join(', ') + ']').join(' | ');
const EXPECT_D48 = 'Main lift[Back squat] | Accessory A[Dumbbell walking lunge, Leg curl] | Chest + knee[Dumbbell lateral raise, Wall sit] | Core — Anti-rotation[Pallof press]';
const EXPECT_PLAIN = 'Main lift[Back squat] | Accessory A[Dumbbell walking lunge] | Chest + knee[Dumbbell lateral raise, Wall sit] | Core — Anti-rotation[Pallof press, Side plank]';

// ── the frozen budget corpus ────────────────────────────────────────────────────────────────────────────────────
// Every day capSessionBudget was handed while V196 (git 3f5d792, sha256 f20b7c39...) built 144 configs (six tiers x
// three goals x four injury states x focus and experience paired, rest sun+wed, seed 1013), deduplicated: 3,708 days.
// Captured once from V196, never from the app under test, so a draw ruling cannot move it. Stored compactly in
// tests/snapshots/session-budget-corpus.json (tables of distinct items, sections and cardio; section keys in their
// captured order; cardio reduced to the fields the budget reads: type, subtype, detail, dose, isNRC).
let corpus;
function budgetCorpus() {
  if (corpus === undefined) {
    const C = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'snapshots', 'session-budget-corpus.json'), 'utf8'));
    const sec = (i) => {
      const s0 = C.sections[i], s = {};
      for (const k of Object.keys(s0)) s[k] = k === 'items' ? s0.items.map((j) => ({ name: C.items[j][0], detail: C.items[j][1] })) : s0[k];
      return s;
    };
    corpus = C.days.map(([sl, ci]) => [sl.map(sec), ci < 0 ? null : C.cardio[ci]]);
  }
  return corpus;
}
/**
 * Replays the corpus through the app's capSessionBudget (each day with its own cardio, so the interference cap runs
 * too) and every item through _setCount and _itemCost; each stream is digested (sha256).
 */
function replayCorpus(IA) {
  const csb = IA.eval('capSessionBudget'), sc = IA.eval('_setCount'), ic = IA.eval('_itemCost');
  const outs = [], sets = [], costs = [];
  let moved = 0;
  for (const [secs, c] of budgetCorpus()) {
    const before = JSON.stringify(secs);
    const o = JSON.stringify(csb(JSON.parse(before), c === null ? undefined : clone(c)));
    outs.push(o);
    if (o !== before) moved++;
    for (const s of secs) for (const it of s.items || []) { sets.push(sc(it.detail)); costs.push(ic(it, null)); }
  }
  return { days: outs.length, trimmed: moved, items: sets.length, capSessionBudget: sha(outs.join('\n')), setCount: sha(sets.join(',')), itemCost: sha(costs.join(',')) };
}

// ── D195-B's two programs ───────────────────────────────────────────────────────────────────────────────────────
/**
 * PRT TING: the crossfit athletic-support pace-goal program the D195-B ruling printed (seed 87747), keys in the order
 * the ruling's measure wrote them (the program carries its config, so the digest reads the key order too).
 */
const PRT = {
  primaryPath: 'event', cardioTypes: ['run'], eventTargeted: true, experience: 'intermediate', ageBracket: '18-35', equipment: 'crossfit',
  unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185,
  name: 'PRT TING', liftingFocus: 'support_athletic', raceDate: '2026-10-20', seed: 87747,
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '0', baselineDist: '3', baseline: '3mi', targetDist: '1.5', targetMins: '10', targetSecs: '30' } },
};

module.exports = {
  CLOCK, DAYS, clone, clean, sha16, sha, appHtml, countIn, edit, reversed, variant, page, twice, liveSecs, cardLines, dayJ, weekKeys,
  COST_LENS, BUDGET_OFF_SWITCH, HIPEXT_A, noCostLens, noHipExtA, noD195, shMk, SH_EXPS, SH_SEEDS, SH_RESTS, SH_TIERS, SH_FAM,
  costLensShard, B3, B2, HINGE_HAND, itemsOf, daySig, costLensDiff, EQUIP, INJ, FOCUS, EXPER, SEEDS_WIDE, SEEDS_NARROW, WIDE, NARROW, SAMPLE,
  CORE_PER_BUILD, PREHAB_NAMES, V192_PREHAB, V192_PREHAB_SUM, V192_CORE_OFF_LONG_RUN, V192_NONOPT, V192_NONOPT_CLASSES,
  RULED_DELETABLE, V192_RULED_DEL, D85_DISPLACED_NAMES, V197_PREHAB_OTHER, V197_PREHAB_OTHER_SUM, D47_RAIL_PER_TIER,
  LEG_COMPOUND_CLASSES, V197_LEG_COMPOUND, V197_LEG_COMPOUND_SUM,
  census, tally, handSession, shape, EXPECT_D48, EXPECT_PLAIN, budgetCorpus, replayCorpus, PRT,
};
