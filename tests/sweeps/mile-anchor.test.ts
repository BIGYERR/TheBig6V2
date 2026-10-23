// The mile anchor's whole lattices (CI only; tests/integration/mile-anchor.test.js runs a sample of each):
//   D188, a beginner's mile in every engine read, over 20 seeds (1000 + 37 i);
//   D188, long-run tiers for beginners and intermediates with and without a mile, over 384 cfgs;
//   D189, the default disclosed on week 1's first paced run, over 6 goals x 3 levels x 20 seeds x 2 rest patterns.
// The claims and their hand oracles live in tests/support/pace-clock-lattices.js.
import { progDigest } from '../support/app.ts';
import { loadAppAt } from '../support/pace-clock.ts';
import * as L from '../support/pace-clock-lattices.ts';
const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 37);

const B = loadAppAt(new Date(2026, 8, 30, 9, 0, 0));
L.beginnerMileLatticeTests(B, progDigest, 'full lattice (20 seeds)', SEEDS);
L.longRunTierLatticeTests(
  B,
  'full lattice (384 cfgs)',
  {
    exps: ['beginner', 'intermediate'],
    goals: [
      ['base3mi', { id: 'run_base', baselineDist: '3', baseline: '3mi' }],
      ['base', { id: 'run_base' }],
      ['half', { id: 'run_half' }],
      ['pace1330', { id: 'run_pace_goal', targetDist: '1.5', targetMins: '13', targetSecs: '30', paceUnit: 'mi' }],
    ],
    paths: [['event', 'support_prevention'], ['hybrid', 'balanced']],
    miles: [0, 540, 690, 780],
    rests: [['mon', 'thu', 'sun'], ['sun', 'wed']],
    seeds: [1000, 1001, 76308],
  },
  ['A', 'B', 'C'],
);

const D = loadAppAt(new Date(2026, 8, 22, 21, 16, 0));
L.disclosureLatticeTests(D, 'full lattice (20 seeds x 2 rest patterns)', SEEDS, [['sun', 'wed'], ['sat', 'sun']], { noMile: 640, mile: 720 });
