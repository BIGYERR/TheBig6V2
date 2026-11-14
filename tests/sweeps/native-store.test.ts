// The Expo app's SQLite store under the sweeps' golden records (tests/integration/native-store.test.ts has why and
// how): the import of support/sqlite-phone.ts puts every test phone's storage in SQLite, and the imports after it run
// the stored-state sweep (the seeded programs, three time zones, the lattice sample) and the backup corpus's loads
// here, against the same golden files (tests/snapshots/stored-state-programs.json, -zones.json, -lattice.json,
// -backups.json). CI only, like every sweep.
import '../support/sqlite-phone.ts';
import './stored-state.test.ts';
import './data-backup.test.ts';
