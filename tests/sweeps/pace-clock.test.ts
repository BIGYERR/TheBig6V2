// The pace clock's whole lattices (CI only; tests/integration/pace-clock.test.js runs a sample of each):
//   the anchor, target and rate over 3 levels x 3 ages x mi and km x 4 entered miles x 5 entered goals (360 builds);
//   the injury PACE CLOCK appendix over 3 miles x 3 distances x 2 goal times x 3 levels, plus one cfg on schedule.
// The claims and their hand oracles live in tests/support/pace-clock-lattices.js.
import { loadAppAt } from '../support/pace-clock.ts';
import { anchorLatticeTests, appendixLatticeTests } from '../support/pace-clock-lattices.ts';
const IA = loadAppAt(new Date(2026, 9, 11, 12, 0, 0));

anchorLatticeTests(IA, 'full lattice (360 builds)', {
  exps: ['beginner', 'intermediate', 'advanced'],
  ages: ['18-35', '36-54', '55+'],
  units: ['mi', 'km'],
  miles: [['6', '00'], ['7', '30'], ['8', '15'], ['9', '45']],
  goals: [
    { targetDist: '1.5', targetMins: '10', targetSecs: '30' },
    { targetDist: '1.5', targetMins: '9', targetSecs: '00' },
    { targetDist: '2', targetMins: '14', targetSecs: '00' },
    { targetDist: '3', targetMins: '21', targetSecs: '30' },
    { targetDist: '5', targetMins: '25', targetSecs: '00' },
  ],
});

appendixLatticeTests(IA, 'full lattice (55 cfgs)', {
  exps: ['beginner', 'intermediate', 'advanced'],
  miles: [['5', '30'], ['8', '15'], ['11', '00']],
  dists: ['1', '1.5', '3'],
  times: [['10', '30'], ['13', '00']],
});
