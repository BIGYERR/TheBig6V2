// supersets: the after-picture of D254 (P-CIRCUIT3), a circuit holds three movements and the P-HIPEXT hip extension
// follows the runner armor circuit as its own straight sets. Read-only (measure). Standing ruling 5: the new HALF_MANNY
// digest and every changed card, before and after, printed before the golden files are regenerated.
// Usage: node tests/measure/supersets_circuit-cap-after.ts <before page> <after page>
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
// For HALF_MANNY and every program on the 864-config lattice, both pages build the program; every day whose sections
// differ is classified: EXPECTED when the only change is the circuit's fourth item leaving it for a 'Glute — runner
// armor' section of that one item right after it, OTHER for anything else (printed in full).
import { createRequire } from 'node:module';
import { fixtures, loadApp } from '../support/app.ts';

const out = (s: string) => console.log(s);
const req = createRequire(import.meta.url);
const LATTICE = req('../lattice193.js');
const H = req('../harness.js');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const [beforeFile, afterFile] = process.argv.slice(2);
const A0 = loadApp({ file: beforeFile }) as any;
const A1 = loadApp({ file: afterFile }) as any;

const sig = (secs: any[]) => JSON.stringify((secs || []).map((s: any) => [s.label, !!s.superset, s.rounds, (s.items || []).map((i: any) => [i.name, i.detail])]));
const card = (secs: any[]) => (secs || []).map((s: any) => `    [${s.label}]${s.superset ? ' (round ×' + s.rounds + ')' : ''} ` + (s.items || []).map((i: any) => `${i.name} {${i.detail}}`).join(' ; ')).join('\n');
function expected(b: any[], a: any[]): boolean {
  // the after day equals the before day with the circuit's 4th item moved into its own section right after the circuit
  const bi = b.findIndex((s: any) => /^Leg circuit/.test(s.label || '') && (s.items || []).length === 4);
  if (bi < 0) return false;
  const moved = b[bi].items[3];
  const want = clone(b);
  want[bi].items = want[bi].items.slice(0, 3);
  want.splice(bi + 1, 0, { label: 'Glute — runner armor', items: [moved] });
  const norm = (x: any[]) => sig(x.map((s: any) => ({ ...s, superset: !!s.superset, rounds: s.superset ? s.rounds : undefined })));
  return norm(want) === norm(a);
}
// the after day equals the before day with the circuit's 4th item gone and no section added (a recovery week keeps one
// accessory block, so the moved section does not survive it)
function dropped(b: any[], a: any[]): boolean {
  const bi = b.findIndex((s: any) => /^Leg circuit/.test(s.label || '') && (s.items || []).length === 4);
  if (bi < 0) return false;
  const want = clone(b);
  want[bi].items = want[bi].items.slice(0, 3);
  return sig(want) === sig(a);
}

const t = { progs: 0, days: 0, changed: 0, expected: 0, dropped: 0, droppedRecovery: 0, other: 0, circ4Before: 0, circ4After: 0, hipBefore: 0, hipAfter: 0 };
const otherEx: string[] = [];
const dropWhy: Record<string, number> = {};
const cfgs: { tag: string; cfg: any }[] = [{ tag: 'HALF_MANNY', cfg: clone(fixtures.HALF_MANNY) }]
  .concat(LATTICE.FULL.map((c: any) => ({ tag: c.tag, cfg: { ...clone(fixtures.HALF_MANNY), ...c.over } })));
const HIPEXT = /hip thrust|glute bridge/i;
for (const { tag, cfg } of cfgs) {
  const p0 = A0.buildProgram(clone(cfg)), p1 = A1.buildProgram(clone(cfg));
  t.progs++;
  if (tag === 'HALF_MANNY') {
    out(`HALF_MANNY digest before ${H.progDigest(clone(p0))} after ${H.progDigest(clone(p1))}`);
    out(`HALF_MANNY self-stable after: ${H.progDigest(clone(A1.buildProgram(clone(cfg)))) === H.progDigest(clone(p1))}`);
  }
  for (const wk of Object.keys(p0.weeks)) for (const dk of DAYS) {
    const d0 = p0.weeks[wk][dk], d1 = p1.weeks[wk] && p1.weeks[wk][dk];
    if (!d0 || d0.rest) continue;
    t.days++;
    const s0 = d0.sections || [], s1 = (d1 && d1.sections) || [];
    s0.forEach((s: any) => { if (s.superset && (s.items || []).length >= 4) t.circ4Before++; (s.items || []).forEach((i: any) => { if (HIPEXT.test(i.name)) t.hipBefore++; }); });
    s1.forEach((s: any) => { if (s.superset && (s.items || []).length >= 4) t.circ4After++; (s.items || []).forEach((i: any) => { if (HIPEXT.test(i.name)) t.hipAfter++; }); });
    if (sig(s0) === sig(s1)) continue;
    t.changed++;
    if (expected(s0, s1)) t.expected++;
    else if (dropped(s0, s1)) {
      t.dropped++;
      const main = String(((s0[0] || {}).items || [{}])[0].detail || '');
      if (/recovery/i.test(main)) t.droppedRecovery++;
      const why = /recovery/i.test(main) ? 'recovery' : (main.match(/RPE[^,(]*\(([^)]*)\)/) || [, 'other: ' + main.slice(0, 40)])[1];
      dropWhy[why] = (dropWhy[why] || 0) + 1;
    }
    else { t.other++; if (otherEx.length < 12) otherEx.push(`${tag} W${wk} ${dk} ${d0.title}\n  before:\n${card(s0)}\n  after:\n${card(s1)}`); }
    if (tag === 'HALF_MANNY') out(`\nHALF_MANNY W${wk} ${dk} ${d0.title}\n  before:\n${card(s0)}\n  after:\n${card(s1)}`);
  }
}
out(`\nprograms ${t.progs}; training days ${t.days}; days changed ${t.changed}: expected ${t.expected}, dropped ${t.dropped} (main lift reads recovery: ${t.droppedRecovery}), other ${t.other}`);
out(`circuits of 4+ movements: before ${t.circ4Before}, after ${t.circ4After}`);
out(`hip thrust / glute bridge items on the lattice: before ${t.hipBefore}, after ${t.hipAfter}`);
out('dropped, by the main lift\'s effort note: ' + JSON.stringify(dropWhy));
if (otherEx.length) out('\nOTHER changes (first 12):\n' + otherEx.join('\n\n'));
