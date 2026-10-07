#!/usr/bin/env python3
# post_v233_v1_convert.py: post-V233 tooling pass, conversion slice V1. Tests only: index.html is not touched,
# ia-version stays 233, no bump.
#
# Ruling (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 5; CLAUDE.md Proof scope,
# Row manifest and Version scope): every gate converted by hand prints its rows through the shared status helper
# tests/status.js, and every row a gate declares prints exactly one status line.
# Evidence (measure mR): g192_labelsync, g192_shoulder_side and g194_implement_and_range print nothing for a passing
# row; g195_wildcard prints 123 unkeyed lines and folds 175 DST-child rows into its counts without printing them.
#
# Diff class (V-a): gate printing routed through tests/status.js, assertions unchanged. Every condition, input,
# expected value and oracle below is the gate's own text; only the verdict's printing moves. Loops print through
# S.loop so a family of per-config checks (per tier, per site name, per title, per ruled string, per zone) is ONE line.
#
# Every anchor is asserted count==1 in the text as it stands at that step; the first miss aborts the whole script
# before any file is written.
import os, re, sys

R = '/Users/CanasBangin/Desktop/TheBig6V2'
G = os.path.join(R, 'tests', 'gates')
ID_RE = re.compile(r'^[A-Za-z]{1,6}[0-9][A-Za-z0-9.\-]*$')


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(state, name, old, new):
    t = state[name]
    n = t.count(old)
    if n != 1:
        die('%s: anchor count %d (want 1): %r' % (name, n, old[:120]))
    state[name] = t.replace(old, new, 1)


def js_list(ids, indent='  ', width=112):
    for i in ids:
        if not ID_RE.match(i):
            die('id outside the status.js grammar: ' + i)
    if len(set(ids)) != len(ids):
        die('duplicate id in a declare list')
    lines, cur = [], indent
    for i in ids:
        piece = "'" + i + "', "
        if len(cur) + len(piece) > width and cur.strip():
            lines.append(cur.rstrip())
            cur = indent
        cur += piece
    if cur.strip():
        lines.append(cur.rstrip())
    return '\n'.join(lines)


FILES = ['g192_labelsync.js', 'g192_shoulder_side.js', 'g194_implement_and_range.js', 'g195_wildcard.js']
st = {f: open(os.path.join(G, f), encoding='utf-8').read() for f in FILES}
for f in FILES:
    if "require('../status')" in st[f]:
        die(f + ' already requires tests/status.js: re-run on a converted tree')

SUMMARY_OLD = r"""fails.forEach(f => console.log('  FAIL ' + f));
console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);"""

# ═════════════════════════════ g192_labelsync ═════════════════════════════
F = 'g192_labelsync.js'
LS_IDS = ['C1-healthy-lattice', 'C2-vocab', 'C3-injured-builds', 'C4-injured-lattice', 'C5-claims', 'C6-primer',
          'C7-raceweek-primer', 'H1-swap-latch', 'H2-unexplained', 'D43-fires', 'D43-noleak', 'D43-negctl',
          'U1-swap-name', 'U2-swap-label', 'U3-spine-name', 'U4-spine-label', 'N1-healthy', 'N2-generic',
          'N3-idempotent']
rep(st, F, r"""let PASS = 0, FAIL = 0;
const fails = [];
function ok(){ PASS++; }
function bad(msg){ FAIL++; fails.push(msg); }
""", r"""// Every row prints through the shared status helper tests/status.js (post-V233 V1; CLAUDE.md Proof scope, Row
// manifest): one status line per declared id, and the per-build and per-tier families each print ONE loop line.
const S = require('../status')('g192_labelsync');
S.declare([
""" + js_list(LS_IDS) + r"""
]);
""")
rep(st, F, r"""if (healthySections > 500) ok(); else bad(`healthy control lattice too thin: ${healthySections} sections`);
if (VOCAB.size > 100) ok(); else bad(`movement vocabulary too thin: ${VOCAB.size} names`);
""", r"""S.check('C1-healthy-lattice', healthySections > 500, 'the healthy control lattice is thick enough to read the vocabulary off',
  `healthy control lattice too thin: ${healthySections} sections`);
S.check('C2-vocab', VOCAB.size > 100, 'the movement vocabulary read off the healthy lattice is thick enough',
  `movement vocabulary too thin: ${VOCAB.size} names`);
""")
rep(st, F, r"""const floorPress = {}, benchLeak = {};
""", r"""const floorPress = {}, benchLeak = {};
const LB = S.loop('C3-injured-builds', 'every shoulder workaround build on the injured lattice runs');
""")
rep(st, F, r"""    catch (e) { bad(`build threw equipment=${equipment} seed=${seed}: ${e.message}`); continue; }
""", r"""    catch (e) { LB.fail(`equipment=${equipment} seed=${seed}`, `build threw: ${e.message}`); continue; }
    LB.pass(`equipment=${equipment} seed=${seed}`);
""")
rep(st, F, r"""if (injSections > 500) ok(); else bad(`injured lattice too thin: ${injSections} sections`);
if (claims > 200) ok(); else bad(`too few heading claims to test: ${claims} — the gate is blind`);
if (primerClaims > 0) ok(); else bad('no Primer heading named a movement — the race-week case is untested');
if (raceWeekPrimer > 0) ok(); else bad('no race-week Primer heading named a movement — the reported case is untested');

if (swapMismatch === 0) ok();
else bad(`${swapMismatch}/${claims} headings name a movement the overlay RENAMED away (label latch):\n     ` + swapSamples.join('\n     '));

if (unexplained === 0) ok();
else bad(`${unexplained}/${claims} headings name a movement that is neither prescribed nor explained by the parked dropNames class:\n     ` + unexplainedSamples.join('\n     '));
""", r"""LB.done();
S.check('C4-injured-lattice', injSections > 500, 'the injured lattice is thick enough', `injured lattice too thin: ${injSections} sections`);
S.check('C5-claims', claims > 200, 'enough headings name a movement for the claim to be tested',
  `too few heading claims to test: ${claims} — the gate is blind`);
S.check('C6-primer', primerClaims > 0, 'some Primer heading names a movement',
  'no Primer heading named a movement — the race-week case is untested');
S.check('C7-raceweek-primer', raceWeekPrimer > 0, 'some race-week Primer heading names a movement',
  'no race-week Primer heading named a movement — the reported case is untested');

S.check('H1-swap-latch', swapMismatch === 0, 'no heading names a movement the overlay renamed away (the heading follows the item)',
  `${swapMismatch}/${claims} headings name a movement the overlay RENAMED away (label latch):\n     ` + swapSamples.join('\n     '));

S.check('H2-unexplained', unexplained === 0, 'every heading claim holds, or names a movement the overlay deletes (the parked dropNames class)',
  `${unexplained}/${claims} headings name a movement that is neither prescribed nor explained by the parked dropNames class:\n     ` + unexplainedSamples.join('\n     '));
""")
rep(st, F, r"""for (const e of DB_TIERS) {
  if (floorPress[e] > 0) ok();
  else bad(`D43: '${e}' shoulder/workaround never prescribed 'Dumbbell floor press' — the swap stopped firing`);
  if (benchLeak[e] === 0) ok();
  else bad(`D43: '${e}' shoulder/workaround still prescribed 'Dumbbell bench press' ${benchLeak[e]}× — the swap is leaking`);
}
{
  const healthyTiers = DB_TIERS.filter(e => healthyHasBench[e] > 0);
  if (healthyTiers.length > 0) ok();
  else bad('negative control blind: no healthy program on any dumbbell tier prescribes the bench press, so "the swap is overlay-only" is untested');
}
""", r"""const LF = S.loop('D43-fires', "D43 fires: every dumbbell tier's shoulder workaround program prescribes 'Dumbbell floor press'");
const LN = S.loop('D43-noleak', "D43 holds: no dumbbell tier's shoulder workaround program prescribes 'Dumbbell bench press'");
for (const e of DB_TIERS) {
  LF.check(floorPress[e] > 0, e, `D43: '${e}' shoulder/workaround never prescribed 'Dumbbell floor press' — the swap stopped firing`);
  LN.check(benchLeak[e] === 0, e, `D43: '${e}' shoulder/workaround still prescribed 'Dumbbell bench press' ${benchLeak[e]}× — the swap is leaking`);
}
LF.done(); LN.done();
{
  const healthyTiers = DB_TIERS.filter(e => healthyHasBench[e] > 0);
  S.check('D43-negctl', healthyTiers.length > 0, 'negative control: a healthy program on some dumbbell tier prescribes the bench press',
    'negative control blind: no healthy program on any dumbbell tier prescribes the bench press, so "the swap is overlay-only" is untested');
}
""")
rep(st, F, r"""  if (r && r.name === 'Dumbbell floor press') ok();
  else bad(`unit swapNames: expected 'Dumbbell floor press', got '${r && r.name}' — D43 swap did not fire`);
  if (r && r.label === 'Main — Dumbbell floor press') ok();
  else bad(`unit swapNames: heading stayed '${r && r.label}' — the label did not follow the item`);
""", r"""  S.check('U1-swap-name', r && r.name === 'Dumbbell floor press', "unit swapNames: the D43 swap renames the item to 'Dumbbell floor press'",
    `unit swapNames: expected 'Dumbbell floor press', got '${r && r.name}' — D43 swap did not fire`);
  S.check('U2-swap-label', r && r.label === 'Main — Dumbbell floor press', 'unit swapNames: the heading follows the renamed item',
    `unit swapNames: heading stayed '${r && r.label}' — the label did not follow the item`);
""")
rep(st, F, r"""  if (r && r.name === 'Dead bugs') ok();
  else bad(`unit SPINE_SWAP: expected 'Dead bugs', got '${r && r.name}' — spine-safe swap did not fire`);
  if (r && r.label === 'Core — Dead bugs') ok();
  else bad(`unit SPINE_SWAP: heading stayed '${r && r.label}' — the label did not follow the item`);
""", r"""  S.check('U3-spine-name', r && r.name === 'Dead bugs', "unit SPINE_SWAP: the spine-safe swap renames the item to 'Dead bugs'",
    `unit SPINE_SWAP: expected 'Dead bugs', got '${r && r.name}' — spine-safe swap did not fire`);
  S.check('U4-spine-label', r && r.label === 'Core — Dead bugs', 'unit SPINE_SWAP: the heading follows the renamed item',
    `unit SPINE_SWAP: heading stayed '${r && r.label}' — the label did not follow the item`);
""")
rep(st, F, r"""  if (h && h.name === 'Dumbbell bench press' && h.label === 'Main — Dumbbell bench press') ok();
  else bad(`negative control: healthy cfg rewrote '${h && h.label}' / '${h && h.name}'`);
""", r"""  S.check('N1-healthy', h && h.name === 'Dumbbell bench press' && h.label === 'Main — Dumbbell bench press',
    "negative control: a healthy athlete's card is untouched", `negative control: healthy cfg rewrote '${h && h.label}' / '${h && h.name}'`);
""")
rep(st, F, r"""  if (g && g.label === 'Pump' && g.name === 'Dumbbell floor press') ok();
  else bad(`negative control: generic heading became '${g && g.label}'`);
""", r"""  S.check('N2-generic', g && g.label === 'Pump' && g.name === 'Dumbbell floor press',
    'negative control: a heading that does not name the item is left exactly as written', `negative control: generic heading became '${g && g.label}'`);
""")
rep(st, F, r"""  if (twice[0].label === 'Main — Dumbbell floor press' && clean(twice[0].items[0].name) === 'Dumbbell floor press') ok();
  else bad(`idempotence: second pass produced '${twice[0].label}' / '${clean(twice[0].items[0].name)}'`);
""", r"""  S.check('N3-idempotent', twice[0].label === 'Main — Dumbbell floor press' && clean(twice[0].items[0].name) === 'Dumbbell floor press',
    'idempotence: a second pass of the filter changes nothing',
    `idempotence: second pass produced '${twice[0].label}' / '${clean(twice[0].items[0].name)}'`);
""")
rep(st, F, SUMMARY_OLD, 'S.summary();')

# ═════════════════════════════ g192_shoulder_side ═════════════════════════════
F = 'g192_shoulder_side.js'
SS_IDS = ['L1-builds', 'L2-lattice']
for s in ['S1', 'S2', 'S3']:
    SS_IDS += [s + '-onehand-side', s + '-onehand-reach', s + '-twohand-noside', s + '-twohand-reach']
SS_IDS += ['H1-halfmanny', 'C1-copy-each']
rep(st, F, r"""let PASS = 0, FAIL = 0;
const fails = [];
function ok(msg){ PASS++; }
function bad(msg){ FAIL++; fails.push(msg); }
""", r"""// Every row prints through the shared status helper tests/status.js (post-V233 V1; CLAUDE.md Proof scope, Row
// manifest): one status line per declared id; the per-build and per-name families each print ONE loop line.
const S = require('../status')('g192_shoulder_side');
S.declare([
""" + js_list(SS_IDS) + r"""
]);
""")
rep(st, F, r"""let builds = 0;
""", r"""let builds = 0;
const LB = S.loop('L1-builds', 'every lattice build runs');
""")
rep(st, F, r"""      catch (e) { bad(`build threw equipment=${equipment} focus=${liftingFocus} seed=${seed}: ${e.message}`); continue; }
      builds++;
""", r"""      catch (e) { LB.fail(`equipment=${equipment} focus=${liftingFocus} seed=${seed}`, `build threw: ${e.message}`); continue; }
      builds++;
      LB.pass(`equipment=${equipment} focus=${liftingFocus} seed=${seed}`);
""")
rep(st, F, r"""if (builds < 100) bad(`lattice too thin: only ${builds} builds`);
else ok('lattice built');
""", r"""LB.done();
S.check('L2-lattice', builds >= 100, 'the lattice built at least 100 programs', `lattice too thin: only ${builds} builds`);
""")
rep(st, F, r"""  // every one-hand press that reached this site must print a side, every time
  let oneHandSeen = 0;
  for (const n of ONE_HAND) {
    const m = table[n];
    if (!m) continue;
    oneHandSeen++;
    if (m.plain === 0) ok(`${site} ${n}`);
    else bad(`${SITE_LABEL[site]}: '${n}' printed NO side in ${m.plain}/${m.each + m.plain} occurrences`);
  }
  if (oneHandSeen === 0) bad(`${SITE_LABEL[site]}: no one-hand press ever reached this site — site MISSING or unreachable, gate is blind`);
  else ok(`${site} reached by ${oneHandSeen} one-hand press(es)`);

  // no two-hand movement may claim a side
  let twoHandSeen = 0;
  for (const n of TWO_HAND) {
    const m = table[n];
    if (!m) continue;
    twoHandSeen++;
    if (m.each === 0) ok(`${site} ${n} two-hand clean`);
    else bad(`${SITE_LABEL[site]}: two-hand '${n}' printed a side in ${m.each}/${m.each + m.plain} occurrences`);
  }
  if (twoHandSeen === 0) bad(`${SITE_LABEL[site]}: no two-hand movement reached this site — negative control is blind`);
  else ok(`${site} negative control: ${twoHandSeen} two-hand movement(s)`);
""", r"""  // every one-hand press that reached this site must print a side, every time
  const L1 = S.loop(site + '-onehand-side', `${SITE_LABEL[site]}: every one-hand press prints a side, every time`);
  let oneHandSeen = 0;
  for (const n of ONE_HAND) {
    const m = table[n];
    if (!m) continue;
    oneHandSeen++;
    L1.check(m.plain === 0, n, `${SITE_LABEL[site]}: '${n}' printed NO side in ${m.plain}/${m.each + m.plain} occurrences`);
  }
  L1.done();
  S.check(site + '-onehand-reach', oneHandSeen !== 0, `${SITE_LABEL[site]}: a one-hand press reaches this site`,
    `${SITE_LABEL[site]}: no one-hand press ever reached this site — site MISSING or unreachable, gate is blind`);

  // no two-hand movement may claim a side
  const L2 = S.loop(site + '-twohand-noside', `${SITE_LABEL[site]}: no two-hand movement prints a side`);
  let twoHandSeen = 0;
  for (const n of TWO_HAND) {
    const m = table[n];
    if (!m) continue;
    twoHandSeen++;
    L2.check(m.each === 0, n, `${SITE_LABEL[site]}: two-hand '${n}' printed a side in ${m.each}/${m.each + m.plain} occurrences`);
  }
  L2.done();
  S.check(site + '-twohand-reach', twoHandSeen !== 0, `${SITE_LABEL[site]}: negative control, a two-hand movement reaches this site`,
    `${SITE_LABEL[site]}: no two-hand movement reached this site — negative control is blind`);
""")
rep(st, F, r"""  if (n === 0) bad('HALF MANNY: no one-hand press in a shoulder slot — the reported case vanished, gate is blind');
  else if (missing === 0) ok(`HALF MANNY: ${n} one-hand shoulder prescriptions all print a side`);
  else bad(`HALF MANNY: ${missing}/${n} one-hand shoulder prescriptions print NO side`);
""", r"""  const HL = 'HALF MANNY: every one-hand shoulder prescription prints a side';
  if (n === 0) S.fail('H1-halfmanny', HL, 'HALF MANNY: no one-hand press in a shoulder slot — the reported case vanished, gate is blind');
  else S.check('H1-halfmanny', missing === 0, `${HL} (${n} prescriptions)`, `HALF MANNY: ${missing}/${n} one-hand shoulder prescriptions print NO side`);
""")
rep(st, F, r"""  if (badCopy === 0) ok('copy: no hyphenated each');
  else bad(`copy: ${badCopy} details hyphenate 'each'`);
""", r"""  S.check('C1-copy-each', badCopy === 0, "copy: no detail hyphenates 'each'", `copy: ${badCopy} details hyphenate 'each'`);
""")
rep(st, F, SUMMARY_OLD, 'S.summary();')

# ═════════════════════════════ g194_implement_and_range ═════════════════════════════
F = 'g194_implement_and_range.js'
IR_IDS = ['R1-ledgerModel', 'R2-mainLiftBlock',
          'D53-lbs', 'D53-kg', 'D53-noimpl', 'D53-flat', 'D53-expr',
          'D54-copy', 'D54-noimpl', 'D54-hyphen', 'D54-branch', 'D54-singlearm',
          'D55-primer-ladder', 'D55-primer-range', 'D55-lastset', 'D55-ready', 'D55-recency',
          'D55-ctlA', 'D55-ctlB', 'D55-ctlC', 'D55-struct']
rep(st, F, r"""let PASS = 0, FAIL = 0; const fails = [];
const ok = () => PASS++;
const bad = m => { FAIL++; fails.push(m); };

const ledgerModel = IA.eval('ledgerModel');
const buildMainLiftBlock = IA.eval('buildMainLiftBlock');
if (typeof ledgerModel !== 'function') bad('ledgerModel not reachable in the VM');
if (typeof buildMainLiftBlock !== 'function') bad('buildMainLiftBlock not reachable in the VM');
""", r"""// Every row prints through the shared status helper tests/status.js (post-V233 V1; CLAUDE.md Proof scope, Row
// manifest): one status line per declared id.
const S = require('../status')('g194_implement_and_range');
S.declare([
""" + js_list(IR_IDS) + r"""
]);

const ledgerModel = IA.eval('ledgerModel');
const buildMainLiftBlock = IA.eval('buildMainLiftBlock');
S.check('R1-ledgerModel', typeof ledgerModel === 'function', 'ledgerModel is reachable in the VM', 'ledgerModel not reachable in the VM');
S.check('R2-mainLiftBlock', typeof buildMainLiftBlock === 'function', 'buildMainLiftBlock is reachable in the VM',
  'buildMainLiftBlock not reachable in the VM');
""")
rep(st, F, r"""  if (d53Lbs.startsWith(want)) ok();
  else bad(`D53 lbs line: expected to start "${want}", got "${d53Lbs.slice(0, 90)}"`);
""", r"""  S.check('D53-lbs', d53Lbs.startsWith(want), 'D53: the lbs progress line reads the hand-rendered after-grid',
    `D53 lbs line: expected to start "${want}", got "${d53Lbs.slice(0, 90)}"`);
""")
rep(st, F, r"""  if (d53Kg.startsWith(wantKg)) ok();
  else bad(`D53 kg line: expected to start "${wantKg}", got "${d53Kg.slice(0, 90)}"`);
""", r"""  S.check('D53-kg', d53Kg.startsWith(wantKg), 'D53: the kg progress line reads the hand-rendered after-grid',
    `D53 kg line: expected to start "${wantKg}", got "${d53Kg.slice(0, 90)}"`);
""")
rep(st, F, r"""  if (!cl.length) ok();
  else bad(`D53 implement claim survives in the rendered progress line: ${JSON.stringify(cl)}`);
""", r"""  S.check('D53-noimpl', !cl.length, 'D53: the rendered progress line asserts no implement, in either unit',
    `D53 implement claim survives in the rendered progress line: ${JSON.stringify(cl)}`);
""")
rep(st, F, r"""  if (!d53Flat.includes(' up ') && d53Flat.includes('heaviest in week 2')) ok();
  else bad(`D53 no-gain control: got "${d53Flat.slice(0, 90)}"`);
""", r"""  S.check('D53-flat', !d53Flat.includes(' up ') && d53Flat.includes('heaviest in week 2'),
    'D53 negative control: with no gain the gain clause is absent entirely', `D53 no-gain control: got "${d53Flat.slice(0, 90)}"`);
""")
rep(st, F, r"""  if (!m) bad('D53: the progress-line expression is gone from the file');
  else if (!/on the bar/.test(m[0]) && (m[0].match(/\?/g) || []).length === 1) ok();
  else bad(`D53: progress-line expression grew a branch or kept the claim: ${m[0].trim()}`);
""", r"""  const L53 = 'D53: the progress-line expression keeps one conditional, the numeric gain test, and no implement claim';
  if (!m) S.fail('D53-expr', L53, 'D53: the progress-line expression is gone from the file');
  else S.check('D53-expr', !/on the bar/.test(m[0]) && (m[0].match(/\?/g) || []).length === 1, L53,
    `D53: progress-line expression grew a branch or kept the claim: ${m[0].trim()}`);
""")
rep(st, F, r"""  if (!seam) { bad('D54: the travel-overlay holds seam is gone from the file'); }
""", r"""  const D54L = {
    'D54-copy': 'D54: the ruled sentence is in the non-bodyweight branch',
    'D54-noimpl': 'D54: neither holds branch asserts an implement',
    'D54-hyphen': 'D54 copy rule: no mid-sentence hyphen or em-dash in the holds copy',
    'D54-branch': 'D54: the holds seam stays a two-branch bodyweight test',
    'D54-singlearm': 'D54: the single arm progression survives the reword',
  };
  // A missing seam turns every D54 row red by name (the old gate printed one FAIL and skipped the five checks).
  if (!seam) { Object.keys(D54L).forEach(id => S.fail(id, D54L[id], 'D54: the travel-overlay holds seam is gone from the file')); }
""")
rep(st, F, r"""    if (holdsGear.includes('Grab the heaviest load you can control and work in the 8 to 12 range.')) ok();
    else bad(`D54: the ruled sentence is not in the non-bodyweight branch: ${holdsGear.trim().slice(0, 120)}`);
""", r"""    S.check('D54-copy', holdsGear.includes('Grab the heaviest load you can control and work in the 8 to 12 range.'), D54L['D54-copy'],
      `D54: the ruled sentence is not in the non-bodyweight branch: ${holdsGear.trim().slice(0, 120)}`);
""")
rep(st, F, r"""    if (!cl.length) ok();
    else bad(`D54 implement claim in the travel overlay copy: ${JSON.stringify(cl)}`);
""", r"""    S.check('D54-noimpl', !cl.length, D54L['D54-noimpl'], `D54 implement claim in the travel overlay copy: ${JSON.stringify(cl)}`);
""")
rep(st, F, r"""    if (!/\w-\w/.test(body) && !body.includes('—')) ok();
    else bad(`D54 copy rule: mid-sentence hyphen or em-dash in the holds copy`);
""", r"""    S.check('D54-hyphen', !/\w-\w/.test(body) && !body.includes('—'), D54L['D54-hyphen'],
      `D54 copy rule: mid-sentence hyphen or em-dash in the holds copy`);
""")
rep(st, F, r"""    if (/_ovDraft\.equipment==='bodyweight'\s*$/.test(lines[0].trim()) && !/equipment===/.test(holdsGear)) ok();
    else bad(`D54: the holds branch grew an equipment conditional: ${lines[0].trim()}`);
""", r"""    S.check('D54-branch', /_ovDraft\.equipment==='bodyweight'\s*$/.test(lines[0].trim()) && !/equipment===/.test(holdsGear), D54L['D54-branch'],
      `D54: the holds branch grew an equipment conditional: ${lines[0].trim()}`);
""")
rep(st, F, r"""    if (holdsGear.includes('If that still feels easy, go single arm.')) ok();
    else bad('D54: "go single arm" was deleted; a ruling that rewords is not a ruling that deletes');
""", r"""    S.check('D54-singlearm', holdsGear.includes('If that still feels easy, go single arm.'), D54L['D54-singlearm'],
      'D54: "go single arm" was deleted; a ruling that rewords is not a ruling that deletes');
""")
rep(st, F, r"""  if (row) ok(); else bad('D55 primer-last: the lift fell out of the Range Ladder');
  if (row && row.lo === 8 && row.hi === 12) ok();
  else bad(`D55 primer-last: expected lo 8 hi 12 from week 1, got ${row && row.lo}–${row && row.hi}`);
""", r"""  S.check('D55-primer-ladder', row, 'D55 primer-last: the lift stays in the Range Ladder', 'D55 primer-last: the lift fell out of the Range Ladder');
  S.check('D55-primer-range', row && row.lo === 8 && row.hi === 12, "D55 primer-last: the range is week 1's 8 to 12",
    `D55 primer-last: expected lo 8 hi 12 from week 1, got ${row && row.lo}–${row && row.hi}`);
""")
rep(st, F, r"""  if (row && row.wt === 25 && JSON.stringify(row.sets) === '[6,6,6]') ok();
  else bad(`D55: sets/wt were redirected off the last session: wt=${row && row.wt} sets=${JSON.stringify(row && row.sets)}`);
  if (row && row.ready === false) ok();
  else bad('D55: `ready` is true, so the primer week is being scored against the range it was never given');
""", r"""  S.check('D55-lastset', row && row.wt === 25 && JSON.stringify(row.sets) === '[6,6,6]', 'D55 O5: sets and weight still come from the last session',
    `D55: sets/wt were redirected off the last session: wt=${row && row.wt} sets=${JSON.stringify(row && row.sets)}`);
  S.check('D55-ready', row && row.ready === false, 'D55: the primer week is not scored against a range it was never given',
    'D55: `ready` is true, so the primer week is being scored against the range it was never given');
""")
rep(st, F, r"""  if (row && row.lo === 8 && row.hi === 12) ok();
  else bad(`D55 recency: expected week 3's 8–12, got ${row && row.lo}–${row && row.hi} (walk is not backwards, or all is unsorted)`);
""", r"""  S.check('D55-recency', row && row.lo === 8 && row.hi === 12, 'D55: the most recent session that carries a range wins',
    `D55 recency: expected week 3's 8–12, got ${row && row.lo}–${row && row.hi} (walk is not backwards, or all is unsorted)`);
""")
rep(st, F, r"""  if (!r.ladder.length && r.plain.length === 1) ok();
  else bad(`D55 control A: a lift with no range anywhere reached the Range Ladder (ladder=${r.ladder.length})`);
""", r"""  S.check('D55-ctlA', !r.ladder.length && r.plain.length === 1, 'D55 control A: a lift with no range anywhere falls to Other Accessory Work',
    `D55 control A: a lift with no range anywhere reached the Range Ladder (ladder=${r.ladder.length})`);
""")
rep(st, F, r"""  if (row && row.lo === 8 && row.hi === 12 && row.wt === 35 && row.ready === true) ok();
  else bad(`D55 control B: normal case regressed: ${JSON.stringify(row)}`);
""", r"""  S.check('D55-ctlB', row && row.lo === 8 && row.hi === 12 && row.wt === 35 && row.ready === true,
    'D55 control B: a last session that carries the range behaves as before', `D55 control B: normal case regressed: ${JSON.stringify(row)}`);
""")
rep(st, F, r"""  if (r.mains.length === 1 && !r.ladder.length && !r.plain.length) ok();
  else bad(`D55 control C: main-slot routing changed (mains=${r.mains.length} ladder=${r.ladder.length} plain=${r.plain.length})`);
""", r"""  S.check('D55-ctlC', r.mains.length === 1 && !r.ladder.length && !r.plain.length, 'D55 control C: a main-slot lift still routes to mains',
    `D55 control C: main-slot routing changed (mains=${r.mains.length} ladder=${r.ladder.length} plain=${r.plain.length})`);
""")
rep(st, F, r"""  if (assigns === 2 && /if\(rng&&sets\.length\)/.test(seg) && /\blet rng=null;/.test(seg)) ok();
  else bad(`D55 structural: rng assignments=${assigns} (expected 2: the let and the loop), consumer intact=${/if\(rng&&sets\.length\)/.test(seg)}`);
""", r"""  S.check('D55-struct', assigns === 2 && /if\(rng&&sets\.length\)/.test(seg) && /\blet rng=null;/.test(seg),
    'D55 structural: rng is assigned only by its let and the loop, and the consumer still reads it',
    `D55 structural: rng assignments=${assigns} (expected 2: the let and the loop), consumer intact=${/if\(rng&&sets\.length\)/.test(seg)}`);
""")
rep(st, F, SUMMARY_OLD, 'S.summary();')

# ═════════════════════════════ g195_wildcard ═════════════════════════════
F = 'g195_wildcard.js'
# The DST lattice: (id, case name) for the 14 CASES rows, then (id, label prefix) for the other 11 lattice rows.
DST_CASES = [
    ('dst1-us-spring', 'spring-forward inside the window (US)'),
    ('dst2-us-fall', 'fall-back inside the window (US)'),
    ('dst3-eu-spring', 'spring-forward inside the window (EU)'),
    ('dst4-eu-fall', 'fall-back inside the window (EU)'),
    ('dst5-south-autumn', 'southern autumn inside the window'),
    ('dst6-south-spring', 'southern spring inside the window'),
    ('dst7-on-us-spring', 'startDate ON the US spring boundary'),
    ('dst8-on-us-fall', 'startDate ON the US fall boundary'),
    ('dst9-on-eu-spring', 'startDate ON the EU spring boundary'),
    ('dst10-on-south', 'startDate ON the southern boundary'),
    ('dst11-midweek', 'start mid-week (Thu)'),
    ('dst12-saturday', 'start on a Saturday'),
    ('dst13-year', 'year boundary'),
    ('dst14-leap', 'leap February'),
]
DST_OK = [
    ('dst15-sunday-wrap', 'dst: Sunday wrap'),
    ('dst16-rest-resolves', 'dst: a rest day still resolves'),
    ('dst17-sched-drops-rest', 'dst: scheduledDays really drops rest days'),
    ('dst18-before-start', 'dst: the day before the start resolves to null'),
    ('dst19-week1-monday', 'dst: the Monday of week 1 before the start'),
    ('dst20-first-day', 'dst: the first day of the program'),
    ('dst21-last-day', 'dst: the last day of the block'),
    ('dst22-after-end', 'dst: the day after the final week'),
    ('dst23-missing-day', 'dst: a missing day object'),
    ('dst24-no-start', 'dst: no startDate'),
    ('dst25-no-prog', 'dst: no activeProg'),
]
# Parent rows: (call, id, label prefix). call 'ok' or 'tryOk'; 'loop' rows are opened by hand below.
P = [
    ('ok', 'rest1-runs', "rest: completeWildcard runs'"),
    ('ok', 'rest2-comp', 'rest: ia_comp_ is byte-identical'),
    ('ok', 'rest3-hist', 'rest: ia_hist_ was never written'),
    ('ok', 'rest4-record', 'rest: ia_wild_ holds exactly one record'),
    ('ok', 'rest5-stamp', 'rest: the record carries a week and a day key'),
    ('ok', 'rest6-bydate', 'rest: the day is resolved by DATE'),
    ('ok', 'rest7-roundtrip', 'rest: the stamped day round-trips'),
    ('ok', 'rest8-streak', 'rest: the streak does not extend'),
    ('ok', 'rest9-count', 'rest: completedCount is unmoved'),
    ('ok', 'rest10-kicker', 'rest: the celebration fired with'),
    ('ok', 'rest11-sub', 'rest: the celebration says "Streak holds."'),
    ('ok', 'rest12-season', 'rest: the season banner cannot fire'),
    ('ok', 'rest13-nopr', 'rest: the celebration claims no PR'),
    ('ok', 'train1-handwalk', 'train: today is the last scheduled day'),
    ('ok', 'train2-runs', "train: completeWildcard runs'"),
    ('ok', 'train3-comp', 'train: ia_comp_ is byte-identical'),
    ('ok', 'train4-hist', 'train: ia_hist_ was never written'),
    ('ok', 'train5-pending', 'train: the prescribed session is still pending'),
    ('ok', 'train6-streak', 'train: the streak was 2 before'),
    ('ok', 'train7-count', 'train: completedCount still counts'),
    ('ok', 'train8-sub', 'train: the celebration says "Streak: 3."'),
    ('ok', 'train9-season', 'train: the season banner cannot fire'),
    ('ok', 'out1-runs', "outside: completeWildcard runs'"),
    ('ok', 'out2-logs', 'outside: the Wildcard still logs'),
    ('ok', 'out3-nostamp', 'outside: it refuses to stamp'),
    ('ok', 'out4-nowrite', 'outside: nothing reached'),
    ('tryOk', 'out5-nomark', 'outside: an unstamped record'),
    ('ok', 'strip1-render', 'strip: renderWeekView actually wrote'),
    ('ok', 'strip2-cells', 'strip: the rendered strip has a cell'),
    ('ok', 'strip3-mark', "strip: the Wildcard day ('"),
    ('ok', 'strip4-others', 'strip: every other day'),
    ('ok', 'strip5-one', 'strip: exactly one W mark'),
    ('ok', 'strip6-replace', 'strip: the W replaced the date number'),
    ('ok', 'strip7-nochk', 'strip: the Wildcard day is NOT marked'),
    ('ok', 'strip8-future', 'strip: a browsed future week'),
    ('ok', 'strip9-chkwins', 'strip: a completed day shows the check'),
    ('ok', 'wv1-rest-tag', "weekview/rest: the week view emits a .wc-tag block'"),
    ('ok', 'wv2-rest-copy', 'weekview/rest: the tag carries the ruled rest copy'),
    ('ok', 'wv3-rest-pos', 'weekview/rest: the tag sits BELOW'),
    ('ok', 'wv4-rest-lbl', 'weekview/rest: the tag label reads'),
    ('ok', 'wv5-train-tag', "weekview/train: the week view emits a .wc-tag block'"),
    ('ok', 'wv6-train-title', 'weekview/train: the tag names the real'),
    ('ok', 'wv7-train-norest', 'weekview/train: the rest copy is NOT used'),
    ('ok', 'wv8-empty', 'weekview: with an empty Wildcard store'),
    ('loop', 'det1-runs', None), ('loop', 'det2-tag', None), ('loop', 'det3-first', None),
    ('loop', 'det4-title', None), ('loop', 'det5-escape', None), ('loop', 'det6-notag', None),
    ('ok', 'stk1-handwalk', 'streak: the hand walk puts today last'),
    ('ok', 'stk2-control', 'streak/control: a skipped day with NO Wildcard'),
    ('ok', 'stk3-control-counts', 'streak/control: skippedCount is 1'),
    ('ok', 'stk4-rescue', 'streak/rescue: a Wildcard on a SKIPPED day'),
    ('ok', 'stk5-rescue-counts', 'streak/rescue: completedCount and skippedCount are unmoved'),
    ('ok', 'stk6-order', 'streak/rescue: skip-then-Wildcard'),
    ('ok', 'stk7-perday', 'streak/rescue: the rescue is per day'),
    ('ok', 'stk8-two', 'streak/rescue: two consecutive rescued skips'),
    ('ok', 'stk9-once', 'streak/precedence: a day holding BOTH'),
    ('ok', 'stk10-pending', 'streak: a Wildcard on a pending day starts'),
    ('ok', 'stk11-nocomp', 'streak: it did so without writing a completion'),
    ('ok', 'stk12-rest', 'streak/rest: a rest-day Wildcard neither'),
    ('ok', 'stk13-rest-sched', 'streak/rest: today’s rest day is absent'),
    ('ok', 'stk14-rest-skip', 'streak/rest: a skipped rest day carrying'),
    ('tryOk', 'src1-writers', 'source: completeWildcard calls no completion writer'),
    ('tryOk', 'src2-escalate', 'source: the Wildcard celebration cannot escalate'),
    ('tryOk', 'src3-completed', 'source: completedCount never reads'),
    ('tryOk', 'src4-skipped', 'source: skippedCount never reads'),
    ('tryOk', 'src5-refresh', 'source: refreshProgram cannot see'),
    ('tryOk', 'src6-noskip', 'source: no "skipped" string'),
    ('tryOk', 'mark1-svg', 'mark: flame plus a W'),
    ('ok', 'mark2-signal', 'mark: the W is painted in signal orange'),
    ('ok', 'mark3-glyph', 'mark: no new glyph was authored'),
    ('loop', 'copy1-ruled', None),
    ('ok', 'copy2-harvested', 'copy: every ruled string was actually harvested'),
    ('loop', 'copy3-hyphen', None),
    ('ok', 'copy4-nike', 'copy: no user-facing "Nike"'),
    ('ok', 'copy5-skipped', 'copy: the word "skipped" appears'),
    ('ok', 'copy6-claims', 'copy: no rendered Wildcard string claims'),
    ('ok', 'label1-mygoal', 'label: the rendered filter bar says'),
    ('ok', 'label2-pools', 'label: RAND_POOLS still has no endurance key'),
    ('tryOk', 'read1-counter', 'readers: the x/y counter'),
    ('tryOk', 'read2-badge', 'readers: the Done Before badge'),
    ('tryOk', 'read3-empty', 'readers: an empty store still offers'),
]
DST_IDS = [i for i, _ in DST_CASES] + [i for i, _ in DST_OK]
PARENT_IDS = [i for _, i, _ in P]

rep(st, F, r"""let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
function tryOk(name, fn) {
  try { const r = fn(); ok(name, r === true || (r && r.cond === true), r && r.detail); }
  catch (e) { fail++; console.log('FAIL ' + name + '  -> threw: ' + e.message); }
}
""", r"""// Every row prints through the shared status helper tests/status.js (post-V233 V1; CLAUDE.md Proof scope, Row
// manifest). The DST lattice child (section 12) declares DST_ROWS only. The parent declares its own rows, dst0-zones
// (one sub-result per zone) and one loop row per DST_ROWS id (one sub-result per zone), so each lattice claim prints
// ONE line in the parent however many zones it ran in. The helper is STAT: section 7 binds a local S and
// section 10 a local ST, both of which would shadow a shorter name.
const DST_ROWS = [
""" + js_list(DST_IDS) + r"""
];
const PARENT_ROWS = [
""" + js_list(PARENT_IDS) + r"""
];
const STAT = require('../status')(TZ_CHILD ? 'g195_wildcard dst child' : 'g195_wildcard');
STAT.declare(TZ_CHILD ? DST_ROWS : PARENT_ROWS.concat(['dst0-zones'], DST_ROWS));
function ok(id, name, cond, detail) { return STAT.check(id, cond, name, detail); }
function lok(L, sub, cond, detail) { return L.check(cond, sub, detail); }   // one sub-result of a loop row
function tryOk(id, name, fn) {
  let r, err = null;
  try { r = fn(); } catch (e) { err = e; }
  if (err) return STAT.fail(id, name, 'threw: ' + err.message);
  return ok(id, name, r === true || (r && r.cond === true), r && r.detail);
}
""")
# DST lattice ids
for i, name in DST_CASES:
    rep(st, F, "['" + name + "',", "['" + i + "', '" + name + "',")
rep(st, F, "  CASES.forEach(([name, start, tw]) => {", "  CASES.forEach(([id, name, start, tw]) => {")
rep(st, F, "    ok('dst[' + name + ' start ' + start + ']: every day of the block resolves to the hand calendar',",
    "    ok(id, 'dst[' + name + ' start ' + start + ']: every day of the block resolves to the hand calendar',")
for i, pre in DST_OK:
    rep(st, F, "ok('" + pre, "ok('" + i + "', '" + pre)
rep(st, F, r"""  runDstLattice();
  console.log('G195_TZ_SUMMARY ' + pass + ' ' + fail);
  process.exit(0);
""", r"""  runDstLattice();
  const r = STAT.summary({ exit: false });
  console.log('G195_TZ_SUMMARY ' + r.pass + ' ' + r.fail);
  process.exit(0);
""")
# rest7's no-stamp branch
rep(st, F, r"""  } else { fail++; console.log('FAIL rest: the stamped day round-trips to today’s calendar date  -> no stamp'); }
""", r"""  } else { STAT.fail('rest7-roundtrip', 'rest: the stamped day round-trips to today’s calendar date', 'no stamp'); }
""")
# section 6: six loop rows over the four titles
rep(st, F, r"""// not silently regress into broken markup.
[
""", r"""// not silently regress into broken markup.
const DET = {
  runs: STAT.loop('det1-runs', 'detail: openDetail ran and wrote the body'),
  tag: STAT.loop('det2-tag', 'detail: the body emits a .wc-tag block'),
  first: STAT.loop('det3-first', 'detail: the tag is the FIRST thing in the body'),
  title: STAT.loop('det4-title', 'detail: the tag interpolates the real title, escaped by hand-checked entity rules'),
  esc: STAT.loop('det5-escape', 'detail: no raw apostrophe or bare ampersand survived into the tag'),
  notag: STAT.loop('det6-notag', 'detail: with no Wildcard the body carries no tag'),
};
[
""")
for key, txt in [('runs', 'openDetail ran and wrote the body'), ('tag', 'the body emits a .wc-tag block'),
                 ('first', 'the tag is the FIRST thing in the body'),
                 ('title', 'the tag interpolates the real title, escaped by hand-checked entity rules'),
                 ('esc', 'no raw apostrophe or bare ampersand survived into the tag')]:
    rep(st, F, "ok('detail[' + title + ']: " + txt + "',", "lok(DET." + key + ", 'detail[' + title + ']',")
rep(st, F, r"""  ok('detail[' + title + ']: with no Wildcard the body carries no tag', detailHTML().indexOf('wc-tag') < 0, detailHTML().slice(0, 120));
});
""", r"""  lok(DET.notag, 'detail[' + title + ']', detailHTML().indexOf('wc-tag') < 0, detailHTML().slice(0, 120));
});
Object.keys(DET).forEach(k => DET[k].done());
""")
# section 10: the two per-string families
rep(st, F, r"""  Object.keys(RULED).forEach(k => {
    ok('copy/harvest: ' + k + ' reads exactly the ruled text', harvest[k] === RULED[k],
       JSON.stringify(harvest[k]) + ' expected ' + JSON.stringify(RULED[k]));
  });
""", r"""  const CR = STAT.loop('copy1-ruled', 'copy/harvest: every harvested Wildcard string reads exactly the ruled text');
  Object.keys(RULED).forEach(k => {
    lok(CR, 'copy/harvest: ' + k, harvest[k] === RULED[k],
       JSON.stringify(harvest[k]) + ' expected ' + JSON.stringify(RULED[k]));
  });
  CR.done();
""")
rep(st, F, r"""  HARVESTED.forEach(s => {
    ok('copy: no mid-sentence hyphen or dash in the rendered string "' + s + '"', !/\S\s*[—–-]\s*\S/.test(s), s);
  });
""", r"""  const CH = STAT.loop('copy3-hyphen', 'copy: no mid-sentence hyphen or dash in any harvested Wildcard string');
  HARVESTED.forEach(s => {
    lok(CH, 'the rendered string "' + s + '"', !/\S\s*[—–-]\s*\S/.test(s), s);
  });
  CH.done();
""")
# parent rows: ids onto every remaining ok / tryOk call
for call, i, pre in P:
    if call == 'loop':
        continue
    rep(st, F, call + "('" + pre, call + "('" + i + "', '" + pre)
# section 12: the zone fold
rep(st, F, r"""  TZ_LATTICE.forEach(tz => {
    let out = '', died = null;
""", r"""  const ZONES = STAT.loop('dst0-zones', 'dst: the lattice child ran to its summary and is clean in every zone');
  const byId = new Map(DST_ROWS.map(id => [id, []])), ranZones = [];
  TZ_LATTICE.forEach(tz => {
    let out = '', died = null;
""")
rep(st, F, r"""    if (!m) {
      fail++;
      console.log('FAIL dst[' + tz + ']: the lattice child printed no summary (crash is not a pass)  -> ' + (died || out.slice(-300)));
      return;
    }
    const cPass = +m[1], cFail = +m[2];
    out.split('\n').filter(l => l.indexOf('FAIL ') === 0).forEach(l => console.log('     [' + tz + '] ' + l));
    pass += cPass; fail += cFail;
    console.log('     dst[' + tz + ']: ' + cPass + ' pass / ' + cFail + ' fail (folded in)');
    ok('dst[' + tz + ']: the whole lattice is clean in this zone', cFail === 0, cFail + ' failing assertions');
  });
}

console.log('PASS ' + pass + ' FAIL ' + fail);
""", r"""    if (!m) {
      lok(ZONES, 'dst[' + tz + ']', false, 'the lattice child printed no summary (crash is not a pass): ' + (died || out.slice(-300)));
      return;
    }
    const cPass = +m[1], cFail = +m[2];
    out.split('\n').filter(l => l.indexOf('FAIL ') === 0).forEach(l => STAT.info('[' + tz + '] ' + l));
    ranZones.push(tz);
    out.split('\n').forEach(l => {
      const x = l.match(/^(PASS|FAIL) (\S+) (.*)$/);
      if (x && byId.has(x[2])) byId.get(x[2]).push({ tz, status: x[1], text: x[3] });
    });
    STAT.info('dst[' + tz + ']: the child printed ' + cPass + ' pass / ' + cFail + ' fail');
    lok(ZONES, 'dst[' + tz + ']', cFail === 0, cFail + ' failing assertions');
  });
  ZONES.done();
  // One line per lattice claim. Its sub-results are the zones whose child ran to a summary; a zone that printed no
  // status line, or more than one, for the claim is a failed sub-result.
  DST_ROWS.forEach(id => {
    const got = byId.get(id);
    const p = got.find(g => g.status === 'PASS');
    const L = STAT.loop(id, p ? p.text : 'dst lattice row ' + id + ' (no zone passed it)');
    ranZones.forEach(tz => {
      const z = got.filter(g => g.tz === tz);
      lok(L, tz, z.length === 1 && z[0].status === 'PASS', z.length ? z.map(g => g.status + ' ' + g.text).join(' | ') : 'no status line in this zone');
    });
    L.done();
  });
}

STAT.summary();
""")

# ── post-conditions: no old helper survives, every call carries a declared id ──
for f in ['g192_labelsync.js', 'g192_shoulder_side.js', 'g194_implement_and_range.js']:
    t = st[f]
    for pat in [r'\bok\(', r'\bbad\(', r'\bfails\b', r'\bPASS\+\+', r'\bFAIL\+\+', r'process\.exit\(FAIL']:
        if re.search(pat, t):
            die('%s: old helper survives: %s' % (f, pat))
t = st['g195_wildcard.js']
for pat in [r'\bpass\s*(\+\+|\+=)', r'\bfail\s*(\+\+|\+=)', r"console\.log\('FAIL", r"console\.log\('ok"]:
    if re.search(pat, t):
        die('g195_wildcard.js: old counter or print survives: ' + pat)
calls = re.findall(r"(?<![A-Za-z])(ok|tryOk)\(([^,]*),", t)
ids_used = []
for c, a in calls:
    a = a.strip()
    if c == 'ok' and a in ('id',):
        continue
    if c == 'ok' and a.startswith('id, '):
        continue
    if c == 'tryOk' and a == 'id':
        continue
    m = re.match(r"^'([^']+)'$", a)
    if not m:
        die('g195_wildcard.js: %s( call without a literal id: %r' % (c, a))
    ids_used.append(m.group(1))
want = set(PARENT_IDS) - {i for k, i, _ in P if k == 'loop'}
want |= {i for i, _ in DST_OK}
extra = set(ids_used) - want - {'rest7-roundtrip'}
missing = want - set(ids_used)
if extra or missing:
    die('g195_wildcard.js: id map mismatch: extra %s missing %s' % (sorted(extra), sorted(missing)))

if len(re.findall(r'\b(const|let|var)\s+STAT\b', st['g195_wildcard.js'])) != 1:
    die('g195_wildcard.js: STAT is bound more than once: the status helper would be shadowed')

for f in FILES:
    with open(os.path.join(G, f), 'w', encoding='utf-8') as fh:
        fh.write(st[f])
    print('wrote tests/gates/' + f)
print('ids: g192_labelsync %d, g192_shoulder_side %d, g194_implement_and_range %d, g195_wildcard %d parent + 1 zones + %d dst'
      % (len(LS_IDS), len(SS_IDS), len(IR_IDS), len(PARENT_IDS), len(DST_IDS)))
