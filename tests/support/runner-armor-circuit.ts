// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// Helpers for the runner armor circuit tests (tests/integration/runner-armor-circuit.test.js and
// tests/sweeps/runner-armor-circuit.test.js). Built on tests/support/session-budget.js (pages, variants, the D195
// counterfactuals, the coach's lattice constructor).
//
// HAND ORACLES (typed here, never asked of the app): the ruling's strings (the fourth item and its detail, the Tuesday
// calf and carry strings), HALF_MANNY's swap universe (86 names) and its W1 to W12 Tuesday circuits (typed once off
// V230, unchanged since), the three hand legs days and their hand-worked trims, the two typed cells' cards (coach's
// prints), g215's knee protect lattice and the floor (b) line.
import { progDigest } from './app.ts';
import * as SB from './session-budget.ts';
const { clone, clean, DAYS, liveSecs, cardLines } = SB;

const FOURTH = ['Single-leg hip thrust', '2×6–10 each @ RPE 7'];
const CALF_STR = 'YYY-YYY-YYY---';
const CARRY_STR = 'YYY-YYY-YYY---';
const CIRCUIT_RE = /^Leg circuit — runner armor/;
const UNIVERSE = [
  '45° back extension', 'Ab wheel rollouts', 'Back squat', 'Ball slams', 'Banded dorsiflexion', 'Banded monster walks', 'Banded side steps',
  'Barbell Romanian deadlift', 'Barbell bench press', 'Barbell good mornings', 'Barbell hip thrust', 'Barbell overhead press', 'Barbell push press',
  'Barbell row', 'Bench dips', 'Bird dogs', 'Broad jumps', 'Burpees', 'Chinups', 'Clamshells w/ band', 'Close-grip bench press', 'Dead bugs',
  'Deadlift', 'Decline pushups', 'Diamond pushups', 'Dips', 'Dumbbell Arnold press', 'Dumbbell Bulgarian split squat', 'Dumbbell bench press',
  'Dumbbell decline press', 'Dumbbell floor press', 'Dumbbell front raise', 'Dumbbell goblet side lunge', 'Dumbbell incline press',
  'Dumbbell lateral raise', 'Dumbbell rear delt fly', 'Dumbbell row', 'Dumbbell seated calf raise', 'Dumbbell skullcrushers',
  'Dumbbell split-stance deadlift', 'Dumbbell standing calf raise', 'Farmer carry', 'Feet-elevated inverted rows', 'Front squat',
  'Glute-ham raise', 'Hanging knee raises', 'Hip 90/90 stretch', 'Hip airplane (light KB)', 'IT band stretch', 'Incline barbell press',
  'Inverted rows (bodyweight)', 'Inverted rows (rings)', 'Jump squats', 'Kettlebell single-arm press', 'Kettlebell single-arm row',
  'Kettlebell single-leg deadlift', 'Kettlebell swing', 'L-sit chinups', 'L-sit hold', 'Landmine reverse lunge', 'Landmine rotational press',
  'Mountain climbers', 'Neutral-grip chinups', 'Overhead carry', 'Overhead dumbbell extension', 'Pendlay row', 'Plank hold', 'Pushups (slow tempo)',
  'Reverse lunge (KB)', 'Seated banded hip flexion', 'Single-leg bent-knee soleus raise', 'Single-leg hip thrust', 'Spanish squat hold (KB)',
  'Standing ankle CARs', 'Standing band hip abduction', 'Step-ups (KB)', 'Suitcase carry', 'Sumo deadlift', 'Terminal knee extension (band)',
  'Tibialis raise (wall lean)', 'Trap bar deadlift', 'Walking lunge (KB)', 'Wall sit', 'Weighted 90/90 hip switch', 'Weighted chinups',
  'Worlds greatest stretch',
];
/** HALF_MANNY's runner armor circuit on W1 to W12 Tuesday before the fourth item: lunge, hold, hinge ([name, detail]). */
const TUE = {
  1: [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Barbell Romanian deadlift', '2×6–10 @ RPE 7']],
  2: [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Barbell Romanian deadlift', '2×6–10 @ RPE 7']],
  3: [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell swing', '2×8']],
  4: [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell swing', '2×8']],
  5: [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Kettlebell swing', '2×8']],
  6: [['Dumbbell Bulgarian split squat', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Kettlebell swing', '2×8']],
  7: [['Walking lunge (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
  8: [['Walking lunge (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
  9: [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Dumbbell split-stance deadlift', '2×6–10 @ RPE 7']],
  10: [['Dumbbell goblet side lunge', '2×8–12 each @ RPE 7'], ['Spanish squat hold (KB)', '2×25 sec'], ['Dumbbell split-stance deadlift', '2×6–10 @ RPE 7']],
  11: [['Step-ups (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
  12: [['Step-ups (KB)', '2×8–12 each @ RPE 7'], ['Wall sit', '2×25 sec'], ['Kettlebell single-leg deadlift', '2×6–10 @ RPE 7']],
};
const hasSec = (day, re) => liveSecs(day).some((s) => re.test(clean(s.label)));
const circuit = (day) => liveSecs(day).find((s) => CIRCUIT_RE.test(clean(s.label))) || null;
const circuitItems = (day) => { const s = circuit(day); return s ? Array.from(s.items, (i) => [clean(i.name), clean(i.detail)]) : null; };

// ── the hand legs days (D195-A6 with D195-B's pricing) ──────────────────────────────────────────────────────────
// Pricing: a stretch costs 0; an _isHalf name (carry, wall sit, hold, plank, clamshell, side steps) or a member of the
// hip stability, knee stability or foot and ankle pools costs half its sets; anything else its sets. Cap with no
// cardio: 20. Trim score: (index 3 or later in a Leg circuit section ? 3 : section rank) x 10 + item rank (carry 2,
// wall sit or hold 1), ties to the later position. Main and Hip stability are protected; the carry finisher ranks 3;
// the optional core block ranks 3 while it holds two items and is protected at one (D48); the circuit, the calf and
// Foot & ankle rank 1. The three days differ only in protected sets, so only the stopping point moves.
function legsDay(mainN, stepsN, clamN) {
  const L = [
    { label: 'Main — Back squat', items: [{ name: 'Back squat', detail: mainN + '×12 — RPE 6.5' }] },
    { label: 'Leg circuit — runner armor', superset: true, rounds: 2, items: [
      { name: 'Step-ups (KB)', detail: '2×8–12 each @ RPE 6–7' }, // 2; score 10
      { name: 'Wall sit', detail: '2×25 sec' }, // 1 (half); the hold, 11
      { name: 'Kettlebell swing', detail: '2×8' }, // 2; hinge; 10
      { name: 'Single-leg hip thrust', detail: '2×6–10 each @ RPE 6–7' }] }, // 2; hip_ext; index 3, 30
    { label: 'Calf — achilles armor', items: [{ name: 'Dumbbell standing calf raise', detail: '2×12–15 each, slow 3-sec lower' }] }, // 2; the calf, 10
    { label: 'Hip stability', items: [ // protected
      { name: 'Clamshells w/ band', detail: clamN + '×15 each' }, { name: 'Banded side steps', detail: stepsN + '×15–20 each @ RPE 6–7' },
      { name: 'IT band stretch', detail: '2×30 sec each' }] },
    { label: 'Foot & ankle', items: [ // each 2 sets at half (the foot and ankle pool, D195-B); 10
      { name: 'Tibialis raise (wall lean)', detail: '2×20' }, { name: 'Single-leg bent-knee soleus raise', detail: '2×12 each, slow' }] },
    { label: 'Loaded carry finisher', optional: true, items: [{ name: 'Farmer carry', detail: '3×40 yards, heavy' }] }, // 1.5; 32
    { label: '', coreHeader: 'Core — Anti-Rotation', core: true, optional: true, items: [ // each 1.5; 30, the later position first
      { name: 'Side plank', detail: '3×30–45 sec each' }, { name: 'Plank shoulder taps', detail: '3×12 each' }] },
  ];
  // Main + circuit (2+1+2+2) + calf 2 + hip rail (clamN+stepsN) x 0.5 + foot and ankle (1+1) + carry 1.5 + core (1.5+1.5)
  return { L, hand: mainN + 7 + 2 + (clamN + stepsN) * 0.5 + 2 + 1.5 + 3 };
}
const CARRY = ['Loaded carry finisher', 'Farmer carry'], CORE2 = ['Core — Anti-Rotation', 'Plank shoulder taps'], THRUST = ['Leg circuit — runner armor', 'Single-leg hip thrust'];
const LEGS_DAYS = [
  // 20.5: the carry (32) leaves, 19, stop
  { total: 20.5, day: legsDay(3, 2, 2), gone: [CARRY] },
  // 22: the carry (20.5), then the core block's later item, which outranks the thrust's 30 by position (19), stop
  { total: 22, day: legsDay(4, 3, 2), gone: [CARRY, CORE2] },
  // 23.5: the carry (22), the spare core item (20.5), then the circuit's index-3 item (two posterior items on the day, so
  // the last-posterior floor does not hold it), 18.5, stop; the hold (11) and the calf (10) are never reached
  { total: 23.5, day: legsDay(5, 3, 3), gone: [CARRY, CORE2, THRUST] },
];

// ── the two typed cells (coach's INJ lattice constructor, cards printed by coach) ──────────────────────────────
const CELL_F1 = { tag: 'shoulder/protect | commercial | beginner | s1234 | sun,wed | race (run_half)', w: 2, d: 'tue',
  cfg: { name: 'M', primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half', label: 'run_half', mileBestMins: '8', mileBestSecs: '0', baselineDist: '3', baseline: '3mi' } }, eventTargeted: false, liftingFocus: 'support_prevention', experience: 'beginner', ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 1234, injury: { region: 'shoulder', tier: 'protect' } } };
const CELL_FH = { tag: 'shoulder/protect | test (run_base) | commercial | intermediate | s87747 | sat,sun', w: 3, d: 'mon',
  cfg: { name: 'M', primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base', label: 'run_base', mileBestMins: '8', mileBestSecs: '0', baselineDist: '3', baseline: '3mi' } }, eventTargeted: false, liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: ['sat', 'sun'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 87747, injury: { region: 'shoulder', tier: 'protect' } } };
const CARD_F1 = [
  'Main — Back squat :: Back squat 3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest',
  'Leg circuit — runner armor (SS 2) :: Step-ups (KB) 2×8–12 each @ RPE 6–7 | Wall sit 2×25 sec | Kettlebell swing 2×8 | Single-leg hip thrust 2×6–10 each @ RPE 6–7',
  'Calf — achilles armor :: Dumbbell standing calf raise 2×12–15 each, slow 3-sec lower',
  'Hip stability :: Clamshells w/ band 2×15 each | Banded side steps 2×15–20 each @ RPE 6–7 | IT band stretch 2×30 sec each',
  'Foot & ankle :: Tibialis raise (wall lean) 2×20 | Single-leg bent-knee soleus raise 2×12 each, slow',
  'Core — Anti-Rotation :: Side plank 3×30–45 sec each | Plank shoulder taps 3×12 each',
];
/** The same cell without D195 (parts A and B): the circuit's three, and no carry (coach's print of V230). */
const CARD_F1_THREE = CARD_F1.slice(0, 1)
  .concat(['Leg circuit — runner armor (SS 2) :: Step-ups (KB) 2×8–12 each @ RPE 6–7 | Wall sit 2×25 sec | Kettlebell swing 2×8'], CARD_F1.slice(2));
const CARD_FH = [
  'Main — Back squat :: Back squat 3×10 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest',
  'Leg circuit — runner armor (SS 2) :: Dumbbell Bulgarian split squat 2×8–12 each @ RPE 7 | Wall sit 2×25 sec | Barbell good mornings 2×6–10 @ RPE 7',
  'Calf — achilles armor :: Machine seated calf raise 2×12–15 each, slow 3-sec lower',
  'Hip stability :: Banded monster walks 2×12–15 each @ RPE 7 | Banded side steps 2×15–20 each @ RPE 7 | IT band stretch 2×30 sec each',
  'Foot & ankle :: Standing ankle CARs 2×5 each direction | Banded dorsiflexion 2×15 each',
  'Core — Rotational Power :: Landmine rotations 2×8–12 each @ RPE 7',
];
/** Without D195 the regional move cap cut the hold and the calf from this card (one V230 build, typed). */
const CARD_FH_THREE = [CARD_FH[0], 'Leg circuit — runner armor (SS 2) :: Dumbbell Bulgarian split squat 2×8–12 each @ RPE 7 | Barbell good mornings 2×6–10 @ RPE 7',
  CARD_FH[3], CARD_FH[4], CARD_FH[5]];

// ── floor (b), g215's knee protect lattice ──────────────────────────────────────────────────────────────────────
const FB_TIERS = ['commercial', 'crossfit', 'home_full', 'home_basic', 'bodyweight'];
const FB_GOALS = [['run_5k', {}], ['run_half', {}], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '0' }], ['run_base', {}], ['run_10k', {}], ['run_marathon', {}]];
const FB_FOC = ['hypertrophy', 'strength', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const FB_EXPS = ['beginner', 'intermediate', 'advanced'];
const FB_RESTS = [['sun', 'wed'], ['sat', 'sun']];
const FB_SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
function fbMk(eq, gi, f, exp, age, si) {
  const [g, x] = FB_GOALS[gi % FB_GOALS.length];
  return { name: 'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: ['run'],
    cardioGoals: { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, x) },
    eventTargeted: false, liftingFocus: f, experience: exp, ageBracket: age, equipment: eq, unit: 'lbs', restDays: FB_RESTS[si % 2].slice(),
    days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: FB_SEEDS[si], injury: { region: 'knee', tier: 'protect' } };
}
/** 630 configs: five tiers x six goals x seven foci x three experiences, knee protect. */
function floorBLattice() {
  const out = [];
  for (const eq of FB_TIERS) FB_GOALS.forEach((_, gi) => FB_FOC.forEach((f, fi) => FB_EXPS.forEach((e, ei) => {
    const si = (gi + fi + ei) % 2;
    out.push({ eq, f, cfg: fbMk(eq, gi, f, e, si ? '55+' : '18-35', si) });
  })));
  return out;
}
const FB_FROM = "(_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left";
/** The app with floor (b) written out. */
const noFloorB = () => SB.variant('no-floor-b', [[FB_FROM, '_left']]);
/** Which configs floor (b) moves: the program differs from the one built without it. */
function floorBFires(rows) {
  const C = SB.page(), Q = SB.page(noFloorB());
  const r = { built: 0, crashed: [], count: {}, fire: {}, prevN: 0, prevFire: 0 };
  FB_TIERS.forEach((t) => { r.count[t] = 0; r.fire[t] = 0; });
  for (const x of rows) {
    r.count[x.eq]++;
    const pv = x.f === 'support_prevention';
    if (pv) r.prevN++;
    let a, b;
    try { a = progDigest(C.buildProgram(clone(x.cfg))); b = progDigest(Q.buildProgram(clone(x.cfg))); } catch (e) { r.crashed.push(e.message); continue; }
    r.built++;
    if (a !== b) { r.fire[x.eq]++; if (pv) r.prevFire++; }
  }
  return r;
}

// ── the prevention shard (D195-A-b, A-f) ────────────────────────────────────────────────────────────────────────
// FULL: support_prevention at seeds 76308 and 87747, both rests, six tiers, three families, three experiences (216).
// INJ: support_prevention on shoulder, elbow, knee and ankle protect, commercial and bodyweight, three families, two rests
// (48), the experience and seed coach's INJ counter gave each cell. LB (universe only): bodyweight low back protect and
// workaround, race and test families, two rests (8).
const SH_FOC = ['hypertrophy', 'strength', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const SH_REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'], SH_ITIERS = ['workaround', 'protect'];
const SH_INJ_REGS = ['shoulder', 'elbow', 'knee', 'ankle'], SH_INJ_EQ = ['commercial', 'bodyweight'];
const RUNNER = { race: true, test: true, none: false };
const BED_THRUST = 'Single-leg hip thrust (shoulders on bed)';
function preventionShard() {
  const out = [];
  for (const f of SH_FOC) for (const fam of Object.keys(SB.SH_FAM)) for (const eq of SB.SH_TIERS) for (let ei = 0; ei < 3; ei++) for (let si = 0; si < 4; si++) for (let ri = 0; ri < 2; ri++) {
    if (f === 'support_prevention' && [76308, 87747].includes(SB.SH_SEEDS[si])) out.push({ L: 'FULL', ab: true, fam, eq, inj: 'none', c: SB.shMk(f, fam, eq, ei, si, ri, null) });
  }
  let k = 0;
  for (const r of SH_REGS) for (const t of SH_ITIERS) for (const f of SH_FOC) for (const fam of Object.keys(SB.SH_FAM)) for (const eq of SB.SH_TIERS) for (let ri = 0; ri < 2; ri++) {
    const ei = k % 3, si = (k >> 1) % 4;
    k++;
    if (f !== 'support_prevention') continue;
    if (t === 'protect' && SH_INJ_REGS.includes(r) && SH_INJ_EQ.includes(eq)) out.push({ L: 'INJ', ab: true, fam, eq, inj: r + '/' + t, c: SB.shMk(f, fam, eq, ei, si, ri, { region: r, tier: t }) });
    else if (r === 'lowback' && eq === 'bodyweight' && fam !== 'none') out.push({ L: 'INJ-LB', ab: false, fam, eq, inj: r + '/' + t, c: SB.shMk(f, fam, eq, ei, si, ri, { region: r, tier: t }) });
  }
  out.forEach((x) => { x.tag = x.L + ' ' + [x.fam, x.eq, x.inj, x.c.experience, 's' + x.c.seed, x.c.restDays.join(',')].join('|'); });
  return out;
}
const lab = (s) => clean((s && (s.label || s.coreHeader)) || '');
const dayItems = (day) => { const o = []; liveSecs(day).forEach((s) => { const lb = lab(s), core = !!(s.core || s.coreHeader); (s.items || []).forEach((it) => { if (it && it.name) o.push({ k: lb + ' :: ' + clean(it.name) + ' :: ' + clean(it.detail || ''), lab: lb, core }); }); }); return o; };
const circuitLines = (s) => (s ? Array.from(s.items, (i) => clean(i.name) + ' :: ' + clean(i.detail || '')) : []);
const mdiff = (a, b) => { const m = {}; b.forEach((x) => (m[x] = (m[x] || 0) + 1)); return a.filter((x) => { if (m[x]) { m[x]--; return false; } return true; }); };
/**
 * Each config built on the app (C) and on the app without D195-A (N, the A step's own before), on fresh pages, N built
 * twice. For every leg day (either app carries the runner armor circuit) the day's items, the circuit, the calf and
 * the byte form are kept; each program's swap universe is kept on both apps.
 */
function shardBuild(rows) {
  const XC = SB.page(), XN = SB.page(SB.noHipExtA()), XN2 = SB.page(SB.noHipExtA());
  const bld = (X, c) => { try { return X.buildProgram(clone(c)); } catch (e) { return { __crash: e.message, weeks: {} }; } };
  const out = [];
  for (const x of rows) {
    const pc = bld(XC, x.c), pn = bld(XN, x.c), pn2 = bld(XN2, x.c);
    const rec = { x, runner: RUNNER[x.fam], crash: [pc, pn, pn2].filter((p) => p.__crash).map((p) => p.__crash), days: [],
      self: !pn.__crash && !pn2.__crash && progDigest(pn) === progDigest(pn2),
      uC: new Set(pc._swapUniverse || []), uN: new Set(pn._swapUniverse || []), hasU: Array.isArray(pc._swapUniverse) && Array.isArray(pn._swapUniverse) };
    if (x.ab && !rec.crash.length) {
      const wks = [...new Set(Object.keys(pn.weeks || {}).concat(Object.keys(pc.weeks || {})))].sort((a, b) => a - b);
      for (const w of wks) for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
        const N = ((pn.weeks || {})[w] || {})[d], C = ((pc.weeks || {})[w] || {})[d], cn = circuit(N), cc = circuit(C);
        if (!cn && !cc) continue;
        rec.days.push({ tag: x.tag + ' W' + w + ' ' + d, Ni: circuitLines(cn), Ci: circuitLines(cc), labC: cc ? lab(cc) : '', rn: cn ? cn.rounds : null, rc: cc ? cc.rounds : null,
          calfN: hasSec(N, /^Calf — achilles/), calfC: hasSec(C, /^Calf — achilles/), iN: dayItems(N), iC: dayItems(C), same: SB.dayJ(N) === SB.dayJ(C) });
      }
    }
    out.push(rec);
  }
  return out;
}
/** One leg day read against the A step's before: what A added and removed, and whether the circuit only grew at the end. */
function analyse(z) {
  const kn = z.iN.map((i) => i.k), kc = z.iC.map((i) => i.k), add = mdiff(kc, kn), rem = mdiff(kn, kc);
  const remIt = rem.map((k) => z.iN.find((i) => i.k === k));
  const remBad = remIt.filter((i) => !(/^Loaded carry finisher/.test(i.lab) || i.core));
  const coreEmptied = z.iN.some((i) => i.core) && !z.iC.some((i) => i.core);
  const head = JSON.stringify(z.Ci.slice(0, z.Ni.length)) === JSON.stringify(z.Ni);
  const appended = z.Ni.length > 0 && z.Ci.length === z.Ni.length + 1 && head;
  const addOK = !add.length || (add.length === 1 && appended && add[0] === z.labC + ' :: ' + z.Ci[z.Ci.length - 1]);
  const nm = (L) => L.map((q) => q.split(' :: ')[0]);
  const lit12 = JSON.stringify(nm(z.Ni).slice(0, 2)) === JSON.stringify(nm(z.Ci).slice(0, 2));
  const rounds = !(z.Ni.length && z.Ci.length) || z.rn === z.rc;
  return { add, rem, remIt, remBad, coreEmptied, appended, grew: z.Ci.length > z.Ni.length, addOK, lit12, rounds };
}

export {
  FOURTH, CALF_STR, CARRY_STR, CIRCUIT_RE, UNIVERSE, TUE, hasSec, circuit, circuitItems, LEGS_DAYS, CELL_F1, CELL_FH, CARD_F1, CARD_F1_THREE,
  CARD_FH, CARD_FH_THREE, cardLines, FB_TIERS, FB_FROM, floorBLattice, noFloorB, floorBFires, preventionShard, BED_THRUST, RUNNER, shardBuild, analyse,
};