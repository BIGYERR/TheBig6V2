#!/usr/bin/env python3
# V193 gate-file amendment. GATE FILES ONLY — index.html is not touched by this script and
# ia-version stays 193. Gatekeeper returned RED on tests/gates/g193_budget_floor.js at
# PASS 24 FAIL 3 and ruled the gate over-asserts relative to coach's rulings:
#   B4b -> report-only (coach filed it to §12, explicitly non-blocking)
#   B4d -> report-only (coach rejected the reasoning: a per-class count has no denominator)
#   B1b -> long-run tier days carved out, live everywhere else
# Plus three factual comment corrections inside the gate.
# Every anchor is asserted count==1 before anything is written.
import sys, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'gates', 'g193_budget_floor.js')

src = io.open(TARGET, encoding='utf-8').read()
orig = src
edits = []

def rep(tag, old, new):
    edits.append((tag, old, new))

# ── 1. THE BAR: B1 rewritten for the carve-out ───────────────────────────────
rep('bar-B1', r"""//   B1 Core sections present. Two claims now, because the old absolute is only structural on
//      the healthy path. B1a: 18 core sections per build on every HEALTHY cell (hand count).
//      B1b: per-cell core sections never BELOW V192 on the same cell, all 288 cells. An
//      injured cell has fewer core sections than a healthy one for reasons the injury
//      overlay owns; losing one relative to V192 is the regression.""",
r"""//   B1 Core sections present. Two claims now, because the old absolute is only structural on
//      the healthy path. B1a: 18 core sections per build on every HEALTHY cell (hand count).
//      B1b: per-cell core sections never BELOW V192 on the same cell, all 288 cells, ON
//      EVERY DAY THE RUN DOES NOT OWN. An injured cell has fewer core sections than a
//      healthy one for reasons the injury overlay owns; losing one relative to V192 is the
//      regression. NRC long-run tier days are excluded and the excluded count is printed
//      (see the carve-out note at B1b) — the bar stays live everywhere else.""")

# ── 2. THE BAR: B4 rewritten, B4b and B4d demoted to report ──────────────────
rep('bar-B4', r"""//   B4 Non-optional sections: no budget deletion worse than V192, per CELL and per CLASS,
//      and no class V192 never emptied. Trim order unchanged vs V192.""",
r"""//   B4 Non-optional sections: no budget deletion worse than V192 per TIER (B4), no class
//      V192 never emptied (B4c), the budget never ADDS (B4e), trim order unchanged (B4f).
//      B4b (per CELL) and B4d (per CLASS growth) are REPORTED WITH DENOMINATORS AND NEVER
//      GATED. Coach filed both to §12 as non-blocking and gave a reason for each; the
//      reasons are written out at the assertions themselves.""")

# ── 3. the FULL-lattice comment: 108 GAINED, 4 lost, not 108 lost ────────────
rep('full-lattice-note', r"""// 864-cell FULL lattice (beginner, knee/protect, hip/workaround, ankle/workaround,
// lowback/workaround as well), which finds 108 lost core sections where WIDE finds 3.""",
r"""// 864-cell FULL lattice (beginner, knee/protect, hip/workaround, ankle/workaround,
// lowback/workaround as well). CORRECTED, this line used to read "finds 108 lost core
// sections where WIDE finds 3" and had the sign backwards: on FULL the core-section
// differential vs V192 is 108 GAINED and 4 lost, not 108 lost. The point the line is
// making still stands — FULL sees strictly more than WIDE — but it is not a pile of
// regressions and must not be quoted as one.""")

# ── 4. census: resolve the ENGINE'S OWN _longRunTier and split the core count ─
rep('census-init', r"""function census(ia, budgetOff, cells){
  ia.eval('globalThis.__BUDGET_OFF = ' + (budgetOff ? 'true' : 'false') + ';');
  const out = { tiers:{}, cells:{}, byDay:{}, byInj:{}, cellsSwept:0, dayBuilds:0 };""",
r"""function census(ia, budgetOff, cells){
  ia.eval('globalThis.__BUDGET_OFF = ' + (budgetOff ? 'true' : 'false') + ';');
  const out = { tiers:{}, cells:{}, byDay:{}, byInj:{}, cellsSwept:0, dayBuilds:0 };
  // THE CARVE-OUT PREDICATE IS THE ENGINE'S OWN. D50 already owns the question "does the
  // run own this day", and a gate that writes a SECOND long-run predicate is a gate that
  // can disagree with the artifact about which days it is excusing. So this reads
  // _longRunTier out of the file under test — candidate and baseline each classify their
  // own days with their own copy. If the symbol is missing the census carves nothing out,
  // which fails CLOSED (B1b then asserts on every day) and B1b says so by name.
  var lrt = null;
  try { lrt = ia.eval('typeof _longRunTier === "function" ? _longRunTier : null'); } catch (e){ lrt = null; }
  out.lrtOK = (typeof lrt === 'function');
  out.lrDays = 0; out.lrCore = 0; out.lrTiers = { A:0, B:0, C:0 };""")

rep('census-tiers-init', r"""  for (const t of INJS) out.byInj[t] = { coreSec:0, thinCore:0 };""",
r"""  for (const t of INJS) out.byInj[t] = { coreSec:0, thinCore:0 };
  const lrTierOf = day => { if (!out.lrtOK) return null; try { return lrt(day.cardio) || null; } catch (e){ return null; } };""")

rep('census-cell-init', r"""    const C = out.cells[c.key] = { coreSec:0, thinCore:0, emptySec:0, nonOptDel:0 };""",
r"""    const C = out.cells[c.key] = { coreSec:0, coreSecNL:0, thinCore:0, emptySec:0, nonOptDel:0 };""")

rep('census-day', r"""        out.dayBuilds++;
        const dk = c.key + '|' + wk + '|' + d;""",
r"""        out.dayBuilds++;
        const lrTier = lrTierOf(day);
        if (lrTier){ out.lrDays++; out.lrTiers[lrTier] = (out.lrTiers[lrTier] || 0) + 1; }
        const dk = c.key + '|' + wk + '|' + d;""")

rep('census-core', r"""          if (s.core){ T.coreSec++; I.coreSec++; C.coreSec++; if (n === 1){ T.thinCore++; I.thinCore++; C.thinCore++; } }""",
r"""          if (s.core){ T.coreSec++; I.coreSec++; C.coreSec++;
            if (lrTier) out.lrCore++; else C.coreSecNL++;
            if (n === 1){ T.thinCore++; I.thinCore++; C.thinCore++; } }""")

# ── 5. B1b: the carve-out, with the mechanism written down ───────────────────
rep('B1b', r"""// ── B1b: core sections never below V192, per cell, all 288 ─────────────────
{
  const perInj = {};
  for (const t of INJS) perInj[t] = { c:0, b:0 };
  if (BASE){
    const lost = [];
    let totC = 0, totB = 0;
    for (const c of CELLS){
      const nc = CAND.cells[c.key].coreSec, nb = BASE.cells[c.key].coreSec;
      totC += nc; totB += nb;
      perInj[c.inj].c += nc; perInj[c.inj].b += nb;
      if (nc < nb) lost.push({ tag: c.tag, from: nb, to: nc, d: nb - nc });
    }
    for (const t of INJS) console.log('       core sections ' + t.padEnd(18) + ' V' + BASE_VER + ' ' + String(perInj[t].b).padStart(5) + ' -> ' + String(perInj[t].c).padStart(5) + '  delta ' + (perInj[t].c-perInj[t].b>=0?'+':'') + (perInj[t].c-perInj[t].b));
    console.log('       core sections total ' + totB + ' -> ' + totC + ' over ' + CELLS.length + ' cells');
    const lostN = lost.reduce((a,x)=>a+x.d,0);
    if (!lost.length) ok('B1b no cell lost a core section vs V' + BASE_VER + ' (0 lost over ' + CELLS.length + ' cells / ' + totB + ' baseline core sections)');
    else bad('B1b ' + lostN + ' core sections LOST vs V' + BASE_VER + ' in ' + lost.length + '/' + CELLS.length + ' cells:\n         ' +
      lost.slice(0,10).map(x => x.tag + '  ' + x.from + ' -> ' + x.to).join('\n         '));
  } else {
    info('B1b needs a baseline file to make a differential core-section claim; skipped');
  }
}""",
r"""// ── B1b: core sections never below V192, per cell — LONG-RUN TIER DAYS CARVED OUT ──
//
// THE CARVE-OUT, AND WHY IT IS NOT A SOFTENED BAR. B1b failed on V193 with "3 core sections
// LOST in 3/288 cells". Gatekeeper traced the mechanism and it is not a defect:
//   An NRC long-run tier B day allows EIGHT working sets, because the run is the day. V192's
//   rotational pillar was frozen on 'Landmine rotations 2×8–12' — two sets, it fits under
//   eight. D46 unfroze that pillar, so the draw now reaches 'Medicine ball rotary toss 3×8'
//   and 'Cable woodchoppers 3×12' — three sets, which does NOT fit under eight. The section
//   empties, the empty-section strip splices it out, and the cell shows one fewer core
//   section. V192 only passed this assertion because of the bug D46 fixed.
// Measured at gatekeeper's own denominator, day by day rather than per cell: 97 core sections
// lost, 100% of them on long-run tier B days and ZERO on any other day type, against 240
// gained. A day where the run owns the training decision is the one place the trunk block is
// SUPPOSED to yield (see D50 carve-out 2, and "the run is the day" in CLAUDE.md), so counting
// those days against a lifting floor is asserting doctrine backwards.
// WHAT SURVIVES: a core section lost anywhere the run does NOT own the day still fails, on
// all 288 cells. The excluded count is printed with its denominator on every run, so the
// carve-out is visible in the output and can never shrink silently.
{
  if (CAND.lrtOK) ok("B1b classified long-run days with the engine's own _longRunTier (the same predicate D50 uses; no second copy lives in this gate)");
  else bad('B1b the file under test exposes no _longRunTier — the carve-out could not be applied and the claim below is asserted on EVERY day, long-run tiers included');
  const cTiers = CAND.lrTiers || { A:0, B:0, C:0 };
  console.log('       CARVE-OUT, printed with its denominator: ' + CAND.lrDays + '/' + CAND.dayBuilds +
    ' day-builds are NRC long-run tier days (A ' + (cTiers.A||0) + ', B ' + (cTiers.B||0) + ', C ' + (cTiers.C||0) +
    '), carrying ' + CAND.lrCore + ' core sections that B1b does not count' +
    (BASE ? '. V' + BASE_VER + ': ' + BASE.lrDays + '/' + BASE.dayBuilds + ' day-builds, ' + BASE.lrCore + ' core sections excluded' : ''));
  const perInj = {};
  for (const t of INJS) perInj[t] = { c:0, b:0 };
  if (BASE){
    if (CAND.lrDays === BASE.lrDays) ok('B1b the carve-out covers the SAME ' + CAND.lrDays + ' day-builds on both versions — V193 did not move which days the run owns');
    else bad('B1b the carve-out covers ' + CAND.lrDays + ' day-builds on the candidate but ' + BASE.lrDays + ' on V' + BASE_VER + ' — the exclusion set itself moved, so the comparison below is not like for like');
    const lost = [];
    let totC = 0, totB = 0;
    for (const c of CELLS){
      const nc = CAND.cells[c.key].coreSecNL, nb = BASE.cells[c.key].coreSecNL;
      totC += nc; totB += nb;
      perInj[c.inj].c += nc; perInj[c.inj].b += nb;
      if (nc < nb) lost.push({ tag: c.tag, from: nb, to: nc, d: nb - nc });
    }
    for (const t of INJS) console.log('       core sections off long-run days ' + t.padEnd(18) + ' V' + BASE_VER + ' ' + String(perInj[t].b).padStart(5) + ' -> ' + String(perInj[t].c).padStart(5) + '  delta ' + (perInj[t].c-perInj[t].b>=0?'+':'') + (perInj[t].c-perInj[t].b));
    console.log('       core sections off long-run days, total ' + totB + ' -> ' + totC + ' over ' + CELLS.length + ' cells');
    const lostN = lost.reduce((a,x)=>a+x.d,0);
    if (!lost.length) ok('B1b no cell lost a core section vs V' + BASE_VER + ' on any day the run does not own (0 lost over ' + CELLS.length + ' cells / ' + totB + ' baseline core sections, ' + BASE.lrCore + ' long-run-tier core sections excluded)');
    else bad('B1b ' + lostN + ' core sections LOST vs V' + BASE_VER + ' OFF the long-run tiers in ' + lost.length + '/' + CELLS.length + ' cells:\n         ' +
      lost.slice(0,10).map(x => x.tag + '  ' + x.from + ' -> ' + x.to).join('\n         '));
  } else {
    // NO BASELINE HANDED IN. B1b used to skip outright here, which meant the sabotage runner
    // — which never passes a baseline — could not cover this claim at all, and an assertion
    // no mutation can trip is not proof of anything. Same fallback shape B3 and B4 already
    // use: a table transcribed off the V192 artifact, applied only on the lattice it was
    // typed against, and cross-checked against the live baseline whenever one IS supplied.
    if (USE_FULL){
      info('B1b no baseline and IA_LATTICE=full — the V192 fallback table was transcribed against the ' + LAT.WIDE_N + '-cell lattice and cannot be applied to ' + CELLS.length + ' cells; skipped');
    } else {
      let below = [];
      for (const c of CELLS) perInj[c.inj].c += CAND.cells[c.key].coreSecNL;
      for (const t of INJS){
        const want = V192_CORE_NONLR_WIDE[t];
        console.log('       core sections off long-run days ' + t.padEnd(18) + ' V192 table ' + String(want === undefined ? '?' : want).padStart(5) + ' -> ' + String(perInj[t].c).padStart(5));
        if (want !== undefined && perInj[t].c < want) below.push(t + ' ' + perInj[t].c + ' < ' + want);
      }
      if (!below.length) ok('B1b core sections off the long-run tiers are at or above the transcribed V192 census on ' + INJS.length + '/' + INJS.length + ' injury paths (no baseline file supplied)');
      else bad('B1b core sections LOST vs the transcribed V192 census off the long-run tiers on ' + below.length + '/' + INJS.length + ' injury paths: ' + below.join(', '));
    }
  }
}""")

# ── 6. B4b: report-only ──────────────────────────────────────────────────────
rep('B4b', r"""  // per CELL — the finest cut, and the one a per-tier aggregate can hide.
  if (basePerCell){
    const up = [];
    let newTot = 0;
    for (const k of Object.keys(C.perCell)){
      const d = C.perCell[k] - (basePerCell[k]||0);
      if (d > 0){ up.push(k + '  ' + (basePerCell[k]||0) + ' -> ' + C.perCell[k]); newTot += d; }
    }
    if (!up.length) ok('B4b no cell deletes more non-optional sections than V192 (0 new over ' + Object.keys(C.perCell).length + ' cells)');
    else bad('B4b ' + newTot + ' NEW non-optional section deletions vs V192 in ' + up.length + '/' + Object.keys(C.perCell).length + ' cells:\n         ' + up.slice(0,10).join('\n         '));
  }""",
r"""  // per CELL — REPORTED WITH ITS DENOMINATOR AND THE REPRO CELL, NEVER GATED.
  // Coach filed this to §12 as explicitly non-blocking. The rise sits on
  // lowback/protect bodyweight hypertrophy intermediate, which is the tightest cell in the
  // matrix BY DESIGN: bodyweight assumes no bands, hypertrophy asks for volume the tier
  // cannot supply, and the budget resolves the contradiction the only way it can, by
  // deleting. One extra deletion in four cells, against 1,242 fewer deletions overall, is
  // the tight cell behaving as ruled, not a regression. If this number climbs off that cell
  // it is a different finding and the printed repro list is how you see it.
  if (basePerCell){
    const up = [];
    let newTot = 0;
    for (const k of Object.keys(C.perCell)){
      const d = C.perCell[k] - (basePerCell[k]||0);
      if (d > 0){ up.push(k + '  ' + (basePerCell[k]||0) + ' -> ' + C.perCell[k]); newTot += d; }
    }
    console.log('       REPORT ONLY — B4b new non-optional deletions per cell: ' + newTot + ' new in ' +
      up.length + '/' + Object.keys(C.perCell).length + ' cells' + (up.length ? ':\n         ' + up.slice(0,10).join('\n         ') : ' (none)'));
    ok('B4b per-cell non-optional deletions reported with denominator (' + up.length + '/' + Object.keys(C.perCell).length + ' cells, ' + newTot + ' new), not gated — coach, §12');
  }""")

# ── 7. B4d: report-only, with coach's instruction in the comment ─────────────
rep('B4d', r"""    const grew = Object.keys(C.kinds).filter(k => (C.kinds[k] > (baseKinds[k]||0)));
    if (!grew.length) ok('B4d per-class non-optional deletions do not exceed V192 on any of ' + Object.keys(C.kinds).length + ' classes');
    else bad('B4d non-optional deletions GREW for ' + grew.length + ' class(es): ' + grew.map(k=>'"'+k+'" '+C.kinds[k]+' > '+(baseKinds[k]||0)).join(', '));""",
r"""    // per CLASS GROWTH — REPORTED, NEVER GATED. Coach rejected the reasoning behind the old
    // assertion: a per-class deletion count has no denominator, and V193 moved the
    // denominator on purpose. Total non-optional deletions fell 6,527 -> 5,285 in the same
    // run, so a class-level rise inside a 19% aggregate fall is COMPOSITION, not loss.
    // COACH'S INSTRUCTION, standing: re-express per-class deletions as a SHARE OF PER-CLASS
    // PRESCRIPTIONS before anyone rules on them again. Until that denominator exists, the
    // raw counts below are evidence and nothing more.
    const grew = Object.keys(C.kinds).filter(k => (C.kinds[k] > (baseKinds[k]||0)));
    console.log('       REPORT ONLY — B4d per-class non-optional deletions grew for ' + grew.length + '/' +
      Object.keys(C.kinds).length + ' classes' + (grew.length ? ': ' + grew.map(k=>'"'+k+'" '+C.kinds[k]+' > '+(baseKinds[k]||0)).join(', ') : '') +
      '. Aggregate non-optional deletions ' + totB + ' -> ' + totC + ' (delta ' + (totC-totB>=0?'+':'') + (totC-totB) + '), which is the denominator these counts have to be read against.');
    ok('B4d per-class non-optional deletions reported (' + grew.length + '/' + Object.keys(C.kinds).length + ' classes grew, aggregate ' + totB + ' -> ' + totC + '), not gated — coach, §12');""")

for tag, old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (need exactly 1). Nothing written.\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new)

if src == orig:
    sys.stderr.write('ABORT: no change produced.\n'); sys.exit(1)

io.open(TARGET, 'w', encoding='utf-8').write(src)
print('wrote %s (%d replacements, %d -> %d bytes)' % (TARGET, len(edits), len(orig), len(src)))
