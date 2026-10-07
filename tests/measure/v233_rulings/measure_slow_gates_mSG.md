# measure mSG — slow gates alone, unit cost, trip fraction, gate.sh prediction, fuzz (Post-V233, no build)

MODE     B (before-picture)
METHOD   tests/measure/v233_slow_gates.js (--phase alone|fuzz|trip|predict). Outputs: scratchpad/measure_SG/ (v233_alone.out, alone.json,
         v233_g230procs.out, v233_units.out, v233_fuzz.out, v233_trip.out, v233_trip_cuecap.out, trip.json, trip_cuecap.json, v233_predict.out).
         Instrument: a --require preload wraps harness.load and, in every VM, buildProgram (timed, depth-guarded) plus the swap and filter entry
         points (counted). Each node process writes its own wall, CPU, maxRSS and counts. Gates run as gate.sh runs them (cand + base_V232).
         Every gate printed the same PASS/FAIL as T1. NOT strictly alone: the builder's parallel work held load avg at 2.7 to 6.2 on 8 cores at the start of each run.

## 1+2. Alone (one gate at a time; load avg at start)
| gate | load | wall s | user+sys s | maxRSS MB | node procs (peak) | unit, count | builds (s in build) | per unit | shardable |
|---|---|---|---|---|---|---|---|---|---|
| g230_d194_lens2 | 5.0 | 1064 | 4605 | 321 | 64 (5): own pool of 4, 63 jobs | D190 chain lattice 18,580 chains + L1 384 cfgs + L432 432 cfgs | 499,296 (3,796) | 7.6 ms/build; 29 lat shards = ~4,000 of 4,138 s child wall, shard 88-152 s | yes, already sharded; POOL=4 caps it. Longest job 152 s |
| g217_d160_dedupe_view | 5.7 | 176 | 191 | 472 | 1 | 8,280 lattice + 5,280 K-limb cfgs | 27,128 (171) | 6.3 ms/build | yes (independent configs), unsharded |
| g222_d181_chain | 2.7 | 112 | 162 | 396 | 1 | 7,522 chains (POP_U 6,708 + POP_H 814), batch = fresh boot | 4,375 (42); 4,374 boots | 15 ms/chain | yes by batch, unsharded |
| g227_d190_seam | 3.6 | 104 | 142 | 340 | 1 | 12,354 chains, 6 cfgs | 3,990 (34); 3,981 boots | 8.2 ms/chain (run 92.6 s) | yes by batch/config, unsharded |
| g228_d192_undokey | 4.0 | 102 | 150 | 371 | 1 | 2,201 chains | 5,707 (52); 5,692 boots | 37 ms/chain (run 72 s) | yes by chain, unsharded |
| g227_d190_cuecap | 4.6 | 94 | 133 | 368 | 1 | 6,939 chains x 2 trees | 3,635 (34); 3,623 boots | ~6.6 ms/chain-tree | yes, unsharded |
| g213_d113a | 4.7 | 55 | 60 | 241 | 1 | 3,984 cfgs | 8,902 (52) | 5.8 ms/build | yes |
| g211_d153_d155 | 4.3 | 48 | 51 | 198 | 1 | 8,040 cfgs | 8,041 (47) | 5.9 ms/build | yes |
| g223_d184_testlen | 4.2 | 51 | 56 | 363 | 3, sequential (spawnSync: 2 TZ self-children + g203) | 11,240 builds, 6,608 doGenerate | 11,240 (39) | 3.5 ms/build | the 2 TZ children could run concurrently |
| g216_d156_longday | 4.9 | 29 | 32 | 289 | 1 | 4,800 cfgs | 5,281 (29) | 5.4 ms/build | yes |
Alone over T1 for the 9 single-process gates: median 0.432 (0.365 to 0.466). g230 alone 1064 s against T1 841 s: its 4-worker pool is CPU-bound (4,605 s CPU over 4 workers).
On the swap gates, buildProgram is 23 to 35% of CPU. The rest is boots, swap and undo replays and applyInjuryFilter (1.6 to 4.0 M calls per gate).

## 3. Trip fraction (the smallest prefix F of each population the gate itself iterates, in gate order, among 0.02 / 0.1 / 0.3 / 1)
Differential at F<1: a row FAILs in the mutant and passes in the clean copy at the same F, or it FAILs in both with different text. 25 mutations name the six (by the spec `gate` field). 0 NOT-APPLIED.
- g217 3/3 trip at F 0.02 (552 of 27,128 builds). g222 4/4 at 0.02. g228 2/2 at 0.02. g227_cuecap 3/3 at 0.02 (re-run with the knob on POP: the run()-level knob crashed all of them in pass 1).
- g227_seam 7/8 at 0.02; v229_d193 #9 (S11, live carry reads the clamped card) trips only at 0.3 (not at 0.02 or 0.1).
- g230 5/5 NOT MEASURED. At every F<1 the gate's own inst-self row fails ("L1 baseline builds 40/40" against a pinned 384/384). Every other row then prints "(not read: instrument inst-self failed)", so the mutants are byte-identical to clean at 0.02, 0.1 and 0.3. No F=1 mutant ran inside the 90-min cap.
  The clean knob copy at F=1 is inert: 14/0, 499,296 builds.
- Caveat: these figures are for a prefix, not a random sample. Several trips land on hand rows that the knob does not shrink (g222 row 5, cuecap b-HAND-2). Those trip at any F.

## 4. Prediction and fuzz
Model: 8 cores and 8 xargs slots, processor sharing. The 10 gates above use their alone times; the other 87 use T1 x 0.432; g230 asks for 4 cores.
- Longest-first: 1,135 s (18.9 min); glob order (today): 1,188 s (19.8 min). With work counted as CPU incl. GC threads: 1,236 / 1,291 s.
  g230 finishes last in every variant. The CPU lower bound is 773 s; the gate phase is bounded by g230 alone (1,064 s).
- What a g230 pool change would have to move (same work, more cores, longest-first): POOL 6 gives 827 s, POOL 8 gives 697 s. Not a recommendation.
- Gatekeeper fuzz as run at V233 (fuzz.js, 4 shards V232->V233 plus live and selfbase, 6 processes concurrent): 238.7 s wall, 12,528 configs, 3,466,298 items, 0 diffs.
  Shards 230 to 239 s each, about 245 s CPU each. tests/fuzz.sh (8 shards): 175.2 s wall, 1,115 s CPU, 34,020 configs / 2,548,980 day-builds, PASS 1 FAIL 0 (load 7.8 at start).

## UNKNOWN
- g230 trip fraction: needs F=1 mutant runs (about 17 min each x 5 under load), or a knob that also scales inst-self's pinned 384.
- Exact earliest unit inside each bracket. Alone times free of the builder's load.
- Per-gate times for the 87 gates not timed alone (they are scaled from T1). The cost of gate.sh steps 0 to 3 and of grading.
