#!/usr/bin/env python3
# post_v233_d212_s1_g219_row.py — Post-V233 D212 follow-up, slice 1 of 2 (TESTS ONLY: index.html untouched, ia-version stays 233).
#
# Ruling: tests/measure/v233_rulings/post_v233_ruling_d212.md (coach D212; Mario concurred 2026-10-07). The forward form of
# g219's retired R2, v219 S4-D167's guard: a loaded delt-isolation accessory may print on two consecutive training days
# (outside Main/Primer/Power on the second) only when every other gear-legal member of the family already prints on one of
# the two cards; licensed > 0 (liveness). Oracle FAM is the ruling's hand table, typed here; healthy configs graded,
# injured counted as an INFO watch. Session siting: row key D212 in tests/gates/g219_d167_pairs.js, reading the CAND
# program the shard already builds (c.p), no new buildProgram call.
#
# Four edits, all in tests/gates/g219_d167_pairs.js:
#   1  header: FAM in ORACLES (1a); the D212 row in ROWS and the PARKED R2 note rewritten (1b)
#   2  DUR_ROWS gains 'D212' (REFUSED / SETUP FAILED fail it by name); the FAM hand table beside it
#   3  worker: D212 tally from c.p after the D171.T block, before `if(!LW) continue;`
#   4  report: the D212 ok() row and the INFO injured line, after D171.T and before done()
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
F = ROOT / 'tests' / 'gates' / 'g219_d167_pairs.js'
src = F.read_text(encoding='utf-8')

EDITS = []

# ── 1a ORACLES: FAM ──────────────────────────────────────────────────────────────────────────────
A1a = r'''//   LENS   hinge membership (D171.T) is read through the FROZEN V218 artifact's _pattern. The candidate's own lens
//          is never consulted.
'''
EDITS.append(('1a ORACLES FAM', A1a, A1a + r'''//   FAM    D212's delt-isolation family, a hand table typed from post_v233_ruling_d212.md (beside DUR_ROWS): Dumbbell
//          lateral raise, Dumbbell front raise, Dumbbell rear delt fly on every tier that has dumbbells (crossfit,
//          commercial, home_full, home_basic, minimal); commercial adds Cable lateral raise and Face pull; bodyweight has
//          no loaded member. Membership is by name (lower-cased); no lens (_pattern, isTrackableWeight) is consulted and
//          the build's own swap universe is never read. A tier missing from the table fails D212 by name.
'''))

# ── 1b ROWS: D212, and R2's PARKED note rewritten ────────────────────────────────────────────────
A1b = r'''//           failure)'; > 0 such items sit on a final Saturday.
//   K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1 and R2 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//        They pinned D167/D171 on the build pair (219 vs V218 and the XP transplant). PARKED (standing ruling 7):
//        R2's claim ("CAND calendar repeats sat>sun 28, sun>mon 6", v219 S4-D167's only guard) has no forward form
//        with an independent oracle (whether a swap was legal needs the build's own swap universe), and its count
//        form (a ceiling of 28 / 6) does not hold at 233: 36 / 6 from V226 (D188/D189, measure mE's bisect).
'''
B1b = r'''//           failure)'; > 0 such items sit on a final Saturday.
//   D212    FORWARD (R2's claim in forward form; v219 S4-D167's guard), healthy configs (x.ik === 'healthy'), CAND: for
//           every calendar pair (CAL) A -> B where both days train, an item on B outside a Main/Primer/Power section
//           whose name is in the config's FAM tier and anywhere on A's card (CARD) is a delt repeat. It is licensed only
//           when every other FAM member of that tier prints on A or B, else a violation. 0 violations, and licensed > 0
//           (liveness). Injured configs are counted and printed as an INFO watch, never graded. Reads the CAND program
//           the shard already builds (no extra build) and runs even when the legacy walk fails.
//   K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1 and R2 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//        They pinned D167/D171 on the build pair (219 vs V218 and the XP transplant). R2's claim ("CAND calendar
//        repeats sat>sun 28, sun>mon 6", v219 S4-D167's only guard) is now carried by D212's forward row above (coach
//        D212, Mario concurred 2026-10-07): the oracle is the athlete's gear (FAM), not the build's swap universe, so
//        R2's count form (a ceiling of 28 / 6, 36 / 6 from V226 under D188/D189) stays retired.
'''
EDITS.append(('1b ROWS D212 + R2 note', A1b, B1b))

# ── 2 DUR_ROWS + FAM hand table ──────────────────────────────────────────────────────────────────
A2 = r'''const DUR_ROWS = ['B0','F0','D1','D167.Z','D167.H','D171.T'];
'''
B2 = r'''const DUR_ROWS = ['B0','F0','D1','D167.Z','D167.H','D171.T','D212'];
// FAM (D212's oracle): the loaded delt-isolation family by equipment tier, hand-typed from post_v233_ruling_d212.md, never
// read from the engine. Dumbbells on every tier but bodyweight, cables only on commercial. Compared by lower-cased name.
const FAM_DB = ['Dumbbell lateral raise', 'Dumbbell front raise', 'Dumbbell rear delt fly'], FAM_CABLE = ['Cable lateral raise', 'Face pull'];
const FAM = { crossfit:FAM_DB, commercial:FAM_DB.concat(FAM_CABLE), home_full:FAM_DB, home_basic:FAM_DB, minimal:FAM_DB, bodyweight:[] };
const FAM_EXEMPT = /^(main|primer|power)/i;   // B's section label: a Main/Primer/Power item is outside the claim
'''
EDITS.append(('2 DUR_ROWS + FAM', A2, B2))

# ── 3 worker: D212 tally from c.p ────────────────────────────────────────────────────────────────
A3 = r'''    if(!LW) continue;
'''
B3 = r'''    // D212 (forward, CAND alone, before the LW gate so it runs when the legacy walk fails): a FAM member on B (outside
    // Main/Primer/Power) that is also on A's card is a repeat; licensed when every other member of the tier is on A or B.
    { const hk = x.ik === 'healthy' ? 'H' : 'INJ', fam = FAM[x.c.equipment]; bump('D212 cfg ' + hk);
      if(!fam){ bump('D212 tier unknown'); ex('D212 tier unknown', tag + ' equipment ' + x.c.equipment); }
      else { const famL = fam.map(s => s.toLowerCase()), cc = calOf(c.p); let licC = false, vioC = false;
        Object.keys(cc).map(Number).forEach(ix => { const a = cc[ix], b = cc[ix + 1]; if(!a || !b || !trains(a.y) || !trains(b.y)) return;
          const nA = namesOn(a.y), nB = namesOn(b.y), pt = a.d === 'sat' ? 'sat>sun' : a.d === 'sun' ? 'sun>mon' : 'interior';
          b.y.sections.forEach(sec => { if(FAM_EXEMPT.test(String((sec && sec.label) || ''))) return;
            ((sec && sec.items) || []).forEach(it => { const n = String((it && it.name) || '').toLowerCase(); if(!n || famL.indexOf(n) < 0 || !nA.has(n)) return;
              const miss = fam.filter(z => { const l = z.toLowerCase(); return l !== n && !nA.has(l) && !nB.has(l); });
              bump('D212 rep ' + hk + ' ' + pt);
              if(!miss.length){ bump('D212 lic ' + hk + ' ' + pt); licC = true; return; }
              bump('D212 vio ' + hk + ' ' + pt); vioC = true;
              ex(hk === 'H' ? 'D212 vio' : 'D212 inj vio', tag + (hk === 'H' ? '' : ' ' + x.ik) + ' W' + a.w + ' ' + a.d + ' > ' + b.d + ' ' + it.name + ' [' + sec.label + '] missing ' + miss.join(', ')); }); }); });
        if(licC) bump('D212 lic cfgs ' + hk); if(vioC) bump('D212 vio cfgs ' + hk); } }
    if(!LW) continue;
'''
EDITS.append(('3 worker D212', A3, B3))

# ── 4 report: the D212 row + INFO injured ────────────────────────────────────────────────────────
A4 = r'''exs('T unclamped'));
  done();
}
'''
B4 = r'''exs('T unclamped'));
  // D212 (forward form of R2; v219 S4-D167's guard): healthy configs graded; injured counted as a watch (INFO, never graded)
  { const B3 = ['sat>sun', 'sun>mon', 'interior'], s3 = p => B3.map(b => g(p + ' ' + b)), tot = p => s3(p).reduce((a, n) => a + n, 0);
    const rep = tot('D212 rep H'), lic = tot('D212 lic H'), vio = tot('D212 vio H'), unk = g('D212 tier unknown');
    ok('D212 FORWARD (every build >= 219, healthy configs): a loaded delt-isolation accessory (FAM hand table) printing again on the next training day outside Main/Primer/Power is licensed only when every other gear-legal family member prints on one of the two cards (' + rep + ' repeats on ' + g('D212 cfg H') + ' healthy configs, licensed ' + lic + ' [sat>sun/sun>mon/interior ' + s3('D212 lic H').join('/') + '] on ' + g('D212 lic cfgs H') + ' configs; licensed > 0)',
      vio === 0 && lic > 0 && unk === 0, 'violations ' + vio + ' [sat>sun/sun>mon/interior ' + s3('D212 vio H').join('/') + '] on ' + g('D212 vio cfgs H') + ' configs, licensed ' + lic + ', tier not in FAM ' + unk + exs('D212 vio') + exs('D212 tier unknown'));
    console.log('INFO D212 injured (watch, never graded): ' + g('D212 cfg INJ') + ' injured configs swept, ' + tot('D212 rep INJ') + ' delt repeats, licensed ' + tot('D212 lic INJ') + ', a gear-legal member on neither card ' + tot('D212 vio INJ') + ' [sat>sun/sun>mon/interior ' + s3('D212 vio INJ').join('/') + '] on ' + g('D212 vio cfgs INJ') + ' configs' + exs('D212 inj vio')); }
  done();
}
'''
EDITS.append(('4 report D212 + INFO', A4, B4))

# ── assert every anchor count==1 on the pristine file, then on the running text; refuse on the first miss ──
for name, a, _ in EDITS:
    n = src.count(a)
    print(f'anchor {name}: count {n}')
    if n != 1:
        sys.exit(f'REFUSED: anchor {name} count {n} (want 1); nothing written')
out = src
for name, a, b in EDITS:
    n = out.count(a)
    if n != 1:
        sys.exit(f'REFUSED: anchor {name} count {n} in the running text; nothing written')
    out = out.replace(a, b, 1)
for k in ("'D212'", 'D212 FORWARD', 'INFO D212 injured', 'const FAM = {', "bump('D212 cfg '"):
    if out.count(k) < 1:
        sys.exit(f'REFUSED: {k!r} did not land; nothing written')
if 'PARKED (standing ruling 7)' in out:
    sys.exit('REFUSED: the PARKED R2 note survived; nothing written')
F.write_text(out, encoding='utf-8')
print(f'wrote {F} ({len(src)} -> {len(out)} bytes)')
