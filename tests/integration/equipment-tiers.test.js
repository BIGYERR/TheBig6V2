'use strict';
// Equipment tiers and the exercise pool: what a tier does not own never prints on it, and a ruling that selects never
// deletes. Rulings: D42 (Landmine rotational press: name, pattern, injury behaviour, its shoulder-pool gear gate and the
// side a one-hand press prints), D43 (Dumbbell floor press), D44, D46-c, D47, D49 (the core pillar gear gates, the
// lowback pull, the wizard copy, the trim order), D70c and D150 (the inventory binds, the swap universe passes the
// lens), D149 (the GHD is a station), D196 (a band hip thrust falls to the plan's bodyweight hip extension).
//
// Oracles: inventories and pools typed by hand from the rulings and the tier copy, the implement a movement needs read
// from its name, hand-built sessions with hand-derived outcomes, typed cards, and copies of the app with one ruled line
// written out. This file runs samples; tests/sweeps/equipment-tiers.test.js runs the lattices.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, fixtures } = require('../support/app.js');
const D = require('../support/duplicate-movements.js');
const E = require('../support/equipment-tiers.js');

const IA = loadApp();
const SRC = D.appText();
const EXLIB = D.clone(IA.eval('EXLIB'));   // plain data: arrays from the app's realm never deep-equal host arrays
const filterOne = (name, region, tier, detail = '3×10') => {
  const out = IA.applyInjuryFilter([{ label: 'T', items: [{ name, detail }] }], region ? { injury: { region, tier } } : {});
  const it = out && out[0] && out[0].items && out[0].items[0];
  return it ? { name: it.name, detail: it.detail } : null;
};
const noComments = SRC.replace(/(^|\n)([ \t]*)\/\/[^\n]*/g, '$1$2').replace(/\/\*[\s\S]*?\*\//g, '');

// ══ D43: the dumbbell floor press; D42-b: the landmine is barbell-tier ═════════════════════════════════════════
const FP = 'Dumbbell floor press', LM = 'Landmine rotational press';

test('the floor press is the last member of both chest accessory pools, the earlier members unchanged', () => {
  assert.deepEqual(EXLIB.chest_acc, ['Dumbbell incline press', 'Dumbbell bench press', 'Dips', 'Pushups (slow tempo)', 'Diamond pushups', 'Dumbbell decline press', FP]);
  assert.deepEqual(EXLIB.chest_acc_joint, ['Dumbbell incline press', 'Dumbbell bench press', 'Machine chest press', 'Cable crossover', 'Pec deck', 'Dumbbell decline press', FP]);
  assert.equal(EXLIB.chest_acc.filter((x) => x === FP).length, 1);
  assert.equal(EXLIB.chest_acc_joint.filter((x) => x === FP).length, 1);
});

test('the new names carry no mid-word hyphen, dash or brand', () => {
  for (const n of [FP, LM]) {
    assert.doesNotMatch(n, /\S[-—–]\S/);
    assert.doesNotMatch(n, /nike/i);
  }
});

test('the floor press is a horizontal press and is not leg work', () => {
  assert.equal(IA._pattern(FP), 'hpress');
  const LEG_TOKENS = ['swing', 'clean', 'snatch', 'deadlift', 'romanian', 'rdl', 'good morning', 'hip thrust', 'hip extension', 'glute bridge', 'squat', 'lunge',
    'step-up', 'stepup', 'leg', 'calf', 'calves', 'glute', 'nordic', 'broad jump', 'box jump', 'jump', 'bound', 'skater', 'wall ball', 'sled', 'pistol'];
  assert.deepEqual(LEG_TOKENS.filter((t) => FP.toLowerCase().includes(t)), [], 'no leg token in the name');
  const legRx = IA.eval('_D18_LEG_RX');
  assert.equal(legRx.test(FP), false, 'the long-run leg pass does not strip it');
  assert.equal(legRx.test('Barbell hip thrust'), true, 'control: the pass still matches a hip thrust');
});

test('shoulder/workaround swaps the dumbbell bench to the floor press, with no self-map, chain or self-eaten target', () => {
  const plan = IA.eval('injuryPlan')({ injury: { region: 'shoulder', tier: 'workaround' } });
  const sw = D.clone(plan.swapNames);
  assert.equal(sw['Dumbbell bench press'], FP);
  const keys = Object.keys(sw);
  assert.deepEqual(keys.filter((k) => sw[k] === k), [], 'no self-map');
  assert.deepEqual(keys.filter((k) => Object.prototype.hasOwnProperty.call(sw, sw[k])), [], 'no chain');
  assert.deepEqual(keys.filter((k) => plan.dropNames && plan.dropNames.test(sw[k])), [], 'no target eaten by the same plan');
});

test('the injury filter swaps the bench, prints an RPE cap on it, drops the floor press under protect, and leaves a healthy bench alone', () => {
  const swapped = filterOne('Dumbbell bench press', 'shoulder', 'workaround');
  assert.equal(swapped && swapped.name, FP);
  assert.match(swapped.detail, /RPE/);
  assert.equal(filterOne(FP, 'shoulder', 'protect'), null);
  assert.equal(filterOne('Dumbbell bench press').name, 'Dumbbell bench press');
});

test('the landmine press prints only on barbell tiers, and the floor press on loaded tiers but never bodyweight', () => {
  const BARBELL = ['home_full', 'commercial', 'crossfit'], NO_BARBELL = ['bodyweight', 'minimal', 'home_basic'];
  const lm = {}, fp = {};
  for (const eq of BARBELL.concat(NO_BARBELL)) {
    lm[eq] = 0; fp[eq] = 0;
    for (const f of ['support_strength', 'support_athletic']) for (const seed of [76308, 11111, 4242, 909, 1234, 5678]) {
      const prog = IA.buildProgram({ name: 'GATE', experience: 'intermediate', ageBracket: '18-35', equipment: eq, unit: 'lbs', liftingFocus: f, restDays: ['sun'],
        days: D.DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed, primaryPath: 'event', cardioTypes: ['run'], eventTargeted: false,
        cardioGoals: { run: { id: 'run_base', label: 'Build Running Base', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' } } });
      for (const x of E.itemsOf(prog).items) { if (x.name === LM) lm[eq]++; if (x.name === FP) fp[eq]++; }
    }
  }
  for (const eq of NO_BARBELL) assert.equal(lm[eq], 0, 'no landmine on ' + eq);
  for (const eq of BARBELL) assert.ok(lm[eq] > 0, 'the landmine survives on ' + eq);
  assert.ok(fp.home_basic + fp.home_full + fp.commercial > 0, 'the floor press reaches the loaded tiers');
  assert.equal(fp.bodyweight, 0);
});

test('the shoulder pool\'s no-barbell branch is EXLIB.shoulder without the landmine, in order', () => {
  const line = SRC.split('\n').find((l) => /const shoulderAccPool\s*=/.test(l)) || '';
  const inner = (line.match(/\[([^\]]*)\]/) || [null, ''])[1];
  assert.deepEqual(inner.split(',').map((x) => x.trim().replace(/^'|'$/g, '')), ['Barbell overhead press', 'Dumbbell Arnold press', 'Kettlebell single-arm press', 'Dumbbell lateral raise', 'Barbell push press']);
  assert.match(line.replace(/\s/g, ''), /hasBarbell\?EXLIB\.shoulder/);
});

// ══ D42: Landmine rotational press, name, pattern, injury behaviour ════════════════════════════════════════════
test('the landmine press is a horizontal press; rotational core drills keep their own verdicts', () => {
  const table = [[LM, 'hpress'], ['Landmine rotations', null], ['Pallof press', null], ['Windshield wipers', null], ['Thoracic rotations', null],
    ['Landmine reverse lunge', 'lunge'], ['Barbell overhead press', 'vpress'], ['Kettlebell single-arm press', 'vpress'], ['Barbell bench press', 'hpress']];
  for (const [n, want] of table) assert.equal(IA._pattern(n), want, n);
  assert.notEqual(IA._pattern(LM), 'vpress');
});

test('the landmine press ends EXLIB.shoulder and lives in no other pool', () => {
  assert.deepEqual(EXLIB.shoulder, ['Barbell overhead press', 'Dumbbell Arnold press', 'Kettlebell single-arm press', 'Dumbbell lateral raise', 'Barbell push press', LM]);
  assert.deepEqual(Object.keys(EXLIB).filter((k) => Array.isArray(EXLIB[k]) && EXLIB[k].includes(LM)), ['shoulder']);
});

const verdict = (name, region, tier) => {
  const it = filterOne(name, region, tier, '3×5');
  if (!it) return 'DROPPED';
  if (it.name !== name) return 'SWAPPED:' + it.name;
  return /RPE 7/.test(it.detail || '') ? 'CAPPED' : 'KEPT';
};

test('the injury plans treat the landmine press by doctrine: lowback drops it by name, shoulder and elbow through the press pattern', () => {
  const MATRIX = [['lowback', 'protect', 'DROPPED'], ['lowback', 'workaround', 'DROPPED'], ['shoulder', 'protect', 'DROPPED'], ['shoulder', 'workaround', 'CAPPED'],
    ['elbow', 'protect', 'DROPPED'], ['elbow', 'workaround', 'CAPPED'], ['knee', 'protect', 'KEPT'], ['knee', 'workaround', 'KEPT'],
    ['ankle', 'protect', 'KEPT'], ['ankle', 'workaround', 'KEPT'], ['hip', 'protect', 'KEPT'], ['hip', 'workaround', 'KEPT']];
  for (const [r, t, want] of MATRIX) assert.equal(verdict(LM, r, t), want, r + '/' + t);
  assert.equal(verdict(LM, null, null), 'KEPT', 'with no injury it survives untouched');
});

test('the lowback name filter leaves the rotational core drills alone', () => {
  for (const n of ['Landmine rotations', 'Landmine reverse lunge'])
    for (const t of ['protect', 'workaround']) assert.ok(['KEPT', 'CAPPED'].includes(verdict(n, 'lowback', t)), n + ' lowback/' + t);
});

test('the landmine rule is exact-anchored live code above the core exemption, with exactly two name filters', () => {
  const lines = noComments.split('\n');
  const iNew = lines.findIndex((L) => L.includes('/^landmine rotational press$/'));
  const iCore = lines.findIndex((L) => L.includes('hollow|rotation|curl-up'));
  assert.ok(iNew >= 0, 'the rule is live code');
  assert.ok(iCore >= 0 && iNew < iCore, 'the rule sits above the core exemption');
  // No loosened landmine-press regex anywhere. The one authored exception (D177 RR4) is the whole alternative
  // `landmine (reverse lunge|rotational press)` inside the _REP_FLOOR table, whose other alternatives carry no landmine
  // or press token.
  const LIT = 'landmine (reverse lunge|rotational press)';
  const rfAt = noComments.indexOf('const _REP_FLOOR=['), rfEnd = rfAt < 0 ? -1 : noComments.indexOf('\n];', rfAt);
  const authored = (r, at) => {
    if (rfAt < 0 || rfEnd < 0 || !(at > rfAt && at < rfEnd)) return false;
    const side = r.slice(1, -1).split(LIT);
    if (side.length !== 2) return false;
    if (!(side[0] === '' || side[0].slice(-1) === '|') || !(side[1] === '' || side[1].charAt(0) === '|')) return false;
    return !/landmine|press/i.test(side[0] + side[1]);
  };
  const loose = [], re = /\/[^/\n]*landmine[^/\n]*press[^/\n]*\//gi;
  for (let m; (m = re.exec(noComments));) if (m[0] !== '/^landmine rotational press$/' && !authored(m[0], m.index)) loose.push(m[0]);
  assert.deepEqual(loose, []);
  assert.equal((noComments.match(/\|landmine rotational\//g) || []).length, 2);
});

// ══ D42-c: a one-hand press in the shoulder slot prints a side ═════════════════════════════════════════════════
const SIDE = E.surveyShoulderSide(IA, E.shoulderLattice(3));

test('every one-hand press in the three shoulder slots prints a side, and no two-hand movement does (sample)', () => {
  assert.deepEqual(SIDE.errors, []);
  for (const site of ['S1', 'S2', 'S3']) {
    const t = SIDE.seen[site];
    const one = E.ONE_HAND.filter((n) => t[n]), two = E.TWO_HAND.filter((n) => t[n]);
    assert.ok(one.length > 0, site + ': a one-hand press reaches the slot');
    assert.ok(two.length > 0, site + ': a two-hand movement reaches the slot');
    for (const n of one) assert.equal(t[n].plain, 0, site + ' ' + n + ' printed no side');
    for (const n of two) assert.equal(t[n].each, 0, site + ' ' + n + ' printed a side');
  }
});

test('Mario\'s program prints a side on every one-hand shoulder prescription, and never hyphenates each', () => {
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  let n = 0, missing = 0, hyphen = 0;
  for (const wk of Object.keys(prog.weeks))
    for (const d of D.DAYS) {
      const day = prog.weeks[wk][d];
      for (const sec of (day && day.sections) || []) {
        for (const it of sec.items || []) if (/-each\b|\beach-/.test(String(it.detail || ''))) hyphen++;
        const items = sec.items || [], label = String(sec.label || '');
        if (items.length !== 2 || !(/^Main — /.test(label) || label === 'Accessory') || !E.ONE_HAND.includes(D.clean(items[1].name))) continue;
        n++;
        if (!E.hasEach(items[1].detail)) missing++;
      }
    }
  assert.ok(n > 0, 'the reported case is still on the program');
  assert.equal(missing, 0);
  assert.equal(hyphen, 0);
});

// ══ D44 / D46-c / D47 / D49: the core pillar gear gates ════════════════════════════════════════════════════════
test('the gear lattice sweeps all six tiers, 288 cells, 48 per tier', () => {
  const L = E.gearLattice([1013, 3039, 76308]);
  assert.deepEqual(E.GEAR_EQUIP, ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit']);
  assert.equal(L.length, 288);
  for (const e of E.GEAR_EQUIP) assert.equal(L.filter((c) => c.equipment === e).length, 48, e);
});

const IA_OFF = loadApp();
IA_OFF.eval('var __BUDGET_OFF = true;');
const GS = E.surveyGear(IA, IA_OFF, E.gearLattice([1013]).filter((c) => / intermediate /.test(c.tag)));

test('the set budget can be bypassed to read the core draw', () => {
  assert.equal(IA_OFF.eval('!!globalThis.__BUDGET_OFF'), true);
  assert.equal(IA.eval('typeof __BUDGET_OFF==="undefined" || !__BUDGET_OFF'), true, 'the budget-live app is untouched');
});

test('no gated core movement prints on a tier without its implement, and each still prints where legal (sample)', () => {
  assert.deepEqual(GS.errors, []);
  assert.equal(GS.holes, 0, 'no item slot comes back empty');
  for (const g of E.GATED)
    for (const e of E.GEAR_EQUIP) if (!E.GEAR_TIERS[e][g.need]) assert.equal(E.countEq(GS.all[e], g.name), 0, g.name + ' on ' + e);
  for (const e of E.GEAR_EQUIP) if (!E.GEAR_TIERS[e].barbell) assert.equal(E.countBy(GS.all[e], /landmine/i), 0, 'landmine on ' + e);
  for (const n of E.UNGATED_CORE) for (const e of E.GEAR_EQUIP) assert.ok(E.countEq(GS.all[e], n) > 0, n + ' prints on ' + e);
});

test('every core finisher draws at least one item, and every tier draws three rotational members within its legal count (sample)', () => {
  assert.ok(GS.core.blocks > 0);
  assert.deepEqual(GS.core.empty, []);
  for (const e of E.GEAR_EQUIP) {
    const n = GS.core.rot[e].size;
    assert.ok(n >= 3 && n <= E.ROT_LEGAL[e], e + ' drew ' + n + ' (legal ' + E.ROT_LEGAL[e] + ')');
  }
});

test('a pulldown is a cable movement, and lowback/protect keeps a vertical pull on cable-less tiers (sample)', () => {
  const LB = GS.byInj['lowback/protect'].per;
  for (const e of E.GEAR_EQUIP) {
    if (E.GEAR_TIERS[e].cables) continue;
    assert.equal(E.countBy(GS.all[e], /\bpulldown\b/i), 0, 'pulldown on ' + e + ': ' + E.firstBy(GS.all[e], /\bpulldown\b/i));
    for (const r of LB[e]) assert.ok(r.items.some((x) => /chinup|chin-up|pullup|pull-up|pulldown|straight-arm/i.test(x.name)), r.tag);
  }
  assert.ok(E.countEq(LB.commercial, 'Straight-arm pulldown') > 0, 'commercial keeps the straight-arm pulldown');
});

const CARDS = E.wizardCards(SRC);

test('the five wizard equipment cards read verbatim, and the two D44 rewrote add no dash', () => {
  assert.deepEqual(Object.keys(CARDS).sort(), ['bodyweight', 'commercial', 'crossfit', 'home_basic', 'home_full']);
  assert.deepEqual(CARDS, {
    bodyweight: 'You, the floor, and something to pull on. No weights.',
    home_basic: 'Dumbbells, kettlebells, pull-up bar, bands. No barbell.',
    home_full: 'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands',
    commercial: 'Full gym — cables, machines, barbells, everything',
    crossfit: 'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands',
  });
  for (const id of ['home_full', 'crossfit']) assert.doesNotMatch(CARDS[id].replace(/pull-up|rower\/bike/g, ''), /—|–| - /);
});

test('a tier prescribed band work names bands on its card, and the banded prehab rail stays on home_full and crossfit (sample)', () => {
  const IS_BAND = /(?<!\bIT )\bband(ed|s)?\b/i;
  for (const e of E.GEAR_EQUIP) {
    if (!E.GEAR_TIERS[e].card || e === 'commercial') continue;   // commercial's card is open ended
    if (E.countBy(GS.all[e], IS_BAND) > 0) assert.match(CARDS[e], /\bbands\b/i, e);
  }
  for (const e of ['home_full', 'crossfit']) assert.ok(E.countBy(GS.all[e], IS_BAND) > 0, e);
});

test('over budget, an optional core finisher pays before the prehab rail; a fixed core section is protected (D47)', () => {
  const session = (optional) => [
    { label: 'Main', items: [{ name: 'Barbell back squat', detail: '6×5' }] },
    { label: 'Chest + knee', superset: true, items: [{ name: 'Dumbbell lateral raise', detail: '5×12' }, { name: 'Spanish squat hold (KB)', detail: '4×30 sec' }, { name: 'Wall sit', detail: '4×45 sec' }] },
    Object.assign({ label: '', core: true, coreHeader: 'Core — Rotational Power', items: [{ name: 'Standing torso rotations (slow)', detail: '5×10 each' }, { name: 'Side plank thread-the-needle', detail: '4×10 each' }] }, optional ? { optional: true } : {}),
  ];
  // Hand cost: squat 6 + raise 5 + squat hold 2 + wall sit 2 + torso rotations 5 + thread-the-needle 2 = 22 against 20.
  IA.ctx.__et_opt = session(true);
  IA.ctx.__et_fix = session(false);
  const opt = D.clone(IA.eval('capSessionBudget(__et_opt, null)')), fix = D.clone(IA.eval('capSessionBudget(__et_fix, null)'));
  const names = (secs, pred) => secs.filter(pred).reduce((a, s) => a.concat((s.items || []).map((i) => i.name)), []);
  const core = (s) => !!(s && s.core), rail = (s) => s && s.label === 'Chest + knee', main = (s) => s && s.label === 'Main';
  const count = (secs) => secs.reduce((a, s) => a + ((s && s.items) || []).length, 0);
  assert.ok(count(opt) < 6 && count(fix) < 6, 'the hand session is over budget');
  assert.ok(names(opt, core).length < 2, 'the optional finisher pays');
  assert.deepEqual(names(opt, rail), names(session(true), rail), 'the rail is intact');
  assert.equal(names(fix, core).length, 2, 'a fixed core section is protected');
  assert.ok(names(fix, rail).length < 3, 'with the core protected the rail pays');
  assert.equal(names(opt, main).length, 1);
  assert.equal(names(fix, main).length, 1);
});

test('the anti-rotation pillar holds the hand-counted legal members on every tier (D49)', () => {
  for (const e of E.GEAR_EQUIP) {
    assert.equal(E.AR_MEMBERS.filter((m) => m.need === null || E.GEAR_TIERS[e][m.need]).length, E.AR_LEGAL[e], e);
    assert.ok(E.AR_LEGAL[e] >= 2, e);
  }
});

test('the anti-rotation draw stays legal, varied and mixed static and dynamic on every tier (sample)', () => {
  for (const e of E.GEAR_EQUIP) {
    const ar = GS.core.ar[e];
    assert.ok(ar.blocks > 0, e);
    const illegal = [...ar.seen].filter((n) => { const m = E.AR_MEMBERS.find((x) => x.name === n); return m && m.need && !E.GEAR_TIERS[e][m.need]; });
    assert.deepEqual(illegal, [], e);
    assert.ok(ar.seen.size <= E.AR_LEGAL[e], e);
    assert.ok(ar.pairs.size >= 3, e + ' prints ' + ar.pairs.size + ' pairings');
    assert.ok(ar.statik > 0 && ar.statik < ar.blocks, e + ' static ' + ar.statik + ' of ' + ar.blocks);
  }
});

test('the D49 members keep one storage identity and the dose they inherit', () => {
  const sk = (n) => IA.exStoreKey(n);
  assert.equal(sk('Bird dog'), sk('Bird dogs'));
  for (const n of ['Bird dogs', 'Plank shoulder taps', 'Side plank', 'Pallof press']) {
    const alias = IA.eval('EX_KEY_ALIAS[_exSlugRaw(' + JSON.stringify(n) + ')]');
    assert.ok(alias === undefined || alias === null, n + ' is a terminal store key');
  }
  const dose = D.clone(IA.eval('(function(){var o={};(CORE_PILLARS.anti_rotation.items||[]).forEach(function(i){o[i.name]=i.detail;});return o;})()'));
  for (const n of ['Bird dogs', 'Plank shoulder taps']) assert.equal(dose[n], dose['Pallof press'], n);
  for (const e of E.GEAR_EQUIP) for (const r of GS.all[e]) for (const x of r.items) assert.doesNotMatch(x.name, /\bBird dog\b(?!s)|\bPlank shoulder tap\b(?!s)/);
});

// ══ D70c / D150: the inventory binds ══════════════════════════════════════════════════════════════════════════
const copyOf = (id) => { const m = SRC.match(new RegExp("\\{id:'" + id + "',[^}]*desc:'([^']*)'")); return m ? m[1] : null; };

test('the typed inventory agrees with every token the live tier copy states', () => {
  const rows = [['home_basic', /No barbell\./, 'BARBELL', 0], ['home_basic', /Dumbbells/, 'DUMBBELL', 1], ['home_basic', /kettlebells/, 'KETTLEBELL', 1], ['home_basic', /bands/, 'BAND', 1],
    ['home_full', /^Barbell\b/, 'BARBELL', 1], ['home_full', /dumbbells/, 'DUMBBELL', 1], ['home_full', /kettlebells/, 'KETTLEBELL', 1], ['home_full', /bands/, 'BAND', 1],
    ['commercial', /cables, machines/, 'CABLE', 1], ['commercial', /cables, machines/, 'MACHINE', 1], ['crossfit', /^Barbells\b/, 'BARBELL', 1], ['crossfit', /kettlebells/, 'KETTLEBELL', 1],
    ['crossfit', /wall balls/, 'MEDBALL', 1], ['crossfit', /bands/, 'BAND', 1], ['bodyweight', /No weights\./, 'DUMBBELL', 0], ['bodyweight', /No weights\./, 'KETTLEBELL', 0],
    ['bodyweight', /No weights\./, 'MEDBALL', 0], ['bodyweight', /No weights\./, 'WEIGHTED', 0]];
  for (const [t, rx, c, v] of rows) {
    assert.match(copyOf(t) || '', rx, t);
    assert.equal(E.OWNS[t][c], v, t + ' ' + c);
  }
  for (const t of ['home_full', 'crossfit']) assert.doesNotMatch(copyOf(t), /cable|machine/i, t);
});

test('the implement class read from a movement name: the typed table holds', () => {
  const table = [['Close-grip bench press', 'BARBELL'], ['Incline barbell press', 'BARBELL'], ['Barbell box squat', 'BARBELL'], ['Glute-ham raise', 'GHD'], ['45° back extension', 'GHD'],
    ['Bodyweight back extension', ''], ['Machine chest press', 'MACHINE'], ['Leg press', 'MACHINE'], ['Hack squat (machine)', 'MACHINE'], ['Pec deck', 'MACHINE'],
    ['Cable crossover', 'CABLE'], ['Cable pushdown', 'CABLE'], ['Face pull', 'CABLE'], ['Rope tricep extension', 'CABLE'], ['Dumbbell goblet squat', 'DUMBBELL'],
    ['Kettlebell goblet squat', 'KETTLEBELL'], ['Step-ups (KB)', 'KETTLEBELL'], ['Band pull-aparts', 'BAND'], ['Banded hip thrust', 'BAND'], ['Hamstring band stretch', ''],
    ['Preacher curl', 'MACHINE'], ['Medicine ball slam', 'MEDBALL'], ['Wall balls', 'MEDBALL'], ['Pushup variation (weighted)', 'WEIGHTED'], ['Pushups (slow tempo)', '']];
  for (const [n, want] of table) assert.equal(E.classOf(n), want, n);
});

const INV = E.inventoryLattice();
const IS = E.surveyInventory(IA, INV.filter((_, i) => i % 40 === 0), { swapSeeds: 1 });

test('no tier prints, keeps in its swap universe or offers on its swap sheet a thing it does not own (sample)', () => {
  assert.deepEqual(IS.errors, []);
  assert.equal(IS.undefinedNames, 0);
  assert.deepEqual(IS.unclassed, {}, 'every printed implement name has a class');
  for (const t of E.DENYING_TIERS) {
    const n = Object.keys(IS.denied).filter((k) => k.split('|').length === 2 && k.startsWith(t + '|')).reduce((a, k) => a + IS.denied[k], 0);
    assert.equal(n, 0, t + ': ' + IS.deniedEx[t]);
    assert.equal(IS.universe.bad[t] || 0, 0, t + ' universe: ' + IS.universe.ex[t]);
    assert.equal(IS.sheet.bad[t] || 0, 0, t + ' sheet: ' + IS.sheet.ex[t]);
  }
  assert.equal(IS.sheet.crash, 0);
});

test('HALF_MANNY\'s swap universe holds 86 names: commercial owns everything, so the lens removes none', () => {
  assert.equal((IA.buildProgram(fixtures.HALF_MANNY)._swapUniverse || []).length, 86);
});

test('the swap sheet withholds the front squat under every shoulder and elbow plan, and offers it with none', () => {
  let prog = null, day = null, wk = null, main = null;
  for (const sd of E.INV_SEEDS) {
    const p = IA.buildProgram(E.seedCfg('crossfit', 'strength', 'intermediate', '18-35', sd));
    if (!(p._swapUniverse || []).includes('Front squat')) continue;
    for (const w of Object.keys(p.weeks)) for (const d of D.DAYS) for (const s of ((p.weeks[w][d] && p.weeks[w][d].sections) || [])) {
      const it = (s.items || [])[0];
      if (!prog && /^Main — /.test(s.label || '') && it && /squat|leg press/i.test(D.clean(it.name)) && D.clean(it.name) !== 'Front squat') { prog = p; day = p.weeks[w][d]; wk = w; main = it.name; }
    }
    if (prog) break;
  }
  assert.ok(prog, 'a crossfit strength program holds the front squat in its universe and a squat main');
  const swapCandidates = IA.swapCandidates || IA.eval('swapCandidates');
  const offer = (patch) => E.candNames(swapCandidates(main, day, wk, Object.assign({}, prog, { cfg: Object.assign({}, prog.cfg, patch) }))).includes('Front squat');
  assert.equal(offer({}), true, 'control: offered with no plan');
  for (const [r, t] of [['shoulder', 'workaround'], ['shoulder', 'protect'], ['elbow', 'workaround'], ['elbow', 'protect']])
    assert.equal(offer({ injury: { region: r, tier: t } }), false, r + '/' + t);
});

// ══ D149: the GHD is a station ════════════════════════════════════════════════════════════════════════════════
test('the hand table puts both knee/protect floors on home_full and nowhere else', () => {
  assert.deepEqual(E.GHD_TIERS.filter((t) => E.floorA(t).fires), ['home_full']);
  assert.deepEqual(E.GHD_TIERS.filter((t) => E.floorB(t).fires), ['home_full']);
});

test('the aux swap lens reads the GHD station as the inventory does, on every tier', () => {
  const lens = IA.eval('_auxGearOK');
  for (const t of E.GHD_TIERS) for (const n of ['Glute-ham raise', '45° back extension']) assert.equal(!!lens(n, t), !!E.GHD_OWNS[t].GHD, n + ' on ' + t);
});

test('no GHD station name prints, sits in the universe or is offered on a tier without one (sample)', () => {
  const S = E.surveyStation(IA, E.ghdLattice().filter((x) => x.si === 0), null,
    { sheet: (x) => !x.inj && ['hypertrophy', 'balanced', 'strength'].includes(x.cfg.liftingFocus) });
  assert.deepEqual(S.errors, []);
  for (const t of E.GHD_DENIED) {
    assert.equal(S.items[t] || 0, 0, t + ': ' + S.ex[t]);
    assert.equal(S.uni[t] || 0, 0, t + ' universe');
    assert.equal(S.sheet[t] || 0, 0, t + ' sheet');
  }
  for (const t of E.GHD_HAS) assert.ok((S.items[t] || 0) > 0 && (S.uni[t] || 0) > 0, t + ' still prints and carries the station');
});

test('the knee/protect floors fire on home_full only, and its Main and Leg superset B stay in the hand sets (sample)', () => {
  const K = E.surveyKnee(E.kneeTrees(IA), E.kneeLattice().filter((_, i) => i % 18 === 0));
  assert.deepEqual(K.crash, []);
  for (const t of E.GHD_TIERS) {
    assert.equal(K.fa[t + '|crash'] || 0, 0);
    assert.equal(K.fb[t + '|crash'] || 0, 0);
    if (!E.floorA(t).fires) assert.equal(K.fa[t] || 0, 0, 'floor (a) never fires on ' + t);
    if (!E.floorB(t).fires) assert.equal(K.fb[t] || 0, 0, 'floor (b) never fires on ' + t);
  }
  assert.ok((K.fa.home_full || 0) > 0, 'floor (a) fires on home_full');
  assert.ok((K.fb.home_full || 0) > 0, 'floor (b) fires on home_full');
  assert.deepEqual(K.mainBad, []);
  assert.deepEqual(K.lsbBad, []);
  assert.equal(K.probeMismatch, 0, 'the reservation probe changes no program');
  assert.deepEqual(K.dupEx, [], 'no knee/protect day prints a movement twice');
});

// ══ D196: a band hip thrust falls to the plan's bodyweight hip extension ═══════════════════════════════════════
test('the app carries each of D196\'s five literals exactly once', () => {
  for (const t of E.D196_TEXTS) assert.equal(D.count(SRC, t), 1, t.trim().slice(0, 60));
});

test('the frozen lens reads the ruled names as the D196 measure printed them, and lowback caps hip extension', () => {
  const want = { 'Banded hip thrust': 'hip_ext', Burpees: null, [D.BRIDGE]: 'hip_ext', [D.BED]: 'hip_ext' };
  for (const n of Object.keys(want)) assert.equal(D.frozenPattern(n), want[n], n);
  assert.ok(E.CAP.lowback.protect.includes('hip_ext') && E.CAP.lowback.workaround.includes('hip_ext'));
});

const BW = E.bwLattice();
const D196 = E.d196App();

test('the five typed bodyweight cells read the ruled Mains, never Burpees', () => {
  for (const X of E.D196_CARDS) {
    const cell = BW.find((x) => x.k === X.k && (X.seed ? true : x.L === (X.k.endsWith('sat,sun') ? 'LBW' : 'L432')));
    assert.ok(cell, X.tag);
    const cfg = Object.assign(D.clone(cell.c), X.seed ? { seed: X.seed } : {});
    const p = D.pinDate(D.loadText(SRC, 'd196-cell'), E.D196_CLOCK).buildProgram(cfg);
    for (const [w, d] of X.at) assert.deepEqual(D.clone(E.mainCard(p, w, d)), X.want, X.tag + ' W' + w + ' ' + d);
  }
});

test('on the four D196 plans, no Main is Burpees, no capped hip extension lands uncapped, and no card holds both thrusts (sample)', () => {
  const S = E.surveyBodyweight(D196, BW.filter((x) => x.L === 'L432' && E.D196_PLANS.includes(x.k.split('|')[0])));
  assert.equal(S.mains, 0, S.mainsEx.join(' | '));
  assert.deepEqual(S.a2, []);
  for (const pl of E.D196_PLANS) {
    assert.equal(S.thrust[pl] || 0, 0, pl);
    assert.ok((S.land[pl] || 0) > 0, pl + ' prints its landing name');
  }
  assert.deepEqual(S.adj, []);
});
