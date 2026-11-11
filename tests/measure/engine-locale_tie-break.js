// Does the phone's language change a program? core-legs.ts breaks one sort's tie with a.localeCompare(b) and no
// locale, so the order of two exercise names is the device's collation. This builds the 864-config lattice and the ten
// seeded programs' worth of HALF_MANNY variants under the process's default locale and prints one line per program:
// its tag and digest. Run once per locale and compare the files; run with a page copy whose tie-break is a plain code
// unit compare to see what a locale-free order would move.
//
//   LC_ALL=en_US.UTF-8 node tests/measure/engine-locale_tie-break.js <page> > <scratch>/en.txt
//   LC_ALL=cs_CZ.UTF-8 node tests/measure/engine-locale_tie-break.js <page> > <scratch>/cs.txt
const path = require('path');
const H = require('../harness.js');
const LATTICE = require('../lattice193.js');

const page = path.resolve(process.argv[2]);
const IA = H.load(page);
// The clock the lattice sweep pins (2026-10-11 12:00 local): new Date() and Date.now() read it.
const Real = Date, t = new Real(2026, 9, 11, 12, 0, 0).getTime();
class Pinned extends Real { constructor(...a) { if (a.length === 0) super(t); else super(...a); } static now() { return t; } }
IA.window.Date = Pinned;

process.stdout.write('# locale ' + Intl.DateTimeFormat().resolvedOptions().locale + ' | "a".localeCompare("B") = ' + 'a'.localeCompare('B') + ' | "ch".localeCompare("d") = ' + 'ch'.localeCompare('d') + '\n');
for (const cell of LATTICE.FULL) {
  const cfg = Object.assign({}, H.fixtures.HALF_MANNY, cell.over);
  process.stdout.write(cell.tag + ' ' + H.progDigest(IA.buildProgram(cfg)) + '\n');
}
