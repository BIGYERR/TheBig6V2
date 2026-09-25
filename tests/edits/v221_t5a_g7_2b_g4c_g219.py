#!/usr/bin/env python3
"""V221 slice T5a: test files only. Three rulings, three files. index.html is not touched.

1. g221_d177_swapfloor.js: DELETE G7-2b with its PARKED header text, its PARKED_72b label and its skipRow
   (p_swapfloor_ruling.md, RE-RULING ON V220 (swap durability), item 4). The G72 capture and the reboot that fed
   only that skip row go with it, so no dead symbol is left. The header states gate-scope item 2 as RESTATED in
   item 3. G7-2a stays.
2. g192_landmine_rotpress.js: G4c licence, a predicate on today's ia-version (>= 221, D177 RR4). It exempts the
   authored literal alternation `landmine (reverse lunge|rotational press)` only as one whole alternative of a regex
   inside the _REP_FLOOR table whose other alternatives carry no landmine or press token. G4c is not deleted and
   not re-pointed.
3. g219_samecard_draws.js: ERA[221] = ERA[220], ruled UNMOVED.

Every anchor is asserted count==1 across ALL files before any file is written; the first miss aborts the run.
"""
import os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G221 = os.path.join(ROOT, 'tests', 'gates', 'g221_d177_swapfloor.js')
G192 = os.path.join(ROOT, 'tests', 'gates', 'g192_landmine_rotpress.js')
G219 = os.path.join(ROOT, 'tests', 'gates', 'g219_samecard_draws.js')

EDITS = {
G221: [
# E1a header: the PARKED block becomes gate-scope item 2 as restated (item 3); the reboot half is P-SWAPDURABLE's (item 4)
("""// PARKED (standing ruling 7): G7-2b. Gate-scope item 2 says a frozen-day re-swap "survives a reboot". Refuted on the
//   snapshot and on V220 alike: refreshProgram restores the day from ia_hist_ and pruneSwaps drops the week's record,
//   so the re-swap is gone after a reboot. The row prints what it observes as SKIP and asserts nothing until coach
//   re-rules. Wire it then; do not re-point it (standing ruling 3).
""",
"""// GATE-SCOPE ITEM 2, RESTATED (RE-RULING ON V220 (swap durability), item 3): "Frozen-day re-swap: a day with an
//   `ia_hist_` snapshot at `4×3`, re-swapped through `applySwapChoice`, shows the window live (G7-2a). Whether that
//   re-swap survives a reboot is not D177's claim; it is P-SWAPDURABLE's." The reboot assertion is row 1 of
//   P-SWAPDURABLE's gate (item 4). This gate carries no row for it.
"""),
# E1b ROWS list
("""//        G7-2b PARKED (see above).   G7-4 (pair) lite lattice L2 at a second seed: 0 cards change against V220.
""",
"""//        G7-2a is gate-scope item 2 as restated above.   G7-4 (pair) lite lattice L2 at a second seed: 0 cards change
//        against V220.
"""),
# E1c the parked label
("""const PARKED_72b = 'G7-2b frozen-day re-swap survives a reboot';
""",
""""""),
# E1d the G7-2 block: drop the G72 capture, the reboot that fed only the skip row, and the skip row
("""// G7-2 frozen day: ia_hist_ snapshot at 4×3, restored on boot, re-swapped live; then the reboot (PARKED)
let G72 = null;
row('G72a', () => {""",
"""// G7-2 frozen day: ia_hist_ snapshot at 4×3, restored on boot, re-swapped live (gate-scope item 2, restated)
row('G72a', () => {"""),
("""  const live = IA.eval('activeProg.weeks[5].thu').sections[si].items[0], toast = IA.eval('globalThis.__T');
  const again = boot().sections[si].items[0];
  G72 = { after:clean(again.name) + ' :: ' + again.detail, record:JSON.parse(LS.getItem('ia_swaps_PH') || '{}').w5_thu ? 'kept' : 'pruned' };
  return [restored && live.name === 'Dumbbell goblet squat' && live.detail === EXPG && toast === EXPT, 'restored ' + restored + ', live ' + live.name + ' :: ' + live.detail + ' :: ' + toast];
});
skipRow(PARKED_72b, 'PARKED (standing ruling 7): gate-scope item 2 says it survives; observed after reboot: '
  + (G72 ? G72.after + ', swap record ' + G72.record : 'not reached') + '. Pre-existing on V220; coach to re-rule. Asserts nothing.');
""",
"""  const live = IA.eval('activeProg.weeks[5].thu').sections[si].items[0], toast = IA.eval('globalThis.__T');
  return [restored && live.name === 'Dumbbell goblet squat' && live.detail === EXPG && toast === EXPT, 'restored ' + restored + ', live ' + live.name + ' :: ' + live.detail + ' :: ' + toast];
});
"""),
],
G192: [
# E2 G4c licence
("""const loose = (noComments.match(/\\/[^\\/\\n]*landmine[^\\/\\n]*press[^\\/\\n]*\\//gi) || [])
  .filter(function(r){ return r !== '/^landmine rotational press$/'; });
""",
"""// LICENCE (standing ruling 2: a predicate on today's ia-version). D177 RR4 (p_swapfloor_ruling.md): from ia-version
// 221 the _REP_FLOOR unilateral [6,10] row carries the AUTHORED literal alternation `landmine (reverse lunge|rotational
// press)`, deliberately NOT the loose `landmine` token. It is exempt only as one whole alternative of a regex that sits
// inside the _REP_FLOOR table, and only while that regex's other alternatives carry no landmine or press token. The
// same literal outside the table, the literal on a file below 221, and any other loosened landmine-press regex still
// fail G4c. The scan itself is unchanged: it sees only regex literals carrying both landmine and press.
const VER = +IA.version;
const RR4_LIT = 'landmine (reverse lunge|rotational press)';
const RF_AT = noComments.indexOf('const _REP_FLOOR=['), RF_END = RF_AT < 0 ? -1 : noComments.indexOf('\\n];', RF_AT);
function rr4Licensed(r, at){
  if(!(VER >= 221) || RF_AT < 0 || RF_END < 0 || !(at > RF_AT && at < RF_END)) return false;
  const side = r.slice(1, -1).split(RR4_LIT);
  if(side.length !== 2) return false;
  if(!(side[0] === '' || side[0].slice(-1) === '|') || !(side[1] === '' || side[1].charAt(0) === '|')) return false;
  return !/landmine|press/i.test(side[0] + side[1]);
}
const loose = [], LOOSE_RE = /\\/[^\\/\\n]*landmine[^\\/\\n]*press[^\\/\\n]*\\//gi;
for(let m; (m = LOOSE_RE.exec(noComments)); ){
  if(m[0] === '/^landmine rotational press$/' || rr4Licensed(m[0], m.index)) continue;
  loose.push(m[0]);
}
"""),
],
G219: [
# E3 era row
("""ERA[220] = ERA[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; the D164 R4/R5 EQUALITY still expires on D169, not shipped here)
""",
"""ERA[220] = ERA[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; the D164 R4/R5 EQUALITY still expires on D169, not shipped here)
ERA[221] = ERA[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 adds a _REP_FLOOR row read by scheme(), and 0 engine cards change: measure 0/1,201,231, builder 0/903,969; D178/D179/D180 are zero-engine: Programs/loader, day-close UI, refreshProgram copy-back of a display flag; gatekeeper pre-flight 2026-09-24: g219 15/0 on the candidate stamped 220)
"""),
],
}

def main():
    src = {}
    for f, reps in EDITS.items():
        s = open(f, encoding='utf-8').read()
        for i, (a, _) in enumerate(reps):
            n = s.count(a)
            print('%s anchor %d count=%d' % (os.path.basename(f), i + 1, n))
            if n != 1:
                print('ABORT: anchor %d in %s occurs %d times; nothing written' % (i + 1, f, n))
                sys.exit(1)
        src[f] = s
    for f, reps in EDITS.items():
        s = src[f]
        for a, b in reps:
            assert s.count(a) == 1
            s = s.replace(a, b)
        open(f, 'w', encoding='utf-8').write(s)
        print('wrote', f)

if __name__ == '__main__':
    main()
