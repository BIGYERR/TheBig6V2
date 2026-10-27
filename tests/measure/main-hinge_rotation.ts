// main-hinge: which hinge the Posterior Chain day is built around, block by block. Read-only (measure).
// Reported by Mario on 2026-10-26 with a Progress screenshot (MAIN LIFTS: Dumbbell bench press, Close-grip bench press,
// Barbell Romanian deadlift): "why is romanian deadlift a main lift? and not deadlift? thats pretty nuts".
// Usage: node tests/measure/main-hinge_rotation.ts (IA_APP=<page> for another body)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
// The census: HALF_MANNY and every program on the shared 864-config lattice (tests/lattice193.js FULL, on HALF_MANNY).
// A day's main hinge is item 0 of its /^main/i section when that item is one of EXLIB.back_compound's four names.
// Weeks are grouped into runs of the same main hinge, so a program reads as its sequence of variants.
import { createRequire } from 'node:module';
import { fixtures, loadApp } from '../support/app.ts';

const out = (s: string) => console.log(s);
const LATTICE = createRequire(import.meta.url)('../lattice193.js');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const A = loadApp() as any;
const HINGE = new Set<string>(A.eval('EXLIB.back_compound'));
out('pool: ' + [...HINGE].join(', '));
const t = { progs: 0, withHinge: 0, weeks: 0, firstRdl: 0, everRdl: 0, neverDeadlift: 0, varied: 0 };
const byVariantWeeks: Record<string, number> = {};
const firstVariant: Record<string, number> = {};
const seqs: Record<string, number> = {};
const cfgs: { tag: string; cfg: any }[] = [{ tag: 'HALF_MANNY', cfg: clone(fixtures.HALF_MANNY) }]
  .concat(LATTICE.FULL.map((c: any) => ({ tag: c.tag, cfg: { ...clone(fixtures.HALF_MANNY), ...c.over } })));
for (const { tag, cfg } of cfgs) {
  const p = A.buildProgram(clone(cfg));
  t.progs++;
  const perWeek: string[] = [];
  for (const wk of Object.keys(p.weeks).sort((a, b) => +a - +b)) {
    let h: string | null = null;
    for (const dk of DAYS) {
      const day = p.weeks[wk][dk];
      const main = day && !day.rest && (day.sections || []).find((s: any) => /^main/i.test(s.label || ''));
      const n = main && main.items && main.items[0] && main.items[0].name;
      if (n && HINGE.has(n)) { h = n; break; }
    }
    if (h) { perWeek.push(h); t.weeks++; byVariantWeeks[h] = (byVariantWeeks[h] || 0) + 1; }
  }
  if (!perWeek.length) continue;
  t.withHinge++;
  const runs: string[] = [];
  perWeek.forEach(h => { if (runs[runs.length - 1] !== h) runs.push(h); });
  firstVariant[runs[0]] = (firstVariant[runs[0]] || 0) + 1;
  if (runs[0] === 'Barbell Romanian deadlift') t.firstRdl++;
  if (runs.includes('Barbell Romanian deadlift')) t.everRdl++;
  if (!runs.includes('Deadlift')) t.neverDeadlift++;
  if (new Set(runs).size > 1) t.varied++;
  const key = runs.map(r => r.replace(' deadlift', '').replace('Barbell Romanian', 'RDL')).join(' > ');
  seqs[key] = (seqs[key] || 0) + 1;
  if (tag === 'HALF_MANNY') out('HALF_MANNY by week: ' + perWeek.map((h, i) => `W${i + 1} ${h}`).join(' | '));
}
out(`programs ${t.progs}; with a main hinge ${t.withHinge}; hinge-main weeks ${t.weeks}`);
out(`main hinge changes variant inside the program: ${t.varied}/${t.withHinge}`);
out(`opens on the RDL: ${t.firstRdl}/${t.withHinge}; RDL is a main at some point: ${t.everRdl}/${t.withHinge}; conventional Deadlift never a main: ${t.neverDeadlift}/${t.withHinge}`);
out('weeks by variant: ' + Object.entries(byVariantWeeks).map(([k, v]) => `${k} ${v} (${(100 * v / t.weeks).toFixed(1)}%)`).join(', '));
out('first block by variant: ' + Object.entries(firstVariant).map(([k, v]) => `${k} ${v}`).join(', '));
out('top sequences:');
Object.entries(seqs).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => out(`  ${v}  ${k}`));
