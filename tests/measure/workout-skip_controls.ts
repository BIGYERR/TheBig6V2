// workout-skip: which cards on a session can the athlete take off today, and what the Wildcard's swap and skip buttons
// actually do. Read-only (measure). Reported by Mario on 2026-10-25: "we cant cancel swap out main lifts or cardio events
// for our programs, i think we should be able to at least skip it in workout, and also the wildcard workouts the swap
// button doesnt work".
// Usage: node tests/measure/workout-skip_controls.ts (IA_APP=<page> for another body; the saved .out.txt holds v0.245.1,
// the before-picture, then v0.246.0's build)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
// Part A, the census: every program on the shared 864-config lattice (tests/lattice193.js FULL, on HALF_MANNY) plus
// HALF_MANNY itself. For each training day: the main slot (item 0 of a /^main/i section, the one exControlFlags locks),
// whether it has a swap exit, and the day's cardio card, which carries no control at all.
// Part B, the Wildcard: HALF_MANNY active in week 1, the session sheet last pointed at each weekday in turn (the Wildcard
// opens over whatever day currentDayKey names). For every Wildcard workout in RAND_POOLS, every card that draws a swap
// button is tapped, and the sheet's own header (swapOutName) and the toast are read back.
import { createRequire } from 'node:module';
import { fixtures, loadApp } from '../support/app.ts';

const out = (s: string) => console.log(s);
const LATTICE = createRequire(import.meta.url)('../lattice193.js');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ── Part A ──────────────────────────────────────────────────────────────────
const A = loadApp() as any;
const flags = A.eval('exControlFlags');
const swapCands = A.eval('swapCandidates');
const auxCands = A.eval('auxSwapCandidates');
const auxFam = A.eval('_auxFamily');
const t = { progs: 0, days: 0, liftDays: 0, mainSlots: 0, mainNoSwapBtn: 0, mainNoCands: 0, mainSkippable: 0,
  cardioDays: 0, cardioOnly: 0, hybrid: 0, hybridCardioFirst: 0, items: 0, itemsSkippable: 0, itemsLocked: 0 };
const noCandNames: Record<string, number> = {};
const cardioSub: Record<string, number> = {};
const cfgs: { tag: string; cfg: any }[] = [{ tag: 'HALF_MANNY', cfg: clone(fixtures.HALF_MANNY) }]
  .concat(LATTICE.FULL.map((c: any) => ({ tag: c.tag, cfg: { ...clone(fixtures.HALF_MANNY), ...c.over } })));
for (const { cfg } of cfgs) {
  const p = A.buildProgram(clone(cfg));
  p.cfg = cfg;
  t.progs++;
  for (const wk of Object.keys(p.weeks)) for (const dk of DAYS) {
    const day = p.weeks[wk][dk];
    if (!day || day.rest) continue;
    t.days++;
    const secs = day.sections || [];
    if (secs.length) t.liftDays++;
    if (day.cardio) {
      t.cardioDays++;
      const st = String(day.cardio.type || '?') + (day.cardio.subtype ? ':' + day.cardio.subtype : '');
      cardioSub[st] = (cardioSub[st] || 0) + 1;
      if (secs.length) t.hybrid++; else t.cardioOnly++;
    }
    secs.forEach((sec: any, si: number) => (sec.items || []).forEach((it: any, ii: number) => {
      const f = flags(sec, ii, it);
      if (f.isNote) return;
      t.items++;
      if (f.canSkip) t.itemsSkippable++; else t.itemsLocked++;
      if (!f.isMainSlot) return;
      t.mainSlots++;
      if (f.canSkip) t.mainSkippable++;
      if (!f.canSwap) t.mainNoSwapBtn++;
      const c = swapCands(it.name, day, +wk, p);
      const n = (!c.pattern && auxFam(it.name)) ? auxCands(it.name, day, p).length : c.tier1.length + c.tier2.length;
      if (!n) { t.mainNoCands++; noCandNames[it.name] = (noCandNames[it.name] || 0) + 1; }
    }));
  }
}
out('PART A — the census. Programs ' + t.progs + ' (HALF_MANNY + lattice FULL ' + LATTICE.FULL.length + '), training days ' + t.days);
out('  exercise cards (notes excluded) ' + t.items + ': skippable ' + t.itemsSkippable + ', locked ' + t.itemsLocked);
out('  main slots ' + t.mainSlots + ' (one per lift day: ' + t.liftDays + ' days with sections)');
out('    skippable ' + t.mainSkippable + ' of ' + t.mainSlots);
out('    no swap button ' + t.mainNoSwapBtn + ' of ' + t.mainSlots + ', swap sheet empty ' + t.mainNoCands + ' of ' + t.mainSlots
  + (t.mainNoCands ? ' ' + JSON.stringify(noCandNames) : ''));
out('  days with a cardio card ' + t.cardioDays + ': cardio only ' + t.cardioOnly + ', cardio plus lifting ' + t.hybrid
  + ' (no control on any cardio card: ' + t.cardioDays + ' of ' + t.cardioDays + ')');
out('  cardio cards by type:subtype ' + JSON.stringify(Object.fromEntries(Object.entries(cardioSub).sort((a, b) => b[1] - a[1]))));

// ── Part B ──────────────────────────────────────────────────────────────────
const X = loadApp({ dom: true }) as any;
const cfg = clone(fixtures.HALF_MANNY);
X.ctx.__P = Object.assign(X.buildProgram(clone(cfg)), { cfg });
X.eval("activeProg=__P;activeProgId='P1';currentWeek=1;");
const pools = X.eval('RAND_POOLS');
const all: any[] = [];
const seen = new Set<string>();
for (const k of Object.keys(pools)) for (const w of pools[k]) if (!seen.has(w.title)) { seen.add(w.title); all.push(w); }
const res = { taps: 0, toast: 0, wrong: 0, right: 0, skipBtns: 0, skipHitsProgram: 0, skipNoop: 0 };
const wrongEx: string[] = [];
const skipEx: string[] = [];
const dayShape: string[] = [];
for (const dk of DAYS) {
  X.eval("currentDayKey='" + dk + "'");
  const pday = X.ctx.__P.weeks[1][dk];
  const pnames = new Set<string>();
  ((pday && pday.sections) || []).forEach((s: any) => (s.items || []).forEach((it: any) => it && pnames.add(it.name)));
  dayShape.push(dk + (pday && pday.rest ? ' rest' : ' ' + ((pday && pday.sections) || []).length + ' sections'));
  for (const w of all) {
    // The Wildcard's own draw from v0.246.0 on (D250: _setWildDraw, and the sections drawn with src 'wild'), the pool's
    // sections before it. Each button is replayed with the arguments it carries.
    const wild = X.eval("typeof _setWildDraw==='function'");
    if (wild) X.eval('_setWildDraw')(w);
    const html = String(wild ? X.eval("buildSectionsHTML(_wildDraw.sections,0,'wild')") : X.eval('buildSectionsHTML')(w.sections));
    const swaps = [...html.matchAll(/openSwapSheet\((\d+),(\d+)((?:,'wild')?)\)/g)].map(m => [+m[1]!, +m[2]!, m[3]!] as const);
    for (const [si, ii, sa] of swaps) {
      const want = w.sections[si].items[ii].name;
      X.eval("document.getElementById('swapOutName').textContent='';_swapCtx=null;openSwapSheet(" + si + ',' + ii + sa + ')');
      res.taps++;
      const got = String(X.eval("document.getElementById('swapOutName').textContent") || '');
      if (!got) res.toast++;
      else if (got === want) res.right++;
      else { res.wrong++; if (wrongEx.length < 6) wrongEx.push(dk + ': "' + w.title + '" tap on ' + want + ' opens the sheet for ' + got); }
      X.eval('closeSwapSheet()');
    }
    const skips = [...html.matchAll(/skipExercise\('((?:[^'\\]|\\.)*)'((?:,'wild')?)\)/g)].map(m => [m[1]!.replace(/\\'/g, "'"), m[2]!] as const);
    for (const [nm, sa] of skips) {
      res.skipBtns++;
      // Tapped for real: does the program day's card of that name come off?
      const before = JSON.stringify(X.ctx.__P.weeks[1][dk]);
      X.ctx.__nm = nm;
      X.eval("skipExercise(__nm" + sa + ")");
      const hit = JSON.stringify(X.ctx.__P.weeks[1][dk]) !== before;
      X.eval("unskipExercise(__nm" + sa + ")");
      if (hit) { res.skipHitsProgram++; if (skipEx.length < 6) skipEx.push(dk + ': "' + w.title + '" minus on ' + nm + ' strikes ' + nm + ' off the program day'); }
      else res.skipNoop++;
    }
  }
}
const css = String(X.html);
const zOf = (sel: RegExp) => ((css.match(sel) || [])[1] || '?');
out('');
out('PART B — the Wildcard. Workouts ' + all.length + ' (every title in RAND_POOLS), HALF_MANNY week 1, session sheet last on each weekday');
out('  week 1: ' + dayShape.join(', '));
out('  swap taps ' + res.taps + ' (' + all.length + ' workouts x 7 weekdays, every card with a swap button)');
out('    sheet names the tapped card ' + res.right + ', sheet names another exercise ' + res.wrong + ', toast "Nothing to swap here" ' + res.toast);
for (const e of wrongEx) out('      ' + e);
const zSwap = +(zOf(/#swapOverlay\{[^}]*z-index:(\d+)/) !== '?' ? zOf(/#swapOverlay\{[^}]*z-index:(\d+)/) : zOf(/\.overlay\{[^}]*z-index:(\d+)/));
const zRand = +zOf(/\.rand-overlay\{[^}]*z-index:(\d+)/);
out('  the swap sheet (#swapOverlay) z-index ' + zSwap + ', the Wildcard (.rand-overlay) z-index ' + zRand
  + ': the sheet opens ' + (zSwap > zRand ? 'above' : 'under') + ' the Wildcard');
out('  minus taps ' + res.skipBtns + ': strike a same-named card off the program day ' + res.skipHitsProgram + ', do nothing ' + res.skipNoop);
for (const e of skipEx) out('      ' + e);
