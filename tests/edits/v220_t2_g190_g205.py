#!/usr/bin/env python3
# V220 test slice T2: the gate changes D176 (P-BARERX) and D173 (P-RECOVBANNER) call for in EXISTING test files.
# Test files only; index.html is not touched. Four anchors, every one asserted count==1 (and every new name
# asserted absent) before anything is written; the first miss aborts all four.
#   1. g190_rounds.js G11b: keyed to the pre-D176 era (ia-version <= 219); from 220 a named SKIP; an ia-version
#      that is not an integer FAILS. (p_barerx_ruling.md "Gates:" line and RE-BASELINE: era predicate <= 219.)
#   2. g190_rounds.js G11f (new, D176, ia-version >= 220): refStrip + ' reps' iff the gate's OWN literal copy of
#      the bare shape matches refStrip's remainder (never the app's _stripLeadingSets). Hand table plus every
#      numeric-rounds superset on the lattice, with a floor of >=1 bare and >=1 non-bare lattice row.
#      Named G11f, not G11e: g190 already has "G11e the round sentence is synthesized only with a real N".
#   3. sabotage/v190.json M4: re-anchored on the V220 _dispDetail line (count==1 on the tree). Intent kept
#      exactly: the member strip writes the rendered string into item.detail (the whole display expression
#      wrapped in (i.detail=...), as the V190 mutation wrapped it). Name, gate unchanged.
#   4. g205_pace_eve.js P4b/P4c: licensed by a SOURCE predicate (p_recovbanner_ruling.md §5): ON_SCREEN =
#      /activeProg\.legRecoveryNote/ over the file's existing comment-stripped SRC; else a named SKIP. P4a unchanged.
import sys, json
T = '/Users/CanasBangin/Desktop/TheBig6V2/tests/'

# ── 1. g190 G11b ────────────────────────────────────────────────────────────────
G11B_OLD = """  tryCheck('G11b rendered rows lose the leading count', () => {
    const d = details(renderSecs([SS3]));
    const want = SS3.items.map(i => refStrip(i.detail));
    return JSON.stringify(d) === JSON.stringify(want) ? true : 'want ' + JSON.stringify(want) + ' got ' + JSON.stringify(d);
  });
"""
G11B_NEW = """  // ERA (standing rulings 2/4). G11b is the pre-D176 contract: a round block's row is the bare remainder
  // refStrip leaves. D176 (V220, P-BARERX) appends ' reps' to a bare remainder, so from ia-version 220 G11b
  // SKIPs by name and G11f carries the row. An ia-version that is not an integer FAILS both; it never skips.
  const D176_ERA = 220, VER_OK = /^\\d+$/.test(String(IA.version)), VER = VER_OK ? parseInt(IA.version, 10) : NaN;
  if(!VER_OK) check('G11b era: ia-version is readable', false, 'ia-version ' + JSON.stringify(IA.version) + ' is missing or not an integer, so G11b cannot be keyed');
  else if(VER < D176_ERA) tryCheck('G11b rendered rows lose the leading count', () => {
    const d = details(renderSecs([SS3]));
    const want = SS3.items.map(i => refStrip(i.detail));
    return JSON.stringify(d) === JSON.stringify(want) ? true : 'want ' + JSON.stringify(want) + ' got ' + JSON.stringify(d);
  });
  else console.log("SKIP G11b: pre-D176 era; D176 appends ' reps' to a bare remainder, see G11f");
"""

# ── 2. g190 G11f, inserted after G11e and before G12 ─────────────────────────────
G12_HEAD = "\n  // ══ G12 — preventionDoseSweep owns the section and keeps the members in sync (D39-iv) ══\n"
G11F = """
  // ══ G11f — D176 (V220, P-BARERX): a bare remainder in a round block reads "N reps" ══
  // Oracle: refStrip (this file's reference parser, written from §5r) plus this gate's OWN literal copy of the
  // ruled bare shape, applied over refStrip and never over the app's _stripLeadingSets (the ruling says so).
  // Two populations: a HAND TABLE typed out below, and every numeric-rounds superset on the lattice, rendered
  // one section at a time (an identical section is rendered once). Floor: the lattice must show at least one
  // bare and at least one non-bare row, else FAIL; a population with no bare row cannot catch a lost ' reps'.
  const BARE_D176 = /^\\d+(\\s*[–-]\\s*\\d+)?$/;
  const wantD176 = d => { const r = refStrip(d); return r + (BARE_D176.test(r) ? ' reps' : ''); };
  if(!VER_OK) check('G11f era: ia-version is readable', false, 'ia-version ' + JSON.stringify(IA.version) + ' is missing or not an integer, so G11f cannot be keyed');
  else if(VER < D176_ERA) console.log('SKIP G11f: ia-version ' + VER + ' predates D176 (V' + D176_ERA + '); G11b carries the row');
  else {
    const SSF = { label:'Pump', superset:true, rounds:3, items:[
      { name:'Kettlebell swing', detail:'3×10' }, { name:'Goblet squat', detail:'3×8–12' },
      { name:'Pushups', detail:'3×12 each side' }, { name:'Plank', detail:'3×30 sec' },
      { name:'Dumbbell row', detail:'3 sets — RPE 8' } ] };
    const HAND = ['10 reps', '8–12 reps', '12 each side', '30 sec', 'RPE 8'];
    tryCheck('G11f hand table: a bare count or range gains " reps", every other remainder is untouched', () => {
      const f = SSF.items.map(i => wantD176(i.detail));
      if(JSON.stringify(f) !== JSON.stringify(HAND)) return 'oracle self-check: refStrip + BARE gives ' + JSON.stringify(f) + ', the hand table says ' + JSON.stringify(HAND);
      const d = details(renderSecs([SSF]));
      return JSON.stringify(d) === JSON.stringify(HAND) ? true : 'want ' + JSON.stringify(HAND) + ' got ' + JSON.stringify(d);
    });
    const seen = new Set(), ex = [];
    let secs = 0, rows = 0, bare = 0, nonBare = 0, mism = 0, rErr = 0;
    const lat = eachSection(LATTICE, (sec, where) => {
      if(!isSuperset(sec) || typeof sec.rounds !== 'number') return;
      const k = JSON.stringify(sec); if(seen.has(k)) return; seen.add(k); secs++;
      const want = (sec.items || []).map(i => wantD176(i && i.detail));
      (sec.items || []).forEach(i => { rows++; if(BARE_D176.test(refStrip(i && i.detail))) bare++; else nonBare++; });
      let d; try { d = details(renderSecs([sec])); } catch(e){ rErr++; if(ex.length < 3) ex.push(where + ' "' + sec.label + '" render threw ' + e.message); return; }
      if(JSON.stringify(d) !== JSON.stringify(want)){ mism++; if(ex.length < 3) ex.push(where + ' "' + sec.label + '" want ' + JSON.stringify(want) + ' got ' + JSON.stringify(d)); }
    });
    check('G11f lattice: every numeric-rounds superset row reads refStrip + " reps" iff the remainder is bare (' + secs + ' unique sections, '
          + rows + ' rows, ' + lat.built + ' builds)', mism === 0 && rErr === 0,
          mism + ' sections disagree, ' + rErr + ' render throws' + (ex.length ? ': ' + ex.join(' | ') : ''));
    check('G11f floor: the lattice shows at least one bare and one non-bare round-block row (' + bare + ' bare, ' + nonBare + ' non-bare)',
          bare >= 1 && nonBare >= 1, bare + ' bare, ' + nonBare + ' non-bare: the population cannot fail both ways');
  }
"""

# ── 3. sabotage/v190.json M4 ───────────────────────────────────────────────────
M4_OLD = r"""  "anchor": "const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||''):(i.detail||'');",
  "replacement": "const _dispDetail=(_ssRounds!=null&&!i._skipped)?(i.detail=_stripLeadingSets(i.detail||'')):(i.detail||'');",
"""
M4_NEW = r"""  "anchor": "const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||'').replace(/^\\d+(\\s*[–-]\\s*\\d+)?$/,'$& reps'):(i.detail||'');",
  "replacement": "const _dispDetail=(_ssRounds!=null&&!i._skipped)?(i.detail=_stripLeadingSets(i.detail||'').replace(/^\\d+(\\s*[–-]\\s*\\d+)?$/,'$& reps')):(i.detail||'');",
"""
# The decoded strings the JSON must carry (single backslashes, as the tree's line reads).
M4_ANCHOR_DEC = r"const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||'').replace(/^\d+(\s*[–-]\s*\d+)?$/,'$& reps'):(i.detail||'');"
M4_REPL_DEC   = r"const _dispDetail=(_ssRounds!=null&&!i._skipped)?(i.detail=_stripLeadingSets(i.detail||'').replace(/^\d+(\s*[–-]\s*\d+)?$/,'$& reps')):(i.detail||'');"

# ── 4. g205 P4b/P4c ────────────────────────────────────────────────────────────
P4_OLD = """ok('P4b no mid-sentence hyphen or em-dash in the note Mario reads', !/\\S\\s*[–—]\\s*\\S/.test(D36) && !/[a-z] - [a-z]/.test(D36), JSON.stringify(D36));
ok('P4c the note is short declarative sentences, no user-facing brand', !/Nike/i.test(D36) && D36.split('.').filter(s => s.trim()).length >= 2);
"""
P4_NEW = """// P-RECOVBANNER §5 (standing ruling 2): P4b/P4c are copy rules on a note Mario READS, so they are licensed by a
// SOURCE predicate, not a version number. The week view shows the note only while the comment-stripped source
// (SRC above) still reads activeProg.legRecoveryNote; once the banner is gone the string is an engine trace (the
// placement's branch marker, standing ruling 3) and P4b/P4c SKIP by name. P4a keeps running either way.
const ON_SCREEN = /activeProg\\.legRecoveryNote/.test(SRC);
if(ON_SCREEN){
  ok('P4b no mid-sentence hyphen or em-dash in the note Mario reads', !/\\S\\s*[–—]\\s*\\S/.test(D36) && !/[a-z] - [a-z]/.test(D36), JSON.stringify(D36));
  ok('P4c the note is short declarative sentences, no user-facing brand', !/Nike/i.test(D36) && D36.split('.').filter(s => s.trim()).length >= 2);
} else { skip += 2; console.log('SKIP P4b/P4c: the note left the week view (P-RECOVBANNER); the string is an engine trace'); }
"""

JOBS = [
  ('gates/g190_rounds.js', [(G11B_OLD, G11B_NEW, 'replace'), (G12_HEAD, G11F, 'before')],
   ['D176_ERA', 'VER_OK', 'BARE_D176', 'wantD176', 'G11f']),
  ('sabotage/v190.json', [(M4_OLD, M4_NEW, 'replace')], ['$& reps']),
  ('gates/g205_pace_eve.js', [(P4_OLD, P4_NEW, 'replace')], ['ON_SCREEN']),
]
out = {}
for f, edits, fresh in JOBS:
    s = open(T + f, encoding='utf-8').read()
    for nm in fresh:
        if s.count(nm) != 0:
            print('ABORT: %s already carries %r' % (f, nm)); sys.exit(3)
    for i, (a, b, mode) in enumerate(edits):
        n = s.count(a)
        print('%s anchor %d count %d :: %r' % (f, i, n, a.strip()[:70]))
        if n != 1:
            print('ABORT: %s anchor %d count %d' % (f, i, n)); sys.exit(2)
        s = s.replace(a, b, 1) if mode == 'replace' else s.replace(a, b + a, 1)
    out[f] = s
# M4 must still parse and carry exactly the decoded strings, with name and gate unchanged.
J = json.loads(out['sabotage/v190.json'])
m4 = [m for m in J if m['name'].startswith('M4 ')]
assert len(m4) == 1 and m4[0]['anchor'] == M4_ANCHOR_DEC and m4[0]['replacement'] == M4_REPL_DEC, 'M4 decode mismatch'
assert m4[0]['name'] == 'M4 -> G11: the member strip mutates item.detail instead of the rendered string' and m4[0]['gate'] == 'gates/g190_rounds.js'
assert len(J) == 8, 'v190.json row count moved'
for f in out:
    open(T + f, 'w', encoding='utf-8').write(out[f])
print('written ' + ', '.join(out))
