# V232 gatekeeper run 1 (candidate sha 03b5924d809d vs V231 d7c42961ba83), 2026-10-05 — RED

GATE     gate.sh steps 0-3 PASS (meta 232; node --check ok; 0 new dupes; boots; self-stable; digest 2d35e8f743680cfa);
         step 4: 76 gates PASS, then STOP at g224_d185_wctoday PASS 23 FAIL 5 (V231: green; gate file unchanged since 7b61da8);
         19 later gates ungraded; rc=1, 2203 s. Previous-version sweep killed at first red.
SABOTAGE not run (0 of 85 specs / 626 mutations).
BLAST    10 hunks, +63/-21; classes H1 meta, G1 .iaw-solo CSS, A1 _IAW_SPEC hms, B1 _iawParse, C+E1 _iawFormat + iaWheelHTML
         signature, E1 data-plan, D3 guard/plan-seed/_iawSeedFace, F1 cardioFieldHTML; unclassified 0. Every removed line
         inside a ruled hunk; copy matches call 7; nothing on the does-not-change list touched.
         Undeclared debt: `_DOSE_INPUT_STYLE` (:13535) now declared and never read (not a removal, not red).
FUZZ     11,196 configs / 3,072,198 items + 419,060 cardio sessions, 0 violations; buildProgram and refreshProgram
         byte-identical V231 vs V232 11,196/11,196; baseline vs itself 0/11,196; live control 125/280 configs differ.
VERDICT  RED — g224_d185_wctoday rows "line 643..647": section 1 compares lines[642..646] to fixed strings; hunk G inserts
         6 CSS lines at :335, so the five D185 lines sit at 649-653, byte-identical and in order. 23 other rows pass,
         including the independent cascade resolver. Standing-ruling-4 case (premise = V224 file layout).
New gate g232 source-read: VER >= 232 floors, D-untouched scoped to the pair, oracles hand/integer, temp unlinked.
Files: scratchpad/gatekeeper/.
